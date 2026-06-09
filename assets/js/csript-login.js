document.addEventListener("DOMContentLoaded", () => {
  const loginForm = document.getElementById("loginForm");

  if (loginForm) {
    loginForm.addEventListener("submit", (e) => {
      e.preventDefault();

      const emailInput = document.getElementById("email").value.trim().toLowerCase();
      const passwordInput = document.getElementById("password").value;

      try {
        const customUsers = JSON.parse(localStorage.getItem("custom_users")) || [];

        const matchedUser = customUsers.find((user) => user.account.toLowerCase() === emailInput && user.password === passwordInput);

        if (matchedUser) {
          sessionStorage.setItem("user_name", matchedUser.name || matchedUser.account);
          sessionStorage.setItem("user_email", matchedUser.account.toLowerCase());

          showCustomAlert("Đăng nhập thành công", "Hệ thống đang chuyển hướng bạn về trang chủ...", "success");

          setTimeout(() => {
            window.location.href = "./index.html";
          }, 1500);
        } else {
          showCustomAlert("Đăng nhập thất bại", "Tài khoản hoặc mật khẩu không chính xác.", "error");
        }
      } catch (error) {
        console.error("Lỗi xác thực hệ thống:", error);
        showCustomAlert("Lỗi hệ thống", "Không thể xử lý dữ liệu đăng nhập lúc này.", "error");
      }
    });
  }
});

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
    alertItem.remove();
  });
  setTimeout(() => {
    alertItem.remove();
  }, 4000);
}
