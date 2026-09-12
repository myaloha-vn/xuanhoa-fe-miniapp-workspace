// ─── DỮ LIỆU & KIỂU DÙNG CHUNG TOÀN ỨNG DỤNG ──────────────────────────────
// File này gom mọi hằng số, dữ liệu mẫu và hàm tiện ích thuần (không dùng
// React state) mà nhiều trang (pages) cùng cần tới. Tách riêng để mỗi trang
// chỉ import đúng phần dữ liệu nó dùng, thay vì phải đọc từ 1 file App.tsx
// khổng lồ như trước.

import bannerXuanHoa from "../assets/banner-xuan-hoa-so-1.jpg";
import bannerXuanHoa2 from "../assets/banner-xuan-hoa-so-2.jpg";
import bannerXuanHoa3 from "../assets/banner-xuan-hoa-so-3.jpg";
import newsHoiNghi from "../assets/news-hoi-nghi.jpg";
import newsToDanPho from "../assets/news-to-dan-pho-tu-quan.jpg";
import newsVeSinh from "../assets/news-ve-sinh-moi-truong.jpg";

// ─── TYPES ──────────────────────────────────────────────────────────────────
export type TabName = "home" | "notifications" | "utilities" | "profile";

// ─── BANNER TRANG CHỦ ────────────────────────────────────────────────────────
export const BANNERS = [
  {
    id: 1,
    kicker: "CHÀO MỪNG ĐẾN VỚI",
    title: "XUÂN HOÀ SỐ",
    tagline: "Kết nối - Chia sẻ - Phát triển",
    image: bannerXuanHoa,
    plain: true,
  },
  {
    id: 2,
    kicker: "XUÂN HOÀ SỐ",
    title: "ĐƯA CHÍNH QUYỀN GẦN HƠN VỚI NGƯỜI DÂN",
    tagline: "Nhanh - Chính xác - Thân thiện",
    image: bannerXuanHoa2,
    plain: true,
  },
  {
    id: 3,
    kicker: "CHUYỂN ĐỔI SỐ",
    title: "ĐÔ THỊ THÔNG MINH",
    tagline: "Xây dựng chính quyền số",
    image: bannerXuanHoa3,
    plain: true,
  },
];

export const TICKER_ITEMS = [
  { text: "📢 Lịch tiếp dân tháng 8/2024: Thứ 3 và Thứ 5 hàng tuần từ 7:30–11:30", newsId: 1 },
  { text: "🔔 Thông báo nộp thuế đất định kỳ quý III/2024 đến ngày 31/08", newsId: 3 },
  { text: "✅ Khai trương Cổng dịch vụ công trực tuyến phường Xuân Hoà", newsId: 1 },
  { text: "🌟 Phường Xuân Hoà đạt danh hiệu Đô thị văn minh năm 2024", newsId: 2 },
  { text: "📌 Hội nghị phong trào toàn dân bảo vệ an ninh Tổ quốc tháng 8", newsId: 2 },
];

export const NEWS = [
  {
    id: 1,
    title: "UBND phường Xuân Hoà tổ chức Hội nghị triển khai nhiệm vụ 6 tháng cuối năm 2024",
    time: "2 giờ trước",
    image: newsHoiNghi,
    category: "Hoạt động",
    views: 342,
    status: "approved",
    hoodId: 3,
    author: "Ban Biên tập phường Xuân Hoà",
    body: [
      "Sáng nay, UBND phường Xuân Hoà đã tổ chức Hội nghị triển khai nhiệm vụ phát triển kinh tế – xã hội 6 tháng cuối năm 2024 với sự tham dự của lãnh đạo phường, trưởng các khu phố và đại diện các tổ chức đoàn thể trên địa bàn.",
      "Hội nghị đánh giá kết quả thực hiện 6 tháng đầu năm: thu ngân sách đạt 58% kế hoạch, tỷ lệ hồ sơ hành chính giải quyết đúng hạn đạt 98,6%, công tác chỉnh trang đô thị và vệ sinh môi trường có nhiều chuyển biến tích cực.",
      "Trong 6 tháng cuối năm, phường xác định ba nhiệm vụ trọng tâm: đẩy mạnh chuyển đổi số trong giải quyết thủ tục hành chính, hoàn thiện mô hình khu phố số, và tăng cường tiếp nhận – xử lý phản ánh kiến nghị của người dân qua ứng dụng Xuân Hoà Số.",
      "Lãnh đạo phường đề nghị các khu phố chủ động tuyên truyền để người dân cài đặt và sử dụng ứng dụng, xem đây là kênh thông tin chính thức giữa chính quyền và nhân dân.",
    ],
  },
  {
    id: 2,
    title: "Ra mắt mô hình Tổ dân phố tự quản về trật tự đô thị và vệ sinh môi trường",
    time: "5 giờ trước",
    image: newsToDanPho,
    category: "Thông báo",
    views: 218,
    status: "approved",
    hoodId: 7,
    author: "Ban điều hành Khu phố 7",
    body: [
      "Khu phố 7 vừa chính thức ra mắt mô hình Tổ dân phố tự quản về trật tự đô thị và vệ sinh môi trường, với 12 thành viên là đại diện các hộ gia đình tiêu biểu trên địa bàn.",
      "Tổ tự quản có nhiệm vụ nhắc nhở, vận động người dân không lấn chiếm lòng lề đường, bỏ rác đúng giờ và đúng nơi quy định, đồng thời phản ánh kịp thời các trường hợp vi phạm đến Ban điều hành khu phố.",
      "Sau một tháng thí điểm, tình trạng đổ rác không đúng giờ tại khu vực đã giảm rõ rệt. Mô hình dự kiến được nhân rộng ra các khu phố khác trong quý IV/2024.",
    ],
  },
  {
    id: 3,
    title: "Thông báo lịch vệ sinh môi trường tháng 8/2024 trên địa bàn phường Xuân Hoà",
    time: "1 ngày trước",
    image: newsVeSinh,
    category: "Thông báo",
    views: 156,
    status: "pending",
    hoodId: 12,
    author: "UBND phường Xuân Hoà",
    body: [
      "UBND phường Xuân Hoà thông báo lịch ra quân tổng vệ sinh môi trường tháng 8/2024 trên toàn địa bàn phường.",
      "Thời gian: từ 7h00 sáng Chủ nhật hàng tuần. Địa điểm tập trung: nhà văn hoá của từng khu phố. Nội dung: phát quang bụi rậm, khơi thông cống rãnh, thu gom rác thải tại các điểm đen về môi trường.",
      "Đề nghị Ban điều hành các khu phố thông báo rộng rãi đến từng hộ gia đình, vận động mỗi hộ cử ít nhất một thành viên tham gia.",
    ],
  },
];

