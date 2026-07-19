"use client";

import { useEffect } from "react";

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    void fetch("/api/telemetry/errors", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ route: window.location.pathname, name: error.name, message: error.message, digest: error.digest }),
      keepalive: true,
    });
  }, [error]);

  return <html lang="ru"><body><main className="error-page"><section><span>TUSA.game</span><h1>Что-то пошло не так</h1><p>Ошибка уже записана. Обновите экран и продолжайте тусу.</p><button type="button" onClick={reset}>Попробовать снова</button></section></main></body></html>;
}
