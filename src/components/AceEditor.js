/**
 * Ace Editor Component
 *
 * Wraps Ace Editor for HTML editing with Emmet support and beautification
 */

import { useEffect, useRef } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

export function AceEditor({ value, onChange, placeholder, rows = 8, ...props }) {
	const editorRef = useRef(null);
	const aceEditorRef = useRef(null);

	useEffect(() => {
		if (!editorRef.current || !window.ace) return;

		// Initialize Ace Editor
		const editor = window.ace.edit(editorRef.current);
		aceEditorRef.current = editor;

		// Configure editor
		editor.setTheme('ace/theme/github');
		editor.session.setMode('ace/mode/html');
		editor.setOptions({
			fontSize: 13,
			fontFamily: 'monospace',
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

		// Add Emmet support if available
		if (window.emmet) {
			try {
				// Basic Emmet integration
				editor.commands.addCommand({
					name: 'expandEmmet',
					bindKey: { win: 'Tab', mac: 'Tab' },
					exec: function(editor) {
						const cursor = editor.getCursorPosition();
						const line = editor.session.getLine(cursor.row);
						const textBefore = line.substring(0, cursor.column);

						// Simple emmet expansion for common patterns
						if (textBefore.match(/[\w\-\.#]+$/)) {
							try {
								const expanded = window.emmet.expand(textBefore.match(/[\w\-\.#]+$/)[0]);
								if (expanded) {
									const range = editor.selection.getRange();
									range.start.column = cursor.column - textBefore.match(/[\w\-\.#]+$/)[0].length;
									range.end.column = cursor.column;
									editor.session.replace(range, expanded);
									return;
								}
							} catch (e) {
								// Fall back to normal tab behavior
							}
						}

						// Default tab behavior
						editor.indent();
					}
				});
			} catch (e) {
				console.log('Emmet integration failed:', e);
			}
		}

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
		<div>
			<div
				ref={editorRef}
				style={{
					width: '100%',
					height: `${rows * 20}px`,
					border: '1px solid #949494',
					borderRadius: '0',
					backgroundColor: '#fff'
				}}
				{...props}
			/>
			<div style={{
				fontSize: '11px',
				color: '#757575',
				marginTop: '4px',
				fontStyle: 'italic'
			}}>
				{__('Use Tab for Emmet expansion, Ctrl+Alt+F (Cmd+Alt+F) to beautify', 'universal-block')}
			</div>
		</div>
	);
}