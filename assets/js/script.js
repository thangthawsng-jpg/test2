document.addEventListener("DOMContentLoaded", initPage);

// Khởi động các chức năng đang được dùng trên trang.
async function initPage() {
  await fetchProducts();
  await loadDetailedProducts();
  state.visibleLimit = calculateItemsLimit();
  initCountdown();
  initRevealObserver();
  initCounterObserver();
  initSearchForms();
  initActionHandlers();
  initFilters();
  renderProducts();
  checkLoginStatus();
  applyFilterFromUrl();
  initMobileNavigation(".mobile-nav-link", "mobileMenu");
  initQuickAddModal();
}

function initMobileNavigation(selector, offcanvasId) {
  const mobileNavLinks = document.querySelectorAll(selector);
  const offcanvasEl = document.getElementById(offcanvasId);

  // Nếu không tìm thấy menu hoặc không có link nào, dừng ngay lập tức
  if (!offcanvasEl || mobileNavLinks.length === 0) return;

  mobileNavLinks.forEach((link) => {
    link.addEventListener("click", function (e) {
      const href = this.getAttribute("href");

      // Chỉ chặn mặc định nếu là link nội bộ
      if (href && href.startsWith("#")) {
        e.preventDefault();
      }

      // 1. Đóng menu ẩn
      const bsOffcanvas = bootstrap.Offcanvas.getInstance(offcanvasEl) || new bootstrap.Offcanvas(offcanvasEl);
      bsOffcanvas.hide();

      // 2. Chuyển tab sản phẩm
      const filterValue = this.getAttribute("data-filter");
      if (filterValue) {
        const tabBtn = document.querySelector(`.category-filter-btn[data-filter="${filterValue}"]`);
        if (tabBtn) tabBtn.click();
      }

      // 3. Cuộn mượt mà
      if (href && href.startsWith("#")) {
        // Cuộn đến vùng mục tiêu
        setTimeout(() => {
          const targetSection = document.querySelector(href);
          if (targetSection) {
            targetSection.scrollIntoView({ behavior: "smooth", block: "start" });
          }
        }, 350);
      }
    });
  });
}

function checkLoginStatus() {
  const userName = sessionStorage.getItem("user_name");

  // 1. XỬ LÝ SỰ KIỆN TRÊN GIAO DIỆN DESKTOP
  const desktopAccountLink = document.querySelector(".header-account-chip");
  if (desktopAccountLink) {
    const span = desktopAccountLink.querySelector("span");

    if (userName) {
      if (span) span.textContent = userName;
      desktopAccountLink.removeAttribute("href");
      desktopAccountLink.style.cursor = "pointer";

      // Chuyển hướng sang trang cá nhân
      desktopAccountLink.onclick = (e) => {
        e.preventDefault();
        window.location.href = "./profile.html";
      };
    } else {
      if (span) span.textContent = "Đăng Nhập";
      desktopAccountLink.setAttribute("href", "./login.html");
      desktopAccountLink.onclick = null;
    }
  }

  // 2. XỬ LÝ SỰ KIỆN TRÊN GIAO DIỆN MOBILE
  const mobileLoginBtn = document.querySelector("#mobileMenu .mt-auto .btn-dark");
  if (mobileLoginBtn) {
    if (userName) {
      mobileLoginBtn.innerHTML = `<i class="bi bi-person-circle"></i> ${userName}`;
      mobileLoginBtn.removeAttribute("href");
      mobileLoginBtn.style.cursor = "pointer";

      // Chuyển hướng sang trang cá nhân
      mobileLoginBtn.onclick = (e) => {
        e.preventDefault();
        window.location.href = "./profile.html";
      };
    } else {
      mobileLoginBtn.innerHTML = `<i class="bi bi-box-arrow-in-right"></i> Đăng Nhập`;
      mobileLoginBtn.setAttribute("href", "./login.html");
      mobileLoginBtn.onclick = null;
    }
  }
}

let revealObserver = null;
let counterObserver = null;

// Modal quick add state
let quickAddState = {
  allProducts: [],
  currentProduct: null,
  selectedColor: null,
  selectedStorage: null,
  quantity: 1,
  modal: null,
};

const state = {
  activeFilter: "all",
  activeLineFilter: "all",
  searchTerm: "",
  cartCount: calculateCartCount ? calculateCartCount() : 0,
  likedProducts: new Set(),
  visibleLimit: 12,
};

