import * as THREE from './vendor/three.module.js';
import { createWorld, createJetski } from './world3d.js';
const T=window.TERRAIN, W=T.width,H=T.height;
const decode=s=>Uint8Array.from(atob(s),c=>c.charCodeAt(0));
const heights=decode(T.heights),colors=decode(T.colors);
const canvas=document.getElementById('game');
const mw=292,mh=177, map=document.getElementById('map'),mc=map.getContext('2d');
const keys=new Set(), player={x:605,y:106,a:Math.PI*1.15,v:0};
let running=false,started=false,time=0,last=0,turn=0,toastTime=0,mapOpen=false,audioCtx,osc,gain,sound=false;
const points=[{x:609,y:91,name:'Águas da barragem'},{x:545,y:136,name:'Ilhas do lago'},{x:558,y:246,name:'Canal dos morros'},{x:419,y:286,name:'Encontro dos braços'},{x:122,y:254,name:'Recanto do oeste'}];
const visited=new Set();
let vx=0,vy=0,cameraAngle=player.a,throttle=0;const wake=[];
const land=(x,y)=>x<2||y<2||x>=W-2||y>=H-2||heights[(y|0)*W+(x|0)]>0;
function safe(x,y){for(const [dx,dy]of [[0,0],[1.5,0],[-1.5,0],[0,1.5],[0,-1.5]])if(land(x+dx,y+dy))return false;return true}
// Keep discovery targets on navigable water even when map labels overlap a shore.
for(const p of points){if(!safe(p.x,p.y)){let best=1e9,bx=p.x,by=p.y;for(let y=p.y-25;y<p.y+25;y++)for(let x=p.x-25;x<p.x+25;x++){const d=(x-p.x)**2+(y-p.y)**2;if(d<best&&safe(x,y)){best=d;bx=x;by=y}}p.x=bx;p.y=by}}
const mini=document.createElement('canvas');mini.width=W;mini.height=H;const miniCtx=mini.getContext('2d'),mi=miniCtx.createImageData(W,H);
const palette=[[18,69,104],[27,105,133],[51,151,160],[137,202,170],[230,207,139],[176,153,92],[42,76,52],[61,111,57],[100,151,65],[150,184,79],[24,40,48],[250,236,190],[237,143,61],[181,69,53],[241,195,114],[62,65,93]];
function terrainColor(x,y){if(x<0||y<0||x>=W||y>=H)return 6;const i=y*W+x,h=heights[i];if(!h){const shore=heights[Math.max(0,i-2)]||heights[Math.min(W*H-1,i+2)]||heights[Math.max(0,i-W*2)]||heights[Math.min(W*H-1,i+W*2)];return shore?2:1}if(h<4)return 4;if(h<7)return 5;return h<19?7:h<38?8:9}
for(let y=0;y<H;y++)for(let x=0;x<W;x++){const i=y*W+x,c=palette[terrainColor(x,y)];mi.data.set([...c,255],i*4)}miniCtx.putImageData(mi,0,0);
function toast(text){document.getElementById('toast').textContent=text;document.getElementById('toast').classList.remove('hidden');toastTime=4}
function pause(){running=false;keys.clear();document.getElementById('overlay').classList.remove('hidden');document.getElementById('paneltitle').textContent='Uma pausa na água.';document.getElementById('start').textContent='Continuar a explorar →'}
document.getElementById('start').onclick=()=>{running=true;started=true;document.getElementById('overlay').classList.add('hidden');if(audioCtx)audioCtx.resume()};
document.getElementById('pause').onclick=()=>{if(running)pause();else document.getElementById('start').click()};
function toggleMap(){mapOpen=!mapOpen;document.getElementById('mapbox').classList.toggle('expanded',mapOpen)}
document.getElementById('mapbox').onclick=toggleMap;
function reset(){Object.assign(player,{x:605,y:106,a:Math.PI*1.15,v:0});vx=vy=throttle=turn=0;cameraAngle=player.a;wake.length=0;toast('De volta às águas da barragem')}
window.addEventListener('keydown',e=>{const k=e.key.toLowerCase();if(['arrowup','arrowdown','arrowleft','arrowright',' '].includes(k))e.preventDefault();if(e.repeat)return;if(k==='m')toggleMap();if(k==='r')reset();if(k==='escape'||k===' '){if(running)pause();else if(started)document.getElementById('start').click()}keys.add(k)});
window.addEventListener('keyup',e=>keys.delete(e.key.toLowerCase()));window.addEventListener('blur',()=>{keys.clear();if(running)pause()});
document.addEventListener('visibilitychange',()=>{if(document.hidden&&running)pause()});
for(const b of document.querySelectorAll('[data-key]')){b.addEventListener('pointerdown',e=>{e.preventDefault();b.setPointerCapture(e.pointerId);keys.add(b.dataset.key)});for(const ev of ['pointerup','pointercancel','lostpointercapture'])b.addEventListener(ev,()=>keys.delete(b.dataset.key))}
document.getElementById('audio').onclick=()=>{sound=!sound;if(sound&&!audioCtx){audioCtx=new AudioContext();osc=audioCtx.createOscillator();gain=audioCtx.createGain();osc.type='triangle';osc.connect(gain);gain.connect(audioCtx.destination);gain.gain.value=0;osc.start()}if(audioCtx)audioCtx.resume();document.getElementById('audio').textContent='Som: '+(sound?'ligado':'desligado')};
function update(dt){if(running)time+=dt;if(toastTime>0){toastTime-=dt;if(toastTime<=0)document.getElementById('toast').classList.add('hidden')}if(gain){gain.gain.setTargetAtTime(sound&&running?.035:0,audioCtx.currentTime,.1);osc.frequency.setTargetAtTime(42+Math.abs(player.v)*7,audioCtx.currentTime,.15)}if(!running)return;
const up=keys.has('w')||keys.has('arrowup'),down=keys.has('s')||keys.has('arrowdown');
const steering=(keys.has('d')||keys.has('arrowright')?1:0)-(keys.has('a')||keys.has('arrowleft')?1:0);
turn+=(steering-turn)*(1-Math.exp(-dt*4));
throttle+=((up?1:down?-1:0)-throttle)*(1-Math.exp(-dt*5));
const max=keys.has('shift')?32:21;
player.v+=(throttle*(down&&player.v>0?22:12)-player.v*(up?12/max:.85))*dt;player.v=Math.max(-6,Math.min(32,player.v));
player.a+=turn*dt*1.45*Math.min(1,Math.abs(player.v)/5)*(player.v<-.2?-1:1)/(1+Math.abs(player.v)*.012);
const grip=1-Math.exp(-dt*4.5);vx+=(Math.sin(player.a)*player.v-vx)*grip;vy+=(-Math.cos(player.a)*player.v-vy)*grip;
const steps=Math.max(1,Math.ceil(Math.hypot(vx,vy)*dt/.4));for(let i=0;i<steps;i++){const nx=player.x+vx*dt/steps,ny=player.y+vy*dt/steps;if(safe(nx,ny)){player.x=nx;player.y=ny}else{vx=vy=0;player.v*=.15;if(toastTime<=0)toast('Margem próxima — vire para voltar à água');break}}
cameraAngle+=Math.atan2(Math.sin(player.a-cameraAngle),Math.cos(player.a-cameraAngle))*(1-Math.exp(-dt*5));
if(Math.abs(player.v)>3&&(!wake.length||time-wake[wake.length-1].t>.09))wake.push({x:player.x-Math.sin(player.a)*2,y:player.y+Math.cos(player.a)*2,a:player.a,t:time});while(wake.length&&time-wake[0].t>3)wake.shift();
for(let i=0;i<points.length;i++){const p=points[i];if(!visited.has(i)&&Math.hypot(player.x-p.x,player.y-p.y)<16){visited.add(i);toast(visited.size===5?'Expedição completa! Continue navegando livremente.':'Lugar descoberto: '+p.name);document.getElementById('found').textContent=visited.size+' / 5 lugares descobertos'}}
}

