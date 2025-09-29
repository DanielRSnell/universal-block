# Context-Aware Preview Implementation

## Enhanced Option A: Full Page Context Preview with Real Data

### Overview

This implementation combines the accuracy of server-side processing with the rich context data already available in the Gutenberg editor. By leveraging existing global variables like `window.pageData` and editor state, we can recreate the exact frontend environment server-side for 100% accurate previews.

## Architecture Overview

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Gutenberg     │    │   Preview API    │    │   Timber        │
│   Editor        │───▶│   Endpoint       │───▶│   Context       │
│                 │    │                  │    │   Recreation    │
│ • All Blocks    │    │ • Process Blocks │    │ • Real Post     │
│ • Page Context  │    │ • Apply Context  │    │ • Real User     │
│ • Live Toggle   │    │ • Dynamic Tags   │    │ • Real Meta     │
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

## Implementation Details

### 1. Context Data Collection

#### 1.1 Available Context Sources in Gutenberg
```javascript
// In the block editor, we have access to:
const contextSources = {
    // WordPress Core Editor Data
    postId: wp.data.select('core/editor').getCurrentPostId(),
    postType: wp.data.select('core/editor').getCurrentPostType(),
    postStatus: wp.data.select('core/editor').getEditedPostAttribute('status'),
    postMeta: wp.data.select('core/editor').getEditedPostAttribute('meta'),

    // Global Window Data (your existing setup)
    pageData: window.pageData || {},
    wpUserData: window.wpUserData || {},
    wpSettings: window.wpApiSettings || {},

    // Block Editor State
    allBlocks: wp.data.select('core/block-editor').getBlocks(),
    selectedBlockId: wp.data.select('core/block-editor').getSelectedBlockClientId(),

    // Theme/Site Data
    siteUrl: wp.data.select('core').getSite()?.url,
    currentUser: wp.data.select('core').getCurrentUser(),

    // Custom Context (if available)
    acfFields: window.acf?.data || {},
    customTaxonomies: window.customTaxData || {},
    themeOptions: window.themeSettings || {}
};
```

#### 1.2 Smart Context Detection
```javascript
class ContextAnalyzer {
    static analyzeBlocksForContext(blocks) {
        const requiredContext = {
            needsPost: false,
            needsUser: false,
            needsMeta: false,
            needsCustomFields: false,
            needsTaxonomies: false,
            customVariables: []
        };

        const analyzeContent = (content) => {
            if (!content) return;

            // Detect post context usage
            if (content.match(/\{\{\s*post\./)) {
                requiredContext.needsPost = true;
            }

            // Detect user context usage
            if (content.match(/\{\{\s*user\./)) {
                requiredContext.needsUser = true;
            }

            // Detect meta field usage
            if (content.match(/post\.meta\(/)) {
                requiredContext.needsMeta = true;
            }

            // Detect custom field usage
            if (content.match(/post\.get_field\(/)) {
                requiredContext.needsCustomFields = true;
            }

            // Extract custom variables from set tags
            const setMatches = content.match(/<set\s+variable="([^"]+)"/g);
            if (setMatches) {
                setMatches.forEach(match => {
                    const variable = match.match(/variable="([^"]+)"/)[1];
                    requiredContext.customVariables.push(variable);
                });
            }
        };

        // Recursively analyze all blocks
        const processBlocks = (blockList) => {
            blockList.forEach(block => {
                if (block.name === 'universal/element') {
                    analyzeContent(block.attributes?.content);
                    analyzeContent(block.attributes?.globalAttrs?.source);
                    analyzeContent(block.attributes?.globalAttrs?.value);
                }

                if (block.innerBlocks?.length) {
                    processBlocks(block.innerBlocks);
                }
            });
        };

        processBlocks(blocks);
        return requiredContext;
    }
}
```

### 2. Sidebar Preview Controls

