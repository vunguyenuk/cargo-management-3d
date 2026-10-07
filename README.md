# Tideline Terminal

Mô phỏng 3D một cảng container chạy trực tiếp trong trình duyệt, kèm giao diện điều hành cảng (TOS): quản lý bãi, hàng hoá, lịch tàu và cổng. Có hai bến chạy cùng lúc: bến chính đặt đúng vị trí Cảng Sơn Trà (Thọ Quang, Đà Nẵng) và bến tây của Cảng Tiên Sa. Dải bờ xung quanh, từ cầu Mân Quang và cầu Thuận Phước đến Cảng Tiên Sa, dựng theo bản đồ và ảnh vệ tinh. Toàn bộ dữ liệu khai thác là giả lập.

Viết bằng three.js r128 thuần, không framework, không bước cài đặt.

## Chạy

Mở `index.html` bằng trình duyệt. File này tự chứa mọi thứ, three.js nằm trong `vendor/` nên không cần mạng (chỉ phông chữ lấy từ Google Fonts; mất mạng thì dùng phông hệ thống).

## Cấu trúc

| Đường dẫn | Nội dung |
| --- | --- |
| `index.html` | Bản chạy độc lập, sinh ra từ `src/`. Không sửa trực tiếp. |
| `src/shell.html` | Tiêu đề, phông chữ, toàn bộ CSS và khung HTML của giao diện. |
| `src/world.js` | Cảnh 3D và mô phỏng trong cảng: mặt bãi, container, cẩu, tàu, xe, đường đi, cổng, người. Toàn bộ bộ máy của một bến nằm trong hàm `Terminal(K)`; `K` mô tả mặt bằng, cầu tàu, cẩu, đội xe, cỡ tàu, đường ra vào. Bến chính là `TM = Terminal(MAINK())`. Hằng số `SITE` (vị trí bến chính trên lưới bản đồ), các cỡ tàu `VCLS` và đội tàu dùng chung `FLEET` cũng nằm ở đây. |
| `src/sky.js` | Thời gian trong ngày và thời tiết: bầu trời, mặt trời và trăng, mây, mưa, sương, đèn ban đêm. |
| `src/map.js` | Dữ liệu OpenStreetMap: đường bờ, đường sá, cầu tàu, ranh đất, tường quân cảng. |
| `src/sites.js` | Nhà xưởng, bồn, bãi container, tàu thuyền, cây cối đọc từ ảnh vệ tinh. File sinh ra từ `survey/`, không sửa trực tiếp. |
| `src/props.js` | Mô hình chi tiết của những thứ đứng quanh bến: cẩu bờ, cẩu khung bãi, cẩu di động, xe nâng, tàu quân sự, tàu hàng, tàu container, sà lan, tàu cá, ca nô, ụ nổi. Mỗi hàm dựng một mô hình trong hệ riêng của nó. |
| `src/harbour.js` | Dựng dải bờ từ hai file dữ liệu trên và đặt các mô hình của `props.js` vào đó; đường sá, vạch sơn và đèn đường; cầu Mân Quang và cầu Thuận Phước; luồng tàu cá; tàu lai và quy trình dắt tàu cập, rời cầu; sổ đăng ký tàu thuyền đang chạy để chúng tránh nhau (`HULLS`, `seaWay`); khung toạ độ của Tiên Sa (`TSF`). |
| `src/traffic.js` | Mọi thứ chuyển động bên ngoài hai bến: làn xe trên đường Yết Kiêu, Lê Đức Thọ, cầu Mân Quang và cầu Thuận Phước (`RD`), các ngã ba, xe con, đường xe container vào ra bến chính, đội tàu cá, tàu tuần tra, tàu hàng ven biển. |
| `src/tiensa.js` | Bến tây của Cảng Tiên Sa như một bến thứ hai (`TS = Terminal(K)`): đường xe container từ Yết Kiêu qua cổng cảng tới cổng bến, hai tàu lai của cảng và cách dắt tàu cập, rời cầu, vạch sơn, cổng, đèn. |
| `src/ui.js` | Camera, chọn đối tượng, bảng thông tin, các phân hệ (Yard, Cargo, Vessels, Gate), vòng lặp khung hình. |
| `survey/*.txt` | Ghi chép khảo sát, mỗi file là một ô ảnh vệ tinh. |
| `survey/build.js` | Đổi ghi chép khảo sát thành `src/sites.js`. |
| `build.js` | Ghép `src/` thành hai bản dựng. |
| `dist/tideline-terminal.html` | Bản để xuất bản làm Claude artifact (nạp three.js từ cdnjs). |
| `vendor/three.min.js` | three.js r128, giấy phép MIT (`vendor/three.LICENSE`). |

