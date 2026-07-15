/* ============================================================
   TimberHaul — Product Detail JS
   ============================================================ */

let currentProduct = null;
let selectedRating = 0;

const productId = new URLSearchParams(location.search).get('id');

document.addEventListener('DOMContentLoaded', async () => {
  if (!productId) {
    showToast('Product not found', 'error');
    setTimeout(() => location.href = 'products.html', 1500);
    return;
  }
  await loadProduct();
});

async function loadProduct() {
  try {
    const res = await window.api.getProduct(productId);
    currentProduct = res.product || MOCK_PRODUCTS.find(p => p._id === productId) || MOCK_PRODUCTS[0];
  } catch {
    currentProduct = MOCK_PRODUCTS.find(p => p._id === productId) || MOCK_PRODUCTS[0];
  }

  renderProduct(currentProduct);
  trackRecentlyViewed(currentProduct);
  loadReviews();
  loadRelated();
  loadRecentlyViewed();
}

function trackRecentlyViewed(p) {
  if (!p || !p._id) return;
  try {
    let recent = JSON.parse(localStorage.getItem('th_recently_viewed')) || [];
    // Remove if exists
    recent = recent.filter(item => item._id !== p._id);
    // Add to front (store essential display data only to save space)
    recent.unshift({
      _id: p._id,
      name: p.name,
      image: (p.images && p.images[0]) ? p.images[0].url : window.PLACEHOLDER_IMG,
      price: p.finalPrice || p.price
    });
    // Keep only last 8
    if (recent.length > 8) recent = recent.slice(0, 8);
    localStorage.setItem('th_recently_viewed', JSON.stringify(recent));
  } catch(e) { console.error('Error tracking recently viewed', e); }
}

function loadRecentlyViewed() {
  const container = document.getElementById('recently-viewed-grid');
  if (!container) return; // If container doesn't exist in HTML yet
  
  try {
    let recent = JSON.parse(localStorage.getItem('th_recently_viewed')) || [];
    // Filter out current product
    recent = recent.filter(item => item._id !== currentProduct._id);
    
    if (recent.length === 0) {
      document.getElementById('recently-viewed-section').style.display = 'none';
      return;
    }
    
    document.getElementById('recently-viewed-section').style.display = 'block';
    container.innerHTML = recent.slice(0, 4).map(p => `
      <div class="product-card" onclick="location.href='product-detail.html?id=${p._id}'" style="cursor:pointer;">
        <div style="height:200px;overflow:hidden;border-radius:var(--radius-md) var(--radius-md) 0 0">
          <img src="${p.image}" style="width:100%;height:100%;object-fit:cover;">
        </div>
        <div style="padding:1rem;">
          <h3 style="font-size:1rem;margin-bottom:0.5rem;color:var(--text-primary)">${p.name}</h3>
          <div style="font-weight:600;color:var(--c-teak)">₹${p.price.toLocaleString('en-IN')}</div>
        </div>
      </div>
    `).join('');
  } catch(e) { console.error('Error loading recently viewed', e); }
}

