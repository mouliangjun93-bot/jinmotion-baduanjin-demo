import test from 'node:test';
import assert from 'node:assert/strict';
import {cameraConstraints,cameraInfo,setCameraZoom} from './dist/camera-controls.js';
const track=(min=.5,max=3)=>{let zoom=1;return {getCapabilities:()=>({zoom:{min,max,step:.1}}),getSettings:()=>({zoom,facingMode:'environment',deviceId:'back'}),applyConstraints:async c=>{zoom=c.advanced[0].zoom}}};
test('camera selection preserves the requested lens without requiring a resolution',()=>{const back=cameraConstraints({facing:'environment'});assert.equal(back.audio,false);assert.equal(back.video.facingMode.ideal,'environment');assert.deepEqual(cameraConstraints({deviceId:'ultra'}).video.deviceId,{exact:'ultra'});assert.equal(back.video.width.exact,undefined)});
test('hardware zoom supports a genuinely wider field and clamps requests',async()=>{const t=track();assert.equal(await setCameraZoom(t,.5),.5);assert.equal(await setCameraZoom(t,99),3)});
test('fixed cameras expose no pretend zoom and ignored settings fail explicitly',async()=>{assert.equal(cameraInfo({getSettings:()=>({})}).zoom,null);await assert.rejects(()=>setCameraZoom({},.5));const t=track();t.applyConstraints=async()=>{};await assert.rejects(()=>setCameraZoom(t,.5),/did not apply/)});