// ─── Bản đồ Xuân Hoà (nguồn: Google My Maps "Phường Xuân Hòa") ─────────────
export const MY_MAPS_ID = "1UUIrmBXAXwRRTm6ihEXdisbRusP2OwI";
export const MAP_CENTER = { lat: 10.7800988, lng: 106.6976196 };

export type MapPlace = {
  id: string;
  name: string;
  venue: string;
  group: string;
  lat: number;
  lng: number;
};

/** Danh sách địa điểm hiển thị dưới bản đồ - hiện để trống, bổ sung khi có dữ liệu chính thức */
export const MAP_PLACES: MapPlace[] = [];

// ─── Địa điểm đã lưu (hiển thị ở trang Cá nhân > Mục đã lưu) ───────────────
export type SavedPlace = MapPlace & { savedAt: string };
export const SAVED_KEY = "xhs_saved_places";
export const SAVED_LISTENERS = new Set<() => void>();

export const mapsLink = (lat: number, lng: number) =>
  `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;

// ─── Thông báo xuyên trang (popup toàn ứng dụng) ────────────────────────────
export type PopupNotice = {
  id: string;
  hoodId: number | null;
  badge: string;
  title: string;
  desc: string;
  image: string;
  cta: string;
  /** Số lần chuyển trang thì nhắc lại nếu người dân chưa xem */
  repeatEvery: number;
  newsId?: number;
};

export const POPUP_NOTICES: PopupNotice[] = [
  {
    id: "pu-1",
    hoodId: 7,
    badge: "THÔNG BÁO KHU PHỐ 7",
    title: "Ra quân tổng vệ sinh môi trường",
    desc: "7h00 Chủ nhật 10/08 tại nhà văn hoá khu phố. Mỗi hộ cử ít nhất một thành viên tham gia.",
    image: newsVeSinh,
    cta: "Xem chi tiết",
    repeatEvery: 3,
    newsId: 3,
  },
];

// ─── Lịch thu gom rác theo khu phố ──────────────────────────────────────────
export const WASTE_SCHEDULE = Array.from({ length: 18 }, (_, i) => ({
  id: `ws-${i + 1}`,
  hoodId: i + 1,
  route: `Đường số ${i + 1} và các hẻm nhánh`,
  days: i % 3 === 0 ? "Thứ 2, Thứ 4, Thứ 6" : i % 3 === 1 ? "Thứ 3, Thứ 5, Thứ 7" : "Thứ 2, Thứ 5",
  time: i % 2 === 0 ? "05:00 - 07:00" : "17:00 - 19:00",
  type: i % 3 === 0 ? "Rác sinh hoạt" : i % 3 === 1 ? "Rác tái chế" : "Rác cồng kềnh",
  provider: "Công ty Dịch vụ công ích",
  providerPhone: "1900 545439",
}));

// ─── Học vụ số (Bình dân học vụ số) ───────────────────────────────────────
export const LITERACY_TOPICS = [
  {
    id: "dl-1",
    title: "Dịch vụ công trực tuyến",
    desc: "Hướng dẫn nộp hồ sơ, tra cứu kết quả và thanh toán trực tuyến.",
    icon: "FileText",
    image: "https://images.unsplash.com/photo-1486325212027-8081e485255e?w=800&h=450&fit=crop&auto=format",
    author: "UBND phường Xuân Hoà",
    body: [
      "Dịch vụ công trực tuyến toàn trình cho phép người dân nộp hồ sơ, theo dõi tiến độ và nhận kết quả hoàn toàn qua mạng, không cần đến trực tiếp trụ sở.",
      "Các bước thực hiện: đăng nhập Cổng dịch vụ công bằng tài khoản VNeID mức độ 2; chọn đúng thủ tục cần làm; điền tờ khai và tải lên bản chụp giấy tờ; nộp lệ phí trực tuyến nếu có rồi bấm gửi hồ sơ.",
      "Sau khi nộp, theo dõi trạng thái trong mục Hồ sơ đã nộp. Khi có kết quả, hệ thống gửi thông báo và người dân chọn nhận bản điện tử hoặc qua bưu chính.",
      "Cần hỗ trợ, người dân liên hệ bộ phận tiếp nhận hồ sơ của UBND phường Xuân Hoà trong giờ hành chính.",
    ],
  },
  {
    id: "dl-2",
    title: "Kỹ năng sử dụng điện thoại",
    desc: "Cài đặt ứng dụng, quét mã QR, gọi video và sử dụng các tiện ích cơ bản.",
    icon: "Smartphone",
    image: "https://images.unsplash.com/photo-1519501025264-65ba15a82390?w=800&h=450&fit=crop&auto=format",
    author: "Tổ công nghệ số cộng đồng",
    body: [
      "Cài đặt ứng dụng: mở CH Play trên máy Android hoặc App Store trên iPhone, gõ tên ứng dụng cần tìm rồi bấm Cài đặt. Chỉ cài từ hai kho chính thức này, không cài qua đường dẫn lạ.",
      "Quét mã QR: mở ứng dụng Camera, đưa khung hình vào mã QR và chờ điện thoại hiện đường dẫn. Đọc kỹ nội dung hiện ra trước khi bấm mở.",
      "Gọi video: dùng Zalo hoặc Messenger, chọn người thân trong danh bạ rồi bấm biểu tượng máy quay. Nên dùng wifi để hình ảnh mượt và tiết kiệm dữ liệu.",
      "Một số tiện ích cơ bản khác: phóng to chữ trong phần Cài đặt - Màn hình, bật trợ lý giọng nói để đọc tin nhắn, và sao lưu ảnh lên tài khoản để không mất khi hỏng máy.",
    ],
  },
  {
    id: "dl-3",
    title: "Thanh toán không tiền mặt",
    desc: "Hướng dẫn chuyển khoản, thanh toán hoá đơn và sử dụng ví điện tử an toàn.",
    icon: "Wallet",
    image: "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=800&h=450&fit=crop&auto=format",
    author: "UBND phường Xuân Hoà",
    body: [
      "Thanh toán không tiền mặt giúp mua sắm, đóng tiền điện nước nhanh chóng và hạn chế rủi ro mang theo tiền mặt.",
      "Chuyển khoản: mở ứng dụng ngân hàng, chọn Chuyển tiền, nhập số tài khoản người nhận, kiểm tra kỹ tên hiển thị rồi mới xác nhận bằng mật khẩu hoặc vân tay.",
      "Thanh toán hoá đơn điện, nước, internet: chọn mục Thanh toán hoá đơn, nhập mã khách hàng ghi trên giấy báo, hệ thống sẽ hiện số tiền cần trả.",
      "An toàn khi dùng ví điện tử: đặt hạn mức giao dịch thấp, bật xác thực sinh trắc học, không lưu mật khẩu trên máy và luôn giữ lại biên lai điện tử.",
    ],
  },
  {
    id: "dl-4",
    title: "An toàn trên mạng",
    desc: "Nhận biết cuộc gọi giả mạo, đường link lừa đảo và bảo vệ thông tin cá nhân.",
    icon: "ShieldCheck",
    image: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=800&h=450&fit=crop&auto=format",
    author: "Công an phường Xuân Hoà",
    body: [
      "Xuất hiện nhiều cuộc gọi mạo danh cán bộ công an, toà án, nhân viên điện lực hoặc ngân hàng để yêu cầu người dân chuyển tiền hoặc cung cấp mã OTP.",
      "Nguyên tắc chung: cơ quan nhà nước không bao giờ yêu cầu chuyển tiền qua điện thoại và không hỏi mã OTP. Tuyệt đối không bấm vào đường dẫn lạ trong tin nhắn.",
      "Bảo vệ thông tin cá nhân: không chia sẻ ảnh chụp căn cước, không đăng số điện thoại và địa chỉ công khai trên mạng xã hội, đặt mật khẩu khác nhau cho từng tài khoản quan trọng.",
      "Khi nghi ngờ, hãy tắt máy và liên hệ trực tiếp UBND phường hoặc công an khu vực để xác minh trước khi làm theo bất kỳ yêu cầu nào.",
    ],
  },
  {
    id: "dl-5",
    title: "Trí tuệ nhân tạo",
    desc: "Hướng dẫn sử dụng ChatGPT, Gemini và các công cụ AI phục vụ đời sống.",
    icon: "Bot",
    image: "https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?w=800&h=450&fit=crop&auto=format",
    author: "Tổ công nghệ số cộng đồng",
    body: [
      "Trí tuệ nhân tạo là công cụ trả lời câu hỏi, soạn văn bản, dịch thuật và tóm tắt thông tin. Người dân có thể dùng miễn phí ChatGPT, Gemini hoặc trợ lý ảo ngay trong ứng dụng Xuân Hoà Số.",
      "Cách dùng cơ bản: mở ứng dụng, gõ hoặc nói câu hỏi bằng tiếng Việt càng rõ ràng càng tốt. Ví dụ: soạn giúp tôi đơn xin xác nhận cư trú, hoặc tóm tắt nội dung thông báo này.",
      "Ứng dụng trong đời sống: soạn đơn từ, tra cứu thủ tục, dịch tài liệu, gợi ý thực đơn, hướng dẫn sử dụng thiết bị trong nhà.",
      "Lưu ý quan trọng: không cung cấp thông tin cá nhân, số tài khoản hay mật khẩu cho công cụ AI, và luôn kiểm tra lại thông tin quan trọng với nguồn chính thức trước khi sử dụng.",
    ],
  },
  {
    id: "dl-6",
    title: "Tiện ích số địa phương",
    desc: "Hướng dẫn sử dụng Xuân Hoà Số, gửi phản ánh và tra cứu thông tin khu phố.",
    icon: "MapPinned",
    image: "https://images.unsplash.com/photo-1582407947304-fd86f028f716?w=800&h=450&fit=crop&auto=format",
    author: "UBND phường Xuân Hoà",
    body: [
      "Ứng dụng Xuân Hoà Số là kênh thông tin chính thức giữa chính quyền phường và người dân, hoạt động ngay trên Zalo, không cần cài thêm ứng dụng.",
      "Khai báo hộ gia đình một lần ở mục Khu phố số để hệ thống xác định bạn thuộc khu phố nào, sau đó thông tin sẽ tự điền khi gửi phản ánh.",
      "Gửi phản ánh: chọn nhóm phản ánh, mô tả sự việc, bấm lấy vị trí hiện tại hoặc nhập địa chỉ, đính kèm tối đa 4 ảnh rồi gửi. Mỗi phản ánh có mã riêng để theo dõi tiến độ xử lý.",
      "Tra cứu thông tin khu phố: xem ban điều hành, tin tức, lịch thu gom rác và các phản ánh đang xử lý của khu phố mình cũng như các khu phố khác.",
    ],
  },
];

export const LITERACY = LITERACY_TOPICS.map((t, i) => ({
  id: t.id,
  title: t.title,
  topic: t.desc,
  news: {
    id: 100 + i + 1,
    title: t.title,
    time: `${i + 1} ngày trước`,
    image: t.image,
    category: "Học vụ số",
    views: 300 + i * 87,
    status: "approved",
    hoodId: 1,
    author: t.author,
    body: t.body,
  },
}));

/** Tra cứu 1 tin theo id - gộp cả tin thường (NEWS) và tin học vụ số (LITERACY) vì
 *  cả 2 nguồn đều được điều hướng tới trang /news/:newsId. */
const ALL_NEWS_LIKE = [...NEWS, ...LITERACY.map((l) => l.news)];
export const newsById = (id: number) => ALL_NEWS_LIKE.find((n) => n.id === id) ?? NEWS[0];

// ─── PHẢN ÁNH, KIẾN NGHỊ - XỬ LÝ 2 CẤP ──────────────────────────────────────
// Cấp 1: Trưởng khu phố (theo khu phố người dân chọn khi gửi).
// Cấp 2: Công chức UBND phường, chỉ nhận khi cấp 1 chuyển lên.
export type FeedbackLevel = "hood" | "ubnd";

export const FEEDBACK_LEVEL: Record<FeedbackLevel, { label: string; short: string; tone: string }> = {
  hood: { label: "Đang ở cấp Khu phố", short: "Khu phố", tone: "bg-blue-100 text-blue-700" },
  ubnd: { label: "Đang ở cấp UBND phường", short: "UBND phường", tone: "bg-violet-100 text-violet-700" },
};

/** Một mốc trong lịch sử xử lý - hiển thị cho người dân theo dõi */
export type FeedbackEvent = {
  at: string;
  /** Ai thực hiện: tên người / bộ phận */
  by: string;
  /** Cấp thực hiện, để người dân biết phản ánh đang ở đâu */
  level: FeedbackLevel | "citizen";
  action: string;
  note?: string;
};

export type FeedbackItem = {
  id: string;
  type: string;
  content: string;
  status: string;
  date: string;
  address: string;
  note: string;
  /** Khu phố người dân chọn khi gửi - căn cứ định tuyến tới Trưởng khu phố */
  hoodId?: number;
  level?: FeedbackLevel;
  /** Người tiếp nhận ở cấp đang xử lý */
  receiver?: string;
  /** Bộ phận/cán bộ được UBND phân công */
  assignee?: string;
  /** Nội dung kết quả xử lý công khai cho người dân */
  result?: string;
  /** Ảnh minh chứng kết quả xử lý */
  resultImages?: string[];
  history?: FeedbackEvent[];
};

export const FEEDBACKS: FeedbackItem[] = [
  {
    id: "PK001", type: "Khác",
    content: "Đường Nguyễn Văn Linh đoạn qua KP 3 bị lún sụt nghiêm trọng, cần sửa chữa gấp",
    status: "forwarded", date: "28/07/2024", address: "Đường Nguyễn Văn Linh, KP 3", note: "",
    hoodId: 3, level: "ubnd",
    receiver: "Lê Minh Tuấn - Trưởng Khu phố 3",
    assignee: "Bộ phận Quản lý đô thị - UBND phường",
    history: [
      { at: "28/07/2024 08:15", by: "Người dân", level: "citizen", action: "Gửi phản ánh, chọn Khu phố 3" },
      { at: "28/07/2024 09:40", by: "Lê Minh Tuấn - Trưởng Khu phố 3", level: "hood", action: "Tiếp nhận phản ánh" },
      { at: "29/07/2024 10:05", by: "Lê Minh Tuấn - Trưởng Khu phố 3", level: "hood", action: "Chuyển UBND phường", note: "Hạng mục sửa chữa mặt đường vượt thẩm quyền khu phố, đề nghị UBND phường xem xét bố trí kinh phí." },
      { at: "30/07/2024 08:00", by: "Công chức UBND phường", level: "ubnd", action: "Tiếp nhận từ khu phố" },
      { at: "30/07/2024 14:30", by: "Công chức UBND phường", level: "ubnd", action: "Phân công Bộ phận Quản lý đô thị xử lý" },
    ],
  },
  {
    id: "PK002", type: "Điện - Nước",
    content: "Đèn đường trước số nhà 45/3 KP 7 bị hỏng từ 2 tuần nay, đề nghị sửa chữa",
    status: "resolved", date: "20/07/2024", address: "45/3 Đường Xuân Hoà, KP 7", note: "",
    hoodId: 7, level: "hood",
    receiver: "Bùi Thị Lan - Trưởng Khu phố 7",
    result: "Khu phố đã phối hợp đơn vị điện lực thay bóng đèn và kiểm tra toàn tuyến. Đèn đã sáng bình thường từ tối 22/07.",
    resultImages: [
      "https://images.unsplash.com/photo-1519501025264-65ba15a82390?w=400&h=300&fit=crop&auto=format",
    ],
    history: [
      { at: "20/07/2024 19:20", by: "Người dân", level: "citizen", action: "Gửi phản ánh, chọn Khu phố 7" },
      { at: "21/07/2024 07:50", by: "Bùi Thị Lan - Trưởng Khu phố 7", level: "hood", action: "Tiếp nhận phản ánh" },
      { at: "22/07/2024 16:10", by: "Bùi Thị Lan - Trưởng Khu phố 7", level: "hood", action: "Cập nhật kết quả xử lý" },
      { at: "22/07/2024 16:15", by: "Bùi Thị Lan - Trưởng Khu phố 7", level: "hood", action: "Đóng phản ánh" },
    ],
  },
  {
    id: "PK003", type: "Môi trường",
    content: "Bãi rác tự phát hình thành tại cuối đường số 12, cần xử lý dứt điểm",
    status: "pending", date: "30/07/2024", address: "Cuối đường số 12, KP 12", note: "",
    hoodId: 12, level: "hood",
    history: [
      { at: "30/07/2024 06:45", by: "Người dân", level: "citizen", action: "Gửi phản ánh, chọn Khu phố 12" },
    ],
  },
  {
    id: "PK004", type: "An ninh trật tự",
    content: "Nhóm thanh niên tụ tập gây mất trật tự về khuya tại công viên KP 5",
    status: "processing", date: "29/07/2024", address: "Công viên KP 5", note: "",
    hoodId: 5, level: "hood",
    receiver: "Võ Thị Hoa - Trưởng Khu phố 5",
    history: [
      { at: "29/07/2024 22:10", by: "Người dân", level: "citizen", action: "Gửi phản ánh, chọn Khu phố 5" },
      { at: "30/07/2024 07:30", by: "Võ Thị Hoa - Trưởng Khu phố 5", level: "hood", action: "Tiếp nhận phản ánh" },
      { at: "30/07/2024 08:00", by: "Võ Thị Hoa - Trưởng Khu phố 5", level: "hood", action: "Đang phối hợp Tổ tự quản kiểm tra hiện trường" },
    ],
  },
  {
    id: "PK005", type: "Khác",
    content: "Đề nghị lắp mái che tại điểm chờ xe buýt trước chợ KP 2",
    status: "rejected", date: "18/07/2024", address: "Trước chợ KP 2", note: "Vị trí đề xuất nằm trong hành lang an toàn giao thông, chưa đủ điều kiện lắp đặt.",
    hoodId: 2, level: "hood",
    receiver: "Trần Thị Mai - Trưởng Khu phố 2",
    history: [
      { at: "18/07/2024 09:00", by: "Người dân", level: "citizen", action: "Gửi phản ánh, chọn Khu phố 2" },
      { at: "18/07/2024 15:20", by: "Trần Thị Mai - Trưởng Khu phố 2", level: "hood", action: "Không tiếp nhận", note: "Vị trí đề xuất nằm trong hành lang an toàn giao thông, chưa đủ điều kiện lắp đặt." },
    ],
  },
];


const LEADER_NAMES = [
  "Nguyễn Văn Hùng","Trần Thị Mai","Lê Minh Tuấn","Phạm Văn Đức",
  "Võ Thị Hoa","Đặng Minh Khoa","Bùi Thị Lan","Hoàng Văn Nam",
  "Ngô Thị Thu","Đinh Văn Phong","Lý Thị Quỳnh","Vũ Minh Sơn",
  "Trương Thị Tâm","Phan Văn Uy","Mai Thị Vân","Đỗ Văn Xuân",
  "Cao Thị Yên","Lâm Văn Phúc",
];

const HOOD_IMGS = [
  "photo-1582407947304-fd86f028f716","photo-1486325212027-8081e485255e",
  "photo-1477959858617-67f85cf4f1df","photo-1451187580459-43490279c0fa",
  "photo-1529156069898-49953e39b3ac","photo-1466611653911-95081537e5b7",
  "photo-1449824913935-59a10b8d2000","photo-1519501025264-65ba15a82390",
];

export const NEIGHBORHOODS = Array.from({ length: 18 }, (_, i) => {
  const leader = LEADER_NAMES[i];
  const img = HOOD_IMGS[i % HOOD_IMGS.length];
  return {
    id: i + 1,
    name: `Khu phố ${i + 1}`,
    population: 800 + ((i * 47) % 600),
    households: 200 + ((i * 31) % 200),
    leader,
    phone: `09${String((10 + i * 3) % 90).padStart(2, "0")}.${String((100 + i * 37) % 900 + 100).padStart(3, "0")}.${String((200 + i * 53) % 800 + 100).padStart(3, "0")}`,
    image: `https://images.unsplash.com/${img}?w=400&h=200&fit=crop&auto=format`,
    // Nhóm Zalo chính thức của khu phố - nơi bà con trao đổi, nhận thông báo
    // nhanh từ Ban điều hành khu phố.
    zaloGroupUrl: `https://zalo.me/g/kp${i + 1}xh${String(100000 + i * 733).slice(-6)}`,
    zaloGroupMembers: 60 + ((i * 23) % 180),
    board: [
      { name: leader, role: "Trưởng khu phố", phone: `09${String((10+i*3)%90).padStart(2,"0")}.${String((100+i*37)%900+100).padStart(3,"0")}.${String((200+i*53)%800+100).padStart(3,"0")}` },
      { name: LEADER_NAMES[(i+1)%18], role: "Bí thư Chi bộ", phone: `09${String((20+i*2)%80+10).padStart(2,"0")}.${String((200+i*17)%800+100).padStart(3,"0")}.${String((300+i*41)%700+100).padStart(3,"0")}` },
      { name: LEADER_NAMES[(i+2)%18], role: "Trưởng ban Công tác Mặt trận", phone: `09${String((30+i*4)%70+20).padStart(2,"0")}.${String((300+i*23)%700+100).padStart(3,"0")}.${String((400+i*29)%600+100).padStart(3,"0")}` },
      { name: LEADER_NAMES[(i+3)%18], role: "Cảnh sát khu vực", phone: `09${String((40+i*5)%60+30).padStart(2,"0")}.${String((400+i*19)%600+100).padStart(3,"0")}.${String((500+i*31)%500+100).padStart(3,"0")}` },
    ],
    households_list: Array.from({ length: 8 }, (_, j) => {
      const streets = [`Đường số ${i + 1}`, `Hẻm ${12 + i} Đường số ${i + 1}`, `Đường Xuân Hoà ${(i % 4) + 1}`];
      const street = streets[j % streets.length];
      return {
        id: j + 1,
        representative: `${["Nguyễn","Trần","Lê","Phạm","Võ","Đặng","Bùi","Hoàng"][j]} ${["Văn","Thị","Minh","Ngọc"][j % 4]} ${["An","Bình","Cường","Dũng","Em","Phúc","Giang","Hà"][j]}`,
        phone: `09${i % 9 + 1}0${String(111 + j * 111).padStart(3, "0")}${String(222 + j * 97).slice(0, 3)}`,
        street,
        hoodId: i + 1,
        address: `${(j + 1) * 12 + i}/${(j % 5) + 1} ${street}, KP ${i + 1}`,
        members: 2 + (j % 4),
      };
    }),
  };
});

