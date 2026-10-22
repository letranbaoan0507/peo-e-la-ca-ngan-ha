import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {JSDOM} from 'jsdom';
import {IDBFactory} from 'fake-indexeddb';
import {packProject,validateProject,unpackFile,store} from '../src/project-store.js';
import {mountLibrary} from '../src/project-library.js';
const dom=new JSDOM(await readFile('src/index.html','utf8'),{url:'https://galaxy.test/'}),w=dom.window,d=w.document;
globalThis.document=d;globalThis.location=w.location;globalThis.indexedDB=new IDBFactory();globalThis.confirm=()=>true;
w.HTMLElement.prototype.scrollIntoView=()=>{};
const delay=n=>new Promise(r=>setTimeout(r,n));async function until(fn){for(let i=0;i<100;i++){if(await fn())return;await delay(10);}throw Error('Library operation did not finish');}
const originalCreate=URL.createObjectURL,originalRevoke=URL.revokeObjectURL,downloads=[],blobs=new Map();
URL.createObjectURL=b=>{const u='blob:test-'+blobs.size;blobs.set(u,b);return u;};URL.revokeObjectURL=()=>{};
w.HTMLAnchorElement.prototype.click=function(){if(this.download)downloads.push({name:this.download,blob:blobs.get(this.href)});};
const id=crypto.randomUUID(),picture=new File(['original-photo-bytes'],'ảnh.webp',{type:'image/webp'}),track=new File(['original-music-bytes'],'nhạc.mp3',{type:'audio/mpeg'});
let state={projectName:'Bản cũ cần giữ',data:{title:'Gửi bé yêu',phrases:['Cảm ơn cậu','Một thiên hà'],music:'custom',volume:.7},photos:[picture],audio:track,savedLink:'https://galaxy.test/g/'+id};
const old=await packProject(state),copy=validateProject(JSON.parse(JSON.stringify(old)));
assert.equal(await unpackFile(copy.photos[0]).text(),'original-photo-bytes');assert.equal(await unpackFile(copy.audio).text(),'original-music-bytes');
assert.throws(()=>validateProject({...old,format:'wrong'}));assert.throws(()=>validateProject({...old,audio:null}));assert.throws(()=>validateProject({...old,photos:[{name:'x',type:'image/svg+xml',data:'PHN2Zz4='}]}));
await store('put',{id:'old-project',title:old.projectName,packet:old,updated:'2026-01-01T00:00:00.000Z'});
await store('put',{id:'current',packet:old,localId:null},'drafts');
const messages=[];let qrLink,controller;
function apply(p){state={projectName:p.projectName,data:p.data,photos:p.photos.map(unpackFile),audio:p.audio?unpackFile(p.audio):null,savedLink:p.savedLink};}
try{
 controller=mountLibrary({capture:()=>state,apply,status:(m,e)=>messages.push({m,e}),isBusy:()=>false,reset(){},drawQR:(c,link)=>qrLink=link});
 await until(()=>d.querySelector('#draftNote').textContent.includes('Đã mở'));
 state.projectName='Bản mới';d.querySelector('#saveProject').click();await until(async()=>((await store('getAll')).length===2));
 assert.deepEqual((await store('get','old-project')).packet,old);
 d.querySelector('#navLibrary').click();await until(()=>d.querySelectorAll('.project-card').length===2);
 assert.ok(d.querySelector('.project-cover img').src.startsWith('data:image/webp;base64,'));
 const oldCard=[...d.querySelectorAll('.project-card')].find(c=>c.querySelector('h3').textContent==='Bản cũ cần giữ');
 oldCard.querySelector('[data-project="backup"]').click();await until(()=>downloads.length===1);
 const downloaded=JSON.parse(await downloads[0].blob.text());assert.deepEqual(downloaded,old);assert.ok(downloads[0].name.endsWith('.galaxy.json'));
 oldCard.querySelector('[data-project="qr"]').click();await until(()=>qrLink===old.savedLink);assert.equal(state.projectName,'Bản mới');assert.equal(state.savedLink,old.savedLink);
 const file=new File([JSON.stringify(old)],'backup.json',{type:'application/json'}),input=d.querySelector('#projectFile');Object.defineProperty(input,'files',{value:[file],configurable:true});input.dispatchEvent(new w.Event('change'));
 await until(()=>state.projectName===old.projectName);assert.deepEqual((await store('get','old-project')).packet,old);assert.equal((await store('getAll')).length,3);
 const bad=structuredClone(old);bad.data.title='<img src=x onerror=alert(1)>';bad.projectName='<script>evil</script>';const valid=validateProject(bad);await store('put',{id:'safe-text',title:valid.projectName,packet:valid,updated:new Date().toISOString()});d.querySelector('#navLibrary').click();await until(()=>d.querySelectorAll('.project-card').length===4);assert.equal(d.querySelectorAll('#projectCards script').length,0);assert.equal(d.querySelectorAll('#projectCards img[onerror]').length,0);
 assert.equal(messages.filter(x=>x.e).length,0,JSON.stringify(messages));
 console.log('PASS: Galaxy legacy records retained; full image/audio JSON roundtrip; draft restore, save, card cover, independent QR, additive import and safe text.');
}finally{controller?.destroy();URL.createObjectURL=originalCreate;URL.revokeObjectURL=originalRevoke;w.close();}
