"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { useLocale } from "@/app/components/LocaleProvider";
import LocaleToggle from "@/app/components/LocaleToggle";

export default function JoinByCodePage() { const [code, setCode] = useState(""); const { t } = useLocale(); const router = useRouter(); function submit(event: FormEvent) { event.preventDefault(); router.push(`/join/${code.trim().toUpperCase()}`); } return <main className="join-code-page"><Link href="/app">{t("backToParties")}</Link><div><LocaleToggle /><span className="app-kicker">{t("joinKicker")}</span><h1>{t("joinTitle")}</h1><form onSubmit={submit}><input value={code} onChange={(event) => setCode(event.target.value)} placeholder={t("joinPlaceholder")} required /><button>{t("joinOpen")}</button></form></div></main>; }
