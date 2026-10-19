"use client";

import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Check, Edit3, Loader2, Package, Plus, Power, RefreshCw, Search, Sparkles, X } from "lucide-react";
import Link from "next/link";
import { DashboardShell, PageHeading, SectionCard } from "@/components/management/DashboardShell";
import { adminNavigation } from "@/components/management/navigation";
import { adminApi } from "@/lib/api/admin";
import type { ProductItem } from "@/lib/api/types";

export default function AdminProductsPage() {
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showActive, setShowActive] = useState<"all" | "active" | "inactive">("all");

  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<ProductItem | null>(null);
  const [formName, setFormName] = useState("");
  const [formSku, setFormSku] = useState("");
  const [formBasePrice, setFormBasePrice] = useState<number | string>("");
  const [formMinPrice, setFormMinPrice] = useState<number | string>("");
  const [formError, setFormError] = useState("");
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [notice, setNotice] = useState("");
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const res = await adminApi.listProducts();
      setProducts(res?.items ?? []);
    } catch {
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      if (showActive === "active" && !p.active) return false;
      if (showActive === "inactive" && p.active) return false;
      if (search) {
        const q = search.toLowerCase();
        return p.name.toLowerCase().includes(q) || (p.sku && p.sku.toLowerCase().includes(q));
      }
      return true;
    });
  }, [products, search, showActive]);

  const generateSkuFromName = () => {
    const raw = formName.trim();
    if (!raw) {
      const randomSuffix = Math.floor(100 + Math.random() * 900);
      setFormSku(`FF-PRD-${randomSuffix}`);
      return;
    }
    // Take words and form an uppercase acronym
    const words = raw
      .replace(/[^a-zA-Z0-9\s]/g, "")
      .split(/\s+/)
      .filter(Boolean);
    const code = words
      .map((w) => w.slice(0, 3).toUpperCase())
      .slice(0, 3)
      .join("-");
    const randomSuffix = Math.floor(100 + Math.random() * 900);
    setFormSku(`FF-${code || "PRD"}-${randomSuffix}`);
  };

  const openCreateModal = () => {
    setEditingProduct(null);
    setFormName("");
    setFormSku("");
    setFormBasePrice("");
    setFormMinPrice("");
    setFormError("");
    setShowModal(true);
  };

  const openEditModal = (product: ProductItem) => {
    setEditingProduct(product);
    setFormName(product.name);
    setFormSku(product.sku || "");
    setFormBasePrice(product.basePricePaise / 100);
    setFormMinPrice(product.minimumPricePaise / 100);
    setFormError("");
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const name = formName.trim();
    if (!name) { setFormError("Product name is required."); return; }

    const basePrice = Number(formBasePrice);
    const minPrice = Number(formMinPrice);
    if (!basePrice || basePrice <= 0) { setFormError("Base price must be positive."); return; }
    if (!minPrice || minPrice <= 0) { setFormError("Minimum price must be positive."); return; }
    if (minPrice > basePrice) { setFormError("Minimum price cannot exceed base price."); return; }

    setFormSubmitting(true);
    setFormError("");

    try {
      if (editingProduct) {
        await adminApi.updateProduct(editingProduct.id, {
          name,
          sku: formSku.trim() || null,
          basePricePaise: Math.round(basePrice * 100),
          minimumPricePaise: Math.round(minPrice * 100),
        });
        setNotice(`Product "${name}" updated.`);
      } else {
        await adminApi.createProduct({
          name,
          sku: formSku.trim() || undefined,
          basePricePaise: Math.round(basePrice * 100),
          minimumPricePaise: Math.round(minPrice * 100),
        });
        setNotice(`Product "${name}" created.`);
      }
      setShowModal(false);
      await fetchProducts();
      setTimeout(() => setNotice(""), 3000);
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : "Failed to save product.");
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleToggle = async (product: ProductItem) => {
    setTogglingId(product.id);
    try {
      await adminApi.toggleProduct(product.id);
      await fetchProducts();
      setNotice(`Product "${product.name}" ${product.active ? "deactivated" : "activated"}.`);
      setTimeout(() => setNotice(""), 3000);
    } catch {
      setNotice("Failed to toggle product status.");
      setTimeout(() => setNotice(""), 3000);
    } finally {
      setTogglingId(null);
    }
  };

  return (
    <DashboardShell
      role="Super Admin"
      workspace="Admin workspace"
      userName="Super Admin"
      userDetail="Head Office"
      navigation={adminNavigation}
    >
      <Link href="/admin" className="inline-flex items-center gap-2 text-xs font-bold text-zinc-800 hover:text-[#E61C5D]">
        <ArrowLeft className="h-4 w-4" />Back to admin
      </Link>
      <div className="mt-7">
        <PageHeading
          eyebrow="Product Catalog"
          title="Products"
          description="Manage the product catalog with pricing and minimum price thresholds for approval workflows."
          action={
            <div className="flex items-center gap-3">
              <button
                onClick={fetchProducts}
                disabled={loading}
                className="flex h-11 w-11 items-center justify-center rounded-xl border border-zinc-200 bg-white text-zinc-900 hover:border-rose-200 hover:text-[#E61C5D]"
              >
                <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin text-[#E61C5D]" : ""}`} />
              </button>
              <button
                onClick={openCreateModal}
                className="inline-flex items-center gap-2 rounded-xl bg-[#156035] px-4 py-3 text-sm font-bold text-white shadow-[0_8px_20px_rgba(21,96,53,0.18)] hover:bg-[#0f4e2b]"
              >
                <Plus className="h-4 w-4" /> Add Product
              </button>
            </div>
          }
        />
      </div>

      <SectionCard title="All Products" description="Active and inactive products in the catalog" className="mt-8">
        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex gap-1 rounded-xl bg-[#FAF8F5] p-1">
            {(["all", "active", "inactive"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setShowActive(tab)}
                className={`rounded-lg px-3 py-2 text-xs font-bold capitalize ${
                  showActive === tab ? "bg-white text-[#E61C5D] shadow-sm" : "text-zinc-600 hover:text-zinc-900"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search products..."
              className="h-10 w-full sm:w-64 rounded-xl border border-zinc-200 bg-[#FAF8F5] pl-9 pr-3 text-sm outline-none focus:border-rose-300"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-[#FFF8FA] text-[10px] font-bold uppercase tracking-[0.14em] text-zinc-700">
              <tr>
                <th className="px-5 py-3">Product</th>
                <th className="px-5 py-3">SKU</th>
                <th className="px-5 py-3">Base Price</th>
                <th className="px-5 py-3">Min Price</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {filteredProducts.map((p) => (
                <tr key={p.id} className="hover:bg-zinc-50/50">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-[#156035]">
                        <Package className="h-4 w-4" />
                      </div>
                      <span className="font-bold text-zinc-900">{p.name}</span>
                    </div>
                  </td>
                  <td className="px-5 py-4 text-xs text-zinc-500 font-mono">{p.sku || "—"}</td>
                  <td className="px-5 py-4 font-semibold">₹{(p.basePricePaise / 100).toFixed(0)}</td>
                  <td className="px-5 py-4 font-semibold text-amber-700">₹{(p.minimumPricePaise / 100).toFixed(0)}</td>
                  <td className="px-5 py-4">
                    <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${
                      p.active ? "bg-emerald-50 text-[#157347]" : "bg-zinc-100 text-zinc-500"
                    }`}>
                      {p.active ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => openEditModal(p)}
                        title="Edit product"
                        className="rounded-lg p-2 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900"
                      >
                        <Edit3 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleToggle(p)}
                        disabled={togglingId === p.id}
                        title={p.active ? "Deactivate" : "Activate"}
                        className={`rounded-lg p-2 ${
                          p.active
                            ? "text-amber-600 hover:bg-amber-50"
                            : "text-emerald-600 hover:bg-emerald-50"
                        } disabled:opacity-50`}
                      >
                        {togglingId === p.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Power className="h-4 w-4" />}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filteredProducts.length === 0 && (
            <p className="py-14 text-center text-sm text-zinc-500">
              {loading ? "Loading products..." : "No products found."}
            </p>
          )}
        </div>
      </SectionCard>

      {/* Create / Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-xs" onClick={() => setShowModal(false)}>
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between">
              <div>
                <h2 className="font-playfair text-2xl font-bold text-[#156035]">
                  {editingProduct ? "Edit Product" : "New Product"}
                </h2>
                <p className="mt-1 text-xs text-zinc-600">
                  {editingProduct ? "Update product details and pricing" : "Add a new product to the catalog"}
                </p>
              </div>
              <button onClick={() => setShowModal(false)} className="rounded-lg p-2 text-zinc-400 hover:bg-zinc-100">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              {formError && (
                <p className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs font-semibold text-[#B4234D]">{formError}</p>
              )}

              <label className="block text-xs font-bold text-zinc-700">
                Product Name *
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="e.g. FemmeFlo Sanitary Napkins (Pack)"
                  className="mt-1.5 h-11 w-full rounded-xl border border-zinc-200 bg-[#FAF8F5] px-3 text-sm font-semibold outline-none focus:border-rose-300"
                />
              </label>

              <div>
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-zinc-700">SKU (optional)</label>
                  <button
                    type="button"
                    onClick={generateSkuFromName}
                    className="inline-flex items-center gap-1 text-[11px] font-bold text-[#E61C5D] transition hover:text-[#c91550] hover:underline"
                  >
                    <Sparkles className="h-3 w-3" />
                    Auto-generate
                  </button>
                </div>
                <div className="relative mt-1.5 flex items-center">
                  <input
                    type="text"
                    value={formSku}
                    onChange={(e) => setFormSku(e.target.value.toUpperCase())}
                    placeholder="e.g. FF-SNP-001"
                    className="h-11 w-full rounded-xl border border-zinc-200 bg-[#FAF8F5] pl-3 pr-24 text-sm font-semibold uppercase outline-none transition focus:border-rose-300 focus:bg-white focus:ring-2 focus:ring-rose-100"
                  />
                  <button
                    type="button"
                    onClick={generateSkuFromName}
                    className="absolute right-1.5 top-1.5 bottom-1.5 flex items-center gap-1 rounded-lg bg-rose-50 px-2.5 text-[11px] font-bold text-[#E61C5D] transition hover:bg-rose-100"
                  >
                    <Sparkles className="h-3 w-3" />
                    <span>Generate</span>
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <label className="block text-xs font-bold text-zinc-700">
                  Base Price (₹) *
                  <input
                    type="number"
                    min="1"
                    step="1"
                    required
                    value={formBasePrice}
                    onChange={(e) => setFormBasePrice(e.target.value === "" ? "" : Number(e.target.value))}
                    placeholder="25"
                    className="mt-1.5 h-11 w-full rounded-xl border border-zinc-200 bg-[#FAF8F5] px-3 text-sm font-semibold outline-none focus:border-rose-300"
                  />
                </label>
                <label className="block text-xs font-bold text-zinc-700">
                  Minimum Price (₹) *
                  <input
                    type="number"
                    min="1"
                    step="1"
                    required
                    value={formMinPrice}
                    onChange={(e) => setFormMinPrice(e.target.value === "" ? "" : Number(e.target.value))}
                    placeholder="20"
                    className="mt-1.5 h-11 w-full rounded-xl border border-zinc-200 bg-[#FAF8F5] px-3 text-sm font-semibold outline-none focus:border-rose-300"
                  />
                </label>
              </div>
              <p className="text-[11px] text-zinc-500">
                Sales below the minimum price require Super Admin approval before stock is deducted.
              </p>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="h-10 rounded-xl px-4 text-xs font-bold text-zinc-600 hover:bg-zinc-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formSubmitting}
                  className="inline-flex h-10 items-center gap-2 rounded-xl bg-[#156035] px-5 text-xs font-bold text-white hover:bg-[#0f4e2b] disabled:opacity-50"
                >
                  {formSubmitting ? (
                    <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Saving...</>
                  ) : editingProduct ? (
                    "Update Product"
                  ) : (
                    "Create Product"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {notice && (
        <div className="fixed bottom-6 right-6 z-60 rounded-xl bg-[#156035] px-4 py-3 text-sm font-bold text-white shadow-xl">
          {notice}
        </div>
      )}
    </DashboardShell>
  );
}
