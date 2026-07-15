/* ============================================================
   TimberHaul — Profile JS
   ============================================================ */

document.addEventListener('DOMContentLoaded', async () => {
  if (!Auth.isLoggedIn()) {
    location.href = 'login.html';
    return;
  }

  const user = Auth.getUser();
  if (user) {
    document.getElementById('pf-name').textContent = user.firstName ? `${user.firstName} ${user.lastName}` : user.name;
    document.getElementById('pf-email').textContent = user.email;
    
    const avatarEl = document.getElementById('pf-avatar-initial');
    if (user.profileImage || user.avatar) {
      avatarEl.innerHTML = `<img src="${user.profileImage || user.avatar}" style="width:100%;height:100%;object-fit:cover;">`;
    } else {
      avatarEl.textContent = (user.firstName || user.name || 'U')[0].toUpperCase();
    }
    
    document.getElementById('pf-role').textContent = user.role === 'admin' ? 'Administrator' : 'Member';
    
    // Settings pre-fill
    document.getElementById('set-firstName').value = user.firstName || '';
    document.getElementById('set-lastName').value = user.lastName || '';
    document.getElementById('set-username').value = user.username || '';
    document.getElementById('set-email').value = user.email;
    document.getElementById('set-phone').value = user.phone || '';
    
    // Address pre-fill mock
    document.getElementById('addr-name').textContent = user.firstName ? `${user.firstName} ${user.lastName}` : user.name;

    if (user.role === 'admin') {
      document.getElementById('admin-link').style.display = 'flex';
    }
  }

  // Handle URL tabs (e.g. ?tab=orders&highlight=123)
  const urlParams = new URLSearchParams(location.search);
  const tab = urlParams.get('tab');
  if (tab) switchProfileTab(tab);

  loadDashboard();
  loadOrders();
});

