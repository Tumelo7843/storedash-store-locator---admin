import { LegalScreen } from '../../src/components/LegalScreen';
import { PRIVACY_POLICY } from '../../src/content/legal';

export default function PrivacyPolicyScreen() {
  return <LegalScreen title="Privacy Policy" sections={PRIVACY_POLICY} />;
}
