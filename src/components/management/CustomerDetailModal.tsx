"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  Store,
  User,
  Phone,
  Mail,
  MapPin,
  Calendar,
  FileText,
  Download,
  Eye,
  ExternalLink,
  Camera,
  Loader2,
  CheckCircle2,
  Receipt,
  Layers,
  ArrowUpRight,
  ShieldCheck,
  ShoppingBag,
  Edit3,
  Save,
  AlertCircle,
  Building2,
  Hash,
  Share2,
  Send,
  MessageCircle,
} from "lucide-react";
import { adminApi } from "@/lib/api/admin";
import { managerApi } from "@/lib/api/manager";
import { sellerApi } from "@/lib/api/seller";
import { categoryApi } from "@/lib/api/categories";
import type { Category } from "@/lib/api/types";
import type { CustomerItem, SaleItem, InvoiceItem } from "@/lib/api/types";
import { compressImageToWebp } from "@/lib/imageCompression";

export interface CustomerDetailModalProps {
  role: "Super Admin" | "Manager" | "Seller";
  customerId: string;
  onClose: () => void;
  onCustomerUpdated?: (updated: CustomerItem) => void;
}

export function CustomerDetailModal({
  role,
  customerId,
  onClose,
  onCustomerUpdated,
}: CustomerDetailModalProps) {
  const [customer, setCustomer] = useState<CustomerItem | null>(null);
  const [sales, setSales] = useState<SaleItem[]>([]);
  const [invoices, setInvoices] = useState<InvoiceItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // PDF actions state
  const [pdfLoadingId, setPdfLoadingId] = useState<string | null>(null);
  const [pdfError, setPdfError] = useState<string | null>(null);

  // Photo upload state
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [photoMessage, setPhotoMessage] = useState<string | null>(null);

  // Edit Mode state
  const [isEditMode, setIsEditMode] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);

  // Editable Form fields
  const [editShopName, setEditShopName] = useState("");
  const [editContactName, setEditContactName] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editCategoryId, setEditCategoryId] = useState("");
  const [editShopNumber, setEditShopNumber] = useState("");
  const [editStreetName, setEditStreetName] = useState("");
  const [editVillage, setEditVillage] = useState("");
  const [editDistrict, setEditDistrict] = useState("");
  const [editState, setEditState] = useState("");
  const [editPincode, setEditPincode] = useState("");
  const [editActive, setEditActive] = useState(true);
  const [categories, setCategories] = useState<Category[]>([]);

  // Fetch customer details, sales history, and invoices
  useEffect(() => {
    let isMounted = true;
    async function loadDetails() {
      setIsLoading(true);
      setError(null);
      try {
        // 1. Fetch customer item
        let custRes: { customer: CustomerItem };
        if (role === "Super Admin") {
          custRes = await adminApi.getCustomer(customerId);
        } else if (role === "Manager") {
          custRes = await managerApi.getCustomer(customerId);
        } else {
          custRes = await sellerApi.getCustomer(customerId);
        }

        if (!isMounted) return;
        setCustomer(custRes.customer);
        const c = custRes.customer;
        setEditShopName(c.shopName || "");
        setEditContactName(c.contactName || "");
        setEditPhone(c.phone || "");
        setEditEmail(c.email || "");
        setEditCategoryId(c.categoryId || "");
        setEditShopNumber(c.shopNumber || "");
        setEditStreetName(c.streetName || "");
        setEditVillage(c.village || "");
        setEditDistrict(c.district || "");
        setEditState(c.state || "");
        setEditPincode(c.pincode || "");
        setEditActive(c.active ?? true);

        // 2. Fetch sales for this customer
        let salesList: SaleItem[] = [];
        try {
          if (role === "Super Admin") {
            const sRes = await adminApi.listSales({ customerId, pageSize: 50 });
            salesList = sRes.sales ?? (sRes as any).items ?? [];
          } else if (role === "Manager") {
            const sRes = await managerApi.listSales({ customerId, pageSize: 50 });
            salesList = sRes.sales ?? (sRes as any).items ?? [];
          } else {
            const sRes = await sellerApi.listSales({ customerId, pageSize: 50 });
            salesList = sRes.sales ?? (sRes as any).items ?? [];
          }
        } catch {
          salesList = [];
        }

        if (!isMounted) return;
        setSales(salesList);

        // Fetch categories for edit dropdown
        try {
          const catRes = await categoryApi.listCategories({ pageSize: 50 });
          const cats = catRes.categories || [];
          if (isMounted) setCategories(cats);
        } catch {
          // fallback
        }

        // 3. For Super Admin, also fetch invoices matched to this customer
        if (role === "Super Admin") {
          try {
            const invRes = await adminApi.listInvoices({ pageSize: 100 });
            const allInvoices = invRes.invoices ?? (invRes as any).items ?? [];
            const matchedInvoices = allInvoices.filter(
              (inv) =>
                inv.sale?.customerId === customerId ||
                inv.sale?.customer?.id === customerId ||
                salesList.some((s) => s.id === inv.saleId || s.invoice?.id === inv.id)
            );
            if (isMounted) {
              setInvoices(matchedInvoices);
            }
          } catch {
            if (isMounted) setInvoices([]);
          }
        }
      } catch (err: unknown) {
        if (!isMounted) return;
        const msg = err instanceof Error ? err.message : "Failed to load customer details";
        setError(msg);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    if (customerId) {
      loadDetails();
    }

    return () => {
      isMounted = false;
    };
  }, [customerId, role]);

  const handleShareEmail = (invoiceNumber: string, amount?: string) => {
    const toEmail = customer?.email || "";
    const shop = customer?.shopName || "Customer";
    const subject = encodeURIComponent(`Tax Invoice ${invoiceNumber} - Masako Enterprises / FemmeFlo`);
    const body = encodeURIComponent(
      `Dear ${shop},\n\n` +
      `Thank you for your business. Please find details for your official Tax Invoice ${invoiceNumber}.\n\n` +
      `Invoice Number: ${invoiceNumber}\n` +
      (amount ? `Invoice Amount: ${amount}\n` : "") +
      `Customer: ${shop}\n` +
      `Issued By: MASAKO ENTERPRISES PRIVATE LIMITED (FemmeFlo)\n\n` +
      `This verified computer-generated tax invoice has been generated for your recent stock purchase.\n\n` +
      `Best regards,\n` +
      `FemmeFlo Distribution Team`
    );
    window.open(`mailto:${toEmail}?subject=${subject}&body=${body}`, "_blank");
  };

  const handleShareWhatsApp = (invoiceNumber: string, amount?: string) => {
    const rawPhone = customer?.phone || "";
    const cleanPhone = rawPhone.replace(/\D/g, "");
    const formattedPhone = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;
    const shop = customer?.shopName || "Customer";
    const text = encodeURIComponent(
      `*Tax Invoice from Masako Enterprises / FemmeFlo*\n\n` +
      `Hello *${shop}*,\n` +
      `Your official Tax Invoice *${invoiceNumber}* has been issued.\n\n` +
      (amount ? `💰 *Amount:* ${amount}\n` : "") +
      `📄 *Invoice No:* ${invoiceNumber}\n` +
      `🏢 *Issued By:* MASAKO ENTERPRISES PRIVATE LIMITED\n\n` +
      `Thank you for your partnership with FemmeFlo!`
    );
    const url = formattedPhone
      ? `https://api.whatsapp.com/send?phone=${formattedPhone}&text=${text}`
      : `https://api.whatsapp.com/send?text=${text}`;
    window.open(url, "_blank");
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
    } catch {
      setPdfError("Unable to load invoice PDF. Please try again.");
    } finally {
      setPdfLoadingId(null);
    }
  };

  const handleSaveCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customer) return;

    setIsSaving(true);
    setSaveError(null);
    setSaveSuccess(null);

    const cleanPhone = editPhone.replace(/\D/g, "").slice(-10);
    if (!cleanPhone || cleanPhone.length !== 10) {
      setSaveError("Please provide a valid 10-digit mobile number.");
      setIsSaving(false);
      return;
    }

    const payload = {
      shopName: editShopName.trim(),
      contactName: editContactName.trim(),
      phone: cleanPhone,
      email: editEmail.trim() || undefined,
      categoryId: editCategoryId || undefined,
      shopNumber: editShopNumber.trim() || undefined,
      streetName: editStreetName.trim() || undefined,
      village: editVillage.trim(),
      district: editDistrict.trim(),
      state: editState.trim(),
      pincode: editPincode.trim() || undefined,
      active: editActive,
    };

    try {
      let res: { customer: CustomerItem };
      if (role === "Super Admin") {
        res = await adminApi.updateCustomer(customer.id, payload);
      } else if (role === "Manager") {
        res = await managerApi.updateCustomer(customer.id, payload);
      } else {
        res = await sellerApi.updateCustomer(customer.id, payload);
      }

      setCustomer(res.customer);
      setSaveSuccess("Customer details updated successfully!");
      if (onCustomerUpdated) {
        onCustomerUpdated(res.customer);
      }
      setTimeout(() => {
        setIsEditMode(false);
        setSaveSuccess(null);
      }, 1200);
    } catch (err: any) {
      setSaveError(err.message || "Failed to update customer details.");
    } finally {
      setIsSaving(false);
    }
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !customer) return;

    const allowed = ["image/jpeg", "image/png", "image/webp"];
    if (!allowed.includes(file.type)) {
      setPhotoMessage("Please upload a JPG, PNG, or WebP photo.");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setPhotoMessage("Photo size must be under 10 MB.");
      return;
    }

    setIsUploadingPhoto(true);
    setPhotoMessage("Compressing image...");
    try {
      const compressed = await compressImageToWebp(file);

      let res: { customer: CustomerItem; photoUrl: string };
      if (role === "Super Admin") {
        res = await adminApi.uploadCustomerPhoto(customer.id, compressed);
      } else if (role === "Manager") {
        res = await managerApi.uploadCustomerPhoto(customer.id, compressed);
      } else {
        res = await sellerApi.uploadCustomerPhoto(customer.id, compressed);
      }

      const updated = { ...customer, photoPath: res.photoUrl || (res.customer?.photoPath ?? customer.photoPath) };
      setCustomer(updated);
      setPhotoMessage("Storefront photo saved successfully!");
      if (onCustomerUpdated) onCustomerUpdated(updated);
    } catch {
      setPhotoMessage("Failed to upload photo. Please try again.");
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  const fullAddress =
    customer?.address ||
    [
      customer?.shopNumber,
      customer?.streetName,
      customer?.village,
      customer?.district,
      customer?.state,
      customer?.pincode,
    ]
      .filter(Boolean)
      .join(", ") ||
    [customer?.village, customer?.district, customer?.state].filter(Boolean).join(", ");

  // Deduplicate all invoices (from direct invoices endpoint and sales invoices)
  const combinedInvoices: Array<{ id: string; number: string; date?: string; amount?: string; saleId?: string }> = [];
  const seenIds = new Set<string>();

  invoices.forEach((inv) => {
    if (!seenIds.has(inv.id)) {
      seenIds.add(inv.id);
      combinedInvoices.push({
        id: inv.id,
        number: inv.number,
        date: inv.createdAt ? new Date(inv.createdAt).toLocaleDateString("en-IN") : undefined,
        amount: inv.sale ? `₹${(inv.sale.totalPaise / 100).toLocaleString("en-IN")}` : undefined,
        saleId: inv.saleId,
      });
    }
  });

  sales.forEach((s) => {
    if (s.invoice?.id && !seenIds.has(s.invoice.id)) {
      seenIds.add(s.invoice.id);
      combinedInvoices.push({
        id: s.invoice.id,
        number: s.invoice.number,
        date: s.createdAt ? new Date(s.createdAt).toLocaleDateString("en-IN") : undefined,
        amount: `₹${(s.totalPaise / 100).toLocaleString("en-IN")}`,
        saleId: s.id,
      });
    }
  });

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-3 sm:p-4 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        data-lenis-prevent
        onClick={(e) => e.stopPropagation()}
        className="relative flex flex-col w-full max-w-3xl max-h-[92vh] overflow-hidden rounded-3xl border border-rose-100 bg-white shadow-2xl overscroll-contain"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-100 bg-gradient-to-r from-[#FFF8FA] via-white to-[#F0FAF4] px-6 py-4.5">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white border border-rose-100 text-[#156035] shadow-xs">
              <Store className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#E61C5D]">
                  Customer &amp; Retail Profile
                </span>
                {customer?.active ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700 border border-emerald-200">
                    <CheckCircle2 className="h-3 w-3" />
                    Active
                  </span>
                ) : (
                  <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-[10px] font-bold text-zinc-800">
                    Inactive
                  </span>
                )}
              </div>
              <h2 className="font-playfair text-xl sm:text-2xl font-bold text-zinc-900 leading-tight">
                {customer?.shopName || "Customer Details"}
              </h2>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {customer && (
              <button
                type="button"
                onClick={() => {
                  if (!isEditMode && customer) {
                    setEditShopName(customer.shopName || "");
                    setEditContactName(customer.contactName || "");
                    setEditPhone(customer.phone || "");
                    setEditEmail(customer.email || "");
                    setEditCategoryId(customer.categoryId || "");
                    setEditShopNumber(customer.shopNumber || "");
                    setEditStreetName(customer.streetName || "");
                    setEditVillage(customer.village || "");
                    setEditDistrict(customer.district || "");
                    setEditState(customer.state || "");
                    setEditPincode(customer.pincode || "");
                    setEditActive(customer.active ?? true);
                  }
                  setIsEditMode(!isEditMode);
                  setSaveError(null);
                  setSaveSuccess(null);
                }}
                className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold transition shadow-xs cursor-pointer ${
                  isEditMode
                    ? "bg-zinc-800 text-white hover:bg-zinc-900"
                    : "border border-rose-200 bg-white text-[#E61C5D] hover:bg-rose-50"
                }`}
              >
                <Edit3 className="h-3.5 w-3.5" />
                <span>{isEditMode ? "Cancel Edit" : "Edit Customer"}</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="rounded-xl p-2 text-zinc-700 hover:bg-rose-50 hover:text-zinc-700 transition cursor-pointer"
              aria-label="Close modal"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div data-lenis-prevent className="flex-1 overflow-y-auto overscroll-contain p-6 space-y-6">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-16 text-zinc-700">
              <Loader2 className="h-8 w-8 animate-spin text-[#E61C5D] mb-3" />
              <p className="text-sm font-medium">Loading customer data, invoices, and photo...</p>
            </div>
          ) : error ? (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-xs font-semibold text-rose-700">
              {error}
            </div>
          ) : customer ? (
            isEditMode ? (
              /* ========================================================= */
              /* EDIT MODE: Customer Shop & Contact Details Form          */
              /* ========================================================= */
              <form onSubmit={handleSaveCustomer} className="space-y-6">
                {saveSuccess && (
                  <div className="flex items-center gap-2.5 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs font-semibold text-emerald-900 shadow-xs">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                    <span>{saveSuccess}</span>
                  </div>
                )}

                {saveError && (
                  <div className="flex items-center gap-2.5 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs font-semibold text-rose-900 shadow-xs">
                    <AlertCircle className="h-4 w-4 text-rose-600 shrink-0" />
                    <span>{saveError}</span>
                  </div>
                )}

                {/* Section 1: Store & Contact Info */}
                <div className="rounded-2xl border border-zinc-200 bg-[#FCFAF6] p-4.5 space-y-4">
                  <div className="flex items-center justify-between border-b border-zinc-200/70 pb-2.5">
                    <span className="text-xs font-bold uppercase tracking-wider text-[#156035] flex items-center gap-1.5">
                      <Store className="h-4 w-4 text-[#156035]" />
                      Store & Contact Information
                    </span>
                    <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-zinc-700">
                      <span>Customer Active</span>
                      <input
                        type="checkbox"
                        checked={editActive}
                        onChange={(e) => setEditActive(e.target.checked)}
                        className="h-4 w-4 rounded border-zinc-300 text-[#156035] focus:ring-[#156035] cursor-pointer"
                      />
                    </label>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                    <div>
                      <label className="block font-bold text-zinc-700 mb-1">
                        Store Name <span className="text-[#E61C5D]">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={editShopName}
                        onChange={(e) => setEditShopName(e.target.value)}
                        placeholder="e.g. Sai Kirana & General Store"
                        className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-xs font-medium text-zinc-900 focus:border-[#156035] focus:ring-1 focus:ring-[#156035] focus:outline-hidden"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-zinc-700 mb-1">
                        Shopkeeper / Contact Name <span className="text-[#E61C5D]">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={editContactName}
                        onChange={(e) => setEditContactName(e.target.value)}
                        placeholder="e.g. Ramesh Patel"
                        className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-xs font-medium text-zinc-900 focus:border-[#156035] focus:ring-1 focus:ring-[#156035] focus:outline-hidden"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-zinc-700 mb-1">
                        Contact Phone <span className="text-[#E61C5D]">*</span>
                      </label>
                      <input
                        type="tel"
                        required
                        maxLength={10}
                        value={editPhone}
                        onChange={(e) => setEditPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
                        placeholder="10-digit mobile number"
                        className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-xs font-medium text-zinc-900 focus:border-[#156035] focus:ring-1 focus:ring-[#156035] focus:outline-hidden"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-zinc-700 mb-1">
                        Email Address <span className="font-normal text-zinc-500">(Optional)</span>
                      </label>
                      <input
                        type="email"
                        value={editEmail}
                        onChange={(e) => setEditEmail(e.target.value)}
                        placeholder="e.g. store@gmail.com"
                        className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-xs font-medium text-zinc-900 focus:border-[#156035] focus:ring-1 focus:ring-[#156035] focus:outline-hidden"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block font-bold text-zinc-700 mb-1">
                        Retail Category <span className="text-[#E61C5D]">*</span>
                      </label>
                      <select
                        value={editCategoryId}
                        onChange={(e) => setEditCategoryId(e.target.value)}
                        className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-xs font-medium text-zinc-900 focus:border-[#156035] focus:ring-1 focus:ring-[#156035] focus:outline-hidden"
                      >
                        {categories.map((cat) => (
                          <option key={cat.id} value={cat.id}>
                            {cat.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                {/* Section 2: Address & Location Details */}
                <div className="rounded-2xl border border-zinc-200 bg-[#FCFAF6] p-4.5 space-y-4">
                  <div className="border-b border-zinc-200/70 pb-2.5">
                    <span className="text-xs font-bold uppercase tracking-wider text-[#156035] flex items-center gap-1.5">
                      <MapPin className="h-4 w-4 text-[#156035]" />
                      Store Address & Location
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                    <div>
                      <label className="block font-bold text-zinc-700 mb-1">
                        Shop / Unit Number <span className="font-normal text-zinc-500">(Optional)</span>
                      </label>
                      <input
                        type="text"
                        value={editShopNumber}
                        onChange={(e) => setEditShopNumber(e.target.value)}
                        placeholder="e.g. Shop No. 4"
                        className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-xs font-medium text-zinc-900 focus:border-[#156035] focus:ring-1 focus:ring-[#156035] focus:outline-hidden"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-zinc-700 mb-1">
                        Street Name / Landmark <span className="font-normal text-zinc-500">(Optional)</span>
                      </label>
                      <input
                        type="text"
                        value={editStreetName}
                        onChange={(e) => setEditStreetName(e.target.value)}
                        placeholder="e.g. Near Station Road"
                        className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-xs font-medium text-zinc-900 focus:border-[#156035] focus:ring-1 focus:ring-[#156035] focus:outline-hidden"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-zinc-700 mb-1">
                        Village / Locality <span className="text-[#E61C5D]">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={editVillage}
                        onChange={(e) => setEditVillage(e.target.value)}
                        placeholder="e.g. Diva East"
                        className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-xs font-medium text-zinc-900 focus:border-[#156035] focus:ring-1 focus:ring-[#156035] focus:outline-hidden"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-zinc-700 mb-1">
                        District <span className="text-[#E61C5D]">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={editDistrict}
                        onChange={(e) => setEditDistrict(e.target.value)}
                        placeholder="e.g. Thane"
                        className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-xs font-medium text-zinc-900 focus:border-[#156035] focus:ring-1 focus:ring-[#156035] focus:outline-hidden"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-zinc-700 mb-1">
                        State <span className="text-[#E61C5D]">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={editState}
                        onChange={(e) => setEditState(e.target.value)}
                        placeholder="e.g. Maharashtra"
                        className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-xs font-medium text-zinc-900 focus:border-[#156035] focus:ring-1 focus:ring-[#156035] focus:outline-hidden"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-zinc-700 mb-1">
                        Pincode <span className="font-normal text-zinc-500">(Optional)</span>
                      </label>
                      <input
                        type="text"
                        maxLength={6}
                        value={editPincode}
                        onChange={(e) => setEditPincode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                        placeholder="6-digit PIN code"
                        className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-xs font-medium text-zinc-900 focus:border-[#156035] focus:ring-1 focus:ring-[#156035] focus:outline-hidden"
                      />
                    </div>
                  </div>
                </div>

                {/* Edit Form Actions */}
                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setIsEditMode(false);
                      setSaveError(null);
                      setSaveSuccess(null);
                    }}
                    className="rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-xs font-bold text-zinc-700 hover:bg-zinc-50 transition cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="inline-flex items-center gap-2 rounded-xl bg-[#156035] px-5 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-[#0f4e2b] disabled:opacity-50 transition cursor-pointer"
                  >
                    {isSaving ? (
                      <>
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        <span>Saving Changes...</span>
                      </>
                    ) : (
                      <>
                        <Save className="h-3.5 w-3.5" />
                        <span>Save Customer Changes</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            ) : (
              <>
                {/* TOP GRID: Shopkeeper Photo & Core Details */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
                {/* 1. Storefront / Shopkeeper Photo Card */}
                <div className="md:col-span-5 flex flex-col justify-between rounded-2xl border border-zinc-200 bg-[#FAF8F5] p-4">
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-bold uppercase tracking-wider text-zinc-700 flex items-center gap-1.5">
                        <Camera className="h-3.5 w-3.5 text-[#E61C5D]" />
                        Storefront Photo
                      </span>
                      {customer.photoPath ? (
                        <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                          ✓ Verified
                        </span>
                      ) : (
                        <span className="text-[11px] font-medium text-zinc-700">Not added</span>
                      )}
                    </div>

                    <div className="relative h-48 w-full overflow-hidden rounded-xl border border-zinc-200 bg-white flex items-center justify-center">
                      {customer.photoPath ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={customer.photoPath}
                          alt={customer.shopName}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex flex-col items-center text-zinc-700 p-4 text-center">
                          <Store className="h-10 w-10 text-zinc-300 mb-1" />
                          <p className="text-xs">No shop photo uploaded yet</p>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="mt-3 flex items-center justify-between gap-2">
                    <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg bg-white border border-rose-200 px-3 py-1.5 text-xs font-bold text-[#E61C5D] shadow-xs hover:bg-rose-50 transition">
                      <Camera className="h-3.5 w-3.5" />
                      {isUploadingPhoto ? "Uploading..." : customer.photoPath ? "Replace photo" : "Upload photo"}
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        capture="environment"
                        disabled={isUploadingPhoto}
                        className="sr-only"
                        onChange={handlePhotoUpload}
                      />
                    </label>

                    {customer.photoPath && (
                      <a
                        href={customer.photoPath}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs font-semibold text-zinc-900 hover:text-zinc-900 hover:underline"
                      >
                        <span>Full photo</span>
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    )}
                  </div>

                  {photoMessage && (
                    <p className="mt-2 text-xs font-semibold text-emerald-700">{photoMessage}</p>
                  )}
                </div>

                {/* 2. Contact & Territory Info */}
                <div className="md:col-span-7 flex flex-col justify-between space-y-3">
                  <div className="rounded-2xl border border-zinc-200 bg-white p-4 space-y-3">
                    <div className="flex items-center justify-between border-b border-zinc-100 pb-2">
                      <span className="text-xs font-bold uppercase tracking-wider text-zinc-800">
                        Contact Information
                      </span>
                      <span className="rounded-lg bg-zinc-100 px-2 py-0.5 text-[11px] font-bold text-zinc-700">
                        {customer.category?.name || "General trade"}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                      <div className="space-y-1">
                        <span className="text-zinc-700 block font-medium">Shopkeeper / Contact Person</span>
                        <strong className="text-sm font-bold text-zinc-800 flex items-center gap-1.5">
                          <User className="h-3.5 w-3.5 text-emerald-700 shrink-0" />
                          {customer.contactName || "—"}
                        </strong>
                      </div>

                      <div className="space-y-1">
                        <span className="text-zinc-700 block font-medium">Contact Phone</span>
                        <div className="flex items-center gap-1.5">
                          <Phone className="h-3.5 w-3.5 text-emerald-700 shrink-0" />
                          {customer.phone ? (
                            <a
                              href={`tel:${customer.phone}`}
                              className="text-sm font-bold text-zinc-800 hover:text-[#E61C5D] hover:underline"
                            >
                              {customer.phone}
                            </a>
                          ) : (
                            <span className="text-zinc-800">—</span>
                          )}
                        </div>
                      </div>

                      {customer.email ? (
                        <div className="space-y-1 sm:col-span-2">
                          <span className="text-zinc-700 block font-medium">Email Address</span>
                          <span className="text-xs font-bold text-zinc-800 flex items-center gap-1.5">
                            <Mail className="h-3.5 w-3.5 text-zinc-700 shrink-0" />
                            {customer.email}
                          </span>
                        </div>
                      ) : null}

                      <div className="space-y-1">
                        <span className="text-zinc-700 block font-medium">Assigned Field Officer</span>
                        <strong className="text-xs font-bold text-zinc-800 flex items-center gap-1.5">
                          <ShoppingBag className="h-3.5 w-3.5 text-[#E61C5D] shrink-0" />
                          {customer.seller?.name || "Assigned Seller"}
                        </strong>
                        {customer.seller?.phone && (
                          <span className="text-[11px] text-zinc-800 block">
                            {customer.seller.phone}
                          </span>
                        )}
                      </div>

                      <div className="space-y-1">
                        <span className="text-zinc-700 block font-medium">Customer Since</span>
                        <strong className="text-xs font-bold text-zinc-800 flex items-center gap-1.5">
                          <Calendar className="h-3.5 w-3.5 text-zinc-700 shrink-0" />
                          {customer.createdAt
                            ? new Date(customer.createdAt).toLocaleDateString("en-IN", {
                                day: "numeric",
                                month: "short",
                                year: "numeric",
                              })
                            : "—"}
                        </strong>
                      </div>
                    </div>
                  </div>

                  {/* Address & GPS Pin Card */}
                  <div className="rounded-2xl border border-zinc-200 bg-[#F4FBF7] p-3.5 text-xs">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-start gap-2 min-w-0">
                        <MapPin className="h-4 w-4 text-[#156035] shrink-0 mt-0.5" />
                        <div>
                          <span className="font-bold uppercase tracking-wider text-emerald-900 block text-[11px]">
                            Shop Address &amp; Location
                          </span>
                          <p className="mt-0.5 text-zinc-700 leading-relaxed font-medium">
                            {fullAddress}
                          </p>
                        </div>
                      </div>

                      {customer.latitude && customer.longitude && (
                        <a
                          href={`https://www.google.com/maps?q=${customer.latitude},${customer.longitude}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="shrink-0 inline-flex items-center gap-1 rounded-lg bg-[#156035] px-2.5 py-1.5 text-[11px] font-bold text-white shadow-xs hover:bg-[#0f4e2b] transition"
                        >
                          <span>Maps</span>
                          <ArrowUpRight className="h-3 w-3" />
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* GENERATED INVOICES SECTION */}
              <div className="rounded-2xl border border-emerald-200 bg-[#F4FBF7] p-4.5">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100 text-[#156035]">
                      <FileText className="h-4 w-4" />
                    </div>
                    <div>
                      <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-900">
                        Generated Invoices ({combinedInvoices.length})
                      </h3>
                      <p className="text-[11px] text-zinc-800">
                        Official digital tax invoices issued for orders placed by this customer
                      </p>
                    </div>
                  </div>
                </div>

                {pdfError && (
                  <p className="mb-3 text-xs font-semibold text-rose-600 bg-rose-50 p-2 rounded-lg border border-rose-200">
                    {pdfError}
                  </p>
                )}

                {combinedInvoices.length > 0 ? (
                  <div className="divide-y divide-emerald-100/80 rounded-xl border border-emerald-100 bg-white overflow-hidden shadow-xs">
                    {combinedInvoices.map((inv) => {
                      const isViewLoading = pdfLoadingId === `${inv.id}-view`;
                      const isDlLoading = pdfLoadingId === `${inv.id}-download`;

                      return (
                        <div
                          key={inv.id}
                          className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 hover:bg-emerald-50/40 transition"
                        >
                          <div className="flex items-center gap-3">
                            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-800 font-mono text-xs font-bold">
                              #
                            </span>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-mono text-xs font-bold text-zinc-900">
                                  {inv.number}
                                </span>
                                {inv.amount && (
                                  <span className="text-xs font-bold text-emerald-800">
                                    {inv.amount}
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-2 text-[11px] text-zinc-800">
                                {inv.date && <span>Date: {inv.date}</span>}
                                <span>• Verified Tax Invoice</span>
                              </div>
                            </div>
                          </div>

                          <div className="flex flex-wrap items-center gap-1.5 self-end sm:self-auto">
                            <button
                              type="button"
                              onClick={() => handleInvoicePdf(inv.id, inv.number, "view")}
                              disabled={Boolean(pdfLoadingId)}
                              className="inline-flex items-center gap-1 rounded-lg border border-emerald-600 bg-white px-2.5 py-1.5 text-xs font-bold text-emerald-800 shadow-2xs hover:bg-emerald-50 transition disabled:opacity-50 cursor-pointer"
                            >
                              {isViewLoading ? (
                                <Loader2 className="h-3 w-3 animate-spin text-emerald-700" />
                              ) : (
                                <Eye className="h-3.5 w-3.5" />
                              )}
                              <span>View</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => handleInvoicePdf(inv.id, inv.number, "download")}
                              disabled={Boolean(pdfLoadingId)}
                              className="inline-flex items-center gap-1 rounded-lg bg-[#156035] px-2.5 py-1.5 text-xs font-bold text-white shadow-2xs hover:bg-[#0f4e2b] transition disabled:opacity-50 cursor-pointer"
                            >
                              {isDlLoading ? (
                                <Loader2 className="h-3 w-3 animate-spin text-white" />
                              ) : (
                                <Download className="h-3.5 w-3.5" />
                              )}
                              <span>Download</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => handleShareWhatsApp(inv.number, inv.amount)}
                              title="Share invoice via WhatsApp"
                              className="inline-flex items-center gap-1 rounded-lg bg-[#25D366] px-2.5 py-1.5 text-xs font-bold text-white shadow-2xs hover:bg-[#1ebd5a] transition cursor-pointer"
                            >
                              <MessageCircle className="h-3.5 w-3.5" />
                              <span>WhatsApp</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => handleShareEmail(inv.number, inv.amount)}
                              title="Share invoice via Email"
                              className="inline-flex items-center gap-1 rounded-lg border border-zinc-300 bg-white px-2.5 py-1.5 text-xs font-bold text-zinc-700 shadow-2xs hover:bg-zinc-50 transition cursor-pointer"
                            >
                              <Mail className="h-3.5 w-3.5 text-[#E61C5D]" />
                              <span>Email</span>
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="rounded-xl border border-dashed border-emerald-200 bg-white/70 py-6 text-center text-xs text-zinc-800">
                    No invoices generated yet for this customer.
                  </div>
                )}
              </div>

              {/* SALES ORDER HISTORY SECTION */}
              <div className="rounded-2xl border border-zinc-200 bg-white p-4.5">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-rose-50 text-[#E61C5D]">
                      <Receipt className="h-4 w-4" />
                    </div>
                    <div>
                      <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-700">
                        Sales &amp; Orders History ({sales.length})
                      </h3>
                      <p className="text-[11px] text-zinc-800">
                        Recorded packet purchases and order payment statuses
                      </p>
                    </div>
                  </div>
                </div>

                {sales.length > 0 ? (
                  <div className="overflow-x-auto rounded-xl border border-zinc-100">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-[#FAF8F5] text-zinc-800 uppercase tracking-wider font-semibold border-b border-zinc-200">
                        <tr>
                          <th className="px-3.5 py-2.5">Date</th>
                          <th className="px-3.5 py-2.5">Packets</th>
                          <th className="px-3.5 py-2.5">Total Amount</th>
                          <th className="px-3.5 py-2.5">Payment</th>
                          <th className="px-3.5 py-2.5">Status</th>
                          <th className="px-3.5 py-2.5 text-right">Invoice</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-100">
                        {sales.map((s) => (
                          <tr key={s.id} className="hover:bg-zinc-50/60 transition">
                            <td className="px-3.5 py-3 font-medium text-zinc-900">
                              {new Date(s.createdAt).toLocaleDateString("en-IN")}
                            </td>
                            <td className="px-3.5 py-3 font-bold text-zinc-900">
                              {s.quantity} pkts
                            </td>
                            <td className="px-3.5 py-3 font-bold text-emerald-800">
                              ₹{(s.totalPaise / 100).toLocaleString("en-IN")}
                            </td>
                            <td className="px-3.5 py-3">
                              <span className="rounded-md bg-zinc-100 px-2 py-0.5 text-[11px] font-semibold text-zinc-700">
                                {s.paymentMode}
                              </span>
                            </td>
                            <td className="px-3.5 py-3">
                              <span
                                className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${
                                  s.status === "CONFIRMED"
                                    ? "bg-emerald-50 text-emerald-800"
                                    : s.status === "PENDING_APPROVAL"
                                    ? "bg-amber-50 text-amber-800"
                                    : "bg-zinc-100 text-zinc-900"
                                }`}
                              >
                                {s.status}
                              </span>
                            </td>
                            <td className="px-3.5 py-3 text-right">
                              {s.invoice?.id ? (
                                <button
                                  type="button"
                                  onClick={() => handleInvoicePdf(s.invoice!.id, s.invoice!.number, "view")}
                                  className="inline-flex items-center gap-1 font-bold text-xs text-emerald-700 hover:text-emerald-900 hover:underline cursor-pointer"
                                >
                                  <FileText className="h-3 w-3" />
                                  <span>{s.invoice.number}</span>
                                </button>
                              ) : (
                                <span className="text-zinc-700">—</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="rounded-xl border border-dashed border-zinc-200 bg-[#FAF8F5] py-6 text-center text-xs text-zinc-800">
                    No sales orders recorded yet for this customer.
                  </div>
                )}
              </div>
            </>
            )
          ) : null}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-zinc-100 bg-[#FAF8F5] px-6 py-3.5">
          <p className="text-xs text-zinc-800">
            Femmeflo Customer Verification • Secure GST Records
          </p>
          <div className="flex items-center gap-2.5">
            {!isEditMode && customer && (
              <button
                type="button"
                onClick={() => {
                  setEditShopName(customer.shopName || "");
                  setEditContactName(customer.contactName || "");
                  setEditPhone(customer.phone || "");
                  setEditEmail(customer.email || "");
                  setEditCategoryId(customer.categoryId || "");
                  setEditShopNumber(customer.shopNumber || "");
                  setEditStreetName(customer.streetName || "");
                  setEditVillage(customer.village || "");
                  setEditDistrict(customer.district || "");
                  setEditState(customer.state || "");
                  setEditPincode(customer.pincode || "");
                  setEditActive(customer.active ?? true);
                  setIsEditMode(true);
                  setSaveError(null);
                  setSaveSuccess(null);
                }}
                className="inline-flex items-center gap-1.5 rounded-xl border border-rose-200 bg-white px-4 py-2 text-xs font-bold text-[#E61C5D] hover:bg-rose-50 transition cursor-pointer"
              >
                <Edit3 className="h-3.5 w-3.5" />
                <span>Edit Customer</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="rounded-xl bg-[#156035] px-5 py-2 text-xs font-bold text-white shadow-xs hover:bg-[#0f4e2b] transition cursor-pointer"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
