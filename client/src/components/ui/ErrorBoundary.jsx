import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('SmritiSetu Portal Runtime Error:', error, errorInfo);
  }

  handleReload = () => {
    this.setState({ hasError: false, error: null });
    if (this.props.onReset) {
      this.props.onReset();
    } else {
      window.location.reload();
    }
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[300px] flex flex-col items-center justify-center text-center p-8 space-y-4 bg-white rounded-3xl border-2 border-rose-200 shadow-sm m-4">
          <div className="w-14 h-14 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center">
            <AlertCircle className="w-7 h-7" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900">
              {this.props.title || 'Something went wrong'}
            </h3>
            <p className="text-sm text-slate-500 mt-1 max-w-md">
              {this.state.error?.message || 'An unexpected error occurred. Please try refreshing.'}
            </p>
          </div>
          <button
            onClick={this.handleReload}
            className="flex items-center gap-2 px-5 py-2.5 bg-indigo-700 hover:bg-indigo-800 text-white font-bold text-sm rounded-xl shadow cursor-pointer transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Reload View
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