#### 2.1 Live Preview Panel
```javascript
// Located in block sidebar settings
function DynamicPreviewPanel() {
    const [isLivePreview, setIsLivePreview] = useState(false);
    const [previewContext, setPreviewContext] = useState({});
    const [isLoading, setIsLoading] = useState(false);

    const currentPost = useSelect(select => ({
        id: select('core/editor').getCurrentPostId(),
        type: select('core/editor').getCurrentPostType(),
        status: select('core/editor').getEditedPostAttribute('status')
    }));

    const contextInfo = useMemo(() => {
        const allBlocks = wp.data.select('core/block-editor').getBlocks();
        return ContextAnalyzer.analyzeBlocksForContext(allBlocks);
    }, []);

    return (
        <PanelBody
            title="Dynamic Preview"
            icon="visibility"
            initialOpen={false}
        >
            <PanelRow>
                <ToggleControl
                    label="Live Preview with Real Data"
                    checked={isLivePreview}
                    onChange={setIsLivePreview}
                    help={
                        isLivePreview ?
                        "Showing preview with real post/user data" :
                        "Showing static preview only"
                    }
                />
            </PanelRow>

            {isLivePreview && (
                <>
                    <PanelRow>
                        <div className="context-info">
                            <h4>Context Required:</h4>
                            <ul>
                                {contextInfo.needsPost && <li>✓ Post Data</li>}
                                {contextInfo.needsUser && <li>✓ User Data</li>}
                                {contextInfo.needsMeta && <li>✓ Meta Fields</li>}
                                {contextInfo.needsCustomFields && <li>✓ Custom Fields</li>}
                                {contextInfo.customVariables.length > 0 && (
                                    <li>✓ Variables: {contextInfo.customVariables.join(', ')}</li>
                                )}
                            </ul>
                        </div>
                    </PanelRow>

                    <PanelRow>
                        <div className="preview-status">
                            {isLoading ? (
                                <span><Spinner /> Processing preview...</span>
                            ) : (
                                <span>✓ Preview updated</span>
                            )}
                        </div>
                    </PanelRow>
                </>
            )}
        </PanelBody>
    );
}
```

#### 2.2 Context Debug Panel (Development Mode)
```javascript
function ContextDebugPanel() {
    const [showDebug, setShowDebug] = useState(false);
    const [availableContext, setAvailableContext] = useState({});

    useEffect(() => {
        if (showDebug) {
            // Collect all available context for debugging
            setAvailableContext({
                windowData: {
                    pageData: window.pageData,
                    wpUserData: window.wpUserData,
                    wpApiSettings: window.wpApiSettings
                },
                editorData: {
                    postId: wp.data.select('core/editor').getCurrentPostId(),
                    postType: wp.data.select('core/editor').getCurrentPostType(),
                    postMeta: wp.data.select('core/editor').getEditedPostAttribute('meta')
                },
                timberData: {
                    // Will be populated from preview response
                }
            });
        }
    }, [showDebug]);

    // Only show in development/debug mode
    if (!window.wpDebug) return null;

    return (
        <PanelBody
            title="Context Debug"
            icon="admin-tools"
            initialOpen={false}
        >
            <PanelRow>
                <ToggleControl
                    label="Show Available Context"
                    checked={showDebug}
                    onChange={setShowDebug}
                />
            </PanelRow>

            {showDebug && (
                <PanelRow>
                    <details>
                        <summary>Available Context Data</summary>
                        <pre style={{fontSize: '11px', overflow: 'auto', maxHeight: '200px'}}>
                            {JSON.stringify(availableContext, null, 2)}
                        </pre>
                    </details>
                </PanelRow>
            )}
        </PanelBody>
    );
}
```

### 3. API Endpoint Implementation

