# Blocks to HTML Parser

**File:** `src/utils/blocksToHtml.js`

## Overview

The Blocks to HTML parser converts WordPress Gutenberg block structures back into HTML markup. This parser is designed to maintain 100% roundtrip consistency with the HTML to Blocks parser, ensuring that HTML → Blocks → HTML produces identical output.

## Core Principle

**Roundtrip Consistency:** The parser must reverse the exact transformations performed by `htmlToBlocks.js`, preserving structure, attributes, and content with perfect fidelity.

## Main Function

### `parseBlocksToHTML(blocks)`

**Purpose:** Convert array of Universal Blocks to HTML string

**Parameters:**
- `blocks` (Array): Array of block objects

**Returns:** HTML string

**Process:**

```javascript
export function parseBlocksToHTML(blocks) {
    if (!blocks || !Array.isArray(blocks)) {
        return '';
    }

    return blocks.map(block => blockToHTML(block)).join('\n');
}
```

1. **Input Validation:** Check blocks is valid array
2. **Map Conversion:** Convert each block to HTML string
3. **Join Output:** Combine with newlines for readability

## Block Conversion Function

### `blockToHTML(block)`

**Purpose:** Convert a single block object to HTML string

**Parameters:**
- `block` (Object): Block object from Gutenberg

**Returns:** HTML string

**Process:**

### 1. Block Validation

```javascript
if (!block || block.name !== 'universal/element') {
    return '';
}
```

- Only processes `universal/element` blocks
- Returns empty string for invalid blocks

### 2. Extract Block Data

```javascript
const { attributes, innerBlocks } = block;
const {
    tagName = 'div',
    contentType = 'text',
    content = '',
    selfClosing = false,
    globalAttrs = {},
    className = ''
} = attributes;
```

- **tagName:** HTML element name
- **contentType:** Content handling strategy (`empty`, `text`, `blocks`, `html`)
- **content:** Text or HTML content
- **selfClosing:** Element requires self-closing syntax
- **globalAttrs:** All HTML attributes (src, href, data-*, etc.)
- **className:** CSS classes

### 3. Build Attributes String

#### Step A: Add className

```javascript
let attributesString = '';

if (className) {
    attributesString += ` class="${escapeAttribute(className)}"`;
}
```

- **WordPress blocks use `className`**
- **HTML uses `class` attribute**
- Conversion ensures proper output

#### Step B: Add Global Attributes

```javascript
Object.entries(globalAttrs).forEach(([name, value]) => {
    if (name && value !== undefined && value !== '') {
        attributesString += ` ${escapeAttributeName(name)}="${escapeAttribute(value)}"`;
    }
});
```

- Iterate through all attributes
- Skip empty or undefined values
- Escape attribute names and values for safety

### 4. Generate Inner Content

Content generation mirrors the content type detection from `htmlToBlocks.js`:

```javascript
let innerContent = '';

switch (contentType) {
    case 'text':
    case 'html':
        innerContent = content || '';
        break;

    case 'blocks':
        if (innerBlocks && innerBlocks.length > 0) {
            innerContent = parseBlocksToHTML(innerBlocks);
        }
        break;

    case 'empty':
    default:
        innerContent = '';
        break;
}
```

**Content Type Handling:**

| Content Type | Source | Output |
|-------------|--------|--------|
| `text` | `content` attribute | Plain text |
| `html` | `content` attribute | Raw HTML |
| `blocks` | `innerBlocks` array | Recursively converted HTML |
| `empty` | None | Empty string |

### 5. Determine Self-Closing Behavior

```javascript
const config = getTagConfig(tagName);
const shouldBeSelfClosing = config?.selfClosing !== undefined
    ? config.selfClosing
    : (selfClosing || isVoidElement(tagName));
```

**Priority Order:**
1. **Tag config:** Check custom element config first
2. **Block attribute:** Use block's `selfClosing` value
3. **Void element check:** Fall back to standard HTML rules

**Why this order matters:**
- Custom dynamic tags (`<set>`, `<loop>`) need config-driven behavior
- Block attributes preserve parser decisions
- Standard void elements (`<img>`, `<br>`) always self-close

### 6. Generate HTML Output

```javascript
if (shouldBeSelfClosing) {
    return `<${tagName}${attributesString} />`;
} else {
    return `<${tagName}${attributesString}>${innerContent}</${tagName}>`;
}
```

