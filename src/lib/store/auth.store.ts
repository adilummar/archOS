import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import { persist, createJSONStorage } from "zustand/middleware";
import type { Firm, User } from "./types";

export interface PortalSession {
  type: "client" | "contractor";
  entityId: string; // client id or contractor id
  entityName: string;
  /** Client sessions are capped by firm settings (max 3); tracks live sessions. */
  sessions: number;
}

interface AuthState {
  user: User | null;
  firm: Firm | null;
  portalSession: PortalSession | null;
  /** True while the app is running inside a portal (client / contractor). */
  isPortal: boolean;

  login: (user: User, firm: Firm) => void;
  logout: () => void;
  loginPortal: (session: PortalSession) => void;
  logoutPortal: () => void;
  incrementPortalSessions: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    immer((set) => ({
    user: null,
    firm: null,
    portalSession: null,
    isPortal: false,

    login: (user, firm) => {
      set((state) => {
        state.user = user;
        state.firm = firm;
        state.isPortal = false;
        state.portalSession = null;
      });
    },

    logout: () => {
      set((state) => {
        state.user = null;
        state.firm = null;
        state.isPortal = false;
        state.portalSession = null;
      });
    },

    loginPortal: (session) => {
      set((state) => {
        state.portalSession = session;
        state.isPortal = true;
        state.user = null;
        state.firm = null;
      });
    },

    logoutPortal: () => {
      set((state) => {
        state.portalSession = null;
        state.isPortal = false;
      });
    },

    incrementPortalSessions: () => {
      set((state) => {
        if (state.portalSession) {
          state.portalSession.sessions += 1;
        }
      });
    },
  })),
  {
    name: "archos-auth",
    storage: createJSONStorage(() => sessionStorage),
  }
  )
);
