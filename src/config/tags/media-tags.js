/**
 * Media Tags Configuration
 *
 * Defines media-related HTML elements (images, video, audio, etc.).
 */

import { createTagConfig, createVoidTag, TAG_CATEGORIES, CONTENT_TYPES, COMMON_ATTRS } from './base-tag';

export const mediaTags = {
	// Images
	'img': createVoidTag('img', 'Image', TAG_CATEGORIES.MEDIA, {
		description: 'Embedded image',
		requiredAttrs: ['src', 'alt'],
		commonAttrs: [...COMMON_ATTRS.GLOBAL, ...COMMON_ATTRS.MEDIA, 'loading', 'srcset', 'sizes'],
		specialControls: ['MediaUpload', 'ImageSettings'],
		validation: {
			recommendations: {
				'always': [
					'Always include alt text for accessibility',
					'Consider using loading="lazy" for performance',
					'Use appropriate image formats (WebP, AVIF for modern browsers)'
				]
			},
			warnings: ['Images without alt text are not accessible to screen readers']
		}
	}),

	// Video
	'video': createTagConfig({
		label: 'Video',
		category: TAG_CATEGORIES.MEDIA,
		description: 'Embedded video content',
		contentTypeOptions: [CONTENT_TYPES.EMPTY, CONTENT_TYPES.HTML],
		defaultContentType: CONTENT_TYPES.EMPTY,
		selfClosing: false,
		commonAttrs: [
			...COMMON_ATTRS.GLOBAL,
			...COMMON_ATTRS.MEDIA,
			'src', 'poster', 'preload', 'autoplay', 'loop', 'muted', 'controls'
		],
		specialControls: ['MediaUpload', 'VideoSettings'],
		validation: {
			recommendations: {
				'autoplay': ['Avoid autoplay - it can be disruptive to users'],
				'muted': ['Muted autoplay is more acceptable than unmuted'],
				'controls': ['Include controls for user accessibility']
			}
		}
	}),

	// Audio
	'audio': createTagConfig({
		label: 'Audio',
		category: TAG_CATEGORIES.MEDIA,
		description: 'Embedded audio content',
		contentTypeOptions: [CONTENT_TYPES.EMPTY, CONTENT_TYPES.HTML],
		defaultContentType: CONTENT_TYPES.EMPTY,
		selfClosing: false,
		commonAttrs: [
			...COMMON_ATTRS.GLOBAL,
			'src', 'preload', 'autoplay', 'loop', 'muted', 'controls'
		],
		specialControls: ['MediaUpload', 'AudioSettings'],
		validation: {
			recommendations: {
				'always': ['Provide fallback content for browsers that don\'t support audio'],
				'autoplay': ['Avoid autoplay for audio content']
			}
		}
	}),

	// Picture (responsive images)
	'picture': createTagConfig({
		label: 'Picture',
		category: TAG_CATEGORIES.MEDIA,
		description: 'Container for multiple image sources (responsive images)',
		contentTypeOptions: [CONTENT_TYPES.HTML],
		defaultContentType: CONTENT_TYPES.HTML,
		selfClosing: false,
		specialControls: ['ResponsiveImageBuilder'],
		validation: {
			recommendations: {
				'always': [
					'Should contain <source> elements and one <img> element',
					'The <img> element should be the last child'
				]
			}
		}
	}),

	// Source (for picture, video, audio)
	'source': createVoidTag('source', 'Source', TAG_CATEGORIES.MEDIA, {
		description: 'Media resource for picture, video, or audio elements',
		commonAttrs: [...COMMON_ATTRS.GLOBAL, 'src', 'type', 'media', 'srcset', 'sizes'],
		validation: {
			recommendations: {
				'always': ['Use type attribute to help browsers choose appropriate source']
			}
		}
	}),

	// Track (for video/audio subtitles, captions, etc.)
	'track': createVoidTag('track', 'Track', TAG_CATEGORIES.MEDIA, {
		description: 'Text track for video/audio (subtitles, captions, descriptions)',
		commonAttrs: [...COMMON_ATTRS.GLOBAL, 'src', 'kind', 'srclang', 'label', 'default'],
		validation: {
			recommendations: {
				'always': [
					'Use kind attribute to specify track type (subtitles, captions, etc.)',
					'Use srclang for text tracks in different languages'
				]
			}
		}
	}),

	// Embed (generic embedded content)
	'embed': createVoidTag('embed', 'Embed', TAG_CATEGORIES.MEDIA, {
		description: 'Generic embedded content (plugins, external applications)',
		commonAttrs: [...COMMON_ATTRS.GLOBAL, 'src', 'type', 'width', 'height'],
		validation: {
			warnings: [
				'Embed elements depend on plugins and may not work on all devices',
				'Consider using modern alternatives like <video>, <audio>, or <iframe>'
			]
		}
	}),

	// Object (embedded content with fallback)
	'object': createTagConfig({
		label: 'Object',
		category: TAG_CATEGORIES.MEDIA,
		description: 'Embedded content with fallback (images, videos, plugins)',
		contentTypeOptions: [CONTENT_TYPES.HTML, CONTENT_TYPES.TEXT],
		defaultContentType: CONTENT_TYPES.HTML,
		selfClosing: false,
		commonAttrs: [...COMMON_ATTRS.GLOBAL, 'data', 'type', 'width', 'height', 'name'],
		validation: {
			recommendations: {
				'always': ['Provide fallback content for when the object cannot be displayed']
			}
		}
	}),

	// Param (parameters for object)
	'param': createVoidTag('param', 'Parameter', TAG_CATEGORIES.MEDIA, {
		description: 'Parameter for object element',
		commonAttrs: ['name', 'value'],
		validation: {
			warnings: ['Param elements are only valid inside object elements']
		}
	}),

	// Canvas (for dynamic graphics)
	'canvas': createTagConfig({
		label: 'Canvas',
		category: TAG_CATEGORIES.MEDIA,
		description: 'Drawing surface for dynamic graphics via JavaScript',
		contentType: CONTENT_TYPES.TEXT, // Fallback content only
		selfClosing: false,
		commonAttrs: [...COMMON_ATTRS.GLOBAL, 'width', 'height'],
		validation: {
			recommendations: {
				'always': ['Provide fallback content for browsers that don\'t support canvas']
			}
		}
	}),

	// SVG (inline)
	'svg': createTagConfig({
		label: 'SVG',
		category: TAG_CATEGORIES.MEDIA,
		description: 'Inline Scalable Vector Graphics',
		contentType: CONTENT_TYPES.HTML,
		selfClosing: false,
		commonAttrs: [
			...COMMON_ATTRS.GLOBAL,
			'viewBox', 'width', 'height', 'preserveAspectRatio',
			'xmlns', 'fill', 'stroke', 'stroke-width'
		],
		specialControls: ['SVGEditor'],
		validation: {
			recommendations: {
				'always': [
					'Use viewBox for scalable SVGs',
					'Include title and desc elements for accessibility'
				]
			}
		}
	}),

	// Map and Area (image maps)
	'map': createTagConfig({
		label: 'Image Map',
		category: TAG_CATEGORIES.MEDIA,
		description: 'Container for clickable areas in an image',
		contentTypeOptions: [CONTENT_TYPES.HTML],
		defaultContentType: CONTENT_TYPES.HTML,
		selfClosing: false,
		commonAttrs: [...COMMON_ATTRS.GLOBAL, 'name'],
		validation: {
			recommendations: {
				'always': ['Should contain <area> elements defining clickable regions']
			}
		}
	}),

	'area': createVoidTag('area', 'Clickable Area', TAG_CATEGORIES.MEDIA, {
		description: 'Clickable area within an image map',
		commonAttrs: [...COMMON_ATTRS.GLOBAL, 'shape', 'coords', 'href', 'alt', 'target'],
		validation: {
			recommendations: {
				'always': ['Always include alt text for accessibility']
			},
			warnings: ['Area elements are only valid inside map elements']
		}
	})
};