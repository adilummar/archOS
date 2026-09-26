const fs = require('fs');
let c = fs.readFileSync('src/lib/store/types.ts', 'utf8');

const target = `export interface Firm {
  id: string; name: string; logo?: string; address: string
  phone: string; email: string; gstin: string; website?: string
  planType: 'starter' | 'professional' | 'enterprise'
  priorityPeriodDays: number; minimumTaskLeadTimeDays: number;
  settings: FirmSettings; createdAt: string
}`;

const replacement = `export interface Firm {
  id: string; name: string; slug: string; status: 'ACTIVE' | 'SUSPENDED';
  onboardingState: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED';
  enabledFeatures: string[];
  logo?: string; address: string
  phone: string; email: string; gstin: string; website?: string
  planType: 'starter' | 'professional' | 'enterprise'
  priorityPeriodDays: number; minimumTaskLeadTimeDays: number;
  settings: FirmSettings; createdAt: string
}`;

c = c.replace(target, replacement);
fs.writeFileSync('src/lib/store/types.ts', c);
console.log("Patched types.ts");
