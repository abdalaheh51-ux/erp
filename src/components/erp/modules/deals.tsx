"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  closestCorners,
  DndContext,
  DragOverlay,
  PointerSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
  type DraggableAttributes,
} from "@dnd-kit/core";
import {
  Inbox,
  Layers,
  MoreVertical,
  Pencil,
  Plus,
  Trash2,
  TrendingUp,
  Trophy,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DealStageBadge } from "@/components/erp/badges";
import { ConfirmDialog } from "@/components/erp/confirm-dialog";
import { LoadingState, PageHeader } from "@/components/erp/empty-states";
import { useToast } from "@/hooks/use-toast";
import {
  DEAL_STAGE,
  DEAL_STAGE_ORDER,
  getDealStageLabel,
  formatCurrency,
  timeAgo,
  type DealStage,
} from "@/lib/erp-constants";
import { useUIStore } from "@/store/ui-store";
import { t } from "@/lib/translations";
import { cn } from "@/lib/utils";

// ---------- Types ----------

interface DealCustomer {
  id: string;
  name: string;
  status: string;
}

interface Deal {
  id: string;
  title: string;
  value: number;
  stage: DealStage;
  customerId: string;
  createdAt: string;
  updatedAt: string;
  customer: DealCustomer;
}

interface CustomerOption {
  id: string;
  name: string;
}

interface DealFormState {
  title: string;
  value: string;
  stage: DealStage;
  customerId: string;
}

interface DragProps {
  attributes: Record<string, unknown> | DraggableAttributes;
  listeners: Record<string, unknown> | undefined;
  setNodeRef: (el: HTMLElement | null) => void;
}

const EMPTY_FORM: DealFormState = {
  title: "",
  value: "",
  stage: "contact",
  customerId: "",
};

const STAGE_SET = new Set<string>(DEAL_STAGE_ORDER);

// ---------- Deal Card (presentation) ----------

function DealCardView({
  deal,
  onEdit,
  onDelete,
  onOpenCustomer,
  isOverlay = false,
  isDragging = false,
  dragProps,
}: {
  deal: Deal;
  onEdit?: (deal: Deal) => void;
  onDelete?: (deal: Deal) => void;
  onOpenCustomer: (customerId: string) => void;
  isOverlay?: boolean;
  isDragging?: boolean;
  dragProps?: DragProps;
}) {
  const language = useUIStore((s) => s.language);

  return (
    <div
      ref={dragProps?.setNodeRef}
      {...(dragProps?.attributes ?? {})}
      {...(dragProps?.listeners ?? {})}
      className={cn(
        "group relative rounded-xl border border-border/70 bg-card p-3 shadow-sm transition-all",
        "hover:border-blue-300 hover:shadow-md dark:hover:border-blue-700/60",
        !isOverlay && "cursor-grab active:cursor-grabbing",
        isOverlay &&
          "rotate-2 cursor-grabbing shadow-xl ring-2 ring-blue-400/50",
        isDragging && !isOverlay && "opacity-40",
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <h4 className="line-clamp-2 text-sm font-semibold leading-snug text-foreground">
          {deal.title}
        </h4>
        {!isOverlay && onEdit && onDelete && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                aria-label="Deal actions"
                onClick={(e) => e.stopPropagation()}
                className="size-7 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100 data-[state=open]:opacity-100"
              >
                <MoreVertical className="size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              onClick={(e) => e.stopPropagation()}
            >
              <DropdownMenuItem
                onClick={() => onEdit(deal)}
                className="gap-2"
              >
                <Pencil className="size-4" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => onDelete(deal)}
                className="gap-2 text-rose-600 focus:text-rose-700 dark:text-rose-400 dark:focus:text-rose-300"
              >
                <Trash2 className="size-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onOpenCustomer(deal.customer.id);
        }}
        className="mt-1.5 inline-flex max-w-full items-center gap-1.5 text-xs text-muted-foreground transition-colors hover:text-blue-400 dark:hover:text-blue-400"
      >
        <span className="size-1.5 shrink-0 rounded-full bg-blue-500" />
        <span className="truncate font-medium">{deal.customer.name}</span>
      </button>

      <div className="mt-2.5 flex items-end justify-between gap-2 border-t border-border/60 pt-2.5">
        <div className="min-w-0">
          <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
            Value
          </p>
          <p className="truncate text-base font-bold leading-tight text-foreground">
            {formatCurrency(deal.value, language)}
          </p>
        </div>
        <DealStageBadge stage={deal.stage} />
      </div>

      <p className="mt-2 text-[11px] text-muted-foreground">
        {t("updated", language)} {timeAgo(deal.updatedAt)}
      </p>
    </div>
  );
}

