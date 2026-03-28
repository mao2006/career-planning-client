import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, Text, View, useWindowDimensions } from 'react-native';

const DESIGN_SCREEN_WIDTH = 375;
const DESIGN_SCREEN_HEIGHT = 812;

export default function NextPage() {
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  const scaleX = screenWidth / DESIGN_SCREEN_WIDTH;
  const scaleY = screenHeight / DESIGN_SCREEN_HEIGHT;
  const textScale = Math.min(scaleX, scaleY);

  return (
    <LinearGradient
      colors={['rgba(168, 237, 229, 1)', 'rgba(252, 250, 250, 1)']}
      start={{ x: 0.5, y: 0 }}
      end={{ x: 0.5, y: 1 }}
      style={styles.screen}
    >
      <StatusBar style="dark" />
      <View
        style={[
          styles.titleWrap,
          {
            left: 116 * scaleX,
            top: 129 * scaleY,
            width: 144 * scaleX,
            height: 53 * scaleY,
          },
        ]}
      >
        <Text
          style={[
            styles.titleText,
            {
              fontSize: 36 * textScale,
              lineHeight: 52.13 * textScale,
            },
          ]}
        >
          选中身份
        </Text>
      </View>
      <View
        style={[
          styles.whitePanel,
          {
            left: 15 * scaleX,
            top: 218 * scaleY,
            width: 346 * scaleX,
            height: 340 * scaleY,
            borderRadius: 20 * textScale,
          },
        ]}
      />
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#ffffff',
    position: 'relative',
  },
  titleWrap: {
    position: 'absolute',
    opacity: 1,
  },
  titleText: {
    fontWeight: '700',
    letterSpacing: 0,
    color: 'rgba(0, 0, 0, 1)',
    textAlign: 'left',
  },
  whitePanel: {
    position: 'absolute',
    opacity: 1,
    backgroundColor: 'rgba(255, 255, 255, 1)',
  },
});
