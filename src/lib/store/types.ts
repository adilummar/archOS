export type Role = 'admin' | 'team_lead' | 'staff' | 'accounts'
export type PortalRole = 'client' | 'contractor'
export type ProjectStatus = 'active' | 'on_hold' | 'completed' | 'cancelled'
export type TaskStatus = 'todo' | 'in_progress' | 'review' | 'approved' | 'done' | 'blocked'
export type Priority = 'low' | 'medium' | 'high' | 'urgent'
export type ApprovalStatus = 'pending' | 'approved' | 'revision_requested' | 'rejected'
export type FileStatus = 'informational' | 'final' | 'contractor_view' | 'superseded'
export type FileCategory =
  | 'architectural' | 'structural' | 'electrical' | 'interior'
  | 'landscape' | 'document' | 'photo' | 'report' | 'contract' | 'other'
export type MeetingMode = 'in_person' | 'phone' | 'google_meet' | 'teams' | 'site_visit'
export type LeadStage = 'new' | 'contacted' | 'proposal_sent' | 'negotiation' | 'won' | 'lost'
export type LeadSource = 'referral' | 'walk_in' | 'social_media' | 'website' | 'cold_call' | 'other'
export type ExpenseCategory = 'site_visit' | 'client_meeting' | 'materials' | 'travel' | 'printing' | 'other'
export type InvoiceStatus = 'draft' | 'sent' | 'partially_paid' | 'paid' | 'overdue'
export type RFIStatus = 'open' | 'responded' | 'closed'
export type PunchListStatus = 'open' | 'resolved_by_contractor' | 'confirmed_by_architect'
export type LeaveStatus = 'pending' | 'approved' | 'rejected'
export type VOStatus = 'draft' | 'pending_client' | 'approved' | 'rejected'
export type RequestStatus = 'pending' | 'fulfilled' | 'rejected'
export type DrawingPrefix = 'A' | 'S' | 'E' | 'I' | 'L' | 'D' | 'P' | 'O'

export interface Firm {
  id: string; name: string; logo?: string; address: string
  phone: string; email: string; gstin: string; website?: string
  planType: 'starter' | 'professional' | 'enterprise'
  settings: FirmSettings; createdAt: string
}

export interface FirmSettings {
  defaultFileRequestWindowDays: number
  clientApprovalReminderDays: number
  clientApprovalEscalateDays: number
  defaultCurrency: string
  drawingNumberingEnabled: boolean
  maxClientSessions: number
  portalBranding: { primaryColor?: string; logoUrl?: string }
}

export interface User {
  id: string; firmId: string; name: string; email: string; phone: string
  role: Role; designation: string; avatarInitials: string; avatarColor: string
  costRatePerHour: number; joinedAt: string
  status: 'active' | 'discontinued'; discontinuedAt?: string
}

export interface Client {
  id: string; firmId: string; name: string; company?: string
  phone: string; email: string; address?: string; gstin?: string
  portalEnabled: boolean; notes?: string; createdAt: string
}

export interface Contractor {
  id: string; firmId: string; name: string; company: string
  trade: string; phone: string; email: string; gstin?: string
  portalEnabled: boolean
}

export interface TemplateStage {
  id: string; name: string; order: number; defaultDurationDays: number
  description: string; isClientApprovalRequired: boolean
  isPaymentMilestone: boolean; paymentPercentage?: number
  drawingTypesExpected: FileCategory[]
}

export interface ProjectTemplate {
  id: string; firmId: string; name: string; description: string
  stages: TemplateStage[]
  feeStructure: 'lump_sum' | 'percentage' | 'per_stage'
  defaultFileRequestWindowDays: number; isDefault: boolean
}

export interface ProjectStage {
  id: string; templateStageId?: string; name: string; order: number
  status: 'pending' | 'in_progress' | 'completed' | 'blocked'
  isClientApprovalRequired: boolean
  clientApprovalStatus?: 'pending' | 'approved' | 'revision_requested'
  clientApprovalNote?: string; clientApprovedAt?: string
  clientApprovalRequestedAt?: string
  startDate?: string; plannedEndDate?: string; actualEndDate?: string
  paymentMilestone?: {
    amount: number; percentage?: number
    status: 'pending' | 'invoiced' | 'paid'; invoiceId?: string
  }
  description: string; drawingTypesExpected: FileCategory[]; isCustom: boolean
}

