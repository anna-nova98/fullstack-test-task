"use client";

import { Component, ReactNode } from "react";

type Props = { children: ReactNode };
type State = { error: Error | null };

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  render() {
    if (this.state.error) {
      return (
        <div className="error-banner" style={{ margin: 24, borderRadius: 10 }}>
          ⚠ Что-то пошло не так: {this.state.error.message}
          <button
            onClick={() => this.setState({ error: null })}
            style={{ marginLeft: 12, background: "none", border: "none", cursor: "pointer", color: "inherit", textDecoration: "underline" }}
          >
            Попробовать снова
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
