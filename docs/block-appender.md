# Block Appender & Visual Selection Guide

This document explains how to customize the block appender (the UI that lets you add new blocks inside container blocks) and how to make selected blocks more visible in the editor.

## Table of Contents
- [Block Appender Configuration](#block-appender-configuration)
- [Making Selected Blocks Visible](#making-selected-blocks-visible)
- [Custom Appender Examples](#custom-appender-examples)

---

## Block Appender Configuration

### What is the Block Appender?

The block appender is the UI element that appears inside container blocks (blocks with `contentType: 'blocks'`) to let users add new nested blocks. It's the "+" button or placeholder text you see when clicking inside an empty container.

### Current Configuration

**File:** [src/components/Edit.js:260-262](../src/components/Edit.js#L260-L262)

```javascript
const { children, ...innerBlocksProps } = useInnerBlocksProps(blockProps, {
    renderAppender: false
});
```

**Current setting:** `renderAppender: false` - No appender shows, users can't easily add blocks inside containers.

### Available Appender Options

#### 1. No Appender (Current)
```javascript
renderAppender: false
```
- **What it does:** Nothing shows, no way to add blocks via UI
- **When to use:** When you want to programmatically add blocks only, or blocks are added via other means
- **User experience:** Confusing - users can't see where to click to add content

#### 2. Button Block Appender (Recommended)
```javascript
import { InnerBlocks } from '@wordpress/block-editor';

useInnerBlocksProps(blockProps, {
    renderAppender: InnerBlocks.ButtonBlockAppender
});
```
- **What it does:** Shows a small "+" button
- **When to use:** Clean, minimal UI for adding blocks
- **User experience:** Clear, simple button to click

#### 3. Default Block Appender
```javascript
import { InnerBlocks } from '@wordpress/block-editor';

useInnerBlocksProps(blockProps, {
    renderAppender: InnerBlocks.DefaultBlockAppender
});
```
- **What it does:** Shows placeholder text "Type / to choose a block"
- **When to use:** When you want the standard WordPress experience
- **User experience:** Familiar to WordPress users, shows keyboard shortcut hint

#### 4. Custom Appender Function
```javascript
const CustomAppender = () => {
    const { insertBlock } = useDispatch('core/block-editor');
    const { clientId } = useBlockProps();

    return (
        <button
            onClick={() => {
                const newBlock = createBlock('universal/element');
                insertBlock(newBlock, undefined, clientId);
            }}
            className="custom-appender-button"
        >
            + Add Universal Element
        </button>
    );
};

useInnerBlocksProps(blockProps, {
    renderAppender: CustomAppender
});
```
- **What it does:** Renders your custom component
- **When to use:** When you need custom styling or behavior
- **User experience:** Fully customizable

---

## Making Selected Blocks Visible

### The Problem

When you click on a Universal Block, especially nested ones, it's hard to tell which block is selected because there's no visual feedback.

### Solution 1: Use Block Outline (CSS)

Add CSS to highlight selected blocks:

**File:** [src/style.scss](../src/style.scss)

```scss
// Highlight selected Universal Blocks
.block-editor-block-list__block.is-selected {
    > [data-type="universal/element"] {
        outline: 2px solid #007cba;
        outline-offset: -2px;
    }
}

// Highlight when block has focus
.block-editor-block-list__block.is-navigate-mode {
    > [data-type="universal/element"] {
        outline: 1px dashed #007cba;
        outline-offset: -1px;
    }
}
```

### Solution 2: Add Visual Indicator Component

Create a component that shows when block is selected:

**Create new file:** `src/components/SelectionIndicator.js`

```javascript
import { useSelect } from '@wordpress/data';

export function SelectionIndicator({ clientId, tagName, contentType }) {
    const isSelected = useSelect(
        (select) => {
            const selectedId = select('core/block-editor').getSelectedBlockClientId();
            return selectedId === clientId;
        },
        [clientId]
    );

    if (!isSelected) {
        return null;
    }

    return (
        <div
            style={{
                position: 'absolute',
                top: '-24px',
                left: '-2px',
                backgroundColor: '#007cba',
                color: 'white',
                padding: '2px 8px',
                borderRadius: '3px 3px 0 0',
                fontSize: '11px',
                fontWeight: '500',
                fontFamily: 'monospace',
                pointerEvents: 'none',
                zIndex: 10,
            }}
        >
            &lt;{tagName}&gt; {contentType}
        </div>
    );
}
```

**Use in Edit.js:**

```javascript
import { SelectionIndicator } from './SelectionIndicator';

// In your render for blocks content type:
<TagElement {...elementProps}>
    <SelectionIndicator
        clientId={clientId}
        tagName={currentTagName}
        contentType={currentContentType}
    />
    {children}
</TagElement>
```

### Solution 3: Enhanced Block Wrapper with Selection State

Add a wrapper that changes appearance when selected:

```javascript
import { useSelect } from '@wordpress/data';

export default function Edit({ attributes, setAttributes, clientId }) {
    // ... existing code ...

    const isSelected = useSelect(
        (select) => {
            const selectedId = select('core/block-editor').getSelectedBlockClientId();
            return selectedId === clientId;
        },
        [clientId]
    );

    // For blocks content type, add selection styling
    const elementProps = {
        ...getCleanElementProps(),
        ...innerBlocksProps,
        style: {
            ...innerBlocksProps.style,
            ...(isSelected && {
                outline: '2px solid #007cba',
                outlineOffset: '-2px',
            }),
        },
    };

    return (
        <>
            {/* ... controls ... */}
            <TagElement {...elementProps}>
                {children}
            </TagElement>
        </>
    );
}
```

---

## Custom Appender Examples

### Example 1: Always Show ButtonBlockAppender

**Change in Edit.js:**

```javascript
const { children, ...innerBlocksProps } = useInnerBlocksProps(blockProps, {
    renderAppender: InnerBlocks.ButtonBlockAppender
});
```

### Example 2: Show Different Appenders Based on Block Count

```javascript
import { useSelect } from '@wordpress/data';

// Inside Edit component
const blockCount = useSelect(
    (select) => {
        return select('core/block-editor').getBlockCount(clientId);
    },
    [clientId]
);

const { children, ...innerBlocksProps } = useInnerBlocksProps(blockProps, {
    renderAppender: blockCount === 0
        ? InnerBlocks.DefaultBlockAppender  // Show text when empty
        : InnerBlocks.ButtonBlockAppender   // Show button when has blocks
});
```

### Example 3: Only Show Appender for Certain Tags

```javascript
const shouldShowAppender = ['div', 'section', 'article'].includes(currentTagName);

const { children, ...innerBlocksProps } = useInnerBlocksProps(blockProps, {
    renderAppender: shouldShowAppender
        ? InnerBlocks.ButtonBlockAppender
        : false
});
```

### Example 4: Custom "Add Element" Button

```javascript
import { useDispatch } from '@wordpress/data';
import { createBlock } from '@wordpress/blocks';
import { Button } from '@wordpress/components';

const CustomAppender = () => {
    const { insertBlock } = useDispatch('core/block-editor');

    const addUniversalBlock = () => {
        const newBlock = createBlock('universal/element', {
            tagName: 'div',
            contentType: 'blocks'
        });
        insertBlock(newBlock, undefined, clientId);
    };

    return (
        <div style={{
            padding: '20px',
            textAlign: 'center',
            background: '#f0f0f0',
            border: '2px dashed #ccc',
            borderRadius: '4px',
            margin: '10px 0'
        }}>
            <Button
                variant="primary"
                onClick={addUniversalBlock}
                icon="plus"
            >
                Add Universal Element
            </Button>
        </div>
    );
};

const { children, ...innerBlocksProps } = useInnerBlocksProps(blockProps, {
    renderAppender: CustomAppender
});
```

---

## Recommended Configuration

For the best user experience with Universal Block:

1. **Use ButtonBlockAppender** for clean, minimal UI
2. **Add CSS outline** for selected blocks
3. **Consider conditional appenders** based on tag type

**Recommended changes to Edit.js:**

```javascript
// At the top with imports
import { InnerBlocks } from '@wordpress/block-editor';

// In the component
const { children, ...innerBlocksProps } = useInnerBlocksProps(blockProps, {
    renderAppender: InnerBlocks.ButtonBlockAppender
});
```

**Recommended CSS in style.scss:**

```scss
// Visual feedback for selected blocks
.block-editor-block-list__block.is-selected > [data-type="universal/element"] {
    outline: 2px solid #007cba;
    outline-offset: -2px;
    position: relative;
}
```

---

## Testing

After making changes:

1. **Rebuild:** `npm run build`
2. **Refresh editor**
3. **Add a Universal Block** with `contentType: 'blocks'`
4. **Click inside the block** - you should see the appender
5. **Select the block** - you should see visual feedback

---

## Troubleshooting

**Q: Appender not showing?**
- Check that `contentType === 'blocks'`
- Verify InnerBlocks is imported
- Make sure you rebuilt with `npm run build`

**Q: Can't select nested blocks?**
- This is normal WordPress behavior - click once selects parent, click again selects child
- Add CSS outline to make selection more obvious

**Q: Custom appender not rendering?**
- Ensure it's a valid React component
- Check browser console for errors
- Verify clientId is available in scope

---

## Related Files

- [src/components/Edit.js](../src/components/Edit.js) - Main edit component
- [src/style.scss](../src/style.scss) - Editor styles
- [WordPress InnerBlocks Documentation](https://developer.wordpress.org/block-editor/reference-guides/components/inner-blocks/)
