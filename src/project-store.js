const images=['image/jpeg','image/png','image/webp'];
const audio=['audio/mpeg','audio/mp4','audio/x-m4a','audio/wav','audio/x-wav','audio/ogg','audio/aac','audio/flac','audio/webm'];
export function safeGiftLink(value){try{const u=new URL(value,location.origin);return u.protocol==='https:'&&/^\/g\/[a-f0-9-]{36}$/i.test(u.pathname)?u.href:'';}catch{return '';}}
export function validateProject(raw){
 if(raw?.format!=='galaxy-love-project'||raw.version!==1)throw Error('Đây không phải bản sao lưu dự án Galaxy.');
 const d=raw.data;if(!d||typeof d.title!=='string'||d.title.length>100||!Array.isArray(d.phrases)||d.phrases.length>6||d.phrases.some(s=>typeof s!=='string'||s.length>40)||!['dream','warm','birthday','custom','none'].includes(d.music)||!Number.isFinite(d.volume)||d.volume<0||d.volume>1)throw Error('Nội dung dự án không hợp lệ.');
 if(!Array.isArray(raw.photos)||raw.photos.length>12)throw Error('Mỗi dự án có tối đa 12 ảnh.');
 let total=0;
 function file(f,kind){const allowed=kind==='image'?images:audio,max=(kind==='image'?2:15)*1024**2;if(!f||!allowed.includes(f.type)||typeof f.name!=='string'||f.name.length>255||typeof f.data!=='string'||f.data.length>Math.ceil(max/3)*4||!/^[A-Za-z0-9+/]*={0,2}$/.test(f.data))throw Error('Ảnh hoặc nhạc trong bản sao không hợp lệ.');let bytes;try{bytes=Uint8Array.from(atob(f.data),c=>c.charCodeAt(0));}catch{throw Error('Dữ liệu tệp không đọc được.');}if(!bytes.length||bytes.length>max)throw Error('Tệp vượt dung lượng hỗ trợ.');total+=bytes.length;return {name:f.name,type:f.type,data:f.data};}
 const photos=raw.photos.map(f=>file(f,'image')),track=raw.audio?file(raw.audio,'audio'):null;
 if(d.music==='custom'&&!track)throw Error('Bản sao thiếu tệp nhạc đã chọn.');if(total>25*1024**2)throw Error('Tổng ảnh và nhạc vượt 25 MB.');
 return {format:'galaxy-love-project',version:1,projectName:String(raw.projectName||d.title).slice(0,120),data:{title:d.title,phrases:[...d.phrases],music:d.music,volume:d.volume},photos,audio:track,savedLink:safeGiftLink(raw.savedLink),createdAt:typeof raw.createdAt==='string'?raw.createdAt:new Date().toISOString()};
}
export async function packProject({data,photos,audio,projectName,savedLink}){
 async function pack(file){const buffer=file.arrayBuffer?await file.arrayBuffer():await new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(reader.result);reader.onerror=()=>reject(Error('Không đọc được tệp để sao lưu.'));reader.readAsArrayBuffer(file);});const b=new Uint8Array(buffer);let s='';for(let i=0;i<b.length;i+=8192)s+=String.fromCharCode(...b.subarray(i,i+8192));return {name:file.name||'tep',type:file.type,data:btoa(s)};}
 return validateProject({format:'galaxy-love-project',version:1,projectName,data,photos:await Promise.all(photos.map(pack)),audio:audio?await pack(audio):null,savedLink,createdAt:new Date().toISOString()});
}
export function unpackFile(f){return new File([Uint8Array.from(atob(f.data),c=>c.charCodeAt(0))],f.name,{type:f.type});}
let promise;
export function store(method,value,collection='projects'){
 promise??=new Promise((resolve,reject)=>{const r=indexedDB.open('GalaxyLoveStudio',1);r.onupgradeneeded=()=>{for(const n of ['projects','drafts'])if(!r.result.objectStoreNames.contains(n))r.result.createObjectStore(n,{keyPath:'id'});};r.onsuccess=()=>{r.result.onversionchange=()=>{r.result.close();promise=null;};resolve(r.result);};r.onerror=()=>{promise=null;reject(Error('Không mở được kho trên thiết bị. Hãy tải JSON để giữ bản sao.'));};});
 return promise.then(db=>new Promise((resolve,reject)=>{const tx=db.transaction(collection,['put','delete'].includes(method)?'readwrite':'readonly'),r=tx.objectStore(collection)[method](value);let result;r.onsuccess=()=>result=r.result;tx.oncomplete=()=>resolve(result);tx.onerror=tx.onabort=()=>reject(Error('Chưa lưu được vào kho thiết bị. Hãy tải bản sao JSON.'));}));
}
