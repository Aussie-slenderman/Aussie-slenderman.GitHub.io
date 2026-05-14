// Shared client-side content moderation.
//
// Catches profanity, sexual content, slurs, and racist phrases — including
// common evasion patterns: leet-speak number substitution (a→@/4, e→3,
// i→1/!/|, o→0, s→5/$, t→7), separator characters (n.i.g.g.e.r), and letter
// repetition (fuuuck, niiigger). The Cloud Function `validateUsername` is the
// authoritative server-side check; this module exists so the client can give
// instant feedback in usernames and (where wired) chat input.

export type ModerationCategory =
  | 'sexual'
  | 'profanity'
  | 'hate'
  | 'racist_phrase'
  | 'self_harm';

export interface ModerationMatch {
  /** The original (un-normalized) wordlist entry that matched. */
  matched: string;
  /** Bucket for messaging — e.g. "hate speech / slurs". */
  category: ModerationCategory;
  /** Human-readable label for the category (for surfaces like error toasts). */
  categoryLabel: string;
}

// ─── Wordlists ──────────────────────────────────────────────────────────────
// All entries should be lowercase. The detector also matches their normalized
// (leet-stripped, alpha-only) and collapsed (consecutive-duplicate-removed)
// forms, so you don't need to list every variant by hand.

const SEXUAL_WORDS: string[] = [
  'sex', 'porn', 'nude', 'horny', 'orgasm', 'orgy', 'cum', 'jizz', 'jism',
  'blowjob', 'handjob', 'rimjob', 'anal', 'butthole', 'asshole', 'arsehole',
  'rape', 'rapist', 'molest', 'molester', 'pedo', 'paedo', 'pedophile', 'paedophile',
  'penis', 'dick', 'cock', 'vagina', 'pussy', 'boobs', 'tits', 'titties', 'nipples',
  'cunt', 'twat', 'clit', 'minge', 'wank', 'wanker',
  'masturbate', 'masturbation', 'masturbating',
  'ejaculate', 'ejaculation', 'semen', 'scrotum', 'testicle', 'erection',
  'incest', 'bestiality',
];

const PROFANITY_WORDS: string[] = [
  'fuck', 'fck', 'fuk', 'fking', 'shit', 'sht', 'bitch', 'btch', 'bastard',
  'crap', 'piss', 'damn', 'bollocks', 'tosser', 'arse', 'bullshit', 'asswipe',
];

const HATE_SLUR_WORDS: string[] = [
  // anti-Black
  'nigger', 'nigga', 'niggah', 'niggas', 'niggr', 'porchmonkey', 'jigaboo', 'coon',
  // anti-Jewish
  'kike', 'jewboy', 'christkiller', 'holohoax', 'oven dodger', 'shylock',
  // anti-Hispanic/Latino
  'spic', 'wetback', 'beaner', 'greaser',
  // anti-Asian
  'chink', 'gook', 'slopehead', 'slanteye',
  // anti-Arab / Muslim / South Asian
  'paki', 'raghead', 'towelhead', 'sandnigger', 'sandnigga', 'camelfucker', 'camelhumper',
  // anti-Indigenous
  'redskin', 'injun',
  // anti-Roma
  'gypsy',
  // anti-white (for completeness)
  'cracker', 'honky', 'whitey',
  // anti-LGBT
  'faggot', 'fag', 'tranny', 'dyke', 'shemale',
  // ableist
  'retard', 'retarded', 'spaz', 'spastic', 'mongoloid', 'midget',
  // nazi / supremacist
  'hitler', 'nazi', 'heilhitler', 'siegheil', 'kkk', 'klansman', 'klanman',
  'swastika', 'whitepower', 'aryannation', 'aryanbrotherhood',
];

const SELF_HARM_WORDS: string[] = [
  'kys', 'killyou', 'killyourself', 'killmyself', 'suicide', 'suicidal',
  'selfharm', 'cuturself', 'cutyourself', 'hangurself', 'hangyourself',
  'goandhang', 'goandhangyourself',
];

// Multi-word racist / hateful strings. Stored as already-de-spaced strings
// because the detector strips all non-letters before matching. Listed
// verbatim so they're easy to read, but matched against the normalized form.
const RACIST_PHRASES: string[] = [
  'killallblacks', 'killallwhites', 'killalljews', 'killallmuslims',
  'killallasians', 'killallmexicans', 'killallarabs', 'killallgays',
  'gobacktoyourcountry', 'gobacktoafrica', 'gobacktomexico', 'gobacktoasia',
  'gobacktoyourshithole', 'gobacktothefields',
  'whitepower', 'whitepride', 'whitenation', 'whitesonly',
  'blackslivesdontmatter', 'allblacksare', 'alljewsare', 'allmuslimsare',
  'allasiansare', 'allmexicansare', 'allwhitesareracist',
  'jewsdid911', 'jewsruntheworld', 'jewishconspiracy', 'jewsdidnothingwrong',
  'naziswereright', 'hitlerwasright', 'hitlerdidnothingwrong',
  'heilhitler', 'siegheil',
  'gasthejews', 'gasallthejews', 'ovenjew', 'lynchallblacks',
  'triggernigger', 'porchmonkey',
  '14words', '1488',
];

