import * as Tone from 'tone'

// A tiny, self-contained ambient audio engine for Sprout, plus a
// one-shot chime for Session Complete and a soft tick for UI clicks.
// Everything here is intentionally quiet — this is background
// ambience, not a foreground track.
//
// The ambient bed currently ships three comparable "variants" so we can
// A/B them live instead of guessing blind:
//   'a' (twinkle) — warm chord pad + a little music-box melody on top
//   'b' (sparse)  — chord pad only, slower fade, higher/sparser
//                   voicing, and much quieter — "barely-there"
//   'c' (dreamy piano) — a soft rolling piano-ish arpeggio over a
//                   sustained bass pad, with a little delay/reverb
//                   shimmer for a "calm dreamy piano" feel with more
//                   emotional movement than a/b
// Once one direction is picked, the others can be deleted.

const CHORDS_TWINKLE = [
  ['C4', 'E4', 'G4', 'B4'], // Cmaj7
  ['A3', 'C4', 'E4', 'G4'], // Am7
  ['F3', 'A3', 'C4', 'E4'], // Fmaj7
  ['G3', 'B3', 'D4', 'E4'], // G6
]

// Simple up-down shape (scale degrees within each chord, an octave up)
// for the music-box twinkle in variant A.
const TWINKLE_PATTERN = [0, 1, 2, 1]

// Open fifths, voiced higher and with only two notes per chord — airy
// and sparse rather than full/warm, for variant B.
const CHORDS_SPARSE = [
  ['C5', 'G5'], // I
  ['A4', 'E5'], // vi
  ['F4', 'C5'], // IV
  ['G4', 'D5'], // V
]

// A more emotional vi-IV-I-V progression with a little added tension
// (the raised 4th in the V chord) for variant C's "dreamy piano" feel.
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
let chimeSynth = null
let clickSynth = null

// Each variant gets a `volume` gate node (for mute + level) and a list
// of { loop, offset } pairs so the generic start/stop logic below never
// needs to know each variant's internal shape.
const variants = {
  a: { built: false, volume: null, loops: [] },
  b: { built: false, volume: null, loops: [] },
  c: { built: false, volume: null, loops: [] },
}

let activeKey = 'a'
let running = false

function buildShared() {
  if (sharedBuilt) return
  sharedBuilt = true

  // Separate, dry-ish chain for the one-shot Session Complete chime so it
  // stays crisp and distinct from any ambient variant.
  const chimeReverb = new Tone.Freeverb({ roomSize: 0.6, dampening: 4000, wet: 0.25 }).toDestination()
  chimeSynth = new Tone.PolySynth(Tone.Synth, {
    oscillator: { type: 'sine' },
    envelope: { attack: 0.01, decay: 0.4, sustain: 0.15, release: 1.4 },
  }).connect(chimeReverb)
  chimeSynth.volume.value = -12

  // Tiny, dry, physically-modeled pluck for UI clicks — short and soft
  // by nature (no sustain to manage), and clearly distinct from every
  // ambient variant and the brighter session-complete chime.
  clickSynth = new Tone.PluckSynth({
    attackNoise: 0.5,
    dampening: 5000,
    resonance: 0.35,
  }).toDestination()
  clickSynth.volume.value = -22
}

function buildA() {
  const v = variants.a
  if (v.built) return
  v.built = true

  const reverb = new Tone.Freeverb({ roomSize: 0.45, dampening: 3500, wet: 0.22 }).toDestination()
  v.volume = new Tone.Volume(-22).connect(reverb)

  const padSynth = new Tone.PolySynth(Tone.Synth, {
    oscillator: { type: 'sine' },
    envelope: { attack: 1.3, decay: 1, sustain: 0.55, release: 3 },
  }).connect(v.volume)
  padSynth.volume.value = -3

  const musicBoxSynth = new Tone.PolySynth(Tone.Synth, {
    oscillator: { type: 'triangle' },
    envelope: { attack: 0.01, decay: 0.5, sustain: 0.05, release: 0.4 },
  }).connect(v.volume)
  musicBoxSynth.volume.value = -7

  let chordIndex = 0
  const chordLoop = new Tone.Loop((time) => {
    const chord = CHORDS_TWINKLE[chordIndex % CHORDS_TWINKLE.length]
    padSynth.triggerAttackRelease(chord, '2m', time)
    chordIndex += 1
  }, '2m')

  let twinkleStep = 0
  const twinkleLoop = new Tone.Loop((time) => {
    if (Math.random() < 0.15) {
      twinkleStep += 1
      return
    }
    const chord = CHORDS_TWINKLE[(chordIndex - 1 + CHORDS_TWINKLE.length) % CHORDS_TWINKLE.length]
    const degree = TWINKLE_PATTERN[twinkleStep % TWINKLE_PATTERN.length]
    const note = Tone.Frequency(chord[degree]).transpose(12).toNote()
    const jitter = Tone.Time('16n').toSeconds() * Math.random() * 0.5
    const velocity = 0.45 + Math.random() * 0.25
    musicBoxSynth.triggerAttackRelease(note, '4n', time + jitter, velocity)
    twinkleStep += 1
  }, '2n')

  v.loops = [
    { loop: chordLoop, offset: 0 },
    { loop: twinkleLoop, offset: '0:1' },
  ]
}

