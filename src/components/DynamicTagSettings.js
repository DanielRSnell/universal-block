import { __ } from '@wordpress/i18n';
import { TextControl, TextareaControl } from '@wordpress/components';

/**
 * Dynamic Tag Settings Component
 *
 * Handles special attribute inputs for dynamic tags (loop, if, set)
 * These tags are parsed by the Dynamic Tag Parser into Twig syntax
 */
export default function DynamicTagSettings({ tagName, globalAttrs, setAttributes }) {
	// Update a specific globalAttr
	const updateGlobalAttr = (key, value) => {
		setAttributes({
			globalAttrs: {
				...globalAttrs,
				[key]: value
			}
		});
	};

	// Loop tag: source attribute
	// Example: "post in posts" or "item in items"
	if (tagName === 'loop') {
		return (
			<>
				<TextControl
					label={__('Loop Source', 'universal-block')}
					value={globalAttrs.source || ''}
					onChange={(value) => updateGlobalAttr('source', value)}
					placeholder="item in posts"
					help={__('Loop syntax: "item in collection". Example: "post in posts" or "product in site.products"', 'universal-block')}
					style={{ fontFamily: 'Monaco, Menlo, monospace' }}
				/>
				{globalAttrs.source && (
					<div style={{
						marginTop: '8px',
						padding: '10px',
						background: '#f0f0f0',
						borderRadius: '4px',
						fontSize: '11px',
						fontFamily: 'Monaco, Menlo, monospace'
					}}>
						<strong>Twig Output:</strong><br/>
						<code style={{ display: 'block', marginTop: '4px' }}>
							{`{% for ${globalAttrs.source} %}`}
						</code>
					</div>
				)}
			</>
		);
	}

	// If tag: source attribute (condition)
	// Example: "user is defined" or "post.status == 'publish'"
	if (tagName === 'if') {
		return (
			<>
				<TextareaControl
					label={__('Condition', 'universal-block')}
					value={globalAttrs.source || ''}
					onChange={(value) => updateGlobalAttr('source', value)}
					placeholder="user is defined"
					help={__('Twig condition. Examples: "user is defined", "post.status == \'publish\'", "items|length > 0"', 'universal-block')}
					rows={3}
					style={{ fontFamily: 'Monaco, Menlo, monospace' }}
				/>
				{globalAttrs.source && (
					<div style={{
						marginTop: '8px',
						padding: '10px',
						background: '#f0f0f0',
						borderRadius: '4px',
						fontSize: '11px',
						fontFamily: 'Monaco, Menlo, monospace'
					}}>
						<strong>Twig Output:</strong><br/>
						<code style={{ display: 'block', marginTop: '4px' }}>
							{`{% if ${globalAttrs.source} %}`}
						</code>
					</div>
				)}
			</>
		);
	}

	// Set tag: variable and value attributes
	// Example: variable="posts", value="fn.get_posts()"
	if (tagName === 'set') {
		return (
			<>
				<TextControl
					label={__('Variable Name', 'universal-block')}
					value={globalAttrs.variable || ''}
					onChange={(value) => updateGlobalAttr('variable', value)}
					placeholder="posts"
					help={__('Variable name (letters, numbers, underscores only)', 'universal-block')}
					style={{ fontFamily: 'Monaco, Menlo, monospace' }}
				/>
				<TextareaControl
					label={__('Value/Source', 'universal-block')}
					value={globalAttrs.value || ''}
					onChange={(value) => updateGlobalAttr('value', value)}
					placeholder="fn.get_posts()"
					help={__('Twig expression. Examples: "fn.get_posts()", "post.title", "[1, 2, 3]"', 'universal-block')}
					rows={3}
					style={{ fontFamily: 'Monaco, Menlo, monospace', marginTop: '12px' }}
				/>
				{globalAttrs.variable && globalAttrs.value && (
					<div style={{
						marginTop: '8px',
						padding: '10px',
						background: '#f0f0f0',
						borderRadius: '4px',
						fontSize: '11px',
						fontFamily: 'Monaco, Menlo, monospace'
					}}>
						<strong>Twig Output:</strong><br/>
						<code style={{ display: 'block', marginTop: '4px', wordBreak: 'break-all' }}>
							{`{% set ${globalAttrs.variable} = ${globalAttrs.value} %}`}
						</code>
					</div>
				)}
			</>
		);
	}

	// Not a dynamic tag
	return null;
}
