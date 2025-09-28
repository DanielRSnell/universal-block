# Universal Block Architecture v2.0: Tag-Based System

## Executive Summary

This document outlines the architectural evolution of Universal Block from an element-type driven system to a flexible tag-based system with modular content types. This change addresses current limitations, eliminates type-switching conflicts, and creates a truly universal HTML element system.

## Problem Statement

### Current Issues (v1.x)
1. **Type Conflicts**: Switching from "link" to "container" breaks blocks due to incompatible attributes
2. **Limited Semantic Options**: Constrained by predefined element types (text, heading, link, etc.)
3. **Inflexible Structure**: Cannot represent arbitrary HTML structures or custom elements
4. **Maintenance Complexity**: Monolithic type system difficult to extend
5. **Future-Proofing**: Cannot support web components or evolving HTML standards

### User Pain Points
- Block breaks when changing element types
- Cannot create semantic HTML structures like `<article>` with nested blocks
- No support for custom elements or web components
- Limited to predefined combinations of tag + content

## Proposed Solution: Tag + Content Type Architecture

### Core Concept
Replace the element-type driven model with a flexible system where users:
1. Choose any HTML tag (with smart filtering)
2. Select appropriate content type (when multiple options exist)
3. Configure tag-specific attributes and behaviors

## Architecture Comparison

### Current Architecture (v1.x)
```
elementType (text|heading|link|image|rule|svg|container)
    ↓ constrains
tagName (limited options per elementType)
    ↓ determines
content format & rendering logic
```

### Proposed Architecture (v2.0)
```
tagName (any HTML tag, including custom elements)
    ↓ independent of
contentType (text|blocks|html|empty)
    ↓ independent of
selfClosing (boolean) + globalAttrs (flexible)
```

## Block Attributes Changes

### Before (v1.x)
```json
{
  "elementType": "string (enum: text|heading|link|image|rule|svg|container)",
  "tagName": "string (constrained by elementType)",
  "content": "string",
  "selfClosing": "boolean",
  "globalAttrs": "object",
  "className": "string"
}
```

### After (v2.0)
```json
{
  "tagName": "string (any HTML tag)",
  "contentType": "string (enum: text|blocks|html|empty)",
  "content": "string",
  "selfClosing": "boolean",
  "globalAttrs": "object",
  "className": "string"
}
```

### Migration Notes
- `elementType` removed entirely
- `tagName` becomes freeform input with validation
- `contentType` replaces element-type logic
- Existing blocks will be migrated automatically

## Tag Configuration System

### Modular Structure
```
src/config/tags/
├── categories.js          # Tag categories for filtering
├── base-tag.js           # Base configuration interface
├── text-tags.js          # p, span, h1-h6, strong, em, etc.
├── semantic-tags.js      # article, section, header, footer, nav, etc.
├── interactive-tags.js   # button, a, input, select, etc.
├── media-tags.js         # img, video, audio, picture, etc.
├── form-tags.js          # input, textarea, fieldset, legend, etc.
├── structural-tags.js    # div, main, aside, details, summary, etc.
├── data-tags.js          # table, thead, tbody, tr, td, etc.
├── custom-tags.js        # web components, custom elements
└── index.js              # Registry and lookup functions
```

### Tag Configuration Interface
```javascript
interface TagConfig {
  label: string;                    // Human-readable name
  category: string;                 // For filtering (text|semantic|interactive|etc.)
  description?: string;             // Help text

  // Content configuration
  contentType?: string;             // Fixed content type (no user choice)
  contentTypeOptions?: string[];    // Multiple options available
  defaultContentType?: string;     // Default when multiple options

  // Element configuration
  selfClosing: boolean;            // Whether tag is self-closing
  inline?: boolean;                // Inline vs block element

  // Attributes
  requiredAttrs?: string[];        // Must have these attributes
  commonAttrs?: string[];          // Suggested/common attributes
  invalidAttrs?: string[];         // Should not have these attributes

  // UI customization
  specialControls?: string[];      // Custom UI components
  icon?: string;                   // Icon for tag selector

  // Validation
  validation?: {
    invalidContentTypes?: string[];
    recommendations?: object;
    warnings?: string[];
  };
}
```

### Example Configurations