/** Nhận diện khu phố từ địa chỉ: "KP 7", "khu phố 12", "kp.3"... */
export function detectHoodId(address: string): number | null {
  const m = address.match(/(?:kp|khu\s*ph[ốôóo])\s*\.?\s*(\d{1,2})/i);
  if (!m) return null;
  const n = parseInt(m[1], 10);
  return n >= 1 && n <= NEIGHBORHOODS.length ? n : null;
}

export const SUGGESTED = {
  public: [
    "Thủ tục đăng ký thường trú?",
    "Cấp phép xây dựng nhà ở?",
    "Đăng ký khai sinh cho trẻ em?",
    "Chứng thực giấy tờ cá nhân?",
    "Điều kiện nhập khẩu hộ gia đình?",
  ],
  planning: [
    "Quy hoạch tổng thể phường Xuân Hoà?",
    "Chỉ giới đường đỏ khu vực nào?",
    "Đất nhà tôi có thuộc diện quy hoạch?",
    "Hệ số sử dụng đất khu dân cư?",
    "Dự án giao thông sắp triển khai?",
  ],
};

export const FEEDBACK_TYPES = [
  "Môi trường","An ninh trật tự","Điện - Nước","Tiếng ồn","Khác",
];

export const BOT_ANSWERS: Record<string, string> = {
  "Thủ tục đăng ký thường trú?": "Để đăng ký thường trú, bạn cần chuẩn bị: (1) CCCD/CMND bản gốc còn hiệu lực, (2) Giấy tờ chứng minh chỗ ở hợp pháp (sổ hồng hoặc hợp đồng thuê nhà), (3) Đơn đề nghị đăng ký thường trú theo mẫu CT01. Thời gian giải quyết: 7 ngày làm việc kể từ ngày nhận đủ hồ sơ.",
  "Cấp phép xây dựng nhà ở?": "Hồ sơ xin cấp phép xây dựng nhà ở gồm: (1) Đơn đề nghị cấp phép xây dựng, (2) Sổ đỏ/sổ hồng, (3) Bản vẽ thiết kế kiến trúc có chứng chỉ hành nghề, (4) Giấy tờ chứng minh quyền sử dụng đất. Thời gian: 15 ngày làm việc.",
  "Quy hoạch tổng thể phường Xuân Hoà?": "Theo đồ án quy hoạch phân khu được UBND TP. Hồ Chí Minh phê duyệt, phường Xuân Hoà được định hướng phát triển thành đô thị xanh, thông minh với các khu chức năng: khu dân cư, khu thương mại dịch vụ, hành lang xanh ven kênh và khu công viên đô thị.",
  "Đăng ký khai sinh cho trẻ em?": "Hồ sơ đăng ký khai sinh gồm: (1) Giấy chứng sinh do bệnh viện cấp, (2) CCCD của cha và mẹ, (3) Giấy đăng ký kết hôn (nếu có), (4) Tờ khai đăng ký khai sinh theo mẫu. Đăng ký trong vòng 60 ngày kể từ ngày sinh. Miễn phí lệ phí.",
};

