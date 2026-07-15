/* ============================================================
   TimberHaul — Home Page JS
   Categories, featured products, blogs, reviews slider
   ============================================================ */

document.addEventListener('DOMContentLoaded', async () => {
  // Load all sections in parallel
  await Promise.allSettled([
    loadCategories(),
    loadFeaturedProducts(),
    loadBlogs(),
  ]);

  // Initialize slider after content loads
  initReviewsSlider();
});

// ─── Load Categories ──────────────────────────────────────────
async function loadCategories() {
  const grid = document.getElementById('categories-grid');
  if (!grid) return;

  try {
    const res = await window.api.getCategories();
    const categories = res.categories || MOCK_CATEGORIES;

    const imageMap = {
      'Solid Wood':          window.PLACEHOLDER_IMG,
      'Plywood':             window.PLACEHOLDER_IMG,
      'Doors':               window.PLACEHOLDER_IMG,
      'Furniture':           window.PLACEHOLDER_IMG,
      'Wooden Decor':        window.PLACEHOLDER_IMG,
      'Construction Timber': window.PLACEHOLDER_IMG
    };

    const countMap = {
      'Solid Wood': '1,240+', 'Plywood': '385+', 'Doors': '210+',
      'Furniture': '876+', 'Wooden Decor': '432+', 'Construction Timber': '654+'
    };

    grid.innerHTML = categories.map((cat, i) => {
      const imgUrl = cat.image || imageMap[cat.name] || window.PLACEHOLDER_IMG;
      return `
      <div class="cat-card" data-reveal="fade-up" data-delay="${i * 50}" style="background-image:url('${imgUrl}');background-size:cover;background-position:center;cursor:pointer"
        data-href="products.html?category=${cat.slug || cat.name.toLowerCase().replace(/\s+/g,'-')}">
        <div class="cat-card-overlay"></div>
        <div class="cat-card-content">
          <h3 class="cat-card-name">${cat.name}</h3>
          <div class="cat-card-count">${cat.productCount || countMap[cat.name] || '200+'} products</div>
          <div class="cat-card-arrow">
            Explore <i class="fa-solid fa-arrow-right"></i>
          </div>
        </div>
      </div>`;
    }).join('');

    // Re-observe new elements
    initScrollRevealFor(grid.querySelectorAll('[data-reveal]'));

  } catch (err) {
    console.error('Categories load failed:', err);
    grid.innerHTML = '<p style="color:var(--text-muted);text-align:center;grid-column:1/-1">Failed to load categories</p>';
  }
}

// ─── Load Featured Products ───────────────────────────────────
let allProducts = [];
let currentFilter = 'all';

async function loadFeaturedProducts() {
  const grid = document.getElementById('featured-products-grid');
  if (!grid) return;

  try {
    const res = await window.api.getFeaturedProducts();
    allProducts = res.products || MOCK_PRODUCTS;
    renderProducts(allProducts);
  } catch (err) {
    console.error('Products load failed:', err);
    allProducts = MOCK_PRODUCTS;
    renderProducts(MOCK_PRODUCTS);
  }
}

window.filterProducts = function(category) {
  currentFilter = category;

  // Update tab state
  document.querySelectorAll('.product-filter-tabs .tag').forEach(btn => {
    btn.classList.toggle('active', btn.textContent.trim() === category || (category === 'all' && btn.textContent.trim() === 'All Products'));
  });

  const filtered = category === 'all'
    ? allProducts
    : allProducts.filter(p => p.category?.name === category || p.category === category);

  renderProducts(filtered);
};

