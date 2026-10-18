#!/usr/bin/env python3
"""生成 index.html 主页（v2 学习站点版式）。
用法: python build-index.py  (在 20分钟速学 目录下运行)
从各分类目录的文档提取 <h1> 标题与 .sub 副标题，生成带搜索/筛选/卡片网格的主页。
"""
import os, re, html, random

BASE = os.path.dirname(os.path.abspath(__file__))

CATS = [
    ("01", "fundamentals", "工程基础", "语言无关的硬功夫：命令行、Git、调试、测试、Shell、正则。", "dev"),
    ("02", "lowlevel", "底层原理", "操作系统、CPU、内存、编译链接、并发、内核追踪。排障直觉的来源。", "arch"),
    ("03", "languages", "编程语言", "Python、Java、Go、Rust、C/C++、JS/TS、Kotlin、Swift、PHP、Node、Vue，加 SQL 与运行时对比。", "dev"),
    ("04", "data", "数据与存储", "关系库、NoSQL、NewSQL、消息队列、搜索、分库分表、数仓、备份迁移。事故重灾区。", "dev"),
    ("05", "architecture", "架构与设计", "分布式、高并发、缓存、一致性、幂等限流、多活容灾、DDD、遗留改造。", "arch"),
    ("06", "devops", "运维与云原生", "Docker、K8s、可观测性、CI/CD、IaC、Helm、Istio、GitOps、Vault、SRE。", "ops"),
    ("07", "security", "安全", "注入、XSS/CSRF、认证、密码学、供应链、云安全、渗透、应急、等保。", "ops"),
    ("08", "ai", "AI 工程", "大模型应用、RAG、Agent、微调、评估、多模态、语音、图像生成、成本。", "ai"),
    ("09", "practice", "综合实战", "电商、秒杀、IM、支付、直播、权限、监控、日志、CI 平台等 22 个系统设计实战。", "arch"),
]

TAGCLS = {"dev": "dev", "ops": "ops", "arch": "arch", "ai": "ai"}

def extract(path):
    h = open(path, encoding="utf-8").read()
    t = re.search(r"<h1>(.*?)</h1>", h, re.S)
    s = re.search(r'<p class="sub">(.*?)</p>', h, re.S)
    title = html.unescape(re.sub(r"<[^>]+>", "", t.group(1)).strip()) if t else os.path.basename(path)[:-5]
    title = re.sub(r"^(二十分钟|20分钟)", "", title).strip(" ·:：") or title
    sub = re.sub(r"<[^>]+>", "", s.group(1)).strip() if s else ""
    sub = html.unescape(re.sub(r"\s+", " ", sub))
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
            items.append({"fn": fn[:-5], "t": t, "s": s})
            total += 1
    docs[num] = items

PATHS = [
    ("后端工程师", "03 语言 → 04 数据 → 05 架构 → 09 实战", "dev"),
    ("运维 / SRE", "06 运维为主干，02 底层打底，09 三个平台收口", "ops"),
    ("架构师进阶", "05 架构 22 份主干，04 + 09 做案例印证", "arch"),
    ("AI 应用开发", "08 AI 全 22 份，配 04 向量数据库", "ai"),
    ("安全攻防", "07 安全 20 份按 OWASP 顺序，06 供应链收口", "ops"),
    ("面试冲刺", "每类挑「实战 / 深入 / 原理」篇目 + 09 系统设计题", "arch"),
]

def chips():
    out = ['<button class="chip active" data-cat="all">全部 <span class="cn">%d</span></button>' % total]
    for num, slug, name, desc, _ in CATS:
        out.append(f'<button class="chip" data-cat="{num}">{name} <span class="cn">{len(docs[num])}</span></button>')
    return "\n      ".join(out)