function buildB() {
  const v = variants.b
  if (v.built) return
  v.built = true

  // Small room, low wet, and a much lower gate volume — this should sit
  // at the edge of audible, not something you consciously register.
  const reverb = new Tone.Freeverb({ roomSize: 0.4, dampening: 3500, wet: 0.18 }).toDestination()
  v.volume = new Tone.Volume(-34).connect(reverb)

  const padSynth = new Tone.PolySynth(Tone.Synth, {
    oscillator: { type: 'sine' },
    envelope: { attack: 2.8, decay: 1.5, sustain: 0.5, release: 4 },
  }).connect(v.volume)
  padSynth.volume.value = 0

  // Chord pad only — no melody line, so there's nothing repetitive or
  // "hook"-like to notice, just a slow wash of sound underneath.
  let chordIndex = 0
  const chordLoop = new Tone.Loop((time) => {
    const chord = CHORDS_SPARSE[chordIndex % CHORDS_SPARSE.length]
    padSynth.triggerAttackRelease(chord, '2m', time)
    chordIndex += 1
  }, '2m')

  v.loops = [{ loop: chordLoop, offset: 0 }]
}

function buildC() {
  const v = variants.c
  if (v.built) return
  v.built = true

  // A little delay-into-reverb chain for a dreamy, spacious shimmer —
  // more "emotional" than a/b, but still gentle and background-level.
  const reverb = new Tone.Freeverb({ roomSize: 0.55, dampening: 3200, wet: 0.3 }).toDestination()
  const delay = new Tone.PingPongDelay({ delayTime: '8n.', feedback: 0.22, wet: 0.22 }).connect(reverb)
  v.volume = new Tone.Volume(-20).connect(delay)

  // Sustained low root note under the arpeggio — the "warm piano body"
  // resonance rather than a full chord pad.
  const padSynth = new Tone.PolySynth(Tone.Synth, {
    oscillator: { type: 'sine' },
    envelope: { attack: 2.5, decay: 1.5, sustain: 0.5, release: 3.5 },
  }).connect(v.volume)
  padSynth.volume.value = -8

  // Piano-ish plucky voice for the rolling arpeggio — quick attack,
  // natural decay, minimal sustain (like a real piano note fading out)
  // instead of a held pad tone.
  const pianoSynth = new Tone.PolySynth(Tone.Synth, {
    oscillator: { type: 'triangle' },
    envelope: { attack: 0.005, decay: 1.1, sustain: 0.05, release: 1.4 },
  }).connect(v.volume)
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

  v.loops = [
    { loop: chordLoop, offset: 0 },
    { loop: arpLoop, offset: '0:2' },
  ]
}

function buildVariant(key) {
  if (key === 'b') buildB()
  else if (key === 'c') buildC()
  else buildA()
}

function stopVariant(key) {
  variants[key]?.loops.forEach(({ loop }) => loop.stop())
}

function startVariant(key) {
  buildVariant(key)
  const v = variants[key]
  if (v.volume) v.volume.mute = !soundEnabled
  v.loops.forEach(({ loop, offset }) => loop.start(offset))
}

/** Must be called from inside a user gesture handler (click/keydown/etc). */
export async function unlockAudio() {
  await Tone.start()
  buildShared()
}

/**
 * Switches which ambient direction is playing (for A/B/C comparison).
 * Safe to call any time, even before audio has been unlocked — it just
 * remembers the choice for whenever the ambient loop actually starts.
 */
export function setAmbientVariant(key) {
  const nextKey = variants[key] ? key : 'a'
  if (nextKey === activeKey) return
  const wasRunning = running
  if (wasRunning) stopVariant(activeKey)
  activeKey = nextKey
  if (wasRunning) startVariant(activeKey)
}

export function getAmbientVariant() {
  return activeKey
}

export function startAmbient() {
  buildShared()
  if (running) return
  running = true
  startVariant(activeKey)
  if (Tone.Transport.state !== 'started') Tone.Transport.start()
}

export function stopAmbient() {
  if (!running) return
  running = false
  stopVariant(activeKey)
}

/** Wired to the Settings "Sound" toggle — off mutes, on resumes. */
export function setSoundEnabled(enabled) {
  soundEnabled = enabled
  if (!sharedBuilt) return
  if (enabled) {
    if (running) {
      const v = variants[activeKey]
      if (v.volume) v.volume.mute = false
    } else {
      startAmbient()
    }
  } else if (running) {
    const v = variants[activeKey]
    if (v.volume) v.volume.mute = true
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
