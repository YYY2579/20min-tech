/* 端到端冒烟测试：notes-core.js 悬浮笔记 + 已读功能（一章多条笔记模型） */
'use strict';
var http = require('http');
var fs = require('fs');
var path = require('path');
var pw = require('playwright');

var ROOT = __dirname;
var MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css' };

var server = http.createServer(function (req, res) {
  var p = decodeURIComponent(req.url.split('?')[0]);
  if (p === '/') p = '/index.html';
  var file = path.join(ROOT, p);
  fs.readFile(file, function (err, data) {
    if (err) { res.writeHead(404); res.end('nf'); return; }
    res.writeHead(200, { 'Content-Type': MIME[path.extname(file)] || 'application/octet-stream' });
    res.end(data);
  });
});

var pass = 0, fail = 0;
function check(name, cond, extra) {
  if (cond) { pass++; console.log('  ok - ' + name); }
  else { fail++; console.log('  FAIL - ' + name + (extra ? ' | ' + extra : '')); }
}

server.listen(8899, '127.0.0.1', async function () {
  var browser;
  try {
    browser = await pw.chromium.launch({ headless: true });
    var ctx = await browser.newContext();
    var page = await ctx.newPage();
    var errors = [];
    page.on('pageerror', function (e) { errors.push(String(e)); });
    page.on('console', function (m) { if (m.type() === 'error') errors.push(m.text()); });
    page.on('dialog', function (d) { d.accept(); });

    var base = 'http://127.0.0.1:8899';
    var M3 = '04-data/redis.html#m3';
    var SUM = '04-data/redis.html#__summary__';

    // —— 工具函数 ——
    async function openSection(titlePart) {
      var chips = await page.$$('#n20-body .n20-chip');
      for (var i = 0; i < chips.length; i++) {
        if ((await chips[i].textContent()).indexOf(titlePart) >= 0) { await chips[i].click(); return true; }
      }
      return false;
    }
    async function clickNewNote() {
      await page.click('#n20-body .n20-btn.new');
      await page.waitForTimeout(200);
    }
    async function writeNote(text) {
      await page.fill('.n20-ta', text);
      await page.waitForTimeout(1100); // 等自动保存
    }
    /* 按按钮文字点击工具栏按钮，避免索引错位 */
    async function clickToolbar(part) {
      var btns = await page.$$('#n20-body .n20-toolbar .n20-btn');
      for (var i = 0; i < btns.length; i++) {
        if ((await btns[i].textContent()).indexOf(part) >= 0) { await btns[i].click(); return true; }
      }
      return false;
    }
    async function notesOf(prefix) {
      return await page.evaluate(function (p) {
        var n = JSON.parse(localStorage.getItem('20min.notes.v1') || '{}');
        var out = [];
        for (var k in n) if (k.indexOf(p + '#n') === 0) out.push(n[k]);
        return out;
      }, prefix);
    }

    /* ---------- 1. 文档页基础 ---------- */
    console.log('== 文档页 ==');
    await page.goto(base + '/04-data/redis.html');
    await page.waitForTimeout(400);

    check('FAB 悬浮按钮出现', await page.$('#n20-fab') !== null);
    check('已读按钮注入芯片行', await page.$('#n20-read-toggle') !== null);
    var penCount = await page.$$eval('.shead button.n20-chip', function (els) { return els.length; });
    check('每个模块标题有 ✎ 按钮 (' + penCount + ' 个)', penCount === 15, '期望 15');

    check('初始未读状态', (await page.textContent('#n20-read-toggle')).indexOf('标记已读') >= 0);
    await page.click('#n20-read-toggle');
    await page.waitForTimeout(150);
    check('点击后变为已读', (await page.textContent('#n20-read-toggle')).indexOf('已读') >= 0);
    var readStore = await page.evaluate(function () { return JSON.parse(localStorage.getItem('20min.read.v1') || '{}'); });
    check('已读写入 localStorage', !!readStore['04-data/redis.html'], JSON.stringify(readStore));

    /* ---------- 2. 写第一条笔记 ---------- */
    console.log('== 写笔记（第一条） ==');
    await page.click('#n20-fab');
    await page.waitForTimeout(300);
    check('抽屉打开', await page.$eval('#n20-panel', function (e) { return e.classList.contains('on'); }));
    check('打开后是章节笔记列表视图', await page.$('#n20-body .n20-toolbar .n20-btn.pri') !== null);

    check('找到模块 3 的 chip', await openSection('四种高级结构'));
    await page.waitForTimeout(150);
    check('空章节显示引导', (await page.textContent('#n20-body')).indexOf('这一节还没有笔记') >= 0);

    await clickNewNote();
    var noteText = '# 模块3要点\n- **HyperLogLog** 跑过一遍\n- [x] 搞懂 Bitmap\n- [ ] 手写布隆过滤器\n\n| 结构 | 场景 |\n| --- | --- |\n| ZSet | 排行榜 |';
    await writeNote(noteText);

    var m3notes = await notesOf(M3);
    check('模块3 第一条笔记自动保存', m3notes.length === 1 && m3notes[0].text.indexOf('HyperLogLog') >= 0,
      '实际 ' + m3notes.length + ' 条');
    check('笔记带章节元数据', m3notes.length === 1 && m3notes[0].sec === '四种高级结构' && m3notes[0].secId === 's3',
      JSON.stringify(m3notes[0] && { sec: m3notes[0].sec, secId: m3notes[0].secId }));
    check('FAB 出现计数徽章', await page.$eval('#n20-cnt', function (e) { return !e.hidden && e.textContent === '1'; }));
    check('chip 显示条数', (await page.textContent('#n20-body .n20-chips')).indexOf('四种高级结构 ·1') >= 0);

    // 返回列表应看到这一条
    await clickToolbar('列表');
    await page.waitForTimeout(250);
    var listCount = await page.$$eval('#n20-body .n20-item', function (els) { return els.length; });
    check('列表视图显示 1 条笔记', listCount === 1, '实际 ' + listCount);

    /* ---------- 3. 同一章节写第二条（用户核心需求） ---------- */
    console.log('== 同一章节多条笔记 ==');
    await clickNewNote();
    await writeNote('## 第二条笔记\nBitmap 的位宽计算：2^32 位 = 512MB。');
    m3notes = await notesOf(M3);
    check('模块3 现有 2 条笔记', m3notes.length === 2, '实际 ' + m3notes.length);
    check('两条内容各自独立', m3notes[0].text.indexOf('HyperLogLog') >= 0 && m3notes[1].text.indexOf('Bitmap 的位宽') >= 0);

    var backBtn2 = await clickToolbar('列表');  // ← 列表
    await page.waitForTimeout(250);
    listCount = await page.$$eval('#n20-body .n20-item', function (els) { return els.length; });
    check('列表视图显示 2 条', listCount === 2, '实际 ' + listCount);
    check('chip 显示 ·2', (await page.textContent('#n20-body .n20-chips')).indexOf('四种高级结构 ·2') >= 0);

    // 全部 tab 里该章节也应是 2 条
    await page.click('#n20-tabs button[data-tab="all"]');
    await page.waitForTimeout(300);
    var allM3 = await page.$$eval('#n20-list .n20-item', function (els) {
      return els.filter(function (e) { return e.textContent.indexOf('四种高级结构') >= 0; }).length;
    });
    check('全部列表该章节 2 条', allM3 === 2, '实际 ' + allM3);

    /* ---------- 4. 编辑现有笔记：原地更新不新增 ---------- */
    console.log('== 编辑现有笔记 ==');
    await page.click('#n20-tabs button[data-tab="doc"]');
    await page.waitForTimeout(250);
    check('回到模块3', await openSection('四种高级结构'));
    await page.waitForTimeout(200);
    // 点第一条笔记进入编辑
    await page.click('#n20-body .n20-item');
    await page.waitForTimeout(250);
    var taVal0 = await page.inputValue('.n20-ta');
    check('打开的是第一条笔记', taVal0.indexOf('HyperLogLog') >= 0, taVal0.slice(0, 30));
    await page.fill('.n20-ta', taVal0 + '\n\n补充：Sorted Set 还能做延时队列。');
    await page.waitForTimeout(1100);
    m3notes = await notesOf(M3);
    check('编辑后仍是 2 条（原地更新）', m3notes.length === 2, '实际 ' + m3notes.length);
    check('第一条内容已更新', m3notes[0].text.indexOf('延时队列') >= 0);
    check('第二条内容不受影响', m3notes[1].text.indexOf('Bitmap 的位宽') >= 0);

    /* ---------- 5. 总结也可多条 ---------- */
    console.log('== 总结多条 ==');
    check('找到总结 chip', await openSection('本篇总结'));
    await page.waitForTimeout(150);
    await clickNewNote();
    await writeNote('第一次总结：Redis 是内存数据库。');
    await clickNewNote();
    await writeNote('第二次总结：五种结构打天下，注意 bigkey。');
    var sumNotes = await notesOf(SUM);
    check('总结现有 2 条', sumNotes.length === 2, '实际 ' + sumNotes.length);
    check('总结内容独立', sumNotes[0].text.indexOf('内存数据库') >= 0 && sumNotes[1].text.indexOf('bigkey') >= 0);

    /* ---------- 6. Markdown 预览 ---------- */
    console.log('== Markdown 预览 ==');
    check('回到模块3', await openSection('四种高级结构'));
    await page.waitForTimeout(200);
    await page.click('#n20-body .n20-item');   // 打开第一条
    await page.waitForTimeout(250);
    await clickToolbar('预览');  // 预览
    await page.waitForTimeout(250);
    var pvHtml = await page.$eval('.n20-pv', function (e) { return e.innerHTML; });
    check('预览渲染标题/加粗', pvHtml.indexOf('<h1>模块3要点</h1>') >= 0 && pvHtml.indexOf('<strong>HyperLogLog</strong>') >= 0);
    check('预览渲染待办复选框', pvHtml.indexOf('type="checkbox" disabled="" checked=""') >= 0 &&
      pvHtml.indexOf('<input type="checkbox" disabled="">') >= 0, pvHtml.slice(0, 120));
    check('预览渲染表格', pvHtml.indexOf('<table>') >= 0 && pvHtml.indexOf('<td>排行榜</td>') >= 0);

    /* ---------- 7. 回归：预览/编辑切换不丢笔记 ---------- */
    console.log('== 预览/编辑切换回归 ==');
    await clickToolbar('编辑');  // → 编辑
    await page.waitForTimeout(300);
    var m3n = await notesOf(M3);
    check('切回编辑后 2 条笔记都在', m3n.length === 2, '实际 ' + m3n.length);
    var taVal = await page.inputValue('.n20-ta');
    check('编辑器内容完整恢复', taVal.indexOf('HyperLogLog') >= 0 && taVal.indexOf('延时队列') >= 0, taVal.slice(0, 40));
    await clickToolbar('预览');  // → 预览
    await page.waitForTimeout(250);
    await page.keyboard.press('Control+s');
    await page.waitForTimeout(400);
    m3n = await notesOf(M3);
    check('预览态 Ctrl+S 不丢笔记', m3n.length === 2 && m3n[0].text.indexOf('延时队列') >= 0);

    // 关面板再刷新，验证持久化
    await page.click('#n20-x');
    await page.waitForTimeout(200);
    await page.goto(base + '/04-data/redis.html');
    await page.waitForTimeout(500);
    m3n = await notesOf(M3);
    check('刷新后 2 条笔记持久', m3n.length === 2, '实际 ' + m3n.length);

    /* ---------- 8. 回归：反复保存不产生重复条目 ---------- */
    console.log('== 反复保存无重复 ==');
    await page.click('#n20-fab'); await page.waitForTimeout(300);
    check('回到模块3', await openSection('四种高级结构'));
    await page.waitForTimeout(200);
    await page.click('#n20-body .n20-item');
    await page.waitForTimeout(250);
    await clickToolbar('保存'); await page.waitForTimeout(150);   // 保存
    await clickToolbar('预览'); await page.waitForTimeout(200);    // 预览
    await clickToolbar('编辑'); await page.waitForTimeout(200);    // 编辑
    await clickToolbar('保存'); await page.waitForTimeout(150);  // 再保存
    m3n = await notesOf(M3);
    check('多次保存后仍 2 条', m3n.length === 2, '实际 ' + m3n.length);

    /* ---------- 9. 回归：删除单条 ---------- */
    console.log('== 删除单条 ==');
    await clickToolbar('列表');  // ← 列表
    await page.waitForTimeout(250);
    var delBtn = await page.$('#n20-body .n20-item .del');
    check('列表每条都有删除按钮', delBtn !== null);
    await delBtn.click();   // 删第一条（最早的）
    await page.waitForTimeout(400);
    m3n = await notesOf(M3);
    check('删除后该章节剩 1 条', m3n.length === 1 && m3n[0].text.indexOf('Bitmap 的位宽') >= 0,
      '实际 ' + m3n.length);

    /* ---------- 10. 回归：700ms 内快速切换模块不串写 ---------- */
    console.log('== 快速切换模块不串写 ==');
    check('切到模块1', await openSection('为什么 Redis 这么快'));
    await page.waitForTimeout(200);
    await clickNewNote();
    await page.fill('.n20-ta', '模块1的专属内容-单线程IO多路复用');
    await page.waitForTimeout(1100);
    check('切到模块3', await openSection('四种高级结构'));
    await page.waitForTimeout(200);
    await clickNewNote();
    await page.fill('.n20-ta', '模块3新笔记-别被串写成模块1');
    await page.waitForTimeout(100); // 故意不满足 700ms 防抖
    check('切到总结', await openSection('本篇总结'));
    await page.waitForTimeout(1200);
    var cross = await page.evaluate(function () {
      function texts(p) {
        var n = JSON.parse(localStorage.getItem('20min.notes.v1') || '{}');
        var out = [];
        for (var k in n) if (k.indexOf(p + '#n') === 0) out.push(n[k].text);
        return out.join('||');
      }
      return { m1: texts('04-data/redis.html#m1'), m3: texts('04-data/redis.html#m3'), sum: texts('04-data/redis.html#__summary__') };
    });
    check('模块1 内容未被污染', cross.m1.indexOf('单线程IO多路复用') >= 0 && cross.m1.indexOf('别被串写') < 0, cross.m1.slice(0, 30));
    check('模块3 新笔记落盘到自己的章节', cross.m3.indexOf('别被串写成模块1') >= 0, cross.m3.slice(0, 30));
    check('总结区块未被误写', cross.sum.indexOf('别被串写') < 0);

    /* ---------- 11. 全部 tab 搜索 ---------- */
    console.log('== 全部笔记 tab ==');
    await page.click('#n20-tabs button[data-tab="all"]');
    await page.waitForTimeout(300);
    var total = await page.evaluate(function () { return Object.keys(JSON.parse(localStorage.getItem('20min.notes.v1') || '{}')).length; });
    var allCount = await page.$$eval('#n20-list .n20-item', function (els) { return els.length; });
    check('全部列表条目数 = 存储笔记数', allCount === total, total + ' vs ' + allCount);
    var firstDoc = await page.textContent('#n20-list .n20-item .doc');
    check('列表显示文档名', firstDoc.indexOf('Redis') >= 0, firstDoc);
    await page.fill('.n20-search', 'bigkey');
    await page.waitForTimeout(200);
    var filtered = await page.$$eval('#n20-list .n20-item', function (els) { return els.length; });
    check('搜索过滤生效', filtered === 1, '实际 ' + filtered);
    await page.fill('.n20-search', '');
    await page.waitForTimeout(200);

    /* ---------- 12. 设置 tab ---------- */
    console.log('== 设置 ==');
    await page.click('#n20-tabs button[data-tab="cfg"]');
    await page.waitForTimeout(250);
    check('Token 输入框存在', await page.$('#n20-body input[type=password]') !== null);
    check('同步按钮存在', (await page.textContent('#n20-body')).indexOf('立即同步') >= 0);
    check('导出按钮存在', (await page.textContent('#n20-body')).indexOf('导出 JSON') >= 0);
    var usage = await page.textContent('#n20-usage');
    check('存储用量显示', usage.indexOf('本地存储用量约') >= 0, usage);

    /* ---------- 13. 主页徽章与总进度 ---------- */
    console.log('== 主页 ==');
    await page.goto(base + '/index.html');
    await page.waitForTimeout(400);
    var badgeVisible = await page.$eval('a.row[href="04-data/redis.html"] .n20-rb', function (e) { return !e.hidden; });
    check('主页该行显示已读徽章', badgeVisible === true);
    var rowClass = await page.$eval('a.row[href="04-data/redis.html"]', function (e) { return e.classList.contains('n20-read'); });
    check('主页该行打已读标记', rowClass === true);
    var heroStat = await page.textContent('#n20-hstat-n');
    check('主页总进度 1/198', heroStat === '1/198', heroStat);
    var pgWidth = await page.$eval('#n20-hpg i', function (e) { return e.style.width; });
    check('进度条宽度>0', pgWidth && pgWidth !== '0%', pgWidth);
    check('主页 FAB 仍在', await page.$('#n20-fab') !== null);
    await page.click('#n20-fab');
    await page.waitForTimeout(250);
    check('主页打开面板默认全部 tab', await page.$eval('#n20-tabs button[data-tab=all]', function (e) { return e.classList.contains('on'); }));
    var homeAll = await page.$$eval('#n20-list .n20-item', function (els) { return els.length; });
    check('主页也能看到全部笔记', homeAll === total, homeAll + ' vs ' + total);

    /* ---------- 14. 深链 ---------- */
    console.log('== 深链 ==');
    await page.goto(base + '/04-data/redis.html#s3');
    await page.waitForTimeout(900);
    check('带 #s3 打开自动展开该模块', await page.$eval('#n20-panel', function (e) { return e.classList.contains('on'); }));
    check('定位到模块3 列表', (await page.textContent('#n20-body .n20-chips')).indexOf('四种高级结构') >= 0);

    /* ---------- 15. 旧版数据迁移 ---------- */
    console.log('== 旧版单条数据迁移 ==');
    await page.evaluate(function () {
      var n = JSON.parse(localStorage.getItem('20min.notes.v1') || '{}');
      n['04-data/redis.html#m1'] = { text: '旧版单条格式的遗留笔记', updatedAt: 1700000000000, doc: '04-data/redis.html', docTitle: 'Redis', sec: '为什么 Redis 这么快', secId: 's1' };
      localStorage.setItem('20min.notes.v1', JSON.stringify(n));
    });
    await page.goto(base + '/04-data/redis.html');
    await page.waitForTimeout(500);
    var legacy = await page.evaluate(function () {
      var n = JSON.parse(localStorage.getItem('20min.notes.v1') || '{}');
      var hasLegacyKey = !!n['04-data/redis.html#m1'];
      var migrated = [];
      for (var k in n) if (k.indexOf('04-data/redis.html#m1#n') === 0) migrated.push(n[k]);
      return { hasLegacyKey: hasLegacyKey, migrated: migrated };
    });
    check('旧 key 被迁移（无残留旧格式）', legacy.hasLegacyKey === false && legacy.migrated.length >= 1,
      JSON.stringify({ hasLegacyKey: legacy.hasLegacyKey, n: legacy.migrated.length }));
    check('迁移后内容不丢', legacy.migrated.some(function (r) { return r.text.indexOf('遗留笔记') >= 0; }));
    // 迁移后的笔记应能在 UI 里编辑
    await page.click('#n20-fab'); await page.waitForTimeout(300);
    check('切到模块1 看到迁移的笔记', await openSection('为什么 Redis 这么快'));
    await page.waitForTimeout(200);
    var m1items = await page.$$eval('#n20-body .n20-item', function (els) { return els.length; });
    check('模块1 列表含迁移笔记', m1items >= 1, '实际 ' + m1items);
    await page.click('#n20-body .n20-item');
    await page.waitForTimeout(250);
    check('迁移笔记可编辑', (await page.inputValue('.n20-ta')).indexOf('遗留笔记') >= 0);

    /* ---------- 16. XSS 防护 ---------- */
    console.log('== XSS 防护 ==');
    await page.evaluate(function () {
      var n = JSON.parse(localStorage.getItem('20min.notes.v1') || '{}');
      n['04-data/redis.html#m2#nXSS1'] = { text: '<img src=x onerror=window.__xss=1> [c](javascript:window.__xss2=1)', updatedAt: Date.now(), doc: '04-data/redis.html', docTitle: 'Redis', sec: '五种基本数据结构', secId: 's2' };
      localStorage.setItem('20min.notes.v1', JSON.stringify(n));
    });
    await page.goto(base + '/04-data/redis.html');
    await page.waitForTimeout(400);
    await page.click('#n20-fab');
    await page.waitForTimeout(250);
    await page.click('#n20-tabs button[data-tab="all"]');
    await page.waitForTimeout(250);
    check('笔记中的 HTML 被转义（无 img 注入）', await page.evaluate(function () { return !window.__xss; }));
    check('javascript: 链接被拦截', await page.evaluate(function () { return !window.__xss2; }));
    var itemHtml = await page.$eval('#n20-list .n20-item', function (e) { return e.innerHTML; });
    check('列表摘要为纯文本', itemHtml.indexOf('<img') < 0);

    /* ---------- 17. 控制台干净 ---------- */
    console.log('== 控制台 ==');
    var realErrors = errors.filter(function (e) { return e.indexOf('favicon') < 0 && e.indexOf('net::ERR') < 0; });
    check('无 JS 报错', realErrors.length === 0, realErrors.slice(0, 3).join(' ; '));

    /* ---------- 18. 取消已读 ---------- */
    console.log('== 取消已读 ==');
    await page.goto(base + '/04-data/redis.html');
    await page.waitForTimeout(400);
    await page.click('#n20-read-toggle');
    await page.waitForTimeout(150);
    check('再点一次取消已读', (await page.textContent('#n20-read-toggle')).indexOf('标记已读') >= 0);
    await page.goto(base + '/index.html');
    await page.waitForTimeout(400);
    check('主页徽章同步消失', await page.$eval('a.row[href="04-data/redis.html"] .n20-rb', function (e) { return e.hidden; }));

  } catch (e) {
    fail++;
    console.log('  FAIL - 测试框架异常: ' + e.message);
  } finally {
    if (browser) await browser.close();
    server.close();
    console.log('\n结果: ' + pass + ' 通过, ' + fail + ' 失败');
    process.exit(fail ? 1 : 0);
  }
});