// ─── GÓP Ý HỆ THỐNG ─────────────────────────────────────────────────────────
export type SuggestionStatus = "received" | "reviewing" | "answered";

export interface Suggestion {
  id: string;
  topic: string;
  content: string;
  images: string[];
  senderName: string;
  senderPhone: string;
  senderUnit: string;
  createdAt: string;
  status: SuggestionStatus;
  timeline: { at: string; by: string; action: string; note?: string }[];
  reply?: string;
}

export const SUGGESTION_KEY = "xhs_suggestions";
export const SUGGESTION_TOPICS = [
  "Giao diện, dễ sử dụng",
  "Chức năng phản ánh kiến nghị",
  "Thông tin khu phố",
  "Tin tức và thông báo",
  "Lỗi kỹ thuật",
  "Đề xuất tính năng mới",
  "Khác",
];

export const SUGGESTION_STATUS: Record<SuggestionStatus, { label: string; tone: string }> = {
  received: { label: "Đã tiếp nhận", tone: "bg-amber-100 text-amber-700" },
  reviewing: { label: "Đang xem xét", tone: "bg-blue-100 text-blue-700" },
  answered: { label: "Đã phản hồi", tone: "bg-green-100 text-green-700" },
};

/** Góp ý mẫu để người dùng thấy được quy trình tiếp nhận - xử lý */
export const SEED_SUGGESTIONS: Suggestion[] = [
  {
    id: "GY1001",
    topic: "Đề xuất tính năng mới",
    content: "Đề nghị bổ sung tính năng nhắc lịch thu gom rác trước 1 giờ để người dân không quên đưa rác ra đúng giờ.",
    images: [],
    senderName: "Nguyễn Văn Minh",
    senderPhone: "0901234567",
    senderUnit: "Khu phố 3",
    createdAt: "2026-07-28T09:15:00",
    status: "answered",
    timeline: [
      { at: "2026-07-28T09:15:00", by: "Hệ thống", action: "Tiếp nhận góp ý" },
      { at: "2026-07-29T14:00:00", by: "Ban Biên tập phường", action: "Chuyển bộ phận kỹ thuật xem xét" },
      { at: "2026-08-01T10:30:00", by: "UBND phường Xuân Hoà", action: "Phản hồi góp ý", note: "Tính năng nhắc lịch thu gom rác sẽ được bổ sung trong bản cập nhật quý IV/2026. Cảm ơn góp ý của ông." },
    ],
    reply: "Tính năng nhắc lịch thu gom rác sẽ được bổ sung trong bản cập nhật quý IV/2026. Cảm ơn góp ý của ông.",
  },
  {
    id: "GY1002",
    topic: "Giao diện, dễ sử dụng",
    content: "Chữ trong phần tin tức hơi nhỏ, người lớn tuổi khó đọc. Đề nghị cho phép phóng to cỡ chữ.",
    images: [],
    senderName: "Trần Thị Mai",
    senderPhone: "0902345678",
    senderUnit: "Khu phố 7",
    createdAt: "2026-08-02T16:40:00",
    status: "reviewing",
    timeline: [
      { at: "2026-08-02T16:40:00", by: "Hệ thống", action: "Tiếp nhận góp ý" },
      { at: "2026-08-03T08:20:00", by: "Ban Biên tập phường", action: "Đang xem xét nội dung góp ý" },
    ],
  },
];

