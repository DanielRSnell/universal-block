/**
 * Context Analyzer for detecting what data dynamic blocks need
 */

export class ContextAnalyzer {
    /**
     * Analyze blocks to determine required context
     * @param {Array} blocks - Array of block objects
     * @returns {Object} Context requirements
     */
    static analyzeBlocksForContext(blocks) {
        const requiredContext = {
            needsPost: false,
            needsUser: false,
            needsMeta: false,
            needsCustomFields: false,
            needsTaxonomies: false,
            customVariables: [],
            twig: {
                hasVariables: false,
                hasFilters: false,
                hasLoops: false,
                hasConditionals: false
            }
        };

        const processBlocks = (blockList) => {
            blockList.forEach(block => {
                if (block.name === 'universal/element') {
                    this.analyzeContent(block.attributes?.content, requiredContext);
                    this.analyzeAttributes(block.attributes?.globalAttrs, requiredContext);
                }

                if (block.innerBlocks?.length) {
                    processBlocks(block.innerBlocks);
                }
            });
        };

        processBlocks(blocks);
        return requiredContext;
    }

    /**
     * Analyze content string for context requirements
     * @param {string} content - Content to analyze
     * @param {Object} context - Context object to update
     */
    static analyzeContent(content, context) {
        if (!content) return;

        // Detect post context usage
        if (content.match(/\{\{\s*post\./)) {
            context.needsPost = true;
        }

        // Detect user context usage
        if (content.match(/\{\{\s*user\./)) {
            context.needsUser = true;
        }

        // Detect meta field usage
        if (content.match(/post\.meta\(/)) {
            context.needsMeta = true;
        }

        // Detect ACF/custom field usage
        if (content.match(/post\.get_field\(|post\.field\(/)) {
            context.needsCustomFields = true;
        }

        // Detect taxonomy usage
        if (content.match(/post\.terms\(|post\.categories|post\.tags/)) {
            context.needsTaxonomies = true;
        }

        // Extract custom variables from set tags
        const setMatches = content.match(/<set\s+variable="([^"]+)"/g);
        if (setMatches) {
            setMatches.forEach(match => {
                const variable = match.match(/variable="([^"]+)"/)[1];
                if (!context.customVariables.includes(variable)) {
                    context.customVariables.push(variable);
                }
            });
        }

        // Detect Twig features
        this.analyzeTwigFeatures(content, context.twig);
    }

    /**
     * Analyze block attributes for context requirements
     * @param {Object} attributes - Block attributes
     * @param {Object} context - Context object to update
     */
    static analyzeAttributes(attributes, context) {
        if (!attributes) return;

        // Analyze each attribute value
        Object.values(attributes).forEach(value => {
            if (typeof value === 'string') {
                this.analyzeContent(value, context);
            }
        });
    }

    /**
     * Analyze Twig syntax features in content
     * @param {string} content - Content to analyze
     * @param {Object} twigContext - Twig context to update
     */
    static analyzeTwigFeatures(content, twigContext) {
        // Variables: {{ variable }}
        if (content.match(/\{\{\s*[^}]+\s*\}\}/)) {
            twigContext.hasVariables = true;
        }

        // Filters: {{ variable|filter }}
        if (content.match(/\{\{\s*[^}]*\|[^}]*\}\}/)) {
            twigContext.hasFilters = true;
        }

        // Loops: {% for %} or <loop>
        if (content.match(/\{%\s*for\s+|<loop\s+/)) {
            twigContext.hasLoops = true;
        }

        // Conditionals: {% if %} or <if>
        if (content.match(/\{%\s*if\s+|<if\s+/)) {
            twigContext.hasConditionals = true;
        }
    }

    /**
     * Generate minimal context data based on requirements
     * @param {Object} requirements - Context requirements from analyzeBlocksForContext
     * @param {Object} editorData - Available editor data
     * @returns {Object} Minimal context data
     */
    static generateMinimalContext(requirements, editorData) {
        const context = {};

        if (requirements.needsPost && editorData.postId) {
            context.postId = editorData.postId;
            context.postType = editorData.postType;
        }

        if (requirements.needsMeta && editorData.postMeta) {
            context.postMeta = editorData.postMeta;
        }

        if (requirements.needsUser && editorData.currentUser) {
            context.userId = editorData.currentUser.id;
        }

        if (editorData.pageData) {
            context.pageData = editorData.pageData;
        }

        if (editorData.wpUserData) {
            context.wpUserData = editorData.wpUserData;
        }

        return context;
    }

    /**
     * Check if blocks contain dynamic content that needs preview
     * @param {Array} blocks - Array of block objects
     * @returns {boolean} True if dynamic content detected
     */
    static hasDynamicContent(blocks) {
        const processBlocks = (blockList) => {
            for (const block of blockList) {
                if (block.name === 'universal/element') {
                    const content = block.attributes?.content || '';
                    const hasAttributes = block.attributes?.globalAttrs;

                    // Check for dynamic tags
                    if (content.match(/<(set|if|loop)\s+/) ||
                        Object.values(hasAttributes || {}).some(val =>
                            typeof val === 'string' && val.match(/<(set|if|loop)\s+/)
                        )) {
                        return true;
                    }

                    // Check for Twig syntax
                    if (content.match(/\{\{.*?\}\}|\{%.*?%\}/)) {
                        return true;
                    }
                }

                if (block.innerBlocks?.length && processBlocks(block.innerBlocks)) {
                    return true;
                }
            }
            return false;
        };

        return processBlocks(blocks);
    }

    /**
     * Get user-friendly context description
     * @param {Object} requirements - Context requirements
     * @returns {Array} Array of readable context descriptions
     */
    static getContextDescription(requirements) {
        const descriptions = [];

        if (requirements.needsPost) {
            descriptions.push('Post data (title, content, etc.)');
        }

        if (requirements.needsUser) {
            descriptions.push('User information');
        }

        if (requirements.needsMeta) {
            descriptions.push('Post meta fields');
        }

        if (requirements.needsCustomFields) {
            descriptions.push('Custom fields (ACF)');
        }

        if (requirements.needsTaxonomies) {
            descriptions.push('Categories and tags');
        }

        if (requirements.customVariables.length > 0) {
            descriptions.push(`Variables: ${requirements.customVariables.join(', ')}`);
        }

        const twigFeatures = [];
        if (requirements.twig.hasLoops) twigFeatures.push('loops');
        if (requirements.twig.hasConditionals) twigFeatures.push('conditionals');
        if (requirements.twig.hasFilters) twigFeatures.push('filters');

        if (twigFeatures.length > 0) {
            descriptions.push(`Twig features: ${twigFeatures.join(', ')}`);
        }

        return descriptions.length > 0 ? descriptions : ['No dynamic content detected'];
    }
}

export default ContextAnalyzer;