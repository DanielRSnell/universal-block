# Editor Tweaks Web Component Redesign Project

## Project Overview

**Goal:** Transform the current plain HTML editor tweaks component into a modern, isolated web component with native Gutenberg styling and improved UX.

**Current Issues:**
- Plain HTML with basic CSS styling
- Fixed overlay behavior (covers canvas)
- No style isolation (potential conflicts)
- Basic styling that doesn't match Gutenberg design system
- Limited modularity and maintainability

## Design Requirements

### 1. **Web Component Architecture**
- **Isolated Styles** - Shadow DOM for complete style encapsulation
- **Modular Structure** - Component-based architecture
- **No Global Conflicts** - Styles contained within component scope
- **Reusable Components** - Button, Panel, Drawer, etc.

### 2. **Styling System: Gutenberg + Shadcn Fusion**
- **Base Layer:** Gutenberg design tokens and variables
- **Component Layer:** Shadcn-inspired component patterns
- **Colors:** WordPress admin color palette
- **Typography:** WordPress editor font stacks
- **Spacing:** Gutenberg spacing scale
- **Animations:** Smooth, accessible transitions

### 3. **UX Improvements**
- **Canvas Push Behavior** - Drawer pushes content instead of overlaying
- **Native Feel** - Matches Gutenberg interface patterns
- **Responsive Design** - Works across different screen sizes
- **Accessibility** - ARIA attributes, keyboard navigation
- **Smooth Animations** - 60fps transitions with proper easing

### 4. **Icon System**
- **Lucide Icons** - Consistent, modern icon library
- **SVG Components** - Properly sized and styled
- **Semantic Usage** - Icons with proper labels and contexts

## Technical Architecture

### Web Component Structure
```
<universal-editor-tweaks>
  #shadow-root
    <style>
      /* Isolated CSS using CSS custom properties */
    </style>
    <div class="sidebar">
      <universal-button icon="code" @click="toggleDrawer">
    </div>
    <universal-drawer :open="drawerOpen">
      <universal-panel title="Import HTML">
        <universal-textarea placeholder="Paste HTML...">
        <universal-button-group>
          <universal-button variant="primary">Convert & Insert</universal-button>
          <universal-button variant="secondary">Copy as Blocks</universal-button>
        </universal-button-group>
      </universal-panel>
    </universal-drawer>
</universal-editor-tweaks>
```

### Component Hierarchy
```
UniversalEditorTweaks (main)
├── UniversalSidebar
│   └── UniversalButton
├── UniversalDrawer
│   ├── UniversalPanel
│   ├── UniversalTextarea
│   └── UniversalButtonGroup
│       └── UniversalButton (variant: primary/secondary)
└── Shared Components
    ├── UniversalIcon (Lucide wrapper)
    └── UniversalTooltip
```

## Design Tokens (CSS Custom Properties)

### Colors (WordPress Admin Palette)
```css
:host {
  --wp-admin-theme-color: #007cba;
  --wp-admin-theme-color-darker: #005a87;
  --wp-background: #f0f0f1;
  --wp-background-secondary: #ffffff;
  --wp-border: #c3c4c7;
  --wp-border-light: #e0e0e0;
  --wp-text: #1e1e1e;
  --wp-text-secondary: #757575;
  --wp-success: #00a32a;
  --wp-warning: #dba617;
  --wp-error: #d63638;
}
```

### Spacing (Gutenberg Scale)
```css
:host {
  --spacing-xs: 4px;
  --spacing-sm: 8px;
  --spacing-md: 12px;
  --spacing-lg: 16px;
  --spacing-xl: 24px;
  --spacing-2xl: 32px;
}
```

### Typography
```css
:host {
  --font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  --font-size-sm: 13px;
  --font-size-base: 14px;
  --font-size-lg: 16px;
  --font-weight-normal: 400;
  --font-weight-semibold: 600;
  --line-height-sm: 1.4;
  --line-height-base: 1.5;
}
```

### Shadows & Elevation
```css
:host {
  --shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.05);
  --shadow-md: 0 4px 6px rgba(0, 0, 0, 0.1);
  --shadow-lg: 0 10px 15px rgba(0, 0, 0, 0.1);
  --shadow-drawer: 2px 0 8px rgba(0, 0, 0, 0.15);
}
```

## Component Specifications

### 1. UniversalSidebar
```css
.sidebar {
  width: 60px;
  height: 100vh;
  background: var(--wp-background);
  border-right: 1px solid var(--wp-border);
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: var(--spacing-md) 0;
}
```

