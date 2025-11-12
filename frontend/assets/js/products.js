import { productApi, cartApi, formatCurrency, auth, categoryApi } from './api.js';

const productsGrid = document.getElementById('products-grid');
const detailSection = document.getElementById('product-detail');
const detailContent = document.querySelector('.product-detail-content');
const closeDetailBtn = document.getElementById('close-detail');
const searchInput = document.getElementById('search');
const categoryFilter = document.getElementById('category-filter');

let allProducts = [];
let activeCategories = [];

const renderProducts = (products) => {
  if (!productsGrid) return;
  if (!products.length) {
    productsGrid.innerHTML = '<p>No products found.</p>';
    return;
  }

  productsGrid.innerHTML = products
    .map((product) => {
      const categoryName = product.categoryId?.name || product.category || 'Unassigned';
      return `
        <article class="product-card" data-slug="${product.slug}">
          <img src="${product.images?.[0] || 'https://via.placeholder.com/400x300'}" alt="${product.name}" />
          <div class="content">
            <h3>${product.name}</h3>
            <p class="muted">${categoryName}</p>
            ${product.manufacturer ? `<p class="muted small">By ${product.manufacturer}</p>` : ''}
            <p class="muted">${product.description.slice(0, 80)}...</p>
            <p class="price">${formatCurrency(product.salePrice ?? product.price)}</p>
            ${
              product.isTrending
                ? '<span class="badge" style="align-self:flex-start;">Trending</span>'
                : ''
            }
            <div class="product-actions">
              <button class="btn btn-light" data-action="view" data-slug="${product.slug}">View</button>
              <button class="btn" data-action="add" data-id="${product._id}">Add to Cart</button>
            </div>
          </div>
        </article>
      `;
    })
    .join('');
};

const populateCategories = (categories) => {
  if (!categoryFilter) return;
  activeCategories = categories.filter((category) => category.isActive);
  categoryFilter.innerHTML = '<option value="">All Categories</option>';
  activeCategories.forEach((category) => {
    const option = document.createElement('option');
    option.value = category.slug;
    option.textContent = category.parentId?.name
      ? `${category.parentId.name} › ${category.name}`
      : category.name;
    categoryFilter.append(option);
  });
};

const filterProducts = () => {
  const keyword = searchInput?.value.toLowerCase() || '';
  const selectedCategory = categoryFilter?.value || '';

  const filtered = allProducts.filter((product) => {
    const matchesKeyword = product.name.toLowerCase().includes(keyword);
    const productCategorySlug = product.categoryId?.slug || '';
    const matchesCategory = selectedCategory ? productCategorySlug === selectedCategory : true;
    return matchesKeyword && matchesCategory;
  });

  renderProducts(filtered);
};

const showDetail = (product) => {
  if (!detailSection || !detailContent) return;
  detailSection.classList.remove('hide');
  productsGrid?.classList.add('hide');

  const categoryName = product.categoryId?.name || product.category || 'Unassigned';
  const images = Array.isArray(product.images) && product.images.length > 0 ? product.images : [];
  const mainImage = images[0] || 'https://via.placeholder.com/500x400';
  const ingredientItems = product.ingredients
    ? product.ingredients
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean)
    : [];

  detailContent.innerHTML = `
    <div class="detail-grid">
      <div class="detail-gallery">
        <img class="detail-gallery__main" src="${mainImage}" alt="${product.name}" />
        ${
          images.length > 1
            ? `
              <div class="detail-gallery__thumbs">
                ${images
                  .map(
                    (image, index) => `
                      <button class="detail-gallery__thumb ${index === 0 ? 'is-active' : ''}" type="button" data-src="${image}">
                        <img src="${image}" alt="${product.name} thumbnail ${index + 1}" />
                      </button>
                    `
                  )
                  .join('')}
              </div>
            `
            : ''
        }
      </div>
      <div class="meta">
        <h2>${product.name}</h2>
        <p class="muted">${categoryName}</p>
        <p>${product.description}</p>
        <p class="price">${formatCurrency(product.salePrice ?? product.price)}</p>
        <div class="detail-meta">
          ${
            product.manufacturer
              ? `<p><strong>Manufacturer:</strong> ${product.manufacturer}</p>`
              : ''
          }
          ${
            ingredientItems.length
              ? `<div><strong>Ingredients:</strong><ul class="detail-list">${ingredientItems
                  .map((item) => `<li>${item}</li>`)
                  .join('')}</ul></div>`
              : ''
          }
          ${
            product.usage
              ? `<p><strong>Usage:</strong> ${product.usage}</p>`
              : ''
          }
          ${
            product.benefits
              ? `<p><strong>Benefits:</strong> ${product.benefits}</p>`
              : ''
          }
          ${
            product.sideEffects
              ? `<p><strong>Side Effects:</strong> ${product.sideEffects}</p>`
              : ''
          }
        </div>
        <button class="btn" id="detail-add" data-id="${product._id}">Add to Cart</button>
      </div>
    </div>
  `;
};

