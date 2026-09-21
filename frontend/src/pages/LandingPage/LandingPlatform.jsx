import React, { useState } from "react";
import "../../styles/LandinPlatform.css";
import Header from "./Header";
import Footer from "./Footer";

export default function LandingPlatform() {
  const [openDas, setOpenDas] = useState("customer");
  return (
    <>
      <Header />
      <section className="platformHeroSection">
        <p className="heroSectionContaineramin">THE PLATFORM</p>
        <h2 style={{ fontSize: "2.5rem", textAlign: "center" }}>
          One Platform for Every Logistics Operation.
        </h2>
        <p
          className="platformOverviewSubtitle"
          style={{ textAlign: "center", fontSize: "1.2rem" }}
        >
          Manage customers, shipments, drivers, vehicles, trips, warehouses,
          deliveries, documents, and operational records through one connected
          logistics management system.
        </p>
      </section>
      <section className="platformOverviewSection">
        <p className="heroSectionContaineramin">PLATFORM OVERVIEW</p>
        <h2 style={{ fontSize: "2rem" }}>
          Everything You Need to Manage the Logistics Lifecycle.
        </h2>
        <p className="platformOverviewSubtitle">
          The platform brings the core areas of logistics management into one
          connected system, giving teams the tools to manage operations from
          customer creation through delivery and documentation.
        </p>
        <div className="platformOverviewCardContainer">
          <div className="platformOverviewCard">
            <p className="platformOverviewCardNumber">01</p>
            <h2 className="platformOverviewCardTitle">Customers</h2>
            <p className="platformOverviewCardSubtitle">
              Manage Customer Relationships
            </p>
            <p className="platformOverviewCardMessage">
              Create and manage customer profiles, contact information,
              addresses, accounts, and shipment history.
            </p>
          </div>

          <div className="platformOverviewCard">
            <p className="platformOverviewCardNumber">02</p>
            <h2 className="platformOverviewCardTitle">Shipments</h2>
            <p className="platformOverviewCardSubtitle">
              Control the Shipment Lifecycle
            </p>
            <p className="platformOverviewCardMessage">
              Create shipments, schedule pickups, manage shipment details, and
              track progress through every stage.
            </p>
          </div>

          <div className="platformOverviewCard">
            <p className="platformOverviewCardNumber">03</p>
            <h2 className="platformOverviewCardTitle">Fleet & Drivers</h2>
            <p className="platformOverviewCardSubtitle">
              Coordinate Your Resources
            </p>
            <p className="platformOverviewCardMessage">
              Manage drivers and vehicles, monitor availability, and organize
              assignments for operational activities.
            </p>
          </div>

          <div className="platformOverviewCard">
            <p className="platformOverviewCardNumber">04</p>
            <h2 className="platformOverviewCardTitle">Trips & Routes</h2>
            <p className="platformOverviewCardSubtitle">Plan Every Journey</p>
            <p className="platformOverviewCardMessage">
              Create trips, assign resources, manage stops, and coordinate
              transportation activities.
            </p>
          </div>

          <div className="platformOverviewCard">
            <p className="platformOverviewCardNumber">05</p>
            <h2 className="platformOverviewCardTitle">Warehouse & Delivery</h2>
            <p className="platformOverviewCardSubtitle">
              Move From Warehouse to Delivery
            </p>
            <p className="platformOverviewCardMessage">
              Manage warehouse processing, dispatch, delivery status, and proof
              of delivery.
            </p>
          </div>

          <div className="platformOverviewCard">
            <p className="platformOverviewCardNumber">06</p>
            <h2 className="platformOverviewCardTitle">Documents & Reports</h2>
            <p className="platformOverviewCardSubtitle">
              Keep Records Connected
            </p>
            <p className="platformOverviewCardMessage">
              Maintain operational documents and review shipment, delivery,
              fleet, warehouse, customer, and billing information.
            </p>
          </div>
        </div>
      </section>

      <section className="platformOverviewSection">
        <p className="heroSectionContaineramin">MODULE CAPABILITIES</p>
        <h2 style={{ fontSize: "2rem" }}>
          Built Around Your Complete Logistics Workflow.
        </h2>
        <p className="platformOverviewSubtitle">
          Each module is designed for a specific part of the logistics operation
          while remaining connected to the rest of the system. Manage
          information, coordinate activities, and maintain visibility throughout
          the shipment lifecycle.
        </p>
        <div className="platformOverviewSectionWorldContainer">
          <div className="platformOverviewWorldContainer">
            <div className="platformOverviewWorldContainerHeader">
              <p
                className="platformOverviewWorldContainerHeaderP"
                onClick={() => setOpenDas("customer")}
              >
                Customer Management
              </p>
              <p
                className="platformOverviewWorldContainerHeaderP"
                onClick={() => setOpenDas("shipment")}
              >
                Shipment Management
              </p>
              <p
                className="platformOverviewWorldContainerHeaderP"
                onClick={() => setOpenDas("fleet")}
              >
                Fleet & Driver Management
              </p>
              <p
                className="platformOverviewWorldContainerHeaderP"
                onClick={() => setOpenDas("trip")}
              >
                Trip & Route Management
              </p>
              <p
                className="platformOverviewWorldContainerHeaderP"
                onClick={() => setOpenDas("warehouse")}
              >
                Warehouse Management
              </p>
              <p
                className="platformOverviewWorldContainerHeaderP"
                onClick={() => setOpenDas("document")}
              >
                Documents & Report
              </p>
            </div>
            <div className="platformOverviewWorldContainerBody">
              {openDas === "customer" && (
                <div className="platformOverviewWorldContainerBodyCustomer">
                  <div className="platformOverviewBodyCustomerBoxa">
                    <h2 style={{ fontSize: "2rem" }}>Customer Management</h2>
                    <p>Keep Customer Operations Organized.</p>
                    <p>
                      Manage customer relationships and keep important customer
                      information connected with their logistics activities. Get
                      a clear view of customer interactions and shipment
                      activity in one place.
                    </p>
                  </div>
                  <div className="platformOverviewBodyCustomerBoxb">
                    <img
                      src="/cutom.jpg"
                      alt="Customer Management"
                      className="platformOverviewBodyCustomerBoxbImg"
                    />
                  </div>
                </div>
              )}

              {openDas === "shipment" && (
                <div className="platformOverviewWorldContainerBodyCustomer">
                  <div className="platformOverviewBodyCustomerBoxa">
                    <h2 style={{ fontSize: "2rem" }}>Shipment Management</h2>
                    <p>Stay in Control of Every Shipment.</p>
                    <p>
                      Manage shipments throughout their journey with a
                      centralized view of shipment information, progress, and
                      delivery activity.
                    </p>
                  </div>
                  <div className="platformOverviewBodyCustomerBoxb">
                    <img
                      src="/shipment.jpg"
                      alt="Customer Management"
                      className="platformOverviewBodyCustomerBoxbImg"
                    />
                  </div>
                </div>
              )}

              {openDas === "fleet" && (
                <div className="platformOverviewWorldContainerBodyCustomer">
                  <div className="platformOverviewBodyCustomerBoxa">
                    <h2 style={{ fontSize: "2rem" }}>
                      Fleet & Driver Management
                    </h2>
                    <p>Keep Your Fleet Moving Efficiently.</p>
                    <p>
                      Organize drivers and vehicles in one place and coordinate
                      the resources needed to keep shipments moving smoothly.
                    </p>
                  </div>
                  <div className="platformOverviewBodyCustomerBoxb">
                    <img
                      src="/fleet.jpg"
                      alt="Customer Management"
                      className="platformOverviewBodyCustomerBoxbImg"
                    />
                  </div>
                </div>
              )}

              {openDas === "trip" && (
                <div className="platformOverviewWorldContainerBodyCustomer">
                  <div className="platformOverviewBodyCustomerBoxa">
                    <h2 style={{ fontSize: "2rem" }}>
                      Trip & Route Management
                    </h2>
                    <p>Plan Every Journey With Clarity.</p>
                    <p>
                      Organize transportation activities by coordinating trips,
                      resources, and delivery journeys from one connected
                      workspace.
                    </p>
                  </div>
                  <div className="platformOverviewBodyCustomerBoxb">
                    <img
                      src="/trip.jpg"
                      alt="Customer Management"
                      className="platformOverviewBodyCustomerBoxbImg"
                    />
                  </div>
                </div>
              )}

              {openDas === "warehouse" && (
                <div className="platformOverviewWorldContainerBodyCustomer">
                  <div className="platformOverviewBodyCustomerBoxa">
                    <h2 style={{ fontSize: "2rem" }}>Warehouse Management</h2>
                    <p>Bring Warehouse Operations Into the Workflow.</p>
                    <p>
                      Keep warehouse activities connected with the broader
                      logistics journey, helping teams manage shipments as they
                      move through processing and dispatch.
                    </p>
                  </div>
                  <div className="platformOverviewBodyCustomerBoxb">
                    <img
                      src="/warehouse.jpg"
                      alt="Customer Management"
                      className="platformOverviewBodyCustomerBoxbImg"
                    />
                  </div>
                </div>
              )}

              {openDas === "document" && (
                <div className="platformOverviewWorldContainerBodyCustomer">
                  <div className="platformOverviewBodyCustomerBoxa">
                    <h2 style={{ fontSize: "2rem" }}>Documents & Reports</h2>
                    <p>Keep Records Accessible. Understand Your Operations.</p>
                    <p>
                      Keep important logistics documents and operational
                      information organized while gaining a clearer view of
                      activity across the platform.
                    </p>
                  </div>
                  <div className="platformOverviewBodyCustomerBoxb">
                    <img
                      src="/document.jpg"
                      alt="Customer Management"
                      className="platformOverviewBodyCustomerBoxbImg"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
      <Footer />
    </>
  );
}
