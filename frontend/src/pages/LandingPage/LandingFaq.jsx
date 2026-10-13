import React, { useState, useMemo } from "react";
import Header from "./Header";
import Footer from "./Footer";
import { Link } from "react-router-dom";
import "../../styles/LandingFaq.css";
import {
  HelpCircle,
  Search,
  ChevronDown,
  ArrowRight,
  Headphones,
  Sparkles,
  X,
  Package,
  CreditCard,
  Truck,
  UserCheck,
  CheckCircle2,
  Clock,
  ShieldAlert,
} from "lucide-react";

const FAQ_DATA = [
  {
    id: "general",
    category: "General Questions",
    shortLabel: "General",
    icon: Sparkles,
    questions: [
      {
        id: "gen-1",
        question: "What is this Logistics Management System?",
        answer:
          "Our Logistics Management System helps businesses manage customers, shipments, drivers, vehicles, warehouse operations, deliveries, and invoices from one centralized platform.",
      },
      {
        id: "gen-2",
        question: "Who can use the platform?",
        answer:
          "The platform is designed for administrators, logistics managers, dispatchers, warehouse managers, drivers, and customers. Each role can access features based on its assigned permissions.",
      },
      {
        id: "gen-3",
        question: "Is the platform accessible online?",
        answer:
          "Yes, the platform is accessible through a web browser with an internet connection. Users can log in to access the features available for their assigned roles.",
      },
    ],
  },
  {
    id: "tracking",
    category: "Shipment & Tracking",
    shortLabel: "Shipment Tracking",
    icon: Package,
    questions: [
      {
        id: "track-1",
        question: "How can I track my shipment?",
        answer:
          "Use the shipment tracking feature and enter your shipment's tracking number, if tracking access is available. You can view the current shipment status and available tracking information.",
      },
      {
        id: "track-2",
        question: "What do the different shipment statuses mean?",
        answer:
          "Shipment statuses indicate the current stage of a shipment. Common statuses include Created, Pickup Scheduled, Picked Up, At Warehouse, Dispatched, In Transit, Out for Delivery, Delivered, and Failed Delivery.",
      },
      {
        id: "track-3",
        question: "Can I view my shipment history?",
        answer:
          "Yes, if shipment history is available for your account, you can view previous shipments and their recorded statuses and details based on your assigned permissions.",
      },
      {
        id: "track-4",
        question: "What should I do if my tracking information is not updated?",
        answer:
          "Tracking information may not update until the next shipment event is recorded. If the status remains unchanged for an extended period, contact your logistics administrator or support team.",
      },
    ],
  },
  {
    id: "costs",
    category: "Shipping Costs & Payments",
    shortLabel: "Shipping Costs",
    icon: CreditCard,
    questions: [
      {
        id: "cost-1",
        question: "How can I calculate my shipping cost?",
        answer:
          "Open the Shipping Cost Calculator, enter your pickup and delivery addresses, distance, package weight, dimensions, package count, and preferred delivery type, then submit the details to receive an estimated shipping cost.",
      },
      {
        id: "cost-2",
        question: "How is the shipping cost calculated?",
        answer:
          "The estimated shipping cost is calculated using chargeable weight, base freight charges, delivery priority surcharge, handling charges, fuel surcharge, distance charges, and applicable GST.",
      },
      {
        id: "cost-3",
        question: "What is volumetric weight?",
        answer:
          "Volumetric weight estimates the space a package occupies. It is calculated by multiplying the package length, width, and height in centimeters and dividing the result by 5000. Chargeable weight is the greater of actual weight and volumetric weight.",
      },
      {
        id: "cost-4",
        question: "Does the calculator show the final invoice amount?",
        answer:
          "No, the calculator provides an estimated shipping cost based on the information entered. The final invoice amount may differ depending on verified shipment details and applicable charges.",
      },
      {
        id: "cost-5",
        question: "Which delivery options are available?",
        answer:
          "The available delivery options are Standard, Express, Same-day, and Overnight. Availability may depend on the service offered for a particular shipment.",
      },
    ],
  },
  {
    id: "delivery",
    category: "Delivery & Proof of Delivery",
    shortLabel: "Delivery",
    icon: Truck,
    questions: [
      {
        id: "del-1",
        question: "How can I confirm that a shipment has been delivered?",
        answer:
          "A shipment is confirmed as delivered when its status is updated to Delivered by an authorized user after successful delivery.",
      },
      {
        id: "del-2",
        question: "What is Proof of Delivery (POD)?",
        answer:
          "Proof of Delivery (POD) is a record confirming that a shipment was delivered. Depending on the process, it may include the recipient's details, delivery date and time, signature, photograph, or other supporting information.",
      },
      {
        id: "del-3",
        question: "What happens if a delivery attempt fails?",
        answer:
          "If a delivery attempt fails, the shipment status can be updated to Failed Delivery, and the reason can be recorded where supported. The logistics team can then determine the appropriate next steps.",
      },
    ],
  },
  {
    id: "support",
    category: "Account & Technical Support",
    shortLabel: "Account Support",
    icon: UserCheck,
    questions: [
      {
        id: "sup-1",
        question: "How can I report a technical issue?",
        answer:
          "Contact your administrator or support team and describe the issue. Include the affected page, the steps that caused the problem, and any error message to help resolve it.",
      },
    ],
  },
];

