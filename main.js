// main.js
// Sử dụng require thay vì import để đảm bảo tính tương thích rộng hơn trong môi trường Node.js Serverless
const express = require("express");
const fetch = require("node-fetch");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const dotenv = require("dotenv");

dotenv.config();

const app = express();

// ✅ Cấu hình bảo mật & CORS
app.use(helmet());
app.use(cors({
  origin: [
    "http://127.0.0.1:5500",
    "http://localhost:5500",
    "http://localhost:5173",
    // ⚠️ LƯU Ý: Thay thế dấu '*' bằng tên miền frontend của bạn khi triển khai.
    // "*" // 👈 Xóa dòng này nếu không cần truy cập từ Android hoặc môi trường dev
  ],
  methods: ["GET", "POST"],
  allowedHeaders: ["Content-Type", "Authorization"],
}));

// ✅ Cho phép đọc JSON trong body
app.use(express.json());

// ✅ Loại bỏ express.static(".") vì Vercel không xử lý tài nguyên tĩnh trong Serverless Function
// app.use(express.static(".")); 

// ✅ Giới hạn số lượng request (tránh spam)
const limiter = rateLimit({
  windowMs: 60 * 1000, // 1 phút
  max: 60,             // tối đa 60 request/phút
});
app.use(limiter);

// ✅ Lấy API key từ .env
const API_KEY = process.env.API_KEY;
if (!API_KEY) {
  // Trong Vercel, console.error sẽ ghi lại log lỗi
  console.error("❌ Chưa có API_KEY. Vui lòng thêm vào Vercel Environment Variables!");
  // Không exit(1) nữa để Vercel Builder có thể hoàn thành, nhưng API sẽ không hoạt động nếu thiếu key.
}

// ✅ URL đến Gemini API
const MODEL_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=" + API_KEY;

// ✅ Endpoint cho frontend gọi
app.post("/analyze", async (req, res) => {
  try {
    console.log("📩 Nhận request từ client:", req.body);
    
    // Kiểm tra API Key một lần nữa
    if (!API_KEY) {
        return res.status(500).json({ error: "Lỗi cấu hình máy chủ: Thiếu API Key" });
    }

    const response = await fetch(MODEL_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(req.body),
    });

    const data = await response.json();
    console.log("🔹 Phản hồi từ Gemini:", JSON.stringify(data, null, 2));

    // Xử lý lỗi từ Gemini API (ví dụ: INVALID_ARGUMENT)
    if (response.status !== 200) {
        return res.status(response.status).json(data);
    }

    res.json(data);
  } catch (err) {
    console.error("❌ Lỗi proxy:", err);
    res.status(500).json({ error: "Lỗi máy chủ nội bộ" });
  }
});

// ✅ Route gốc (Tùy chọn, dùng để kiểm tra API đã chạy chưa)
app.get("/", (req, res) => {
  res.send("API Proxy đang chạy trên Vercel!");
});

// 🛑 QUAN TRỌNG: Thay vì app.listen, chúng ta export app ra
// module.exports = app;
// Nếu bạn sử dụng syntax ES Module:
export default app;