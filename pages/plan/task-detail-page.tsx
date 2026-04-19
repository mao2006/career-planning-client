import { useMemo, useState } from 'react';
import {
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  useWindowDimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export type TaskFrequencyMode = '每日' | '每周';
export type DetailTaskType = 'accumulate' | 'focused';

export type TaskDetailTask = {
  completion: 'done' | 'todo';
  deliverables: string[];
  detail: string;
  hoursPerCycle?: number;
  id: string;
  importance: number;
  progress?: number;
  replacementOriginTitle?: string;
  timeEnd: string;
  timeStart: string;
  title: string;
  type: DetailTaskType;
  frequency?: TaskFrequencyMode;
};

export type TaskAlternativeCandidate = {
  deliverables: string[];
  detail: string;
  hoursPerCycle?: number;
  id: string;
  importance: number;
  reason: string;
  timeEnd: string;
  timeStart: string;
  title: string;
  type: DetailTaskType;
  frequency?: TaskFrequencyMode;
};

type TimingPayload = {
  hoursPerCycle?: number;
  timeEnd: string;
  timeStart: string;
  frequency?: TaskFrequencyMode;
};

type TaskDetailPageProps = {
  alternatives: TaskAlternativeCandidate[];
  onBack?: () => void;
  onOpenAlternativeDetail: (alternativeId: string) => void;
  onRefreshAlternatives: () => void;
  onUpdateFocusedCompletion: (completion: 'done' | 'todo') => void;
  onUpdateProgress: (progress: number) => void;
  onUpdateTiming: (payload: TimingPayload) => void;
  task: TaskDetailTask;
  timeOptions: string[];
};

type AlternativeTaskDetailPageProps = {
  alternative: TaskAlternativeCandidate;
  onBack?: () => void;
  onReplace: (payload: TimingPayload) => void;
  timeOptions: string[];
};

function ImportanceStars({ value }: { value: number }) {
  return (
    <View style={styles.starRow}>
      {Array.from({ length: 5 }, (_, index) => {
        const filledThreshold = index + 1;
        const halfThreshold = index + 0.5;
        let name: keyof typeof Ionicons.glyphMap = 'star-outline';

        if (value >= filledThreshold) {
          name = 'star';
        } else if (value >= halfThreshold) {
          name = 'star-half';
        }

        return (
          <Ionicons
            color={name === 'star-outline' ? 'rgba(162, 168, 175, 1)' : 'rgba(24, 121, 75, 1)'}
            key={`detail-star-${index}`}
            name={name}
            size={24}
            style={styles.starIcon}
          />
        );
      })}
    </View>
  );
}

function buildFocusedSummary(task: TaskDetailTask) {
  const durationLead = `${task.timeStart}-${task.timeEnd}`;
  const valueLead =
    task.importance >= 4
      ? '对当前求职方向影响较大，优先级较高，建议尽量在本阶段形成可展示成果。'
      : '更偏向补齐当前阶段的短板，适合作为重点推进任务之一。';

  return [
    `价值：${valueLead}`,
    `预估时间：${durationLead}`,
    '核心建议：',
    task.detail,
    '建议产出：',
    `必须产出：${task.deliverables.join('、')}`,
  ];
}

function buildAccumulateSummary(task: TaskDetailTask) {
  const frequencyLead = `${task.frequency ?? '每周'} ${task.hoursPerCycle ?? 3} 小时`;
  const valueLead =
    (task.progress ?? 0) >= 60
      ? '当前已经进入稳定积累阶段，继续保持节奏会更容易形成可见成果。'
      : '属于需要持续投入的长期任务，越早固定节奏越容易坚持。';

  return [
    `价值：${valueLead}`,
    `预估时间：${task.timeStart}-${task.timeEnd} ${frequencyLead}`,
    '核心建议：',
    task.detail,
    '建议产出：',
    `滚动沉淀：${task.deliverables.join('、')}`,
  ];
}

function buildAlternativeSummary(alternative: TaskAlternativeCandidate) {
  const timingLabel =
    alternative.type === 'accumulate'
      ? `${alternative.timeStart}-${alternative.timeEnd} ${alternative.frequency ?? '每周'} ${alternative.hoursPerCycle ?? 3} 小时`
      : `${alternative.timeStart}-${alternative.timeEnd}`;

  return [
    `推荐原因：${alternative.reason}`,
    `价值：该替代任务可作为同阶段的等价证明方式，适合当前任务推进受阻或资源不匹配时切换。`,
    `预估排期：${timingLabel}`,
    '核心建议：',
    alternative.detail,
    '建议产出：',
    `${alternative.deliverables.join('、')}`,
  ];
}

function getRangeMonthCount(options: string[], start: string, end: string) {
  const startIndex = options.indexOf(start);
  const endIndex = options.indexOf(end);

  if (startIndex === -1 || endIndex === -1 || endIndex < startIndex) {
    return null;
  }

  return endIndex - startIndex + 1;
}

function TimingEditorModal({
  onClose,
  onConfirm,
  taskType,
  timeOptions,
  visible,
  initialFrequency,
  initialHoursPerCycle,
  initialTimeEnd,
  initialTimeStart,
}: {
  initialFrequency?: TaskFrequencyMode;
  initialHoursPerCycle?: number;
  initialTimeEnd: string;
  initialTimeStart: string;
  onClose: () => void;
  onConfirm: (payload: TimingPayload) => void;
  taskType: DetailTaskType;
  timeOptions: string[];
  visible: boolean;
}) {
  const [draftStart, setDraftStart] = useState(initialTimeStart);
  const [draftEnd, setDraftEnd] = useState(initialTimeEnd);
  const [draftFrequency, setDraftFrequency] = useState<TaskFrequencyMode>(initialFrequency ?? '每周');
  const [draftHours, setDraftHours] = useState(initialHoursPerCycle ?? 3);

  const monthCount = useMemo(
    () => getRangeMonthCount(timeOptions, draftStart, draftEnd),
    [draftEnd, draftStart, timeOptions],
  );

  return (
    <Modal animationType="slide" onRequestClose={onClose} transparent visible={visible}>
      <View style={styles.sheetOverlay}>
        <Pressable onPress={onClose} style={StyleSheet.absoluteFill} />

        <View style={styles.sheetCard}>
          <View style={styles.sheetHeader}>
            <Text style={styles.sheetTitle}>调整预估时间</Text>

            <Pressable onPress={onClose} style={styles.sheetCloseButton}>
              <MaterialIcons color="rgba(101, 109, 116, 1)" name="close" size={20} />
            </Pressable>
          </View>

          <Text style={styles.sheetLabel}>开始时间</Text>
          <View style={styles.chipWrap}>
            {timeOptions.map((option) => (
              <Pressable
                key={`start-${option}`}
                onPress={() => setDraftStart(option)}
                style={[styles.optionChip, draftStart === option && styles.optionChipActive]}
              >
                <Text style={[styles.optionChipText, draftStart === option && styles.optionChipTextActive]}>{option}</Text>
              </Pressable>
            ))}
          </View>

          <Text style={styles.sheetLabel}>结束时间</Text>
          <View style={styles.chipWrap}>
            {timeOptions.map((option) => (
              <Pressable
                key={`end-${option}`}
                onPress={() => setDraftEnd(option)}
                style={[styles.optionChip, draftEnd === option && styles.optionChipActive]}
              >
                <Text style={[styles.optionChipText, draftEnd === option && styles.optionChipTextActive]}>{option}</Text>
              </Pressable>
            ))}
          </View>

          {taskType === 'accumulate' ? (
            <>
              <Text style={styles.sheetLabel}>频率</Text>
              <View style={styles.chipWrap}>
                {(['每日', '每周'] as const).map((option) => (
                  <Pressable
                    key={option}
                    onPress={() => setDraftFrequency(option)}
                    style={[styles.optionChip, draftFrequency === option && styles.optionChipActive]}
                  >
                    <Text style={[styles.optionChipText, draftFrequency === option && styles.optionChipTextActive]}>{option}</Text>
                  </Pressable>
                ))}
              </View>

              <Text style={styles.sheetLabel}>单次时长</Text>
              <View style={styles.chipWrap}>
                {Array.from({ length: 20 }, (_, index) => index + 1).map((hour) => (
                  <Pressable
                    key={`hour-${hour}`}
                    onPress={() => setDraftHours(hour)}
                    style={[styles.optionChip, draftHours === hour && styles.optionChipActive]}
                  >
                    <Text style={[styles.optionChipText, draftHours === hour && styles.optionChipTextActive]}>{`${hour}小时`}</Text>
                  </Pressable>
                ))}
              </View>
            </>
          ) : null}

          <Text style={styles.sheetPreviewText}>
            {monthCount ? `当前跨度：共 ${monthCount} 个月` : '结束时间必须在开始时间之后'}
          </Text>

          <Pressable
            onPress={() => {
              const startIndex = timeOptions.indexOf(draftStart);
              const endIndex = timeOptions.indexOf(draftEnd);

              if (startIndex === -1 || endIndex === -1 || endIndex < startIndex) {
                Alert.alert('时间选择无效', '结束时间必须在开始时间之后。');
                return;
              }

              onConfirm({
                timeStart: draftStart,
                timeEnd: draftEnd,
                frequency: taskType === 'accumulate' ? draftFrequency : undefined,
                hoursPerCycle: taskType === 'accumulate' ? draftHours : undefined,
              });
              onClose();
            }}
            style={styles.sheetConfirmButton}
          >
            <Text style={styles.sheetConfirmButtonText}>确认保存</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

function FocusedCompletionPopover({
  onClose,
  onSelect,
  selectedValue,
  visible,
}: {
  onClose: () => void;
  onSelect: (value: 'done' | 'todo') => void;
  selectedValue: 'done' | 'todo';
  visible: boolean;
}) {
  return (
    <Modal animationType="fade" onRequestClose={onClose} transparent visible={visible}>
      <View style={styles.popoverOverlay}>
        <Pressable onPress={onClose} style={StyleSheet.absoluteFill} />

        <View style={styles.statusPopover}>
          {[
            { label: '未完成', value: 'todo' as const },
            { label: '已完成', value: 'done' as const },
          ].map((item) => (
            <Pressable
              key={item.value}
              onPress={() => {
                onSelect(item.value);
                onClose();
              }}
              style={styles.statusPopoverOption}
            >
              <View style={styles.statusRadioOuter}>
                {selectedValue === item.value ? <View style={styles.statusRadioInner} /> : null}
              </View>
              <Text style={styles.statusPopoverText}>{item.label}</Text>
            </Pressable>
          ))}
        </View>
      </View>
    </Modal>
  );
}

function AccumulateProgressPopover({
  initialValue,
  onClose,
  onConfirm,
  visible,
}: {
  initialValue: number;
  onClose: () => void;
  onConfirm: (value: number) => void;
  visible: boolean;
}) {
  const [draftValue, setDraftValue] = useState(`${initialValue}`);

  return (
    <Modal animationType="fade" onRequestClose={onClose} transparent visible={visible}>
      <View style={styles.popoverOverlay}>
        <Pressable onPress={onClose} style={StyleSheet.absoluteFill} />

        <View style={styles.progressPopover}>
          <Pressable onPress={onClose} style={styles.progressPopoverClose}>
            <MaterialIcons color="rgba(120, 126, 133, 1)" name="cancel" size={18} />
          </Pressable>

          <Text style={styles.progressPopoverLabel}>完成度：</Text>
          <TextInput
            keyboardType="numeric"
            onChangeText={setDraftValue}
            placeholder="请输入完成度"
            placeholderTextColor="rgba(162, 165, 169, 1)"
            style={styles.progressPopoverInput}
            value={draftValue}
          />

          <Pressable
            onPress={() => {
              const nextValue = Number.parseInt(draftValue, 10);

              if (Number.isNaN(nextValue) || nextValue < 0 || nextValue > 100) {
                Alert.alert('完成度无效', '请输入 0 到 100 之间的整数。');
                return;
              }

              onConfirm(nextValue);
              onClose();
            }}
            style={styles.progressPopoverConfirm}
          >
            <Text style={styles.progressPopoverConfirmText}>确认</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

function EquivalentTaskCard({
  alternative,
  onPress,
}: {
  alternative: TaskAlternativeCandidate;
  onPress: () => void;
}) {
  return (
    <View style={styles.equivalentTaskCard}>
      <Text numberOfLines={2} style={styles.equivalentTaskTitle}>
        {alternative.title}
      </Text>

      <View style={styles.equivalentTaskMeta}>
        <Text numberOfLines={2} style={styles.equivalentTaskReasonTitle}>
          推荐原因：
        </Text>
        <Text numberOfLines={2} style={styles.equivalentTaskReasonText}>
          {alternative.reason}
        </Text>
      </View>

      <Pressable hitSlop={8} onPress={onPress} style={styles.equivalentTaskLink}>
        <Text style={styles.equivalentTaskLinkText}>查看详情</Text>
      </Pressable>
    </View>
  );
}

export function TaskDetailPage({
  alternatives,
  onBack,
  onOpenAlternativeDetail,
  onRefreshAlternatives,
  onUpdateFocusedCompletion,
  onUpdateProgress,
  onUpdateTiming,
  task,
  timeOptions,
}: TaskDetailPageProps) {
  const insets = useSafeAreaInsets();
  const { width: screenWidth } = useWindowDimensions();
  const contentWidth = Math.min(screenWidth - 24, 430);
  const [focusedPopoverVisible, setFocusedPopoverVisible] = useState(false);
  const [progressPopoverVisible, setProgressPopoverVisible] = useState(false);
  const [timingEditorVisible, setTimingEditorVisible] = useState(false);
  const summaryLines = task.type === 'focused' ? buildFocusedSummary(task) : buildAccumulateSummary(task);
  const statusLabel =
    task.type === 'focused'
      ? task.completion === 'done'
        ? '已完成'
        : '未完成'
      : task.completion === 'done'
        ? '已完成'
        : `当前 ${task.progress ?? 0}%`;

  return (
    <View style={styles.screen}>
      <LinearGradient
        colors={['rgba(255, 255, 255, 1)', 'rgba(248, 250, 251, 1)']}
        end={{ x: 0.5, y: 1 }}
        start={{ x: 0.5, y: 0 }}
        style={styles.screen}
      >
        <View style={[styles.pageHeader, { paddingTop: insets.top + 10, width: contentWidth }]}>
          <Pressable hitSlop={10} onPress={onBack} style={styles.headerBackButton}>
            <MaterialIcons color="rgba(123, 129, 136, 1)" name="arrow-back-ios-new" size={24} />
          </Pressable>

          <View style={styles.headerTitleContent}>
            <View style={styles.titleRow}>
              <Text numberOfLines={1} style={styles.detailPageTitle}>
                {task.title}
              </Text>

              <Text style={styles.detailPageTypeText}>{task.type === 'focused' ? '整时型' : '积累型'}</Text>
              <Text style={styles.detailPageStatusText}>{statusLabel}</Text>
            </View>

            <ImportanceStars value={task.importance} />
          </View>

          <Pressable
            onPress={() => {
              if (task.type === 'focused') {
                setFocusedPopoverVisible(true);
                return;
              }

              setProgressPopoverVisible(true);
            }}
            style={styles.primaryActionButton}
          >
            <Text style={styles.primaryActionButtonText}>变更完成度</Text>
          </Pressable>
        </View>

        <ScrollView
          contentContainerStyle={[
            styles.pageScrollContent,
            {
              paddingBottom: insets.bottom + 32,
            },
          ]}
          showsVerticalScrollIndicator={false}
        >
          <View style={[styles.summaryCard, { width: contentWidth }]}>
            {task.replacementOriginTitle ? (
              <Text style={styles.replacementHintText}>{`已替代原任务：${task.replacementOriginTitle}`}</Text>
            ) : null}

            {summaryLines.map((line, index) => (
              <Text key={`${task.id}-summary-${index}`} style={styles.summaryLineText}>
                {line}
              </Text>
            ))}

            <Pressable onPress={() => setTimingEditorVisible(true)} style={styles.timingButton}>
              <MaterialIcons color="rgba(52, 141, 228, 1)" name="event" size={18} />
              <Text style={styles.timingButtonText}>
                {task.type === 'focused'
                  ? `${task.timeStart} - ${task.timeEnd}`
                  : `${task.timeStart} - ${task.timeEnd} · ${task.frequency ?? '每周'} ${task.hoursPerCycle ?? 3}小时`}
              </Text>
            </Pressable>
          </View>

          <View style={[styles.equivalentSection, { width: contentWidth }]}>
            <View style={styles.equivalentSectionHeader}>
              <Text style={styles.equivalentSectionTitle}>等价替换任务</Text>

              <Pressable onPress={onRefreshAlternatives} style={styles.refreshButton}>
                <MaterialIcons color="rgba(108, 116, 123, 1)" name="refresh" size={28} />
                <Text style={styles.refreshButtonText}>刷新</Text>
              </Pressable>
            </View>

            {alternatives.map((alternative) => (
              <EquivalentTaskCard
                alternative={alternative}
                key={alternative.id}
                onPress={() => onOpenAlternativeDetail(alternative.id)}
              />
            ))}
          </View>
        </ScrollView>
      </LinearGradient>

      <FocusedCompletionPopover
        key={`${task.id}-${task.completion}`}
        onClose={() => setFocusedPopoverVisible(false)}
        onSelect={onUpdateFocusedCompletion}
        selectedValue={task.completion}
        visible={focusedPopoverVisible}
      />

      <AccumulateProgressPopover
        key={`${task.id}-${task.progress ?? 0}`}
        initialValue={task.progress ?? 0}
        onClose={() => setProgressPopoverVisible(false)}
        onConfirm={onUpdateProgress}
        visible={progressPopoverVisible}
      />

      <TimingEditorModal
        key={`${task.id}-${task.timeStart}-${task.timeEnd}-${task.frequency ?? 'none'}-${task.hoursPerCycle ?? 0}`}
        initialFrequency={task.frequency}
        initialHoursPerCycle={task.hoursPerCycle}
        initialTimeEnd={task.timeEnd}
        initialTimeStart={task.timeStart}
        onClose={() => setTimingEditorVisible(false)}
        onConfirm={onUpdateTiming}
        taskType={task.type}
        timeOptions={timeOptions}
        visible={timingEditorVisible}
      />
    </View>
  );
}

export function AlternativeTaskDetailPage({
  alternative,
  onBack,
  onReplace,
  timeOptions,
}: AlternativeTaskDetailPageProps) {
  const insets = useSafeAreaInsets();
  const { width: screenWidth } = useWindowDimensions();
  const contentWidth = Math.min(screenWidth - 24, 430);
  const [timingEditorVisible, setTimingEditorVisible] = useState(false);
  const [draftTiming, setDraftTiming] = useState<TimingPayload>({
    timeStart: alternative.timeStart,
    timeEnd: alternative.timeEnd,
    frequency: alternative.frequency,
    hoursPerCycle: alternative.hoursPerCycle,
  });

  const summaryLines = buildAlternativeSummary({
    ...alternative,
    ...draftTiming,
  });

  return (
    <View style={styles.screen}>
      <LinearGradient
        colors={['rgba(255, 255, 255, 1)', 'rgba(248, 250, 251, 1)']}
        end={{ x: 0.5, y: 1 }}
        start={{ x: 0.5, y: 0 }}
        style={styles.screen}
      >
        <View style={[styles.pageHeader, { paddingTop: insets.top + 10, width: contentWidth }]}>
          <Pressable hitSlop={10} onPress={onBack} style={styles.headerBackButton}>
            <MaterialIcons color="rgba(123, 129, 136, 1)" name="arrow-back-ios-new" size={24} />
          </Pressable>

          <View style={styles.headerTitleContent}>
            <View style={styles.titleRow}>
              <Text numberOfLines={1} style={styles.detailPageTitle}>
                {alternative.title}
              </Text>

              <Text style={styles.detailPageTypeText}>{alternative.type === 'focused' ? '整时型' : '积累型'}</Text>
            </View>

            <ImportanceStars value={alternative.importance} />
          </View>

          <Pressable
            onPress={() => {
              Alert.alert('替代原任务', '请注意替代后原任务进度清零', [
                {
                  text: '取消',
                  style: 'cancel',
                },
                {
                  text: '确认替代',
                  onPress: () => onReplace(draftTiming),
                },
              ]);
            }}
            style={styles.primaryActionButton}
          >
            <Text style={styles.primaryActionButtonText}>代替原任务</Text>
          </Pressable>
        </View>

        <ScrollView
          contentContainerStyle={[
            styles.pageScrollContent,
            {
              paddingBottom: insets.bottom + 32,
            },
          ]}
          showsVerticalScrollIndicator={false}
        >
          <View style={[styles.summaryCard, { width: contentWidth }]}>
            {summaryLines.map((line, index) => (
              <Text key={`${alternative.id}-summary-${index}`} style={styles.summaryLineText}>
                {line}
              </Text>
            ))}

            <Pressable onPress={() => setTimingEditorVisible(true)} style={styles.timingButton}>
              <MaterialIcons color="rgba(52, 141, 228, 1)" name="event" size={18} />
              <Text style={styles.timingButtonText}>
                {alternative.type === 'focused'
                  ? `${draftTiming.timeStart} - ${draftTiming.timeEnd}`
                  : `${draftTiming.timeStart} - ${draftTiming.timeEnd} · ${draftTiming.frequency ?? '每周'} ${draftTiming.hoursPerCycle ?? 3}小时`}
              </Text>
            </Pressable>
          </View>
        </ScrollView>
      </LinearGradient>

      <TimingEditorModal
        key={`${alternative.id}-${draftTiming.timeStart}-${draftTiming.timeEnd}-${draftTiming.frequency ?? 'none'}-${draftTiming.hoursPerCycle ?? 0}`}
        initialFrequency={draftTiming.frequency}
        initialHoursPerCycle={draftTiming.hoursPerCycle}
        initialTimeEnd={draftTiming.timeEnd}
        initialTimeStart={draftTiming.timeStart}
        onClose={() => setTimingEditorVisible(false)}
        onConfirm={(payload) => setDraftTiming(payload)}
        taskType={alternative.type}
        timeOptions={timeOptions}
        visible={timingEditorVisible}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: 'rgba(250, 251, 252, 1)',
  },
  pageHeader: {
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerBackButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    borderWidth: 1.5,
    borderColor: 'rgba(138, 143, 148, 0.9)',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
  },
  headerTitleContent: {
    flex: 1,
    paddingLeft: 12,
    paddingRight: 12,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    flexWrap: 'wrap',
  },
  detailPageTitle: {
    fontSize: 34,
    lineHeight: 40,
    fontWeight: '900',
    color: 'rgba(13, 17, 20, 1)',
    marginRight: 8,
  },
  detailPageTypeText: {
    fontSize: 15,
    lineHeight: 20,
    color: 'rgba(140, 144, 149, 1)',
    marginRight: 8,
    marginBottom: 2,
  },
  detailPageStatusText: {
    fontSize: 15,
    lineHeight: 20,
    fontWeight: '700',
    color: 'rgba(122, 127, 132, 1)',
    marginBottom: 2,
  },
  starRow: {
    marginTop: 4,
    flexDirection: 'row',
    alignItems: 'center',
  },
  starIcon: {
    marginRight: 2,
  },
  primaryActionButton: {
    minWidth: 122,
    height: 42,
    borderRadius: 6,
    backgroundColor: 'rgba(55, 153, 240, 1)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: 'rgba(39, 126, 206, 0.22)',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 1,
    shadowRadius: 16,
    elevation: 8,
  },
  primaryActionButtonText: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '700',
    color: 'rgba(255, 255, 255, 1)',
  },
  pageScrollContent: {
    alignItems: 'center',
    paddingTop: 22,
  },
  summaryCard: {
    borderRadius: 6,
    backgroundColor: 'rgba(255, 255, 255, 1)',
    paddingHorizontal: 18,
    paddingVertical: 18,
    shadowColor: 'rgba(20, 29, 39, 0.12)',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 1,
    shadowRadius: 16,
    elevation: 6,
  },
  replacementHintText: {
    marginBottom: 10,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '700',
    color: 'rgba(61, 123, 218, 1)',
  },
  summaryLineText: {
    fontSize: 14,
    lineHeight: 24,
    color: 'rgba(41, 46, 52, 1)',
    marginBottom: 2,
  },
  timingButton: {
    marginTop: 16,
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: 'rgba(238, 246, 255, 1)',
  },
  timingButtonText: {
    marginLeft: 8,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '700',
    color: 'rgba(54, 128, 208, 1)',
  },
  equivalentSection: {
    marginTop: 34,
  },
  equivalentSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  equivalentSectionTitle: {
    flex: 1,
    fontSize: 22,
    lineHeight: 28,
    fontWeight: '900',
    color: 'rgba(20, 24, 27, 1)',
  },
  refreshButton: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  refreshButtonText: {
    marginTop: 2,
    fontSize: 12,
    lineHeight: 14,
    color: 'rgba(70, 136, 220, 1)',
  },
  equivalentTaskCard: {
    borderRadius: 4,
    backgroundColor: 'rgba(241, 241, 241, 1)',
    paddingHorizontal: 14,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  equivalentTaskTitle: {
    width: 92,
    fontSize: 15,
    lineHeight: 20,
    fontWeight: '800',
    color: 'rgba(58, 62, 67, 1)',
    paddingRight: 10,
  },
  equivalentTaskMeta: {
    flex: 1,
    paddingRight: 10,
  },
  equivalentTaskReasonTitle: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '700',
    color: 'rgba(136, 141, 145, 1)',
  },
  equivalentTaskReasonText: {
    marginTop: 2,
    fontSize: 12,
    lineHeight: 16,
    color: 'rgba(156, 160, 165, 1)',
  },
  equivalentTaskLink: {
    paddingVertical: 6,
  },
  equivalentTaskLinkText: {
    fontSize: 15,
    lineHeight: 20,
    fontWeight: '700',
    color: 'rgba(51, 128, 227, 1)',
  },
  popoverOverlay: {
    flex: 1,
  },
  statusPopover: {
    position: 'absolute',
    top: 112,
    right: 18,
    width: 126,
    borderRadius: 4,
    backgroundColor: 'rgba(245, 242, 244, 0.98)',
    paddingVertical: 8,
    shadowColor: 'rgba(29, 38, 48, 0.18)',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 1,
    shadowRadius: 16,
    elevation: 12,
  },
  statusPopoverOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  statusRadioOuter: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 1.5,
    borderColor: 'rgba(149, 153, 157, 1)',
    marginRight: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusRadioInner: {
    width: 9,
    height: 9,
    borderRadius: 4.5,
    backgroundColor: 'rgba(116, 123, 129, 1)',
  },
  statusPopoverText: {
    fontSize: 15,
    lineHeight: 20,
    color: 'rgba(43, 48, 53, 1)',
  },
  progressPopover: {
    position: 'absolute',
    top: 112,
    right: 18,
    width: 208,
    borderRadius: 4,
    backgroundColor: 'rgba(228, 223, 224, 0.98)',
    paddingHorizontal: 14,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: 'rgba(29, 38, 48, 0.18)',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 1,
    shadowRadius: 16,
    elevation: 12,
  },
  progressPopoverClose: {
    position: 'absolute',
    top: 6,
    right: 6,
  },
  progressPopoverLabel: {
    fontSize: 15,
    lineHeight: 20,
    fontWeight: '700',
    color: 'rgba(50, 54, 59, 1)',
  },
  progressPopoverInput: {
    flex: 1,
    fontSize: 15,
    lineHeight: 20,
    color: 'rgba(55, 60, 65, 1)',
    paddingVertical: 0,
    marginLeft: 6,
  },
  progressPopoverConfirm: {
    marginLeft: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: 'rgba(55, 153, 240, 1)',
  },
  progressPopoverConfirmText: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '700',
    color: 'rgba(255, 255, 255, 1)',
  },
  sheetOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(18, 23, 28, 0.22)',
  },
  sheetCard: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 1)',
    paddingHorizontal: 18,
    paddingTop: 16,
    paddingBottom: 24,
    maxHeight: '82%',
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  sheetTitle: {
    flex: 1,
    fontSize: 18,
    lineHeight: 24,
    fontWeight: '800',
    color: 'rgba(31, 38, 45, 1)',
  },
  sheetCloseButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(243, 245, 247, 1)',
  },
  sheetLabel: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '800',
    color: 'rgba(45, 52, 59, 1)',
    marginTop: 8,
    marginBottom: 8,
  },
  chipWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  optionChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: 'rgba(245, 246, 248, 1)',
    marginRight: 8,
    marginBottom: 8,
  },
  optionChipActive: {
    backgroundColor: 'rgba(52, 141, 228, 1)',
  },
  optionChipText: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '700',
    color: 'rgba(98, 105, 112, 1)',
  },
  optionChipTextActive: {
    color: 'rgba(255, 255, 255, 1)',
  },
  sheetPreviewText: {
    marginTop: 10,
    fontSize: 13,
    lineHeight: 18,
    color: 'rgba(98, 106, 113, 1)',
  },
  sheetConfirmButton: {
    marginTop: 18,
    height: 46,
    borderRadius: 12,
    backgroundColor: 'rgba(52, 141, 228, 1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sheetConfirmButtonText: {
    fontSize: 15,
    lineHeight: 20,
    fontWeight: '800',
    color: 'rgba(255, 255, 255, 1)',
  },
});
