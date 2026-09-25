const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';

interface ApiOptions {
  method?: string;
  body?: any;
  headers?: Record<string, string>;
}

async function apiRequest<T>(endpoint: string, options: ApiOptions = {}): Promise<T> {
  const { method = 'POST', body, headers = {} } = options;

  const config: RequestInit = {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
  };

  if (body && !(body instanceof FormData)) {
    config.body = JSON.stringify(body);
  } else if (body instanceof FormData) {
    delete (config.headers as any)['Content-Type'];
    config.body = body;
  }

  const response = await fetch(`${API_BASE}${endpoint}`, config);

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: 'Erro de conexão com o servidor' }));
    throw new Error(errorData.error || errorData.message || `Erro ${response.status}`);
  }

  return response.json();
}

/**
 * Consome o endpoint /api/summarize via Server-Sent Events (streaming).
 * Chama onChunk a cada token recebido e resolve com o resultado final.
 * Isso evita o timeout do Cloudflare quando o Ollama roda lento no CPU.
 */
async function summarizeStream(
  content: string,
  type: string = 'resumo',
  feedback?: string,
  onChunk?: (chunk: string) => void
): Promise<{ result: string; type: string; success: boolean }> {
  const response = await fetch(`${API_BASE}/api/summarize`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ content, type, feedback }),
  });

  if (!response.ok || !response.body) {
    const err = await response.json().catch(() => ({ error: 'Erro de conexão' }));
    throw new Error(err.error || `Erro ${response.status}`);
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let finalResult: { result: string; type: string; success: boolean } | null = null;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    const text = decoder.decode(value, { stream: true });
    const lines = text.split('\n');

    for (const line of lines) {
      if (!line.startsWith('data: ')) continue;
      try {
        const data = JSON.parse(line.slice(6));
        if (data.chunk && onChunk) {
          onChunk(data.chunk);
        }
        if (data.done && data.result) {
          finalResult = { result: data.result, type: data.type, success: data.success };
        }
        if (data.error) {
          throw new Error(data.error);
        }
      } catch (e: any) {
        if (e.message && !e.message.includes('JSON')) throw e;
      }
    }
  }

  if (!finalResult) throw new Error('Resposta incompleta do servidor');
  return finalResult;
}

export const api = {
  chat: (message: string, history: any[]) =>
    apiRequest<{ response: string; success: boolean }>('/api/chat', { body: { message, history } }),

  // Usa streaming para evitar timeout do Cloudflare em CPU lento
  summarize: (
    content: string,
    type: string = 'resumo',
    feedback?: string,
    onChunk?: (c: string) => void
  ) => summarizeStream(content, type, feedback, onChunk),

  analyze: (content: string, title?: string) =>
    apiRequest<{ analysis: any; success: boolean }>('/api/analyze', { body: { content, title } }),

  generateQuiz: (content: string, title: string) =>
    apiRequest<{ questions: any[] }>('/api/quiz', { body: { content, title } }),

  generateFlashcards: (content: string, title: string) =>
    apiRequest<{ flashcards: any[] }>('/api/flashcards', { body: { content, title } }),

  uploadDocument: (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return apiRequest<{ content: string; success: boolean; file_name: string }>(
      '/api/documents/upload',
      { body: formData }
    );
  },

  ragQuery: (query: string, sessionId: string) =>
    apiRequest<{ answer: string; sources: string[]; success: boolean }>('/api/rag/query', {
      body: { query, session_id: sessionId },
    }),
};
