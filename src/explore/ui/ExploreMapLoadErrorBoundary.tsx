import { Component, type ErrorInfo, type ReactNode } from 'react';

type Props = { children: ReactNode; onRetry?: () => void };

type State = { error: Error | null };

/** Catches Leaflet / map chunk failures without blanking the whole app. */
export class ExploreMapLoadErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error('[ExploreMap]', error, info);
  }

  render() {
    if (this.state.error) {
      return (
        <div className="flex h-full min-h-[280px] w-full flex-col items-center justify-center gap-3 bg-[#eef2f6] px-6 text-center">
          <p className="text-sm font-semibold text-neutral-800">Map could not start</p>
          <p className="max-w-sm text-xs text-neutral-600">{this.state.error.message}</p>
          <button
            type="button"
            className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
            onClick={() => {
              this.setState({ error: null });
              this.props.onRetry?.();
              window.location.reload();
            }}
          >
            Reload map
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
