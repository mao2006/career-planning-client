import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useState } from 'react';
import {
  Image,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableWithoutFeedback,
  View,
  useWindowDimensions,
} from 'react-native';

import BottomArrowNavigation, { STANDARD_ARROW_BOTTOM } from '../../components/bottom-arrow-navigation';
import IdentityScreenBackground from '../../components/identity-screen-background';

const DESIGN_SCREEN_WIDTH = 375;
const DESIGN_SCREEN_HEIGHT = 812;
const JIXIANGWU_LEFT = 108;
const JIXIANGWU_TOP = 21;
const JIXIANGWU_WIDTH = 428;
const JIXIANGWU_HEIGHT = 644;

const TRANSFER_OPTIONS = ['有', '没有', '不确定'] as const;
const MORE_FIELDS = [
  {
    key: 'investment',
    label: '经济投入',
    placeholder: '请选择您在职业发展中的投入倾向',
    options: [
      '偏向低成本/免费资源(以自学、校内资源、免费网课为主)',
      '可适当预算投入(可接受少量付费课程、证书或参与短期交流项目)',
      '可灵活支持长期提升(可接受付费培训、高端证书、留学或背景提升项目)',
    ],
  },
  {
    key: 'futureGoal',
    label: '未来目标',
    placeholder: '请选择您对未来的核心目标',
    options: ['就业(找工作)', '考研/升学', '考公/事业单位', '出国深造', '自主创业', '未确定'],
  },
  {
    key: 'currentStatus',
    label: '目前状态',
    placeholder: '请选择您目前的职业规划状态',
    options: [
      '有非常明确的目标，并正在执行',
      '有明确目标，但还未开始行动',
      '有大致方向，但不够清晰具体',
      '只有模糊想法，不确定是否符合自己',
      '完全没有规划，比较迷茫',
    ],
  },
] as const;

type IdentityMorePageProps = {
  onBack?: () => void;
  onNavigate?: () => void;
};

type FormValues = {
  currentStatus: string;
  futureGoal: string;
  investment: string;
  transferIntent: (typeof TRANSFER_OPTIONS)[number] | null;
};

type SelectorFieldKey = (typeof MORE_FIELDS)[number]['key'];

type SelectorRowProps = {
  isLast?: boolean;
  isOpen: boolean;
  label: string;
  openUpward?: boolean;
  onPress: () => void;
  onSelect: (value: string) => void;
  options: readonly string[];
  placeholder: string;
  value: string;
};

