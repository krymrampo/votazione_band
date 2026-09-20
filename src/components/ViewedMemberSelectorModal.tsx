'use client';

import React from 'react';
import { MemberName } from '@/types';
import { BAND_MEMBERS } from '@/lib/constants';
import { CheckCircle2, Eye, X } from 'lucide-react';

interface ViewedMemberSelectorModalProps {
  isOpen: boolean;
  selectedMember: MemberName | null;
  voteCounts: Record<MemberName, number>;
  onSelectMember: (member: MemberName) => void;
  onClose: () => void;
}

export const ViewedMemberSelectorModal: React.FC<ViewedMemberSelectorModalProps> = ({
  isOpen,
  selectedMember,
  voteCounts,
  onSelectMember,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-[#172236]/35 p-0 backdrop-blur-sm animate-fadeIn sm:items-center sm:p-4">
      <div className="relative w-full max-w-sm overflow-hidden rounded-t-[20px] border border-[#e4e9f1] bg-white p-5 shadow-[0_20px_60px_rgba(25,35,49,0.18)] sm:rounded-[20px] sm:p-6">
        <button
          type="button"
          onClick={onClose}
          aria-label="Chiudi selezione membro"
          className="absolute right-4 top-4 rounded-xl p-2 text-[#718099] transition hover:bg-[#f1f4f8] hover:text-[#263044]"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="mb-5 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl border border-[#e4e9f1] bg-[#f3f6fb] text-[#263044]">
            <Eye className="h-5 w-5" strokeWidth={1.8} />
          </div>
          <h2 className="text-xl font-semibold tracking-[-0.025em] text-[#171b26]">
            Di chi vuoi vedere i voti?
          </h2>
          <p className="mt-1 text-xs leading-5 text-[#718099]">
            Questa scelta serve solo a filtrare la lista e non cambia chi sta usando l’app.
          </p>
        </div>

        <div className="grid max-h-[60vh] grid-cols-1 gap-2 overflow-y-auto pr-1">
          {BAND_MEMBERS.map((member) => {
            const isSelected = selectedMember === member.name;
            const voteCount = voteCounts[member.name];

            return (
              <button
                type="button"
                key={member.name}
                onClick={() => {
                  onSelectMember(member.name);
                  onClose();
                }}
                className={`flex w-full items-center justify-between rounded-[14px] border p-3 transition-all active:scale-[0.98] ${
                  isSelected
                    ? 'border-[#bfcdeb] bg-[#eef3ff]'
                    : 'border-[#e4e9f1] bg-white hover:border-[#d8e0eb] hover:bg-[#f7f9fc]'
                }`}
              >
                <span className="flex min-w-0 items-center gap-3">
                  <span
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${member.color} text-sm font-bold text-white shadow-sm`}
                  >
                    {member.name.substring(0, 2).toUpperCase()}
                  </span>
                  <span className="min-w-0 text-left">
                    <span className="block truncate text-sm font-semibold text-[#263044]">
                      {member.name}
                    </span>
                    <span className="text-[10px] font-medium text-[#718099] tabular-nums">
                      {voteCount} {voteCount === 1 ? 'brano votato' : 'brani votati'}
                    </span>
                  </span>
                </span>

                {isSelected ? (
                  <CheckCircle2 className="h-5 w-5 shrink-0 text-[#2f6fcf]" />
                ) : (
                  <span className="h-5 w-5 shrink-0 rounded-full border border-[#cfd7e3]" />
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