// Build (substring → category) lookups. The category map is keyed by the
// **normalized** form because that's what we actually compare against.
function buildCategoryMap(): Array<[string, ModerationCategory, string]> {
  const out: Array<[string, ModerationCategory, string]> = [];
  for (const w of SEXUAL_WORDS)   out.push([w, 'sexual', w]);
  for (const w of PROFANITY_WORDS) out.push([w, 'profanity', w]);
  for (const w of HATE_SLUR_WORDS) out.push([w, 'hate', w]);
  for (const w of SELF_HARM_WORDS) out.push([w, 'self_harm', w]);
  return out;
}

// ─── Normalization ──────────────────────────────────────────────────────────

function normalize(raw: string): string {
  if (!raw) return '';
  return raw
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    // Leet-speak letter↔number/symbol substitutions. Conservative set —
    // only mappings that don't collide with common real text.
    .replace(/[@4]/g, 'a')
    .replace(/3/g, 'e')
    .replace(/[1!|]/g, 'i')
    .replace(/0/g, 'o')
    .replace(/[5$]/g, 's')
    .replace(/7/g, 't')
    // Drop everything that isn't a letter — handles 'n.i.g.g.e.r',
    // 'n i g g e r', emoji separators, zero-width chars, etc.
    .replace(/[^a-z]+/g, '');
}

/** Collapse any run of identical letters to a single letter — 'fuuuck' → 'fuk'. */
function collapse(s: string): string {
  return s.replace(/(.)\1+/g, '$1');
}

// Pre-compute the dictionary in both normalized and collapsed forms so each
// detection call only does O(words) string comparisons (no per-call work).
//
// We only set `collapsed` when it's substantive (≥ 3 chars after collapse).
// Otherwise something like "kkk" → "k" would match every username containing
// the letter k. When collapsed is shorter than that floor we fall back to the
// normalized form for the second-pass check, which is a no-op.
const COLLAPSE_MIN = 3;

const WORD_ENTRIES: Array<{
  original: string;
  category: ModerationCategory;
  normal: string;
  collapsed: string;
}> = buildCategoryMap()
  .map(([w, cat]) => {
    const normal = normalize(w);
    const c = collapse(normal);
    return { original: w, category: cat, normal, collapsed: c.length >= COLLAPSE_MIN ? c : normal };
  })
  .filter((e) => e.normal.length >= 3);

const PHRASE_ENTRIES: Array<{
  original: string;
  normal: string;
  collapsed: string;
}> = RACIST_PHRASES.map((p) => {
  const normal = normalize(p);
  const c = collapse(normal);
  return { original: p, normal, collapsed: c.length >= COLLAPSE_MIN ? c : normal };
}).filter((e) => e.normal.length >= 4);

export function labelForCategory(c: ModerationCategory): string {
  switch (c) {
    case 'sexual': return 'sexual content';
    case 'profanity': return 'profanity';
    case 'hate': return 'hate speech / slurs';
    case 'racist_phrase': return 'racist or hateful phrase';
    case 'self_harm': return 'self-harm content';
  }
}

// ─── Detection ──────────────────────────────────────────────────────────────

/**
 * Return the first moderation match in `raw`, or null if clean. Matches both
 * the normalized form (leet-stripped, alpha-only) and the fully-collapsed
 * form (no repeated letters), so 'n1gger', 'n.i.g.g.e.r', and 'niiiigger'
 * all match 'nigger'.
 */
export function detectContentViolation(raw: string): ModerationMatch | null {
  if (!raw) return null;
  const inputNormal = normalize(raw);
  if (!inputNormal) return null;
  const inputCollapsed = collapse(inputNormal);

  for (const e of WORD_ENTRIES) {
    if (inputNormal.includes(e.normal) || inputCollapsed.includes(e.collapsed)) {
      return {
        matched: e.original,
        category: e.category,
        categoryLabel: labelForCategory(e.category),
      };
    }
  }
  for (const e of PHRASE_ENTRIES) {
    if (inputNormal.includes(e.normal) || inputCollapsed.includes(e.collapsed)) {
      return {
        matched: e.original,
        category: 'racist_phrase',
        categoryLabel: labelForCategory('racist_phrase'),
      };
    }
  }
  return null;
}

/**
 * Username-specific check. Same detector, but returns just the matched word
 * for the existing register UI signature.
 */
export function detectUsernameViolation(raw: string): string | null {
  const m = detectContentViolation(raw);
  return m ? m.matched : null;
}
