---
name: ui-ux-quality
description: Design and implement learner-facing StudyPack interfaces with a deliberate visual system, responsive behavior, accessibility and complete interaction states. Use for any UI or UX change in app/.
---

# StudyPack UI/UX Quality

Use this skill whenever a change affects a learner-facing screen, component, interaction or visual state.

## Workflow

1. Read the linked GitHub Issue and identify the learner's primary task, success state and failure/recovery state.
2. Inspect adjacent screens and existing design tokens before designing a new pattern.
3. Build a simple content-first hierarchy: task title, current question or result, primary action, then supporting information.
4. Implement desktop and narrow-screen layouts. Keyboard focus, readable contrast, clear labels and touch-friendly targets are required.
5. Cover loading, empty, error, disabled, selected, correct/incorrect and completed states that apply to the feature.
6. Run the app and visually inspect the changed flow before handing it off.

## Visual direction

- Prefer calm academic utility over decorative novelty.
- Use a restrained type scale, spacing scale and color palette; reuse tokens rather than one-off values.
- Make question text and answer choices the visual priority.
- Use color together with text or icons for correctness and status; never rely on color alone.
- Prefer meaningful feedback and progress cues over generic dashboard decoration.

## Avoid

- Generic AI-landing-page patterns: hero gradients, floating glass cards, ornamental blobs, excessive shadows or unrelated illustrations.
- Hiding the main action behind hover-only controls or ambiguous icons.
- Dense mobile layouts, tiny targets, low-contrast text, or animation that delays answering.
- Visual redesigns outside the accepted issue scope.

## Handoff

Report the screen states checked, responsive behavior checked and any UX trade-off left for a later issue.
