import { useState } from 'react';
import {
  Image,
  Keyboard,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TouchableWithoutFeedback,
  View,
  useWindowDimensions,
} from 'react-native';

import BottomArrowNavigation from '../../components/bottom-arrow-navigation';
import IdentityScreenBackground from '../../components/identity-screen-background';

const DESIGN_SCREEN_WIDTH = 375;
const DESIGN_SCREEN_HEIGHT = 812;
const JIXIANGWU_LEFT = 108;
const JIXIANGWU_TOP = 21;
const JIXIANGWU_WIDTH = 428;
const JIXIANGWU_HEIGHT = 644;

const TRANSFER_OPTIONS = ['有', '没有', '不确定'] as const;
const MORE_FIELDS = [
  { key: 'investment', label: '经济投入', placeholder: '请输入经济投入' },
  { key: 'futureGoal', label: '未来目标', placeholder: '请输入未来目标' },
  { key: 'currentStatus', label: '目前状态', placeholder: '请输入目前状态' },
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

type InputRowProps = {
  isLast?: boolean;
  label: string;
  onChangeText: (text: string) => void;
  placeholder: string;
  value: string;
};

function InputRow({ isLast = false, label, onChangeText, placeholder, value }: InputRowProps) {
  return (
    <View
      style={[
        styles.infoRow,
        {
          borderBottomWidth: isLast ? 0 : StyleSheet.hairlineWidth,
        },
      ]}
    >
      <Text style={styles.infoLabel}>{label}</Text>
      <TextInput
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="rgba(166, 166, 166, 1)"
        style={styles.fieldInput}
        value={value}
      />
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
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  const pageScale = Math.min(screenWidth / DESIGN_SCREEN_WIDTH, screenHeight / DESIGN_SCREEN_HEIGHT);

  const updateField = (field: keyof FormValues, value: string | FormValues['transferIntent']) => {
    setFormValues((current) => ({ ...current, [field]: value }));
  };

  return (
    <IdentityScreenBackground>
      <TouchableWithoutFeedback accessible={false} onPress={Keyboard.dismiss}>
        <View style={styles.stage}>
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
                    <InputRow
                      key={field.key}
                      isLast={index === MORE_FIELDS.length - 1}
                      label={field.label}
                      onChangeText={(value) => updateField(field.key, value)}
                      placeholder={field.placeholder}
                      value={formValues[field.key]}
                    />
                  ))}
                </View>
              </View>

              <BottomArrowNavigation
                leftDisabled={!onBack}
                onLeftPress={onBack}
                onRightPress={onNavigate}
                rightDisabled={!onNavigate}
                scaleX={1}
              />
            </View>
          </View>
        </View>
      </TouchableWithoutFeedback>
    </IdentityScreenBackground>
  );
}

const styles = StyleSheet.create({
  stage: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  canvas: {
    width: DESIGN_SCREEN_WIDTH,
    height: DESIGN_SCREEN_HEIGHT,
    position: 'relative',
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
    overflow: 'hidden',
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
    minHeight: 52,
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
  fieldInput: {
    width: 190,
    paddingVertical: 0,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '400',
    letterSpacing: 0,
    color: 'rgba(106, 106, 106, 1)',
    textAlign: 'right',
  },
});
