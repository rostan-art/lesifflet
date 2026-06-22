'use client';
import { Component } from 'react';

// Catches render errors so a single bad screen never white-screens the whole app.
export class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    console.error('ErrorBoundary caught:', error, info);
  }

  handleReset = () => {
    this.setState({ hasError: false });
    // Send the user back to a safe state
    if (typeof window !== 'undefined') window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh', display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center', textAlign: 'center',
          padding: 32, background: '#FBF6EC', color: '#1A2B20',
          fontFamily: "'Bricolage Grotesque', 'Inter', sans-serif",
        }}>
          <div style={{ fontSize: 56, marginBottom: 16 }}>⚽</div>
          <div style={{ fontSize: 20, fontWeight: 800, marginBottom: 8 }}>Oups, un petit pépin</div>
          <div style={{ fontSize: 14, color: 'rgba(26,43,32,0.6)', maxWidth: 320, lineHeight: 1.5, marginBottom: 24 }}>
            Cette page n'a pas pu s'afficher. Reviens à l'accueil, tout est sauvegardé.
          </div>
          <button onClick={this.handleReset} style={{
            padding: '12px 28px', borderRadius: 14, border: 'none',
            background: 'linear-gradient(135deg, #0CA15E, #08857C)', color: '#fff',
            fontSize: 15, fontWeight: 800, cursor: 'pointer',
            fontFamily: "'Bricolage Grotesque', 'Inter', sans-serif",
          }}>Retour à l'accueil</button>
        </div>
      );
    }
    return this.props.children;
  }
}
