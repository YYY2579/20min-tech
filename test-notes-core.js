/* Node 单测：notes-core.js 的纯函数部分 */
'use strict';
var assert = require('assert');
var core = require('./notes-core.js');

var pass = 0, fail = 0;
function t(name, fn) {
  try { fn(); pass++; console.log('  ok - ' + name); }
  catch (e) { fail++; console.log('  FAIL - ' + name + '\n    ' + e.message); }
}

console.log('== Markdown 渲染 ==');

t('标题', function () {
  assert.strictEqual(core.md('# 一级'), '<h1>一级</h1>');
  assert.strictEqual(core.md('### 三级标题'), '<h3>三级标题</h3>');
});

t('段落与软换行', function () {
  assert.strictEqual(core.md('你好'), '<p>你好</p>');
  assert.strictEqual(core.md('第一行\n第二行'), '<p>第一行<br>第二行</p>');
});

t('行内格式', function () {
  assert.strictEqual(core.md('**粗体**'), '<p><strong>粗体</strong></p>');
  assert.strictEqual(core.md('*斜体*'), '<p><em>斜体</em></p>');
  assert.strictEqual(core.md('`code`'), '<p><code>code</code></p>');
  assert.strictEqual(core.md('~~删除~~'), '<p><del>删除</del></p>');
  assert.strictEqual(core.md('**粗**和*斜*和`码`'),
    '<p><strong>粗</strong>和<em>斜</em>和<code>码</code></p>');
});

t('XSS 转义', function () {
  assert.strictEqual(core.md('<script>alert(1)</script>'),
    '<p>&lt;script&gt;alert(1)&lt;/script&gt;</p>');
  assert.strictEqual(core.md('<img src=x onerror=alert(1)>'),
    '<p>&lt;img src=x onerror=alert(1)&gt;</p>');
  var out = core.md('`<b>` 与 **<i>**');
  assert.ok(out.indexOf('<b>') < 0 && out.indexOf('<i>') < 0, '行内不应产生原始标签');
});

t('链接与 URL 白名单', function () {
  assert.strictEqual(core.md('[站](https://example.com)'),
    '<p><a href="https://example.com" target="_blank" rel="noopener noreferrer">站</a></p>');
  var bad = core.md('[x](javascript:alert(1))');
  assert.ok(bad.indexOf('javascript:') < 0, 'javascript: 必须被拦截');
  assert.ok(bad.indexOf('href="#"') >= 0);
  assert.ok(core.md('[d](data:text/html,xx)').indexOf('data:') < 0, 'data: 必须被拦截');
});

t('围栏代码块', function () {
  var out = core.md('```js\nvar a = 1 < 2 && 3 > 2;\n```');
  assert.ok(out.indexOf('<pre><code>') === 0);
  assert.ok(out.indexOf('1 &lt; 2 &amp;&amp; 3 &gt; 2') >= 0, '代码内 < 需转义');
  assert.ok(out.indexOf('<b>') < 0);
});

t('代码块未闭合也安全', function () {
  var out = core.md('```\nvar a = 1;');
  assert.ok(out.indexOf('<pre><code>var a = 1;') === 0);
});

t('列表', function () {
  var out = core.md('- 甲\n- 乙\n- 丙');
  assert.strictEqual(out, '<ul><li>甲</li><li>乙</li><li>丙</li></ul>');
  assert.strictEqual(core.md('1. 甲\n2. 乙'), '<ol><li>甲</li><li>乙</li></ol>');
});

t('嵌套列表', function () {
  var out = core.md('- 父\n  - 子1\n  - 子2\n- 父2');
  assert.ok(out.indexOf('<ul><li>父<ul><li>子1</li><li>子2</li></ul></li><li>父2</li></ul>') === 0,
    '实际: ' + out);
});

t('待办复选框', function () {
  var out = core.md('- [ ] 未做\n- [x] 已做');
  assert.ok(out.indexOf('<input type="checkbox" disabled>') >= 0, '未做项无 checked');
  assert.ok(out.indexOf('<input type="checkbox" disabled checked>') >= 0, '已做项有 checked');
  assert.ok(out.indexOf('待办') < 0);
});

