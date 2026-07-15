/* ============================================================
   TimberHaul — Products Page JS
   Filters, sorting, pagination, dynamic loading
   ============================================================ */

let currentPage = 1;
let totalPages  = 1;
let selectedRating = 0;
let currentView = 'grid';
const ITEMS_PER_PAGE = 12;

// Parse URL params
const urlParams = new URLSearchParams(location.search);

document.addEventListener('DOMContentLoaded', () => {
  // Pre-select filters from URL
  const categoryParam = urlParams.get('category');
  const woodTypeParam  = urlParams.get('woodType');
  const searchParam    = urlParams.get('search');

  if (categoryParam) {
    const cb = document.querySelector(`input[name="category"][value="${categoryParam}"]`);
    if (cb) cb.checked = true;
    const title = document.getElementById('page-title');
    const crumb = document.getElementById('breadcrumb-current');
    if (title) title.textContent = categoryParam.replace(/-/g,' ').replace(/\b\w/g, c => c.toUpperCase());
    if (crumb) crumb.textContent = categoryParam.replace(/-/g,' ').replace(/\b\w/g, c => c.toUpperCase());
  }

  if (woodTypeParam) {
    const cb = document.querySelector(`input[name="woodType"][value="${woodTypeParam}"]`);
    if (cb) cb.checked = true;
  }

  if (searchParam) {
    const title = document.getElementById('page-title');
    if (title) title.textContent = `Search: "${searchParam}"`;
  }

  applyFilters();
  initPriceSliders();
});

// ─── Build API params from filters ────────────────────────────
function buildParams() {
  const params = { page: currentPage, limit: ITEMS_PER_PAGE };

  // Categories
  const selectedCats = [...document.querySelectorAll('input[name="category"]:checked')].map(cb => cb.value);
  if (selectedCats.length === 1) params.category = selectedCats[0];

  // Wood types
  const selectedWoods = [...document.querySelectorAll('input[name="woodType"]:checked')].map(cb => cb.value);
  if (selectedWoods.length === 1) params.woodType = selectedWoods[0];

  // Price
  const minP = parseInt(document.getElementById('min-price-slider')?.value || 0);
  const maxP = parseInt(document.getElementById('max-price-slider')?.value || 100000);
  if (minP > 0)     params.minPrice = minP;
  if (maxP < 100000) params.maxPrice = maxP;

  // Rating
  if (selectedRating > 0) params.rating = selectedRating;

  // Checkboxes
  if (document.getElementById('in-stock-filter')?.checked) params.inStock = true;
  if (document.getElementById('featured-filter')?.checked)  params.featured = true;

  // Sort
  params.sort = document.getElementById('sort-select')?.value || '-createdAt';

  // Search
  const searchQ = urlParams.get('search');
  if (searchQ) params.search = searchQ;

  return params;
}

// ─── Apply filters & reload ────────────────────────────────────
window.applyFilters = async function() {
  currentPage = 1;
  await loadProducts();
  updateActiveFilterTags();
};

async function loadProducts() {
  const grid = document.getElementById('products-grid');
  const countEl = document.getElementById('products-count');
  if (!grid) return;

  // Show skeletons
  grid.innerHTML = Array(6).fill(0).map(() =>
    `<div class="product-card skeleton" style="height:380px"></div>`
  ).join('');

  try {
    const params = buildParams();
    const res = await window.api.getProducts(params);
    const products = res.products || [];
    totalPages = res.pages || 1;

    if (countEl) {
      countEl.textContent = `${res.total || products.length} product${(res.total || products.length) !== 1 ? 's' : ''} found`;
    }

    if (!products.length) {
      grid.innerHTML = `
        <div style="grid-column:1/-1;text-align:center;padding:5rem 2rem;color:var(--text-muted)">
          <div style="font-size:4rem;margin-bottom:1rem">🪵</div>
          <h3 style="font-family:var(--font-display);font-size:var(--fs-2xl);color:var(--text-secondary);margin-bottom:0.5rem">No products found</h3>
          <p style="margin-bottom:1.5rem">Try adjusting your filters or search criteria</p>
          <button class="btn btn-outline" data-action="clearFilters">Clear All Filters</button>
        </div>`;
      renderPagination(0, 0);
      return;
    }

    if (currentView === 'list') {
      grid.style.gridTemplateColumns = '1fr';
      grid.innerHTML = products.map((p, i) => buildListCard(p, i)).join('');
    } else {
      grid.style.gridTemplateColumns = '';
      grid.innerHTML = products.map((p, i) => buildProductCard(p, i)).join('');
    }

    // Reveal
    requestAnimationFrame(() => {
      grid.querySelectorAll('.product-card, .list-card').forEach((card, i) => {
        setTimeout(() => card.classList.add('revealed'), i * 50);
        card.style.opacity = '0';
        card.style.transform = 'translateY(20px)';
        card.style.transition = 'opacity 0.4s ease, transform 0.4s ease';
        setTimeout(() => {
          card.style.opacity = '1';
          card.style.transform = 'none';
        }, i * 60 + 50);
      });
    });

    renderPagination(currentPage, totalPages);

  } catch (err) {
    console.error('Products load error:', err);
    // Fallback to mock data
    const products = MOCK_PRODUCTS;
    if (countEl) countEl.textContent = `${products.length} products found`;
    grid.innerHTML = products.map((p, i) => buildProductCard(p, i)).join('');
  }
}

