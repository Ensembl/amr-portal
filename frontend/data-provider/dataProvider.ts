import type { BackendInterface } from './backendInterface';

export type { LocalBackend } from './local-backend/localBackend';
export type { ApiBackend } from './apiBackend';
export type { BackendInterface } from './backendInterface';


type ProviderType = 'local' | 'api';

export const getDataProvider = async ({
  provider
}: {
  provider: ProviderType;
}): Promise<BackendInterface> => {
  if (provider === 'local') {
    const { default: initialiseDuckDb } = await import('./local-backend/initialiseDuckDb');
    const { LocalBackend } = await import('./local-backend/localBackend'); // your old DuckDB-based one
    const duckDb = await initialiseDuckDb();
    return new LocalBackend({ db: duckDb });
  }

  if (provider === 'api') {
    const { ApiBackend } = await import('./apiBackend'); // our new API-based backend
    return new ApiBackend(); // optionally: pass base URL as new ApiBackend(baseUrl)
  }

  throw new Error(`Unknown provider: ${provider}`);
};
