# 10-interview 专栏规格（求职冲刺 · 面试八股与实战）

## 全局硬约束（每篇都必须满足）

1. 只写 **内容片段**：从 `<header>` 开始，到 `</footer>` 结束，保存为 `tpl/parts/NN-slug.part.html`。
   **不要**写 `<!DOCTYPE>`、`<head>`、`<style>`、`<script>` —— 由 `tpl/assemble.py` 统一注入。
2. 结构：`<header>` 内必须是
   - `<span class="serie">20 分钟速学 · 求职冲刺专栏 · 第 N 期</span>`
   - `<h1>标题</h1>`
   - `<p class="sub">一句话副标题，含 <b>关键词</b></p>`
   - `<div class="density">` 里 4~5 个 `<span class="chip">`（覆盖模块数 / 题目数 / 命令数 / 坑数 / 自测数）
   - `<div class="timerbox">` 结构与 prometheus.html 完全一致（clock / start / reset / hint），hint 文案按本篇定制
3. 正文：**11~12 个 `<section>`**，每个带 `<div class="shead"><span class="mins">模块 N</span><h2>…</h2></div>`；
   最后两个 section 固定为「自测（6 道题）」和「术语表 + 下一步」。
4. 自测题必须是：
   ```html
   <div class="q" data-a="正确选项下标(0/1/2/3)">
     <div class="qt">1. 题干</div>
     <button class="opt">选项 A</button>
     <button class="opt">选项 B</button>
     <button class="opt">选项 C</button>
     <div class="ans">正确答案：<b>…</b>。解析…</div>
   </div>
   ```
   共 **6 道**，`data-a` 必须落在选项范围内，答案与解析必须正确。
5. 「坑」区块用 `<div class="pit"><div class="num">1</div><div class="pb"><div class="pt">标题</div><div class="pd">解释</div></div></div>`，**9~10 条**。
6. 组件要混用：`<table>`、`<pre>`（代码，可用 `<span class="c">` 注释、`class="y"/"g"/"b"/"r"` 高亮）、
   `<div class="callout">` / `callout warn` / `callout ok` / `callout danger`、`<div class="crow"><code>…</code><span class="desc">…</span><button class="copy">复制</button></div>`、`<div class="card">`、`<div class="step">`。
7. **禁止**「上图 / 下图 / 前面那张图 / 如图所示」这类引用；每篇必须能脱离其他篇独立阅读。
8. 正文里出现 `<` 必须写成 `&lt;`（代码块内也是），`&` 写成 `&amp;`。
9. 禁止占位符：「待补充」「此处略」「敬请期待」「（略）」「待完善」。
10. 技术事实必须准确：不确定的版本号/默认值宁可写「以你环境 `--help` 为准」，**不许编造数字、编造 RFC 编号、编造论文结论**。
    真实事故案例可以写，但必须标注「典型现象」而不是伪装成某公司真实事件。
11. 风格：**场景化、口语、有判断**。先给现象/问题，再给原因，再给命令或话术。不写教科书式定义堆砌。
12. 篇幅：每个 section 300~600 字说明 + 必要的表格/代码；全文说明文字约 4000~6000 汉字。

## 36 篇清单

### 01｜01-battle-map.html
- 标题：求职冲刺：运维 / SRE 面试全景与 30 天打法
- 副标题：面试考的不是背了多少，而是<b>遇到没见过的问题时你的第一反应</b>。先看清考什么，再决定背什么。
- 覆盖：6 大模块 / 40 题自测卡 / 30 天计划
- 章节：
  1. 面试到底在考什么（三层能力模型：知道 → 做过 → 判断过）
  2. 岗位画像：运维 / SRE / 云原生 / 平台工程 的差别（表格）
  3. 高频题分布：哪些题出现率最高（按方向列，标注「必答 / 常问 / 加分」）
  4. 八股的正确用法：先建立索引，再补细节（怎么用这个专栏）
  5. 30 天冲刺表（每周主题 + 每天 1 小时的具体安排）
  6. 四类必被追问的深水区（故障排查 / 容量 / 变更 / 成本）
  7. 简历与项目：先有故事，再有八股
  8. 面试中的表达结构：结论 → 依据 → 边界（30 秒法则）
  9. 这场面试大概率会挂在哪（6 个真实挂点）
  10. 反问环节的 5 个高质量问题
  11. 自测（6 题）
  12. 术语表 + 下一步
- 必含：SRE 与 DevOps 的区别（SRE 是「用工程手段解决运维问题」，有错误预算；DevOps 是文化与协作方式）

