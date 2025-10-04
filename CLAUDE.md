# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

Universal Block is a designless polymorphic WordPress Gutenberg block that can transform into any HTML element with full attribute control. It provides a flexible tag-based architecture supporting static HTML elements, dynamic content with Timber/Twig integration, and custom web components.

## Development Commands

```bash
# Install dependencies
npm install

# Development mode (watch mode with hot reload)
npm run start
# or
npm run dev

# Production build
npm run build

# Linting
npm run lint:js         # Lint JavaScript files
npm run lint:css        # Lint CSS files

# Formatting
npm run format:js       # Format JavaScript with Prettier

# Testing
npm run test            # Run unit tests
```

## Architecture

### Tag-Based System

The plugin uses a tag-based architecture where blocks are defined by:
- **Tag Name**: The HTML element (p, div, h1, img, loop, if, set, etc.)
- **Content Type**: How content is handled (text, blocks, html, empty)
- **Category**: Logical grouping (common, layout, text, media, dynamic, custom)

Tag configurations are centralized in [src/config/tags/index.js](src/config/tags/index.js) with category definitions in [src/config/tags/categories.js](src/config/tags/categories.js).

### Content Types

1. **text**: Rich text content (RichText component) for inline text elements
2. **blocks**: InnerBlocks for container elements with nested blocks
3. **html**: Raw HTML content via Ace Editor with Emmet support
4. **empty**: Self-closing/void elements (img, hr, br)

### Dynamic Tags & Timber Integration

The plugin supports dynamic content processing through custom tags:

- **`<set>`**: Variable assignment (`<set variable="myVar" value="post.title" />`)
- **`<if>`**: Conditional rendering (`<if source="user.ID > 0">...</if>`)
- **`<loop>`**: Iteration over data (`<loop source="posts">...</loop>`)

**Processing Pipeline:**
1. Blocks render to HTML with dynamic tags ([includes/blocks/render-element.php](includes/blocks/render-element.php))
2. Dynamic tags parsed to Twig syntax ([includes/parser/class-dynamic-tag-parser.php](includes/parser/class-dynamic-tag-parser.php))
3. Twig compiled with Timber context (filter in [universal-block.php](universal-block.php) at priority 11)

The preview API ([includes/api/class-preview-api.php](includes/api/class-preview-api.php)) provides real-time preview of dynamic content in the editor.

### Dual Rendering System

**Editor (React):**
- Main edit component: [src/components/Edit.js](src/components/Edit.js)
- Toolbar controls for tag selection and content type
- Inspector panels for attributes, classes, and custom settings
- Dynamic preview mode for testing Twig/Timber output

**Frontend (PHP):**
- Server-side rendering: [includes/blocks/render-element.php](includes/blocks/render-element.php)
- No wrapper elements (direct HTML output)
- Sanitization based on content type (wp_kses_post, extended for SVG)

### Key Components

**Core Components:**
- [Edit.js](src/components/Edit.js): Main editor component with contentType routing
- [TagControls.js](src/components/TagControls.js): Tag selection UI
- [AttributesPanel.js](src/components/AttributesPanel.js): Global attributes management
- [ClassesPanel.js](src/components/ClassesPanel.js): CSS class management with Tailwind autocomplete
- [AceEditor.js](src/components/AceEditor.js): HTML editor with Emmet support

**Utilities:**
- [htmlToBlocks.js](src/utils/htmlToBlocks.js): Converts HTML to Gutenberg blocks (see [docs/parsers](docs/parsers/))
- [blocksToHtml.js](src/utils/blocksToHtml.js): Converts blocks back to HTML (see [docs/parsers](docs/parsers/))
- [ContextAnalyzer.js](src/utils/ContextAnalyzer.js): Analyzes available Twig context
- [PreviewManager.js](src/utils/PreviewManager.js): Manages dynamic preview state

### Parser System

The plugin includes a bidirectional parsing system for 100% consistent HTML ↔ Block conversion:

- **HTML to Blocks Parser**: [src/utils/htmlToBlocks.js](src/utils/htmlToBlocks.js) - Converts HTML markup to block structures
- **Blocks to HTML Parser**: [src/utils/blocksToHtml.js](src/utils/blocksToHtml.js) - Converts block structures back to HTML
- **Documentation**: [docs/parsers/](docs/parsers/) - Comprehensive parser documentation
  - [Parser Overview](docs/parsers/README.md) - System overview and roundtrip consistency
  - [HTML to Blocks](docs/parsers/html-to-blocks.md) - Forward conversion details
  - [Blocks to HTML](docs/parsers/blocks-to-html.md) - Reverse conversion details

