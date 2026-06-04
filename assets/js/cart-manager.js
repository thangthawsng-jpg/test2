/**
 * CART MANAGER - Quản lý giỏ hàng với localStorage
 * Đồng bộ dữ liệu giỏ hàng giữa tất cả các trang
 */

// Lấy key giỏ hàng hiện tại (theo tài khoản hoặc guest)
function getCartKey() {
  const userName = sessionStorage.getItem("user_name");
  if (userName) {
    const customUsers = JSON.parse(localStorage.getItem("custom_users")) || [];
    const user = customUsers.find((u) => u.name === userName);
    return user?.account ? `miniProjectCart_${user.account}` : `miniProjectCart_${userName}`;
  }
  return "miniProjectCart_guest";
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
    if (event.key === "user_name") {
      updateCartBadges();
    }
  });
}

// Chạy khi trang được load
document.addEventListener("DOMContentLoaded", initCartSync);
