/* ============================================================
   TimberHaul — Checkout JS
   ============================================================ */

document.addEventListener('DOMContentLoaded', () => {
  // Must be logged in to checkout (or redirect to login with return url)
  if (!Auth.isLoggedIn()) {
    showToast('Please sign in to checkout', 'info');
    setTimeout(() => location.href = `login.html?return=${encodeURIComponent(location.href)}`, 1500);
    return;
  }

  const cart = getLocalCart();
  if (!cart.length) {
    location.href = 'cart.html';
    return;
  }

  // Pre-fill user data
  const user = Auth.getUser();
  if (user) {
    const fname = user.firstName || (user.name ? user.name.split(' ')[0] : '');
    const lname = user.lastName || (user.name ? user.name.split(' ').slice(1).join(' ') : '');
    document.getElementById('c-fname').value = fname || '';
    document.getElementById('c-lname').value = lname || '';
    document.getElementById('c-email').value = user.email || '';
    document.getElementById('c-phone').value = user.phone || '';
    
    if (user.loyaltyPoints > 0) {
      document.getElementById('loyalty-container').style.display = 'block';
      document.getElementById('co-loyalty-pts-avail').textContent = user.loyaltyPoints;
      // 1 point = 1 rupee
      document.getElementById('co-loyalty-val').textContent = user.loyaltyPoints.toLocaleString('en-IN');
    }
  }

  renderCheckoutSummary();
  setTimeout(() => document.body.classList.add('loaded'), 100);
});

function renderCheckoutSummary() {
  const cart = getLocalCart();
  const summaryStr = localStorage.getItem('th_cart_summary');
  
  if (!summaryStr) {
    location.href = 'cart.html';
    return;
  }

  const summary = JSON.parse(summaryStr);

  // Render items
  const itemsContainer = document.getElementById('checkout-items');
  if (itemsContainer) {
    itemsContainer.innerHTML = cart.map(item => `
      <div style="display:flex;align-items:center;gap:1rem">
        <div style="position:relative">
          <img src="${item.image || window.PLACEHOLDER_IMG}" alt="${item.name}" style="width:64px;height:64px;border-radius:var(--radius-md);object-fit:cover;border:1px solid var(--border-subtle)" onerror="${window.ONERROR_IMG}">
          <span style="position:absolute;top:-8px;right:-8px;background:var(--bg-elevated);color:var(--text-primary);width:20px;height:20px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:0.7rem;font-weight:700;border:1px solid var(--border-subtle)">${item.quantity}</span>
        </div>
        <div style="flex:1">
          <div style="font-weight:600;font-size:var(--fs-sm);color:var(--text-primary)">${item.name}</div>
          <div style="font-size:var(--fs-xs);color:var(--text-muted)">🪵 ${item.woodType}</div>
        </div>
        <div style="font-weight:600;color:var(--c-teak)">₹${(item.price * item.quantity).toLocaleString('en-IN')}</div>
      </div>
    `).join('');
  }

  // Handle applied coupon
  const appliedCoupon = JSON.parse(sessionStorage.getItem('th_applied_coupon') || 'null');
  if (appliedCoupon) {
    summary.discountAmt = (summary.discountAmt || 0) + appliedCoupon.discountAmount;
    summary.total = Math.max(0, summary.total - appliedCoupon.discountAmount);
  }

  // Handle Loyalty Points
  const useLoyalty = document.getElementById('use-loyalty-pts')?.checked;
  let loyaltyDiscount = 0;
  if (useLoyalty) {
    const user = Auth.getUser();
    loyaltyDiscount = user ? user.loyaltyPoints : 0;
    summary.discountAmt = (summary.discountAmt || 0) + loyaltyDiscount;
    summary.total = Math.max(0, summary.total - loyaltyDiscount);
  }

  // Set amounts
  const set = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
  set('co-subtotal', `₹${summary.subtotal.toLocaleString('en-IN')}`);
  
  if (summary.discountAmt > 0) {
    document.getElementById('co-discount-row').style.display = 'flex';
    set('co-discount', `-₹${summary.discountAmt.toLocaleString('en-IN')}`);
  }
  
  set('co-shipping', summary.shipping === 0 ? 'FREE' : `₹${summary.shipping.toLocaleString('en-IN')}`);
  set('co-tax', `₹${summary.tax.toLocaleString('en-IN')}`);
  set('co-total', `₹${summary.total.toLocaleString('en-IN')}`);
}

window.applyCoupon = async function() {
  const code = document.getElementById('coupon-code').value.trim();
  const msgEl = document.getElementById('coupon-message');
  if (!code) { msgEl.textContent = 'Enter a code'; msgEl.style.color = 'var(--c-error)'; return; }

  const summary = JSON.parse(localStorage.getItem('th_cart_summary') || '{}');
  
  try {
    const res = await window.api.get(`/coupons/validate?code=${code}&orderTotal=${summary.total}`);
    sessionStorage.setItem('th_applied_coupon', JSON.stringify(res));
    msgEl.textContent = `Coupon applied! Saved ₹${res.discountAmount.toLocaleString('en-IN')}`;
    msgEl.style.color = 'var(--c-success)';
    renderCheckoutSummary();
  } catch (err) {
    sessionStorage.removeItem('th_applied_coupon');
    msgEl.textContent = err.message || 'Invalid coupon code';
    msgEl.style.color = 'var(--c-error)';
  }
};

