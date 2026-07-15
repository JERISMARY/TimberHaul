/* ============================================================
   TimberHaul — Main JS
   Global behaviors: nav, theme, cart, toast, back-to-top, cursor
   ============================================================ */

// ─── Global Constants ───────────────────────────────────────────
window.PLACEHOLDER_IMG = 'https://images.unsplash.com/photo-1546484396-fb3f6af5f40e?auto=format&fit=crop&w=800&q=80';
window.ONERROR_IMG = `this.onerror=null;this.src='${window.PLACEHOLDER_IMG}';`;

// ─── Page Load ────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  // PWA Setup
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/service-worker.js').catch(err => console.log('SW Reg Failed:', err));
    });
  }
  const manifestLink = document.createElement('link');
  manifestLink.rel = 'manifest';
  manifestLink.href = '/manifest.json';
  document.head.appendChild(manifestLink);

  const nav = document.getElementById('navbar');
  initNavbar();
  initTheme();
  initSearch();
  initBackToTop();
  initCart();
  initCursor();
  initRipple();
  initEventDelegation();
  loadWishlistCount();
  Auth.updateNavUI();

  // Fade page in
  setTimeout(() => document.body.classList.add('loaded'), 100);
});

// ─── Toast Notification System ────────────────────────────────
window.showToast = function (message, type = 'success', duration = 4000) {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const iconMap = { success: '✅', error: '❌', warning: '⚠️', info: 'ℹ️' };

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `
    <span class="toast-icon">${iconMap[type] || 'ℹ️'}</span>
    <span class="toast-msg">${message}</span>
    <button class="toast-close" onclick="this.parentElement.remove()">✕</button>
  `;

  container.appendChild(toast);

  setTimeout(() => {
    toast.classList.add('removing');
    setTimeout(() => toast.remove(), 300);
  }, duration);

  return toast;
};

// ─── Navbar ───────────────────────────────────────────────────
function initNavbar() {
  const navbar = document.getElementById('navbar');
  const hamburger = document.getElementById('nav-hamburger');
  const mobileMenu = document.getElementById('nav-mobile');

  if (!navbar) return;

  // Scroll effect
  const handleScroll = () => {
    if (window.scrollY > 60) {
      navbar.classList.add('scrolled');
    } else {
      navbar.classList.remove('scrolled');
    }
  };

  window.addEventListener('scroll', handleScroll, { passive: true });
  handleScroll();

  // Mobile menu toggle
  if (hamburger && mobileMenu) {
    hamburger.addEventListener('click', () => {
      const isOpen = mobileMenu.classList.contains('open');
      mobileMenu.classList.toggle('open');
      hamburger.classList.toggle('active');
      hamburger.setAttribute('aria-expanded', !isOpen);
      mobileMenu.setAttribute('aria-hidden', isOpen);
      document.body.classList.toggle('menu-open', !isOpen);
    });
  }

  // Close mobile menu on link click
  document.querySelectorAll('.nav-mobile-link').forEach(link => {
    link.addEventListener('click', () => {
      mobileMenu?.classList.remove('open');
      hamburger?.classList.remove('active');
      document.body.classList.remove('menu-open');
    });
  });

  // Highlight active nav link
  const currentPage = location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-link').forEach(link => {
    const href = link.getAttribute('href');
    if (href && href.includes(currentPage)) {
      link.classList.add('active');
    }
  });
}

// ─── Dark/Light Theme ─────────────────────────────────────────
function initTheme() {
  const toggle = document.getElementById('theme-toggle');
  const thumb = toggle?.querySelector('.theme-toggle-thumb');
  const savedTheme = localStorage.getItem('th_theme') || 'dark';

  applyTheme(savedTheme);

  toggle?.addEventListener('click', () => {
    const current = document.documentElement.getAttribute('data-theme') || 'dark';
    const next = current === 'dark' ? 'light' : 'dark';
    applyTheme(next);
    localStorage.setItem('th_theme', next);
  });

  function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    if (thumb) thumb.textContent = theme === 'dark' ? '🌙' : '☀️';
  }
}