### 02｜02-linux-troubleshooting.html
- 标题：Linux 故障排查：CPU / 内存 / IO / 磁盘 / 网络五条线
- 副标题：排查不是靠猜，是靠<b>把现象收敛到某一层</b>。这张决策树能省掉 90% 的瞎试。
- 覆盖：5 类现象 / 30+ 命令 / 8 个坑
- 章节：1 USE 方法与固定顺序；2 CPU（load 含 D 状态进程、top/pidstat/perf）；3 内存（free 的 available、OOM killer、page cache）；4 IO（iostat -x 的 await/util/aqu-sz、D 状态）；5 磁盘（df vs du、被删除但仍被占用的文件、inode 满）；6 网络（ss、丢包、连接数）；7 进程与系统调用（strace/lsof）；8 内核日志（dmesg -T、journalctl）；9 一张决策树（现象 → 先看什么 → 再看什么）；10 坑；11 自测；12 术语表+下一步
- 必含事实：load average 包含不可中断睡眠（D 状态）进程，所以 IO 卡住时 load 高而 CPU 空闲；`free` 的 `available` 才是可用内存；`df` 与 `du` 不一致多半是文件已删除但句柄未释放（`lsof +L1`）

### 03｜03-linux-commands.html
- 标题：Linux 命令追问：不只问你怎么用，还问你为什么
- 副标题：面试官问 <span class="k">awk</span> 不是想看你背参数，是想知道<b>你怎么处理一亿行日志</b>。
- 覆盖：8 大模块 / 25 道命令题 / 12 个坑
- 章节：1 查找与筛选（find/grep，为什么 find 比 ls 管道快）；2 文本三剑客（awk/sed/grep 各自擅长什么）；3 一行命令实战（统计 Nginx 日志 top IP、状态码分布、P99 粗算）；4 权限（rwx 对目录的含义、umask、SUID/SGID/粘滞位）；5 进程与服务（ps/ss/systemd/journalctl）；6 磁盘与文件（df/du/inode/软硬链接）；7 性能与追踪（top/iostat/strace/lsof）；8 传输与远程（scp/rsync/ssh 隧道）；9 命令题 10 连问（含答案要点）；10 坑；11 自测；12 术语表+下一步

### 04｜04-os-io-model.html
- 标题：进程 / 线程 / 协程与五种 IO 模型
- 副标题：epoll 为什么快、协程到底省了什么，这两个问题答不清，<b>高并发就只是背名词</b>。
- 覆盖：7 大模块 / 5 种 IO 模型 / 9 个坑
- 章节：1 进程与线程（地址空间、切换成本、共享什么）；2 协程（用户态调度、为什么能开十万个）；3 同步/异步/阻塞/非阻塞（两两组合的四象限）；4 五种 IO 模型（阻塞、非阻塞、多路复用、信号驱动、异步）；5 select/poll/epoll（数据结构差异、LT/ET、为什么 epoll 不是「O(1) 万能药」）；6 零拷贝（sendfile/mmap、DMA）；7 page cache 与 writeback；8 内存管理（虚拟内存、页表、TLB、NUMA 简提）；9 追问链（从「线程池开多大」追到「IO 密集怎么算」）；10 坑；11 自测；12 术语表+下一步

### 05｜05-tcp.html
- 标题：TCP 面试：握手、挥手、状态机与那些追问
- 副标题：<span class="k">TIME_WAIT</span> 多不是问题，<span class="k">CLOSE_WAIT</span> 多才是<b>你的代码没关连接</b>。
- 覆盖：8 大模块 / 11 个状态 / 10 个坑
- 章节：1 报文头里真正重要的 6 个字段；2 三次握手与「为什么不是两次」；3 SYN Flood 与 syncookies（半连接队列/全连接队列）；4 四次挥手与 11 状态机；5 TIME_WAIT（2MSL 的道理、端口耗尽、能不能复用）；6 CLOSE_WAIT 堆积怎么查；7 重传与拥塞控制（慢启动、快重传、BBR）；8 keepalive 与应用层心跳的区别；9 用 tcpdump 看握手（命令 + 判读）；10 坑；11 自测；12 术语表+下一步

