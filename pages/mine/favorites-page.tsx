import { useRef, useState } from 'react';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import {
  Animated,
  Pressable,
  PanResponder,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type FavoritesPageProps = {
  onBack?: () => void;
};

type FavoriteFolder = {
  colors: [string, string];
  count: number;
  id: string;
  title: string;
};

type FavoriteItem = {
  folderId: string;
  id: string;
  joinedPlan: boolean;
  saved: boolean;
  savedAt: number;
  summary: string;
  title: string;
};

const INITIAL_FOLDERS: FavoriteFolder[] = [
  {
    id: 'create',
    title: '新建文件夹',
    count: 27,
    colors: ['rgba(22, 206, 203, 1)', 'rgba(65, 194, 171, 1)'],
  },
  {
    id: 'folder-1',
    title: '计算机',
    count: 123,
    colors: ['rgba(22, 206, 203, 1)', 'rgba(18, 168, 190, 1)'],
  },
  {
    id: 'folder-2',
    title: '数据科学',
    count: 65,
    colors: ['rgba(32, 191, 202, 1)', 'rgba(76, 210, 170, 1)'],
  },
  {
    id: 'folder-3',
    title: '产品方向',
    count: 41,
    colors: ['rgba(72, 203, 201, 1)', 'rgba(26, 168, 220, 1)'],
  },
];

const INITIAL_ITEMS: FavoriteItem[] = [
  {
    id: 'favorite-1',
    folderId: 'folder-1',
    title: '标题一',
    summary: '把课程项目整理成更像求职作品的表达方式，适合后续直接放进简历或作品集。',
    saved: true,
    joinedPlan: false,
    savedAt: 7,
  },
  {
    id: 'favorite-2',
    folderId: 'folder-2',
    title: '标题二',
    summary: '如果你打算转向数据科学，先验证自己更适合分析、建模还是产品分析这个交叉位置。',
    saved: true,
    joinedPlan: true,
    savedAt: 6,
  },
  {
    id: 'favorite-3',
    folderId: 'folder-1',
    title: '标题三',
    summary: '作品集不一定多，关键是每个案例都能讲清楚问题、过程、决策和结果。',
    saved: true,
    joinedPlan: false,
    savedAt: 5,
  },
  {
    id: 'favorite-4',
    folderId: 'folder-3',
    title: '标题四',
    summary: '岗位信息收集时不要只看 JD，可以额外看团队博客、面经和真实项目语境。',
    saved: false,
    joinedPlan: false,
    savedAt: 4,
  },
  {
    id: 'favorite-5',
    folderId: 'folder-2',
    title: '标题五',
    summary: '做职业规划时，先把想尝试的方向控制在两个以内，更容易做出有效验证。',
    saved: true,
    joinedPlan: false,
    savedAt: 3,
  },
  {
    id: 'favorite-6',
    folderId: 'folder-3',
    title: '标题六',
    summary: '面试准备时，把经历拆成情境、动作、结果三段，比平铺经历更容易说清重点。',
    saved: false,
    joinedPlan: false,
    savedAt: 2,
  },
];

export default function FavoritesPage({ onBack }: FavoritesPageProps) {
  const [folders, setFolders] = useState(INITIAL_FOLDERS);
  const [items, setItems] = useState(INITIAL_ITEMS);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [sortDescending, setSortDescending] = useState(true);
  const insets = useSafeAreaInsets();
  const { width: screenWidth } = useWindowDimensions();
  const swipeTranslateX = useRef(new Animated.Value(0)).current;
  const contentWidth = Math.min(screenWidth - 30, 390);
  const headerHeight = insets.top + 88;

  const edgeSwipeResponder = PanResponder.create({
    onMoveShouldSetPanResponder: (_, gestureState) =>
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

  const handleCreateFolder = () => {
    const nextIndex = folders.filter((folder) => folder.id !== 'create').length + 1;

    setFolders((current) => [
      ...current,
      {
        id: `folder-created-${nextIndex}`,
        title: `新文件夹${nextIndex}`,
        count: 0,
        colors: ['rgba(59, 204, 188, 1)', 'rgba(31, 169, 216, 1)'],
      },
    ]);
  };

  const toggleSaved = (itemId: string) => {
    setItems((current) =>
      current.map((item) => (item.id === itemId ? { ...item, saved: !item.saved } : item))
    );
  };

  const toggleJoinedPlan = (itemId: string) => {
    setItems((current) =>
      current.map((item) => (item.id === itemId ? { ...item, joinedPlan: !item.joinedPlan } : item))
    );
  };

  const normalizedKeyword = searchKeyword.trim().toLowerCase();
  const visibleItems = items
    .filter((item) => (selectedFolderId ? item.folderId === selectedFolderId : true))
    .filter((item) =>
      normalizedKeyword.length === 0
        ? true
        : `${item.title}${item.summary}`.toLowerCase().includes(normalizedKeyword)
    )
    .sort((left, right) => (sortDescending ? right.savedAt - left.savedAt : left.savedAt - right.savedAt));

  return (
    <View style={styles.screen}>
      <StatusBar style="dark" />

      <Animated.View
        style={[
          styles.pageLayer,
          {
            transform: [{ translateX: swipeTranslateX }],
          },
        ]}
        {...edgeSwipeResponder.panHandlers}
      >
        <LinearGradient
          colors={['rgba(168, 237, 229, 1)', 'rgba(178, 234, 229, 0.92)']}
          end={{ x: 1, y: 1 }}
          start={{ x: 0, y: 0 }}
          style={[
            styles.headerBar,
            {
              height: headerHeight,
              paddingTop: insets.top + 10,
            },
          ]}
        >
          <View style={[styles.headerRow, { width: contentWidth }]}>
            <Pressable hitSlop={12} onPress={onBack} style={styles.backButton}>
              <Ionicons color="rgba(120, 131, 136, 1)" name="chevron-back" size={30} />
            </Pressable>
            <Text style={styles.headerTitle}>收藏夹</Text>
          </View>
        </LinearGradient>

        <ScrollView
          bounces={false}
          contentContainerStyle={{
            paddingTop: headerHeight + 18,
            paddingBottom: Math.max(insets.bottom + 28, 36),
          }}
          nestedScrollEnabled
          showsVerticalScrollIndicator={false}
          style={styles.scrollView}
        >
          <View style={[styles.contentWrap, { width: contentWidth }]}>
            <View style={styles.searchWrap}>
              <Ionicons color="rgba(138, 145, 154, 1)" name="search-outline" size={18} />
              <TextInput
                onChangeText={setSearchKeyword}
                placeholder="搜索"
                placeholderTextColor="rgba(174, 181, 188, 1)"
                style={styles.searchInput}
                value={searchKeyword}
              />
            </View>

            <ScrollView
              horizontal
              nestedScrollEnabled
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.folderScrollContent}
              style={styles.folderScroll}
            >
              {folders.map((folder) => {
                const active = selectedFolderId === folder.id;
                const isCreateCard = folder.id === 'create';

                return (
                  <Pressable
                    key={folder.id}
                    onPress={() => {
                      if (isCreateCard) {
                        handleCreateFolder();
                        return;
                      }

                      setSelectedFolderId((current) => (current === folder.id ? null : folder.id));
                    }}
                    style={[
                      styles.folderCardWrap,
                      active && styles.folderCardWrapActive,
                    ]}
                  >
                    <LinearGradient
                      colors={folder.colors}
                      end={{ x: 1, y: 1 }}
                      start={{ x: 0, y: 0 }}
                      style={styles.folderCard}
                    >
                      <View style={styles.folderDecorationLarge} />
                      <View style={styles.folderDecorationSmall} />
                      <Text style={styles.folderTitle}>{folder.title}</Text>
                      <Text style={styles.folderCount}>{folder.count}条内容</Text>
                    </LinearGradient>
                  </Pressable>
                );
              })}
            </ScrollView>

            <View style={styles.sectionHeader}>
              <View style={styles.sectionTitleWrap}>
                <View style={styles.sectionAccent} />
                <Text style={styles.sectionTitle}>我的收藏</Text>
              </View>

              <Pressable
                hitSlop={8}
                onPress={() => setSortDescending((current) => !current)}
                style={styles.sortButton}
              >
                <Text style={styles.sortButtonText}>{sortDescending ? '倒序' : '正序'}</Text>
                <MaterialIcons
                  color="rgba(92, 97, 103, 1)"
                  name={sortDescending ? 'keyboard-arrow-down' : 'keyboard-arrow-up'}
                  size={18}
                />
              </Pressable>
            </View>

            <View style={styles.listWrap}>
              {visibleItems.map((item) => (
                <View key={item.id} style={styles.favoriteItem}>
                  <View style={styles.favoriteCopy}>
                    <Text style={styles.favoriteTitle}>{item.title}</Text>
                    <Text style={styles.favoriteSummary}>{item.summary}</Text>
                  </View>

                  <View style={styles.favoriteActions}>
                    <Pressable
                      hitSlop={8}
                      onPress={() => toggleJoinedPlan(item.id)}
                      style={[
                        styles.planActionButton,
                        item.joinedPlan && styles.planActionButtonJoined,
                      ]}
                    >
                      {item.joinedPlan ? (
                        <Text style={styles.planActionJoinedText}>已加入规划</Text>
                      ) : (
                        <MaterialIcons color="rgba(37, 44, 51, 1)" name="add" size={18} />
                      )}
                    </Pressable>

                    <Pressable
                      hitSlop={8}
                      onPress={() => toggleSaved(item.id)}
                      style={styles.starButton}
                    >
                      <Ionicons
                        color="rgba(20, 26, 32, 1)"
                        name={item.saved ? 'star' : 'star-outline'}
                        size={20}
                      />
                    </Pressable>
                  </View>
                </View>
              ))}
            </View>
          </View>
        </ScrollView>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  pageLayer: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  headerBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 20,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
  },
  backButton: {
    width: 36,
    height: 36,
    marginRight: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    color: 'rgba(10, 15, 20, 1)',
    fontSize: 20,
    lineHeight: 26,
    fontWeight: '800',
    letterSpacing: 0,
  },
  scrollView: {
    flex: 1,
  },
  contentWrap: {
    alignSelf: 'center',
  },
  searchWrap: {
    height: 42,
    marginBottom: 14,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 1)',
    borderWidth: 1,
    borderColor: 'rgba(229, 232, 236, 1)',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    shadowColor: 'rgba(24, 39, 75, 0.08)',
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowOpacity: 1,
    shadowRadius: 12,
    elevation: 4,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    color: 'rgba(31, 41, 55, 1)',
    fontSize: 15,
    lineHeight: 20,
    fontWeight: '500',
    paddingVertical: 0,
  },
  folderScroll: {
    marginBottom: 18,
  },
  folderScrollContent: {
    paddingRight: 18,
  },
  folderCardWrap: {
    width: 112,
    marginRight: 14,
    borderRadius: 14,
  },
  folderCardWrapActive: {
    shadowColor: 'rgba(16, 148, 164, 0.2)',
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowOpacity: 1,
    shadowRadius: 14,
    elevation: 6,
  },
  folderCard: {
    height: 76,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingTop: 16,
    overflow: 'hidden',
  },
  folderDecorationLarge: {
    position: 'absolute',
    right: -14,
    top: -10,
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
  },
  folderDecorationSmall: {
    position: 'absolute',
    right: 10,
    bottom: -18,
    width: 70,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.14)',
    transform: [{ rotate: '-18deg' }],
  },
  folderTitle: {
    color: '#ffffff',
    fontSize: 16,
    lineHeight: 20,
    fontWeight: '800',
    letterSpacing: 0,
  },
  folderCount: {
    marginTop: 10,
    color: 'rgba(255, 255, 255, 0.86)',
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '500',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  sectionTitleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sectionAccent: {
    width: 3,
    height: 18,
    borderRadius: 2,
    marginRight: 10,
    backgroundColor: 'rgba(88, 98, 255, 1)',
  },
  sectionTitle: {
    color: 'rgba(26, 31, 36, 1)',
    fontSize: 16,
    lineHeight: 22,
    fontWeight: '800',
  },
  sortButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sortButtonText: {
    color: 'rgba(112, 118, 126, 1)',
    fontSize: 14,
    lineHeight: 18,
    fontWeight: '600',
  },
  listWrap: {
    backgroundColor: '#ffffff',
  },
  favoriteItem: {
    minHeight: 92,
    paddingTop: 14,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(222, 226, 230, 1)',
    flexDirection: 'row',
  },
  favoriteCopy: {
    flex: 1,
    paddingRight: 12,
  },
  favoriteTitle: {
    color: 'rgba(26, 31, 36, 1)',
    fontSize: 16,
    lineHeight: 22,
    fontWeight: '800',
    marginBottom: 6,
  },
  favoriteSummary: {
    color: 'rgba(98, 104, 111, 1)',
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '500',
  },
  favoriteActions: {
    width: 52,
    alignItems: 'center',
    justifyContent: 'center',
  },
  planActionButton: {
    minWidth: 26,
    minHeight: 26,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(52, 57, 64, 1)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
    marginBottom: 10,
  },
  planActionButtonJoined: {
    borderColor: 'transparent',
  },
  planActionJoinedText: {
    color: 'rgba(84, 90, 96, 1)',
    fontSize: 10,
    lineHeight: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  starButton: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
