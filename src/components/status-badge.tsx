import { formatStatus } from "@/lib/format";
import type { ProposalStatus } from "@/lib/types";

type StatusBadgeProps = {
  status: ProposalStatus;
};

export function StatusBadge({ status }: StatusBadgeProps) {
  return <span className={`status-badge status-${status.toLowerCase()}`}>{formatStatus(status)}</span>;
}
