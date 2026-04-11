import { StyleSheet, Text, View } from 'react-native';

export default function ProfilePage() {
  return (
    <View style={styles.pageWrap}>
      <Text style={styles.pageText}>画像</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pageWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 110,
  },
  pageText: {
    fontSize: 72,
    fontWeight: '700',
    color: '#0f172a',
  },
});
