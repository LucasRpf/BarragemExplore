import * as THREE from './vendor/three.module.js';
import { Water } from './vendor/Water.js';
import { Sky } from './vendor/Sky.js';

const rand=(x,z)=>{let n=Math.imul(x,374761393)^Math.imul(z,668265263);return (Math.imul(n^(n>>>13),1274126177)>>>0)/4294967295};
export function createWorld(W,H,heights){
  const scene=new THREE.Scene();scene.fog=new THREE.FogExp2(0x98bbc5,.0021);
  const camera=new THREE.PerspectiveCamera(58,1,.1,1800);
  const elevation=(x,z)=>{const ix=Math.max(0,Math.min(W-1,Math.round(x))),iz=Math.max(0,Math.min(H-1,Math.round(z)));const h=heights[iz*W+ix];return h===0?-2.6:h*.43;};
  const geo=new THREE.PlaneGeometry(W-1,H-1,W-1,H-1);geo.rotateX(-Math.PI/2);geo.translate((W-1)/2,0,(H-1)/2);
  const pos=geo.attributes.position,col=new Float32Array(pos.count*3),c=new THREE.Color();
  for(let i=0;i<pos.count;i++){const x=Math.round(pos.getX(i)),z=Math.round(pos.getZ(i)),h=elevation(x,z),n=rand(x,z);pos.setY(i,h);c.set(h<0?0x668e75:h<2.5?0xc3ae80:h<5?0x8a9653:0x547b39);c.multiplyScalar(.84+n*.26);c.toArray(col,i*3)}
  geo.setAttribute('color',new THREE.BufferAttribute(col,3));geo.computeVertexNormals();
  const ground=new THREE.Mesh(geo,new THREE.MeshStandardMaterial({vertexColors:true,roughness:1}));ground.receiveShadow=true;scene.add(ground);
  scene.add(new THREE.HemisphereLight(0xc3e2ff,0x51603b,2));
  const sun=new THREE.DirectionalLight(0xffebc8,3);sun.position.set(-80,150,-100);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);Object.assign(sun.shadow.camera,{left:-55,right:55,top:55,bottom:-55,near:1,far:350});sun.shadow.normalBias=.16;scene.add(sun,sun.target);
  const sky=new Sky();sky.scale.setScalar(1500);sky.material.uniforms.turbidity.value=3;sky.material.uniforms.rayleigh.value=1.5;const sunDirection=new THREE.Vector3(-.5,.7,-.5).normalize();sky.material.uniforms.sunPosition.value.copy(sunDirection);scene.add(sky);
  // Periodic, smoothly varying wave normals, calculated as data for the water shader.
  const size=128,data=new Uint8Array(size*size*4);
  for(let z=0;z<size;z++)for(let x=0;x<size;x++){const a=x/size*Math.PI*2,b=z/size*Math.PI*2,nx=Math.cos(a*4+b*3)*.35+Math.cos(a*9-b*5)*.18,nz=Math.cos(a*4+b*3)*.26-Math.cos(a*9-b*5)*.1,i=(z*size+x)*4;const normal=new THREE.Vector3(nx,nz,1).normalize();data[i]=(normal.x*.5+.5)*255;data[i+1]=(normal.y*.5+.5)*255;data[i+2]=(normal.z*.5+.5)*255;data[i+3]=255}
  const normals=new THREE.DataTexture(data,size,size);normals.wrapS=normals.wrapT=THREE.RepeatWrapping;normals.magFilter=normals.minFilter=THREE.LinearFilter;normals.needsUpdate=true;
  const water=new Water(new THREE.PlaneGeometry(W+500,H+500),{textureWidth:512,textureHeight:512,waterNormals:normals,sunDirection,sunColor:0xfff1d4,waterColor:0x167780,distortionScale:1.8,fog:true});water.rotation.x=-Math.PI/2;water.position.set(W/2,0,H/2);water.material.uniforms.size.value=2.5;scene.add(water);
  // Instancing gives each tree real volume without thousands of separate draw calls.
  const trees=[];for(let z=3;z<H-3;z+=5)for(let x=3;x<W-3;x+=5){const tx=x+rand(x,z)*3,tz=z+rand(z,x)*3,h=elevation(tx,tz);if(h>3)trees.push({x:tx,z:tz,h,s:2.4+rand(x+2,z)*3})}
  const trunks=new THREE.InstancedMesh(new THREE.CylinderGeometry(.16,.26,1,6),new THREE.MeshStandardMaterial({color:0x66513b,roughness:1}),trees.length);
  const crowns=new THREE.InstancedMesh(new THREE.IcosahedronGeometry(1,1),new THREE.MeshStandardMaterial({color:0xffffff,roughness:.96}),trees.length*2);
  const dummy=new THREE.Object3D();
  trees.forEach((t,i)=>{dummy.position.set(t.x,t.h+t.s*.5,t.z);dummy.scale.set(1,t.s,1);dummy.rotation.set(0,0,0);dummy.updateMatrix();trunks.setMatrixAt(i,dummy.matrix);for(let k=0;k<2;k++){dummy.position.set(t.x+(k?-.55:.35)*t.s,t.h+t.s*(k?1.02:1.42),t.z);dummy.scale.set(t.s*.8,t.s*(k?.65:.85),t.s*.76);dummy.rotation.set(.1,rand(i,k)*6,.1);dummy.updateMatrix();crowns.setMatrixAt(i*2+k,dummy.matrix);c.setHSL(.23+rand(i,k)*.07,.43,.19+rand(k,i)*.13);crowns.setColorAt(i*2+k,c)}});
  trunks.castShadow=crowns.castShadow=true;trunks.receiveShadow=crowns.receiveShadow=true;scene.add(trunks,crowns);
  const stones=[];for(let z=2;z<H-2;z+=3)for(let x=2;x<W-2;x+=3){const h=elevation(x,z);if(h>.5&&h<2.2&&rand(x,z)>.45)stones.push({x,z,h})}
  const rocks=new THREE.InstancedMesh(new THREE.DodecahedronGeometry(1,0),new THREE.MeshStandardMaterial({color:0xb3a183,roughness:1}),stones.length);
  stones.forEach((r,i)=>{dummy.position.set(r.x,r.h*.6,r.z);dummy.scale.set(.5+rand(i,1),.4+rand(i,2),.7+rand(i,3));dummy.rotation.set(rand(i,4),rand(i,5)*6,rand(i,6));dummy.updateMatrix();rocks.setMatrixAt(i,dummy.matrix)});rocks.castShadow=rocks.receiveShadow=true;scene.add(rocks);
  return {scene,camera,water,sun,elevation,ground,trees:trees.length};
}

