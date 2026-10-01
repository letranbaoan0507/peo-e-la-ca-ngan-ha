import {Pool} from 'pg';import {GetObjectCommand} from '@aws-sdk/client-s3';import {getSignedUrl} from '@aws-sdk/s3-request-presigner';import {s3} from './galaxies.js';
let pool;
export default async function handler(req,res){try{
 if(!['GET','HEAD'].includes(req.method))return res.status(405).end();
 const key=String(req.query.key||'');if(!/^[a-f0-9-]{36}\/(image-\d{1,2}|audio)$/.test(key))return res.status(404).end();
 pool??=new Pool({connectionString:process.env.DATABASE_URL,max:2});const {rows}=await pool.query("SELECT objects FROM galaxies WHERE id=$1 AND state='ready'",[key.split('/')[0]]);const file=rows[0]?.objects.find(f=>f.key===key);if(!file)return res.status(404).end();
 const url=await getSignedUrl(s3(),new GetObjectCommand({Bucket:process.env.S3_BUCKET,Key:key,ResponseContentType:file.mime,ResponseContentDisposition:'inline'}),{expiresIn:86400});res.setHeader('Cache-Control','no-store');return res.redirect(307,url);
 }catch{return res.status(503).end()}}
