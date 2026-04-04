import { type ReactNode } from 'react';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, View, useWindowDimensions } from 'react-native';
import Svg, { Defs, Ellipse, RadialGradient, Stop } from 'react-native-svg';

const ELLIPSE_DESIGN_WIDTH = 390;
const ELLIPSE_DESIGN_HEIGHT = 844;
const ELLIPSE_LEFT = -221;
const ELLIPSE_TOP = -212;
const ELLIPSE_WIDTH = 791.6;
const ELLIPSE_HEIGHT = 587.55;
const ELLIPSE_ROTATION = '19.24deg';

type IdentityScreenBackgroundProps = {
  children: ReactNode;
};

export default function IdentityScreenBackground({ children }: IdentityScreenBackgroundProps) {
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  const ellipseScaleX = screenWidth / ELLIPSE_DESIGN_WIDTH;
  const ellipseScaleY = screenHeight / ELLIPSE_DESIGN_HEIGHT;

  return (
    <LinearGradient
      colors={['rgba(168, 237, 229, 1)', 'rgba(252, 250, 250, 1)']}
      start={{ x: 0.5, y: 0 }}
      end={{ x: 0.5, y: 1 }}
      style={styles.screen}
    >
      <StatusBar style="dark" />
      <View
        pointerEvents="none"
        style={[
          styles.ellipseLayer,
          {
            left: ELLIPSE_LEFT * ellipseScaleX,
            top: ELLIPSE_TOP * ellipseScaleY,
            width: ELLIPSE_WIDTH * ellipseScaleX,
            height: ELLIPSE_HEIGHT * ellipseScaleY,
            transform: [{ rotate: ELLIPSE_ROTATION }],
          },
        ]}
      >
        <Svg width="100%" height="100%" viewBox={`0 0 ${ELLIPSE_WIDTH} ${ELLIPSE_HEIGHT}`}>
          <Defs>
            <RadialGradient
              id="identityBackgroundEllipse"
              cx="50.025344803994685%"
              cy="50.03832370285885%"
              fx="50.025344803994685%"
              fy="50.03832370285885%"
              rx="60.64%"
              ry="50.04%"
            >
              <Stop offset="0%" stopColor="#E6E3D1" stopOpacity={1} />
              <Stop offset="62.5%" stopColor="#A7E8E0" stopOpacity={0.4} />
            </RadialGradient>
          </Defs>
          <Ellipse
            cx={ELLIPSE_WIDTH / 2}
            cy={ELLIPSE_HEIGHT / 2}
            rx={ELLIPSE_WIDTH / 2}
            ry={ELLIPSE_HEIGHT / 2}
            fill="url(#identityBackgroundEllipse)"
          />
        </Svg>
      </View>
      {children}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#ffffff',
    position: 'relative',
    overflow: 'hidden',
  },
  ellipseLayer: {
    position: 'absolute',
    opacity: 1,
  },
});
