import { auth, authApi, adminApi, productApi, orderApi, formatCurrency } from './api.js';

const params = new URLSearchParams(window.location.search);

const loginSection = document.getElementById('admin-login');
const loginForm = document.getElementById('admin-login-form');
const logoutBtn = document.getElementById('admin-logout');
const dashboardSection = document.getElementById('admin-dashboard');
const statsContainer = document.getElementById('admin-stats');
const productsList = document.getElementById('products-list');
const ordersList = document.getElementById('orders-list');
const usersList = document.getElementById('users-list');
const productForm = document.getElementById('product-form');
const resetProductBtn = document.getElementById('product-reset');
const productCategorySelect = document.getElementById('product-category');
const categoryForm = document.getElementById('category-form');
const categoryResetBtn = document.getElementById('category-reset');
const categoriesList = document.getElementById('categories-list');
const bannerForm = document.getElementById('banner-form');
const bannerResetBtn = document.getElementById('banner-reset');
const bannersList = document.getElementById('banners-list');
const categoryParentSelect = document.getElementById('category-parent');

let cachedProducts = [];
let cachedCategories = [];
let cachedBanners = [];

const showLogin = () => {
  loginSection?.classList.remove('hide');
  dashboardSection?.classList.add('hide');
};

const showDashboard = () => {
  loginSection?.classList.add('hide');
  dashboardSection?.classList.remove('hide');
};

const ensureAdminSession = () => auth.token && auth.isAdmin();

const renderStats = (stats) => {
  if (!statsContainer) return;
  const data = [
    { label: 'Products', value: stats.products },
    { label: 'Orders', value: stats.orders },
    { label: 'Users', value: stats.users },
    { label: 'Categories', value: stats.categories },
    { label: 'Banners', value: stats.banners },
  ];

  statsContainer.innerHTML = data
    .map(
      (item) => `
        <div class="stat-card">
          <h3>${item.label}</h3>
          <p>${item.value ?? 0}</p>
        </div>
      `
    )
    .join('');
};

const renderProducts = (products) => {
  if (!productsList) return;
  if (!products.length) {
    productsList.innerHTML = '<p class="muted">No products yet. Add your first item above.</p>';
    return;
  }

  productsList.innerHTML = products
    .map((product) => {
      const categoryName = product.categoryId?.name || product.category || 'Unassigned';
      return `
        <div class="list-item" data-id="${product._id}">
          <header>
            <span>${product.name}</span>
            <div class="actions">
              <button class="btn btn-light" data-action="edit">Edit</button>
              <button class="btn btn-light" data-action="delete">Delete</button>
            </div>
          </header>
          <p class="muted">${categoryName}</p>
          ${product.manufacturer ? `<p class="muted">Manufacturer: ${product.manufacturer}</p>` : ''}
          <div class="list-inline">
            <span>${formatCurrency(product.salePrice ?? product.price)}</span>
            <span class="muted">Stock: ${product.countInStock}</span>
            ${product.isFeatured ? '<span class="badge">Featured</span>' : ''}
            ${product.isTrending ? '<span class="badge">Trending</span>' : ''}
          </div>
        </div>
      `;
    })
    .join('');
};

const renderCategories = (categories) => {
  if (!categoriesList) return;
  if (!categories.length) {
    categoriesList.innerHTML = '<p class="muted">No categories defined.</p>';
    return;
  }

  categoriesList.innerHTML = categories
    .map((category) => {
      const parent = category.parentId;
      return `
      <div class="list-item" data-id="${category._id}">
        <header>
          <span>${category.name}</span>
          <div class="actions">
            <button class="btn btn-light" data-action="edit">Edit</button>
            <button class="btn btn-light" data-action="delete">Delete</button>
          </div>
        </header>
        <div class="list-inline">
          <span class="badge">/${category.slug}</span>
          ${parent ? `<span class="badge badge--muted">Parent: ${parent.name}</span>` : ''}
          <span class="badge ${category.isActive ? '' : 'badge--muted'}">${category.isActive ? 'Visible' : 'Hidden'}</span>
          <span class="muted">Order: ${category.order ?? 0}</span>
        </div>
        ${category.description ? `<p class="muted">${category.description}</p>` : ''}
      </div>
    `;
    })
    .join('');
};