### 06｜06-network-troubleshoot.html
- 标题：网络排障 12 个经典现象：从「ping 得通」到「就是打不开」
- 副标题：同一句「网络不通」，可能是 DNS、防火墙、MTU、回程路由、TLS 里的任意一层。先分层，再动手。
- 覆盖：12 个现象 / 20 条命令 / 9 个坑
- 章节：1 分层排查法（链路→IP→端口→协议→应用）；2 现象 1-3：ping 通但端口不通 / 连接被拒 vs 超时 / 同机通跨机不通；3 现象 4-6：curl 慢（DNS？TLS？TTFB？）/ 丢包 / MTU 黑洞；4 现象 7-9：502 / 504 / 499 的分水岭；5 现象 10-12：单向不通 / TLS 握手失败 / 代理环境变量坑；6 抓包定位三步（tcpdump 抓什么、看什么）；7 一张「现象 → 命令」对照表；8 变更类故障（改完就挂，先回滚还是先查）；9 坑；10 自测；11 术语表+下一步

### 07｜07-dns-http-https.html
- 标题：DNS 与 HTTP/HTTPS 高频问：从解析到握手
- 副标题：<span class="k">no-cache</span> 不是不缓存，<span class="k">301</span> 会被浏览器记一辈子——这些细节决定你答得像不像做过。
- 覆盖：7 大模块 / 20 个考点 / 9 个坑
- 章节：1 DNS 解析链路（递归 vs 迭代、浏览器/系统/本地 DNS 三级缓存）；2 记录类型与 TTL（A/AAAA/CNAME/MX/TXT、负缓存）；3 HTTP 版本演进（1.1 队头阻塞、2 多路复用、3 的 QUIC）；4 连接复用与 keep-alive；5 缓存（强缓存/协商缓存、Cache-Control 各指令、ETag 与 304）；6 状态码陷阱（301/302/307/308、499/502/504 的归属）；7 认证（Cookie/Session/JWT 的取舍）；8 HTTPS（TLS1.2 vs 1.3 握手轮次、证书链、SNI、HSTS）；9 坑；10 自测；11 术语表+下一步

### 08｜08-docker.html
- 标题：Docker 八股：namespace、cgroup、分层与网络
- 副标题：容器不是「小虚拟机」，是<b>被内核隔离和限流的普通进程</b>。这一句答对，后面全通。
- 覆盖：8 大模块 / 15 个考点 / 10 个坑
- 章节：1 容器到底是什么（与虚拟机的本质差别）；2 启动链路（docker → containerd → runc → 进程）；3 namespace 六种隔离；4 cgroup v1/v2 限 CPU 与内存（cpu.max、memory.max）；5 镜像分层与 overlay2（lowerdir/upperdir/merged）；6 写时复制与容器可写层；7 网络四种模式 + veth/bridge/iptables 端口映射；8 存储（volume vs bind mount）；9 构建缓存与 Dockerfile 顺序；10 坑；11 自测；12 术语表+下一步

### 09｜09-docker-troubleshoot.html
- 标题：Docker 排障手册：容器起不来、磁盘爆了、网络不通
- 副标题：先看退出码，再看日志，最后才怀疑镜像——顺序错了就是白折腾。
- 覆盖：10 类故障 / 25 条命令 / 10 个坑
- 章节：1 三步定位法（ps -a / inspect / logs）；2 退出码对照（137/139/1/127/126）；3 容器启动就退出（前台进程、CMD 覆盖、依赖未就绪）；4 磁盘被写满（/var/lib/docker、日志驱动、data-root 迁移）；5 端口与网络（端口占用、iptables、容器间 DNS）；6 时间与时区；7 资源限制与 OOM（--memory 与 JVM 堆）；8 构建失败（网络、缓存、多阶段）；9 Compose 依赖与健康检查；10 坑；11 自测；12 术语表+下一步

### 10｜10-k8s-core.html
- 标题：Kubernetes 核心八股：对象、控制循环与声明式
- 副标题：你永远不「启动容器」，你只<b>声明想要的状态</b>，剩下的交给控制循环。
- 覆盖：8 大模块 / 12 个对象 / 9 个坑
- 章节：1 它解决 Docker 答不上的五个问题；2 控制面与数据面组件职责（表格）；3 声明式与 reconcile（为什么 kubectl apply 是幂等的）；4 Pod（最小调度单元、pause 容器、为什么不是一个容器一个 Pod）；5 工作负载对象（Deployment/RS/StatefulSet/DaemonSet/Job/CronJob）；6 Service 四种类型与 Endpoints；7 探针三种（liveness/readiness/startup 的边界）；8 requests/limits 与 QoS 三级；9 命名空间与 RBAC 简版；10 坑；11 自测；12 术语表+下一步

