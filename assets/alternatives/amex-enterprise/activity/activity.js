// ACTIVITY: "Your turn" in the 3D office. The learner answers each step in a half-screen panel,
// watches the answer play out on the screens, gets feedback, and can ask for a clue or a
// walkthrough. Drag to look around; the Monitor and Laptop buttons switch screens.
// The words are in steps.js. The room is Codex's (../room/), used as it is.
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { buildRoom } from '../room/room.js';
import { planScreenFlight } from '../room/screen-camera.js';
import { ACTIVITY, STEPS, START, JOURNEY, REVIEW } from './steps.js';
import { loadScreens, attachScreens, COLORS } from './screens.js';

const $ = id => document.getElementById(id);
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

// ---------------------------------------------------------------- the 3D view
// No WebGL (old device, graphics switched off): the films still work; only "Your turn" needs 3D.
let renderer = null;
try {
  renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5)); renderer.setSize(innerWidth, innerHeight);
  renderer.toneMapping = THREE.NeutralToneMapping; renderer.toneMappingExposure = 1.05;
  renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  $('view').appendChild(renderer.domElement);
  renderer.domElement.addEventListener('webglcontextlost', e => { e.preventDefault(); showProblem('The graphics stopped working. Reload the page to carry on.', false); });
} catch (e) { renderer = null; console.warn('no WebGL:', e.message); }
const scene = new THREE.Scene(), camera = new THREE.PerspectiveCamera(40, innerWidth / innerHeight, 0.02, 240);
const controls = renderer ? new OrbitControls(camera, renderer.domElement) : { update() {}, target: new THREE.Vector3() };   // drag to look around
Object.assign(controls, { enableDamping: true, dampingFactor: 0.08, minDistance: 0.08, maxDistance: 6, enablePan: false });

// keep what the camera looks at in the part of the window the panel doesn't cover:
// on a wide screen the panel is on the right, so shift the picture left and widen the view;
// on a phone it is a bottom sheet, so lift the picture into the top part. Eases as the panel slides.
const phone = () => innerWidth <= 820;
let panelShare = 0, shiftX = 0, shiftY = 0, widen = 1;
function frameView() {
  const w = innerWidth, h = innerHeight;
  camera.aspect = w / h; renderer?.setSize(w, h); applyFraming();
}
function applyFraming() {
  const w = innerWidth, h = innerHeight;
  camera.setViewOffset(w, h, shiftX * w, shiftY * h, w, h); camera.zoom = widen; camera.updateProjectionMatrix();
}
function easeFraming() {
  const on = panelShare > 0 && device, p = phone();
  const x1 = on && !p ? panelShare / 2 : 0, y1 = on && p ? panelShare / 2 : 0, z1 = on && !p ? 1 - panelShare : 1;
  if (Math.abs(x1 - shiftX) < 1e-4 && Math.abs(y1 - shiftY) < 1e-4 && Math.abs(z1 - widen) < 1e-4) return false;
  const k = reduced ? 1 : 0.14; shiftX += (x1 - shiftX) * k; shiftY += (y1 - shiftY) * k; widen += (z1 - widen) * k; applyFraming();
  return true;
}
addEventListener('resize', () => { frameView(); if (panel.classList.contains('open')) openPanel(true); });

// ---------------------------------------------------------------- tweens and camera moves
const ease = t => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);
const tweens = new Set();
function tween(seconds, fn) {
  return new Promise(done => {
    if (reduced || seconds <= 0) { fn(1); done(); return; }
    tweens.add({ start: performance.now(), dur: seconds * 1000, fn, done });
  });
}
let flight = null, room = null, screens = null, device = null;   // no screen yet: the first step flies there
function fly(to) {
  return new Promise(done => {
    device = to; updateDeviceButtons();
    try {
      const plan = planScreenFlight(room.root, camera, to);   // Codex's route around the furniture
      flight = { plan, start: performance.now() - (reduced ? plan.duration * 1000 : 0), done };   // reduced motion: arrive at once
    } catch {
      // no route from here (e.g. outside the room): glide straight to a spot in front of the screen
      const mesh = screens[to].mesh, c = mesh.getWorldPosition(new THREE.Vector3());
      const n = new THREE.Vector3(0, 0, 1).transformDirection(mesh.matrixWorld);
      const p1 = c.clone().addScaledVector(n, to === 'laptop' ? 0.42 : 0.62), p0 = camera.position.clone(), t0 = controls.target.clone();
      tween(1.6, t => { camera.position.lerpVectors(p0, p1, ease(t)); controls.target.lerpVectors(t0, c, ease(t)); }).then(done);
    }
  });
}
function updateDeviceButtons() { for (const d of ['monitor', 'laptop']) $(`go-${d}`).setAttribute('aria-pressed', d === device); }

