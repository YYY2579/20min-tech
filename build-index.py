#!/usr/bin/env python3
"""生成 index.html 主页（v3 行式目录版）。
用法: python build-index.py  (在 20分钟速学 目录下运行)
设计：顶部重点推荐（4 篇大卡）→ 分类筛选 → 分组行式目录（高密度、易扫读）。
"""
import os, re, html

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

# 重点推荐（编辑精选）：path, 推荐标签, 推荐语
FEATURED = [
    ("09-practice/build-deployable-system.html", "一条龙实战", "从裸机到上线的完整链路：系统、网络、部署、监控一篇打通，运维 + 架构 + 开发的交汇点。"),
    ("05-architecture/system-design-cases.html", "面试常备", "短链 / 秒杀 / 排行榜三个高频题，从需求分析到容量估算完整走一遍，直接套用。"),
    ("08-ai/llm-app-dev.html", "当前最热", "RAG、Agent、模型网关、成本控制——AI 应用落地的全景地图，先看这篇再决定深入哪。"),
    ("04-data/redis.html", "后端必备", "缓存三大问题、一致性策略、分布式锁。线上事故最高发的区域，20 分钟建立防线。"),
]

TAGCLS = {"dev": "dev", "ops": "ops", "arch": "arch", "ai": "ai"}

def extract(path):
    h = open(path, encoding="utf-8").read()
    t = re.search(r"<h1>(.*?)</h1>", h, re.S)
    s = re.search(r'<p class="sub">(.*?)</p>', h, re.S)
    title = html.unescape(re.sub(r"<[^>]+>", "", t.group(1)).strip()) if t else os.path.basename(path)[:-5]
    sub = re.sub(r"<[^>]+>", "", s.group(1)).strip() if s else ""
    sub = html.unescape(re.sub(r"\s+", " ", sub))
    return title, sub

def esc(s):
    return s.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;").replace('"', "&quot;")

# 收集全部文档
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

# 重点推荐卡
feat_html = []
for path, badge, why in FEATURED:
    assert os.path.exists(os.path.join(BASE, path)), path
    t, s = extract(os.path.join(BASE, path))
    feat_html.append(f'''    <a class="fcard" href="{path}">
      <span class="fbar"></span>
      <span class="fbadge">{badge}</span>
      <span class="ft">{esc(t)}</span>
      <span class="fd">{esc(why)}</span>
      <span class="fmeta">20 min · 6 自测 · 速查卡</span>
      <span class="fgo">开始读 →</span>
    </a>''')

def chips():
    out = [f'<button class="chip active" data-cat="all">全部 <span class="cn">{total}</span></button>']
    for num, slug, name, desc, _ in CATS:
        out.append(f'<button class="chip" data-cat="{num}">{name} <span class="cn">{len(docs[num])}</span></button>')
    return "\n      ".join(out)

def groups():
    out = []
    idx = 0
    for num, slug, name, desc, tagkind in CATS:
        out.append(f'''
  <section class="group" data-group="{num}">
    <div class="ghead">
      <span class="gnum">{num}</span>
      <span class="gname">{name}</span>
      <span class="gdesc">{esc(desc)}</span>
      <span class="gcount">{len(docs[num])} 篇</span>
    </div>''')
        for it in docs[num]:
            idx += 1
            s = it["s"]
            s = s[:70] + "…" if len(s) > 70 else s
            out.append(f'''    <a class="row" href="{num}-{slug}/{it['fn']}.html" data-cat="{num}" data-title="{esc(it['t'].lower())} {esc(it['s'].lower())}">
      <span class="rnum">{idx:03d}</span>
      <span class="rbody"><span class="rt">{esc(it['t'])}</span><span class="rd">{esc(s)}</span></span>
      <span class="rtag {TAGCLS[tagkind]}">{name}</span>
      <span class="rmin">20 min</span>
      <span class="rarr">→</span>
    </a>''')
        out.append("  </section>")
    return "\n".join(out)

