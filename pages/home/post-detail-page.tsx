import { useEffect, useRef, useState, type ReactNode } from 'react';
import Feather from '@expo/vector-icons/Feather';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import {
  Animated,
  Image,
  Linking,
  Modal,
  PanResponder,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import type { FeedCard } from './feed-data';
import { HOME_ROLE_LABELS } from './home-role-config';

const POSITION_OPTIONS = [...HOME_ROLE_LABELS];
const FREQUENCY_OPTIONS = ['每周', '每天'] as const;
const WEEKDAY_LABELS = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'] as const;

type FrequencyOption = (typeof FREQUENCY_OPTIONS)[number];

type PostDetailPageProps = {
  onBack?: () => void;
  post: FeedCard;
};

type ActionButtonProps = {
  active?: boolean;
  activeIcon?: keyof typeof Ionicons.glyphMap;
  emphasized?: boolean;
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress?: () => void;
};

type ShareOptionButtonProps = {
  children: ReactNode;
  label: string;
  onPress?: () => void;
};

function buildCalendarCells(year: number, month: number) {
  const firstWeekday = new Date(year, month - 1, 1).getDay();
  const totalDays = new Date(year, month, 0).getDate();
  const cells: Array<number | null> = Array.from({ length: firstWeekday }, () => null);

  for (let day = 1; day <= totalDays; day += 1) {
    cells.push(day);
  }

  while (cells.length % 7 !== 0) {
    cells.push(null);
  }

  return cells;
}

function formatChineseDate(year: number, month: number, day: number) {
  return `${year}年${month}月${day}日`;
}

function addMonths(year: number, month: number, day: number, amount: number) {
  const nextDate = new Date(year, month - 1 + amount, day);

  return {
    day: nextDate.getDate(),
    month: nextDate.getMonth() + 1,
    year: nextDate.getFullYear(),
  };
}

function ActionButton({
  active = false,
  activeIcon,
  emphasized = false,
  icon,
  label,
  onPress,
}: ActionButtonProps) {
  const iconName = active && activeIcon ? activeIcon : icon;

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.actionButton,
        emphasized && styles.actionButtonEmphasized,
        active && styles.actionButtonActive,
        pressed && styles.actionButtonPressed,
      ]}
    >
      <View
        style={[
          styles.actionIconWrap,
          emphasized && styles.actionIconWrapEmphasized,
          active && styles.actionIconWrapActive,
        ]}
      >
        <Ionicons
          color={
            active
              ? 'rgba(226, 164, 16, 1)'
              : emphasized
                ? 'rgba(92, 190, 186, 1)'
                : 'rgba(164, 178, 180, 1)'
          }
          name={iconName}
          size={18}
        />
      </View>

      <Text
        style={[
          styles.actionLabel,
          emphasized && styles.actionLabelEmphasized,
          active && styles.actionLabelActive,
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

function ShareOptionButton({ children, label, onPress }: ShareOptionButtonProps) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.shareOption, pressed && styles.shareOptionPressed]}>
      <View style={styles.shareOptionIconFrame}>{children}</View>
      <Text style={styles.shareOptionLabel}>{label}</Text>
    </Pressable>
  );
}

