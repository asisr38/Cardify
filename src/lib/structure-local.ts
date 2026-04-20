import type { StructuredContact } from './api';

// Heuristic contact-field extractor for when Claude isn't available.
// Works well for the easy fields (email/phone/URL/LinkedIn); name and
// company require guesswork, so we do the minimum and leave the rest
// for the user to fix in review.

const EMAIL_RE = /[\w.+-]+@[\w-]+\.[\w.-]+/i;
const PHONE_RE =
  /(?:\+?\d{1,3}[\s.-]?)?(?:\(\d{2,4}\)|\d{2,4})[\s.-]?\d{3,4}[\s.-]?\d{3,4}(?:\s?(?:ext|x)\.?\s?\d{1,5})?/i;
const LINKEDIN_RE = /linkedin\.com\/(?:in|company)\/[\w\-._~/%]+/i;
const URL_RE = /(?:https?:\/\/)?(?:www\.)?[a-z0-9][\w-]*(?:\.[a-z]{2,})+(?:\/[\w\-._~:/?#[\]@!$&'()*+,;=%]*)?/i;

const COMPANY_HINT = /\b(inc\.?|llc|ltd\.?|co\.?|corp\.?|gmbh|s\.?a\.?|studios?|labs?|group|holdings)\b/i;

function clean(line: string): string {
  return line.replace(/\s+/g, ' ').trim();
}

// Scores a line's likelihood of being a person's name.
function looksLikeName(line: string): boolean {
  if (!line || line.length < 3 || line.length > 60) return false;
  if (EMAIL_RE.test(line) || PHONE_RE.test(line) || URL_RE.test(line)) return false;
  if (/\d/.test(line)) return false;
  if (COMPANY_HINT.test(line)) return false;
  const words = line.split(/\s+/);
  if (words.length < 2 || words.length > 5) return false;
  // At least two words starting with a capital letter.
  const caps = words.filter((w) => /^[A-Z][a-zA-Z'\-]+/.test(w)).length;
  return caps >= 2;
}

function looksLikeCompany(line: string): boolean {
  if (!line) return false;
  if (EMAIL_RE.test(line) || PHONE_RE.test(line) || URL_RE.test(line)) return false;
  return COMPANY_HINT.test(line) || /^[A-Z][A-Za-z0-9 &.\-]+$/.test(line);
}

export function structureLocal(text: string): StructuredContact {
  const lines = text
    .split(/\r?\n/)
    .map(clean)
    .filter((l) => l.length > 0);

  const email = lines.join(' ').match(EMAIL_RE)?.[0] ?? null;
  const phone = lines.join(' ').match(PHONE_RE)?.[0] ?? null;
  const linkedin = lines.join(' ').match(LINKEDIN_RE)?.[0] ?? null;

  // Prefer non-email URLs for the website field.
  let website: string | null = null;
  for (const line of lines) {
    const m = line.match(URL_RE)?.[0];
    if (!m) continue;
    if (m === email || email?.includes(m)) continue;
    if (LINKEDIN_RE.test(m)) continue;
    website = m;
    break;
  }

  // Name: first line that passes the heuristic.
  const full_name = lines.find(looksLikeName) ?? '';

  // Company: prefer a line with a legal suffix; otherwise the line after the
  // detected name.
  let company: string | null = null;
  const companyLine = lines.find((l) => l !== full_name && looksLikeCompany(l));
  if (companyLine) company = companyLine;
  else if (full_name) {
    const idx = lines.indexOf(full_name);
    const next = lines[idx + 1];
    if (next && !EMAIL_RE.test(next) && !PHONE_RE.test(next) && !URL_RE.test(next)) {
      company = next;
    }
  }

  // Title: line between the name and a company match that isn't any of the
  // above.
  let title: string | null = null;
  if (full_name) {
    const idx = lines.indexOf(full_name);
    for (let i = idx + 1; i < lines.length; i++) {
      const line = lines[i];
      if (line === company) break;
      if (EMAIL_RE.test(line) || PHONE_RE.test(line) || URL_RE.test(line)) continue;
      title = line;
      break;
    }
  }

  return {
    full_name,
    title,
    company,
    email,
    phone,
    website,
    linkedin,
    address: null,
  };
}
