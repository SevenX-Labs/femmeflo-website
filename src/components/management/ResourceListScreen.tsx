"use client";

import { Loader2, RefreshCw, Search, SlidersHorizontal, X } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { DashboardShell, NavigationItem, PageHeading, SectionCard } from "./DashboardShell";

export type ResourceRow = Record<string, string | number | boolean | undefined | null> & {
  id?: string;
  status?: string;
};

type ResourceListScreenProps = {
  role: "Super Admin" | "Manager" | "Seller";
  workspace: string;
  userName: string;
  userDetail: string;
  navigation: NavigationItem[];
  eyebrow: string;
  title: string;
  description: string;
  primaryAction: string;
  primaryHref?: string;
  searchPlaceholder: string;
  columns: { key: string; label: string }[];
  rows?: ResourceRow[];
  fetchData?: () => Promise<ResourceRow[]>;
  onRefresh?: () => void;
};

const EMPTY_ROWS: ResourceRow[] = [];

export function ResourceListScreen({
  role,
  workspace,
  userName,
  userDetail,
  navigation,
  eyebrow,
  title,
  description,
  primaryAction,
  primaryHref,
  searchPlaceholder,
  columns,
  rows: initialRows = EMPTY_ROWS,
  fetchData,
}: ResourceListScreenProps) {
  const [dataRows, setDataRows] = useState<ResourceRow[]>(fetchData ? [] : initialRows);
  const [isLoading, setIsLoading] = useState<boolean>(Boolean(fetchData));
  const [fetchError, setFetchError] = useState<string | null>(null);

  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("All status");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [selectedRow, setSelectedRow] = useState<ResourceRow | null>(null);
  const [locationQuery, setLocationQuery] = useState("");
  const [categoryQuery, setCategoryQuery] = useState("");
  const [dateRange, setDateRange] = useState("All time");

  const loadData = useCallback(async () => {
    if (!fetchData) return;
    setIsLoading(true);
    setFetchError(null);
    try {
      const result = await fetchData();
      setDataRows(result);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to load data";
      setFetchError(msg);
      setDataRows([]);
    } finally {
      setIsLoading(false);
    }
  }, [fetchData]);

  useEffect(() => {
    if (fetchData) {
      loadData();
    }
  }, [fetchData, loadData]);

  useEffect(() => {
    if (!fetchData) {
      setDataRows(initialRows);
    }
  }, [fetchData, initialRows]);

  const filteredRows = useMemo(() => {
    return dataRows.filter((row) => {
      const searchable = Object.values(row).join(" ").toLowerCase();
      const date = String(row.date ?? "");
      const matchesRange =
        dateRange === "All time" ||
        (dateRange === "This month" ? !date.toLowerCase().includes("sep") : date.toLowerCase().includes("sep"));

      return (
        searchable.includes(query.toLowerCase()) &&
        (status === "All status" || String(row.status) === status) &&
        (!locationQuery || Object.values(row).join(" ").toLowerCase().includes(locationQuery.toLowerCase())) &&
        (!categoryQuery || String(row.category ?? "").toLowerCase().includes(categoryQuery.toLowerCase())) &&
        matchesRange
      );
    });
  }, [dataRows, query, status, locationQuery, categoryQuery, dateRange]);

  const exportRows = () => {
    const csv = [
      columns.map((column) => column.label).join(","),
      ...filteredRows.map((row) =>
        columns
          .map((column) => `"${String(row[column.key] ?? "").replaceAll('"', '""')}"`)
          .join(",")
      ),
    ].join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = `${title.toLowerCase().replaceAll(" ", "-")}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <DashboardShell
      role={role}
      workspace={workspace}
      userName={userName}
      userDetail={userDetail}
      navigation={navigation}
    >
      <PageHeading
        eyebrow={eyebrow}
        title={title}
        description={description}
        action={
          <div className="flex items-center gap-3">
            {fetchData && (
              <button
                onClick={loadData}
                disabled={isLoading}
                title="Refresh live data"
                className="flex h-11 w-11 items-center justify-center rounded-xl border border-zinc-200 bg-white text-zinc-600 transition hover:border-rose-200 hover:text-[#E61C5D] disabled:opacity-50"
              >
                <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin text-[#E61C5D]" : ""}`} />
              </button>
            )}
            {primaryHref ? (
              <Link
                href={primaryHref}
                className="rounded-xl bg-[#E61C5D] px-4 py-3 text-sm font-bold text-white shadow-[0_8px_20px_rgba(230,28,93,0.18)] hover:bg-[#c91550]"
              >
                + {primaryAction}
              </Link>
            ) : primaryAction.toLowerCase().includes("export") ? (
              <button
                onClick={exportRows}
                className="rounded-xl bg-[#E61C5D] px-4 py-3 text-sm font-bold text-white shadow-[0_8px_20px_rgba(230,28,93,0.18)] hover:bg-[#c91550]"
              >
                {primaryAction}
              </button>
            ) : (
              <button
                onClick={() => setFiltersOpen(true)}
                className="rounded-xl bg-[#E61C5D] px-4 py-3 text-sm font-bold text-white shadow-[0_8px_20px_rgba(230,28,93,0.18)] hover:bg-[#c91550]"
              >
                {primaryAction}
              </button>
            )}
          </div>
        }
      />

      {fetchError && (
        <div className="mt-6 flex items-center justify-between rounded-xl border border-amber-200 bg-amber-50 p-4 text-xs font-semibold text-amber-800">
          <span>Unable to load live records. ({fetchError})</span>
          <button onClick={loadData} className="underline hover:text-amber-950 font-bold">Retry</button>
        </div>
      )}

      <SectionCard
        title={`${title} directory`}
        description={`${filteredRows.length} records in your current scope`}
        className="mt-8"
        action={
          <button
            onClick={() => setFiltersOpen(!filtersOpen)}
            className={`inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-xs font-bold ${
              filtersOpen
                ? "border-rose-200 bg-rose-50 text-[#E61C5D]"
                : "border-zinc-200 text-zinc-600 hover:border-rose-200"
            }`}
          >
            <SlidersHorizontal className="h-3.5 w-3.5" />
            Filters
          </button>
        }
      >
        <div className="mb-5 flex flex-col gap-3 sm:flex-row">
          <label className="relative block flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={searchPlaceholder}
              className="h-10 w-full rounded-xl border border-zinc-200 bg-[#FAF8F5] pl-9 pr-3 text-sm outline-none focus:border-rose-300 focus:ring-2 focus:ring-rose-100"
            />
          </label>
          {title === "My sales" && (
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="h-10 rounded-xl border border-zinc-200 bg-[#FAF8F5] px-3 text-sm font-semibold text-zinc-600"
              aria-label="Filter sales by date"
            >
              <option>All time</option>
              <option>This month</option>
              <option>Last month</option>
            </select>
          )}
          <select
            value={status}
            onChange={(event) => setStatus(event.target.value)}
            className="h-10 rounded-xl border border-zinc-200 bg-[#FAF8F5] px-3 text-sm font-semibold text-zinc-600 outline-none focus:border-rose-300"
            aria-label="Filter by status"
          >
            <option>All status</option>
            <option>Active</option>
            <option>Pending</option>
            <option>Inactive</option>
            <option>Confirmed</option>
            <option>Approval required</option>
            <option>Paid</option>
            <option>Pending payment</option>
          </select>
        </div>

        {filtersOpen && (
          <div className="mb-5 grid gap-3 rounded-xl border border-rose-100 bg-[#FFF8FA] p-4 sm:grid-cols-3">
            <label className="text-[11px] font-bold text-zinc-600">
              State / district / village
              <input
                value={locationQuery}
                onChange={(e) => setLocationQuery(e.target.value)}
                placeholder="Search location"
                className="mt-1.5 h-9 w-full rounded-lg border border-zinc-200 bg-white px-3 text-xs font-normal"
              />
            </label>
            <label className="text-[11px] font-bold text-zinc-600">
              Category
              <input
                value={categoryQuery}
                onChange={(e) => setCategoryQuery(e.target.value)}
                placeholder="Any category"
                className="mt-1.5 h-9 w-full rounded-lg border border-zinc-200 bg-white px-3 text-xs font-normal"
              />
            </label>
            <button
              onClick={() => {
                setLocationQuery("");
                setCategoryQuery("");
                setStatus("All status");
              }}
              className="self-end rounded-lg border border-zinc-200 bg-white px-3 py-2 text-xs font-bold text-zinc-600"
            >
              Clear filters
            </button>
          </div>
        )}

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-16 text-zinc-400">
            <Loader2 className="h-8 w-8 animate-spin text-[#E61C5D]" />
            <p className="mt-3 text-xs font-semibold">Loading data from backend...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-180 text-left">
              <thead className="bg-[#FFF8FA] text-[10px] font-bold uppercase tracking-[0.14em] text-zinc-400">
                <tr>
                  {columns.map((column) => (
                    <th key={column.key} className="px-4 py-4">
                      {column.label}
                    </th>
                  ))}
                  <th className="px-4 py-4">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {filteredRows.map((row, index) => (
                  <tr key={`${String(row[columns[0].key])}-${index}`} className="hover:bg-[#FFFDFD]">
                    {columns.map((column) => (
                      <td
                        key={column.key}
                        className={`px-4 py-4 text-sm ${
                          column.key === "status"
                            ? ""
                            : column.key === columns[0].key
                            ? "font-bold text-zinc-800"
                            : "text-zinc-500"
                        }`}
                      >
                        {column.key === "status" ? (
                          <span
                            className={`rounded-full px-2.5 py-1 text-xs font-bold ${
                              row.status === "Active" || row.status === "Confirmed" || row.status === "Paid"
                                ? "bg-emerald-50 text-[#157347]"
                                : row.status === "Pending" ||
                                  row.status === "Pending payment" ||
                                  row.status === "Approval required"
                                ? "bg-amber-50 text-amber-700"
                                : "bg-zinc-100 text-zinc-500"
                            }`}
                          >
                            {String(row[column.key])}
                          </span>
                        ) : (
                          String(row[column.key] ?? "—")
                        )}
                      </td>
                    ))}
                    <td className="px-4 py-4">
                      <button
                        onClick={() => setSelectedRow(row)}
                        className="text-xs font-bold text-[#E61C5D] hover:underline"
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredRows.length === 0 && (
              <p className="py-12 text-center text-sm text-zinc-500">No records match your filters.</p>
            )}
          </div>
        )}
      </SectionCard>

      {selectedRow && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-900/35 px-4"
          onClick={() => setSelectedRow(null)}
        >
          <section
            role="dialog"
            aria-modal="true"
            className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#E61C5D]">Record details</p>
                <h2 className="mt-2 font-playfair text-3xl font-bold text-[#156035]">
                  {String(selectedRow[columns[0].key] ?? "Item")}
                </h2>
              </div>
              <button
                onClick={() => setSelectedRow(null)}
                aria-label="Close details"
                className="rounded-lg p-2 text-zinc-400 hover:bg-rose-50"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="mt-5 divide-y divide-zinc-100">
              {columns.map((col) => (
                <div key={col.key} className="flex justify-between gap-4 py-3 text-sm">
                  <span className="text-zinc-500">{col.label}</span>
                  <strong className="text-right text-zinc-800">
                    {String(selectedRow[col.key] ?? "—")}
                  </strong>
                </div>
              ))}
            </div>
            <button
              onClick={() => setSelectedRow(null)}
              className="mt-5 w-full rounded-xl bg-[#156035] py-3 text-sm font-bold text-white hover:bg-[#0f4e2b]"
            >
              Done
            </button>
          </section>
        </div>
      )}
    </DashboardShell>
  );
}
