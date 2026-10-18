#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
inject-notes.py — 把 notes-core.js 以一行 <script> 注入所有页面（幂等 + 版本穿透）

用法:
    python inject-notes.py [站点根目录]

行为:
    - 遍历根目录下 01-09 分类文件夹中的全部 .html 文档
      → 注入 <script src="../notes-core.js?v=VERSION" id="n20-core" defer></script>
    - 根目录 index.html
      → 注入 <script src="notes-core.js?v=VERSION" id="n20-core" defer></script>
    - 404.html 不注入
    - 已是当前 VERSION 的跳过；旧版本的替换为新版本（幂等，可反复运行）
    - 运行顺序约定：先 build-index.py 生成主页，再跑本脚本

!!! 每次修改 notes-core.js 必须把 VERSION +1 并重跑本脚本 !!!
    GitHub Pages 对 .js 有 max-age=600 缓存，URL 不带版本号时
    用户普通刷新拿到的是旧文件（线上 bug "改了却没生效" 的根因）。
"""
import os
import re
import sys

ROOT = sys.argv[1] if len(sys.argv) > 1 else os.path.dirname(os.path.abspath(__file__))
VERSION = '4'  # ← 每次改 notes-core.js 必须 +1（v4：一章多笔记 + creating 修复 + chips 刷新 + 迁移修复）
SKIP = {'404.html'}

TAG_RE = re.compile(
    r'<script src="(?:\.\./)?notes-core\.js(?:\?v=\d+)?" id="n20-core" defer></script>\n?')


def inject(path, src):
    with open(path, 'r', encoding='utf-8') as f:
        html = f.read()
    tag = '<script src="%s" id="n20-core" defer></script>\n' % src
    if tag in html:
        return 'skip'
    if TAG_RE.search(html):
        html = TAG_RE.sub('', html, count=1)  # 去掉旧版本注入
        action = 'update'
    else:
        action = 'ok'
    if '</body>' not in html:
        return 'no-body'
    html = html.replace('</body>', tag + '</body>', 1)
    with open(path, 'w', encoding='utf-8', newline='') as f:
        f.write(html)
    return action


def main():
    injected, updated, skipped, problems = 0, 0, 0, []

    for cat in sorted(os.listdir(ROOT)):
        cat_path = os.path.join(ROOT, cat)
        if not (os.path.isdir(cat_path) and cat[:2].isdigit()):
            continue
        for name in sorted(os.listdir(cat_path)):
            if not name.endswith('.html'):
                continue
            r = inject(os.path.join(cat_path, name), '../notes-core.js?v=%s' % VERSION)
            if r in ('ok', 'update'):
                injected += 1
                if r == 'update':
                    updated += 1
            elif r == 'skip':
                skipped += 1
            else:
                problems.append(os.path.join(cat_path, name))

    home = os.path.join(ROOT, 'index.html')
    if os.path.exists(home):
        r = inject(home, 'notes-core.js?v=%s' % VERSION)
        if r in ('ok', 'update'):
            injected += 1
            if r == 'update':
                updated += 1
        elif r == 'skip':
            skipped += 1
        else:
            problems.append(home)

    print('VERSION=%s | 写入 %d 个文件（其中版本更新 %d），跳过 %d 个' % (VERSION, injected, updated, skipped))
    if problems:
        print('!! 以下文件没有 </body>，未处理:')
        for p in problems:
            print('   ', p)
        sys.exit(1)


if __name__ == '__main__':
    main()
