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

export const api = {
  chat: (message: string, history: any[]) => 
    apiRequest<{ response: string; success: boolean }>('/api/chat', { body: { message, history } }),
  
  summarize: (content: string, type: string = 'resumo', feedback?: string) =>
    apiRequest<{ result: string; type: string; success: boolean }>('/api/summarize', { body: { content, type, feedback } }),
  
  analyze: (content: string, title?: string) =>
    apiRequest<{ analysis: any; success: boolean }>('/api/analyze', { body: { content, title } }),
  
  generateQuiz: (content: string, title: string) =>
    apiRequest<{ questions: any[] }>('/api/quiz', { body: { content, title } }),
  
  generateFlashcards: (content: string, title: string) =>
    apiRequest<{ flashcards: any[] }>('/api/flashcards', { body: { content, title } }),
  
  uploadDocument: (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return apiRequest<{ content: string; success: boolean; file_name: string }>('/api/documents/upload', { body: formData });
  },
  
  ragQuery: (query: string, sessionId: string) =>
    apiRequest<{ answer: string; sources: string[]; success: boolean }>('/api/rag/query', { body: { query, session_id: sessionId } }),
};
