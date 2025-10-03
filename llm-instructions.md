# Universal Block - LLM Instructions for HTML Template Creation

## Overview

This document provides instructions for AI assistants (LLMs) on how to create HTML block templates for the Universal Block WordPress plugin. These templates can be pasted directly into the editor and will be automatically converted into WordPress Gutenberg blocks while preserving structure, attributes, and dynamic functionality.

## Quick Start

1. Write standard HTML markup
2. Use dynamic tags (`<set>`, `<loop>`, `<if>`) for dynamic content
3. Use Twig syntax (`{{ }}`) for variable output
4. Paste HTML into the Universal Block editor - it converts automatically to blocks

## HTML to Blocks Parser Capabilities

The parser converts HTML into Universal Blocks with **100% structure preservation**:

- ✅ Exact DOM hierarchy maintained
- ✅ All attributes preserved (classes, IDs, data attributes, etc.)
- ✅ Text and HTML content preserved
- ✅ Dynamic tags (`<set>`, `<loop>`, `<if>`) fully supported
- ✅ Twig/Timber syntax preserved
- ✅ Custom elements and web components supported
- ✅ SVG and complex markup preserved

## Content Type Detection

The parser automatically detects the appropriate content type for each element:

| Content Type | Auto-Detected When | Example |
|-------------|-------------------|---------|
| `text` | Element contains only text | `<p>Hello World</p>` |
| `blocks` | Element contains nested elements | `<div><p>A</p><p>B</p></div>` |
| `html` | Element has mixed content or complex markup | `<a>Text <strong>bold</strong></a>` |
| `empty` | Self-closing elements | `<img src="...">`, `<set variable="x" value="y" />` |

**You don't need to specify content types** - the parser figures it out automatically!

## Dynamic Tags

Universal Block provides three special tags for dynamic content using Timber/Twig integration:

### `<set>` - Variable Assignment

Creates variables for use in templates. **Always self-closing.**

**Attributes:**
- `variable` - Variable name to create
- `value` - Twig expression for the value

**Examples:**

```html
<!-- Simple variable -->
<set variable="site_name" value="site.name" />

<!-- ACF field -->
<set variable="hero_title" value="post.meta('hero_title')" />

<!-- Computed value -->
<set variable="user_count" value="users|length" />

<!-- String literal -->
<set variable="greeting" value="'Hello World'" />
```

**Usage in content:**
```html
<set variable="title" value="post.title" />
<h1>{{ title }}</h1>
```

### `<loop>` - Iteration

Repeats content for each item in a collection. **Contains child elements.**

**Attributes:**
- `source` - Twig expression for the data source

**Examples:**

```html
<!-- Loop through ACF repeater -->
<loop source="post.meta('team_members')">
  <div class="team-member">
    <h3>{{ item.name }}</h3>
    <p>{{ item.title }}</p>
  </div>
</loop>

<!-- Loop through posts -->
<loop source="posts">
  <article>
    <h2>{{ item.title }}</h2>
    <div>{{ item.content }}</div>
  </article>
</loop>

<!-- Loop with filter -->
<loop source="posts|filter(p => p.post_type == 'product')">
  <div class="product">{{ item.title }}</div>
</loop>
```

**Loop Variables:**
- `item` - Current item in the loop
- `loop.index` - Current iteration (1-based)
- `loop.index0` - Current iteration (0-based)
- `loop.first` - True if first iteration
- `loop.last` - True if last iteration

### `<if>` - Conditional Rendering

Shows content only when condition is true. **Contains child elements.**

**Attributes:**
- `source` - Twig conditional expression

**Examples:**

```html
<!-- User logged in -->
<if source="user.ID > 0">
  <p>Welcome, {{ user.display_name }}!</p>
</if>

<!-- ACF field exists -->
<if source="post.meta('show_banner')">
  <div class="banner">{{ post.meta('banner_text') }}</div>
</if>

<!-- Complex condition -->
<if source="post.post_type == 'product' and post.meta('in_stock')">
  <button>Add to Cart</button>
</if>

<!-- Negative condition -->
<if source="not user.ID">
  <a href="/login">Please log in</a>
</if>
```

