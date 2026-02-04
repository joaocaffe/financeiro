import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCcw } from 'lucide-react';

interface Props {
    children: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
    errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
    public state: State = {
        hasError: false,
        error: null,
        errorInfo: null
    };

    static getDerivedStateFromError(error: Error): Partial<State> {
        return { hasError: true, error };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error('Uncaught error:', error, errorInfo);
        this.setState({ errorInfo });
    }

    public render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen flex items-center justify-center bg-red-50 p-6">
                    <div className="bg-white max-w-lg w-full p-8 rounded-3xl shadow-xl border border-red-100 flex flex-col items-center text-center">
                        <div className="w-16 h-16 bg-red-100 text-red-500 rounded-full flex items-center justify-center mb-6">
                            <AlertTriangle size={32} />
                        </div>
                        <h1 className="text-xl font-black text-slate-800 mb-2">Ops! Algo deu errado.</h1>
                        <p className="text-slate-500 mb-6 text-sm">
                            O aplicativo encontrou um erro inesperado. Tente recarregar a página.
                        </p>

                        {this.state.error && (
                            <div className="w-full bg-slate-900 text-slate-300 p-4 rounded-xl text-left text-xs font-mono overflow-auto max-h-48 mb-6">
                                <p className="text-red-400 font-bold mb-2">{this.state.error.toString()}</p>
                                <div className="whitespace-pre-wrap opacity-70">
                                    {this.state.errorInfo?.componentStack}
                                </div>
                            </div>
                        )}

                        <button
                            onClick={() => window.location.reload()}
                            className="px-6 py-3 bg-red-600 text-white rounded-xl font-bold shadow-lg shadow-red-200 hover:bg-red-700 transition-all flex items-center gap-2"
                        >
                            <RefreshCcw size={18} />
                            Recarregar Aplicativo
                        </button>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}
