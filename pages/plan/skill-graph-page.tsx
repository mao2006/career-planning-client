import { useEffect, useMemo, useRef } from 'react';
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
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Line } from 'react-native-svg';

type SkillGraphPageProps = {
  onBack?: () => void;
  planJob: {
    headerLabel: string;
    id: string;
    label: string;
  };
};

type SkillNodeStatus = 'dim' | 'lit';
type SkillNodeKind = 'ability' | 'advanced' | 'core' | 'skill';

type SkillGraphNode = {
  id: string;
  kind: SkillNodeKind;
  label: string;
  status?: SkillNodeStatus;
  x: number;
  y: number;
};

type SkillGraphScenario = {
  connections: Array<[string, string]>;
  legend: string;
  nodes: SkillGraphNode[];
  subtitle: string;
};

const MASCOT_SOURCE = require('../../assets/jixiangwu.png');
const MIN_SCALE = 0.72;
const MAX_SCALE = 2.4;
const OVERPAN = 180;

const SKILL_GRAPH_SCENARIOS: Record<string, SkillGraphScenario> = {
  'cpp-dev': {
    subtitle: '围绕 C++ 岗位要求展开的能力树，黑色为当前已点亮技能。',
    legend: '灰色为未点亮技能',
    connections: [
      ['core', 'foundation'],
      ['core', 'engineering'],
      ['core', 'proof'],
      ['foundation', 'cpp'],
      ['foundation', 'stl'],
      ['cpp', 'template'],
      ['stl', 'algo'],
      ['engineering', 'linux'],
      ['engineering', 'git'],
      ['linux', 'gdb'],
      ['git', 'build'],
      ['proof', 'project'],
      ['proof', 'intern'],
      ['project', 'module'],
      ['intern', 'launch'],
    ],
    nodes: [
      { id: 'core', kind: 'core', label: '能力核心', x: 0.5, y: 0.42 },
      { id: 'foundation', kind: 'ability', label: '编程基础', x: 0.24, y: 0.18 },
      { id: 'engineering', kind: 'ability', label: '工程实现', x: 0.76, y: 0.18 },
      { id: 'proof', kind: 'ability', label: '岗位证明', x: 0.5, y: 0.74 },
      { id: 'cpp', kind: 'skill', label: 'C++语法', status: 'lit', x: 0.1, y: 0.07 },
      { id: 'stl', kind: 'skill', label: '数据结构', status: 'lit', x: 0.34, y: 0.05 },
      { id: 'template', kind: 'advanced', label: '模板泛型', status: 'dim', x: 0.11, y: 0.3 },
      { id: 'algo', kind: 'advanced', label: '算法优化', status: 'dim', x: 0.33, y: 0.27 },
      { id: 'linux', kind: 'skill', label: 'Linux', status: 'lit', x: 0.66, y: 0.05 },
      { id: 'git', kind: 'skill', label: 'Git协作', status: 'lit', x: 0.9, y: 0.07 },
      { id: 'gdb', kind: 'advanced', label: 'GDB调试', status: 'lit', x: 0.67, y: 0.27 },
      { id: 'build', kind: 'advanced', label: '构建部署', status: 'dim', x: 0.89, y: 0.3 },
      { id: 'project', kind: 'skill', label: '课程项目', status: 'lit', x: 0.24, y: 0.89 },
      { id: 'intern', kind: 'skill', label: '竞赛/实习', status: 'dim', x: 0.76, y: 0.89 },
      { id: 'module', kind: 'advanced', label: '模块拆分', status: 'lit', x: 0.12, y: 0.97 },
      { id: 'launch', kind: 'advanced', label: '上线经验', status: 'dim', x: 0.88, y: 0.97 },
    ],
  },
  'test-dev': {
    subtitle: '围绕测试开发岗位要求展开的技能树，优先强调质量思维与自动化能力。',
    legend: '灰色为未点亮技能',
    connections: [
      ['core', 'testing'],
      ['core', 'automation'],
      ['core', 'quality'],
      ['testing', 'cases'],
      ['testing', 'api'],
      ['cases', 'risk'],
      ['api', 'sql'],
      ['automation', 'python'],
      ['automation', 'framework'],
      ['python', 'ci'],
      ['framework', 'report'],
      ['quality', 'defect'],
      ['quality', 'platform'],
      ['defect', 'review'],
      ['platform', 'metrics'],
    ],
    nodes: [
      { id: 'core', kind: 'core', label: '能力核心', x: 0.5, y: 0.42 },
      { id: 'testing', kind: 'ability', label: '测试设计', x: 0.24, y: 0.18 },
      { id: 'automation', kind: 'ability', label: '自动化工程', x: 0.76, y: 0.18 },
      { id: 'quality', kind: 'ability', label: '质量闭环', x: 0.5, y: 0.74 },
      { id: 'cases', kind: 'skill', label: '用例设计', status: 'lit', x: 0.1, y: 0.07 },
      { id: 'api', kind: 'skill', label: '接口调试', status: 'lit', x: 0.34, y: 0.05 },
      { id: 'risk', kind: 'advanced', label: '风险识别', status: 'dim', x: 0.11, y: 0.3 },
      { id: 'sql', kind: 'advanced', label: 'SQL分析', status: 'lit', x: 0.33, y: 0.27 },
      { id: 'python', kind: 'skill', label: 'Python', status: 'lit', x: 0.67, y: 0.05 },
      { id: 'framework', kind: 'skill', label: '自动化框架', status: 'dim', x: 0.9, y: 0.07 },
      { id: 'ci', kind: 'advanced', label: 'CI接入', status: 'dim', x: 0.67, y: 0.27 },
      { id: 'report', kind: 'advanced', label: '测试报告', status: 'lit', x: 0.89, y: 0.3 },
      { id: 'defect', kind: 'skill', label: '缺陷复盘', status: 'lit', x: 0.24, y: 0.89 },
      { id: 'platform', kind: 'skill', label: '平台工具', status: 'dim', x: 0.76, y: 0.89 },
      { id: 'review', kind: 'advanced', label: '回归策略', status: 'lit', x: 0.12, y: 0.97 },
      { id: 'metrics', kind: 'advanced', label: '质量度量', status: 'dim', x: 0.88, y: 0.97 },
    ],
  },
  embedded: {
    subtitle: '围绕嵌入式开发岗位要求展开的技能树，强调底层编程、联调和场景交付。',
    legend: '灰色为未点亮技能',
    connections: [
      ['core', 'low-level'],
      ['core', 'debug'],
      ['core', 'delivery'],
      ['low-level', 'c'],
      ['low-level', 'protocol'],
      ['c', 'memory'],
      ['protocol', 'driver'],
      ['debug', 'tools'],
      ['debug', 'rts'],
      ['tools', 'analyze'],
      ['rts', 'boot'],
      ['delivery', 'project'],
      ['delivery', 'iot'],
      ['project', 'board'],
      ['iot', 'upgrade'],
    ],
    nodes: [
      { id: 'core', kind: 'core', label: '能力核心', x: 0.5, y: 0.42 },
      { id: 'low-level', kind: 'ability', label: '底层编程', x: 0.24, y: 0.18 },
      { id: 'debug', kind: 'ability', label: '硬件联调', x: 0.76, y: 0.18 },
      { id: 'delivery', kind: 'ability', label: '场景交付', x: 0.5, y: 0.74 },
      { id: 'c', kind: 'skill', label: 'C语言', status: 'lit', x: 0.1, y: 0.07 },
      { id: 'protocol', kind: 'skill', label: '接口协议', status: 'lit', x: 0.34, y: 0.05 },
      { id: 'memory', kind: 'advanced', label: '内存控制', status: 'dim', x: 0.11, y: 0.3 },
      { id: 'driver', kind: 'advanced', label: '驱动开发', status: 'dim', x: 0.33, y: 0.27 },
      { id: 'tools', kind: 'skill', label: '调试工具', status: 'lit', x: 0.67, y: 0.05 },
      { id: 'rts', kind: 'skill', label: 'RTOS', status: 'dim', x: 0.9, y: 0.07 },
      { id: 'analyze', kind: 'advanced', label: '问题定位', status: 'lit', x: 0.67, y: 0.27 },
      { id: 'boot', kind: 'advanced', label: '启动流程', status: 'dim', x: 0.89, y: 0.3 },
      { id: 'project', kind: 'skill', label: '硬件项目', status: 'lit', x: 0.24, y: 0.89 },
      { id: 'iot', kind: 'skill', label: 'IoT接入', status: 'dim', x: 0.76, y: 0.89 },
      { id: 'board', kind: 'advanced', label: '板级验证', status: 'lit', x: 0.12, y: 0.97 },
      { id: 'upgrade', kind: 'advanced', label: '远程升级', status: 'dim', x: 0.88, y: 0.97 },
    ],
  },
};

