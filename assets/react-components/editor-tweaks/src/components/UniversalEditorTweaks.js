import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence, animate } from 'framer-motion';
import RemixIcon from './RemixIcon';
import HtmlEditorPopup from './HtmlEditorPopup';
import HtmlImportDrawer from './HtmlImportDrawer';
import AttributesEditorPopup from './AttributesEditorPopup';
import PreviewSettingsDrawer from './PreviewSettingsDrawer';
import usePreferencesStore from '../store/usePreferencesStore';

const { __ } = wp.i18n;

// Canvas management hook with smooth animations
function useCanvasManager() {
  const activeAnimations = { left: null, right: null };

  const editorWidthChange = (isDrawerOpen, isLeftSide = false) => {
    const sidebarWidth = 60;
    const drawerWidth = 350;
    const totalWidth = isDrawerOpen ? sidebarWidth + drawerWidth : sidebarWidth;
    const targetElement = document.querySelector('.interface-interface-skeleton__body');

    if (targetElement) {
      const currentStyle = getComputedStyle(targetElement);
      const currentMarginLeft = parseInt(currentStyle.marginLeft) || 0;
      const currentMarginRight = parseInt(currentStyle.marginRight) || 0;

      if (activeAnimations.left) {
        activeAnimations.left.stop();
        activeAnimations.left = null;
      }
      if (activeAnimations.right) {
        activeAnimations.right.stop();
        activeAnimations.right = null;
      }

      const animationConfig = {
        duration: 0.3,
        type: "spring",
        damping: 25,
        stiffness: 200
      };

      if (isLeftSide) {
        activeAnimations.left = animate(currentMarginLeft, totalWidth, {
          ...animationConfig,
          onUpdate: (value) => {
            targetElement.style.setProperty('margin-left', `${value}px`, 'important');
          },
          onComplete: () => {
            activeAnimations.left = null;
          }
        });

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
          targetElement.style.setProperty('margin-right', '0px', 'important');
        }
      } else {
        activeAnimations.right = animate(currentMarginRight, totalWidth, {
          ...animationConfig,
          onUpdate: (value) => {
            targetElement.style.setProperty('margin-right', `${value}px`, 'important');
          },
          onComplete: () => {
            activeAnimations.right = null;
          }
        });

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
          targetElement.style.setProperty('margin-left', '0px', 'important');
        }
      }
    }
  };

  return { editorWidthChange };
}

/**
 * Sidebar Component
 * Minimal sidebar with HTML import and preview settings buttons
 */
function Sidebar({ onToggleHtmlImport, onTogglePreviewSettings, isLeftSide }) {
  return (
    <motion.div
      initial={{ x: isLeftSide ? -60 : 60 }}
      animate={{ x: 0 }}
      exit={{ x: isLeftSide ? -60 : 60 }}
      transition={{ type: "spring", damping: 25, stiffness: 200 }}
      style={{
        position: 'fixed',
        bottom: 0,
        [isLeftSide ? 'left' : 'right']: 0,
        width: '60px',
        height: 'calc(100vh - 100px)',
        background: '#fff',
        [isLeftSide ? 'borderRight' : 'borderLeft']: '1px solid #e0e0e0',
        zIndex: 99998,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        paddingTop: '20px',
        justifyContent: 'flex-end',
        paddingBottom: '20px'
      }}
    >
      {/* Bottom buttons */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {/* HTML Import Button */}
        <button
          onClick={onToggleHtmlImport}
          style={{
            background: 'transparent',
            border: 'none',
            color: '#1e1e1e',
            cursor: 'pointer',
            padding: '12px',
            borderRadius: '4px',
            transition: 'background 0.2s',
            width: '48px',
            height: '48px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
          onMouseEnter={(e) => e.currentTarget.style.background = '#f0f0f0'}
          onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
          title="Import HTML"
        >
          <RemixIcon name="file-add-line" size={24} />
        </button>

        {/* Preview Settings Button */}
        <button
          onClick={onTogglePreviewSettings}
          style={{
            background: 'transparent',
            border: 'none',
            color: '#1e1e1e',
            cursor: 'pointer',
            padding: '12px',
            borderRadius: '4px',
            transition: 'background 0.2s',
            width: '48px',
            height: '48px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
          onMouseEnter={(e) => e.currentTarget.style.background = '#f0f0f0'}
          onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
          title="Preview Settings"
        >
          <RemixIcon name="eye-line" size={24} />
        </button>
      </div>
    </motion.div>
  );
}

/**
 * Main Universal Editor Tweaks Component
 */
function UniversalEditorTweaks() {
  const [isHtmlEditorOpen, setIsHtmlEditorOpen] = useState(false);
  const [isHtmlImportOpen, setIsHtmlImportOpen] = useState(false);
  const [isAttributesEditorOpen, setIsAttributesEditorOpen] = useState(false);
  const [isPreviewSettingsOpen, setIsPreviewSettingsOpen] = useState(false);
  const { isLeftSide } = usePreferencesStore();
  const { editorWidthChange } = useCanvasManager();

  // Adjust editor width for sidebar
  useEffect(() => {
    editorWidthChange(false, isLeftSide);
  }, [isLeftSide]);

  // Expose HTML editor toggle globally
  useEffect(() => {
    window.openUniversalBlockHtmlEditor = () => {
      setIsHtmlEditorOpen(true);
    };

    return () => {
      delete window.openUniversalBlockHtmlEditor;
    };
  }, []);

  // Expose Attributes editor toggle globally
  useEffect(() => {
    window.openUniversalBlockAttributesEditor = () => {
      setIsAttributesEditorOpen(true);
    };

    return () => {
      delete window.openUniversalBlockAttributesEditor;
    };
  }, []);

  return (
    <>
      {/* Sidebar */}
      <Sidebar
        onToggleHtmlImport={() => setIsHtmlImportOpen(true)}
        onTogglePreviewSettings={() => setIsPreviewSettingsOpen(true)}
        isLeftSide={isLeftSide}
      />

      {/* HTML Editor Popup */}
      <HtmlEditorPopup
        isOpen={isHtmlEditorOpen}
        onClose={() => setIsHtmlEditorOpen(false)}
      />

      {/* HTML Import Drawer */}
      <HtmlImportDrawer
        isOpen={isHtmlImportOpen}
        onClose={() => setIsHtmlImportOpen(false)}
      />

      {/* Attributes Editor Popup */}
      <AttributesEditorPopup
        isOpen={isAttributesEditorOpen}
        onClose={() => setIsAttributesEditorOpen(false)}
      />

      {/* Preview Settings Drawer */}
      <PreviewSettingsDrawer
        isOpen={isPreviewSettingsOpen}
        onClose={() => setIsPreviewSettingsOpen(false)}
      />
    </>
  );
}

export default UniversalEditorTweaks;
