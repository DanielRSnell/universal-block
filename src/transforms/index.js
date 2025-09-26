import { createBlock } from '@wordpress/blocks';
import { __ } from '@wordpress/i18n';

export const transforms = {
	from: [
		{
			type: 'block',
			blocks: ['core/paragraph'],
			transform: (attributes) => {
				return createBlock('universal-block/element', {
					elementType: 'text',
					tagName: 'p',
					content: attributes.content
				});
			}
		},
		{
			type: 'block',
			blocks: ['core/heading'],
			transform: (attributes) => {
				return createBlock('universal-block/element', {
					elementType: 'heading',
					tagName: `h${attributes.level || 2}`,
					content: attributes.content
				});
			}
		},
		{
			type: 'block',
			blocks: ['core/separator'],
			transform: () => {
				return createBlock('universal-block/element', {
					elementType: 'rule',
					tagName: 'hr',
					selfClosing: true
				});
			}
		},
		{
			type: 'block',
			blocks: ['core/button'],
			transform: (attributes) => {
				return createBlock('universal-block/element', {
					elementType: 'link',
					tagName: 'a',
					content: attributes.text,
					href: attributes.url,
					target: attributes.linkTarget
				});
			}
		},
		{
			type: 'block',
			blocks: ['core/image'],
			transform: (attributes) => {
				return createBlock('universal-block/element', {
					elementType: 'image',
					tagName: 'img',
					src: attributes.url,
					alt: attributes.alt,
					width: attributes.width,
					height: attributes.height,
					selfClosing: true
				});
			}
		},
		{
			type: 'raw',
			priority: 20,
			selector: '*',
			transform: (node) => {
				if (node.nodeType !== Node.ELEMENT_NODE) {
					return null;
				}

				const tagName = node.tagName.toLowerCase();
				let elementType = 'text';
				let content = node.textContent || '';
				let attributes = {};

				// Determine element type based on tag
				if (['h1', 'h2', 'h3', 'h4', 'h5', 'h6'].includes(tagName)) {
					elementType = 'heading';
				} else if (tagName === 'a') {
					elementType = 'link';
					attributes.href = node.getAttribute('href') || '';
					attributes.target = node.getAttribute('target') || '';
					attributes.rel = node.getAttribute('rel') || '';
				} else if (tagName === 'img') {
					elementType = 'image';
					attributes.src = node.getAttribute('src') || '';
					attributes.alt = node.getAttribute('alt') || '';
					attributes.width = parseInt(node.getAttribute('width')) || undefined;
					attributes.height = parseInt(node.getAttribute('height')) || undefined;
					attributes.selfClosing = true;
					content = '';
				} else if (tagName === 'hr') {
					elementType = 'rule';
					attributes.selfClosing = true;
					content = '';
				} else if (['div', 'section', 'article', 'main', 'aside', 'header', 'footer'].includes(tagName)) {
					elementType = 'container';
				}

				// Collect global attributes
				const globalAttrs = {};
				for (let i = 0; i < node.attributes.length; i++) {
					const attr = node.attributes[i];
					if (!['href', 'target', 'rel', 'src', 'alt', 'width', 'height'].includes(attr.name)) {
						globalAttrs[attr.name] = attr.value;
					}
				}

				return createBlock('universal-block/element', {
					elementType,
					tagName,
					content,
					globalAttrs,
					...attributes
				});
			}
		}
	],
	to: [
		{
			type: 'block',
			blocks: ['core/paragraph'],
			isMatch: (attributes) => {
				return attributes.elementType === 'text' && ['p', 'span', 'div'].includes(attributes.tagName);
			},
			transform: (attributes) => {
				return createBlock('core/paragraph', {
					content: attributes.content
				});
			}
		},
		{
			type: 'block',
			blocks: ['core/heading'],
			isMatch: (attributes) => {
				return attributes.elementType === 'heading';
			},
			transform: (attributes) => {
				const level = parseInt(attributes.tagName.replace('h', '')) || 2;
				return createBlock('core/heading', {
					content: attributes.content,
					level
				});
			}
		},
		{
			type: 'block',
			blocks: ['core/separator'],
			isMatch: (attributes) => {
				return attributes.elementType === 'rule';
			},
			transform: () => {
				return createBlock('core/separator');
			}
		},
		{
			type: 'block',
			blocks: ['core/button'],
			isMatch: (attributes) => {
				return attributes.elementType === 'link' && attributes.href;
			},
			transform: (attributes) => {
				return createBlock('core/button', {
					text: attributes.content,
					url: attributes.href,
					linkTarget: attributes.target
				});
			}
		},
		{
			type: 'block',
			blocks: ['core/image'],
			isMatch: (attributes) => {
				return attributes.elementType === 'image' && attributes.src;
			},
			transform: (attributes) => {
				return createBlock('core/image', {
					url: attributes.src,
					alt: attributes.alt,
					width: attributes.width,
					height: attributes.height
				});
			}
		}
	]
};