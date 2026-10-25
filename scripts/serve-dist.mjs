#!/usr/bin/env node
/**
 * 写给自己 · Windows 本地启动器
 *
 * 零依赖静态服务器：构建一次 `dist/`，然后用它当本地小应用打开，
 * 不需要 Vite 开发服务器，也不需要联网。
 *
 * 用法：
 *   node scripts/serve-dist.mjs                # 需要时自动构建，然后打开浏览器窗口
 *   node scripts/serve-dist.mjs --no-open      # 只启动服务器
 *   node scripts/serve-dist.mjs --build        # 强制重新构建
 *   node scripts/serve-dist.mjs --port 4300    # 换端口（换端口等于换站点，看不到原来的笔记）
 *   node scripts/serve-dist.mjs --host 0.0.0.0 # 允许同一局域网的手机访问
 *   node scripts/serve-dist.mjs --no-app       # 用默认浏览器而不是 Edge 应用窗口
 */
import { spawn, spawnSync } from "node:child_process";
import { createReadStream, existsSync, readdirSync, statSync } from "node:fs";
import { createServer } from "node:http";
import { networkInterfaces } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);
const distDir = path.join(projectRoot, "dist");
const indexFile = path.join(distDir, "index.html");

const argv = process.argv.slice(2);
const hasFlag = (name) => argv.includes(name);
const readOption = (name, fallback) => {
  const index = argv.indexOf(name);
  const value = index >= 0 ? argv[index + 1] : undefined;
  return value && !value.startsWith("--") ? value : fallback;
};

// 默认只监听本机回环地址。开发服务器（vite）打印的是 http://localhost:4174，
// 这里也用 localhost 打开，确保浏览器把它们当成同一个站点，笔记数据才互通。
const hostOption = readOption("--host", "");
const addresses = hostOption ? [hostOption] : ["127.0.0.1", "::1"];
const port = Number(readOption("--port", process.env.PORT ?? 4174));
const shouldOpen = !hasFlag("--no-open");
const useAppWindow = !hasFlag("--no-app");
const rebuildWhenStale = !hasFlag("--no-build");

const MIME_TYPES = new Map([
  [".html", "text/html; charset=utf-8"],
  [".js", "text/javascript; charset=utf-8"],
  [".mjs", "text/javascript; charset=utf-8"],
  [".css", "text/css; charset=utf-8"],
  [".json", "application/json; charset=utf-8"],
  [".svg", "image/svg+xml"],
  [".png", "image/png"],
  [".jpg", "image/jpeg"],
  [".jpeg", "image/jpeg"],
  [".webp", "image/webp"],
  [".ico", "image/x-icon"],
  [".woff", "font/woff"],
  [".woff2", "font/woff2"],
  [".txt", "text/plain; charset=utf-8"],
  [".map", "application/json; charset=utf-8"],
]);

function fail(message) {
  console.error(`\n✗ ${message}\n`);
  process.exit(1);
}

function runBuild() {
  console.log("→ 正在构建生产版本（npm run build）…");
  const result = spawnSync("npm", ["run", "build"], {
    cwd: projectRoot,
    stdio: "inherit",
    shell: true,
  });
  if (result.status !== 0) {
    fail("构建失败，请检查上面的错误信息。");
  }
}

function newestMtime(targets) {
  let newest = 0;
  for (const target of targets) {
    if (!existsSync(target)) continue;
    const stats = statSync(target);
    if (!stats.isDirectory()) {
      newest = Math.max(newest, stats.mtimeMs);
      continue;
    }
    for (const entry of readdirSync(target, { withFileTypes: true })) {
      newest = Math.max(
        newest,
        newestMtime([path.join(target, entry.name)]),
      );
    }
  }
  return newest;
}

function needsBuild() {
  if (!existsSync(indexFile)) return true;
  if (hasFlag("--build")) return true;
  if (!rebuildWhenStale) return false;

  const builtAt = statSync(indexFile).mtimeMs;
  const sources = [
    "src",
    "public",
    "index.html",
    "package.json",
    "vite.config.ts",
    "tsconfig.json",
    "tsconfig.app.json",
    "tsconfig.node.json",
  ].map((name) => path.join(projectRoot, name));

  return newestMtime(sources) > builtAt;
}

function browserHost(host) {
  // 本机地址统一显示成 localhost：和 `npm run dev` 打印的地址一致，
  // 浏览器才会把它当作同一个站点，共用同一份 IndexedDB 数据。
  if (!host || host === "0.0.0.0" || host === "::" || host === "::1" || host === "127.0.0.1") {
    return "localhost";
  }
  return host.includes(":") ? `[${host}]` : host;
}

function findEdge() {
  const candidates = [
    process.env["ProgramFiles(x86)"],
    process.env.ProgramFiles,
    process.env.LOCALAPPDATA,
  ]
    .filter(Boolean)
    .map((base) =>
      path.join(base, "Microsoft", "Edge", "Application", "msedge.exe"),
    );

  return candidates.find((candidate) => existsSync(candidate)) ?? null;
}

