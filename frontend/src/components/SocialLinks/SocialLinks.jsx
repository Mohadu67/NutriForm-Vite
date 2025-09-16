import styles from "./SocialLinks.module.css";
import { FaFacebook, FaInstagram, FaTwitter, FaLinkedin } from "react-icons/fa";

export default function SocialLinks({ className = "" }) {
  return (
    <div>

        <div className={`${styles.social} ${className}`}>
            <a href="https://facebook.com" target="_blank" rel="noopener noreferrer nofollow" aria-label="Facebook">
                <FaFacebook />
            </a>
            <a href="https://instagram.com" target="_blank" rel="noopener noreferre nofollow" aria-label="Instagram">
                <FaInstagram />
            </a>
        </div>

        <div className={`${styles.social} ${className}`}>            <a href="https://twitter.com" target="_blank" rel="noopener noreferrer nofollow" aria-label="Twitter">
                <FaTwitter />
            </a>
            <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer nofollow" aria-label="LinkedIn">
                <FaLinkedin />
            </a>
        </div>

    </div>
  );
}