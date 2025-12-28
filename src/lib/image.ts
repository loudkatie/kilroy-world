const MAX_WIDTH = 1200;
const QUALITY = 0.75;
const MAX_SIZE_BYTES = 1.5 * 1024 * 1024; // 1.5MB

/**
 * Compress an image file to meet size and dimension requirements
 */
export async function compressImage(file: File): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      reject(new Error('Could not get canvas context'));
      return;
    }

    img.onload = () => {
      // Calculate new dimensions
      let { width, height } = img;

      if (width > MAX_WIDTH) {
        height = Math.round((height * MAX_WIDTH) / width);
        width = MAX_WIDTH;
      }

      canvas.width = width;
      canvas.height = height;

      // Draw and compress
      ctx.drawImage(img, 0, 0, width, height);

      // Try different quality levels if needed
      let quality = QUALITY;

      const tryCompress = () => {
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error('Could not compress image'));
              return;
            }

            // If still too large and quality can be reduced, try again
            if (blob.size > MAX_SIZE_BYTES && quality > 0.3) {
              quality -= 0.1;
              tryCompress();
              return;
            }

            resolve(blob);
          },
          'image/jpeg',
          quality
        );
      };

      tryCompress();
    };

    img.onerror = () => {
      reject(new Error('Could not load image'));
    };

    img.src = URL.createObjectURL(file);
  });
}
