import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet } from 'react-native';

import BottomArrowNavigation from '../../components/bottom-arrow-navigation';

type AiAnalysisEntryPageProps = {
  onBack?: () => void;
  onNavigate?: () => void;
};

export default function AiAnalysisEntryPage({ onBack, onNavigate }: AiAnalysisEntryPageProps) {
  return (
    <LinearGradient
      colors={['rgba(252, 250, 250, 1)', 'rgba(168, 237, 229, 1)']}
      start={{ x: 0.5, y: 0 }}
      end={{ x: 0.5, y: 1 }}
      style={styles.screen}
    >
      <StatusBar style="dark" />
      <BottomArrowNavigation
        leftDisabled={!onBack}
        onLeftPress={onBack}
        onRightPress={onNavigate}
        rightDisabled={!onNavigate}
        scaleX={1}
      />
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    position: 'relative',
  },
});
