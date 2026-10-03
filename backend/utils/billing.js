let PDFDocument = null;
try {
  PDFDocument = require("pdfkit");
} catch (e) {
  console.warn(
    "pdfkit module not installed, PDF generation will use fallback or require installation.",
  );
}
const XLSX = require("xlsx");

/**
 * Calculate shipment charges based on weight, dimensions, priority, and extras.
 *
 * Rules:
 * - Volumetric Weight = (length * width * height) / 5000 (in cm -> kg)
 * - Chargeable Weight = max(actualWeight, volumetricWeight)
 * - Base Freight: min ₹150 for first 1kg, then ₹40/kg thereafter
 * - Priority Surcharges:
 *     Standard: 0%
 *     Express: +30% of base freight
 *     Same Day: +70% of base freight
 *     Overnight: +100% of base freight
 * - Handling fee: ₹25 per package unit (min 1)
 * - Fuel surcharge: 5% of base freight
 * - Distance charge: ₹2/km if distanceKm provided
 * - Tax rate: default 18% GST
 */
function calculateShipmentCharges(data = {}) {
  const packageCount = Math.max(1, parseInt(data.packageCount) || 1);
  const actualWeight = Math.max(
    0,
    parseFloat(data.totalWeight || data.weight) || 0,
  );

  const length = Math.max(
    0,
    parseFloat(data.dimensions?.length || data.length) || 0,
  );
  const width = Math.max(
    0,
    parseFloat(data.dimensions?.width || data.width) || 0,
  );
  const height = Math.max(
    0,
    parseFloat(data.dimensions?.height || data.height) || 0,
  );

  const volumetricWeight =
    length > 0 && width > 0 && height > 0
      ? Math.round(((length * width * height) / 5000) * 100) / 100
      : 0;

  const chargeableWeight = Math.max(actualWeight, volumetricWeight, 0.5);

  // Minimum base fee is ₹150 (covers up to 1 kg), then ₹40 per extra kg
  const baseRateMin = 150;
  const ratePerExtraKg = 40;
  const extraWeight = Math.max(0, chargeableWeight - 1);
  const weightCharges = Math.round(extraWeight * ratePerExtraKg * 100) / 100;
  const baseCharges = Math.round((baseRateMin + weightCharges) * 100) / 100;

  // Priority multiplier
  const priority = String(data.priority || "Standard").trim();
  let priorityPercent = 0;
  if (/express/i.test(priority)) priorityPercent = 0.3;
  else if (/same\s*day/i.test(priority)) priorityPercent = 0.7;
  else if (/overnight/i.test(priority)) priorityPercent = 1.0;

  const priorityCharges = Math.round(baseCharges * priorityPercent * 100) / 100;

  // Handling charges: ₹25 per package
  const handlingCharges = packageCount * 25;

  // Fuel surcharge: 5% of base
  const fuelSurcharge = Math.round(baseCharges * 0.05 * 100) / 100;

  // Optional distance charge
  // Optional distance charge
  const distanceKm = Math.max(0, parseFloat(data.distanceKm) || 0);

  // Additional custom charges / items
  const additionalItems = Array.isArray(data.additionalItems)
    ? data.additionalItems
    : Array.isArray(data.items)
    ? data.items
    : [];

  const additionalCharges = Math.max(
    0,
    parseFloat(data.additionalCharges) || 0,
  );

  const systemKeywords = [
    "base freight",
    "priority surcharge",
    "handling fee",
    "fuel surcharge",
    "distance charge",
  ];

  const manualChargesTotal = additionalItems.reduce((sum, item) => {
    const isSystem = systemKeywords.some((sys) =>
      String(item?.description || "").toLowerCase().includes(sys),
    );
    if (isSystem) return sum;
    const quantity = Math.max(1, Number(item.quantity) || 1);
    const unitPrice = Math.max(
      0,
      Number(item.unitPrice ?? item.rate) || 0,
    );
    return sum + quantity * unitPrice;
  }, 0);

  const effectiveAdditionalCharges =
    additionalItems.length > 0 ? manualChargesTotal : additionalCharges;

  const distanceCharges = Math.round(distanceKm * 2 * 100) / 100;

  const subtotal =
    Math.round(
      (baseCharges +
        priorityCharges +
        handlingCharges +
        fuelSurcharge +
        distanceCharges +
        effectiveAdditionalCharges) *
        100,
    ) / 100;

  const taxableAmount = subtotal;

  // Tax rate default
  const parsedTaxRate = parseFloat(data.taxRate);
  const taxRate =
    Number.isFinite(parsedTaxRate) && parsedTaxRate >= 0 ? parsedTaxRate : 18;

  const allInputItems = [
    ...(Array.isArray(data.items) ? data.items : []),
    ...(Array.isArray(data.additionalItems) ? data.additionalItems : []),
    ...(Array.isArray(data.breakdownItems) ? data.breakdownItems : []),
  ];

  const getSystemItemTaxPercent = (keyword, defaultTax) => {
    const matched = allInputItems.find(
      (it) =>
        it &&
        it.description &&
        String(it.description).toLowerCase().includes(keyword.toLowerCase()),
    );
    if (matched) {
      const val = matched.taxPercent ?? matched.taxRate;
      if (
        val !== undefined &&
        val !== null &&
        val !== "" &&
        Number.isFinite(Number(val))
      ) {
        return Number(val);
      }
    }
    return defaultTax;
  };

  const rawBreakdownItems = [
    {
      description: `Base Freight (${chargeableWeight.toFixed(2)} kg chargeable weight)`,
      quantity: 1,
      unit: "Shipment",
      unitPrice: baseCharges,
      amount: baseCharges,
      taxPercent: getSystemItemTaxPercent("base freight", taxRate),
    },
    ...(priorityCharges > 0
      ? [
          {
            description: `Priority Surcharge (${priority})`,
            quantity: 1,
            unit: "Service",
            unitPrice: priorityCharges,
            amount: priorityCharges,
            taxPercent: getSystemItemTaxPercent("priority surcharge", taxRate),
          },
        ]
      : []),
    {
      description: `Handling Fee (${packageCount} package${packageCount > 1 ? "s" : ""})`,
      quantity: packageCount,
      unit: "Package",
      unitPrice: 25,
      amount: handlingCharges,
      taxPercent: getSystemItemTaxPercent("handling fee", taxRate),
    },
    {
      description: "Fuel Surcharge (5%)",
      quantity: 1,
      unit: "Service",
      unitPrice: fuelSurcharge,
      amount: fuelSurcharge,
      taxPercent: getSystemItemTaxPercent("fuel surcharge", taxRate),
    },
    ...(distanceCharges > 0
      ? [
          {
            description: `Distance Charge (${distanceKm} km)`,
            quantity: distanceKm || 1,
            unit: "Km",
            unitPrice:
              distanceKm > 0
                ? Math.round((distanceCharges / distanceKm) * 100) / 100
                : distanceCharges,
            amount: distanceCharges,
            taxPercent: getSystemItemTaxPercent("distance charge", taxRate),
          },
        ]
      : []),
    ...(additionalItems.length > 0
      ? additionalItems
          .filter((item) => {
            const isSystem = systemKeywords.some((sys) =>
              String(item?.description || "").toLowerCase().includes(sys),
            );
            if (isSystem) return false;
            return (
              Number(item.amount ?? item.unitPrice ?? item.rate) > 0 ||
              (Number(item.quantity) || 1) *
                (Number(item.unitPrice ?? item.rate) || 0) >
                0
            );
          })
          .map((item) => {
            const quantity = Math.max(1, Number(item.quantity) || 1);
            const unitPrice = Math.max(
              0,
              Number(item.unitPrice ?? item.rate) || 0,
            );
            const amount = Math.round(quantity * unitPrice * 100) / 100;
            const itemTaxPercent =
              Number.isFinite(Number(item.taxPercent))
                ? Number(item.taxPercent)
                : Number.isFinite(Number(item.taxRate))
                ? Number(item.taxRate)
                : taxRate;

            return {
              description: item.description || "Additional Charge",
              quantity,
              unit: item.unit || "Service",
              unitPrice,
              amount,
              taxPercent: itemTaxPercent,
            };
          })
      : additionalCharges > 0
        ? [
            {
              description: "Additional Charge",
              quantity: 1,
              unit: "Service",
              unitPrice: additionalCharges,
              amount: additionalCharges,
              taxPercent: taxRate,
            },
          ]
        : []),
  ];

  const breakdownItems = rawBreakdownItems.map((item) => {
    const effectiveTaxRate = item.taxPercent ?? taxRate;
    const itemTax =
      Math.round(item.amount * (effectiveTaxRate / 100) * 100) / 100;
    const itemTotal = Math.round((item.amount + itemTax) * 100) / 100;
    return {
      ...item,
      taxRate: effectiveTaxRate,
      taxAmount: itemTax,
      totalAmount: itemTotal,
    };
  });

  const computedTaxAmount = breakdownItems.reduce(
    (acc, it) => acc + (it.taxAmount || 0),
    0,
  );
  const taxAmount = Math.round(computedTaxAmount * 100) / 100;
  const totalAmount = Math.round((subtotal + taxAmount) * 100) / 100;

  return {
    packageCount,
    actualWeight,
    volumetricWeight,
    chargeableWeight,
    baseCharges,
    weightCharges,
    priority,
    priorityCharges,
    handlingCharges,
    fuelSurcharge,
    distanceKm,
    distanceCharges,
    additionalCharges,
    subtotal,
    taxRate,
    taxAmount,
    totalAmount,
    breakdownItems,
  };
}

