// tests/legal-md.mjs: reads team/rounds/2/research/LEGAL-PT.md (the researcher's note of
// 18 November 2026) into the rows of src/data/legal-pt.json, so the page shows the research's own
// words and a test can check the file against the note field by field (round 4, design PROPOSAL.md
// 6.1 and 6.4). Markdown bold markers are dropped; every word is kept as written, blanks as empty
// strings. Not legal or tax advice. Code Apache-2.0.
// developer.algarve-holiday-homes@AgentiCCells.dinis, 2026-11-19, round 4.

const cells = line => line.trim().replace(/^\|/, '').replace(/\|$/, '').split('|').map(c => c.trim().replace(/\*\*/g, ''));
// The table rows under a heading, up to the next heading.
function table(md, heading) {
  const i = md.indexOf(heading);
  if (i < 0) throw new Error(`no heading ${heading}`);
  const rest = md.slice(i + heading.length);
  const end = rest.search(/\n#{2,3} /);
  const block = end < 0 ? rest : rest.slice(0, end);
  const lines = block.split('\n').filter(l => l.trim().startsWith('|'));
  return lines.slice(2).map(cells);
}
// "https://a ; text; https://b" -> [{ label, url }]: addresses become links, words stay words.
export function splitSources(text) {
  const out = [];
  for (const part of String(text || '').split(/(https?:\/\/[^\s;]+)/)) {
    if (/^https?:\/\//.test(part)) { out.push({ label: part, url: part }); continue; }
    const t = part.replace(/^[\s;,]+|[\s;,]+$/g, '').trim();
    if (t) out.push({ label: t, url: null });
  }
  return out;
}
const GRADE = /\b(high|medium|low|unknown)\b/i;
export const gradeOf = text => { const m = String(text || '').match(GRADE); return m ? m[1].toLowerCase() : 'not given'; };
function checkedOf(text) {
  const m = String(text || '').match(/^(\d{1,2} \w+ \d{4})(?:\s*\((.*)\))?$/);
  return m ? { checked: m[1], checkedNote: m[2] || '' } : { checked: String(text || ''), checkedNote: '' };
}
const five = (section, topicLabel) => r => {
  const [topic, rule, source, checked, sure] = r;
  return { section, topic, rule, source, sources: splitSources(source), ...checkedOf(checked), sure: gradeOf(sure), sureText: sure || '' };
};
export function parseLegal(md) {
  const rows = [
    ...table(md, '## 1. The legal frame').map(five('1')),
    ...table(md, '### 2.1 VAT (IVA)').map(five('2.1')),
    ...table(md, '### 2.2 Income tax (IRS) for a person who runs the AL').map(five('2.2')),
  ];
  const intro = md.slice(md.indexOf('### 2.3 Municipal tourist tax'));
  const date = (intro.match(/Values as found on (\d{1,2} \w+ \d{4})/) || [])[1] || '';
  for (const r of table(md, '### 2.3 Municipal tourist tax')) {
    const [municipality, rate, season, nightCap, age, exemptions, inForce, source, sure] = r;
    // "as above" keeps its words; the grade word (for the chip and the filter) is the row above's.
    const prev = rows[rows.length - 1];
    const grade = /^as above$/i.test(sure || '') && prev?.section === '2.3' ? prev.sure : gradeOf(sure);
    rows.push({ section: '2.3', municipality, rate, season, nightCap, age, exemptions, inForce, source, sources: splitSources(source), sure: grade, sureText: sure || '', checked: date, checkedNote: 'section date' });
  }
  // Section 3: the formulas as text, and the rate table as data.
  const s3 = md.slice(md.indexOf('## 3. Formulas'), md.indexOf('## 4. What to show'));
  const formulas = [];
  for (const m of s3.matchAll(/### (3\.\d) ([^\n]+)\n([\s\S]*?)(?=\n### |$)/g)) formulas.push({ id: m[1], title: m[2].trim(), text: m[3].replace(/\*\*/g, '').trim() });
  const gaps = (md.match(/Gaps to close before release: ([^\n]+)/) || [])[1] || '';
  const srcBlock = md.slice(md.indexOf('## Sources'));
  const sources = srcBlock.split('\n').filter(l => l.startsWith('- ')).map(l => l.slice(2).trim());
  return {
    about: 'Every row of team/rounds/2/research/LEGAL-PT.md (researcher, 18 November 2026), sections 1, 2.1, 2.2 and 2.3, in the research\'s own words, for the made-up example\'s admin. Not legal or tax advice: rules change and depend on each owner\'s situation; check the official text and a qualified professional. Text CC BY 4.0.',
    advice: 'Not legal or tax advice.',
    read: '18 November 2026',
    sectionTitles: { '1': 'The legal frame', '2.1': 'VAT (IVA)', '2.2': 'Income tax (IRS) for a person who runs the AL', '2.3': 'Municipal tourist tax' },
    sectionDate: { '2.3': date },
    rows, formulas, gaps, sources,
  };
}
