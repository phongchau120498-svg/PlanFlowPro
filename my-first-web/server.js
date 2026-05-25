/**
 * PlanFlowPro — Express production server
 * Nhận Webhook từ Sepay, gửi Email qua Resend
 */
import 'dotenv/config';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = Number(process.env.PORT) || 3000;

const app = express();
app.use(express.json({ limit: '1mb' }));

/** Health check */
app.get('/api/health', (_req, res) => {
  res.json({ ok: true, service: 'PlanFlowPro' });
});

/* ── Sepay Webhook & Resend Email ── */
app.post('/api/sepay/webhook', async (req, res) => {
  try {
    const { content, transferAmount } = req.body;
    if (!content) return res.json({ success: true });

    // Trích xuất mã đơn hàng, ví dụ "MOAW PFP123456"
    const match = content.match(/PFP\d+/i);
    if (!match) return res.json({ success: true });
    
    const orderCode = match[0].toUpperCase();
    
    // Cập nhật trạng thái Supabase của PlanFlowPro (Hardcode URL & Key theo checkout.html)
    const PLANPRO_SUPABASE_URL = "https://kivzurhuxsxwvdugujjg.supabase.co";
    const PLANPRO_SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imtpdnp1cmh1eHN4d3ZkdWd1ampnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc2NzQ5NzcsImV4cCI6MjA4MzI1MDk3N30.uF3VHSmpa8HJRs2XT98ZmgrZE7rpE2m9VakUHD64Lpg";
    
    const updateRes = await fetch(`${PLANPRO_SUPABASE_URL}/rest/v1/orders?order_code=eq.${orderCode}`, {
      method: 'PATCH',
      headers: {
        'apikey': PLANPRO_SUPABASE_KEY,
        'Authorization': `Bearer ${PLANPRO_SUPABASE_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      },
      body: JSON.stringify({ status: 'paid' })
    });
    
    const updatedOrders = await updateRes.json();
    
    // Nếu cập nhật thành công, gửi email qua Resend
    if (updatedOrders && updatedOrders.length > 0) {
      const order = updatedOrders[0];
      
      const emailHtml = `
        <div style="font-family: 'Inter', sans-serif; color: #111; line-height: 1.6; max-width: 600px; margin: 0 auto; border: 4px solid #000; padding: 20px; border-radius: 12px; box-shadow: 8px 8px 0px #000;">
          <h2 style="text-transform: uppercase; margin-top: 0; font-size: 24px; font-weight: 900;">CHÀO ĐỒNG ĐỘI, ${order.name}!</h2>
          <p style="font-size: 16px; font-weight: 500;">Giao dịch thành công! Vũ khí của bạn đã sẵn sàng để trang bị. Đã đến lúc chúng ta bắt tay vào việc rồi!</p>
          
          <div style="margin: 30px 0; text-align: center;">
            <a href="https://kivzurhuxsxwvdugujjg.supabase.co/storage/v1/object/public/products/PlanFlowPro-Final.zip" style="display: inline-block; font-weight: 900; color: #000; background: #E5FE40; padding: 15px 30px; text-decoration: none; border-radius: 100px; border: 2px solid #000; font-size: 18px; text-transform: uppercase;">👉 TẢI PLANFLOWPRO VỀ NGAY 🚀</a>
          </div>

          <p style="font-size: 16px; font-weight: 700; color: #d32f2f;">Lưu ý nhỏ từ Ngỗng Đại Ca:</p>
          <ul style="font-size: 15px; font-weight: 500;">
            <li>Hãy đọc thật kỹ file <strong>SOP Hướng dẫn</strong> trước khi sử dụng. Đừng làm qua loa, hệ thống chỉ phát huy tối đa sức mạnh khi bạn thực sự tuân thủ kỷ luật!</li>
            <li>Lưu lại email này để sử dụng link tải bất cứ khi nào có bản cập nhật mới nhé.</li>
          </ul>

          <p style="font-size: 15px; border-top: 2px dashed #ccc; padding-top: 15px; margin-top: 20px;">Nếu gặp khó khăn khi cài đặt, nhắn ngay cho mình qua Zalo: <a href="https://zalo.me/moawmoaws" style="color: #000; font-weight: bold;">moawmoaws</a> hoặc hello@moawmoaws.beauty</p>
          
          <p style="font-size: 18px; font-weight: 900; margin-bottom: 0;">Không chần chừ nữa, bật máy lên và dọn sạch các task hôm nay đi!</p>
          <p style="font-size: 16px; font-weight: 700; margin-top: 5px;">Ngỗng Đại Ca 🦆💼</p>
        </div>
      `;

      try {
        const resendRes = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            from: 'Moaws <hello@moawmoaws.beauty>', 
            to: [order.email],
            subject: "🎉 PlanFlowPro — File của bạn đã sẵn sàng",
            html: emailHtml
          })
        });
        
        const resendData = await resendRes.json();
        console.log(`[Resend] Sent success email for order ${orderCode}:`, resendData);
      } catch (emailErr) {
        console.error(`[Resend Error] Failed to send email for order ${orderCode}:`, emailErr);
      }
    }

    res.json({ success: true });
  } catch (err) {
    console.error("[Sepay Webhook Error]:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 PlanFlowPro Server is running on port ${PORT}`);
});