// ---------- Draggable wrapper ----------

function DraggableDealCard({
  deal,
  onEdit,
  onDelete,
  onOpenCustomer,
}: {
  deal: Deal;
  onEdit: (deal: Deal) => void;
  onDelete: (deal: Deal) => void;
  onOpenCustomer: (customerId: string) => void;
}) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: deal.id,
  });
  return (
    <DealCardView
      deal={deal}
      onEdit={onEdit}
      onDelete={onDelete}
      onOpenCustomer={onOpenCustomer}
      isDragging={isDragging}
      dragProps={{ attributes, listeners, setNodeRef }}
    />
  );
}

// ---------- Kanban Column ----------

function KanbanColumn({
  stage,
  deals,
  onEdit,
  onDelete,
  onOpenCustomer,
  isMobile = false,
}: {
  stage: DealStage;
  deals: Deal[];
  onEdit: (deal: Deal) => void;
  onDelete: (deal: Deal) => void;
  onOpenCustomer: (customerId: string) => void;
  isMobile?: boolean;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: stage });
  const cfg = DEAL_STAGE[stage];
  const total = deals.reduce((sum, d) => sum + (d.value || 0), 0);

  return (
    <div
      className={cn(
        "flex flex-col min-w-[280px] w-[280px] rounded-2xl border border-border/60",
        cfg.column,
        isMobile && "w-full min-w-0",
      )}
    >
      {/* Header */}
      <div className="sticky top-0 z-10 flex items-center justify-between gap-2 rounded-t-2xl border-b border-border/60 bg-inherit px-3 py-2.5 backdrop-blur">
        <div className="flex min-w-0 items-center gap-2">
          <DealStageBadge stage={stage} />
          <span className="text-xs font-medium text-muted-foreground">
            {deals.length} {deals.length === 1 ? t("deal_singular", language) : t("deal_plural", language)}
          </span>
        </div>
        <span className="shrink-0 text-xs font-semibold text-foreground">
          {formatCurrency(total, language)}
        </span>
      </div>

      {/* Body */}
      <div
        ref={setNodeRef}
        className={cn(
          "flex-1 space-y-2.5 overflow-y-auto p-2.5 min-h-[120px]",
          isOver &&
            "rounded-b-2xl bg-blue-500/5 ring-2 ring-inset ring-blue-400/40",
        )}
      >
        {deals.length === 0 ? (
          <div className="flex min-h-[100px] items-center justify-center rounded-xl border-2 border-dashed border-border/60 p-4 text-center">
            <div>
              <Inbox className="mx-auto size-5 text-muted-foreground/60" />
              <p className="mt-1.5 text-xs text-muted-foreground">
                {t("drop_deals_here", language)}
              </p>
            </div>
          </div>
        ) : (
          deals.map((deal) => (
            <DraggableDealCard
              key={deal.id}
              deal={deal}
              onEdit={onEdit}
              onDelete={onDelete}
              onOpenCustomer={onOpenCustomer}
            />
          ))
        )}
      </div>
    </div>
  );
}

// ---------- Main Module ----------

