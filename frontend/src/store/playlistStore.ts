import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Song } from '../types';

interface PlaylistState {
  queue: Song[];
  currentIndex: number;
  isShuffled: boolean;
  isRepeating: boolean;
  
  // Acciones
  addToQueue: (song: Song) => void;
  removeFromQueue: (songId: string) => void;
  clearQueue: () => void;
  setQueue: (songs: Song[]) => void;
  replaceQueueAndPlay: (songs: Song[], playIndex?: number) => void;
  addSingleToQueue: (song: Song) => void;
  setCurrentIndex: (index: number) => void;
  nextSong: () => Song | null;
  previousSong: () => Song | null;
  shuffleQueue: () => void;
  toggleRepeat: () => void;
  moveInQueue: (fromIndex: number, toIndex: number) => void;
}

export const usePlaylistStore = create<PlaylistState>()(
  persist(
    (set, get) => ({
      queue: [],
      currentIndex: 0,
      isShuffled: false,
      isRepeating: false,

      addToQueue: (song: Song) => {
        set((state) => {
          const isAlreadyInQueue = state.queue.some(s => s.id === song.id);
          if (isAlreadyInQueue) {
            return state; // No agregar duplicados
          }
          
          return {
            queue: [...state.queue, song]
          };
        });
      },

      removeFromQueue: (songId: string) => {
        set((state) => {
          const newQueue = state.queue.filter(song => song.id !== songId);
          const removedIndex = state.queue.findIndex(song => song.id === songId);
          
          let newCurrentIndex = state.currentIndex;
          if (removedIndex < state.currentIndex) {
            newCurrentIndex = state.currentIndex - 1;
          } else if (removedIndex === state.currentIndex && state.currentIndex >= newQueue.length) {
            newCurrentIndex = Math.max(0, newQueue.length - 1);
          }
          
          return {
            queue: newQueue,
            currentIndex: Math.max(0, newCurrentIndex)
          };
        });
      },

      clearQueue: () => {
        set({
          queue: [],
          currentIndex: 0
        });
      },

      setQueue: (songs: Song[]) => {
        set({
          queue: songs,
          currentIndex: 0
        });
      },

      replaceQueueAndPlay: (songs: Song[], playIndex: number = 0) => {
        set({
          queue: songs,
          currentIndex: playIndex
        });
      },

      addSingleToQueue: (song: Song) => {
        set({
          queue: [song],
          currentIndex: 0
        });
      },

      setCurrentIndex: (index: number) => {
        set((state) => ({
          currentIndex: Math.max(0, Math.min(index, state.queue.length - 1))
        }));
      },

      nextSong: () => {
        const state = get();
        if (state.queue.length === 0) return null;
        
        let nextIndex;
        if (state.isRepeating && state.currentIndex === state.queue.length - 1) {
          nextIndex = 0; // Volver al inicio si está en repeat
        } else {
          nextIndex = state.currentIndex + 1;
        }
        
        if (nextIndex >= state.queue.length) {
          return null; // No hay más canciones
        }
        
        set({ currentIndex: nextIndex });
        return state.queue[nextIndex];
      },

      previousSong: () => {
        const state = get();
        if (state.queue.length === 0) return null;
        
        const prevIndex = state.currentIndex - 1;
        if (prevIndex < 0) {
          if (state.isRepeating) {
            const lastIndex = state.queue.length - 1;
            set({ currentIndex: lastIndex });
            return state.queue[lastIndex];
          }
          return null;
        }
        
        set({ currentIndex: prevIndex });
        return state.queue[prevIndex];
      },

      shuffleQueue: () => {
        set((state) => {
          if (state.queue.length <= 1) return state;
          
          const currentSong = state.queue[state.currentIndex];
          const otherSongs = state.queue.filter((_, index) => index !== state.currentIndex);
          
          // Shuffle Fisher-Yates
          for (let i = otherSongs.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [otherSongs[i], otherSongs[j]] = [otherSongs[j], otherSongs[i]];
          }
          
          const shuffledQueue = [currentSong, ...otherSongs];
          
          return {
            queue: shuffledQueue,
            currentIndex: 0,
            isShuffled: !state.isShuffled
          };
        });
      },

      toggleRepeat: () => {
        set((state) => ({
          isRepeating: !state.isRepeating
        }));
      },

      moveInQueue: (fromIndex: number, toIndex: number) => {
        set((state) => {
          const newQueue = [...state.queue];
          const [movedSong] = newQueue.splice(fromIndex, 1);
          newQueue.splice(toIndex, 0, movedSong);
          
          let newCurrentIndex = state.currentIndex;
          if (fromIndex === state.currentIndex) {
            newCurrentIndex = toIndex;
          } else if (fromIndex < state.currentIndex && toIndex >= state.currentIndex) {
            newCurrentIndex = state.currentIndex - 1;
          } else if (fromIndex > state.currentIndex && toIndex <= state.currentIndex) {
            newCurrentIndex = state.currentIndex + 1;
          }
          
          return {
            queue: newQueue,
            currentIndex: newCurrentIndex
          };
        });
      }
    }),
    {
      name: 'cgplayer-playlist',
      version: 1
    }
  )
);