// ─── HOUSEHOLD REGISTRATION (khai báo hộ) ────────────────────────────────────
export type HouseholdRole = "owner" | "member";

/**
 * Khai báo của CHÍNH người đang dùng app (1 người - 1 bản ghi, lưu localStorage).
 * Các trường name/phone/address/hoodId/role/groups giữ nguyên như trước để
 * những màn hình cũ (Cá nhân, Phản ánh, Khu phố...) không phải sửa.
 */
export type Household = {
  name: string; phone: string; address: string; hoodId: number;
  role: HouseholdRole; groups: string[];
  /** Mã hộ gia đình mà người này thuộc về (trỏ tới HouseholdRecord) */
  householdId?: string;
  /** Trạng thái liên kết của cá nhân với hộ */
  memberStatus?: MemberStatus;
};

/**
 * HỘ GIA ĐÌNH gắn với 1 ĐỊA CHỈ - dùng chung cho mọi nhân khẩu tại địa chỉ đó.
 * Đây là "sổ hộ" của hệ thống: chủ hộ khai trước thì các thành viên khai sau
 * sẽ nhìn thấy tên chủ hộ để chọn.
 */
export type HouseholdStatus =
  | "active"          // Chủ hộ tự khai báo → hộ đã được xác lập
  | "pending_owner";  // Nhân khẩu khai hộ thay → chờ chủ hộ xác nhận

