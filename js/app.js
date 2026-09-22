const termBody = document.getElementById('termBody');
const linesEl = document.getElementById('lines');
const typedEl = document.getElementById('typed');
const cursorEl = document.getElementById('cursor');
const input = document.getElementById('hiddenInput');
const terminalEl = document.getElementById('terminal');
const titlebarEl = document.getElementById('titlebar');
const notifEl = document.getElementById('notification');
const notifApp = document.getElementById('notifApp');
const notifTitle = document.getElementById('notifTitle');
const notifText = document.getElementById('notifText');
const notifClose = document.getElementById('notifClose');

// Developer's name, appended to `neofetch` output.
const DEVELOPER_NAME = 'cholasimmons';

const USERNAME_COOKIE = 'zt_username';
const DEFAULT_USERNAME = 'user';
const tbUserEl = document.getElementById('tbUser');
const promptUserEl = document.getElementById('promptUser');

function setCookie(name, value, days) {
  const d = new Date();
  d.setTime(d.getTime() + days * 24 * 60 * 60 * 1000);
  document.cookie = name + '=' + encodeURIComponent(value) + ';expires=' + d.toUTCString() + ';path=/;SameSite=Lax';
}

function getCookie(name) {
  const match = document.cookie.match(new RegExp('(?:^|; )' + name + '=([^;]*)'));
  return match ? decodeURIComponent(match[1]) : null;
}

let currentUsername = getCookie(USERNAME_COOKIE) || DEFAULT_USERNAME;

function applyUsername() {
  tbUserEl.textContent = currentUsername;
  promptUserEl.textContent = currentUsername;
}

let cmdHistory = [];
let histIndex = -1;
let blinkTimeout = null;
let notifHideTimeout = null;

function escapeHtml(s) {
  return s.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

function promptMarkup() {
  return '<span class="c-user">' + escapeHtml(currentUsername) + '@zambians.dev</span><span class="c-white">:</span><span class="c-path">~</span><span class="c-white">$</span>';
}

function addLine(html) {
  const div = document.createElement('div');
  div.className = 'line';
  div.innerHTML = html;
  linesEl.appendChild(div);
}

function scrollToBottom() {
  termBody.scrollTop = termBody.scrollHeight;
}

function neofetchOutput() {
  const header = currentUsername + '@zambians.dev';
  return [
    header,
    '-'.repeat(header.length),
    'OS: Ubuntu 24.04 LTS x86_64',
    'Kernel: 6.8.0-generic',
    'Shell: bash 5.2',
    'Terminal: zambians.dev',
    'CPU: Virtual Core (4)',
    'Memory: 2048MiB / 7860MiB',
    'Developer: ' + escapeHtml(DEVELOPER_NAME)
  ].join('<br>');
}

function unameOutput(flag) {
  if (flag === '-a') {
    return 'Linux zambians-dev 6.8.0-51-generic #52-Ubuntu SMP PREEMPT_DYNAMIC x86_64 GNU/Linux';
  }
  return 'Linux';
}

function showNotification(title, body, appLabel, url) {
  notifApp.textContent = appLabel || 'zambians.dev';
  notifTitle.textContent = title || '';
  notifText.textContent = body || '';
  notifText.style.display = body ? 'block' : 'none';
  notifEl.classList.add('show');

  if (url) {
    notifEl.style.cursor = 'pointer';
    notifEl.onclick = () => window.open(url, '_blank', 'noopener');
  } else {
    notifEl.style.cursor = 'default';
    notifEl.onclick = null;
  }

  clearTimeout(notifHideTimeout);
  notifHideTimeout = setTimeout(hideNotification, 5000);
}

function hideNotification() {
  notifEl.classList.remove('show');
  clearTimeout(notifHideTimeout);
}

notifClose.addEventListener('click', (e) => {
  e.stopPropagation();
  hideNotification();
});

// Parses: notify-send "Title" "Optional body"  (also allows unquoted single-word args)
function parseNotifyArgs(str) {
  const re = /"([^"]*)"|'([^']*)'|(\S+)/g;
  const out = [];
  let m;
  while ((m = re.exec(str)) !== null) {
    out.push(m[1] !== undefined ? m[1] : (m[2] !== undefined ? m[2] : m[3]));
  }
  return out;
}

