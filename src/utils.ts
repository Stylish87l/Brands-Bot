export const dataUrlToFile = async (dataUrl: string, fileName: string): Promise<File> => {
  const res = await fetch(dataUrl);
  const blob = await res.blob();
  return new File([blob], fileName, { type: blob.type });
};

/**
 * Resizes an image file to a maximum width and height while maintaining aspect ratio.
 * @param file The image file to resize.
 * @param maxWidth The maximum width of the resized image.
 * @param maxHeight The maximum height of the resized image.
 * @returns A Promise that resolves with the resized image as a new File object.
 */
export const resizeImage = (file: File, maxWidth: number, maxHeight: number): Promise<File> => {
  return new Promise((resolve, reject) => {
    const img = document.createElement('img');
    const reader = new FileReader();

    reader.onload = (e) => {
      if (typeof e.target?.result === 'string') {
        img.src = e.target.result;
      } else {
        reject(new Error('Failed to read file.'));
      }
    };
    reader.onerror = reject;

    img.onload = () => {
      const canvas = document.createElement('canvas');
      let { width, height } = img;

      if (width > height) {
        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }
      } else {
        if (height > maxHeight) {
          width = Math.round((width * maxHeight) / height);
          height = maxHeight;
        }
      }

      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        return reject(new Error('Could not get canvas context'));
      }
      ctx.drawImage(img, 0, 0, width, height);

      // Use PNG to preserve transparency, essential for logos and background-removed images.
      canvas.toBlob((blob) => {
        if (!blob) {
          return reject(new Error('Canvas to Blob conversion failed'));
        }
        const newFile = new File([blob], `resized_${file.name}`, {
          type: 'image/png',
          lastModified: Date.now(),
        });
        resolve(newFile);
      }, 'image/png', 0.95);
    };
    img.onerror = reject;

    reader.readAsDataURL(file);
  });
};
