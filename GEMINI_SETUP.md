# Gemini API Setup Guide

## ✅ What Changed

The interview system now uses **Google Gemini API (FREE)** instead of OpenAI. Gemini Pro is free for up to 60 requests per minute!

## 🔑 Get Your Free Gemini API Key

1. **Visit Google AI Studio**
   - Go to: https://makersuite.google.com/app/apikey
   - Or: https://aistudio.google.com/app/apikey

2. **Sign in with Google Account**
   - Use your personal or work Google account

3. **Create API Key**
   - Click "Create API Key"
   - Select "Create API key in new project" (or use existing)
   - Copy your API key (starts with `AIza...`)

4. **Add to Environment Variables**
   ```bash
   # In your .env file
   GEMINI_API_KEY="AIzaSy..."
   ```

## 🚀 Getting Started

### 1. Install Dependencies (Already Done)
```bash
npm install @google/generative-ai
```

### 2. Configure Environment Variables
Copy `.env.example` to `.env` and add your Gemini API key:
```env
GEMINI_API_KEY="your-gemini-api-key-here"
```

### 3. Start Development Server
```bash
npm run dev
```

### 4. Test the Interview
1. Navigate to: http://localhost:3000/interview/start
2. Select interview type and AI interviewer
3. Start the interview
4. The AI should greet you and ask questions using Gemini!

## 🆓 Gemini Free Tier

**Gemini Pro (Free):**
- **60 requests per minute** (RPM)
- **Model version**: gemini-pro
- **Free forever** - no credit card required
- **Perfect for development and small projects**

**What You Get:**
- Text generation
- Conversation/chat
- Code analysis
- Content analysis
- JSON responses

## 🔄 Key Changes Made

### API Routes Updated
1. **`/app/api/interview-session/[id]/chat/route.ts`**
   - ✅ Replaced OpenAI with Google Gemini
   - ✅ Uses `gemini-pro` model
   - ✅ Maintains conversation history

2. **`/app/api/interview-session/[id]/generate-report/route.ts`**
   - ✅ Replaced OpenAI with Google Gemini
   - ✅ Generates JSON reports
   - ✅ Analyzes interview performance

### Interview Start Fixed
3. **`/app/(homepage)/interview/[id]/page.tsx`**
   - ✅ Fixed interview initialization flow
   - ✅ Proper session status handling
   - ✅ Greeting + first question sequence

### Environment Variables
4. **`.env.example`**
   - ✅ Replaced `OPENAI_API_KEY` with `GEMINI_API_KEY`
   - ✅ Added setup instructions

## 🎯 How It Works

### Chat API
```typescript
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

// Start conversation with history
const chat = model.startChat({ history });
const result = await chat.sendMessage(userMessage);
const aiResponse = result.response.text();
```

### Report Generation
```typescript
const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
const result = await model.generateContent(analysisPrompt);
const reportData = JSON.parse(result.response.text());
```

## 🐛 Troubleshooting

### Interview Not Starting?
**Fixed!** The interview initialization flow has been improved:
1. Session status changes from `pending` to `in-progress`
2. AI greeting is displayed
3. First question is fetched after 2-second delay
4. Conversation begins

### API Key Issues?
1. **Check your `.env` file** - Ensure `GEMINI_API_KEY` is set
2. **Restart dev server** - Changes to `.env` require restart
3. **Verify API key** - Test at https://aistudio.google.com
4. **Check console** - Look for error messages in browser/terminal

### JSON Parsing Errors?
Gemini sometimes wraps JSON in markdown code blocks. The code handles this:
```typescript
// Extracts JSON even if wrapped in ```json ... ```
let jsonText = responseText;
if (responseText.includes('```json')) {
  jsonText = responseText.split('```json')[1].split('```')[0].trim();
}
```

### Rate Limits?
Free tier: 60 requests/minute
- If exceeded, requests will fail
- Wait 60 seconds and try again
- For production, consider implementing request queuing

## 🎨 Features Still Working

All features remain functional:
- ✅ Real-time AI conversations
- ✅ Multi-personality interviewers
- ✅ Code editor with syntax highlighting
- ✅ Conversation logging
- ✅ Report generation
- ✅ Skill breakdown analysis
- ✅ Strengths & weaknesses identification

## 📚 Gemini Documentation

- **Main Docs**: https://ai.google.dev/docs
- **API Reference**: https://ai.google.dev/api/rest
- **Node.js SDK**: https://github.com/google/generative-ai-js
- **Examples**: https://ai.google.dev/tutorials/node_quickstart

## 🆚 Gemini vs OpenAI

| Feature | Gemini Pro (Free) | OpenAI GPT-4 |
|---------|-------------------|--------------|
| Cost | FREE | $0.03/1K tokens |
| Rate Limit | 60 RPM | Pay as you go |
| Setup | API key only | API key + billing |
| Quality | Excellent | Excellent |
| JSON Mode | Manual parsing | Native support |
| Context Window | 30K tokens | 8K tokens |

## 🔐 Security Notes

- ✅ API key stored in `.env` (gitignored)
- ✅ Server-side API calls only
- ✅ User authentication required
- ✅ No API key exposed to client

## 🎉 Ready to Go!

You're all set! Start an interview and experience AI-powered interview practice with Google Gemini.

**Need Help?**
- Check the console for errors
- Verify your Gemini API key
- Make sure database is seeded
- Restart the dev server

Happy interviewing! 🚀
