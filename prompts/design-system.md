# Implementation Prompt: InterviewIQ Design System v1.0

## 1. Goal
Implement the comprehensive **InterviewIQ Design System v1.0** in the `frontend` React application, faithfully reproducing all design tokens, typography, colors, component primitives, and showcase layouts specified in the attached UI reference image.

---

## 2. Skills Read
- Workspace rules in `AGENTS.md` and `GEMINI.md`.
- No additional `.opencode/skills/` were requested or present.

---

## 3. Existing Code Inspected
- `frontend/package.json`: Contains React 19, Vite, Lucide-react (`^1.55.0`), Axios, React Router Dom, and Recharts.
- `frontend/index.html`: Contains default Vite boilerplate title and viewport.
- `frontend/src/index.css`: Contains default Vite demo styling.
- `frontend/src/App.jsx`: Contains the default Vite counter and logo links.
- `frontend/src/App.css`: Default Vite styles.

---

## 4. Current Behavior and Problem
The `frontend/` directory currently contains an unmodified Vite starter template. There is no design token architecture, no theme variables, no Inter font family configuration, and none of the reusable UI elements (Buttons, Category Chips, Form Fields, Progress Indicator, Score Meter, Cards) or the InterviewIQ brand identity defined in the design reference.

---

## 5. Decisions and Assumptions
1. **Design Token Foundation in `index.css`**:
   - **Color Palette**:
     - Primary (Dark Navy): `#111827`
     - Secondary (Slate): `#64748B`
     - Surface (White): `#FFFFFF`
     - Background: `#F8FAFC`
     - Accent (Indigo): `#4F46E5` (Hover: `#4338CA`)
     - Accent (Cyan): `#06B6D4`
     - Success (Green): `#16A34A`
     - Warning (Amber): `#F59E0B`
     - Error (Red): `#DC2626`
     - Border: `#E2E8F0`
   - **Typography**:
     - Font Family: `Inter`, sans-serif (imported via Google Fonts in `index.html`)
     - Scale:
       - H1: `32px`, Bold (`700`)
       - H2: `24px`, Semibold (`600`)
       - H3: `20px`, Semibold (`600`)
       - H4: `16px`, Medium (`500`)
       - Body: `14px`, Regular (`400`)
       - Caption: `12px`, Regular (`400`)
   - **Spacing System (4px base unit)**:
     - `4px`, `8px`, `16px`, `24px`, `32px`, `40px`, `64px`
   - **Shadows**:
     - Small: `0px 1px 2px rgba(0, 0, 0, 0.05)`
     - Medium: `0px 4px 12px rgba(0, 0, 0, 0.08)`
     - Large: `0px 12px 24px rgba(0, 0, 0, 0.12)`
   - **Border Radius**:
     - Small: `4px`
     - Medium: `8px`
     - Large: `12px`
     - Pill: `9999px`
   - **Grid System**:
     - Max content width: `1280px`
     - Gutters: `24px`
     - Margins: `24px`

2. **Component Architecture (`frontend/src/components/ui/`)**:
   - `Button`: Primary, Secondary, Outline, and Disabled variants with hover states and icon support.
   - `CategoryChip`: Pill badges for "Resume Interview" (indigo), "Technical" (cyan), "Behavioral" (green), and "HR" (amber) with their designated icons.
   - `Input`: Text input with label, prefix icon, and placeholder.
   - `Select`: Dropdown select control with chevron icon.
   - `ProgressIndicator`: Numbered 4-step progress indicator with active and inactive states.
   - `ScoreMeter`: Circular SVG radial gauge showing score (e.g., `82/100`) with breakdown indicators (Knowledge, Relevance, Communication, Confidence).
   - `Card`: Container component with rounded borders (`12px`), border color `#E2E8F0`, and shadow presets.

