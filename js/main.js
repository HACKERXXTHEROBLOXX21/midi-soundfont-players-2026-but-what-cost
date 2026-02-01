import { Synthetizer } from "https://cdn.jsdelivr.net/npm/spessasynth@latest/src/spessasynth/synthetizer.js";
import { MIDIPlayer } from "https://cdn.jsdelivr.net/npm/spessasynth@latest/src/spessasynth/midi_player.js";

let synth, player, audioCtx, analyser, dataArray;
const panel = document.getElementById('main-panel');
const status = document.getElementById('status');
const playBtn = document.getElementById('play-pause');
const canvas = document.getElementById('visualizer');
const ctx = canvas.getContext('2d');

// --- FONT HANDLING ---
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
    const myFont = new FontFace('UserCustomFont', fontData);
    await myFont.load();
    document.fonts.add(myFont);
    document.documentElement.style.setProperty('--font-main', 'UserCustomFont');
    status.innerText = "Custom Font Loaded.";
};

// --- SYNTH ENGINE & VISUALS ---
function setupVisualizer() {
    analyser = audioCtx.createAnalyser();
    synth.output.connect(analyser);
    analyser.fftSize = 64; 
    dataArray = new Uint8Array(analyser.frequencyBinCount);
    drawFrame();
}

function drawFrame() {
    requestAnimationFrame(drawFrame);
    if (!analyser) return;

    analyser.getByteFrequencyData(dataArray);
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // BEAT SHAKE LOGIC: Deep bass is usually in the first 3 bins
    let bassLevel = (dataArray[0] + dataArray[1] + dataArray[2]) / 3;

    if (bassLevel > 200) { // Shake Threshold
        const amt = (bassLevel - 200) * 0.3;
        panel.style.transform = `translate(${(Math.random()-0.5)*amt}px, ${(Math.random()-0.5)*amt}px)`;
        panel.style.boxShadow = `0 0 ${amt*2}px rgba(0, 242, 255, 0.4)`;
    } else {
        panel.style.transform = `translate(0,0)`;
        panel.style.boxShadow = `0 20px 60px rgba(0,0,0,0.9)`;
    }

    // DRAW BARS
    const barWidth = (canvas.width / dataArray.length) * 2;
    let x = 0;
    dataArray.forEach(v => {
        const h = (v / 255) * canvas.height;
        ctx.fillStyle = `rgba(0, 242, 255, ${v/255 + 0.2})`;
        ctx.fillRect(x, canvas.height - h, barWidth - 2, h);
        x += barWidth;
    });
}

// --- FILE INTERACTION ---
document.getElementById('sf2-upload').onchange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!audioCtx) audioCtx = new AudioContext();
    status.innerText = "Processing SoundFont...";
    const buf = await file.arrayBuffer();
    synth = new Synthetizer(audioCtx, buf);
    setupVisualizer();
    status.innerText = "SoundFont Active.";
};

document.getElementById('midi-upload').onchange = async (e) => {
    const file = e.target.files[0];
    if (!file || !synth) return;
    const buf = await file.arrayBuffer();
    if (player) player.stop();
    player = new MIDIPlayer(buf, synth);
    playBtn.disabled = false;
    status.innerText = `Track Ready: ${file.name}`;
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
