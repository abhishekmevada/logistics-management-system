import { useEffect } from "react";
import { useState } from "react";
import { Menu, X } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";

export default function Header() {
  const [navtoggle, setNavtoggle] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  const navigate = useNavigate();

  const handleGetStarted = () => {
    navigate("/");

    setTimeout(() => {
      const section = document.getElementById("customer");

      if (section) {
        section.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }
    }, 100);
  };

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > window.innerHeight);
    };

    window.addEventListener("scroll", handleScroll);

    const handleResize = () => {
      if (window.innerWidth >= 804) {
        setNavtoggle(true);
      } else {
        setNavtoggle(false);
      }
    };

    handleResize();

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  const openNav = () => {
    setNavtoggle(!navtoggle);
  };

  const clicklink = () => {
    if (window.innerWidth >= 804) {
      setNavtoggle(true);
    } else {
      setNavtoggle(false);
    }
  };
  return (
    <>
      <header className={`landingHeader  ${scrolled ? "navbarScrolled" : ""}`}>
        <h3>LOGO</h3>
        <p className="headerManu" onClick={openNav}>
          {navtoggle ? <X /> : <Menu />}
        </p>
        <nav
          className="headerNav"
          style={{ display: navtoggle ? "flex" : " none" }}
        >
          <Link to="/" onClick={clicklink} className="headerNavP">
            Home
          </Link>
          <Link to="/about" onClick={clicklink} className="headerNavP">
            About
          </Link>
          <Link to="/platform" onClick={clicklink} className="headerNavP">
            Platform
          </Link>
          <Link to="/contact" onClick={clicklink} className="headerNavP">
            Contact
          </Link>
          <a
            href="/#customer"
            onClick={handleGetStarted}
            className="ladingpageCtaa"
          >
            Track Shipment
          </a>
        </nav>
      </header>
    </>
  );
}
