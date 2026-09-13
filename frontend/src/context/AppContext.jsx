import React, { createContext, useContext, useState } from "react";
import {
  initialCustomers,
  mockOverviewData,
  mockDrivers,
  mockShipments,
} from "../data/mockShipments";

const AppContext = createContext();

export const AppProvider = ({ children }) => {
  const [customers, setCustomers] = useState(initialCustomers);
  const [activeCustomerId, setActiveCustomerId] = useState("CUST-001");
  const [users, setUsers] = useState([
    { name: "Admin User", email: "admin@logistics.com", role: "Admin" },
  ]);
  const [isAuthenticated, setIsAuthenticated] = useState(true);
  const [currentUser, setCurrentUser] = useState({
    name: "Admin User",
    role: "Admin",
    avatar: "A",
  });
  const [globalSearch, setGlobalSearch] = useState("");
  const [activeTrackingCode, setActiveTrackingCode] = useState("TRK-48213");

  // Add customer
  const addCustomer = (customerData) => {
    const newId = `CUST-${String(customers.length + 1).padStart(3, "0")}`;
    const newCustomer = {
      id: newId,
      name: customerData.name,
      email: customerData.email,
      phone: customerData.phone,
      status: "Active",
      verified: true,
      pickupAddress: customerData.pickupAddress,
      deliveryAddress: customerData.deliveryAddress,
      addresses: [
        {
          id: `ADDR-${Date.now()}-1`,
          type: "Pickup",
          label: "Primary Pickup Address",
          address: customerData.pickupAddress,
          isDefault: true,
        },
        {
          id: `ADDR-${Date.now()}-2`,
          type: "Delivery",
          label: "Primary Delivery Address",
          address: customerData.deliveryAddress,
          isDefault: true,
        },
      ],
      shipmentCount: 0,
      activeShipments: 0,
      deliveredShipments: 0,
      pendingShipments: 0,
      shipments: [],
      invoices: [],
    };
    setCustomers((prev) => [newCustomer, ...prev]);
    return newCustomer;
  };

  // Edit customer
  const updateCustomer = (id, updatedData) => {
    setCustomers((prev) =>
      prev.map((c) => (c.id === id ? { ...c, ...updatedData } : c)),
    );
  };

  // Add address to customer
  const addCustomerAddress = (customerId, addressItem) => {
    setCustomers((prev) =>
      prev.map((c) => {
        if (c.id === customerId) {
          const currentAddresses = c.addresses || [
            {
              id: "ADDR-1",
              type: "Pickup",
              label: "Primary Pickup",
              address: c.pickupAddress,
              isDefault: true,
            },
            {
              id: "ADDR-2",
              type: "Delivery",
              label: "Primary Delivery",
              address: c.deliveryAddress,
              isDefault: true,
            },
          ];
          const newAddr = {
            id: `ADDR-${Date.now()}`,
            ...addressItem,
          };
          return {
            ...c,
            addresses: [...currentAddresses, newAddr],
          };
        }
        return c;
      }),
    );
  };

  // Toggle active / deactivate customer
  const toggleCustomerStatus = (id) => {
    setCustomers((prev) =>
      prev.map((c) => {
        if (c.id === id) {
          const newStatus = c.status === "Active" ? "Inactive" : "Active";
          return { ...c, status: newStatus };
        }
        return c;
      }),
    );
  };

  // Add registered user
  const addUser = (userData) => {
    setUsers((prev) => [...prev, userData]);
  };

  const activeCustomer =
    customers.find((c) => c.id === activeCustomerId) || customers[0];

  return (
    <AppContext.Provider
      value={{
        customers,
        activeCustomerId,
        setActiveCustomerId,
        activeCustomer,
        addCustomer,
        updateCustomer,
        addCustomerAddress,
        toggleCustomerStatus,
        users,
        addUser,
        isAuthenticated,
        setIsAuthenticated,
        currentUser,
        setCurrentUser,
        globalSearch,
        setGlobalSearch,
        activeTrackingCode,
        setActiveTrackingCode,
        overviewData: mockOverviewData,
        drivers: mockDrivers,
        shipments: mockShipments,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useApp must be used within an AppProvider");
  }
  return context;
};
