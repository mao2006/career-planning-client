import { useEffect, useRef } from 'react';
import { StatusBar } from 'expo-status-bar';
import { Animated, Easing, Image, StyleSheet, useWindowDimensions, View } from 'react-native';

const DESIGN_SCREEN_WIDTH = 390;
const DESIGN_SCREEN_HEIGHT = 844;
const DEFAULT_HOLD_MS = 3000;
const FADE_OUT_MS = 420;

type SplashPageProps = {
  durationMs?: number;
  onFinished?: () => void;
};

export default function SplashPage({
  durationMs = DEFAULT_HOLD_MS,
  onFinished,
}: SplashPageProps) {
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  const opacity = useRef(new Animated.Value(1)).current;
  const scale = Math.max(
    screenWidth / DESIGN_SCREEN_WIDTH,
    screenHeight / DESIGN_SCREEN_HEIGHT
  );

  useEffect(() => {
    const fadeDelay = Math.max(0, durationMs - FADE_OUT_MS);
    const fadeTimer = setTimeout(() => {
      Animated.timing(opacity, {
        toValue: 0,
        duration: FADE_OUT_MS,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start();
    }, fadeDelay);

    const finishTimer = setTimeout(() => {
      onFinished?.();
    }, durationMs);

    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(finishTimer);
    };
  }, [durationMs, onFinished, opacity]);

  return (
    <Animated.View style={[styles.screen, { opacity }]}>
      <StatusBar style="dark" />
      <Image
        source={require('../../assets/new-homepage.png')}
        style={[
          styles.coverImage,
          {
            width: DESIGN_SCREEN_WIDTH * scale,
            height: DESIGN_SCREEN_HEIGHT * scale,
          },
        ]}
        resizeMode="cover"
      />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  coverImage: {
    flexShrink: 0,
  },
});
