import {visible,kneeAngles} from './pose-math.js';
// Conservative technical checks, not validated anatomy or error detection.
const strong=p=>visible(p)&&p.visibility>=.75&&(p.presence===undefined||p.presence>=.75)&&p.x>.02&&p.x<.98&&p.y>.02&&p.y<.98;
const length=(a,b,w,h)=>Math.hypot((a.x-b.x)*w,(a.y-b.y)*h);
export class PoseQuality{
 constructor(){this.previous={};this.pending={}}
 assess(points,width,height,now){const raw=kneeAngles(points,width,height),out={left:null,right:null},validHead=visible(points[0])&&[11,12].some(i=>strong(points[i]));let reason=validHead?'poseNeedLegs':'poseNeedBody';
  for(const [side,ids] of [['left',[23,25,27,11]],['right',[24,26,28,12]]]){const [hip,knee,ankle,shoulder]=ids.map(i=>points[i]);const fail=()=>{delete this.previous[side];delete this.pending[side]};if(!validHead||![hip,knee,ankle,shoulder].every(strong)){fail();continue}const thigh=length(hip,knee,width,height),shin=length(knee,ankle,width,height),torso=length(shoulder,hip,width,height);if(Math.min(thigh,shin)<24||thigh/shin<.4||thigh/shin>2.5||torso/thigh<.3||torso/thigh>3){fail();reason='poseUncertain';continue}
   const candidate={hip,knee,ankle,angle:raw[side],time:now},previous=this.previous[side],jump=previous&&now-previous.time<600&&(['hip','knee','ankle'].some(k=>length(candidate[k],previous[k],width,height)>Math.hypot(width,height)*.18)||(now-previous.time<200&&Math.abs(candidate.angle-previous.angle)>45));
   if(jump){const last=this.pending[side],consistent=last&&['hip','knee','ankle'].every(k=>length(candidate[k],last[k],width,height)<Math.hypot(width,height)*.05);if(!consistent){this.pending[side]=candidate;reason='poseUncertain';continue}}
   delete this.pending[side];this.previous[side]=candidate;out[side]=raw[side];
  }
  return {...out,status:out.left===null&&out.right===null?reason:'poseTracking'}
 }
}
