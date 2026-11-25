import React from 'react';

/**
 * Custom SVG 7-segment display for authentic physical LED numerals
 * (header timer MM:SS, Knobs countdown, Memory single digit, PSU 03.03).
 */
const SEG_MAP: Record<string, number[]> = {
  '0': [1, 1, 1, 1, 1, 1, 0],
  '1': [0, 1, 1, 0, 0, 0, 0],
  '2': [1, 1, 0, 1, 1, 0, 1],
  '3': [1, 1, 1, 1, 0, 0, 1],
  '4': [0, 1, 1, 0, 0, 1, 1],
  '5': [1, 0, 1, 1, 0, 1, 1],
  '6': [1, 0, 1, 1, 1, 1, 1],
  '7': [1, 1, 1, 0, 0, 0, 0],
  '8': [1, 1, 1, 1, 1, 1, 1],
  '9': [1, 1, 1, 1, 0, 1, 1],
  '-': [0, 0, 0, 0, 0, 0, 1],
  ' ': [0, 0, 0, 0, 0, 0, 0],
};

// Segments a..g polygons inside a 22x36 digit cell
const SEG_POLYS: string[] = [
  '4,2 18,2 16,5 6,5',       // a (top)
  '19,3 20,16 17,14 17,5',   // b (top-right)
  '19,19 18,32 16,30 17,21', // c (bottom-right)
  '4,34 18,34 16,31 6,31',   // d (bottom)
  '3,19 4,32 6,30 5,21',     // e (bottom-left)
  '3,3 4,16 6,14 5,5',       // f (top-left)
  '5,17 17,17 18,18.5 16,20 6,20 4,18.5', // g (middle)
];

interface SevenSegmentDisplayProps {
  value: string;
  color?: string;
  ghostColor?: string;
  height?: number;
  blinkColon?: boolean;
  colonVisible?: boolean;
  className?: string;
  ariaLabel?: string;
}

export const SevenSegmentDisplay: React.FC<SevenSegmentDisplayProps> = ({
  value,
  color = '#ff3b2a',
  ghostColor = 'rgba(255, 59, 42, 0.13)',
  height = 28,
  blinkColon = false,
  colonVisible = true,
  className = '',
  ariaLabel,
}) => {
  const chars = value.split('');

  // Calculate layout positions cleanly (22px per digit, 10px for ':' or '.')
  let cursorX = 2;
  const items: Array<{ ch: string; x: number; w: number }> = [];
  for (const ch of chars) {
    if (ch === ':' || ch === '.') {
      items.push({ ch, x: cursorX, w: 8 });
      cursorX += 9;
    } else {
      items.push({ ch, x: cursorX, w: 22 });
      cursorX += 24;
    }
  }
  const totalW = Math.max(24, cursorX);
  const computedW = Math.round((totalW / 36) * height);

  return (
    <svg
      viewBox={`0 0 ${totalW} 36`}
      width={computedW}
      height={height}
      className={`inline-block shrink-0 ${className}`}
      role={ariaLabel ? 'img' : undefined}
      aria-label={ariaLabel}
      aria-hidden={ariaLabel ? undefined : true}
    >
      {items.map((item, idx) => {
        if (item.ch === ':') {
          const lit = !blinkColon || colonVisible;
          return (
            <g key={`c-${idx}`} transform={`translate(${item.x}, 0)`}>
              <circle cx="4" cy="12" r="2" fill={lit ? color : ghostColor} />
              <circle cx="4" cy="24" r="2" fill={lit ? color : ghostColor} />
            </g>
          );
        }
        if (item.ch === '.') {
          return (
            <circle
              key={`d-${idx}`}
              cx={item.x + 3.5}
              cy="32"
              r="2.1"
              fill={color}
            />
          );
        }
        const mask = SEG_MAP[item.ch] ?? SEG_MAP[' '];
        return (
          <g key={`n-${idx}`} transform={`translate(${item.x}, 0)`}>
            {SEG_POLYS.map((pts, sIdx) => (
              <polygon
                key={sIdx}
                points={pts}
                fill={mask[sIdx] ? color : ghostColor}
              />
            ))}
          </g>
        );
      })}
    </svg>
  );
};
