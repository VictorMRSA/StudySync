import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildCatalogEntries,
  fallbackSummary,
  groupByClass,
  needsIndexing,
  normalizeTopics,
  parseStudySet,
  resolveStudySet,
  stripStudySet,
  textToTopics,
  topicsToText,
  type CatalogMaterialRow,
} from './catalog';

const rows: CatalogMaterialRow[] = [
  { id: 'a', title: 'Aula 3', class_id: 'c1', classes: { name: 'Cálculo I' }, subject: 'Matemática',
    catalog_summary: 'Derivadas.', topics: ['Unidade 3: Derivadas'], catalog_status: 'ready',
    created_at: '2026-10-01T10:00:00Z', extracted_text: 'texto' },
  { id: 'b', title: 'Aula 5', class_id: 'c2', classes: { name: 'Física II' },
    description: 'Resumo de IA gerado: resumo', extracted_text: 'ondas e som', catalog_status: 'pending' },
  { id: 'c', title: 'Aula 4', class_id: 'c1', classes: { name: 'Cálculo I' }, extracted_text: 'ai-generated' },
];

test('buildCatalogEntries atribui refs D# e mapeia para ids', () => {
  const { entries, refToId } = buildCatalogEntries(rows);
  assert.deepEqual(entries.map(e => e.ref), ['D1', 'D2', 'D3']);
  assert.deepEqual(refToId, { D1: 'a', D2: 'b', D3: 'c' });
  assert.equal(entries[0].class_name, 'Cálculo I');
  assert.equal(entries[0].date, '2026-10-01');
  assert.deepEqual(entries[0].topics, ['Unidade 3: Derivadas']);
});

test('ficha pendente usa fallback (descrição sem prefixo) e texto', () => {
  const { entries } = buildCatalogEntries(rows);
  assert.equal(entries[1].summary, 'resumo');
  assert.equal(fallbackSummary({ id: 'x', title: 'T', extracted_text: '  muito   texto  ' }), 'muito texto');
  assert.equal(entries[2].summary, null);
});

test('needsIndexing respeita status, edição manual e texto', () => {
  assert.equal(needsIndexing(rows[0]), false);
  assert.equal(needsIndexing(rows[1]), true);
  assert.equal(needsIndexing(rows[2]), false);
  assert.equal(needsIndexing({ ...rows[1], catalog_edited: true }), false);
  assert.equal(needsIndexing({ ...rows[1], catalog_status: 'failed' }), true);
});

test('parseStudySet / stripStudySet / resolveStudySet', () => {
  const text = 'Aqui estão:\n<studyset>D1, d2 ,D2, D9</studyset>';
  assert.deepEqual(parseStudySet(text), ['D1', 'D2', 'D9']);
  assert.equal(stripStudySet(text), 'Aqui estão:');
  assert.deepEqual(resolveStudySet(text, { D1: 'a', D2: 'b' }), ['a', 'b']);
  assert.deepEqual(parseStudySet('sem bloco'), []);
  assert.deepEqual(parseStudySet('<studyset></studyset>'), []);
});

test('groupByClass agrupa por turma e ordena por nome', () => {
  const groups = groupByClass(rows);
  assert.deepEqual(groups.map(g => [g.className, g.ids]), [['Cálculo I', ['a', 'c']], ['Física II', ['b']]]);
});

test('tópicos: normalização e ida/volta texto', () => {
  assert.deepEqual(normalizeTopics('a;b\n a \nc'), ['a', 'b', 'c']);
  assert.deepEqual(normalizeTopics(null), []);
  assert.deepEqual(normalizeTopics({}), []);
  assert.equal(topicsToText(['x', 'y']), 'x\ny');
  assert.deepEqual(textToTopics('x\n\n y '), ['x', 'y']);
});
