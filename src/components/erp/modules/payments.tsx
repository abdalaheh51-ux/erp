"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Banknote,
  CalendarDays,
  Hash,
  MoreHorizontal,
  Pencil,
  Plus,
  Search,
  Trash2,
  type LucideIcon,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { EmptyState, LoadingState, PageHeader } from "@/components/erp/empty-states";
import { PaymentMethodBadge } from "@/components/erp/badges";
import { ConfirmDialog } from "@/components/erp/confirm-dialog";
import { useToast } from "@/hooks/use-toast";
import { useUIStore } from "@/store/ui-store";
import { t } from "@/lib/translations";
import {
  PAYMENT_METHOD,
  getPaymentMethodLabel,
  formatCurrency,
  formatDate,
  type PaymentMethod,
} from "@/lib/erp-constants";
import { calculateInvoiceBalance } from "@/lib/invoice-math";
import { cn } from "@/lib/utils";

/* ----------------------------- Types ----------------------------- */

interface Customer {
  id: string;
  name: string;
}
interface PaymentRecord {
  id: string;
  amount: number;
  paymentMethod: PaymentMethod;
  date: string;
  invoiceId: string;
  invoice: {
    number: string;
    customer: Customer;
    totalAmount?: number;
    payments?: { amount: number }[];
  };
}
interface Invoice {
  id: string;
  number: string;
  totalAmount: number;
  status: string;
  customerId: string;
  customer: Customer;
  payments?: { amount: number }[];
}

interface PaymentFormPayload {
  invoiceId: string;
  amount: number;
  paymentMethod: PaymentMethod;
  date: string;
}

/* --------------------------- Utilities --------------------------- */