**Self-Closing Output:**
```html
<img src="image.jpg" class="photo" />
<set var="name" value="John" />
```

**Regular Output:**
```html
<div class="container">
    <p>Content</p>
</div>
```

## Helper Functions

### `isVoidElement(tagName)`

**Purpose:** Check if tag is a standard HTML void element

```javascript
function isVoidElement(tagName) {
    const voidElements = [
        'img', 'br', 'hr', 'input', 'meta', 'link', 'area', 'base',
        'col', 'embed', 'source', 'track', 'wbr'
    ];
    return voidElements.includes(tagName.toLowerCase());
}
```

**CRITICAL:** This list MUST match the `voidElements` array in `htmlToBlocks.js` exactly to ensure roundtrip consistency.

### `escapeAttribute(value)`

**Purpose:** Escape HTML attribute values

```javascript
function escapeAttribute(value) {
    if (typeof value !== 'string') {
        value = String(value);
    }
    return value
        .replace(/&/g, '&amp;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#x27;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
}
```

**Escaped Characters:**
- `&` → `&amp;`
- `"` → `&quot;`
- `'` → `&#x27;`
- `<` → `&lt;`
- `>` → `&gt;`

### `escapeAttributeName(name)`

**Purpose:** Sanitize attribute names

```javascript
function escapeAttributeName(name) {
    return name.replace(/[^a-zA-Z0-9\-_]/g, '');
}
```

**Allowed Characters:**
- Letters: `a-zA-Z`
- Numbers: `0-9`
- Hyphens: `-`
- Underscores: `_`

## Roundtrip Consistency Examples

### Example 1: Simple Text Element

**Block Input:**
```javascript
{
    name: 'universal/element',
    attributes: {
        tagName: 'p',
        contentType: 'text',
        content: 'Hello World',
        selfClosing: false,
        globalAttrs: {}
    },
    innerBlocks: []
}
```

**HTML Output:**
```html
<p>Hello World</p>
```

**Roundtrip Test:**
```
HTML → Blocks → HTML
<p>Hello World</p> → [block] → <p>Hello World</p> ✓
```

### Example 2: Nested Structure

**Block Input:**
```javascript
{
    name: 'universal/element',
    attributes: {
        tagName: 'div',
        className: 'container',
        contentType: 'blocks',
        selfClosing: false,
        globalAttrs: {}
    },
    innerBlocks: [
        {
            name: 'universal/element',
            attributes: {
                tagName: 'h1',
                contentType: 'text',
                content: 'Title',
                selfClosing: false,
                globalAttrs: {}
            },
            innerBlocks: []
        },
        {
            name: 'universal/element',
            attributes: {
                tagName: 'p',
                contentType: 'text',
                content: 'Content',
                selfClosing: false,
                globalAttrs: {}
            },
            innerBlocks: []
        }
    ]
}
```

**HTML Output:**
```html
<div class="container">
<h1>Title</h1>
<p>Content</p>
</div>
```

**Roundtrip Test:**
```
HTML → Blocks → HTML
<div class="container">
    <h1>Title</h1>
    <p>Content</p>
</div>
→ [blocks] →
<div class="container">
<h1>Title</h1>
<p>Content</p>
</div> ✓
```

### Example 3: Custom Dynamic Tags with Structure Preservation

**Block Input:**
```javascript
{
    name: 'universal/element',
    attributes: {
        tagName: 'div',
        className: 'grid',
        contentType: 'blocks',
        selfClosing: false,
        globalAttrs: {}
    },
    innerBlocks: [
        {
            name: 'universal/element',
            attributes: {
                tagName: 'set',
                contentType: 'empty',
                selfClosing: true,
                globalAttrs: {
                    var: 'name',
                    value: 'John'
                }
            },
            innerBlocks: []
        },
        {
            name: 'universal/element',
            attributes: {
                tagName: 'set',
                contentType: 'empty',
                selfClosing: true,
                globalAttrs: {
                    var: 'age',
                    value: '30'
                }
            },
            innerBlocks: []
        },
        {
            name: 'universal/element',
            attributes: {
                tagName: 'p',
                contentType: 'text',
                content: '{{ name }} is {{ age }}',
                selfClosing: false,
                globalAttrs: {}
            },
            innerBlocks: []
        }
    ]
}
```