let products = [];

const productLineFilters = {
  phone: [
    { value: "all", label: "Tất cả điện thoại" },
    { value: "iphone", label: "Iphone", image: "./assets/img/Logo laptop/logo_apple_ngang_1810642801.webp" },
    { value: "oppo", label: "Oppo", image: "./assets/img/Logo điện thoại/logo_oppo_ngang_68d31fcd73.webp" },
    { value: "samsung", label: "Samsung", image: "./assets/img/Logo điện thoại/logo_samsung_ngang_1624d75bd8.webp" },
    { value: "xiaomi", label: "Xiaomi", image: "./assets/img/Logo điện thoại/logo_xiaomi_ngang_0faf267234.webp" },
  ],

  tablet: [
    { value: "all", label: "Tất cả tablet" },
    { value: "ipad", label: "iPad", image: "./assets/img/Logo laptop/logo_apple_ngang_1810642801.webp" },
    { value: "samsung", label: "Samsung", image: "./assets/img/Logo điện thoại/logo_samsung_ngang_1624d75bd8.webp" },
    { value: "xiaomi", label: "Xiaomi", image: "./assets/img/Logo điện thoại/logo_xiaomi_ngang_0faf267234.webp" },
    { value: "lenovo", label: "Lenovo", image: "./assets/img/Logo laptop/logo_lenovo_ngang_9db13437a1.webp" },
  ],
  laptop: [
    { value: "all", label: "Tất cả laptop" },
    { value: "asus", label: "Asus", image: "./assets/img/Logo laptop/logo_asus_ngang_ac594ab664.webp" },
    { value: "dell", label: "Dell", image: "./assets/img/Logo laptop/logo_dell_ngang_5152294265.webp" },
    { value: "hp", label: "HP", image: "./assets/img/Logo laptop/logo_hp_ngang_b77a1ee753.webp" },
    { value: "lenovo", label: "Lenovo", image: "./assets/img/Logo laptop/logo_lenovo_ngang_9db13437a1.webp" },
    { value: "macbook", label: "Macbook", image: "./assets/img/Logo laptop/logo_apple_ngang_1810642801.webp" },
  ],
  accessory: [
    { value: "all", label: "Tất cả phụ kiện" },
    { value: "headphone", label: "Tai nghe" },
    { value: "charger", label: "Sạc" },
    { value: "case", label: "Ốp lưng" },
    { value: "keyboard-mouse", label: "Bàn phím / chuột" },
  ],
};

async function fetchProducts() {
  try {
    const response = await fetch("./assets/json/products.json");
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    products = await response.json();
  } catch (error) {
    console.error("Lỗi khi tải dữ liệu sản phẩm:", error);
  }
}

function formatVND(price) {
  if (price === undefined || price === null || price === "") return "";
  return Number(price).toLocaleString("vi-VN") + "đ";
}

// Tạo hiệu ứng hiện dần cho các phần tử có thuộc tính data-reveal.
function initRevealObserver() {
  if (!("IntersectionObserver" in window)) {
    document.querySelectorAll("[data-reveal]").forEach((element) => {
      element.classList.add("is-visible");
    });
    return;
  }

  revealObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;

        entry.target.classList.add("is-visible");
        revealObserver.unobserve(entry.target);
      });
    },
    {
      threshold: 0.18,
      rootMargin: "0px 0px -20px 0px",
    },
  );

  observeRevealTargets(document);
}

// Gắn observer vào các phần tử cần chạy hiệu ứng hiện dần.
function observeRevealTargets(root) {
  const targets = root.querySelectorAll ? root.querySelectorAll("[data-reveal]") : [];

  targets.forEach((element) => {
    if (!revealObserver) {
      element.classList.add("is-visible");
      return;
    }

    revealObserver.observe(element);
  });
}

// Theo dõi các số liệu trong hero để bắt đầu hiệu ứng đếm khi chúng xuất hiện.
function initCounterObserver() {
  const counters = document.querySelectorAll("[data-counter]");

  if (!counters.length) return;

  if (!("IntersectionObserver" in window)) {
    counters.forEach((counter) => animateCounter(counter));
    return;
  }

  counterObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;

        animateCounter(entry.target);
        counterObserver.unobserve(entry.target);
      });
    },
    {
      threshold: 0.5,
    },
  );

  counters.forEach((counter) => counterObserver.observe(counter));
}

