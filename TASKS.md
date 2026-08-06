# ArchStudio — Build Tasks
# Claude Code reads this at the start of every session.
# Update this file after completing each task — mark [x] done, add notes under blockers.
# Never skip ahead. Each phase must be solid before the next begins.

---

## HOW TO USE THIS FILE

At the start of each session:
- Find the first unchecked [ ] task
- Complete it fully (built, styled, wired to store, empty state, skeleton loader)
- Mark it [x]
- Update the CURRENT STATUS section at the bottom
- Move to the next task if time/context allows

A task is NOT done until:
- It matches the design tokens from /references/
- It is connected to the correct Zustand store (no hardcoded data)
- It has an empty state
- It has a skeleton loader (1.2 second show on mount)
- It fires toasts on all actions
- It is responsive (sidebar collapses on mobile)

---

## PHASE 1 — FOUNDATION
# Nothing else starts until every item in Phase 1 is done.

- [x] 1.1  Read /references/ images → extract design tokens → write src/styles/tokens.css
           (colors, typography, spacing, radius, sidebar behavior — all documented as CSS vars)

- [x] 1.2  Configure Tailwind to use CSS custom properties from tokens.css
           Override shadcn/ui theme to match tokens completely

- [x] 1.3  Create src/lib/store/types.ts — complete type system exactly as in CLAUDE.md

- [x] 1.4  Create all 18 Zustand stores with full TypeScript
           Each store: initial empty state + all CRUD actions + immer middleware
           Stores: auth, firm, project, task, time, leave, file, request,
                   vo, rfi, punchlist, sitereport, meeting, finance, crm,
                   chat, notification, activity

- [x] 1.5  Create src/lib/demo/seed.ts with seedAllStores()
           Firm 1: Coastal Design Associates — full realistic data (see CLAUDE.md)
           Firm 2: Forma Studio — minimal data (3 staff, 2 projects)
           All demo data must be Kerala-based, realistic architecture firm context

- [x] 1.6  Create shared components: StatusBadge, Avatar, EmptyState
           These are used everywhere — get them right first

- [x] 1.7  Create Drawer component (Framer Motion, ESC + backdrop close, 440px)

- [x] 1.8  Create Toast system (global, Zustand-driven, bottom-right)

- [x] 1.9  Create SkeletonCard and SkeletonRow components

---

## PHASE 2 — APP SHELL AND ENTRY

- [x] 2.1  (root)/page.tsx — Firm selector (SaaS landing)
           Two firm cards from demo data. Click → firm login.

- [x] 2.2  (firm-auth)/[firmSlug]/login/page.tsx
           Role selector pills: Admin / Team Lead / Staff / Accounts
           "Load Demo Data & Enter" button (calls seedAllStores, redirects to dashboard)
           "Client Portal →" and "Contractor Portal →" links

- [x] 2.3  (firm-app)/[firmSlug]/layout.tsx — Sidebar + Topbar
           Sidebar: firm logo, nav groups, current user card, notification bell
           Topbar: page title, ⌘K search bar, user dropdown
           Sidebar collapses to icons on mobile
           Navigation groups as defined in CLAUDE.md file structure

- [x] 2.4  Wire active nav state — highlight current route in sidebar

---

## PHASE 3 — DASHBOARD

- [x] 3.1  Dashboard layout and section structure
           Sections: greeting, quick stats, today's work, active clock-in,
           upcoming (7 days), leave alerts, pending approvals, unresponded RFIs,
           recent activity feed, project health snapshot (admin only)

- [x] 3.2  Today's Work section
           Tasks due today from Zustand, grouped by project
           Each row: priority dot, project chip, task title, status toggle, due time
           Click row → TaskDrawer

- [x] 3.3  Active clock-in widget
           If clocked in: live ticker (HH:MM:SS), project name, phase, stop button
           If not: project dropdown + phase dropdown + start button
           Must be persistent across page navigation (Zustand active log)

- [x] 3.4  Upcoming section
           Tasks and meetings for next 7 days, grouped by day label
           Overdue section above "Today" in warning color

- [x] 3.5  Pending approvals section (admin + team lead)
           Change requests awaiting decision, inline approve/reject
           Stage gate approvals overdue

- [x] 3.6  Recent activity feed and project health snapshot

---

## CURRENT STATUS

Last updated: 2026-08-06 (Session 6)
Current phase: 9 / 12
Current task: 9.6 Client portal — Invoices tab
Last completed: 9.5 Client portal — Chat tab
Blockers: —
Notes: Built Chat tab with real-time project messaging.
       Remaining: Phase 9 client portal, Phase 10 contractor portal,
       11.3 ConfirmDialog, 11.4 super admin, Phase 12 polish.

---

## SESSION LOG

[Claude Code appends to this section after each session]
[Format: Date | Tasks completed | What was built | Any decisions made | Next task]

2026-08-01 Session 1 | 1.1–1.9, 2.1–2.2 | Design tokens, all 18 Zustand stores, seed data (2 firms full data), shared components (StatusBadge, Avatar, Drawer, Toast, Skeleton, EmptyState), firm selector page, firm login page | Theme: dark, accent: rust-orange | Next: 2.3 app shell

