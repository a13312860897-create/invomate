# Trae 无时间压力版行动报告

## 主题：注册→开票全链路裂缝扫描

### 节奏：无倒计时，每天勾 1-3 站，随时可停，全部 ✅ 后再碰 Paddle

---

## 1. 最终目标

「注册→验证→登录→新建发票→发邮件→下载 PDF」全程零阻塞，所有裂缝已登记并已修复 → 合并到 `main` → 再开 Paddle 生产切换分支。

---

## 2. 路线 & 最小动作（按顺序，但可跳跃）

| 站 | 可复制命令 / 操作 | 预期 ✅ | 失败登记（当场填） |
|---|---|---|---|
| ① 注册页 | `curl -X POST http://localhost:3002/api/register -d '{"email":"a@x.com","country":"BR"}' -H "Content-Type: application/json"` | DB `locale='BR'` | ❌ 字段缺失 |
| ② 邮箱验证 | `tail -f logs/mailer.log | grep a@x.com` 看标题是否 `Verifique seu e-mail` | 标题葡语 | |
| ③ 登录后首页 | 浏览器打开 `/dashboard` → 目视无「巴西/法国」按钮 | 按钮消失 | ❌ 仍显示 |
| ④ 新建发票 | 在 `/invoice/new` 输入 buyer CNPJ `12.345.678/0001-90` → Save | 字段存库 & PDF 格式化 | ❌ 未格式化 |
| ⑤ 发送邮件 | `curl -X POST http://localhost:3002/api/invoice/1/send-email` | 收到 PDF 附件 | ❌ 未收到/损坏 |
| ⑥ 下载 PDF | 点击「Download」→ 文件名 `Fatura_1.pdf` 打开无乱码 | 正常显示 | ❌ 损坏/断页 |

---

## 3. 你要提前准备（一次性 3 min）

1. 分支：`git checkout -b smoke/reg2inv`
2. 日志窗口：
   - `tail -f logs/mailer.log`
   - `tail -f logs/error.log`
3. DB 快捷语句：
   `SELECT id,email,locale FROM users ORDER BY id DESC LIMIT 1;`

---

## 4. 产出流程

- 每完成 1 站，当场填 ❌/✅ → 立刻 commit `fix: smoke-③ toggle removed` 等
- 全部 ✅ 后：
  `git tag v1.0-reg2inv-ready` → PR → 合并 main → 通知我开 Paddle 专项