#### Simple Tags (No Content Choice)
```javascript
// text-tags.js
export const textTags = {
  'p': {
    label: 'Paragraph',
    category: 'text',
    contentType: 'text',              // Fixed - no choice needed
    selfClosing: false,
    commonAttrs: ['style', 'id', 'class']
  },
  'h1': {
    label: 'Heading 1',
    category: 'text',
    contentType: 'text',
    selfClosing: false,
    description: 'Main page heading - use sparingly'
  }
};

// media-tags.js
export const mediaTags = {
  'img': {
    label: 'Image',
    category: 'media',
    contentType: null,                // No content - always empty
    selfClosing: true,
    requiredAttrs: ['src', 'alt'],
    specialControls: ['MediaUpload'],
    validation: {
      recommendations: {
        'always': ['Consider loading="lazy" for performance']
      }
    }
  }
};
```

#### Flexible Tags (Multiple Content Options)
```javascript
// semantic-tags.js
export const semanticTags = {
  'section': {
    label: 'Section',
    category: 'semantic',
    contentTypeOptions: ['blocks', 'text', 'html'],
    defaultContentType: 'blocks',
    selfClosing: false,
    description: 'Thematic grouping of content'
  },
  'article': {
    label: 'Article',
    category: 'semantic',
    contentTypeOptions: ['blocks', 'text'],
    defaultContentType: 'blocks',
    commonAttrs: ['itemscope', 'itemtype'],
    description: 'Standalone piece of content'
  }
};
```

#### Custom Elements
```javascript
// custom-tags.js
export const customTags = {
  'web-component': {
    label: 'Web Component',
    category: 'custom',
    contentTypeOptions: ['blocks', 'html', 'text', 'empty'],
    defaultContentType: 'html',
    selfClosing: false,
    description: 'Custom web component element'
  }
};
```

## User Interface Design

### Tag Filter (Non-Structural)
```javascript
// Inspector control that filters tag options without affecting block structure
const tagCategories = [
  { value: 'all', label: 'All Tags', icon: 'admin-generic' },
  { value: 'text', label: 'Text & Content', icon: 'editor-textcolor' },
  { value: 'semantic', label: 'Semantic Structure', icon: 'layout' },
  { value: 'interactive', label: 'Interactive', icon: 'admin-links' },
  { value: 'media', label: 'Media', icon: 'format-image' },
  { value: 'form', label: 'Form Elements', icon: 'feedback' },
  { value: 'custom', label: 'Custom Elements', icon: 'admin-tools' }
];
```

### Progressive Disclosure
1. **Simple Tags**: Show only tag selector (img, hr, br)
2. **Standard Tags**: Show tag + auto-selected content type (p, h1-h6)
3. **Flexible Tags**: Show tag + content type options (section, article, div)
4. **Custom Tags**: Show all options with smart defaults

### Smart Defaults & Auto-Configuration
- Selecting `<img>` automatically sets `contentType: null`, `selfClosing: true`
- Selecting `<p>` automatically sets `contentType: 'text'`, `selfClosing: false`
- Selecting `<section>` defaults to `contentType: 'blocks'` but shows options
- Unknown tags get universal defaults with all content type options

## Content Types

### Core Content Types
1. **text**: Rich text editing with RichText component
2. **blocks**: Nested blocks with InnerBlocks component
3. **html**: Raw HTML editing with code editor
4. **empty**: No content (self-closing or container elements)

### Future Content Types (Roadmap)
5. **media**: Specialized media picker and controls
6. **form**: Form builder interface
7. **data**: Structured data editor (JSON, tables)
8. **template**: Template selector and variable system

## Rendering Logic

### Edit Component
```javascript
function renderContent(contentType, tagName, attributes) {
  switch (contentType) {
    case 'text':
      return <RichText tagName={tagName} {...textProps} />;
    case 'blocks':
      return <InnerBlocks {...innerBlocksProps} />;
    case 'html':
      return <HTMLEditor {...htmlProps} />;
    case 'empty':
      return null;
    default:
      return <UnknownContentType type={contentType} />;
  }
}

// Main render uses tagName dynamically
return createElement(tagName, elementProps, renderContent());
```

### Save Component
```javascript
// Save always uses the same pattern regardless of complexity
const Element = tagName;
return (
  <Element {...saveProps}>
    {contentType === 'blocks' ? <InnerBlocks.Content /> : content}
  </Element>
);
```

## Migration Strategy

### Phase 1: Foundation (Backward Compatible)
**Timeline**: 1-2 weeks
**Goal**: Establish new system alongside existing system

1. Create tag configuration registry
2. Build new UI components with feature flags
3. Add migration utilities
4. Maintain full backward compatibility

**Deliverables**:
- Tag registry system (`src/config/tags/`)
- New tag selector with filtering
- Migration helper functions
- Feature flag for new UI

### Phase 2: Enhanced Features
**Timeline**: 2-3 weeks
**Goal**: Full feature parity with enhanced capabilities

