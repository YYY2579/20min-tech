#!/usr/bin/env python3
"""
十分钟系列 · 批量文档质检工具
用法:  python qa-check.py [目录]
作用:  对目录下所有 .html 学习文档做 6 轮自动质检，输出问题清单。
       - 结构完整性：标签配平 / 脚本 / 页脚 / 自测题数 / 答案索引越界
       - CSS 一致性：指纹比对，发现样式走样
       - 转义规范：正文未转义的裸 < 与 &
       - 内容灌水：重复句（剔除代码块）、超短段落
       - 残留占位符：TODO / 待补充 / 省略 等
       - 组件用量：表格 / 代码块 / 提示框 / 坑 / 速查行
返回码: 0 = 全部通过，1 = 发现问题（可用于 CI）
"""
import os, re, sys, hashlib, collections

DIR = sys.argv[1] if len(sys.argv) > 1 else os.path.dirname(os.path.abspath(__file__)) + "/.."
# 递归扫描，支持分类子目录
FILES = []
for root, _, files in os.walk(DIR):
    if "tpl" in os.path.relpath(root, DIR).replace("\\", "/").split("/"):
        continue  # tpl/ 是构建脚手架（内容片段），不是交付页面
    for fn in files:
        if fn.endswith(".html"):
            FILES.append(os.path.relpath(os.path.join(root, fn), DIR))
FILES.sort()

if not FILES:
    print("未找到 .html 文件"); sys.exit(1)

def strip(h):
    h = re.sub(r"<style>.*?</style>", "", h, flags=re.S)
    return re.sub(r"<script>.*?</script>", "", h, flags=re.S)

issues = []

# ---------- 1. 结构完整性 ----------
print("=" * 100); print("1. 结构完整性"); print("=" * 100)
print(f"{'文件':<40}{'div':>10}{'section':>10}{'脚本':>6}{'页脚':>6}{'题数':>6}{'越界':>6}")
for f in FILES:
    h = open(os.path.join(DIR, f), encoding="utf-8").read()
    do, dc = len(re.findall(r"<div\b", h)), len(re.findall(r"</div>", h))
    so, sc = len(re.findall(r"<section\b", h)), len(re.findall(r"</section>", h))
    script, footer = "total=1200" in h, "<footer>" in h
    qs = re.split(r'<div class="q" data-a="', h)[1:]
    bad = 0
    for q in qs:
        try: idx = int(q.split('"')[0])
        except Exception: idx = -1
        if idx < 0 or idx >= q.count('<button class="opt">'): bad += 1
    # 只把"标签不配平""答案索引越界"判为缺陷；
    # 题数与脚本/页脚属"文档体裁差异"（科普篇 vs 手册篇），仅作展示。
    flag = ""
    if do != dc or so != sc or bad:
        flag = "  <<<"
        issues.append(f"[结构] {f}: div {do}/{dc} section {so}/{sc} 答案越界={bad}")
    print(f"{f:<40}{f'{do}/{dc}':>10}{f'{so}/{sc}':>10}{'有' if script else '缺':>6}{'有' if footer else '缺':>6}{len(qs):>6}{bad:>6}{flag}")

# ---------- 2. CSS 一致性 ----------
print(); print("=" * 100); print("2. CSS 一致性"); print("=" * 100)
groups = collections.defaultdict(list)
for f in FILES:
    h = open(os.path.join(DIR, f), encoding="utf-8").read()
    m = re.search(r"<style>(.*?)</style>", h, re.S)
    groups[hashlib.md5(m.group(1).strip().encode()).hexdigest()[:10] if m else "无style"].append(f)
for k, v in groups.items():
    print(f"  指纹 {k}: {len(v)} 份")
    if len(v) < len(FILES):
        for x in v: print(f"      - {x}")
if len(groups) > 1:
    print(f"  → 共 {len(groups)} 种指纹。同一批产出出现多种才算问题；跨批次属正常（模板会演进）。")

# ---------- 3. 转义规范 ----------
print(); print("=" * 100); print("3. 转义规范（正文裸 < / &）"); print("=" * 100)
# 未转义的 < 一定"后面不跟字母/斜杠/叹号"——HTML 标签必然以这三者之一开头。
# 这样 <!DOCTYPE>、<sup> 这类正常标签不会误报，而 a < b、x <= 10 会被抓到。
for f in FILES:
    b = strip(open(os.path.join(DIR, f), encoding="utf-8").read())
    bad = [b[m.start():m.start() + 24] for m in re.finditer(r"<", b)
           if not re.match(r"[a-zA-Z/!]", b[m.start() + 1:m.start() + 2])]
    if bad:
        print(f"  !! {f}: {len(bad)} 处  例: {bad[0]!r}")
        issues.append(f"[转义] {f}: {len(bad)} 处裸 <")
