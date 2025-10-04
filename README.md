# Universal Block

A designless polymorphic WordPress Gutenberg block that can transform into any HTML element with full attribute control. Build anything from simple paragraphs to complex dynamic templates using a single, flexible block.

## Features

### Core Capabilities
- **🎯 Polymorphic HTML Elements**: Transform into any HTML tag (div, section, article, img, a, h1-h6, etc.)
- **🎨 Designless Architecture**: Zero injected styles - your theme controls the appearance
- **⚙️ Full Attribute Control**: Set any HTML attributes (id, class, style, data-*, aria-*, href, src, etc.)
- **🔄 Bidirectional Parsing**: Convert HTML ↔ Blocks with 100% structural consistency
- **🌲 Timber/Twig Integration**: Dynamic content with loop, if, and set tags
- **🎭 Custom Web Components**: Support for custom elements with hyphens
- **📦 No Wrapper Elements**: Direct HTML output, no WordPress wrapper divs

### Advanced Features
- **Plain Classes Manager**: Tokenized UI for easy CSS class management with Tailwind support
- **Image Settings Panel**: Visual media library picker with metadata
- **Link Settings Panel**: Post/page picker or external URL with target and ARIA controls
- **Preview Context System**: Test Timber/Twig templates with real post/WooCommerce data
- **Dynamic Tag Settings**: Context-aware inputs for loop, if, and set tags
- **HTML Import/Export**: Paste HTML to create blocks, export blocks to HTML
- **Automatic Block IDs**: Unique identifiers for targeting and debugging

## Installation

### Quick Start
1. Clone or download this repository into `wp-content/plugins/`
2. Install dependencies and build:
   ```bash
   cd universal-block
   npm install
   npm run build
   ```
3. Activate **Universal Block** in WordPress Admin → Plugins

### Requirements
- WordPress 6.0+
- PHP 7.4+
- Node.js 18+ (for development)
- Timber/Twig 2.3+ (for dynamic features)

## Development

```bash
# Install dependencies
npm install

# Development mode (watch with hot reload)
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

## Usage

### Basic Usage

1. **Insert Block**: Add "Universal Element" block in the editor
2. **Choose Tag**: Select from common tags (div, section, article, etc.) or enter custom tag
3. **Set Content Type**:
   - **Blocks**: Container with nested blocks (InnerBlocks)
   - **Text**: Rich text content (RichText)
   - **HTML**: Raw HTML via Ace Editor with Emmet support
   - **Empty**: Self-closing/void elements (img, hr, br)
4. **Add Classes**: Use the Plain Classes Manager for easy class management
5. **Configure Attributes**: Set id, data-*, aria-*, or any HTML attribute

### Content Types Explained

#### Blocks (Container)
Use for layout elements that contain other blocks:
```html
<div class="container mx-auto">
  <!-- Other blocks nested here -->
</div>
```

#### Text
Use for inline text elements:
```html
<h1>Welcome to My Site</h1>
<p>This is a paragraph of text.</p>
```

#### HTML
Use for complex markup, SVGs, or custom code:
```html
<svg viewBox="0 0 100 100">
  <circle cx="50" cy="50" r="40" />
</svg>
```

#### Empty
Use for self-closing elements:
```html
<img src="image.jpg" alt="Description" />
<hr />
```

### Dynamic Content with Timber

Use dynamic tags for templating with Twig syntax:

#### Set Variables
```html
<set variable="featured_image" value="post.thumbnail.src" />
```

#### Conditional Rendering
```html
<if source="user.ID > 0">
  <p>Welcome back, {{ user.display_name }}!</p>
</if>
```

#### Loops
```html
<loop source="item in posts">
  <h2>{{ item.title }}</h2>
  <p>{{ item.excerpt }}</p>
