export default function DynovareLogo({ size = 28 }: { size?: number }) {
  return (
    <svg
      width={size * 5}
      height={size}
      viewBox="0 0 500 100"
      xmlns="http://www.w3.org/2000/svg"
    >
      <text
        x="0"
        y="70"
        fontSize="72"
        fontWeight="800"
        fontFamily="Inter, system-ui, sans-serif"
        fill="var(--blue-deep)"
        letterSpacing="2"
      >
        DYNOVARE
      </text>
      <rect
        x="0"
        y="80"
        width="140"
        height="6"
        fill="var(--blue-electric)"
        rx="3"
      />
    </svg>
  );
}