export default function LandingFaq() {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");
  const [openQuestionIds, setOpenQuestionIds] = useState(new Set(["gen-1"]));

  const toggleQuestion = (id) => {
    setOpenQuestionIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  // Filter categories and questions
  const filteredCategories = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();

    return FAQ_DATA.map((cat) => {
      // Category filter check
      if (activeCategory !== "all" && cat.id !== activeCategory) {
        return null;
      }

      // Filter questions matching search query
      const matchingQuestions = cat.questions.filter((item) => {
        if (!q) return true;
        return (
          item.question.toLowerCase().includes(q) ||
          item.answer.toLowerCase().includes(q)
        );
      });

      if (matchingQuestions.length === 0) return null;

      return {
        ...cat,
        questions: matchingQuestions,
      };
    }).filter(Boolean);
  }, [searchQuery, activeCategory]);

  const totalResultsCount = useMemo(() => {
    return filteredCategories.reduce(
      (sum, cat) => sum + cat.questions.length,
      0,
    );
  }, [filteredCategories]);

  return (
    <>
      <Header />

      {/* 1. Hero Section matching LandingShipmentCost.jsx */}
      <section className="faqHeroSection">
        <div className="faqHeroOverlay"></div>
        <div className="faqHeroContent">
          <h1 className="faqHeroTitle">Got Questions? We’ve Got Answers.</h1>
          <p className="faqHeroSubtitle">
            Find answers to common questions about shipment tracking, shipping
            costs, delivery services, and managing your logistics operations—all
            in one place.
          </p>

          {/* 2. Search bar in Hero */}
          <div className="faqSearchWrapper">
            <Search className="faqSearchIcon" size={18} />
            <input
              type="text"
              placeholder="Search questions by keywords (e.g., tracking, cost, POD)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="faqSearchInput"
              aria-label="Search questions"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="faqSearchClearBtn"
                aria-label="Clear search"
              >
                <X size={16} />
              </button>
            )}
          </div>

          <div className="faqHeroFeatures">
            <span className="faqHeroFeatureItem">
              <CheckCircle2 size={14} className="text-emerald-500" /> Instant
              Answers
            </span>
            <span className="faqHeroFeatureItem">
              <Clock size={14} className="text-blue-500" /> 24/7 Platform Guides
            </span>
            <span className="faqHeroFeatureItem">
              <Headphones size={14} className="text-amber-500" /> Dedicated
              Support
            </span>
          </div>
        </div>
      </section>

      {/* Main FAQ Content Section */}
      <section className="faqMainSection">
        <div className="faqContainer">
          {/* 3. Category Filters */}
          <div
            className="faqCategoriesBar"
            role="tablist"
            aria-label="FAQ Categories"
          >
            <button
              type="button"
              className={`faqCategoryPill ${activeCategory === "all" ? "active" : ""}`}
              onClick={() => setActiveCategory("all")}
            >
              All Questions
            </button>
            {FAQ_DATA.map((cat) => {
              const IconComp = cat.icon;
              return (
                <button
                  key={cat.id}
                  type="button"
                  className={`faqCategoryPill ${
                    activeCategory === cat.id ? "active" : ""
                  }`}
                  onClick={() => setActiveCategory(cat.id)}
                >
                  <IconComp size={15} />
                  <span>{cat.shortLabel}</span>
                  <span className="faqPillCount">({cat.questions.length})</span>
                </button>
              );
            })}
          </div>

          {/* Search Results Meta Indicator */}
          {searchQuery && (
            <div className="faqSearchMeta">
              <span>
                Found <strong>{totalResultsCount}</strong>{" "}
                {totalResultsCount === 1 ? "answer" : "answers"} for "
                <em>{searchQuery}</em>"
              </span>
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="faqSearchResetLink"
              >
                Reset search
              </button>
            </div>
          )}

          {/* 4. Expandable Accordion Questions */}
          {filteredCategories.length > 0 ? (
            <div className="faqCategoriesList">
              {filteredCategories.map((cat) => (
                <div key={cat.id} className="faqCategoryGroup">
                  <div className="faqCategoryGroupHeader">
                    <cat.icon size={20} className="text-blue-600 shrink-0" />
                    <h2 className="faqCategoryGroupTitle">{cat.category}</h2>
                    <span className="faqCategoryGroupCount">
                      {cat.questions.length}{" "}
                      {cat.questions.length === 1 ? "question" : "questions"}
                    </span>
                  </div>

                  <div className="faqAccordionList">
                    {cat.questions.map((item) => {
                      const isOpen = openQuestionIds.has(item.id);
                      return (
                        <div
                          key={item.id}
                          className={`faqAccordionItem ${isOpen ? "open" : ""}`}
                        >
                          <button
                            type="button"
                            className="faqAccordionQuestionBtn"
                            onClick={() => toggleQuestion(item.id)}
                            aria-expanded={isOpen}
                          >
                            <span className="faqQuestionText">
                              {item.question}
                            </span>
                            <div className="faqChevronWrapper">
                              <ChevronDown
                                size={18}
                                className={`faqChevronIcon ${isOpen ? "rotate" : ""}`}
                              />
                            </div>
                          </button>

                          {isOpen && (
                            <div className="faqAccordionAnswer">
                              <p className="faqAnswerText">{item.answer}</p>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="faqEmptyState">
              <ShieldAlert size={42} className="text-gray-400 mb-2" />
              <h3>No matching questions found</h3>
              <p>
                We couldn't find any results matching "
                <strong>{searchQuery}</strong>". Try searching with different
                keywords or browse our categories.
              </p>
              <button
                type="button"
                onClick={() => {
                  setSearchQuery("");
                  setActiveCategory("all");
                }}
                className="faqEmptyResetBtn"
              >
                View All FAQs
              </button>
            </div>
          )}

          {/* 5. Contact Support Section */}
          <div className="faqContactSection">
            <div className="faqContactCard">
              <div className="faqContactIconBox">
                <Headphones size={28} />
              </div>
              <div className="faqContactContent">
                <h3 className="faqContactTitle">Still have questions?</h3>
                <p className="faqContactSubtitle">
                  Can’t find the answer you’re looking for? Reach out to our
                  dedicated logistics support team. We're here to help you
                  coordinate shipments and troubleshoot any issues.
                </p>
              </div>
              <Link to="/contact" className="faqContactButton">
                Contact Support <ArrowRight size={16} />
              </Link>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </>
  );
}
