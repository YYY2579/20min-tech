#!/usr/bin/env python3
"""从各分类目录的文档中提取标题/副标题，生成 index.html 主页。
用法: python build-index.py  (在 20分钟速学 目录下运行)
"""
import os, re, html

BASE = os.path.dirname(os.path.abspath(__file__))

CATS = [
    ("01", "fundamentals", "工程基础", "编程语言无关的硬功夫：命令行、Git、调试、测试、Shell、正则。后端与运维日常最高频。", "dev"),
    ("02", "lowlevel", "底层原理", "操作系统、CPU、内存、编译链接、并发模型、内核追踪。决定你排查问题时的直觉。", "arch"),
    ("03", "languages", "编程语言", "主流语言逐个击破：Python、Java、Go、Rust、C/C++、JS/TS、Kotlin、Swift、PHP、Node、Vue，加 SQL 与运行时对比。", "dev"),
    ("04", "data", "数据与存储", "关系库、NoSQL、NewSQL、消息队列、搜索引擎、分库分表、数仓建模、备份恢复与迁移。事故重灾区。", "dev"),
    ("05", "architecture", "架构与设计", "分布式基础、高并发、缓存、一致性、幂等限流、多活容灾、DDD、设计模式、遗留系统改造。", "arch"),
    ("06", "devops", "运维与云原生", "Docker、K8s、可观测性、CI/CD、IaC、Helm、Istio、GitOps、Vault、SRE 实践、on-call。", "ops"),
    ("07", "security", "安全", "注入、XSS/CSRF、认证授权、密码学、供应链、云安全、渗透测试、应急响应、等保合规。", "ops"),
    ("08", "ai", "AI 工程", "大模型应用、RAG、Agent、微调、评估、多模态、语音、图像生成、成本与可观测。", "ai"),
    ("09", "practice", "综合实战", "电商、秒杀、IM、支付、直播、权限、监控、日志、CI 平台等 22 个完整系统设计实战。", "arch"),
]

def extract(path):
    h = open(path, encoding="utf-8").read()
    t = re.search(r"<h1>(.*?)</h1>", h, re.S)
    s = re.search(r'<p class="sub">(.*?)</p>', h, re.S)
    title = html.unescape(re.sub(r"<[^>]+>", "", t.group(1)).strip()) if t else os.path.basename(path)
    sub = re.sub(r"<[^>]+>", "", s.group(1)).strip() if s else ""
    sub = html.unescape(re.sub(r"\s+", " ", sub))[:110]
    return title, sub

def esc(s):
    return s.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;").replace('"', "&quot;")

docs = {}
total = 0
for num, slug, name, desc, _ in CATS:
    d = os.path.join(BASE, f"{num}-{slug}")
    items = []
    for fn in sorted(os.listdir(d)):
        if fn.endswith(".html"):
            t, s = extract(os.path.join(d, fn))
            items.append((fn[:-5], t, s))
            total += 1
    docs[num] = items

TAGMAP = {"dev": ('<span class="tag">工程</span>', "tag"),
          "ops": ('<span class="tag ops">运维</span>', "tag ops"),
          "arch": ('<span class="tag arch">架构</span>', "tag arch"),
          "ai": ('<span class="tag ai">AI</span>', "tag ai")}

# 学习路径：指向真实文件
PATHS = [
    ("后端工程师速成路径", "先语言与数据（<b>03 → 04</b>），再架构（<b>05</b>），最后实战（<b>09</b>）。每类挑 2~3 份读，两周可过一轮。"),
    ("运维 / SRE 路径", "从 <b>06 运维与云原生</b> 开始，配合 <b>02 底层原理</b> 打底，<b>09</b> 里的监控/日志/CI 平台三份收口。"),
    ("架构师进阶路径", "<b>05 架构与设计</b> 全 22 份为主干，<b>04 数据</b> 与 <b>09 实战</b> 做案例印证，<b>02</b> 补底层直觉。"),
    ("AI 应用开发路径", "<b>08 AI 工程</b> 全 22 份：大模型应用 → RAG → Agent → 评估 → 成本，配 <b>04</b> 的向量数据库。"),
    ("安全攻防路径", "<b>07 安全</b> 全 20 份，按 OWASP Top 10 顺序读，<b>06</b> 的 K8s 安全与供应链安全收口。"),
    ("面试冲刺路径", "每类只读带「实战」「深入」「原理」字样的篇目，配合 <b>09 综合实战</b> 的 22 个系统设计题。"),
]

