import * as THREE from './vendor/three.module.js';
import { Sprint, LANES } from './engine.js';

const $ = id => document.getElementById(id);
const model = new Sprint();
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
try { model.best = Math.max(0, Number(localStorage.getItem('sivvis-sprint-best')) || 0); } catch { /* Storage is optional. */ }
$('best').textContent = format(model.best);
let renderer, camera, scene, player, ring;
let previous = 0, flash = 0, travel = 0;
const entities = new Map();
const scenery = [], markers = [];
const materials = {};

function format(score) { return String(Math.floor(score)).padStart(3, '0'); }
function announce(text) { $('announcement').textContent = text; }
function panel(kicker, title, description, button) {
  $('panel-kicker').textContent = kicker;
  $('panel-title').textContent = title;
  $('panel-description').textContent = description;
  $('start').replaceChildren(document.createTextNode(button + ' '));
  const arrow = document.createElement('span'); arrow.textContent = '↗'; arrow.setAttribute('aria-hidden','true'); $('start').append(arrow);
  $('panel').hidden = false;
}
function ui() {
  const running = model.state === 'running';
  $('left').disabled = $('right').disabled = !running;
  $('pause').disabled = !running && model.state !== 'paused';
  $('pause').setAttribute('aria-label',model.state === 'paused' ? 'Spiel fortsetzen' : 'Spiel pausieren');
  $('pause').title = model.state === 'paused' ? 'Fortsetzen (P)' : 'Pause (P)';
  $('pause').innerHTML = model.state === 'paused' ? '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m9 5 10 7-10 7Z"/></svg>' : '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 5v14M15 5v14"/></svg>';
  $('control-hint').textContent = running ? '← → / A D · Wischen' : model.state === 'paused' ? 'Kurz durchatmen.' : 'Dein nächster Highscore wartet.';
}
function start() {
  if (!renderer) return;
  if (model.state === 'paused') { model.resume(); announce('Spiel fortgesetzt.'); }
  else { for (const mesh of entities.values()) scene.remove(mesh); entities.clear(); model.start(); travel=0; flash=0; announce('Spiel gestartet. Weiche den roten Blöcken aus.'); }
  $('panel').hidden = true; $('help-text').hidden=true; $('help').setAttribute('aria-expanded','false');
  $('score').textContent = format(model.score); ui(); $('pause').focus({preventScroll:true});
}
function pause() {
  if (model.state === 'paused') { start(); return; }
  if (model.state !== 'running') return;
  model.pause(); panel('Pause','Eine kleine Verschnaufpause.','Dein Lauf wartet genau hier auf dich.','Weiterlaufen');
  $('panel-tip').textContent = 'P oder Leertaste zum Fortsetzen';
  ui(); announce('Spiel pausiert.'); $('start').focus({preventScroll:true});
}
function gameOver() {
  try { localStorage.setItem('sivvis-sprint-best', String(model.best)); } catch { /* Private browsing can disable storage. */ }
  $('best').textContent = format(model.best);
  panel('Das war dein Lauf',`${model.score} Punkte.`,`${Math.floor(model.distance)} Meter · ${model.crystals} Kristalle. Noch eine Runde?`,'Nochmal spielen');
  $('panel-tip').textContent = '← → oder A / D · Auf dem Handy wischen';
  ui(); announce(`Lauf beendet. ${model.score} Punkte. ${model.crystals} Kristalle.`); $('start').focus({preventScroll:true});
}
$('start').addEventListener('click',start);
$('pause').addEventListener('click',pause);
$('left').addEventListener('click',()=>model.move(-1));
$('right').addEventListener('click',()=>model.move(1));
$('help').addEventListener('click',()=> { if (model.state === 'running') pause(); $('help-text').hidden=!$('help-text').hidden; $('help').setAttribute('aria-expanded',String(!$('help-text').hidden)); });
document.addEventListener('keydown',event=> {
  if (event.ctrlKey || event.metaKey || event.altKey || event.repeat) return;
  if (['ArrowLeft','ArrowRight','a','A','d','D'].includes(event.key)) {
    if (model.state !== 'running') return;
    event.preventDefault(); model.move(['ArrowLeft','a','A'].includes(event.key) ? -1 : 1);
  } else if (['p','P','Escape'].includes(event.key)) { event.preventDefault(); pause(); }
  else if (event.code === 'Space' && !(event.target instanceof HTMLButtonElement)) { event.preventDefault(); if (model.state !== 'running') start(); else pause(); }
});
document.addEventListener('visibilitychange',()=> { if (document.hidden && model.state === 'running') pause(); previous=0; });
window.addEventListener('blur',()=> { if (model.state === 'running') pause(); });
let touchStart=null;
$('scene').addEventListener('pointerdown',event=> { touchStart={x:event.clientX,y:event.clientY,id:event.pointerId}; $('scene').setPointerCapture(event.pointerId); });
$('scene').addEventListener('pointerup',event=> { if (!touchStart || touchStart.id!==event.pointerId) return; const dx=event.clientX-touchStart.x,dy=event.clientY-touchStart.y; if (Math.abs(dx)>25 && Math.abs(dx)>Math.abs(dy)) model.move(dx<0 ? -1 : 1); touchStart=null; });
$('scene').addEventListener('pointercancel',()=> { touchStart=null; });

