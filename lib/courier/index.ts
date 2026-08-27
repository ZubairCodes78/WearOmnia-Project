import { CourierProvider } from './types';
import { PostExProvider } from './postex-provider';
import { ManualProvider } from './manual-provider';

export * from './types';
export * from './postex-provider';
export * from './postex-api';
export * from './manual-provider';

const postexProvider = new PostExProvider();
const manualProvider = new ManualProvider();

export function getCourierProvider(providerName?: string | null): CourierProvider {
  const normalized = (providerName || '').toUpperCase();
  if (normalized === 'POSTEX') {
    return postexProvider;
  }
  return manualProvider;
}
