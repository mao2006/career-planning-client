import { useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import {
  Image,
  type ImageSourcePropType,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  Vibration,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import AiAssistantPage from './ai-assistant/page';
import HomePage from './home/page';
import MinePage from './mine/page';
import PlanPage from './plan/page';
import ProfilePage from './profile/page';

type RouteKey = 'home' | 'profile' | 'assistant' | 'plan' | 'mine';

type RouteItem = {
  icon: ImageSourcePropType;
  key: RouteKey;
  label: string;
};

const ACTIVE_TINT = 'rgba(75, 180, 111, 1)';
const INACTIVE_TINT = 'rgba(117, 123, 131, 0.96)';
const routeItems: RouteItem[] = [
  {
    key: 'home',
    label: '首页',
    icon: require('../assets/homepage-icons/homepage.png'),
  },
  {
    key: 'profile',
    label: '画像',
    icon: require('../assets/homepage-icons/draw.png'),
  },
  {
    key: 'assistant',
    label: 'AI小助手',
    icon: require('../assets/homepage-icons/ai.png'),
  },
  {
    key: 'plan',
    label: '规划',
    icon: require('../assets/homepage-icons/plan.png'),
  },
  {
    key: 'mine',
    label: '我的',
    icon: require('../assets/homepage-icons/mine.png'),
  },
];

export default function MainPage() {
  const [activeRoute, setActiveRoute] = useState<RouteKey>('home');
  const [isHomeDetailVisible, setIsHomeDetailVisible] = useState(false);
  const [isMineDetailVisible, setIsMineDetailVisible] = useState(false);
  const insets = useSafeAreaInsets();

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
      if (forceHaptic) {
        triggerRouteHaptic('tap');
      }
      return;
    }

    setActiveRoute(nextRoute);
    triggerRouteHaptic('switch');
  };

  const renderActivePage = () => {
    if (activeRoute === 'home') {
      return <HomePage onDetailVisibilityChange={setIsHomeDetailVisible} />;
    }

    if (activeRoute === 'profile') {
      return <ProfilePage />;
    }

    if (activeRoute === 'assistant') {
      return <AiAssistantPage />;
    }

    if (activeRoute === 'plan') {
      return <PlanPage />;
    }

    return <MinePage onDetailVisibilityChange={setIsMineDetailVisible} />;
  };

  return (
    <LinearGradient
      colors={['rgba(168, 237, 229, 1)', 'rgba(252, 250, 250, 1)']}
      end={{ x: 0.5, y: 1 }}
      start={{ x: 0.5, y: 0 }}
      style={styles.screen}
    >
      <StatusBar style="dark" />

      <View style={styles.contentLayer}>
        {renderActivePage()}
      </View>

      {!isHomeDetailVisible && !isMineDetailVisible ? (
        <View
          style={[
            styles.bottomBarWrap,
            {
              paddingBottom: Math.max(insets.bottom - 16, 2),
            },
          ]}
        >
          <View style={styles.bottomBarShell}>
            {routeItems.map((item) => {
              const active = item.key === activeRoute;

              return (
                <Pressable
                  key={item.key}
                  hitSlop={10}
                  onPress={() => switchRoute(item.key, true)}
                  style={styles.standardTabButton}
                >
                  <Image
                    source={item.icon}
                    style={[
                      styles.standardTabIcon,
                      {
                        tintColor: active ? ACTIVE_TINT : INACTIVE_TINT,
                      },
                    ]}
                  />
                  <Text style={[styles.standardTabLabel, active && styles.standardTabLabelActive]}>
                    {item.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      ) : null}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  contentLayer: {
    flex: 1,
  },
  bottomBarWrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 10,
    zIndex: 50,
    elevation: 50,
  },
  bottomBarShell: {
    minHeight: 74,
    paddingTop: 0,
    paddingBottom: 3,
    paddingHorizontal: 8,
    borderRadius: 34,
    borderCurve: 'continuous',
    backgroundColor: 'rgba(255, 255, 255, 0.96)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(215, 220, 224, 0.9)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: 'rgba(0, 0, 0, 0.14)',
    shadowOffset: {
      width: 0,
      height: -4,
    },
    shadowOpacity: 1,
    shadowRadius: 14,
    elevation: 18,
  },
  standardTabButton: {
    flex: 1,
    minHeight: 58,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 0,
  },
  standardTabIcon: {
    width: 24,
    height: 24,
    marginBottom: 3,
  },
  standardTabLabel: {
    fontSize: 12,
    lineHeight: 14,
    fontWeight: '500',
    color: INACTIVE_TINT,
    letterSpacing: 0,
  },
  standardTabLabelActive: {
    color: ACTIVE_TINT,
    fontWeight: '600',
  },
});
