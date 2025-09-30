# HTML to Blocks Parser

**File:** `src/utils/htmlToBlocks.js`

## Overview

The HTML to Blocks parser converts HTML markup into WordPress Gutenberg block structures. This parser is designed to maintain 100% structural consistency with the original HTML, preserving exact DOM hierarchy and element relationships.

## Core Principle

**Structure Preservation:** The parser maintains the EXACT structure of the input HTML. Elements are converted to blocks in their original positions with their original parent-child relationships intact.

## Main Function

### `parseHTMLToBlocks(html)`

**Purpose:** Convert HTML string to array of Universal Block objects

**Parameters:**
- `html` (string): HTML markup to parse

**Returns:** Array of block objects

**Process:**

1. **Input Validation**
   ```javascript
   if (!html || typeof html !== 'string') {
       return [];
   }
   ```

2. **Self-Closing Tag Preprocessing**
   - **Problem:** DOMParser treats `<set />` as an opening tag, causing subsequent elements to nest inside it
   - **Solution:** Convert self-closing custom tags to proper empty tags: `<set />` → `<set></set>`
   ```javascript
   const processedHtml = html.replace(/<(\w+)([^>]*?)\/>/g, (match, tagName, attrs) => {
       const config = getTagConfig(tagName.toLowerCase());
       if (config?.selfClosing === true) {
           return `<${tagName}${attrs}></${tagName}>`;
       }
       return match; // Keep void HTML elements as self-closing
   });
   ```

3. **DOM Parsing**
   ```javascript
   const parser = new DOMParser();
   const doc = parser.parseFromString(`<div>${processedHtml}</div>`, 'text/html');
   const container = doc.body.firstChild;
   ```
   - Wraps HTML in temporary `<div>` container
   - Parses as HTML document
   - Extracts container to access child nodes

4. **Node Conversion**
   ```javascript
   const blocks = [];
   if (container) {
       for (const node of container.childNodes) {
           const block = nodeToBlock(node);
           if (block) {
               blocks.push(block);
           }
       }
   }
   ```
   - Iterates through all child nodes
   - Converts each node to a block
   - Null blocks (empty text nodes) are filtered out

## Node Conversion Function

### `nodeToBlock(node)`

**Purpose:** Convert a single DOM node to a Universal Block

**Parameters:**
- `node` (Node): DOM node to convert

**Returns:** Block object or null

**Process:**

### 1. Text Node Handling

```javascript
if (node.nodeType === Node.TEXT_NODE) {
    const text = node.textContent.trim();
    if (!text) return null;

    return createBlock('universal/element', {
        tagName: 'p',
        contentType: 'text',
        content: text,
        selfClosing: false
    });
}
```

- **Trim whitespace:** Empty text nodes return `null`
- **Wrap in paragraph:** Standalone text becomes `<p>` block
- **Preserve content:** Original text stored in `content` attribute

### 2. Element Node Handling

#### Step A: Extract Tag Name and Config

```javascript
const tagName = node.tagName.toLowerCase();
const config = getTagConfig(tagName);
```

- Convert to lowercase for consistency
- Load tag configuration (contains `selfClosing`, `contentType` defaults)

#### Step B: Extract Attributes

```javascript
const globalAttrs = {};
let className = '';

for (const attr of node.attributes) {
    if (attr.name === 'class') {
        className = attr.value; // WordPress uses className
    } else {
        globalAttrs[attr.name] = attr.value;
    }
}
```

- **className:** Special handling for WordPress block system
- **globalAttrs:** All other attributes stored as key-value pairs

#### Step C: Determine Content Type

Content type detection follows this priority order:

**Priority 1: Config Self-Closing**
```javascript
if (config?.selfClosing === true) {
    contentType = 'empty';
}
```
- Custom dynamic tags (`<set>`, `<loop>`, `<if>`)
- Explicitly marked as self-closing in config

**Priority 2: Void Elements**
```javascript
else if (isVoidElement) {
    contentType = 'empty';
}
```
- Standard HTML void elements
- List: `img`, `br`, `hr`, `input`, `meta`, `link`, `area`, `base`, `col`, `embed`, `source`, `track`, `wbr`

**Priority 3: Text-Only Content**
```javascript
else if (hasOnlyTextContent(node)) {
    contentType = 'text';
    content = node.textContent;
}
```
- No child elements, only text
- Text extracted via `textContent`

**Priority 4: Block Content (Has Children)**
```javascript
else if (hasChildElements(node)) {
    contentType = 'blocks';
    innerBlocks = [];

    for (const childNode of node.childNodes) {
        const childBlock = nodeToBlock(childNode);
        if (childBlock) {
            innerBlocks.push(childBlock);
        }
    }
}
```
- Contains child elements or non-empty text nodes
- **Recursively processes all children**
- Maintains exact DOM hierarchy

**Priority 5: Fallback to HTML**
```javascript
else {
    contentType = 'html';
    content = node.innerHTML;
}
```
- Mixed or complex content
- Preserves exact HTML structure

#### Step D: Apply Config Overrides

```javascript
const finalContentType = config?.contentType || contentType;
const finalSelfClosing = config?.selfClosing !== undefined
    ? config.selfClosing
    : isVoidElement;
```

- Tag config takes precedence over detected values
- Ensures custom elements behave consistently

#### Step E: Build Block Attributes

```javascript
const blockAttributes = {
    tagName,
    contentType: finalContentType,
    selfClosing: finalSelfClosing,
    globalAttrs,
};

if (className) {
    blockAttributes.className = className;
}

if (finalContentType === 'text' || finalContentType === 'html') {
    blockAttributes.content = content;
}
```

