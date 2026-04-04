import { useState } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import AiAnalysisEntryPage from './pages/ai-analysis-entry/page';
import EmploymentProfilePage from './pages/employment-profile/page';
import IdentityDetailPage from './pages/identity-detail/page';
import IdentityMorePage from './pages/identity-more/page';
import LoginPage from './pages/login/page';
import SelectIdentityPage from './pages/select-identity/page';
import SplashPage from './pages/splash/page';

type ScreenKey =
  | 'splash'
  | 'login'
  | 'next'
  | 'identityDetail'
  | 'identityMore'
  | 'aiAnalysisEntry'
  | 'employmentProfile';

export default function App() {
  const [screen, setScreen] = useState<ScreenKey>('splash');

  return (
    <SafeAreaProvider>
      {screen === 'splash' ? (
        <SplashPage onFinished={() => setScreen('login')} />
      ) : screen === 'login' ? (
        <LoginPage onSubmit={() => setScreen('next')} />
      ) : screen === 'next' ? (
        <SelectIdentityPage onBack={() => setScreen('login')} onNavigate={() => setScreen('identityDetail')} />
      ) : screen === 'identityDetail' ? (
        <IdentityDetailPage onBack={() => setScreen('next')} onNavigate={() => setScreen('identityMore')} />
      ) : screen === 'identityMore' ? (
        <IdentityMorePage
          onBack={() => setScreen('identityDetail')}
          onNavigate={() => setScreen('aiAnalysisEntry')}
        />
      ) : screen === 'aiAnalysisEntry' ? (
        <AiAnalysisEntryPage
          onBack={() => setScreen('identityMore')}
          onNavigate={() => setScreen('employmentProfile')}
        />
      ) : (
        <EmploymentProfilePage onBack={() => setScreen('aiAnalysisEntry')} />
      )}
    </SafeAreaProvider>
  );
}
