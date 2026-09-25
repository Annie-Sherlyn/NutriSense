import { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children?: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(_: Error): State {
    return { hasError: true };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="flex items-center justify-center min-h-[100dvh] bg-[#FBF6EE] p-6 text-center">
          <div>
            <h2 className="text-xl font-bold text-[#1F5B45] mb-2">Oops, something went wrong</h2>
            <p className="text-sm text-gray-600 mb-4">We encountered an unexpected error. Please refresh the page.</p>
            <button 
              onClick={() => window.location.reload()}
              className="px-6 py-2 bg-[#1F5B45] text-white rounded-full text-sm font-medium"
            >
              Reload
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
