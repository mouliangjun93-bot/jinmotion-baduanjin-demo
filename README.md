# JinMotion / 锦行 / 錦行

English | [简体中文](README.zh-CN.md)

A trilingual, camera-assisted Baduanjin research prototype, version **0.2.4**.

**Live demo:** https://jinmotion-baduanjin.netlify.app/

This repository demonstrates early software feasibility. It is not a validated clinical assessment or treatment system. It is not yet the completed Study 2 system or a research finding.

## Current functions

- Simplified Chinese, traditional-script Hong Kong Cantonese and English; Cantonese is the default.
- Eight-movement illustrated library, editable demonstration plans, timing, manual repetition counts, pain/exertion logs, restored practice drafts and CSV/JSON export/import.
- Full-screen camera view with front/rear selection and hardware zoom when exposed by the browser.
- Experimental 2D **hip-knee-ankle interior angles**, with a straight limb approximately 180 degrees. These are not validated anatomical knee-flexion measurements.
- Same-frame image and landmark overlay; technical confidence, framing and instability checks.
- Mandarin, Cantonese and English positioning voice prompts using available device voices. Delayed/rate-limited reminders, mute and voice trial controls.
- Local, integrity-checked model resource caching with resumable completed chunks and retries.

## Limitations and research status

Google's pre-trained MediaPipe Pose Landmarker Full provides general body landmarks. We have not trained a Baduanjin-specific model. Clothing, occlusion, camera direction, lens distortion and confidently incorrect landmark predictions can affect results. The technical filters do not catch every error.

Baduanjin movement classification, clinically meaningful fidelity scoring, automatic repetitions, individualised exercise prescription and validated corrective feedback are **not implemented**. Current voice prompts concern camera positioning and tracking quality. Movement illustrations and sample doses are demonstrations, not validated teaching or treatment recommendations.

The project is intended to support further research development. The proposed workflow is Study 1 movement evidence and expert rules, Study 2 development/independent technical and feedback validation, and only then a frozen system for Study 3. Software tests do not establish measurement accuracy or clinical benefit.

## Run locally

Prerequisites: Node.js 22 or later, Python 3.9 or later, and internet access for the initial upstream asset setup.

```sh
npm ci --ignore-scripts
npm run prepare:assets
npm test
npm start
```

Open http://127.0.0.1:8765/ . Do not double-click `index.html`: the app uses ES modules. Camera use requires a secure context such as localhost or HTTPS, and user permission. A phone accessing a computer's ordinary HTTP LAN address is not equivalent to localhost on the phone.

The source repository deliberately excludes model weights, generated binary chunks, downloaded third-party executable assets, local hosting metadata and test photos. `prepare:assets` retrieves pinned MediaPipe 1.2.2 / fflate 0.8.2 runtime files and the official Full float16 v1 model, verifies their sizes/SHA-256 hashes and generates the compressed chunks locally. If an upstream host is inaccessible, setup may fail; the browser demo remains available separately. Original vendor licenses are retained in `dist/vendor/`.

## Tests and reproducibility

The current suite has 47 software tests, including angle geometry, state recovery, backup import, same-frame overlays, camera controls, resource integrity/retry/cache behavior and language-specific speech behavior.

Desktop browser smoke tests have exercised model inference and matching speech voice locales. Real-world iPhone/Android accuracy, device compatibility and performance have not been established by those tests. No participant validation dataset or clinical results are included.

After `prepare:assets`, generate a static Netlify deployment ZIP with:

```sh
python3 pack-netlify.py
```

The output is `release/jinmotion-netlify.zip`. Hosting the source on GitHub and hosting the running application on Netlify are separate tasks.

## Privacy and data

This prototype has no accounts, backend or cloud synchronisation. Practice records and numeric samples stay in the current browser's localStorage. Camera images are processed on the device; this app does not record or upload them. Browser voice services receive fixed prompt text according to their implementation; no microphone is used. Clearing browser storage removes local records; use JSON backup if needed.

Do not commit real participant data, personal health records, recordings, account tokens or deployment credentials. Exported records and the original research proposal are not part of this repository.

## Attribution, AI assistance and licenses

The demo's requested project credits are Prof. Gilbert Lam Wing-Kai (林永佳) and PhD candidate Mou Liangjun (牟亮俊), HKBU. These credits describe the demo attribution and do not by themselves establish institutional endorsement or an allocation of legal rights.

Development used AI-assisted coding. Base pose estimation is provided by Google MediaPipe; it should not be presented as an original trained pose model.

Original project code is provided under the MIT License. Third-party components retain their own licenses and terms. Upstream model files are downloaded separately and are not relicensed by this project's MIT License. See [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md).
