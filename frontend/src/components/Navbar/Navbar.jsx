// src/components/Navbar/Navbar.jsx

import React, { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import styles from "./Navbar.module.css";
import NavLinks from "./Navlinks.jsx";
import PopupUser from "../Auth/PopupUser.jsx";

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [popupView, setPopupView] = useState("login");
  const [isLoggedIn, setIsLoggedIn] = useState(() => !!localStorage.getItem('token'));
  const location = useLocation();

  const path = (location.pathname || "/").toLowerCase();

  React.useEffect(() => {
    const onStorage = () => setIsLoggedIn(!!localStorage.getItem('token'));
    window.addEventListener('storage', onStorage);

    onStorage();
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const core = [
    { label: "IMC", path: "/imc", special: true },
    { label: "Calorie", path: "/calorie", special: true },
    { label: "Contact", path: "/contact" },
  ];

  const connexion = isLoggedIn
    ? { label: "Voir historique", onClick: () => { setPopupView('history'); setIsPopupOpen(true); } }
    : { label: "Connexion", onClick: () => { setPopupView('login'); setIsPopupOpen(true); } };

  let dynamicLinks;
  if (path === "/") {
    dynamicLinks = [...core, connexion];
  } else {
    const filtered = core.filter((l) => l.path !== path);
    dynamicLinks = [{ label: "Accueil", path: "/" }, ...filtered, connexion];
  }

  return (
    <>
      <nav className={styles.header}>
        <ul
          className={`${styles.burger} ${open ? styles.open : "linkOrange"}`}
          onClick={(e) => {
            const interactive = e.target.closest('a, button, [role="button"], input, label');
            if (interactive) return;
            setOpen(!open);
          }}
        >
          <NavLinks links={dynamicLinks} />
        </ul>
      </nav>
      {isPopupOpen && (
        <PopupUser
          open={isPopupOpen}
          view={popupView}
          setView={setPopupView}
          onClose={() => setIsPopupOpen(false)}
          onLoginSuccess={() => { setPopupView('history'); setIsPopupOpen(true); setIsLoggedIn(true); }}
          onLogout={() => { setIsLoggedIn(false); setPopupView('login'); setIsPopupOpen(false); }}
        />
      )}
    </>
  );
}