export type MemberStatus = "confirmed" | "pending";

/**
 * Đề nghị thay đổi vai trò trong hộ. Vai trò chủ hộ / thành viên KHÔNG được tự
 * đổi bằng một ô chọn, vì nó quyết định ai đại diện hộ. Mọi thay đổi đều đi qua
 * một đề nghị, chờ bên kia (hoặc cán bộ khu phố) xác nhận.
 */
export type RoleRequest = {
  /** transfer: chủ hộ nhường quyền · claim: thành viên xin làm chủ hộ */
  kind: "transfer" | "claim";
  requesterName: string;
  /** Người được đề nghị làm chủ hộ mới (với đề nghị nhường quyền) */
  targetName?: string;
  createdAt: string;
};

export const ROLE_REQUEST_LABEL: Record<RoleRequest["kind"], string> = {
  transfer: "Chờ xác nhận chuyển vai trò chủ hộ",
  claim: "Chờ xác nhận đề nghị làm chủ hộ",
};

export type HouseholdRecord = {
  id: string;
  hoodId: number;
  address: string;
  /** Khoá chuẩn hoá của địa chỉ, dùng để tra cứu hộ tại cùng một địa chỉ */
  addressKey: string;
  ownerName: string;
  ownerPhone: string;
  /** Số nhân khẩu chủ hộ khai (ước tính) */
  size?: number;
  housingType?: string;
  status: HouseholdStatus;
  /** Ai là người tạo bản ghi: chủ hộ, hay một nhân khẩu khai thay */
  createdBy: "owner" | "member";
  createdAt: string;
  members: { name: string; phone: string; relation: string; status: MemberStatus }[];
  /** Đề nghị đổi vai trò đang chờ xử lý (nếu có) */
  roleRequest?: RoleRequest;
};

