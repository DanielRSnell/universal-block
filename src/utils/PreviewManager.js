/**
 * Preview Manager with caching and debouncing
 */

import { debounce } from '@wordpress/compose';

class PreviewCache {
    constructor() {
        this.cache = new Map();
        this.maxSize = 10;
        this.stats = {
            hits: 0,
            misses: 0,
            apiCalls: 0
        };
    }

    generateCacheKey(blocks, context) {
        const blockHash = this.hashBlocks(blocks);
        const contextHash = this.hashContext(context);
        return `${blockHash}-${contextHash}`;
    }

    hashBlocks(blocks) {
        // Create hash based on block content that affects dynamic output
        const relevantData = this.extractRelevantBlockData(blocks);
        return this.simpleHash(JSON.stringify(relevantData));
    }

    extractRelevantBlockData(blocks) {
        const extract = (blockList) => {
            return blockList
                .filter(block => block.name === 'universal/element')
                .map(block => ({
                    content: block.attributes?.content,
                    globalAttrs: block.attributes?.globalAttrs,
                    tagName: block.attributes?.tagName,
                    clientId: block.clientId
                }))
                .concat(
                    blockList
                        .filter(block => block.innerBlocks?.length)
                        .flatMap(block => extract(block.innerBlocks))
                );
        };

        return extract(blocks);
    }

    hashContext(context) {
        // Only hash context data that might affect output
        const relevantContext = {
            postId: context.postId,
            postType: context.postType,
            // Only include meta fields that might be used
            postMeta: context.postMeta ? Object.keys(context.postMeta).sort() : [],
            hasPageData: !!context.pageData,
            hasUserData: !!context.wpUserData
        };

        return this.simpleHash(JSON.stringify(relevantContext));
    }

    simpleHash(str) {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32-bit integer
        }
        return hash.toString(36);
    }

    get(key) {
        if (this.cache.has(key)) {
            this.stats.hits++;
            // Move to end (LRU)
            const value = this.cache.get(key);
            this.cache.delete(key);
            this.cache.set(key, value);
            return value;
        }
        this.stats.misses++;
        return null;
    }

    set(key, value) {
        // Remove oldest if at capacity
        if (this.cache.size >= this.maxSize) {
            const firstKey = this.cache.keys().next().value;
            this.cache.delete(firstKey);
        }

        this.cache.set(key, {
            ...value,
            timestamp: Date.now()
        });
    }

    clear() {
        this.cache.clear();
        this.stats = { hits: 0, misses: 0, apiCalls: 0 };
    }

    getStats() {
        return {
            ...this.stats,
            cacheSize: this.cache.size,
            hitRate: this.stats.hits + this.stats.misses > 0 ?
                (this.stats.hits / (this.stats.hits + this.stats.misses) * 100).toFixed(1) + '%' :
                '0%'
        };
    }
}

export class PreviewManager {
    static cache = new PreviewCache();
    static pendingRequests = new Map();

    /**
     * Get preview with caching and deduplication
     */
    static async getPreview({ allBlocks, targetBlockId, pageContext }) {
        const cacheKey = this.cache.generateCacheKey(allBlocks, pageContext);

        // Check cache first
        const cached = this.cache.get(cacheKey);
        if (cached && this.isCacheValid(cached)) {
            return cached;
        }

        // Check if same request is already pending
        if (this.pendingRequests.has(cacheKey)) {
            return await this.pendingRequests.get(cacheKey);
        }

        // Make new request
        const requestPromise = this.fetchPreview({
            allBlocks,
            targetBlockId,
            pageContext
        });

        this.pendingRequests.set(cacheKey, requestPromise);

        try {
            const result = await requestPromise;
            this.cache.set(cacheKey, result);
            this.pendingRequests.delete(cacheKey);

            // Dispatch stats update event
            this.dispatchStatsUpdate();

            return result;
        } catch (error) {
            this.pendingRequests.delete(cacheKey);
            throw error;
        }
    }

    /**
     * Make actual API request
     */
    static async fetchPreview({ allBlocks, targetBlockId, pageContext }) {
        this.cache.stats.apiCalls++;

        const response = await wp.apiFetch({
            path: '/wp-json/universal-block/v1/preview',
            method: 'POST',
            data: {
                allBlocks,
                targetBlockId,
                pageContext
            }
        });

        if (!response.success) {
            throw new Error(response.message || 'Preview generation failed');
        }

        return response;
    }

    /**
     * Check if cached result is still valid (5 minutes)
     */
    static isCacheValid(cached) {
        const maxAge = 5 * 60 * 1000; // 5 minutes
        return (Date.now() - cached.timestamp) < maxAge;
    }

    /**
     * Create debounced preview function for a specific block
     */
    static createDebouncedPreview(delay = 500) {
        return debounce(async (params) => {
            return await this.getPreview(params);
        }, delay);
    }

    /**
     * Clear all caches
     */
    static clearCache() {
        this.cache.clear();
        this.pendingRequests.clear();
    }

    /**
     * Get cache statistics
     */
    static getStats() {
        return this.cache.getStats();
    }

    /**
     * Dispatch performance stats update event
     */
    static dispatchStatsUpdate() {
        const stats = this.getStats();
        window.dispatchEvent(new CustomEvent('ubPreviewStats', {
            detail: { previewStats: stats }
        }));
    }

    /**
     * Preload preview for better UX
     */
    static async preloadPreview({ allBlocks, targetBlockId, pageContext }) {
        try {
            await this.getPreview({ allBlocks, targetBlockId, pageContext });
        } catch (error) {
            // Silently fail preloads
            console.debug('Preview preload failed:', error);
        }
    }
}

/**
 * Hook for using debounced preview in components
 */
export function useDebouncedPreview(delay = 500) {
    const debouncedFetch = PreviewManager.createDebouncedPreview(delay);

    return {
        getPreview: debouncedFetch,
        clearCache: () => PreviewManager.clearCache(),
        getStats: () => PreviewManager.getStats()
    };
}

/**
 * Smart preview hook that handles common patterns
 */
export function useSmartPreview({ blockId, isEnabled = false, delay = 500 }) {
    const [preview, setPreview] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);

    const { getPreview } = useDebouncedPreview(delay);

    const updatePreview = useCallback(async (allBlocks, pageContext) => {
        if (!isEnabled || !blockId) return;

        setIsLoading(true);
        setError(null);

        try {
            const result = await getPreview({
                allBlocks,
                targetBlockId: blockId,
                pageContext
            });

            setPreview(result.html);
        } catch (err) {
            setError(err.message);
            setPreview(`<!-- Preview Error: ${err.message} -->`);
        }

        setIsLoading(false);
    }, [isEnabled, blockId, getPreview]);

    return {
        preview,
        isLoading,
        error,
        updatePreview
    };
}

export default PreviewManager;