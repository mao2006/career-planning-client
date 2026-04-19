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
import { HOME_ROLE_OPTIONS, type HomeRoleId } from './home-role-config';
import PostDetailPage from './post-detail-page';

type SortTabId = HomeRoleId;

type SortTabItem = {
  id: SortTabId;
  label: string;
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

const SORT_TABS: SortTabItem[] = HOME_ROLE_OPTIONS.map((item) => ({
  id: item.id,
  label: item.label,
}));

function normalizeSearchText(value: string) {
  return value.trim().toLowerCase();
}

function createSortDragValues() {
  return {
    cpp: new Animated.Value(0),
    backend: new Animated.Value(0),
    embedded: new Animated.Value(0),
    direction: new Animated.Value(0),
  } satisfies Record<SortTabId, Animated.Value>;
}

function createRoleOrderMap() {
  return {
    cpp: 0,
    backend: 1,
    embedded: 2,
    direction: 3,
  } satisfies Record<SortTabId, number>;
}

function buildFeaturedCard(post: FeedCard): FeaturedCard {
  return {
    id: `featured-${post.id}`,
    badge: post.featuredBadge ?? post.roleLabel,
    post,
    publisher: post.author,
    time: post.time,
    title: post.title,
    views: post.views,
  };
}

function reorderItems<T>(items: T[], fromIndex: number, toIndex: number) {
  const nextItems = [...items];
  const [movedItem] = nextItems.splice(fromIndex, 1);

  nextItems.splice(toIndex, 0, movedItem);

  return nextItems;
}

export default function HomePage({ onDetailVisibilityChange }: HomePageProps) {
  const [sortTabs, setSortTabs] = useState<SortTabItem[]>(SORT_TABS);
  const [activeRoleId, setActiveRoleId] = useState<SortTabId>(SORT_TABS[0].id);
  const [isSortEditing, setIsSortEditing] = useState(false);
  const [draggingSortId, setDraggingSortId] = useState<SortTabId | null>(null);
  const [activeFeature, setActiveFeature] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
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
  const sortChipHeight = 44;
  const sortSlotWidth =
    sortTabs.length > 0 ? (sortTabsWidth - sortChipGap * (sortTabs.length - 1)) / sortTabs.length : 0;
  const sortSlotSpan = sortSlotWidth + sortChipGap;
  const normalizedSearchQuery = normalizeSearchText(searchQuery);
  const hasSearchQuery = normalizedSearchQuery.length > 0;
  const roleOrderMap = sortTabs.reduce<Record<SortTabId, number>>((result, item, index) => {
    result[item.id] = index;

    return result;
  }, createRoleOrderMap());
  const searchableFeedCards = FEED_CARDS.filter((card) => {
    if (!hasSearchQuery) {
      return true;
    }

    const searchableContent = [card.title, card.author, card.roleLabel, ...card.body].join('\n');

    return normalizeSearchText(searchableContent).includes(normalizedSearchQuery);
  });
  const sortedFeaturedCards = sortTabs
    .map((item) => searchableFeedCards.find((card) => card.roleId === item.id && card.featured))
    .filter((card): card is FeedCard => card !== undefined)
    .map(buildFeaturedCard);
  const sortedFeedCards = searchableFeedCards
    .map((card, index) => ({ card, index }))
    .sort((left, right) => {
      const roleOffset = roleOrderMap[left.card.roleId] - roleOrderMap[right.card.roleId];

      if (roleOffset !== 0) {
        return roleOffset;
      }

      return left.index - right.index;
    })
    .map((entry) => entry.card);
  const visibleFeaturedCards = hasSearchQuery
    ? []
    : sortedFeaturedCards.filter((card) => card.post.roleId === activeRoleId);
  const visibleFeedCards = hasSearchQuery
    ? sortedFeedCards
    : sortedFeedCards.filter((card) => card.roleId === activeRoleId);

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
    setActiveFeature(0);
  }, [activeRoleId, hasSearchQuery, sortTabs]);

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

  useEffect(() => {
    if (!hasSearchQuery) {
      return;
    }

    resetSortDragValues();
    setDraggingSortId(null);
    setIsSortEditing(false);
  }, [hasSearchQuery]);

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

    setActiveRoleId(itemId);
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
    if (visibleFeaturedCards.length === 0) {
      setActiveFeature(0);

      return;
    }

    const nextIndex = Math.round(event.nativeEvent.contentOffset.x / featuredSnapInterval);
    const safeIndex = Math.max(0, Math.min(visibleFeaturedCards.length - 1, nextIndex));

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
          disabled={isSortEditing}
          onPress={() => {
            Keyboard.dismiss();
            setActiveRoleId(item.id);
          }}
          style={[
            styles.sortTabChip,
            { height: sortChipHeight },
            !isSortEditing && activeRoleId === item.id && styles.sortTabChipActive,
            isSortEditing && styles.sortTabChipEditing,
            dragging && styles.sortTabChipDragging,
          ]}
        >
          <Text
            numberOfLines={2}
            style={[styles.sortTabText, !isSortEditing && activeRoleId === item.id && styles.sortTabTextActive]}
          >
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
            marginRight: index === visibleFeaturedCards.length - 1 ? 0 : featuredGap,
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
          <Image resizeMode="cover" source={item.post.cover} style={styles.featuredImage} />

          <View style={styles.featuredBadge}>
            <Text numberOfLines={1} style={styles.featuredBadgeText}>
              {item.badge}
            </Text>
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
        <Image resizeMode="cover" source={item.cover} style={styles.feedThumbImage} />
      </LinearGradient>

      <View style={styles.feedCardBody}>
        <Text numberOfLines={3} style={styles.feedTitle}>
          {item.title}
        </Text>

        <View style={styles.feedSourceBadge}>
          <Text numberOfLines={1} style={styles.feedSourceText}>
            来源：{item.author}
          </Text>
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
              onChangeText={setSearchQuery}
              style={styles.searchInput}
              value={searchQuery}
            />
          </View>
        </View>

        {!hasSearchQuery ? (
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
                style={[styles.sortTabsWrap, { width: sortTabsWidth, paddingTop: isSortEditing ? 38 : 0 }]}
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
        ) : null}
      </View>

      <FlatList
        data={visibleFeedCards}
        initialNumToRender={4}
        ItemSeparatorComponent={() => <View style={styles.feedSpacer} />}
        keyboardDismissMode="on-drag"
        keyboardShouldPersistTaps="handled"
        keyExtractor={(item) => item.id}
        ListEmptyComponent={
          hasSearchQuery ? (
            <View style={[styles.emptyStateCard, { width: contentWidth }]}>
              <Text style={styles.emptyStateTitle}>未找到相关文章</Text>
              <Text style={styles.emptyStateBody}>可以试试岗位名、文章标题或来源关键词。</Text>
            </View>
          ) : null
        }
        ListHeaderComponent={
          !hasSearchQuery ? (
            <View style={styles.feedHeader}>
              <FlatList
                key={`featured-${activeRoleId}-${sortTabs.map((item) => item.id).join('-')}`}
                data={visibleFeaturedCards}
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
                {visibleFeaturedCards.map((item, index) => (
                  <View
                    key={item.id}
                    style={[styles.paginationDot, index === activeFeature && styles.paginationDotActive]}
                  />
                ))}
              </View>
            </View>
          ) : (
            <View style={[styles.searchSummaryCard, { width: contentWidth }]}>
              <Text style={styles.searchSummaryText}>根据“{searchQuery.trim()}”找到 {sortedFeedCards.length} 篇文章</Text>
            </View>
          )
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
          <PostDetailPage key={selectedFeedCard.id} onBack={() => setSelectedFeedCard(null)} post={selectedFeedCard} />
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
    paddingHorizontal: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.76)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.94)',
  },
  sortTabChipActive: {
    backgroundColor: 'rgba(90, 180, 154, 0.18)',
    borderColor: 'rgba(90, 180, 154, 0.9)',
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
    fontSize: 11,
    lineHeight: 14,
    fontWeight: '500',
    textAlign: 'center',
    color: 'rgba(136, 145, 142, 1)',
  },
  sortTabTextActive: {
    color: 'rgba(41, 115, 102, 1)',
    fontWeight: '700',
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
  searchSummaryCard: {
    alignSelf: 'center',
    marginBottom: 16,
    borderRadius: 22,
    backgroundColor: 'rgba(227, 244, 239, 0.96)',
    borderWidth: 1,
    borderColor: 'rgba(173, 216, 205, 0.92)',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  searchSummaryText: {
    fontSize: 16,
    lineHeight: 22,
    fontWeight: '700',
    color: 'rgba(31, 48, 44, 1)',
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
    width: '100%',
    height: '100%',
  },
  featuredBadge: {
    position: 'absolute',
    top: 14,
    left: 14,
    borderRadius: 999,
    backgroundColor: 'rgba(157, 212, 113, 0.96)',
    maxWidth: '68%',
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  featuredBadgeText: {
    fontSize: 12,
    lineHeight: 14,
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
    width: '100%',
    height: '100%',
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
  feedSourceBadge: {
    alignSelf: 'flex-start',
    borderRadius: 999,
    backgroundColor: 'rgba(237, 244, 242, 1)',
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  feedSourceText: {
    maxWidth: 170,
    fontSize: 12,
    lineHeight: 14,
    fontWeight: '500',
    color: 'rgba(100, 122, 118, 1)',
  },
  emptyStateCard: {
    alignSelf: 'center',
    marginTop: 18,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.94)',
    paddingHorizontal: 20,
    paddingVertical: 24,
    borderWidth: 1,
    borderColor: 'rgba(231, 235, 234, 0.95)',
  },
  emptyStateTitle: {
    fontSize: 18,
    lineHeight: 24,
    fontWeight: '600',
    color: 'rgba(41, 46, 49, 1)',
  },
  emptyStateBody: {
    marginTop: 8,
    fontSize: 14,
    lineHeight: 22,
    color: 'rgba(123, 132, 138, 1)',
  },
});