function renderProduct(p) {
  // Hide skeleton, show detail
  document.getElementById('product-detail-loading').style.display = 'none';
  document.getElementById('product-detail').style.display = 'grid';
  document.getElementById('product-tabs').style.display = 'block';

  // Meta
  document.title = `${p.name} — TimberHaul`;
  document.getElementById('breadcrumb-name').textContent = p.name;

  // Gallery
  const images = p.images || [{ url: window.PLACEHOLDER_IMG, isPrimary: true }];
  const mainImg = document.getElementById('gallery-main-img');
  mainImg.src = images[0]?.url || window.PLACEHOLDER_IMG;
  mainImg.alt = p.name;

  const thumbsEl = document.getElementById('gallery-thumbs');
  thumbsEl.innerHTML = images.map((img, i) => `
    <div class="gallery-thumb ${i === 0 ? 'active' : ''}" onclick="switchGallery(${i}, '${img.url}', this)">
      <img src="${img.url || window.PLACEHOLDER_IMG}" alt="${p.name}" onerror="${window.ONERROR_IMG}">
    </div>
  `).join('');

  // Badges
  document.getElementById('pd-category').textContent = p.category?.name || 'Timber';
  document.getElementById('pd-wood-type').textContent = p.woodType;

  const stockBadge = document.getElementById('pd-stock-badge');
  if (p.stock <= 0) {
    stockBadge.innerHTML = '<span class="badge badge-danger">Out of Stock</span>';
  } else if (p.stock <= 10) {
    stockBadge.innerHTML = `<span class="badge badge-warning">Only ${p.stock} left</span>`;
  } else {
    stockBadge.innerHTML = '<span class="badge badge-success">In Stock</span>';
  }

  // Name
  document.getElementById('pd-name').textContent = p.name;

  // Rating
  const rating = p.rating || 4.5;
  document.getElementById('pd-stars').textContent = '★'.repeat(Math.floor(rating)) + (rating % 1 >= 0.5 ? '½' : '') + '☆'.repeat(5 - Math.ceil(rating));
  document.getElementById('pd-review-count').textContent = `(${p.numReviews || 0} reviews)`;
  document.getElementById('tab-review-count').textContent = p.numReviews || 0;
  document.getElementById('rating-big').textContent = rating.toFixed(1);
  document.getElementById('rating-stars-big').textContent = '★'.repeat(Math.round(rating)) + '☆'.repeat(5 - Math.round(rating));
  document.getElementById('rating-count-big').textContent = `${p.numReviews || 0} reviews`;

  // Price
  const finalPrice = p.finalPrice || p.price;
  document.getElementById('pd-price').textContent = `₹${finalPrice.toLocaleString('en-IN')}`;

  const origEl = document.getElementById('pd-original-price');
  if (p.discount > 0) {
    origEl.textContent = `₹${p.price.toLocaleString('en-IN')}`;
    origEl.style.display = '';
    document.getElementById('pd-discount-badge').innerHTML = `<span class="badge badge-danger">${p.discount}% OFF</span>`;
  } else {
    origEl.style.display = 'none';
  }

  // Short Description
  document.getElementById('pd-short-desc').textContent = p.shortDescription || p.description?.substring(0, 220) + '...' || 'Premium quality timber product, sustainably sourced and expertly processed.';

  // Specs Grid (Quick)
  const dim = p.dimensions;
  const specsEl = document.getElementById('pd-specs');
  specsEl.innerHTML = [
    { label: 'Wood Type',   value: p.woodType },
    { label: 'Grade',       value: p.grade || 'Grade A' },
    { label: 'Origin',      value: p.origin || 'Certified Forest' },
    { label: 'Moisture',    value: p.moisture ? `${p.moisture}%` : '8-12%' },
    dim && { label: 'Length', value: `${dim.length}${dim.unit}` },
    dim && { label: 'Width',  value: `${dim.width}${dim.unit}` },
    dim && { label: 'Thickness', value: `${dim.thickness}${dim.unit}` },
    { label: 'Certification', value: p.certification || 'FSC® Certified' },
  ].filter(Boolean).map(s => `
    <div class="spec-item">
      <div class="spec-label">${s.label}</div>
      <div class="spec-value">${s.value}</div>
    </div>
  `).join('');

  // Stock info
  const qtyInput = document.getElementById('pd-quantity');
  qtyInput.max = p.stock || 99;
  document.getElementById('pd-stock-info').textContent = p.stock > 0 ? `${p.stock} units available` : 'Out of stock';

  // Wishlist state
  const wishBtn = document.getElementById('pd-wishlist');
  wishBtn.textContent = isInWishlist(p._id) ? '❤️' : '🤍';

  // Full Description Tab
  document.getElementById('pd-full-desc').innerHTML = p.description
    ? p.description.split('\n').map(l => `<p style="margin-bottom:1rem">${l}</p>`).join('')
    : `<p>Premium <strong>${p.woodType}</strong> timber, sustainably sourced and kiln-dried to perfection. This exceptional piece has been carefully graded to ensure superior quality and consistency.</p>
       <p>Our ${p.woodType} is sourced from certified sustainable forests, ensuring every purchase contributes to forest preservation. Each piece undergoes rigorous quality checks including moisture content testing and structural grading.</p>
       <p>Ideal for ${p.category?.name?.toLowerCase() || 'furniture and construction'} applications where quality and durability are non-negotiable. The natural grain pattern makes each piece truly unique.</p>`;

  // Full Specs Tab
  const allSpecs = [
    { label: 'Species', value: p.woodType },
    { label: 'Scientific Name', value: p.scientificName || 'Certified Species' },
    { label: 'Origin', value: p.origin || 'Certified Sustainable Forest' },
    { label: 'Grade', value: p.grade || 'Grade A Premium' },
    { label: 'Certification', value: p.certification || 'FSC® / PEFC Certified' },
    dim && { label: 'Length', value: `${dim.length} ${dim.unit}` },
    dim && { label: 'Width', value: `${dim.width} ${dim.unit}` },
    dim && { label: 'Thickness', value: `${dim.thickness} ${dim.unit}` },
    dim && { label: 'Weight', value: `~${Math.round((dim.length/1000) * (dim.width/1000) * (dim.thickness/1000) * 700)} kg` },
    { label: 'Moisture Content', value: p.moisture ? `${p.moisture}%` : '8-12%' },
    { label: 'Janka Hardness', value: p.hardness || 'Varies by species' },
    { label: 'Treatment', value: p.treatment || 'Kiln Dried, Anti-borer treated' },
    { label: 'Finish', value: p.finish || 'Rough sawn / Smooth planed' },
    { label: 'Min Order Qty', value: p.minOrder ? `${p.minOrder} pieces` : '1 piece' },
    { label: 'Stock Available', value: `${p.stock || 0} units` },
  ].filter(Boolean);

  document.getElementById('pd-full-specs').innerHTML = allSpecs.map(s => `
    <div style="display:flex;justify-content:space-between;padding:0.875rem;background:var(--bg-surface-2);border-radius:var(--radius-md);border:1px solid var(--border-subtle)">
      <span style="font-size:var(--fs-sm);color:var(--text-muted);font-weight:600">${s.label}</span>
      <span style="font-size:var(--fs-sm);color:var(--text-primary);font-weight:600">${s.value}</span>
    </div>
  `).join('');

  // Rating bars
  renderRatingBars(p);
}

