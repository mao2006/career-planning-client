import { useEffect, useRef, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as echarts from 'echarts/core';
import { RadarChart } from 'echarts/charts';
import { RadarComponent } from 'echarts/components';

import SvgChart, { SVGRenderer } from '@wuba/react-native-echarts/svgChart';

import BottomArrowNavigation, { STANDARD_ARROW_BOTTOM } from '../../components/bottom-arrow-navigation';

echarts.use([SVGRenderer, RadarChart, RadarComponent]);

const DESIGN_SCREEN_WIDTH = 375;
const DESIGN_SCREEN_HEIGHT = 812;
const HEADER_SIDE_MARGIN = 15;
const HEADER_TITLE_TOP = 22;
const HEADER_TITLE_WIDTH = 204;
const HEADER_TITLE_HEIGHT = 50;
const HEADER_BUTTON_TOP = 47;
const HEADER_BUTTON_HEIGHT = 18;
const HEADER_BAR_HEIGHT = 84;
const RADAR_TOP_GAP = 3;
const RADAR_HEIGHT = 335;
const RADAR_SIDE_MARGIN = 10;
const RADAR_VALUES = [88, 79, 84, 80, 73];
const RADAR_LABELS = [
  { key: 'learning', text: '学习' },
  { key: 'communication', text: '沟通' },
  { key: 'practice', text: '实习' },
  { key: 'resilience', text: '抗压' },
  { key: 'innovation', text: '创新' },
] as const;
const RADAR_INDICATORS = RADAR_LABELS.map((item) => ({ name: item.text, max: 100 }));
const PROFILE_CARDS = ['专业技能', '证书'] as const;
const TARGET_ROWS = ['1', '2', '3'] as const;

type EmploymentRadarChartProps = {
  height: number;
  textScale: number;
  width: number;
};

function EmploymentRadarChart({ height, textScale, width }: EmploymentRadarChartProps) {
  const chartRef = useRef<any>(null);
  const chartInstanceRef = useRef<any>(null);

  useEffect(() => {
    if (!chartRef.current || width <= 0 || height <= 0) {
      return;
    }

    chartInstanceRef.current?.dispose();
    const chart = echarts.init(chartRef.current, undefined, {
      renderer: 'svg',
      width,
      height,
    });

    chart.setOption({
      animation: false,
      radar: {
        center: ['50%', '53%'],
        radius: '54%',
        shape: 'polygon',
        splitNumber: 5,
        indicator: RADAR_INDICATORS,
        axisName: {
          color: 'rgba(31, 31, 31, 1)',
          fontSize: 22 * textScale,
          fontWeight: 400,
          align: 'center',
          verticalAlign: 'middle',
        },
        axisNameGap: 28 * textScale,
        axisLine: {
          show: false,
        },
        splitLine: {
          lineStyle: {
            color: 'rgba(171, 171, 171, 0.55)',
            width: 2,
          },
        },
        splitArea: {
          show: false,
        },
      },
      series: [
        {
          type: 'radar',
          data: [
            {
              value: RADAR_VALUES,
              symbol: 'circle',
              symbolSize: 16 * textScale,
              itemStyle: {
                color: 'rgba(58, 199, 189, 1)',
                borderColor: 'rgba(255, 255, 255, 0.96)',
                borderWidth: 2,
              },
              lineStyle: {
                color: 'rgba(58, 199, 189, 1)',
                width: 6,
              },
              areaStyle: {
                color: 'rgba(69, 205, 196, 0.08)',
                shadowBlur: 20,
                shadowColor: 'rgba(58, 199, 189, 0.26)',
                shadowOffsetX: 0,
                shadowOffsetY: 8,
              },
            },
          ],
        },
      ],
    });

    chartInstanceRef.current = chart;

    return () => {
      chartInstanceRef.current?.dispose();
      chartInstanceRef.current = null;
    };
  }, [height, textScale, width]);

  return <SvgChart ref={chartRef} style={{ width, height }} />;
}

type EmploymentProfilePageProps = {
  onBack?: () => void;
  onNavigate?: () => void;
};

export default function EmploymentProfilePage({ onBack, onNavigate }: EmploymentProfilePageProps) {
  const [targetJobs, setTargetJobs] = useState(['', '', '']);
  const scrollViewRef = useRef<ScrollView>(null);
  const targetSectionOffsetRef = useRef(0);
  const targetRowOffsetsRef = useRef<number[]>([]);
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const scaleX = screenWidth / DESIGN_SCREEN_WIDTH;
  const scaleY = screenHeight / DESIGN_SCREEN_HEIGHT;
  const textScale = Math.min(scaleX, scaleY);
  const headerSafeOffset = insets.top;
  const headerBarHeight = HEADER_BAR_HEIGHT * scaleY + headerSafeOffset;
  const contentTop = headerBarHeight + RADAR_TOP_GAP * scaleY;
  const radarWidth = screenWidth - RADAR_SIDE_MARGIN * 2 * scaleX;
  const radarHeight = RADAR_HEIGHT * scaleY;
  const contentHorizontalPadding = 20 * scaleX;
  const cardGap = 18 * scaleX;
  const cardWidth = (screenWidth - contentHorizontalPadding * 2 - cardGap) / 2;
  const cardHeight = 164 * scaleY;
  const cardHeaderHeight = 32 * scaleY;
  const scrollBottomPadding = (STANDARD_ARROW_BOTTOM + 92) * scaleY;
  const updateTargetJob = (index: number, value: string) => {
    setTargetJobs((current) => current.map((item, itemIndex) => (itemIndex === index ? value : item)));
  };
  const focusTargetJob = (index: number) => {
    const rowOffset = targetRowOffsetsRef.current[index] ?? 0;
    const targetY = targetSectionOffsetRef.current + rowOffset;

    setTimeout(() => {
      scrollViewRef.current?.scrollTo({
        y: Math.max(0, targetY - 20 * scaleY),
        animated: true,
      });
    }, Platform.OS === 'ios' ? 140 : 80);
  };

  return (
    <View style={styles.screen}>
      <StatusBar style="dark" />

      <View
        style={[
          styles.headerBar,
          {
            height: headerBarHeight,
          },
        ]}
      />

      <Text
        style={[
          styles.titleText,
          {
            left: HEADER_SIDE_MARGIN * scaleX,
            top: HEADER_TITLE_TOP * scaleY + headerSafeOffset,
            width: HEADER_TITLE_WIDTH * scaleX,
            height: HEADER_TITLE_HEIGHT * scaleY,
            fontSize: 34 * textScale,
            lineHeight: 49.23 * textScale,
          },
        ]}
      >
        就业能力画像
      </Text>

      <Pressable
        disabled
        hitSlop={8}
        style={[
          styles.retryButton,
          {
            right: HEADER_SIDE_MARGIN * scaleX,
            top: HEADER_BUTTON_TOP * scaleY + headerSafeOffset,
            height: HEADER_BUTTON_HEIGHT * scaleY,
          },
        ]}
      >
        <Text
          numberOfLines={1}
          style={[
            styles.retryButtonText,
            {
              fontSize: 12 * textScale,
              lineHeight: 17.38 * textScale,
            },
          ]}
        >
          重新进行AI评估
        </Text>
        <MaterialIcons
          color="rgba(32, 148, 255, 1)"
          name="chevron-right"
          size={14 * textScale}
        />
      </Pressable>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 18 * scaleY : 0}
        style={styles.keyboardAvoidingView}
      >
        <ScrollView
          ref={scrollViewRef}
          keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          style={styles.contentScroll}
          contentContainerStyle={{
            flexGrow: 1,
            paddingTop: contentTop,
            paddingBottom: scrollBottomPadding,
          }}
        >
          <View
            style={[
              styles.radarWrap,
              {
                width: radarWidth,
                height: radarHeight,
                marginBottom: 18 * scaleY,
              },
            ]}
          >
            <EmploymentRadarChart height={radarHeight} textScale={textScale} width={radarWidth} />
          </View>

          <View
            style={[
              styles.cardsRow,
              {
                paddingHorizontal: contentHorizontalPadding,
                marginBottom: 24 * scaleY,
              },
            ]}
          >
            {PROFILE_CARDS.map((title) => (
              <View
                key={title}
                style={[
                  styles.profileCard,
                  {
                    width: cardWidth,
                    height: cardHeight,
                  },
                ]}
              >
                <View
                  style={[
                    styles.profileCardHeader,
                    {
                      height: cardHeaderHeight,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.profileCardHeaderText,
                      {
                        fontSize: 15 * textScale,
                        lineHeight: 20 * textScale,
                      },
                    ]}
                  >
                    {title}
                  </Text>
                </View>

                <View style={styles.profileCardBody}>
                  {[0, 1, 2, 3, 4].map((line) => (
                    <View
                      key={`${title}-${line}`}
                      style={[
                        styles.profileCardLine,
                        {
                          marginTop: line === 0 ? 22 * scaleY : 14 * scaleY,
                        },
                      ]}
                    />
                  ))}
                </View>
              </View>
            ))}
          </View>

          <View
            style={[
              styles.targetSection,
              {
                paddingHorizontal: contentHorizontalPadding,
              },
            ]}
            onLayout={(event) => {
              targetSectionOffsetRef.current = event.nativeEvent.layout.y;
            }}
          >
            <Text
              style={[
                styles.targetSectionTitle,
                {
                  fontSize: 16 * textScale,
                  lineHeight: 22 * textScale,
                  marginBottom: 12 * scaleY,
                },
              ]}
            >
              当前目标岗位(可手动更改)
            </Text>

            {TARGET_ROWS.map((indexLabel, index) => (
            <View
              key={indexLabel}
              onLayout={(event) => {
                targetRowOffsetsRef.current[index] = event.nativeEvent.layout.y;
              }}
              style={[
                styles.targetRow,
                {
                    marginBottom: 10 * scaleY,
                  },
                ]}
              >
                <View
                  style={[
                    styles.targetIndexBadge,
                    {
                      width: 26 * scaleY,
                      height: 26 * scaleY,
                      borderRadius: 13 * scaleY,
                      marginRight: 10 * scaleX,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.targetIndexText,
                      {
                        fontSize: 16 * textScale,
                        lineHeight: 18 * textScale,
                      },
                    ]}
                  >
                    {indexLabel}
                  </Text>
                </View>

                <TextInput
                  onChangeText={(value) => updateTargetJob(index, value)}
                  onFocus={() => focusTargetJob(index)}
                  placeholder="请输入目标岗位"
                  placeholderTextColor="rgba(180, 180, 180, 1)"
                  style={[
                    styles.targetInputShell,
                    styles.targetInputText,
                    {
                      height: 28 * scaleY,
                      borderRadius: 8 * scaleY,
                      paddingHorizontal: 10 * scaleX,
                    },
                  ]}
                  value={targetJobs[index]}
                />
              </View>
            ))}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <BottomArrowNavigation
        bottom={STANDARD_ARROW_BOTTOM * scaleY}
        leftDisabled={!onBack}
        onLeftPress={onBack}
        onRightPress={onNavigate}
        rightDisabled={!onNavigate}
        scaleX={scaleX}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#ffffff',
    position: 'relative',
  },
  headerBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(188, 238, 235, 1)',
    zIndex: 1,
  },
  titleText: {
    position: 'absolute',
    opacity: 1,
    zIndex: 2,
    color: 'rgba(0, 0, 0, 1)',
    fontWeight: '700',
    letterSpacing: 0,
    textAlign: 'left',
    includeFontPadding: false,
  },
  retryButton: {
    position: 'absolute',
    opacity: 1,
    zIndex: 2,
    flexDirection: 'row',
    alignItems: 'center',
  },
  retryButtonText: {
    flexShrink: 1,
    marginRight: 1,
    color: 'rgba(32, 148, 255, 1)',
    fontWeight: '400',
    letterSpacing: 0,
    textAlign: 'left',
    includeFontPadding: false,
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  contentScroll: {
    flex: 1,
  },
  radarWrap: {
    alignSelf: 'center',
    opacity: 1,
    zIndex: 1,
  },
  cardsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  profileCard: {
    backgroundColor: 'rgba(255, 255, 255, 1)',
    shadowColor: 'rgba(0, 0, 0, 0.18)',
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 6,
  },
  profileCardHeader: {
    backgroundColor: 'rgba(160, 228, 225, 1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileCardHeaderText: {
    color: 'rgba(255, 255, 255, 1)',
    fontWeight: '700',
    letterSpacing: 0,
    textAlign: 'center',
    includeFontPadding: false,
  },
  profileCardBody: {
    flex: 1,
    paddingHorizontal: 18,
    backgroundColor: 'rgba(255, 255, 255, 1)',
  },
  profileCardLine: {
    height: 1,
    backgroundColor: 'rgba(189, 189, 189, 0.9)',
  },
  targetSection: {
    width: '100%',
  },
  targetSectionTitle: {
    color: 'rgba(18, 18, 18, 1)',
    fontWeight: '600',
    letterSpacing: 0,
    textAlign: 'left',
    includeFontPadding: false,
  },
  targetRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  targetIndexBadge: {
    borderWidth: 2,
    borderColor: 'rgba(62, 62, 62, 1)',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 1)',
  },
  targetIndexText: {
    color: 'rgba(34, 34, 34, 1)',
    fontWeight: '600',
    textAlign: 'center',
    includeFontPadding: false,
  },
  targetInputShell: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.96)',
    shadowColor: 'rgba(0, 0, 0, 0.16)',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 1,
    shadowRadius: 6,
    elevation: 4,
  },
  targetInputText: {
    color: 'rgba(35, 35, 35, 1)',
    fontWeight: '400',
    letterSpacing: 0,
    textAlign: 'left',
    includeFontPadding: false,
  },
});
