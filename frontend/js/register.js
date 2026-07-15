// register.js
document.addEventListener('DOMContentLoaded', () => {
  if (Auth.isLoggedIn()) location.href = 'index.html';

  window.togglePwd = function (btn, inputId) {
    const input = document.getElementById(inputId);
    const icon = btn.querySelector('i');
    input.type = input.type === 'password' ? 'text' : 'password';
    icon.className = input.type === 'password' ? 'fa-regular fa-eye' : 'fa-regular fa-eye-slash';
  };

  const registerForm = document.getElementById('register-form');
  if (registerForm) {
    registerForm.addEventListener('submit', async function handleRegister(event) {
      event.preventDefault();
      const firstName = document.getElementById('reg-firstName').value.trim();
      const lastName = document.getElementById('reg-lastName').value.trim();
      const username = document.getElementById('reg-username')?.value.trim() || '';
      const email = document.getElementById('reg-email').value.trim();
      const phone = document.getElementById('reg-phone').value.trim();
      const password = document.getElementById('reg-password').value;
      const confirm = document.getElementById('reg-confirm').value;

      if (password !== confirm) {
        showToast('Passwords do not match!', 'error');
        return;
      }

      const btn = document.getElementById('register-btn');
      btn.disabled = true;
      btn.innerHTML = '<span class="spinner spinner-sm"></span> Creating account...';

      try {
        await Auth.register(firstName, lastName, username, email, password, phone);
        showToast('🎉 Account created successfully!', 'success');
        setTimeout(() => location.href = 'index.html', 800);
      } catch (err) {
        showToast(err.message || 'Registration failed. Please try again.', 'error');
        btn.disabled = false;
        btn.innerHTML = 'Create Account for Free';
      }
    });
  }

  // Password strength
  document.getElementById('reg-password')?.addEventListener('input', function () {
    const val = this.value;
    const bar = document.getElementById('pwd-strength-bar');
    const lbl = document.getElementById('pwd-strength-label');
    let strength = 0;
    if (val.length >= 8) strength++;
    if (/[A-Z]/.test(val)) strength++;
    if (/[0-9]/.test(val)) strength++;
    if (/[^A-Za-z0-9]/.test(val)) strength++;

    const levels = ['', 'Weak', 'Fair', 'Good', 'Strong'];
    const colors = ['', '#E05252', '#F0B429', '#4CAF79', '#22C55E'];
    const widths = ['0%', '25%', '50%', '75%', '100%'];

    if (bar) { bar.style.width = widths[strength]; bar.style.background = colors[strength]; }
    if (lbl) { lbl.textContent = strength > 0 ? `Password strength: ${levels[strength]}` : ''; lbl.style.color = colors[strength]; }
  });

  if (typeof initCursor === 'function') initCursor();
  setTimeout(() => document.body.classList.add('loaded'), 100);
});
