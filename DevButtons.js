// ==UserScript==
// @name         Ext Unlock Button 
// @namespace    https://example.local
// @version      1.0
// @description  Добавляет кнопку, которая разблокирует Ext-компоненты (Edit/Button) вызовом setEnabled(true)
// @match        http://localhost/*
// @noframes
// @run-at       document-idle
// @grant        GM_addStyle
// @grant        unsafeWindow
// ==/UserScript==

(function () {
  'use strict';

  // --- Стили кнопки
  const css = `
  .gm-ext-unlock-btn {
    position: fixed;
    right: 16px;
    bottom: 16px;
    z-index: 2147483647;
    padding: 10px 14px;
    line-height: 1.2;
    border-radius: 10px;
    border: 1px solid rgba(0,0,0,.12);
    background: #111;
    color: #fff;
    cursor: pointer;
    font: 13px/1.2 system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif;
    box-shadow: 0 6px 18px rgba(0,0,0,.25);
    opacity: 0.9;
  }
  .gm-ext-unlock-btn:hover { opacity: 1; }
  
  #restart-button {
  	min-width: 17em;
  	min-height: 2em;
  	bottom: 4.5em;
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

  // --- Кнопка
  const btn = document.createElement('button');
  btn.className = 'gm-ext-unlock-btn';
  btn.title = 'Разблокировать поля и кнопки (ExtJS)';
  btn.textContent = '🔓 Разблокировать поля';
  document.documentElement.appendChild(btn);
  
  // --- Кнопка
  const restartAppButton = document.createElement('button');
  restartAppButton.className = 'gm-ext-unlock-btn';
  restartAppButton.id = 'restart-button';
  restartAppButton.title = '⟳ Перезапуск приложения';
  restartAppButton.textContent = '⟳ Перезапуск приложения';
  document.documentElement.appendChild(restartAppButton);

  // --- Вспомогательная функция: запуск кода в контексте страницы
  function runInPageContext(fn) {
    const script = document.createElement('script');
    // Вставляем самовызывающуюся функцию как текст — так код выполнится в page context, а не в sandbox
    script.textContent = `(${fn})();`;
    (document.head || document.documentElement).appendChild(script);
    script.remove();
  }

  // --- Ваш исходный код (с проверками и уведомлением)
  function unlockExtComponents() {
    try {
      if (window.Ext && Ext.ComponentMgr && Ext.ComponentMgr.all) {
        // Оригинальная логика + проверки на null/undefined
        Ext.ComponentMgr.all.each(function (c) {
          var cmp = Ext.ComponentMgr.all.map[c];
          if (!cmp) return;
          if (cmp.className && (cmp.className.indexOf("Edit") !== -1 || cmp.className.indexOf("Button") !== -1)) {
            if (typeof cmp.setEnabled === 'function') {
              try { cmp.setEnabled(true); } catch (_) {}
            }
          }
        });
        try { console.info('[Ext Unlock] Готово: попробовали включить Edit/Button.'); } catch (_) {}
        //try { alert('Готово: поля и кнопки разблокированы (если страница на ExtJS).'); } catch (_) {}
      } else {
        try { console.warn('[Ext Unlock] ExtJS не найден на странице.'); } catch (_) {}
        try { alert('ExtJS не найден на странице.'); } catch (_) {}
      }
    } catch (e) {
      try { console.error('[Ext Unlock] Ошибка:', e); } catch (_) {}
      try { alert('Ошибка: ' + (e && e.message ? e.message : e)); } catch (_) {}
    }
  }
  
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
      callback: function(request, success, response) {
        console.log(response)
      },
      scope: this
    };

    BPMSoft.AjaxProvider.request(requestConfig);
    
  }
  

  // --- Обработчик клика: запускаем в контексте страницы
  btn.addEventListener('click', function () {
    runInPageContext(unlockExtComponents);
  });
  
  restartAppButton.addEventListener('click', function () {
    runInPageContext(restartApplication);
  });

  // --- Дополнительно: хоткей Alt+U
  window.addEventListener('keydown', (e) => {
    if (e.altKey && (e.key === 'u' || e.key === 'U')) {
      runInPageContext(unlockExtComponents);
    }
  });

})();