function SelectorRow({
  isLast = false,
  isOpen,
  label,
  openUpward = false,
  onPress,
  onSelect,
  options,
  placeholder,
  value,
}: SelectorRowProps) {
  const displayText = value || placeholder;
  const isPlaceholder = value.length === 0;

  return (
    <View style={[styles.selectorRowWrap, isOpen && styles.selectorRowWrapActive]}>
      <Pressable
        onPress={onPress}
        style={[
          styles.infoRow,
          {
            borderBottomWidth: isLast ? 0 : StyleSheet.hairlineWidth,
          },
        ]}
      >
        <Text style={styles.infoLabel}>{label}</Text>
        <View style={styles.selectorTrigger}>
          <Text style={[styles.selectorText, isPlaceholder && styles.selectorPlaceholderText]}>
            {displayText}
          </Text>
          <View style={[styles.selectorIconWrap, isOpen && styles.selectorIconWrapActive]}>
            <MaterialIcons
              color={isOpen ? 'rgba(10, 191, 186, 1)' : 'rgba(196, 201, 209, 1)'}
              name={isOpen ? 'keyboard-arrow-down' : 'chevron-right'}
              size={22}
            />
          </View>
        </View>
      </Pressable>

      {isOpen ? (
        <View
          style={[
            styles.selectorDropdown,
            openUpward ? styles.selectorDropdownUpward : styles.selectorDropdownDownward,
          ]}
        >
          {options.map((option, index) => {
            const selected = value === option;

            return (
              <Pressable
                key={option}
                onPress={() => onSelect(option)}
                style={[
                  styles.selectorOption,
                  index < options.length - 1 && styles.selectorOptionBorder,
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

export default function IdentityMorePage({ onBack, onNavigate }: IdentityMorePageProps) {
  const [formValues, setFormValues] = useState<FormValues>({
    currentStatus: '',
    futureGoal: '',
    investment: '',
    transferIntent: null,
  });
  const [activeSelectorKey, setActiveSelectorKey] = useState<SelectorFieldKey | null>(null);
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  const pageScale = Math.min(screenWidth / DESIGN_SCREEN_WIDTH, screenHeight / DESIGN_SCREEN_HEIGHT);

  const updateField = (field: keyof FormValues, value: string | FormValues['transferIntent']) => {
    setFormValues((current) => ({ ...current, [field]: value }));
  };

  const toggleSelector = (field: SelectorFieldKey) => {
    setActiveSelectorKey((current) => (current === field ? null : field));
  };

  const handleSelect = (field: SelectorFieldKey, value: string) => {
    updateField(field, value);
    setActiveSelectorKey(null);
  };

  return (
    <IdentityScreenBackground>
      <TouchableWithoutFeedback
        accessible={false}
        onPress={() => {
          setActiveSelectorKey(null);
          Keyboard.dismiss();
        }}
      >
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
            contentContainerStyle={styles.scrollContent}
          >
            <View style={styles.stage}>
              <View
                style={[
                  styles.scaledCanvasViewport,
                  {
                    width: DESIGN_SCREEN_WIDTH * pageScale,
                    height: DESIGN_SCREEN_HEIGHT * pageScale,
                  },
                ]}
              >
                <View
                  style={[
                    styles.canvas,
                    {
                      transform: [{ scale: pageScale }],
                    },
                  ]}
                >
                  <Image
                    resizeMode="contain"
                    source={require('../../assets/jixiangwu.png')}
                    style={styles.jixiangwuLayer}
                  />

                  <View style={styles.foregroundLayer}>
                    <Text style={styles.pageTitle}>新建档案</Text>

                    <View style={styles.sectionWrap}>
                      <View style={styles.sectionHeader}>
                        <Text style={styles.sectionHeaderText}>更多信息</Text>
                      </View>

                      <View style={styles.sectionCard}>
                        <View style={styles.intentRow}>
                          <Text style={styles.infoLabel}>转专业意愿</Text>
                          <View style={styles.intentOptions}>
                            {TRANSFER_OPTIONS.map((option) => {
                              const selected = formValues.transferIntent === option;

                              return (
                                <Pressable
                                  key={option}
                                  hitSlop={6}
                                  onPress={() => updateField('transferIntent', option)}
                                  style={styles.intentOption}
                                >
                                  <View style={[styles.radioOuter, selected && styles.radioOuterSelected]}>
                                    {selected ? <View style={styles.radioInner} /> : null}
                                  </View>
                                  <Text style={styles.intentOptionText}>{option}</Text>
                                </Pressable>
                              );
                            })}
                          </View>
                        </View>

                        {MORE_FIELDS.map((field, index) => (
                          <SelectorRow
                            key={field.key}
                            isLast={index === MORE_FIELDS.length - 1}
                            isOpen={activeSelectorKey === field.key}
                            label={field.label}
                            openUpward={index >= MORE_FIELDS.length - 2}
                            onPress={() => toggleSelector(field.key)}
                            onSelect={(value) => handleSelect(field.key, value)}
                            options={field.options}
                            placeholder={field.placeholder}
                            value={formValues[field.key]}
                          />
                        ))}
                      </View>
                    </View>

                    <BottomArrowNavigation
                      bottom={STANDARD_ARROW_BOTTOM}
                      leftDisabled={!onBack}
                      onLeftPress={onBack}
                      onRightPress={onNavigate}
                      rightDisabled={!onNavigate}
                      scaleX={1}
                    />
                  </View>
                </View>
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </TouchableWithoutFeedback>
    </IdentityScreenBackground>
  );
}

const styles = StyleSheet.create({
  keyboardAvoidingView: {
    flex: 1,
  },
  screenScroll: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  stage: {
    minWidth: '100%',
    minHeight: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scaledCanvasViewport: {
    position: 'relative',
    overflow: 'visible',
  },
  canvas: {
    width: DESIGN_SCREEN_WIDTH,
    height: DESIGN_SCREEN_HEIGHT,
    position: 'absolute',
    top: 0,
    left: 0,
    transformOrigin: 'top left',
  },
  jixiangwuLayer: {
    position: 'absolute',
    left: JIXIANGWU_LEFT,
    top: JIXIANGWU_TOP,
    width: JIXIANGWU_WIDTH,
    height: JIXIANGWU_HEIGHT,
    opacity: 1,
    zIndex: 1,
  },
  foregroundLayer: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 2,
  },
  pageTitle: {
    position: 'absolute',
    left: 28,
    top: 161,
    width: 144,
    height: 53,
    fontSize: 36,
    lineHeight: 52.13,
    fontWeight: '700',
    letterSpacing: 0,
    color: 'rgba(0, 0, 0, 1)',
    textAlign: 'left',
  },
  sectionWrap: {
    position: 'absolute',
    top: 320,
    left: 15,
    width: 346,
  },
  sectionHeader: {
    width: 244,
    height: 31,
    paddingLeft: 10,
    borderTopLeftRadius: 3,
    borderTopRightRadius: 3,
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
    borderRadius: 8,
    paddingTop: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.98)',
    overflow: 'visible',
  },
  intentRow: {
    minHeight: 46,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingLeft: 22,
    paddingRight: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(238, 238, 238, 1)',
  },
  intentOptions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  intentOption: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 12,
  },
  radioOuter: {
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 1,
    borderColor: 'rgba(200, 200, 200, 1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioOuterSelected: {
    borderColor: 'rgba(16, 142, 233, 1)',
  },
  radioInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(16, 142, 233, 1)',
  },
  intentOptionText: {
    marginLeft: 6,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '400',
    letterSpacing: 0,
    color: 'rgba(106, 106, 106, 1)',
  },
  infoRow: {
    minHeight: 63,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingLeft: 22,
    paddingRight: 14,
    borderBottomColor: 'rgba(238, 238, 238, 1)',
  },
  infoLabel: {
    fontSize: 16,
    lineHeight: 22,
    fontWeight: '600',
    letterSpacing: 0,
    color: 'rgba(106, 106, 106, 1)',
  },
  selectorRowWrap: {
    position: 'relative',
    zIndex: 1,
  },
  selectorRowWrapActive: {
    zIndex: 20,
  },
  selectorTrigger: {
    width: 206,
    minHeight: 63,
    paddingLeft: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },
  selectorText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '400',
    letterSpacing: 0,
    color: 'rgba(106, 106, 106, 1)',
    textAlign: 'left',
  },
  selectorPlaceholderText: {
    color: 'rgba(166, 166, 166, 1)',
  },
  selectorIconWrap: {
    width: 28,
    height: 28,
    marginLeft: 12,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: 'rgba(212, 212, 212, 1)',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 1)',
  },
  selectorIconWrapActive: {
    borderColor: 'rgba(130, 227, 221, 1)',
  },
  selectorDropdown: {
    position: 'absolute',
    right: 6,
    width: 320,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 1)',
    shadowColor: 'rgba(0, 0, 0, 0.18)',
    shadowOpacity: 1,
    shadowRadius: 10,
    elevation: 10,
  },
  selectorDropdownDownward: {
    top: 48,
    shadowOffset: {
      width: 0,
      height: 4,
    },
  },
  selectorDropdownUpward: {
    bottom: 48,
    shadowOffset: {
      width: 0,
      height: -4,
    },
  },
  selectorOption: {
    minHeight: 58,
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  selectorOptionBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(224, 224, 224, 1)',
  },
  selectorRadioOuter: {
    width: 18,
    height: 18,
    marginTop: 3,
    marginRight: 12,
    borderRadius: 9,
    borderWidth: 1.5,
    borderColor: 'rgba(188, 188, 188, 1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectorRadioOuterSelected: {
    borderColor: 'rgba(10, 191, 186, 1)',
  },
  selectorRadioInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(10, 191, 186, 1)',
  },
  selectorOptionText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 20,
    fontWeight: '400',
    letterSpacing: 0,
    color: 'rgba(106, 106, 106, 1)',
  },
});
