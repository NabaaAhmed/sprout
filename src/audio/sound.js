import * as Tone from 'tone'

// A tiny, self-contained ambient audio engine for Sprout, plus a
// one-shot chime for Session Complete and a soft tick for UI clicks.
// Everything here is intentionally quiet — this is background
// ambience, not a foreground track.
//
// Ambient bed: soft rolling piano-ish arpeggio over a sustained bass
// pad, with a little delay/reverb shimmer ("dreamy piano").

// A more emotional vi-IV-I-V progression with a little added tension
// (the raised 4th in the V chord).
const CHORDS_DREAMY = [
  ['A3', 'C4', 'E4', 'G4'], // Am9-ish (vi)
  ['F3', 'A3', 'C4', 'E4'], // Fmaj7 (IV)
  ['C3', 'E3', 'G3', 'B3'], // Cmaj7 (I)
  ['G3', 'B3', 'D4', 'F4'], // G7-ish (V) — a touch of tension before looping
]

// A gently rolling arpeggio shape (up, then partway back down) across
// each 2-measure chord — more "piano phrase," less "static chord."
const DREAMY_ARP_PATTERN = [0, 1, 2, 3, 2, 1, 0, 2]

const CHIME_NOTES = ['C5', 'E5', 'G5', 'C6']

// Gentle, close-together pitches for the UI click so rapid clicking
// (tabs, presets) still feels varied instead of robotically identical.
const CLICK_NOTES = ['C6', 'D6', 'E6']

let soundEnabled = true
let sharedBuilt = false
let ambientBuilt = false
let ambientVolume = null
let ambientLoops = []
let chimeSynth = null
let clickSynth = null
let running = false

function buildShared() {
  if (sharedBuilt) return
  sharedBuilt = true

  // Separate, dry-ish chain for the one-shot Session Complete chime so it
  // stays crisp and distinct from the ambient bed.
  const chimeReverb = new Tone.Freeverb({ roomSize: 0.6, dampening: 4000, wet: 0.25 }).toDestination()
  chimeSynth = new Tone.PolySynth(Tone.Synth, {
    oscillator: { type: 'sine' },
    envelope: { attack: 0.01, decay: 0.4, sustain: 0.15, release: 1.4 },
  }).connect(chimeReverb)
  chimeSynth.volume.value = -12

  // Tiny, dry, physically-modeled pluck for UI clicks — short and soft
  // by nature (no sustain to manage), and clearly distinct from the
  // ambient bed and the brighter session-complete chime.
  clickSynth = new Tone.PluckSynth({
    attackNoise: 0.5,
    dampening: 5000,
    resonance: 0.35,
  }).toDestination()
  clickSynth.volume.value = -22
}

function buildAmbient() {
  if (ambientBuilt) return
  ambientBuilt = true

  // A little delay-into-reverb chain for a dreamy, spacious shimmer —
  // gentle and background-level.
  const reverb = new Tone.Freeverb({ roomSize: 0.55, dampening: 3200, wet: 0.3 }).toDestination()
  const delay = new Tone.PingPongDelay({ delayTime: '8n.', feedback: 0.22, wet: 0.22 }).connect(reverb)
  ambientVolume = new Tone.Volume(-20).connect(delay)

  // Sustained low root note under the arpeggio — the "warm piano body"
  // resonance rather than a full chord pad.
  const padSynth = new Tone.PolySynth(Tone.Synth, {
    oscillator: { type: 'sine' },
    envelope: { attack: 2.5, decay: 1.5, sustain: 0.5, release: 3.5 },
  }).connect(ambientVolume)
  padSynth.volume.value = -8

  // Piano-ish plucky voice for the rolling arpeggio — quick attack,
  // natural decay, minimal sustain (like a real piano note fading out)
  // instead of a held pad tone.
  const pianoSynth = new Tone.PolySynth(Tone.Synth, {
    oscillator: { type: 'triangle' },
    envelope: { attack: 0.005, decay: 1.1, sustain: 0.05, release: 1.4 },
  }).connect(ambientVolume)
  pianoSynth.volume.value = -6

  let chordIndex = 0
  const chordLoop = new Tone.Loop((time) => {
    const chord = CHORDS_DREAMY[chordIndex % CHORDS_DREAMY.length]
    padSynth.triggerAttackRelease([chord[0]], '2m', time)
    chordIndex += 1
  }, '2m')

  // Gently rolling arpeggio through the current chord, an octave up —
  // downbeats a touch louder than the rest for a "dynamic," expressive
  // feel instead of a flat, mechanical one.
  let arpStep = 0
  const arpLoop = new Tone.Loop((time) => {
    const chord = CHORDS_DREAMY[(chordIndex - 1 + CHORDS_DREAMY.length) % CHORDS_DREAMY.length]
    const degree = DREAMY_ARP_PATTERN[arpStep % DREAMY_ARP_PATTERN.length]
    const note = Tone.Frequency(chord[degree]).transpose(12).toNote()
    const velocity = degree === 0 ? 0.5 : 0.28 + Math.random() * 0.17
    pianoSynth.triggerAttackRelease(note, '4n', time, velocity)
    arpStep += 1
  }, '4n')

  ambientLoops = [
    { loop: chordLoop, offset: 0 },
    { loop: arpLoop, offset: '0:2' },
  ]
}

/** Must be called from inside a user gesture handler (click/keydown/etc). */
export async function unlockAudio() {
  await Tone.start()
  buildShared()
}

export function startAmbient() {
  buildShared()
  if (running) return
  running = true
  buildAmbient()
  if (ambientVolume) ambientVolume.mute = !soundEnabled
  ambientLoops.forEach(({ loop, offset }) => loop.start(offset))
  if (Tone.Transport.state !== 'started') Tone.Transport.start()
}

export function stopAmbient() {
  if (!running) return
  running = false
  ambientLoops.forEach(({ loop }) => loop.stop())
}

/** Wired to the Settings "Sound" toggle — off mutes, on resumes. */
export function setSoundEnabled(enabled) {
  soundEnabled = enabled
  if (!sharedBuilt) return
  if (enabled) {
    if (running) {
      if (ambientVolume) ambientVolume.mute = false
    } else {
      startAmbient()
    }
  } else if (running) {
    if (ambientVolume) ambientVolume.mute = true
  }
}

/**
 * A very soft, near-instant tick — meant to be fired on every clickable
 * element in the app. Intentionally a no-op until the audio engine
 * exists, so it's safe to call from a global click listener before the
 * first interaction has unlocked audio.
 */
export function playClick() {
  if (!soundEnabled || !sharedBuilt || !clickSynth) return
  const note = CLICK_NOTES[Math.floor(Math.random() * CLICK_NOTES.length)]
  clickSynth.triggerAttack(note, Tone.now())
}

export async function playChime() {
  if (!soundEnabled) return
  await unlockAudio()
  const now = Tone.now()
  CHIME_NOTES.forEach((note, i) => {
    chimeSynth.triggerAttackRelease(note, '8n', now + i * 0.09)
  })
}
