const locale=lang=>({zh:'zh-CN',yue:'zh-HK',en:'en-GB'}[lang]||'zh-HK');
const normalise=value=>String(value||'').toLowerCase().replaceAll('_','-');
export function selectVoice(voices,language){
 const score=voice=>{const tag=normalise(voice.lang);let rank=0;
  if(language==='yue'){if(tag.startsWith('yue'))rank=100;else if(tag==='zh-hk'||tag==='zh-mo')rank=95}
  else if(language==='zh'){if(tag==='zh-cn'||tag==='cmn-cn')rank=100;else if(tag.startsWith('cmn')||tag==='zh-sg')rank=90;else if(tag==='zh-tw'||tag==='zh')rank=80}
  else if(language==='en'&&tag.startsWith('en'))rank=tag==='en-gb'?100:tag==='en-us'?95:90;
  return rank+(rank&&voice.localService?2:0);
 };
 return [...voices].filter(v=>score(v)>0).sort((a,b)=>score(b)-score(a))[0]||null;
}
const warnings={poseNoBody:'voiceNoBody',poseNeedBody:'voiceNeedBody',poseNeedLegs:'voiceNeedLegs',poseUncertain:'voiceUncertain',poseNoFrames:'voiceNoFrames',posePartialLeg:'voicePartialLeg'};
const family=status=>status==='poseNoFrames'?'camera':'position';
export class PoseVoiceGuide{
 constructor({getLanguage,getText,enabled=true,onChange=()=>{},synth=globalThis.speechSynthesis,Utterance=globalThis.SpeechSynthesisUtterance,now=()=>performance.now(),setTimer=(fn,ms)=>setTimeout(fn,ms),clearTimer=id=>clearTimeout(id),delayMs=3000,cooldownMs=15000}={}){
  Object.assign(this,{getLanguage,getText,enabled,onChange,synth,Utterance,now,setTimer,clearTimer,delayMs,cooldownMs});this.active=false;this.lastWarning=-Infinity;this.voices=[];this.refresh=()=>{try{this.voices=this.synth?.getVoices?.()||[]}catch{this.voices=[]}this.onChange();this.schedule()};
  try{this.voices=this.synth?.getVoices?.()||[]}catch{}
  this.synth?.addEventListener?.('voiceschanged',this.refresh);
 }
 get availability(){if(!this.synth||!this.Utterance)return 'unsupported';if(this.error)return 'blocked';if(!this.voices.length)return 'loading';return selectVoice(this.voices,this.getLanguage())?'ready':'missing'}
 activate(){this.active=true;this.error=false;this.refresh();if(this.enabled)this.speak('voiceReady','ready')}
 setEnabled(value){this.enabled=!!value;if(!this.enabled)this.stopAudio();else if(this.active)this.activate();this.onChange();this.schedule()}
 languageChanged(){this.stopAudio();this.pending=null;this.lastWarning=-Infinity;this.error=false;this.refresh();if(this.active&&this.enabled)this.speak('voiceReady','ready')}
 test(){this.stopAudio();this.error=false;this.refresh();return this.speak('voiceTestPhrase','test')}
 observe(status,{left,right,view}={}){
  if(status==='poseTracking'&&view==='front'&&((left===null)!==(right===null)))status='posePartialLeg';
  if(!this.active)return;
  if(!warnings[status]){this.pending=null;this.clearTimer(this.timer);this.timer=null;if(this.speechKind==='warning')this.stopAudio();return}
  const previous=this.pending;if(!previous||family(previous.status)!==family(status)){this.pending={status,since:this.now()};this.clearTimer(this.timer);this.timer=null;if(this.speechKind==='warning')this.stopAudio()}else this.pending.status=status;
  this.schedule();
 }
 schedule(){if(!this.active||!this.enabled||!this.pending||this.timer||this.utterance||this.availability!=='ready')return;const wait=Math.max(this.pending.since+this.delayMs,this.lastWarning+this.cooldownMs)-this.now();this.timer=this.setTimer(()=>{this.timer=null;if(!this.active||!this.enabled||!this.pending)return;const spoken=this.speak(warnings[this.pending.status],'warning');if(spoken)this.lastWarning=this.now();this.schedule()},Math.max(1,wait))}
 speak(key,kind){
  if(!this.enabled||this.availability!=='ready'||this.utterance)return false;
  const voice=selectVoice(this.voices,this.getLanguage()),utterance=new this.Utterance(this.getText(key));utterance.voice=voice;utterance.lang=voice?.lang||locale(this.getLanguage());utterance.rate=.95;utterance.volume=1;this.utterance=utterance;this.speechKind=kind;
  const finish=()=>{if(this.utterance!==utterance)return;this.clearTimer(this.watchdog);this.utterance=null;this.speechKind=null;this.schedule()};
  utterance.onstart=()=>{this.clearTimer(this.watchdog);this.watchdog=this.setTimer(()=>this.fail(utterance),25000)};
  utterance.onend=finish;utterance.onerror=event=>{if(this.utterance!==utterance)return;if(event.error==='canceled'||event.error==='interrupted')finish();else this.fail(utterance)};
  this.watchdog=this.setTimer(()=>this.fail(utterance),6000);
  try{this.synth.resume?.();this.synth.speak(utterance);return true}catch{this.fail(utterance);return false}
 }
 fail(utterance){if(this.utterance!==utterance)return;this.error=true;this.stopAudio();this.onChange()}
 stopAudio(){this.clearTimer(this.timer);this.timer=null;this.clearTimer(this.watchdog);const speaking=!!this.utterance;this.utterance=null;this.speechKind=null;if(speaking)try{this.synth.cancel()}catch{}}
 stop(){this.active=false;this.pending=null;this.stopAudio();this.lastWarning=-Infinity}
 destroy(){this.stop();this.synth?.removeEventListener?.('voiceschanged',this.refresh)}
}
