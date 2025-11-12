import { productApi, formatCurrency, bannerApi, categoryApi } from './api.js';

const featuredGrid = document.getElementById('featured-grid');
const categoryGrid = document.getElementById('category-grid');
const trendingSection = document.getElementById('trending-products');
const trendingGrid = document.getElementById('trending-grid');
const heroSection = document.getElementById('hero');
const heroTitle = document.getElementById('hero-title');
const heroSubtitle = document.getElementById('hero-subtitle');
const heroButton = document.getElementById('hero-button');
const heroImage = document.getElementById('hero-image');
const categoryNav = document.getElementById('category-nav');
const categoryToggle = categoryNav?.querySelector('.category-dropdown__toggle') || null;
const categoryTabs = document.getElementById('category-tabs');
const categoryRootList = document.getElementById('category-root-list');
const categoryChildPanel = document.getElementById('category-child-panel');
const categoryTabsPanel = document.getElementById('category-tabs-panel');
const saleSection = document.getElementById('sale-section');
const saleGrid = document.getElementById('sale-grid');
const saleTitle = document.getElementById('sale-strip-title');
const saleSubtitle = document.getElementById('sale-strip-subtitle');
const saleLink = document.getElementById('sale-strip-link');
const saleBadge = document.getElementById('sale-strip-badge');

const heroDefaultTitle = heroTitle?.textContent || '';
const heroDefaultSubtitle = heroSubtitle?.textContent || '';
const heroDefaultButtonText = heroButton?.textContent || 'Shop Now';
const saleDefaultTitle = saleTitle?.textContent || '';
const saleDefaultSubtitle = saleSubtitle?.textContent || '';
const saleDefaultBadge = saleBadge?.textContent || 'Hot Deals';
const saleDefaultButtonText = saleLink?.textContent || 'View Deals';

const placeholderImage = 'https://via.placeholder.com/420x280';

let activeCategories = [];
let categoryTree = [];
let tabsPanelHideTimeout = null;

const renderProducts = (products) => {
  if (!featuredGrid) return;
  if (!products.length) {
    featuredGrid.innerHTML = '<p class="muted">No featured products yet.</p>';
    return;
  }

  featuredGrid.innerHTML = products
    .map(
      (product) => `
        <article class="product-card">
          <img src="${product.images?.[0] || placeholderImage}" alt="${product.name}" />
          <div class="content">
            <h3>${product.name}</h3>
            <p class="muted">${product.description.slice(0, 80)}...</p>
            <p class="price">${formatCurrency(product.salePrice ?? product.price)}</p>
            <a class="btn" href="product.html?slug=${product.slug}">View Details</a>
          </div>
        </article>
      `
    )
    .join('');
};

const renderCategories = (categories) => {
  if (!categoryGrid) return;
  if (!categories.length) {
    categoryGrid.innerHTML = '<p class="muted">Categories coming soon.</p>';
    return;
  }

  categoryGrid.innerHTML = categories
    .map(
      (category) => `
        <article class="category-card">
          <img src="${category.image || placeholderImage}" alt="${category.name}" />
          <h3>${category.name}</h3>
          <p class="muted">${category.description || 'Explore our curated picks.'}</p>
          <a class="btn btn-light" href="product.html?category=${encodeURIComponent(category.slug)}">Explore</a>
        </article>
      `
    )
    .join('');
};

const renderTrending = (products) => {
  if (!trendingGrid) return;
  if (!products.length) {
    if (trendingSection) {
      trendingSection.hidden = true;
    }
    return;
  }

  if (trendingSection) {
    trendingSection.hidden = false;
  }

  trendingGrid.innerHTML = products
    .map(
      (product) => `
        <article class="product-card">
          <img src="${product.images?.[0] || placeholderImage}" alt="${product.name}" />
          <div class="content">
            <h3>${product.name}</h3>
            <p class="muted">${product.categoryId?.name || product.category || ''}</p>
            ${product.manufacturer ? `<p class="muted small">By ${product.manufacturer}</p>` : ''}
            <p class="price">${formatCurrency(product.salePrice ?? product.price)}</p>
            <a class="btn btn-light" href="product.html?slug=${product.slug}">View</a>
          </div>
        </article>
      `
    )
    .join('');
};

