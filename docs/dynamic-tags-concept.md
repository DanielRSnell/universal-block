# Dynamic Tags Concept

## Overview

The Universal Block plugin supports three core dynamic tags that provide templating functionality while maintaining minimal parsing overhead. These tags translate directly to Twig syntax for seamless integration with Timber.

## Core Dynamic Tags

### 1. `<loop>` - Iteration
Repeats content based on data sources like ACF repeaters, WordPress queries, or arrays.

```html
<loop source="post.meta('team_members')">
  <div class="team-member">
    <h3>{{ item.name }}</h3>
    <p>{{ item.job_title }}</p>
  </div>
</loop>
```

**Parses to:**
```twig
{% for item in post.meta('team_members') %}
  <div class="team-member">
    <h3>{{ item.name }}</h3>
    <p>{{ item.job_title }}</p>
  </div>
{% endfor %}
```

### 2. `<if>` - Conditional Logic
Conditionally displays content based on expressions. Uses multiple `<if>` statements instead of if/else for simplicity.

```html
<if source="loop.index == 0">
  <div class="featured-item">{{ item.title }}</div>
</if>

<if source="loop.index > 0">
  <div class="regular-item">{{ item.title }}</div>
</if>
```

**Parses to:**
```twig
{% if loop.index == 0 %}
  <div class="featured-item">{{ item.title }}</div>
{% endif %}

{% if loop.index > 0 %}
  <div class="regular-item">{{ item.title }}</div>
{% endif %}
```

### 3. `<set>` - Variable Management
Sets variables for use throughout the template.

```html
<set variable="user_count" value="users|length" />
<set variable="is_featured" value="post.meta('featured')" />
```

**Parses to:**
```twig
{% set user_count = users|length %}
{% set is_featured = post.meta('featured') %}
```

## Design Principles

### Raw Twig Syntax
The `source` attribute accepts raw Twig expressions for maximum flexibility:
- `source="post.meta('gallery')"` - ACF repeater field
- `source="posts({post_type: 'product', posts_per_page: 6})"` - WordPress query
- `source="loop.index < 3"` - Loop context with comparison
- `source="user.ID > 0 and user.has_cap('edit_posts')"` - Complex conditions

### Minimal Parsing
Each tag translates directly to Twig with minimal processing:
- `<loop source="data">` → `{% for item in data %}`
- `<if source="condition">` → `{% if condition %}`
- `<set variable="x" value="y" />` → `{% set x = y %}`

### Technical Audience Focus
This approach targets developers who understand Twig syntax. For non-technical users, inspector controls can provide a GUI interface that generates the raw syntax.

## Examples

### ACF Repeater with Conditional Display
```html
<loop source="post.meta('portfolio_items')">
  <if source="loop.index == 0">
    <article class="featured-portfolio col-12">
      <img src="{{ item.image.sizes.large }}" alt="{{ item.title }}" />
      <h2>{{ item.title }}</h2>
      <p>{{ item.description }}</p>
    </article>
  </if>

  <if source="loop.index > 0">
    <article class="portfolio-item col-6">
      <img src="{{ item.image.sizes.medium }}" alt="{{ item.title }}" />
      <h4>{{ item.title }}</h4>
    </article>
  </if>
</loop>
```

### WordPress Query with Variables
```html
<set variable="posts_per_page" value="6" />
<set variable="featured_posts" value="posts({meta_key: 'featured', meta_value: '1', posts_per_page: posts_per_page})" />

<loop source="featured_posts">
  <article class="featured-post">
    <h3>{{ item.title }}</h3>
    <p>{{ item.excerpt }}</p>

    <if source="item.thumbnail">
      <img src="{{ item.thumbnail.src }}" alt="{{ item.thumbnail.alt }}" />
    </if>
  </article>
</loop>
```

### User-Based Content
```html
<if source="user.ID > 0">
  <div class="user-content">
    <h3>Welcome back, {{ user.display_name }}!</h3>

    <loop source="user.meta('favorite_posts')">
      <a href="{{ item.link }}">{{ item.title }}</a>
    </loop>
  </div>
</if>

<if source="user.ID == 0">
  <div class="guest-content">
    <h3>Please log in to see personalized content</h3>
  </div>
</if>
```

## Integration with Timber Context

These dynamic tags work seamlessly with Timber's rich context. Any Twig expression can be used in regular blocks:

```html
<!-- Regular blocks with Twig -->
<h1>{{ post.title }}</h1>
<p>Published on {{ post.date }}</p>
<p>Author: {{ post.author.name }}</p>

<!-- Dynamic tags for complex logic -->
<if source="post.meta('show_related')">
  <h4>Related Posts</h4>
  <loop source="post.related_posts(3)">
    <a href="{{ item.link }}">{{ item.title }}</a>
  </loop>
</if>
```

## Benefits

1. **Lightweight Parsing**: Direct translation to Twig with minimal overhead
2. **Maximum Flexibility**: Raw Twig expressions in source attributes
3. **No Abstraction**: Developers work directly with Twig concepts
4. **Scalable**: Inspector controls can provide GUI for non-technical users
5. **Familiar**: Matches Twig syntax developers already know

## Future Implementation Notes

- Tags are placeholder implementations in the current codebase
- Parser will handle direct translation to Twig syntax
- Inspector controls can generate raw syntax for visual editors
- Integration with existing Universal Block architecture