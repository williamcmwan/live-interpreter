# BlackHole Setup - Route System Audio to Microphone Input

BlackHole is a virtual audio driver that lets you route system audio (YouTube, Zoom, etc.) to whisper-stream as if it were microphone input.

## Install BlackHole

```bash
brew install blackhole-2ch
```

Or download from: https://existential.audio/blackhole/

## Setup Multi-Output Device

This lets you hear audio AND route it to whisper-stream simultaneously.

1. Open **Audio MIDI Setup** (search in Spotlight)
2. Click **+** button (bottom left) → **Create Multi-Output Device**
3. Check both:
   - Your speakers/headphones (e.g., "MacBook Pro Speakers")
   - **BlackHole 2ch**
4. Right-click the Multi-Output Device → **Use This Device For Sound Output**

## Configure whisper-stream Input

1. Open **System Settings** → **Sound** → **Input**
2. Select **BlackHole 2ch** as input device

Or find the device ID and use it with whisper-stream:

```bash
# List audio devices
whisper-stream --capture -1

# Use specific device (replace N with BlackHole device ID)
whisper-stream -m /opt/homebrew/share/whisper-cpp/models/whisper-large-v3-cantonese.bf16.bin -c N
```

## Test It

1. Play audio from any app (YouTube, Spotify, etc.)
2. Run whisper-stream - it should transcribe the system audio
3. Start the Live Interpreter app

## Revert to Normal

To switch back to normal microphone input:

1. **System Settings** → **Sound** → **Output** → Select your speakers
2. **System Settings** → **Sound** → **Input** → Select your microphone

## Troubleshooting

**No audio heard?**
- Make sure Multi-Output Device includes your speakers
- Check that Multi-Output is set as system output

**whisper-stream not picking up audio?**
- Verify BlackHole 2ch is selected as system input
- Check the capture device ID with `whisper-stream --capture -1`

**Echo/feedback?**
- Don't use speakers while using BlackHole with a live mic - use headphones
