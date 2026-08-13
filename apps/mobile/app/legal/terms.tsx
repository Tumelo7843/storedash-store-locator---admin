import { LegalScreen } from '../../src/components/LegalScreen';
import { TERMS_OF_SERVICE } from '../../src/content/legal';

export default function TermsScreen() {
  return <LegalScreen title="Terms of Service" sections={TERMS_OF_SERVICE} />;
}
