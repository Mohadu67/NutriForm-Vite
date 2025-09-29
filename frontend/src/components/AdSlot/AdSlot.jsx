import { useEffect, useMemo, useRef, useState } from "react";
import styles from "./AdSlot.module.css";

export default function AdSlot({ slot, format = "auto", responsive = "true", className = "" }) {
  const insRef = useRef(null);
  const initializedRef = useRef(false);
  const [isEmpty, setIsEmpty] = useState(false);

  const containerClass = useMemo(() => {
    const classes = [styles.container, className];
    if (isEmpty) classes.push(styles.empty);
    return classes.filter(Boolean).join(" ");
  }, [className, isEmpty]);


  useEffect(() => {
    const tryPush = () => {
      if (initializedRef.current || !insRef.current) return;
      try {
        (window.adsbygoogle = window.adsbygoogle || []).push({});
        initializedRef.current = true;
      } catch (e) {
        console.error("Adsense error:", e);
      }
    };

    // If the script isn't present, inject it; otherwise, push immediately or on load
    let script = document.getElementById("adsbygoogle-script");
    if (!script) {
      script = document.createElement("script");
      script.id = "adsbygoogle-script";
      script.async = true;
      script.src = "https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-1782627044363694";
      script.crossOrigin = "anonymous";
      script.addEventListener("load", tryPush);
      document.head.appendChild(script);
    } else {
      if (window.adsbygoogle && Array.isArray(window.adsbygoogle)) {
        tryPush();
      } else {
        script.addEventListener("load", tryPush);
      }
    }

    const markIfEmpty = () => {
      if (!insRef.current) return;
      const hasIframe = !!insRef.current.querySelector("iframe");
      if (!hasIframe) setIsEmpty(true);
    };

    let observer;
    if (insRef.current) {
      observer = new MutationObserver(() => {
        if (insRef.current && insRef.current.querySelector("iframe")) {
          setIsEmpty(false);
          observer.disconnect();
        }
      });
      observer.observe(insRef.current, { childList: true, subtree: true });
    }

    const timeoutId = setTimeout(markIfEmpty, 2000);

    return () => {
      if (observer) observer.disconnect();
      clearTimeout(timeoutId);
    };
  }, []);


  return (
    <div className={containerClass}>
      <ins
        ref={insRef}
        className={`"adsbygoogle ${styles.slot}"`.trim()}
        style={{ display: "block" }}
        data-ad-client="ca-pub-1782627044363694"
        data-ad-slot={slot}
        data-ad-format={format}
        data-full-width-responsive={responsive}
        data-adtest="on"
      ></ins>
    </div>
  );
}