// ─── Search ───────────────────────────────────────────────────
function initSearch() {
  const overlay = document.getElementById('search-overlay');
  const toggleBtn = document.getElementById('search-toggle');
  const closeBtn = document.getElementById('search-close');
  const input = document.getElementById('search-input');
  const resultsEl = document.getElementById('search-results');

  toggleBtn?.addEventListener('click', () => {
    overlay?.classList.add('active');
    setTimeout(() => input?.focus(), 150);
  });

  closeBtn?.addEventListener('click', closeSearch);
  overlay?.addEventListener('click', (e) => { if (e.target === overlay) closeSearch(); });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeSearch();
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
      e.preventDefault();
      overlay?.classList.toggle('active');
      if (overlay?.classList.contains('active')) setTimeout(() => input?.focus(), 150);
    }
  });

  let searchTimer;
  input?.addEventListener('input', () => {
    clearTimeout(searchTimer);
    const q = input.value.trim();
    if (q.length < 2) {
      resultsEl.style.display = 'none';
      return;
    }
    searchTimer = setTimeout(() => performSearch(q), 350);
  });

  input?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      const q = input.value.trim();
      if (q) doSearch(q);
    }
  });

  function closeSearch() {
    overlay?.classList.remove('active');
    if (input) input.value = '';
    if (resultsEl) resultsEl.style.display = 'none';
  }

  async function performSearch(query) {
    try {
      const res = await window.api.getProducts({ search: query, limit: 5 });
      const products = res.products || [];

      if (!resultsEl) return;
      resultsEl.style.display = 'block';

      if (products.length === 0) {
        resultsEl.innerHTML = '<div style="text-align:center;color:var(--text-muted);padding:1.5rem;font-size:var(--fs-sm)">No products found for "' + query + '"</div>';
        return;
      }

      resultsEl.innerHTML = products.map(p => `
        <a href="product-detail.html?id=${p._id}" style="display:flex;align-items:center;gap:1rem;padding:0.75rem;border-radius:var(--radius-md);transition:background 0.2s;text-decoration:none" class="search-result-item" onmouseover="this.style.background='var(--bg-elevated)'" onmouseout="this.style.background='transparent'">
          <img src="${p.images?.[0]?.url || window.PLACEHOLDER_IMG}" alt="${p.name}" style="width:48px;height:48px;border-radius:var(--radius-sm);object-fit:cover;flex-shrink:0" onerror="${window.ONERROR_IMG}">
          <div style="flex:1;min-width:0">
            <div style="font-size:var(--fs-sm);font-weight:600;color:var(--text-primary);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${p.name}</div>
            <div style="font-size:var(--fs-xs);color:var(--text-muted)">${p.woodType} · ${p.category?.name || ''}</div>
          </div>
          <div style="font-size:var(--fs-sm);font-weight:700;color:var(--c-teak);white-space:nowrap">₹${(p.finalPrice || p.price).toLocaleString('en-IN')}</div>
        </a>
      `).join('') + `
        <a href="products.html?search=${encodeURIComponent(query)}" class="btn btn-ghost w-full" style="margin-top:0.75rem;border-radius:var(--radius-md)">
          View all results for "${query}" <i class="fa-solid fa-arrow-right"></i>
        </a>
      `;
    } catch (err) {
      console.error('Search error:', err);
    }
  }
}

window.doSearch = function (query) {
  location.href = `products.html?search=${encodeURIComponent(query)}`;
};

window.proceedToCheckout = function () {
  window.location.href = 'checkout.html';
};

// ─── Back to Top ──────────────────────────────────────────────
function initBackToTop() {
  const btn = document.getElementById('back-to-top');
  if (!btn) return;

  window.addEventListener('scroll', () => {
    btn.classList.toggle('visible', window.scrollY > 400);
  }, { passive: true });

  btn.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
}

