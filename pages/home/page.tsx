import { useEffect, useRef, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { Divider } from '@rneui/themed';
import { LinearGradient } from 'expo-linear-gradient';
import {
  Animated,
  FlatList,
  Image,
  Keyboard,
  LayoutAnimation,
  PanResponder,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  UIManager,
  View,
  useWindowDimensions,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from 'react-native';

import { FEED_CARDS, type FeedCard } from './feed-data';
import PostDetailPage from './post-detail-page';

type SortTabId = 'role-1' | 'role-2' | 'role-3' | 'direction';

type SortTabItem = {
  id: SortTabId;
  label: string;
  sortIndex: number;
};

type FeaturedCard = {
  badge: string;
  id: string;
  post: FeedCard;
  publisher: string;
  time: string;
  title: string;
  views: string;
};

type HomePageProps = {
  onDetailVisibilityChange?: (visible: boolean) => void;
};

const SORT_TABS: SortTabItem[] = [
  { id: 'role-1', label: '岗位一', sortIndex: 0 },
  { id: 'role-2', label: '岗位二', sortIndex: 1 },
  { id: 'role-3', label: '岗位三', sortIndex: 2 },
  { id: 'direction', label: '探索方向', sortIndex: 3 },
];

const FEATURED_CARDS: FeaturedCard[] = [
  {
    id: 'featured-1',
    badge: 'Design Thinking',
    title: '先把职业方向想明白，再谈下一步怎么走',
    publisher: '鸡蛋网',
    views: '28',
    time: '12h',
    post: FEED_CARDS[0],
  },
  {
    id: 'featured-2',
    badge: 'Creative Workflow',
    title: '碎片时间一样能推进规划，关键是动作够小',
    publisher: '小步实验室',
    views: '34',
    time: '9h',
    post: FEED_CARDS[1],
  },
  {
    id: 'featured-3',
    badge: 'Career Signals',
    title: '转方向先别盲学，先画清楚自己的能力地图',
    publisher: '职业方法论',
    views: '19',
    time: '7h',
    post: FEED_CARDS[2],
  },
  {
    id: 'featured-4',
    badge: 'Explore Path',
    title: '兴趣不要只停留在想法，先做一次小验证',
    publisher: '设计求职手册',
    views: '23',
    time: '5h',
    post: FEED_CARDS[3],
  },
];

function createSortDragValues() {
  return {
    'role-1': new Animated.Value(0),
    'role-2': new Animated.Value(0),
    'role-3': new Animated.Value(0),
    direction: new Animated.Value(0),
  } satisfies Record<SortTabId, Animated.Value>;
}

function reorderItems<T>(items: T[], fromIndex: number, toIndex: number) {
  const nextItems = [...items];
  const [movedItem] = nextItems.splice(fromIndex, 1);

  nextItems.splice(toIndex, 0, movedItem);

  return nextItems;
}

export default function HomePage({ onDetailVisibilityChange }: HomePageProps) {
  const [sortTabs, setSortTabs] = useState<SortTabItem[]>(SORT_TABS);
  const [isSortEditing, setIsSortEditing] = useState(false);
  const [draggingSortId, setDraggingSortId] = useState<SortTabId | null>(null);
  const [activeFeature, setActiveFeature] = useState(0);
  const [selectedFeedCard, setSelectedFeedCard] = useState<FeedCard | null>(null);
  const { width: screenWidth } = useWindowDimensions();
  const shakeValue = useRef(new Animated.Value(0)).current;
  const sortDragValuesRef = useRef(createSortDragValues());
  const contentWidth = Math.min(screenWidth - 32, 358);
  const featuredCardWidth = Math.min(screenWidth - 60, 316);
  const featuredGap = 14;
  const featuredSnapInterval = featuredCardWidth + featuredGap;
  const featuredSideInset = Math.max((screenWidth - contentWidth) / 2, 16);
  const sortButtonWidth = 58;
  const sortTabsGap = 10;
  const sortTabsWidth = contentWidth - sortButtonWidth - sortTabsGap;
  const sortChipGap = 8;
  const sortChipHeight = 34;
  const sortSlotWidth =
    sortTabs.length > 0 ? (sortTabsWidth - sortChipGap * (sortTabs.length - 1)) / sortTabs.length : 0;
  const sortSlotSpan = sortSlotWidth + sortChipGap;
  const sortedFeaturedCards = FEATURED_CARDS;
  const sortedFeedCards = FEED_CARDS;

  useEffect(() => {
    if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
      UIManager.setLayoutAnimationEnabledExperimental(true);
    }
  }, []);

  useEffect(() => {
    onDetailVisibilityChange?.(selectedFeedCard !== null);
  }, [onDetailVisibilityChange, selectedFeedCard]);

  useEffect(() => {
    return () => {
      onDetailVisibilityChange?.(false);
    };
  }, [onDetailVisibilityChange]);

  useEffect(() => {
    if (!isSortEditing) {
      shakeValue.stopAnimation();
      shakeValue.setValue(0);
      return;
    }

    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(shakeValue, {
          toValue: 1,
          duration: 90,
          useNativeDriver: true,
        }),
        Animated.timing(shakeValue, {
          toValue: -1,
          duration: 90,
          useNativeDriver: true,
        }),
        Animated.timing(shakeValue, {
          toValue: 0,
          duration: 90,
          useNativeDriver: true,
        }),
      ])
    );

    animation.start();

    return () => {
      animation.stop();
      shakeValue.stopAnimation();
      shakeValue.setValue(0);
    };
  }, [isSortEditing, shakeValue]);

  const resetSortDragValues = () => {
    Object.values(sortDragValuesRef.current).forEach((value) => {
      value.stopAnimation();
      value.setValue(0);
    });
  };

  const handleSortModePress = () => {
    Keyboard.dismiss();
    resetSortDragValues();
    setDraggingSortId(null);
    setIsSortEditing((current) => !current);
  };

  const finishSortDrag = (itemId: SortTabId, dragDistance: number) => {
    const dragValue = sortDragValuesRef.current[itemId];

    setSortTabs((currentTabs) => {
      const fromIndex = currentTabs.findIndex((item) => item.id === itemId);

      if (fromIndex === -1) {
        return currentTabs;
      }

      const slotShift = Math.round(dragDistance / sortSlotSpan);
      const toIndex = Math.max(0, Math.min(currentTabs.length - 1, fromIndex + slotShift));

      if (toIndex === fromIndex) {
        return currentTabs;
      }

      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);

      dragValue.setValue(dragDistance - (toIndex - fromIndex) * sortSlotSpan);

      return reorderItems(currentTabs, fromIndex, toIndex);
    });

    Animated.spring(dragValue, {
      toValue: 0,
      speed: 18,
      bounciness: 6,
      useNativeDriver: true,
    }).start();

    setDraggingSortId(null);
  };

  const buildSortPanResponder = (itemId: SortTabId) =>
    PanResponder.create({
      onStartShouldSetPanResponder: () => isSortEditing,
      onMoveShouldSetPanResponder: (_, gestureState) =>
        isSortEditing &&
        Math.abs(gestureState.dx) > 2 &&
        Math.abs(gestureState.dx) > Math.abs(gestureState.dy),
      onPanResponderGrant: () => {
        Keyboard.dismiss();
        setDraggingSortId(itemId);
      },
      onPanResponderMove: (_, gestureState) => {
        sortDragValuesRef.current[itemId].setValue(gestureState.dx);
      },
      onPanResponderRelease: (_, gestureState) => {
        finishSortDrag(itemId, gestureState.dx);
      },
      onPanResponderTerminate: (_, gestureState) => {
        finishSortDrag(itemId, gestureState.dx);
      },
      onPanResponderTerminationRequest: () => false,
    });

  const handleFeaturedMomentumEnd = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const nextIndex = Math.round(event.nativeEvent.contentOffset.x / featuredSnapInterval);
    const safeIndex = Math.max(0, Math.min(sortedFeaturedCards.length - 1, nextIndex));

    setActiveFeature(safeIndex);
  };

  const renderSortTab = (item: SortTabItem, index: number) => {
    const dragValue = sortDragValuesRef.current[item.id];
    const dragging = draggingSortId === item.id;
    const rotate = isSortEditing
      ? shakeValue.interpolate({
          inputRange: [-1, 0, 1],
          outputRange:
            index % 2 === 0 ? ['-1.8deg', '0deg', '1.8deg'] : ['1.8deg', '0deg', '-1.8deg'],
        })
      : '0deg';
    const panResponder = isSortEditing ? buildSortPanResponder(item.id) : undefined;

    return (
      <Animated.View
        key={item.id}
        style={[
          styles.sortTabSlot,
          {
            width: sortSlotWidth,
            left: index * sortSlotSpan,
            zIndex: dragging ? 40 : sortTabs.length - index,
            transform: [
              { translateX: dragValue },
              { rotateZ: rotate as unknown as string },
              { scale: dragging ? 1.04 : 1 },
            ],
          },
        ]}
        {...panResponder?.panHandlers}
      >
        <Pressable
          disabled
          style={[
            styles.sortTabChip,
            { height: sortChipHeight },
            isSortEditing && styles.sortTabChipEditing,
            dragging && styles.sortTabChipDragging,
          ]}
        >
          <Text numberOfLines={1} style={styles.sortTabText}>
            {item.label}
          </Text>
        </Pressable>
      </Animated.View>
    );
  };

  const renderFeaturedCard = (item: FeaturedCard, index: number) => {
    return (
      <Pressable
        key={item.id}
        onPress={() => {
          Keyboard.dismiss();
          setSelectedFeedCard(item.post);
        }}
        style={({ pressed }) => [
          styles.featuredCard,
          {
            width: featuredCardWidth,
            marginRight: index === sortedFeaturedCards.length - 1 ? 0 : featuredGap,
          },
          pressed && styles.featuredCardPressed,
        ]}
      >
        <LinearGradient
          colors={item.post.coverGradient}
          end={{ x: 1, y: 1 }}
          start={{ x: 0, y: 0 }}
          style={styles.featuredImageFrame}
        >
          <Image resizeMode="contain" source={item.post.cover} style={styles.featuredImage} />

          <View style={styles.featuredBadge}>
            <Text style={styles.featuredBadgeText}>{item.badge}</Text>
          </View>
        </LinearGradient>

        <Text numberOfLines={2} style={styles.featuredTitle}>
          {item.title}
        </Text>

        <View style={styles.metaRow}>
          <Text numberOfLines={1} style={styles.metaText}>
            {item.publisher}
          </Text>
          <View style={styles.metaDot} />
          <Ionicons color="rgba(174, 180, 186, 1)" name="chatbubble-ellipses-outline" size={14} />
          <Text style={styles.metaText}>{item.views}</Text>
          <Text style={styles.metaText}>{item.time}</Text>
          <Ionicons
            color="rgba(174, 180, 186, 1)"
            name="ellipsis-horizontal"
            size={16}
            style={styles.trailingMetaIcon}
          />
        </View>
      </Pressable>
    );
  };

  const renderFeedCard = (item: FeedCard) => (
    <Pressable
      key={item.id}
      onPress={() => {
        Keyboard.dismiss();
        setSelectedFeedCard(item);
      }}
      style={({ pressed }) => [
        styles.feedCard,
        { width: contentWidth },
        pressed && styles.feedCardPressed,
      ]}
    >
      <LinearGradient
        colors={item.coverGradient}
        end={{ x: 1, y: 1 }}
        start={{ x: 0, y: 0 }}
        style={styles.feedThumb}
      >
        <Image resizeMode="contain" source={item.cover} style={styles.feedThumbImage} />
      </LinearGradient>

      <View style={styles.feedCardBody}>
        <Text numberOfLines={3} style={styles.feedTitle}>
          {item.title}
        </Text>

        <View style={styles.metaRow}>
          <Text numberOfLines={1} style={styles.metaText}>
            {item.author}
          </Text>
          <View style={styles.metaDot} />
          <Ionicons color="rgba(174, 180, 186, 1)" name="chatbubble-ellipses-outline" size={14} />
          <Text style={styles.metaText}>{item.views}</Text>
          <Text style={styles.metaText}>{item.time}</Text>
          <Ionicons
            color="rgba(174, 180, 186, 1)"
            name="ellipsis-horizontal"
            size={16}
            style={styles.trailingMetaIcon}
          />
        </View>
      </View>
    </Pressable>
  );

  return (
    <View style={styles.pageWrap}>
      <View style={styles.fixedHeader}>
        <View style={[styles.topRow, { width: contentWidth }]}>
          <View style={styles.avatarFrame}>
            <Ionicons color="rgba(79, 102, 92, 0.88)" name="person-outline" size={20} />
          </View>

          <View style={styles.searchBox}>
            <Ionicons color="rgba(126, 140, 147, 1)" name="search-outline" size={14} />
            <TextInput
              placeholder="搜索"
              placeholderTextColor="rgba(145, 153, 160, 1)"
              style={styles.searchInput}
            />
          </View>
        </View>

        <View style={[styles.tabsSection, { width: contentWidth }]}>
          <View style={styles.sortRow}>
            <Pressable
              hitSlop={8}
              onPress={handleSortModePress}
              style={[styles.sortActionButton, isSortEditing && styles.sortActionButtonActive]}
            >
              <Text style={[styles.sortActionText, isSortEditing && styles.sortActionTextActive]}>
                {isSortEditing ? '完成' : '排序'}
              </Text>
            </Pressable>

            <View
              style={[styles.sortTabsWrap, { width: sortTabsWidth, paddingTop: isSortEditing ? 34 : 0 }]}
            >
              {isSortEditing ? (
                <View style={styles.sortHintBubble}>
                  <Text style={styles.sortHintText}>拖动方框排序</Text>
                  <View style={styles.sortHintCaret} />
                </View>
              ) : null}

              <View style={[styles.sortTabsTrack, { height: sortChipHeight }]}>
                {sortTabs.map(renderSortTab)}
              </View>
            </View>
          </View>

          <Divider color="rgba(48, 54, 50, 0.84)" style={styles.tabsDivider} />
        </View>
      </View>

      <FlatList
        data={sortedFeedCards}
        initialNumToRender={4}
        ItemSeparatorComponent={() => <View style={styles.feedSpacer} />}
        keyboardDismissMode="on-drag"
        keyboardShouldPersistTaps="handled"
        keyExtractor={(item) => item.id}
        ListHeaderComponent={
          <View style={styles.feedHeader}>
            <FlatList
              data={sortedFeaturedCards}
              decelerationRate="fast"
              disableIntervalMomentum
              getItemLayout={(_, index) => ({
                length: featuredSnapInterval,
                offset: featuredSnapInterval * index,
                index,
              })}
              horizontal
              initialNumToRender={3}
              keyExtractor={(item) => item.id}
              keyboardDismissMode="on-drag"
              keyboardShouldPersistTaps="handled"
              maxToRenderPerBatch={3}
              nestedScrollEnabled
              onMomentumScrollEnd={handleFeaturedMomentumEnd}
              removeClippedSubviews={Platform.OS === 'android'}
              renderItem={({ item, index }) => renderFeaturedCard(item, index)}
              showsHorizontalScrollIndicator={false}
              snapToAlignment="start"
              snapToInterval={featuredSnapInterval}
              windowSize={3}
              contentContainerStyle={{
                paddingLeft: featuredSideInset,
                paddingRight: featuredSideInset + 36,
              }}
              style={styles.featuredList}
            />

            <View style={styles.paginationRow}>
              {sortedFeaturedCards.map((item, index) => (
                <View
                  key={item.id}
                  style={[styles.paginationDot, index === activeFeature && styles.paginationDotActive]}
                />
              ))}
            </View>
          </View>
        }
        maxToRenderPerBatch={4}
        removeClippedSubviews={Platform.OS === 'android'}
        renderItem={({ item }) => renderFeedCard(item)}
        showsVerticalScrollIndicator={false}
        style={styles.feedList}
        contentContainerStyle={styles.feedContent}
        windowSize={5}
      />

      {selectedFeedCard ? (
        <View style={styles.detailOverlay}>
          <PostDetailPage onBack={() => setSelectedFeedCard(null)} post={selectedFeedCard} />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  pageWrap: {
    flex: 1,
  },
  detailOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 80,
  },
  fixedHeader: {
    paddingTop: 70,
  },
  topRow: {
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarFrame: {
    width: 41,
    height: 41,
    borderRadius: 20.5,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.74)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.92)',
    shadowColor: 'rgba(82, 128, 118, 0.16)',
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowOpacity: 1,
    shadowRadius: 12,
    elevation: 4,
  },
  searchBox: {
    flex: 1,
    height: 31,
    marginLeft: 9,
    borderRadius: 15.5,
    paddingHorizontal: 11,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.78)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.92)',
    shadowColor: 'rgba(82, 128, 118, 0.12)',
    shadowOffset: {
      width: 0,
      height: 5,
    },
    shadowOpacity: 1,
    shadowRadius: 10,
    elevation: 3,
  },
  searchInput: {
    flex: 1,
    height: '100%',
    marginLeft: 6,
    paddingVertical: 0,
    fontSize: 12,
    color: 'rgba(57, 70, 76, 1)',
  },
  tabsSection: {
    alignSelf: 'center',
    marginTop: 10,
  },
  sortRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  sortActionButton: {
    width: 58,
    height: 34,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.68)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.92)',
  },
  sortActionButtonActive: {
    backgroundColor: 'rgba(86, 168, 124, 1)',
    borderColor: 'rgba(86, 168, 124, 1)',
  },
  sortActionText: {
    fontSize: 16,
    lineHeight: 18,
    fontWeight: '600',
    color: 'rgba(34, 38, 36, 1)',
  },
  sortActionTextActive: {
    color: '#ffffff',
  },
  sortTabsWrap: {
    marginLeft: 10,
    position: 'relative',
  },
  sortHintBubble: {
    position: 'absolute',
    top: 0,
    right: 6,
    zIndex: 60,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 14,
    backgroundColor: 'rgba(43, 57, 48, 0.92)',
    shadowColor: 'rgba(0, 0, 0, 0.14)',
    shadowOffset: {
      width: 0,
      height: 5,
    },
    shadowOpacity: 1,
    shadowRadius: 12,
    elevation: 5,
  },
  sortHintText: {
    fontSize: 12,
    lineHeight: 14,
    fontWeight: '500',
    color: '#ffffff',
  },
  sortHintCaret: {
    position: 'absolute',
    right: 18,
    bottom: -4,
    width: 8,
    height: 8,
    backgroundColor: 'rgba(43, 57, 48, 0.92)',
    transform: [{ rotate: '45deg' }],
  },
  sortTabsTrack: {
    position: 'relative',
  },
  sortTabSlot: {
    position: 'absolute',
    top: 0,
  },
  sortTabChip: {
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.76)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.94)',
  },
  sortTabChipEditing: {
    backgroundColor: 'rgba(255, 255, 255, 0.96)',
    borderColor: 'rgba(195, 205, 201, 0.92)',
  },
  sortTabChipDragging: {
    shadowColor: 'rgba(68, 89, 82, 0.18)',
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 1,
    shadowRadius: 18,
    elevation: 8,
  },
  sortTabText: {
    fontSize: 13,
    lineHeight: 16,
    fontWeight: '500',
    color: 'rgba(136, 145, 142, 1)',
  },
  tabsDivider: {
    height: 1,
    opacity: 0.92,
    marginTop: 10,
  },
  feedList: {
    flex: 1,
  },
  feedContent: {
    paddingTop: 18,
    paddingBottom: 138,
  },
  feedHeader: {
    marginBottom: 18,
  },
  feedSpacer: {
    height: 16,
  },
  featuredList: {
    overflow: 'visible',
  },
  featuredCard: {
    borderRadius: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.94)',
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(231, 235, 234, 0.95)',
  },
  featuredCardPressed: {
    opacity: 0.94,
    transform: [{ scale: 0.99 }],
  },
  featuredImageFrame: {
    height: 214,
    borderRadius: 22,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  featuredImage: {
    width: '82%',
    height: '82%',
  },
  featuredBadge: {
    position: 'absolute',
    top: 14,
    left: 14,
    borderRadius: 999,
    backgroundColor: 'rgba(157, 212, 113, 0.96)',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  featuredBadgeText: {
    fontSize: 13,
    lineHeight: 15,
    fontWeight: '500',
    color: 'rgba(73, 95, 53, 1)',
  },
  featuredTitle: {
    marginTop: 16,
    fontSize: 19,
    lineHeight: 30,
    fontWeight: '500',
    color: 'rgba(31, 36, 39, 1)',
  },
  metaRow: {
    marginTop: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },
  metaText: {
    maxWidth: 110,
    marginRight: 10,
    fontSize: 12,
    lineHeight: 14,
    color: 'rgba(174, 180, 186, 1)',
  },
  metaDot: {
    width: 6,
    height: 6,
    borderRadius: 999,
    marginRight: 10,
    backgroundColor: 'rgba(189, 193, 198, 1)',
  },
  trailingMetaIcon: {
    marginLeft: 'auto',
  },
  paginationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 14,
  },
  paginationDot: {
    width: 5,
    height: 5,
    borderRadius: 999,
    marginHorizontal: 3,
    backgroundColor: 'rgba(158, 194, 188, 0.45)',
  },
  paginationDotActive: {
    width: 15,
    backgroundColor: 'rgba(61, 135, 126, 1)',
  },
  feedCard: {
    alignSelf: 'center',
    flexDirection: 'row',
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.96)',
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(231, 235, 234, 0.95)',
  },
  feedCardPressed: {
    opacity: 0.92,
    transform: [{ scale: 0.99 }],
  },
  feedThumb: {
    width: 120,
    height: 120,
    borderRadius: 18,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  feedThumbImage: {
    width: '82%',
    height: '82%',
  },
  feedCardBody: {
    flex: 1,
    marginLeft: 16,
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  feedTitle: {
    fontSize: 18,
    lineHeight: 28,
    fontWeight: '500',
    color: 'rgba(28, 33, 36, 1)',
  },
});
