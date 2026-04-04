import { useEffect, useRef, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
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

const DESIGN_SCREEN_WIDTH = 375;
const DESIGN_SCREEN_HEIGHT = 812;

type LoginPageProps = {
  onSubmit?: () => void;
};

export default function LoginPage({ onSubmit }: LoginPageProps) {
  const [agreed, setAgreed] = useState(false);
  const [phone, setPhone] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [countdown, setCountdown] = useState(0);
  const phoneInputRef = useRef<TextInput>(null);
  const verificationCodeInputRef = useRef<TextInput>(null);
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  const scaleX = screenWidth / DESIGN_SCREEN_WIDTH;
  const scaleY = screenHeight / DESIGN_SCREEN_HEIGHT;
  const textScale = Math.min(scaleX, scaleY);

  const orangeDecorWidth = 472 * scaleX;
  const panelWidth = 355 * scaleX;
  const panelHeight = 449 * scaleY;
  const panelBottom = -17 * scaleY;
  const panelTop = screenHeight - panelHeight - panelBottom;
  const logoPlaceholderSize = 133 * textScale;
  const logoPlaceholderTop = panelTop - 136 * scaleY - logoPlaceholderSize;
  const titleWidth = 158 * scaleX;
  const titleHeight = 53 * scaleY;
  const titleTop = panelTop - 55 * scaleY - titleHeight;
  const inputWidth = 316 * scaleX;
  const inputHeight = 43 * scaleY;
  const loginButtonHeight = 40 * scaleY;
  const checkboxSize = 12 * textScale;
  const checkboxDotSize = 6 * textScale;

  const dismissInput = (inputRef: React.RefObject<TextInput | null>) => {
    inputRef.current?.blur();
    Keyboard.dismiss();
  };

  useEffect(() => {
    if (countdown <= 0) return;

    const timer = setTimeout(() => {
      setCountdown((current) => current - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [countdown]);

  const handleGetCodePress = () => {
    if (countdown > 0) return;

    Keyboard.dismiss();
    setCountdown(60);
  };

  return (
    <TouchableWithoutFeedback accessible={false} onPress={Keyboard.dismiss}>
      <LinearGradient
        colors={['rgba(168, 237, 229, 1)', 'rgba(252, 250, 250, 1)']}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={styles.screen}
      >
        <StatusBar style="dark" />
        <Image
          source={require('../../assets/oringe.png')}
          style={[
            styles.orangeDecor,
            {
              left: -55 * scaleX,
              top: -20 * scaleY,
              width: orangeDecorWidth,
              height: 637 * scaleY,
            },
          ]}
          resizeMode="contain"
        />
        <View
          style={[
            styles.logoPlaceholder,
            {
              top: logoPlaceholderTop,
              width: logoPlaceholderSize,
              height: logoPlaceholderSize,
              borderRadius: logoPlaceholderSize / 2,
              transform: [{ translateX: -logoPlaceholderSize / 2 }],
            },
          ]}
        />
        <View
          style={[
            styles.authTitleWrap,
            {
              top: titleTop,
              width: titleWidth,
              height: titleHeight,
              transform: [{ translateX: -titleWidth / 2 }],
            },
          ]}
        >
          <Text
            style={[
              styles.authTitle,
              {
                fontSize: 36 * textScale,
                lineHeight: 52.13 * textScale,
              },
            ]}
          >
            登陆/注册
          </Text>
        </View>
        <View
          style={[
            styles.panel,
            {
              bottom: panelBottom,
              width: panelWidth,
              height: panelHeight,
              borderRadius: 20 * textScale,
              transform: [{ translateX: -panelWidth / 2 }],
            },
          ]}
        >
        <View
          style={[
            styles.inputField,
            {
              top: 31 * scaleY,
              width: inputWidth,
              height: inputHeight,
              borderRadius: 6 * textScale,
              transform: [{ translateX: -inputWidth / 2 }],
            },
          ]}
        >
          <TextInput
            ref={phoneInputRef}
            keyboardType="number-pad"
            maxLength={11}
            onChangeText={(text) => {
              setPhone(text);
              if (text.length >= 11) dismissInput(phoneInputRef);
            }}
            placeholder="请输入手机"
            placeholderTextColor="rgba(128, 128, 128, 1)"
            style={[
              styles.inputText,
              {
                paddingLeft: 20 * scaleX,
                paddingRight: 20 * scaleX,
                fontSize: 14 * textScale,
              },
            ]}
            value={phone}
          />
        </View>

        <View
          style={[
            styles.inputField,
            styles.verificationField,
            {
              top: 89 * scaleY,
              width: inputWidth,
              height: inputHeight,
              borderRadius: 6 * textScale,
              transform: [{ translateX: -inputWidth / 2 }],
            },
          ]}
        >
          <TextInput
            ref={verificationCodeInputRef}
            keyboardType="number-pad"
            maxLength={6}
            onChangeText={(text) => {
              setVerificationCode(text);
              if (text.length >= 6) dismissInput(verificationCodeInputRef);
            }}
            placeholder="请输入验证码"
            placeholderTextColor="rgba(128, 128, 128, 1)"
            style={[
              styles.inputText,
              styles.verificationInput,
              {
                paddingLeft: 20 * scaleX,
                fontSize: 14 * textScale,
              },
            ]}
            value={verificationCode}
          />
          <Pressable
            accessibilityState={{ disabled: countdown > 0 }}
            disabled={countdown > 0}
            hitSlop={8}
            onPress={handleGetCodePress}
            style={[
              styles.getCodeButton,
              {
                marginRight: 20 * scaleX,
              },
            ]}
          >
            <Text
              style={[
                styles.getCodeText,
                countdown > 0 && styles.getCodeTextDisabled,
                {
                  fontSize: 14 * textScale,
                  lineHeight: 18.56 * textScale,
                },
              ]}
            >
              {countdown > 0 ? `${countdown}秒后重试` : '获取验证码'}
            </Text>
          </Pressable>
        </View>

        <Pressable
          onPress={() => {
            Keyboard.dismiss();
            onSubmit?.();
          }}
          style={[
            styles.loginButtonWrap,
            {
              left: 11 * scaleX,
              top: 224 * scaleY,
              width: 333 * scaleX,
              height: loginButtonHeight,
              borderRadius: 172 * textScale,
            },
          ]}
        >
          <LinearGradient
            colors={['rgba(31, 184, 161, 1)', 'rgba(46, 217, 163, 1)']}
            start={{ x: 0, y: 0.5 }}
            end={{ x: 1, y: 0.5 }}
            style={styles.loginButton}
          >
            <Text
              style={[
                styles.loginButtonText,
                {
                  fontSize: 16 * textScale,
                  lineHeight: 21.22 * textScale,
                },
              ]}
            >
              登陆/注册
            </Text>
          </LinearGradient>
        </Pressable>

        <View
          style={[
            styles.agreementWrap,
            {
              bottom: 32 * scaleY,
            },
          ]}
        >
          <Pressable
            accessibilityRole="checkbox"
            accessibilityState={{ checked: agreed }}
            hitSlop={8}
            onPress={() => setAgreed((current) => !current)}
            style={[
              styles.checkbox,
              {
                width: checkboxSize,
                height: checkboxSize,
                marginRight: 3 * scaleX,
                borderRadius: checkboxSize / 2,
                borderWidth: Math.max(1, 1.5 * textScale),
              },
              agreed && styles.checkboxChecked,
            ]}
          >
            {agreed ? (
              <View
                style={[
                  styles.checkboxDot,
                  {
                    width: checkboxDotSize,
                    height: checkboxDotSize,
                    borderRadius: checkboxDotSize / 2,
                  },
                ]}
              />
            ) : null}
          </Pressable>

          <View
            style={[
              styles.agreementTextGroup,
              {
                marginTop: -3.5 * scaleY,
              },
            ]}
          >
            <Text
              style={[
                styles.agreementText,
                {
                  fontSize: 12 * textScale,
                  lineHeight: 17.38 * textScale,
                },
              ]}
            >
              未注册手机号码验证通过后将自动注册已详读并同意
            </Text>
            <Text
              style={[
                styles.linkLine,
                {
                  fontSize: 12 * textScale,
                  lineHeight: 17.38 * textScale,
                },
              ]}
            >
              <Text
                style={[
                  styles.linkText,
                  {
                    fontSize: 12 * textScale,
                    lineHeight: 17.38 * textScale,
                  },
                ]}
              >
                用户协议
              </Text>
              <Text
                style={[
                  styles.agreementText,
                  {
                    fontSize: 12 * textScale,
                    lineHeight: 17.38 * textScale,
                  },
                ]}
              >
                、
              </Text>
              <Text
                style={[
                  styles.linkText,
                  {
                    fontSize: 12 * textScale,
                    lineHeight: 17.38 * textScale,
                  },
                ]}
              >
                隐私协议
              </Text>
              <Text
                style={[
                  styles.agreementText,
                  {
                    fontSize: 12 * textScale,
                    lineHeight: 17.38 * textScale,
                  },
                ]}
              >
                和
              </Text>
              <Text
                style={[
                  styles.linkText,
                  {
                    fontSize: 12 * textScale,
                    lineHeight: 17.38 * textScale,
                  },
                ]}
              >
                运营商协议
              </Text>
            </Text>
          </View>
        </View>
        </View>

      </LinearGradient>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#ffffff',
    position: 'relative',
    overflow: 'hidden',
  },
  orangeDecor: {
    position: 'absolute',
    opacity: 1,
  },
  panel: {
    position: 'absolute',
    left: '50%',
    opacity: 1,
    backgroundColor: 'rgba(252, 252, 252, 1)',
  },
  logoPlaceholder: {
    position: 'absolute',
    left: '50%',
    opacity: 1,
    backgroundColor: 'rgba(204, 204, 204, 1)',
  },
  authTitleWrap: {
    position: 'absolute',
    left: '50%',
    opacity: 1,
  },
  authTitle: {
    fontWeight: '700',
    letterSpacing: 0,
    color: 'rgba(0, 0, 0, 1)',
    textAlign: 'left',
  },
  inputField: {
    position: 'absolute',
    left: '50%',
    backgroundColor: 'rgba(245, 245, 245, 1)',
    justifyContent: 'center',
  },
  verificationField: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  inputText: {
    flex: 1,
    height: '100%',
    paddingTop: 0,
    paddingBottom: 0,
    paddingVertical: 0,
    fontWeight: '400',
    includeFontPadding: false,
    letterSpacing: 0,
    color: 'rgba(56, 56, 56, 1)',
    textAlignVertical: 'center',
  },
  verificationInput: {
    paddingRight: 0,
  },
  getCodeButton: {
    height: '100%',
    justifyContent: 'center',
    alignItems: 'flex-start',
    flexShrink: 0,
  },
  getCodeText: {
    fontWeight: '400',
    letterSpacing: 0,
    color: 'rgba(35, 188, 163, 1)',
  },
  getCodeTextDisabled: {
    color: 'rgba(153, 153, 153, 1)',
  },
  loginButtonWrap: {
    position: 'absolute',
    overflow: 'hidden',
  },
  loginButton: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loginButtonText: {
    fontSize: 16,
    fontWeight: '400',
    letterSpacing: 0,
    lineHeight: 21.22,
    color: 'rgba(255, 255, 255, 1)',
    textAlign: 'center',
  },
  agreementWrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  checkbox: {
    borderColor: 'rgba(204, 204, 204, 1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: 'rgba(46, 217, 163, 0.12)',
  },
  checkboxDot: {
    backgroundColor: 'rgba(46, 217, 163, 1)',
  },
  agreementTextGroup: {
    alignItems: 'center',
  },
  agreementText: {
    fontSize: 12,
    fontWeight: '400',
    letterSpacing: 0,
    lineHeight: 17.38,
    color: 'rgba(56, 56, 56, 1)',
  },
  linkLine: {
    fontSize: 12,
    fontWeight: '400',
    letterSpacing: 0,
    lineHeight: 17.38,
    color: 'rgba(56, 56, 56, 1)',
  },
  linkText: {
    fontSize: 12,
    fontWeight: '400',
    letterSpacing: 0,
    lineHeight: 17.38,
    color: 'rgba(35, 188, 163, 1)',
  },
});
