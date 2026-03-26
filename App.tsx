import { SafeAreaProvider } from 'react-native-safe-area-context';
import LoginPage from './pages/login/page';

export default function App() {
  return (
    <SafeAreaProvider>
      <LoginPage />
    </SafeAreaProvider>
  );
}