// ---------------------------------------------------------------- playing out an answer
const wait = s => new Promise(r => setTimeout(r, s * 1000));   // pauses stay with reduced motion: they are reading time
async function play(actions, dev) {
  const scr = () => screens[device === dev ? dev : device];
  for (const [what, arg] of actions) {
    const s = screens[dev];
    if (what === 'fly') { await fly(arg); continue; }
    if (what === 'laptop') { screens.laptop.show(arg); await wait(0.4); continue; }
    if (what === 'show') { s.show(arg); await wait(0.5); continue; }
    if (what === 'wait') { await wait(arg); continue; }
    if (what === 'highlight') { s.highlight(arg); await wait(0.9); continue; }
    if (what === 'cursor') {
      const pt = s.point(arg); if (!pt) continue;
      const to = s.at(pt, [0.3, 0.6]), from = s.cursor.position.clone(); s.cursor.visible = true;
      await tween(0.8, t => s.cursor.position.lerpVectors(from, to, ease(t)));
      continue;
    }
    if (what === 'click') {
      const c = s.cursor.position, base = s.W * 0.006;
      s.ripple.position.set(c.x, c.y, s.ripple.position.z);
      await tween(0.45, t => { s.ripple.scale.setScalar(base + base * 4 * t); s.ripple.material.opacity = 0.9 * (1 - t); s.cursor.scale.setScalar(s.W * 0.024 * (t < 0.3 ? 0.85 : 1)); });
      continue;
    }
  }
  void scr;
}

// ---------------------------------------------------------------- the activity
const state = { step: 0, tries: 0, firstTry: 0, clues: 0, clueLevel: 0, walkthrough: false, busy: false };
const panel = $('panel'), choicesEl = $('choices'), feedback = $('feedback');

// on a phone the panel is a bottom sheet; "Show the screen" folds it down to a strip
let folded = false;
function openPanel(open) {
  if (open) setFolded(false, true);
  panel.classList.toggle('open', open); document.body.classList.toggle('panel-open', open);
  panelShare = !open ? 0 : phone() ? panel.getBoundingClientRect().height / innerHeight : Math.min(0.5, 640 / innerWidth);
  frameView();
}
function setFolded(f, quiet) {
  folded = f && phone(); panel.classList.toggle('folded', folded);
  $('sheet-toggle').textContent = folded ? 'Show the question' : 'Show the screen';
  $('sheet-toggle').setAttribute('aria-expanded', String(!folded));
  if (!quiet) panelShare = panel.classList.contains('open') ? (folded ? 64 / innerHeight : panel.getBoundingClientRect().height / innerHeight) : 0;
}
function setProgress() {
  $('progress').replaceChildren(...STEPS.map((_, i) => { const d = document.createElement('i'); d.className = i < state.step ? 'done' : i === state.step ? 'now' : ''; return d; }));
  // rounds: a step with  round: n  starts round n
  const roundOf = i => { let r = 1; for (let k = 0; k <= i; k++) if (STEPS[k].round) r = STEPS[k].round; return r; };
  const r = roundOf(state.step), inRound = STEPS.map((_, k) => k).filter(k => roundOf(k) === r), rounds = roundOf(STEPS.length - 1);
  $('step-label').textContent = rounds > 1 ? `Round ${r} · Step ${inRound.indexOf(state.step) + 1} of ${inRound.length}` : `Step ${state.step + 1} of ${STEPS.length}`;
}
async function goTo(i) {
  state.step = i; state.tries = 0; state.clueLevel = 0; $('clue').disabled = false;
  const st = STEPS[i];
  if (device !== st.device) await fly(st.device);
  screens[st.device].show(st.screen);
  setProgress();
  $('round-banner').hidden = !st.roundIntro; $('round-banner').textContent = st.roundIntro ?? '';
  $('question').textContent = st.question;
  $('clue-text').hidden = true;
  feedback.hidden = true; feedback.className = 'feedback';
  choicesEl.replaceChildren(...st.choices.map((c, n) => {
    const b = document.createElement('button'); b.className = 'choice'; b.type = 'button';
    b.innerHTML = `<span class="key">${n + 1}</span><span>${c.text}</span>`;
    b.onclick = () => choose(n); return b;
  }));
  choicesEl.hidden = false; $('question').hidden = false;
  openPanel(true);
  if (!state.walkthrough) $('question').focus({ preventScroll: true });   // screen readers hear the question first, then Tab to the answers
}

