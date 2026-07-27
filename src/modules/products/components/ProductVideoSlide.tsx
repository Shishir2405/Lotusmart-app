import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import { useVideoPlayer, VideoView } from 'expo-video';
import { AppImage } from '../../../components/ui/AppImage';
import { videoPosterUrl } from '../../../utils/helpers';

interface ProductVideoSlideProps {
  uri: string;
  width: number;
  height: number;
  /** Only the on-screen slide should actually play — same rule ReelsScreen
   * uses — so scrolling past a video doesn't leave it running (or its audio
   * playing) off-screen. */
  isActive: boolean;
}

/**
 * One video slide inside the product gallery carousel. Unlike reels, this
 * uses native playback controls (play/pause/scrub) since it's a single
 * deliberate view, not a swipe-through feed — shoppers expect to scrub a
 * product demo, not just tap to toggle.
 */
export function ProductVideoSlide({ uri, width, height, isActive }: ProductVideoSlideProps) {
  const poster = videoPosterUrl(uri);

  // Scoped to this slide; expo-video releases it automatically on unmount, so
  // scrolling the video out of the FlatList's render window frees it.
  const player = useVideoPlayer(uri, (p) => {
    p.loop = false;
  });

  // Pause (and rewind) whenever the shopper swipes to a different slide,
  // otherwise a video keeps playing — and its audio keeps going — behind the
  // photo they've swiped to.
  useEffect(() => {
    try {
      if (isActive) {
        // no-op: native controls start it, we just stop auto-play here
      } else {
        player.pause();
        player.currentTime = 0;
      }
    } catch {
      // Player already released (slide unmounting) — nothing to do.
    }
  }, [isActive, player]);

  return (
    <View style={{ width, height, backgroundColor: '#000' }}>
      {/* Poster covers the split second before the player has a frame ready. */}
      {!!poster && <AppImage source={{ uri: poster }} style={StyleSheet.absoluteFill} />}
      <VideoView
        player={player}
        style={StyleSheet.absoluteFill}
        contentFit="contain"
        nativeControls
        allowsFullscreen
        allowsPictureInPicture={false}
      />
    </View>
  );
}