// ─── Global Event Delegation for CSP Compliance ───────────────
function initEventDelegation() {
  document.addEventListener('click', (e) => {
    // 1. Handle data-href
    const hrefEl = e.target.closest('[data-href]');
    if (hrefEl) {
      e.preventDefault();
      location.href = hrefEl.getAttribute('data-href');
      return;
    }

    // 2. Handle data-action (e.g. data-action="Auth.logout")
    const actionEl = e.target.closest('[data-action]');
    if (actionEl) {
      e.preventDefault();
      const action = actionEl.getAttribute('data-action');
      const argsStr = actionEl.getAttribute('data-args');
      let args = [];
      if (argsStr) {
        try { args = JSON.parse(argsStr); } catch (err) { }
      }

      // Safe evaluation by traversing window object
      const parts = action.split('.');
      let obj = window;
      let ctx = window;
      for (let i = 0; i < parts.length; i++) {
        if (i === parts.length - 1) ctx = obj;
        obj = obj[parts[i]];
        if (!obj) {
          console.warn('Action not found:', action);
          return;
        }
      }
      if (typeof obj === 'function') {
        obj.apply(ctx, [actionEl, ...args]); // Pass the element as first argument by default, then args
      }
    }
  });

  document.addEventListener('change', (e) => {
    const actionEl = e.target.closest('[data-onchange]');
    if (actionEl) {
      const action = actionEl.getAttribute('data-onchange');
      const argsStr = actionEl.getAttribute('data-args');
      let args = [];
      if (argsStr) {
        try { args = JSON.parse(argsStr); } catch (err) { }
      }

      const parts = action.split('.');
      let obj = window;
      let ctx = window;
      for (let i = 0; i < parts.length; i++) {
        if (i === parts.length - 1) ctx = obj;
        obj = obj[parts[i]];
        if (!obj) return;
      }
      if (typeof obj === 'function') {
        obj.apply(ctx, [actionEl, ...args]);
      }
    }
  });
}

// ─── Cart Count ───────────────────────────────────────────────
function initCart() {
  updateCartCount();
}

function updateCartCount() {
  const countEl = document.getElementById('cart-count');
  if (!countEl) return;

  // Use localStorage cart as source of truth (syncs with API)
  const cart = getLocalCart();
  const total = cart.reduce((sum, item) => sum + item.quantity, 0);
  countEl.textContent = total;
  countEl.style.display = total > 0 ? 'flex' : 'none';
}

function getLocalCart() {
  try {
    return JSON.parse(localStorage.getItem('th_cart') || '[]');
  } catch { return []; }
}

function saveLocalCart(cart) {
  localStorage.setItem('th_cart', JSON.stringify(cart));
  updateCartCount();
}

window.addToCartLocal = function (product, quantity = 1) {
  const cart = getLocalCart();
  const existing = cart.find(i => i.product === product._id);

  if (existing) {
    existing.quantity = Math.min(existing.quantity + quantity, product.stock || 99);
  } else {
    cart.push({
      product: product._id,
      name: product.name,
      price: product.finalPrice || product.price,
      image: product.images?.[0]?.url || '',
      woodType: product.woodType,
      stock: product.stock,
      quantity
    });
  }

  saveLocalCart(cart);
  showToast(`${product.name} added to cart!`, 'success');

  // If logged in, also add to API cart
  if (Auth.isLoggedIn()) {
    window.api.addToCart(product._id, quantity).catch(() => { });
  }
};

window.removeFromCartLocal = function (productId) {
  const cart = getLocalCart().filter(i => i.product !== productId);
  saveLocalCart(cart);
};

window.getLocalCart = getLocalCart;

// ─── Wishlist Count ───────────────────────────────────────────
function loadWishlistCount() {
  const wishlistIds = JSON.parse(localStorage.getItem('th_wishlist') || '[]');
  const el = document.getElementById('wishlist-count');
  if (el) {
    el.textContent = wishlistIds.length;
    el.style.display = wishlistIds.length > 0 ? 'flex' : 'none';
  }
}

