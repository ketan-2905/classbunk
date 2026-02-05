# UI/UX Design System: "Deep Glass" Specification

## 1. Design Philosophy
The "Deep Glass" system is designed for high-focus, professional applications. It prioritizes **data visibility**, **physical depth**, and **OLED optimization**. It moves away from flat design by using light as a way to define structure through transparency and blurring.

---

## 2. Core Color Palette (Atomic)
These colors are chosen for maximum contrast against an absolute black background.

| Category | Token | Value | Purpose |
| :--- | :--- | :--- | :--- |
| **Base** | `color-bg` | `#000000` | The infinite void. Used for the body background. |
| **Surface** | `color-surface` | `rgba(24, 24, 27, 0.4)` | The "Glass" layer. Zinc-900 at 40% opacity. |
| **Stroke** | `color-border` | `rgba(255, 255, 255, 0.05)` | The edge of the glass. High-definition hair-lines. |
| **Primary** | `color-accent-1` | `#38bdf8` (Sky) | Positive data, sleep, or "Normal" states. |
| **Secondary** | `color-accent-2` | `#3b82f6` (Blue) | Active states, movement, or "Action" items. |
| **Critical** | `color-accent-error`| `#ef4444` (Red) | Alerts, high strain, or critical failure. |
| **Muted** | `color-text-dim` | `#71717a` (Zinc-500) | Secondary labels and timestamps. |

---

## 3. The "Glass" Material System
To achieve depth, components must follow a strict layering logic.



### Elevation Rules:
1.  **Level 0 (Base):** Pure Black (`#000000`).
2.  **Level 1 (Cards):** `bg-zinc-900/40` + `backdrop-blur-md` + `border border-white/5`.
3.  **Level 2 (Modals/Popups):** `bg-zinc-800/60` + `backdrop-blur-xl` + `border border-white/10`.
4.  **Level 3 (Highlights):** Subtle linear gradients from `white/5` to `transparent` at a 135-degree angle.

---

## 4. Typography & Information Hierarchy
Typography is treated as a functional tool, not just decoration.

* **Primary Data:** Large, Bold, White. Focus on the number.
* **Contextual Labels:** Small (`10px` or `0.65rem`), Uppercase, `tracking-widest`. These should be Muted (`zinc-400`).
* **Interaction Cues:** Small icons (Lucide-React) paired with labels. Always use a Chevron (`>`) for navigable items.
* **Font Choice:** Use a clean San-Serif (Inter, Geist, or SF Pro). For brand identity, a slight *italic* slant adds a sense of "performance."

---

## 5. Layout Architecture (The "Atomic" Grid)
Standardize your containers to ensure a consistent feel across different screens.

### The 3-Tier Structure:
1.  **The Header (Navigation/Status):** High-level context (Who am I? What time is it?).
2.  **The Visual Core (Graphics/Stats):** The "Why I'm Here." Uses circular charts or high-impact visuals.
3.  **The Detail Feed (List/Cards):** The "What's Happening." Full-width cards with transparent backgrounds.



---

## 6. Component Guidelines

### A. Progress Indicators (Rings/Bars)
* Always use **Round Linecaps**.
* Include a "Ghost Track" (the background circle) at a very low opacity (`zinc-800`).
* Animations should be `cubic-bezier(0.4, 0, 0.2, 1)` with a 1-second duration.

### B. Action Buttons
* **Primary Action:** Solid white or a vibrant gradient.
* **Secondary Action:** Glass-style (Blurred background with white border).
* **Ghost Action:** Label and Icon only, no background.

### C. Status Indicators (Chips)
* Use a low-opacity background of the status color (e.g., `bg-emerald-500/10`) with high-opacity text (`text-emerald-500`). This creates a "glow" effect without being harsh.

---

## 7. Interactive Philosophy
1.  **Haptic Expectation:** Every card should have a subtle hover/active state (e.g., `brightness-125`).
2.  **Density:** Don't fear the "Small Text." In a pro-app, density is often more valuable than whitespace.
3.  **Consistency:** If an icon represents "Health" on one screen, it must never represent "Settings" on another.