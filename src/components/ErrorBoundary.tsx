import React from 'react';

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  ErrorBoundaryState
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('🔴 Study Sync Error:', error);
    console.error('Component stack:', errorInfo.componentStack);
  }

  render() {
    if (this.state.hasError) {
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
            }}>
              {this.state.error?.stack?.split('\n').slice(0, 5).join('\n')}
            </pre>
            <button
              onClick={() => window.location.reload()}
              style={{
                marginTop: '1.5rem',
                padding: '0.75rem 2rem',
                background: '#e94560',
                color: '#fff',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '1rem',
              }}
            >
              Recarregar Página
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
