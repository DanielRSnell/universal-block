/**
 * Universal Block - Editor Tweaks JavaScript
 * Handles DOM manipulation and interactive elements for the Gutenberg editor
 */

(function() {
    'use strict';

    /**
     * Create and inject the universal sidebar div
     */
    function createUniversalSidebar() {
        // Check if sidebar already exists
        if (document.getElementById('universal-sidebar')) {
            return;
        }

        // Create the sidebar div
        const sidebar = document.createElement('div');
        sidebar.id = 'universal-sidebar';

        // Add to the beginning of the body
        const body = document.querySelector('.interface-interface-skeleton__body');
        if (body) {
            body.insertBefore(sidebar, body.firstChild);
        } else {
            // Fallback - add to document body
            document.body.appendChild(sidebar);
        }
    }

    /**
     * Initialize when DOM is ready
     */
    function initEditorTweaks() {
        // Wait for Gutenberg to be ready
        if (typeof wp !== 'undefined' && wp.data && wp.data.select('core/editor')) {
            createUniversalSidebar();
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