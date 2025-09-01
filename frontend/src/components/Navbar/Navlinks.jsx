// src/components/Navbar/NavLinks.jsx

import styles from "./Navbar.module.css";

export default function NavLinks({ links }) {
  return (
    <>
      {links.map((link, index) => (
        <li
          key={index}
          className={
            link.auth ? styles.authLink : link.special ? styles.org : ""
          }
        >
          {typeof link.onClick === "function" ? (
            <a
              className={
                link.auth ? styles.authLink : link.special ? styles.orange : ""
              }
              onClick={e => {
                e.preventDefault();
                e.stopPropagation();
                link.onClick();
              }}
            >
              {link.label}
            </a>
          ) : (
            <a
              className={
                link.auth ? styles.authLink : link.special ? styles.orange : ""
              }
              href={link.path}
            >
              {link.label}
            </a>
          )}
        </li>
      ))}
    </>
  );
}