const renderBanners = (banners) => {
  if (!bannersList) return;
  if (!banners.length) {
    bannersList.innerHTML = '<p class="muted">No banners yet.</p>';
    return;
  }

  bannersList.innerHTML = banners
    .map((banner) => `
      <div class="list-item" data-id="${banner._id}">
        <header>
          <span>${banner.title}</span>
          <div class="actions">
            <button class="btn btn-light" data-action="edit">Edit</button>
            <button class="btn btn-light" data-action="delete">Delete</button>
          </div>
        </header>
        <div class="list-inline">
          <span class="badge ${banner.isActive ? '' : 'badge--muted'}">${banner.isActive ? 'Visible' : 'Hidden'}</span>
          <span class="muted">Order: ${banner.order ?? 0}</span>
          <span class="badge badge--muted">${(banner.placement || 'hero').toUpperCase()}</span>
          ${banner.backgroundColor ? `<span class="badge" style="background:${banner.backgroundColor};color:#111;">BG</span>` : ''}
        </div>
        <p class="muted">${banner.subtitle || ''}</p>
      </div>
    `)
    .join('');
};

const renderOrders = (orders) => {
  if (!ordersList) return;
  if (!orders.length) {
    ordersList.innerHTML = '<p class="muted">No orders yet.</p>';
    return;
  }

  ordersList.innerHTML = orders
    .map(
      (order) => `
        <div class="list-item" data-id="${order._id}">
          <header>
            <span>Order #${order._id.slice(-6)}</span>
            <span class="badge">${order.status}</span>
          </header>
          <p class="muted">${order.user?.name || 'Guest'} · ${new Date(order.createdAt).toLocaleString()}</p>
          <p>Total: ${formatCurrency(order.totalPrice)}</p>
          <div class="order-meta">
            <div>
              <h4>Customer</h4>
              <p>${order.user?.name || 'N/A'}</p>
              <p class="muted">${order.user?.email || 'No email provided'}</p>
            </div>
            <div>
              <h4>Shipping Address</h4>
              <p>${order.shippingAddress?.street || '—'}</p>
              <p class="muted">${[
                order.shippingAddress?.city,
                order.shippingAddress?.postalCode,
                order.shippingAddress?.country,
              ]
                .filter(Boolean)
                .join(', ') || '—'}</p>
            </div>
            <div>
              <h4>Payment</h4>
              <p>${order.paymentMethod?.toUpperCase() || '—'}</p>
              <p class="muted">${order.paymentResult?.status || ''}</p>
            </div>
          </div>
          <div class="order-items">
            ${order.orderItems
              .map(
                (item) => `
                  <div>
                    <strong>${item.name}</strong>
                    <span class="muted">× ${item.quantity}</span>
                    <span>${formatCurrency(item.price * item.quantity)}</span>
                  </div>
                `
              )
              .join('')}
          </div>
          <label>
            Update status
            <select data-action="status">
              <option value="pending" ${order.status === 'pending' ? 'selected' : ''}>Pending</option>
              <option value="paid" ${order.status === 'paid' ? 'selected' : ''}>Paid</option>
              <option value="shipped" ${order.status === 'shipped' ? 'selected' : ''}>Shipped</option>
              <option value="delivered" ${order.status === 'delivered' ? 'selected' : ''}>Delivered</option>
              <option value="cancelled" ${order.status === 'cancelled' ? 'selected' : ''}>Cancelled</option>
            </select>
          </label>
        </div>
      `
    )
    .join('');
};

const renderUsers = (users) => {
  if (!usersList) return;
  if (!users.length) {
    usersList.innerHTML = '<p class="muted">No users yet.</p>';
    return;
  }

  usersList.innerHTML = users
    .map(
      (user) => `
        <div class="list-item" data-id="${user._id}">
          <header>
            <span>${user.name}</span>
            <span class="badge">${user.role}</span>
          </header>
          <p class="muted">${user.email}</p>
          <label>
            Role
            <select data-action="role">
              <option value="customer" ${user.role === 'customer' ? 'selected' : ''}>Customer</option>
              <option value="admin" ${user.role === 'admin' ? 'selected' : ''}>Admin</option>
            </select>
          </label>
          <label class="checkbox">
            <input type="checkbox" data-action="active" ${user.isActive ? 'checked' : ''} /> Active
          </label>
        </div>
      `
    )
    .join('');
};

const populateProductCategorySelect = (categories) => {
  if (!productCategorySelect) return;
  const currentValue = productCategorySelect.value;
  productCategorySelect.innerHTML = '<option value="">Unassigned</option>';
  categories
    .filter((category) => category.isActive !== false)
    .forEach((category) => {
      const option = document.createElement('option');
      option.value = category._id;
      option.textContent = category.parentId?.name
        ? `${category.parentId.name} › ${category.name}`
        : category.name;
      productCategorySelect.append(option);
    });
  if (currentValue && categories.some((cat) => cat._id === currentValue)) {
    productCategorySelect.value = currentValue;
  }
};

