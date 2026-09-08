from PIL import Image, ImageFilter
from collections import deque
import math, json, base64
from pathlib import Path

out = Path(__file__).resolve().parents[1] / 'public' / 'jetski'
out.mkdir(parents=True, exist_ok=True)
im = Image.open(r'C:/Users/Secretaria_3/Downloads/mapaAgua.png').convert('RGB')
w,h = im.size
pix=list(im.getdata())
candidate=[max(p)<65 and sum(p)<140 for p in pix]
start=100*w+600
seen={start}; queue=deque([start])
while queue:
    i=queue.popleft(); x=i%w; y=i//w
    for nx,ny in ((x-1,y),(x+1,y),(x,y-1),(x,y+1)):
        j=ny*w+nx
        if 0<=nx<w and 0<=ny<h and j not in seen and candidate[j]:
            seen.add(j);queue.append(j)
mask=Image.new('L',(w,h)); mask.putdata([255 if i in seen else 0 for i in range(w*h)])
mask=mask.filter(ImageFilter.MaxFilter(3)).filter(ImageFilter.MinFilter(3))
water=list(mask.getdata())
dist=[999]*(w*h);queue=deque()
for i,v in enumerate(water):
    if v: dist[i]=0;queue.append(i)
while queue:
    i=queue.popleft(); x=i%w;y=i//w
    for nx,ny in ((x-1,y),(x+1,y),(x,y-1),(x,y+1)):
        j=ny*w+nx
        if 0<=nx<w and 0<=ny<h and dist[j]>dist[i]+1:
            dist[j]=dist[i]+1;queue.append(j)
heights=[];colors=[]
for i,v in enumerate(water):
    x=i%w;y=i//w;d=dist[i]
    n=(math.sin(x*.078+y*.043)+math.sin(y*.094-x*.031))*.5
    ht=0 if v else min(70,2+d*.75+(max(0,d-3)**.5)*(2+n*1.8))
    heights.append(round(ht))
    if v: c=(29,105+int(n*4),109+int(n*5))
    elif d<3: c=(150+int(n*10),139+int(n*9),94)
    else:
        light=int(n*14+((x*13+y*7)%11))
        c=(65+light,100+light,48+light//2)
    colors.extend(c)
payload={'width':w,'height':h,'heights':base64.b64encode(bytes(heights)).decode(),'colors':base64.b64encode(bytes(colors)).decode()}
(out/'terrain.js').write_text('window.TERRAIN='+json.dumps(payload,separators=(',',':'))+';',encoding='utf-8')
print(f'Terrain: {w}x{h}; water: {sum(v>0 for v in water)} pixels')
