# Implementation Prompt: Responsive Homepage & Navigation

## 1. Goal
Make the **Homepage (Dashboard)** and the global navigation layout (Sidebar, Header, Main content container) fully responsive across all device sizes — from large desktop displays (1440px+) down to standard tablets (768px-1024px), small tablets/large phones (540px-768px), and mobile devices (320px-480px).

---

## 2. Skills Read
- Workspace rules in `AGENTS.md` and `GEMINI.md`.
- No additional `.opencode/skills/` are present in the repository.

---

## 3. Existing Code Inspected
- `frontend/src/components/layout/AppLayout.jsx` & `AppLayout.css`: Shell layout containing Sidebar, Header, and `<Outlet />`. Currently sets fixed `margin-left: 260px` and shrinks to `60px` at 768px without mobile drawer capability.
- `frontend/src/components/layout/Sidebar.jsx` & `Sidebar.css`: Fixed sidebar navigation with logo, nav items, and user footer. On `<= 768px`, only collapses to 60px icon bar with text hidden.
- `frontend/src/components/layout/Header.jsx` & `Header.css`: Top bar with search input and user info. Lacks a mobile hamburger menu button to toggle the sidebar drawer.
- `frontend/src/pages/Dashboard.jsx` & `Dashboard.css`: Dashboard homepage containing:
  - Welcome Banner with hero illustration
  - 4 Stat Cards
  - 4 Interview Mode Cards
  - Progress Section with Recharts Donut & Motivational card
  - AI Performance Analysis with Recharts Radar, Progress Bars, and Insights
  - Recent Activity List
  - Quick Tips Footer (has `white-space: nowrap` which causes mobile horizontal overflow)

---

## 4. Current Behavior and Problem
1. **Mobile Navigation is Constrained**: On mobile devices (`<= 768px`), the sidebar compresses into a 60px icon strip that remains permanently fixed, eating into scarce mobile viewport width (~15-20% of a 375px phone screen). There is no mobile off-canvas drawer or hamburger toggle.
2. **Welcome Card Layout Breaking**: On screen widths `< 640px`, the hero illustration takes up `200px`, forcing the greeting text and CTA button into an excessively narrow column.
3. **Stats Row Stacks Vertically on Mobile**: On `<= 768px`, the 4 stat cards stack into a single vertical column (`flex-direction: column`), creating excessive vertical scrolling (over 400px of screen height for simple stats) instead of a balanced 2x2 grid.
4. **Horizontal Scroll Overflow in Quick Tips**: `.dash-tip-item` has `white-space: nowrap`, which forces horizontal scrolling on screens narrower than ~500px.
5. **Recent Activity Squishing**: On screens `< 520px`, the recent activity row squashes the interview type, score, and feedback action button together.
6. **AI Performance Grid Stacking**: On tablet breakpoints (640px-1024px), the 3-column performance layout collapses to 2 columns without span definitions, leaving unbalanced layout gaps.
7. **Header Search Bar Clogging on Small Screens**: On screens `< 480px`, the search input, notification icon, and profile menu become cramped.

---

## 5. Decisions and Assumptions
1. **Mobile Drawer Pattern**:
   - In `AppLayout.jsx`, maintain a `mobileSidebarOpen` state with an `onToggleSidebar` callback passed to `Header` and a `closeSidebar` callback passed to `Sidebar` and backdrop.
   - On screens `<= 768px`, the sidebar becomes an off-canvas drawer with smooth slide-in transition (`transform: translateX(-100%)` to `translateX(0)`) and a dim backdrop overlay (`.sidebar-backdrop`).
   - Clicking a navigation link or clicking the backdrop automatically closes the mobile drawer.
   - On screens `<= 768px`, `app-main-wrapper` has `margin-left: 0`, giving the content 100% width.
2. **Header Hamburger Button**:
   - Add a hamburger button (`Menu` / `X` icon from `lucide-react`) in `Header.jsx`, displayed only on `<= 768px`.
   - On small screens (`< 480px`), hide the chevron in user menu and optimize search bar padding.
3. **Welcome Banner Adaptation**:
   - Between 640px and 768px, scale down the hero illustration to 150px.
   - On screens `< 640px`, scale down illustration to 110px or stack/reposition gracefully. On very small mobile (`< 420px`), hide or position behind as a subtle watermark so greeting text and CTA have maximum clarity.
4. **Stats Row in a Balanced 2x2 Grid**:
   - On screens `<= 768px` down to 400px, display stats in a 2x2 grid (`grid-template-columns: repeat(2, 1fr)`).
   - On screens `< 400px`, maintain 2 compact columns with adjusted padding or stack as needed.
