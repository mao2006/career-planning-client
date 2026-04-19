import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  PanResponder,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type TaskType = 'accumulate' | 'focused';

type WeeklyLearningTask = {
  completion: 'done' | 'todo';
  deliverables: string[];
  detail: string;
  id: string;
  importance: number;
  progress?: number;
  scheduled: boolean;
  title: string;
  type: TaskType;
  windowLabel?: string;
};

type WeeklyLearningPlan = {
  tasks: WeeklyLearningTask[];
};

type ScheduleCourseBlock = {
  color: string;
  dayIndex: number;
  duration: number;
  id: string;
  location: string;
  startPeriod: number;
  title: string;
};

export type WeeklyTaskPlacement = {
  dayIndex: number;
  duration: number;
  startPeriod: number;
  taskId: string;
};

type WeeklySchedulePageProps = {
  importedScheduleName: string;
  learningPlan: WeeklyLearningPlan;
  onBack?: () => void;
  onImportSchedule?: () => void | Promise<void>;
  onPlacementsChange?: (placements: WeeklyTaskPlacement[]) => void;
  onTaskPress?: (taskId: string) => void;
  placements?: WeeklyTaskPlacement[];
  planJob: {
    headerLabel: string;
    id: string;
    label: string;
  };
  selectedPeriod: string;
  storageKey: string;
};

type GridFrame = {
  height: number;
  width: number;
  x: number;
  y: number;
};

const DAYS = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'] as const;
const PERIODS = [
  { index: 1, start: '08:10', end: '08:55' },
  { index: 2, start: '09:00', end: '09:45' },
  { index: 3, start: '10:10', end: '10:55' },
  { index: 4, start: '11:00', end: '11:45' },
  { index: 5, start: '13:30', end: '14:15' },
  { index: 6, start: '14:20', end: '15:05' },
  { index: 7, start: '15:20', end: '16:05' },
  { index: 8, start: '16:10', end: '16:55' },
  { index: 9, start: '17:10', end: '17:55' },
  { index: 10, start: '19:00', end: '19:45' },
  { index: 11, start: '19:50', end: '20:35' },
  { index: 12, start: '20:40', end: '21:25' },
] as const;
const COURSE_BLOCKS: ScheduleCourseBlock[] = [
  {
    id: 'mon-project-management',
    dayIndex: 0,
    startPeriod: 1,
    duration: 2,
    title: '软件项目管理',
    location: '博易 C103',
    color: 'rgba(63, 211, 192, 0.95)',
  },
  {
    id: 'mon-material-mechanics',
    dayIndex: 0,
    startPeriod: 3,
    duration: 2,
    title: '材料力学',
    location: '语 312',
    color: 'rgba(75, 193, 196, 0.95)',
  },
  {
    id: 'mon-cae',
    dayIndex: 0,
    startPeriod: 6,
    duration: 2,
    title: '计算机辅助工程分析',
    location: '健 A204',
    color: 'rgba(111, 204, 255, 0.96)',
  },
  {
    id: 'mon-emergency',
    dayIndex: 0,
    startPeriod: 8,
    duration: 2,
    title: '应急预案与演练',
    location: '健 B102',
    color: 'rgba(255, 209, 64, 0.98)',
  },
  {
    id: 'tue-training-morning',
    dayIndex: 1,
    startPeriod: 1,
    duration: 4,
    title: '机械工程训练与劳动',
    location: '朝晖机械工程训练中心',
    color: 'rgba(255, 181, 44, 0.98)',
  },
  {
    id: 'tue-training-afternoon',
    dayIndex: 1,
    startPeriod: 6,
    duration: 4,
    title: '机械工程训练与劳动',
    location: '朝晖机械工程训练中心',
    color: 'rgba(255, 181, 44, 0.98)',
  },
  {
    id: 'tue-xi',
    dayIndex: 1,
    startPeriod: 10,
    duration: 3,
    title: '习近平新时代中国特...',
    location: '健 B102',
    color: 'rgba(246, 129, 139, 0.96)',
  },
  {
    id: 'wed-electronics',
    dayIndex: 2,
    startPeriod: 1,
    duration: 2,
    title: '电子技术基础 C',
    location: '广 B305',
    color: 'rgba(246, 129, 139, 0.96)',
  },
  {
    id: 'wed-mechanics',
    dayIndex: 2,
    startPeriod: 6,
    duration: 2,
    title: '机械原理',
    location: '博易 C103',
    color: 'rgba(246, 129, 139, 0.96)',
  },
  {
    id: 'wed-pe',
    dayIndex: 2,
    startPeriod: 8,
    duration: 2,
    title: '体育',
    location: '屏峰室外网球场',
    color: 'rgba(142, 155, 236, 0.96)',
  },
  {
    id: 'wed-discrete',
    dayIndex: 2,
    startPeriod: 10,
    duration: 2,
    title: '离散数学',
    location: '计 D305',
    color: 'rgba(73, 195, 198, 0.96)',
  },
  {
    id: 'thu-computer-org',
    dayIndex: 3,
    startPeriod: 3,
    duration: 2,
    title: '计算机组成原理',
    location: '计 C318',
    color: 'rgba(255, 181, 44, 0.98)',
  },
  {
    id: 'thu-electronics',
    dayIndex: 3,
    startPeriod: 6,
    duration: 2,
    title: '电子技术基础 C',
    location: '广 B305',
    color: 'rgba(246, 129, 139, 0.96)',
  },
  {
    id: 'thu-world-lit',
    dayIndex: 3,
    startPeriod: 8,
    duration: 2,
    title: '世界文学脉络中的西...',
    location: '广 A103',
    color: 'rgba(63, 211, 192, 0.95)',
  },
  {
    id: 'thu-materials',
    dayIndex: 3,
    startPeriod: 10,
    duration: 2,
    title: '工程材料',
    location: '广 B105',
    color: 'rgba(73, 195, 198, 0.96)',
  },
  {
    id: 'fri-discrete',
    dayIndex: 4,
    startPeriod: 3,
    duration: 2,
    title: '离散数学',
    location: '计 D305',
    color: 'rgba(75, 193, 196, 0.95)',
  },
  {
    id: 'fri-control',
    dayIndex: 4,
    startPeriod: 6,
    duration: 2,
    title: '自动控制理论',
    location: '广 B209',
    color: 'rgba(60, 196, 194, 0.96)',
  },
  {
    id: 'fri-marx',
    dayIndex: 4,
    startPeriod: 10,
    duration: 3,
    title: '马克思主义基本原理',
    location: '健 B106',
    color: 'rgba(124, 200, 246, 0.96)',
  },
];
const DEFAULT_DROP_SLOTS = [
  { dayIndex: 5, startPeriod: 2 },
  { dayIndex: 6, startPeriod: 2 },
  { dayIndex: 0, startPeriod: 10 },
  { dayIndex: 3, startPeriod: 10 },
  { dayIndex: 5, startPeriod: 6 },
  { dayIndex: 6, startPeriod: 7 },
  { dayIndex: 1, startPeriod: 5 },
  { dayIndex: 4, startPeriod: 8 },
  { dayIndex: 2, startPeriod: 3 },
] as const;
const TOTAL_WEEKS = 20;
const INITIAL_WEEK_INDEX = 8;
const HEADER_ROW_HEIGHT = 54;
const LEFT_RAIL_WIDTH = 52;
const ROW_HEIGHT = 56;
type DragTouchOffset = {
  x: number;
  y: number;
};

