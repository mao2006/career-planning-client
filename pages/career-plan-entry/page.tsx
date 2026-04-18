import { useState } from 'react';
import * as DocumentPicker from 'expo-document-picker';
import { Alert, Image, Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import Svg, {
  Defs,
  LinearGradient as SvgLinearGradient,
  Path,
  Stop,
  TSpan,
  Text as SvgText,
} from 'react-native-svg';

import BottomArrowNavigation from '../../components/bottom-arrow-navigation';
import IdentityScreenBackground from '../../components/identity-screen-background';

const DESIGN_SCREEN_WIDTH = 375;
const DESIGN_SCREEN_HEIGHT = 812;
const TITLE_LINES = ['想要个性化', '职业规划?'] as const;
const SUBTITLE_LINES = ['想要精准把握未来方向?', '点击生成个性化职业规划！'] as const;
const TITLE_GRADIENT = ['rgba(48, 79, 64, 1)', 'rgba(112, 193, 154, 0.92)'] as const;
const SUBTITLE_GRADIENT = ['rgba(83, 173, 131, 1)', 'rgba(163, 229, 195, 1)'] as const;
const TRAINING_PLAN_FILE_TYPES = [
  'image/*',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];

type CareerPlanEntryPageProps = {
  onNavigate?: () => void;
};

type GradientTextBlockProps = {
  colors: readonly [string, string];
  fontSize: number;
  fontWeight: '500' | '600';
  gradientId: string;
  lineHeight: number;
  lines: readonly string[];
  width: number;
};

function SideSparkle() {
  return (
    <Svg width="100%" height="100%" viewBox="0 0 64 64">
      <Defs>
        <SvgLinearGradient id="sideSparkleFill" x1="0%" y1="0%" x2="100%" y2="100%">
          <Stop offset="0%" stopColor="rgba(255, 255, 255, 0.94)" />
          <Stop offset="100%" stopColor="rgba(143, 225, 231, 0.84)" />
        </SvgLinearGradient>
      </Defs>
      <Path
        d="M32 7L36.7 27.3L57 32L36.7 36.7L32 57L27.3 36.7L7 32L27.3 27.3L32 7Z"
        fill="url(#sideSparkleFill)"
      />
    </Svg>
  );
}

function GradientTextBlock({
  colors,
  fontSize,
  fontWeight,
  gradientId,
  lineHeight,
  lines,
  width,
}: GradientTextBlockProps) {
  const height = lineHeight * lines.length;

  return (
    <Svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
      <Defs>
        <SvgLinearGradient id={gradientId} x1="0%" y1="20%" x2="100%" y2="90%">
          <Stop offset="0%" stopColor={colors[0]} />
          <Stop offset="100%" stopColor={colors[1]} />
        </SvgLinearGradient>
      </Defs>
      <SvgText fill={`url(#${gradientId})`} fontSize={fontSize} fontWeight={fontWeight} x={0} y={fontSize * 1.02}>
        {lines.map((line, index) => (
          <TSpan key={`${gradientId}-${line}`} x={0} dy={index === 0 ? 0 : lineHeight}>
            {line}
          </TSpan>
        ))}
      </SvgText>
    </Svg>
  );
}

export default function CareerPlanEntryPage({ onNavigate }: CareerPlanEntryPageProps) {
  const [importedPlanName, setImportedPlanName] = useState('');
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  const pageScale = Math.min(screenWidth / DESIGN_SCREEN_WIDTH, screenHeight / DESIGN_SCREEN_HEIGHT);

  const handleImportPlan = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: TRAINING_PLAN_FILE_TYPES,
        copyToCacheDirectory: true,
        multiple: false,
      });

      if (result.canceled || result.assets.length === 0) {
        return;
      }

      const asset = result.assets[0];
      setImportedPlanName(asset.name || '已导入培养计划');
      Alert.alert('培养计划已导入', '已识别到你的专业培养计划，下一步可以继续生成更详细的职业规划。');
    } catch (error) {
      Alert.alert('导入失败', '暂时无法读取专业培养计划文件，请稍后重试。');
    }
  };

  return (
    <IdentityScreenBackground>
      <View style={styles.stage}>
        <View
          style={[
            styles.scaledCanvasViewport,
            {
              width: DESIGN_SCREEN_WIDTH * pageScale,
              height: DESIGN_SCREEN_HEIGHT * pageScale,
            },
          ]}
        >
          <View
            style={[
              styles.canvas,
              {
                transform: [{ scale: pageScale }],
              },
            ]}
          >
            <View pointerEvents="none" style={styles.bottomWashBack} />
            <View pointerEvents="none" style={styles.bottomWashFront} />

            <View style={styles.pageTitle}>
              <GradientTextBlock
                colors={TITLE_GRADIENT}
                fontSize={27}
                fontWeight="600"
                gradientId="career-plan-title-gradient"
                lineHeight={39}
                lines={TITLE_LINES}
                width={220}
              />
            </View>

            <View style={styles.pageSubtitle}>
              <GradientTextBlock
                colors={SUBTITLE_GRADIENT}
                fontSize={16}
                fontWeight="500"
                gradientId="career-plan-subtitle-gradient"
                lineHeight={34}
                lines={SUBTITLE_LINES}
                width={288}
              />
            </View>

            <View pointerEvents="none" style={styles.diamondSparkleWrap}>
              <Image
                resizeMode="contain"
                source={require('../../assets/shinebutton.png')}
                style={styles.diamondSparkleImage}
              />
            </View>

            <View pointerEvents="none" style={styles.mascotFrame}>
              <Image
                resizeMode="contain"
                source={require('../../assets/jixiangwu_elec.png')}
                style={styles.mascotImage}
              />
            </View>

            <View pointerEvents="none" style={styles.sideSparkleWrap}>
              <SideSparkle />
            </View>

            <View style={styles.bottomCopyWrap}>
              <Text style={styles.bottomCopyTitle}>导入专业培养计划，</Text>
              <Text style={styles.bottomCopyBody}>可以生成更详细的职业规划哦～</Text>
              {importedPlanName ? <Text style={styles.importedPlanText}>{`已导入：${importedPlanName}`}</Text> : null}
            </View>

            <Pressable
              hitSlop={8}
              onPress={handleImportPlan}
              style={({ pressed }) => [styles.importButton, pressed && styles.importButtonPressed]}
            >
              <Text style={styles.importButtonText}>
                {importedPlanName ? '重新导入专业培养计划' : '点击导入专业培养计划'}
              </Text>
            </Pressable>

            <BottomArrowNavigation
              bottom={20}
              hideLeft
              onRightPress={onNavigate}
              rightDisabled={!onNavigate}
              scaleX={1}
            />
          </View>
        </View>
      </View>
    </IdentityScreenBackground>
  );
}

