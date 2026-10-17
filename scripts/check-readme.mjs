import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const demo = new URL('../', import.meta.url);
const readmeUrl = new URL('../grip-react/README.md', demo);
const readme = await readFile(readmeUrl, 'utf8');
const normalize = text => text.replaceAll('\r\n', '\n').trimEnd();
const testNames = {
  display: 'tests the display with supplied data, without weather or geocoding producers',
  producer: 'tests the weather producer without React or a geocoder',
  transitive: 'resolves the geocoder as a transitive input of the weather producer',
  composition: 'keeps both columns and their selected cities through provider changes',
};
let count = 0;
const pattern = /<!-- demo-(source|test|declaration): ([^\r\n]+) -->\r?\n```(?:ts|tsx)\r?\n([\s\S]*?)\r?\n```/g;
for (const match of readme.matchAll(pattern)) {
  const [, kind, reference, excerpt] = match;
  const [path, section] = reference.split('#');
  let source = normalize(await readFile(new URL(path, demo), 'utf8'));
  if (kind === 'test') {
    const name = testNames[section];
    if (!name) throw new Error(`Unknown test excerpt: ${reference}`);
    const start = source.indexOf(`it('${name}'`);
    const end = source.indexOf('\n});', start);
    if (start < 0 || end < 0) throw new Error(`Missing test: ${name}`);
    source = source.slice(start, end + '\n});'.length);
  } else if (kind === 'declaration') {
    const start = source.indexOf(`export function ${section}(`);
    if (start < 0) throw new Error(`Missing producer: ${section}`);
    const end = source.indexOf('\nexport function ', start + 1);
    const body = source.slice(start, end < 0 ? undefined : end);
    const fields = body.match(/^\s*(?:provides|destinationParamGrips): .+,$/gm);
    if (fields?.length !== 2) throw new Error(`Expected two dependency declarations: ${reference}`);
    source = fields.map(field => field.trim()).join('\n');
  }
  if (normalize(excerpt) !== source) {
    throw new Error(`README excerpt differs from ${reference}`);
  }
  count++;
}
if (count !== 15) throw new Error(`Expected fifteen source excerpts; found ${count}`);
if (/\{\{[A-Z_]+\}\}|undefined as any|for doc purposes only/.test(readme)) {
  throw new Error('README still contains a placeholder');
}
// Check linked source locally while a documentation change is still unpublished.
const prose = readme.replace(/```[\s\S]*?```/g, '');
const headings = new Set([...prose.matchAll(/^#{1,6} (.+)$/gm)].map(([, text]) =>
  text.toLowerCase().replace(/[^\w\s-]/g, '').trim().replace(/\s/g, '-')));
for (const [, target] of prose.matchAll(/\[[^\]]*\]\(([^)]+)\)/g)) {
  if (target.startsWith('#')) {
    if (!headings.has(target.slice(1))) throw new Error(`Missing heading: ${target}`);
  } else if (!target.startsWith('https://')) {
    await readFile(new URL(target.split('#')[0], readmeUrl));
  } else {
    const source = target.match(/^https:\/\/github\.com\/owebeeone\/grip-react-demo\/blob\/main\/(.+)$/);
    if (source) await readFile(new URL(source[1], demo));
  }
}
console.log(`Verified ${count} README excerpts against ${fileURLToPath(demo)}`);