PATHS = [
    ("后端工程师", "03 语言 → 04 数据 → 05 架构 → 09 实战", "dev"),
    ("运维 / SRE", "06 运维为主干，02 底层打底，09 三个平台收口", "ops"),
    ("架构师进阶", "05 架构 22 份主干，04 + 09 做案例印证", "arch"),
    ("AI 应用开发", "08 AI 全 22 份，配 04 向量数据库", "ai"),
    ("安全攻防", "07 安全 20 份按 OWASP 顺序，06 供应链收口", "ops"),
    ("面试冲刺", "每类挑「实战 / 深入 / 原理」篇目 + 09 系统设计题", "arch"),
]

def paths():
    return "\n".join(
        f'      <div class="path"><div class="pt">{pt}</div><div class="pd">{pd}</div><div class="pbar"><i class="{TAGCLS[k]}"></i></div></div>'
        for pt, pd, k in PATHS)

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
  --shadow-lg:0 2px 4px rgba(20,22,26,.05),0 14px 36px -14px rgba(20,22,26,.16);
}}
*{{box-sizing:border-box;margin:0;padding:0}}
html{{scroll-behavior:smooth}}
body{{background:var(--bg);color:var(--ink);font-family:system-ui,-apple-system,"Segoe UI","PingFang SC","Microsoft YaHei",sans-serif;font-size:15px;line-height:1.7;-webkit-font-smoothing:antialiased}}
a{{color:inherit}}
button{{font-family:inherit}}

