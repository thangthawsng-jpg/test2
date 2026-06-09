// Kiểm tra trạng thái đăng nhập và cập nhật giao diện người dùng
function updateLoginState() {
  const userName = sessionStorage.getItem("user_name");

  // Xử lý tất cả các element với class .header-account-chip
  document.querySelectorAll(".header-account-chip").forEach((accountLink) => {
    const span = accountLink.querySelector("span");
    const isMobile = accountLink.closest(".d-xl-none") !== null;

    if (userName) {
      // Đã đăng nhập
      if (span) {
        span.textContent = userName;
        if (isMobile) {
          span.style.display = "inline"; // Hiển thị text trên mobile
        }
      }
      accountLink.removeAttribute("href");
      accountLink.style.cursor = "pointer";

      // Chuyển hướng sang trang cá nhân
      accountLink.onclick = (e) => {
        e.preventDefault();
        window.location.href = "./profile.html";
      };
    } else {
      // Chưa đăng nhập
      if (span) {
        span.textContent = "Đăng Nhập";
        if (isMobile) {
          span.style.display = "none"; // Ẩn text trên mobile khi chưa đăng nhập
        }
      }
      accountLink.setAttribute("href", "./login.html");
      accountLink.onclick = null;
    }
  });
}
// Đồng bộ dữ liệu và khởi tạo giao diện khi tải trang
document.addEventListener("DOMContentLoaded", () => {
  updateLoginState();
});
const money = (value) => {
  let number = Number(String(value ?? 0).replace(/,/g, ""));
  if (!Number.isFinite(number)) number = 0;
  if (number > 0 && number < 10000) {
    number = number * 25000;
  }
  return new Intl.NumberFormat("vi-VN").format(number) + " đ";
};

const params = new URLSearchParams(window.location.search);
const idParam = params.get("id") || "";
const detailRoot = document.getElementById("productDetail");
const relatedRoot = document.getElementById("relatedProducts");

let rawProducts = [];
let groups = [];
let compareSelectedIds = [];
let currentGroup = null;
let currentProduct = null;
let currentStorageIndex = 0;
let currentImageIndex = 0;
let quantity = 1;

const COLOR_MAP = {
  Trắng: "#f8fafc",
  "Trắng/Bạc": "#e5e7eb",
  Bạc: "#c0c0c0",
  Silver: "#c0c0c0",
  Đen: "#111827",
  Black: "#111827",
  "Space Black": "#111827",
  Xám: "#6b7280",
  "Xám Metal": "#64748b",
  Hồng: "#f9a8d4",
  "Hồng Rose": "#fb7185",
  Tím: "#a855f7",
  Cam: "#fb923c",
  Xanh: "#2563eb",
  "Xanh Lam": "#3b82f6",
  "Xanh Lá": "#16a34a",
  "Xanh Navy": "#1e3a8a",
  "Xanh Mint": "#6ee7b7",
  "Xanh Maya": "#38bdf8",
  "Xanh Aurora": "#22c55e",
  "Sky Blue": "#7dd3fc",
  Starlight: "#fde68a",
  "Mặc định": "#d1d5db",
  "Tiêu chuẩn": "#d1d5db"
};

// Lấy thông tin tài khoản đang đăng nhập
function getCurrentUser() {
  return getCurrentUserFromSession();
}

// Tạo key riêng theo từng tài khoản người dùng
function getUserKey(baseKey) {
  return getScopedStorageKey(baseKey);
}

// Tạo key lưu giỏ hàng trong localStorage
function getCartKey() {
  return getUserKey("miniProjectCart");
}

