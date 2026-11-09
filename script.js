document.addEventListener('DOMContentLoaded', () => {
  // Update year
  const yearEl = document.getElementById('year');
  if (yearEl) {
    yearEl.textContent = new Date().getFullYear();
  }

  // Toast Notification
  const toast = document.getElementById('toast');
  let toastTimeout;

  function showToast(message) {
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add('show');
    clearTimeout(toastTimeout);
    toastTimeout = setTimeout(() => {
      toast.classList.remove('show');
    }, 2800);
  }

  // Email Copy Action
  const emailBtn = document.getElementById('btn-copy-email');
  const emailAddress = 'vadimbodarev@gmail.com';

  if (emailBtn) {
    emailBtn.addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(emailAddress);
        showToast('Email скопирован: ' + emailAddress);
      } catch (err) {
        // Fallback
        const textarea = document.createElement('textarea');
        textarea.value = emailAddress;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
        showToast('Email скопирован в буфер обмена');
      }
    });
  }

  // Theme Switcher (Dark / Light)
  const themeToggle = document.getElementById('theme-toggle');
  const themeIcon = document.getElementById('theme-icon');

  const sunIconSvg = `
    <circle cx="12" cy="12" r="5"></circle>
    <line x1="12" y1="1" x2="12" y2="3"></line>
    <line x1="12" y1="21" x2="12" y2="23"></line>
    <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
    <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
    <line x1="1" y1="12" x2="3" y2="12"></line>
    <line x1="21" y1="12" x2="23" y2="12"></line>
    <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
    <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
  `;

  const moonIconSvg = `
    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
  `;

  let currentTheme = localStorage.getItem('theme') || 'dark';

  function applyTheme(theme) {
    if (theme === 'light') {
      document.body.setAttribute('data-theme', 'light');
      if (themeIcon) themeIcon.innerHTML = moonIconSvg;
    } else {
      document.body.removeAttribute('data-theme');
      if (themeIcon) themeIcon.innerHTML = sunIconSvg;
    }
    localStorage.setItem('theme', theme);
  }

  applyTheme(currentTheme);

  if (themeToggle) {
    themeToggle.addEventListener('click', () => {
      currentTheme = currentTheme === 'dark' ? 'light' : 'dark';
      applyTheme(currentTheme);
    });
  }

  // vCard Generator & Downloader
  const vcardBtn = document.getElementById('btn-vcard');
  if (vcardBtn) {
    vcardBtn.addEventListener('click', () => {
      const vCardContent = [
        'BEGIN:VCARD',
        'VERSION:3.0',
        'FN:Вадим Бодарев',
        'N:Бодарев;Вадим;;;',
        'TITLE:Software Engineer',
        'EMAIL;TYPE=INTERNET,HOME:vadimbodarev@gmail.com',
        'URL:https://github.com/vadimbodarev',
        'NOTE:Разработчик программного обеспечения и цифровых сервисов',
        'END:VCARD'
      ].join('\r\n');

      const blob = new Blob([vCardContent], { type: 'text/vcard;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'Vadim_Bodarev.vcf');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      showToast('Контакт (.vcf) скачан');
    });
  }
});