export function createJetski(){
  const boat=new THREE.Group(),bank=new THREE.Group();boat.add(bank);
  const materials={orange:new THREE.MeshStandardMaterial({color:0xff8a22,roughness:.35,metalness:.12}),black:new THREE.MeshStandardMaterial({color:0x182c36,roughness:.65}),white:new THREE.MeshStandardMaterial({color:0xe8eee3,roughness:.35}),skin:new THREE.MeshStandardMaterial({color:0xc99465,roughness:.9}),vest:new THREE.MeshStandardMaterial({color:0xff981f,roughness:.85})};
  function mesh(geo,mat,x,y,z,sx=1,sy=1,sz=1){const m=new THREE.Mesh(geo,materials[mat]);m.position.set(x,y,z);m.scale.set(sx,sy,sz);m.castShadow=m.receiveShadow=true;bank.add(m);return m}
  // Closed hull mesh, with a tapered bow pointing along local -Z.
  const rings=[{z:-1.8,w:.13,y:.40},{z:-1.15,w:.62,y:.43},{z:.25,w:.84,y:.32},{z:1.35,w:.65,y:.20}],v=[],ind=[];
  rings.forEach(r=>v.push(-r.w,r.y,r.z,r.w,r.y,r.z,r.w*.7,-.19,r.z,-r.w*.7,-.19,r.z));
  for(let r=0;r<3;r++)for(let j=0;j<4;j++){const a=r*4+j,b=r*4+(j+1)%4,c=(r+1)*4+j,d=(r+1)*4+(j+1)%4;ind.push(a,b,c,b,d,c)}ind.push(0,3,1,1,3,2,12,13,15,13,14,15);
  const hull=new THREE.BufferGeometry();hull.setAttribute('position',new THREE.Float32BufferAttribute(v,3));hull.setIndex(ind);hull.computeVertexNormals();materials.orange.side=THREE.DoubleSide;mesh(hull,'orange',0,0,0);
  mesh(new THREE.SphereGeometry(1,20,12),'white',0,.25,.1,.74,.22,1.25);
  mesh(new THREE.CapsuleGeometry(.26,.7,5,12),'black',0,.56,.15,.95,.6,1.8).rotation.x=Math.PI/2;
  mesh(new THREE.BoxGeometry(.65,.22,.42),'black',0,.8,-.85).rotation.x=-.3;
  mesh(new THREE.CylinderGeometry(.055,.055,1.05,8),'black',0,1.0,-.9).rotation.z=Math.PI/2;
  mesh(new THREE.BoxGeometry(.48,.66,.30),'vest',0,1.28,.0).rotation.x=-.17;
  mesh(new THREE.BoxGeometry(.07,.60,.315),'white',0,1.28,-.01).rotation.x=-.17;
  mesh(new THREE.SphereGeometry(.22,16,12),'skin',0,1.84,-.09,1,1.12,1);
  mesh(new THREE.SphereGeometry(.235,16,12),'black',0,1.97,-.06,1,.65,1);
  function limb(a,b,r,mat){const from=new THREE.Vector3(...a),to=new THREE.Vector3(...b),m=mesh(new THREE.CylinderGeometry(r,r*.92,from.distanceTo(to),10),mat,...from.clone().add(to).multiplyScalar(.5).toArray());m.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),to.sub(from).normalize())}
  for(const side of [-1,1]){limb([side*.25,1.52,-.05],[side*.44,1.15,-.47],.09,'skin');limb([side*.44,1.15,-.47],[side*.46,1.02,-.89],.075,'skin');limb([side*.2,1,.2],[side*.43,.7,-.05],.13,'black');limb([side*.43,.7,-.05],[side*.48,.4,.5],.105,'black');mesh(new THREE.BoxGeometry(.22,.15,.42),'black',side*.49,.34,.4)}
  return {boat,bank};
}
