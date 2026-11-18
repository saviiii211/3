import type { BombCasing, PortType } from './types';

const SERIAL_LETTERS = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
const SERIAL_DIGITS = '0123456789';

export function generateBombCasing(rng: () => number = Math.random): BombCasing {
  const l1 = SERIAL_LETTERS[Math.floor(rng() * SERIAL_LETTERS.length)];
  const l2 = SERIAL_LETTERS[Math.floor(rng() * SERIAL_LETTERS.length)];
  const d1 = SERIAL_DIGITS[Math.floor(rng() * SERIAL_DIGITS.length)];
  const l3 = SERIAL_LETTERS[Math.floor(rng() * SERIAL_LETTERS.length)];
  const l4 = SERIAL_LETTERS[Math.floor(rng() * SERIAL_LETTERS.length)];
  const lastDigit = Math.floor(rng() * 10);
  const serialNumber = `${l1}${l2}${d1}${l3}${l4}${lastDigit}`;
  const lastDigitEven = lastDigit % 2 === 0;

  // AA batteries come in pairs (each pair = 2 batteries), D cells = 1 battery each
  const aaPairs = Math.floor(rng() * 3); // 0, 1, or 2 pairs -> 0, 2, or 4 batteries
  const dCells = Math.floor(rng() * 3); // 0, 1, or 2 cells
  const totalBatteries = aaPairs * 2 + dCells;

  const hasParallelPort = rng() < 0.55;
  const ports: PortType[] = [];
  if (hasParallelPort) {
    ports.push('parallel');
  }
  const optionalPorts: PortType[] = ['serial', 'dvid', 'ps2', 'rj45', 'rca'];
  for (const p of optionalPorts) {
    if (rng() < 0.45) {
      ports.push(p);
    }
  }
  if (ports.length === 0) {
    ports.push('serial');
  }

  return {
    serialNumber,
    lastDigitEven,
    aaPairs,
    dCells,
    totalBatteries,
    hasParallelPort,
    ports,
  };
}
