import { type ReactNode, useState } from 'react';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import {
  Keyboard,
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

const BASE_FIELDS = [
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
  onChangeText: (text: string) => void;
  placeholder: string;
  value: string;
};

type SectionCardProps = {
  children: ReactNode;
  headerText: string;
};

function InputRow({
  isLast = false,
  label,
  minHeight,
  onChangeText,
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

function SectionCard({ children, headerText }: SectionCardProps) {
  return (
    <View style={styles.sectionWrap}>
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
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  const pageScale = Math.min(screenWidth / DESIGN_SCREEN_WIDTH, screenHeight / DESIGN_SCREEN_HEIGHT);

  const handleOutsidePress = () => {
    Keyboard.dismiss();
  };

  const updateField = (field: keyof FormValues, value: string) => {
    setFormValues((current) => ({ ...current, [field]: value }));
  };

  return (
    <IdentityScreenBackground>
      <TouchableWithoutFeedback accessible={false} onPress={handleOutsidePress}>
        <View style={styles.stage}>
          <View
            style={[
              styles.canvas,
              {
                transform: [{ scale: pageScale }],
              },
            ]}
          >
            <View style={styles.foregroundLayer}>
              <Text style={styles.pageTitle}>新建档案</Text>

              <View style={styles.contentColumn}>
                <View style={styles.resumeHint}>
                  <MaterialIcons color="rgba(95, 167, 239, 1)" name="check-circle" size={14} />
                  <Text style={styles.resumeHintText}>导入简历一键填写</Text>
                </View>

                <SectionCard headerText="基础信息">
                  {BASE_FIELDS.map((field, index) => (
                    <InputRow
                      key={field.key}
                      isLast={index === BASE_FIELDS.length - 1}
                      label={field.label}
                      minHeight={46}
                      onChangeText={(value) => updateField(field.key, value)}
                      placeholder={field.placeholder}
                      value={formValues[field.key]}
                    />
                  ))}
                </SectionCard>

                <View style={styles.sectionGap} />

                <SectionCard headerText="个人档案（可选填）">
                  {PROFILE_FIELDS.map((field, index) => (
                    <InputRow
                      key={field.label}
                      isLast={index === PROFILE_FIELDS.length - 1}
                      label={field.label}
                      minHeight={43}
                      onChangeText={(value) => updateField(field.key, value)}
                      placeholder={field.placeholder}
                      value={formValues[field.key]}
                    />
                  ))}
                </SectionCard>
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
  foregroundLayer: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 2,
  },
  pageTitle: {
    position: 'absolute',
    top: 96,
    left: 0,
    right: 0,
    fontSize: 36,
    lineHeight: 52.13,
    fontWeight: '700',
    letterSpacing: 0,
    color: 'rgba(0, 0, 0, 1)',
    textAlign: 'center',
  },
  contentColumn: {
    position: 'absolute',
    top: 164,
    left: 15,
    width: 346,
  },
  resumeHint: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  resumeHintText: {
    marginLeft: 4,
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '500',
    letterSpacing: 0,
    color: 'rgba(95, 167, 239, 1)',
  },
  sectionWrap: {
    width: '100%',
    position: 'relative',
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
  sectionGap: {
    height: 24,
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
