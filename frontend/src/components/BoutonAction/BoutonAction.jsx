import { Link } from "react-router-dom";
import styles from "./BoutonAction.module.css";

export default function Button({ to, onClick, variant = "primary", children, ...props }) {
  // Si `to` est fourni, on rend un <Link>, sinon un <button>
  const className = `${styles.btn} ${styles[variant] || ""}`;

  return to ? (
    <Link to={to} className={className} {...props}>
      {children}
    </Link>
  ) : (
    <button className={className} onClick={onClick} {...props}>
      {children}
    </button>
  );
}