window.toggleWishlistLocal = function (product) {
  let wishlist = JSON.parse(localStorage.getItem('th_wishlist') || '[]');
  const idx = wishlist.indexOf(product._id);

  if (idx === -1) {
    wishlist.push(product._id);
    showToast(`Added "${product.name}" to wishlist ❤️`, 'success');
  } else {
    wishlist.splice(idx, 1);
    showToast(`Removed from wishlist`, 'info');
  }

  localStorage.setItem('th_wishlist', JSON.stringify(wishlist));
  loadWishlistCount();
  return idx === -1; // true = added
};

window.isInWishlist = function (productId) {
  const wishlist = JSON.parse(localStorage.getItem('th_wishlist') || '[]');
  return wishlist.includes(productId);
};

// ─── Modal ────────────────────────────────────────────────────
window.openModal = function (id) {
  const modal = document.getElementById(id);
  if (modal) {
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
  }
};

window.setInputValue = function (el, id, value) {
  const target = document.getElementById(id);
  if (target) target.value = value;
};

window.navigate = function (el, url) {
  const protectedUrls = ['cart.html', 'wishlist.html', 'profile.html', 'checkout.html'];
  const needsAuth = protectedUrls.some(p => url.includes(p));

  if (needsAuth && (!window.Auth || !window.Auth.isLoggedIn())) {
    location.href = `login.html?return=${encodeURIComponent(url)}`;
    return;
  }
  location.href = url;
};

window.closeModal = function (id) {
  const modal = document.getElementById(id);
  if (modal) {
    modal.classList.remove('active');
    document.body.style.overflow = '';
  }
};

// Close modals on backdrop click
document.addEventListener('click', (e) => {
  if (e.target.classList.contains('modal-overlay')) {
    e.target.classList.remove('active');
    document.body.style.overflow = '';
  }
});

// ─── Custom Cursor ────────────────────────────────────────────
function initCursor() {
  // Only on non-touch devices
  if ('ontouchstart' in window || window.innerWidth < 768) return;

  const dot = document.getElementById('cursor-dot');
  const ring = document.getElementById('cursor-ring');
  if (!dot || !ring) return;

  let ringX = 0, ringY = 0;
  let dotX = 0, dotY = 0;
  let raf;

  document.addEventListener('mousemove', (e) => {
    dotX = e.clientX;
    dotY = e.clientY;
  });

  function animate() {
    ringX += (dotX - ringX) * 0.12;
    ringY += (dotY - ringY) * 0.12;

    dot.style.transform = `translate(${dotX - 4}px, ${dotY - 4}px)`;
    ring.style.transform = `translate(${ringX - 20}px, ${ringY - 20}px)`;

    raf = requestAnimationFrame(animate);
  }

  animate();

  // Hover effects
  document.querySelectorAll('a, button, .product-card, .cat-card, .nav-action-btn').forEach(el => {
    el.addEventListener('mouseenter', () => ring.classList.add('hovered'));
    el.addEventListener('mouseleave', () => ring.classList.remove('hovered'));
  });

  document.addEventListener('mouseleave', () => {
    dot.style.opacity = '0';
    ring.style.opacity = '0';
  });

  document.addEventListener('mouseenter', () => {
    dot.style.opacity = '1';
    ring.style.opacity = '1';
  });
}

// ─── Ripple Effect ────────────────────────────────────────────
function initRipple() {
  document.addEventListener('click', (e) => {
    const target = e.target.closest('.ripple-container');
    if (!target) return;

    const rect = target.getBoundingClientRect();
    const ripple = document.createElement('div');
    const size = Math.max(rect.width, rect.height);

    ripple.className = 'ripple-effect';
    ripple.style.cssText = `
      width: ${size}px;
      height: ${size}px;
      left: ${e.clientX - rect.left - size / 2}px;
      top: ${e.clientY - rect.top - size / 2}px;
    `;

    target.appendChild(ripple);
    ripple.addEventListener('animationend', () => ripple.remove());
  });
}

