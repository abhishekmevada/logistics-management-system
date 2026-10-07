import React, { useState } from "react";
import {
  Package,
  Building2,
  Truck,
  CheckCircle2,
  Navigation,
  Compass,
} from "lucide-react";

export default function RouteMapVisual() {
  const [activeNode, setActiveNode] = useState(null);

  const nodes = [
    {
      id: "pickup",
      name: "Pickup",
      subtitle: "Sender Origin",
      status: "Ready for Pickup",
      badge: "Origin",
      time: "09:30 AM",
      x: 370,
      y: 50,
      icon: Package,
      color: "#38bdf8",
      bgColor: "rgba(56, 189, 248, 0.15)",
    },
    {
      id: "waypoint",
      name: "Checkpoint",
      subtitle: "Sorting Branch",
      status: "Verified & Cleared",
      badge: "Hub",
      time: "10:45 AM",
      x: 210,
      y: 105,
      icon: Navigation,
      color: "#60a5fa",
      bgColor: "rgba(96, 165, 250, 0.15)",
    },
    {
      id: "warehouse",
      name: "Warehouse",
      subtitle: "Central Distribution",
      status: "Dispatch Facility",
      badge: "Main Hub",
      time: "12:15 PM",
      x: 110,
      y: 160,
      icon: Building2,
      color: "#60a5fa",
      bgColor: "rgba(96, 165, 250, 0.15)",
    },
    {
      id: "transit",
      name: "Transit",
      subtitle: "In Transit Route",
      status: "On Schedule (54 km/h)",
      badge: "Active",
      time: "02:30 PM",
      x: 370,
      y: 160,
      icon: Truck,
      color: "#38bdf8",
      bgColor: "rgba(56, 189, 248, 0.15)",
    },
    {
      id: "delivered",
      name: "Delivered",
      subtitle: "Final Destination",
      status: "Signed & Completed",
      badge: "Delivered",
      time: "04:15 PM",
      x: 470,
      y: 225,
      icon: CheckCircle2,
      color: "#4ade80",
      bgColor: "rgba(74, 222, 128, 0.15)",
    },
  ];

  return (
    <div className="gmap-container">
      <style>{`
        .gmap-container {
          position: relative;
          width: 100%;
          height: 100%;
          min-height: 340px;
          border-radius: 14px;
          overflow: hidden;
          background-color: #121419;
          box-shadow: 0 4px 24px -2px rgba(0, 0, 0, 0.4);
          border: 1px solid #1e2433;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
          user-select: none;
        }

        /* Ambient Dark Map Roads */
        .gmap-bg-road {
          stroke: #191d27;
          stroke-width: 8;
          fill: none;
        }
        .gmap-bg-road-subtle {
          stroke: #161922;
          stroke-width: 2.5;
          fill: none;
        }
        .gmap-bg-arterial {
          stroke: #222736;
          stroke-width: 3.5;
          fill: none;
        }

        /* Route Line Styles - Neon Google Maps Night Route */
        .gmap-route-glow {
          stroke: rgba(56, 189, 248, 0.25);
          stroke-width: 8;
          fill: none;
          stroke-linecap: round;
          stroke-linejoin: round;
        }
        .gmap-route-core {
          stroke: #2563eb;
          stroke-width: 2.5;
          fill: none;
          stroke-linecap: round;
          stroke-linejoin: round;
        }
        .gmap-animated-dots {
          stroke: #38bdf8;
          stroke-width: 3.5;
          stroke-linecap: round;
          stroke-linejoin: round;
          fill: none;
          stroke-dasharray: 1 14;
          animation: gmapDotStream 1.6s linear infinite;
        }
        .gmap-animated-dots-reverse {
          stroke: #60a5fa;
          stroke-width: 3.5;
          stroke-linecap: round;
          stroke-linejoin: round;
          fill: none;
          stroke-dasharray: 1 14;
          animation: gmapDotStreamReverse 1.6s linear infinite;
        }

        @keyframes gmapDotStream {
          from {
            stroke-dashoffset: 30;
          }
          to {
            stroke-dashoffset: 0;
          }
        }

        @keyframes gmapDotStreamReverse {
          from {
            stroke-dashoffset: 0;
          }
          to {
            stroke-dashoffset: 30;
          }
        }

        /* Radar Pulse Animation */
        .gmap-pulse-ring {
          animation: gmapPulse 2.4s cubic-bezier(0.215, 0.61, 0.355, 1) infinite;
          transform-origin: center;
        }
        @keyframes gmapPulse {
          0% {
            r: 5;
            opacity: 0.9;
          }
          70% {
            r: 16;
            opacity: 0;
          }
          100% {
            r: 18;
            opacity: 0;
          }
        }

        /* Floating Dark Badges */
        .gmap-header-badge {
          position: absolute;
          top: 14px;
          left: 14px;
          background: rgba(18, 20, 25, 0.92);
          backdrop-filter: blur(10px);
          padding: 6px 12px;
          border-radius: 20px;
          border: 1px solid rgba(255, 255, 255, 0.08);
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 12px;
          font-weight: 600;
          color: #f1f5f9;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
          z-index: 10;
        }
        .gmap-live-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: #22c55e;
          box-shadow: 0 0 0 3px rgba(34, 197, 94, 0.3);
          animation: liveBlink 1.5s ease-in-out infinite;
        }
        @keyframes liveBlink {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(0.85); }
        }

        .gmap-map-style-badge {
          position: absolute;
          left: 14px;
          bottom: 12px;
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 11px;
          color: #94a3b8;
          background: rgba(18, 20, 25, 0.88);
          border: 1px solid rgba(255, 255, 255, 0.08);
          padding: 3px 8px;
          border-radius: 4px;
          z-index: 10;
        }

        /* Tooltip Card */
        .gmap-tooltip {
          position: absolute;
          background: #181c25;
          padding: 10px 14px;
          border-radius: 10px;
          box-shadow: 0 8px 24px -4px rgba(0, 0, 0, 0.7);
          border: 1px solid #2d3748;
          font-size: 12px;
          color: #f1f5f9;
          pointer-events: none;
          z-index: 20;
          min-width: 175px;
          transition: opacity 0.15s ease-out;
        }
      `}</style>
      {/* SVG Canvas Map in Dark Theme #121419 */}
      <svg
        viewBox="0 0 580 270"
        width="100%"
        height="100%"
        style={{
          width: "100%",
          height: "100%",
          display: "block",
        }}
        preserveAspectRatio="xMidYMid meet"
      >
        <defs>
          {/* Subtle Dark terrain gradients */}
          <linearGradient id="mapWaterDark" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#0b172a" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#0f1f38" stopOpacity="0.6" />
          </linearGradient>

          <linearGradient id="mapParkDark" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#0c1e1c" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#0f2623" stopOpacity="0.5" />
          </linearGradient>

          <filter
            id="shadowFilterDark"
            x="-20%"
            y="-20%"
            width="140%"
            height="140%"
          >
            <feDropShadow
              dx="0"
              dy="2"
              stdDeviation="4"
              floodColor="#000000"
              floodOpacity="0.5"
            />
          </filter>

          <filter id="cyanGlow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow
              dx="0"
              dy="0"
              stdDeviation="4"
              floodColor="#38bdf8"
              floodOpacity="0.6"
            />
          </filter>
        </defs>

        {/* 1. Dark Base Background #121419 */}
        <rect width="580" height="270" fill="#121419" />

        {/* Dark decorative park patch */}
        <path
          d="M 0 0 L 140 0 Q 180 50 150 100 Q 110 130 50 110 L 0 90 Z"
          fill="url(#mapParkDark)"
        />
        <path d="M 440 0 Q 480 30 580 20 L 580 0 Z" fill="url(#mapParkDark)" />

        {/* Dark decorative river curve */}
        <path
          d="M 0 240 Q 120 220 200 270 L 0 270 Z"
          fill="url(#mapWaterDark)"
        />

        {/* Subtle grid of city streets & arterial roads */}
        <g opacity="0.9">
          <line x1="0" y1="65" x2="580" y2="65" className="gmap-bg-road" />
          <line x1="0" y1="65" x2="580" y2="65" className="gmap-bg-arterial" />

          <line x1="0" y1="135" x2="580" y2="135" className="gmap-bg-road" />
          <line
            x1="0"
            y1="135"
            x2="580"
            y2="135"
            className="gmap-bg-arterial"
          />

          <line x1="0" y1="210" x2="580" y2="210" className="gmap-bg-road" />
          <line
            x1="0"
            y1="210"
            x2="580"
            y2="210"
            className="gmap-bg-arterial"
          />

          <line
            x1="70"
            y1="0"
            x2="70"
            y2="270"
            className="gmap-bg-road-subtle"
          />
          <line
            x1="170"
            y1="0"
            x2="170"
            y2="270"
            className="gmap-bg-road-subtle"
          />
          <line
            x1="280"
            y1="0"
            x2="280"
            y2="270"
            className="gmap-bg-road-subtle"
          />
          <line
            x1="400"
            y1="0"
            x2="400"
            y2="270"
            className="gmap-bg-road-subtle"
          />
          <line
            x1="510"
            y1="0"
            x2="510"
            y2="270"
            className="gmap-bg-road-subtle"
          />

          {/* Diagonal secondary avenue */}
          <path
            d="M 0 170 Q 240 140 580 90"
            stroke="#161b24"
            strokeWidth="5"
            fill="none"
          />
          <path
            d="M 0 170 Q 240 140 580 90"
            stroke="#222838"
            strokeWidth="2.5"
            fill="none"
          />
        </g>

        {/* 2. THE ROUTE NETWORK */}
        {/*
              ● Pickup (370, 50)
             /
        ●────  (210, 105) to (280, 105)
       /
  Warehouse ─────────● Transit (370, 160)
  (110, 160)           \
                        ● Delivered (470, 225)
        */}

        {/* Branch A: Pickup -> Checkpoint/Waypoint -> Warehouse */}
        <g>
          {/* Ambient cyan-blue glow casing */}
          <path
            d="M 370 50 L 280 105 L 210 105 L 110 160"
            className="gmap-route-glow"
          />
          {/* Main thin blue route line */}
          <path
            d="M 370 50 L 280 105 L 210 105 L 110 160"
            className="gmap-route-core"
          />
          {/* Small animated streaming dots */}
          <path
            d="M 370 50 L 280 105 L 210 105 L 110 160"
            className="gmap-animated-dots"
          />

          {/* Animated vehicle dot moving along Branch A */}
          <circle r="4.5" fill="#38bdf8" stroke="#ffffff" strokeWidth="1.5">
            <animateMotion
              path="M 370 50 L 280 105 L 210 105 L 110 160"
              dur="6s"
              repeatCount="indefinite"
            />
          </circle>
        </g>

        {/* Branch B: Warehouse -> Transit -> Delivered */}
        <g>
          {/* Ambient cyan-blue glow casing */}
          <path d="M 110 160 L 370 160 L 470 225" className="gmap-route-glow" />
          {/* Main thin blue route line */}
          <path d="M 110 160 L 370 160 L 470 225" className="gmap-route-core" />
          {/* Small animated streaming dots */}
          <path
            d="M 110 160 L 370 160 L 470 225"
            className="gmap-animated-dots-reverse"
          />

          {/* Animated vehicle dot moving along Branch B */}
          <circle r="4.5" fill="#60a5fa" stroke="#ffffff" strokeWidth="1.5">
            <animateMotion
              path="M 110 160 L 370 160 L 470 225"
              dur="7s"
              repeatCount="indefinite"
            />
          </circle>
        </g>

        {/* 3. RADAR / PULSING RINGS ON ACTIVE NODES */}
        <circle
          cx="110"
          cy="160"
          r="10"
          fill="none"
          stroke="#60a5fa"
          strokeWidth="1.5"
          className="gmap-pulse-ring"
        />
        <circle
          cx="210"
          cy="105"
          r="8"
          fill="none"
          stroke="#38bdf8"
          strokeWidth="1.2"
          className="gmap-pulse-ring"
        />
        <circle
          cx="370"
          cy="50"
          r="8"
          fill="none"
          stroke="#38bdf8"
          strokeWidth="1.2"
          className="gmap-pulse-ring"
        />
        <circle
          cx="370"
          cy="160"
          r="8"
          fill="none"
          stroke="#60a5fa"
          strokeWidth="1.2"
          className="gmap-pulse-ring"
        />
        <circle
          cx="470"
          cy="225"
          r="8"
          fill="none"
          stroke="#4ade80"
          strokeWidth="1.2"
          className="gmap-pulse-ring"
        />

        {/* 4. NODE DOTS & PIN MARKERS */}
        {/* Node 1: Warehouse (left side: (110, 160)) */}
        <g
          style={{ cursor: "pointer" }}
          onMouseEnter={() =>
            setActiveNode(nodes.find((n) => n.id === "warehouse"))
          }
          onMouseLeave={() => setActiveNode(null)}
        >
          {/* Node shadow & glowing core */}
          <circle
            cx="110"
            cy="160"
            r="9"
            fill="#1e3a8a"
            filter="url(#shadowFilterDark)"
          />
          <circle cx="110" cy="160" r="6" fill="#3b82f6" />
          <circle cx="110" cy="160" r="2.8" fill="#ffffff" />

          {/* Label: Warehouse dark card */}
          <rect
            x="20"
            y="145"
            width="78"
            height="30"
            rx="6"
            fill="#181c25"
            stroke="#283144"
            strokeWidth="1"
            filter="url(#shadowFilterDark)"
          />
          <text
            x="59"
            y="160"
            textAnchor="middle"
            dominantBaseline="central"
            fontSize="11.5"
            fontWeight="700"
            fill="#f1f5f9"
          >
            Warehouse
          </text>
          <text
            x="59"
            y="170"
            textAnchor="middle"
            dominantBaseline="central"
            fontSize="8"
            fontWeight="600"
            fill="#60a5fa"
          >
            MAIN HUB
          </text>
        </g>

        {/* Node 2: Checkpoint / Waypoint (210, 105) with horizontal bar extending to (280, 105) */}
        <g
          style={{ cursor: "pointer" }}
          onMouseEnter={() =>
            setActiveNode(nodes.find((n) => n.id === "waypoint"))
          }
          onMouseLeave={() => setActiveNode(null)}
        >
          {/* Waypoint Dot */}
          <circle
            cx="210"
            cy="105"
            r="7.5"
            fill="#0284c7"
            filter="url(#shadowFilterDark)"
          />
          <circle cx="210" cy="105" r="4.5" fill="#38bdf8" />
          <circle cx="210" cy="105" r="2" fill="#ffffff" />

          {/* Horizontal segment accent tick */}
          <circle cx="280" cy="105" r="4.5" fill="#38bdf8" />
          <circle cx="280" cy="105" r="2" fill="#ffffff" />

          {/* Subtle dark pill above waypoint */}
          <rect
            x="215"
            y="80"
            width="60"
            height="18"
            rx="9"
            fill="#181c25"
            stroke="#283144"
            strokeWidth="1"
          />
          <text
            x="245"
            y="90"
            textAnchor="middle"
            dominantBaseline="central"
            fontSize="9"
            fontWeight="600"
            fill="#94a3b8"
          >
            Waypoint
          </text>
        </g>

        {/* Node 3: Pickup (370, 50) */}
        <g
          style={{ cursor: "pointer" }}
          onMouseEnter={() =>
            setActiveNode(nodes.find((n) => n.id === "pickup"))
          }
          onMouseLeave={() => setActiveNode(null)}
        >
          {/* Pickup Dot ● */}
          <circle
            cx="370"
            cy="50"
            r="8"
            fill="#0369a1"
            filter="url(#shadowFilterDark)"
          />
          <circle cx="370" cy="50" r="5" fill="#38bdf8" />
          <circle cx="370" cy="50" r="2.5" fill="#ffffff" />

          {/* Label: ● Pickup dark badge */}
          <rect
            x="390"
            y="35"
            width="82"
            height="30"
            rx="6"
            fill="#181c25"
            stroke="#283144"
            strokeWidth="1"
            filter="url(#shadowFilterDark)"
          />
          <circle cx="403" cy="50" r="3.5" fill="#38bdf8" />
          <text x="414" y="46" fontSize="12" fontWeight="700" fill="#f1f5f9">
            Pickup
          </text>
          <text x="414" y="58" fontSize="8" fontWeight="600" fill="#38bdf8">
            ORIGIN
          </text>
        </g>

        {/* Node 4: Transit (370, 160) */}
        <g
          style={{ cursor: "pointer" }}
          onMouseEnter={() =>
            setActiveNode(nodes.find((n) => n.id === "transit"))
          }
          onMouseLeave={() => setActiveNode(null)}
        >
          {/* Transit Dot ● */}
          <circle
            cx="370"
            cy="160"
            r="8"
            fill="#1e40af"
            filter="url(#shadowFilterDark)"
          />
          <circle cx="370" cy="160" r="5" fill="#60a5fa" />
          <circle cx="370" cy="160" r="2.5" fill="#ffffff" />

          {/* Label: ● Transit dark badge */}
          <rect
            x="390"
            y="145"
            width="82"
            height="30"
            rx="6"
            fill="#181c25"
            stroke="#283144"
            strokeWidth="1"
            filter="url(#shadowFilterDark)"
          />
          <circle cx="403" cy="160" r="3.5" fill="#60a5fa" />
          <text x="414" y="156" fontSize="12" fontWeight="700" fill="#f1f5f9">
            Transit
          </text>
          <text x="414" y="168" fontSize="8" fontWeight="600" fill="#60a5fa">
            ON ROUTE
          </text>
        </g>

        {/* Node 5: Delivered (470, 225) */}
        <g
          style={{ cursor: "pointer" }}
          onMouseEnter={() =>
            setActiveNode(nodes.find((n) => n.id === "delivered"))
          }
          onMouseLeave={() => setActiveNode(null)}
        >
          {/* Delivered Dot ● */}
          <circle
            cx="470"
            cy="225"
            r="8.5"
            fill="#14532d"
            filter="url(#shadowFilterDark)"
          />
          <circle cx="470" cy="225" r="5" fill="#22c55e" />
          <circle cx="470" cy="225" r="2.5" fill="#ffffff" />

          {/* Label: ● Delivered dark badge */}
          <rect
            x="490"
            y="210"
            width="82"
            height="30"
            rx="6"
            fill="#181c25"
            stroke="#1c4731"
            strokeWidth="1"
            filter="url(#shadowFilterDark)"
          />
          <circle cx="503" cy="225" r="3.5" fill="#4ade80" />
          <text x="514" y="221" fontSize="12" fontWeight="700" fill="#4ade80">
            Delivered
          </text>
          <text x="514" y="233" fontSize="8" fontWeight="600" fill="#22c55e">
            COMPLETED
          </text>
        </g>
      </svg>

      {/* Floating Active Node Tooltip (when hovered) */}
      {activeNode &&
        (() => {
          // Safe positioning to ensure the tooltip is never clipped or shown outside
          const isNearTop = activeNode.y < 120;
          const isNearRight = activeNode.x > 430;
          const isNearLeft = activeNode.x < 130;

          const posX = `${(activeNode.x / 580) * 100}%`;
          const posY = `${(activeNode.y / 270) * 100}%`;
          const transX = isNearRight ? "-85%" : isNearLeft ? "-15%" : "-50%";
          // For nodes near the top (like Pickup at y: 50), position safely BELOW the node
          const transY = isNearTop ? "18px" : "-125%";

          return (
            <div
              className="gmap-tooltip"
              style={{
                left: posX,
                top: posY,
                transform: `translate(${transX}, ${transY})`,
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: "4px",
                }}
              >
                <span
                  style={{
                    fontWeight: "700",
                    color: activeNode.color,
                    fontSize: "12px",
                  }}
                >
                  {activeNode.name}
                </span>
                <span
                  style={{
                    fontSize: "10px",
                    padding: "2px 6px",
                    borderRadius: "4px",
                    background: activeNode.bgColor,
                    color: activeNode.color,
                    fontWeight: "600",
                  }}
                >
                  {activeNode.badge}
                </span>
              </div>
              <div
                style={{
                  color: "#94a3b8",
                  fontSize: "11px",
                  marginBottom: "2px",
                }}
              >
                {activeNode.subtitle}
              </div>
              <div
                style={{
                  fontWeight: "500",
                  color: "#f1f5f9",
                  fontSize: "11px",
                }}
              >
                Status: {activeNode.status}
              </div>
              <div
                style={{ color: "#64748b", fontSize: "10px", marginTop: "4px" }}
              >
                Timestamp: {activeNode.time}
              </div>
            </div>
          );
        })()}
    </div>
  );
}
