const checkoutState = {
  cart: [],
  voucher: null,
  usePoints: false,
  usedPoints: 0
};

let voucherCatalog = [];

const checkoutElements = {};

document.addEventListener("DOMContentLoaded", initCheckout);

function initCheckout() {
  cacheCheckoutElements();
  checkoutState.cart = readCart();
  renderCheckoutBreadcrumb();
  updateLoginState();

  // Nạp dữ liệu vào Select Box
  loadAddresses();
  loadVouchersFromJson();
  bindCheckoutEvents();
  renderCheckout();
}

function cacheCheckoutElements() {
  checkoutElements.form = document.getElementById("checkoutForm");
  checkoutElements.cartItems = document.getElementById("cartItems");
  checkoutElements.subtotalValue = document.getElementById("subtotalValue");
  checkoutElements.discountValue = document.getElementById("discountValue");
  checkoutElements.shippingValue = document.getElementById("shippingValue");
  checkoutElements.totalValue = document.getElementById("totalValue");
  checkoutElements.submitOrderBtn = document.getElementById("submitOrderBtn");

  // Element mới
  checkoutElements.addressSelect = document.getElementById("addressSelect");
  checkoutElements.voucherSelect = document.getElementById("voucherSelect");

  checkoutElements.voucherMessage = document.getElementById("voucherMessage");
  checkoutElements.cardFields = document.getElementById("cardFields");
  checkoutElements.cardNumber = document.getElementById("cardNumber");
  checkoutElements.cardExpiry = document.getElementById("cardExpiry");
  checkoutElements.cardCvv = document.getElementById("cardCvv");
  checkoutElements.orderCode = document.getElementById("orderCode");
  checkoutElements.toast = document.getElementById("checkoutToast");
  checkoutElements.searchForm = document.querySelector(".search-form");
  // Điểm thưởng
  checkoutElements.pointDiscountValue = document.getElementById("pointDiscountValue");
  checkoutElements.usePointSwitch = document.getElementById("usePointSwitch");
  checkoutElements.availablePointText = document.getElementById("availablePointText");
  checkoutElements.pointMoneyText = document.getElementById("pointMoneyText");
}

// ----------------------------------------
// XỬ LÝ ĐỊA CHỈ TỪ LOCAL STORAGE
// ----------------------------------------
function loadAddresses() {
  const addresses = JSON.parse(localStorage.getItem(getAddressStorageKey())) || [];
  const select = checkoutElements.addressSelect;

  if (!select) return;

  if (addresses.length === 0) {
    select.innerHTML = `<option value="">Bạn chưa lưu địa chỉ nào. Vui lòng cập nhật sổ địa chỉ.</option>`;
    return;
  }

  let html = "";
  addresses.forEach((addr) => {
    // Nếu là địa chỉ mặc định thì tự động selected
    const isSelected = addr.isDefault ? "selected" : "";
    const typeLabel = addr.type ? `[${addr.type}] ` : "";

    // Gộp thông tin hiển thị lên thẻ option
    const displayText = `${typeLabel}${addr.name} - ${addr.phone} - ${addr.detail}, ${addr.region}`;

    html += `<option value="${addr.id}" ${isSelected}>${displayText}</option>`;
  });

  select.innerHTML = html;
}

// Breadcumb checkout
function getFirstCheckoutItem() {
  return checkoutState.cart && checkoutState.cart.length ? checkoutState.cart[0] : null;
}

