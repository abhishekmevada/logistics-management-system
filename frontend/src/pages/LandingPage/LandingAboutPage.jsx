import React from "react";
import Header from "./Header";
import { Link } from "react-router-dom";
import "../../styles/LandingAbout.css";
import { Waypoints, UserShield, RefreshCcwDot } from "lucide-react";
import Footer from "./Footer";

export default function LandingAboutPage() {
  return (
    <>
      <Header />
      <section className="aboutHerosection">
        <p className="heroSectionContaineramin">ABOUT THE PLATFORM</p>
        <h2 style={{ fontSize: "2.5rem", textAlign: "center" }}>
          Built to Connect the Entire Logistics Operation.
        </h2>
        <p
          className="platformOverviewSubtitle"
          style={{ textAlign: "center", fontSize: "1.2rem" }}
        >
          A centralized logistics management platform designed to connect
          customers, shipments, transportation, warehouse operations, and
          deliveries through one structured workflow.
        </p>
        <div className="aboutHeroBox">
          <Link
            to="/platform"
            className="ladingpageCtaa"
            style={{ width: "max-content" }}
          >
            Explore the Platform
          </Link>
          <Link
            to="/contact"
            className="ladingpageCtab"
            style={{ width: "max-content" }}
          >
            Contact Us
          </Link>
        </div>
      </section>
      <section className="aboutPerposeSection">
        <p className="heroSectionContaineramin">OUR PURPOSE</p>
        <h2 style={{ fontSize: "2rem" }}>
          Making Logistics Operations More Connected.
        </h2>
        <p className="platformOverviewSubtitle">
          Logistics involves many moving parts — customers, shipments, drivers,
          vehicles, warehouses, and deliveries. Our purpose is to bring these
          operations together through one structured platform, making it easier
          for teams to coordinate activities, follow shipment progress, and
          maintain accurate operational records.
        </p>
        <div className="platformOverviewCardContainer">
          <div className="platformOverviewCard">
            <img
              src="/connect.jpg"
              alt="Customer Management"
              className="platformoverviewImg"
            />
            <h2 className="platformOverviewCardTitle">Connect</h2>
            <p className="platformOverviewCardSubtitle">
              Bring Operations Together
            </p>
            <p className="platformOverviewCardMessage">
              Connect customers, shipments, transportation, warehouse
              activities, and deliveries within a shared workflow.
            </p>
          </div>
          <div className="platformOverviewCard">
            <img
              src="/organize.jpg"
              alt="Organize"
              className="platformoverviewImg"
            />
            <h2 className="platformOverviewCardTitle">Organize</h2>
            <p className="platformOverviewCardSubtitle">
              Keep Information Structured
            </p>
            <p className="platformOverviewCardMessage">
              Keep operational data, assignments, documents, and shipment
              records organized and accessible.
            </p>
          </div>
          <div className="platformOverviewCard">
            <img
              src="/visibility.png"
              alt="Visibility"
              className="platformoverviewImg"
            />
            <h2 className="platformOverviewCardTitle">Visibility</h2>
            <p className="platformOverviewCardSubtitle">Follow Every Stage</p>
            <p className="platformOverviewCardMessage">
              Give teams a clearer view of shipment progress and the activities
              taking place across the logistics journey.
            </p>
          </div>
        </div>
        <p style={{ textAlign: "center", marginTop: "20px" }}>
          When every stage is connected, the entire operation becomes easier to
          follow
        </p>
      </section>
      <section className="aboutPerposeSection">
        <p className="heroSectionContaineramin">OUR APPROACH</p>
        <h2 style={{ fontSize: "2rem" }}>
          Designed Around the Way Logistics Moves.
        </h2>
        <p className="platformOverviewSubtitle">
          We built the platform around the complete logistics lifecycle. Instead
          of treating each operation as a separate process, related activities
          are connected so teams can move from customer creation to shipment
          delivery within one structured workflow
        </p>
        <div className="aboutSectionContinaer">
          <div className="customerportalConbCard">
            <p className="customerportalConbCardTitle">
              <Waypoints className="customerportalConbCardIco" />
              Connected Workflow
            </p>
            <p className="customerportalConbCardDis">
              Link customers, shipments, transportation, warehouse operations,
              and delivery activities across the same workflow.
            </p>
          </div>
          <div className="customerportalConbCard">
            <p className="customerportalConbCardTitle">
              <UserShield className="customerportalConbCardIco" />
              Role-Based Operations
            </p>
            <p className="customerportalConbCardDis">
              Give administrators, managers, dispatchers, warehouse teams,
              drivers, and customers access to the tools and information
              relevant to their role.
            </p>
          </div>
          <div className="customerportalConbCard">
            <p className="customerportalConbCardTitle">
              <RefreshCcwDot className="customerportalConbCardIco" />
              Complete Shipment Lifecycle
            </p>
            <p className="customerportalConbCardDis">
              Keep shipment information connected from creation and pickup
              scheduling through transit, delivery, and proof of delivery.
            </p>
          </div>
        </div>
      </section>
      <section className="aboutPerposeSection">
        <p className="heroSectionContaineramin">WHO WE SERVE</p>
        <h2 style={{ fontSize: "2rem" }}>
          One Platform. Every Logistics Role.
        </h2>
        <p className="platformOverviewSubtitle">
          Different teams manage different stages of the logistics journey. The
          platform gives each role access to the information and operations they
          need while keeping the overall workflow connected.
        </p>
        <div className="platformOverviewCardContainer">
          <div className="platformOverviewCard">
            <p className="platformOverviewCardNumber">01</p>
            <h2 className="platformOverviewCardTitle">Admin</h2>
            <p className="platformOverviewCardSubtitle">
              Manage the Operation.
            </p>
            <p className="platformOverviewCardMessage">
              Oversee users, customers, shipments, resources, and operational
              activities across the platform.
            </p>
          </div>

          <div className="platformOverviewCard">
            <p className="platformOverviewCardNumber">02</p>
            <h2 className="platformOverviewCardTitle">Logistics Manager</h2>
            <p className="platformOverviewCardSubtitle">
              Coordinate Logistics.
            </p>
            <p className="platformOverviewCardMessage">
              Monitor shipments and coordinate transportation, warehouse, and
              delivery operations.
            </p>
          </div>

          <div className="platformOverviewCard">
            <p className="platformOverviewCardNumber">03</p>
            <h2 className="platformOverviewCardTitle">Dispatcher</h2>
            <p className="platformOverviewCardSubtitle">
              Keep Shipments Moving.
            </p>
            <p className="platformOverviewCardMessage">
              Coordinate pickups, drivers, vehicles, trips, and shipment
              assignments.
            </p>
          </div>

          <div className="platformOverviewCard">
            <p className="platformOverviewCardNumber">04</p>
            <h2 className="platformOverviewCardTitle">Warehouse Manager</h2>
            <p className="platformOverviewCardSubtitle">
              Manage Warehouse Flow.
            </p>
            <p className="platformOverviewCardMessage">
              Track incoming shipments, warehouse processing, sorting, scanning,
              and dispatch activities.
            </p>
          </div>

          <div className="platformOverviewCard">
            <p className="platformOverviewCardNumber">05</p>
            <h2 className="platformOverviewCardTitle">Driver</h2>
            <p className="platformOverviewCardSubtitle">
              Manage Assigned Deliveries.
            </p>
            <p className="platformOverviewCardMessage">
              View assigned trips, follow delivery activities, update shipment
              status, and complete delivery records.
            </p>
          </div>

          <div className="platformOverviewCard">
            <p className="platformOverviewCardNumber">06</p>
            <h2 className="platformOverviewCardTitle">Customer</h2>
            <p className="platformOverviewCardSubtitle">Stay Informed.</p>
            <p className="platformOverviewCardMessage">
              View shipments, tracking information, delivery status, and
              available shipment documents.
            </p>
          </div>
        </div>
      </section>
      <section className="aboutfinalSection">
        <p className="heroSectionContaineramin">GET STARTED</p>
        <h2 style={{ fontSize: "2rem", textAlign: "center" }}>
          Ready to Connect Your Logistics Operations?
        </h2>
        <p className="platformOverviewSubtitle" style={{ textAlign: "center" }}>
          Bring customers, shipments, transportation, warehouse operations, and
          deliveries together in one connected platform. Explore the system and
          see how your logistics workflow can work as one.
        </p>
        <div className="aboutHeroBox">
          <Link
            to="/#customer"
            className="ladingpageCtaa"
            style={{ width: "max-content" }}
          >
            Get Started
          </Link>
          <Link
            to="/platform"
            className="ladingpageCtab"
            style={{ width: "max-content" }}
          >
            Explore Platform
          </Link>
        </div>
        <p style={{ textAlign: "center", marginTop: "20px" }}>
          <strong>Already have a shipment?</strong> <br />
          Track your shipment and stay updated on its delivery progress.
        </p>
        <Link
          to="/#customer"
          className="ladingpageCtaa"
          style={{ width: "max-content" }}
        >
          Track Shipment
        </Link>
      </section>
      <Footer />
    </>
  );
}
