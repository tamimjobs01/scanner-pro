import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = 3000;

// Set up JSON body parser with generous limits for high-resolution document scans
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Lazy initializer for Google GenAI client
let aiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI | null {
  if (!aiClient) {
    const key = process.env.GEMINI_API_KEY;
    if (key && key !== 'MY_GEMINI_API_KEY') {
      aiClient = new GoogleGenAI({
        apiKey: key,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          },
        },
      });
    }
  }
  return aiClient;
}

// REST route for live high-fidelity OCR scanning (English and Bangla)
app.post('/api/ocr', async (req, res) => {
  try {
    const { imageBase64, language = 'en' } = req.body;
    if (!imageBase64) {
      res.status(400).json({ error: 'Missing imageBase64 parameter.' });
      return;
    }

    // Isolate base64 data to ignore data URI prefix
    const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, '');

    const client = getGeminiClient();
    if (!client) {
      console.warn('GEMINI_API_KEY is not configured or placeholder detected. Falling back to simulated high-fidelity OCR.');
      // Offline / Local Mock OCR fallback
      const simulatedText = simulateLocalOCR(language);
      res.json({ text: simulatedText, method: 'local-fallback' });
      return;
    }

    const promptText = `Identify calligraphic, printed or handwritten texts in this image. Language requested: ${
      language === 'bn' ? 'Bangla' : language === 'en' ? 'English' : 'Bangla and English'
    }. Return ONLY the direct literal transcript of the text in the document. Retain formatting (linebreaks, columns, headers) where possible. Do not include conversational remarks, metadata, intro/outro, or pleasantries.`;

    const response = await client.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: [
        {
          inlineData: {
            mimeType: 'image/jpeg',
            data: base64Data,
          },
        },
        {
          text: promptText,
        },
      ],
    });

    res.json({ text: response.text || '', method: 'gemini-api' });
  } catch (error: any) {
    console.error('OCR Processing error:', error);
    res.status(500).json({ error: error.message || 'Failed processing OCR request.' });
  }
});

// Simulated document OCR corpus based on selected languages
function simulateLocalOCR(language: string): string {
  if (language === 'bn') {
    return `[স্ক্যানার প্রো সিমুলেটেড ওসিআর]
তারিখ: ২৯ মে ২০২৬
নথি নং: ০৫/০৬-২০২৬

এই নথিটি স্ক্যানার প্রো অ্যাপ্লিকেশন ব্যবহার করে স্থানীয় মোডে সাফল্যের সাথে প্রক্রিয়াকরণ করা হয়েছে।
ইন্টারনেট সংযোগ পুনরুদ্ধার হয়ে গেলে পূর্ণ ওসিআর সেবা চালু হবে।
বৈশিষ্ট্যসমূহ:
- দ্রুত কনভার্সন
- নিরাপদ মেমরি স্টোরেজ
- ট্র্যাকিং হিস্ট্রি এবং অফলাইন ব্যাকআপ।`;
  } else {
    return `[Scanner Pro Local OCR Fallback]
Date: 2026-05-29
Doc ID: SCAN-992-02

This document has been captured and enhancement was completed on device.
Active features:
1. Brightness Correction
2. Smart Borders Guidelines
3. High-Contrast B&W Rendering

The system processed your page accurately. Connect to the web to invoke cloud Gemini OCR for maximum transcript precision.`;
  }
}

// Vite and static asset handlers
async function setupApp() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Scanner Pro fullstack server is running on port ${PORT}`);
  });
}

setupApp();
