'use client';

import React, { useState } from 'react';
import { MemberName } from '@/types';
import { StarRating } from './StarRating';
import { X, Plus, Music2, Sparkles } from 'lucide-react';

interface AddSongModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddSong: (
    title: string,
    artist?: string,
    initialVote?: { memberName: MemberName; rating: number }
  ) => Promise<void>;
  currentMember: MemberName | null;
}

export const AddSongModal: React.FC<AddSongModalProps> = ({
  isOpen,
  onClose,
  onAddSong,
  currentMember,
}) => {
  const [title, setTitle] = useState('');
  const [artist, setArtist] = useState('');
  const [initialRating, setInitialRating] = useState<number>(4);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Inserisci il titolo del brano.');
      return;
    }

    try {
      setIsSubmitting(true);
      setError('');

      const votePayload = currentMember && initialRating > 0
        ? { memberName: currentMember, rating: initialRating }
        : undefined;

      await onAddSong(title.trim(), artist.trim(), votePayload);
      setTitle('');
      setArtist('');
      setInitialRating(4);
      onClose();
    } catch (err) {
      console.error(err);
      setError('Si è verificato un errore durante l\'aggiunta del brano.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#172236]/35 p-4 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-md overflow-hidden rounded-[20px] border border-[#e4e9f1] bg-white p-5 shadow-[0_20px_60px_rgba(25,35,49,0.18)] sm:p-6">
        {/* Close Button */}
        <button
          onClick={onClose}
          aria-label="Chiudi"
          className="absolute right-4 top-4 rounded-xl p-2 text-[#718099] transition hover:bg-[#f1f4f8] hover:text-[#263044]"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="mb-5 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#e4e9f1] bg-[#f3f6fb] text-[#263044]">
            <Music2 className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-semibold tracking-[-0.02em] text-[#171b26]">Proponi un brano</h2>
            <p className="text-xs text-[#718099]">
              La proposta sarà anonima nel gruppo
            </p>
          </div>
        </div>

        {error && (
          <div className="mb-4 rounded-xl border border-[#f5caca] bg-[#fdf0f0] p-2.5 text-xs font-medium text-[#c73838]">
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-xs font-medium text-[#38455b]">
              Titolo brano <span className="text-[#c73838]">*</span>
            </label>
            <input
              type="text"
              required
              autoFocus
              placeholder="es. Sweet Child O' Mine"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="h-10 w-full rounded-xl border border-[#dfe5ee] bg-[#f9fafc] px-3 text-sm text-[#202a3a] placeholder:text-[#9aa4b4] outline-none transition focus:border-[#a7b8d5] focus:ring-4 focus:ring-[#dce8fc]"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium text-[#38455b]">
              Artista / gruppo <span className="font-normal text-[#718099]">(facoltativo)</span>
            </label>
            <input
              type="text"
              placeholder="es. Guns N' Roses"
              value={artist}
              onChange={(e) => setArtist(e.target.value)}
              className="h-10 w-full rounded-xl border border-[#dfe5ee] bg-[#f9fafc] px-3 text-sm text-[#202a3a] placeholder:text-[#9aa4b4] outline-none transition focus:border-[#a7b8d5] focus:ring-4 focus:ring-[#dce8fc]"
            />
          </div>

          {/* Optional immediate self-vote */}
          {currentMember && (
            <div className="space-y-2 rounded-[14px] border border-[#e4e9f1] bg-[#f7f9fc] p-3.5">
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-1.5 text-xs font-medium text-[#38455b]">
                  <Sparkles className="h-3.5 w-3.5 text-[#ffb21a]" />
                  Il tuo voto per questo pezzo:
                </label>
                <span className="text-xs font-semibold text-[#a86b00]">{initialRating}★</span>
              </div>
              <div className="flex justify-center pt-1">
                <StarRating
                  currentRating={initialRating}
                  onRate={(r) => setInitialRating(r)}
                  size="md"
                />
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="h-10 flex-1 rounded-xl border border-[#dfe5ee] bg-white text-xs font-medium text-[#52617a] transition hover:bg-[#f7f9fc] active:scale-[0.98]"
            >
              Annulla
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !title.trim()}
              className="flex h-10 flex-1 items-center justify-center gap-1.5 rounded-xl bg-[#192331] text-xs font-medium text-white transition hover:bg-[#263347] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-45"
            >
              <Plus className="w-4 h-4" />
              {isSubmitting ? 'Salvataggio...' : 'Aggiungi Brano'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
