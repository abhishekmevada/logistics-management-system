import React, { useState } from "react";
import Footer from "./Footer";
import Header from "./Header";
import RouteMapVisual from "../../components/RouteMapVisual";
import { Check, AlertTriangle, X, Loader2 } from "lucide-react";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

export default function LandingContact() {
  const [form, setForm] = useState({ name: "", email: "", message: "" });
  const [noti, setNoti] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const showNoti = (text, type = "success") => {
    setNoti({ text, type });
    setTimeout(() => setNoti(null), 3500);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const submitQuery = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const res = await fetch(`${API_BASE_URL}/query`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (!res.ok) {
        showNoti(data.message || "Failed to submit query.", "error");
        return;
      }

      showNoti(data.message || "Query was sent successfully!", "success");
      setForm({ name: "", email: "", message: "" });
    } catch (error) {
      showNoti(
        error instanceof Error ? error.message : "Something went wrong",
        "error",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

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
            <a href="mailto:official@athenura.in">
              Email: official@athenura.in
            </a>
            <p href="tel:+919835051934">Phone Number: +91 9835051934</p>
            <p>Location: Sector 62, Noida, Uttar Pradesh</p>
          </div>
          <div className="contactSectionContainerMinCOntainer">
            <RouteMapVisual />
          </div>
        </div>
        <div className="contactSectionContainerb">
          <div className="contactSectionContainerbCon">
            <img src="./contactImg.png" alt="Athenura" className="contactImg" />
          </div>
          <form onSubmit={submitQuery} className="contactform">
            <p style={{ fontSize: "1.4rem", textAlign: "start" }}>
              Contact Form
            </p>
            <div className="contactformbox">
              <label htmlFor="name">Name</label>
              <input
                type="text"
                id="name"
                name="name"
                placeholder="Name"
                className="heroinputField"
                required
                onChange={handleChange}
                value={form.name}
              />
            </div>
            <div className="contactformbox">
              <label htmlFor="email">Email</label>
              <input
                type="email"
                id="email"
                name="email"
                placeholder="Email"
                className="heroinputField"
                required
                onChange={handleChange}
                value={form.email}
              />
            </div>
            <div className="contactformbox">
              <label htmlFor="message">Message</label>
              <textarea
                name="message"
                id="message"
                className="contactFormtextarea"
                placeholder="Message"
                required
                onChange={handleChange}
                value={form.message}
              ></textarea>
            </div>
            <button
              className="heroSubmitBut"
              style={{
                width: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
              }}
              type="submit"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="animate-spin" size={16} />
                  <span>Submitting...</span>
                </>
              ) : (
                "Send Inquiries"
              )}
            </button>
          </form>
        </div>
      </section>
      {/* Toast Notification (styled similar to DashboardShipment.jsx) */}
      {noti && (
        <div className="fixed bottom-5 right-5 z-50 animate-in slide-in-from-bottom-3 duration-200">
          <div
            className={`flex items-center space-x-2.5 px-4 py-3 rounded-xl shadow-xl text-xs font-bold border ${
              noti.type === "error"
                ? "bg-rose-900 text-white border-rose-700"
                : noti.type === "info"
                  ? "bg-slate-900 text-white border-slate-700"
                  : "bg-emerald-900 text-white border-emerald-700"
            }`}
          >
            {noti.type === "error" ? (
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
            ) : (
              <Check className="w-4 h-4 text-emerald-400 shrink-0" />
            )}
            <span>{noti.text}</span>
            <button
              type="button"
              onClick={() => setNoti(null)}
              className="text-slate-400 hover:text-white ml-2 cursor-pointer"
              aria-label="Close"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      <Footer />
    </>
  );
}
