"use client";

import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  EmptyState,
  LoadingState,
  PageHeader,
} from "@/components/erp/empty-states";
import { ConfirmDialog } from "@/components/erp/confirm-dialog";
import {
  CustomerStatusBadge,
  DealStageBadge,
  InteractionTypeBadge,
  InvoiceStatusBadge,
} from "@/components/erp/badges";
import { useToast } from "@/hooks/use-toast";
import { useUIStore } from "@/store/ui-store";
import {
  CUSTOMER_SOURCES,
  CUSTOMER_STATUS,
  formatCurrency,
  formatDate,
  formatDateTime,
  timeAgo,
  type CustomerSource,
  type CustomerStatus,
} from "@/lib/erp-constants";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Building2,
  Calendar,
  ExternalLink,
  FileText,
  Globe,
  Handshake,
  Mail,
  Megaphone,
  MessageSquare,
  MoreVertical,
  Pencil,
  Phone,
  Plus,
  Search,
  Share2,
  Trash2,
  Users,
} from "lucide-react";

type CustomerListItem = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  status: string;
  source: string | null;
  createdAt: string;
  updatedAt: string;
  _count: { deals: number; invoices: number; interactions: number };
};

type CustomerDeal = {
  id: string;
  title: string;
  value: number;
  stage: string;
  createdAt: string;
};

type CustomerInteraction = {
  id: string;
  content: string;
  type: string;
  date: string;
};

type CustomerInvoice = {
  id: string;
  number: string;
  totalAmount: number;
  status: string;
  dueDate: string | null;
  createdAt: string;
  _count: { payments: number };
};

type CustomerDetail = CustomerListItem & {
  deals: CustomerDeal[];
  interactions: CustomerInteraction[];
  invoices: CustomerInvoice[];
};

const STATUS_OPTIONS: CustomerStatus[] = ["new", "lead", "active", "inactive"];
const SOURCE_OPTIONS: CustomerSource[] = [
  "website",
  "social_media",
  "referral",
  "ads",
  "other",
];

