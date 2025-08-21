import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // Log error details
    this.setState({
      error: error,
      errorInfo: errorInfo
    });
    
    // You can also log the error to an error reporting service here
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      return (
        <div className="min-h-screen flex items-center justify-center bg-background dark:bg-darkBackground">
          <div className="text-center p-8 max-w-md mx-auto">
            <div className="text-6xl mb-4">😵</div>
            <h1 className="text-2xl font-bold text-textPrimary dark:text-darkTextPrimary mb-4">
              Oops! Jotain meni pieleen
            </h1>
            <p className="text-textSecondary dark:text-darkTextSecondary mb-6">
              Sovelluksessa tapahtui odottamaton virhe. Yritä päivittää sivu.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="bg-primary hover:bg-primary/80 text-white px-6 py-2 rounded-lg transition-colors"
            >
              Päivitä sivu
            </button>
            {process.env.NODE_ENV === 'development' && (
              <details className="mt-6 text-left">
                <summary className="cursor-pointer text-sm text-error">
                  Tekninen tieto (development)
                </summary>
                <pre className="mt-2 text-xs bg-gray-100 dark:bg-gray-800 p-4 rounded overflow-auto">
                  {this.state.error && this.state.error.toString()}
                  {this.state.errorInfo.componentStack}
                </pre>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
