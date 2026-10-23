/** Logonun beş çubuğundan türeyen, çok silik arka plan deseni. Sayfaya marka kimliği verir. */
const HEIGHTS = [0.22, 0.4, 0.3, 0.62, 0.48, 0.86, 0.56, 0.34, 0.5, 0.25, 0.42, 0.3];

export function BrandBackdrop() {
  const width = 12 * 56;
  return (
    <svg
      aria-hidden
      className="pointer-events-none absolute inset-x-0 bottom-0 h-[62%] w-full text-accent opacity-[0.05]"
      viewBox={`0 0 ${width} 400`}
      preserveAspectRatio="xMidYMax slice"
    >
      {HEIGHTS.map((h, i) => (
        <rect key={i} x={i * 56 + 12} y={400 - h * 360} width={22} height={h * 360} rx={11} fill="currentColor" />
      ))}
    </svg>
  );
}
