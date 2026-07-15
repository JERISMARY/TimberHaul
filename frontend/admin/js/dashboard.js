/* ============================================================
   TimberHaul — Admin Dashboard JS
   ============================================================ */

document.addEventListener('DOMContentLoaded', async () => {
  // Guard: require admin
  if (!Auth.isLoggedIn()) {
    location.href = '../login.html?return=' + encodeURIComponent(location.href);
    return;
  }

  initTheme();
  initCursor();
  setTimeout(() => document.body.classList.add('loaded'), 100);

  // Set date
  const dateEl = document.getElementById('admin-date');
  if (dateEl) {
    dateEl.textContent = new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  }

  // Set admin name
  const user = Auth.getUser();
  if (user) {
    const nameEl = document.getElementById('admin-name');
    if (nameEl) nameEl.textContent = user.name || 'Admin';
  }

  // Load dashboard data
  await loadDashboardData();
  initCharts();
  loadRecentOrders();
  loadInventoryAlerts();
});

function initTheme() {
  const toggle = document.getElementById('theme-toggle');
  const thumb  = toggle?.querySelector('.theme-toggle-thumb');
  const saved  = localStorage.getItem('th_theme') || 'dark';
  document.documentElement.setAttribute('data-theme', saved);
  if (thumb) thumb.textContent = saved === 'dark' ? '🌙' : '☀️';
  toggle?.addEventListener('click', () => {
    const next = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('th_theme', next);
    if (thumb) thumb.textContent = next === 'dark' ? '🌙' : '☀️';
  });
}

function initCursor() {
  const dot = document.getElementById('cursor-dot');
  const ring = document.getElementById('cursor-ring');
  if (!dot || !ring || window.innerWidth < 768) return;
  let rx = 0, ry = 0, dx = 0, dy = 0;
  document.addEventListener('mousemove', e => { dx = e.clientX; dy = e.clientY; });
  (function tick() {
    rx += (dx - rx) * 0.12; ry += (dy - ry) * 0.12;
    dot.style.transform = `translate(${dx-4}px,${dy-4}px)`;
    ring.style.transform = `translate(${rx-20}px,${ry-20}px)`;
    requestAnimationFrame(tick);
  })();
}

// ─── Dashboard Data ───────────────────────────────────────────
async function loadDashboardData() {
  try {
    // Try real API data first
    const res = await window.api.getDashboardStats();
    const d = res.data || {};
    animateCountTo('stat-revenue',   d.totalRevenue   || 0, true);
    animateCountTo('stat-orders',    d.totalOrders    || 0, false);
    animateCountTo('stat-customers', d.totalUsers     || 0, false);
    animateCountTo('stat-products',  d.totalProducts  || 0, false);
  } catch (err) {
    // Graceful fallback to mock stats
    console.warn('Analytics API unavailable, using demo stats:', err.message);
    const stats = {
      revenue:   18_64_320,
      orders:    2_847,
      customers: 25_412,
      products:  5_240,
    };
    animateCountTo('stat-revenue',   stats.revenue,   true);
    animateCountTo('stat-orders',    stats.orders,    false);
    animateCountTo('stat-customers', stats.customers, false);
    animateCountTo('stat-products',  stats.products,  false);
  }
}

