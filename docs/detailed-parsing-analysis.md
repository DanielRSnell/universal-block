# Detailed HTML Parsing Analysis

## Original vs Parsed Output Comparison

### Issue 1: **Missing Nested Structure** 🔴 CRITICAL

**Original HTML (Properly Nested):**
```html
<div class="bg-gray-900">
  <div class="mx-auto max-w-7xl py-24...">
    <div class="relative isolate overflow-hidden...">
      <svg viewBox="0 0 1024 1024"...>
        <!-- SVG content -->
      </svg>
      <div class="mx-auto max-w-md text-center...">
        <h2>Boost your productivity...</h2>
        <p>Ac euismod vel sit...</p>
        <div class="mt-10 flex items-center...">
          <a href="#" class="...">Get started</a>
          <a href="#" class="...">
            Learn more
            <span aria-hidden="true">→</span>
          </a>
        </div>
      </div>
      <div class="relative mt-16...">
        <img ... />
      </div>
    </div>
  </div>
</div>
```

**Parsed Output (Flat Structure):**
```html
<div class="alignfull bg-gray-900 wp-block-universal-block-element">
<div class="alignfull mx-auto max-w-7xl... wp-block-universal-block-element">
<div class="alignfull relative isolate... wp-block-universal-block-element">
<svg class="absolute... wp-block-universal-block-element">...</svg>
<div class="mx-auto... wp-block-universal-block-element">
<h2 class="... wp-block-universal-block-element">...</h2>
<p class="... wp-block-universal-block-element">...</p>
<div class="... wp-block-universal-block-element">
<a class="... wp-block-universal-block-element" href="#">Get started</a>
<a class="... wp-block-universal-block-element" href="#"></a>
</div>
</div>
<div class="... wp-block-universal-block-element">
<img class="... wp-block-universal-block-element" ...>
</div>
</div>
</div>
</div>
```

**Problem:** The parsed output shows all elements at the same DOM level, while the original has proper nesting.

---

### Issue 2: **Missing Link Content** 🔴 CRITICAL

**Original:**
```html
<a href="#" class="text-sm/6 font-semibold text-white hover:text-gray-100">
  Learn more
  <span aria-hidden="true">→</span>
</a>
```

**Parsed:**
```html
<a class="text-sm/6 font-semibold text-white hover:text-gray-100 wp-block-universal-block-element" href="#"></a>
```

**Problems:**
1. **Missing text content:** "Learn more" is completely gone
2. **Missing nested span:** `<span aria-hidden="true">→</span>` is missing
3. **Empty link:** The `<a>` tag has no content at all

---

### Issue 3: **Extra WordPress Classes Added** 🟡 MEDIUM

**Original:** `class="bg-gray-900"`
**Parsed:** `class="alignfull bg-gray-900 wp-block-universal-block-element"`

**Problems:**
1. **`alignfull` class** being added automatically (likely from block supports)
2. **`wp-block-universal-block-element` class** being added to every element

---

### Issue 4: **SVG Structure Preserved But Positioning Wrong** 🟡 MEDIUM

**Original SVG Position:** Nested inside the third div
**Parsed SVG Position:** Appears to be at the same level as containers

The SVG content itself is preserved correctly, but its position in the DOM hierarchy is wrong.

---

## Root Cause Analysis

### 1. **Container Nesting Logic Failure**
The parser's container handling is creating inner blocks but the final output isn't respecting the hierarchy. Looking at the flat output, it seems like the nesting is being "flattened" somewhere in the process.

### 2. **Mixed Content Elements Not Handled**
Links with both text content AND child elements (spans) are not being processed correctly:
- The text content ("Learn more") is being lost
- The child span element is being ignored
- The link becomes empty

### 3. **WordPress Block Class Injection**
WordPress is automatically adding classes that weren't in the original HTML:
- `alignfull` (from block supports)
- `wp-block-universal-block-element` (block CSS class)

## Parsing Logic Issues

### Issue A: `insertBlockMarkupIntoEditor` vs DOM Structure
The parser generates correct nested block markup, but when WordPress processes it, the DOM output is flattened. This suggests the issue might be in how the blocks are being rendered on the frontend, not just the parsing.

### Issue B: Mixed Content Processing Order
For elements like links that contain both text and child elements:
1. Text content is extracted: `content = node.textContent.trim()`
2. Child elements are processed separately
3. But when child elements exist, we delete the content: `delete block.attributes.content`
4. However, the child elements might not be getting properly preserved

### Issue C: Server-Side Rendering vs Editor Parsing
The flattened output suggests this might be the server-side rendered version (from `render-element.php`) rather than what the parser is generating.

## Key Questions to Investigate

1. **Is this the actual block markup output or the final rendered HTML?**
2. **Are the nested blocks being created correctly but rendered flat?**
3. **Why is mixed content (text + child elements) being lost?**
4. **Are WordPress block supports interfering with the original classes?**

## Next Steps Required

1. **Examine the actual block markup** generated by the parser (not the final rendered HTML)
2. **Check server-side rendering** in `render-element.php` for nesting issues
3. **Fix mixed content handling** for elements like links with spans
4. **Review block supports** that might be adding unwanted classes