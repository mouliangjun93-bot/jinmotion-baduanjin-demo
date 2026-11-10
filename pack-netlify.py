from pathlib import Path
from zipfile import ZipFile, ZIP_DEFLATED
import hashlib
import json
root = Path(__file__).resolve().parent / 'dist'
out = root.parent / 'release' / 'jinmotion-netlify.zip'
out.parent.mkdir(parents=True, exist_ok=True)
manifest = json.loads((root / 'pose-assets.js').read_text().split('=', 1)[1].strip().rstrip(';'))
packed = {c['path'] for asset in manifest for c in asset['chunks']}
with ZipFile(out, 'w', ZIP_DEFLATED) as archive:
    for path in sorted(root.rglob('*')):
        if not path.is_file() or path.name == '.DS_Store':
            continue
        name = path.relative_to(root).as_posix()
        if name == 'pose-worker.js' or name.startswith('vendor/mediapipe/wasm/') or name.endswith('.task'):
            continue
        if '/packed/' in name and name not in packed:
            continue
        archive.write(path, name)
with ZipFile(out) as archive:
    assert archive.testzip() is None
    assert sum('/packed/' in name for name in archive.namelist()) == len(packed)
    assert '_headers' in archive.namelist()
    assert not any(name.endswith('.task') for name in archive.namelist())
print(out)
print(out.stat().st_size, hashlib.sha256(out.read_bytes()).hexdigest())
