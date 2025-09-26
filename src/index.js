import { registerBlockType } from '@wordpress/blocks';
import Edit from './components/Edit';
import Save from './components/Save';
import { transforms } from './transforms';
import './style.scss';

registerBlockType('universal-block/element', {
	icon: 'editor-code',
	attributes: {
		elementType: { type: 'string', default: 'text' },
		tagName: { type: 'string', default: 'p' },
		globalAttrs: { type: 'object', default: {} },
		content: { type: 'string' },
		href: { type: 'string' },
		target: { type: 'string', default: '' },
		rel: { type: 'string', default: '' },
		src: { type: 'string' },
		alt: { type: 'string' },
		width: { type: 'number' },
		height: { type: 'number' },
		selfClosing: { type: 'boolean', default: false }
	},
	edit: Edit,
	save: Save,
	transforms
});