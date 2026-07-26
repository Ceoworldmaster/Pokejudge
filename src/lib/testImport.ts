import JSZip from 'jszip';

export interface ImportedTestCase {
  input: string;
  output: string;
  isSample: boolean;
}

/**
 * Parse test cases from a ZIP file.
 * Supported structures:
 *   test1.in / test1.out
 *   test1.inp / test1.out
 *   1.in / 1.out
 *   test1/test1.inp / test1/test1.out   (nested in folders)
 * Pairs are matched by their numeric or shared prefix.
 */
export async function parseZip(file: File): Promise<ImportedTestCase[]> {
  const zip = await JSZip.loadAsync(file);
  const entries = Object.values(zip.files).filter((e) => !e.dir);

  // Build a map of baseName -> { input?, output? }
  const groups = new Map<string, { input?: string; output?: string }>();

  for (const entry of entries) {
    const path = entry.name.toLowerCase();
    // Match .in, .inp, .txt as input; .out, .ans, .txt as output
    const inputMatch = path.match(/^(.+?)\.(in|inp)$/);
    const outputMatch = path.match(/^(.+?)\.(out|ans)$/);

    let key: string | null = null;
    let kind: 'input' | 'output' | null = null;

    if (inputMatch) {
      key = inputMatch[1];
      kind = 'input';
    } else if (outputMatch) {
      key = outputMatch[1];
      kind = 'output';
    }

    if (!key || !kind) continue;

    // Normalize the key: strip folder prefixes and "test" prefixes to find pairs
    // e.g. "test1/test1" -> "1", "tests/2" -> "2", "prob_a/prob_a" -> "prob_a"
    const normalizedKey = normalizeKey(key);

    if (!groups.has(normalizedKey)) groups.set(normalizedKey, {});
    const g = groups.get(normalizedKey)!;
    const content = await entry.async('string');
    if (kind === 'input' && !g.input) g.input = content;
    if (kind === 'output' && !g.output) g.output = content;
  }

  const cases: ImportedTestCase[] = [];
  const sortedKeys = Array.from(groups.keys()).sort((a, b) => naturalCompare(a, b));
  for (const key of sortedKeys) {
    const g = groups.get(key)!;
    if (g.input !== undefined || g.output !== undefined) {
      cases.push({
        input: (g.input ?? '').replace(/\r\n/g, '\n'),
        output: (g.output ?? '').replace(/\r\n/g, '\n'),
        isSample: false,
      });
    }
  }
  return cases;
}

function normalizeKey(key: string): string {
  // strip folder prefix (keep basename without extension)
  const base = key.split('/').pop() ?? key;
  // strip leading "test" or "testcase" prefix, keep the number
  const m = base.match(/^test(?:case)?\s*(.+)$/i);
  return m ? m[1] : base;
}

function naturalCompare(a: string, b: string): number {
  return a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' });
}

/**
 * Parse test cases from a text/markdown/doc file using the format:
 *   ### Test 1
 *   Input:
 *   <input content>
 *   Output:
 *   <output content>
 *
 *   ### Test 2
 *   ...
 *
 * Also supports "Input" / "Output" without colons, and "### Sample 1"
 * to mark sample cases.
 */
export function parseText(content: string): ImportedTestCase[] {
  const normalized = content.replace(/\r\n/g, '\n');
  const cases: ImportedTestCase[] = [];

  // Split on headers that start a new test case
  // Matches: ### Test 1, ### Sample 1, ## Test 1, # Test 1, Test 1:, etc.
  const headerRegex = /(?:^|\n)(?:#{1,6}\s*)?(?:test|sample)\s*(\d+)\b[^\n]*\n/gi;
  const splits: { index: number; num: number; isSample: boolean }[] = [];
  let match: RegExpExecArray | null;
  while ((match = headerRegex.exec(normalized)) !== null) {
    const isSample = /sample/i.test(match[0]);
    splits.push({ index: match.index + match[0].length, num: parseInt(match[1], 10), isSample });
  }

  if (splits.length === 0) {
    // Fallback: try to parse a single Input/Output block
    const single = parseInputOutputBlock(normalized);
    if (single) return [single];
    return [];
  }

  for (let i = 0; i < splits.length; i++) {
    const start = splits[i].index;
    const end = i + 1 < splits.length ? splits[i + 1].index - (splits[i + 1].index - start > 0 ? 0 : 0) : normalized.length;
    // Recompute end as the start of the next header marker
    const realEnd = i + 1 < splits.length ? findHeaderStart(normalized, splits[i + 1].num) : normalized.length;
    const block = normalized.slice(start, realEnd).trim();
    const parsed = parseInputOutputBlock(block);
    if (parsed) {
      cases.push({ ...parsed, isSample: splits[i].isSample });
    }
  }

  return cases;
}

function findHeaderStart(text: string, num: number): number {
  const re = new RegExp(`(?:#{1,6}\\s*)?(?:test|sample)\\s*${num}\\b`, 'i');
  const m = re.exec(text);
  // Back up to include the header line start (newline before ###)
  if (m) {
    let idx = m.index;
    while (idx > 0 && text[idx - 1] !== '\n') idx--;
    return idx;
  }
  return text.length;
}

function parseInputOutputBlock(block: string): ImportedTestCase | null {
  // Find "Input:" and "Output:" markers (case-insensitive, colon optional)
  const inputMarker = block.match(/(?:^|\n)\s*input\s*:?\s*\n/i);
  const outputMarker = block.match(/(?:^|\n)\s*output\s*:?\s*\n/i);

  if (!inputMarker || !outputMarker) return null;

  const inputStart = inputMarker.index! + inputMarker[0].length;
  const inputEnd = outputMarker.index!;
  const input = block.slice(inputStart, inputEnd).trim();

  const outputStart = outputMarker.index! + outputMarker[0].length;
  const output = block.slice(outputStart).split(/\n\s*(?:###|##|#|test|sample)\s/i)[0].trim();

  return { input, output, isSample: false };
}
