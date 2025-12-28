'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { MiniKit, VerificationLevel } from '@worldcoin/minikit-js';
import { useKilroy } from '@/context/KilroyContext';
import { getKilroys } from '@/lib/kilroys';
import { Kilroy, Circle } from '@/lib/types';
import { Page } from '@/components/PageLayout';
import { CircleToggle } from '@/components/CircleToggle';
import { Button, Spinner } from '@worldcoin/mini-apps-ui-kit-react';

export default function ViewKilroys() {
  const router = useRouter();
  const { place, circle, setCircle, isVerifiedHuman, setIsVerifiedHuman } = useKilroy();
  const [kilroys, setKilroys] = useState<Kilroy[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isVerifying, setIsVerifying] = useState(false);

  useEffect(() => {
    if (!place) {
      router.push('/');
      return;
    }
    loadKilroys();
  }, [place, circle, isVerifiedHuman]);

  async function loadKilroys() {
    if (!place) return;

    setIsLoading(true);
    try {
      // If viewing verified circle, only show if user is verified
      const filterCircle = circle === 'verified' && isVerifiedHuman ? 'verified' : 'community';
      const data = await getKilroys(place.place_id, filterCircle);
      setKilroys(data);
    } catch (err) {
      console.error('Error loading kilroys:', err);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleVerify() {
    if (!MiniKit.isInstalled()) {
      // For testing outside World App
      setIsVerifiedHuman(true);
      setCircle('verified');
      return;
    }

    setIsVerifying(true);
    try {
      const result = await MiniKit.commandsAsync.verify({
        action: 'kilroy-verify',
        verification_level: VerificationLevel.Orb,
      });

      if (result.finalPayload.status === 'success') {
        setIsVerifiedHuman(true);
        setCircle('verified');
      }
    } catch (err) {
      console.error('Verification error:', err);
    } finally {
      setIsVerifying(false);
    }
  }

  function handleCircleChange(value: Circle) {
    if (value === 'verified' && !isVerifiedHuman) {
      handleVerify();
    } else {
      setCircle(value);
    }
  }

  function formatTime(timestamp: number): string {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return 'Today';
    } else if (diffDays === 1) {
      return 'Yesterday';
    } else if (diffDays < 7) {
      return `${diffDays} days ago`;
    } else {
      return date.toLocaleDateString();
    }
  }

  if (!place) {
    return null;
  }

  return (
    <Page>
      <Page.Header>
        <div className="flex items-center justify-between">
          <button
            onClick={() => router.push('/')}
            className="text-gray-500 text-sm"
          >
            Back
          </button>
          <h1 className="text-lg font-semibold text-gray-900">Here</h1>
          <div className="w-10" />
        </div>
        <p className="text-xs text-gray-400 text-center mt-1 truncate">
          {place.place_name}
        </p>

        <div className="mt-4">
          <CircleToggle
            value={circle}
            onChange={handleCircleChange}
            disabled={isVerifying}
          />
        </div>
      </Page.Header>

      <Page.Main className="flex flex-col gap-4">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Spinner />
          </div>
        ) : kilroys.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <p className="text-gray-400 text-lg mb-2">Nothing here yet.</p>
            <p className="text-gray-400 text-sm">Be the first to leave something.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-6">
            {kilroys.map((kilroy) => (
              <article key={kilroy.id} className="flex flex-col gap-2">
                <img
                  src={kilroy.image_url}
                  alt=""
                  className="w-full aspect-square object-cover rounded-lg bg-gray-100"
                  loading="lazy"
                />
                {kilroy.caption && (
                  <p className="text-gray-900 text-sm">{kilroy.caption}</p>
                )}
                <p className="text-gray-400 text-xs">{formatTime(kilroy.created_at)}</p>
              </article>
            ))}
          </div>
        )}
      </Page.Main>

      <Page.Footer>
        <Button
          onClick={() => router.push('/drop')}
          variant="primary"
          size="lg"
          className="w-full"
        >
          Leave something
        </Button>
      </Page.Footer>
    </Page>
  );
}
