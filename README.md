# Tideline Terminal

Mô phỏng 3D một cảng container chạy trực tiếp trong trình duyệt, kèm giao diện điều hành cảng (TOS): quản lý bãi, hàng hoá, lịch tàu và cổng. Bến mô phỏng đặt đúng vị trí Cảng Sơn Trà (Thọ Quang, Đà Nẵng) và dải bờ xung quanh, từ cầu Mân Quang đến Cảng Tiên Sa, dựng theo bản đồ và ảnh vệ tinh. Toàn bộ dữ liệu khai thác là giả lập.

Viết bằng three.js r128 thuần, không framework, không bước cài đặt.

## Chạy

Mở `index.html` bằng trình duyệt. File này tự chứa mọi thứ, three.js nằm trong `vendor/` nên không cần mạng (chỉ phông chữ lấy từ Google Fonts; mất mạng thì dùng phông hệ thống).

## Cấu trúc

| Đường dẫn | Nội dung |
| --- | --- |
| `index.html` | Bản chạy độc lập, sinh ra từ `src/`. Không sửa trực tiếp. |
| `src/shell.html` | Tiêu đề, phông chữ, toàn bộ CSS và khung HTML của giao diện. |
| `src/world.js` | Cảnh 3D và mô phỏng trong cảng: mặt bãi, container, cẩu, tàu, xe, đường đi, cổng, người. Hằng số `SITE` (vị trí bến trên lưới bản đồ) cũng nằm ở đây. |
| `src/sky.js` | Thời gian trong ngày và thời tiết: bầu trời, mặt trời và trăng, mây, mưa, sương, đèn ban đêm. |
| `src/map.js` | Dữ liệu OpenStreetMap: đường bờ, đường sá, cầu tàu, ranh đất, tường quân cảng. |
| `src/sites.js` | Nhà xưởng, bồn, bãi container, tàu thuyền, cây cối đọc từ ảnh vệ tinh. File sinh ra từ `survey/`, không sửa trực tiếp. |
| `src/harbour.js` | Dựng dải bờ từ hai file dữ liệu trên; tàu lai và quy trình dắt tàu cập, rời cầu. |
| `src/ui.js` | Camera, chọn đối tượng, bảng thông tin, các phân hệ (Yard, Cargo, Vessels, Gate), vòng lặp khung hình. |
| `survey/*.txt` | Ghi chép khảo sát, mỗi file là một ô ảnh vệ tinh. |
| `survey/build.js` | Đổi ghi chép khảo sát thành `src/sites.js`. |
| `build.js` | Ghép `src/` thành hai bản dựng. |
| `dist/tideline-terminal.html` | Bản để xuất bản làm Claude artifact (nạp three.js từ cdnjs). |
| `vendor/three.min.js` | three.js r128, giấy phép MIT (`vendor/three.LICENSE`). |

Sáu file `.js` được ghép vào chung một hàm bao theo thứ tự `world`, `sky`, `map`, `sites`, `harbour`, `ui`, nên chúng dùng chung biến mà không cần import/export.

## Dựng lại sau khi sửa

```sh
node build.js            # ghép src/ thành index.html và dist/tideline-terminal.html
node survey/build.js     # chỉ cần khi sửa ghi chép trong survey/, chạy trước build.js
```

Cả hai chỉ cần Node, không có gói phụ thuộc. `build.js` kiểm tra cú pháp trước khi ghi.

## Điều khiển

- Kéo để di chuyển, cuộn để zoom, giữ Shift và kéo để xoay (kéo ngang) và nghiêng (kéo dọc). Nghiêng thấp xuống thì thấy đường chân trời và bầu trời.
- Bấm vào tàu, tàu lai, cẩu, xe hoặc container để xem chi tiết.
- Nút mặt trời trên thanh trên cùng: chọn Morning, Noon, Afternoon, Night và thời tiết Clear, Cloudy, Rain, Fog.
- Ô View có thêm các góc nhìn ra xung quanh: bến tàu lai, nhìn từ vịnh vào, dọc cầu tàu về phía tây (Tiên Sa), dọc cầu tàu về phía đông (Mân Quang), và cả dải bờ tới Tiên Sa. Zoom ra hết cỡ thì thấy được toàn bộ khu vực.
- `/` để tìm kiếm, `H` để ẩn/hiện mọi bảng, `Esc` để bỏ chọn hoặc đóng phân hệ.

## Bản đồ

Có hai hệ toạ độ, đều tính bằng mét.

**Lưới bản đồ** là hệ của `map.js` và `sites.js`: `+x` gần như hướng tây, `+z` gần như hướng bắc (lệch 10,2° so với bắc thật). Công thức đổi từ kinh vĩ độ ghi ở đầu `map.js`. Mọi thứ ngoài bến được dựng trong hệ này và treo dưới một nhóm duy nhất (`geo` trong `harbour.js`).

**Hệ của bến** là hệ mà mô phỏng chạy: gốc nằm trên mép cầu cảng, `x` chạy dọc cầu, `-z` là phía nước. `SITE` trong `world.js` cho biết bến nằm ở đâu trên lưới bản đồ; `toSim` và `toMap` đổi qua lại. Muốn dời bến chỉ cần sửa `SITE`.

