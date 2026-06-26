import React from 'react';
import { Image as ExpoImage, ImageProps } from 'expo-image';

/**
 * App-wide image for REMOTE (uri) images.
 *
 * Wraps `expo-image` with disk+memory caching and a soft fade-in so photos
 * (banners, product cards, category thumbs) load instantly on repeat views
 * instead of re-downloading every time like React Native's <Image> did.
 *
 * Defaults to `cover`; pass `contentFit="contain"` for logos/avatars.
 */
export function AppImage({
  contentFit = 'cover',
  transition = 150,
  cachePolicy = 'memory-disk',
  ...props
}: ImageProps) {
  return (
    <ExpoImage
      contentFit={contentFit}
      transition={transition}
      cachePolicy={cachePolicy}
      {...props}
    />
  );
}
