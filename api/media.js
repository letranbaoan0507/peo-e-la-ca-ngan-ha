import {Pool} from 'pg';import {GetObjectCommand} from '@aws-sdk/client-s3';import {pipeline} from 'node:stream/promises';import {s3} from './galaxies.js';
let pool;
export default async function handler(req,res){try{
 if(!['GET','HEAD'].includes(req.method))return res.status(405).end();
 const key=String(req.query.key||'');if(!/^[a-f0-9-]{36}\/(image-\d{1,2}|audio)$/.test(key))return res.status(404).end();
 pool??=new Pool({connectionString:process.env.DATABASE_URL,max:2});const {rows}=await pool.query("SELECT objects FROM galaxies WHERE id=$1 AND state='ready'",[key.split('/')[0]]);const file=rows[0]?.objects.find(f=>f.key===key);if(!file)return res.status(404).end();
 const range=req.headers.range;
 if(range&&!/^bytes=\d*-\d*$/.test(range))return res.status(416).end();
 // Keep media same-origin so canvas/WebGL can use private storage images safely.
 const object=await s3().send(new GetObjectCommand({Bucket:process.env.S3_BUCKET,Key:key,...(range?{Range:range}:{})}));
 res.setHeader('Cache-Control','no-store');res.setHeader('X-Content-Type-Options','nosniff');res.setHeader('Content-Type',file.mime);res.setHeader('Content-Disposition','inline');res.setHeader('Accept-Ranges','bytes');
 if(object.ContentLength!=null)res.setHeader('Content-Length',String(object.ContentLength));
 if(object.ContentRange)res.setHeader('Content-Range',object.ContentRange);
 res.status(object.ContentRange?206:200);
 if(req.method==='HEAD'){object.Body?.destroy();return res.end()}
 await pipeline(object.Body,res);
 }catch(error){if(res.headersSent){res.destroy();return}return res.status(error?.$metadata?.httpStatusCode===416?416:503).end()}}
