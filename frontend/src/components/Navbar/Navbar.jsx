

import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import styles from "./Navbar.module.css";
import NavLinks from "./Navlinks.jsx";

export default function Navbar() {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const path = (location.pathname || "/").toLowerCase();

  const handleScroll = (targetPath, sectionId) => {
    if (path === targetPath) {
      
      const element = document.getElementById(sectionId);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    } else {
      
      navigate(targetPath);
      setTimeout(() => {
        const element = document.getElementById(sectionId);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 100);
    }
  };

  const getStoredUser = () => {
    if (typeof window === 'undefined') return null;
    try {
      return localStorage.getItem('user');
    } catch (error) {
      return null;
    }
  };

  useEffect(() => {
    const updateLoginState = () => {
      setIsLoggedIn(Boolean(getStoredUser()));
    };

    updateLoginState();
    window.addEventListener('storage', updateLoginState);

    return () => window.removeEventListener('storage', updateLoginState);
  }, []);

  const coreLinks = [
    {
      label: t('nav.tools'),
      path: "/outils",
      special: true,
      onClick: () => handleScroll("/outils", "outils")
    },
    { label: t('nav.exercises'), path: "/exo", special: true },
    {
      label: t('nav.contact'),
      path: "/contact",
      onClick: () => handleScroll("/contact", "contact-form")
    },
    ...(isLoggedIn ? [{
      label: 'Dashboard',
      path: "/dashboard",
      auth: true,
      onClick: () => navigate('/dashboard')
    }] : [])
  ];

  const links = path === "/"
    ? coreLinks
    : [{ label: t('nav.home'), path: "/" }, ...coreLinks.filter((link) => link.path !== path)];

  return (
    <nav className={styles.header}>
      <ul
        className={`${styles.burger} ${open ? styles.open : "linkOrange"}`}
        onClick={(e) => {
          const interactive = e.target.closest('a, button, [role="button"], input, label');
          if (interactive) return;
          setOpen(!open);
        }}
      >
        <NavLinks links={links} />
      </ul>
    </nav>
  );
}
