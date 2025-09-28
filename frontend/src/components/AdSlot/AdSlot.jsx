import { useEffect, useMemo } from "react";
import styles from "./AdSlot.module.css";

export default function AdSlot({ slot, format = "auto", responsive = "true", className = "" }) {
  useEffect(() => {
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch (e) {
      console.error("Adsense error:", e);
    }
  }, []);

  const containerClass = useMemo(
    () => [styles.container, className].filter(Boolean).join(" "),
    [className]
  );

  return (
    <div className={containerClass}>
      <ins
        className={`adsbygoogle ${styles.slot}`.trim()}
        data-ad-client="ca-pub-1782627044363694"
        data-ad-slot={slot}
        data-ad-format={format}
        data-full-width-responsive={responsive}
      ></ins>
    </div>
  );
}
