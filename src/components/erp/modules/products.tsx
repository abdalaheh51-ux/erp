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
        title: "Product created",
        description: "The product has been added to your catalog.",
      });
      setDialogOpen(false);
    },
    onError: () => {
      toast({
        title: "Something went wrong",
        description: "Could not create the product. Please try again.",
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
        title: "Product updated",
        description: "Your changes have been saved.",
      });
      setDialogOpen(false);
    },
    onError: () => {
      toast({
        title: "Something went wrong",
        description: "Could not update the product. Please try again.",
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
        title: "Product deleted",
        description: "The product has been removed from your catalog.",
      });
      setDeleteTarget(null);
    },
    onError: () => {
      toast({
        title: "Something went wrong",
        description: "Could not delete the product. Please try again.",
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
    if (!form.name.trim()) err.name = "Name is required";
    const priceNum = Number(form.price);
    if (form.price === "" || Number.isNaN(priceNum)) {
      err.price = "Price is required";
    } else if (priceNum < 0) {
      err.price = "Price cannot be negative";
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
        title="Products & Services"
        description="Manage your catalog of products and services offered to customers."
        action={
          <Button
            onClick={openCreate}
            className="bg-blue-600 text-white hover:bg-blue-700 focus-visible:ring-blue-600/50"
          >
            <Plus className="size-4" />
            New Product
          </Button>
        }
      />

      {/* Search bar */}
      <div className="relative max-w-md">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          placeholder="Search products by name..."
          className="pl-9"
          aria-label="Search products"
        />
      </div>

      {isLoading ? (
        <LoadingState label="Loading products..." />
      ) : products.length === 0 ? (
        <EmptyState
          icon={Package}
          title={search ? "No products found" : "No products yet"}
          description={
            search
              ? "Try a different search term or clear the search to see all products."
              : "Add your first product or service to start building your catalog."
          }
          action={
            !search ? (
              <Button
                onClick={openCreate}
                className="bg-blue-600 text-white hover:bg-blue-700 focus-visible:ring-blue-600/50"
              >
                <Plus className="size-4" />
                Add Product
              </Button>
            ) : (
              <Button
                variant="outline"
                onClick={() => setSearchInput("")}
              >
                Clear search
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
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        variant="destructive"
                        onClick={() => setDeleteTarget(p)}
                      >
                        <Trash2 className="size-4" />
                        Delete
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
                      Added {formatDate(p.createdAt)}
                    </p>
                  </div>
                </div>

                {/* Description (2-line clamp) */}
                <p className="mt-3 line-clamp-2 min-h-[2.5rem] text-sm text-muted-foreground">
                  {p.description || "No description provided."}
                </p>

                {/* Footer: price + usage */}
                <div className="mt-4 flex items-end justify-between border-t border-border pt-3">
                  <div>
                    <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                      Price
                    </p>
                    <p className="text-lg font-semibold text-blue-400">
                      {formatCurrency(p.price)}
                    </p>
                  </div>
                  <span className="inline-flex items-center rounded-full bg-zinc-100 px-2.5 py-1 text-xs font-medium text-zinc-600 dark:bg-zinc-500/15 dark:text-zinc-400">
                    Used in {usageCount}{" "}
                    {usageCount === 1 ? "invoice" : "invoices"}
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
              {editing ? "Edit Product" : "New Product"}
            </DialogTitle>
            <DialogDescription>
              {editing
                ? "Update the details of this product or service."
                : "Add a new product or service to your catalog."}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="product-name">
                Name <span className="text-rose-500">*</span>
              </Label>
              <Input
                id="product-name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="e.g. Web Design Service"
                autoFocus
                aria-invalid={!!formError.name}
              />
              {formError.name && (
                <p className="text-xs text-rose-600">{formError.name}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="product-price">
                Price (EGP) <span className="text-rose-500">*</span>
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
              <Label htmlFor="product-description">Description</Label>
              <Textarea
                id="product-description"
                value={form.description}
                onChange={(e) =>
                  setForm({ ...form, description: e.target.value })
                }
                placeholder="Optional description of the product or service..."
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
                    : "Create Product"}
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
        title="Delete product?"
        description={
          deleteTarget
            ? `Are you sure you want to delete "${deleteTarget.name}"? This action cannot be undone.`
            : ""
        }
        confirmText={isDeleting ? "Deleting..." : "Delete"}
        onConfirm={() => {
          if (deleteTarget && !isDeleting) deleteMutation.mutate(deleteTarget.id);
        }}
      />
    </div>
  );
}
