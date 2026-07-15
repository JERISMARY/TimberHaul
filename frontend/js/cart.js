/* ============================================================
   TimberHaul — Cart Page JS
   ============================================================ */

let couponDiscount = 0;
let couponCode = '';

document.addEventListener('DOMContentLoaded', () => {
  renderCart();
  loadRecommendations();
});

function renderCart() {
  const cart = getLocalCart();
  const emptyEl  = document.getElementById('empty-cart');
  const layoutEl = document.getElementById('cart-layout');
  const badgeEl  = document.getElementById('cart-item-badge');

  if (!cart.length) {
    emptyEl.style.display = 'block';
    layoutEl.style.display = 'none';
    return;
  }

  emptyEl.style.display = 'none';
  layoutEl.style.display = 'grid';
  if (badgeEl) badgeEl.textContent = `(${cart.length} item${cart.length !== 1 ? 's' : ''})`;

  // Render items
  const list = document.getElementById('cart-items-list');
  if (list) {
    list.innerHTML = cart.map(item => `
      <div class="cart-item" id="cart-item-${item.product}" data-reveal="fade-up">
        <img class="cart-item-img" src="${item.image || window.PLACEHOLDER_IMG}" alt="${item.name}" onerror="${window.ONERROR_IMG}">
        <div class="cart-item-info">
          <div class="cart-item-name">${item.name}</div>
          <div class="cart-item-meta">🪵 ${item.woodType || 'Wood'} · ₹${item.price?.toLocaleString('en-IN')} each</div>
          <div class="cart-item-controls">
            <div class="qty-stepper">
              <button class="qty-btn" data-action="updateQty" data-args='["${item.product}", ${item.quantity - 1}]'>−</button>
              <input type="number" class="qty-input" value="${item.quantity}" min="1" max="${item.stock || 99}"
                data-onchange="updateQty" data-args='["${item.product}", "VALUE"]'>
              <button class="qty-btn" data-action="updateQty" data-args='["${item.product}", ${item.quantity + 1}]'>+</button>
            </div>
            <button class="cart-item-remove" data-action="removeItem" data-args='["${item.product}", "${item.name}"]'>
              <i class="fa-solid fa-trash-can"></i> Remove
            </button>
            <button class="cart-item-remove" data-action="moveToWishlist" data-args='["${item.product}"]'>
              <i class="fa-regular fa-heart"></i> Save for Later
            </button>
          </div>
        </div>
        <div class="cart-item-price">₹${(item.price * item.quantity).toLocaleString('en-IN')}</div>
      </div>
    `).join('');
  }

  updateSummary();
}

function updateSummary() {
  const cart = getLocalCart();
  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const discountAmt = Math.round(subtotal * couponDiscount / 100);
  const afterDiscount = subtotal - discountAmt;
  const shipping = afterDiscount >= 5000 ? 0 : 299;
  const tax = Math.round(afterDiscount * 0.18);
  const total = afterDiscount + shipping + tax;

  const set = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };

  set('summary-count', cart.reduce((s, i) => s + i.quantity, 0));
  set('summary-subtotal', `₹${subtotal.toLocaleString('en-IN')}`);
  set('summary-shipping', shipping === 0 ? '<span style="color:#4CAF79">FREE</span>' : `₹${shipping}`);
  set('summary-tax', `₹${tax.toLocaleString('en-IN')}`);
  set('summary-total', `₹${total.toLocaleString('en-IN')}`);

  document.getElementById('summary-shipping').innerHTML = shipping === 0
    ? '<span style="color:#4CAF79">FREE</span>'
    : `₹${shipping}`;

  const discRow = document.getElementById('discount-row');
  const discEl = document.getElementById('summary-discount');
  if (couponDiscount > 0) {
    if (discRow) discRow.style.display = 'flex';
    if (discEl) discEl.textContent = `-₹${discountAmt.toLocaleString('en-IN')}`;
  } else {
    if (discRow) discRow.style.display = 'none';
  }

  // Store for checkout
  localStorage.setItem('th_cart_summary', JSON.stringify({
    subtotal, discountAmt, shipping, tax, total, couponCode, couponDiscount
  }));
}

