import { useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import { Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';

import BottomArrowNavigation from '../../components/bottom-arrow-navigation';

const DESIGN_SCREEN_WIDTH = 375;
const DESIGN_SCREEN_HEIGHT = 812;
const EDUCATION_OPTIONS = ['高中毕业', '大一', '大二', '大三', '大四'] as const;

type NextPageProps = {
  onBack?: () => void;
  onNavigate?: () => void;
};

export default function NextPage({ onBack, onNavigate }: NextPageProps) {
  const [selectedOption, setSelectedOption] = useState<(typeof EDUCATION_OPTIONS)[number]>('大三');
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  const scaleX = screenWidth / DESIGN_SCREEN_WIDTH;
  const scaleY = screenHeight / DESIGN_SCREEN_HEIGHT;
  const textScale = Math.min(scaleX, scaleY);

  return (
    <LinearGradient
      colors={['rgba(168, 237, 229, 1)', 'rgba(252, 250, 250, 1)']}
      start={{ x: 0.5, y: 0 }}
      end={{ x: 0.5, y: 1 }}
      style={styles.screen}
    >
      <StatusBar style="dark" />
      <View
        style={[
          styles.titleWrap,
          {
            left: 116 * scaleX,
            top: 129 * scaleY,
            width: 144 * scaleX,
            height: 53 * scaleY,
          },
        ]}
      >
        <Text
          style={[
            styles.titleText,
            {
              fontSize: 36 * textScale,
              lineHeight: 52.13 * textScale,
            },
          ]}
        >
          选择身份
        </Text>
      </View>
      <View
        style={[
          styles.whitePanel,
          {
            left: 15 * scaleX,
            top: 218 * scaleY,
            width: 346 * scaleX,
            height: 340 * scaleY,
            borderRadius: 20 * textScale,
          },
        ]}
      >
        <View
          style={[
            styles.selectorList,
            {
              borderRadius: 10 * textScale,
              paddingVertical: 6 * scaleY,
            },
          ]}
        >
          {EDUCATION_OPTIONS.map((option) => {
            const isSelected = option === selectedOption;

            return (
              <Pressable
                key={option}
                onPress={() => setSelectedOption(option)}
                style={[
                  styles.selectorItem,
                  {
                    minHeight: 52 * scaleY,
                    borderRadius: 8 * textScale,
                  },
                  isSelected ? styles.selectorItemSelected : styles.selectorItemDefault,
                ]}
              >
                <Text
                  style={[
                    styles.selectorText,
                    {
                      fontSize: 20 * textScale,
                      lineHeight: 36.43 * textScale,
                    },
                    isSelected ? styles.selectorTextSelected : styles.selectorTextDefault,
                  ]}
                >
                  {option}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      <BottomArrowNavigation
        bottom={18 * scaleY}
        hideLeft
        onLeftPress={onBack}
        onRightPress={onNavigate}
        rightDisabled={!onNavigate}
        scaleX={scaleX}
      />
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    position: 'relative',
  },
  titleWrap: {
    position: 'absolute',
    opacity: 1,
  },
  titleText: {
    fontWeight: '700',
    letterSpacing: 0,
    color: 'rgba(0, 0, 0, 1)',
    textAlign: 'left',
  },
  whitePanel: {
    position: 'absolute',
    opacity: 1,
    backgroundColor: 'rgba(255, 255, 255, 1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectorList: {
    width: '92%',
    backgroundColor: 'rgba(247, 247, 247, 1)',
    overflow: 'hidden',
  },
  selectorItem: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectorItemDefault: {
    backgroundColor: 'transparent',
  },
  selectorItemSelected: {
    backgroundColor: 'rgba(166, 166, 166, 0.2)',
  },
  selectorText: {
    fontWeight: '400',
    letterSpacing: 0,
    textAlign: 'center',
  },
  selectorTextDefault: {
    color: 'rgba(0, 0, 0, 1)',
  },
  selectorTextSelected: {
    color: 'rgba(16, 142, 233, 1)',
  },
});
