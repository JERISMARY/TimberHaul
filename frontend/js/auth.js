/* ============================================================
   TimberHaul — Auth Module
   Handles JWT storage, login state, profile management
   ============================================================ */

const Auth = {
  TOKEN_KEY: 'th_token',
  USER_KEY:  'th_user',

  // Get stored token
  getToken() { return localStorage.getItem(this.TOKEN_KEY); },

  // Get stored user data
  getUser() {
    const u = localStorage.getItem(this.USER_KEY);
    try { return u ? JSON.parse(u) : null; } catch { return null; }
  },

  // Check if logged in
  isLoggedIn() { return !!this.getToken(); },

  // Check if admin
  isAdmin() {
    const user = this.getUser();
    return user && (user.role === 'admin' || user.role === 'manager');
  },

  // Store auth data after login
  setAuth(token, user) {
    localStorage.setItem(this.TOKEN_KEY, token);
    localStorage.setItem(this.USER_KEY, JSON.stringify(user));
    this.updateNavUI();
  },

  // Clear auth data
  clearAuth() {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
    this.updateNavUI();
  },

  // Update navigation UI based on auth state
  updateNavUI() {
    const user = this.getUser();
    const profileBtn = document.getElementById('profile-nav-btn');
    const authLinks = document.querySelectorAll('.nav-auth-link');
    const mobileAuth = document.getElementById('nav-mobile-auth');

    if (profileBtn) {
      if (user) {
        // Hide explicit auth links
        authLinks.forEach(link => link.style.display = 'none');
        
        if (mobileAuth) {
          mobileAuth.innerHTML = `
            <a href="profile.html?tab=dashboard" class="btn btn-outline btn-sm">My Profile</a>
            <button onclick="Auth.logout()" class="btn btn-primary btn-sm" style="background:#E05252;border-color:#E05252">Sign Out</button>
          `;
        }

        // Remove direct navigation on click
        profileBtn.removeAttribute('data-action');
        profileBtn.removeAttribute('data-args');
        profileBtn.style.display = 'flex'; // Ensure it is visible
        
        const avatarSrc = user.profileImage || user.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(user.firstName || user.name || 'User')}&backgroundColor=8B5E3C`;
        const displayName = user.firstName || user.name || 'User';

        profileBtn.innerHTML = `
          <div style="position:relative" class="profile-dropdown-container">
            <img src="${avatarSrc}" style="width:28px;height:28px;border-radius:50%;object-fit:cover;cursor:pointer" alt="${displayName}">
            <div class="profile-dropdown-menu" style="display:none;position:absolute;top:calc(100% + 15px);right:0;width:220px;background:var(--bg-surface);border:1px solid var(--border-subtle);border-radius:var(--radius-lg);box-shadow:var(--shadow-xl);padding:0.5rem;z-index:100;text-align:left">
              <div style="padding:0.75rem;border-bottom:1px solid var(--border-subtle);margin-bottom:0.5rem">
                <div style="font-weight:600;color:var(--text-primary)">${displayName}</div>
                <div style="font-size:0.75rem;color:var(--text-muted);word-break:break-all">${user.email}</div>
              </div>
              <a href="${user.role === 'admin' ? 'admin/index.html' : 'profile.html?tab=dashboard'}" style="display:flex;align-items:center;gap:0.75rem;padding:0.5rem 0.75rem;color:var(--text-primary);text-decoration:none;border-radius:var(--radius-md);font-size:var(--fs-sm)" onmouseover="this.style.background='var(--bg-elevated)'" onmouseout="this.style.background='transparent'">
                <i class="fa-solid fa-chart-line" style="width:16px;text-align:center;color:var(--c-teak)"></i> My Dashboard
              </a>
              <a href="profile.html?tab=orders" style="display:flex;align-items:center;gap:0.75rem;padding:0.5rem 0.75rem;color:var(--text-primary);text-decoration:none;border-radius:var(--radius-md);font-size:var(--fs-sm)" onmouseover="this.style.background='var(--bg-elevated)'" onmouseout="this.style.background='transparent'">
                <i class="fa-solid fa-box-open" style="width:16px;text-align:center;color:var(--c-teak)"></i> My Orders
              </a>
              <a href="wishlist.html" style="display:flex;align-items:center;gap:0.75rem;padding:0.5rem 0.75rem;color:var(--text-primary);text-decoration:none;border-radius:var(--radius-md);font-size:var(--fs-sm)" onmouseover="this.style.background='var(--bg-elevated)'" onmouseout="this.style.background='transparent'">
                <i class="fa-regular fa-heart" style="width:16px;text-align:center;color:var(--c-teak)"></i> Wishlist
              </a>
              <a href="profile.html?tab=settings" style="display:flex;align-items:center;gap:0.75rem;padding:0.5rem 0.75rem;color:var(--text-primary);text-decoration:none;border-radius:var(--radius-md);font-size:var(--fs-sm)" onmouseover="this.style.background='var(--bg-elevated)'" onmouseout="this.style.background='transparent'">
                <i class="fa-solid fa-gear" style="width:16px;text-align:center;color:var(--c-teak)"></i> Settings
              </a>
              <div style="border-top:1px solid var(--border-subtle);margin:0.5rem 0;padding-top:0.5rem">
                <button onclick="Auth.logout()" style="width:100%;display:flex;align-items:center;gap:0.75rem;padding:0.5rem 0.75rem;color:#E05252;background:transparent;border:none;border-radius:var(--radius-md);font-size:var(--fs-sm);cursor:pointer;text-align:left" onmouseover="this.style.background='rgba(224,82,82,0.1)'" onmouseout="this.style.background='transparent'">
                  <i class="fa-solid fa-arrow-right-from-bracket" style="width:16px;text-align:center"></i> Sign Out
                </button>
              </div>
            </div>
          </div>
        `;
        
        // Setup dropdown toggle
        const container = profileBtn.querySelector('.profile-dropdown-container');
        const menu = profileBtn.querySelector('.profile-dropdown-menu');
        
        container.addEventListener('mouseenter', () => {
          menu.style.display = 'block';
          menu.animate([{opacity: 0, transform: 'translateY(10px)'}, {opacity: 1, transform: 'translateY(0)'}], {duration: 200, fill: 'forwards'});
        });
        
        container.addEventListener('mouseleave', () => {
          menu.style.display = 'none';
        });

      } else {
        // Show explicit auth links if logged out
        authLinks.forEach(link => link.style.display = 'block');
        profileBtn.style.display = 'none'; // Hide the user icon in nav-actions when logged out, since we show text links
        
        if (mobileAuth) {
          mobileAuth.innerHTML = `
            <a href="login.html" class="btn btn-outline btn-sm">Sign In</a>
            <a href="register.html" class="btn btn-primary btn-sm">Create Account</a>
          `;
        }

        profileBtn.innerHTML = '<i class="fa-regular fa-circle-user"></i>';
        profileBtn.setAttribute('title', 'Sign In');
        profileBtn.onclick = () => { location.href = 'login.html'; };
      }
    }
  },

  // Login
  async login(email, password) {
    const res = await window.api.login({ email, password });
    if (res.success) {
      this.setAuth(res.token, res.user);
    }
    return res;
  },

  // Register
  async register(firstName, lastName, username, email, password, phone) {
    const res = await window.api.register({ firstName, lastName, username, email, password, phone });
    if (res.success) {
      this.setAuth(res.token, res.user);
    }
    return res;
  },

  // Logout
  async logout() {
    try { await window.api.logout(); } catch {}
    this.clearAuth();
    location.href = 'index.html';
  },

  // Require auth - redirect if not logged in
  requireAuth() {
    if (!this.isLoggedIn()) {
      const returnUrl = encodeURIComponent(location.href);
      location.href = `login.html?return=${returnUrl}`;
      return false;
    }
    return true;
  },

  // Require admin
  requireAdmin() {
    if (!this.isAdmin()) {
      location.href = 'index.html';
      return false;
    }
    return true;
  }
};

window.Auth = Auth;