### 11｜11-k8s-troubleshoot.html
- 标题：Pod 排障决策树：Pending、CrashLoop、OOM、Evicted
- 副标题：<span class="k">kubectl describe</span> 的 Events 能解决 80% 的问题，剩下 20% 才需要进容器。
- 覆盖：8 类状态 / 25 条命令 / 10 个坑
- 章节：1 排障顺序（get → describe → logs → exec → 节点）；2 Pending（资源不足、亲和/污点、PVC 未绑定）；3 ImagePullBackOff（镜像名、私有仓库 secret、网络）；4 CrashLoopBackOff（退出码语义、看 --previous 日志）；5 OOMKilled 与内存 limit；6 Running 但不 Ready（探针配置错、依赖不通）；7 Evicted 与节点压力；8 Terminating 卡住（finalizer、卷卸载）；9 Service 访问不到（selector/endpoints/端口名）；10 坑；11 自测；12 术语表+下一步

### 12｜12-k8s-network.html
- 标题：K8s 网络全链路：Pod、Service、Ingress 与 DNS
- 副标题：一个请求从外到内要过五道关，<b>知道每关谁负责</b>，你才知道该看谁的日志。
- 覆盖：7 大模块 / 5 层链路 / 10 个坑
- 章节：1 Pod 网络模型与 CNI（Calico BGP/IPIP、Flannel VXLAN/host-gw）；2 Service 实现原理（ClusterIP 是 iptables/ipvs 规则，不是进程）；3 NodePort / LoadBalancer / Headless；4 Ingress 与 Ingress Controller（七层，和 Service 的分工）；5 CoreDNS 解析链路（search 域、ndots:5 的坑）；6 NetworkPolicy（谁真正执行它）；7 一次跨节点访问的完整路径（含抓包点）；8 排查顺序（从 pod 内到外）；9 坑；10 自测；11 术语表+下一步

### 13｜13-k8s-scheduling.html
- 标题：调度、QoS、扩缩容与优雅发布
- 副标题：<span class="k">preStop</span> 不 sleep 那几秒，就是你「每次发布都有 502」的根因。
- 覆盖：7 大模块 / 12 个参数 / 9 个坑
- 章节：1 调度两步（filter → score）；2 亲和与反亲和（required 会把 Pod 卡死在 Pending）；3 污点与容忍；4 拓扑分布约束；5 QoS 三级与驱逐顺序；6 HPA/VPA/集群自动扩缩（指标从哪来）；7 滚动更新参数（maxSurge/maxUnavailable）与 PDB；8 优雅退出（SIGTERM、preStop、terminationGracePeriodSeconds）；9 探针设计原则（liveness 只查自己）；10 坑；11 自测；12 术语表+下一步

### 14｜14-prometheus.html
- 标题：Prometheus 八股：指标类型、PromQL 与基数爆炸
- 副标题：<span class="k">histogram_quantile</span> 算错、<span class="k">rate</span> 窗口乱设、标签基数爆炸——面试和线上同时考这三样。
- 覆盖：8 大模块 / 15 条 PromQL / 10 个坑
- 章节：1 Pull 模型与 TSDB；2 四种指标类型（Counter/Gauge/Histogram/Summary 的取舍）；3 PromQL 核心（rate vs irate、increase 的外推、by/without）；4 分位数为什么必须用 Histogram；5 标签基数爆炸（谁在制造高基数）；6 recording rules 与查询性能；7 告警规则（for、keep_firing_for、absent）；8 Alertmanager 降噪（group_by/inhibit/silence）；9 高可用与长期存储（Thanos/remote_write）；10 坑；11 自测；12 术语表+下一步

### 15｜15-slo-alerting.html
- 标题：SLO、错误预算与告警设计
- 副标题：「CPU 超 80% 就告警」是运维新手的标志——<b>告警要指向用户正在受影响</b>。
- 覆盖：7 大模块 / 6 个公式 / 9 个坑
- 章节：1 SLI / SLO / SLA 三者区别（用一张表说清）；2 怎么选 SLI（可用性、延迟、正确率、新鲜度）；3 错误预算算法（99.9% 在 30 天 = 43.2 分钟）；4 多窗口多燃率告警（为什么单窗口一定误报）；5 告警分级与路由（P1 打电话、P3 进群）；6 降噪三件套（分组/抑制/静默）；7 告警疲劳与值班体验；8 on-call 指标（MTTD/MTTR/无动作告警率）；9 坑；10 自测；11 术语表+下一步

