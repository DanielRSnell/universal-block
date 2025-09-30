# HTML to Blocks Bidirectional Parser

This document explains the HTML ↔ Blocks conversion system used in Universal Block.

## Overview

The Universal Block plugin includes a bidirectional parser that converts between HTML and Gutenberg block structures. This enables:

1. **HTML → Blocks**: Converting raw HTML content into editable Universal Element blocks
2. **Blocks → HTML**: Serializing block structures back into clean HTML

Both parsers work together to provide seamless conversion between content formats.

## Architecture

### File Structure

- **[src/utils/htmlToBlocks.js](../src/utils/htmlToBlocks.js)**: HTML → Blocks parser
- **[src/utils/blocksToHtml.js](../src/utils/blocksToHtml.js)**: Blocks → HTML serializer
- **[src/components/Edit.js](../src/components/Edit.js)**: Integration and UI controls

### Global Exposure

Both parsers are exposed globally on the window object for external use:

```javascript
window.UniversalBlockParsers = {
    parseHTMLToBlocks,
    parseBlocksToHTML
};
```

## HTML → Blocks Parser

### Entry Point: `parseHTMLToBlocks(html)`

**Purpose**: Converts an HTML string into an array of Universal Element block objects.

**Parameters**:
- `html` (string): Raw HTML string to parse

**Returns**:
- Array of block objects compatible with `createBlock()`

**Process**:

```
HTML String
    ↓
DOMParser (creates DOM tree)
    ↓
Container <div> wrapper
    ↓
Iterate childNodes
    ↓
nodeToBlock() for each node
    ↓
Array of Block Objects
```

### Core Function: `nodeToBlock(node)`

Recursively converts DOM nodes into block structures. Handles three node types:

#### 1. Text Nodes (`Node.TEXT_NODE`)

Standalone text is wrapped in a paragraph block:

```javascript
// Input: Text node with content "Hello World"
// Output:
{
    name: 'universal/element',
    attributes: {
        tagName: 'p',
        contentType: 'text',
        content: 'Hello World',
        selfClosing: false
    }
}
```

#### 2. Element Nodes (`Node.ELEMENT_NODE`)

Elements are analyzed and converted based on their structure:

**Attribute Extraction**:
- `class` attribute → `className` (WordPress convention)
- All other attributes → `globalAttrs` object
- Attribute values are preserved as-is

**Content Type Detection**:

The parser uses intelligent detection to determine the appropriate `contentType`:

| Condition | Content Type | Description |
|-----------|-------------|-------------|
| Void element (img, hr, br, etc.) | `empty` | Self-closing element |
| Contains only text | `text` | Simple text content, no child elements |
| Contains child elements | `blocks` | Nested structure → InnerBlocks |
| Mixed/complex content | `html` | Falls back to raw innerHTML |

**Content Type Logic**:

```javascript
// 1. Self-closing/void elements
const voidElements = ['img', 'br', 'hr', 'input', 'meta', 'link', ...];
if (voidElements.includes(tagName)) {
    contentType = 'empty';
}

// 2. Text-only content
else if (hasOnlyTextContent(node)) {
    contentType = 'text';
    content = node.textContent;
}

// 3. Has child elements
else if (hasChildElements(node)) {
    contentType = 'blocks';
    innerBlocks = node.childNodes.map(nodeToBlock);
}

// 4. Complex/mixed content
else {
    contentType = 'html';
    content = node.innerHTML;
}
```

### Helper Functions

#### `hasOnlyTextContent(element)`
Checks if element contains only text nodes (no child elements):
- Iterates through all child nodes
- Returns `false` if any `ELEMENT_NODE` is found
- Returns `true` if only text exists and is non-empty

#### `hasChildElements(element)`
Checks if element has child elements or meaningful text:
- Returns `true` if any child is an `ELEMENT_NODE`
- Returns `true` if non-empty text nodes exist
- Used to determine if content should be blocks vs HTML

#### `detectContentType(element)` *(Helper, not actively used)*
Provides smart content type detection based on tag name and structure:
- Recognizes common text elements (p, span, h1-h6, etc.)
- Identifies container elements (div, section, article, etc.)
- Falls back to HTML for ambiguous cases

## Blocks → HTML Serializer

### Entry Point: `parseBlocksToHTML(blocks)`

**Purpose**: Converts block objects back into clean HTML string.

**Parameters**:
- `blocks` (Array): Array of block objects

**Returns**:
- HTML string with proper formatting

**Process**:

```
Array of Block Objects
    ↓
Map each block to blockToHTML()
    ↓
Join with newlines
    ↓
Clean HTML String
```

### Core Function: `blockToHTML(block)`

Converts a single block to HTML with proper attributes and nesting.

**Attribute Building**:

