import Image from "next/image";

export default function DynovareLogo({ size = 34 }: { size?: number }) {
  const width = Math.round(size * 3.2);

  return (
    <Image
      src="/logo.png"
      alt="Dynovare"
      width={width}
      height={size}
      className="h-auto w-auto max-h-[40px] object-contain"
      priority
    />
  );
}