// ─── List View Card ───────────────────────────────────────────
function buildListCard(p, i) {
  const finalPrice = p.finalPrice || p.price;
  const imgSrc = p.images?.[0]?.url || window.PLACEHOLDER_IMG;
  const dim = p.dimensions ? `${p.dimensions.length}×${p.dimensions.width}×${p.dimensions.thickness}${p.dimensions.unit}` : '';

  return `
    <div class="product-card" style="flex-direction:row;height:auto;padding:1.25rem;cursor:pointer" data-href="product-detail.html?id=${p._id}" data-id="${p._id}">
      <div style="width:160px;height:160px;border-radius:var(--radius-lg);overflow:hidden;flex-shrink:0;background-image:url('${imgSrc}');background-size:cover;background-position:center"></div>
      <div style="flex:1;padding:0.5rem 1.25rem;display:flex;flex-direction:column;gap:0.4rem">
        <div style="font-size:var(--fs-xs);color:var(--c-oak);font-weight:600;text-transform:uppercase">${p.category?.name || 'Timber'}</div>
        <h3 style="font-family:var(--font-display);font-size:var(--fs-xl);font-weight:700;color:var(--text-primary)">${p.name}</h3>
        <div style="display:flex;gap:1rem;font-size:var(--fs-xs);color:var(--text-muted)">
          <span>🪵 ${p.woodType}</span>${dim ? `<span>📐 ${dim}</span>` : ''}
          <span>⭐ ${p.rating} (${p.numReviews})</span>
        </div>
        <p style="font-size:var(--fs-sm);color:var(--text-muted);line-height:1.6;flex:1">${truncate(p.description || p.shortDescription || '', 180)}</p>
      </div>
      <div style="display:flex;flex-direction:column;align-items:flex-end;justify-content:space-between;min-width:160px;padding:0.5rem 0">
        <div>
          <div class="price-current" style="font-size:var(--fs-2xl)">₹${finalPrice.toLocaleString('en-IN')}</div>
          ${p.discount > 0 ? `<div class="price-original">₹${p.price.toLocaleString('en-IN')}</div>` : ''}
        </div>
        <div style="display:flex;flex-direction:column;gap:0.5rem">
          <button class="btn btn-primary btn-sm" data-action="addToCartLocal" data-args='[${JSON.stringify(p).replace(/"/g,'&quot;')}]'>
            <i class="fa-solid fa-cart-plus"></i> Add
          </button>
          <button class="btn btn-ghost btn-sm" data-action="quickView" data-args='[${JSON.stringify(p).replace(/"/g,'&quot;')}]'>Quick View</button>
        </div>
      </div>
    </div>
  `;
}

