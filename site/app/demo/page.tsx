"use client";

import dynamic from "next/dynamic";

const DemoApp = dynamic(() => import("./DemoApp"), {
  ssr: false,
  loading: () => <main className="demo-loading">Загружаем тусу…</main>,
});

export default function DemoPage() {
  return <DemoApp />;
}