#### Step F: Create Block

```javascript
return createBlock('universal/element', blockAttributes, innerBlocks);
```

- Uses WordPress `createBlock()` function
- Block name: `universal/element`
- Includes attributes and innerBlocks

## Helper Functions

### `hasOnlyTextContent(element)`

**Purpose:** Check if element contains ONLY text (no child elements)

```javascript
function hasOnlyTextContent(element) {
    for (const child of element.childNodes) {
        if (child.nodeType === Node.ELEMENT_NODE) {
            return false;
        }
    }
    return element.textContent.trim().length > 0;
}
```

**Returns:** `true` if element has text but no child elements

### `hasChildElements(element)`

**Purpose:** Check if element has child elements or non-empty text

```javascript
function hasChildElements(element) {
    for (const child of element.childNodes) {
        if (child.nodeType === Node.ELEMENT_NODE) {
            return true;
        }
        if (child.nodeType === Node.TEXT_NODE && child.textContent.trim()) {
            return true;
        }
    }
    return false;
}
```

**Returns:** `true` if element has children (elements or text)

## Content Type System

The parser uses 4 content types to represent different element structures:

| Content Type | Description | Example HTML | Block Structure |
|-------------|-------------|--------------|-----------------|
| `empty` | Self-closing, no content | `<set var="x" />`, `<img src="..." />` | No content, no innerBlocks |
| `text` | Text-only content | `<p>Hello World</p>` | `content` attribute |
| `blocks` | Nested elements | `<div><p>A</p><p>B</p></div>` | `innerBlocks` array |
| `html` | Mixed/complex content | `<div>Text <strong>bold</strong></div>` | `content` attribute (raw HTML) |

## Structure Preservation Examples

### Example 1: Simple Text Element

**Input HTML:**
```html
<p>Hello World</p>
```

**Output Block:**
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

### Example 2: Nested Structure

**Input HTML:**
```html
<div class="container">
    <h1>Title</h1>
    <p>Content</p>
</div>
```

**Output Block:**
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

### Example 3: Custom Dynamic Tags

**Input HTML:**
```html
<div class="grid">
    <set var="name" value="John" />
    <set var="age" value="30" />
    <p>{{ name }} is {{ age }}</p>
</div>
```

**Output Block:**
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

**Key Points:**
- `<set>` tags remain in their original positions
- Custom tags detected via `getTagConfig()`
- Attributes stored in `globalAttrs`
- Structure preserved exactly

## Critical Implementation Details

### 1. Self-Closing Tag Preprocessing

**Why it's needed:**
- DOMParser doesn't recognize custom self-closing tags
- `<set />` is treated as `<set>` (opening tag)
- All subsequent elements nest inside it

**Solution:**
- Preprocess HTML before parsing
- Convert `<set />` to `<set></set>`
- DOMParser correctly interprets as empty element

### 2. Attribute Handling

**className vs class:**
- HTML uses `class` attribute
- WordPress blocks use `className` attribute
- Parser converts `class` → `className`

**globalAttrs:**
- Stores all non-class attributes
- Preserved exactly as in HTML
- Used for custom attributes and data-* attributes

### 3. Recursive Processing

**How it works:**
- `nodeToBlock()` calls itself recursively
- Each child node becomes a block
- Maintains DOM tree structure
- No depth limit (follows DOM structure)

### 4. Null Block Filtering

**Why nodes return null:**
- Empty text nodes (whitespace-only)
- Comment nodes (not processed)
- Invalid nodes

**How it's handled:**
- `nodeToBlock()` returns `null`
- Parent filters out null values
- Only valid blocks added to `innerBlocks`

## Tag Configuration Integration

The parser integrates with `src/config/tags.js` to handle custom elements:

```javascript
const config = getTagConfig(tagName);
```

**Config Properties Used:**
- `selfClosing` (boolean): Element has no content
- `contentType` (string): Override detected content type

**Example Config:**
```javascript
{
    set: {
        selfClosing: true,
        contentType: 'empty'
    }
}
```

## Consistency Guarantees

The parser guarantees:

1. **Structure Preservation:** DOM hierarchy maintained exactly
2. **Position Preservation:** Elements stay in original order
3. **Attribute Preservation:** All attributes preserved
4. **Content Preservation:** Text and HTML content preserved
5. **Roundtrip Consistency:** HTML → Blocks → HTML produces identical output (when paired with `blocksToHtml.js`)

## Usage

```javascript
import { parseHTMLToBlocks } from './utils/htmlToBlocks';

const html = '<div><p>Hello</p></div>';
const blocks = parseHTMLToBlocks(html);

// Insert into Gutenberg editor
wp.data.dispatch('core/block-editor').insertBlocks(blocks);
```

## Integration Points

### Editor Integration
- **File:** `assets/editor/editor-tweaks.js`
- **Exposed as:** `window.UniversalBlockParsers.parseHTMLToBlocks`
- **Used by:** Sidebar "Import HTML" feature

### React Component Integration
- **File:** `assets/react-components/editor-tweaks/src/components/UniversalEditorTweaks.js`
- **Function:** `handleConvertAndInsert()`, `handleCopyAsBlocks()`
- **User Action:** "Convert & Insert" and "Copy as Blocks" buttons

## See Also

- [Blocks to HTML Parser](./blocks-to-html.md) - Reverse conversion
- [Tag Configuration](../config/tags.md) - Custom element configuration
- [Content Type System](../architecture/content-types.md) - Content type details