window.updateQty = function(productId, newQty) {
  const cart = getLocalCart();
  const item = cart.find(i => i.product === productId);
  if (!item) return;

  if (newQty <= 0) {
    removeItem(productId, item.name);
    return;
  }

  const max = item.stock || 99;
  item.quantity = Math.min(Math.max(1, newQty), max);
  saveLocalCart(cart);
  renderCart();

  if (Auth.isLoggedIn()) {
    window.api.updateCart(productId, item.quantity).catch(() => {});
  }
};

window.removeItem = function(productId, name) {
  removeFromCartLocal(productId);
  renderCart();
  showToast(`"${name}" removed from cart`, 'info');

  if (Auth.isLoggedIn()) {
    window.api.removeFromCart(productId).catch(() => {});
  }
};

window.moveToWishlist = function(productId) {
  const cart = getLocalCart();
  const item = cart.find(i => i.product === productId);
  if (!item) return;

  const mockProduct = { _id: productId, name: item.name };
  toggleWishlistLocal(mockProduct);
  removeItem(productId, item.name);
};

window.clearCartAndUpdate = function() {
  localStorage.removeItem('th_cart');
  updateCartCount();
  renderCart();
  showToast('Cart cleared', 'info');
};

window.applyCoupon = async function() {
  const code = document.getElementById('coupon-input')?.value?.trim().toUpperCase();
  const msgEl = document.getElementById('coupon-message');
  if (!code) return;

  const validCoupons = { 'TIMBER10': 10, 'WOOD20': 20, 'NEWUSER15': 15, 'LUXURY25': 25 };
  const discount = validCoupons[code];

  if (discount) {
    couponDiscount = discount;
    couponCode = code;
    if (msgEl) msgEl.innerHTML = `<span style="color:#4CAF79">✓ Coupon applied! You save ${discount}%</span>`;
    updateSummary();
    showToast(`🎉 Coupon "${code}" applied — ${discount}% off!`, 'success');
  } else {
    if (msgEl) msgEl.innerHTML = `<span style="color:#E05252">✗ Invalid coupon code</span>`;
    showToast('Invalid coupon code', 'error');
  }
};

window.proceedToCheckout = function() {
  const cart = getLocalCart();
  if (!cart.length) {
    showToast('Cart is empty!', 'warning');
    return;
  }
  location.href = 'checkout.html';
};

async function loadRecommendations() {
  const container = document.getElementById('cart-recommendations');
  if (!container) return;

  try {
    const res = await window.api.getProducts({ featured: true, limit: 3 });
    const products = (res.products || MOCK_PRODUCTS).slice(0, 3);

    container.innerHTML = products.map(p => `
      <div style="display:flex;gap:0.75rem;align-items:center;cursor:pointer" data-href="product-detail.html?id=${p._id}">
        <img src="${p.images?.[0]?.url || window.PLACEHOLDER_IMG}" alt="${p.name}"
          style="width:52px;height:52px;border-radius:var(--radius-md);object-fit:cover;flex-shrink:0" onerror="${window.ONERROR_IMG}">
        <div style="flex:1;min-width:0">
          <div style="font-size:var(--fs-xs);font-weight:600;color:var(--text-primary);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${p.name}</div>
          <div style="font-size:var(--fs-xs);color:var(--c-teak);font-weight:700">₹${(p.finalPrice||p.price).toLocaleString('en-IN')}</div>
        </div>
        <button class="btn btn-sm btn-ghost" data-action="addToCartLocal" data-args='[${JSON.stringify(p).replace(/"/g,'&quot;')}]'>+</button>
      </div>
    `).join('');
  } catch {}
}
