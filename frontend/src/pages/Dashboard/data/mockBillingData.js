// Mock Data for Logistics Management System - Invoice & Billing Records

export const INITIAL_INVOICES = [
  {
    id: "INV-2026-001",
    invoiceNumber: "INV-2026-001",
    customer: {
      name: "Tata Steel Ltd",
      contactPerson: "Rajesh Sharma",
      email: "rajesh.sharma@tatasteel.com",
      phone: "+91 98201 44521",
      address: "Plot 4B, Kalinganagar Industrial Complex, Jajpur, Odisha - 755026",
      gstin: "21AAACT2727Q1ZW"
    },
    shipmentId: "SHP-8821",
    shipmentDetails: {
      origin: "Jamshedpur, JH",
      destination: "Pune, MH",
      vehicleNo: "MH-12-RN-8842",
      weight: "24.5 MT",
      dispatchDate: "2026-09-10"
    },
    serviceDescription: "FTL Heavy Industrial Steel Coil Transportation",
    invoiceDate: "2026-09-12",
    dueDate: "2026-09-27",
    status: "Overdue",
    items: [
      {
        description: "Primary Freight - Heavy Trailer (Jamshedpur to Pune 1,420 km)",
        quantity: 24.5,
        unit: "MT",
        rate: 3600,
        taxPercent: 18,
        amount: 88200
      },
      {
        description: "Transit Insurance & Secure Tarp Lashing Charges",
        quantity: 1,
        unit: "Trip",
        rate: 4500,
        taxPercent: 18,
        amount: 4500
      }
    ],
    subtotal: 92700,
    taxAmount: 16686,
    totalAmount: 109386,
    notes: "Payment overdue by 1 day. Standard Net 15 credit terms apply.",
    paymentMethod: "NEFT / RTGS"
  },
  {
    id: "INV-2026-002",
    invoiceNumber: "INV-2026-002",
    customer: {
      name: "Reliance Retail Logistics",
      contactPerson: "Pooja Mehta",
      email: "pooja.mehta@relretail.com",
      phone: "+91 98711 23091",
      address: "Reliance Corporate Park, Thane-Belapur Road, Navi Mumbai - 400701",
      gstin: "27AAACR5055K1Z8"
    },
    shipmentId: "SHP-9142",
    shipmentDetails: {
      origin: "Ahmedabad, GJ",
      destination: "Bengaluru, KA",
      vehicleNo: "GJ-01-BX-4119",
      weight: "14.2 MT",
      dispatchDate: "2026-09-18"
    },
    serviceDescription: "Multi-Temperature Cold Chain FMCG Distribution",
    invoiceDate: "2026-09-20",
    dueDate: "2026-10-05",
    status: "Pending",
    items: [
      {
        description: "Refrigerated Reefer Container Freight (-18°C Controlled)",
        quantity: 14.2,
        unit: "MT",
        rate: 5200,
        taxPercent: 18,
        amount: 73840
      },
      {
        description: "IoT Datalogger Temperature Monitoring Service",
        quantity: 1,
        unit: "Trip",
        rate: 2800,
        taxPercent: 18,
        amount: 2800
      },
      {
        description: "Express Dock Unloading & Sorting Fee",
        quantity: 28,
        unit: "Pallets",
        rate: 150,
        taxPercent: 18,
        amount: 4200
      }
    ],
    subtotal: 80840,
    taxAmount: 14551.2,
    totalAmount: 95391.2,
    notes: "Pending milestone signoff from Bengaluru Distribution Hub.",
    paymentMethod: "Corporate Billing"
  },
  {
    id: "INV-2026-003",
    invoiceNumber: "INV-2026-003",
    customer: {
      name: "Flipkart Internet Logistics",
      contactPerson: "Amitabh Verma",
      email: "billing.logistics@flipkart.com",
      phone: "+91 80 4908 0000",
      address: "Embassy Tech Village, Outer Ring Road, Devarabeesanahalli, Bengaluru - 560103",
      gstin: "29AABCF0298L1ZE"
    },
    shipmentId: "SHP-7730",
    shipmentDetails: {
      origin: "Bhiwandi Hub, MH",
      destination: "Kolkata Central, WB",
      vehicleNo: "MH-04-KF-9012",
      weight: "9.8 MT",
      dispatchDate: "2026-09-08"
    },
    serviceDescription: "E-Commerce Express Linehaul Freight & Cross-Dock",
    invoiceDate: "2026-09-10",
    dueDate: "2026-09-25",
    status: "Paid",
    items: [
      {
        description: "32 Ft MXL Containerized E-Commerce Linehaul",
        quantity: 1,
        unit: "Trip",
        rate: 64500,
        taxPercent: 18,
        amount: 64500
      },
      {
        description: "Toll & Green Highway Express Surcharge",
        quantity: 1,
        unit: "Trip",
        rate: 4200,
        taxPercent: 18,
        amount: 4200
      }
    ],
    subtotal: 68700,
    taxAmount: 12366,
    totalAmount: 81066,
    notes: "Paid via Direct Bank Transfer (UTR: HDFC009923847291 on 24-Sep-2026).",
    paymentMethod: "HDFC RTGS"
  },
  {
    id: "INV-2026-004",
    invoiceNumber: "INV-2026-004",
    customer: {
      name: "Mahindra & Mahindra Ltd",
      contactPerson: "Sunil Kulkarni",
      email: "kulkarni.sunil@mahindra.com",
      phone: "+91 99220 88120",
      address: "Gateway Building, Apollo Bunder, Mumbai, Maharashtra - 400001",
      gstin: "27AAACM1574G1ZN"
    },
    shipmentId: "SHP-6519",
    shipmentDetails: {
      origin: "Nashik Auto Plant, MH",
      destination: "Chennai Assembly, TN",
      vehicleNo: "MH-15-EM-3310",
      weight: "16.0 MT",
      dispatchDate: "2026-09-02"
    },
    serviceDescription: "Just-In-Time Automotive CKD Parts Logistics",
    invoiceDate: "2026-09-04",
    dueDate: "2026-09-19",
    status: "Overdue",
    items: [
      {
        description: "Dedicated Multi-Axle Truck - Auto Components JIT",
        quantity: 1,
        unit: "Trip",
        rate: 58000,
        taxPercent: 18,
        amount: 58000
      },
      {
        description: "Hydraulic Tail-Lift Unloading & Pallet Return",
        quantity: 1,
        unit: "Service",
        rate: 3500,
        taxPercent: 18,
        amount: 3500
      }
    ],
    subtotal: 61500,
    taxAmount: 11070,
    totalAmount: 72570,
    notes: "Overdue by 9 days. Reminder email dispatched to accounts payable.",
    paymentMethod: "NEFT / RTGS"
  },
  {
    id: "INV-2026-005",
    invoiceNumber: "INV-2026-005",
    customer: {
      name: "Sun Pharma Laboratories",
      contactPerson: "Dr. Vikram Joshi",
      email: "v.joshi@sunpharma.com",
      phone: "+91 97129 45012",
      address: "Sun House, CTS No. 201 B/1, Western Express Highway, Goregaon (E), Mumbai - 400063",
      gstin: "24AAACS2914G1ZL"
    },
    shipmentId: "SHP-4920",
    shipmentDetails: {
      origin: "Baddi Pharma Hub, HP",
      destination: "Bhiwandi CDC, MH",
      vehicleNo: "HP-12-CT-9914",
      weight: "6.5 MT",
      dispatchDate: "2026-09-22"
    },
    serviceDescription: "GDP-Certified Pharmaceutical Active Ingredient Transport",
    invoiceDate: "2026-09-23",
    dueDate: "2026-10-08",
    status: "Pending",
    items: [
      {
        description: "Pharma Grade Validated Reefer Vehicle (15°C - 25°C)",
        quantity: 1,
        unit: "Trip",
        rate: 48000,
        taxPercent: 12,
        amount: 48000
      },
      {
        description: "Calibration & GDP Temperature Log Documentation",
        quantity: 1,
        unit: "Certificate",
        rate: 1800,
        taxPercent: 18,
        amount: 1800
      }
    ],
    subtotal: 49800,
    taxAmount: 6084,
    totalAmount: 55884,
    notes: "Invoice verified by QA Department. Awaiting scheduled billing cycle payment.",
    paymentMethod: "Axis Bank Direct Credit"
  },
  {
    id: "INV-2026-006",
    invoiceNumber: "INV-2026-006",
    customer: {
      name: "Adani Logistics & Ports",
      contactPerson: "Kavita Rao",
      email: "kavita.rao@adani.com",
      phone: "+91 79 2656 5555",
      address: "Adani Shantigram, SG Highway, Ahmedabad, Gujarat - 382421",
      gstin: "24AAACA3001P1ZW"
    },
    shipmentId: "SHP-3318",
    shipmentDetails: {
      origin: "Mundra Port, GJ",
      destination: "ICD Jaipur, RJ",
      vehicleNo: "GJ-12-AY-7701",
      weight: "28.0 MT",
      dispatchDate: "2026-09-14"
    },
    serviceDescription: "40ft High Cube Import Container Port Drayage & Rail Terminal Transfer",
    invoiceDate: "2026-09-15",
    dueDate: "2026-09-30",
    status: "Paid",
    items: [
      {
        description: "Port Drayage & 40ft High Cube Trailer Haulage",
        quantity: 2,
        unit: "Containers",
        rate: 34000,
        taxPercent: 18,
        amount: 68000
      },
      {
        description: "Terminal Handling & Container Weight Verification (VGM)",
        quantity: 2,
        unit: "Units",
        rate: 2200,
        taxPercent: 18,
        amount: 4400
      }
    ],
    subtotal: 72400,
    taxAmount: 13032,
    totalAmount: 85432,
    notes: "Settled against Adani Enterprise Credit Line (Ref: AD-9938102).",
    paymentMethod: "ICICI Corporate Netbanking"
  },
  {
    id: "INV-2026-007",
    invoiceNumber: "INV-2026-007",
    customer: {
      name: "UltraTech Cement Ltd",
      contactPerson: "Harish Chandra",
      email: "h.chandra@adityabirla.com",
      phone: "+91 94140 12890",
      address: "Ahura Centre, B-Wing, Mahakali Caves Road, Andheri (E), Mumbai - 400093",
      gstin: "08AAACU0382M1ZX"
    },
    shipmentId: "SHP-2091",
    shipmentDetails: {
      origin: "Chittorgarh Plant, RJ",
      destination: "Lucknow Hub, UP",
      vehicleNo: "RJ-09-GA-1120",
      weight: "32.0 MT",
      dispatchDate: "2026-09-25"
    },
    serviceDescription: "Bulk Clinker & Bagged Cement Transport",
    invoiceDate: "2026-09-26",
    dueDate: "2026-10-11",
    status: "Pending",
    items: [
      {
        description: "Multi-Axle Heavy Bulk Carrier Transport (650 km)",
        quantity: 32,
        unit: "MT",
        rate: 1850,
        taxPercent: 18,
        amount: 59200
      },
      {
        description: "Automatic Palletized Mechanical Loading Surcharge",
        quantity: 32,
        unit: "MT",
        rate: 75,
        taxPercent: 18,
        amount: 2400
      }
    ],
    subtotal: 61600,
    taxAmount: 11088,
    totalAmount: 72688,
    notes: "New invoice generated upon delivery receipt verification at Lucknow warehouse.",
    paymentMethod: "State Bank of India RTGS"
  }
];