**Key Features:**
- Structure preservation: Exact DOM hierarchy maintained
- Attribute preservation: All attributes preserved with proper escaping
- Custom element support: Dynamic tags (`<set>`, `<loop>`, `<if>`) handled correctly
- Roundtrip guarantee: HTML → Blocks → HTML produces structurally identical output

## Important Implementation Details

### Attribute Storage

- **globalAttrs**: Object storing all HTML attributes EXCEPT class (id, style, data-*, aria-*, href, src, etc.)
- **className**: WordPress-managed classes (official WordPress way, managed by PlainClassesManager)
- **content**: Text/HTML content (not used for blocks contentType)
- **tagName**: Current HTML element
- **contentType**: Content handling mode
- **uiState**: UI preferences (category, selections)
- **isDynamic**: Flag for dynamic preview mode

### Migration & Backward Compatibility

The plugin migrated from `elementType` (legacy) to the tag-based system. Migration happens automatically in [Edit.js](src/components/Edit.js) lines 170-183 and [render-element.php](includes/blocks/render-element.php) lines 24-35.

### Block Conversion

Users can convert between content types:
- **HTML → Blocks**: Parser converts HTML to nested Gutenberg blocks
- **Blocks → HTML**: Serializer converts block tree back to HTML string

Conversion buttons appear contextually in the Block Conversion panel.

### Copy/Paste System

Global clipboard (`universalBlockClipboard`) allows copying:
- Classes only
- Attributes only
- Both classes and attributes

Accessible via toolbar dropdown menu.

### Dynamic Processing

When `isDynamic` is enabled, the block fetches processed HTML from the preview API endpoint, which:
1. Serializes the block and children to HTML
2. Processes dynamic tags through the parser
3. Compiles Twig with full Timber context
4. Returns compiled HTML for preview

This enables WYSIWYG editing of dynamic content.

## File Structure Highlights

```
universal-block/
├── src/                              # React source files
│   ├── components/                   # UI components
│   ├── config/tags/                  # Tag configuration system
│   ├── transforms/                   # Block transforms
│   └── utils/                        # Utility functions
├── includes/                         # PHP backend
│   ├── blocks/                       # Block rendering
│   ├── parser/                       # Dynamic tag parser
│   ├── api/                          # REST API endpoints
│   ├── editor/                       # Editor customizations
│   └── admin/                        # Admin functionality
├── assets/                           # Static assets
│   ├── global/                       # Third-party libraries (Ace, Emmet)
│   └── react-components/             # Standalone React apps
├── block.json                        # Block metadata
└── universal-block.php               # Main plugin file
```

## REST API Endpoints

- `POST /wp-json/universal-block/v1/preview`: Full page context preview
- `POST /wp-json/universal-block/v1/dynamic-preview`: Individual block preview with Timber processing

## Timber Context

The plugin extends Timber context with:
- Post data (post, post.meta)
- User data (user, user.ID)
- Custom page data (page_data)
- Test data for preview mode (test_array, user_count, is_featured)

Context is available in dynamic tags via Twig syntax: `{{ post.title }}`, `{{ user.display_name }}`

## Dependencies

**PHP:**
- WordPress 6.0+
- PHP 7.4+
- Timber/Twig 2.3+ (composer)

**JavaScript:**
- @wordpress/scripts (build tooling)
- React 17+ (via WordPress)
- Ace Editor (HTML editing)
- js-beautify (HTML formatting)
- Emmet (HTML abbreviation expansion)

## Code Standards

- React functional components with hooks
- WordPress coding standards for PHP
- ESLint configuration via @wordpress/scripts
- Server-side sanitization for all output (wp_kses, esc_attr, esc_url)

## Testing Dynamic Tags

Use the test file [test-dynamic-tags.php](test-dynamic-tags.php) to test dynamic tag parsing and Twig compilation outside the editor.

## Special Considerations

- **No wrapper elements**: The block renders direct HTML without WordPress wrapper divs (except in editor)
- **Self-closing tags**: Use proper self-closing syntax for void elements
- **Custom elements**: Tags with hyphens are treated as web components
- **Set tags are invisible**: They render variables but don't display in output
- **Context awareness**: Preview system analyzes available Twig context for better autocomplete