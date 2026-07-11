"use client";

import { useEffect, useState } from "react";
import { useLocale } from "./LocaleProvider";

type InstallPromptEvent = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: "accepted" | "dismissed" }> };

export default function InstallButton() {
  const [prompt, setPrompt] = useState<InstallPromptEvent | null>(null);
  const [hint, setHint] = useState("");
  const { t } = useLocale();

  useEffect(() => {
    const capture = (event: Event) => { event.preventDefault(); setPrompt(event as InstallPromptEvent); };
    window.addEventListener("beforeinstallprompt", capture);
    return () => window.removeEventListener("beforeinstallprompt", capture);
  }, []);

  async function install() {
    if (prompt) {
      await prompt.prompt();
      const choice = await prompt.userChoice;
      if (choice.outcome === "accepted") setPrompt(null);
      return;
    }
    setHint(t("installHint"));
  }

  return <div className="install-control"><button type="button" onClick={install}>{t("installBtn")}</button>{hint && <span role="status">{hint}</span>}</div>;
}