const populateCategoryParentSelect = (categories) => {
  if (!categoryParentSelect) return;
  const selected = categoryParentSelect.value;
  categoryParentSelect.innerHTML = '<option value="">Top-level</option>';
  categories.forEach((category) => {
    const option = document.createElement('option');
    option.value = category._id;
    option.textContent = category.parentId?.name
      ? `${category.parentId.name} › ${category.name}`
      : category.name;
    categoryParentSelect.append(option);
  });
  if (selected && categories.some((cat) => cat._id === selected)) {
    categoryParentSelect.value = selected;
  }
};

const loadDashboard = async () => {
  if (!ensureAdminSession()) {
    showLogin();
    return;
  }

  try {
    const [stats, productsData, orders, users, categories, banners] = await Promise.all([
      adminApi.stats(),
      productApi.list({ limit: 100 }),
      adminApi.orders(),
      adminApi.users(),
      adminApi.categories(),
      adminApi.banners(),
    ]);

    cachedProducts = productsData.products;
    cachedCategories = categories;
    cachedBanners = banners;

    renderStats(stats);
    renderProducts(cachedProducts);
    renderOrders(orders);
    renderUsers(users);
    renderCategories(cachedCategories);
    renderBanners(cachedBanners);
    populateProductCategorySelect(cachedCategories);
    populateCategoryParentSelect(cachedCategories);
    showDashboard();
  } catch (error) {
    alert(error.message);
    showLogin();
  }
};

const authenticate = async ({ email, password }) => {
  const profile = await authApi.login({ email, password });

  if (profile.role !== 'admin') {
    auth.logout();
    throw new Error('Access restricted to administrators');
  }

  loginForm?.reset();
  await loadDashboard();
};

loginForm?.addEventListener('submit', async (event) => {
  event.preventDefault();
  const formData = new FormData(loginForm);

  try {
    await authenticate({
      email: formData.get('email'),
      password: formData.get('password'),
    });
  } catch (error) {
    alert(error.message);
  }
});

logoutBtn?.addEventListener('click', () => {
  auth.logout();
  showLogin();
});

resetProductBtn?.addEventListener('click', () => {
  if (!productForm) return;
  productForm.reset();
  const idInput = productForm.querySelector('input[name="id"]');
  if (idInput) {
    idInput.value = '';
  }
});

categoryResetBtn?.addEventListener('click', () => {
  if (!categoryForm) return;
  categoryForm.reset();
  categoryForm.querySelector('input[name="id"]').value = '';
  categoryForm.querySelector('input[name="slug"]').value = '';
  categoryForm.querySelector('textarea[name="description"]').value = '';
  categoryForm.querySelector('input[name="image"]').value = '';
  categoryForm.querySelector('input[name="order"]').value = '';
  categoryParentSelect.value = '';
  categoryForm.querySelector('input[name="isActive"]').checked = true;
});

bannerResetBtn?.addEventListener('click', () => {
  if (!bannerForm) return;
  bannerForm.reset();
  bannerForm.querySelector('input[name="id"]').value = '';
  bannerForm.querySelector('input[name="isActive"]').checked = true;
  const placementSelect = bannerForm.querySelector('select[name="placement"]');
  if (placementSelect) {
    placementSelect.value = 'hero';
  }
  const badgeInput = bannerForm.querySelector('input[name="badgeText"]');
  if (badgeInput) {
    badgeInput.value = '';
  }
});

productForm?.addEventListener('submit', async (event) => {
  event.preventDefault();
  const formData = new FormData(productForm);

  const images = formData
    .get('images')
    ?.split(',')
    .map((url) => url.trim())
    .filter(Boolean);

  const categoryIdValue = formData.get('categoryId');

  const payload = {
    name: formData.get('name'),
    description: formData.get('description'),
    price: Number(formData.get('price')),
    salePrice: formData.get('salePrice') ? Number(formData.get('salePrice')) : undefined,
    categoryId: categoryIdValue === '' ? null : categoryIdValue,
    brand: formData.get('brand') || undefined,
    manufacturer: formData.get('manufacturer') || undefined,
    ingredients: formData.get('ingredients') || undefined,
    usage: formData.get('usage') || undefined,
    benefits: formData.get('benefits') || undefined,
    sideEffects: formData.get('sideEffects') || undefined,
    images: images ?? [],
    countInStock: Number(formData.get('countInStock')),
    isFeatured: formData.get('isFeatured') === 'on',
    isTrending: formData.get('isTrending') === 'on',
  };

  const productId = formData.get('id');

  try {
    if (productId) {
      await productApi.update(productId, payload);
      alert('Product updated');
    } else {
      await productApi.create(payload);
      alert('Product created');
    }
    productForm.reset();
    await loadDashboard();
  } catch (error) {
    alert(error.message);
  }
});