**HTML Output:**
```html
<div class="grid">
<set var="name" value="John" />
<set var="age" value="30" />
<p>{{ name }} is {{ age }}</p>
</div>
```

**Roundtrip Test:**
```
HTML → Blocks → HTML
<div class="grid">
    <set var="name" value="John" />
    <set var="age" value="30" />
    <p>{{ name }} is {{ age }}</p>
</div>
→ [blocks] →
<div class="grid">
<set var="name" value="John" />
<set var="age" value="30" />
<p>{{ name }} is {{ age }}</p>
</div> ✓
```

**Key Points:**
- `<set>` tags remain in their original positions as innerBlocks
- Custom tags maintain self-closing syntax
- Attributes preserved exactly
- Structure preserved exactly

### Example 4: Self-Closing Elements

**Block Input:**
```javascript
{
    name: 'universal/element',
    attributes: {
        tagName: 'img',
        contentType: 'empty',
        selfClosing: true,
        className: 'photo',
        globalAttrs: {
            src: '/image.jpg',
            alt: 'Photo'
        }
    },
    innerBlocks: []
}
```

**HTML Output:**
```html
<img class="photo" src="/image.jpg" alt="Photo" />
```

**Roundtrip Test:**
```
HTML → Blocks → HTML
<img class="photo" src="/image.jpg" alt="Photo" />
→ [block] →
<img class="photo" src="/image.jpg" alt="Photo" /> ✓
```

## Content Type Handling

The parser handles each content type to mirror the detection logic from `htmlToBlocks.js`:

### Empty Content (`contentType: 'empty'`)

**Detected by htmlToBlocks when:**
- Tag config has `selfClosing: true`
- Element is a void element (`<img>`, `<br>`, etc.)

**Output by blocksToHtml:**
```html
<tagName attributes />
```

**Examples:**
- `<set var="x" value="1" />`
- `<img src="photo.jpg" />`
- `<br />`

### Text Content (`contentType: 'text'`)

**Detected by htmlToBlocks when:**
- Element contains only text (no child elements)
- Uses `hasOnlyTextContent()` check

**Output by blocksToHtml:**
```html
<tagName attributes>text content</tagName>
```

**Examples:**
- `<p>Hello World</p>`
- `<h1>Title</h1>`
- `<a href="#">Link</a>`

### Block Content (`contentType: 'blocks'`)

**Detected by htmlToBlocks when:**
- Element has child elements
- Uses `hasChildElements()` check

**Output by blocksToHtml:**
```html
<tagName attributes>
recursively converted innerBlocks
</tagName>
```

**Examples:**
```html
<div>
<p>Paragraph 1</p>
<p>Paragraph 2</p>
</div>
```

### HTML Content (`contentType: 'html'`)

**Detected by htmlToBlocks when:**
- Mixed content (text + elements)
- Complex structures
- Fallback for edge cases

**Output by blocksToHtml:**
```html
<tagName attributes>raw html content</tagName>
```

**Examples:**
```html
<div>Text <strong>bold</strong> more text</div>
```

## Consistency Guarantees

The parser guarantees:

