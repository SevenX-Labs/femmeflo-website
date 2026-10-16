"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowLeft, Camera, CheckCircle2, ExternalLink, Image as ImageIcon, Loader2, MapPin, Sparkles, Trash2, Upload } from "lucide-react";
import { DashboardShell, PageHeading, SectionCard } from "./DashboardShell";
import type { NavigationItem } from "./DashboardShell";
import { adminApi } from "@/lib/api/admin";
import { managerApi } from "@/lib/api/manager";
import { sellerApi } from "@/lib/api/seller";
import { categoryApi } from "@/lib/api/categories";
import type { Category, ManagerItem, PincodeLookupResponse, SellerItem } from "@/lib/api/types";
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
  const [isLocating, setIsLocating] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);

  // Address & Pincode Auto-lookup states
  const [pincode, setPincode] = useState("");
  const [shopNumber, setShopNumber] = useState("");
  const [streetName, setStreetName] = useState("");
  const [isPincodeLoading, setIsPincodeLoading] = useState(false);
  const [pincodeMessage, setPincodeMessage] = useState<string | null>(null);
  const [availableVillages, setAvailableVillages] = useState<string[]>([]);

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
              // 100% dynamic: load all active categories directly from database
              const activeCats = list
                .filter((c: any) => c.active !== false)
                .sort((a: any, b: any) => a.name.localeCompare(b.name));

              setCategories(activeCats);
              if (activeCats.length > 0) {
                setSelectedCategoryId(activeCats[0].id);
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

  // Capturing Live GPS Location in Frontend
  const handleGetCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser/device.");
      setLocationError("Geolocation is not supported by your browser/device.");
      return;
    }

    setIsLocating(true);
    setLocationError(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const latitude = Number(position.coords.latitude.toFixed(6));
        const longitude = Number(position.coords.longitude.toFixed(6));

        setLat(latitude);
        setLng(longitude);
        setLocation(`${latitude}, ${longitude}`);
        setIsLocating(false);

        console.log("Captured Location:", { latitude, longitude });
      },
      (error) => {
        setIsLocating(false);
        let errorMsg = "An unknown error occurred while retrieving location.";
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMsg = "Location permission denied. Please allow location access in your browser settings.";
            break;
          case error.POSITION_UNAVAILABLE:
            errorMsg = "Location information is unavailable. Ensure device GPS is on.";
            break;
          case error.TIMEOUT:
            errorMsg = "Location request timed out.";
            break;
          default:
            errorMsg = "An unknown error occurred while retrieving location.";
            break;
        }
        setLocationError(errorMsg);
        alert(errorMsg);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  };

  // Automatic PIN Code Lookup Helper
  const handlePincodeChange = async (value: string) => {
    const cleaned = value.replace(/\D/g, "").slice(0, 6);
    setPincode(cleaned);
    setPincodeMessage(null);

    if (cleaned.length === 6 && /^[1-9][0-9]{5}$/.test(cleaned)) {
      try {
        setIsPincodeLoading(true);
        let res: PincodeLookupResponse;
        if (role === "Super Admin") {
          res = await adminApi.lookupPincode(cleaned);
        } else if (role === "Manager") {
          res = await managerApi.lookupPincode(cleaned);
        } else {
          res = await sellerApi.lookupPincode(cleaned);
        }

        if (res.state || res.district) {
          if (res.state) setState(res.state);
          if (res.district) setDistrict(res.district);
          if (res.village) setVillage(res.village);
          if (res.villages && res.villages.length > 0) {
            setAvailableVillages(res.villages);
          } else {
            setAvailableVillages([]);
          }
          setPincodeMessage(`✓ Autofilled: ${res.village || res.district}, ${res.state}`);
        } else {
          setPincodeMessage("PIN code details not found. Enter address manually.");
        }
      } catch (err) {
        console.warn("Pincode lookup failed:", err);
      } finally {
        setIsPincodeLoading(false);
      }
    } else {
      setAvailableVillages([]);
    }
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
        // If Manager or Admin, sellerId is required
        if (role === "Super Admin" || role === "Manager") {
          if (!selectedSellerId) {
            if (sellers.length === 0) {
              setErrorMessage("No field sellers exist in the system yet. Please onboard at least one Seller before adding customer shops.");
            } else {
              setErrorMessage("Please select an assigned field seller for this customer.");
            }
            setIsSubmitting(false);
            return;
          }
        }

        // Submitting Customer with Photo & Location (Single Request multipart/form-data)
        const formattedPhone = phone.startsWith("+") ? phone : `+91${phone.replace(/\D/g, "")}`;
        const formData = new FormData();

        // Text fields
        formData.append("shopName", name);
        formData.append("contactName", contactName || name);
        formData.append("phone", formattedPhone);
        if (email) formData.append("email", email);
        formData.append("categoryId", selectedCategoryId);

        // Address fields
        if (shopNumber) formData.append("shopNumber", shopNumber);
        if (streetName) formData.append("streetName", streetName);
        if (pincode) formData.append("pincode", pincode);
        formData.append("state", state);
        formData.append("district", district);
        formData.append("village", village);

        // GPS Coordinates (from Get Current Location)
        if (lat !== undefined) formData.append("latitude", lat.toString());
        if (lng !== undefined) formData.append("longitude", lng.toString());

        // Storefront Photo File (Captured via camera or file picker)
        if (photoFile) {
          formData.append("photo", photoFile);
        }

        if ((role === "Super Admin" || role === "Manager") && selectedSellerId) {
          formData.append("sellerId", selectedSellerId);
        }

        setSubmissionStep(photoFile ? "Uploading storefront photo & saving customer…" : "Saving customer profile…");

        let res: { customer: unknown; photoUrl?: string };
        if (role === "Super Admin") {
          res = await adminApi.createCustomer(formData);
        } else if (role === "Manager") {
          res = await managerApi.createCustomer(formData);
        } else {
          res = await sellerApi.createCustomer(formData);
        }

        const finalPhotoUrl = res.photoUrl || (res.customer as any)?.photoPath;
        if (finalPhotoUrl) {
          setUploadedPhotoUrl(finalPhotoUrl);
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
      <Link href={backHref} className="inline-flex items-center gap-2 text-xs font-bold text-zinc-800 hover:text-[#E61C5D]">
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

          {!seller && (role === "Super Admin" || role === "Manager") && sellers.length === 0 && (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-xs font-medium text-amber-900">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="font-bold text-sm text-amber-950">Prerequisite Step Required: Onboard a Field Seller First</p>
                  <p className="mt-0.5 text-xs text-amber-850">
                    Every customer shop must be linked to an active field seller for delivery and commission. Currently, zero sellers exist in your system.
                  </p>
                </div>
                <Link
                  href={role === "Super Admin" ? "/admin/sellers/new" : "/manager/sellers/new"}
                  className="inline-flex items-center gap-1 rounded-lg bg-[#E61C5D] px-3.5 py-2 font-bold text-white shadow-sm hover:bg-[#c91550] shrink-0"
                >
                  + Add Seller First
                </Link>
              </div>
            </div>
          )}

          {seller ? (
            <>
              <div className="grid gap-5 sm:grid-cols-2">
                <label className="block text-xs font-bold text-zinc-700">
                  Seller name *
                  <input
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="mt-2 h-12 w-full rounded-xl border border-zinc-200 bg-[#FAF8F5] px-3 text-sm outline-none focus:border-rose-300 focus:ring-2 focus:ring-rose-100"
                    placeholder="Enter full name"
                  />
                </label>
                <label className="block text-xs font-bold text-zinc-700">
                  Contact number (with country code) *
                  <input
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="mt-2 h-12 w-full rounded-xl border border-zinc-200 bg-[#FAF8F5] px-3 text-sm outline-none focus:border-rose-300 focus:ring-2 focus:ring-rose-100"
                    placeholder="Enter 10-digit mobile number"
                  />
                </label>
              </div>

              <div className="grid gap-5 sm:grid-cols-3">
                <label className="block text-xs font-bold text-zinc-700">
                  Login email
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="mt-2 h-12 w-full rounded-xl border border-zinc-200 bg-[#FAF8F5] px-3 text-sm outline-none focus:border-rose-300 focus:ring-2 focus:ring-rose-100"
                    placeholder="Enter seller email address"
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
            </>
          ) : (
            <>
              {/* Section A: Shopkeeper & Store Details */}
              <div className="space-y-4">
                <div className="border-b border-zinc-200/60 pb-2">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[#E61C5D]">
                    A. Shopkeeper &amp; Store Details
                  </h3>
                  <p className="text-[11px] text-zinc-800">
                    Core retail shopkeeper credentials and category classification
                  </p>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="block text-xs font-bold text-zinc-700">
                    Store name *
                    <input
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="mt-1.5 h-11 w-full rounded-xl border border-zinc-200 bg-[#FAF8F5] px-3 text-sm outline-none focus:border-rose-300 focus:ring-2 focus:ring-rose-100"
                      placeholder="Sai Krupa General Store"
                    />
                  </label>

                  <label className="block text-xs font-bold text-zinc-700">
                    Shopkeeper name *
                    <input
                      required
                      value={contactName}
                      onChange={(e) => setContactName(e.target.value)}
                      className="mt-1.5 h-11 w-full rounded-xl border border-zinc-200 bg-[#FAF8F5] px-3 text-sm outline-none focus:border-rose-300 focus:ring-2 focus:ring-rose-100"
                      placeholder="Sanjay Gupta"
                    />
                  </label>
                </div>

                <div className="grid gap-4 sm:grid-cols-3">
                  <label className="block text-xs font-bold text-zinc-700">
                    Contact phone *
                    <input
                      required
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="mt-1.5 h-11 w-full rounded-xl border border-zinc-200 bg-[#FAF8F5] px-3 text-sm outline-none focus:border-rose-300 focus:ring-2 focus:ring-rose-100"
                      placeholder="+919876549911"
                    />
                  </label>

                  <label className="block text-xs font-bold text-zinc-700">
                    Category *
                    <select
                      required
                      value={selectedCategoryId}
                      onChange={(e) => setSelectedCategoryId(e.target.value)}
                      className="mt-1.5 h-11 w-full rounded-xl border border-zinc-200 bg-[#FAF8F5] px-3 text-sm font-semibold outline-none focus:border-rose-300"
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

                  <label className="block text-xs font-bold text-zinc-700">
                    Email address (optional)
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="mt-1.5 h-11 w-full rounded-xl border border-zinc-200 bg-[#FAF8F5] px-3 text-sm outline-none focus:border-rose-300 focus:ring-2 focus:ring-rose-100"
                      placeholder="shop@example.com"
                    />
                  </label>
                </div>

                {(role === "Super Admin" || role === "Manager") && (
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-zinc-700">
                      Assigned Field Seller *
                    </label>
                    {sellers.length > 0 ? (
                      <select
                        required
                        value={selectedSellerId}
                        onChange={(e) => setSelectedSellerId(e.target.value)}
                        className="h-11 w-full rounded-xl border border-zinc-200 bg-[#FAF8F5] px-3 text-sm font-semibold outline-none focus:border-rose-300 focus:ring-2 focus:ring-rose-100"
                      >
                        <option value="">Select a field seller...</option>
                        {sellers.map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.name} ({s.village || s.district || "Field operations"})
                          </option>
                        ))}
                      </select>
                    ) : (
                      <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                          <span>
                            ⚠️ <strong>No field sellers found.</strong> Every customer must be assigned to an active field seller.
                          </span>
                          <Link
                            href={role === "Super Admin" ? "/admin/sellers/new" : "/manager/sellers/new"}
                            className="inline-flex items-center gap-1 rounded-lg bg-[#E61C5D] px-2.5 py-1 text-xs font-bold text-white hover:bg-[#c91550] shrink-0"
                          >
                            + Onboard Seller First
                          </Link>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Section B: Address & Auto-Fetch by Pincode */}
              <div className="space-y-4 pt-2">
                <div className="flex items-center justify-between border-b border-zinc-200/60 pb-2">
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-[#E61C5D]">
                      B. Address &amp; Auto-Fetch by PIN Code
                    </h3>
                    <p className="text-[11px] text-zinc-800">
                      Enter 6-digit Indian PIN code to automatically retrieve State, District &amp; Village
                    </p>
                  </div>
                  {isPincodeLoading && (
                    <div className="inline-flex items-center gap-1.5 rounded-full bg-rose-50 px-2.5 py-1 text-[11px] font-bold text-[#E61C5D]">
                      <Loader2 className="h-3 w-3 animate-spin" />
                      <span>Fetching location...</span>
                    </div>
                  )}
                </div>

                <div className="grid gap-4 sm:grid-cols-3">
                  <label className="block text-xs font-bold text-zinc-700 sm:col-span-1">
                    PIN code (6 digits) *
                    <div className="relative mt-1.5">
                      <input
                        type="text"
                        inputMode="numeric"
                        maxLength={6}
                        value={pincode}
                        onChange={(e) => handlePincodeChange(e.target.value)}
                        onBlur={() => {
                          if (pincode.length === 6 && !state) {
                            handlePincodeChange(pincode);
                          }
                        }}
                        className="h-11 w-full rounded-xl border border-zinc-200 bg-[#FAF8F5] px-3 text-sm font-mono tracking-wider outline-none focus:border-rose-300 focus:ring-2 focus:ring-rose-100"
                        placeholder="400053"
                      />
                      {isPincodeLoading && (
                        <div className="absolute right-3 top-3">
                          <Loader2 className="h-4 w-4 animate-spin text-[#E61C5D]" />
                        </div>
                      )}
                    </div>
                    {pincodeMessage && (
                      <p className="mt-1 text-[11px] font-medium text-emerald-700">{pincodeMessage}</p>
                    )}
                  </label>

                  <label className="block text-xs font-bold text-zinc-700 sm:col-span-1">
                    Shop / Unit number (optional)
                    <input
                      value={shopNumber}
                      onChange={(e) => setShopNumber(e.target.value)}
                      className="mt-1.5 h-11 w-full rounded-xl border border-zinc-200 bg-[#FAF8F5] px-3 text-sm outline-none focus:border-rose-300 focus:ring-2 focus:ring-rose-100"
                      placeholder="Shop No. 12, Ground Floor"
                    />
                  </label>

                  <label className="block text-xs font-bold text-zinc-700 sm:col-span-1">
                    Street name / landmark (optional)
                    <input
                      value={streetName}
                      onChange={(e) => setStreetName(e.target.value)}
                      className="mt-1.5 h-11 w-full rounded-xl border border-zinc-200 bg-[#FAF8F5] px-3 text-sm outline-none focus:border-rose-300 focus:ring-2 focus:ring-rose-100"
                      placeholder="Station Road / Opposite Bank"
                    />
                  </label>
                </div>

                <div className="grid gap-4 sm:grid-cols-3">
                  <label className="block text-xs font-bold text-zinc-700">
                    State *
                    <input
                      required
                      value={state}
                      onChange={(e) => setState(e.target.value)}
                      className="mt-1.5 h-11 w-full rounded-xl border border-zinc-200 bg-[#FAF8F5] px-3 text-sm"
                      placeholder="Maharashtra"
                    />
                  </label>

                  <label className="block text-xs font-bold text-zinc-700">
                    District *
                    <input
                      required
                      value={district}
                      onChange={(e) => setDistrict(e.target.value)}
                      className="mt-1.5 h-11 w-full rounded-xl border border-zinc-200 bg-[#FAF8F5] px-3 text-sm"
                      placeholder="Mumbai"
                    />
                  </label>

                  <label className="block text-xs font-bold text-zinc-700">
                    Village / locality *
                    <input
                      required
                      value={village}
                      onChange={(e) => setVillage(e.target.value)}
                      className="mt-1.5 h-11 w-full rounded-xl border border-zinc-200 bg-[#FAF8F5] px-3 text-sm"
                      placeholder="Andheri"
                    />
                  </label>
                </div>

                {availableVillages.length > 1 && (
                  <div className="rounded-xl border border-rose-100 bg-[#FFF8FA] p-2.5">
                    <p className="text-[11px] font-bold text-[#E61C5D]">
                      Multiple localities detected for PIN {pincode}. Tap to select:
                    </p>
                    <div className="mt-1.5 flex flex-wrap gap-1.5">
                      {availableVillages.map((v) => (
                        <button
                          key={v}
                          type="button"
                          onClick={() => setVillage(v)}
                          className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition cursor-pointer ${
                            village === v
                              ? "bg-[#E61C5D] text-white shadow-xs"
                              : "bg-white border border-rose-200 text-zinc-700 hover:border-[#E61C5D]"
                          }`}
                        >
                          {v}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </>
          )}

          {!seller && (
            <div className="space-y-4 pt-2">
              <div className="border-b border-zinc-200/60 pb-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#E61C5D]">
                  C. Live Location &amp; Storefront Photo
                </h3>
                <p className="text-[11px] text-zinc-800">
                  Record real-time device GPS coordinates and attach storefront photo
                </p>
              </div>
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
                        <p className="text-[11px] text-zinc-800">
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
                            className="inline-flex items-center gap-1 text-[11px] font-bold text-zinc-800 hover:text-rose-600"
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
                      <span className="text-[11px] text-zinc-700">
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
                <div className="flex flex-col justify-between rounded-xl border border-zinc-200 bg-[#FAF8F5] p-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-800">
                      Live GPS Location
                    </span>
                    {lat !== undefined && lng !== undefined && (
                      <span className="text-[11px] font-semibold text-emerald-700">✓ Coordinates Acquired</span>
                    )}
                  </div>

                  <div className="mt-2 space-y-2">
                    <button
                      type="button"
                      onClick={handleGetCurrentLocation}
                      disabled={isLocating}
                      className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-rose-300 bg-[#FFF8FA] py-2.5 px-3 text-xs font-bold text-[#E61C5D] transition hover:bg-rose-50 disabled:opacity-50 cursor-pointer"
                    >
                      {isLocating ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin text-[#E61C5D]" />
                          <span>Fetching live GPS...</span>
                        </>
                      ) : (
                        <>
                          <MapPin className="h-4 w-4 text-[#E61C5D]" />
                          <span>{lat !== undefined && lng !== undefined ? "Update GPS Location" : "Get Current Location"}</span>
                        </>
                      )}
                    </button>

                    {lat !== undefined && lng !== undefined ? (
                      <div className="rounded-lg border border-emerald-200 bg-white p-2.5 text-xs shadow-xs">
                        <div className="flex items-center justify-between font-mono text-[11px] text-zinc-700">
                          <span>Lat: <strong>{lat.toFixed(6)}</strong></span>
                          <span>Lng: <strong>{lng.toFixed(6)}</strong></span>
                        </div>
                        <div className="mt-1.5 flex items-center justify-between">
                          <a
                            href={`https://www.google.com/maps?q=${lat},${lng}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-600 hover:underline"
                          >
                            📍 View on Google Maps
                            <ExternalLink className="h-3 w-3" />
                          </a>
                          <span className="text-[10px] text-zinc-700 font-mono">6-decimal GPS</span>
                        </div>
                      </div>
                    ) : (
                      <span className="block text-[11px] text-zinc-700 text-center">
                        Tap &apos;Get Current Location&apos; to capture device GPS
                      </span>
                    )}

                    {locationError && (
                      <p className="text-[11px] font-medium text-rose-600">{locationError}</p>
                    )}
                  </div>
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
                      <p className="text-[11px] text-zinc-900 truncate">
                        {[shopNumber, streetName, village, district, state, pincode].filter(Boolean).join(", ") || `${village}, ${district}`}
                      </p>
                      {lat !== undefined && lng !== undefined && (
                        <a
                          href={`https://www.google.com/maps?q=${lat},${lng}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-1 inline-flex items-center gap-1 text-[11px] font-semibold text-blue-600 hover:underline"
                        >
                          📍 View on Google Maps ({lat}, {lng})
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      )}
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
              disabled={isSubmitting || (!seller && (role === "Super Admin" || role === "Manager") && sellers.length === 0)}
              className="flex h-12 items-center justify-center gap-2 rounded-xl bg-[#E61C5D] px-6 text-sm font-bold text-white shadow-[0_8px_20px_rgba(230,28,93,0.18)] transition hover:bg-[#c91550] disabled:opacity-50 disabled:cursor-not-allowed"
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
        </form>
      </SectionCard>
    </DashboardShell>
  );
}
