# Dynamic Tags Usage Examples

## Basic Usage

### 1. Setting Variables
Use `<set>` to create variables for reuse throughout your template:

```html
<set variable="site_name" value="site.name" />
<set variable="user_count" value="users|length" />
<set variable="is_featured" value="post.meta('featured')" />

<h1>Welcome to {{ site_name }}</h1>
<p>We have {{ user_count }} registered users.</p>
```

### 2. Conditional Display
Use `<if>` for conditional content display:

```html
<if source="user.ID > 0">
  <div class="user-welcome">
    <h3>Welcome back, {{ user.display_name }}!</h3>
  </div>
</if>

<if source="user.ID == 0">
  <div class="guest-welcome">
    <h3>Please log in to access your account</h3>
  </div>
</if>
```

### 3. Looping Through Data
Use `<loop>` to iterate over arrays and objects:

```html
<loop source="post.meta('team_members')">
  <div class="team-member">
    <h4>{{ item.name }}</h4>
    <p>{{ item.job_title }}</p>
    <p>{{ item.bio }}</p>
  </div>
</loop>
```

## Real-World Examples

### ACF Repeater Field - Team Members
```html
<section class="team-section">
  <h2>Our Team</h2>
  <div class="team-grid">
    <loop source="post.meta('team_members')">
      <if source="loop.index == 0">
        <div class="team-member featured">
          <img src="{{ item.photo.sizes.large }}" alt="{{ item.photo.alt }}" />
          <h3>{{ item.name }}</h3>
          <p class="title">{{ item.job_title }}</p>
          <p class="bio">{{ item.full_bio }}</p>
        </div>
      </if>

      <if source="loop.index > 0">
        <div class="team-member">
          <img src="{{ item.photo.sizes.medium }}" alt="{{ item.photo.alt }}" />
          <h4>{{ item.name }}</h4>
          <p class="title">{{ item.job_title }}</p>
        </div>
      </if>
    </loop>
  </div>
</section>
```

### WordPress Posts Query
```html
<set variable="featured_posts" value="posts({meta_key: 'featured', meta_value: '1', posts_per_page: 3})" />

<section class="featured-posts">
  <h2>Featured Articles</h2>
  <div class="posts-grid">
    <loop source="featured_posts">
      <article class="post">
        <if source="item.thumbnail">
          <img src="{{ item.thumbnail.src }}" alt="{{ item.thumbnail.alt }}" />
        </if>

        <div class="post-content">
          <h3><a href="{{ item.link }}">{{ item.title }}</a></h3>
          <p>{{ item.excerpt }}</p>
          <div class="post-meta">
            <span>By {{ item.author.name }}</span>
            <span>{{ item.date }}</span>
          </div>
        </div>
      </article>
    </loop>
  </div>
</section>
```

### User-Based Content
```html
<if source="user.ID > 0">
  <div class="user-dashboard">
    <h3>Your Dashboard</h3>
    <p>Welcome back, {{ user.display_name }}!</p>

    <if source="user.meta('favorite_posts')">
      <h4>Your Favorite Posts</h4>
      <loop source="user.meta('favorite_posts')">
        <div class="favorite-post">
          <a href="{{ item.link }}">{{ item.title }}</a>
          <span class="date">{{ item.date }}</span>
        </div>
      </loop>
    </if>
  </div>
</if>

<if source="user.ID == 0">
  <div class="login-prompt">
    <h3>Join Our Community</h3>
    <p>Log in to access personalized content and features.</p>
    <a href="/wp-login.php" class="login-button">Log In</a>
  </div>
</if>
```

### E-commerce Product Listing
```html
<set variable="products" value="posts({post_type: 'product', posts_per_page: 8})" />

<section class="products">
  <h2>Our Products</h2>
  <div class="product-grid">
    <loop source="products">
      <div class="product">
        <if source="item.meta('sale_price')">
          <span class="sale-badge">Sale!</span>
        </if>

        <img src="{{ item.thumbnail.src }}" alt="{{ item.title }}" />
        <h3>{{ item.title }}</h3>

        <div class="price">
          <if source="item.meta('sale_price')">
            <span class="original-price">${{ item.meta('regular_price') }}</span>
            <span class="sale-price">${{ item.meta('sale_price') }}</span>
          </if>

          <if source="not item.meta('sale_price')">
            <span class="price">${{ item.meta('regular_price') }}</span>
          </if>
        </div>

        <a href="{{ item.link }}" class="view-product">View Product</a>
      </div>
    </loop>
  </div>
</section>
```

### Gallery with Navigation
```html
<set variable="gallery_images" value="post.meta('gallery')" />

<if source="gallery_images">
  <section class="gallery">
    <h2>Photo Gallery</h2>
    <div class="gallery-grid">
      <loop source="gallery_images">
        <if source="loop.index < 6">
          <div class="gallery-item">
            <img src="{{ item.sizes.medium }}" alt="{{ item.alt }}" />
            <div class="overlay">
              <h4>{{ item.caption }}</h4>
            </div>
          </div>
        </if>
      </loop>
    </div>

    <if source="gallery_images|length > 6">
      <p class="gallery-note">
        Showing 6 of {{ gallery_images|length }} images
      </p>
    </if>
  </section>
</if>
```

## Advanced Patterns

### Nested Loops with Conditionals
```html
<loop source="post.meta('sections')">
  <section class="content-section">
    <h2>{{ item.title }}</h2>

    <if source="item.type == 'text'">
      <div class="text-content">{{ item.content }}</div>
    </if>

    <if source="item.type == 'gallery'">
      <div class="gallery-content">
        <loop source="item.images">
          <img src="{{ item.url }}" alt="{{ item.alt }}" />
        </loop>
      </div>
    </if>

    <if source="item.type == 'testimonials'">
      <div class="testimonials">
        <loop source="item.testimonials">
          <blockquote>
            <p>"{{ item.quote }}"</p>
            <footer>{{ item.author }} - {{ item.company }}</footer>
          </blockquote>
        </loop>
      </div>
    </if>
  </section>
</loop>
```

### Complex State Management
```html
<set variable="current_year" value="'now'|date('Y')" />
<set variable="is_holiday_season" value="'now'|date('m') in ['11', '12']" />
<set variable="user_level" value="user.meta('membership_level')" />

<if source="is_holiday_season">
  <div class="holiday-banner">
    <h3>🎄 Holiday Special Offers!</h3>
  </div>
</if>

<if source="user_level == 'premium'">
  <div class="premium-content">
    <h4>Exclusive Premium Content</h4>
    <p>Thank you for being a premium member!</p>
  </div>
</if>

<footer>
  <p>&copy; {{ current_year }} {{ site.name }}. All rights reserved.</p>
</footer>
```

## Available Context Variables

### Post Context
- `post.ID` - Post ID
- `post.title` - Post title
- `post.content` - Post content
- `post.excerpt` - Post excerpt
- `post.date` - Post date
- `post.link` - Post permalink
- `post.author.name` - Author name
- `post.thumbnail.src` - Featured image URL
- `post.meta('field_name')` - Custom field value

### User Context
- `user.ID` - User ID (0 if not logged in)
- `user.display_name` - User display name
- `user.email` - User email
- `user.meta('field_name')` - User meta value

### Site Context
- `site.name` - Site name
- `site.description` - Site description
- `site.url` - Site URL
- `site.admin_email` - Admin email

### Loop Context (within loops)
- `loop.index` - Current iteration index (0-based)
- `loop.first` - True if first iteration
- `loop.last` - True if last iteration
- `loop.length` - Total number of items
- `item` - Current item in the loop