// WebGL scene: terrain, vehicle and vegetation share the same 3D coordinate space.
const startButton=document.getElementById('start');startButton.disabled=true;startButton.textContent='Preparando cenário 3D…';
let renderer;
try{renderer=new THREE.WebGLRenderer({canvas,antialias:true,alpha:false,powerPreference:'high-performance'});}catch(error){document.getElementById('paneltitle').textContent='Não foi possível iniciar o 3D';startButton.textContent='Ative a aceleração gráfica do navegador';console.error(error);throw error}
renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,1.5));renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=.85;
const world=createWorld(W,H,heights),{scene,camera,water,sun,elevation}=world,{boat,bank}=createJetski();scene.add(boat);
const buoyMaterial=new THREE.MeshStandardMaterial({color:0xffc154,roughness:.35});
const buoys=points.map(p=>{const group=new THREE.Group(),body=new THREE.Mesh(new THREE.CylinderGeometry(.25,.4,.85,12),buoyMaterial.clone()),stripe=new THREE.Mesh(new THREE.CylinderGeometry(.27,.34,.16,12),new THREE.MeshStandardMaterial({color:0xffffe5}));body.position.y=.3;stripe.position.y=.45;group.add(body,stripe);group.position.set(p.x,0,p.y);scene.add(group);return group});
const foam=new THREE.InstancedMesh(new THREE.PlaneGeometry(1,1),new THREE.MeshBasicMaterial({color:0xd0ece7,transparent:true,opacity:.37,depthWrite:false,side:THREE.DoubleSide}),128);foam.count=0;foam.frustumCulled=false;scene.add(foam);const foamPose=new THREE.Object3D();
let cameraReady=false;const desired=new THREE.Vector3(),target=new THREE.Vector3();
function resize(){const w=canvas.clientWidth,h=canvas.clientHeight;renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix()}window.addEventListener('resize',resize);resize();
canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();pause();document.getElementById('paneltitle').textContent='Conexão gráfica interrompida';startButton.textContent='Recarregue a página para continuar';startButton.disabled=true});
function render(dt=.016){
 water.material.uniforms.time.value=time*.65;
 const bob=Math.sin(time*2.5+player.x*.2)*.045+Math.sin(time*4)*Math.abs(player.v)*.0015;
 boat.position.set(player.x,.15+bob,player.y);boat.rotation.y=-player.a;bank.rotation.z=turn*Math.min(.23,Math.abs(player.v)*.012);bank.rotation.x=-Math.min(.11,Math.abs(player.v)*.005)+Math.sin(time*3)*.012;
 let arm=7.5+Math.abs(player.v)*.07;
 for(let d=.5;d<=arm;d+=.5){if(land(player.x-Math.sin(cameraAngle)*d,player.y+Math.cos(cameraAngle)*d)){arm=Math.max(2,d-.7);break}}
 desired.set(player.x-Math.sin(cameraAngle)*arm,4.0+Math.abs(player.v)*.025,player.y+Math.cos(cameraAngle)*arm);
 if(!cameraReady){camera.position.copy(desired);cameraReady=true}else camera.position.lerp(desired,1-Math.exp(-dt*7));
 camera.position.y=Math.max(camera.position.y,elevation(camera.position.x,camera.position.z)+1.3);
 target.set(player.x+Math.sin(player.a)*6,1.1,player.y-Math.cos(player.a)*6);camera.lookAt(target);
 sun.position.set(player.x-80,150,player.y-100);sun.target.position.set(player.x,0,player.y);
 buoys.forEach((b,i)=>{b.position.y=Math.sin(time*2+i)*.08;b.children[0].material.color.set(visited.has(i)?0x81d19b:0xffc154)});
 let count=0;for(const w of wake){const age=time-w.t;for(const side of [-1,1]){if(count>=128)break;const spread=.5+age*.65;foamPose.position.set(w.x+Math.cos(w.a)*side*spread,.07,w.y+Math.sin(w.a)*side*spread);foamPose.rotation.set(-Math.PI/2,0,-w.a);foamPose.scale.set(.24+age*.16,.7+age*.5,1);foamPose.updateMatrix();foam.setMatrixAt(count++,foamPose.matrix)}}foam.count=count;foam.instanceMatrix.needsUpdate=true;
 document.getElementById('speed').textContent=Math.round(Math.abs(player.v)*2.4);
 const angle=((player.a*180/Math.PI)%360+360)%360;document.getElementById('compass').textContent=['N','NE','L','SE','S','SO','O','NO'][Math.round(angle/45)%8]+' · '+Math.round(angle)+'°';
 mc.clearRect(0,0,mw,mh);mc.drawImage(mini,0,0,mw,mh);points.forEach((p,i)=>{mc.fillStyle=visited.has(i)?'#a4df9a':'#ffd06c';mc.fillRect(p.x/W*mw-2,p.y/H*mh-2,4,4)});mc.save();mc.translate(player.x/W*mw,player.y/H*mh);mc.rotate(player.a);mc.fillStyle='#fff';mc.beginPath();mc.moveTo(0,-6);mc.lineTo(4,5);mc.lineTo(0,3);mc.lineTo(-4,5);mc.closePath();mc.fill();mc.restore();
 renderer.render(scene,camera);
}
renderer.debug.onShaderError=(gl,program,vs,fs)=>{pause();document.getElementById('paneltitle').textContent='Erro ao carregar os efeitos 3D';startButton.disabled=true;console.error(gl.getProgramInfoLog(program),gl.getShaderInfoLog(vs),gl.getShaderInfoLog(fs))};
render();startButton.disabled=false;startButton.textContent='Começar a navegar →';
function loop(now){const dt=Math.min(.05,(now-last)/1000||.016);last=now;update(dt);render(dt);requestAnimationFrame(loop)}requestAnimationFrame(loop);