const SOURCE_ICONS: Record<CustomerSource, typeof Globe> = {
  website: Globe,
  social_media: Share2,
  referral: Users,
  ads: Megaphone,
  other: ExternalLink,
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

const emptyForm = {
  name: "",
  email: "",
  phone: "",
  status: "new" as CustomerStatus,
  source: "website" as CustomerSource,
};

export function CustomersModule() {
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<CustomerListItem | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<CustomerListItem | null>(
    null,
  );
  const [form, setForm] = useState(emptyForm);
  const [formError, setFormError] = useState<{ name?: string }>({});

  const qc = useQueryClient();
  const { toast } = useToast();
  const customerDetail = useUIStore((s) => s.customerDetail);
  const closeCustomerDetail = useUIStore((s) => s.closeCustomerDetail);
  const activeCustomerId = customerDetail.customerId;

  // Debounce search input
  useEffect(() => {
    const t = setTimeout(() => setSearch(searchInput.trim()), 300);
    return () => clearTimeout(t);
  }, [searchInput]);

  // List query (re-runs when filters change)
  const { data: customers = [], isLoading } = useQuery<CustomerListItem[]>({
    queryKey: ["customers", search, statusFilter],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (statusFilter && statusFilter !== "all")
        params.set("status", statusFilter);
      const res = await fetch(`/api/customers?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to load customers");
      return res.json();
    },
  });

  // Detail query (only when sheet open)
  const { data: detail, isLoading: detailLoading } = useQuery<CustomerDetail>({
    queryKey: ["customer", activeCustomerId],
    queryFn: async () => {
      const res = await fetch(`/api/customers/${activeCustomerId}`);
      if (!res.ok) throw new Error("Failed to load customer");
      return res.json();
    },
    enabled: customerDetail.open && !!activeCustomerId,
  });

  const createMutation = useMutation({
    mutationFn: async (data: {
      name: string;
      email?: string;
      phone?: string;
      status: CustomerStatus;
      source: CustomerSource;
    }) => {
      const res = await fetch("/api/customers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to create customer");
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["customers"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
      toast({
        title: "Customer created",
        description: "The customer has been added to your CRM.",
      });
      setDialogOpen(false);
    },
    onError: () => {
      toast({
        title: "Something went wrong",
        description: "Could not create the customer. Please try again.",
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
        name: string;
        email?: string;
        phone?: string;
        status: CustomerStatus;
        source: CustomerSource;
      };
    }) => {
      const res = await fetch(`/api/customers/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to update customer");
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["customers"] });
      qc.invalidateQueries({ queryKey: ["customer", activeCustomerId] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
      toast({
        title: "Customer updated",
        description: "Your changes have been saved.",
      });
      setDialogOpen(false);
    },
    onError: () => {
      toast({
        title: "Something went wrong",
        description: "Could not update the customer. Please try again.",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/customers/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete customer");
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["customers"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
      toast({
        title: "Customer deleted",
        description: "The customer and their related records were removed.",
      });
      setDeleteTarget(null);
    },
    onError: () => {
      toast({
        title: "Something went wrong",
        description: "Could not delete the customer. Please try again.",
        variant: "destructive",
      });
    },
  });

  function openCreate() {
    setEditing(null);
    setForm(emptyForm);
    setFormError({});
    setDialogOpen(true);
  }

  function openEdit(c: CustomerListItem) {
    setEditing(c);
    setForm({
      name: c.name,
      email: c.email ?? "",
      phone: c.phone ?? "",
      status: (c.status as CustomerStatus) || "new",
      source: (c.source as CustomerSource) || "website",
    });
    setFormError({});
    setDialogOpen(true);
  }

  function validate(): boolean {
    const err: { name?: string } = {};
    if (!form.name.trim()) err.name = "Name is required";
    setFormError(err);
    return Object.keys(err).length === 0;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    const payload = {
      name: form.name.trim(),
      email: form.email.trim() || undefined,
      phone: form.phone.trim() || undefined,
      status: form.status,
      source: form.source,
    };
    if (editing) {
      updateMutation.mutate({ id: editing.id, data: payload });
    } else {
      createMutation.mutate(payload);
    }
  }

  const isSaving =
    createMutation.isPending || updateMutation.isPending;
  const isDeleting = deleteMutation.isPending;

  const totalDeals = customers.reduce((s, c) => s + c._count.deals, 0);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Customers"
        description="Manage your customer relationships, leads, and contact information."
        action={
          <Button
            onClick={openCreate}
            className="bg-blue-600 text-white hover:bg-blue-700 focus-visible:ring-blue-600/50"
          >
            <Plus className="size-4" />
            New Customer
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
            placeholder="Search by name, email or phone..."
            className="pl-9"
            aria-label="Search customers"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger
            className="w-full sm:w-[180px]"
            aria-label="Filter by status"
          >
            <SelectValue placeholder="All statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            {STATUS_OPTIONS.map((s) => (
              <SelectItem key={s} value={s}>
                {CUSTOMER_STATUS[s].label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Table / states */}
      {isLoading ? (
        <LoadingState label="Loading customers..." />
      ) : customers.length === 0 ? (
        <EmptyState
          icon={Users}
          title={search || statusFilter !== "all" ? "No customers found" : "No customers yet"}
          description={
            search || statusFilter !== "all"
              ? "Try adjusting your search or filters to find what you're looking for."
              : "Add your first customer to start managing relationships and deals."
          }
          action={
            search || statusFilter !== "all" ? (
              <Button
                variant="outline"
                onClick={() => {
                  setSearchInput("");
                  setStatusFilter("all");
                }}
              >
                Clear filters
              </Button>
            ) : (
              <Button
                onClick={openCreate}
                className="bg-blue-600 text-white hover:bg-blue-700 focus-visible:ring-blue-600/50"
              >
                <Plus className="size-4" />
                Add Customer
              </Button>
            )
          }
        />
      ) : (
        <Card className="overflow-hidden p-0">
          <div className="flex items-center justify-between border-b border-border/60 px-4 py-3">
            <p className="text-sm text-muted-foreground">
              <span className="font-medium text-foreground">
                {customers.length}
              </span>{" "}
              {customers.length === 1 ? "customer" : "customers"}
              {totalDeals > 0 && (
                <>
                  {" · "}
                  <span className="font-medium text-foreground">
                    {totalDeals}
                  </span>{" "}
                  open {totalDeals === 1 ? "deal" : "deals"}
                </>
              )}
            </p>
          </div>
          <div className="max-h-[calc(100vh-260px)] overflow-y-auto overflow-x-auto [scrollbar-width:thin] [scrollbar-color:var(--border)_transparent] [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-border">
            <Table>
              <TableHeader className="sticky top-0 z-10 bg-card after:absolute after:inset-x-0 after:bottom-0 after:h-px after:bg-border">
                <TableRow className="border-b hover:bg-transparent">
                  <TableHead className="pl-4">Customer</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Source</TableHead>
                  <TableHead className="text-center">Deals</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="w-12 pr-4 text-right" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {customers.map((c) => {
                  const SourceIcon = c.source
                    ? SOURCE_ICONS[c.source as CustomerSource] ?? Building2
                    : Building2;
                  return (
                    <TableRow
                      key={c.id}
                      onClick={() =>
                        useUIStore.getState().openCustomerDetail(c.id)
                      }
                      className="cursor-pointer"
                    >
                      <TableCell className="pl-4">
                        <div className="flex items-center gap-3">
                          <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-blue-500/10 text-xs font-semibold text-blue-400">
                            {getInitials(c.name)}
                          </div>
                          <div className="min-w-0">
                            <p className="truncate font-medium text-foreground">
                              {c.name}
                            </p>
                            <p className="truncate text-xs text-muted-foreground sm:hidden">
                              {c.email || c.phone || "No contact"}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-0.5">
                          {c.email ? (
                            <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                              <Mail className="size-3" />
                              <span className="truncate">{c.email}</span>
                            </span>
                          ) : (
                            <span className="text-xs text-muted-foreground/60">
                              No email
                            </span>
                          )}
                          {c.phone ? (
                            <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                              <Phone className="size-3" />
                              <span className="truncate">{c.phone}</span>
                            </span>
                          ) : (
                            <span className="text-xs text-muted-foreground/60">
                              No phone
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <CustomerStatusBadge status={c.status} />
                      </TableCell>
                      <TableCell>
                        {c.source ? (
                          <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                            <SourceIcon className="size-3.5" />
                            {CUSTOMER_SOURCES[c.source as CustomerSource] ??
                              c.source}
                          </span>
                        ) : (
                          <span className="text-xs text-muted-foreground/60">
                            —
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        <span
                          className={cn(
                            "inline-flex min-w-6 items-center justify-center rounded-full px-2 py-0.5 text-xs font-medium",
                            c._count.deals > 0
                              ? "bg-blue-500/10 text-blue-400"
                              : "bg-muted text-muted-foreground",
                          )}
                        >
                          {c._count.deals}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="text-xs text-muted-foreground">
                          {formatDate(c.createdAt)}
                        </span>
                      </TableCell>
                      <TableCell
                        className="pr-4 text-right"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="size-8 text-muted-foreground hover:bg-accent hover:text-foreground"
                              aria-label={`Actions for ${c.name}`}
                            >
                              <MoreVertical className="size-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-36">
                            <DropdownMenuItem
                              onClick={() =>
                                useUIStore
                                  .getState()
                                  .openCustomerDetail(c.id)
                              }
                            >
                              <ExternalLink className="size-4" />
                              View details
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => openEdit(c)}>
                              <Pencil className="size-4" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              variant="destructive"
                              onClick={() => setDeleteTarget(c)}
                            >
                              <Trash2 className="size-4" />
                              Delete
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
              {editing ? "Edit Customer" : "New Customer"}
            </DialogTitle>
            <DialogDescription>
              {editing
                ? "Update this customer's details and contact information."
                : "Add a new customer or lead to your CRM."}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="customer-name">
                Name <span className="text-rose-500">*</span>
              </Label>
              <Input
                id="customer-name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="e.g. Acme Corporation"
                autoFocus
                aria-invalid={!!formError.name}
              />
              {formError.name && (
                <p className="text-xs text-rose-600">{formError.name}</p>
              )}
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="customer-email">Email</Label>
                <Input
                  id="customer-email"
                  type="email"
                  value={form.email}
                  onChange={(e) =>
                    setForm({ ...form, email: e.target.value })
                  }
                  placeholder="name@company.com"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="customer-phone">Phone</Label>
                <Input
                  id="customer-phone"
                  value={form.phone}
                  onChange={(e) =>
                    setForm({ ...form, phone: e.target.value })
                  }
                  placeholder="+20 100 000 0000"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="customer-status">Status</Label>
                <Select
                  value={form.status}
                  onValueChange={(v) =>
                    setForm({ ...form, status: v as CustomerStatus })
                  }
                >
                  <SelectTrigger id="customer-status" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUS_OPTIONS.map((s) => (
                      <SelectItem key={s} value={s}>
                        {CUSTOMER_STATUS[s].label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="customer-source">Source</Label>
                <Select
                  value={form.source}
                  onValueChange={(v) =>
                    setForm({ ...form, source: v as CustomerSource })
                  }
                >
                  <SelectTrigger id="customer-source" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {SOURCE_OPTIONS.map((s) => (
                      <SelectItem key={s} value={s}>
                        {CUSTOMER_SOURCES[s]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
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
                disabled={isSaving}
                className="bg-blue-600 text-white hover:bg-blue-700 focus-visible:ring-blue-600/50"
              >
                {isSaving
                  ? "Saving..."
                  : editing
                    ? "Save Changes"
                    : "Create Customer"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Customer detail sheet */}
      <Sheet
        open={customerDetail.open}
        onOpenChange={(v) => {
          if (!v) closeCustomerDetail();
        }}
      >
        <SheetContent
          side="right"
          className="w-full gap-0 p-0 sm:max-w-lg"
        >
          {detailLoading || !detail ? (
            <div className="flex h-full items-center justify-center">
              <LoadingState label="Loading customer..." />
            </div>
          ) : (
            <>
              <SheetHeader className="gap-3 border-b border-border/60 p-5">
                <div className="flex items-start gap-3">
                  <div className="flex size-12 shrink-0 items-center justify-center rounded-full bg-blue-500/10 text-sm font-semibold text-blue-400">
                    {getInitials(detail.name)}
                  </div>
                  <div className="min-w-0 flex-1 pr-6">
                    <SheetTitle className="truncate text-lg">
                      {detail.name}
                    </SheetTitle>
                    <div className="mt-1.5 flex flex-wrap items-center gap-2">
                      <CustomerStatusBadge status={detail.status} />
                      {detail.source && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-600 dark:bg-zinc-500/15 dark:text-zinc-400">
                          {CUSTOMER_SOURCES[detail.source as CustomerSource] ??
                            detail.source}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <SheetDescription className="sr-only">
                  Customer details and related records
                </SheetDescription>
              </SheetHeader>

              <Tabs defaultValue="overview" className="flex min-h-0 flex-1 flex-col gap-0">
                <div className="border-b border-border/60 px-3 pt-3">
                  <TabsList className="bg-transparent p-0">
                    <TabsTrigger value="overview">Overview</TabsTrigger>
                    <TabsTrigger value="deals">
                      Deals ({detail.deals.length})
                    </TabsTrigger>
                    <TabsTrigger value="interactions">
                      Activity ({detail.interactions.length})
                    </TabsTrigger>
                    <TabsTrigger value="invoices">
                      Invoices ({detail.invoices.length})
                    </TabsTrigger>
                  </TabsList>
                </div>

                <ScrollArea className="min-h-0 flex-1">
                  {/* Overview tab */}
                  <TabsContent
                    value="overview"
                    className="m-0 space-y-4 p-5"
                  >
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        {
                          label: "Deals",
                          value: detail._count.deals,
                          icon: Handshake,
                          accent:
                            "bg-blue-500/10 text-blue-400",
                        },
                        {
                          label: "Invoices",
                          value: detail._count.invoices,
                          icon: FileText,
                          accent:
                            "bg-violet-50 text-violet-600 dark:bg-violet-500/15 dark:text-violet-400",
                        },
                        {
                          label: "Activity",
                          value: detail._count.interactions,
                          icon: MessageSquare,
                          accent:
                            "bg-sky-50 text-sky-600 dark:bg-sky-500/15 dark:text-sky-400",
                        },
                      ].map((stat) => {
                        const Icon = stat.icon;
                        return (
                          <div
                            key={stat.label}
                            className="rounded-lg border border-border/60 p-3"
                          >
                            <div
                              className={cn(
                                "mb-2 flex size-8 items-center justify-center rounded-md",
                                stat.accent,
                              )}
                            >
                              <Icon className="size-4" />
                            </div>
                            <p className="text-xl font-semibold text-foreground">
                              {stat.value}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {stat.label}
                            </p>
                          </div>
                        );
                      })}
                    </div>

                    <div className="rounded-lg border border-border/60 p-4">
                      <h4 className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        Contact information
                      </h4>
                      <div className="space-y-2.5">
                        <div className="flex items-center gap-2.5 text-sm">
                          <Mail className="size-4 shrink-0 text-muted-foreground" />
                          {detail.email ? (
                            <a
                              href={`mailto:${detail.email}`}
                              className="truncate text-blue-400 hover:text-blue-300 hover:underline"
                            >
                              {detail.email}
                            </a>
                          ) : (
                            <span className="text-muted-foreground/60">
                              No email provided
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2.5 text-sm">
                          <Phone className="size-4 shrink-0 text-muted-foreground" />
                          {detail.phone ? (
                            <a
                              href={`tel:${detail.phone}`}
                              className="text-blue-400 hover:text-blue-300 hover:underline"
                            >
                              {detail.phone}
                            </a>
                          ) : (
                            <span className="text-muted-foreground/60">
                              No phone provided
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2.5 text-sm">
                          <Calendar className="size-4 shrink-0 text-muted-foreground" />
                          <span className="text-muted-foreground">
                            Customer since {formatDate(detail.createdAt)}
                          </span>
                        </div>
                        {detail.source && (
                          <div className="flex items-center gap-2.5 text-sm">
                            {(() => {
                              const SourceIcon =
                                SOURCE_ICONS[
                                  detail.source as CustomerSource
                                ] ?? Building2;
                              return (
                                <SourceIcon className="size-4 shrink-0 text-muted-foreground" />
                              );
                            })()}
                            <span className="text-muted-foreground">
                              Acquired via{" "}
                              {CUSTOMER_SOURCES[
                                detail.source as CustomerSource
                              ] ?? detail.source}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    {detail.deals.length > 0 && (
                      <div className="rounded-lg border border-border/60 p-4">
                        <h4 className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                          Latest deal
                        </h4>
                        {(() => {
                          const d = detail.deals[0];
                          return (
                            <div className="flex items-center justify-between gap-3">
                              <div className="min-w-0">
                                <p className="truncate text-sm font-medium text-foreground">
                                  {d.title}
                                </p>
                                <div className="mt-1">
                                  <DealStageBadge stage={d.stage} />
                                </div>
                              </div>
                              <p className="shrink-0 font-semibold text-foreground">
                                {formatCurrency(d.value)}
                              </p>
                            </div>
                          );
                        })()}
                      </div>
                    )}
                  </TabsContent>

                  {/* Deals tab */}
                  <TabsContent value="deals" className="m-0 p-5">
                    {detail.deals.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-10 text-center">
                        <Handshake className="mb-2 size-8 text-muted-foreground/50" />
                        <p className="text-sm font-medium text-foreground">
                          No deals yet
                        </p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          Deals for this customer will appear here.
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {detail.deals.map((d) => (
                          <div
                            key={d.id}
                            className="flex items-center justify-between gap-3 rounded-lg border border-border/60 p-3 transition-colors hover:bg-muted/40"
                          >
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-sm font-medium text-foreground">
                                {d.title}
                              </p>
                              <div className="mt-1.5 flex items-center gap-2">
                                <DealStageBadge stage={d.stage} />
                                <span className="text-xs text-muted-foreground">
                                  {formatDate(d.createdAt)}
                                </span>
                              </div>
                            </div>
                            <p className="shrink-0 font-semibold text-foreground">
                              {formatCurrency(d.value)}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}
                  </TabsContent>

                  {/* Interactions tab */}
                  <TabsContent value="interactions" className="m-0 p-5">
                    {detail.interactions.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-10 text-center">
                        <MessageSquare className="mb-2 size-8 text-muted-foreground/50" />
                        <p className="text-sm font-medium text-foreground">
                          No activity logged
                        </p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          Log calls, meetings and notes from the Activity
                          module.
                        </p>
                      </div>
                    ) : (
                      <ol className="relative space-y-3 border-l border-border pl-4">
                        {detail.interactions.map((it) => (
                          <li key={it.id} className="relative">
                            <span className="absolute -left-[21px] top-1.5 size-2.5 rounded-full border-2 border-background bg-blue-500" />
                            <div className="flex items-center gap-2">
                              <InteractionTypeBadge type={it.type} />
                              <span className="text-xs text-muted-foreground">
                                {timeAgo(it.date)}
                              </span>
                            </div>
                            <p className="mt-1.5 text-sm text-foreground">
                              {it.content}
                            </p>
                            <p className="mt-1 text-xs text-muted-foreground">
                              {formatDateTime(it.date)}
                            </p>
                          </li>
                        ))}
                      </ol>
                    )}
                  </TabsContent>

                  {/* Invoices tab */}
                  <TabsContent value="invoices" className="m-0 p-5">
                    {detail.invoices.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-10 text-center">
                        <FileText className="mb-2 size-8 text-muted-foreground/50" />
                        <p className="text-sm font-medium text-foreground">
                          No invoices yet
                        </p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          Invoices issued to this customer will appear here.
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {detail.invoices.map((inv) => (
                          <div
                            key={inv.id}
                            className="flex items-center justify-between gap-3 rounded-lg border border-border/60 p-3 transition-colors hover:bg-muted/40"
                          >
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-sm font-medium text-foreground">
                                {inv.number}
                              </p>
                              <div className="mt-1.5 flex items-center gap-2">
                                <InvoiceStatusBadge status={inv.status} />
                                <span className="text-xs text-muted-foreground">
                                  {formatDate(inv.createdAt)}
                                </span>
                                {inv._count.payments > 0 && (
                                  <span className="text-xs text-muted-foreground">
                                    · {inv._count.payments}{" "}
                                    {inv._count.payments === 1
                                      ? "payment"
                                      : "payments"}
                                  </span>
                                )}
                              </div>
                            </div>
                            <p className="shrink-0 font-semibold text-foreground">
                              {formatCurrency(inv.totalAmount)}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}
                  </TabsContent>
                </ScrollArea>
              </Tabs>
            </>
          )}
        </SheetContent>
      </Sheet>

      {/* Delete confirmation */}
      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(v) => {
          if (!isDeleting && !v) setDeleteTarget(null);
        }}
        title="Delete customer?"
        description={
          deleteTarget
            ? `Are you sure you want to delete "${deleteTarget.name}"? All related deals, interactions and invoices will also be removed. This action cannot be undone.`
            : ""
        }
        confirmText={isDeleting ? "Deleting..." : "Delete"}
        onConfirm={() => {
          if (deleteTarget) deleteMutation.mutate(deleteTarget.id);
        }}
      />
    </div>
  );
}