2026-08-01 Session 2 | 2.3–2.4, 3.1–3.6 | Sidebar (collapsible, nav groups, active state), Topbar (search, bell, user dropdown), firm app layout (auth guard, seed), full dashboard (greeting, stats, today's tasks, overdue, upcoming, clock widget, project health, RFI alerts, leave approvals, activity feed) | Store API fixes applied | Next: 4.1 projects list

2026-08-05 Session 5 | Audit + record sync | Verified repo state: Phases 4–7 complete, Phase 8 complete except 8.2, 11.1–11.2 done; TypeScript compiles clean | Marked TASKS.md to match reality | Next: 8.2 templates editor, then Phase 9 client portal

2026-08-06 Session 6 | 8.2 | Built Settings Project Templates editor with drag-and-drop using @dnd-kit | Phase 8 complete | Next: 9.1 Client portal auth
2026-08-06 Session 6 | 9.1 | Built client portal auth with simulated OTP and max session checking | Phase 9 started | Next: 9.2 Client portal layout
2026-08-06 Session 6 | 9.2 | Built Client Portal layout and PortalHeader component | Next: 9.3 Client portal — Overview tab
2026-08-06 Session 6 | 9.3 | Built Client Portal Overview tab with stage gate approval logic | Next: 9.4 Client portal — Files tab
2026-08-06 Session 6 | 9.4 | Built Client Portal Files tab with file requests form and file viewer list | Next: 9.5 Client portal — Chat tab
2026-08-06 Session 6 | 9.5 | Built Client Portal Chat tab bridging client and firm | Next: 9.6 Client portal — Invoices tab

---

## PHASE 4 — PROJECTS

- [x] 4.1  Projects list — grid view
           Cards: name, client, stage badge, task-based % progress bar, team avatars, deadline chip
           Hover: quick actions appear

- [x] 4.2  Projects list — list view (sortable table) + status filter tabs + new project slide-in

- [x] 4.3  Project detail — header (sticky) + stage timeline bar
           Stage timeline: horizontal, completed/current/future states, pulsing current stage
           Client approval stages: key icon visible
           On-hold banner when applicable

- [x] 4.4  Project detail — Overview tab
           Stage list with dates and payment milestones
           Client info card, team list, fee summary

- [x] 4.5  Project detail — Tasks tab (list view)
           Filter by stage, assignee, priority, status
           Blocked tasks show via status filter (dedicated blocked section folded into kanban column)

- [x] 4.6  Project detail — Tasks tab (kanban view)
           Columns: Todo, In Progress, Review, Approved, Done, Blocked
           @dnd-kit drag between columns

- [x] 4.7  TaskDrawer component (full spec from CLAUDE.md)
           Inline title edit, status/priority controls, date pickers, description,
           subtasks (add/complete inline), approval controls, activity log,
           assignee reassign control + change request banner

- [x] 4.8  Project detail — Files tab
           File list with drawing numbers, status badges, revision chips
           Category/status filters. Upload button + FileDrawer wiring in progress (4.9).

- [x] 4.9  FileDrawer component
           Revision history table, status controls, share toggles,
           approval controls for admin/lead

- [x] 4.10 Project detail — Meetings tab + Add Meeting form

- [x] 4.11 Project detail — RFI tab

- [x] 4.12 Project detail — Punch List tab

- [x] 4.13 Project detail — Site Reports tab

- [x] 4.14 Project detail — Change Requests tab (CR + file requests combined)

- [x] 4.15 Project detail — Variation Orders tab

- [x] 4.16 Project detail — Finance tab (admin/lead only)
           Fee milestone tracker, expense summary, cost vs fee, profitability indicator

- [x] 4.17 Project detail — Chat tab
           Bubble chat UI, firm staff right / client left
           @mention picker placeholder (files, drawings, staff)

- [x] 4.18 Project detail — Activity tab

---

## PHASE 5 — TASKS AND TIME

- [x] 5.1  Tasks page — my tasks list with filters and group-by
           Overdue rows: red date, red left border

- [x] 5.2  Tasks page — kanban view with @dnd-kit

- [x] 5.3  Time tracker page
           Active session card (top, prominent)
           Today's log table (editable)
           Analytics: week bar chart, project donut, phase breakdown

- [x] 5.4  Time tracker — team view (admin/lead toggle)
           Stacked bar per person, attendance table

---

## PHASE 6 — OPERATIONS

- [x] 6.1  Leave management page
           My leave tab: submit form, history, mini calendar
           Team leave tab (admin): approval queue, team calendar, conflicts warning

- [x] 6.2  Meetings page (firm-wide, all projects)
           Upcoming / past split, add meeting form, reschedule

- [x] 6.3  RFI page (firm-wide)
           Unresponded RFIs surfaced first, response drawer

- [x] 6.4  Punch list page for a project (delivered as Punch List tab in project detail)

- [x] 6.5  Site reports page for a project (firm-wide /site-reports page with project filter)

---

## PHASE 7 — BUSINESS LAYER

- [x] 7.1  CRM page — kanban with lead cards
           Won/Lost column visual distinction

- [x] 7.2  Lead drawer
           Contact info, notes history, stage dropdown, follow-up date,
           Convert to Project button (when won), lost reason field
           Client profile link

- [x] 7.3  Finance page — My Expenses tab
           Submit expense form, expense history table

- [x] 7.4  Finance page — My Salary tab (Salary tab, admin/accounts)

- [x] 7.5  Finance page — Team & Invoices tab (admin/accounts)
           Invoices sub-tab: list, create invoice form, invoice drawer with GST breakdown
           Staff Expenses sub-tab: all staff, editable by accounts
           Payroll sub-tab

- [x] 7.6  Change Requests page (firm-wide)
           Impact badges prominent, inline approve/reject

- [x] 7.7  Variation Orders page (firm-wide)
           VO lifecycle: draft → pending client → approved/rejected

---

## PHASE 8 — SETTINGS

- [x] 8.1  Settings — Firm Profile section

- [x] 8.2  Settings — Project Templates section
           Template editor: drag-to-reorder stages, edit all stage fields,
           add/remove stages, drawing types per stage

- [x] 8.3  Settings — Staff & Roles section
           Active staff list, edit role/cost rate, discontinue staff
           Discontinued staff section with task-reassignment interface

- [x] 8.4  Settings — Portal Settings section
           File request window, approval reminder days, max sessions, branding

- [x] 8.5  Settings — Notification Preferences section

- [x] 8.6  Settings — Leave Settings section

---

## PHASE 9 — CLIENT PORTAL

- [x] 9.1  Client portal auth (client/login)
           Email input → simulated OTP (show 6-digit code in a toast for demo)
           OTP input (6-digit custom component)
           Session limit: block 4th login with message

- [x] 9.2  Client portal layout — minimal header, horizontal tab nav

- [x] 9.3  Client portal — Overview tab
           Visual stage timeline, current stage indicator, what's next section
           Stage gate approval section (when applicable):
             Approve & Proceed button + confirmation
             Request Revision button + remarks textarea
           Overdue approval banner

- [x] 9.4  Client portal — Files tab
           Shared files with status badges (For Discussion / Final)
           Informational files: view only, no download, amber badge
           Final files: download (simulated toast)
           Request file button → form with project timeline dropdown

- [x] 9.5  Client portal — Chat tab
           Same messages as project chat (firm portal), filtered by project
           Client messages right-aligned, firm messages left-aligned

- [ ] 9.6  Client portal — Invoices tab
           Invoice list, line items with GST breakdown, payment status

- [ ] 9.7  Client portal — Requests tab
           File request history, RFI history, status badges

---

## PHASE 10 — CONTRACTOR PORTAL

- [ ] 10.1 Contractor portal auth (contractor/login)
            Same OTP flow as client portal

- [ ] 10.2 Contractor portal layout

- [ ] 10.3 Contractor portal — Drawings tab
            Only this contractor's trade files OR explicitly shared files
            All other drawings invisible (filter in Zustand selector)
            Request drawing button

- [ ] 10.4 Contractor portal — RFI tab
            Raise RFI form, my RFIs list with responses

- [ ] 10.5 Contractor portal — Progress Updates tab
            Submit form: date, work completed, mistakes, materials, workers
            Past updates list

- [ ] 10.6 Contractor portal — Punch List tab
            Assigned items, mark as resolved with note

---

## PHASE 11 — GLOBAL FEATURES

- [x] 11.1 CommandPalette (⌘K)
            Search: projects, tasks, files, staff, leads, RFIs
            Grouped results, keyboard navigation

- [x] 11.2 NotificationPanel (topbar bell slide-in)
            Grouped by Today / Earlier
            Mark all read, click to navigate

- [ ] 11.3 ConfirmDialog (global)
            Used for: lock project, discontinue staff, delete items
            Destructive variant

- [ ] 11.4 Super admin page (/super)
            Table of all firms: name, plan, staff count, project count, created date

---

## PHASE 12 — POLISH AND QUALITY

- [ ] 12.1 Responsive audit — all pages on mobile viewport
            Sidebar collapses, drawers go full-width, tables scroll horizontally

- [ ] 12.2 Empty states — audit every list and table, write specific copy for each

- [ ] 12.3 Skeleton loaders — confirm every data section has 1.2s skeleton on mount

- [ ] 12.4 Toast audit — confirm every action fires appropriate toast

- [ ] 12.5 Activity log audit — confirm every store action writes a log entry

- [ ] 12.6 Notification audit — confirm all relevant actions create notifications

- [ ] 12.7 Reduced motion — confirm all animations respect prefers-reduced-motion

- [ ] 12.8 TypeScript strict audit — zero any, zero unsafe as casts

- [ ] 12.9 Firm isolation audit — confirm no cross-firm data leaks in any store selector

- [ ] 12.10 Final visual audit — every screen matches /references/ design system

---

## CURRENT STATUS

Last updated: [Claude Code updates this after each session]
Current phase: 1
Current task: 1.1
Last completed: —
Blockers: —
Notes: —

---

## SESSION LOG

[Claude Code appends to this section after each session]
[Format: Date | Tasks completed | What was built | Any decisions made | Next task]