// Chạy hiệu ứng tăng số từ 0 đến giá trị mục tiêu.
function animateCounter(counter) {
  const target = Number(counter.dataset.counter || 0);
  const duration = 1400;
  const startTime = performance.now();

  const update = (currentTime) => {
    const progress = Math.min((currentTime - startTime) / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    const value = Math.round(target * eased);

    counter.textContent = value;

    if (progress < 1) {
      requestAnimationFrame(update);
    } else {
      counter.textContent = target;
    }
  };

  requestAnimationFrame(update);
}

// Xử lý form tìm kiếm và render lại danh sách sản phẩm theo từ khóa.
function initSearchForms() {
  document.querySelectorAll(".search-form").forEach((form) => {
    form.addEventListener("submit", (event) => {
      event.preventDefault();

      const input = form.querySelector("input");
      const query = input ? input.value.trim() : "";

      state.searchTerm = query.toLowerCase();
      state.visibleLimit = calculateItemsLimit();
      syncSearchInputs(query);
      renderProducts();

      document.getElementById("featured")?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    });
  });
}

// Đồng bộ nội dung giữa các ô tìm kiếm nếu trang có nhiều form search.
function syncSearchInputs(value) {
  document.querySelectorAll(".search-form input").forEach((input) => {
    input.value = value;
  });
}

// Lắng nghe các nút thêm giỏ hàng, mua ngay, yêu thích và xem thêm
function initActionHandlers() {
  document.addEventListener("click", (event) => {
    const cartIconLink = event.target.closest('a[href="./cart.html"]');
    if (cartIconLink) {
      if (!sessionStorage.getItem("user_name")) {
        event.preventDefault();
        showErrorToast("Yêu cầu đăng nhập", "Vui lòng đăng nhập để xem giỏ hàng.");
        setTimeout(() => {
          window.location.href = "./login.html";
        }, 1500);
      }
      return;
    }

    const loadMoreBtn = event.target.closest("#loadMoreBtn");
    if (loadMoreBtn) {
      state.visibleLimit += calculateItemsLimit();
      renderProducts();
      return;
    }

    const cartButton = event.target.closest("[data-add-cart]");
    if (cartButton) {
      handleAddToCart(cartButton.dataset.addCart || "");
      return;
    }

    const likeButton = event.target.closest("[data-toggle-like]");
    if (likeButton) {
      handleToggleLike(likeButton.dataset.toggleLike || "");
      return;
    }

    const buyButton = event.target.closest("[data-buy-now]");
    if (buyButton) {
      handleBuyNow(buyButton.dataset.buyNow || "");
    }
  });
}

// Tăng số lượng giỏ hàng khi người dùng bấm nút thêm vào giỏ.
async function handleAddToCart(identifier) {
  const product = resolveProduct(identifier);
  if (!product) return;

  // Load detailed product info and show modal
  const detailedProduct = quickAddState.allProducts.find(p => p.id === identifier);
  if (!detailedProduct) return;

  showQuickAddModal(detailedProduct);
}

// Tăng số lượng giỏ hàng khi người dùng bấm nút mua ngay.
function handleBuyNow(identifier) {
  const product = resolveProduct(identifier);
  if (!product) return;

  window.location.href = `product-detail.html?id=${encodeURIComponent(product.id)}`;
}

// Bật hoặc tắt trạng thái yêu thích của một sản phẩm.
function handleToggleLike(identifier) {
  const product = resolveProduct(identifier);
  if (!product) return;

  if (state.likedProducts.has(product.id)) {
    state.likedProducts.delete(product.id);
  } else {
    state.likedProducts.add(product.id);
  }

  updateCountBadges();
  syncWishlistButtons();
}

// Cập nhật các badge hiển thị số lượng giỏ hàng và yêu thích.
function updateCountBadges() {
  document.querySelectorAll("[data-cart-count]").forEach((badge) => {
    badge.textContent = state.cartCount;
  });

  document.querySelectorAll("[data-wishlist-count]").forEach((badge) => {
    badge.textContent = state.likedProducts.size;
  });
}

// Đồng bộ trạng thái icon trái tim theo danh sách yêu thích hiện tại.
function syncWishlistButtons() {
  document.querySelectorAll("[data-toggle-like]").forEach((button) => {
    const product = resolveProduct(button.dataset.toggleLike || "");
    if (!product) return;

    const isActive = state.likedProducts.has(product.id);
    const icon = button.querySelector("i");

    button.classList.toggle("is-active", isActive);

    if (icon) {
      icon.className = isActive ? "bi bi-heart-fill" : "bi bi-heart";
    }
  });
}

// Tìm sản phẩm trong mảng dữ liệu theo id.
function resolveProduct(identifier) {
  return products.find((product) => product.id === identifier) || null;
}

// Gắn sự kiện lọc sản phẩm cho nút filter và shortcut danh mục.
function initFilters() {
  document.querySelectorAll("[data-filter]").forEach((button) => {
    button.addEventListener("click", () => {
      setFilter(button.dataset.filter || "all");
    });
  });

  document.getElementById("productLineFilter")?.addEventListener("click", (event) => {
    const button = event.target.closest("[data-line-filter]");
    if (!button) return;

    setLineFilter(button.dataset.lineFilter || "all");
  });

  document.querySelectorAll("[data-filter-shortcut]").forEach((shortcut) => {
    shortcut.addEventListener("click", (event) => {
      event.preventDefault();
      handleShortcutNavigation(shortcut);
    });
  });
}

// Chuyển tới khu sản phẩm và bật bộ lọc tương ứng với mục menu vừa nhấn.
function handleShortcutNavigation(shortcut) {
  setFilter(shortcut.dataset.filterShortcut || "all");
  scrollToAnchorTarget(shortcut.getAttribute("href"));
  closeMobileMenu();
}

// Cuộn mượt tới section được khai báo trong thuộc tính href dạng hash.
function scrollToAnchorTarget(targetSelector) {
  if (!targetSelector || !targetSelector.startsWith("#")) return;

  document.querySelector(targetSelector)?.scrollIntoView({
    behavior: "smooth",
    block: "start",
  });
}

// Đóng offcanvas mobile sau khi người dùng chọn xong một mục điều hướng.
function closeMobileMenu() {
  const mobileMenu = document.getElementById("mobileMenu");

  if (!mobileMenu || !window.bootstrap) return;

  const offcanvas = bootstrap.Offcanvas.getInstance(mobileMenu);
  if (!offcanvas) return;

  offcanvas.hide();
}

// Đổi bộ lọc hiện tại rồi render lại danh sách sản phẩm.
function setFilter(filter) {
  state.activeFilter = filter;
  state.activeLineFilter = "all";
  state.visibleLimit = calculateItemsLimit();
  updateFilterButtons();
  renderProducts();
}

// Đổi bộ lọc phụ theo hãng/dòng sản phẩm trong danh mục đang chọn.
function setLineFilter(lineFilter) {
  state.activeLineFilter = lineFilter;
  state.visibleLimit = calculateItemsLimit();
  renderProducts();
}

// Đánh dấu nút filter đang được chọn.
function updateFilterButtons() {
  document.querySelectorAll("[data-filter]").forEach((button) => {
    const isActive = button.dataset.filter === state.activeFilter;
    button.classList.toggle("active", isActive);
  });
}

// Lấy các sản phẩm phù hợp với bộ lọc và từ khóa tìm kiếm hiện tại.
function getVisibleProducts() {
  return products.filter((product) => {
    const matchFilter = state.activeFilter === "all" || product.category === state.activeFilter;
    const matchLineFilter = state.activeFilter === "all" || state.activeLineFilter === "all" || getProductLine(product) === state.activeLineFilter;
    const query = state.searchTerm.trim();

    if (!matchFilter) return false;
    if (!matchLineFilter) return false;
    if (!query) return true;

    const haystack = `${product.name} ${product.description} ${product.categoryLabel} ${product.highlight} ${getProductLine(product)}`.toLowerCase();
    return haystack.includes(query);
  });
}

// Đọc category và hãng sản phẩm từ URL để tự động lọc đúng sản phẩm khi bấm breadcrumb
function applyFilterFromUrl() {
  const params = new URLSearchParams(window.location.search);
  const category = params.get("category");
  const brand = params.get("brand");
  if (category) {
    state.activeFilter = category;
  }
  if (brand) {
    state.activeLineFilter = brand.toLowerCase();
    // hiện vùng hãng điện thoại
    const lineFilter = document.getElementById("productLineFilter");
    if (lineFilter) {
      lineFilter.classList.remove("d-none");
    }
  }
  updateFilterButtons();
  renderProducts();
  // nhảy xuống vùng hãng điện thoại
  requestAnimationFrame(() => {
    const target = document.getElementById("productLineFilter");
    if (target) {
      target.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }
  });
}

// Render danh sách sản phẩm nổi bật ra khu vực featuredProducts.
function renderProducts() {
  const featuredContainer = document.getElementById("featuredProducts");
  if (!featuredContainer) return;

  renderProductLineFilter();
  const visibleProducts = getVisibleProducts();

  if (!visibleProducts.length) {
    featuredContainer.innerHTML = `<div class="col-12">${buildEmptyState()}</div>`;
    observeRevealTargets(featuredContainer);
    return;
  }

  const currentProducts = visibleProducts.slice(0, state.visibleLimit);

  featuredContainer.innerHTML = currentProducts.map((product) => buildProductCard(product)).join("");

  if (visibleProducts.length > state.visibleLimit) {
    const loadMoreHTML = `
      <div class="col-12 d-flex justify-content-center mt-5 mb-2" id="loadMoreContainer">
        <button id="loadMoreBtn" class="btn btn-outline-dark px-5 py-2 fw-bold" style="border-width: 2px;" type="button">
          Xem thêm <i class="bi bi-chevron-down ms-1"></i>
        </button>
      </div>
    `;
    featuredContainer.insertAdjacentHTML("beforeend", loadMoreHTML);
  }

  observeRevealTargets(featuredContainer);
  syncWishlistButtons();
  updateCountBadges();
}

// Hiển thị thanh lọc ngang theo hãng/dòng khi người dùng chọn một danh mục cụ thể.
function renderProductLineFilter() {
  const filterShell = document.getElementById("productLineFilter");
  const filterList = filterShell?.querySelector("[data-line-filter-list]");

  if (!filterShell || !filterList) return;

  const lineFilters = productLineFilters[state.activeFilter] || [];
  const shouldShowLineFilters = state.activeFilter !== "all" && lineFilters.length > 0;

  filterShell.classList.toggle("d-none", !shouldShowLineFilters);

  if (!shouldShowLineFilters) {
    filterList.innerHTML = "";
    return;
  }

  if (!lineFilters.some((lineFilter) => lineFilter.value === state.activeLineFilter)) {
    state.activeLineFilter = "all";
  }

  filterList.innerHTML = lineFilters.map((lineFilter) => buildLineFilterButton(lineFilter)).join("");
}

function buildLineFilterButton(lineFilter) {
  const isActive = lineFilter.value === state.activeLineFilter;
  const content = lineFilter.image ? `<img class="product-line-logo" src="${lineFilter.image}" alt="${lineFilter.label}" loading="lazy">` : lineFilter.label;

  return `
    <button class="btn ${isActive ? "active" : ""}" type="button" data-line-filter="${lineFilter.value}" aria-pressed="${isActive}">
      ${content}
    </button>
  `;
}

function getProductLine(product) {
  const imagePath = String(product.image || "").toLowerCase();
  const text = `${product.id || ""} ${product.name || ""} ${product.description || ""}`.toLowerCase();

  if (imagePath.includes("/iphone/") || text.includes("iphone")) return "iphone";
  if (imagePath.includes("/oppo/") || text.includes("oppo")) return "oppo";
  if (imagePath.includes("/xiaomi/")) return "xiaomi";
  if (imagePath.includes("/samsung/") || text.includes("samsung") || text.includes("galaxy")) return "samsung";
  if (text.includes("xiaomi") || text.includes("poco")) return "xiaomi";
  if (imagePath.includes("/asus/") || text.includes("asus")) return "asus";
  if (imagePath.includes("/dell/") || text.includes("dell")) return "dell";
  if (imagePath.includes("/hp/") || text.includes("hp ")) return "hp";
  if (imagePath.includes("/lenovo/") || text.includes("lenovo")) return "lenovo";
  if (imagePath.includes("/macbook/") || text.includes("macbook")) return "macbook";
  if (text.includes("ipad")) return "ipad";
  if (text.includes("tai nghe") || text.includes("headphone")) return "headphone";
  if (text.includes("sạc") || text.includes("sac") || text.includes("charger")) return "charger";
  if (text.includes("ốp lưng") || text.includes("op lung") || text.includes("case")) return "case";
  if (text.includes("bàn phím") || text.includes("ban phim") || text.includes("chuột") || text.includes("chuot")) return "keyboard-mouse";

  return "other";
}
// Tạo HTML cho một card sản phẩm.
function buildProductCard(product) {
  const detailUrl = `product-detail.html?id=${encodeURIComponent(product.id)}`;
  const visualContent = product.image
    ? `<img src="${product.image}" alt="${product.name}" style="width: 100%; height: 100%; object-fit: contain; position: relative; z-index: 1;">`
    : `<i class="bi ${product.icon}"></i>`;

  return `
    <div class="col-6 col-md-4 col-lg-3 d-flex align-items-stretch">
      <article class="product-card w-100" data-reveal>
        <a class="product-card-link" href="${detailUrl}" aria-label="Xem chi tiết ${product.name}">
          <div class="product-card-top">
            <span class="product-badge">${product.tag}</span>
          </div>

          <div class="product-visual product-visual--${product.category}">
            ${visualContent}
          </div>

          <span class="product-category">${product.categoryLabel}</span>

          <h3 class="product-name" title="${product.name}">${product.name}</h3>
          <p class="product-desc" title="${product.description}">${product.description}</p>

          <div class="product-meta">
            <span><i class="bi bi-star-fill"></i> ${product.rating}</span>
            <span><i class="bi bi-lightning-charge-fill"></i> ${product.highlight}</span>
          </div>

          <div class="product-price-row">
            <span class="product-price">$${product.price}</span>
            <span class="product-old-price">$${product.oldPrice}</span>
          </div>
        </a>

        <div class="product-actions">
          <button class="btn btn-dark-subtle" type="button" data-add-cart="${product.id}" aria-label="Thêm ${product.name} vào giỏ">
            <i class="bi bi-bag-plus"></i>
          </button>
          <button class="btn btn-accent flex-fill" type="button" data-buy-now="${product.id}">Mua ngay</button>
        </div>
      </article>
    </div>
  `;
}

function buildEmptyState() {
  return `
    <div class="product-card text-center w-100" data-reveal>
      <div class="product-visual product-visual--accessory mx-auto" style="max-width: 150px; min-height: 150px;">
        <i class="bi bi-search"></i>
      </div>
      <h3 class="product-name mb-2">Chưa có kết quả phù hợp</h3>
      <p class="product-desc mb-0">
        Hãy thử từ khóa khác hoặc quay lại bộ lọc "Tất cả" để xem thêm các sản phẩm khác.
      </p>
    </div>
  `;
}

// Hàm tính toán số lượng sản phẩm cho 3 hàng dựa trên kích thước màn hình
function calculateItemsLimit() {
  const width = window.innerWidth;
  if (width >= 992) return 12;
  if (width >= 768) return 9;
  return 6;
}

// Cập nhật đồng hồ đếm ngược ở khu flash deal mỗi giây.
function initCountdown() {
  const daysElement = document.getElementById("dealDays");
  const hoursElement = document.getElementById("dealHours");
  const minutesElement = document.getElementById("dealMinutes");
  const secondsElement = document.getElementById("dealSeconds");

  if (!daysElement || !hoursElement || !minutesElement || !secondsElement) return;

  const deadline = Date.now() + (1 * 24 * 60 * 60 + 13 * 60 * 60 + 42 * 60 + 18) * 1000;

  const renderCountdown = () => {
    const distance = Math.max(deadline - Date.now(), 0);
    const days = Math.floor(distance / (1000 * 60 * 60 * 24));
    const hours = Math.floor((distance / (1000 * 60 * 60)) % 24);
    const minutes = Math.floor((distance / (1000 * 60)) % 60);
    const seconds = Math.floor((distance / 1000) % 60);

    daysElement.textContent = String(days).padStart(2, "0");
    hoursElement.textContent = String(hours).padStart(2, "0");
    minutesElement.textContent = String(minutes).padStart(2, "0");
    secondsElement.textContent = String(seconds).padStart(2, "0");
  };

  renderCountdown();
  window.setInterval(renderCountdown, 1000);
}

function goToDetail(id) {
  window.location.href = `product-detail.html?id=${id}`;
}

// Load detailed products from product-detail.json
async function loadDetailedProducts() {
  try {
    const response = await fetch("./assets/json/product-detail.json");
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    quickAddState.allProducts = await response.json();
  } catch (error) {
    console.error("Lỗi khi tải dữ liệu chi tiết sản phẩm:", error);
  }
}

// Initialize quick add modal event listeners
function initQuickAddModal() {
  const modal = document.getElementById("quickAddModal");
  if (!modal) return;

  quickAddState.modal = new bootstrap.Modal(modal);

  // Quantity buttons
  document.getElementById("quickAddQtyMinus")?.addEventListener("click", () => {
    const input = document.getElementById("quickAddQty");
    const val = Math.max(1, Number(input.value) - 1);
    input.value = val;
    quickAddState.quantity = val;
  });

  document.getElementById("quickAddQtyPlus")?.addEventListener("click", () => {
    const input = document.getElementById("quickAddQty");
    const val = Math.min(99, Number(input.value) + 1);
    input.value = val;
    quickAddState.quantity = val;
  });

  // Quantity input change
  document.getElementById("quickAddQty")?.addEventListener("change", (e) => {
    let val = Number(e.target.value) || 1;
    val = Math.max(1, Math.min(99, val));
    e.target.value = val;
    quickAddState.quantity = val;
  });

  // Confirm button
  document.getElementById("quickAddConfirmBtn")?.addEventListener("click", confirmQuickAdd);
}

// Show quick add modal with product details
function showQuickAddModal(product) {
  quickAddState.currentProduct = product;
  quickAddState.selectedColor = product.colors && product.colors.length > 0 ? product.colors[0] : null;
  quickAddState.selectedStorage = product.storages && product.storages.length > 0 ? product.storages[0] : null;
  quickAddState.quantity = 1;

  // Update modal header image and title
  const mainImage = product.images && product.images.length > 0 ? product.images[0] : "";
  document.getElementById("quickAddImage").src = mainImage || "";
  document.getElementById("quickAddProductName").textContent = product.name || "Sản phẩm";
  document.getElementById("quickAddProductDesc").textContent = product.shortDescription || "";
  document.getElementById("quickAddQty").value = 1;

  // Render color options
  renderColorOptions(product);

  // Render storage options
  renderStorageOptions(product);

  // Update price
  updateQuickAddPrice();

  // Show modal
  if (quickAddState.modal) {
    quickAddState.modal.show();
  }
}

// Render color selection buttons
function renderColorOptions(product) {
  const colorContainer = document.getElementById("quickAddColors");
  const colorSection = document.getElementById("colorSection");

  if (!product.colors || product.colors.length === 0) {
    colorSection.style.display = "none";
    return;
  }

  colorSection.style.display = "block";
  colorContainer.innerHTML = product.colors.map((color, index) => {
    const isSelected = quickAddState.selectedColor && quickAddState.selectedColor.name === color.name;
    return `
      <button 
        type="button" 
        class="btn btn-sm ${isSelected ? 'btn-dark' : 'btn-outline-secondary'}" 
        data-color-index="${index}"
        title="${color.name}"
      >
        ${color.name}
      </button>
    `;
  }).join("");

  // Add click listeners to color buttons
  colorContainer.querySelectorAll("[data-color-index]").forEach(btn => {
    btn.addEventListener("click", () => {
      const index = Number(btn.dataset.colorIndex);
      quickAddState.selectedColor = product.colors[index];
      renderColorOptions(product);
      updateQuickAddPrice();
    });
  });
}

// Render storage selection buttons
function renderStorageOptions(product) {
  const storageContainer = document.getElementById("quickAddStorages");
  const storageSection = document.getElementById("storageSection");

  if (!product.storages || product.storages.length === 0) {
    storageSection.style.display = "none";
    return;
  }

  storageSection.style.display = "block";
  storageContainer.innerHTML = product.storages.map((storage, index) => {
    const isSelected = quickAddState.selectedStorage && quickAddState.selectedStorage.label === storage.label;
    return `
      <button 
        type="button" 
        class="btn btn-sm ${isSelected ? 'btn-dark' : 'btn-outline-secondary'}" 
        data-storage-index="${index}"
      >
        ${storage.label}
      </button>
    `;
  }).join("");

  // Add click listeners to storage buttons
  storageContainer.querySelectorAll("[data-storage-index]").forEach(btn => {
    btn.addEventListener("click", () => {
      const index = Number(btn.dataset.storageIndex);
      quickAddState.selectedStorage = product.storages[index];
      renderStorageOptions(product);
      updateQuickAddPrice();
    });
  });
}

// Update displayed price in modal
function updateQuickAddPrice() {
  if (!quickAddState.selectedStorage) return;

  const price = quickAddState.selectedStorage.price || 0;
  const formattedPrice = new Intl.NumberFormat("vi-VN").format(price) + " đ";
  document.getElementById("quickAddPrice").textContent = formattedPrice;
}

// Confirm and add to cart from modal
function confirmQuickAdd() {
  if (!sessionStorage.getItem("user_name")) {
    showErrorToast("Yêu cầu đăng nhập", "Vui lòng đăng nhập để thực hiện chức năng này.");
    setTimeout(() => {
      window.location.href = "./login.html";
    }, 1500);
    return;
  }

  const product = quickAddState.currentProduct;
  if (!product || !quickAddState.selectedStorage || !quickAddState.selectedColor) return;

  // Get current user info for cart key
  const userName = sessionStorage.getItem("user_name");
  const customUsers = JSON.parse(localStorage.getItem("custom_users")) || [];
  const currentUser = customUsers.find((user) => user.name === userName) || null;
  const cartKey = currentUser?.account ? `miniProjectCart_${currentUser.account}` : "miniProjectCart_guest";

  // Get existing cart
  let cart = [];
  try {
    cart = JSON.parse(localStorage.getItem(cartKey)) || [];
  } catch {
    cart = [];
  }

  // Create item ID
  const itemId = `${product.id}-${quickAddState.selectedStorage.label}-${quickAddState.selectedColor.name}`;

  // Get the image to display
  const selectedImage = quickAddState.selectedColor.image || product.images?.[0] || "";

  // Check if item already exists
  const existed = cart.find((item) => item.itemId === itemId);
  if (existed) {
    existed.quantity += quickAddState.quantity;
    existed.image = selectedImage;
  } else {
    cart.push({
      itemId,
      id: product.id,
      name: product.name,
      color: quickAddState.selectedColor.name,
      storage: quickAddState.selectedStorage.label,
      price: quickAddState.selectedStorage.price,
      image: selectedImage,
      quantity: quickAddState.quantity,
    });
  }

  // Save cart
  localStorage.setItem(cartKey, JSON.stringify(cart));

  // Update cart count
  state.cartCount += quickAddState.quantity;
  updateCountBadges();
  
  // Sync cart badges across all pages
  if (typeof updateCartBadges === 'function') {
    updateCartBadges();
  }

  // Show success message
  showSuccessToast(product.name);

  // Close modal
  if (quickAddState.modal) {
    quickAddState.modal.hide();
  }
}

// Show success toast message
function showSuccessToast(productName) {
  let box = document.getElementById("toastBox");
  if (!box) {
    box = document.createElement("div");
    box.id = "toastBox";
    box.className = "toast-box";
    document.body.appendChild(box);
  }
  
  box.innerHTML = `
    <div class="toast-message success">
      <i class="bi bi-check-circle-fill"></i>
      <div>
        <strong>Thêm giỏ hàng thành công</strong>
        <span>${productName} đã được thêm vào giỏ hàng.</span>
      </div>
      <button type="button" class="toast-close" onclick="this.closest('.toast-message').remove()">×</button>
    </div>
  `;
  
  setTimeout(() => {
    box.innerHTML = "";
  }, 2600);

  // Show error toast message
function showErrorToast(title, message) {
  let box = document.getElementById("toastBox");
  if (!box) {
    box = document.createElement("div");
    box.id = "toastBox";
    box.className = "toast-box";
    document.body.appendChild(box);
  }
  
  box.innerHTML = `
    <div class="toast-message error">
      <i class="bi bi-exclamation-circle-fill"></i>
      <div>
        <strong>${title}</strong>
        <span>${message}</span>
      </div>
      <button type="button" class="toast-close" onclick="this.closest('.toast-message').remove()">×</button>
    </div>
  `;
  
  setTimeout(() => {
    box.innerHTML = "";
  }, 2600);
}
}