function renderRatingBars(p) {
  const bars = document.getElementById('rating-bars');
  if (!bars) return;

  const total = p.numReviews || 0;
  const dist = p.ratingDistribution || { 5: Math.round(total * 0.65), 4: Math.round(total * 0.25), 3: Math.round(total * 0.07), 2: Math.round(total * 0.02), 1: Math.round(total * 0.01) };

  bars.innerHTML = [5,4,3,2,1].map(n => {
    const count = dist[n] || 0;
    const pct = total > 0 ? Math.round((count / total) * 100) : 0;
    return `
      <div style="display:flex;align-items:center;gap:0.75rem">
        <span style="font-size:var(--fs-xs);color:var(--text-muted);width:6px">${n}</span>
        <span style="color:var(--c-teak);font-size:0.7rem">★</span>
        <div style="flex:1;height:6px;background:var(--bg-elevated);border-radius:3px;overflow:hidden">
          <div style="width:${pct}%;height:100%;background:linear-gradient(90deg,var(--c-walnut),var(--c-teak));border-radius:3px;transition:width 1s var(--ease-out)"></div>
        </div>
        <span style="font-size:var(--fs-xs);color:var(--text-muted);width:26px;text-align:right">${count}</span>
      </div>
    `;
  }).join('');
}

// Gallery
window.switchGallery = function(idx, url, thumbEl) {
  document.getElementById('gallery-main-img').src = url;
  document.querySelectorAll('.gallery-thumb').forEach(t => t.classList.remove('active'));
  thumbEl.classList.add('active');
};

// Tabs
window.switchTab = function(tabName) {
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.classList.toggle('active', btn.textContent.toLowerCase().includes(tabName.toLowerCase()));
  });
  document.querySelectorAll('.tab-panel').forEach(panel => {
    panel.classList.toggle('active', panel.id === `tab-${tabName}`);
  });
};

// Quantity
window.changeQty = function(delta) {
  const input = document.getElementById('pd-quantity');
  const newVal = Math.max(1, Math.min(parseInt(input.value) + delta, currentProduct?.stock || 99));
  input.value = newVal;
};

// Cart
window.addToCart = function() {
  if (!currentProduct) return;
  const qty = parseInt(document.getElementById('pd-quantity')?.value) || 1;
  addToCartLocal({ ...currentProduct, quantity: undefined }, qty);
};

window.buyNow = function() {
  addToCart();
  location.href = 'cart.html';
};

// Wishlist
window.toggleWishlist = function() {
  if (!currentProduct) return;
  const added = toggleWishlistLocal(currentProduct);
  document.getElementById('pd-wishlist').textContent = added ? '❤️' : '🤍';
};

// Share
window.shareProduct = function() {
  if (navigator.share) {
    navigator.share({ title: currentProduct?.name, url: location.href });
  } else {
    navigator.clipboard.writeText(location.href);
    showToast('Product link copied to clipboard!', 'success');
  }
};