export function DealsModule() {
  const language = useUIStore.getState().language;
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const setModule = useUIStore((s) => s.setModule);
  const openCustomerDetail = useUIStore((s) => s.openCustomerDetail);

  const [activeId, setActiveId] = useState<string | null>(null);
  const [mobileStage, setMobileStage] = useState<DealStage>("contact");

  // Create / edit dialog
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingDeal, setEditingDeal] = useState<Deal | null>(null);
  const [form, setForm] = useState<DealFormState>(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);

  // Delete confirmation
  const [deleteTarget, setDeleteTarget] = useState<Deal | null>(null);
  const [deleting, setDeleting] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
  );

  // Fetch deals
  const language = useUIStore((s) => s.language);

  const { data: deals = [], isLoading } = useQuery<Deal[]>({
    queryKey: ["deals"],
    queryFn: async () => {
      const res = await fetch("/api/deals");
      if (!res.ok) throw new Error("Failed to load deals");
      return res.json();
    },
  });

  // Fetch customers for the form select
  const { data: customers = [] } = useQuery<CustomerOption[]>({
    queryKey: ["customers", "list"],
    queryFn: async () => {
      const res = await fetch("/api/customers");
      if (!res.ok) throw new Error("Failed to load customers");
      return res.json();
    },
  });

  // Mutations
  const moveMutation = useMutation({
    mutationFn: async ({ id, stage }: { id: string; stage: DealStage }) => {
      const res = await fetch(`/api/deals/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stage }),
      });
      if (!res.ok) throw new Error("Failed to move deal");
      return res.json();
    },
    onMutate: async ({ id, stage }) => {
      await queryClient.cancelQueries({ queryKey: ["deals"] });
      const prev = queryClient.getQueryData<Deal[]>(["deals"]);
      queryClient.setQueryData<Deal[]>(["deals"], (old = []) =>
        old.map((d) => (d.id === id ? { ...d, stage } : d)),
      );
      return { prev };
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.prev) queryClient.setQueryData(["deals"], ctx.prev);
      toast({
        title: t("move_failed", language),
        description: t("move_reverted", language),
        variant: "destructive",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["deals"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });

  const createMutation = useMutation({
    mutationFn: async (payload: DealFormState) => {
      const res = await fetch("/api/deals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: payload.title,
          value: Number(payload.value) || 0,
          stage: payload.stage,
          customerId: payload.customerId,
        }),
      });
      if (!res.ok) throw new Error("Failed to create deal");
      return res.json();
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({
      id,
      payload,
    }: {
      id: string;
      payload: DealFormState;
    }) => {
      const res = await fetch(`/api/deals/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: payload.title,
          value: Number(payload.value) || 0,
          stage: payload.stage,
          customerId: payload.customerId,
        }),
      });
      if (!res.ok) throw new Error("Failed to update deal");
      return res.json();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/deals/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete deal");
      return res.json();
    },
  });

  // Derived data
  const dealsByStage = useMemo(() => {
    const map: Record<DealStage, Deal[]> = {
      contact: [],
      proposal: [],
      negotiation: [],
      won: [],
      lost: [],
    };
    for (const d of deals) {
      const s: DealStage = STAGE_SET.has(d.stage as string)
        ? (d.stage as DealStage)
        : "contact";
      map[s].push(d);
    }
    return map;
  }, [deals]);

  const stats = useMemo(() => {
    const open = deals
      .filter((d) => d.stage !== "won" && d.stage !== "lost")
      .reduce((s, d) => s + (d.value || 0), 0);
    const won = deals
      .filter((d) => d.stage === "won")
      .reduce((s, d) => s + (d.value || 0), 0);
    return { open, won, count: deals.length };
  }, [deals]);

  const activeDeal = useMemo(
    () => deals.find((d) => d.id === activeId) ?? null,
    [deals, activeId],
  );

  // Handlers
  function openCreate() {
    setEditingDeal(null);
    setForm(EMPTY_FORM);
    setDialogOpen(true);
  }

  function openEdit(deal: Deal) {
    setEditingDeal(deal);
    setForm({
      title: deal.title,
      value: String(deal.value ?? ""),
      stage: deal.stage,
      customerId: deal.customerId,
    });
    setDialogOpen(true);
  }

  function openCustomer(id: string) {
    setModule("customers");
    openCustomerDetail(id);
  }

  async function handleSubmit() {
    if (!form.title.trim() || !form.customerId) {
      toast({
        title: t("missing_fields", language),
        description: t("title_customer_required", language),
        variant: "destructive",
      });
      return;
    }
    setSubmitting(true);
    try {
      if (editingDeal) {
        await updateMutation.mutateAsync({
          id: editingDeal.id,
          payload: form,
        });
        toast({ title: t("deal_updated", language), description: form.title });
      } else {
        await createMutation.mutateAsync(form);
        toast({ title: t("deal_created", language), description: form.title });
      }
      queryClient.invalidateQueries({ queryKey: ["deals"] });
      setDialogOpen(false);
    } catch (e) {
      toast({
        title: t("error_title", language),
        description: (e as Error).message,
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteMutation.mutateAsync(deleteTarget.id);
      toast({
        title: t("deal_deleted", language),
        description: deleteTarget.title,
      });
      queryClient.invalidateQueries({ queryKey: ["deals"] });
      setDeleteTarget(null);
    } catch (e) {
      toast({
        title: t("error_title", language),
        description: (e as Error).message,
        variant: "destructive",
      });
    } finally {
      setDeleting(false);
    }
  }

  function handleDragStart(event: DragStartEvent) {
    setActiveId(String(event.active.id));
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    setActiveId(null);
    if (!over) return;

    const deal = deals.find((d) => d.id === String(active.id));
    if (!deal) return;

    // over.id can be a stage (column) or another deal's id
    let targetStage: DealStage | null = null;
    const overId = String(over.id);
    if (STAGE_SET.has(overId)) {
      targetStage = overId as DealStage;
    } else {
      const overDeal = deals.find((d) => d.id === overId);
      if (overDeal) targetStage = overDeal.stage;
    }

    if (!targetStage || targetStage === deal.stage) return;

    // Optimistic move with rollback on error
    moveMutation.mutate({ id: deal.id, stage: targetStage });
  }

  if (isLoading) {
    return (
      <div className="space-y-5">
        <PageHeader
          title={t("deals", language)}
          description={t("deals_description", language)}
        />
        <LoadingState label={t("loading_deals", language)} />
      </div>
    );
  }

  const statCards: Array<{
    label: string;
    value: string;
    icon: typeof TrendingUp;
    accent: string;
  }> = [
    {
      label: t("open_pipeline", language),
      value: formatCurrency(stats.open, language),
      icon: TrendingUp,
      accent: "from-blue-500 to-sky-600",
    },
    {
      label: t("won_closed", language),
      value: formatCurrency(stats.won, language),
      icon: Trophy,
      accent: "from-amber-500 to-orange-600",
    },
    {
      label: t("total_deals", language),
      value: String(stats.count),
      icon: Layers,
      accent: "from-violet-500 to-purple-600",
    },
  ];

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        title={t("deals", language)}
        description={t("deals_description", language)}
        action={
          <Button
            onClick={openCreate}
            className="bg-blue-600 text-white hover:bg-blue-700 focus-visible:ring-blue-600"
          >
            <Plus className="size-4" />
            {t("new_deal", language)}
          </Button>
        }
      />

      {/* Summary stats */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {statCards.map((s) => {
          const Icon = s.icon;
          return (
            <Card key={s.label} className="border-border/60">
              <CardContent className="flex items-center gap-3 p-4">
                <div
                  className={cn(
                    "flex size-10 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br text-white shadow-sm",
                    s.accent,
                  )}
                >
                  <Icon className="size-5" />
                </div>
                <div className="min-w-0">
                  <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                    {s.label}
                  </p>
                  <p className="truncate text-lg font-bold leading-tight text-foreground">
                    {s.value}
                  </p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Mobile stage selector */}
      <div className="lg:hidden">
        <Label htmlFor="mobile-stage" className="sr-only">
          {t("stage_label", useUIStore.getState().language)}
        </Label>
        <Select
          value={mobileStage}
          onValueChange={(v) => setMobileStage(v as DealStage)}
        >
          <SelectTrigger id="mobile-stage" className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {DEAL_STAGE_ORDER.map((s) => (
              <SelectItem key={s} value={s}>
                {getDealStageLabel(s, useUIStore.getState().language)} · {dealsByStage[s].length}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Board */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        {/* Desktop board: 5 columns horizontally scrollable */}
        <div className="hidden h-[calc(100vh-280px)] gap-4 overflow-x-auto pb-2 lg:flex">
          {DEAL_STAGE_ORDER.map((stage) => (
            <KanbanColumn
              key={stage}
              stage={stage}
              deals={dealsByStage[stage]}
              onEdit={openEdit}
              onDelete={setDeleteTarget}
              onOpenCustomer={openCustomer}
            />
          ))}
        </div>

        {/* Mobile board: single column view */}
        <div className="h-[calc(100vh-360px)] lg:hidden">
          <KanbanColumn
            stage={mobileStage}
            deals={dealsByStage[mobileStage]}
            onEdit={openEdit}
            onDelete={setDeleteTarget}
            onOpenCustomer={openCustomer}
            isMobile
          />
        </div>

        <DragOverlay dropAnimation={null}>
          {activeDeal ? (
            <DealCardView
              deal={activeDeal}
              onOpenCustomer={() => {}}
              isOverlay
            />
          ) : null}
        </DragOverlay>
      </DndContext>

      {/* Create / Edit dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingDeal ? t("edit_deal", language) : t("new_deal", language)}
            </DialogTitle>
            <DialogDescription>
              {editingDeal
                ? t("update_deal_description", language)
                : t("create_deal_description", language)}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="deal-title">
                Title <span className="text-rose-500">*</span>
              </Label>
                <Input
                id="deal-title"
                value={form.title}
                onChange={(e) =>
                  setForm((f) => ({ ...f, title: e.target.value }))
                }
                placeholder={t("deal_title_placeholder", language)}
                autoFocus
              />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="deal-value">{t("value_label", language)}</Label>
                <Input
                  id="deal-value"
                  type="number"
                  min={0}
                  value={form.value}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, value: e.target.value }))
                  }
                  placeholder="0"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="deal-stage">{t("stage_label", useUIStore.getState().language)}</Label>
                <Select
                  value={form.stage}
                  onValueChange={(v) =>
                    setForm((f) => ({ ...f, stage: v as DealStage }))
                  }
                >
                  <SelectTrigger id="deal-stage" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {DEAL_STAGE_ORDER.map((s) => (
                      <SelectItem key={s} value={s}>
                        {getDealStageLabel(s, useUIStore.getState().language)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="deal-customer">
                Customer <span className="text-rose-500">*</span>
              </Label>
              <Select
                value={form.customerId}
                onValueChange={(v) =>
                  setForm((f) => ({ ...f, customerId: v }))
                }
              >
                <SelectTrigger id="deal-customer" className="w-full">
                  <SelectValue placeholder={t("select_customer", language)} />
                </SelectTrigger>
                <SelectContent>
                  {customers.length === 0 && (
                    <SelectItem value="__none" disabled>
                      {t("no_customers_available", language)}
                    </SelectItem>
                  )}
                  {customers.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDialogOpen(false)}
              disabled={submitting}
            >
              {t("cancel", language)}
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={submitting}
              className="bg-blue-600 text-white hover:bg-blue-700 focus-visible:ring-blue-600"
            >
              {submitting
                ? t("saving", language)
                : editingDeal
                  ? t("save_changes", language)
                  : t("create_deal", language)}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(v) => !v && setDeleteTarget(null)}
        title={t("delete_deal_title", language)}
        description={
          deleteTarget
            ? `${deleteTarget.title} ${t("delete_deal_description", language)}`
            : ""
        }
        confirmText={deleting ? t("deleting", language) : t("delete", language)}
        onConfirm={handleDelete}
      />
    </div>
  );
}