function getNodeFrame(node: SkillGraphNode, width: number, height: number) {
  if (node.kind === 'core') {
    const size = 148;
    return {
      width: size,
      height: size,
      left: width * node.x - size / 2,
      top: height * node.y - size / 2,
    };
  }

  const baseWidth = node.kind === 'ability' ? 118 : node.kind === 'skill' ? 88 : 92;
  const baseHeight = node.kind === 'ability' ? 52 : node.kind === 'skill' ? 38 : 34;

  return {
    width: baseWidth,
    height: baseHeight,
    left: width * node.x - baseWidth / 2,
    top: height * node.y - baseHeight / 2,
  };
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function distanceBetweenTouches(touches: readonly any[]) {
  if (touches.length < 2) {
    return 0;
  }

  const [first, second] = touches;
  const dx = (second.locationX ?? second.pageX ?? 0) - (first.locationX ?? first.pageX ?? 0);
  const dy = (second.locationY ?? second.pageY ?? 0) - (first.locationY ?? first.pageY ?? 0);

  return Math.hypot(dx, dy);
}

function midpointBetweenTouches(touches: readonly any[]) {
  if (touches.length === 0) {
    return { x: 0, y: 0 };
  }

  if (touches.length === 1) {
    const [touch] = touches;

    return {
      x: touch.locationX ?? touch.pageX ?? 0,
      y: touch.locationY ?? touch.pageY ?? 0,
    };
  }

  const [first, second] = touches;

  return {
    x: ((first.locationX ?? first.pageX ?? 0) + (second.locationX ?? second.pageX ?? 0)) / 2,
    y: ((first.locationY ?? first.pageY ?? 0) + (second.locationY ?? second.pageY ?? 0)) / 2,
  };
}

function clampTranslation(
  translateX: number,
  translateY: number,
  scale: number,
  viewportWidth: number,
  viewportHeight: number,
  contentWidth: number,
  contentHeight: number,
) {
  const scaledWidth = contentWidth * scale;
  const scaledHeight = contentHeight * scale;
  const minX = viewportWidth - scaledWidth - OVERPAN;
  const maxX = OVERPAN;
  const minY = viewportHeight - scaledHeight - OVERPAN;
  const maxY = OVERPAN;

  return {
    x: clamp(translateX, minX, maxX),
    y: clamp(translateY, minY, maxY),
  };
}

export default function SkillGraphPage({ onBack, planJob }: SkillGraphPageProps) {
  const insets = useSafeAreaInsets();
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  const contentWidth = Math.min(screenWidth - 24, 430);
  const graphViewportHeight = Math.max(520, screenHeight - insets.top - 186);
  const graphWidth = Math.max(contentWidth * 1.95, 840);
  const graphHeight = Math.max(graphViewportHeight * 1.55, 1080);
  const scaleValue = useRef(new Animated.Value(1)).current;
  const translateXValue = useRef(new Animated.Value(0)).current;
  const translateYValue = useRef(new Animated.Value(0)).current;
  const transformStateRef = useRef({ scale: 1, x: 0, y: 0 });
  const gestureModeRef = useRef<'pan' | 'pinch' | null>(null);
  const panStartRef = useRef({ touchX: 0, touchY: 0, x: 0, y: 0 });
  const pinchStartRef = useRef({ distance: 0, midpointX: 0, midpointY: 0, scale: 1, x: 0, y: 0 });
  const scenario = useMemo(
    () =>
      SKILL_GRAPH_SCENARIOS[planJob.id] ?? {
        subtitle: `围绕 ${planJob.headerLabel} 岗位要求展开的技能树。`,
        legend: '灰色为未点亮技能',
        connections: [],
        nodes: [{ id: 'core', kind: 'core' as const, label: '能力核心', x: 0.5, y: 0.42 }],
      },
    [planJob.headerLabel, planJob.id],
  );

  useEffect(() => {
    const rootCenterX = graphWidth * 0.5;
    const rootCenterY = graphHeight * 0.42;
    const initialTransform = clampTranslation(
      contentWidth / 2 - rootCenterX,
      graphViewportHeight / 2 - rootCenterY,
      1,
      contentWidth,
      graphViewportHeight,
      graphWidth,
      graphHeight,
    );

    transformStateRef.current = {
      scale: 1,
      x: initialTransform.x,
      y: initialTransform.y,
    };
    scaleValue.setValue(1);
    translateXValue.setValue(initialTransform.x);
    translateYValue.setValue(initialTransform.y);
  }, [contentWidth, graphHeight, graphViewportHeight, graphWidth, planJob.id, scaleValue, translateXValue, translateYValue]);

  const nodeMap = useMemo(
    () =>
      Object.fromEntries(
        scenario.nodes.map((node) => [
          node.id,
          {
            node,
            frame: getNodeFrame(node, graphWidth, graphHeight),
          },
        ]),
      ),
    [graphHeight, graphWidth, scenario.nodes],
  );

  const updateTransform = (scale: number, translateX: number, translateY: number) => {
    const clampedScale = clamp(scale, MIN_SCALE, MAX_SCALE);
    const clampedPosition = clampTranslation(
      translateX,
      translateY,
      clampedScale,
      contentWidth,
      graphViewportHeight,
      graphWidth,
      graphHeight,
    );

    transformStateRef.current = {
      scale: clampedScale,
      x: clampedPosition.x,
      y: clampedPosition.y,
    };
    scaleValue.setValue(clampedScale);
    translateXValue.setValue(clampedPosition.x);
    translateYValue.setValue(clampedPosition.y);
  };

  const beginPan = (touch: any) => {
    gestureModeRef.current = 'pan';
    panStartRef.current = {
      touchX: touch.locationX ?? touch.pageX ?? 0,
      touchY: touch.locationY ?? touch.pageY ?? 0,
      x: transformStateRef.current.x,
      y: transformStateRef.current.y,
    };
  };

  const beginPinch = (touches: readonly any[]) => {
    const midpoint = midpointBetweenTouches(touches);

    gestureModeRef.current = 'pinch';
    pinchStartRef.current = {
      distance: Math.max(distanceBetweenTouches(touches), 1),
      midpointX: midpoint.x,
      midpointY: midpoint.y,
      scale: transformStateRef.current.scale,
      x: transformStateRef.current.x,
      y: transformStateRef.current.y,
    };
  };

  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: () => true,
    onPanResponderGrant: (event) => {
      const touches = event.nativeEvent.touches;

      if (touches.length >= 2) {
        beginPinch(touches);
        return;
      }

      if (touches.length === 1) {
        beginPan(touches[0]);
      }
    },
    onPanResponderMove: (event) => {
      const touches = event.nativeEvent.touches;

      if (touches.length >= 2) {
        if (gestureModeRef.current !== 'pinch') {
          beginPinch(touches);
        }

        const midpoint = midpointBetweenTouches(touches);
        const distance = Math.max(distanceBetweenTouches(touches), 1);
        const pinchStart = pinchStartRef.current;
        const nextScale = clamp((pinchStart.scale * distance) / pinchStart.distance, MIN_SCALE, MAX_SCALE);
        const focalContentX = (pinchStart.midpointX - pinchStart.x) / pinchStart.scale;
        const focalContentY = (pinchStart.midpointY - pinchStart.y) / pinchStart.scale;
        const nextTranslateX = midpoint.x - focalContentX * nextScale;
        const nextTranslateY = midpoint.y - focalContentY * nextScale;

        updateTransform(nextScale, nextTranslateX, nextTranslateY);
        return;
      }

      if (touches.length === 1) {
        if (gestureModeRef.current !== 'pan') {
          beginPan(touches[0]);
        }

        const touch = touches[0];
        const nextTranslateX =
          panStartRef.current.x + (touch.locationX ?? touch.pageX ?? 0) - panStartRef.current.touchX;
        const nextTranslateY =
          panStartRef.current.y + (touch.locationY ?? touch.pageY ?? 0) - panStartRef.current.touchY;

        updateTransform(transformStateRef.current.scale, nextTranslateX, nextTranslateY);
      }
    },
    onPanResponderRelease: () => {
      gestureModeRef.current = null;
    },
    onPanResponderTerminate: () => {
      gestureModeRef.current = null;
    },
    onPanResponderTerminationRequest: () => false,
  });

  return (
    <View style={styles.screen}>
      <LinearGradient
        colors={['rgba(177, 238, 230, 1)', 'rgba(239, 247, 246, 1)', 'rgba(249, 250, 250, 1)']}
        end={{ x: 0.5, y: 1 }}
        start={{ x: 0, y: 0 }}
        style={styles.screen}
      >
        <View pointerEvents="none" style={[styles.backgroundGlow, styles.backgroundGlowPrimary]} />
        <View pointerEvents="none" style={[styles.backgroundGlow, styles.backgroundGlowSecondary]} />

        <View style={[styles.headerWrap, { paddingTop: insets.top + 12, width: contentWidth }]}>
          <View style={styles.headerRow}>
            <Pressable hitSlop={10} onPress={onBack} style={styles.circleHeaderButton}>
              <MaterialIcons color="rgba(110, 118, 124, 1)" name="arrow-back-ios-new" size={22} />
            </Pressable>

            <View style={styles.headerTextWrap}>
              <Text style={styles.pageTitle}>技能图谱</Text>
              <Text style={styles.pageSubtitle}>{scenario.subtitle}</Text>
            </View>
          </View>

          <View style={styles.legendRow}>
            <View style={styles.legendDimSample} />
            <Text style={styles.legendText}>{scenario.legend}</Text>
          </View>
        </View>

        <View
          style={[
            styles.graphViewport,
            {
              width: contentWidth,
              height: graphViewportHeight,
              marginBottom: insets.bottom + 20,
            },
          ]}
        >
          <View {...panResponder.panHandlers} style={styles.graphGestureLayer}>
            <Animated.View
              style={[
                styles.graphTranslateLayer,
                {
                  transform: [{ translateX: translateXValue }, { translateY: translateYValue }],
                },
              ]}
            >
              <Animated.View
                style={[
                  styles.graphScaleLayer,
                  {
                    width: graphWidth,
                    height: graphHeight,
                    transform: [{ scale: scaleValue }],
                  },
                ]}
              >
                <View style={[styles.graphWrap, { width: graphWidth, height: graphHeight }]}>
                  <Svg height={graphHeight} style={StyleSheet.absoluteFill} width={graphWidth}>
                    {scenario.connections.map(([fromId, toId]) => {
                      const from = nodeMap[fromId];
                      const to = nodeMap[toId];

                      if (!from || !to) {
                        return null;
                      }

                      return (
                        <Line
                          key={`${fromId}-${toId}`}
                          stroke="rgba(18, 99, 82, 0.72)"
                          strokeLinecap="round"
                          strokeWidth={2.1}
                          x1={from.frame.left + from.frame.width / 2}
                          x2={to.frame.left + to.frame.width / 2}
                          y1={from.frame.top + from.frame.height / 2}
                          y2={to.frame.top + to.frame.height / 2}
                        />
                      );
                    })}
                  </Svg>

                  <View pointerEvents="none" style={[styles.graphMist, styles.graphMistPrimary]} />
                  <View pointerEvents="none" style={[styles.graphMist, styles.graphMistSecondary]} />

                  {scenario.nodes.map((node) => {
                    const frame = nodeMap[node.id].frame;

                    if (node.kind === 'core') {
                      return (
                        <View
                          key={node.id}
                          style={[
                            styles.coreNodeShell,
                            {
                              left: frame.left,
                              top: frame.top,
                              width: frame.width,
                              height: frame.height,
                            },
                          ]}
                        >
                          <View style={styles.coreNodeGlow} />
                          <LinearGradient
                            colors={['rgba(255, 255, 255, 0.98)', 'rgba(228, 249, 233, 0.96)', 'rgba(248, 255, 250, 1)']}
                            end={{ x: 1, y: 1 }}
                            start={{ x: 0, y: 0 }}
                            style={styles.coreNodeInner}
                          >
                            <Image resizeMode="contain" source={MASCOT_SOURCE} style={styles.coreMascotImage} />
                          </LinearGradient>
                        </View>
                      );
                    }

                    const nodeContainerStyle =
                      node.kind === 'ability'
                        ? styles.abilityNode
                        : node.status === 'lit'
                          ? node.kind === 'advanced'
                            ? styles.advancedNodeLit
                            : styles.skillNodeLit
                          : node.kind === 'advanced'
                            ? styles.advancedNodeDim
                            : styles.skillNodeDim;
                    const nodeTextStyle =
                      node.kind === 'ability'
                        ? styles.abilityNodeText
                        : node.status === 'lit'
                          ? styles.skillNodeTextLit
                          : styles.skillNodeTextDim;

                    return (
                      <View
                        key={node.id}
                        style={[
                          styles.graphNodeBase,
                          nodeContainerStyle,
                          {
                            left: frame.left,
                            top: frame.top,
                            width: frame.width,
                            height: frame.height,
                          },
                        ]}
                      >
                        <Text numberOfLines={2} style={nodeTextStyle}>
                          {node.label}
                        </Text>
                      </View>
                    );
                  })}
                </View>
              </Animated.View>
            </Animated.View>
          </View>
        </View>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: 'rgba(245, 249, 248, 1)',
  },
  backgroundGlow: {
    position: 'absolute',
    borderRadius: 999,
    opacity: 0.58,
  },
  backgroundGlowPrimary: {
    width: 290,
    height: 290,
    top: 110,
    right: -70,
    backgroundColor: 'rgba(123, 223, 208, 0.24)',
  },
  backgroundGlowSecondary: {
    width: 220,
    height: 220,
    left: -68,
    top: 280,
    backgroundColor: 'rgba(253, 234, 180, 0.18)',
  },
  headerWrap: {
    alignSelf: 'center',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  circleHeaderButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: 'rgba(132, 139, 145, 0.8)',
    backgroundColor: 'rgba(255, 255, 255, 0.36)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  headerTextWrap: {
    flex: 1,
  },
  pageTitle: {
    fontSize: 28,
    lineHeight: 34,
    fontWeight: '800',
    color: 'rgba(10, 16, 18, 1)',
  },
  pageSubtitle: {
    marginTop: 4,
    fontSize: 14,
    lineHeight: 21,
    color: 'rgba(78, 89, 94, 1)',
  },
  legendRow: {
    marginTop: 14,
    alignSelf: 'flex-end',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.72)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(225, 230, 233, 1)',
  },
  legendDimSample: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: 'rgba(187, 193, 199, 1)',
    marginRight: 8,
  },
  legendText: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '700',
    color: 'rgba(150, 156, 162, 1)',
  },
  graphViewport: {
    alignSelf: 'center',
    marginTop: 14,
    borderRadius: 28,
    overflow: 'hidden',
    backgroundColor: 'rgba(255, 255, 255, 0.38)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(219, 231, 228, 1)',
    shadowColor: 'rgba(20, 64, 55, 0.1)',
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 1,
    shadowRadius: 20,
    elevation: 8,
  },
  graphGestureLayer: {
    flex: 1,
    overflow: 'hidden',
  },
  graphTranslateLayer: {
    position: 'absolute',
    left: 0,
    top: 0,
  },
  graphScaleLayer: {
    transformOrigin: 'top left',
  },
  graphWrap: {
    position: 'relative',
  },
  graphMist: {
    position: 'absolute',
    borderRadius: 999,
  },
  graphMistPrimary: {
    width: 360,
    height: 360,
    left: 214,
    top: 248,
    backgroundColor: 'rgba(115, 229, 217, 0.1)',
  },
  graphMistSecondary: {
    width: 240,
    height: 240,
    left: 292,
    top: 324,
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
  },
  coreNodeShell: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  coreNodeGlow: {
    position: 'absolute',
    width: 168,
    height: 168,
    borderRadius: 84,
    backgroundColor: 'rgba(151, 232, 223, 0.28)',
  },
  coreNodeInner: {
    width: '100%',
    height: '100%',
    borderRadius: 74,
    borderWidth: 2,
    borderColor: 'rgba(212, 244, 219, 1)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: 'rgba(34, 108, 90, 0.18)',
    shadowOffset: {
      width: 0,
      height: 12,
    },
    shadowOpacity: 1,
    shadowRadius: 18,
    elevation: 10,
  },
  coreMascotImage: {
    width: '82%',
    height: '82%',
  },
  graphNodeBase: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  abilityNode: {
    borderRadius: 18,
    backgroundColor: 'rgba(240, 251, 248, 0.96)',
    borderWidth: 1.5,
    borderColor: 'rgba(177, 232, 214, 1)',
    shadowColor: 'rgba(31, 106, 88, 0.14)',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 1,
    shadowRadius: 16,
    elevation: 7,
  },
  abilityNodeText: {
    fontSize: 15,
    lineHeight: 20,
    fontWeight: '800',
    color: 'rgba(18, 90, 66, 1)',
    textAlign: 'center',
  },
  skillNodeLit: {
    borderRadius: 16,
    backgroundColor: 'rgba(16, 20, 24, 0.95)',
    shadowColor: 'rgba(0, 0, 0, 0.22)',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 1,
    shadowRadius: 12,
    elevation: 8,
  },
  advancedNodeLit: {
    borderRadius: 15,
    backgroundColor: 'rgba(36, 40, 45, 0.94)',
  },
  skillNodeDim: {
    borderRadius: 16,
    backgroundColor: 'rgba(205, 210, 216, 0.98)',
  },
  advancedNodeDim: {
    borderRadius: 15,
    backgroundColor: 'rgba(218, 222, 227, 0.98)',
  },
  skillNodeTextLit: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '700',
    color: 'rgba(255, 255, 255, 1)',
    textAlign: 'center',
  },
  skillNodeTextDim: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '700',
    color: 'rgba(108, 116, 123, 1)',
    textAlign: 'center',
  },
});