function renderProducts(products) {
  const grid = document.getElementById('featured-products-grid');
  if (!grid) return;

  if (!products.length) {
    grid.innerHTML = `
      <div style="grid-column:1/-1;text-align:center;padding:4rem;color:var(--text-muted)">
        <div style="font-size:3rem;margin-bottom:1rem">🪵</div>
        <div style="font-size:var(--fs-lg);margin-bottom:0.5rem">No products in this category yet</div>
        <a href="products.html" class="btn btn-outline" style="margin-top:1rem">Browse All Products</a>
      </div>`;
    return;
  }

  grid.innerHTML = products.slice(0, 8).map((p, i) => buildProductCard(p, i)).join('');

  // Re-observe for scroll reveal
  initScrollRevealFor(grid.querySelectorAll('[data-reveal]'));

  // Update cursor hover detection
  grid.querySelectorAll('.product-card').forEach(card => {
    const ring = document.getElementById('cursor-ring');
    if (ring) {
      card.addEventListener('mouseenter', () => ring.classList.add('hovered'));
      card.addEventListener('mouseleave', () => ring.classList.remove('hovered'));
    }
  });
}

function buildProductCard(p, index = 0) {
  const finalPrice = p.finalPrice || p.price;
  const imgSrc = p.images?.[0]?.url || window.PLACEHOLDER_IMG;
  const inWishlist = window.isInWishlist?.(p._id);
  const inStock = p.stock > 0;
  const discountBadge = p.discount > 0 ? `<span class="badge badge-danger">${p.discount}% OFF</span>` : '';
  const featuredBadge = p.featured ? '<span class="badge badge-gold">Featured</span>' : '';
  const stockBadge = !inStock ? '<span class="badge badge-danger">Out of Stock</span>' : (p.stock <= 10 ? `<span class="badge badge-warning">Only ${p.stock} left</span>` : '');

  const dim = p.dimensions ? `${p.dimensions.length}×${p.dimensions.width}×${p.dimensions.thickness}${p.dimensions.unit}` : '';

  return `
    <div class="product-card" data-reveal="fade-up" data-delay="${(index % 4) * 100}" data-id="${p._id}">
      <div class="product-card-img-wrap" style="background-image:url('${imgSrc}');background-size:cover;background-position:center;">
        <img src="${imgSrc}" alt="${p.name}" loading="eager" onerror="this.onerror=null;this.parentElement.style.backgroundImage='url(${window.PLACEHOLDER_IMG})';this.style.display='none';" style="width:100%;height:100%;object-fit:cover;opacity:0;position:absolute;">
        <div class="product-card-badges">
          ${discountBadge}${featuredBadge}${stockBadge}
        </div>
        <div class="product-card-actions">
          <div class="product-hover-actions">
            <button class="hover-btn" title="Add to Wishlist"
              data-action="handleWishlist" data-args='[${JSON.stringify(p).replace(/"/g,'&quot;')}]'>
              <i class="fa-regular fa-heart"></i>
            </button>
            <button class="hover-btn" title="Quick View"
              data-action="quickView" data-args='[${JSON.stringify(p).replace(/"/g,'&quot;')}]'>
              <i class="fa-solid fa-eye"></i>
            </button>
            <button class="hover-btn" title="Compare"
              data-action="showToast" data-args='["Compare feature coming soon!","info"]'>
              <i class="fa-solid fa-arrow-right-arrow-left"></i>
            </button>
          </div>
          <button class="add-cart-float ${!inStock ? 'disabled' : ''}" title="${inStock ? 'Add to Cart' : 'Out of Stock'}"
            data-action="${inStock ? 'addToCartLocal' : 'showToast'}" data-args='[${inStock ? JSON.stringify(p).replace(/"/g,'&quot;') : `"Out of stock!","warning"`}]'>
            <i class="fa-solid fa-bag-shopping"></i>
          </button>
          <button class="buy-now-float" title="Buy Now"
            data-href="product-detail.html?id=${p._id}">
            <i class="fa-solid fa-bolt"></i>
          </button>
        </div>
      </div>

      <div class="product-card-body" data-href="product-detail.html?id=${p._id}" style="cursor:pointer">
        <div style="display:flex;justify-content:space-between;align-items:flex-start">${p.category?.name || 'Timber'}</div>
        <h3 class="product-card-name">${p.name}</h3>
        <div class="product-card-meta">
          <span>🪵 ${p.woodType}</span>
          ${dim ? `<span>📐 ${dim}</span>` : ''}
        </div>
        <div class="rating">
          <span class="rating-stars" style="color:var(--c-teak)">${'★'.repeat(Math.floor(p.rating))}${'☆'.repeat(5-Math.floor(p.rating))}</span>
          <span class="rating-count">(${p.numReviews})</span>
        </div>
      </div>

      <div class="product-card-footer">
        <div class="product-card-price">
          <span class="price-current">₹${finalPrice.toLocaleString('en-IN')}</span>
          ${p.discount > 0 ? `<span class="price-original">₹${p.price.toLocaleString('en-IN')}</span>` : ''}
        </div>
        <button class="product-card-add-btn ripple-container"
          onclick="event.stopPropagation(); ${inStock ? `addToCartLocal(${JSON.stringify(p).replace(/"/g,'&quot;')})` : "showToast('Out of stock!','warning')"}"
          aria-label="Add to cart"
          title="Add to cart">
          ${inStock ? '+' : '✕'}
        </button>
      </div>
    </div>
  `;
}

// Make buildProductCard globally available for products.html
window.buildProductCard = buildProductCard;

function handleWishlist(btn, product) {
  const added = window.toggleWishlistLocal(product);
  btn.textContent = added ? '❤️' : '🤍';
  btn.classList.toggle('wishlisted', added);
}

window.handleWishlist = handleWishlist;

// ─── Load Blogs ───────────────────────────────────────────────
async function loadBlogs() {
  const grid = document.getElementById('blog-grid');
  if (!grid) return;

  try {
    const res = await window.api.getBlogs({ limit: 4 });
    const blogs = res.blogs || MOCK_BLOGS;
    renderBlogs(grid, blogs);
  } catch (err) {
    renderBlogs(grid, MOCK_BLOGS);
  }
}

function renderBlogs(grid, blogs) {
  grid.innerHTML = blogs.slice(0, 4).map((blog, i) => `
    <div class="blog-card" data-reveal="fade-up" data-delay="${i * 100}">
      <div class="blog-card-img-wrap">
        <img src="${blog.coverImage || window.PLACEHOLDER_IMG}" alt="${blog.title}" loading="lazy" onerror="${window.ONERROR_IMG}">
        <div class="blog-card-cat">
          <span class="badge badge-gold">${blog.category}</span>
        </div>
      </div>
      <div class="blog-card-body">
        <div class="blog-card-meta">
          <span>📅 ${formatDate(blog.publishedAt || blog.createdAt)}</span>
          <span>⏱️ ${blog.readTime || 5} min read</span>
          <span>👁️ ${(blog.views || 0).toLocaleString()}</span>
        </div>
        <h3 class="blog-card-title" data-href="blog-detail.html?slug=${blog.slug}" style="cursor:pointer">${blog.title}</h3>
        <p class="blog-card-excerpt">${blog.excerpt}</p>
        <div class="blog-card-footer">
          <div class="blog-author-mini">
            <div style="width:28px;height:28px;border-radius:50%;background:linear-gradient(135deg,var(--c-walnut),var(--c-teak));display:flex;align-items:center;justify-content:center;font-size:0.75rem;color:#fff">${(blog.author?.name || 'T')[0]}</div>
            <span>${blog.author?.name || 'TimberHaul'}</span>
          </div>
          <a href="blog-detail.html?slug=${blog.slug}" class="btn btn-ghost btn-sm">
            Read More <i class="fa-solid fa-arrow-right"></i>
          </a>
        </div>
      </div>
    </div>
  `).join('');

  initScrollRevealFor(grid.querySelectorAll('[data-reveal]'));
}

// ─── Scroll Reveal helper for dynamic content ─────────────────
function initScrollRevealFor(elements) {
  if (!elements.length) return;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('revealed');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });

  elements.forEach(el => {
    el.classList.remove('revealed');
    observer.observe(el);
  });
}
