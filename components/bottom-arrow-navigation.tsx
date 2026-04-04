import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { Pressable, StyleSheet, View } from 'react-native';

type BottomArrowNavigationProps = {
  bottom?: number;
  hideLeft?: boolean;
  hideRight?: boolean;
  leftDisabled?: boolean;
  onLeftPress?: () => void;
  onRightPress?: () => void;
  rightDisabled?: boolean;
  scaleX: number;
};

export default function BottomArrowNavigation({
  bottom = 14,
  hideLeft = false,
  hideRight = false,
  leftDisabled = false,
  onLeftPress,
  onRightPress,
  rightDisabled = false,
  scaleX,
}: BottomArrowNavigationProps) {
  return (
    <View
      pointerEvents="box-none"
      style={[
        styles.bottomNavigation,
        {
          left: 0,
          right: 0,
          bottom,
          paddingHorizontal: 18 * scaleX,
          justifyContent: hideLeft ? 'flex-end' : hideRight ? 'flex-start' : 'space-between',
        },
      ]}
    >
      {hideLeft ? null : (
        <Pressable
          disabled={leftDisabled}
          hitSlop={10}
          onPress={onLeftPress}
          style={styles.navArrowButton}
        >
          <MaterialIcons color="rgba(196, 201, 209, 1)" name="chevron-left" size={42} />
        </Pressable>
      )}
      {hideRight ? null : (
        <Pressable
          disabled={rightDisabled}
          hitSlop={10}
          onPress={onRightPress}
          style={styles.navArrowButton}
        >
          <MaterialIcons color="rgba(196, 201, 209, 1)" name="chevron-right" size={42} />
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  bottomNavigation: {
    position: 'absolute',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  navArrowButton: {
    width: 56,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
