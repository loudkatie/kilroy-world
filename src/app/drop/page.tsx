'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { MiniKit, VerificationLevel } from '@worldcoin/minikit-js';
import { useKilroy } from '@/context/KilroyContext';
import { createKilroy } from '@/lib/kilroys';
import { compressImage } from '@/lib/image';
import { Circle } from '@/lib/types';
import { Page } from '@/components/PageLayout';
import { CircleToggle } from '@/components/CircleToggle';
import { Button, Spinner } from '@worldcoin/mini-apps-ui-kit-react';

const MAX_CAPTION_LENGTH = 200;

export default function DropKilroy() {
  const router = useRouter();
  const { place, isVerifiedHuman, setIsVerifiedHuman } = useKilroy();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [caption, setCaption] = useState('');
  const [circle, setCircle] = useState<Circle>('community');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleImageSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file');
      return;
    }

    setSelectedImage(file);
    setImagePreview(URL.createObjectURL(file));
    setError(null);
  }

  function handleCaptionChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    const value = e.target.value;
    if (value.length <= MAX_CAPTION_LENGTH) {
      setCaption(value);
    }
  }

  async function handleVerify() {
    if (!MiniKit.isInstalled()) {
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

  async function handleSubmit() {
    if (!place || !selectedImage) return;

    setIsSubmitting(true);
    setError(null);

    try {
      // Compress image
      const compressedBlob = await compressImage(selectedImage);

      // Upload and create kilroy
      await createKilroy(place, compressedBlob, caption, circle);

      // Navigate back to view
      router.push('/view');
    } catch (err) {
      console.error('Error creating kilroy:', err);
      setError('Failed to create. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  }

  if (!place) {
    router.push('/');
    return null;
  }

  return (
    <Page>
      <Page.Header>
        <div className="flex items-center justify-between">
          <button
            onClick={() => router.back()}
            className="text-gray-500 text-sm"
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <h1 className="text-lg font-semibold text-gray-900">Leave something</h1>
          <div className="w-12" />
        </div>
        <p className="text-xs text-gray-400 text-center mt-1 truncate">
          {place.place_name}
        </p>
      </Page.Header>

      <Page.Main className="flex flex-col gap-6">
        {/* Image picker */}
        <div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handleImageSelect}
            className="hidden"
          />

          {imagePreview ? (
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full aspect-square rounded-lg overflow-hidden bg-gray-100"
              disabled={isSubmitting}
            >
              <img
                src={imagePreview}
                alt="Preview"
                className="w-full h-full object-cover"
              />
            </button>
          ) : (
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full aspect-square rounded-lg bg-gray-50 border-2 border-dashed border-gray-200 flex flex-col items-center justify-center gap-2"
              disabled={isSubmitting}
            >
              <span className="text-4xl">📷</span>
              <span className="text-gray-400 text-sm">Tap to add photo</span>
            </button>
          )}
        </div>

        {/* Caption */}
        <div>
          <textarea
            value={caption}
            onChange={handleCaptionChange}
            placeholder="Add a caption (optional)"
            disabled={isSubmitting}
            rows={3}
            className="w-full p-3 border border-gray-200 rounded-lg text-gray-900 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-gray-200"
          />
          <p className="text-xs text-gray-400 text-right mt-1">
            {caption.length}/{MAX_CAPTION_LENGTH}
          </p>
        </div>

        {/* Circle selector */}
        <div>
          <p className="text-sm text-gray-600 mb-2">Who can see this?</p>
          <CircleToggle
            value={circle}
            onChange={handleCircleChange}
            disabled={isSubmitting || isVerifying}
          />
          <p className="text-xs text-gray-400 mt-2">
            {circle === 'community'
              ? 'Visible to all World App users'
              : 'Only visible to World ID verified humans'}
          </p>
        </div>

        {error && (
          <p className="text-red-500 text-sm text-center">{error}</p>
        )}
      </Page.Main>

      <Page.Footer>
        <Button
          onClick={handleSubmit}
          variant="primary"
          size="lg"
          className="w-full"
          disabled={!selectedImage || isSubmitting}
        >
          {isSubmitting ? <Spinner /> : 'Leave it here'}
        </Button>
      </Page.Footer>
    </Page>
  );
}
