'use client';

import React from 'react';
import { MemberName } from '@/types';
import { BAND_MEMBERS } from '@/lib/constants';
import { CheckCircle2, User, Sparkles, X } from 'lucide-react';

interface MemberSelectorModalProps {
  isOpen: boolean;
  currentMember: MemberName | null;
  onSelectMember: (member: MemberName) => void;
  onClose?: () => void;
  canClose?: boolean;
}

export const MemberSelectorModal: React.FC<MemberSelectorModalProps> = ({
  isOpen,
  currentMember,
  onSelectMember,
  onClose,
  canClose = true,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#172236]/35 p-4 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-sm overflow-hidden rounded-[20px] border border-[#e4e9f1] bg-white p-5 shadow-[0_20px_60px_rgba(25,35,49,0.18)] sm:p-6">

        {/* Close button if allowed */}
        {canClose && onClose && (
          <button
            onClick={onClose}
            aria-label="Chiudi"
            className="absolute right-4 top-4 rounded-xl p-2 text-[#718099] transition hover:bg-[#f1f4f8] hover:text-[#263044]"
          >
            <X className="w-4 h-4" />
          </button>
        )}

        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl border border-[#e4e9f1] bg-[#f3f6fb] text-[#263044]">
            <Sparkles className="h-6 w-6" />
          </div>
          <h2 className="text-xl font-semibold tracking-[-0.025em] text-[#171b26]">Chi sta votando?</h2>
          <p className="mt-1 text-xs leading-5 text-[#718099]">
            Seleziona il tuo nome per registrare i tuoi voti e vedere i brani rimasti da valutare.
          </p>
        </div>

        <div className="grid max-h-[60vh] grid-cols-1 gap-2 overflow-y-auto pr-1">
          {BAND_MEMBERS.map((member) => {
            const isSelected = currentMember === member.name;
            return (
              <button
                key={member.name}
                onClick={() => {
                  onSelectMember(member.name);
                  if (onClose) onClose();
                }}
                className={`flex w-full items-center justify-between rounded-[14px] border p-3 transition-all active:scale-[0.98] ${
                  isSelected
                    ? 'border-[#bfcdeb] bg-[#eef3ff]'
                    : 'border-[#e4e9f1] bg-white hover:bg-[#f7f9fc] hover:border-[#d8e0eb]'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${member.color} text-sm font-bold text-white shadow-sm`}
                  >
                    {member.name.substring(0, 2).toUpperCase()}
                  </div>
                  <div className="text-left">
                    <span className="block text-sm font-semibold text-[#263044]">
                      {member.name}
                    </span>
                    {member.role ? (
                      <span className="text-[10px] font-medium text-[#718099]">
                        {member.role}
                      </span>
                    ) : (
                      <span className="text-[10px] text-[#8c9aaf]">Membro del gruppo</span>
                    )}
                  </div>
                </div>

                {isSelected ? (
                  <CheckCircle2 className="h-5 w-5 text-[#2f6fcf]" />
                ) : (
                  <div className="flex h-5 w-5 items-center justify-center rounded-full border border-[#cfd7e3]" />
                )}
              </button>
            );
          })}
        </div>

        <div className="mt-4 border-t border-[#eef1f6] pt-4 text-center">
          <p className="text-[11px] leading-4 text-[#8c9aaf]">
            Il nome rimarrà memorizzato su questo dispositivo. Puoi cambiarlo in qualsiasi momento.
          </p>
        </div>
      </div>
    </div>
  );
};
