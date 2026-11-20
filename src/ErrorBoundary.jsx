import React from 'react';
import { STORAGE_KEYS, writeJson } from './storage.js';

// Last line of defence: a render error shows a recovery screen instead of a blank page.
export default class ErrorBoundary extends React.Component {
  state = { error: null };

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    // Hook your error reporting service (Sentry, Datadog, etc.) in here.
    console.error('BELTALY storefront error', error, info?.componentStack);
  }

  resetStore = () => {
    [STORAGE_KEYS.cart, STORAGE_KEYS.saved, STORAGE_KEYS.orders].forEach((key) => writeJson(key, null));
    window.location.replace(window.location.pathname);
  };

  render() {
    if (!this.state.error) return this.props.children;
    return (
      <main className="error-screen" role="alert">
        <p className="eyebrow">BELTALY</p>
        <h1>Something slipped a notch.</h1>
        <p>The page hit an unexpected problem. Reloading usually fixes it.</p>
        <div className="error-actions">
          <button className="btn" onClick={() => window.location.reload()}>Reload the page</button>
          <button className="plain-button text-link" onClick={this.resetStore}>Reset bag and saved items</button>
        </div>
      </main>
    );
  }
}
