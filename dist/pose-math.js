export const VISIBILITY_THRESHOLD=0.65;
// Image-plane interior angle: straight limb = 180 degrees. Pixel scaling matters.
export function angle2D(a,b,c,width,height){if(!(width>0&&height>0)||![a,b,c].every(p=>p&&Number.isFinite(p.x)&&Number.isFinite(p.y)))return null;const ux=(a.x-b.x)*width,uy=(a.y-b.y)*height,vx=(c.x-b.x)*width,vy=(c.y-b.y)*height;const den=Math.hypot(ux,uy)*Math.hypot(vx,vy);if(den<1e-6)return null;return Math.acos(Math.max(-1,Math.min(1,(ux*vx+uy*vy)/den)))*180/Math.PI}
export function visible(p){return !!p&&Number.isFinite(p.visibility)&&p.visibility>=VISIBILITY_THRESHOLD&&(p.presence===undefined||p.presence>=VISIBILITY_THRESHOLD)&&p.x>=0&&p.x<=1&&p.y>=0&&p.y<=1}
export function kneeAngles(landmarks,width,height){const joint=ids=>{const p=ids.map(i=>landmarks?.[i]);if(!p.every(visible))return null;const result=angle2D(...p,width,height);return result===null?null:Math.round(result*10)/10};return {left:joint([23,25,27]),right:joint([24,26,28])}}
export const CONNECTIONS=[[11,12],[11,13],[13,15],[12,14],[14,16],[11,23],[12,24],[23,24],[23,25],[25,27],[24,26],[26,28],[27,29],[29,31],[28,30],[30,32]];
