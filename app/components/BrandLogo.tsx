import Image from "next/image";

type BrandLogoProps = {
  compact?: boolean;
  className?: string;
  priority?: boolean;
};

export default function BrandLogo({ compact = false, className = "", priority = false }: BrandLogoProps) {
  if (compact) {
    return (
      <Image
        className={`brand-logo brand-logo--icon ${className}`.trim()}
        src="/brand/tusa-icon.svg"
        alt="TUSA.game"
        width={67}
        height={67}
        priority={priority}
      />
    );
  }

  return (
    <Image
      className={`brand-logo brand-logo--long ${className}`.trim()}
      src="/brand/tusa-logo.svg"
      alt="TUSA.game"
      width={292}
      height={96}
      priority={priority}
    />
  );
}
