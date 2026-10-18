import assert from 'node:assert/strict';
import {writeFile} from 'node:fs/promises';
import {PNG} from 'pngjs';
import jsQR from 'jsqr';
import {createGiftQR} from '../src/qr.js';
const sample='https://peo-e-la-ca-ngan-ha.vercel.app/g/01234567-0123-4567-89ab-0123456789ab';
for(const text of [sample,'https://example.com/g/01234567-0123-4567-89ab-0123456789ab','https://'+'long-domain-'.repeat(8)+'example.com/g/01234567-0123-4567-89ab-0123456789ab']){
  for(const heart of [true,false])for(const cell of [3,6,10]){
    const {side,pixels}=createGiftQR(text,{heart}),width=(side+8)*cell;
    const png=new PNG({width,height:width});png.data.fill(255);
    for(let y=0;y<side;y++)for(let x=0;x<side;x++)if(pixels[y*side+x]){
      for(let dy=0;dy<cell;dy++)for(let dx=0;dx<cell;dx++){
        const i=(((y+4)*cell+dy)*width+(x+4)*cell+dx)*4;
        png.data[i]=185;png.data[i+1]=46;png.data[i+2]=98;
      }
    }
    assert.equal(jsQR(new Uint8ClampedArray(png.data),width,width)?.data,text,`QR must scan: heart=${heart}, cell=${cell}, length=${text.length}`);
    if(text===sample&&heart&&cell===6)await writeFile('/tmp/galaxy-heart-qr.png',PNG.sync.write(png));
  }
}
console.log('PASS: heart/square QR decode at 3 sizes and 3 link lengths.');
