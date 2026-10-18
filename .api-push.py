#!/usr/bin/env python3
"""通过 GitHub Git Data API 把本地目录推送到远端仓库（绕过 github.com 被墙的问题）。
用法: python api-push.py <repo> <token> <base_dir>
"""
import base64, json, os, sys, time
import urllib.request, urllib.error

REPO = sys.argv[1]          # e.g. YYY2579/20min-tech
TOKEN = sys.argv[2]
BASE = sys.argv[3]          # local dir to push

# 直连，不走代理
opener = urllib.request.build_opener(urllib.request.ProxyHandler({}))

def api(method, path, body=None):
    url = f"https://api.github.com/repos/{REPO}{path}" if path.startswith("/") else f"https://api.github.com{path}"
    data = json.dumps(body).encode() if body is not None else None
    req = urllib.request.Request(url, data=data, method=method, headers={
        "Authorization": f"token {TOKEN}",
        "Accept": "application/vnd.github+json",
        "Content-Type": "application/json",
        "User-Agent": "20min-push",
    })
    for attempt in range(4):
        try:
            with opener.open(req, timeout=60) as r:
                return json.loads(r.read().decode())
        except urllib.error.HTTPError as e:
            err = e.read().decode()[:300]
            if e.code in (403, 429) and attempt < 3:
                time.sleep(5 * (attempt + 1)); continue
            if e.code == 404 and method == "GET":
                return None
            raise RuntimeError(f"{method} {path} -> {e.code}: {err}")
    raise RuntimeError("retries exhausted")

# 1. 收集文件
files = []
for root, dirs, fs in os.walk(BASE):
    dirs[:] = [d for d in dirs if d != ".git"]
    for fn in fs:
        p = os.path.join(root, fn)
        rel = os.path.relpath(p, BASE).replace("\\", "/")
        files.append((rel, p))
files.sort()
print(f"files: {len(files)}")

# 2. 建 blob（每个文件一次）
blobs = {}
for i, (rel, p) in enumerate(files):
    raw = open(p, "rb").read()
    is_text = True
    try:
        content = raw.decode("utf-8")
    except UnicodeDecodeError:
        is_text = False
    if is_text:
        body = {"content": content, "encoding": "utf-8"}
    else:
        body = {"content": base64.b64encode(raw).decode(), "encoding": "base64"}
    r = api("POST", "/git/blobs", body)
    blobs[rel] = r["sha"]
    if (i + 1) % 40 == 0:
        print(f"  blobs {i+1}/{len(files)}")

# 3. 建树（目录用 / 路径，GitHub 递归处理）
tree = [{"path": rel, "mode": "100644", "type": "blob", "sha": sha} for rel, sha in blobs.items()]
r = api("POST", "/git/trees", {"tree": tree})
tree_sha = r["sha"]
print("tree:", tree_sha)

# 4. 拿当前 main 作为 parent（如果有）
parent = []
try:
    ref = api("GET", "/git/ref/heads/main")
    if ref:
        parent = [ref["object"]["sha"]]
except Exception:
    pass

# 5. 建 commit
c = api("POST", "/git/commits", {
    "message": "20分钟速学：198 份单文件技术手册 + 主页 + 目录",
    "tree": tree_sha,
    "parents": parent,
})
print("commit:", c["sha"])

# 6. 更新/创建 ref
if parent:
    r = api("PATCH", "/git/refs/heads/main", {"sha": c["sha"], "force": True})
else:
    r = api("POST", "/git/refs", {"ref": "refs/heads/main", "sha": c["sha"]})
print("ref updated:", r.get("ref"))
print("DONE")
