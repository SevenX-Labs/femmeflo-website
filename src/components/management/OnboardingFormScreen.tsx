"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowLeft, Camera, Loader2, MapPin } from "lucide-react";
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
  const [sellers, setSellers] = useState<SellerItem[]>([]);
  const [selectedSellerId, setSelectedSellerId] = useState("");
  const [photo, setPhoto] = useState("");
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
          const catRes = await categoryApi.listCategories().catch(() => ({ categories: [] }));
          if (active && catRes.categories.length > 0) {
            setCategories(catRes.categories);
            setSelectedCategoryId(catRes.categories[0].id);
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

        if (role === "Super Admin") {
          await adminApi.createCustomer({
            ...customerData,
            sellerId: selectedSellerId || undefined,
          });
        } else if (role === "Manager") {
          await managerApi.createCustomer({
            ...customerData,
            sellerId: selectedSellerId || undefined,
          });
        } else {
          await sellerApi.createCustomer(customerData);
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
                  className="mt-2 h-12 w-full rounded-xl border border-zinc-200 bg-[#FAF8F5] px-3 text-sm"
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
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
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-rose-200 bg-[#FFF8FA] py-5 text-xs font-bold text-[#E61C5D] transition hover:bg-rose-50">
                <Camera className="h-4 w-4" />
                {photo || "Upload or capture shop photo"}
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className="sr-only"
                  onChange={(e) => setPhoto(e.target.files?.[0]?.name ?? "")}
                />
              </label>
              <button
                type="button"
                onClick={capture}
                className="flex items-center justify-center gap-2 rounded-xl border border-dashed border-rose-200 bg-[#FFF8FA] py-5 text-xs font-bold text-[#E61C5D] transition hover:bg-rose-50"
              >
                <MapPin className="h-4 w-4" />
                {location || "Detect current GPS coordinates"}
              </button>
            </div>
          )}

          {saved ? (
            <div className="space-y-3">
              <div className="rounded-xl bg-emerald-50 p-4 text-sm font-bold text-[#157347]">
                ✓ {seller ? "Seller successfully created!" : "Customer record successfully saved!"}
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
                  <Loader2 className="h-4 w-4 animate-spin" /> Saving record...
                </>
              ) : (
                `Save ${seller ? "seller" : "customer"}`
              )}
            </button>
          )}

          <p className="text-xs text-zinc-400">
            Connected to endpoint <code className="rounded bg-rose-50 px-1 py-0.5 font-mono text-[11px] text-[#E61C5D]">{seller ? "POST /api/v1/admin/sellers" : "POST /api/v1/admin/customers"}</code>
          </p>
        </form>
      </SectionCard>
    </DashboardShell>
  );
}
