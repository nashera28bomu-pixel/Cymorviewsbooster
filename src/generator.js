// ─── src/generator.js ────────────────────────────────────────────────────────
// Core card generation engine.
// All output is for TESTING PURPOSES ONLY — not real cards.

// ─── Luhn Algorithm ───────────────────────────────────────────────────────────
/**
 * Validate a card number using the Luhn algorithm
 */
export function luhnCheck(num) {
  const digits = String(num).replace(/\D/g, '');
  let sum = 0;
  let alternate = false;
  for (let i = digits.length - 1; i >= 0; i--) {
    let n = parseInt(digits[i], 10);
    if (alternate) {
      n *= 2;
      if (n > 9) n -= 9;
    }
    sum += n;
    alternate = !alternate;
  }
  return sum % 10 === 0;
}

/**
 * Complete a partial card number to pass Luhn check
 * Fill with random digits then fix the last digit
 */
export function luhnComplete(partial) {
  // partial = first N digits, we need to fill to 16
  const len    = getCardLength(partial);
  let   digits = String(partial).replace(/\D/g, '');

  // Fill middle digits randomly
  while (digits.length < len - 1) {
    digits += Math.floor(Math.random() * 10);
  }

  // Calculate check digit
  digits += '0'; // placeholder
  const arr = digits.split('').map(Number);
  let sum = 0;
  let alt = false;
  for (let i = arr.length - 2; i >= 0; i--) {
    let n = arr[i];
    if (alt) { n *= 2; if (n > 9) n -= 9; }
    sum += n;
    alt = !alt;
  }
  const checkDigit = (10 - (sum % 10)) % 10;
  digits = digits.slice(0, -1) + checkDigit;
  return digits;
}

/**
 * Determine card length from BIN prefix
 */
function getCardLength(bin) {
  const b = String(bin);
  if (b.startsWith('3')) return 15; // Amex
  return 16; // Visa, Mastercard, Discover, etc.
}

// ─── Card network detection ───────────────────────────────────────────────────
export function detectNetwork(bin) {
  const b = String(bin);
  if (/^4/.test(b))                          return 'VISA';
  if (/^5[1-5]/.test(b))                     return 'MASTERCARD';
  if (/^2(2[2-9]|[3-6]|7[01]|720)/.test(b)) return 'MASTERCARD';
  if (/^3[47]/.test(b))                      return 'AMEX';
  if (/^6(011|22|4[4-9]|5)/.test(b))         return 'DISCOVER';
  if (/^35(2[89]|[3-8])/.test(b))            return 'JCB';
  if (/^(6304|6759|676[123])/.test(b))       return 'MAESTRO';
  if (/^50/.test(b))                         return 'VERVE';
  return 'UNKNOWN';
}

// ─── Random helpers ───────────────────────────────────────────────────────────
function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randCVV(network) {
  return network === 'AMEX'
    ? String(randInt(1000, 9999)).padStart(4, '0')
    : String(randInt(100, 999)).padStart(3, '0');
}

function randMonth() {
  return String(randInt(1, 12)).padStart(2, '0');
}

function randYear(fromYear = null) {
  const base = fromYear || new Date().getFullYear();
  return String(randInt(base + 1, base + 5));
}

// ─── Format card number ───────────────────────────────────────────────────────
function formatCard(num, network) {
  if (network === 'AMEX') {
    return `${num.slice(0,4)} ${num.slice(4,10)} ${num.slice(10)}`;
  }
  return `${num.slice(0,4)} ${num.slice(4,8)} ${num.slice(8,12)} ${num.slice(12)}`;
}

// ─── Main generation function ─────────────────────────────────────────────────
/**
 * Generate test cards
 * @param {object} opts
 *   bin       - BIN prefix (6-8 digits)
 *   qty       - How many cards
 *   month     - Expiry month (MM) or 'rnd'
 *   year      - Expiry year (YYYY) or 'rnd'
 *   format    - 'full' | 'pipe' | 'json' | 'csv' | 'txt'
 */
