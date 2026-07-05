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
      <ellipse cx="22" cy={y + 35} rx="24" ry="10" fill="#000" opacity="0.28" />
      <ellipse cx="128" cy={y + 35} rx="24" ry="10" fill="#000" opacity="0.28" />
      <ellipse cx="75" cy={y + 34} rx="42" ry="10" fill="#000" opacity="0.2" />

      <rect x="3" y={y - 25} width="31" height="50" rx="8" fill={`url(#${prefix}-wheel)`} stroke={isLightWheel ? 'rgba(16,16,20,0.22)' : 'rgba(243,239,226,0.16)'} strokeWidth="1.2" />
      <rect x="116" y={y - 25} width="31" height="50" rx="8" fill={`url(#${prefix}-wheel)`} stroke={isLightWheel ? 'rgba(16,16,20,0.22)' : 'rgba(243,239,226,0.16)'} strokeWidth="1.2" />
      <path d={`M29 ${y - 20}v40M121 ${y - 20}v40`} stroke={isLightWheel ? 'rgba(0,0,0,0.18)' : 'rgba(255,255,255,0.09)'} strokeWidth="2" />
      <path d={`M8 ${y - 16}c5 -4 13 -5 21 -3M121 ${y - 19}c7 -2 15 -1 21 3`} stroke={color.light} strokeOpacity="0.34" strokeWidth="2" strokeLinecap="round" />

      <path d={`M29 ${y}H121`} stroke="#050506" strokeWidth="12" strokeLinecap="round" />
      <path d={`M31 ${y - 2}H119`} stroke={color.truck} strokeWidth="9" strokeLinecap="round" />
      <path d={`M34 ${y - 5}H116`} stroke={color.metal} strokeOpacity={variant === 'cream' ? 0.75 : 0.24} strokeWidth="2" strokeLinecap="round" />

      <path d={`M54 ${y + 7}c7 16 35 16 42 0l-7 25H61z`} fill="#08080a" opacity="0.78" />
      <path d={`M52 ${y - 19}h46l7 12-7 23H52l-7-23z`} fill={`url(#${prefix}-plate)`} stroke="rgba(243,239,226,0.4)" strokeWidth="1.2" />
      <rect x="57" y={y - 15} width="36" height="30" rx="5" fill={variant === 'cream' ? 'rgba(230,224,205,0.82)' : 'rgba(12,12,15,0.82)'} stroke="rgba(243,239,226,0.28)" strokeWidth="1" />
      <path d={`M61 ${y - 10}h28M61 ${y + 10}h28`} stroke={variant === 'cream' ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.12)'} strokeWidth="1.2" />

      <circle cx="63" cy={y - 10} r="2.4" fill={color.bolt} opacity="0.9" />
      <circle cx="87" cy={y - 10} r="2.4" fill={color.bolt} opacity="0.9" />
      <circle cx="63" cy={y + 10} r="2.4" fill={color.bolt} opacity="0.9" />
      <circle cx="87" cy={y + 10} r="2.4" fill={color.bolt} opacity="0.9" />

      <circle cx="75" cy={y + 1} r="15" fill="#050506" stroke="rgba(243,239,226,0.22)" strokeWidth="1.2" />
      <circle cx="75" cy={y} r="10" fill={`url(#${prefix}-nut)`} stroke="rgba(255,255,255,0.34)" strokeWidth="1" />
      <circle cx="75" cy={y} r="5.2" fill="#151519" stroke={color.metal} strokeOpacity="0.7" strokeWidth="1.3" />
      <circle cx="75" cy={y - 2.2} r="1.6" fill="#fff" opacity="0.72" />
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
      <TruckAssembly y={82} variant={variant} prefix={prefix} />
      <TruckAssembly y={258} variant={variant} prefix={prefix} />
    </svg>
  );
}
