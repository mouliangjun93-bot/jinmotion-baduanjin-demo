import {POSE_ASSETS} from './pose-assets.js';
import {gunzipSync} from './vendor/fflate/fflate.mjs';
export const POSE_CACHE='jinmotion-pose-chunks-v1';
export const DOWNLOAD_BYTES=POSE_ASSETS.flatMap(a=>a.chunks).reduce((s,c)=>s+c.size,0);
const aborted=()=>new DOMException('Download cancelled','AbortError');
async function valid(bytes,info){if(bytes.length!==info.size)return false;const hash=await crypto.subtle.digest('SHA-256',bytes);return Array.from(new Uint8Array(hash),x=>x.toString(16).padStart(2,'0')).join('')===info.sha256}
const pause=(ms,signal)=>new Promise((resolve,reject)=>{if(signal.aborted){reject(aborted());return}const abort=()=>{clearTimeout(timer);reject(aborted())};const timer=setTimeout(()=>{signal.removeEventListener('abort',abort);resolve()},ms);signal.addEventListener('abort',abort,{once:true})});
async function fetchChunk(url,info,{fetcher,signal,timeoutMs,onBytes,cacheMode}){
 const controller=new AbortController();let timer;const reset=()=>{clearTimeout(timer);timer=setTimeout(()=>controller.abort(),timeoutMs)},cancel=()=>controller.abort();signal.addEventListener('abort',cancel,{once:true});if(signal.aborted)cancel();reset();
 try{const response=await fetcher(url,{signal:controller.signal,cache:cacheMode});if(!response.ok)throw Error(`HTTP ${response.status}`);const chunks=[];let size=0;if(response.body){const reader=response.body.getReader();for(;;){const {done,value}=await reader.read();if(done)break;size+=value.length;if(size>info.size){await reader.cancel();throw Error('Invalid resource size')}chunks.push(value);onBytes(size);reset()}}else{const bytes=new Uint8Array(await response.arrayBuffer());chunks.push(bytes);size=bytes.length;onBytes(size)}const bytes=new Uint8Array(size);let offset=0;for(const chunk of chunks){bytes.set(chunk,offset);offset+=chunk.length}if(!await valid(bytes,info))throw Error('Resource integrity check failed');return bytes}
 catch(error){if(signal.aborted)throw aborted();if(controller.signal.aborted)throw Error('Network stalled for '+Math.round(timeoutMs/1000)+' seconds');throw error}
 finally{clearTimeout(timer);signal.removeEventListener('abort',cancel)}
}
// Complete chunks survive retry/reload. Cache failure never prevents inference.
export async function loadPoseAssets({signal,onProgress=()=>{},fetcher=globalThis.fetch,cacheStorage=globalThis.caches,assets=POSE_ASSETS,baseURL=new URL('./',import.meta.url),timeoutMs=25000,retryDelayMs=500}={}){
 const controller=new AbortController(),cancel=()=>controller.abort();signal?.addEventListener('abort',cancel,{once:true});if(signal?.aborted)cancel();const active=controller.signal;let cache=null;try{cache=await cacheStorage?.open(POSE_CACHE)}catch{}
 const tasks=assets.flatMap(asset=>asset.chunks.map((info,index)=>({asset:asset.id,index,info}))),total=tasks.reduce((s,t)=>s+t.info.size,0),parts=new Map(assets.map(a=>[a.id,[]])),pending=new Map();let loaded=0,cached=0,next=0,retries=0,cacheAvailable=!!cache;
 const progress=(stage='download')=>{if(!active.aborted)onProgress({stage,loaded:loaded+[...pending.values()].reduce((s,n)=>s+n,0),total,cached,retries,cacheAvailable})};progress();
 async function worker(){while(next<tasks.length){if(active.aborted)throw aborted();const {asset,index,info}=tasks[next++],url=new URL(info.path,baseURL).href;let bytes;
  try{const stored=await cache?.match(url);if(stored){const candidate=new Uint8Array(await stored.arrayBuffer());if(await valid(candidate,info)){bytes=candidate;cached+=bytes.length}else await cache.delete(url)}}catch{}
  if(!bytes){for(let attempt=0;attempt<3;attempt++){if(active.aborted)throw aborted();try{bytes=await fetchChunk(url,info,{fetcher,signal:active,timeoutMs,cacheMode:attempt===0?'force-cache':'reload',onBytes:n=>{pending.set(url,n);progress()}});break}catch(error){pending.delete(url);if(active.aborted)throw aborted();if(attempt===2){const failure=Error(`${asset} chunk ${index+1}: ${error.message}`);failure.code='download';throw failure}retries++;progress('retry');await pause(retryDelayMs*2**attempt,active)}}
   try{await cache?.put(url,new Response(bytes,{headers:{'Content-Type':'application/octet-stream'}}))}catch{cacheAvailable=false}
  }
  pending.delete(url);parts.get(asset)[index]=bytes;loaded+=bytes.length;progress();
 }}
 try{await Promise.all([worker(),worker()]);if(active.aborted)throw aborted();const result={};for(const asset of assets){const chunks=parts.get(asset.id),length=chunks.reduce((s,b)=>s+b.length,0),packed=new Uint8Array(length);let offset=0;for(const chunk of chunks){packed.set(chunk,offset);offset+=chunk.length}const raw=gunzipSync(packed);if(!await valid(raw,asset)){const error=Error(`Decoded ${asset.id} failed integrity validation`);error.code='download';throw error}result[asset.id]=raw}progress('initialise');return result}
 catch(error){controller.abort();throw error}
 finally{signal?.removeEventListener('abort',cancel)}
}
