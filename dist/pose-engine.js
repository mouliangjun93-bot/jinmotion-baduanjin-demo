import {visible,CONNECTIONS} from './pose-math.js';
import {PoseQuality} from './pose-quality.js';
export class PoseEngine{
 constructor({onResult,onStatus,getContext,onProgress=()=>{},onDiagnostic=()=>{},loadModel,frameFactory=()=>globalThis.document?.createElement('canvas')}){
  Object.assign(this,{onResult,onStatus,getContext,onProgress,onDiagnostic,frameFactory});
  this.loadModel=loadModel||((options)=>import('./pose-loader.js').then(m=>m.createPoseModel(options)));
  this.model=null;this.lastTime=-1;this.lastTick=-Infinity;this.stopped=false;this.mirrored=true;this.quality=new PoseQuality();
 }
 attach(video,canvas,{mirrored=true}={}){this.video=video;this.canvas=canvas;this.mirrored=mirrored;this.lastTime=-1}
 async start(){
  this.stopped=false;this.abort=new AbortController();this.onStatus('poseLoading');
  try{const model=await this.loadModel({signal:this.abort.signal,onProgress:p=>{
   if(this.stopped)return;this.onProgress(p);
   this.onStatus(p.stage==='initialise'?'poseInitialising':p.stage==='retry'?'poseRetrying':'poseLoading');
   if(p.stage==='initialise'&&!this.timeout)this.timeout=setTimeout(()=>{if(!this.model&&!this.stopped){this.stop();this.onDiagnostic('Model initialisation exceeded 120 seconds.');this.onStatus('poseFailed')}},120000);
  }});
   if(this.stopped){model.close();throw Error('Stopped')}this.model=model;clearTimeout(this.timeout);this.readyAt=performance.now();this.onStatus('poseReady');this.pump();
  }catch(error){const stopped=this.stopped;this.stop();if(!stopped){this.onDiagnostic(String(error?.message||error));this.onStatus(error?.code==='download'?'poseDownloadFailed':'poseFailed')}throw error}
 }
 pump(){
  if(this.stopped||!this.model)return;this.raf=requestAnimationFrame(()=>this.pump());const v=this.video,now=performance.now();
  if(!v||v.readyState<2||!v.videoWidth||!v.videoHeight||v.currentTime===this.lastTime){if(now-this.readyAt>6000){this.clear();this.quality=new PoseQuality();this.onStatus('poseNoFrames')}return}
  if(now-this.lastTick<100)return;this.lastTime=v.currentTime;this.lastTick=now;this.readyAt=now;
  try{
   const width=v.videoWidth,height=v.videoHeight;this.frame??=this.frameFactory();let input=v;
   if(this.frame){if(this.frame.width!==width)this.frame.width=width;if(this.frame.height!==height)this.frame.height=height;this.frame.getContext('2d').drawImage(v,0,0,width,height);input=this.frame}
   const context=this.getContext?.()||null,result=this.model.detectForVideo(input,now),landmarks=result.landmarks[0]||[],angles=this.quality.assess(landmarks,width,height,now);
   this.draw({landmarks,width,height,...angles});this.onResult({...angles,width,height,context});this.onStatus(!landmarks.length?'poseNoBody':angles.status);
  }catch(error){this.onDiagnostic(String(error?.message||error));this.stop();this.onStatus('poseFailed')}
 }
 draw({landmarks,width,height,left,right}){
  const canvas=this.canvas;if(!canvas?.isConnected)return;const w=canvas.clientWidth,h=canvas.clientHeight;if(!w||!h)return;if(canvas.width!==w)canvas.width=w;if(canvas.height!==h)canvas.height=h;const ctx=canvas.getContext('2d');if(!ctx)return;
  ctx.clearRect(0,0,w,h);const scale=Math.min(w/width,h/height),ox=(w-width*scale)/2,oy=(h-height*scale)/2,xy=p=>[ox+p.x*width*scale,oy+p.y*height*scale];
  // The displayed image is the exact frame used for inference, avoiding live-video/overlay lag.
  if(this.frame){ctx.fillStyle='#1c3028';ctx.fillRect(0,0,w,h);ctx.drawImage(this.frame,ox,oy,width*scale,height*scale)}
  ctx.strokeStyle='#d8e6a5';ctx.lineWidth=3;for(const [a,b]of CONNECTIONS)if(visible(landmarks[a])&&visible(landmarks[b])){ctx.beginPath();ctx.moveTo(...xy(landmarks[a]));ctx.lineTo(...xy(landmarks[b]));ctx.stroke()}
  ctx.fillStyle='#e4a956';for(const i of new Set(CONNECTIONS.flat()))if(visible(landmarks[i])){ctx.beginPath();ctx.arc(...xy(landmarks[i]),4,0,Math.PI*2);ctx.fill()}
  for(const [knee,value]of [[25,left],[26,right]])if(Number.isFinite(value)&&visible(landmarks[knee])){ctx.save();ctx.translate(...xy(landmarks[knee]));if(this.mirrored)ctx.scale(-1,1);ctx.fillStyle='#17372fe6';ctx.fillRect(-34,-33,68,25);ctx.fillStyle='#fff8dc';ctx.font='bold 15px system-ui';ctx.textAlign='center';ctx.fillText(`${value.toFixed(1)}\u00b0`,0,-15);ctx.restore()}
 }
 clear(){const c=this.canvas,ctx=c?.getContext('2d');ctx?.clearRect(0,0,c.width,c.height)}
 stop(){this.stopped=true;cancelAnimationFrame(this.raf);clearTimeout(this.timeout);this.abort?.abort();this.model?.close();this.model=null;this.clear()}
}
