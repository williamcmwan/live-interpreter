let ws;
let isListening = false;

const apiKeyInput = document.getElementById('apiKey');
const saveKeyBtn = document.getElementById('saveKey');
const startBtn = document.getElementById('startDesktop');
const stopBtn = document.getElementById('stop');
const statusEl = document.getElementById('status');
const originalEl = document.getElementById('original');
const translationEl = document.getElementById('translation');
const manualTextInput = document.getElementById('manualText');
const translateBtn = document.getElementById('translateBtn');

// Update button text
startBtn.textContent = '🎙️ Start Microphone';

function connectWS() {
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  ws = new WebSocket(`${protocol}//${window.location.host}`);
  
  ws.onopen = () => {
    statusEl.textContent = 'Connected. Enter API key to start.';
    const savedKey = localStorage.getItem('geminiApiKey');
    if (savedKey) {
      ws.send(JSON.stringify({ type: 'setApiKey', apiKey: savedKey }));
    }
  };
  
  ws.onmessage = (event) => {
    const data = JSON.parse(event.data);
    
    if (data.type === 'apiKeySet') {
      statusEl.textContent = '✅ Ready! Click Start Microphone.';
      statusEl.style.background = 'rgba(76,175,80,0.3)';
      startBtn.disabled = false;
      translateBtn.disabled = false;
    } else if (data.type === 'whisperStarted') {
      statusEl.textContent = '🎙️ Listening via whisper-stream...';
      statusEl.style.background = 'rgba(156,39,176,0.3)';
      isListening = true;
      startBtn.disabled = true;
      stopBtn.disabled = false;
      translateBtn.disabled = true;
    } else if (data.type === 'transcription') {
      statusEl.textContent = '🎙️ ' + data.text.substring(0, 60) + '...';
    } else if (data.type === 'translation') {
      addTranslation(data.original, data.translated, data.direction);
    } else if (data.type === 'whisperStopped') {
      statusEl.textContent = '⏹️ Stopped';
      statusEl.style.background = 'rgba(255,255,255,0.1)';
      isListening = false;
      startBtn.disabled = false;
      stopBtn.disabled = true;
      translateBtn.disabled = false;
    } else if (data.type === 'error') {
      statusEl.textContent = '❌ ' + data.message;
      statusEl.style.background = 'rgba(244,67,54,0.3)';
    }
  };
  
  ws.onerror = (err) => console.error('WebSocket error:', err);
  ws.onclose = () => setTimeout(connectWS, 2000);
}
connectWS();

// Save API Key
saveKeyBtn.onclick = () => {
  const apiKey = apiKeyInput.value.trim();
  if (!apiKey) return alert('Please enter an API key');
  ws.send(JSON.stringify({ type: 'setApiKey', apiKey }));
  localStorage.setItem('geminiApiKey', apiKey);
};

const savedKey = localStorage.getItem('geminiApiKey');
if (savedKey) apiKeyInput.value = savedKey;

// Manual text translation
translateBtn.onclick = () => {
  const text = manualTextInput.value.trim();
  if (!text) return;
  if (ws.readyState === WebSocket.OPEN) {
    statusEl.textContent = '📤 Translating...';
    ws.send(JSON.stringify({ type: 'translate', text }));
    manualTextInput.value = '';
  }
};
manualTextInput.onkeypress = (e) => { if (e.key === 'Enter') translateBtn.click(); };

// Start whisper-stream
startBtn.onclick = () => {
  if (ws.readyState === WebSocket.OPEN) {
    statusEl.textContent = '🎙️ Starting whisper-stream...';
    ws.send(JSON.stringify({ type: 'startWhisper' }));
  }
};

// Stop
stopBtn.onclick = () => {
  if (ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify({ type: 'stopWhisper' }));
  }
};

// Add translation to display
function addTranslation(original, translated, direction) {
  const arrow = direction === 'cantonese-to-english' ? '粵→EN' : 'EN→粵';
  
  const origDiv = document.createElement('div');
  origDiv.style.cssText = 'padding:10px;margin-bottom:10px;background:rgba(255,255,255,0.1);border-radius:8px';
  origDiv.innerHTML = `<small style="opacity:0.6">${arrow}</small> ${original}`;
  originalEl.insertBefore(origDiv, originalEl.firstChild);
  
  const transDiv = document.createElement('div');
  transDiv.style.cssText = 'padding:10px;margin-bottom:10px;background:rgba(76,175,80,0.2);border-radius:8px';
  transDiv.textContent = translated;
  translationEl.insertBefore(transDiv, translationEl.firstChild);
  
  while (originalEl.children.length > 20) {
    originalEl.removeChild(originalEl.lastChild);
    translationEl.removeChild(translationEl.lastChild);
  }
}
