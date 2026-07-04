'use client';

import { useEffect, useState } from 'react';
import { Utensils, X } from 'lucide-react';
import { getTableContext, clearTableContext, type TableContext } from '@/lib/table-session';

// Slim reminder shown while a guest is ordering from a table QR code.
export function TableBanner() {
  const [ctx, setCtx] = useState<TableContext | null>(null);

  // Read after mount — sessionStorage isn't available during SSR.
  useEffect(() => {
    setCtx(getTableContext());
  }, []);

  if (!ctx) return null;

  return (
    <div className="max-w-3xl mx-auto mb-6">
      <div className="rounded-2xl bg-primary text-white px-4 py-3 md:px-5 flex items-center gap-3 shadow-card">
        <div className="w-9 h-9 rounded-xl bg-white/15 flex items-center justify-center shrink-0">
          <Utensils className="w-5 h-5" />
        </div>
        <p className="text-sm md:text-[0.95rem] flex-1 leading-snug">
          <span className="font-bold">Ordering from Table {ctx.tableLabel}.</span>{' '}
          <span className="text-white/80">We&apos;ll serve you there — pay after your meal.</span>
        </p>
        <button
          type="button"
          onClick={() => {
            clearTableContext();
            setCtx(null);
          }}
          aria-label="Not at this table? Clear table"
          className="shrink-0 rounded-full p-1.5 hover:bg-white/15 transition-colors"
          title="Not at this table?"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