export default function PostDetailPage({ onBack, post }: PostDetailPageProps) {
  const insets = useSafeAreaInsets();
  const { width: screenWidth } = useWindowDimensions();
  const [isCollected, setIsCollected] = useState(false);
  const [hasJoinedPlan, setHasJoinedPlan] = useState(false);
  const [isPlanModalVisible, setIsPlanModalVisible] = useState(false);
  const [isShareModalVisible, setIsShareModalVisible] = useState(false);
  const [isRoleMenuVisible, setIsRoleMenuVisible] = useState(false);
  const [isSchedulePickerVisible, setIsSchedulePickerVisible] = useState(false);
  const [isFrequencyPanelVisible, setIsFrequencyPanelVisible] = useState(false);
  const [selectedRole, setSelectedRole] = useState(post.roleLabel);
  const [selectedFrequency, setSelectedFrequency] = useState<FrequencyOption>('每周');
  const [selectedHours, setSelectedHours] = useState(3);
  const [calendarYear, setCalendarYear] = useState(2026);
  const [calendarMonth, setCalendarMonth] = useState(2);
  const [selectedDay, setSelectedDay] = useState(14);
  const [hasSchedule, setHasSchedule] = useState(false);
  const swipeTranslateX = useRef(new Animated.Value(0)).current;
  const contentWidth = Math.min(screenWidth - 48, 390);
  const coverHeight = Math.min(contentWidth * 0.94, 350);
  const overlayVisible = isPlanModalVisible || isShareModalVisible;
  const calendarCells = buildCalendarCells(calendarYear, calendarMonth);
  const endDate = addMonths(calendarYear, calendarMonth, selectedDay, 3);
  const taskName = post.title.length > 12 ? `${post.title.slice(0, 12)}...` : post.title;
  const isScheduleFlowVisible = isSchedulePickerVisible || isFrequencyPanelVisible;
  const scheduleSummary = hasSchedule
    ? `${formatChineseDate(calendarYear, calendarMonth, selectedDay)}——${formatChineseDate(
        endDate.year,
        endDate.month,
        endDate.day
      )}\n${selectedFrequency}${selectedHours}小时`
    : '请选择任务完成时间';
  const panelWidth = Math.min(screenWidth - 56, 334);

  useEffect(() => {
    setSelectedRole(post.roleLabel);
  }, [post.roleLabel]);

  const handleOpenSource = () => {
    Linking.openURL(post.sourceUrl);
  };

  const closePlanModal = () => {
    setIsPlanModalVisible(false);
    setIsRoleMenuVisible(false);
    setIsSchedulePickerVisible(false);
    setIsFrequencyPanelVisible(false);
  };

  const closeShareModal = () => {
    setIsShareModalVisible(false);
  };

  const confirmSchedule = () => {
    setHasSchedule(true);
    setIsSchedulePickerVisible(false);
    setIsFrequencyPanelVisible(false);
  };

  const shiftCalendarMonth = (direction: -1 | 1) => {
    const nextDate = new Date(calendarYear, calendarMonth - 1 + direction, 1);
    const totalDays = new Date(nextDate.getFullYear(), nextDate.getMonth() + 1, 0).getDate();

    setCalendarYear(nextDate.getFullYear());
    setCalendarMonth(nextDate.getMonth() + 1);
    setSelectedDay((current) => Math.min(current, totalDays));
  };

  const edgeSwipeResponder = PanResponder.create({
    onMoveShouldSetPanResponder: (_, gestureState) =>
      !overlayVisible &&
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
    <View style={styles.pageWrap}>
      <Animated.View
        style={[
          styles.pageContentLayer,
          {
            transform: [{ translateX: swipeTranslateX }],
          },
        ]}
        {...edgeSwipeResponder.panHandlers}
      >
        <LinearGradient
          colors={['rgba(174, 239, 230, 1)', 'rgba(187, 232, 229, 1)']}
          end={{ x: 1, y: 1 }}
          start={{ x: 0, y: 0 }}
          style={[styles.heroBand, { height: insets.top + 48, paddingTop: insets.top + 4 }]}
        >
          <Pressable hitSlop={10} onPress={onBack} style={styles.backButton}>
            <Ionicons color="rgba(120, 131, 136, 1)" name="chevron-back" size={30} />
          </Pressable>

          <MaterialIcons
            color="rgba(115, 225, 218, 0.55)"
            name="auto-awesome"
            size={50}
            style={styles.heroDecoration}
          />
        </LinearGradient>

        <ScrollView
          bounces={false}
          contentContainerStyle={[
            styles.scrollContent,
            {
              paddingBottom: Math.max(insets.bottom + 110, 136),
            },
          ]}
          showsVerticalScrollIndicator={false}
        >
          <View style={[styles.articleWrap, { width: contentWidth }]}>
            <Text style={styles.title}>{post.title}</Text>
            <Pressable onPress={handleOpenSource} style={({ pressed }) => [styles.sourceButton, pressed && styles.sourceButtonPressed]}>
              <Text numberOfLines={1} style={styles.sourceButtonText}>
                来源：{post.author}
              </Text>
              <Ionicons color="rgba(92, 149, 144, 1)" name="open-outline" size={16} />
            </Pressable>

            <LinearGradient
              colors={post.coverGradient}
              end={{ x: 1, y: 1 }}
              start={{ x: 0, y: 0 }}
              style={[styles.coverFrame, { height: coverHeight }]}
            >
              <Image resizeMode="cover" source={post.cover} style={styles.coverImage} />
            </LinearGradient>

            <View style={styles.articleBody}>
              {post.body.map((paragraph, index) => (
                <Text key={`${post.id}-${index}`} style={styles.paragraph}>
                  {paragraph}
                </Text>
              ))}

              <Pressable onPress={handleOpenSource} style={({ pressed }) => [styles.readSourceButton, pressed && styles.readSourceButtonPressed]}>
                <Text style={styles.readSourceButtonText}>查看英文原文</Text>
              </Pressable>
            </View>
          </View>
        </ScrollView>

        <View
          pointerEvents="box-none"
          style={[
            styles.actionBarWrap,
            {
              paddingBottom: Math.max(insets.bottom + 8, 16),
            },
          ]}
        >
          <View style={styles.actionBar}>
            <ActionButton
              active={isCollected}
              activeIcon="star"
              icon="star-outline"
              label="收藏"
              onPress={() => setIsCollected((current) => !current)}
            />
            <ActionButton
              emphasized
              icon={hasJoinedPlan ? 'checkmark-circle' : 'add'}
              label={hasJoinedPlan ? '已加入我的规划' : '加入我的规划'}
              onPress={() => {
                setIsShareModalVisible(false);
                setIsPlanModalVisible(true);
              }}
            />
            <ActionButton
              icon="share-outline"
              label="分享"
              onPress={() => {
                setIsPlanModalVisible(false);
                setIsShareModalVisible(true);
              }}
            />
          </View>
        </View>
      </Animated.View>

      <Modal animationType="fade" onRequestClose={closePlanModal} transparent visible={isPlanModalVisible}>
        <View style={styles.modalOverlay}>
          <Pressable onPress={closePlanModal} style={StyleSheet.absoluteFill} />

          {!isScheduleFlowVisible ? (
            <View style={[styles.planModalWrap, { paddingTop: insets.top + 12 }]}>
              <View style={[styles.planCard, { width: Math.min(screenWidth - 32, 398) }]}>
                <Text style={styles.planTitle}>{hasJoinedPlan ? '已加入我的规划' : '加入我的规划'}</Text>

                <View style={styles.planFormCard}>
                  <View style={styles.planRow}>
                    <View style={styles.planLabelChip}>
                      <Text style={styles.planLabelText}>任务名</Text>
                    </View>

                    <Text numberOfLines={1} style={styles.planValueText}>
                      {taskName}
                    </Text>
                  </View>

                  <View style={[styles.planRow, styles.planRowPopupHost]}>
                    <View style={styles.planLabelChip}>
                      <Text style={styles.planLabelText}>岗位</Text>
                    </View>

                    <View style={styles.planFieldColumn}>
                      <Pressable
                        onPress={() => {
                          setIsRoleMenuVisible((current) => !current);
                          setIsSchedulePickerVisible(false);
                          setIsFrequencyPanelVisible(false);
                        }}
                        style={({ pressed }) => [styles.planField, pressed && styles.planFieldPressed]}
                      >
                        <Text style={styles.planFieldValue}>{selectedRole}</Text>
                        <Ionicons
                          color="rgba(109, 118, 126, 1)"
                          name={isRoleMenuVisible ? 'chevron-up' : 'chevron-down'}
                          size={20}
                        />
                      </Pressable>

                      {isRoleMenuVisible ? (
                        <View style={styles.roleMenu}>
                          {POSITION_OPTIONS.map((option) => {
                            const active = selectedRole === option;

                            return (
                              <Pressable
                                key={option}
                                onPress={() => {
                                  setSelectedRole(option);
                                  setIsRoleMenuVisible(false);
                                }}
                                style={({ pressed }) => [
                                  styles.roleMenuItem,
                                  active && styles.roleMenuItemActive,
                                  pressed && styles.roleMenuItemPressed,
                                ]}
                              >
                                <Text style={[styles.roleMenuItemText, active && styles.roleMenuItemTextActive]}>
                                  {option}
                                </Text>
                              </Pressable>
                            );
                          })}
                        </View>
                      ) : null}
                    </View>
                  </View>

                  <View style={styles.planRow}>
                    <View style={styles.planLabelChip}>
                      <Text style={styles.planLabelText}>时间</Text>
                    </View>

                    <View style={styles.planFieldColumn}>
                      <Pressable
                        onPress={() => {
                          setIsRoleMenuVisible(false);
                          setIsSchedulePickerVisible(true);
                        }}
                        style={({ pressed }) => [
                          styles.planField,
                          hasSchedule && styles.planFieldMultiline,
                          pressed && styles.planFieldPressed,
                        ]}
                      >
                        <Text style={[styles.planFieldValue, !hasSchedule && styles.planFieldPlaceholder]}>
                          {scheduleSummary}
                        </Text>
                      </Pressable>
                    </View>
                  </View>

                  <View style={styles.planRow}>
                    <View style={styles.planLabelChip}>
                      <Text style={styles.planLabelText}>来源</Text>
                    </View>

                    <Text style={styles.planValueText}>{post.author}</Text>
                  </View>

                  <Pressable
                    onPress={() => {
                      setHasJoinedPlan(true);
                      closePlanModal();
                    }}
                    style={({ pressed }) => [styles.confirmButton, pressed && styles.confirmButtonPressed]}
                  >
                    <Text style={styles.confirmButtonText}>确认</Text>
                  </Pressable>

                  <Text style={styles.planFootnote}>注：均为系统识别文章内容填入，可手动更改，岗位可多选</Text>
                </View>
              </View>
            </View>
          ) : null}

          {isSchedulePickerVisible ? (
            <View style={styles.floatingOverlay}>
              <Pressable
                onPress={() => {
                  setIsSchedulePickerVisible(false);
                  setIsFrequencyPanelVisible(false);
                }}
                style={StyleSheet.absoluteFill}
              />
              <View style={[styles.schedulePanel, { width: panelWidth }]}>
                <View style={styles.schedulePanelHeader}>
                  <Text style={styles.schedulePanelHeaderText}>起始时间</Text>
                </View>

                <View style={styles.schedulePanelBody}>
                  <View style={styles.calendarMonthRow}>
                    <Text style={styles.calendarMonthText}>
                      {calendarYear}年{calendarMonth}月
                    </Text>

                    <View style={styles.calendarMonthActions}>
                      <Pressable
                        hitSlop={8}
                        onPress={() => shiftCalendarMonth(-1)}
                        style={({ pressed }) => [styles.calendarArrowButton, pressed && styles.calendarArrowButtonPressed]}
                      >
                        <Ionicons color="rgba(61, 135, 246, 1)" name="chevron-back" size={18} />
                      </Pressable>

                      <Pressable
                        hitSlop={8}
                        onPress={() => shiftCalendarMonth(1)}
                        style={({ pressed }) => [styles.calendarArrowButton, pressed && styles.calendarArrowButtonPressed]}
                      >
                        <Ionicons color="rgba(61, 135, 246, 1)" name="chevron-forward" size={18} />
                      </Pressable>
                    </View>
                  </View>

                  <View style={styles.calendarWeekRow}>
                    {WEEKDAY_LABELS.map((label) => (
                      <Text key={label} style={styles.calendarWeekText}>
                        {label}
                      </Text>
                    ))}
                  </View>

                  <View style={styles.calendarGrid}>
                    {calendarCells.map((cell, index) => {
                      const active = cell === selectedDay;

                      return (
                        <Pressable
                          key={`${calendarYear}-${calendarMonth}-${index}`}
                          disabled={cell === null}
                          onPress={() => {
                            if (cell !== null) {
                              setSelectedDay(cell);
                            }
                          }}
                          style={({ pressed }) => [
                            styles.calendarDayCell,
                            active && styles.calendarDayCellActive,
                            cell === null && styles.calendarDayCellEmpty,
                            pressed && cell !== null && styles.calendarDayCellPressed,
                          ]}
                        >
                          <Text
                            style={[
                              styles.calendarDayText,
                              active && styles.calendarDayTextActive,
                              cell === null && styles.calendarDayTextHidden,
                            ]}
                          >
                            {cell ?? ''}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>

                  <Pressable
                    onPress={() => setIsFrequencyPanelVisible((current) => !current)}
                    style={({ pressed }) => [styles.frequencyTrigger, pressed && styles.frequencyTriggerPressed]}
                  >
                    <Text style={styles.frequencyTriggerLabel}>频率</Text>
                    <Text style={styles.frequencyTriggerValue}>
                      {selectedFrequency} {selectedHours} 小时
                    </Text>
                    <Ionicons
                      color="rgba(109, 118, 126, 1)"
                      name={isFrequencyPanelVisible ? 'chevron-up' : 'chevron-down'}
                      size={18}
                    />
                  </Pressable>

                  <View style={styles.scheduleActionRow}>
                    <Pressable
                      onPress={() => {
                        setIsSchedulePickerVisible(false);
                        setIsFrequencyPanelVisible(false);
                      }}
                      style={({ pressed }) => [styles.scheduleGhostButton, pressed && styles.scheduleGhostButtonPressed]}
                    >
                      <Text style={styles.scheduleGhostButtonText}>取消</Text>
                    </Pressable>

                    <Pressable
                      onPress={confirmSchedule}
                      style={({ pressed }) => [styles.scheduleConfirmButton, pressed && styles.scheduleConfirmButtonPressed]}
                    >
                      <Text style={styles.scheduleConfirmButtonText}>完成</Text>
                    </Pressable>
                  </View>
                </View>
              </View>
            </View>
          ) : null}

          {isFrequencyPanelVisible ? (
            <View style={styles.floatingOverlay}>
              <Pressable onPress={() => setIsFrequencyPanelVisible(false)} style={StyleSheet.absoluteFill} />
              <View style={[styles.frequencyPanel, { width: Math.min(screenWidth - 104, 244) }]}>
                <View style={styles.frequencyPanelHeader}>
                  <Text style={styles.frequencyPanelHeaderText}>频率</Text>
                  <Pressable hitSlop={8} onPress={() => setIsFrequencyPanelVisible(false)}>
                    <Text style={styles.frequencyPanelDoneText}>完成</Text>
                  </Pressable>
                </View>

                <View style={styles.frequencyOptionRow}>
                  {FREQUENCY_OPTIONS.map((option) => {
                    const active = selectedFrequency === option;

                    return (
                      <Pressable
                        key={option}
                        onPress={() => setSelectedFrequency(option)}
                        style={({ pressed }) => [
                          styles.frequencyModeButton,
                          active && styles.frequencyModeButtonActive,
                          pressed && styles.frequencyModeButtonPressed,
                        ]}
                      >
                        <Text style={[styles.frequencyModeText, active && styles.frequencyModeTextActive]}>
                          {option}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>

                <View style={styles.hoursAdjustRow}>
                  <Pressable
                    onPress={() => setSelectedHours((current) => Math.max(1, current - 1))}
                    style={({ pressed }) => [styles.hoursAdjustButton, pressed && styles.hoursAdjustButtonPressed]}
                  >
                    <Ionicons color="rgba(90, 95, 101, 1)" name="remove" size={16} />
                  </Pressable>

                  <View style={styles.hoursValueBox}>
                    <Text style={styles.hoursValueText}>{selectedHours}</Text>
                  </View>

                  <Pressable
                    onPress={() => setSelectedHours((current) => Math.min(12, current + 1))}
                    style={({ pressed }) => [styles.hoursAdjustButton, pressed && styles.hoursAdjustButtonPressed]}
                  >
                    <Ionicons color="rgba(90, 95, 101, 1)" name="add" size={16} />
                  </Pressable>

                  <Text style={styles.hoursUnitText}>小时</Text>
                </View>
              </View>
            </View>
          ) : null}
        </View>
      </Modal>

      <Modal animationType="fade" onRequestClose={closeShareModal} transparent visible={isShareModalVisible}>
        <View style={styles.shareOverlay}>
          <Pressable onPress={closeShareModal} style={StyleSheet.absoluteFill} />

          <View style={styles.shareSheetWrap}>
            <View style={[styles.shareSheet, { paddingBottom: Math.max(insets.bottom + 10, 18) }]}>
              <View style={styles.shareOptionsRow}>
                <ShareOptionButton label="发送给朋友" onPress={closeShareModal}>
                  <Ionicons color="rgba(53, 139, 243, 1)" name="paper-plane" size={28} />
                </ShareOptionButton>
                <ShareOptionButton label="新浪微博" onPress={closeShareModal}>
                  <Feather color="rgba(230, 69, 59, 1)" name="at-sign" size={26} />
                </ShareOptionButton>
                <ShareOptionButton label="生活圈" onPress={closeShareModal}>
                  <Ionicons color="rgba(243, 152, 31, 1)" name="color-palette" size={28} />
                </ShareOptionButton>
                <ShareOptionButton label="微信好友" onPress={closeShareModal}>
                  <Ionicons color="rgba(67, 183, 54, 1)" name="logo-wechat" size={28} />
                </ShareOptionButton>
                <ShareOptionButton label="QQ" onPress={closeShareModal}>
                  <Ionicons color="rgba(24, 27, 32, 1)" name="chatbubbles" size={28} />
                </ShareOptionButton>
              </View>

              <View style={styles.shareDivider} />

              <View style={styles.shareOptionsRow}>
                <ShareOptionButton label="字号" onPress={closeShareModal}>
                  <MaterialIcons color="rgba(111, 116, 123, 1)" name="text-fields" size={28} />
                </ShareOptionButton>
                <ShareOptionButton label="刷新" onPress={closeShareModal}>
                  <Ionicons color="rgba(111, 116, 123, 1)" name="refresh" size={28} />
                </ShareOptionButton>
                <ShareOptionButton label="复制链接" onPress={closeShareModal}>
                  <Ionicons color="rgba(111, 116, 123, 1)" name="link-outline" size={28} />
                </ShareOptionButton>
                <ShareOptionButton label="投诉" onPress={closeShareModal}>
                  <Ionicons color="rgba(111, 116, 123, 1)" name="warning-outline" size={28} />
                </ShareOptionButton>
              </View>

              <Pressable onPress={closeShareModal} style={({ pressed }) => [styles.shareCancelButton, pressed && styles.shareCancelButtonPressed]}>
                <Text style={styles.shareCancelText}>取消</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  pageWrap: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  pageContentLayer: {
    flex: 1,
    backgroundColor: '#ffffff',
    shadowColor: 'rgba(14, 20, 28, 0.22)',
    shadowOffset: {
      width: -8,
      height: 0,
    },
    shadowOpacity: 1,
    shadowRadius: 18,
    elevation: 24,
  },
  heroBand: {
    justifyContent: 'center',
  },
  backButton: {
    marginLeft: 16,
    width: 34,
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroDecoration: {
    position: 'absolute',
    right: 20,
    top: 12,
    transform: [{ rotate: '10deg' }],
  },
  scrollContent: {
    paddingTop: 18,
    alignItems: 'center',
  },
  articleWrap: {
    alignSelf: 'center',
  },
  title: {
    fontSize: 24,
    lineHeight: 32,
    fontWeight: '700',
    color: 'rgba(47, 47, 51, 1)',
  },
  metaText: {
    marginTop: 8,
    fontSize: 14,
    lineHeight: 18,
    fontWeight: '500',
    color: 'rgba(161, 166, 171, 1)',
  },
  sourceButton: {
    marginTop: 12,
    alignSelf: 'flex-start',
    maxWidth: '100%',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
    backgroundColor: 'rgba(235, 245, 243, 1)',
    flexDirection: 'row',
    alignItems: 'center',
  },
  sourceButtonPressed: {
    opacity: 0.92,
  },
  sourceButtonText: {
    maxWidth: 260,
    marginRight: 6,
    fontSize: 13,
    lineHeight: 16,
    fontWeight: '600',
    color: 'rgba(93, 126, 122, 1)',
  },
  coverFrame: {
    marginTop: 18,
    borderRadius: 12,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  coverImage: {
    width: '100%',
    height: '100%',
  },
  articleBody: {
    marginTop: 18,
    gap: 18,
  },
  paragraph: {
    fontSize: 18,
    lineHeight: 33,
    color: 'rgba(62, 66, 70, 1)',
  },
  readSourceButton: {
    alignSelf: 'flex-start',
    marginTop: 4,
    borderRadius: 999,
    backgroundColor: 'rgba(78, 166, 157, 1)',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  readSourceButtonPressed: {
    opacity: 0.92,
  },
  readSourceButtonText: {
    fontSize: 14,
    lineHeight: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
  actionBarWrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 18,
  },
  actionBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  actionButton: {
    minWidth: 92,
    height: 50,
    paddingHorizontal: 14,
    borderRadius: 15,
    backgroundColor: 'rgba(255, 255, 255, 0.98)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(219, 224, 228, 0.9)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: 'rgba(0, 0, 0, 0.12)',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 1,
    shadowRadius: 10,
    elevation: 8,
  },
  actionButtonEmphasized: {
    minWidth: 154,
  },
  actionButtonActive: {
    borderColor: 'rgba(239, 210, 123, 0.95)',
    backgroundColor: 'rgba(255, 250, 229, 0.98)',
  },
  actionButtonPressed: {
    opacity: 0.94,
    transform: [{ scale: 0.99 }],
  },
  actionIconWrap: {
    width: 24,
    height: 24,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(243, 246, 248, 1)',
  },
  actionIconWrapEmphasized: {
    backgroundColor: 'rgba(199, 245, 241, 1)',
  },
  actionIconWrapActive: {
    backgroundColor: 'rgba(255, 240, 195, 1)',
  },
  actionLabel: {
    marginLeft: 8,
    fontSize: 16,
    lineHeight: 20,
    fontWeight: '600',
    color: 'rgba(82, 86, 91, 1)',
  },
  actionLabelEmphasized: {
    color: 'rgba(71, 73, 77, 1)',
  },
  actionLabelActive: {
    color: 'rgba(189, 132, 11, 1)',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(19, 25, 32, 0.44)',
  },
  planModalWrap: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  planCard: {
    alignItems: 'center',
  },
  planTitle: {
    fontSize: 20,
    lineHeight: 28,
    fontWeight: '700',
    color: 'rgba(27, 29, 33, 1)',
  },
  planFormCard: {
    width: '100%',
    marginTop: 14,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 14,
    shadowColor: 'rgba(0, 0, 0, 0.2)',
    shadowOffset: {
      width: 0,
      height: 12,
    },
    shadowOpacity: 1,
    shadowRadius: 22,
    elevation: 18,
  },
  planRow: {
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 6,
  },
  planRowPopupHost: {
    zIndex: 3,
  },
  planLabelChip: {
    minWidth: 54,
    height: 28,
    marginTop: 4,
    borderRadius: 4,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: 'rgba(0, 0, 0, 0.12)',
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 1,
    shadowRadius: 6,
    elevation: 4,
  },
  planLabelText: {
    fontSize: 13,
    lineHeight: 16,
    fontWeight: '600',
    color: 'rgba(110, 113, 118, 1)',
  },
  planValueText: {
    flex: 1,
    marginLeft: 18,
    marginTop: 7,
    fontSize: 16,
    lineHeight: 22,
    fontWeight: '500',
    color: 'rgba(53, 56, 60, 1)',
  },
  planFieldColumn: {
    flex: 1,
    marginLeft: 18,
    position: 'relative',
  },
  planField: {
    minHeight: 34,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: 'rgba(204, 208, 212, 1)',
    backgroundColor: 'rgba(255, 255, 255, 0.98)',
    paddingHorizontal: 10,
    paddingVertical: 7,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  planFieldPressed: {
    opacity: 0.96,
  },
  planFieldMultiline: {
    minHeight: 48,
    alignItems: 'flex-start',
  },
  planFieldValue: {
    flex: 1,
    fontSize: 16,
    lineHeight: 20,
    color: 'rgba(96, 102, 109, 1)',
  },
  planFieldPlaceholder: {
    color: 'rgba(172, 175, 180, 1)',
  },
  roleMenu: {
    position: 'absolute',
    top: 40,
    left: 0,
    right: 0,
    borderRadius: 8,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: 'rgba(224, 228, 232, 1)',
    shadowColor: 'rgba(0, 0, 0, 0.12)',
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowOpacity: 1,
    shadowRadius: 10,
    elevation: 8,
    overflow: 'hidden',
  },
  roleMenuItem: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#ffffff',
  },
  roleMenuItemActive: {
    backgroundColor: 'rgba(238, 246, 255, 1)',
  },
  roleMenuItemPressed: {
    opacity: 0.9,
  },
  roleMenuItemText: {
    fontSize: 15,
    lineHeight: 20,
    color: 'rgba(92, 98, 104, 1)',
  },
  roleMenuItemTextActive: {
    color: 'rgba(45, 123, 237, 1)',
    fontWeight: '600',
  },
  confirmButton: {
    height: 48,
    marginTop: 12,
    borderRadius: 4,
    backgroundColor: 'rgba(44, 138, 242, 1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmButtonPressed: {
    opacity: 0.94,
  },
  confirmButtonText: {
    fontSize: 16,
    lineHeight: 20,
    fontWeight: '700',
    color: '#ffffff',
  },
  planFootnote: {
    marginTop: 10,
    fontSize: 11,
    lineHeight: 15,
    textAlign: 'center',
    color: 'rgba(119, 124, 130, 1)',
  },
  floatingOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    backgroundColor: 'rgba(19, 25, 32, 0.12)',
  },
  schedulePanel: {
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#ffffff',
    shadowColor: 'rgba(0, 0, 0, 0.18)',
    shadowOffset: {
      width: 0,
      height: 12,
    },
    shadowOpacity: 1,
    shadowRadius: 20,
    elevation: 16,
  },
  schedulePanelHeader: {
    height: 52,
    backgroundColor: 'rgba(135, 137, 141, 1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  schedulePanelHeaderText: {
    fontSize: 16,
    lineHeight: 20,
    fontWeight: '700',
    color: '#ffffff',
  },
  schedulePanelBody: {
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 14,
  },
  calendarMonthRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  calendarMonthText: {
    fontSize: 16,
    lineHeight: 20,
    fontWeight: '600',
    color: 'rgba(43, 47, 52, 1)',
  },
  calendarMonthActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  calendarArrowButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  calendarArrowButtonPressed: {
    backgroundColor: 'rgba(236, 243, 255, 1)',
  },
  calendarWeekRow: {
    marginTop: 12,
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  calendarWeekText: {
    width: '14.285%',
    textAlign: 'center',
    fontSize: 11,
    lineHeight: 14,
    color: 'rgba(186, 190, 195, 1)',
  },
  calendarGrid: {
    marginTop: 8,
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  calendarDayCell: {
    width: '14.285%',
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 18,
  },
  calendarDayCellActive: {
    backgroundColor: 'rgba(205, 228, 255, 1)',
  },
  calendarDayCellPressed: {
    opacity: 0.85,
  },
  calendarDayCellEmpty: {
    opacity: 0,
  },
  calendarDayText: {
    fontSize: 16,
    lineHeight: 20,
    color: 'rgba(38, 42, 47, 1)',
  },
  calendarDayTextActive: {
    color: 'rgba(42, 111, 228, 1)',
    fontWeight: '700',
  },
  calendarDayTextHidden: {
    color: 'transparent',
  },
  frequencyTrigger: {
    minHeight: 40,
    marginTop: 10,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(216, 220, 225, 1)',
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  frequencyTriggerPressed: {
    opacity: 0.94,
  },
  frequencyTriggerLabel: {
    fontSize: 14,
    lineHeight: 18,
    fontWeight: '600',
    color: 'rgba(83, 89, 96, 1)',
  },
  frequencyTriggerValue: {
    flex: 1,
    marginLeft: 14,
    fontSize: 14,
    lineHeight: 18,
    color: 'rgba(96, 102, 109, 1)',
  },
  scheduleActionRow: {
    marginTop: 12,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
  },
  scheduleGhostButton: {
    minWidth: 72,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(241, 243, 245, 1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scheduleGhostButtonPressed: {
    opacity: 0.9,
  },
  scheduleGhostButtonText: {
    fontSize: 14,
    lineHeight: 18,
    fontWeight: '600',
    color: 'rgba(94, 99, 105, 1)',
  },
  scheduleConfirmButton: {
    minWidth: 78,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(44, 138, 242, 1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scheduleConfirmButtonPressed: {
    opacity: 0.92,
  },
  scheduleConfirmButtonText: {
    fontSize: 14,
    lineHeight: 18,
    fontWeight: '700',
    color: '#ffffff',
  },
  frequencyPanel: {
    marginTop: 140,
    borderRadius: 8,
    backgroundColor: '#ffffff',
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 14,
    shadowColor: 'rgba(0, 0, 0, 0.18)',
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 1,
    shadowRadius: 18,
    elevation: 16,
  },
  frequencyPanelHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  frequencyPanelHeaderText: {
    fontSize: 16,
    lineHeight: 20,
    fontWeight: '700',
    color: 'rgba(45, 48, 52, 1)',
  },
  frequencyPanelDoneText: {
    fontSize: 13,
    lineHeight: 16,
    fontWeight: '600',
    color: 'rgba(44, 138, 242, 1)',
  },
  frequencyOptionRow: {
    marginTop: 12,
    flexDirection: 'row',
    gap: 8,
  },
  frequencyModeButton: {
    minWidth: 74,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(241, 243, 245, 1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  frequencyModeButtonActive: {
    backgroundColor: 'rgba(224, 238, 255, 1)',
  },
  frequencyModeButtonPressed: {
    opacity: 0.92,
  },
  frequencyModeText: {
    fontSize: 14,
    lineHeight: 18,
    fontWeight: '600',
    color: 'rgba(91, 97, 103, 1)',
  },
  frequencyModeTextActive: {
    color: 'rgba(45, 123, 237, 1)',
  },
  hoursAdjustRow: {
    marginTop: 14,
    flexDirection: 'row',
    alignItems: 'center',
  },
  hoursAdjustButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(241, 243, 245, 1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  hoursAdjustButtonPressed: {
    opacity: 0.9,
  },
  hoursValueBox: {
    width: 62,
    height: 34,
    marginHorizontal: 10,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(213, 217, 221, 1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  hoursValueText: {
    fontSize: 16,
    lineHeight: 20,
    fontWeight: '600',
    color: 'rgba(55, 59, 63, 1)',
  },
  hoursUnitText: {
    marginLeft: 8,
    fontSize: 15,
    lineHeight: 18,
    color: 'rgba(83, 89, 96, 1)',
  },
  shareOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(26, 29, 33, 0.18)',
  },
  shareSheetWrap: {
    paddingHorizontal: 0,
  },
  shareSheet: {
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    backgroundColor: 'rgba(245, 246, 249, 1)',
    paddingTop: 20,
  },
  shareOptionsRow: {
    paddingHorizontal: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  shareOption: {
    width: 62,
    alignItems: 'center',
  },
  shareOptionPressed: {
    opacity: 0.86,
  },
  shareOptionIconFrame: {
    width: 56,
    height: 56,
    borderRadius: 12,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  shareOptionLabel: {
    marginTop: 8,
    fontSize: 13,
    lineHeight: 17,
    textAlign: 'center',
    color: 'rgba(107, 112, 119, 1)',
  },
  shareDivider: {
    height: StyleSheet.hairlineWidth,
    marginTop: 18,
    marginBottom: 18,
    backgroundColor: 'rgba(214, 217, 222, 1)',
  },
  shareCancelButton: {
    height: 56,
    marginTop: 22,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  shareCancelButtonPressed: {
    opacity: 0.9,
  },
  shareCancelText: {
    fontSize: 18,
    lineHeight: 22,
    fontWeight: '600',
    color: 'rgba(26, 29, 33, 1)',
  },
});
