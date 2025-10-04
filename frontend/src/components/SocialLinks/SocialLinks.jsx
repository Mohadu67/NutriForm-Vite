import styles from "./SocialLinks.module.css";
import { FaFacebook, FaInstagram, FaTwitter, FaLinkedin } from "react-icons/fa";

export default function SocialLinks({ className = "" }) {
  return (
    <div className={`${styles.social} ${className}`}>
      <a
        href="https://facebook.com"
        target="_blank"
        rel="noopener noreferrer nofollow"
        aria-label="Facebook"
      >
        <FaFacebook />
      </a>
      <a
        href="https://www.instagram.com/harmonith.fr?igsh=MWtiMmt0YmhhMWVhMA%3D%3D&utm_source=qr"
        target="_blank"
        rel="noopener noreferrer nofollow"
        aria-label="Instagram"
      >
        <FaInstagram />
      </a>
      <a
        href="https://twitter.com"
        target="_blank"
        rel="noopener noreferrer nofollow"
        aria-label="Twitter"
      >
        <FaTwitter />
      </a>
      <a
        href="https://linkedin.com/company/harmonith"
        target="_blank"
        rel="noopener noreferrer nofollow"
        aria-label="LinkedIn"
      >
        <FaLinkedin />
      </a>
    </div>
  );
}