function runCommand(raw) {
  const cmd = raw.trim();
  addLine(promptMarkup() + '&nbsp;<span class="c-input">' + escapeHtml(raw) + '</span>');

  if (cmd.length === 0) { scrollToBottom(); return; }

  cmdHistory.push(cmd);
  histIndex = cmdHistory.length;

  const parts = cmd.split(/\s+/);
  const name = parts[0].toLowerCase();
  const arg = parts.slice(1).join(' ');

  switch (name) {
    case 'help':
      addLine('Available commands: help, whoami, pwd, ls, date, echo, uname, su, notify-send, neofetch, history, clear');
      break;
    case 'whoami':
      addLine(currentUsername);
      break;
    case 'su': {
      const newName = parts[1];
      if (!newName) {
        addLine('<span class="c-dim">Usage: su &lt;username&gt;</span>');
      } else if (!/^[A-Za-z_][A-Za-z0-9_-]{0,20}$/.test(newName)) {
        addLine('su: invalid user name &#39;' + escapeHtml(newName) + '&#39;');
      } else {
        currentUsername = newName;
        setCookie(USERNAME_COOKIE, currentUsername, 365);
        applyUsername();
      }
      break;
    }
    case 'pwd':
      addLine('/home/user');
      break;
    case 'ls':
      addLine('Desktop  Documents  Downloads  Music  Pictures  Videos  projects');
      break;
    case 'date':
      addLine(new Date().toString());
      break;
    case 'echo':
      addLine(escapeHtml(arg));
      break;
    case 'clear':
      linesEl.innerHTML = '';
      break;
    case 'history':
      addLine(cmdHistory.map((h, i) => (i + 1) + '  ' + escapeHtml(h)).join('<br>'));
      break;
    case 'neofetch':
      addLine(neofetchOutput());
      break;
    case 'uname':
      addLine(unameOutput(arg.trim()));
      break;
    case 'notify-send': {
      const notifArgs = parseNotifyArgs(cmd.slice(name.length).trim());
      if (notifArgs.length === 0) {
        addLine('<span class="c-dim">Usage: notify-send "Title" ["Body"]</span>');
      } else {
        showNotification(notifArgs[0], notifArgs[1] || '');
      }
      break;
    }
    case 'sudo':
      addLine('<span class="c-dim">user is not in the sudoers file. This incident will be reported.</span>');
      break;
    case 'exit':
      addLine('logout');
      break;
    default:
      addLine('bash: ' + escapeHtml(name) + ': command not found');
  }
  scrollToBottom();
}

// Pauses the terminal's blinking cursor.
function pauseBlink() {
  cursorEl.classList.add('typing');
  clearTimeout(blinkTimeout);
  blinkTimeout = setTimeout(() => cursorEl.classList.remove('typing'), 450);
}

input.addEventListener('input', () => {
  typedEl.textContent = input.value;
  pauseBlink();
  scrollToBottom();
});

input.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    e.preventDefault();
    runCommand(input.value);
    input.value = '';
    typedEl.textContent = '';
    pauseBlink();
  } else if (e.key === 'ArrowUp') {
    e.preventDefault();
    if (cmdHistory.length && histIndex > 0) {
      histIndex--;
      input.value = cmdHistory[histIndex];
      typedEl.textContent = input.value;
    }
  } else if (e.key === 'ArrowDown') {
    e.preventDefault();
    if (histIndex < cmdHistory.length - 1) {
      histIndex++;
      input.value = cmdHistory[histIndex];
    } else {
      histIndex = cmdHistory.length;
      input.value = '';
    }
    typedEl.textContent = input.value;
  }
});

// Facebook group URL.
const FACEBOOK_URL = 'https://www.facebook.com/groups/1421088291504611/';

// Initiates the native-style desktop notification.
function announceFacebookGroup() {
  showNotification(
    'Website in development',
    'Follow Zambian Programmers on Facebook',
    'zambians.dev',
    FACEBOOK_URL
  );
}

terminalEl.addEventListener('click', () => input.focus());
// Clicking the terminal's title bar reveals the native-style desktop notification again.
titlebarEl.addEventListener('click', announceFacebookGroup);
// On page load, the terminal's input field is focused and the native-style desktop notification is displayed the first time.
window.addEventListener('load', () => {
  applyUsername();
  input.focus();
  setTimeout(announceFacebookGroup, 1200);
});

