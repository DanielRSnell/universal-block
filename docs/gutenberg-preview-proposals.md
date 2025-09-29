# Gutenberg Preview Proposals for Dynamic Tags

## Overview

The Universal Block plugin uses dynamic tags (`<set>`, `<if>`, `<loop>`) that are processed globally via the `the_content` filter after all blocks are rendered. This creates a challenge for Gutenberg previews, as blocks are typically rendered individually without access to variables from other blocks.

## The Core Challenge

### Current Architecture
1. **Individual Block Rendering**: Each Universal Block renders via `render-element.php`
2. **Global Processing**: `the_content` filter processes all dynamic tags together at priority 11
3. **Variable Scope**: Variables from `<set>` blocks become available to all subsequent blocks

### Gutenberg Limitations
- Blocks preview individually in isolation
- A `<set>` block in one location cannot affect previews of blocks in other locations
- No shared context between block previews
- Variables need cross-block scope for accurate previews

---

## Option A: Full Page Context Preview

### Concept
Send all blocks on the page to a preview API endpoint, process them together server-side, and return the preview for the specific requested block.

### Technical Implementation

#### 1. REST API Endpoint
```php
// /wp-json/universal-block/v1/preview
class Universal_Block_Preview_API {
    public function preview_endpoint($request) {
        $all_blocks = $request->get_param('allBlocks');
        $target_block_id = $request->get_param('targetBlockId');

        // Serialize all blocks to HTML
        $full_content = '';
        foreach ($all_blocks as $block) {
            $full_content .= render_block($block);
        }

        // Process with dynamic tag parser and Timber
        $processed_content = $this->process_dynamic_content($full_content);

        // Extract preview for target block
        return $this->extract_block_preview($processed_content, $target_block_id);
    }
}
```

#### 2. Block Editor Integration
```javascript
// In Universal Block edit component
import { useSelect } from '@wordpress/data';
import { useEffect, useState } from '@wordpress/element';

function UniversalBlockEdit({ attributes, clientId }) {
    const [preview, setPreview] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    // Get all blocks from the editor
    const allBlocks = useSelect(select =>
        select('core/block-editor').getBlocks()
    );

    // Update preview when content changes
    useEffect(() => {
        if (hasDynamicContent(attributes.content)) {
            updatePreview();
        }
    }, [attributes.content, allBlocks]);

    const updatePreview = async () => {
        setIsLoading(true);
        try {
            const response = await wp.apiFetch({
                path: '/universal-block/v1/preview',
                method: 'POST',
                data: {
                    allBlocks: allBlocks,
                    targetBlockId: clientId
                }
            });
            setPreview(response.html);
        } catch (error) {
            console.error('Preview error:', error);
        }
        setIsLoading(false);
    };

    return (
        <div>
            {/* Block controls */}
            <div className="preview-container">
                {isLoading ? <Spinner /> : <div dangerouslySetInnerHTML={{__html: preview}} />}
            </div>
        </div>
    );
}
```

#### 3. Performance Optimizations
- **Debouncing**: Limit API calls during rapid typing
- **Caching**: Cache results for unchanged block combinations
- **Selective Updates**: Only update preview when relevant blocks change
- **Background Processing**: Use web workers for large page processing

### Pros
- **100% Accurate**: Uses real Timber context and server-side processing
- **Cross-Block Variables**: Variables from any block available to any other block
- **Future-Proof**: Works with any complexity of dynamic tags
- **Real Data**: Can access actual post/user/meta data for previews

### Cons
- **Performance Impact**: API call on every content change
- **Network Dependency**: Requires server connection for previews
- **Complexity**: More complex implementation and debugging
- **Latency**: Slight delay in preview updates

### Implementation Phases
1. **Phase 1**: Basic API endpoint and simple block preview
2. **Phase 2**: Performance optimizations (debouncing, caching)
3. **Phase 3**: Advanced features (error handling, fallbacks)

---

## Option B: Editor State Management

### Concept
Maintain a global state in the Gutenberg editor that tracks all variables and processes dynamic tags client-side using mock/sample data.

### Technical Implementation

#### 1. Global Context Provider
```javascript
// Editor context for dynamic variables
const DynamicVariablesContext = createContext();

function DynamicVariablesProvider({ children }) {
    const [variables, setVariables] = useState({});
    const [mockData, setMockData] = useState({
        post: { title: 'Sample Post', id: 123 },
        user: { name: 'John Doe' }
    });

    const updateVariable = (name, value) => {
        setVariables(prev => ({ ...prev, [name]: value }));
    };

    return (
        <DynamicVariablesContext.Provider value={{
            variables,
            mockData,
            updateVariable
        }}>
            {children}
        </DynamicVariablesContext.Provider>
    );
}
```