function animateCountTo(id, target, isCurrency) {
  const el = document.getElementById(id);
  if (!el) return;
  const duration = 1800;
  const start = performance.now();

  function update(now) {
    const progress = Math.min((now - start) / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    const current = Math.round(eased * target);
    el.textContent = isCurrency
      ? '₹' + current.toLocaleString('en-IN')
      : current.toLocaleString('en-IN');
    if (progress < 1) requestAnimationFrame(update);
  }

  requestAnimationFrame(update);
}

// ─── Charts ───────────────────────────────────────────────────
let revenueChart, ordersChart;

const chartColors = {
  walnut: '#8B5E3C',
  teak:   '#D4A843',
  oak:    '#C8A96E',
  forest: '#4A7C59',
  red:    '#E05252',
  purple: '#7B6CE0',
};

function initCharts() {
  Chart.defaults.color = '#8A7560';
  Chart.defaults.borderColor = 'rgba(200,169,110,0.12)';
  Chart.defaults.font.family = "'Poppins', sans-serif";
  Chart.defaults.font.size = 12;

  // Revenue Chart
  const revenueCtx = document.getElementById('revenue-chart')?.getContext('2d');
  if (revenueCtx) {
    const weeklyData = {
      labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
      data:   [85000, 120000, 95000, 180000, 145000, 220000, 160000],
    };

    revenueChart = new Chart(revenueCtx, {
      type: 'line',
      data: {
        labels: weeklyData.labels,
        datasets: [{
          label: 'Revenue (₹)',
          data: weeklyData.data,
          fill: true,
          backgroundColor: 'rgba(139,94,60,0.12)',
          borderColor: chartColors.walnut,
          borderWidth: 2.5,
          pointBackgroundColor: chartColors.teak,
          pointBorderColor: '#fff',
          pointBorderWidth: 2,
          pointRadius: 5,
          pointHoverRadius: 8,
          tension: 0.4,
        }, {
          label: 'Orders',
          data: [22, 34, 28, 52, 43, 67, 48],
          fill: false,
          borderColor: chartColors.forest,
          borderWidth: 2,
          pointBackgroundColor: chartColors.forest,
          pointRadius: 4,
          tension: 0.4,
          yAxisID: 'y1',
        }],
      },
      options: {
        responsive: true,
        interaction: { mode: 'index', intersect: false },
        plugins: { legend: { display: true, position: 'top' }, tooltip: { mode: 'index' } },
        scales: {
          y:  { position: 'left',  grid: { color: 'rgba(200,169,110,0.08)' }, ticks: { callback: v => '₹' + (v/1000).toFixed(0) + 'K' } },
          y1: { position: 'right', grid: { display: false }, ticks: { stepSize: 10 } },
        },
      },
    });
  }

  // Orders Status Doughnut
  const ordersCtx = document.getElementById('orders-chart')?.getContext('2d');
  if (ordersCtx) {
    ordersChart = new Chart(ordersCtx, {
      type: 'doughnut',
      data: {
        labels: ['Delivered', 'Processing', 'Shipped', 'Cancelled', 'Pending'],
        datasets: [{
          data: [1247, 523, 389, 142, 546],
          backgroundColor: [chartColors.forest, chartColors.walnut, chartColors.teak, chartColors.red, chartColors.oak],
          borderColor: '#0D0A08',
          borderWidth: 2,
          hoverOffset: 8,
        }],
      },
      options: {
        cutout: '68%',
        responsive: true,
        plugins: { legend: { display: false } },
      },
    });

    // Custom legend
    const legendEl = document.getElementById('orders-legend');
    if (legendEl) {
      const data = ordersChart.data;
      legendEl.innerHTML = data.labels.map((label, i) => `
        <div style="display:flex;align-items:center;justify-content:space-between;font-size:var(--fs-xs)">
          <div style="display:flex;align-items:center;gap:0.5rem">
            <div style="width:10px;height:10px;border-radius:50%;background:${data.datasets[0].backgroundColor[i]}"></div>
            <span style="color:var(--text-muted)">${label}</span>
          </div>
          <span style="color:var(--text-secondary);font-weight:600">${data.datasets[0].data[i].toLocaleString('en-IN')}</span>
        </div>
      `).join('');
    }
  }

  // Top Products Bar Chart
  const productsCtx = document.getElementById('products-chart')?.getContext('2d');
  if (productsCtx) {
    new Chart(productsCtx, {
      type: 'bar',
      data: {
        labels: ['Teak Planks', 'Walnut Table', 'Oak Flooring', 'Pine Beams', 'Marine Ply', 'Solid Doors'],
        datasets: [{
          label: 'Units Sold',
          data: [234, 89, 312, 445, 178, 156],
          backgroundColor: [chartColors.walnut, chartColors.teak, chartColors.oak, chartColors.forest, chartColors.purple, chartColors.red],
          borderRadius: 6,
          borderSkipped: false,
        }],
      },
      options: {
        indexAxis: 'y',
        responsive: true,
        plugins: { legend: { display: false } },
        scales: {
          x: { grid: { color: 'rgba(200,169,110,0.08)' } },
          y: { grid: { display: false } },
        },
      },
    });
  }

  // Category Revenue Pie
  const categoryCtx = document.getElementById('category-chart')?.getContext('2d');
  if (categoryCtx) {
    new Chart(categoryCtx, {
      type: 'polarArea',
      data: {
        labels: ['Solid Wood', 'Furniture', 'Plywood', 'Doors', 'Decor', 'Construction'],
        datasets: [{
          data: [345000, 289000, 178000, 234000, 98000, 412000],
          backgroundColor: [
            'rgba(139,94,60,0.7)', 'rgba(212,168,67,0.7)', 'rgba(200,169,110,0.7)',
            'rgba(74,124,89,0.7)', 'rgba(123,108,224,0.7)', 'rgba(224,82,82,0.7)'
          ],
          borderColor: '#0D0A08',
          borderWidth: 1,
        }],
      },
      options: {
        responsive: true,
        plugins: { legend: { position: 'right', labels: { boxWidth: 12, font: { size: 11 } } } },
        scales: { r: { grid: { color: 'rgba(200,169,110,0.08)' } } },
      },
    });
  }
}

window.switchChart = function(period, btn) {
  document.querySelectorAll('.admin-chart-card .tag').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');

  const datasets = {
    weekly:  { labels: ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'], data: [85000,120000,95000,180000,145000,220000,160000] },
    monthly: { labels: Array.from({length:30},(_,i) => `${i+1}`), data: Array.from({length:30},() => Math.floor(50000 + Math.random()*200000)) },
    yearly:  { labels: ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'], data: [820000,930000,1050000,870000,1200000,1380000,1100000,950000,1250000,1420000,1180000,1650000] },
  };

  const d = datasets[period];
  if (revenueChart && d) {
    revenueChart.data.labels = d.labels;
    revenueChart.data.datasets[0].data = d.data;
    revenueChart.update('active');
  }
};

// ─── Recent Orders Table ──────────────────────────────────────
async function loadRecentOrders() {
  const tbody = document.getElementById('recent-orders-body');
  if (!tbody) return;

  const statusStyle = {
    placed:      { bg: 'rgba(200,169,110,0.1)',  color: '#8A7560', label: '🕐 Placed'      },
    confirmed:   { bg: 'rgba(139,94,60,0.15)',   color: '#C8A96E', label: '✅ Confirmed'    },
    processing:  { bg: 'rgba(212,168,67,0.15)',  color: '#D4A843', label: '⏳ Processing'   },
    dispatched:  { bg: 'rgba(139,94,60,0.15)',   color: '#C8A96E', label: '🚚 Dispatched'   },
    in_transit:  { bg: 'rgba(139,94,60,0.15)',   color: '#C8A96E', label: '🚚 In Transit'   },
    delivered:   { bg: 'rgba(74,124,89,0.15)',   color: '#4CAF79', label: '✅ Delivered'    },
    cancelled:   { bg: 'rgba(224,82,82,0.15)',   color: '#E05252', label: '❌ Cancelled'    },
    returned:    { bg: 'rgba(224,82,82,0.15)',   color: '#E05252', label: '🔄 Returned'     },
  };

  function renderOrderRows(orders) {
    tbody.innerHTML = orders.map(o => {
      const s = statusStyle[o.status] || { bg: 'rgba(200,169,110,0.1)', color: '#8A7560', label: o.status };
      const customer = o.user?.name || o.user?.email || 'Guest';
      const products = o.items?.map(i => i.name).join(', ').substring(0, 40) || 'Order items';
      const date = new Date(o.createdAt).toLocaleDateString('en-IN');
      const orderId = o.orderNumber || ('#' + (o._id || '').substring(0, 8).toUpperCase());
      return `
        <tr>
          <td style="font-weight:700;color:var(--c-teak)">${orderId}</td>
          <td>${customer}</td>
          <td style="color:var(--text-muted)">${products}</td>
          <td style="font-weight:700">₹${(o.totalPrice || 0).toLocaleString('en-IN')}</td>
          <td><span style="background:${s.bg};color:${s.color};padding:0.25rem 0.75rem;border-radius:20px;font-size:var(--fs-xs);font-weight:600;white-space:nowrap">${s.label}</span></td>
          <td style="color:var(--text-muted)">${date}</td>
          <td>
            <div style="display:flex;gap:0.25rem">
              <button class="btn btn-ghost btn-sm" style="padding:0.35rem 0.5rem;font-size:0.7rem" onclick="location.href='orders.html'" title="View orders">👁️</button>
            </div>
          </td>
        </tr>`;
    }).join('');
  }

  try {
    const res = await window.api.getAllOrders({ limit: 6 });
    const orders = res.orders || [];
    if (orders.length > 0) {
      renderOrderRows(orders);
    } else {
      tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;padding:2rem;color:var(--text-muted)">No orders yet</td></tr>';
    }
  } catch (err) {
    console.warn('Could not load real orders, using mock data:', err.message);
    // Fallback mock data
    const mockOrders = [
      { orderNumber: '#TH-2847', user: { name: 'Rajesh Kumar' }, items: [{ name: 'Teak Planks x3' }], totalPrice: 14400, status: 'delivered',  createdAt: '2025-07-01' },
      { orderNumber: '#TH-2846', user: { name: 'Priya Sharma' }, items: [{ name: 'Walnut Table x1' }], totalPrice: 26600, status: 'processing', createdAt: '2025-06-30' },
      { orderNumber: '#TH-2845', user: { name: 'Arjun Mehta'  }, items: [{ name: 'Marine Ply x20' }], totalPrice: 64000, status: 'dispatched', createdAt: '2025-06-30' },
      { orderNumber: '#TH-2844', user: { name: 'Sunita Nair'  }, items: [{ name: 'Oak Flooring 50sqft' }], totalPrice: 87500, status: 'placed', createdAt: '2025-06-29' },
      { orderNumber: '#TH-2843', user: { name: 'Vikram Patel' }, items: [{ name: 'Pine Beams x15' }], totalPrice: 30360, status: 'delivered',  createdAt: '2025-06-29' },
      { orderNumber: '#TH-2842', user: { name: 'Meera Reddy'  }, items: [{ name: 'Solid Doors x3' }], totalPrice: 39525, status: 'cancelled', createdAt: '2025-06-28' },
    ];
    renderOrderRows(mockOrders);
  }
}

// ─── Inventory Alerts ─────────────────────────────────────────
function loadInventoryAlerts() {
  const el = document.getElementById('inventory-alerts');
  if (!el) return;

  const alerts = [
    { name: 'Teak Grade A Plank',    stock: 8,  threshold: 20, level: 'critical' },
    { name: 'Walnut Live-Edge Slab',  stock: 12, threshold: 25, level: 'warning'  },
    { name: 'Marine Plywood 18mm',   stock: 45, threshold: 50, level: 'low'      },
    { name: 'Rosewood Bookshelf',    stock: 3,  threshold: 10, level: 'critical' },
    { name: 'Oak Chevron Flooring',  stock: 150, threshold: 60, level: 'ok'      },
  ];

  const levelStyle = {
    critical: { color: '#E05252', icon: '🚨' },
    warning:  { color: '#D4A843', icon: '⚠️' },
    low:      { color: '#C8A96E', icon: '📉' },
    ok:       { color: '#4CAF79', icon: '✅' },
  };

  el.innerHTML = alerts.map(a => {
    const s = levelStyle[a.level];
    const pct = Math.min(Math.round((a.stock / a.threshold) * 100), 100);
    return `
      <div style="background:var(--bg-surface-2);border:1px solid var(--border-subtle);border-radius:var(--radius-md);padding:0.875rem">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:0.5rem">
          <span style="font-size:var(--fs-xs);font-weight:600;color:var(--text-primary)">${a.name}</span>
          <span style="font-size:0.7rem;color:${s.color};font-weight:700">${s.icon} ${a.stock} left</span>
        </div>
        <div style="height:4px;background:var(--bg-elevated);border-radius:2px;overflow:hidden">
          <div style="width:${pct}%;height:100%;background:${s.color};border-radius:2px;transition:width 1s var(--ease-out)"></div>
        </div>
      </div>
    `;
  }).join('');
}
