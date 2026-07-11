"use client";

import Link from "next/link";
import { UserButton, useAuth } from "@clerk/nextjs";
import LocaleToggle from "./LocaleToggle";
import { useLocale } from "./LocaleProvider";

export default function AccountNav() {
  const { isLoaded, isSignedIn } = useAuth();
  const { t } = useLocale();
  return (
    <div className="account-nav">
      <LocaleToggle inverted />
      {(!isLoaded || !isSignedIn) && <Link href="/sign-in" className="account-sign-in">{t("signIn")}</Link>}
      {isLoaded && isSignedIn && <>
        <Link href="/app" className="account-app-link">{t("myParty")}</Link>
        <UserButton appearance={{ elements: { avatarBox: "account-avatar" } }} />
      </>}
    </div>
  );
}
