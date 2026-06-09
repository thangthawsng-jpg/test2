// ============================================
// CART PAGE SCRIPT - Đồng bộ với cart-manager.js
// ============================================

// Products in cart from localStorage
let cartItems = [];

// Initialize cart
document.addEventListener('DOMContentLoaded', function () {
  loadCartFromStorage();
  renderCart();
  setupEventListeners();
  updateCartBadges();
  listenToStorageChanges();
  checkLoginStatus();
});

// Load cart from localStorage (sử dụng cart-manager.js)
function loadCartFromStorage() {
  cartItems = readCartFromStorage() || [];
  
  // Đảm bảo tất cả sản phẩm có property selected
  cartItems = cartItems.map(item => ({
    ...item,
    selected: item.selected !== undefined ? item.selected : true // Mặc định là true
  }));
  
  // Cập nhật badge sau khi load
  updateCartBadges();
}

// Render cart items
function renderCart() {
  const listContainer = document.getElementById('cart-products-list');
  const emptyMessage = document.getElementById('empty-cart-message');

  renderCartBreadcrumb();

  if (cartItems.length === 0) {
    listContainer.innerHTML = '';
    emptyMessage.style.display = 'block';
    updateSummary();
    return;
  }

  emptyMessage.style.display = 'none';

  listContainer.innerHTML = cartItems.map((item, index) => `
    <div class="cart-product-item" data-index="${index}">
      <input type="checkbox" class="cart-product-checkbox" ${item.selected ? 'checked' : ''} />
      
      <img src="${item.image}" alt="${item.name}" class="product-image" />
      
      <div class="product-details">
        <div class="product-name">${item.name}</div>
        <div class="product-specs">
          <span>Màu: ${item.color || 'N/A'}</span>
          <span>Dung lượng: ${item.storage || 'N/A'}</span>
        </div>
        <div class="product-price">${formatPrice(item.price)}</div>
        <div class="product-quantity">
          <button class="qty-decrease" data-index="${index}">−</button>
          <input type="number" class="qty-input" value="${item.quantity}" min="1" data-index="${index}" />
          <button class="qty-increase" data-index="${index}">+</button>
        </div>
      </div>
      
      <i class="bi bi-trash product-delete" data-index="${index}"></i>
    </div>
  `).join('');

  attachItemEventListeners();
  updateSummary();
}

// Attach event listeners to cart items
function attachItemEventListeners() {
  // Checkbox change
  document.querySelectorAll('.cart-product-checkbox').forEach(checkbox => {
    checkbox.addEventListener('change', function () {
      const index = this.closest('.cart-product-item').dataset.index;
      cartItems[index].selected = this.checked;
      syncCartToStorage();
      updateSummary();
    });
  });

  // Quantity buttons
  document.querySelectorAll('.qty-decrease').forEach(btn => {
    btn.addEventListener('click', function () {
      const index = this.dataset.index;
      if (cartItems[index].quantity > 1) {
        cartItems[index].quantity--;
        syncCartToStorage();
        renderCart();
      }
    });
  });

  document.querySelectorAll('.qty-increase').forEach(btn => {
    btn.addEventListener('click', function () {
      const index = this.dataset.index;
      cartItems[index].quantity++;
      syncCartToStorage();
      renderCart();
    });
  });

  // Quantity input
  document.querySelectorAll('.qty-input').forEach(input => {
    input.addEventListener('change', function () {
      const index = this.dataset.index;
      let value = parseInt(this.value);
      if (isNaN(value) || value < 1) {
        value = 1;
      }
      cartItems[index].quantity = value;
      syncCartToStorage();
      renderCart();
    });
  });

  // Delete button
  document.querySelectorAll('.product-delete').forEach(btn => {
    btn.addEventListener('click', function () {
      const index = this.dataset.index;
      cartItems.splice(index, 1);
      syncCartToStorage();
      renderCart();
      updateCartBadges();
    });
  });
}

// Setup main event listeners
function setupEventListeners() {
  const purchaseBtn = document.getElementById('purchase-btn');
  const mobilePurchaseBtn = document.getElementById('mobile-purchase-btn');

  if (purchaseBtn) {
    purchaseBtn.addEventListener('click', proceedToCheckout);
  }

  if (mobilePurchaseBtn) {
    mobilePurchaseBtn.addEventListener('click', proceedToCheckout);
  }
}

