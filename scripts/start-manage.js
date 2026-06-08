// 启动 Astro dev server 并打开管理页面
import { spawn } from 'node:child_process';
import { execSync } from 'node:child_process';

const server = spawn('npx', ['astro', 'dev'], {
  stdio: 'inherit',
  shell: true,
});

// Wait for server to be ready, then open /manage
setTimeout(() => {
  try {
    const platform = process.platform;
    if (platform === 'win32') {
      execSync('start http://localhost:4321/manage', { shell: true });
    } else if (platform === 'darwin') {
      execSync('open http://localhost:4321/manage');
    } else {
      execSync('xdg-open http://localhost:4321/manage');
    }
  } catch { /* browser open is best-effort */ }
}, 3000);

// Forward exit
process.on('SIGINT', () => { server.kill(); process.exit(); });