function renderCheckoutBreadcrumb() {
  const fromDetail = JSON.parse(localStorage.getItem("checkout_from_detail") || "null");
  const bcCategory = document.getElementById("checkoutBcCategory");
  const bcBrand = document.getElementById("checkoutBcBrand");
  const bcBrandIcon = document.getElementById("checkoutBcBrandIcon");
  const bcProduct = document.getElementById("checkoutBcProduct");
  const bcProductIcon = document.getElementById("checkoutBcProductIcon");
  const bcCart = document.getElementById("checkoutBcCart");
  const bcCartIcon = document.getElementById("checkoutBcCartIcon");
  if (!bcCategory || !bcCart) return;
  bcBrand?.classList.add("d-none");
  bcBrandIcon?.classList.add("d-none");
  bcProduct?.classList.add("d-none");
  bcProductIcon?.classList.add("d-none");
  bcCart?.classList.remove("d-none");
  bcCartIcon?.classList.remove("d-none");
  if (fromDetail) {
    bcCategory.textContent = fromDetail.categoryName || "Sản phẩm";
    bcCategory.href = fromDetail.categoryUrl || "./index.html#featured";
    if (fromDetail.brandName && fromDetail.brandUrl) {
      bcBrand.textContent = fromDetail.brandName;
      bcBrand.href = fromDetail.brandUrl;
      bcBrand.classList.remove("d-none");
      bcBrandIcon.classList.remove("d-none");
    }
    if (fromDetail.productName && fromDetail.productUrl) {
      bcProduct.textContent = fromDetail.productName;
      bcProduct.href = fromDetail.productUrl;
      bcProduct.classList.remove("d-none");
      bcProductIcon.classList.remove("d-none");
    }
    bcCart.classList.add("d-none");
    bcCartIcon.classList.add("d-none");
    return;
  }
  bcCategory.textContent = "Sản phẩm";
  bcCategory.href = "./index.html#featured";
}

// ----------------------------------------
// XỬ LÝ VOUCHER BẰNG SELECT BOX
// ----------------------------------------
async function loadVouchersFromJson() {
  try {
    const response = await fetch("./assets/json/vouchers.json");
    if (!response.ok) throw new Error("Không tải được vouchers.json");
    voucherCatalog = await response.json();
    loadVouchers();
  } catch (error) {
    console.error("Lỗi tải vouchers.json:", error);
    voucherCatalog = [];
    loadVouchers();
  }
}

function loadVouchers() {
  const select = checkoutElements.voucherSelect;
  if (!select) return;
  const usedVouchers = JSON.parse(localStorage.getItem(getUsedVoucherKey())) || [];
  const availableVouchers = voucherCatalog.filter((voucher) => {
    const voucherStatus = voucher.status || "unused";
    return !usedVouchers.includes(voucher.code) && voucherStatus === "unused" && !isVoucherExpired(voucher) && canUseVoucherForCart(voucher);
  });

  if (!availableVouchers.length) {
    select.innerHTML = `<option value="">Chưa có voucher khả dụng</option>`;
    return;
  }
  let html = `<option value="">-- Không sử dụng voucher --</option>`;
  availableVouchers.forEach((voucher) => {
    html += `
      <option value="${voucher.code}">
        ${voucher.code} - ${voucher.message}
      </option>
    `;
  });
  select.innerHTML = html;
}

function isVoucherExpired(voucher) {
  const today = new Date();
  const expireDate = new Date(voucher.expireDate);
  today.setHours(0, 0, 0, 0);
  expireDate.setHours(23, 59, 59, 999);
  return expireDate < today;
}

