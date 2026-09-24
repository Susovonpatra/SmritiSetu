import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';

import { geoipLocaleMiddleware } from './middleware/geoipMiddleware.js';
import localeRoutes from './routes/localeRoutes.js';
import ttsRoutes from './routes/ttsRoutes.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5001;

// Middlewares
app.use(cors({
  origin: true, // Allow frontend origin
  credentials: true // Allow cookies
}));
app.use(cookieParser());
app.use(express.json());

// Apply GeoIP locale detection to all API requests
app.use(geoipLocaleMiddleware);

// Routes
app.use('/api/v1/locale', localeRoutes);
app.use('/api/v1/tts', ttsRoutes);

// Health Check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'SmritiSetu Express GeoIP & TTS Service',
    detectedLocale: req.localeInfo
  });
});

app.listen(PORT, () => {
  console.log(`[SmritiSetu Engine] Express GeoIP & TTS server running on http://127.0.0.1:${PORT}`);
});

export default app;
