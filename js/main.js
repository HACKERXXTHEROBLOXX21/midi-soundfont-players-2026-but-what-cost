import { Synthetizer } from "https://cdn.jsdelivr.net/npm/spessasynth@latest/src/spessasynth/synthetizer.js";
import { MIDIPlayer } from "https://cdn.jsdelivr.net/npm/spessasynth@latest/src/spessasynth/midi_player.js";
import { SynthetizerGUI } from "https://cdn.jsdelivr.net/npm/spessasynth@latest/src/spessasynth/synthetizer_gui.js";

let synth, player, audioCtx, analyser, dataArray, synthGUI;
const panel = document.getElementById('main-panel');
const uiContainer = document.getElementById('synth-ui-container');

// --- 1. ENGINE START ---
function initVisuals() {
    analyser = audioCtx.createAnalyser();
    synth.output.connect(analyser);
    analyser.fftSize = 64;
    dataArray = new Uint8Array(analyser.frequencyBinCount);
    render();
}

function render() {
    requestAnimationFrame(render);
    if (!analyser) return;
    analyser.getByteFrequencyData(dataArray);
    
    // Bass Shake Logic
    let bass = (dataArray[0] + dataArray[1] + dataArray[2]) / 3;
    if (bass > 210) {
        const amt = (bass - 210) * 0.5;
        panel.style.transform = `translate(${(Math.random()-0.5)*amt}px, ${(Math.random()-0.5)*amt}px)`;
    } else { panel.style.transform = `translate(0,0)`; }

    // Draw Small Visualizer
    const ctx = document.getElementById('visualizer').getContext('2d');
    ctx.clearRect(0, 0, 300, 150);
    dataArray.forEach((v, i) => {
        ctx.fillStyle = `rgb(0, 242, 255)`;
        ctx.fillRect(i * 10, 150 - v/2, 8, v/2);
    });
}

// --- 2. CONTROLLER UI TOGGLE ---
const toggleUI = () => {
    uiContainer.style.display = uiContainer.style.display === "none" ? "block" : "none";
};
document.getElementById('toggle-ui').onclick = toggleUI;
window.onkeydown = (e) => { if(e.key.toLowerCase() === 's') toggleUI(); };

// --- 3. LOADING LOGIC ---
document.getElementById('sf2-upload').onchange = async (e) => {
    const file = e.target.files[0];
    if (!audioCtx) audioCtx = new AudioContext();
    const buf = await file.arrayBuffer();
    
    synth = new Synthetizer(audioCtx, buf);
    synthGUI = new SynthetizerGUI(synth, uiContainer); // Creates the grid from your image
    initVisuals();
    document.getElementById('status').innerText = "Engine Ready.";
};

document.getElementById('midi-upload').onchange = async (e) => {
    const file = e.target.files[0];
    const buf = await file.arrayBuffer();
    if (player) player.stop();
    player = new MIDIPlayer(buf, synth);
    document.getElementById('play-pause').disabled = false;
};

document.getElementById('play-pause').onclick = () => {
    if (player.playing) { player.pause(); } else { player.play(); }
};

// Font Upload logic remains same as previous version...