async function choose(n) {
  if (state.busy) return;
  state.busy = true;
  const st = STEPS[state.step], c = st.choices[n];
  [...choicesEl.children].forEach((b, k) => { b.disabled = true; b.classList.toggle('picked', k === n); });
  state.tries++;
  if (c.correct && state.tries === 1 && !state.walkthrough && state.clueLevel === 0) state.firstTry++;
  openPanel(false);                                   // step aside so the answer can be watched
  $('watching').hidden = false; $('watching').textContent = state.walkthrough ? st.narration : `You chose: ${c.text}`;
  try { await play(c.playout, st.device); }
  catch (e) { console.warn('play-out stopped early:', e.message); }   // never leave the learner stuck
  finally { $('watching').hidden = true; state.busy = false; }
  showFeedback(c);
}

function showFeedback(c) {
  openPanel(true);
  choicesEl.hidden = true; $('question').hidden = true; $('clue-text').hidden = true;
  feedback.hidden = false; feedback.className = `feedback ${c.correct ? 'good' : 'try'}`;
  $('feedback-title').textContent = c.correct ? 'That’s it' : 'Not quite';
  $('feedback-text').textContent = c.feedback;
  $('try-again').hidden = c.correct; $('continue').hidden = !c.correct;
  (c.correct ? $('continue') : $('try-again')).focus({ preventScroll: true });
  $('announce').textContent = `${$('feedback-title').textContent}. ${c.feedback}`;
  if (state.walkthrough && c.correct) setTimeout(() => state.walkthrough && next(), 2600);
}
function tryAgain() { goTo(state.step).then(() => { state.tries = Math.max(state.tries, 1); }); }
function next() { if (state.step + 1 < STEPS.length) goTo(state.step + 1); else finish(); }

function clue() {
  const st = STEPS[state.step];
  state.clueLevel++; state.clues++;
  $('clue-text').hidden = false;
  // three levels: the goal, then where to look, then the exact next action
  const right = st.choices.find(c => c.correct).text;
  $('clue-text').textContent = state.clueLevel === 1 ? st.clue
    : state.clueLevel === 2 ? 'Look where the gold ring is on the screen.'
    : `Next action: ${right}.`;
  if (state.clueLevel >= 2) screens[st.device].highlight(st.hint, COLORS.GOLD);
  if (state.clueLevel >= 3) $('clue').disabled = true;
  $('announce').textContent = $('clue-text').textContent;
}

// the walkthrough: does every remaining step with the right answer, narrating as it goes
async function walkthrough() {
  state.walkthrough = true; state.usedWalkthrough = true; document.body.classList.add('walkthrough');
  $('walk').textContent = 'Stop walkthrough';
  await goTo(state.step);
  while (state.walkthrough) {
    const st = STEPS[state.step], right = st.choices.findIndex(c => c.correct);
    await wait(1.2);
    if (!state.walkthrough) break;
    const at = state.step;
    await choose(right);
    await new Promise(r => { const t = setInterval(() => { if (!state.walkthrough || state.step !== at || $('finish').hidden === false) { clearInterval(t); r(); } }, 150); });
    if (!$('finish').hidden) break;
  }
  stopWalkthrough();
}
function stopWalkthrough() { state.walkthrough = false; document.body.classList.remove('walkthrough'); $('walk').textContent = 'Walk me through'; }

