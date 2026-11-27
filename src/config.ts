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
    lat: 45.3544,
    lng: 25.5519,
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

export const INTRO_TEXT =`ROMÂNIA
MINISTERUL AFACERILOR INTERNE
Direcția Specială pentru Intervenții Pirotehnice și Anchete Speciale

Nr. înreg.: DSIP/03/[data]
Clasificare: STRICT SECRET – DE IMPORTANȚĂ DEOSEBITĂ
Caracter: URGENT

CĂTRE: Domnul Detectiv Dicianu Stefan
DE LA: Direcția Specială pentru Intervenții Pirotehnice și Anchete Speciale
OBIECT: Convocare de urgență pentru misiune de dezamorsare și localizare

Stimate Domnule Detectiv,

Având în vedere experiența Dumneavoastră remarcabilă și rezultatele obținute în dosarul anului trecut, Direcția noastră Vă convoacă de urgență pentru o misiune cu grad maxim de risc.

Au fost interceptate informații conform cărora un dispozitiv exploziv a fost amplasat într-una dintre locațiile din orașul Sinaia. Locația exactă este necunoscută. Singura sursă de informații disponibilă este un sistem de localizare securizat.
Instrucțiuni operative:

Sistemul Vă va solicita rezolvarea unei serii de teste de securitate. Fiecare test rezolvat corect va debloca coordonatele următoarei locații.
Urmați indicațiile GPS-ului până la fiecare punct stabilit. Timpul este limitat.
Spre destinația finală, dispozitivul va trebui dezamorsat prin ultimul modul. Orice eroare poate avea consecințe grave.

Atenție! Misiunea este strict confidențială. Nu divulgați detaliile unor persoane neautorizate și nu abandonați misiunea înainte de finalizare. Echipamentul necesar (încălțăminte comodă, simț al observației și spirit de echipă) este obligatoriu.

Vă mulțumim pentru dedicare și Vă dorim succes.

Cu deosebită considerație,
Director General Interimar,
Sbabi

Semnătură și ștampilă <3`
 ";

export type RadioLineCategory =
  | 'atmosphere'
  | 'timePressure'
  | 'encouragement'
  | 'progress'
  | 'strikes'
  | 'idle';

export interface RadioAmbientLine {
  category: RadioLineCategory;
  ro: string;
  en: string;
}