#### 3.1 Preview Endpoint
```php
class Universal_Block_Preview_API {

    public function register_routes() {
        register_rest_route('universal-block/v1', '/preview', [
            'methods' => 'POST',
            'callback' => [$this, 'preview_endpoint'],
            'permission_callback' => [$this, 'preview_permissions'],
            'args' => [
                'allBlocks' => [
                    'required' => true,
                    'type' => 'array'
                ],
                'targetBlockId' => [
                    'required' => true,
                    'type' => 'string'
                ],
                'pageContext' => [
                    'required' => true,
                    'type' => 'object'
                ]
            ]
        ]);
    }

    public function preview_endpoint($request) {
        $all_blocks = $request->get_param('allBlocks');
        $target_block_id = $request->get_param('targetBlockId');
        $page_context = $request->get_param('pageContext');

        try {
            // Recreate the exact frontend environment
            $this->setup_preview_context($page_context);

            // Process all blocks together (like frontend)
            $full_content = $this->render_all_blocks($all_blocks);

            // Apply dynamic tag processing (same as frontend)
            $processed_content = $this->process_dynamic_content($full_content);

            // Extract the specific block's preview
            $block_preview = $this->extract_block_preview(
                $processed_content,
                $target_block_id,
                $all_blocks
            );

            return [
                'success' => true,
                'html' => $block_preview,
                'context_used' => $this->get_context_summary(),
                'processing_time' => $this->get_processing_time()
            ];

        } catch (Exception $e) {
            return new WP_Error(
                'preview_error',
                'Preview generation failed: ' . $e->getMessage(),
                ['status' => 500]
            );
        }
    }

    private function setup_preview_context($page_context) {
        // Set up post context
        if (!empty($page_context['postId'])) {
            $post = get_post($page_context['postId']);
            if ($post) {
                $GLOBALS['post'] = $post;
                setup_postdata($post);
            }
        }

        // Set up user context
        if (!empty($page_context['userId'])) {
            wp_set_current_user($page_context['userId']);
        }

        // Set up meta fields
        if (!empty($page_context['postMeta'])) {
            foreach ($page_context['postMeta'] as $key => $value) {
                // Temporarily override meta for preview
                add_filter('get_post_metadata', function($value, $object_id, $meta_key) use ($page_context) {
                    if ($object_id == $page_context['postId'] && isset($page_context['postMeta'][$meta_key])) {
                        return [$page_context['postMeta'][$meta_key]];
                    }
                    return $value;
                }, 10, 3);
            }
        }

        // Set up global variables
        if (!empty($page_context['pageData'])) {
            // Make page data available to Timber context
            add_filter('timber/context', function($context) use ($page_context) {
                $context['page_data'] = $page_context['pageData'];
                return $context;
            });
        }
    }
}
```

### 4. Performance Optimizations

#### 4.1 Smart Caching Strategy
```javascript
class PreviewCache {
    constructor() {
        this.cache = new Map();
        this.contextHashes = new Map();
    }

    generateCacheKey(blocks, context) {
        const blockHash = this.hashBlocks(blocks);
        const contextHash = this.hashContext(context);
        return `${blockHash}-${contextHash}`;
    }

    hashBlocks(blocks) {
        // Create hash based on block content and structure
        const relevantData = blocks
            .filter(block => block.name === 'universal/element')
            .map(block => ({
                content: block.attributes?.content,
                globalAttrs: block.attributes?.globalAttrs,
                clientId: block.clientId
            }));

        return this.simpleHash(JSON.stringify(relevantData));
    }

    hashContext(context) {
        // Only hash context data that affects output
        const relevantContext = {
            postId: context.postId,
            postType: context.postType,
            // Only include data that might be used in templates
            pageData: context.pageData,
            meta: context.postMeta
        };

        return this.simpleHash(JSON.stringify(relevantContext));
    }

    async getOrFetch(cacheKey, fetchFunction) {
        if (this.cache.has(cacheKey)) {
            return this.cache.get(cacheKey);
        }

        const result = await fetchFunction();
        this.cache.set(cacheKey, result);

        // Clean old entries (keep last 10)
        if (this.cache.size > 10) {
            const firstKey = this.cache.keys().next().value;
            this.cache.delete(firstKey);
        }

        return result;
    }
}
```