// Update order summary
function updateSummary() {
  const selectedItems = cartItems.filter(item => item.selected);
  const total = calculateSubtotal(selectedItems);

  // Desktop summary
  document.getElementById('total-price').textContent = formatPrice(total);

  // Mobile summary
  document.getElementById('mobile-total').textContent = formatPrice(total);

  // Update purchase button
  const purchaseBtn = document.getElementById('purchase-btn');
  const mobilePurchaseBtn = document.getElementById('mobile-purchase-btn');
  const selectedCount = selectedItems.length;

  if (purchaseBtn) {
    purchaseBtn.textContent = `Mua hàng (${selectedCount})`;
    purchaseBtn.disabled = selectedCount === 0;
  }

  if (mobilePurchaseBtn) {
    mobilePurchaseBtn.textContent = `Mua hàng (${selectedCount})`;
    mobilePurchaseBtn.disabled = selectedCount === 0;
  }
}

// Calculate subtotal for selected items
function calculateSubtotal(items) {
  return items.reduce((total, item) => {
    const price = typeof item.price === 'string' ? parseFloat(item.price) : item.price;
    return total + (price * item.quantity);
  }, 0);
}

// Format price
function formatPrice(price) {
  const numPrice = typeof price === 'string' ? parseFloat(price) : price;
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(numPrice).replace('₫', 'đ');
}

// Proceed to checkout
function proceedToCheckout() {
  if (!sessionStorage.getItem("user_name")) {
    alert("Vui lòng đăng nhập để thực hiện chức năng này.");
    window.location.href = "./login.html";
    return;
  }

  const selectedItems = cartItems.filter(item => item.selected);

  if (selectedItems.length === 0) {
    alert('Vui lòng chọn ít nhất một sản phẩm');
    return;
  }

  // Cập nhật giỏ hàng với chỉ những sản phẩm được chọn
  cartItems = selectedItems;
  syncCartToStorage();

  // Redirect to checkout page
  sessionStorage.setItem('checkoutSource', 'cart');
  window.location.href = './checkout.html';
}

// Save cart to localStorage (sử dụng cart-manager.js)
function syncCartToStorage() {
  saveCartToStorage(cartItems);
  updateCartBadges(); // Từ cart-manager.js
}

// Listen to storage changes từ các tab khác
function listenToStorageChanges() {
  window.addEventListener('storage', (event) => {
    if (event.key === getCartKey()) {
      loadCartFromStorage();
      renderCart();
    }
  });
}

// Add item to cart (can be called from other pages)
window.addToCart = function (product) {
  const existingItem = cartItems.find(item => item.id === product.id);

  if (existingItem) {
    existingItem.quantity += product.quantity || 1;
  } else {
    cartItems.push({
      ...product,
      selected: false,
      quantity: product.quantity || 1
    });
  }

  syncCartToStorage();
  console.log('Product added to cart:', product);
};

// Remove item from cart (can be called from other pages)
window.removeFromCart = function (productId) {
  cartItems = cartItems.filter(item => item.id !== productId);
  syncCartToStorage();
  renderCart();
};

// Clear entire cart (can be called from other pages)
window.clearCart = function () {
  if (confirm('Bạn có chắc chắn muốn xóa tất cả sản phẩm trong giỏ?')) {
    cartItems = [];
    syncCartToStorage();
    renderCart();
  }
};

// Get cart items (can be called from other pages)
window.getCartItems = function () {
  return cartItems;
};

// Update cart from another page
window.updateCart = function (items) {
  cartItems = items;
  syncCartToStorage();
  if (window.location.pathname.includes('cart.html')) {
    renderCart();
  }
};

// Check login status and update header
function checkLoginStatus() {
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

// Build breadcrumb
function renderCartBreadcrumb() {
  const breadcrumb = document.getElementById("cartBreadcrumb");
  if (!breadcrumb) return;

  breadcrumb.innerHTML = `
    <li class="breadcrumb-item"><a href="./index.html" class="text-decoration-none text-secondary">Trang chủ</a></li>
    <li class="breadcrumb-item active text-primary fw-bold" aria-current="page">Giỏ hàng</li>
  `;
}