t('表格', function () {
  var out = core.md('| 命令 | 作用 |\n| --- | --- |\n| GET | 读取 |\n| SET | 写入 |');
  assert.ok(out.indexOf('<table><thead><tr><th>命令</th><th>作用</th></tr></thead>') === 0,
    '实际: ' + out);
  assert.ok(out.indexOf('<tbody><tr><td>GET</td><td>读取</td></tr>') >= 0);
});

t('表格对齐', function () {
  var out = core.md('| a | b | c |\n| :--- | :---: | ---: |\n| 1 | 2 | 3 |');
  assert.ok(out.indexOf('style="text-align:left"') >= 0);
  assert.ok(out.indexOf('style="text-align:center"') >= 0);
  assert.ok(out.indexOf('style="text-align:right"') >= 0);
});

t('引用块', function () {
  var out = core.md('> 一句名言\n> 第二行');
  assert.ok(out.indexOf('<blockquote><p>一句名言<br>第二行</p></blockquote>') === 0,
    '实际: ' + out);
});

t('引用块内嵌列表', function () {
  var out = core.md('> - 甲\n> - 乙');
  assert.ok(out.indexOf('<blockquote><ul><li>甲</li><li>乙</li></ul></blockquote>') === 0,
    '实际: ' + out);
});

t('分割线', function () {
  assert.strictEqual(core.md('---'), '<hr>');
  assert.strictEqual(core.md('***'), '<hr>');
});

t('混合文档不抛异常', function () {
  var doc = [
    '# 标题', '', '**粗** *斜* `码`', '', '- [ ] 待办', '- [x] 完成', '',
    '| A | B |', '| --- | --- |', '| 1 | 2 |', '', '> 引用', '', '```', 'code < 1', '```', '',
    '结尾段落'
  ].join('\n');
  var out = core.md(doc);
  assert.ok(out.indexOf('<h1>标题</h1>') >= 0);
  assert.ok(out.indexOf('<table>') >= 0);
  assert.ok(out.indexOf('<blockquote>') >= 0);
  assert.ok(out.indexOf('<pre><code>code &lt; 1') >= 0);
  assert.ok(out.indexOf('<p>结尾段落</p>') >= 0);
});

t('空与 null 输入', function () {
  assert.strictEqual(core.md(''), '');
  assert.strictEqual(core.md(null), '');
  assert.strictEqual(core.md(undefined), '');
});

console.log('== 合并逻辑 ==');

t('mergeRecords 按 updatedAt 取胜者', function () {
  var local = { a: { text: '本地', updatedAt: 100 }, b: { text: '本地B', updatedAt: 50 } };
  var remote = { a: { text: '远程', updatedAt: 200 }, c: { text: '远程C', updatedAt: 10 } };
  var out = core.mergeRecords(local, remote);
  assert.strictEqual(out.a.text, '远程');
  assert.strictEqual(out.b.text, '本地B');
  assert.strictEqual(out.c.text, '远程C');
  assert.strictEqual(Object.keys(out).length, 3);
});

t('mergeRecords 同等时间戳不覆盖', function () {
  var out = core.mergeRecords({ a: { text: 'L', updatedAt: 100 } }, { a: { text: 'R', updatedAt: 100 } });
  assert.strictEqual(out.a.text, 'R', '同刻取远端（>= 语义）');
});

t('mergeRead 取最大时间戳', function () {
  var out = core.mergeRead({ a: 100, b: 5 }, { a: 50, c: 9 });
  assert.strictEqual(out.a, 100);
  assert.strictEqual(out.b, 5);
  assert.strictEqual(out.c, 9);
});

t('sanitizeUrl', function () {
  assert.strictEqual(core.sanitizeUrl('https://a.b'), 'https://a.b');
  assert.strictEqual(core.sanitizeUrl('/rel/path'), '/rel/path');
  assert.strictEqual(core.sanitizeUrl('JavaScript:alert(1)'), '#');
  assert.strictEqual(core.sanitizeUrl(''), '');
});

t('esc', function () {
  assert.strictEqual(core.esc('<a href="x">&\''), '&lt;a href=&quot;x&quot;&gt;&amp;&#39;');
});

console.log('\n结果: ' + pass + ' 通过, ' + fail + ' 失败');
process.exit(fail ? 1 : 0);
