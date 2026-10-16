"use client";

import { CustomerDetailModal } from "./CustomerDetailModal";

import { Camera, CheckCircle2, Download, Eye, ExternalLink, FileText, Image as ImageIcon, Loader2, MapPin, RefreshCw, Search, SlidersHorizontal, Upload, X } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { DashboardShell, NavigationItem, PageHeading, SectionCard } from "./DashboardShell";
import { adminApi } from "@/lib/api/admin";
import { managerApi } from "@/lib/api/manager";
import { sellerApi } from "@/lib/api/seller";

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
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [photoUploadMessage, setPhotoUploadMessage] = useState<string | null>(null);
  const [pdfLoadingId, setPdfLoadingId] = useState<string | null>(null);
  const [pdfError, setPdfError] = useState<string | null>(null);

  const getDirectPdfUrl = (invoiceId: string, download = false) => {
    if (role === "Super Admin") {
      return adminApi.getInvoicePdfUrl(invoiceId, download);
    } else if (role === "Manager") {
      return managerApi.getInvoicePdfUrl(invoiceId, download);
    } else {
      return sellerApi.getInvoicePdfUrl(invoiceId, download);
    }
  };

  const handleInvoicePdf = async (
    invoiceId: string,
    invoiceNumber?: string,
    mode: "view" | "download" = "view"
  ) => {
    const actionKey = `${invoiceId}-${mode}`;
    setPdfLoadingId(actionKey);
    setPdfError(null);
    try {
      let blob: Blob;
      if (role === "Super Admin") {
        blob = await adminApi.downloadInvoicePdf(invoiceId, mode === "download");
      } else if (role === "Manager") {
        blob = await managerApi.downloadInvoicePdf(invoiceId, mode === "download");
      } else {
        blob = await sellerApi.downloadInvoicePdf(invoiceId, mode === "download");
      }

      const blobUrl = URL.createObjectURL(blob);
      if (mode === "view") {
        const win = window.open(blobUrl, "_blank");
        if (!win) {
          const a = document.createElement("a");
          a.href = blobUrl;
          a.target = "_blank";
          a.rel = "noopener noreferrer";
          a.click();
        }
      } else {
        const a = document.createElement("a");
        a.href = blobUrl;
        a.download = `Invoice-${invoiceNumber || invoiceId}.pdf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setTimeout(() => URL.revokeObjectURL(blobUrl), 10000);
      }
    } catch (err: unknown) {
      console.error("PDF action error:", err);
      try {
        const directUrl = getDirectPdfUrl(invoiceId, mode === "download");
        window.open(directUrl, "_blank");
      } catch {
        setPdfError("Unable to open or download invoice PDF. Please try again.");
      }
    } finally {
      setPdfLoadingId(null);
    }
  };

  const getRowInvoice = (row: ResourceRow | null | undefined) => {
    if (!row) return null;
    const invoiceId =
      (row.invoiceId as string) ||
      (row.pdfPath ? (row.id as string) : undefined) ||
      (title.toLowerCase().includes("invoice") ? (row.id as string) : undefined);
    if (!invoiceId) return null;
    const invoiceNumber =
      (row.invoiceNumber as string) ||
      (row.invoice as string) ||
      (row.number as string) ||
      invoiceId;
    return { invoiceId, invoiceNumber };
  };

  const handleModalPhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>, customerId: string) => {
    const file = e.target.files?.[0];
    if (!file || !customerId) return;

    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      setPhotoUploadMessage("Please select a JPEG, PNG, or WebP image.");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setPhotoUploadMessage("Image size exceeds 5 MB limit.");
      return;
    }

    setIsUploadingPhoto(true);
    setPhotoUploadMessage(null);
    try {
      let res: { photoUrl: string; customer: unknown };
      if (role === "Super Admin") {
        res = await adminApi.uploadCustomerPhoto(customerId, file);
      } else if (role === "Manager") {
        res = await managerApi.uploadCustomerPhoto(customerId, file);
      } else {
        res = await sellerApi.uploadCustomerPhoto(customerId, file);
      }

      if (res?.photoUrl) {
        setSelectedRow((prev) => (prev ? { ...prev, photoPath: res.photoUrl } : null));
        setDataRows((prev) =>
          prev.map((r) => (r.id === customerId ? { ...r, photoPath: res.photoUrl } : r))
        );
        setPhotoUploadMessage("Storefront photo successfully saved!");
      }
    } catch (err) {
      console.error("Modal photo upload error:", err);
      setPhotoUploadMessage("Failed to upload photo. Please check network connection.");
    } finally {
      setIsUploadingPhoto(false);
    }
  };

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
                className="flex h-11 w-11 items-center justify-center rounded-xl border border-zinc-200 bg-white text-zinc-900 transition hover:border-rose-200 hover:text-[#E61C5D] disabled:opacity-50"
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
                : "border-zinc-200 text-zinc-900 hover:border-rose-200"
            }`}
          >
            <SlidersHorizontal className="h-3.5 w-3.5" />
            Filters
          </button>
        }
      >
        <div className="mb-5 flex flex-col gap-2.5 sm:flex-row sm:items-center">
          <label className="relative block flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-700" />
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
              className="h-10 rounded-xl border border-zinc-200 bg-[#FAF8F5] px-3 text-sm font-semibold text-zinc-900"
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
            className="h-10 rounded-xl border border-zinc-200 bg-[#FAF8F5] px-3 text-sm font-semibold text-zinc-900 outline-none focus:border-rose-300"
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
            <label className="text-[11px] font-bold text-zinc-900">
              State / district / village
              <input
                value={locationQuery}
                onChange={(e) => setLocationQuery(e.target.value)}
                placeholder="Search location"
                className="mt-1.5 h-9 w-full rounded-lg border border-zinc-200 bg-white px-3 text-xs font-normal"
              />
            </label>
            <label className="text-[11px] font-bold text-zinc-900">
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
              className="self-end rounded-lg border border-zinc-200 bg-white px-3 py-2 text-xs font-bold text-zinc-900"
            >
              Clear filters
            </button>
          </div>
        )}

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-16 text-zinc-700">
            <Loader2 className="h-8 w-8 animate-spin text-[#E61C5D]" />
            <p className="mt-3 text-xs font-semibold">Loading data from backend...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-full sm:min-w-160 text-left">
              <thead className="bg-[#FFF8FA] text-[10px] font-bold uppercase tracking-[0.14em] text-zinc-700">
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
                            : "text-zinc-800"
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
                                : "bg-zinc-100 text-zinc-800"
                            }`}
                          >
                            {String(row[column.key])}
                          </span>
                        ) : column.key === columns[0].key ? (
                          <div className="flex items-center gap-3">
                            {row.photoPath ? (
                              <div className="relative h-9 w-9 shrink-0 overflow-hidden rounded-lg border border-rose-100 bg-[#FAF8F5] shadow-xs">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                  src={String(row.photoPath)}
                                  alt=""
                                  className="h-full w-full object-cover"
                                />
                              </div>
                            ) : null}
                            <span className="font-bold text-zinc-800">{String(row[column.key] ?? "—")}</span>
                          </div>
                        ) : (column.key === "location" || column.key === "village" || column.key === "address") && row.latitude && row.longitude ? (
                          <div className="flex flex-col gap-0.5">
                            <span>{String(row[column.key] ?? "—")}</span>
                            <a
                              href={`https://www.google.com/maps?q=${row.latitude},${row.longitude}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-600 hover:underline"
                            >
                              <MapPin className="h-3 w-3 shrink-0" />
                              <span>View Map</span>
                            </a>
                          </div>
                        ) : (
                          String(row[column.key] ?? "—")
                        )}
                      </td>
                    ))}
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            setPhotoUploadMessage(null);
                            setPdfError(null);
                            setSelectedRow(row);
                          }}
                          className="text-xs font-bold text-[#E61C5D] hover:underline"
                        >
                          View
                        </button>
                        {(() => {
                          const inv = getRowInvoice(row);
                          if (!inv) return null;
                          const isViewLoading = pdfLoadingId === `${inv.invoiceId}-view`;
                          const isDlLoading = pdfLoadingId === `${inv.invoiceId}-download`;
                          return (
                            <>
                              <span className="text-zinc-200">|</span>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleInvoicePdf(inv.invoiceId, inv.invoiceNumber, "view");
                                }}
                                disabled={Boolean(pdfLoadingId)}
                                title="View Tax Invoice PDF in new tab"
                                className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-bold text-emerald-800 hover:bg-emerald-50 transition disabled:opacity-50"
                              >
                                {isViewLoading ? (
                                  <Loader2 className="h-3 w-3 animate-spin text-emerald-700" />
                                ) : (
                                  <Eye className="h-3 w-3 text-emerald-700" />
                                )}
                                PDF
                              </button>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleInvoicePdf(inv.invoiceId, inv.invoiceNumber, "download");
                                }}
                                disabled={Boolean(pdfLoadingId)}
                                title="Download Tax Invoice PDF"
                                className="inline-flex items-center rounded-md p-1 text-zinc-800 hover:bg-zinc-100 hover:text-zinc-800 transition disabled:opacity-50"
                              >
                                {isDlLoading ? (
                                  <Loader2 className="h-3 w-3 animate-spin text-[#E61C5D]" />
                                ) : (
                                  <Download className="h-3.5 w-3.5" />
                                )}
                              </button>
                            </>
                          );
                        })()}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredRows.length === 0 && (
              <p className="py-12 text-center text-sm text-zinc-800">No records match your filters.</p>
            )}
          </div>
        )}
      </SectionCard>

      {selectedRow && (
        (eyebrow.toLowerCase().includes("customer") || title.toLowerCase().includes("customer")) ? (
          <CustomerDetailModal
            role={role}
            customerId={String(selectedRow.id)}
            onClose={() => setSelectedRow(null)}
            onCustomerUpdated={(updated) => {
              setDataRows((prev) =>
                prev.map((r) =>
                  r.id === updated.id
                    ? {
                        ...r,
                        name: updated.shopName,
                        contact: updated.contactName,
                        phone: updated.phone || "—",
                        photoPath: updated.photoPath,
                        status: updated.active ? "Active" : "Inactive",
                      }
                    : r
                )
              );
            }}
          />
        ) : (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-900/35 px-4"
          onClick={() => setSelectedRow(null)}
        >
          <section
            role="dialog"
            aria-modal="true"
            data-lenis-prevent
            className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl max-h-[90vh] overflow-y-auto overscroll-contain"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#E61C5D]">Record details</p>
                <h2 className="mt-2 font-playfair text-3xl font-bold text-[#156035]">
                  {String(selectedRow[columns[0].key] ?? "Item")}
                </h2>
                {selectedRow.address ? (
                  <p className="mt-1 text-xs text-zinc-900 leading-relaxed">
                    {String(selectedRow.address)}
                  </p>
                ) : null}
              </div>
              <button
                onClick={() => setSelectedRow(null)}
                aria-label="Close details"
                className="rounded-lg p-2 text-zinc-700 hover:bg-rose-50"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Invoice PDF Action Card */}
            {(() => {
              const inv = getRowInvoice(selectedRow);
              if (!inv) return null;
              const isViewLoading = pdfLoadingId === `${inv.invoiceId}-view`;
              const isDlLoading = pdfLoadingId === `${inv.invoiceId}-download`;

              return (
                <div className="mt-4 overflow-hidden rounded-xl border border-emerald-200 bg-[#F4FBF7] p-4 shadow-xs">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-100 text-[#156035]">
                        <FileText className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-[11px] font-bold uppercase tracking-wider text-emerald-800">
                          Official Tax Invoice PDF
                        </p>
                        <p className="font-mono text-xs font-bold text-zinc-800">
                          {inv.invoiceNumber}
                        </p>
                      </div>
                    </div>
                    <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-[11px] font-bold text-emerald-800">
                      Digital GST Invoice
                    </span>
                  </div>

                  <p className="mt-2.5 text-xs text-zinc-900 leading-relaxed">
                    View or download the official generated GST tax invoice complete with itemized packet details, GST breakdown, and digital verification seal.
                  </p>

                  <div className="mt-4 flex flex-wrap items-center gap-2.5">
                    <button
                      type="button"
                      onClick={() => handleInvoicePdf(inv.invoiceId, inv.invoiceNumber, "view")}
                      disabled={Boolean(pdfLoadingId)}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-600 bg-white px-3.5 py-2 text-xs font-bold text-emerald-800 shadow-xs transition hover:bg-emerald-50 disabled:opacity-50 cursor-pointer"
                    >
                      {isViewLoading ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin text-emerald-700" />
                      ) : (
                        <Eye className="h-3.5 w-3.5 text-emerald-700" />
                      )}
                      View PDF
                    </button>

                    <button
                      type="button"
                      onClick={() => handleInvoicePdf(inv.invoiceId, inv.invoiceNumber, "download")}
                      disabled={Boolean(pdfLoadingId)}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-[#156035] px-3.5 py-2 text-xs font-bold text-white shadow-xs transition hover:bg-[#0f4e2b] disabled:opacity-50 cursor-pointer"
                    >
                      {isDlLoading ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin text-white" />
                      ) : (
                        <Download className="h-3.5 w-3.5" />
                      )}
                      Download PDF
                    </button>

                    <a
                      href={getDirectPdfUrl(inv.invoiceId, false)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 ml-auto text-xs font-medium text-emerald-700 hover:text-emerald-900 hover:underline"
                    >
                      <span>Direct link</span>
                      <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  </div>

                  {pdfError && (
                    <p className="mt-3 text-xs font-semibold text-rose-600">
                      {pdfError}
                    </p>
                  )}
                </div>
              );
            })()}

            {/* Storefront photo section for customer records */}
            {(selectedRow.photoPath !== undefined ||
              eyebrow.toLowerCase().includes("customer") ||
              title.toLowerCase().includes("customer")) && (
              <div className="mt-4 overflow-hidden rounded-xl border border-zinc-200 bg-[#FAF8F5] p-3">
                <div className="mb-2 flex items-center justify-between text-xs">
                  <span className="font-bold uppercase tracking-wider text-zinc-900">
                    Storefront Photo
                  </span>
                  {selectedRow.photoPath ? (
                    <span className="font-semibold text-emerald-700">✓ Verified</span>
                  ) : (
                    <span className="text-zinc-700">Not uploaded</span>
                  )}
                </div>

                {selectedRow.photoPath ? (
                  <div className="space-y-2">
                    <div className="relative h-44 w-full overflow-hidden rounded-lg border border-rose-100 bg-white">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={String(selectedRow.photoPath)}
                        alt="Storefront photo"
                        className="h-full w-full object-cover"
                      />
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <label className="inline-flex cursor-pointer items-center gap-1.5 font-bold text-[#E61C5D] hover:underline">
                        <Camera className="h-3.5 w-3.5" />
                        {isUploadingPhoto ? "Uploading..." : "Replace photo"}
                        <input
                          type="file"
                          accept="image/jpeg,image/png,image/webp"
                          capture="environment"
                          disabled={isUploadingPhoto}
                          className="sr-only"
                          onChange={(e) => handleModalPhotoUpload(e, String(selectedRow.id))}
                        />
                      </label>
                      <a
                        href={String(selectedRow.photoPath)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-medium text-zinc-800 hover:text-zinc-800 hover:underline"
                      >
                        View full size ↗
                      </a>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-4 text-center">
                    <p className="mb-2 text-xs text-zinc-800">
                      No storefront photo attached yet
                    </p>
                    <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg bg-[#E61C5D] px-3.5 py-2 text-xs font-bold text-white shadow-xs transition hover:bg-[#c91550]">
                      <Camera className="h-3.5 w-3.5" />
                      {isUploadingPhoto ? "Uploading..." : "Upload shop photo"}
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        capture="environment"
                        disabled={isUploadingPhoto}
                        className="sr-only"
                        onChange={(e) => handleModalPhotoUpload(e, String(selectedRow.id))}
                      />
                    </label>
                  </div>
                )}

                {photoUploadMessage && (
                  <p className="mt-2 text-xs font-semibold text-emerald-700">
                    {photoUploadMessage}
                  </p>
                )}
              </div>
            )}

            {/* Live Map Pin section for records with GPS coordinates */}
            {selectedRow.latitude && selectedRow.longitude ? (
              <div className="mt-3 flex items-center justify-between rounded-xl border border-blue-100 bg-blue-50/70 p-3">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100 text-blue-700 shrink-0">
                    <MapPin className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-blue-900">
                      Storefront GPS Location
                    </p>
                    <p className="font-mono text-xs text-zinc-900 truncate">
                      {String(selectedRow.latitude)}, {String(selectedRow.longitude)}
                    </p>
                  </div>
                </div>
                <a
                  href={`https://www.google.com/maps?q=${selectedRow.latitude},${selectedRow.longitude}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex shrink-0 items-center gap-1 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-bold text-white shadow-xs transition hover:bg-blue-700"
                >
                  <span>📍 View on Google Maps</span>
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            ) : null}

            <div className="mt-5 divide-y divide-zinc-100">
              {columns.map((col) => (
                <div key={col.key} className="flex justify-between gap-4 py-3 text-sm">
                  <span className="text-zinc-800">{col.label}</span>
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
      ))}
    </DashboardShell>
  );
}
