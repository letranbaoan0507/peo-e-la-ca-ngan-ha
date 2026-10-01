import {Pool} from 'pg';
import {randomUUID,randomBytes,createHash} from 'node:crypto';
import {S3Client,PutObjectCommand,HeadObjectCommand} from '@aws-sdk/client-s3';
import {getSignedUrl} from '@aws-sdk/s3-request-presigner';
const hash=v=>createHash('sha256').update(v).digest('hex');
let pool,storage;
const db=()=>pool??=new Pool({connectionString:process.env.DATABASE_URL,max:2});
export const s3=()=>storage??=new S3Client({endpoint:process.env.S3_ENDPOINT,region:process.env.S3_REGION||'us-east-1',forcePathStyle:true,requestChecksumCalculation:'WHEN_REQUIRED',credentials:{accessKeyId:process.env.S3_ACCESS_KEY_ID,secretAccessKey:process.env.S3_SECRET_ACCESS_KEY}});
const keyInput=Key=>({Bucket:process.env.S3_BUCKET,Key});
export function validate(data,files){
 if(!data||typeof data.title!=='string'||data.title.length>100||!Array.isArray(data.phrases)||data.phrases.length>6||data.phrases.some(p=>typeof p!=='string'||p.length>40)||!['dream','warm','birthday','custom','none'].includes(data.music)||typeof data.volume!=='number'||data.volume<0||data.volume>1)throw Error('Nội dung không hợp lệ.');
 if(!Array.isArray(files)||files.length>13||files.reduce((n,f)=>n+f.size,0)>25*1024**2)throw Error('Tổng dung lượng vượt 25 MB.');
 const images=files.filter(f=>f.kind==='image'),audio=files.filter(f=>f.kind==='audio');
 if(images.length>12||audio.length>(data.music==='custom'?1:0)||files.length!==images.length+audio.length||(data.music==='custom'&&audio.length!==1))throw Error('Kiểm tra ảnh và nhạc.');
 for(const f of files)if(!Number.isInteger(f.size)||f.size<1||f.size>(f.kind==='image'?2:15)*1024**2||typeof f.name!=='string'||f.name.length>255||(f.kind==='image'?!['image/jpeg','image/png','image/webp'].includes(f.mime):!['audio/mpeg','audio/mp4','audio/x-m4a','audio/wav','audio/x-wav','audio/ogg','audio/aac','audio/flac','audio/webm'].includes(f.mime)))throw Error('Tệp không hợp lệ.');
 return {title:data.title,phrases:data.phrases,music:data.music,volume:data.volume};
}
export default async function handler(req,res){
 res.setHeader('Cache-Control','no-store');res.setHeader('X-Content-Type-Options','nosniff');
 try{
  if(req.method==='GET'){
   const id=String(req.query.id||'');if(!/^[a-f0-9-]{36}$/.test(id))return res.status(404).json({error:'Link không hợp lệ.'});
   const {rows}=await db().query("SELECT manifest FROM galaxies WHERE id=$1 AND state='ready'",[id]);return rows[0]?res.json(rows[0].manifest):res.status(404).json({error:'Không tìm thấy thiên hà.'});
  }
  if(req.method!=='POST')return res.status(405).json({error:'Method not allowed'});
  if(req.headers.origin&&req.headers.origin!==process.env.APP_URL&&req.headers.origin!==`http://${req.headers.host}`)return res.status(403).json({error:'Yêu cầu không cùng website.'});
  const body=typeof req.body==='string'?JSON.parse(req.body):req.body;
  if(body.action==='begin'){
   const data=validate(body.data,body.files);const ip=hash(process.env.RATE_LIMIT_SALT+String(req.headers['x-vercel-forwarded-for']||req.socket.remoteAddress||'unknown')),window=Math.floor(Date.now()/3600000);
   const rate=await db().query('INSERT INTO galaxy_rates(id,count) VALUES($1,1) ON CONFLICT(id) DO UPDATE SET count=galaxy_rates.count+1 RETURNING count',[ip+':'+window]);if(rate.rows[0].count>10)return res.status(429).json({error:'Bạn đã tạo nhiều thiên hà. Hãy thử lại sau một giờ.'});
   const id=randomUUID(),secret=randomBytes(32).toString('hex');
   const files=body.files.map((f,i)=>({...f,key:`${id}/${f.kind==='image'?'image-'+i:'audio'}`}));
   const manifest={...data,images:files.filter(f=>f.kind==='image').map(f=>'/media/'+f.key),audioUrl:files.find(f=>f.kind==='audio')?'/media/'+files.find(f=>f.kind==='audio').key:null,createdAt:new Date().toISOString()};
   await db().query('INSERT INTO galaxies(id,manifest,objects,token_hash,state) VALUES($1,$2,$3,$4,\'draft\')',[id,manifest,JSON.stringify(files),hash(secret)]);
   const uploads=[];for(const f of files)uploads.push({...f,url:await getSignedUrl(s3(),new PutObjectCommand({...keyInput(f.key),ContentType:f.mime,ContentLength:f.size,Metadata:{originalName:encodeURIComponent(f.name)}}),{expiresIn:900})});
   return res.status(201).json({id,secret,uploads});
  }
  if(body.action==='complete'){
   const {rows}=await db().query("SELECT * FROM galaxies WHERE id=$1 AND token_hash=$2 AND created_at>now()-interval '1 hour'",[body.id,hash(String(body.secret))]);const item=rows[0];if(!item)return res.status(403).json({error:'Phiên tạo link đã hết hạn.'});
   for(const f of item.objects){const o=await s3().send(new HeadObjectCommand(keyInput(f.key)));if(o.ContentLength!==f.size||o.ContentType!==f.mime)throw Error('Tệp chưa tải đủ hoặc sai định dạng.')}
   await db().query("UPDATE galaxies SET state='ready' WHERE id=$1",[item.id]);return res.json({id:item.id,url:`${process.env.APP_URL}/g/${item.id}`});
  }
  return res.status(400).json({error:'Thao tác không hợp lệ.'});
 }catch(e){console.error('galaxy api',e.message);return res.status(400).json({error:'Chưa lưu được thiên hà. Kiểm tra cấu hình và thử lại.'})}
}