function finish() {
  // a walkthrough shows the way, but finishing is something the learner does themselves
  if (state.walkthrough) { stopWalkthrough(); walkthroughDone(); return; }
  stopWalkthrough();
  $('progress').querySelectorAll('i').forEach(i => { i.className = 'done'; });
  showReview();
}
// the last stage: a review of what has been learned
function showReview() {
  setStage(3);
  panel.querySelectorAll('.step-body, #intro, #finish').forEach(e => { e.hidden = true; });
  $('review').hidden = false; openPanel(true);
  $('step-label').textContent = 'Review';
  $('review-title').textContent = REVIEW.title;
  $('review-points').replaceChildren(...REVIEW.points.map(([head, text]) => {
    const li = document.createElement('li'); li.innerHTML = '<b></b><span></span>';
    li.firstChild.textContent = head; li.lastChild.textContent = text; return li;
  }));
  $('announce').textContent = `${ACTIVITY.finish} ${REVIEW.title}.`;
  $('review-again').focus({ preventScroll: true });
}
function walkthroughDone() {
  panel.querySelectorAll('.step-body').forEach(e => { e.hidden = true; });
  $('finish').hidden = false; openPanel(true);
  $('finish-title').textContent = 'That’s the walkthrough';
  $('finish-text').textContent = 'You’ve seen every step. Now try it yourself: the steps start again from the Strategic Epic.';
  $('score').textContent = '';
  $('restart').textContent = 'Try it myself'; $('restart').focus();
}
function restart() {
  $('restart').textContent = 'Try it again';
  Object.assign(state, { step: 0, tries: 0, firstTry: 0, clues: 0, clueLevel: 0, usedWalkthrough: false });
  $('finish').hidden = true; $('review').hidden = true; panel.querySelectorAll('.step-body').forEach(e => { e.hidden = false; });
  setStage(2);
  screens.laptop.show(START.laptop); screens.monitor.cursor.visible = false; screens.laptop.cursor.visible = false;
  goTo(0);
}

