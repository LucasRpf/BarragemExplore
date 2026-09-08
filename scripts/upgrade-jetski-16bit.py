from pathlib import Path
p=Path('public/jetski/game.js')
s=p.read_text(encoding='utf-8').replace('/* 8-bit overhead exploration: fixed palette, integer pixels and directional sprites. */','/* Third-person heightfield exploration with 16-bit pixel shading. */').replace('const sw=320,sh=180','const sw=480,sh=270')
a=s.index('const craft=[')
b=s.index("document.getElementById('speed').textContent",a)
s=s[:a]+'''// The supplied artwork provides the actual pixel-cloud palette and sky texture.
let skyPixels=null;
const skyImage=new Image();skyImage.onload=()=>{const c=document.createElement('canvas');c.width=960;c.height=120;const g=c.getContext('2d');g.imageSmoothingEnabled=false;g.drawImage(skyImage,0,0,skyImage.width,Math.round(skyImage.height*.215),0,0,960,120);skyPixels=g.getImageData(0,0,960,120).data};skyImage.src='referencia-16bits.png';
const noise=(x,y)=>{let n=Math.imul(x,374761393)^Math.imul(y,668265263);n=Math.imul(n^(n>>>13),1274126177);return (n>>>0)/4294967295};
function skyAt(x,y){if(!skyPixels)return [42+Math.floor(y/10)*4,121+Math.floor(y/10)*4,194+Math.floor(y/15)*3];const sx=((Math.floor(x+player.a*180)%960)+960)%960,sy=Math.max(0,Math.min(119,Math.floor(y)));const i=(sy*960+sx)*4;return [skyPixels[i],skyPixels[i+1],skyPixels[i+2]]}
function render(){
const horizon=104,projection=225,sn=Math.sin(player.a),cs=Math.cos(player.a),fov=.85;
// Follow from behind; shorten the camera arm near shore to avoid entering a hill.
let arm=7;while(arm>0&&land(player.x-sn*arm,player.y+cs*arm))arm-=.5;
const camX=player.x-sn*arm,camY=player.y+cs*arm,camHeight=4.4+Math.sin(time*2)*.08;
for(let y=0;y<sh;y++)for(let x=0;x<sw;x++){const c=skyAt(x,y),i=(y*sw+x)*4;pixels[i]=c[0];pixels[i+1]=c[1];pixels[i+2]=c[2];pixels[i+3]=255}
for(let x=0;x<sw;x++){
const offset=(x/sw*2-1)*fov,dx=sn+cs*offset,dy=-cs+sn*offset;let ceiling=sh;
for(let z=.8;z<480&&ceiling>0;z+=.45+z*.014){const wx=camX+dx*z,wy=camY+dy*z,xx=Math.floor(wx),yy=Math.floor(wy);let ht=24,r=53,g=107,b=82;
if(xx>=0&&yy>=0&&xx<W&&yy<H){const idx=yy*W+xx,base=heights[idx],n=noise(xx,yy);ht=base*.52;
if(base===0){
const ripple=Math.sin(wy*2+time*2+Math.sin(wx*.8))*Math.sin(wx*.65+time);
const cloud=skyAt(x+Math.floor(ripple*6),Math.max(0,119-(yReflection(z))));
const shine=ripple>.72?18:ripple<-.6?-9:0,reflect=Math.min(.42,z/230);
r=18*(1-reflect)+cloud[0]*reflect+shine;g=111*(1-reflect)+cloud[1]*reflect+shine;b=131*(1-reflect)+cloud[2]*reflect+shine;
}else if(base<6){r=167+n*53;g=153+n*44;b=110+n*37;ht+=n*.35}
else{
// Clustered canopy height and discrete sunlit/shadowed foliage shades.
const crown=noise(Math.floor(xx/3),Math.floor(yy/3));ht+=1+crown*2+n*.7;
const slope=base-heights[Math.max(0,idx-1)],light=Math.max(0,Math.min(5,Math.floor(n*3+crown*2-slope*.3)));
const greens=[[24,67,56],[32,88,58],[47,110,58],[72,134,62],[107,158,67],[146,181,80]];[r,g,b]=greens[light];
}
}
const sy=Math.max(0,Math.floor(horizon+(camHeight-ht)*projection/z));
if(sy<ceiling){const fog=Math.min(.7,Math.floor(z/45)/13);r=r*(1-fog)+99*fog;g=g*(1-fog)+163*fog;b=b*(1-fog)+181*fog;for(let y=sy;y<ceiling;y++){const i=(y*sw+x)*4;pixels[i]=r;pixels[i+1]=g;pixels[i+2]=b}ceiling=sy}
}}
ctx.putImageData(frame,0,0);
for(let n=0;n<points.length;n++){const p=points[n],rx=p.x-camX,ry=p.y-camY,z=rx*sn-ry*cs,side=rx*cs+ry*sn;if(z<5||z>170)continue;let blocked=false;for(let d=1;d<z;d+=1){if(land(camX+rx*d/z,camY+ry*d/z)){blocked=true;break}}if(blocked)continue;const sx=Math.round(sw/2+side/z*sw/(2*fov)),sy=Math.round(horizon+camHeight*projection/z),size=Math.max(2,Math.round(90/z));ctx.fillStyle=visited.has(n)?'#b5d994':'#ffc56a';ctx.fillRect(sx-size/2,sy-size*3,size,size*3);ctx.fillStyle='#f4f2d8';ctx.fillRect(sx-size,sy-size,size*2,2)}
// Pixel-aligned rear-view rider and hull, with banking and a widening foam trail.
const bx=Math.round(sw/2-turn*6),by=sh-32+Math.round(Math.sin(time*5)*Math.min(1,Math.abs(player.v)/10));
function rect(x,y,w,h,color){ctx.fillStyle=color;ctx.fillRect(Math.round(bx+x+turn*(y+20)*.07),Math.round(by+y),w,h)}
if(Math.abs(player.v)>1)for(let i=0;i<44;i++){const t=(i/44+time*.85)%1,side=i%2?1:-1;rect(side*(19+t*38),2+t*30,2+Math.floor(t*6),1+Math.floor(t*2),i%3?'#9ed8d0':'#e7efd9')}
// A sprite drawn in horizontal integer runs retains crisp pixels while banking.
for(let y=-27;y<=19;y++){const width=y<0?Math.round(9+(y+27)*.47):Math.round(23-y*.23);rect(-width,y,width*2,1,'#163d50');if(y<14)rect(-width+2,y,width*2-4,1,y<-18?'#eee8c0':y<0?'#f4a44d':'#db763b');if(y>-18&&y<12)rect(-8,y,16,1,'#315566')}
rect(-20,13,40,3,'#b9d4cb');rect(-15,16,30,3,'#ecedd1');rect(-9,19,18,2,'#163d50');
rect(-13,-29,26,3,'#173849');rect(-17,-27,5,7,'#e6b481');rect(12,-27,5,7,'#e6b481');rect(-13,-24,5,8,'#eec58d');rect(8,-24,5,8,'#c18a64');
rect(-9,-29,18,23,'#df7438');rect(-8,-28,6,20,'#ffbf59');rect(-1,-28,3,22,'#f1d68c');rect(4,-27,4,20,'#ab5036');rect(-9,-10,18,4,'#734f41');
rect(-8,-6,6,16,'#243e57');rect(3,-6,6,16,'#243e57');rect(-10,8,8,4,'#162f42');rect(3,8,8,4,'#162f42');
rect(-6,-38,12,10,'#d49d72');rect(-7,-43,14,8,'#1a3b51');rect(-5,-45,10,3,'#376779');rect(-5,-41,8,2,'#527d88');rect(3,-36,3,5,'#ae765d');
''' + s[b:]
s=s.replace('function render(){','function yReflection(z){return Math.min(115,650/z)}\nfunction render(){',1)
p.write_text(s,encoding='utf-8')
p=Path('public/jetski/index.html');s=p.read_text(encoding='utf-8').replace('8 BITS','16 BITS').replace('versão retrô','versão em pixel art 16 bits').replace('Contorno da água extraído do seu mapa. Relevo e distâncias interpretados para o jogo.','Câmera em terceira pessoa. Contorno da água extraído do seu mapa; relevo interpretado para o jogo.')
s=s.replace('</style>','''
/* Let the landscape and rear-view craft remain the visual focus. */
.brand{background:#173e50d9;padding:10px 14px;border-left:3px solid #ebcf88}.eyebrow{letter-spacing:2px}.panel{border-color:#d5dda9;background:#193e50;box-shadow:6px 6px 0 #102c3b}.overlay{background:#14374666}.hint{bottom:12px;padding:5px 10px;font-size:12px;border:1px solid #b9cbbb;background:#16384cea}.speed,.mapbox{background:#16384cea;border:1px solid #b9cbbb;box-shadow:3px 3px 0 #102c3b}.bottom{bottom:18px}.mapbox{padding:8px}#map{width:150px;height:91px}.compass{background:#173e50d9}.tools button{background:#173e50e8;border:1px solid #b9cbbb}.panel h2{font-size:30px}@media(max-width:950px){.hint{bottom:160px}}@media(max-width:650px){.brand{padding:7px}.hint{bottom:155px}.sub{font-size:11px}h1{font-size:18px}.touch{bottom:200px}}
</style>''')
p.write_text(s,encoding='utf-8')