export interface Project {
  id: string; firmId: string; name: string; clientId: string; clientName: string
  contractorIds: string[]; templateId?: string; status: ProjectStatus
  stages: ProjectStage[]; currentStageId: string
  staffIds: string[]; teamLeadId?: string; location: string
  startDate: string; expectedEndDate: string; actualEndDate?: string
  projectValue?: number; feeAgreed: number
  feeStructure: 'lump_sum' | 'percentage' | 'per_stage'
  description?: string; fileRequestWindowDays: number
  chatEnabled: boolean; createdAt: string; updatedAt: string
}

export interface Subtask {
  id: string; title: string; completed: boolean
  createdById: string; assignedToId: string
  createdAt: string; completedAt?: string
}

export interface Task {
  id: string; firmId: string; projectId: string; stageId: string
  title: string; description?: string; assigneeId: string; assignerId: string
  status: TaskStatus; priority: Priority; dueDate: string
  startDate?: string; completedAt?: string
  approvalStatus?: ApprovalStatus; approvalNote?: string; approvedById?: string
  pendingChangeRequestId?: string; pendingVOId?: string
  subtasks: Subtask[]; tags?: string[]
  isBlocked: boolean; blockedReason?: string
  createdAt: string; updatedAt: string
}

export interface TimeLog {
  id: string; firmId: string; userId: string; projectId: string
  stageId?: string; phase: string; startTime: string; endTime?: string
  durationMinutes?: number; notes?: string; date: string
  isEdited: boolean; editApprovedById?: string; createdAt: string
}

export interface AttendanceRecord {
  id: string; firmId: string; userId: string; date: string
  status: 'present' | 'absent' | 'half_day' | 'on_leave'; leaveId?: string
}

export interface LeaveRequest {
  id: string; firmId: string; userId: string; userName: string
  startDate: string; endDate: string; days: number; reason?: string
  status: LeaveStatus; reviewedById?: string; reviewedAt?: string
  rejectionNote?: string; createdAt: string
}

export interface FileRevision {
  id: string; revisionNumber: number; uploadedById: string
  uploadedAt: string; notes?: string; fileSizeKb: number
  sharedWithClient: boolean; sharedWithContractorIds: string[]; sharedAt?: string
}

export interface ProjectFile {
  id: string; firmId: string; projectId: string; stageId?: string
  drawingNumber?: string; name: string; category: FileCategory
  status: FileStatus; currentRevision: number; revisions: FileRevision[]
  approvalStatus: ApprovalStatus; approvalNote?: string
  approvedById?: string; approvedAt?: string
  tags?: string[]; createdAt: string; updatedAt: string
}

export interface FileRequest {
  id: string; firmId: string; projectId: string
  requestedById: string; requesterType: 'client' | 'contractor'
  requesterName: string; linkedFileId?: string; description: string
  status: RequestStatus; responseDueDate: string
  fulfilledById?: string; fulfilledAt?: string
  fulfilledFileId?: string; rejectionNote?: string; createdAt: string
}

export interface VariationOrder {
  id: string; firmId: string; projectId: string; voNumber: string
  title: string; description: string; requestedByContractorId?: string
  raisedByUserId: string; affectedStageId?: string; affectedTaskId?: string
  status: VOStatus; timelineImpactDays: number; feeImpactAmount: number
  clientApprovalStatus?: 'pending' | 'approved' | 'rejected'
  clientApprovalNote?: string; clientApprovedAt?: string
  approvedByUserId?: string; approvedAt?: string
  createdAt: string; updatedAt: string
}

export interface ChangeRequest {
  id: string; firmId: string; projectId: string; taskId?: string
  requestedByContractorId: string; contractorName: string
  title: string; description: string
  impactsTimeline: boolean; impactsFee: boolean
  timelineImpactDays?: number; feeImpactAmount?: number
  status: RequestStatus
  assignedToId: string  // team lead; escalates to admin if fee/timeline affected
  approvedById?: string; approvedAt?: string
  rejectionNote?: string; linkedTaskId?: string
  createdAt: string; updatedAt: string
}

