import Image from "next/image";

export default function InlineSvg({ url, className }: { url: string; className?: string }) {
  return <Image src={url} className={className} alt="" aria-hidden="true" width={48} height={48} unoptimized />;
}