Chín file `.js` được ghép vào chung một hàm bao theo thứ tự `world`, `sky`, `map`, `sites`, `props`, `harbour`, `traffic`, `tiensa`, `ui`, nên chúng dùng chung biến mà không cần import/export.

## Dựng lại sau khi sửa

```sh
node build.js            # ghép src/ thành index.html và dist/tideline-terminal.html
node survey/build.js     # chỉ cần khi sửa ghi chép trong survey/, chạy trước build.js
```

Cả hai chỉ cần Node, không có gói phụ thuộc. `build.js` kiểm tra cú pháp trước khi ghi.

## Điều khiển

- Kéo để di chuyển, cuộn để zoom, giữ Shift và kéo để xoay (kéo ngang) và nghiêng (kéo dọc). Nghiêng thấp xuống thì thấy đường chân trời và bầu trời.
- Ô Terminal trên thanh trên cùng chuyển giữa Sơn Trà và Tiên Sa: camera bay tới bến đó, còn các chỉ số và các phân hệ Yard, Cargo, Gate hiển thị số liệu của bến đang chọn. Lịch tàu (Vessels) gộp cả ba cầu B1, B2 và TS1. Bấm vào một thiết bị của bến kia thì giao diện tự chuyển theo.
- Bấm vào tàu, tàu lai, cẩu, xe hoặc container để xem chi tiết. Xe con trên đường và tàu cá đang chạy cũng bấm được.
- Nút mặt trời trên thanh trên cùng: chọn Morning, Noon, Afternoon, Night và thời tiết Clear, Cloudy, Rain, Fog.
- Ô View có thêm các góc nhìn ra xung quanh: bến tàu lai, nhìn từ vịnh vào, dọc cầu tàu về phía tây (Tiên Sa), dọc cầu tàu về phía đông (Mân Quang), cả dải bờ tới Tiên Sa, Cảng Tiên Sa, bến tây của Tiên Sa, đường Yết Kiêu trước cổng, Vũng Thùng với đội tàu cá và cầu Mân Quang. Zoom ra hết cỡ thì thấy được toàn bộ khu vực.
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
- **Cảng Tiên Sa chỉ chạy bến tây.** Bến tây chạy bằng đúng bộ máy của bến chính: một cầu TS1 cho tàu tới 200 m, ba cẩu bờ làm hàng và một cẩu dự phòng, sáu khối bãi W1 đến W6 dưới cẩu khung, tám đầu kéo, 22 xe container ngoài, cổng riêng có barie, lịch tàu, lịch hẹn cổng và từng container được theo dõi. Mặt bằng (ba đường dọc, ba làn bãi, vị trí cổng) là dựng cho bộ máy đó chạy được trên nền cầu tàu thật, không theo sơ đồ khai thác thật của cảng. Bến đông nam, các cầu nhô và cẩu di động trên đó vẫn đứng yên; ở các cầu nhô chỉ có một tàu hàng ven biển rời cầu rồi quay về.
- **Cỡ tàu.** Bến chính nhận tàu feeder dài 117 m, rộng 19,6 m, khoảng 580 TEU, vừa với hai chỗ đậu trên mép cầu 268 m. Tiên Sa nhận thêm tàu dài 200 m, rộng 31,6 m, khoảng 2.500 TEU. Đây là hai cỡ tàu điển hình dựng theo tỷ lệ thật; tên tàu và các số liệu khác trên thẻ tàu là giả lập, không phải của một con tàu có thật.
- **Giao thông.** Mỗi chiều đường chỉ có một hàng xe, kể cả trên những đoạn thật có hai làn. Số xe, tàu cá và lịch chạy là dựng cho cảnh sống động chứ không theo số đếm thực tế. Đường Yết Kiêu được vẽ nối dài một đoạn về phía đông nam qua ngã ba Lê Đức Thọ để xe container có chỗ đi tới và đi khỏi; đoạn đó và chỗ hai làn đường Lê Đức Thọ vòng vào ngã ba là dựng thêm. Ở mép các ngã ba, chỗ làn xe cắt góc giữa hai đường được trải nhựa thêm cho khớp với đường xe chạy. Đê chắn sóng cạnh cầu Thuận Phước được vẽ hẹp hơn bề rộng đọc từ ảnh.
- **Cầu Thuận Phước.** Tuyến, vị trí hai trụ tháp và chiều dài theo bản đồ; mặt cầu là một dải liền từ Nại Hiên Đông sang bờ thành phố, xe con chạy qua được. Độ cao, dạng tháp, cáp và trụ dẫn là dựng cho hợp lý.
- **Cầu Mân Quang.** Vị trí hai mố, chiều dài và bề rộng theo bản đồ và ảnh; số nhịp, độ vồng, dạng trụ và lan can là dựng cho hợp lý chứ không theo bản vẽ. Dải đất phía tây cầu (doi cát và đường dẫn) vẽ theo ảnh vì đường bờ của OpenStreetMap bỏ sót.
- **Ngoài dải khảo sát.** Thọ Quang phía đông đường Yết Kiêu, Nại Hiên Đông, thành phố bên kia sông Hàn và sườn núi là khối dựng minh hoạ.

