import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import {createWorld,createJetski} from '../public/jetski/world3d.js';
const context2d={createImageData:(w,h)=>({data:new Uint8ClampedArray(w*h*4)}),putImageData(){}};
const elements=new Map();const el=id=>{if(!elements.has(id))elements.set(id,{getContext:()=>context2d,classList:{add(){},remove(){},toggle(){}},addEventListener(){},textContent:'',click(){this.onclick?.()}});return elements.get(id)};
const events={},sandbox={Uint8Array,Uint8ClampedArray,Math,Set,atob,window:{addEventListener:(k,f)=>events[k]=f},document:{getElementById:el,createElement:()=>el('map-offscreen'),addEventListener(){},querySelectorAll:()=>[]}};
vm.createContext(sandbox);vm.runInContext(fs.readFileSync('public/jetski/terrain.js','utf8'),sandbox);
let code=fs.readFileSync('public/jetski/game.js','utf8').split('// WebGL scene:')[0].replace(/^import .*;$/gm,'');
vm.runInContext(code+';window.test={player,points,safe,keys,update,reset,heights,W,H};',sandbox);
const t=sandbox.window.test;assert(t.safe(t.player.x,t.player.y));for(const p of t.points)assert(t.safe(p.x,p.y));
el('start').click();t.keys.add('w');const start={...t.player};for(let i=0;i<120;i++)t.update(1/60);assert(Math.hypot(t.player.x-start.x,t.player.y-start.y)>5);
t.keys.add('d');const heading=t.player.a;for(let i=0;i<60;i++)t.update(1/60);assert(t.player.a>heading);
for(let i=0;i<3000;i++){t.update(1/60);assert(t.safe(t.player.x,t.player.y))}
t.keys.clear();t.reset();t.keys.add('s');for(let i=0;i<120;i++)t.update(1/60);assert(t.player.v<0);events.blur();const paused={...t.player};t.update(.05);assert.equal(t.player.x,paused.x);
const world=createWorld(t.W,t.H,t.heights),model=createJetski();
assert(world.camera.isPerspectiveCamera);assert(world.ground.geometry.index.count>100000);assert(world.water.isMesh);assert(world.water.material.uniforms.time);assert(world.trees>1000);assert(model.boat.children.length>0);
for(const child of [world.ground,...model.bank.children]){const p=child.geometry.attributes.position;assert([...p.array].every(Number.isFinite));assert(child.geometry.attributes.normal)}
assert(world.elevation(605,106)<0);
console.log(`PASS: navigation, reverse, pause, 3000 collision steps; true 3D terrain (${world.ground.geometry.index.count/3} triangles), ${world.trees} trees, reflective water and ${model.bank.children.length} vehicle meshes.`);
