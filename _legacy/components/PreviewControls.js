/**
 * Preview Controls for Dynamic Tags
 */

import { useState, useEffect, useMemo } from '@wordpress/element';
import {
    PanelBody,
    PanelRow,
    ToggleControl,
    Spinner,
    Notice
} from '@wordpress/components';
import { useSelect } from '@wordpress/data';
import { __ } from '@wordpress/i18n';
import { ContextAnalyzer } from '../utils/ContextAnalyzer';
import { PreviewManager } from '../utils/PreviewManager';

/**
 * Dynamic Preview Panel Component
 */
export function DynamicPreviewPanel({ blockId, isEnabled, onToggle, onPreviewUpdate }) {
    const [isLoading, setIsLoading] = useState(false);
    const [lastError, setLastError] = useState(null);
    const [previewStats, setPreviewStats] = useState(null);

    // Get current editor data
    const editorData = useSelect(select => {
        const postId = select('core/editor').getCurrentPostId();
        const postType = select('core/editor').getCurrentPostType();
        const postMeta = select('core/editor').getEditedPostAttribute('meta');
        const currentUser = select('core').getCurrentUser();

        return {
            postId,
            postType,
            postMeta,
            currentUser,
            allBlocks: select('core/block-editor').getBlocks(),
            pageData: window.pageData || {},
            wpUserData: window.wpUserData || {}
        };
    });

    // Analyze context requirements
    const contextInfo = useMemo(() => {
        if (!editorData.allBlocks) return null;
        return ContextAnalyzer.analyzeBlocksForContext(editorData.allBlocks);
    }, [editorData.allBlocks]);

    // Check if blocks have dynamic content
    const hasDynamicContent = useMemo(() => {
        if (!editorData.allBlocks) return false;
        return ContextAnalyzer.hasDynamicContent(editorData.allBlocks);
    }, [editorData.allBlocks]);

    // Handle preview updates
    useEffect(() => {
        if (isEnabled && hasDynamicContent && blockId) {
            updatePreview();
        }
    }, [isEnabled, editorData.allBlocks, blockId]);

    const updatePreview = async () => {
        if (!isEnabled || !blockId) return;

        setIsLoading(true);
        setLastError(null);

        try {
            const context = ContextAnalyzer.generateMinimalContext(contextInfo, editorData);

            const result = await PreviewManager.getPreview({
                allBlocks: editorData.allBlocks,
                targetBlockId: blockId,
                pageContext: context
            });

            setPreviewStats({
                processingTime: result.processing_time,
                blocksProcessed: result.blocks_processed,
                contextUsed: result.context_used
            });

            if (onPreviewUpdate) {
                onPreviewUpdate(result.html);
            }

        } catch (error) {
            console.error('Preview error:', error);
            setLastError(error.message);

            if (onPreviewUpdate) {
                onPreviewUpdate(`<!-- Preview Error: ${error.message} -->`);
            }
        }

        setIsLoading(false);
    };

    // Don't show panel if no dynamic content
    if (!hasDynamicContent) {
        return null;
    }

    return (
        <PanelBody
            title={__('Dynamic Preview', 'universal-block')}
            icon="visibility"
            initialOpen={false}
        >
            <PanelRow>
                <ToggleControl
                    label={__('Live Preview with Real Data', 'universal-block')}
                    checked={isEnabled}
                    onChange={onToggle}
                    help={
                        isEnabled
                            ? __('Showing preview with real post/user data', 'universal-block')
                            : __('Showing static preview only', 'universal-block')
                    }
                />
            </PanelRow>

            {isEnabled && (
                <>
                    {lastError && (
                        <PanelRow>
                            <Notice status="error" isDismissible={false}>
                                {__('Preview Error:', 'universal-block')} {lastError}
                            </Notice>
                        </PanelRow>
                    )}

                    <PanelRow>
                        <div className="context-info">
                            <h4>{__('Context Required:', 'universal-block')}</h4>
                            <ul style={{margin: '8px 0', paddingLeft: '20px', fontSize: '13px'}}>
                                {ContextAnalyzer.getContextDescription(contextInfo).map((desc, index) => (
                                    <li key={index} style={{marginBottom: '4px'}}>
                                        ✓ {desc}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </PanelRow>

                    <PanelRow>
                        <div className="preview-status" style={{fontSize: '12px', color: '#666'}}>
                            {isLoading ? (
                                <span>
                                    <Spinner style={{float: 'none', marginRight: '6px'}} />
                                    {__('Processing preview...', 'universal-block')}
                                </span>
                            ) : previewStats ? (
                                <span>
                                    ✓ {__('Preview updated', 'universal-block')}
                                    ({previewStats.processingTime})
                                </span>
                            ) : (
                                <span>{__('Ready for preview', 'universal-block')}</span>
                            )}
                        </div>
                    </PanelRow>
                </>
            )}
        </PanelBody>
    );
}

/**
 * Context Debug Panel (Development Mode)
 */
export function ContextDebugPanel() {
    const [showDebug, setShowDebug] = useState(false);
    const [availableContext, setAvailableContext] = useState({});

    // Only show in development/debug mode
    if (!window.wpDebug && !window.ubPreviewData?.debugMode) {
        return null;
    }

    const editorData = useSelect(select => ({
        postId: select('core/editor').getCurrentPostId(),
        postType: select('core/editor').getCurrentPostType(),
        postMeta: select('core/editor').getEditedPostAttribute('meta'),
        currentUser: select('core').getCurrentUser(),
        allBlocks: select('core/block-editor').getBlocks()
    }));

    useEffect(() => {
        if (showDebug) {
            setAvailableContext({
                windowData: {
                    pageData: window.pageData || null,
                    wpUserData: window.wpUserData || null,
                    wpApiSettings: window.wpApiSettings || null
                },
                editorData: {
                    postId: editorData.postId,
                    postType: editorData.postType,
                    postMeta: editorData.postMeta,
                    currentUser: editorData.currentUser
                },
                blockAnalysis: editorData.allBlocks ?
                    ContextAnalyzer.analyzeBlocksForContext(editorData.allBlocks) : null
            });
        }
    }, [showDebug, editorData]);

    return (
        <PanelBody
            title={__('Context Debug', 'universal-block')}
            icon="admin-tools"
            initialOpen={false}
        >
            <PanelRow>
                <ToggleControl
                    label={__('Show Available Context', 'universal-block')}
                    checked={showDebug}
                    onChange={setShowDebug}
                    help={__('Debug mode: View all available context data', 'universal-block')}
                />
            </PanelRow>

            {showDebug && (
                <PanelRow>
                    <details style={{width: '100%'}}>
                        <summary style={{cursor: 'pointer', marginBottom: '8px'}}>
                            {__('Available Context Data', 'universal-block')}
                        </summary>
                        <pre style={{
                            fontSize: '11px',
                            overflow: 'auto',
                            maxHeight: '200px',
                            background: '#f6f7f7',
                            padding: '12px',
                            border: '1px solid #ddd',
                            borderRadius: '4px'
                        }}>
                            {JSON.stringify(availableContext, null, 2)}
                        </pre>
                    </details>
                </PanelRow>
            )}
        </PanelBody>
    );
}

/**
 * Performance Stats Panel
 */
export function PreviewPerformancePanel() {
    const [stats, setStats] = useState(null);

    useEffect(() => {
        // Listen for preview performance updates
        const handleStatsUpdate = (event) => {
            if (event.detail?.previewStats) {
                setStats(event.detail.previewStats);
            }
        };

        window.addEventListener('ubPreviewStats', handleStatsUpdate);
        return () => window.removeEventListener('ubPreviewStats', handleStatsUpdate);
    }, []);

    if (!stats || !window.ubPreviewData?.debugMode) {
        return null;
    }

    return (
        <PanelBody
            title={__('Preview Performance', 'universal-block')}
            icon="performance"
            initialOpen={false}
        >
            <PanelRow>
                <div style={{fontSize: '12px', width: '100%'}}>
                    <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '4px'}}>
                        <span>{__('Processing Time:', 'universal-block')}</span>
                        <strong>{stats.processingTime}</strong>
                    </div>
                    <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '4px'}}>
                        <span>{__('Blocks Processed:', 'universal-block')}</span>
                        <strong>{stats.blocksProcessed}</strong>
                    </div>
                    <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '4px'}}>
                        <span>{__('Cache Hits:', 'universal-block')}</span>
                        <strong>{stats.cacheHits || 0}</strong>
                    </div>
                    <div style={{display: 'flex', justifyContent: 'space-between'}}>
                        <span>{__('API Calls:', 'universal-block')}</span>
                        <strong>{stats.apiCalls || 0}</strong>
                    </div>
                </div>
            </PanelRow>
        </PanelBody>
    );
}

export default DynamicPreviewPanel;