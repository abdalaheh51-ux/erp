"use client";

import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  EmptyState,
  LoadingState,
  PageHeader,
} from "@/components/erp/empty-states";
import { ConfirmDialog } from "@/components/erp/confirm-dialog";
import { InteractionTypeBadge } from "@/components/erp/badges";
import { useToast } from "@/hooks/use-toast";
import { useUIStore } from "@/store/ui-store";
import { t } from "@/lib/translations";
import {
  INTERACTION_TYPE,
  getInteractionTypeLabel,
  formatDate,
  formatDateTime,
  timeAgo,
  type InteractionType,
} from "@/lib/erp-constants";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  FileText,
  Mail,
  MessageSquarePlus,
  MoreHorizontal,
  Pencil,
  Phone,
  Plus,
  Search,
  Trash2,
  Users,
  type LucideIcon,
} from "lucide-react";

type CustomerOption = {
  id: string;
  name: string;
  email: string | null;
};

type Interaction = {
  id: string;
  content: string;
  date: string;
  type: string;
  customerId: string;
  customer: { id: string; name: string };
};

const TYPE_OPTIONS: InteractionType[] = ["note", "call", "meeting", "email"];

const TYPE_ICONS: Record<InteractionType, LucideIcon> = {
  note: FileText,
  call: Phone,
  meeting: Users,
  email: Mail,
};

const TYPE_ACCENTS: Record<InteractionType, string> = {
  note: "bg-zinc-100 text-zinc-600 dark:bg-zinc-500/15 dark:text-zinc-400",
  call: "bg-sky-100 text-sky-600 dark:bg-sky-500/15 dark:text-sky-400",
  meeting:
    "bg-violet-100 text-violet-600 dark:bg-violet-500/15 dark:text-violet-400",
  email:
    "bg-emerald-100 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-400",
};

function getInitials(name: string): string {
  return (
    name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((w) => w[0]?.toUpperCase() ?? "")
      .join("") || "?"
  );
}

function toLocalDatetime(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(
    d.getDate(),
  )}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function groupLabel(date: string): string {
  const d = new Date(date);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);
  const language = useUIStore.getState().language;
  if (d.toDateString() === today.toDateString()) return t("today", language);
  if (d.toDateString() === yesterday.toDateString()) return t("yesterday", language);
  return formatDate(d, language);
}

const emptyForm = {
  customerId: "",
  type: "note" as InteractionType,
  content: "",
  date: toLocalDatetime(new Date()),
};