</loop>
```

See [docs/block-context.md](docs/block-context.md) for detailed dynamic content documentation.

### Image Management

When tag is `<img>`, the Image Settings Panel appears:
- Visual media library picker
- Automatic alt text, width, and height
- Preview with replace/remove options

### Link Management

When tag is `<a>`, the Link Settings Panel appears:
- **Internal Links**: Select from posts/pages by post type
- **External Links**: Manual URL entry
- **Target Control**: Open in new tab with automatic `rel="noopener noreferrer"`
- **ARIA Labels**: Accessibility improvements

## HTML ↔ Block Conversion

### HTML to Blocks (Import)
1. Click **Import HTML** button in sidebar
2. Paste or write HTML in Ace Editor
3. Click **Import** - HTML is parsed into nested blocks

### Blocks to HTML (Export)
1. Select a block with nested content
2. Click **To HTML** button
3. Block tree converts to clean HTML string

Both conversions preserve:
- Exact DOM structure
- All attributes (including custom data-* and aria-*)
- Dynamic tags (loop, if, set)

See [docs/parsers/](docs/parsers/) for technical details.

## Preview Context System

Test dynamic Timber/Twig templates with real data:

1. Click **Preview Settings** (eye icon) in sidebar
2. **Auto-detect**: Automatically uses current editing context
3. **Manual Config**: Select post type, specific post, taxonomy, or WooCommerce page
4. Previews render with real Timber context (post, user, custom fields)

See [docs/preview-context.md](docs/preview-context.md) for configuration details.

## Architecture

### Tag-Based System
Blocks are defined by:
- **Tag Name**: HTML element (p, div, h1, img, loop, if, set)
- **Content Type**: How content is handled (text, blocks, html, empty)
- **Category**: Logical grouping (common, layout, text, media, dynamic, custom)

Configuration: [src/config/tags/](src/config/tags/)

### Dual Rendering

**Editor (React)**:
- Main component: [src/components/Edit.js](src/components/Edit.js)
- Tag selection toolbar
- Plain Classes Manager (always visible)
- Context-aware settings panels
- Dynamic preview mode

**Frontend (PHP)**:
- Server-side: [includes/blocks/render-element.php](includes/blocks/render-element.php)
- No wrapper elements
- Sanitization based on content type
- Dynamic tag processing via Timber

### Key Components

**UI Components**:
- [Edit.js](src/components/Edit.js) - Main editor with content type routing
- [PlainClassesManager.js](src/components/PlainClassesManager.js) - Tokenized class management
- [ImageSettingsPanel.js](src/components/ImageSettingsPanel.js) - Image attribute controls
- [LinkSettingsPanel.js](src/components/LinkSettingsPanel.js) - Link management
- [TagNameToolbar.js](src/components/TagNameToolbar.js) - Tag selection UI
- [DynamicTagSettings.js](src/components/DynamicTagSettings.js) - Loop/if/set configuration

**Utilities**:
- [lib/html2blocks.js](lib/html2blocks.js) - HTML → Blocks parser
- [lib/blocks2html.js](lib/blocks2html.js) - Blocks → HTML serializer

**PHP Backend**:
- [includes/blocks/render-element.php](includes/blocks/render-element.php) - Block rendering
- [includes/parser/class-dynamic-tag-parser.php](includes/parser/class-dynamic-tag-parser.php) - Dynamic tag processing
- [includes/api/class-preview-api.php](includes/api/class-preview-api.php) - Preview API
- [includes/editor/class-preview-context.php](includes/editor/class-preview-context.php) - Context detection

## File Structure

```
universal-block/
├── src/                              # React source files
│   ├── components/                   # UI components
│   │   ├── Edit.js                  # Main editor component
│   │   ├── PlainClassesManager.js   # Class management UI
│   │   ├── ImageSettingsPanel.js    # Image controls
│   │   ├── LinkSettingsPanel.js     # Link controls
│   │   ├── TagNameToolbar.js        # Tag selector
│   │   └── DynamicTagSettings.js    # Dynamic tag inputs
│   ├── config/tags/                  # Tag configuration (legacy)
│   ├── transforms/                   # Block transforms (legacy)
│   └── index.js                      # Main entry point
├── includes/                         # PHP backend
│   ├── blocks/                       # Block rendering
│   │   └── render-element.php       # Server-side render
│   ├── parser/                       # Dynamic tag parser
│   │   └── class-dynamic-tag-parser.php
│   ├── api/                          # REST API endpoints
│   │   ├── class-preview-api.php    # Preview endpoint
│   │   └── class-preview-settings-api.php
│   ├── editor/                       # Editor customizations
│   │   ├── class-editor-tweaks.php  # Editor enhancements
│   │   └── class-preview-context.php # Context detection
│   └── admin/                        # Admin functionality
├── assets/                           # Static assets
│   ├── editor/                       # Editor-specific assets
│   │   ├── appender.css             # Block appender styles
│   │   └── appender.js              # Block appender script
│   ├── global/                       # Third-party libraries
│   │   ├── ace/                     # Ace Editor
│   │   ├── emmet/                   # Emmet abbreviations
│   │   └── beautify/                # HTML beautifier
│   └── react-components/             # Standalone React apps
│       └── editor-tweaks/           # Sidebar enhancements
│           ├── HtmlImportDrawer.js  # HTML import UI
│           ├── AttributesEditorPopup.js # Attributes editor
│           └── PreviewSettingsDrawer.js # Preview config
├── lib/                              # Standalone libraries
│   ├── html2blocks.js               # HTML to blocks parser
│   └── blocks2html.js               # Blocks to HTML serializer
├── docs/                             # Documentation
│   ├── parsers/                     # Parser documentation
│   │   ├── README.md                # Parser overview
│   │   ├── html-to-blocks.md        # HTML import details
│   │   └── blocks-to-html.md        # HTML export details
│   ├── block-context.md             # Dynamic content guide
│   ├── preview-context.md           # Preview system docs
│   └── block-appender.md            # Appender customization
├── _legacy/                          # Legacy code (archived)
├── build/                            # Build output (generated)
├── universal-block.php               # Main plugin file
├── block.json                        # Block metadata
├── package.json                      # Node.js dependencies
├── CLAUDE.md                         # AI development guide
└── README.md                         # This file
```

## Documentation

### Core Concepts
- [CLAUDE.md](CLAUDE.md) - Complete development guide and architecture overview
- [block.json](block.json) - Block registration and metadata

### Parsers
- [Parser Overview](docs/parsers/README.md) - System overview and roundtrip consistency
- [HTML to Blocks](docs/parsers/html-to-blocks.md) - Import process and edge cases
- [Blocks to HTML](docs/parsers/blocks-to-html.md) - Export process and formatting

### Dynamic Features
- [Block Context](docs/block-context.md) - Timber/Twig integration guide
- [Preview Context](docs/preview-context.md) - Preview system configuration
- [Block Appender](docs/block-appender.md) - Customizing the block inserter

## REST API Endpoints

- `POST /wp-json/universal-block/v1/preview` - Full page context preview
- `POST /wp-json/universal-block/v1/dynamic-preview` - Individual block preview with Timber
- `POST /wp-json/universal-block/v1/preview-settings` - Save preview configuration

## Timber Context

Available in dynamic tags:
- `post` - Current post object with meta, thumbnail, etc.
- `user` - Current user with ID, display_name, etc.
- `page_data` - Custom page data via filters
- Test variables for preview mode

Use in dynamic tags:
```html
<h1>{{ post.title }}</h1>
<img src="{{ post.thumbnail.src }}" alt="{{ post.thumbnail.alt }}" />
<p>By {{ post.author.display_name }}</p>
```

## Attribute Storage

- **globalAttrs**: All HTML attributes EXCEPT class (id, style, data-*, aria-*, href, src, etc.)
- **className**: WordPress-managed classes (official way, managed by PlainClassesManager)
- **content**: Text/HTML content (not used for blocks contentType)
- **tagName**: Current HTML element
- **contentType**: Content handling mode (blocks, text, html, empty)
- **blockContext**: Optional Timber context name for custom data
- **isDynamic**: Flag for dynamic preview mode

## Security & Sanitization

All output is sanitized on the server:
- `wp_kses_post()` for HTML content (with SVG support)
- `esc_attr()` for attributes
- `esc_url()` for href and src
- No user input rendered without sanitization

## Browser Support

- Modern browsers (Chrome, Firefox, Safari, Edge)
- WordPress 6.0+ with Gutenberg block editor
- No IE11 support

## Contributing

Contributions welcome! The codebase is designed to be modular:

- React components are isolated in `src/components/`
- PHP classes follow WordPress coding standards
- Clear separation between editor and frontend
- Comprehensive inline documentation

### Code Standards
- React functional components with hooks
- WordPress coding standards for PHP
- ESLint configuration via @wordpress/scripts
- Server-side sanitization for all output

## Known Limitations

- Custom element tags (with hyphens) require browser support
- Dynamic tags require Timber plugin
- Preview context detection works in WordPress admin only
- Block IDs are regenerated on each page load (not persistent)

## Roadmap

- [ ] Block variation picker for common patterns
- [ ] CSS Grid/Flexbox visual controls
- [ ] Animation/transition helpers
- [ ] Design system preset management
- [ ] Multi-block selection and bulk operations

## License

GPL-2.0-or-later

## Credits

Built with:
- [WordPress Block Editor](https://developer.wordpress.org/block-editor/)
- [Timber](https://timber.github.io/docs/) (optional, for dynamic features)
- [Ace Editor](https://ace.c9.io/) (HTML editing)
- [Emmet](https://emmet.io/) (HTML abbreviations)
- [Framer Motion](https://www.framer.com/motion/) (UI animations)

---

**Need help?** Check [CLAUDE.md](CLAUDE.md) for complete development documentation or open an issue on GitHub.
