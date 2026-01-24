import * as XLSX from 'xlsx';
import { ProcessedData, DataPoint, LogEntry, LoopSummary } from '../types';

// Helper to clean "spaced out" text often found in these reports (e.g. "s t e p" -> "step")
const cleanKey = (text: string): string => {
  return text.replace(/\s+/g, '').toLowerCase();
};

const formatPhase = (raw: string): string => {
  const cleaned = cleanKey(raw);
  const map: Record<string, string> = {
    'resetend': 'Reset End',
    'chargeend': 'Charge End',
    'dischargeend': 'Discharge End',
  };
  return map[cleaned] || raw.trim();
};

const formatExitCondition = (raw: string): string => {
  const cleaned = cleanKey(raw);
  const map: Record<string, string> = {
    'endofmeasurementtime': 'End of measurement time',
    'protectionacquisition': 'Protection acquisition',
    'dischargecellvoltageislessthanthecut-offvoltage': 'Voltage < Cut-off',
    'capacityisarrived': 'Capacity arrived',
  };
  // Fuzzy fallback for "less than cut-off"
  if (cleaned.includes('lessthan') && cleaned.includes('cut-off')) return 'Voltage < Cut-off';
  return map[cleaned] || raw.trim();
};

const formatExitPhase = (raw: string): string => {
  const cleaned = cleanKey(raw);
  const map: Record<string, string> = {
    'pre-inspectionstage': 'Pre-inspection',
    'constantpressurestage': 'Constant pressure',
    'constantcurrentstage': 'Constant current',
    'outputcurrentstage': 'Output current'
  };
  return map[cleaned] || raw.trim().replace(/stage$/i, '');
};

const parseLogDetail = (raw: string): LogEntry => {
  // Normalize the separator to a pipe for easier splitting. 
  // The input often uses 'ÿ' (ASCII 255) as a newline/separator.
  const normalized = raw.replace(/ÿ/g, '|').replace(/\n/g, '|');
  const parts = normalized.split('|');

  let step = '';
  let phase = '';
  let voltage = '';
  let capacity = '—';
  let exitCondition = '';
  let exitPhase = '';

  // Regex patterns to match spaced-out keys
  const patterns = {
    step: /s\s*t\s*e\s*p\s*([\d-]+)/i,
    voltage: /v\s*o\s*l\s*t\s*a\s*g\s*e\s*([\d.]+)\s*V?/i,
    capacity: /c\s*a\s*p\s*a\s*c\s*i\s*t\s*y\s*([-\d.]+)\s*m?A/i,
    exitInfo: /e\s*x\s*i\s*t\s*i\s*n\s*f\s*o\s*r?m\s*a\s*t\s*i\s*o\s*n\s*(.*)/i,
    exitPhase: /e\s*x\s*i\s*t\s*p\s*h\s*a\s*s\s*e\s*(.*)/i,
  };

  // The first part is usually the Phase Type e.g. "[ 1 ] r e s e t e n d"
  if (parts.length > 0) {
    // Extract text after [number]
    const phaseMatch = parts[0].match(/\[\s*\d+\s*\]\s*(.*)/);
    if (phaseMatch) {
      phase = formatPhase(phaseMatch[1]);
    } else {
      phase = formatPhase(parts[0]);
    }
  }

  for (const part of parts) {
    const p = part.trim();
    if (!p) continue;

    const stepMatch = p.match(patterns.step);
    if (stepMatch) step = stepMatch[1].replace(/\s/g, '');

    const voltMatch = p.match(patterns.voltage);
    if (voltMatch) voltage = voltMatch[1].replace(/\s/g, '');

    const capMatch = p.match(patterns.capacity);
    if (capMatch) {
        // Format capacity with commas if needed, but for now just raw number string
        const val = parseFloat(capMatch[1].replace(/\s/g, ''));
        capacity = val.toLocaleString('en-US'); 
    }

    const infoMatch = p.match(patterns.exitInfo);
    if (infoMatch) exitCondition = formatExitCondition(infoMatch[1]);

    const exitMatch = p.match(patterns.exitPhase);
    if (exitMatch) exitPhase = formatExitPhase(exitMatch[1]);
  }

  return { step, phase, voltage, capacity, exitCondition, exitPhase };
};

export const parseExcelFile = async (file: Blob | File, fileNameOverride?: string): Promise<ProcessedData> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });

        // 1. Extract Time Series Data ("The test data")
        let dataSheetName = workbook.SheetNames.find(n => n.toLowerCase().includes('data')) || workbook.SheetNames[0];
        if (workbook.SheetNames.includes("The test data")) {
          dataSheetName = "The test data";
        }

        const dataSheet = workbook.Sheets[dataSheetName];
        const rawData = XLSX.utils.sheet_to_json<any>(dataSheet);

        const timeSeries: DataPoint[] = rawData.map((row: any, index: number) => {
          const duration = row['Duration'] || row['Time'] || index;
          const voltage = row['Voltage'] || row['Volt'] || row['V'] || 0;
          const current = row['Current'] || row['Amp'] || row['A'] || 0;
          const capacity = row['Capacity'] || row['Ah'] || row['Cap'] || 0;
          const temperature = row['T'] || row['Temp'] || row['Temperature'] || 25;

          return {
            duration: typeof duration === 'string' ? parseFloat(duration) : duration,
            voltage: Number(voltage),
            current: Number(current),
            capacity: Number(capacity),
            temperature: Number(temperature),
          };
        }).filter(d => !isNaN(d.voltage));

        // 2. Extract Logs ("Logo" sheet)
        let logSheetName = "Logo";
        let logs: LogEntry[] = [];
        
        if (workbook.SheetNames.includes(logSheetName)) {
           const logSheet = workbook.Sheets[logSheetName];
           const rawLogs = XLSX.utils.sheet_to_json<any>(logSheet);
           logs = rawLogs.map((row: any) => {
             const detail = row['Log:'] || row['Log'] || Object.values(row)[0] as string;
             return parseLogDetail(String(detail));
           }).filter(l => l.step || l.phase); // Filter out empty parses
        }

        // 3. Extract Loop Detail
        let loopSheetName = "Loop Detail";
        let loopSummary: LoopSummary[] = [];

        if (workbook.SheetNames.includes(loopSheetName)) {
          const loopSheet = workbook.Sheets[loopSheetName];
          const rawLoop = XLSX.utils.sheet_to_json<any>(loopSheet);
          if (rawLoop.length > 0) {
             const firstRow = rawLoop[0];
             Object.keys(firstRow).forEach(key => {
                loopSummary.push({
                    metric: key,
                    value: firstRow[key]
                });
             });
          }
        }

        // Mock data if empty
        if (timeSeries.length === 0) {
            console.warn("No valid time series data found. Using mock data.");
            for(let i=0; i<100; i++) {
                timeSeries.push({
                    duration: i,
                    voltage: 12 + Math.sin(i/10),
                    current: 5 + Math.cos(i/10),
                    capacity: i * 0.5,
                    temperature: 25 + (i/20)
                });
            }
        }

        // Determine filename
        let finalName = fileNameOverride || "Unknown_File";
        if (file instanceof File && !fileNameOverride) {
            finalName = file.name;
        }
        finalName = finalName.replace(/\.[^/.]+$/, "");

        resolve({
          fileName: finalName,
          timeSeries,
          logs,
          loopSummary
        });

      } catch (error) {
        reject(error);
      }
    };

    reader.onerror = (error) => reject(error);
    reader.readAsBinaryString(file);
  });
};