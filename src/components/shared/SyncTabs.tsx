"use client";

import { useEffect } from "react";
import { useActivityStore } from "@/lib/store/activity.store";
import { useAuthStore } from "@/lib/store/auth.store";
import { useChatStore } from "@/lib/store/chat.store";
import { useCrmStore } from "@/lib/store/crm.store";
import { useFileStore } from "@/lib/store/file.store";
import { useFinanceStore } from "@/lib/store/finance.store";
import { useFirmStore } from "@/lib/store/firm.store";
import { useLeaveStore } from "@/lib/store/leave.store";
import { useMeetingStore } from "@/lib/store/meeting.store";
import { useNotificationStore } from "@/lib/store/notification.store";
import { useProjectStore } from "@/lib/store/project.store";
import { usePunchlistStore } from "@/lib/store/punchlist.store";
import { useRequestStore } from "@/lib/store/request.store";
import { useRfiStore } from "@/lib/store/rfi.store";
import { useSitereportStore } from "@/lib/store/sitereport.store";
import { useTaskStore } from "@/lib/store/task.store";
import { useTimeStore } from "@/lib/store/time.store";
import { useVoStore } from "@/lib/store/vo.store";

export function SyncTabs() {
  useEffect(() => {
    const handleStorage = (e: StorageEvent) => {
      if (!e.key?.startsWith("archos-")) return;

      switch (e.key) {
        case "archos-activity": useActivityStore.persist.rehydrate(); break;
        case "archos-auth": useAuthStore.persist.rehydrate(); break;
        case "archos-chat": useChatStore.persist.rehydrate(); break;
        case "archos-crm": useCrmStore.persist.rehydrate(); break;
        case "archos-file": useFileStore.persist.rehydrate(); break;
        case "archos-finance": useFinanceStore.persist.rehydrate(); break;
        case "archos-firm": useFirmStore.persist.rehydrate(); break;
        case "archos-leave": useLeaveStore.persist.rehydrate(); break;
        case "archos-meeting": useMeetingStore.persist.rehydrate(); break;
        case "archos-notification": useNotificationStore.persist.rehydrate(); break;
        case "archos-project": useProjectStore.persist.rehydrate(); break;
        case "archos-punchlist": usePunchlistStore.persist.rehydrate(); break;
        case "archos-request": useRequestStore.persist.rehydrate(); break;
        case "archos-rfi": useRfiStore.persist.rehydrate(); break;
        case "archos-sitereport": useSitereportStore.persist.rehydrate(); break;
        case "archos-task": useTaskStore.persist.rehydrate(); break;
        case "archos-time": useTimeStore.persist.rehydrate(); break;
        case "archos-vo": useVoStore.persist.rehydrate(); break;
      }
    };

    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  return null;
}
