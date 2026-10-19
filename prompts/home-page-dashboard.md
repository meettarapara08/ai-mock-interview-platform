# Implementation Prompt: Dashboard Home Page

## 1. Goal
Implement the **Dashboard Home Page** for the AI Mock Interview Platform, faithfully matching the attached UI reference image. This page replaces the current Design System showcase in `App.jsx` and becomes the main landing page users see after logging in.

---

## 2. Skills Read
- Workspace rules in `AGENTS.md` and `GEMINI.md`.
- No additional `.opencode/skills/` were present or requested.

---

## 3. Existing Code Inspected
- `frontend/index.html` — Inter font loaded, correct page title
- `frontend/src/index.css` — Design tokens (colors, typography, spacing, shadows, radii) defined
- `frontend/src/App.jsx` — Currently renders the Design System showcase board
- `frontend/src/App.css` — Showcase board layout styles
- `frontend/src/main.jsx` — Standard React entry
- `frontend/src/components/ui/Button.jsx` + `.css` — Reusable button (primary, secondary, outline)
- `frontend/src/components/ui/Card.jsx` + `.css` — Card, CardHeader, CardBody, CardFooter
- `frontend/src/components/ui/ScoreMeter.jsx` + `.css` — Circular SVG gauge with legend
- `frontend/src/components/ui/CategoryChip.jsx` + `.css` — Category pill badges
- `frontend/src/components/ui/Input.jsx` + `.css`, `Select.jsx` + `.css`, `ProgressIndicator.jsx` + `.css`
- `frontend/package.json` — React 19, Vite 8, lucide-react, recharts, react-router-dom, axios
- `frontend/vite.config.js` — Vite with React plugin (no Tailwind plugin configured despite being in devDeps)

---

## 4. Current Behavior and Problem
The app currently renders a Design System reference board in `App.jsx`. There is no dashboard home page, no sidebar navigation, no top header bar, and no interview mode cards. The user wants the actual application home page implemented matching the attached UI.

---

## 5. Decisions and Assumptions

1. **Routing**: Set up `react-router-dom` with a `BrowserRouter` in `main.jsx`. Create a layout component with sidebar + header that wraps page routes. The Dashboard is the default `/` route. Other sidebar links will be placeholder routes for now.

2. **Layout Architecture**:
   - `components/layout/Sidebar.jsx` — Fixed left sidebar with navigation items and user footer
   - `components/layout/Header.jsx` — Top bar with search, notification bell, and user avatar
   - `components/layout/AppLayout.jsx` — Wrapper combining sidebar + header + main content area
   - `pages/Dashboard.jsx` — The dashboard home page content

3. **Dashboard Sections** (matching the UI image):
   - **Welcome Banner**: "Good Morning, Meet Tarapara" greeting with subtitle, "Start New Interview" CTA button, and hero illustration
   - **Stats Row**: 4 stat cards — Total Interviews (12), Average Score (78%), Practice Time (6.5 hrs), Current Streak (5 days) with trend indicators
   - **Start an Interview**: 4 interview mode cards (Resume-Based, Technical, Behavioral, HR/Managerial) each with icon, description, and arrow CTA
   - **Your Progress**: Donut chart showing 72% Overall Progress with category breakdown (Technical 78%, Behavioral 65%, HR/Managerial 60%, Coding 85%), motivational message
   - **AI Performance Analysis**: Spider/radar chart (Knowledge 82, Relevance 76, Communication 78, Confidence 74, Behavior 74), horizontal bar chart with percentages, Strengths list, Areas to Improve list
   - **Recent Activity**: 4 recent interview entries with type, role, date, score, and "View Feedback" links
   - **Quick Tips Footer**: Horizontal bar with tips

4. **Charts**: Use `recharts` (already installed) for the radar chart and donut chart.

5. **Data**: All data is static/hardcoded for now (no backend API calls). This matches the UI reference image values exactly.

6. **Hero Illustration**: Generate an illustration image matching the UI reference showing interview preparation figures.

7. **Sidebar Navigation Items** (matching the image):
   - Dashboard (active)
   - Resume-Based Interview
   - Technical Interview
   - Behavioral Interview
   - HR / Managerial Interview
   - Coding Practice
   - Interview History
   - Progress & Analytics
   - Settings

8. **Design System Preservation**: The existing design system showcase (`App.jsx` current content) will be moved to a separate route (`/design-system`) so it's not lost. The new dashboard becomes the default route.

---

## 6. Files Likely to Change / Create

### New Files:
- `frontend/src/components/layout/Sidebar.jsx` — Left sidebar navigation
- `frontend/src/components/layout/Sidebar.css` — Sidebar styles
- `frontend/src/components/layout/Header.jsx` — Top header bar
- `frontend/src/components/layout/Header.css` — Header styles
- `frontend/src/components/layout/AppLayout.jsx` — Layout wrapper
- `frontend/src/components/layout/AppLayout.css` — Layout grid styles
- `frontend/src/pages/Dashboard.jsx` — Dashboard home page
- `frontend/src/pages/Dashboard.css` — Dashboard styles
- `frontend/src/pages/DesignSystem.jsx` — Moved design system showcase (preserves current App.jsx content)

