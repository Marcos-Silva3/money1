(function () {
  'use strict';

  const WHATSAPP_NUMBER = '+559191188724';
  const WHATSAPP_BASE = `https://wa.me/${+559191188724}`;

  const ADMIN_PASSWORD = 'money2026';
  const EVENTS_STORAGE_KEY = 'money_eventos';
  const ADMIN_SESSION_KEY = 'money_admin_session';

  const MONTHS_PT = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];

  const WEEKDAYS_PT = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

  function dateToKey(year, month, day) {
    const m = String(month + 1).padStart(2, '0');
    const d = String(day).padStart(2, '0');
    return `${year}-${m}-${d}`;
  }

  function parseKey(key) {
    const [y, m, d] = key.split('-').map(Number);
    return new Date(y, m - 1, d);
  }

  function formatDateLong(date) {
    return date.toLocaleDateString('pt-BR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  }

  function formatDateShort(key) {
    return parseKey(key).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'short'
    });
  }

  // --- Mobile navigation ---
  const navToggle = document.getElementById('navToggle');
  const nav = document.getElementById('nav');

  if (navToggle && nav) {
    navToggle.addEventListener('click', () => {
      const isOpen = nav.classList.toggle('is-open');
      navToggle.classList.toggle('is-active', isOpen);
      navToggle.setAttribute('aria-expanded', String(isOpen));
      document.body.style.overflow = isOpen ? 'hidden' : '';
    });

    nav.querySelectorAll('.nav__link').forEach((link) => {
      link.addEventListener('click', () => {
        nav.classList.remove('is-open');
        navToggle.classList.remove('is-active');
        navToggle.setAttribute('aria-expanded', 'false');
        document.body.style.overflow = '';
      });
    });
  }

  // --- Active nav link on scroll ---
  const sections = document.querySelectorAll('section[id], footer[id]');
  const navLinks = document.querySelectorAll('.nav__link');

  function setActiveNav() {
    const scrollY = window.scrollY + 100;

    sections.forEach((section) => {
      const id = section.getAttribute('id');
      const top = section.offsetTop;
      const height = section.offsetHeight;

      if (scrollY >= top && scrollY < top + height) {
        navLinks.forEach((link) => {
          link.classList.remove('nav__link--active');
          if (link.getAttribute('href') === `#${id}`) {
            link.classList.add('nav__link--active');
          }
        });
      }
    });
  }

  window.addEventListener('scroll', setActiveNav, { passive: true });
  setActiveNav();

  // --- Visit calendar (agendamento) ---
  const calendarEl = document.getElementById('calendar');
  let visitCurrentDate = new Date();
  let selectedVisitDay = null;

  function renderVisitCalendar(date) {
    if (!calendarEl) return;

    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const monthLabel = `${MONTHS_PT[month]} ${year}`;

    let daysHtml = '';
    for (let i = 0; i < firstDay; i++) {
      daysHtml += '<span class="calendar__day calendar__day--empty"></span>';
    }

    for (let d = 1; d <= daysInMonth; d++) {
      const cellDate = new Date(year, month, d);
      cellDate.setHours(0, 0, 0, 0);

      const isPast = cellDate < today;
      const isToday = cellDate.getTime() === today.getTime();
      const isSelected =
        selectedVisitDay &&
        selectedVisitDay.getFullYear() === year &&
        selectedVisitDay.getMonth() === month &&
        selectedVisitDay.getDate() === d;

      let classes = 'calendar__day';
      if (isPast) classes += ' calendar__day--disabled';
      if (isToday) classes += ' calendar__day--today';
      if (isSelected) classes += ' calendar__day--selected';

      const dataAttr = isPast ? '' : ` data-day="${d}"`;
      daysHtml += `<button type="button" class="${classes}"${dataAttr} ${isPast ? 'disabled' : ''}>${d}</button>`;
    }

    calendarEl.innerHTML = `
      <div class="calendar__header">
        <h3>${monthLabel}</h3>
        <div class="calendar__nav">
          <button type="button" data-cal-nav="visit-prev" aria-label="Mês anterior">&lsaquo;</button>
          <button type="button" data-cal-nav="visit-next" aria-label="Próximo mês">&rsaquo;</button>
        </div>
      </div>
      <div class="calendar__weekdays">
        ${WEEKDAYS_PT.map((d) => `<span>${d}</span>`).join('')}
      </div>
      <div class="calendar__days">${daysHtml}</div>
    `;

    calendarEl.querySelector('[data-cal-nav="visit-prev"]')?.addEventListener('click', () => {
      visitCurrentDate.setMonth(visitCurrentDate.getMonth() - 1);
      renderVisitCalendar(visitCurrentDate);
    });

    calendarEl.querySelector('[data-cal-nav="visit-next"]')?.addEventListener('click', () => {
      visitCurrentDate.setMonth(visitCurrentDate.getMonth() + 1);
      renderVisitCalendar(visitCurrentDate);
    });

    calendarEl.querySelectorAll('.calendar__day[data-day]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const day = parseInt(btn.dataset.day, 10);
        selectedVisitDay = new Date(visitCurrentDate.getFullYear(), visitCurrentDate.getMonth(), day);
        renderVisitCalendar(visitCurrentDate);
      });
    });
  }

  renderVisitCalendar(visitCurrentDate);

  // --- Events store & calendar ---
  function loadEvents() {
    try {
      const raw = localStorage.getItem(EVENTS_STORAGE_KEY);
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  }

  function saveEvents(events) {
    localStorage.setItem(EVENTS_STORAGE_KEY, JSON.stringify(events));
  }

  let eventsData = loadEvents();
  const calendarEventsEl = document.getElementById('calendarEvents');
  const eventsListEl = document.getElementById('eventsList');
  let eventsCurrentDate = new Date();
  let adminSelectedKey = null;
  let isAdminLoggedIn = sessionStorage.getItem(ADMIN_SESSION_KEY) === 'true';

  const adminLoginForm = document.getElementById('adminLoginForm');
  const adminPassword = document.getElementById('adminPassword');
  const adminLoginError = document.getElementById('adminLoginError');
  const adminTools = document.getElementById('adminTools');
  const adminSelectedDate = document.getElementById('adminSelectedDate');
  const adminEventName = document.getElementById('adminEventName');
  const btnSaveEvent = document.getElementById('btnSaveEvent');
  const btnRemoveEvent = document.getElementById('btnRemoveEvent');
  const btnAdminLogout = document.getElementById('btnAdminLogout');

  function updateAdminUI() {
    if (adminLoginForm) adminLoginForm.classList.toggle('is-hidden', isAdminLoggedIn);
    if (adminTools) adminTools.hidden = !isAdminLoggedIn;
    if (!isAdminLoggedIn) {
      adminSelectedKey = null;
      if (adminEventName) adminEventName.value = '';
      if (adminSelectedDate) adminSelectedDate.textContent = 'Nenhuma data selecionada';
    }
    renderEventsCalendar(eventsCurrentDate);
  }

  function renderEventsList(year, month) {
    if (!eventsListEl) return;

    const prefix = `${year}-${String(month + 1).padStart(2, '0')}`;
    const monthEvents = Object.entries(eventsData)
      .filter(([key]) => key.startsWith(prefix))
      .sort(([a], [b]) => a.localeCompare(b));

    if (monthEvents.length === 0) {
      eventsListEl.innerHTML = '<li class="events-list__empty">Nenhum evento neste mês.</li>';
      return;
    }

    eventsListEl.innerHTML = monthEvents
      .map(
        ([key, name]) => `
        <li class="events-list__item">
          <span class="events-list__date">${formatDateShort(key)}</span>
          <span class="events-list__name">${escapeHtml(name)}</span>
        </li>`
      )
      .join('');
  }

  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  function renderEventsCalendar(date) {
    if (!calendarEventsEl) return;

    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const monthLabel = `${MONTHS_PT[month]} ${year}`;
    const adminClass = isAdminLoggedIn ? ' calendar__day--admin-mode' : '';

    let daysHtml = '';
    for (let i = 0; i < firstDay; i++) {
      daysHtml += '<span class="calendar__day calendar__day--empty"></span>';
    }

    for (let d = 1; d <= daysInMonth; d++) {
      const key = dateToKey(year, month, d);
      const eventName = eventsData[key];
      const hasEvent = Boolean(eventName);
      const isAdminPick = isAdminLoggedIn && adminSelectedKey === key;

      let classes = `calendar__day${adminClass}`;
      if (hasEvent) classes += ' calendar__day--has-event';
      if (isAdminPick) classes += ' calendar__day--admin-pick';

      const cellDate = new Date(year, month, d);
      if (cellDate.getTime() === today.getTime()) {
        classes += ' calendar__day--today';
      }

      const eventHtml = hasEvent
        ? `<span class="calendar__day-event" title="${escapeHtml(eventName)}">${escapeHtml(eventName)}</span>`
        : '';

      const tag = isAdminLoggedIn ? 'button' : 'div';
      const typeAttr = isAdminLoggedIn ? ' type="button"' : '';
      const dataAttr = ` data-day="${d}" data-key="${key}"`;

      daysHtml += `<${tag}${typeAttr} class="${classes}"${dataAttr}>
        <span class="calendar__day-num">${d}</span>
        ${eventHtml}
      </${tag}>`;
    }

    calendarEventsEl.innerHTML = `
      <div class="calendar__header">
        <h3>${monthLabel}</h3>
        <div class="calendar__nav">
          <button type="button" data-cal-nav="events-prev" aria-label="Mês anterior">&lsaquo;</button>
          <button type="button" data-cal-nav="events-next" aria-label="Próximo mês">&rsaquo;</button>
        </div>
      </div>
      <div class="calendar__weekdays">
        ${WEEKDAYS_PT.map((d) => `<span>${d}</span>`).join('')}
      </div>
      <div class="calendar__days">${daysHtml}</div>
    `;

    calendarEventsEl.querySelector('[data-cal-nav="events-prev"]')?.addEventListener('click', () => {
      eventsCurrentDate.setMonth(eventsCurrentDate.getMonth() - 1);
      renderEventsCalendar(eventsCurrentDate);
    });

    calendarEventsEl.querySelector('[data-cal-nav="events-next"]')?.addEventListener('click', () => {
      eventsCurrentDate.setMonth(eventsCurrentDate.getMonth() + 1);
      renderEventsCalendar(eventsCurrentDate);
    });

    if (isAdminLoggedIn) {
      calendarEventsEl.querySelectorAll('.calendar__day[data-key]').forEach((btn) => {
        btn.addEventListener('click', () => {
          adminSelectedKey = btn.dataset.key;
          const name = eventsData[adminSelectedKey] || '';
          if (adminEventName) adminEventName.value = name;
          if (adminSelectedDate) {
            adminSelectedDate.textContent = formatDateLong(parseKey(adminSelectedKey));
          }
          renderEventsCalendar(eventsCurrentDate);
        });
      });
    }

    renderEventsList(year, month);
  }

  adminLoginForm?.addEventListener('submit', (e) => {
    e.preventDefault();
    const pwd = adminPassword?.value.trim();

    if (pwd === ADMIN_PASSWORD) {
      isAdminLoggedIn = true;
      sessionStorage.setItem(ADMIN_SESSION_KEY, 'true');
      if (adminLoginError) adminLoginError.hidden = true;
      if (adminPassword) adminPassword.value = '';
      updateAdminUI();
    } else {
      if (adminLoginError) {
        adminLoginError.textContent = 'Senha incorreta. Tente novamente.';
        adminLoginError.hidden = false;
      }
    }
  });

  btnSaveEvent?.addEventListener('click', () => {
    if (!isAdminLoggedIn) return;
    if (!adminSelectedKey) {
      alert('Selecione uma data no calendário de eventos.');
      return;
    }

    const name = adminEventName?.value.trim();
    if (!name) {
      alert('Informe o nome do evento.');
      adminEventName?.focus();
      return;
    }

    eventsData[adminSelectedKey] = name;
    saveEvents(eventsData);
    renderEventsCalendar(eventsCurrentDate);
  });

  btnRemoveEvent?.addEventListener('click', () => {
    if (!isAdminLoggedIn || !adminSelectedKey) {
      alert('Selecione uma data com evento para remover.');
      return;
    }

    if (!eventsData[adminSelectedKey]) {
      alert('Não há evento nesta data.');
      return;
    }

    if (!confirm('Remover o evento desta data?')) return;

    delete eventsData[adminSelectedKey];
    saveEvents(eventsData);
    if (adminEventName) adminEventName.value = '';
    adminSelectedKey = null;
    if (adminSelectedDate) adminSelectedDate.textContent = 'Nenhuma data selecionada';
    renderEventsCalendar(eventsCurrentDate);
  });

  btnAdminLogout?.addEventListener('click', () => {
    isAdminLoggedIn = false;
    sessionStorage.removeItem(ADMIN_SESSION_KEY);
    updateAdminUI();
  });

  updateAdminUI();

  // --- Upload de PDF (agendamento) ---
  const PDF_MAX_BYTES = 10 * 1024 * 1024;
  const pdfInput = document.getElementById('pdfAgendamento');
  const pdfUpload = document.querySelector('.pdf-upload');
  const pdfPreview = document.getElementById('pdfPreview');
  const pdfFileName = document.getElementById('pdfFileName');
  const pdfFileSize = document.getElementById('pdfFileSize');
  const pdfRemove = document.getElementById('pdfRemove');
  const pdfError = document.getElementById('pdfError');
  let selectedPdfFile = null;

  function formatFileSize(bytes) {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  function showPdfError(msg) {
    if (!pdfError) return;
    pdfError.textContent = msg;
    pdfError.hidden = !msg;
  }

  function setPdfFile(file) {
    if (!file) return;

    const isPdf =
      file.type === 'application/pdf' ||
      file.name.toLowerCase().endsWith('.pdf');

    if (!isPdf) {
      showPdfError('Envie apenas arquivos no formato PDF.');
      return;
    }

    if (file.size > PDF_MAX_BYTES) {
      showPdfError('O arquivo deve ter no máximo 10 MB.');
      return;
    }

    selectedPdfFile = file;
    showPdfError('');

    if (pdfFileName) pdfFileName.textContent = file.name;
    if (pdfFileSize) pdfFileSize.textContent = formatFileSize(file.size);
    if (pdfPreview) pdfPreview.hidden = false;
    if (pdfUpload) pdfUpload.classList.add('has-file');
    if (pdfInput) pdfInput.value = '';
  }

  function clearPdfFile() {
    selectedPdfFile = null;
    showPdfError('');
    if (pdfPreview) pdfPreview.hidden = true;
    if (pdfUpload) pdfUpload.classList.remove('has-file');
    if (pdfInput) pdfInput.value = '';
  }

  pdfInput?.addEventListener('change', () => {
    const file = pdfInput.files?.[0];
    if (file) setPdfFile(file);
  });

  pdfRemove?.addEventListener('click', clearPdfFile);

  if (pdfUpload) {
    ['dragenter', 'dragover'].forEach((evt) => {
      pdfUpload.addEventListener(evt, (e) => {
        e.preventDefault();
        pdfUpload.classList.add('is-dragover');
      });
    });

    ['dragleave', 'drop'].forEach((evt) => {
      pdfUpload.addEventListener(evt, (e) => {
        e.preventDefault();
        pdfUpload.classList.remove('is-dragover');
      });
    });

    pdfUpload.addEventListener('drop', (e) => {
      const file = e.dataTransfer?.files?.[0];
      if (file) setPdfFile(file);
    });
  }

  function downloadPdfForAttach(file) {
    const url = URL.createObjectURL(file);
    const link = document.createElement('a');
    link.href = url;
    link.download = file.name;
    link.click();
    URL.revokeObjectURL(url);
  }

  // --- Agendar agora ---
  const btnAgendar = document.getElementById('btnAgendar');

  btnAgendar?.addEventListener('click', () => {
    if (!selectedVisitDay) {
      alert('Por favor, selecione uma data no calendário.');
      return;
    }

    const formatted = formatDateLong(selectedVisitDay);

    let text = `Olá! Gostaria de agendar uma visita para o dia ${formatted}.`;

    if (selectedPdfFile) {
      text += `\n\nDocumento anexado: ${selectedPdfFile.name} (${formatFileSize(selectedPdfFile.size)}).`;
      downloadPdfForAttach(selectedPdfFile);
      text += '\n\n(O PDF foi baixado no seu dispositivo — anexe-o na conversa do WhatsApp antes de enviar.)';
    }

    const message = encodeURIComponent(text);
    window.open(`${WHATSAPP_BASE}?text=${message}`, '_blank', 'noopener');
  });

  // --- Header shadow on scroll ---
  const header = document.getElementById('header');

  window.addEventListener(
    'scroll',
    () => {
      if (!header) return;
      header.style.boxShadow =
        window.scrollY > 20
          ? '0 4px 24px rgba(0, 0, 0, 0.25)'
          : '0 2px 20px rgba(0, 0, 0, 0.2)';
    },
    { passive: true }
  );
})();
