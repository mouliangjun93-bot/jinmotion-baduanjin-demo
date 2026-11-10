"""Fetch pinned upstream dependencies; verify each runtime input before use."""
from pathlib import Path
from io import BytesIO
import hashlib
import json
import subprocess
import tarfile
import time
from urllib.request import urlopen

ROOT = Path(__file__).resolve().parent.parent
EXPECTED = json.loads((ROOT / 'scripts' / 'asset-inputs.json').read_text())
VENDOR = ROOT / 'dist' / 'vendor'

def matches(path, info):
    return path.is_file() and path.stat().st_size == info['size'] and hashlib.sha256(path.read_bytes()).hexdigest() == info['sha256']

def fetch(url):
    for attempt in range(3):
        try:
            with urlopen(url, timeout=30) as response:
                data = response.read(64 * 1024 * 1024 + 1)
            if len(data) > 64 * 1024 * 1024:
                raise ValueError('Upstream download exceeds expected maximum size')
            return data
        except Exception:
            if attempt == 2:
                raise
            time.sleep(attempt + 1)

def save(key, data):
    info = EXPECTED[key]
    if len(data) != info['size'] or hashlib.sha256(data).hexdigest() != info['sha256']:
        raise ValueError('Integrity check failed: ' + key)
    target = VENDOR / key
    target.parent.mkdir(parents=True, exist_ok=True)
    target.write_bytes(data)

def package_assets(url, entries):
    missing = {name: key for name, key in entries.items() if not matches(VENDOR / key, EXPECTED[key])}
    if not missing:
        return
    print('Fetching ' + url.rsplit('/', 1)[-1], flush=True)
    with tarfile.open(fileobj=BytesIO(fetch(url)), mode='r:gz') as archive:
        for name, key in missing.items():
            stream = archive.extractfile(name)
            if stream is None:
                raise ValueError('Missing upstream entry: ' + name)
            save(key, stream.read())
        # Preserve any upstream NOTICE file without extracting arbitrary paths.
        for name in ('package/NOTICE', 'package/NOTICE.txt'):
            if name in archive.getnames():
                destination = VENDOR / ('mediapipe' if 'tasks-vision' in url else 'fflate') / 'NOTICE'
                destination.write_bytes(archive.extractfile(name).read())

package_assets('https://registry.npmjs.org/@mediapipe/tasks-vision/-/tasks-vision-1.2.2.tgz', {
    'package/vision_bundle.mjs': 'mediapipe/vision_bundle.mjs',
    'package/wasm/vision_wasm_internal.js': 'mediapipe/wasm/vision_wasm_internal.js',
    'package/wasm/vision_wasm_internal.wasm': 'mediapipe/wasm/vision_wasm_internal.wasm',
})
package_assets('https://registry.npmjs.org/fflate/-/fflate-0.8.2.tgz', {
    'package/esm/browser.js': 'fflate/fflate.mjs',
})
key = 'mediapipe/pose_landmarker_full.task'
if not matches(VENDOR / key, EXPECTED[key]):
    print('Fetching Pose Landmarker Full float16 v1', flush=True)
    save(key, fetch('https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_full/float16/1/pose_landmarker_full.task'))
subprocess.run(['node', 'pack-pose-assets.js'], cwd=ROOT, check=True)
print('Assets verified and packed. Run npm test or npm start.', flush=True)
