import { Synthetizer } from "https://cdn.jsdelivr.net/npm/spessasynth@latest/src/spessasynth/synthetizer.js";
import { MIDIPlayer } from "https://cdn.jsdelivr.net/npm/spessasynth@latest/src/spessasynth/midi_player.js";

let synth, player, audioCtx;
const status = document.getElementById('status');

// Change Font Dynamically
document.getElementById('font-changer').addEventListener('change', (e) => {
    document.documentElement.style.setProperty('--font-main', e.target.value);
});

// Load SoundFont
document.getElementById('sf2-upload').onchange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    if (!audioCtx) audioCtx = new AudioContext();
    status.innerText = "Loading SoundFont...";
    
    const buffer = await file.arrayBuffer();
    synth = new Synthetizer(audioCtx, buffer);
    status.innerText = `System Ready: ${file.name}`;
};

// Load and Play MIDI
document.getElementById('midi-upload').onchange = async (e) => {
    const file = e.target.files[0];
    if (!file || !synth) return;

    const buffer = await file.arrayBuffer();
    if (player) player.stop();
    
    player = new MIDIPlayer(buffer, synth);
    player.play();
    status.innerText = `Playing: ${file.name}`;
};