function getTaskDuration(task: WeeklyLearningTask) {
  return task.type === 'focused' ? 3 : 2;
}

function isCourseOccupied(dayIndex: number, period: number) {
  return COURSE_BLOCKS.some(
    (block) =>
      block.dayIndex === dayIndex &&
      period >= block.startPeriod &&
      period < block.startPeriod + block.duration,
  );
}

function isTaskOccupied(
  placements: WeeklyTaskPlacement[],
  dayIndex: number,
  period: number,
  ignoredTaskId?: string,
) {
  return placements.some(
    (placement) =>
      placement.taskId !== ignoredTaskId &&
      placement.dayIndex === dayIndex &&
      period >= placement.startPeriod &&
      period < placement.startPeriod + placement.duration,
  );
}

function canPlaceTask(
  placements: WeeklyTaskPlacement[],
  dayIndex: number,
  startPeriod: number,
  duration: number,
  ignoredTaskId?: string,
) {
  if (dayIndex < 0 || dayIndex > DAYS.length - 1) {
    return false;
  }

  if (startPeriod < 1 || startPeriod + duration - 1 > PERIODS.length) {
    return false;
  }

  return Array.from({ length: duration }, (_, offset) => startPeriod + offset).every((period) => {
    if (isCourseOccupied(dayIndex, period)) {
      return false;
    }

    if (isTaskOccupied(placements, dayIndex, period, ignoredTaskId)) {
      return false;
    }

    return true;
  });
}

function buildInitialPlacements(tasks: WeeklyLearningTask[]) {
  const scheduledTasks = tasks
    .filter((task) => task.scheduled)
    .sort((first, second) => second.importance - first.importance);
  const placements: WeeklyTaskPlacement[] = [];

  scheduledTasks.forEach((task) => {
    const duration = getTaskDuration(task);

    for (const slot of DEFAULT_DROP_SLOTS) {
      if (canPlaceTask(placements, slot.dayIndex, slot.startPeriod, duration, task.id)) {
        placements.push({
          taskId: task.id,
          dayIndex: slot.dayIndex,
          startPeriod: slot.startPeriod,
          duration,
        });
        break;
      }
    }
  });

  return placements;
}

function buildTaskRecommendation(task: WeeklyLearningTask, selectedPeriod: string) {
  return {
    phase: `建议排期：${selectedPeriod}`,
    duration: task.type === 'focused' ? '建议每周 3 节整块时间' : '建议每周 2 节滚动推进',
  };
}

