"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowLeft, Camera, CheckCircle2, Image as ImageIcon, Loader2, MapPin, Trash2, Upload } from "lucide-react";
import { DashboardShell, PageHeading, SectionCard } from "./DashboardShell";
import type { NavigationItem } from "./DashboardShell";
import { adminApi } from "@/lib/api/admin";
import { managerApi } from "@/lib/api/manager";
import { sellerApi } from "@/lib/api/seller";
import { categoryApi } from "@/lib/api/categories";
import type { Category, ManagerItem, SellerItem } from "@/lib/api/types";
import { ApiError } from "@/lib/api/client";

type Props = {
  role: "Super Admin" | "Manager" | "Seller";
  workspace: string;
  userName: string;
  userDetail: string;
  navigation: NavigationItem[];
  entity: "seller" | "customer";
  backHref: string;
};

const ALLOWED_CUSTOMER_CATEGORIES = [
  "General Store",
  "Medical & Pharmacy",
  "Kirana Store",
  "Supermarket",
  "Cosmetics & Beauty",
  "Rural Retail Store",
  "Wholesale Distributor",
];

export function OnboardingFormScreen({
  role,
  workspace,
  userName,
  userDetail,
  navigation,
  entity,
  backHref,
}: Props) {
  const seller = entity === "seller";

  // Common Fields
  const [name, setName] = useState("");
  const [contactName, setContactName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [state, setState] = useState("");
  const [district, setDistrict] = useState("");
  const [village, setVillage] = useState("");

  // Seller-specific fields
  const [managers, setManagers] = useState<ManagerItem[]>([]);
  const [selectedManagerId, setSelectedManagerId] = useState("");

  // Customer-specific fields
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState("");
  const [isLoadingCategories, setIsLoadingCategories] = useState(!seller);
  const [sellers, setSellers] = useState<SellerItem[]>([]);
  const [selectedSellerId, setSelectedSellerId] = useState("");
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const [uploadedPhotoUrl, setUploadedPhotoUrl] = useState<string | null>(null);
  const [submissionStep, setSubmissionStep] = useState<string>("");
  const [location, setLocation] = useState("");
  const [lat, setLat] = useState<number | undefined>(undefined);
  const [lng, setLng] = useState<number | undefined>(undefined);

  // Status
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [saved, setSaved] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  // Load dynamic data (categories, managers, sellers)
  useEffect(() => {
    let active = true;

    async function loadAuxData() {
      try {
        if (!seller) {
          setIsLoadingCategories(true);
          try {
            const catRes = await categoryApi.listCategories();
            const list = catRes?.categories ?? (catRes as any)?.items ?? [];
            if (active && list.length > 0) {
              // Filter strictly to allowed categories
              const allowedOnly = list.filter((c: any) =>
                c.active !== false &&
                ALLOWED_CUSTOMER_CATEGORIES.some(
                  (std) => std.toLowerCase() === c.name.toLowerCase()
                )
              );

              const targetList = allowedOnly.length > 0 ? allowedOnly : list.filter((c: any) => c.active !== false);

              // Sort in the exact priority sequence requested
              targetList.sort((a: any, b: any) => {
                const idxA = ALLOWED_CUSTOMER_CATEGORIES.findIndex(
                  (std) => std.toLowerCase() === a.name.toLowerCase()
                );
                const idxB = ALLOWED_CUSTOMER_CATEGORIES.findIndex(
                  (std) => std.toLowerCase() === b.name.toLowerCase()
                );
                if (idxA !== -1 && idxB !== -1) return idxA - idxB;
                if (idxA !== -1) return -1;
                if (idxB !== -1) return 1;
                return a.name.localeCompare(b.name);
              });

              setCategories(targetList);
              if (targetList.length > 0) {
                setSelectedCategoryId(targetList[0].id);
              }
            }
          } catch (err) {
            console.error("Failed to load customer categories:", err);
          } finally {
            if (active) setIsLoadingCategories(false);
          }

          if (role === "Super Admin") {
            const sellersRes = await adminApi.listSellers().catch(() => ({ sellers: [] }));
            if (active && sellersRes.sellers.length > 0) {
              setSellers(sellersRes.sellers);
              setSelectedSellerId(sellersRes.sellers[0].id);
            }
          } else if (role === "Manager") {
            const sellersRes = await managerApi.listSellers().catch(() => ({ sellers: [] }));
            if (active && sellersRes.sellers.length > 0) {
              setSellers(sellersRes.sellers);
              setSelectedSellerId(sellersRes.sellers[0].id);
            }
          }
        } else {
          // Onboarding a Seller
          if (role === "Super Admin") {
            const mgrRes = await adminApi.listManagers().catch(() => ({ managers: [] }));
            if (active && mgrRes.managers.length > 0) {
              setManagers(mgrRes.managers);
              setSelectedManagerId(mgrRes.managers[0].id);
            }
          }
        }
      } catch {
        // Ignored
      }
    }

    loadAuxData();
    return () => {
      active = false;
    };
  }, [role, seller]);

  // Cleanup preview URL on unmount or change
  useEffect(() => {
    return () => {
      if (photoPreview) {
        URL.revokeObjectURL(photoPreview);
      }
    };
  }, [photoPreview]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setPhotoError(null);
    if (!file) return;

    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      setPhotoError("Please select a valid image (JPEG, PNG, or WebP).");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setPhotoError("Image size must be 5 MB or less.");
      return;
    }

    if (photoPreview) {
      URL.revokeObjectURL(photoPreview);
    }

    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
  };

  const handleRemovePhoto = () => {
    if (photoPreview) {
      URL.revokeObjectURL(photoPreview);
    }
    setPhotoFile(null);
    setPhotoPreview(null);
    setPhotoError(null);
  };

  const capture = () => {
    if (!navigator.geolocation) {
      setLocation("Location is not supported by this browser.");
      return;
    }
    setLocation("Getting location…");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLat(pos.coords.latitude);
        setLng(pos.coords.longitude);
        setLocation(`${pos.coords.latitude.toFixed(5)}, ${pos.coords.longitude.toFixed(5)}`);
      },
      () => {
        setLocation("Location permission denied. You can proceed without coordinates.");
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");
    setIsSubmitting(true);
    setSubmissionStep("Saving record…");

    try {
      if (seller) {
        // Create Seller
        if (role === "Super Admin") {
          await adminApi.createSeller({
            name,
            phone: phone.startsWith("+") ? phone : `+91${phone.replace(/\D/g, "")}`,
            email: email || undefined,
            password,
            managerId: selectedManagerId || undefined,
            state,
            district,
            village,
          });
        } else {
          await managerApi.createSeller({
            name,
            phone: phone.startsWith("+") ? phone : `+91${phone.replace(/\D/g, "")}`,
            email: email || undefined,
            password,
            state,
            district,
            village,
          });
        }
      } else {
        // Create Customer
        const customerData = {
          shopName: name,
          contactName: contactName || name,
          phone: phone.startsWith("+") ? phone : `+91${phone.replace(/\D/g, "")}`,
          email: email || undefined,
          categoryId: selectedCategoryId,
          state,
          district,
          village,
          latitude: lat,
          longitude: lng,
        };

        setSubmissionStep("Saving customer profile…");

        let createdId: string | null = null;
        if (role === "Super Admin") {
          const res = await adminApi.createCustomer({
            ...customerData,
            sellerId: selectedSellerId || undefined,
          });
          createdId = res.customer.id;
        } else if (role === "Manager") {
          const res = await managerApi.createCustomer({
            ...customerData,
            sellerId: selectedSellerId || undefined,
          });
          createdId = res.customer.id;
        } else {
          const res = await sellerApi.createCustomer(customerData);
          createdId = res.customer.id;
        }

        // Upload shop photo if selected
        if (photoFile && createdId) {
          setSubmissionStep("Uploading storefront photo…");
          try {
            let uploadRes: { customer: unknown; photoUrl: string };
            if (role === "Super Admin") {
              uploadRes = await adminApi.uploadCustomerPhoto(createdId, photoFile);
            } else if (role === "Manager") {
              uploadRes = await managerApi.uploadCustomerPhoto(createdId, photoFile);
            } else {
              uploadRes = await sellerApi.uploadCustomerPhoto(createdId, photoFile);
            }
            if (uploadRes?.photoUrl) {
              setUploadedPhotoUrl(uploadRes.photoUrl);
            }
          } catch (uploadErr) {
            console.warn("Photo upload warning:", uploadErr);
            setErrorMessage(
              "Customer record was created, but uploading the shop storefront photo encountered an error. You can retry from the customer details."
            );
            setSaved(true);
            return;
          }
        }
      }

      setSaved(true);
    } catch (err: unknown) {
      setErrorMessage(
        err instanceof ApiError
          ? err.message
          : "Failed to create record. Please review your fields and try again."
      );
    } finally {
      setIsSubmitting(false);
      setSubmissionStep("");
    }
  };

  return (
    <DashboardShell
      role={role}
      workspace={workspace}
      userName={userName}
      userDetail={userDetail}
      navigation={navigation}
    >
      <Link href={backHref} className="inline-flex items-center gap-2 text-xs font-bold text-zinc-500 hover:text-[#E61C5D]">
        <ArrowLeft className="h-4 w-4" />Back to {seller ? "sellers" : "customers"}
      </Link>

      <div className="mt-7">
        <PageHeading
          eyebrow={seller ? "Seller onboarding" : "Customer onboarding"}
          title={seller ? "Add seller" : "Add customer"}
          description={
            seller
              ? "Create credentials for a Seller, assign their territory, and link them to their reporting Manager."
              : "Create a verified customer / shop record with category, contact, photo, and geolocation coordinates."
          }
        />
      </div>

      <SectionCard
        title={seller ? "Seller information" : "Customer information"}
        description="Complete the required fields to save this record to the database"
        className="mt-8"
      >
        <form className="max-w-3xl space-y-5" onSubmit={handleSubmit}>
          {errorMessage && (
            <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-xs font-semibold text-[#B4234D]">
              {errorMessage}
            </div>
          )}

          <div className="grid gap-5 sm:grid-cols-2">
            <label className="block text-xs font-bold text-zinc-700">
              {seller ? "Seller name *" : "Shop / customer name *"}
              <input
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="mt-2 h-12 w-full rounded-xl border border-zinc-200 bg-[#FAF8F5] px-3 text-sm outline-none focus:border-rose-300 focus:ring-2 focus:ring-rose-100"
                placeholder={seller ? "Ananya Deshmukh" : "ABC General Store"}
              />
            </label>
            <label className="block text-xs font-bold text-zinc-700">
              {seller ? "Contact number (with country code) *" : "Shopkeeper / contact person name *"}
              <input
                required
                value={seller ? phone : contactName}
                onChange={(e) => (seller ? setPhone(e.target.value) : setContactName(e.target.value))}
                className="mt-2 h-12 w-full rounded-xl border border-zinc-200 bg-[#FAF8F5] px-3 text-sm outline-none focus:border-rose-300 focus:ring-2 focus:ring-rose-100"
                placeholder={seller ? "+919876542108" : "Ramesh Patel"}
              />
            </label>
          </div>

          {seller ? (
            <div className="grid gap-5 sm:grid-cols-3">
              <label className="block text-xs font-bold text-zinc-700">
                Login email
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="mt-2 h-12 w-full rounded-xl border border-zinc-200 bg-[#FAF8F5] px-3 text-sm outline-none focus:border-rose-300 focus:ring-2 focus:ring-rose-100"
                  placeholder="seller@femmeflo.com"
                />
              </label>
              <label className="block text-xs font-bold text-zinc-700">
                Temporary password *
                <input
                  type="text"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="mt-2 h-12 w-full rounded-xl border border-zinc-200 bg-[#FAF8F5] px-3 text-sm outline-none focus:border-rose-300 focus:ring-2 focus:ring-rose-100"
                  placeholder="At least 12 chars"
                />
              </label>
              {role === "Super Admin" && managers.length > 0 && (
                <label className="block text-xs font-bold text-zinc-700">
                  Reporting manager
                  <select
                    value={selectedManagerId}
                    onChange={(e) => setSelectedManagerId(e.target.value)}
                    className="mt-2 h-12 w-full rounded-xl border border-zinc-200 bg-[#FAF8F5] px-3 text-sm"
                  >
                    {managers.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name} ({m.district || "Territory"})
                      </option>
                    ))}
                  </select>
                </label>
              )}
            </div>
          ) : (
            <div className="grid gap-5 sm:grid-cols-3">
              <label className="block text-xs font-bold text-zinc-700">
                Phone number *
                <input
                  required
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="mt-2 h-12 w-full rounded-xl border border-zinc-200 bg-[#FAF8F5] px-3 text-sm outline-none focus:border-rose-300 focus:ring-2 focus:ring-rose-100"
                  placeholder="+919876542108"
                />
              </label>
              <label className="block text-xs font-bold text-zinc-700">
                Customer category *
                <select
                  required
                  value={selectedCategoryId}
                  onChange={(e) => setSelectedCategoryId(e.target.value)}
                  className="mt-2 h-12 w-full rounded-xl border border-zinc-200 bg-[#FAF8F5] px-3 text-sm font-semibold outline-none focus:border-rose-300"
                >
                  {isLoadingCategories ? (
                    <option value="">Loading categories...</option>
                  ) : categories.length === 0 ? (
                    <option value="">No categories available</option>
                  ) : (
                    categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))
                  )}
                </select>
              </label>
              {sellers.length > 0 && (
                <label className="block text-xs font-bold text-zinc-700">
                  Assigned seller
                  <select
                    value={selectedSellerId}
                    onChange={(e) => setSelectedSellerId(e.target.value)}
                    className="mt-2 h-12 w-full rounded-xl border border-zinc-200 bg-[#FAF8F5] px-3 text-sm"
                  >
                    {sellers.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} ({s.village || s.district || "Field"})
                      </option>
                    ))}
                  </select>
                </label>
              )}
            </div>
          )}

          <div className="grid gap-5 sm:grid-cols-3">
            <label className="block text-xs font-bold text-zinc-700">
              State *
              <input
                required
                value={state}
                onChange={(e) => setState(e.target.value)}
                className="mt-2 h-12 w-full rounded-xl border border-zinc-200 bg-[#FAF8F5] px-3 text-sm"
                placeholder="Maharashtra"
              />
            </label>
            <label className="block text-xs font-bold text-zinc-700">
              District *
              <input
                required
                value={district}
                onChange={(e) => setDistrict(e.target.value)}
                className="mt-2 h-12 w-full rounded-xl border border-zinc-200 bg-[#FAF8F5] px-3 text-sm"
                placeholder="Thane"
              />
            </label>
            <label className="block text-xs font-bold text-zinc-700">
              Village / town *
              <input
                required
                value={village}
                onChange={(e) => setVillage(e.target.value)}
                className="mt-2 h-12 w-full rounded-xl border border-zinc-200 bg-[#FAF8F5] px-3 text-sm"
                placeholder="Diva"
              />
            </label>
          </div>

          {!seller && (
            <div className="space-y-2">
              <label className="block text-xs font-bold text-zinc-700">
                Storefront Photo & GPS Coordinates
              </label>
              <div className="grid gap-3 sm:grid-cols-2">
                {/* Photo Upload Card */}
                <div className="flex flex-col justify-between rounded-xl border border-zinc-200 bg-[#FAF8F5] p-3">
                  {photoPreview ? (
                    <div className="flex items-center gap-3">
                      <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg border border-rose-200 bg-white">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={photoPreview}
                          alt="Shop storefront preview"
                          className="h-full w-full object-cover"
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                          <p className="truncate text-xs font-bold text-zinc-800">
                            {photoFile?.name}
                          </p>
                        </div>
                        <p className="text-[11px] text-zinc-500">
                          {photoFile ? `${(photoFile.size / (1024 * 1024)).toFixed(2)} MB · Ready to upload` : ""}
                        </p>
                        <div className="mt-1 flex items-center gap-2">
                          <label className="cursor-pointer text-[11px] font-bold text-[#E61C5D] hover:underline">
                            Change
                            <input
                              type="file"
                              accept="image/jpeg,image/png,image/webp"
                              capture="environment"
                              className="sr-only"
                              onChange={handleFileChange}
                            />
                          </label>
                          <span className="text-zinc-300">·</span>
                          <button
                            type="button"
                            onClick={handleRemovePhoto}
                            className="inline-flex items-center gap-1 text-[11px] font-bold text-zinc-500 hover:text-rose-600"
                          >
                            <Trash2 className="h-3 w-3" /> Remove
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <label className="flex h-full min-h-[88px] cursor-pointer flex-col items-center justify-center gap-1.5 rounded-lg border border-dashed border-rose-200 bg-[#FFF8FA] p-3 text-center transition hover:bg-rose-50">
                      <div className="flex items-center gap-1.5 text-[#E61C5D]">
                        <Camera className="h-4 w-4" />
                        <span className="text-xs font-bold">Upload / capture shop photo</span>
                      </div>
                      <span className="text-[11px] text-zinc-400">
                        JPEG, PNG, WebP up to 5 MB
                      </span>
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        capture="environment"
                        className="sr-only"
                        onChange={handleFileChange}
                      />
                    </label>
                  )}
                  {photoError && (
                    <p className="mt-2 text-xs font-medium text-rose-600">{photoError}</p>
                  )}
                </div>

                {/* GPS Coordinates Card */}
                <div className="flex flex-col justify-center rounded-xl border border-zinc-200 bg-[#FAF8F5] p-3">
                  <button
                    type="button"
                    onClick={capture}
                    className="flex h-full min-h-[88px] flex-col items-center justify-center gap-1.5 rounded-lg border border-dashed border-rose-200 bg-[#FFF8FA] p-3 text-center transition hover:bg-rose-50"
                  >
                    <div className="flex items-center gap-1.5 text-[#E61C5D]">
                      <MapPin className="h-4 w-4" />
                      <span className="text-xs font-bold">
                        {location || "Detect current GPS coordinates"}
                      </span>
                    </div>
                    <span className="text-[11px] text-zinc-400">
                      {lat !== undefined && lng !== undefined
                        ? "✓ Verified storefront coordinates"
                        : "Tap to record shop location"}
                    </span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {saved ? (
            <div className="space-y-4">
              <div className="rounded-xl bg-emerald-50 p-4 text-sm font-bold text-[#157347]">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-[#157347]" />
                  <span>
                    {seller
                      ? "Seller successfully created!"
                      : "Customer record and storefront photo successfully saved!"}
                  </span>
                </div>
                {(uploadedPhotoUrl || photoPreview) && (
                  <div className="mt-3 flex items-center gap-3 rounded-xl border border-emerald-200 bg-white/80 p-2.5">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={uploadedPhotoUrl || photoPreview || ""}
                      alt="Uploaded storefront"
                      className="h-14 w-14 rounded-lg object-cover border border-emerald-100 shrink-0"
                    />
                    <div className="min-w-0">
                      <p className="font-bold text-zinc-900 truncate">{name}</p>
                      <p className="text-xs text-emerald-700 font-semibold">✓ Storefront photo verified</p>
                      <p className="text-[11px] text-zinc-500 truncate">{village}, {district}</p>
                    </div>
                  </div>
                )}
              </div>
              <Link
                href={backHref}
                className="inline-block rounded-xl bg-[#156035] px-5 py-3 text-xs font-bold text-white hover:bg-[#0f4e2b]"
              >
                Return to {seller ? "Sellers" : "Customers"} Directory
              </Link>
            </div>
          ) : (
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex h-12 items-center justify-center gap-2 rounded-xl bg-[#E61C5D] px-6 text-sm font-bold text-white shadow-[0_8px_20px_rgba(230,28,93,0.18)] transition hover:bg-[#c91550] disabled:opacity-70"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> {submissionStep || "Saving record..."}
                </>
              ) : (
                `Save ${seller ? "seller" : "customer"}`
              )}
            </button>
          )}

          <p className="text-xs text-zinc-400">
            Connected to endpoint{" "}
            <code className="rounded bg-rose-50 px-1 py-0.5 font-mono text-[11px] text-[#E61C5D]">
              {seller
                ? `POST /api/v1/${role === "Super Admin" ? "admin" : "manager"}/sellers`
                : `POST /api/v1/${role === "Super Admin" ? "admin" : role === "Manager" ? "manager" : "seller"}/customers & /photo`}
            </code>
          </p>
        </form>
      </SectionCard>
    </DashboardShell>
  );
}
