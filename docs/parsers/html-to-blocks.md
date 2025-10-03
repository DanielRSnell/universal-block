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

#### Step A: Extract Tag Name

```javascript
const tagName = node.tagName.toLowerCase();
```

- Convert to lowercase for consistency
- **Note:** All parsed elements are treated as Custom Elements
- Tag config only checked for dynamic tags (`set`, `loop`, `if`) to detect `selfClosing` flag

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

Content type detection is **universal** and works for ANY element. Detection follows this priority order:

**Priority 1: Dynamic Tags**
```javascript
if (isDynamicTag) {
    contentType = config.contentType || 'empty';
}
```
- Custom dynamic tags (`<set>`, `<loop>`, `<if>`)
- Use their configured content type from tag config

**Priority 2: Void Elements**
```javascript
else if (isVoidElement) {
    contentType = 'empty';
}
```
- Standard HTML void elements
- List: `img`, `br`, `hr`, `input`, `meta`, `link`, `area`, `base`, `col`, `embed`, `source`, `track`, `wbr`

**Priority 3: Universal Detection Based on Children**

For all other elements, content type is detected by analyzing actual children:

```javascript
else {
    const hasElements = hasChildElements(node);
    const hasText = hasTextContent(node);

    if (hasElements && hasText) {
        // Mixed: text + elements → use HTML
        contentType = 'html';
        content = node.innerHTML;
    } else if (hasElements) {
        // Only elements → use blocks
        contentType = 'blocks';
        for (const childNode of node.childNodes) {
            const childBlock = nodeToBlock(childNode);
            if (childBlock) {
                innerBlocks.push(childBlock);
            }
        }
    } else if (hasText) {
        // Only text → use text
        contentType = 'text';
        content = node.textContent;
    } else {
        // Empty element
        contentType = 'html';
        content = '';
    }
}
```

**This detection works for ANY element:**
- No hardcoded lists of "container" vs "non-container" elements
- Works with standard HTML (`div`, `p`, `span`, etc.)
- Works with custom elements (`my-component`, `web-component`, etc.)
- Works with unknown tags

**All parsed blocks are treated as Custom Elements** - the parser is category-agnostic and doesn't rely on the tag configuration system except for dynamic tags.

#### Step D: Build Block Attributes

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

#### Step E: Create Block

```javascript
return createBlock('universal/element', blockAttributes, innerBlocks);
```

- Uses WordPress `createBlock()` function
- Block name: `universal/element`
- Includes attributes and innerBlocks

## Helper Functions

### `hasChildElements(element)`

**Purpose:** Check if element has any child elements

```javascript
function hasChildElements(element) {
    for (const child of element.childNodes) {
        if (child.nodeType === Node.ELEMENT_NODE) {
            return true;
        }
    }
    return false;
}
```

**Returns:** `true` if element has any child elements

### `hasTextContent(element)`

**Purpose:** Check if element has any text content (excluding pure whitespace)

```javascript
function hasTextContent(element) {
    for (const child of element.childNodes) {
        if (child.nodeType === Node.TEXT_NODE && child.textContent.trim()) {
            return true;
        }
    }
    return false;
}
```

**Returns:** `true` if element has non-whitespace text nodes

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

**Category-Agnostic Design:** All parsed blocks are treated as Custom Elements. The parser does NOT rely on the tag configuration system for categorization.

**Limited Config Usage:** The parser only uses tag config for dynamic tags:

```javascript
const config = getTagConfig(tagName);
const isDynamicTag = config?.selfClosing === true;
```

**Config Properties Used (Dynamic Tags Only):**
- `selfClosing` (boolean): Identifies dynamic tags like `<set>`
- `contentType` (string): Content type for dynamic tags

**Example - Dynamic Tag Config:**
```javascript
{
    set: {
        selfClosing: true,
        contentType: 'empty'
    }
}
```

**Why This Design:**
- Tag registry is an **editor feature** for the tag picker UI
- Parser works independently for any HTML element
- No need to register every possible HTML tag
- Custom elements and web components work automatically

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