function toDateInputValue(date: string | Date | null | undefined): string {
  if (!date) return "";
  const d = typeof date === "string" ? new Date(date) : date;
  if (isNaN(d.getTime())) return "";
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function invoiceBalance(inv: Invoice): number {
  return calculateInvoiceBalance(inv.totalAmount, inv.payments || []);
}

function isSameMonth(dateStr: string, ref: Date): boolean {
  const d = new Date(dateStr);
  return (
    d.getMonth() === ref.getMonth() &&
    d.getFullYear() === ref.getFullYear()
  );
}

/* --------------------------- Stat Card --------------------------- */

function StatCard({
  icon: Icon,
  label,
  value,
  accent,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  accent: string;
}) {
  return (
    <Card className="border-border/60 py-0">
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <div
            className={cn(
              "flex size-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br text-white shadow-sm",
              accent,
            )}
          >
            <Icon className="size-4" />
          </div>
          <div className="min-w-0">
            <p className="truncate text-lg font-semibold tracking-tight text-foreground">
              {value}
            </p>
            <p className="text-xs text-muted-foreground">{label}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

/* ----------------------- Payment Form Dialog --------------------- */

function PaymentFormDialog({
  open,
  onOpenChange,
  mode,
  payment,
  invoices,
  onSubmit,
  submitting,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  mode: "create" | "edit";
  payment: PaymentRecord | null;
  invoices: Invoice[];
  onSubmit: (data: PaymentFormPayload) => void;
  submitting: boolean;
}) {
  const language = useUIStore((s) => s.language);
  // Lazy initial state — parent remounts this dialog via `key` whenever it
  // is opened, so these initializers run fresh each time.
  const [invoiceId, setInvoiceId] = useState<string>(
    () => (mode === "edit" && payment ? payment.invoiceId : ""),
  );
  const [amount, setAmount] = useState<string>(
    () =>
      mode === "edit" && payment ? String(payment.amount || "") : "",
  );
  const [method, setMethod] = useState<PaymentMethod>(() => {
    if (
      mode === "edit" &&
      payment &&
      (payment.paymentMethod as PaymentMethod) in PAYMENT_METHOD
    ) {
      return payment.paymentMethod as PaymentMethod;
    }
    return "cash";
  });
  const [date, setDate] = useState<string>(() => {
    if (mode === "edit" && payment) return toDateInputValue(payment.date);
    return toDateInputValue(new Date());
  });
  const [error, setError] = useState<string>("");

  // When an invoice is selected in create mode, prefill the amount with the
  // invoice's balance due.
  const handleInvoiceChange = (newInvoiceId: string) => {
    setInvoiceId(newInvoiceId);
    if (mode === "create") {
      const inv = invoices.find((i) => i.id === newInvoiceId);
      if (inv) {
        const bal = invoiceBalance(inv);
        setAmount(String(bal || ""));
      }
    }
  };

  const selectedInvoice = invoices.find((i) => i.id === invoiceId) || null;

  const handleSubmit = () => {
    if (mode === "create" && !invoiceId) {
      setError(t("please_select_invoice", language));
      return;
    }
    const amt = Number(amount);
    if (!amt || amt <= 0 || isNaN(amt)) {
      setError(t("please_enter_valid_amount", language));
      return;
    }
    if (!date) {
      setError(t("please_select_payment_date", language));
      return;
    }
    onSubmit({
      invoiceId,
      amount: amt,
      paymentMethod: method,
      date,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {mode === "edit" ? t("edit_payment", language) : t("record_payment", language)}
          </DialogTitle>
          <DialogDescription>
            {mode === "edit"
              ? t("edit_payment_description", language)
              : t("record_payment_description", language)}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          {/* Invoice selector / display */}
          <div className="space-y-1.5">
            <Label>
              {t("invoice_label", language)} <span className="text-rose-500">*</span>
            </Label>
            {mode === "edit" ? (
              <div className="flex h-9 items-center rounded-md border border-border bg-muted/40 px-3 text-sm">
                <span className="font-mono font-medium text-foreground">
                  {payment?.invoice?.number ?? "—"}
                </span>
                <span className="ml-2 text-xs text-muted-foreground">
                  {payment?.invoice?.customer?.name ?? ""}
                </span>
              </div>
            ) : (
              <Select value={invoiceId} onValueChange={handleInvoiceChange}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder={t("select_invoice", language)} />
                </SelectTrigger>
                <SelectContent>
                  {invoices.length === 0 ? (
                    <SelectItem value="__none" disabled>
                      {t("no_invoices_available", language)}
                    </SelectItem>
                  ) : (
                    invoices.map((inv) => {
                      const bal = invoiceBalance(inv);
                      return (
                        <SelectItem key={inv.id} value={inv.id}>
                          <span className="font-mono">{inv.number}</span>
                          <span className="text-muted-foreground">
                            {" · "}
                            {inv.customer.name}
                            {" · "}
                            {t("balance_prefix", language)} {formatCurrency(bal, language)}
                          </span>
                        </SelectItem>
                      );
                    })
                  )}
                </SelectContent>
              </Select>
            )}
          </div>

          {/* Invoice summary card (create mode only) */}
          {mode === "create" && selectedInvoice && (
            <div className="grid grid-cols-3 gap-2 rounded-lg border border-border/60 p-3 text-center">
              <div>
                <p className="text-xs text-muted-foreground">{t("total_label", language)}</p>
                <p className="text-sm font-medium text-foreground">
                  {formatCurrency(selectedInvoice.totalAmount, language)}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{t("paid_label", language)}</p>
                <p className="text-sm font-medium text-emerald-600 dark:text-emerald-400">
                  {formatCurrency(
                    (selectedInvoice.payments || []).reduce(
                      (s, p) => s + p.amount,
                      0,
                    ),
                    language,
                  )}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{t("balance_due_label", language)}</p>
                <p className="text-sm font-semibold text-amber-600 dark:text-amber-400">
                  {formatCurrency(invoiceBalance(selectedInvoice), language)}
                </p>
              </div>
            </div>
          )}

          <div className="space-y-1.5">
            <Label>
              {t("amount", language)} <span className="text-rose-500">*</span>
            </Label>
            <Input
              type="number"
              min="0"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0"
            />
          </div>

          <div className="space-y-1.5">
            <Label>{t("method_label", language)}</Label>
            <Select
              value={method}
              onValueChange={(v) => setMethod(v as PaymentMethod)}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(PAYMENT_METHOD).map(([key, cfg]) => (
                  <SelectItem key={key} value={key}>
                    {cfg.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label>{t("date_label", language)}</Label>
            <Input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>

          {error && (
            <div className="rounded-md bg-rose-50 p-3 text-sm text-rose-700 dark:bg-rose-950/30 dark:text-rose-400">
              {error}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t("cancel", language)}
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={submitting}
            className="bg-blue-600 text-white hover:bg-blue-700"
          >
            {submitting
              ? t("saving", language)
              : mode === "edit"
                ? t("save_changes", language)
                : t("record_payment", language)}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ----------------------------- Module ---------------------------- */

export function PaymentsModule() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { openCustomerDetail, setModule } = useUIStore();
  const language = useUIStore((s) => s.language);

  const [search, setSearch] = useState("");
  const [methodFilter, setMethodFilter] = useState<string>("all");

  const [formOpen, setFormOpen] = useState(false);
  const [formKey, setFormKey] = useState(0);
  const [formMode, setFormMode] = useState<"create" | "edit">("create");
  const [editingPayment, setEditingPayment] = useState<PaymentRecord | null>(
    null,
  );
  const [confirmDelete, setConfirmDelete] = useState<PaymentRecord | null>(
    null,
  );

  /* Data */
  const { data: payments, isLoading } = useQuery<PaymentRecord[]>({
    queryKey: ["payments"],
    queryFn: async () => (await fetch("/api/payments")).json(),
  });

  const { data: invoices } = useQuery<Invoice[]>({
    queryKey: ["invoices"],
    queryFn: async () => (await fetch("/api/invoices")).json(),
  });

  /* Mutations */
  const createMutation = useMutation({
    mutationFn: async (data: PaymentFormPayload) => {
      const res = await fetch("/api/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to record payment");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payments"] });
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      toast({
        title: t("payment_recorded", language),
        description: t("payment_recorded_desc", language),
      });
      setFormOpen(false);
    },
    onError: () => {
      toast({
        title: t("payment_error", language),
        description: t("payment_error_desc", language),
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
      data: Omit<PaymentFormPayload, "invoiceId">;
    }) => {
      const res = await fetch(`/api/payments/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to update payment");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payments"] });
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      toast({
        title: t("payment_updated", language),
        description: t("payment_updated_desc", language),
      });
      setFormOpen(false);
    },
    onError: () => {
      toast({
        title: t("payment_error_update", language),
        description: t("payment_error_update_desc", language),
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await fetch(`/api/payments/${id}`, { method: "DELETE" });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payments"] });
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      toast({
        title: t("payment_deleted", language),
        description: t("payment_deleted_desc", language),
      });
      setConfirmDelete(null);
    },
  });

  /* Derived */
  const filteredPayments = useMemo(() => {
    if (!payments) return [];
    const q = search.trim().toLowerCase();
    return payments.filter((p) => {
      if (methodFilter !== "all" && p.paymentMethod !== methodFilter) {
        return false;
      }
      if (!q) return true;
      return (
        p.invoice?.number?.toLowerCase().includes(q) ||
        p.invoice?.customer?.name?.toLowerCase().includes(q)
      );
    });
  }, [payments, search, methodFilter]);

  const stats = useMemo(() => {
    const all = payments || [];
    const totalReceived = all.reduce((s, p) => s + p.amount, 0);
    const now = new Date();
    const thisMonth = all
      .filter((p) => isSameMonth(p.date, now))
      .reduce((s, p) => s + p.amount, 0);
    return { totalReceived, thisMonth, count: all.length };
  }, [payments]);

  /* Handlers */
  const openCreateForm = () => {
    setFormMode("create");
    setEditingPayment(null);
    setFormKey((k) => k + 1);
    setFormOpen(true);
  };

  const openEditForm = (payment: PaymentRecord) => {
    setFormMode("edit");
    setEditingPayment(payment);
    setFormKey((k) => k + 1);
    setFormOpen(true);
  };

  const handleCustomerClick = (customerId: string) => {
    openCustomerDetail(customerId);
    setModule("customers");
  };

  const handleInvoiceClick = () => {
    setModule("invoices");
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("payments_page_title", language)}
        description={t("payments_page_desc", language)}
        action={
          <Button
            onClick={openCreateForm}
            className="bg-blue-600 text-white hover:bg-blue-700"
          >
            <Plus className="size-4" /> {t("record_payment", language)}
          </Button>
        }
      />

      {/* Summary cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard
          icon={Banknote}
          label={t("total_received", language)}
          value={formatCurrency(stats.totalReceived)}
          accent="from-blue-500 to-sky-600"
        />
        <StatCard
          icon={CalendarDays}
          label={t("this_month", language)}
          value={formatCurrency(stats.thisMonth)}
          accent="from-blue-500 to-sky-600"
        />
        <StatCard
          icon={Hash}
          label={t("payments_count", language)}
          value={String(stats.count)}
          accent="from-amber-500 to-orange-600"
        />
      </div>

      {/* Filter bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder={t("search_payments_placeholder", language)}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={methodFilter} onValueChange={setMethodFilter}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder={t("all_methods", language)} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("all_methods", language)}</SelectItem>
            {Object.entries(PAYMENT_METHOD).map(([key, cfg]) => (
              <SelectItem key={key} value={key}>
                {getPaymentMethodLabel(key, language)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      {isLoading ? (
        <LoadingState label={t("loading_payments", language)} />
      ) : filteredPayments.length === 0 ? (
        <EmptyState
          icon={Banknote}
          title={t("no_payments_found", language)}
          description={
            search || methodFilter !== "all"
              ? t("try_adjust_filters", language)
              : t("create_first_payment", language)
          }
          action={
            <Button
              onClick={openCreateForm}
              className="bg-blue-600 text-white hover:bg-blue-700"
            >
              <Plus className="size-4" /> {t("record_payment", language)}
            </Button>
          }
        />
      ) : (
        <Card className="border-border/60 py-0">
          <div className="max-h-[calc(100vh-220px)] overflow-y-auto">
            <Table>
              <TableHeader className="sticky top-0 z-10 bg-card">
                <TableRow>
                  <TableHead>{t("date_label", language)}</TableHead>
                  <TableHead>{t("invoice_number", language)}</TableHead>
                  <TableHead>{t("table_customer", language)}</TableHead>
                  <TableHead>{t("method_label", language)}</TableHead>
                  <TableHead className="text-right">{t("amount_label", language)}</TableHead>
                  <TableHead className="w-10"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPayments.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="text-xs text-muted-foreground">
                      {formatDate(p.date)}
                    </TableCell>
                    <TableCell>
                      <button
                        onClick={handleInvoiceClick}
                        className="font-mono text-sm font-semibold text-foreground hover:text-blue-400 hover:underline dark:hover:text-blue-400"
                      >
                        {p.invoice?.number ?? "—"}
                      </button>
                    </TableCell>
                    <TableCell>
                      <button
                        onClick={() =>
                          p.invoice?.customer?.id &&
                          handleCustomerClick(p.invoice.customer.id)
                        }
                        className="text-sm text-foreground hover:text-blue-400 hover:underline dark:hover:text-blue-400"
                      >
                        {p.invoice?.customer?.name ?? "—"}
                      </button>
                    </TableCell>
                    <TableCell>
                      <PaymentMethodBadge method={p.paymentMethod} />
                    </TableCell>
                    <TableCell className="text-right text-sm font-semibold text-emerald-600 dark:text-emerald-400">
                      +{formatCurrency(p.amount)}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-8"
                          >
                            <MoreHorizontal className="size-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => openEditForm(p)}
                          >
                            <Pencil className="size-4" /> {t("edit", language)}
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            variant="destructive"
                            onClick={() => setConfirmDelete(p)}
                          >
                            <Trash2 className="size-4" /> {t("delete", language)}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </Card>
      )}

      {/* Create / Edit dialog */}
      <PaymentFormDialog
        key={`pay-form-${formKey}`}
        open={formOpen}
        onOpenChange={setFormOpen}
        mode={formMode}
        payment={editingPayment}
        invoices={invoices || []}
        onSubmit={(data) => {
          if (formMode === "edit" && editingPayment) {
            updateMutation.mutate({
              id: editingPayment.id,
              data: {
                amount: data.amount,
                paymentMethod: data.paymentMethod,
                date: data.date,
              },
            });
          } else {
            createMutation.mutate(data);
          }
        }}
        submitting={createMutation.isPending || updateMutation.isPending}
      />

      {/* Confirm delete */}
      <ConfirmDialog
        open={!!confirmDelete}
        onOpenChange={(open) => {
          if (!open) setConfirmDelete(null);
        }}
        title={t("delete_payment_title", language)}
        description={`${t("delete_payment_desc", language).replace("{amount}", formatCurrency(confirmDelete?.amount || 0, language))} ${t("this_action_cannot_be_undone", language)}`}
        confirmText={t("delete", language)}
        onConfirm={() =>
          confirmDelete && deleteMutation.mutate(confirmDelete.id)
        }
      />
    </div>
  );
}
