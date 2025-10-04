# Preview Context System

The Preview Context system allows you to configure what Timber/Twig data is available in the block editor for testing dynamic content with real data.

## Overview

The preview context is automatically detected from the current page being edited, or can be manually configured for any context (useful in Full Site Editor or template files where context doesn't exist).

All preview data is stored in `window.universal.preview` and persisted to user meta.

## Data Structure

### `window.universal.preview` Object

```javascript
{
  // Auto-detected context information
  type: 'singular',           // Context type: singular, archive, front_page, posts_page, template, unknown
  post_type: 'page',          // Post type being edited (if applicable)
  post_id: 42058,             // Post ID being edited (if applicable)
  template: '',               // Page template slug (if applicable)
  post_status: 'publish',     // Post status
  is_edit: true,              // Whether we're in edit mode

  // Post metadata (when available)
  meta: {
    title: 'Page Title',
    slug: 'page-slug',
    author_id: 1,
    parent_id: 0,
    menu_order: 0,
    date_created: '2024-01-01 00:00:00',
    date_modified: '2024-01-15 10:30:00'
  },

  // User-configured settings
  settings: {
    enabled: false,           // Whether preview is enabled
    auto_detect: true,        // Use auto-detected context vs manual
    source_type: 'post_type', // 'post_type' or 'taxonomy'

    // Post Type settings
    context_type: 'singular', // singular, archive, front_page, posts_page, search, 404
    post_type: 'page',        // page, post, product, etc.
    post_id: 0,               // Specific post ID (for singular)

    // Taxonomy settings
    taxonomy: '',             // category, post_tag, product_cat, product_tag
    term_id: 0,               // Specific term ID

    // WooCommerce settings
    woo_page: ''              // shop, cart, checkout, my_account, thank_you
  }
}
```

## Auto-Detection

The system automatically detects context when editing posts/pages:

### Detection Priority:
1. **URL Parameter** - Checks `$_GET['post']` parameter
2. **Global Post** - Falls back to global `$post` object
3. **Screen Detection** - Uses `get_current_screen()` as backup

### Example Auto-Detected Contexts:

**Editing a Page:**
```javascript
{
  type: 'singular',
  post_type: 'page',
  post_id: 42058,
  is_edit: true,
  meta: { title: 'About Us', ... }
}
```

**Editing the Front Page:**
```javascript
{
  type: 'front_page',
  post_type: 'page',
  post_id: 12,
  is_edit: true
}
```

**Full Site Editor (No Context):**
```javascript
{
  type: 'unknown',
  is_edit: false
}
```

## Manual Configuration

When auto-detect is disabled, you can manually configure any context:

### Post Type Contexts

#### Singular Post/Page
```javascript
settings: {
  enabled: true,
  auto_detect: false,
  source_type: 'post_type',
  context_type: 'singular',
  post_type: 'page',
  post_id: 123
}
```

#### Archive
```javascript
settings: {
  enabled: true,
  auto_detect: false,
  source_type: 'post_type',
  context_type: 'archive',
  post_type: 'post'
}
```

#### Front Page
```javascript
settings: {
  enabled: true,
  auto_detect: false,
  source_type: 'post_type',
  context_type: 'front_page'
}
```

### Taxonomy Contexts

#### Category Archive
```javascript
settings: {
  enabled: true,
  auto_detect: false,
  source_type: 'taxonomy',
  taxonomy: 'category',
  term_id: 5
}
```

#### Product Category
```javascript
settings: {
  enabled: true,
  auto_detect: false,
  source_type: 'taxonomy',
  taxonomy: 'product_cat',
  term_id: 15
}
```

## WooCommerce Integration

### Product Single Page
Use **Post Type** source with:
- Context Type: `singular`
- Post Type: `product`
- Post ID: (specific product ID)

```javascript
settings: {
  source_type: 'post_type',
  context_type: 'singular',
  post_type: 'product',
  post_id: 456
}
```

### Product Category Archive
Use **Taxonomy** source with:
- Taxonomy: `product_cat`
- Term ID: (specific category ID)

```javascript
settings: {
  source_type: 'taxonomy',
  taxonomy: 'product_cat',
  term_id: 12
}
```

### WooCommerce Special Pages

#### Shop Page (Main Store)
```javascript
settings: {
  source_type: 'post_type',
  woo_page: 'shop'
}
```

#### Cart Page
```javascript
settings: {
  source_type: 'post_type',
  woo_page: 'cart'
}
```

#### Checkout Page
```javascript
settings: {
  source_type: 'post_type',
  woo_page: 'checkout'
}
```

#### My Account Page
```javascript
settings: {
  source_type: 'post_type',
  woo_page: 'my_account'
}
```

#### Thank You / Order Received
```javascript
settings: {
  source_type: 'post_type',
  woo_page: 'thank_you'
}
```

## UI Controls

### Preview Settings Drawer
Access via the eye icon in the sidebar.

#### Enable Preview Toggle
- Enables/disables live Timber/Twig data in editor
- When enabled, dynamic tags render with real data

#### Auto-Detect Context
- ✅ **Checked**: Uses current page context automatically
- ❌ **Unchecked**: Allows manual configuration

#### Source Type Buttons
- **Post Type**: Configure post-based contexts
- **Taxonomy**: Configure taxonomy-based contexts

#### Context Fields
Fields appear/disappear based on selections:
- **Context Type** → determines if Post Type and Post ID show
- **Post Type** → only for singular/archive
- **Post ID** → only for singular
- **Taxonomy** → only when taxonomy source selected
- **Term ID** → only when taxonomy selected
- **WooCommerce Pages** → always available for special pages

## PHP Backend

### Context Generation
```php
// Generate context for current page
$context = Universal_Block_Preview_Context::generate_context();

// Returns array with type, post_type, post_id, meta, settings, etc.
```

### Saving Settings
```php
// Save user settings to user meta
Universal_Block_Preview_Context::save_user_settings( $settings );

// Get user settings
$settings = Universal_Block_Preview_Context::get_user_settings();
```

### Timber Context Generation
```php
// Generate Timber context based on preview settings
$timber_context = Universal_Block_Preview_Context::generate_timber_context( $preview_context );

// Returns Timber context with:
// - $timber_context['post'] - Current post (if applicable)
// - $timber_context['is_preview'] - true
// - $timber_context['preview_type'] - Context type
```

## REST API

### Get Settings
```http
GET /wp-json/universal-block/v1/preview-settings
```

Response:
```json
{
  "enabled": false,
  "auto_detect": true,
  "source_type": "post_type",
  "context_type": "singular",
  "post_type": "page",
  "post_id": 0,
  "taxonomy": "",
  "term_id": 0,
  "woo_page": ""
}
```

### Save Settings
```http
POST /wp-json/universal-block/v1/preview-settings
Content-Type: application/json

{
  "enabled": true,
  "auto_detect": false,
  "source_type": "taxonomy",
  "taxonomy": "product_cat",
  "term_id": 15
}
```

Response:
```json
{
  "success": true,
  "settings": { ... }
}
```

## Use Cases

### Testing in Full Site Editor
1. Open any template in FSE
2. Click eye icon in sidebar
3. Uncheck "Auto-Detect Context"
4. Select context type (e.g., Singular → Product)
5. Enter a product ID
6. Enable preview
7. Dynamic tags now render with that product's data

### Testing Product Categories
1. Open any page/template
2. Click eye icon
3. Uncheck "Auto-Detect Context"
4. Select "Taxonomy" source type
5. Select "Product Category" taxonomy
6. Enter category term ID
7. Enable preview
8. Test loop blocks with product category data

### Testing WooCommerce Checkout
1. Open any page/template
2. Click eye icon
3. Uncheck "Auto-Detect Context"
4. Select "WooCommerce Pages" → "Checkout"
5. Enable preview
6. Test checkout-specific blocks/data

## Filter Hooks

### Custom Context Filter
You can add custom context data using the block context filter:

```php
add_filter( 'universal_block/context/{context_name}', function( $context, $block_id ) {
  // Add custom data to context
  $context['custom_data'] = 'my data';
  return $context;
}, 10, 2 );
```

### Preview Context Filter
Modify preview context before it's used:

```php
add_filter( 'universal_block/preview_context', function( $preview_context ) {
  // Modify preview context
  if ( $preview_context['type'] === 'shop' ) {
    // Add shop-specific data
  }
  return $preview_context;
} );
```

## Available Taxonomies

### WordPress Core
- `category` - Post Categories
- `post_tag` - Post Tags

### WooCommerce
- `product_cat` - Product Categories
- `product_tag` - Product Tags

### Custom Taxonomies
You can extend the UI by adding custom taxonomies to the dropdown (modify `PreviewSettingsDrawer.js`).

## Available Post Types

### WordPress Core
- `page` - Pages
- `post` - Posts

### WooCommerce
- `product` - Products

### Custom Post Types
You can extend the UI by adding custom post types to the dropdown (modify `PreviewSettingsDrawer.js`).

## Debugging

### Check Current Context
```javascript
// In browser console
console.log( window.universal.preview );
```

### Check if Preview is Enabled
```javascript
if ( window.universal?.preview?.settings?.enabled ) {
  console.log( 'Preview is enabled' );
}
```

### Check Source Type
```javascript
const sourceType = window.universal?.preview?.settings?.source_type;
if ( sourceType === 'taxonomy' ) {
  console.log( 'Using taxonomy context' );
}
```

## Best Practices

1. **Use Auto-Detect When Possible** - It's more reliable and automatically updates
2. **Manual for Templates** - Use manual configuration in FSE or when context is missing
3. **Test Different Contexts** - Switch between contexts to test all scenarios
4. **Save Common Configs** - Settings persist per user, so frequently used configs are remembered
5. **Combine with Block Context** - Use both preview settings and block-specific context for maximum flexibility

## Troubleshooting

### Context Not Detected
- Ensure you're on a post/page edit screen
- Check URL has `?post=` parameter
- Try manual configuration as fallback

### WooCommerce Pages Not Working
- Ensure WooCommerce is active
- Verify page IDs are set in WooCommerce settings
- Check if product data exists

### Taxonomy Terms Not Loading
- Verify term ID is correct
- Ensure taxonomy exists
- Check term has posts/products assigned

### Settings Not Saving
- Check user has `edit_posts` capability
- Verify REST API is accessible
- Check browser console for errors