| Hướng trong hệ của bến | Hướng thật | Có gì ở đó |
| --- | --- | --- |
| `+x` | Tây tây bắc | Vụng nhỏ có bến tàu lai, cầu tàu quân cảng, Cảng Tiên Sa, lối ra vịnh Đà Nẵng |
| `-x` | Đông đông nam | Hải đội 2 Biên phòng, nhà máy LPG, nhà máy nhựa đường, X50 và Sông Thu, cầu Mân Quang |
| `+z` | Bắc đông bắc | Kho của cảng, đường Yết Kiêu, sườn núi Sơn Trà |
| `-z` | Nam tây nam | Vũng Thùng, Nại Hiên Đông, âu thuyền Thọ Quang, cầu Thuận Phước |

### Cái gì đúng thực tế, cái gì không

Đúng theo OpenStreetMap (© những người đóng góp OpenStreetMap, giấy phép ODbL): đường bờ, toàn bộ đường sá với bề rộng theo cấp đường, hình dạng các cầu tàu, ranh đất cảng và quân cảng, tường quân cảng, cổng, đèn biển.

Đọc từ ảnh vệ tinh Esri World Imagery (© Esri, Maxar, Earthstar Geographics), từng ô 350 × 515 m ở độ phân giải khoảng 0,44 m mỗi điểm ảnh: vị trí, kích thước, hướng và màu mái của khoảng 250 nhà xưởng; bồn chứa và bồn cầu LPG; các lô container; hai bến container và các bãi của Tiên Sa (hàng container xếp đúng hướng và đúng bước hàng); cẩu bờ, cẩu cổng xưởng đóng tàu; tàu thuyền đang đậu, kể cả các bè tàu cá; mặt sân, sân bóng, cây cối. Cùng một mái nhà đọc trên hai ô chồng nhau thường lệch 1 đến 5 m, đó là sai số nên kỳ vọng.

Không theo thực tế:

- **Bên trong bến.** Cảng Sơn Trà thật là cảng tổng hợp với một cầu 200 m. Mô phỏng giữ bến container hai chỗ với bốn cẩu bờ, mép cầu dài 268 m, nên bến dài hơn cầu thật 19 m về phía tây và 49 m về phía đông. Gốc toạ độ dịch 15 m về phía đông so với giữa cầu thật để đường ra cổng không cắt qua kho của cảng.
- **Chiều cao.** Ảnh chụp thẳng đứng nên chiều cao nhà, bồn và số tầng container là ước lượng.
- **Nội dung thay đổi theo ngày.** Tàu thuyền, container và hàng trên bãi được đặt đúng chỗ ảnh cho thấy, nhưng từng chiếc, từng thùng là ngẫu nhiên.
- **Ngoài dải khảo sát.** Thọ Quang phía đông đường Yết Kiêu, Nại Hiên Đông, thành phố bên kia sông Hàn và sườn núi là khối dựng minh hoạ.

### Sửa hoặc khảo sát thêm

Mỗi file trong `survey/` là một ô ảnh. Dòng `@ cx cz mpp` cho biết tâm ô trên lưới bản đồ và tỷ lệ; các dòng sau là từng đối tượng, toạ độ tính bằng điểm ảnh của ô đó. Định dạng đầy đủ ghi ở đầu `survey/build.js`. Sửa xong chạy `node survey/build.js` rồi `node build.js`.

## Ghi chú

- Bầu trời chạy theo đồng hồ của cảng: ở tốc độ 1× cứ mười phút là qua một giờ. Chọn một buổi trong ngày sẽ đẩy đồng hồ tới giờ đó. Mặt trời mọc 05:40 ở phía đông, lặn 17:30 ở phía tây.
- Ban đêm cảng tự bật đèn: đèn pha bãi, đèn cẩu, cửa sổ, đèn xe, đèn hành trình của tàu. Đèn pha chỉ tồn tại khi trời tối để ban ngày không tốn hiệu năng, nên lúc chuyển sang tối có thể khựng một nhịp.
- Tàu lai: hai chiếc dài khoảng 20 m nằm ở cầu phao trong vụng phía tây cầu cảng, bên cạnh tàu hàng dài 115 m. Mỗi lúc chỉ một tàu được điều động trong vũng. Tàu vào từ vịnh, vòng qua mũi Tiên Sa, được một tàu lai kéo mũi và một tàu lai kèm hông, quay 180° ngoài cầu rồi được đẩy ép vào đệm; tàu rời cầu được hai tàu lai kéo ra bằng dây.
- Phao luồng theo hệ IALA A: phao đỏ bên trái, phao xanh bên phải khi tàu đi vào.
- Xe không đi xuyên qua nhau: mỗi xe quét đường phía trước để phanh khi có xe hoặc người, và phải đặt trước đoạn đường của mình qua mỗi giao lộ (phần "traffic control" trong `world.js`).
- Barie cổng (phần "gate barriers" trong `world.js`): xe dừng trước vạch, kiểm tra xong thì cần nâng lên và chỉ hạ xuống khi đuôi xe đã qua.
- Số ngẫu nhiên dùng hạt giống cố định (`seed` trong `world.js`, `hrand` trong `harbour.js`), nên mỗi lần mở trang bắt đầu từ cùng một trạng thái.
- Tên bến mô phỏng, tàu, tàu lai, hãng tàu và hãng xe trong phần khai thác đều là hư cấu. Tên địa danh trên bản đồ là thật.
