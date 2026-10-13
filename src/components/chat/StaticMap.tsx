import { MapPin } from "@phosphor-icons/react";

/**
 * Stand-in for a static map image. The backend can later return a real map
 * tile URL; until then streets are drawn from the coordinates so each place
 * looks a little different.
 */
export function StaticMap({ lat, lng, className = "" }: { lat: number; lng: number; className?: string }) {
  const seed = Math.abs(Math.round(lat * 1000) * 31 + Math.round(lng * 1000));
  const r = (n: number) => ((seed * (n + 7)) % 97) / 97;
  const streets = Array.from({ length: 4 }, (_, i) => ({
    y: 18 + r(i) * 104,
    x: 24 + r(i + 4) * 232,
    tilt: (r(i + 8) - 0.5) * 30,
  }));

  return (
    <div className={`relative overflow-hidden bg-paper-3 ${className}`} aria-hidden="true">
      <svg viewBox="0 0 280 140" preserveAspectRatio="xMidYMid slice" className="block size-full">
        <rect width="280" height="140" fill="var(--paper-3)" />
        <path d={`M-10 ${60 + r(20) * 40} C 70 ${30 + r(21) * 60}, 160 ${90 + r(22) * 40}, 290 ${50 + r(23) * 50}`} stroke="var(--rule)" strokeWidth="14" fill="none" opacity="0.9" />
        {streets.map((s, i) => (
          <g key={i}>
            <line x1="-10" y1={s.y} x2="290" y2={s.y + s.tilt} stroke="var(--paper)" strokeWidth={i === 0 ? 7 : 4} />
            <line x1={s.x} y1="-10" x2={s.x + s.tilt} y2="150" stroke="var(--paper)" strokeWidth={i === 1 ? 7 : 4} />
          </g>
        ))}
        <rect x={40 + r(30) * 60} y={20 + r(31) * 30} width="34" height="22" rx="2" fill="var(--line)" />
        <rect x={170 + r(32) * 50} y={80 + r(33) * 20} width="40" height="26" rx="2" fill="var(--line)" />
        <circle cx="140" cy="70" r="16" fill="var(--coral)" opacity="0.18" />
      </svg>
      <MapPin size={34} weight="fill" className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-[85%] text-coral drop-shadow-[0_2px_2px_hsl(var(--shadow)/0.35)]" />
    </div>
  );
}
