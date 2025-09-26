import { registerBlockType } from '@wordpress/blocks';
import { __ } from '@wordpress/i18n';
import Edit from './components/Edit';
import Save from './components/Save';
import { transforms } from './transforms';
import './style.scss';

const ELEMENT_TYPE_NAMES = {
	text: __('Text', 'universal-block'),
	heading: __('Heading', 'universal-block'),
	link: __('Link', 'universal-block'),
	image: __('Image', 'universal-block'),
	rule: __('Rule', 'universal-block'),
	container: __('Container', 'universal-block')
};

registerBlockType('universal-block/element', {
	icon: 'editor-code',
	attributes: {
		blockName: { type: 'string', default: '' },
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
	transforms,
	__experimentalLabel: (attributes, { context }) => {
		const { blockName, elementType } = attributes;

		// Use custom block name if set, otherwise use element type name
		if (blockName) {
			return blockName;
		}

		return ELEMENT_TYPE_NAMES[elementType] || __('Universal Element', 'universal-block');
	}
});