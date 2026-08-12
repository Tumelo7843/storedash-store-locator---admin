import type { ApprovalStatus } from '@storedash/shared';
import { AlertTriangle, Clock } from 'lucide-react';

interface ApprovalStatusBannerProps {
  status: ApprovalStatus;
  rejectionReason: string | null;
}

// Full-width banner for single-entity edit pages (store settings, product/
// service modals) — approved items render nothing, same as ApprovalBadge.
export function ApprovalStatusBanner({ status, rejectionReason }: ApprovalStatusBannerProps) {
  if (status === 'approved') return null;

  if (status === 'pending') {
    return (
      <p className="flex items-start gap-2 text-xs font-semibold text-amber-700 bg-amber-50 border border-amber-200 p-3 rounded-lg">
        <Clock className="size-4 shrink-0 mt-0.5" />
        Awaiting Super Admin approval. This won't be visible to customers until it's approved.
      </p>
    );
  }

  return (
    <div className="flex items-start gap-2 text-xs font-semibold text-rose-700 bg-rose-50 border border-rose-200 p-3 rounded-lg">
      <AlertTriangle className="size-4 shrink-0 mt-0.5" />
      <span>
        Rejected{rejectionReason ? `: ${rejectionReason}` : ''}. Make changes and save to resubmit for review.
      </span>
    </div>
  );
}
