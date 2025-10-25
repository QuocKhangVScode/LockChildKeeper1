// main.js - Tối ưu hóa cho Vercel (CommonJS)

const express = require("express");
// 🛑 Đã xóa: const fetch = require("node-fetch"); - Dùng fetch gốc của Node.js
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const dotenv = require("dotenv");

// Chỉ chạy dotenv.config() khi chạy cục bộ
if (process.env.NODE_ENV !== 'production') { 
    dotenv.config();
}

const app = express();

// ... (Giữ nguyên các cấu hình khác)

// ✅ URL đến Gemini API
const API_KEY = process.env.API_KEY;

// Kiểm tra và thoát nếu thiếu API Key
if (!API_KEY) {
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

    // SỬ DỤNG FETCH GỐC
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
