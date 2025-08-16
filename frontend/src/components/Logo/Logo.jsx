// src/components/Logo/Logo.jsx

import { useState, useEffect } from "react";
import DeskLogo from "../../assets/img/logo/logo-complet.svg";
import MobiLogo from "../../assets/img/logo/domaine-logo.svg";
import styles from "./Logo.module.css";


export default function Logo({ alt = "NutriForm logo", className = "" }) {
  const [isMobile, setIsMobile] = useState(
    typeof window !== "undefined" ? window.innerWidth < 768 : false
  );

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <img
      src={isMobile ? MobiLogo : DeskLogo}
      alt={alt}
      className={`${styles.logo} ${isMobile ? styles.mobile : styles.desktop}`}
    />
  );
}