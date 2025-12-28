'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { MiniKit } from '@worldcoin/minikit-js';
import { useKilroy } from '@/context/KilroyContext';
import { resolvePlace, getCachedPlace } from '@/lib/place';
import { hasKilroys } from '@/lib/kilroys';
import { Page } from '@/components/PageLayout';
import { Button, Spinner } from '@worldcoin/mini-apps-ui-kit-react';

export default function Landing() {
  const router = useRouter();
  const {
    place,
    setPlace,
    setLocationDenied,
    isLoading,
    setIsLoading,
  } = useKilroy();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    initializeLocation();
  }, []);

  async function initializeLocation() {
    setIsLoading(true);
    setError(null);

    // Check for cached place first
    const cached = getCachedPlace();
    if (cached) {
      setPlace(cached);
      await triggerHapticIfKilroys(cached.place_id);
      setIsLoading(false);
      return;
    }

    // Request location
    if (!navigator.geolocation) {
      setError('Location is not supported by your browser');
      setLocationDenied(true);
      setIsLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          const resolved = await resolvePlace(latitude, longitude);
          setPlace(resolved);
          await triggerHapticIfKilroys(resolved.place_id);
        } catch (err) {
          console.error('Place resolution error:', err);
          setError('Could not determine your location');
        } finally {
          setIsLoading(false);
        }
      },
      (err) => {
        console.error('Geolocation error:', err);
        setLocationDenied(true);
        setIsLoading(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000,
      }
    );
  }

  async function triggerHapticIfKilroys(placeId: string) {
    try {
      const exists = await hasKilroys(placeId);
      if (exists && MiniKit.isInstalled()) {
        MiniKit.commands.sendHapticFeedback({
          hapticsType: 'notification',
          style: 'success',
        });
      }
    } catch (err) {
      // Silently fail - haptics are non-critical
    }
  }

  if (isLoading) {
    return (
      <Page>
        <Page.Main className="flex flex-col items-center justify-center gap-4">
          <Spinner />
          <p className="text-gray-500">Finding your location...</p>
        </Page.Main>
      </Page>
    );
  }

  if (error || !place) {
    return (
      <Page>
        <Page.Main className="flex flex-col items-center justify-center gap-6 px-8 text-center">
          <div className="text-6xl">📍</div>
          <h1 className="text-xl font-medium text-gray-900">
            Kilroy only works when you're somewhere.
          </h1>
          <p className="text-gray-500">
            Enable location to see what's been left here.
          </p>
          <Button onClick={initializeLocation} variant="primary" size="lg">
            Try Again
          </Button>
        </Page.Main>
      </Page>
    );
  }

  return (
    <Page>
      <Page.Header>
        <h1 className="text-2xl font-semibold text-gray-900">Kilroy</h1>
        <p className="text-sm text-gray-500 mt-1 truncate">{place.place_name}</p>
      </Page.Header>

      <Page.Main className="flex flex-col gap-4">
        <Button
          onClick={() => router.push('/view')}
          variant="secondary"
          size="lg"
          className="w-full"
        >
          See what's here
        </Button>

        <Button
          onClick={() => router.push('/drop')}
          variant="primary"
          size="lg"
          className="w-full"
        >
          Leave something
        </Button>
      </Page.Main>
    </Page>
  );
}