/* ---------- 吸顶导航 ---------- */
.topbar{{position:sticky;top:0;z-index:50;background:rgba(255,255,255,.88);backdrop-filter:blur(12px);border-bottom:1px solid var(--line)}}
.topbar .in{{max-width:1080px;margin:0 auto;padding:0 24px;height:56px;display:flex;align-items:center;gap:20px}}
.brand{{font-weight:700;font-size:16px;letter-spacing:-.2px;display:flex;align-items:center;gap:9px;text-decoration:none;white-space:nowrap}}
.brand .logo{{width:26px;height:26px;border-radius:8px;background:linear-gradient(135deg,var(--accent),#7B5CFF);display:flex;align-items:center;justify-content:center;color:#fff;font-size:12px;font-weight:800}}
.topnav{{display:flex;gap:4px;margin-left:auto}}
.topnav a{{font-size:13px;color:var(--muted);text-decoration:none;padding:6px 11px;border-radius:8px;transition:.15s;white-space:nowrap}}
.topnav a:hover{{color:var(--ink);background:var(--line2)}}
.topsearch{{display:flex;align-items:center;gap:8px;background:var(--bg);border:1px solid var(--line);border-radius:10px;padding:7px 12px;width:230px;transition:.15s}}
.topsearch:focus-within{{border-color:var(--accent);background:#fff;box-shadow:0 0 0 3px var(--accent-soft)}}
.topsearch input{{border:0;outline:0;background:transparent;font-size:13.5px;width:100%;color:var(--ink)}}
.topsearch .kbd{{font-size:11px;color:var(--faint);border:1px solid var(--line);border-radius:5px;padding:1px 6px;background:#fff}}

/* ---------- Hero ---------- */
.hero{{padding:56px 24px 36px;max-width:1080px;margin:0 auto}}
.kicker{{display:inline-flex;align-items:center;gap:8px;font-size:12.5px;font-weight:600;letter-spacing:.8px;color:var(--accent-deep);background:var(--accent-soft);border:1px solid #D6E2FF;padding:5px 13px;border-radius:999px;margin-bottom:18px}}
h1{{font-size:clamp(32px,4.6vw,46px);font-weight:800;letter-spacing:-1.4px;line-height:1.14}}
h1 .grad{{background:linear-gradient(120deg,var(--accent) 10%,#7B5CFF 90%);-webkit-background-clip:text;background-clip:text;color:transparent}}
.tagline{{color:var(--muted);margin-top:14px;font-size:16px;max-width:640px}}
.tagline b{{color:var(--ink);font-weight:600}}
.stats{{display:flex;gap:10px;flex-wrap:wrap;margin-top:24px}}
.stat{{background:var(--card);border:1px solid var(--line);border-radius:11px;padding:10px 18px;min-width:96px}}
.stat .n{{font-size:22px;font-weight:700;color:var(--accent-deep);font-variant-numeric:tabular-nums;line-height:1.2}}
.stat .l{{font-size:12px;color:var(--faint);margin-top:1px}}

/* ---------- 重点推荐 ---------- */
.feature{{max-width:1080px;margin:6px auto 0;padding:0 24px}}
.fhead{{display:flex;align-items:baseline;gap:10px;margin-bottom:14px}}
.fhead h2{{font-size:18px;font-weight:700;letter-spacing:-.3px}}
.fhead small{{font-size:12.5px;color:var(--faint)}}
.fgrid{{display:grid;grid-template-columns:1fr 1fr;gap:12px}}
.fcard{{background:var(--card);border:1px solid var(--line);border-radius:var(--radius);padding:18px 20px 15px 24px;text-decoration:none;display:flex;flex-direction:column;gap:7px;position:relative;overflow:hidden;transition:.16s}}
.fcard:hover{{transform:translateY(-2px);box-shadow:var(--shadow-lg);border-color:#D4DAE3}}
.fcard:focus-visible{{outline:2px solid var(--accent);outline-offset:2px}}
.fbar{{position:absolute;left:0;top:0;bottom:0;width:4px;background:linear-gradient(180deg,var(--accent),#7B5CFF)}}
.fbadge{{align-self:flex-start;font-size:11px;font-weight:700;color:var(--accent-deep);background:var(--accent-soft);border:1px solid #D6E2FF;padding:2.5px 10px;border-radius:999px;letter-spacing:.3px}}
.ft{{font-size:17px;font-weight:700;letter-spacing:-.3px;line-height:1.4}}
.fd{{font-size:13.5px;color:var(--muted);line-height:1.65}}
.fmeta{{font-size:11.5px;color:var(--faint);margin-top:2px}}
.fgo{{font-size:13px;font-weight:600;color:var(--accent);margin-top:6px}}
.fcard:hover .fgo{{color:var(--accent-deep)}}

/* ---------- 工具栏 ---------- */
.toolbar{{position:sticky;top:56px;z-index:40;background:rgba(246,247,249,.92);backdrop-filter:blur(10px);padding:13px 24px;border-bottom:1px solid var(--line);margin-top:34px}}
.toolbar .in{{max-width:1080px;margin:0 auto;display:flex;align-items:center;gap:10px;flex-wrap:wrap}}
.chips{{display:flex;gap:7px;flex-wrap:wrap}}
.chip{{border:1px solid var(--line);background:var(--card);color:var(--muted);font-size:13px;padding:6px 13px;border-radius:999px;cursor:pointer;transition:.15s;display:inline-flex;align-items:center;gap:6px}}
.chip:hover{{border-color:#C9D2E0;color:var(--ink)}}
.chip.active{{background:var(--ink);border-color:var(--ink);color:#fff}}
.chip .cn{{font-size:11.5px;opacity:.65;font-variant-numeric:tabular-nums}}
.tools{{margin-left:auto;display:flex;gap:8px;align-items:center}}
.btn{{display:inline-flex;align-items:center;gap:6px;border:1px solid var(--line);background:var(--card);color:var(--muted);font-size:13px;padding:6px 13px;border-radius:9px;cursor:pointer;transition:.15s}}
.btn:hover{{color:var(--ink);border-color:#C9D2E0}}
.count{{font-size:12.5px;color:var(--faint);font-variant-numeric:tabular-nums;white-space:nowrap}}

/* ---------- 行式目录 ---------- */
main{{max-width:1080px;margin:0 auto;padding:8px 24px 10px}}
.group{{margin-top:22px}}
.ghead{{display:flex;align-items:baseline;gap:10px;padding:8px 4px;border-bottom:1px solid var(--line);position:sticky;top:102px;background:rgba(246,247,249,.94);backdrop-filter:blur(8px);z-index:30}}
.gnum{{font-size:11px;font-weight:700;color:var(--accent-deep);background:var(--accent-soft);border-radius:6px;padding:2px 7px;font-variant-numeric:tabular-nums}}
.gname{{font-size:15.5px;font-weight:700;letter-spacing:-.2px}}
.gdesc{{font-size:12.5px;color:var(--faint);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;flex:1;min-width:0}}
.gcount{{font-size:12px;color:var(--faint);font-variant-numeric:tabular-nums;white-space:nowrap}}
.rows{{display:flex;flex-direction:column}}
.row{{display:flex;align-items:center;gap:14px;padding:9px 12px;border-radius:10px;text-decoration:none;transition:background .12s,box-shadow .12s;border-bottom:1px solid var(--line2)}}
.rows .row:last-child{{border-bottom:0}}
.row:hover{{background:var(--card);box-shadow:var(--shadow)}}
.row:focus-visible{{outline:2px solid var(--accent);outline-offset:-1px}}
.rnum{{flex:none;width:30px;font-size:11.5px;font-weight:700;color:var(--faint);font-variant-numeric:tabular-nums;text-align:right}}
.rbody{{flex:1;min-width:0;display:flex;flex-direction:column}}
.rt{{font-size:14.5px;font-weight:600;letter-spacing:-.1px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}}
.rd{{font-size:12.5px;color:var(--muted);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;margin-top:1px}}
.rtag{{flex:none;font-size:11px;font-weight:600;padding:2px 9px;border-radius:999px;border:1px solid}}
.rtag.dev{{background:var(--accent-soft);color:var(--accent-deep);border-color:#D6E2FF}}
.rtag.ops{{background:var(--ok-soft);color:var(--ok);border-color:#BFE8DB}}
.rtag.arch{{background:var(--violet-soft);color:var(--violet);border-color:#DCD4F8}}
.rtag.ai{{background:var(--warn-soft);color:var(--warn);border-color:#F0DCB4}}
.rmin{{flex:none;font-size:11.5px;color:var(--faint);font-variant-numeric:tabular-nums}}
.rarr{{flex:none;width:16px;color:var(--accent);opacity:0;transform:translateX(-4px);transition:.15s;font-weight:700}}
.row:hover .rarr{{opacity:1;transform:none}}
.empty{{display:none;text-align:center;padding:64px 0 80px;color:var(--faint)}}
.empty .big{{font-size:38px;margin-bottom:10px}}
.empty .t{{font-size:14.5px;color:var(--muted)}}

/* ---------- 学习路径 ---------- */
.paths{{max-width:1080px;margin:36px auto 0;padding:0 24px}}
.paths h2{{font-size:18px;font-weight:700;letter-spacing:-.3px;display:flex;align-items:baseline;gap:10px}}
.paths h2 small{{font-size:12.5px;color:var(--faint);font-weight:500}}
.pgrid{{display:grid;grid-template-columns:repeat(auto-fit,minmax(270px,1fr));gap:12px;margin-top:14px}}
.path{{background:var(--card);border:1px solid var(--line);border-radius:12px;padding:15px 17px 13px;transition:.15s}}
.path:hover{{border-color:#D4DAE3;box-shadow:var(--shadow)}}
.path .pt{{font-size:14px;font-weight:650}}
.path .pd{{font-size:12.5px;color:var(--muted);margin-top:4px;line-height:1.6}}
.path .pbar{{height:4px;border-radius:99px;background:var(--line2);margin-top:11px;overflow:hidden}}
.path .pbar i{{display:block;height:100%;width:38%;border-radius:99px}}
.path .pbar i.dev{{background:var(--accent)}}
.path .pbar i.ops{{background:var(--ok)}}
.path .pbar i.arch{{background:var(--violet)}}
.path .pbar i.ai{{background:#D99A06}}

footer{{max-width:1080px;margin:52px auto 0;padding:24px 24px 56px;border-top:1px solid var(--line);color:var(--faint);font-size:13px;display:flex;flex-wrap:wrap;gap:8px 24px;align-items:center}}
footer .sep{{flex:1}}
footer a{{color:var(--muted);text-decoration:none}}
footer a:hover{{color:var(--accent)}}

@media(max-width:860px){{
  .topsearch{{width:170px}}
  .topnav{{display:none}}
  .fgrid{{grid-template-columns:1fr}}
}}
@media(max-width:640px){{
  .hero{{padding:40px 18px 26px}}
  .feature,.paths{{padding:0 18px}}
  .toolbar{{padding:12px 18px}}
  main{{padding:8px 18px 10px}}
  .tools{{margin-left:0;width:100%;justify-content:space-between}}
  .gdesc{{display:none}}
  .ghead{{top:99px}}
  .row{{gap:10px;padding:9px 8px}}
  .rtag{{display:none}}
}}
</style>
</head>
<body>

<header class="topbar">
  <div class="in">
    <a class="brand" href="#top"><span class="logo">20</span>分钟速学</a>
    <nav class="topnav">
      <a href="#feature">重点推荐</a>
      <a href="#docs">全部文档</a>
      <a href="#paths">学习路径</a>
      <a href="CATALOG.md">目录</a>
    </nav>
    <label class="topsearch">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" style="color:var(--faint);flex:none"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>
      <input id="qtop" type="search" placeholder="搜索 {total} 篇…" autocomplete="off">
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

<section class="feature" id="feature">
  <div class="fhead"><h2>重点推荐</h2><small>时间有限的话，先读这 4 篇</small></div>
  <div class="fgrid">
{chr(10).join(feat_html)}
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
{groups()}
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
  <a href="CATALOG.md">完整目录 CATALOG.md</a>
  <a href="https://github.com/YYY2579/20min-tech">GitHub 仓库</a>
</footer>

<script>
(function () {{
  var rows = Array.prototype.slice.call(document.querySelectorAll('.row'));
  var chips = Array.prototype.slice.call(document.querySelectorAll('.chip'));
  var groups = Array.prototype.slice.call(document.querySelectorAll('.group'));
  var count = document.getElementById('count');
  var empty = document.getElementById('empty');
  var main = document.querySelector('main');
  var input = document.getElementById('qtop');
  var cat = 'all';

  function apply() {{
    var v = (input.value || '').trim().toLowerCase();
    var shown = 0;
    rows.forEach(function (r) {{
      var hit = (!v || r.getAttribute('data-title').indexOf(v) !== -1) && (cat === 'all' || r.getAttribute('data-cat') === cat);
      r.style.display = hit ? '' : 'none';
      if (hit) shown++;
    }});
    groups.forEach(function (g) {{
      var any = Array.prototype.slice.call(g.querySelectorAll('.row')).some(function (r) {{ return r.style.display !== 'none'; }});
      g.style.display = any ? '' : 'none';
    }});
    count.textContent = shown + ' / {total} 篇';
    empty.style.display = shown ? 'none' : 'block';
    main.style.display = shown ? '' : 'none';
  }}

  chips.forEach(function (ch) {{
    ch.addEventListener('click', function () {{
      chips.forEach(function (x) {{ x.classList.remove('active'); }});
      ch.classList.add('active');
      cat = ch.getAttribute('data-cat');
      apply();
    }});
  }});

  input.addEventListener('input', apply);

  document.getElementById('shuffle').addEventListener('click', function () {{
    var vis = rows.filter(function (r) {{ return r.style.display !== 'none'; }});
    if (!vis.length) return;
    location.href = vis[Math.floor(Math.random() * vis.length)].getAttribute('href');
  }});

  document.addEventListener('keydown', function (e) {{
    if (e.key === '/' && document.activeElement !== input) {{
      e.preventDefault();
      input.focus();
    }}
    if (e.key === 'Escape' && document.activeElement === input) input.blur();
  }});

  apply();
}})();
</script>
</body>
</html>
'''

out = os.path.join(BASE, "index.html")
open(out, "w", encoding="utf-8").write(HTML)
print(f"index.html v3 built: {total} docs, {os.path.getsize(out)} bytes")
