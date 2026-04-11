import { useEffect, useRef, useState } from 'react';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import {
  Alert,
  Image,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableWithoutFeedback,
  View,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import AccountSettingsPage from './account-settings-page';
import FavoritesPage from './favorites-page';

type MinePageProps = {
  onDetailVisibilityChange?: (visible: boolean) => void;
};

type ExpandableSectionKey = 'basic' | 'more' | 'profile';
type MoreSelectorKey = 'futureGoal' | 'investment';

type FormValues = {
  certificate: string;
  email: string;
  experience: string;
  futureGoal: string;
  honor: string;
  investment: string;
  major: string;
  name: string;
  school: string;
  skill: string;
  targetJob: string;
  transferIntent: '不确定' | '有' | '没有' | null;
};

const TAB_BAR_RESERVED_HEIGHT = 104;
const BASIC_FIELDS = [
  { key: 'name', label: '姓名', placeholder: '请输入姓名' },
  { key: 'school', label: '学校', placeholder: '请输入学校' },
  { key: 'major', label: '专业', placeholder: '请输入专业' },
] as const;
const PROFILE_FIELDS = [
  { key: 'certificate', label: '证书', placeholder: '请输入证书' },
  { key: 'skill', label: '技能', placeholder: '请输入技能' },
  { key: 'honor', label: '荣誉', placeholder: '请输入获得荣誉' },
  { key: 'experience', label: '经历', placeholder: '请输入经历' },
  { key: 'targetJob', label: '目标岗位', placeholder: '请输入目标岗位' },
] as const;
const TRANSFER_OPTIONS = ['有', '没有', '不确定'] as const;
const INVESTMENT_OPTIONS = [
  '偏向低成本/免费资源',
  '可适当预算投入',
  '可灵活支持长期提升',
] as const;
const FUTURE_GOAL_OPTIONS = ['就业(找工作)', '考研/升学', '考公/事业单位', '出国深造', '自主创业', '未确定'] as const;

type EditorFieldRowProps = {
  isLast?: boolean;
  label: string;
  onChangeText: (value: string) => void;
  placeholder: string;
  value: string;
};

type MenuRowProps = {
  expanded?: boolean;
  onPress?: () => void;
  title: string;
};

type SelectorRowProps = {
  isLast?: boolean;
  isOpen: boolean;
  label: string;
  onPress: () => void;
  onSelect: (value: string) => void;
  options: readonly string[];
  value: string;
};

function MenuRow({ expanded = false, onPress, title }: MenuRowProps) {
  return (
    <Pressable hitSlop={8} onPress={onPress} style={styles.menuRow}>
      <Text style={styles.menuRowText}>{title}</Text>
      <MaterialIcons
        color="rgba(192, 199, 206, 1)"
        name={expanded ? 'keyboard-arrow-down' : 'chevron-right'}
        size={24}
      />
    </Pressable>
  );
}

function EditorFieldRow({
  isLast = false,
  label,
  onChangeText,
  placeholder,
  value,
}: EditorFieldRowProps) {
  return (
    <View
      style={[
        styles.editorFieldRow,
        {
          borderBottomWidth: isLast ? 0 : StyleSheet.hairlineWidth,
        },
      ]}
    >
      <View style={styles.fieldChip}>
        <Text style={styles.fieldChipText}>{label}</Text>
      </View>

      <TextInput
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="rgba(184, 184, 184, 1)"
        style={styles.fieldInput}
        value={value}
      />
    </View>
  );
}

function SelectorRow({
  isLast = false,
  isOpen,
  label,
  onPress,
  onSelect,
  options,
  value,
}: SelectorRowProps) {
  return (
    <View
      style={[
        styles.selectorRowWrap,
        {
          borderBottomWidth: isLast && !isOpen ? 0 : StyleSheet.hairlineWidth,
        },
      ]}
    >
      <Pressable onPress={onPress} style={styles.selectorTriggerRow}>
        <View style={styles.fieldChip}>
          <Text style={styles.fieldChipText}>{label}</Text>
        </View>

        <Text numberOfLines={1} style={[styles.selectorValueText, value.length === 0 && styles.selectorPlaceholderText]}>
          {value || '请选择'}
        </Text>

        <View style={styles.selectorIconCircle}>
          <MaterialIcons
            color="rgba(146, 154, 163, 1)"
            name={isOpen ? 'keyboard-arrow-up' : 'keyboard-arrow-down'}
            size={20}
          />
        </View>
      </Pressable>

      {isOpen ? (
        <View style={styles.selectorOptionsWrap}>
          {options.map((option, index) => {
            const selected = option === value;

            return (
              <Pressable
                key={option}
                onPress={() => onSelect(option)}
                style={[
                  styles.selectorOptionRow,
                  index < options.length - 1 && styles.selectorOptionRowBorder,
                ]}
              >
                <View style={[styles.selectorRadioOuter, selected && styles.selectorRadioOuterSelected]}>
                  {selected ? <View style={styles.selectorRadioInner} /> : null}
                </View>
                <Text style={styles.selectorOptionText}>{option}</Text>
              </Pressable>
            );
          })}
        </View>
      ) : null}
    </View>
  );
}

export default function MinePage({ onDetailVisibilityChange }: MinePageProps) {
  const [activeSubpage, setActiveSubpage] = useState<'favorites' | 'main' | 'settings'>('main');
  const [avatarUri, setAvatarUri] = useState<string | null>(null);
  const [expandedSection, setExpandedSection] = useState<ExpandableSectionKey | null>(null);
  const [activeSelectorKey, setActiveSelectorKey] = useState<MoreSelectorKey | null>(null);
  const [formValues, setFormValues] = useState<FormValues>({
    certificate: '',
    email: 'jingxiaohong@nn.com',
    experience: '',
    futureGoal: '',
    honor: '',
    investment: '',
    major: '',
    name: '精小弘',
    school: '',
    skill: '',
    targetJob: '',
    transferIntent: null,
  });
  const insets = useSafeAreaInsets();
  const { width: screenWidth } = useWindowDimensions();
  const contentWidth = Math.min(screenWidth - 32, 360);
  const headerHeight = insets.top + 60;
  const scrollBottomPadding = TAB_BAR_RESERVED_HEIGHT + Math.max(insets.bottom - 16, 2) + 22;
  const nameInputRef = useRef<TextInput>(null);

  useEffect(() => {
    onDetailVisibilityChange?.(activeSubpage !== 'main');

    return () => {
      onDetailVisibilityChange?.(false);
    };
  }, [activeSubpage, onDetailVisibilityChange]);

  const updateField = (field: keyof FormValues, value: string | FormValues['transferIntent']) => {
    setFormValues((current) => ({ ...current, [field]: value }));
  };

  const toggleSection = (key: ExpandableSectionKey) => {
    Keyboard.dismiss();
    setActiveSelectorKey(null);
    setExpandedSection((current) => (current === key ? null : key));
  };

  const openSettingsPage = () => {
    Keyboard.dismiss();
    setActiveSelectorKey(null);
    setActiveSubpage('settings');
  };

  const openFavoritesPage = () => {
    Keyboard.dismiss();
    setActiveSelectorKey(null);
    setActiveSubpage('favorites');
  };

  const focusNameInput = () => {
    nameInputRef.current?.focus();
  };

  const handlePickAvatar = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      Alert.alert('无法访问相册', '请先允许访问系统相册后再选择头像。');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      allowsEditing: true,
      aspect: [1, 1],
      mediaTypes: ['images'],
      quality: 0.8,
      selectionLimit: 1,
    });

    if (result.canceled || !result.assets?.[0]?.uri) {
      return;
    }

    setAvatarUri(result.assets[0].uri);
  };

  const renderBasicSection = () => (
    <View style={styles.formCard}>
      {BASIC_FIELDS.map((field, index) => (
        <EditorFieldRow
          key={field.key}
          isLast={index === BASIC_FIELDS.length - 1}
          label={field.label}
          onChangeText={(value) => updateField(field.key, value)}
          placeholder={field.placeholder}
          value={formValues[field.key]}
        />
      ))}
    </View>
  );

  const renderProfileSection = () => (
    <View style={styles.formCard}>
      {PROFILE_FIELDS.map((field, index) => (
        <EditorFieldRow
          key={field.key}
          isLast={index === PROFILE_FIELDS.length - 1}
          label={field.label}
          onChangeText={(value) => updateField(field.key, value)}
          placeholder={field.placeholder}
          value={formValues[field.key]}
        />
      ))}
    </View>
  );

  const renderMoreSection = () => (
    <View style={styles.formCard}>
      <View style={styles.transferRow}>
        <View style={[styles.fieldChip, styles.transferChip]}>
          <Text style={styles.fieldChipText}>有无转专业意愿</Text>
        </View>

        <View style={styles.transferOptionsWrap}>
          {TRANSFER_OPTIONS.map((option) => {
            const selected = formValues.transferIntent === option;

            return (
              <Pressable
                key={option}
                hitSlop={6}
                onPress={() => updateField('transferIntent', option)}
                style={styles.transferOption}
              >
                <View style={[styles.transferRadioOuter, selected && styles.transferRadioOuterSelected]}>
                  {selected ? <View style={styles.transferRadioInner} /> : null}
                </View>
                <Text style={styles.transferOptionText}>{option}</Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      <SelectorRow
        isOpen={activeSelectorKey === 'investment'}
        label="经济投入"
        onPress={() => setActiveSelectorKey((current) => (current === 'investment' ? null : 'investment'))}
        onSelect={(value) => {
          updateField('investment', value);
          setActiveSelectorKey(null);
        }}
        options={INVESTMENT_OPTIONS}
        value={formValues.investment}
      />

      <SelectorRow
        isLast
        isOpen={activeSelectorKey === 'futureGoal'}
        label="未来目标"
        onPress={() => setActiveSelectorKey((current) => (current === 'futureGoal' ? null : 'futureGoal'))}
        onSelect={(value) => {
          updateField('futureGoal', value);
          setActiveSelectorKey(null);
        }}
        options={FUTURE_GOAL_OPTIONS}
        value={formValues.futureGoal}
      />
    </View>
  );

  if (activeSubpage === 'settings') {
    return <AccountSettingsPage onBack={() => setActiveSubpage('main')} />;
  }

  if (activeSubpage === 'favorites') {
    return <FavoritesPage onBack={() => setActiveSubpage('main')} />;
  }

  return (
    <TouchableWithoutFeedback
      accessible={false}
      onPress={() => {
        Keyboard.dismiss();
        setActiveSelectorKey(null);
      }}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 12 : 0}
        style={styles.screen}
      >
        <StatusBar style="dark" />

        <LinearGradient
          colors={['rgba(168, 237, 229, 0.98)', 'rgba(168, 237, 229, 0.86)']}
          end={{ x: 1, y: 1 }}
          start={{ x: 0, y: 0 }}
          style={[
            styles.headerBar,
            {
              height: headerHeight,
              paddingTop: insets.top,
            },
          ]}
        >
          <View style={styles.headerInner}>
            <View style={styles.headerSideSpacer} />
            <Text style={styles.headerTitle}>信息编辑</Text>
            <Pressable hitSlop={8} onPress={openFavoritesPage} style={styles.favoriteButton}>
              <Ionicons color="rgba(28, 45, 62, 1)" name="star-outline" size={24} />
              <Text style={styles.favoriteText}>收藏夹</Text>
            </Pressable>
          </View>
        </LinearGradient>

        <ScrollView
          bounces={false}
          contentContainerStyle={{
            paddingTop: headerHeight + 18,
            paddingBottom: scrollBottomPadding,
          }}
          keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          style={styles.contentScroll}
        >
          <View
            style={[
              styles.contentWrap,
              {
                width: contentWidth,
              },
            ]}
          >
            <View style={styles.profileHero}>
              <View style={styles.avatarWrap}>
                {avatarUri ? (
                  <Image source={{ uri: avatarUri }} style={styles.avatarImage} />
                ) : (
                  <View style={styles.avatarPlaceholder} />
                )}
                <Pressable hitSlop={8} onPress={handlePickAvatar} style={styles.cameraButton}>
                  <Ionicons color="#ffffff" name="camera-outline" size={16} />
                </Pressable>
              </View>

              <View style={styles.nameRow}>
                <TextInput
                  ref={nameInputRef}
                  onChangeText={(value) => updateField('name', value)}
                  placeholder="请输入昵称"
                  placeholderTextColor="rgba(177, 181, 189, 1)"
                  style={styles.profileNameInput}
                  value={formValues.name}
                />
                <Pressable hitSlop={8} onPress={focusNameInput}>
                  <Ionicons color="rgba(44, 52, 63, 0.94)" name="create-outline" size={18} style={styles.nameEditIcon} />
                </Pressable>
              </View>

              <Text style={styles.profileEmail}>{formValues.email}</Text>
            </View>

            <View style={styles.sectionGroup}>
              <View style={styles.menuItemWrap}>
                <MenuRow
                  expanded={expandedSection === 'basic'}
                  onPress={() => toggleSection('basic')}
                  title="基础信息"
                />
                {expandedSection === 'basic' ? renderBasicSection() : null}
                <View style={styles.menuDivider} />
              </View>

              <View style={styles.menuItemWrap}>
                <MenuRow
                  expanded={expandedSection === 'profile'}
                  onPress={() => toggleSection('profile')}
                  title="个人档案"
                />
                {expandedSection === 'profile' ? renderProfileSection() : null}
                <View style={styles.menuDivider} />
              </View>

              <View style={styles.menuItemWrap}>
                <MenuRow
                  expanded={expandedSection === 'more'}
                  onPress={() => toggleSection('more')}
                  title="更多信息"
                />
                {expandedSection === 'more' ? renderMoreSection() : null}
                <View style={styles.menuDivider} />
              </View>

              <View style={styles.menuItemWrap}>
                <MenuRow onPress={openSettingsPage} title="账号与设置" />
                <View style={styles.menuDivider} />
              </View>

              <View style={styles.menuItemWrap}>
                <MenuRow title="关于" />
                <View style={styles.menuDivider} />
              </View>

              <View style={styles.menuItemWrap}>
                <MenuRow title="帮助与反馈" />
                <View style={styles.menuDivider} />
              </View>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  headerBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 20,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(189, 220, 216, 0.85)',
  },
  headerInner: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  headerSideSpacer: {
    width: 58,
  },
  headerTitle: {
    color: 'rgba(9, 17, 29, 1)',
    fontSize: 18,
    lineHeight: 22,
    fontWeight: '800',
    letterSpacing: 0,
  },
  favoriteButton: {
    width: 58,
    alignItems: 'center',
    justifyContent: 'center',
  },
  favoriteText: {
    marginTop: 2,
    color: 'rgba(28, 45, 62, 1)',
    fontSize: 11,
    lineHeight: 14,
    fontWeight: '600',
  },
  contentScroll: {
    flex: 1,
  },
  contentWrap: {
    alignSelf: 'center',
  },
  profileHero: {
    alignItems: 'center',
    paddingTop: 8,
    paddingBottom: 18,
  },
  avatarWrap: {
    position: 'relative',
    width: 96,
    height: 96,
    marginBottom: 14,
  },
  avatarPlaceholder: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: 'rgba(216, 216, 216, 1)',
    alignSelf: 'center',
  },
  avatarImage: {
    width: 84,
    height: 84,
    borderRadius: 42,
    alignSelf: 'center',
  },
  cameraButton: {
    position: 'absolute',
    right: 6,
    bottom: 14,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(16, 142, 233, 1)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: 'rgba(16, 142, 233, 0.28)',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 1,
    shadowRadius: 10,
    elevation: 4,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  profileName: {
    color: 'rgba(28, 31, 36, 1)',
    fontSize: 22,
    lineHeight: 28,
    fontWeight: '800',
    letterSpacing: 0,
  },
  profileNameInput: {
    minWidth: 72,
    maxWidth: 180,
    color: 'rgba(28, 31, 36, 1)',
    fontSize: 22,
    lineHeight: 28,
    fontWeight: '800',
    letterSpacing: 0,
    textAlign: 'center',
    paddingVertical: 0,
    paddingHorizontal: 0,
  },
  nameEditIcon: {
    marginLeft: 6,
  },
  profileEmail: {
    marginTop: 4,
    color: 'rgba(177, 181, 189, 1)',
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '500',
  },
  sectionGroup: {
    paddingTop: 4,
  },
  menuItemWrap: {
    width: '100%',
  },
  menuRow: {
    minHeight: 60,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
  },
  menuRowText: {
    color: 'rgba(57, 62, 71, 1)',
    fontSize: 16,
    lineHeight: 22,
    fontWeight: '700',
    letterSpacing: 0,
  },
  formCard: {
    marginHorizontal: 12,
    marginBottom: 14,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.98)',
    borderWidth: 1,
    borderColor: 'rgba(226, 226, 226, 1)',
    shadowColor: 'rgba(0, 0, 0, 0.16)',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 6,
    overflow: 'hidden',
  },
  editorFieldRow: {
    minHeight: 58,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    borderBottomColor: 'rgba(236, 236, 236, 1)',
  },
  fieldChip: {
    minWidth: 66,
    height: 28,
    paddingHorizontal: 10,
    borderRadius: 0,
    backgroundColor: 'rgba(238, 238, 238, 1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  transferChip: {
    minHeight: 40,
    height: 'auto',
    paddingVertical: 6,
  },
  fieldChipText: {
    color: 'rgba(50, 54, 61, 1)',
    fontSize: 13,
    lineHeight: 16,
    fontWeight: '700',
    textAlign: 'center',
  },
  fieldInput: {
    flex: 1,
    marginLeft: 12,
    color: 'rgba(52, 58, 65, 1)',
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '500',
    paddingVertical: 0,
  },
  transferRow: {
    minHeight: 64,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(236, 236, 236, 1)',
  },
  transferOptionsWrap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingLeft: 14,
  },
  transferOption: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 8,
  },
  transferRadioOuter: {
    width: 15,
    height: 15,
    borderRadius: 7.5,
    borderWidth: 1,
    borderColor: 'rgba(195, 195, 195, 1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  transferRadioOuterSelected: {
    borderColor: 'rgba(16, 142, 233, 1)',
  },
  transferRadioInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(16, 142, 233, 1)',
  },
  transferOptionText: {
    marginLeft: 6,
    color: 'rgba(106, 106, 106, 1)',
    fontSize: 14,
    lineHeight: 18,
    fontWeight: '500',
  },
  selectorRowWrap: {
    borderBottomColor: 'rgba(236, 236, 236, 1)',
  },
  selectorTriggerRow: {
    minHeight: 58,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
  },
  selectorValueText: {
    flex: 1,
    marginLeft: 12,
    marginRight: 10,
    color: 'rgba(102, 108, 117, 1)',
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '500',
  },
  selectorPlaceholderText: {
    color: 'rgba(182, 182, 182, 1)',
  },
  selectorIconCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: 'rgba(193, 200, 206, 1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectorOptionsWrap: {
    marginHorizontal: 10,
    marginBottom: 10,
    borderRadius: 14,
    backgroundColor: 'rgba(248, 250, 251, 1)',
    overflow: 'hidden',
  },
  selectorOptionRow: {
    minHeight: 46,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  selectorOptionRowBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(226, 226, 226, 1)',
  },
  selectorRadioOuter: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: 'rgba(195, 195, 195, 1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  selectorRadioOuterSelected: {
    borderColor: 'rgba(16, 142, 233, 1)',
  },
  selectorRadioInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(16, 142, 233, 1)',
  },
  selectorOptionText: {
    flex: 1,
    color: 'rgba(78, 83, 90, 1)',
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '500',
  },
  menuDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: 'rgba(226, 226, 226, 1)',
  },
});
