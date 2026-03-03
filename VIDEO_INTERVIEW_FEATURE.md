# AI Video Interview Feature - Implementation Guide

## Overview
The application now includes a Google Meet-style video interview interface with AI avatar, lip-sync animations, and text-to-speech capabilities.

## ✅ What Was Fixed

### 1. Gemini API Chat History Error
**Issue:** `[GoogleGenerativeAI Error]: First content should be with role 'user', got model`

**Solution:**
- Updated chat history building logic to filter out leading AI messages
- Gemini requires the first message in history to always be from 'user'
- Added `systemInstruction` parameter to properly set AI context
- Code location: `/app/api/interview-session/[id]/chat/route.ts`

```typescript
// Remove leading AI/model messages (Gemini requirement)
while (history.length > 0 && history[0].role === 'model') {
  history.shift();
}
```

## 🎥 New Video Interview Features

### 1. AI Avatar Component (`/components/AIAvatar.tsx`)
**Features:**
- Animated avatar with visual speaking indicator
- Real-time mouth animations that sync with speech
- Browser-based text-to-speech (Web Speech API)
- Voice selection based on AI personality (Professional, Friendly, Stern)
- Pulsing glow effect when AI is speaking
- Mute/unmute controls
- Live indicator badge

**How it works:**
- When AI sends a message, it's passed to the avatar component
- Text-to-speech engine speaks the message using selected voice
- Mouth animation syncs with speech using `requestAnimationFrame`
- Green indicator dots show when AI is speaking

### 2. User Video Component (`/components/UserVideo.tsx`)
**Features:**
- Live webcam streaming using WebRTC
- Camera on/off toggle
- Microphone mute/unmute
- Recording indicator
- Placeholder avatar when camera is off
- Permission handling for camera/microphone access

### 3. Updated Interview Interface

**Layout:**
- **Left Side (2/3 width):**
  - Large AI interviewer video at top
  - Your video in picture-in-picture style
  - End interview button
  - Conversation history log

- **Right Side (1/3 width):**
  - Answer mode toggle (Text/Code)
  - Text input or Code editor
  - Submit answer button

**Key Improvements:**
- Google Meet-style layout with proper video sizing
- Live/Recording indicators on both videos
- Professional gradient backgrounds
- Better visual hierarchy
- Mobile-responsive design

## 🎤 Text-to-Speech Integration

### How AI Speech Works:

1. **Message Flow:**
   ```
   User submits answer → API processes → AI response received → 
   Set currentAIMessage → Trigger speech → Animate mouth → 
   Speech complete → Stop animation
   ```

2. **Voice Selection:**
   - Professional personality → Microsoft David / Daniel
   - Friendly personality → Google US English / Samantha
   - Stern personality → Microsoft Zira / Karen
   - Falls back to system default if preferred voice not available

3. **Speech Controls:**
   - Rate: 1.0 (normal speed)
   - Pitch: 1.0 (normal pitch)
   - Volume: Based on mute state
   - Auto-stops when user mutes
   - Cancels previous speech when new message arrives

## 🔧 Browser Compatibility

### Text-to-Speech Support:
- ✅ Chrome/Edge (Best support)
- ✅ Safari (Good support)
- ✅ Firefox (Basic support)
- ⚠️ May need permissions for microphone/camera on first use

### WebRTC Video Support:
- ✅ All modern browsers
- Requires HTTPS in production
- Needs user permission for camera/microphone

## 🚀 Usage Instructions

### For Users:

1. **Start Interview:**
   - Click on an interview session
   - Allow camera/microphone permissions when prompted
   - Your video will appear automatically
   - AI will greet you with spoken audio

2. **During Interview:**
   - Listen to AI questions (audio + text)
   - Toggle camera/mic as needed
   - Answer in text or code mode
   - AI will speak responses automatically

3. **Controls:**
   - **Camera Toggle:** Turn your video on/off
   - **Mic Toggle:** Mute/unmute your microphone
   - **AI Mute:** Silence AI voice (text still shows)
   - **End Interview:** Complete and generate report

### For Developers:

1. **Adding More Voices:**
   Edit `/components/AIAvatar.tsx` in the `speak()` function:
   ```typescript
   const voices = window.speechSynthesis.getVoices();
   // Add custom voice selection logic
   ```

2. **Customizing Animations:**
   Adjust mouth scale range in `animateMouth()`:
   ```typescript
   if (scale >= 1.5) increasing = false; // More exaggerated movement
   ```

3. **Changing Speech Rate:**
   Modify in AIAvatar component:
   ```typescript
   utterance.rate = 1.2; // Faster (0.1 to 10)
   utterance.pitch = 0.8; // Lower pitch (0 to 2)
   ```

## 🎨 Customization Options

### Avatar Appearance:
- Edit gradient colors in `/components/AIAvatar.tsx`
- Change animation effects (pulse, glow, etc.)
- Modify indicator styles

### Video Layout:
- Adjust grid columns in `/app/(homepage)/interview/[id]/page.tsx`
- Change aspect ratios (currently 16:9)
- Reposition picture-in-picture video

## 🔮 Future Enhancements (Optional)

### Advanced Features You Could Add:

1. **Premium Avatar Services:**
   - D-ID API for photorealistic avatars
   - Synthesia for professional video avatars
   - HeyGen for custom AI avatars with better lip-sync

2. **Better Voice Options:**
   - ElevenLabs for ultra-realistic AI voices
   - Google Cloud Text-to-Speech
   - Azure Speech Services
   - Amazon Polly

3. **Recording & Playback:**
   - Save interview video locally
   - Upload to cloud storage (AWS S3, Cloudinary)
   - Playback recorded interviews
   - Video highlights of key moments

4. **Real-time Features:**
   - Live transcription/captions
   - Voice activity detection
   - Background blur/virtual backgrounds
   - Screen sharing for code interviews

## 📝 Code Changes Summary

### Files Created:
1. `/components/AIAvatar.tsx` - AI interviewer video component
2. `/components/UserVideo.tsx` - User webcam component

### Files Modified:
1. `/app/api/interview-session/[id]/chat/route.ts`:
   - Fixed Gemini chat history validation
   - Added proper systemInstruction handling
   - Removed duplicate system prompt in messages

2. `/app/(homepage)/interview/[id]/page.tsx`:
   - Added AI avatar and user video components
   - Integrated text-to-speech functionality
   - Updated layout to Google Meet style
   - Added speech state management

## 🐛 Troubleshooting

### Issue: AI not speaking
- **Check:** Browser supports Web Speech API
- **Fix:** Use Chrome/Edge for best compatibility
- **Alternative:** Integrate external TTS service

### Issue: Camera not working
- **Check:** Browser permissions granted
- **Check:** HTTPS connection (required for video)
- **Fix:** Accept camera permission when prompted

### Issue: No voices available
- **Check:** `window.speechSynthesis.getVoices()` returns empty
- **Fix:** Wait for voices to load, add event listener:
  ```javascript
  speechSynthesis.onvoiceschanged = () => {
    // Voices are now loaded
  };
  ```

### Issue: Speech cuts off
- **Check:** Message too long
- **Fix:** Browser may have speech length limits (varies by browser)
- Consider chunking long messages

## 🎯 Testing Checklist

- [x] AI greeting message plays with audio
- [x] First question speaks automatically
- [x] Mouth animation syncs with speech
- [x] User can mute/unmute AI voice
- [x] Camera toggles work correctly
- [x] Microphone toggles work correctly
- [x] Conversation log updates properly
- [x] Interview can be ended successfully
- [x] Layout is responsive on mobile

## 📚 Technical Stack

- **Frontend:** React, Next.js 16, TypeScript
- **Video:** WebRTC (navigator.mediaDevices)
- **Audio:** Web Speech API (SpeechSynthesis)
- **AI:** Google Gemini API
- **Styling:** TailwindCSS
- **Animations:** CSS + requestAnimationFrame

---

## 🚀 Quick Start

The video interview feature is now live! Just:
1. Refresh your browser
2. Start or continue an interview session
3. Allow camera/microphone permissions
4. Enjoy the immersive AI interview experience!

The AI will now speak to you with voice while showing animated avatar reactions, creating a much more engaging and realistic interview experience.