categoryForm?.addEventListener('submit', async (event) => {
  event.preventDefault();
  const formData = new FormData(categoryForm);

  const payload = {
    name: formData.get('name'),
    slug: formData.get('slug') || undefined,
    description: formData.get('description') || undefined,
    image: formData.get('image') || undefined,
    order: formData.get('order') ? Number(formData.get('order')) : undefined,
    parentId: formData.get('parentId') || undefined,
    isActive: formData.get('isActive') === 'on',
  };

  const rawCategoryId = formData.get('id');
  const categoryId =
    rawCategoryId && rawCategoryId !== 'undefined' && rawCategoryId !== 'null'
      ? rawCategoryId
      : '';

  try {
    if (categoryId) {
      await adminApi.updateCategory(categoryId, payload);
      alert('Category updated');
    } else {
      await adminApi.createCategory(payload);
      alert('Category created');
    }
    categoryForm.reset();
    categoryForm.querySelector('input[name="id"]').value = '';
    await loadDashboard();
  } catch (error) {
    alert(error.message);
  }
});

bannerForm?.addEventListener('submit', async (event) => {
  event.preventDefault();
  const formData = new FormData(bannerForm);

  const payload = {
    title: formData.get('title'),
    subtitle: formData.get('subtitle') || undefined,
    image: formData.get('image'),
    linkUrl: formData.get('linkUrl') || undefined,
    buttonText: formData.get('buttonText') || undefined,
    order: formData.get('order') ? Number(formData.get('order')) : undefined,
    backgroundColor: formData.get('backgroundColor') || undefined,
    isActive: formData.get('isActive') === 'on',
    placement: formData.get('placement') || 'hero',
    badgeText: formData.get('badgeText') || undefined,
  };

  const bannerId = formData.get('id');

  try {
    if (bannerId) {
      await adminApi.updateBanner(bannerId, payload);
      alert('Banner updated');
    } else {
      await adminApi.createBanner(payload);
      alert('Banner created');
    }
    bannerForm.reset();
    await loadDashboard();
  } catch (error) {
    alert(error.message);
  }
});

productsList?.addEventListener('click', async (event) => {
  const button = event.target.closest('button[data-action]');
  if (!button) return;

  const item = button.closest('.list-item');
  const productId = item?.dataset.id;
  if (!productId) return;

  if (button.dataset.action === 'edit') {
    const product = cachedProducts.find((p) => p._id === productId);
    if (!product) return;

    productForm.querySelector('input[name="id"]').value = product._id;
    productForm.querySelector('input[name="name"]').value = product.name;
    productForm.querySelector('textarea[name="description"]').value = product.description;
    productForm.querySelector('input[name="price"]').value = product.price;
    productForm.querySelector('input[name="salePrice"]').value = product.salePrice ?? '';
    productForm.querySelector('input[name="brand"]').value = product.brand ?? '';
    productForm.querySelector('input[name="manufacturer"]').value = product.manufacturer ?? '';
    productForm.querySelector('textarea[name="ingredients"]').value = product.ingredients ?? '';
    productForm.querySelector('textarea[name="usage"]').value = product.usage ?? '';
    productForm.querySelector('textarea[name="benefits"]').value = product.benefits ?? '';
    productForm.querySelector('textarea[name="sideEffects"]').value = product.sideEffects ?? '';
    productForm.querySelector('input[name="images"]').value = product.images?.join(', ') ?? '';
    productForm.querySelector('input[name="countInStock"]').value = product.countInStock;
    productForm.querySelector('input[name="isFeatured"]').checked = Boolean(product.isFeatured);
    const trendingInput = productForm.querySelector('input[name="isTrending"]');
    if (trendingInput) {
      trendingInput.checked = Boolean(product.isTrending);
    }
    populateProductCategorySelect(cachedCategories);
    if (product.categoryId?._id) {
      productCategorySelect.value = product.categoryId._id;
    } else {
      productCategorySelect.value = '';
    }

    window.scrollTo({ top: productForm.offsetTop - 100, behavior: 'smooth' });
  }

  if (button.dataset.action === 'delete') {
    if (!confirm('Delete this product?')) return;
    try {
      await productApi.remove(productId);
      alert('Product deleted');
      await loadDashboard();
    } catch (error) {
      alert(error.message);
    }
  }
});

