import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import { Image, Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import Svg, {
  Defs,
  LinearGradient as SvgLinearGradient,
  Stop,
  Text as SvgText,
} from 'react-native-svg';

import BottomArrowNavigation from '../../components/bottom-arrow-navigation';

const DESIGN_SCREEN_WIDTH = 375;
const DESIGN_SCREEN_HEIGHT = 812;
const ARROW_BUTTON_SIZE = 56;
const CONTENT_SHIFT_Y = -44;
const JIXIANGWU_TOP = 214;
const JIXIANGWU_WIDTH = 428;
const JIXIANGWU_HEIGHT = 644;
const SHINE_BUTTON_TOP = 711;
const SHINE_BUTTON_WIDTH = 87.44;
const SHINE_BUTTON_HEIGHT = 87.49;
const TEXT_COLOR = 'rgba(26, 27, 28, 1)';
const HIGHLIGHT_GRADIENT = ['rgba(6, 46, 22, 1)', 'rgba(67, 207, 124, 0.71)'] as const;
const INTRO_LINES = [
  { prefix: '还在苦苦追寻如何成为更好的', highlight: '自己?' },
  { prefix: '还不清楚自己适合', highlight: '什么?' },
  { prefix: '还未理顺当下的', highlight: '迷茫?' },
  { prefix: '还未寻得内心的', highlight: '热爱?' },
  { prefix: '还没有把握好未来的', highlight: '航向?' },
] as const;
const CTA_TEXT = '点击进行AI测评';

type AiAnalysisEntryPageProps = {
  onBack?: () => void;
  onNavigate?: () => void;
};

type GradientWordProps = {
  fontSize: number;
  gradientId: string;
  lineHeight: number;
  text: string;
  width: number;
};

function estimateTextWidth(text: string, fontSize: number) {
  return Array.from(text).reduce((width, character) => {
    if (/[\u4e00-\u9fff\u3000-\u303f\uff00-\uffef]/u.test(character)) {
      return width + fontSize;
    }

    return width + fontSize * 0.55;
  }, fontSize * 0.1);
}

function GradientWord({ fontSize, gradientId, lineHeight, text, width }: GradientWordProps) {
  return (
    <View style={{ width, height: lineHeight }}>
      <Svg width={width} height={lineHeight} viewBox={`0 0 ${width} ${lineHeight}`}>
        <Defs>
          <SvgLinearGradient id={gradientId} x1="0%" y1="50%" x2="100%" y2="50%">
            <Stop offset="0%" stopColor={HIGHLIGHT_GRADIENT[0]} />
            <Stop offset="100%" stopColor={HIGHLIGHT_GRADIENT[1]} />
          </SvgLinearGradient>
        </Defs>
        <SvgText
          fill={`url(#${gradientId})`}
          fontSize={fontSize}
          fontWeight="400"
          x={0}
          y={fontSize * 1.03}
        >
          {text}
        </SvgText>
      </Svg>
    </View>
  );
}

export default function AiAnalysisEntryPage({ onBack, onNavigate }: AiAnalysisEntryPageProps) {
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  const scaleX = screenWidth / DESIGN_SCREEN_WIDTH;
  const scaleY = screenHeight / DESIGN_SCREEN_HEIGHT;
  const textScale = Math.min(scaleX, scaleY);
  const fontSize = 16 * textScale;
  const lineHeight = 23.17 * textScale;
  const rowHeight = 24 * scaleY;
  const getShiftedTop = (top: number) => (top + CONTENT_SHIFT_Y) * scaleY;
  const getCenteredLeft = (width: number) => (screenWidth - width * scaleX) / 2;
  const shineButtonCenterY = getShiftedTop(SHINE_BUTTON_TOP) + (SHINE_BUTTON_HEIGHT * scaleY) / 2;
  const arrowBottom = Math.max(0, screenHeight - shineButtonCenterY - ARROW_BUTTON_SIZE / 2);

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
          styles.jixiangwuLayer,
          {
            left: getCenteredLeft(JIXIANGWU_WIDTH),
            top: getShiftedTop(JIXIANGWU_TOP),
            width: JIXIANGWU_WIDTH * scaleX,
            height: JIXIANGWU_HEIGHT * scaleY,
          },
        ]}
      >
        <Image
          resizeMode="contain"
          source={require('../../assets/jixiangwu.png')}
          style={styles.jixiangwuImage}
        />
      </View>

      <View
        pointerEvents="none"
        style={[
          styles.copyBlock,
          {
            left: 43 * scaleX,
            top: getShiftedTop(190),
            width: 256 * scaleX,
          },
        ]}
      >
        {INTRO_LINES.map((line, index) => (
          <View
            key={`${line.prefix}${line.highlight}`}
            style={[
              styles.promptRow,
              {
                height: rowHeight,
              },
            ]}
          >
            <Text
              allowFontScaling={false}
              numberOfLines={1}
              style={[
                styles.promptText,
                {
                  fontSize,
                  lineHeight,
                },
              ]}
            >
              {line.prefix}
            </Text>
            <GradientWord
              fontSize={fontSize}
              gradientId={`ai-analysis-highlight-${index}`}
              lineHeight={lineHeight}
              text={line.highlight}
              width={estimateTextWidth(line.highlight, fontSize)}
            />
          </View>
        ))}
      </View>

      <Text
        allowFontScaling={false}
        pointerEvents="none"
        style={[
          styles.ctaText,
          {
            left: getCenteredLeft(294),
            top: getShiftedTop(661),
            width: 294 * scaleX,
            height: 97 * scaleY,
            fontSize: 30 * textScale,
            lineHeight: 43.44 * textScale,
          },
        ]}
      >
        {CTA_TEXT}
      </Text>

      <Pressable
        disabled={!onNavigate}
        hitSlop={12}
        onPress={onNavigate}
        style={[
          styles.shineButtonWrap,
          {
            left: getCenteredLeft(SHINE_BUTTON_WIDTH),
            top: getShiftedTop(SHINE_BUTTON_TOP),
            width: SHINE_BUTTON_WIDTH * scaleX,
            height: SHINE_BUTTON_HEIGHT * scaleY,
          },
        ]}
      >
        <Image
          resizeMode="contain"
          source={require('../../assets/shinebutton.png')}
          style={styles.shineButton}
        />
      </Pressable>

      <BottomArrowNavigation
        bottom={arrowBottom}
        leftDisabled={!onBack}
        onLeftPress={onBack}
        onRightPress={onNavigate}
        rightDisabled={!onNavigate}
        scaleX={scaleX}
      />
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    position: 'relative',
  },
  copyBlock: {
    position: 'absolute',
    opacity: 1,
    zIndex: 2,
  },
  ctaText: {
    position: 'absolute',
    opacity: 1,
    zIndex: 2,
    color: 'rgba(11, 153, 144, 1)',
    fontWeight: '400',
    letterSpacing: 0,
    textAlign: 'center',
    includeFontPadding: false,
  },
  jixiangwuLayer: {
    position: 'absolute',
    opacity: 1,
    zIndex: 1,
  },
  jixiangwuImage: {
    width: '100%',
    height: '100%',
  },
  shineButtonWrap: {
    position: 'absolute',
    opacity: 1,
    zIndex: 2,
  },
  shineButton: {
    width: '100%',
    height: '100%',
  },
  promptRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    width: '100%',
  },
  promptText: {
    color: TEXT_COLOR,
    fontWeight: '400',
    letterSpacing: 0,
    textAlign: 'left',
    includeFontPadding: false,
  },
});