### 16｜16-observability.html
- 标题：可观测性三支柱：指标、日志、链路怎么配合
- 副标题：metrics 告诉你「出事了」，traces 告诉你「哪一段慢」，logs 告诉你「为什么」。
- 覆盖：8 大模块 / 20 个考点 / 9 个坑
- 章节：1 三支柱各自擅长什么（一张对照表）；2 黄金信号与 RED/USE 方法；3 指标埋点（直方图桶怎么定）；4 日志（结构化、采样、成本、Loki 的标签索引）；5 链路追踪（span、context 传播、W3C traceparent）；6 OpenTelemetry 的定位（SDK/Collector/协议）；7 一次 502 的全链路排查实战（从指标到日志到 trace）；8 采样策略（head vs tail）；9 坑；10 自测；11 术语表+下一步

### 17｜17-mysql.html
- 标题：MySQL 八股：索引、事务、锁与慢查询
- 副标题：面试问「为什么加了索引还是慢」，答不出<b>回表与最左前缀</b>就等于没学过。
- 覆盖：8 大模块 / 15 个考点 / 10 个坑
- 章节：1 InnoDB 的存储结构（聚簇索引、页、B+ 树高度）；2 索引类型与回表（覆盖索引为什么快）；3 最左前缀与五种失效场景；4 事务隔离级别与 MVCC（ReadView、undo log）；5 锁（行锁/间隙锁/意向锁、RR 下的锁范围）；6 死锁（怎么产生、怎么看、怎么少发生）；7 EXPLAIN 关键列（type/key/rows/Extra）；8 慢查询与深分页优化；9 主从复制与延迟；10 坑；11 自测；12 术语表+下一步

### 18｜18-redis.html
- 标题：Redis 八股：缓存三大问题、持久化与集群
- 副标题：缓存穿透、击穿、雪崩看着像，<b>解法完全不同</b>——答混了立刻露馅。
- 覆盖：8 大模块 / 20 个考点 / 10 个坑
- 章节：1 单线程的真实含义（命令执行 vs 网络 IO）；2 数据结构与底层编码（SDS/listpack/quicklist/skiplist）；3 缓存穿透（布隆过滤器 / 空值缓存）；4 缓存击穿（互斥重建 / 逻辑过期）；5 缓存雪崩（TTL 打散 / 多级缓存 / 熔断）；6 双写一致性（先删缓存还是先写库、延迟双删、binlog 订阅）；7 持久化（RDB fork+COW、AOF everysec、混合持久化）；8 主从/哨兵/Cluster（16384 槽）；9 分布式锁（SET NX EX、续期、Redlock 的争议）；10 坑；11 自测；12 术语表+下一步

### 19｜19-cicd-release.html
- 标题：CI/CD 与发布策略：怎么发才不出事
- 副标题：发布出事的根因通常不是代码，是<b>不可回滚的数据库变更</b>和没写完的优雅退出。
- 覆盖：7 大模块 / 10 个流程 / 9 个坑
- 章节：1 流水线该有哪几段（提交→构建→测试→制品→部署→验证）；2 分支策略（GitFlow vs trunk-based 的取舍）；3 制品不可变（同一个镜像走完所有环境）；4 蓝绿 / 金丝雀 / 灰度（各自适用场景）；5 回滚设计（应用可回滚、数据要向前兼容：expand-contract）；6 Feature Flag 与开关治理；7 发布前检查清单（可直接抄）；8 K8s 滚动发布与就绪探针的配合；9 坑；10 自测；11 术语表+下一步

### 20｜20-system-design-ops.html
- 标题：运维场景系统设计题：监控、日志、发布、配置中心
- 副标题：这类题不考你画得多漂亮，考你<b>能不能说出容量、单点和取舍</b>。
- 覆盖：4 道大题 / 6 步框架 / 9 个坑
- 章节：1 答题框架（澄清需求→约束→估算→架构→取舍→验证）；2 容量估算怎么做（从采集点数量到存储与带宽）；3 题一：设计一套监控平台（10 万指标/秒）；4 题二：设计日志平台（每天 1TB）；5 题三：设计发布系统（多集群、可回滚）；6 题四：设计配置中心（推还是拉、一致性）；7 高可用与故障域（别把鸡蛋放一个机架）；8 成本控制（保留期、采样、冷热分层）；9 坑；10 自测；11 术语表+下一步