const styles = StyleSheet.create({
  stage: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scaledCanvasViewport: {
    position: 'relative',
    overflow: 'hidden',
  },
  canvas: {
    width: DESIGN_SCREEN_WIDTH,
    height: DESIGN_SCREEN_HEIGHT,
    position: 'absolute',
    top: 0,
    left: 0,
    transformOrigin: 'top left',
  },
  bottomWashBack: {
    position: 'absolute',
    left: -112,
    top: 474,
    width: 628,
    height: 264,
    borderRadius: 314,
    backgroundColor: 'rgba(235, 247, 248, 0.78)',
  },
  bottomWashFront: {
    position: 'absolute',
    left: -38,
    top: 520,
    width: 456,
    height: 314,
    borderRadius: 228,
    backgroundColor: 'rgba(255, 255, 255, 0.74)',
  },
  pageTitle: {
    position: 'absolute',
    left: 37,
    top: 96,
    width: 220,
    height: 78,
  },
  pageSubtitle: {
    position: 'absolute',
    left: 37,
    top: 207,
    width: 288,
    height: 68,
  },
  diamondSparkleWrap: {
    position: 'absolute',
    left: 143,
    top: 291,
    width: 86,
    height: 86,
    opacity: 0.9,
  },
  diamondSparkleImage: {
    width: '100%',
    height: '100%',
  },
  mascotFrame: {
    position: 'absolute',
    left: 42,
    top: 294,
    width: 298,
    height: 264,
    overflow: 'hidden',
  },
  mascotImage: {
    position: 'absolute',
    left: -26,
    top: -10,
    width: 334,
    height: 501,
  },
  sideSparkleWrap: {
    position: 'absolute',
    left: 298,
    top: 377,
    width: 50,
    height: 50,
    opacity: 0.84,
  },
  bottomCopyWrap: {
    position: 'absolute',
    left: 36,
    top: 628,
    width: 232,
  },
  bottomCopyTitle: {
    fontSize: 14,
    lineHeight: 23,
    fontWeight: '600',
    letterSpacing: 0,
    color: 'rgba(74, 80, 82, 1)',
  },
  bottomCopyBody: {
    fontSize: 14,
    lineHeight: 23,
    fontWeight: '400',
    letterSpacing: 0,
    color: 'rgba(120, 127, 129, 1)',
  },
  importedPlanText: {
    marginTop: 8,
    fontSize: 11,
    lineHeight: 15,
    fontWeight: '500',
    letterSpacing: 0,
    color: 'rgba(95, 113, 116, 1)',
  },
  importButton: {
    position: 'absolute',
    left: 35,
    top: 683,
    minWidth: 152,
    height: 32,
    paddingHorizontal: 14,
    borderRadius: 0,
    backgroundColor: 'rgba(103, 103, 103, 0.96)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  importButtonPressed: {
    opacity: 0.78,
  },
  importButtonText: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '500',
    letterSpacing: 0,
    color: 'rgba(255, 255, 255, 1)',
  },
});
