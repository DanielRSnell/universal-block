import React, { useState, useEffect } from 'react';
import MonacoEditor from './MonacoEditor';
import RemixIcon from './RemixIcon';
import usePreferencesStore from '../store/usePreferencesStore';

const { __ } = wp.i18n;
const { createElement: el } = wp.element;

// Canvas management hook
function useCanvasManager() {
  const editorWidthChange = (isDrawerOpen, isLeftSide = false) => {
    const sidebarWidth = 60;
    const drawerWidth = 350;
    const totalWidth = isDrawerOpen ? sidebarWidth + drawerWidth : sidebarWidth;
    const targetElement = document.querySelector('.interface-interface-skeleton__body');

    if (targetElement) {
      if (isLeftSide) {
        targetElement.style.setProperty('margin-left', `${totalWidth}px`, 'important');
        targetElement.style.setProperty('margin-right', '0px', 'important');
      } else {
        targetElement.style.setProperty('margin-right', `${totalWidth}px`, 'important');
        targetElement.style.setProperty('margin-left', '0px', 'important');
      }
      console.log(`🎯 Canvas width updated: ${totalWidth}px on ${isLeftSide ? 'left' : 'right'} side`);
    }
  };

  // Make function globally available
  useEffect(() => {
    window.editorWidthChange = editorWidthChange;
  }, []);

  return { editorWidthChange };
}

// Quick Add Button Component
function QuickAddButton({ elementType, tagName, remixIcon, tooltip, onClick }) {
  const handleClick = () => {
    if (!wp || !wp.data || !wp.blocks) {
      console.error('WordPress APIs not available');
      return;
    }

    try {
      const { dispatch, select } = wp.data;

      // Step 1: Create a basic Universal Block
      const newBlock = wp.blocks.createBlock('universal-block/element', {
        elementType: 'text', // Start with text as default
        tagName: 'p',
        content: '',
        className: '',
        globalAttrs: {},
        selfClosing: false
      });

      // Step 2: Insert the block after current selection
      const selectedBlockClientId = select('core/block-editor').getSelectedBlockClientId();
      const insertionPoint = select('core/block-editor').getBlockInsertionPoint();

      if (selectedBlockClientId) {
        // Insert after the selected block
        dispatch('core/block-editor').insertBlocks([newBlock], insertionPoint.index + 1, insertionPoint.rootClientId);
      } else {
        // Insert at the end if no selection
        dispatch('core/block-editor').insertBlocks([newBlock]);
      }

      // Step 3: Immediately select and update the block
      dispatch('core/block-editor').selectBlock(newBlock.clientId);

      // Step 4: Update the block with the correct attributes
      const updates = {
        elementType: elementType,
        tagName: tagName,
        selfClosing: ['image', 'rule'].includes(elementType)
      };

      // Set default content based on element type
      switch (elementType) {
        case 'heading':
          updates.content = __('Your heading text', 'universal-block');
          break;
        case 'text':
          updates.content = __('Your text content', 'universal-block');
          break;
        case 'container':
          updates.content = '';
          break;
      }

      dispatch('core/block-editor').updateBlockAttributes(newBlock.clientId, updates);

      console.log(`🎯 Quick-added ${elementType} (${tagName}) block`);
      if (onClick) onClick();

    } catch (error) {
      console.error('Failed to insert block:', error);
    }
  };

  return (
    <button
      className="sidebar-button quick-add-btn"
      onClick={handleClick}
      data-tooltip={tooltip}
      aria-label={tooltip}
    >
      <RemixIcon name={remixIcon} />
    </button>
  );
}

// Quick Add Section Component
function QuickAddSection() {
  return (
    <div className="sidebar-quick-add">
      <div className="quick-add-group">
        <QuickAddButton
          elementType="container"
          tagName="section"
          remixIcon="ri-layout-line"
          tooltip={__('Section', 'universal-block')}
        />
        <QuickAddButton
          elementType="container"
          tagName="div"
          remixIcon="ri-checkbox-blank-line"
          tooltip={__('Div', 'universal-block')}
        />
      </div>
      <div className="quick-add-divider" />
      <div className="quick-add-group">
        <QuickAddButton
          elementType="heading"
          tagName="h2"
          remixIcon="ri-h-1"
          tooltip={__('Header', 'universal-block')}
        />
        <QuickAddButton
          elementType="container"
          tagName="span"
          remixIcon="ri-subtract-line"
          tooltip={__('Span', 'universal-block')}
        />
        <QuickAddButton
          elementType="text"
          tagName="p"
          remixIcon="ri-text"
          tooltip={__('Text', 'universal-block')}
        />
      </div>
    </div>
  );
}