export const MOCK_CUSTOMERS = [
  {
    id: "CUST-01",
    name: "Tata Steel Ltd",
    contactPerson: "Rajesh Sharma",
    email: "rajesh.sharma@tatasteel.com",
    phone: "+91 98201 44521",
    address: "Plot 4B, Kalinganagar Industrial Complex, Jajpur, Odisha - 755026",
    gstin: "21AAACT2727Q1ZW",
    city: "Jajpur / Jamshedpur"
  },
  {
    id: "CUST-02",
    name: "Reliance Retail Logistics",
    contactPerson: "Pooja Mehta",
    email: "pooja.mehta@relretail.com",
    phone: "+91 98711 23091",
    address: "Reliance Corporate Park, Thane-Belapur Road, Navi Mumbai - 400701",
    gstin: "27AAACR5055K1Z8",
    city: "Navi Mumbai"
  },
  {
    id: "CUST-03",
    name: "Flipkart Internet Logistics",
    contactPerson: "Amitabh Verma",
    email: "billing.logistics@flipkart.com",
    phone: "+91 80 4908 0000",
    address: "Embassy Tech Village, Outer Ring Road, Devarabeesanahalli, Bengaluru - 560103",
    gstin: "29AABCF0298L1ZE",
    city: "Bengaluru"
  },
  {
    id: "CUST-04",
    name: "Mahindra & Mahindra Ltd",
    contactPerson: "Sunil Kulkarni",
    email: "kulkarni.sunil@mahindra.com",
    phone: "+91 99220 88120",
    address: "Gateway Building, Apollo Bunder, Mumbai, Maharashtra - 400001",
    gstin: "27AAACM1574G1ZN",
    city: "Mumbai / Nashik"
  },
  {
    id: "CUST-05",
    name: "Sun Pharma Laboratories",
    contactPerson: "Dr. Vikram Joshi",
    email: "v.joshi@sunpharma.com",
    phone: "+91 97129 45012",
    address: "Sun House, Western Express Highway, Goregaon (E), Mumbai - 400063",
    gstin: "24AAACS2914G1ZL",
    city: "Baddi / Mumbai"
  },
  {
    id: "CUST-06",
    name: "Adani Logistics & Ports",
    contactPerson: "Kavita Rao",
    email: "kavita.rao@adani.com",
    phone: "+91 79 2656 5555",
    address: "Adani Shantigram, SG Highway, Ahmedabad, Gujarat - 382421",
    gstin: "24AAACA3001P1ZW",
    city: "Ahmedabad / Mundra"
  },
  {
    id: "CUST-07",
    name: "UltraTech Cement Ltd",
    contactPerson: "Harish Chandra",
    email: "h.chandra@adityabirla.com",
    phone: "+91 94140 12890",
    address: "Ahura Centre, Mahakali Caves Road, Andheri (E), Mumbai - 400093",
    gstin: "08AAACU0382M1ZX",
    city: "Chittorgarh / Mumbai"
  }
];