/**
 * Generate a PDF invoice using PDFKit.
 * Returns a Promise that resolves to a Buffer.
 */
function generateInvoicePDF(invoice, customer = {}, shipment = {}) {
  return new Promise((resolve, reject) => {
    try {
      if (!PDFDocument) {
        return reject(new Error("pdfkit package is not installed on server."));
      }
      const doc = new PDFDocument({ margin: 40, size: "A4" });
      const buffers = [];

      doc.on("data", (chunk) => buffers.push(chunk));
      doc.on("end", () => resolve(Buffer.concat(buffers)));
      doc.on("error", (err) => reject(err));

      const primaryColor = "#1e293b"; // Slate 800
      const accentColor = "#2563eb"; // Blue 600
      const lightGray = "#f1f5f9";
      const borderColor = "#cbd5e1";

      // ── Header ───────────────────────────────────────────────────────────
      doc.rect(40, 40, 515, 60).fill(primaryColor);

      doc
        .fillColor("#ffffff")
        .fontSize(22)
        .font("Helvetica-Bold")
        .text("LOGISTICS MANAGEMENT SYSTEM", 55, 52);

      doc
        .fontSize(10)
        .font("Helvetica")
        .fillColor("#94a3b8")
        .text("Express Freight & Supply Chain Billing Invoice", 55, 78);

      // ── Invoice Meta Bar ──────────────────────────────────────────────────
      let y = 115;
      doc.rect(40, y, 515, 50).fill(lightGray).stroke(borderColor);

      doc.fillColor(primaryColor).fontSize(10).font("Helvetica-Bold");
      doc.text("INVOICE NUMBER", 50, y + 10);
      doc.text("ISSUE DATE", 185, y + 10);
      doc.text("DUE DATE", 310, y + 10);
      doc.text("STATUS", 440, y + 10);

      doc.font("Helvetica").fontSize(10).fillColor("#334155");
      doc.text(invoice.invoiceNumber || "INV-000000", 50, y + 26);
      doc.text(
        invoice.issueDate
          ? new Date(invoice.issueDate).toLocaleDateString("en-IN")
          : "N/A",
        185,
        y + 26,
      );
      doc.text(
        invoice.dueDate
          ? new Date(invoice.dueDate).toLocaleDateString("en-IN")
          : "N/A",
        310,
        y + 26,
      );

      // Status pill color
      const status = (invoice.paymentStatus || "pending").toUpperCase();
      let statusColor = "#f59e0b"; // Amber
      if (status === "PAID")
        statusColor = "#16a34a"; // Green
      else if (status === "OVERDUE")
        statusColor = "#dc2626"; // Red
      else if (status === "CANCELLED") statusColor = "#64748b"; // Slate

      doc
        .font("Helvetica-Bold")
        .fillColor(statusColor)
        .text(status, 440, y + 26);

      // ── Customer & Shipment Info ──────────────────────────────────────────
      y = 180;
      doc.rect(40, y, 250, 110).stroke(borderColor);
      doc.rect(305, y, 250, 110).stroke(borderColor);

      // Billed To
      doc
        .fillColor(accentColor)
        .fontSize(11)
        .font("Helvetica-Bold")
        .text("BILLED TO:", 50, y + 10);
      doc
        .fillColor(primaryColor)
        .fontSize(10)
        .font("Helvetica-Bold")
        .text(customer.name || "Customer", 50, y + 26);
      doc.font("Helvetica").fontSize(9).fillColor("#475569");
      doc.text(`ID: ${customer.customerId || "N/A"}`, 50, y + 40);
      doc.text(`Email: ${customer.email || "N/A"}`, 50, y + 54);
      doc.text(`Phone: ${customer.phonenumber || "N/A"}`, 50, y + 68);
      const addr = customer.address || "N/A";
      doc.text(
        `Address: ${addr.substring(0, 38)}${addr.length > 38 ? "..." : ""}`,
        50,
        y + 82,
      );

      // Shipment details (if shipment invoice)
      doc
        .fillColor(accentColor)
        .fontSize(11)
        .font("Helvetica-Bold")
        .text("SHIPMENT DETAILS:", 315, y + 10);
      doc
        .fillColor(primaryColor)
        .fontSize(10)
        .font("Helvetica-Bold")
        .text(
          shipment.trackingId
            ? `Tracking: ${shipment.trackingId}`
            : `Type: ${invoice.invoiceType.toUpperCase()}`,
          315,
          y + 26,
        );
      doc.font("Helvetica").fontSize(9).fillColor("#475569");
      if (shipment.shipmentId) {
        doc.text(`Shipment ID: ${shipment.shipmentId}`, 315, y + 40);
        doc.text(`Priority: ${shipment.priority || "Standard"}`, 315, y + 54);
        doc.text(
          `Weight: ${shipment.totalWeight || 0} kg | Packages: ${shipment.packageCount || 1}`,
          315,
          y + 68,
        );
        doc.text(
          `From: ${shipment.senderCity || "Origin"} -> To: ${shipment.receiverCity || "Destination"}`,
          315,
          y + 82,
        );
      } else {
        doc.text(
          "General logistics & freight management services.",
          315,
          y + 42,
        );
        doc.text(
          `Payment Method: ${invoice.paymentMethod || "Not specified"}`,
          315,
          y + 56,
        );
      }

      // ── Itemized Table ────────────────────────────────────────────────────
      y = 305;
      doc.rect(40, y, 515, 22).fill(primaryColor);
      doc.fillColor("#ffffff").font("Helvetica-Bold").fontSize(9);
      doc.text("#", 48, y + 6);
      doc.text("DESCRIPTION", 75, y + 6);
      doc.text("QTY", 365, y + 6);
      doc.text("UNIT PRICE", 415, y + 6);
      doc.text("AMOUNT", 495, y + 6);

      y += 24;
      const items =
        invoice.items && invoice.items.length > 0
          ? invoice.items
          : [
              {
                description: `Freight & Logistics Service (${invoice.invoiceNumber})`,
                quantity: 1,
                unitPrice:
                  invoice.baseCharges ||
                  invoice.subtotal ||
                  invoice.totalAmount,
                amount:
                  invoice.baseCharges ||
                  invoice.subtotal ||
                  invoice.totalAmount,
              },
            ];

      doc.font("Helvetica").fontSize(9);
      items.forEach((item, idx) => {
        const rowBg = idx % 2 === 0 ? "#ffffff" : "#f8fafc";
        doc.rect(40, y, 515, 18).fill(rowBg);

        doc.fillColor(primaryColor);
        doc.text(String(idx + 1), 48, y + 4);
        doc.text(String(item.description || "").substring(0, 50), 75, y + 4);
        doc.text(String(item.quantity || 1), 365, y + 4);
        doc.text(`INR ${(Number(item.unitPrice) || 0).toFixed(2)}`, 415, y + 4);
        doc.text(`INR ${(Number(item.amount) || 0).toFixed(2)}`, 485, y + 4);

        y += 19;
      });

      // ── Totals Section ────────────────────────────────────────────────────
      y = Math.max(y + 10, 470);
      const rightX = 330;
      const valX = 475;

      doc
        .rect(rightX - 10, y, 235, 140)
        .fill(lightGray)
        .stroke(borderColor);

      doc.font("Helvetica").fontSize(9).fillColor("#475569");
      doc.text("Subtotal:", rightX, y + 10);
      doc.text(`INR ${(invoice.subtotal || 0).toFixed(2)}`, valX, y + 10);

      doc.text("Total GST Amount:", rightX, y + 26);
      doc.text(`INR ${(invoice.taxAmount || 0).toFixed(2)}`, valX, y + 26);

      doc.rect(rightX - 5, y + 58, 225, 1).stroke(borderColor);

      doc.font("Helvetica-Bold").fontSize(11).fillColor(primaryColor);
      doc.text("TOTAL AMOUNT:", rightX, y + 66);
      doc.text(
        `INR ${(invoice.totalAmount || 0).toFixed(2)}`,
        valX - 15,
        y + 66,
      );

      doc.font("Helvetica").fontSize(9).fillColor("#16a34a");
      doc.text("Amount Paid:", rightX, y + 86);
      doc.text(`INR ${(invoice.paidAmount || 0).toFixed(2)}`, valX, y + 86);

      doc
        .font("Helvetica-Bold")
        .fontSize(11)
        .fillColor(invoice.balanceAmount > 0 ? "#dc2626" : "#16a34a");
      doc.text("BALANCE DUE:", rightX, y + 108);
      doc.text(
        `INR ${(invoice.balanceAmount || 0).toFixed(2)}`,
        valX - 15,
        y + 108,
      );

      // Left Box: Payment instructions & Notes
      doc.rect(40, y, 270, 140).stroke(borderColor);
      doc
        .fillColor(accentColor)
        .fontSize(10)
        .font("Helvetica-Bold")
        .text("PAYMENT INSTRUCTIONS & TERMS", 50, y + 10);
      doc.font("Helvetica").fontSize(8).fillColor("#475569");
      doc.text(
        invoice.termsAndConditions ||
          "Payment is due within 15 days of invoice date. Electronic payments accepted via Bank Transfer, UPI, or Credit Card.",
        50,
        y + 28,
        { width: 250 },
      );
      if (invoice.notes) {
        doc
          .font("Helvetica-Bold")
          .fontSize(9)
          .fillColor(primaryColor)
          .text("Notes:", 50, y + 80);
        doc
          .font("Helvetica")
          .fontSize(8)
          .fillColor("#475569")
          .text(invoice.notes, 50, y + 94, { width: 250 });
      }

      // ── Footer ────────────────────────────────────────────────────────────
      doc
        .fontSize(8)
        .font("Helvetica")
        .fillColor("#94a3b8")
        .text(
          "Thank you for your business! This is a system-generated invoice document.",
          40,
          750,
          { align: "center", width: 515 },
        );

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}

/**
 * Generate a clean HTML invoice document for browser view or direct printing.
 */
function generateInvoiceHTML(invoice, customer = {}, shipment = {}) {
  const status = (invoice.paymentStatus || "pending").toUpperCase();
  const statusColors = {
    PAID: "#16a34a",
    PENDING: "#f59e0b",
    PARTIALLY_PAID: "#0284c7",
    OVERDUE: "#dc2626",
    CANCELLED: "#64748b",
  };
  const color = statusColors[status] || "#f59e0b";

  const items =
    invoice.items && invoice.items.length > 0
      ? invoice.items
      : [
          {
            description: `Logistics & Shipment Freight (${invoice.invoiceNumber})`,
            quantity: 1,
            unitPrice: invoice.baseCharges || invoice.totalAmount,
            amount: invoice.baseCharges || invoice.totalAmount,
          },
        ];

  const rows = items
    .map(
      (item, idx) => `
      <tr style="border-bottom: 1px solid #e2e8f0; background: ${idx % 2 === 0 ? "#ffffff" : "#f8fafc"};">
        <td style="padding: 10px; font-size: 13px;">${idx + 1}</td>
        <td style="padding: 10px; font-size: 13px; font-weight: 500;">${item.description}</td>
        <td style="padding: 10px; font-size: 13px; text-align: center;">${item.quantity || 1}</td>
        <td style="padding: 10px; font-size: 13px; text-align: right;">INR ${(Number(item.unitPrice) || 0).toFixed(2)}</td>
        <td style="padding: 10px; font-size: 13px; text-align: right; font-weight: 600;">INR ${(Number(item.amount) || 0).toFixed(2)}</td>
      </tr>
    `,
    )
    .join("");

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Invoice - ${invoice.invoiceNumber}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif; margin: 0; padding: 30px; background: #f1f5f9; color: #1e293b; }
    .invoice-card { max-width: 800px; margin: 0 auto; background: #ffffff; padding: 40px; border-radius: 12px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); }
    .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #e2e8f0; padding-bottom: 20px; }
    .header h1 { margin: 0; color: #1e293b; font-size: 24px; }
    .header p { margin: 4px 0; color: #64748b; font-size: 13px; }
    .badge { display: inline-block; padding: 4px 12px; font-size: 12px; font-weight: 700; border-radius: 9999px; color: #fff; background: ${color}; text-transform: uppercase; }
    .meta-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin: 24px 0; background: #f8fafc; padding: 16px; border-radius: 8px; }
    .meta-item label { display: block; font-size: 11px; text-transform: uppercase; color: #64748b; font-weight: 600; margin-bottom: 4px; }
    .meta-item div { font-size: 14px; font-weight: 600; color: #1e293b; }
    .two-col { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-bottom: 28px; }
    .panel { background: #f8fafc; padding: 16px; border-radius: 8px; border: 1px solid #e2e8f0; }
    .panel h3 { margin: 0 0 10px 0; font-size: 13px; text-transform: uppercase; color: #2563eb; }
    .panel p { margin: 4px 0; font-size: 13px; color: #475569; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 24px; }
    th { background: #1e293b; color: #ffffff; padding: 10px; font-size: 12px; text-align: left; }
    th.right { text-align: right; }
    th.center { text-align: center; }
    .summary-section { display: flex; justify-content: space-between; margin-top: 10px; }
    .terms { width: 55%; font-size: 12px; color: #64748b; line-height: 1.5; }
    .totals { width: 40%; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; }
    .totals-row { display: flex; justify-content: space-between; padding: 6px 0; font-size: 13px; color: #475569; }
    .totals-row.grand { border-top: 2px solid #e2e8f0; margin-top: 6px; padding-top: 10px; font-size: 16px; font-weight: 700; color: #1e293b; }
    .totals-row.balance { font-size: 15px; font-weight: 700; color: ${invoice.balanceAmount > 0 ? "#dc2626" : "#16a34a"}; }
    .footer { text-align: center; margin-top: 30px; font-size: 12px; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 16px; }
    @media print { body { background: #fff; padding: 0; } .invoice-card { box-shadow: none; border-radius: 0; } }
  </style>
</head>
<body>
  <div class="invoice-card">
    <div class="header">
      <div>
        <h1>LOGISTICS MANAGEMENT SERVICES</h1>
        <p>Express Dispatch, Freight & Cargo Network</p>
      </div>
      <div style="text-align: right;">
        <span class="badge">${status}</span>
        <p style="margin-top: 8px; font-weight: 600;">${invoice.invoiceNumber}</p>
      </div>
    </div>

    <div class="meta-grid">
      <div class="meta-item">
        <label>Invoice Number</label>
        <div>${invoice.invoiceNumber}</div>
      </div>
      <div class="meta-item">
        <label>Issue Date</label>
        <div>${invoice.issueDate ? new Date(invoice.issueDate).toLocaleDateString("en-IN") : "N/A"}</div>
      </div>
      <div class="meta-item">
        <label>Due Date</label>
        <div>${invoice.dueDate ? new Date(invoice.dueDate).toLocaleDateString("en-IN") : "N/A"}</div>
      </div>
      <div class="meta-item">
        <label>Payment Method</label>
        <div>${invoice.paymentMethod || "Pending"}</div>
      </div>
    </div>

    <div class="two-col">
      <div class="panel">
        <h3>Billed To</h3>
        <p><strong>${customer.name || "Customer"}</strong></p>
        <p>ID: ${customer.customerId || "N/A"}</p>
        <p>Email: ${customer.email || "N/A"}</p>
        <p>Phone: ${customer.phonenumber || "N/A"}</p>
        <p>Address: ${customer.address || "N/A"}</p>
      </div>

      <div class="panel">
        <h3>Shipment Details</h3>
        ${
          shipment.trackingId
            ? `
          <p><strong>Tracking ID:</strong> ${shipment.trackingId}</p>
          <p><strong>Shipment ID:</strong> ${shipment.shipmentId || "N/A"}</p>
          <p><strong>Priority:</strong> ${shipment.priority || "Standard"}</p>
          <p><strong>Weight:</strong> ${shipment.totalWeight || 0} kg (${shipment.packageCount || 1} pkg)</p>
          <p><strong>Route:</strong> ${shipment.senderCity || "Origin"} &rarr; ${shipment.receiverCity || "Destination"}</p>
        `
            : `
          <p><strong>Type:</strong> ${invoice.invoiceType.toUpperCase()}</p>
          <p>General logistics support and service fees.</p>
        `
        }
      </div>
    </div>

    <table>
      <thead>
        <tr>
          <th style="width: 40px;">#</th>
          <th>Description</th>
          <th class="center" style="width: 60px;">Qty</th>
          <th class="right" style="width: 120px;">Unit Price</th>
          <th class="right" style="width: 120px;">Amount</th>
        </tr>
      </thead>
      <tbody>
        ${rows}
      </tbody>
    </table>

    <div class="summary-section">
      <div class="terms">
        <h4 style="margin: 0 0 6px 0; color: #1e293b;">Terms & Payment Instructions</h4>
        <p>${invoice.termsAndConditions || "Payment is due within 15 days of invoice date."}</p>
        ${invoice.notes ? `<p><strong>Note:</strong> ${invoice.notes}</p>` : ""}
      </div>

      <div class="totals">
        <div class="totals-row">
          <span>Subtotal:</span>
          <span>INR ${(invoice.subtotal || 0).toFixed(2)}</span>
        </div>
        <div class="totals-row">
          <span>Total GST Amount:</span>
          <span>INR ${(invoice.taxAmount || 0).toFixed(2)}</span>
        </div>
        <div class="totals-row grand">
          <span>Total Amount:</span>
          <span>INR ${(invoice.totalAmount || 0).toFixed(2)}</span>
        </div>
        <div class="totals-row" style="color: #16a34a; font-weight: 600;">
          <span>Paid Amount:</span>
          <span>INR ${(invoice.paidAmount || 0).toFixed(2)}</span>
        </div>
        <div class="totals-row balance">
          <span>Balance Due:</span>
          <span>INR ${(invoice.balanceAmount || 0).toFixed(2)}</span>
        </div>
      </div>
    </div>

    <div class="footer">
      <p>Thank you for choosing Logistics Management System! System-generated invoice.</p>
    </div>
  </div>
</body>
</html>`;
}

/**
 * Generate an Excel (.xlsx) billing report workbook using the xlsx library.
 * Returns a Buffer.
 */
function generateBillingExcelReport(summary = {}, invoices = []) {
  const wb = XLSX.utils.book_new();

  // 1. Summary Sheet
  const summaryRows = [
    ["LOGISTICS BILLING & INVOICE EXECUTIVE REPORT"],
    ["Generated At", new Date().toISOString()],
    [],
    ["Metric", "Value"],
    ["Total Invoices", summary.totalInvoices || invoices.length],
    ["Total Billed Amount (INR)", summary.totalBilled || 0],
    ["Total Paid Amount (INR)", summary.totalPaid || 0],
    ["Total Outstanding Balance (INR)", summary.totalOutstanding || 0],
    ["Total Overdue Amount (INR)", summary.totalOverdue || 0],
    ["Paid Invoices Count", summary.paidCount || 0],
    ["Pending Invoices Count", summary.pendingCount || 0],
    ["Partially Paid Count", summary.partiallyPaidCount || 0],
    ["Overdue Invoices Count", summary.overdueCount || 0],
    ["Cancelled Invoices Count", summary.cancelledCount || 0],
  ];
  const summarySheet = XLSX.utils.aoa_to_sheet(summaryRows);
  XLSX.utils.book_append_sheet(wb, summarySheet, "Summary");

  // 2. Invoices Detail Sheet
  const invoiceRows = invoices.map((inv) => ({
    "Invoice Number": inv.invoiceNumber || "",
    "Invoice Type": inv.invoiceType || "shipment",
    "Customer Name": inv.customerId?.name || "N/A",
    "Customer ID": inv.customerId?.customerId || "N/A",
    "Customer Email": inv.customerId?.email || "N/A",
    "Shipment Tracking ID": inv.shipmentId?.trackingId || "N/A",
    "Issue Date": inv.issueDate
      ? new Date(inv.issueDate).toLocaleDateString("en-IN")
      : "",
    "Due Date": inv.dueDate
      ? new Date(inv.dueDate).toLocaleDateString("en-IN")
      : "",
    "Subtotal (INR)": inv.subtotal || 0,
    "Tax Amount (INR)": inv.taxAmount || 0,
    "Total Amount (INR)": inv.totalAmount || 0,
    "Paid Amount (INR)": inv.paidAmount || 0,
    "Balance Amount (INR)": inv.balanceAmount || 0,
    "Payment Status": (inv.paymentStatus || "").toUpperCase(),
    "Payment Method": inv.paymentMethod || "N/A",
    "Paid Date": inv.paidAt
      ? new Date(inv.paidAt).toLocaleDateString("en-IN")
      : "N/A",
    Notes: inv.notes || "",
  }));

  const invoiceSheet = XLSX.utils.json_to_sheet(invoiceRows);
  XLSX.utils.book_append_sheet(wb, invoiceSheet, "Invoices");

  return XLSX.write(wb, { type: "buffer", bookType: "xlsx" });
}

module.exports = {
  calculateShipmentCharges,
  generateInvoicePDF,
  generateInvoiceHTML,
  generateBillingExcelReport,
};