#### 4.2 Debounced Updates
```javascript
function useDebouncedPreview(blocks, context, isEnabled) {
    const [preview, setPreview] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const debouncedUpdate = useCallback(
        debounce(async (blocksToProcess, contextToUse) => {
            if (!isEnabled) return;

            setIsLoading(true);
            try {
                const cacheKey = previewCache.generateCacheKey(blocksToProcess, contextToUse);
                const result = await previewCache.getOrFetch(cacheKey, () =>
                    wp.apiFetch({
                        path: '/universal-block/v1/preview',
                        method: 'POST',
                        data: {
                            allBlocks: blocksToProcess,
                            targetBlockId: currentBlockId,
                            pageContext: contextToUse
                        }
                    })
                );

                setPreview(result.html);
            } catch (error) {
                console.error('Preview error:', error);
                setPreview('<!-- Preview Error: ' + error.message + ' -->');
            }
            setIsLoading(false);
        }, 500), // 500ms debounce
        [isEnabled]
    );

    useEffect(() => {
        debouncedUpdate(blocks, context);
    }, [blocks, context, debouncedUpdate]);

    return { preview, isLoading };
}
```

### 5. User Experience Flow

#### 5.1 Initial State
- Live preview **disabled** by default
- Static block preview shown
- Toggle available in sidebar for blocks with dynamic content

#### 5.2 Enabling Live Preview
1. User toggles "Live Preview with Real Data"
2. System analyzes blocks for required context
3. Context requirements shown in sidebar
4. API called with full context
5. Real preview displayed with loading indicator

#### 5.3 Editing with Live Preview
1. User edits block content
2. Changes debounced (500ms delay)
3. Cache checked for existing result
4. API called only if content/context changed
5. Preview updated seamlessly

#### 5.4 Error Handling
1. API errors shown in sidebar with helpful messages
2. Fallback to static preview on failure
3. Context issues highlighted (missing data, etc.)
4. Debug information available in development mode

### 6. Integration Points

#### 6.1 Block Editor Integration
```javascript
// Add to existing block edit component
function UniversalElementEdit({ attributes, setAttributes, clientId }) {
    const [isLivePreview, setIsLivePreview] = useState(false);
    const { preview, isLoading } = useDebouncedPreview(
        allBlocks,
        pageContext,
        isLivePreview
    );

    return (
        <>
            <InspectorControls>
                <DynamicPreviewPanel
                    isEnabled={isLivePreview}
                    onToggle={setIsLivePreview}
                />
                <ContextDebugPanel />
            </InspectorControls>

            <div className="universal-block-preview">
                {isLivePreview ? (
                    <div>
                        {isLoading && <div className="preview-loading">Updating preview...</div>}
                        <div dangerouslySetInnerHTML={{__html: preview}} />
                    </div>
                ) : (
                    <StaticBlockPreview attributes={attributes} />
                )}
            </div>
        </>
    );
}
```

#### 6.2 WordPress Admin Integration
```php
// Enqueue preview scripts only in block editor
function enqueue_preview_scripts($hook) {
    if ($hook === 'post.php' || $hook === 'post-new.php') {
        wp_enqueue_script(
            'universal-block-preview',
            plugin_dir_url(__FILE__) . 'js/preview.js',
            ['wp-blocks', 'wp-element', 'wp-data'],
            filemtime(plugin_dir_path(__FILE__) . 'js/preview.js')
        );

        // Pass current page context to script
        wp_localize_script('universal-block-preview', 'ubPreviewData', [
            'apiUrl' => rest_url('universal-block/v1/'),
            'nonce' => wp_create_nonce('wp_rest'),
            'pageData' => $this->get_current_page_data(),
            'debugMode' => defined('WP_DEBUG') && WP_DEBUG
        ]);
    }
}
```

### 7. Benefits of This Implementation

1. **100% Accuracy**: Uses exact same data and processing as frontend
2. **Performance Control**: Users choose when to use expensive live preview
3. **Context Awareness**: Leverages all available editor and page data
4. **Developer Friendly**: Debug panels and clear error messages
5. **Scalable**: Caching and debouncing handle large pages
6. **Familiar UX**: Follows WordPress admin patterns and conventions

This implementation provides the most accurate preview system possible while maintaining excellent performance through smart caching, debouncing, and user-controlled activation.