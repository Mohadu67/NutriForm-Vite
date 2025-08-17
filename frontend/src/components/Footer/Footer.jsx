import Logo from "../Logo/Logo";
import Navlinks from "../Navbar/Navlinks";
import SocialLinks from "../SocialLinks/SocialLinks";
import styles from "./Footer.module.css";
import { Link } from "react-router-dom";

const links = [
  { label: "IMC", path: "/IMC", special: true },
  { label: "Calorie", path: "/calorie", special: true },
  { label: "Contact", path: "/contact" },
  { label: "Connexion", path: "#login" },
];


export default function Footer() {
  return (
    <>
      <footer className={styles.footer}>
        <Logo className={styles.logo} />
        <ul>
          <Navlinks links={links} />
        </ul>
        <SocialLinks />
      </footer>
      <div className={styles.legalLinks}>
        <p>
          <Link to="/mentions-legales">MENTIONS LÉGALES</Link> | © 2025 Mohammed HAMIANI. Tous droits réservés.
        </p>
      </div>
    </>
  );
}