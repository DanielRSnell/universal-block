import { InnerBlocks } from '@wordpress/block-editor';

export default function Save({ attributes }) {
	const { elementType, contentType } = attributes;

	// For blocks content type, we need to save the InnerBlocks content
	if (contentType === 'blocks' || elementType === 'container') {
		return <InnerBlocks.Content />;
	}

	// All other blocks use dynamic rendering
	return null;
}