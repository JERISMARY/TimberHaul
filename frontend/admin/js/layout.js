/* ============================================================
   TimberHaul — Admin Layout Injector
   ============================================================ */

const AdminLayout = {
  injectSidebar() {
    const sidebarHtml = `
    <aside class="admin-sidebar" id="admin-sidebar-main">
      <div class="admin-sidebar-logo">
        <a href="../index.html" class="nav-logo">
          <div class="nav-logo-icon" style="width:38px;height:38px;font-size:1.1rem">🪵</div>
          <div>
            <span class="nav-logo-text" style="font-size:1.25rem">Timber<span>Haul</span></span>
            <div style="font-size:0.65rem;color:var(--text-muted);margin-top:-2px">Admin Portal</div>
          </div>
        </a>
      </div>

      <div class="admin-nav-section">
        <div class="admin-nav-label">Overview</div>
        <a href="index.html" class="admin-nav-link" id="nav-dashboard">
          <span class="admin-nav-icon">📊</span> Dashboard
        </a>
      </div>

      <div class="admin-nav-section">
        <div class="admin-nav-label">Catalog</div>
        <a href="products.html" class="admin-nav-link" id="nav-products">
          <span class="admin-nav-icon">📦</span> Products
          <span class="admin-nav-badge" id="nb-products">0</span>
        </a>
        <a href="categories.html" class="admin-nav-link" id="nav-categories">
          <span class="admin-nav-icon">🗂️</span> Categories
        </a>
        <a href="inventory.html" class="admin-nav-link" id="nav-inventory">
          <span class="admin-nav-icon">🏭</span> Inventory
        </a>
      </div>

      <div class="admin-nav-section">
        <div class="admin-nav-label">Commerce</div>
        <a href="orders.html" class="admin-nav-link" id="nav-orders">
          <span class="admin-nav-icon">🛒</span> Orders
          <span class="admin-nav-badge" id="nb-orders">0</span>
        </a>
        <a href="customers.html" class="admin-nav-link" id="nav-customers">
          <span class="admin-nav-icon">👥</span> Customers
        </a>
        <a href="reviews.html" class="admin-nav-link" id="nav-reviews">
          <span class="admin-nav-icon">⭐</span> Reviews
        </a>
      </div>

      <div class="admin-nav-section">
        <div class="admin-nav-label">Content</div>
        <a href="blogs.html" class="admin-nav-link" id="nav-blogs">
          <span class="admin-nav-icon">✍️</span> Blog Posts
        </a>
        <a href="messages.html" class="admin-nav-link" id="nav-messages">
          <span class="admin-nav-icon">💬</span> Messages
          <span class="admin-nav-badge" id="nb-messages">0</span>
        </a>
      </div>

      <div class="admin-nav-section">
        <div class="admin-nav-label">System</div>
        <a href="analytics.html" class="admin-nav-link" id="nav-analytics">
          <span class="admin-nav-icon">📈</span> Analytics
        </a>
        <a href="reports.html" class="admin-nav-link" id="nav-reports">
          <span class="admin-nav-icon">📋</span> Reports
        </a>
        <a href="notifications.html" class="admin-nav-link" id="nav-notifications">
          <span class="admin-nav-icon">🔔</span> Notifications
        </a>
      </div>

      <div class="admin-nav-section">
        <div class="admin-nav-label">Settings</div>
        <a href="settings.html" class="admin-nav-link" id="nav-settings">
          <span class="admin-nav-icon">⚙️</span> Settings
        </a>
      </div>

      <div class="admin-sidebar-footer" style="padding: 1.5rem; margin-top: auto; border-top: 1px solid var(--border-color);">
        <div style="display:flex; align-items:center; gap: 0.75rem; cursor:pointer;" onclick="location.href='../profile.html'">
          <div id="admin-sidebar-avatar" style="width:36px; height:36px; border-radius:50%; background:var(--primary); display:flex; align-items:center; justify-content:center; color:white; font-weight:600;">A</div>
          <div style="flex:1; overflow:hidden;">
            <div id="admin-sidebar-name" style="font-weight:600; font-size:0.875rem; white-space:nowrap; text-overflow:ellipsis; overflow:hidden;">Admin</div>
            <div id="admin-sidebar-role" style="font-size:0.7rem; color:var(--text-muted);">Administrator</div>
          </div>
        </div>
        <button class="btn btn-outline" style="width:100%; margin-top: 1rem; padding: 0.5rem; font-size: 0.8rem;" data-action="logout">
          <i class="fa-solid fa-arrow-right-from-bracket"></i> Sign Out
        </button>
      </div>
    </aside>`;
    
    // Inject into DOM
    const layout = document.querySelector('.admin-layout');
    if (layout) {
      layout.insertAdjacentHTML('afterbegin', sidebarHtml);
    }
  },

  setActiveNav(pageId) {
    document.querySelectorAll('.admin-nav-link').forEach(link => link.classList.remove('active'));
    const activeLink = document.getElementById(pageId);
    if (activeLink) activeLink.classList.add('active');
  },

  updateUserInfo() {
    if (typeof Auth !== 'undefined' && Auth.isLoggedIn()) {
      const user = Auth.getUser();
      if (user) {
        document.getElementById('admin-sidebar-name').textContent = user.name;
        document.getElementById('admin-sidebar-role').textContent = user.role.charAt(0).toUpperCase() + user.role.slice(1);
        if (user.avatar) {
          document.getElementById('admin-sidebar-avatar').innerHTML = `<img src="${user.avatar}" style="width:100%;height:100%;border-radius:50%;object-fit:cover;">`;
        } else {
          document.getElementById('admin-sidebar-avatar').textContent = user.name.charAt(0).toUpperCase();
        }
      }
    }
  },

  init(activePageId) {
    this.injectSidebar();
    if (activePageId) this.setActiveNav(activePageId);
    this.updateUserInfo();
    
    // Bind logout
    document.body.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-action="logout"]');
      if (btn && typeof Auth !== 'undefined') {
        Auth.logout();
      }
    });
  }
};
