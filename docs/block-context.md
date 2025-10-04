# Block Context System

The Block Context system allows you to add custom Timber/Twig context data to specific Universal Blocks without impacting performance. This is particularly useful when you need specialized data for certain blocks (like product galleries, user profiles, etc.) without loading that data globally for every block on the page.

## Overview

By default, all Universal Blocks share the same base Timber context. However, when you need custom data for specific use cases, you can:

1. Assign a **Block Context** name to your Universal Block
2. Create a filter that only fires for blocks with that context name
3. Add your custom data to those specific blocks only

## Why Use Block Context?

### The Problem

Without Block Context, if you wanted to add custom data to the Timber context, you'd use the global `timber/context` filter:

```php
add_filter('timber/context', function ($context) {
    // This expensive query runs for EVERY block on the page
    $context['my_custom_data'] = expensive_database_query();
    return $context;
});
```

**Problem:** With 10 Universal Blocks on a page, this filter fires 10 times, running your expensive query 10 times.

### The Solution

With Block Context, you can target specific blocks:

```php
add_filter('universal_block/context/my_custom_context', function($context, $block) {
    // This only runs for blocks with blockContext="my_custom_context"
    $context['my_custom_data'] = expensive_database_query();
    return $context;
}, 10, 2);
```

**Result:** The expensive query only runs for blocks that need it.

## Performance Benefits

The Block Context system uses a cached base context:

1. **Base Timber context runs once** per page load (cached in static variable)
2. **Global `timber/context` filters run once** (when base context is created)
3. **Context-specific filters only run for blocks that need them**

Example with 10 blocks on a page:
- **Without Block Context:** Custom `timber/context` filter runs 10 times
- **With Block Context:** Base context runs once, custom filter runs only for blocks with that context name

## How to Use

### Step 1: Set Block Context in Editor

1. Select your Universal Block
2. Open the **Block Context** panel in the sidebar
3. Enter a context name (e.g., `product_gallery`, `user_profile`, `custom_data`)

The context name should be:
- Lowercase with underscores
- Descriptive of what data it provides
- Unique to that use case

### Step 2: Create Context Filter in Theme

Add a filter using the pattern `universal_block/context/{context_name}`:

```php
add_filter('universal_block/context/product_gallery', function($context, $block) {
    // Your custom logic here
    return $context;
}, 10, 2);
```

### Filter Parameters

- **`$context`** (array): The base Timber context (already includes post, user, etc.)
- **`$block`** (array): The block data including all attributes

### Filter Return

Return the modified `$context` array with your additions.

## Examples

### Example 1: Product Gallery (WooCommerce)

**Block Setup:**
- Block Context: `product_gallery`

**Theme Code:**
```php
add_filter('universal_block/context/product_gallery', function($context, $block) {
    // Only run on single product pages
    if (!is_product()) {
        return $context;
    }

    global $product;

    if (!$product) {
        return $context;
    }

    // Initialize product context
    $context['product'] = [];

    // Featured Image
    $featured_image_id = $product->get_image_id();
    if ($featured_image_id) {
        $context['product']['featured'] = [
            'url' => wp_get_attachment_image_url($featured_image_id, 'full'),
            'alt' => get_post_meta($featured_image_id, '_wp_attachment_image_alt', true),
        ];
    }

    // Gallery Images
    $gallery_ids = $product->get_gallery_image_ids();
    $gallery = [];

    foreach ($gallery_ids as $image_id) {
        $gallery[] = [
            'url' => wp_get_attachment_image_url($image_id, 'full'),
            'alt' => get_post_meta($image_id, '_wp_attachment_image_alt', true),
        ];
    }

    $context['product']['gallery'] = $gallery;

    return $context;
}, 10, 2);
```

**Block Usage:**
```html
<loop source="product.gallery">
    <img src="{{ url }}" alt="{{ alt }}" />
</loop>
```

### Example 2: Related Posts

**Block Setup:**
- Block Context: `related_posts`

**Theme Code:**
```php
add_filter('universal_block/context/related_posts', function($context, $block) {
    if (!is_single()) {
        return $context;
    }

    // Get related posts by category
    $categories = get_the_category();
    if (empty($categories)) {
        return $context;
    }

    $args = [
        'category__in' => array_map(function($cat) {
            return $cat->term_id;
        }, $categories),
        'post__not_in' => [get_the_ID()],
        'posts_per_page' => 3,
    ];

    $context['related_posts'] = Timber::get_posts($args);

    return $context;
}, 10, 2);
```

**Block Usage:**
```html
<loop source="related_posts">
    <article>
        <h3>{{ post.title }}</h3>
        <p>{{ post.preview }}</p>
    </article>
</loop>
```

### Example 3: User Profile Data

**Block Setup:**
- Block Context: `user_profile`

