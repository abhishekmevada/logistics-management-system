import {
  Package,
  RotateCcwClock,
  CircleDotDashed,
  ArrowRight,
  MapPin,
  FileText,
  Menu,
  Swords,
  CheckCheck,
  X,
} from "lucide-react";
import "../../styles/LandingPage.css";
import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import Header from "./Header";
import Footer from "./Footer";

export default function Landingpage() {
  const [customerId, setCustomeId] = useState("");
  const navi = useNavigate();

  const submitCustomerid = (e) => {
    if (e) e.preventDefault();
    if (customerId.trim()) {
      navi(`/customer-dashboard/${customerId.trim()}`);
    }
  };

  return (
    <>
      <Header />
      <section className="HeroSection" id="home">
        <div className="heroSectionContainera">
          <p className="heroSectionContaineramin">
            LOGISTICS MANAGEMENT PLATFORM
          </p>
          <h1 className="heroSectionContaineraTitle">
            Manage Every Shipment.
            <br />
            <span style={{ color: "var(--primary-color)" }}>
              Connect Every Operation.
            </span>
          </h1>
          <h2 className="heroSectionContaineraSubtitle">
            A centralized platform to manage customers, shipments, drivers,
            vehicles, trips, warehouse operations, and deliveries all from one
            connected system.
          </h2>
          <div className="heroSectionContainerBox">
            <h2 style={{ fontSize: "18px", fontWeight: "500" }}>
              Track Your Shipment
            </h2>
            <p style={{ fontSize: "14px" }}>
              Enter your Customer ID to access your shipment information.
            </p>
            <form onSubmit={submitCustomerid} className="heroform">
              <input
                type="text"
                placeholder="Enter Your Customer ID"
                className="heroinputField"
                value={customerId}
                onChange={(e) => setCustomeId(e.target.value)}
                required
              />
              <button type="submit" className="heroSubmitBut">
                View My Shipment
              </button>
            </form>
            <div className="formBox">
              <p className="formBoxp">Secure Access</p>
              <CircleDotDashed className="herosectiondot" />
              <p className="formBoxp">Shipment History</p>
              <CircleDotDashed className="herosectiondot" />
              <p className="formBoxp">Delivery Status</p>
            </div>
          </div>
          <p>
            From customer creation to proof of delivery, keep every step
            connected.
          </p>
        </div>
        <div className="heroSectionContainerb">
          <div className="heroSectionContainerbCardCon">
            <div className="heroSectionContainerbCardConHeader">
              <div className="trackingCardHeaderTop">
                <span className="trackingCardCategory">SHIPMENT TRACKING</span>
              </div>

              <div className="trackingCardIdRow">
                <span className="trackingCardCode">TRK-234323</span>
                <span className="trackingCardStatusBadge">
                  <span className="trackingCardStatusBadgeDot"></span>
                  In Transit
                </span>
              </div>

              <div className="trackingCardRouteSection">
                <div className="trackingCardRouteLabels">
                  <span className="trackingCardRouteLabel">Origin</span>
                  <span className="trackingCardRouteLabel">Destination</span>
                </div>
                <div className="trackingCardRouteCities">
                  <span className="trackingCardCityName">Mumbai</span>
                  <div className="trackingCardRouteLineCon">
                    <div className="trackingCardRouteConnector"></div>
                    <div className="trackingCardRouteArrow">
                      <ArrowRight size={13} />
                    </div>
                  </div>
                  <span className="trackingCardCityName">Surat</span>
                </div>
              </div>
            </div>
            <div className="heroSectionContainerbCardConBody">
              <div className="trackingCardMap">
                <svg
                  viewBox="0 0 370 480"
                  className="trackingMapSvg"
                  preserveAspectRatio="xMidYMid slice"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <defs>
                    <filter
                      id="routeGlow"
                      x="-30%"
                      y="-30%"
                      width="160%"
                      height="160%"
                    >
                      <feGaussianBlur stdDeviation="3.5" result="blur" />
                      <feMerge>
                        <feMergeNode in="blur" />
                        <feMergeNode in="SourceGraphic" />
                      </feMerge>
                    </filter>
                    <filter
                      id="arrowGlow"
                      x="-50%"
                      y="-50%"
                      width="200%"
                      height="200%"
                    >
                      <feDropShadow
                        dx="0"
                        dy="0"
                        stdDeviation="3"
                        floodColor="#ffffff"
                        floodOpacity="0.8"
                      />
                    </filter>
                  </defs>

                  {/* Dark Base Map */}
                  <rect width="100%" height="100%" fill="#121418" />

                  {/* Faint Dark Map Roads */}
                  <path
                    d="M 230 -10 L 195 210 L 175 490"
                    stroke="#1b2029"
                    strokeWidth="18"
                    strokeLinecap="round"
                    fill="none"
                  />
                  <path
                    d="M 300 -10 L 265 210 L 245 490"
                    stroke="#181d26"
                    strokeWidth="14"
                    strokeLinecap="round"
                    fill="none"
                  />
                  <path
                    d="M 345 -10 L 360 490"
                    stroke="#161b23"
                    strokeWidth="10"
                    strokeLinecap="round"
                    fill="none"
                  />
                  <path
                    d="M 120 185 L 370 235"
                    stroke="#181e28"
                    strokeWidth="9"
                    strokeLinecap="round"
                    fill="none"
                  />
                  <path
                    d="M 135 95 L 370 140"
                    stroke="#161c24"
                    strokeWidth="7"
                    strokeLinecap="round"
                    fill="none"
                  />
                  <path
                    d="M 130 330 L 370 370"
                    stroke="#181e27"
                    strokeWidth="10"
                    strokeLinecap="round"
                    fill="none"
                  />

                  {/* Street Names */}
                  <text
                    x="242"
                    y="105"
                    fill="#4c586e"
                    fontSize="10.5"
                    fontWeight="500"
                    letterSpacing="0.6"
                    transform="rotate(-68, 242, 105)"
                    fontFamily="system-ui, -apple-system, sans-serif"
                  >
                    Franconia St
                  </text>

                  <text
                    x="332"
                    y="245"
                    fill="#4c586e"
                    fontSize="10.5"
                    fontWeight="500"
                    letterSpacing="0.6"
                    transform="rotate(-68, 332, 245)"
                    fontFamily="system-ui, -apple-system, sans-serif"
                  >
                    Loomis St
                  </text>

                  <text
                    x="264"
                    y="382"
                    fill="#2b3444"
                    fontSize="11"
                    fontWeight="600"
                    letterSpacing="2"
                    fontFamily="system-ui, -apple-system, sans-serif"
                  >
                    APPAREL
                  </text>

                  {/* Glowing Cyan Route Path with Bottom Loop */}
                  <path
                    d="M 215 410 C 198 426 210 448 236 448 C 258 448 268 426 262 400 C 256 374 226 368 208 390 C 194 406 200 434 224 444 C 248 452 268 436 268 396 L 268 312 C 268 252 274 195 304 140 C 322 108 344 75 365 35"
                    stroke="#00e5c9"
                    strokeWidth="4.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    fill="none"
                    filter="url(#routeGlow)"
                    className="trackingRouteLine"
                  />

                  {/* White Navigation Arrow */}
                  <g
                    transform="translate(305, 142) rotate(28)"
                    filter="url(#arrowGlow)"
                  >
                    <polygon points="0,-12 7,7 0,3 -7,7" fill="#ffffff" />
                  </g>
                </svg>
              </div>

              <div className="trackingTimeline">
                <div className="trackingTimelineDashedLine"></div>
                <div className="trackingWaypointItem">
                  <div className="trackingNodeRing glow">
                    <div className="trackingNodeDot white"></div>
                  </div>
                  <div className="trackingWaypointLabel destination">
                    Pickup
                  </div>
                </div>

                <div className="trackingWaypointItem">
                  <div className="trackingNodeRing glow">
                    <div className="trackingNodeDot white"></div>
                  </div>
                  <div className="trackingWaypointLabel destination">
                    Warehouse
                  </div>
                </div>

                <div className="trackingWaypointItem">
                  <div className="trackingNodeRing glow">
                    <div className="trackingNodeDot white"></div>
                  </div>
                  <div className="trackingWaypointLabel destination">
                    Dispatch
                  </div>
                </div>

                <div className="trackingWaypointItem">
                  <div className="trackingSpeedDotWrapper">
                    <div className="trackingSpeedDot"></div>
                  </div>
                  <div className="trackingSpeedLabel">In Tranist</div>
                </div>

                <div className="trackingWaypointItem">
                  <div className="trackingPastDotWrapper">
                    <div className="trackingNodeRing muted">
                      <div className="trackingNodeDot muted"></div>
                    </div>
                  </div>
                  <p
                    className="trackingSpeedLabel"
                    style={{ color: "rgba(255, 255, 255, 0.32)" }}
                  >
                    Out for Delivery
                  </p>
                </div>

                <div className="trackingWaypointItem">
                  <div className="trackingPastDotWrapper">
                    <div className="trackingNodeRing muted subtle">
                      <div className="trackingNodeDot muted subtle"></div>
                    </div>
                  </div>
                  <p
                    className="trackingSpeedLabel"
                    style={{ color: "rgba(255, 255, 255, 0.32)" }}
                  >
                    Delivered
                  </p>
                </div>
              </div>

              <div className="trackingEtaBox">
                <span className="trackingEtaNumber">09/20/2026</span>
                <span className="trackingEtaUnit">Expected Delivery</span>
              </div>
            </div>
          </div>
        </div>
      </section>
      <section className="platformOverviewSection" id="platform">
        <p className="heroSectionContaineramin">ONE CONNECTED PLATFORM</p>
        <h2 style={{ fontSize: "2rem" }}>
          Everything Connected. From Pickup to Delivery.
        </h2>
        <p className="platformOverviewSubtitle">
          Manage the complete logistics journey through one connected platform
          from creating customers and shipments to assigning resources,
          processing deliveries, and recording proof of delivery.
        </p>
        <div className="jplatformOverviewCardContainer">
          <div className="platformOverviewCard">
            <img
              src="/platformoverviewa.jpg"
              alt="Customer Management"
              className="platformoverviewImg"
            />
            <h2 className="platformOverviewCardTitle">Customer Management</h2>
            <p className="platformOverviewCardSubtitle">
              Create. Organize. Connect.
            </p>
            <p className="platformOverviewCardMessage">
              Manage customer profiles, addresses, accounts, and shipment
              history from one place.
            </p>
          </div>
          <div className="platformOverviewCard">
            <img
              src="/platformoverviewb.jpg"
              alt="Shipment Management"
              className="platformoverviewImg"
            />
            <h2 className="platformOverviewCardTitle">Shipment Management</h2>
            <p className="platformOverviewCardSubtitle">
              Create. Track. Deliver.
            </p>
            <p className="platformOverviewCardMessage">
              Create shipments, schedule pickups, monitor status, and manage the
              complete shipment lifecycle.
            </p>
          </div>
          <div className="platformOverviewCard">
            <img
              src="/platformoverviewc.jpg"
              alt="Fleet & Drivers"
              className="platformoverviewImg"
            />
            <h2 className="platformOverviewCardTitle">Fleet & Drivers</h2>
            <p className="platformOverviewCardSubtitle">
              Resources, Organized.
            </p>
            <p className="platformOverviewCardMessage">
              Manage vehicles, driver availability, assignments, documents, and
              operational records.
            </p>
          </div>
          <div className="platformOverviewCard">
            <img
              src="/platformoverviewd.jpg"
              alt="Trips & Routes"
              className="platformoverviewImg"
            />
            <h2 className="platformOverviewCardTitle">Trips & Routes</h2>
            <p className="platformOverviewCardSubtitle">Plan Every Journey.</p>
            <p className="platformOverviewCardMessage">
              Create trips, assign drivers and vehicles, manage stops, and plan
              delivery routes.
            </p>
          </div>
          <div className="platformOverviewCard">
            <img
              src="/platformoverviewe.jpg"
              alt="Warehouse & Delivery"
              className="platformoverviewImg"
            />
            <h2 className="platformOverviewCardTitle">Warehouse & Delivery</h2>
            <p className="platformOverviewCardSubtitle">
              From Inbound to Delivered.
            </p>
            <p className="platformOverviewCardMessage">
              Manage warehouse processing, dispatch, delivery status, and proof
              of delivery.
            </p>
          </div>
          <div className="platformOverviewCard">
            <img
              src="/platformoverviewf.jpg"
              alt="Reports & Insights"
              className="platformoverviewImg"
            />
            <h2 className="platformOverviewCardTitle">Reports & Insights</h2>
            <p className="platformOverviewCardSubtitle">
              Turn Operations Into Insights.
            </p>
            <p className="platformOverviewCardMessage">
              Monitor shipment, delivery, fleet, warehouse, trip, customer, and
              billing performance.
            </p>
          </div>
        </div>
      </section>
      <section className="platformOverviewSection">
        <p className="heroSectionContaineramin">
          BUILT FOR LOGISTICS OPERATIONS
        </p>
        <h2 style={{ fontSize: "2rem" }}>Less Complexity. More Control.</h2>
        <p className="platformOverviewSubtitle">
          Logistics operations involve customers, shipments, drivers, vehicles,
          trips, warehouses, and deliveries. When information is scattered
          across different tools and manual processes, keeping everything
          coordinated becomes difficult. Our platform brings these operations
          together in one connected system.
        </p>
        <div className="challengessolutionContainer">
          <div className="challengesContainer">
            <div>
              <p className="challesngesContainerTitle">The Challenge</p>
              <p className="challesngesContainerSubtitle">
                Disconnected Operations
              </p>
            </div>

            <div className="challengesBox">
              <p className="challengesBoxp">
                <Swords className="challengeIco" /> Customer and shipment
                information stored in different places.
              </p>
              <p className="challengesBoxp">
                <Swords className="challengeIco" /> Difficult to track shipment
                status across multiple stages.
              </p>
              <p className="challengesBoxp">
                <Swords className="challengeIco" /> Manual coordination between
                drivers, vehicles, and trips.
              </p>
              <p className="challengesBoxp">
                <Swords className="challengeIco" /> Limited visibility into
                warehouse and delivery operations.
              </p>
              <p className="challengesBoxp">
                <Swords className="challengeIco" /> Proof of delivery and
                documents can become difficult to manage.
              </p>
              <p className="challengesBoxp">
                <Swords className="challengeIco" /> Operational data is harder
                to monitor and analyze.
              </p>
            </div>
          </div>
          <div className="challengesContainer">
            <div>
              <p className="challesngesContainerTitle">The Solution</p>
              <p className="challesngesContainerSubtitle">
                One Connected System
              </p>
            </div>

            <div className="challengesBox">
              <p className="challengesBoxp sol">
                <CheckCheck className="challengeIco" /> Centralized customer and
                shipment management.
              </p>
              <p className="challengesBoxp sol">
                <CheckCheck className="challengeIco" /> Real-time shipment
                status and lifecycle visibility.
              </p>
              <p className="challengesBoxp sol">
                <CheckCheck className="challengeIco" /> Organized driver,
                vehicle, and trip assignments.
              </p>
              <p className="challengesBoxp sol">
                <CheckCheck className="challengeIco" /> Connected warehouse and
                delivery workflows.
              </p>
              <p className="challengesBoxp sol">
                <CheckCheck className="challengeIco" /> Digital proof of
                delivery and document records.
              </p>
              <p className="challengesBoxp sol">
                <CheckCheck className="challengeIco" /> Dashboards and reports
                for operational visibility.
              </p>
            </div>
          </div>
        </div>
      </section>
      <section className="platformOverviewSection">
        <p className="heroSectionContaineramin">HOW IT WORKS</p>
        <h2 style={{ fontSize: "2rem" }}>
          From Shipment Creation to Successful Delivery.
        </h2>
        <p className="platformOverviewSubtitle">
          Follow every shipment through a connected workflow. Each stage keeps
          the right information, people, and resources aligned from pickup
          scheduling to final delivery.
        </p>
        <div className="platformOverviewCardContainer">
          <div className="platformOverviewCard">
            <p className="platformOverviewCardNumber">01</p>
            <h2 className="platformOverviewCardTitle">Create Customer</h2>
            <p className="platformOverviewCardSubtitle">
              Start with the Customer.
            </p>
            <p className="platformOverviewCardMessage">
              Create or manage customer profiles, contact details, addresses,
              and account information.
            </p>
          </div>

          <div className="platformOverviewCard">
            <p className="platformOverviewCardNumber">02</p>
            <h2 className="platformOverviewCardTitle">Create Shipment</h2>
            <p className="platformOverviewCardSubtitle">
              Create &amp; Schedule.
            </p>
            <p className="platformOverviewCardMessage">
              Create the shipment with sender, receiver, package details,
              addresses, pickup date, and expected delivery date.
            </p>
          </div>

          <div className="platformOverviewCard">
            <p className="platformOverviewCardNumber">03</p>
            <h2 className="platformOverviewCardTitle">Assign Resources</h2>
            <p className="platformOverviewCardSubtitle">
              Driver. Vehicle. Trip.
            </p>
            <p className="platformOverviewCardMessage">
              Assign available drivers and vehicles, then create and organize
              the trip for the shipment.
            </p>
          </div>

          <div className="platformOverviewCard">
            <p className="platformOverviewCardNumber">04</p>
            <h2 className="platformOverviewCardTitle">
              Pickup &amp; Warehouse
            </h2>
            <p className="platformOverviewCardSubtitle">
              Move Through Operations.
            </p>
            <p className="platformOverviewCardMessage">
              Track pickup activities and process shipments through the
              warehouse when required.
            </p>
          </div>

          <div className="platformOverviewCard">
            <p className="platformOverviewCardNumber">05</p>
            <h2 className="platformOverviewCardTitle">
              Dispatch &amp; Delivery
            </h2>
            <p className="platformOverviewCardSubtitle">Track the Journey.</p>
            <p className="platformOverviewCardMessage">
              Move shipments through dispatch, transit, and out-for-delivery
              stages until the delivery is completed.
            </p>
          </div>

          <div className="platformOverviewCard">
            <p className="platformOverviewCardNumber">06</p>
            <h2 className="platformOverviewCardTitle">Confirm &amp; Record</h2>
            <p className="platformOverviewCardSubtitle">Complete With Proof.</p>
            <p className="platformOverviewCardMessage">
              Capture proof of delivery, delivery notes, receiver details,
              signatures, and photos while keeping the shipment record updated.
            </p>
          </div>
        </div>
      </section>
      <section className="platformOverviewSection" id="tracking">
        <p className="heroSectionContaineramin">COMPLETE SHIPMENT VISIBILITY</p>
        <h2 style={{ fontSize: "2rem" }}>Know Where Every Shipment Stands</h2>
        <p className="platformOverviewSubtitle">
          Follow your shipment through every stage of its journey — from pickup
          scheduling to final delivery. Stay informed with a clear status
          timeline and expected delivery information.
        </p>

        <div className="shipmentSection">
          <div className="shipmentxCon">
            <div className="shipmentSectionContainera">
              <div className="shipmentSectionContaineraCard">
                <div
                  className="heroSectionContainerbCardConHeader"
                  style={{
                    borderTopLeftRadius: "20px",
                    borderTopRightRadius: "20px",
                  }}
                >
                  <div className="trackingCardHeaderTop">
                    <span className="trackingCardCategory">
                      SHIPMENT TRACKING
                    </span>
                  </div>
                  <div className="trackingCardIdRow">
                    <span className="trackingCardCode">TRK-234323</span>
                    <span className="trackingCardStatusBadge">
                      <span className="trackingCardStatusBadgeDot"></span>
                      Dispatch
                    </span>
                  </div>
                  <div className="trackingCardRouteSection">
                    <div className="trackingCardRouteLabels">
                      <span className="trackingCardRouteLabel">Origin</span>
                      <span className="trackingCardRouteLabel">
                        Destination
                      </span>
                    </div>
                    <div className="trackingCardRouteCities">
                      <span className="trackingCardCityName">Mumbai</span>
                      <div className="trackingCardRouteLineCon">
                        <div className="trackingCardRouteConnector"></div>
                        <div
                          className="trackingCardRouteArrow"
                          style={{ left: "30%" }}
                        >
                          <ArrowRight size={13} />
                        </div>
                      </div>
                      <span className="trackingCardCityName">Surat</span>
                    </div>
                  </div>
                </div>
                <div className="shipmentSectionCardBox">
                  <div className="trackingCardMap">
                    <svg
                      viewBox="0 0 370 480"
                      className="trackingMapSvg"
                      preserveAspectRatio="xMidYMid slice"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <defs>
                        <filter
                          id="routeGlow"
                          x="-30%"
                          y="-30%"
                          width="160%"
                          height="160%"
                        >
                          <feGaussianBlur stdDeviation="3.5" result="blur" />
                          <feMerge>
                            <feMergeNode in="blur" />
                            <feMergeNode in="SourceGraphic" />
                          </feMerge>
                        </filter>
                        <filter
                          id="arrowGlow"
                          x="-50%"
                          y="-50%"
                          width="200%"
                          height="200%"
                        >
                          <feDropShadow
                            dx="0"
                            dy="0"
                            stdDeviation="3"
                            floodColor="#ffffff"
                            floodOpacity="0.8"
                          />
                        </filter>
                      </defs>

                      {/* Dark Base Map */}
                      <rect width="100%" height="100%" fill="#121418" />

                      {/* Faint Dark Map Roads */}
                      <path
                        d="M 230 -10 L 195 210 L 175 490"
                        stroke="#1b2029"
                        strokeWidth="18"
                        strokeLinecap="round"
                        fill="none"
                      />
                      <path
                        d="M 300 -10 L 265 210 L 245 490"
                        stroke="#181d26"
                        strokeWidth="14"
                        strokeLinecap="round"
                        fill="none"
                      />
                      <path
                        d="M 345 -10 L 360 490"
                        stroke="#161b23"
                        strokeWidth="10"
                        strokeLinecap="round"
                        fill="none"
                      />
                      <path
                        d="M 120 185 L 370 235"
                        stroke="#181e28"
                        strokeWidth="9"
                        strokeLinecap="round"
                        fill="none"
                      />
                      <path
                        d="M 135 95 L 370 140"
                        stroke="#161c24"
                        strokeWidth="7"
                        strokeLinecap="round"
                        fill="none"
                      />
                      <path
                        d="M 130 330 L 370 370"
                        stroke="#181e27"
                        strokeWidth="10"
                        strokeLinecap="round"
                        fill="none"
                      />

                      {/* Street Names */}
                      <text
                        x="242"
                        y="105"
                        fill="#4c586e"
                        fontSize="10.5"
                        fontWeight="500"
                        letterSpacing="0.6"
                        transform="rotate(-68, 242, 105)"
                        fontFamily="system-ui, -apple-system, sans-serif"
                      >
                        Franconia St
                      </text>

                      <text
                        x="332"
                        y="245"
                        fill="#4c586e"
                        fontSize="10.5"
                        fontWeight="500"
                        letterSpacing="0.6"
                        transform="rotate(-68, 332, 245)"
                        fontFamily="system-ui, -apple-system, sans-serif"
                      >
                        Loomis St
                      </text>

                      <text
                        x="264"
                        y="382"
                        fill="#2b3444"
                        fontSize="11"
                        fontWeight="600"
                        letterSpacing="2"
                        fontFamily="system-ui, -apple-system, sans-serif"
                      >
                        APPAREL
                      </text>

                      {/* Glowing Cyan Route Path with Bottom Loop */}
                      <path
                        d="M 215 410 C 198 426 210 448 236 448 C 258 448 268 426 262 400 C 256 374 226 368 208 390 C 194 406 200 434 224 444 C 248 452 268 436 268 396 L 268 312 C 268 252 274 195 304 140 C 322 108 344 75 365 35"
                        stroke="#00e5c9"
                        strokeWidth="4.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        fill="none"
                        filter="url(#routeGlow)"
                        className="trackingRouteLine"
                      />

                      {/* White Navigation Arrow */}
                      <g
                        transform="translate(305, 142) rotate(28)"
                        filter="url(#arrowGlow)"
                      >
                        <polygon points="0,-12 7,7 0,3 -7,7" fill="#ffffff" />
                      </g>
                    </svg>
                  </div>
                  <div className="shipmentDeliveryDateBadge">
                    <p style={{ color: "white", fontSize: "1rem", margin: 0 }}>
                      Expected Delivery <br />
                      <span style={{ fontSize: "1.4rem" }}>11/10/2026</span>
                    </p>
                  </div>
                </div>
              </div>
            </div>
            <div className="shipmentSectionContainerb">
              <div className="trackingTimeline">
                <div className="trackingTimelineDashedLine"></div>
                <div className="trackingWaypointItem">
                  <div className="trackingNodeRing glow">
                    <div className="trackingNodeDot white"></div>
                  </div>
                  <div className="trackingWaypointLabel destination">
                    Pickup
                  </div>
                </div>

                <div className="trackingWaypointItem">
                  <div className="trackingNodeRing glow">
                    <div className="trackingNodeDot white"></div>
                  </div>
                  <div className="trackingWaypointLabel destination">
                    Warehouse
                  </div>
                </div>

                <div className="trackingWaypointItem">
                  <div className="trackingSpeedDotWrapper">
                    <div className="trackingSpeedDot"></div>
                  </div>
                  <div className="trackingSpeedLabel">Dispatch</div>
                </div>

                <div className="trackingWaypointItem">
                  <div className="trackingPastDotWrapper">
                    <div className="trackingNodeRing muted">
                      <div className="trackingNodeDot muted"></div>
                    </div>
                  </div>
                  <p
                    className="trackingSpeedLabel"
                    style={{ color: "rgba(255, 255, 255, 0.32)" }}
                  >
                    In Tranist
                  </p>
                </div>

                <div className="trackingWaypointItem">
                  <div className="trackingPastDotWrapper">
                    <div className="trackingNodeRing muted">
                      <div className="trackingNodeDot muted"></div>
                    </div>
                  </div>
                  <p
                    className="trackingSpeedLabel"
                    style={{ color: "rgba(255, 255, 255, 0.32)" }}
                  >
                    Out for Delivery
                  </p>
                </div>

                <div className="trackingWaypointItem">
                  <div className="trackingPastDotWrapper">
                    <div className="trackingNodeRing muted subtle">
                      <div className="trackingNodeDot muted subtle"></div>
                    </div>
                  </div>
                  <p
                    className="trackingSpeedLabel"
                    style={{ color: "rgba(255, 255, 255, 0.32)" }}
                  >
                    Delivered
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="shipmentSectionContainerc">
            <p
              style={{
                fontSize: "1.5rem",
                color: "black",
              }}
            >
              Need more details about your shipment?
            </p>
            <a
              href="/#customer"
              className="shipmentSectionContainercBut"
              style={{ width: "max-content" }}
            >
              Track Your Shipment
            </a>
            <img
              src="../../../public/deliveryimg.png"
              alt="Logistic Management System"
              className="shipmentSectionContainercImg"
            />
          </div>
        </div>
      </section>
      <section className="customerportalSectionland" id="customer-portal">
        <p className="heroSectionContaineramin">CUSTOMER PORTAL</p>
        <h2 style={{ fontSize: "2rem" }}>Your Shipments. One Dashboard.</h2>
        <p className="platformOverviewSubtitle">
          Access all your shipments from one place. Check delivery status, view
          shipment history, track individual shipments, and access your
          documents whenever you need them.
        </p>
        <div className="customerportalContainer">
          <img
            src="/customerportalbg.png"
            alt="Customer Portal"
            className="customerportalImg"
          />
          <div className="customerportalConb">
            <div className="customerportalConbCard">
              <p className="customerportalConbCardTitle">
                <Package className="customerportalConbCardIco" />
                All Your Shipments
              </p>
              <p className="customerportalConbCardDis">
                View multiple shipments and their current status in one place.
              </p>
            </div>
            <div className="customerportalConbCard">
              <p className="customerportalConbCardTitle">
                <MapPin className="customerportalConbCardIco" />
                Shipment Tracking
              </p>
              <p className="customerportalConbCardDis">
                Follow the status of an individual shipment through its delivery
                journey.
              </p>
            </div>
            <div className="customerportalConbCard">
              <p className="customerportalConbCardTitle">
                <FileText className="customerportalConbCardIco" />
                Documents
              </p>
              <p className="customerportalConbCardDis">
                Access available shipment documents and Proof of Delivery.
              </p>
            </div>
            <div className="customerportalConbCard">
              <p className="customerportalConbCardTitle">
                <RotateCcwClock className="customerportalConbCardIco" />
                Shipment History
              </p>
              <p className="customerportalConbCardDis">
                Review previous shipments and their delivery information.
              </p>
            </div>
          </div>
        </div>
      </section>
      <section className="platformOverviewSection">
        <p className="heroSectionContaineramin">
          BUILT FOR BETTER LOGISTICS OPERATIONS
        </p>
        <h2 style={{ fontSize: "2rem" }}>
          One Platform. Complete Operational Visibility.
        </h2>
        <p className="platformOverviewSubtitle">
          Manage your logistics operations from a single centralized platform.
          Connect shipments, customers, drivers, vehicles, warehouses, trips,
          deliveries, and documentation through a structured workflow.
        </p>
        <div className="platformOverviewCardContainerxz">
          <div className="platformOverviewCard">
            <p className="platformOverviewCardNumber">01</p>
            <h2 className="platformOverviewCardTitle">
              Centralized Management
            </h2>
            <p className="platformOverviewCardMessage">
              Keep your logistics data organized in one platform instead of
              managing different operations separately.
            </p>
          </div>
          <div className="platformOverviewCard">
            <p className="platformOverviewCardNumber">02</p>
            <h2 className="platformOverviewCardTitle">
              Complete Shipment Visibility
            </h2>

            <p className="platformOverviewCardMessage">
              Follow shipments through their delivery journey with status
              updates, tracking history, and expected delivery information.
            </p>
          </div>
          <div className="platformOverviewCard">
            <p className="platformOverviewCardNumber">03</p>
            <h2 className="platformOverviewCardTitle">Structured Workflows</h2>

            <p className="platformOverviewCardMessage">
              Connect every stage from shipment creation and pickup to warehouse
              processing, dispatch, delivery, and Proof of Delivery.
            </p>
          </div>
          <div className="platformOverviewCard">
            <p className="platformOverviewCardNumber">04</p>
            <h2 className="platformOverviewCardTitle">
              Reliable Delivery Records
            </h2>
            <p className="platformOverviewCardSubtitle">Plan Every Journey.</p>
            <p className="platformOverviewCardMessage">
              Maintain digital records of completed deliveries with receiver
              details, OTP verification, signatures, photos, notes, and POD
              documents.
            </p>
          </div>
        </div>
      </section>
      <section className="ctaSection" id="customer">
        <h2
          style={{
            fontSize: "2rem",
            textAlign: "center",
            color: "white",
            textShadow: "0px 0px 10px black",
          }}
        >
          Where Is Your Shipment?
        </h2>
        <p
          style={{
            textAlign: "center",
            color: "white",
            textShadow: "0px 0px 10px black",
          }}
        >
          Enter your Customer ID or Tracking Number to check your shipment.
        </p>
        <form onSubmit={submitCustomerid} className="heroform">
          <input
            type="text"
            placeholder="Enter Your Customer ID"
            className="heroinputField"
            onChange={(e) => setCustomeId(e.target.value)}
            value={customerId}
            required
          />
          <button type="submit" className="heroSubmitBut">
            View My Shipment
          </button>
        </form>
      </section>

      <Footer />
    </>
  );
}
