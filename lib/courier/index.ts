import { CourierProvider } from './types';
import { ManualCourierProvider } from './manual-provider';

// Factory: Returns the active courier provider
// When PostEx API is enabled, swap this to PostExCourierProvider
export function getCourierProvider(): CourierProvider {
  return new ManualCourierProvider();
}

export { ManualCourierProvider } from './manual-provider';
export * from './types';
