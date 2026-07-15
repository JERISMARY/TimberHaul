/* ============================================================
   TimberHaul — Wishlist JS
   ============================================================ */

document.addEventListener('DOMContentLoaded', async () => {
  renderWishlist();
  setTimeout(() => document.body.classList.add('loaded'), 100);
});

async function renderWishlist() {
  const wishIds = JSON.parse(localStorage.getItem('th_wishlist') || '[]');
  const emptyEl = document.getElementById('empty-wishlist');
  const grid = document.getElementById('wishlist-grid');
  const badge = document.getElementById('wishlist-badge');

  if (!wishIds.length) {
    emptyEl.style.display = 'block';
    grid.style.display = 'none';
    if (badge) badge.textContent = '(0 items)';
    return;
  }

  emptyEl.style.display = 'none';
  grid.style.display = 'grid';
  if (badge) badge.textContent = `(${wishIds.length} item${wishIds.length !== 1 ? 's' : ''})`;

  // We only stored IDs. We need to fetch product details.
  // In a real app, we'd have a bulk fetch or wishlist endpoint.
  grid.innerHTML = wishIds.map(() => `<div class="product-card skeleton" style="height:380px"></div>`).join('');

  try {
    // We'll mock a fetch for all products and filter
    const res = await window.api.getProducts({ limit: 100 });
    const all = res.products || MOCK_PRODUCTS;
    const wishProducts = wishIds.map(id => all.find(p => p._id === id) || { _id: id, name: 'Product ' + id, price: 0 }).filter(p => p.name);

    grid.innerHTML = wishProducts.map((p, i) => window.buildProductCard(p, i)).join('');
  } catch (err) {
    // Mock fallback
    const wishProducts = wishIds.map(id => MOCK_PRODUCTS.find(p => p._id === id) || MOCK_PRODUCTS[0]);
    grid.innerHTML = wishProducts.map((p, i) => window.buildProductCard(p, i)).join('');
  }
}

// Override handleWishlist from home.js to auto-remove from DOM if on wishlist page
const origHandleWishlist = window.handleWishlist;
window.handleWishlist = function(btn, product) {
  const isAdded = toggleWishlistLocal(product);
  
  if (!isAdded) {
    // We just removed it, animate it out
    const card = document.querySelector(`.product-card[data-id="${product._id}"]`);
    if (card) {
      card.style.transform = 'scale(0.9)';
      card.style.opacity = '0';
      setTimeout(() => {
        renderWishlist();
      }, 300);
    }
  } else {
    // Fallback if somehow added back
    origHandleWishlist(btn, product);
  }
};
