/*!
 * ============================================================
 *  20分钟速学 · 笔记与已读核心模块  v1.0
 *  - 零依赖 · 单文件 · ES5 兼容
 *  - 已读记录：localStorage + GitHub Gist 同步
 *  - 笔记：按模块 / 每篇总结，Markdown（基础 + 表格 + 待办复选框）
 *  - 文档页：自动在信息芯片行注入「标记已读」按钮，
 *            自动在每个模块标题旁注入 ✎ 笔记按钮
 *  - 主页：自动给每行文档画已读徽章 + 总进度
 *  - Node 环境下导出纯函数（md / mergeRecords / mergeRead / sanitizeUrl）
 * ============================================================
 */
(function (root, factory) {
  var api = factory();
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  } else {
    root.N20 = api;
    if (typeof document !== 'undefined') {
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function () { api.boot(); });
      } else {
        api.boot();
      }
    }
  }
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  /* ================= 1. 基础工具 ================= */

  var K = { read: '20min.read.v1', notes: '20min.notes.v1', gh: '20min.gh.v1' };
  var GIST_FILE = '20min-notes.json';

  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  function sanitizeUrl(u) {
    u = String(u == null ? '' : u).trim();
    if (/^(javascript|vbscript|data|file):/i.test(u)) return '#';
    return u;
  }

  function $(sel, el) { return (el || document).querySelector(sel); }
  function $$(sel, el) { return Array.prototype.slice.call((el || document).querySelectorAll(sel)); }

  function el(tag, cls, html) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (html != null) e.innerHTML = html;
    return e;
  }

  function debounce(fn, ms) {
    var t;
    return function () {
      var args = arguments, self = this;
      clearTimeout(t);
      t = setTimeout(function () { fn.apply(self, args); }, ms);
    };
  }

  function two(n) { return n < 10 ? '0' + n : '' + n; }

  function fmtTime(ts) {
    if (!ts) return '';
    var d = new Date(ts);
    return two(d.getMonth() + 1) + '-' + two(d.getDate()) + ' ' + two(d.getHours()) + ':' + two(d.getMinutes());
  }

  function fmtClock(ts) {
    var d = new Date(ts || Date.now());
    return two(d.getHours()) + ':' + two(d.getMinutes()) + ':' + two(d.getSeconds());
  }

  /* ================= 2. 存储层（localStorage，隐私模式降级为内存） ================= */

  var memFallback = {};
  var lsOK = (function () {
    try {
      localStorage.setItem('__n20_t', '1');
      localStorage.removeItem('__n20_t');
      return true;
    } catch (e) { return false; }
  })();

  function load(key, def) {
    try {
      var raw = lsOK ? localStorage.getItem(key) : memFallback[key];
      return raw ? JSON.parse(raw) : def;
    } catch (e) { return def; }
  }

  function save(key, val) {
    try {
      var raw = JSON.stringify(val);
      if (lsOK) localStorage.setItem(key, raw); else memFallback[key] = raw;
      return true;
    } catch (e) { return false; }
  }

  /* ================= 3. 事件总线 ================= */

  var bus = {
    map: {},
    on: function (ev, fn) { (this.map[ev] = this.map[ev] || []).push(fn); },
    emit: function (ev, arg) {
      (this.map[ev] || []).forEach(function (fn) { try { fn(arg); } catch (e) {} });
    }
  };

  /* ================= 4. Markdown 渲染器（自包含，先转义后解析，防 XSS） ================= */

  var ITEM_RE = /^(\s*)([-*+]|\d+\.)\s+(.*)$/;

  function isBlank(s) { return !s || !s.trim(); }

  function indentOf(s) { var m = s.match(/^\s*/); return m ? m[0].length : 0; }

  function isTableSep(s) {
    return s.indexOf('|') >= 0 && s.indexOf('-') >= 0 && /^[\s|:-]+$/.test(s);
  }

  function splitRow(s) {
    s = s.trim();
    if (s.charAt(0) === '|') s = s.slice(1);
    if (s.charAt(s.length - 1) === '|') s = s.slice(0, -1);
    var cells = s.split('|');
    for (var i = 0; i < cells.length; i++) cells[i] = cells[i].trim();
    return cells;
  }

  function cellAlign(sepCell) {
    var l = sepCell.charAt(0) === ':', r = sepCell.charAt(sepCell.length - 1) === ':';
    if (l && r) return ' style="text-align:center"';
    if (r) return ' style="text-align:right"';
    if (l) return ' style="text-align:left"';
    return '';
  }

  function inline(s) {
    s = esc(s);
    // 行内代码（内容已转义，不再处理其他标记）
    s = s.replace(/`([^`\n]+)`/g, function (m, c) { return '<code>' + c + '</code>'; });
    // 加粗 / 删除线 / 斜体
    s = s.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
    s = s.replace(/__([^_]+)__/g, '<strong>$1</strong>');
    s = s.replace(/~~([^~]+)~~/g, '<del>$1</del>');
    s = s.replace(/(^|[^\w*])\*([^*\n]+)\*(?!\*)/g, '$1<em>$2</em>');
    // 链接（URL 白名单过滤）
    s = s.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, function (m, t, u) {
      return '<a href="' + sanitizeUrl(u) + '" target="_blank" rel="noopener noreferrer">' + t + '</a>';
    });
    return s;
  }

  function parseList(lines, i) {
    var ordered = /^\s*\d+\.\s/.test(lines[i]);
    var base = indentOf(lines[i]);
    var items = [];
    while (i < lines.length) {
      var line = lines[i];
      if (isBlank(line)) {
        var j = i + 1;
        while (j < lines.length && isBlank(lines[j])) j++;
        if (j < lines.length && indentOf(lines[j]) >= base && ITEM_RE.test(lines[j])) { i = j; continue; }
        break;
      }
      var m = line.match(ITEM_RE);
      if (!m) break;
      if (m[1].length < base) break;
      if (m[1].length > base) {
        // 嵌套列表：递归解析，嵌入上一条 <li> 内部
        var sub = parseList(lines, i);
        if (items.length) {
          items[items.length - 1] = items[items.length - 1].replace(/<\/li>$/, sub.html + '</li>');
        }
        i = sub.i;
        continue;
      }
      var content = m[3];
      var task = content.match(/^\[([ xX])\]\s+(.*)$/);
      var inner;
      if (task) {
        inner = '<input type="checkbox" disabled' + (/[xX]/.test(task[1]) ? ' checked' : '') + '> ' + inline(task[2]);
      } else {
        inner = inline(content);
      }
      items.push('<li>' + inner + '</li>');
      i++;
    }
    var tag = ordered ? 'ol' : 'ul';
    return { html: '<' + tag + '>' + items.join('') + '</' + tag + '>', i: i };
  }

  function parseTable(lines, i) {
    var header = splitRow(lines[i]);
    var seps = splitRow(lines[i + 1]);
    var aligns = [];
    for (var a = 0; a < seps.length; a++) aligns.push(cellAlign(seps[a]));
    var html = '<table><thead><tr>';
    for (var h = 0; h < header.length; h++) html += '<th' + (aligns[h] || '') + '>' + inline(header[h]) + '</th>';
    html += '</tr></thead><tbody>';
    i += 2;
    while (i < lines.length && lines[i].indexOf('|') >= 0 && !isBlank(lines[i])) {
      var cells = splitRow(lines[i]);
      html += '<tr>';
      for (var c = 0; c < header.length; c++) html += '<td' + (aligns[c] || '') + '>' + inline(cells[c] || '') + '</td>';
      html += '</tr>';
      i++;
    }
    return { html: html + '</tbody></table>', i: i };
  }

  function md(src) {
    var lines = String(src == null ? '' : src).replace(/\r\n?/g, '\n').split('\n');
    var out = [];
    var i = 0;
    while (i < lines.length) {
      var line = lines[i];

      if (isBlank(line)) { i++; continue; }

      // 围栏代码块
      var fence = line.match(/^```(\w*)\s*$/);
      if (fence) {
        var code = [];
        i++;
        while (i < lines.length && !/^```\s*$/.test(lines[i])) { code.push(lines[i]); i++; }
        i++; // 跳过收尾 fence（允许不闭合）
        out.push('<pre><code>' + esc(code.join('\n')) + '</code></pre>');
        continue;
      }

      // 标题
      var h = line.match(/^(#{1,4})\s+(.*)$/);
      if (h) {
        var lv = h[1].length;
        out.push('<h' + lv + '>' + inline(h[2].trim()) + '</h' + lv + '>');
        i++;
        continue;
      }

      // 分割线
      if (/^\s*(-{3,}|\*{3,}|_{3,})\s*$/.test(line)) { out.push('<hr>'); i++; continue; }

      // 表格（当前行含 | 且下一行是分隔行）
      if (line.indexOf('|') >= 0 && i + 1 < lines.length && isTableSep(lines[i + 1])) {
        var tb = parseTable(lines, i);
        out.push(tb.html);
        i = tb.i;
        continue;
      }

      // 引用块（内部递归渲染）
      if (/^>\s?/.test(line)) {
        var quote = [];
        while (i < lines.length && /^>\s?/.test(lines[i])) {
          quote.push(lines[i].replace(/^>\s?/, ''));
          i++;
        }
        out.push('<blockquote>' + md(quote.join('\n')) + '</blockquote>');
        continue;
      }

      // 列表
      if (ITEM_RE.test(line) && indentOf(line) < 4) {
        var lst = parseList(lines, i);
        out.push(lst.html);
        i = lst.i;
        continue;
      }

      // 普通段落（软换行渲染为 <br>，更符合笔记习惯）
      var para = [line];
      i++;
      while (i < lines.length && !isBlank(lines[i])) {
        var l2 = lines[i];
        if (/^(#{1,4})\s/.test(l2) || /^>\s?/.test(l2) || /^```/.test(l2) ||
            /^\s*(-{3,}|\*{3,}|_{3,})\s*$/.test(l2) ||
            (ITEM_RE.test(l2) && indentOf(l2) < 4) ||
            (l2.indexOf('|') >= 0 && i + 1 < lines.length && isTableSep(lines[i + 1]))) break;
        para.push(l2);
        i++;
      }
      out.push('<p>' + para.map(inline).join('<br>') + '</p>');
    }
    return out.join('\n');
  }

  /* ================= 5. 合并逻辑（纯函数，多设备按更新时间取胜者） ================= */

  function mergeRecords(local, remote) {
    var out = {}, k;
    for (k in local) if (Object.prototype.hasOwnProperty.call(local, k)) out[k] = local[k];
    for (k in remote) {
      if (!Object.prototype.hasOwnProperty.call(remote, k)) continue;
      if (!out[k] || (remote[k].updatedAt || 0) >= (out[k].updatedAt || 0)) out[k] = remote[k];
    }
    return out;
  }

  function mergeRead(local, remote) {
    var out = {}, k;
    for (k in local) if (Object.prototype.hasOwnProperty.call(local, k)) out[k] = local[k];
    for (k in remote) {
      if (!Object.prototype.hasOwnProperty.call(remote, k)) continue;
      if (!(k in out) || remote[k] >= out[k]) out[k] = remote[k];
    }
    return out;
  }

  /* ================= 6. 已读状态 ================= */

  var readApi = {
    all: function () { return load(K.read, {}); },
    is: function (id) { return !!load(K.read, {})[id]; },
    set: function (id, on) {
      var m = load(K.read, {});
      if (on) m[id] = Date.now(); else delete m[id];
      save(K.read, m);
      bus.emit('read', id);
    },
    toggle: function (id) { readApi.set(id, !readApi.is(id)); return readApi.is(id); },
    count: function (ids) {
      var m = load(K.read, {}), n = 0;
      (ids || []).forEach(function (i) { if (m[i]) n++; });
      return n;
    }
  };

  /* ================= 7. 笔记状态 ================= */

  var notesApi = {
    all: function () { return load(K.notes, {}); },
    get: function (key) { return load(K.notes, {})[key] || null; },
    set: function (key, rec) {
      var m = load(K.notes, {});
      m[key] = rec;
      save(K.notes, m);
      bus.emit('notes', key);
      return rec;
    },
    remove: function (key) {
      var m = load(K.notes, {});
      delete m[key];
      save(K.notes, m);
      bus.emit('notes', key);
    },
    summaryKey: function (id) { return id + '#__summary__'; },
    sectionKey: function (id, idx) { return id + '#m' + idx; },
    count: function () { return Object.keys(load(K.notes, {})).length; }
  };

  /* ================= 8. GitHub Gist 同步 ================= */

  var gh = {
    cfg: function () { return load(K.gh, {}); },
    saveCfg: function (c) { save(K.gh, c); },
    headers: function (token) {
      return { 'Authorization': 'token ' + token, 'Accept': 'application/vnd.github+json' };
    },
    pull: function () {
      var c = gh.cfg();
      if (!c.token || !c.gistId) return Promise.reject(new Error('尚未配置 Token 或 Gist'));
      return fetch('https://api.github.com/gists/' + c.gistId, { headers: gh.headers(c.token) })
        .then(function (r) {
          if (!r.ok) throw new Error('拉取失败 HTTP ' + r.status);
          return r.json();
        })
        .then(function (j) {
          var data = {};
          try { data = JSON.parse((j.files || {})[GIST_FILE].content || '{}'); } catch (e) {}
          var read = mergeRead(readApi.all(), data.read || {});
          var notes = mergeRecords(notesApi.all(), data.notes || {});
          save(K.read, read);
          save(K.notes, notes);
          c.lastPull = Date.now();
          gh.saveCfg(c);
          bus.emit('sync', 'pull');
          return { read: read, notes: notes };
        });
    },
    push: function () {
      var c = gh.cfg();
      if (!c.token) return Promise.reject(new Error('尚未配置 Token'));
      var payload = {
        description: '20分钟速学 · 学习笔记与已读记录（由网页自动同步）',
        files: {}
      };
      payload.files[GIST_FILE] = {
        content: JSON.stringify({ v: 1, updatedAt: Date.now(), read: readApi.all(), notes: notesApi.all() })
      };
      if (!c.gistId) payload.public = false;
      var url = c.gistId ? 'https://api.github.com/gists/' + c.gistId : 'https://api.github.com/gists';
      var method = c.gistId ? 'PATCH' : 'POST';
      return fetch(url, {
        method: method,
        headers: gh.headers(c.token),
        body: JSON.stringify(payload)
      }).then(function (r) {
        if (!r.ok) throw new Error('推送失败 HTTP ' + r.status);
        return r.json();
      }).then(function (j) {
        if (!c.gistId) { c.gistId = j.id; }
        c.lastPush = Date.now();
        gh.saveCfg(c);
        bus.emit('sync', 'push');
        return j;
      });
    },
    sync: function () {
      return gh.pull().then(function () { return gh.push(); }, function () { return gh.push(); });
    }
  };

  var schedulePush = debounce(function () {
    var c = gh.cfg();
    if (c.auto && c.token) {
      gh.push().then(function () { setStatus('已同步到 Gist ' + fmtClock()); },
        function (e) { setStatus('同步失败：' + e.message, true); });
    }
  }, 2500);

  /* ================= 9. 页面识别 ================= */

  /* 站点根目录路径：从注入的脚本自身位置推导，
     兼容 GitHub Pages 项目页(/repo/)、自定义域名、localhost、file:// 任意深度 */
  function siteRootPath() {
    var s = document.getElementById('n20-core');
    if (s && s.src) {
      try {
        var u = new URL(s.src);
        return u.pathname.replace(/\/[^\/]*$/, '') || '/';
      } catch (e) {}
    }
    return '/';
  }

  function docId() {
    var root = siteRootPath().replace(/\/+$/, '');
    var p = location.pathname || '';
    if (root && p.indexOf(root + '/') === 0) p = p.slice(root.length + 1);
    else if (p.charAt(0) === '/') p = p.slice(1);
    var id = p.replace(/\/+$/, '');
    return id || 'index.html';
  }

  function docTitle() {
    var h1 = document.querySelector('h1');
    return h1 ? h1.textContent.trim() : document.title.replace(/\s*\|.*$/, '');
  }

  function collectSections(id) {
    return $$('.shead').map(function (sh, idx) {
      var h2 = sh.querySelector('h2');
      var sec = sh.closest('section');
      return {
        idx: idx,
        key: notesApi.sectionKey(id, idx),
        title: (h2 ? h2.textContent.trim() : ('模块 ' + (idx + 1))),
        secId: (sec && sec.id) ? sec.id : ('s' + idx),
        mins: (sh.querySelector('.mins') ? sh.querySelector('.mins').textContent.trim() : '')
      };
    });
  }

  /* ================= 10. 面板 UI ================= */

  var page = { id: '', title: '', isDoc: false, isHome: false, sections: [] };
  var ui = { open: false, tab: 'doc', cur: null, preview: false, search: '', text: '' };
  var dom = {};

  var CSS = [
    '#n20-fab{position:fixed;right:22px;bottom:22px;width:54px;height:54px;border-radius:50%;border:none;cursor:pointer;',
    'background:linear-gradient(135deg,#2E5BFF,#7A5CFF);color:#fff;font-size:22px;line-height:1;',
    'box-shadow:0 6px 20px rgba(46,91,255,.42);z-index:99990;display:flex;align-items:center;justify-content:center;',
    'transition:transform .15s,box-shadow .15s;font-family:system-ui,-apple-system,"Segoe UI","Microsoft YaHei",sans-serif}',
    '#n20-fab:hover{transform:translateY(-2px) scale(1.06);box-shadow:0 10px 28px rgba(46,91,255,.52)}',
    '#n20-fab .cnt{position:absolute;top:-3px;right:-3px;min-width:20px;height:20px;border-radius:10px;background:#E5484D;',
    'color:#fff;font-size:11px;font-weight:600;line-height:20px;padding:0 5px;box-shadow:0 2px 6px rgba(0,0,0,.28)}',
    '#n20-mask{position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(26,26,24,.32);opacity:0;pointer-events:none;',
    'transition:opacity .2s;z-index:99991}',
    '#n20-mask.on{opacity:1;pointer-events:auto}',
    '#n20-panel{position:fixed;top:0;right:0;bottom:0;width:430px;max-width:96vw;background:#fff;z-index:99999;',
    'display:flex;flex-direction:column;box-shadow:-10px 0 36px rgba(0,0,0,.16);transform:translateX(106%);',
    'transition:transform .25s cubic-bezier(.2,.8,.3,1);color:#1A1A18;',
    'font-family:system-ui,-apple-system,"Segoe UI","Microsoft YaHei",sans-serif;font-size:14px;line-height:1.7}',
    '#n20-panel.on{transform:none}',
    '#n20-panel header{padding:16px 18px 12px;border-bottom:1px solid #E4E3DE;flex:none}',
    '#n20-panel .hd{display:flex;align-items:flex-start;gap:10px}',
    '#n20-panel .hd .t{font-size:16px;font-weight:600;flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}',
    '#n20-panel .hd .s{font-size:12px;color:#9A9A93;margin-top:2px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}',
    '#n20-panel .x{flex:none;border:none;background:#F1EFE8;color:#6B6B66;width:30px;height:30px;border-radius:8px;',
    'cursor:pointer;font-size:14px}',
    '#n20-panel .x:hover{background:#E4E3DE;color:#1A1A18}',
    '#n20-tabs{display:flex;border-bottom:1px solid #E4E3DE;flex:none}',
    '#n20-tabs button{flex:1;border:none;background:none;padding:11px 4px 9px;font-size:14px;color:#6B6B66;cursor:pointer;',
    'border-bottom:2px solid transparent;font-family:inherit}',
    '#n20-tabs button.on{color:#2E5BFF;border-bottom-color:#2E5BFF;font-weight:600}',
    '#n20-tabs .badge{display:inline-block;min-width:17px;height:17px;border-radius:9px;background:#E5484D;color:#fff;',
    'font-size:10px;line-height:17px;padding:0 4px;margin-left:4px;vertical-align:1px}',
    '#n20-body{flex:1;overflow:auto;padding:16px 18px;-webkit-overflow-scrolling:touch}',
    '#n20-foot{flex:none;border-top:1px solid #E4E3DE;padding:8px 16px;font-size:12px;color:#9A9A93;',
    'display:flex;justify-content:space-between;gap:8px;min-height:34px;align-items:center}',
    '#n20-foot .err{color:#A32D2D}',
    '.n20-chips{display:flex;gap:6px;flex-wrap:wrap;margin-bottom:12px}',
    '.n20-chip{font-size:12px;padding:4px 10px;border-radius:999px;border:1px solid #E4E3DE;background:#F7F7F5;',
    'color:#6B6B66;cursor:pointer;position:relative;max-width:180px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}',
    '.n20-chip:hover{border-color:#2E5BFF;color:#2E5BFF}',
    '.n20-chip.on{background:#2E5BFF;border-color:#2E5BFF;color:#fff}',
    '.n20-chip .dot{position:absolute;top:-2px;right:-2px;width:8px;height:8px;border-radius:50%;background:#0F6E56;',
    'border:1.5px solid #fff}',
    '.n20-chip.on .dot{border-color:#2E5BFF}',
    '.n20-toolbar{display:flex;gap:8px;align-items:center;margin-bottom:10px;flex-wrap:wrap}',
    '.n20-ta{width:100%;min-height:230px;border:1px solid #E4E3DE;border-radius:10px;padding:12px;',
    'font-family:ui-monospace,"Cascadia Code",Consolas,"Courier New",monospace;font-size:13px;line-height:1.7;',
    'resize:vertical;background:#FDFDFC;color:#1A1A18}',
    '.n20-ta:focus{outline:none;border-color:#2E5BFF;box-shadow:0 0 0 3px rgba(46,91,255,.12)}',
    '.n20-pv{width:100%;min-height:230px;border:1px solid #E4E3DE;border-radius:10px;padding:12px;background:#fff;',
    'font-size:14px;overflow-wrap:break-word}',
    '.n20-pv h1,.n20-pv h2,.n20-pv h3,.n20-pv h4{margin:.6em 0 .35em;line-height:1.4}',
    '.n20-pv h1{font-size:19px}.n20-pv h2{font-size:17px}.n20-pv h3{font-size:15px}.n20-pv h4{font-size:14px}',
    '.n20-pv p{margin:.45em 0}',
    '.n20-pv table{border-collapse:collapse;margin:.6em 0;font-size:13px;display:block;overflow-x:auto}',
    '.n20-pv th,.n20-pv td{border:1px solid #E4E3DE;padding:5px 10px}',
    '.n20-pv th{background:#F7F7F5}',
    '.n20-pv pre{background:#F1EFE8;border-radius:8px;padding:10px 12px;overflow-x:auto;font-size:12.5px;margin:.6em 0}',
    '.n20-pv code{background:#F1EFE8;border-radius:4px;padding:1px 5px;font-size:12.5px;',
    'font-family:ui-monospace,"Cascadia Code",Consolas,monospace}',
    '.n20-pv pre code{background:none;padding:0}',
    '.n20-pv blockquote{border-left:3px solid #D9D8D2;margin:.5em 0;padding:2px 12px;color:#6B6B66}',
    '.n20-pv hr{border:none;border-top:1px solid #E4E3DE;margin:.9em 0}',
    '.n20-pv ul,.n20-pv ol{margin:.45em 0;padding-left:22px}',
    '.n20-pv li{margin:.2em 0}',
    '.n20-pv li input[type=checkbox]{margin-right:6px;vertical-align:-1px}',
    '.n20-pv a{color:#2E5BFF}',
    '.n20-empty{text-align:center;color:#9A9A93;font-size:13px;padding:38px 10px}',
    '.n20-empty .big{font-size:30px;margin-bottom:8px}',
    '.n20-search{width:100%;border:1px solid #E4E3DE;border-radius:8px;padding:8px 12px;font-size:13px;',
    'font-family:inherit;background:#FDFDFC;margin-bottom:12px}',
    '.n20-search:focus{outline:none;border-color:#2E5BFF}',
    '.n20-progress{height:6px;background:#EFEFEA;border-radius:3px;overflow:hidden;margin:2px 0 14px}',
    '.n20-progress>i{display:block;height:100%;width:0;background:linear-gradient(90deg,#0F6E56,#2E5BFF);transition:width .3s}',
    '.n20-item{border:1px solid #E4E3DE;border-radius:10px;padding:10px 12px;margin-bottom:8px;cursor:pointer;',
    'background:#fff;transition:border-color .15s}',
    '.n20-item:hover{border-color:#2E5BFF}',
    '.n20-item .doc{font-size:13px;font-weight:600;display:inline;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:62%}',
    '.n20-item .sec{font-size:11px;color:#534AB7;background:#EEEDFE;border-radius:999px;padding:1px 8px;margin-left:6px;',
    'white-space:nowrap;vertical-align:1px}',
    '.n20-item .del{float:right;border:none;background:none;color:#A8A7A0;font-size:13px;cursor:pointer;padding:2px 7px;',
    'border-radius:6px;line-height:1.5;font-family:inherit}',
    '.n20-item .del:hover{color:#A32D2D;background:#FCEBEB}',
    '.n20-item .time{font-size:11px;color:#9A9A93;margin-left:8px}',
    '.n20-item .txt{font-size:12px;color:#6B6B66;margin-top:4px;max-height:3.6em;overflow:hidden;',
    'display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical}',
    '.n20-fld{margin-bottom:14px}',
    '.n20-fld label{display:block;font-size:13px;font-weight:600;margin-bottom:5px}',
    '.n20-fld input[type=text],.n20-fld input[type=password]{width:100%;border:1px solid #E4E3DE;border-radius:8px;',
    'padding:8px 12px;font-size:13px;font-family:inherit;background:#FDFDFC}',
    '.n20-fld input:focus{outline:none;border-color:#2E5BFF}',
    '.n20-hint{font-size:12px;color:#9A9A93;margin-top:5px;line-height:1.6}',
    '.n20-row{display:flex;gap:8px;flex-wrap:wrap;margin-bottom:14px}',
    '.n20-btn{border:1px solid #E4E3DE;background:#fff;color:#1A1A18;padding:7px 14px;border-radius:8px;font-size:13px;',
    'cursor:pointer;font-family:inherit;transition:.15s}',
    '.n20-btn:hover{border-color:#2E5BFF;color:#2E5BFF}',
    '.n20-btn.pri{background:#2E5BFF;border-color:#2E5BFF;color:#fff}',
    '.n20-btn.pri:hover{opacity:.88;color:#fff}',
    '.n20-btn.danger{border-color:#F2C6C6;color:#A32D2D}',
    '.n20-btn.danger:hover{border-color:#A32D2D;background:#FCEBEB;color:#A32D2D}',
    '.n20-btn[disabled]{opacity:.5;cursor:not-allowed}',
    '.n20-sec-title{font-size:13px;font-weight:600;margin:18px 0 8px;color:#1A1A18}',
    '.n20-sec-title:first-child{margin-top:0}',
    '#n20-panel .n20-read-btn{margin-left:auto}',
    '.n20-read-btn.on{background:#E1F5EE;border-color:#0F6E56;color:#0F6E56}',
    '.n20-rb{display:inline-flex;align-items:center;gap:3px;font-size:11px;font-weight:600;color:#0F6E56;',
    'background:#E1F5EE;border-radius:999px;padding:2px 8px;margin-left:8px;white-space:nowrap;vertical-align:middle}',
    'a.row.n20-read .rt{color:#0F6E56}',
    'a.fcard.n20-read .n20-rb{align-self:flex-start;margin:8px 0 0}',
    '@media (max-width:640px){#n20-panel{width:100%}#n20-fab{right:16px;bottom:16px}}'
  ].join('\n');

  function injectCSS() {
    if (document.getElementById('n20-css')) return;
    var st = el('style');
    st.id = 'n20-css';
    st.textContent = CSS;
    document.head.appendChild(st);
  }

  function setStatus(msg, isErr) {
    if (!dom.footL) return;
    dom.footL.innerHTML = '<span class="' + (isErr ? 'err' : '') + '">' + esc(msg) + '</span>';
  }

  function buildPanel() {
    dom.mask = el('div');
    dom.mask.id = 'n20-mask';
    dom.mask.onclick = closePanel;

    var panel = el('aside');
    panel.id = 'n20-panel';
    panel.innerHTML =
      '<header>' +
      '  <div class="hd"><div style="flex:1;min-width:0"><div class="t" id="n20-t"></div>' +
      '  <div class="s" id="n20-s"></div></div><button class="x" id="n20-x" title="关闭 (Esc)">✕</button></div>' +
      '</header>' +
      '<nav id="n20-tabs">' +
      '  <button data-tab="doc">本篇</button>' +
      '  <button data-tab="all">全部<span class="badge" id="n20-allc" hidden></span></button>' +
      '  <button data-tab="cfg">设置</button>' +
      '</nav>' +
      '<div id="n20-body"></div>' +
      '<footer id="n20-foot"><span id="n20-fl"></span><span id="n20-fr"></span></footer>';

    document.body.appendChild(dom.mask);
    document.body.appendChild(panel);

    dom.panel = panel;
    dom.title = $('#n20-t');
    dom.sub = $('#n20-s');
    dom.body = $('#n20-body');
    dom.footL = $('#n20-fl');
    dom.footR = $('#n20-fr');
    dom.allc = $('#n20-allc');

    $('#n20-x').onclick = closePanel;
    $$('#n20-tabs button').forEach(function (b) {
      b.onclick = function () { switchTab(b.dataset.tab); };
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && ui.open) closePanel();
      if ((e.metaKey || e.ctrlKey) && e.key === 's' && ui.open) {
        e.preventDefault();
        saveCurrentNote(true);
      }
    });
  }

  function buildFab() {
    dom.fab = el('button');
    dom.fab.id = 'n20-fab';
    dom.fab.title = '学习笔记 (Ctrl/⌘+Enter 快捷开关)';
    dom.fab.innerHTML = '✎<span class="cnt" id="n20-cnt" hidden></span>';
    dom.fab.onclick = function () { ui.open ? closePanel() : openPanel(page.isHome ? 'all' : 'doc'); };
    document.body.appendChild(dom.fab);
    dom.cnt = $('#n20-cnt');

    document.addEventListener('keydown', function (e) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
        e.preventDefault();
        ui.open ? closePanel() : openPanel();
      }
    });
  }

  function openPanel(tab) {
    ui.open = true;
    dom.panel.classList.add('on');
    dom.mask.classList.add('on');
    if (dom.fab) dom.fab.style.visibility = 'hidden';
    if (tab) ui.tab = tab;
    switchTab(ui.tab);
  }

  function closePanel() {
    flushAutosave();
    ui.open = false;
    dom.panel.classList.remove('on');
    dom.mask.classList.remove('on');
    if (dom.fab) dom.fab.style.visibility = '';
  }

  function switchTab(tab) {
    if (ui.tab === 'doc' && tab !== 'doc') flushAutosave();
    ui.tab = tab;
    $$('#n20-tabs button').forEach(function (b) { b.classList.toggle('on', b.dataset.tab === tab); });
    if (tab === 'doc') renderDocTab();
    else if (tab === 'all') renderAllTab();
    else renderCfgTab();
  }

  /* ---------- 本篇 tab ---------- */

  function renderDocTab() {
    dom.title.textContent = page.title || '学习笔记';
    dom.sub.textContent = page.isDoc ? '按模块记录笔记，支持 Markdown' : '在任意文档页可以按模块记笔记';
    var b = dom.body;
    b.innerHTML = '';

    if (!page.isDoc) {
      b.appendChild(el('div', 'n20-empty',
        '<div class="big">📖</div>当前是主页，请先打开一篇文档<br>就能按模块记录笔记了'));
      return;
    }

    // 区块选择 chips
    var chips = el('div', 'n20-chips');
    var all = [{ key: notesApi.summaryKey(page.id), title: '⭐ 本篇总结', secId: '', isSummary: true }]
      .concat(page.sections);
    all.forEach(function (s) { chips.appendChild(makeChip(s)); });
    b.appendChild(chips);

    // 工具栏
    var bar = el('div', 'n20-toolbar');
    var btnPv = el('button', 'n20-btn', ui.preview ? '✏️ 编辑' : '👁 预览');
    btnPv.onclick = function () {
      // 先从 DOM 捕获最新文本（编辑态有文本框；预览态没有，不能当成空）
      var ta = $('.n20-ta');
      if (ta) ui.text = ta.value;
      flushAutosave();                 // 落盘任何待存内容（按原 key，不串写）
      ui.preview = !ui.preview;
      saveCurrentNote(false, ui.text); // 显式带文本，绝不由 DOM 推断
      renderDocTab();
    };
    var btnSave = el('button', 'n20-btn pri', '保存');
    btnSave.onclick = function () { saveCurrentNote(true); };
    var tip = el('span', 'n20-hint', '⌘/Ctrl+S 保存 · 支持 **粗体** *斜体* `代码` 表格 与 - [ ] 待办');
    tip.style.flex = '1';
    bar.appendChild(btnPv); bar.appendChild(btnSave); bar.appendChild(tip);
    b.appendChild(bar);

    // 编辑区 / 预览区
    if (!ui.cur) ui.cur = all[0];
    var rec = notesApi.get(ui.cur.key);
    var text = rec ? rec.text : '';
    ui.text = text;
    if (ui.preview) {
      var pv = el('div', 'n20-pv');
      pv.innerHTML = text.trim() ? md(text) : '<span class="n20-hint">还没有内容，切到编辑写点什么吧。</span>';
      b.appendChild(pv);
    } else {
      var ta = el('textarea', 'n20-ta');
      ta.placeholder = '在这里记录 ' + ui.cur.title + ' 的要点、疑问、命令…\n\n支持 Markdown：\n# 小标题\n- [ ] 待办事项\n| 命令 | 作用 |\n| --- | --- |';
      ta.value = text;
      ta.oninput = function () {
        ui.text = ta.value;
        scheduleAutosave(ta.value, ui.cur.key, ui.cur);
      };
      b.appendChild(ta);
      setTimeout(function () { ta.focus(); }, 60);
    }
    setStatus(rec ? '已保存 ' + fmtClock(rec.updatedAt) : '新笔记，输入后自动保存');
  }

  function makeChip(s) {
    var has = !!notesApi.get(s.key);
    var c = el('button', 'n20-chip' + (ui.cur && ui.cur.key === s.key ? ' on' : ''), esc(s.title));
    if (has) c.appendChild(el('i', 'dot'));
    c.title = s.title;
    c.onclick = function () {
      // 切区块前：捕获当前文本并立即落盘到原 key，防止延迟保存串写到新区块
      var ta = $('.n20-ta');
      if (ta) ui.text = ta.value;
      flushAutosave();
      ui.cur = s;
      renderDocTab();
    };
    return c;
  }

  /* 自动保存：待存内容与目标 key/区块绑定。
     切换区块、关闭面板、离开页面前强制落盘（flush），
     杜绝"旧模块的文字延迟保存到新模块 key 上"的串写。 */
  var pendingSave = null;
  function scheduleAutosave(text, key, sec) {
    pendingSave = { text: text, key: key, sec: sec };
    clearTimeout(pendingSave.timer);
    pendingSave.timer = setTimeout(flushAutosave, 700);
  }
  function flushAutosave() {
    if (!pendingSave) return;
    clearTimeout(pendingSave.timer);
    var p = pendingSave;
    pendingSave = null;
    saveCurrentNote(false, p.text, p.key, p.sec);
  }

  function saveCurrentNote(manual, textOverride, keyOverride, secOverride) {
    if (!page.isDoc) return;
    var sec = secOverride || ui.cur;
    if (!sec) return;
    // 文本唯一来源：显式传入 > ui.text（由输入/加载/切换前捕获维护）。
    // 绝不再查询 DOM——预览态没有文本框，查不到会被误判为"清空"而删笔记。
    var text;
    if (textOverride != null) text = textOverride;
    else if (typeof ui.text === 'string') text = ui.text;
    else return;
    var key = keyOverride || sec.key;
    if (!text.trim()) {
      if (notesApi.get(key)) notesApi.remove(key);
      setStatus('已清空该区块笔记');
    } else {
      notesApi.set(key, {
        text: text,
        updatedAt: Date.now(),
        doc: page.id,
        docTitle: page.title,
        sec: sec.title,
        secId: sec.secId
      });
      setStatus('已保存 ' + fmtClock());
    }
    paintCounts();
    schedulePush();
    if (manual && ui.preview) renderDocTab();
  }

  /* ---------- 全部 tab ---------- */

  function renderAllTab() {
    dom.title.textContent = '全部笔记';
    var total = readApi.all();
    var ids = page.isHome ? homeDocIds() : [page.id];
    var readN = readApi.count(ids);
    dom.sub.textContent = '共 ' + notesApi.count() + ' 条笔记 · 已读 ' + readN + (page.isHome ? '/' + ids.length : '') + ' 篇';
    var b = dom.body;
    b.innerHTML = '';

    if (page.isHome) {
      var pg = el('div', 'n20-progress');
      var pct = ids.length ? Math.round(readN / ids.length * 100) : 0;
      pg.appendChild(el('i'));
      pg.firstChild.style.width = pct + '%';
      b.appendChild(pg);
    }

    var search = el('input', 'n20-search');
    search.placeholder = '搜索文档 / 章节 / 内容…';
    search.value = ui.search;
    search.oninput = function () { ui.search = search.value; paintNoteList(b); };
    b.appendChild(search);

    var list = el('div');
    list.id = 'n20-list';
    b.appendChild(list);
    paintNoteList(b);
  }

  function paintNoteList(scope) {
    var list = $('#n20-list', scope);
    if (!list) return;
    list.innerHTML = '';
    var all = notesApi.all();
    var keys = Object.keys(all).sort(function (a, b) {
      return (all[b].updatedAt || 0) - (all[a].updatedAt || 0);
    });
    var q = (ui.search || '').trim().toLowerCase();
    if (q) {
      keys = keys.filter(function (k) {
        var r = all[k];
        return (r.docTitle || '').toLowerCase().indexOf(q) >= 0 ||
               (r.sec || '').toLowerCase().indexOf(q) >= 0 ||
               (r.text || '').toLowerCase().indexOf(q) >= 0;
      });
    }
    if (!keys.length) {
      list.appendChild(el('div', 'n20-empty',
        '<div class="big">' + (q ? '🔍' : '📝') + '</div>' +
        (q ? '没有匹配的笔记' : '还没有笔记<br>打开文档，点模块旁的 ✎ 开始记录')));
      return;
    }
    keys.forEach(function (k) {
      var r = all[k];
      var item = el('div', 'n20-item');
      var snippet = (r.text || '').replace(/[#*`>|\[\]-]/g, '').replace(/\s+/g, ' ').trim().slice(0, 90);
      item.innerHTML =
        '<button class="del" title="删除">✕</button>' +
        '<span class="doc">' + esc(r.docTitle || r.doc) + '</span>' +
        '<span class="sec">' + esc(r.sec || '笔记') + '</span>' +
        '<span class="time">' + esc(fmtTime(r.updatedAt)) + '</span>' +
        '<div class="txt">' + esc(snippet) + '</div>';
      item.querySelector('.del').onclick = function (e) {
        e.stopPropagation();
        if (confirm('删除这条笔记？')) {
          notesApi.remove(k);
          paintCounts();
          schedulePush();
          paintNoteList(scope);
        }
      };
      item.onclick = function () { jumpToNote(r); };
      list.appendChild(item);
    });
  }

  function jumpToNote(rec) {
    var url = page.isHome ? rec.doc : ('../' + rec.doc);
    if (page.isDoc && rec.doc === page.id) {
      // 同文档：直接定位并打开对应区块（按 secId 匹配，key 格式不影响定位）
      var summary = rec.sec.indexOf('总结') >= 0;
      var sec = page.sections.filter(function (s) { return s.secId === rec.secId; })[0];
      var cur;
      if (summary) {
        cur = { key: notesApi.summaryKey(page.id), title: '⭐ 本篇总结', secId: '', isSummary: true };
      } else if (sec) {
        cur = sec;
      } else {
        // 兼容历史 key：sN 统一映射为 #mN，避免同章节出现两条
        var idx = /^s(\d+)$/.test(rec.secId || '') ? parseInt(RegExp.$1, 10) : null;
        cur = { key: notesApi.sectionKey(page.id, idx != null ? idx : rec.secId), title: rec.sec, secId: rec.secId };
      }
      ui.cur = cur;
      openPanel('doc');
      if (rec.secId) {
        var t = document.getElementById(rec.secId);
        if (t) t.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
      return;
    }
    location.href = url + (rec.secId ? '#' + rec.secId : '');
  }

  /* ---------- 设置 tab ---------- */

  function renderCfgTab() {
    dom.title.textContent = '设置 · 同步与数据';
    dom.sub.textContent = '数据默认只存在本机浏览器';
    var b = dom.body;
    b.innerHTML = '';
    var c = gh.cfg();

    // Gist 同步
    b.appendChild(el('div', 'n20-sec-title', 'GitHub Gist 同步（多设备）'));
    var f1 = el('div', 'n20-fld');
    f1.innerHTML = '<label>GitHub Token（仅保存在本机 localStorage）</label>';
    var tok = el('input');
    tok.type = 'password';
    tok.placeholder = 'ghp_… 或细粒度 Token（github_pat_…）';
    tok.value = c.token || '';
    tok.oninput = function () { c.token = tok.value.trim(); gh.saveCfg(c); paintSyncState(); };
    f1.appendChild(tok);
    f1.appendChild(el('div', 'n20-hint',
      '建议用细粒度 Token，仅勾选 <b>Gist</b> 权限，可随时在 GitHub → Settings → Developer settings 吊销。' +
      'Token 不会发送到除 api.github.com 以外的任何地方。'));
    b.appendChild(f1);

    var row1 = el('div', 'n20-row');
    var bSync = el('button', 'n20-btn pri', '⇅ 立即同步（拉取+推送）');
    bSync.onclick = function () {
      setStatus('同步中…');
      bSync.disabled = true;
      gh.sync().then(function () {
        setStatus('同步完成 ' + fmtClock());
        paintCounts(); paintHomeBadges();
      }, function (e) { setStatus('同步失败：' + e.message, true); })
        .then(function () { bSync.disabled = false; paintSyncState(); });
    };
    var bPull = el('button', 'n20-btn', '仅拉取');
    bPull.onclick = function () {
      setStatus('拉取中…');
      gh.pull().then(function () { setStatus('拉取完成 ' + fmtClock()); paintCounts(); paintHomeBadges(); },
        function (e) { setStatus('拉取失败：' + e.message, true); });
    };
    var bPush = el('button', 'n20-btn', '仅推送');
    bPush.onclick = function () {
      setStatus('推送中…');
      gh.push().then(function () { setStatus('推送完成 ' + fmtClock()); },
        function (e) { setStatus('推送失败：' + e.message, true); });
    };
    row1.appendChild(bSync); row1.appendChild(bPull); row1.appendChild(bPush);
    b.appendChild(row1);

    var f2 = el('div', 'n20-fld');
    var auto = el('input');
    auto.type = 'checkbox';
    auto.checked = !!c.auto;
    auto.onchange = function () { c.auto = auto.checked; gh.saveCfg(c); };
    var lbAuto = el('label');
    lbAuto.style.display = 'flex';
    lbAuto.style.alignItems = 'center';
    lbAuto.style.gap = '8px';
    lbAuto.style.fontWeight = '400';
    lbAuto.appendChild(auto);
    lbAuto.appendChild(document.createTextNode('自动同步（保存笔记/已读后自动推送，打开页面自动拉取）'));
    f2.appendChild(lbAuto);
    b.appendChild(f2);

    var state = el('div', 'n20-hint');
    state.id = 'n20-syncstate';
    f2.appendChild(state);
    paintSyncState();

    // 导入导出
    b.appendChild(el('div', 'n20-sec-title', '导出 / 导入（不依赖 GitHub 的备份方式）'));
    var row2 = el('div', 'n20-row');
    var bExp = el('button', 'n20-btn', '⬇ 导出 JSON');
    bExp.onclick = exportJSON;
    var bImp = el('button', 'n20-btn', '⬆ 导入 JSON');
    bImp.onclick = function () { $('#n20-imp').click(); };
    var imp = el('input');
    imp.type = 'file';
    imp.id = 'n20-imp';
    imp.accept = '.json,application/json';
    imp.style.display = 'none';
    imp.onchange = function () { importJSON(imp.files[0]); imp.value = ''; };
    row2.appendChild(bExp); row2.appendChild(bImp); row2.appendChild(imp);
    b.appendChild(row2);

    // 危险区
    b.appendChild(el('div', 'n20-sec-title', '危险区'));
    var row3 = el('div', 'n20-row');
    var bClear = el('button', 'n20-btn danger', '🗑 清空全部本地数据');
    bClear.onclick = function () {
      if (!confirm('将清空所有笔记、已读记录和同步配置，且不可恢复。确定继续？')) return;
      if (!confirm('再确认一次：真的全部删除？（建议先导出 JSON 备份）')) return;
      save(K.read, {}); save(K.notes, {}); save(K.gh, {});
      paintCounts(); paintHomeBadges();
      setStatus('已清空全部数据');
      switchTab('cfg');
    };
    row3.appendChild(bClear);
    b.appendChild(row3);

    var usage = el('div', 'n20-hint');
    usage.id = 'n20-usage';
    b.appendChild(usage);
    paintUsage();
  }

  function paintSyncState() {
    var s = $('#n20-syncstate');
    if (!s) return;
    var c = gh.cfg();
    var parts = [];
    parts.push(c.gistId ? 'Gist：' + c.gistId.slice(0, 8) + '…' : 'Gist：首次推送时自动创建');
    parts.push(c.token ? 'Token：已配置' : 'Token：未配置');
    if (c.lastPull) parts.push('上次拉取 ' + fmtTime(c.lastPull));
    if (c.lastPush) parts.push('上次推送 ' + fmtTime(c.lastPush));
    s.innerHTML = parts.map(esc).join('<br>');
  }

  function paintUsage() {
    var u = $('#n20-usage');
    if (!u) return;
    var size = 0;
    try {
      size = new Blob([JSON.stringify(notesApi.all()), JSON.stringify(readApi.all())]).size;
    } catch (e) {}
    u.innerHTML = '本地存储用量约 ' + (size / 1024).toFixed(1) + ' KB · 笔记 ' + notesApi.count() +
      ' 条 · 已读 ' + Object.keys(readApi.all()).length + ' 篇';
  }

  function exportJSON() {
    var data = {
      app: '20min-tech-notes', v: 1, exportedAt: new Date().toISOString(),
      read: readApi.all(), notes: notesApi.all()
    };
    var blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    var a = el('a');
    a.href = URL.createObjectURL(blob);
    a.download = '20min-notes-' + new Date().toISOString().slice(0, 10) + '.json';
    document.body.appendChild(a);
    a.click();
    setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 500);
    setStatus('已导出 JSON');
  }

  function importJSON(file) {
    if (!file) return;
    var r = new FileReader();
    r.onload = function () {
      try {
        var data = JSON.parse(r.result);
        if (!data || typeof data !== 'object') throw new Error('文件格式不正确');
        save(K.read, mergeRead(readApi.all(), data.read || {}));
        save(K.notes, mergeRecords(notesApi.all(), data.notes || {}));
        paintCounts(); paintHomeBadges(); paintUsage();
        setStatus('导入完成（已按更新时间合并）');
        schedulePush();
      } catch (e) {
        setStatus('导入失败：' + e.message, true);
      }
    };
    r.readAsText(file);
  }

  /* ================= 11. 已读按钮（文档页） ================= */

  function initReadBtn() {
    // 注入位置多级回退：.density → .chips → .timerbox → 自建一行
    var anchor = document.querySelector('.density') || document.querySelector('.chips') ||
                 document.querySelector('.timerbox');
    if (!anchor) {
      var wrap = document.querySelector('header .wrap');
      if (!wrap) return;
      anchor = el('div', 'density');
      anchor.style.marginTop = '16px';
      wrap.appendChild(anchor);
    }
    var btn = el('button', 'btn n20-read-btn');
    btn.id = 'n20-read-toggle';
    btn.onclick = function () {
      readApi.toggle(page.id);
      schedulePush();
    };
    anchor.appendChild(btn);
    dom.readBtn = btn;
    paintReadBtn();
    bus.on('read', paintReadBtn);
  }

  function paintReadBtn() {
    if (!dom.readBtn) return;
    var on = readApi.is(page.id);
    dom.readBtn.classList.toggle('on', on);
    dom.readBtn.innerHTML = on ? '✓ 已读 <span style="opacity:.65;font-weight:400">（点击取消）</span>' : '○ 标记已读';
  }

  /* ================= 12. ✎ 区块笔记按钮（文档页） ================= */

  function initSectionButtons() {
    $$('.shead').forEach(function (sh, idx) {
      var b = el('button', 'n20-chip', '✎');
      b.title = '记录「' + (page.sections[idx] ? page.sections[idx].title : '') + '」的笔记';
      b.style.cssText = 'margin-left:auto;border-radius:8px;padding:2px 9px;font-size:12px';
      b.onclick = function () {
        ui.cur = page.sections[idx];
        openPanel('doc');
      };
      sh.appendChild(b);
    });
  }

  /* ================= 13. 主页：已读徽章 + 进度 ================= */

  var homeIds = [];

  function homeDocIds() {
    if (homeIds.length) return homeIds;
    $$('a.row[href], a.fcard[href]').forEach(function (a) {
      var href = a.getAttribute('href') || '';
      if (/\.html?$/.test(href) && href.indexOf('://') < 0 && href.indexOf('#') < 0 &&
          homeIds.indexOf(href) < 0) homeIds.push(href);
    });
    return homeIds;
  }

  function initHomeBadges() {
    homeDocIds();
    $$('a.row[href], a.fcard[href]').forEach(function (a) {
      var href = a.getAttribute('href') || '';
      if (homeIds.indexOf(href) < 0) return;
      var badge = el('span', 'n20-rb', '✓ 已读');
      badge.dataset.fn = href;
      badge.hidden = true;
      var arr = a.querySelector('.rarr');
      if (arr) a.insertBefore(badge, arr); else a.appendChild(badge);
    });
    // 主页 hero 追加已读进度
    var stats = document.querySelector('.stats');
    if (stats && !document.getElementById('n20-hstat')) {
      var st = el('div', 'stat');
      st.id = 'n20-hstat';
      st.innerHTML = '<span class="n" id="n20-hstat-n">0</span><span class="l">已读进度</span>';
      stats.appendChild(st);
      var pg = el('div', 'n20-progress');
      pg.id = 'n20-hpg';
      var fill = el('i');
      pg.appendChild(fill);
      stats.parentNode.insertBefore(pg, stats.nextSibling);
    }
    paintHomeBadges();
    bus.on('read', paintHomeBadges);
    bus.on('notes', paintCounts);
    window.addEventListener('storage', function (e) {
      if (e.key === K.read || e.key === K.notes) { paintHomeBadges(); paintCounts(); }
    });
  }

  function paintHomeBadges() {
    if (!page.isHome) return;
    $$('.n20-rb').forEach(function (b) { b.hidden = !readApi.is(b.dataset.fn); });
    $$('a.row[href], a.fcard[href]').forEach(function (a) {
      var href = a.getAttribute('href') || '';
      if (homeIds.indexOf(href) < 0) return;
      a.classList.toggle('n20-read', readApi.is(href));
    });
    var n = $('#n20-hstat-n');
    if (n) n.textContent = readApi.count(homeIds) + '/' + homeIds.length;
    var pg = $('#n20-hpg');
    if (pg && pg.firstChild) {
      pg.firstChild.style.width = (homeIds.length ? Math.round(readApi.count(homeIds) / homeIds.length * 100) : 0) + '%';
    }
  }

  /* ================= 14. 计数徽章 ================= */

  function paintCounts() {
    var n = notesApi.count();
    if (dom.cnt) {
      dom.cnt.hidden = n === 0;
      dom.cnt.textContent = n > 99 ? '99+' : n;
    }
    if (dom.allc) {
      dom.allc.hidden = n === 0;
      dom.allc.textContent = n > 99 ? '99+' : n;
    }
  }

  /* ================= 15. 启动 ================= */

  function handleHash() {
    if (!page.isDoc) return;
    var h = (location.hash || '').replace(/^#/, '');
    if (!h) return;
    var sec = page.sections.filter(function (s) { return s.secId === h; })[0];
    if (sec) {
      setTimeout(function () {
        ui.cur = sec;
        openPanel('doc');
        var t = document.getElementById(h);
        if (t) t.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 350);
    }
  }

  function maybeAutoPull() {
    var c = gh.cfg();
    if (!c.auto || !c.token || !c.gistId) return;
    debounce(function () {
      gh.pull().then(function () {
        paintCounts(); paintHomeBadges(); paintReadBtn();
      }, function () { /* 静默失败，不打扰用户 */ });
    }, 1500)();
    window.addEventListener('focus', function () {
      var cc = gh.cfg();
      if (cc.auto && cc.token && cc.gistId && Date.now() - (cc.lastPull || 0) > 60000) {
        cc.lastPull = Date.now();
        gh.saveCfg(cc);
        gh.pull().then(function () { paintCounts(); paintHomeBadges(); }, function () {});
      }
    });
  }

  function boot() {
    injectCSS();
    page.id = docId();
    page.title = docTitle();
    page.isDoc = $$('.shead').length > 0;
    page.isHome = !page.isDoc;
    if (page.isDoc) page.sections = collectSections(page.id);

    buildPanel();
    buildFab();
    if (page.isDoc) { initReadBtn(); initSectionButtons(); }
    if (page.isHome) initHomeBadges();

    bus.on('read', function () { paintReadBtn(); });
    bus.on('notes', paintCounts);
    paintCounts();

    handleHash();
    maybeAutoPull();

    // 离开页面前强制落盘待存笔记（防抖内容不丢）
    window.addEventListener('beforeunload', flushAutosave);
    window.addEventListener('pagehide', flushAutosave);

    // 跨标签页同步（storage 事件在文档页同样生效）
    window.addEventListener('storage', function (e) {
      if (e.key === K.read) { paintReadBtn(); if (page.isHome) paintHomeBadges(); }
      if (e.key === K.notes && page.isHome) paintHomeBadges();
    });

    setStatus(page.isDoc ? '笔记自动保存在本机浏览器' : '点右下角 ✎ 查看全部笔记');
  }

  /* ================= 导出 ================= */

  return {
    version: '1.0.0',
    boot: boot,
    md: md,
    esc: esc,
    sanitizeUrl: sanitizeUrl,
    mergeRecords: mergeRecords,
    mergeRead: mergeRead,
    read: readApi,
    notes: notesApi,
    gh: gh,
    keys: K
  };
});
