import { useEffect, useRef, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as echarts from 'echarts/core';
import { RadarChart } from 'echarts/charts';
import { RadarComponent } from 'echarts/components';

import SvgChart, { SVGRenderer } from '@wuba/react-native-echarts/svgChart';

import BottomArrowNavigation, { STANDARD_ARROW_BOTTOM } from './bottom-arrow-navigation';
import {
  type EmploymentProfileContent,
  DEFAULT_EMPLOYMENT_PROFILE_CONTENT,
  generateEmploymentProfileContent,
  hasWorkflowAgentAuthorization,
} from '../services/agent-service';

echarts.use([SVGRenderer, RadarChart, RadarComponent]);

const DESIGN_SCREEN_WIDTH = 375;
const DESIGN_SCREEN_HEIGHT = 812;
const HEADER_SIDE_MARGIN = 16;
const HEADER_BAR_HEIGHT = 84;
const RADAR_HEIGHT = 318;
const TAB_BAR_RESERVED_HEIGHT = 124;
const RADAR_LABELS = ['学习', '沟通', '实践', '抗压', '创新'] as const;
const RADAR_INDICATORS = RADAR_LABELS.map((label) => ({ name: label, max: 100 }));

type EmploymentProfileScreenProps = {
  mode?: 'onboarding' | 'tab';
  onBack?: () => void;
  onNavigate?: () => void;
};

type EmploymentRadarChartProps = {
  height: number;
  textScale: number;
  values: number[];
  width: number;
};

function EmploymentRadarChart({ height, textScale, values, width }: EmploymentRadarChartProps) {
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
        center: ['50%', '50%'],
        radius: '58%',
        shape: 'polygon',
        splitNumber: 5,
        indicator: RADAR_INDICATORS,
        axisName: {
          color: 'rgba(37, 54, 55, 1)',
          fontSize: 18 * textScale,
          fontWeight: 600,
          align: 'center',
          verticalAlign: 'middle',
        },
        axisNameGap: 20 * textScale,
        axisLine: {
          lineStyle: {
            color: 'rgba(119, 190, 184, 0.36)',
            width: 1.6,
          },
        },
        splitLine: {
          lineStyle: {
            color: 'rgba(125, 198, 191, 0.42)',
            width: 1.8,
          },
        },
        splitArea: {
          areaStyle: {
            color: ['rgba(255,255,255,0.84)', 'rgba(236, 248, 246, 0.4)'],
          },
        },
      },
      series: [
        {
          type: 'radar',
          data: [
            {
              value: values,
              symbol: 'circle',
              symbolSize: 12 * textScale,
              itemStyle: {
                color: 'rgba(40, 193, 173, 1)',
                borderColor: 'rgba(255, 255, 255, 0.95)',
                borderWidth: 2,
              },
              lineStyle: {
                color: 'rgba(35, 184, 165, 1)',
                width: 4,
              },
              areaStyle: {
                color: 'rgba(44, 193, 173, 0.18)',
                shadowBlur: 18,
                shadowColor: 'rgba(49, 184, 168, 0.24)',
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
  }, [height, textScale, values, width]);

  return <SvgChart ref={chartRef} style={{ width, height }} />;
}

function SectionTitle({
  label,
  subtitle,
  textScale,
}: {
  label: string;
  subtitle?: string;
  textScale: number;
}) {
  return (
    <View style={styles.sectionTitleWrap}>
      <Text
        style={[
          styles.sectionTitle,
          {
            fontSize: 18 * textScale,
            lineHeight: 24 * textScale,
          },
        ]}
      >
        {label}
      </Text>
      {subtitle ? (
        <Text
          style={[
            styles.sectionSubtitle,
            {
              fontSize: 12 * textScale,
              lineHeight: 18 * textScale,
            },
          ]}
        >
          {subtitle}
        </Text>
      ) : null}
    </View>
  );
}

function ListCard({
  cardWidth,
  items,
  textScale,
  title,
}: {
  cardWidth: number;
  items: readonly string[];
  textScale: number;
  title: string;
}) {
  return (
    <View
      style={[
        styles.listCard,
        {
          width: cardWidth,
        },
      ]}
    >
      <Text
        style={[
          styles.listCardTitle,
          {
            fontSize: 16 * textScale,
            lineHeight: 21 * textScale,
          },
        ]}
      >
        {title}
      </Text>
      {items.map((item) => (
        <View key={`${title}-${item}`} style={styles.listRow}>
          <View style={styles.listBullet} />
          <Text
            style={[
              styles.listText,
              {
                fontSize: 12.5 * textScale,
                lineHeight: 18 * textScale,
              },
            ]}
          >
            {item}
          </Text>
        </View>
      ))}
    </View>
  );
}

export default function EmploymentProfileScreen({
  mode = 'onboarding',
  onBack,
  onNavigate,
}: EmploymentProfileScreenProps) {
  const agentEnabled = hasWorkflowAgentAuthorization();
  const [loadState, setLoadState] = useState<'idle' | 'loading' | 'success' | 'error'>(agentEnabled ? 'loading' : 'idle');
  const [profileContent, setProfileContent] = useState<EmploymentProfileContent>(DEFAULT_EMPLOYMENT_PROFILE_CONTENT);
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const scaleX = screenWidth / DESIGN_SCREEN_WIDTH;
  const scaleY = screenHeight / DESIGN_SCREEN_HEIGHT;
  const textScale = Math.min(scaleX, scaleY);
  const contentHorizontalPadding = 18 * scaleX;
  const contentWidth = screenWidth - contentHorizontalPadding * 2;
  const headerHeight = HEADER_BAR_HEIGHT * scaleY + insets.top;
  const radarWidth = Math.min(contentWidth - 28 * scaleX, 340 * scaleX);
  const radarHeight = RADAR_HEIGHT * scaleY;
  const listCardGap = 12 * scaleX;
  const listCardWidth = (contentWidth - listCardGap) / 2;
  const scrollBottomPadding =
    mode === 'tab'
      ? TAB_BAR_RESERVED_HEIGHT * scaleY + insets.bottom
      : (STANDARD_ARROW_BOTTOM + 96) * scaleY;

  const loadEmploymentProfile = () => {
    if (!agentEnabled) {
      return;
    }

    setLoadState('loading');

    generateEmploymentProfileContent()
      .then((nextProfileContent) => {
        setProfileContent(nextProfileContent);
        setLoadState('success');
      })
      .catch(() => {
        setLoadState('error');
      });
  };

  useEffect(() => {
    loadEmploymentProfile();
  }, []);

  const subtitleText =
    loadState === 'loading'
      ? 'AI 正在根据当前档案生成最新画像'
      : loadState === 'success'
        ? 'AI 已根据当前档案生成第一版评估'
        : agentEnabled
          ? '当前展示上一次可用画像，可点击右上角重新生成'
          : '未配置 Agent 授权，当前展示本地画像模板';
  const retryButtonText =
    loadState === 'loading' ? '生成中...' : agentEnabled ? '重新进行AI评估' : '待接入Agent';

  return (
    <LinearGradient
      colors={['rgba(183, 239, 231, 0.96)', 'rgba(242, 248, 247, 1)', 'rgba(252, 252, 252, 1)']}
      end={{ x: 0.5, y: 1 }}
      start={{ x: 0.08, y: 0 }}
      style={styles.screen}
    >
      <StatusBar style="dark" />

      <View pointerEvents="none" style={[styles.glowOrb, styles.glowOrbPrimary]} />
      <View pointerEvents="none" style={[styles.glowOrb, styles.glowOrbSecondary]} />

      <View
        style={[
          styles.headerShell,
          {
            height: headerHeight,
            paddingTop: insets.top + 14 * scaleY,
            paddingHorizontal: HEADER_SIDE_MARGIN * scaleX,
          },
        ]}
      >
        <View style={styles.headerTitleWrap}>
          <Text
            style={[
              styles.pageTitle,
              {
                fontSize: 32 * textScale,
                lineHeight: 42 * textScale,
              },
            ]}
          >
            就业能力画像
          </Text>
          <Text
            style={[
              styles.pageSubtitleText,
              {
                fontSize: 12 * textScale,
                lineHeight: 17 * textScale,
              },
            ]}
          >
            {subtitleText}
          </Text>
        </View>

        <Pressable
          disabled={!agentEnabled || loadState === 'loading'}
          hitSlop={8}
          onPress={loadEmploymentProfile}
          style={[styles.retryButton, (!agentEnabled || loadState === 'loading') && styles.retryButtonDisabled]}
        >
          <MaterialIcons color="rgba(34, 152, 142, 1)" name="autorenew" size={16 * textScale} />
          <Text
            style={[
              styles.retryButtonText,
              {
                fontSize: 12 * textScale,
                lineHeight: 16 * textScale,
              },
            ]}
          >
            {retryButtonText}
          </Text>
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={{
          paddingTop: headerHeight + 20 * scaleY,
          paddingBottom: scrollBottomPadding,
          paddingHorizontal: contentHorizontalPadding,
        }}
        showsVerticalScrollIndicator={false}
        style={styles.scrollView}
      >
        <LinearGradient
          colors={['rgba(20, 103, 91, 0.97)', 'rgba(46, 147, 132, 0.94)', 'rgba(98, 198, 184, 0.9)']}
          end={{ x: 1, y: 1 }}
          start={{ x: 0, y: 0 }}
          style={[styles.heroCard, { marginBottom: 18 * scaleY }]}
        >
          <View style={styles.heroBadge}>
            <Text
              style={[
                styles.heroBadgeText,
                {
                  fontSize: 11 * textScale,
                  lineHeight: 14 * textScale,
                },
              ]}
            >
              {profileContent.heroBadge}
            </Text>
          </View>

          <Text
            style={[
              styles.heroTitle,
              {
                fontSize: 24 * textScale,
                lineHeight: 31 * textScale,
                marginTop: 14 * scaleY,
              },
            ]}
          >
            {profileContent.heroTitle}
          </Text>

          <Text
            style={[
              styles.heroDescription,
              {
                fontSize: 13 * textScale,
                lineHeight: 20 * textScale,
                marginTop: 10 * scaleY,
              },
            ]}
          >
            {profileContent.heroDescription}
          </Text>

          <View style={[styles.metricRow, { marginTop: 16 * scaleY }]}>
            {profileContent.heroMetrics.map((item) => (
              <View key={item.label} style={styles.metricChip}>
                <Text
                  style={[
                    styles.metricLabel,
                    {
                      fontSize: 11 * textScale,
                      lineHeight: 14 * textScale,
                    },
                  ]}
                >
                  {item.label}
                </Text>
                <Text
                  style={[
                    styles.metricValue,
                    {
                      fontSize: 15 * textScale,
                      lineHeight: 19 * textScale,
                    },
                  ]}
                >
                  {item.value}
                </Text>
              </View>
            ))}
          </View>
        </LinearGradient>

        <View style={[styles.sectionCard, { marginBottom: 18 * scaleY }]}>
          <SectionTitle label="核心能力雷达" subtitle="当前最明显的能力结构分布" textScale={textScale} />
          <View
            style={[
              styles.radarShell,
              {
                height: radarHeight,
                marginTop: 10 * scaleY,
              },
            ]}
          >
            <EmploymentRadarChart
              height={radarHeight}
              textScale={textScale}
              values={profileContent.radarValues}
              width={radarWidth}
            />
          </View>
          <Text
            style={[
              styles.radarFootnote,
              {
                fontSize: 12.5 * textScale,
                lineHeight: 19 * textScale,
                marginTop: 8 * scaleY,
              },
            ]}
          >
            {profileContent.radarFootnote}
          </Text>
        </View>

        <View
          style={[
            styles.doubleCardRow,
            {
              marginBottom: 18 * scaleY,
              gap: listCardGap,
            },
          ]}
        >
          <ListCard cardWidth={listCardWidth} items={profileContent.professionalSkills} textScale={textScale} title="专业技能" />
          <ListCard cardWidth={listCardWidth} items={profileContent.certificates} textScale={textScale} title="证书" />
        </View>

        <View style={[styles.sectionCard, { marginBottom: 18 * scaleY }]}>
          <SectionTitle label="目标岗位建议" subtitle="建议采用 1 主 2 备 的投递组合" textScale={textScale} />

          {profileContent.targetJobs.map((item, index) => (
            <View
              key={item.title}
              style={[
                styles.jobCard,
                {
                  marginTop: index === 0 ? 14 * scaleY : 12 * scaleY,
                },
              ]}
            >
              <View style={styles.jobCardHeader}>
                <View style={styles.jobRankBadge}>
                  <Text
                    style={[
                      styles.jobRankText,
                      {
                        fontSize: 13 * textScale,
                        lineHeight: 16 * textScale,
                      },
                    ]}
                  >
                    {index + 1}
                  </Text>
                </View>
                <View style={styles.jobTitleWrap}>
                  <Text
                    style={[
                      styles.jobTitle,
                      {
                        fontSize: 15 * textScale,
                        lineHeight: 20 * textScale,
                      },
                    ]}
                  >
                    {item.title}
                  </Text>
                  <Text
                    style={[
                      styles.jobSummary,
                      {
                        fontSize: 12.5 * textScale,
                        lineHeight: 18 * textScale,
                      },
                    ]}
                  >
                    {item.summary}
                  </Text>
                </View>
                <View style={styles.matchRatePill}>
                  <Text
                    style={[
                      styles.matchRateText,
                      {
                        fontSize: 13 * textScale,
                        lineHeight: 16 * textScale,
                      },
                    ]}
                  >
                    {item.matchRate}
                  </Text>
                </View>
              </View>
            </View>
          ))}
        </View>

        <View style={[styles.sectionCard, { marginBottom: 18 * scaleY }]}>
          <SectionTitle label="能力拆解" subtitle="把抽象感觉转成更具体的可解释优势" textScale={textScale} />

          <View style={[styles.abilityGrid, { marginTop: 14 * scaleY }]}>
            {profileContent.abilityInsights.map((item) => (
              <View key={item.title} style={styles.abilityCard}>
                <Text
                  style={[
                    styles.abilityScore,
                    {
                      fontSize: 28 * textScale,
                      lineHeight: 34 * textScale,
                    },
                  ]}
                >
                  {item.score}
                </Text>
                <Text
                  style={[
                    styles.abilityTitle,
                    {
                      fontSize: 14 * textScale,
                      lineHeight: 18 * textScale,
                    },
                  ]}
                >
                  {item.title}
                </Text>
                <Text
                  style={[
                    styles.abilityBody,
                    {
                      fontSize: 12 * textScale,
                      lineHeight: 18 * textScale,
                      marginTop: 8 * scaleY,
                    },
                  ]}
                >
                  {item.body}
                </Text>
              </View>
            ))}
          </View>
        </View>

        <View style={[styles.sectionCard, { marginBottom: 18 * scaleY }]}>
          <SectionTitle label="优势与短板" subtitle="维持优势，同时优先补最影响求职结果的缺口" textScale={textScale} />

          <Text
            style={[
              styles.minorHeading,
              {
                fontSize: 14 * textScale,
                lineHeight: 19 * textScale,
                marginTop: 14 * scaleY,
              },
            ]}
          >
            目前最值得放大的优势
          </Text>

          <View style={[styles.tagWrap, { marginTop: 10 * scaleY }]}>
            {profileContent.strengthTags.map((tag) => (
              <View key={tag} style={styles.tagItem}>
                <Text
                  style={[
                    styles.tagText,
                    {
                      fontSize: 12 * textScale,
                      lineHeight: 16 * textScale,
                    },
                  ]}
                >
                  {tag}
                </Text>
              </View>
            ))}
          </View>

          <Text
            style={[
              styles.minorHeading,
              {
                fontSize: 14 * textScale,
                lineHeight: 19 * textScale,
                marginTop: 16 * scaleY,
              },
            ]}
          >
            当前最影响求职结果的短板
          </Text>

          {profileContent.gapItems.map((item) => (
            <View key={item} style={[styles.gapRow, { marginTop: 11 * scaleY }]}>
              <MaterialIcons color="rgba(34, 154, 144, 1)" name="check-circle" size={16 * textScale} />
              <Text
                style={[
                  styles.gapText,
                  {
                    fontSize: 12.5 * textScale,
                    lineHeight: 19 * textScale,
                  },
                ]}
              >
                {item}
              </Text>
            </View>
          ))}
        </View>

        <LinearGradient
          colors={['rgba(233, 251, 245, 1)', 'rgba(247, 253, 251, 1)']}
          end={{ x: 1, y: 1 }}
          start={{ x: 0, y: 0 }}
          style={styles.actionCard}
        >
          <SectionTitle label="未来 30 天建议" subtitle="把画像变成真正能带来 offer 结果的动作" textScale={textScale} />

          {profileContent.actionItems.map((item, index) => (
            <View
              key={item}
              style={[
                styles.actionRow,
                {
                  marginTop: index === 0 ? 14 * scaleY : 12 * scaleY,
                },
              ]}
            >
              <View style={styles.actionIndex}>
                <Text
                  style={[
                    styles.actionIndexText,
                    {
                      fontSize: 14 * textScale,
                      lineHeight: 18 * textScale,
                    },
                  ]}
                >
                  {index + 1}
                </Text>
              </View>
              <Text
                style={[
                  styles.actionText,
                  {
                    fontSize: 12.5 * textScale,
                    lineHeight: 19 * textScale,
                  },
                ]}
              >
                {item}
              </Text>
            </View>
          ))}
        </LinearGradient>
      </ScrollView>

      {mode === 'onboarding' ? (
        <BottomArrowNavigation
          bottom={STANDARD_ARROW_BOTTOM * scaleY}
          leftDisabled={!onBack}
          onLeftPress={onBack}
          onRightPress={onNavigate}
          rightDisabled={!onNavigate}
          scaleX={scaleX}
        />
      ) : null}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    position: 'relative',
    backgroundColor: 'rgba(248, 251, 250, 1)',
  },
  glowOrb: {
    position: 'absolute',
    borderRadius: 999,
    opacity: 0.6,
  },
  glowOrbPrimary: {
    top: -48,
    left: -70,
    width: 220,
    height: 220,
    backgroundColor: 'rgba(121, 224, 210, 0.32)',
  },
  glowOrbSecondary: {
    top: 132,
    right: -54,
    width: 170,
    height: 170,
    backgroundColor: 'rgba(203, 247, 234, 0.76)',
  },
  headerShell: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(236, 249, 246, 0.78)',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(190, 226, 221, 0.9)',
  },
  headerTitleWrap: {
    flex: 1,
    paddingRight: 12,
  },
  pageTitle: {
    color: 'rgba(17, 31, 32, 1)',
    fontWeight: '700',
    letterSpacing: 0,
  },
  pageSubtitleText: {
    marginTop: 2,
    color: 'rgba(85, 102, 104, 1)',
    fontWeight: '500',
    letterSpacing: 0,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 999,
    backgroundColor: 'rgba(255, 255, 255, 0.86)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(173, 216, 210, 0.92)',
  },
  retryButtonDisabled: {
    opacity: 0.52,
  },
  retryButtonText: {
    color: 'rgba(34, 152, 142, 1)',
    fontWeight: '500',
    letterSpacing: 0,
  },
  scrollView: {
    flex: 1,
  },
  heroCard: {
    borderRadius: 28,
    paddingHorizontal: 20,
    paddingVertical: 20,
    shadowColor: 'rgba(16, 78, 70, 0.26)',
    shadowOffset: {
      width: 0,
      height: 14,
    },
    shadowOpacity: 1,
    shadowRadius: 20,
    elevation: 10,
  },
  heroBadge: {
    alignSelf: 'flex-start',
    borderRadius: 999,
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
    paddingHorizontal: 11,
    paddingVertical: 6,
  },
  heroBadgeText: {
    color: 'rgba(244, 255, 252, 0.96)',
    fontWeight: '600',
    letterSpacing: 0.4,
  },
  heroTitle: {
    color: 'rgba(255, 255, 255, 0.98)',
    fontWeight: '700',
    letterSpacing: 0,
  },
  heroDescription: {
    color: 'rgba(238, 249, 247, 0.94)',
    fontWeight: '400',
    letterSpacing: 0,
  },
  metricRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  metricChip: {
    minWidth: 92,
    paddingHorizontal: 12,
    paddingVertical: 11,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.14)',
  },
  metricLabel: {
    color: 'rgba(226, 247, 243, 0.86)',
    fontWeight: '500',
  },
  metricValue: {
    marginTop: 3,
    color: 'rgba(255, 255, 255, 1)',
    fontWeight: '700',
  },
  sectionCard: {
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(220, 229, 228, 1)',
    shadowColor: 'rgba(34, 76, 68, 0.08)',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 1,
    shadowRadius: 14,
    elevation: 4,
  },
  sectionTitleWrap: {
    alignItems: 'flex-start',
  },
  sectionTitle: {
    color: 'rgba(19, 35, 36, 1)',
    fontWeight: '700',
    letterSpacing: 0,
  },
  sectionSubtitle: {
    marginTop: 4,
    color: 'rgba(111, 124, 125, 1)',
    fontWeight: '400',
    letterSpacing: 0,
  },
  radarShell: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 22,
    backgroundColor: 'rgba(246, 251, 250, 1)',
  },
  radarFootnote: {
    color: 'rgba(85, 97, 99, 1)',
    fontWeight: '400',
    letterSpacing: 0,
  },
  doubleCardRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  listCard: {
    borderRadius: 22,
    paddingHorizontal: 14,
    paddingVertical: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(220, 229, 228, 1)',
  },
  listCardTitle: {
    color: 'rgba(23, 39, 40, 1)',
    fontWeight: '700',
    letterSpacing: 0,
  },
  listRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 11,
  },
  listBullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginTop: 6,
    marginRight: 8,
    backgroundColor: 'rgba(40, 193, 173, 1)',
  },
  listText: {
    flex: 1,
    color: 'rgba(71, 83, 85, 1)',
    fontWeight: '500',
    letterSpacing: 0,
  },
  jobCard: {
    borderRadius: 20,
    backgroundColor: 'rgba(245, 250, 249, 1)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(214, 229, 227, 1)',
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  jobCardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  jobRankBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(40, 193, 173, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  jobRankText: {
    color: 'rgba(27, 148, 134, 1)',
    fontWeight: '700',
  },
  jobTitleWrap: {
    flex: 1,
    paddingRight: 10,
  },
  jobTitle: {
    color: 'rgba(20, 36, 37, 1)',
    fontWeight: '700',
  },
  jobSummary: {
    marginTop: 5,
    color: 'rgba(88, 102, 104, 1)',
    fontWeight: '400',
  },
  matchRatePill: {
    borderRadius: 999,
    backgroundColor: 'rgba(36, 187, 166, 0.16)',
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  matchRateText: {
    color: 'rgba(20, 138, 126, 1)',
    fontWeight: '700',
  },
  abilityGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
  },
  abilityCard: {
    width: '47%',
    minHeight: 150,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 14,
    backgroundColor: 'rgba(246, 251, 250, 1)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(216, 229, 227, 1)',
  },
  abilityScore: {
    color: 'rgba(28, 164, 148, 1)',
    fontWeight: '700',
    letterSpacing: -0.4,
  },
  abilityTitle: {
    color: 'rgba(24, 38, 40, 1)',
    fontWeight: '700',
  },
  abilityBody: {
    color: 'rgba(89, 101, 103, 1)',
    fontWeight: '400',
  },
  minorHeading: {
    color: 'rgba(28, 44, 45, 1)',
    fontWeight: '700',
  },
  tagWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  tagItem: {
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 9,
    backgroundColor: 'rgba(231, 248, 243, 1)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(204, 232, 226, 1)',
  },
  tagText: {
    color: 'rgba(32, 113, 104, 1)',
    fontWeight: '600',
  },
  gapRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  gapText: {
    flex: 1,
    marginLeft: 8,
    color: 'rgba(83, 96, 98, 1)',
    fontWeight: '400',
  },
  actionCard: {
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 18,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(219, 233, 229, 1)',
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  actionIndex: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(34, 154, 144, 1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  actionIndexText: {
    color: 'rgba(255, 255, 255, 1)',
    fontWeight: '700',
  },
  actionText: {
    flex: 1,
    color: 'rgba(73, 86, 88, 1)',
    fontWeight: '500',
  },
});