## Timber Context

The following data is available in Twig expressions:

### Post Data
```twig
{{ post.title }}              {# Post title #}
{{ post.content }}            {# Post content #}
{{ post.excerpt }}            {# Post excerpt #}
{{ post.ID }}                 {# Post ID #}
{{ post.slug }}               {# Post slug #}
{{ post.post_type }}          {# Post type #}
{{ post.permalink }}          {# Post URL #}
{{ post.author.name }}        {# Author name #}
{{ post.date }}               {# Publish date #}
{{ post.meta('field_name') }} {# ACF/Meta field #}
```

### User Data
```twig
{{ user.ID }}                 {# User ID (0 if logged out) #}
{{ user.display_name }}       {# User display name #}
{{ user.email }}              {# User email #}
{{ user.roles }}              {# User roles array #}
```

### Site Data
```twig
{{ site.name }}               {# Site name #}
{{ site.description }}        {# Site description #}
{{ site.url }}                {# Site URL #}
{{ site.theme.link }}         {# Theme directory URL #}
```

## Template Examples

### Example 1: Simple Hero Section

```html
<section class="hero bg-blue-500 text-white py-20">
  <div class="container mx-auto">
    <h1 class="text-4xl font-bold">{{ post.title }}</h1>
    <p class="text-xl mt-4">{{ post.meta('subtitle') }}</p>
  </div>
</section>
```

### Example 2: Team Members Grid (ACF Repeater)

```html
<section class="team py-16">
  <div class="container mx-auto">
    <h2 class="text-3xl font-bold mb-8">Our Team</h2>

    <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
      <loop source="post.meta('team_members')">
        <div class="team-card">
          <img src="{{ item.photo.url }}" alt="{{ item.name }}" class="w-full h-64 object-cover rounded-lg">
          <h3 class="text-xl font-bold mt-4">{{ item.name }}</h3>
          <p class="text-gray-600">{{ item.title }}</p>
          <p class="mt-2">{{ item.bio }}</p>
        </div>
      </loop>
    </div>
  </div>
</section>
```

### Example 3: Conditional Call-to-Action

```html
<set variable="show_cta" value="post.meta('show_cta')" />
<set variable="cta_text" value="post.meta('cta_text')" />
<set variable="cta_link" value="post.meta('cta_link')" />

<if source="show_cta">
  <section class="cta bg-gradient-to-r from-purple-500 to-pink-500 py-16">
    <div class="container mx-auto text-center text-white">
      <h2 class="text-3xl font-bold mb-4">{{ cta_text }}</h2>
      <a href="{{ cta_link }}" class="inline-block bg-white text-purple-600 px-8 py-3 rounded-full font-bold hover:bg-gray-100">
        Get Started
      </a>
    </div>
  </section>
</if>
```

### Example 4: Product Listing with Filtering

```html
<section class="products py-16">
  <div class="container mx-auto">
    <h2 class="text-3xl font-bold mb-8">Featured Products</h2>

    <set variable="featured_products" value="posts|filter(p => p.post_type == 'product' and p.meta('featured'))" />

    <div class="grid grid-cols-1 md:grid-cols-4 gap-6">
      <loop source="featured_products">
        <article class="product-card border rounded-lg overflow-hidden">
          <img src="{{ item.thumbnail.src }}" alt="{{ item.title }}" class="w-full h-48 object-cover">

          <div class="p-4">
            <h3 class="font-bold text-lg">{{ item.title }}</h3>
            <p class="text-gray-600 text-sm mt-2">{{ item.excerpt }}</p>

            <div class="mt-4 flex items-center justify-between">
              <span class="text-2xl font-bold">${{ item.meta('price') }}</span>

              <if source="item.meta('in_stock')">
                <span class="text-green-600 text-sm">In Stock</span>
              </if>
            </div>

            <a href="{{ item.permalink }}" class="block mt-4 bg-blue-600 text-white text-center py-2 rounded hover:bg-blue-700">
              View Details
            </a>
          </div>
        </article>
      </loop>
    </div>
  </div>
</section>
```

