'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
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
  const { place, isVerifiedHuman } = useKilroy();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [caption, setCaption] = useState('');
  // Non-verified users can only post to 'world'
  const [circle, setCircle] = useState<Circle>('world');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleImageSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please select an image');
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

  function handleCircleChange(value: Circle) {
    setCircle(value);
  }

  async function handleSubmit() {
    if (!place || !selectedImage) return;

    // Enforce: non-verified users can only post to 'world'
    const finalCircle = isVerifiedHuman ? circle : 'world';

    setIsSubmitting(true);
    setError(null);

    try {
      // Compress image
      const compressedBlob = await compressImage(selectedImage);

      // Upload and create kilroy
      await createKilroy(place, compressedBlob, caption, finalCircle);

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

        {/* Circle selector - only show if verified */}
        {isVerifiedHuman && (
          <div>
            <p className="text-sm text-gray-600 mb-2">Who can see this?</p>
            <CircleToggle
              value={circle}
              onChange={handleCircleChange}
              disabled={isSubmitting}
            />
            <p className="text-xs text-gray-400 mt-2">
              {circle === 'world'
                ? 'Visible to all World App users'
                : 'Only visible to verified humans'}
            </p>
          </div>
        )}

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
