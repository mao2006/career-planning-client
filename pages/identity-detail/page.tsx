import { type ReactNode, useState } from 'react';
import * as DocumentPicker from 'expo-document-picker';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import {
  Alert,
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

import BottomArrowNavigation from '../../components/bottom-arrow-navigation';
import IdentityScreenBackground from '../../components/identity-screen-background';

const PAGE_MAX_WIDTH = 430;
const RESUME_FILE_TYPES = [
  'image/*',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];

const BASE_FIELDS = [
  { key: 'name', label: '姓名', placeholder: '请输入姓名' },
  { key: 'school', label: '学校', placeholder: '请输入学校' },
  { key: 'major', label: '专业', placeholder: '请输入专业' },
] as const;

const COMMON_CHINESE_UNIVERSITIES = [
  '北京大学',
  '清华大学',
  '中国人民大学',
  '北京航空航天大学',
  '北京师范大学',
  '北京理工大学',
  '中国农业大学',
  '中央财经大学',
  '对外经济贸易大学',
  '北京邮电大学',
  '北京交通大学',
  '北京科技大学',
  '北京工业大学',
  '北京外国语大学',
  '北京化工大学',
  '复旦大学',
  '上海交通大学',
  '同济大学',
  '华东师范大学',
  '华东理工大学',
  '上海大学',
  '东华大学',
  '上海外国语大学',
  '上海财经大学',
  '华东政法大学',
  '上海海事大学',
  '上海理工大学',
  '上海中医药大学',
  '上海师范大学',
  '上海对外经贸大学',
  '南京大学',
  '东南大学',
  '河海大学',
  '南京航空航天大学',
  '南京理工大学',
  '苏州大学',
  '江南大学',
  '南京师范大学',
  '中国矿业大学',
  '扬州大学',
  '浙江大学',
  '浙江工业大学',
  '浙江工商大学',
  '浙江理工大学',
  '浙江师范大学',
  '浙江农林大学',
  '浙江财经大学',
  '浙江传媒学院',
  '浙江中医药大学',
  '中国计量大学',
  '杭州电子科技大学',
  '宁波大学',
  '温州医科大学',
  '中国美术学院',
  '浙江万里学院',
  '上海财经大学浙江学院',
  '嘉兴大学',
  '湖州师范学院',
  '温州大学',
  '绍兴文理学院',
  '台州学院',
  '中山大学',
  '华南理工大学',
  '暨南大学',
  '华南师范大学',
  '深圳大学',
  '南方科技大学',
  '广东外语外贸大学',
  '广州大学',
  '汕头大学',
  '武汉大学',
  '华中科技大学',
  '华中师范大学',
  '中南财经政法大学',
  '武汉理工大学',
  '中国地质大学（武汉）',
  '华中农业大学',
  '湖北大学',
  '中南大学',
  '湖南大学',
  '湖南师范大学',
  '湘潭大学',
  '长沙理工大学',
  '四川大学',
  '电子科技大学',
  '西南交通大学',
  '西南财经大学',
  '四川师范大学',
  '成都理工大学',
  '重庆大学',
  '西南大学',
  '重庆邮电大学',
  '重庆医科大学',
  '西安交通大学',
  '西北工业大学',
  '西安电子科技大学',
  '西北大学',
  '陕西师范大学',
  '长安大学',
  '厦门大学',
  '福州大学',
  '福建师范大学',
  '华侨大学',
  '集美大学',
  '山东大学',
  '中国海洋大学',
  '中国石油大学（华东）',
  '青岛大学',
  '山东师范大学',
  '吉林大学',
  '东北师范大学',
  '哈尔滨工业大学',
  '哈尔滨工程大学',
  '东北林业大学',
  '南开大学',
  '天津大学',
  '天津财经大学',
  '天津医科大学',
  '兰州大学',
  '郑州大学',
  '云南大学',
  '贵州大学',
  '海南大学',
  '广西大学',
  '南昌大学',
  '合肥工业大学',
  '中国科学技术大学',
  '安徽大学',
] as const;

const PROFILE_FIELDS = [
  { key: 'certificate', label: '证书', minHeight: 54, placeholder: '请输入证书' },
  { key: 'skill', label: '技能', minHeight: 78, placeholder: '请输入技能' },
  { key: 'honor', label: '荣誉', minHeight: 70, placeholder: '请输入获得荣誉' },
  { key: 'experience', label: '经历', minHeight: 92, placeholder: '请输入经历' },
  { key: 'targetJob', label: '目标岗位', minHeight: 76, placeholder: '请输入目标岗位' },
] as const;

const RESUME_AUTOFILL_VALUES = {
  certificate: '全国计算机二级、大学英语四级、软考程序员',
  experience:
    '已完成数据结构课程设计、1 次团队协作开发、1 个 Linux + C++ mini 项目，具备持续学习和工程化落地能力。',
  honor: '学习吸收快、执行节奏稳，具备工程实现型潜力，适合从研发主线切入。',
  major: '车辆工程',
  name: '毛健辉',
  school: '浙江工业大学',
  skill: 'C++ / C、数据结构与算法、Linux 开发环境、Git 协作、调试定位、计算机网络基础',
  targetJob: 'C++ 开发工程师 / 后端开发工程师 / 嵌入式开发工程师',
} as const;

type IdentityDetailPageProps = {
  onBack?: () => void;
  onNavigate?: () => void;
};

type FormValues = {
  certificate: string;
  experience: string;
  honor: string;
  major: string;
  name: string;
  school: string;
  skill: string;
  targetJob: string;
};

type InputRowProps = {
  isLast?: boolean;
  label: string;
  minHeight: number;
  multiline?: boolean;
  onChangeText: (text: string) => void;
  onFocus?: () => void;
  placeholder: string;
  value: string;
};

type SchoolInputRowProps = {
  isLast?: boolean;
  label: string;
  minHeight: number;
  onChangeText: (text: string) => void;
  onFocus: () => void;
  onSelect: (value: string) => void;
  placeholder: string;
  suggestions: string[];
  value: string;
  visible: boolean;
};

type SectionCardProps = {
  children: ReactNode;
  headerText: string;
  isOverlayActive?: boolean;
};

function InputRow({
  isLast = false,
  label,
  minHeight,
  multiline = false,
  onChangeText,
  onFocus,
  placeholder,
  value,
}: InputRowProps) {
  return (
    <View
      style={[
        styles.infoRow,
        {
          minHeight,
          borderBottomWidth: isLast ? 0 : StyleSheet.hairlineWidth,
        },
        multiline && styles.infoRowMultiline,
      ]}
    >
      <Text style={[styles.infoLabel, multiline && styles.infoLabelMultiline]}>{label}</Text>

      <TextInput
        multiline={multiline}
        onChangeText={onChangeText}
        onFocus={onFocus}
        placeholder={placeholder}
        placeholderTextColor="rgba(166, 166, 166, 1)"
        scrollEnabled={false}
        style={[styles.fieldInput, multiline && styles.fieldInputMultiline]}
        value={value}
      />
    </View>
  );
}

function SchoolInputRow({
  isLast = false,
  label,
  minHeight,
  onChangeText,
  onFocus,
  onSelect,
  placeholder,
  suggestions,
  value,
  visible,
}: SchoolInputRowProps) {
  return (
    <View style={[styles.schoolRowWrap, visible && styles.schoolRowWrapActive]}>
      <View
        style={[
          styles.infoRow,
          {
            minHeight,
            borderBottomWidth: isLast ? 0 : StyleSheet.hairlineWidth,
          },
        ]}
      >
        <Text style={styles.infoLabel}>{label}</Text>

        <View style={styles.schoolFieldWrap}>
          <TextInput
            onChangeText={onChangeText}
            onFocus={onFocus}
            placeholder={placeholder}
            placeholderTextColor="rgba(166, 166, 166, 1)"
            style={styles.schoolFieldInput}
            value={value}
          />
          <MaterialIcons
            color="rgba(10, 191, 186, 1)"
            name={visible ? 'keyboard-arrow-up' : 'keyboard-arrow-down'}
            size={20}
          />
        </View>
      </View>

      {visible ? (
        <View style={[styles.schoolDropdown, { top: minHeight + 6 }]}>
          <ScrollView keyboardShouldPersistTaps="handled" nestedScrollEnabled style={styles.schoolDropdownScroll}>
            {suggestions.length > 0 ? (
              suggestions.map((school, index) => (
                <Pressable
                  key={school}
                  onPress={() => onSelect(school)}
                  style={({ pressed }) => [
                    styles.schoolOption,
                    index < suggestions.length - 1 && styles.schoolOptionBorder,
                    pressed && styles.schoolOptionPressed,
                  ]}
                >
                  <Text numberOfLines={1} style={styles.schoolOptionText}>
                    {school}
                  </Text>
                </Pressable>
              ))
            ) : (
              <Text style={styles.emptySchoolText}>未找到匹配学校</Text>
            )}
          </ScrollView>
        </View>
      ) : null}
    </View>
  );
}

function SectionCard({ children, headerText, isOverlayActive = false }: SectionCardProps) {
  return (
    <View style={[styles.sectionWrap, isOverlayActive && styles.sectionWrapActive]}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionHeaderText}>{headerText}</Text>
      </View>
      <View style={styles.sectionCard}>{children}</View>
    </View>
  );
}

