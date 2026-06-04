document.addEventListener("DOMContentLoaded", () => {
  // 1. Logic ẩn/hiện mật khẩu bằng mắt icon
  const toggleButtons = document.querySelectorAll(".toggle-password");
  toggleButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const inputField = button.previousElementSibling;
      const icon = button.querySelector("i");
      if (inputField.type === "password") {
        inputField.type = "text";
        icon.className = "bi bi-eye-slash";
      } else {
        inputField.type = "password";
        icon.className = "bi bi-eye";
      }
    });
  });

  // 2. Xử lý sự kiện Đăng ký tài khoản thuần Front-end
  const registerForm = document.getElementById("registerForm");
  if (registerForm) {
    registerForm.addEventListener("submit", (e) => {
      e.preventDefault();

      const fullName = document.getElementById("fullName").value.trim();
      const email = document.getElementById("email").value.trim();
      const password = document.getElementById("password").value;
      const confirmPassword = document.getElementById("confirmPassword").value;

      // Kiểm tra mật khẩu nhập lại
      if (password !== confirmPassword) {
        showCustomAlert("Lỗi xác thực", "Mật khẩu nhập lại không trùng khớp.", "error");
        return;
      }

      // Đọc danh sách tài khoản an toàn từ bộ nhớ trình duyệt
      let customUsers = [];
      const storedData = localStorage.getItem("custom_users");

      if (storedData && storedData.trim() !== "") {
        try {
          customUsers = JSON.parse(storedData);
          if (!Array.isArray(customUsers)) {
            customUsers = [];
          }
        } catch (error) {
          customUsers = [];
        }
      }

      // KIỂM TRA TRÙNG LẶP: Chỉ đối chiếu trực tiếp với các tài khoản trong localStorage
      const isExist = customUsers.some((user) => user.account.toLowerCase() === email.toLowerCase());

      if (isExist) {
        showCustomAlert("Tài khoản tồn tại", "Email này đã được đăng ký trên hệ thống.", "error");
        return;
      }

      // Khởi tạo đối tượng thành viên mới
      const newUser = {
        account: email,
        password: password,
        name: fullName
      };

      // Đẩy thành viên vào mảng và lưu lại vào trình duyệt
      customUsers.push(newUser);
      localStorage.setItem("custom_users", JSON.stringify(customUsers));

      // Tặng vouvher cho thành viên mới
      const welcomeVoucher = [
        {
          code: "WELCOME50",
          type: "amount",
          value: 50000,
          message: "Giảm 50.000đ cho đơn hàng đầu tiên",
          source: "register",
          createdAt: new Date().toISOString()
        }
      ];

      localStorage.setItem(`user_vouchers_${email}`, JSON.stringify(welcomeVoucher));

      showCustomAlert("Đăng ký thành công", "Tài khoản lưu trữ thành công! Đang chuyển hướng...", "success");

      // Quay trở lại trang đăng nhập sau 1.5 giây
      setTimeout(() => {
        window.location.href = "./login.html";
      }, 1500);
    });
  }
});

// 3. Hàm khởi tạo thông báo Toast Alert góc phải màn hình
function showCustomAlert(title, message, type = "error") {
  let alertContainer = document.querySelector(".custom-toast-container");
  if (!alertContainer) {
    alertContainer = document.createElement("div");
    alertContainer.className = "custom-toast-container";
    document.body.appendChild(alertContainer);
  }

  const alertItem = document.createElement("div");
  alertItem.className = `custom-toast-item ${type}`;
  const iconClass = type === "success" ? "bi-check-circle-fill text-success" : "bi-exclamation-circle-fill text-danger";

  alertItem.innerHTML = `
    <i class="bi ${iconClass} toast-item-icon"></i>
    <div class="toast-item-content">
      <div class="toast-item-title">${title}</div>
      <div class="toast-item-msg">${message}</div>
    </div>
    <button type="button" class="toast-item-close"><i class="bi bi-x"></i></button>
  `;

  alertContainer.appendChild(alertItem);
  alertItem.querySelector(".toast-item-close").addEventListener("click", () => {
    dismissAlert(alertItem);
  });

  setTimeout(() => {
    dismissAlert(alertItem);
  }, 4000);
}

// 4. Hàm đóng thông báo kèm hiệu ứng mượt mà
function dismissAlert(alertItem) {
  if (!alertItem) return;
  alertItem.classList.add("leave"); // Thêm class kích hoạt hiệu ứng biến mất từ CSS
  alertItem.addEventListener("animationend", () => {
    alertItem.remove();
  });
}

/* ==========================================================================
   HỆ THỐNG HÀM BỔ SUNG: QUẢN LÝ & XÓA TÀI KHOẢN TRONG LOCALSTORAGE
   (Bạn có thể gọi trực tiếp các hàm này từ F12 Console để thao tác dữ liệu)
   ========================================================================== */

/**
 * CÁCH 1: Xóa tài khoản dựa trên số thứ tự hiển thị (Bắt đầu đếm từ 1)
 * Ví dụ muốn xóa tài khoản thứ 2: deleteUserByPosition(2);
 */
function deleteUserByPosition(position) {
  try {
    const customUsers = JSON.parse(localStorage.getItem("custom_users")) || [];

    if (customUsers.length === 0) {
      console.warn("Danh sách tài khoản trong localStorage đang trống.");
      return;
    }

    const indexToDelete = position - 1;

    if (indexToDelete >= 0 && indexToDelete < customUsers.length) {
      const deletedEmail = customUsers[indexToDelete].account;

      // Tiến hành cắt bỏ 1 phần tử tại vị trí chỉ định
      customUsers.splice(indexToDelete, 1);

      // Lưu mảng cập nhật mới lại vào localStorage
      localStorage.setItem("custom_users", JSON.stringify(customUsers));
      console.log(`✅ [HỆ THỐNG] Đã xóa thành công tài khoản hàng số ${position}: <${deletedEmail}>`);
    } else {
      console.error(`❌ Vị trí cần xóa không hợp lệ. Hiện tại hệ thống chỉ có ${customUsers.length} tài khoản.`);
    }
  } catch (error) {
    console.error("Lỗi trong quá trình xóa tài khoản theo vị trí:", error);
  }
}

/**
 * CÁCH 2 (KHUYÊN DÙNG): Xóa tài khoản dựa trực tiếp vào chính xác địa chỉ Email
 * Ví dụ muốn xóa tài khoản lethid: deleteUserByEmail("lethid@gmail.com");
 */
function deleteUserByEmail(email) {
  try {
    const targetEmail = email.trim().toLowerCase();
    let customUsers = JSON.parse(localStorage.getItem("custom_users")) || [];

    const isExist = customUsers.some((user) => user.account.toLowerCase() === targetEmail);

    if (isExist) {
      // Lọc bỏ tài khoản trùng với email truyền vào, giữ lại toàn bộ các tài khoản khác
      customUsers = customUsers.filter((user) => user.account.toLowerCase() !== targetEmail);

      localStorage.setItem("custom_users", JSON.stringify(customUsers));
      console.log(`✅ [HỆ THỐNG] Đã xóa thành công tài khoản có email: <${email}>`);
    } else {
      console.warn(`❌ Không tìm thấy tài khoản nào khớp với Email: <${email}> trong hệ thống.`);
    }
  } catch (error) {
    console.error("Lỗi trong quá trình xóa tài khoản theo Email:", error);
  }
}
