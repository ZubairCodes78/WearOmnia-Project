'use client';

import dynamic from 'next/dynamic';

// Lazy-load the heavy chat widget (22KB) only after initial paint
// ssr: false is valid here because this is a Client Component file
const SupportAssistantLazy = dynamic(
  () => import('./SupportAssistant').then((m) => m.SupportAssistant),
  { ssr: false, loading: () => null },
);

export function LazySupportAssistant() {
  return <SupportAssistantLazy />;
}
