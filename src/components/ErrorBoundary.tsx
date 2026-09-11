import React from 'react';
import { supabase } from '@/integrations/supabase/client';

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  reported: boolean;
  reporting: boolean;
}

class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  ErrorBoundaryState
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null, reported: false, reporting: false };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('🔴 Study Sync Error:', error);
    console.error('Component stack:', errorInfo.componentStack);
    // Auto-report silently in background
    this.autoReport(error, errorInfo);
  }

  autoReport = async (error: Error, errorInfo: React.ErrorInfo) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      await supabase.from('error_reports').insert({
        user_id: user?.id ?? null,
        user_email: user?.email ?? 'anonymous',
        area: 'ErrorBoundary (automático)',
        description: `[AUTO] ${error.message}`,
        technical_details: {
          stack: error.stack,
          componentStack: errorInfo.componentStack,
          url: window.location.href,
          userAgent: navigator.userAgent,
          timestamp: new Date().toISOString(),
        },
        status: 'novo',
      });
    } catch (e) {
      // silently fail — never crash in the error handler
    }
  };

  handleManualReport = async () => {
    if (this.state.reported || this.state.reporting) return;
    this.setState({ reporting: true });
    try {
      const { data: { user } } = await supabase.auth.getUser();
      await supabase.from('error_reports').insert({
        user_id: user?.id ?? null,
        user_email: user?.email ?? 'anonymous',
        area: 'ErrorBoundary (manual)',
        description: `[MANUAL] ${this.state.error?.message ?? 'Erro desconhecido'}`,
        technical_details: {
          stack: this.state.error?.stack,
          url: window.location.href,
          userAgent: navigator.userAgent,
          timestamp: new Date().toISOString(),
        },
        status: 'novo',
      });
      this.setState({ reported: true });
    } catch (e) {
      // silently fail
    } finally {
      this.setState({ reporting: false });
    }
  };

  render() {
    if (this.state.hasError) {
      const { reported, reporting } = this.state;

      return (
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '2rem',
          fontFamily: 'system-ui, sans-serif',
          background: '#1a1a2e',
          color: '#e0e0e0',
        }}>
          <div style={{
            maxWidth: '500px',
            width: '100%',
            textAlign: 'center',
            background: '#16213e',
            padding: '2rem',
            borderRadius: '12px',
            border: '1px solid #e94560',
          }}>
            <h1 style={{ color: '#e94560', marginBottom: '1rem' }}>
              ⚠️ Erro no Study Sync
            </h1>
            <p style={{ marginBottom: '1rem', color: '#ccc' }}>
              {this.state.error?.message || 'Ocorreu um erro inesperado.'}
            </p>
            <pre style={{
              textAlign: 'left',
              background: '#0f3460',
              padding: '1rem',
              borderRadius: '8px',
              fontSize: '0.75rem',
              overflow: 'auto',
              maxHeight: '200px',
              color: '#a0a0a0',
              marginBottom: '1.5rem',
            }}>
              {this.state.error?.stack?.split('\n').slice(0, 5).join('\n')}
            </pre>

            {/* Buttons */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <button
                onClick={() => window.location.reload()}
                style={{
                  padding: '0.75rem 2rem',
                  background: '#e94560',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '1rem',
                  width: '100%',
                }}
              >
                Recarregar Página
              </button>

              <button
                onClick={this.handleManualReport}
                disabled={reported || reporting}
                style={{
                  padding: '0.75rem 2rem',
                  background: reported ? '#1a4731' : reporting ? '#333' : '#0f3460',
                  color: reported ? '#4ade80' : '#ccc',
                  border: `1px solid ${reported ? '#4ade80' : '#334155'}`,
                  borderRadius: '8px',
                  cursor: reported || reporting ? 'default' : 'pointer',
                  fontSize: '0.9rem',
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  transition: 'all 0.2s',
                }}
              >
                {reported
                  ? '✅ Erro reportado ao admin!'
                  : reporting
                  ? '⏳ Enviando...'
                  : '🐛 Reportar este erro ao admin'}
              </button>

              {reported && (
                <p style={{ fontSize: '0.75rem', color: '#888', margin: 0 }}>
                  Obrigado! Nossa equipe foi notificada automaticamente.
                </p>
              )}
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