### Modified Files:
- `frontend/src/App.jsx` — Replace showcase with router setup and layout
- `frontend/src/App.css` — Remove showcase styles (they move to DesignSystem.jsx), add any remaining global app styles
- `frontend/src/main.jsx` — Wrap App in BrowserRouter

---

## 7. Implementation Requirements

### Sidebar
- Fixed left sidebar, ~240px wide
- Logo area: "AI Mock Interview" with tagline "Practice · Improve · Get Hired" and robot/brain icon
- Navigation items with lucide-react icons, active state highlight (indigo background pill)
- User footer at bottom with avatar initial, name, email, logout icon
- Smooth hover transitions

### Header
- Full-width top bar above content
- Search input with magnifier icon and placeholder "Search interview types, questions, or job roles..."
- Notification bell with red dot badge
- User avatar with "Meet Tarapara" name and dropdown chevron

### Dashboard Content
- **Welcome Card**: Blue gradient background (subtle), greeting text, description, "Start New Interview" button with play icon, hero illustration on right side
- **4 Stat Cards**: Each with colored icon badge, value, label, and green/blue trend indicator. Cards: Total Interviews (12, up 2 this week), Average Score (78%, up 6% this week), Practice Time (6.5 hrs, 1.2 hrs this week), Current Streak (5 days, up 2 days)
- **Start an Interview Section**: 4 cards in a row, each with category icon in colored circle, title, description, arrow button
- **Your Progress Section**: Circular donut chart (72% center), color-coded legend for 4 categories, motivational card at bottom with emoji
- **AI Performance Analysis Section**: Radar chart (5 axes), horizontal bar chart with 4 metrics, Strengths (green check items), Areas to Improve (red triangle items)
- **Recent Activity Section**: List of 4 interview entries with type icon badge, interview type, role, date, score percentage, "View Feedback" link
- **Quick Tips Footer**: Horizontal strip with lightbulb icon, tip text, and 4 tip items with check icons

### Visual Fidelity
- Match the exact color usage from the UI reference
- Clean white cards with subtle borders and shadows
- Proper spacing using the design token system
- Responsive behavior for smaller screens

---

## 8. UI Preservation Requirements
- All existing UI components (`Button`, `Card`, `CategoryChip`, `ScoreMeter`, `Input`, `Select`, `ProgressIndicator`) remain untouched
- Design tokens in `index.css` remain unchanged
- The Design System showcase is preserved at `/design-system` route

---

## 9. Security & Error-Handling Requirements
- No secrets or credentials in frontend code
- No API calls (static data for now)
- All interactive elements have accessible aria attributes
- All elements have unique IDs where relevant for testing

---

## 10. Acceptance Criteria
- [ ] Sidebar renders with all navigation items, logo, and user footer
- [ ] Header renders with search bar, notification bell, and user avatar
- [ ] Dashboard welcome banner shows greeting, description, CTA button, and illustration
- [ ] 4 stat cards display with correct values and trend indicators
- [ ] 4 interview mode cards display with icons, titles, descriptions, and arrow CTAs
- [ ] Your Progress section shows donut chart with 72% center, category legend, motivational card
- [ ] AI Performance Analysis shows radar chart, bar metrics, strengths, and areas to improve
- [ ] Recent Activity shows 4 interview entries with scores and "View Feedback" links
- [ ] Quick Tips footer strip renders
- [ ] Design System showcase is accessible at `/design-system`
- [ ] `npm run build` succeeds with zero errors
- [ ] Layout is responsive and sidebar collapses appropriately on small screens

---

## 11. Checks to Run
- `npm run build` inside `frontend/` to verify bundling
- Visual inspection via browser at `http://localhost:5173`
- Navigate to `/design-system` to verify showcase is preserved

---

## 12. Exact Manual Test Steps Expected After Implementation
1. Run `npm run dev` in `frontend/`.
2. Open `http://localhost:5173` in the browser.
3. Verify the left sidebar with navigation items is visible with "Dashboard" highlighted.
4. Verify the top header bar with search, bell icon, and user name.
5. Verify the welcome banner with "Good Morning, Meet Tarapara" greeting.
6. Verify 4 stat cards row (Total Interviews, Average Score, Practice Time, Current Streak).
7. Verify 4 interview mode cards (Resume-Based, Technical, Behavioral, HR/Managerial).
8. Verify "Your Progress" section with donut chart showing 72%.
9. Verify "AI Performance Analysis" section with radar chart and metrics.
10. Verify "Recent Activity" section with 4 interview entries.
11. Verify "Quick Tips" footer bar.
12. Navigate to `http://localhost:5173/design-system` and verify the original showcase renders.
