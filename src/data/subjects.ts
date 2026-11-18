import type { SubjectId, SubjectInfo } from '../types';

export const SUBJECTS: SubjectInfo[] = [
  {
    id: 'toan',
    name: 'Toán',
    shortDescription: 'Đại số, Hình học, Số học và Thống kê cấp THCS',
    starterPrompts: [
      'Giải từng bước phương trình bậc nhất: 3(x - 2) + 5 = 2x + 7',
      'Giải thích định lí Py-ta-go và cho 1 ví dụ áp dụng tính cạnh huyền',
      'Làm sao để phân biệt hai tam giác bằng nhau theo trường hợp c.g.c?',
    ],
    sampleDocument: {
      title: 'Tóm tắt Hằng đẳng thức & Định lí Py-ta-go (Lớp 8)',
      content: `CHUYÊN ĐỀ ÔN TẬP TOÁN 8
1. Bảy hằng đẳng thức đáng nhớ:
- Bình phương của một tổng: (A + B)^2 = A^2 + 2AB + B^2
- Bình phương của một hiệu: (A - B)^2 = A^2 - 2AB + B^2
- Hiệu hai bình phương: A^2 - B^2 = (A - B)(A + B)
- Lập phương của một tổng: (A + B)^3 = A^3 + 3A^2B + 3AB^2 + B^3
- Lập phương của một hiệu: (A - B)^3 = A^3 - 3A^2B + 3AB^2 - B^3

2. Định lí Py-ta-go:
- Trong một tam giác vuông, bình phương độ dài cạnh huyền bằng tổng bình phương độ dài hai cạnh góc vuông.
- Công thức: Nếu tam giác ABC vuông tại A thì BC^2 = AB^2 + AC^2.
- Ví dụ chuẩn trong tài liệu: Tam giác ABC vuông tại A có AB = 6 cm, AC = 8 cm. Khi đó BC^2 = 6^2 + 8^2 = 36 + 64 = 100, suy ra BC = 10 cm.`,
    },
  },
  {
    id: 'ngu-van',
    name: 'Ngữ văn',
    shortDescription: 'Đọc hiểu văn bản, Tiếng Việt và Tập làm văn THCS',
    starterPrompts: [
      'Phân biệt biện pháp tu từ ẩn dụ và hoán dụ kèm ví dụ dễ nhớ',
      'Hướng dẫn lập dàn ý bài văn nghị luận về tinh thần tự học',
      'Cách xác định thành phần biệt lập tình thái trong câu',
    ],
    sampleDocument: {
      title: 'Ghi chú Văn bản "Làng" – Kim Lân (Ngữ văn THCS)',
      content: `TÓM TẮT KIẾN THỨC TÁC PHẨM "LÀNG" (KIM LÂN)
1. Hoàn cảnh sáng tác:
- Viết năm 1948, thời kì đầu của cuộc kháng chiến chống thực dân Pháp.
- Nhân vật chính: Ông Hai – người nông dân có tình yêu làng Chợ Dầu sâu sắc hòa quyện với tình yêu nước.

2. Diễn biến tâm trạng ông Hai khi nghe tin làng Chợ Dầu theo giặc:
- Lúc mới nghe tin: Cổ họng nghẹn ắng hẳn lại, da mặt tê rân rân, ông lặng đi tưởng như không thở được.
- Khi về nhà: Nằm vật ra giường, nhìn lũ con mà nước mắt giàn ra, vừa tủi hổ vừa lo lắng bị mụ chủ nhà đuổi.
- Xung đột nội tâm: "Làng thì yêu thật, nhưng làng theo Tây mất rồi thì phải thù." -> Tình yêu nước đã rộng lớn và bao trùm lên tình yêu làng.

3. Nghệ thuật tiêu biểu:
- Xây dựng tình huống truyện gay cấn (tin đồn làng theo giặc).
- Miêu tả diễn biến tâm lí nhân vật sâu sắc, ngôn ngữ đậm chất khẩu ngữ nông dân.`,
    },
  },
  {
    id: 'tieng-anh',
    name: 'Tiếng Anh',
    shortDescription: 'Ngữ pháp, Từ vựng và Đọc hiểu chương trình THCS',
    starterPrompts: [
      'Khi nào dùng thì Hiện tại hoàn thành và Quá khứ đơn?',
      'Cách chuyển câu trực tiếp sang câu gián tiếp (Reported Speech)',
      'Giải thích câu điều kiện loại 1 và cho 3 câu ví dụ',
    ],
    sampleDocument: {
      title: 'Tài liệu Ngữ pháp Unit 5: Câu điều kiện loại 1 & Modal Verbs',
      content: `ENGLISH GRAMMAR NOTES – GRADE 8/9
1. First Conditional (Câu điều kiện loại 1):
- Cách dùng: Diễn tả sự việc có thể xảy ra ở hiện tại hoặc tương lai nếu điều kiện được đáp ứng.
- Cấu trúc: If + S + V(hiện tại đơn), S + will/can/may + V(nguyên thể).
- Ví dụ trong bài học: "If it rains tomorrow, we will stay at home and revise for the test."
- Lưu ý: Có thể dùng "unless" thay cho "if ... not". Ví dụ: "Unless you study hard, you won't pass the exam."

2. Từ vựng trọng tâm trong bài:
- preserve (v): bảo tồn, giữ gìn
- tradition (n): truyền thống
- generation (n): thế hệ
- custom (n): phong tục, tập quán`,
    },
  },
  {
    id: 'khoa-hoc',
    name: 'Khoa học',
    shortDescription: 'Khoa học tự nhiên: Vật lí, Hóa học và Sinh học THCS',
    starterPrompts: [
      'Giải thích sự khác nhau giữa khối lượng riêng và trọng lượng riêng',
      'Quá trình quang hợp ở thực vật diễn ra như thế nào?',
      'Hướng dẫn cân bằng phương trình hóa học: Fe + O2 -> Fe3O4',
    ],
    sampleDocument: {
      title: 'Tóm tắt Bài Quang hợp & Hô hấp tế bào (KHTN 7)',
      content: `TÀI LIỆU ÔN TẬP KHOA HỌC TỰ NHIÊN 7
1. Quang hợp ở thực vật:
- Khái niệm: Là quá trình lá cây sử dụng nước và khí carbon dioxide nhờ năng lượng ánh sáng đã được chất diệp lục hấp thụ để tổng hợp chất hữu cơ (glucose) và giải phóng khí oxygen.
- Phương trình tổng quát:
  Nước + Carbon dioxide --(Ánh sáng, Diệp lục)--> Glucose + Oxygen
- Vai trò: Tạo chất hữu cơ nuôi cây, cung cấp thức ăn cho sinh vật khác, điều hòa không khí nhờ hấp thụ CO2 và nhả O2.

2. Các yếu tố ảnh hưởng đến quang hợp:
- Ánh sáng: Cường độ ánh sáng phù hợp giúp cây quang hợp mạnh.
- Nước: Là nguyên liệu trực tiếp tham gia quang hợp và giúp khí khổng đóng mở.
- Khí carbon dioxide: Nồng độ CO2 trong không khí ảnh hưởng trực tiếp đến tốc độ quang hợp (mức tối ưu thường khoảng 0,03% - 0,1%).
- Nhiệt độ: Nhiệt độ thuận lợi với đa số cây xanh là khoảng 25°C - 35°C.`,
    },
  },
  {
    id: 'lich-su-dia-ly',
    name: 'Lịch sử và Địa lý',
    shortDescription: 'Lịch sử Việt Nam, Thế giới và Địa lý tự nhiên – kinh tế THCS',
    starterPrompts: [
      'Trình bày nguyên nhân thắng lợi và ý nghĩa của chiến thắng Bạch Đằng năm 938',
      'Đặc điểm khí hậu nhiệt đới ẩm gió mùa của Việt Nam là gì?',
      'Vì sao sông ngòi nước ta có hai mùa nước khác nhau rõ rệt?',
    ],
    sampleDocument: {
      title: 'Đề cương Chiến thắng Bạch Đằng năm 938 (Lịch sử 7)',
      content: `ĐỀ CƯƠNG LỊCH SỬ THCS – CHIẾN THẮNG BẠCH ĐẰNG (938)
1. Bối cảnh:
- Năm 938, quân Nam Hán do Lưu Hoằng Tháo chỉ huy kéo vào xâm lược nước ta theo đường thủy qua cửa sông Bạch Đằng.
- Ngô Quyền nắm được quy luật thủy triều lên xuống của sông Bạch Đằng nên đã chọn nơi đây làm trận địa quyết chiến.

2. Kế hoạch của Ngô Quyền:
- Cho quân đóng cọc gỗ đầu nhọn bịt sắt xuống lòng sông Bạch Đằng ở nơi hiểm yếu, lúc thủy triều lên thì nước che lấp bãi cọc.
- Dùng thuyền nhẹ ra khiêu chiến, giả vờ thua để nhử quân Nam Hán vào trận địa cọc lúc nước triều đang rút xuống.

3. Kết quả và Ý nghĩa lịch sử:
- Thuyền giặc va vào cọc vỡ đắm rất nhiều, Lưu Hoằng Tháo tử trận, quân Nam Hán đại bại.
- Ý nghĩa: Đập tan hoàn toàn mưu đồ xâm lược của quân Nam Hán, chấm dứt hơn 1.000 năm Bắc thuộc, mở ra thời kì độc lập tự chủ lâu dài của dân tộc Việt Nam.`,
    },
  },
];

export const SUBJECT_MAP: Record<SubjectId, SubjectInfo> = SUBJECTS.reduce(
  (acc, item) => {
    acc[item.id] = item;
    return acc;
  },
  {} as Record<SubjectId, SubjectInfo>
);
