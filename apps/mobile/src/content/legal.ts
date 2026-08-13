// TEMPLATE LEGAL CONTENT — NOT LEGAL ADVICE.
// These are generic placeholders so the app ships with working Privacy
// Policy / Terms of Service screens. The StoreDash operator MUST review and
// replace this copy (ideally with counsel) before shipping to real users —
// it does not reflect this project's actual data practices, jurisdiction,
// or business terms.

export interface LegalSection {
  heading: string;
  body: string;
}

export const LEGAL_LAST_UPDATED = '2026-01-01';

export const PRIVACY_POLICY: LegalSection[] = [
  {
    heading: 'Information we collect',
    body: "When you create a StoreDash account we collect your name, email address, and (optionally) phone number. When you sign in with Google or a phone number, we receive the identity details that provider shares with us. When you place an order, we store the order's items, total, and status against your account.",
  },
  {
    heading: 'Location data',
    body: 'If you grant location permission, StoreDash uses your device\'s current position only to sort nearby stores and show your position on the map. Your precise location is not stored on our servers or shared with stores.',
  },
  {
    heading: 'How we use your information',
    body: 'We use your information to operate your account, process and display your orders, and let store owners fulfill orders placed at their store. We do not sell your personal information.',
  },
  {
    heading: 'Data sharing',
    body: 'Order details (your name, contact details, and order contents) are shared with the store you ordered from, so they can fulfill your order. We do not share your data with third parties for marketing purposes.',
  },
  {
    heading: 'Data retention & deletion',
    body: 'You can delete your account at any time from Manage Profile. Deleting your account removes your personal identifying information; past order records may be retained in an anonymized form for the store\'s own bookkeeping.',
  },
  {
    heading: 'Contact us',
    body: 'Replace this section with the operator\'s real contact details (support email, registered business address) before publishing.',
  },
];

export const TERMS_OF_SERVICE: LegalSection[] = [
  {
    heading: 'Acceptance of terms',
    body: 'By creating a StoreDash account and using this app, you agree to these Terms of Service. If you do not agree, please do not use the app.',
  },
  {
    heading: 'Accounts',
    body: 'You are responsible for keeping your account credentials secure and for all activity under your account. You must provide accurate information when creating an account or placing an order.',
  },
  {
    heading: 'Orders',
    body: 'Placing an order through StoreDash sends a request to the selected store; the store is responsible for fulfilling it. StoreDash is a discovery and ordering platform connecting customers with independently operated stores — order fulfillment, product quality, and in-store policies are the responsibility of each store.',
  },
  {
    heading: 'Store owner applications',
    body: 'Applying to become a store owner does not guarantee approval. StoreDash reserves the right to approve, reject, or suspend store-owner access at its discretion.',
  },
  {
    heading: 'Acceptable use',
    body: 'You agree not to misuse the app, attempt to access accounts that are not yours, or interfere with the service\'s normal operation.',
  },
  {
    heading: 'Changes to these terms',
    body: 'We may update these terms from time to time. Continued use of the app after changes take effect constitutes acceptance of the revised terms.',
  },
  {
    heading: 'Governing law',
    body: 'Replace this section with the operator\'s actual governing law / jurisdiction before publishing.',
  },
];