export interface RFI {
  id: string; firmId: string; projectId: string; rfiNumber: string
  title: string; description: string
  raisedById: string; raiserType: 'contractor' | 'client'; raiserName: string
  linkedDrawingId?: string; linkedDrawingNumber?: string
  status: RFIStatus; priority: Priority; responseRequiredBy?: string
  respondedById?: string; responseText?: string; respondedAt?: string
  closedAt?: string; createdAt: string
}

export interface PunchListItem {
  id: string; firmId: string; projectId: string; itemNumber: string
  description: string; location: string; photoDescription?: string
  assignedContractorId?: string; raisedById: string; dueDate?: string
  status: PunchListStatus; contractorResolvedAt?: string; contractorNote?: string
  architectConfirmedById?: string; architectConfirmedAt?: string; createdAt: string
}

export interface DailySiteReport {
  id: string; firmId: string; projectId: string; date: string
  reportedById: string; weather?: string; workCompleted: string
  mistakesOrIssues?: string; materialsReceived?: string
  workersPresent?: number; createdAt: string
}

export interface Meeting {
  id: string; firmId: string; projectId: string; title: string
  date: string; time: string; durationMinutes: number
  mode: MeetingMode; location?: string; meetingLink?: string
  attendeeIds: string[]; clientAttending: boolean; contractorIds: string[]
  remarks?: string
  expense?: { amount: number; description: string; submittedById: string }
  createdById: string; createdAt: string
}

export interface Expense {
  id: string; firmId: string; userId: string; projectId?: string
  meetingId?: string; category: ExpenseCategory; amount: number
  gstAmount?: number; description: string; date: string
  status: 'pending' | 'approved' | 'paid' | 'rejected'
  approvedById?: string; approvedAt?: string
  receiptDescription?: string; createdAt: string
}

export interface InvoiceLineItem {
  id: string; description: string; amount: number
  gstRate: number; gstAmount: number
  isAdHoc: boolean; milestoneStageId?: string
}

export interface Invoice {
  id: string; firmId: string; projectId: string; clientId: string
  invoiceNumber: string; lineItems: InvoiceLineItem[]
  subtotal: number; gstTotal: number; total: number
  status: InvoiceStatus; issuedDate: string; dueDate: string
  paidDate?: string; paidAmount?: number; paymentNotes?: string
  createdById: string; createdAt: string
}

export interface SalaryRecord {
  id: string; firmId: string; userId: string; month: string
  amount: number; status: 'pending' | 'paid'; paidDate?: string; paidById?: string
  createdAt?: string
}

export interface LeadNote {
  id: string; content: string; createdById: string; createdAt: string
}

export interface Lead {
  id: string; firmId: string; name: string; company?: string
  phone: string; email: string; projectType: string; estimatedValue?: number
  location?: string; source: LeadSource; stage: LeadStage
  assignedToId?: string; notes: LeadNote[]; followUpDate?: string
  convertedProjectId?: string; lostReason?: string
  createdAt: string; updatedAt: string
}

export interface ChatMessage {
  id: string; firmId: string; projectId: string
  senderId: string; senderName: string; senderType: 'staff' | 'client'
  content: string
  mentions: Array<{ type: 'file' | 'drawing' | 'user'; id: string; label: string }>
  readBy: string[]; createdAt: string
}

export type NotificationType =
  | 'task_assigned' | 'task_due_today' | 'task_overdue'
  | 'change_request_new' | 'change_request_resolved'
  | 'vo_new' | 'vo_approved' | 'vo_rejected'
  | 'rfi_new' | 'rfi_responded'
  | 'file_request_new' | 'file_request_fulfilled'
  | 'client_approval_needed' | 'client_approval_overdue'
  | 'meeting_scheduled' | 'meeting_rescheduled'
  | 'leave_request_new' | 'leave_approved' | 'leave_rejected'
  | 'invoice_created' | 'invoice_overdue'
  | 'punch_list_item_resolved'

export interface Notification {
  id: string; firmId: string; userId: string; type: NotificationType
  title: string; body: string; read: boolean; linkTo?: string
  entityId?: string; createdAt: string
}

export interface ActivityLog {
  id: string; firmId: string; userId: string; userName: string
  projectId?: string; entity: string; entityId: string
  action: string; description: string; createdAt: string
}