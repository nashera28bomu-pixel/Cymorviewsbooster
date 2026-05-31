// ─── src/binlookup.js ────────────────────────────────────────────────────────
import axios from 'axios';
import { detectNetwork } from './generator.js';

// Cache lookups to avoid hammering the API
const cache = new Map();

/**
 * Look up BIN info from binlist.net (free, no key needed)
 */
export async function lookupBin(bin) {
  const cleanBin = String(bin).replace(/\D/g, '').slice(0, 8);
  if (cleanBin.length < 6) throw new Error('BIN must be at least 6 digits');

  // Return from cache if available
  if (cache.has(cleanBin)) return cache.get(cleanBin);

  try {
    const res = await axios.get(
      `https://lookup.binlist.net/${cleanBin}`,
      {
        headers: { 'Accept-Version': '3' },
        timeout: 8000,
      }
    );

    const d = res.data;
    const info = {
      bin:      cleanBin,
      network:  d.scheme?.toUpperCase()  || detectNetwork(cleanBin),
      type:     d.type?.toUpperCase()    || 'UNKNOWN',      // CREDIT / DEBIT
      brand:    d.brand?.toUpperCase()   || 'UNKNOWN',
      bank:     d.bank?.name             || 'Unknown Bank',
      country:  d.country?.name         || 'Unknown',
      emoji:    d.country?.emoji         || '🌍',
      currency: d.country?.currency      || 'Unknown',
      prepaid:  d.prepaid               || false,
    };

    cache.set(cleanBin, info);
    return info;

  } catch (err) {
    // Fallback to local detection if API fails
    const fallback = {
      bin:      cleanBin,
      network:  detectNetwork(cleanBin),
      type:     'UNKNOWN',
      brand:    detectNetwork(cleanBin),
      bank:     'Unknown Bank',
      country:  'Unknown',
      emoji:    '🌍',
      currency: 'Unknown',
      prepaid:  false,
    };
    cache.set(cleanBin, fallback);
    return fallback;
  }
}

/**
 * Format BIN info for free tier (basic)
 */
export function formatBinBasic(info) {
  return [
    `🏦 *BIN Lookup: ${info.bin}*`,
    ``,
    `💳 Network : \`${info.network}\``,
    `🏷 Type    : \`${info.type}\``,
    `🌍 Country : ${info.emoji} ${info.country}`,
    ``,
    `_🔒 Upgrade to Premium for full bank info, currency, prepaid status & more_`,
  ].join('\n');
}

/**
 * Format BIN info for premium tier (full details)
 */
export function formatBinFull(info) {
  return [
    `🏦 *BIN Lookup: ${info.bin}*`,
    ``,
    `💳 Network  : \`${info.network}\``,
    `🏷 Type     : \`${info.type}\``,
    `🎯 Brand    : \`${info.brand}\``,
    `🏛 Bank     : \`${info.bank}\``,
    `🌍 Country  : ${info.emoji} ${info.country}`,
    `💰 Currency : \`${info.currency}\``,
    `💼 Prepaid  : \`${info.prepaid ? 'YES' : 'NO'}\``,
    ``,
    `_✅ Powered by Cymor Tech Services_`,
  ].join('\n');
}