// Chuyển chuỗi thành dạng slug
function slug(text) {
  return String(text || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

// Đảm bảo dữ liệu luôn ở dạng mảng
function safeArray(value) {
  return Array.isArray(value) ? value : [];
}

// Lấy ID chính của sản phẩm
function getProductId(product) {
  return product?.id || product?.groupId || product?.defaultVariantId || slug(product?.name);
}

// Lấy màu mặc định của sản phẩm
function getMainColor(product) {
  if (product?.colors?.[0]?.name) return product.colors[0].name;
  if (typeof product?.colors?.[0] === "string") return product.colors[0];
  if (product?.color) return product.color;
  return "Mặc định";
}

// Lấy ảnh chính hiển thị của sản phẩm
function getMainImage(product) {
  return product?.colors?.[0]?.image || product?.image || product?.images?.[0] || product?.variants?.[0]?.image || "";
}

// Lấy tên dung lượng sản phẩm
function getStorageLabel(storage) {
  if (!storage) return "Tiêu chuẩn";
  if (typeof storage === "string") return storage;
  return storage.label || storage.storage || "Tiêu chuẩn";
}

// Lấy giá theo dung lượng được chọn
function getStoragePrice(product, storage) {
  if (storage && typeof storage === "object") {
    return storage.price ?? product.price ?? 0;
  }
  return product.price ?? 0;
}

// Lấy giá cũ theo dung lượng được chọn
function getStorageOldPrice(product, storage) {
  if (storage && typeof storage === "object") {
    return storage.oldPrice ?? product.oldPrice ?? 0;
  }
  return product.oldPrice ?? 0;
}

// Lấy danh sách ảnh hiển thị của sản phẩm
function getGallery(product) {
  const color = product?.colors?.[0];
  const gallery = color?.gallery?.length ? color.gallery : null;
  return Array.from(new Set([...(gallery || []), color?.image, product?.image, ...(product?.images || [])].filter(Boolean)));
}

// Tạo tên gốc của sản phẩm để gom nhóm
function buildBaseName(product) {
  const color = getMainColor(product);
  const storages = safeArray(product.storages).map(getStorageLabel);
  let name = product.baseName || product.name || "";
  name = name.replace(/\([^)]*\)/g, " ");
  [...storages, color, "Trắng/Bạc", "Xanh Lam", "Xanh Navy", "Xanh Mint", "Xanh Maya", "Xanh Aurora", "Xanh Lá", "Hồng Rose", "Xám Metal", "Space Black", "Sky Blue", "Starlight", "Silver", "Black", "Tiêu chuẩn", "Mặc định"].forEach((word) => {
    if (!word) return;
    const escaped = String(word).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    name = name.replace(new RegExp(`\\s+${escaped}\\s*$`, "i"), "");
  });
  name = name
    .replace(/\s+(128GB|256GB|512GB|1TB|2TB|6GB|8GB|12GB|16GB|32GB|SSD)$/i, "")
    .replace(/\s+/g, " ")
    .trim();
  return name || product.name || "Sản phẩm";
}

// Chuẩn hóa dữ liệu sản phẩm từ file JSON
function normalizeProducts(data) {
  if (!Array.isArray(data)) return [];
  if (data.some((item) => Array.isArray(item.variants))) {
    return data.map((item) => {
      const variants = safeArray(item.variants).map((variant) => ({
        ...variant,
        id: variant.id,
        name: item.baseName || item.name,
        color: variant.color || "Mặc định",
        image: variant.image || item.image,
        gallery: variant.gallery?.length ? variant.gallery : [variant.image || item.image].filter(Boolean),
        storages: [
          {
            label: variant.storage || "Tiêu chuẩn",
            price: variant.price ?? item.price,
            oldPrice: variant.oldPrice ?? item.oldPrice
          }
        ],
        category: item.category,
        categoryLabel: item.categoryLabel,
        brand: item.brand || item.name?.split(" ")?.[0],
        rating: Number(item.rating || 4.8),
        reviewCount: item.reviewCount || Math.floor(Number(item.rating || 4.8) * 10),
        shortDescription: variant.description || item.description || item.shortDescription,
        details: [variant.description || item.description || item.shortDescription || "", variant.highlight || item.highlight || "", "Giá bán thay đổi theo màu sắc và dung lượng.", "Phù hợp cho học tập, làm việc, giải trí và sử dụng lâu dài."].filter(Boolean),
        specs: item.specs,
        reviews: item.reviews
      }));
      return {
        id: item.id,
        baseName: item.baseName || item.name,
        category: item.category,
        categoryLabel: item.categoryLabel || "Sản phẩm",
        rating: Number(item.rating || 4.8),
        reviewCount: item.reviewCount || Math.floor(Number(item.rating || 4.8) * 10),
        products: variants
      };
    });
  }
  const map = new Map();
  data.forEach((product) => {
    const baseName = buildBaseName(product);
    const key = slug(`${product.category || "all"}-${baseName}`);
    if (!map.has(key)) {
      map.set(key, {
        id: key,
        baseName,
        category: product.category,
        categoryLabel: product.categoryLabel || "Sản phẩm",
        rating: Number(product.rating || 4.8),
        reviewCount: product.reviewCount || safeArray(product.reviews).length || 12,
        products: []
      });
    }
    map.get(key).products.push(product);
  });
  return Array.from(map.values());
}

// Tìm sản phẩm cần hiển thị khi mở trang
function findInitialSelection() {
  let selectedGroup = groups.find((group) => group.products.some((product) => getProductId(product) === idParam || product.groupId === idParam));
  if (!selectedGroup) {
    selectedGroup = groups.find((group) => group.id === idParam || slug(group.baseName) === idParam);
  }
  if (!selectedGroup) selectedGroup = groups[0];
  currentGroup = selectedGroup;
  currentProduct = selectedGroup.products.find((product) => getProductId(product) === idParam || product.groupId === idParam) || selectedGroup.products[0];
  currentStorageIndex = 0;
  currentImageIndex = 0;
  const storageFromId = safeArray(currentProduct.storages).findIndex((storage) => slug(getStorageLabel(storage)) && idParam.includes(slug(getStorageLabel(storage))));
  if (storageFromId >= 0) currentStorageIndex = storageFromId;
}

// Đọc dữ liệu giỏ hàng từ localStorage
function readCart() {
  try {
    return JSON.parse(localStorage.getItem(getCartKey())) || [];
  } catch {
    return [];
  }
}

// Lưu dữ liệu giỏ hàng vào localStorage
function saveCart(cart) {
  localStorage.setItem(getCartKey(), JSON.stringify(cart));
  const total = cart.reduce((sum, item) => sum + Number(item.quantity || 0), 0);
  document.querySelectorAll("[data-cart-count], #cartCount").forEach((badge) => {
    badge.textContent = total;
  });
  // Sync cart badges across all pages
  if (typeof updateCartBadges === "function") {
    updateCartBadges();
  }
}

// Hiển thị thông báo nhanh trên màn hình
function showToast(title, message, type = "success") {
  let box = document.getElementById("toastBox");
  if (!box) {
    box = document.createElement("div");
    box.id = "toastBox";
    box.className = "toast-box";
    document.body.appendChild(box);
  }
  const success = type === "success";
  const icon = success ? "bi-check-circle-fill" : "bi-exclamation-circle-fill";
  box.innerHTML = `
    <div class="toast-message ${success ? "success" : "error"}">
      <i class="bi ${icon}"></i>
      <div>
        <strong>${title}</strong>
        <span>${message}</span>
      </div>
      <button type="button" class="toast-close" onclick="this.closest('.toast-message').remove()">×</button>`;
  setTimeout(() => {
    box.innerHTML = "";
  }, 2600);
}

// Tạo HTML hiển thị số sao đánh giá
function starHtml(score) {
  const rating = Number(score || 0);
  let html = "";
  for (let i = 1; i <= 5; i++) {
    if (rating >= i - 0.25) {
      html += `<i class="bi bi-star-fill"></i>`;
    } else if (rating >= i - 0.75) {
      html += `<i class="bi bi-star-half"></i>`;
    } else {
      html += `<i class="bi bi-star"></i>`;
    }
  }
  return html;
}

// Lấy dung lượng đang được chọn
function getSelectedStorage() {
  const storages = safeArray(currentProduct.storages);
  return (
    storages[currentStorageIndex] ||
    storages[0] || {
      label: currentProduct.storage || "Tiêu chuẩn",
      price: currentProduct.price || 0,
      oldPrice: currentProduct.oldPrice || 0
    }
  );
}

// Lấy tên danh mục sản phẩm
function getCategoryName(category) {
  const key = String(category || "").toLowerCase();
  const categoryMap = {
    phone: "Điện thoại",
    phones: "Điện thoại",
    smartphone: "Điện thoại",
    tablet: "Máy tính bảng",
    laptop: "Laptop",
    accessory: "Phụ kiện",
    accessories: "Phụ kiện"
  };
  return categoryMap[key] || currentGroup.categoryLabel || "Sản phẩm";
}

// Lấy tên thương hiệu sản phẩm
function getBrandName(product) {
  return product?.brand || currentGroup?.brand || currentGroup?.baseName?.split(" ")?.[0] || "Thương hiệu";
}

// Hiển thị đường dẫn breadcrumb
function renderBreadcrumb() {
  const bcName = document.getElementById("bc-name");
  const bcCategory = document.getElementById("bc-category");
  const bcBrand = document.getElementById("bc-brand");
  const category = currentGroup.category || currentProduct.category || "phone";
  const categoryName = getCategoryName(category);
  const brandName = getBrandName(currentProduct);
  const brandLine = slug(brandName);
  if (bcCategory) {
    bcCategory.textContent = categoryName;
    bcCategory.href = `./index.html?category=${category}#featured`;
  }
  if (bcBrand) {
    bcBrand.textContent = brandName;
    bcBrand.href = `./index.html?category=${category}&brand=${slug(brandName)}#productLineFilter`;
  }
  if (bcName) {
    bcName.textContent = currentGroup.baseName;
  }
}

// Gán nội dung text cho phần tử HTML
function setText(id, value) {
  const el = document.getElementById(id);
  if (el) el.textContent = value ?? "";
}

// Gán nội dung HTML cho phần tử
function setHtml(id, value) {
  const el = document.getElementById(id);
  if (el) el.innerHTML = value ?? "";
}

// Gán giá trị cho input hoặc select
function setValue(id, value) {
  const el = document.getElementById(id);
  if (el) el.value = value ?? "";
}

// Ẩn hoặc hiện phần tử
function toggleHidden(id, hidden) {
  const el = document.getElementById(id);
  if (el) el.classList.toggle("d-none", hidden);
}

// Hiển thị danh sách ảnh nhỏ sản phẩm
function renderThumbList() {
  const thumbList = document.getElementById("thumbList");
  if (!thumbList) return;

  thumbList.innerHTML = currentGroup.products
    .map((product) => {
      const thumbId = getProductId(product);
      const thumbColor = getMainColor(product);
      const thumbStorage = getStorageLabel(safeArray(product.storages)[0]);
      const thumbImage = getMainImage(product);
      return `
      <button class="thumb-btn ${thumbId === getProductId(currentProduct) ? "active" : ""}" type="button" onclick="openRelated('${thumbId}')" title="${thumbColor} - ${thumbStorage}" aria-label="Chọn ${thumbColor} ${thumbStorage}">
        <img src="${thumbImage}" alt="${currentGroup.baseName} ${thumbColor}">
      </button>
    `;
    })
    .join("");
}

// Hiển thị danh sách màu sắc sản phẩm
function renderColorList() {
  const colorList = document.getElementById("colorList");
  if (!colorList) return;
  colorList.innerHTML = currentGroup.products
    .map((product, index) => {
      const color = getMainColor(product);
      const active = getProductId(product) === getProductId(currentProduct);
      const colorCode = product.colors?.[0]?.code || COLOR_MAP[color] || "#e5e7eb";
      return `
        <button class="color-swatch ${active ? "active" : ""}" type="button" title="${color}" style="background:${colorCode}" onclick="chooseColor(${index})" aria-label="Chọn màu ${color}"></button>
      `;
    })
    .join("");
}

// Hiển thị danh sách dung lượng sản phẩm
function renderStorageList() {
  const storageList = document.getElementById("storageList");
  if (!storageList) return;
  storageList.innerHTML = safeArray(currentProduct.storages)
    .map(
      (item, index) => `
        <button class="capacity-btn ${index === currentStorageIndex ? "active" : ""}" type="button" onclick="chooseStorage(${index})">
          ${getStorageLabel(item)}
        </button>
      `
    )
    .join("");
}

// Lấy danh sách mô tả chi tiết sản phẩm
function getDetailList() {
  return currentProduct.details?.length ? currentProduct.details : [currentProduct.shortDescription || currentProduct.description || "", currentProduct.highlight || "", "Giá bán thay đổi theo màu sắc và dung lượng.", "Phù hợp cho học tập, làm việc, giải trí và sử dụng lâu dài."].filter(Boolean);
}

// Lấy thông số kỹ thuật sản phẩm
function getSpecObject() {
  return (
    currentProduct.specs || {
      "Danh mục": currentGroup.categoryLabel || "Sản phẩm",
      "Phiên bản": getStorageLabel(getSelectedStorage()),
      "Màu sắc": getMainColor(currentProduct),
      "Bảo hành": "12 tháng",
      "Tình trạng": "Hàng mới"
    }
  );
}

// Lấy danh sách đánh giá khách hàng
function getReviewList() {
  return currentProduct.reviews?.length
    ? currentProduct.reviews
    : [
        { name: "Nguyễn Minh", stars: 5, content: "Sản phẩm đẹp, đúng mô tả và dùng rất ổn." },
        { name: "Trần Hoàng", stars: 4, content: "Giá hợp lý, hiệu năng tốt trong tầm giá." },
        { name: "Lê Phương", stars: 5, content: "Màn hình đẹp, pin ổn và giao hàng nhanh." }
      ];
}

// Hiển thị nội dung accordion thông tin sản phẩm
function renderAccordionData() {
  const details = getDetailList();
  const specs = getSpecObject();
  const reviews = getReviewList();
  const detailList = document.getElementById("detailList");
  if (detailList) detailList.innerHTML = details.map((item) => `<li>${item}</li>`).join("");

  const specTable = document.getElementById("specTable");
  if (specTable)
    specTable.innerHTML = Object.entries(specs)
      .map(([key, value]) => `<tr><td>${key}</td><td>${value}</td></tr>`)
      .join("");

  const reviewBadge = document.getElementById("reviewBadge");
  if (reviewBadge) reviewBadge.textContent = `${currentProduct.rating || currentGroup.rating} ★ · ${reviews.length} đánh giá`;

  const reviewList = document.getElementById("reviewList");
  if (reviewList) {
    reviewList.innerHTML = reviews
      .map(
        (review) => `
          <div class="review-card">
            <div class="review-head">
              <strong>${review.name}</strong>
              <span class="review-stars">${starHtml(review.stars)}</span>
            </div>
            <p>${review.content}</p>
          </div>
        `
      )
      .join("");
  }
}

// Gắn các sự kiện cố định cho giao diện
function bindStaticEvents() {
  document.getElementById("minusQty")?.addEventListener("click", () => changeQty(-1));
  document.getElementById("plusQty")?.addEventListener("click", () => changeQty(1));
  document.getElementById("buyNowBtn")?.addEventListener("click", () => addToCart(true));
  document.getElementById("addCartBtn")?.addEventListener("click", () => addToCart(false));
}

// Hiển thị toàn bộ thông tin chi tiết sản phẩm
function renderDetail() {
  if (!detailRoot || !currentGroup || !currentProduct) return;
  renderBreadcrumb();

  const storage = getSelectedStorage();
  const colorName = getMainColor(currentProduct);
  const imageList = getGallery(currentProduct);
  const mainImage = imageList[currentImageIndex] || getMainImage(currentProduct);
  const price = getStoragePrice(currentProduct, storage);
  const oldPrice = getStorageOldPrice(currentProduct, storage);
  const discount = oldPrice ? Math.round((1 - Number(price) / Number(oldPrice)) * 100) : 0;
  const reviewCount = currentProduct.reviewCount || currentGroup.reviewCount || safeArray(currentProduct.reviews).length || 0;
  const rating = currentProduct.rating || currentGroup.rating || 0;
  document.title = `${currentGroup.baseName} - Chi tiết sản phẩm`;
  setText("productBrand", currentProduct.brand || currentGroup.baseName.split(" ")[0]);
  setText("productName", currentGroup.baseName);
  setHtml("productStars", starHtml(rating));
  setText("productRating", `${rating}/5`);
  setText("productReviewCount", `${reviewCount} đánh giá`);
  setText("productPrice", money(price));
  setText("productOldPrice", oldPrice ? money(oldPrice) : "");
  setText("productDiscount", discount > 0 ? `-${discount}%` : "");
  toggleHidden("productOldPrice", !oldPrice);
  toggleHidden("productDiscount", !(discount > 0));
  setText("selectedColor", String(colorName).toUpperCase());
  setText("selectedStorage", getStorageLabel(storage));
  setValue("qtyVal", quantity);

  const mainImg = document.getElementById("mainImg");
  if (mainImg) {
    mainImg.src = mainImage;
    mainImg.alt = currentGroup.baseName;
  }
  ["detailThumb", "specThumb", "reviewThumb"].forEach((id) => {
    const img = document.getElementById(id);
    if (img) {
      img.src = mainImage;
      img.alt = currentGroup.baseName;
    }
  });
  renderThumbList();
  renderColorList();
  renderStorageList();
  renderAccordionData(mainImage);
}

// Tạo accordion cho phần thông tin sản phẩm
function buildAccordion() {
  return "";
}

// Chuyển ảnh chính khi chọn ảnh khác
function switchMainImg(index) {
  currentImageIndex = index;
  const gallery = getGallery(currentProduct);
  const img = document.getElementById("mainImg");
  if (img) img.src = gallery[index];
  document.querySelectorAll(".thumb-btn").forEach((btn, i) => {
    btn.classList.toggle("active", i === index);
  });
}

// Thay đổi màu sản phẩm đang xem
function chooseColor(index) {
  const newProduct = currentGroup.products[index];
  if (!newProduct) return;
  const currentStorageLabel = getStorageLabel(getSelectedStorage());
  currentProduct = newProduct;
  currentImageIndex = 0;
  const sameStorageIndex = safeArray(currentProduct.storages).findIndex((storage) => getStorageLabel(storage) === currentStorageLabel);
  currentStorageIndex = sameStorageIndex >= 0 ? sameStorageIndex : 0;
  history.replaceState(null, "", `product-detail.html?id=${getProductId(currentProduct)}`);
  renderDetail();
}

// Thay đổi dung lượng sản phẩm đang xem
function chooseStorage(index) {
  currentStorageIndex = index;
  renderDetail();
}

// Thay đổi số lượng sản phẩm
function changeQty(step) {
  quantity = Math.max(1, quantity + step);
  const input = document.getElementById("qtyVal");
  if (input) input.value = quantity;
}

// Thêm sản phẩm vào giỏ hàng hoặc mua ngay
function addToCart(buyNow) {
  if (!sessionStorage.getItem("user_name")) {
    showToast("Yêu cầu đăng nhập", "Vui lòng đăng nhập để thực hiện chức năng này.", "error");
    setTimeout(() => {
      window.location.href = "./login.html";
    }, 1500);
    return;
  }

  const storage = getSelectedStorage();
  const colorName = getMainColor(currentProduct);
  const price = getStoragePrice(currentProduct, storage);
  const itemId = `${getProductId(currentProduct)}-${getStorageLabel(storage)}-${colorName}`;

  // 1. LẤY CHÍNH XÁC ẢNH ĐANG HIỂN THỊ TRÊN GIAO DIỆN
  const imageList = getGallery(currentProduct);
  const selectedImage = imageList[currentImageIndex] || getMainImage(currentProduct);

  let cart = readCart();

  // 2. NẾU LÀ "MUA NGAY", LÀM SẠCH GIỎ HÀNG ĐỂ CHỈ THANH TOÁN ĐÚNG MÓN NÀY
  // (Nếu bạn muốn Mua ngay mà vẫn giữ các món đồ cũ trong giỏ, hãy xóa đoạn if(buyNow) { cart = []; } này đi)
  if (buyNow) {
    cart = [];
    // Lưu lại thông tin breadcrumb
    const category = currentGroup?.category || currentProduct.category || "phone";
    const bcProductInfo = {
      categoryName: getCategoryName(category),
      categoryUrl: `./index.html?category=${category}#featured`,
      brandName: getBrandName(currentProduct),
      brandUrl: `./index.html?category=${category}&brand=${slug(getBrandName(currentProduct))}#productLineFilter`,
      productName: currentGroup?.baseName || currentProduct.name,
      productUrl: `./product-detail.html?id=${currentProduct.id}`
    };
    localStorage.setItem("checkout_from_detail", JSON.stringify(bcProductInfo));
  }

  const existed = cart.find((item) => item.itemId === itemId);
  if (existed) {
    existed.quantity += quantity;
    existed.image = selectedImage; // Cập nhật lại ảnh phòng trường hợp user đổi màu
  } else {
    cart.push({
      itemId,
      id: getProductId(currentProduct),
      name: currentGroup.baseName,
      color: colorName,
      storage: getStorageLabel(storage),
      price,
      image: selectedImage, // BẮT BUỘC TRUYỀN ẢNH VÀO ĐÂY ĐỂ ĐEM QUA CHECKOUT
      quantity,
      selected: true, // Đặt mặc định là checked trong giỏ hàng
      // breacumb cho thanh toán
      detailUrl: `./product-detail.html?id=${getProductId(currentProduct)}`,
      categoryUrl: `./index.html?category=${currentProduct.category || currentGroup.category}#featured`
    });
  }

  saveCart(cart);
  localStorage.setItem(
    "checkout_from_detail",
    JSON.stringify({
      productName: currentGroup.baseName,
      productUrl: `./product-detail.html?id=${getProductId(currentProduct)}`,
      categoryName: getCategoryName(currentGroup.category),
      categoryUrl: `./index.html?category=${currentGroup.category}#featured`,
      brandName: getBrandName(currentProduct),
      brandUrl: `./index.html?category=${currentGroup.category}&brand=${slug(getBrandName(currentProduct))}#productLineFilter`
    })
  );
  if (buyNow) {
    // 3. CHUYỂN HƯỚNG SANG TRANG THANH TOÁN
    window.location.href = "./checkout.html";
    return;
  }

  showToast("Thêm giỏ hàng thành công", `${currentGroup.baseName} đã được thêm vào giỏ hàng.`, "success");
}

// Hiển thị danh sách sản phẩm liên quan
function renderRelated() {
  if (!relatedRoot || !currentGroup) return;
  const related = groups.filter((group) => group.id !== currentGroup.id && group.category === currentGroup.category).slice(0, 4);
  relatedRoot.innerHTML = related
    .map((group) => {
      const product = group.products[0];
      const storage = safeArray(product.storages)[0];
      const price = getStoragePrice(product, storage);
      const oldPrice = getStorageOldPrice(product, storage);
      return `
        <div class="col-6 col-md-3">
          <article class="related-card h-100" onclick="openRelated('${getProductId(product)}')">
            <div class="related-img">
              <img src="${getMainImage(product)}" alt="${group.baseName}" loading="lazy">
              <span class="related-badge">${group.categoryLabel || "Sản phẩm"}</span>
            </div>

            <div class="related-body">
              <h3>${group.baseName}</h3>
              <p>${product.shortDescription || product.description || ""}</p>

              <div class="related-stars">
                ${starHtml(product.rating || group.rating)}
                <small>${product.rating || group.rating}</small>
              </div>

              <div class="related-price">
                <strong>${money(price)}</strong>
                ${oldPrice ? `<del>${money(oldPrice)}</del>` : ""}
              </div>

              <div class="related-actions">
                <button type="button" class="related-cart" onclick="event.stopPropagation(); quickAdd('${getProductId(product)}')" aria-label="Thêm giỏ hàng">
                  <i class="bi bi-cart-plus"></i>
                </button>
                <button type="button" class="related-buy" onclick="event.stopPropagation(); openRelated('${getProductId(product)}')">
                  Mua ngay
                </button>
              </div>
            </div>
          </article>
        </div>
      `;
    })
    .join("");
}

// Lấy danh sách sản phẩm để so sánh
function getCompareOptions() {
  return groups
    .filter((group) => group.category === currentGroup.category)
    .map((group) => {
      const product = group.products[0];
      return {
        id: getProductId(product),
        name: group.baseName,
        group,
        product
      };
    });
}

// Hiển thị ô chọn sản phẩm so sánh
function renderCompareSelects() {
  const select1 = document.getElementById("compareSelect1");
  const select2 = document.getElementById("compareSelect2");
  const select3 = document.getElementById("compareSelect3");
  const options = getCompareOptions();
  if (select1) {
    select1.innerHTML = `
      <option value="${getProductId(currentProduct)}" selected>
        ${currentGroup.baseName}
      </option>
    `;
    select1.disabled = true;
  }
  [select2, select3].forEach((select, index) => {
    if (!select) return;
    select.innerHTML = `
      <option value="">Chọn sản phẩm ${index + 2}</option>
      ${options
        .filter((item) => item.id !== getProductId(currentProduct))
        .map(
          (item) => `
            <option value="${item.id}" ${compareSelectedIds[index] === item.id ? "selected" : ""}>
              ${item.name}
            </option>`
        )
        .join("")}`;
    select.onchange = () => {
      compareSelectedIds[index] = select.value;
      renderCompareProducts();
    };
  });
}

// Hiển thị bảng so sánh sản phẩm
function renderCompareProducts() {
  const compareHead = document.getElementById("compareHead");
  const compareBody = document.getElementById("compareBody");
  if (!compareHead || !compareBody || !currentGroup || !currentProduct) return;
  renderCompareSelects();
  const selectedGroups = compareSelectedIds
    .slice(0, 2)
    .map((id) => groups.find((group) => group.products.some((product) => getProductId(product) === id)))
    .filter(Boolean);
  const compareGroups = [currentGroup, ...selectedGroups].slice(0, 3);
  const compareProducts = compareGroups.map((group, index) => {
    const product = index === 0 ? currentProduct : group.products[0];
    const storage = safeArray(product.storages)[0];
    return {
      group,
      product,
      storage,
      price: getStoragePrice(product, storage),
      oldPrice: getStorageOldPrice(product, storage),
      image: getMainImage(product),
      name: group.baseName,
      rating: product.rating || group.rating || 0,
      reviews: product.reviewCount || group.reviewCount || 0,
      color: getMainColor(product),
      capacity: getStorageLabel(storage),
      specs: product.specs || {}
    };
  });
  compareHead.innerHTML = `
    <th>Sản phẩm</th>
    ${compareProducts
      .map(
        (item, index) => `
          <th>
            <div class="compare-product">
              <img src="${item.image}" alt="${item.name}">
              <strong>${item.name}</strong>
              <span>${money(item.price)}</span>
              ${index === 0 ? "<small>Sản phẩm đang xem</small>" : ""}
            </div>
          </th>
        `
      )
      .join("")}`;
  const getSpecValue = (item, keys, fallback = "Đang cập nhật") => {
    for (const key of keys) {
      if (item.specs?.[key]) return item.specs[key];
    }
    return fallback;
  };
  const rows = [
    { label: "Giá bán", getValue: (item) => money(item.price) },
    { label: "Giá gốc", getValue: (item) => (item.oldPrice ? money(item.oldPrice) : "Không có") },
    { label: "Đánh giá", getValue: (item) => `${item.rating}/5 (${item.reviews} đánh giá)` },
    { label: "Dung lượng", getValue: (item) => item.capacity || "Đang cập nhật" },
    { label: "Màn hình", getValue: (item) => getSpecValue(item, ["Màn hình", "Display", "Kích thước màn hình"]) },
    { label: "Chip xử lý", getValue: (item) => getSpecValue(item, ["Chip", "CPU", "Vi xử lý", "Bộ vi xử lý", "Chipset", "Chip xử lý"]) },
    { label: "Camera", getValue: (item) => getSpecValue(item, ["Camera", "Camera sau", "Camera chính"]) },
    { label: "Pin", getValue: (item) => getSpecValue(item, ["Pin", "Dung lượng pin", "Battery"]) }
  ];
  compareBody.innerHTML = rows
    .map(
      (row) => `
        <tr>
          <td>${row.label}</td>
          ${compareProducts.map((item) => `<td>${row.getValue(item)}</td>`).join("")}
        </tr>
      `
    )
    .join("");
}

// Mở trang chi tiết sản phẩm liên quan
function openRelated(id) {
  const group = groups.find((item) => item.products.some((product) => getProductId(product) === id));
  if (!group) return;
  currentGroup = group;
  currentProduct = group.products.find((product) => getProductId(product) === id) || group.products[0];
  currentStorageIndex = 0;
  currentImageIndex = 0;
  quantity = 1;
  history.replaceState(null, "", `product-detail.html?id=${getProductId(currentProduct)}`);
  renderDetail();
  renderRelated();
  compareSelectedIds = [];
  renderCompareProducts();
  window.scrollTo({
    top: 0,
    behavior: "smooth"
  });
}

// Thêm nhanh sản phẩm vào giỏ hàng
function quickAdd(id) {
  const oldGroup = currentGroup;
  const oldProduct = currentProduct;
  const oldStorageIndex = currentStorageIndex;
  const oldImageIndex = currentImageIndex;
  const oldQty = quantity;
  const group = groups.find((item) => item.products.some((product) => getProductId(product) === id));
  if (!group) return;
  currentGroup = group;
  currentProduct = group.products.find((product) => getProductId(product) === id) || group.products[0];
  currentStorageIndex = 0;
  currentImageIndex = 0;
  quantity = 1;
  addToCart(false);
  currentGroup = oldGroup;
  currentProduct = oldProduct;
  currentStorageIndex = oldStorageIndex;
  currentImageIndex = oldImageIndex;
  quantity = oldQty;
}

// Tải và khởi tạo dữ liệu sản phẩm
async function loadProducts() {
  try {
    const response = await fetch("./assets/json/product-detail.json");
    if (!response.ok) throw new Error("Không tải được product-detail.json");
    rawProducts = await response.json();
    groups = normalizeProducts(rawProducts);
    if (!groups.length) throw new Error("Không có dữ liệu sản phẩm");
    findInitialSelection();
    renderDetail();
    renderRelated();
    compareSelectedIds = [];
    renderCompareProducts();
    saveCart(readCart());
  } catch (error) {
    console.error(error);
    if (detailRoot) {
      detailRoot.innerHTML = `
        <div class="loading-box error-box">
          Không tải được dữ liệu sản phẩm. Kiểm tra lại assets/json/product-detail.json và đường dẫn ảnh.
        </div>
      `;
    }
  }
}
document.addEventListener("DOMContentLoaded", () => {
  bindStaticEvents();
  loadProducts();
});
