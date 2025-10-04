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
	icon: (
		<svg width="18" height="22" viewBox="0 0 18 22" fill="none" xmlns="http://www.w3.org/2000/svg">
			<path d="M18 19.3527L16.8609 17.886H10.3108V16.3093H15.6414L14.5095 14.8427H10.3108V13.266H15.8677L14.8162 11.7993H10.3108V10.2227H13.6917L12.6402 8.756H10.3108V7.17933H13.5091L12.4795 5.71267H10.3108V4.136H11.3696L10.34 2.66933H10.3108V0L5.50588 6.72467L8.20771 6.732L2.75294 14.366H5.5643L0 22H10.3108V19.3527H18Z" fill="url(#paint0_radial_4_2)"/>
			<defs>
				<radialGradient id="paint0_radial_4_2" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(9 13) rotate(90) scale(9 7.36364)">
					<stop stopColor="#54FFB9"/>
					<stop offset="1" stopColor="#03D781"/>
				</radialGradient>
			</defs>
		</svg>
	),
	attributes: {
		blockName: { type: 'string', default: '' },
		elementType: { type: 'string', default: 'text' }, // Legacy
		tagName: { type: 'string', default: 'p' },
		contentType: { type: 'string' }, // New system - no default to avoid override
		globalAttrs: { type: 'object', default: {} },
		content: { type: 'string', default: '' },
		selfClosing: { type: 'boolean', default: false },
		isDynamic: { type: 'boolean', default: false },
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
		const { blockName, tagName, elementType, globalAttrs } = attributes;

		// Use custom block name if set
		if (blockName) {
			return blockName;
		}

		// Special handling for set elements
		if (tagName === 'set' && globalAttrs?.variable) {
			return `Set - ${globalAttrs.variable}`;
		}

		// Special handling for if elements
		if (tagName === 'if' && globalAttrs?.source) {
			return `If - ${globalAttrs.source}`;
		}

		// Special handling for loop elements
		if (tagName === 'loop' && (globalAttrs?.name || globalAttrs?.source)) {
			const displayName = globalAttrs.name || globalAttrs.source;
			return `Loop - ${displayName}`;
		}

		// Use tag name (new system) - capitalize the tag name
		if (tagName) {
			return tagName.charAt(0).toUpperCase() + tagName.slice(1);
		}

		// Fallback to legacy element type names for backward compatibility
		return ELEMENT_TYPE_NAMES[elementType] || __('Universal Element', 'universal-block');
	}
});