def cards():
    out = []
    idx = 0
    for num, slug, name, desc, tagkind in CATS:
        for it in docs[num]:
            idx += 1
            s = it["s"]
            s = s[:64] + "…" if len(s) > 64 else s
            out.append(f'''      <a class="card" href="{num}-{slug}/{it['fn']}.html" data-cat="{num}" data-title="{esc(it['t'].lower())} {esc(it['s'].lower())}">
        <span class="cnum">{idx:03d}</span>
        <span class="ct">{esc(it['t'])}</span>
        <span class="cd">{esc(s)}</span>
        <span class="cmeta"><span class="ctag {TAGCLS[tagkind]}">{name}</span><span class="cmin">20 min</span></span>
      </a>''')
    return "\n".join(out)

def paths():
    out = []
    for pt, pd, kind in PATHS:
        out.append(f'''      <div class="path">
        <div class="pt">{pt}</div>
        <div class="pd">{pd}</div>
        <div class="pbar"><i class="{TAGCLS[kind]}"></i></div>
      </div>''')
    return "\n".join(out)

HTML = f'''<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>20分钟速学 · {total} 份单文件技术手册</title>
<meta name="description" content="{total} 份中文技术速学手册，每份 20 分钟读完。覆盖工程基础、底层原理、编程语言、数据存储、架构设计、运维云原生、安全、AI 工程与综合实战。纯静态 HTML，离线可用。">
<style>
:root{{
  --bg:#F6F7F9; --card:#FFFFFF; --ink:#14161A; --muted:#5C6470; --faint:#8A93A0;
  --line:#E5E8EC; --line2:#EDEFF3;
  --accent:#2E5BFF; --accent-deep:#1E40D6; --accent-soft:#EDF2FF;
  --ok:#0E7A5F; --ok-soft:#E6F5F0;
  --warn:#9A5B00; --warn-soft:#FBF0DC;
  --violet:#6A4FD0; --violet-soft:#F0ECFC;
  --radius:14px;
  --shadow:0 1px 2px rgba(20,22,26,.04),0 8px 24px -12px rgba(20,22,26,.08);
  --shadow-lg:0 2px 4px rgba(20,22,26,.04),0 16px 40px -16px rgba(20,22,26,.14);
}}
*{{box-sizing:border-box;margin:0;padding:0}}
html{{scroll-behavior:smooth}}
body{{background:var(--bg);color:var(--ink);font-family:system-ui,-apple-system,"Segoe UI","PingFang SC","Microsoft YaHei",sans-serif;font-size:15px;line-height:1.7;-webkit-font-smoothing:antialiased}}
code,.mono{{font-family:ui-monospace,"Cascadia Code",Consolas,monospace}}
a{{color:inherit}}
button{{font-family:inherit}}

/* ---------- 顶栏 ---------- */
.topbar{{position:sticky;top:0;z-index:50;background:rgba(255,255,255,.86);backdrop-filter:blur(12px);border-bottom:1px solid var(--line)}}
.topbar .in{{max-width:1180px;margin:0 auto;padding:0 24px;height:56px;display:flex;align-items:center;gap:20px}}
.brand{{font-weight:700;font-size:16px;letter-spacing:-.2px;display:flex;align-items:center;gap:9px;text-decoration:none;white-space:nowrap}}
.brand .logo{{width:26px;height:26px;border-radius:8px;background:linear-gradient(135deg,var(--accent),#7B5CFF);display:flex;align-items:center;justify-content:center;color:#fff;font-size:12px;font-weight:800}}
.topnav{{display:flex;gap:4px;margin-left:auto;flex-wrap:wrap}}
.topnav a{{font-size:13px;color:var(--muted);text-decoration:none;padding:6px 11px;border-radius:8px;transition:.15s;white-space:nowrap}}
.topnav a:hover{{color:var(--ink);background:var(--line2)}}
.topsearch{{display:flex;align-items:center;gap:8px;background:var(--bg);border:1px solid var(--line);border-radius:10px;padding:7px 12px;width:240px;transition:.15s}}
.topsearch:focus-within{{border-color:var(--accent);background:#fff;box-shadow:0 0 0 3px var(--accent-soft)}}
.topsearch input{{border:0;outline:0;background:transparent;font-size:13.5px;width:100%;color:var(--ink)}}
.topsearch .kbd{{font-size:11px;color:var(--faint);border:1px solid var(--line);border-radius:5px;padding:1px 6px;background:#fff;white-space:nowrap}}

/* ---------- Hero ---------- */
.hero{{padding:64px 24px 44px;max-width:1180px;margin:0 auto}}
.kicker{{display:inline-flex;align-items:center;gap:8px;font-size:12.5px;font-weight:600;letter-spacing:.8px;color:var(--accent-deep);background:var(--accent-soft);border:1px solid #D6E2FF;padding:5px 13px;border-radius:999px;margin-bottom:20px}}
h1{{font-size:clamp(34px,5vw,52px);font-weight:800;letter-spacing:-1.5px;line-height:1.12}}
h1 .grad{{background:linear-gradient(120deg,var(--accent) 10%,#7B5CFF 90%);-webkit-background-clip:text;background-clip:text;color:transparent}}
.tagline{{color:var(--muted);margin-top:16px;font-size:16.5px;max-width:660px}}
.tagline b{{color:var(--ink);font-weight:600}}
.stats{{display:flex;gap:12px;flex-wrap:wrap;margin-top:28px}}
.stat{{background:var(--card);border:1px solid var(--line);border-radius:12px;padding:12px 20px;min-width:104px}}
.stat .n{{font-size:24px;font-weight:700;color:var(--accent-deep);font-variant-numeric:tabular-nums;line-height:1.2}}
.stat .l{{font-size:12.5px;color:var(--faint);margin-top:2px}}

/* ---------- 工具栏 ---------- */
.toolbar{{position:sticky;top:56px;z-index:40;background:rgba(246,247,249,.92);backdrop-filter:blur(10px);padding:14px 24px;border-bottom:1px solid var(--line)}}
.toolbar .in{{max-width:1180px;margin:0 auto;display:flex;align-items:center;gap:10px;flex-wrap:wrap}}
.chips{{display:flex;gap:8px;flex-wrap:wrap}}
.chip{{border:1px solid var(--line);background:var(--card);color:var(--muted);font-size:13px;padding:7px 14px;border-radius:999px;cursor:pointer;transition:.15s;display:inline-flex;align-items:center;gap:6px}}
.chip:hover{{border-color:#C9D2E0;color:var(--ink)}}
.chip.active{{background:var(--ink);border-color:var(--ink);color:#fff}}
.chip .cn{{font-size:11.5px;opacity:.65;font-variant-numeric:tabular-nums}}
.tools{{margin-left:auto;display:flex;gap:8px;align-items:center}}
.btn{{display:inline-flex;align-items:center;gap:6px;border:1px solid var(--line);background:var(--card);color:var(--muted);font-size:13px;padding:7px 13px;border-radius:9px;cursor:pointer;transition:.15s;text-decoration:none}}
.btn:hover{{color:var(--ink);border-color:#C9D2E0}}
.btn.primary{{background:var(--accent);border-color:var(--accent);color:#fff}}
.btn.primary:hover{{background:var(--accent-deep)}}
.count{{font-size:12.5px;color:var(--faint);font-variant-numeric:tabular-nums;white-space:nowrap}}

/* ---------- 卡片网格 ---------- */
main{{max-width:1180px;margin:0 auto;padding:28px 24px 10px}}
.grid{{display:grid;grid-template-columns:repeat(auto-fill,minmax(258px,1fr));gap:14px}}
.card{{background:var(--card);border:1px solid var(--line);border-radius:var(--radius);padding:18px 18px 15px;text-decoration:none;display:flex;flex-direction:column;gap:8px;min-height:148px;transition:transform .15s,box-shadow .15s,border-color .15s;position:relative;overflow:hidden}}
.card::before{{content:"";position:absolute;inset:0 0 auto 0;height:3px;background:linear-gradient(90deg,var(--accent),#7B5CFF);opacity:0;transition:.15s}}
.card:hover{{transform:translateY(-3px);box-shadow:var(--shadow-lg);border-color:#D4DAE3}}
.card:hover::before{{opacity:1}}
.card:focus-visible{{outline:2px solid var(--accent);outline-offset:2px}}
.cnum{{font-size:11.5px;font-weight:700;color:var(--faint);font-variant-numeric:tabular-nums;letter-spacing:.5px}}
.ct{{font-size:15.5px;font-weight:650;line-height:1.45;letter-spacing:-.2px}}
.cd{{font-size:13px;color:var(--muted);line-height:1.6;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}}
.cmeta{{margin-top:auto;display:flex;align-items:center;gap:8px;padding-top:6px}}
.ctag{{font-size:11px;font-weight:600;padding:2.5px 9px;border-radius:999px;border:1px solid}}
.ctag.dev{{background:var(--accent-soft);color:var(--accent-deep);border-color:#D6E2FF}}
.ctag.ops{{background:var(--ok-soft);color:var(--ok);border-color:#BFE8DB}}
.ctag.arch{{background:var(--violet-soft);color:var(--violet);border-color:#DCD4F8}}
.ctag.ai{{background:var(--warn-soft);color:var(--warn);border-color:#F0DCB4}}
.cmin{{font-size:11.5px;color:var(--faint);margin-left:auto;font-variant-numeric:tabular-nums}}
.empty{{display:none;text-align:center;padding:70px 0 90px;color:var(--faint)}}
.empty .big{{font-size:40px;margin-bottom:10px}}
.empty .t{{font-size:15px;color:var(--muted)}}

/* ---------- 学习路径 ---------- */
.paths{{max-width:1180px;margin:34px auto 0;padding:0 24px}}
.paths h2{{font-size:19px;font-weight:700;letter-spacing:-.3px;display:flex;align-items:baseline;gap:10px}}
.paths h2 small{{font-size:12.5px;color:var(--faint);font-weight:500}}
.pgrid{{display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:12px;margin-top:16px}}
.path{{background:var(--card);border:1px solid var(--line);border-radius:12px;padding:16px 18px 14px;transition:.15s}}
.path:hover{{border-color:#D4DAE3;box-shadow:var(--shadow)}}
.path .pt{{font-size:14.5px;font-weight:650}}
.path .pd{{font-size:12.8px;color:var(--muted);margin-top:5px;line-height:1.65}}
.path .pbar{{height:4px;border-radius:99px;background:var(--line2);margin-top:12px;overflow:hidden}}
.path .pbar i{{display:block;height:100%;width:38%;border-radius:99px}}
.path .pbar i.dev{{background:var(--accent)}}
.path .pbar i.ops{{background:var(--ok)}}
.path .pbar i.arch{{background:var(--violet)}}
.path .pbar i.ai{{background:#D99A06}}

footer{{max-width:1180px;margin:56px auto 0;padding:26px 24px 60px;border-top:1px solid var(--line);color:var(--faint);font-size:13px;display:flex;flex-wrap:wrap;gap:8px 24px;align-items:center}}
footer .sep{{flex:1}}

@media(max-width:860px){{
  .topsearch{{width:180px}}
  .topnav{{display:none}}
}}
@media(max-width:640px){{
  .hero{{padding:44px 18px 30px}}
  .toolbar{{padding:12px 18px}}
  main,.paths{{padding-left:18px;padding-right:18px}}
  .grid{{grid-template-columns:1fr}}
  .tools{{margin-left:0;width:100%;justify-content:space-between}}
  .topsearch{{width:150px}}
}}
</style>
</head>
<body>

<header class="topbar">
  <div class="in">
    <a class="brand" href="#top"><span class="logo">20</span>分钟速学</a>
    <nav class="topnav">
      <a href="#docs">全部文档</a>
      <a href="#paths">学习路径</a>
      <a href="CATALOG.md">目录</a>
    </nav>
    <label class="topsearch">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" style="color:var(--faint);flex:none"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>
      <input id="qtop" type="search" placeholder="搜索 198 篇…" autocomplete="off">
      <span class="kbd">/</span>
    </label>
  </div>
</header>

<section class="hero" id="top">
  <span class="kicker">20 MINUTES · TECH NOTES</span>
  <h1>每个技术点，<br>只用 <span class="grad">20 分钟</span>学到位。</h1>
  <p class="tagline">不讲入门科普，只讲<b>能上手用的部分</b>：核心心智模型、关键命令、真实踩坑。{total} 份单文件 HTML，<b>不联网也能打开</b>，自带计时器和自测题。</p>
  <div class="stats">
    <div class="stat"><span class="n">{total}</span><span class="l">份文档</span></div>
    <div class="stat"><span class="n">9</span><span class="l">大分类</span></div>
    <div class="stat"><span class="n">20 min</span><span class="l">每篇时长</span></div>
    <div class="stat"><span class="n">6</span><span class="l">自测题 / 篇</span></div>
    <div class="stat"><span class="n">0</span><span class="l">依赖 · 可离线</span></div>
  </div>
</section>

<div class="toolbar" id="docs">
  <div class="in">
    <div class="chips">
      {chips()}
    </div>
    <div class="tools">
      <span class="count" id="count"></span>
      <button class="btn" id="shuffle" title="随机打开一篇">🎲 随机一篇</button>
    </div>
  </div>
</div>

<main>
  <div class="grid" id="grid">
{cards()}
  </div>
  <div class="empty" id="empty">
    <div class="big">🔍</div>
    <div class="t">没有匹配的文档，换个关键词或分类试试</div>
  </div>
</main>

<section class="paths" id="paths">
  <h2>六条学习路径 <small>不用按顺序全读，选一条和你方向相关的</small></h2>
  <div class="pgrid">
{paths()}
  </div>
</section>

<footer>
  <span>20分钟速学 · 单文件 HTML · 可离线阅读</span>
  <span class="sep"></span>
  <a href="CATALOG.md" style="color:var(--muted)">完整目录 CATALOG.md</a>
  <a href="https://github.com/YYY2579/20min-tech" style="color:var(--muted)">GitHub 仓库</a>
</footer>

<script>
(function () {{
  var cards = Array.prototype.slice.call(document.querySelectorAll('.card'));
  var chips = Array.prototype.slice.call(document.querySelectorAll('.chip'));
  var count = document.getElementById('count');
  var empty = document.getElementById('empty');
  var grid = document.getElementById('grid');
  var inputs = [document.getElementById('qtop')];
  var cat = 'all';

  function esc(s) {{ return s.replace(/[.*+?^${{}}()|[\\]\\\\]/g, '\\\\$&'); }}

  function apply() {{
    var v = (inputs[0].value || '').trim().toLowerCase();
    var shown = [];
    cards.forEach(function (c) {{
      var hit = (!v || c.getAttribute('data-title').indexOf(v) !== -1) && (cat === 'all' || c.getAttribute('data-cat') === cat);
      c.style.display = hit ? '' : 'none';
      if (hit) shown.push(c);
    }});
    count.textContent = shown.length + ' / {total} 篇';
    empty.style.display = shown.length ? 'none' : 'block';
    grid.style.display = shown.length ? '' : 'none';
  }}

  chips.forEach(function (ch) {{
    ch.addEventListener('click', function () {{
      chips.forEach(function (x) {{ x.classList.remove('active'); }});
      ch.classList.add('active');
      cat = ch.getAttribute('data-cat');
      apply();
    }});
  }});

  inputs[0].addEventListener('input', apply);

  document.getElementById('shuffle').addEventListener('click', function () {{
    var vis = cards.filter(function (c) {{ return c.style.display !== 'none'; }});
    if (!vis.length) return;
    var pick = vis[Math.floor(Math.random() * vis.length)];
    location.href = pick.getAttribute('href');
  }});

  // "/" 聚焦搜索
  document.addEventListener('keydown', function (e) {{
    if (e.key === '/' && document.activeElement !== inputs[0]) {{
      e.preventDefault();
      inputs[0].focus();
    }}
    if (e.key === 'Escape' && document.activeElement === inputs[0]) inputs[0].blur();
  }});

  apply();
}})();
</script>
</body>
</html>
'''

out = os.path.join(BASE, "index.html")
open(out, "w", encoding="utf-8").write(HTML)
print(f"index.html v2 built: {total} docs, {os.path.getsize(out)} bytes")
