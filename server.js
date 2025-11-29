import express from 'express';
import { WebSocketServer } from 'ws';
import { createServer } from 'http';
import { spawn } from 'child_process';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const server = createServer(app);
const wss = new WebSocketServer({ server });

app.use(express.static(join(__dirname, 'public')));

const WHISPER_MODEL = '/opt/homebrew/share/whisper-cpp/models/whisper-large-v3-cantonese.bf16.bin';

wss.on('connection', (ws) => {
  console.log('Client connected');
  let apiKey = null;
  let model = null;
  let whisperProcess = null;

  ws.on('message', async (message) => {
    try {
      const data = JSON.parse(message);

      if (data.type === 'setApiKey') {
        apiKey = data.apiKey;
        try {
          const genAI = new GoogleGenerativeAI(apiKey);
          model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
          await model.generateContent('test');
          ws.send(JSON.stringify({ type: 'apiKeySet', success: true }));
          console.log('API key validated');
        } catch (err) {
          ws.send(JSON.stringify({ type: 'error', message: 'Invalid API key: ' + err.message }));
        }
        return;
      }

      if (data.type === 'startWhisper' && model) {
        if (whisperProcess) {
          whisperProcess.kill();
        }

        console.log('Starting whisper-stream...');
        whisperProcess = spawn('whisper-stream', [
          '-m', WHISPER_MODEL,
          '-l', 'auto',
          '--step', '2000',
          '--length', '5000',
          '--keep', '500',
          '-vth', '0.8'  // Higher VAD threshold to reduce false positives
        ]);
        
        // Common whisper hallucinations during silence
        const HALLUCINATIONS = new Set([
          'thank you', 'thanks', 'thank you.', 'thanks.',
          'you', 'bye', 'bye.', 'goodbye', 'goodbye.',
          'the end', 'the end.', '...',
          'thanks for watching', 'thanks for watching.',
          'subscribe', 'like and subscribe'
        ]);

        let buffer = '';

        whisperProcess.stdout.on('data', async (chunk) => {
          const text = chunk.toString();
          buffer += text;
          
          // Process complete lines
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            // Remove ANSI escape codes and clean up
            const cleaned = line
              .replace(/\x1b\[[0-9;]*[a-zA-Z]/g, '')  // Remove ANSI escape codes
              .replace(/\[2K/g, '')                    // Remove [2K clear codes
              .replace(/\[\d+[A-Za-z]/g, '')           // Remove other bracket codes
              .trim();
            
            // Skip empty lines, whisper status messages, and hallucinations
            if (!cleaned || 
                cleaned.startsWith('[') || 
                cleaned.includes('whisper_') || 
                cleaned.includes('init:') ||
                cleaned.includes('auto-detected') ||
                HALLUCINATIONS.has(cleaned.toLowerCase()) ||
                cleaned.length < 3) {
              continue;
            }
            
            console.log('Transcribed:', cleaned);
            ws.send(JSON.stringify({ type: 'transcription', text: cleaned }));

            // Translate with Gemini
            try {
              const hasChineseChars = /[\u4e00-\u9fff]/.test(cleaned);
              const direction = hasChineseChars ? 'cantonese-to-english' : 'english-to-cantonese';
              const targetLang = hasChineseChars ? 'English' : 'Cantonese (traditional Chinese characters)';
              
              const result = await model.generateContent(
                `Translate to ${targetLang}. Return ONLY the translation, nothing else:\n\n${cleaned}`
              );
              const translated = result.response.text().trim();
              
              ws.send(JSON.stringify({
                type: 'translation',
                original: cleaned,
                translated,
                direction
              }));
            } catch (err) {
              console.error('Translation error:', err.message);
            }
          }
        });

        whisperProcess.stderr.on('data', (data) => {
          const msg = data.toString();
          // Only log non-routine messages
          if (!msg.includes('whisper_') && !msg.includes('init')) {
            console.log('Whisper:', msg);
          }
        });

        whisperProcess.on('close', (code) => {
          console.log('Whisper process exited with code', code);
          ws.send(JSON.stringify({ type: 'whisperStopped' }));
          whisperProcess = null;
        });

        ws.send(JSON.stringify({ type: 'whisperStarted' }));
        return;
      }

      if (data.type === 'stopWhisper') {
        if (whisperProcess) {
          console.log('Stopping whisper-stream...');
          whisperProcess.kill('SIGKILL');  // Force kill
          whisperProcess = null;
        }
        ws.send(JSON.stringify({ type: 'whisperStopped' }));
        return;
      }

      // Manual text translation
      if (data.type === 'translate' && model) {
        const hasChineseChars = /[\u4e00-\u9fff]/.test(data.text);
        const direction = hasChineseChars ? 'cantonese-to-english' : 'english-to-cantonese';
        const targetLang = hasChineseChars ? 'English' : 'Cantonese (traditional Chinese characters)';
        
        const result = await model.generateContent(
          `Translate to ${targetLang}. Return ONLY the translation, nothing else:\n\n${data.text}`
        );
        ws.send(JSON.stringify({
          type: 'translation',
          original: data.text,
          translated: result.response.text().trim(),
          direction
        }));
      }
    } catch (error) {
      console.error('Error:', error.message);
    }
  });

  ws.on('close', () => {
    if (whisperProcess) {
      whisperProcess.kill('SIGKILL');
      whisperProcess = null;
    }
    console.log('Client disconnected');
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
