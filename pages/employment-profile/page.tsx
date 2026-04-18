import EmploymentProfileScreen from '../../components/employment-profile-screen';

type EmploymentProfilePageProps = {
  onBack?: () => void;
  onNavigate?: () => void;
};

export default function EmploymentProfilePage({ onBack, onNavigate }: EmploymentProfilePageProps) {
  return <EmploymentProfileScreen onBack={onBack} onNavigate={onNavigate} />;
}