#### 2. Client-Side Dynamic Tag Processor
```javascript
class ClientDynamicProcessor {
    static processContent(content, variables, mockData) {
        // Parse <set> tags and update variables
        content = this.parseSetTags(content, variables);

        // Parse <if> and <loop> tags
        content = this.parseIfTags(content, variables, mockData);
        content = this.parseLoopTags(content, variables, mockData);

        // Process basic Twig syntax
        content = this.processTwigSyntax(content, variables, mockData);

        return content;
    }

    static parseSetTags(content, variables) {
        return content.replace(
            /<set\s+variable="([^"]+)"\s+value="([^"]+)"\s*\/?>/g,
            (match, variable, value) => {
                variables[variable] = this.parseValue(value);
                return `<!-- Set ${variable} = ${value} -->`;
            }
        );
    }
}
```

#### 3. Block Integration
```javascript
function UniversalBlockEdit({ attributes }) {
    const { variables, mockData, updateVariable } = useContext(DynamicVariablesContext);
    const [preview, setPreview] = useState('');

    useEffect(() => {
        const processed = ClientDynamicProcessor.processContent(
            attributes.content,
            variables,
            mockData
        );
        setPreview(processed);
    }, [attributes.content, variables, mockData]);

    return (
        <div>
            <div className="preview-notice">
                ⚠️ Preview uses sample data
            </div>
            <div dangerouslySetInnerHTML={{__html: preview}} />
        </div>
    );
}
```

### Pros
- **Fast Performance**: No server calls, instant updates
- **Offline Capable**: Works without network connection
- **Simple Architecture**: Easier to implement and debug
- **Low Latency**: Immediate preview updates

### Cons
- **Mock Data Only**: Cannot use real post/user/meta data
- **Limited Accuracy**: May not match final frontend output
- **Maintenance Overhead**: Need to keep client processor in sync with server
- **Complex Logic**: Difficult to replicate full Twig functionality

---

## Option C: Section-Based Processing

### Concept
Group related blocks into logical "sections" and process each section independently, with global variables shared across sections.

### Technical Implementation

#### 1. Section Detection
```javascript
// Detect logical sections in block tree
class SectionDetector {
    static detectSections(blocks) {
        const sections = [];
        let currentSection = [];

        blocks.forEach(block => {
            if (this.isSectionBoundary(block)) {
                if (currentSection.length > 0) {
                    sections.push(currentSection);
                    currentSection = [];
                }
            }
            currentSection.push(block);
        });

        if (currentSection.length > 0) {
            sections.push(currentSection);
        }

        return sections;
    }

    static isSectionBoundary(block) {
        return block.name === 'core/separator' ||
               block.name === 'core/heading' ||
               block.attributes?.tagName === 'section';
    }
}
```

#### 2. Cross-Section Variable Management
```javascript
// Global variable store for sections
class SectionVariableStore {
    constructor() {
        this.globalVariables = {};
        this.sectionVariables = new Map();
    }

    setSectionVariable(sectionId, name, value) {
        if (!this.sectionVariables.has(sectionId)) {
            this.sectionVariables.set(sectionId, {});
        }
        this.sectionVariables.get(sectionId)[name] = value;
    }

    setGlobalVariable(name, value) {
        this.globalVariables[name] = value;
    }

    getVariablesForSection(sectionId) {
        return {
            ...this.globalVariables,
            ...this.sectionVariables.get(sectionId) || {}
        };
    }
}
```

#### 3. Section Preview Processing
```javascript
function SectionBasedPreview({ sectionBlocks, sectionId }) {
    const [preview, setPreview] = useState('');

    useEffect(() => {
        updateSectionPreview();
    }, [sectionBlocks]);

    const updateSectionPreview = async () => {
        const response = await wp.apiFetch({
            path: '/universal-block/v1/section-preview',
            method: 'POST',
            data: {
                sectionBlocks: sectionBlocks,
                sectionId: sectionId,
                globalVariables: variableStore.globalVariables
            }
        });
        setPreview(response.html);
    };

    return <div dangerouslySetInnerHTML={{__html: preview}} />;
}
```

### Pros
- **Balanced Performance**: Fewer API calls than full-page processing
- **Logical Grouping**: Matches content organization patterns
- **Scalable**: Better performance on large pages
- **Partial Accuracy**: More accurate than pure client-side

### Cons
- **Complex Logic**: Need to define section boundaries
- **Variable Scope Issues**: Cross-section variables still challenging
- **Implementation Complexity**: More complex than other options
- **User Experience**: May be confusing what constitutes a "section"

---

## Recommendation

**Start with Option A (Full Page Context Preview)** for the following reasons:

1. **Accuracy**: Provides 100% accurate previews using real Timber context
2. **Simplicity**: Leverages existing server-side processing without duplication
3. **Future-Proof**: Will work with any complexity of dynamic tags we add
4. **Real Data**: Users can see previews with actual post/meta/user data

**Implementation Strategy**:
1. **MVP**: Basic full-page preview with simple debouncing
2. **Optimization**: Add caching and performance improvements
3. **Enhancement**: Add fallback to Option B for offline scenarios

**Performance Mitigations**:
- Debounce API calls (500ms delay)
- Cache results based on block content hash
- Only send blocks that contain dynamic tags
- Progressive enhancement (show static preview first, then dynamic)

This approach gives us the most accurate and maintainable solution while providing the best user experience for content creators working with dynamic tags.