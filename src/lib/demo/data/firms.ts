import type { Firm } from "../../store/types";

export const firm1: Firm = {
  id: "firm-cda",
  name: "Coastal Design Associates",
  address: "2nd Floor, Sea Breeze Tower, Kannur Road, Kozhikode, Kerala 673001",
  phone: "+91 495 276 5432",
  email: "hello@coastaldesign.in",
  gstin: "32ABCDE1234F1Z5",
  website: "coastaldesign.in",
  planType: "professional",
  settings: {
    defaultFileRequestWindowDays: 14,
    clientApprovalReminderDays: 3,
    clientApprovalEscalateDays: 7,
    defaultCurrency: "INR",
    drawingNumberingEnabled: true,
    maxClientSessions: 3,
    portalBranding: { primaryColor: "#e55230" },
  },
  createdAt: "2023-04-10",
};

export const firm2: Firm = {
  id: "firm-forma",
  name: "Forma Studio",
  address: "5th Floor, Marine Square, MG Road, Kochi, Kerala 682016",
  phone: "+91 484 405 2211",
  email: "studio@formastudio.in",
  gstin: "32FGHIJ5678K2L3",
  website: "formastudio.in",
  planType: "starter",
  settings: {
    defaultFileRequestWindowDays: 10,
    clientApprovalReminderDays: 3,
    clientApprovalEscalateDays: 7,
    defaultCurrency: "INR",
    drawingNumberingEnabled: true,
    maxClientSessions: 3,
    portalBranding: { primaryColor: "#e55230" },
  },
  createdAt: "2024-09-01",
};