### 21｜21-incident.html
- 标题：线上事故：前 5 分钟做什么，事后怎么讲
- 副标题：面试官问「讲一次你处理的事故」，想听的不是英雄主义，是<b>你有没有流程</b>。
- 覆盖：7 大模块 / 1 套复盘模板 / 9 个坑
- 章节：1 事故分级与响应角色（IC、沟通、执行）；2 前 5 分钟：先止损还是先查根因；3 信息同步（多久一次、说什么、不说什么）；4 常见止损手段（回滚/限流/摘流量/降级/扩容）；5 根因分析（5 Whys 的误用、直接原因 vs 系统性原因）；6 复盘模板（时间线/影响面/根因/改进项，带 owner 和日期）；7 怎么在面试里讲（STAR 变体：背景→判断→动作→结果→反思）；8 不该说的话（甩锅、无量化、只说「重启好了」）；9 坑；10 自测；11 术语表+下一步

### 22｜22-behavioral.html
- 标题：行为面与心理博弈：自我介绍、离职原因、压力面
- 副标题：技术过了却挂在「为什么离职」，这种事每天都在发生。
- 覆盖：8 大模块 / 12 个高频题 / 9 个坑
- 章节：1 自我介绍三段式（现在→过去→为什么是这里，90 秒）；2 项目深挖的追问链（提前准备三层「为什么」）；3 离职原因怎么答（不抱怨、给事实、指向发展）；4 优缺点（缺点要真实且可改进）；5 冲突与失败（STAR，重点在你怎么修正）；6 压力面识别（打断、质疑、沉默，都是流程不是人身攻击）；7 反问环节的 5 个问题（附为什么这么问）；8 诚实与包装的边界（哪些能美化、哪些一查就穿）；9 坑；10 自测；11 术语表+下一步

### 23｜23-salary.html
- 标题：薪资谈判：总包、锚点与不踩坑
- 副标题：谈薪不是讨价还价，是<b>把信息差补齐</b>。先问清结构，再谈数字。
- 覆盖：6 大模块 / 8 个话术 / 9 个坑
- 章节：1 总包结构（base/绩效/年终/期权/补贴/公积金）；2 谈薪时机（一面不谈、HR 面才谈）；3 锚定与区间（先说区间还是先问预算）；4 被压价时的四种回应；5 多 offer 比较（别只看数字，看成长与稳定性）；6 口头 offer、背调与竞业；7 涨薪幅度的现实预期；8 离职交接与入职时间；9 坑；10 自测；11 术语表+下一步

### 24｜24-resume.html
- 标题：简历与项目表达：把 198 篇知识变成故事
- 副标题：简历不是经历清单，是<b>证据清单</b>——每条都要能追问三层。
- 覆盖：7 大模块 / 1 份模板 / 9 个坑
- 章节：1 一页纸结构与阅读动线（HR 看 15 秒）；2 项目描述公式（做了什么 + 量化结果 + 技术取舍）；3 运维项目的量化指标（可用性、MTTR、成本、自动化覆盖率）；4 没有生产经验怎么写（实验环境也能写成工程实践）；5 作品集怎么摆（GitHub Pages 站点 + 源码 + 说明）；6 简历的「追问陷阱」（写了就要能答）；7 投递策略与跟进；8 面试前 24 小时清单；9 坑；10 自测；11 术语表+下一步

### 25｜25-shell-scripting.html
- 标题：Shell 脚本面试：手写题、健壮性与那些致命坑
- 副标题：<span class="k">set -euo pipefail</span> 不是万能药，<span class="k">$@</span> 和 <span class="k">$*</span> 差一个引号就能吃掉你的参数。
- 覆盖：8 大模块 / 8 道手写题 / 10 个坑
- 章节：1 面试为什么爱考脚本（考的是边界意识）；2 脚本骨架（shebang / set / usage / trap 清理）；3 引号与变量（$@ vs $*、未定义变量、数组）；4 判断与测试（[[ ]] vs [ ]、数值比较、文件测试）；5 循环与管道（while read 的 subshell 坑）；6 错误处理与 trap（set -e 的失效场景）；7 文本处理组合（find -print0 / xargs -0）；8 并发（xargs -P、后台任务与 wait）；9 手写题 8 道（日志切割、批量改名、健康检查、备份轮转）；10 坑；11 自测；12 术语表+下一步

