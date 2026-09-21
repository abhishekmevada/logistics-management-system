import React from "react";
import Footer from "./Footer";
import Header from "./Header";

export default function LandingContact() {
  return (
    <>
      <Header />
      <section className="contactSection" id="contact">
        <div className="contactSectionContainer">
          <p className="heroSectionContaineramin">GET IN TOUCH</p>
          <h2 style={{ fontSize: "2.5rem" }}>
            Let’s Keep Your Logistics Moving.
          </h2>
          <p className="platformOverviewSubtitle" style={{ width: "70%" }}>
            Have a question about shipments, tracking, deliveries, or our
            logistics platform? Get in touch with our team and we’ll help you
            find the right solution for your logistics needs.
          </p>
          <div
            style={{
              position: "relative",
              display: "flex",
              flexDirection: "column",
              gap: "10px",
              marginTop: "20px",
            }}
          >
            <p>Email: email@gmail.com</p>
            <p>Phone Number: +91 1234567891</p>
            <p>Location: India</p>
          </div>
        </div>
        <div className="contactSectionContainerb">
          <form action="" className="contactform">
            <p style={{ fontSize: "1.4rem", textAlign: "start" }}>
              Contact Form
            </p>
            <div className="contactformbox" style={{ marginTop: "20px" }}>
              <label htmlFor="name">Name</label>
              <input
                type="text"
                id="name"
                placeholder="Names"
                className="heroinputField"
                required
              />
            </div>
            <div className="contactformbox">
              <label htmlFor="email">Email</label>
              <input
                type="text"
                id="email"
                placeholder="Enter Your Customer ID"
                className="heroinputField"
                required
              />
            </div>
            <div className="contactformbox">
              <label htmlFor="message">Message</label>
              <textarea
                name="message"
                id="message"
                className="contactFormtextarea"
                placeholder="Message"
              ></textarea>
            </div>
            <button className="heroSubmitBut" style={{ width: "100%" }}>
              View My Shipment
            </button>
          </form>
        </div>
      </section>
      <Footer />
    </>
  );
}
