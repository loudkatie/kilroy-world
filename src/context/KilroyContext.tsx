'use client';

import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { Circle, Place } from '@/lib/types';

interface KilroyContextType {
  place: Place | null;
  setPlace: (place: Place) => void;
  circle: Circle;
  setCircle: (circle: Circle) => void;
  isVerifiedHuman: boolean;
  setIsVerifiedHuman: (verified: boolean) => void;
  locationDenied: boolean;
  setLocationDenied: (denied: boolean) => void;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
}

const KilroyContext = createContext<KilroyContextType | null>(null);

export function KilroyProvider({ children }: { children: ReactNode }) {
  const [place, setPlace] = useState<Place | null>(null);
  const [circle, setCircle] = useState<Circle>('community');
  const [isVerifiedHuman, setIsVerifiedHuman] = useState(false);
  const [locationDenied, setLocationDenied] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  return (
    <KilroyContext.Provider
      value={{
        place,
        setPlace,
        circle,
        setCircle,
        isVerifiedHuman,
        setIsVerifiedHuman,
        locationDenied,
        setLocationDenied,
        isLoading,
        setIsLoading,
      }}
    >
      {children}
    </KilroyContext.Provider>
  );
}

export function useKilroy() {
  const context = useContext(KilroyContext);
  if (!context) {
    throw new Error('useKilroy must be used within a KilroyProvider');
  }
  return context;
}
