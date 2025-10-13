

import styles from "./Navbar.module.css";

export default function NavLinks({ links }) {
  return (
    <>
      {links.map((link) => (
        <li
          key={link.id || link.path || (typeof link.label === 'string' ? link.label : Math.random())}
          className={
            link.isIcon ? styles.iconLink : link.auth ? styles.authLink : link.special ? styles.org : ""
          }
        >
          {typeof link.onClick === "function" ? (
            <a
              className={
                link.isIcon ? styles.iconButton : link.auth ? styles.authLink : link.special ? styles.orange : ""
              }
              onClick={e => {
                e.preventDefault();
                e.stopPropagation();
                link.onClick();
              }}
              title={link.title}
            >
              {link.label}
            </a>
          ) : (
            <a
              className={
                link.isIcon ? styles.iconButton : link.auth ? styles.authLink : link.special ? styles.orange : ""
              }
              href={link.path}
              title={link.title}
            >
              {link.label}
            </a>
          )}
        </li>
      ))}
    </>
  );
}