### 2. UniversalDrawer
```css
.drawer {
  width: 350px;
  height: 100vh;
  background: var(--wp-background-secondary);
  border-right: 1px solid var(--wp-border);
  box-shadow: var(--shadow-drawer);
  transform: translateX(-100%);
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.drawer--open {
  transform: translateX(0);
}
```

### 3. UniversalButton (Shadcn-inspired)
```css
.button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-sm) var(--spacing-md);
  border-radius: 6px;
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
  line-height: var(--line-height-sm);
  transition: all 0.2s ease;
  cursor: pointer;
  border: 1px solid transparent;
}

.button--primary {
  background: var(--wp-admin-theme-color);
  color: white;
  border-color: var(--wp-admin-theme-color);
}

.button--primary:hover {
  background: var(--wp-admin-theme-color-darker);
  border-color: var(--wp-admin-theme-color-darker);
}

.button--secondary {
  background: transparent;
  color: var(--wp-admin-theme-color);
  border-color: var(--wp-border);
}

.button--secondary:hover {
  background: var(--wp-background);
}
```

## Canvas Push Implementation

### Current (Overlay)
```css
.editor-canvas {
  margin-left: 60px; /* Fixed sidebar width */
}

.drawer {
  position: fixed;
  z-index: 999999;
}
```

### New (Push Behavior)
```css
.editor-canvas {
  margin-left: var(--sidebar-width, 60px);
  transition: margin-left 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.editor-canvas--drawer-open {
  margin-left: calc(var(--sidebar-width, 60px) + var(--drawer-width, 350px));
}
```

## File Structure

```
/assets/components/
├── editor-tweaks/
│   ├── UniversalEditorTweaks.js        # Main web component
│   ├── components/
│   │   ├── UniversalSidebar.js
│   │   ├── UniversalDrawer.js
│   │   ├── UniversalButton.js
│   │   ├── UniversalPanel.js
│   │   ├── UniversalTextarea.js
│   │   └── UniversalIcon.js
│   ├── styles/
│   │   ├── tokens.css                  # Design tokens
│   │   ├── components.css              # Component styles
│   │   └── animations.css              # Transition definitions
│   └── utils/
│       ├── icons.js                    # Lucide icon registry
│       └── canvas-manager.js           # Canvas push/pull logic
```

## Implementation Phases

### Phase 1: Foundation ✅ COMPLETED
- [x] Set up web component base class
- [x] Implement shadow DOM with style isolation
- [x] Create design token system
- [x] Build basic sidebar component
- [x] Lucide icon integration system
- [x] Canvas manager for push behavior
- [x] Main UniversalEditorTweaks component
- [x] Demo and testing environment

**Phase 1 Results:**
- Complete web component architecture with Shadow DOM isolation
- Comprehensive design token system (colors, spacing, typography, shadows)
- Modular component library (Sidebar, Icons, Canvas Manager)
- Working demo with interactive controls
- Zero global CSS conflicts
- Full Gutenberg design language integration

### Phase 2: Core Components
- [ ] UniversalButton with variants
- [ ] UniversalDrawer with animations
- [ ] UniversalPanel layout component
- [ ] Lucide icon integration

### Phase 3: Advanced Features
- [ ] Canvas push behavior
- [ ] Responsive design
- [ ] Accessibility improvements
- [ ] Performance optimizations

### Phase 4: Integration
- [ ] Replace current HTML implementation
- [ ] Test across different editor contexts
- [ ] Documentation and examples

## Benefits

### For Developers
- **Isolated Styles** - No more CSS conflicts
- **Modular Architecture** - Easy to extend and maintain
- **Type Safety** - Better development experience
- **Reusable Components** - Consistent patterns

### For Users
- **Native Feel** - Matches Gutenberg design language
- **Better UX** - Canvas push instead of overlay
- **Responsive** - Works on all screen sizes
- **Accessible** - Proper keyboard and screen reader support

### For Maintenance
- **Encapsulated** - Changes don't affect global styles
- **Testable** - Components can be tested in isolation
- **Scalable** - Easy to add new features
- **Future-proof** - Modern web standards

## Success Criteria

- [ ] Complete style isolation (no global CSS leaks)
- [ ] Matches Gutenberg visual design language
- [ ] Canvas push behavior working smoothly
- [ ] All components fully accessible
- [ ] Performance metrics maintained or improved
- [ ] Zero breaking changes to existing functionality