import {PoseLandmarker} from './vendor/mediapipe/vision_bundle.mjs';
import {loadPoseAssets} from './pose-download.js';
export async function createPoseModel(options={}){
 const {wasm,model,loader}=await loadPoseAssets(options);
 if(options.signal?.aborted)throw new DOMException('Model loading cancelled','AbortError');
 const binaryURL=URL.createObjectURL(new Blob([wasm],{type:'application/wasm'})),loaderURL=URL.createObjectURL(new Blob([loader],{type:'application/javascript'}));
 try{return await PoseLandmarker.createFromOptions({wasmLoaderPath:loaderURL,wasmBinaryPath:binaryURL},{baseOptions:{modelAssetBuffer:model,delegate:'CPU'},runningMode:'VIDEO',numPoses:1,minPoseDetectionConfidence:0.65,minPosePresenceConfidence:0.65,minTrackingConfidence:0.65,outputSegmentationMasks:false})}
 finally{URL.revokeObjectURL(binaryURL);URL.revokeObjectURL(loaderURL)}
}
