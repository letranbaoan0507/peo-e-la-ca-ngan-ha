import QRCode from 'qrcode';

// Normalized outline follows the rounded lobes, central cleft and long point
// of the supplied heart reference, mirrored around the vertical center.
const topEdge=[.29,.10,.045,.015,0,.004,.024,.06,.10,.14,.16];
const bottomEdge=[.29,.49,.58,.65,.72,.77,.817,.862,.91,.953,1];
function edgeAt(points,x){
  const position=Math.min(x,1-x)*20;
  const i=Math.min(9,Math.floor(position)),t=position-i;
  const p0=points[Math.max(0,i-1)],p1=points[i],p2=points[i+1],p3=points[Math.min(10,i+2)];
  return Math.max(0,Math.min(1,.5*((2*p1)+(-p0+p2)*t+(2*p0-5*p1+4*p2-p3)*t*t+(-p0+3*p1-3*p2+p3)*t*t*t)));
}
export function insideHeart(x,y){
  return x>=0&&x<=1&&y>=edgeAt(topEdge,x)&&y<=edgeAt(bottomEdge,x);
}

// Keep the encoded matrix intact. Decorative modules extend its grid into a
// heart; only the finder patterns need a local quiet area inside the artwork.
export function createGiftQR(text,{heart=true}={}) {
  const code=QRCode.create(text,{errorCorrectionLevel:'H'});
  const n=code.modules.size;
  const side=heart?Math.ceil((n+8)*1.95):n+8;
  const left=Math.floor((side-n)/2);
  const top=heart?Math.round(side*.46-n/2):4;
  const pixels=new Uint8Array(side*side);
  const isFinderQuiet=(x,y)=>[
    [left,top],[left+n-7,top],[left,top+n-7]
  ].some(([fx,fy])=>x>=fx-1&&x<fx+8&&y>=fy-1&&y<fy+8);
  for(let y=0;y<side;y++)for(let x=0;x<side;x++){
    const cx=x-left,cy=y-top;
    if(cx>=0&&cx<n&&cy>=0&&cy<n){pixels[y*side+x]=code.modules.get(cy,cx);continue}
    if(!heart||isFinderQuiet(x,y))continue;
    const nx=(x+.5-side*.04)/(side*.92);
    const ny=(y+.5-side*.04)/(side*.92*.97);
    const inside=insideHeart(nx,ny);
    // Stable, square modules match the QR's density and join the same grid.
    const noise=Math.sin((x+1)*12.9898+(y+1)*78.233)*43758.5453;
    if(inside&&noise-Math.floor(noise)>.48)pixels[y*side+x]=1;
  }
  return {side,pixels};
}

export function drawGiftQR(canvas,text,{heart=true,color='#b92e62'}={}) {
  const {side,pixels}=createGiftQR(text,{heart});
  const cell=Math.max(4,Math.floor(660/side)),padding=24;
  canvas.width=side*cell+padding*2;
  canvas.height=canvas.width+68;
  const ctx=canvas.getContext('2d');
  ctx.fillStyle='#fff';ctx.fillRect(0,0,canvas.width,canvas.height);
  ctx.fillStyle=color;
  for(let y=0;y<side;y++)for(let x=0;x<side;x++){
    if(pixels[y*side+x])ctx.fillRect(padding+x*cell,padding+y*cell,cell,cell);
  }
  ctx.textAlign='center';ctx.font='600 24px sans-serif';
  ctx.fillText('Một thiên hà dành riêng cho bạn',canvas.width/2,canvas.width+23);
  ctx.font='17px sans-serif';ctx.fillStyle='#967a88';
  ctx.fillText('Quét mã để mở món quà ♥',canvas.width/2,canvas.width+52);
}