function mesh(geometry,material,x,y,z) { const m=new THREE.Mesh(geometry,material); m.position.set(x,y,z); scene.add(m); return m; }
function setup() {
  scene=new THREE.Scene(); scene.background=new THREE.Color(0xf4f3ec); scene.fog=new THREE.Fog(0xf4f3ec,40,125);
  renderer=new THREE.WebGLRenderer({antialias:true,alpha:false}); renderer.setPixelRatio(Math.min(devicePixelRatio,1.5)); renderer.shadowMap.enabled=true; renderer.shadowMap.type=THREE.PCFSoftShadowMap; renderer.outputColorSpace=THREE.SRGBColorSpace;
  $('scene').append(renderer.domElement);
  camera=new THREE.PerspectiveCamera(48,1,.1,180);
  const sun=new THREE.DirectionalLight(0xfff8e8,2); sun.position.set(-12,24,10); sun.castShadow=true; sun.shadow.mapSize.set(512,512); Object.assign(sun.shadow.camera,{left:-18,right:18,top:25,bottom:-45,near:.5,far:80}); sun.shadow.bias=-.001; scene.add(sun); scene.add(new THREE.HemisphereLight(0xffffff,0xa7b99f,1.6));
  materials.ground=new THREE.MeshStandardMaterial({color:0xe7eadf,roughness:1});
  materials.road=new THREE.MeshStandardMaterial({color:0xd6dfcf,roughness:1});
  materials.line=new THREE.MeshStandardMaterial({color:0xf5f7ef,roughness:.9});
  materials.block=new THREE.MeshStandardMaterial({color:0xb96548,roughness:.75});
  materials.gem=new THREE.MeshStandardMaterial({color:0xeabd56,metalness:.35,roughness:.3});
  materials.player=new THREE.MeshStandardMaterial({color:0x306c57,metalness:.2,roughness:.25});
  materials.scenery=new THREE.MeshStandardMaterial({color:0xc5d0bc,roughness:1});
  const ground=mesh(new THREE.PlaneGeometry(300,300),materials.ground,0,-.08,-70); ground.rotation.x=-Math.PI/2; ground.receiveShadow=true;
  const road=mesh(new THREE.PlaneGeometry(9.8,230),materials.road,0,-.03,-85); road.rotation.x=-Math.PI/2; road.receiveShadow=true;
  for (const x of [-4.9,4.9]) { const line=mesh(new THREE.BoxGeometry(.12,.04,230),materials.line,x,0,-85); line.receiveShadow=true; }
  for (let z=-110;z<18;z+=6) for (const x of [-1.5,1.5]) { const m=mesh(new THREE.BoxGeometry(.08,.025,2),materials.line,x,0,z); markers.push(m); }
  for (let i=0;i<42;i++) { const side=i%2 ? 1:-1; const size=1.4+(i*13%5)*.35; const height=1.2+(i*7%6)*.6; const m=mesh(new THREE.BoxGeometry(size,height,size),materials.scenery,side*(7+(i%4)*1.5),height/2,-110+i*3); m.castShadow=true; m.receiveShadow=true; scenery.push(m); }
  player=new THREE.Group(); player.position.set(0,.78,4); scene.add(player);
  const ball=new THREE.Mesh(new THREE.SphereGeometry(.65,24,16),materials.player); ball.castShadow=true; player.add(ball);
  ring=new THREE.Mesh(new THREE.TorusGeometry(.66,.06,8,32),new THREE.MeshStandardMaterial({color:0xb9d8bd,metalness:.2,roughness:.5})); ring.rotation.x=Math.PI/2; player.add(ring);
  const dot=new THREE.Mesh(new THREE.SphereGeometry(.13,12,8),materials.gem); dot.position.set(0,.55,.32); player.add(dot);
  resize(); window.addEventListener('resize',resize);
  $('start').disabled=false; $('start').firstChild.textContent='Loslaufen '; ui(); announce('Spiel bereit.');
  requestAnimationFrame(frame);
}
function resize() { const {width,height}=$('scene').getBoundingClientRect(); renderer.setSize(width,height); camera.aspect=width/height; camera.fov=camera.aspect<.8 ? 65:48; camera.position.set(0,camera.aspect<.8 ? 10:7.8,camera.aspect<.8 ? 18:15); camera.lookAt(0,0,camera.aspect<.8 ? -8:-5); camera.updateProjectionMatrix(); }
const blockGeometry=new THREE.BoxGeometry(1.6,1.5,1.6);
const gemGeometry=new THREE.OctahedronGeometry(.6);
function renderObjects(t) {
  const active=new Set();
  for (const obj of model.objects) { active.add(obj.id); let m=entities.get(obj.id); if (!m) { m=mesh(obj.type==='gem'?gemGeometry:blockGeometry,materials[obj.type],obj.x,.8,obj.z); m.castShadow=true; m.receiveShadow=true; entities.set(obj.id,m); } m.position.z=obj.z; if (obj.type==='gem') { m.rotation.y=t*1.6; m.position.y=1.15+(reducedMotion ? 0:Math.sin(t*3+obj.id)*.12); } }
  for (const [id,m] of entities) if (!active.has(id)) { scene.remove(m); entities.delete(id); }
}
function frame(time) {
  const dt=previous ? Math.min((time-previous)/1000,.05):0; previous=time;
  const events=model.update(dt); const running=model.state==='running';
  if (running) { const movement=model.speed*dt; travel+=movement; for (const m of markers) { m.position.z+=movement; if (m.position.z>20) m.position.z-=132; } for (const m of scenery) { m.position.z+=movement; if (m.position.z>20) m.position.z-=132; } $('score').textContent=format(model.score); }
  // The last frame's score must also be shown after a collision.
  if (events.length) $('score').textContent=format(model.score);
  for (const event of events) { if (event.type==='collect') flash=.3; if (event.type==='crash') gameOver(); }
  flash=Math.max(0,flash-dt); materials.player.color.setHex(flash>0 ? 0x6ba675:0x306c57);
  player.position.x=model.x; player.position.y=.78+(running&&!reducedMotion ? Math.sin(travel*2)*.055:0); player.rotation.z=(LANES[model.lane]-model.x)*-.09; ring.rotation.z=travel*.07;
  renderObjects(time/1000); renderer.render(scene,camera); requestAnimationFrame(frame);
}
try { setup(); } catch (error) { console.error(error); panel('Spiel konnte nicht starten','Eine kurze Spielpause.','Dein Browser konnte die 3D-Grafik nicht laden. Versuche einen aktuellen Browser mit aktivierter Hardwarebeschleunigung.','Seite neu laden'); $('start').disabled=false; $('start').removeEventListener('click',start); $('start').addEventListener('click',()=>location.reload()); $('panel-tip').textContent='Die Visitenkarte ist über den Link unten erreichbar.'; announce('3D-Grafik konnte nicht geladen werden.'); }
