# Live Interpreter - Cantonese ↔ English

Real-time Cantonese/English transcription and translation using whisper.cpp (local) + Gemini API.

## Prerequisites

- macOS with Homebrew
- Node.js 18+
- Gemini API key

## Install whisper.cpp

```bash
brew install whisper-cpp
```

## Download Cantonese Model

```bash
# Create models directory if needed
mkdir -p /opt/homebrew/share/whisper-cpp/models
cd /opt/homebrew/share/whisper-cpp/models

# Download Cantonese-tuned model (recommended)
curl -LO https://huggingface.co/alvanlii/whisper-largev3-cantonese/resolve/main/whisper-large-v3-cantonese.bf16.bin

# Or use the standard large-v3-turbo model
curl -LO https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-large-v3-turbo.bin
```

## Setup

```bash
npm install
```

## Usage

### Start the app

```bash
./start.sh
# or
npm start
```

### Stop the app

```bash
./stop.sh
```

### Manual start

```bash
node server.js
```

Open http://localhost:3004 in your browser.

## How to Use

1. Enter your Gemini API key
2. Click "Start Microphone"
3. Speak in Cantonese or English
4. Transcription + translation appears in real-time

## Route System Audio (Optional)

Want to transcribe YouTube, Zoom, or other system audio instead of microphone?

See [BLACKHOLE_SETUP.md](BLACKHOLE_SETUP.md) for instructions on setting up BlackHole virtual audio.

## Architecture

- **Transcription:** whisper-stream (local, runs on your Mac)
- **Translation:** Gemini 2.0 Flash API

Transcription is free and runs locally. You only pay for Gemini API calls for translation.
