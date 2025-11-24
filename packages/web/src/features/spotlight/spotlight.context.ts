import { useSpotlightStore } from "./spotlight.store"

// Individual hooks for specific state slices
export const useSpotlightOpen = () => useSpotlightStore((state) => state.isOpen)
export const useSpotlightSearch = () => useSpotlightStore((state) => state.search)
export const useSpotlightPages = () => useSpotlightStore((state) => state.pages)
export const useSpotlightCurrentPage = () => {
  const pages = useSpotlightPages()
  return pages[pages.length - 1]
}

// Action hooks
export const useOpenSpotlight = () => useSpotlightStore((state) => state.openSpotlight)
export const useCloseSpotlight = () => useSpotlightStore((state) => state.closeSpotlight)
export const useToggleSpotlight = () => useSpotlightStore((state) => state.toggleSpotlight)
export const useSetSpotlightSearch = () => useSpotlightStore((state) => state.setSearch)
export const usePushSpotlightPage = () => useSpotlightStore((state) => state.pushPage)
export const usePopSpotlightPage = () => useSpotlightStore((state) => state.popPage)
export const useResetSpotlightPages = () => useSpotlightStore((state) => state.resetPages)
