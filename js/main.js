import { Synthetizer } from "https://cdn.jsdelivr.net/npm/spessasynth@latest/src/spessasynth/synthetizer.js";
import { MIDIPlayer } from "https://cdn.jsdelivr.net/npm/spessasynth@latest/src/spessasynth/midi_player.js";

let synth, player, audioCtx, analyser, dataArray;
const panel = document.getElementById('main-panel');
const status = document.getElementById('status');
const playBtn = document.getElementById('play-pause');
const canvas = document.getElementById('visualizer');
const ctx = canvas.getContext('2d');

// --- FONT CUSTOMIZATION ---
document.getElementById('font-changer').onchange = (e) => {
    if (e.target.value === 'custom') {
        document.getElementById('font-upload').click();
    } else {
        document.documentElement.style.setProperty('--font-main', e.target.value);
    }
};

document.getElementById('font-upload').onchange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const fontData = await file.arrayBuffer();
    const myFont = new FontFace('CustomFont', fontData);
    await myFont.load();
    document.fonts.add(myFont);
    document.documentElement.style.setProperty('--font-main', 'CustomFont');
    status.innerText = "Custom Font Applied!";
};

// --- CORE ENGINE ---
function initVisualizer() {
    analyser = audioCtx.createAnalyser();
    synth.output.connect(analyser);
    analyser.fftSize = 64; 
    dataArray = new Uint8Array(analyser.frequencyBinCount);
    renderFrame();
}

function renderFrame() {
    requestAnimationFrame(renderFrame);
    if (!analyser) return;

    analyser.getByteFrequencyData(dataArray);
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Bass Shake Logic (Indices 0-3 represent the bass/kick)
    let bass = dataArray[0] + dataArray[1] + dataArray[2];
    let avgBass = bass / 3;

    if (avgBass > 190) { // Shake threshold
        const intensity = (avgBass - 190) * 0.2;
        panel.style.transform = `translate(${(Math.random()-0.5)*intensity}px, ${(Math.random()-0.5)*intensity}px)`;
    } else {
        panel.style.transform = `translate(0,0)`;
    }

    // Draw Bars
    const barWidth = (canvas.width / dataArray.length) * 2;
    let x = 0;
    dataArray.forEach(val => {
        const h = (val / 255) * canvas.height;
        ctx.fillStyle = `rgba(0, 242, 255, ${val/255 + 0.3})`;
        ctx.fillRect(x, canvas.height - h, barWidth - 2, h);
        x += barWidth;
    });
}

// --- FILE HANDLERS ---
document.getElementById('sf2-upload').onchange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!audioCtx) audioCtx = new AudioContext();
    status.innerText = "Loading SoundFont...";
    const buffer = await file.arrayBuffer();
    synth = new Synthetizer(audioCtx, buffer);
    initVisualizer();
    status.innerText = "SoundFont Ready.";
};

document.getElementById('midi-upload').onchange = async (e) => {
    const file = e.target.files[0];
    if (!file || !synth) return;
    const buffer = await file.arrayBuffer();
    if (player) player.stop();
    player = new MIDIPlayer(buffer, synth);
    playBtn.disabled = false;
    status.innerText = `MIDI Loaded: ${file.name}`;
};

playBtn.onclick = () => {
    if (player.playing) {
        player.pause();
        playBtn.innerText = "RESUME ENGINE";
    } else {
        player.play();
        playBtn.innerText = "PAUSE ENGINE";
    }
};
