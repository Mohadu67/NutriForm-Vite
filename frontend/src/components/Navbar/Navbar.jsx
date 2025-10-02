// src/components/Navbar/Navbar.jsx

import React, { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import styles from "./Navbar.module.css";
import NavLinks from "./Navlinks.jsx";
import PopupUser from "../Auth/PopupUser.jsx";

// Bootstrap Icons SVG
const PersonCircle = ({ size = 24 }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} fill="currentColor" viewBox="0 0 16 16">
    <path d="M11 6a3 3 0 1 1-6 0 3 3 0 0 1 6 0"/>
    <path fillRule="evenodd" d="M0 8a8 8 0 1 1 16 0A8 8 0 0 1 0 8m8-7a7 7 0 0 0-5.468 11.37C3.242 11.226 4.805 10 8 10s4.757 1.225 5.468 2.37A7 7 0 0 0 8 1"/>
  </svg>
);

const BoxArrowRight = ({ size = 24 }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} fill="currentColor" viewBox="0 0 16 16">
    <path fillRule="evenodd" d="M10 12.5a.5.5 0 0 1-.5.5h-8a.5.5 0 0 1-.5-.5v-9a.5.5 0 0 1 .5-.5h8a.5.5 0 0 1 .5.5v2a.5.5 0 0 0 1 0v-2A1.5 1.5 0 0 0 9.5 2h-8A1.5 1.5 0 0 0 0 3.5v9A1.5 1.5 0 0 0 1.5 14h8a1.5 1.5 0 0 0 1.5-1.5v-2a.5.5 0 0 0-1 0z"/>
    <path fillRule="evenodd" d="M15.854 8.354a.5.5 0 0 0 0-.708l-3-3a.5.5 0 0 0-.708.708L14.293 7.5H5.5a.5.5 0 0 0 0 1h8.793l-2.147 2.146a.5.5 0 0 0 .708.708z"/>
  </svg>
);

const ClipboardData = ({ size = 24 }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} fill="currentColor" viewBox="0 0 16 16">
    <path d="M4 11a1 1 0 1 1 2 0v1a1 1 0 1 1-2 0zm6-4a1 1 0 1 1 2 0v5a1 1 0 1 1-2 0zM7 9a1 1 0 0 1 2 0v3a1 1 0 1 1-2 0z"/>
    <path d="M4 1.5H3a2 2 0 0 0-2 2V14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V3.5a2 2 0 0 0-2-2h-1v1h1a1 1 0 0 1 1 1V14a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V3.5a1 1 0 0 1 1-1h1z"/>
    <path d="M9.5 1a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5h-3a.5.5 0 0 1-.5-.5v-1a.5.5 0 0 1 .5-.5zm-3-1A1.5 1.5 0 0 0 5 1.5v1A1.5 1.5 0 0 0 6.5 4h3A1.5 1.5 0 0 0 11 2.5v-1A1.5 1.5 0 0 0 9.5 0z"/>
  </svg>
);

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
    { label: "Outils", path: "/outils", special: true },
    { label: "S'entrainer", path: "/exo", special: true },
    { label: "Contact", path: "/contact" },
  ];

  const authIcons = isLoggedIn
    ? [
        { id: "history", label: <ClipboardData size={24} />, auth: true, isIcon: true, onClick: () => { setPopupView('history'); setIsPopupOpen(true); }, title: "Historique" },
        { id: "logout", label: <BoxArrowRight size={24} />, auth: true, isIcon: true, onClick: () => { localStorage.removeItem('token'); setIsLoggedIn(false); window.dispatchEvent(new Event('storage')); }, title: "Déconnexion" }
      ]
    : [{ id: "login", label: <PersonCircle size={24} />, auth: true, isIcon: true, onClick: () => { setPopupView('login'); setIsPopupOpen(true); }, title: "Connexion" }];

  let dynamicLinks;
  if (path === "/") {
    dynamicLinks = [...core, ...authIcons];
  } else {
    const filtered = core.filter((l) => l.path !== path);
    dynamicLinks = [{ label: "Accueil", path: "/" }, ...filtered, ...authIcons];
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
          <NavLinks links={dynamicLinks.filter(link => !link.isIcon)} />
          <div className={styles.iconsRow}>
            <NavLinks links={dynamicLinks.filter(link => link.isIcon)} />
          </div>
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