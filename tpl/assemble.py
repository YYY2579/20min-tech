#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""把 tpl/parts/*.part.html 的内容片段装配成 10-interview/ 下的完整单文件 HTML。

片段只包含 <header>…</header><main>…</main><footer>…</footer>，
DOCTYPE / head / style / 计时脚本 由本脚本统一注入 —— 保证全站 CSS 指纹一致。

用法:
    python tpl/assemble.py            # 装配全部片段
    python tpl/assemble.py 01         # 只装配文件名以 01 开头的片段
"""
import os, re, sys, html

BASE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
TPL = os.path.join(BASE, 'tpl')
OUT = os.path.join(BASE, '10-interview')

CSS = open(os.path.join(TPL, 'style.css'), encoding='utf-8').read()
JS = open(os.path.join(TPL, 'app.js'), encoding='utf-8').read()

DOC = '''<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>{title}</title>
<link rel="icon" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Crect width='32' height='32' rx='8' fill='%232E5BFF'/%3E%3Ctext x='16' y='22' font-size='15' font-family='system-ui' font-weight='700' fill='%23fff' text-anchor='middle'%3E20%3C/text%3E%3C/svg%3E">
<style>{css}</style>
</head>
<body>
<div id="bar"></div>
<div style="max-width:900px;margin:14px auto 0;padding:0 24px;font-size:13px">
  <a href="index.html" style="color:#185FA5;text-decoration:none">← 求职冲刺专栏首页</a>
  <span style="color:#9A9A93;margin:0 8px">·</span>
  <a href="../index.html" style="color:#6B6B66;text-decoration:none">20分钟速学站点首页</a>
</div>

{body}

{js}
<script src="../notes-core.js?v=5" id="n20-core" defer></script>
</body>
</html>
'''


def main():
    prefix = sys.argv[1] if len(sys.argv) > 1 else ''
    parts = sorted(f for f in os.listdir(os.path.join(TPL, 'parts'))
                   if f.endswith('.part.html') and f.startswith(prefix))
    if not parts:
        print('没有匹配的片段'); return
    for fn in parts:
        src = os.path.join(TPL, 'parts', fn)
        body = open(src, encoding='utf-8').read().strip()
        m = re.search(r'<h1>(.*?)</h1>', body, re.S)
        if not m:
            print('!! %s 缺 <h1>' % fn); continue
        title = html.unescape(re.sub(r'<[^>]+>', '', m.group(1))).strip()
        out_name = fn.replace('.part.html', '.html')
        out = os.path.join(OUT, out_name)
        open(out, 'w', encoding='utf-8', newline='').write(
            DOC.format(title=title, css=CSS, body=body, js=JS))
        print('%-46s %6.1f KB  %s' % (out_name, os.path.getsize(out) / 1024, title))


if __name__ == '__main__':
    main()
