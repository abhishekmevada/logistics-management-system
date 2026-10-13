import React, { useState, useRef, useEffect } from "react";
import "../../styles/LandingShipmentCost.css";
import Header from "./Header";
import Footer from "./Footer";
import {
  Truck,
  Zap,
  Clock,
  PackageCheck,
  AlertCircle,
  CheckCircle2,
  Loader2,
  RotateCcw,
  MapPin,
  ArrowRight,
  Calculator,
} from "lucide-react";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

const DELIVERY_SERVICES = [
  {
    id: "Standard",
    title: "Standard",
    description: "Regular delivery · No priority surcharge",
    surcharge: "0%",
    icon: Truck,
  },
  {
    id: "Express",
    title: "Express",
    description: "Faster handling · 30% priority surcharge",
    surcharge: "30%",
    icon: Zap,
  },
  {
    id: "Same-day",
    title: "Same-day",
    description: "Delivery on the same day, subject to availability",
    surcharge: "70%",
    icon: Clock,
  },
  {
    id: "Overnight",
    title: "Overnight",
    description: "Overnight delivery service · 100% priority surcharge",
    surcharge: "100%",
    icon: PackageCheck,
  },
];

export default function LandingShipmentCost() {
  const [formData, setFormData] = useState({
    pickupAddress: "",
    deliveryAddress: "",
    distanceKm: "",
    weight: "",
    packageCount: "",
    length: "",
    width: "",
    height: "",
  });
  const [selectedService, setSelectedService] = useState("Standard");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);
  const [isDistanceLoading, setIsDistanceLoading] = useState(false);
  const [isManualDistance, setIsManualDistance] = useState(false);
  const [sourceLabel, setSourceLabel] = useState("");

  const resultRef = useRef(null);
  const isManualDistanceRef = useRef(false);

  useEffect(() => {
    if (result && resultRef.current) {
      resultRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [result]);

  // Autofill distance when pickup and delivery address are provided
  useEffect(() => {
    let active = true;
    const cleanOrigin = formData.pickupAddress.trim();
    const cleanDest = formData.deliveryAddress.trim();
    const validStops = [];

    if (!cleanOrigin || !cleanDest) {
      if (!isManualDistanceRef.current) {
        setFormData((prev) => ({ ...prev, distanceKm: "" }));
      }
      setSourceLabel("");
      return;
    }

    // Wait until meaningful address length is provided
    if (cleanOrigin.length < 2 || cleanDest.length < 2) {
      return;
    }

    const fetchRouteDistance = async () => {
      setIsDistanceLoading(true);
      let finalKm = 0;
      let label = "⚡ Fallback Estimation";

      try {
        const geo1Res = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(cleanOrigin + ", India")}`,
        );
        const geo1Data = await geo1Res.json();
        const geo2Res = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(cleanDest + ", India")}`,
        );
        const geo2Data = await geo2Res.json();

        if (geo1Data.length > 0 && geo2Data.length > 0) {
          const lat1 = geo1Data[0].lat,
            lon1 = geo1Data[0].lon;
          const lat2 = geo2Data[0].lat,
            lon2 = geo2Data[0].lon;

          const routeRes = await fetch(
            `https://router.project-osrm.org/route/v1/driving/${lon1},${lat1};${lon2},${lat2}?overview=false`,
          );
          const routeData = await routeRes.json();

          if (routeData.routes && routeData.routes.length > 0) {
            const roadDistanceKm = Math.round(
              routeData.routes[0].distance / 1000,
            );
            const stopAddon = validStops.length * 70;
            finalKm = roadDistanceKm + stopAddon;
            label = "🌐 Live OpenStreetMap API";
          }
        }
      } catch (err) {
        console.warn(
          "Live API fetch skipped or network limit, using database",
          err,
        );
      }

      if (!finalKm) {
        const baseDistance = Math.max(
          150,
          (cleanOrigin.length + cleanDest.length) * 25,
        );
        finalKm = baseDistance + validStops.length * 60;
        label = "⚡ Fallback Estimation";
      }

      if (active) {
        setIsDistanceLoading(false);
        setSourceLabel(label);
        if (!isManualDistanceRef.current) {
          setFormData((prev) => ({ ...prev, distanceKm: finalKm }));
        }
      }
    };

    const timer = setTimeout(() => {
      fetchRouteDistance();
    }, 600);

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [formData.pickupAddress, formData.deliveryAddress]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === "distanceKm") {
      setIsManualDistance(true);
      isManualDistanceRef.current = true;
      if (value !== "") {
        setSourceLabel("✏️ Manual input");
      }
    } else if (name === "pickupAddress" || name === "deliveryAddress") {
      setIsManualDistance(false);
      isManualDistanceRef.current = false;
    }
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (error) setError("");
  };

  const handleReset = () => {
    setFormData({
      pickupAddress: "",
      deliveryAddress: "",
      distanceKm: "",
      weight: "",
      packageCount: "",
      length: "",
      width: "",
      height: "",
    });
    setSelectedService("Standard");
    setResult(null);
    setError("");
    setIsManualDistance(false);
    isManualDistanceRef.current = false;
    setIsDistanceLoading(false);
    setSourceLabel("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    const pickup = formData.pickupAddress.trim();
    const delivery = formData.deliveryAddress.trim();

    if (!pickup || !delivery) {
      setError("Please provide both pickup and delivery addresses.");
      return;
    }

    const distance = Number(formData.distanceKm);
    const weight = Number(formData.weight);
    const count = parseInt(formData.packageCount, 10);
    const len = Number(formData.length);
    const wid = Number(formData.width);
    const ht = Number(formData.height);

    if (isNaN(distance) || distance <= 0) {
      setError("Please enter a valid route distance in kilometres.");
      return;
    }
    if (isNaN(weight) || weight <= 0) {
      setError("Weight per package must be greater than 0 kg.");
      return;
    }
    if (isNaN(count) || count <= 0) {
      setError("Number of packages must be a positive integer.");
      return;
    }
    if (
      isNaN(len) ||
      len <= 0 ||
      isNaN(wid) ||
      wid <= 0 ||
      isNaN(ht) ||
      ht <= 0
    ) {
      setError("Length, width, and height must all be greater than 0 cm.");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/cost-calculator`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          pickupAddress: pickup,
          deliveryAddress: delivery,
          distanceKm: distance,
          weight,
          packageCount: count,
          length: len,
          width: wid,
          height: ht,
          deliveryType: selectedService,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Failed to calculate shipment cost.");
      }

      setResult(data.data);
    } catch (err) {
      setError(
        err.message ||
          "Unable to connect to calculation service. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Header />
      <section className="ShipmentCostHeroSection">
        <div className="shipmentCostHeroOverlay"></div>
        <div className="shipmentCostHeroContent">
          <h1 className="shipmentCostHeroTitle">
            Calculate Your Shipping Cost Instantly
          </h1>
          <p className="shipmentCostHeroSubtitle">
            Get accurate, real-time freight charges and priority delivery
            surcharges based on your pickup location, package dimensions, and
            delivery speed.
          </p>
          <div className="shipmentCostHeroFeatures">
            <span className="shipmentCostHeroFeatureItem">
              <Zap size={14} className="text-amber-500" /> Instant Calculation
            </span>
            <span className="shipmentCostHeroFeatureItem">
              <PackageCheck size={14} className="text-emerald-500" /> Volumetric
              Weight Logic
            </span>
            <span className="shipmentCostHeroFeatureItem">
              <Clock size={14} className="text-blue-500" /> 4 Priority Delivery
              Tiers
            </span>
          </div>
        </div>
      </section>

      <section className="shipmentCostCalculatorSection">
        <form onSubmit={handleSubmit} className="shipmentCalculatorForm">
          {error && (
            <div className="calculatorErrorBanner">
              <AlertCircle size={20} className="shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="shipmentCalculatorFormBoxa">
            <p className="shipmentCalculatorFormBoxTitle">
              Where are you shipping?
            </p>
            <p className="shipmentCalculatorFormBoxSubTitle">
              Enter the collection and delivery details to estimate your
              shipping cost.
            </p>
            <div className="shipmentCalFormBoxaminBox">
              <div className="shipmentCalFormInputBox">
                <label htmlFor="pickupAddress">Pickup Address</label>
                <input
                  type="text"
                  name="pickupAddress"
                  id="pickupAddress"
                  placeholder="Pickup Address"
                  className="shipmentCalFormInput"
                  value={formData.pickupAddress}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="shipmentCalFormInputBox">
                <label htmlFor="deliveryAddress">Delivery Address</label>
                <input
                  type="text"
                  name="deliveryAddress"
                  id="deliveryAddress"
                  placeholder="Delivery Address"
                  className="shipmentCalFormInput"
                  value={formData.deliveryAddress}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="shipmentCalFormInputBox">
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <label htmlFor="distanceKm">Distance (km)</label>
                  {isDistanceLoading ? (
                    <span
                      style={{
                        fontSize: "11px",
                        color: "#2563eb",
                        fontWeight: 600,
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "4px",
                      }}
                    >
                      <Loader2 size={12} className="spinAnimation" /> Fetching
                      route...
                    </span>
                  ) : null}
                </div>
                <input
                  type="number"
                  step="any"
                  name="distanceKm"
                  id="distanceKm"
                  placeholder={
                    isDistanceLoading
                      ? "Calculating route..."
                      : "Enter distance in kilometres"
                  }
                  className="shipmentCalFormInput"
                  value={formData.distanceKm}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>
          </div>

          <div className="shipmentCalculatorFormBoxa">
            <p className="shipmentCalculatorFormBoxTitle">Package details</p>
            <p className="shipmentCalculatorFormBoxSubTitle">
              For identical packages, enter the weight and dimensions of one
              package.
            </p>
            <div className="shipmentCalFormBoxaminBox">
              <div className="shipmentCalFormInputBox">
                <label htmlFor="weight">Weight per package (kg)</label>
                <input
                  type="number"
                  step="any"
                  name="weight"
                  id="weight"
                  placeholder="eg. 3"
                  className="shipmentCalFormInput"
                  value={formData.weight}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="shipmentCalFormInputBox">
                <label htmlFor="packageCount">Number of packages</label>
                <input
                  type="number"
                  min="1"
                  name="packageCount"
                  id="packageCount"
                  placeholder="eg. 2"
                  className="shipmentCalFormInput"
                  value={formData.packageCount}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="shipmentCalFormInputBox">
                <label htmlFor="length">Length (cm)</label>
                <input
                  type="number"
                  step="any"
                  name="length"
                  id="length"
                  placeholder="eg. 40"
                  className="shipmentCalFormInput"
                  value={formData.length}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="shipmentCalFormInputBox">
                <label htmlFor="width">Width (cm)</label>
                <input
                  type="number"
                  step="any"
                  name="width"
                  id="width"
                  placeholder="eg. 40"
                  className="shipmentCalFormInput"
                  value={formData.width}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="shipmentCalFormInputBox">
                <label htmlFor="height">Height (cm)</label>
                <input
                  type="number"
                  step="any"
                  name="height"
                  id="height"
                  placeholder="eg. 40"
                  className="shipmentCalFormInput"
                  value={formData.height}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>
          </div>

          <div className="deliveryServiceContainer">
            <h3 className="deliveryServiceTitle">
              Choose your delivery service
            </h3>
            <input type="hidden" name="deliveryType" value={selectedService} />
            <div
              className="deliveryServiceList"
              role="radiogroup"
              aria-label="Choose your delivery service"
            >
              {DELIVERY_SERVICES.map((service) => {
                const IconComponent = service.icon;
                const isSelected = selectedService === service.id;
                return (
                  <div
                    key={service.id}
                    className={`deliveryServiceCard ${isSelected ? "selected" : ""}`}
                    onClick={() => setSelectedService(service.id)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        setSelectedService(service.id);
                      }
                    }}
                    role="radio"
                    aria-checked={isSelected}
                    tabIndex={0}
                  >
                    <div className="deliveryServiceLeft">
                      <div className="deliveryServiceIconWrapper">
                        <IconComponent
                          className="deliveryServiceIcon"
                          size={22}
                          strokeWidth={1.8}
                        />
                      </div>
                      <div className="deliveryServiceInfo">
                        <span className="deliveryServiceName">
                          {service.title}
                        </span>
                        <span className="deliveryServiceDescription">
                          {service.description}
                        </span>
                      </div>
                    </div>
                    <span className="deliveryServiceSurcharge">
                      {service.surcharge}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          <button
            type="submit"
            className="ShipmentCalButton"
            disabled={loading}
          >
            {loading ? (
              <span className="btnContentLoading">
                <Loader2 size={18} className="spinAnimation" />
                Calculating Shipment Cost...
              </span>
            ) : (
              "Calculate Shipment Cost"
            )}
          </button>
        </form>

        {result && (
          <div ref={resultRef} className="costResultContainer">
            <div className="costResultHeader">
              <h3 className="costResultHeaderTitle">Estimated Shipment Cost</h3>
              <span className="costResultBadge">
                <CheckCircle2 size={16} /> Calculation Complete
              </span>
            </div>

            <div className="costResultRoute">
              <span className="costResultRoutePoint">
                <MapPin
                  size={16}
                  style={{ display: "inline", marginRight: 4 }}
                />
                {result.pickupAddress}
              </span>
              <ArrowRight size={16} className="text-gray-400" />
              <span className="costResultRoutePoint">
                {result.deliveryAddress}
              </span>
              <span className="costResultRouteDistance">
                {result.distanceKm} km route
              </span>
            </div>

            <div className="costResultTotalBox">
              <div className="costResultTotalBoxLeft">
                <span className="costResultTotalLabel">
                  Total Estimated Cost
                </span>
                <span className="costResultTotalAmount">
                  ₹
                  {Number(result.totalAmount).toLocaleString("en-IN", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </span>
                <span className="costResultTaxNote">
                  Includes 18% GST (₹{Number(result.taxAmount).toFixed(2)})
                </span>
              </div>
              <div className="costResultServiceBadge">
                {result.deliveryType} Delivery
                {result.priorityPercent > 0 && ` (+${result.priorityPercent}%)`}
              </div>
            </div>

            <div className="costResultSpecsGrid">
              <div className="costResultSpecCard">
                <span className="costResultSpecCardLabel">Packages</span>
                <span className="costResultSpecCardValue">
                  {result.packageCount}{" "}
                  {result.packageCount > 1 ? "units" : "unit"}
                </span>
              </div>
              <div className="costResultSpecCard">
                <span className="costResultSpecCardLabel">
                  Chargeable Weight
                </span>
                <span className="costResultSpecCardValue">
                  {result.chargeableWeight} kg
                </span>
              </div>
              <div className="costResultSpecCard">
                <span className="costResultSpecCardLabel">Actual Weight</span>
                <span className="costResultSpecCardValue">
                  {result.actualWeight} kg
                </span>
              </div>
              <div className="costResultSpecCard">
                <span className="costResultSpecCardLabel">
                  Volumetric Weight
                </span>
                <span className="costResultSpecCardValue">
                  {result.volumetricWeight} kg
                </span>
              </div>
            </div>

            <div className="costBreakdownSection">
              <h4 className="costBreakdownTitle">Detailed Cost Breakdown</h4>
              <div className="costBreakdownList">
                <div className="costBreakdownRow">
                  <span>Base Freight (first 1 kg + additional weight)</span>
                  <span>₹{Number(result.baseCharges).toFixed(2)}</span>
                </div>
                {result.priorityCharges > 0 && (
                  <div className="costBreakdownRow">
                    <span>Priority Surcharge ({result.deliveryType})</span>
                    <span>₹{Number(result.priorityCharges).toFixed(2)}</span>
                  </div>
                )}
                <div className="costBreakdownRow">
                  <span>Handling Charges ({result.packageCount} × ₹25)</span>
                  <span>₹{Number(result.handlingCharges).toFixed(2)}</span>
                </div>
                <div className="costBreakdownRow">
                  <span>Fuel Surcharge (5%)</span>
                  <span>₹{Number(result.fuelSurcharge).toFixed(2)}</span>
                </div>
                <div className="costBreakdownRow">
                  <span>Distance Charges ({result.distanceKm} km × ₹2)</span>
                  <span>₹{Number(result.distanceCharges).toFixed(2)}</span>
                </div>
                <div className="costBreakdownRow subtotal">
                  <span>Subtotal</span>
                  <span>₹{Number(result.subtotal).toFixed(2)}</span>
                </div>
                <div className="costBreakdownRow">
                  <span>GST (18%)</span>
                  <span>₹{Number(result.taxAmount).toFixed(2)}</span>
                </div>
                <div className="costBreakdownRow total">
                  <span>Total Amount (INR)</span>
                  <span>
                    ₹
                    {Number(result.totalAmount).toLocaleString("en-IN", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </span>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={handleReset}
              className="recalculateBtn"
            >
              <RotateCcw size={16} />
              Reset & Calculate Another
            </button>
          </div>
        )}
      </section>
      <Footer />
    </>
  );
}
