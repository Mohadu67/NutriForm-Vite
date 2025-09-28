import { useEffect } from "react";

export default function AdSlot({ slot, format = "auto", responsive = "true" }) {
  useEffect(() => {
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch (e) {
      console.error("Adsense error:", e);
    }
  }, []);

  return (
    <ins
      className="adsbygoogle"
      style={{ display: "block" }}
      data-ad-client="ca-pub-1782627044363694"  // ton ID client AdSense
      data-ad-slot={slot}                       // l’ID du slot (AdSense te le donne pour chaque pub)
      data-ad-format={format}
      data-full-width-responsive={responsive}
    ></ins>
  );
}