// ---------------------------------------------------------------- controls
$('clue').onclick = clue;
$('walk').onclick = () => (state.walkthrough ? stopWalkthrough() : walkthrough());
$('try-again').onclick = tryAgain;
$('continue').onclick = next;
$('restart').onclick = restart;
$('rewatch').onclick = () => { restart(); walkthrough(); };
$('begin').onclick = () => { document.body.classList.add('started'); $('intro').hidden = true; panel.querySelectorAll('.step-body').forEach(e => { e.hidden = false; }); goTo(0); };
// ---------------------------------------------------------------- the journey: film → explainer → your turn → review
let stage = 0, roomReady = false;
const video = $('journey-video');
function setStage(n) {
  stage = n;
  $('stages').replaceChildren(...JOURNEY.stages.map((name, i) => {
    const li = document.createElement('li'); li.textContent = name;
    li.className = i < n ? 'done' : i === n ? 'now' : ''; if (i === n) li.setAttribute('aria-current', 'step'); return li;
  }));
}
function playVideo(which) {                                   // which: 'film' or 'explainer'
  const src = which === 'film' ? JOURNEY.film : JOURNEY.explainer;
  setStage(which === 'film' ? 0 : 1);
  document.body.classList.add('in-journey'); $('journey').hidden = false; $('journey').classList.remove('at-landing');
  $('landing').hidden = true; $('player').hidden = false;
  $('player-note').textContent = which === 'film' ? `The full film · ${JOURNEY.film.minutes}` : JOURNEY.explainer.intro;
  video.replaceChildren(); video.removeAttribute('src');
  video.poster = which === 'film' ? JOURNEY.film.poster : '';
  video.src = src.src;
  // captions on by default (the explainer has its words in the picture already)
  if (src.captions) { const tr = document.createElement('track'); Object.assign(tr, { kind: 'captions', src: src.captions, srclang: 'en', label: 'English', default: true }); video.append(tr); tr.track.mode = 'showing'; }
  $('journey-skip').textContent = which === 'film' ? 'Skip to the explainer' : 'Skip to the activity';
  $('journey-skip').onclick = () => (which === 'film' ? playVideo('explainer') : toActivity());
  video.onended = () => (which === 'film' ? playVideo('explainer') : toActivity());
  video.play().catch(() => {});
  $('journey-skip').focus({ preventScroll: true });
}
function toActivity() {
  video.pause(); setStage(2);
  $('journey').hidden = true; document.body.classList.remove('in-journey');
  if (roomReady) { openPanel(true); $('begin').focus(); return; }
  $('status').hidden = false;
  if (!renderer) { showProblem('This device can’t show the 3D office (its graphics are switched off or too old). The film and the explainer still work.', false); return; }
  loadRoom();
}
// something went wrong: say so plainly and offer a way on (retry) and a way back
function showProblem(text, canRetry) {
  $('status').hidden = false; $('status-text').textContent = text;
  $('status-actions').hidden = false; $('retry').hidden = !canRetry;
  (canRetry ? $('retry') : $('back-to-start')).focus();
}
$('retry').onclick = () => { $('status-actions').hidden = true; loading = null; loadRoom(); };
$('back-to-start').onclick = () => {
  $('status').hidden = true; $('status-actions').hidden = true; setStage(0);
  document.body.classList.add('in-journey'); $('journey').hidden = false; $('journey').classList.add('at-landing');
  $('player').hidden = true; $('landing').hidden = false; $('start-film').focus();
};
$('sheet-toggle').onclick = () => setFolded(!folded);
$('start-film').onclick = () => playVideo('film');
$('skip-to-explainer').onclick = () => playVideo('explainer');
$('review-film').onclick = () => playVideo('film');
$('review-explainer').onclick = () => playVideo('explainer');
$('review-again').onclick = () => { restart(); };
$('go-monitor').onclick = () => fly('monitor');
$('go-laptop').onclick = () => fly('laptop');
$('go-room').onclick = () => { flight = null; tween(1.4, (() => { const p0 = camera.position.clone(), t0 = controls.target.clone(), p1 = new THREE.Vector3(1.9, 1.75, 2.6), t1 = new THREE.Vector3(-0.2, 1.05, -0.3); return t => { camera.position.lerpVectors(p0, p1, ease(t)); controls.target.lerpVectors(t0, t1, ease(t)); }; })()); };
addEventListener('keydown', e => {
  // shortcuts only while a question is on screen (not on the cover, a film or the review)
  if (e.target.closest?.('input, textarea, video') || e.ctrlKey || e.metaKey || e.altKey) return;
  const asking = stage === 2 && $('journey').hidden && panel.classList.contains('open') && !choicesEl.hidden && !$('question').hidden && $('intro').hidden;
  if (!asking) return;
  if (/^[1-9]$/.test(e.key)) { const b = choicesEl.children[+e.key - 1]; if (b && !b.disabled) b.click(); }
  else if (e.key.toLowerCase() === 'c' && !state.walkthrough && !$('clue').disabled) clue();
});

// ---------------------------------------------------------------- start
// the landing page: the full film first
// the cover (hero): words and picture from steps.js › JOURNEY.landing
const L = JOURNEY.landing, li = (cls, ...kids) => { const e = document.createElement('li'); if (cls) e.className = cls; e.append(...kids); return e; };
const span = (cls, text) => { const e = document.createElement('span'); e.className = cls; e.textContent = text; return e; };
$('hero-brand').textContent = L.brand; $('landing-eyebrow').textContent = L.kicker; $('landing-title').textContent = L.title; $('landing-text').textContent = L.lede;
$('hero-image').src = L.image; $('hero-image').alt = L.imageAlt;
$('hero-meta').replaceChildren(...L.meta.map(m => li('', m)));
$('hero-parts').replaceChildren(...L.parts.map(([title, time, text], i) => li('part', span('part-n', String(i + 1).padStart(2, '0')), span('part-title', title), span('part-time', time), span('part-text', text))));
$('hero-footnote').textContent = L.footnote;
$('journey').classList.add('at-landing');
setStage(0); $('status').hidden = true;
window.__shell = true;   // the landing page is ready (the office loads later)