function TaskDrawerCard({
  faded,
  onDetailPress,
  panelWidth,
  selectedPeriod,
  task,
  taskTypeLabel,
  taskTypeStyle,
  taskTypeTextStyle,
  ...rest
}: {
  faded?: boolean;
  onDetailPress: () => void;
  panelWidth: number;
  selectedPeriod: string;
  task: WeeklyLearningTask;
  taskTypeLabel: string;
  taskTypeStyle: object;
  taskTypeTextStyle: object;
}) {
  const recommendation = buildTaskRecommendation(task, selectedPeriod);

  return (
    <View
      {...rest}
      style={[
        styles.drawerTaskCard,
        {
          width: panelWidth,
        },
        faded && styles.drawerTaskCardFaded,
      ]}
    >
      <View style={styles.drawerTaskMain}>
        <Text numberOfLines={1} style={styles.drawerTaskTitle}>
          {task.title}
        </Text>

        <View style={[styles.drawerTaskTypeBadge, taskTypeStyle]}>
          <Text style={[styles.drawerTaskTypeText, taskTypeTextStyle]}>{taskTypeLabel}</Text>
        </View>
      </View>

      <View style={styles.drawerTaskMeta}>
        <Text style={styles.drawerTaskMetaText}>{recommendation.phase}</Text>
        <Text style={styles.drawerTaskMetaText}>{recommendation.duration}</Text>
      </View>

      <Pressable hitSlop={8} onPress={onDetailPress} style={styles.drawerTaskLinkWrap}>
        <Text style={styles.drawerTaskLinkText}>查看详情</Text>
      </Pressable>
    </View>
  );
}