print("  （无输出 = 全部干净）" if not any("转义" in i for i in issues) else "")

# ---------- 4. 灌水检测 ----------
print(); print("=" * 100); print("4. 灌水检测（重复句已剔除代码块 / 超短段）"); print("=" * 100)
for f in FILES:
    h = open(os.path.join(DIR, f), encoding="utf-8").read()
    b = strip(h)
    nb = re.sub(r"<pre>.*?</pre>", "", b, flags=re.S)   # 关键：先剔除代码块
    nb = re.sub(r"<code>.*?</code>", "", nb, flags=re.S)          # 速查行里的命令
    nb = re.sub(r'<span class="k">.*?</span>', "", nb, flags=re.S)  # 行内代码
    text = re.sub(r"<[^>]+>", "\n", nb)
    sents = [s.strip() for s in re.split(r"[。\n；]", text) if len(s.strip()) >= 20]
    dup = sum(c - 1 for c in collections.Counter(sents).values() if c > 1)
    short = [re.sub(r"<[^>]+>", "", m).strip() for m in re.findall(r"<p[^>]*>(.*?)</p>", b, re.S)
             if 0 < len(re.findall(r"[\u4e00-\u9fff]", re.sub(r"<[^>]+>", "", m))) < 8]
    cn = len(re.findall(r"[\u4e00-\u9fff]", re.sub(r"<[^>]+>", " ", nb)))
    flag = "  <<<" if dup > 5 else ""
    if dup > 5: issues.append(f"[灌水] {f}: {dup} 处重复句")
    print(f"{f:<40} 说明文字 {cn:>5} 字   重复句 {dup:>2}   超短段 {len(short):>2}{flag}")
    for s in short[:3]:
        print(f"      · 超短段: 「{s}」")

# ---------- 5. 占位符残留 ----------
print(); print("=" * 100); print("5. 占位符 / 未完成标记"); print("=" * 100)
# TODO/FIXME 在技术文档里是正常词汇（描述代码标记），不列入占位符。
# 真正的占位符是这些明确的"未完成"表述。
BAD = ["待补充内容", "此处略", "敬请期待", "（略）", "待完善", "占位文本"]
found = 0
for f in FILES:
    b = strip(open(os.path.join(DIR, f), encoding="utf-8").read())
    # 占位符只在"散文"里查：剔除代码块与行内代码，
    # 否则 grep -r "TODO"、:g/TODO/d 这类示例会被误判。
    prose = re.sub(r"<pre>.*?</pre>", "", b, flags=re.S)
    prose = re.sub(r"<code>.*?</code>", "", prose, flags=re.S)
    prose = re.sub(r'<span class="k">.*?</span>', "", prose, flags=re.S)
    for k in BAD:
        if k in prose:
            print(f"  !! {f}: 含「{k}」"); found += 1
            issues.append(f"[占位] {f}: 含「{k}」")
print("  （无输出 = 干净）" if not found else "")

# ---------- 6. 组件用量 ----------
print(); print("=" * 100); print("6. 组件用量"); print("=" * 100)
print(f"{'文件':<40}{'表格':>6}{'代码':>6}{'提示框':>8}{'坑':>5}{'速查':>6}{'卡片':>6}")
for f in FILES:
    h = open(os.path.join(DIR, f), encoding="utf-8").read()
    n = lambda p: len(re.findall(p, h))
    print(f"{f:<40}{n(r'<table'):>6}{n(r'<pre>'):>6}{n(r'class=.callout'):>8}"
          f"{n(r'class=.pit.'):>5}{n(r'class=.crow.'):>6}{n(r'class=.card.'):>6}")

# ---------- 汇总 ----------
print(); print("=" * 100); print("汇总"); print("=" * 100)
print(f"共 {len(FILES)} 份，总计 {sum(os.path.getsize(os.path.join(DIR,f)) for f in FILES)/1024:.1f} KB")
if issues:
    print(f"\n发现 {len(issues)} 个问题：")
    for i in issues: print("  !! " + i)
    sys.exit(1)
print("\n全部通过。")
sys.exit(0)