const getCategoryOrder = (category) => {
  if (typeof category.order === 'number') {
    return category.order;
  }
  return 999;
};

const buildCategoryTree = (categories) => {
  const map = new Map();
  categories.forEach((category) => {
    map.set(category._id, { ...category, children: [] });
  });

  const roots = [];

  map.forEach((node) => {
    const parentId = node.parentId?._id || node.parentId;
    if (parentId && map.has(parentId)) {
      map.get(parentId).children.push(node);
    } else {
      roots.push(node);
    }
  });

  const sortNodes = (nodes) => {
    nodes.sort((a, b) => {
      const orderDiff = getCategoryOrder(a) - getCategoryOrder(b);
      if (orderDiff !== 0) {
        return orderDiff;
      }
      return a.name.localeCompare(b.name);
    });
    nodes.forEach((node) => sortNodes(node.children));
  };

  sortNodes(roots);
  return roots;
};

function navigateToCategory(slug) {
  if (!slug) return;
  hideTabsPanel();
  const url = new URL('product.html', window.location.href);
  url.searchParams.set('category', slug);
  window.location.href = url.toString();
}

const renderCategoryTabs = (tree) => {
  if (!categoryTabs) return;
  if (!tree.length) {
    categoryTabs.innerHTML = '';
    return;
  }

  categoryTabs.innerHTML = tree
    .map(
      (node) => `
        <button class="category-tab" type="button" data-slug="${node.slug}">
          ${node.name}
        </button>
      `
    )
    .join('');
};

const renderChildPanel = (node) => {
  if (!categoryChildPanel) return;
  if (!node) {
    categoryChildPanel.innerHTML = `<p class="muted">Select a category to explore subcategories.</p>`;
    return;
  }

  if (!node.children.length) {
    categoryChildPanel.innerHTML = `
      <div>
        <h3>${node.name}</h3>
        <p class="muted">No subcategories yet.</p>
      </div>
    `;
    return;
  }

  categoryChildPanel.innerHTML = `
    <div>
      <h3>${node.name}</h3>
      <div class="category-sublist">
        ${node.children
          .map(
            (child) => `
              <a href="product.html?category=${encodeURIComponent(child.slug)}" data-slug="${child.slug}">
                ${child.name}
              </a>
            `
          )
          .join('')}
      </div>
    </div>
  `;
};

const setActiveRootCategory = (rootId) => {
  if (!categoryRootList) return;
  const buttons = Array.from(categoryRootList.querySelectorAll('.category-root-item'));
  buttons.forEach((button) => {
    button.classList.toggle('is-active', button.dataset.rootId === rootId);
  });
  const node = categoryTree.find((item) => item._id === rootId);
  renderChildPanel(node);
};

const renderCategoryDropdown = (tree) => {
  if (!categoryRootList) return;
  if (!tree.length) {
    categoryRootList.innerHTML = '';
    renderChildPanel(null);
    return;
  }

  categoryRootList.innerHTML = tree
    .map(
      (node) => `
        <button class="category-root-item" type="button" data-root-id="${node._id}" data-slug="${node.slug}">
          <span>${node.name}</span>
          <span class="arrow">${node.children.length ? '>' : ''}</span>
        </button>
      `
    )
    .join('');

  setActiveRootCategory(tree[0]._id);
};

const loadProducts = async () => {
  try {
    const { products } = await productApi.list({ limit: 8 });
    renderProducts(products);
  } catch (error) {
    if (featuredGrid) {
      featuredGrid.innerHTML = `<p class="error">${error.message}</p>`;
    }
  }
};

const loadTrendingProducts = async () => {
  try {
    const { products } = await productApi.list({ limit: 8, trending: true });
    renderTrending(products);
  } catch (error) {
    console.error('Failed to load trending products', error);
    if (trendingSection) {
      trendingSection.hidden = true;
    }
  }
};

