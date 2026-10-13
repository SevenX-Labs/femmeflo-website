"use client";

import { useEffect, useState } from "react";
import { Loader2, Plus, RefreshCw, Tags, X } from "lucide-react";
import { DashboardShell, PageHeading, SectionCard } from "@/components/management/DashboardShell";
import { adminNavigation } from "@/components/management/navigation";
import { categoryApi } from "@/lib/api/categories";
import type { Category } from "@/lib/api/types";
import { ApiError } from "@/lib/api/client";

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [value, setValue] = useState("");
  const [message, setMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

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
      const res = await categoryApi.createCategory({ name, active: true });
      setCategories([...categories, res.category]);
      setValue("");
      setMessage(`${name} added to customer categories.`);
      setTimeout(() => setMessage(""), 3000);
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        setErrorMessage(err.message || "Failed to create category.");
      }
    } finally {
      setIsSubmitting(false);
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
            className="flex h-11 w-11 items-center justify-center rounded-xl border border-zinc-200 bg-white text-zinc-600 transition hover:border-rose-200 hover:text-[#E61C5D] disabled:opacity-50"
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
              className="inline-flex items-center gap-2 rounded-xl bg-[#E61C5D] px-4 text-sm font-bold text-white shadow-sm hover:bg-[#c91550] disabled:opacity-70"
            >
              {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              Add
            </button>
          </div>

          {errorMessage && <p className="mt-3 text-xs font-semibold text-[#B4234D]">{errorMessage}</p>}
          {message && <p className="mt-3 text-xs font-semibold text-emerald-700">{message}</p>}
          <p className="mt-4 text-xs text-zinc-400">Endpoint: POST /api/v1/admin/categories</p>
        </SectionCard>

        <SectionCard
          title="Active categories"
          description={`${categories.length} registered business categories`}
        >
          {loading ? (
            <div className="py-8 text-center text-zinc-400">
              <Loader2 className="mx-auto h-6 w-6 animate-spin text-[#E61C5D]" />
              <p className="mt-2 text-xs">Loading categories...</p>
            </div>
          ) : (
            <div className="space-y-2">
              {categories.map((c) => (
                <div
                  key={c.id}
                  className="flex items-center justify-between rounded-xl border border-zinc-100 p-3 hover:bg-[#FFFDFD]"
                >
                  <span className="flex items-center gap-3 text-sm font-semibold text-zinc-800">
                    <span className="rounded-lg bg-rose-50 p-2 text-[#E61C5D]">
                      <Tags className="h-4 w-4" />
                    </span>
                    {c.name}
                  </span>
                  <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-bold text-emerald-700">
                    Active
                  </span>
                </div>
              ))}
            </div>
          )}
        </SectionCard>
      </div>
    </DashboardShell>
  );
}
