# 🧭 团队开发提交流程规范（Git + GitHub）

> 为了保证代码质量、审查流程、以及主分支的稳定性，所有开发人员请遵守以下提交和合并流程。

---

## 📌 分支命名规范

| 类型     | 命名格式             | 示例                       |
| ------ | ---------------- | ------------------------ |
| 功能开发   | `feature/模块名-描述` | `feature/user-login`     |
| Bug 修复 | `fix/模块名-描述`     | `fix/api-response-error` |
| UI 修改  | `ui/模块名-描述`      | `ui/navbar-style-update` |
| 文档修改   | `docs/模块名-描述`    | `docs/api-readme-update` |
| 临时调试   | `test/模块名-描述`    | `test/login-debug`       |

---

## 🚀 开发流程

### 1️⃣ 拉取主分支最新代码

```bash
git checkout main
git pull origin main
```

---

### 2️⃣ 创建功能分支并切换

```bash
git checkout -b feature/your-feature-name
```

---

### 3️⃣ 正常开发 + 提交

每次提交请遵循 [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/) 格式：

```bash
git add .
git commit -m "feat: 增加用户登录功能"
```

| 类型          | 说明          |
| ----------- | ----------- |
| `feat:`     | 新功能         |
| `fix:`      | Bug 修复      |
| `docs:`     | 文档变更        |
| `style:`    | 空格、缩进、格式等变动 |
| `refactor:` | 重构，无功能变化    |
| `test:`     | 增删测试        |
| `chore:`    | 构建过程或工具变更   |

---

### 4️⃣ 推送分支到远程仓库

```bash
git push origin feature/your-feature-name
```

---

### 5️⃣ 发起 Pull Request（PR）

在 GitHub 仓库页面点击 `Compare & Pull Request`：

* 基于 `main`（或 `dev`）合并
* 填写标题和说明，说明变更点和目的
* 指定 Reviewer（如主管或模块负责人）

---

### 6️⃣ 通过审核和自动检查

* ✅ 至少 1 位 Reviewer 审核通过
* ✅ 所有代码冲突已解决
* ✅ 所有 CI 检查通过（如 lint、test）

---

### 7️⃣ 合并 PR（仅允许通过 GitHub 网页合并）

* 勾选 “Squash and merge”（推荐）合并方式，保持主分支干净
* 合并后删除该功能分支

---

### 🔒 重要限制（已通过 GitHub 设置）

* 🚫 禁止任何人直接 `push` 到 `main` 分支
* ✅ 所有合并必须通过 PR
* ✅ 所有 PR 至少一人审核通过
* ✅ 若有新提交，需重新审查

---

## ⚠️ 注意事项

* 请勿将调试代码、未使用的函数、`console.log` 提交入库
* 每次合并主分支前请 `git pull --rebase` 保持更新
* 有冲突请优先自行解决，如无法解决可 @ 管理员协助

---

## 📎 附加资源

* ✅ [代码风格规范](./code-style.md)
* ✅ [组件命名规范](./naming-guide.md)
* ✅ [提交格式校验工具（如 commitlint）](./commit-config.md)

---

如有任何流程问题，请联系项目管理员 @xxx 或在项目群沟通确认。

