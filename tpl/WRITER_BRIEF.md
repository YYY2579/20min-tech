# 写作简令（每篇都必须满足）

工作目录：`C:/Users/25791/Desktop/20分钟速学`

## 你写什么
`tpl/parts/NN-slug.part.html` —— **只有内容片段**，从 `<header>` 开始，到 `</footer>` 结束。
不要 doctype / `<head>` / `<style>` / `<script>`，这些由 `tpl/assemble.py` 注入。

## 7 条硬指标（不达标即返工）
1. **12~14 个 `<section>`**，最后两节固定：「自测 6 道题」+「术语表 & 下一步」。
2. **6 道自测**：
   ```html
   <div class="q" data-a="正确项下标">
     <div class="qt">1. 题干</div>
     <button class="opt">A</button><button class="opt">B</button><button class="opt">C</button>
     <div class="ans">正确答案：<b>…</b>。解析…</div>
   </div>
   ```
   `data-a` 必须在选项范围内，答案与解析必须技术正确。
3. **9~10 个坑**：`<div class="pit"><div class="num">1</div><div class="pb"><div class="pt">标题</div><div class="pd">解释</div></div></div>`
4. **说明文字 ≥ 4500 汉字**（不含 `<pre>`）。宁可少写客套，不许注水。
5. 正文里的 `<` 一律 `&lt;`，`&` 一律 `&amp;`（`<pre>` 里也一样）。
6. 禁止「上图 / 下图 / 前面那张图 / 如图所示」；禁止「待补充 / 此处略 / 敬请期待 / 待完善」。
7. 技术事实必须准确。不确定的默认值/版本 → 写「以你环境的 `--help` 为准」；**不许编造数字、RFC 编号、论文结论、公司事故**。

## 头部结构（照抄，只换内容）
```html
<header>
  <div class="wrap">
    <span class="serie">20 分钟速学 · 求职冲刺专栏 · 第 N 期</span>
    <h1>标题</h1>
    <p class="sub">一句话副标题，含 <b>关键词</b></p>
    <div class="density">
      <span class="chip">覆盖 <b>8</b> 大模块</span>
      <span class="chip"><b>20</b> 个考点</span>
      <span class="chip"><b>10</b> 个坑</span>
      <span class="chip"><b>6</b> 道自测</span>
    </div>
    <div class="timerbox">
      <div id="clock">20:00</div>
      <button class="btn primary" id="start">开始计时</button>
      <button class="btn" id="reset">重置</button>
      <span class="timerhint" id="hint">按本篇定制的提示</span>
    </div>
  </div>
</header>
```

## 组件（必须混用至少 5 类）
- 表格 `<table><tr><th>…</th></tr><tr><td>…</td></tr></table>`
- 代码 `<pre>…<span class="c"># 注释</span></pre>`，高亮 `class="y|g|b|r"`
- 提示框 `<div class="callout">`、`callout warn`、`callout ok`、`callout danger`
- 命令行 `<div class="crow"><code>命令</code><span class="desc">说明</span><button class="copy">复制</button></div>`，外层 `<div class="cmds">`
- 卡片 `<div class="cards"><div class="card"><div class="ct">标题</div><div class="cd">说明</div></div></div>`
- 编号步骤 `<div class="steps"><div class="step"><div class="txt">…</div></div></div>`（**必须带 `step` 类才出序号**）
- 行内代码 `<span class="k">…</span>`

## 语气（这是本专栏的差异点）
- 一个**具体现象或一句错话**开头，不要从定义开始。
- 先给判断（「这说明…」「别急着…」），再给原因，再给命令验证。
- 每个技术节末尾要有一句「面试怎么答」——用一句可直接说出口的话。
- 不用「首先/其次/最后/综上所述」，不写百科腔，不做无信息量的排比。

## 自检（必须真的执行）
```bash
cd "C:/Users/25791/Desktop/20分钟速学" && python tpl/assemble.py <两位前缀>
python -c "import re,os;f='10-interview/NN-slug.html';h=open(f,encoding='utf-8').read();print(os.path.getsize(f)//1024,'KB',len(re.findall(r'<section',h)),len(re.findall(r'class=\"q\" data-a',h)),len(re.findall(r'class=\"pit\"',h)))"
```
期望：`section 12~14 / q=6 / pit=9~10 / 文件 > 52KB`。

## 不要碰
`tpl/SPEC.md`、`tpl/assemble.py`、`tpl/style.css`、`tpl/app.js`、`build-index.py`、`index.html`、`notes-core.js`、其他篇目的 part 文件。不要跑 git。
