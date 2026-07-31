import { Component } from "react";

export class ErrorBoundary extends Component {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error) {
    console.error("Livssystem kunde inte rendera vyn.", error);
  }

  render() {
    if (this.state.failed) {
      return (
        <main className="fatal-state">
          <div className="card">
            <span className="eyebrow">SÄKER ÅTERHÄMTNING</span>
            <h1>Något fastnade.</h1>
            <p>Din data ligger kvar på enheten. Ladda om appen för att återställa vyn.</p>
            <button className="primary-button" onClick={() => window.location.reload()}>Ladda om</button>
          </div>
        </main>
      );
    }
    return this.props.children;
  }
}
