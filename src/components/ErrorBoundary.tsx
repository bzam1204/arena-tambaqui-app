import { Component, type ErrorInfo, type ReactNode } from 'react';

type Props = {
  children: ReactNode;
};

type State = {
  hasError: boolean;
  error?: Error;
};

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error', error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: undefined });
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-[#0B0E14] px-6">
          <div className="max-w-md w-full bg-[#141A26] border border-[#2D3A52] rounded-lg p-6 text-center shadow-lg">
            <p className="text-sm font-mono-technical uppercase tracking-wide text-[#FF6B00] mb-2">Falha inesperada</p>
            <p className="text-[#E6F1FF] text-base mb-4">
              Algo saiu do protocolo. Podemos tentar novamente ou voltar mais tarde.
            </p>
            {this.state.error ? (
              <pre className="text-left text-xs text-[#7F94B0] bg-[#0B0E14] border border-[#2D3A52] rounded p-3 overflow-auto max-h-40 mb-4">
                {this.state.error.message}
              </pre>
            ) : null}
            <button
              onClick={this.handleRetry}
              className="w-full bg-[#00F0FF] text-[#0B0E14] font-mono-technical uppercase py-3 rounded-lg hover:bg-[#00d4e0] transition-colors"
            >
              [ RECARREGAR ]
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
