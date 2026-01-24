
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import html2canvas from 'html2canvas';
import QRCode from 'qrcode';
import { BatterySpecs, ProcessedData } from '../types';
import { COLORS, LOGO_URL, STAMP_URL } from '../constants';

// Helper to load image and get dimensions
const loadImage = (url: string): Promise<{ data: string, width: number, height: number } | null> => {
    return new Promise((resolve) => {
        const img = new Image();
        img.crossOrigin = 'Anonymous';
        img.src = url;
        img.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext('2d');
            ctx?.drawImage(img, 0, 0);
            resolve({
                data: canvas.toDataURL('image/png'),
                width: img.width,
                height: img.height
            });
        };
        img.onerror = () => {
             console.warn(`Failed to load image: ${url}`);
             resolve(null);
        }
    });
};

export const generatePDF = async (
  specs: BatterySpecs,
  data: ProcessedData,
  chartElementIds: string[]
) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 15; // Slightly increased margin for cleaner look

  const logoResult = await loadImage(LOGO_URL);
  const stampResult = await loadImage(STAMP_URL);
  
  // Generate QR Code
  let qrCodeDataUrl = "";
  try {
      qrCodeDataUrl = await QRCode.toDataURL(data.fileName, { width: 100, margin: 0 });
  } catch (e) {
      console.warn("Failed to generate QR code", e);
  }

  // --- Header Function (Reusable if needed) ---
  const addHeader = (titleSuffix: string = "") => {
    const headerY = 10;
    const logoHeight = 12;

    // 1. Logo (Left)
    if (logoResult) {
        const logoWidth = logoHeight * (logoResult.width / logoResult.height);
        doc.addImage(logoResult.data, 'PNG', margin, headerY, logoWidth, logoHeight);
    } else {
        doc.setTextColor(COLORS.primary);
        doc.setFontSize(14);
        doc.setFont("helvetica", "bold");
        doc.text("DC ENERGY", margin, headerY + 8);
    }

    // 2. Title Text (Right of Logo or Centered)
    doc.setTextColor(COLORS.text);
    doc.setFontSize(22);
    doc.setFont("helvetica", "normal");
    const title = "Cnercell LFP series";
    doc.text(title, margin + 40, headerY + 8);

    // Line separator
    const lineY = headerY + logoHeight + 5;
    doc.setDrawColor(COLORS.secondary);
    doc.setLineWidth(0.5);
    doc.line(margin, lineY, pageWidth - margin, lineY);

    return lineY;
  };

  // ================= PAGE 1: Product Overview =================
  let yPos = addHeader();
  yPos += 15;

  // Title: "1. Product Overview: [Product Name]"
  doc.setFontSize(16);
  doc.setTextColor(COLORS.text);
  doc.setFont("helvetica", "normal");
  doc.text(`1. Product Overview: `, margin, yPos);
  
  doc.setTextColor(COLORS.primary);
  doc.setFont("helvetica", "bold");
  doc.text(data.fileName, margin + 55, yPos); // Approx offset
  yPos += 10;

  // Table Styling to Match Reference Image
  // Header: Dark Grey (#333), White Text
  // Rows: Alternating Light Green (#EDF7E0) and White
  
  const specData = [
    ["Battery Chemistry", specs.chemistry],
    ["Nominal Voltage", `${specs.nominalVoltage} V`],
    ["Cells", "32140 / 32700 / 21700 / 18650 / 100 Ah"], // Placeholder to match style
    ["Application", "2W EV / 3W EV / Solar Street Light"], // Placeholder
    ["Rated Capacity", `${specs.ratedCapacity} Ah`],
    ["Configuration", "Custom"], // Placeholder
    ["Usable Energy", `${(specs.nominalVoltage * specs.ratedCapacity).toFixed(0)} Wh`],
    ["Charging", "CC-CV"],
    ["Maximum Continuous\nDischarge (Charge) Current", "1C (0.5C)"],
    ["Rated Life Cycle", `${specs.ratedLifeCycle} Cycles`],
    ["BMS Type", specs.bms],
    ["Warranty Period", specs.warrantyPeriod + " *"],
  ];

  autoTable(doc, {
    startY: yPos,
    head: [['Parameter', 'Value']],
    body: specData,
    theme: 'grid',
    headStyles: { 
        fillColor: [51, 51, 51], // Dark Grey/Black like the image
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        halign: 'left',
        valign: 'middle',
        minCellHeight: 10,
        fontSize: 10
    },
    bodyStyles: {
        textColor: COLORS.text, 
        fontSize: 10,
        cellPadding: 3,
        valign: 'middle',
        lineColor: [200, 200, 200],
        lineWidth: 0.1
    },
    alternateRowStyles: {
        fillColor: [237, 247, 224] // Light Green similar to image
    },
    columnStyles: { 
        0: { width: 80, fillColor: [237, 247, 224] }, // First col also green in image? 
        // Actually the image usually has green first col or green alternating rows. 
        // Prompt says "copy the style... alternating rows". 
        // Let's stick to standard alternating rows for the whole row as it reads better usually, 
        // OR if the image had a specific Green Column 1, White Column 2... 
        // The prompt description "Row 1 (Battery Chemistry): Light Green..." implies ROW styling.
    },
    // Resetting first col fill to respect alternateRowStyles properly if strictly row alternating
    // If we want the "Green first column" look, we'd hardcode it, but "Alternating" suggests rows.
    // We will stick to row alternating which is robust.
    margin: { left: margin, right: margin }
  });

  // Footer Note
  const finalY = (doc as any).lastAutoTable.finalY + 10;
  doc.setFontSize(8);
  doc.setFont("helvetica", "italic");
  doc.setTextColor(COLORS.accent);
  doc.text(`* Life at 25°C, 0.5C charge/discharge\n** Terms and Conditions apply`, margin, finalY);

  // Bottom Branding/URL
  doc.setFont("helvetica", "normal");
  doc.text("www.cnergy.co.in", margin, pageHeight - 10);
  doc.text("info@cnergy.co.in", pageWidth - margin - 30, pageHeight - 10);


  // ================= PAGE 2: Performance Graphics =================
  doc.addPage();
  yPos = 15; // Reset Top

  // Title
  doc.setFontSize(16);
  doc.setTextColor(COLORS.text);
  doc.setFont("helvetica", "normal");
  doc.text("2. Performance Graphics", margin, yPos);
  yPos += 10;

  // Capture charts
  // We want to fit 4 charts: 2x2 grid
  const chartWidth = (pageWidth - (margin * 2.5)) / 2;
  const chartHeight = 60; // Larger charts for full page

  for (let i = 0; i < chartElementIds.length; i++) {
    const el = document.getElementById(chartElementIds[i]);
    if (el) {
      try {
        const canvas = await html2canvas(el, { scale: 2 });
        const imgData = canvas.toDataURL('image/png');
        
        const col = i % 2; // 0 or 1
        const row = Math.floor(i / 2); // 0 or 1

        const x = margin + (col * (chartWidth + margin/2));
        const y = yPos + (row * (chartHeight + 10));
        
        doc.addImage(imgData, 'PNG', x, y, chartWidth, chartHeight);
      } catch (e) {
        console.error("Chart capture failed", e);
      }
    }
  }


  // ================= PAGE 3: Test Summary =================
  doc.addPage();
  yPos = 15;

  doc.setFontSize(16);
  doc.setTextColor(COLORS.text);
  doc.setFont("helvetica", "normal");
  doc.text("3. Test Summary", margin, yPos);
  yPos += 10;

  if (data.loopSummary.length > 0) {
      const excludedTerms = ['capacity attenuation', 'charge and discharge efficiency', 'device id', 'cycle number'];
      const loopBody = data.loopSummary
          .filter(l => !excludedTerms.some(term => l.metric.toLowerCase().includes(term)))
          .map(l => [l.metric, l.value]);

      autoTable(doc, {
          startY: yPos,
          head: [['Metric', 'Result']],
          body: loopBody,
          theme: 'grid',
          headStyles: { 
              fillColor: [51, 51, 51], 
              textColor: [255, 255, 255],
              fontStyle: 'bold',
              minCellHeight: 10,
              fontSize: 10
          },
          bodyStyles: {
              textColor: COLORS.text, 
              fontSize: 10,
              cellPadding: 3,
              lineColor: [200, 200, 200],
              lineWidth: 0.1
          },
          alternateRowStyles: {
              fillColor: [237, 247, 224] 
          },
          columnStyles: { 0: { fontStyle: 'bold', width: 100 } },
          margin: { left: margin, right: margin }
      });
  }

  // Final Footer with Stamp and Warranty
  const footerY = pageHeight - 40;
  
  // Warranty Text
  doc.setFontSize(10);
  doc.setTextColor(COLORS.primary);
  doc.setFont("helvetica", "bold");
  doc.text("Warranty Statement:", margin, footerY);
  
  doc.setFontSize(9);
  doc.setTextColor(COLORS.text);
  doc.setFont("helvetica", "normal");
  doc.text(`${specs.warrantyPeriod} standard limited warranty applies to this product.\nSee full terms at www.cnergy.co.in`, margin, footerY + 6);
  
  // Stamp
  if (stampResult) {
      const stampSize = 30;
      doc.addImage(stampResult.data, 'PNG', pageWidth - margin - stampSize - 10, footerY - 5, stampSize, stampSize);
  } else {
     // Fallback text if stamp missing
     doc.text("[Authorized QC Stamp]", pageWidth - margin - 50, footerY + 10);
  }
  
  // QR Code on last page? Or just Keep on page 1?
  // User didn't specify, but Page 1 is best for QR. We essentially removed it from Page 1 header in the refactor 
  // to match the "Cnercell LFP" style header which didn't show a QR in the description.
  // Let's add the QR back to Page 1 Top Right if it fits the "Image Style".
  // The image header usually has logo left, text center/right. 
  // Let's pop the QR on the first page top right just in case.
  
  doc.setPage(1);
  if (qrCodeDataUrl) {
      doc.addImage(qrCodeDataUrl, 'PNG', pageWidth - margin - 20, 5, 20, 20);
  }

  doc.save(`${data.fileName || 'Battery_Report'}.pdf`);
};

