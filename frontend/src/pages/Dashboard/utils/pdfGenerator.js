import { jsPDF } from "jspdf";
import { COMPANY_INFO } from "../data/mockBillingData";

// Format Indian Rupee Currency
export const formatINR = (amount) => {
  if (amount === undefined || amount === null || isNaN(amount)) return "₹0";
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
    minimumFractionDigits: Number.isInteger(Number(amount)) ? 0 : 2,
  }).format(amount);
};

// Convert number to Words in Indian numbering system
export const numberToWordsINR = (num) => {
  const a = [
    "",
    "One ",
    "Two ",
    "Three ",
    "Four ",
    "Five ",
    "Six ",
    "Seven ",
    "Eight ",
    "Nine ",
    "Ten ",
    "Eleven ",
    "Twelve ",
    "Thirteen ",
    "Fourteen ",
    "Fifteen ",
    "Sixteen ",
    "Seventeen ",
    "Eighteen ",
    "Nineteen ",
  ];
  const b = [
    "",
    "",
    "Twenty",
    "Thirty",
    "Forty",
    "Fifty",
    "Sixty",
    "Seventy",
    "Eighty",
    "Ninety",
  ];

  const inWords = (n) => {
    if ((n = n.toString()).length > 9) return "overflow";
    let nArray = ("000000000" + n)
      .substr(-9)
      .match(/^(\d{2})(\d{2})(\d{2})(\d{1})(\d{2})$/);
    if (!nArray) return "";
    let str = "";
    str +=
      nArray[1] != 0
        ? (a[Number(nArray[1])] || b[nArray[1][0]] + " " + a[nArray[1][1]]) +
          "Crore "
        : "";
    str +=
      nArray[2] != 0
        ? (a[Number(nArray[2])] || b[nArray[2][0]] + " " + a[nArray[2][1]]) +
          "Lakh "
        : "";
    str +=
      nArray[3] != 0
        ? (a[Number(nArray[3])] || b[nArray[3][0]] + " " + a[nArray[3][1]]) +
          "Thousand "
        : "";
    str +=
      nArray[4] != 0
        ? (a[Number(nArray[4])] || b[nArray[4][0]] + " " + a[nArray[4][1]]) +
          "Hundred "
        : "";
    str +=
      nArray[5] != 0
        ? (str != "" ? "and " : "") +
          (a[Number(nArray[5])] || b[nArray[5][0]] + " " + a[nArray[5][1]])
        : "";
    return str.trim();
  };

  const integerPart = Math.floor(num);
  const decimalPart = Math.round((num - integerPart) * 100);

  let words = inWords(integerPart);
  if (!words) words = "Zero";
  words += " Rupees";

  if (decimalPart > 0) {
    words += " and " + inWords(decimalPart) + " Paise";
  }
  return words + " Only";
};