// Reviews
async function loadReviews() {
  const listEl = document.getElementById('reviews-list');
  if (!listEl) return;

  try {
    const res = await window.api.getProductReviews(productId);
    const reviews = res.reviews || [];
    renderReviews(reviews);
  } catch {
    renderReviews([]);
  }
}

function renderReviews(reviews) {
  const listEl = document.getElementById('reviews-list');
  if (!listEl) return;

  if (!reviews.length) {
    listEl.innerHTML = `
      <div style="text-align:center;padding:3rem;color:var(--text-muted)">
        <div style="font-size:3rem;margin-bottom:0.75rem">📝</div>
        <div>No reviews yet. Be the first to review this product!</div>
      </div>`;
    return;
  }

  listEl.innerHTML = reviews.map(r => `
    <div class="review-card" style="margin:0">
      <div class="review-profile">
        <div class="review-avatar-placeholder">${(r.user?.name || 'U')[0].toUpperCase()}</div>
        <div>
          <div class="review-name">${r.user?.name || 'Verified Buyer'}</div>
          <div class="review-company">${formatDate(r.createdAt)}</div>
        </div>
      </div>
      <div class="stars">${'★'.repeat(r.rating)}${'☆'.repeat(5-r.rating)}</div>
      <div style="font-weight:600;color:var(--text-primary);margin-bottom:0.25rem">${r.title || ''}</div>
      <p class="review-text">${r.comment}</p>
      <div style="display:flex;gap:1rem;font-size:var(--fs-xs);color:var(--text-muted)">
        <span>Verified Purchase ✓</span>
        <button style="background:none;border:none;color:var(--text-muted);cursor:pointer;font-size:var(--fs-xs)" onclick="markHelpful('${r._id}', this)">
          👍 Helpful (${r.helpful || 0})
        </button>
      </div>
    </div>
  `).join('');
}

window.markHelpful = function(reviewId, btn) {
  window.api.markHelpful(reviewId)
    .then(() => showToast('Marked as helpful!', 'success'))
    .catch(() => {});
};

// Submit Review
window.setReviewRating = function(val) {
  selectedRating = val;
  document.getElementById('review-rating-val').value = val;
  document.querySelectorAll('.review-star').forEach((star, i) => {
    star.classList.toggle('selected', i < val);
  });
};

// Star hover
document.querySelectorAll('.review-star').forEach(star => {
  star.addEventListener('mouseover', () => {
    const v = parseInt(star.dataset.v);
    document.querySelectorAll('.review-star').forEach((s, i) => s.classList.toggle('hovered', i < v));
  });
  star.addEventListener('mouseout', () => {
    document.querySelectorAll('.review-star').forEach(s => s.classList.remove('hovered'));
  });
});

window.submitReview = async function(event) {
  event.preventDefault();
  if (!Auth.isLoggedIn()) { location.href = `login.html?return=${encodeURIComponent(location.href)}`; return; }
  if (selectedRating === 0) { showToast('Please select a rating', 'warning'); return; }

  const btn = document.getElementById('review-submit-btn');
  btn.disabled = true;
  btn.innerHTML = '<span class="spinner spinner-sm"></span> Submitting...';

  const data = {
    rating:  selectedRating,
    title:   document.getElementById('review-title').value,
    comment: document.getElementById('review-comment').value,
  };

  try {
    await window.api.addReview(productId, data);
    showToast('✅ Review submitted! Thank you.', 'success');
    event.target.reset();
    selectedRating = 0;
    document.querySelectorAll('.review-star').forEach(s => s.classList.remove('selected'));
    loadReviews();
  } catch (err) {
    showToast(err.message || 'Failed to submit review', 'error');
  } finally {
    btn.disabled = false;
    btn.innerHTML = '<i class="fa-solid fa-paper-plane"></i> Submit Review';
  }
};

// Related Products
async function loadRelated() {
  const grid = document.getElementById('related-grid');
  if (!grid) return;

  try {
    const res = await window.api.getRelatedProducts(productId);
    const products = (res.products || MOCK_PRODUCTS).filter(p => p._id !== productId).slice(0, 4);
    grid.innerHTML = products.map((p, i) => buildProductCard(p, i)).join('');
  } catch {
    grid.innerHTML = MOCK_PRODUCTS.filter(p => p._id !== productId).slice(0, 4).map((p, i) => buildProductCard(p, i)).join('');
  }
}
