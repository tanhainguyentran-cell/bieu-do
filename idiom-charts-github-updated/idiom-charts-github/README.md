# Sáu biểu đồ thành ngữ tiếng Trung

## Đưa lên GitHub Pages

1. Giải nén bộ file và mở folder `idiom-charts-github`.
2. Tạo một repository **Public** trên GitHub.
3. Chọn **Add file → Upload files**. Tải toàn bộ nội dung bên trong folder lên thư mục gốc của repository, rồi commit. `index.html` cần nằm ngay ở thư mục gốc, cùng cấp với folder `assets` và `data`.
4. Vào **Settings → Pages**. Trong **Build and deployment**, chọn **Deploy from a branch**, nhánh **main** hoặc nhánh đang dùng, thư mục **/(root)**, rồi **Save**.
5. Chờ GitHub triển khai xong và mở đường dẫn được hiển thị trong Pages. Địa chỉ thường có dạng `https://TEN-TAI-KHOAN.github.io/TEN-REPOSITORY/`.

Không cần cài npm, thiết lập biến môi trường hoặc chạy bước build. Giữ nguyên tên file và cấu trúc folder. Bạn cũng có thể mở `index.html` trên máy để sử dụng.

Hướng dẫn GitHub: https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site

## Tải ảnh từ trang public

Trong phần **Ảnh tải về**, chọn một trong hai lựa chọn:

- **Có tiêu đề**: giữ tên hình “图1…” đến “图6…” bên dưới biểu đồ; tên hình luôn màu đen.
- **Không có tiêu đề**: ẩn dòng tên hình; giữ nguồn, chú thích thống kê, đơn vị và số liệu.

Sau đó chọn **Tải PNG**, **Tải SVG**, **6 PNG · ZIP** hoặc **6 SVG · ZIP**. Lựa chọn được áp dụng cho cả ảnh xem trước và ảnh tải về. Tên file có hậu tố `_co_tieu_de` hoặc `_khong_tieu_de` để dễ phân biệt. Hai chế độ giữ cùng kích thước ảnh theo khung đang chọn.

Ba nhóm 文化价值、话语功能、政治信息 dùng số lần, đơn vị 次. Ba nhóm còn lại dùng %. Dữ liệu cập nhật từ Kết quả.xlsx; nhóm nguồn gốc có 0%, 79%, 7%, 14%. Thứ tự: nguồn gốc, ngữ nghĩa, cơ chế tạo nghĩa, giá trị văn hóa, chức năng diễn ngôn, thông điệp chính trị. Tổng ba nhóm số lần lần lượt là 101, 212 và 166. Bản cập nhật dùng vùng lưu trình duyệt mới để số liệu cũ không ghi đè dữ liệu mới.

## Chỉnh dữ liệu

Chọn nhóm, mở thẻ **Dữ liệu** rồi sửa tần suất hoặc nhập CSV. Có thể tải bảng số liệu về máy. Nút **Khôi phục nhóm** lấy lại dữ liệu gốc. Trong thẻ **Nội dung**, bạn có thể chỉnh tên hình và nguồn cho từng nhóm.

Thay đổi trong giao diện được lưu riêng trên trình duyệt của người dùng. Để đổi dữ liệu mặc định của trang public cho mọi người, sửa `assets/data.js` rồi commit; cập nhật bản sao trong `data/data.json` và các CSV tương ứng nếu cần.

Font tiếng Trung được đặt sẵn trong bộ file. Lần mở đầu có thể mất vài giây để chuẩn bị font. Trang dùng các file trong folder, không cần CDN. Nếu xuất ảnh 3× gặp lỗi bộ nhớ, chọn 1×, 2× hoặc SVG.

Đã kiểm tra sáu nhóm với hai chế độ tiêu đề, ba màu và ba khung; kiểm tra logic tải ảnh và ZIP bằng chạy mã. Chưa kiểm tra tương tác trực tiếp bằng trình duyệt trong môi trường tạo file.

## Giấy phép

Giữ `LICENSE-Noto.txt` và `LICENSE-opentype.txt` khi phân phối. Mã ứng dụng được viết không có chú thích giải thích code. Noto Sans CJK SC dùng SIL Open Font License 1.1; OpenType.js dùng MIT.
