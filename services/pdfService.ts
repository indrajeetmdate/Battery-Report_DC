
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
    const margin = 15;

    const logoResult = await loadImage(LOGO_URL);
    const stampResult = await loadImage(STAMP_URL);

    // Generate QR Code
    let qrCodeDataUrl = "";
    try {
        qrCodeDataUrl = await QRCode.toDataURL(data.fileName, { width: 100, margin: 0 });
    } catch (e) {
        console.warn("Failed to generate QR code", e);
    }

    // --- Header Function ---
    const addHeader = () => {
        const headerY = 10;
        const logoHeight = 12;

        // 1. Logo
        if (logoResult) {
            const logoWidth = logoHeight * (logoResult.width / logoResult.height);
            doc.addImage(logoResult.data, 'PNG', margin, headerY, logoWidth, logoHeight);
        } else {
            doc.setTextColor(COLORS.primary);
            doc.setFontSize(14);
            doc.setFont("helvetica", "bold");
            doc.text("DC ENERGY", margin, headerY + 8);
        }

        // 2. Title
        doc.setTextColor(COLORS.text);
        doc.setFontSize(22);
        doc.setFont("helvetica", "normal");
        const title = "Cnercell LFP series";
        doc.text(title, margin + 40, headerY + 8);

        // Line
        const lineY = headerY + logoHeight + 5;
        doc.setDrawColor(COLORS.secondary);
        doc.setLineWidth(0.5);
        doc.line(margin, lineY, pageWidth - margin, lineY);

        return lineY;
    };

    // --- Style Helpers ---
    const sharedTableOptions = {
        theme: 'grid' as const,
        headStyles: {
            fillColor: [51, 51, 51],
            textColor: [255, 255, 255],
            fontStyle: 'bold' as 'bold',
            halign: 'left' as 'left',
            valign: 'middle' as 'middle',
            minCellHeight: 10,
            fontSize: 10
        },
        bodyStyles: {
            textColor: COLORS.text,
            fontSize: 10,
            cellPadding: 3,
            valign: 'middle' as 'middle',
            lineColor: [200, 200, 200],
            lineWidth: 0.1
        },
        columnStyles: {
            // Column 0: Light Green Background
            0: { width: 80, fillColor: [237, 247, 224] },
            // Column 1: White Background (Explicitly set to override any alternates)
            1: { fillColor: [255, 255, 255] }
        },
        margin: { left: margin, right: margin }
    };

    // ================= PAGE 1 =================
    let yPos = addHeader();
    yPos += 15;

    // 1. PRODUCT OVERVIEW
    doc.setFontSize(16);
    doc.setTextColor(COLORS.text);
    doc.setFont("helvetica", "normal");
    doc.text(`1. Product Overview: `, margin, yPos);

    doc.setTextColor(COLORS.primary);
    doc.setFont("helvetica", "bold");
    doc.text(data.fileName, margin + 55, yPos);
    yPos += 10;

    const energy = (specs.nominalVoltage * specs.ratedCapacity).toFixed(0);
    const specData = [
        ["Battery Chemistry", specs.chemistry],
        ["Cells", specs.cellType || "32700"],
        ["Nominal Voltage", `${specs.nominalVoltage} V`],
        ["Application", "2W EV / 3W EV / Solar Street Light"],
        ["Configuration", `${specs.series}S ${specs.parallel}P`],
        ["Nominal Capacity", `${specs.ratedCapacity} Ah`],
        ["Usable Energy", `${energy} Wh`],
        ["Maximum Continuous\nDischarge (Charge) Current", "1C (0.5C)"],
        ["Charging", "CC-CV"],
        ["Terminal Type", "Spot Welded Nickel / M6 Bolted"],
        ["Dimensions", "(L) x (W) x (H) mm"],
        ["Weight", "numeric entry kg"],
        ["Cycle Life (80% DOD)", `${specs.ratedLifeCycle} Cycles`],
        ["Warranty Period", specs.warrantyPeriod + " *"],
    ];

    autoTable(doc, {
        startY: yPos,
        head: [['Parameter', 'Value']],
        body: specData,
        ...sharedTableOptions
    });

    // Page 1 Footer Note
    const finalY = (doc as any).lastAutoTable.finalY + 10;
    doc.setFontSize(8);
    doc.setFont("helvetica", "italic");
    doc.setTextColor(COLORS.accent);
    doc.text(`* Life at 25°C, 0.5C charge/discharge\n** Terms and Conditions apply`, margin, finalY);

    // QR Code (Top Right Page 1)
    if (qrCodeDataUrl) {
        doc.addImage(qrCodeDataUrl, 'PNG', pageWidth - margin - 20, 5, 20, 20);
    }

    // Footer Link P1
    doc.setFont("helvetica", "normal");
    doc.text("www.cnergy.co.in", margin, pageHeight - 10);
    doc.text("info@cnergy.co.in", pageWidth - margin - 30, pageHeight - 10);


    // ================= PAGE 2: Graphics & Summary =================
    doc.addPage();
    yPos = 15;

    // 2. PERFORMANCE GRAPHICS
    doc.setFontSize(16);
    doc.setTextColor(COLORS.text);
    doc.setFont("helvetica", "normal");
    doc.text("2. Performance Graphics", margin, yPos);
    yPos += 10;

    // Charts (2x2)
    const chartWidth = (pageWidth - (margin * 2.5)) / 2;
    const chartHeight = 55;
    let chartBottomY = yPos;

    for (let i = 0; i < chartElementIds.length; i++) {
        const el = document.getElementById(chartElementIds[i]);
        if (el) {
            try {
                const canvas = await html2canvas(el, { scale: 2 });
                const imgData = canvas.toDataURL('image/png');

                const col = i % 2;
                const row = Math.floor(i / 2);

                const x = margin + (col * (chartWidth + margin / 2));
                const y = yPos + (row * (chartHeight + 10));

                doc.addImage(imgData, 'PNG', x, y, chartWidth, chartHeight);

                if (i === chartElementIds.length - 1) {
                    chartBottomY = y + chartHeight + 15;
                }
            } catch (e) {
                console.error("Chart capture failed", e);
            }
        }
    }

    yPos = chartBottomY;

    // 3. TEST SUMMARY (Moved to Page 2)
    if (data.loopSummary.length > 0) {
        doc.setFontSize(16);
        doc.setTextColor(COLORS.text);
        doc.setFont("helvetica", "normal");
        doc.text("3. Test Summary", margin, yPos);
        yPos += 6;

        const excludedTerms = ['capacity attenuation', 'charge and discharge efficiency', 'device id', 'cycle number'];
        const loopBody = data.loopSummary
            .filter(l => !excludedTerms.some(term => l.metric.toLowerCase().includes(term)))
            .map(l => [l.metric, l.value]);

        autoTable(doc, {
            startY: yPos,
            head: [['Metric', 'Result']],
            body: loopBody,
            ...sharedTableOptions
        });
    }

    // Footer Link P2
    doc.setFontSize(8);
    doc.setTextColor(COLORS.accent);
    doc.text("www.cnergy.co.in", margin, pageHeight - 10);


    // ================= PAGE 3: Features & Protection =================
    doc.addPage();
    yPos = 15;

    // 4. NOTABLE FEATURES
    doc.setFontSize(16);
    doc.setTextColor(COLORS.text);
    doc.setFont("helvetica", "normal");
    doc.text("4. Notable Features", margin, yPos);
    yPos += 8;

    const features = [
        "High lifespan: > 2000 cycles",
        "Deep discharge allowed up to 100%",
        "Ultra safe Lithium Iron Phosphate chemistry (no thermal run-away)",
        "Embedded BMS (Battery Management System)",
        "No Lead, no rare earths, no acid, no degassing",
        "Excellent temperature robustness (-20 °C up to +60 °C)",
        "Flexible deployment: Used by packs in parallel",
        "Very low self discharge (<3 % per month)",
        "Lead-acid Comparison: About 50 % lighter, 40% smaller"
    ];

    doc.setFontSize(10);
    doc.setTextColor(COLORS.text);
    features.forEach(feat => {
        doc.text(`• ${feat}`, margin + 5, yPos);
        yPos += 5;
    });
    yPos += 10;

    // 5. PROTECTION PARAMETERS
    doc.setFontSize(16);
    doc.text("5. Protection Parameters", margin, yPos);
    yPos += 8;

    // Logic for Protection Values
    // LFP: Charge Max ~3.75V/cell, Discharge Min ~2.2V/cell
    // NMC: Charge Max ~4.25V/cell, Discharge Min ~2.8V/cell
    const isLFP = specs.chemistry === 'LFP';
    const overChargePerCell = isLFP ? 3.75 : 4.25;
    const overDischargePerCell = isLFP ? 2.2 : 2.8;

    const totalOverCharge = (overChargePerCell * specs.series).toFixed(1);
    const totalOverDischarge = (overDischargePerCell * specs.series).toFixed(1);

    const ratedCurrent = specs.ratedCapacity; // Assume 1C
    const protectionCurrent = (ratedCurrent * 1.0).toFixed(0);
    const chargeCurrent = (ratedCurrent * 0.5).toFixed(0);

    const protectionData = [
        ["Protection Function", "Threshold/Specification"], // Header row embedded or use Head
        ["Overcharge Protection (Pack)", `${totalOverCharge}±0.2V`],
        ["Over-discharge Protection (Pack)", `${totalOverDischarge}±0.2V`],
        ["Short Circuit Protection", "Yes"],
        ["Over-current Discharge (charge)", `${protectionCurrent}A (${chargeCurrent}A)`],
        ["Charge Temperature Range", "0°C to 45°C"],
        ["Discharge Temperature Range", "-20°C to 60°C"],
        ["Optimal Storage Temperature", "15°C to 35°C"],
        ["Cell Balancing", "Yes (Passive)"]
    ];

    // Remove first row from data for autoTable head
    const pBody = protectionData.slice(1);

    autoTable(doc, {
        startY: yPos,
        head: [['Protection Function', 'Threshold/Specification']],
        body: pBody,
        ...sharedTableOptions
    });

    yPos = (doc as any).lastAutoTable.finalY + 15;

    // 6. CUSTOMISATION
    doc.setFontSize(16);
    doc.text("6. Customisation", margin, yPos);
    yPos += 8;

    doc.setFontSize(10);
    const customText = doc.splitTextToSize(
        "A range of customisation options are available to suit unique requirements. " +
        "Customers may select the integration of a smart BMS with advanced monitoring " +
        "(e.g. Bluetooth, RS485/CAN support, app connectivity), system displays for real-time status, " +
        "or bespoke enclosure modifications. These upgrades are provided at additional cost and can " +
        "be tailored to specific project needs in consultation with our technical team.",
        pageWidth - (margin * 2)
    );
    doc.text(customText, margin, yPos);


    // Final Footer with Stamp and Warranty
    const footerY = pageHeight - 40;

    doc.setFontSize(10);
    doc.setTextColor(COLORS.primary);
    doc.setFont("helvetica", "bold");
    doc.text("Warranty Statement:", margin, footerY);

    doc.setFontSize(9);
    doc.setTextColor(COLORS.text);
    doc.setFont("helvetica", "normal");
    doc.text(`${specs.warrantyPeriod} standard limited warranty applies to this product.\nSee full terms at www.cnergy.co.in`, margin, footerY + 6);

    if (stampResult) {
        const stampSize = 30;
        doc.addImage(stampResult.data, 'PNG', pageWidth - margin - stampSize - 10, footerY - 5, stampSize, stampSize);
    } else {
        doc.text("[Authorized QC Stamp]", pageWidth - margin - 50, footerY + 10);
    }

    doc.save(`${data.fileName || 'Battery_Report'}.pdf`);
};