```javascript
// 1. Add className if present
if (className) {
    attributesString += ` class="${escapeAttribute(className)}"`;
}

// 2. Add all globalAttrs
Object.entries(globalAttrs).forEach(([name, value]) => {
    attributesString += ` ${escapeAttributeName(name)}="${escapeAttribute(value)}"`;
});
```

**Content Handling by Type**:

| Content Type | Processing |
|-------------|-----------|
| `text` | Direct content output |
| `html` | Raw HTML content output |
| `blocks` | Recursive: `parseBlocksToHTML(innerBlocks)` |
| `empty` | No content (self-closing tag) |

**HTML Generation**:

```javascript
// Self-closing elements
if (selfClosing || isVoidElement(tagName)) {
    return `<${tagName}${attributesString} />`;
}

// Container elements
else {
    return `<${tagName}${attributesString}>${innerContent}</${tagName}>`;
}
```

### Security Functions

#### `escapeAttribute(value)`
Escapes special characters in attribute values:
- `&` → `&amp;`
- `"` → `&quot;`
- `'` → `&#x27;`
- `<` → `&lt;`
- `>` → `&gt;`

#### `escapeAttributeName(name)`
Sanitizes attribute names:
- Only allows: `a-z`, `A-Z`, `0-9`, `-`, `_`
- Removes all other characters

#### `isVoidElement(tagName)`
Checks if tag is a void/self-closing element:
- Returns `true` for: img, br, hr, input, meta, link, area, base, col, embed, source, track, wbr

## Integration in Edit.js

### Conversion Triggers

The parsers are used in two main conversion scenarios:

#### 1. HTML → Blocks Conversion

**Trigger**: User clicks "🔄 Convert to Inner Blocks" button in HTML Content panel

**Location**: Lines 101-125 in [Edit.js](../src/components/Edit.js)

```javascript
const convertToInnerBlocks = () => {
    if (!content || currentContentType !== 'html') return;

    try {
        const parsedBlocks = parseHTMLToBlocks(content);

        if (parsedBlocks.length > 0) {
            // Change to blocks content type
            setAttributes({
                contentType: 'blocks',
                content: ''
            });

            // Create new block with parsed inner blocks
            const newBlock = createBlock('universal/element', {
                ...attributes,
                contentType: 'blocks',
                content: ''
            }, parsedBlocks);

            // Replace current block
            replaceBlocks(clientId, newBlock);
        }
    } catch (error) {
        console.error('Failed to convert HTML to blocks:', error);
    }
};
```

**UI Location**: HTML Content panel (only visible when `contentType === 'html'`)

**User Flow**:
1. User has block with HTML content
2. Opens HTML Content panel in sidebar
3. Clicks conversion button
4. HTML is parsed into nested block structure
5. Block's contentType changes to `blocks`
6. Inner blocks become editable

#### 2. Blocks → HTML Conversion

**Trigger**: User clicks "🔄 Convert to HTML" button in Blocks Conversion panel

**Location**: Lines 129-153 in [Edit.js](../src/components/Edit.js)

```javascript
const convertToHTML = () => {
    if (currentContentType !== 'blocks') return;

    // Get raw block data including innerBlocks
    if (!rawBlockData || !rawBlockData.innerBlocks || rawBlockData.innerBlocks.length === 0) {
        return;
    }

    try {
        // Convert inner blocks to HTML
        const htmlContent = parseBlocksToHTML(rawBlockData.innerBlocks);

        if (htmlContent) {
            // Change to HTML content type
            setAttributes({
                contentType: 'html',
                content: htmlContent
            });
        }
    } catch (error) {
        console.error('Failed to convert blocks to HTML:', error);
    }
};
```

**UI Location**: Blocks Conversion panel (only visible when `contentType === 'blocks'` and inner blocks exist)

**User Flow**:
1. User has block with inner blocks (contentType = 'blocks')
2. Opens Blocks Conversion panel in sidebar
3. Clicks conversion button
4. Inner blocks are serialized to HTML string
5. Block's contentType changes to `html`
6. Content can be edited in Ace Editor

## Example Transformations

### Example 1: Simple Text Structure

**Input HTML**:
```html
<div class="container">
    <h1>Welcome</h1>
    <p>Hello World</p>
</div>
```

**Parsed Blocks**:
```javascript
[
    {
        name: 'universal/element',
        attributes: {
            tagName: 'div',
            contentType: 'blocks',
            className: 'container',
            selfClosing: false
        },
        innerBlocks: [
            {
                name: 'universal/element',
                attributes: {
                    tagName: 'h1',
                    contentType: 'text',
                    content: 'Welcome',
                    selfClosing: false
                }
            },
            {
                name: 'universal/element',
                attributes: {
                    tagName: 'p',
                    contentType: 'text',
                    content: 'Hello World',
                    selfClosing: false
                }
            }
        ]
    }
]
```

**Back to HTML**:
```html
<div class="container">
<h1>Welcome</h1>
<p>Hello World</p>
</div>
```

### Example 2: Complex Nested Structure

