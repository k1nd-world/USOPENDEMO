"""Run once on the existing service immediately before release. Prints no data or keys."""
from datetime import datetime, timezone
from pathlib import Path
import os, sqlite3, shutil, json
root=Path(os.environ["K1ND_DATA_DIR"])
db=root/"k1nd_platform_v4_24_1.sqlite3"
key=root/".k1nd_server_secret"
if not db.is_file() or not key.is_file():
    raise SystemExit("Existing database and signing key must both be present; nothing backed up.")
folder=root/"release-backups"/datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%S%fZ")
folder.mkdir(parents=True,mode=0o700)
with sqlite3.connect("file:"+str(db)+"?mode=ro",uri=True) as source, sqlite3.connect(folder/db.name) as target:
    source.backup(target)
    if target.execute("PRAGMA integrity_check").fetchone()[0] != "ok":
        raise SystemExit("Backup integrity check failed.")
shutil.copy2(key,folder/key.name)
os.chmod(folder/db.name,0o600);os.chmod(folder/key.name,0o600)
print(json.dumps({"backupCreated":True,"databaseIntegrity":"ok","privateLocation":str(folder)}))
