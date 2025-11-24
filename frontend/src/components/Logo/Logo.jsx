

import { useState, useEffect } from "react";
import LogoAnimated from "./mascotte.jsx";
import styles from "./Logo.module.css";


export default function Logo() {
  const [isMobile, setIsMobile] = useState(
    typeof window !== "undefined" ? window.innerWidth < 768 : false
  );

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <LogoAnimated className={`${styles.logo} ${isMobile ? styles.mobile : styles.desktop}`} />
  );
}