**Input HTML**:
```html
<article class="post" data-id="123">
    <header>
        <h2>Article Title</h2>
        <div class="meta">
            <span>By John</span>
            <time>2024-01-01</time>
        </div>
    </header>
    <p>Article content here.</p>
</article>
```

**Parsed Structure**:
- Root: article (blocks) with className="post", globalAttrs={data-id: "123"}
  - Child 1: header (blocks)
    - Child 1.1: h2 (text) = "Article Title"
    - Child 1.2: div (blocks) with className="meta"
      - Child 1.2.1: span (text) = "By John"
      - Child 1.2.2: time (text) = "2024-01-01"
  - Child 2: p (text) = "Article content here."

All nested relationships are preserved through the `innerBlocks` property.

### Example 3: Void Elements

**Input HTML**:
```html
<div>
    <img src="photo.jpg" alt="Photo" />
    <hr />
    <p>Text after separator</p>
</div>
```

**Parsed Structure**:
- div (blocks)
  - img (empty) with globalAttrs={src: "photo.jpg", alt: "Photo"}
  - hr (empty)
  - p (text) = "Text after separator"

Void elements are automatically detected and marked with `contentType: 'empty'` and `selfClosing: true`.

### Example 4: Mixed Content (HTML Fallback)

**Input HTML**:
```html
<p>This has <strong>bold</strong> and <em>italic</em> text</p>
```

**Parsed Structure**:
```javascript
{
    name: 'universal/element',
    attributes: {
        tagName: 'p',
        contentType: 'html',  // Falls back to HTML for mixed content
        content: 'This has <strong>bold</strong> and <em>italic</em> text',
        selfClosing: false
    }
}
```

When text and inline elements are mixed, the parser uses `contentType: 'html'` to preserve the exact structure.

## Tag Configuration Integration

The parser respects tag configurations from [src/config/tags/index.js](../src/config/tags/index.js):

```javascript
const config = getTagConfig(tagName);

// Use config defaults if available
const finalContentType = config?.contentType || contentType;
const finalSelfClosing = config?.selfClosing !== undefined ? config.selfClosing : isSelfClosing;
```

This ensures that known tags follow their predefined behavior while allowing flexibility for custom elements.

## Use Cases

### 1. Rapid HTML Prototyping
Users can paste or write HTML in the Ace Editor, then convert it to editable blocks for fine-grained control.

### 2. HTML Template Import
Import external HTML templates and convert them into editable Gutenberg block structures.

### 3. Dynamic Content Editing
When using dynamic preview mode with Timber/Twig, users can view compiled output but still easily edit the source content through the text panel or by converting to HTML for complex edits.

### 4. Code-to-Visual Workflow
Developers can write HTML code, then switch to visual block editing without losing structure.

### 5. Block Export
Export block structures as clean HTML for use in other systems or templates.

## Limitations & Edge Cases

### Current Limitations

1. **Inline Formatting**: Mixed inline elements (bold, italic, links within text) fall back to HTML content type
2. **Comment Nodes**: HTML comments are not preserved during parsing
3. **SVG Content**: Complex SVG structures may fall back to HTML content type
4. **Custom Elements**: Web components are supported but treated as generic elements

### Edge Case Handling

**Empty Text Nodes**: Whitespace-only text nodes are ignored during parsing.

**Invalid HTML**: DOMParser handles malformed HTML gracefully but may produce unexpected structures.

**Deep Nesting**: No depth limit on recursion - very deep structures are fully supported but may impact performance.

**Attribute Sanitization**: Special characters in attribute values are properly escaped during HTML generation.

## Performance Considerations

- **DOMParser**: Native browser API, very fast for HTML parsing
- **Recursive Processing**: Each node processed once, O(n) complexity
- **Memory**: Temporary DOM tree created for parsing, garbage collected after
- **Large Documents**: Both parsers handle large structures efficiently
- **Real-time Updates**: Fast enough for real-time conversion in the editor

## Future Enhancements

Potential improvements to consider:

1. **Preserve Inline Formatting**: Better detection and conversion of inline formatted text (bold, italic, links) to blocks
2. **Comment Preservation**: Option to preserve HTML comments in block metadata
3. **Custom Element Mapping**: Allow custom tag configurations to define conversion rules
4. **Validation**: Optional validation of HTML structure before conversion
5. **Formatting Options**: Configurable HTML output formatting (indentation, line breaks)
6. **Error Handling**: More detailed error messages for conversion failures

## Testing

To test the parsers manually in browser console:

```javascript
// HTML to Blocks
const html = '<div class="test"><p>Hello</p></div>';
const blocks = window.UniversalBlockParsers.parseHTMLToBlocks(html);
console.log(blocks);

// Blocks to HTML
const htmlOutput = window.UniversalBlockParsers.parseBlocksToHTML(blocks);
console.log(htmlOutput);
```

Both functions are available globally for debugging and external integration.