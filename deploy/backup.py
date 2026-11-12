#!/usr/bin/env python3
"""每天在线备份 SQLite，保留最近 14 天；由 /etc/cron.d/wangshu-backup 调用。"""
import datetime
import pathlib
import sqlite3
import time

SOURCE = pathlib.Path("/opt/wangshu/data/wangshu.db")
TARGET_DIR = pathlib.Path("/opt/wangshu/backups")
KEEP_DAYS = 14


def main() -> None:
    TARGET_DIR.mkdir(parents=True, exist_ok=True)
    stamp = datetime.datetime.now().strftime("%Y%m%d-%H%M%S")
    target = TARGET_DIR / f"wangshu-{stamp}.db"
    with sqlite3.connect(SOURCE) as source, sqlite3.connect(target) as destination:
        source.backup(destination)
    cutoff = time.time() - KEEP_DAYS * 86400
    for old in TARGET_DIR.glob("wangshu-*.db"):
        if old.stat().st_mtime < cutoff:
            old.unlink()
    print(f"backup {target} ({target.stat().st_size} bytes)")


if __name__ == "__main__":
    main()
