import * as Tone from 'tone'

// A tiny, self-contained ambient audio engine for Sprout: a slow looping
// pad-chord progression with a sparse pentatonic top line ("rainy
// afternoon studying" mood), plus a one-shot chime for Session Complete.
// Everything here is intentionally quiet — this is background ambience,
// not a foreground track.

// Warm, relaxing four-chord loop (I - vi - IV - V6ish), voiced low and soft.
const CHORDS = [
  ['C3', 'E3', 'G3', 'B3'], // Cmaj7
  ['A2', 'C3', 'E3', 'G3'], // Am7
  ['F2', 'A2', 'C3', 'E3'], // Fmaj7
  ['G2', 'B2', 'D3', 'E3'], // G6
]

// One octave of C major pentatonic for a light, sparse melodic layer.
const MELODY_NOTES = ['C5', 'D5', 'E5', 'G5', 'A5']

const CHIME_NOTES = ['C5', 'E5', 'G5', 'C6']

// Gentle, close-together pitches for the UI click so rapid clicking
// (tabs, presets) still feels varied instead of robotically identical.
const CLICK_NOTES = ['C6', 'D6', 'E6']

let built = false
let padSynth = null
let melodySynth = null
let ambientVolume = null
let chimeSynth = null
let clickSynth = null
let chordLoop = null
let melodyLoop = null
let ambientRunning = false
let soundEnabled = true

function build() {
  if (built) return
  built = true

  Tone.Transport.bpm.value = 64

  const ambientReverb = new Tone.Freeverb({ roomSize: 0.75, dampening: 3000, wet: 0.35 }).toDestination()

  // Single volume node gates the whole ambient layer so the Settings
  // "Sound" toggle can mute/unmute it without tearing anything down.
  ambientVolume = new Tone.Volume(-24).connect(ambientReverb)

  padSynth = new Tone.PolySynth(Tone.Synth, {
    oscillator: { type: 'sine' },
    envelope: { attack: 2.2, decay: 1, sustain: 0.65, release: 4 },
  }).connect(ambientVolume)
  padSynth.volume.value = 0

  melodySynth = new Tone.Synth({
    oscillator: { type: 'triangle' },
    envelope: { attack: 0.6, decay: 0.6, sustain: 0.25, release: 2.5 },
  }).connect(ambientVolume)
  melodySynth.volume.value = -6

  let chordIndex = 0
  chordLoop = new Tone.Loop((time) => {
    const chord = CHORDS[chordIndex % CHORDS.length]
    padSynth.triggerAttackRelease(chord, '2m', time)
    chordIndex += 1
  }, '2m')

  // Sparse, semi-random top line — leaves plenty of silence so it never
  // feels busy or attention-grabbing.
  melodyLoop = new Tone.Loop((time) => {
    if (Math.random() > 0.4) return
    const note = MELODY_NOTES[Math.floor(Math.random() * MELODY_NOTES.length)]
    const jitter = Tone.Time('8n').toSeconds() * Math.random()
    melodySynth.triggerAttackRelease(note, '2n', time + jitter)
  }, '1m')

  // Separate, dry-ish chain for the one-shot Session Complete chime so it
  // stays crisp and distinct from the soft, wet ambient bed.
  const chimeReverb = new Tone.Freeverb({ roomSize: 0.6, dampening: 4000, wet: 0.25 }).toDestination()
  chimeSynth = new Tone.PolySynth(Tone.Synth, {
    oscillator: { type: 'sine' },
    envelope: { attack: 0.01, decay: 0.4, sustain: 0.15, release: 1.4 },
  }).connect(chimeReverb)
  chimeSynth.volume.value = -12

  // Tiny, dry, physically-modeled pluck for UI clicks — short and soft
  // by nature (no sustain to manage), and clearly distinct from both
  // the wet ambient pad and the brighter session-complete chime.
  clickSynth = new Tone.PluckSynth({
    attackNoise: 0.5,
    dampening: 5000,
    resonance: 0.35,
  }).toDestination()
  clickSynth.volume.value = -22
}

/** Must be called from inside a user gesture handler (click/keydown/etc). */
export async function unlockAudio() {
  await Tone.start()
  build()
}

export function startAmbient() {
  build()
  if (ambientRunning) return
  ambientRunning = true
  ambientVolume.mute = !soundEnabled
  chordLoop.start(0)
  melodyLoop.start('0:2')
  if (Tone.Transport.state !== 'started') Tone.Transport.start()
}

export function stopAmbient() {
  ambientRunning = false
  chordLoop?.stop()
  melodyLoop?.stop()
}

/** Wired to the Settings "Sound" toggle — off mutes, on resumes. */
export function setSoundEnabled(enabled) {
  soundEnabled = enabled
  if (!built) return
  if (enabled) {
    ambientVolume.mute = false
    if (!ambientRunning) startAmbient()
  } else {
    ambientVolume.mute = true
  }
}

/**
 * A very soft, near-instant tick — meant to be fired on every clickable
 * element in the app. Intentionally synchronous/no-op until the audio
 * engine exists yet, so it's safe to call from a global click listener
 * before the first interaction has unlocked audio.
 */
export function playClick() {
  if (!soundEnabled || !built || !clickSynth) return
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
