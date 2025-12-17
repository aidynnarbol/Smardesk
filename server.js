// server.js - ОБНОВЛЕННЫЙ С ЛИМИТАМИ API
import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import dotenv from "dotenv";
import OpenAI from "openai";

dotenv.config();

const app = express();
app.use(cors());
app.use(bodyParser.json());

// Подключаем OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// 🔒 СИСТЕМА ЛИМИТОВ
const rateLimits = new Map(); // userId -> { count, resetTime }
const MAX_REQUESTS_PER_DAY = 50; // Максимум запросов в день на пользователя
const COOLDOWN_SECONDS = 5; // Минимум 5 секунд между запросами

function checkRateLimit(userId) {
  const now = Date.now();
  const today = new Date().toISOString().split('T')[0];
  
  if (!rateLimits.has(userId)) {
    rateLimits.set(userId, {
      date: today,
      count: 1,
      lastRequest: now
    });
    return { allowed: true, remaining: MAX_REQUESTS_PER_DAY - 1 };
  }
  
  const userLimits = rateLimits.get(userId);
  
  // Сброс счетчика если новый день
  if (userLimits.date !== today) {
    rateLimits.set(userId, {
      date: today,
      count: 1,
      lastRequest: now
    });
    return { allowed: true, remaining: MAX_REQUESTS_PER_DAY - 1 };
  }
  
  // Проверка дневного лимита
  if (userLimits.count >= MAX_REQUESTS_PER_DAY) {
    return {
      allowed: false,
      remaining: 0,
      reason: `Достигнут дневной лимит (${MAX_REQUESTS_PER_DAY} запросов). Попробуйте завтра.`
    };
  }
  
  // Проверка cooldown
  const timeSinceLastRequest = (now - userLimits.lastRequest) / 1000;
  if (timeSinceLastRequest < COOLDOWN_SECONDS) {
    return {
      allowed: false,
      remaining: userLimits.count,
      reason: `Подождите ${Math.ceil(COOLDOWN_SECONDS - timeSinceLastRequest)} секунд перед следующим запросом.`
    };
  }
  
  // Обновляем счетчики
  userLimits.count++;
  userLimits.lastRequest = now;
  rateLimits.set(userId, userLimits);
  
  return {
    allowed: true,
    remaining: MAX_REQUESTS_PER_DAY - userLimits.count
  };
}

// 🔹 Маршрут общения с GPT
app.post("/api/chat", async (req, res) => {
  try {
    const { message, userId = 'anonymous', type = 'chat', limit = true } = req.body;

    if (!message) {
      return res.status(400).json({ reply: "Пустое сообщение" });
    }

    // Проверяем лимиты только если limit = true
    if (limit) {
      const limitCheck = checkRateLimit(userId || 'anonymous');
      
      if (!limitCheck.allowed) {
        return res.status(429).json({
          reply: `⚠️ ${limitCheck.reason}`,
          limited: true,
          remaining: limitCheck.remaining || 0
        });
      }
      
      console.log(`✅ Request from ${userId}: ${limitCheck.remaining} requests left today`);
    }

    // Определяем system prompt в зависимости от типа
    let systemPrompt;
    if (type === 'insight') {
      systemPrompt = `Ты эксперт-аналитик по продуктивности и здоровью. 
Дай КРАТКИЙ, КОНКРЕТНЫЙ совет (максимум 2-3 предложения).
Говори по делу, без общих фраз.`;
    } else {
      systemPrompt = `Ты умный и доброжелательный ассистент Smardesk. Помогаешь с концентрацией, продуктивностью, осанкой и обучением.

ВАЖНО: Форматируй свои ответы красиво:
- Разбивай длинные ответы на абзацы (используй двойной перенос строки между абзацами)
- Используй списки когда это уместно:
  • Для перечислений используй "- " в начале строки
  • Для шагов используй "1. ", "2. " и т.д.
- Избегай длинных стен текста
- Будь лаконичен но информативен

Пример хорошего ответа:
"Вот несколько советов для улучшения концентрации:

1. Делай перерывы каждые 25 минут
2. Пей достаточно воды
3. Следи за осанкой

Эти простые правила помогут тебе работать эффективнее!"`;
    }

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: systemPrompt,
        },
        { role: "user", content: message },
      ],
      temperature: type === 'insight' ? 0.7 : 0.8,
      max_tokens: type === 'insight' ? 200 : 500,
    });

    const reply = response.choices[0].message.content;
    const remaining = limit ? (rateLimits.get(userId || 'anonymous')?.count || 0) : null;

    res.json({
      reply,
      remaining: remaining !== null ? MAX_REQUESTS_PER_DAY - remaining : null,
      limited: false
    });

  } catch (error) {
    console.error("Ошибка OpenAI:", error);
    res.status(500).json({
      reply: "Ошибка при обращении к OpenAI API.",
      error: error.message
    });
  }
});

// 🔹 Маршрут для проверки лимитов
app.get("/api/limits/:userId", (req, res) => {
  const { userId } = req.params;
  const today = new Date().toISOString().split('T')[0];
  
  if (!rateLimits.has(userId)) {
    return res.json({
      requests: 0,
      remaining: MAX_REQUESTS_PER_DAY,
      resetTime: 'завтра'
    });
  }
  
  const userLimits = rateLimits.get(userId);
  
  if (userLimits.date !== today) {
    return res.json({
      requests: 0,
      remaining: MAX_REQUESTS_PER_DAY,
      resetTime: 'завтра'
    });
  }
  
  res.json({
    requests: userLimits.count,
    remaining: MAX_REQUESTS_PER_DAY - userLimits.count,
    resetTime: 'завтра'
  });
});

const PORT = 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`🔒 Rate limiting enabled: ${MAX_REQUESTS_PER_DAY} requests/day, ${COOLDOWN_SECONDS}s cooldown`);
});