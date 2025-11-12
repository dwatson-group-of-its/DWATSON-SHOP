import { cartApi, orderApi, formatCurrency, auth } from './api.js';

const TAX_RATE = 0.05;
const SHIPPING_FLAT = 10;

const form = document.getElementById('checkout-form');
const summaryItems = document.getElementById('summary-items');
const subtotalEl = document.getElementById('summary-subtotal');
const taxEl = document.getElementById('summary-tax');
const shippingEl = document.getElementById('summary-shipping');
const totalEl = document.getElementById('summary-total');
const paymentTokenInput = document.getElementById('payment-token');

let cart = null;

const requireAuth = () => {
  if (!auth.token) {
    alert('Please login as an administrator to continue checkout.');
    window.location.href = 'admins.html';
    return false;
  }
  return true;
};

if (!requireAuth()) {
  throw new Error('Unauthorized');
}

const renderSummary = () => {
  if (!cart || !summaryItems) return;
  summaryItems.innerHTML = cart.items
    .map(
      (item) => `
        <div class="summary-item">
          <span>${item.product.name} × ${item.quantity}</span>
          <span>${formatCurrency(item.price * item.quantity)}</span>
        </div>
      `
    )
    .join('');

  const subtotal = cart.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const tax = Number((subtotal * TAX_RATE).toFixed(2));
  const shipping = subtotal === 0 ? 0 : SHIPPING_FLAT;
  const total = subtotal + tax + shipping;

  subtotalEl.textContent = formatCurrency(subtotal);
  taxEl.textContent = formatCurrency(tax);
  shippingEl.textContent = formatCurrency(shipping);
  totalEl.textContent = formatCurrency(total);
};

const loadCart = async () => {
  try {
    cart = await cartApi.get();
    if (!cart.items.length) {
      alert('Your cart is empty.');
      window.location.href = 'product.html';
      return;
    }
    renderSummary();
  } catch (error) {
    summaryItems.innerHTML = `<p class="error">${error.message}</p>`;
  }
};

const formatOrderId = (orderId) => `#${orderId.slice(-6).toUpperCase()}`;

const showOrderSuccess = (order) => {
  const overlay = document.createElement('div');
  overlay.className = 'order-success-overlay';

  const subtotal = formatCurrency(order.subtotal);
  const tax = formatCurrency(order.tax);
  const shipping = formatCurrency(order.shipping);
  const total = formatCurrency(order.totalPrice);
  const orderId = formatOrderId(order._id);
  const itemCount = order.orderItems.reduce((sum, item) => sum + item.quantity, 0);
  const profile = auth.getProfile();
  const isAdmin = profile?.role === 'admin';

  const primaryAction = isAdmin
    ? { action: 'view-orders', label: 'Open Admin Dashboard' }
    : { action: 'go-home', label: 'Back to Home' };

  const secondaryAction = isAdmin
    ? { action: 'continue-shopping', label: 'Continue Shopping' }
    : { action: 'view-products', label: 'Shop More Products' };

  overlay.innerHTML = `
    <div class="order-success-card" role="dialog" aria-labelledby="order-success-title" aria-modal="true">
      <div class="order-success-card__badge">✓</div>
      <div>
        <h2 id="order-success-title">Order placed successfully!</h2>
        <p>Thank you for your purchase. A confirmation has been recorded for your account.</p>
      </div>
      <div class="order-success-meta">
        <span><strong>Order ID:</strong> <em>${orderId}</em></span>
        <span><strong>Items:</strong> <em>${itemCount}</em></span>
        <span><strong>Subtotal:</strong> <em>${subtotal}</em></span>
        <span><strong>Tax:</strong> <em>${tax}</em></span>
        <span><strong>Shipping:</strong> <em>${shipping}</em></span>
        <span><strong>Total:</strong> <em>${total}</em></span>
      </div>
      <div class="order-success-actions">
        <button class="btn" data-action="${primaryAction.action}">${primaryAction.label}</button>
        <button class="btn btn-secondary" data-action="${secondaryAction.action}">${secondaryAction.label}</button>
      </div>
    </div>
  `;

  const onAction = (event) => {
    const card = event.target.closest('.order-success-card');
    const button = event.target.closest('button[data-action]');

    if (button) {
      const action = button.dataset.action;
      if (action === 'view-orders') {
        window.location.href = 'admins.html';
      }
      if (action === 'continue-shopping') {
        window.location.href = 'product.html';
      }
      if (action === 'go-home') {
        window.location.href = 'index.html';
      }
      if (action === 'view-products') {
        window.location.href = 'product.html';
      }
    }

    if (!card) {
      document.body.removeChild(overlay);
      document.removeEventListener('keydown', onKeydown);
    }
  };

  const onKeydown = (event) => {
    if (event.key === 'Escape') {
      document.body.removeChild(overlay);
      document.removeEventListener('keydown', onKeydown);
    }
  };

  overlay.addEventListener('click', onAction);
  document.addEventListener('keydown', onKeydown);
  document.body.appendChild(overlay);

  const primaryButton = overlay.querySelector(`button[data-action="${primaryAction.action}"]`);
  primaryButton?.focus();
};

form?.addEventListener('submit', async (event) => {
  event.preventDefault();
  if (!cart) return;

  const formData = new FormData(form);
  const paymentMethod = formData.get('paymentMethod');
  const shippingAddress = {
    street: formData.get('street'),
    city: formData.get('city'),
    postalCode: formData.get('postalCode'),
    country: formData.get('country'),
  };

  if (!shippingAddress.street || !shippingAddress.city) {
    alert('Please complete the shipping address.');
    return;
  }

  try {
    const order = await orderApi.create({
      paymentMethod,
      shippingAddress,
      paymentToken: paymentTokenInput?.value || undefined,
    });

    showOrderSuccess(order);

    cart.items = [];
    renderSummary();
  } catch (error) {
    alert(error.message);
  }
});

loadCart();
