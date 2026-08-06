import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import { uid } from "./uid";

export type ToastVariant = "default" | "success" | "warning" | "error";

export interface ToastItem {
  id: string;
  message: string;
  variant: ToastVariant;
  createdAt: number;
}

const MAX_TOASTS = 3;
const TOAST_DURATION_MS = 3000;

interface ToastState {
  toasts: ToastItem[];
  show: (message: string, variant?: ToastVariant) => void;
  dismiss: (id: string) => void;
}

export const useToastStore = create<ToastState>()(
  immer((set, get) => ({
    toasts: [],

    show: (message, variant = "default") => {
      const toast: ToastItem = {
        id: uid(),
        message,
        variant,
        createdAt: Date.now(),
      };
      set((state) => {
        state.toasts.push(toast);
        if (state.toasts.length > MAX_TOASTS) {
          state.toasts.shift();
        }
      });
      setTimeout(() => {
        if (get().toasts.some((t) => t.id === toast.id)) {
          get().dismiss(toast.id);
        }
      }, TOAST_DURATION_MS);
    },

    dismiss: (id) => {
      set((state) => {
        state.toasts = state.toasts.filter((t) => t.id !== id);
      });
    },
  }))
);

/** Convenience — fire a toast without importing the store shape everywhere. */
export const toast = (message: string, variant?: ToastVariant) =>
  useToastStore.getState().show(message, variant);
