// ==UserScript==
// @name         Ext Unlock Button 
// @namespace    https://example.local
// @version      1.1
// @description  Кнопки-иконки, которые разворачиваются при наведении; разблокируют Ext-компоненты и перезапускают приложение
// @match        http://localhost/*
// @noframes
// @run-at       document-idle
// @grant        GM_addStyle
// @grant        unsafeWindow
// ==/UserScript==

(function () {
  'use strict';

  // --- Стили: компактные квадратные FAB, раскрытие текста по hover/focus
  const css = `
  .gm-fab {
    position: fixed;
    right: 16px;
    z-index: 2147483647;
    display: inline-flex;
    align-items: center;
    gap: 8px;
    height: 44px;
    padding: 0 10px;              /* остаётся узкой, пока label скрыт */
    border-radius: 12px;
    border: 1px solid rgba(0,0,0,.12);
    background: #111;
    color: #fff;
    cursor: pointer;
    font: 13px/1.2 system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif;
    box-shadow: 0 6px 18px rgba(0,0,0,.25);
    opacity: .92;
    outline: none;
    -webkit-tap-highlight-color: transparent;
    overflow: hidden;             /* чтобы текст «заезжал» внутрь при раскрытии */
    user-select: none;
  }
  .gm-fab:hover { opacity: 1; }
  .gm-fab:focus-visible {
    box-shadow: 0 0 0 3px rgba(99,102,241,.35), 0 6px 18px rgba(0,0,0,.25);
  }

  /* Иконка фиксированной ширины для квадратного вида */
  .gm-fab .gm-icon {
    width: 24px;
    height: 24px;
    display: inline-grid;
    place-items: center;
    font-size: 18px;
    line-height: 1;
  }

  /* Текст — скрыт по умолчанию, плавно раскрывается до 240px */
  .gm-fab .gm-label {
    max-width: 0;
    opacity: 0;
    white-space: nowrap;
    transform: translateX(4px);
    transition: max-width .25s ease, opacity .18s ease, transform .25s ease;
  }
  .gm-fab:hover .gm-label,
  .gm-fab:focus-visible .gm-label {
    max-width: 240px;
    opacity: 1;
    transform: translateX(0);
  }

  /* Размеры/отступы для квадратного состояния */
  .gm-fab { min-width: 44px; }
  .gm-fab .gm-label { pointer-events: none; }

  /* Позиции кнопок (вторая — над первой) */
  .gm-fab#gmeu-unlock { bottom: 16px; }
  .gm-fab#gmeu-restart { bottom: calc(16px + 52px); } /* 44px высота + 8px зазор */

  /* Вариант для reduced motion */
  @media (prefers-reduced-motion: reduce) {
    .gm-fab .gm-label { transition: none; }
  }
  `;

  if (window.top !== window) return;

  if (typeof GM_addStyle === 'function') {
    GM_addStyle(css);
  } else {
    const style = document.createElement('style');
    style.textContent = css;
    document.head.appendChild(style);
  }

  // --- Фабрика кнопки с иконкой и лейблом
  function makeFab({
    id,
    title,
    icon,
    label
  }) {
    const btn = document.createElement('button');
    btn.className = 'gm-fab';
    btn.id = id;
    btn.type = 'button';
    btn.title = title;
    btn.setAttribute('aria-label', title);

    const iconSpan = document.createElement('span');
    iconSpan.className = 'gm-icon';
    iconSpan.textContent = icon;

    const labelSpan = document.createElement('span');
    labelSpan.className = 'gm-label';
    labelSpan.textContent = label;

    btn.appendChild(iconSpan);
    btn.appendChild(labelSpan);
    document.documentElement.appendChild(btn);
    return btn;
  }

  // --- Кнопки
  const btnUnlock = makeFab({
    id: 'gmeu-unlock',
    title: 'Разблокировать поля и кнопки (ExtJS)',
    icon: '🔓',
    label: 'Разблокировать поля'
  });

  const btnRestart = makeFab({
    id: 'gmeu-restart',
    title: 'Перезапуск приложения',
    icon: '🔄️',
    label: 'Перезапуск приложения'
  });

  // --- Запуск кода в контексте страницы
  function runInPageContext(fn) {
    const script = document.createElement('script');
    script.textContent = `(${fn})();`;
    (document.head || document.documentElement).appendChild(script);
    script.remove();
  }

  function unlockExtComponents() {
    try {
      if (window.Ext && Ext.ComponentMgr && Ext.ComponentMgr.all) {

        Ext.ComponentMgr.all.each(function (c) {
          var cmp = Ext.ComponentMgr.all.map[c];
          if (!cmp) return;
          if (cmp.className && (cmp.className.indexOf("Edit") !== -1 || cmp.className.indexOf("Button") !== -1)) {
            if (typeof cmp.setEnabled === 'function') {
              try {
                cmp.setEnabled(true);
              } catch (_) {}
            }
          }
        });
        try {
          console.info('[Ext Unlock] Готово: попробовали включить Edit/Button.');
        } catch (_) {}
      } else {
        try {
          console.warn('[Ext Unlock] ExtJS не найден на странице.');
        } catch (_) {}
        try {
          alert('ExtJS не найден на странице.');
        } catch (_) {}
      }
    } catch (e) {
      try {
        console.error('[Ext Unlock] Ошибка:', e);
      } catch (_) {}
      try {
        alert('Ошибка: ' + (e && e.message ? e.message : e));
      } catch (_) {}
    }
  }

  // --- Перезапуск BPMSoft
  function restartApplication() {
    var bpmsoftUrl = window.location.origin;
    var requestConfig = {
      url: bpmsoftUrl + "/ServiceModel/AppInstallerService.svc/RestartApp",
      headers: {
        "Accept": "application/json",
        "Content-Type": "application/json"
      },
      method: "POST",
      jsonData: Ext.encode({}),
      instanceId: "",
      callback: function (request, success, response) {
        console.log('[RestartApp] success:', success, response);
      },
      scope: this
    };
    BPMSoft.AjaxProvider.request(requestConfig);
  }

  // --- Обработчики
  btnUnlock.addEventListener('click', function () {
    runInPageContext(unlockExtComponents);
  });
  btnRestart.addEventListener('click', function () {
    runInPageContext(restartApplication);
  });

  // --- Хоткей Alt+U
  window.addEventListener('keydown', (e) => {
    if (e.altKey && (e.key === 'u' || e.key === 'U')) {
      runInPageContext(unlockExtComponents);
    }
  });
})();
