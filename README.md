# 写给自己 · To Myself

只有一篇、一镜到底的私人笔记。日期是分隔线，文字用 Markdown 写，阅读时自动排版。

![写给自己 · 界面预览](docs/preview.jpg)

第一次用？先看 **[保姆级教学](保姆级教学.md)** —— 从「双击打开」到「补记、搜索、换电脑搬家」都写了，不需要懂编程。

## 第一次使用

### 第 1 步：拿到代码（Windows / Linux 完全一样）

```bash
git clone https://github.com/HUAHUA768/To_Myself_Diary.git
cd To_Myself_Diary
```

没装 Git：在仓库首页点 **Code → Download ZIP**，解压后进入文件夹。

需要 **Node.js 20.19+ 或 22.12+**（推荐 22 LTS，[下载](https://nodejs.org/)，安装保持默认选项即可）。Windows 和 Linux 都要先装它。

### 第 2 步：按你的平台初始化

#### Windows

1. 双击 **`start-diary.bat`**。首次运行会自动安装依赖并构建（约一两分钟），之后直接秒开。
2. 想从桌面或项目根目录点图标启动，再运行一次：

   ```powershell
   powershell -ExecutionPolicy Bypass -File scripts\create-shortcut.ps1 -Desktop
   ```

   它会生成 `写给自己.lnk`（`.lnk` 记的是本机路径，不进仓库；换电脑要重新生成）。
3. 停止服务：关掉任务栏里那个最小化的命令行窗口，或在窗口里按 `Ctrl + C`。

#### Linux / WSL

1. 进入项目目录，运行一键脚本：

   ```bash
   ./start-diary.sh
   ```

   首次运行会自动安装依赖并构建。如果提示 `Permission denied`，先补一次执行权限：

   ```bash
   chmod +x start-diary.sh
   ```

2. 启动后访问 **<http://localhost:4174/>**。WSL 没有图形界面时不会自动开浏览器，直接在 Windows 浏览器里打开这个地址即可（WSL2 会自动转发 localhost）；也可以加 `--no-open` 跳过打开浏览器的尝试：

   ```bash
   ./start-diary.sh --no-open
   ```

3. 停止服务：在运行脚本的终端里按 `Ctrl + C`。

> 两个平台是同一份代码、同一种数据格式，区别只在启动方式。数据存在浏览器本地，不会上传。

## 两个平台对照

| 想做的事 | Windows | Linux / WSL |
| --- | --- | --- |
| 初始化并启动 | 双击 `start-diary.bat` | `./start-diary.sh` |
| 日常写作 | 双击 `写给自己.lnk` 或 `start-diary.bat` | `./start-diary.sh` |
| 开发模式（热更新） | 双击 `dev.bat` | `npm run dev` |
| 只做构建 | 双击 `build.bat` | `npm run build` |
| 跑生产版 | `npm start` | `npm start -- --no-open` |
| 重建快捷方式 | `scripts\create-shortcut.ps1` | 可选：自建 `.desktop` |

## Windows 细节

![在 Windows 上运行](docs/preview-windows.jpg)

界面默认用系统自带的 Edge 以「应用窗口」方式打开，没有 Edge 时退回默认浏览器。

`start-diary.bat` 会依次检查 Node、必要时装依赖、必要时构建，然后最小化地跑起本地服务。再点一次不会报端口占用，会直接再打开一个日记窗口。

| 脚本 | 作用 |
| --- | --- |
| `start-diary.bat` | 日常写作：必要时自动安装依赖、构建，然后用 Edge 应用窗口打开日记 |
| `dev.bat` | 开发模式：带热更新的开发服务器，改代码页面立即刷新 |
| `build.bat` | 只做生产构建，产物输出到 `dist/` |

`写给自己.lnk` 里记录的是项目的绝对路径。如果把整个文件夹挪到别处，或者想换图标，重新运行一次 `create-shortcut.ps1` 即可；不带 `-Desktop` 就只重建项目里那一份。图标文件是 `docs/app-icon.ico`。

## Linux / WSL 细节

`start-diary.sh` 是 Windows `start-diary.bat` 的对应物：检查 Node 版本 → 缺依赖就 `npm install` → 启动 `scripts/serve-dist.mjs`（需要时自动构建）。参数会原样传给它：

```bash
./start-diary.sh --no-open        # 不打开浏览器
./start-diary.sh --port 4300      # 换端口（换端口=换站点，看不到原数据）
./start-diary.sh --host 0.0.0.0   # 允许局域网/手机访问
```

开发时用 `npm run dev`；想手动跑生产版：

```bash
npm run build
npm start -- --no-open
```

`--no-open` 是给没有 `xdg-open` 的 WSL 用的。就算忘了加，服务也只会打印一句「请手动访问」，不会退出。

## 命令行

```bash
npm install        # 安装依赖（首次）
npm run dev        # 开发服务器，自动打开 http://localhost:4174/
npm run build      # 生产构建，输出到 dist/
npm start          # 用内置零依赖服务器运行 dist/（可加 --port 4300）
npm run preview    # 用 Vite 预览生产构建
```

## 特性

- 单篇连续笔记，按日期自动归档；同一天反复书写会合并在一块
- 点击任意一天就地编辑 Markdown，离开后自动渲染并保存
- 支持补记过去日期、删除某一天、全文搜索和日期快速跳转
- 内置六种背景主题；支持纯色、渐变、本地图片自定义，图片可调节模糊、不透明度与暗度
- 深色 / 浅色阅读模式，日期正序 / 倒序切换
- Markdown 快捷工具栏与快捷键
- 字数、记录天数、连续记录统计
- 导出 Markdown / 完整 JSON 备份，支持重新导入
- 数据只保存在当前浏览器 IndexedDB，无账号、无服务器

## 快捷键

| 操作 | 快捷键 |
| --- | --- |
| 搜索笔记 / 日期 | `Ctrl/⌘ + K` |
| 保存到本地 | `Ctrl/⌘ + S` |
| 完成当天编辑 | `Ctrl/⌘ + Enter` 或 `Esc` |
| 加粗 / 斜体 / 链接 | `Ctrl/⌘ + B` / `I` / `K` |

Windows 上快捷键统一显示为 `Ctrl`。

## 数据与备份

笔记与背景图片保存在浏览器本地，不会上传。清理浏览器站点数据会删除笔记，请定期在「布置 → 数据与备份」中导出备份。

导出的 Markdown 使用以下格式保存日期分块，重新导入时可被识别：

```md
<!-- to-myself:2026-10-25 -->
## 2026年10月25日 · 星期日

这一天的内容…
```

**换电脑或换浏览器时**：数据不会自动跟过来，先在原环境里导出完整 JSON 备份，再到新环境导入。在 Windows 记事本里改过再导入的 `.md`（CRLF 换行）同样可以正常识别。

**地址决定看到哪份数据**：浏览器的本地数据按「站点」隔离，`http://localhost:4174`、`http://127.0.0.1:4174` 以及换端口后的地址都算不同站点。请固定用 `http://localhost:4174` 打开（`start-diary.bat`、`start-diary.sh` 和 `npm run dev` 默认都是它）。同一台 Windows、同一个浏览器、同一个地址，用哪个平台起的服务都是同一份数据；换了浏览器或换了电脑才需要导入备份。

**别让日记进 Git**：导出的备份（`写给自己-*.md`、`写给自己-*.json`）和本机快捷方式（`*.lnk`）都已在 `.gitignore` 里忽略，避免私人内容被误提交。想额外确认可以用 `git status` 看一眼。

## 常见问题

- **首次运行弹出 Windows 防火墙提示**：开发服务器监听 `0.0.0.0` 方便手机访问，允许「专用网络」即可；只在本机写作点取消也不影响。
- **快捷方式打不开或图标不对**：项目移动过位置就重新运行 `create-shortcut.ps1`；图标偶尔是 Windows 缓存，稍等几秒或重启资源管理器。
- **端口 4174 被占用**：多半是另一个平台的服务还开着，先关掉；或换端口 `--port 4300`（换端口等于换站点，看不到原端口下的笔记）。
- **WSL 里没有自动打开浏览器**：正常，手动访问 `http://localhost:4174/` 即可；也可以 `sudo apt install xdg-utils`。
- **`./start-diary.sh: Permission denied`**：`chmod +x start-diary.sh`。
- **想让手机也能写**：`npm start -- --host 0.0.0.0`，按打印出的局域网地址访问（手机和电脑需在同一 Wi-Fi），手机上是另一份数据。

## 移植说明

这个项目原本在 WSL / Linux 下开发，为了两个平台都能一键启动做了这些调整：

| 改动 | 原因 |
| --- | --- |
| `start-diary.bat` / `dev.bat` / `build.bat` | Windows 双击即用，不必手敲命令 |
| `start-diary.sh` | Linux / WSL 的一键入口，和 `.bat` 对应 |
| `写给自己.lnk` + `docs/app-icon.ico` + `scripts/create-shortcut.ps1` | 中文命名快捷方式，点一下写作；图标由 `favicon.svg` 渲染成多尺寸 `.ico`，换位置后可一键重建 |
| `scripts/serve-dist.mjs` | 零依赖静态服务器，构建产物可直接当本地应用运行；启动时自动判断是否需要重新构建，并优先用 Edge 应用窗口打开 |
| `src/lib/document.ts` | 导入 `.md` / JSON 时把 CRLF 统一成 LF，避免 Windows 保存的文件混入 `\r` |
| `.gitattributes` | 仓库统一存 LF，`.bat` 检出为 CRLF，`.sh` 检出为 LF |
| `.npmrc` + `vite.config.ts` 的 `watch.ignored` | npm 缓存与构建产物放在项目内，避免系统目录权限问题，也不让热更新去监听它们 |
| `package.json` 的 `engines` | 标明与 Vite 8 一致的 Node.js 版本范围 |

依赖里 `rolldown`、`lightningcss` 这类带原生二进制的包，`npm install` 时会自动取当前平台版本（Windows / Linux），无需手工处理。