export const HOUSEHOLD_STATUS: Record<HouseholdStatus, { label: string; tone: string }> = {
  active: { label: "Đã xác lập", tone: "bg-green-100 text-green-700 border-green-200" },
  pending_owner: { label: "Chờ chủ hộ xác nhận", tone: "bg-amber-100 text-amber-700 border-amber-200" },
};

/** Quan hệ với chủ hộ - dùng cho người khai báo với vai trò thành viên */
export const HOUSEHOLD_RELATIONS = [
  "Vợ/Chồng", "Con", "Cha/Mẹ", "Ông/Bà", "Anh/Chị/Em", "Cháu", "Người ở trọ", "Khác",
];

export const HOUSING_TYPES = [
  "Nhà riêng", "Nhà thuê", "Chung cư", "Nhà trọ", "Ở nhờ",
];

/**
 * Chuẩn hoá địa chỉ để so khớp: bỏ dấu câu, khoảng trắng thừa, viết thường.
 * "45/3 Đường số 7, KP 7" và "45/3 đường số 7 - kp.7" cùng trỏ về một hộ.
 */
export function addressKeyOf(address: string, hoodId: number): string {
  const norm = address
    .toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\u0111/g, "d")
    .replace(/[.,\-–—_]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return `kp${hoodId}::${norm}`;
}

export const HOUSEHOLDS_KEY = "xhs_household_registry";
export const HOUSEHOLDS_LISTENERS = new Set<() => void>();

/**
 * Vài hộ đã khai báo sẵn để demo được luồng "chủ hộ khai trước": người dùng
 * nhập đúng địa chỉ mẫu (xem gợi ý trong form) sẽ thấy tên chủ hộ hiện ra.
 */
export const SEED_HOUSEHOLDS: HouseholdRecord[] = [1, 3, 7].flatMap((hoodId) =>
  NEIGHBORHOODS[hoodId - 1].households_list.slice(0, 3).map((h) => ({
    id: `HO-${hoodId}-${h.id}`,
    hoodId,
    address: h.address,
    addressKey: addressKeyOf(h.address, hoodId),
    ownerName: h.representative,
    ownerPhone: h.phone,
    size: h.members,
    housingType: "Nhà riêng",
    status: "active" as HouseholdStatus,
    createdBy: "owner" as const,
    createdAt: "2026-08-15T08:00:00",
    members: [],
  }))
);

export const HOUSEHOLD_ROLES: { value: HouseholdRole; label: string }[] = [
  { value: "owner", label: "Chủ hộ" },
  { value: "member", label: "Thành viên" },
];

