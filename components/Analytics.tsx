"use client";

import Script from "next/script";
import { useEffect, useState } from "react";
import {
  POLICY_CONSENT_EVENT,
  POLICY_CONSENT_KEY,
} from "./PolicyConsent";

export default function Analytics() {
  const id = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;
  const [consented, setConsented] = useState(false);

  useEffect(() => {
    const readConsent = () => {
      setConsented(localStorage.getItem(POLICY_CONSENT_KEY) === "accepted");
    };

    readConsent();
    window.addEventListener(POLICY_CONSENT_EVENT, readConsent);
    return () => window.removeEventListener(POLICY_CONSENT_EVENT, readConsent);
  }, []);

  if (!id || !consented) return null;

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${id}`}
        strategy="afterInteractive"
      />
      <Script id="google-analytics" strategy="afterInteractive">{`
        window.dataLayer = window.dataLayer || [];
        function gtag(){dataLayer.push(arguments);}
        gtag('js', new Date());
        gtag('config', '${id}', { anonymize_ip: true });
      `}</Script>
    </>
  );
}
