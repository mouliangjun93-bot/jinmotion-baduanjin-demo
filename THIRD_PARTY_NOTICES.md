# Third-party software and model assets

The project's MIT License applies to its original source code, not to third-party components, model weights, institution names or marks.

| Component | Version / source | Treatment |
|---|---|---|
| MediaPipe Tasks Vision | 1.2.2; official npm package | Apache-2.0; license retained in `dist/vendor/mediapipe/LICENSE`. Runtime files are downloaded by setup. |
| fflate | 0.8.2; official npm package | MIT; license retained in `dist/vendor/fflate/LICENSE`. Runtime file is downloaded by setup. |
| Pose Landmarker Full | float16 v1; official Google model URL | Downloaded separately; not included or relicensed in the source ZIP. Consult the upstream model documentation and applicable terms before redistributing weights. |
| happy-dom and transitive dependencies | pinned in package-lock.json | Development/test dependencies installed through npm, not bundled into the source ZIP. Their upstream licenses continue to apply. |

MediaPipe package: https://registry.npmjs.org/@mediapipe/tasks-vision/-/tasks-vision-1.2.2.tgz

fflate package: https://registry.npmjs.org/fflate/-/fflate-0.8.2.tgz

Model: https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_full/float16/1/pose_landmarker_full.task

Model documentation: https://developers.google.com/edge/mediapipe/solutions/vision/pose_landmarker

Input checksums are recorded in `scripts/asset-inputs.json`. The setup script extracts only named files and validates runtime inputs. Generated `packed/` chunks are build outputs rather than original project source.
