// ============================================================================
// CONFIGURARE MISIUNE — EDITEAZĂ AICI COORDONATELE GPS & PIN-UL DE ADMIN
// ============================================================================

/**
 * PIN-ul secret pentru Panoul de Administrator (activat prin 5 apăsări rapide
 * pe titlul „OPERAȚIUNEA 3 ANI” din antet).
 */
export const ADMIN_PIN = '0303';

export interface EncryptedDestination {
  id: number;
  codeName: string;
  moduleRequired: number;
  lat: number;
  lng: number;
}

/**
 * Cele 5 destinații secrete din Sinaia (coordonate de test).
 * IMPORTANT: Nu pune numele obiectivelor turistice în `codeName`!
 * Jucătorul va vedea exclusiv „OBIECTIV CRIPTAT #1..#5” până ajunge la fața locului.
 * Înlocuiește `lat` și `lng` cu coordonatele exacte ale celor 5 locuri alese de tine.
 */
export const DESTINATIONS: EncryptedDestination[] = [
  {
    id: 1,
    codeName: 'OBIECTIV CRIPTAT #1',
    moduleRequired: 3, // Deblocat după Modulul 3
    lat: 45.3553,
    lng: 25.5494,
  },
  {
    id: 2,
    codeName: 'OBIECTIV CRIPTAT #2',
    moduleRequired: 4, // Deblocat după Modulul 4
    lat: 45.3526,
    lng: 25.5484,
  },
  {
    id: 3,
    codeName: 'OBIECTIV CRIPTAT #3',
    moduleRequired: 5, // Deblocat după Modulul 5
    lat: 45.3558,
    lng: 25.5461,
  },
  {
    id: 4,
    codeName: 'OBIECTIV CRIPTAT #4',
    moduleRequired: 6, // Deblocat după Modulul 6
    lat: 45.3596,
    lng: 25.5426,
  },
  {
    id: 5,
    codeName: 'OBIECTIV CRIPTAT #5',
    moduleRequired: 7, // Deblocat după Modulul 7 (Finala)
    lat: 45.3544,
    lng: 25.5508,
  },
];

/**
 * Poziție implicită de start în Sinaia (folosită doar dacă GPS-ul este simulat din
 * Panoul de Administrator sau dacă browserul nu are semnal GPS activ).
 */
export const SINAIA_SIMULATED_ORIGIN = {
  lat: 45.3484,
  lng: 25.5535,
};

/**
 * Distanța în metri sub care sosirea la Obiectivul Final poate fi confirmată automat.
 */
export const FINAL_ARRIVAL_RADIUS_METERS = 65;

export const STORAGE_KEY = 'op3ani_console_state_v1';

// ============================================================================
// INTRODUCERE, STAȚIE RADIO & CLIP FINAL (SE POATE EDITA UȘOR)
// ============================================================================

export const INTRO_SEEN_KEY = 'op3ani_intro_seen_v1';

export const INTRO_HEADER_LINES: string[] = [
  '> TERMINAL SECURIZAT — DOSAR 03',
  '> AUTENTIFICARE ... OK',
  '> DESCHIDERE MESAJ ...',
];

export const INTRO_TYPING_MS = 38;

export const INTRO_TEXT =
  "[[AICI VA FI TEXTUL INTRODUCTIV — îl înlocuiesc eu ulterior]]";

export const RADIO_AMBIENT_LINES: string[] = [
  '…detectiv… mai ai… timp…',
  '…aici… baza… mă auzi…',
  '…semnalul… slăbește… verifică dosarul…',
  '…atenție la… carcasă…',
];

// Recomandat: MP4 H.264 + AAC, 720p, sub 40MB (nu se precachează în PWA)
export const FINALE_VIDEO_SRC = '/assets/clip-final.mp4';
export const FINALE_VIDEO_POSTER: string | null = null;

