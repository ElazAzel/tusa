import Link from "next/link";
import type { ReactNode } from "react";
import BrandLogo from "./BrandLogo";
import LocaleToggle from "./LocaleToggle";

type ProductHeaderProps = {
  backHref?: string;
  backLabel?: string;
  children?: ReactNode;
  className?: string;
  showLocale?: boolean;
};

export default function ProductHeader({ backHref, backLabel, children, className = "", showLocale = true }: ProductHeaderProps) {
  return (
    <header className={`product-header ${className}`.trim()}>
      <Link className="product-header__brand" href="/app" aria-label="TUSA.game"><BrandLogo priority /></Link>
      {children ? <nav className="product-header__nav" aria-label="Product navigation">{children}</nav> : <span className="product-header__spacer" />}
      <div className="product-header__actions">
        {backHref && <Link className="product-header__back" href={backHref}><span aria-hidden="true">←</span>{backLabel}</Link>}
        {showLocale && <LocaleToggle />}
      </div>
    </header>
  );
}
