import assert from 'node:assert/strict';import {readFile} from 'node:fs/promises';import {build} from 'esbuild';import {JSDOM} from 'jsdom';
import {validate} from '../api/galaxies.js';
assert.throws(()=>validate({title:'x',phrases:[],music:'custom',volume:.5},[]));
assert.deepEqual(validate({title:'x',phrases:['love'],music:'none',volume:.5},[]),{title:'x',phrases:['love'],music:'none',volume:.5});
const bundle=await build({entryPoints:['src/app.js'],bundle:true,write:false,format:'iife',plugins:[{name:'mock-scene',setup(b){b.onResolve({filter:/^\.\/galaxy\.js$/},()=>({path:'galaxy',namespace:'mock'}));b.onResolve({filter:/^\.\/qr\.js$/},()=>({path:'qr',namespace:'mock'}));b.onLoad({filter:/.*/,namespace:'mock'},args=>({contents:args.path==='galaxy'?`export class Galaxy{constructor(){}async configure(d){window.previewData=d;return {loadedImages:d.images.length}}dispose(){}reset(){}zoom(){}}`:`export function drawGiftQR(){}`}))}}]});
const dom=new JSDOM(await readFile('src/index.html','utf8'),{url:'https://galaxy.test/',runScripts:'outside-only'}),{window}=dom;let saved=null;const errors=[];
window.addEventListener('error',e=>errors.push(e.error));window.HTMLElement.prototype.scrollIntoView=()=>{};
window.fetch=async(url,options)=>{assert.equal(url,'/api/galaxies');const body=JSON.parse(options.body);if(body.action==='begin'){saved=body;return {ok:true,json:async()=>({id:'01234567-0123-4567-89ab-0123456789ab',secret:'test',uploads:[]})}}assert.equal(body.action,'complete');return {ok:true,json:async()=>({url:'https://galaxy.test/g/01234567-0123-4567-89ab-0123456789ab'})}};
const contexts=[];
class AudioParam{constructor(){this.value=1}cancelScheduledValues(){}setTargetAtTime(v){this.value=v}setValueAtTime(v){this.value=v}linearRampToValueAtTime(){}exponentialRampToValueAtTime(){}}
class AudioNode{constructor(){this.gain=new AudioParam();this.frequency={value:0}}connect(node){this.connected=node;return node}start(){}stop(){}}
window.AudioContext=class{constructor(){this.currentTime=0;this.destination={};this.nodes=[];contexts.push(this)}createGain(){const node=new AudioNode();this.nodes.push(node);return node}createMediaElementSource(audio){this.media=audio;this.source=new AudioNode();return this.source}createOscillator(){return new AudioNode()}async resume(){}async close(){this.closed=true}};
// Simulate a mobile browser ignoring HTMLMediaElement.volume writes.
window.Audio=class{set volume(v){}get volume(){return 1}async play(){}pause(){}};
window.eval(bundle.outputFiles[0].text);const d=window.document;d.querySelector('#music').value='none';d.querySelector('#title').value='Gửi bé yêu';d.querySelector('#preview').click();await new Promise(r=>setTimeout(r,30));assert.equal(d.querySelector('#universe').hidden,false);assert.equal(d.querySelector('#back'),null);assert.equal(d.querySelector('#sceneZoom'),null);assert.equal(d.querySelector('#orientationPrompt p').textContent,'Hãy xoay ngang màn hình để xem');d.querySelector('#create').click();await new Promise(r=>setTimeout(r,60));assert.equal(saved.data.title,'Gửi bé yêu');assert.equal(d.querySelector('#sharePanel').hidden,false);assert.match(d.querySelector('#shareLink').value,/\/g\/01234567/);
const slider=(id,value,event='input')=>{const el=d.querySelector(id);el.value=String(value);el.dispatchEvent(new window.Event(event))};
d.querySelector('#music').value='custom-url';d.querySelector('#audioUrlInput').value='https://example.com/song.mp3';
d.querySelector('#previewMusic').click();await new Promise(r=>setTimeout(r,10));
let ctx=contexts.at(-1),master=ctx.nodes[0];assert.equal(ctx.source.connected,master);assert.equal(master.connected,ctx.destination);
slider('#sceneVolume',20);assert.equal(master.gain.value,.2);assert.equal(d.querySelector('#volume').value,'20');
slider('#volume',80,'change');assert.equal(master.gain.value,.8);assert.equal(d.querySelector('#sceneVolume').value,'80');
slider('#sceneVolume',0);assert.equal(master.gain.value,0);
d.querySelector('#previewMusic').click();d.querySelector('#previewMusic').click();await new Promise(r=>setTimeout(r,10));assert.equal(contexts.at(-1).nodes[0].gain.value,0);
d.querySelector('#previewMusic').click();d.querySelector('#music').value='dream';d.querySelector('#previewMusic').click();await new Promise(r=>setTimeout(r,10));
ctx=contexts.at(-1);slider('#sceneVolume',60);assert.ok(Math.abs(ctx.nodes[0].gain.value-.21)<1e-8);slider('#volume',0);assert.equal(ctx.nodes[0].gain.value,0);d.querySelector('#previewMusic').click();
assert.equal(errors.length,0);dom.window.close();console.log('PASS: input validation; preview/create UI with mocked 3D/storage API. Live volume gain for uploaded/link and built-in music, mute/resume; real GPU/storage/device audio not tested.');
