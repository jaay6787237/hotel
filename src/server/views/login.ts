import type { FlashMessage } from '../auth.ts';
import { escapeHtml, safeJson } from './helpers.ts';

export interface LoginViewProps {
  flash: FlashMessage | null;
  defaultAdminUser: string;
  isDefaultPassword: boolean;
}

export function renderLoginPage(props: LoginViewProps): string {
  const { flash, defaultAdminUser, isDefaultPassword } = props;
  const flashHtml = flash
    ? `<div role="alert" class="p-3.5 rounded-lg border text-xs font-medium ${
        flash.type === 'error'
          ? 'bg-red-50 border-red-200 text-red-700'
          : 'bg-emerald-50 border-emerald-200 text-[#007A33]'
      }">${escapeHtml(flash.message)}</div>`
    : '';

  const demoBoxHtml = isDefaultPassword
    ? `<div class="p-3.5 bg-emerald-50/70 border border-emerald-200 rounded-lg text-xs space-y-2">
        <div class="flex items-center justify-between gap-2">
          <span class="font-semibold text-[#005A2B]">Akun Default Front Office</span>
          <button
            type="button"
            id="fill-demo-btn"
            class="px-2.5 py-1 bg-white border border-emerald-300 text-[#007A33] hover:bg-emerald-50 rounded text-[11px] font-semibold cursor-pointer transition-colors whitespace-nowrap shrink-0"
          >
            Isi Kredensial
          </button>
        </div>
        <div class="grid grid-cols-1 gap-1 text-[11px] text-slate-700 font-mono">
          <div>Email: <strong class="text-slate-900 select-all">${escapeHtml(defaultAdminUser)}</strong></div>
          <div>Sandi: <strong class="text-slate-900 select-all">BukitRandu2026!</strong></div>
        </div>
      </div>`
    : '';

  return `<!doctype html>
<html lang="id">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Login Portal Admin | Bukit Randu Hospitality</title>
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@500;600&family=Playfair+Display:wght@600;700&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap" rel="stylesheet" />
  <script src="https://cdn.tailwindcss.com"></script>
  <script>
    tailwind.config = {
      theme: {
        extend: {
          fontFamily: {
            serif: ['"Playfair Display"', 'Georgia', 'serif'],
            sans: ['"Plus Jakarta Sans"', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
            mono: ['"JetBrains Mono"', 'monospace'],
          },
        },
      },
    };
  </script>
  <style>
    @keyframes loginCardEnter {
      from { opacity: 0; transform: translateY(20px) scale(0.98); }
      to { opacity: 1; transform: translateY(0) scale(1); }
    }
    @keyframes btnRippleAnim {
      from { transform: translate(-50%, -50%) scale(0); opacity: 0.45; }
      to { transform: translate(-50%, -50%) scale(2.8); opacity: 0; }
    }
    .animate-login-enter {
      animation: loginCardEnter 0.55s cubic-bezier(0.22, 1, 0.36, 1) both;
    }
    button, a.btn-press {
      position: relative;
      overflow: hidden;
      transition: transform 0.14s cubic-bezier(0.22, 1, 0.36, 1), background-color 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease;
    }
    button:active:not(:disabled), a.btn-press:active {
      transform: scale(0.97);
    }
    .btn-ripple-wave {
      position: absolute;
      border-radius: 9999px;
      background: rgba(255, 255, 255, 0.45);
      pointer-events: none;
      width: 80px;
      height: 80px;
      animation: btnRippleAnim 0.52s ease-out forwards;
    }
    .btn-ripple-wave.dark {
      background: rgba(0, 122, 51, 0.2);
    }
  </style>
</head>
<body class="min-h-screen bg-[#0F1F17] flex items-center justify-center p-4 sm:p-6 relative overflow-hidden font-sans">
  <img src="/assets/images/bukit_randu_hero_1794410439341.jpg" alt="Bukit Randu Resort" referrerpolicy="no-referrer" class="absolute inset-0 w-full h-full object-cover opacity-20" />
  <div class="absolute inset-0 bg-gradient-to-br from-[#0F1F17]/95 via-[#0F1F17]/85 to-[#005A2B]/80"></div>

  <main class="animate-login-enter relative z-10 w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
    <div class="px-8 py-6 bg-[#F8FAFC] border-b border-slate-200 text-center">
      <p class="text-[11px] font-bold uppercase tracking-widest text-[#D4AF37]">Front Office Management System</p>
      <h1 class="text-2xl font-serif font-bold text-[#0F1F17] mt-1">Bukit Randu Hospitality</h1>
      <p class="text-xs text-slate-600 mt-1">Masuk menggunakan akun Resepsionis atau Duty Manager</p>
    </div>

    <div class="p-6 sm:p-8 space-y-5">
      ${flashHtml}

      <form id="admin-login-form" method="POST" action="/admin/login" class="space-y-4">
        <div>
          <label for="username" class="text-xs font-semibold uppercase tracking-wider text-slate-700 block mb-1.5">Email / Username Admin</label>
          <input
            id="username"
            name="username"
            type="text"
            autocomplete="username"
            required
            value="${escapeHtml(defaultAdminUser)}"
            placeholder="admin@bukitrandu.com"
            class="w-full px-4 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:border-[#007A33] focus:ring-2 focus:ring-[#007A33]/20"
          />
        </div>

        <div>
          <label for="password" class="text-xs font-semibold uppercase tracking-wider text-slate-700 block mb-1.5">Kata Sandi</label>
          <div class="relative">
            <input
              id="password"
              name="password"
              type="password"
              autocomplete="current-password"
              required
              placeholder="Masukkan kata sandi admin"
              class="w-full pl-4 pr-11 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:border-[#007A33] focus:ring-2 focus:ring-[#007A33]/20"
            />
            <button
              type="button"
              id="toggle-password-btn"
              aria-label="Tampilkan kata sandi"
              aria-pressed="false"
              class="absolute inset-y-0 right-0 px-3 flex items-center text-slate-500 hover:text-slate-800 cursor-pointer focus:outline-none"
            >
              <svg id="eye-icon-show" xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path stroke-linecap="round" stroke-linejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
              <svg id="eye-icon-hide" xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 hidden" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
              </svg>
            </button>
          </div>
        </div>

        <button
          type="submit"
          id="login-submit-btn"
          class="w-full py-3 bg-[#007A33] hover:bg-[#005A2B] text-white text-xs font-semibold uppercase tracking-wider rounded-lg shadow-md hover:shadow-lg transition-all cursor-pointer whitespace-nowrap flex items-center justify-center gap-2"
        >
          <span>Masuk ke Dashboard Front Office</span>
        </button>
      </form>

      ${demoBoxHtml}

      <div class="p-3 bg-[#F8FAFC] border border-slate-200 rounded-lg text-[11px] text-slate-600">
        Sesi dilindungi tanda tangan kriptografi HMAC SHA-256 pada HTTP-Only Cookie.
      </div>

      <div class="text-center pt-1">
        <a href="/" class="btn-press inline-block px-3 py-1.5 rounded text-xs font-semibold text-[#007A33] hover:bg-emerald-50 transition-colors">&larr; Kembali ke Halaman Utama Tamu</a>
      </div>
    </div>
  </main>

  <script>
    (function () {
      const passwordInput = document.getElementById('password');
      const toggleBtn = document.getElementById('toggle-password-btn');
      const eyeShow = document.getElementById('eye-icon-show');
      const eyeHide = document.getElementById('eye-icon-hide');
      const fillBtn = document.getElementById('fill-demo-btn');
      const usernameInput = document.getElementById('username');
      const loginForm = document.getElementById('admin-login-form');
      const submitBtn = document.getElementById('login-submit-btn');

      document.addEventListener('click', function (e) {
        const target = e.target && e.target.closest ? e.target.closest('button, a.btn-press') : null;
        if (!target || target.disabled) return;
        const rect = target.getBoundingClientRect();
        const wave = document.createElement('span');
        wave.className = 'btn-ripple-wave ' + (target.classList.contains('bg-[#007A33]') ? '' : 'dark');
        wave.style.left = ((e.clientX ? e.clientX - rect.left : rect.width / 2)) + 'px';
        wave.style.top = ((e.clientY ? e.clientY - rect.top : rect.height / 2)) + 'px';
        target.appendChild(wave);
        setTimeout(function () { wave.remove(); }, 550);
      });

      if (toggleBtn && passwordInput) {
        toggleBtn.addEventListener('click', function () {
          const isHidden = passwordInput.type === 'password';
          passwordInput.type = isHidden ? 'text' : 'password';
          toggleBtn.setAttribute('aria-pressed', String(isHidden));
          toggleBtn.setAttribute('aria-label', isHidden ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi');
          if (eyeShow) eyeShow.classList.toggle('hidden', isHidden);
          if (eyeHide) eyeHide.classList.toggle('hidden', !isHidden);
        });
      }

      if (fillBtn && usernameInput && passwordInput) {
        fillBtn.addEventListener('click', function () {
          usernameInput.value = ${safeJson(defaultAdminUser)};
          passwordInput.value = 'BukitRandu2026!';
          usernameInput.classList.add('ring-2', 'ring-[#007A33]/35', 'bg-emerald-50/40');
          passwordInput.classList.add('ring-2', 'ring-[#007A33]/35', 'bg-emerald-50/40');
          const origText = fillBtn.textContent;
          fillBtn.textContent = '✓ Terisi';
          fillBtn.classList.add('bg-emerald-600', 'text-white', 'border-emerald-600');
          setTimeout(function () {
            usernameInput.classList.remove('ring-2', 'ring-[#007A33]/35', 'bg-emerald-50/40');
            passwordInput.classList.remove('ring-2', 'ring-[#007A33]/35', 'bg-emerald-50/40');
            fillBtn.textContent = origText;
            fillBtn.classList.remove('bg-emerald-600', 'text-white', 'border-emerald-600');
          }, 1200);
          passwordInput.focus();
        });
      }

      if (loginForm && submitBtn) {
        loginForm.addEventListener('submit', function () {
          submitBtn.disabled = true;
          submitBtn.innerHTML = '<svg class="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10" stroke-opacity="0.25"/><path d="M22 12a10 10 0 0 1-10 10"/></svg><span>Memverifikasi Sesi...</span>';
        });
      }
    })();
  </script>
</body>
</html>`;
}
