export type { LocalBackend } from './localBackend';

export const getDataProvider = async ({
  provider
}: {
  provider: 'local' | 'remote';
}) => {
  const { default: initialiseDuckDb } = await import('./initialiseDuckDb');
  const { LocalBackend } = await import('./localBackend');
  const duckDb = await initialiseDuckDb();
  const backend = new LocalBackend({ db: duckDb });
  return backend;
};