// Generate and Download PDF using jsPDF
export const downloadInvoicePDF = (invoice) => {
  try {
    const doc = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    const leftMargin = 14;
    const rightMargin = 14;
    const contentWidth = pageWidth - leftMargin - rightMargin; // 182mm
    const rightEdge = pageWidth - rightMargin; // 196mm

    const formatPdfNumber = (val) => {
      const num = Number(val) || 0;
      return num.toLocaleString("en-IN", {
        minimumFractionDigits: Number.isInteger(num) ? 0 : 2,
        maximumFractionDigits: 2,
      });
    };

    // 1. Header Background Bar
    doc.setFillColor(15, 23, 42); // slate-900
    doc.rect(0, 0, pageWidth, 30, "F");

    // Company Header
    doc.setFont("helvetica", "bold");
    doc.setFontSize(15);
    doc.setTextColor(255, 255, 255);
    doc.text("LOGITRACK LOGISTICS SOLUTIONS", leftMargin, 12);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(203, 213, 225);
    doc.text(
      `TAX INVOICE / FREIGHT BILL OF SUPPLY | GSTIN: ${COMPANY_INFO.gstin}`,
      leftMargin,
      18,
    );
    doc.text(
      `MIDC Industrial Area, Turbhe, Navi Mumbai - 400705 | Ph: +91 22 6890 4000 | billing@logitrack.com`,
      leftMargin,
      23,
    );

    // Status Badge Pill
    const statusText = (invoice.status || "PENDING").toUpperCase();
    let statusBg = [251, 191, 36]; // Amber
    let statusFg = [120, 53, 15];
    if (invoice.status === "Paid") {
      statusBg = [220, 252, 231]; // Green-100
      statusFg = [22, 101, 52]; // Green-800
    } else if (invoice.status === "Overdue") {
      statusBg = [254, 226, 226]; // Red-100
      statusFg = [153, 27, 27]; // Red-800
    }

    doc.setFillColor(statusBg[0], statusBg[1], statusBg[2]);
    doc.roundedRect(rightEdge - 32, 10, 32, 10, 2, 2, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(statusFg[0], statusFg[1], statusFg[2]);
    doc.text(statusText, rightEdge - 16, 16.5, { align: "center" });

    let y = 36;

    // 2. Metadata Box (Two Columns)
    const metaBoxHeight = 44;
    doc.setFillColor(248, 250, 252); // slate-50
    doc.setDrawColor(226, 232, 240); // slate-200
    doc.roundedRect(leftMargin, y, contentWidth, metaBoxHeight, 2, 2, "FD");

    // Left Column: Invoice Details
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8.5);
    doc.setTextColor(30, 41, 59);
    doc.text("INVOICE DETAILS", leftMargin + 4, y + 6);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text("Invoice No:", leftMargin + 4, y + 13);
    doc.text("Invoice Date:", leftMargin + 4, y + 19);
    doc.text("Due Date:", leftMargin + 4, y + 25);
    doc.text("Shipment Ref:", leftMargin + 4, y + 31);
    doc.text("SAC / HSN Code:", leftMargin + 4, y + 37);

    doc.setFont("helvetica", "bold");
    doc.setTextColor(15, 23, 42);
    doc.text(
      String(invoice.invoiceNumber || invoice.id || "N/A"),
      leftMargin + 32,
      y + 13,
    );
    doc.text(String(invoice.invoiceDate || "N/A"), leftMargin + 32, y + 19);
    doc.text(String(invoice.dueDate || "N/A"), leftMargin + 32, y + 25);
    doc.text(String(invoice.shipmentId || "N/A"), leftMargin + 32, y + 31);
    doc.text("996511 (Freight Transport)", leftMargin + 32, y + 37);

    // Vertical Divider
    doc.setDrawColor(226, 232, 240);
    doc.line(leftMargin + 88, y + 4, leftMargin + 88, y + metaBoxHeight - 4);

    // Right Column: Billed To
    const rightColX = leftMargin + 94;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8.5);
    doc.setTextColor(30, 41, 59);
    doc.text("BILLED TO (CUSTOMER / CONSIGNEE)", rightColX, y + 6);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(15, 23, 42);
    doc.text(invoice.customer?.name || "Customer Name", rightColX, y + 13);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(71, 85, 105);
    const contactStr = `Contact: ${invoice.customer?.contactPerson || "N/A"} ${invoice.customer?.phone ? `(${invoice.customer.phone})` : ""}`;
    doc.text(contactStr, rightColX, y + 19);
    doc.text(`GSTIN: ${invoice.customer?.gstin || "N/A"}`, rightColX, y + 25);

    // Wrapped address
    const maxAddrWidth = rightEdge - rightColX - 4;
    const addressLines = doc.splitTextToSize(
      invoice.customer?.address || "N/A",
      maxAddrWidth,
    );
    doc.text(addressLines, rightColX, y + 31);

    y += metaBoxHeight + 5;

    // 3. Shipment Route & Fleet Strip
    doc.setFillColor(241, 245, 249);
    doc.setDrawColor(203, 213, 225);
    doc.roundedRect(leftMargin, y, contentWidth, 13, 1.5, 1.5, "FD");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(7.5);
    doc.setTextColor(71, 85, 105);
    doc.text("SHIPMENT ROUTE & FLEET DETAILS:", leftMargin + 4, y + 5);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(15, 23, 42);
    const origin = invoice.shipmentDetails?.origin || "Origin";
    const dest = invoice.shipmentDetails?.destination || "Destination";
    const vehicle = invoice.shipmentDetails?.vehicleNo || "N/A";
    const weight = invoice.shipmentDetails?.weight || "N/A";
    doc.text(
      `Route: ${origin}  -->  ${dest}   |   Vehicle No: ${vehicle}   |   Cargo Weight: ${weight}`,
      leftMargin + 4,
      y + 9.5,
    );

    y += 18;

    // 4. Line Items Table Header
    const colX = {
      sr: leftMargin + 4, // 18
      desc: leftMargin + 14, // 28
      qty: leftMargin + 84, // 98
      rate: leftMargin + 112, // 126
      tax: leftMargin + 134, // 148
      gstAmt: leftMargin + 160, // 174
      total: rightEdge - 4, // 192 (right-aligned)
    };

    doc.setFillColor(30, 58, 138); // blue-900
    doc.rect(leftMargin, y, contentWidth, 8, "F");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(255, 255, 255);

    doc.text("#", colX.sr, y + 5.5);
    doc.text("Service / Cargo Description", colX.desc, y + 5.5);
    doc.text("Qty / Unit", colX.qty, y + 5.5);
    doc.text("Rate (INR)", colX.rate, y + 5.5, { align: "right" });
    doc.text("GST %", colX.tax, y + 5.5, { align: "right" });
    doc.text("GST (INR)", colX.gstAmt, y + 5.5, { align: "right" });
    doc.text("Amount (INR)", colX.total, y + 5.5, { align: "right" });

    y += 8;

    // Table Rows
    const items =
      invoice.items && invoice.items.length > 0
        ? invoice.items
        : [
            {
              description:
                invoice.serviceDescription || "Logistics & Freight Services",
              quantity: 1,
              unit: "Trip",
              rate: invoice.subtotal || invoice.totalAmount,
              taxPercent: 18,
              amount: invoice.subtotal || invoice.totalAmount,
            },
          ];

    items.forEach((item, index) => {
      const rowBg = index % 2 === 0 ? 255 : 248;
      doc.setFillColor(rowBg, rowBg, rowBg);
      doc.rect(leftMargin, y, contentWidth, 9, "F");

      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(30, 41, 59);

      doc.text(String(index + 1), colX.sr, y + 6);

      const maxDescLength = 34;
      const descText =
        item.description.length > maxDescLength
          ? item.description.substring(0, maxDescLength - 3) + "..."
          : item.description;
      doc.text(descText, colX.desc, y + 6);

      const itemTax =
        item.taxAmount !== undefined && !isNaN(Number(item.taxAmount))
          ? item.taxAmount
          : Math.round(
              (Number(item.amount) || 0) *
                ((Number(item.taxPercent) || 18) / 100) *
                100,
            ) / 100;

      doc.text(`${item.quantity} ${item.unit || ""}`, colX.qty, y + 6);
      doc.text(`Rs. ${formatPdfNumber(item.rate)}`, colX.rate, y + 6, {
        align: "right",
      });
      doc.text(`${item.taxPercent || 18}%`, colX.tax, y + 6, {
        align: "right",
      });
      doc.text(`Rs. ${formatPdfNumber(itemTax)}`, colX.gstAmt, y + 6, {
        align: "right",
      });
      doc.text(`Rs. ${formatPdfNumber(item.amount)}`, colX.total, y + 6, {
        align: "right",
      });

      y += 9;
    });

    // Table Bottom Divider
    doc.setDrawColor(203, 213, 225);
    doc.line(leftMargin, y, rightEdge, y);
    y += 5;

    // 5. Calculations & Two-Column Bottom Area
    const subtotal =
      invoice.subtotal || items.reduce((acc, it) => acc + Number(it.amount), 0);
    const taxAmount = invoice.taxAmount || invoice.totalAmount - subtotal;
    const grandTotal = invoice.totalAmount || subtotal + taxAmount;

    const leftColWidth = 100;
    const rightColWidth = 76;
    const totalsBlockLeft = rightEdge - rightColWidth; // 120

    // Left Side: Amount in Words Box
    const words = numberToWordsINR(grandTotal);
    const wordLines = doc.splitTextToSize(words, leftColWidth - 8);
    const wordsBoxHeight = Math.max(14, 8 + wordLines.length * 4);

    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(
      leftMargin,
      y,
      leftColWidth,
      wordsBoxHeight,
      1.5,
      1.5,
      "FD",
    );

    doc.setFont("helvetica", "bold");
    doc.setFontSize(7.5);
    doc.setTextColor(71, 85, 105);
    doc.text("TOTAL AMOUNT IN WORDS:", leftMargin + 4, y + 4.5);

    doc.setFont("helvetica", "bolditalic");
    doc.setFontSize(8);
    doc.setTextColor(30, 41, 59);
    doc.text(wordLines, leftMargin + 4, y + 9);

    // Left Side: Bank Details Box (Placed cleanly below Amount in Words)
    const bankBoxY = y + wordsBoxHeight + 3;
    const bankBoxHeight = 28;

    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(
      leftMargin,
      bankBoxY,
      leftColWidth,
      bankBoxHeight,
      1.5,
      1.5,
      "FD",
    );

    doc.setFont("helvetica", "bold");
    doc.setFontSize(7.5);
    doc.setTextColor(30, 41, 59);
    doc.text(
      "BANK REMITTANCE DETAILS (RTGS / NEFT):",
      leftMargin + 4,
      bankBoxY + 5,
    );

    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(71, 85, 105);
    doc.text(`Bank Name:`, leftMargin + 4, bankBoxY + 10);
    doc.text(`Account No:`, leftMargin + 4, bankBoxY + 14.5);
    doc.text(`IFSC / Branch:`, leftMargin + 4, bankBoxY + 19);
    doc.text(`Beneficiary:`, leftMargin + 4, bankBoxY + 23.5);

    const bd = invoice.bankDetails || {};
    const pdfBankName = bd.bankAndBranch
      ? bd.bankAndBranch.split(",")[0]
      : COMPANY_INFO.bankDetails.bankName;
    const pdfAccNo = bd.accountNumber || COMPANY_INFO.bankDetails.accountNumber;
    const pdfIfscBranch = bd.ifscCode
      ? `${bd.ifscCode} (${bd.bankAndBranch || COMPANY_INFO.bankDetails.branch})`
      : `${COMPANY_INFO.bankDetails.ifscCode} (${COMPANY_INFO.bankDetails.branch})`;
    const pdfBeneficiary =
      bd.accountName || COMPANY_INFO.bankDetails.accountName;

    doc.setFont("helvetica", "bold");
    doc.setTextColor(15, 23, 42);
    doc.text(pdfBankName, leftMargin + 26, bankBoxY + 10);
    doc.text(pdfAccNo, leftMargin + 26, bankBoxY + 14.5);
    doc.text(pdfIfscBranch, leftMargin + 26, bankBoxY + 19);
    doc.text(pdfBeneficiary, leftMargin + 26, bankBoxY + 23.5);

    // Right Side: Totals Summary
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    doc.setTextColor(71, 85, 105);

    doc.text("Freight Subtotal:", totalsBlockLeft + 2, y + 5);
    doc.text(`Rs. ${formatPdfNumber(subtotal)}`, rightEdge - 2, y + 5, {
      align: "right",
    });

    doc.text("Total GST Amount:", totalsBlockLeft + 2, y + 12);
    doc.text(`Rs. ${formatPdfNumber(taxAmount)}`, rightEdge - 2, y + 12, {
      align: "right",
    });

    // Total Payable Highlight Box
    const totalPayableY = y + 17;
    doc.setFillColor(239, 246, 255); // blue-50
    doc.setDrawColor(37, 99, 235); // blue-600
    doc.roundedRect(
      totalsBlockLeft,
      totalPayableY,
      rightColWidth,
      12,
      1.5,
      1.5,
      "FD",
    );

    doc.setFont("helvetica", "bold");
    doc.setFontSize(9.5);
    doc.setTextColor(30, 58, 138); // blue-900
    doc.text("Total Payable (INR):", totalsBlockLeft + 4, totalPayableY + 7.5);
    doc.text(
      `Rs. ${formatPdfNumber(grandTotal)}`,
      rightEdge - 4,
      totalPayableY + 7.5,
      { align: "right" },
    );

    // 6. Terms & Signature Section
    const bottomSectionY = Math.max(
      bankBoxY + bankBoxHeight + 8,
      totalPayableY + 20,
    );

    // Terms and Conditions (Left)
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7.5);
    doc.setTextColor(71, 85, 105);
    doc.text("TERMS & CONDITIONS:", leftMargin, bottomSectionY);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(6.8);
    doc.setTextColor(100, 116, 139);
    doc.text(
      "1. Payment is strictly due by the specified due date. Interest @ 18% p.a. applies to overdue accounts.",
      leftMargin,
      bottomSectionY + 4,
    );
    doc.text(
      "2. All disputes are subject to Navi Mumbai / Mumbai judicial jurisdiction only.",
      leftMargin,
      bottomSectionY + 8,
    );
    doc.text(
      "3. This is a computer-generated GST tax invoice and does not require a physical signature.",
      leftMargin,
      bottomSectionY + 12,
    );

    // Authorized Signatory (Right)
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(15, 23, 42);
    doc.text(
      "For LogiTrack Express & Freight Solutions Pvt. Ltd.",
      rightEdge,
      bottomSectionY + 2,
      { align: "right" },
    );

    doc.setFont("helvetica", "italic");
    doc.setFontSize(7.5);
    doc.setTextColor(100, 116, 139);
    doc.text(
      "[ Authorized Signatory / Accounts Desk ]",
      rightEdge,
      bottomSectionY + 14,
      { align: "right" },
    );

    // Save PDF
    const safeInvoiceName = (
      invoice.invoiceNumber ||
      invoice.id ||
      "Invoice"
    ).replace(/[^a-zA-Z0-9-_]/g, "_");
    const safeCustomerName = (invoice.customer?.name || "Customer").replace(
      /[^a-zA-Z0-9-_]/g,
      "_",
    );
    const filename = `${safeInvoiceName}_${safeCustomerName}.pdf`;

    doc.save(filename);
    return true;
  } catch (error) {
    console.error("Error generating PDF:", error);
    // Fallback printable window trigger
    window.print();
    return false;
  }
};

// Export Invoices list to CSV format
export const exportInvoicesToCSV = (invoices) => {
  const headers = [
    "Invoice ID",
    "Customer Name",
    "Contact Person",
    "Shipment ID",
    "Route",
    "Invoice Date",
    "Due Date",
    "Subtotal (INR)",
    "Tax (INR)",
    "Total Amount (INR)",
    "Status",
  ];
  const rows = invoices.map((inv) => [
    inv.invoiceNumber || inv.id,
    `"${inv.customer?.name || ""}"`,
    `"${inv.customer?.contactPerson || ""}"`,
    inv.shipmentId || "",
    `"${inv.shipmentDetails?.origin || ""} to ${inv.shipmentDetails?.destination || ""}"`,
    inv.invoiceDate,
    inv.dueDate,
    inv.subtotal || inv.totalAmount,
    inv.taxAmount || 0,
    inv.totalAmount,
    inv.status,
  ]);

  const csvContent =
    "data:text/csv;charset=utf-8," +
    [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute(
    "download",
    `Logistics_Billing_Report_${new Date().toISOString().slice(0, 10)}.csv`,
  );
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
