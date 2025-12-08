import React, { useEffect, useMemo, useRef, useState } from "react";
import { storage } from '../../shared/utils/storage';
import { Link, useLocation } from "react-router-dom";

import Logo from "../Logo/Logo";
import NavLinks from "../Navbar/Navlinks.jsx";
import PopupUser from "../Auth/PopupUser.jsx";
import SocialLinks from "../SocialLinks/SocialLinks";
import Newsletter from "../Newsletter/Newsletter.jsx";
import ReviewsCarousel from "../ReviewsCarousel/ReviewsCarousel.jsx";
import UserReviews from "../UserReviews/UserReviews.jsx";
import AboutUs from "./AboutUs/AboutUs.jsx";
import styles from "./Footer.module.css";

export default function Footer() {
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [popupView, setPopupView] = useState("login");
  const [isLoggedIn, setIsLoggedIn] = useState(() => {
    if (typeof window === "undefined") {
      return false;
    }
    return !!storage.get("user");
  });
  const location = useLocation();

  const CORE_LINKS = [
    { label: "Outils", path: "/outils", special: true },
    { label: "Exercices", path: "/exo", special: true },
    { label: "Contact", path: "/contact" },
  ];

  useEffect(() => {
    const onStorage = () => setIsLoggedIn(!!storage.get("user"));
    window.addEventListener("storage", onStorage);

    onStorage();
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const path = (location.pathname || "/").toLowerCase();
  const isHomePage = path === "/";

  const links = useMemo(() => {
    const connexion = isLoggedIn
      ? { label: "Historique", auth: true, onClick: () => { setPopupView("history"); setIsPopupOpen(true); } }
      : { label: "Connexion", auth: true, onClick: () => { setPopupView("login"); setIsPopupOpen(true); } };

    if (path === "/") {
      return [...CORE_LINKS, connexion];
    }

    const filtered = CORE_LINKS.filter((link) => link.path !== path);
    return [{ label: "Accueil", path: "/" }, ...filtered, connexion];
  }, [isLoggedIn, path, CORE_LINKS]);

  const linkListRef = useRef(null);
  const [linksVisible, setLinksVisible] = useState(false);

  useEffect(() => {
    const node = linkListRef.current;
    if (!node) {
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setLinksVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.2 }
    );

    observer.observe(node);

    return () => observer.disconnect();
  }, []);

  return (
    <>
      {isHomePage && (
        <>
          <Newsletter />
          <ReviewsCarousel />
          <UserReviews />
          <AboutUs />
        </>
      )}

      <footer className={styles.footer}>
        <div className={styles.inner}>
          <div className={styles.brand}>
            <Logo className={styles.logo} />
            <p className={styles.tagline}>
              Ton partenaire fitness pour atteindre tes objectifs santé et bien-être
            </p>
          </div>

          <nav className={styles.navigation} aria-label="Navigation pied de page">
            <h3 className={styles.sectionTitle}>Liens rapides</h3>
            <ul
              ref={linkListRef}
              className={`${styles.linkList} ${linksVisible ? styles.linkListVisible : ""}`}
            >
              <NavLinks links={links} />
            </ul>
          </nav>

          <div className={styles.socialBlock}>
            <h3 className={styles.sectionTitle}>Suivez-nous</h3>
            <SocialLinks className={styles.socialList} />
          </div>
        </div>

        <div className={styles.legal}>
          <p>
            <Link to="/mentions-legales">Mentions légales</Link> · © 2025 Mohammed HAMIANI. Tous droits réservés.
          </p>
        </div>
      </footer>

      {isPopupOpen && (
        <PopupUser
          open={isPopupOpen}
          view={popupView}
          setView={setPopupView}
          onClose={() => setIsPopupOpen(false)}
          onLoginSuccess={() => { setPopupView("history"); setIsPopupOpen(true); setIsLoggedIn(true); }}
          onLogout={() => { setIsLoggedIn(false); setPopupView("login"); setIsPopupOpen(false); }}
        />
      )}
    </>
  );
}