function handleVoucherChange() {
  const code = checkoutElements.voucherSelect.value;

  if (!code) {
    checkoutState.voucher = null;
    showVoucherMessage("", "");
    renderSummary();
    return;
  }

  if (!checkoutState.cart.length) {
    checkoutElements.voucherSelect.value = ""; // Reset
    showVoucherMessage("Thêm sản phẩm trước khi áp dụng mã.", "error");
    return;
  }
  const voucher = voucherCatalog.find((item) => item.code === code);
  if (!voucher) {
    checkoutState.voucher = null;
    showVoucherMessage("Mã giảm giá không hợp lệ.", "error");
    renderSummary();
    return;
  }
  if (isVoucherExpired(voucher)) {
    checkoutState.voucher = null;
    checkoutElements.voucherSelect.value = "";
    showVoucherMessage("Mã giảm giá đã hết hạn.", "error");
    renderSummary();
    return;
  }
  if (!canUseVoucherForCart(voucher)) {
    checkoutState.voucher = null;
    checkoutElements.voucherSelect.value = "";
    showVoucherMessage("Voucher này không áp dụng cho sản phẩm trong giỏ.", "error");
    renderSummary();
    return;
  }
  const subtotal = getSubtotal();
  if (subtotal < Number(voucher.minOrder || 0)) {
    checkoutState.voucher = null;
    checkoutElements.voucherSelect.value = "";
    showVoucherMessage(`Đơn hàng cần tối thiểu ${money(voucher.minOrder)}.`, "error");
    renderSummary();
    return;
  }
  checkoutState.voucher = voucher;
  showVoucherMessage(`Áp dụng thành công: ${voucher.message}`, "success");
  renderSummary();
}

function bindCheckoutEvents() {
  checkoutElements.cartItems?.addEventListener("click", handleCartAction);
  checkoutElements.form?.addEventListener("submit", submitOrder);
  checkoutElements.searchForm?.addEventListener("submit", handleSearchSubmit);

  // Lắng nghe sự kiện đổi Voucher
  checkoutElements.voucherSelect?.addEventListener("change", handleVoucherChange);

  document.querySelectorAll("[name='shippingMethod']").forEach((input) => {
    input.addEventListener("change", () => {
      renderSummary(); // Tính lại tiền ship
    });
  });

  document.querySelectorAll("[name='paymentMethod']").forEach((input) => {
    input.addEventListener("change", togglePaymentFields);
  });

  checkoutElements.cardNumber?.addEventListener("input", formatCardNumber);
  checkoutElements.cardExpiry?.addEventListener("input", formatCardExpiry);
  togglePaymentFields();
  // Điểm thưởng
  checkoutElements.usePointSwitch?.addEventListener("change", function () {
    checkoutState.usePoints = this.checked;
    const subtotal = getSubtotal();
    const shippingFee = getShippingFee(subtotal);
    const discount = getDiscountAmount(subtotal, shippingFee);
    const availablePoints = getAvailablePoints();
    checkoutState.usedPoints = this.checked ? Math.min(Math.floor(availablePoints / 1000) * 1000, subtotal + shippingFee - discount) : 0;
    renderSummary();
  });
}

function handleSearchSubmit(event) {
  event.preventDefault();
  const input = checkoutElements.searchForm?.querySelector("input");
  const query = input?.value.trim();
  window.location.href = query ? `./index.html#featured` : "./index.html#featured";
}

function getCurrentUser() {
  return getCurrentUserFromSession();
}

function getAddressStorageKey() {
  return getScopedStorageKey("tht_user_addresses");
}

function readStorageJson(storage, key) {
  try {
    return JSON.parse(storage.getItem(key));
  } catch {
    return null;
  }
}

function getUserKey(baseKey) {
  return getScopedStorageKey(baseKey);
}

function getCartKey() {
  return getUserKey("miniProjectCart");
}

function getOrderKey() {
  return getUserKey("miniProjectOrders");
}

// Tích điểm (mới thêm)
function getRewardKey() {
  return getScopedStorageKey("rewardHistory");
}

function getRewardHistory() {
  return JSON.parse(localStorage.getItem(getRewardKey())) || [];
}

function getAvailablePoints() {
  const history = getRewardHistory();
  return history.reduce((total, item) => {
    if (item.type === "earn") return total + Number(item.point || 0);
    if (item.type === "used") return total - Number(item.point || 0);
    return total;
  }, 0);
}

function useRewardPoint(point, orderCode) {
  const history = getRewardHistory();

  history.unshift({
    id: Date.now(),
    type: "used",
    title: "Sử dụng điểm thưởng",
    description: `Đơn hàng #${orderCode}`,
    point,
    date: new Date().toLocaleString("vi-VN")
  });
  localStorage.setItem(getRewardKey(), JSON.stringify(history));
}