export default function IdentityDetailPage({ onBack, onNavigate }: IdentityDetailPageProps) {
  const [formValues, setFormValues] = useState<FormValues>({
    certificate: '',
    experience: '',
    honor: '',
    major: '',
    name: '',
    school: '',
    skill: '',
    targetJob: '',
  });
  const [importedResumeName, setImportedResumeName] = useState('');
  const [schoolDropdownVisible, setSchoolDropdownVisible] = useState(false);
  const { width: screenWidth } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const scaleX = screenWidth / 375;
  const contentWidth = Math.min(screenWidth - 30, PAGE_MAX_WIDTH);
  const schoolKeyword = formValues.school.trim();
  const filteredSchoolSuggestions =
    schoolKeyword.length > 0
      ? COMMON_CHINESE_UNIVERSITIES.filter((school) => school.includes(schoolKeyword)).slice(0, 12)
      : [];
  const isSchoolSuggestionVisible = schoolDropdownVisible && schoolKeyword.length > 0;

  const handleOutsidePress = () => {
    setSchoolDropdownVisible(false);
    Keyboard.dismiss();
  };

  const updateField = (field: keyof FormValues, value: string) => {
    setFormValues((current) => ({ ...current, [field]: value }));
  };

  const handleSchoolChange = (value: string) => {
    updateField('school', value);
    setSchoolDropdownVisible(true);
  };

  const handleSchoolFocus = () => {
    setSchoolDropdownVisible(true);
  };

  const handleSchoolSelect = (value: string) => {
    updateField('school', value);
    setSchoolDropdownVisible(false);
    Keyboard.dismiss();
  };

  const closeSchoolDropdown = () => {
    setSchoolDropdownVisible(false);
  };

  const handleResumeImport = async () => {
    closeSchoolDropdown();
    Keyboard.dismiss();

    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: RESUME_FILE_TYPES,
        copyToCacheDirectory: true,
        multiple: false,
      });

      if (result.canceled || result.assets.length === 0) {
        return;
      }

      const asset = result.assets[0];

      setImportedResumeName(asset.name || '已导入简历');
      setFormValues((current) => ({
        ...current,
        ...RESUME_AUTOFILL_VALUES,
      }));

      Alert.alert('简历已导入', '已根据当前能力画像自动填充档案内容，你可以继续微调后进入下一步。');
    } catch (error) {
      Alert.alert('导入失败', '暂时无法读取简历文件，请稍后重试。');
    }
  };

  return (
    <IdentityScreenBackground>
      <TouchableWithoutFeedback accessible={false} onPress={handleOutsidePress}>
        <View style={styles.screen}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 12 : 0}
            style={styles.keyboardAvoidingView}
          >
            <ScrollView
              keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
              style={styles.screenScroll}
              contentContainerStyle={[
                styles.scrollContent,
                {
                  paddingTop: insets.top + 34,
                  paddingBottom: insets.bottom + 126,
                  paddingHorizontal: 15,
                },
              ]}
            >
              <View style={[styles.contentColumn, { width: contentWidth }]}>
                <Text style={styles.pageTitle}>新建档案</Text>
                <Text style={styles.pageSubtitle}>基础信息越完整，后续能力画像和岗位推荐会越准确。</Text>

                <Pressable
                  hitSlop={8}
                  onPress={handleResumeImport}
                  style={({ pressed }) => [styles.resumeHint, pressed && styles.resumeHintPressed]}
                >
                  <MaterialIcons color="rgba(95, 167, 239, 1)" name="check-circle" size={14} />
                  <Text style={styles.resumeHintText}>导入简历一键填写</Text>
                  <MaterialIcons color="rgba(95, 167, 239, 1)" name="file-upload" size={15} />
                </Pressable>
                {importedResumeName ? (
                  <Text numberOfLines={1} style={styles.resumeImportedText}>
                    {`已导入：${importedResumeName}`}
                  </Text>
                ) : null}

                <SectionCard headerText="基础信息" isOverlayActive={isSchoolSuggestionVisible}>
                  {BASE_FIELDS.map((field, index) => (
                    field.key === 'school' ? (
                      <SchoolInputRow
                        key={field.key}
                        isLast={index === BASE_FIELDS.length - 1}
                        label={field.label}
                        minHeight={48}
                        onChangeText={handleSchoolChange}
                        onFocus={handleSchoolFocus}
                        onSelect={handleSchoolSelect}
                        placeholder={field.placeholder}
                        suggestions={filteredSchoolSuggestions}
                        value={formValues[field.key]}
                        visible={isSchoolSuggestionVisible}
                      />
                    ) : (
                      <InputRow
                        key={field.key}
                        isLast={index === BASE_FIELDS.length - 1}
                        label={field.label}
                        minHeight={48}
                        onChangeText={(value) => updateField(field.key, value)}
                        onFocus={closeSchoolDropdown}
                        placeholder={field.placeholder}
                        value={formValues[field.key]}
                      />
                    )
                  ))}
                </SectionCard>

                <View style={styles.sectionGap} />

                <SectionCard headerText="个人档案（可选填）">
                  {PROFILE_FIELDS.map((field, index) => (
                    <InputRow
                      key={field.label}
                      isLast={index === PROFILE_FIELDS.length - 1}
                      label={field.label}
                      minHeight={field.minHeight}
                      multiline
                      onChangeText={(value) => updateField(field.key, value)}
                      onFocus={closeSchoolDropdown}
                      placeholder={field.placeholder}
                      value={formValues[field.key]}
                    />
                  ))}
                </SectionCard>
              </View>
            </ScrollView>
          </KeyboardAvoidingView>

          <BottomArrowNavigation
            bottom={Math.max(insets.bottom + 10, 16)}
            leftDisabled={!onBack}
            onLeftPress={onBack}
            onRightPress={onNavigate}
            rightDisabled={!onNavigate}
            scaleX={scaleX}
          />
        </View>
      </TouchableWithoutFeedback>
    </IdentityScreenBackground>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  screenScroll: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    alignItems: 'center',
  },
  contentColumn: {
    width: '100%',
  },
  pageTitle: {
    fontSize: 36,
    lineHeight: 52,
    fontWeight: '700',
    letterSpacing: 0,
    color: 'rgba(0, 0, 0, 1)',
  },
  pageSubtitle: {
    marginTop: 4,
    marginBottom: 14,
    fontSize: 13,
    lineHeight: 19,
    fontWeight: '400',
    letterSpacing: 0,
    color: 'rgba(84, 102, 105, 1)',
  },
  resumeHint: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    marginBottom: 8,
    paddingRight: 6,
  },
  resumeHintPressed: {
    opacity: 0.72,
  },
  resumeHintText: {
    marginLeft: 4,
    marginRight: 4,
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '500',
    letterSpacing: 0,
    color: 'rgba(95, 167, 239, 1)',
  },
  resumeImportedText: {
    marginTop: -2,
    marginBottom: 12,
    fontSize: 11,
    lineHeight: 15,
    fontWeight: '500',
    letterSpacing: 0,
    color: 'rgba(106, 106, 106, 1)',
  },
  sectionWrap: {
    width: '100%',
    position: 'relative',
    zIndex: 1,
  },
  sectionWrapActive: {
    zIndex: 30,
  },
  sectionHeader: {
    width: 244,
    height: 31,
    paddingLeft: 10,
    borderTopLeftRadius: 4,
    borderTopRightRadius: 4,
    backgroundColor: 'rgba(10, 191, 186, 1)',
    justifyContent: 'center',
  },
  sectionHeaderText: {
    fontSize: 17,
    lineHeight: 24,
    fontWeight: '700',
    letterSpacing: 0,
    color: 'rgba(255, 255, 255, 1)',
  },
  sectionCard: {
    borderRadius: 10,
    paddingTop: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.98)',
    overflow: 'visible',
    shadowColor: 'rgba(0, 0, 0, 0.07)',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 1,
    shadowRadius: 14,
    elevation: 4,
  },
  sectionGap: {
    height: 22,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingLeft: 22,
    paddingRight: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(238, 238, 238, 1)',
  },
  infoRowMultiline: {
    alignItems: 'flex-start',
    paddingTop: 10,
    paddingBottom: 10,
  },
  infoLabel: {
    width: 62,
    fontSize: 16,
    lineHeight: 22,
    fontWeight: '600',
    letterSpacing: 0,
    color: 'rgba(106, 106, 106, 1)',
  },
  infoLabelMultiline: {
    paddingTop: 4,
  },
  fieldInput: {
    flex: 1,
    minWidth: 0,
    minHeight: 24,
    paddingTop: 0,
    paddingBottom: 0,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '400',
    letterSpacing: 0,
    color: 'rgba(106, 106, 106, 1)',
    textAlign: 'right',
    textAlignVertical: 'center',
  },
  fieldInputMultiline: {
    fontSize: 13,
    lineHeight: 18,
    textAlign: 'left',
    textAlignVertical: 'top',
    paddingTop: 2,
    paddingBottom: 2,
  },
  schoolRowWrap: {
    position: 'relative',
    zIndex: 1,
  },
  schoolRowWrapActive: {
    zIndex: 40,
  },
  schoolFieldWrap: {
    flex: 1,
    minWidth: 0,
    marginLeft: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  schoolFieldInput: {
    flex: 1,
    minWidth: 0,
    minHeight: 24,
    paddingTop: 0,
    paddingBottom: 0,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '400',
    letterSpacing: 0,
    color: 'rgba(106, 106, 106, 1)',
    textAlign: 'right',
    textAlignVertical: 'center',
  },
  schoolDropdown: {
    position: 'absolute',
    right: 12,
    width: 236,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 1)',
    shadowColor: 'rgba(0, 0, 0, 0.18)',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 1,
    shadowRadius: 10,
    elevation: 10,
  },
  schoolDropdownScroll: {
    maxHeight: 252,
  },
  schoolOption: {
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  schoolOptionBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(238, 238, 238, 1)',
  },
  schoolOptionPressed: {
    backgroundColor: 'rgba(10, 191, 186, 0.08)',
  },
  schoolOptionText: {
    fontSize: 16,
    lineHeight: 22,
    fontWeight: '500',
    letterSpacing: 0,
    color: 'rgba(10, 191, 186, 1)',
  },
  emptySchoolText: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '400',
    letterSpacing: 0,
    color: 'rgba(166, 166, 166, 1)',
    textAlign: 'center',
  },
});
