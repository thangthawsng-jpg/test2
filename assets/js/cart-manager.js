/**
 * CART MANAGER - Quản lý giỏ hàng với localStorage
 * Đồng bộ dữ liệu giỏ hàng giữa tất cả các trang
 */

// Lấy key giỏ hàng hiện tại (theo tài khoản hoặc guest)
function normalizeAccount(account) {
  return String(account || "").trim().toLowerCase();
}

function readLocalStorageJson(key, fallback = null) {
  try {
    const value = JSON.parse(localStorage.getItem(key));
    return value ?? fallback;
  } catch {
    return fallback;
  }
}

function getCurrentUserFromSession() {
  const userEmail = normalizeAccount(sessionStorage.getItem("user_email"));
  const userName = sessionStorage.getItem("user_name");
  const storedUsers = readLocalStorageJson("custom_users", []);
  const customUsers = Array.isArray(storedUsers) ? storedUsers : [];

  if (userEmail) {
    const user = customUsers.find((item) => normalizeAccount(item.account) === userEmail);
    return user || { account: userEmail, name: userName || userEmail };
  }

  if (userName) {
    const user = customUsers.find((item) => item.name === userName);
    return user || { account: userName, name: userName };
  }

  return null;
}

function getScopedStorageKey(baseKey) {
  const user = getCurrentUserFromSession();
  const account = normalizeAccount(user?.account);
  return account ? `${baseKey}_${account}` : `${baseKey}_guest`;
}

function getCartKey() {
  return getScopedStorageKey("miniProjectCart");
}

// Đọc giỏ hàng từ localStorage
function readCartFromStorage() {
  try {
    return JSON.parse(localStorage.getItem(getCartKey())) || [];
  } catch {
    return [];
  }
}

// Lưu giỏ hàng vào localStorage
function saveCartToStorage(cart) {
  localStorage.setItem(getCartKey(), JSON.stringify(cart));
}

// Tính tổng số lượng sản phẩm trong giỏ
function calculateCartCount() {
  const cart = readCartFromStorage();
  return cart.reduce((sum, item) => sum + Number(item.quantity || 0), 0);
}

// Cập nhật badge giỏ hàng trên tất cả trang
function updateCartBadges() {
  const count = calculateCartCount();
  document.querySelectorAll("[data-cart-count]").forEach((badge) => {
    badge.textContent = count;
  });
}

// Đồng bộ giỏ hàng khi trang được load
function initCartSync() {
  updateCartBadges();

  // Lắng nghe thay đổi localStorage từ các tab khác
  window.addEventListener("storage", (event) => {
    if (event.key === getCartKey()) {
      updateCartBadges();
    }
  });

  // Lắng nghe thay đổi tài khoản
  window.addEventListener("storage", (event) => {
    if (event.key === "user_name" || event.key === "user_email") {
      updateCartBadges();
    }
  });
}

// Chạy khi trang được load
document.addEventListener("DOMContentLoaded", initCartSync);
