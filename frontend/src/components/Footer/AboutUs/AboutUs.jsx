import { useState, useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";
import styles from "./AboutUs.module.css";

const resolveLocaleContent = (data, language) => {
  if (!data || typeof data !== "object") return null;
  if (!language) language = "en";
  const normalized = language.toLowerCase();
  const candidates = [
    normalized,
    normalized.split("-")[0],
    "en",
    Object.keys(data)[0],
  ];

  for (const key of candidates) {
    if (key && data[key]) {
      return data[key];
    }
  }
  return null;
};

export default function AboutUs() {
  const { i18n } = useTranslation();
  const [rawData, setRawData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    fetch("/data/about.json")
      .then((res) => res.json())
      .then((json) => {
        if (!isMounted) return;
        setRawData(json);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to load about data:", err);
        if (isMounted) {
          setRawData(null);
          setLoading(false);
        }
      });
    return () => {
      isMounted = false;
    };
  }, []);

  const content = useMemo(() => {
    if (!rawData) return null;
    return resolveLocaleContent(rawData, i18n.language);
  }, [rawData, i18n.language]);

  if (loading) return null;
  if (!content) return null;

  const { title, subtitle, description, stats, values, team, teamTitle } = content;

  const hasTeam = Array.isArray(team) && team.some((member) => member?.name);
  const hasStats = Array.isArray(stats) && stats.some((stat) => stat?.value);
  const hasValues = Array.isArray(values) && values.some((value) => value?.title);
  const hasHeader = title || subtitle;
  const hasDescription = Boolean(description);

  if (!hasHeader && !hasDescription && !hasStats && !hasValues && !hasTeam) {
    return null;
  }

  return (
    <section className={styles.aboutSection}>
      <div className={styles.container}>
        {hasHeader && (
          <div className={styles.header}>
            {title && <h2 className={styles.title}>{title}</h2>}
            {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
          </div>
        )}

        {hasDescription && <p className={styles.description}>{description}</p>}

        {hasStats && (
          <div className={styles.statsGrid}>
            {stats
              .filter((stat) => stat?.value)
              .map((stat, idx) => (
                <div key={`${stat.label}-${idx}`} className={styles.statCard}>
                  {stat.icon && (
                    <span className={styles.statIcon} aria-hidden="true">
                      {stat.icon}
                    </span>
                  )}
                  <div className={styles.statValue}>{stat.value}</div>
                  {stat.label && (
                    <div className={styles.statLabel}>{stat.label}</div>
                  )}
                </div>
              ))}
          </div>
        )}

        {hasValues && (
          <div className={styles.valuesGrid}>
            {values
              .filter((value) => value?.title)
              .map((value, idx) => (
                <div key={`${value.title}-${idx}`} className={styles.valueCard}>
                  {value.icon && (
                    <span className={styles.valueIcon} aria-hidden="true">
                      {value.icon}
                    </span>
                  )}
                  <h3 className={styles.valueTitle}>{value.title}</h3>
                  {value.description && (
                    <p className={styles.valueDescription}>{value.description}</p>
                  )}
                </div>
              ))}
          </div>
        )}

        {hasTeam && (
          <div className={styles.teamSection}>
            <h3 className={styles.teamTitle}>{teamTitle || title}</h3>
            <div className={styles.teamGrid}>
              {team
                .filter((member) => member?.name)
                .map((member) => (
                  <div key={member.id || member.name} className={styles.memberCard}>
                    <div className={styles.memberPhoto}>
                      {member.photo ? (
                        <img src={member.photo} alt={member.name} />
                      ) : (
                        <div className={styles.memberInitial}>
                          {member.name.charAt(0).toUpperCase()}
                        </div>
                      )}
                    </div>
                    <div className={styles.memberInfo}>
                      <h4 className={styles.memberName}>{member.name}</h4>
                      {member.role && (
                        <p className={styles.memberRole}>{member.role}</p>
                      )}
                      {member.bio && (
                        <p className={styles.memberBio}>{member.bio}</p>
                      )}
                      {member.socials && (
                        <div className={styles.memberSocials}>
                          {member.socials.linkedin && (
                            <a
                              href={member.socials.linkedin}
                              target="_blank"
                              rel="noopener noreferrer"
                              aria-label="LinkedIn"
                            >
                              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
                              </svg>
                            </a>
                          )}
                          {member.socials.twitter && (
                            <a
                              href={member.socials.twitter}
                              target="_blank"
                              rel="noopener noreferrer"
                              aria-label="Twitter"
                            >
                              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M23 3a10.9 10.9 0 01-3.14 1.53 4.48 4.48 0 00-7.86 3v1A10.66 10.66 0 013 4s-4 9 5 13a11.64 11.64 0 01-7 2c9 5 20 0 20-11.5a4.5 4.5 0 00-.08-.83A7.72 7.72 0 0023 3z" />
                              </svg>
                            </a>
                          )}
                          {member.socials.instagram && (
                            <a
                              href={member.socials.instagram}
                              target="_blank"
                              rel="noopener noreferrer"
                              aria-label="Instagram"
                            >
                              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                              </svg>
                            </a>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
