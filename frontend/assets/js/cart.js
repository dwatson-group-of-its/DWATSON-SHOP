import { cartApi, formatCurrency, auth } from './api.js';

const cartContainer = document.getElementById('cart-items');
const subtotalEl = document.getElementById('cart-subtotal');
const totalEl = document.getElementById('cart-total');
const continueBtn = document.getElementById('continue-shopping');

const requireAuth = () => {
  if (!auth.token) {
    alert('Please login as an administrator to view the cart.');
    window.location.href = 'admins.html';
    return false;
  }
  return true;
};

if (!requireAuth()) {
  throw new Error('Unauthorized');
}

const renderCart = (cart) => {
  if (!cartContainer) return;
  if (!cart.items.length) {
    cartContainer.innerHTML = '<p>Your cart is empty.</p>';
    subtotalEl.textContent = formatCurrency(0);
    totalEl.textContent = formatCurrency(0);
    return;
  }

  cartContainer.innerHTML = cart.items
    .map(
      (item) => `
        <article class="cart-item" data-id="${item.product._id}">
          <img src="${item.product.images?.[0] || 'https://via.placeholder.com/120'}" alt="${item.product.name}" />
          <div>
            <h3>${item.product.name}</h3>
            <p class="muted">${item.product.category || ''}</p>
            <p class="price">${formatCurrency(item.price)}</p>
          </div>
          <div class="cart-controls">
            <label>
              Qty
              <input type="number" min="1" value="${item.quantity}" data-action="update" />
            </label>
            <button class="btn btn-light" data-action="remove">Remove</button>
          </div>
        </article>
      `
    )
    .join('');

  subtotalEl.textContent = formatCurrency(cart.total);
  totalEl.textContent = formatCurrency(cart.total);
};

const loadCart = async () => {
  try {
    const cart = await cartApi.get();
    renderCart(cart);
  } catch (error) {
    cartContainer.innerHTML = `<p class="error">${error.message}</p>`;
  }
};

cartContainer?.addEventListener('change', async (event) => {
  const input = event.target;
  if (input.dataset.action !== 'update') return;

  const article = input.closest('.cart-item');
  const productId = article?.dataset.id;
  const quantity = Number(input.value);

  if (!productId || quantity < 1) return;

  try {
    const cart = await cartApi.update({ productId, quantity });
    renderCart(cart);
  } catch (error) {
    alert(error.message);
  }
});

cartContainer?.addEventListener('click', async (event) => {
  const button = event.target.closest('button');
  if (!button || button.dataset.action !== 'remove') return;

  const article = button.closest('.cart-item');
  const productId = article?.dataset.id;
  if (!productId) return;

  try {
    const cart = await cartApi.remove(productId);
    renderCart(cart);
  } catch (error) {
    alert(error.message);
  }
});

continueBtn?.addEventListener('click', () => {
  window.location.href = 'product.html';
});

loadCart();