### Example 5: User-Specific Content

```html
<header class="site-header bg-white shadow-md py-4">
  <div class="container mx-auto flex items-center justify-between">
    <a href="/" class="text-2xl font-bold">{{ site.name }}</a>

    <nav class="flex items-center gap-6">
      <a href="/about">About</a>
      <a href="/products">Products</a>
      <a href="/contact">Contact</a>

      <if source="user.ID > 0">
        <div class="user-menu">
          <span class="text-gray-700">Hello, {{ user.display_name }}</span>
          <a href="/dashboard" class="ml-4 bg-blue-600 text-white px-4 py-2 rounded">Dashboard</a>
          <a href="/wp-login.php?action=logout" class="ml-2 text-gray-600">Logout</a>
        </div>
      </if>

      <if source="not user.ID">
        <div class="auth-links">
          <a href="/login" class="text-blue-600">Login</a>
          <a href="/register" class="ml-4 bg-blue-600 text-white px-4 py-2 rounded">Sign Up</a>
        </div>
      </if>
    </nav>
  </div>
</header>
```

### Example 6: Complex Layout with Nested Loops

```html
<section class="blog-categories py-16">
  <div class="container mx-auto">
    <h2 class="text-3xl font-bold mb-8">Browse by Category</h2>

    <loop source="terms({taxonomy: 'category'})">
      <div class="category-section mb-12">
        <h3 class="text-2xl font-bold mb-4 border-b pb-2">{{ item.name }}</h3>

        <set variable="cat_posts" value="posts|filter(p => item.slug in p.terms('category')|map(t => t.slug))|slice(0, 3)" />

        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
          <loop source="cat_posts">
            <article class="post-card">
              <img src="{{ item.thumbnail.src }}" alt="{{ item.title }}" class="w-full h-48 object-cover rounded">
              <h4 class="font-bold mt-3">{{ item.title }}</h4>
              <p class="text-gray-600 text-sm mt-2">{{ item.preview.length(150) }}</p>
              <a href="{{ item.permalink }}" class="text-blue-600 text-sm mt-2 inline-block">Read More →</a>
            </article>
          </loop>
        </div>
      </div>
    </loop>
  </div>
</section>
```

## Best Practices

### 1. Use Self-Closing Syntax for `<set>` Tags

**Correct:**
```html
<set variable="title" value="post.title" />
```

**Also works (converted automatically):**
```html
<set variable="title" value="post.title"></set>
```

### 2. Keep Container Elements for Proper Block Nesting

Wrap related content in container elements like `<div>` or `<section>` to maintain structure:

```html
<section class="hero">
  <div class="container">
    <h1>Title</h1>
    <p>Content</p>
  </div>
</section>
```

### 3. Use Classes Liberally

Classes are preserved exactly and work great with Tailwind CSS or any CSS framework:

```html
<div class="grid grid-cols-1 md:grid-cols-3 gap-4">
  <!-- content -->
</div>
```

### 4. Leverage Twig Filters

Twig provides powerful filters for data manipulation:

```html
{{ post.title|upper }}                {# UPPERCASE #}
{{ post.content|length }}             {# Character count #}
{{ post.date|date('F j, Y') }}        {# Format date #}
{{ post.excerpt|truncate(100) }}      {# Limit length #}
{{ items|slice(0, 5) }}               {# First 5 items #}
{{ prices|join(', ') }}               {# Join array #}
```

### 5. Use Data Attributes for JavaScript

Data attributes are preserved perfectly:

```html
<div class="slider" data-autoplay="true" data-interval="3000">
  <!-- slides -->
</div>
```