### 26｜26-nginx.html
- 标题：Nginx 面试：配置、反向代理与 502 家族
- 副标题：location 的匹配优先级、proxy_pass 的尾斜杠、缓冲与超时——这三处答错，等于说你没调过线上。
- 覆盖：9 大模块 / 20 个考点 / 10 个坑
- 章节：1 架构（master/worker、epoll、为什么快）；2 配置层级与 include；3 location 匹配顺序（= / ^~ / ~ / ~*）；4 proxy_pass 尾斜杠与 URI 替换；5 真实客户端 IP（X-Forwarded-For 与 realip 模块）；6 超时三兄弟与缓冲；7 502/504/499/413 成因对照；8 限流限连（limit_req / limit_conn / burst / nodelay）；9 静态资源、gzip 与缓存头；10 坑；11 自测；12 术语表+下一步

### 27｜27-git.html
- 标题：Git 面试：分支模型、reset 与救火
- 副标题：问 rebase 和 merge 的区别，其实在问「你懂不懂 commit 是快照、分支只是指针」。
- 覆盖：8 大模块 / 12 条命令 / 9 个坑
- 章节：1 对象模型（blob/tree/commit）与三个区；2 分支本质是指针、HEAD 与 detached HEAD；3 merge vs rebase（黄金法则：别 rebase 公共分支）；4 reset 三模式（soft/mixed/hard）；5 revert 与「已推送的提交怎么撤」；6 reflog：最后的保命符；7 cherry-pick 与冲突处理；8 团队流程（trunk-based、PR、保护分支）；9 三类事故（push 错分支、提交大文件、误删分支）；10 坑；11 自测；12 术语表+下一步

### 28｜28-linux-tuning.html
- 标题：Linux 内核参数调优：面试爱问的那几个 sysctl
- 副标题：<span class="k">somaxconn</span>、<span class="k">tcp_tw_reuse</span>、<span class="k">vm.swappiness</span>——能说清「调了会怎样、什么时候不该调」的人不多。
- 覆盖：8 大模块 / 15 个参数 / 10 个坑
- 章节：1 调优的前提（先量再调，别抄博客）；2 文件句柄与进程（ulimit / nofile / fs.file-max）；3 连接队列（somaxconn / tcp_max_syn_backlog）；4 TIME_WAIT 与端口（tcp_tw_reuse 的适用边界，tcp_tw_recycle 已从内核移除）；5 缓冲区与拥塞控制（rmem/wmem、BBR）；6 内存（swappiness、overcommit、dirty_ratio）；7 文件系统与 IO 调度（noatime、mq-deadline、none）；8 持久化与灰度（sysctl.d、分批生效、回滚）；9 坑；10 自测；11 术语表+下一步

### 29｜29-load-balancing.html
- 标题：负载均衡：LVS、Nginx、HAProxy 怎么选
- 副标题：四层和七层不是「谁更高级」，是<b>你能拿到什么信息、愿意付多少性能代价</b>。
- 覆盖：7 大模块 / 6 种算法 / 9 个坑
- 章节：1 四层 vs 七层的本质差别；2 LVS 三种模式（DR/NAT/TUN）与适用场景；3 keepalived 与 VIP 漂移（脑裂怎么防）；4 健康检查（被动 vs 主动、摘除延迟）；5 调度算法与一致性哈希（会话保持的代价）；6 云 SLB 的黑盒与排查边界；7 高可用拓扑（同城双活、DNS 兜底）；8 面试话术：你如何证明这套 LB 可靠；9 坑；10 自测；11 术语表+下一步

### 30｜30-mq.html
- 标题：消息队列面试：Kafka 与 RabbitMQ 的必答题
- 副标题：顺序、幂等、积压、丢失——MQ 的所有难题，本质都是<b>「你要哪一种保证，愿意付什么代价」</b>。
- 覆盖：8 大模块 / 12 个考点 / 10 个坑
- 章节：1 为什么用 MQ（解耦/削峰/异步，以及引入的代价）；2 Kafka 架构（partition/replica/ISR/offset）；3 顺序性（同 key 同分区，全局有序为什么不可取）；4 重复消费与幂等（去重表/唯一键/版本号）；5 消息丢失的三个环节（生产/存储/消费）；6 积压处理（扩容分区 vs 加消费者，顺序性冲突）；7 RabbitMQ 的 exchange 类型与 ack 机制；8 选型对比（吞吐/延迟/运维复杂度）；9 坑；10 自测；11 术语表+下一步

### 31｜31-distributed-tx.html
- 标题：分布式事务与一致性面试
- 副标题：别一上来就背 2PC/TCC/Saga，先说清<b>你的业务能容忍多久的不一致</b>。
- 覆盖：7 大模块 / 5 种方案 / 9 个坑
- 章节：1 CAP 与 BASE 的正确用法（CAP 只在分区时取舍）；2 2PC/3PC 的阻塞与协调者单点；3 TCC（Try/Confirm/Cancel 的空回滚与幂等）；4 Saga 与补偿（长事务、补偿失败怎么办）；5 本地消息表与事务消息（最常用的落地方式）；6 最终一致与对账（兜底才是关键）；7 幂等设计（token/唯一索引/状态机）；8 面试话术：先问一致性要求再选方案；9 坑；10 自测；11 术语表+下一步

