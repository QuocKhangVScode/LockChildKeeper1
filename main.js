const express = require("express");
const fetch = require("node-fetch");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const dotenv = require("dotenv"); 

// Chỉ chạy dotenv.config() khi chạy cục bộ. Trên Vercel, biến môi trường được inject.
if (process.env.NODE_ENV !== 'production') {
    dotenv.config();
}

const app = express();

app.use(helmet());
app.use(cors({
    origin: ["http://127.0.0.1:5500", "http://localhost:5500", "http://localhost:5173", "*"],
    methods: ["GET", "POST"],
    allowedHeaders: ["Content-Type", "Authorization"],
}));

app.use(express.json());

const limiter = rateLimit({
    windowMs: 60 * 1000, 
    max: 60,             
});
app.use(limiter);

const API_KEY = process.env.API_KEY;
if (!API_KEY) {
    console.error("❌ Thiếu API_KEY. Vui lòng thêm vào Vercel Environment Variables!");
}

const MODEL_URL =
    "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=" + API_KEY;

app.post("/analyze", async (req, res) => {
    try {
        if (!API_KEY) {
            return res.status(500).json({ error: "Lỗi cấu hình máy chủ: Thiếu API Key" });
        }
        
        const response = await fetch(MODEL_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(req.body),
        });

        const data = await response.json();

        if (response.status !== 200) {
            return res.status(response.status).json(data);
        }

        res.json(data);
    } catch (err) {
        console.error("❌ Lỗi proxy:", err);
        res.status(500).json({ error: "Lỗi máy chủ nội bộ" });
    }
});

app.get("/", (req, res) => {
    res.send("API Proxy đang chạy trên Vercel!");
});

// BẮT BUỘC: Export ứng dụng Express cho Vercel
module.exports = app;
