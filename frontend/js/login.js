// login.js
document.addEventListener('DOMContentLoaded', () => {
  // Redirect if already logged in
  if (Auth.isLoggedIn()) {
    const returnUrl = new URLSearchParams(location.search).get('return');
    if (returnUrl) {
      location.href = returnUrl;
    } else {
      location.href = Auth.isAdmin() ? 'admin/index.html' : 'index.html';
    }
  }

  // Setup form submission
  const loginForm = document.getElementById('login-form');
  if (loginForm) {
    loginForm.addEventListener('submit', async function handleLogin(event) {
      event.preventDefault();
      const btn = document.getElementById('login-btn');
      const email = document.getElementById('login-email').value.trim();
      const password = document.getElementById('login-password').value;

      btn.disabled = true;
      btn.innerHTML = '<span class="spinner spinner-sm"></span> Signing in...';

      try {
        await Auth.login(email, password);
        showToast('✅ Signed in successfully!', 'success');
        setTimeout(() => {
          const returnUrl = new URLSearchParams(location.search).get('return');
          if (returnUrl) {
            location.href = returnUrl;
          } else {
            location.href = Auth.isAdmin() ? 'admin/index.html' : 'index.html';
          }
        }, 800);
      } catch (err) {
        showToast(err.message || 'Invalid email or password', 'error');
        btn.disabled = false;
        btn.innerHTML = 'Sign In';
      }
    });
  }

  if (typeof initCursor === 'function') initCursor();
  setTimeout(() => document.body.classList.add('loaded'), 100);
});

window.togglePwd = function(btn, inputId) {
  const input = document.getElementById(inputId);
  const icon = btn.querySelector('i');
  if (input.type === 'password') {
    input.type = 'text';
    icon.className = 'fa-regular fa-eye-slash';
  } else {
    input.type = 'password';
    icon.className = 'fa-regular fa-eye';
  }
};
