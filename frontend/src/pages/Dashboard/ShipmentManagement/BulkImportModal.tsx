import React, { useState } from "react";
import type { Shipment } from "../../types/shipment";

interface BulkImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (importedShipments: Shipment[]) => void;
}

interface ParsedRow {
  customerName: string;
  senderName: string;
  senderCity: string;
  receiverName: string;
  receiverCity: string;
  category: string;
  weightKg: number;
  priority: string;
}

export const BulkImportModal: React.FC<BulkImportModalProps> = ({
  isOpen,
  onClose,
  onImport,
}) => {
  const [parsedRows, setParsedRows] = useState<ParsedRow[]>([]);
  const [fileName, setFileName] = useState<string>("");
  const [isParsing, setIsParsing] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleDownloadTemplate = () => {
    const csvContent =
      "data:text/csv;charset=utf-8," +
      "CustomerName,SenderName,SenderCity,ReceiverName,ReceiverCity,Category,WeightKg,Priority\n" +
      "TATA Logistics,TATA Motors Chakan,Pune,TATA AutoComp,Sanand,Automotive Parts,350.0,Standard\n" +
      "Flipkart India,Flipkart Hub,Bhiwandi,Flipkart Hub,Hyderabad,Electronics,120.5,Express\n" +
      "Lupin Pharma,Lupin Tarapur,Palghar,Lupin Warehouse,Indore,Pharmaceuticals,45.0,Overnight";

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "shipments_import_template.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setIsParsing(true);

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const lines = text.split("\n").filter((l) => l.trim().length > 0);

      // Skip header row if present
      const rows: ParsedRow[] = [];
      const startIdx = lines[0].toLowerCase().includes("customername") ? 1 : 0;

      for (let i = startIdx; i < lines.length; i++) {
        const cols = lines[i].split(",").map((c) => c.trim().replace(/^"|"$/g, ""));
        if (cols.length >= 5) {
          rows.push({
            customerName: cols[0] || "Imported Customer",
            senderName: cols[1] || "Origin Warehouse",
            senderCity: cols[2] || "Mumbai",
            receiverName: cols[3] || "Destination Hub",
            receiverCity: cols[4] || "Delhi",
            category: cols[5] || "General Cargo",
            weightKg: parseFloat(cols[6]) || 25.0,
            priority: cols[7] || "Standard",
          });
        }
      }

      setParsedRows(rows);
      setIsParsing(false);
    };
    reader.readAsText(file);
  };

  const handleConfirmImport = () => {
    if (parsedRows.length === 0) return;

    const now = new Date().toISOString();
    const importedShipments: Shipment[] = parsedRows.map((row, index) => {
      const randomNum = Math.floor(10000 + Math.random() * 90000);
      const trackingNo = `TRK-${randomNum}`;
      return {
        id: `shp-imp-${Date.now()}-${index}`,
        trackingNo,
        customerId: `cust-imp-${index}`,
        customerName: row.customerName,
        sender: {
          name: row.senderName,
          phone: "+91 98000 00000",
          email: "sender@import.com",
          address: `${row.senderName} Complex`,
          city: row.senderCity,
          state: "State",
          pincode: "400001",
        },
        receiver: {
          name: row.receiverName,
          phone: "+91 99000 00000",
          email: "receiver@import.com",
          address: `${row.receiverName} Facility`,
          city: row.receiverCity,
          state: "State",
          pincode: "110001",
        },
        package: {
          count: 2,
          weightKg: row.weightKg,
          lengthCm: 50,
          widthCm: 40,
          heightCm: 30,
          category: row.category,
          description: `Bulk CSV imported cargo (${row.category})`,
          declaredValue: 50000,
        },
        status: "Created",
        priority: (row.priority as any) || "Standard",
        pickupDate: now,
        expectedDeliveryDate: new Date(Date.now() + 86400000 * 3).toISOString(),
        documents: [],
        events: [
          {
            id: `evt-imp-${Date.now()}-${index}`,
            status: "Created",
            location: row.senderCity,
            notes: `Batch imported from CSV (${fileName})`,
            timestamp: now,
            updatedBy: "CSV Importer",
          },
        ],
        createdAt: now,
      };
    });

    onImport(importedShipments);
    onClose();
  };

  return (
    <div className="shp-modal-overlay">
      <div className="shp-modal shp-modal--lg">
        <div className="shp-modal__header">
          <div>
            <h3 className="shp-modal__title">Bulk Import Shipments via CSV / Excel</h3>
            <p className="shp-modal__subtitle">
              Upload a `.csv` file to generate multiple shipment manifests at once.
            </p>
          </div>
          <button type="button" className="shp-modal__close" onClick={onClose}>
            ✕
          </button>
        </div>

        <div className="shp-modal__body">
          <div className="shp-import-dropzone">
            <div className="shp-import-dropzone__icon">📂</div>
            <p className="shp-import-dropzone__text">
              Select or Drag & Drop a <strong>CSV file</strong> here
            </p>
            <input
              type="file"
              accept=".csv,text/csv"
              onChange={handleFileUpload}
              className="shp-file-input"
            />
            {fileName && <span className="shp-file-badge">Loaded: {fileName}</span>}
          </div>

          <div className="shp-import-actions">
            <button
              type="button"
              className="shp-btn shp-btn--ghost shp-btn--sm"
              onClick={handleDownloadTemplate}
            >
              📥 Download Sample CSV Template
            </button>
          </div>

          {isParsing && <p className="shp-text-muted">Parsing CSV data...</p>}

          {parsedRows.length > 0 && (
            <div className="shp-import-preview">
              <h5 className="shp-section-title">
                Parsed Pre-Import Preview ({parsedRows.length} Shipments)
              </h5>
              <div className="shp-table-wrap shp-table-wrap--sm">
                <table className="shp-table">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Customer</th>
                      <th>Sender Hub</th>
                      <th>Receiver Hub</th>
                      <th>Category</th>
                      <th>Weight (kg)</th>
                      <th>Priority</th>
                    </tr>
                  </thead>
                  <tbody>
                    {parsedRows.map((row, idx) => (
                      <tr key={idx}>
                        <td>{idx + 1}</td>
                        <td>{row.customerName}</td>
                        <td>
                          {row.senderName} ({row.senderCity})
                        </td>
                        <td>
                          {row.receiverName} ({row.receiverCity})
                        </td>
                        <td>{row.category}</td>
                        <td>{row.weightKg} kg</td>
                        <td>{row.priority}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        <div className="shp-modal__footer">
          <button type="button" className="shp-btn shp-btn--ghost" onClick={onClose}>
            Cancel
          </button>
          <button
            type="button"
            className="shp-btn shp-btn--primary"
            disabled={parsedRows.length === 0}
            onClick={handleConfirmImport}
          >
            Confirm & Import {parsedRows.length} Shipments
          </button>
        </div>
      </div>
    </div>
  );
};
