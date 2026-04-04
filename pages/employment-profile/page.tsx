import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View, useWindowDimensions } from 'react-native';

import BottomArrowNavigation, { STANDARD_ARROW_BOTTOM } from '../../components/bottom-arrow-navigation';

const DESIGN_SCREEN_WIDTH = 375;
const DESIGN_SCREEN_HEIGHT = 812;

type EmploymentProfilePageProps = {
  onBack?: () => void;
};

export default function EmploymentProfilePage({ onBack }: EmploymentProfilePageProps) {
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  const scaleX = screenWidth / DESIGN_SCREEN_WIDTH;
  const scaleY = screenHeight / DESIGN_SCREEN_HEIGHT;

  return (
    <View style={styles.screen}>
      <StatusBar style="dark" />
      <BottomArrowNavigation
        bottom={STANDARD_ARROW_BOTTOM * scaleY}
        hideRight
        leftDisabled={!onBack}
        onLeftPress={onBack}
        scaleX={scaleX}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#ffffff',
    position: 'relative',
  },
});
