"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function RedirectManager({
  slug,
  locale,
}: {
  slug: string;
  locale: string;
}) {
  const router = useRouter();
  const [progress, setProgress] = useState(0);
  const isEn = locale === "en";

  useEffect(() => {
    // Increment progress bar over 1.2 seconds
    const duration = 1200;
    const intervalTime = 30;
    const steps = duration / intervalTime;
    let currentStep = 0;

    const timer = setInterval(() => {
      currentStep++;
      const nextProgress = Math.min((currentStep / steps) * 100, 100);
      setProgress(nextProgress);

      if (currentStep >= steps) {
        clearInterval(timer);
        router.replace(`/?ref=guide-${slug}`);
      }
    }, intervalTime);

    return () => clearInterval(timer);
  }, [slug, router]);

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        backgroundColor: "var(--bg, #0d0d0d)",
        zIndex: 9999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "20px",
        fontFamily: "var(--font-mono), monospace",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "480px",
          backgroundColor: "var(--cream, #f7f7f2)",
          border: "var(--line, 3px solid #000)",
          boxShadow: "var(--shadow, 6px 6px 0 #000)",
          padding: "30px",
          color: "var(--black, #000)",
          textAlign: "center",
        }}
      >
        <div
          style={{
            fontSize: "24px",
            fontWeight: 800,
            textTransform: "uppercase",
            marginBottom: "15px",
            fontFamily: "var(--font-unbounded), sans-serif",
            letterSpacing: "-0.5px",
          }}
        >
          {isEn ? "Entering TUSA.game" : "Входим в TUSA.game"}
        </div>
        <p style={{ fontSize: "14px", margin: "0 0 20px 0" }}>
          {isEn
            ? "Redirecting you to the party room..."
            : "Перенаправляем вас в комнату тусовки..."}
        </p>

        {/* Brutalist Progress Bar */}
        <div
          style={{
            height: "24px",
            backgroundColor: "var(--white, #fff)",
            border: "var(--line, 3px solid #000)",
            position: "relative",
            overflow: "hidden",
            marginBottom: "20px",
          }}
        >
          <div
            style={{
              height: "100%",
              width: `${progress}%`,
              backgroundColor: "var(--lime, #c9ff05)",
              transition: "width 30ms linear",
            }}
          />
        </div>

        <a
          href={`/?ref=guide-${slug}`}
          style={{
            display: "inline-block",
            fontSize: "12px",
            textDecoration: "underline",
            color: "var(--black, #000)",
            fontWeight: "bold",
            cursor: "pointer",
          }}
        >
          {isEn ? "Click here if not redirected" : "Нажмите здесь, если нет перенаправления"}
        </a>
      </div>
    </div>
  );
}
