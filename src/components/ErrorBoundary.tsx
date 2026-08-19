import { Component, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          background: '#f3f4f6',
          padding: '20px',
        }}>
          <div style={{
            background: 'white',
            borderRadius: '8px',
            padding: '40px',
            maxWidth: '500px',
            textAlign: 'center',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
          }}>
            <h1 style={{
              fontSize: '24px',
              fontWeight: 'bold',
              marginBottom: '16px',
              color: '#000',
            }}>
              Er is iets misgegaan
            </h1>
            <p style={{
              color: '#6b7280',
              marginBottom: '24px',
            }}>
              De applicatie heeft een fout aangetroffen. Probeer de pagina te verversen.
            </p>
            {this.state.error && (
              <details style={{
                marginBottom: '24px',
                textAlign: 'left',
                background: '#f9fafb',
                padding: '16px',
                borderRadius: '4px',
                fontSize: '14px',
              }}>
                <summary style={{ cursor: 'pointer', fontWeight: 'bold', marginBottom: '8px' }}>
                  Technische details
                </summary>
                <pre style={{
                  fontSize: '12px',
                  overflow: 'auto',
                  color: '#dc2626',
                }}>
                  {this.state.error.toString()}
                </pre>
              </details>
            )}
            <button
              onClick={() => window.location.reload()}
              style={{
                background: '#000',
                color: 'white',
                padding: '12px 24px',
                borderRadius: '8px',
                border: 'none',
                fontWeight: 'bold',
                cursor: 'pointer',
                fontSize: '16px',
              }}
            >
              Ververs pagina
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
