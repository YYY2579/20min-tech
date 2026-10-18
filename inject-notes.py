#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
inject-notes.py — 把 notes-core.js 以一行 <script> 注入所有页面（幂等）

用法:
    python inject-notes.py [站点根目录]

行为:
    - 遍历根目录下 01-09 分类文件夹中的全部 .html 文档
      → 在 </body> 前注入  <script src="../notes-core.js" id="n20-core" defer></script>
    - 根目录 index.html
      → 在 </body> 前注入  <script src="notes-core.js" id="n20-core" defer></script>
    - 404.html 不注入
    - 已含 id="n20-core" 的文件跳过（幂等，可反复运行）
    - 运行顺序约定：先 build-index.py 生成主页，再跑本脚本
"""
import os
import sys

ROOT = sys.argv[1] if len(sys.argv) > 1 else os.path.dirname(os.path.abspath(__file__))
MARKER = 'id="n20-core"'
SKIP = {'404.html'}

TAG_DOC = '<script src="../notes-core.js" id="n20-core" defer></script>\n</body>'
TAG_HOME = '<script src="notes-core.js" id="n20-core" defer></script>\n</body>'


def inject(path, tag):
    with open(path, 'r', encoding='utf-8') as f:
        html = f.read()
    if MARKER in html:
        return 'skip'
    if '</body>' not in html:
        return 'no-body'
    html = html.replace('</body>', tag, 1)
    with open(path, 'w', encoding='utf-8', newline='') as f:
        f.write(html)
    return 'ok'


def main():
    injected, skipped, problems = 0, 0, []

    # 1) 分类文档
    for cat in sorted(os.listdir(ROOT)):
        cat_path = os.path.join(ROOT, cat)
        if not (os.path.isdir(cat_path) and cat[:2].isdigit()):
            continue
        for name in sorted(os.listdir(cat_path)):
            if not name.endswith('.html'):
                continue
            p = os.path.join(cat_path, name)
            r = inject(p, TAG_DOC)
            if r == 'ok':
                injected += 1
            elif r == 'skip':
                skipped += 1
            else:
                problems.append(p)

    # 2) 主页
    home = os.path.join(ROOT, 'index.html')
    if os.path.exists(home):
        r = inject(home, TAG_HOME)
        if r == 'ok':
            injected += 1
        elif r == 'skip':
            skipped += 1
        else:
            problems.append(home)

    print('注入完成: %d 个文件新增, %d 个已存在(跳过)' % (injected, skipped))
    if problems:
        print('!! 以下文件没有 </body>，未处理:')
        for p in problems:
            print('   ', p)
        sys.exit(1)


if __name__ == '__main__':
    main()
