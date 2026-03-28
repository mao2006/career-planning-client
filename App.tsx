import { useState } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import LoginPage from './pages/login/page';
import NextPage from './pages/next/page';
import SplashPage from './pages/splash/page';

type ScreenKey = 'splash' | 'login' | 'next';

export default function App() {
  const [screen, setScreen] = useState<ScreenKey>('splash');

  return (
    <SafeAreaProvider>
      {screen === 'splash' ? (
        <SplashPage onFinished={() => setScreen('login')} />
      ) : screen === 'login' ? (
        <LoginPage onSubmit={() => setScreen('next')} />
      ) : (
        <NextPage />
      )}
    </SafeAreaProvider>
  );
}
