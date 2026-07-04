'use client';

import { useEffect, useState } from 'react';
import { CopyButton } from '@/components/ui/copy-button';
import { defaultSiteSettings, type SiteSettings } from '@/lib/site-settings';

export function PaymentDetails() {
  const [settings, setSettings] = useState<SiteSettings>(defaultSiteSettings);

  useEffect(() => {
    const load = async () => {
      try {
        const response = await fetch('/api/site-settings');
        const data = await response.json();
        setSettings(data ?? defaultSiteSettings);
      } catch {
        setSettings(defaultSiteSettings);
      }
    };
    load();
  }, []);

  const rows = [
    { label: 'Account number', value: settings.accountNumber },
    { label: 'Bank', value: settings.bankName },
    { label: 'Account name', value: settings.accountName },
  ];

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">
        Transfer the exact order total to the account below, then confirm payment below.
      </p>
      {rows.map((row) => (
        <div
          key={row.label}
          className="flex items-center justify-between gap-3 rounded-2xl bg-muted border border-border px-4 py-3"
        >
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              {row.label}
            </p>
            <p className="font-bold truncate">{row.value}</p>
          </div>
          <CopyButton value={row.value} label={row.label} />
        </div>
      ))}
    </div>
  );
}