1. Implement smart content type logic
2. Add tag-specific controls and validation
3. Enhanced HTML parser for auto-detection
4. Custom element support

**Deliverables**:
- Conditional content type rendering
- Tag-specific UI components
- Enhanced parser with content type detection
- Custom tag fallback system
- Validation and warning system

### Phase 3: Migration & Cleanup
**Timeline**: 1-2 weeks
**Goal**: Complete transition to new system

1. Migrate existing blocks automatically
2. Remove legacy elementType system
3. Update documentation and examples
4. Performance optimization

**Deliverables**:
- Automatic block migration on load
- Legacy code removal
- Updated documentation
- Performance benchmarks

### Phase 4: Advanced Features (Future)
**Timeline**: Ongoing
**Goal**: Extended capabilities and ecosystem

1. Advanced content types (media, form, data)
2. Template system integration
3. Third-party tag extensions
4. Visual tag builder

## Parser Integration

### Enhanced HTML Parser
The parser will need updates to support the new architecture:

```javascript
// Auto-detect content type from parsed HTML
function detectContentType(element) {
  // Has nested block-level elements -> blocks
  if (hasBlockLevelChildren(element)) return 'blocks';

  // Has complex HTML structure -> html
  if (hasComplexHTML(element)) return 'html';

  // Has text content -> text
  if (element.textContent?.trim()) return 'text';

  // Empty or self-closing -> empty
  return 'empty';
}

// Enhanced block generation
function generateUniversalBlock(element) {
  const tagName = element.tagName.toLowerCase();
  const contentType = detectContentType(element);
  const content = extractContent(element, contentType);

  return {
    name: 'universal-block/element',
    attributes: {
      tagName,
      contentType,
      content,
      selfClosing: isVoidElement(tagName),
      globalAttrs: extractAttributes(element),
      className: element.className
    },
    innerBlocks: contentType === 'blocks' ? parseInnerBlocks(element) : []
  };
}
```

## Benefits Analysis

### Developer Experience
✅ **Simplified Mental Model**: "Pick any tag + choose what goes inside"
✅ **Modular Architecture**: Easy to extend with new tags and behaviors
✅ **Type Safety**: Clear interfaces and validation
✅ **Future-Proof**: Ready for web components and new HTML standards

### User Experience
✅ **No More Breaking Changes**: Switching tags doesn't break blocks
✅ **True Semantic Freedom**: Any HTML structure is possible
✅ **Progressive Disclosure**: Simple tasks stay simple, complex tasks become possible
✅ **Smart Defaults**: Common cases require minimal configuration

### Technical Benefits
✅ **Eliminates Type Conflicts**: No more elementType attribute clashing
✅ **Better Parser Accuracy**: Can represent any HTML structure
✅ **Extensible**: Easy to add new tags, content types, and behaviors
✅ **Maintainable**: Modular code organization

### Performance Considerations
✅ **Lazy Loading**: Tag configurations loaded on demand
✅ **Memoization**: Tag lookups cached for performance
✅ **Bundle Size**: Modular system allows tree-shaking

## Risk Mitigation

### Breaking Changes
**Risk**: Existing Universal Blocks become incompatible
**Mitigation**: Automatic migration on block load + backward compatibility layer

### User Confusion
**Risk**: Too many options overwhelm users
**Mitigation**: Smart defaults + progressive disclosure + tag filtering

### Performance Impact
**Risk**: Additional complexity affects performance
**Mitigation**: Lazy loading + memoization + performance monitoring

### Maintenance Burden
**Risk**: Modular system becomes difficult to maintain
**Mitigation**: Clear interfaces + comprehensive documentation + automated testing

## Success Metrics

### Technical Metrics
- Zero block breaking incidents during type switching
- 100% HTML structure coverage in parser
- < 100ms tag lookup performance
- Successful migration of existing blocks

### User Experience Metrics
- Reduced support tickets about broken blocks
- Increased usage of semantic HTML elements
- Positive feedback on flexibility
- Faster block creation workflows

## Conclusion

The tag-based architecture represents a fundamental improvement to Universal Block that addresses current limitations while positioning the plugin for future growth. The modular design ensures maintainability, the progressive disclosure keeps the user experience approachable, and the flexible foundation supports any HTML structure.

This architectural change transforms Universal Block from a constrained element builder into a true universal HTML element system that can represent any semantic structure while maintaining ease of use for common cases.

---

**Document Version**: 1.0
**Date**: December 27, 2024
**Authors**: Claude Code Assistant
**Status**: Proposed - Awaiting Implementation