// ─── Pagination ───────────────────────────────────────────────
function renderPagination(current, total) {
  const el = document.getElementById('pagination');
  if (!el || total <= 1) { if (el) el.innerHTML = ''; return; }

  let pages = [];
  // Always show first, last, and pages around current
  for (let i = 1; i <= total; i++) {
    if (i === 1 || i === total || (i >= current - 2 && i <= current + 2)) {
      pages.push(i);
    } else if (pages[pages.length - 1] !== '...') {
      pages.push('...');
    }
  }

  el.innerHTML = `
    <button class="page-btn" data-action="changePage" data-args='[${current - 1}]' ${current === 1 ? 'disabled style="opacity:0.4"' : ''}>
      <i class="fa-solid fa-chevron-left"></i>
    </button>
    ${pages.map(p => p === '...' 
      ? '<span class="page-dots">...</span>' 
      : `<button class="page-btn ${p === current ? 'active' : ''}" data-action="changePage" data-args='[${p}]'>${p}</button>`
    ).join('')}
    <button class="page-btn" data-action="changePage" data-args='[${current + 1}]' ${current === total ? 'disabled style="opacity:0.4"' : ''}>
      <i class="fa-solid fa-chevron-right"></i>
    </button>
  `;
}

window.changePage = function(page) {
  if (page < 1 || page > totalPages) return;
  currentPage = page;
  loadProducts();
  window.scrollTo({ top: 0, behavior: 'smooth' });
};

// ─── Filter utilities ─────────────────────────────────────────
window.clearFilters = function() {
  document.querySelectorAll('input[type="checkbox"]').forEach(cb => cb.checked = false);
  document.getElementById('min-price-slider').value = 0;
  document.getElementById('max-price-slider').value = 100000;
  selectedRating = 0;
  document.querySelectorAll('.rating-filter-btn').forEach(b => b.classList.remove('active'));
  document.getElementById('active-filters').innerHTML = '';
  applyFilters();
};

window.setRating = function(rating) {
  selectedRating = rating;
  document.querySelectorAll('.rating-filter-btn').forEach(b => b.classList.remove('active'));
  document.getElementById(`rating-${rating}`)?.classList.add('active');
  applyFilters();
};

window.setView = function(view) {
  currentView = view;
  document.getElementById('grid-view-btn')?.classList.toggle('active', view === 'grid');
  document.getElementById('list-view-btn')?.classList.toggle('active', view === 'list');
  loadProducts();
};

function initPriceSliders() {
  const minSlider = document.getElementById('min-price-slider');
  const maxSlider = document.getElementById('max-price-slider');

  if (minSlider) {
    minSlider.addEventListener('input', () => {
      if (parseInt(minSlider.value) > parseInt(maxSlider.value)) {
        minSlider.value = maxSlider.value;
      }
      updatePriceRange();
    });
  }
}

window.updatePriceRange = function() {
  const min = parseInt(document.getElementById('min-price-slider')?.value || 0);
  const max = parseInt(document.getElementById('max-price-slider')?.value || 100000);

  const minEl = document.getElementById('min-price-display');
  const maxEl = document.getElementById('max-price-display');
  if (minEl) minEl.textContent = min.toLocaleString('en-IN');
  if (maxEl) maxEl.textContent = max.toLocaleString('en-IN');

  // Update slider gradient
  const slider = document.getElementById('max-price-slider');
  if (slider) {
    const pct = (max / 100000) * 100;
    slider.style.setProperty('--val', `${pct}%`);
  }
};

function updateActiveFilterTags() {
  const container = document.getElementById('active-filters');
  if (!container) return;

  const tags = [];

  document.querySelectorAll('input[name="category"]:checked').forEach(cb => {
    tags.push({ label: cb.value.replace(/-/g,' '), remove: () => { cb.checked = false; applyFilters(); } });
  });

  document.querySelectorAll('input[name="woodType"]:checked').forEach(cb => {
    tags.push({ label: cb.value, remove: () => { cb.checked = false; applyFilters(); } });
  });

  if (selectedRating > 0) {
    tags.push({ label: `${selectedRating}+ Stars`, remove: () => setRating(0) });
  }

  container.innerHTML = tags.map((t, i) => `
    <span class="tag active" data-action="activeFilterRemove" data-args='[${i}]' style="cursor:pointer">
      ${t.label} ✕
    </span>
  `).join('');

  // Store remove functions
  window._filterRemoveFns = tags.map(t => t.remove);
}

window.activeFilterRemove = function(idx) {
  window._filterRemoveFns?.[idx]?.();
};
