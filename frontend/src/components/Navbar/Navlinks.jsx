import { memo } from "react";
import styles from "./Navbar.module.css";

function NavLinks({ links, currentPath, navItemsRefs, onHover }) {
  return (
    <>
      {links.map((link, index) => {
        const isActive = currentPath === link.path;
        const linkKey = link.id || link.path || `nav-link-${index}`;

        return (
          <li
            key={linkKey}
            ref={(el) => {
              if (navItemsRefs?.current) {
                navItemsRefs.current[index] = el;
              }
            }}
            className={`
              ${link.auth ? styles.authLink : ''}
              ${isActive ? styles.active : ''}
            `.trim()}
            onMouseEnter={() => onHover?.(index)}
            onMouseLeave={() => onHover?.(null)}
          >
            <a
              className={`${styles.navLink} ${link.auth ? styles.authLinkText : ''}`}
              href={link.path}
              onClick={(e) => {
                if (typeof link.onClick === "function") {
                  e.preventDefault();
                  e.stopPropagation();
                  link.onClick();
                }
              }}
              title={link.title || link.label}
              aria-current={isActive ? 'page' : undefined}
            >
              {link.label}
            </a>
          </li>
        );
      })}
    </>
  );
}

export default memo(NavLinks);