function addRewardPoint(orderCode, totalMoney) {
  const history = JSON.parse(localStorage.getItem(getRewardKey())) || [];
  const point = Math.floor(totalMoney / 1000);
  history.unshift({
    id: Date.now(),
    type: "earn",
    title: "Tích điểm từ đơn hàng",
    description: `Đơn hàng #${orderCode}`,
    point,
    date: new Date().toLocaleString("vi-VN")
  });
  localStorage.setItem(getRewardKey(), JSON.stringify(history));
}

function readCart() {
  try {
    return JSON.parse(localStorage.getItem(getCartKey())) || [];
  } catch {
    return [];
  }
}

function saveCart() {
  localStorage.setItem(getCartKey(), JSON.stringify(checkoutState.cart));
  updateCartCount();
}

function saveOrder(order) {
  const orders = readStorageJson(localStorage, getOrderKey()) || [];
  orders.unshift(order);
  localStorage.setItem(getOrderKey(), JSON.stringify(orders));
  /* Tích điểm (mới thêm) */
  addRewardPoint(order.code, order.totals.total);
}

function canUseVoucherForCart(voucher) {
  if (!voucher.applyCategory) return true;

  return checkoutState.cart.some((item) => {
    const itemCategory = item.category || item.categoryLabel;
    if (itemCategory === voucher.applyCategory) return true;
    if (voucher.applyCategory === "phone" && (itemCategory === "Điện thoại" || item.name?.toLowerCase().includes("iphone") || item.name?.toLowerCase().includes("samsung") || item.name?.toLowerCase().includes("oppo") || item.name?.toLowerCase().includes("xiaomi"))) {
      return true;
    }
    if (
      voucher.applyCategory === "laptop" &&
      (itemCategory === "Laptop" ||
        item.name?.toLowerCase().includes("laptop") ||
        item.name?.toLowerCase().includes("macbook") ||
        item.name?.toLowerCase().includes("asus") ||
        item.name?.toLowerCase().includes("dell") ||
        item.name?.toLowerCase().includes("hp") ||
        item.name?.toLowerCase().includes("lenovo"))
    ) {
      return true;
    }
    if (voucher.applyCategory === "tablet" && (itemCategory === "Máy tính bảng" || item.name?.toLowerCase().includes("ipad") || item.name?.toLowerCase().includes("tablet"))) {
      return true;
    }
    return false;
  });
}

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

function renderCheckout() {
  renderCartItems();
  // Điểm thưởng
  setText(checkoutElements.availablePointText, getAvailablePoints());
  renderSummary();
  updateCartCount();
}

function renderCartItems() {
  if (!checkoutElements.cartItems) return;

  if (!checkoutState.cart.length) {
    checkoutElements.cartItems.innerHTML = `
      <div class="cart-empty border p-4 text-center rounded-4">
        <i class="bi bi-bag fs-1 text-secondary"></i>
        <h3 class="mt-3 fs-5">Giỏ hàng đang trống</h3>
        <p class="text-muted">Chọn sản phẩm trước khi thanh toán.</p>
        <a class="btn btn-outline-dark mt-2" href="./index.html#featured">Xem sản phẩm</a>
      </div>
    `;
    checkoutElements.submitOrderBtn.disabled = true;
    return;
  }

  checkoutElements.submitOrderBtn.disabled = false;
  checkoutElements.cartItems.innerHTML = checkoutState.cart.map((item, index) => buildCartItem(item, index)).join("");
}