export const MOCK_SHIPMENTS = [
  {
    shipmentId: "SHP-8821",
    customerName: "Tata Steel Ltd",
    origin: "Jamshedpur, JH",
    destination: "Pune, MH",
    vehicleNo: "MH-12-RN-8842",
    service: "FTL Heavy Industrial Transport",
    suggestedRate: 3600,
    suggestedUnit: "MT",
    defaultQty: 24.5
  },
  {
    shipmentId: "SHP-9142",
    customerName: "Reliance Retail Logistics",
    origin: "Ahmedabad, GJ",
    destination: "Bengaluru, KA",
    vehicleNo: "GJ-01-BX-4119",
    service: "Cold Chain FMCG Reefer Distribution",
    suggestedRate: 5200,
    suggestedUnit: "MT",
    defaultQty: 14.2
  },
  {
    shipmentId: "SHP-7730",
    customerName: "Flipkart Internet Logistics",
    origin: "Bhiwandi Hub, MH",
    destination: "Kolkata Central, WB",
    vehicleNo: "MH-04-KF-9012",
    service: "E-Commerce Express Linehaul",
    suggestedRate: 64500,
    suggestedUnit: "Trip",
    defaultQty: 1
  },
  {
    shipmentId: "SHP-6519",
    customerName: "Mahindra & Mahindra Ltd",
    origin: "Nashik Auto Plant, MH",
    destination: "Chennai Assembly, TN",
    vehicleNo: "MH-15-EM-3310",
    service: "Just-In-Time Automotive CKD Logistics",
    suggestedRate: 58000,
    suggestedUnit: "Trip",
    defaultQty: 1
  },
  {
    shipmentId: "SHP-4920",
    customerName: "Sun Pharma Laboratories",
    origin: "Baddi Pharma Hub, HP",
    destination: "Bhiwandi CDC, MH",
    vehicleNo: "HP-12-CT-9914",
    service: "GDP-Certified Pharma Transport",
    suggestedRate: 48000,
    suggestedUnit: "Trip",
    defaultQty: 1
  },
  {
    shipmentId: "SHP-3318",
    customerName: "Adani Logistics & Ports",
    origin: "Mundra Port, GJ",
    destination: "ICD Jaipur, RJ",
    vehicleNo: "GJ-12-AY-7701",
    service: "40ft Container Port Drayage",
    suggestedRate: 34000,
    suggestedUnit: "Containers",
    defaultQty: 2
  },
  {
    shipmentId: "SHP-2091",
    customerName: "UltraTech Cement Ltd",
    origin: "Chittorgarh Plant, RJ",
    destination: "Lucknow Hub, UP",
    vehicleNo: "RJ-09-GA-1120",
    service: "Bulk Cement Trailer Transport",
    suggestedRate: 1850,
    suggestedUnit: "MT",
    defaultQty: 32
  },
  {
    shipmentId: "SHP-5524",
    customerName: "Tata Steel Ltd",
    origin: "Kalinganagar, OD",
    destination: "Manesar Auto Hub, HR",
    vehicleNo: "OD-04-TR-9112",
    service: "High Tensile Automotive Sheet Logistics",
    suggestedRate: 4100,
    suggestedUnit: "MT",
    defaultQty: 26.0
  }
];

export const COMPANY_INFO = {
  name: "LogiTrack Express & Freight Solutions Pvt. Ltd.",
  tagline: "Integrated Logistics, Supply Chain & Fleet Management",
  cin: "U63090MH2016PTC284912",
  gstin: "27AABCL8931M1ZQ",
  pan: "AABCL8931M",
  hsnSacCode: "996511 (Road Freight Transport Services)",
  headOffice: "LogiTrack Corporate Towers, 6th Floor, Sector 18, MIDC Industrial Area, Vashi, Navi Mumbai, Maharashtra - 400705",
  phone: "+91 22 6890 4000 / 1800 209 8899",
  email: "billing@logitrack-logistics.com",
  web: "www.logitrack-logistics.com",
  bankDetails: {
    bankName: "HDFC Bank Ltd",
    accountName: "LogiTrack Express & Freight Solutions Pvt Ltd",
    accountNumber: "50200084920194",
    ifscCode: "HDFC0000128",
    branch: "Vashi Sector 17 Branch, Navi Mumbai"
  }
};