export const RADIO_AMBIENT_LINES: RadioAmbientLine[] = [
  // Atmosferă (8)
  {
    category: 'atmosphere',
    ro: '…liniște… prea multă liniște…',
    en: 'silence… too much silence…',
  },
  {
    category: 'atmosphere',
    ro: '…ploaia bate… în geamul vechi…',
    en: 'rain hitting… the old window…',
  },
  {
    category: 'atmosphere',
    ro: '…neonul de afară… bruiază banda…',
    en: 'neon outside… jamming the band…',
  },
  {
    category: 'atmosphere',
    ro: '…receptorul prinde… ecou pe hol…',
    en: 'receiver picks up… hall echo…',
  },
  {
    category: 'atmosphere',
    ro: '…camera asta… ascunde ceva rece…',
    en: 'this room… hides something cold…',
  },
  {
    category: 'atmosphere',
    ro: '…purtătoarea vibrează… pe canalul trei…',
    en: 'carrier humming… on channel three…',
  },
  {
    category: 'atmosphere',
    ro: '…umbre lungi… rămâi atent, detectiv…',
    en: 'long shadows… stay sharp, detective…',
  },
  {
    category: 'atmosphere',
    ro: '…noaptea e grea… dar avem linie…',
    en: 'heavy night… but we still have link…',
  },

  // Presiune de timp (8)
  {
    category: 'timePressure',
    ro: '…detectiv… mai ai timp… mișcă…',
    en: 'detective… still got time… move…',
  },
  {
    category: 'timePressure',
    ro: '…ține ritmul… timpul curge…',
    en: 'keep the pace… clock is running…',
  },
  {
    category: 'timePressure',
    ro: '…secundele trec… nu ezita acum…',
    en: 'seconds passing… do not hesitate now…',
  },
  {
    category: 'timePressure',
    ro: '…grăbește pasul… dar fără grabă oarbă…',
    en: 'pick up speed… without blind haste…',
  },
  {
    category: 'timePressure',
    ro: '…fiecare minut… contează diseară…',
    en: 'every minute… matters tonight…',
  },
  {
    category: 'timePressure',
    ro: '…cronometrul nu iartă… rămâi lucid…',
    en: 'timer never forgives… stay sharp…',
  },
  {
    category: 'timePressure',
    ro: '…baza așteaptă… închide modulul…',
    en: 'base is waiting… close that module…',
  },
  {
    category: 'timePressure',
    ro: '…noaptea se scurtează… înainte, detectiv…',
    en: 'night grows short… push forward, detective…',
  },

  // Încurajare (8)
  {
    category: 'encouragement',
    ro: '…respiră adânc… tu poți…',
    en: 'breathe deep… you got this…',
  },
  {
    category: 'encouragement',
    ro: '…sunt pe linie… nu ești singur…',
    en: 'on the line… you are not alone…',
  },
  {
    category: 'encouragement',
    ro: '…calmul bate… orice panică…',
    en: 'calm beats… any panic…',
  },
  {
    category: 'encouragement',
    ro: '…ai fler bun… mergi pe instinct…',
    en: 'good instinct… trust your read…',
  },
  {
    category: 'encouragement',
    ro: '…citește manualul… pas cu pas…',
    en: 'read the manual… step by step…',
  },
  {
    category: 'encouragement',
    ro: '…carcasa ascunde detalii… verific-o…',
    en: 'casing hides clues… inspect it…',
  },
  {
    category: 'encouragement',
    ro: '…mână sigură… ochi limpede…',
    en: 'steady hand… clear eyes…',
  },
  {
    category: 'encouragement',
    ro: '…încă puțin… o scoatem la capăt…',
    en: 'almost there… we pull through…',
  },

  // Reacție la progres (8)
  {
    category: 'progress',
    ro: '…văd progres… continuă…',
    en: 'I see progress… keep going…',
  },
  {
    category: 'progress',
    ro: '…încă un circuit… căzut curat…',
    en: 'another circuit… dropped clean…',
  },
  {
    category: 'progress',
    ro: '…telemetria confirmă… mergi bine…',
    en: 'telemetry confirms… moving well…',
  },
  {
    category: 'progress',
    ro: '…dispozitivul cedează… încet dar sigur…',
    en: 'device is yielding… slow and steady…',
  },
  {
    category: 'progress',
    ro: '…semnalul devine… ceva mai clar…',
    en: 'signal getting… slightly clearer…',
  },
  {
    category: 'progress',
    ro: '…bună treabă… trecem la următorul…',
    en: 'good work… onto the next…',
  },
  {
    category: 'progress',
    ro: '…încă puțin… și închidem dosarul…',
    en: 'almost done… closing the file…',
  },
  {
    category: 'progress',
    ro: '…rezistența scade… ține același ritm…',
    en: 'resistance dropping… hold that pace…',
  },

  // Reacție la strike-uri (8)
  {
    category: 'strikes',
    ro: '…tensiune mare… verifică de două ori…',
    en: 'high voltage… double check first…',
  },
  {
    category: 'strikes',
    ro: '…eroarea doare… încetinește o secundă…',
    en: 'errors sting… slow down a second…',
  },
  {
    category: 'strikes',
    ro: '…banda trosnește… verifică seria…',
    en: 'band crackling… check the serial…',
  },
  {
    category: 'strikes',
    ro: '…nu ghici… confirmă regula exact…',
    en: 'do not guess… confirm exact rule…',
  },
  {
    category: 'strikes',
    ro: '…alarma bâzâie… păstrează sângele rece…',
    en: 'alarm buzzing… stay cool headed…',
  },
  {
    category: 'strikes',
    ro: '…scutură praful… și reia calm…',
    en: 'shake it off… reset your focus…',
  },
  {
    category: 'strikes',
    ro: '…semnalul sare… verifică bateriile…',
    en: 'signal jumping… verify battery count…',
  },
  {
    category: 'strikes',
    ro: '…atenție la detalii… o singură mișcare…',
    en: 'watch the details… one clean move…',
  },

  // Inactivitate > 60s (8)
  {
    category: 'idle',
    ro: '…detectiv… ești încă acolo…',
    en: 'detective… are you still there…',
  },
  {
    category: 'idle',
    ro: '…aici baza… confirmă recepția…',
    en: 'base calling… confirm reception…',
  },
  {
    category: 'idle',
    ro: '…semnalul tace… răspunde pe canal…',
    en: 'channel silent… respond on band…',
  },
  {
    category: 'idle',
    ro: '…alô… mă auzi prin static…',
    en: 'hello… do you copy through static…',
  },
  {
    category: 'idle',
    ro: '…nu te bloca… rotește carcasa…',
    en: 'do not freeze… rotate the casing…',
  },
  {
    category: 'idle',
    ro: '…detectiv… s-a întrerupt linia…',
    en: 'detective… did the line drop…',
  },
  {
    category: 'idle',
    ro: '…verifică manualul… dacă ești blocat…',
    en: 'check the manual… if you are stuck…',
  },
  {
    category: 'idle',
    ro: '…purtătoarea așteaptă… mișcă o piesă…',
    en: 'carrier waiting… make a move…',
  },
];

// Recomandat: MP4 H.264 + AAC, 720p, sub 40MB (nu se precachează în PWA)
export const FINALE_VIDEO_SRC = '/assets/clip-final.mp4';
export const FINALE_VIDEO_POSTER: string | null = null;

