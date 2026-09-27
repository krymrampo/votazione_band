'use client';

import { Cloud, CloudOff, Loader2, RefreshCw } from 'lucide-react';
import { isSupabaseConfigured } from '@/lib/supabase';
import type { ReactNode } from 'react';

export function StorageStatus() {
  const Icon = isSupabaseConfigured ? Cloud : CloudOff;
  return (
    <span className="inline-flex items-center gap-1.5 text-xs text-[#617086]">
      <Icon className="h-3.5 w-3.5" />
      {isSupabaseConfigured ? 'Spazio condiviso' : 'Solo su questo dispositivo'}
    </span>
  );
}

export function PageHeading({
  title,
  children,
  onRefresh,
  disabled,
}: {
  title: string;
  children?: ReactNode;
  onRefresh?: () => void;
  disabled?: boolean;
}) {
  return (
    <header className="mb-6 flex flex-wrap items-center justify-between gap-3">
      <div>
        <h1 className="mb-2 text-2xl font-semibold">{title}</h1>
        <StorageStatus />
      </div>
      <div className="flex items-center gap-2">
        {children}
        {onRefresh && (
          <button
            className="icon-button"
            title="Ricarica"
            aria-label="Ricarica"
            onClick={onRefresh}
            disabled={disabled}
          >
            <RefreshCw className="h-4 w-4" />
          </button>
        )}
      </div>
    </header>
  );
}

export function ErrorNotice({
  message,
  retry,
}: {
  message: string;
  retry?: () => void;
}) {
  if (!message) return null;
  return (
    <div
      role="alert"
      className="mb-4 rounded-lg border border-[#efc9c9] bg-[#fff5f5] p-3 text-sm text-[#a52f2f]"
    >
      <p>{message}</p>
      {retry && (
        <button className="mt-2 underline" onClick={retry}>
          Riprova
        </button>
      )}
    </div>
  );
}

export function Loading() {
  return (
    <div
      role="status"
      className="flex items-center justify-center gap-2 py-16 text-sm text-[#617086]"
    >
      <Loader2 className="h-5 w-5 animate-spin" />
      Caricamento...
    </div>
  );
}

export function errorMessage(error: unknown) {
  return error instanceof Error
    ? error.message
    : 'Operazione non riuscita. Riprova.';
}
