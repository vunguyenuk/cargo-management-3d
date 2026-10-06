# Tideline Terminal

Mô phỏng 3D một cảng container chạy trực tiếp trong trình duyệt, kèm giao diện điều hành cảng (TOS): quản lý bãi, hàng hoá, lịch tàu và cổng. Mặt bằng và khu vực xung quanh dựng theo Cảng Sơn Trà (Thọ Quang, Đà Nẵng). Toàn bộ dữ liệu khai thác là giả lập.

Viết bằng three.js r128 thuần, không framework, không bước cài đặt.

## Chạy

Mở `index.html` bằng trình duyệt. File này tự chứa mọi thứ, three.js nằm trong `vendor/` nên không cần mạng (chỉ phông chữ lấy từ Google Fonts; mất mạng thì dùng phông hệ thống).

## Cấu trúc

| Đường dẫn | Nội dung |
| --- | --- |
| `index.html` | Bản chạy độc lập, sinh ra từ `src/`. Không sửa trực tiếp. |
| `src/shell.html` | Tiêu đề, phông chữ, toàn bộ CSS và khung HTML của giao diện. |
| `src/world.js` | Cảnh 3D và mô phỏng trong cảng: mặt bãi, container, cẩu, tàu, xe, đường đi, cổng, người. |
| `src/sky.js` | Thời gian trong ngày và thời tiết: bầu trời, mặt trời và trăng, mây, mưa, sương, đèn ban đêm. |
| `src/harbour.js` | Địa hình theo Cảng Sơn Trà và khu vực xung quanh; tàu lai và quy trình dắt tàu cập, rời cầu. |
| `src/ui.js` | Camera, chọn đối tượng, bảng thông tin, các phân hệ (Yard, Cargo, Vessels, Gate), vòng lặp khung hình. |
| `build.js` | Ghép `src/` thành hai bản dựng. |
| `dist/tideline-terminal.html` | Bản để xuất bản làm Claude artifact (nạp three.js từ cdnjs). |
| `vendor/three.min.js` | three.js r128, giấy phép MIT (`vendor/three.LICENSE`). |

Bốn file `.js` được ghép vào chung một hàm bao theo thứ tự `world`, `sky`, `harbour`, `ui`, nên chúng dùng chung biến mà không cần import/export.

## Dựng lại sau khi sửa

```sh
node build.js
```

Lệnh này kiểm tra cú pháp rồi ghi lại `index.html` và `dist/tideline-terminal.html`. Chỉ cần Node, không có gói phụ thuộc.

## Điều khiển

- Kéo để di chuyển, cuộn để zoom, giữ Shift và kéo để xoay (kéo ngang) và nghiêng (kéo dọc). Nghiêng thấp xuống thì thấy đường chân trời và bầu trời.
- Bấm vào tàu, tàu lai, cẩu, xe hoặc container để xem chi tiết.
- Nút mặt trời trên thanh trên cùng: chọn Morning, Noon, Afternoon, Night và thời tiết Clear, Cloudy, Rain, Fog.
- Ô View có thêm các góc nhìn: bến tàu lai, nhìn từ vịnh vào, nhìn dọc cầu tàu về phía tây.
- `/` để tìm kiếm, `H` để ẩn/hiện mọi bảng, `Esc` để bỏ chọn hoặc đóng phân hệ.

## Bản đồ

Đơn vị trong cảnh là mét, đã xoay để cầu tàu chạy dọc trục x:

| Hướng trong cảnh | Hướng thật | Có gì ở đó |
| --- | --- | --- |
| `+x` | Tây | Quân cảng, Cảng Tiên Sa, lối ra vịnh Đà Nẵng |
| `-x` | Đông | Bến tàu lai, nhà máy X50 và Sông Thu, Thọ Quang |
| `+z` | Bắc | Đường Yết Kiêu, sườn núi Sơn Trà |
| `-z` | Nam | Vũng Thùng, âu thuyền Thọ Quang, cầu Mân Quang, Nại Hiên Đông, cầu Thuận Phước |

Đường bờ, đường Yết Kiêu và vị trí các công trình lân cận lấy từ OpenStreetMap (© những người đóng góp OpenStreetMap, giấy phép ODbL), nằm trong các mảng `COAST`, `ROAD`, `CITY` ở đầu `harbour.js`. Cầu tàu đặt đúng vị trí cầu cảng thật.

Phần khai thác bên trong không theo thực tế: Cảng Sơn Trà thật là cảng tổng hợp với một cầu 200 m, còn mô phỏng giữ bến container hai chỗ với bốn cẩu bờ. Công trình xung quanh là khối dựng theo vị trí, không theo hình dáng thật.

## Ghi chú

- Bầu trời chạy theo đồng hồ của cảng: ở tốc độ 1× cứ mười phút là qua một giờ. Chọn một buổi trong ngày sẽ đẩy đồng hồ tới giờ đó. Mặt trời mọc 05:40 ở phía đông, lặn 17:30 ở phía tây.
- Ban đêm cảng tự bật đèn: đèn pha bãi, đèn cẩu, cửa sổ, đèn xe, đèn hành trình của tàu. Đèn pha chỉ tồn tại khi trời tối để ban ngày không tốn hiệu năng, nên lúc chuyển sang tối có thể khựng một nhịp.
- Tàu lai: hai chiếc nằm ở cầu phao phía đông. Mỗi lúc chỉ một tàu được điều động trong vũng. Tàu vào được một tàu lai kéo mũi và một tàu lai kèm hông, quay 180° ngoài cầu rồi được đẩy ép vào đệm; tàu rời cầu được hai tàu lai kéo ra bằng dây.
- Xe không đi xuyên qua nhau: mỗi xe quét đường phía trước để phanh khi có xe hoặc người, và phải đặt trước đoạn đường của mình qua mỗi giao lộ (phần "traffic control" trong `world.js`).
- Barie cổng (phần "gate barriers" trong `world.js`): xe dừng trước vạch, kiểm tra xong thì cần nâng lên và chỉ hạ xuống khi đuôi xe đã qua.
- Số ngẫu nhiên dùng hạt giống cố định (`seed` trong `world.js`, `hrand` trong `harbour.js`), nên mỗi lần mở trang bắt đầu từ cùng một trạng thái.
- Tên cảng, tàu, tàu lai, hãng tàu và hãng xe trong phần khai thác đều là hư cấu. Tên địa danh trên bản đồ là thật.