### 6. Comment Your Templates

HTML comments are preserved during parsing:

```html
<!-- Hero Section -->
<section class="hero">
  <!-- CTA Button -->
  <a href="/contact">Contact Us</a>
</section>
```

### 7. Test with Debug Mode

Use `?debug=true` on the frontend to see available Timber context:

```
https://example.com/page/?debug=true
```

Add `&acf=true` to see ACF field data:

```
https://example.com/page/?debug=true&acf=true
```

## Advanced Patterns

### Pattern 1: Reusable Variables

```html
<!-- Define once, use multiple times -->
<set variable="button_class" value="'bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700'" />

<a href="/contact" class="{{ button_class }}">Contact Us</a>
<a href="/about" class="{{ button_class }}">Learn More</a>
```

### Pattern 2: Computed Values

```html
<set variable="total_posts" value="posts|length" />
<set variable="published_posts" value="posts|filter(p => p.status == 'publish')|length" />
<set variable="draft_posts" value="total_posts - published_posts" />

<p>You have {{ published_posts }} published posts and {{ draft_posts }} drafts.</p>
```

### Pattern 3: Nested Conditionals

```html
<if source="user.ID > 0">
  <if source="'administrator' in user.roles">
    <a href="/admin" class="text-red-600">Admin Panel</a>
  </if>

  <if source="'administrator' not in user.roles">
    <span class="text-gray-600">Regular User</span>
  </if>
</if>
```

### Pattern 4: Loop with Index

```html
<loop source="post.meta('slides')">
  <div class="slide" data-index="{{ loop.index0 }}">
    <if source="loop.first">
      <span class="badge">First Slide</span>
    </if>

    <h3>{{ item.title }}</h3>
    <p>Slide {{ loop.index }} of {{ loop.length }}</p>
  </div>
</loop>
```

## Troubleshooting

### Issue: Dynamic tags not working

**Problem:** Dynamic tags appear as HTML elements instead of being processed

**Solution:** Ensure you're viewing on the frontend (not in editor). Dynamic tags are processed by Timber during page render.

### Issue: Variables not showing

**Problem:** `{{ variable_name }}` shows as literal text

**Solution:** Check the Timber context with `?debug=true` to see available variables. Ensure variable name matches exactly (case-sensitive).

### Issue: ACF fields empty

**Problem:** ACF fields return null or empty

**Solution:**
- Use `?debug=true&acf=true` to see ACF data
- Verify field name matches exactly: `post.meta('field_name')`
- Check if field has a value in WordPress admin

### Issue: Nested blocks not converting

**Problem:** HTML elements inside containers don't become blocks

**Solution:** The parser automatically detects nesting. Ensure proper HTML structure with closing tags.

## Limitations

1. **JavaScript in HTML** - Inline `<script>` tags are preserved but not executed in the editor
2. **Style tags** - Inline `<style>` tags work but styles only apply on frontend
3. **PHP code** - Cannot include PHP in templates (use Twig instead)
4. **Form submissions** - Forms work but require additional WordPress handling

## Tips for LLMs

When creating templates:

1. **Always use semantic HTML** - Use appropriate tags (`<section>`, `<article>`, `<nav>`, etc.)
2. **Prefer blocks over HTML** - Use nested elements in containers rather than HTML content type
3. **Use Tailwind classes** - Tailwind CSS is available and works perfectly
4. **Add helpful comments** - Explain complex Twig expressions
5. **Set variables early** - Define variables at the top of sections before use
6. **Test edge cases** - Consider empty states, missing data, logged-out users
7. **Use consistent naming** - Follow conventions like `snake_case` for variables

## Additional Resources

- **Twig Documentation**: https://twig.symfony.com/doc/
- **Timber Documentation**: https://timber.github.io/docs/
- **WordPress Template Hierarchy**: https://developer.wordpress.org/themes/basics/template-hierarchy/
