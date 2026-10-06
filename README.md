# Tideline Terminal

Mô phỏng 3D một cảng container chạy trực tiếp trong trình duyệt, kèm giao diện điều hành cảng (TOS): quản lý bãi, hàng hoá, lịch tàu và cổng. Toàn bộ dữ liệu là giả lập.

Viết bằng three.js r128 thuần, không framework, không bước cài đặt.

## Chạy

Mở `index.html` bằng trình duyệt. File này tự chứa mọi thứ, three.js nằm trong `vendor/` nên không cần mạng (chỉ phông chữ lấy từ Google Fonts; mất mạng thì dùng phông hệ thống).

## Cấu trúc

| Đường dẫn | Nội dung |
| --- | --- |
| `index.html` | Bản chạy độc lập, sinh ra từ `src/`. Không sửa trực tiếp. |
| `src/shell.html` | Tiêu đề, phông chữ, toàn bộ CSS và khung HTML của giao diện. |
| `src/world.js` | Cảnh 3D và mô phỏng: ánh sáng, mặt bãi, container, cẩu, tàu, xe, đường đi, lịch hẹn cổng. |
| `src/ui.js` | Camera, chọn đối tượng, bảng thông tin, các phân hệ (Yard, Cargo, Vessels, Gate), vòng lặp khung hình. |
| `build.js` | Ghép `src/` thành hai bản dựng. |
| `dist/tideline-terminal.html` | Bản để xuất bản làm Claude artifact (nạp three.js từ cdnjs). |
| `vendor/three.min.js` | three.js r128, giấy phép MIT (`vendor/three.LICENSE`). |

`world.js` và `ui.js` được ghép vào chung một hàm bao, theo đúng thứ tự đó, nên chúng dùng chung biến mà không cần import/export.

## Dựng lại sau khi sửa

```sh
node build.js
```

Lệnh này kiểm tra cú pháp rồi ghi lại `index.html` và `dist/tideline-terminal.html`. Chỉ cần Node, không có gói phụ thuộc.

## Điều khiển

- Kéo để di chuyển, cuộn để zoom, giữ Shift và kéo để xoay.
- Bấm vào tàu, cẩu, xe hoặc container để xem chi tiết.
- `/` để tìm kiếm, `H` để ẩn/hiện mọi bảng, `Esc` để bỏ chọn hoặc đóng phân hệ.
- Nút "–" trên mỗi bảng để thu gọn; nút bảng trên thanh trên cùng để bật/tắt từng cái.

## Ghi chú

- Số ngẫu nhiên dùng hạt giống cố định trong `world.js` (`seed`), nên mỗi lần mở trang bắt đầu từ cùng một trạng thái; sau đó diễn biến có thể lệch nhau theo tốc độ khung hình.
- Đơn vị trong cảnh là mét; container là loại 40 feet.
- Xe không đi xuyên qua nhau: mỗi xe quét đường phía trước để phanh khi có xe hoặc người, và phải đặt trước đoạn đường của mình qua mỗi giao lộ (phần "traffic control" trong `world.js`). Xe rảnh đỗ ở làn chờ trên cầu tàu, không chiếm làn làm hàng.
- Người điều phối (tín hiệu viên cầu tàu, nhân viên cổng, đốc công bãi) nằm ở phần "people" trong `world.js`.
- Tên cảng, tàu, hãng tàu và hãng xe đều là hư cấu.
