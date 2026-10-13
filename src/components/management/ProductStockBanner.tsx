import Image from "next/image";
import Link from "next/link";

export function ProductStockBanner() {
  return (
    <section className="relative mb-8 overflow-hidden rounded-2xl bg-[#156035] p-6 text-white shadow-[0_14px_36px_rgba(21,96,53,0.18)] sm:p-8">
      <div className="relative z-10 max-w-2xl">
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-emerald-200">Stock focus</p>
          <span className="rounded-full border border-emerald-300/30 bg-emerald-400/15 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-emerald-100">Ready to sell</span>
        </div>
        <h2 className="mt-3 max-w-xl font-playfair text-3xl font-bold leading-tight sm:text-4xl">20 packets ready for your next sale.</h2>
        <p className="mt-3 max-w-md text-sm leading-relaxed text-emerald-100">Keep your customer book moving. Confirmed sales automatically reduce your stock and contribute to incentive.</p>

        <div className="mt-6 max-w-md rounded-2xl border border-white/15 bg-white/10 p-4 backdrop-blur-sm">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-emerald-100">Current allocation</span>
            <span className="font-bold text-white">20 of 40 remaining</span>
          </div>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/20" aria-label="50 percent inventory remaining">
            <div className="h-full w-1/2 rounded-full bg-[#FDE047]" />
          </div>
          <div className="mt-3 flex items-center justify-between text-[11px] text-emerald-100">
            <span>20 sold</span>
            <span>50% available</span>
          </div>
        </div>

        <div className="mt-5 flex flex-wrap items-center gap-3">
          <Link href="/seller/inventory" className="inline-flex items-center rounded-xl bg-white px-4 py-2.5 text-xs font-bold text-[#156035] transition hover:bg-emerald-50">View inventory &rarr;</Link>
          <span className="text-xs font-semibold text-emerald-100">₹300 incentive earned</span>
        </div>
      </div>
      <div className="pointer-events-none absolute -right-2 -bottom-8.5 h-56 w-56 rounded-full bg-emerald-400/20 sm:right-12 sm:h-64 sm:w-64">
        <Image src="/femmeflo-product-nobg.png" alt="Femmeflo product packet" width={280} height={280} className="relative z-10 h-56 w-56 object-contain drop-shadow-[0_18px_18px_rgba(0,0,0,0.18)] sm:h-64 sm:w-64" />
      </div>
    </section>
  );
}
