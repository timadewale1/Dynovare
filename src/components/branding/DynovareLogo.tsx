import Image from "next/image";

export default function DynovareLogo({
  size = 34,
  variant = "default",
}: {
  size?: number;
  variant?: "default" | "white";
}) {
  const width = Math.round(size * 3.2);

  return (
    <Image
      src={variant === "white" ? "/logo/Dynovare_logo_white.png" : "/logo/Dynovare_logo.png"}
      alt="Dynovare"
      width={width}
      height={size}
      className="h-auto w-auto max-h-[40px] object-contain"
      priority
    />
  );
}
