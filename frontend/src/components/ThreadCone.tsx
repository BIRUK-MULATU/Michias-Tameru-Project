interface ThreadConeProps {
  id: string;
  colorFrom: string;
  colorTo: string;
  className?: string;
}

/**
 * A flat-design illustration of a wound thread cone/spool, built from plain
 * SVG shapes (no external image assets). Band count and taper are fixed so
 * it reads clearly at small sizes.
 */
export function ThreadCone({ id, colorFrom, colorTo, className }: ThreadConeProps) {
  const gradientId = `thread-cone-${id}`;
  const clipId = `thread-cone-clip-${id}`;
  const bodyTop = 22;
  const bodyBottom = 132;
  const bandCount = 7;

  return (
    <svg viewBox="0 0 120 160" className={className} role="img" aria-label="Thread cone">
      <defs>
        <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={colorFrom} />
          <stop offset="100%" stopColor={colorTo} />
        </linearGradient>
        <clipPath id={clipId}>
          <path d="M45 22 L17 128 A43 11 0 0 0 103 128 L75 22 Z" />
        </clipPath>
      </defs>

      <ellipse cx="60" cy="140" rx="36" ry="7" fill="black" opacity="0.12" />

      <g clipPath={`url(#${clipId})`}>
        <rect x="0" y="0" width="120" height="160" fill={`url(#${gradientId})`} />
        {Array.from({ length: bandCount }).map((_, i) => (
          <rect
            key={i}
            x="0"
            y={bodyTop + (i * (bodyBottom - bodyTop)) / bandCount}
            width="120"
            height={(bodyBottom - bodyTop) / bandCount / 2}
            fill="white"
            opacity={i % 2 === 0 ? 0.14 : 0.05}
          />
        ))}
        <rect x="0" y="22" width="30" height="138" fill="white" opacity="0.18" />
      </g>

      <path
        d="M45 22 L17 128 A43 11 0 0 0 103 128 L75 22 Z"
        fill="none"
        stroke="white"
        strokeOpacity="0.35"
        strokeWidth="1.5"
      />

      <ellipse cx="60" cy="22" rx="15" ry="5.5" fill="#f3e6c8" />
      <ellipse cx="60" cy="22" rx="9" ry="3" fill="#cdb988" />
    </svg>
  );
}