export default function WeeklySchedulePage({
  onBack,
  onImportSchedule,
  onPlacementsChange,
  onTaskPress,
  importedScheduleName,
  learningPlan,
  placements,
  planJob,
  selectedPeriod,
  storageKey,
}: WeeklySchedulePageProps) {
  const insets = useSafeAreaInsets();
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  const contentWidth = Math.min(screenWidth - 16, 470);
  const columnWidth = (contentWidth - LEFT_RAIL_WIDTH) / DAYS.length;
  const gridHeight = HEADER_ROW_HEIGHT + PERIODS.length * ROW_HEIGHT;
  const editPanelHeight = Math.min(Math.max(screenHeight * 0.31, 252), 324);
  const drawerCardWidth = contentWidth - 32;
  const dragPosition = useRef(new Animated.ValueXY({ x: 0, y: 0 })).current;
  const gridRef = useRef<View | null>(null);
  const gridFrameRef = useRef<GridFrame | null>(null);
  const dragTouchOffsetRef = useRef<DragTouchOffset>({ x: 28, y: 26 });
  const hoverPlacementRef = useRef<WeeklyTaskPlacement | null>(null);
  const [currentWeekIndex, setCurrentWeekIndex] = useState(INITIAL_WEEK_INDEX);
  const [isEditing, setIsEditing] = useState(false);
  const [draggingTaskId, setDraggingTaskId] = useState<string | null>(null);
  const [hoverPlacement, setHoverPlacement] = useState<WeeklyTaskPlacement | null>(null);
  const [taskPlacements, setTaskPlacements] = useState<WeeklyTaskPlacement[]>(
    placements ?? buildInitialPlacements(learningPlan.tasks),
  );

  useEffect(() => {
    setTaskPlacements(placements ?? buildInitialPlacements(learningPlan.tasks));
  }, [placements, storageKey, learningPlan.tasks]);

  const taskMap = useMemo(
    () => Object.fromEntries(learningPlan.tasks.map((task) => [task.id, task])),
    [learningPlan.tasks],
  );
  const unplacedTasks = useMemo(
    () =>
      learningPlan.tasks
        .filter((task) => !taskPlacements.some((placement) => placement.taskId === task.id))
        .filter((task) => task.completion !== 'done')
        .sort((first, second) => second.importance - first.importance),
    [learningPlan.tasks, taskPlacements],
  );
  const placedTaskViews = useMemo(
    () =>
      taskPlacements
        .map((placement) => {
          const task = taskMap[placement.taskId];

          if (!task) {
            return null;
          }

          return {
            placement,
            task,
          };
        })
        .filter((item): item is { placement: WeeklyTaskPlacement; task: WeeklyLearningTask } => item !== null),
    [taskMap, taskPlacements],
  );

  const updatePlacements = (nextPlacements: WeeklyTaskPlacement[]) => {
    setTaskPlacements(nextPlacements);
    onPlacementsChange?.(nextPlacements);
  };

  const measureGridFrame = () => {
    requestAnimationFrame(() => {
      gridRef.current?.measure((_x, _y, width, height, pageX, pageY) => {
        gridFrameRef.current = { x: pageX, y: pageY, width, height };
      });
    });
  };

  useEffect(() => {
    measureGridFrame();
  }, [contentWidth, gridHeight, isEditing, taskPlacements.length]);

  const resolveDropPlacement = (pageX: number, pageY: number, task: WeeklyLearningTask) => {
    const gridFrame = gridFrameRef.current;

    if (!gridFrame) {
      return null;
    }

    const relativeX = pageX - gridFrame.x;
    const relativeY = pageY - gridFrame.y;

    if (
      relativeX < LEFT_RAIL_WIDTH ||
      relativeY < HEADER_ROW_HEIGHT ||
      relativeX > gridFrame.width ||
      relativeY > gridFrame.height
    ) {
      return null;
    }

    const dayIndex = Math.floor((relativeX - LEFT_RAIL_WIDTH) / columnWidth);
    const startPeriod = Math.floor((relativeY - HEADER_ROW_HEIGHT) / ROW_HEIGHT) + 1;
    const duration = getTaskDuration(task);

    if (!canPlaceTask(taskPlacements, dayIndex, startPeriod, duration, task.id)) {
      return null;
    }

    return {
      taskId: task.id,
      dayIndex,
      startPeriod,
      duration,
    };
  };

  const syncHoverPlacement = (nextPlacement: WeeklyTaskPlacement | null) => {
    hoverPlacementRef.current = nextPlacement;
    setHoverPlacement(nextPlacement);
  };

  const buildTaskPanResponder = (task: WeeklyLearningTask) =>
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_, gestureState) =>
        Math.abs(gestureState.dx) > 3 || Math.abs(gestureState.dy) > 3,
      onPanResponderGrant: (event) => {
        measureGridFrame();
        setDraggingTaskId(task.id);
        dragTouchOffsetRef.current = {
          x: event.nativeEvent.locationX || 28,
          y: event.nativeEvent.locationY || 26,
        };
        dragPosition.setValue({
          x: event.nativeEvent.pageX - dragTouchOffsetRef.current.x,
          y: event.nativeEvent.pageY - dragTouchOffsetRef.current.y,
        });
        syncHoverPlacement(null);
      },
      onPanResponderMove: (event, gestureState) => {
        const pageX = event.nativeEvent.pageX || gestureState.moveX;
        const pageY = event.nativeEvent.pageY || gestureState.moveY;

        dragPosition.setValue({
          x: pageX - dragTouchOffsetRef.current.x,
          y: pageY - dragTouchOffsetRef.current.y,
        });

        const nextPlacement = resolveDropPlacement(pageX, pageY, task);

        syncHoverPlacement(nextPlacement);
      },
      onPanResponderRelease: (event, gestureState) => {
        const pageX = event.nativeEvent.pageX || gestureState.moveX;
        const pageY = event.nativeEvent.pageY || gestureState.moveY;
        const nextPlacement = hoverPlacementRef.current ?? resolveDropPlacement(pageX, pageY, task);

        if (nextPlacement) {
          updatePlacements([
            ...taskPlacements.filter((placement) => placement.taskId !== task.id),
            nextPlacement,
          ]);
        }

        setDraggingTaskId(null);
        syncHoverPlacement(null);
      },
      onPanResponderTerminate: () => {
        setDraggingTaskId(null);
        syncHoverPlacement(null);
      },
      onPanResponderTerminationRequest: () => false,
    });

  const getBlockFrame = (dayIndex: number, startPeriod: number, duration: number) => ({
    left: LEFT_RAIL_WIDTH + dayIndex * columnWidth + 4,
    top: HEADER_ROW_HEIGHT + (startPeriod - 1) * ROW_HEIGHT + 4,
    width: columnWidth - 8,
    height: duration * ROW_HEIGHT - 8,
  });

  return (
    <View style={styles.screen}>
      <LinearGradient
        colors={['rgba(191, 239, 231, 0.95)', 'rgba(245, 236, 221, 0.92)', 'rgba(251, 248, 245, 1)']}
        end={{ x: 0.9, y: 1 }}
        start={{ x: 0, y: 0 }}
        style={styles.screen}
      >
        <View pointerEvents="none" style={[styles.backgroundGlow, styles.backgroundGlowPrimary]} />
        <View pointerEvents="none" style={[styles.backgroundGlow, styles.backgroundGlowSecondary]} />

        <View style={[styles.headerWrap, { paddingTop: insets.top + 12, width: contentWidth }]}>
          <Pressable hitSlop={10} onPress={onBack} style={styles.headerRoundButton}>
            <MaterialIcons color="rgba(116, 121, 127, 1)" name="arrow-back-ios-new" size={24} />
          </Pressable>

          <View style={styles.headerTitleWrap}>
            <Text style={styles.pageTitle}>周表</Text>
            <Text numberOfLines={1} style={styles.pageSubtitle}>
              {`${planJob.headerLabel} · ${selectedPeriod}`}
            </Text>
          </View>

          <Pressable
            onPress={() => {
              setIsEditing((current) => !current);
              setHoverPlacement(null);
            }}
            style={styles.editButton}
          >
            <Text style={styles.editButtonText}>{isEditing ? '完成' : '编辑'}</Text>
          </Pressable>
        </View>

        <View style={[styles.importLinkRow, { width: contentWidth }]}>
          <Pressable
            hitSlop={8}
            onPress={() => {
              void onImportSchedule?.();
            }}
          >
            <Text style={styles.importLinkText}>点击导入新课表并重新生成计划</Text>
          </Pressable>

          <Text numberOfLines={1} style={styles.importedScheduleText}>
            {importedScheduleName || '本学期课表'}
          </Text>
        </View>

        <ScrollView
          contentContainerStyle={{
            paddingBottom: isEditing ? editPanelHeight + 24 : insets.bottom + 120,
          }}
          onMomentumScrollEnd={measureGridFrame}
          onScrollEndDrag={measureGridFrame}
          scrollEventThrottle={16}
          showsVerticalScrollIndicator={false}
        >
          <View style={[styles.contentCard, { width: contentWidth }]}>
            <View
              onLayout={measureGridFrame}
              ref={gridRef}
              style={[
                styles.gridWrap,
                {
                  height: gridHeight,
                },
              ]}
            >
              <View style={[styles.cornerHeaderCell, { width: LEFT_RAIL_WIDTH, height: HEADER_ROW_HEIGHT }]}>
                <Text style={styles.cornerHeaderTopText}>第</Text>
                <Text style={styles.cornerHeaderBottomText}>{`${currentWeekIndex + 1}\n周`}</Text>
              </View>

              {DAYS.map((day, index) => (
                <View
                  key={day}
                  style={[
                    styles.dayHeaderCell,
                    {
                      left: LEFT_RAIL_WIDTH + index * columnWidth,
                      width: columnWidth,
                      height: HEADER_ROW_HEIGHT,
                    },
                  ]}
                >
                  <Text style={styles.dayHeaderText}>{day}</Text>
                  <Text style={styles.dayHeaderSubText}>{index < 5 ? '课程/任务' : '弹性安排'}</Text>
                </View>
              ))}

              {PERIODS.map((period, rowIndex) => (
                <View
                  key={`row-${period.index}`}
                  style={[
                    styles.periodRailCell,
                    {
                      top: HEADER_ROW_HEIGHT + rowIndex * ROW_HEIGHT,
                      width: LEFT_RAIL_WIDTH,
                      height: ROW_HEIGHT,
                    },
                  ]}
                >
                  <Text style={styles.periodIndexText}>{period.index}</Text>
                  <Text style={styles.periodTimeText}>{`${period.start}\n${period.end}`}</Text>
                </View>
              ))}

              {Array.from({ length: DAYS.length * PERIODS.length }, (_, cellIndex) => {
                const dayIndex = cellIndex % DAYS.length;
                const rowIndex = Math.floor(cellIndex / DAYS.length);

                return (
                  <View
                    key={`grid-${dayIndex}-${rowIndex}`}
                    style={[
                      styles.gridCell,
                      {
                        left: LEFT_RAIL_WIDTH + dayIndex * columnWidth,
                        top: HEADER_ROW_HEIGHT + rowIndex * ROW_HEIGHT,
                        width: columnWidth,
                        height: ROW_HEIGHT,
                      },
                    ]}
                  />
                );
              })}

              {hoverPlacement ? (
                <View
                  pointerEvents="none"
                  style={[
                    styles.dropPreviewBlock,
                    getBlockFrame(hoverPlacement.dayIndex, hoverPlacement.startPeriod, hoverPlacement.duration),
                  ]}
                />
              ) : null}

              {COURSE_BLOCKS.map((course) => (
                <View
                  key={course.id}
                  style={[
                    styles.courseBlock,
                    getBlockFrame(course.dayIndex, course.startPeriod, course.duration),
                    {
                      backgroundColor: course.color,
                    },
                  ]}
                >
                  <Text numberOfLines={2} style={styles.courseLocationText}>
                    {course.location}
                  </Text>
                  <Text numberOfLines={3} style={styles.courseTitleText}>
                    {course.title}
                  </Text>
                </View>
              ))}

              {placedTaskViews.map(({ placement, task }) => {
                const isFocusedTask = task.type === 'focused';

                return (
                  <Pressable
                    key={task.id}
                    onPress={() => onTaskPress?.(task.id)}
                    style={[
                      styles.learningTaskBlock,
                      getBlockFrame(placement.dayIndex, placement.startPeriod, placement.duration),
                      isFocusedTask ? styles.learningTaskBlockFocused : styles.learningTaskBlockAccumulate,
                    ]}
                  >
                    {isEditing ? (
                      <Pressable
                        hitSlop={6}
                        onPress={() => {
                          updatePlacements(taskPlacements.filter((item) => item.taskId !== task.id));
                        }}
                        style={styles.taskRemoveButton}
                      >
                        <MaterialIcons color="rgba(255, 255, 255, 0.94)" name="close" size={14} />
                      </Pressable>
                    ) : null}

                    <Text numberOfLines={2} style={styles.learningTaskTitle}>
                      {task.title}
                    </Text>
                    <Text numberOfLines={2} style={styles.learningTaskMeta}>
                      {task.type === 'focused' ? '整块推进' : '滚动积累'}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            <View style={styles.scheduleSummaryCard}>
              <Text style={styles.scheduleSummaryTitle}>排课说明</Text>
              <Text style={styles.scheduleSummaryBody}>
                已按你当前课表和 {planJob.headerLabel} 学习计划生成周表。周六周日与晚间空档优先用于安排学习任务，编辑态下可继续拖动调整。
              </Text>
            </View>
          </View>
        </ScrollView>

        {!isEditing ? (
          <View
            style={[
              styles.bottomWeekBar,
              {
                paddingBottom: Math.max(insets.bottom, 12),
                width: contentWidth,
              },
            ]}
          >
            <Pressable
              disabled={currentWeekIndex === 0}
              onPress={() => setCurrentWeekIndex((current) => Math.max(current - 1, 0))}
              style={[styles.bottomCircleButton, currentWeekIndex === 0 && styles.bottomCircleButtonDisabled]}
            >
              <MaterialIcons color="rgba(118, 125, 131, 1)" name="arrow-back-ios-new" size={24} />
            </Pressable>

            <View style={styles.weekLabelPill}>
              <Text style={styles.weekLabelText}>{`第 ${currentWeekIndex + 1} 周`}</Text>
            </View>

            <Pressable
              disabled={currentWeekIndex === TOTAL_WEEKS - 1}
              onPress={() => setCurrentWeekIndex((current) => Math.min(current + 1, TOTAL_WEEKS - 1))}
              style={[
                styles.bottomCircleButton,
                currentWeekIndex === TOTAL_WEEKS - 1 && styles.bottomCircleButtonDisabled,
              ]}
            >
              <MaterialIcons color="rgba(118, 125, 131, 1)" name="arrow-forward-ios" size={24} />
            </Pressable>
          </View>
        ) : null}

        {isEditing ? (
          <View
            style={[
              styles.editDrawer,
              {
                height: editPanelHeight,
                paddingBottom: Math.max(insets.bottom, 14),
              },
            ]}
          >
            <View style={styles.editDrawerHandle} />
            <Text style={styles.editDrawerTitle}>拖动学习任务卡放入课表空余处</Text>
            <Text style={styles.editDrawerHint}>已放入的任务可点击右上角关闭按钮移出课表，再重新拖动。</Text>

            <View style={styles.drawerTaskList}>
              {unplacedTasks.length > 0 ? (
                unplacedTasks.map((task) => {
                  const isFocusedTask = task.type === 'focused';
                  const panResponder = buildTaskPanResponder(task);

                  return (
                    <TaskDrawerCard
                      key={task.id}
                      faded={draggingTaskId === task.id}
                      onDetailPress={() => onTaskPress?.(task.id)}
                      panelWidth={drawerCardWidth}
                      selectedPeriod={selectedPeriod}
                      task={task}
                      taskTypeLabel={isFocusedTask ? '整时型' : '积累型'}
                      taskTypeStyle={isFocusedTask ? styles.taskTypeBadgeFocused : styles.taskTypeBadgeAccumulate}
                      taskTypeTextStyle={isFocusedTask ? styles.taskTypeTextFocused : styles.taskTypeTextAccumulate}
                      {...panResponder.panHandlers}
                    />
                  );
                })
              ) : (
                <View style={[styles.emptyDrawerCard, { width: drawerCardWidth }]}>
                  <Text style={styles.emptyDrawerTitle}>当前任务都已经排入周表</Text>
                  <Text style={styles.emptyDrawerBody}>如果需要重新安排，可以先点击课表上的任务右上角关闭按钮把它移出来。</Text>
                </View>
              )}
            </View>
          </View>
        ) : null}

        {draggingTaskId ? (
          <Animated.View
            pointerEvents="none"
            style={[
              styles.dragGhost,
              {
                width: drawerCardWidth,
                transform: dragPosition.getTranslateTransform(),
              },
            ]}
          >
            <TaskDrawerCard
              onDetailPress={() => undefined}
              panelWidth={drawerCardWidth}
              selectedPeriod={selectedPeriod}
              task={taskMap[draggingTaskId]}
              taskTypeLabel={taskMap[draggingTaskId].type === 'focused' ? '整时型' : '积累型'}
              taskTypeStyle={
                taskMap[draggingTaskId].type === 'focused'
                  ? styles.taskTypeBadgeFocused
                  : styles.taskTypeBadgeAccumulate
              }
              taskTypeTextStyle={
                taskMap[draggingTaskId].type === 'focused'
                  ? styles.taskTypeTextFocused
                  : styles.taskTypeTextAccumulate
              }
            />
          </Animated.View>
        ) : null}
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: 'rgba(245, 248, 246, 1)',
  },
  backgroundGlow: {
    position: 'absolute',
    borderRadius: 999,
    opacity: 0.55,
  },
  backgroundGlowPrimary: {
    width: 260,
    height: 260,
    top: 86,
    right: -80,
    backgroundColor: 'rgba(110, 228, 214, 0.22)',
  },
  backgroundGlowSecondary: {
    width: 220,
    height: 220,
    left: -72,
    top: 380,
    backgroundColor: 'rgba(255, 188, 203, 0.16)',
  },
  headerWrap: {
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerRoundButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    borderWidth: 1.5,
    borderColor: 'rgba(138, 143, 148, 0.9)',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.42)',
  },
  headerTitleWrap: {
    flex: 1,
    paddingLeft: 12,
  },
  pageTitle: {
    fontSize: 30,
    lineHeight: 36,
    fontWeight: '800',
    color: 'rgba(12, 17, 19, 1)',
  },
  pageSubtitle: {
    marginTop: 2,
    fontSize: 13,
    lineHeight: 18,
    color: 'rgba(88, 98, 104, 1)',
  },
  editButton: {
    minWidth: 86,
    height: 42,
    borderRadius: 6,
    backgroundColor: 'rgba(54, 153, 240, 1)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: 'rgba(34, 122, 205, 0.28)',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 1,
    shadowRadius: 16,
    elevation: 8,
  },
  editButtonText: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '700',
    color: 'rgba(255, 255, 255, 1)',
  },
  importLinkRow: {
    alignSelf: 'center',
    marginTop: 8,
  },
  importLinkText: {
    fontSize: 14,
    lineHeight: 20,
    color: 'rgba(44, 130, 230, 1)',
    textDecorationLine: 'underline',
    marginBottom: 4,
  },
  importedScheduleText: {
    fontSize: 12,
    lineHeight: 16,
    color: 'rgba(104, 111, 118, 1)',
  },
  contentCard: {
    alignSelf: 'center',
    marginTop: 12,
    marginBottom: 18,
    borderRadius: 20,
    padding: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.52)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(232, 228, 224, 1)',
  },
  gridWrap: {
    position: 'relative',
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: 'rgba(250, 247, 250, 0.96)',
  },
  cornerHeaderCell: {
    position: 'absolute',
    left: 0,
    top: 0,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(245, 242, 244, 1)',
    borderRightWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(226, 222, 223, 1)',
  },
  cornerHeaderTopText: {
    fontSize: 11,
    lineHeight: 14,
    color: 'rgba(124, 130, 137, 1)',
    fontWeight: '700',
  },
  cornerHeaderBottomText: {
    marginTop: 2,
    fontSize: 13,
    lineHeight: 16,
    fontWeight: '800',
    textAlign: 'center',
    color: 'rgba(104, 112, 118, 1)',
  },
  dayHeaderCell: {
    position: 'absolute',
    top: 0,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(249, 246, 249, 1)',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderRightWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(226, 222, 223, 1)',
  },
  dayHeaderText: {
    fontSize: 15,
    lineHeight: 20,
    fontWeight: '800',
    color: 'rgba(85, 94, 101, 1)',
  },
  dayHeaderSubText: {
    marginTop: 2,
    fontSize: 10,
    lineHeight: 12,
    color: 'rgba(136, 143, 149, 1)',
  },
  periodRailCell: {
    position: 'absolute',
    left: 0,
    paddingTop: 6,
    paddingHorizontal: 3,
    backgroundColor: 'rgba(249, 246, 249, 1)',
    borderRightWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(226, 222, 223, 1)',
    alignItems: 'center',
  },
  periodIndexText: {
    fontSize: 13,
    lineHeight: 16,
    fontWeight: '800',
    color: 'rgba(96, 104, 111, 1)',
  },
  periodTimeText: {
    marginTop: 4,
    fontSize: 9,
    lineHeight: 11,
    textAlign: 'center',
    color: 'rgba(142, 149, 156, 1)',
  },
  gridCell: {
    position: 'absolute',
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
    borderRightWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(226, 222, 223, 1)',
  },
  courseBlock: {
    position: 'absolute',
    borderRadius: 10,
    paddingHorizontal: 7,
    paddingVertical: 8,
    shadowColor: 'rgba(50, 67, 79, 0.18)',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 1,
    shadowRadius: 14,
    elevation: 7,
  },
  courseLocationText: {
    fontSize: 10,
    lineHeight: 13,
    fontWeight: '800',
    color: 'rgba(255, 255, 255, 0.96)',
    marginBottom: 4,
  },
  courseTitleText: {
    fontSize: 11,
    lineHeight: 14,
    fontWeight: '700',
    color: 'rgba(255, 255, 255, 0.96)',
  },
  learningTaskBlock: {
    position: 'absolute',
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 8,
    justifyContent: 'center',
    borderWidth: 1,
    shadowColor: 'rgba(33, 80, 98, 0.2)',
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 1,
    shadowRadius: 16,
    elevation: 8,
  },
  learningTaskBlockAccumulate: {
    backgroundColor: 'rgba(87, 144, 130, 0.95)',
    borderColor: 'rgba(119, 179, 164, 1)',
  },
  learningTaskBlockFocused: {
    backgroundColor: 'rgba(105, 132, 191, 0.95)',
    borderColor: 'rgba(134, 160, 221, 1)',
  },
  taskRemoveButton: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(27, 31, 36, 0.32)',
  },
  learningTaskTitle: {
    fontSize: 11,
    lineHeight: 14,
    fontWeight: '800',
    color: 'rgba(255, 255, 255, 1)',
  },
  learningTaskMeta: {
    marginTop: 4,
    fontSize: 10,
    lineHeight: 13,
    color: 'rgba(237, 245, 249, 0.94)',
  },
  dropPreviewBlock: {
    position: 'absolute',
    borderRadius: 10,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: 'rgba(67, 164, 255, 1)',
    backgroundColor: 'rgba(67, 164, 255, 0.14)',
  },
  scheduleSummaryCard: {
    marginTop: 10,
    paddingHorizontal: 14,
    paddingVertical: 13,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.78)',
  },
  scheduleSummaryTitle: {
    fontSize: 15,
    lineHeight: 20,
    fontWeight: '800',
    color: 'rgba(39, 45, 50, 1)',
    marginBottom: 5,
  },
  scheduleSummaryBody: {
    fontSize: 13,
    lineHeight: 20,
    color: 'rgba(92, 99, 106, 1)',
  },
  bottomWeekBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  bottomCircleButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderWidth: 1.5,
    borderColor: 'rgba(145, 150, 154, 0.82)',
  },
  bottomCircleButtonDisabled: {
    opacity: 0.45,
  },
  weekLabelPill: {
    flex: 1,
    marginHorizontal: 18,
    height: 46,
    borderRadius: 8,
    backgroundColor: 'rgba(122, 163, 151, 0.96)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  weekLabelText: {
    fontSize: 16,
    lineHeight: 22,
    fontWeight: '800',
    color: 'rgba(255, 255, 255, 1)',
  },
  editDrawer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.96)',
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    paddingTop: 10,
    paddingHorizontal: 14,
    shadowColor: 'rgba(20, 38, 49, 0.16)',
    shadowOffset: {
      width: 0,
      height: -8,
    },
    shadowOpacity: 1,
    shadowRadius: 18,
    elevation: 18,
  },
  editDrawerHandle: {
    alignSelf: 'center',
    width: 48,
    height: 5,
    borderRadius: 999,
    backgroundColor: 'rgba(217, 221, 225, 1)',
    marginBottom: 10,
  },
  editDrawerTitle: {
    fontSize: 15,
    lineHeight: 21,
    fontWeight: '800',
    color: 'rgba(56, 63, 69, 1)',
  },
  editDrawerHint: {
    marginTop: 4,
    fontSize: 12,
    lineHeight: 18,
    color: 'rgba(121, 129, 136, 1)',
  },
  drawerTaskList: {
    marginTop: 14,
  },
  drawerTaskCard: {
    minHeight: 74,
    borderRadius: 14,
    backgroundColor: 'rgba(245, 245, 244, 1)',
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    alignSelf: 'center',
  },
  drawerTaskCardFaded: {
    opacity: 0.3,
  },
  drawerTaskMain: {
    width: 102,
    paddingRight: 10,
  },
  drawerTaskTitle: {
    fontSize: 16,
    lineHeight: 22,
    fontWeight: '800',
    color: 'rgba(52, 58, 65, 1)',
  },
  drawerTaskTypeBadge: {
    alignSelf: 'flex-start',
    marginTop: 7,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
  },
  taskTypeBadgeAccumulate: {
    backgroundColor: 'rgba(224, 243, 237, 1)',
  },
  taskTypeBadgeFocused: {
    backgroundColor: 'rgba(231, 236, 255, 1)',
  },
  drawerTaskTypeText: {
    fontSize: 11,
    lineHeight: 14,
    fontWeight: '700',
  },
  taskTypeTextAccumulate: {
    color: 'rgba(40, 126, 103, 1)',
  },
  taskTypeTextFocused: {
    color: 'rgba(83, 104, 181, 1)',
  },
  drawerTaskMeta: {
    flex: 1,
    justifyContent: 'center',
    paddingRight: 10,
  },
  drawerTaskMetaText: {
    fontSize: 13,
    lineHeight: 18,
    color: 'rgba(144, 138, 132, 1)',
  },
  drawerTaskLinkWrap: {
    paddingVertical: 8,
    paddingLeft: 8,
  },
  drawerTaskLinkText: {
    fontSize: 15,
    lineHeight: 20,
    fontWeight: '700',
    color: 'rgba(44, 130, 230, 1)',
  },
  emptyDrawerCard: {
    alignSelf: 'center',
    borderRadius: 14,
    backgroundColor: 'rgba(245, 245, 244, 1)',
    paddingHorizontal: 16,
    paddingVertical: 18,
  },
  emptyDrawerTitle: {
    fontSize: 15,
    lineHeight: 20,
    fontWeight: '800',
    color: 'rgba(53, 60, 66, 1)',
    marginBottom: 6,
  },
  emptyDrawerBody: {
    fontSize: 13,
    lineHeight: 19,
    color: 'rgba(117, 124, 130, 1)',
  },
  dragGhost: {
    position: 'absolute',
    left: 0,
    top: 0,
    zIndex: 120,
    elevation: 120,
  },
  detailModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(14, 21, 29, 0.28)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  detailModalCard: {
    width: '100%',
    maxWidth: 360,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 1)',
    paddingHorizontal: 18,
    paddingVertical: 18,
  },
  detailModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailModalTitle: {
    flex: 1,
    fontSize: 20,
    lineHeight: 26,
    fontWeight: '800',
    color: 'rgba(28, 34, 40, 1)',
    paddingRight: 10,
  },
  detailModalCloseButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(243, 245, 247, 1)',
  },
  detailModalTypeText: {
    marginTop: 10,
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '700',
    color: 'rgba(104, 112, 119, 1)',
  },
  detailModalBody: {
    marginTop: 8,
    fontSize: 14,
    lineHeight: 22,
    color: 'rgba(76, 84, 91, 1)',
  },
  detailDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: 'rgba(226, 231, 235, 1)',
    marginVertical: 14,
  },
  detailSectionTitle: {
    fontSize: 15,
    lineHeight: 20,
    fontWeight: '800',
    color: 'rgba(36, 42, 49, 1)',
    marginBottom: 8,
  },
  detailBulletText: {
    fontSize: 14,
    lineHeight: 22,
    color: 'rgba(79, 87, 94, 1)',
    marginBottom: 4,
  },
});
