import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, CheckCircle, ArrowRight } from 'lucide-react';

export default function LandingPage() {
    const navigate = useNavigate();
    const [showCheckout, setShowCheckout] = useState(false);
    const [step, setStep] = useState(1);
    const [customer, setCustomer] = useState({ name: '', email: '' });
    const [orderCode, setOrderCode] = useState('');

    const handleBuyClick = (e) => {
        e.preventDefault();
        setOrderCode(`PFP${Math.floor(Math.random() * 90000) + 10000}`);
        setShowCheckout(true);
        setStep(1);
    };

    const handleProceedToPayment = () => {
        if (!customer.name || !customer.email) {
            alert('Vui lòng nhập đầy đủ thông tin');
            return;
        }
        setStep(2);
    };

    const qrUrl = `https://qr.sepay.vn/img?acc=96247TESTMOAW123&bank=BIDV&amount=149000&des=${orderCode}`;

    return (
        <div className="font-sans text-slate-900 bg-white min-h-screen selection:bg-[#E5FE40] selection:text-black">
            {/* Bìa sách */}
            <div className="flex flex-col justify-center items-center text-center bg-black text-white px-6 py-24 min-h-[90vh] relative overflow-hidden">
                <div className="absolute top-[-50%] left-[-50%] w-[200%] h-[200%] pointer-events-none" style={{ background: 'radial-gradient(circle at center, rgba(229, 254, 64, 0.15) 0%, transparent 50%)' }}></div>
                <div className="relative z-10 flex flex-col items-center">
                    <div className="bg-white/10 text-white px-4 py-2 rounded-full text-sm font-semibold tracking-widest uppercase mb-12 border border-white/20 backdrop-blur-sm">
                        Giải Pháp Năng Suất Thế Hệ Mới
                    </div>
                    <h1 className="text-[clamp(3.5rem,8vw,6rem)] font-black leading-[0.95] uppercase mb-6 tracking-[-0.04em] text-white">
                        SOP 3 BƯỚC<br/>
                        <span className="bg-[#E5FE40] text-black px-2 inline-block -skew-x-3">DỌN DẸP</span><br/>
                        NÃO BỘ
                    </h1>
                    <div className="text-xl md:text-2xl font-medium text-gray-300 max-w-2xl mt-8 leading-relaxed">
                        "Đừng dùng AI chỉ để Chat. Ở đây chúng tôi ép bạn dùng AI để đẻ ra kết quả thật."
                    </div>
                    
                    <button onClick={handleBuyClick} className="mt-12 bg-[#E5FE40] text-black px-8 py-4 rounded-full font-black text-xl uppercase tracking-wider hover:-translate-y-1 hover:shadow-[0_15px_30px_rgba(229,254,64,0.3)] transition-all flex items-center gap-2">
                        Nhận Bản Quyền Trọn Đời <ArrowRight size={24} />
                    </button>
                    <button onClick={() => navigate('/app')} className="mt-6 text-gray-400 hover:text-white underline underline-offset-4 text-sm font-medium transition-colors">
                        Tôi đã có tài khoản. Đăng nhập.
                    </button>
                </div>
            </div>

            {/* Nội dung Content */}
            <div className="max-w-3xl mx-auto px-6 py-16">
                <img src="/shutterstock_1899874207-1.jpg" alt="Làm việc tối ưu" className="w-full rounded-2xl mb-12 shadow-[0_20px_40px_rgba(0,0,0,0.1)] border border-gray-100" />

                <p className="text-2xl font-semibold leading-relaxed tracking-tight mb-8 text-black">
                    Bạn lướt mạng mỗi ngày. Bạn nghe người ta chém gió rần rần về Quản lý thời gian, Notion, AI Agent... <span className="text-gray-400 font-normal">lùng bùng hết cả lỗ tai.</span>
                </p>

                <p className="text-lg mb-6 leading-relaxed">
                    Cuốn sổ tay này không phải để dạy bạn lý thuyết. Nó lôi những thuật ngữ "ảo ma" xuống đất và <span className="bg-black text-white px-1.5 inline-block">ép bạn vào khuôn khổ</span>. Kết hợp sức mạnh của một công cụ tinh gọn (PlanFlowPro) và sự tàn nhẫn của Ngỗng Đại Ca (AI Assistant), chúng tôi sẽ tiêu diệt vĩnh viễn căn bệnh lười biếng của bạn.
                </p>

                <h2 className="text-[clamp(2rem,5vw,3rem)] font-black leading-tight mb-8 border-t-4 border-black pt-8 mt-16 text-black uppercase">
                    CHƯƠNG 1<br/>
                    <span className="text-gray-400 text-[0.6em] block mt-2 tracking-tight">NHÌN THẲNG VÀO THỰC TẾ ĐI! TẠI SAO BẠN THẤT BẠI?</span>
                </h2>

                <p className="text-lg mb-6 leading-relaxed">Công việc thì cứ chồng chất, bạn lãng phí thời gian mỗi ngày ngồi nhìn màn hình nhưng rốt cuộc vẫn không làm gì cả. Khi hạ quyết tâm bắt tay vào làm thì ngẩng lên đã hết giờ.</p>
                <p className="text-lg mb-6 leading-relaxed">Bạn tải hàng chục cái Template Notion xịn xò share free trên mạng về máy rồi... để đó cho mạng nhện giăng. Hì hục setup 3 ngày 3 đêm cho đẹp cái Trello, rồi bỏ xó sau đúng 1 tuần.</p>

                <div className="bg-black text-white p-8 md:p-10 rounded-3xl my-12 -rotate-1 shadow-[10px_10px_0px_#E5FE40] max-md:shadow-[6px_6px_0px_#E5FE40] max-md:rotate-0 transform transition-transform hover:rotate-0">
                    <h3 className="text-[#E5FE40] mt-0 text-sm tracking-[2px] uppercase font-bold mb-4">NỖI ĐAU SỰ THẬT:</h3>
                    <p className="text-2xl md:text-3xl font-black leading-snug mb-6 text-white">
                        Bạn đang sống một cuộc sống <span className="bg-[#E5FE40] text-black px-2 -skew-x-2 inline-block">KHÔNG CÓ THỜI GIAN</span> cho bất cứ việc gì.
                    </p>
                    <p className="text-gray-300 text-lg leading-relaxed">
                        Tối đến người khác đi chơi thư giãn, bạn phải nhốt mình ở nhà để chạy task. <strong className="text-white bg-white/20 px-1">Không phải vì bạn chăm chỉ hơn người khác!</strong> Mà là vì bạn làm việc quá thiếu tối ưu, nên buổi tối phải tiếp tục gồng gánh đống hỗn độn từ ban ngày.
                    </p>
                </div>

                <h3 className="text-2xl font-black uppercase mt-16 mb-6">NHÌN LẠI THỰC TẾ ĐI:</h3>
                <ul className="space-y-6 mb-12 list-none p-0">
                    <li className="relative pl-8 text-xl font-medium leading-relaxed">
                        <span className="absolute left-0 top-1">👉</span>
                        <strong>Đốt tiền vô lý:</strong> Bạn đều đặn cúng tiền mua bản Pro mỗi tháng cho các app quản lý hay ChatGPT Plus, nhưng chỉ xài được đúng cái bề nổi. 80% sức mạnh cốt lõi bị bạn vứt xó vì... không biết dùng.
                    </li>
                    <li className="relative pl-8 text-xl font-medium leading-relaxed">
                        <span className="absolute left-0 top-1">👉</span>
                        <strong>Nghiện "Setup" thay vì "Làm":</strong> Bạn tốn 1 tiếng để phân loại màu sắc cho cái task, trong khi đồng nghiệp giải quyết xong cái task đó trong đúng 5 phút.
                    </li>
                    <li className="relative pl-8 text-xl font-medium leading-relaxed">
                        <span className="absolute left-0 top-1">👉</span>
                        <strong>Ảo tưởng về AI:</strong> Hỏi AI mỏi tay mà nó vẫn nhả ra mớ "văn mẫu" vô hồn. Bạn vẫn phải xắn tay áo lên tự sửa lại bằng cơm mất cả buổi.
                    </li>
                </ul>

                <h2 className="text-[clamp(2rem,5vw,3rem)] font-black leading-tight mb-8 border-t-4 border-black pt-8 mt-16 text-black uppercase">
                    CHƯƠNG 2<br/>
                    <span className="text-gray-400 text-[0.6em] block mt-2 tracking-tight">BẠN SẼ BỊ "ÉP" LÀM GÌ MỖI SÁNG? (SOP 3 BƯỚC)</span>
                </h2>
                
                <p className="text-2xl font-semibold leading-relaxed tracking-tight mb-8 text-black">
                    Công cụ sinh ra để hầu hạ bạn, không phải để bạn hầu hạ nó. Dưới đây là 3 bước bạn <span className="bg-black text-white px-2 inline-block">BỊ ÉP</span> phải làm mỗi sáng với PlanFlowPro:
                </p>

                <div className="space-y-8">
                    <div>
                        <h3 className="text-xl font-black uppercase mb-3 text-black">Bước 1: Trút sạch (Brain Dump)</h3>
                        <p className="text-lg leading-relaxed">Đừng click chuột mỏi tay nữa. Bấm phím tắt <code className="bg-gray-100 px-1.5 py-0.5 rounded text-pink-600 font-mono text-sm">Cmd + K</code> để gọi Ngỗng Đại Ca. Gõ tất cả mớ bòng bong trong đầu bạn: <em className="text-gray-600">"Tạo task gửi báo cáo cho sếp lúc 2h chiều. Tạo task mua thức ăn cho chó"</em>. Ngỗng sẽ tự động bóc tách và ném vào danh sách. Nhanh, bén ngót, không tốn đến 5 giây.</p>
                    </div>
                    <div>
                        <h3 className="text-xl font-black uppercase mb-3 text-black">Bước 2: Ăn con ếch (Eat The Frog)</h3>
                        <p className="text-lg leading-relaxed">Nhìn vào danh sách vừa tạo. Chọn ra MỘT việc duy nhất, khó nhất, chán nhất. Kéo thả nó lên đầu danh sách. Trọng tâm của ngày hôm nay chỉ là nó.</p>
                    </div>
                    <div>
                        <h3 className="text-xl font-black uppercase mb-3 text-black">Bước 3: Đóng cửa và Vanish</h3>
                        <p className="text-lg leading-relaxed">Tắt mọi tab trình duyệt. Dẹp cái ảo tưởng "đa nhiệm" (multitasking) đi. Chỉ để lại màn hình PlanFlowPro. Làm cho xong, hoặc chuẩn bị tinh thần nghe AI chửi.</p>
                    </div>
                </div>

                <div className="bg-white border-4 border-black p-8 md:p-16 rounded-[32px] mt-24 text-center shadow-[12px_12px_0px_#000] relative">
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-black text-white px-6 py-1.5 rounded-full font-black text-sm tracking-widest uppercase">
                        FINAL STEP
                    </div>
                    <h2 className="text-[clamp(2rem,5vw,3rem)] font-black mb-6 leading-tight uppercase">
                        SẴN SÀNG LẤY LẠI<br/>
                        <span className="bg-[#E5FE40] px-2 inline-block -skew-x-2">BUỔI TỐI</span> CỦA BẠN?
                    </h2>
                    <p className="text-xl text-gray-600 max-w-lg mx-auto mb-10 font-medium">
                        PlanFlowPro không bán cho bạn thêm một "công cụ trống rỗng" nào nữa. Chúng tôi bán cho bạn <strong className="text-black">Sự Kỷ Luật</strong> và <strong className="text-black">Kết Quả Thực Tế</strong>.
                    </p>
                    <button onClick={handleBuyClick} className="w-full md:w-auto bg-black text-[#E5FE40] px-10 py-5 rounded-full font-black text-xl uppercase tracking-widest hover:-translate-y-1 hover:shadow-[0_20px_40px_rgba(0,0,0,0.2)] transition-all">
                        👉 ĐĂNG KÝ MUA NGAY - 149K
                    </button>
                    <p className="mt-6 text-sm font-semibold text-gray-400">Thanh toán 1 lần. Sở hữu vĩnh viễn.</p>
                </div>
            </div>

            {/* Checkout Modal */}
            {showCheckout && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
                        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                            <h3 className="font-black text-xl uppercase tracking-tight">Thanh toán</h3>
                            <button onClick={() => setShowCheckout(false)} className="p-2 hover:bg-gray-200 rounded-full transition-colors">
                                <X size={20} />
                            </button>
                        </div>
                        
                        <div className="p-6">
                            {step === 1 ? (
                                <div className="space-y-6">
                                    <div className="bg-indigo-50 text-indigo-800 p-4 rounded-2xl text-sm font-medium border border-indigo-100">
                                        Nhập thông tin để nhận <strong>Mã kích hoạt App</strong> và <strong>Ebook Hướng dẫn</strong> qua email sau khi thanh toán.
                                    </div>
                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-sm font-bold text-gray-700 mb-1.5 uppercase tracking-wide">Họ và tên</label>
                                            <input type="text" value={customer.name} onChange={e => setCustomer({ ...customer, name: e.target.value })} className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-black focus:border-black transition-all outline-none" placeholder="Nhập tên của bạn" />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-bold text-gray-700 mb-1.5 uppercase tracking-wide">Email nhận hàng</label>
                                            <input type="email" value={customer.email} onChange={e => setCustomer({ ...customer, email: e.target.value })} className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-black focus:border-black transition-all outline-none" placeholder="name@email.com" />
                                        </div>
                                    </div>
                                    <button onClick={handleProceedToPayment} className="w-full bg-black text-white py-4 rounded-xl font-bold text-lg uppercase tracking-wide hover:bg-gray-800 transition-colors">
                                        Tiếp tục thanh toán
                                    </button>
                                </div>
                            ) : (
                                <div className="space-y-6 flex flex-col items-center">
                                    <div className="text-center">
                                        <p className="text-gray-500 font-medium mb-1">Mã đơn hàng của bạn</p>
                                        <div className="text-2xl font-black tracking-widest text-indigo-600 bg-indigo-50 px-4 py-1 rounded-lg inline-block border border-indigo-100">{orderCode}</div>
                                    </div>
                                    
                                    <div className="bg-gray-50 p-4 rounded-3xl border-2 border-dashed border-gray-300">
                                        <img src={qrUrl} alt="Mã QR Thanh Toán" className="w-64 h-64 mx-auto rounded-2xl" />
                                    </div>
                                    
                                    <div className="w-full space-y-2 text-center text-sm font-medium text-gray-600 bg-gray-50 p-4 rounded-2xl border border-gray-100">
                                        <p>Ngân hàng: <strong className="text-black">BIDV</strong></p>
                                        <p>Số tài khoản: <strong className="text-black">96247TESTMOAW123</strong></p>
                                        <p>Chủ TK: <strong className="text-black">CHAU THANH PHONG</strong></p>
                                        <p>Số tiền: <strong className="text-black text-lg">149.000 VNĐ</strong></p>
                                    </div>

                                    <div className="w-full space-y-3 pt-4">
                                        <button onClick={() => {
                                            alert("Cảm ơn bạn! Hệ thống đang xác nhận giao dịch. Vui lòng check email trong ít phút tới.");
                                            navigate('/app');
                                        }} className="w-full bg-[#E5FE40] text-black py-4 rounded-xl font-black text-lg uppercase tracking-wide hover:bg-[#d4ed2e] transition-colors flex items-center justify-center gap-2">
                                            <CheckCircle size={20} /> Tôi đã chuyển khoản
                                        </button>
                                        <button onClick={() => setStep(1)} className="w-full py-3 text-gray-500 font-semibold hover:text-black transition-colors">
                                            Quay lại sửa thông tin
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
