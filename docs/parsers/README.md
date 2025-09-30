# Universal Block Parsers

## Overview

The Universal Block plugin includes a bidirectional parsing system that converts between HTML markup and WordPress Gutenberg block structures with 100% structural consistency.

## Core Philosophy

**Perfect Roundtrip Consistency:** The parsers guarantee that converting HTML → Blocks → HTML produces structurally identical output, preserving exact DOM hierarchy, attributes, and content.

## Parser Files

### HTML to Blocks Parser
**File:** `src/utils/htmlToBlocks.js`

Converts HTML markup into Gutenberg block structures.

```javascript
import { parseHTMLToBlocks } from './utils/htmlToBlocks';

const html = '<div><p>Hello</p></div>';
const blocks = parseHTMLToBlocks(html);
```

[Full Documentation →](./html-to-blocks.md)

### Blocks to HTML Parser
**File:** `src/utils/blocksToHtml.js`

Converts Gutenberg block structures back into HTML markup.

```javascript
import { parseBlocksToHTML } from './utils/blocksToHtml';

const blocks = [/* block objects */];
const html = parseBlocksToHTML(blocks);
```

[Full Documentation →](./blocks-to-html.md)

## Roundtrip Consistency

The parsers work together to ensure perfect bidirectional conversion:

```javascript
// Original HTML
const originalHTML = `
<div class="grid">
    <set var="name" value="John" />
    <set var="age" value="30" />
    <div class="card">
        <h1>{{ name }}</h1>
        <p>Age: {{ age }}</p>
    </div>
</div>
`;

// Convert to blocks
const blocks = parseHTMLToBlocks(originalHTML);

// Convert back to HTML
const outputHTML = parseBlocksToHTML(blocks);

// Result: Structurally identical
// originalHTML ≈ outputHTML (whitespace may differ)
```

## Key Guarantees

### 1. Structure Preservation

**HTML Input:**
```html
<div class="parent">
    <p>Child 1</p>
    <p>Child 2</p>
</div>
```

**Guaranteed Output:**
- Parent div remains parent
- 2 paragraph children remain children
- Order preserved
- Nesting depth preserved

### 2. Attribute Preservation

**HTML Input:**
```html
<img src="photo.jpg" alt="Photo" class="image" data-id="123" />
```

**Guaranteed Output:**
- All attributes preserved
- Values remain unchanged
- No attribute loss
- Proper escaping applied

### 3. Content Preservation

**HTML Input:**
```html
<p>Text with {{ variable }} and <strong>formatting</strong></p>
```

**Guaranteed Output:**
- Text content preserved exactly
- Template variables preserved
- HTML formatting preserved
- No content transformation

### 4. Custom Element Handling

**HTML Input:**
```html
<div>
    <set var="x" value="1" />
    <loop items="{{ posts }}">
        <p>{{ item.title }}</p>
    </loop>
</div>
```

**Guaranteed Output:**
- Custom tags maintain position
- Self-closing syntax preserved
- Attributes preserved
- Nesting relationships maintained

## Content Type System

Both parsers use a unified content type system to handle different element structures:

| Content Type | Description | Example | Block Structure |
|-------------|-------------|---------|-----------------|
| `empty` | No content, self-closing | `<set var="x" />`, `<img />` | No content/innerBlocks |
| `text` | Text-only content | `<p>Hello</p>` | `content` attribute |
| `blocks` | Nested elements | `<div><p>A</p></div>` | `innerBlocks` array |
| `html` | Mixed content | `<div>Text <b>bold</b></div>` | `content` attribute (HTML) |

### Content Type Detection (HTML → Blocks)

```javascript
// Priority order for detection:
1. Tag config (selfClosing: true) → 'empty'
2. Void elements (img, br, hr, etc.) → 'empty'
3. Has only text content → 'text'
4. Has child elements → 'blocks'
5. Fallback → 'html'
```

### Content Type Handling (Blocks → HTML)

```javascript
switch (contentType) {
    case 'empty':  return `<${tag} />`;
    case 'text':   return `<${tag}>${content}</${tag}>`;
    case 'blocks': return `<${tag}>${convertInnerBlocks()}</${tag}>`;
    case 'html':   return `<${tag}>${content}</${tag}>`;
}
```

## Critical Implementation Details

### 1. Self-Closing Tag Preprocessing

**Problem:** DOMParser doesn't recognize custom self-closing tags like `<set />`

**Solution:** Preprocess HTML to convert `<set />` → `<set></set>` before parsing

```javascript
// In htmlToBlocks.js
const processedHtml = html.replace(/<(\w+)([^>]*?)\/>/g, (match, tagName, attrs) => {
    const config = getTagConfig(tagName.toLowerCase());
    if (config?.selfClosing === true) {
        return `<${tagName}${attrs}></${tagName}>`;
    }
    return match;
});
```

### 2. Attribute Conversion

**HTML → Blocks:**
```javascript
// HTML uses 'class'
<div class="container">

// Block uses 'className'
attributes: {
    className: 'container'
}
```

**Blocks → HTML:**
```javascript
// Block uses 'className'
attributes: {
    className: 'container'
}

// HTML uses 'class'
<div class="container">
```

### 3. Void Elements Synchronization

**CRITICAL:** Both parsers must use identical void element lists:

```javascript
// Must be synchronized across both files
const voidElements = [
    'img', 'br', 'hr', 'input', 'meta', 'link',
    'area', 'base', 'col', 'embed', 'source', 'track', 'wbr'
];
```

### 4. Tag Configuration Integration

Both parsers integrate with `src/config/tags.js` for custom element behavior:

