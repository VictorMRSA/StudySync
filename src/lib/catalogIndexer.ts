import { supabase } from '@/integrations/supabase/client';
import { api } from '@/lib/api';

export interface IndexableMaterial {
  id: string;
  title: string;
  description?: string | null;
  extracted_text?: string | null;
  className?: string | null;
}

/**
 * Gera a ficha de catálogo (IA) e grava em `materials`.
 * - Nunca sobrescreve fichas editadas à mão (`catalog_edited = true`).
 * - Em falha, marca `catalog_status = 'failed'` para permitir reindexar depois.
 * Retorna true se a ficha ficou pronta.
 */
export async function indexMaterial(material: IndexableMaterial): Promise<boolean> {
  const content = (material.extracted_text || '').trim();
  if (!content) return false;

  try {
    const entry = await api.catalogGenerate(
      content,
      material.title,
      material.className ?? undefined,
      material.description ?? undefined
    );

    const { error } = await (supabase.from('materials') as any)
      .update({
        subject: entry.subject || null,
        catalog_summary: entry.summary || null,
        topics: entry.topics || [],
        catalog_status: 'ready',
        catalog_updated_at: new Date().toISOString(),
      })
      .eq('id', material.id)
      .eq('catalog_edited', false);

    if (error) throw error;
    return true;
  } catch (err) {
    console.error('Falha ao indexar material no catálogo:', err);
    await (supabase.from('materials') as any)
      .update({ catalog_status: 'failed' })
      .eq('id', material.id)
      .eq('catalog_edited', false);
    return false;
  }
}
