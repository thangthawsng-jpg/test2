document.addEventListener("DOMContentLoaded", () => {
  // ==========================================
  // 1. KIỂM TRA TRẠNG THÁI ĐĂNG NHẬP
  // ==========================================
  const currentUser = getCurrentUserFromSession();
  const userName = currentUser?.name || sessionStorage.getItem("user_name");

  if (!currentUser) {
    window.location.href = "./login.html";
    return;
  }

  // ==========================================
  // 2. HIỂN THỊ THÔNG TIN NGƯỜI DÙNG
  // ==========================================
  const nameElement = document.getElementById("profileName");
  if (nameElement) nameElement.textContent = userName;

  const avatarImg = document.getElementById("profileAvatarImg");
  if (avatarImg && userName) {
    const firstLetter = userName.charAt(0).toUpperCase();
    avatarImg.src = `https://placehold.co/100x100/ffedd5/ff7a18?text=${firstLetter}`;
  }

  if (currentUser) {
    const emailElement = document.getElementById("profileEmail");
    if (emailElement) emailElement.textContent = currentUser.account;
  }

  // ==========================================
  // 3. XỬ LÝ SỰ KIỆN ĐĂNG XUẤT (MODAL CUSTOM)
  // ==========================================
  const logoutBtn = document.getElementById("logoutBtn");
  const logoutModal = document.getElementById("logoutModalOverlay");
  const cancelLogoutBtn = document.getElementById("cancelLogoutBtn");
  const closeModalIcon = document.getElementById("closeModalIcon");
  const confirmLogoutBtn = document.getElementById("confirmLogoutBtn");

  if (logoutBtn && logoutModal) {
    const closeModal = () => logoutModal.classList.remove("show");

    logoutBtn.addEventListener("click", (e) => {
      e.preventDefault();
      logoutModal.classList.add("show");
    });

    if (cancelLogoutBtn) cancelLogoutBtn.addEventListener("click", closeModal);
    if (closeModalIcon) closeModalIcon.addEventListener("click", closeModal);
    logoutModal.addEventListener("click", (e) => {
      if (e.target === logoutModal) closeModal();
    });

    if (confirmLogoutBtn) {
      confirmLogoutBtn.addEventListener("click", () => {
        sessionStorage.removeItem("user_name");
        sessionStorage.removeItem("user_email");
        window.location.href = "./index.html";
      });
    }
  }

  // ==========================================
  // 4. XỬ LÝ CHUYỂN TAB MENU CHÍNH VÀ HIỆU ỨNG CUỘN
  // ==========================================
  const navItems = document.querySelectorAll(".nav-item[data-target]");
  const tabPanes = document.querySelectorAll(".tab-pane");
  const triggerLinks = document.querySelectorAll(".nav-trigger");
  const contentScrollArea = document.querySelector(".content-scroll-area");

  function switchTab(targetId) {
    tabPanes.forEach((pane) => pane.classList.remove("active"));
    navItems.forEach((item) => item.classList.remove("active"));

    const targetPane = document.querySelector(targetId);
    if (targetPane) targetPane.classList.add("active");

    const targetNav = document.querySelector(`.nav-item[data-target="${targetId}"]`);
    if (targetNav) targetNav.classList.add("active");
  }

  function scrollToContent() {
    if (window.innerWidth < 992) {
      if (contentScrollArea) {
        contentScrollArea.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    } else {
      if (contentScrollArea) {
        contentScrollArea.scrollTo({ top: 0, behavior: "smooth" });
      }
    }
  }

  navItems.forEach((item) => {
    item.addEventListener("click", (e) => {
      e.preventDefault();
      const targetId = item.getAttribute("data-target");
      if (targetId) {
        switchTab(targetId);
        scrollToContent();
      }
    });
  });

  triggerLinks.forEach((link) => {
    link.addEventListener("click", (e) => {
      e.preventDefault();
      const targetId = link.getAttribute("data-trigger");
      const subTargetId = link.getAttribute("data-sub-target");

      if (targetId) {
        switchTab(targetId);

        if (subTargetId) {
          const subTabBtn = document.querySelector(`.fpt-tab-item[data-target-pane="${subTargetId}"]`);
          if (subTabBtn) subTabBtn.click();
        }

        scrollToContent();
      }
    });
  });

  // ==========================================
  // 5. XỬ LÝ CLICK CÁC TAB BÊN TRONG (ĐƠN HÀNG, LỊCH SỬ ĐIỂM...)
  // ==========================================
  const fptTabs = document.querySelectorAll(".fpt-tab-item");

  fptTabs.forEach((tab) => {
    tab.addEventListener("click", function (e) {
      e.preventDefault();

      const parentWrapper = this.closest(".fpt-tabs");
      if (parentWrapper) {
        parentWrapper.querySelectorAll(".fpt-tab-item").forEach((btn) => btn.classList.remove("active"));
        this.classList.add("active");

        const targetSelector = this.getAttribute("data-target-pane") || this.getAttribute("data-order-target");
        if (targetSelector) {
          const panesContainer = this.closest(".content-block").querySelector(".fpt-panes-container") || this.closest(".content-block").querySelector(".order-panes-container");
          if (panesContainer) {
            panesContainer.querySelectorAll(".fpt-pane, .order-pane").forEach((pane) => pane.classList.remove("active"));
            const targetPane = panesContainer.querySelector(targetSelector);
            if (targetPane) targetPane.classList.add("active");
          }
        }
      }
    });
  });
  // Điểm thưởng (mới thêm)
  const rewardList = document.getElementById("rewardList");
  const rewardTabs = document.querySelectorAll(".reward-tab");

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

  function renderAvailablePoints() {
    const pointNumber = document.querySelector(".points-card h3");
    if (pointNumber) {
      pointNumber.textContent = getAvailablePoints().toLocaleString("vi-VN");
    }
  }

  function saveRewardHistory(history) {
    localStorage.setItem(getRewardKey(), JSON.stringify(history));
  }

  function addRewardPoint(orderId, totalMoney) {
    const history = getRewardHistory();
    const point = Math.floor(totalMoney / 10000);
    history.unshift({
      id: Date.now(),
      type: "earn",
      title: "Tích điểm từ đơn hàng",
      description: `Đơn hàng #${orderId}`,
      point: point,
      date: new Date().toLocaleString("vi-VN")
    });
    saveRewardHistory(history);
  }

  function useRewardPoint(point, reason = "Sử dụng điểm thưởng") {
    const history = getRewardHistory();
    history.unshift({
      id: Date.now(),
      type: "used",
      title: reason,
      description: "Đã dùng để giảm giá đơn hàng",
      point: point,
      date: new Date().toLocaleString("vi-VN")
    });
    saveRewardHistory(history);
  }

  function renderRewardHistory(filter = "all") {
    const history = getRewardHistory();

    const filteredHistory = filter === "all" ? history : filter === "earn" ? history.filter((item) => item.type === "earn") : history.filter((item) => item.type === "used");

    const paneId = filter === "earn" ? "point-earned" : filter === "used" ? "point-used" : "point-all";

    const pane = document.getElementById(paneId);
    if (!pane) return;

    if (filteredHistory.length === 0) {
      pane.innerHTML = `
      <div class="empty-state py-5 border-0 bg-transparent text-center">
        <i class="bi ${filter === "used" ? "bi-dash-circle-dotted" : "bi-clock-history"} text-muted opacity-50" style="font-size: 4rem"></i>
        <h5 class="mt-3 text-dark fw-bold">
          ${filter === "used" ? "Chưa có lịch sử sử dụng điểm" : filter === "earn" ? "Chưa có lịch sử tích điểm" : "Chưa có lịch sử điểm"}
        </h5>
      </div>
    `;
      return;
    }

    pane.innerHTML = filteredHistory
      .map((item) => {
        const isEarn = item.type === "earn";

        return `
        <div class="reward-item">
          <div class="reward-info">
            <h4>${item.title}</h4>
            <p>${item.description}</p>
            <p>${item.date}</p>
          </div>

          <div class="reward-point ${isEarn ? "plus" : "minus"}">
            ${isEarn ? "+" : "-"}${Number(item.point || 0).toLocaleString("vi-VN")}
          </div>
        </div>
      `;
      })
      .join("");
  }
  document.querySelector('[data-target-pane="#point-all"]')?.addEventListener("click", () => renderRewardHistory("all"));
  document.querySelector('[data-target-pane="#point-earned"]')?.addEventListener("click", () => renderRewardHistory("earn"));
  document.querySelector('[data-target-pane="#point-used"]')?.addEventListener("click", () => renderRewardHistory("used"));
  // ==========================================
  // 6. LOAD THÔNG BÁO TỪ FILE JSON VÀ XEM THÊM
  // ==========================================
  const loadMoreNotifBtn = document.getElementById("loadMoreNotifBtn");
  const containerBtn = document.getElementById("loadMoreNotifContainer");

  async function fetchNotifications() {
    try {
      const response = await fetch("./assets/json/notifications.json");
      if (!response.ok) throw new Error("Không thể tải file JSON");
      const data = await response.json();

      const notifContainer = document.getElementById("notificationListContainer");
      if (notifContainer) {
        let htmlContent = "";
        data.forEach((item) => {
          const displayClass = item.isExtra ? "extra-notif d-none" : "";
          htmlContent += `
            <div class="notification-item ${displayClass} p-3 mb-3 border rounded d-flex align-items-start gap-3">
              <div class="notification-icon-wrap bg-${item.theme}-subtle text-${item.theme} rounded-circle">
                <i class="bi ${item.icon} fs-5"></i>
              </div>
              <div class="flex-grow-1">
                <div class="d-flex justify-content-between align-items-center mb-1">
                  <h6 class="fw-bold mb-0 text-dark">${item.title}</h6>
                  <span class="small text-muted">${item.time}</span>
                </div>
                <p class="mb-0 text-secondary small">${item.desc}</p>
              </div>
            </div>
          `;
        });
        notifContainer.innerHTML = htmlContent;
      }
    } catch (error) {
      console.error("Lỗi khi load thông báo:", error);
    }
  }

  fetchNotifications();
  fetchVouchers("unused");

  if (loadMoreNotifBtn) {
    loadMoreNotifBtn.addEventListener("click", (e) => {
      e.preventDefault();
      const extraNotifications = document.querySelectorAll(".notification-item.extra-notif");
      extraNotifications.forEach((notif) => {
        notif.classList.remove("d-none");
      });
      if (containerBtn) containerBtn.classList.add("d-none");
    });
  }

  async function fetchVouchers(status = "unused") {
    try {
      const response = await fetch("./assets/json/vouchers.json");
      if (!response.ok) throw new Error("Không thể tải file vouchers.json");

      const vouchers = await response.json();
      const usedVoucherCodes = JSON.parse(localStorage.getItem(getUsedVoucherKey())) || [];

      const voucherContainer = document.getElementById("voucherList");
      if (!voucherContainer) return;
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const filtered = vouchers.filter((voucher) => {
        const expireDate = new Date(voucher.expireDate);
        expireDate.setHours(23, 59, 59, 999);
        const expired = expireDate < today;
        const isUsed = usedVoucherCodes.includes(voucher.code);
        if (status === "expired") {
          return expired;
        }
        if (status === "used") {
          return isUsed;
        }
        return !expired && !isUsed;
      });

      if (!filtered.length) {
        voucherContainer.innerHTML = `
        <div class="text-center py-5">
          <i class="bi bi-box fs-1 text-secondary"></i>
          <h5 class="mt-3">Bạn chưa có voucher!</h5>
          <p class="text-muted">Hãy đổi điểm thành những voucher hấp dẫn tại THT Tech</p>
        </div>
      `;
        return;
      }

      voucherContainer.innerHTML = filtered
        .map((voucher) => {
          const expireDate = new Date(voucher.expireDate);
          expireDate.setHours(23, 59, 59, 999);

          const expired = expireDate < today;
          const realStatus = usedVoucherCodes.includes(voucher.code) ? "used" : "unused";
          return `
        <div class="voucher-card border rounded-4 p-3 mb-3 bg-white">
          <div class="d-flex justify-content-between gap-3">
            <div>
              <h5 class="fw-bold text-danger mb-1">${voucher.code}</h5>
              <div class="fw-semibold">${voucher.name}</div>
              <p class="text-secondary small mb-2">${voucher.message}</p>
              <small>Điều kiện: ${voucher.condition || "Không có"}</small><br>
              <small>Đơn tối thiểu: ${Number(voucher.minOrder || 0).toLocaleString("vi-VN")} đ</small><br>
              <small>Hạn sử dụng: ${new Date(voucher.expireDate).toLocaleDateString("vi-VN")}</small>
            </div>

            <span class="badge bg-danger align-self-start">
              ${expired ? "Hết hạn" : realStatus === "used" ? "Đã sử dụng" : "Chưa sử dụng"}
            </span>
          </div>
        </div>
      `;
        })
        .join("");
    } catch (error) {
      console.error("Lỗi khi load voucher:", error);
    }
  }

  // ==========================================
  // 7. XỬ LÝ CLICK CÁC NÚT LỌC VOUCHER
  // ==========================================
  const voucherFilterBtns = document.querySelectorAll(".voucher-filter-btn");

  voucherFilterBtns.forEach((btn) => {
    btn.addEventListener("click", function (e) {
      e.preventDefault();

      voucherFilterBtns.forEach((b) => b.classList.remove("active"));
      this.classList.add("active");

      const status = this.dataset.status;
      if (status) fetchVouchers(status);

      const targetSelector = this.getAttribute("data-target-pane");
      if (targetSelector) {
        const panesContainer = this.closest(".content-block").querySelector(".fpt-panes-container");
        if (panesContainer) {
          panesContainer.querySelectorAll(".fpt-pane").forEach((pane) => pane.classList.remove("active"));
          const targetPane = panesContainer.querySelector(targetSelector);
          if (targetPane) targetPane.classList.add("active");
        }
      }
    });
  });

  function getUsedVoucherKey() {
    return getScopedStorageKey("used_vouchers");
  }

  // ==========================================
  // 8. TỰ ĐỘNG CHUYỂN MẶC ĐỊNH SANG ĐƠN HÀNG (TẤT CẢ) Ở MOBILE
  // Hỗ trợ kiểm tra mượt mà cả khi tải trang lẫn khi thay đổi kích thước màn hình (F12)
  // ==========================================
  function checkResponsiveDefaultTab() {
    if (window.innerWidth < 992) {
      // Lấy pane con hiện tại đang hiển thị chính
      const activePane = document.querySelector(".tab-pane.active");

      // Nếu chưa có pane nào mở hoặc đang bị kẹt ở tab Tổng quan, cưỡng bức chuyển sang Đơn hàng
      if (!activePane || activePane.id === "tab-overview") {
        switchTab("#tab-orders");

        // Tự động kích hoạt bấm vào nút "Tất cả" của đơn hàng để bung dữ liệu con
        const allOrderBtn = document.querySelector('.fpt-tab-item[data-target-pane="#order-all"]');
        if (allOrderBtn) {
          allOrderBtn.click();
        }
      }
    }
  }

  // Khởi chạy ngay khi tải trang xong
  checkResponsiveDefaultTab();

  // Đăng ký sự kiện lắng nghe thay đổi kích thước màn hình để tự cập nhật giao diện không cần load lại trang
  let resizeTimer;
  window.addEventListener("resize", () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      checkResponsiveDefaultTab();
    }, 150); // Delay nhỏ để trình duyệt tính toán kích thước mượt mà hơn
  });

  // ==========================================
  // 9. LOGIC QUẢN LÝ SỔ ĐỊA CHỈ NHẬN HÀNG
  // ==========================================
  function getAddressStorageKey() {
    return getScopedStorageKey("tht_user_addresses");
  }

  const LOCAL_STORAGE_ADDR_KEY = getAddressStorageKey();

  const addressModalOverlay = document.getElementById("addressModalOverlay");
  const emptyAddAddressBtn = document.getElementById("emptyAddAddressBtn");
  const topAddAddressBtn = document.getElementById("topAddAddressBtn");
  const cancelAddressBtn = document.getElementById("cancelAddressBtn");
  const addressForm = document.getElementById("addressForm");

  const addressEmptyState = document.getElementById("addressEmptyState");
  const addressListContainer = document.getElementById("addressListContainer");
  const addressTypeBtns = document.querySelectorAll(".address-type-btn");

  let addresses = JSON.parse(localStorage.getItem(LOCAL_STORAGE_ADDR_KEY)) || [];

  // Mở modal
  function openAddressModal() {
    addressForm.reset();
    document.getElementById("addrDefault").checked = addresses.length === 0; // Tự động check mặc định nếu là địa chỉ đầu tiên
    addressModalOverlay.classList.add("show");
  }

  // Đóng modal
  function closeAddressModal() {
    addressModalOverlay.classList.remove("show");
  }

  if (emptyAddAddressBtn) emptyAddAddressBtn.addEventListener("click", openAddressModal);
  if (topAddAddressBtn) topAddAddressBtn.addEventListener("click", openAddressModal);
  if (cancelAddressBtn) cancelAddressBtn.addEventListener("click", closeAddressModal);

  // Đóng modal khi click ra ngoài nền tối
  if (addressModalOverlay) {
    addressModalOverlay.addEventListener("click", (e) => {
      if (e.target === addressModalOverlay) closeAddressModal();
    });
  }

  // Chọn loại địa chỉ (Nhà riêng / Văn phòng)
  addressTypeBtns.forEach((btn) => {
    btn.addEventListener("click", function () {
      addressTypeBtns.forEach((b) => b.classList.remove("active"));
      this.classList.add("active");
    });
  });

  // Render danh sách địa chỉ ra giao diện
  function renderAddresses() {
    if (addresses.length === 0) {
      addressEmptyState.classList.remove("d-none");
      addressListContainer.classList.add("d-none");
      topAddAddressBtn.classList.add("d-none");
      return;
    }

    addressEmptyState.classList.add("d-none");
    addressListContainer.classList.remove("d-none");
    topAddAddressBtn.classList.remove("d-none");

    // LUÔN ĐƯA ĐỊA CHỈ MẶC ĐỊNH LÊN ĐẦU TIÊN
    const sortedAddresses = [...addresses].sort((a, b) => (b.isDefault === true) - (a.isDefault === true));

    let html = "";
    sortedAddresses.forEach((addr, index) => {
      const defaultBadge = addr.isDefault ? `<span class="addr-badge badge-default ms-2">Mặc định</span>` : "";
      const typeBadge = `<span class="addr-badge badge-type ms-2">${addr.type}</span>`;

      // Nút "Thiết lập mặc định" chỉ hiển thị khi địa chỉ này chưa phải là mặc định
      const setAsDefaultBtn = !addr.isDefault ? `<button type="button" class="text-primary border-end pe-2 me-2 border-secondary-subtle" onclick="setDefaultAddress('${addr.id}')">Thiết lập mặc định</button>` : ``;

      html += `
        <div class="address-card ${addr.isDefault ? "is-default" : ""}">
          <div class="d-flex justify-content-between align-items-start mb-2">
            <div>
              <span class="addr-name">${addr.name}</span>
              <span class="addr-phone">${addr.phone}</span>
            </div>
            <div class="addr-actions">
              ${setAsDefaultBtn}
              <button type="button" class="text-danger" onclick="deleteAddress('${addr.id}')">Xóa</button>
            </div>
          </div>
          <div class="text-secondary small mb-2">
            ${addr.detail}<br>
            ${addr.region}
          </div>
          <div>
            ${defaultBadge}
            ${typeBadge}
          </div>
        </div>
      `;
    });

    addressListContainer.innerHTML = html;
  }

  // Xử lý khi Submit form thêm địa chỉ
  if (addressForm) {
    addressForm.addEventListener("submit", function (e) {
      e.preventDefault();

      const name = document.getElementById("addrName").value;
      const phone = document.getElementById("addrPhone").value;
      const region = document.getElementById("addrRegion").value;
      const detail = document.getElementById("addrDetail").value;
      const type = document.querySelector(".address-type-btn.active").getAttribute("data-type");
      const isDefault = document.getElementById("addrDefault").checked;

      const newAddress = {
        id: "addr_" + Date.now(), // Tạo ID ngẫu nhiên
        name,
        phone,
        region,
        detail,
        type,
        isDefault
      };

      // Nếu chọn làm mặc định, hủy mặc định của các địa chỉ cũ
      if (isDefault) {
        addresses.forEach((a) => (a.isDefault = false));
      }
      // Nếu là địa chỉ đầu tiên, ép buộc làm mặc định
      else if (addresses.length === 0) {
        newAddress.isDefault = true;
      }

      addresses.push(newAddress);

      // Lưu vào Local Storage
      localStorage.setItem(LOCAL_STORAGE_ADDR_KEY, JSON.stringify(addresses));

      renderAddresses();
      closeAddressModal();
    });
  }

  // Hàm Thiết lập địa chỉ mặc định mới (gắn vào window để gọi từ inline onclick)
  window.setDefaultAddress = function (id) {
    // Duyệt qua mảng, cái nào trùng ID thì cho thành true, còn lại là false
    addresses = addresses.map((addr) => {
      if (addr.id === id) {
        return { ...addr, isDefault: true };
      }
      return { ...addr, isDefault: false };
    });

    // Lưu lại thay đổi vào Local Storage
    localStorage.setItem(LOCAL_STORAGE_ADDR_KEY, JSON.stringify(addresses));

    // Gọi lại hàm render để cập nhật giao diện (Địa chỉ mới sẽ tự động nảy lên đầu)
    renderAddresses();
  };

  // Khởi chạy render lần đầu khi load trang
  renderAddresses();

  // ==========================================
  // LOGIC MODAL XÁC NHẬN XÓA ĐỊA CHỈ
  // ==========================================
  const deleteAddressModalOverlay = document.getElementById("deleteAddressModalOverlay");
  const closeDeleteModalIcon = document.getElementById("closeDeleteModalIcon");
  const cancelDeleteBtn = document.getElementById("cancelDeleteBtn");
  const confirmDeleteBtn = document.getElementById("confirmDeleteBtn");

  let addressIdToDelete = null; // Biến lưu tạm ID địa chỉ đang muốn xóa

  // Hàm đóng modal xóa
  function closeDeleteModal() {
    deleteAddressModalOverlay.classList.remove("show");
    addressIdToDelete = null;
  }

  // Gắn sự kiện đóng modal
  if (cancelDeleteBtn) cancelDeleteBtn.addEventListener("click", closeDeleteModal);
  if (closeDeleteModalIcon) closeDeleteModalIcon.addEventListener("click", closeDeleteModal);
  if (deleteAddressModalOverlay) {
    deleteAddressModalOverlay.addEventListener("click", (e) => {
      if (e.target === deleteAddressModalOverlay) closeDeleteModal();
    });
  }

  // Hàm mở modal khi bấm nút xóa ngoài danh sách
  window.deleteAddress = function (id) {
    addressIdToDelete = id; // Lưu lại ID
    deleteAddressModalOverlay.classList.add("show"); // Hiển thị form
  };

  // Xử lý xóa thật sự khi bấm nút "Xóa" bên trong form Modal
  if (confirmDeleteBtn) {
    confirmDeleteBtn.addEventListener("click", () => {
      if (addressIdToDelete) {
        // Lọc bỏ địa chỉ có ID trùng khớp
        addresses = addresses.filter((addr) => addr.id !== addressIdToDelete);

        // Nếu lỡ xóa địa chỉ mặc định, tự gán cái đầu tiên còn lại làm mặc định
        if (addresses.length > 0 && !addresses.some((a) => a.isDefault)) {
          addresses[0].isDefault = true;
        }

        // Lưu lại và cập nhật giao diện
        localStorage.setItem(LOCAL_STORAGE_ADDR_KEY, JSON.stringify(addresses));
        renderAddresses();
        closeDeleteModal(); // Đóng form
      }
    });
  }

  // ==========================================
  // 11. LOGIC RENDER ĐƠN HÀNG RA GIAO DIỆN PROFILE
  // ==========================================

  // Hàm định dạng tiền tệ
  function formatMoney(value) {
    let number = Number(String(value ?? 0).replace(/,/g, ""));
    if (!Number.isFinite(number)) number = 0;
    return new Intl.NumberFormat("vi-VN").format(number) + " đ";
  }

  // Hàm định dạng ngày tháng
  function formatDate(isoString) {
    const date = new Date(isoString);
    return date.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
  }

  // Lấy key chứa đơn hàng của user hiện tại (Đồng bộ với logic bên checkout)
  function getOrderStorageKey() {
    return getScopedStorageKey("miniProjectOrders");
  }

  // Hàm tạo mã HTML cho 1 thẻ đơn hàng
  // Hàm tạo mã HTML cho 1 thẻ đơn hàng
  function buildOrderCard(order) {
    // Tạo danh sách sản phẩm trong đơn
    const itemsHtml = order.items
      .map(
        (item) => `
      <div class="order-body">
        <img src="${item.image}" alt="${item.name}">
        <div class="order-details">
          <h6 class="mb-1 fw-bold text-dark">${item.name}</h6>
          <p class="text-muted small mb-1">Phân loại: ${item.color} / ${item.storage}</p>
          <p class="text-muted small mb-0 fw-semibold">x${item.quantity}</p>
        </div>
        <div class="order-price-wrap">
          <div class="current-price text-danger">${formatMoney(item.price)}</div>
        </div>
      </div>
    `
      )
      .join("");

    // Lấy ID của sản phẩm đầu tiên để trỏ link cho nút "Mua lại"
    const firstProductId = order.items && order.items.length > 0 ? order.items[0].id : "";
    const reorderLink = firstProductId ? `./product-detail.html?id=${firstProductId}` : `./index.html#featured`;

    return `
      <div class="order-card shadow-sm border mb-4 rounded-4">
        <div class="order-header bg-light d-flex justify-content-between align-items-center">
          <span class="text-secondary fw-bold"><i class="bi bi-receipt me-1"></i> Mã ĐH: ${order.code}</span>
          <span class="order-status text-success fw-bold"><i class="bi bi-check-circle-fill me-1"></i> Hoàn tất</span>
        </div>
        ${itemsHtml}
        <div class="order-footer bg-white border-bottom">
          <div class="text-secondary small">Ngày đặt: ${formatDate(order.createdAt)}</div>
          <div class="fs-5 text-dark">Thành tiền: <strong class="text-danger fs-4">${formatMoney(order.totals.total)}</strong></div>
        </div>
        <div class="order-footer bg-light justify-content-end gap-2">
          <button class="btn btn-outline-secondary px-4 py-2 rounded-3 fw-medium" type="button" onclick="viewOrderDetails('${order.code}')">Xem chi tiết</button>

          <a href="${reorderLink}" class="btn btn-danger-custom px-4 py-2 rounded-3 fw-medium" style="background-color: var(--ht-red)">Mua lại</a>
        </div>
      </div>
    `;
  }

  // Hàm mở và render dữ liệu vào Modal Chi Tiết Đơn Hàng
  window.viewOrderDetails = function (orderCode) {
    const orderKey = getOrderStorageKey();
    const orders = JSON.parse(localStorage.getItem(orderKey)) || [];
    const order = orders.find((o) => o.code === orderCode);

    if (!order) return;

    const contentDiv = document.getElementById("orderDetailContent");
    if (!contentDiv) return;

    const addr = order.customer?.addressData || {};

    // Render danh sách sản phẩm
    const itemsHtml = order.items
      .map(
        (item) => `
      <div class="d-flex align-items-center mb-3 border-bottom pb-3">
        <img src="${item.image}" alt="${item.name}" class="me-3 border rounded" style="width: 70px; height: 70px; object-fit: cover;">
        <div class="flex-grow-1">
          <h6 class="mb-1 fw-bold">${item.name}</h6>
          <p class="mb-1 small text-muted">Phân loại: ${item.color} / ${item.storage}</p>
          <p class="mb-0 small text-danger fw-semibold">${formatMoney(item.price)} <span class="text-muted ms-2">x${item.quantity}</span></p>
        </div>
      </div>
    `
      )
      .join("");

    // Ghép toàn bộ dữ liệu vào Modal
    contentDiv.innerHTML = `
      <div class="mb-4">
        <h6 class="fw-bold text-primary border-bottom pb-2 mb-3"><i class="bi bi-geo-alt"></i> Thông tin nhận hàng</h6>
        <p class="mb-1"><strong>Họ và tên:</strong> ${addr.name || "Không có"}</p>
        <p class="mb-1"><strong>Điện thoại:</strong> ${addr.phone || "Không có"}</p>
        <p class="mb-0"><strong>Địa chỉ:</strong> ${addr.detail || ""}, ${addr.region || ""}</p>
      </div>
      <div class="mb-4">
        <h6 class="fw-bold text-primary border-bottom pb-2 mb-3"><i class="bi bi-box-seam"></i> Thông tin sản phẩm</h6>
        ${itemsHtml}
      </div>
      <div class="d-flex justify-content-between align-items-center bg-light p-3 rounded border">
        <span class="fs-6 fw-bold text-dark">Tổng thanh toán:</span>
        <span class="fs-4 fw-bolder text-danger">${formatMoney(order.totals?.total || 0)}</span>
      </div>
    `;

    // Khởi tạo và hiển thị Modal bằng Bootstrap
    const modalEl = document.getElementById("orderDetailModal");
    const modal = bootstrap.Modal.getOrCreateInstance(modalEl);
    modal.show();
  };

  function isProfileVoucherExpired(voucher) {
    const today = new Date();
    const expireDate = new Date(voucher.expireDate);
    today.setHours(0, 0, 0, 0);
    expireDate.setHours(23, 59, 59, 999);
    return expireDate < today;
  }

  function profileFormatDate(dateString) {
    return new Date(dateString).toLocaleDateString("vi-VN");
  }

  function profileMoney(value) {
    return new Intl.NumberFormat("vi-VN").format(Number(value || 0)) + " đ";
  }

  // Hàm load và vẽ đơn hàng lên màn hình
  function loadAndRenderOrders() {
    const orderKey = getOrderStorageKey();
    const orders = JSON.parse(localStorage.getItem(orderKey)) || [];

    // --- 1. Vẽ cho Tab Tổng Quan (Đơn hàng gần đây) ---
    // Lấy vùng chứa của phần "Đơn hàng gần đây" (Section đầu tiên trong tab-overview)
    const overviewSection = document.querySelector("#tab-overview .content-block:nth-child(1)");
    if (overviewSection && orders.length > 0) {
      // Lấy 2 đơn hàng mới nhất
      const recentOrders = orders.slice(0, 2);
      let html = `
        <div class="section-header">
          <h3 class="section-title">Đơn hàng gần đây</h3>
          <a href="#" class="view-all-link nav-trigger" data-trigger="#tab-orders">Xem tất cả <i class="bi bi-chevron-right"></i></a>
        </div>
      `;
      recentOrders.forEach((order) => (html += buildOrderCard(order)));
      overviewSection.innerHTML = html;

      // Gắn lại sự kiện cho nút Xem tất cả vừa tạo
      overviewSection.querySelector(".nav-trigger").addEventListener("click", (e) => {
        e.preventDefault();
        document.querySelector('.nav-item[data-target="#tab-orders"]').click();
      });
    }

    // --- 2. Vẽ cho Tab Đơn hàng của tôi (Tất cả & Hoàn tất) ---
    const allOrderPane = document.getElementById("order-all");
    const completedOrderPane = document.getElementById("order-completed");

    if (orders.length > 0) {
      // Lọc các đơn hoàn tất (Do lúc nãy ta lưu status là completed hết nên mảng này giống nhau)
      const completedOrders = orders.filter((o) => o.status === "completed");
      const ordersHtml = orders.map((order) => buildOrderCard(order)).join("");
      const completedOrdersHtml = completedOrders.map((order) => buildOrderCard(order)).join("");

      if (allOrderPane) allOrderPane.innerHTML = ordersHtml;
      if (completedOrderPane) completedOrderPane.innerHTML = completedOrdersHtml;
    }
  }

  // Khởi chạy hàm khi load trang Profile
  renderAvailablePoints();
  renderRewardHistory("all");
  renderRewardHistory("earn");
  renderRewardHistory("used");
  fetchVouchers("unused");
  loadAndRenderOrders();
});
