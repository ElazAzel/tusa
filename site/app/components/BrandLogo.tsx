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
        src="/brand/tusa-game-icon.png"
        alt="TUSA.game"
        width={265}
        height={277}
        priority={priority}
      />
    );
  }

  return (
    <Image
      className={`brand-logo brand-logo--long ${className}`.trim()}
      src="/brand/tusa-game-logo.png"
      alt="TUSA.game"
      width={1207}
      height={389}
      priority={priority}
    />
  );
}
