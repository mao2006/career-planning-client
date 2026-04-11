import { useRef } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import {
  Animated,
  Image,
  PanResponder,
  Pressable,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import IdentityScreenBackground from '../../components/identity-screen-background';

type AccountSettingsPageProps = {
  onBack?: () => void;
};

export default function AccountSettingsPage({ onBack }: AccountSettingsPageProps) {
  const insets = useSafeAreaInsets();
  const { width: screenWidth } = useWindowDimensions();
  const swipeTranslateX = useRef(new Animated.Value(0)).current;
  const contentWidth = Math.min(screenWidth - 32, 336);

  const edgeSwipeResponder = PanResponder.create({
    onMoveShouldSetPanResponder: (_, gestureState) =>
      gestureState.x0 <= 24 &&
      gestureState.dx > 8 &&
      Math.abs(gestureState.dx) > Math.abs(gestureState.dy) * 1.3,
    onPanResponderMove: (_, gestureState) => {
      swipeTranslateX.setValue(Math.max(0, gestureState.dx));
    },
    onPanResponderRelease: (_, gestureState) => {
      const shouldGoBack = gestureState.dx > screenWidth * 0.26 || gestureState.vx > 0.75;

      if (shouldGoBack) {
        Animated.timing(swipeTranslateX, {
          toValue: screenWidth,
          duration: 160,
          useNativeDriver: true,
        }).start(({ finished }) => {
          if (finished) {
            onBack?.();
          }
        });

        return;
      }

      Animated.spring(swipeTranslateX, {
        toValue: 0,
        speed: 20,
        bounciness: 0,
        useNativeDriver: true,
      }).start();
    },
    onPanResponderTerminate: () => {
      Animated.spring(swipeTranslateX, {
        toValue: 0,
        speed: 20,
        bounciness: 0,
        useNativeDriver: true,
      }).start();
    },
    onPanResponderTerminationRequest: () => true,
  });

  return (
    <IdentityScreenBackground>
      <StatusBar style="dark" />

      <Animated.View
        style={[
          styles.pageLayer,
          {
            transform: [{ translateX: swipeTranslateX }],
          },
        ]}
        {...edgeSwipeResponder.panHandlers}
      >
        <View
          style={[
            styles.headerBar,
            {
              paddingTop: insets.top + 6,
              height: insets.top + 76,
            },
          ]}
        >
          <Pressable hitSlop={12} onPress={onBack} style={styles.backButton}>
            <Ionicons color="rgba(120, 131, 136, 1)" name="chevron-back" size={30} />
          </Pressable>
          <Text style={styles.headerTitle}>账号与设置</Text>
        </View>

        <View style={styles.contentArea}>
          <View style={[styles.phoneCard, { width: contentWidth }]}>
            <View style={styles.phoneInfoWrap}>
              <Text style={styles.phoneLabel}>已绑定手机号</Text>
              <Text style={styles.phoneValue}>152****7873</Text>
            </View>

            <Pressable style={styles.rebindButton}>
              <Text style={styles.rebindButtonText}>换绑</Text>
            </Pressable>
          </View>

          <Pressable style={[styles.logoutButton, { width: contentWidth }]}>
            <Text style={styles.logoutButtonText}>退出登录</Text>
          </Pressable>
        </View>

        <Image
          resizeMode="contain"
          source={require('../../assets/jixiangwu.png')}
          style={styles.mascotBackdrop}
        />

        <View style={[styles.footerArea, { paddingBottom: Math.max(insets.bottom + 18, 36) }]}>
          <Pressable style={[styles.deleteButton, { width: Math.min(contentWidth - 28, 280) }]}>
            <Text style={styles.deleteButtonText}>注销账号</Text>
          </Pressable>
        </View>
      </Animated.View>
    </IdentityScreenBackground>
  );
}

const styles = StyleSheet.create({
  pageLayer: {
    flex: 1,
  },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
  },
  backButton: {
    width: 34,
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  headerTitle: {
    color: 'rgba(14, 19, 24, 1)',
    fontSize: 19,
    lineHeight: 24,
    fontWeight: '800',
    letterSpacing: 0,
  },
  contentArea: {
    paddingTop: 22,
    alignItems: 'center',
  },
  phoneCard: {
    minHeight: 44,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.96)',
    borderWidth: 1,
    borderColor: 'rgba(197, 205, 210, 0.9)',
    paddingHorizontal: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  phoneInfoWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    flexShrink: 1,
  },
  phoneLabel: {
    color: 'rgba(38, 47, 58, 1)',
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '700',
  },
  phoneValue: {
    marginLeft: 22,
    color: 'rgba(74, 84, 96, 1)',
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '500',
  },
  rebindButton: {
    minWidth: 52,
    height: 28,
    borderRadius: 4,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(11, 188, 177, 1)',
  },
  rebindButtonText: {
    color: '#ffffff',
    fontSize: 13,
    lineHeight: 16,
    fontWeight: '700',
  },
  logoutButton: {
    height: 44,
    marginTop: 10,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.98)',
    borderWidth: 1,
    borderColor: 'rgba(197, 205, 210, 0.9)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoutButtonText: {
    color: 'rgba(20, 24, 28, 1)',
    fontSize: 15,
    lineHeight: 20,
    fontWeight: '700',
  },
  mascotBackdrop: {
    position: 'absolute',
    left: '50%',
    bottom: 112,
    width: 320,
    height: 320,
    opacity: 0.18,
    transform: [{ translateX: -160 }],
  },
  footerArea: {
    marginTop: 'auto',
    alignItems: 'center',
  },
  deleteButton: {
    height: 44,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.98)',
    borderWidth: 1,
    borderColor: 'rgba(197, 205, 210, 0.9)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteButtonText: {
    color: 'rgba(226, 65, 65, 1)',
    fontSize: 15,
    lineHeight: 20,
    fontWeight: '700',
  },
});
