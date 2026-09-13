export type ShipmentStatus =
  | "Created"
  | "Pickup Scheduled"
  | "Picked Up"
  | "At Warehouse"
  | "Dispatched"
  | "In Transit"
  | "Out for Delivery"
  | "Delivered"
  | "Failed Delivery";

export type ShipmentPriority = "Standard" | "Express" | "Same Day" | "Overnight";

export interface ContactAddressInfo {
  name: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
}

export interface PackageDetails {
  count: number;
  weightKg: number;
  lengthCm: number;
  widthCm: number;
  heightCm: number;
  category: string;
  description: string;
  declaredValue?: number;
}

export interface ShipmentEvent {
  id: string;
  status: ShipmentStatus;
  location: string;
  notes: string;
  timestamp: string;
  updatedBy: string;
}

export interface ShipmentDocument {
  id: string;
  name: string;
  type: string;
  size: string;
  uploadedAt: string;
  url?: string;
}

export interface Shipment {
  id: string;
  trackingNo: string;
  customerId: string;
  customerName: string;
  sender: ContactAddressInfo;
  receiver: ContactAddressInfo;
  package: PackageDetails;
  status: ShipmentStatus;
  priority: ShipmentPriority;
  pickupDate: string;
  expectedDeliveryDate: string;
  deliveredAt?: string;
  driverId?: string;
  driverName?: string;
  vehicleId?: string;
  vehicleNo?: string;
  tripId?: string;
  tripNo?: string;
  documents: ShipmentDocument[];
  events: ShipmentEvent[];
  createdAt: string;
}
