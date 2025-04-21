# ForgeBoard: Blueprint UI Dashboard

## ✨ What Is This?
ForgeBoard is a dashboard experience inspired by 1970s Boeing engineering documentation. It merges real-time metrics with visual language from vintage blueprints, including:
- Angular Material 3 UI with WebSocket metrics
- Tiles drawn like CAD schematics
- Static metadata blocks styled like callouts
- Live updates and user-authored history

## 🎨 Style Guidelines
- **Color Palette**
  - Primary background: `#0d1b2a` (blueprint blue)
  - Text and lines: `#ffffff` (white)
  - Accent elements: `#4eff91` (terminal green)
- **Typography**
  - All fonts must be monospaced (IBM Plex Mono, Courier New)
  - Text should be uppercase for labels and headers
  - Technical data can use mixed case for readability
- **Layout Elements**
  - Grid system mimics large drafting sheets
  - Callout block uses SVG + animation to "plot" itself into place
  - Tiles have crisp outlines, no rounding, no shadows
  - Fixed margins and alignment based on technical drawing standards

## 📍 Tile Components
- **app-metrics-indicator**: Top-left cornerstone with real-time CPU and memory stats
- **app-connection-status**: Shows WebSocket connection health
- **app-recent-logs**: Displays recent system log entries
- **app-uptime-summary**: Shows system uptime statistics
- **app-activity-feed**: Displays user activity timeline
- **callout-block**: Bottom-right metadata with animated typewriter effect

## 🎬 Animation Guidelines
- Use `@keyframes drawOutline` and `drawLine` for SVG path animations
- Mimic plotting machine paths with stroke-dashoffset animations
- Text animation should use character-by-character typing effects
- Different typing speeds:
  - `typeKey` animations for labels (slower, deliberate)
  - `typeVal` animations for values (faster, machine-like)
- Sound effects synchronize with animations:
  - Slow typing for line starts
  - Fast typing for character sequence
  - Ding sound at the end of completed lines

## 🧠 Architecture & Expansion

### Component Structure
- All tiles should follow the non-standalone Angular component pattern
- Use NgModules for proper organization
- Maintain consistent blueprint styling across all components

### Adding New Tiles
1. Create a component in `tiles/your-component`
2. Apply the blueprint styling
3. Add to `app.module.ts` declarations
4. Include in the grid in `app.component.html`

### Technical Requirements
- Use Renderer2 for DOM manipulation instead of direct ElementRef
- Prefer hot RxJS Observables for data streams
- Follow all conventions in the [Coding Standards](./CODING-STANDARDS.md)

## 💡 Inspiration Sources
- Boeing/NASA style sheets from the Apollo and early Space Shuttle era
- Ammonia blueprinting reproduction lines
- Font/line spacing of early 1980s mechanical engineering documents
- White-on-blue monochrome CAD terminal displays
- Typewriter-based documentation from aerospace engineering departments

_This is an interface that honors structure, intention, and imagination._