function openUrl(url) {
  if (!shouldOpen) return;

  const edge = findEdge();
  if (edge && useAppWindow) {
    // Edge 的 --app 模式去掉地址栏和标签页，用起来更像桌面笔记应用。
    spawn(edge, [`--app=${url}`, "--window-size=1280,920"], {
      detached: true,
      stdio: "ignore",
    }).unref();
    return;
  }

  if (process.platform === "win32") {
    spawn("cmd", ["/c", "start", "", url], {
      detached: true,
      stdio: "ignore",
      windowsHide: true,
    }).unref();
    return;
  }

  const command = process.platform === "darwin" ? "open" : "xdg-open";
  spawn(command, [url], { detached: true, stdio: "ignore" }).unref();
}

function lanAddresses() {
  return Object.values(networkInterfaces())
    .flat()
    .filter(
      (info) =>
        info && info.family === "IPv4" && !info.internal && info.address,
    )
    .map((info) => info.address);
}

function resolveRequestPath(pathname) {
  if (pathname.includes("\0")) return null;

  const relative = path.normalize(pathname).replace(/^([/\\])+/, "");
  let target = path.join(distDir, relative);

  if (target !== distDir && !target.startsWith(distDir + path.sep)) {
    return null;
  }

  if (existsSync(target) && statSync(target).isDirectory()) {
    target = path.join(target, "index.html");
  }

  if (!existsSync(target)) {
    // 单页应用没有其它路由，找不到的路径回退到首页。
    if (path.extname(pathname)) return null;
    target = indexFile;
  }

  return existsSync(target) ? target : null;
}

function send(res, status, body) {
  res.writeHead(status, {
    "Content-Type": "text/plain; charset=utf-8",
    "Content-Length": Buffer.byteLength(body),
    "Cache-Control": "no-store",
  });
  res.end(body);
}

function handleRequest(req, res) {
  if (req.method !== "GET" && req.method !== "HEAD") {
    send(res, 405, "Method Not Allowed");
    return;
  }

  let pathname;
  try {
    pathname = decodeURIComponent(
      new URL(req.url ?? "/", "http://localhost").pathname,
    );
  } catch {
    send(res, 400, "Bad Request");
    return;
  }

  const filePath = resolveRequestPath(pathname);
  if (!filePath) {
    send(res, 404, "Not Found");
    return;
  }

  const stats = statSync(filePath);
  const extension = path.extname(filePath).toLowerCase();
  const isAsset = filePath.startsWith(path.join(distDir, "assets") + path.sep);

  res.writeHead(200, {
    "Content-Type": MIME_TYPES.get(extension) ?? "application/octet-stream",
    "Content-Length": stats.size,
    "Cache-Control": isAsset
      ? "public, max-age=31536000, immutable"
      : "no-cache",
    "X-Content-Type-Options": "nosniff",
  });

  if (req.method === "HEAD") {
    res.end();
    return;
  }

  createReadStream(filePath)
    .on("error", () => res.destroy())
    .pipe(res);
}

const servers = [];

function startServer(address) {
  return new Promise((resolve, reject) => {
    const server = createServer(handleRequest);
    server.once("error", reject);
    server.listen(port, address, () => {
      server.off("error", reject);
      servers.push(server);
      resolve();
    });
  });
}

async function startListening() {
  const problems = [];

  for (const address of addresses) {
    try {
      await startServer(address);
    } catch (error) {
      if (error.code === "EADDRINUSE") throw error;
      problems.push(`${address}: ${error.code ?? error.message}`);
    }
  }

  if (servers.length === 0) {
    throw new Error(`无法监听端口 ${port}（${problems.join("，")}）`);
  }
}

function existingServerUrl() {
  return `http://${browserHost(hostOption)}:${port}/`;
}

async function isDiaryAlreadyRunning() {
  try {
    const response = await fetch(existingServerUrl(), {
      signal: AbortSignal.timeout(2000),
    });
    if (!response.ok) return false;
    return (await response.text()).includes("写给自己");
  } catch {
    return false;
  }
}

async function main() {
  if (needsBuild()) runBuild();
  if (!existsSync(indexFile)) {
    fail("没有找到 dist/index.html，构建似乎没有完成。");
  }

  try {
    await startListening();
  } catch (error) {
    if (error.code === "EADDRINUSE") {
      // 再点一次快捷方式时，如果日记已经在跑，就直接把窗口调出来。
      if (await isDiaryAlreadyRunning()) {
        const url = existingServerUrl();
        console.log(`\n  日记已经在运行，正在打开：${url}`);
        console.log("  想彻底停止的话，关掉那个最小化的黑色命令行窗口即可。\n");
        openUrl(url);
        return;
      }

      fail(
        `端口 ${port} 已被占用。可能已经启动过一份，或者 WSL 里的开发服务器还开着。\n` +
          `  换一个端口再试：node scripts/serve-dist.mjs --port 4300\n` +
          `  注意：换端口等于换站点，看不到原端口下的笔记。`,
      );
    }
    fail(error.message);
  }

  const localUrl = existingServerUrl();

  console.log("\n  写给自己 · To Myself");
  console.log(`  ➜  本地: ${localUrl}`);
  if (hostOption === "0.0.0.0") {
    for (const address of lanAddresses()) {
      console.log(`  ➜  局域网: http://${address}:${port}/`);
    }
  }
  console.log("  按 Ctrl+C 停止。\n");

  setTimeout(() => openUrl(localUrl), 300);
}

for (const signal of ["SIGINT", "SIGTERM"]) {
  process.on(signal, () => {
    Promise.all(
      servers.map(
        (server) => new Promise((resolve) => server.close(resolve)),
      ),
    ).then(() => process.exit(0));
  });
}

main().catch((error) => fail(error.message));
