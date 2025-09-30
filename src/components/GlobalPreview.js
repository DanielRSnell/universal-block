import { useState, useEffect } from '@wordpress/element';
import { ToggleControl, Panel, PanelBody, Spinner } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { useSelect } from '@wordpress/data';
import apiFetch from '@wordpress/api-fetch';

const GlobalPreview = () => {
    const [isPreviewEnabled, setIsPreviewEnabled] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [previewContent, setPreviewContent] = useState('');
    const [error, setError] = useState(null);

    // Get all blocks from the editor
    const { blocks, pageData } = useSelect((select) => {
        const { getBlocks } = select('core/block-editor');
        const { getCurrentPost } = select('core/editor');

        return {
            blocks: getBlocks(),
            pageData: {
                postId: getCurrentPost()?.id || 0,
                postType: getCurrentPost()?.type || 'post'
            }
        };
    }, []);

    // Generate preview when toggle is enabled
    useEffect(() => {
        if (isPreviewEnabled && blocks.length > 0) {
            generatePreview();
        } else {
            setPreviewContent('');
        }
    }, [isPreviewEnabled, blocks]);

    const generatePreview = async () => {
        setIsLoading(true);
        setError(null);

        try {
            // Serialize all blocks to HTML
            const { serialize } = wp.blocks;
            const serializedContent = serialize(blocks);

            const response = await apiFetch({
                path: '/universal-block/v1/preview',
                method: 'POST',
                data: {
                    content: serializedContent,
                    context: {
                        ...pageData,
                        // Add any global context data needed
                        preview_mode: true
                    }
                }
            });

            setPreviewContent(response.content || '');
        } catch (err) {
            setError(err.message || __('Failed to generate preview', 'universal-block'));
            console.error('Preview generation error:', err);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="global-preview-container">
            <Panel>
                <PanelBody
                    title={__('Global Dynamic Preview', 'universal-block')}
                    initialOpen={true}
                >
                    <ToggleControl
                        label={__('Enable Preview Mode', 'universal-block')}
                        help={__('Process all blocks with dynamic tags and show compiled output', 'universal-block')}
                        checked={isPreviewEnabled}
                        onChange={setIsPreviewEnabled}
                    />

                    {isLoading && (
                        <div className="preview-loading">
                            <Spinner />
                            <span>{__('Generating preview...', 'universal-block')}</span>
                        </div>
                    )}

                    {error && (
                        <div className="preview-error">
                            <p style={{ color: '#d63638' }}>
                                {__('Error:', 'universal-block')} {error}
                            </p>
                        </div>
                    )}

                    {isPreviewEnabled && previewContent && !isLoading && (
                        <div className="preview-content">
                            <h4>{__('Compiled Output:', 'universal-block')}</h4>
                            <div
                                className="preview-html"
                                style={{
                                    background: '#f8f9fa',
                                    border: '1px solid #e0e0e0',
                                    borderRadius: '4px',
                                    padding: '12px',
                                    maxHeight: '400px',
                                    overflow: 'auto',
                                    fontSize: '12px',
                                    fontFamily: 'Monaco, Menlo, Ubuntu Mono, monospace'
                                }}
                                dangerouslySetInnerHTML={{ __html: previewContent }}
                            />
                        </div>
                    )}
                </PanelBody>
            </Panel>
        </div>
    );
};

export default GlobalPreview;