**Theme Code:**
```php
add_filter('universal_block/context/user_profile', function($context, $block) {
    if (!is_user_logged_in()) {
        return $context;
    }

    $user_id = get_current_user_id();

    // Add custom user meta
    $context['user_profile'] = [
        'avatar' => get_avatar_url($user_id, ['size' => 96]),
        'posts_count' => count_user_posts($user_id),
        'bio' => get_user_meta($user_id, 'description', true),
        'social' => [
            'twitter' => get_user_meta($user_id, 'twitter', true),
            'github' => get_user_meta($user_id, 'github', true),
        ],
    ];

    return $context;
}, 10, 2);
```

**Block Usage:**
```html
<div class="user-card">
    <img src="{{ user_profile.avatar }}" alt="{{ user.display_name }}" />
    <h3>{{ user.display_name }}</h3>
    <p>{{ user_profile.bio }}</p>
    <p>Posts: {{ user_profile.posts_count }}</p>
</div>
```

### Example 4: Conditional Context Based on Block Attributes

**Block Setup:**
- Block Context: `dynamic_content`
- Custom Attribute: `data-source="products"` (set in Attributes panel)

**Theme Code:**
```php
add_filter('universal_block/context/dynamic_content', function($context, $block) {
    // Access block attributes
    $attrs = $block['attrs'];
    $global_attrs = $attrs['globalAttrs'] ?? [];

    // Check custom data attribute
    $source = $global_attrs['data-source'] ?? '';

    switch ($source) {
        case 'products':
            $context['items'] = Timber::get_posts([
                'post_type' => 'product',
                'posts_per_page' => 6,
            ]);
            break;

        case 'testimonials':
            $context['items'] = Timber::get_posts([
                'post_type' => 'testimonial',
                'posts_per_page' => 3,
            ]);
            break;
    }

    return $context;
}, 10, 2);
```

**Block Usage:**
```html
<div data-source="products">
    <loop source="items">
        <div>{{ post.title }}</div>
    </loop>
</div>
```

## Best Practices

### 1. Use Descriptive Context Names
✅ Good: `product_gallery`, `related_posts`, `user_dashboard`
❌ Bad: `custom`, `data`, `context1`

### 2. Check Context Requirements
Always validate that required data exists before using it:

```php
add_filter('universal_block/context/product_data', function($context, $block) {
    // Check page type
    if (!is_product()) {
        return $context;
    }

    // Check global exists
    global $product;
    if (!$product) {
        return $context;
    }

    // Now safe to use
    $context['product_data'] = [...];

    return $context;
}, 10, 2);
```

### 3. Return Early When Not Needed
Save processing by returning immediately when context isn't applicable:

```php
add_filter('universal_block/context/woo_data', function($context, $block) {
    // Exit early if WooCommerce isn't active
    if (!class_exists('WooCommerce')) {
        return $context;
    }

    // Exit early if not a product page
    if (!is_product()) {
        return $context;
    }

    // Process...
    return $context;
}, 10, 2);
```

### 4. Use Same Context for Related Blocks
If multiple blocks need the same data, use the same context name:

```php
// Both "product_info" and "product_meta" blocks use same context
add_filter('universal_block/context/product', function($context, $block) {
    // Shared product data
    return $context;
}, 10, 2);
```

### 5. Combine with Block Attributes
Use block attributes to make context filters more flexible:

```php
add_filter('universal_block/context/posts_query', function($context, $block) {
    $attrs = $block['attrs']['globalAttrs'] ?? [];

    $post_type = $attrs['data-post-type'] ?? 'post';
    $count = $attrs['data-count'] ?? 10;

    $context['query_results'] = Timber::get_posts([
        'post_type' => $post_type,
        'posts_per_page' => $count,
    ]);

    return $context;
}, 10, 2);
```

## Debugging

### View Available Context
Enable debug mode to see what context is available:

```
?debug=true
```

This displays the Timber context in a draggable widget on the frontend.

### Add Logging
Debug your context filters:

```php
add_filter('universal_block/context/my_context', function($context, $block) {
    error_log('Block Context Filter Running');
    error_log('Block Attrs: ' . print_r($block['attrs'], true));

    // Your logic...

    error_log('Added Context: ' . print_r($context['my_data'], true));

    return $context;
}, 10, 2);
```

## Technical Details

### Filter Hook Pattern
```
universal_block/context/{context_name}
```

The `{context_name}` is sanitized using `sanitize_key()` for security.

### Execution Order
1. Base Timber context created (cached, runs once)
2. Global `timber/context` filters run (cached with base context)
3. For each Universal Block:
   - Check if `blockContext` attribute exists
   - If yes, run `universal_block/context/{name}` filter
   - Parse dynamic tags to Twig
   - Compile with (possibly modified) context

### Context Structure
The base context includes:
- `post` - Current post object
- `user` - Current user object
- `site` - Site data
- Any data added by `timber/context` filters

Your context filters receive a copy and can modify/extend it.

## Related Documentation

- [Dynamic Tags Documentation](dynamic-tags.md) - Using `<loop>`, `<if>`, `<set>` tags
- [Timber Documentation](https://timber.github.io/docs/) - Timber/Twig syntax
- [Attributes Panel](attributes.md) - Setting custom attributes like `data-*`
