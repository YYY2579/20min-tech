#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""生成求职冲刺专栏子站首页 10-interview/index.html。

用法: python build-column.py   (在 20分钟速学 目录下运行)
新增/删除文档后重跑本脚本即可，分组在 GROUPS 里配置。
"""
import os
import re
import html

BASE = os.path.dirname(os.path.abspath(__file__))
COL = os.path.join(BASE, '10-interview')

GROUPS = [
    ("先看这篇", "先花 20 分钟看清考什么，再决定后面 47 篇按什么顺序读。",
     ['01-battle-map']),
    ("技术地基", "Linux、网络、协议、IO。八股里命中率最高的一块，也是面试最先被问的。",
     ['02-linux-troubleshooting', '03-linux-commands', '04-os-io-model', '05-tcp',
      '06-network-troubleshoot', '07-dns-http-https']),
    ("容器与云原生", "Docker 与 K8s 的四个角度：原理、排障、网络、调度发布。",
     ['08-docker', '09-docker-troubleshoot', '10-k8s-core', '11-k8s-troubleshoot',
      '12-k8s-network', '13-k8s-scheduling']),
    ("可观测与告警", "指标、日志、告警这三条线，决定你能不能把「出事了」说清楚。",
     ['14-prometheus', '15-slo-alerting', '16-observability', '39-logging-stack']),
    ("数据与存储", "MySQL、Redis、数据库运维与 SQL 题，后端岗躲不掉。",
     ['17-mysql', '18-redis', '41-db-ops', '47-sql-interview']),
    ("架构与工程能力", "发布、系统设计、分布式、限流、自动化、中间件、演练、容量、安全。",
     ['19-cicd-release', '20-system-design-ops', '31-distributed-tx', '32-resilience',
      '37-ansible', '38-terraform-iac', '42-middleware-gateway', '43-service-mesh',
      '44-chaos-engineering', '45-capacity-loadtest', '46-network-security-ops']),
    ("表达与求职", "技术过线之后，决定 offer 的其实是这一块。",
     ['21-incident', '22-behavioral', '23-salary', '24-resume']),
    ("加练与笔试", "Shell、Nginx、Git、内核、LB、MQ、存储、容器安全、成本、JVM、AI 运维、笔试题。",
     ['25-shell-scripting', '26-nginx', '27-git', '28-linux-tuning', '29-load-balancing',
      '30-mq', '33-storage-fs', '34-container-security', '35-cloud-cost',
      '40-jvm-troubleshooting', '48-aiops', '36-written-test']),
]

GCOLORS = ['#2E5BFF','#0F766E','#6A4FD0','#B45309','#BE123C','#7C3AED','#0E7A5F','#C2410C']

FEATURED = [
    ('01-battle-map.html', '从这篇开始', '三层能力模型、高频题分布、30 天冲刺表。看完就知道剩下 47 篇读哪几篇。'),
    ('21-incident.html', '面试必问', '「讲一次你处理的事故」的前 5 分钟动作、复盘模板和三分钟逐字稿。'),
    ('11-k8s-troubleshoot.html', '技术必考', 'Pod 排障决策树：Pending / CrashLoop / OOM / Evicted 的判定顺序。'),
    ('15-slo-alerting.html', '区分度', 'SLO、错误预算、多窗口燃率——从「会配告警」到「知道为什么这么配」。'),
    ('22-behavioral.html', '软技能', '自我介绍、离职原因、压力面与反问环节，附正反话术对照。'),
    ('47-sql-interview.html', '真机验证', '30 道 SQL 题，所有语句在 MySQL 8 上跑通才写进文档。'),
]

PATHS = [
    ('两周后面试', '01 → 21 → 22 → 24，再按 JD 挑 3 个技术方向各读 2 篇', '#185FA5'),
    ('一个月后面试', '02~13 打地基（12 篇）→ 14~18 纵深 → 21~24 收口表达', '#0F6E56'),
    ('只想补技术', '02~20 全读，重点 05 / 08 / 11 / 14 / 17 / 18', '#534AB7'),
    ('转岗 / 长期补', '按顺序全读 48 篇，每篇配一次动手复现', '#854F0B'),
]


def meta(slug):
    h = open(os.path.join(COL, slug + '.html'), encoding='utf-8').read()
    t = re.search(r'<h1>(.*?)</h1>', h, re.S)
    s = re.search(r'<p class="sub">(.*?)</p>', h, re.S)
    title = html.unescape(re.sub(r'<[^>]+>', '', t.group(1)).strip()) if t else slug
    sub = re.sub(r'<[^>]+>', '', s.group(1)).strip() if s else ''
    sub = html.unescape(re.sub(r'\s+', ' ', sub))
    return title, sub


def esc(s):
    return s.replace('&', '&amp;').replace('<', '&lt;').replace('>', '&gt;').replace('"', '&quot;')


total = sum(len(g[2]) for g in GROUPS)

feat_html = []
for fn, badge, why in FEATURED:
    assert os.path.exists(os.path.join(COL, fn)), fn
    t, _ = meta(fn[:-5])
    feat_html.append(f'''      <a class="fcard" href="{fn}">
        <span class="fbar"></span>
        <span class="fbadge">{badge}</span>
        <span class="ft">{esc(t)}</span>
        <span class="fd">{esc(why)}</span>
        <span class="fgo">开始读 →</span>
      </a>''')

chips = [f'<button class="chip active" data-g="all">全部 <span class="cn">{total}</span></button>']
for i, (name, _desc, items) in enumerate(GROUPS):
    chips.append(f'<button class="chip" data-g="g{i}">{name} <span class="cn">{len(items)}</span></button>')

groups_html = []
idx = 0
for i, (name, desc, items) in enumerate(GROUPS):
    rows = []
    for slug in items:
        idx += 1
        t, s = meta(slug)
        rows.append(f'''      <a class="row" href="{slug}.html" data-g="g{i}" data-title="{esc(t.lower())} {esc(s.lower())}">
        <span class="rnum">{idx:02d}</span>
        <span class="rbody"><span class="rt">{esc(t)}</span><span class="rd">{esc(s)}</span></span>
        <span class="rmin">20 min</span>
        <span class="rarr">→</span>
      </a>''')
    groups_html.append(f'''    <section class="group" data-group="g{i}">
      <div class="ghead">
        <span class="gbar" style="background:{GCOLORS[i]}"></span>
        <span class="gname">{name}</span>
        <span class="gdesc">{esc(desc)}</span>
        <span class="gcount">{len(items)} 篇</span>
      </div>
      <div class="rows">
{chr(10).join(rows)}
      </div>
    </section>''')

paths_html = '\n'.join(
    f'      <div class="path"><div class="pt">{esc(a)}</div><div class="pd">{esc(b)}</div>'
    f'<div class="pbar"><i style="background:{c}"></i></div></div>' for a, b, c in PATHS)

HTML = f'''<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<link rel="icon" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Crect width='32' height='32' rx='8' fill='%232E5BFF'/%3E%3Ctext x='16' y='22' font-size='15' font-family='system-ui' font-weight='700' fill='%23fff' text-anchor='middle'%3E20%3C/text%3E%3C/svg%3E">
<title>求职冲刺 · {total} 篇面试手册 · 20分钟速学</title>
<meta name="description" content="面向运维 / SRE / 云原生的求职冲刺专栏：{total} 篇每篇 20 分钟读完的中文面试手册，覆盖 Linux、网络、Docker、Kubernetes、可观测性、MySQL/Redis、系统设计、事故复盘、行为面、谈薪与简历。纯静态 HTML，离线可用。">
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

.topbar{{position:sticky;top:0;z-index:50;background:rgba(255,255,255,.88);backdrop-filter:blur(12px);border-bottom:1px solid var(--line)}}
.topbar .in{{max-width:1080px;margin:0 auto;padding:0 24px;height:56px;display:flex;align-items:center;gap:18px}}
.brand{{font-weight:700;font-size:16px;letter-spacing:-.2px;display:flex;align-items:center;gap:9px;text-decoration:none;white-space:nowrap}}
.brand .logo{{width:26px;height:26px;border-radius:8px;background:linear-gradient(135deg,var(--accent),#7B5CFF);display:flex;align-items:center;justify-content:center;color:#fff;font-size:12px;font-weight:800}}
.brand small{{font-weight:500;color:var(--faint);font-size:12px}}
.topnav{{display:flex;gap:4px}}
.topnav a{{font-size:13px;color:var(--muted);text-decoration:none;padding:6px 11px;border-radius:8px;transition:.15s}}
.topnav a:hover{{color:var(--ink);background:var(--line2)}}
.topsearch{{display:flex;align-items:center;gap:8px;margin-left:auto;background:var(--bg);border:1px solid var(--line);border-radius:10px;padding:7px 12px;width:260px;transition:.15s}}
.topsearch:focus-within{{border-color:var(--accent);background:#fff;box-shadow:0 0 0 3px var(--accent-soft)}}
.topsearch input{{border:0;outline:0;background:transparent;font-size:13.5px;width:100%;color:var(--ink)}}
.topsearch .kbd{{font-size:11px;color:var(--faint);border:1px solid var(--line);border-radius:5px;padding:1px 6px;background:#fff}}

.hero{{padding:52px 24px 30px;max-width:1080px;margin:0 auto}}
.kicker{{display:inline-flex;align-items:center;gap:8px;font-size:12.5px;font-weight:600;letter-spacing:.8px;color:var(--accent-deep);background:var(--accent-soft);border:1px solid #D6E2FF;padding:5px 13px;border-radius:999px;margin-bottom:16px}}
h1{{font-size:clamp(30px,4.4vw,44px);font-weight:800;letter-spacing:-1.3px;line-height:1.15}}
h1 .grad{{background:linear-gradient(120deg,var(--accent) 10%,#7B5CFF 90%);-webkit-background-clip:text;background-clip:text;color:transparent}}
.tagline{{color:var(--muted);margin-top:14px;font-size:16px;max-width:660px}}
.tagline b{{color:var(--ink);font-weight:600}}
.stats{{display:flex;gap:10px;flex-wrap:wrap;margin-top:24px}}
.stat{{background:var(--card);border:1px solid var(--line);border-radius:11px;padding:10px 18px;min-width:96px}}
.stat .n{{font-size:22px;font-weight:700;color:var(--accent-deep);font-variant-numeric:tabular-nums;line-height:1.2}}
.stat .l{{font-size:12px;color:var(--faint);margin-top:1px}}

.feature{{max-width:1080px;margin:4px auto 0;padding:0 24px}}
.fhead{{display:flex;align-items:baseline;gap:10px;margin-bottom:14px}}
.fhead h2{{font-size:18px;font-weight:700;letter-spacing:-.3px}}
.fhead small{{font-size:12.5px;color:var(--faint)}}
.fgrid{{display:grid;grid-template-columns:1fr 1fr;gap:12px}}
.fcard{{background:var(--card);border:1px solid var(--line);border-radius:var(--radius);padding:18px 20px 15px 24px;text-decoration:none;display:flex;flex-direction:column;gap:7px;position:relative;overflow:hidden;transition:.16s}}
.fcard:hover{{transform:translateY(-2px);box-shadow:var(--shadow-lg);border-color:#D4DAE3}}
.fbar{{position:absolute;left:0;top:0;bottom:0;width:4px;background:linear-gradient(180deg,var(--accent),#7B5CFF)}}
.fbadge{{align-self:flex-start;font-size:11px;font-weight:700;color:var(--accent-deep);background:var(--accent-soft);border:1px solid #D6E2FF;padding:2.5px 10px;border-radius:999px}}
.ft{{font-size:17px;font-weight:700;letter-spacing:-.3px;line-height:1.4}}
.fd{{font-size:13.5px;color:var(--muted);line-height:1.65}}
.fgo{{font-size:13px;font-weight:600;color:var(--accent);margin-top:4px}}

.toolbar{{position:sticky;top:56px;z-index:40;background:rgba(246,247,249,.92);backdrop-filter:blur(10px);padding:13px 24px;border-bottom:1px solid var(--line);margin-top:32px}}
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

main{{max-width:1080px;margin:0 auto;padding:8px 24px 10px}}
.group{{margin-top:22px}}
.ghead{{display:flex;align-items:baseline;gap:9px;padding:9px 12px 8px 14px;position:relative;border-bottom:1px solid var(--line);position:sticky;top:56px;background:#F6F7F9;z-index:30}}
.gbar{{position:absolute;left:0;top:10px;bottom:8px;width:3px;border-radius:3px}}
.gname{{font-size:14px;font-weight:700;letter-spacing:-.2px;white-space:nowrap}}
.gdesc{{font-size:12.5px;color:var(--faint);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;flex:1;min-width:0}}
.gcount{{font-size:12px;color:var(--faint);font-variant-numeric:tabular-nums;white-space:nowrap}}
.rows{{display:flex;flex-direction:column;background:var(--card);border:1px solid var(--line);border-radius:var(--radius);margin-top:8px;overflow:hidden}}
.row{{display:flex;align-items:center;gap:14px;padding:9px 14px;text-decoration:none;transition:background .12s;border-bottom:1px solid var(--line2)}}
.rows .row:last-child{{border-bottom:0}}
.row:hover{{background:#FAFBFC}}
.rnum{{flex:none;width:26px;font-size:11.5px;font-weight:700;color:var(--faint);font-variant-numeric:tabular-nums;text-align:right}}
.rbody{{flex:1;min-width:0;display:flex;flex-direction:column;gap:1px}}
.rt{{font-size:14.5px;font-weight:600;letter-spacing:-.1px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}}
.rd{{font-size:12.2px;color:var(--muted);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}}
.rmin{{flex:none;font-size:11.5px;color:var(--faint);font-variant-numeric:tabular-nums}}
.rarr{{flex:none;width:16px;color:var(--accent);opacity:0;transform:translateX(-4px);transition:.15s;font-weight:700}}
.row:hover .rarr{{opacity:1;transform:none}}
.n20-rb[hidden]{{display:none!important}}
.empty{{display:none;text-align:center;padding:64px 0 80px;color:var(--faint)}}
.empty .big{{font-size:38px;margin-bottom:10px}}
.empty .t{{font-size:14.5px;color:var(--muted)}}

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

footer{{max-width:1080px;margin:52px auto 0;padding:24px 24px 56px;border-top:1px solid var(--line);color:var(--faint);font-size:13px;display:flex;flex-wrap:wrap;gap:8px 24px;align-items:center}}
footer .sep{{flex:1}}
footer a{{color:var(--muted);text-decoration:none}}
footer a:hover{{color:var(--accent)}}

@media(max-width:860px){{ .topnav{{display:none}} .fgrid{{grid-template-columns:1fr}} }}
@media(max-width:640px){{
  .hero{{padding:40px 18px 26px}} .feature,.paths{{padding:0 18px}} .toolbar{{padding:12px 18px}}
  main{{padding:8px 18px 10px}} .topsearch{{width:150px}}
  .gdesc{{display:none}} .ghead{{top:99px}} .row{{gap:10px;padding:9px 8px}}
}}
</style>
</head>
<body>

<header class="topbar">
  <div class="in">
    <a class="brand" href="../index.html"><span class="logo">20</span>求职冲刺 <small>· 20分钟速学</small></a>
    <nav class="topnav">
      <a href="#feature">重点推荐</a>
      <a href="#docs">全部 {total} 篇</a>
      <a href="#paths">冲刺路线</a>
      <a href="../index.html">站点首页</a>
    </nav>
    <label class="topsearch">
      <input id="qtop" type="search" placeholder="搜索 {total} 篇…" autocomplete="off">
      <span class="kbd">/</span>
    </label>
  </div>
</header>

<section class="hero" id="top">
  <span class="kicker">INTERVIEW BOOTCAMP · 20 MIN EACH</span>
  <h1>面试前要补的，<br><span class="grad">{total} 篇</span>给你补完。</h1>
  <p class="tagline">不是八股题库，是<b>能说出口的答案</b>：每个知识点都从现象切入，给判断、给命令、给一句可以直接说给面试官听的话。纯静态单文件，<b>离线可读</b>，自带计时器与自测题。</p>
  <div class="stats">
    <div class="stat"><span class="n">{total}</span><span class="l">篇文档</span></div>
    <div class="stat"><span class="n">{len(GROUPS)}</span><span class="l">个分段</span></div>
    <div class="stat"><span class="n">20 min</span><span class="l">每篇时长</span></div>
    <div class="stat"><span class="n">6</span><span class="l">自测题 / 篇</span></div>
    <div class="stat"><span class="n">0</span><span class="l">依赖 · 可离线</span></div>
  </div>
</section>

<section class="feature" id="feature">
  <div class="fhead"><h2>重点推荐</h2><small>时间紧的话，先读这 {len(FEATURED)} 篇</small></div>
  <div class="fgrid">
{chr(10).join(feat_html)}
  </div>
</section>

<div class="toolbar" id="docs">
  <div class="in">
    <div class="chips">
      {chr(10).join(chips)}
    </div>
    <div class="tools">
      <span class="count" id="count"></span>
      <button class="btn" id="shuffle" title="随机打开一篇">🎲 随机一篇</button>
    </div>
  </div>
</div>

<main>
{chr(10).join(groups_html)}
  <div class="empty" id="empty">
    <div class="big">🔍</div>
    <div class="t">没有匹配的文档，换个关键词或分段试试</div>
  </div>
</main>

<section class="paths" id="paths">
  <h2>四条冲刺路线 <small>按你距离面试的时间挑一条</small></h2>
  <div class="pgrid">
{paths_html}
  </div>
</section>

<footer>
  <span>求职冲刺专栏 · 20分钟速学系列 · 单文件 HTML · 可离线阅读</span>
  <span class="sep"></span>
  <a href="../index.html">← 回到站点首页（另 {246 - total} 篇）</a>
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
  var g = 'all';

  function apply() {{
    var v = (input.value || '').trim().toLowerCase();
    var shown = 0;
    rows.forEach(function (r) {{
      var hit = (!v || r.getAttribute('data-title').indexOf(v) !== -1) && (g === 'all' || r.getAttribute('data-g') === g);
      r.style.display = hit ? '' : 'none';
      if (hit) shown++;
    }});
    groups.forEach(function (el) {{
      var any = Array.prototype.slice.call(el.querySelectorAll('.row')).some(function (r) {{ return r.style.display !== 'none'; }});
      el.style.display = any ? '' : 'none';
    }});
    count.textContent = shown + ' / {total} 篇';
    empty.style.display = shown ? 'none' : 'block';
    main.style.display = shown ? '' : 'none';
  }}

  chips.forEach(function (ch) {{
    ch.addEventListener('click', function () {{
      chips.forEach(function (x) {{ x.classList.remove('active'); }});
      ch.classList.add('active');
      g = ch.getAttribute('data-g');
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

out = os.path.join(COL, 'index.html')
open(out, 'w', encoding='utf-8').write(HTML)
print('10-interview/index.html built: %d docs, %d bytes' % (total, os.path.getsize(out)))
