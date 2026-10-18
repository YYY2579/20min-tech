# 20分钟速学

25 份中文技术手册，**每份控制在 20 分钟读完**，但只讲能上手用的部分：核心心智模型、关键命令、以及别人踩过的坑。

纯静态 HTML，无框架、无构建步骤、无追踪脚本。**离线也能打开。**

---

## 里面有什么

| # | 分类 | 份数 | 覆盖内容 |
|---|---|---|---|
| 01 | 工程基础 | 4 | Git、Linux、HTTP/HTTPS、抓包分析 |
| 02 | 编程语言 | 1 | Python |
| 03 | 数据与存储 | 4 | MySQL、PostgreSQL、Redis、消息队列 |
| 04 | 架构与设计 | 4 | 架构评审、系统设计案例、分布式、微服务与 API |
| 05 | 运维与云原生 | 5 | Docker、Kubernetes、可观测性、Nginx、CI/CD 与混沌工程 |
| 06 | 安全 | 1 | Web 安全 |
| 07 | 底层原理 | 2 | 计算机网络、操作系统与 IO 模型 |
| 08 | AI 工程 | 3 | 大模型应用开发、向量数据库、AI 服务部署与运维 |
| 09 | 综合实战 | 1 | 从零搭建可部署系统（41 步动手手册） |

---

## 怎么用

**在线看**：直接访问站点首页，用搜索框或分类浏览。

**离线看**：`git clone` 后双击 `index.html`。所有文档都是自包含的单文件 HTML，样式和脚本全部内联，不依赖 CDN，断网也能正常显示。

**手机上**：单文件自适应移动端，也可以把某个 HTML 直接发给自己。

---

## 每份文档的结构

统一体例，方便跳读：

- **计时器** —— 20 分钟倒计时，逼你别读太细
- **6~8 个知识模块** —— 每个模块一个心智模型
- **常见坑** —— 8~10 条，都是真实踩过的
- **自测题** —— 6 道选择题，点了立刻判对错，附解析
- **速查卡** —— 命令/配置一键复制
- **术语表** —— 15~20 条，看不懂随时回查

---

## 设计原则

1. **只讲能用的** —— 不追求体系完整，只回答"这件事我该怎么做、为什么这么做、什么时候会翻车"
2. **术语就地解释** —— 每个术语首次出现就加括注，不让你来回翻
3. **每篇都能独立读** —— 不依赖外部图片、不依赖前后文，正文自包含
4. **文档自己质检** —— 附带 `qa-check.py`，可对全站做 6 轮自动检查（结构完整性、样式一致性、转义规范、灌水检测、占位符残留、组件用量）

---

## 技术说明

- 纯静态 HTML + 内联 CSS/JS，**零依赖**
- GitHub Pages 分支部署，不使用 GitHub Actions（省额度，也省配置）
- 路径全 ASCII，避免中文 URL 的百分号编码问题
- 每份文档约 50~70 KB

---

## 目录结构

```
.
├── index.html                    首页（搜索 + 分类导航）
├── 404.html
├── .nojekyll                     跳过 Jekyll 处理
├── 01-fundamentals/              git / linux-cli / http-https / packet-capture
├── 02-languages/                 python
├── 03-data/                      mysql / postgresql / redis / message-queue
├── 04-architecture/              architecture-review / system-design-cases
│                                 distributed-systems / microservices-api
├── 05-devops/                    docker / kubernetes / observability
│                                 nginx / cicd-chaos
├── 06-security/                  web-security
├── 07-lowlevel/                  networking / os-io-model
├── 08-ai/                        llm-app-dev / vector-database / ai-service-ops
└── 09-practice/                  build-deployable-system
```

---

## 说明

内容为个人学习整理，参考了各技术的官方文档与社区实践。发现错误欢迎提 Issue。