CSS = open(os.path.join(BASE, "index.html"), encoding="utf-8").read()
css = re.search(r"<style>(.*?)</style>", CSS, re.S).group(1)
css += """
.item .tag.ai{background:var(--accent-soft);color:var(--accent);border-color:#B5D4F0}
"""

parts = []
parts.append(f"""<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>20分钟速学 · {total} 份单文件技术手册</title>
<meta name="description" content="{total} 份中文技术手册，每份 20 分钟读完。覆盖工程基础、底层原理、编程语言、数据存储、架构设计、运维云原生、安全、AI 工程与综合实战。纯静态 HTML，离线可用。">
<style>{css}</style>
</head>
<body>

<header class="hero">
  <div class="wrap">
    <div class="kicker">20 Minutes · Tech Notes</div>
    <h1>20分钟速学</h1>
    <p class="tagline">每份文档控制在 20 分钟读完，但<b>只讲能上手用的部分</b>：核心心智模型、关键命令、以及别人踩过的坑。全部是单文件 HTML，<b>不联网也能打开</b>。</p>
    <div class="stats">
      <div class="stat"><span class="n">{total}</span><span class="l">份文档</span></div>
      <div class="stat"><span class="n">9</span><span class="l">个分类</span></div>
      <div class="stat"><span class="n">20 min</span><span class="l">每篇时长</span></div>
      <div class="stat"><span class="n">0</span><span class="l">依赖 / 联网</span></div>
    </div>
    <div class="searchwrap">
      <input id="q" type="search" placeholder="搜索标题或关键词，如 redis、k8s、rAG、幂等、压测……" autocomplete="off">
      <div class="searchhint">共 {total} 篇 · 支持中英文与拼音首字母之外的任意关键词</div>
    </div>
  </div>
</header>

<main class="wrap">
<div id="results">
""")

for num, slug, name, desc, tagkind in CATS:
    tag, _ = TAGMAP[tagkind]
    parts.append(f"""
<section class="cat" data-cat="{num}">
  <div class="chead">
    <span class="cnum">{num}</span>
    <h2>{name}</h2>
    <span class="cpath">{num}-{slug}/</span>
  </div>
  <p class="cdesc">{desc}</p>
  <div class="list">
""")
    for fn, t, s in docs[num]:
        parts.append(f"""    <a class="item" href="{num}-{slug}/{fn}.html" data-title="{esc(t.lower())} {esc(s.lower())}">
      <span class="ep">{fn[:2] if fn[:2].isdigit() else '·'}</span>
      <span class="body"><span class="t">{esc(t)}</span><span class="d">{esc(s)}</span></span>
      {tag}
    </a>
""")
    parts.append("  </div>\n</section>\n")

parts.append("""
<section class="pathsec">
  <div class="chead"><h2>六条学习路径</h2></div>
  <p class="cdesc">不用按顺序全读。按你的方向选一条路径，每类挑最相关的 2~3 份开始。</p>
  <div class="paths">
""")
for pt, pd in PATHS:
    parts.append(f'    <div class="path"><div class="pt">{pt}</div><div class="pd">{pd}</div></div>\n')
parts.append("""  </div>
</section>

<div class="nomatch" id="nomatch">没有匹配的文档，换个关键词试试。</div>
</div>
</main>

<footer>
  <p>20分钟速学 · 全部文档为单文件 HTML · 可离线阅读 · 建议配合目录 CATALOG.md 使用</p>
</footer>

<script>
var q = document.getElementById('q');
var items = Array.prototype.slice.call(document.querySelectorAll('.item'));
var cats = Array.prototype.slice.call(document.querySelectorAll('.cat'));
var nomatch = document.getElementById('nomatch');
q.addEventListener('input', function () {
  var v = q.value.trim().toLowerCase();
  var shown = 0;
  items.forEach(function (it) {
    var hit = !v || it.getAttribute('data-title').indexOf(v) !== -1;
    it.style.display = hit ? '' : 'none';
    if (hit) shown++;
  });
  cats.forEach(function (c) {
    var any = Array.prototype.slice.call(c.querySelectorAll('.item')).some(function (it) { return it.style.display !== 'none'; });
    c.style.display = any ? '' : 'none';
  });
  nomatch.style.display = shown ? 'none' : 'block';
});
</script>
</body>
</html>
""")

out = os.path.join(BASE, "index.html")
open(out, "w", encoding="utf-8").write("".join(parts))
print(f"index.html rebuilt: {total} docs, {os.path.getsize(out)} bytes")
