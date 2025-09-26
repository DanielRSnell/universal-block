import { InnerBlocks } from '@wordpress/block-editor';

export default function Save({ attributes }) {
	const { elementType } = attributes;

	// For container elements, we need to save the InnerBlocks content
	if (elementType === 'container') {
		return <InnerBlocks.Content />;
	}

	// All other blocks use dynamic rendering
	return null;
}