// the 3D office is built only when the learner reaches "Your turn": building it is heavy and,
// while a film plays, it would make the film stutter
let loading = null;
const loadRoom = () => (loading ??= (async () => {
  const status = $('status'), text = $('status-text');
  text.textContent = 'Setting up the office…';
  let slow = setTimeout(() => { text.textContent = 'Still setting up the office. Slower devices can take a minute…'; }, 25000);
  try {
    room ??= await buildRoom(scene, renderer, p => { text.textContent = typeof p === 'string' ? p : 'Loading the office…'; });
    await loadScreens('../../../tool-screens/recreations/');
    screens = attachScreens(room.root);
    screens.monitor.show(START.monitor); screens.laptop.show(START.laptop);
    camera.position.set(1.9, 1.75, 2.6); controls.target.set(-0.2, 1.05, -0.3); controls.update();
    $('title').textContent = ACTIVITY.title; $('intro-text').textContent = ACTIVITY.intro;
    status.hidden = true; document.body.classList.add('ready'); roomReady = true;
    if (stage === 2 && $('journey').hidden) { openPanel(true); $('begin').focus(); }
    window.__activity = { state, STEPS, screens, ready: true, stage: () => stage, playVideo, toActivity };
  } catch (e) {
    console.error(e);
    showProblem('The office didn’t load. Check your connection and try again.', true);
  } finally { clearTimeout(slow); }
})());

// draw only when something moves (camera, cursor, ring, panel); otherwise a few times a second
// for the room's slow sun drift. If frames run slow, draw at a lower resolution.
const clock = new THREE.Clock();
let dragging = false, lastDraw = 0, slowFrames = 0, ratio = renderer ? renderer.getPixelRatio() : 1;
if (renderer) {
  controls.addEventListener('start', () => { dragging = true; });
  controls.addEventListener('end', () => { dragging = false; });
}
renderer?.setAnimationLoop(() => {
  if (!room || !$('journey').hidden) return;   // nothing to draw yet, or a film is on screen: leave the graphics chip to the video
  const now = performance.now();
  let moving = tweens.size > 0 || !!flight || dragging;
  for (const t of [...tweens]) { const p = Math.min(1, (now - t.start) / t.dur); t.fn(p); if (p >= 1) { tweens.delete(t); t.done(); } }
  if (flight) {
    const t = Math.min(1, (now - flight.start) / (flight.plan.duration * 1000));
    const pose = flight.plan.sample(t); camera.position.copy(pose.position); camera.quaternion.copy(pose.rotation); camera.fov = pose.fov; camera.updateProjectionMatrix();
    controls.target.copy(flight.plan.frame.center);
    if (t >= 1) { const d = flight.done; flight = null; d(); }
  } else if (controls.update()) moving = true;   // still gliding after a drag
  if (easeFraming()) moving = true;
  if (screens) for (const s of Object.values(screens)) if (s.hl.material.opacity > 0) { s.hl.material.opacity = 0.65 + 0.35 * Math.sin(now / 260); moving = true; }
  if (!moving && now - lastDraw < 250) return;
  room?.animate?.(clock.getElapsedTime(), 1);

  renderer.render(scene, camera);
  if (moving && lastDraw && now - lastDraw < 100) {   // adaptive resolution while things move
    slowFrames = now - lastDraw > 45 ? slowFrames + 1 : Math.max(0, slowFrames - 1);
    if (slowFrames > 20 && ratio > 0.75) { ratio = Math.max(0.75, ratio - 0.25); renderer.setPixelRatio(ratio); frameView(); slowFrames = 0; }
  }
  lastDraw = now;
});
