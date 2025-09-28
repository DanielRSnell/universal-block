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

registerBlockType('universal/element', {
	icon: 'editor-code',
	attributes: {
		blockName: { type: 'string', default: '' },
		elementType: { type: 'string', default: 'text' }, // Legacy
		tagName: { type: 'string', default: 'p' },
		contentType: { type: 'string' }, // New system - no default to avoid override
		globalAttrs: { type: 'object', default: {} },
		content: { type: 'string', default: '' },
		selfClosing: { type: 'boolean', default: false },
		uiState: {
			type: 'object',
			default: {
				tagCategory: 'common',
				selectedTagName: '',
				selectedContentType: ''
			}
		}
	},
	edit: Edit,
	save: Save,
	transforms,
	__experimentalLabel: (attributes, { context }) => {
		const { blockName, tagName, elementType } = attributes;

		// Use custom block name if set
		if (blockName) {
			return blockName;
		}

		// Use tag name (new system) - capitalize the tag name
		if (tagName) {
			return tagName.charAt(0).toUpperCase() + tagName.slice(1);
		}

		// Fallback to legacy element type names for backward compatibility
		return ELEMENT_TYPE_NAMES[elementType] || __('Universal Element', 'universal-block');
	}
});