function buildCartItem(item, index) {
  const itemMeta = [item.color, item.storage].filter(Boolean).join(" / ");
  return `
    <article class="cart-item border-0 border-bottom rounded-0 mb-2 pb-3">
      <div class="cart-item-img border rounded">
        ${item.image ? `<img src="${escapeHtml(item.image)}" alt="${escapeHtml(item.name)}" loading="lazy">` : `<i class="bi bi-phone"></i>`}
      </div>
      <div class="cart-item-info">
        <h3 class="fs-6">
          <a href="${escapeHtml(item.detailUrl || `./product-detail.html?id=${item.id}`)}" class="text-dark text-decoration-none">
            ${escapeHtml(item.name || "Sản phẩm")}
          </a>
        </h3>
        <p class="text-muted small mb-2">${escapeHtml(itemMeta || "Phiên bản tiêu chuẩn")}</p>
        <div class="cart-item-bottom">
          <strong class="cart-item-price text-danger">${money(item.price)}</strong>
          <div class="d-flex align-items-center gap-2">
            <div class="qty-control border rounded px-1">
              <button type="button" data-cart-action="decrease" data-cart-index="${index}"><i class="bi bi-dash"></i></button>
              <span class="px-2">${Number(item.quantity || 1)}</span>
              <button type="button" data-cart-action="increase" data-cart-index="${index}"><i class="bi bi-plus"></i></button>
            </div>
            <button class="btn btn-sm btn-light text-danger remove-item p-1 px-2" type="button" data-cart-action="remove" data-cart-index="${index}"><i class="bi bi-trash"></i></button>
          </div>
        </div>
      </div>
    </article>
  `;
}

function handleCartAction(event) {
  const button = event.target.closest("[data-cart-action]");
  if (!button) return;

  const index = Number(button.dataset.cartIndex);
  const item = checkoutState.cart[index];
  if (!item) return;

  if (button.dataset.cartAction === "increase") item.quantity = Number(item.quantity || 1) + 1;
  if (button.dataset.cartAction === "decrease") item.quantity = Math.max(1, Number(item.quantity || 1) - 1);
  if (button.dataset.cartAction === "remove") checkoutState.cart.splice(index, 1);

  saveCart();
  renderCheckout();
}

function renderSummary() {
  const subtotal = getSubtotal();
  const shippingFee = getShippingFee(subtotal);
  const discount = getDiscountAmount(subtotal, shippingFee);
  const availablePoints = getAvailablePoints();
  const pointDiscount = Math.min(checkoutState.usedPoints, subtotal + shippingFee - discount);
  const total = Math.max(subtotal + shippingFee - discount - pointDiscount, 0);

  setText(checkoutElements.subtotalValue, money(subtotal));
  setText(checkoutElements.discountValue, discount ? `- ${money(discount)}` : "0đ");
  // Điểm thưởng
  setText(checkoutElements.pointDiscountValue, pointDiscount ? `- ${money(pointDiscount)}` : "0đ");
  setText(checkoutElements.shippingValue, shippingFee ? money(shippingFee) : "Miễn phí");
  setText(checkoutElements.totalValue, money(total));
  setText(checkoutElements.availablePointText, availablePoints.toLocaleString("vi-VN"));
  setText(checkoutElements.pointMoneyText, `[- ${money(Math.floor(availablePoints / 1000) * 1000)}]`);
}

function getSubtotal() {
  return checkoutState.cart.reduce((sum, item) => sum + normalizePrice(item.price) * Number(item.quantity || 1), 0);
}