const hideDetail = () => {
  detailSection?.classList.add('hide');
  productsGrid?.classList.remove('hide');
  const url = new URL(window.location.href);
  url.searchParams.delete('slug');
  window.history.replaceState({}, '', url);
};

const fetchCategories = async () => {
  try {
    const categories = await categoryApi.list();
    populateCategories(categories);
  } catch (error) {
    console.error('Failed to load categories', error);
  }
};

const fetchProducts = async () => {
  try {
    const { products } = await productApi.list({ limit: 60 });
    allProducts = products;
    filterProducts();
  } catch (error) {
    if (productsGrid) {
      productsGrid.innerHTML = `<p class="error">${error.message}</p>`;
    }
  }
};

const fetchProductDetail = async (slug) => {
  try {
    const product = await productApi.bySlug(slug);
    showDetail(product);
  } catch (error) {
    detailContent.innerHTML = `<p class="error">${error.message}</p>`;
  }
};

const requireAuth = () => {
  if (!auth.token) {
    alert('Admin login required for this action.');
    window.location.href = 'admins.html';
    return false;
  }
  return true;
};

const handleAddToCart = async (productId) => {
  if (!requireAuth()) return;
  try {
    await cartApi.add({ productId, quantity: 1 });
    alert('Added to cart');
  } catch (error) {
    alert(error.message);
  }
};

productsGrid?.addEventListener('click', (event) => {
  const target = event.target.closest('button');
  if (!target) return;

  const action = target.dataset.action;
  if (action === 'view') {
    const slug = target.dataset.slug;
    if (slug) {
      const url = new URL(window.location.href);
      url.searchParams.set('slug', slug);
      window.history.replaceState({}, '', url);
      fetchProductDetail(slug);
    }
  }
  if (action === 'add') {
    const id = target.dataset.id;
    if (id) {
      handleAddToCart(id);
    }
  }
});

closeDetailBtn?.addEventListener('click', () => {
  hideDetail();
});

detailSection?.addEventListener('click', (event) => {
  const thumbButton = event.target.closest('button[data-src]');
  if (thumbButton) {
    const newSrc = thumbButton.dataset.src;
    const mainImage = detailContent.querySelector('.detail-gallery__main');
    if (mainImage && newSrc) {
      mainImage.src = newSrc;
      const buttons = detailContent.querySelectorAll('.detail-gallery__thumb');
      buttons.forEach((button) => button.classList.remove('is-active'));
      thumbButton.classList.add('is-active');
    }
    return;
  }

  if (event.target.id === 'detail-add') {
    const id = event.target.dataset.id;
    if (id) {
      handleAddToCart(id);
    }
  }
});

searchInput?.addEventListener('input', filterProducts);
categoryFilter?.addEventListener('change', filterProducts);

const initFiltersFromQuery = () => {
  const params = new URLSearchParams(window.location.search);
  const slug = params.get('slug');
  if (slug) {
    fetchProductDetail(slug);
  }

  const categoryParam = params.get('category');
  if (categoryParam && categoryFilter) {
    const applyCategoryFilter = () => {
      if (Array.from(categoryFilter.options).some((option) => option.value === categoryParam)) {
        categoryFilter.value = categoryParam;
        filterProducts();
      }
    };

    if (categoryFilter.options.length > 1) {
      applyCategoryFilter();
    } else {
      const observer = new MutationObserver(() => {
        applyCategoryFilter();
        observer.disconnect();
      });
      observer.observe(categoryFilter, { childList: true });
    }
  }
};

const initPage = async () => {
  await fetchCategories();
  await fetchProducts();
  initFiltersFromQuery();
};

initPage();