const loadCategories = async () => {
  try {
    const categories = await categoryApi.list();
    activeCategories = categories.filter((category) => category.isActive !== false);
    categoryTree = buildCategoryTree(activeCategories);
    renderCategoryTabs(categoryTree);
    renderCategoryDropdown(categoryTree);
    renderCategories(categoryTree);
  } catch (error) {
    if (categoryGrid) {
      categoryGrid.innerHTML = `<p class="error">${error.message}</p>`;
    }
  }
};

const loadHero = async () => {
  if (!heroSection || !heroTitle || !heroSubtitle || !heroButton) return;
  try {
    const banners = await bannerApi.list({ placement: 'hero' });
    if (!banners.length) return;

    const banner = banners[0];
    heroTitle.textContent = banner.title?.trim() || heroDefaultTitle;

    const subtitleText = banner.subtitle?.trim();
    if (subtitleText) {
      heroSubtitle.textContent = subtitleText;
      heroSubtitle.classList.remove('muted');
    } else {
      heroSubtitle.textContent = heroDefaultSubtitle;
      if (!heroDefaultSubtitle) {
        heroSubtitle.classList.add('muted');
      } else {
        heroSubtitle.classList.remove('muted');
      }
    }
    heroButton.textContent = banner.buttonText?.trim() || heroDefaultButtonText;
    heroButton.href = banner.linkUrl || 'product.html';
    heroImage.src = banner.image || placeholderImage;
    heroImage.alt = banner.title;

    const heroBgImage = banner.image || placeholderImage;
    heroSection.style.setProperty('--hero-bg-image', `url("${heroBgImage}")`);
    heroSection.classList.add('has-image');

    if (!banner.subtitle) {
      heroSubtitle.classList.add('muted');
    } else {
      heroSubtitle.classList.remove('muted');
    }

    if (banner.backgroundColor) {
      heroSection.style.background = banner.backgroundColor;
    } else {
      heroSection.style.removeProperty('background');
    }
  } catch (error) {
    // Fail silently; hero will keep default content
    console.error('Failed to load hero banner', error);
  }
};

const renderSaleCards = (banners) => {
  if (!saleGrid) return;

  if (!banners.length) {
    saleGrid.innerHTML = '';
    saleGrid.classList.add('is-empty');
    return;
  }

  saleGrid.classList.remove('is-empty');

  saleGrid.innerHTML = banners
    .map(
      (banner) => `
        <article class="sale-card">
          <img src="${banner.image || placeholderImage}" alt="${banner.title || 'Deal'}" />
          <div>
            <h3>${banner.title || 'Special Offer'}</h3>
            ${banner.subtitle ? `<p>${banner.subtitle}</p>` : ''}
          </div>
          <a class="btn btn-light" href="${banner.linkUrl || 'product.html'}">
            ${banner.buttonText || saleDefaultButtonText}
          </a>
        </article>
      `
    )
    .join('');
};

const loadSaleBanners = async () => {
  if (!saleSection) return;
  try {
    const banners = await bannerApi.list({ placement: 'sale' });
    if (!banners.length) {
      saleSection.hidden = true;
      saleGrid.innerHTML = '';
      return;
    }

    saleSection.hidden = false;
    const [primaryBanner, ...remainingSaleBanners] = banners;
    if (saleTitle) {
      saleTitle.textContent = primaryBanner.title?.trim() || saleDefaultTitle;
    }
    if (saleSubtitle) {
      saleSubtitle.textContent =
        primaryBanner.subtitle?.trim() || saleDefaultSubtitle || 'Limited time discounts across popular categories.';
    }
    if (saleLink) {
      saleLink.href = primaryBanner.linkUrl || 'product.html';
      saleLink.textContent = primaryBanner.buttonText?.trim() || saleDefaultButtonText;
    }
    if (saleBadge) {
      saleBadge.textContent = primaryBanner.badgeText?.trim() || saleDefaultBadge;
    }

    if (saleSection && primaryBanner?.image) {
      saleSection.style.backgroundImage = `url("${primaryBanner.image}")`;
    }
    renderSaleCards(remainingSaleBanners);
  } catch (error) {
    console.error('Failed to load sale banners', error);
    saleSection.hidden = true;
  }
};

