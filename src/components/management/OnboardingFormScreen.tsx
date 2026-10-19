"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { AlertCircle, ArrowLeft, Camera, CheckCircle2, ExternalLink, Image as ImageIcon, Loader2, MapPin, Sparkles, Trash2, Upload, X } from "lucide-react";
import { DashboardShell, PageHeading, SectionCard } from "./DashboardShell";
import type { NavigationItem } from "./DashboardShell";
import { adminApi } from "@/lib/api/admin";
import { managerApi } from "@/lib/api/manager";
import { sellerApi } from "@/lib/api/seller";
import { categoryApi } from "@/lib/api/categories";
import type { Category, ManagerItem, PincodeLookupResponse, SellerItem } from "@/lib/api/types";
import { ApiError } from "@/lib/api/client";
import { validateMobileNumber, validateEmail, validateAadharNumber } from "@/lib/validation";

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
  const router = useRouter();
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

  // Seller / Field Officer specific fields
  const [managers, setManagers] = useState<ManagerItem[]>([]);
  const [selectedManagerId, setSelectedManagerId] = useState("");
  const [designation, setDesignation] = useState("Field Sales Officer");
  const [employeeCode, setEmployeeCode] = useState("");
  const [alternatePhone, setAlternatePhone] = useState("");
  const [address, setAddress] = useState("");
  const [officerStatus, setOfficerStatus] = useState<"Active" | "Inactive">("Active");
  const [aadharNumber, setAadharNumber] = useState("");
  const [drivingLicense, setDrivingLicense] = useState("");
  const [education, setEducation] = useState("12th Standard / HSC");

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
  const [errorDialog, setErrorDialog] = useState<{ title: string; message: string; details?: string } | null>(null);

  const showErrorModal = (message: string, title = "Onboarding Issue", details?: string) => {
    setErrorMessage(message);
    setErrorDialog({ title, message, details });
  };

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
              const firstMgr = mgrRes.managers[0];
              if (firstMgr.state) setState((prev) => prev || firstMgr.state || "");
              if (firstMgr.district) setDistrict((prev) => prev || firstMgr.district || "");
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
      showErrorModal("Geolocation is not supported by your browser/device.", "Location Access Error");
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
        showErrorModal(errorMsg, "Location Error");
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

    // Validate 10-digit mobile phone
    const phoneVal = validateMobileNumber(phone);
    if (!phoneVal.isValid) {
      showErrorModal(phoneVal.error || "Please enter a valid 10-digit mobile number.", "Invalid Phone Number");
      return;
    }

    // Validate email if entered
    if (email) {
      const emailVal = validateEmail(email);
      if (!emailVal.isValid) {
        showErrorModal(emailVal.error || "Please enter a valid email address.", "Invalid Email Address");
        return;
      }
    }

    setIsSubmitting(true);
    setSubmissionStep("Saving record…");

    try {
      if (seller) {
        // Primary phone validation
        const phoneVal = validateMobileNumber(phone);
        if (!phoneVal.isValid) {
          showErrorModal(phoneVal.error || "Please enter a valid 10-digit primary mobile number.", "Invalid Phone Number");
          setIsSubmitting(false);
          return;
        }

        // Alternate phone validation (Phone 2) with NO DUPLICATION check
        let altPhoneNormalized = undefined;
        if (alternatePhone && alternatePhone.trim()) {
          const altVal = validateMobileNumber(alternatePhone);
          if (!altVal.isValid) {
            showErrorModal("Alternate phone: " + (altVal.error || "Please enter a valid 10-digit mobile number."), "Invalid Alternate Phone");
            setIsSubmitting(false);
            return;
          }
          const p1 = phoneVal.normalized.replace(/\D/g, "").slice(-10);
          const p2 = altVal.normalized.replace(/\D/g, "").slice(-10);
          if (p1 === p2) {
            showErrorModal("Phone number 2 / alternate phone cannot be the same as Phone number 1 (no duplication allowed).", "Duplicate Phone Number");
            setIsSubmitting(false);
            return;
          }
          altPhoneNormalized = altVal.normalized;
        }

        // Email validation
        if (email && email.trim()) {
          const emailVal = validateEmail(email);
          if (!emailVal.isValid) {
            showErrorModal(emailVal.error || "Please enter a valid email address.", "Invalid Email Address");
            setIsSubmitting(false);
            return;
          }
        }

        // Aadhaar number validation
        let aadharNormalized = undefined;
        if (aadharNumber && aadharNumber.trim()) {
          const aadharVal = validateAadharNumber(aadharNumber);
          if (!aadharVal.isValid) {
            showErrorModal(aadharVal.error || "Please enter a valid 12-digit Aadhaar number.", "Invalid Aadhaar Number");
            setIsSubmitting(false);
            return;
          }
          aadharNormalized = aadharVal.normalized;
        }

        // Super Admin must select reporting manager if managers exist
        if (role === "Super Admin" && !selectedManagerId && managers.length > 0) {
          showErrorModal("Please select a reporting Manager for this field officer.", "Missing Reporting Manager");
          setIsSubmitting(false);
          return;
        }

        const sellerPayload = {
          name: name.trim(),
          designation: designation.trim() || "Field Sales Officer",
          employeeCode: employeeCode.trim() || undefined,
          phone: phoneVal.normalized,
          alternatePhone: altPhoneNormalized,
          email: email.trim() || undefined,
          password,
          address: (address.trim() || [streetName, shopNumber].filter(Boolean).join(", ").trim()) || undefined,
          pincode: pincode.trim() || undefined,
          state: state.trim() || undefined,
          district: district.trim() || undefined,
          village: village.trim() || undefined,
          active: officerStatus === "Active",
          aadharNumber: aadharNormalized,
          drivingLicense: drivingLicense.trim() || undefined,
          education: education.trim() || undefined,
          managerId: role === "Super Admin" ? selectedManagerId || undefined : undefined,
        };

        if (role === "Super Admin") {
          await adminApi.createSeller(sellerPayload);
        } else {
          await managerApi.createSeller(sellerPayload);
        }
      } else {
        // If Manager or Admin, sellerId is required
        if (role === "Super Admin" || role === "Manager") {
          if (!selectedSellerId) {
            if (sellers.length === 0) {
              showErrorModal("No field sellers exist in the system yet. Please onboard at least one Seller before adding customer shops.", "No Field Officers Found");
            } else {
              showErrorModal("Please select an assigned field seller for this customer.", "Missing Assigned Seller");
            }
            setIsSubmitting(false);
            return;
          }
        }

        // Submitting Customer with Photo & Location (Single Request multipart/form-data)
        const formData = new FormData();

        // Text fields
        formData.append("shopName", name);
        formData.append("contactName", contactName || name);
        formData.append("phone", phoneVal.normalized);
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
      setTimeout(() => {
        router.push(backHref);
      }, 700);
    } catch (err: unknown) {
      const msg =
        err instanceof ApiError
          ? err.message
          : (err as any)?.message || "Failed to create record. Please review your fields and try again.";
      const status = err instanceof ApiError ? ` (HTTP ${err.statusCode})` : "";
      const extra = (err as any)?.data ? JSON.stringify((err as any).data, null, 2) : undefined;
      showErrorModal(
        msg,
        seller ? "Field Officer Onboarding Failed" : "Customer Onboarding Failed",
        extra ? `Server Response${status}:\n${extra}` : (status ? `Status Code: ${status}` : undefined)
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
          eyebrow={seller ? "Field Team Onboarding" : "Customer onboarding"}
          title={seller ? "Add Field Officer" : "Add customer"}
          description={
            seller
              ? "Create credentials for a Field Officer, assign their territory, and link them to their reporting Manager."
              : "Create a verified customer / shop record with category, contact, photo, and geolocation coordinates."
          }
        />
      </div>

      <SectionCard
        title={seller ? "Officer information" : "Customer information"}
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
                  <p className="font-bold text-sm text-amber-950">Prerequisite Step Required: Onboard a Field Officer First</p>
                  <p className="mt-0.5 text-xs text-amber-850">
                    Every customer shop must be linked to an active field seller for delivery and commission. Currently, zero sellers exist in your system.
                  </p>
                </div>
                <Link
                  href={role === "Super Admin" ? "/admin/sellers/new" : "/manager/sellers/new"}
                  className="inline-flex items-center gap-1 rounded-lg bg-[#E61C5D] px-3.5 py-2 font-bold text-white shadow-sm hover:bg-[#c91550] shrink-0"
                >
                  + Add Field Officer First
                </Link>
              </div>
            </div>
          )}

          {seller ? (
            <div className="space-y-6">
              {/* Section 1: Employee Role & Identity */}
              <div className="space-y-4">
                <div className="border-b border-zinc-200/60 pb-2">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[#E61C5D]">
                    1. Employee Identity &amp; Role Assignment
                  </h3>
                  <p className="text-[11px] text-zinc-600">
                    Official officer identification, designation, status, and reporting manager
                  </p>
                </div>

                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  <label className="block text-xs font-bold text-zinc-700">
                    Employee Name *
                    <input
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="mt-1.5 h-11 w-full rounded-xl border border-zinc-200 bg-[#FAF8F5] px-3 text-sm outline-none focus:border-rose-300 focus:ring-2 focus:ring-rose-100"
                      placeholder="e.g. Rahul Patil"
                    />
                  </label>

                  <label className="block text-xs font-bold text-zinc-700">
                    Designation *
                    <input
                      required
                      list="designation-list"
                      value={designation}
                      onChange={(e) => setDesignation(e.target.value)}
                      className="mt-1.5 h-11 w-full rounded-xl border border-zinc-200 bg-[#FAF8F5] px-3 text-sm outline-none focus:border-rose-300 focus:ring-2 focus:ring-rose-100"
                      placeholder="e.g. Field Sales Officer"
                    />
                    <datalist id="designation-list">
                      <option value="Field Sales Officer" />
                      <option value="Senior Field Executive" />
                      <option value="Area Sales Representative" />
                      <option value="Territory Distribution Officer" />
                      <option value="Field Business Associate" />
                    </datalist>
                  </label>

                  <label className="block text-xs font-bold text-zinc-700">
                    Employee Code
                    <input
                      value={employeeCode}
                      onChange={(e) => setEmployeeCode(e.target.value.toUpperCase())}
                      className="mt-1.5 h-11 w-full rounded-xl border border-zinc-200 bg-[#FAF8F5] px-3 font-mono text-sm uppercase outline-none focus:border-rose-300 focus:ring-2 focus:ring-rose-100"
                      placeholder="e.g. FF-FO-001"
                    />
                  </label>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <span className="block text-xs font-bold text-zinc-700 mb-1.5">Employment Status</span>
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => setOfficerStatus("Active")}
                        className={`flex-1 rounded-xl py-2.5 text-xs font-bold transition border cursor-pointer ${
                          officerStatus === "Active"
                            ? "bg-emerald-50 border-emerald-300 text-[#156035] ring-2 ring-emerald-100"
                            : "bg-[#FAF8F5] border-zinc-200 text-zinc-600 hover:bg-zinc-100"
                        }`}
                      >
                        ✓ Active (Authorized)
                      </button>
                      <button
                        type="button"
                        onClick={() => setOfficerStatus("Inactive")}
                        className={`flex-1 rounded-xl py-2.5 text-xs font-bold transition border cursor-pointer ${
                          officerStatus === "Inactive"
                            ? "bg-zinc-200 border-zinc-400 text-zinc-800 ring-2 ring-zinc-200"
                            : "bg-[#FAF8F5] border-zinc-200 text-zinc-600 hover:bg-zinc-100"
                        }`}
                      >
                        Inactive (Suspended)
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-zinc-700">
                      Assigned Reporting Manager *
                      {role === "Super Admin" ? (
                        managers.length > 0 ? (
                          <>
                          <select
                            required
                            value={selectedManagerId}
                            onChange={(e) => {
                              const newMgrId = e.target.value;
                              setSelectedManagerId(newMgrId);
                              const selectedMgr = managers.find((m) => m.id === newMgrId);
                              if (selectedMgr) {
                                if (selectedMgr.state) setState(selectedMgr.state);
                                if (selectedMgr.district) setDistrict(selectedMgr.district);
                              }
                            }}
                            className="mt-1.5 h-11 w-full rounded-xl border border-zinc-200 bg-[#FAF8F5] px-3 text-sm outline-none focus:border-rose-300"
                          >
                            <option value="">Select Reporting Manager</option>
                            {managers.map((m) => (
                              <option key={m.id} value={m.id}>
                                {m.name} ({[m.district, m.state].filter(Boolean).join(", ") || "Territory"})
                              </option>
                            ))}
                          </select>
                          {selectedManagerId && (() => {
                            const selectedMgr = managers.find((m) => m.id === selectedManagerId);
                            if (selectedMgr && (selectedMgr.district || selectedMgr.state)) {
                              return (
                                <p className="mt-1.5 text-[11px] font-medium text-emerald-800 flex items-center gap-1">
                                  ✓ Manager jurisdiction: {[selectedMgr.district, selectedMgr.state].filter(Boolean).join(", ")}
                                </p>
                              );
                            }
                            return null;
                          })()}
                          </>
                        ) : (
                          <p className="mt-1.5 rounded-xl border border-amber-200 bg-amber-50 p-2.5 text-xs text-amber-800">
                            No regional managers registered. Onboard a manager first.
                          </p>
                        )
                      ) : (
                        <div className="mt-1.5 flex h-11 items-center rounded-xl border border-emerald-100 bg-emerald-50/70 px-3 text-xs font-bold text-[#156035]">
                          Assigned to your territory supervision ({userName})
                        </div>
                      )}
                    </label>
                  </div>
                </div>
              </div>

              {/* Section 2: Contact Information & Login Password */}
              <div className="space-y-4 pt-2">
                <div className="border-b border-zinc-200/60 pb-2">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[#E61C5D]">
                    2. Contact Numbers &amp; Login Credentials
                  </h3>
                  <p className="text-[11px] text-zinc-600">
                    Primary mobile number, distinct alternate phone, optional email, and login credentials
                  </p>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="block text-xs font-bold text-zinc-700">
                    Phone Number 1 (Primary Contact) *
                    <input
                      required
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="mt-1.5 h-11 w-full rounded-xl border border-zinc-200 bg-[#FAF8F5] px-3 text-sm outline-none focus:border-rose-300 focus:ring-2 focus:ring-rose-100"
                      placeholder="10-digit mobile number (e.g. 9876543210)"
                    />
                    <span className="mt-1 block text-[10px] text-zinc-500">
                      Primary number used for authentication and SMS notifications
                    </span>
                  </label>

                  <label className="block text-xs font-bold text-zinc-700">
                    Phone Number 2 / Alternate Phone (No duplication)
                    <input
                      type="tel"
                      value={alternatePhone}
                      onChange={(e) => setAlternatePhone(e.target.value)}
                      className="mt-1.5 h-11 w-full rounded-xl border border-zinc-200 bg-[#FAF8F5] px-3 text-sm outline-none focus:border-rose-300 focus:ring-2 focus:ring-rose-100"
                      placeholder="Alternate 10-digit mobile number"
                    />
                    <span className="mt-1 block text-[10px] text-zinc-500">
                      Must be different from Phone Number 1
                    </span>
                  </label>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="block text-xs font-bold text-zinc-700">
                    Email ID (Optional)
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="mt-1.5 h-11 w-full rounded-xl border border-zinc-200 bg-[#FAF8F5] px-3 text-sm outline-none focus:border-rose-300 focus:ring-2 focus:ring-rose-100"
                      placeholder="officer@femmeflo.in"
                    />
                  </label>

                  <label className="block text-xs font-bold text-zinc-700">
                    Initial Account Password *
                    <input
                      type="text"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="mt-1.5 h-11 w-full rounded-xl border border-zinc-200 bg-[#FAF8F5] px-3 text-sm outline-none focus:border-rose-300 focus:ring-2 focus:ring-rose-100"
                      placeholder="Minimum 8 characters"
                    />
                    <span className="mt-1 block text-[10px] text-zinc-500">
                      Temporary password used by officer to log in
                    </span>
                  </label>
                </div>
              </div>

              {/* Section 3: Identity Documents & Education */}
              <div className="space-y-4 pt-2">
                <div className="border-b border-zinc-200/60 pb-2">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[#E61C5D]">
                    3. Identification Documents &amp; Qualification
                  </h3>
                  <p className="text-[11px] text-zinc-600">
                    Government identification documents and educational background
                  </p>
                </div>

                <div className="grid gap-4 sm:grid-cols-3">
                  <label className="block text-xs font-bold text-zinc-700">
                    Aadhaar Card Number
                    <input
                      type="text"
                      maxLength={14}
                      value={aadharNumber}
                      onChange={(e) => {
                        const raw = e.target.value.replace(/\D/g, "").slice(0, 12);
                        const parts = [];
                        for (let i = 0; i < raw.length; i += 4) {
                          parts.push(raw.slice(i, i + 4));
                        }
                        setAadharNumber(parts.join(" "));
                      }}
                      className="mt-1.5 h-11 w-full rounded-xl border border-zinc-200 bg-[#FAF8F5] px-3 font-mono text-sm tracking-wider outline-none focus:border-rose-300 focus:ring-2 focus:ring-rose-100"
                      placeholder="XXXX XXXX XXXX"
                    />
                    <span className="mt-1 block text-[10px] text-zinc-500">12-digit Indian Aadhaar number</span>
                  </label>

                  <label className="block text-xs font-bold text-zinc-700">
                    Driving License Number
                    <input
                      type="text"
                      value={drivingLicense}
                      onChange={(e) => setDrivingLicense(e.target.value.toUpperCase())}
                      className="mt-1.5 h-11 w-full rounded-xl border border-zinc-200 bg-[#FAF8F5] px-3 font-mono text-sm uppercase tracking-wide outline-none focus:border-rose-300 focus:ring-2 focus:ring-rose-100"
                      placeholder="e.g. MH14 20210001234"
                    />
                    <span className="mt-1 block text-[10px] text-zinc-500">For field travel validation</span>
                  </label>

                  <label className="block text-xs font-bold text-zinc-700">
                    Educational Qualification
                    <select
                      value={education}
                      onChange={(e) => setEducation(e.target.value)}
                      className="mt-1.5 h-11 w-full rounded-xl border border-zinc-200 bg-[#FAF8F5] px-3 text-sm outline-none focus:border-rose-300"
                    >
                      <option value="10th Standard">10th Standard / Matriculation</option>
                      <option value="12th Standard / HSC">12th Standard / HSC / Intermediate</option>
                      <option value="Graduate (B.A. / B.Com / B.Sc / BBA)">Graduate (B.A. / B.Com / B.Sc / BBA)</option>
                      <option value="Graduate (Technical / Engineering)">Graduate (Technical / Engineering)</option>
                      <option value="Post Graduate / Master'">Post Graduate / Master's</option>
                      <option value="Diploma / ITI Certification">Diploma / ITI Certification</option>
                      <option value="Other">Other Qualification</option>
                    </select>
                    <span className="mt-1 block text-[10px] text-zinc-500">Officer background</span>
                  </label>
                </div>
              </div>

              {/* Section 4: Complete Residential Address & Territory */}
              <div className="space-y-4 pt-2">
                <div className="border-b border-zinc-200/60 pb-2">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[#E61C5D]">
                    4. Complete Address &amp; Territory
                  </h3>
                  <p className="text-[11px] text-zinc-600">
                    Residential address with PIN code lookup for territory jurisdiction
                  </p>
                </div>

                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="sm:col-span-1">
                    <label className="block text-xs font-bold text-zinc-700">
                      PIN Code *
                      <div className="relative mt-1.5">
                        <input
                          required
                          type="text"
                          maxLength={6}
                          value={pincode}
                          onChange={(e) => handlePincodeChange(e.target.value)}
                          className="h-11 w-full rounded-xl border border-zinc-200 bg-[#FAF8F5] px-3 text-sm font-semibold outline-none focus:border-rose-300 focus:ring-2 focus:ring-rose-100"
                          placeholder="6-digit PIN"
                        />
                        {isPincodeLoading && (
                          <div className="absolute right-3 top-3">
                            <Loader2 className="h-5 w-5 animate-spin text-[#E61C5D]" />
                          </div>
                        )}
                      </div>
                    </label>
                    {pincodeMessage && (
                      <p className={`mt-1.5 text-[11px] font-medium ${
                        pincodeMessage.startsWith("✓") ? "text-emerald-700" : "text-amber-700"
                      }`}>
                        {pincodeMessage}
                      </p>
                    )}
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-zinc-700">
                      Complete Address / Street Name / House / Building
                      <input
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        className="mt-1.5 h-11 w-full rounded-xl border border-zinc-200 bg-[#FAF8F5] px-3 text-sm outline-none focus:border-rose-300 focus:ring-2 focus:ring-rose-100"
                        placeholder="House no., Building name, Street, Landmark"
                      />
                    </label>
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-3">
                  <label className="block text-xs font-bold text-zinc-700">
                    Village / Town / Locality *
                    {availableVillages.length > 0 ? (
                      <select
                        required
                        value={village}
                        onChange={(e) => setVillage(e.target.value)}
                        className="mt-1.5 h-11 w-full rounded-xl border border-zinc-200 bg-[#FAF8F5] px-3 text-sm outline-none focus:border-rose-300"
                      >
                        <option value="">Select Village / Locality</option>
                        {availableVillages.map((v) => (
                          <option key={v} value={v}>
                            {v}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <input
                        required
                        value={village}
                        onChange={(e) => setVillage(e.target.value)}
                        className="mt-1.5 h-11 w-full rounded-xl border border-zinc-200 bg-[#FAF8F5] px-3 text-sm outline-none focus:border-rose-300"
                        placeholder="e.g. Diva / Panvel"
                      />
                    )}
                  </label>

                  <label className="block text-xs font-bold text-zinc-700">
                    District *
                    <input
                      required
                      value={district}
                      onChange={(e) => setDistrict(e.target.value)}
                      className="mt-1.5 h-11 w-full rounded-xl border border-zinc-200 bg-[#FAF8F5] px-3 text-sm outline-none focus:border-rose-300"
                      placeholder="e.g. Thane"
                    />
                  </label>

                  <label className="block text-xs font-bold text-zinc-700">
                    State *
                    <input
                      required
                      value={state}
                      onChange={(e) => setState(e.target.value)}
                      className="mt-1.5 h-11 w-full rounded-xl border border-zinc-200 bg-[#FAF8F5] px-3 text-sm outline-none focus:border-rose-300"
                      placeholder="e.g. Maharashtra"
                    />
                  </label>
                </div>
              </div>
            </div>
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
                      placeholder="10-digit mobile number, e.g. 9876543210"
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
                      Assigned Field Officer *
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
                            + Onboard Officer First
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
                      ? "Field Officer successfully onboarded! Redirecting to directory..."
                      : "Customer record successfully saved! Redirecting to directory..."}
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
                Return to {seller ? "Officers" : "Customers"} Directory
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
      {/* On-Screen Error Dialog Box */}
      {errorDialog && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={() => setErrorDialog(null)}
        >
          <div
            className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl ring-1 ring-black/10 transform transition-all animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start gap-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-rose-100 text-[#E61C5D]">
                <AlertCircle className="h-6 w-6 stroke-[2.5]" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-base font-bold text-zinc-900">{errorDialog.title}</h3>
                <p className="mt-1 text-sm leading-relaxed text-zinc-600 break-words">{errorDialog.message}</p>
                {errorDialog.details && (
                  <pre className="mt-3 max-h-40 overflow-auto rounded-lg bg-zinc-950 p-2.5 text-[11px] font-mono text-zinc-200 border border-zinc-800">
                    {errorDialog.details}
                  </pre>
                )}
              </div>
              <button
                type="button"
                onClick={() => setErrorDialog(null)}
                className="rounded-lg p-1 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 transition"
                aria-label="Close error dialog"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setErrorDialog(null)}
                className="w-full sm:w-auto rounded-xl bg-[#E61C5D] px-5 py-2.5 text-xs font-bold text-white shadow-md hover:bg-[#c91550] transition focus:outline-none focus:ring-2 focus:ring-[#E61C5D] focus:ring-offset-2"
              >
                Understood / Dismiss
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardShell>
  );
}
