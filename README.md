# Universal Block (Designless Polymorphic Block)

A designless polymorphic WordPress Gutenberg block that can be any HTML element with full attribute control.

## Features

- **Polymorphic**: Can be text, heading, link, image, rule, or container
- **Designless**: No styles injected; your theme handles the appearance
- **Full Control**: Set any global HTML attributes (id, class, style, aria-*, data-*, etc.)
- **Transform Support**: Convert to/from core WordPress blocks
- **HTML Pasting**: Paste raw HTML and it will be parsed into the block
- **Server Rendered**: Dynamic rendering with no wrapper elements

## Install

1. Copy the `universal-block` folder into `wp-content/plugins/`
2. `cd universal-block && npm install && npm run build`
3. Activate **Universal Block** in WP Admin → Plugins

## Development

```bash
# Install dependencies
npm install

# Start development (watch mode)
npm run start

# Build for production
npm run build

# Lint JavaScript
npm run lint:js

# Format JavaScript
npm run format:js

# Run tests
npm run test
```

## Use

- Insert **Universal Element** block in the block editor
- Pick **Element Type** (Text, Heading, Link, Image, Rule, Container)
- Adjust **HTML Tag** and set only the attributes you need
- Add global attributes like `id`, `class`, `style`, `role`, `aria-*`, `data-*`
- No styles are injected; your theme handles the look

### Element Types

- **Text**: `<p>`, `<span>`, `<div>` with text content
- **Heading**: `<h1>` through `<h6>` with text content
- **Link**: `<a>` with href, target, rel attributes
- **Image**: `<img>` with src, alt, width, height attributes
- **Rule**: `<hr>` (horizontal rule)
- **Container**: `<div>`, `<section>`, `<article>`, etc. with InnerBlocks support

## HTML Pasting

Paste raw HTML directly into the editor. The block will attempt to map HTML tags and attributes into its block attributes via the `raw` transform.

## Transforms

### From Core Blocks
- Paragraph → Universal Element (text)
- Heading → Universal Element (heading)
- Separator → Universal Element (rule)
- Button → Universal Element (link)
- Image → Universal Element (image)

### To Core Blocks
- Universal Element → Paragraph (when text type)
- Universal Element → Heading (when heading type)
- Universal Element → Separator (when rule type)
- Universal Element → Button (when link type with href)
- Universal Element → Image (when image type with src)

## File Structure

```
universal-block/
├── src/                          # Source files
│   ├── components/               # React components
│   │   ├── Edit.js              # Main edit component
│   │   ├── ElementTypeControls.js # Element type controls
│   │   └── AttributesPanel.js   # Global attributes panel
│   ├── transforms/               # Block transforms
│   │   └── index.js             # Transform definitions
│   ├── index.js                 # Main entry point
│   └── style.scss               # Empty styles file
├── includes/                     # PHP files
│   ├── blocks/                  # Block-related PHP
│   │   ├── render-element.php   # Server-side rendering
│   │   └── class-universal-element.php # Block class
│   └── admin/                   # Admin functionality
│       └── class-admin.php      # Admin class
├── assets/                       # Static assets
│   ├── css/                     # CSS files
│   ├── js/                      # JavaScript files
│   └── images/                  # Image files
├── tests/                        # Test files
│   ├── unit/                    # Unit tests
│   └── integration/             # Integration tests
├── build/                        # Build output (generated)
├── docs/                         # Documentation
├── universal-block.php          # Main plugin file
├── block.json                   # Block metadata
├── package.json                 # Node.js dependencies
└── README.md                    # This file
```

## Notes

- **Dynamic Rendering**: The block is server-rendered, so no wrapper elements are added
- **Container Support**: Container type supports nested content via InnerBlocks
- **Accessibility**: Set appropriate `alt` text for images, meaningful link text, and logical heading hierarchy
- **Security**: All attributes are sanitized on the server side

## Contributing

The project structure is designed to be modular and contributor-friendly:

- Components are separated into individual files in `src/components/`
- Transforms are isolated in `src/transforms/`
- PHP classes follow WordPress standards
- Clear separation between client-side and server-side code

## License

GPL-2.0-or-later