function getShippingFee(subtotal) {
  const checkedMethod = document.querySelector("[name='shippingMethod']:checked");
  const method = checkedMethod?.value || "standard";

  if (method === "standard") {
    // Tiêu chuẩn: Dưới 5.000.000đ -> 0đ | Trên 5.000.000đ -> 0.1% của tổng
    return subtotal <= 5000000 ? 0 : subtotal * 0.001;
  } else if (method === "express") {
    // Siêu tốc: Tính % theo từng mốc giá trị đơn hàng
    if (subtotal < 100000) {
      return subtotal * 0.2; // Dưới 100k -> 20%
    } else if (subtotal < 500000) {
      return subtotal * 0.1; // Dưới 500k -> 10%
    } else if (subtotal < 1000000) {
      return subtotal * 0.05; // Dưới 1 triệu -> 5%
    } else if (subtotal <= 5000000) {
      return subtotal * 0.004; // Từ 1 triệu đến 5 triệu -> 0.4%
    } else {
      return subtotal * 0.003; // Lớn hơn 5 triệu -> 0.3%
    }
  } else if (method === "pickup") {
    // Nhận tại cửa hàng: Luôn miễn phí
    return 0;
  }

  return 0;
}

function getDiscountAmount(subtotal, shippingFee) {
  const voucher = checkoutState.voucher;
  if (!voucher || subtotal <= 0) return 0;
  if (isVoucherExpired(voucher)) return 0;
  if (subtotal < Number(voucher.minOrder || 0)) return 0;
  if (voucher.type === "amount") {
    return Math.min(Number(voucher.value || 0), subtotal);
  }
  if (voucher.type === "percent") {
    return Math.min(Math.round(subtotal * Number(voucher.value || 0)), Number(voucher.max || subtotal));
  }
  if (voucher.type === "shipping") {
    return shippingFee;
  }
  return 0;
}

function showVoucherMessage(message, type) {
  if (!checkoutElements.voucherMessage) return;
  checkoutElements.voucherMessage.textContent = message;
  checkoutElements.voucherMessage.className = `voucher-message mb-0 ${type === "error" ? "text-danger" : "text-success"}`;
}

function updateCartCount() {
  const totalQuantity = checkoutState.cart.reduce((sum, item) => sum + Number(item.quantity || 0), 0);
  document.querySelectorAll("[data-cart-count]").forEach((badge) => {
    badge.textContent = totalQuantity;
  });
  // Sync cart badges across all pages
  if (typeof updateCartBadges === "function") {
    updateCartBadges();
  }
}

function togglePaymentFields() {
  const paymentMethod = document.querySelector("[name='paymentMethod']:checked")?.value || "cod";
  const showCardFields = paymentMethod === "card";
  checkoutElements.cardFields?.classList.toggle("d-none", !showCardFields);
}

function formatCardNumber(event) {
  const digits = event.target.value.replace(/\D/g, "").slice(0, 16);
  event.target.value = digits.replace(/(\d{4})(?=\d)/g, "$1 ");
}

function formatCardExpiry(event) {
  const digits = event.target.value.replace(/\D/g, "").slice(0, 4);
  event.target.value = digits.length > 2 ? `${digits.slice(0, 2)}/${digits.slice(2)}` : digits;
}

function submitOrder(event) {
  event.preventDefault();

  if (!checkoutState.cart.length) {
    showToast("Giỏ hàng đang trống.", "error");
    return;
  }

  // Yêu cầu phải chọn địa chỉ
  if (!checkoutElements.addressSelect.value) {
    showToast("Vui lòng chọn hoặc thêm địa chỉ nhận hàng.", "error");
    checkoutElements.addressSelect.focus();
    return;
  }

  if (!isPaymentValid()) {
    showToast("Vui lòng kiểm tra thông tin thẻ.", "error");
    return;
  }

  const totals = getOrderTotals();
  const order = buildOrder(totals);
  saveOrder(order);
  if (checkoutState.usedPoints > 0) useRewardPoint(checkoutState.usedPoints, order.code);
  markVoucherAsUsed();
  checkoutState.cart = [];
  saveCart();
  renderCheckout();
  checkoutElements.form.reset();
  checkoutElements.orderCode.textContent = order.code;
  showOrderSuccessModal();
}

