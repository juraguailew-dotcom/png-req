'use client';

import { useState } from 'react';

async function uploadProductImage(file) {
  const body = new FormData();
  body.append('file', file);
  body.append('bucket', 'products');

  const res = await fetch('/api/upload', {
    method: 'POST',
    body,
    headers: { Accept: 'application/json' },
  });

  const contentType = res.headers.get('content-type') || '';
  const data = contentType.includes('application/json')
    ? await res.json()
    : { error: await res.text() };

  if (!res.ok) throw new Error(data.error || 'Image upload failed');
  return data;
}

export function useProductImages(initialUrls = []) {
  const [imageUrls, setImageUrls] = useState(initialUrls);
  const [uploadError, setUploadError] = useState('');
  const [uploadingImages, setUploadingImages] = useState(false);

  const handleImageChange = async (event) => {
    const files = Array.from(event.target.files || []);
    if (files.length === 0) return;

    const remaining = 5 - imageUrls.length;
    if (files.length > remaining) {
      setUploadError(`You can only upload ${remaining} more image${remaining === 1 ? '' : 's'}`);
      event.target.value = '';
      return;
    }

    try {
      setUploadError('');
      setUploadingImages(true);
      const uploaded = await Promise.all(files.map(uploadProductImage));
      setImageUrls((prev) => [...prev, ...uploaded.map((item) => item.url)]);
    } catch (error) {
      setUploadError(error.message);
    } finally {
      setUploadingImages(false);
      event.target.value = '';
    }
  };

  const removeImage = (index) => {
    setImageUrls((prev) => prev.filter((_, i) => i !== index));
  };

  const setUrls = (urls) => setImageUrls(urls);

  return { imageUrls, uploadError, uploadingImages, handleImageChange, removeImage, setUrls };
}
