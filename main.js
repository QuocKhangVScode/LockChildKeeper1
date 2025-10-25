// main.js - ĐÃ SỬA ĐỔI CHO VERSEL
// Sử dụng cú pháp CommonJS (require/module.exports) cho Serverless Function

const express = require("express");
const fetch = require("node-fetch");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const dotenv = require("dotenv"); // Cần thiết cho local, nhưng sẽ bị bỏ qua trên Vercel

// Chỉ chạy dotenv.config() khi chạy cục bộ
// Trên Vercel, các biến môi trường được inject trực tiếp
if (process.env.NODE_ENV !== 'production') {
    dotenv.config();
}

const app = express();

// ✅ Cấu hình bảo mật & CORS
app.use(helmet());
app.use(cors({
  origin: [
    "http://127.0.0.1:5500",
    "http://localhost:5500",
    "http://localhost:5173",
    // ⚠️ LƯU Ý: Nếu đã triển khai, hãy thêm URL Vercel của bạn vào đây,
    // hoặc giữ '*' nếu bạn chắc chắn
    "*" 
  ],
  methods: ["GET", "POST"],
  allowedHeaders: ["Content-Type", "Authorization"],
}));

// ✅ Cho phép đọc JSON trong body
app.use(express.json());

// 🛑 Loại bỏ app.use(express.static("."));

// ✅ Giới hạn số lượng request (tránh spam)
const limiter = rateLimit({
  windowMs: 60 * 1000, // 1 phút
  max: 60,             // tối đa 60 request/phút
});
app.use(limiter);

// ✅ Lấy API key từ process.env (Vercel sẽ cung cấp)
const API_KEY = process.env.API_KEY;
if (!API_KEY) {
  // 🛑 KHÔNG DÙNG process.exit(1) trên Vercel, chỉ log lỗi
  console.error("❌ Thiếu API_KEY. Vui lòng thêm vào Vercel Environment Variables!");
}

// ✅ URL đến Gemini API
const MODEL_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=" + API_KEY;

// ✅ Endpoint cho frontend gọi
app.post("/analyze", async (req, res) => {
  try {
    if (!API_KEY) {
        return res.status(500).json({ error: "Lỗi cấu hình máy chủ: Thiếu API Key" });
    }
    
    console.log("📩 Nhận request từ client:", req.body);

    const response = await fetch(MODEL_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(req.body),
    });

    const data = await response.json();
    console.log("🔹 Phản hồi từ Gemini:", JSON.stringify(data, null, 2));

    // Xử lý lỗi từ Gemini API
    if (response.status !== 200) {
        return res.status(response.status).json(data);
    }

    res.json(data);
  } catch (err) {
    console.error("❌ Lỗi proxy:", err);
    res.status(500).json({ error: "Lỗi máy chủ nội bộ" });
  }
});

// ✅ Route gốc (Tùy chọn, để kiểm tra)
app.get("/", (req, res) => {
  res.send("API Proxy đang chạy trên Vercel!");
});

// 🛑 QUAN TRỌNG: Export ứng dụng Express để Vercel sử dụng
module.exports = app;

// 🛑 Xóa app.listen(3000, "0.0.0.0", ...)
