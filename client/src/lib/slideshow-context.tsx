import { createContext, useContext, useState, ReactNode } from "react";

interface SlideshowContextType {
  openSlideshow: () => void;
  closeSlideshow: () => void;
  isOpen: boolean;
}

const SlideshowContext = createContext<SlideshowContextType | undefined>(undefined);

export function SlideshowProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);

  const openSlideshow = () => setIsOpen(true);
  const closeSlideshow = () => setIsOpen(false);

  return (
    <SlideshowContext.Provider value={{ openSlideshow, closeSlideshow, isOpen }}>
      {children}
    </SlideshowContext.Provider>
  );
}

export function useSlideshow() {
  const context = useContext(SlideshowContext);
  if (context === undefined) {
    throw new Error('useSlideshow must be used within a SlideshowProvider');
  }
  return context;
}