// ─── Newsletter Subscribe ─────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  const form = document.querySelector('.footer-newsletter-form');
  if (form) {
    form.addEventListener('submit', async function (event) {
      event.preventDefault();
      const emailInput = form.querySelector('input[type="email"]');
      const email = emailInput?.value?.trim();

      if (!email) return;

      const btn = form.querySelector('button[type="submit"]');
      if (btn) {
        btn.disabled = true;
        btn.innerHTML = '<span class="spinner spinner-sm"></span>';
      }

      // Simulate API call (replace with real endpoint)
      await new Promise(r => setTimeout(r, 1000));

      showToast('🎉 Subscribed successfully! Check your inbox.', 'success');
      form.reset();

      if (btn) {
        btn.disabled = false;
        btn.innerHTML = '→';
      }
    });
  }
});

// ─── Contact Form ─────────────────────────────────────────────
window.submitContact = async function (event) {
  event.preventDefault();
  const btn = document.getElementById('contact-submit-btn');
  if (btn) {
    btn.disabled = true;
    btn.innerHTML = '<span class="spinner spinner-sm"></span> Sending...';
  }

  const data = {
    name: document.getElementById('contact-name')?.value,
    email: document.getElementById('contact-email')?.value,
    phone: document.getElementById('contact-phone')?.value,
    subject: document.getElementById('contact-subject')?.value,
    message: document.getElementById('contact-message')?.value,
  };

  try {
    await window.api.sendMessage(data);
    showToast('✅ Message sent! We\'ll reply within 24 hours.', 'success');
    event.target.reset();
  } catch (err) {
    showToast('Failed to send message. Please try again.', 'error');
  } finally {
    if (btn) {
      btn.disabled = false;
      btn.innerHTML = '<i class="fa-solid fa-paper-plane"></i> Send Message';
    }
  }
};

// ─── Product Quick View ───────────────────────────────────────
window.quickView = function (product) {
  document.getElementById('quick-view-title').textContent = 'Quick View';
  document.getElementById('qv-img').src = product.images?.[0]?.url || '';
  document.getElementById('qv-img').alt = product.name;
  document.getElementById('qv-name').textContent = product.name;
  document.getElementById('qv-wood-type').textContent = product.woodType;

  const finalPrice = product.finalPrice || product.price;
  document.getElementById('qv-price').textContent = `₹${finalPrice.toLocaleString('en-IN')}`;

  const origEl = document.getElementById('qv-original-price');
  if (product.discount > 0) {
    origEl.textContent = `₹${product.price.toLocaleString('en-IN')}`;
    origEl.style.display = '';
  } else {
    origEl.style.display = 'none';
  }

  document.getElementById('qv-rating').innerHTML = `
    <span class="rating-stars">${'★'.repeat(Math.round(product.rating))}${'☆'.repeat(5 - Math.round(product.rating))}</span>
    <span class="rating-count">(${product.numReviews})</span>
  `;

  document.getElementById('qv-desc').textContent = product.shortDescription || product.description?.substring(0, 200) + '...' || '';

  document.getElementById('qv-add-cart').onclick = () => {
    addToCartLocal(product);
    closeModal('quick-view-modal');
  };

  document.getElementById('qv-view-full').onclick = () => {
    location.href = `product-detail.html?id=${product._id}`;
  };

  openModal('quick-view-modal');
};

// ─── Format helpers ───────────────────────────────────────────
window.formatPrice = (price) => `₹${Number(price).toLocaleString('en-IN')}`;
window.formatDate = (d) => new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
window.truncate = (str, n) => str?.length > n ? str.substring(0, n) + '...' : str;

window.renderStars = function (rating) {
  const full = Math.floor(rating);
  const half = rating % 1 >= 0.5 ? 1 : 0;
  const empty = 5 - full - half;
  return '★'.repeat(full) + (half ? '½' : '') + '☆'.repeat(empty);
};