3. **Design System Showcase Page in `App.jsx`**:
   - Implement the complete reference board as an interactive UI showcase displaying:
     - Brand section (InterviewIQ logo, tagline, motto)
     - Color palette swatch cards with hex codes
     - Typography scale samples
     - UI Elements (Buttons grid, Category Chips, Form Fields, Progress Indicator, Score Meter)
     - Icon catalog (using `lucide-react`)
     - Card Examples:
       - Interview Performance card (Score meter, +12% pill, mini trend line, metrics row, "Start Interview" CTA)
       - Recommended Practice card (Python Developer, technical interview pill, 20 min, 10 questions, "Start Practice" CTA)
       - Recent Activity card (Technical interview, finished 2h ago, 86/100)
     - Spacing system visualizer
     - Grid system visualizer
     - Shadows & Border radius visualizers

---

## 6. Files Likely to Change / Create
- `frontend/index.html`: Add Inter font from Google Fonts and update page title to "InterviewIQ - AI Mock Interview Platform".
- `frontend/src/index.css`: Define CSS custom properties, utility classes, and global typography resets.
- `frontend/src/components/ui/Button.jsx`: Reusable button component.
- `frontend/src/components/ui/CategoryChip.jsx`: Category chips component.
- `frontend/src/components/ui/Input.jsx`: Form text input component.
- `frontend/src/components/ui/Select.jsx`: Dropdown select component.
- `frontend/src/components/ui/ProgressIndicator.jsx`: Multi-step progress indicator.
- `frontend/src/components/ui/ScoreMeter.jsx`: Circular score gauge component.
- `frontend/src/components/ui/Card.jsx`: Surface card container component.
- `frontend/src/App.jsx`: Full Design System showcase dashboard mirroring the reference image.
- `frontend/src/App.css`: Showcase board layout grid and panel styles.

---

## 7. Implementation Requirements & Design Preservation
- Maintain high visual fidelity matching the attached reference.
- Clean vanilla CSS design token system without introducing unapproved heavy frameworks.
- Zero breaking changes to the project build setup (`npm run build` and `npm run dev` must compile cleanly).
- Reusable modular components ready to be used in upcoming interview, resume, and coding practice modules.

---

## 8. Security & Error-Handling Requirements
- No secrets or credentials in frontend code.
- Inputs must have standard sanitization and accessible aria attributes.

---

## 9. Acceptance Criteria
- [ ] Inter font is loaded and applied across headings and body text.
- [ ] All 10 design token colors are defined in CSS variables and verified.
- [ ] Typography scale (H1: 32px, H2: 24px, H3: 20px, H4: 16px, Body: 14px, Caption: 12px) is implemented.
- [ ] UI components (Button, CategoryChip, Input, Select, ProgressIndicator, ScoreMeter, Card) are implemented and rendered.
- [ ] Card examples (Interview Performance, Recommended Practice, Recent Activity) match the visual reference layout.
- [ ] Spacing, shadows, and border-radius tokens match the reference specification.
- [ ] `npm run build` succeeds with zero errors.

---

## 10. Checks to Run
- `npm run build` inside `frontend/` to verify bundling and syntax.
- Visual inspection via browser.

---

## 11. Exact Manual Test Steps Expected After Implementation
1. Run `npm run dev` in `frontend/`.
2. Open `http://localhost:5173` in the browser.
3. Verify that the InterviewIQ Design System showcase renders with:
   - Header & Brand: "InterviewIQ - AI Mock Interview Platform".
   - Color palette swatches displaying `#111827`, `#64748B`, `#FFFFFF`, `#F8FAFC`, `#4F46E5`, `#06B6D4`, `#16A34A`, `#F59E0B`, `#DC2626`, `#E2E8F0`.
   - Typography samples for H1 through Caption.
   - Interactive button states (Primary, Secondary, Outline, Disabled) on hover and click.
   - Category chips (Resume Interview, Technical, Behavioral, HR) with distinct color badges.
   - Input fields and Select dropdown.
   - Score meter showing `82/100` radial arc and category breakdown.
   - Sample cards (Interview Performance, Recommended Practice, Recent Activity).
