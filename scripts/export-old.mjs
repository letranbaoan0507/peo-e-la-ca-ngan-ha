import {mkdir,writeFile} from 'node:fs/promises';import {createWriteStream} from 'node:fs';import {pipeline} from 'node:stream/promises';import {Readable} from 'node:stream';
const origin=process.env.OLD_GALAXY_URL;if(!origin)throw Error('Set OLD_GALAXY_URL to the old site URL.');
const ids=process.argv.slice(2);if(!ids.length)throw Error('Supply existing /g/:id IDs. The old storage does not provide a listing API.');
await mkdir('backups/objects',{recursive:true});const manifests=[];
for(const id of ids){if(!/^[a-f0-9-]{36}$/.test(id))throw Error('Invalid ID');const r=await fetch(new URL('/api/galaxies/'+id,origin));if(!r.ok)throw Error('Could not read '+id);const data=await r.json();const objects=[];
 for(const url of [...data.images,...data.audioUrl?[data.audioUrl]:[]]){const source=new URL(url,origin);if(source.origin!==new URL(origin).origin||!/^\/media\/[a-f0-9-]{36}\/(image-\d{1,2}|audio)$/.test(source.pathname))throw Error('Unexpected media URL');const key=source.pathname.slice(7);await mkdir('backups/objects/'+id,{recursive:true});const media=await fetch(source);if(!media.ok)throw Error('Media export failed');await pipeline(Readable.fromWeb(media.body),createWriteStream('backups/objects/'+key));objects.push({key,mime:media.headers.get('content-type'),size:Number(media.headers.get('content-length'))})}
 manifests.push({id,manifest:data,objects});await writeFile('backups/galaxies-export.json',JSON.stringify(manifests,null,2));console.log('Exported',id);
}
