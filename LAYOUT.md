# ForgeBoard Layout Specification

## Overview

ForgeBoard uses a blueprint-inspired dashboard layout with Angular Material and custom SCSS. The design emphasizes technical drawing aesthetics, crisp outlines, and animated effects.

## Structure

- **App Root**: `.page-container` (full viewport, black border)
- **Header**: `.header-containter` (project title, fixed height)
- **Main Content**: `.content-container` (flex column)
  - **Layout Container**: `.layout-container` (main dashboard area, flex column, margin 1em sides)
    - **Tile Grid**: `.tile-grid-container` > `.tile-grid` (responsive, draggable tiles)
  - **Callout Block**: `.callout-container` (bottom, margin 1em sides, animated metadata)
- **Footer**: (optional, not always present)

## Key Guidelines

- Use flexbox for all major containers.
- Maintain consistent horizontal margins (1em) for all main blocks.
- Avoid fixed widths; use `width: auto` and margins for alignment.
- All backgrounds are transparent except for `.content-container` and `.callout-container`.
- Typography: Monospace fonts, uppercase for labels, mixed case for data.
- All tiles and callouts use crisp borders, no excessive shadows or rounding.

## Animation

- Use SVG and CSS keyframes for border and callout animations.
- Typewriter effect for metadata: animate each character with sound.
- Callout border turns yellow during animation.

## Best Practices

- Avoid redundant containers and unnecessary wrappers.
- Use Angular Renderer2 for DOM manipulation.
- Keep SCSS modular and avoid deep selectors.
- Prefer hot RxJS observables for real-time data.
- Do not use fixed pixel widths for main containers.

---
