import React from "react";
import { Link } from "react-router-dom";

export default function Footer() {
  return (
    <>
      <footer className="footerLanding">
        <div className="footerContaineraWo">
          <div className="footerContainera">
            <img src="./White.png" alt="Athenura" className="FooterLogo" />
            <p className="footerDes">
              Smart logistics management for connected shipments, fleet
              operations, warehouses, and deliveries.
            </p>
            <div className="footerContaineraIcoBox">
              <a
                href="https://www.linkedin.com/company/athenura/"
                className="footerContaineraIcoBoxIco"
                target="_blank"
              >
                <ion-icon name="logo-linkedin"></ion-icon>
              </a>
              <a
                href="https://www.instagram.com/athenura.in/"
                className="footerContaineraIcoBoxIco"
                target="_blank"
              >
                <ion-icon name="logo-instagram"></ion-icon>
              </a>
            </div>
          </div>
          <div className="footerContainerxbig">
            <div className="footerContainerb">
              <p>QUICK LINKS</p>
              <div className="footerContainerbLinkBox">
                <Link to="/" className="footerContainerbLinkp">
                  Home
                </Link>
                <Link to="/about" className="footerContainerbLinkp">
                  About
                </Link>
                <Link to="/platform" className="footerContainerbLinkp">
                  Platform
                </Link>
                <Link to="/contact" className="footerContainerbLinkp">
                  Contact
                </Link>
              </div>
            </div>
            <div className="footerContainerb">
              <p>PLATFORM</p>
              <div className="footerContainerbLinkBox">
                <p className="footerContainerbLinkp">Shipment Management</p>
                <p className="footerContainerbLinkp">Fleet Management</p>
                <p className="footerContainerbLinkp">Warehouse Operations</p>
                <p className="footerContainerbLinkp">Trip & Route Planning</p>
                <p className="footerContainerbLinkp">Delivery & POD</p>
                <p className="footerContainerbLinkp">Reports & Analytics</p>
              </div>
            </div>
          </div>
        </div>
        <div className="footerContainerWb">
          <p style={{ color: "hsl(0, 0%, 80%)" }}>© 2026 Athenura</p>
          <p style={{ color: "hsl(0, 0%, 80%)", marginRight: "60px" }}>
            Privacy & Policy
          </p>
        </div>
      </footer>
    </>
  );
}
