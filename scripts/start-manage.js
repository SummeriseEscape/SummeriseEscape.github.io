// 启动 Astro dev server 并打开管理页面
import { spawn, execSync } from 'node:child_process';

const MANAGE_URL = 'http://localhost:4321/manage';
const CHECK_URL = 'http://localhost:4321';
const PORT = 4321;

function killExisting() {
  try {
    if (process.platform === 'win32') {
      const out = execSync(`netstat -ano | findstr :${PORT}`, { encoding: 'utf-8' });
      const seen = new Set();
      for (const line of out.trim().split('\n')) {
        const parts = line.trim().split(/\s+/);
        const pid = parts[parts.length - 1];
        if (pid && /^\d+$/.test(pid) && !seen.has(pid)) {
          seen.add(pid);
          try { execSync(`taskkill /f /pid ${pid}`, { stdio: 'ignore' }); } catch {}
        }
      }
    } else {
      try { execSync(`lsof -ti:${PORT} | xargs kill -9`, { stdio: 'ignore' }); } catch {}
    }
    // 等待端口释放
    return new Promise((resolve) => setTimeout(resolve, 500));
  } catch { /* 没有进程占用端口 */ }
}

async function isRunning() {
  try {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 2000);
    await fetch(CHECK_URL, { signal: ctrl.signal });
    clearTimeout(timer);
    return true;
  } catch {
    return false;
  }
}

function openBrowser() {
  try {
    if (process.platform === 'win32') {
      execSync(`start "" "${MANAGE_URL}"`, { shell: true });
    } else if (process.platform === 'darwin') {
      execSync(`open "${MANAGE_URL}"`);
    } else {
      execSync(`xdg-open "${MANAGE_URL}"`);
    }
  } catch { /* 浏览器打开失败 */ }
}

async function waitForServer() {
  for (let i = 0; i < 30; i++) {
    process.stdout.write(`\r  等待服务启动... ${i + 1}/30`);
    if (await isRunning()) {
      console.log('  ✓');
      return true;
    }
    await new Promise((r) => setTimeout(r, 1000));
  }
  console.log('  ✗');
  return false;
}

async function main() {
  console.log('');
  console.log('  ╔════════════════════════╗');
  console.log('  ║   星风 · 内容管理      ║');
  console.log('  ╚════════════════════════╝');
  console.log('');

  // 先杀掉旧进程，确保使用最新代码
  await killExisting();

  console.log('  正在启动 Astro dev server...');
  const server = spawn('npx', ['astro', 'dev'], {
    stdio: 'pipe',
    shell: true,
    cwd: process.cwd(),
  });

  server.stdout?.on('data', (d) => process.stdout.write(d));
  server.stderr?.on('data', (d) => process.stderr.write(d));

  server.on('error', (err) => {
    console.error('  启动失败:', err.message);
    process.exit(1);
  });

  const ready = await waitForServer();
  if (ready) {
    console.log('  服务就绪，打开管理页面...');
    openBrowser();
  } else {
    console.log('  启动超时，请手动打开 ' + MANAGE_URL);
  }

  process.on('SIGINT', () => {
    server.kill();
    process.exit();
  });
}

main();
