import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends React.Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    const { hasError, error } = this.state;
    const { children } = (this as any).props;

    if (hasError) {
      let errorMessage = "Ocorreu um erro inesperado. Por favor, tente recarregar a página.";
      let isQuotaError = false;

      if (error) {
        try {
          const errorStr = error.message;
          if (errorStr.includes('Quota exceeded') || errorStr.includes('Quota limit exceeded')) {
            isQuotaError = true;
            errorMessage = "O limite diário de uso gratuito do banco de dados foi atingido. O acesso será restaurado automaticamente amanhã. Por favor, tente novamente mais tarde.";
          } else {
            // Try to parse as JSON if it's from handleFirestoreError
            const parsed = JSON.parse(errorStr);
            if (parsed.error && (parsed.error.includes('Quota exceeded') || parsed.error.includes('Quota limit exceeded'))) {
              isQuotaError = true;
              errorMessage = "O limite diário de uso gratuito do banco de dados foi atingido. O acesso será restaurado automaticamente amanhã. Por favor, tente novamente mais tarde.";
            }
          }
        } catch (e) {
          // Not JSON or other error, keep default message
          if (error.message.includes('Quota exceeded') || error.message.includes('Quota limit exceeded')) {
            isQuotaError = true;
            errorMessage = "O limite diário de uso gratuito do banco de dados foi atingido. O acesso será restaurado automaticamente amanhã. Por favor, tente novamente mais tarde.";
          }
        }
      }

      return (
        <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4 font-sans">
          <div className="bg-zinc-900 border border-emerald-500/30 rounded-3xl p-8 max-w-md w-full text-center shadow-2xl backdrop-blur-xl">
            <div className={`w-16 h-16 ${isQuotaError ? 'bg-yellow-500/20' : 'bg-red-500/20'} rounded-full flex items-center justify-center mx-auto mb-6`}>
              {isQuotaError ? (
                <svg className="w-8 h-8 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              ) : (
                <svg className="w-8 h-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              )}
            </div>
            <h1 className="text-2xl font-black text-white mb-4 uppercase tracking-tighter">
              {isQuotaError ? 'Limite Atingido' : 'Algo deu errado'}
            </h1>
            <p className="text-emerald-400/70 mb-8 text-sm font-medium leading-relaxed">
              {errorMessage}
            </p>
            {!isQuotaError && (
              <button
                onClick={() => window.location.reload()}
                className="w-full bg-gradient-to-r from-emerald-500 to-yellow-500 hover:scale-[1.02] active:scale-[0.98] text-white font-black py-4 rounded-2xl transition-all shadow-lg shadow-emerald-500/20 uppercase tracking-widest text-xs"
              >
                Recarregar Página
              </button>
            )}
            {isQuotaError && (
              <div className="pt-4 border-t border-emerald-500/10">
                <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">
                  Dica: O limite reinicia diariamente às 00:00 PST.
                </p>
              </div>
            )}
            {error && !isQuotaError && (
              <pre className="mt-6 p-4 bg-black/50 rounded-xl text-left text-[10px] text-red-400/70 overflow-auto max-h-40 font-mono">
                {error.toString()}
              </pre>
            )}
          </div>
        </div>
      );
    }

    return children;
  }
}

export default ErrorBoundary;
