import { Synthetizer } from "https://cdn.jsdelivr.net/npm/spessasynth@latest/src/spessasynth/synthetizer.js";
import { MIDIPlayer } from "https://cdn.jsdelivr.net/npm/spessasynth@latest/src/spessasynth/midi_player.js";
import { SynthetizerGUI } from "https://cdn.jsdelivr.net/npm/spessasynth@latest/src/spessasynth/synthetizer_gui.js";
import { Visualizer } from "https://cdn.jsdelivr.net/npm/spessasynth@latest/src/spessasynth/visualizer/visualizer.js";

// --- 1. LOCALIZATION SYSTEM ---
const languages = {
    en: { lang_label: "Language", font_label: "UI Font", sf2_label: "SoundFont", midi_label: "MIDI File", btn_start: "START SYSTEM", btn_ctrl: "CONTROLLER (S)", status_wait: "Awaiting Input...", btn_pause: "PAUSE", btn_resume: "RESUME" },
    pt: { lang_label: "Idioma", font_label: "Fonte", sf2_label: "SoundFont", midi_label: "Arquivo MIDI", btn_start: "INICIAR", btn_ctrl: "CONTROLE (S)", status_wait: "Aguardando...", btn_pause: "PAUSAR", btn_resume: "RESUMIR" },
    vi: { lang_label: "Ngôn ngữ", font_label: "Kiểu chữ", sf2_label: "Bộ tiếng", midi_label: "Tệp MIDI", btn_start: "BẮT ĐẦU", btn_ctrl: "BẢNG ĐIỀU KHIỂN (S)", status_wait: "Đang chờ tệp...", btn_pause: "TẠM DỪNG", btn_resume: "TIẾP TỤC" }
};

const t = (key) => languages[currentLang][key] || key;
let currentLang = 'en';

function updateUIStrings() {
    document.querySelectorAll('[data-i18n]').forEach(el => {
        el.innerText = t(el.getAttribute('data-i18n'));
    });
}

// --- 2. CORE ENGINE VARIABLES ---
let synth, player, audioCtx, analyser, dataArray, synthGUI, visualizer;
const panel = document.getElementById('main-panel');
const uiContainer = document.getElementById('synth-ui-container');

// --- 3. BASS SHAKE ENGINE ---
function startBeatDetection() {
    analyser = audioCtx.createAnalyser();
    synth.output.connect(analyser);
    analyser.fftSize = 64;
    dataArray = new Uint8Array(analyser.frequencyBinCount);
    
    const loop = () => {
        requestAnimationFrame(loop);
        analyser.getByteFrequencyData(dataArray);
        let bass = (dataArray[0] + dataArray[1] + dataArray[2]) / 3;
        if (bass > 210) {
            panel.classList.add('beat-shake');
            setTimeout(() => panel.classList.remove('beat-shake'), 70);
        }
    };
    loop();
}

// --- 4. FONT & LANG HANDLERS ---
document.getElementById('font-changer').onchange = (e) => {
    if (e.target.value === 'custom') document.getElementById('font-upload').click();
    else document.body.style.fontFamily = e.target.value;
};

document.getElementById('font-upload').onchange = async (e) => {
    const file = e.target.files[0];
    const data = await file.arrayBuffer();
    const font = new FontFace('CustomFont', data);
    await font.load();
    document.fonts.add(font);
    document.body.style.fontFamily = 'CustomFont';
};

document.getElementById('lang-selector').onchange = (e) => {
    if (e.target.value === 'custom') document.getElementById('lang-upload').click();
    else { currentLang = e.target.value; updateUIStrings(); }
};

// --- 5. LOADING LOGIC ---
document.getElementById('sf2-upload').onchange = async (e) => {
    const file = e.target.files[0];
    if (!audioCtx) audioCtx = new AudioContext();
    const buf = await file.arrayBuffer();
    synth = new Synthetizer(audioCtx, buf);
    synthGUI = new SynthetizerGUI(synth, uiContainer);
    visualizer = new Visualizer(synth, document.getElementById('piano-roll'));
    startBeatDetection();
    document.getElementById('status').innerText = "Engine Linked.";
};

document.getElementById('midi-upload').onchange = async (e) => {
    const buf = await e.target.files[0].arrayBuffer();
    if (player) player.stop();
    player = new MIDIPlayer(buf, synth);
    document.getElementById('play-pause').disabled = false;
};

document.getElementById('play-pause').onclick = () => {
    if (player.playing) { player.pause(); document.getElementById('play-pause').innerText = t('btn_resume'); }
    else { player.play(); document.getElementById('play-pause').innerText = t('btn_pause'); }
};

document.getElementById('toggle-ui').onclick = () => {
    uiContainer.style.display = uiContainer.style.display === "none" ? "block" : "none";
};

// Hotkeys
window.onkeydown = (e) => { if(e.key.toLowerCase() === 's') document.getElementById('toggle-ui').click(); };