5. **Interview Mode Cards**:
   - Desktop (> 1024px): 4 columns.
   - Tablet (560px - 1024px): 2 columns.
   - Mobile (< 560px): 1 column.
6. **AI Performance Analysis**:
   - Desktop (> 1024px): 3 columns (`1fr 1fr 1fr`).
   - Tablet (640px - 1024px): Radar chart and Bar metrics in top row (2 columns), Strengths & Areas to Improve below spanning full width.
   - Mobile (< 640px): 1 single column (`1fr`).
7. **Recent Activity Items**:
   - On screens `< 520px`, make `.dash-activity-item` adapt with a clean 2-row or fluid layout: icon and details on top/left, score and "View Feedback" button aligned cleanly without text clipping.
8. **Fix Quick Tips Overflow**:
   - Replace `white-space: nowrap` on `.dash-tip-item` with normal wrapping and display tips as a neat responsive grid or flex list.

---

## 6. Files Likely to Change
- `frontend/src/components/layout/AppLayout.jsx` — Add state for mobile drawer and pass toggle/close handlers.
- `frontend/src/components/layout/AppLayout.css` — Update layout margins for mobile and backdrop styles.
- `frontend/src/components/layout/Sidebar.jsx` — Add close handler when clicking links on mobile, and close button in mobile header.
- `frontend/src/components/layout/Sidebar.css` — Transition styles, off-canvas positioning on `<= 768px`, backdrop styles.
- `frontend/src/components/layout/Header.jsx` — Add mobile hamburger toggle button.
- `frontend/src/components/layout/Header.css` — Hamburger button styles, responsive header spacing.
- `frontend/src/pages/Dashboard.css` — Comprehensive responsive styles for all breakpoints (1280px, 1024px, 768px, 640px, 480px, 360px).
- `frontend/src/pages/Dashboard.jsx` — Minor accessibility/attribute or wrapper updates if needed for responsive flow.

---

## 7. Implementation Requirements
- Fully responsive across 320px, 375px, 414px, 768px, 1024px, 1280px, and 1440px+.
- No horizontal scrollbars at any screen width.
- Preserves all existing colors, fonts, components, cards, charts, and data points.
- Smooth transition animations when opening/closing the mobile sidebar drawer.
- Accessible buttons with `aria-label` and `aria-expanded` attributes.

---

## 8. UI Preservation Requirements
- Existing desktop design (1200px container, sidebar, colors, typography, charts, stats) must remain 100% identical to the approved UI reference.
- No changes to design tokens in `index.css`.
- Design system showcase at `/design-system` remains untouched.

---

## 9. Acceptance Criteria
- [ ] Mobile drawer opens smoothly via hamburger button in Header on screens `<= 768px`.
- [ ] Mobile drawer closes when clicking backdrop, close button, or any navigation link.
- [ ] Desktop sidebar (> 768px) remains fixed at 260px with no hamburger button.
- [ ] Welcome banner renders cleanly on mobile without text distortion or overflow.
- [ ] Stats display in a clean 2x2 grid on mobile/tablet instead of a tall vertical stack.
- [ ] Interview modes adapt smoothly (4 cols -> 2 cols -> 1 col).
- [ ] AI Performance section stacks cleanly without empty gaps on tablet and mobile.
- [ ] Recent Activity cards display without clipping or overflowing on small screens (< 520px).
- [ ] Quick tips wrap cleanly with zero horizontal scrollbar on small viewports (< 400px).
- [ ] `npm run build` succeeds with zero errors.

---

## 10. Checks to Run
- `npm run build` in `frontend/`.
- Dev server check with multiple viewport widths tested (375px, 768px, 1024px, 1280px).

---

## 11. Exact Manual Test Steps Expected After Implementation
1. Run `npm run dev` in `frontend/`.
2. Open `http://localhost:5173/` in the browser.
3. Test Desktop (> 1024px): Verify 260px sidebar is visible, header has no hamburger, all 4 stats and 4 modes are horizontal.
4. Resize to Tablet (768px - 1024px): Verify layout smoothly transitions to 2-column mode cards and 2x2 stats.
5. Resize to Mobile (375px):
   - Verify sidebar is hidden and full content width is available.
   - Click hamburger button in header: verify sidebar slides in with dark overlay.
   - Click backdrop or a link: verify sidebar slides out and closes.
   - Inspect Welcome card, 2x2 Stats grid, Interview Mode cards, Donut chart, Radar chart, Recent activity list, and Quick Tips footer.
   - Confirm there is NO horizontal scrolling.
