import assert from 'node:assert/strict';
import http from 'node:http';
import {Readable} from 'node:stream';
import {build} from 'esbuild';
import {JSDOM} from 'jsdom';
import * as THREE from 'three';
import {Galaxy} from '../src/galaxy.js';

const dom=new JSDOM('<body></body>');
globalThis.document=dom.window.document;
dom.window.HTMLCanvasElement.prototype.getContext=()=>({font:'',measureText:()=>({width:240}),fillText(){}});
const scene=Object.create(Galaxy.prototype);
Object.assign(scene,{reset(){},dynamic:new THREE.Group(),sphereMaterial:{uniforms:{time:{value:0}}}});
await scene.configure({images:[],phrases:['Love you']});
const [front,back]=scene.phraseRings[0].children;
assert.equal(front.material.side,THREE.FrontSide);
assert.equal(back.material.side,THREE.BackSide);
assert.equal(front.geometry.attributes.uv.getX(0),1);
assert.equal(back.geometry.attributes.uv.getX(0),0);
dom.window.close();

const media=await build({entryPoints:['api/media.js'],bundle:true,write:false,platform:'node',format:'esm',plugins:[{name:'mock-storage',setup(b){
 b.onResolve({filter:/^(pg|@aws-sdk\/client-s3|\.\/galaxies\.js)$/},args=>({path:args.path,namespace:'mock'}));
 b.onLoad({filter:/.*/,namespace:'mock'},args=>({contents:args.path==='pg'?'export class Pool{async query(){return {rows:[{objects:[{key:"01234567-0123-4567-89ab-0123456789ab/image-0",mime:"image/png"}]}]}}}':args.path==='@aws-sdk/client-s3'?'export class GetObjectCommand{constructor(input){this.input=input}}':'export const s3=()=>({send:command=>globalThis.testStorage(command.input)});'}));
}}]});
const {default:handler}=await import('data:text/javascript;base64,'+Buffer.from(media.outputFiles[0].text).toString('base64'));
let storageInput;
globalThis.testStorage=async input=>{storageInput=input;return {Body:Readable.from([Buffer.from('image-bytes')]),ContentLength:11,...(input.Range?{ContentRange:'bytes 0-10/11'}:{})}};
const server=http.createServer((req,res)=>{req.query={key:'01234567-0123-4567-89ab-0123456789ab/image-0'};res.status=code=>{res.statusCode=code;return res};handler(req,res)});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
try{
 const url=`http://127.0.0.1:${server.address().port}/media/test`;
 const response=await fetch(url);
 assert.equal(response.status,200);assert.equal(response.headers.get('location'),null);
 assert.equal(response.headers.get('content-type'),'image/png');assert.equal(await response.text(),'image-bytes');
 const ranged=await fetch(url,{headers:{Range:'bytes=0-10'}});
 assert.equal(ranged.status,206);assert.equal(storageInput.Range,'bytes=0-10');await ranged.text();
 const head=await fetch(url,{method:'HEAD'});assert.equal(head.status,200);assert.equal(await head.text(),'');
 const invalid=await fetch(url,{headers:{Range:'invalid'}});assert.equal(invalid.status,416);
}finally{await new Promise(resolve=>server.close(resolve));delete globalThis.testStorage;delete globalThis.document}
console.log('PASS: readable front/back text UVs; same-origin media bytes, ranges, HEAD, invalid ranges.');