1. **Attribute Consistency:**
   - `className` → `class` conversion
   - All `globalAttrs` preserved
   - Attribute order may vary (doesn't affect validity)

2. **Structure Consistency:**
   - Parent-child relationships maintained
   - Element order preserved
   - Nesting depth preserved

3. **Content Consistency:**
   - Text content preserved exactly
   - HTML content preserved exactly
   - No content loss or modification

4. **Self-Closing Consistency:**
   - Custom elements use config
   - Void elements always self-close
   - Regular elements never self-close

5. **Roundtrip Guarantee:**
   - HTML → Blocks → HTML produces structurally identical output
   - Whitespace formatting may differ
   - Semantic meaning preserved exactly

## Critical Implementation Details

### 1. Tag Config Priority

```javascript
const config = getTagConfig(tagName);
const shouldBeSelfClosing = config?.selfClosing !== undefined
    ? config.selfClosing
    : (selfClosing || isVoidElement(tagName));
```

**Why config comes first:**
- Custom elements may override standard behavior
- `<set>`, `<loop>`, `<if>` need consistent handling
- Config provides single source of truth

### 2. Void Elements List Synchronization

**MUST match htmlToBlocks.js:**
```javascript
// htmlToBlocks.js
const voidElements = ['img', 'br', 'hr', 'input', 'meta', 'link', 'area', 'base', 'col', 'embed', 'source', 'track', 'wbr'];

// blocksToHtml.js
const voidElements = ['img', 'br', 'hr', 'input', 'meta', 'link', 'area', 'base', 'col', 'embed', 'source', 'track', 'wbr'];
```

**If lists differ:**
- Roundtrip consistency breaks
- Elements may gain/lose closing tags
- Structural changes occur

### 3. Recursive Processing

```javascript
case 'blocks':
    if (innerBlocks && innerBlocks.length > 0) {
        innerContent = parseBlocksToHTML(innerBlocks);
    }
    break;
```

**How recursion works:**
- Parent calls `parseBlocksToHTML()` on innerBlocks
- Each child processes its own innerBlocks
- Recursion depth follows block structure
- No artificial depth limits

### 4. Attribute Escaping

**Why it's critical:**
- Prevents XSS vulnerabilities
- Ensures valid HTML output
- Preserves special characters

**Example:**
```javascript
// Input
globalAttrs: { 'data-info': 'Name: "John" & age: 25' }

// Output
<div data-info="Name: &quot;John&quot; &amp; age: 25"></div>
```

### 5. Empty Attribute Filtering

```javascript
if (name && value !== undefined && value !== '') {
    attributesString += ` ${name}="${value}"`;
}
```

**Filtered out:**
- `undefined` values
- Empty strings
- Null values (via undefined check)

**Why:**
- Cleaner HTML output
- Avoid invalid attributes like `<div src="">`
- Matches browser behavior

## Tag Configuration Integration

The parser integrates with `src/config/tags.js`:

```javascript
const config = getTagConfig(tagName);
```

**Config Properties Used:**
- `selfClosing` (boolean): Controls output syntax

**Example Config:**
```javascript
{
    set: {
        selfClosing: true,
        contentType: 'empty'
    }
}
```

**Impact on Output:**
```html
<!-- With config -->
<set var="x" value="1" />

<!-- Without config (would be wrong) -->
<set var="x" value="1"></set>
```

## Usage

### Direct Usage

```javascript
import { parseBlocksToHTML } from './utils/blocksToHtml';

const blocks = [
    {
        name: 'universal/element',
        attributes: {
            tagName: 'p',
            contentType: 'text',
            content: 'Hello'
        },
        innerBlocks: []
    }
];

const html = parseBlocksToHTML(blocks);
console.log(html); // <p>Hello</p>
```

### Toolbar Integration

**File:** `src/components/Edit.js`

```javascript
const copyHTML = () => {
    const htmlOutput = parseBlocksToHTML([rawBlockData]);
    navigator.clipboard.writeText(htmlOutput);
};
```

**User Action:** Click "Copy HTML" in toolbar dropdown

## Integration Points

### Editor Integration
- **File:** `src/components/Edit.js`
- **Function:** `copyHTML()`
- **Feature:** Copy block markup as HTML

### Block Serialization
- **Used for:** Exporting blocks to HTML
- **Used by:** Copy/paste operations
- **Used in:** Frontend rendering preparation

## Testing Roundtrip Consistency

### Test Structure

```javascript
const testRoundtrip = (html) => {
    // HTML → Blocks
    const blocks = parseHTMLToBlocks(html);

    // Blocks → HTML
    const output = parseBlocksToHTML(blocks);

    // Compare (structure, not whitespace)
    return normalizeHTML(html) === normalizeHTML(output);
};
```

### Test Cases

**Simple Elements:**
```javascript
testRoundtrip('<p>Hello</p>');
testRoundtrip('<img src="photo.jpg" />');
testRoundtrip('<div class="container"><p>Text</p></div>');
```

**Custom Elements:**
```javascript
testRoundtrip('<set var="x" value="1" />');
testRoundtrip('<loop items="{{ posts }}"><p>{{ item }}</p></loop>');
```

**Complex Structures:**
```javascript
testRoundtrip(`
<div class="grid">
    <set var="name" value="John" />
    <div class="card">
        <h1>{{ name }}</h1>
        <p>Content</p>
    </div>
</div>
`);
```

## See Also

- [HTML to Blocks Parser](./html-to-blocks.md) - Forward conversion
- [Tag Configuration](../config/tags.md) - Custom element configuration
- [Content Type System](../architecture/content-types.md) - Content type details