function isPaymentValid() {
  const paymentMethod = document.querySelector("[name='paymentMethod']:checked")?.value || "cod";
  if (paymentMethod !== "card") return true;

  const cardNumber = checkoutElements.cardNumber?.value.replace(/\D/g, "") || "";
  const cardExpiry = checkoutElements.cardExpiry?.value || "";
  const cardCvv = checkoutElements.cardCvv?.value.replace(/\D/g, "") || "";

  if (cardNumber.length < 12) {
    checkoutElements.cardNumber?.focus();
    return false;
  }
  if (!/^\d{2}\/\d{2}$/.test(cardExpiry)) {
    checkoutElements.cardExpiry?.focus();
    return false;
  }
  if (cardCvv.length < 3) {
    checkoutElements.cardCvv?.focus();
    return false;
  }
  return true;
}

function getOrderTotals() {
  const subtotal = getSubtotal();
  const shippingFee = getShippingFee(subtotal);
  const discount = getDiscountAmount(subtotal, shippingFee);
  const pointDiscount = Math.min(checkoutState.usedPoints, subtotal + shippingFee - discount);
  return { subtotal, shippingFee, discount, pointDiscount, total: Math.max(subtotal + shippingFee - discount - pointDiscount, 0) };
}

function buildOrder(totals) {
  const formData = new FormData(checkoutElements.form);

  // Lấy chi tiết địa chỉ từ ID đã chọn
  const addressId = formData.get("customerAddressId");
  const addresses = JSON.parse(localStorage.getItem(getAddressStorageKey())) || [];
  const selectedAddress = addresses.find((a) => a.id === addressId) || {};

  return {
    code: createOrderCode(),
    createdAt: new Date().toISOString(),
    status: "completed", // Đã sửa thành completed (Hoàn tất) theo yêu cầu của bạn
    customer: {
      addressData: selectedAddress,
      note: formData.get("orderNote")
    },
    shippingMethod: formData.get("shippingMethod"),
    paymentMethod: formData.get("paymentMethod"),
    voucherCode: checkoutState.voucher?.code || "",
    items: checkoutState.cart,
    totals
  };
}

function createOrderCode() {
  const timestamp = Date.now().toString().slice(-6);
  const randomPart = Math.floor(Math.random() * 900 + 100);
  return `THT${timestamp}${randomPart}`;
}

function showOrderSuccessModal() {
  if (!window.bootstrap) {
    showToast("Đặt hàng thành công.");
    return;
  }
  const modalElement = document.getElementById("orderSuccessModal");
  const modal = bootstrap.Modal.getOrCreateInstance(modalElement);
  modal.show();
}

function normalizePrice(value) {
  let number = Number(String(value ?? 0).replace(/,/g, ""));
  if (!Number.isFinite(number)) number = 0;
  if (number > 0 && number < 10000) number *= 25000;
  return number;
}

function money(value) {
  return new Intl.NumberFormat("vi-VN").format(normalizePrice(value)) + " đ";
}

function setText(element, value) {
  if (element) element.textContent = value;
}

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function showToast(message, type = "success") {
  if (!checkoutElements.toast) return;
  const icon = type === "error" ? "bi-exclamation-circle-fill" : "bi-check-circle-fill";
  const toast = document.createElement("div");
  toast.className = `checkout-toast-message ${type} shadow-sm border`;
  toast.innerHTML = `<i class="bi ${icon}"></i><span>${escapeHtml(message)}</span>`;
  checkoutElements.toast.appendChild(toast);
  setTimeout(() => {
    toast.remove();
  }, 2800);
}

function getUsedVoucherKey() {
  return getScopedStorageKey("used_vouchers");
}

function markVoucherAsUsed() {
  if (!checkoutState.voucher) return;
  const usedVouchers = JSON.parse(localStorage.getItem(getUsedVoucherKey())) || [];
  if (!usedVouchers.includes(checkoutState.voucher.code)) {
    usedVouchers.push(checkoutState.voucher.code);
  }
  localStorage.setItem(getUsedVoucherKey(), JSON.stringify(usedVouchers));
}
