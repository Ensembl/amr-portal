export type { LocalBackend } from './localBackend';
export type { ApiBackend } from './apiBackend';

type ProviderType = 'local' | 'api';

export const getDataProvider = async ({
  provider
}: {
  provider: ProviderType;
}) => {
  if (provider === 'local') {
    const { default: initialiseDuckDb } = await import('./initialiseDuckDb');
    const { LocalBackend } = await import('./localBackend'); // your old DuckDB-based one
    const duckDb = await initialiseDuckDb();
    return new LocalBackend({ db: duckDb });
  }

  if (provider === 'api') {
    const { ApiBackend } = await import('./apiBackend'); // our new API-based backend
    return new ApiBackend(); // optionally: pass base URL as new ApiBackend(baseUrl)
  }

  throw new Error(`Unknown provider: ${provider}`);
};
