"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AlertCircle,
  Banknote,
  FileText,
  MoreHorizontal,
  Pencil,
  Plus,
  Search,
  Trash2,
  Wallet,
  X,
  type LucideIcon,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
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
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
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
import { InvoiceStatusBadge, PaymentMethodBadge } from "@/components/erp/badges";
import { ConfirmDialog } from "@/components/erp/confirm-dialog";
import { useToast } from "@/hooks/use-toast";
import { useUIStore } from "@/store/ui-store";
import { t } from "@/lib/translations";
import {
  INVOICE_STATUS,
  PAYMENT_METHOD,
  formatCurrency,
  formatDate,
  type InvoiceStatus,
  type PaymentMethod,
} from "@/lib/erp-constants";
import { calculateInvoiceBalance, deriveInvoiceStatus } from "@/lib/invoice-math";
import { cn } from "@/lib/utils";

/* ----------------------------- Types ----------------------------- */

interface Customer {
  id: string;
  name: string;
}
interface Deal {
  id: string;
  title: string;
  customerId: string;
}
interface Product {
  id: string;
  name: string;
  price: number;
}
interface InvoiceItem {
  id: string;
  productId: string;
  quantity: number;
  unitPrice: number;
  product: { id: string; name: string; price: number };
}
interface Payment {
  id: string;
  amount: number;
  paymentMethod: string;
  date: string;
  invoiceId: string;
}
interface Invoice {
  id: string;
  number: string;
  totalAmount: number;
  status: InvoiceStatus;
  dueDate: string | null;
  customerId: string;
  dealId: string | null;
  createdAt: string;
  customer: Customer;
  deal: { id: string; title: string } | null;
  items: InvoiceItem[];
  payments: Payment[];
}

interface LineItemDraft {
  key: string;
  productId: string;
  quantity: number;
  unitPrice: number;
}

