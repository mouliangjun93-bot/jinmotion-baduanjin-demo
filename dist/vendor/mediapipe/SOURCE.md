# MediaPipe runtime inputs

- SDK: `@mediapipe/tasks-vision` 1.2.2, retrieved from the official npm registry by `scripts/prepare-assets.py`.
- SDK license: Apache-2.0; retained in this directory.
- Model: Pose Landmarker Full float16 v1, retrieved separately from Google's official model storage.
- Model SHA-256: `5134a3aad27a58b93da0088d431f366da362b44e3ccfbe3462b3827a839011b1`.
- All runtime input sizes/hashes: `scripts/asset-inputs.json`.
- Generated compressed chunks: created locally by `pack-pose-assets.js` and excluded from Git/source archives.
- Documentation: https://developers.google.com/edge/mediapipe/solutions/vision/pose_landmarker

The pre-trained model is general purpose. It is not a Baduanjin classifier or a clinically validated knee-angle measurement system. This project's MIT License does not relicense upstream model weights.