### Sửa hoặc khảo sát thêm

Mỗi file trong `survey/` là một ô ảnh. Dòng `@ cx cz mpp` cho biết tâm ô trên lưới bản đồ và tỷ lệ; các dòng sau là từng đối tượng, toạ độ tính bằng điểm ảnh của ô đó. Định dạng đầy đủ ghi ở đầu `survey/build.js`. Sửa xong chạy `node survey/build.js` rồi `node build.js`.

## Ghi chú

- Bầu trời chạy theo đồng hồ của cảng: ở tốc độ 1× cứ mười phút là qua một giờ. Chọn một buổi trong ngày sẽ đẩy đồng hồ tới giờ đó. Mặt trời mọc 05:40 ở phía đông, lặn 17:30 ở phía tây.
- Ban đêm mọi chỗ có đèn đều sáng: cột đèn cao ở cả hai bến, đèn cẩu, cửa sổ, đèn xe, đèn hành trình của tàu, đèn đường trên Yết Kiêu, Lê Đức Thọ và hai cây cầu (mỗi cột có một vệt sáng dưới chân). Chỉ có sáu đèn pha thật, chúng tự dời tới các cột đèn gần chỗ camera đang nhìn nhất; các cột còn lại sáng bằng vệt sáng vẽ trên mặt đất. Đèn pha chỉ tồn tại khi trời tối để ban ngày không tốn hiệu năng, nên lúc chuyển sang tối có thể khựng một nhịp.
- Tàu lai: hai chiếc dài khoảng 20 m nằm ở cầu phao trong vụng phía tây cầu cảng, bên cạnh tàu hàng dài 115 m. Mỗi lúc chỉ một tàu được điều động trong vũng của bến chính. Tiên Sa có hai tàu lai riêng nằm trong âu cạnh bến tây và điều động tàu của mình độc lập. Trong mỗi cặp, tàu lai thứ hai nhường tàu thứ nhất khi ra khỏi bến và khi chạy tự do. Tàu vào từ vịnh, vòng qua mũi Tiên Sa, được một tàu lai kéo mũi và một tàu lai kèm hông, quay 180° ngoài cầu rồi được đẩy ép vào đệm; tàu rời cầu được hai tàu lai kéo ra bằng dây.
- Phao luồng theo hệ IALA A: phao đỏ bên trái, phao xanh bên phải khi tàu đi vào.
- Xe không đi xuyên qua nhau: mỗi xe quét đường phía trước để phanh khi có xe hoặc người, và phải đặt trước đoạn đường của mình qua mỗi giao lộ (phần "traffic control" trong `world.js`). Người ra hiệu sau cẩu bờ chỉ băng qua đường dọc khi đường trống, và xe dừng chờ khi họ đang băng.
- Barie cổng (phần "gate barriers" trong `world.js`): xe dừng trước vạch, kiểm tra xong thì cần nâng lên và chỉ hạ xuống khi đuôi xe đã qua.
- Mọi thứ đứng yên ngoài bến được gộp theo vật liệu thành vài lưới lớn, nên vài trăm tàu cá chỉ tốn một ít lệnh vẽ. Tàu cá ở xa bến dùng bản dựng nhẹ hơn. Nét viền của tàu thuyền và nhà xưởng đứng yên gộp chung thành một lưới đường; nét viền của xe con và tàu nhỏ đang chạy tự ẩn khi ở xa hơn 650 m.
- Đường ngoài cảng (`RD` trong `traffic.js`): mỗi làn xe là một đường lệch sang phải so với đúng tim đường đã vẽ (`sw`), các đoạn nối với nhau bằng một cung lượn ở chỗ rẽ (`chain`), nên xe luôn nằm trên mặt nhựa; chỗ nào làn xe cắt góc ngã ba thì `pave` trải nhựa thêm. 54 xe con chạy giữa bờ thành phố bên kia cầu Thuận Phước, cầu Mân Quang và đường ven biển ở Tiên Sa. Xe container của cả hai bến đi lên Yết Kiêu từ phía đông nam: xe của bến chính rẽ trái qua chỗ hở dải phân cách vào đường cổng, lúc về rẽ phải; xe của Tiên Sa chạy tiếp tới ngã ba Tiên Sa, dừng kiểm tra ở cổng cảng, theo đường nội bộ tới cổng bến tây rồi về theo làn bên kia và dừng ở cổng cảng lần nữa. Cổng cảng là một mái che bắc ngang cả đường vào lẫn đường ra, hai chốt nằm trên đảo giữa hai đường; vị trí theo bản đồ, hình dáng là dựng cho hợp lý. Ở ngã ba Lê Đức Thọ, xe container đi thẳng hai chiều được qua cùng lúc, xe con từ cầu rẽ vào thì phải chờ đường trống. Ở ngã ba Tiên Sa, xe vào cảng và xe ra cảng không cắt nhau nên qua cùng lúc; xe con từ đường ven biển quay về cắt cả hai dòng nên phải chờ cả hai.
- Trên nước: 20 tàu cá chạy thành vòng hai chiều giữa âu thuyền Thọ Quang và cửa vịnh (`FAIRWAY` trong `harbour.js`, tàu cá đậu không được đặt vào luồng này); tàu tuần tra biên phòng và một tàu hàng ven biển rời cầu rồi quay về theo lịch riêng. Tàu thuyền đậu không chiếc nào nằm đè lên chiếc khác (kiểm tra bằng hai hình chữ nhật thân tàu, `clear`). Mọi tàu đang chạy đăng ký vào `HULLS`; mỗi chiếc nhìn hành lang phía trước và điểm tiếp cận gần nhất với các chiếc khác rồi giảm ga hoặc dừng (`seaWay`): tàu cá nhường tàu nhỏ, tàu nhỏ nhường tàu lai, tất cả nhường tàu container. Tàu chỉ giảm tốc trên tuyến của mình chứ không bẻ lái vòng tránh.
- Số ngẫu nhiên dùng hạt giống cố định (`seed` trong `world.js`, `hrand` trong `harbour.js`), nên mỗi lần mở trang bắt đầu từ cùng một trạng thái.
- Tên bến mô phỏng, tàu, tàu lai, hãng tàu và hãng xe trong phần khai thác đều là hư cấu. Tên địa danh trên bản đồ là thật.
