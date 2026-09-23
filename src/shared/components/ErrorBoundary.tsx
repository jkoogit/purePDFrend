import { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export default class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="p-8 flex flex-col items-center justify-center min-h-[400px] text-center bg-slate-900/80 border border-red-900/40 rounded-2xl m-4 backdrop-blur-md shadow-2xl">
          <div className="w-14 h-14 rounded-2xl bg-red-950/60 border border-red-800/60 flex items-center justify-center text-red-400 mb-4 shadow-lg shadow-red-950/40">
            <AlertTriangle className="w-7 h-7" />
          </div>
          <h2 className="text-lg font-bold text-white mb-2">
            {this.props.fallbackTitle || '화면을 불러오는 도중 오류가 발생했습니다.'}
          </h2>
          <p className="text-xs text-slate-400 max-w-md mb-6 leading-relaxed">
            화면 렌더링 중 예기치 않은 오류가 발생했습니다. 아래 버튼을 눌러 초기화하거나 새로고침해 주세요.
          </p>
          {this.state.error && (
            <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl max-w-lg w-full text-left font-mono text-[11px] text-red-300 mb-6 overflow-x-auto">
              <span className="font-bold text-red-400">Error: </span>
              {this.state.error.message}
            </div>
          )}
          <div className="flex items-center gap-3">
            <button
              onClick={() => this.setState({ hasError: false, error: null })}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-all"
            >
              다시 시도
            </button>
            <button
              onClick={this.handleReset}
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-lg shadow-indigo-600/30 flex items-center gap-1.5 transition-all"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              새로고침
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