```javascript
// Tag configuration
{
    set: {
        selfClosing: true,
        contentType: 'empty'
    },
    loop: {
        selfClosing: false,
        contentType: 'blocks'
    }
}
```

**Impact:**
- Overrides default content type detection
- Ensures custom elements behave consistently
- Single source of truth for element behavior

## Usage Examples

### Example 1: Import HTML

```javascript
import { parseHTMLToBlocks } from './utils/htmlToBlocks';

// User pastes HTML in sidebar
const userHTML = `
<div class="grid">
    <div class="card">
        <h1>Title</h1>
        <p>Content</p>
    </div>
</div>
`;

// Convert to blocks
const blocks = parseHTMLToBlocks(userHTML);

// Insert into editor
wp.data.dispatch('core/block-editor').insertBlocks(blocks);
```

### Example 2: Export HTML

```javascript
import { parseBlocksToHTML } from './utils/blocksToHtml';

// Get current block
const block = wp.data.select('core/block-editor').getSelectedBlock();

// Convert to HTML
const html = parseBlocksToHTML([block]);

// Copy to clipboard
navigator.clipboard.writeText(html);
```

### Example 3: Roundtrip Conversion

```javascript
import { parseHTMLToBlocks } from './utils/htmlToBlocks';
import { parseBlocksToHTML } from './utils/blocksToHtml';

// Original HTML
const html = '<div class="test"><p>Hello</p></div>';

// Convert to blocks
const blocks = parseHTMLToBlocks(html);

// Modify blocks (e.g., add a class)
blocks[0].attributes.className += ' modified';

// Convert back to HTML
const modifiedHTML = parseBlocksToHTML(blocks);
// Result: <div class="test modified"><p>Hello</p></div>
```

## Testing Roundtrip Consistency

### Test Function

```javascript
function testRoundtrip(html) {
    // Parse to blocks
    const blocks = parseHTMLToBlocks(html);

    // Convert back to HTML
    const output = parseBlocksToHTML(blocks);

    // Normalize for comparison (remove extra whitespace)
    const normalize = (str) => str.replace(/\s+/g, ' ').trim();

    return normalize(html) === normalize(output);
}
```

### Test Cases

```javascript
// Simple elements
testRoundtrip('<p>Hello</p>');
testRoundtrip('<div class="test"><p>Content</p></div>');

// Self-closing elements
testRoundtrip('<img src="photo.jpg" />');
testRoundtrip('<br />');

// Custom dynamic tags
testRoundtrip('<set var="x" value="1" />');
testRoundtrip('<loop items="{{ posts }}"><p>{{ item }}</p></loop>');

// Complex structures
testRoundtrip(`
<div class="grid grid-cols-3">
    <set var="name" value="John" />
    <set var="age" value="30" />
    <div class="card">
        <img src="photo.jpg" />
        <h1>{{ name }}</h1>
        <p>Age: {{ age }}</p>
    </div>
</div>
`);
```

## Integration Points

### Editor Sidebar

**File:** `assets/react-components/editor-tweaks/src/components/UniversalEditorTweaks.js`

**Features:**
- **Import HTML:** Convert HTML → Blocks → Insert into editor
- **Copy as Blocks:** Convert HTML → Blocks → Copy markup

### Block Toolbar

**File:** `src/components/Edit.js`

**Features:**
- **Copy HTML:** Convert Block → HTML → Copy to clipboard

### Global API

**File:** `assets/editor/editor-tweaks.js`

**Exposed Functions:**
```javascript
window.UniversalBlockParsers = {
    parseHTMLToBlocks,  // HTML → Blocks
    parseBlocksToHTML   // Blocks → HTML
};
```

## Maintenance Guidelines

### When Adding New Element Types

1. **Update tag configuration** in `src/config/tags.js`
2. **Test roundtrip conversion** with new elements
3. **Document behavior** in parser docs
4. **Add to void elements list** if applicable (must update both parsers)

### When Modifying Parsers

1. **Maintain symmetry:** Changes to one parser require corresponding changes to the other
2. **Update both void element lists** if adding/removing void elements
3. **Test roundtrip consistency** after any changes
4. **Update documentation** to reflect new behavior

### Critical Synchronization Points

These elements MUST remain synchronized across both parsers:

1. **Void Elements List:**
   - `htmlToBlocks.js` line 102
   - `blocksToHtml.js` line 111

2. **Content Type Detection:**
   - Detection logic in `htmlToBlocks.js`
   - Handling logic in `blocksToHtml.js`

3. **Tag Configuration Usage:**
   - Both parsers must respect same config properties
   - Priority order must match

4. **Attribute Handling:**
   - `class` ↔ `className` conversion
   - `globalAttrs` storage and retrieval

## Performance Characteristics

### HTML to Blocks
- **Time Complexity:** O(n) where n = number of DOM nodes
- **Space Complexity:** O(n) for block tree
- **Bottlenecks:** DOMParser initialization, recursive traversal

### Blocks to HTML
- **Time Complexity:** O(n) where n = number of blocks
- **Space Complexity:** O(n) for HTML string
- **Bottlenecks:** String concatenation, recursive calls

### Optimization Notes
- Parsers use native browser APIs (DOMParser)
- Recursive processing matches DOM structure
- No unnecessary copying or intermediate structures
- Suitable for documents with hundreds of blocks

## See Also

- [HTML to Blocks Parser](./html-to-blocks.md) - Detailed forward conversion docs
- [Blocks to HTML Parser](./blocks-to-html.md) - Detailed reverse conversion docs
- [Tag Configuration](../config/tags.md) - Custom element configuration
- [Content Type System](../architecture/content-types.md) - Content type details