# Chally Design Guidelines

## Must Keep

- **Background color must stay white.** Screens, page backgrounds, and primary app surfaces should be designed for a white background.
- Use white cards on white backgrounds with light borders, restrained shadows, and enough spacing.
- Do not introduce tinted full-page backgrounds unless the product direction explicitly changes.
- Use lucide-react for ordinary UI icons such as back, lock, plus, profile, search, and pagination controls.
- Use image generation only for brand-specific doodle assets or custom bitmap illustrations that genuinely need a hand-drawn style.
- Do not create ordinary UI icons with PowerShell, System.Drawing, ad hoc SVG primitives, or fake hand-drawn geometric assets.
- FAB add icons should use a 56px Chally key-color circular button and be placed as screen-level bottom-trailing overlays inside the mobile app frame with 16-24px right/bottom margin and safe-area awareness.
- Pagination dots should look visually small and tightly grouped, while their invisible hit targets remain at least 44x44px. Do not let enlarged hit targets visually push dots away from the section edge.
- When adding new bitmap illustration assets, use an actual image generation or illustration workflow and inspect the result before wiring it into the app.

## Current UI Direction

- Keep the interface quiet and mobile-app-like, not a landing page.
- Use the key color as an accent, not as a full-screen theme.
- Prefer compact, scannable cards for operational information like members, ranks, challenges, and records.
- Do not use keyword/category badges in the UI. Fill card space with useful operational information such as member count, challenge count, recent activity, participation state, or privacy state.
- Avoid duplicated labels in close proximity; keep title hierarchy clean.
- Long mobile screens must remain scrollable. Do not hide vertical overflow when it can make content, destructive actions, or list rows unreachable.
- Primary touch targets should be at least 44x44px. Icons may remain visually smaller inside that target.
- Prototype labels such as "status1" or "option" should not ship in the product UI; use task-oriented labels that explain the view.
- **Design from the UI pattern.** If a section uses paging, tabs, cards, or ranking, the inner layout must match that interaction pattern instead of keeping an unrelated list shape.
- **Explain weak instructions with evidence.** If a requested instruction would make the UI less clear, technically inconsistent, or harmful to the flow, explain what is wrong and persuade with concrete UI or implementation reasoning before proceeding.

## Communication

- Address the user as 공주님 consistently.
