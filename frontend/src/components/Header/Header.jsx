
import { memo } from "react";
import { Link } from "react-router-dom";
import Navbar from "../Navbar/Navbar.jsx";
import Logo from "../Logo/Logo.jsx";
import styles from "./Header.module.css";

function Header() {
  return (
    <header className={styles.header}>
      <Navbar />
    </header>
  );
}

export default memo(Header);