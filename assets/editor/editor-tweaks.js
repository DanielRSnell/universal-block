/**
 * Universal Block - Editor Tweaks JavaScript
 * Handles DOM manipulation and interactive elements for the Gutenberg editor
 */

(function() {
    'use strict';


    /**
     * Generate WordPress block markup from block data
     */
    function generateBlockMarkup(blocks) {
        function blockToMarkup(block, level = 0) {
            const { name, attributes, innerBlocks = [] } = block;
            const indent = '    '.repeat(level); // 4 spaces per level

            // Clean up attributes - remove empty values and format properly
            const cleanedAttributes = {};
            Object.keys(attributes).forEach(key => {
                const value = attributes[key];
                if (value !== null && value !== undefined && value !== '') {
                    // Skip empty objects and unnecessary false booleans
                    if (typeof value === 'object' && Object.keys(value).length === 0) {
                        return;
                    }
                    if (key === 'selfClosing' && value === false) {
                        return;
                    }
                    cleanedAttributes[key] = value;
                }
            });

            const attributesJson = Object.keys(cleanedAttributes).length > 0
                ? ' ' + JSON.stringify(cleanedAttributes)
                : '';

            let markup = '';

            if (innerBlocks.length > 0) {
                // Container block with inner blocks
                markup += `${indent}<!-- wp:${name}${attributesJson} -->\n`;

                // Add inner blocks
                innerBlocks.forEach(innerBlock => {
                    markup += blockToMarkup(innerBlock, level + 1);
                });

                markup += `${indent}<!-- /wp:${name} -->\n`;
            } else {
                // Blocks without inner content
                if (attributes.selfClosing || ['img', 'hr'].includes(attributes.tagName)) {
                    // True self-closing blocks (like images)
                    markup += `${indent}<!-- wp:${name}${attributesJson} /-->\n`;
                } else {
                    // Regular blocks use self-closing syntax when they have no inner blocks
                    markup += `${indent}<!-- wp:${name}${attributesJson} /-->\n`;
                }
            }

            return markup;
        }

        return blocks.map(block => blockToMarkup(block, 0)).join('\n').trim();
    }

    /**
     * Parse HTML content into universal blocks
     */
    function parseHtmlToBlocks(htmlContent) {
        const parser = new DOMParser();
        const doc = parser.parseFromString(htmlContent, 'text/html');
        const blocks = [];

        function processNode(node) {
            if (node.nodeType === Node.TEXT_NODE) {
                const text = node.textContent.trim();
                if (text) {
                    return {
                        name: 'universal-block/element',
                        attributes: {
                            elementType: 'text',
                            tagName: 'p',
                            content: text,
                            globalAttrs: {}
                        }
                    };
                }
                return null;
            }

            if (node.nodeType === Node.ELEMENT_NODE) {
                const tagName = node.tagName.toLowerCase();
                let elementType;
                const globalAttrs = {};
                let content = '';

                // Extract all attributes
                let className = '';
                Array.from(node.attributes).forEach(attr => {
                    if (attr.name === 'class') {
                        // Handle class separately as className at block level
                        className = attr.value;
                    } else {
                        // Other attributes go in globalAttrs
                        globalAttrs[attr.name] = attr.value;
                    }
                });

                // Determine element type based on tag
                switch (tagName) {
                    case 'h1':
                    case 'h2':
                    case 'h3':
                    case 'h4':
                    case 'h5':
                    case 'h6':
                        elementType = 'heading';
                        content = node.textContent;
                        break;
                    case 'a':
                        elementType = 'link';
                        content = node.textContent.trim().replace(/\s+/g, ' ');
                        break;
                    case 'img':
                        elementType = 'image';
                        break;
                    case 'hr':
                        elementType = 'rule';
                        break;
                    case 'svg':
                        elementType = 'svg';
                        // For SVGs, we want to capture the inner content without encoding
                        content = node.innerHTML;
                        break;
                    case 'div':
                    case 'section':
                    case 'article':
                    case 'header':
                    case 'footer':
                    case 'main':
                    case 'aside':
                    case 'nav':
                        elementType = 'container';
                        break;
                    case 'p':
                        elementType = 'text';
                        content = node.textContent.trim().replace(/\s+/g, ' ');
                        // Ensure tagName is preserved for paragraphs
                        break;
                    case 'span':
                        elementType = 'text';
                        content = node.textContent.trim().replace(/\s+/g, ' ');
                        break;
                    default:
                        elementType = 'text';
                        content = node.textContent.trim().replace(/\s+/g, ' ');
                }

                const block = {
                    name: 'universal-block/element',
                    attributes: {
                        elementType,
                        tagName,
                        globalAttrs,
                        selfClosing: ['img', 'hr', 'br', 'input'].includes(tagName)
                    }
                };

                // Add className if it exists
                if (className) {
                    block.attributes.className = className;
                }

                if (content) {
                    block.attributes.content = content;
                }

                // Handle containers with children
                if (elementType === 'container' && node.children.length > 0) {
                    const innerBlocks = [];
                    Array.from(node.children).forEach(child => {
                        const childBlock = processNode(child);
                        if (childBlock) {
                            innerBlocks.push(childBlock);
                        }
                    });
                    if (innerBlocks.length > 0) {
                        block.innerBlocks = innerBlocks;
                    }
                }

                // Handle non-container elements that might have mixed content (text + elements)
                if (elementType !== 'container' && elementType !== 'svg' && node.children.length > 0) {
                    // For mixed content elements like links with spans
                    const innerBlocks = [];
                    let hasDirectText = false;


                    // Check if there's direct text content (not just from child elements)
                    Array.from(node.childNodes).forEach(child => {
                        if (child.nodeType === Node.TEXT_NODE && child.textContent.trim()) {
                            hasDirectText = true;
                        } else if (child.nodeType === Node.ELEMENT_NODE) {
                            const childBlock = processNode(child);
                            if (childBlock) {
                                innerBlocks.push(childBlock);
                            }
                        }
                    });

                    if (innerBlocks.length > 0) {
                        block.innerBlocks = innerBlocks;
                        // Only remove content if there's no direct text, or extract just the direct text
                        if (!hasDirectText) {
                            delete block.attributes.content;
                        } else {
                            // Extract only the direct text nodes, not child element text
                            const directText = Array.from(node.childNodes)
                                .filter(child => child.nodeType === Node.TEXT_NODE)
                                .map(child => child.textContent)
                                .join('')
                                .trim()
                                .replace(/\s+/g, ' ');
                            if (directText) {
                                block.attributes.content = directText;
                            }
                        }
                    }
                }

                return block;
            }

            return null;
        }

        // Process all children of body (or the whole document if no body)
        const container = doc.body || doc.documentElement;
        Array.from(container.children).forEach(child => {
            const block = processNode(child);
            if (block) {
                blocks.push(block);
            }
        });

        return blocks;
    }

    /**
     * Insert block markup into the Gutenberg editor
     */
    function insertBlockMarkupIntoEditor(blockMarkup) {
        if (!wp || !wp.data || !wp.blocks) {
            console.error('WordPress block editor not available');
            return;
        }

        const { dispatch, select } = wp.data;

        try {
            // Parse the block markup using WordPress's built-in parser
            const blocks = wp.blocks.parse(blockMarkup);

            // Get current block index for insertion
            const currentBlockIndex = select('core/block-editor').getSelectedBlockIndex();
            const insertIndex = currentBlockIndex >= 0 ? currentBlockIndex + 1 : 0;

            // Insert blocks into editor
            dispatch('core/block-editor').insertBlocks(blocks, insertIndex);

            console.log('Successfully inserted block markup:', blocks);

        } catch (error) {
            console.error('Error inserting block markup into editor:', error);
            throw error;
        }
    }

    /**
     * Insert blocks into the Gutenberg editor (legacy function - kept for compatibility)
     */
    function insertBlocksIntoEditor(blocks) {
        if (!wp || !wp.data || !wp.blocks) {
            console.error('WordPress block editor not available');
            return;
        }

        const { dispatch, select } = wp.data;
        const { createBlocksFromInnerBlocksTemplate } = wp.blocks;

        try {
            // Convert our block data to actual block instances
            const blockInstances = blocks.map(blockData => {
                return wp.blocks.createBlock(
                    blockData.name,
                    blockData.attributes,
                    blockData.innerBlocks ? blockData.innerBlocks.map(innerBlock =>
                        wp.blocks.createBlock(innerBlock.name, innerBlock.attributes)
                    ) : []
                );
            });

            // Get current block index for insertion
            const currentBlockIndex = select('core/block-editor').getSelectedBlockIndex();
            const insertIndex = currentBlockIndex >= 0 ? currentBlockIndex + 1 : 0;

            // Insert blocks into editor
            dispatch('core/block-editor').insertBlocks(blockInstances, insertIndex);

            console.log('Successfully inserted blocks:', blockInstances);

        } catch (error) {
            console.error('Error inserting blocks into editor:', error);
            throw error;
        }
    }

    /**
     * Initialize when DOM is ready
     */
    function initEditorTweaks() {
        // Wait for Gutenberg to be ready
        if (typeof wp !== 'undefined' && wp.data && wp.data.select('core/editor')) {
            // Always expose parser functions globally for React component access
            window.parseHtmlToBlocks = parseHtmlToBlocks;
            window.generateBlockMarkup = generateBlockMarkup;
            window.insertBlockMarkupIntoEditor = insertBlockMarkupIntoEditor;

            // Create global function for React compatibility
            window.parseHTMLToBlocks = function(htmlContent) {
                const blocks = parseHtmlToBlocks(htmlContent);
                return generateBlockMarkup(blocks);
            };

            // Mark that legacy functions are ready
            window.universalBlockLegacyReady = true;

            console.log('🔧 Universal Block parser functions ready');
        } else {
            // Retry after a short delay
            setTimeout(initEditorTweaks, 100);
        }
    }

    // Initialize when DOM is loaded
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initEditorTweaks);
    } else {
        initEditorTweaks();
    }

    // Also try to initialize when wp is available
    if (typeof wp !== 'undefined' && wp.domReady) {
        wp.domReady(initEditorTweaks);
    }
})();