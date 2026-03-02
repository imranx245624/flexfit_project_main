import React from "react";

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    // eslint-disable-next-line no-console
    console.error("ErrorBoundary caught:", error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="not-found-page container">
          <div className="ff-card">
            <h1>Something went wrong</h1>
            <p className="small-muted">
              An unexpected error occurred. Try reloading or return to the home page.
            </p>
            <div className="not-found-actions">
              <button className="btn" type="button" onClick={() => window.location.reload()}>
                Reload
              </button>
              <a className="btn-ghost" href="/">Go home</a>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;