categoriesList?.addEventListener('click', async (event) => {
  const button = event.target.closest('button[data-action]');
  if (!button) return;

  const item = button.closest('.list-item');
  const categoryId = item?.dataset.id;
  if (!categoryId) return;

  if (button.dataset.action === 'edit') {
    const category = cachedCategories.find((c) => c._id === categoryId);
    if (!category) return;

    categoryForm.querySelector('input[name="id"]').value = category._id;
    categoryForm.querySelector('input[name="name"]').value = category.name;
    categoryForm.querySelector('input[name="slug"]').value = category.slug;
    categoryForm.querySelector('textarea[name="description"]').value = category.description ?? '';
    categoryForm.querySelector('input[name="image"]').value = category.image ?? '';
    categoryForm.querySelector('input[name="order"]').value = category.order ?? '';
    categoryParentSelect.value = category.parentId?._id || '';
    categoryForm.querySelector('input[name="isActive"]').checked = Boolean(category.isActive);

    window.scrollTo({ top: categoryForm.offsetTop - 100, behavior: 'smooth' });
  }

  if (button.dataset.action === 'delete') {
    if (!confirm('Delete this category? Products will keep their current labels.')) return;
    try {
      await adminApi.deleteCategory(categoryId);
      alert('Category deleted');
      await loadDashboard();
    } catch (error) {
      alert(error.message);
    }
  }
});

bannersList?.addEventListener('click', async (event) => {
  const button = event.target.closest('button[data-action]');
  if (!button) return;

  const item = button.closest('.list-item');
  const bannerId = item?.dataset.id;
  if (!bannerId) return;

  if (button.dataset.action === 'edit') {
    const banner = cachedBanners.find((b) => b._id === bannerId);
    if (!banner) return;

    bannerForm.querySelector('input[name="id"]').value = banner._id;
    bannerForm.querySelector('input[name="title"]').value = banner.title;
    bannerForm.querySelector('textarea[name="subtitle"]').value = banner.subtitle ?? '';
    bannerForm.querySelector('input[name="image"]').value = banner.image;
    bannerForm.querySelector('input[name="linkUrl"]').value = banner.linkUrl ?? '';
    bannerForm.querySelector('input[name="buttonText"]').value = banner.buttonText ?? '';
    bannerForm.querySelector('input[name="order"]').value = banner.order ?? '';
    bannerForm.querySelector('input[name="backgroundColor"]').value = banner.backgroundColor ?? '';
    bannerForm.querySelector('input[name="isActive"]').checked = Boolean(banner.isActive);
    bannerForm.querySelector('select[name="placement"]').value = banner.placement || 'hero';
    const badgeInput = bannerForm.querySelector('input[name="badgeText"]');
    if (badgeInput) {
      badgeInput.value = banner.badgeText ?? '';
    }

    window.scrollTo({ top: bannerForm.offsetTop - 100, behavior: 'smooth' });
  }

  if (button.dataset.action === 'delete') {
    if (!confirm('Delete this banner?')) return;
    try {
      await adminApi.deleteBanner(bannerId);
      alert('Banner deleted');
      await loadDashboard();
    } catch (error) {
      alert(error.message);
    }
  }
});

ordersList?.addEventListener('change', async (event) => {
  const select = event.target;
  if (select.dataset.action !== 'status') return;

  const item = select.closest('.list-item');
  const orderId = item?.dataset.id;
  try {
    await orderApi.update(orderId, { status: select.value });
    alert('Order status updated');
  } catch (error) {
    alert(error.message);
  }
});

usersList?.addEventListener('change', async (event) => {
  const target = event.target;
  const item = target.closest('.list-item');
  if (!item) return;
  const userId = item.dataset.id;

  if (target.dataset.action === 'role') {
    try {
      await adminApi.updateUser(userId, { role: target.value });
      alert('Role updated');
    } catch (error) {
      alert(error.message);
    }
  }

  if (target.dataset.action === 'active') {
    try {
      await adminApi.updateUser(userId, { isActive: target.checked });
      alert('User status updated');
    } catch (error) {
      alert(error.message);
    }
  }
});

const attemptAutoLogin = async () => {
  const email = params.get('email');
  const password = params.get('password');

  if (!email || !password || !loginForm || ensureAdminSession()) {
    return;
  }

  loginForm.querySelector('input[name="email"]').value = email;
  loginForm.querySelector('input[name="password"]').value = password;

  try {
    await authenticate({ email, password });
    params.delete('email');
    params.delete('password');
    const query = params.toString();
    window.history.replaceState({}, '', `${window.location.pathname}${query ? `?${query}` : ''}`);
  } catch (error) {
    alert(error.message);
  }
};

loadDashboard();
attemptAutoLogin();
