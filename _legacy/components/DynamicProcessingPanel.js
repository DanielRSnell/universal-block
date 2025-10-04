import React, { useState, useEffect, useCallback } from 'react';
import { __ } from '@wordpress/i18n';
import {
    PanelBody,
    ToggleControl,
    Notice,
    Spinner,
    Button
} from '@wordpress/components';
import { useSelect } from '@wordpress/data';
import apiFetch from '@wordpress/api-fetch';

const DynamicProcessingPanel = ({ attributes, setAttributes, clientId, onProcessedContent }) => {
    const { isDynamic } = attributes;
    const [isLoading, setIsLoading] = useState(false);
    const [previewContent, setPreviewContent] = useState('');
    const [error, setError] = useState(null);
    const [lastProcessed, setLastProcessed] = useState(null);

    // Get current block and its tree
    const { blockData, pageContext } = useSelect((select) => {
        const { getBlock } = select('core/block-editor');
        const { getCurrentPost } = select('core/editor');
        const { getCurrentUser } = select('core');

        const currentPost = getCurrentPost();
        const currentUser = getCurrentUser();

        return {
            blockData: getBlock(clientId),
            pageContext: {
                postId: currentPost?.id || 0,
                postType: currentPost?.type || 'post',
                currentUser: currentUser || null,
                pageData: window.pageData || {},
                wpUserData: window.wpUserData || {}
            }
        };
    }, [clientId]);

    // Check if block has dynamic content
    const hasDynamicContent = () => {
        if (!blockData) return false;

        const checkBlockForDynamic = (block) => {
            // Check if content has dynamic tags
            const content = block.attributes?.content || '';
            if (content.match(/<(set|if|loop)\s+/) || content.match(/\{\{.*?\}\}|\{%.*?%\}/)) {
                return true;
            }

            // Check attributes for dynamic content
            const attrs = block.attributes?.globalAttrs || {};
            if (Object.values(attrs).some(value =>
                typeof value === 'string' && (
                    value.match(/<(set|if|loop)\s+/) ||
                    value.match(/\{\{.*?\}\}|\{%.*?%\}/)
                )
            )) {
                return true;
            }

            // Check inner blocks recursively
            if (block.innerBlocks?.length) {
                return block.innerBlocks.some(checkBlockForDynamic);
            }

            return false;
        };

        return checkBlockForDynamic(blockData);
    };

    const generatePreview = useCallback(async () => {
        if (!blockData) return;

        setIsLoading(true);
        setError(null);

        try {
            // Serialize the block and its inner blocks
            const { serialize } = wp.blocks;
            const serializedContent = serialize([blockData]);

            const response = await apiFetch({
                path: '/universal-block/v1/dynamic-preview',
                method: 'POST',
                data: {
                    blockContent: serializedContent,
                    blockId: clientId,
                    context: {
                        ...pageContext,
                        preview_mode: true,
                        dynamic_block: true
                    }
                }
            });

            if (response.success) {
                setPreviewContent(response.content || '');
                setLastProcessed(new Date().toLocaleTimeString());

                // Debug logging
                console.log('Dynamic Preview Debug:', {
                    has_set_tags: response.debug_info?.has_set_tags,
                    has_twig_vars: response.debug_info?.has_twig_vars,
                    has_twig_set: response.debug_info?.has_twig_set,
                    timber_context_keys: response.debug_info?.timber_context_keys,
                    raw_html: response.raw_html?.substring(0, 500) + '...',
                    processed_content: response.content?.substring(0, 500) + '...'
                });

                // Pass processed content to parent component
                if (onProcessedContent) {
                    onProcessedContent(response.content || '');
                }
            } else {
                setError(response.message || __('Preview generation failed', 'universal-block'));
            }
        } catch (err) {
            setError(err.message || __('Failed to generate preview', 'universal-block'));
            console.error('Dynamic preview error:', err);
        } finally {
            setIsLoading(false);
        }
    }, [blockData, pageContext, clientId]);

    // Generate preview when dynamic processing is enabled
    useEffect(() => {
        if (isDynamic && blockData) {
            generatePreview();
        } else {
            setPreviewContent('');
            setError(null);
            // Clear processed content in parent when disabled
            if (onProcessedContent) {
                onProcessedContent(null);
            }
        }
    }, [isDynamic, blockData, generatePreview, onProcessedContent]);

    const dynamicContentDetected = hasDynamicContent();

    return (
        <PanelBody
            title={__('Dynamic Processing', 'universal-block')}
            icon="controls-repeat"
            initialOpen={false}
        >
            <ToggleControl
                label={__('Enable Dynamic Processing', 'universal-block')}
                help={isDynamic
                    ? __('This block will be processed with Timber context and dynamic tags', 'universal-block')
                    : __('Enable to process this block and all inner blocks with full Timber context', 'universal-block')
                }
                checked={isDynamic}
                onChange={(value) => setAttributes({ isDynamic: value })}
            />

            {!isDynamic && (
                <Notice status="info" isDismissible={false}>
                    {dynamicContentDetected
                        ? __('Dynamic content detected! Enable processing to see live preview with real data.', 'universal-block')
                        : __('Enable dynamic processing to use this block as a container with full Timber context. Perfect for using <set>, <if>, <loop> tags and Twig expressions.', 'universal-block')
                    }
                </Notice>
            )}

            {isDynamic && (
                <>
                    <div style={{
                        padding: '12px',
                        background: '#f0f6fc',
                        border: '1px solid #0073aa',
                        borderRadius: '4px',
                        marginBottom: '16px'
                    }}>
                        <strong>{__('Dynamic Block', 'universal-block')}</strong>
                        <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#666' }}>
                            {__('This block and all its inner blocks will be processed together with full Timber context.', 'universal-block')}
                        </p>
                    </div>

                    {error && (
                        <Notice status="error" isDismissible={false}>
                            <strong>{__('Preview Error:', 'universal-block')}</strong> {error}
                        </Notice>
                    )}

                    {isLoading && (
                        <div style={{ textAlign: 'center', padding: '16px' }}>
                            <Spinner />
                            <p style={{ margin: '8px 0 0', fontSize: '13px' }}>
                                {__('Processing with Timber context...', 'universal-block')}
                            </p>
                        </div>
                    )}

                    {previewContent && !isLoading && (
                        <details style={{ marginTop: '16px' }}>
                            <summary style={{
                                cursor: 'pointer',
                                fontWeight: '500',
                                marginBottom: '8px'
                            }}>
                                {__('Show Processed Output', 'universal-block')}
                                {lastProcessed && (
                                    <span style={{
                                        fontSize: '11px',
                                        color: '#666',
                                        fontWeight: 'normal',
                                        marginLeft: '8px'
                                    }}>
                                        ({__('Updated:', 'universal-block')} {lastProcessed})
                                    </span>
                                )}
                            </summary>
                            <div
                                style={{
                                    background: '#f8f9fa',
                                    border: '1px solid #e0e0e0',
                                    borderRadius: '4px',
                                    padding: '12px',
                                    maxHeight: '300px',
                                    overflow: 'auto',
                                    fontSize: '12px',
                                    fontFamily: 'Monaco, Menlo, Ubuntu Mono, monospace'
                                }}
                                dangerouslySetInnerHTML={{ __html: previewContent }}
                            />
                        </details>
                    )}

                    <div style={{ marginTop: '16px' }}>
                        <Button
                            variant="secondary"
                            size="small"
                            onClick={generatePreview}
                            disabled={isLoading}
                            style={{ width: '100%' }}
                        >
                            {isLoading
                                ? __('Processing...', 'universal-block')
                                : __('Refresh Preview', 'universal-block')
                            }
                        </Button>
                    </div>
                </>
            )}
        </PanelBody>
    );
};

export default DynamicProcessingPanel;