window.switchProfileTab = function(tabName) {
  document.querySelectorAll('.profile-nav-item').forEach(item => {
    item.classList.remove('active');
    if (item.textContent.toLowerCase().includes(tabName)) item.classList.add('active');
  });
  document.querySelectorAll('.profile-tab-panel').forEach(panel => {
    panel.classList.remove('active');
  });
  const target = document.getElementById(`tab-${tabName}`);
  if (target) {
    target.classList.add('active');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
};

async function loadDashboard() {
  const dashOrders = document.getElementById('dash-orders');
  const dashWish = document.getElementById('dash-wishlist');
  const dashLoyalty = document.getElementById('dash-loyalty');
  const recentAct = document.getElementById('recent-activity');
  
  // Wishlist local count
  dashWish.textContent = JSON.parse(localStorage.getItem('th_wishlist') || '[]').length;
  
  // Loyalty points
  const user = Auth.getUser();
  if (dashLoyalty && user) {
    dashLoyalty.textContent = user.loyaltyPoints || 0;
  }
  
  try {
    const res = await window.api.getMyOrders();
    const orders = res.orders || [];
    dashOrders.textContent = orders.length;

    if (orders.length > 0) {
      const latest = orders[0];
      recentAct.innerHTML = `
        <div style="display:flex;justify-content:space-between;align-items:center">
          <div>
            <div style="font-weight:600;color:var(--text-primary)">Order Placed: ${latest._id.substring(0,8).toUpperCase()}</div>
            <div style="font-size:var(--fs-xs);color:var(--text-muted)">${formatDate(latest.createdAt)}</div>
          </div>
          <span class="badge badge-info">${latest.status}</span>
        </div>
      `;
    } else {
      recentAct.innerHTML = '<div style="color:var(--text-muted)">No recent activity</div>';
    }
  } catch (err) {
    recentAct.innerHTML = '<div style="color:var(--text-muted)">Could not load activity</div>';
  }
}

async function loadOrders() {
  const container = document.getElementById('orders-list');
  if (!container) return;

  try {
    const res = await window.api.getMyOrders();
    const orders = res.orders || [];

    if (!orders.length) {
      container.innerHTML = `
        <div class="glass-card" style="padding:3rem;text-align:center">
          <div style="font-size:3rem;margin-bottom:1rem">📦</div>
          <h3 style="color:var(--text-primary);margin-bottom:0.5rem">No orders yet</h3>
          <p style="color:var(--text-muted);margin-bottom:1.5rem">You haven't placed any orders.</p>
          <a href="products.html" class="btn btn-primary">Start Shopping</a>
        </div>
      `;
      return;
    }

    const hlId = new URLSearchParams(location.search).get('highlight');

    container.innerHTML = orders.map(o => `
      <div class="glass-card" style="padding:1.5rem;transition:border-color 0.3s ${o._id === hlId ? ';border-color:var(--c-teak);box-shadow:0 0 15px rgba(212,168,67,0.2)' : ''}">
        <div style="display:flex;justify-content:space-between;align-items:center;border-bottom:1px solid var(--border-subtle);padding-bottom:1rem;margin-bottom:1rem;flex-wrap:wrap;gap:1rem">
          <div>
            <div style="font-size:var(--fs-sm);color:var(--text-muted)">Order ID</div>
            <div style="font-weight:700;color:var(--text-primary);font-family:var(--font-display)">${o._id.substring(0,12).toUpperCase()}</div>
          </div>
          <div>
            <div style="font-size:var(--fs-sm);color:var(--text-muted)">Date</div>
            <div style="font-weight:600;color:var(--text-primary)">${formatDate(o.createdAt)}</div>
          </div>
          <div>
            <div style="font-size:var(--fs-sm);color:var(--text-muted)">Total Amount</div>
            <div style="font-weight:600;color:var(--c-teak)">₹${o.totalPrice.toLocaleString('en-IN')}</div>
          </div>
          <div>
            <span class="badge ${o.status === 'delivered' ? 'badge-success' : o.status === 'cancelled' ? 'badge-danger' : 'badge-info'}">${o.status.toUpperCase()}</span>
          </div>
        </div>
        
        <!-- Track Visual -->
        ${renderOrderTracking(o.status)}

        <div style="display:flex;gap:0.75rem;margin-top:1.5rem">
          <button class="btn btn-outline btn-sm" onclick='viewOrderDetails(${JSON.stringify(o).replace(/"/g, "&quot;")})'>View Details</button>
          ${o.status === 'delivered' ? `<button class="btn btn-primary btn-sm">Review Product</button>` : `<button class="btn btn-primary btn-sm">Track Package</button>`}
        </div>
      </div>
    `).join('');

  } catch (err) {
    container.innerHTML = '<div style="color:var(--text-muted)">Error loading orders</div>';
  }
}

function renderOrderTracking(status) {
  const steps = ['pending', 'processing', 'shipped', 'delivered'];
  let currentIdx = steps.indexOf(status);
  if (currentIdx === -1) currentIdx = 0; // fallback

  return `
    <div style="display:flex;align-items:center;justify-content:space-between;position:relative;margin:1.5rem 0 0.5rem">
      <div style="position:absolute;top:12px;left:5%;right:5%;height:2px;background:var(--border-subtle);z-index:0"></div>
      <div style="position:absolute;top:12px;left:5%;width:${(currentIdx/(steps.length-1))*90}%;height:2px;background:var(--c-teak);z-index:0;transition:width 1s"></div>
      
      ${steps.map((step, i) => `
        <div style="position:relative;z-index:1;display:flex;flex-direction:column;align-items:center;gap:0.5rem">
          <div style="width:26px;height:26px;border-radius:50%;background:${i <= currentIdx ? 'var(--c-teak)' : 'var(--bg-elevated)'};border:2px solid ${i <= currentIdx ? 'var(--c-teak)' : 'var(--border-mild)'};display:flex;align-items:center;justify-content:center;color:${i <= currentIdx ? '#fff' : 'transparent'};font-size:0.7rem">✓</div>
          <div style="font-size:0.65rem;color:${i <= currentIdx ? 'var(--text-primary)' : 'var(--text-muted)'};text-transform:uppercase;font-weight:600">${step}</div>
        </div>
      `).join('')}
    </div>
  `;
}

window.viewOrderDetails = function(order) {
  const body = document.getElementById('order-modal-body');
  
  body.innerHTML = `
    <div style="display:flex;justify-content:space-between;margin-bottom:1.5rem">
      <div>
        <div style="font-size:var(--fs-xs);color:var(--text-muted)">Order ID</div>
        <div style="font-weight:700;color:var(--c-teak)">${order._id}</div>
      </div>
      <div style="text-align:right">
        <div style="font-size:var(--fs-xs);color:var(--text-muted)">Order Date</div>
        <div style="font-weight:600">${formatDate(order.createdAt)}</div>
      </div>
    </div>
    
    <div style="margin-bottom:1.5rem">
      <h4 style="font-size:var(--fs-sm);color:var(--text-muted);margin-bottom:0.75rem">Items</h4>
      <div style="display:flex;flex-direction:column;gap:0.75rem;background:var(--bg-surface-2);padding:1rem;border-radius:var(--radius-md);border:1px solid var(--border-subtle)">
        ${(order.items || order.orderItems || []).map(item => `
          <div style="display:flex;justify-content:space-between;align-items:center">
            <div style="display:flex;align-items:center;gap:0.75rem">
              <img src="${item.image || window.PLACEHOLDER_IMG}" style="width:40px;height:40px;border-radius:4px;object-fit:cover" onerror="${window.ONERROR_IMG}">
              <div>
                <div style="font-weight:600;font-size:var(--fs-sm)">${item.name}</div>
                <div style="font-size:var(--fs-xs);color:var(--text-muted)">Qty: ${item.quantity} × ₹${item.price.toLocaleString('en-IN')}</div>
              </div>
            </div>
            <div style="font-weight:600">₹${(item.price * item.quantity).toLocaleString('en-IN')}</div>
          </div>
        `).join('')}
      </div>
    </div>
    
    <div style="display:flex;justify-content:space-between;border-top:1px solid var(--border-subtle);padding-top:1rem">
      <span style="font-weight:600;color:var(--text-muted)">Total</span>
      <span style="font-weight:700;color:var(--c-teak);font-size:var(--fs-xl)">₹${order.totalPrice.toLocaleString('en-IN')}</span>
    </div>
  `;
  
  openModal('order-modal');
};

window.updateProfile = async function(e) {
  e.preventDefault();
  const btn = document.getElementById('settings-btn');
  const firstName = document.getElementById('set-firstName').value;
  const lastName = document.getElementById('set-lastName').value;
  const username = document.getElementById('set-username').value;
  const phone = document.getElementById('set-phone').value;
  const pass = document.getElementById('set-pass').value;

  btn.disabled = true;
  btn.textContent = 'Saving...';

  try {
    const res = await window.api.updateProfile({ firstName, lastName, username, phone, password: pass || undefined });
    Auth.setAuth(Auth.getToken(), res.user); // Update local user
    document.getElementById('pf-name').textContent = res.user.firstName ? `${res.user.firstName} ${res.user.lastName}` : res.user.name;
    const avatarEl = document.getElementById('pf-avatar-initial');
    if (!res.user.profileImage && !res.user.avatar) {
       avatarEl.textContent = (res.user.firstName || res.user.name || 'U')[0].toUpperCase();
    }
    showToast('Profile updated successfully', 'success');
    document.getElementById('set-pass').value = ''; // clear pass
  } catch (err) {
    showToast(err.message || 'Failed to update profile', 'error');
  } finally {
    btn.disabled = false;
    btn.textContent = 'Save Changes';
  }
};

window.uploadAvatar = async function(e) {
  const file = e.target.files[0];
  if (!file) return;

  const formData = new FormData();
  formData.append('avatar', file);

  const token = Auth.getToken();
  if (!token) return;

  showToast('Uploading profile picture...', 'info');
  try {
    const res = await fetch(`${window.api.baseUrl}/upload/avatar`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` },
      body: formData
    });
    const data = await res.json();
    if (data.success) {
      showToast('Profile picture updated!', 'success');
      const user = Auth.getUser();
      user.profileImage = data.image.url;
      Auth.setAuth(token, user);
      document.getElementById('pf-avatar-initial').innerHTML = `<img src="${user.profileImage}" style="width:100%;height:100%;object-fit:cover;">`;
    } else {
      throw new Error(data.message || 'Failed to upload');
    }
  } catch (err) {
    showToast(err.message || 'Error uploading profile picture', 'error');
  }
};
