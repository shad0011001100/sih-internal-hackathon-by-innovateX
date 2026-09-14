import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

interface AuthState {
  isAuthenticated: boolean;
  role: string | null;
  userId: number | null;
  phone: string | null;
  name: string | null;
  ward: string | null;
  locality: string | null;
  setAuth: (role: string, userId: number) => void;
  setPhone: (phone: string) => void;
  updateProfile: (data: { name?: string; ward?: string; locality?: string }) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      isAuthenticated: false,
      role: null,
      userId: null,
      phone: null,
      name: null,
      ward: "Ward 4 (Morabadi)",
      locality: "Ranchi Urban Zone",
      setAuth: (role, userId) => set({ isAuthenticated: true, role, userId }),
      setPhone: (phone) => set({ phone }),
      updateProfile: (data) => set((state) => ({ ...state, ...data })),
      logout: () => set({ isAuthenticated: false, role: null, userId: null, phone: null, name: null }),
    }),
    {
      name: 'sociosolve_auth_session',
      storage: createJSONStorage(() => localStorage),
    }
  )
)