export const HOUSEHOLD_GROUPS: { label: string; chip: string; dot: string }[] = [
  { label: "Đảng viên", chip: "bg-red-50 text-red-700 border-red-200", dot: "bg-red-500" },
  { label: "Hội Phụ nữ", chip: "bg-pink-50 text-pink-700 border-pink-200", dot: "bg-pink-500" },
  { label: "Đoàn Thanh niên", chip: "bg-blue-50 text-blue-700 border-blue-200", dot: "bg-blue-500" },
  { label: "Cựu chiến binh", chip: "bg-emerald-50 text-emerald-700 border-emerald-200", dot: "bg-emerald-500" },
  { label: "Người về hưu", chip: "bg-amber-50 text-amber-700 border-amber-200", dot: "bg-amber-500" },
  { label: "Khác", chip: "bg-slate-100 text-slate-600 border-slate-200", dot: "bg-slate-400" },
];

export const groupStyle = (label: string) =>
  HOUSEHOLD_GROUPS.find((g) => g.label === label) ?? HOUSEHOLD_GROUPS[HOUSEHOLD_GROUPS.length - 1];
export const HH_KEY = "xhs_household";

/** Tài khoản Zalo - Mini App tự đăng nhập 1 chạm, lấy sẵn SĐT từ Zalo */
export const ZALO_USER = {
  name: "Người dùng Zalo",
  phone: "0901 234 567",
  zaloId: "zl_8842019",
};

export const HH_LISTENERS = new Set<() => void>();

// ─── HELPERS ─────────────────────────────────────────────────────────────────
/** 5 trạng thái phản ánh, khớp với quy trình xử lý bên hệ thống điều hành. */
export const statusColor = (s: string) =>
  ({
    pending: "bg-amber-100 text-amber-700",
    assigned: "bg-violet-100 text-violet-700",
    processing: "bg-blue-100 text-blue-700",
    forwarded: "bg-indigo-100 text-indigo-700",
    resolved: "bg-green-100 text-green-700",
    rejected: "bg-red-100 text-red-700",
  }[s] ?? "bg-gray-100 text-gray-600");
export const statusLabel = (s: string) =>
  ({
    pending: "Mới gửi",
    assigned: "Đã tiếp nhận",
    processing: "Đang xử lý",
    forwarded: "Chuyển UBND",
    resolved: "Đã xử lý",
    rejected: "Từ chối",
  }[s] ?? s);
/** Mô tả ý nghĩa từng trạng thái - dùng cho phần chú giải ở trang Theo dõi phản ánh. */
export const statusDesc = (s: string) =>
  ({
    pending: "Phản ánh vừa gửi, đang chờ Trưởng khu phố tiếp nhận.",
    assigned: "Trưởng khu phố đã tiếp nhận phản ánh.",
    processing: "Trưởng khu phố đang xác minh, xử lý tại cấp khu phố.",
    forwarded: "Vượt thẩm quyền khu phố, đã chuyển UBND phường xử lý.",
    resolved: "Đã xử lý xong và đóng phản ánh, kết quả công khai bên dưới.",
    rejected: "Không được duyệt, có ghi lý do.",
  }[s] ?? "");

// ─── HƯỚNG DẪN GỬI PHẢN ÁNH ─────────────────────────────────────────────────
export const GUIDE_STEPS = [
  {
    title: "Bước 1 · Chọn đúng nhóm phản ánh",
    desc: "Chọn một trong năm nhóm: Môi trường, An ninh trật tự, Điện - Nước, Tiếng ồn hoặc Khác. Chọn đúng nhóm giúp hồ sơ được chuyển ngay tới bộ phận phụ trách, rút ngắn thời gian xử lý.",
  },
  {
    title: "Bước 2 · Mô tả rõ sự việc",
    desc: "Nêu ngắn gọn nhưng đầy đủ: sự việc gì, xảy ra từ khi nào, mức độ ảnh hưởng tới sinh hoạt của người dân. Tránh viết chung chung như \"đường hư\", nên ghi \"mặt đường lún sâu khoảng 30cm trước số nhà 45/3\".",
  },
  {
    title: "Bước 3 · Đính kèm ít nhất 01 ảnh",
    desc: "Ảnh minh chứng là bắt buộc. Chụp rõ hiện trường, nếu được hãy chụp thêm ảnh toàn cảnh để cán bộ xác định vị trí. Mỗi phản ánh đính kèm tối đa 04 ảnh.",
  },
  {
    title: "Bước 4 · Ghi địa chỉ hoặc chia sẻ vị trí",
    desc: "Nhập số nhà, tên đường và khu phố. Nếu đồng ý, bạn có thể bấm lấy vị trí hiện tại để hệ thống ghi nhận toạ độ chính xác. Việc chia sẻ vị trí là tự nguyện.",
  },
  {
    title: "Bước 5 · Gửi và lưu mã phản ánh",
    desc: "Sau khi gửi, hệ thống cấp một mã phản ánh dạng PKxxxx. Dùng mã này ở mục Theo dõi phản ánh để xem tiến độ xử lý bất cứ lúc nào.",
  },
];

export const GUIDE_FLOW = [
  { label: "Tiếp nhận", desc: "Trong 01 ngày làm việc kể từ khi gửi", tone: "bg-amber-100 text-amber-700" },
  { label: "Phân công", desc: "Chuyển bộ phận hoặc khu phố phụ trách", tone: "bg-blue-100 text-blue-700" },
  { label: "Đang xử lý", desc: "Kiểm tra hiện trường và khắc phục", tone: "bg-indigo-100 text-indigo-700" },
  { label: "Hoàn thành", desc: "Phản hồi kết quả kèm ảnh nghiệm thu", tone: "bg-green-100 text-green-700" },
];

/**
 * Nút nổi "Góp ý hệ thống" - dùng trong giai đoạn thử nghiệm.
 * Khi hệ thống chạy ổn định, đơn vị chỉ cần đổi cờ này thành false
 * (hoặc xoá khối <SuggestionFab /> trong Layout) là nút biến mất.
 */
export const SHOW_SUGGESTION_FAB = true;
