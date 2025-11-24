import { create } from "zustand"

export interface SpotlightState {
  // Dialog state
  isOpen: boolean
  search: string
  pages: string[]
  
  // Actions
  openSpotlight: (initialPage?: string) => void
  closeSpotlight: () => void
  toggleSpotlight: () => void
  setSearch: (search: string) => void
  pushPage: (page: string) => void
  popPage: () => void
  resetPages: () => void
}

export const useSpotlightStore = create<SpotlightState>((set) => ({
  isOpen: false,
  search: "",
  pages: [],

  openSpotlight: (initialPage) =>
    set({
      isOpen: true,
      search: "",
      pages: initialPage ? [initialPage] : [],
    }),

  closeSpotlight: () =>
    set({
      isOpen: false,
      search: "",
      pages: [],
    }),

  toggleSpotlight: () =>
    set((state) => ({
      isOpen: !state.isOpen,
      search: state.isOpen ? "" : state.search,
      pages: state.isOpen ? [] : state.pages,
    })),

  setSearch: (search) => set({ search }),

  pushPage: (page) =>
    set((state) => ({
      pages: [...state.pages, page],
      search: "",
    })),

  popPage: () =>
    set((state) => ({
      pages: state.pages.slice(0, -1),
      search: "",
    })),

  resetPages: () => set({ pages: [], search: "" }),
}))