interface InvoiceFormPayload {
  customerId: string;
  dealId?: string;
  status: InvoiceStatus;
  dueDate: string | null;
  items: { productId: string; quantity: number; unitPrice: number }[];
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

function sumPaid(payments?: Payment[] | null): number {
  return (payments || []).reduce((s, p) => s + (p.amount || 0), 0);
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

/* ----------------------- Invoice Detail Sheet -------------------- */

function InvoiceDetailSheet({
  open,
  onOpenChange,
  invoice,
  onEdit,
  onDelete,
  onRecordPayment,
  onCustomerClick,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  invoice: Invoice | null;
  onEdit: () => void;
  onDelete: () => void;
  onRecordPayment: () => void;
  onCustomerClick: (id: string) => void;
}) {
  const language = useUIStore.getState().language;
  const paid = sumPaid(invoice?.payments);
  const total = invoice?.totalAmount || 0;
  const balance = calculateInvoiceBalance(total, invoice?.payments || []);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full gap-0 p-0 sm:max-w-lg"
      >
        <SheetHeader className="border-b px-5 pb-3 pt-5 pr-10">
          <div className="flex flex-wrap items-center gap-2">
            <SheetTitle className="font-mono text-base">
              {invoice?.number ?? ""}
            </SheetTitle>
            {invoice && <InvoiceStatusBadge status={invoice.status} />}
          </div>
          <SheetDescription>
            {invoice
              ? `${t("issued", language)} ${formatDate(invoice.createdAt, language)} · ${t("due", language)} ${formatDate(invoice.dueDate, language)}`
              : ""}
          </SheetDescription>
        </SheetHeader>

        {invoice && (
          <div className="flex-1 space-y-5 overflow-y-auto px-5 py-4">
            {/* Customer card */}
            <div className="rounded-lg border border-border/60 p-3">
              <p className="text-xs text-muted-foreground">{t("billed_to", language)}</p>
              <button
                onClick={() => onCustomerClick(invoice.customer.id)}
                className="mt-0.5 text-sm font-medium text-foreground hover:text-blue-400 hover:underline dark:hover:text-blue-400"
              >
                {invoice.customer.name}
              </button>
              {invoice.deal && (
                <p className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                  <span>{t("linked_deal", language)}</span>
                  <Badge variant="outline" className="font-normal">
                    {invoice.deal.title}
                  </Badge>
                </p>
              )}
            </div>

            {/* Line items */}
            <div>
              <h3 className="mb-2 text-sm font-semibold text-foreground">
                {t("line_items", language)}
              </h3>
              <div className="overflow-hidden rounded-lg border border-border/60">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t("product", language)}</TableHead>
                      <TableHead className="w-16 text-right">{t("qty", language)}</TableHead>
                      <TableHead className="text-right">{t("unit", language)}</TableHead>
                      <TableHead className="text-right">{t("total", language)}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {invoice.items.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={4}
                          className="py-6 text-center text-xs text-muted-foreground"
                        >
                          {t("no_line_items", language)}
                        </TableCell>
                      </TableRow>
                    ) : (
                      invoice.items.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell className="text-sm font-medium">
                            {item.product.name}
                          </TableCell>
                          <TableCell className="text-right text-sm">
                            {item.quantity}
                          </TableCell>
                          <TableCell className="text-right text-sm">
                            {formatCurrency(item.unitPrice, language)}
                          </TableCell>
                          <TableCell className="text-right text-sm font-medium">
                            {formatCurrency(item.quantity * item.unitPrice, language)}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                  <TableFooter>
                    <TableRow>
                      <TableCell colSpan={3} className="text-right text-sm font-semibold">
                        Total
                      </TableCell>
                      <TableCell className="text-right text-sm font-semibold text-foreground">
                        {formatCurrency(total, language)}
                      </TableCell>
                    </TableRow>
                  </TableFooter>
                </Table>
              </div>
            </div>

            {/* Payments */}
            <div>
              <div className="mb-2 flex items-center justify-between">
                <h3 className="text-sm font-semibold text-foreground">
                  {t("payments", language)}
                </h3>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={onRecordPayment}
                  className="border-blue-200 text-blue-700 hover:bg-blue-50 hover:text-blue-700 dark:border-blue-900/50 dark:text-blue-400 dark:hover:bg-blue-950/30"
                >
                  <Plus className="size-3.5" /> {t("record_payment", language)}
                </Button>
              </div>
              {invoice.payments.length === 0 ? (
                <p className="rounded-lg border border-dashed border-border py-4 text-center text-xs text-muted-foreground">
                  {t("no_payments_recorded", language)}
                </p>
              ) : (
                <div className="space-y-2">
                  {invoice.payments.map((p) => (
                    <div
                      key={p.id}
                      className="flex items-center justify-between rounded-lg border border-border/60 p-3"
                    >
                      <div className="flex items-center gap-2">
                        <PaymentMethodBadge method={p.paymentMethod} />
                        <span className="text-xs text-muted-foreground">
                          {formatDate(p.date, language)}
                        </span>
                      </div>
                        <span className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">
                          {formatCurrency(p.amount, language)}
                        </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Summary */}
            <div className="space-y-2 rounded-lg border border-border/60 p-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">{t("total_label", language)}</span>
                <span className="font-medium text-foreground">
                  {formatCurrency(total, language)}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">{t("paid_label", language)}</span>
                <span className="font-medium text-emerald-600 dark:text-emerald-400">
                  {formatCurrency(paid, language)}
                </span>
              </div>
              <Separator />
              <div className="flex justify-between text-sm">
                <span className="font-medium text-foreground">{t("balance_due_label", language)}</span>
                <span
                  className={cn(
                    "font-semibold",
                    balance <= 0
                      ? "text-emerald-600 dark:text-emerald-400"
                      : "text-amber-600 dark:text-amber-400",
                  )}
                >
                  {formatCurrency(balance, language)}
                </span>
              </div>
            </div>
          </div>
        )}

        <SheetFooter className="flex-row gap-2 border-t px-5 py-3">
          <Button variant="outline" onClick={onEdit} className="flex-1">
            <Pencil className="size-4" /> Edit
          </Button>
          <Button
            variant="outline"
            onClick={onDelete}
            className="flex-1 text-rose-600 hover:bg-rose-50 hover:text-rose-700 dark:hover:bg-rose-950/30"
          >
            <Trash2 className="size-4" /> Delete
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

/* ----------------------- Record Payment Dialog ------------------- */

function RecordPaymentDialog({
  open,
  onOpenChange,
  invoice,
  onSubmit,
  submitting,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  invoice: Invoice | null;
  onSubmit: (data: {
    invoiceId: string;
    amount: number;
    paymentMethod: PaymentMethod;
    date: string;
  }) => void;
  submitting: boolean;
}) {
  // Lazy initial state — parent remounts this dialog via `key` whenever it is
  // opened, so these initializers run fresh each time.
  const [amount, setAmount] = useState<string>(() => {
    if (!invoice) return "";
    const paid = sumPaid(invoice.payments);
    const bal = calculateInvoiceBalance(invoice.totalAmount, invoice.payments);
    return String(bal || "");
  });
  const [method, setMethod] = useState<PaymentMethod>("cash");
  const [date, setDate] = useState<string>(() => toDateInputValue(new Date()));
    const [error, setError] = useState("");
  const language = useUIStore.getState().language;
  const paid = sumPaid(invoice?.payments);
  const balance = calculateInvoiceBalance(invoice?.totalAmount || 0, invoice?.payments || []);

  const handleSubmit = () => {
    if (!invoice) return;
    const amt = Number(amount);
    if (!amt || amt <= 0 || isNaN(amt)) {
      setError("Please enter a valid amount greater than zero.");
      return;
    }
    if (!date) {
      setError("Please select a payment date.");
      return;
    }
    onSubmit({
      invoiceId: invoice.id,
      amount: amt,
      paymentMethod: method,
      date,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Record Payment</DialogTitle>
          <DialogDescription>
            {invoice
              ? `For invoice ${invoice.number} · ${invoice.customer.name}`
              : ""}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div className="grid grid-cols-3 gap-2 rounded-lg border border-border/60 p-3 text-center">
            <div>
              <p className="text-xs text-muted-foreground">Total</p>
              <p className="text-sm font-medium text-foreground">
                {formatCurrency(invoice?.totalAmount || 0)}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Paid</p>
              <p className="text-sm font-medium text-emerald-600 dark:text-emerald-400">
                {formatCurrency(paid)}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Balance</p>
              <p className="text-sm font-semibold text-amber-600 dark:text-amber-400">
                {formatCurrency(balance)}
              </p>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>
              Amount <span className="text-rose-500">*</span>
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
            <Label>Method</Label>
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
            <Label>Date</Label>
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
            {submitting ? t("saving", language) : t("record_payment", language)}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ----------------------- Invoice Form Dialog --------------------- */

function InvoiceFormDialog({
  open,
  onOpenChange,
  invoice,
  customers,
  products,
  deals,
  onSubmit,
  submitting,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  invoice: Invoice | null;
  customers: Customer[];
  products: Product[];
  deals: Deal[];
  onSubmit: (data: InvoiceFormPayload) => void;
  submitting: boolean;
}) {
  // Lazy initial state — relies on parent remounting via `key` whenever the
  // dialog opens for a different invoice (or for create mode).
  const [customerId, setCustomerId] = useState<string>(
    () => invoice?.customerId ?? "",
  );
  const [dealId, setDealId] = useState<string>(
    () => invoice?.dealId ?? "none",
  );
  const [status, setStatus] = useState<InvoiceStatus>(
    () => invoice?.status ?? "draft",
  );
  const [dueDate, setDueDate] = useState<string>(
    () => toDateInputValue(invoice?.dueDate),
  );
  const [items, setItems] = useState<LineItemDraft[]>(() => {
    if (invoice && invoice.items.length > 0) {
      return invoice.items.map((it) => ({
        key: crypto.randomUUID(),
        productId: it.productId,
        quantity: it.quantity,
        unitPrice: it.unitPrice,
      }));
    }
    return [{ key: crypto.randomUUID(), productId: "", quantity: 1, unitPrice: 0 }];
  });
  const [error, setError] = useState<string>("");
  const language = useUIStore.getState().language;

  const customerDeals = useMemo(
    () => deals.filter((d) => d.customerId === customerId),
    [deals, customerId],
  );

  // When the customer changes, clear the deal if it no longer belongs to them.
  const handleCustomerChange = (newCustomerId: string) => {
    setCustomerId(newCustomerId);
    if (dealId !== "none") {
      const stillValid = deals.some(
        (d) => d.id === dealId && d.customerId === newCustomerId,
      );
      if (!stillValid) setDealId("none");
    }
  };

  const newItem = (): LineItemDraft => ({
    key: crypto.randomUUID(),
    productId: "",
    quantity: 1,
    unitPrice: 0,
  });

  const total = items.reduce(
    (s, it) => s + (Number(it.quantity) || 0) * (Number(it.unitPrice) || 0),
    0,
  );

  const updateItem = (key: string, patch: Partial<LineItemDraft>) => {
    setItems((prev) =>
      prev.map((it) => (it.key === key ? { ...it, ...patch } : it)),
    );
  };

  const addItem = () => {
    setItems((prev) => [...prev, newItem()]);
  };

  const removeItem = (key: string) => {
    setItems((prev) =>
      prev.length > 1 ? prev.filter((it) => it.key !== key) : prev,
    );
  };

  const onProductSelect = (key: string, productId: string) => {
    const product = products.find((p) => p.id === productId);
    updateItem(key, { productId, unitPrice: product?.price || 0 });
  };

  const handleSubmit = () => {
    if (!customerId) {
      setError("Please select a customer.");
      return;
    }
    const validItems = items.filter((it) => it.productId);
    if (validItems.length === 0) {
      setError("Please add at least one line item with a product.");
      return;
    }
    onSubmit({
      customerId,
      dealId: dealId !== "none" ? dealId : undefined,
      status,
      dueDate: dueDate || null,
      items: validItems.map((it) => ({
        productId: it.productId,
        quantity: Number(it.quantity) || 1,
        unitPrice: Number(it.unitPrice) || 0,
      })),
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>
            {invoice ? t("edit_invoice", language) : t("new_invoice", language)}
          </DialogTitle>
          <DialogDescription>
            {invoice
              ? `${t("update_invoice", language)} ${invoice.number} ${t("and_line_items", language)}`
              : t("create_invoice_description", language)}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Top row */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>
                Customer <span className="text-rose-500">*</span>
              </Label>
              <Select value={customerId} onValueChange={handleCustomerChange}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder={t("select_customer", language)} />
                </SelectTrigger>
                <SelectContent>
                  {customers.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label>Deal (optional)</Label>
              <Select
                value={dealId}
                onValueChange={setDealId}
                disabled={!customerId}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder={t("none", language)} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">{t("none", language)}</SelectItem>
                  {customerDeals.map((d) => (
                    <SelectItem key={d.id} value={d.id}>
                      {d.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {!customerId && (
                <p className="text-xs text-muted-foreground">
                  {t("select_customer_first_link_deal", language)}
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label>Status</Label>
              <Select
                value={status}
                onValueChange={(v) => setStatus(v as InvoiceStatus)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(INVOICE_STATUS).map(([key, cfg]) => (
                    <SelectItem key={key} value={key}>
                      {cfg.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label>Due date</Label>
              <Input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
              />
            </div>
          </div>

          <Separator />

          {/* Line items editor */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>
                Line Items <span className="text-rose-500">*</span>
              </Label>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={addItem}
              >
                <Plus className="size-3.5" /> {t("add_item", language)}
              </Button>
            </div>

            <div className="overflow-hidden rounded-lg border border-border/60">
              {/* Desktop table */}
              <div className="hidden sm:block">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t("product", language)}</TableHead>
                      <TableHead className="w-20 text-right">{t("qty", language)}</TableHead>
                      <TableHead className="w-32 text-right">{t("unit_price", language)}</TableHead>
                      <TableHead className="w-32 text-right">{t("line_total", language)}</TableHead>
                      <TableHead className="w-10"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {items.map((it) => (
                      <TableRow key={it.key}>
                        <TableCell>
                          <Select
                            value={it.productId}
                            onValueChange={(v) => onProductSelect(it.key, v)}
                          >
                              <SelectTrigger className="h-8 w-full">
                              <SelectValue placeholder={t("select_product", language)} />
                            </SelectTrigger>
                            <SelectContent>
                              {products.map((p) => (
                                <SelectItem key={p.id} value={p.id}>
                                  {p.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            min="1"
                            value={it.quantity}
                            onChange={(e) =>
                              updateItem(it.key, {
                                quantity: Number(e.target.value),
                              })
                            }
                            className="h-8 w-20 text-right"
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            min="0"
                            step="0.01"
                            value={it.unitPrice}
                            onChange={(e) =>
                              updateItem(it.key, {
                                unitPrice: Number(e.target.value),
                              })
                            }
                            className="h-8 w-32 text-right"
                          />
                        </TableCell>
                          <TableCell className="text-right text-sm font-medium text-foreground">
                            {formatCurrency(
                              (Number(it.quantity) || 0) *
                                (Number(it.unitPrice) || 0),
                              language,
                            )}
                        </TableCell>
                        <TableCell>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="size-8 text-muted-foreground hover:text-rose-600"
                            onClick={() => removeItem(it.key)}
                            disabled={items.length === 1}
                          >
                            <X className="size-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Mobile stacked cards */}
              <div className="divide-y sm:hidden">
                {items.map((it) => (
                  <div key={it.key} className="space-y-2 p-3">
                    <Select
                      value={it.productId}
                      onValueChange={(v) => onProductSelect(it.key, v)}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder={t("select_product", language)} />
                      </SelectTrigger>
                      <SelectContent>
                        {products.map((p) => (
                          <SelectItem key={p.id} value={p.id}>
                            {p.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <p className="mb-1 text-xs text-muted-foreground">
                          Qty
                        </p>
                        <Input
                          type="number"
                          min="1"
                          value={it.quantity}
                          onChange={(e) =>
                            updateItem(it.key, {
                              quantity: Number(e.target.value),
                            })
                          }
                        />
                      </div>
                      <div>
                        <p className="mb-1 text-xs text-muted-foreground">
                          Unit Price
                        </p>
                        <Input
                          type="number"
                          min="0"
                          step="0.01"
                          value={it.unitPrice}
                          onChange={(e) =>
                            updateItem(it.key, {
                              unitPrice: Number(e.target.value),
                            })
                          }
                        />
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-foreground">
                        {formatCurrency(
                          (Number(it.quantity) || 0) *
                            (Number(it.unitPrice) || 0),
                          language,
                        )}
                      </span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="text-muted-foreground hover:text-rose-600"
                        onClick={() => removeItem(it.key)}
                        disabled={items.length === 1}
                      >
                        <X className="size-4" /> Remove
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Running total */}
            <div className="flex justify-end">
              <div className="rounded-lg bg-blue-500/10 px-4 py-2 dark:bg-blue-950/30">
                <span className="text-xs text-muted-foreground">{t("total_label", language)}</span>
                <span className="text-base font-semibold text-blue-700 dark:text-blue-400">
                  {formatCurrency(total, language)}
                </span>
              </div>
            </div>
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
              : invoice
                ? t("save_changes", language)
                : t("create_invoice", language)}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ----------------------------- Module ---------------------------- */

export function InvoicesModule() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { openCustomerDetail, setModule } = useUIStore();
  const language = useUIStore.getState().language;

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [formKey, setFormKey] = useState(0);
  const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null);
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [paymentDialogKey, setPaymentDialogKey] = useState(0);
  const [confirmDelete, setConfirmDelete] = useState<Invoice | null>(null);

  /* Data */
  const { data: invoices, isLoading } = useQuery<Invoice[]>({
    queryKey: ["invoices", statusFilter],
    queryFn: async () => {
      const url = new URL("/api/invoices", window.location.origin);
      if (statusFilter !== "all") url.searchParams.set("status", statusFilter);
      const res = await fetch(url.toString());
      return res.json();
    },
  });

  const { data: customers } = useQuery<Customer[]>({
    queryKey: ["customers"],
    queryFn: async () => (await fetch("/api/customers")).json(),
  });
  const { data: products } = useQuery<Product[]>({
    queryKey: ["products"],
    queryFn: async () => (await fetch("/api/products")).json(),
  });
  const { data: deals } = useQuery<Deal[]>({
    queryKey: ["deals"],
    queryFn: async () => (await fetch("/api/deals")).json(),
  });

  /* Mutations */
  const createMutation = useMutation({
    mutationFn: async (data: InvoiceFormPayload) => {
      const res = await fetch("/api/invoices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to create invoice");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
      queryClient.invalidateQueries({ queryKey: ["payments"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      toast({
        title: "Invoice created",
        description: "The invoice has been created successfully.",
      });
      setFormOpen(false);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create invoice. Please try again.",
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
      data: InvoiceFormPayload;
    }) => {
      const res = await fetch(`/api/invoices/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to update invoice");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
      queryClient.invalidateQueries({ queryKey: ["payments"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      toast({
        title: "Invoice updated",
        description: "The invoice has been updated successfully.",
      });
      setFormOpen(false);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update invoice. Please try again.",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await fetch(`/api/invoices/${id}`, { method: "DELETE" });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
      queryClient.invalidateQueries({ queryKey: ["payments"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      toast({
        title: "Invoice deleted",
        description: "The invoice has been deleted.",
      });
      setConfirmDelete(null);
      setDetailOpen(false);
      setSelectedInvoice(null);
    },
  });

  const recordPaymentMutation = useMutation({
    mutationFn: async (data: {
      invoiceId: string;
      amount: number;
      paymentMethod: PaymentMethod;
      date: string;
    }) => {
      const res = await fetch("/api/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to record payment");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
      queryClient.invalidateQueries({ queryKey: ["payments"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      toast({
        title: "Payment recorded",
        description: "The payment has been recorded successfully.",
      });
      setPaymentDialogOpen(false);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to record payment. Please try again.",
        variant: "destructive",
      });
    },
  });

  /* Derived */
  const filteredInvoices = useMemo(() => {
    if (!invoices) return [];
    if (!search.trim()) return invoices;
    const q = search.toLowerCase();
    return invoices.filter(
      (inv) =>
        inv.number.toLowerCase().includes(q) ||
        inv.customer?.name?.toLowerCase().includes(q),
    );
  }, [invoices, search]);

  const stats = useMemo(() => {
    const all = invoices || [];
    const totalBilled = all.reduce((s, i) => s + i.totalAmount, 0);
    const derived = all.map((invoice) => ({
      ...invoice,
      runtimeStatus: deriveInvoiceStatus(
        invoice.totalAmount,
        invoice.payments,
        invoice.dueDate ? new Date(invoice.dueDate) : null,
        invoice.status,
      ),
    }));
    const paid = derived
      .filter((i) => i.runtimeStatus === "paid")
      .reduce((s, i) => s + i.totalAmount, 0);
    const outstanding = derived
      .filter((i) => i.runtimeStatus === "pending" || i.runtimeStatus === "overdue")
      .reduce((s, i) => s + calculateInvoiceBalance(i.totalAmount, i.payments), 0);
    const overdueCount = derived.filter((i) => i.runtimeStatus === "overdue").length;
    return { totalBilled, paid, outstanding, overdueCount };
  }, [invoices]);

  /* Handlers */
  const openInvoiceDetail = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setDetailOpen(true);
  };

  const openCreateForm = () => {
    setEditingInvoice(null);
    setFormKey((k) => k + 1);
    setFormOpen(true);
  };

  const openEditForm = (invoice: Invoice) => {
    setEditingInvoice(invoice);
    setFormKey((k) => k + 1);
    setFormOpen(true);
  };

  const openRecordPayment = () => {
    setPaymentDialogKey((k) => k + 1);
    setPaymentDialogOpen(true);
  };

  const handleCustomerClick = (customerId: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setDetailOpen(false);
    setSelectedInvoice(null);
    openCustomerDetail(customerId);
    setModule("customers");
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("invoices", language)}
        description={t("invoices_description", language)}
        action={
          <Button
            onClick={openCreateForm}
            className="bg-blue-600 text-white hover:bg-blue-700"
          >
            <Plus className="size-4" /> {t("new_invoice", language)}
          </Button>
        }
      />

      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          icon={FileText}
          label={t("total_billed", language)}
          value={formatCurrency(stats.totalBilled, language)}
          accent="from-blue-500 to-sky-600"
        />
        <StatCard
          icon={Banknote}
          label={t("paid", language)}
          value={formatCurrency(stats.paid, language)}
          accent="from-blue-500 to-sky-600"
        />
        <StatCard
          icon={Wallet}
          label={t("outstanding", language)}
          value={formatCurrency(stats.outstanding, language)}
          accent="from-amber-500 to-orange-600"
        />
        <StatCard
          icon={AlertCircle}
          label={t("overdue", language)}
          value={String(stats.overdueCount)}
          accent="from-rose-500 to-red-600"
        />
      </div>

      {/* Filter bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder={t("search_invoices_placeholder", language)}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder={t("all_statuses", language)} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("all_statuses", language)}</SelectItem>
            {Object.entries(INVOICE_STATUS).map(([key, cfg]) => (
              <SelectItem key={key} value={key}>
                {cfg.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      {isLoading ? (
        <LoadingState label={t("loading_invoices", language)} />
      ) : filteredInvoices.length === 0 ? (
        <EmptyState
          icon={FileText}
          title={t("no_invoices_found", language)}
          description={
            search || statusFilter !== "all"
              ? t("try_adjust_filters", language)
              : t("create_first_invoice", language)
          }
          action={
            <Button
              onClick={openCreateForm}
              className="bg-blue-600 text-white hover:bg-blue-700"
            >
              <Plus className="size-4" /> {t("new_invoice", language)}
            </Button>
          }
        />
      ) : (
        <Card className="border-border/60 py-0">
          <div className="max-h-[calc(100vh-220px)] overflow-y-auto">
            <Table>
              <TableHeader className="sticky top-0 z-10 bg-card">
                <TableRow>
                  <TableHead>{t("invoice_number", language)}</TableHead>
                  <TableHead>{t("table_customer", language)}</TableHead>
                  <TableHead>{t("deal_singular", language)}</TableHead>
                  <TableHead>{t("issued", language)}</TableHead>
                  <TableHead>{t("due", language)}</TableHead>
                  <TableHead className="text-right">{t("total", language)}</TableHead>
                  <TableHead className="text-right">{t("paid", language)}</TableHead>
                  <TableHead>{t("status", language)}</TableHead>
                  <TableHead className="w-10"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredInvoices.map((inv) => {
                  const paid = sumPaid(inv.payments);
                  return (
                    <TableRow
                      key={inv.id}
                      onClick={() => openInvoiceDetail(inv)}
                      className="cursor-pointer"
                    >
                      <TableCell className="font-mono text-sm font-semibold text-foreground">
                        {inv.number}
                      </TableCell>
                      <TableCell>
                        <button
                          onClick={(e) =>
                            handleCustomerClick(inv.customer.id, e)
                          }
                          className="text-sm text-foreground hover:text-blue-400 hover:underline dark:hover:text-blue-400"
                        >
                          {inv.customer?.name ?? "—"}
                        </button>
                      </TableCell>
                      <TableCell>
                        {inv.deal ? (
                          <Badge
                            variant="outline"
                            className="max-w-[160px] truncate font-normal text-xs"
                          >
                            {inv.deal.title}
                          </Badge>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {formatDate(inv.createdAt, language)}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {formatDate(inv.dueDate, language)}
                      </TableCell>
                      <TableCell className="text-right font-medium text-foreground">
                        {formatCurrency(inv.totalAmount, language)}
                      </TableCell>
                      <TableCell className="text-right font-medium text-emerald-600 dark:text-emerald-400">
                        {formatCurrency(paid, language)}
                      </TableCell>
                      <TableCell>
                        <InvoiceStatusBadge status={inv.status} />
                      </TableCell>
                      <TableCell onClick={(e) => e.stopPropagation()}>
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
                              onClick={() => openInvoiceDetail(inv)}
                            >
                              <FileText className="size-4" /> {t("view", language)}
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => openEditForm(inv)}
                            >
                              <Pencil className="size-4" /> {t("edit", language)}
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              variant="destructive"
                              onClick={() => setConfirmDelete(inv)}
                            >
                              <Trash2 className="size-4" /> {t("delete", language)}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </Card>
      )}

      {/* Detail Sheet */}
      <InvoiceDetailSheet
        open={detailOpen}
        onOpenChange={(open) => {
          setDetailOpen(open);
          if (!open) setSelectedInvoice(null);
        }}
        invoice={selectedInvoice}
        onEdit={() => {
          if (selectedInvoice) openEditForm(selectedInvoice);
        }}
        onDelete={() => {
          if (selectedInvoice) setConfirmDelete(selectedInvoice);
        }}
        onRecordPayment={openRecordPayment}
        onCustomerClick={(id) => handleCustomerClick(id)}
      />

      {/* Create / Edit form */}
      <InvoiceFormDialog
        key={`form-${formKey}`}
        open={formOpen}
        onOpenChange={setFormOpen}
        invoice={editingInvoice}
        customers={customers || []}
        products={products || []}
        deals={deals || []}
        onSubmit={(data) => {
          if (editingInvoice) {
            updateMutation.mutate({ id: editingInvoice.id, data });
          } else {
            createMutation.mutate(data);
          }
        }}
        submitting={createMutation.isPending || updateMutation.isPending}
      />

      {/* Record Payment */}
      <RecordPaymentDialog
        key={`pay-${paymentDialogKey}`}
        open={paymentDialogOpen}
        onOpenChange={setPaymentDialogOpen}
        invoice={selectedInvoice}
        onSubmit={(data) => recordPaymentMutation.mutate(data)}
        submitting={recordPaymentMutation.isPending}
      />

      {/* Confirm delete */}
      <ConfirmDialog
        open={!!confirmDelete}
        onOpenChange={(open) => {
          if (!open) setConfirmDelete(null);
        }}
        title="Delete invoice?"
        description={`This will permanently delete invoice ${confirmDelete?.number ?? ""} along with all its line items and payments. This action cannot be undone.`}
        confirmText="Delete"
        onConfirm={() =>
          confirmDelete && deleteMutation.mutate(confirmDelete.id)
        }
      />
    </div>
  );
}
