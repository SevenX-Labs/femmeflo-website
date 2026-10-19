"use client";

import { useEffect, useState } from "react";
import { AlertCircle, Check, Edit2, Loader2, Plus, RefreshCw, Tags, Trash2, X } from "lucide-react";
import { DashboardShell, PageHeading, SectionCard } from "@/components/management/DashboardShell";
import { adminNavigation } from "@/components/management/navigation";
import { categoryApi } from "@/lib/api/categories";
import type { Category } from "@/lib/api/types";
import { ApiError } from "@/lib/api/client";

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [value, setValue] = useState("");
  const [message, setMessage] = useState("");
  const [errorDialog, setErrorDialog] = useState<{ title: string; message: string } | null>(null);
  const [deleteConfirmCat, setDeleteConfirmCat] = useState<Category | null>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Edit state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [isEditing, setIsEditing] = useState(false);

  // Delete state
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const getFriendlyErrorMessage = (err: unknown, defaultMsg: string): string => {
    if (err instanceof ApiError) {
      const msg = err.message || "";
      if (err.statusCode === 401) {
        return "Your session has expired. Please log in again.";
      }
      if (err.statusCode === 403) {
        return "You do not have permission to perform this action.";
      }
      if (err.statusCode === 409) {
        return "A category with this name already exists.";
      }
      const cleaned = msg.replace(/^Error:\s*/i, "").replace(/\{.*?\}/g, "").trim();
      return cleaned || defaultMsg;
    }
    return defaultMsg;
  };

  const loadCategories = async () => {
    setLoading(true);
    setErrorMessage("");
    try {
      const res = await categoryApi.listCategories();
      setCategories(res.categories);
    } catch (err: unknown) {
      setCategories([]);
      setErrorMessage(err instanceof Error ? err.message : "Unable to load categories.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCategories();
  }, []);

  const add = async () => {
    const name = value.trim();
    if (!name) return;
    if (categories.some((x) => x.name.toLowerCase() === name.toLowerCase())) {
      setErrorMessage("Category already exists.");
      return;
    }

    setErrorMessage("");
    setIsSubmitting(true);
    try {
      const res = await categoryApi.createCategory({ name });
      setCategories((prev) => [...prev, res.category]);
      setValue("");
      setMessage(`"${name}" added to customer categories.`);
      setTimeout(() => setMessage(""), 3500);
    } catch (err: unknown) {
      const friendlyMsg = getFriendlyErrorMessage(err, "Failed to create category. Please try again.");
      setErrorMessage(friendlyMsg);
      setErrorDialog({
        title: "Could Not Add Category",
        message: friendlyMsg,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const startEdit = (c: Category) => {
    setEditingId(c.id);
    setEditName(c.name);
    setErrorMessage("");
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditName("");
  };

  const saveEdit = async (id: string) => {
    const trimmed = editName.trim();
    if (!trimmed) {
      setErrorMessage("Category name cannot be empty.");
      return;
    }

    const currentCat = categories.find((c) => c.id === id);
    if (currentCat && currentCat.name.toLowerCase() === trimmed.toLowerCase()) {
      setEditingId(null);
      return;
    }

    if (categories.some((c) => c.id !== id && c.name.toLowerCase() === trimmed.toLowerCase())) {
      setErrorMessage("Another category with this name already exists.");
      return;
    }

    setIsEditing(true);
    setErrorMessage("");
    try {
      const res = await categoryApi.updateCategory(id, { name: trimmed });
      setCategories((prev) => prev.map((c) => (c.id === id ? res.category : c)));
      setEditingId(null);
      setEditName("");
      setMessage(`Category updated to "${res.category.name}".`);
      setTimeout(() => setMessage(""), 3500);
    } catch (err: unknown) {
      const friendlyMsg = getFriendlyErrorMessage(err, "Failed to update category. Please try again.");
      setErrorMessage(friendlyMsg);
      setErrorDialog({
        title: "Could Not Update Category",
        message: friendlyMsg,
      });
    } finally {
      setIsEditing(false);
    }
  };

  const confirmDeleteCategory = async () => {
    if (!deleteConfirmCat) return;
    const cat = deleteConfirmCat;
    setDeletingId(cat.id);
    setDeleteConfirmCat(null);
    setErrorMessage("");
    try {
      await categoryApi.deleteCategory(cat.id);
      setCategories((prev) => prev.filter((c) => c.id !== cat.id));
      setMessage(`Category "${cat.name}" removed successfully.`);
      setTimeout(() => setMessage(""), 3500);
    } catch (err: unknown) {
      const friendlyMsg = getFriendlyErrorMessage(err, `Unable to delete "${cat.name}". Please try again.`);
      setErrorMessage(friendlyMsg);
      setErrorDialog({
        title: "Category Deletion Notice",
        message: friendlyMsg,
      });
    } finally {
      setDeletingId(null);
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
      <PageHeading
        eyebrow="Configuration"
        title="Customer categories"
        description="Maintain the customer category taxonomy available when regional Managers and field Sellers onboard customer retail accounts."
        action={
          <button
            onClick={loadCategories}
            disabled={loading}
            title="Refresh categories"
            className="flex h-11 w-11 items-center justify-center rounded-xl border border-zinc-200 bg-white text-zinc-900 transition hover:border-rose-200 hover:text-[#E61C5D] disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin text-[#E61C5D]" : ""}`} />
          </button>
        }
      />

      <div className="mt-8 grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
        <SectionCard
          title="Add a category"
          description="New categories immediately become available in customer onboarding forms"
        >
          <div className="flex gap-2">
            <input
              value={value}
              onChange={(e) => setValue(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), add())}
              placeholder="e.g. Cosmetic retail"
              className="h-11 min-w-0 flex-1 rounded-xl border border-zinc-200 bg-[#FAF8F5] px-3 text-sm outline-none focus:border-rose-300 focus:ring-2 focus:ring-rose-100"
            />
            <button
              onClick={add}
              disabled={isSubmitting}
              className="inline-flex items-center gap-2 rounded-xl bg-[#E61C5D] px-4 text-sm font-bold text-white shadow-sm hover:bg-[#c91550] disabled:opacity-70 transition"
            >
              {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              Add
            </button>
          </div>

          {errorMessage && <p className="mt-3 text-xs font-semibold text-[#B4234D]">{errorMessage}</p>}
          {message && <p className="mt-3 text-xs font-semibold text-emerald-700">{message}</p>}
        </SectionCard>

        <SectionCard
          title="Active categories"
          description={`${categories.length} registered business categories`}
        >
          {loading ? (
            <div className="py-8 text-center text-zinc-700">
              <Loader2 className="mx-auto h-6 w-6 animate-spin text-[#E61C5D]" />
              <p className="mt-2 text-xs">Loading categories...</p>
            </div>
          ) : categories.length === 0 ? (
            <p className="py-6 text-center text-xs text-zinc-500">No categories found.</p>
          ) : (
            <div className="space-y-2">
              {categories.map((c) => {
                const isItemEditing = editingId === c.id;
                const isItemDeleting = deletingId === c.id;

                return (
                  <div
                    key={c.id}
                    className="flex items-center justify-between gap-3 rounded-xl border border-zinc-100 p-3 transition hover:bg-[#FFFDFD] hover:border-zinc-200"
                  >
                    {isItemEditing ? (
                      <div className="flex flex-1 items-center gap-2">
                        <input
                          type="text"
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              saveEdit(c.id);
                            } else if (e.key === "Escape") {
                              e.preventDefault();
                              cancelEdit();
                            }
                          }}
                          autoFocus
                          disabled={isEditing}
                          className="h-9 min-w-0 flex-1 rounded-lg border border-rose-300 bg-white px-3 text-sm font-semibold text-zinc-800 outline-none focus:ring-2 focus:ring-rose-100"
                        />
                        <button
                          type="button"
                          onClick={() => saveEdit(c.id)}
                          disabled={isEditing}
                          title="Save"
                          className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50 transition"
                        >
                          {isEditing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                        </button>
                        <button
                          type="button"
                          onClick={cancelEdit}
                          disabled={isEditing}
                          title="Cancel"
                          className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-zinc-200 bg-white text-zinc-600 hover:bg-zinc-100 disabled:opacity-50 transition"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ) : (
                      <>
                        <span className="flex items-center gap-3 text-sm font-semibold text-zinc-800">
                          <span className="rounded-lg bg-rose-50 p-2 text-[#E61C5D]">
                            <Tags className="h-4 w-4" />
                          </span>
                          {c.name}
                        </span>

                        <div className="flex items-center gap-2">
                          <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-bold text-emerald-700">
                            Active
                          </span>
                          <button
                            type="button"
                            onClick={() => startEdit(c)}
                            title="Edit category"
                            className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-zinc-200 text-zinc-600 transition hover:border-zinc-300 hover:bg-zinc-50 hover:text-zinc-900"
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeleteConfirmCat(c)}
                            disabled={isItemDeleting}
                            title="Delete category"
                            className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-zinc-200 text-zinc-600 transition hover:border-rose-200 hover:bg-rose-50 hover:text-[#B4234D] disabled:opacity-50"
                          >
                            {isItemDeleting ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin text-[#B4234D]" />
                            ) : (
                              <Trash2 className="h-3.5 w-3.5" />
                            )}
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </SectionCard>
      </div>
      {/* Confirmation Dialog for Category Deletion */}
      {deleteConfirmCat && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={() => setDeleteConfirmCat(null)}
        >
          <div
            className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl ring-1 ring-black/10 transform transition-all animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start gap-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-rose-100 text-[#E61C5D]">
                <Trash2 className="h-5 w-5" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-base font-bold text-zinc-900">Delete Category?</h3>
                <p className="mt-1 text-xs leading-relaxed text-zinc-600">
                  Are you sure you want to delete <span className="font-bold text-zinc-800">"{deleteConfirmCat.name}"</span>?
                </p>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setDeleteConfirmCat(null)}
                className="rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDeleteCategory}
                className="rounded-xl bg-[#E61C5D] px-4 py-2.5 text-xs font-bold text-white shadow-md hover:bg-[#c91550] transition focus:outline-none focus:ring-2 focus:ring-[#E61C5D] focus:ring-offset-2"
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Clean User-Friendly Error Dialog */}
      {errorDialog && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={() => setErrorDialog(null)}
        >
          <div
            className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl ring-1 ring-black/10 transform transition-all animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start gap-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-rose-100 text-[#E61C5D]">
                <AlertCircle className="h-5 w-5" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-base font-bold text-zinc-900">{errorDialog.title}</h3>
                <p className="mt-1 text-xs leading-relaxed text-zinc-600">{errorDialog.message}</p>
              </div>
              <button
                type="button"
                onClick={() => setErrorDialog(null)}
                className="rounded-lg p-1 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 transition"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                type="button"
                onClick={() => setErrorDialog(null)}
                className="w-full rounded-xl bg-[#E61C5D] px-4 py-2.5 text-xs font-bold text-white shadow-md hover:bg-[#c91550] transition"
              >
                Okay
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardShell>
  );
}
