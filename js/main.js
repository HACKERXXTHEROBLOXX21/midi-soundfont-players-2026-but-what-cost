import { Synthetizer } from "https://cdn.jsdelivr.net/npm/spessasynth@latest/src/spessasynth/synthetizer.js";
import { MIDIPlayer } from "https://cdn.jsdelivr.net/npm/spessasynth@latest/src/spessasynth/midi_player.js";
import { SynthetizerGUI } from "https://cdn.jsdelivr.net/npm/spessasynth@latest/src/spessasynth/synthetizer_gui.js";
import { Visualizer } from "https://cdn.jsdelivr.net/npm/spessasynth@latest/src/spessasynth/visualizer/visualizer.js";

let synth, player, audioCtx, analyser, dataArray, synthGUI, visualizer;
const panel = document.getElementById('main-panel');
const uiContainer = document.getElementById('synth-ui-container');
const canvas = document.getElementById('piano-roll');

// --- FIXED FONT LOGIC ---
const updateFont = (fontName) => {
    document.documentElement.style.setProperty('--font-main', fontName);
    document.body.style.fontFamily = fontName;
};

document.getElementById('font-changer').onchange = (e) => {
    if (e.target.value === 'custom') {
        document.getElementById('font-upload').click();
    } else {
        updateFont(e.target.value);
    }
};

document.getElementById('font-upload').onchange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const fontData = await file.arrayBuffer();
    const myFont = new FontFace('CustomUserFont', fontData);
    const loadedFont = await myFont.load();
    document.fonts.add(loadedFont);
    updateFont('CustomUserFont');
};

// --- BASS SHAKE ENGINE ---
function initBeatDetection() {
    analyser = audioCtx.createAnalyser();
    synth.output.connect(analyser);
    analyser.fftSize = 64;
    dataArray = new Uint8Array(analyser.frequencyBinCount);
    
    const detectBeat = () => {
        requestAnimationFrame(detectBeat);
        analyser.getByteFrequencyData(dataArray);
        
        // Target Bass frequencies (bins 0-2)
        let bass = (dataArray[0] + dataArray[1] + dataArray[2]) / 3;
        if (bass > 215) {
            panel.classList.add('shake');
            setTimeout(() => panel.classList.remove('shake'), 100);
        }
    };
    detectBeat();
}

// --- FILE LOADING ---
document.getElementById('sf2-upload').onchange = async (e) => {
    const file = e.target.files[0];
    if (!audioCtx) audioCtx = new AudioContext();
    const buf = await file.arrayBuffer();
    
    synth = new Synthetizer(audioCtx, buf);
    
    // Create the Channel Grid (Image 3)
    synthGUI = new SynthetizerGUI(synth, uiContainer);
    
    // Create the Piano Roll (Image 4)
    visualizer = new Visualizer(synth, canvas);
    
    initBeatDetection();
    document.getElementById('status').innerText = "System Integrated.";
};

document.getElementById('midi-upload').onchange = async (e) => {
    const file = e.target.files[0];
    const buf = await file.arrayBuffer();
    if (player) player.stop();
    player = new MIDIPlayer(buf, synth);
    document.getElementById('play-pause').disabled = false;
    document.getElementById('status').innerText = `Loaded: ${file.name}`;
};

// --- CONTROLS ---
document.getElementById('play-pause').onclick = () => {
    if (player.playing) {
        player.pause();
        document.getElementById('play-pause').innerText = "RESUME";
    } else {
        player.play();
        document.getElementById('play-pause').innerText = "PAUSE";
    }
};

document.getElementById('toggle-ui').onclick = () => {
    uiContainer.style.display = uiContainer.style.display === "none" ? "block" : "none";
};

// Hotkey 'S'
window.onkeydown = (e) => { if(e.key.toLowerCase() === 's') document.getElementById('toggle-ui').click(); };
