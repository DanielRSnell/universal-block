import React, { useEffect, useRef } from 'react';

const { __ } = wp.i18n;

function AceEditor({ value, onChange, placeholder, rows = 8, mode = 'html', theme = 'github', className = '', ...props }) {
  const editorRef = useRef(null);
  const aceEditorRef = useRef(null);

  useEffect(() => {
    if (!editorRef.current || !window.ace) return;

    // Initialize Ace Editor
    const editor = window.ace.edit(editorRef.current);
    aceEditorRef.current = editor;

    // Configure editor
    editor.setTheme(`ace/theme/${theme}`);

    // Set mode based on prop, with fallback for twig mode
    const editorMode = mode === 'twig' ? 'ace/mode/twig' : `ace/mode/${mode}`;
    try {
      editor.session.setMode(editorMode);
    } catch (e) {
      // Fallback to text mode if mode not available
      editor.session.setMode('ace/mode/text');
    }
    editor.setOptions({
      fontSize: 14,
      fontFamily: 'Monaco, Menlo, "Ubuntu Mono", monospace',
      showPrintMargin: false,
      wrap: true,
      autoScrollEditorIntoView: true,
      maxLines: rows * 2, // Allow expansion
      minLines: rows,
      enableBasicAutocompletion: true,
      enableLiveAutocompletion: true,
      enableSnippets: true,
      tabSize: 2,
      useSoftTabs: true
    });

    // Set initial value
    editor.setValue(value || '', -1);

    // Listen for changes
    editor.session.on('change', () => {
      const newValue = editor.getValue();
      if (newValue !== value) {
        onChange(newValue);
      }
    });

    // Add beautify command
    if (window.html_beautify) {
      editor.commands.addCommand({
        name: 'beautifyHTML',
        bindKey: { win: 'Ctrl-Alt-F', mac: 'Cmd-Alt-F' },
        exec: function(editor) {
          const content = editor.getValue();
          try {
            const beautified = window.html_beautify(content, {
              indent_size: 2,
              indent_char: ' ',
              max_preserve_newlines: 2,
              preserve_newlines: true,
              keep_array_indentation: false,
              break_chained_methods: false,
              indent_scripts: 'normal',
              brace_style: 'collapse',
              space_before_conditional: true,
              unescape_strings: false,
              jslint_happy: false,
              end_with_newline: false,
              wrap_line_length: 0,
              indent_inner_html: true,
              comma_first: false,
              e4x: false,
              indent_empty_lines: false
            });
            editor.setValue(beautified, -1);
          } catch (e) {
            console.error('HTML beautification failed:', e);
          }
        }
      });
    }

    // Cleanup function
    return () => {
      if (aceEditorRef.current) {
        aceEditorRef.current.destroy();
        aceEditorRef.current = null;
      }
    };
  }, []);

  // Update value when prop changes
  useEffect(() => {
    if (aceEditorRef.current && aceEditorRef.current.getValue() !== value) {
      aceEditorRef.current.setValue(value || '', -1);
    }
  }, [value]);

  return (
    <div className={`ace-editor-container ${className}`}>
      <div
        ref={editorRef}
        style={{
          width: '100%',
          height: `${Math.max(rows * 20, 120)}px`,
          border: '1px solid #333',
          borderRadius: '4px',
          overflow: 'hidden',
          backgroundColor: theme === 'monokai' ? '#272822' : '#fff'
        }}
        {...props}
      />
      <div style={{
        fontSize: '11px',
        color: '#757575',
        marginTop: '4px',
        fontStyle: 'italic'
      }}>
        {__('Use Ctrl+Alt+F (Cmd+Alt+F) to beautify HTML', 'universal-block')}
      </div>
    </div>
  );
}

export default AceEditor;