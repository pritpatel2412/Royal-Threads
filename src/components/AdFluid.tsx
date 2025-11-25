import { useEffect } from "react";

declare global {
  interface Window {
    adsbygoogle: any[];
  }
}

const AdFluid = () => {
  useEffect(() => {
    try {
      if (typeof window !== "undefined") {
        (window.adsbygoogle = window.adsbygoogle || []).push({});
      }
    } catch (e) {
      console.log("AdSense Fluid error:", e);
    }
  }, []);

  return (
    <ins
      className="adsbygoogle"
      style={{
        display: "block",
        width: "100%",
        textAlign: "center",
      }}
      data-ad-client="ca-pub-8074288228358823"
      data-ad-slot="8091852829"
      data-ad-format="fluid"
      data-ad-layout-key="-6t+ed+2i-1n-4w"
    ></ins>
  );
};

export default AdFluid;
