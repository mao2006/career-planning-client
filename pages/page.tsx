import { useEffect, useRef, useState, type ComponentType } from 'react';
import { StatusBar } from 'expo-status-bar';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import {
  Animated,
  Easing,
  LayoutChangeEvent,
  PanResponder,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  Vibration,
  View,
} from 'react-native';

import Page1 from './1/page';
import Page2 from './2/page';
import Page3 from './3/page';
import Page4 from './4/page';
import Page5 from './5/page';

type RouteKey = '1' | '2' | '3' | '4' | '5';

const routes: RouteKey[] = ['1', '2', '3', '4', '5'];
const BAR_RADIUS = 34;
const BAR_PADDING_H = 10;
const BAR_PADDING_V = 5;
const TAB_RADIUS = BAR_RADIUS - BAR_PADDING_V;
const TAB_GAP = 2;
const SWIPE_THRESHOLD = 28;

const routeComponents: Record<RouteKey, ComponentType> = {
  '1': Page1,
  '2': Page2,
  '3': Page3,
  '4': Page4,
  '5': Page5,
};

const androidBlurProps =
  Platform.OS === 'android'
    ? ({ experimentalBlurMethod: 'dimezisBlurView' } as const)
    : {};

export default function MainPage() {
  const [activeRoute, setActiveRoute] = useState<RouteKey>('1');
  const [tabRowWidth, setTabRowWidth] = useState(0);
  const isSwipingRef = useRef(false);
  const activeIndex = routes.indexOf(activeRoute);
  const activeIndexRef = useRef(activeIndex);
  activeIndexRef.current = activeIndex;

  const indicatorX = useRef(new Animated.Value(0)).current;
  const indicatorScale = useRef(new Animated.Value(1)).current;
  const slotWidth = tabRowWidth > 0 ? tabRowWidth / routes.length : 0;
  const indicatorWidth = slotWidth > 0 ? Math.max(0, slotWidth - TAB_GAP * 2) : 0;

  const triggerRouteHaptic = (kind: 'switch' | 'tap') => {
    if (Platform.OS === 'ios') {
      if (kind === 'switch') {
        void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      } else {
        void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      }
      return;
    }

    Vibration.vibrate(kind === 'switch' ? 10 : 8);
  };

  const switchRoute = (nextRoute: RouteKey, forceHaptic = false) => {
    if (nextRoute === activeRoute) {
      if (forceHaptic) triggerRouteHaptic('tap');
      return;
    }
    setActiveRoute(nextRoute);
    triggerRouteHaptic('switch');
  };

  const setRouteByIndex = (index: number) => {
    const nextIndex = Math.max(0, Math.min(routes.length - 1, index));
    switchRoute(routes[nextIndex]);
  };

  const onTabRowLayout = (event: LayoutChangeEvent) => {
    setTabRowWidth(event.nativeEvent.layout.width);
  };

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gestureState) =>
        Math.abs(gestureState.dx) > 6 && Math.abs(gestureState.dx) > Math.abs(gestureState.dy) * 1.2,
      onPanResponderGrant: () => {
        isSwipingRef.current = true;
      },
      onPanResponderRelease: (_, gestureState) => {
        if (Math.abs(gestureState.dx) < SWIPE_THRESHOLD) {
          isSwipingRef.current = false;
          return;
        }
        if (gestureState.dx < 0) {
          setRouteByIndex(activeIndexRef.current - 1);
        } else {
          setRouteByIndex(activeIndexRef.current + 1);
        }
        requestAnimationFrame(() => {
          isSwipingRef.current = false;
        });
      },
      onPanResponderTerminate: () => {
        isSwipingRef.current = false;
      },
    })
  ).current;

  useEffect(() => {
    if (!slotWidth) return;
    const toValue = activeIndex * slotWidth + TAB_GAP;
    Animated.parallel([
      Animated.timing(indicatorX, {
        toValue,
        duration: 150,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.sequence([
        Animated.timing(indicatorScale, {
          toValue: 0.975,
          duration: 45,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(indicatorScale, {
          toValue: 1,
          duration: 110,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]),
    ]).start();
  }, [activeIndex, indicatorScale, indicatorX, slotWidth]);

  const ActivePage = routeComponents[activeRoute];

  return (
    <View style={styles.screen}>
      <StatusBar style="dark" />
      <View style={styles.bgBlobA} pointerEvents="none" />
      <View style={styles.bgBlobB} pointerEvents="none" />
      <View style={styles.bgBlobC} pointerEvents="none" />

      <ActivePage />

      <View style={[styles.bottomBarWrap, { paddingBottom: 0, bottom: 26 }]}>
        <View style={styles.bottomBarShell}>
          <BlurView
            intensity={84}
            tint="light"
            style={styles.bottomBarBlurLayer}
            pointerEvents="none"
            {...androidBlurProps}
          />
          <View style={styles.bottomBarTone} pointerEvents="none" />

          <View style={styles.tabRow} onLayout={onTabRowLayout} {...panResponder.panHandlers}>
            <Animated.View
              style={[
                styles.bottomTabActivePill,
                {
                  width: indicatorWidth,
                  transform: [{ translateX: indicatorX }, { scale: indicatorScale }],
                },
              ]}
              pointerEvents="none"
            >
              <BlurView
                intensity={52}
                tint="light"
                style={styles.bottomTabGlass}
                pointerEvents="none"
                {...androidBlurProps}
              />
              <View style={styles.bottomTabInnerStroke} pointerEvents="none" />
            </Animated.View>

            {routes.map((route) => {
              const active = route === activeRoute;
              return (
                <Pressable
                  key={route}
                  onPress={() => {
                    if (isSwipingRef.current) return;
                    switchRoute(route, true);
                  }}
                  style={styles.bottomTab}
                  hitSlop={8}
                >
                  <Text style={[styles.bottomTabText, active && styles.bottomTabTextActive]}>{route}</Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#dde4ee',
  },
  bgBlobA: {
    position: 'absolute',
    width: 280,
    height: 280,
    borderRadius: 999,
    top: -70,
    right: -80,
    backgroundColor: 'rgba(56, 189, 248, 0.28)',
  },
  bgBlobB: {
    position: 'absolute',
    width: 220,
    height: 220,
    borderRadius: 999,
    bottom: 60,
    left: -70,
    backgroundColor: 'rgba(59, 130, 246, 0.24)',
  },
  bgBlobC: {
    position: 'absolute',
    width: 180,
    height: 180,
    borderRadius: 999,
    bottom: 220,
    right: 40,
    backgroundColor: 'rgba(244, 114, 182, 0.18)',
  },
  bottomBarWrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 18,
    zIndex: 40,
    elevation: 40,
  },
  bottomBarShell: {
    minHeight: 62,
    borderRadius: BAR_RADIUS,
    borderCurve: 'continuous',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
    backgroundColor: 'rgba(255,255,255,0.06)',
    overflow: 'hidden',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: BAR_PADDING_H,
    paddingVertical: BAR_PADDING_V,
    position: 'relative',
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 10,
  },
  bottomBarBlurLayer: {
    ...StyleSheet.absoluteFillObject,
  },
  bottomBarTone: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  tabRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  bottomTab: {
    flex: 1,
    minHeight: 48,
    marginHorizontal: TAB_GAP,
    borderRadius: TAB_RADIUS,
    borderCurve: 'continuous',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  bottomTabActivePill: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    backgroundColor: 'rgba(107,114,128,0.18)',
    shadowColor: '#6b7280',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.22,
    shadowRadius: 8,
    elevation: 3,
    borderRadius: TAB_RADIUS,
    borderCurve: 'continuous',
    overflow: 'hidden',
  },
  bottomTabGlass: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(107,114,128,0.09)',
  },
  bottomTabInnerStroke: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: TAB_RADIUS,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.22)',
    shadowColor: '#ffffff',
    shadowOffset: { width: 0, height: -1 },
    shadowOpacity: 0.28,
    shadowRadius: 1.5,
  },
  bottomTabText: {
    color: '#4b5563',
    fontSize: 20,
    fontWeight: '600',
  },
  bottomTabTextActive: {
    color: '#111827',
    fontWeight: '700',
  },
});
