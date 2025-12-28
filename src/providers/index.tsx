'use client';

import { MiniKitProvider } from '@worldcoin/minikit-js/minikit-provider';
import { KilroyProvider } from '@/context/KilroyContext';
import dynamic from 'next/dynamic';
import type { ReactNode } from 'react';

const ErudaProvider = dynamic(
  () => import('@/providers/Eruda').then((c) => c.ErudaProvider),
  { ssr: false }
);

interface ClientProvidersProps {
  children: ReactNode;
}

/**
 * ClientProvider wraps the app with essential context providers.
 *
 * - ErudaProvider: In-browser console for development debugging
 * - MiniKitProvider: Required for MiniKit functionality
 * - KilroyProvider: App state management
 */
export default function ClientProviders({ children }: ClientProvidersProps) {
  return (
    <ErudaProvider>
      <MiniKitProvider>
        <KilroyProvider>{children}</KilroyProvider>
      </MiniKitProvider>
    </ErudaProvider>
  );
}