export function InteractionsModule() {
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Interaction | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Interaction | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [formError, setFormError] = useState<{
    customerId?: string;
    content?: string;
  }>({});

  const qc = useQueryClient();
  const { toast } = useToast();
  const openCustomerDetail = useUIStore((s) => s.openCustomerDetail);
  const setModule = useUIStore((s) => s.setModule);
  const language = useUIStore((s) => s.language);

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => setSearch(searchInput.trim()), 250);
    return () => clearTimeout(t);
  }, [searchInput]);

  // Fetch all interactions (newest first from API)
  const { data: interactions = [], isLoading } = useQuery<Interaction[]>({
    queryKey: ["interactions"],
    queryFn: async () => {
      const res = await fetch("/api/interactions");
      if (!res.ok) throw new Error("Failed to load interactions");
      return res.json();
    },
  });

  // Fetch customers for the create/edit select
  const { data: customers = [] } = useQuery<CustomerOption[]>({
    queryKey: ["customers", "options"],
    queryFn: async () => {
      const res = await fetch("/api/customers");
      if (!res.ok) throw new Error("Failed to load customers");
      return res.json();
    },
  });

  // Filter on the client (API only supports customerId filter)
  const filtered = useMemo(() => {
    return interactions.filter((it) => {
      if (
        typeFilter !== "all" &&
        it.type !== typeFilter
      )
        return false;
      if (search) {
        const q = search.toLowerCase();
        const inContent = it.content.toLowerCase().includes(q);
        const inCustomer = it.customer.name.toLowerCase().includes(q);
        if (!inContent && !inCustomer) return false;
      }
      return true;
    });
  }, [interactions, typeFilter, search]);

  // Group by date label, preserving API's desc order
  const groups = useMemo(() => {
    const map = new Map<string, Interaction[]>();
    for (const it of filtered) {
      const key = groupLabel(it.date);
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(it);
    }
    return Array.from(map.entries());
  }, [filtered]);

  const createMutation = useMutation({
    mutationFn: async (data: {
      content: string;
      type: InteractionType;
      date: string;
      customerId: string;
    }) => {
      const res = await fetch("/api/interactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to log interaction");
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["interactions"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
      toast({
        title: t("interaction_logged_title", language),
        description: t("interaction_logged_desc", language),
      });
      setDialogOpen(false);
    },
    onError: () => {
      toast({
        title: t("error", language),
        description: t("error_save_interaction", language),
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: {
        content: string;
        type: InteractionType;
        date: string;
        customerId: string;
      };
    }) => {
      const res = await fetch(`/api/interactions/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to update interaction");
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["interactions"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
      toast({
        title: t("interaction_updated_title", language),
        description: t("interaction_updated_desc", language),
      });
      setDialogOpen(false);
    },
    onError: () => {
      toast({
        title: t("error", language),
        description: t("error_update_interaction", language),
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/interactions/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete interaction");
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["interactions"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
      toast({
        title: t("interaction_deleted_title", language),
        description: t("interaction_deleted_desc", language),
      });
      setDeleteTarget(null);
    },
    onError: () => {
      toast({
        title: t("error", language),
        description: t("error_delete_interaction", language),
        variant: "destructive",
      });
    },
  });

  function openCreate() {
    setEditing(null);
    setForm({
      ...emptyForm,
      date: toLocalDatetime(new Date()),
      customerId: customers[0]?.id ?? "",
    });
    setFormError({});
    setDialogOpen(true);
  }

  function openEdit(it: Interaction) {
    setEditing(it);
    setForm({
      customerId: it.customerId,
      type: (it.type as InteractionType) || "note",
      content: it.content,
      date: toLocalDatetime(new Date(it.date)),
    });
    setFormError({});
    setDialogOpen(true);
  }

  function validate(): boolean {
    const err: { customerId?: string; content?: string } = {};
    if (!form.customerId) err.customerId = t("please_select_customer", language);
    if (!form.content.trim()) err.content = t("content_required", language);
    setFormError(err);
    return Object.keys(err).length === 0;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    const payload = {
      content: form.content.trim(),
      type: form.type,
      date: new Date(form.date).toISOString(),
      customerId: form.customerId,
    };
    if (editing) {
      updateMutation.mutate({ id: editing.id, data: payload });
    } else {
      createMutation.mutate(payload);
    }
  }

  function openCustomer(id: string) {
    setModule("customers");
    openCustomerDetail(id);
  }

  const isSaving = createMutation.isPending || updateMutation.isPending;
  const isDeleting = deleteMutation.isPending;

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("activity", language)}
        description={t("activity_description", language)}
        action={
          <Button
            onClick={openCreate}
            className="bg-blue-600 text-white hover:bg-blue-700 focus-visible:ring-blue-600/50"
          >
            <Plus className="size-4" />
            {t("log_interaction", language)}
          </Button>
        }
      />

      {/* Filter bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative max-w-md flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder={t("search_interactions_placeholder", language)}
            className="pl-9"
            aria-label={t("search_interactions_aria", language)}
          />
        </div>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger
            className="w-full sm:w-[180px]"
            aria-label={t("filter_by_type_aria", language)}
          >
            <SelectValue placeholder={t("all_types", language)} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("all_types", language)}</SelectItem>
            {TYPE_OPTIONS.map((t) => (
              <SelectItem key={t} value={t}>
                {getInteractionTypeLabel(t, language)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* States / feed */}
      {isLoading ? (
        <LoadingState label={t("loading_activity", language)} />
      ) : interactions.length === 0 ? (
        <EmptyState
          icon={MessageSquarePlus}
          title={t("no_activity_logged_yet", language)}
          description={t("no_activity_logged_yet_desc", language)}
          action={
            <Button
              onClick={openCreate}
              className="bg-blue-600 text-white hover:bg-blue-700 focus-visible:ring-blue-600/50"
            >
              <Plus className="size-4" />
              {t("log_interaction", language)}
            </Button>
          }
        />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={Search}
          title={t("no_matching_interactions", language)}
          description={t("no_matching_interactions_desc", language)}
          action={
            <Button
              variant="outline"
              onClick={() => {
                setSearchInput("");
                setTypeFilter("all");
              }}
            >
              Clear filters
            </Button>
          }
        />
      ) : (
        <div className="space-y-6">
          <p className="text-sm text-muted-foreground">
            Showing{" "}
            <span className="font-medium text-foreground">
              {filtered.length}
            </span>{" "}
            of{" "}
            <span className="font-medium text-foreground">
              {interactions.length}
            </span>{" "}
            interactions
          </p>

          {groups.map(([label, items]) => (
            <div key={label} className="space-y-3">
              {/* Sticky date header */}
              <div className="sticky top-0 z-10 -mx-1 flex items-center gap-3 bg-background/95 px-1 py-1 backdrop-blur supports-[backdrop-filter]:bg-background/80">
                <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  {label}
                </span>
                <span className="h-px flex-1 bg-border/60" />
                <span className="text-xs text-muted-foreground">
                  {items.length} {items.length === 1 ? "entry" : "entries"}
                </span>
              </div>

              <div className="space-y-2.5">
                {items.map((it) => {
                  const type = (it.type as InteractionType) || "note";
                  const Icon = TYPE_ICONS[type] ?? FileText;
                  return (
                    <Card
                      key={it.id}
                      className="group relative gap-0 p-4 transition-all duration-200 hover:border-blue-300 hover:shadow-sm dark:hover:border-blue-900 sm:p-5"
                    >
                      <div className="flex items-start gap-3">
                        {/* Type icon */}
                        <div
                          className={cn(
                            "flex size-10 shrink-0 items-center justify-center rounded-lg",
                            TYPE_ACCENTS[type],
                          )}
                        >
                          <Icon className="size-5" />
                        </div>

                        {/* Body */}
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                            <button
                              onClick={() => openCustomer(it.customer.id)}
                              className="inline-flex items-center gap-1.5 truncate text-sm font-semibold text-foreground hover:text-blue-400 hover:underline dark:hover:text-blue-400"
                              title={t("open_customer", language).replace("{name}", it.customer.name)}
                            >
                              <span className="size-5 rounded-full bg-blue-500/10 text-center text-[10px] font-semibold leading-5 text-blue-400">
                                {getInitials(it.customer.name)}
                              </span>
                              <span className="truncate">
                                {it.customer.name}
                              </span>
                            </button>
                            <InteractionTypeBadge type={it.type} />
                            <span
                              className="text-xs text-muted-foreground"
                              title={formatDateTime(it.date)}
                            >
                              {timeAgo(it.date)}
                            </span>
                          </div>

                          <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-relaxed text-foreground">
                            {it.content}
                          </p>

                          <p className="mt-2 text-xs text-muted-foreground">
                            {formatDateTime(it.date)}
                          </p>
                        </div>

                        {/* Actions */}
                        <div className="absolute right-3 top-3 sm:static sm:ml-1 sm:self-start">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="size-8 text-muted-foreground opacity-60 hover:bg-accent hover:text-foreground group-hover:opacity-100 focus-visible:opacity-100 data-[state=open]:opacity-100"
                                aria-label={`Actions for ${it.customer.name} interaction`}
                              >
                                <MoreHorizontal className="size-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-36">
                              <DropdownMenuItem
                                onClick={() => openCustomer(it.customer.id)}
                              >
                                <Users className="size-4" />
                                View customer
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => openEdit(it)}
                              >
                                <Pencil className="size-4" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                variant="destructive"
                                onClick={() => setDeleteTarget(it)}
                              >
                                <Trash2 className="size-4" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create / Edit dialog */}
      <Dialog
        open={dialogOpen}
        onOpenChange={(v) => {
          if (!isSaving) setDialogOpen(v);
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editing ? "Edit Interaction" : "Log Interaction"}
            </DialogTitle>
            <DialogDescription>
              {editing
                ? "Update the details of this interaction."
                : "Record a call, meeting, email or note with a customer."}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="interaction-customer">
                {t("customer", language)} <span className="text-rose-500">*</span>
              </Label>
              <Select
                value={form.customerId}
                onValueChange={(v) =>
                  setForm({ ...form, customerId: v })
                }
              >
                <SelectTrigger
                  id="interaction-customer"
                  className="w-full"
                  aria-invalid={!!formError.customerId}
                >
                  <SelectValue
                    placeholder={
                      customers.length === 0
                        ? "No customers available"
                        : "Select a customer"
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {customers.length === 0 ? (
                    <div className="px-2 py-1.5 text-xs text-muted-foreground">
                      No customers found
                    </div>
                  ) : (
                    customers.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
              {formError.customerId && (
                <p className="text-xs text-rose-600">
                  {formError.customerId}
                </p>
              )}
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="interaction-type">{t("type_label", language)}</Label>
                <Select
                  value={form.type}
                  onValueChange={(v) =>
                    setForm({ ...form, type: v as InteractionType })
                  }
                >
                  <SelectTrigger id="interaction-type" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TYPE_OPTIONS.map((t) => {
                      const Icon = TYPE_ICONS[t];
                      return (
                        <SelectItem key={t} value={t}>
                          <span className="flex items-center gap-2">
                            <Icon className="size-4" />
                            {getInteractionTypeLabel(t, language)}
                          </span>
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="interaction-date">{t("date_label", language)}</Label>
                <Input
                  id="interaction-date"
                  type="datetime-local"
                  value={form.date}
                  onChange={(e) =>
                    setForm({ ...form, date: e.target.value })
                  }
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="interaction-content">
                {t("content", language)} <span className="text-rose-500">*</span>
              </Label>
              <Textarea
                id="interaction-content"
                value={form.content}
                onChange={(e) =>
                  setForm({ ...form, content: e.target.value })
                }
                placeholder="What happened? Add details, outcomes, next steps..."
                rows={4}
                autoFocus
                aria-invalid={!!formError.content}
              />
              {formError.content && (
                <p className="text-xs text-rose-600">{formError.content}</p>
              )}
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setDialogOpen(false)}
                disabled={isSaving}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSaving || customers.length === 0}
                className="bg-blue-600 text-white hover:bg-blue-700 focus-visible:ring-blue-600/50"
              >
                {isSaving
                  ? "Saving..."
                  : editing
                    ? "Save Changes"
                    : "Log Interaction"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(v) => {
          if (!isDeleting && !v) setDeleteTarget(null);
        }}
        title={t("delete_interaction_title", language)}
        description={
          deleteTarget
            ? `${t("delete_interaction_desc", language)} ${t("this_action_cannot_be_undone", language)}`
            : ""
        }
        confirmText={isDeleting ? t("deleting", language) : t("delete", language)}
        onConfirm={() => {
          if (deleteTarget) deleteMutation.mutate(deleteTarget.id);
        }}
      />
    </div>
  );
}
