import { SafeAreaProvider } from 'react-native-safe-area-context';
import MainPage from './pages/page';

export default function App() {
  return (
    <SafeAreaProvider>
      <MainPage />
    </SafeAreaProvider>
  );
}
