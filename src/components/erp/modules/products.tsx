"use client";

import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  EmptyState,
  LoadingState,
  PageHeader,
} from "@/components/erp/empty-states";
import { ConfirmDialog } from "@/components/erp/confirm-dialog";
import { useToast } from "@/hooks/use-toast";
import { formatCurrency, formatDate } from "@/lib/erp-constants";
import { t } from "@/lib/translations";
import { useUIStore } from "@/store/ui-store";
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
  MoreVertical,
  Package,
  Pencil,
  Plus,
  Search,
  Trash2,
} from "lucide-react";

type Product = {
  id: string;
  name: string;
  price: number;
  description: string | null;
  createdAt: string;
  _count?: { invoiceItems: number };
};

function getInitials(name: string): string {
  return (
    name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((w) => w[0]?.toUpperCase() ?? "")
      .join("") || ""
  );
}

const emptyForm = { name: "", price: "", description: "" };

export function ProductsModule() {
  const { language } = useUIStore();
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [formError, setFormError] = useState<{ name?: string; price?: string }>(
    {}
  );

  const qc = useQueryClient();
  const { toast } = useToast();

  // Debounce search input so we don't spam the API on every keystroke
  useEffect(() => {
    const t = setTimeout(() => setSearch(searchInput.trim()), 300);
    return () => clearTimeout(t);
  }, [searchInput]);

  const { data: products = [], isLoading } = useQuery<Product[]>({
    queryKey: ["products", search],
    queryFn: async () => {
      const url = search
        ? `/api/products?search=${encodeURIComponent(search)}`
        : "/api/products";
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to load products");
      return res.json();
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: {
      name: string;
      price: number;
      description?: string;
    }) => {
      const res = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to create product");
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["products"] });
      toast({
        title: t("product_created", language),
        description: t("product_created_desc", language),
      });
      setDialogOpen(false);
    },
    onError: () => {
      toast({
        title: t("error_something_wrong", language),
        description: t("error_try_again", language),
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
      data: { name: string; price: number; description?: string };
    }) => {
      const res = await fetch(`/api/products/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to update product");
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["products"] });
      toast({
        title: t("product_updated", language),
        description: t("product_updated_desc", language),
      });
      setDialogOpen(false);
    },
    onError: () => {
      toast({
        title: t("error_something_wrong", language),
        description: t("error_try_again", language),
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/products/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete product");
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["products"] });
      toast({
        title: t("product_deleted", language),
        description: t("product_deleted_desc", language),
      });
      setDeleteTarget(null);
    },
    onError: () => {
      toast({
        title: t("error_something_wrong", language),
        description: t("error_try_again", language),
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

  function openEdit(p: Product) {
    setEditing(p);
    setForm({
      name: p.name,
      price: String(p.price ?? ""),
      description: p.description ?? "",
    });
    setFormError({});
    setDialogOpen(true);
  }

  function validate(): boolean {
    const err: { name?: string; price?: string } = {};
    if (!form.name.trim()) err.name = t("validation_name_required", language);
    const priceNum = Number(form.price);
    if (form.price === "" || Number.isNaN(priceNum)) {
      err.price = t("price_is_required", language);
    } else if (priceNum < 0) {
      err.price = t("price_cannot_be_negative", language);
    }
    setFormError(err);
    return Object.keys(err).length === 0;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    const payload = {
      name: form.name.trim(),
      price: Number(form.price),
      description: form.description.trim() || undefined,
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

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("products_page_title", language)}
        description={t("products_page_desc", language)}
        action={
          <Button
            onClick={openCreate}
            className="bg-blue-600 text-white hover:bg-blue-700 focus-visible:ring-blue-600/50"
          >
            <Plus className="size-4" />
            {t("new_product", language)}
          </Button>
        }
      />

      {/* Search bar */}
      <div className="relative max-w-md">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          placeholder={t("search_products", language)}
          className="pl-9"
          aria-label={t("search_products", language)}
        />
      </div>

      {isLoading ? (
        <LoadingState label={t("loading_products", language)} />
      ) : products.length === 0 ? (
        <EmptyState
          icon={Package}
          title={search ? t("no_products_found", language) : t("no_products_yet", language)}
          description={
            search
              ? t("no_products_search_desc", language)
              : t("no_products_desc", language)
          }
          action={
            !search ? (
              <Button
                onClick={openCreate}
                className="bg-blue-600 text-white hover:bg-blue-700 focus-visible:ring-blue-600/50"
              >
                <Plus className="size-4" />
                {t("add_product", language)}
              </Button>
            ) : (
              <Button
                variant="outline"
                onClick={() => setSearchInput("")}
              >
                {t("clear_search", language)}
              </Button>
            )
          }
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {products.map((p) => {
            const initials = getInitials(p.name);
            const usageCount = p._count?.invoiceItems ?? 0;
            return (
              <Card
                key={p.id}
                className="group relative p-5 transition-all duration-200 hover:-translate-y-0.5 hover:border-blue-300 hover:shadow-md dark:hover:border-blue-900"
              >
                {/* Kebab menu */}
                <div className="absolute right-3 top-3">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-8 text-muted-foreground opacity-60 hover:bg-accent hover:text-foreground group-hover:opacity-100 focus-visible:opacity-100 data-[state=open]:opacity-100"
                        aria-label={`Actions for ${p.name}`}
                      >
                        <MoreVertical className="size-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-36">
                      <DropdownMenuItem onClick={() => openEdit(p)}>
                        <Pencil className="size-4" />
                        {t("edit", language)}
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        variant="destructive"
                        onClick={() => setDeleteTarget(p)}
                      >
                        <Trash2 className="size-4" />
                        {t("delete", language)}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                {/* Header: avatar + name */}
                <div className="flex items-start gap-3 pr-8">
                  <div className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-blue-500/10 text-blue-400">
                    {initials ? (
                      <span className="text-sm font-semibold">{initials}</span>
                    ) : (
                      <Package className="size-5" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="truncate font-semibold text-foreground">
                      {p.name}
                    </h3>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {t("added", language)} {formatDate(p.createdAt)}
                    </p>
                  </div>
                </div>

                {/* Description (2-line clamp) */}
                <p className="mt-3 line-clamp-2 min-h-[2.5rem] text-sm text-muted-foreground">
                  {p.description || t("no_description", language)}
                </p>

                {/* Footer: price + usage */}
                <div className="mt-4 flex items-end justify-between border-t border-border pt-3">
                  <div>
                    <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                      {t("price", language)}
                    </p>
                    <p className="text-lg font-semibold text-blue-400">
                      {formatCurrency(p.price)}
                    </p>
                  </div>
                  <span className="inline-flex items-center rounded-full bg-zinc-100 px-2.5 py-1 text-xs font-medium text-zinc-600 dark:bg-zinc-500/15 dark:text-zinc-400">
                    {t("used_in", language)} {usageCount}{" "}
                    {usageCount === 1 ? t("invoice_singular", language) : t("invoice_plural", language)}
                  </span>
                </div>
              </Card>
            );
          })}
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
              {editing ? t("edit_product", language) : t("new_product", language)}
            </DialogTitle>
            <DialogDescription>
              {editing
                ? t("edit_product_desc", language)
                : t("create_product_desc", language)}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="product-name">
                {t("name_label", language)} <span className="text-rose-500">*</span>
              </Label>
              <Input
                id="product-name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder={t("name_placeholder", language)}
                autoFocus
                aria-invalid={!!formError.name}
              />
              {formError.name && (
                <p className="text-xs text-rose-600">{formError.name}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="product-price">
                {t("price_label", language)} <span className="text-rose-500">*</span>
              </Label>
              <Input
                id="product-price"
                type="number"
                min="0"
                step="0.01"
                value={form.price}
                onChange={(e) => setForm({ ...form, price: e.target.value })}
                placeholder="0"
                aria-invalid={!!formError.price}
              />
              {formError.price && (
                <p className="text-xs text-rose-600">{formError.price}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="product-description">{t("description_label", language)}</Label>
              <Textarea
                id="product-description"
                value={form.description}
                onChange={(e) =>
                  setForm({ ...form, description: e.target.value })
                }
                placeholder={t("description_placeholder", language)}
                rows={3}
              />
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setDialogOpen(false)}
                disabled={isSaving}
              >
                {t("cancel", language)}
              </Button>
              <Button
                type="submit"
                disabled={isSaving}
                className="bg-blue-600 text-white hover:bg-blue-700 focus-visible:ring-blue-600/50"
              >
                {isSaving
                  ? t("saving", language)
                  : editing
                    ? t("save_changes", language)
                    : t("create_product", language)}
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
        title={t("delete_product", language)}
        description={
          deleteTarget
            ? t("delete_product_confirm", language).replace("{name}", deleteTarget.name)
            : ""
        }
        confirmText={isDeleting ? t("deleting", language) : t("delete", language)}
        onConfirm={() => {
          if (deleteTarget && !isDeleting) deleteMutation.mutate(deleteTarget.id);
        }}
      />
    </div>
  );
}
