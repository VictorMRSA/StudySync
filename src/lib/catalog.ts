/**
 * Helpers puros da Biblioteca IA (sem React/Supabase), testáveis via Node.
 * Espelham as regras do backend (services/catalog.py).
 */

export interface CatalogMaterialRow {
  id: string;
  title: string;
  description?: string | null;
  extracted_text?: string | null;
  file_type?: string | null;
  created_at?: string | null;
  class_id?: string | null;
  subject?: string | null;
  catalog_summary?: string | null;
  topics?: unknown;
  catalog_status?: string | null;
  catalog_edited?: boolean | null;
  classes?: { name?: string | null } | null;
}

export interface CatalogEntry {
  ref: string;
  title: string;
  class_name: string | null;
  subject: string | null;
  summary: string | null;
  topics: string[];
  date: string | null;
}

export interface ClassGroup {
  classId: string;
  className: string;
  ids: string[];
}

const FALLBACK_SUMMARY_CHARS = 300;
const AI_PLACEHOLDER = 'ai-generated';

export function normalizeTopics(value: unknown): string[] {
  let list: unknown[] = [];
  if (Array.isArray(value)) list = value;
  else if (typeof value === 'string') list = value.split(/[\n;]+/);
  const out: string[] = [];
  for (const item of list) {
    const topic = String(item ?? '').replace(/\s+/g, ' ').trim();
    if (topic && !out.includes(topic)) out.push(topic);
  }
  return out;
}

export function topicsToText(topics: unknown): string {
  return normalizeTopics(topics).join('\n');
}

export function textToTopics(text: string): string[] {
  return normalizeTopics(text);
}

/** Ficha provisória para materiais ainda não catalogados pela IA. */
export function fallbackSummary(row: CatalogMaterialRow): string {
  const desc = (row.description || '').replace(/^Resumo de IA gerado:\s*/i, '').trim();
  if (desc) return desc.slice(0, FALLBACK_SUMMARY_CHARS);
  const text = (row.extracted_text || '').trim();
  if (text && text !== AI_PLACEHOLDER) {
    return text.replace(/\s+/g, ' ').slice(0, FALLBACK_SUMMARY_CHARS);
  }
  return '';
}

export function hasUsableText(row: CatalogMaterialRow): boolean {
  const text = (row.extracted_text || '').trim();
  return text.length > 0 && text !== AI_PLACEHOLDER;
}

/** Precisa de (re)indexação: sem ficha pronta, não editada à mão e com texto. */
export function needsIndexing(row: CatalogMaterialRow): boolean {
  return row.catalog_status !== 'ready' && !row.catalog_edited && hasUsableText(row);
}

export function buildCatalogEntries(rows: CatalogMaterialRow[]): {
  entries: CatalogEntry[];
  refToId: Record<string, string>;
} {
  const entries: CatalogEntry[] = [];
  const refToId: Record<string, string> = {};

  rows.forEach((row, index) => {
    const ref = `D${index + 1}`;
    refToId[ref] = row.id;
    entries.push({
      ref,
      title: row.title || 'Documento sem título',
      class_name: row.classes?.name ?? null,
      subject: row.subject || null,
      summary: row.catalog_summary?.trim() || fallbackSummary(row) || null,
      topics: normalizeTopics(row.topics),
      date: row.created_at ? row.created_at.slice(0, 10) : null,
    });
  });

  return { entries, refToId };
}

const STUDYSET_RE = /<studyset>([\s\S]*?)<\/studyset>/i;

export function parseStudySet(text: string): string[] {
  const match = STUDYSET_RE.exec(text || '');
  if (!match) return [];
  const refs: string[] = [];
  for (const ref of match[1].match(/\bD\d+\b/gi) || []) {
    const upper = ref.toUpperCase();
    if (!refs.includes(upper)) refs.push(upper);
  }
  return refs;
}

export function stripStudySet(text: string): string {
  return (text || '').replace(new RegExp(STUDYSET_RE.source, 'gi'), '').trim();
}

/** Converte refs (D1, D4) em ids reais, ignorando refs desconhecidas. */
export function resolveStudySet(text: string, refToId: Record<string, string>): string[] {
  return parseStudySet(text)
    .map(ref => refToId[ref])
    .filter((id): id is string => Boolean(id));
}

export function groupByClass(rows: CatalogMaterialRow[]): ClassGroup[] {
  const map = new Map<string, ClassGroup>();
  for (const row of rows) {
    if (!row.class_id) continue;
    const group = map.get(row.class_id) ?? {
      classId: row.class_id,
      className: row.classes?.name || 'Turma sem nome',
      ids: [],
    };
    group.ids.push(row.id);
    map.set(row.class_id, group);
  }
  return [...map.values()].sort((a, b) => a.className.localeCompare(b.className, 'pt-BR'));
}