### 32｜32-resilience.html
- 标题：限流、熔断、降级：讲清触发条件才算会
- 副标题：能说出「阈值怎么定、触发后走哪条路径、怎么恢复」的人，比会背四种限流算法的人值钱。
- 覆盖：7 大模块 / 4 种算法 / 9 个坑
- 章节：1 三种手段的分工（限流保护自己、熔断保护上游、降级保核心）；2 限流算法（计数器/滑动窗口/令牌桶/漏桶）；3 单机限流 vs 分布式限流（Redis + Lua 的代价）；4 熔断三态与半开探测；5 降级策略（读降级/写降级/开关/兜底数据）；6 隔离（线程池 vs 信号量）与超时预算；7 重试放大与退避（重试风暴怎么来的）；8 面试话术：给一组具体数字；9 坑；10 自测；11 术语表+下一步

### 33｜33-storage-fs.html
- 标题：存储与文件系统面试：ext4、XFS、NFS 与对象存储
- 副标题：面试问「磁盘满了但 du 看不到」，答案是<b>inode、被删未释放、还是挂载点被覆盖</b>——三种都常见。
- 覆盖：8 大模块 / 12 个考点 / 9 个坑
- 章节：1 块存储 / 文件存储 / 对象存储（各自的接口与适用场景）；2 inode 与目录结构（为什么小文件多会先耗尽 inode）；3 ext4 vs XFS（日志模式、扩容缩容、适用规模）；4 挂载与 fstab（挂载点被覆盖、nofail）；5 NFS 与文件锁（为什么数据库不能放 NFS）；6 RAID 级别与重建风险；7 SSD（TRIM、写放大、寿命）；8 对象存储语义（S3 的强一致、预签名 URL）；9 坑；10 自测；11 术语表+下一步

### 34｜34-container-security.html
- 标题：容器安全面试：逃逸、供应链与 RBAC
- 副标题：容器不是安全边界，<b>共享内核</b>这四个字决定了它所有的风险面。
- 覆盖：8 大模块 / 10 个攻击面 / 9 个坑
- 章节：1 威胁模型（镜像、运行时、编排、集群）；2 镜像供应链（最小基础镜像、扫描、签名、固定 digest）；3 运行时加固（非 root、只读根文件系统、drop capabilities、seccomp/AppArmor）；4 典型逃逸路径（挂载 docker.sock、hostPath、privileged、内核漏洞）；5 K8s RBAC 与 ServiceAccount（别给 cluster-admin）；6 Secret 管理与加密存储；7 NetworkPolicy 与零信任；8 审计与运行时检测（Falco 思路）；9 坑；10 自测；11 术语表+下一步

### 35｜35-cloud-cost.html
- 标题：云成本与容量：FinOps 面试题
- 副标题：「你怎么省钱」这题的满分答案不是砍机器，是<b>说清哪部分钱花得不值、以及你怎么证明</b>。
- 覆盖：7 大模块 / 8 个成本项 / 9 个坑
- 章节：1 云成本的构成（计算/存储/网络出流量/托管服务）；2 容量规划与弹性（峰值、预留、突发）；3 K8s 里的浪费（requests 虚高、副本过多、闲置命名空间）；4 存储生命周期（冷热分层、快照清理）；5 出网流量为什么最容易失控；6 成本分摊与标签治理；7 面试话术：用「基线 → 动作 → 节省 → 验证」四段讲；8 坑；9 自测；10 术语表+下一步

### 36｜36-written-test.html
- 标题：运维笔试题 30 道：手写命令与排障推演
- 副标题：笔试不只看答案对不对，<b>写出推理过程也能拿分</b>——很多人直接留空，白白丢分。
- 覆盖：30 道题 / 5 类题型 / 9 个坑
- 章节：1 题型分布与评分逻辑；2 文件与文本 8 题；3 进程与网络 8 题；4 Docker/K8s 6 题；5 Shell 脚本 4 题；6 排障推演 4 题（写出你的顺序）；7 答题技巧（不确定时怎么写）；8 常见送分题与陷阱题；9 坑；10 自测；11 术语表+下一步
