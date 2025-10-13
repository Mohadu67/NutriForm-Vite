

import styles from "./Header.module.css";
import Navbar from "../Navbar/Navbar.jsx";
import Logo from "../Logo/Logo.jsx";
import TopBar from "../TopBar/TopBar.jsx";
import { Link } from "react-router-dom";

export default function Header() {

  return (
    <>
      <TopBar />
      <header className={styles.header}>
        <Link to="/" aria-label="Accueil Harmonith - Retour à l'accueil">
          <Logo className={styles.logo} />
        </Link>
        <Navbar />
      </header>
    </>
  );
}