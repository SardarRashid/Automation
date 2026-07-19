import React, { Component, ErrorInfo, ReactNode } from "react";

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class MobileErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("MobileStockTake error:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="fixed inset-0 bg-red-950 text-red-200 p-6 flex flex-col z-[9999] overflow-auto">
          <h2 className="text-2xl font-bold mb-4 text-red-400">Mobile UI Crashed</h2>
          <div className="bg-black/30 p-4 rounded-lg font-mono text-sm whitespace-pre-wrap break-all mb-4">
            {this.state.error?.toString()}
          </div>
          <div className="bg-black/30 p-4 rounded-lg font-mono text-xs whitespace-pre-wrap break-all overflow-auto flex-1">
            {this.state.errorInfo?.componentStack}
          </div>
          <button 
            onClick={() => window.location.href = '/'}
            className="mt-6 w-full bg-red-600 hover:bg-red-500 text-white font-bold py-3 rounded-xl"
          >
            Restart App
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
