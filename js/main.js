import { Synthetizer } from "https://cdn.jsdelivr.net/npm/spessasynth@latest/src/spessasynth/synthetizer.js";
import { MIDIPlayer } from "https://cdn.jsdelivr.net/npm/spessasynth@latest/src/spessasynth/midi_player.js";
import { SynthetizerGUI } from "https://cdn.jsdelivr.net/npm/spessasynth@latest/src/spessasynth/synthetizer_gui.js";
import { Visualizer } from "https://cdn.jsdelivr.net/npm/spessasynth@latest/src/spessasynth/visualizer/visualizer.js";

// --- 1. SETTINGS STATE ---
let currentLang = 'en';
const translations = {
    en: { lang_label: "Language", font_label: "UI Appearance", sf2_label: "SoundFont", midi_label: "MIDI File", btn_start: "START SYSTEM", btn_ctrl: "Synthesizer controller (S)", status_wait: "Awaiting Input...", btn_pause: "PAUSE" },
    pt: { lang_label: "Idioma", font_label: "Aparência", sf2_label: "Banco de Sons", midi_label: "Arquivo MIDI", btn_start: "INICIAR", btn_ctrl: "Controle (S)", status_wait: "Aguardando...", btn_pause: "PAUSAR" },
    vi: { lang_label: "Ngôn ngữ", font_label: "Giao diện", sf2_label: "Bộ tiếng", midi_label: "Tệp MIDI", btn_start: "BẮT ĐẦU", btn_ctrl: "Bảng điều khiển (S)", status_wait: "Đang chờ tệp...", btn_pause: "TẠM DỪNG" }
};

// Update all text elements
function updateLanguage() {
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        if (translations[currentLang][key]) el.innerText = translations[currentLang][key];
    });
}

// Update Global Font
function updateFont(family) {
    document.documentElement.style.setProperty('--current-font', family);
}

// --- 2. ENGINE SETUP ---
let synth, player, audioCtx, analyser, dataArray;
const panel = document.getElementById('main-panel');
const miniBtn = document.getElementById('mini-play');

function startShakeDetection() {
    analyser = audioCtx.createAnalyser();
    synth.output.connect(analyser);
    analyser.fftSize = 64;
    dataArray = new Uint8Array(analyser.frequencyBinCount);
    
    const loop = () => {
        requestAnimationFrame(loop);
        analyser.getByteFrequencyData(dataArray);
        let bass = (dataArray[0] + dataArray[1]) / 2;
        if (bass > 215) {
            panel.classList.add('beat-shake');
            setTimeout(() => panel.classList.remove('beat-shake'), 80);
        }
    };
    loop();
}

// --- 3. ICON & PLAYBACK LOGIC ---
function togglePlay() {
    if (!player) return;
    if (player.playing) {
        player.pause();
        miniBtn.innerText = "▶"; // Show play icon when paused
        document.getElementById('play-pause').innerText = translations[currentLang].btn_start;
    } else {
        player.play();
        miniBtn.innerText = "⏸"; // Show pause icon when playing
        document.getElementById('play-pause').innerText = translations[currentLang].btn_pause;
    }
}

// --- 4. EVENT LISTENERS ---
document.getElementById('lang-selector').onchange = (e) => {
    if (e.target.value === 'custom') document.getElementById('lang-upload').click();
    else { currentLang = e.target.value; updateLanguage(); }
};

document.getElementById('font-changer').onchange = (e) => {
    if (e.target.value === 'custom') document.getElementById('font-upload').click();
    else updateFont(e.target.value);
};

document.getElementById('sf2-upload').onchange = async (e) => {
    if (!audioCtx) audioCtx = new AudioContext();
    const buf = await e.target.files[0].arrayBuffer();
    synth = new Synthetizer(audioCtx, buf);
    new SynthetizerGUI(synth, document.getElementById('synth-ui-container'));
    new Visualizer(synth, document.getElementById('piano-roll'));
    startShakeDetection();
};

document.getElementById('midi-upload').onchange = async (e) => {
    const buf = await e.target.files[0].arrayBuffer();
    player = new MIDIPlayer(buf, synth);
    document.getElementById('play-pause').disabled = false;
};

document.getElementById('play-pause').onclick = togglePlay;
miniBtn.onclick = togglePlay;

document.getElementById('volume-slider').oninput = (e) => {
    const v = e.target.value;
    document.getElementById('volume-label').innerText = `${v}%`;
    if (synth) synth.masterVolume = v / 100;
};

document.getElementById('toggle-ui').onclick = () => {
    const ui = document.getElementById('synth-ui-container');
    ui.style.display = ui.style.display === "block" ? "none" : "block";
};