export function generateCards(opts = {}) {
  const {
    bin    = '4',
    qty    = 10,
    month  = 'rnd',
    year   = 'rnd',
    format = 'full',
  } = opts;

  const cleanBin = String(bin).replace(/\D/g, '');
  const network  = detectNetwork(cleanBin);
  const cards    = [];

  for (let i = 0; i < qty; i++) {
    const number  = luhnComplete(cleanBin);
    const mm      = month === 'rnd' ? randMonth() : String(month).padStart(2, '0');
    const yyyy    = year  === 'rnd' ? randYear()  : String(year);
    const yy      = yyyy.slice(-2);
    const cvv     = randCVV(network);

    cards.push({ number, mm, yyyy, yy, cvv, network });
  }

  return { cards, network, bin: cleanBin };
}

// ─── Format output ────────────────────────────────────────────────────────────
export function formatOutput(cards, network, format = 'full') {
  switch (format) {

    case 'full':
      // Full formatted with spaces — clean for reading
      return cards.map(c =>
        `${formatCard(c.number, network)} | ${c.mm}/${c.yyyy} | ${c.cvv}`
      ).join('\n');

    case 'pipe':
      // Pipe separated — common dev format
      return cards.map(c =>
        `${c.number}|${c.mm}|${c.yyyy}|${c.cvv}`
      ).join('\n');

    case 'plain':
      // No spaces, pipe separated
      return cards.map(c =>
        `${c.number}|${c.mm}/${c.yy}|${c.cvv}`
      ).join('\n');

    case 'json':
      return JSON.stringify(
        cards.map(c => ({
          number:  c.number,
          expiry:  `${c.mm}/${c.yyyy}`,
          cvv:     c.cvv,
          network: c.network,
          luhn_valid: luhnCheck(c.number),
          test_only: true,
        })),
        null, 2
      );

    case 'csv':
      const header = 'number,expiry_month,expiry_year,cvv,network,luhn_valid,note';
      const rows   = cards.map(c =>
        `${c.number},${c.mm},${c.yyyy},${c.cvv},${c.network},${luhnCheck(c.number)},TEST_USE_ONLY`
      );
      return [header, ...rows].join('\n');

    case 'txt':
      return [
        '════════════════════════════════════════',
        '  CYMOR CC GENERATOR — TEST CARDS ONLY  ',
        '  ⚠ NOT REAL CARDS — SANDBOX USE ONLY  ',
        '════════════════════════════════════════',
        `  Network : ${network}`,
        `  Generated: ${new Date().toISOString()}`,
        '════════════════════════════════════════',
        '',
        ...cards.map((c, i) =>
          `[${String(i+1).padStart(2,'0')}] ${formatCard(c.number, network)}\n     Expiry: ${c.mm}/${c.yyyy}  CVV: ${c.cvv}`
        ),
        '',
        '════════════════════════════════════════',
        '  Powered by Cymor Tech Services        ',
        '  Always a winner 🏆                    ',
        '════════════════════════════════════════',
      ].join('\n');

    default:
      return cards.map(c => `${c.number} | ${c.mm}/${c.yyyy} | ${c.cvv}`).join('\n');
  }
}

// ─── Preset BINs for quick testing ───────────────────────────────────────────
export const PRESET_BINS = {
  // International
  'Visa (Generic)':        '400000',
  'Mastercard (Generic)':  '520000',
  'Amex (Generic)':        '371449',
  'Discover (Generic)':    '601100',
  // Stripe test
  'Stripe Visa':           '424242',
  'Stripe MC':             '555555',
  'Stripe Visa Debit':     '400000',
  // African banks (common BINs)
  'Visa Kenya (KCB)':      '457173',
  'Visa Kenya (Equity)':   '454313',
  'MC Nigeria (GTBank)':   '539983',
  'MC Ghana (GCB)':        '512345',
  'Visa SA (Absa)':        '400001',
};
