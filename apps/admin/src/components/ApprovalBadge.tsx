import type { ApprovalStatus } from '@storedash/shared';

const STYLES: Record<ApprovalStatus, string> = {
  pending: 'bg-amber-50 text-amber-700 border-amber-200',
  approved: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  rejected: 'bg-rose-50 text-rose-700 border-rose-200',
};

const LABELS: Record<ApprovalStatus, string> = {
  pending: 'Pending review',
  approved: 'Approved',
  rejected: 'Rejected',
};

// Compact badge for list rows/cards — approved items render nothing (already
// live, no need to say so on every row), matching how `!isActive` is shown.
export function ApprovalBadge({ status }: { status: ApprovalStatus }) {
  if (status === 'approved') return null;
  return <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border shrink-0 ${STYLES[status]}`}>{LABELS[status]}</span>;
}
