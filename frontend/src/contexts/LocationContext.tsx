import React, { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { useAuthContext } from './AuthContext';
import { useUpdateLocation } from '@/hooks/useAuth';

export interface LocationState {
  lat: number;
  lng: number;
  address?: string;
}

interface LocationContextType {
  location: LocationState | null;
  setLocation: (lat: number, lng: number, address?: string) => void;
  isLoading: boolean;
  requestGeolocation: () => void;
}

const LocationContext = createContext<LocationContextType | undefined>(undefined);

const LOCAL_STORAGE_KEY = 'sf_customer_location';

export function LocationProvider({ children }: { children: ReactNode }) {
  const { user, isAuthenticated } = useAuthContext();
  const updateLocationMutation = useUpdateLocation();
  const [location, setLocationState] = useState<LocationState | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Khởi tạo location: Ưu tiên DB (nếu đã đăng nhập) -> LocalStorage -> Geolocation
  useEffect(() => {
    let initialLocation: LocationState | null = null;

    if (isAuthenticated && user?.latitude && user?.longitude) {
      initialLocation = {
        lat: user.latitude,
        lng: user.longitude,
        address: user.address || undefined
      };
      // Lưu lại xuống LocalStorage để dự phòng
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(initialLocation));
      setLocationState(initialLocation);
      setIsLoading(false);
    } else {
      const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (stored) {
        try {
          initialLocation = JSON.parse(stored);
          setLocationState(initialLocation);
          setIsLoading(false);
        } catch (e) {
          console.error("Lỗi parse location từ local storage", e);
        }
      } else {
        // Lần đầu vào web, tự động xin quyền
        requestGeolocation();
      }
    }
  }, [isAuthenticated, user?.latitude, user?.longitude]);

  const requestGeolocation = useCallback(() => {
    setIsLoading(true);
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const newLoc = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            address: 'Vị trí hiện tại'
          };
          setLocationState(newLoc);
          localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(newLoc));
          setIsLoading(false);
        },
        (error) => {
          console.warn("Lấy vị trí tự động thất bại hoặc bị từ chối:", error);
          setIsLoading(false);
        },
        { timeout: 10000 }
      );
    } else {
      setIsLoading(false);
    }
  }, []);

  const setLocation = useCallback((lat: number, lng: number, address?: string) => {
    const newLoc = { lat, lng, address };
    setLocationState(newLoc);
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(newLoc));

    if (isAuthenticated) {
      updateLocationMutation.mutate({ latitude: lat, longitude: lng, address });
    }
  }, [isAuthenticated, updateLocationMutation]);

  return (
    <LocationContext.Provider value={{ location, setLocation, isLoading, requestGeolocation }}>
      {children}
    </LocationContext.Provider>
  );
}

export function useLocationContext() {
  const context = useContext(LocationContext);
  if (context === undefined) {
    throw new Error('useLocationContext must be used within a LocationProvider');
  }
  return context;
}
