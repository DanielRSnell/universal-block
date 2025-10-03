import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence, animate } from 'framer-motion';
import AceEditor from './AceEditor';
import RemixIcon from './RemixIcon';
import HtmlEditorPopup from './HtmlEditorPopup';
import usePreferencesStore from '../store/usePreferencesStore';

const { __ } = wp.i18n;
const { createElement: el } = wp.element;

// Canvas management hook with smooth animations
function useCanvasManager() {
  // Keep track of current animations to prevent conflicts
  const activeAnimations = { left: null, right: null };

  const editorWidthChange = (isDrawerOpen, isLeftSide = false) => {
    const sidebarWidth = 60;
    const drawerWidth = 350;
    const totalWidth = isDrawerOpen ? sidebarWidth + drawerWidth : sidebarWidth;
    const targetElement = document.querySelector('.interface-interface-skeleton__body');

    if (targetElement) {
      // Get current computed margins to animate from
      const currentStyle = getComputedStyle(targetElement);
      const currentMarginLeft = parseInt(currentStyle.marginLeft) || 0;
      const currentMarginRight = parseInt(currentStyle.marginRight) || 0;

      // Cancel any existing animations to prevent conflicts
      if (activeAnimations.left) {
        activeAnimations.left.stop();
        activeAnimations.left = null;
      }
      if (activeAnimations.right) {
        activeAnimations.right.stop();
        activeAnimations.right = null;
      }

      // Animation settings
      const animationConfig = {
        duration: 0.3,
        type: "spring",
        damping: 25,
        stiffness: 200
      };

      if (isLeftSide) {
        // Animate left margin to target value
        activeAnimations.left = animate(currentMarginLeft, totalWidth, {
          ...animationConfig,
          onUpdate: (value) => {
            targetElement.style.setProperty('margin-left', `${value}px`, 'important');
          },
          onComplete: () => {
            activeAnimations.left = null;
          }
        });

        // Animate right margin to 0 if it's not already
        if (currentMarginRight > 0) {
          activeAnimations.right = animate(currentMarginRight, 0, {
            ...animationConfig,
            onUpdate: (value) => {
              targetElement.style.setProperty('margin-right', `${value}px`, 'important');
            },
            onComplete: () => {
              activeAnimations.right = null;
            }
          });
        } else {
          // Ensure right margin is explicitly 0
          targetElement.style.setProperty('margin-right', '0px', 'important');
        }
      } else {
        // Animate right margin to target value
        activeAnimations.right = animate(currentMarginRight, totalWidth, {
          ...animationConfig,
          onUpdate: (value) => {
            targetElement.style.setProperty('margin-right', `${value}px`, 'important');
          },
          onComplete: () => {
            activeAnimations.right = null;
          }
        });

        // Animate left margin to 0 if it's not already
        if (currentMarginLeft > 0) {
          activeAnimations.left = animate(currentMarginLeft, 0, {
            ...animationConfig,
            onUpdate: (value) => {
              targetElement.style.setProperty('margin-left', `${value}px`, 'important');
            },
            onComplete: () => {
              activeAnimations.left = null;
            }
          });
        } else {
          // Ensure left margin is explicitly 0
          targetElement.style.setProperty('margin-left', '0px', 'important');
        }
      }

      console.log(`🎯 Canvas width animating to: ${totalWidth}px on ${isLeftSide ? 'left' : 'right'} side`);
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
      const newBlock = wp.blocks.createBlock('universal/element', {
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
    <motion.button
      className="sidebar-button quick-add-btn"
      onClick={handleClick}
      data-tooltip={tooltip}
      aria-label={tooltip}
      whileHover={{
        y: -1,
        scale: 1.05,
        transition: { type: "spring", stiffness: 400, damping: 25 }
      }}
      whileTap={{
        scale: 0.95,
        transition: { type: "spring", stiffness: 400, damping: 25 }
      }}
    >
      <RemixIcon name={remixIcon} />
    </motion.button>
  );
}

// Quick Add Section Component
function QuickAddSection() {
  return (
    <div className="sidebar-quick-add">
      {/* Layout Elements */}
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
        <QuickAddButton
          elementType="container"
          tagName="article"
          remixIcon="ri-article-line"
          tooltip={__('Article', 'universal-block')}
        />
      </div>
      <div className="quick-add-divider" />

      {/* Text Elements */}
      <div className="quick-add-group">
        <QuickAddButton
          elementType="heading"
          tagName="h2"
          remixIcon="ri-h-1"
          tooltip={__('Header', 'universal-block')}
        />
        <QuickAddButton
          elementType="text"
          tagName="p"
          remixIcon="ri-text"
          tooltip={__('Paragraph', 'universal-block')}
        />
        <QuickAddButton
          elementType="container"
          tagName="span"
          remixIcon="ri-subtract-line"
          tooltip={__('Span', 'universal-block')}
        />
      </div>
      <div className="quick-add-divider" />

      {/* Media Elements */}
      <div className="quick-add-group">
        <QuickAddButton
          elementType="image"
          tagName="img"
          remixIcon="ri-image-line"
          tooltip={__('Image', 'universal-block')}
        />
        <QuickAddButton
          elementType="container"
          tagName="video"
          remixIcon="ri-video-line"
          tooltip={__('Video', 'universal-block')}
        />
      </div>
      <div className="quick-add-divider" />

      {/* Interactive Elements */}
      <div className="quick-add-group">
        <QuickAddButton
          elementType="text"
          tagName="a"
          remixIcon="ri-link"
          tooltip={__('Link', 'universal-block')}
        />
        <QuickAddButton
          elementType="text"
          tagName="button"
          remixIcon="ri-radio-button-line"
          tooltip={__('Button', 'universal-block')}
        />
      </div>
      <div className="quick-add-divider" />

      {/* List Elements */}
      <div className="quick-add-group">
        <QuickAddButton
          elementType="container"
          tagName="ul"
          remixIcon="ri-list-unordered"
          tooltip={__('Unordered List', 'universal-block')}
        />
        <QuickAddButton
          elementType="container"
          tagName="ol"
          remixIcon="ri-list-ordered"
          tooltip={__('Ordered List', 'universal-block')}
        />
      </div>
    </div>
  );
}

// Preview Manager Component
function PreviewManager() {
  const [viewType, setViewType] = useState('single');
  const [postType, setPostType] = useState('post');
  const [postId, setPostId] = useState('');
  const [taxonomy, setTaxonomy] = useState('category');
  const [termId, setTermId] = useState('');
  const [authorId, setAuthorId] = useState('');
  const [dateYear, setDateYear] = useState('');
  const [dateMonth, setDateMonth] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [productId, setProductId] = useState('');
  const [productCategoryId, setProductCategoryId] = useState('');
  const [productTagId, setProductTagId] = useState('');
  const [accountEndpoint, setAccountEndpoint] = useState('');

  // Initialize window.pageData if it doesn't exist
  useEffect(() => {
    if (!window.pageData) {
      window.pageData = {};
    }
  }, []);

  // Update window.pageData whenever settings change
  useEffect(() => {
    const pageData = {
      viewType,
      timestamp: new Date().toISOString()
    };

    // Add fields based on view type
    switch (viewType) {
      case 'single':
        pageData.postType = postType;
        pageData.postId = postId ? parseInt(postId) : null;
        break;

      case 'archive':
        pageData.postType = postType;
        break;

      case 'taxonomy':
        pageData.taxonomy = taxonomy;
        pageData.termId = termId ? parseInt(termId) : null;
        break;

      case 'author':
        pageData.authorId = authorId ? parseInt(authorId) : null;
        break;

      case 'date':
        pageData.year = dateYear ? parseInt(dateYear) : null;
        pageData.month = dateMonth ? parseInt(dateMonth) : null;
        break;

      case 'search':
        pageData.searchQuery = searchQuery;
        break;

      case 'home':
        // No additional fields needed
        break;

      case 'wc-shop':
        pageData.isWooCommerce = true;
        pageData.wcPageType = 'shop';
        break;

      case 'wc-product':
        pageData.isWooCommerce = true;
        pageData.wcPageType = 'product';
        pageData.productId = productId ? parseInt(productId) : null;
        break;

      case 'wc-product-category':
        pageData.isWooCommerce = true;
        pageData.wcPageType = 'product-category';
        pageData.categoryId = productCategoryId ? parseInt(productCategoryId) : null;
        break;

      case 'wc-product-tag':
        pageData.isWooCommerce = true;
        pageData.wcPageType = 'product-tag';
        pageData.tagId = productTagId ? parseInt(productTagId) : null;
        break;

      case 'wc-cart':
        pageData.isWooCommerce = true;
        pageData.wcPageType = 'cart';
        break;

      case 'wc-checkout':
        pageData.isWooCommerce = true;
        pageData.wcPageType = 'checkout';
        break;

      case 'wc-account':
        pageData.isWooCommerce = true;
        pageData.wcPageType = 'account';
        pageData.accountEndpoint = accountEndpoint || 'dashboard';
        break;

      case 'wc-account-orders':
        pageData.isWooCommerce = true;
        pageData.wcPageType = 'account';
        pageData.accountEndpoint = 'orders';
        break;

      case 'wc-account-downloads':
        pageData.isWooCommerce = true;
        pageData.wcPageType = 'account';
        pageData.accountEndpoint = 'downloads';
        break;

      case 'wc-account-edit':
        pageData.isWooCommerce = true;
        pageData.wcPageType = 'account';
        pageData.accountEndpoint = 'edit-account';
        break;

      case 'wc-account-addresses':
        pageData.isWooCommerce = true;
        pageData.wcPageType = 'account';
        pageData.accountEndpoint = 'edit-address';
        break;
    }

    window.pageData = pageData;
    console.log('🎯 Page data updated:', pageData);
  }, [viewType, postType, postId, taxonomy, termId, authorId, dateYear, dateMonth, searchQuery, productId, productCategoryId, productTagId, accountEndpoint]);

  // Helper function to get current data for JSON preview
  const getCurrentData = () => {
    const data = { viewType };

    switch (viewType) {
      case 'single':
        data.postType = postType;
        data.postId = postId ? parseInt(postId) : null;
        break;
      case 'archive':
        data.postType = postType;
        break;
      case 'taxonomy':
        data.taxonomy = taxonomy;
        data.termId = termId ? parseInt(termId) : null;
        break;
      case 'author':
        data.authorId = authorId ? parseInt(authorId) : null;
        break;
      case 'date':
        data.year = dateYear ? parseInt(dateYear) : null;
        data.month = dateMonth ? parseInt(dateMonth) : null;
        break;
      case 'search':
        data.searchQuery = searchQuery;
        break;
      case 'wc-shop':
        data.isWooCommerce = true;
        data.wcPageType = 'shop';
        break;
      case 'wc-product':
        data.isWooCommerce = true;
        data.wcPageType = 'product';
        data.productId = productId ? parseInt(productId) : null;
        break;
      case 'wc-product-category':
        data.isWooCommerce = true;
        data.wcPageType = 'product-category';
        data.categoryId = productCategoryId ? parseInt(productCategoryId) : null;
        break;
      case 'wc-product-tag':
        data.isWooCommerce = true;
        data.wcPageType = 'product-tag';
        data.tagId = productTagId ? parseInt(productTagId) : null;
        break;
      case 'wc-cart':
        data.isWooCommerce = true;
        data.wcPageType = 'cart';
        break;
      case 'wc-checkout':
        data.isWooCommerce = true;
        data.wcPageType = 'checkout';
        break;
      case 'wc-account':
        data.isWooCommerce = true;
        data.wcPageType = 'account';
        data.accountEndpoint = accountEndpoint || 'dashboard';
        break;
      case 'wc-account-orders':
        data.isWooCommerce = true;
        data.wcPageType = 'account';
        data.accountEndpoint = 'orders';
        break;
      case 'wc-account-downloads':
        data.isWooCommerce = true;
        data.wcPageType = 'account';
        data.accountEndpoint = 'downloads';
        break;
      case 'wc-account-edit':
        data.isWooCommerce = true;
        data.wcPageType = 'account';
        data.accountEndpoint = 'edit-account';
        break;
      case 'wc-account-addresses':
        data.isWooCommerce = true;
        data.wcPageType = 'account';
        data.accountEndpoint = 'edit-address';
        break;
    }

    return data;
  };

  return (
    <div className="preview-manager">
      <h4>{__('Preview Manager', 'universal-block')}</h4>

      <div className="form-group">
        <label htmlFor="view-type">{__('View Type', 'universal-block')}</label>
        <select
          id="view-type"
          value={viewType}
          onChange={(e) => setViewType(e.target.value)}
          className="form-control"
        >
          <option value="single">{__('Single Post/Page', 'universal-block')}</option>
          <option value="archive">{__('Post Type Archive', 'universal-block')}</option>
          <option value="taxonomy">{__('Taxonomy Archive', 'universal-block')}</option>
          <option value="author">{__('Author Archive', 'universal-block')}</option>
          <option value="date">{__('Date Archive', 'universal-block')}</option>
          <option value="search">{__('Search Results', 'universal-block')}</option>
          <option value="home">{__('Home/Front Page', 'universal-block')}</option>
          <optgroup label="WooCommerce">
            <option value="wc-shop">{__('Shop Page', 'universal-block')}</option>
            <option value="wc-product">{__('Single Product', 'universal-block')}</option>
            <option value="wc-product-category">{__('Product Category', 'universal-block')}</option>
            <option value="wc-product-tag">{__('Product Tag', 'universal-block')}</option>
            <option value="wc-cart">{__('Cart Page', 'universal-block')}</option>
            <option value="wc-checkout">{__('Checkout Page', 'universal-block')}</option>
            <option value="wc-account">{__('My Account', 'universal-block')}</option>
            <option value="wc-account-orders">{__('Account - Orders', 'universal-block')}</option>
            <option value="wc-account-downloads">{__('Account - Downloads', 'universal-block')}</option>
            <option value="wc-account-edit">{__('Account - Edit Account', 'universal-block')}</option>
            <option value="wc-account-addresses">{__('Account - Addresses', 'universal-block')}</option>
          </optgroup>
        </select>
      </div>

      {(viewType === 'single' || viewType === 'archive') && (
        <div className="form-group">
          <label htmlFor="post-type">{__('Post Type', 'universal-block')}</label>
          <select
            id="post-type"
            value={postType}
            onChange={(e) => setPostType(e.target.value)}
            className="form-control"
          >
            <option value="post">{__('Post', 'universal-block')}</option>
            <option value="page">{__('Page', 'universal-block')}</option>
            <option value="product">{__('Product', 'universal-block')}</option>
            <option value="event">{__('Event', 'universal-block')}</option>
            <option value="portfolio">{__('Portfolio', 'universal-block')}</option>
          </select>
        </div>
      )}

      {viewType === 'single' && (
        <div className="form-group">
          <label htmlFor="post-id">{__('Post ID', 'universal-block')}</label>
          <input
            type="number"
            id="post-id"
            value={postId}
            onChange={(e) => setPostId(e.target.value)}
            placeholder={__('Enter specific post ID...', 'universal-block')}
            className="form-control"
            min="1"
          />
        </div>
      )}

      {viewType === 'taxonomy' && (
        <>
          <div className="form-group">
            <label htmlFor="taxonomy">{__('Taxonomy', 'universal-block')}</label>
            <select
              id="taxonomy"
              value={taxonomy}
              onChange={(e) => setTaxonomy(e.target.value)}
              className="form-control"
            >
              <option value="category">{__('Category', 'universal-block')}</option>
              <option value="post_tag">{__('Tag', 'universal-block')}</option>
              <option value="product_cat">{__('Product Category', 'universal-block')}</option>
              <option value="product_tag">{__('Product Tag', 'universal-block')}</option>
            </select>
          </div>
          <div className="form-group">
            <label htmlFor="term-id">{__('Term ID', 'universal-block')}</label>
            <input
              type="number"
              id="term-id"
              value={termId}
              onChange={(e) => setTermId(e.target.value)}
              placeholder={__('Enter term ID...', 'universal-block')}
              className="form-control"
              min="1"
            />
          </div>
        </>
      )}

      {viewType === 'author' && (
        <div className="form-group">
          <label htmlFor="author-id">{__('Author ID', 'universal-block')}</label>
          <input
            type="number"
            id="author-id"
            value={authorId}
            onChange={(e) => setAuthorId(e.target.value)}
            placeholder={__('Enter author ID...', 'universal-block')}
            className="form-control"
            min="1"
          />
        </div>
      )}

      {viewType === 'date' && (
        <>
          <div className="form-group">
            <label htmlFor="date-year">{__('Year', 'universal-block')}</label>
            <input
              type="number"
              id="date-year"
              value={dateYear}
              onChange={(e) => setDateYear(e.target.value)}
              placeholder={__('Enter year (e.g., 2024)...', 'universal-block')}
              className="form-control"
              min="2000"
              max="2030"
            />
          </div>
          <div className="form-group">
            <label htmlFor="date-month">{__('Month (Optional)', 'universal-block')}</label>
            <select
              id="date-month"
              value={dateMonth}
              onChange={(e) => setDateMonth(e.target.value)}
              className="form-control"
            >
              <option value="">{__('All Months', 'universal-block')}</option>
              <option value="1">{__('January', 'universal-block')}</option>
              <option value="2">{__('February', 'universal-block')}</option>
              <option value="3">{__('March', 'universal-block')}</option>
              <option value="4">{__('April', 'universal-block')}</option>
              <option value="5">{__('May', 'universal-block')}</option>
              <option value="6">{__('June', 'universal-block')}</option>
              <option value="7">{__('July', 'universal-block')}</option>
              <option value="8">{__('August', 'universal-block')}</option>
              <option value="9">{__('September', 'universal-block')}</option>
              <option value="10">{__('October', 'universal-block')}</option>
              <option value="11">{__('November', 'universal-block')}</option>
              <option value="12">{__('December', 'universal-block')}</option>
            </select>
          </div>
        </>
      )}

      {viewType === 'search' && (
        <div className="form-group">
          <label htmlFor="search-query">{__('Search Query', 'universal-block')}</label>
          <input
            type="text"
            id="search-query"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={__('Enter search term...', 'universal-block')}
            className="form-control"
          />
        </div>
      )}

      {viewType === 'wc-product' && (
        <div className="form-group">
          <label htmlFor="product-id">{__('Product ID', 'universal-block')}</label>
          <input
            type="number"
            id="product-id"
            value={productId}
            onChange={(e) => setProductId(e.target.value)}
            placeholder={__('Enter product ID...', 'universal-block')}
            className="form-control"
            min="1"
          />
        </div>
      )}

      {viewType === 'wc-product-category' && (
        <div className="form-group">
          <label htmlFor="product-category-id">{__('Product Category ID', 'universal-block')}</label>
          <input
            type="number"
            id="product-category-id"
            value={productCategoryId}
            onChange={(e) => setProductCategoryId(e.target.value)}
            placeholder={__('Enter category ID...', 'universal-block')}
            className="form-control"
            min="1"
          />
        </div>
      )}

      {viewType === 'wc-product-tag' && (
        <div className="form-group">
          <label htmlFor="product-tag-id">{__('Product Tag ID', 'universal-block')}</label>
          <input
            type="number"
            id="product-tag-id"
            value={productTagId}
            onChange={(e) => setProductTagId(e.target.value)}
            placeholder={__('Enter tag ID...', 'universal-block')}
            className="form-control"
            min="1"
          />
        </div>
      )}

      {viewType === 'wc-account' && (
        <div className="form-group">
          <label htmlFor="account-endpoint">{__('Account Section', 'universal-block')}</label>
          <select
            id="account-endpoint"
            value={accountEndpoint}
            onChange={(e) => setAccountEndpoint(e.target.value)}
            className="form-control"
          >
            <option value="">{__('Dashboard', 'universal-block')}</option>
            <option value="orders">{__('Orders', 'universal-block')}</option>
            <option value="downloads">{__('Downloads', 'universal-block')}</option>
            <option value="edit-account">{__('Edit Account', 'universal-block')}</option>
            <option value="edit-address">{__('Addresses', 'universal-block')}</option>
            <option value="payment-methods">{__('Payment Methods', 'universal-block')}</option>
            <option value="view-order">{__('View Order', 'universal-block')}</option>
          </select>
        </div>
      )}

      <div className="preview-data">
        <h5>{__('Current Page Data', 'universal-block')}</h5>
        <pre className="json-preview">
          {JSON.stringify(getCurrentData(), null, 2)}
        </pre>
      </div>
    </div>
  );
}

// Settings Panel System Component
function SettingsPanel({ title, description, icon, children, onBack }) {
  return (
    <motion.div
      initial={{ x: 300, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: -300, opacity: 0 }}
      transition={{ type: "spring", damping: 25, stiffness: 200 }}
      className="settings-panel"
    >
      <div className="settings-panel__header">
        <button
          className="button button--ghost button--sm"
          onClick={onBack}
          aria-label={__('Back to settings', 'universal-block')}
        >
          <RemixIcon name="ri-arrow-left-line" size="16px" />
        </button>
        <div className="settings-panel__title">
          <RemixIcon name={icon} size="18px" />
          <h4>{title}</h4>
        </div>
      </div>
      {description && (
        <div className="settings-panel__description">
          <p>{description}</p>
        </div>
      )}
      <div className="settings-panel__content">
        {children}
      </div>
    </motion.div>
  );
}

// Settings Menu Component
function SettingsMenu({ onSelectPanel }) {
  const panels = [
    {
      id: 'preview-manager',
      title: __('Preview Manager', 'universal-block'),
      description: __('Configure page context for dynamic blocks', 'universal-block'),
      icon: 'ri-eye-line'
    },
    {
      id: 'theme-settings',
      title: __('Theme Settings', 'universal-block'),
      description: __('Customize editor appearance and behavior', 'universal-block'),
      icon: 'ri-palette-line'
    },
    {
      id: 'advanced',
      title: __('Advanced Options', 'universal-block'),
      description: __('Developer tools and advanced configuration', 'universal-block'),
      icon: 'ri-code-line'
    }
  ];

  return (
    <motion.div
      initial={{ x: -300, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: 300, opacity: 0 }}
      transition={{ type: "spring", damping: 25, stiffness: 200 }}
      className="settings-menu"
    >
      <div className="settings-menu__header">
        <h4>{__('Settings', 'universal-block')}</h4>
        <p>{__('Configure Universal Block editor behavior', 'universal-block')}</p>
      </div>
      <div className="settings-menu__panels">
        {panels.map((panel) => (
          <motion.button
            key={panel.id}
            className="settings-menu__panel-item"
            onClick={() => onSelectPanel(panel.id)}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <div className="panel-item__icon">
              <RemixIcon name={panel.icon} size="20px" />
            </div>
            <div className="panel-item__content">
              <h5>{panel.title}</h5>
              <p>{panel.description}</p>
            </div>
            <div className="panel-item__arrow">
              <RemixIcon name="ri-arrow-right-s-line" size="16px" />
            </div>
          </motion.button>
        ))}
      </div>
    </motion.div>
  );
}

// Settings Drawer Component
function SettingsDrawer({ isOpen, onClose }) {
  const [currentPanel, setCurrentPanel] = useState(null);

  const handleSelectPanel = (panelId) => {
    setCurrentPanel(panelId);
  };

  const handleBack = () => {
    setCurrentPanel(null);
  };

  const renderPanelContent = () => {
    switch (currentPanel) {
      case 'preview-manager':
        return (
          <SettingsPanel
            title={__('Preview Manager', 'universal-block')}
            description={__('Configure the page context for dynamic blocks to preview different content scenarios.', 'universal-block')}
            icon="ri-eye-line"
            onBack={handleBack}
          >
            <PreviewManager />
          </SettingsPanel>
        );
      case 'theme-settings':
        return (
          <SettingsPanel
            title={__('Theme Settings', 'universal-block')}
            description={__('Customize the editor appearance and behavior to match your workflow.', 'universal-block')}
            icon="ri-palette-line"
            onBack={handleBack}
          >
            <div className="coming-soon">
              <RemixIcon name="ri-palette-line" size="48px" />
              <h5>{__('Theme Settings', 'universal-block')}</h5>
              <p>{__('Theme customization options coming soon...', 'universal-block')}</p>
            </div>
          </SettingsPanel>
        );
      case 'advanced':
        return (
          <SettingsPanel
            title={__('Advanced Options', 'universal-block')}
            description={__('Developer tools and advanced configuration options for power users.', 'universal-block')}
            icon="ri-code-line"
            onBack={handleBack}
          >
            <div className="coming-soon">
              <RemixIcon name="ri-code-line" size="48px" />
              <h5>{__('Advanced Options', 'universal-block')}</h5>
              <p>{__('Advanced configuration options coming soon...', 'universal-block')}</p>
            </div>
          </SettingsPanel>
        );
      default:
        return <SettingsMenu onSelectPanel={handleSelectPanel} />;
    }
  };

  return (
    <motion.div
      className="drawer"
      id="settings-drawer"
      initial={{ x: "100%" }}
      animate={{
        x: isOpen ? 0 : "100%",
        transition: { type: "spring", damping: 25, stiffness: 200 }
      }}
    >
      <div className="drawer__header">
        <h3 className="drawer__title">
          {currentPanel ? __('Settings', 'universal-block') : __('Settings', 'universal-block')}
        </h3>
        <button
          className="button button--ghost button--sm"
          onClick={onClose}
          aria-label={__('Close drawer', 'universal-block')}
        >
          <RemixIcon name="ri-close-line" size="16px" />
        </button>
      </div>
      <div className="drawer__content">
        <AnimatePresence mode="wait">
          {renderPanelContent()}
        </AnimatePresence>
      </div>
    </motion.div>
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

    try {
      if (typeof window.parseHtmlToBlocks === 'function') {
        const blocks = window.parseHtmlToBlocks(htmlContent);

        if (blocks && blocks.length > 0) {
          if (typeof window.generateBlockMarkup === 'function') {
            const blockMarkup = window.generateBlockMarkup(blocks);
            console.log('🔍 Generated block markup:', blockMarkup);

            if (typeof window.insertBlockMarkupIntoEditor === 'function') {
              const success = window.insertBlockMarkupIntoEditor(blockMarkup);

              if (success) {
                setHtmlContent('');
                onClose();
                console.log('🎯 HTML converted and inserted successfully');
              } else {
                alert(__('Failed to insert blocks into editor. Please try again.', 'universal-block'));
              }
            } else {
              console.error('insertBlockMarkupIntoEditor function not available');
              alert(__('Block insertion function not available', 'universal-block'));
            }
          } else {
            console.error('generateBlockMarkup function not available');
            alert(__('Block generation function not available', 'universal-block'));
          }
        } else {
          console.warn('No blocks generated from HTML');
          alert(__('No valid blocks could be generated from the HTML', 'universal-block'));
        }
      } else {
        console.error('parseHtmlToBlocks function not available');
        alert(__('HTML parser not available', 'universal-block'));
      }
    } catch (error) {
      console.error('Failed to convert and insert HTML:', error);
      alert(__('Failed to convert HTML. Please check the console for details.', 'universal-block'));
    }
  };

  const handleCopyAsBlocks = () => {
    if (!htmlContent.trim()) {
      alert(__('Please enter some HTML to convert.', 'universal-block'));
      return;
    }

    try {
      // Use the WordPress block parser utility to convert HTML to blocks
      if (typeof window.parseHtmlToBlocks === 'function') {
        const blocks = window.parseHtmlToBlocks(htmlContent);

        if (blocks && blocks.length > 0) {
          // Convert block data to block markup
          if (typeof window.generateBlockMarkup === 'function') {
            const blockMarkup = window.generateBlockMarkup(blocks);
            navigator.clipboard.writeText(blockMarkup).then(() => {
              console.log('🎯 Block markup copied to clipboard');
            }).catch(err => {
              console.error('Failed to copy to clipboard:', err);
              alert(__('Failed to copy to clipboard. Please check the console for details.', 'universal-block'));
            });
          }
        }
      } else {
        console.warn('HTML parser not available');
      }
    } catch (error) {
      console.error('Failed to convert HTML:', error);
      alert(__('Failed to convert HTML. Please check the console for details.', 'universal-block'));
    }
  };

  return (
    <motion.div
      className="drawer"
      id="main-drawer"
      initial={{ x: "100%" }}
      animate={{
        x: isOpen ? 0 : "100%",
        transition: { type: "spring", damping: 25, stiffness: 200 }
      }}
    >
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
        <AceEditor
          value={htmlContent}
          onChange={setHtmlContent}
          placeholder={__('Paste your HTML here...', 'universal-block')}
          mode="html"
          theme="monokai"
          rows={12}
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
    </motion.div>
  );
}

// Main Sidebar Component
function Sidebar({ onToggleDrawer, isDrawerOpen, onToggleSettingsDrawer, isSettingsDrawerOpen, onTogglePosition, isLeftSide }) {
  return (
    <div className="sidebar">
      <QuickAddSection />
      <div className="sidebar__footer">
        <motion.button
          className={`sidebar-button ${isSettingsDrawerOpen ? 'sidebar-button--active' : ''}`}
          onClick={onToggleSettingsDrawer}
          data-tooltip={__('Settings', 'universal-block')}
          aria-label={__('Settings', 'universal-block')}
          whileHover={{
            y: -1,
            transition: { type: "spring", stiffness: 400, damping: 25 }
          }}
          whileTap={{
            scale: 0.95,
            transition: { type: "spring", stiffness: 400, damping: 25 }
          }}
          animate={{
            backgroundColor: isSettingsDrawerOpen ? "#007cba" : "#ffffff",
            color: isSettingsDrawerOpen ? "#ffffff" : "#007cba",
            transition: { duration: 0.2 }
          }}
        >
          <RemixIcon name="ri-settings-3-line" />
        </motion.button>
        <motion.button
          className={`sidebar-button ${isDrawerOpen ? 'sidebar-button--active' : ''}`}
          onClick={onToggleDrawer}
          data-tooltip={__('Import HTML', 'universal-block')}
          aria-label={__('Import HTML', 'universal-block')}
          whileHover={{
            y: -1,
            transition: { type: "spring", stiffness: 400, damping: 25 }
          }}
          whileTap={{
            scale: 0.95,
            transition: { type: "spring", stiffness: 400, damping: 25 }
          }}
          animate={{
            backgroundColor: isDrawerOpen ? "#007cba" : "#ffffff",
            color: isDrawerOpen ? "#ffffff" : "#007cba",
            transition: { duration: 0.2 }
          }}
        >
          <RemixIcon name="ri-html5-line" />
        </motion.button>
        <motion.button
          className="sidebar-button"
          onClick={onTogglePosition}
          data-tooltip={isLeftSide ? __('Move to Right', 'universal-block') : __('Move to Left', 'universal-block')}
          aria-label={isLeftSide ? __('Move to Right', 'universal-block') : __('Move to Left', 'universal-block')}
          whileHover={{
            y: -1,
            transition: { type: "spring", stiffness: 400, damping: 25 }
          }}
          whileTap={{
            scale: 0.95,
            transition: { type: "spring", stiffness: 400, damping: 25 }
          }}
        >
          <motion.div
            animate={{
              rotate: isLeftSide ? 0 : 180,
              transition: { type: "spring", stiffness: 300, damping: 25 }
            }}
          >
            <RemixIcon name="ri-arrow-right-s-line" />
          </motion.div>
        </motion.button>
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

  const [isSettingsDrawerOpen, setIsSettingsDrawerOpen] = useState(false);
  const [isHtmlEditorOpen, setIsHtmlEditorOpen] = useState(false);

  const { editorWidthChange } = useCanvasManager();
  const isLeftSide = sidebarPosition === 'left';

  const toggleSettingsDrawer = () => {
    setIsSettingsDrawerOpen(!isSettingsDrawerOpen);
  };

  const closeSettingsDrawer = () => {
    setIsSettingsDrawerOpen(false);
  };

  // Update canvas whenever drawer or position changes
  useEffect(() => {
    const anyDrawerOpen = isDrawerOpen || isSettingsDrawerOpen;
    editorWidthChange(anyDrawerOpen, isLeftSide);
  }, [isDrawerOpen, isSettingsDrawerOpen, isLeftSide, editorWidthChange]);

  // Expose window function to open HTML editor
  useEffect(() => {
    window.openUniversalBlockHtmlEditor = () => {
      setIsHtmlEditorOpen(true);
    };

    return () => {
      delete window.openUniversalBlockHtmlEditor;
    };
  }, []);

  return (
    <div className={`universal-editor-tweaks-container ${isLeftSide ? 'sidebar-left' : 'sidebar-right'}`}>
      <Sidebar
        onToggleDrawer={toggleDrawer}
        isDrawerOpen={isDrawerOpen}
        onToggleSettingsDrawer={toggleSettingsDrawer}
        isSettingsDrawerOpen={isSettingsDrawerOpen}
        onTogglePosition={toggleSidebarPosition}
        isLeftSide={isLeftSide}
      />
      <HTMLImportDrawer
        isOpen={isDrawerOpen}
        onClose={closeDrawer}
      />
      <SettingsDrawer
        isOpen={isSettingsDrawerOpen}
        onClose={closeSettingsDrawer}
      />

      <HtmlEditorPopup
        isOpen={isHtmlEditorOpen}
        onClose={() => setIsHtmlEditorOpen(false)}
      />
    </div>
  );
}

export default UniversalEditorTweaks;