// HTML Import Drawer Component
function HTMLImportDrawer({ isOpen, onClose }) {
  const [htmlContent, setHtmlContent] = useState('');

  // Always render the drawer, but control visibility with CSS

  const handleConvertAndInsert = () => {
    if (!htmlContent.trim()) {
      alert(__('Please enter some HTML to convert.', 'universal-block'));
      return;
    }

    if (typeof window.parseHTMLToBlocks === 'function') {
      const blockMarkup = window.parseHTMLToBlocks(htmlContent);
      if (blockMarkup && typeof window.universalInsertBlock === 'function') {
        const success = window.universalInsertBlock(blockMarkup);
        if (success) {
          setHtmlContent('');
          onClose();
          console.log('🎯 HTML converted and inserted successfully');
        }
      }
    } else {
      console.warn('HTML parser not available');
    }
  };

  const handleCopyAsBlocks = () => {
    if (!htmlContent.trim()) {
      alert(__('Please enter some HTML to convert.', 'universal-block'));
      return;
    }

    if (typeof window.parseHTMLToBlocks === 'function') {
      const blockMarkup = window.parseHTMLToBlocks(htmlContent);
      if (blockMarkup) {
        navigator.clipboard.writeText(blockMarkup).then(() => {
          console.log('🎯 Block markup copied to clipboard');
        }).catch(err => {
          console.error('Failed to copy to clipboard:', err);
        });
      }
    }
  };

  return (
    <div className={`drawer ${isOpen ? 'drawer--open' : ''}`} id="main-drawer">
      <div className="drawer__header">
        <h3 className="drawer__title">{__('Import HTML', 'universal-block')}</h3>
        <button
          className="button button--ghost button--sm"
          onClick={onClose}
          aria-label={__('Close drawer', 'universal-block')}
        >
          <RemixIcon name="ri-close-line" size="16px" />
        </button>
      </div>
      <div className="drawer__content">
        <MonacoEditor
          value={htmlContent}
          onChange={setHtmlContent}
          placeholder={__('Paste your HTML here...', 'universal-block')}
        />
        <div className="button-group">
          <button
            className="button button--primary"
            onClick={handleConvertAndInsert}
          >
            <RemixIcon name="ri-add-line" size="16px" />
            <span>{__('Convert & Insert', 'universal-block')}</span>
          </button>
          <button
            className="button button--secondary"
            onClick={handleCopyAsBlocks}
          >
            <RemixIcon name="ri-file-copy-line" size="16px" />
            <span>{__('Copy as Blocks', 'universal-block')}</span>
          </button>
        </div>
        <div className="help-text">
          <p>
            <strong>{__('Convert & Insert:', 'universal-block')}</strong>
            {' '}
            {__('Parses HTML and inserts blocks directly into the editor.', 'universal-block')}
          </p>
          <p>
            <strong>{__('Copy as Blocks:', 'universal-block')}</strong>
            {' '}
            {__('Generates block markup that can be pasted anywhere.', 'universal-block')}
          </p>
        </div>
      </div>
    </div>
  );
}

// Main Sidebar Component
function Sidebar({ onToggleDrawer, isDrawerOpen, onTogglePosition, isLeftSide }) {
  return (
    <div className="sidebar">
      <QuickAddSection />
      <div className="sidebar__footer">
        <button
          className={`sidebar-button ${isDrawerOpen ? 'sidebar-button--active' : ''}`}
          onClick={onToggleDrawer}
          data-tooltip={__('Import HTML', 'universal-block')}
          aria-label={__('Import HTML', 'universal-block')}
        >
          <RemixIcon name="ri-html5-line" />
        </button>
        <button
          className="sidebar-button"
          onClick={onTogglePosition}
          data-tooltip={isLeftSide ? __('Move to Right', 'universal-block') : __('Move to Left', 'universal-block')}
          aria-label={isLeftSide ? __('Move to Right', 'universal-block') : __('Move to Left', 'universal-block')}
        >
          <RemixIcon name={isLeftSide ? "ri-arrow-right-s-line" : "ri-arrow-left-s-line"} />
        </button>
      </div>
    </div>
  );
}

// Main Universal Editor Tweaks Component
function UniversalEditorTweaks() {
  const {
    sidebarPosition,
    isDrawerOpen,
    toggleDrawer,
    closeDrawer,
    toggleSidebarPosition
  } = usePreferencesStore();

  const { editorWidthChange } = useCanvasManager();
  const isLeftSide = sidebarPosition === 'left';

  // Update canvas whenever drawer or position changes
  useEffect(() => {
    editorWidthChange(isDrawerOpen, isLeftSide);
  }, [isDrawerOpen, isLeftSide, editorWidthChange]);

  return (
    <div className={`universal-editor-tweaks-container ${isLeftSide ? 'sidebar-left' : 'sidebar-right'}`}>
      <Sidebar
        onToggleDrawer={toggleDrawer}
        isDrawerOpen={isDrawerOpen}
        onTogglePosition={toggleSidebarPosition}
        isLeftSide={isLeftSide}
      />
      <HTMLImportDrawer
        isOpen={isDrawerOpen}
        onClose={closeDrawer}
      />
    </div>
  );
}

export default UniversalEditorTweaks;