loadHero();
loadSaleBanners();
loadTrendingProducts();
loadCategories();
loadProducts();

const clearTabsPanelHideTimeout = () => {
  if (tabsPanelHideTimeout) {
    clearTimeout(tabsPanelHideTimeout);
    tabsPanelHideTimeout = null;
  }
};

const hideTabsPanel = () => {
  clearTabsPanelHideTimeout();
  if (categoryTabsPanel) {
    categoryTabsPanel.classList.remove('is-visible');
    categoryTabsPanel.innerHTML = '';
  }
};

const renderTabsPanel = (node) => {
  if (!categoryTabsPanel) return;
  if (!node || !node.children.length) {
    hideTabsPanel();
    return;
  }

  categoryTabsPanel.innerHTML = `
    <div>
      <h3>${node.name}</h3>
      <p>Select a subcategory to continue shopping.</p>
      <div class="subcategory-grid">
        ${node.children
          .map(
            (child) => `
              <a href="product.html?category=${encodeURIComponent(child.slug)}" data-slug="${child.slug}">
                <span>${child.name}</span>
                <span class="muted">›</span>
              </a>
            `
          )
          .join('')}
      </div>
    </div>
  `;
  categoryTabsPanel.classList.add('is-visible');
};

const scheduleHideTabsPanel = () => {
  clearTabsPanelHideTimeout();
  tabsPanelHideTimeout = setTimeout(() => {
    hideTabsPanel();
  }, 150);
};

const showTabsPanelForSlug = (slug) => {
  if (!slug) {
    hideTabsPanel();
    return;
  }
  const node = categoryTree.find((item) => item.slug === slug);
  if (!node) {
    hideTabsPanel();
    return;
  }
  renderTabsPanel(node);
};

categoryTabs?.addEventListener('click', (event) => {
  const button = event.target.closest('.category-tab');
  if (!button) return;
  navigateToCategory(button.dataset.slug);
});

categoryTabs?.addEventListener('mouseover', (event) => {
  const button = event.target.closest('.category-tab');
  if (!button) return;
  clearTabsPanelHideTimeout();
  showTabsPanelForSlug(button.dataset.slug);
});

categoryTabs?.addEventListener('focusin', (event) => {
  const button = event.target.closest('.category-tab');
  if (!button) return;
  clearTabsPanelHideTimeout();
  showTabsPanelForSlug(button.dataset.slug);
});

categoryTabs?.addEventListener('mouseleave', () => {
  scheduleHideTabsPanel();
});

categoryTabsPanel?.addEventListener('mouseenter', () => {
  clearTabsPanelHideTimeout();
});

categoryTabsPanel?.addEventListener('mouseleave', () => {
  scheduleHideTabsPanel();
});

categoryRootList?.addEventListener('mouseenter', (event) => {
  const button = event.target.closest('.category-root-item');
  if (!button) return;
  setActiveRootCategory(button.dataset.rootId);
});

categoryRootList?.addEventListener('focusin', (event) => {
  const button = event.target.closest('.category-root-item');
  if (!button) return;
  setActiveRootCategory(button.dataset.rootId);
});

categoryRootList?.addEventListener('click', (event) => {
  const button = event.target.closest('.category-root-item');
  if (!button) return;
  navigateToCategory(button.dataset.slug);
});

categoryChildPanel?.addEventListener('click', (event) => {
  const link = event.target.closest('a[data-slug]');
  if (!link) return;
  event.preventDefault();
  navigateToCategory(link.dataset.slug);
});

const setCategoryToggleExpanded = (expanded) => {
  if (!categoryToggle) return;
  categoryToggle.setAttribute('aria-expanded', expanded ? 'true' : 'false');
};

categoryNav?.addEventListener('mouseenter', () => setCategoryToggleExpanded(true));
categoryNav?.addEventListener('mouseleave', () => setCategoryToggleExpanded(false));
categoryToggle?.addEventListener('focus', () => setCategoryToggleExpanded(true));
categoryToggle?.addEventListener('blur', () => setCategoryToggleExpanded(false));