window.placeOrder = async function() {
  const btn = document.getElementById('place-order-btn');
  
  // Validate contact
  const fname = document.getElementById('c-fname').value.trim();
  const lname = document.getElementById('c-lname').value.trim();
  const phone = document.getElementById('c-phone').value.trim();
  if (!fname || !lname || !phone) {
    showToast('Please fill in your contact information', 'warning');
    document.getElementById('step-1').scrollIntoView({ behavior: 'smooth' });
    return;
  }

  // Validate shipping
  const address = document.getElementById('s-address').value.trim();
  const city = document.getElementById('s-city').value.trim();
  const state = document.getElementById('s-state').value;
  const zip = document.getElementById('s-zip').value.trim();
  if (!address || !city || !state || !zip) {
    showToast('Please complete your shipping address', 'warning');
    document.getElementById('step-2').scrollIntoView({ behavior: 'smooth' });
    return;
  }

  btn.disabled = true;
  btn.innerHTML = '<span class="spinner spinner-sm"></span> Processing...';

  const cart = getLocalCart();
  const summary = JSON.parse(localStorage.getItem('th_cart_summary') || '{}');
  const appliedCoupon = JSON.parse(sessionStorage.getItem('th_applied_coupon') || 'null');
  
  let finalTotal = summary.total;
  let totalDiscount = summary.discountAmt || 0;
  if (appliedCoupon) {
    totalDiscount += appliedCoupon.discountAmount;
    finalTotal = Math.max(0, finalTotal - appliedCoupon.discountAmount);
  }

  const useLoyalty = document.getElementById('use-loyalty-pts')?.checked;
  const user = Auth.getUser();
  let usedLoyaltyPts = 0;
  if (useLoyalty && user) {
    usedLoyaltyPts = user.loyaltyPoints;
    totalDiscount += usedLoyaltyPts;
    finalTotal = Math.max(0, finalTotal - usedLoyaltyPts);
  }

  const method = document.querySelector('input[name="paymentMethod"]:checked').value;

  const orderData = {
    orderItems: cart.map(item => ({
      _id: item._id,
      product: item._id,
      name: item.name,
      image: item.image || item.images?.[0]?.url || '',
      price: item.finalPrice || item.price,
      finalPrice: item.finalPrice || item.price,
      quantity: item.quantity || 1,
      woodType: item.woodType || 'Other'
    })),
    shippingAddress: { address, city, state, zipCode: zip, country: 'India' },
    paymentMethod: method,
    itemsPrice:    summary.subtotal   || 0,
    taxPrice:      summary.tax        || 0,
    shippingPrice: summary.shipping   || 0,
    discountAmount: totalDiscount,
    couponCode:    appliedCoupon ? appliedCoupon.code : null,
    usedLoyaltyPoints: usedLoyaltyPts,
    totalPrice:    finalTotal
  };

  try {
    const res = await window.api.createOrder(orderData);
    
    if (method === 'cod') {
      await window.api.confirmCOD(res.order._id);
      completeOrder(res.order._id);
    } 
    else if (method === 'razorpay') {
      const rpRes = await window.api.createRazorpayOrder(res.order._id);
      
      const options = {
        key: rpRes.keyId || 'rzp_test_mock',
        amount: rpRes.amount,
        currency: 'INR',
        name: 'TimberHaul',
        description: 'Premium Timber Purchase',
        order_id: rpRes.orderId,
        handler: async function(response) {
          try {
            await window.api.verifyRazorpayPayment({
              razorpay_order_id: response.razorpay_order_id || rpRes.orderId,
              razorpay_payment_id: response.razorpay_payment_id || 'mock_pay_id',
              razorpay_signature: response.razorpay_signature || 'mock_sig',
              orderId: res.order._id
            });
            completeOrder(res.order._id);
          } catch(e) {
            showToast('Payment verification failed', 'error');
          }
        },
        prefill: { name: fname + ' ' + lname, contact: phone }
      };
      
      if (window.Razorpay) {
        const rzp = new window.Razorpay(options);
        rzp.open();
      } else {
        showToast('Simulating Razorpay payment...', 'info');
        setTimeout(() => options.handler({}), 2000);
      }
    }
    else {
      // Stripe
      const stripeRes = await window.api.createStripeIntent(res.order._id);
      showToast('Simulating Stripe payment...', 'info');
      setTimeout(async () => {
        try {
          await window.api.confirmStripePayment({
            orderId: res.order._id,
            paymentIntentId: 'mock_intent_id'
          });
          completeOrder(res.order._id);
        } catch(e) {
          showToast('Payment failed', 'error');
        }
      }, 2000);
    }
  } catch (err) {
    showToast(err.message || 'Error creating order', 'error');
    btn.disabled = false;
    btn.innerHTML = '<i class="fa-solid fa-lock"></i> Place Order';
  }
};

async function completeOrder(orderId) {
  try {
    await window.api.updateOrderToPaid(orderId, {
      id: 'mock_payment_id_' + Date.now(),
      status: 'succeeded',
      update_time: new Date().toISOString()
    });
    
    // Clear cart
    localStorage.removeItem('th_cart');
    localStorage.removeItem('th_cart_summary');
    
    showToast('🎉 Order placed successfully!', 'success');
    
    setTimeout(() => {
      location.href = `profile.html?tab=orders&highlight=${orderId}`;
    }, 1500);
  } catch (err) {
    showToast('Order created but payment failed', 'error');
  }
}
