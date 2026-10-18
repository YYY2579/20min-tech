/* 端到端冒烟测试：notes-core.js 悬浮笔记 + 已读功能 */
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

    var base = 'http://127.0.0.1:8899';

    /* ---------- 1. 文档页：悬浮UI与已读按钮 ---------- */
    console.log('== 文档页 ==');
    await page.goto(base + '/04-data/redis.html');
    await page.waitForTimeout(400);

    check('FAB 悬浮按钮出现', await page.$('#n20-fab') !== null);
    check('已读按钮注入芯片行', await page.$('.density #n20-read-toggle') !== null);
    var penCount = await page.$$eval('.shead button.n20-chip', function (els) { return els.length; });
    check('每个模块标题有 ✎ 按钮 (' + penCount + ' 个)', penCount === 15, '期望 15');

    check('初始未读状态', (await page.textContent('#n20-read-toggle')).indexOf('标记已读') >= 0);
    await page.click('#n20-read-toggle');
    await page.waitForTimeout(150);
    check('点击后变为已读', (await page.textContent('#n20-read-toggle')).indexOf('已读') >= 0);
    var readStore = await page.evaluate(function () { return JSON.parse(localStorage.getItem('20min.read.v1') || '{}'); });
    check('已读写入 localStorage', !!readStore['04-data/redis.html'], JSON.stringify(readStore));

    /* ---------- 2. 记笔记：模块 + 总结 ---------- */
    console.log('== 记笔记 ==');
    await page.click('#n20-fab');
    await page.waitForTimeout(300);
    check('抽屉打开', await page.$eval('#n20-panel', function (e) { return e.classList.contains('on'); }));

    // 选中「模块 3」chip
    var chips = await page.$$('#n20-body .n20-chip');
    var target = null;
    for (var i = 0; i < chips.length; i++) {
      var txt = await chips[i].textContent();
      if (txt.indexOf('四种高级结构') >= 0) { target = chips[i]; break; }
    }
    check('找到模块 3 的 chip', target !== null);
    await target.click();
    await page.waitForTimeout(150);

    var noteText = '# 模块3要点\n- **HyperLogLog** 跑过一遍\n- [x] 搞懂 Bitmap\n- [ ] 手写布隆过滤器\n\n| 结构 | 场景 |\n| --- | --- |\n| ZSet | 排行榜 |';
    await page.fill('.n20-ta', noteText);
    await page.waitForTimeout(1100); // 等自动保存（debounce 700ms）

    var notesStore = await page.evaluate(function () { return JSON.parse(localStorage.getItem('20min.notes.v1') || '{}'); });
    var key = '04-data/redis.html#m3';
    check('模块笔记自动保存到 localStorage', !!notesStore[key] && notesStore[key].text.indexOf('HyperLogLog') >= 0,
      Object.keys(notesStore).join(','));
    check('笔记带章节元数据', notesStore[key] && notesStore[key].sec === '四种高级结构' && notesStore[key].secId === 's3',
      JSON.stringify(notesStore[key] && { sec: notesStore[key].sec, secId: notesStore[key].secId }));
    check('FAB 出现计数徽章', await page.$eval('#n20-cnt', function (e) { return !e.hidden && e.textContent === '1'; }));

    // 写一篇总结
    var sumChip = await page.$$('#n20-body .n20-chip');
    for (var j = 0; j < sumChip.length; j++) {
      var t2 = await sumChip[j].textContent();
      if (t2.indexOf('本篇总结') >= 0) { await sumChip[j].click(); break; }
    }
    await page.fill('.n20-ta', 'Redis 一句话：**内存数据库**，五种结构打天下。');
    await page.waitForTimeout(1100);
    notesStore = await page.evaluate(function () { return JSON.parse(localStorage.getItem('20min.notes.v1') || '{}'); });
    check('本篇总结也保存', !!notesStore['04-data/redis.html#__summary__']);

    /* ---------- 3. Markdown 预览 ---------- */
    console.log('== Markdown 预览 ==');
    await page.click('#n20-x'); // ✕ 关闭抽屉
    await page.waitForTimeout(200);
    // 重新打开并选回模块3
    await page.click('#n20-fab');
    await page.waitForTimeout(250);
    chips = await page.$$('#n20-body .n20-chip');
    for (var k = 0; k < chips.length; k++) {
      var t3 = await chips[k].textContent();
      if (t3.indexOf('四种高级结构') >= 0) { await chips[k].click(); break; }
    }
    await page.waitForTimeout(150);
    var pvBtn = await page.$$('#n20-body .n20-toolbar .n20-btn');
    await pvBtn[0].click(); // 预览
    await page.waitForTimeout(250);
    var pvHtml = await page.$eval('.n20-pv', function (e) { return e.innerHTML; });
    check('预览渲染标题/加粗', pvHtml.indexOf('<h1>模块3要点</h1>') >= 0 && pvHtml.indexOf('<strong>HyperLogLog</strong>') >= 0);
    check('预览渲染待办复选框', pvHtml.indexOf('type="checkbox" disabled="" checked=""') >= 0 &&
      pvHtml.indexOf('<input type="checkbox" disabled="">') >= 0, pvHtml.slice(0, 120));
    check('预览渲染表格', pvHtml.indexOf('<table>') >= 0 && pvHtml.indexOf('<td>排行榜</td>') >= 0);

    /* ---------- 3b. 回归：预览/编辑来回切换、预览态保存，都绝不能丢笔记 ---------- */
    console.log('== 预览/编辑切换回归（用户报的数据丢失 bug） ==');
    // 注意：每次 renderDocTab 会重建工具栏，必须重新查询按钮
    var pvBtn2 = await page.$$('#n20-body .n20-toolbar .n20-btn');
    await pvBtn2[0].click(); // 预览 → 编辑
    await page.waitForTimeout(300);
    notesStore = await page.evaluate(function () { return JSON.parse(localStorage.getItem('20min.notes.v1') || '{}'); });
    check('切回编辑后笔记仍在', !!notesStore[key] && notesStore[key].text.indexOf('HyperLogLog') >= 0);
    var taVal = await page.inputValue('.n20-ta');
    check('编辑器内容完整恢复', taVal.indexOf('HyperLogLog') >= 0 && taVal.indexOf('排行榜') >= 0, taVal.slice(0, 40));

    pvBtn2 = await page.$$('#n20-body .n20-toolbar .n20-btn');
    await pvBtn2[0].click(); // 编辑 → 预览
    await page.waitForTimeout(250);
    await page.keyboard.press('Control+s'); // 预览态下按保存
    await page.waitForTimeout(400);
    notesStore = await page.evaluate(function () { return JSON.parse(localStorage.getItem('20min.notes.v1') || '{}'); });
    check('预览态 Ctrl+S 不丢笔记', !!notesStore[key] && notesStore[key].text.indexOf('HyperLogLog') >= 0);

    // 直接关面板再打开，验证持久化
    await page.click('#n20-x');
    await page.waitForTimeout(200);
    await page.goto(base + '/04-data/redis.html');
    await page.waitForTimeout(500);
    await page.click('#n20-fab');
    await page.waitForTimeout(300);
    chips = await page.$$('#n20-body .n20-chip');
    for (var m = 0; m < chips.length; m++) {
      if ((await chips[m].textContent()).indexOf('四种高级结构') >= 0) { await chips[m].click(); break; }
    }
    await page.waitForTimeout(200);
    taVal = await page.inputValue('.n20-ta');
    check('刷新页面后笔记持久完整', taVal.indexOf('HyperLogLog') >= 0 && taVal.indexOf('排行榜') >= 0, taVal.slice(0, 40));

    /* ---------- 4. 全部 tab ---------- */
    console.log('== 全部笔记 ==');
    await page.click('#n20-tabs button[data-tab="all"]');
    await page.waitForTimeout(250);
    var allCount = await page.$$eval('#n20-list .n20-item', function (els) { return els.length; });
    check('全部列表 2 条笔记', allCount === 2, '实际 ' + allCount);
    var firstDoc = await page.textContent('#n20-list .n20-item .doc');
    check('列表显示文档名', firstDoc.indexOf('Redis') >= 0, firstDoc);
    var firstSec = await page.textContent('#n20-list .n20-item .sec');
    check('列表显示章节名', firstSec.indexOf('高级结构') >= 0, firstSec);
    await page.fill('.n20-search', '排行榜');
    await page.waitForTimeout(200);
    var filtered = await page.$$eval('#n20-list .n20-item', function (els) { return els.length; });
    check('搜索过滤生效', filtered === 1, '实际 ' + filtered);
    await page.fill('.n20-search', '');
    await page.waitForTimeout(200);

    /* ---------- 5. 设置 tab ---------- */
    console.log('== 设置 ==');
    await page.click('#n20-tabs button[data-tab="cfg"]');
    await page.waitForTimeout(250);
    check('Token 输入框存在', await page.$('#n20-body input[type=password]') !== null);
    check('同步按钮存在', (await page.textContent('#n20-body')).indexOf('立即同步') >= 0);
    check('导出按钮存在', (await page.textContent('#n20-body')).indexOf('导出 JSON') >= 0);
    var usage = await page.textContent('#n20-usage');
    check('存储用量显示', usage.indexOf('本地存储用量约') >= 0, usage);

    /* ---------- 6. 主页徽章与总进度 ---------- */
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

    /* ---------- 7. 深链：从笔记跳到章节 ---------- */
    console.log('== 深链 ==');
    await page.goto(base + '/04-data/redis.html#s3');
    await page.waitForTimeout(900);
    check('带 #s2 打开自动展开该模块笔记', await page.$eval('#n20-panel', function (e) { return e.classList.contains('on'); }));
    var curChip = await page.$$eval('#n20-body .n20-chip.on', function (els) { return els.length ? els[0].textContent : ''; });
    check('定位到模块 3', curChip.indexOf('四种高级结构') >= 0, curChip);

    /* ---------- 8. XSS 防护 ---------- */
    console.log('== XSS 防护 ==');
    await page.evaluate(function () {
      var n = JSON.parse(localStorage.getItem('20min.notes.v1') || '{}');
      n['04-data/redis.html#m1'] = { text: '<img src=x onerror=window.__xss=1> [c](javascript:window.__xss2=1)', updatedAt: Date.now(), doc: '04-data/redis.html', docTitle: 'Redis', sec: '为什么快', secId: 's1' };
      localStorage.setItem('20min.notes.v1', JSON.stringify(n));
    });
    await page.goto(base + '/04-data/redis.html');
    await page.waitForTimeout(400);
    await page.click('#n20-fab');
    await page.waitForTimeout(250);
    await page.click('#n20-tabs button[data-tab="all"]');
    await page.waitForTimeout(250);
    var xss1 = await page.evaluate(function () { return !!window.__xss; });
    var xss2 = await page.evaluate(function () { return !!window.__xss2; });
    check('笔记中的 HTML 被转义（无 img 注入）', xss1 === false);
    check('javascript: 链接被拦截', xss2 === false);
    var itemHtml = await page.$eval('#n20-list .n20-item', function (e) { return e.innerHTML; });
    check('列表摘要为纯文本', itemHtml.indexOf('<img') < 0);

    /* ---------- 11. 回归：反复保存不产生重复条目（用户报"每次保存就是一条新的"） ---------- */
    console.log('== 重复条目回归 ==');
    await page.goto(base + '/04-data/redis.html');
    await page.waitForTimeout(500);
    await page.click('#n20-fab'); await page.waitForTimeout(300);
    chips = await page.$$('#n20-body .n20-chip');
    for (var n = 0; n < chips.length; n++) {
      if ((await chips[n].textContent()).indexOf('四种高级结构') >= 0) { await chips[n].click(); break; }
    }
    await page.waitForTimeout(200);
    // 连续：手动保存 ×2 + 预览切换 ×2 + 修改后自动保存
    var saveBtn = await page.$$('#n20-body .n20-toolbar .n20-btn');
    await saveBtn[1].click(); await page.waitForTimeout(150);          // 保存
    var pvb = await page.$$('#n20-body .n20-toolbar .n20-btn');
    await pvb[0].click(); await page.waitForTimeout(200);              // → 预览
    pvb = await page.$$('#n20-body .n20-toolbar .n20-btn');
    await pvb[0].click(); await page.waitForTimeout(200);              // → 编辑
    saveBtn = await page.$$('#n20-body .n20-toolbar .n20-btn');
    await saveBtn[1].click(); await page.waitForTimeout(150);          // 再保存
    await page.fill('.n20-ta', '# 模块3要点\n- **HyperLogLog** 跑过一遍\n\n| 结构 | 场景 |\n| --- | --- |\n| ZSet | 排行榜 |\n\n补充一句');
    await page.waitForTimeout(1100);                                   // 等自动保存
    await page.click('#n20-tabs button[data-tab="all"]');
    await page.waitForTimeout(300);
    var secItems = await page.$$eval('#n20-list .n20-item', function (els) {
      return els.filter(function (e) { return e.textContent.indexOf('四种高级结构') >= 0; }).length;
    });
    check('该章节在全部列表只有 1 条（不重复）', secItems === 1, '实际 ' + secItems);
    var allN = await page.evaluate(function () { return Object.keys(JSON.parse(localStorage.getItem('20min.notes.v1') || '{}')).length; });
    check('笔记总数 = 3（m1 XSS测试 + 模块3 + 总结，无重复）', allN === 3, '实际 ' + allN);

    /* ---------- 12. 回归：删除按钮可用 ---------- */
    console.log('== 删除按钮 ==');
    var delBtn = await page.$('#n20-list .n20-item .del');
    check('每条笔记都有删除按钮', delBtn !== null);
    page.on('dialog', function (d) { d.accept(); });
    await delBtn.click();  // 删除第一条（最新 = 模块3）
    await page.waitForTimeout(400);
    var afterDel = await page.evaluate(function () {
      var n = JSON.parse(localStorage.getItem('20min.notes.v1') || '{}');
      return { m3: !!n['04-data/redis.html#m3'], total: Object.keys(n).length };
    });
    check('点击删除后该笔记被移除', afterDel.m3 === false && afterDel.total === 2,
      JSON.stringify(afterDel));

    /* ---------- 13. 回归：700ms 内快速切换模块不串写 ---------- */
    console.log('== 快速切换模块不串写 ==');
    await page.click('#n20-tabs button[data-tab="doc"]');
    await page.waitForTimeout(250);
    // 先给模块1写一条
    chips = await page.$$('#n20-body .n20-chip');
    for (var p = 0; p < chips.length; p++) {
      if ((await chips[p].textContent()).indexOf('为什么 Redis 这么快') >= 0) { await chips[p].click(); break; }
    }
    await page.fill('.n20-ta', '模块1的专属内容-单线程IO多路复用');
    await page.waitForTimeout(1100);
    // 再给"模块3"写不同内容，700ms 内立刻切到"总结"
    chips = await page.$$('#n20-body .n20-chip');
    for (var q = 0; q < chips.length; q++) {
      if ((await chips[q].textContent()).indexOf('四种高级结构') >= 0) { await chips[q].click(); break; }
    }
    await page.fill('.n20-ta', '模块3的专属内容-别被串写成模块1');
    await page.waitForTimeout(100); // 故意不满足 700ms 防抖
    chips = await page.$$('#n20-body .n20-chip');
    for (var r = 0; r < chips.length; r++) {
      if ((await chips[r].textContent()).indexOf('本篇总结') >= 0) { await chips[r].click(); break; }
    }
    await page.waitForTimeout(1200); // 等延迟保存落盘
    var cross = await page.evaluate(function () {
      var n = JSON.parse(localStorage.getItem('20min.notes.v1') || '{}');
      return {
        m1: (n['04-data/redis.html#m1'] || {}).text || '',
        m3: (n['04-data/redis.html#m3'] || {}).text || '',
        sum: (n['04-data/redis.html#__summary__'] || {}).text || ''
      };
    });
    check('模块1 内容未被污染', cross.m1.indexOf('单线程IO多路复用') >= 0 && cross.m1.indexOf('别被串写') < 0, cross.m1.slice(0, 30));
    check('模块3 内容落盘到自己的 key', cross.m3.indexOf('别被串写成模块1') >= 0, cross.m3.slice(0, 30));
    check('总结区块未被误写', cross.sum.indexOf('别被串写') < 0);

    /* ---------- 14. 控制台干净（终检） ---------- */
    console.log('== 控制台 ==');
    var realErrors = errors.filter(function (e) { return e.indexOf('favicon') < 0 && e.indexOf('net::ERR') < 0; });
    check('无 JS 报错', realErrors.length === 0, realErrors.slice(0, 3).join(' ; '));

    /* ---------- 10. 已读取消 ---------- */
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
