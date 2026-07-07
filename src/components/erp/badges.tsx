"use client";

import { Badge } from "@/components/ui/badge";
import {
  CUSTOMER_STATUS,
  DEAL_STAGE,
  INVOICE_STATUS,
  INTERACTION_TYPE,
  PAYMENT_METHOD,
} from "@/lib/erp-constants";

export function CustomerStatusBadge({ status }: { status: string }) {
  const cfg = CUSTOMER_STATUS[status as keyof typeof CUSTOMER_STATUS];
  if (!cfg) return <Badge variant="outline">{status}</Badge>;
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${cfg.color}`}
    >
      <span className={`size-1.5 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </span>
  );
}

export function DealStageBadge({ stage }: { stage: string }) {
  const cfg = DEAL_STAGE[stage as keyof typeof DEAL_STAGE];
  if (!cfg) return <Badge variant="outline">{stage}</Badge>;
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${cfg.color}`}
    >
      {cfg.label}
    </span>
  );
}

export function InvoiceStatusBadge({ status }: { status: string }) {
  const cfg = INVOICE_STATUS[status as keyof typeof INVOICE_STATUS];
  if (!cfg) return <Badge variant="outline">{status}</Badge>;
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${cfg.color}`}
    >
      {cfg.label}
    </span>
  );
}

export function InteractionTypeBadge({ type }: { type: string }) {
  const cfg = INTERACTION_TYPE[type as keyof typeof INTERACTION_TYPE];
  if (!cfg) return <Badge variant="outline">{type}</Badge>;
  return (
    <span
      className={`inline-flex items-center rounded-full bg-zinc-100 px-2.5 py-0.5 text-xs font-medium ${cfg.color} dark:bg-zinc-500/15`}
    >
      {cfg.label}
    </span>
  );
}

export function PaymentMethodBadge({ method }: { method: string }) {
  const cfg = PAYMENT_METHOD[method as keyof typeof PAYMENT_METHOD];
  if (!cfg) return <Badge variant="outline">{method}</Badge>;
  return (
    <span className="inline-flex items-center rounded-full bg-zinc-100 px-2.5 py-0.5 text-xs font-medium text-zinc-700 dark:bg-zinc-500/15 dark:text-zinc-300">
      {cfg.label}
    </span>
  );
}
