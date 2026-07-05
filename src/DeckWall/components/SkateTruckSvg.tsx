import { useId } from 'react';

export type WheelVariant = 'charcoal' | 'cream' | 'mint';

const WHEEL = {
  charcoal: {
    edge: '#101014',
    face: '#24242a',
    light: '#4d4d55',
    truck: '#111114',
    metal: '#d8d3c4',
    bolt: '#f3efe2',
  },
  cream: {
    edge: '#eee6cf',
    face: '#fff8df',
    light: '#ffffff',
    truck: '#bdb7a7',
    metal: '#f2efe5',
    bolt: '#17171b',
  },
  mint: {
    edge: '#9ff6ed',
    face: '#c2fff6',
    light: '#f1fffb',
    truck: '#111114',
    metal: '#e8e1d1',
    bolt: '#f3efe2',
  },
} as const;

function TruckAssembly({ y, variant, prefix }: { y: number; variant: WheelVariant; prefix: string }) {
  const color = WHEEL[variant];
  const isLightWheel = variant !== 'charcoal';
  return (
    <g>
      <ellipse cx="21" cy={y + 25} rx="18" ry="7" fill="#000" opacity="0.22" />
      <ellipse cx="129" cy={y + 25} rx="18" ry="7" fill="#000" opacity="0.22" />
      <ellipse cx="75" cy={y + 25} rx="40" ry="8" fill="#000" opacity="0.17" />

      <rect x="9" y={y - 17} width="24" height="34" rx="6.5" fill={`url(#${prefix}-wheel)`} stroke={isLightWheel ? 'rgba(16,16,20,0.2)' : 'rgba(243,239,226,0.14)'} strokeWidth="1" />
      <rect x="117" y={y - 17} width="24" height="34" rx="6.5" fill={`url(#${prefix}-wheel)`} stroke={isLightWheel ? 'rgba(16,16,20,0.2)' : 'rgba(243,239,226,0.14)'} strokeWidth="1" />
      <path d={`M30 ${y - 12}v24M120 ${y - 12}v24`} stroke={isLightWheel ? 'rgba(0,0,0,0.15)' : 'rgba(255,255,255,0.08)'} strokeWidth="1.5" />
      <path d={`M13 ${y - 11}c4 -2 10 -3 16 -2M121 ${y - 13}c5 -1.5 11 -1 16 2`} stroke={color.light} strokeOpacity="0.32" strokeWidth="1.5" strokeLinecap="round" />

      <path d={`M29 ${y}H121`} stroke="#050506" strokeWidth="10" strokeLinecap="round" />
      <path d={`M32 ${y - 2}H118`} stroke={color.truck} strokeWidth="7" strokeLinecap="round" />
      <path d={`M36 ${y - 4.5}H114`} stroke={color.metal} strokeOpacity={variant === 'cream' ? 0.72 : 0.22} strokeWidth="1.5" strokeLinecap="round" />

      <path d={`M57 ${y + 6}c6 11 30 11 36 0l-6 19H63z`} fill="#08080a" opacity="0.72" />
      <path d={`M54 ${y - 15}h42l6 10-6 19H54l-6-19z`} fill={`url(#${prefix}-plate)`} stroke="rgba(243,239,226,0.36)" strokeWidth="1" />
      <rect x="59" y={y - 11} width="32" height="23" rx="4.5" fill={variant === 'cream' ? 'rgba(230,224,205,0.82)' : 'rgba(12,12,15,0.82)'} stroke="rgba(243,239,226,0.25)" strokeWidth="0.9" />
      <path d={`M63 ${y - 7}h24M63 ${y + 7}h24`} stroke={variant === 'cream' ? 'rgba(0,0,0,0.18)' : 'rgba(255,255,255,0.11)'} strokeWidth="1" />

      <circle cx="64" cy={y - 8} r="2.1" fill={color.bolt} opacity="0.88" />
      <circle cx="86" cy={y - 8} r="2.1" fill={color.bolt} opacity="0.88" />
      <circle cx="64" cy={y + 8} r="2.1" fill={color.bolt} opacity="0.88" />
      <circle cx="86" cy={y + 8} r="2.1" fill={color.bolt} opacity="0.88" />

      <circle cx="75" cy={y + 1} r="11.5" fill="#050506" stroke="rgba(243,239,226,0.2)" strokeWidth="1" />
      <circle cx="75" cy={y} r="7.8" fill={`url(#${prefix}-nut)`} stroke="rgba(255,255,255,0.32)" strokeWidth="0.9" />
      <circle cx="75" cy={y} r="4.2" fill="#151519" stroke={color.metal} strokeOpacity="0.7" strokeWidth="1.1" />
      <circle cx="75" cy={y - 1.8} r="1.3" fill="#fff" opacity="0.72" />
    </g>
  );
}

export function SkateTruckSvg({
  className,
  variant = 'charcoal',
}: {
  className?: string;
  variant?: WheelVariant;
}) {
  const rawId = useId().replace(/:/g, '');
  const color = WHEEL[variant];
  const prefix = `truck-${rawId}-${variant}`;
  return (
    <svg className={className} viewBox="0 0 150 350" aria-hidden="true">
      <defs>
        <linearGradient id={`${prefix}-wheel`} x1="0" x2="1" y1="0" y2="1">
          <stop offset="0" stopColor={color.light} />
          <stop offset="0.22" stopColor={color.face} />
          <stop offset="0.72" stopColor={color.edge} />
          <stop offset="1" stopColor={variant === 'charcoal' ? '#09090b' : color.face} />
        </linearGradient>
        <linearGradient id={`${prefix}-plate`} x1="0" x2="1" y1="0" y2="1">
          <stop offset="0" stopColor={variant === 'cream' ? '#eee7d4' : '#202026'} />
          <stop offset="0.5" stopColor={variant === 'cream' ? '#9f9787' : '#050506'} />
          <stop offset="1" stopColor={variant === 'cream' ? '#f9f3df' : '#323238'} />
        </linearGradient>
        <radialGradient id={`${prefix}-nut`} cx="44%" cy="36%" r="62%">
          <stop offset="0" stopColor="#ffffff" />
          <stop offset="0.3" stopColor={color.metal} />
          <stop offset="0.7" stopColor="#3a3a40" />
          <stop offset="1" stopColor="#070708" />
        </radialGradient>
      </defs>
      <TruckAssembly y={68} variant={variant} prefix={prefix} />
      <TruckAssembly y={282} variant={variant} prefix={prefix} />
    </svg>
  );
}
