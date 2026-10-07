import http from 'node:http';import path from 'node:path';import fs from 'node:fs/promises';import {spawnSync} from 'node:child_process';
try{process.loadEnvFile('.env.local')}catch{}
try{process.loadEnvFile('.env')}catch{}
const built=spawnSync(process.execPath,['scripts/build.mjs'],{stdio:'inherit'});if(built.status)process.exit(built.status);
const port=Number(process.env.PORT||3000),root=path.resolve('dist');
const mime={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.svg':'image/svg+xml','.json':'application/json'};
const server=http.createServer(async(req,res)=>{try{
 const u=new URL(req.url,'http://localhost:'+port);
 if(u.pathname.startsWith('/api/')||u.pathname.startsWith('/media/')){
  const galaxy=u.pathname.startsWith('/api/galaxies'),media=u.pathname.startsWith('/media/');if(!galaxy&&!media){res.writeHead(404);res.end();return}
  const {default:handler}=await import(path.resolve(galaxy?'api/galaxies.js':'api/media.js'));req.query=Object.fromEntries(u.searchParams);if(media)req.query.key=u.pathname.slice(7);if(galaxy&&u.pathname!=='/api/galaxies')req.query.id=u.pathname.slice('/api/galaxies/'.length);
  let body='',size=0;for await(const c of req){size+=c.length;if(size>65536){res.writeHead(413);res.end();return}body+=c}req.body=body?JSON.parse(body):{};
  res.status=code=>{res.statusCode=code;return res};res.json=value=>{res.setHeader('Content-Type','application/json');res.end(JSON.stringify(value));return res};res.redirect=(code,url)=>{res.writeHead(code,{Location:url});res.end()};await handler(req,res);return;
 }
 const relative=u.pathname==='/'||/^\/g\/[a-f0-9-]{36}$/.test(u.pathname)?'index.html':decodeURIComponent(u.pathname).slice(1);
 const file=path.resolve(root,relative);if(!file.startsWith(root+path.sep)){res.writeHead(403);res.end();return}
 res.setHeader('Content-Type',mime[path.extname(file)]||'application/octet-stream');res.end(await fs.readFile(file));
 }catch(e){res.writeHead(e.code==='ENOENT'?404:500);res.end('Request failed')}});
server.listen(port,()=>console.log('Local preview: http://localhost:'+port));
