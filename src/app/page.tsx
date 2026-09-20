'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Song, MemberName, TabType } from '@/types';
import { dataService } from '@/lib/dataService';
import { calculateSongStats } from '@/lib/utils';
import { Header } from '@/components/Header';
import { TabNav } from '@/components/TabNav';
import { SortOption } from '@/components/SearchBar';
import { SongCard } from '@/components/SongCard';
import { MemberSelectorModal } from '@/components/MemberSelectorModal';
import { AddSongModal } from '@/components/AddSongModal';
import { VotesBreakdownModal } from '@/components/VotesBreakdownModal';
import { Plus, Sparkles, Music, CheckCircle2, Trophy, Loader2 } from 'lucide-react';
import confetti from 'canvas-confetti';

const STORAGE_MEMBER_KEY = 'band_active_member_name';

export default function Home() {
  const [songs, setSongs] = useState<Song[]>([]);
  const [currentMember, setCurrentMember] = useState<MemberName | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOption, setSortOption] = useState<SortOption>('recent');

  const [isMemberModalOpen, setIsMemberModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedSongDetails, setSelectedSongDetails] = useState<Song | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Caricamento iniziale membro e brani
  useEffect(() => {
    // 1. Leggi membro memorizzato
    const savedMember = localStorage.getItem(STORAGE_MEMBER_KEY) as MemberName | null;
    if (savedMember) {
      setCurrentMember(savedMember);
    } else {
      setIsMemberModalOpen(true);
    }

    // 2. Carica brani da Supabase o Local Storage
    const loadSongs = async () => {
      try {
        setIsLoading(true);
        const data = await dataService.getSongs();
        setSongs(data);
      } catch (err) {
        console.error('Errore nel caricamento dei brani:', err);
      } finally {
        setIsLoading(false);
      }
    };

    loadSongs();
  }, []);

  // Selezione e memorizzazione membro
  const handleSelectMember = (member: MemberName) => {
    setCurrentMember(member);
    localStorage.setItem(STORAGE_MEMBER_KEY, member);
  };

  // Votazione istantanea con aggiornamento ottimistico
  const handleVote = useCallback(
    async (songId: string, rating: number) => {
      if (!currentMember) {
        setIsMemberModalOpen(true);
        return;
      }

      // Aggiornamento ottimistico dell'interfaccia
      setSongs((prevSongs) => {
        const updated = prevSongs.map((s) => {
          if (s.id !== songId) return s;
          const votes = s.votes ? [...s.votes] : [];
          const idx = votes.findIndex((v) => v.member_name === currentMember);
          if (idx >= 0) {
            votes[idx] = { ...votes[idx], rating, updated_at: new Date().toISOString() };
          } else {
            votes.push({
              song_id: songId,
              member_name: currentMember,
              rating,
              updated_at: new Date().toISOString(),
            });
          }
          return { ...s, votes };
        });

        // Controlla se abbiamo completato tutti i brani
        const unvotedLeft = updated.filter(
          (s) => !s.votes?.some((v) => v.member_name === currentMember)
        ).length;

        if (unvotedLeft === 0 && updated.length > 0) {
          try {
            confetti({
              particleCount: 50,
              spread: 60,
              origin: { y: 0.8 },
            });
          } catch {
            // Ignora se confetti non disponibile
          }
        }

        return updated;
      });

      // Aggiorna anche eventuale modal dettagli aperto
      if (selectedSongDetails && selectedSongDetails.id === songId) {
        setSelectedSongDetails((prev) => {
          if (!prev) return null;
          const votes = prev.votes ? [...prev.votes] : [];
          const idx = votes.findIndex((v) => v.member_name === currentMember);
          if (idx >= 0) {
            votes[idx] = { ...votes[idx], rating };
          } else {
            votes.push({
              song_id: songId,
              member_name: currentMember,
              rating,
            });
          }
          return { ...prev, votes };
        });
      }

      // Invio persistenza in background
      try {
        await dataService.setVote(songId, currentMember, rating);
      } catch (err) {
        console.error('Errore persistenza voto:', err);
      }
    },
    [currentMember, selectedSongDetails]
  );

  // Aggiunta nuovo brano
  const handleAddSong = async (
    title: string,
    artist?: string,
    initialVote?: { memberName: MemberName; rating: number }
  ) => {
    const newSong = await dataService.addSong(title, artist, initialVote);
    setSongs((prev) => [newSong, ...prev]);
  };

  // Eliminazione brano
  const handleDeleteSong = async (songId: string) => {
    await dataService.deleteSong(songId);
    setSongs((prev) => prev.filter((s) => s.id !== songId));
    if (selectedSongDetails?.id === songId) {
      setSelectedSongDetails(null);
    }
  };

  // Calcolo statistiche veloci
  const { userVotedCount, unvotedSongsList } = useMemo(() => {
    if (!currentMember) {
      return { userVotedCount: 0, unvotedSongsList: songs };
    }
    const unvoted = songs.filter(
      (s) => !s.votes?.some((v) => v.member_name === currentMember)
    );
    return {
      userVotedCount: songs.length - unvoted.length,
      unvotedSongsList: unvoted,
    };
  }, [songs, currentMember]);

  // Filtraggio e ordinamento lista visualizzata
  const displayedSongs = useMemo(() => {
    let list: Song[] = [];

    if (activeTab === 'unvoted') {
      list = unvotedSongsList;
    } else {
      list = [...songs];
    }

    // Filtro per query di ricerca
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (s) =>
          s.title.toLowerCase().includes(q) ||
          (s.artist && s.artist.toLowerCase().includes(q))
      );
    }

    if (sortOption === 'recent') {
      list.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    } else if (sortOption === 'az') {
      list.sort((a, b) => a.title.localeCompare(b.title));
    } else if (sortOption === 'votes_count') {
      list.sort((a, b) => (b.votes?.length || 0) - (a.votes?.length || 0));
    } else if (sortOption === 'highest_average') {
      const getAverage = (song: Song) => {
        const votes = song.votes || [];
        return votes.length === 0 ? 0 : votes.reduce((sum, vote) => sum + vote.rating, 0) / votes.length;
      };

      list.sort((a, b) => {
        const averageDifference = getAverage(b) - getAverage(a);
        if (averageDifference !== 0) return averageDifference;

        return (b.votes?.length || 0) - (a.votes?.length || 0);
      });
    }

    return list;
  }, [songs, activeTab, unvotedSongsList, searchQuery, sortOption]);

  return (
    <div className="app-shell flex min-h-[100dvh] flex-col pb-24 text-[#171b26]">
      <Header
        currentMember={currentMember}
        onOpenMemberSelect={() => setIsMemberModalOpen(true)}
        isCloud={dataService.isCloudConnected}
        totalSongs={songs.length}
        userVotedCount={userVotedCount}
      />

      <TabNav
        activeTab={activeTab}
        onChangeTab={setActiveTab}
        unvotedCount={unvotedSongsList.length}
        totalCount={songs.length}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        sortOption={sortOption}
        onSortChange={setSortOption}
      />

      <main className="mx-auto flex w-full max-w-[520px] flex-1 px-4 pb-4 pt-3">
        {isLoading ? (
          <div className="flex w-full flex-col items-center justify-center py-20 text-[#718099]">
            <Loader2 className="mb-3 h-7 w-7 animate-spin text-[#52617a]" />
            <p className="text-sm font-medium">Caricamento brani...</p>
          </div>
        ) : displayedSongs.length > 0 ? (
          <div className="w-full">
            {displayedSongs.map((song, index) => (
              <SongCard
                key={song.id}
                song={song}
                currentMember={currentMember}
                onVote={handleVote}
                onOpenDetails={(s) => setSelectedSongDetails(s)}
                onDelete={handleDeleteSong}
                rankIndex={undefined}
              />
            ))}
          </div>
        ) : (
          <div className="my-4 flex w-full flex-col items-center justify-center rounded-[18px] border border-[#e4e9f1] bg-white px-6 py-12 text-center shadow-[0_1px_2px_rgba(20,31,48,0.025)]">
            {activeTab === 'unvoted' ? (
              <>
                <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full border border-[#c8f1dd] bg-[#e9fbf2] text-[#248a4b]">
                  <CheckCircle2 className="h-7 w-7" />
                </div>
                <h3 className="mb-2 text-lg font-semibold text-[#171b26]">Nessun brano da votare</h3>
                <p className="mb-5 max-w-xs text-sm text-[#718099]">
                  Hai già espresso il tuo parere su tutti i pezzi disponibili.
                </p>
                <button
                  onClick={() => setActiveTab('all')}
                  className="h-10 rounded-xl border border-[#dfe5ee] bg-[#f7f9fc] px-4 text-xs font-medium text-[#263044] active:scale-[0.98]"
                >
                  Guarda la classifica
                </button>
              </>
            ) : searchQuery ? (
              <>
                <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full border border-[#e4e9f1] bg-[#f7f9fc] text-[#718099]">
                  <Music className="h-6 w-6" />
                </div>
                <h3 className="mb-2 text-lg font-semibold text-[#171b26]">Nessun risultato</h3>
                <p className="mb-5 text-sm text-[#718099]">Nessun brano trovato per &quot;{searchQuery}&quot;.</p>
                <button
                  onClick={() => setSearchQuery('')}
                  className="h-10 rounded-xl border border-[#dfe5ee] bg-[#f7f9fc] px-4 text-xs font-medium text-[#263044] active:scale-[0.98]"
                >
                  Cancella ricerca
                </button>
              </>
            ) : (
              <>
                <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full border border-[#e4e9f1] bg-[#f7f9fc] text-[#52617a]">
                  <Sparkles className="h-6 w-6" />
                </div>
                <h3 className="mb-2 text-lg font-semibold text-[#171b26]">Nessun brano proposto</h3>
                <p className="mb-5 max-w-xs text-sm text-[#718099]">
                  Aggiungi il primo pezzo per iniziare la scaletta.
                </p>
                <button
                  onClick={() => setIsAddModalOpen(true)}
                  className="inline-flex h-10 items-center gap-2 rounded-xl bg-[#192331] px-4 text-xs font-medium text-white active:scale-[0.98]"
                >
                  <Plus className="h-4 w-4" />
                  Proponi brano
                </button>
              </>
            )}
          </div>
        )}
      </main>

      <div className="fixed bottom-5 right-5 z-40 sm:bottom-7 sm:right-7">
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="flex h-12 items-center gap-2 rounded-full border border-white/20 bg-[#192331] px-4 text-sm font-medium text-white shadow-[0_8px_24px_rgba(25,35,49,0.2)] transition hover:bg-[#263347] active:scale-[0.98]"
          aria-label="Aggiungi nuovo brano"
        >
          <Plus className="h-4 w-4" />
          <span>Proponi</span>
        </button>
      </div>

      {/* Modals */}
      <MemberSelectorModal
        isOpen={isMemberModalOpen}
        currentMember={currentMember}
        onSelectMember={handleSelectMember}
        onClose={() => setIsMemberModalOpen(false)}
        canClose={currentMember !== null}
      />

      <AddSongModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAddSong={handleAddSong}
        currentMember={currentMember}
      />

      <VotesBreakdownModal
        song={selectedSongDetails}
        onClose={() => setSelectedSongDetails(null)}
        onVote={(rating) => {
          if (selectedSongDetails) {
            handleVote(selectedSongDetails.id, rating);
          }
        }}
        currentMember={currentMember}
      />
    </div>
  );
}
