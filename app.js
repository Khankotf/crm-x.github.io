const storageKey = "pulse-crm-state-v3";
const customReportsKey = "pulse-crm-custom-reports";
const authUserKey = "pulse-crm-auth-user";

const dealStatuses = [
  { id: "new", label: "Новые", className: "new" },
  { id: "contact", label: "Контакт", className: "contact" },
  { id: "offer", label: "Предложение", className: "offer" },
  { id: "won", label: "Успешно", className: "won" },
  { id: "lost", label: "Отказ", className: "lost" },
];

const leadStatuses = [
  { id: "new", label: "Новый" },
  { id: "qualified", label: "Квалифицирован" },
  { id: "disqualified", label: "Дисквалифицирован" },
];

const taskStatuses = [
  { id: "todo", label: "Нужно сделать", className: "new" },
  { id: "in_progress", label: "В работе", className: "contact" },
  { id: "waiting", label: "Ждет клиента", className: "offer" },
  { id: "done", label: "Готово", className: "won" },
  { id: "overdue", label: "Просрочено", className: "lost" },
];

const leadDisqualificationReasons = [
  "Дорого",
  "Не подошел функционал",
  "Ошибочный интерес",
];

const tableDefs = {
  deals: { label: "Сделки", recordType: "deal" },
  leads: { label: "Лиды", recordType: "lead" },
  tasks: { label: "Задачи", recordType: "task" },
  contacts: { label: "Контакты", recordType: "contact" },
  companies: { label: "Компании", recordType: "company" },
};

const userRoles = [
  { id: "manager", label: "Менеджер", description: "Работает со своими лидами, сделками и задачами" },
  { id: "leader", label: "Руководитель менеджеров", description: "Ставит планы и смотрит команду менеджеров" },
  { id: "vip", label: "VIP пользователь", description: "Управляет руководителями и всеми командами" },
];

const reportTypes = [
  { id: "salesFunnel", label: "Воронка продаж", description: "Конверсия от визита до оплаты" },
  { id: "revenuePlan", label: "Выручка: план-факт", description: "Цели против оплаченных сумм" },
  { id: "productSales", label: "Продажи по продуктам", description: "Товары, категории, прибыльность" },
  { id: "romi", label: "ROMI каналов", description: "Выручка рекламы с учетом затрат" },
  { id: "utmSources", label: "UTM-источники", description: "Активность по меткам трафика" },
  { id: "promos", label: "Промокоды и акции", description: "Эффективность скидок" },
  { id: "segments", label: "Сегментация клиентов", description: "Пол, возраст, интересы, гео" },
  { id: "churn", label: "Отток клиентов", description: "Спящие и рисковые клиенты" },
  { id: "rfm", label: "RFM-анализ", description: "Давность, частота, деньги" },
  { id: "loyalty", label: "Программа лояльности", description: "Бонусы, кешбэк, спецпредложения" },
  { id: "managers", label: "Эффективность менеджеров", description: "Заявки, скорость, продажи" },
  { id: "serviceQuality", label: "NPS и CSAT", description: "Качество обслуживания" },
  { id: "tickets", label: "Обращения", description: "Темы тикетов и проблем" },
];

const money = new Intl.NumberFormat("ru-RU", {
  style: "currency",
  currency: "RUB",
  maximumFractionDigits: 0,
});

let activeUserId = loadActiveUserId();
let state = normalizeState(loadState());
let authenticatedUserId = normalizeAuthenticatedUserId(loadAuthenticatedUserId());
let activeScreen = normalizeScreen(location.hash.slice(1) || "dashboard");
let activePeriod = "week";
let activeReport = "salesFunnel";
let activeKanban = "deals";
let customReports = loadCustomReports();
let builderDraft = defaultReportDraft();
let dashboardReportIds = loadDashboardReports();
let dashboardReportLayouts = loadDashboardReportLayouts();
let dashboardWidgetOrder = loadDashboardWidgetOrder();
let dashboardWidgetLayouts = loadDashboardWidgetLayouts();
let selectedRecord = { type: "deal", id: visibleRows("deals")[0]?.id || "" };
let draggedDealId = "";
let draggedDashboardReportId = "";
let draggedDashboardWidgetId = "";
let tableFilters = {
  deals: emptyFilters(),
  leads: emptyFilters(),
  tasks: emptyFilters(),
  contacts: emptyFilters(),
  companies: emptyFilters(),
};
let tableDrillLocks = {
  deals: [],
  leads: [],
  tasks: [],
  contacts: [],
  companies: [],
};
let tableSorts = {
  deals: { field: "", direction: "" },
  leads: { field: "", direction: "" },
  tasks: { field: "", direction: "" },
  contacts: { field: "", direction: "" },
  companies: { field: "", direction: "" },
};
let tableGroups = {
  deals: { field: "", collapsed: {}, sort: "name-asc" },
  leads: { field: "", collapsed: {}, sort: "name-asc" },
  tasks: { field: "", collapsed: {}, sort: "name-asc" },
  contacts: { field: "", collapsed: {}, sort: "name-asc" },
  companies: { field: "", collapsed: {}, sort: "name-asc" },
};
let selectedRows = {
  deals: [],
  leads: [],
  tasks: [],
  contacts: [],
  companies: [],
};
let cellContextMenu = null;
let conditionBuilders = loadConditionBuilders();
let listSettings = loadListSettings();

document.addEventListener("DOMContentLoaded", () => {
  bindAuth();
  bindNavigation();
  bindDashboard();
  bindForms();
  bindBoard();
  bindTables();
  bindReports();
  render();
});

window.addEventListener("hashchange", () => {
  activeScreen = normalizeScreen(location.hash.slice(1) || "dashboard");
  renderShell();
});

function demoState() {
  const now = new Date();
  const iso = now.toISOString();
  const daysAgo = (days) => new Date(now.getTime() - days * 86400000).toISOString();

  return {
    companies: [
      {
        id: "company-smirnov",
        name: "Семья Смирновых",
        segment: "B2C",
        industry: "Частный клиент",
        city: "Санкт-Петербург",
        phone: "+7 921 555-01-44",
        email: "family-smirnov@example.com",
        createdAt: daysAgo(12),
      },
      {
        id: "company-kotova",
        name: "Студия Марии Котовой",
        segment: "Микробизнес",
        industry: "Дизайн",
        city: "Москва",
        phone: "+7 911 300-22-10",
        email: "hello@kotova.example",
        createdAt: daysAgo(32),
      },
      {
        id: "company-orlov",
        name: "Денис Орлов",
        segment: "B2C",
        industry: "Частный клиент",
        city: "Сестрорецк",
        phone: "+7 906 440-18-70",
        email: "denis@example.com",
        createdAt: daysAgo(4),
      },
    ],
    contacts: [
      {
        id: "contact-anna",
        companyId: "company-smirnov",
        name: "Анна Смирнова",
        role: "Покупатель",
        phone: "+7 921 555-01-44",
        email: "anna@example.com",
        createdAt: daysAgo(12),
      },
      {
        id: "contact-maria",
        companyId: "company-kotova",
        name: "Мария Котова",
        role: "Владелец",
        phone: "+7 911 300-22-10",
        email: "maria@example.com",
        createdAt: daysAgo(32),
      },
      {
        id: "contact-denis",
        companyId: "company-orlov",
        name: "Денис Орлов",
        role: "Покупатель",
        phone: "+7 906 440-18-70",
        email: "denis@example.com",
        createdAt: daysAgo(4),
      },
      {
        id: "contact-ilya",
        companyId: "company-smirnov",
        name: "Илья Морозов",
        role: "Получатель",
        phone: "+7 999 120-45-90",
        email: "ilya@example.com",
        createdAt: daysAgo(2),
      },
    ],
    leads: [
      {
        id: "lead-anna",
        contactId: "contact-anna",
        companyId: "company-smirnov",
        source: "Сайт",
        need: "Подобрать iPhone в подарок",
        status: "qualified",
        createdAt: daysAgo(6),
      },
      {
        id: "lead-ilya",
        contactId: "contact-ilya",
        companyId: "company-smirnov",
        source: "Почта",
        need: "Нужен ноутбук для учебы",
        status: "new",
        createdAt: daysAgo(2),
      },
      {
        id: "lead-maria",
        contactId: "contact-maria",
        companyId: "company-kotova",
        source: "Мессенджер",
        need: "Ищет планшет для рисования",
        status: "qualified",
        createdAt: daysAgo(18),
      },
      {
        id: "lead-denis",
        contactId: "contact-denis",
        companyId: "company-orlov",
        source: "Звонок",
        need: "Нужна доставка сегодня",
        status: "qualified",
        createdAt: daysAgo(1),
      },
    ],
    deals: [
      {
        id: "deal-iphone",
        leadId: "lead-anna",
        companyId: "company-smirnov",
        contactId: "contact-anna",
        title: "iPhone 15 Pro в подарок",
        value: 129990,
        status: "won",
        source: "Сайт",
        need: "Связаться после 18:00 и предложить цвета",
        closeDate: dateInput(daysAgo(3)),
        createdAt: daysAgo(6),
        updatedAt: daysAgo(3),
      },
      {
        id: "deal-ipad",
        leadId: "lead-maria",
        companyId: "company-kotova",
        contactId: "contact-maria",
        title: "Комплект iPad + Pencil",
        value: 87990,
        status: "offer",
        source: "Мессенджер",
        need: "Сравнивает Air и Pro",
        closeDate: dateInput(daysAgo(-10)),
        createdAt: daysAgo(18),
        updatedAt: daysAgo(2),
      },
      {
        id: "deal-watch",
        leadId: "lead-denis",
        companyId: "company-orlov",
        contactId: "contact-denis",
        title: "Apple Watch для тренировок",
        value: 44990,
        status: "new",
        source: "Звонок",
        need: "Нужна доставка сегодня",
        closeDate: dateInput(iso),
        createdAt: daysAgo(1),
        updatedAt: iso,
      },
    ],
    tasks: [
      {
        id: "task-call-anna",
        title: "Уточнить цвет и время доставки",
        status: "todo",
        manager: "Алина",
        dueAt: dateInput(daysAgo(-1)),
        reminderAt: dateInput(daysAgo(-1)),
        dealId: "deal-iphone",
        leadId: "lead-anna",
        contactId: "contact-anna",
        companyId: "company-smirnov",
        description: "Позвонить после 18:00",
        createdAt: daysAgo(2),
      },
      {
        id: "task-ipad-offer",
        title: "Отправить сравнение iPad Air и Pro",
        status: "in_progress",
        manager: "Максим",
        dueAt: dateInput(daysAgo(-2)),
        reminderAt: dateInput(daysAgo(-3)),
        dealId: "deal-ipad",
        leadId: "lead-maria",
        contactId: "contact-maria",
        companyId: "company-kotova",
        description: "Приложить расчет комплекта",
        createdAt: daysAgo(4),
      },
      {
        id: "task-watch-delivery",
        title: "Проверить доступность курьера",
        status: "waiting",
        manager: "Олег",
        dueAt: dateInput(iso),
        reminderAt: dateInput(iso),
        dealId: "deal-watch",
        leadId: "lead-denis",
        contactId: "contact-denis",
        companyId: "company-orlov",
        description: "Сообщить клиенту окно доставки",
        createdAt: daysAgo(1),
      },
    ],
  };
}

function bindAuth() {
  document.querySelector("[data-login-form]")?.addEventListener("submit", (event) => {
    event.preventDefault();
    const data = formObject(event.currentTarget);
    const user = authenticateUser(data.login, data.password);
    if (!user) {
      setNote("[data-login-note]", "Неверный логин или пароль");
      return;
    }
    authenticatedUserId = user.id;
    activeUserId = user.id;
    saveAuthenticatedUserId();
    saveActiveUserId();
    event.currentTarget.reset();
    render();
  });

  document.addEventListener("click", (event) => {
    if (!event.target.closest("[data-logout]")) return;
    authenticatedUserId = "";
    activeUserId = "";
    saveAuthenticatedUserId();
    saveActiveUserId();
    document.querySelector("[data-dialog]")?.close();
    render();
  });
}

function bindNavigation() {
  document.querySelectorAll("[data-nav]").forEach((link) => {
    link.addEventListener("click", () => {
      activeScreen = link.dataset.nav;
    });
  });

  document.querySelector("[data-reset-demo]")?.addEventListener("click", () => {
    state = normalizeState(demoState());
    authenticatedUserId = normalizeAuthenticatedUserId(authenticatedUserId);
    activeUserId = userById(activeUserId) ? activeUserId : authenticatedUserId;
    selectedRecord = { type: "deal", id: visibleRows("deals")[0]?.id || "" };
    saveState();
    saveAuthenticatedUserId();
    saveActiveUserId();
    render();
  });
}

function bindDashboard() {
  document.addEventListener("click", (event) => {
    const resizeReport = event.target.closest("[data-dashboard-report-size]");
    if (resizeReport) {
      event.preventDefault();
      event.stopImmediatePropagation();
      cycleDashboardReportSize(resizeReport.dataset.dashboardReportSize);
      return;
    }

    const resizeWidget = event.target.closest("[data-dashboard-widget-size]");
    if (resizeWidget) {
      event.preventDefault();
      event.stopImmediatePropagation();
      cycleDashboardWidgetSize(resizeWidget.dataset.dashboardWidgetSize);
      return;
    }

    const period = event.target.closest("[data-period]");
    if (!period) return;
    activePeriod = period.dataset.period;
    renderDashboard();
  });

  document.addEventListener("dragstart", (event) => {
    const card = event.target.closest("[data-dashboard-report-card]");
    if (card) {
      draggedDashboardReportId = card.dataset.dashboardReportCard;
      card.classList.add("is-dragging");
      event.dataTransfer.effectAllowed = "move";
      event.dataTransfer.setData("text/plain", draggedDashboardReportId);
      return;
    }

    const widget = event.target.closest("[data-dashboard-widget]");
    if (!widget) return;
    draggedDashboardWidgetId = widget.dataset.dashboardWidget;
    widget.classList.add("is-dragging");
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", draggedDashboardWidgetId);
  });

  document.addEventListener("dragover", (event) => {
    const card = event.target.closest("[data-dashboard-report-card]");
    if (card && draggedDashboardReportId) {
      event.preventDefault();
      card.classList.add("is-over");
      event.dataTransfer.dropEffect = "move";
      return;
    }

    const widget = event.target.closest("[data-dashboard-widget]");
    if (!widget || !draggedDashboardWidgetId) return;
    event.preventDefault();
    widget.classList.add("is-over");
    event.dataTransfer.dropEffect = "move";
  });

  document.addEventListener("dragleave", (event) => {
    const card = event.target.closest("[data-dashboard-report-card]");
    if (card) {
      if (card.contains(event.relatedTarget)) return;
      card.classList.remove("is-over");
      return;
    }

    const widget = event.target.closest("[data-dashboard-widget]");
    if (!widget || widget.contains(event.relatedTarget)) return;
    widget.classList.remove("is-over");
  });

  document.addEventListener("drop", (event) => {
    const card = event.target.closest("[data-dashboard-report-card]");
    if (card && draggedDashboardReportId) {
      event.preventDefault();
      reorderDashboardReport(draggedDashboardReportId, card.dataset.dashboardReportCard);
      return;
    }

    const widget = event.target.closest("[data-dashboard-widget]");
    if (!widget || !draggedDashboardWidgetId) return;
    event.preventDefault();
    reorderDashboardWidget(draggedDashboardWidgetId, widget.dataset.dashboardWidget);
  });

  document.addEventListener("dragend", () => {
    draggedDashboardReportId = "";
    draggedDashboardWidgetId = "";
    document.querySelectorAll("[data-dashboard-report-card].is-dragging, [data-dashboard-report-card].is-over, [data-dashboard-widget].is-dragging, [data-dashboard-widget].is-over").forEach((card) => {
      card.classList.remove("is-dragging", "is-over");
    });
  });

  document.addEventListener("change", (event) => {
    const userSelect = event.target.closest("[data-impersonate-user]");
    if (!userSelect) return;
    if (signedInUser()?.role !== "vip") return;
    activeUserId = userSelect.value;
    saveActiveUserId();
    render();
  });
}

function bindReports() {
  document.addEventListener("change", (event) => {
    const select = event.target.closest("[data-report-select]");
    if (select) {
      activeReport = select.value;
      renderReports();
      return;
    }

    const rebuild = event.target.closest("[data-builder-rebuild]");
    if (rebuild) {
      builderDraft = captureReportBuilder();
      renderReports();
    }
  });

  document.addEventListener("click", (event) => {
    const addDealItem = event.target.closest("[data-add-deal-item]");
    if (addDealItem) {
      appendDealItemRow(addDealItem.closest("[data-deal-card-form]"));
      return;
    }

    const removeDealItem = event.target.closest("[data-remove-deal-item]");
    if (removeDealItem) {
      removeDealItemRow(removeDealItem.closest("[data-deal-item-row]"));
      return;
    }

    const openReport = event.target.closest("[data-open-report]");
    if (openReport) {
      activeReport = openReport.dataset.openReport;
      goToScreen("reports");
      return;
    }

    const newReport = event.target.closest("[data-new-report]");
    if (newReport) {
      builderDraft = defaultReportDraft();
      activeReport = "builder";
      renderReports();
      return;
    }

    const reportButton = event.target.closest("[data-report-id]");
    if (reportButton) {
      activeReport = reportButton.dataset.reportId;
      renderReports();
      return;
    }

    const editReport = event.target.closest("[data-edit-custom-report]");
    if (editReport) {
      const report = customReports.find((item) => item.id === editReport.dataset.editCustomReport);
      if (report) {
        builderDraft = normalizeReportDefinition(report);
        activeReport = "builder";
        renderReports();
      }
      return;
    }

    const deleteReport = event.target.closest("[data-delete-custom-report]");
    if (deleteReport) {
      const id = deleteReport.dataset.deleteCustomReport;
      customReports = customReports.filter((item) => item.id !== id);
      dashboardReportIds = dashboardReportIds.filter((reportId) => reportId !== `custom:${id}`);
      delete dashboardReportLayouts[`custom:${id}`];
      activeReport = "salesFunnel";
      saveCustomReports();
      saveDashboardReports();
      saveDashboardReportLayouts();
      render();
      return;
    }

    const addCondition = event.target.closest("[data-builder-add-condition]");
    if (addCondition) {
      builderDraft = captureReportBuilder();
      builderDraft.conditions.push(defaultReportCondition(builderDraft.table));
      renderReports();
      return;
    }

    const removeCondition = event.target.closest("[data-builder-remove-condition]");
    if (removeCondition) {
      builderDraft = captureReportBuilder();
      builderDraft.conditions.splice(Number(removeCondition.dataset.builderRemoveCondition), 1);
      renderReports();
      return;
    }

    if (event.target.closest("[data-run-custom-report]")) {
      builderDraft = captureReportBuilder();
      renderReports();
      return;
    }

    if (event.target.closest("[data-save-custom-report]")) {
      const definition = captureReportBuilder();
      if (!clean(definition.name)) {
        window.alert("Укажите название отчета");
        return;
      }

      const saved = normalizeReportDefinition({
        ...definition,
        id: definition.id || makeId("report"),
      });
      customReports = [
        ...customReports.filter((item) => item.id !== saved.id),
        saved,
      ];
      builderDraft = saved;
      activeReport = `custom:${saved.id}`;
      saveCustomReports();
      renderReports();
      return;
    }

    if (event.target.closest("[data-pin-report]")) {
      if (activeReport === "builder") return;
      if (!dashboardReportIds.includes(activeReport)) {
        dashboardReportIds = [...dashboardReportIds, activeReport].slice(-6);
      }
      saveDashboardReports();
      renderDashboard();
      renderReports();
    }
  });
}

function bindForms() {
  document.querySelector("[data-mail-form]")?.addEventListener("submit", (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    const { emailText } = formObject(form);
    const lead = createLeadFromPerson({ ...parseEmailText(emailText), source: "Почта" });
    form.reset();
    goToScreen("leads");
    selectedRecord = { type: "lead", id: lead.id };
    setNote("[data-mail-note]", `Письмо разобрано: ${contactById(lead.contactId)?.name || "контакт"}`);
  });

  document.addEventListener("submit", (event) => {
    const leadForm = event.target.closest("[data-lead-card-form]");
    if (leadForm) {
      event.preventDefault();
      saveLeadCard(leadForm);
      return;
    }

    const dealForm = event.target.closest("[data-deal-card-form]");
    if (dealForm) {
      event.preventDefault();
      saveDealCard(dealForm);
      return;
    }

    const contactForm = event.target.closest("[data-contact-card-form]");
    if (contactForm) {
      event.preventDefault();
      saveContactCard(contactForm);
      return;
    }

    const companyForm = event.target.closest("[data-company-card-form]");
    if (companyForm) {
      event.preventDefault();
      saveCompanyCard(companyForm);
      return;
    }

    const taskForm = event.target.closest("[data-task-card-form]");
    if (taskForm) {
      event.preventDefault();
      saveTaskCard(taskForm);
      return;
    }

    const listForm = event.target.closest("[data-list-settings-form]");
    if (listForm) {
      event.preventDefault();
      saveListSettingsForm(listForm);
      return;
    }

    const userForm = event.target.closest("[data-user-form]");
    if (userForm) {
      event.preventDefault();
      createUserFromCabinet(userForm);
      return;
    }

    const planForm = event.target.closest("[data-plan-form]");
    if (planForm) {
      event.preventDefault();
      saveSalesPlan(planForm);
      return;
    }

    const productForm = event.target.closest("[data-product-form]");
    if (productForm) {
      event.preventDefault();
      saveProductFromForm(productForm);
      return;
    }

    const batchForm = event.target.closest("[data-batch-form]");
    if (batchForm) {
      event.preventDefault();
      saveProductBatchFromForm(batchForm);
    }
  });

  document.addEventListener("input", (event) => {
    if (!event.target.closest("[data-batch-quantity]")) return;
    syncBatchSerialFields(event.target.closest("[data-batch-form]"));
  });

  document.addEventListener("change", (event) => {
    const createDealContact = event.target.closest("[data-create-deal-contact]");
    if (createDealContact) {
      syncCreateDealCompany(createDealContact.closest("form"));
      return;
    }

    const productSelect = event.target.closest("[data-deal-item-product]");
    if (productSelect) {
      refreshDealItemUnits(productSelect.closest("[data-deal-item-row]"));
      return;
    }

    const unitSelect = event.target.closest("[data-deal-item-unit]");
    if (unitSelect?.value) {
      const quantity = unitSelect.closest("[data-deal-item-row]")?.querySelector('[name="itemQuantity"]');
      if (quantity) quantity.value = "1";
      return;
    }

    if (!event.target.closest("[data-batch-mode]")) return;
    syncBatchSerialFields(event.target.closest("[data-batch-form]"));
  });
}

function bindBoard() {
  document.addEventListener("dragstart", (event) => {
    const card = event.target.closest("[data-board-card]");
    if (!card) return;
    draggedDealId = card.dataset.cardId;
    card.classList.add("is-dragging");
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", JSON.stringify({ type: card.dataset.cardType, id: draggedDealId }));
  });

  document.addEventListener("dragend", (event) => {
    event.target.closest("[data-board-card]")?.classList.remove("is-dragging");
    document.querySelectorAll(".kanban-column.is-over").forEach((column) => {
      column.classList.remove("is-over");
    });
    draggedDealId = "";
  });

  document.addEventListener("dragover", (event) => {
    const column = event.target.closest("[data-status]");
    if (!column) return;
    event.preventDefault();
    column.classList.add("is-over");
    event.dataTransfer.dropEffect = "move";
  });

  document.addEventListener("dragleave", (event) => {
    const column = event.target.closest("[data-status]");
    if (!column || column.contains(event.relatedTarget)) return;
    column.classList.remove("is-over");
  });

  document.addEventListener("drop", (event) => {
    const column = event.target.closest("[data-status]");
    if (!column) return;
    event.preventDefault();
    column.classList.remove("is-over");
    moveBoardCard(event.dataTransfer.getData("text/plain"), column.dataset.status);
  });

  document.addEventListener("change", (event) => {
    const select = event.target.closest("[data-deal-status]");
    if (select) {
      moveDeal(select.dataset.dealStatus, select.value);
      return;
    }

    const taskStatus = event.target.closest("[data-task-status]");
    if (taskStatus) {
      moveTask(taskStatus.dataset.taskStatus, taskStatus.value);
    }
  });

  document.addEventListener("click", (event) => {
    const switcher = event.target.closest("[data-kanban-board]");
    if (switcher) {
      activeKanban = switcher.dataset.kanbanBoard;
      renderKanban();
      return;
    }

    const card = event.target.closest("[data-board-card]");
    if (!card || event.target.closest("button, select, input, textarea, a")) return;
    selectedRecord = { type: card.dataset.cardType, id: card.dataset.cardId };
    openRecordDialog(card.dataset.cardType, card.dataset.cardId);
  });

  document.addEventListener("keydown", (event) => {
    if (!["Enter", " "].includes(event.key)) return;
    const card = event.target.closest("[data-board-card]");
    if (!card || event.target.closest("button, select, input, textarea, a")) return;
    event.preventDefault();
    selectedRecord = { type: card.dataset.cardType, id: card.dataset.cardId };
    openRecordDialog(card.dataset.cardType, card.dataset.cardId);
  });
}

function bindTables() {
  document.addEventListener("contextmenu", (event) => {
    const cell = event.target.closest("[data-cell-field]");
    if (!cell) {
      const tableScreen = event.target.closest("[data-table-screen]");
      const tableCard = event.target.closest(".table-card");
      if (!tableScreen || !tableCard || !tableDefs[tableScreen.dataset.tableScreen]) return;
      event.preventDefault();
      openTableContextMenu(event, tableScreen.dataset.tableScreen);
      return;
    }
    event.preventDefault();
    openCellContextMenu(event, cell);
  });

  document.addEventListener("change", (event) => {
    const preset = event.target.closest("[data-filter-preset]");
    if (preset) {
      loadFilterPreset(preset.dataset.filterPreset, preset.value);
      renderTableScreen(preset.dataset.filterPreset);
      return;
    }
  });

  document.addEventListener("click", (event) => {
    const contextAction = event.target.closest("[data-cell-action]");
    if (contextAction) {
      handleCellContextAction(contextAction.dataset.cellAction);
      return;
    }

    const listAction = event.target.closest("[data-list-action]");
    if (listAction) {
      handleListAction(listAction.dataset.listAction, listAction.dataset.listTable);
      return;
    }

    const inlineSave = event.target.closest("[data-inline-save]");
    if (inlineSave) {
      saveInlineEdit(inlineSave.closest("[data-inline-editor]"));
      return;
    }

    const inlineCancel = event.target.closest("[data-inline-cancel]");
    if (inlineCancel) {
      renderTableScreen(inlineCancel.dataset.inlineTable);
      return;
    }

    const rowInfo = event.target.closest("[data-row-info]");
    if (rowInfo) {
      openRecordDialog(rowInfo.dataset.infoType, rowInfo.dataset.rowInfo);
      return;
    }

    if (cellContextMenu && !event.target.closest(".cell-context-menu")) {
      closeCellContextMenu();
    }

    const applyFilters = event.target.closest("[data-apply-filters]");
    if (applyFilters) {
      applyTableFilters(applyFilters.dataset.applyFilters);
      return;
    }

    const addCondition = event.target.closest("[data-add-condition]");
    if (addCondition) {
      addConditionRow(addCondition.dataset.addCondition);
      renderTableScreen(addCondition.dataset.addCondition);
      return;
    }

    const removeCondition = event.target.closest("[data-remove-condition]");
    if (removeCondition) {
      removeConditionRow(removeCondition.dataset.removeCondition, Number(removeCondition.dataset.conditionIndex));
      renderTableScreen(removeCondition.dataset.removeCondition);
      return;
    }

    const saveFilter = event.target.closest("[data-save-filter]");
    if (saveFilter) {
      saveFilterPreset(saveFilter.dataset.saveFilter);
      renderTableScreen(saveFilter.dataset.saveFilter);
      return;
    }

    const clear = event.target.closest("[data-clear-filters]");
    if (clear) {
      clear.closest("[data-filter-form]")?.reset();
      if (tableDefs[activeScreen]) tableFilters[activeScreen] = emptyFilters();
      if (tableDefs[activeScreen]) conditionBuilders[activeScreen].conditions = [];
      if (tableDefs[activeScreen]) tableDrillLocks[activeScreen] = [];
      saveConditionBuilders();
      renderTableScreen(activeScreen);
      return;
    }

    const open = event.target.closest("[data-open-record]");
    if (open) {
      selectedRecord = { type: open.dataset.openType, id: open.dataset.openRecord };
      openRecordDialog(selectedRecord.type, selectedRecord.id);
      return;
    }

    const drilldown = event.target.closest("[data-drilldown]");
    if (drilldown) {
      openDrilldown(drilldown.dataset.drilldown);
      return;
    }

    const sortButton = event.target.closest("[data-sort-field]");
    if (sortButton) {
      toggleTableSort(sortButton.dataset.sortTable, sortButton.dataset.sortField);
      return;
    }

    const groupMenu = event.target.closest("[data-group-menu]");
    if (groupMenu) {
      toggleGroupMenu(groupMenu.dataset.groupMenu, groupMenu.dataset.groupField);
      return;
    }

    const groupAction = event.target.closest("[data-group-action]");
    if (groupAction) {
      handleGroupAction(groupAction.dataset.groupTable, groupAction.dataset.groupAction, groupAction.dataset.groupField);
      return;
    }

    const groupToggle = event.target.closest("[data-group-toggle]");
    if (groupToggle) {
      toggleGroup(groupToggle.dataset.groupTable, groupToggle.dataset.groupToggle);
      return;
    }

    const openGroup = event.target.closest("[data-open-group]");
    if (openGroup) {
      openGroupedValue(openGroup.dataset.groupTable, openGroup.dataset.groupField, openGroup.dataset.groupValue);
      return;
    }

    if (event.target.closest("[data-dialog-close]")) {
      document.querySelector("[data-dialog]")?.close();
      return;
    }

    const convert = event.target.closest("[data-convert-lead]");
    if (convert) {
      const lead = leadById(convert.dataset.convertLead);
      if (!lead) return;
      const contact = contactById(lead.contactId);
      const deal = createDeal({
        leadId: lead.id,
        companyId: lead.companyId,
        contactId: lead.contactId,
        title: lead.need || `Сделка с ${contact?.name || "клиентом"}`,
        value: 0,
        source: lead.source,
        need: lead.need,
      });
      if (!deal) return;
      lead.status = "qualified";
      lead.disqualificationReason = "";
      lead.updatedAt = new Date().toISOString();
      selectedRecord = { type: "deal", id: deal.id };
      saveState();
      render();
      openRecordDialog("deal", deal.id);
      return;
    }

    const create = event.target.closest("[data-open-create]");
    if (create) {
      openCreateDialog(create.dataset.openCreate);
      return;
    }

    const createTaskButton = event.target.closest("[data-open-create-task]");
    if (createTaskButton) {
      openCreateDialog("task", {
        dealId: createTaskButton.dataset.dealId || "",
        leadId: createTaskButton.dataset.leadId || "",
        contactId: createTaskButton.dataset.contactId || "",
        companyId: createTaskButton.dataset.companyId || "",
      });
    }
  });

  document.addEventListener("dblclick", (event) => {
    const cell = event.target.closest("[data-cell-field]");
    if (!cell) return;
    startInlineEdit(cell);
  });

  document.addEventListener("change", (event) => {
    const pageSize = event.target.closest("[data-list-page-size]");
    if (pageSize) {
      const table = pageSize.dataset.listPageSize;
      listSettings[table].pageSize = Number(pageSize.value || 10);
      listSettings[table].page = 1;
      saveListSettings();
      renderTableScreen(table);
      return;
    }

    const rowSelect = event.target.closest("[data-row-select]");
    if (rowSelect) {
      toggleRowSelection(rowSelect.dataset.rowTable, rowSelect.value, rowSelect.checked);
      renderTableScreen(rowSelect.dataset.rowTable);
      return;
    }

    const selectAll = event.target.closest("[data-select-visible]");
    if (selectAll) {
      toggleVisibleSelection(selectAll.dataset.selectVisible, selectAll.checked);
      renderTableScreen(selectAll.dataset.selectVisible);
    }
  });
}

function createLeadFromPerson(data) {
  const company = upsertCompany(data.company || "Частный клиент", {
    phone: data.phone,
    email: data.email,
    segment: "B2C",
    industry: "Частный клиент",
  });
  const contact = upsertContact({
    companyId: company.id,
    name: data.name || data.email || data.phone || "Новый контакт",
    phone: data.phone,
    email: data.email,
    role: "Покупатель",
  });
  const lead = {
    id: makeId("lead"),
    contactId: contact.id,
    companyId: company.id,
    source: clean(data.source || "CRM"),
    need: clean(data.need),
    status: "new",
    disqualificationReason: "",
    manager: defaultRecordManager(),
    createdAt: new Date().toISOString(),
  };

  state.leads.unshift(lead);
  saveState();
  render();
  return lead;
}

function createDeal(data) {
  const contact = contactById(data.contactId);
  const companyId = clean(contact?.companyId || data.companyId);
  const company = companyById(companyId) || visibleRows("companies")[0] || upsertCompany("Частный клиент");
  const items = dealItemsFromData(data);
  const deal = {
    id: makeId("deal"),
    leadId: clean(data.leadId),
    companyId: company.id,
    contactId: clean(data.contactId || contact?.id),
    title: clean(data.title || data.need || "Новая сделка"),
    value: Number(data.value || 0),
    status: clean(data.status || "new"),
    source: clean(data.source || "CRM"),
    need: clean(data.need),
    manager: clean(data.manager || defaultRecordManager()),
    items,
    productId: "",
    productName: "",
    productCategory: "",
    productUnitIds: [],
    cost: 0,
    closeDate: clean(data.closeDate),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  syncDealProductFields(deal);
  if (!canSetDealStatus(deal, deal.status)) return null;
  applyDealProductCost(deal);
  syncProductUnitsForDeal(deal, []);

  state.deals.unshift(deal);
  saveState();
  render();
  return deal;
}

function createContact(data) {
  const contact = upsertContact({
    companyId: clean(data.companyId),
    name: clean(data.name),
    role: clean(data.role || "Покупатель"),
    phone: clean(data.phone),
    email: clean(data.email),
    manager: clean(data.manager || defaultRecordManager()),
  });
  saveState();
  render();
  return contact;
}

function createCompany(data) {
  const company = upsertCompany(data.name || "Новый клиент", {
    segment: clean(data.segment || "B2C"),
    industry: clean(data.industry || "Частный клиент"),
    city: clean(data.city),
    phone: clean(data.phone),
    email: clean(data.email),
    manager: clean(data.manager || defaultRecordManager()),
  });
  saveState();
  render();
  return company;
}

function saveProductFromForm(form) {
  const data = formObject(form);
  const product = upsertProduct({
    sku: data.sku,
    name: data.name,
    category: data.category,
    purchaseCost: data.purchaseCost,
  });
  saveState();
  form.reset();
  renderProducts();
  return product;
}

function saveProductBatchFromForm(form) {
  const data = formObject(form);
  const formData = new FormData(form);
  const isBatch = formData.has("isBatch");
  const quantity = isBatch ? Math.max(1, Number(data.quantity || 1)) : 1;
  const serialNumbers = formData.getAll("serialNumbers").map((serialNumber) => clean(serialNumber)).filter(Boolean);
  if (serialNumbers.length !== quantity) {
    window.alert(`Количество идентификационных номеров должно совпадать с количеством единиц: ${quantity}`);
    return;
  }
  const normalizedSerials = serialNumbers.map((serialNumber) => serialNumber.toLowerCase());
  const duplicateInBatch = serialNumbers.find((serialNumber, index) => normalizedSerials.indexOf(serialNumber.toLowerCase()) !== index);
  const existingSerials = new Set(state.productUnits.map((unit) => clean(unit.serialNumber).toLowerCase()));
  const duplicateExisting = serialNumbers.find((serialNumber) => existingSerials.has(serialNumber.toLowerCase()));
  if (duplicateInBatch || duplicateExisting) {
    window.alert(`Идентификационный номер уже существует: ${duplicateInBatch || duplicateExisting}`);
    return;
  }
  const product = upsertProduct({
    sku: data.sku,
    name: data.productName,
    purchaseCost: data.purchaseCost,
  });
  const batchId = makeId("batch");
  serialNumbers.forEach((serialNumber) => {
    state.productUnits.push({
      id: makeId("unit"),
      productId: product.id,
      serialNumber,
      purchaseCost: Math.max(0, Number(data.purchaseCost || product.purchaseCost || 0)),
      batchId,
      status: "available",
      dealId: "",
      createdAt: new Date().toISOString(),
    });
  });
  saveState();
  form.reset();
  syncBatchSerialFields(form);
  renderProducts();
}

function upsertProduct(data) {
  const name = clean(data.name || "Новый продукт");
  const sku = clean(data.sku);
  const existing = state.products.find((product) => (sku && product.sku === sku) || product.name.toLowerCase() === name.toLowerCase());
  if (existing) {
    existing.sku = sku || existing.sku;
    existing.name = name || existing.name;
    existing.category = clean(data.category || existing.category);
    existing.purchaseCost = Math.max(0, Number(data.purchaseCost || existing.purchaseCost || 0));
    return existing;
  }
  const product = {
    id: makeId("product"),
    sku: sku || makeId("sku"),
    name,
    category: clean(data.category || "Без категории"),
    purchaseCost: Math.max(0, Number(data.purchaseCost || 0)),
    createdAt: new Date().toISOString(),
  };
  state.products.push(product);
  return product;
}

function createTask(data) {
  const deal = dealById(data.dealId);
  const lead = leadById(data.leadId || deal?.leadId);
  const contact = contactById(data.contactId || deal?.contactId || lead?.contactId);
  const company = companyById(data.companyId || deal?.companyId || lead?.companyId || contact?.companyId);
  const dueAt = clean(data.dueAt) || dateInput(new Date(Date.now() + 86400000).toISOString());
  const task = {
    id: makeId("task"),
    title: clean(data.title || "Новая задача"),
    status: clean(data.status || "todo"),
    manager: normalizeTaskManager(data.manager),
    dueAt,
    reminderAt: clean(data.reminderAt || dueAt),
    dealId: clean(deal?.id || data.dealId),
    leadId: clean(lead?.id || data.leadId),
    contactId: clean(contact?.id || data.contactId),
    companyId: clean(company?.id || data.companyId),
    description: clean(data.description),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  state.tasks.unshift(task);
  saveState();
  render();
  return task;
}

function saveLeadCard(form) {
  const data = formObject(form);
  const lead = leadById(data.id);
  if (!lead || !canAccessLead(lead)) return;

  lead.need = clean(data.need || lead.need);
  lead.source = clean(data.source || lead.source);
  lead.status = leadStatuses.some((status) => status.id === data.status) ? data.status : lead.status;
  if (!lead.status) lead.status = "qualified";
  lead.disqualificationReason = lead.status === "disqualified"
    ? clean(data.disqualificationReason || leadDisqualificationReasons[0])
    : "";
  lead.updatedAt = new Date().toISOString();

  saveState();
  selectedRecord = { type: "lead", id: lead.id };
  render();
  openRecordDialog("lead", lead.id);
}

function saveDealCard(form) {
  const data = formObject(form);
  const deal = dealById(data.id);
  if (!deal || !canAccessDeal(deal)) return;
  const previousUnitIds = dealSelectedUnitIds(deal);
  const items = collectDealItems(form);
  if (!items) return;
  if (!validateRequiredDealUnitIds(items)) return;
  const manualValue = Math.max(0, Number(data.value || 0));
  if (!dealItemsRevenue(items) && manualValue && items.length) distributeDealValue(items, manualValue);
  const itemsTotal = dealItemsRevenue(items);

  const status = dealStatuses.some((item) => item.id === data.status) ? data.status : deal.status;
  const draftDeal = {
    ...deal,
    status,
    items,
  };
  syncDealProductFields(draftDeal);
  if (!canSetDealStatus(draftDeal, status)) {
    form.querySelector('[name="status"]').value = deal.status;
    return;
  }

  deal.title = clean(data.title || deal.title);
  deal.value = itemsTotal > 0 ? itemsTotal : manualValue;
  deal.status = status;
  deal.source = clean(data.source || deal.source);
  deal.need = clean(data.need);
  deal.items = items;
  syncDealProductFields(deal);
  applyDealProductCost(deal);
  syncProductUnitsForDeal(deal, previousUnitIds);
  deal.closeDate = clean(data.closeDate);
  deal.updatedAt = new Date().toISOString();
  if (deal.status === "won" && !deal.paidAt) deal.paidAt = deal.updatedAt;

  saveState();
  selectedRecord = { type: "deal", id: deal.id };
  render();
  document.querySelector("[data-dialog]")?.close();
}

function saveContactCard(form) {
  const data = formObject(form);
  const contact = contactById(data.id);
  if (!contact || !canAccessContact(contact)) return;

  contact.companyId = companyById(data.companyId) ? data.companyId : contact.companyId;
  contact.name = clean(data.name || contact.name);
  contact.role = clean(data.role || contact.role);
  contact.phone = clean(data.phone);
  contact.email = clean(data.email).toLowerCase();
  contact.gender = clean(data.gender);
  contact.age = data.age ? Math.max(0, Number(data.age)) : "";
  contact.interest = clean(data.interest);
  contact.geo = clean(data.geo);
  contact.loyaltyTier = clean(data.loyaltyTier);
  contact.nps = data.nps ? Math.min(10, Math.max(0, Number(data.nps))) : "";
  contact.csat = data.csat ? Math.min(5, Math.max(0, Number(data.csat))) : "";
  contact.manager = clean(data.manager);

  saveState();
  selectedRecord = { type: "contact", id: contact.id };
  render();
  openRecordDialog("contact", contact.id);
}

function saveCompanyCard(form) {
  const data = formObject(form);
  const company = companyById(data.id);
  if (!company || !canAccessCompany(company)) return;
  const previousCity = company.city;

  company.name = clean(data.name || company.name);
  company.segment = clean(data.segment || company.segment);
  company.industry = clean(data.industry || company.industry);
  company.city = clean(data.city);
  company.phone = clean(data.phone);
  company.email = clean(data.email).toLowerCase();

  state.contacts
    .filter((contact) => contact.companyId === company.id && (!contact.geo || contact.geo === previousCity))
    .forEach((contact) => {
      contact.geo = company.city;
    });

  saveState();
  selectedRecord = { type: "company", id: company.id };
  render();
  openRecordDialog("company", company.id);
}

function saveTaskCard(form) {
  const data = formObject(form);
  const task = taskById(data.id);
  if (!task || !canAccessTask(task)) return;
  task.title = clean(data.title || task.title);
  task.status = taskStatuses.some((status) => status.id === data.status) ? data.status : task.status;
  task.manager = normalizeTaskManager(data.manager || task.manager);
  task.dueAt = clean(data.dueAt);
  task.reminderAt = clean(data.reminderAt);
  task.dealId = clean(data.dealId);
  task.leadId = clean(data.leadId);
  task.contactId = clean(data.contactId);
  task.companyId = clean(data.companyId);
  task.description = clean(data.description);
  task.updatedAt = new Date().toISOString();
  saveState();
  selectedRecord = { type: "task", id: task.id };
  render();
  openRecordDialog("task", task.id);
}

function createUserFromCabinet(form) {
  const data = formObject(form);
  const current = currentUser();
  if (!["leader", "vip"].includes(current.role)) return;
  const role = data.role === "leader" && current.role === "vip" ? "leader" : "manager";
  const supervisorId = role === "manager"
    ? clean(data.supervisorId || (current.role === "leader" ? current.id : ""))
    : current.id;
  const login = clean(data.login || data.email || data.name).toLowerCase();
  if (!login || state.users.some((user) => clean(user.login).toLowerCase() === login)) {
    window.alert("Укажите уникальный логин пользователя");
    return;
  }
  const user = {
    id: makeId("user"),
    name: clean(data.name || "Новый пользователь"),
    email: clean(data.email).toLowerCase(),
    login,
    password: clean(data.password || "123456"),
    role,
    supervisorId,
    active: true,
    createdAt: new Date().toISOString(),
  };
  state.users.push(user);
  saveState();
  form.reset();
  renderCabinet();
}

function saveSalesPlan(form) {
  const data = formObject(form);
  const current = currentUser();
  const scope = data.scope === "company" ? "company" : "manager";
  const period = clean(data.period || currentPlanPeriod());
  const amount = Math.max(0, Number(data.amount || 0));

  if (scope === "company") {
    if (!["leader", "vip"].includes(current.role)) return;
    const distributedPlan = managerPlansTotal(period);
    if (amount < distributedPlan) {
      window.alert(`План компании не может быть меньше суммы планов менеджеров: ${money.format(distributedPlan)}`);
      return;
    }
    state.salesPlans = [
      ...state.salesPlans.filter((plan) => !((plan.scope || (plan.userId ? "manager" : "company")) === "company" && plan.period === period)),
      { id: makeId("plan"), scope: "company", userId: "", period, amount, createdAt: new Date().toISOString() },
    ];
    saveState();
    renderCabinet();
    return;
  }

  const user = userById(data.userId);
  if (!user || user.role !== "manager" || !canManageUserPlan(current, user)) return;
  const limit = companyPlan(period);
  const nextDistributedPlan = managerPlansTotal(period, user.id, amount);
  if (hasCompanyPlan(period) && nextDistributedPlan > limit) {
    window.alert(`Сумма планов менеджеров не может превышать план компании: ${money.format(limit)}`);
    return;
  }
  state.salesPlans = [
    ...state.salesPlans.filter((plan) => !((plan.scope || "manager") === "manager" && plan.userId === user.id && plan.period === period)),
    { id: makeId("plan"), scope: "manager", userId: user.id, period, amount, createdAt: new Date().toISOString() },
  ];
  saveState();
  renderCabinet();
}

function upsertCompany(name, defaults = {}) {
  const cleanName = clean(name || "Частный клиент");
  const existing = state.companies.find((company) => canAccessCompany(company) && company.name.toLowerCase() === cleanName.toLowerCase());
  if (existing) return existing;

  const company = {
    id: makeId("company"),
    name: cleanName,
    segment: clean(defaults.segment || "B2C"),
    industry: clean(defaults.industry || "Частный клиент"),
    city: clean(defaults.city),
    phone: clean(defaults.phone),
    email: clean(defaults.email),
    manager: clean(defaults.manager || defaultRecordManager()),
    createdAt: new Date().toISOString(),
  };

  state.companies.unshift(company);
  return company;
}

function upsertContact(data) {
  const email = clean(data.email).toLowerCase();
  const phone = clean(data.phone);
  const existing = state.contacts.find((contact) => {
    return canAccessContact(contact) && ((email && String(contact.email || "").toLowerCase() === email) || (phone && contact.phone === phone));
  });

  if (existing) {
    existing.companyId = clean(data.companyId || existing.companyId);
    existing.name = clean(data.name || existing.name);
    existing.phone = phone || existing.phone;
    existing.email = email || existing.email;
    existing.role = clean(data.role || existing.role);
    existing.manager ||= clean(data.manager || defaultRecordManager());
    return existing;
  }

  const contact = {
    id: makeId("contact"),
    companyId: clean(data.companyId),
    name: clean(data.name || "Новый контакт"),
    role: clean(data.role || "Покупатель"),
    phone,
    email,
    manager: clean(data.manager || defaultRecordManager()),
    createdAt: new Date().toISOString(),
  };

  state.contacts.unshift(contact);
  return contact;
}

function moveDeal(dealId, status) {
  const deal = dealById(dealId);
  if (!deal || !canAccessDeal(deal) || !dealStatuses.some((item) => item.id === status)) return;
  if (!canSetDealStatus(deal, status)) {
    render();
    return;
  }

  deal.status = status;
  deal.updatedAt = new Date().toISOString();
  syncProductUnitsForDeal(deal, dealSelectedUnitIds(deal));
  if (deal.status === "won" && !deal.paidAt) deal.paidAt = deal.updatedAt;
  saveState();
  render();
}

function moveLead(leadId, status) {
  const lead = leadById(leadId);
  if (!lead || !canAccessLead(lead) || !leadStatuses.some((item) => item.id === status)) return;
  lead.status = status;
  if (status !== "disqualified") lead.disqualificationReason = "";
  lead.updatedAt = new Date().toISOString();
  saveState();
  render();
}

function moveTask(taskId, status) {
  const task = taskById(taskId);
  if (!task || !canAccessTask(task) || !taskStatuses.some((item) => item.id === status)) return;
  task.status = status;
  task.updatedAt = new Date().toISOString();
  saveState();
  render();
}

function moveBoardCard(payload, status) {
  let parsed = { type: activeKanban === "tasks" ? "task" : activeKanban === "leads" ? "lead" : "deal", id: draggedDealId };
  try {
    parsed = JSON.parse(payload || "{}");
  } catch {
  }
  if (parsed.type === "task") moveTask(parsed.id, status);
  if (parsed.type === "lead") moveLead(parsed.id, status);
  if (parsed.type === "deal") moveDeal(parsed.id, status);
}

function parseEmailText(text) {
  const source = String(text || "");
  const email = source.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i)?.[0] || "";
  const phone = source.match(/(?:\+?\d[\d\s().-]{7,}\d)/)?.[0] || "";
  const subject = source.match(/^subject:\s*(.+)$/im)?.[1] || source.match(/^тема:\s*(.+)$/im)?.[1] || "";
  const fromLine = source.match(/^from:\s*(.+)$/im)?.[1] || source.match(/^от:\s*(.+)$/im)?.[1] || "";
  const namedLine = source.match(/(?:имя|name|клиент)\s*[:\-]\s*(.+)$/im)?.[1] || "";
  const companyLine = source.match(/(?:компания|company)\s*[:\-]\s*(.+)$/im)?.[1] || "";
  const lines = source
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .filter((line) => !/^(from|to|subject|от|кому|тема|компания|company)\s*:/i.test(line));

  return {
    name: clean(namedLine || fromLine.replace(/<[^>]+>/g, "").replace(email, "")),
    company: clean(companyLine),
    phone,
    email,
    need: clean(subject || lines.slice(0, 4).join(" ")),
  };
}

function render() {
  renderAuth();
  if (!isAuthenticated()) return;
  renderShell();
  renderDashboard();
  renderKanban();
  renderTableScreen("deals");
  renderTableScreen("leads");
  renderTableScreen("tasks");
  renderTableScreen("contacts");
  renderTableScreen("companies");
  renderProducts();
  renderCabinet();
  renderReports();
}

function renderShell() {
  document.querySelectorAll("[data-screen]").forEach((screen) => {
    screen.classList.toggle("active", screen.dataset.screen === activeScreen);
  });

  document.querySelectorAll("[data-nav]").forEach((link) => {
    link.classList.toggle("active", link.dataset.nav === activeScreen);
  });
}

function renderAuth() {
  const authenticated = isAuthenticated();
  document.body.classList.toggle("is-authenticated", authenticated);
  document.body.classList.toggle("auth-pending", !authenticated);

  const sessionBar = document.querySelector("[data-session-bar]");
  if (!sessionBar) return;
  if (!authenticated) {
    sessionBar.innerHTML = "";
    return;
  }

  const auth = signedInUser();
  const effective = currentUser();
  const impersonated = auth?.id !== effective?.id;
  sessionBar.innerHTML = `
    <div class="session-user">
      <strong>${escapeHtml(effective.name)}</strong>
      <span>${escapeHtml(roleLabel(effective.role))}</span>
      ${impersonated ? `<em>VIP смотрит как пользователь</em>` : ""}
    </div>
    <button class="button light compact" type="button" data-logout>Выйти</button>
  `;
}

function renderDashboard() {
  document.querySelectorAll("[data-period]").forEach((button) => {
    button.classList.toggle("active", button.dataset.period === activePeriod);
  });

  const range = periodRange(activePeriod);
  const dealsSource = visibleRows("deals");
  const leadsSource = visibleRows("leads");
  const contactsSource = visibleRows("contacts");
  const companiesSource = visibleRows("companies");
  const wonDeals = dealsSource.filter((deal) => deal.status === "won" && isInsidePeriod(deal.updatedAt || deal.closeDate || deal.createdAt, range));
  const periodLeads = leadsSource.filter((lead) => isInsidePeriod(lead.createdAt, range));
  const sales = wonDeals.reduce((sum, deal) => sum + Number(deal.value || 0), 0);
  const activeDeals = dealsSource.filter((deal) => !["won", "lost"].includes(deal.status));
  const pipeline = activeDeals.reduce((sum, deal) => sum + Number(deal.value || 0), 0);
  const openTasks = visibleRows("tasks").filter((task) => task.status !== "done");
  const todayTasks = openTasks.filter(taskDueToday);
  const dueTasks = upcomingTasks();

  const widgets = {
    sales: dashboardCard("sales", "Продажи", money.format(sales), periodLabel(activePeriod), drillPayload("deals", [{ field: "status", operator: "equals", value: "won" }], idsOf(wonDeals))),
    leads: dashboardCard("leads", "Лиды", periodLeads.length, periodLabel(activePeriod), drillPayload("leads", [], idsOf(periodLeads))),
    pipeline: dashboardCard("pipeline", "Активная воронка", money.format(pipeline), `${activeDeals.length} сделок`, drillPayload("deals", [{ field: "status", operator: "not_equals", value: "won" }, { join: "and", field: "status", operator: "not_equals", value: "lost" }], idsOf(activeDeals))),
    contacts: dashboardCard("contacts", "Контакты", contactsSource.length, `${companiesSource.length} компаний`, drillPayload("contacts", [], idsOf(contactsSource))),
    tasks: dashboardTaskCard(openTasks.length, todayTasks.length),
    periodDeals: `
    <section class="dashboard-panel wide dashboard-period-deals dashboard-widget size-${dashboardWidgetSize("periodDeals")}" draggable="true" data-dashboard-widget="periodDeals">
      <div class="section-head compact-head">
        <div>
          <p class="eyebrow">Динамика</p>
          <h2>Сделки за период</h2>
        </div>
        ${dashboardWidgetControls("periodDeals")}
      </div>
      <div class="dashboard-list dashboard-scroll-list">
        ${wonDeals.length ? wonDeals.map((deal) => {
          const company = companyById(deal.companyId);
          return `
            <button type="button" data-open-type="deal" data-open-record="${deal.id}" class="dashboard-row">
              <span>${escapeHtml(deal.title)}</span>
              <strong>${money.format(Number(deal.value || 0))}</strong>
              <em>${escapeHtml(company?.name || "Компания не указана")}</em>
            </button>
          `;
        }).join("") : `<div class="empty-state">За выбранный период успешных продаж нет</div>`}
      </div>
    </section>`,
    sources: `
    <section class="dashboard-panel dashboard-widget size-${dashboardWidgetSize("sources")}" draggable="true" data-dashboard-widget="sources">
      <div class="section-head compact-head">
        <div>
          <p class="eyebrow">Источники</p>
          <h2>Лиды</h2>
        </div>
        ${dashboardWidgetControls("sources")}
      </div>
      <div class="source-list">
        ${sourceStats(periodLeads).map(([source, count]) => `
          <button type="button" data-drilldown="${drillPayload("leads", [{ field: "source", operator: "equals", value: source }], idsOf(periodLeads.filter((lead) => (lead.source || "CRM") === source)))}">
            <span>${escapeHtml(source)}</span>
            <strong>${count}</strong>
          </button>
        `).join("") || `<p>Нет лидов</p>`}
      </div>
    </section>`,
    reminders: `
    <section class="dashboard-panel dashboard-widget size-${dashboardWidgetSize("reminders")}" draggable="true" data-dashboard-widget="reminders">
      <div class="section-head compact-head">
        <div>
          <p class="eyebrow">Напоминания</p>
          <h2>Ближайшие задачи</h2>
        </div>
        <div class="dashboard-panel-actions">
          <strong class="today-task-badge">${todayTasks.length} сегодня</strong>
          ${dashboardWidgetControls("reminders")}
        </div>
      </div>
      <div class="dashboard-list">
        ${dueTasks.map((task) => `
          <button type="button" data-open-type="task" data-open-record="${task.id}" class="dashboard-row ${taskDueToday(task) ? "today-task-row" : ""}">
            <span>${escapeHtml(task.title)}</span>
            <strong>${escapeHtml(task.dueAt ? formatDate(task.dueAt) : "Без срока")}</strong>
            <em>${escapeHtml(task.manager || taskStatusLabel(task))}</em>
          </button>
        `).join("") || `<div class="empty-state">Ближайших задач нет</div>`}
      </div>
    </section>`,
    reports: `
    <section class="dashboard-panel dashboard-reports dashboard-widget size-${dashboardWidgetSize("reports")}" draggable="true" data-dashboard-widget="reports">
      <div class="section-head compact-head">
        <div>
          <p class="eyebrow">Отчеты</p>
          <h2>Закреплено на дашборде</h2>
        </div>
        ${dashboardWidgetControls("reports")}
      </div>
      <div class="report-mini-grid">
        ${dashboardReportIds.map((id) => reportMiniCard(id)).join("") || `<div class="empty-state">Закрепите отчет в разделе аналитики</div>`}
      </div>
    </section>`,
  };

  document.querySelector("[data-dashboard]").innerHTML = normalizedDashboardWidgetOrder().map((id) => widgets[id]).filter(Boolean).join("");
}

function renderProducts() {
  const root = document.querySelector("[data-products]");
  if (!root) return;
  const products = state.products || [];
  const units = state.productUnits || [];
  const totals = {
    available: units.filter((unit) => unit.status === "available").length,
    reserved: units.filter((unit) => unit.status === "reserved").length,
    sold: units.filter((unit) => unit.status === "sold").length,
  };

  root.innerHTML = `
    <div class="products-layout">
      <section class="products-panel">
        <div class="section-head compact-head">
          <div>
            <p class="eyebrow">Каталог</p>
            <h2>Продукты</h2>
          </div>
        </div>
        <form class="product-form" data-product-form>
          <label>Идентификатор товара <input name="sku" required placeholder="SKU-IPHONE-15"></label>
          <label>Наименование <input name="name" list="product-name-list" required placeholder="iPhone 15 Pro"></label>
          <label>Категория <input name="category" placeholder="Смартфоны"></label>
          <label>Закупочная стоимость <input name="purchaseCost" type="number" min="0" step="any"></label>
          <button class="button primary" type="submit">Сохранить продукт</button>
        </form>
        <datalist id="product-name-list">
          ${products.map((product) => `<option value="${escapeHtml(product.name)}"></option>`).join("")}
        </datalist>
        <div class="table-scroll">
          <table class="data-table compact-list">
            <thead>
              <tr><th>ID товара</th><th>Наименование</th><th>Категория</th><th>Закупка</th><th>Остаток</th></tr>
            </thead>
            <tbody>
              ${products.map((product) => {
                const productUnits = units.filter((unit) => unit.productId === product.id);
                return `
                  <tr>
                    <td>${escapeHtml(product.sku || "")}</td>
                    <td>${escapeHtml(product.name)}</td>
                    <td>${escapeHtml(product.category || "")}</td>
                    <td>${money.format(Number(product.purchaseCost || 0))}</td>
                    <td>${productUnits.filter((unit) => unit.status === "available").length} / ${productUnits.length}</td>
                  </tr>
                `;
              }).join("") || `<tr><td colspan="5">Продукты еще не заведены</td></tr>`}
            </tbody>
          </table>
        </div>
      </section>

      <section class="products-panel">
        <div class="section-head compact-head">
          <div>
            <p class="eyebrow">Партия</p>
            <h2>Закупка единиц</h2>
          </div>
        </div>
        <form class="product-form" data-batch-form>
          <label>Продукт <input name="productName" list="product-name-list" required placeholder="Выберите или введите новый"></label>
          <label>ID товара <input name="sku" placeholder="Заполнится у нового товара"></label>
          <label>Закупочная стоимость за единицу <input name="purchaseCost" type="number" min="0" step="any" required></label>
          <label>Количество <input name="quantity" data-batch-quantity type="number" min="1" step="1" value="1" required></label>
          <label class="toggle-line wide product-batch-toggle">
            <input name="isBatch" data-batch-mode type="checkbox" checked>
            <span>Это партия</span>
          </label>
          <div class="serial-field-grid wide" data-serial-fields>
            ${serialFieldsHtml(1)}
          </div>
          <button class="button primary" type="submit">Добавить партию</button>
        </form>
        <div class="inventory-summary">
          <div><span>Доступно</span><strong>${totals.available}</strong></div>
          <div><span>В резерве</span><strong>${totals.reserved}</strong></div>
          <div><span>Продано</span><strong>${totals.sold}</strong></div>
        </div>
      </section>

      <section class="products-panel wide">
        <div class="section-head compact-head">
          <div>
            <p class="eyebrow">Единицы</p>
            <h2>Идентификационные номера</h2>
          </div>
        </div>
        <div class="table-scroll">
          <table class="data-table compact-list">
            <thead>
              <tr><th>Номер единицы</th><th>Продукт</th><th>Партия</th><th>Закупка</th><th>Статус</th><th>Сделка</th></tr>
            </thead>
            <tbody>
              ${units.map((unit) => {
                const product = productById(unit.productId);
                const deal = dealById(unit.dealId);
                return `
                  <tr>
                    <td>${escapeHtml(unit.serialNumber)}</td>
                    <td>${escapeHtml(product?.name || "")}</td>
                    <td>${escapeHtml(unit.batchId || "")}</td>
                    <td>${money.format(Number(unit.purchaseCost || 0))}</td>
                    <td>${escapeHtml(productUnitStatusLabel(unit.status))}</td>
                    <td>${deal ? escapeHtml(deal.title) : ""}</td>
                  </tr>
                `;
              }).join("") || `<tr><td colspan="6">Единицы товара еще не добавлены</td></tr>`}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  `;
}

function serialFieldsHtml(count, values = []) {
  return Array.from({ length: Math.max(1, count) }, (_, index) => `
    <label>
      ID единицы ${index + 1}
      <input name="serialNumbers" required value="${escapeHtml(values[index] || "")}" placeholder="SN-${String(index + 1).padStart(3, "0")}">
    </label>
  `).join("");
}

function syncBatchSerialFields(form) {
  if (!form) return;
  const container = form.querySelector("[data-serial-fields]");
  const quantityInput = form.querySelector("[data-batch-quantity]");
  const batchMode = form.querySelector("[data-batch-mode]");
  if (!container || !quantityInput) return;

  const currentValues = [...container.querySelectorAll('input[name="serialNumbers"]')].map((input) => input.value);
  const isBatch = batchMode?.checked !== false;
  const count = isBatch ? Math.max(1, Math.min(200, Number(quantityInput.value || 1))) : 1;
  quantityInput.disabled = !isBatch;
  quantityInput.value = String(count);
  container.innerHTML = serialFieldsHtml(count, currentValues);
}

function renderCabinet() {
  const root = document.querySelector("[data-cabinet]");
  if (!root) return;
  const user = currentUser();
  const auth = signedInUser();
  const role = userRoles.find((item) => item.id === user.role);
  const visibleUsers = cabinetVisibleUsers(user);
  const managers = visibleUsers.filter((item) => item.role === "manager");
  const period = currentPlanPeriod();
  const rows = managers.map((manager) => managerResult(manager, period));
  const managerPlan = rows.reduce((total, row) => total + row.plan, 0);
  const managerFact = rows.reduce((total, row) => total + row.fact, 0);
  const companyPlanAmount = companyPlan(period);
  const companyFactAmount = companySalesFact(period);
  const distributedPlan = managerPlansTotal(period);
  const undistributedPlan = Math.max(0, companyPlanAmount - distributedPlan);
  const totalPlan = companyPlanAmount || managerPlan;
  const totalFact = companyPlanAmount ? companyFactAmount : managerFact;
  const canManageUsers = ["leader", "vip"].includes(user.role);
  const canCreateLeader = user.role === "vip";
  const canSetCompanyPlan = ["leader", "vip"].includes(user.role);
  const canSubmitPlan = canSetCompanyPlan || managers.length;

  root.innerHTML = `
    <div class="cabinet-layout">
      <section class="cabinet-panel">
        <div class="section-head compact-head">
          <div>
            <p class="eyebrow">Текущий пользователь</p>
            <h2>${escapeHtml(user.name)}</h2>
          </div>
          <label>
            ${auth?.role === "vip" ? "Смотреть как" : "Роль"}
            ${auth?.role === "vip" ? `
              <select data-impersonate-user>
                ${state.users.map((item) => `<option value="${item.id}" ${item.id === user.id ? "selected" : ""}>${escapeHtml(item.name)} · ${escapeHtml(roleLabel(item.role))}</option>`).join("")}
              </select>
            ` : `<input value="${escapeHtml(role?.label || roleLabel(user.role))}" disabled>`}
          </label>
        </div>
        <div class="role-grid">
          ${userRoles.map((item) => `
            <div class="role-card ${item.id === user.role ? "active" : ""}">
              <strong>${escapeHtml(item.label)}</strong>
              <span>${escapeHtml(item.description)}</span>
            </div>
          `).join("")}
        </div>
      </section>

      <section class="cabinet-panel">
        <div class="section-head compact-head">
          <div>
            <p class="eyebrow">План-факт</p>
            <h2>${companyPlanAmount ? "Продажи компании" : "Продажи команды"}</h2>
          </div>
          <strong>${percent(totalFact, totalPlan)}%</strong>
        </div>
        <div class="report-summary">
          <div><span>План компании</span><strong>${money.format(companyPlanAmount)}</strong></div>
          <div><span>Факт компании</span><strong>${money.format(companyFactAmount)}</strong></div>
          <div><span>План менеджеров</span><strong>${money.format(distributedPlan)}</strong></div>
          <div><span>Можно распределить</span><strong>${money.format(undistributedPlan)}</strong></div>
        </div>
        <div class="table-scroll">
          <table class="data-table compact-list">
            <thead>
              <tr><th>Менеджер</th><th>План</th><th>Факт</th><th>Выполнение</th><th>Сделок</th></tr>
            </thead>
            <tbody>
              ${rows.map((row) => `
                <tr>
                  <td>${escapeHtml(row.user.name)}</td>
                  <td>${escapeHtml(money.format(row.plan))}</td>
                  <td>${escapeHtml(money.format(row.fact))}</td>
                  <td>${percent(row.fact, row.plan)}%</td>
                  <td>${row.deals}</td>
                </tr>
              `).join("") || `<tr><td colspan="5">Нет менеджеров в зоне видимости</td></tr>`}
            </tbody>
          </table>
        </div>
      </section>

      <section class="cabinet-panel">
        <div class="section-head compact-head">
          <div>
            <p class="eyebrow">План продаж</p>
            <h2>Быстро поставить план</h2>
          </div>
        </div>
        <form class="cabinet-form" data-plan-form>
          <label>
            Период
            <input name="period" type="month" value="${escapeHtml(period)}">
          </label>
          <label>
            Тип плана
            <select name="scope">
              ${canSetCompanyPlan ? `<option value="company">Компания</option>` : ""}
              <option value="manager">Менеджер</option>
            </select>
          </label>
          <label>
            Менеджер
            <select name="userId">
              ${canSetCompanyPlan ? `<option value="">Не требуется для компании</option>` : ""}
              ${managers.map((manager) => `<option value="${manager.id}">${escapeHtml(manager.name)}</option>`).join("")}
            </select>
          </label>
          <label>
            План, ₽
            <input name="amount" type="number" min="0" step="any" value="100000">
          </label>
          <button class="button primary" type="submit" ${canSubmitPlan ? "" : "disabled"}>Сохранить план</button>
        </form>
      </section>

      <section class="cabinet-panel">
        <div class="section-head compact-head">
          <div>
            <p class="eyebrow">Пользователи</p>
            <h2>Команда и права</h2>
          </div>
        </div>
        <div class="user-list">
          ${visibleUsers.map((item) => `
            <div class="user-row">
              <div>
                <strong>${escapeHtml(item.name)}</strong>
                <span>${escapeHtml(roleLabel(item.role))}${item.supervisorId ? ` · руководитель: ${escapeHtml(userById(item.supervisorId)?.name || "")}` : ""}</span>
              </div>
              <b>${escapeHtml(item.login || item.email || "")}</b>
            </div>
          `).join("")}
        </div>
        ${canManageUsers ? `
          <form class="cabinet-form" data-user-form>
            <label>
              Имя
              <input name="name" required>
            </label>
            <label>
              Email
              <input name="email" type="email">
            </label>
            <label>
              Логин
              <input name="login" required>
            </label>
            <label>
              Пароль
              <input name="password" type="password" value="123456" required>
            </label>
            <label>
              Роль
              <select name="role">
                <option value="manager">Менеджер</option>
                ${canCreateLeader ? `<option value="leader">Руководитель менеджеров</option>` : ""}
              </select>
            </label>
            <label>
              Руководитель
              <select name="supervisorId">
                ${cabinetSupervisorOptions(user).map((item) => `<option value="${item.id}">${escapeHtml(item.name)}</option>`).join("")}
              </select>
            </label>
            <button class="button primary" type="submit">Добавить пользователя</button>
          </form>
        ` : `<div class="empty-state">Менеджер видит только свои показатели и задачи</div>`}
      </section>
    </div>
  `;
}

function renderKanban() {
  const root = document.querySelector("[data-kanban]");
  if (!root) return;
  document.querySelectorAll("[data-kanban-board]").forEach((button) => {
    button.classList.toggle("active", button.dataset.kanbanBoard === activeKanban);
  });

  if (activeKanban === "leads") {
    root.innerHTML = leadStatuses.map((status) => kanbanColumnHtml({
      status,
      records: visibleRows("leads").filter((lead) => lead.status === status.id),
      total: "",
      empty: "Перетащите лид сюда",
      cardMapper: leadKanbanCard,
    })).join("");
    return;
  }

  if (activeKanban === "tasks") {
    root.innerHTML = taskStatuses.map((status) => kanbanColumnHtml({
      status,
      records: visibleRows("tasks").filter((task) => taskBelongsToStatus(task, status.id)),
      total: "",
      empty: "Перетащите задачу сюда",
      cardMapper: taskKanbanCard,
    })).join("");
    return;
  }

  root.innerHTML = dealStatuses.map((status) => {
    const deals = visibleRows("deals").filter((deal) => deal.status === status.id);
    const total = deals.reduce((sum, deal) => sum + Number(deal.value || 0), 0);
    return kanbanColumnHtml({
      status,
      records: deals,
      total: money.format(total),
      empty: "Перетащите сделку сюда",
      cardMapper: dealCard,
    });
  }).join("");
}

function taskBelongsToStatus(task, status) {
  if (status === "overdue") return task.status === "overdue" || (task.status !== "done" && task.dueAt && new Date(task.dueAt) < startOfToday());
  if (task.status === "overdue") return status === "overdue";
  if (task.status !== "done" && task.dueAt && new Date(task.dueAt) < startOfToday()) return false;
  return task.status === status;
}

function kanbanColumnHtml({ status, records, total, empty, cardMapper }) {
  return `
    <section class="kanban-column ${status.className || status.id}" data-status="${status.id}">
      <header class="column-head">
        <div>
          <h3>${escapeHtml(status.label)}</h3>
          ${total ? `<span>${escapeHtml(total)}</span>` : ""}
        </div>
        <strong>${records.length}</strong>
      </header>
      <div class="deal-list">
        ${records.length ? records.map(cardMapper).join("") : `<div class="empty-lane">${escapeHtml(empty)}</div>`}
      </div>
    </section>
  `;
}

function renderCurrentTable() {
  if (!tableDefs[activeScreen]) return;
  applyTableFilters(activeScreen);
}

function applyTableFilters(tableId) {
  if (!tableDefs[tableId]) return;
  tableDrillLocks[tableId] = [];
  const form = document.querySelector(`[data-filter-form="${tableId}"]`);
  if (form) {
    const nextFilters = formObject(form);
    document.querySelectorAll(`[data-column-filter="${tableId}"]`).forEach((input) => {
      nextFilters[`col_${input.dataset.columnId}`] = input.value;
    });
    tableFilters[tableId] = nextFilters;
  }
  captureConditionBuilder(tableId);
  ensureListSettings(tableId);
  listSettings[tableId].page = 1;
  saveListSettings();
  renderTableScreen(tableId);
}

function renderTableScreen(tableId) {
  const root = document.querySelector(`[data-table-screen="${tableId}"]`);
  if (!root) return;

  ensureListSettings(tableId);
  const allRows = filteredRows(tableId);
  const settings = listSettings[tableId];
  if (!settings.compact && settings.filtersHiddenByCompact) {
    settings.filtersOpen = true;
    settings.filtersHiddenByCompact = false;
  }
  const totalPages = Math.max(1, Math.ceil(allRows.length / settings.pageSize));
  settings.page = Math.min(Math.max(settings.page || 1, 1), totalPages);
  const start = (settings.page - 1) * settings.pageSize;
  const rows = allRows.slice(start, start + settings.pageSize);
  root.innerHTML = `
    ${listToolbarHtml(tableId, allRows.length, rows.length, totalPages)}
    ${!settings.compact && settings.filtersOpen ? filterPanelHtml(tableId) : ""}
    ${!settings.compact && settings.searchOpen ? columnFilterPanelHtml(tableId) : ""}
    <div class="table-layout">
      <div class="table-card">${rows.length ? tableMarkup(tableId, rows) : `<div class="empty-state">Нет записей под выбранные фильтры</div>`}</div>
    </div>
  `;
  restoreFilterValues(tableId);
}

function tableMarkup(tableId, rows) {
  return listTable(tableId, rows);
}

function listTable(tableId, rows) {
  const columns = listVisibleColumns(tableId);
  const fields = columns.map((column) => column.id);
  const headings = columns.map((column) => column.label);
  return tableHtml(tableId, rows, fields, headings, (record) => fields.map((field) => listCellHtml(tableId, record, field)));
}

function dealDetail(deal) {
  const company = companyById(deal.companyId);
  const contact = contactById(deal.contactId);
  const lead = leadById(deal.leadId);
  const tasks = relatedTasks({ dealId: deal.id, leadId: deal.leadId, contactId: deal.contactId, companyId: deal.companyId });

  return `
    <input type="hidden" name="id" value="${escapeHtml(deal.id)}">
    <div class="dialog-head record-hero">
      <div>
        <p class="eyebrow">Карточка сделки</p>
        <h2>${escapeHtml(deal.title)}</h2>
        <div class="record-hero-meta">
          <span>${escapeHtml(labelById(dealStatuses, deal.status))}</span>
          <span>${escapeHtml(company?.name || "Компания не указана")}</span>
          <span>${escapeHtml(contact?.name || "Контакт не указан")}</span>
        </div>
      </div>
      <button class="button light compact" type="button" data-dialog-close>Закрыть</button>
    </div>
    <section class="record-section">
      <div class="record-section-title">
        <h3>Основное</h3>
        <span>${escapeHtml(money.format(Number(deal.value || 0)))}</span>
      </div>
      <label class="record-title-field">
        Тема сделки
        <input name="title" value="${escapeHtml(deal.title)}" required>
      </label>
      <div class="card-field-grid">
        <label>
          Статус
          <select name="status">
            ${dealStatuses.map((status) => `<option value="${status.id}" ${status.id === deal.status ? "selected" : ""}>${escapeHtml(status.label)}</option>`).join("")}
          </select>
        </label>
        <label>
          Сумма сделки
          <input name="value" type="number" min="0" step="any" value="${escapeHtml(deal.value || 0)}">
        </label>
      </div>
      <div class="card-field-grid">
        <label>
          Источник
          <input name="source" value="${escapeHtml(deal.source || "")}">
        </label>
        <label>
          Плановая дата
          <input name="closeDate" type="date" value="${escapeHtml(deal.closeDate || "")}">
        </label>
      </div>
    </section>
    <section class="record-section">
      <div class="record-section-title">
        <h3>Следующий шаг</h3>
      </div>
      <label>
        Комментарий / запрос
        <textarea name="need" rows="4">${escapeHtml(deal.need || "")}</textarea>
      </label>
    </section>
    <section class="deal-items-panel">
      <div class="section-head compact-head">
        <div>
          <p class="eyebrow">Товары</p>
          <h3>Товары в сделке</h3>
        </div>
        <strong>${escapeHtml(money.format(dealCost(deal)))}</strong>
      </div>
      <div class="deal-items" data-deal-items>
        ${dealItemsHtml(deal)}
      </div>
      <button class="button light compact" type="button" data-add-deal-item>Добавить товар</button>
    </section>
    <div class="card-actions record-actions">
      <button class="button primary" type="submit">Сохранить сделку</button>
      <button class="button secondary" type="button" data-open-create-task data-deal-id="${deal.id}" data-lead-id="${escapeHtml(deal.leadId || "")}" data-contact-id="${escapeHtml(deal.contactId || "")}" data-company-id="${escapeHtml(deal.companyId || "")}">Поставить задачу</button>
    </div>
    <div class="record-side-grid">
      <div class="relation-list">
        <h4>Задачи</h4>
        ${tasks.map((task) => linkedLine(taskStatusLabel(task), "task", task.id, `${task.title} · ${task.dueAt ? formatDate(task.dueAt) : "без срока"}`)).join("") || `<p>Задач пока нет</p>`}
      </div>
      <div class="relation-list">
        <h4>Связи</h4>
        ${[
          company ? linkedLine("Компания", "company", company.id, company.name) : "",
          contact ? linkedLine("Контакт", "contact", contact.id, contact.name) : "",
          lead ? linkedLine("Лид", "lead", lead.id, lead.need || lead.source) : "",
        ].filter(Boolean).join("") || `<p>Связей пока нет</p>`}
      </div>
    </div>
  `;
}

function dealItemsHtml(deal) {
  const items = dealProductItems(deal);
  const rows = items.length ? items : [{ id: "", productId: "", unitId: "", quantity: 1, price: 0 }];
  return rows.map((item, index) => dealItemRowHtml(item, index, deal.id)).join("");
}

function dealItemRowHtml(item = {}, index = 0, dealId = "") {
  return `
    <div class="deal-item-row" data-deal-item-row>
      <input type="hidden" name="itemId" value="${escapeHtml(item.id || "")}">
      <label>
        Товар ${index + 1}
        <select name="itemProductId" data-deal-item-product>
          ${productSelectOptions(item.productId)}
        </select>
      </label>
      <label class="deal-unit-field">
        ID из партии
        ${dealItemUnitControlHtml(item, dealId)}
      </label>
      <label>
        Количество
        <input name="itemQuantity" type="number" min="1" step="1" value="${escapeHtml(item.quantity || 1)}">
      </label>
      <label>
        Цена продажи
        <input name="itemPrice" type="number" min="0" step="any" value="${escapeHtml(item.price || 0)}">
      </label>
      <button class="icon-button deal-item-remove" type="button" data-remove-deal-item title="Удалить товар">×</button>
    </div>
  `;
}

function dealItemUnitControlHtml(item = {}, dealId = "") {
  const unit = productUnitById(item.unitId);
  if (unit?.status === "sold") {
    return `
      <input type="hidden" name="itemUnitId" value="${escapeHtml(unit.id)}">
      <input value="${escapeHtml(`${unit.serialNumber} · ${productUnitStatusLabel(unit.status)}`)}" disabled>
    `;
  }
  return `
    <select name="itemUnitId" data-deal-item-unit ${productHasIdentifiedUnits(item.productId) ? "required" : ""}>
      ${productUnitSelectOptions({ id: dealId, productId: item.productId, productName: item.productName, productUnitIds: item.unitId ? [item.unitId] : [] })}
    </select>
  `;
}

function leadDetail(lead) {
  const company = companyById(lead.companyId);
  const contact = contactById(lead.contactId);
  const deals = visibleRows("deals").filter((deal) => deal.leadId === lead.id);
  const tasks = relatedTasks({ leadId: lead.id, contactId: lead.contactId, companyId: lead.companyId });

  return `
    <input type="hidden" name="id" value="${escapeHtml(lead.id)}">
    <div class="dialog-head record-hero">
      <div>
        <p class="eyebrow">Карточка лида</p>
        <h2>${escapeHtml(lead.need || "Лид без запроса")}</h2>
        <div class="record-hero-meta">
          <span>${escapeHtml(leadStatusLabel(lead))}</span>
          <span>${escapeHtml(company?.name || "Компания не указана")}</span>
          <span>${escapeHtml(contact?.name || "Контакт не указан")}</span>
        </div>
      </div>
      <button class="button light compact" type="button" data-dialog-close>Закрыть</button>
    </div>
    <section class="record-section">
      <div class="record-section-title">
        <h3>Обработка лида</h3>
        <span>${escapeHtml(formatDate(lead.createdAt))}</span>
      </div>
      <div class="card-field-grid">
        <label>
          Статус лида
          <select name="status">
            ${leadStatuses.map((status) => `<option value="${status.id}" ${status.id === lead.status ? "selected" : ""}>${escapeHtml(status.label)}</option>`).join("")}
          </select>
        </label>
        <label>
          Причина дисквалификации
          <select name="disqualificationReason">
            <option value="">Не выбрана</option>
            ${leadDisqualificationReasons.map((reason) => `<option value="${escapeHtml(reason)}" ${reason === lead.disqualificationReason ? "selected" : ""}>${escapeHtml(reason)}</option>`).join("")}
          </select>
        </label>
      </div>
      <label>
        Источник
        <input name="source" value="${escapeHtml(lead.source || "")}">
      </label>
    </section>
    <section class="record-section">
      <div class="record-section-title">
        <h3>Запрос клиента</h3>
      </div>
      <label>
        Описание
        <textarea name="need" rows="4">${escapeHtml(lead.need || "")}</textarea>
      </label>
    </section>
    <div class="card-actions record-actions">
      <button class="button primary" type="submit">Сохранить лид</button>
      ${lead.status === "disqualified" ? "" : `<button class="button secondary" type="button" data-convert-lead="${lead.id}">Создать сделку</button>`}
    </div>
    <div class="record-side-grid">
      <dl class="detail-list compact">
        <div>
          <dt>Создан</dt>
          <dd>${escapeHtml(formatDate(lead.createdAt))}</dd>
        </div>
        <div>
          <dt>Текущий статус</dt>
          <dd>${escapeHtml(leadStatusLabel(lead))}</dd>
        </div>
      </dl>
      <div class="relation-list">
        <h4>Связи</h4>
        ${[
            company ? linkedLine("Компания", "company", company.id, company.name) : "",
            contact ? linkedLine("Контакт", "contact", contact.id, contact.name) : "",
            ...deals.map((deal) => linkedLine("Сделка", "deal", deal.id, deal.title)),
            ...tasks.map((task) => linkedLine("Задача", "task", task.id, task.title)),
          ].filter(Boolean).join("") || `<p>Связей пока нет</p>`}
      </div>
    </div>
  `;
}

function contactDetail(contact) {
  const company = companyById(contact.companyId);
  const deals = visibleRows("deals").filter((deal) => deal.contactId === contact.id);
  const leads = visibleRows("leads").filter((lead) => lead.contactId === contact.id);
  const tasks = relatedTasks({ contactId: contact.id, companyId: contact.companyId });

  return `
    <input type="hidden" name="id" value="${escapeHtml(contact.id)}">
    <div class="dialog-head">
      <div>
        <p class="eyebrow">Карточка контакта</p>
        <h2>${escapeHtml(contact.name)}</h2>
      </div>
      <button class="button light compact" type="button" data-dialog-close>Закрыть</button>
    </div>
    <label>
      Имя контакта
      <input name="name" value="${escapeHtml(contact.name)}" required>
    </label>
    <div class="card-field-grid">
      <label>
        Компания
        <select name="companyId">
          ${visibleRows("companies").map((item) => `<option value="${item.id}" ${item.id === contact.companyId ? "selected" : ""}>${escapeHtml(item.name)}</option>`).join("")}
        </select>
      </label>
      <label>
        Роль
        <input name="role" value="${escapeHtml(contact.role || "")}">
      </label>
    </div>
    <div class="card-field-grid">
      <label>
        Телефон
        <input name="phone" value="${escapeHtml(contact.phone || "")}">
      </label>
      <label>
        Email
        <input name="email" type="email" value="${escapeHtml(contact.email || "")}">
      </label>
    </div>
    <div class="card-field-grid">
      <label>
        Пол
        <select name="gender">
          ${["", "Женский", "Мужской"].map((value) => `<option value="${escapeHtml(value)}" ${value === (contact.gender || "") ? "selected" : ""}>${escapeHtml(value || "Не указан")}</option>`).join("")}
        </select>
      </label>
      <label>
        Возраст
        <input name="age" type="number" min="0" max="120" value="${escapeHtml(contact.age || "")}">
      </label>
    </div>
    <div class="card-field-grid">
      <label>
        Интерес
        <input name="interest" value="${escapeHtml(contact.interest || "")}">
      </label>
      <label>
        Гео
        <input name="geo" value="${escapeHtml(contact.geo || company?.city || "")}">
      </label>
    </div>
    <div class="card-field-grid">
      <label>
        Лояльность
        <input name="loyaltyTier" value="${escapeHtml(contact.loyaltyTier || "")}">
      </label>
      <label>
        Менеджер
        <input name="manager" value="${escapeHtml(contact.manager || "")}">
      </label>
    </div>
    <div class="card-field-grid">
      <label>
        NPS
        <input name="nps" type="number" min="0" max="10" value="${escapeHtml(contact.nps || "")}">
      </label>
      <label>
        CSAT
        <input name="csat" type="number" min="0" max="5" value="${escapeHtml(contact.csat || "")}">
      </label>
    </div>
    <button class="button primary" type="submit">Сохранить контакт</button>
    <div class="relation-list">
      <h4>Связи</h4>
      ${[
        company ? linkedLine("Компания", "company", company.id, company.name) : "",
        ...deals.map((deal) => linkedLine("Сделка", "deal", deal.id, deal.title)),
        ...leads.map((lead) => linkedLine("Лид", "lead", lead.id, lead.need || lead.source)),
        ...tasks.map((task) => linkedLine("Задача", "task", task.id, task.title)),
      ].filter(Boolean).join("") || `<p>Связей пока нет</p>`}
    </div>
  `;
}

function companyDetail(company) {
  const contacts = visibleRows("contacts").filter((contact) => contact.companyId === company.id);
  const deals = visibleRows("deals").filter((deal) => deal.companyId === company.id);
  const tasks = relatedTasks({ companyId: company.id });
  const total = deals.reduce((sum, deal) => sum + Number(deal.value || 0), 0);

  return `
    <input type="hidden" name="id" value="${escapeHtml(company.id)}">
    <div class="dialog-head">
      <div>
        <p class="eyebrow">Карточка компании</p>
        <h2>${escapeHtml(company.name)}</h2>
      </div>
      <button class="button light compact" type="button" data-dialog-close>Закрыть</button>
    </div>
    <label>
      Название
      <input name="name" value="${escapeHtml(company.name)}" required>
    </label>
    <div class="card-field-grid">
      <label>
        Сегмент
        <input name="segment" value="${escapeHtml(company.segment || "")}">
      </label>
      <label>
        Отрасль
        <input name="industry" value="${escapeHtml(company.industry || "")}">
      </label>
    </div>
    <div class="card-field-grid">
      <label>
        Город
        <input name="city" value="${escapeHtml(company.city || "")}">
      </label>
      <label>
        Телефон
        <input name="phone" value="${escapeHtml(company.phone || "")}">
      </label>
    </div>
    <label>
      Email
      <input name="email" type="email" value="${escapeHtml(company.email || "")}">
    </label>
    <dl class="detail-list compact">
      <div>
        <dt>Контактов</dt>
        <dd>${contacts.length}</dd>
      </div>
      <div>
        <dt>Сделок</dt>
        <dd>${deals.length}</dd>
      </div>
      <div>
        <dt>Сумма сделок</dt>
        <dd>${escapeHtml(money.format(total))}</dd>
      </div>
    </dl>
    <button class="button primary" type="submit">Сохранить компанию</button>
    <div class="relation-list">
      <h4>Связи</h4>
      ${[
        ...contacts.map((contact) => linkedLine("Контакт", "contact", contact.id, contact.name)),
        ...deals.map((deal) => linkedLine("Сделка", "deal", deal.id, deal.title)),
        ...tasks.map((task) => linkedLine("Задача", "task", task.id, task.title)),
      ].filter(Boolean).join("") || `<p>Связей пока нет</p>`}
    </div>
  `;
}

function taskDetail(task) {
  const deal = dealById(task.dealId);
  const lead = leadById(task.leadId);
  const contact = contactById(task.contactId);
  const company = companyById(task.companyId);
  return `
    <input type="hidden" name="id" value="${escapeHtml(task.id)}">
    <div class="dialog-head">
      <div>
        <p class="eyebrow">Карточка задачи</p>
        <h2>${escapeHtml(task.title)}</h2>
      </div>
      <button class="button light compact" type="button" data-dialog-close>Закрыть</button>
    </div>
    <label>
      Задача
      <input name="title" value="${escapeHtml(task.title)}" required>
    </label>
    <div class="card-field-grid">
      <label>
        Статус
        <select name="status">
          ${taskStatuses.map((status) => `<option value="${status.id}" ${status.id === task.status ? "selected" : ""}>${escapeHtml(status.label)}</option>`).join("")}
        </select>
      </label>
      <label>
        Менеджер
        ${taskManagerSelectHtml(task.manager)}
      </label>
    </div>
    <div class="card-field-grid">
      <label>
        Срок выполнения
        <input name="dueAt" type="date" value="${escapeHtml(task.dueAt || "")}">
      </label>
      <label>
        Напомнить
        <input name="reminderAt" type="date" value="${escapeHtml(task.reminderAt || "")}">
      </label>
    </div>
    <div class="card-field-grid">
      <label>
        Сделка
        <select name="dealId">${optionList("Без сделки", visibleRows("deals").map((item) => ({ id: item.id, label: item.title }))).replace(`value="${task.dealId}"`, `value="${task.dealId}" selected`)}</select>
      </label>
      <label>
        Лид
        <select name="leadId">${optionList("Без лида", visibleRows("leads").map((item) => ({ id: item.id, label: item.need || item.source }))).replace(`value="${task.leadId}"`, `value="${task.leadId}" selected`)}</select>
      </label>
    </div>
    <div class="card-field-grid">
      <label>
        Контакт
        <select name="contactId">${optionList("Без контакта", visibleRows("contacts").map((item) => ({ id: item.id, label: item.name }))).replace(`value="${task.contactId}"`, `value="${task.contactId}" selected`)}</select>
      </label>
      <label>
        Компания
        <select name="companyId">${optionList("Без компании", visibleRows("companies").map((item) => ({ id: item.id, label: item.name }))).replace(`value="${task.companyId}"`, `value="${task.companyId}" selected`)}</select>
      </label>
    </div>
    <label>
      Описание
      <textarea name="description" rows="4">${escapeHtml(task.description || "")}</textarea>
    </label>
    <button class="button primary" type="submit">Сохранить задачу</button>
    <div class="relation-list">
      <h4>Связи</h4>
      ${[
        deal ? linkedLine("Сделка", "deal", deal.id, deal.title) : "",
        lead ? linkedLine("Лид", "lead", lead.id, lead.need || lead.source) : "",
        contact ? linkedLine("Контакт", "contact", contact.id, contact.name) : "",
        company ? linkedLine("Компания", "company", company.id, company.name) : "",
      ].filter(Boolean).join("") || `<p>Связей пока нет</p>`}
    </div>
  `;
}

function syncCreateDealCompany(form) {
  if (!form) return;
  const contactSelect = form.querySelector("[data-create-deal-contact]");
  const companySelect = form.querySelector("[data-create-deal-company]");
  if (!contactSelect || !companySelect) return;

  const contact = contactById(contactSelect.value);
  if (!contact?.companyId) return;
  companySelect.value = contact.companyId;
}

function refreshDealItemUnits(row) {
  if (!row) return;
  const product = productById(row.querySelector("[data-deal-item-product]")?.value);
  const unitSelect = row.querySelector("[data-deal-item-unit]");
  const dealId = row.closest("[data-deal-card-form]")?.querySelector('[name="id"]')?.value || "";
  if (!unitSelect) return;
  unitSelect.required = productHasIdentifiedUnits(product?.id);
  unitSelect.innerHTML = productUnitSelectOptions({
    id: dealId,
    productId: product?.id || "",
    productName: product?.name || "",
    productUnitIds: [],
  });
}

function appendDealItemRow(form) {
  const container = form?.querySelector("[data-deal-items]");
  if (!container) return;
  const index = container.querySelectorAll("[data-deal-item-row]").length;
  const dealId = form.querySelector('[name="id"]')?.value || "";
  container.insertAdjacentHTML("beforeend", dealItemRowHtml({ quantity: 1, price: 0 }, index, dealId));
}

function removeDealItemRow(row) {
  const container = row?.closest("[data-deal-items]");
  if (!row || !container) return;
  row.remove();
  if (!container.querySelector("[data-deal-item-row]")) {
    container.innerHTML = dealItemRowHtml({ quantity: 1, price: 0 }, 0, container.closest("[data-deal-card-form]")?.querySelector('[name="id"]')?.value || "");
  }
}

function openRecordDialog(type, id) {
  const dialog = document.querySelector("[data-dialog]");
  const form = document.querySelector("[data-dialog-form]");
  const record = getRecord(type, id);
  if (!dialog || !form || !record || !canAccessRecord(type, record)) return;

  prepareDialogForm(form);
  form.classList.add("record-card-form");
  dialog.classList.toggle("object-record-dialog", ["deal", "lead"].includes(type));

  if (type === "deal") {
    form.dataset.dealCardForm = "";
    form.innerHTML = dealDetail(record);
  }

  if (type === "lead") {
    form.dataset.leadCardForm = "";
    form.innerHTML = leadDetail(record);
  }

  if (type === "contact") {
    form.dataset.contactCardForm = "";
    form.innerHTML = contactDetail(record);
  }

  if (type === "company") {
    form.dataset.companyCardForm = "";
    form.innerHTML = companyDetail(record);
  }

  if (type === "task") {
    form.dataset.taskCardForm = "";
    form.innerHTML = taskDetail(record);
  }

  if (!dialog.open) dialog.showModal();
}

function filteredRows(tableId) {
  const filters = getFilters(tableId);
  const lockedIds = new Set(tableDrillLocks[tableId] || []);
  const sourceRows = visibleRows(tableId).filter((row) => !lockedIds.size || lockedIds.has(row.id));
  return sortRows(tableId, sourceRows.filter((row) => passesFilters(tableId, row, filters)));
}

function passesFilters(tableId, row, filters) {
  const text = searchText(tableId, row).toLowerCase();
  const value = Number(row.value || 0);

  if (filters.query && !text.includes(filters.query.toLowerCase())) return false;
  if (filters.status && row.status !== filters.status) return false;
  if (filters.source && row.source !== filters.source) return false;
  if (filters.companyId && !rowMatchesCompany(tableId, row, filters.companyId)) return false;
  if (filters.contactId && !rowMatchesContact(tableId, row, filters.contactId)) return false;
  if (filters.minValue && tableId === "deals" && value < Number(filters.minValue)) return false;
  if (filters.maxValue && tableId === "deals" && value > Number(filters.maxValue)) return false;
  if (!passesColumnFilters(tableId, row, filters)) return false;
  if (!passesConditionBuilder(tableId, row)) return false;

  return true;
}

function rowMatchesCompany(tableId, row, companyId) {
  if (tableId === "companies") return row.id === companyId;
  return row.companyId === companyId;
}

function rowMatchesContact(tableId, row, contactId) {
  if (tableId === "contacts") return row.id === contactId;
  if (tableId === "companies") return state.contacts.some((contact) => contact.id === contactId && contact.companyId === row.id);
  return row.contactId === contactId;
}

function searchText(tableId, row) {
  const company = companyById(row.companyId);
  const contact = contactById(row.contactId);

  if (tableId === "companies") return [row.name, row.segment, row.industry, row.city, row.phone, row.email].join(" ");
  if (tableId === "contacts") return [row.name, row.role, row.phone, row.email, company?.name].join(" ");
  if (tableId === "leads") return [row.need, row.source, leadStatusLabel(row), row.disqualificationReason, company?.name, contact?.name, contact?.phone, contact?.email].join(" ");
  if (tableId === "tasks") return [row.title, row.manager, taskStatusLabel(row), row.dueAt, row.reminderAt, row.description, dealById(row.dealId)?.title, leadById(row.leadId)?.need, company?.name, contact?.name].join(" ");
  return [row.title, row.source, row.status, row.need, dealProductsLabel(row), company?.name, contact?.name, contact?.phone, contact?.email].join(" ");
}

function filterPanelHtml(tableId) {
  const builder = conditionBuilders[tableId] || defaultConditionBuilder();
  const conditions = builder.conditions.length ? builder.conditions : [defaultCondition(tableId)];
  const presets = builder.presets || [];
  return `
    <section class="condition-builder" data-condition-builder="${tableId}">
      <div class="condition-builder-top">
        <div>
          <p class="eyebrow">Конструктор условий</p>
          <h2>Фильтр по полям и связям</h2>
        </div>
        <label>
          Сохраненные фильтры
          <select data-filter-preset="${tableId}">
            <option value="">Выбрать</option>
            ${presets.map((preset) => `<option value="${escapeHtml(preset.name)}">${escapeHtml(preset.name)}</option>`).join("")}
          </select>
        </label>
      </div>
      <div class="condition-breadcrumbs">
        ${conditionBreadcrumbs(tableId)}
      </div>
      <div class="condition-rows">
        ${conditions.map((condition, index) => conditionRowHtml(tableId, condition, index)).join("")}
      </div>
      <div class="condition-actions">
        <button class="button primary" type="button" data-apply-filters="${tableId}">Применить</button>
        <button class="button secondary" type="button" data-add-condition="${tableId}">Добавить условие</button>
        <button class="button light" type="button" data-save-filter="${tableId}">Сохранить фильтр</button>
        <button class="button light" type="button" data-clear-filters>Очистить все</button>
      </div>
    </section>
  `;
}

function listToolbarHtml(tableId, totalRows, visibleRows, totalPages) {
  const settings = listSettings[tableId];
  const selected = selectedRows[tableId]?.length || 0;
  const start = totalRows ? (settings.page - 1) * settings.pageSize + 1 : 0;
  const end = totalRows ? start + visibleRows - 1 : 0;
  return `
    <section class="list-toolbar">
      <div class="list-toolbar-main">
        <button class="icon-button ${settings.filtersOpen ? "active" : ""}" type="button" data-list-action="toggle-filters" data-list-table="${tableId}" title="Конструктор условий">⌯</button>
        <button class="icon-button ${settings.searchOpen ? "active" : ""}" type="button" data-list-action="toggle-search" data-list-table="${tableId}" title="Поиск по колонкам">⌕</button>
        <button class="icon-button ${settings.compact ? "active" : ""}" type="button" data-list-action="toggle-compact" data-list-table="${tableId}" title="Компактный список">≡</button>
        <button class="icon-button" type="button" data-list-action="settings" data-list-table="${tableId}" title="Настроить колонки">⚙</button>
        <button class="button light compact" type="button" data-list-action="report" data-list-table="${tableId}">Отчет</button>
        ${selected ? `<button class="button light compact danger" type="button" data-list-action="delete-selected" data-list-table="${tableId}">Удалить выбранные: ${selected}</button>` : ""}
      </div>
      <div class="list-toolbar-pages">
        <span>${start}-${end} из ${totalRows}</span>
        <select data-list-page-size="${tableId}" aria-label="Количество записей на странице">
          ${[10, 25, 50, 100].map((size) => `<option value="${size}" ${settings.pageSize === size ? "selected" : ""}>${size}</option>`).join("")}
        </select>
        <button class="icon-button" type="button" data-list-action="prev-page" data-list-table="${tableId}" ${settings.page <= 1 ? "disabled" : ""}>‹</button>
        <span>${settings.page}/${totalPages}</span>
        <button class="icon-button" type="button" data-list-action="next-page" data-list-table="${tableId}" ${settings.page >= totalPages ? "disabled" : ""}>›</button>
      </div>
    </section>
  `;
}

function columnFilterPanelHtml(tableId) {
  const filters = getFilters(tableId);
  return `
    <section class="column-filter-panel">
      <div class="column-filter-grid">
        ${listVisibleColumns(tableId).map((column) => `
          <label>
            ${escapeHtml(column.label)}
            <input data-column-filter="${tableId}" data-column-id="${column.id}" value="${escapeHtml(filters[`col_${column.id}`] || "")}" placeholder="Поиск">
          </label>
        `).join("")}
      </div>
      <div class="condition-actions">
        <button class="button primary" type="button" data-apply-filters="${tableId}">Применить</button>
      </div>
    </section>
  `;
}

function listCellHtml(tableId, record, field) {
  const column = tableColumns(tableId).find((item) => item.id === field);
  const value = column ? column.value(record) : record[field];
  if (field === "title" && tableId === "tasks") return recordButton("task", record.id, record.title);
  if (field === "title") return recordButton("deal", record.id, record.title);
  if (field === "need") return recordButton("lead", record.id, record.need || "Лид без запроса");
  if (field === "name") return recordButton(tableDefs[tableId].recordType, record.id, record.name);
  if (field === "company") {
    const company = companyById(record.companyId);
    return company ? recordButton("company", company.id, company.name) : "";
  }
  if (field === "contact") {
    const contact = contactById(record.contactId);
    return contact ? recordButton("contact", contact.id, contact.name) : "";
  }
  if (field === "deal") {
    const deal = dealById(record.dealId);
    return deal ? recordButton("deal", deal.id, deal.title) : "";
  }
  if (field === "lead") {
    const lead = leadById(record.leadId);
    return lead ? recordButton("lead", lead.id, lead.need || lead.source) : "";
  }
  if (field === "status" && tableId === "deals") return statusSelect(record);
  if (field === "status" && tableId === "leads") return escapeHtml(leadStatusLabel(record));
  if (field === "status" && tableId === "tasks") return escapeHtml(taskStatusLabel(record));
  if (field === "value" || moneyFields().includes(field)) return money.format(Number(value || 0));
  if (String(field).toLowerCase().includes("date") || String(field).endsWith("At")) return value ? escapeHtml(formatDate(value)) : "";
  return escapeHtml(value);
}

function handleListAction(action, tableId) {
  if (!tableDefs[tableId]) return;
  ensureListSettings(tableId);
  const settings = listSettings[tableId];

  if (action === "toggle-filters") settings.filtersOpen = !settings.filtersOpen;
  if (action === "toggle-search") settings.searchOpen = !settings.searchOpen;
  if (action === "toggle-compact") {
    settings.compact = !settings.compact;
    settings.compactTouched = true;
    if (settings.compact) {
      settings.filtersHiddenByCompact = true;
      settings.filtersOpen = false;
      settings.searchOpen = false;
    } else {
      settings.filtersOpen = true;
      settings.filtersHiddenByCompact = false;
    }
  }
  if (action === "settings") return openListSettingsDialog(tableId);
  if (action === "report") return createReportFromTable(tableId);
  if (action === "prev-page") settings.page = Math.max(1, settings.page - 1);
  if (action === "next-page") settings.page += 1;
  if (action === "delete-selected") {
    deleteSelectedRows(tableId);
    return;
  }

  saveListSettings();
  renderTableScreen(tableId);
}

function openListSettingsDialog(tableId) {
  const dialog = document.querySelector("[data-dialog]");
  const form = document.querySelector("[data-dialog-form]");
  if (!dialog || !form) return;
  prepareDialogForm(form);
  const visible = listVisibleColumns(tableId).map((column) => column.id);
  form.dataset.listSettingsForm = "";
  form.innerHTML = `
    <input type="hidden" name="table" value="${escapeHtml(tableId)}">
    <div class="dialog-head">
      <div>
        <p class="eyebrow">Настройка списка</p>
        <h2>${escapeHtml(tableDefs[tableId].label)}</h2>
      </div>
      <button class="button light compact" type="button" data-dialog-close>Закрыть</button>
    </div>
    <div class="list-settings-columns">
      ${tableColumns(tableId).map((column) => `
        <label>
          <input type="checkbox" name="columns" value="${column.id}" ${visible.includes(column.id) ? "checked" : ""}>
          <span>${escapeHtml(column.label)}</span>
        </label>
      `).join("")}
    </div>
    <button class="button primary" type="submit">Применить колонки</button>
  `;
  if (!dialog.open) dialog.showModal();
}

function saveListSettingsForm(form) {
  const data = new FormData(form);
  const table = data.get("table");
  if (!tableDefs[table]) return;
  ensureListSettings(table);
  const columns = data.getAll("columns").filter((field) => tableColumns(table).some((column) => column.id === field));
  listSettings[table].visibleColumns = columns.length ? columns : defaultListColumns(table);
  saveListSettings();
  document.querySelector("[data-dialog]")?.close();
  renderTableScreen(table);
}

function toggleRowSelection(tableId, id, checked) {
  selectedRows[tableId] ||= [];
  selectedRows[tableId] = checked
    ? unique([...selectedRows[tableId], id])
    : selectedRows[tableId].filter((item) => item !== id);
}

function toggleVisibleSelection(tableId, checked) {
  const ids = pagedRows(tableId).map((row) => row.id).filter(Boolean);
  selectedRows[tableId] = checked ? unique([...(selectedRows[tableId] || []), ...ids]) : (selectedRows[tableId] || []).filter((id) => !ids.includes(id));
}

function deleteSelectedRows(tableId) {
  const selected = selectedRows[tableId] || [];
  if (!selected.length) return;
  const confirmDelete = window.confirm(`Удалить выбранные записи: ${selected.length}?`);
  if (!confirmDelete) return;
  state[tableId] = state[tableId].filter((row) => !selected.includes(row.id));
  selectedRows[tableId] = [];
  saveState();
  render();
}

function pagedRows(tableId) {
  ensureListSettings(tableId);
  const rows = filteredRows(tableId);
  const settings = listSettings[tableId];
  const start = (settings.page - 1) * settings.pageSize;
  return rows.slice(start, start + settings.pageSize);
}

function listVisibleColumns(tableId) {
  ensureListSettings(tableId);
  const columns = tableColumns(tableId);
  const visible = listSettings[tableId].visibleColumns?.length ? listSettings[tableId].visibleColumns : defaultListColumns(tableId);
  const visibleColumns = visible.map((id) => columns.find((column) => column.id === id)).filter(Boolean);
  return visibleColumns.length ? visibleColumns : columns.slice(0, 6);
}

function defaultListColumns(tableId) {
  return tableColumns(tableId).slice(0, tableId === "companies" ? 6 : 5).map((column) => column.id);
}

function ensureListSettings(tableId) {
  listSettings[tableId] ||= defaultListSetting(tableId);
  if (!listSettings[tableId].compactTouched) {
    listSettings[tableId].compact = true;
    listSettings[tableId].filtersOpen = false;
    listSettings[tableId].searchOpen = false;
  }
  listSettings[tableId].pageSize ||= 10;
  listSettings[tableId].page ||= 1;
  listSettings[tableId].visibleColumns ||= defaultListColumns(tableId);
  listSettings[tableId].filtersHiddenByCompact ||= false;
  listSettings[tableId].compactTouched ||= false;
}

function startInlineEdit(cell) {
  const table = cell.dataset.cellTable;
  const field = cell.dataset.cellField;
  const row = cell.closest("tr");
  const id = row?.querySelector("[data-row-select]")?.value;
  const record = getRecord(tableDefs[table]?.recordType, id);
  if (!record || !editableFields(table).includes(field)) return;

  const value = inlineRawValue(table, record, field);
  cell.innerHTML = `
    <div class="inline-editor" data-inline-editor data-inline-table="${table}" data-inline-id="${escapeHtml(id)}" data-inline-field="${field}">
      ${inlineEditorControl(table, field, value)}
      <button class="inline-apply" type="button" data-inline-save>✓</button>
      <button class="inline-cancel" type="button" data-inline-cancel data-inline-table="${table}">×</button>
    </div>
  `;
  cell.querySelector("input, select, textarea")?.focus();
}

function saveInlineEdit(editor) {
  if (!editor) return;
  const table = editor.dataset.inlineTable;
  const id = editor.dataset.inlineId;
  const field = editor.dataset.inlineField;
  const record = state[table]?.find((item) => item.id === id);
  if (!record || !canAccessRecord(table, record) || !editableFields(table).includes(field)) return;

  const control = editor.querySelector("[data-inline-value]");
  const value = control?.value || "";
  if (table === "deals" && field === "status" && !canSetDealStatus(record, value)) {
    renderTableScreen(table);
    return;
  }
  applyInlineValue(table, record, field, value);
  if (table === "deals" && field === "status") {
    syncProductUnitsForDeal(record, dealSelectedUnitIds(record));
    if (record.status === "won" && !record.paidAt) record.paidAt = new Date().toISOString();
  }
  if ("updatedAt" in record) record.updatedAt = new Date().toISOString();
  saveState();
  renderTableScreen(table);
}

function editableFields(table) {
  return {
    deals: ["title", "status", "value", "source", "closeDate", "need"],
    leads: ["need", "status", "source", "disqualificationReason"],
    tasks: ["title", "status", "manager", "dueAt", "reminderAt", "description"],
    contacts: ["name", "role", "phone", "email"],
    companies: ["name", "segment", "industry", "city", "phone", "email"],
  }[table] || [];
}

function inlineRawValue(table, record, field) {
  if (field === "company") return companyById(record.companyId)?.name || "";
  if (field === "contact") return contactById(record.contactId)?.name || "";
  return record[field] || "";
}

function inlineEditorControl(table, field, value) {
  if (field === "status" && table === "deals") {
    return `<select data-inline-value>${dealStatuses.map((status) => `<option value="${status.id}" ${status.id === value ? "selected" : ""}>${escapeHtml(status.label)}</option>`).join("")}</select>`;
  }
  if (field === "status" && table === "leads") {
    return `<select data-inline-value>${leadStatuses.map((status) => `<option value="${status.id}" ${status.id === value ? "selected" : ""}>${escapeHtml(status.label)}</option>`).join("")}</select>`;
  }
  if (field === "status" && table === "tasks") {
    return `<select data-inline-value>${taskStatuses.map((status) => `<option value="${status.id}" ${status.id === value ? "selected" : ""}>${escapeHtml(status.label)}</option>`).join("")}</select>`;
  }
  if (field === "disqualificationReason") {
    return `<select data-inline-value><option value="">Не выбрана</option>${leadDisqualificationReasons.map((reason) => `<option value="${escapeHtml(reason)}" ${reason === value ? "selected" : ""}>${escapeHtml(reason)}</option>`).join("")}</select>`;
  }
  const type = field === "value" ? "number" : field === "closeDate" ? "date" : "text";
  const step = field === "value" ? ` step="any"` : "";
  return `<input data-inline-value type="${type}"${step} value="${escapeHtml(value)}">`;
}

function applyInlineValue(table, record, field, value) {
  if (field === "value") {
    record[field] = Math.max(0, Number(value || 0));
    return;
  }
  record[field] = clean(value);
  if (table === "leads" && field === "status" && value !== "disqualified") record.disqualificationReason = "";
}

function tableColumns(tableId) {
  const common = {
    deals: [
      ["title", "Сделка", (deal) => deal.title],
      ["company", "Компания", (deal) => companyById(deal.companyId)?.name],
      ["contact", "Контакт", (deal) => contactById(deal.contactId)?.name],
      ["status", "Статус", (deal) => labelById(dealStatuses, deal.status)],
      ["productName", "Продукты", (deal) => dealProductsLabel(deal) || deal.productName],
      ["value", "Сумма", (deal) => String(deal.value || 0)],
      ["cost", "Себестоимость", (deal) => String(dealCost(deal))],
      ["source", "Источник", (deal) => deal.source],
    ],
    leads: [
      ["need", "Запрос", (lead) => lead.need],
      ["company", "Компания", (lead) => companyById(lead.companyId)?.name],
      ["contact", "Контакт", (lead) => contactById(lead.contactId)?.name],
      ["status", "Статус", (lead) => leadStatusLabel(lead)],
      ["source", "Источник", (lead) => lead.source],
      ["disqualificationReason", "Причина дисквалификации", (lead) => lead.disqualificationReason],
    ],
    tasks: [
      ["title", "Задача", (task) => task.title],
      ["status", "Статус", (task) => taskStatusLabel(task)],
      ["manager", "Менеджер", (task) => task.manager],
      ["dueAt", "Срок", (task) => task.dueAt],
      ["reminderAt", "Напомнить", (task) => task.reminderAt],
      ["deal", "Сделка", (task) => dealById(task.dealId)?.title],
      ["contact", "Контакт", (task) => contactById(task.contactId)?.name],
      ["company", "Компания", (task) => companyById(task.companyId)?.name],
    ],
    contacts: [
      ["name", "Контакт", (contact) => contact.name],
      ["company", "Компания", (contact) => companyById(contact.companyId)?.name],
      ["role", "Роль", (contact) => contact.role],
      ["phone", "Телефон", (contact) => contact.phone],
      ["email", "Email", (contact) => contact.email],
      ["deals", "Сделок", (contact) => String(visibleRows("deals").filter((deal) => deal.contactId === contact.id).length)],
    ],
    companies: [
      ["name", "Компания", (company) => company.name],
      ["segment", "Сегмент", (company) => company.segment],
      ["city", "Город", (company) => company.city],
      ["contacts", "Контакты", (company) => String(visibleRows("contacts").filter((contact) => contact.companyId === company.id).length)],
      ["deals", "Сделки", (company) => String(visibleRows("deals").filter((deal) => deal.companyId === company.id).length)],
      ["value", "Сумма", (company) => String(visibleRows("deals").filter((deal) => deal.companyId === company.id).reduce((sum, deal) => sum + Number(deal.value || 0), 0))],
    ],
  };

  return common[tableId].map(([id, label, value]) => ({ id, label, value }));
}

function passesColumnFilters(tableId, row, filters) {
  return tableColumns(tableId).every((column) => {
    const query = clean(filters[`col_${column.id}`]).toLowerCase();
    if (!query) return true;
    return clean(column.value(row)).toLowerCase().includes(query);
  });
}

function toggleTableSort(tableId, field) {
  if (!tableDefs[tableId] || !field) return;
  const current = tableSorts[tableId] || { field: "", direction: "" };

  if (current.field !== field) {
    tableSorts[tableId] = { field, direction: "asc" };
  } else if (current.direction === "asc") {
    tableSorts[tableId] = { field, direction: "desc" };
  } else if (current.direction === "desc") {
    tableSorts[tableId] = { field: "", direction: "" };
  } else {
    tableSorts[tableId] = { field, direction: "asc" };
  }

  renderTableScreen(tableId);
}

function sortRows(tableId, rows) {
  const sort = tableSorts[tableId] || { field: "", direction: "" };
  if (!sort.field || !sort.direction) return rows;

  const column = tableColumns(tableId).find((item) => item.id === sort.field);
  if (!column) return rows;

  return rows.slice().sort((a, b) => {
    const left = column.value(a);
    const right = column.value(b);
    const result = compareValues(left, right);
    return sort.direction === "desc" ? -result : result;
  });
}

function compareValues(left, right) {
  const leftNumber = Number(left);
  const rightNumber = Number(right);

  if (left !== "" && right !== "" && !Number.isNaN(leftNumber) && !Number.isNaN(rightNumber)) {
    return leftNumber - rightNumber;
  }

  return clean(left).localeCompare(clean(right), "ru", { numeric: true, sensitivity: "base" });
}

function toggleGroupMenu(tableId, field) {
  if (!tableGroups[tableId]) return;
  tableGroups[tableId].menuField = tableGroups[tableId].menuField === field ? "" : field;
  renderTableScreen(tableId);
}

function handleGroupAction(tableId, action, field) {
  const group = tableGroups[tableId];
  if (!group) return;

  if (action === "group") {
    group.field = field;
    group.collapsed = {};
    group.menuField = "";
  }

  if (action === "ungroup") {
    group.field = "";
    group.collapsed = {};
    group.menuField = "";
  }

  if (action === "collapse") {
    group.field ||= field;
    const column = tableColumns(tableId).find((item) => item.id === group.field);
    group.collapsed = {};
    if (column) {
      filteredRows(tableId).forEach((record) => {
        group.collapsed[clean(column.value(record)) || "Не указано"] = true;
      });
    }
    group.menuField = "";
  }

  if (action === "expand") {
    group.collapsed = {};
    group.menuField = "";
  }

  if (action.startsWith("sort-")) {
    group.field ||= field;
    group.sort = action.replace("sort-", "");
    group.menuField = "";
  }

  renderTableScreen(tableId);
}

function toggleGroup(tableId, key) {
  const group = tableGroups[tableId];
  if (!group) return;
  group.collapsed[key] = !group.collapsed[key];
  renderTableScreen(tableId);
}

function openGroupedValue(tableId, field, value) {
  conditionBuilders[tableId].conditions = [{
    join: "and",
    field,
    operator: "equals",
    value,
  }];
  tableGroups[tableId].field = "";
  tableGroups[tableId].collapsed = {};
  saveConditionBuilders();
  renderTableScreen(tableId);
}

function openCellContextMenu(event, cell) {
  if (!cell.dataset.cellField) return;
  closeCellContextMenu();
  cellContextMenu = {
    table: cell.dataset.cellTable,
    field: cell.dataset.cellField,
    heading: cell.dataset.cellHeading,
    value: cell.dataset.cellValue,
  };

  const menu = document.createElement("div");
  menu.className = "cell-context-menu";
  menu.style.left = `${event.clientX}px`;
  menu.style.top = `${event.clientY}px`;
  menu.innerHTML = `
    <button type="button" data-cell-action="sort-asc">Сортировать по возрастанию</button>
    <button type="button" data-cell-action="sort-desc">Сортировать по убыванию</button>
    <button type="button" data-cell-action="group">Сгруппировать: ${escapeHtml(cellContextMenu.heading)}</button>
    <button type="button" data-cell-action="show-matches">Показать совпадения</button>
    <button type="button" data-cell-action="exclude-matches">Исключить совпадения</button>
    <button type="button" data-cell-action="create-report">Создать отчет по таблице</button>
  `;
  document.body.appendChild(menu);
}

function openTableContextMenu(event, table) {
  closeCellContextMenu();
  cellContextMenu = { table, field: "", heading: tableDefs[table]?.label || "", value: "" };
  const menu = document.createElement("div");
  menu.className = "cell-context-menu";
  menu.style.left = `${event.clientX}px`;
  menu.style.top = `${event.clientY}px`;
  menu.innerHTML = `<button type="button" data-cell-action="create-report">Создать отчет по таблице</button>`;
  document.body.appendChild(menu);
}

function closeCellContextMenu() {
  document.querySelector(".cell-context-menu")?.remove();
  cellContextMenu = null;
}

function handleCellContextAction(action) {
  if (!cellContextMenu) return;
  const { table, field, value } = cellContextMenu;

  if (action === "sort-asc") {
    tableSorts[table] = { field, direction: "asc" };
    renderTableScreen(table);
  }

  if (action === "sort-desc") {
    tableSorts[table] = { field, direction: "desc" };
    renderTableScreen(table);
  }

  if (action === "group") {
    tableGroups[table].field = field;
    tableGroups[table].collapsed = {};
    tableGroups[table].menuField = "";
    renderTableScreen(table);
  }

  if (action === "show-matches" || action === "exclude-matches") {
    conditionBuilders[table].conditions = [{
      join: "and",
      field,
      operator: action === "show-matches" ? "equals" : "not_equals",
      value,
    }];
    tableGroups[table].field = "";
    tableGroups[table].collapsed = {};
    saveConditionBuilders();
    renderTableScreen(table);
  }

  if (action === "create-report") {
    createReportFromTable(table);
  }

  closeCellContextMenu();
}

function createReportFromTable(table) {
  if (!tableDefs[table]) return;
  captureConditionBuilder(table);
  const rows = filteredRows(table);
  const groupField = tableGroups[table]?.field || defaultGroupField(table, "bar");
  const sort = tableSorts[table] || { field: "", direction: "" };
  const simpleFilters = tableFiltersToReportConditions(table);
  const builderConditions = (conditionBuilders[table]?.conditions || []).map((condition, index) => ({
    ...condition,
    join: index === 0 ? "and" : condition.join || "and",
  }));
  const textLocked = hasTextLikeTableFilter(table);

  builderDraft = normalizeReportDefinition({
    name: `Отчет: ${tableDefs[table].label}`,
    table,
    view: groupField ? "bar" : "table",
    columns: listVisibleColumns(table).map((column) => column.id),
    groupBy: groupField,
    metric: defaultMetricField(table),
    aggregation: table === "deals" ? "sum" : "count",
    sortField: sort.field || groupField,
    sortDirection: sort.direction || "desc",
    conditions: mergeReportConditions([...builderConditions, ...simpleFilters]),
    sourceRowIds: textLocked ? rows.map((row) => row.id).filter(Boolean) : [],
    sourceLabel: textLocked ? `Список из таблицы: ${rows.length} записей` : "",
  });
  activeReport = "builder";
  closeCellContextMenu();
  goToScreen("reports");
}

function tableFiltersToReportConditions(table) {
  const filters = tableFilters[table] || emptyFilters();
  const conditions = [];
  const push = (field, operator, value) => {
    if (!clean(value) && operator !== "empty" && operator !== "not_empty") return;
    if (!conditionFields(table).some((item) => item.id === field)) return;
    conditions.push({ join: conditions.length ? "and" : "and", field, operator, value });
  };

  push("status", "equals", filters.status);
  push("source", "equals", filters.source);
  push("value", "greater", filters.minValue);
  push("value", "less", filters.maxValue);

  if (filters.companyId) {
    const company = companyById(filters.companyId);
    push("company", "equals", company?.name);
  }

  if (filters.contactId) {
    const contact = contactById(filters.contactId);
    push("contact", "equals", contact?.name);
  }

  Object.entries(filters).forEach(([key, value]) => {
    if (!key.startsWith("col_") || !clean(value)) return;
    push(key.replace("col_", ""), "contains", value);
  });

  return conditions;
}

function mergeReportConditions(conditions) {
  const seen = new Set();
  return conditions
    .filter((condition) => condition.operator === "empty" || condition.operator === "not_empty" || clean(condition.value))
    .filter((condition) => {
      const key = [condition.field, condition.operator, clean(condition.value), condition.join || "and"].join("|");
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .map((condition, index) => ({ ...condition, join: index === 0 ? "and" : condition.join || "and" }));
}

function hasTextLikeTableFilter(table) {
  const filters = tableFilters[table] || emptyFilters();
  return Boolean(clean(filters.query));
}

function conditionRowHtml(tableId, condition, index) {
  const fields = conditionFields(tableId);
  return `
    <div class="condition-row" data-condition-row="${index}">
      ${index > 0 ? `
        <select class="condition-join" data-condition-join>
          <option value="and" ${condition.join === "and" ? "selected" : ""}>И</option>
          <option value="or" ${condition.join === "or" ? "selected" : ""}>ИЛИ</option>
        </select>
      ` : `<span class="condition-join-placeholder">Где</span>`}
      <select data-condition-field>
        ${fields.map((field) => `<option value="${field.id}" ${field.id === condition.field ? "selected" : ""}>${escapeHtml(field.label)}</option>`).join("")}
      </select>
      <select data-condition-operator>
        ${conditionOperators().map((operator) => `<option value="${operator.id}" ${operator.id === condition.operator ? "selected" : ""}>${operator.label}</option>`).join("")}
      </select>
      <input data-condition-value value="${escapeHtml(condition.value)}" placeholder="Значение">
      <button class="button light compact" type="button" data-remove-condition="${tableId}" data-condition-index="${index}">Удалить</button>
    </div>
  `;
}

function conditionBreadcrumbs(tableId) {
  const builder = conditionBuilders[tableId] || defaultConditionBuilder();
  if (!builder.conditions.length) {
    return `<span class="condition-chip muted">Нет активных условий</span>`;
  }

  return builder.conditions.map((condition, index) => {
    const field = conditionFields(tableId).find((item) => item.id === condition.field);
    const operator = conditionOperators().find((item) => item.id === condition.operator);
    const join = index > 0 ? `<b>${condition.join === "or" ? "ИЛИ" : "И"}</b>` : "";
    return `
      <span class="condition-chip">
        ${join}
        ${escapeHtml(field?.label || condition.field)}
        ${escapeHtml(operator?.label || condition.operator)}
        ${escapeHtml(condition.value || "пусто")}
      </span>
    `;
  }).join("");
}

function conditionFields(tableId) {
  const base = tableColumns(tableId);
  const extra = {
    deals: [
      ["company.city", "Компания.Город", (deal) => companyById(deal.companyId)?.city],
      ["contact.email", "Контакт.Email", (deal) => contactById(deal.contactId)?.email],
      ["contact.phone", "Контакт.Телефон", (deal) => contactById(deal.contactId)?.phone],
      ["productName", "Продукты", (deal) => dealProductsLabel(deal) || deal.productName],
      ["productCategory", "Категория продукта", (deal) => deal.productCategory],
      ["manager", "Менеджер", (deal) => deal.manager],
      ["utmSource", "UTM source", (deal) => deal.utmSource],
      ["promoCode", "Промокод", (deal) => deal.promoCode],
    ],
    leads: [
      ["company.city", "Компания.Город", (lead) => companyById(lead.companyId)?.city],
      ["contact.email", "Контакт.Email", (lead) => contactById(lead.contactId)?.email],
      ["contact.phone", "Контакт.Телефон", (lead) => contactById(lead.contactId)?.phone],
      ["utmSource", "UTM source", (lead) => lead.utmSource],
      ["utmCampaign", "UTM campaign", (lead) => lead.utmCampaign],
    ],
    tasks: [
      ["lead", "Лид", (task) => leadById(task.leadId)?.need],
      ["description", "Описание", (task) => task.description],
    ],
    contacts: [
      ["gender", "Пол", (contact) => contact.gender],
      ["age", "Возраст", (contact) => contact.age],
      ["interest", "Интерес", (contact) => contact.interest],
      ["geo", "Гео", (contact) => contact.geo],
      ["loyaltyTier", "Лояльность", (contact) => contact.loyaltyTier],
      ["nps", "NPS", (contact) => contact.nps],
    ],
    companies: [
      ["industry", "Отрасль", (company) => company.industry],
      ["phone", "Телефон", (company) => company.phone],
      ["email", "Email", (company) => company.email],
    ],
  };

  return [...base, ...(extra[tableId] || [])].map((field) => {
    if (Array.isArray(field)) return { id: field[0], label: field[1], value: field[2] };
    return field;
  });
}

function conditionOperators() {
  return [
    { id: "contains", label: "содержит" },
    { id: "not_contains", label: "не содержит" },
    { id: "equals", label: "равно" },
    { id: "not_equals", label: "не равно" },
    { id: "starts_with", label: "начинается с" },
    { id: "ends_with", label: "заканчивается на" },
    { id: "greater", label: "больше" },
    { id: "less", label: "меньше" },
    { id: "empty", label: "пусто" },
    { id: "not_empty", label: "не пусто" },
  ];
}

function captureConditionBuilder(tableId) {
  const builderNode = document.querySelector(`[data-condition-builder="${tableId}"]`);
  if (!builderNode) return;

  conditionBuilders[tableId].conditions = [...builderNode.querySelectorAll("[data-condition-row]")].map((row, index) => ({
    join: row.querySelector("[data-condition-join]")?.value || "and",
    field: row.querySelector("[data-condition-field]")?.value || conditionFields(tableId)[0]?.id,
    operator: row.querySelector("[data-condition-operator]")?.value || "contains",
    value: row.querySelector("[data-condition-value]")?.value || "",
  })).filter((condition) => condition.operator === "empty" || condition.operator === "not_empty" || clean(condition.value));

  saveConditionBuilders();
}

function passesConditionBuilder(tableId, row) {
  const builder = conditionBuilders[tableId] || defaultConditionBuilder();
  const conditions = builder.conditions.filter((condition) => condition.operator === "empty" || condition.operator === "not_empty" || clean(condition.value));
  if (!conditions.length) return true;

  return conditions.reduce((result, condition, index) => {
    const matches = matchesCondition(tableId, row, condition);
    if (index === 0) return matches;
    return condition.join === "or" ? result || matches : result && matches;
  }, true);
}

function matchesCondition(tableId, row, condition) {
  const field = conditionFields(tableId).find((item) => item.id === condition.field);
  const rawValue = field ? field.value(row) : "";
  const expected = clean(condition.value).toLowerCase();
  const actualNumber = Number(rawValue || 0);
  const expectedNumber = Number(condition.value || 0);
  const values = conditionValues(tableId, row, condition, rawValue);
  const hasMatch = (matcher) => values.some((actual) => matcher(actual));
  const allMatch = (matcher) => values.every((actual) => matcher(actual));

  if (condition.operator === "contains") return hasMatch((actual) => actual.includes(expected));
  if (condition.operator === "not_contains") return allMatch((actual) => !actual.includes(expected));
  if (condition.operator === "equals") return hasMatch((actual) => actual === expected);
  if (condition.operator === "not_equals") return allMatch((actual) => actual !== expected);
  if (condition.operator === "starts_with") return hasMatch((actual) => actual.startsWith(expected));
  if (condition.operator === "ends_with") return hasMatch((actual) => actual.endsWith(expected));
  if (condition.operator === "greater") return actualNumber > expectedNumber;
  if (condition.operator === "less") return actualNumber < expectedNumber;
  if (condition.operator === "empty") return values.every((actual) => !actual);
  if (condition.operator === "not_empty") return values.some(Boolean);
  return true;
}

function conditionValues(tableId, row, condition, rawValue) {
  const values = [clean(rawValue).toLowerCase()];

  if (condition.field === "status") {
    values.push(clean(row.status).toLowerCase());
    const statuses = tableId === "leads" ? leadStatuses : tableId === "tasks" ? taskStatuses : dealStatuses;
    values.push(clean(labelById(statuses, row.status)).toLowerCase());
  }

  return [...new Set(values)];
}

function addConditionRow(tableId) {
  captureConditionBuilder(tableId);
  conditionBuilders[tableId].conditions.push(defaultCondition(tableId));
  saveConditionBuilders();
}

function removeConditionRow(tableId, index) {
  captureConditionBuilder(tableId);
  conditionBuilders[tableId].conditions.splice(index, 1);
  saveConditionBuilders();
}

function saveFilterPreset(tableId) {
  captureConditionBuilder(tableId);
  const name = window.prompt("Название фильтра");
  if (!name) return;

  const builder = conditionBuilders[tableId];
  builder.presets = [
    ...builder.presets.filter((preset) => preset.name !== name),
    { name, conditions: builder.conditions },
  ];
  saveConditionBuilders();
}

function loadFilterPreset(tableId, name) {
  const preset = conditionBuilders[tableId].presets.find((item) => item.name === name);
  if (!preset) return;
  conditionBuilders[tableId].conditions = preset.conditions.map((condition) => ({ ...condition }));
  saveConditionBuilders();
}

function defaultCondition(tableId) {
  return {
    join: "and",
    field: conditionFields(tableId)[0]?.id || "name",
    operator: "contains",
    value: "",
  };
}

function defaultConditionBuilder() {
  return { conditions: [], presets: [] };
}

function loadConditionBuilders() {
  const defaults = {
    deals: defaultConditionBuilder(),
    leads: defaultConditionBuilder(),
    tasks: defaultConditionBuilder(),
    contacts: defaultConditionBuilder(),
    companies: defaultConditionBuilder(),
  };

  try {
    return { ...defaults, ...JSON.parse(localStorage.getItem("pulse-crm-condition-builders")) };
  } catch {
    return defaults;
  }
}

function saveConditionBuilders() {
  localStorage.setItem("pulse-crm-condition-builders", JSON.stringify(conditionBuilders));
}

function defaultListSetting(tableId) {
  return {
    filtersOpen: false,
    searchOpen: false,
    compact: true,
    compactTouched: false,
    filtersHiddenByCompact: false,
    pageSize: 10,
    page: 1,
    visibleColumns: defaultListColumns(tableId),
  };
}

function loadListSettings() {
  const defaults = {
    deals: defaultListSetting("deals"),
    leads: defaultListSetting("leads"),
    tasks: defaultListSetting("tasks"),
    contacts: defaultListSetting("contacts"),
    companies: defaultListSetting("companies"),
  };
  try {
    const saved = JSON.parse(localStorage.getItem("pulse-crm-list-settings"));
    return { ...defaults, ...saved };
  } catch {
    return defaults;
  }
}

function saveListSettings() {
  localStorage.setItem("pulse-crm-list-settings", JSON.stringify(listSettings));
}

function getFilters(tableId) {
  return tableFilters[tableId] || emptyFilters();
}

function restoreFilterValues(tableId) {
  const form = document.querySelector(`[data-filter-form="${tableId}"]`);
  const filters = getFilters(tableId);
  if (!form) return;

  Object.entries(filters).forEach(([key, value]) => {
    if (form.elements[key]) form.elements[key].value = value;
  });

  document.querySelectorAll(`[data-column-filter="${tableId}"]`).forEach((input) => {
    input.value = filters[`col_${input.dataset.columnId}`] || "";
  });
}

function tableHtml(tableIdOrHeadings, recordsOrRows, fieldsOrHeadings, headingsArg, rowMapperArg) {
  const legacyMode = Array.isArray(tableIdOrHeadings);
  const tableId = legacyMode ? "" : tableIdOrHeadings;
  const fields = legacyMode ? [] : fieldsOrHeadings;
  const headings = legacyMode ? tableIdOrHeadings : headingsArg;
  const records = legacyMode ? [] : recordsOrRows;
  const rowMapper = legacyMode ? null : rowMapperArg;
  const rows = legacyMode ? recordsOrRows : records.map((record) => ({
    record,
    cells: enrichRowCells(tableId, fields, headings, rowMapper(record), record),
  }));
  const compact = tableId && listSettings[tableId]?.compact ? " compact-list" : "";
  return `
    <div class="table-scroll">
      <table class="data-table${compact}">
        <thead>
          <tr>${legacyMode ? "" : listServiceHeaders(tableId, records)}${headings.map((heading, index) => tableHeaderCell(tableId, fields[index], heading)).join("")}</tr>
        </thead>
        <tbody>
          ${legacyMode || !tableGroups[tableId]?.field ? renderPlainRows(rows, tableId) : renderGroupedRows(tableId, records, rowMapper)}
        </tbody>
      </table>
    </div>
  `;
}

function enrichRowCells(tableId, fields, headings, cells, record) {
  return cells.map((cell, index) => {
    const field = fields[index] || "";
    const column = tableColumns(tableId).find((item) => item.id === field);
    return {
      html: cell,
      table: tableId,
      field,
      heading: headings[index] || "",
      value: column ? column.value(record) : textFromHtml(cell),
    };
  });
}

function textFromHtml(value) {
  return String(value || "").replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();
}

function tableHeaderCell(tableId, field, heading) {
  if (!tableId || !field) return `<th>${heading}</th>`;
  const sort = tableSorts[tableId] || { field: "", direction: "" };
  const group = tableGroups[tableId] || { field: "" };
  const active = sort.field === field && sort.direction;
  const icon = active ? (sort.direction === "asc" ? "↑" : "↓") : "↕";
  const menuOpen = group.menuField === field;
  return `
    <th class="table-head-cell">
      <div class="table-head-actions">
        <button class="sort-button ${active ? "active" : ""}" type="button" data-sort-table="${tableId}" data-sort-field="${field}">
          <span>${heading}</span>
          <b>${icon}</b>
        </button>
        <button class="header-menu-button ${group.field === field ? "active" : ""}" type="button" data-group-menu="${tableId}" data-group-field="${field}">⋯</button>
      </div>
      ${menuOpen ? groupMenuHtml(tableId, field, heading) : ""}
    </th>
  `;
}

function renderPlainRows(rows, tableId = "") {
  return rows.map((row) => Array.isArray(row) ? rowHtml(row) : rowHtml(row.cells, tableId, row.record)).join("");
}

function renderGroupedRows(tableId, records, rowMapper) {
  const group = tableGroups[tableId];
  const column = tableColumns(tableId).find((item) => item.id === group.field);
  if (!column) return renderPlainRows(records.map((record) => ({
    record,
    cells: enrichRowCells(tableId, listVisibleColumns(tableId).map((item) => item.id), listVisibleColumns(tableId).map((item) => item.label), listVisibleColumns(tableId).map((item) => listCellHtml(tableId, record, item.id)), record),
  })), tableId);

  return groupedRecordRows(records, column, group).map(({ key, records: groupRecords }) => {
    const collapsed = Boolean(group.collapsed[key]);
    const header = `
      <tr class="group-row">
        <td colspan="${listVisibleColumns(tableId).length + 2}">
          <div class="group-row-inner">
            <button type="button" data-group-toggle="${escapeHtml(key)}" data-group-table="${tableId}">
              <b>${collapsed ? "▸" : "▾"}</b>
              <strong>${escapeHtml(key)}</strong>
              <span>${groupRecords.length}</span>
            </button>
            <button type="button" class="button light compact" data-open-group="${escapeHtml(key)}" data-group-table="${tableId}" data-group-field="${group.field}" data-group-value="${escapeHtml(key)}">Открыть группу</button>
          </div>
        </td>
      </tr>
    `;
    const visibleColumns = listVisibleColumns(tableId);
    const fields = visibleColumns.map((item) => item.id);
    const headings = visibleColumns.map((item) => item.label);
    const body = collapsed ? "" : groupRecords.map((record) => rowHtml(enrichRowCells(tableId, fields, headings, fields.map((field) => listCellHtml(tableId, record, field)), record), tableId, record)).join("");
    return header + body;
  }).join("");
}

function rowHtml(cells, tableId = "", record = null) {
  const service = tableId && record ? listServiceCells(tableId, record) : "";
  return `<tr>${service}${cells.map((cell) => {
    const normalized = typeof cell === "object" && cell !== null && "html" in cell ? cell : { html: cell, field: "", value: "" };
    return `<td data-cell-table="${escapeHtml(normalized.table || "")}" data-cell-field="${escapeHtml(normalized.field || "")}" data-cell-heading="${escapeHtml(normalized.heading || "")}" data-cell-value="${escapeHtml(normalized.value ?? "")}">${normalized.html}</td>`;
  }).join("")}</tr>`;
}

function listServiceHeaders(tableId, records) {
  const visibleIds = records.map((record) => record.id).filter(Boolean);
  const selected = selectedRows[tableId] || [];
  const checked = visibleIds.length && visibleIds.every((id) => selected.includes(id));
  return `
    <th class="list-check-cell"><input type="checkbox" data-select-visible="${tableId}" ${checked ? "checked" : ""}></th>
    <th class="list-info-cell"></th>
  `;
}

function listServiceCells(tableId, record) {
  const selected = selectedRows[tableId] || [];
  const type = tableDefs[tableId]?.recordType || "";
  return `
    <td class="list-check-cell"><input type="checkbox" data-row-select data-row-table="${tableId}" value="${escapeHtml(record.id)}" ${selected.includes(record.id) ? "checked" : ""}></td>
    <td class="list-info-cell"><button class="info-button" type="button" data-row-info="${escapeHtml(record.id)}" data-info-type="${escapeHtml(type)}" title="Открыть карточку">i</button></td>
  `;
}

function groupedRecordRows(records, column, group) {
  const map = new Map();
  records.forEach((record) => {
    const key = clean(column.value(record)) || "Не указано";
    if (!map.has(key)) map.set(key, []);
    map.get(key).push(record);
  });

  const groups = [...map.entries()].map(([key, groupRecords]) => ({ key, records: groupRecords }));
  return groups.sort((a, b) => {
    if (group.sort === "count-asc") return a.records.length - b.records.length;
    if (group.sort === "count-desc") return b.records.length - a.records.length;
    const result = a.key.localeCompare(b.key, "ru", { numeric: true, sensitivity: "base" });
    return group.sort === "name-desc" ? -result : result;
  });
}

function groupMenuHtml(tableId, field, heading) {
  const grouped = tableGroups[tableId]?.field;
  const groupLabel = grouped && grouped !== field ? "Перегруппировать" : "Сгруппировать";
  return `
    <div class="header-context-menu">
      <button type="button" data-group-table="${tableId}" data-group-action="group" data-group-field="${field}">${groupLabel}: ${escapeHtml(heading)}</button>
      <button type="button" data-group-table="${tableId}" data-group-action="expand" data-group-field="${field}">Развернуть все группы</button>
      <button type="button" data-group-table="${tableId}" data-group-action="collapse" data-group-field="${field}">Свернуть все группы</button>
      <button type="button" data-group-table="${tableId}" data-group-action="sort-name-asc" data-group-field="${field}">Группы: имя ↑</button>
      <button type="button" data-group-table="${tableId}" data-group-action="sort-name-desc" data-group-field="${field}">Группы: имя ↓</button>
      <button type="button" data-group-table="${tableId}" data-group-action="sort-count-asc" data-group-field="${field}">Группы: количество ↑</button>
      <button type="button" data-group-table="${tableId}" data-group-action="sort-count-desc" data-group-field="${field}">Группы: количество ↓</button>
      <button type="button" data-group-table="${tableId}" data-group-action="ungroup" data-group-field="${field}">Разгруппировать</button>
    </div>
  `;
}

function detailHtml(kicker, title, fields, links) {
  const linkRows = links.filter(Boolean).join("");
  return `
    <div class="dialog-head">
      <div>
        <p class="eyebrow">${kicker}</p>
        <h2>${escapeHtml(title)}</h2>
      </div>
      <button class="button light compact" type="button" data-dialog-close>Закрыть</button>
    </div>
    <dl class="detail-list">
      ${fields.map(([label, value]) => `
        <div>
          <dt>${escapeHtml(label)}</dt>
          <dd>${escapeHtml(value)}</dd>
        </div>
      `).join("")}
    </dl>
    <div class="relation-list">
      <h4>Связи</h4>
      ${linkRows || `<p>Связей пока нет</p>`}
    </div>
  `;
}

function linkedLine(label, type, id, text) {
  return `
    <button class="relation-link" type="button" data-open-type="${type}" data-open-record="${id}">
      <span>${escapeHtml(label)}</span>
      <strong>${escapeHtml(text)}</strong>
    </button>
  `;
}

function recordButton(type, id, text) {
  return `<button class="table-link" type="button" data-open-type="${type}" data-open-record="${id}">${escapeHtml(text)}</button>`;
}

function statusSelect(deal) {
  return `
    <select class="deal-status" data-deal-status="${deal.id}" aria-label="Статус сделки">
      ${dealStatuses.map((status) => `<option value="${status.id}" ${status.id === deal.status ? "selected" : ""}>${status.label}</option>`).join("")}
    </select>
  `;
}

function dealCard(deal) {
  const company = companyById(deal.companyId);
  const contact = contactById(deal.contactId);

  return `
    <article class="deal-card clickable-card" draggable="true" data-board-card data-card-type="deal" data-card-id="${deal.id}" data-deal-id="${deal.id}" tabindex="0" aria-label="Открыть сделку ${escapeHtml(deal.title)}">
      <div class="deal-head">
        <h3>${escapeHtml(deal.title)}</h3>
        <strong>${money.format(Number(deal.value || 0))}</strong>
      </div>
      <p>${escapeHtml(company?.name || "Компания не указана")}</p>
      <div class="deal-meta">
        <button type="button" data-open-type="contact" data-open-record="${deal.contactId}">${escapeHtml(contact?.name || "Контакт")}</button>
        <span>${formatDate(deal.updatedAt || deal.createdAt)}</span>
      </div>
      <p>${escapeHtml(deal.need || "Следующий шаг не указан")}</p>
      ${statusSelect(deal)}
    </article>
  `;
}

function leadKanbanCard(lead) {
  const company = companyById(lead.companyId);
  const contact = contactById(lead.contactId);
  return `
    <article class="deal-card clickable-card" draggable="true" data-board-card data-card-type="lead" data-card-id="${lead.id}" tabindex="0" aria-label="Открыть лид ${escapeHtml(lead.need || lead.source)}">
      <div class="deal-head">
        <h3>${escapeHtml(lead.need || "Лид без запроса")}</h3>
        <strong>${escapeHtml(labelById(leadStatuses, lead.status))}</strong>
      </div>
      <p>${escapeHtml(company?.name || "Компания не указана")}</p>
      <div class="deal-meta">
        <button type="button" data-open-type="contact" data-open-record="${lead.contactId}">${escapeHtml(contact?.name || "Контакт")}</button>
        <span>${formatDate(lead.createdAt)}</span>
      </div>
      <p>${escapeHtml(lead.source || "CRM")}</p>
    </article>
  `;
}

function taskKanbanCard(task) {
  const deal = dealById(task.dealId);
  const contact = contactById(task.contactId);
  return `
    <article class="deal-card clickable-card task-card ${isTaskDueSoon(task) ? "due-soon" : ""}" draggable="true" data-board-card data-card-type="task" data-card-id="${task.id}" tabindex="0" aria-label="Открыть задачу ${escapeHtml(task.title)}">
      <div class="deal-head">
        <h3>${escapeHtml(task.title)}</h3>
        <strong>${escapeHtml(task.dueAt ? formatDate(task.dueAt) : "Без срока")}</strong>
      </div>
      <p>${escapeHtml(task.manager || "Менеджер не указан")}</p>
      <div class="deal-meta">
        ${deal ? `<button type="button" data-open-type="deal" data-open-record="${deal.id}">${escapeHtml(deal.title)}</button>` : contact ? `<button type="button" data-open-type="contact" data-open-record="${contact.id}">${escapeHtml(contact.name)}</button>` : `<span>Без связи</span>`}
        <span>${escapeHtml(taskStatusLabel(task))}</span>
      </div>
      <select class="deal-status" data-task-status="${task.id}" aria-label="Статус задачи">
        ${taskStatuses.map((status) => `<option value="${status.id}" ${status.id === task.status ? "selected" : ""}>${escapeHtml(status.label)}</option>`).join("")}
      </select>
    </article>
  `;
}

function dashboardCard(id, label, value, meta, drilldown = "") {
  return `
    <button class="dashboard-card clickable-card dashboard-widget size-${dashboardWidgetSize(id)}" type="button" draggable="true" data-dashboard-widget="${id}" ${drilldown ? `data-drilldown="${drilldown}"` : ""}>
      ${dashboardWidgetControls(id)}
      <span>${escapeHtml(label)}</span>
      <strong>${value}</strong>
      <em>${escapeHtml(meta)}</em>
    </button>
  `;
}

function idsOf(items) {
  return items.map((item) => item?.id).filter(Boolean);
}

function dashboardWidgetIds() {
  return ["sales", "leads", "pipeline", "contacts", "tasks", "periodDeals", "sources", "reminders", "reports"];
}

function defaultDashboardWidgetSize(id) {
  return ["periodDeals", "reports"].includes(id) ? "lg" : ["sources", "reminders"].includes(id) ? "md" : "sm";
}

function dashboardWidgetSize(id) {
  const size = dashboardWidgetLayouts[id];
  return ["sm", "md", "lg"].includes(size) ? size : defaultDashboardWidgetSize(id);
}

function dashboardWidgetSizeLabel(size) {
  return { sm: "S", md: "M", lg: "L" }[size] || "M";
}

function dashboardWidgetControls(id) {
  const size = dashboardWidgetSize(id);
  return `
    <span class="dashboard-widget-tools">
      <i>перетащить</i>
      <b role="button" tabindex="0" data-dashboard-widget-size="${escapeHtml(id)}" title="Изменить размер">${dashboardWidgetSizeLabel(size)}</b>
    </span>
  `;
}

function cycleDashboardWidgetSize(id) {
  if (!dashboardWidgetIds().includes(id)) return;
  const current = dashboardWidgetSize(id);
  dashboardWidgetLayouts = {
    ...dashboardWidgetLayouts,
    [id]: current === "sm" ? "md" : current === "md" ? "lg" : "sm",
  };
  saveDashboardWidgetLayouts();
  renderDashboard();
}

function normalizedDashboardWidgetOrder() {
  const known = dashboardWidgetIds();
  const saved = dashboardWidgetOrder.filter((id) => known.includes(id));
  return [...saved, ...known.filter((id) => !saved.includes(id))];
}

function reorderDashboardWidget(fromId, toId) {
  if (!fromId || !toId || fromId === toId) return;
  const next = normalizedDashboardWidgetOrder().filter((id) => id !== fromId);
  const targetIndex = next.indexOf(toId);
  if (targetIndex === -1) return;
  next.splice(targetIndex, 0, fromId);
  dashboardWidgetOrder = next;
  saveDashboardWidgetOrder();
  renderDashboard();
}

function dashboardTaskCard(total, today) {
  return `
    <button class="dashboard-card clickable-card task-dashboard-card dashboard-widget size-${dashboardWidgetSize("tasks")}" type="button" draggable="true" data-dashboard-widget="tasks" data-drilldown="${drillPayload("tasks", [{ field: "status", operator: "not_equals", value: "done" }], idsOf(visibleRows("tasks").filter((task) => task.status !== "done")))}">
      ${dashboardWidgetControls("tasks")}
      <span>Задачи</span>
      <strong>${total}</strong>
      <em>всего открытых</em>
      <b>${today} истекают сегодня</b>
    </button>
  `;
}

function renderReports() {
  const list = document.querySelector("[data-report-list]");
  const select = document.querySelector("[data-report-select]");
  const output = document.querySelector("[data-report-output]");
  if (!list || !select || !output) return;

  if (activeReport !== "builder" && !knownReportId(activeReport)) activeReport = "salesFunnel";
  const customItems = customReports.map((report) => customReportMeta(report));

  list.innerHTML = `
    <button class="report-menu-item create ${activeReport === "builder" ? "active" : ""}" type="button" data-new-report>
      <strong>Новый отчет</strong>
      <span>Собрать из таблицы CRM</span>
    </button>
    <div class="report-sidebar-title">Системные</div>
    ${reportTypes.map((report) => reportMenuItem(report.id, report.label, report.description)).join("")}
    <div class="report-sidebar-title">Пользовательские</div>
    ${customItems.map((report) => reportMenuItem(`custom:${report.id}`, report.label, report.description)).join("") || `<p class="report-sidebar-empty">Пока нет сохраненных отчетов</p>`}
  `;

  select.innerHTML = [
    `<option value="builder" ${activeReport === "builder" ? "selected" : ""}>Создать отчет</option>`,
    ...reportTypes.map((report) => `<option value="${report.id}" ${report.id === activeReport ? "selected" : ""}>${escapeHtml(report.label)}</option>`),
    ...customItems.map((report) => `<option value="custom:${report.id}" ${activeReport === `custom:${report.id}` ? "selected" : ""}>${escapeHtml(report.label)}</option>`),
  ].join("");

  const pinButton = document.querySelector("[data-pin-report]");
  if (pinButton) {
    pinButton.disabled = activeReport === "builder";
    pinButton.textContent = dashboardReportIds.includes(activeReport) ? "На дашборде" : "Вывести на дашборд";
  }

  output.innerHTML = activeReport === "builder" ? reportBuilderHtml(builderDraft) : reportHtml(buildReport(activeReport));
}

function reportMenuItem(id, label, description) {
  return `
    <button class="report-menu-item ${activeReport === id ? "active" : ""}" type="button" data-report-id="${id}">
      <strong>${escapeHtml(label)}</strong>
      <span>${escapeHtml(description)}</span>
    </button>
  `;
}

function dashboardReportSize(id) {
  return ["sm", "md", "lg"].includes(dashboardReportLayouts[id]) ? dashboardReportLayouts[id] : "md";
}

function dashboardReportSizeLabel(size) {
  return { sm: "S", md: "M", lg: "L" }[size] || "M";
}

function cycleDashboardReportSize(id) {
  if (!dashboardReportIds.includes(id)) return;
  const current = dashboardReportSize(id);
  dashboardReportLayouts = {
    ...dashboardReportLayouts,
    [id]: current === "sm" ? "md" : current === "md" ? "lg" : "sm",
  };
  saveDashboardReportLayouts();
  renderDashboard();
}

function reorderDashboardReport(fromId, toId) {
  if (!fromId || !toId || fromId === toId) return;
  const next = dashboardReportIds.filter((id) => id !== fromId);
  const targetIndex = next.indexOf(toId);
  if (targetIndex === -1) return;
  next.splice(targetIndex, 0, fromId);
  dashboardReportIds = next;
  saveDashboardReports();
  renderDashboard();
}

function reportMiniCard(id) {
  const report = buildReport(id);
  const size = dashboardReportSize(id);
  return `
    <article class="report-mini-card clickable-card size-${size}" draggable="true" data-dashboard-report-card="${escapeHtml(id)}">
      <div class="report-mini-controls">
        <span>перетащить</span>
        <button type="button" data-dashboard-report-size="${escapeHtml(id)}" title="Изменить размер">${dashboardReportSizeLabel(size)}</button>
      </div>
      <button class="report-mini-open" type="button" data-open-report="${escapeHtml(id)}">
        <span>${escapeHtml(report.title)}</span>
        <strong>${escapeHtml(report.primary || "Готов")}</strong>
        <em>${escapeHtml(report.caption || periodLabel(activePeriod))}</em>
      </button>
    </article>
  `;
}

function reportBuilderHtml(draft) {
  const definition = normalizeReportDefinition(draft);
  const fields = reportSourceFields(definition.table);
  const groupFields = conditionFields(definition.table);
  const conditionList = definition.conditions.length ? definition.conditions : [defaultReportCondition(definition.table)];
  const preview = customReportFromDefinition(definition);

  return `
    <div class="report-builder" data-report-builder>
      <section class="builder-panel">
        <div class="builder-panel-head">
          <span>1</span>
          <div>
            <p class="eyebrow">Данные</p>
            <h2>Источник и условия</h2>
          </div>
        </div>
        <input type="hidden" data-builder-id value="${escapeHtml(definition.id || "")}">
        <div class="builder-grid">
          <label>
            Название отчета
            <input data-builder-name value="${escapeHtml(definition.name)}" placeholder="Например: Продажи по менеджерам">
          </label>
          <label>
            Таблица
            <select data-builder-table data-builder-rebuild>
              ${Object.entries(tableDefs).map(([id, table]) => `<option value="${id}" ${definition.table === id ? "selected" : ""}>${escapeHtml(table.label)}</option>`).join("")}
            </select>
          </label>
        </div>
        <div class="builder-conditions">
          ${conditionList.map((condition, index) => reportConditionRowHtml(definition.table, condition, index)).join("")}
        </div>
        <button class="button secondary compact" type="button" data-builder-add-condition>Добавить условие</button>
      </section>

      <section class="builder-panel">
        <div class="builder-panel-head">
          <span>2</span>
          <div>
            <p class="eyebrow">Тип</p>
            <h2>Представление</h2>
          </div>
        </div>
        <div class="builder-type-grid">
          ${reportViewTypes().map((type) => `
            <label class="builder-type ${definition.view === type.id ? "active" : ""}">
              <input type="radio" name="builder-view" value="${type.id}" ${definition.view === type.id ? "checked" : ""} data-builder-view data-builder-rebuild>
              ${reportTypeIcon(type.id)}
              <strong>${escapeHtml(type.label)}</strong>
              <span>${escapeHtml(type.description)}</span>
            </label>
          `).join("")}
        </div>
      </section>

      <section class="builder-panel">
        <div class="builder-panel-head">
          <span>3</span>
          <div>
            <p class="eyebrow">Настройки</p>
            <h2>Поля, группировка и показатель</h2>
          </div>
        </div>
        <div class="builder-grid three">
          <label>
            Группировать по
            <select data-builder-group data-builder-rebuild>
              ${optionList("Без группировки", groupFields).replace(`value="${definition.groupBy}"`, `value="${definition.groupBy}" selected`)}
            </select>
          </label>
          <label>
            Показатель
            <select data-builder-metric data-builder-rebuild>
              ${optionList("Количество записей", fields).replace(`value="${definition.metric}"`, `value="${definition.metric}" selected`)}
            </select>
          </label>
          <label>
            Агрегация
            <select data-builder-aggregation data-builder-rebuild>
              ${reportAggregations().map((item) => `<option value="${item.id}" ${definition.aggregation === item.id ? "selected" : ""}>${escapeHtml(item.label)}</option>`).join("")}
            </select>
          </label>
          <label>
            Сортировка
            <select data-builder-sort-field>
              ${optionList("Без сортировки", fields).replace(`value="${definition.sortField}"`, `value="${definition.sortField}" selected`)}
            </select>
          </label>
          <label>
            Направление
            <select data-builder-sort-direction>
              <option value="desc" ${definition.sortDirection === "desc" ? "selected" : ""}>По убыванию</option>
              <option value="asc" ${definition.sortDirection === "asc" ? "selected" : ""}>По возрастанию</option>
            </select>
          </label>
          <label>
            Лимит групп
            <input data-builder-limit type="number" min="1" max="20" value="${escapeHtml(definition.limit)}">
          </label>
        </div>
        <label class="toggle-line">
          <input type="checkbox" data-builder-show-other ${definition.showOther ? "checked" : ""}>
          <span>Показывать оставшиеся категории отдельной группой</span>
        </label>
        <div class="builder-columns">
          ${fields.map((field) => `
            <label>
              <input type="checkbox" data-builder-column value="${field.id}" ${definition.columns.includes(field.id) ? "checked" : ""}>
              <span>${escapeHtml(field.label)}</span>
            </label>
          `).join("")}
        </div>
        ${definition.sourceRowIds.length ? `<p class="builder-source-note">${escapeHtml(definition.sourceLabel || `Список из таблицы: ${definition.sourceRowIds.length} записей`)}</p>` : ""}
      </section>

      <section class="builder-panel">
        <div class="builder-panel-head">
          <span>4</span>
          <div>
            <p class="eyebrow">Стиль</p>
            <h2>Дашборд и детализация</h2>
          </div>
        </div>
        <div class="builder-actions">
          <label class="toggle-line">
            <input type="checkbox" data-builder-show-table ${definition.showTable ? "checked" : ""}>
            <span>Показывать таблицу детализации</span>
          </label>
          <button class="button light" type="button" data-run-custom-report>Построить превью</button>
          <button class="button primary" type="button" data-save-custom-report>Сохранить отчет</button>
        </div>
      </section>
    </div>
    ${reportHtml(preview)}
  `;
}

function reportConditionRowHtml(tableId, condition, index) {
  const fields = conditionFields(tableId);
  return `
    <div class="builder-condition-row" data-builder-condition-row>
      ${index > 0 ? `
        <select data-builder-condition-join>
          <option value="and" ${condition.join === "and" ? "selected" : ""}>И</option>
          <option value="or" ${condition.join === "or" ? "selected" : ""}>ИЛИ</option>
        </select>
      ` : `<span>Где</span>`}
      <select data-builder-condition-field>
        ${fields.map((field) => `<option value="${field.id}" ${field.id === condition.field ? "selected" : ""}>${escapeHtml(field.label)}</option>`).join("")}
      </select>
      <select data-builder-condition-operator>
        ${conditionOperators().map((operator) => `<option value="${operator.id}" ${operator.id === condition.operator ? "selected" : ""}>${escapeHtml(operator.label)}</option>`).join("")}
      </select>
      <input data-builder-condition-value value="${escapeHtml(condition.value || "")}" placeholder="Значение">
      <button class="button light compact" type="button" data-builder-remove-condition="${index}">Удалить</button>
    </div>
  `;
}

function customReportFromDefinition(definition) {
  const report = normalizeReportDefinition(definition);
  const sourceIds = new Set(report.sourceRowIds || []);
  const rows = reportRows(report.table)
    .filter((row) => !sourceIds.size || sourceIds.has(row.id))
    .filter((row) => passesReportConditions(report.table, row, report.conditions));
  const sorted = sortReportRows(report, rows);
  const fields = reportSourceFields(report.table);
  const selectedFields = report.columns.map((id) => fields.find((field) => field.id === id)).filter(Boolean);
  const groupField = fields.find((field) => field.id === report.groupBy);
  const metricField = fields.find((field) => field.id === report.metric);
  const baseConditions = report.conditions.filter((condition) => clean(condition.value) || ["empty", "not_empty"].includes(condition.operator));

  if (groupField || report.view !== "table") {
    const grouped = groupField ? groupedRows(sorted, (row) => groupField.value(row)) : [["Все записи", sorted]];
    const limited = grouped.slice(0, report.limit);
    const remaining = grouped.slice(report.limit);
    const visibleGroups = report.showOther && remaining.length
      ? [...limited, ["Остальные", remaining.flatMap(([, items]) => items)]]
      : limited;
    const limitedKeys = limited.map(([key]) => key);
    const resultRows = visibleGroups.map(([key, items]) => {
      const value = aggregateReportValue(items, metricField, report.aggregation);
      const conditions = groupField && key === "Остальные"
        ? [...baseConditions, ...limitedKeys.map((limitedKey) => ({ join: "and", field: groupField.id, operator: "not_equals", value: limitedKey }))]
        : groupField
          ? [...baseConditions, { join: "and", field: groupField.id, operator: "equals", value: key }]
          : baseConditions;
      return {
        cells: [key, formatReportMetric(value, report.aggregation, metricField), items.length],
        table: report.table,
        conditions,
        ids: idsOf(items),
        rawValue: Number(value || 0),
      };
    });

    const total = aggregateReportValue(sorted, metricField, report.aggregation);
    return {
      title: report.name || "Новый отчет",
      targetTable: report.table,
      conditions: baseConditions,
      primary: report.aggregation === "count" ? `${sorted.length}` : formatReportMetric(total, report.aggregation, metricField),
      caption: `${tableDefs[report.table]?.label || "Таблица"} · ${sorted.length} записей`,
      summary: [["Записей", sorted.length], ["Групп", resultRows.length], ["Показатель", aggregationLabel(report.aggregation)]],
      headings: [groupField?.label || "Группа", aggregationLabel(report.aggregation), "Записей"],
      rows: resultRows,
      visualHtml: reportVisualHtml(report, resultRows, sorted.length),
      showTable: report.showTable,
      customId: report.id,
    };
  }

  const tableRows = sorted.map((row) => ({
    cells: selectedFields.map((field) => formatReportCell(field.value(row), field.id)),
    table: report.table,
    conditions: reportRowConditions(report.table, row, selectedFields, baseConditions),
    ids: [row.id],
  }));

  return {
    title: report.name || "Новый отчет",
    targetTable: report.table,
    conditions: baseConditions,
    primary: `${sorted.length}`,
    caption: `${tableDefs[report.table]?.label || "Таблица"} · список записей`,
    summary: [["Записей", sorted.length], ["Колонок", selectedFields.length], ["Тип", "Таблица"]],
    headings: selectedFields.map((field) => field.label),
    rows: tableRows,
    visualHtml: reportVisualHtml(report, [], sorted.length),
    showTable: report.showTable,
    customId: report.id,
  };
}

function reportVisualHtml(report, rows, totalCount) {
  if (report.view === "table") return "";
  if (report.view === "summary") {
    return `
      <div class="report-visual summary-visual">
        ${rows.map((row) => `
          <button type="button" data-drilldown="${drillPayload(row.table || report.table, row.conditions || report.conditions, row.ids || [])}">
            <span>${escapeHtml(row.cells[0])}</span>
            <strong>${escapeHtml(row.cells[1])}</strong>
            <em>${escapeHtml(row.cells[2])} записей</em>
          </button>
        `).join("") || `<div><span>Записей</span><strong>${totalCount}</strong><em>детализация ниже</em></div>`}
      </div>
    `;
  }

  const max = Math.max(...rows.map((row) => Number(row.rawValue || row.cells[2] || 0)), 1);
  if (report.view === "pie") {
    const total = rows.reduce((value, row) => value + Number(row.rawValue || row.cells[2] || 0), 0) || 1;
    return `
      <div class="report-visual pie-visual">
        ${rows.map((row, index) => {
          const value = Number(row.rawValue || row.cells[2] || 0);
          return `
            <button type="button" data-drilldown="${drillPayload(row.table || report.table, row.conditions || report.conditions, row.ids || [])}">
              <i style="--slice-color: ${chartColor(index)}"></i>
              <span>${escapeHtml(row.cells[0])}</span>
              <strong>${percent(value, total)}%</strong>
            </button>
          `;
        }).join("")}
      </div>
    `;
  }

  return `
    <div class="report-visual bar-visual">
      ${rows.map((row, index) => {
        const value = Number(row.rawValue || row.cells[2] || 0);
        return `
          <button type="button" data-drilldown="${drillPayload(row.table || report.table, row.conditions || report.conditions, row.ids || [])}">
            <span>${escapeHtml(row.cells[0])}</span>
            <b style="width: ${Math.max(8, percent(value, max))}%; --bar-color: ${chartColor(index)}"></b>
            <strong>${escapeHtml(row.cells[1])}</strong>
          </button>
        `;
      }).join("")}
    </div>
  `;
}

function captureReportBuilder() {
  const node = document.querySelector("[data-report-builder]");
  if (!node) return normalizeReportDefinition(builderDraft);
  const table = node.querySelector("[data-builder-table]")?.value || "deals";
  const previousDraft = normalizeReportDefinition(builderDraft);
  const fields = reportSourceFields(table);
  const columns = [...node.querySelectorAll("[data-builder-column]:checked")].map((input) => input.value);
  const conditions = [...node.querySelectorAll("[data-builder-condition-row]")].map((row, index) => ({
    join: row.querySelector("[data-builder-condition-join]")?.value || "and",
    field: row.querySelector("[data-builder-condition-field]")?.value || conditionFields(table)[0]?.id || "",
    operator: row.querySelector("[data-builder-condition-operator]")?.value || "contains",
    value: row.querySelector("[data-builder-condition-value]")?.value || "",
  })).filter((condition) => condition.operator === "empty" || condition.operator === "not_empty" || clean(condition.value));

  return normalizeReportDefinition({
    id: node.querySelector("[data-builder-id]")?.value || "",
    name: node.querySelector("[data-builder-name]")?.value || "",
    table,
    view: node.querySelector("[data-builder-view]:checked")?.value || "bar",
    columns: columns.length ? columns : fields.slice(0, 4).map((field) => field.id),
    groupBy: node.querySelector("[data-builder-group]")?.value || "",
    metric: node.querySelector("[data-builder-metric]")?.value || "",
    aggregation: node.querySelector("[data-builder-aggregation]")?.value || "count",
    sortField: node.querySelector("[data-builder-sort-field]")?.value || "",
    sortDirection: node.querySelector("[data-builder-sort-direction]")?.value || "desc",
    limit: Number(node.querySelector("[data-builder-limit]")?.value || 8),
    showOther: Boolean(node.querySelector("[data-builder-show-other]")?.checked),
    showTable: Boolean(node.querySelector("[data-builder-show-table]")?.checked),
    sourceRowIds: previousDraft.table === table ? previousDraft.sourceRowIds : [],
    sourceLabel: previousDraft.table === table ? previousDraft.sourceLabel : "",
    conditions,
  });
}

function normalizeReportDefinition(report = {}) {
  const table = tableDefs[report.table] ? report.table : "deals";
  const fields = reportSourceFields(table);
  const fieldIds = fields.map((field) => field.id);
  const groupFieldIds = conditionFields(table).map((field) => field.id);
  const columns = (report.columns || []).filter((id) => fieldIds.includes(id));
  const view = reportViewTypes().some((item) => item.id === report.view) ? report.view : "bar";
  return {
    id: report.id || "",
    name: report.name || "Новый отчет",
    table,
    view,
    columns: columns.length ? columns : fields.slice(0, 4).map((field) => field.id),
    groupBy: groupFieldIds.includes(report.groupBy) ? report.groupBy : defaultGroupField(table, view),
    metric: fieldIds.includes(report.metric) ? report.metric : defaultMetricField(table),
    aggregation: reportAggregations().some((item) => item.id === report.aggregation) ? report.aggregation : "count",
    sortField: fieldIds.includes(report.sortField) ? report.sortField : "",
    sortDirection: report.sortDirection === "asc" ? "asc" : "desc",
    limit: Math.min(Math.max(Number(report.limit || 8), 1), 20),
    showOther: Boolean(report.showOther),
    showTable: report.showTable !== false,
    sourceRowIds: Array.isArray(report.sourceRowIds) ? report.sourceRowIds.filter(Boolean) : [],
    sourceLabel: report.sourceLabel || "",
    conditions: (report.conditions || []).filter((condition) => conditionFields(table).some((field) => field.id === condition.field)).map((condition, index) => ({
      join: index === 0 ? "and" : condition.join || "and",
      field: condition.field,
      operator: condition.operator || "contains",
      value: condition.value || "",
    })),
  };
}

function defaultReportDraft() {
  return normalizeReportDefinition({
    name: "Новый отчет",
    table: "deals",
    view: "bar",
    groupBy: "status",
    metric: "value",
    aggregation: "sum",
  });
}

function defaultReportCondition(table) {
  return { join: "and", field: conditionFields(table)[0]?.id || "name", operator: "contains", value: "" };
}

function customReportMeta(report) {
  return {
    id: report.id,
    label: report.name,
    description: `${tableDefs[report.table]?.label || "CRM"} · ${reportViewLabel(report.view)}`,
  };
}

function knownReportId(id) {
  return reportTypes.some((report) => report.id === id) || customReports.some((report) => `custom:${report.id}` === id);
}

function reportRows(table) {
  return visibleRows(table);
}

function passesReportConditions(table, row, conditions) {
  const normalized = conditions.filter((condition) => condition.operator === "empty" || condition.operator === "not_empty" || clean(condition.value));
  if (!normalized.length) return true;
  return normalized.reduce((result, condition, index) => {
    const matches = matchesCondition(table, row, condition);
    if (index === 0) return matches;
    return condition.join === "or" ? result || matches : result && matches;
  }, true);
}

function sortReportRows(report, rows) {
  if (!report.sortField) return rows;
  const field = reportSourceFields(report.table).find((item) => item.id === report.sortField);
  if (!field) return rows;
  return rows.slice().sort((left, right) => {
    const result = compareValues(field.value(left), field.value(right));
    return report.sortDirection === "asc" ? result : -result;
  });
}

function reportRowConditions(table, row, fields, baseConditions) {
  const conditionFieldIds = conditionFields(table).map((field) => field.id);
  const field = fields.find((item) => conditionFieldIds.includes(item.id) && clean(item.value(row)));
  if (!field) return baseConditions;
  return [...baseConditions, { join: "and", field: field.id, operator: "equals", value: field.value(row) }];
}

function aggregateReportValue(rows, metricField, aggregation) {
  if (aggregation === "count" || !metricField) return rows.length;
  const values = rows.map((row) => metricField.value(row)).filter((value) => value !== undefined && value !== null && value !== "");
  if (aggregation === "unique") return new Set(values.map(clean)).size;
  const numbers = values.map(Number).filter((value) => !Number.isNaN(value));
  if (!numbers.length) return 0;
  if (aggregation === "average") return Math.round(numbers.reduce((total, value) => total + value, 0) / numbers.length);
  if (aggregation === "min") return Math.min(...numbers);
  if (aggregation === "max") return Math.max(...numbers);
  return numbers.reduce((total, value) => total + value, 0);
}

function formatReportMetric(value, aggregation, metricField) {
  if (metricField && moneyFields().includes(metricField.id) && aggregation !== "count" && aggregation !== "unique") return money.format(Number(value || 0));
  return value;
}

function formatReportCell(value, fieldId) {
  if (moneyFields().includes(fieldId)) return money.format(Number(value || 0));
  if (String(fieldId).toLowerCase().includes("date") || String(fieldId).endsWith("At")) return value ? formatDate(value) : "";
  return value;
}

function reportSourceFields(table) {
  const extras = {
    deals: [
      ["plan", "План", (deal) => deal.plan],
      ["cost", "Себестоимость", (deal) => deal.cost],
      ["discount", "Скидка", (deal) => deal.discount],
      ["loyaltyUsed", "Бонусы", (deal) => deal.loyaltyUsed],
      ["cashback", "Кешбэк", (deal) => deal.cashback],
      ["firstResponseMinutes", "Первый ответ, мин", (deal) => deal.firstResponseMinutes],
      ["createdAt", "Создано", (deal) => deal.createdAt],
      ["updatedAt", "Обновлено", (deal) => deal.updatedAt],
      ["paidAt", "Оплачено", (deal) => deal.paidAt],
    ],
    leads: [
      ["createdAt", "Создано", (lead) => lead.createdAt],
    ],
    contacts: [
      ["lastPurchaseAt", "Последняя покупка", (contact) => contact.lastPurchaseAt],
      ["csat", "CSAT", (contact) => contact.csat],
    ],
    companies: [
      ["createdAt", "Создано", (company) => company.createdAt],
    ],
  };
  const fields = [...conditionFields(table), ...(extras[table] || []).map(([id, label, value]) => ({ id, label, value }))];
  return [...new Map(fields.map((field) => [field.id, field])).values()];
}

function defaultGroupField(table, view) {
  if (view === "table") return "";
  return { deals: "status", leads: "source", tasks: "status", contacts: "geo", companies: "segment" }[table] || "";
}

function defaultMetricField(table) {
  return { deals: "value", leads: "", tasks: "", contacts: "age", companies: "value" }[table] || "";
}

function reportViewTypes() {
  return [
    { id: "bar", label: "Столбцы", description: "Сравнение групп по показателю" },
    { id: "pie", label: "Доли", description: "Распределение по категориям" },
    { id: "summary", label: "Сводка", description: "Карточки ключевых значений" },
    { id: "table", label: "Таблица", description: "Детальный список записей" },
  ];
}

function reportTypeIcon(type) {
  if (type === "pie") {
    return `
      <span class="report-type-icon pie-icon" aria-hidden="true">
        <i></i><i></i><i></i>
      </span>
    `;
  }

  if (type === "summary") {
    return `
      <span class="report-type-icon summary-icon" aria-hidden="true">
        <i></i><i></i><i></i>
      </span>
    `;
  }

  if (type === "table") {
    return `
      <span class="report-type-icon table-icon" aria-hidden="true">
        <i></i><i></i><i></i><i></i><i></i><i></i>
      </span>
    `;
  }

  return `
    <span class="report-type-icon bar-icon" aria-hidden="true">
      <i></i><i></i><i></i>
    </span>
  `;
}

function reportViewLabel(view) {
  return reportViewTypes().find((item) => item.id === view)?.label || "Отчет";
}

function reportAggregations() {
  return [
    { id: "count", label: "Количество" },
    { id: "sum", label: "Сумма" },
    { id: "average", label: "Среднее" },
    { id: "min", label: "Минимум" },
    { id: "max", label: "Максимум" },
    { id: "unique", label: "Уникальные значения" },
  ];
}

function aggregationLabel(id) {
  return reportAggregations().find((item) => item.id === id)?.label || "Показатель";
}

function moneyFields() {
  return ["value", "plan", "cost", "discount", "loyaltyUsed", "cashback"];
}

function chartColor(index) {
  return ["#2563eb", "#16a34a", "#f59e0b", "#dc2626", "#7c3aed", "#0891b2", "#be123c", "#4d7c0f"][index % 8];
}

function buildReport(id) {
  if (id?.startsWith("custom:")) {
    const report = customReports.find((item) => item.id === id.replace("custom:", ""));
    if (report) return customReportFromDefinition(report);
  }

  const range = periodRange(activePeriod);
  const dealsSource = visibleRows("deals");
  const leadsSource = visibleRows("leads");
  const deals = dealsSource.filter((deal) => isInsidePeriod(deal.createdAt, range) || isInsidePeriod(deal.updatedAt, range));
  const wonDeals = dealsSource.filter((deal) => deal.status === "won" && isInsidePeriod(deal.paidAt || deal.updatedAt || deal.createdAt, range));
  const leads = leadsSource.filter((lead) => isInsidePeriod(lead.createdAt, range));

  if (id === "salesFunnel") return salesFunnelReport(leads, deals, wonDeals);
  if (id === "revenuePlan") return revenuePlanReport(wonDeals);
  if (id === "productSales") return productSalesReport(wonDeals);
  if (id === "romi") return romiReport(wonDeals);
  if (id === "utmSources") return utmReport(leads, deals, wonDeals);
  if (id === "promos") return promoReport(wonDeals);
  if (id === "segments") return segmentReport();
  if (id === "churn") return churnReport(range);
  if (id === "rfm") return rfmReport();
  if (id === "loyalty") return loyaltyReport(wonDeals);
  if (id === "managers") return managerReport(deals, wonDeals);
  if (id === "serviceQuality") return serviceQualityReport();
  if (id === "tickets") return ticketsReport(range);
  return salesFunnelReport(leads, deals, wonDeals);
}

function salesFunnelReport(leads, deals, wonDeals) {
  const visits = Math.max(leads.length * 4 + 12, 1);
  const clicks = Math.max(leads.length * 2 + 5, 1);
  const qualified = leads.filter((lead) => lead.status === "qualified").length;
  const stages = [
    { stage: "Визиты сайта (оценка)", count: visits, conversion: 100, noDrill: true },
    { stage: "Клики по рекламе (оценка)", count: clicks, conversion: percent(clicks, visits), noDrill: true },
    { stage: "Лиды", count: leads.length, conversion: percent(leads.length, clicks), table: "leads", conditions: [], ids: idsOf(leads) },
    { stage: "Квалифицированы", count: qualified, conversion: percent(qualified, leads.length), table: "leads", conditions: [{ field: "status", operator: "equals", value: "qualified" }], ids: idsOf(leads.filter((lead) => lead.status === "qualified")) },
    { stage: "Сделки", count: deals.length, conversion: percent(deals.length, qualified), table: "deals", conditions: [], ids: idsOf(deals) },
    { stage: "Оплаты", count: wonDeals.length, conversion: percent(wonDeals.length, deals.length), table: "deals", conditions: [{ field: "status", operator: "equals", value: "won" }], ids: idsOf(wonDeals) },
  ];

  return {
    title: "Воронка продаж",
    targetTable: "deals",
    conditions: [],
    primary: `${percent(wonDeals.length, visits)}%`,
    caption: `${wonDeals.length} оплата из ${visits} визитов`,
    summary: [["Визитов", visits], ["Кликов", clicks], ["Оплат", wonDeals.length]],
    headings: ["Этап", "Количество", "Конверсия"],
    rows: stages.map((stage) => ({
      cells: [stage.stage, stage.count, `${stage.conversion}%`],
      table: stage.table,
      conditions: stage.conditions || [],
      ids: stage.ids || [],
      noDrill: stage.noDrill,
    })),
  };
}

function revenuePlanReport(wonDeals) {
  const fact = sum(wonDeals, "value");
  const plan = companyPlan(currentPlanPeriod()) || sum(wonDeals, "plan") || 300000;
  const deviation = fact - plan;
  const completion = percent(fact, plan);
  const indicatorClass = deviation >= 0 ? "positive" : "negative";
  return {
    title: "Выручка: план-факт",
    targetTable: "deals",
    conditions: [{ field: "status", operator: "equals", value: "won" }],
    primary: `${completion}%`,
    caption: `${money.format(fact)} из ${money.format(plan)}`,
    summary: [["Факт", money.format(fact)], ["План", money.format(plan)], ["Отклонение", money.format(deviation)]],
    headings: ["Показатель", "Сумма"],
    rows: [["План", money.format(plan)], ["Факт", money.format(fact)], ["Отклонение", money.format(fact - plan)]].map((cells) => ({ cells, conditions: [{ field: "status", operator: "equals", value: "won" }], ids: idsOf(wonDeals) })),
    visualHtml: `
      <div class="plan-fact-indicator ${indicatorClass}">
        <div>
          <span>${deviation >= 0 ? "План выполнен" : "Отставание от плана"}</span>
          <strong>${money.format(deviation)}</strong>
          <em>${completion}% выполнения</em>
        </div>
        <i><b style="width: ${Math.min(100, Math.max(0, completion))}%"></b></i>
      </div>
    `,
  };
}

function productSalesReport(wonDeals) {
  const reportItems = wonDeals.flatMap((deal) => {
    const items = dealProductItems(deal);
    if (!items.length) {
      return [{ deal, productName: "Без продукта", category: "Без категории", quantity: 1, revenue: Number(deal.value || 0), cost: dealCost(deal) }];
    }
    return items.map((item) => ({
      deal,
      productName: item.productName || "Без продукта",
      category: item.productCategory || "Без категории",
      quantity: Math.max(1, Number(item.quantity || 1)),
      revenue: Number(item.price || 0) * Math.max(1, Number(item.quantity || 1)),
      cost: dealItemCost(item),
    }));
  });

  const rows = groupedRows(reportItems, (item) => item.productName).map(([productName, items]) => {
    const revenue = items.reduce((total, item) => total + item.revenue, 0);
    const cost = items.reduce((total, item) => total + item.cost, 0);
    const quantity = items.reduce((total, item) => total + item.quantity, 0);
    const category = items[0]?.category || "Без категории";
    const profit = revenue - cost;
    const dealIds = [...new Set(items.map((item) => item.deal.id))];
    return { cells: [productName, category, quantity, money.format(revenue), money.format(cost), money.format(profit)], conditions: [{ field: "status", operator: "equals", value: "won" }, { join: "and", field: "productName", operator: "contains", value: productName }], ids: dealIds };
  });

  return {
    title: "Продажи по продуктам",
    targetTable: "deals",
    conditions: [{ field: "status", operator: "equals", value: "won" }],
    primary: money.format(sum(wonDeals, "value")),
    caption: "выручка оплаченных сделок",
    summary: [["Категорий", rows.length], ["Оплат", wonDeals.length]],
    headings: ["Продукт", "Категория", "Продаж", "Выручка", "Себестоимость", "Прибыль"],
    rows,
  };
}

function romiReport(wonDeals) {
  const rows = groupedRows(state.campaigns, (campaign) => campaign.source).map(([source, campaigns]) => {
    const campaignIds = campaigns.map((item) => item.id);
    const sourceWon = wonDeals.filter((deal) => campaignIds.includes(deal.campaignId));
    const revenue = sum(sourceWon, "value");
    const cost = sum(campaigns, "cost");
    return { cells: [source, money.format(cost), money.format(revenue), `${percent(revenue - cost, cost)}%`], conditions: [{ field: "status", operator: "equals", value: "won" }, { join: "and", field: "utmSource", operator: "equals", value: source }], ids: idsOf(sourceWon) };
  });

  return {
    title: "ROMI и эффективность каналов",
    targetTable: "deals",
    conditions: [],
    primary: rows[0]?.cells?.[3] || "0%",
    caption: "лучший канал по ROMI",
    summary: [["Каналов", rows.length], ["Затраты", money.format(sum(state.campaigns, "cost"))]],
    headings: ["Канал", "Затраты", "Выручка", "ROMI"],
    rows,
  };
}

function utmReport(leads, deals, wonDeals) {
  const rows = groupedRows([...leads, ...deals], (item) => item.utmSource || item.source || "direct").map(([source, items]) => {
    const sourceWon = wonDeals.filter((deal) => (deal.utmSource || deal.source || "direct") === source);
    return { cells: [source, items.length, sourceWon.length, money.format(sum(sourceWon, "value"))], table: "leads", conditions: [{ field: "utmSource", operator: "equals", value: source }], ids: idsOf(items.filter((item) => state.leads.some((lead) => lead.id === item.id))) };
  });

  return {
    title: "Источники трафика и UTM",
    targetTable: "leads",
    conditions: [],
    primary: rows[0]?.cells?.[0] || "Нет данных",
    caption: "самый активный источник",
    summary: [["Источников", rows.length], ["Лидов и сделок", leads.length + deals.length]],
    headings: ["Источник", "Активность", "Оплаты", "Выручка"],
    rows,
  };
}

function promoReport(wonDeals) {
  const promoDeals = wonDeals.filter((deal) => deal.promoCode);
  const rows = groupedRows(promoDeals, (deal) => deal.promoCode).map(([promo, items]) => ({
    cells: [promo, items.length, money.format(sum(items, "discount")), money.format(sum(items, "value"))],
    conditions: [{ field: "status", operator: "equals", value: "won" }, { join: "and", field: "promoCode", operator: "equals", value: promo }],
    ids: idsOf(items),
  }));

  return {
    title: "Промокоды и акции",
    targetTable: "deals",
    conditions: [{ field: "promoCode", operator: "not_empty", value: "" }],
    primary: `${promoDeals.length}`,
    caption: "оплат с промокодом",
    summary: [["Скидки", money.format(sum(promoDeals, "discount"))], ["Выручка", money.format(sum(promoDeals, "value"))]],
    headings: ["Промокод", "Оплат", "Скидки", "Выручка"],
    rows,
  };
}

function segmentReport() {
  const contactsSource = visibleRows("contacts");
  const rows = groupedRows(contactsSource, (contact) => `${contact.geo || "Не указан"} / ${contact.interest || "Без интереса"}`).map(([segment, contacts]) => {
    const [geo, interest] = segment.split(" / ");
    return { cells: [segment, contacts.length, average(contacts, "age"), money.format(contactRevenue(contacts))], table: "contacts", conditions: [{ field: "geo", operator: "equals", value: geo }, { join: "and", field: "interest", operator: "equals", value: interest }], ids: idsOf(contacts) };
  });

  return {
    title: "Сегментация клиентской базы",
    targetTable: "contacts",
    conditions: [],
    primary: `${rows.length}`,
    caption: "активных сегментов",
    summary: [["Контактов", contactsSource.length], ["Средний возраст", average(contactsSource, "age")]],
    headings: ["Сегмент", "Контакты", "Средний возраст", "Выручка"],
    rows,
  };
}

function churnReport(range) {
  const staleBefore = new Date(range.end);
  staleBefore.setDate(staleBefore.getDate() - 30);
  const contactsSource = visibleRows("contacts");
  const rows = contactsSource
    .filter((contact) => !contact.lastPurchaseAt || new Date(contact.lastPurchaseAt) < staleBefore)
    .map((contact) => ({ cells: [contact.name, companyById(contact.companyId)?.name || "", contact.lastPurchaseAt ? formatDate(contact.lastPurchaseAt) : "Нет покупок", contact.loyaltyTier || "Без уровня"], table: "contacts", conditions: [{ field: "name", operator: "equals", value: contact.name }], ids: [contact.id] }));

  return {
    title: "Отток клиентов",
    targetTable: "contacts",
    conditions: [],
    primary: `${percent(rows.length, contactsSource.length)}%`,
    caption: "клиентов в риске",
    summary: [["В риске", rows.length], ["Всего контактов", contactsSource.length]],
    headings: ["Контакт", "Компания", "Последняя покупка", "Лояльность"],
    rows,
  };
}

function rfmReport() {
  const rows = visibleRows("contacts").map((contact) => {
    const deals = visibleRows("deals").filter((deal) => deal.contactId === contact.id && deal.status === "won");
    const monetary = sum(deals, "value");
    const last = deals.map((deal) => new Date(deal.paidAt || deal.updatedAt || deal.createdAt)).sort((a, b) => b - a)[0];
    const recency = last ? Math.round((Date.now() - last.getTime()) / 86400000) : 999;
    const segment = monetary > 100000 && deals.length > 1 ? "VIP" : recency > 30 ? "Риск ухода" : "Активный";
    return { cells: [contact.name, recency, deals.length, money.format(monetary), segment], table: "contacts", conditions: [{ field: "name", operator: "equals", value: contact.name }], ids: [contact.id] };
  });

  return {
    title: "RFM-анализ",
    targetTable: "contacts",
    conditions: [],
    primary: `${rows.filter((row) => row.cells[4] === "VIP").length}`,
    caption: "VIP-клиентов",
    summary: [["Контактов", rows.length], ["В риске", rows.filter((row) => row.cells[4] === "Риск ухода").length]],
    headings: ["Контакт", "Recency, дней", "Frequency", "Monetary", "Сегмент"],
    rows,
  };
}

function loyaltyReport(wonDeals) {
  const contactsSource = visibleRows("contacts");
  const rows = groupedRows(contactsSource, (contact) => contact.loyaltyTier || "Без уровня").map(([tier, contacts]) => {
    const contactIds = contacts.map((contact) => contact.id);
    const deals = wonDeals.filter((deal) => contactIds.includes(deal.contactId));
    return { cells: [tier, contacts.length, money.format(sum(deals, "loyaltyUsed")), money.format(sum(deals, "cashback"))], table: "contacts", conditions: [{ field: "loyaltyTier", operator: "equals", value: tier }], ids: idsOf(contacts) };
  });

  return {
    title: "Программа лояльности",
    targetTable: "contacts",
    conditions: [{ field: "loyaltyTier", operator: "not_empty", value: "" }],
    primary: money.format(sum(wonDeals, "loyaltyUsed")),
    caption: "использовано бонусов",
    summary: [["Участников", contactsSource.filter((contact) => contact.loyaltyTier).length], ["Кешбэк", money.format(sum(wonDeals, "cashback"))]],
    headings: ["Уровень", "Клиентов", "Бонусы", "Кешбэк"],
    rows,
  };
}

function managerReport(deals, wonDeals) {
  const rows = groupedRows(deals, (deal) => deal.manager || "Не назначен").map(([manager, items]) => {
    const managerWon = wonDeals.filter((deal) => (deal.manager || "Не назначен") === manager);
    return { cells: [manager, items.length, average(items, "firstResponseMinutes"), money.format(sum(managerWon, "value"))], conditions: [{ field: "manager", operator: "equals", value: manager }], ids: idsOf(items) };
  });

  return {
    title: "Эффективность менеджеров",
    targetTable: "deals",
    conditions: [],
    primary: rows[0]?.cells?.[0] || "Нет данных",
    caption: "лидер по обработке",
    summary: [["Менеджеров", rows.length], ["Продажи", money.format(sum(wonDeals, "value"))]],
    headings: ["Менеджер", "Заявок", "Средний ответ, мин", "Продажи"],
    rows,
  };
}

function serviceQualityReport() {
  const contactsSource = visibleRows("contacts");
  const rows = contactsSource.map((contact) => ({ cells: [contact.name, contact.nps, contact.csat, contact.manager || "Не назначен"], table: "contacts", conditions: [{ field: "name", operator: "equals", value: contact.name }], ids: [contact.id] }));
  return {
    title: "NPS и CSAT",
    targetTable: "contacts",
    conditions: [],
    primary: average(contactsSource, "nps"),
    caption: "средний NPS",
    summary: [["CSAT", average(contactsSource, "csat")], ["Оценок", contactsSource.length]],
    headings: ["Контакт", "NPS", "CSAT", "Менеджер"],
    rows,
  };
}

function ticketsReport(range) {
  const contactIds = new Set(visibleRows("contacts").map((contact) => contact.id));
  const tickets = state.tickets.filter((ticket) => contactIds.has(ticket.contactId) && isInsidePeriod(ticket.createdAt, range));
  const rows = groupedRows(tickets, (ticket) => ticket.category).map(([category, items]) => ({ cells: [
    category,
    items.length,
    items.filter((ticket) => ticket.status === "open").length,
    average(items, "resolutionHours"),
  ], table: "contacts", conditions: [], ids: items.map((ticket) => ticket.contactId).filter(Boolean) }));

  return {
    title: "Обращения и тикеты",
    targetTable: "contacts",
    conditions: [],
    primary: `${tickets.length}`,
    caption: "обращений за период",
    summary: [["Открыто", tickets.filter((ticket) => ticket.status === "open").length], ["Тем", rows.length]],
    headings: ["Проблема", "Обращений", "Открыто", "Решение, ч"],
    rows,
  };
}

function reportHtml(report) {
  return `
    <article class="report-card">
      <div class="section-head compact-head">
        <div>
          <p class="eyebrow">Отчет</p>
          <h2>${escapeHtml(report.title)}</h2>
        </div>
        <div class="report-head-actions">
          ${report.customId ? `
            <button class="button light compact" type="button" data-edit-custom-report="${report.customId}">Изменить</button>
            <button class="button light compact" type="button" data-delete-custom-report="${report.customId}">Удалить</button>
          ` : ""}
          <strong>${escapeHtml(report.primary || "")}</strong>
        </div>
      </div>
      <div class="report-summary">
        ${(report.summary || []).map(([label, value]) => `<div><span>${escapeHtml(label)}</span><strong>${escapeHtml(value)}</strong></div>`).join("")}
      </div>
      ${report.visualHtml || ""}
      ${report.showTable === false ? "" : reportTableHtml(report)}
    </article>
  `;
}

function reportTableHtml(report) {
  const rows = report.rows.length ? report.rows : [{ cells: ["Нет данных", "", "", ""], conditions: report.conditions || [], table: report.targetTable || "deals" }];
  return `
    <div class="table-scroll">
      <table class="data-table">
        <thead>
          <tr>${report.headings.map((heading) => `<th>${heading}</th>`).join("")}</tr>
        </thead>
        <tbody>
          ${rows.map((row) => {
            const normalized = Array.isArray(row) ? { cells: row, conditions: report.conditions || [], table: report.targetTable || "deals" } : row;
            const canDrill = !normalized.noDrill;
            return `
              <tr class="${canDrill ? "clickable-row" : "static-row"}" ${canDrill ? `data-drilldown="${drillPayload(normalized.table || report.targetTable || "deals", normalized.conditions || report.conditions || [], normalized.ids || [])}"` : ""}>
                ${normalized.cells.map((cell) => `<td>${typeof cell === "string" && cell.includes("<") ? cell : escapeHtml(cell)}</td>`).join("")}
              </tr>
            `;
          }).join("")}
        </tbody>
      </table>
    </div>
  `;
}

function sourceStats(leads) {
  const map = new Map();
  leads.forEach((lead) => map.set(lead.source || "CRM", (map.get(lead.source || "CRM") || 0) + 1));
  return [...map.entries()].sort((a, b) => b[1] - a[1]);
}

function upcomingTasks() {
  const end = new Date();
  end.setDate(end.getDate() + 3);
  end.setHours(23, 59, 59, 999);
  return visibleRows("tasks")
    .filter((task) => task.status !== "done")
    .filter((task) => {
      const date = new Date(task.reminderAt || task.dueAt || task.createdAt);
      return !Number.isNaN(date.getTime()) && date <= end;
    })
    .sort((a, b) => new Date(a.dueAt || a.reminderAt) - new Date(b.dueAt || b.reminderAt))
    .slice(0, 6);
}

function taskDueToday(task) {
  return isToday(task.dueAt || task.reminderAt);
}

function isToday(value) {
  if (!value) return false;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return false;
  const start = startOfToday();
  const end = new Date(start);
  end.setDate(end.getDate() + 1);
  return date >= start && date < end;
}

function isAuthenticated() {
  return Boolean(signedInUser());
}

function signedInUser() {
  return userById(authenticatedUserId);
}

function currentUser() {
  const auth = signedInUser();
  if (!auth) return state.users[0] || defaultUsers()[0];
  if (auth.role !== "vip") return auth;
  return userById(activeUserId) || auth;
}

function userById(id) {
  return state.users.find((user) => user.id === id);
}

function authenticateUser(login, password) {
  const normalizedLogin = clean(login).toLowerCase();
  const normalizedPassword = clean(password);
  return state.users.find((user) => {
    const aliases = [user.login, user.email, user.id].map((value) => clean(value).toLowerCase()).filter(Boolean);
    return user.active !== false && aliases.includes(normalizedLogin) && String(user.password || "") === normalizedPassword;
  });
}

function normalizeAuthenticatedUserId(id) {
  return userById(id)?.id || "";
}

function roleLabel(role) {
  return userRoles.find((item) => item.id === role)?.label || role || "";
}

function cabinetVisibleUsers(user) {
  if (user.role === "vip") return state.users;
  if (user.role === "leader") return state.users.filter((item) => item.id === user.id || item.supervisorId === user.id);
  return state.users.filter((item) => item.id === user.id);
}

function cabinetSupervisorOptions(user) {
  if (user.role === "vip") return state.users.filter((item) => ["vip", "leader"].includes(item.role));
  return [user];
}

function visibleRows(tableId) {
  const rows = state[tableId] || [];
  return rows.filter((row) => canAccessRecord(tableDefs[tableId]?.recordType || tableId.replace(/s$/, ""), row));
}

function canAccessRecord(type, record) {
  if (!record || !isAuthenticated()) return false;
  if (type === "deal" || type === "deals") return canAccessDeal(record);
  if (type === "lead" || type === "leads") return canAccessLead(record);
  if (type === "task" || type === "tasks") return canAccessTask(record);
  if (type === "contact" || type === "contacts") return canAccessContact(record);
  if (type === "company" || type === "companies") return canAccessCompany(record);
  return signedInUser()?.role === "vip";
}

function managedManagerNames(user = currentUser()) {
  if (user.role === "vip") return state.users.filter((item) => item.role === "manager").map((item) => item.name);
  if (user.role === "leader") {
    return [user.name, ...state.users
      .filter((item) => item.role === "manager" && item.supervisorId === user.id)
      .map((item) => item.name)];
  }
  return [user.name];
}

function managerNameAllowed(name, user = currentUser()) {
  if (user.role === "vip") return true;
  return managedManagerNames(user).includes(clean(name));
}

function canAccessDeal(deal, user = currentUser()) {
  if (user.role === "vip") return true;
  return managerNameAllowed(deal.manager, user);
}

function canAccessLead(lead, user = currentUser()) {
  if (user.role === "vip") return true;
  if (lead.manager && managerNameAllowed(lead.manager, user)) return true;
  const relatedDeal = state.deals.find((deal) => deal.leadId === lead.id);
  if (relatedDeal && canAccessDeal(relatedDeal, user)) return true;
  const contact = contactById(lead.contactId);
  return Boolean(contact?.manager && managerNameAllowed(contact.manager, user));
}

function canAccessTask(task, user = currentUser()) {
  if (user.role === "vip") return true;
  if (task.manager && managerNameAllowed(task.manager, user)) return true;
  const deal = dealById(task.dealId);
  if (deal && canAccessDeal(deal, user)) return true;
  const lead = leadById(task.leadId);
  return Boolean(lead && canAccessLead(lead, user));
}

function canAccessContact(contact, user = currentUser()) {
  if (user.role === "vip") return true;
  if (contact.manager && managerNameAllowed(contact.manager, user)) return true;
  return state.deals.some((deal) => deal.contactId === contact.id && canAccessDeal(deal, user))
    || state.leads.some((lead) => lead.contactId === contact.id && canAccessLead(lead, user))
    || state.tasks.some((task) => task.contactId === contact.id && canAccessTask(task, user));
}

function canAccessCompany(company, user = currentUser()) {
  if (user.role === "vip") return true;
  if (company.manager && managerNameAllowed(company.manager, user)) return true;
  return state.contacts.some((contact) => contact.companyId === company.id && canAccessContact(contact, user))
    || state.deals.some((deal) => deal.companyId === company.id && canAccessDeal(deal, user))
    || state.leads.some((lead) => lead.companyId === company.id && canAccessLead(lead, user))
    || state.tasks.some((task) => task.companyId === company.id && canAccessTask(task, user));
}

function defaultRecordManager() {
  const user = currentUser();
  if (user.role === "manager") return user.name;
  if (user.role === "leader") return state.users.find((item) => item.role === "manager" && item.supervisorId === user.id)?.name || user.name;
  return state.users.find((item) => item.role === "manager")?.name || user.name;
}

function assignableTaskManagers(user = currentUser()) {
  if (user.role === "vip") return state.users.filter((item) => item.role === "manager" && item.active !== false);
  if (user.role === "leader") return state.users.filter((item) => item.role === "manager" && item.supervisorId === user.id && item.active !== false);
  return [user];
}

function normalizeTaskManager(value) {
  const requested = clean(value);
  const options = assignableTaskManagers();
  return options.some((user) => user.name === requested)
    ? requested
    : options[0]?.name || defaultRecordManager();
}

function taskManagerSelectHtml(value) {
  const selected = normalizeTaskManager(value);
  const options = assignableTaskManagers();
  if (currentUser().role === "manager") {
    return `<input name="manager" value="${escapeHtml(selected)}" readonly>`;
  }
  return `<select name="manager">${options.map((user) => `<option value="${escapeHtml(user.name)}" ${user.name === selected ? "selected" : ""}>${escapeHtml(user.name)}</option>`).join("")}</select>`;
}

function canManageUserPlan(current, user) {
  if (current.role === "vip") return true;
  if (current.role === "leader") return user.supervisorId === current.id;
  return current.id === user.id;
}

function currentPlanPeriod() {
  return new Date().toISOString().slice(0, 7);
}

function companyPlanRecord(period) {
  return state.salesPlans.find((item) => (item.scope || (item.userId ? "manager" : "company")) === "company" && item.period === period);
}

function companyPlan(period) {
  return companyPlanRecord(period)?.amount || 0;
}

function hasCompanyPlan(period) {
  return Boolean(companyPlanRecord(period));
}

function managerPlansTotal(period, overrideUserId = "", overrideAmount = null) {
  const plans = state.salesPlans.filter((item) => (item.scope || "manager") === "manager" && item.period === period);
  const total = plans.reduce((sum, plan) => {
    if (overrideUserId && plan.userId === overrideUserId) return sum;
    return sum + Number(plan.amount || 0);
  }, 0);
  return total + (overrideUserId ? Math.max(0, Number(overrideAmount || 0)) : 0);
}

function companySalesFact(period) {
  return sum(state.deals.filter((deal) => {
    const paidAt = deal.paidAt || deal.updatedAt || deal.createdAt;
    return deal.status === "won" && String(paidAt || "").startsWith(period);
  }), "value");
}

function managerResult(user, period) {
  const plan = state.salesPlans.find((item) => (item.scope || "manager") === "manager" && item.userId === user.id && item.period === period)?.amount || 0;
  const deals = state.deals.filter((deal) => {
    const paidAt = deal.paidAt || deal.updatedAt || deal.createdAt;
    return deal.status === "won" && deal.manager === user.name && String(paidAt || "").startsWith(period);
  });
  return {
    user,
    plan,
    fact: sum(deals, "value"),
    deals: deals.length,
  };
}

function periodRange(period) {
  const now = new Date();
  const start = new Date(now);

  if (period === "day") start.setHours(0, 0, 0, 0);
  if (period === "week") start.setDate(now.getDate() - 6);
  if (period === "month") start.setMonth(now.getMonth() - 1);
  if (period === "quarter") start.setMonth(now.getMonth() - 3);
  if (period === "year") start.setFullYear(now.getFullYear() - 1);

  if (period !== "day") start.setHours(0, 0, 0, 0);
  return { start, end: now };
}

function isInsidePeriod(value, range) {
  if (!value) return false;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return false;
  return date >= range.start && date <= range.end;
}

function periodLabel(period) {
  return {
    day: "за день",
    week: "за неделю",
    month: "за месяц",
    quarter: "за квартал",
    year: "за год",
  }[period];
}

function openCreateDialog(type, defaults = {}) {
  const dialog = document.querySelector("[data-dialog]");
  const form = document.querySelector("[data-dialog-form]");
  if (!dialog || !form) return;
  dialog.classList.remove("object-record-dialog");
  prepareDialogForm(form);

  if (type === "lead") {
    form.innerHTML = `
      <div class="dialog-head">
        <h2>Новый лид</h2>
        <button class="button light compact" type="button" data-dialog-close>Закрыть</button>
      </div>
      <label>Имя контакта <input name="name" required></label>
      <label>Компания <input name="company" placeholder="Частный клиент"></label>
      <label>Телефон <input name="phone"></label>
      <label>Email <input name="email" type="email"></label>
      <label>Источник <select name="source"><option>Сайт</option><option>Почта</option><option>Звонок</option><option>Мессенджер</option><option>Рекомендация</option></select></label>
      <label>Запрос <textarea name="need" rows="3"></textarea></label>
      <button class="button primary" value="submit">Добавить лид</button>
    `;
    form.onsubmit = (event) => {
      event.preventDefault();
      const lead = createLeadFromPerson(formObject(form));
      selectedRecord = { type: "lead", id: lead.id };
      dialog.close();
      goToScreen("leads");
    };
  }

  if (type === "deal") {
    const contacts = visibleRows("contacts");
    const initialContact = contacts[0];
    form.innerHTML = `
      <div class="dialog-head">
        <h2>Новая сделка</h2>
        <button class="button light compact" type="button" data-dialog-close>Закрыть</button>
      </div>
      <label>Контакт <select name="contactId" data-create-deal-contact>${contacts.map((contact) => `<option value="${contact.id}">${escapeHtml(contact.name)}</option>`).join("")}</select></label>
      <label>Компания <select name="companyId" data-create-deal-company>${visibleRows("companies").map((company) => `<option value="${company.id}" ${company.id === initialContact?.companyId ? "selected" : ""}>${escapeHtml(company.name)}</option>`).join("")}</select></label>
      <label>Название <input name="title" required></label>
      <label>Бюджет <input name="value" type="number" min="0" step="any"></label>
      <label>Продукт <select name="productId"><option value="">Без продукта</option>${state.products.map((product) => `<option value="${product.id}">${escapeHtml(product.name)} · ${escapeHtml(product.sku || "без ID")}</option>`).join("")}</select></label>
      <label>Источник <select name="source"><option>CRM</option><option>Сайт</option><option>Почта</option><option>Звонок</option><option>Мессенджер</option></select></label>
      <label>Следующий шаг <textarea name="need" rows="3"></textarea></label>
      <button class="button primary" value="submit">Добавить сделку</button>
    `;
    form.onsubmit = (event) => {
      event.preventDefault();
      const deal = createDeal(formObject(form));
      if (!deal) return;
      selectedRecord = { type: "deal", id: deal.id };
      dialog.close();
      goToScreen("deals");
    };
    syncCreateDealCompany(form);
  }

  if (type === "task") {
    form.innerHTML = `
      <div class="dialog-head">
        <h2>Новая задача</h2>
        <button class="button light compact" type="button" data-dialog-close>Закрыть</button>
      </div>
      <label>Задача <input name="title" required></label>
      <div class="card-field-grid">
        <label>Статус <select name="status">${taskStatuses.map((status) => `<option value="${status.id}">${escapeHtml(status.label)}</option>`).join("")}</select></label>
        <label>Менеджер ${taskManagerSelectHtml(defaultRecordManager())}</label>
      </div>
      <div class="card-field-grid">
        <label>Срок <input name="dueAt" type="date" value="${dateInput(new Date(Date.now() + 86400000).toISOString())}"></label>
        <label>Напомнить <input name="reminderAt" type="date" value="${dateInput(new Date().toISOString())}"></label>
      </div>
      <div class="card-field-grid">
        <label>Сделка <select name="dealId">${optionList("Без сделки", visibleRows("deals").map((deal) => ({ id: deal.id, label: deal.title }))).replace(`value="${defaults.dealId || ""}"`, `value="${defaults.dealId || ""}" selected`)}</select></label>
        <label>Лид <select name="leadId">${optionList("Без лида", visibleRows("leads").map((lead) => ({ id: lead.id, label: lead.need || lead.source }))).replace(`value="${defaults.leadId || ""}"`, `value="${defaults.leadId || ""}" selected`)}</select></label>
      </div>
      <div class="card-field-grid">
        <label>Контакт <select name="contactId">${optionList("Без контакта", visibleRows("contacts").map((contact) => ({ id: contact.id, label: contact.name }))).replace(`value="${defaults.contactId || ""}"`, `value="${defaults.contactId || ""}" selected`)}</select></label>
        <label>Компания <select name="companyId">${optionList("Без компании", visibleRows("companies").map((company) => ({ id: company.id, label: company.name }))).replace(`value="${defaults.companyId || ""}"`, `value="${defaults.companyId || ""}" selected`)}</select></label>
      </div>
      <label>Описание <textarea name="description" rows="3"></textarea></label>
      <button class="button primary" value="submit">Добавить задачу</button>
    `;
    form.onsubmit = (event) => {
      event.preventDefault();
      const task = createTask(formObject(form));
      selectedRecord = { type: "task", id: task.id };
      dialog.close();
      goToScreen("tasks");
    };
  }

  if (type === "contact") {
    form.innerHTML = `
      <div class="dialog-head">
        <h2>Новый контакт</h2>
        <button class="button light compact" type="button" data-dialog-close>Закрыть</button>
      </div>
      <label>Имя <input name="name" required></label>
      <label>Компания <select name="companyId">${visibleRows("companies").map((company) => `<option value="${company.id}">${escapeHtml(company.name)}</option>`).join("")}</select></label>
      <label>Роль <input name="role" value="Покупатель"></label>
      <label>Телефон <input name="phone"></label>
      <label>Email <input name="email" type="email"></label>
      <button class="button primary" value="submit">Добавить контакт</button>
    `;
    form.onsubmit = (event) => {
      event.preventDefault();
      const contact = createContact(formObject(form));
      selectedRecord = { type: "contact", id: contact.id };
      dialog.close();
      goToScreen("contacts");
    };
  }

  if (type === "company") {
    form.innerHTML = `
      <div class="dialog-head">
        <h2>Новый клиент</h2>
        <button class="button light compact" type="button" data-dialog-close>Закрыть</button>
      </div>
      <label>Название <input name="name" required></label>
      <label>Сегмент <input name="segment" value="B2C"></label>
      <label>Отрасль <input name="industry" value="Частный клиент"></label>
      <label>Город <input name="city"></label>
      <label>Телефон <input name="phone"></label>
      <label>Email <input name="email" type="email"></label>
      <button class="button primary" value="submit">Добавить клиента</button>
    `;
    form.onsubmit = (event) => {
      event.preventDefault();
      const company = createCompany(formObject(form));
      selectedRecord = { type: "company", id: company.id };
      dialog.close();
      goToScreen("companies");
    };
  }

  dialog.showModal();
}

function prepareDialogForm(form) {
  form.onsubmit = null;
  form.className = "dialog-card";
  delete form.dataset.leadCardForm;
  delete form.dataset.dealCardForm;
  delete form.dataset.contactCardForm;
  delete form.dataset.companyCardForm;
  delete form.dataset.taskCardForm;
  delete form.dataset.listSettingsForm;
}

function goToScreen(screen) {
  activeScreen = normalizeScreen(screen);
  location.hash = activeScreen;
  render();
}

function drillPayload(table, conditions, ids = []) {
  return encodeURIComponent(JSON.stringify({ table, conditions: conditions || [], ids: ids || [] }));
}

function openDrilldown(payload) {
  try {
    const drilldown = JSON.parse(decodeURIComponent(payload));
    const table = drilldown.table || "deals";
    const ids = Array.isArray(drilldown.ids) ? drilldown.ids.filter(Boolean) : [];
    const conditions = (drilldown.conditions || []).map((condition, index) => ({
      join: index === 0 ? "and" : condition.join || "and",
      field: condition.field,
      operator: condition.operator || "equals",
      value: condition.value || "",
    }));

    if (!conditionBuilders[table]) conditionBuilders[table] = defaultConditionBuilder();
    conditionBuilders[table].conditions = conditions;
    tableDrillLocks[table] = ids;
    tableFilters[table] = emptyFilters();
    saveConditionBuilders();
    goToScreen(table);
  } catch {
  }
}

function normalizeScreen(screen) {
  return ["dashboard", "deals", "kanban", "leads", "tasks", "contacts", "companies", "products", "cabinet", "reports", "mail"].includes(screen) ? screen : "dashboard";
}

function screenForRecordType(type) {
  return {
    deal: "deals",
    lead: "leads",
    task: "tasks",
    contact: "contacts",
    company: "companies",
  }[type] || "dashboard";
}

function emptyFilters() {
  return { query: "", status: "", source: "", companyId: "", contactId: "", minValue: "", maxValue: "" };
}

function optionList(emptyLabel, options) {
  const normalized = options.map((option) => {
    if (typeof option === "string") return { id: option, label: option };
    return option;
  });
  return [
    `<option value="">${emptyLabel}</option>`,
    ...normalized.map((option) => `<option value="${escapeHtml(option.id)}">${escapeHtml(option.label)}</option>`),
  ].join("");
}

function unique(values) {
  return [...new Set(values.filter(Boolean))];
}

function companyById(id) {
  return state.companies.find((company) => company.id === id);
}

function contactById(id) {
  return state.contacts.find((contact) => contact.id === id);
}

function leadById(id) {
  return state.leads.find((lead) => lead.id === id);
}

function dealById(id) {
  return state.deals.find((deal) => deal.id === id);
}

function taskById(id) {
  return state.tasks.find((task) => task.id === id);
}

function getRecord(type, id) {
  if (type === "deal") return dealById(id);
  if (type === "lead") return leadById(id);
  if (type === "task") return taskById(id);
  if (type === "contact") return contactById(id);
  if (type === "company") return companyById(id);
  return null;
}

function labelById(items, id) {
  return items.find((item) => item.id === id)?.label || id || "";
}

function leadStatusLabel(lead) {
  const label = labelById(leadStatuses, lead.status);
  if (lead.status === "disqualified" && lead.disqualificationReason) return `${label}: ${lead.disqualificationReason}`;
  return label;
}

function taskStatusLabel(task) {
  if (task.status !== "done" && task.dueAt && new Date(task.dueAt) < startOfToday()) return "Просрочено";
  return labelById(taskStatuses, task.status);
}

function isTaskDueSoon(task) {
  if (!task.dueAt || task.status === "done") return false;
  const due = new Date(task.dueAt);
  const soon = new Date();
  soon.setDate(soon.getDate() + 2);
  soon.setHours(23, 59, 59, 999);
  return due <= soon;
}

function startOfToday() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today;
}

function relatedTasks({ dealId = "", leadId = "", contactId = "", companyId = "" }) {
  return visibleRows("tasks").filter((task) => {
    return (dealId && task.dealId === dealId)
      || (leadId && task.leadId === leadId)
      || (contactId && task.contactId === contactId)
      || (companyId && task.companyId === companyId);
  });
}

function groupedRows(items, keyFn) {
  const map = new Map();
  items.forEach((item) => {
    const key = keyFn(item) || "Не указано";
    if (!map.has(key)) map.set(key, []);
    map.get(key).push(item);
  });
  return [...map.entries()].sort((a, b) => b[1].length - a[1].length);
}

function sum(items, field) {
  return items.reduce((total, item) => total + Number(item[field] || 0), 0);
}

function average(items, field) {
  const values = items.map((item) => Number(item[field] || 0)).filter((value) => value > 0);
  if (!values.length) return 0;
  return Math.round(values.reduce((total, value) => total + value, 0) / values.length);
}

function percent(value, total) {
  if (!total) return 0;
  return Math.round((Number(value || 0) / Number(total || 1)) * 100);
}

function contactRevenue(contacts) {
  const ids = contacts.map((contact) => contact.id);
  return sum(visibleRows("deals").filter((deal) => ids.includes(deal.contactId) && deal.status === "won"), "value");
}

function productById(id) {
  return state.products.find((product) => product.id === id);
}

function productByName(name) {
  const value = clean(name).toLowerCase();
  return state.products.find((product) => product.name.toLowerCase() === value);
}

function productUnitById(id) {
  return state.productUnits.find((unit) => unit.id === id);
}

function productSelectOptions(selectedId = "") {
  return `<option value="">Без продукта</option>${state.products.map((product) => `<option value="${product.id}" ${product.id === selectedId ? "selected" : ""}>${escapeHtml(product.name)} · ${escapeHtml(product.sku || "без ID")}</option>`).join("")}`;
}

function normalizeArray(value) {
  if (Array.isArray(value)) return value.filter(Boolean);
  if (!value) return [];
  return [value].filter(Boolean);
}

function cleanLines(value) {
  return String(value || "").split(/\r?\n|,/).map((item) => clean(item)).filter(Boolean);
}

function dealItemsFromData(data) {
  const product = productById(data.productId) || productByName(data.productName);
  if (!product) return [];
  const unitIds = normalizeArray(data.productUnitIds).filter((id) => productUnitById(id)?.productId === product.id);
  if (unitIds.length) {
    return unitIds.map((unitId) => dealItemFromProduct(product, { unitId, price: Number(data.value || 0), quantity: 1 }));
  }
  return [dealItemFromProduct(product, { price: Number(data.value || 0), quantity: Math.max(1, Number(data.quantity || 1)) })];
}

function collectDealItems(form) {
  const data = new FormData(form);
  const dealId = clean(data.get("id"));
  const ids = data.getAll("itemId");
  const productIds = data.getAll("itemProductId");
  const unitIds = data.getAll("itemUnitId");
  const quantities = data.getAll("itemQuantity");
  const prices = data.getAll("itemPrice");
  const seenUnits = new Set();
  const items = [];
  let duplicateUnit = "";
  let unavailableUnit = "";

  productIds.forEach((productId, index) => {
    const unit = productUnitById(unitIds[index]);
    const product = productById(unit?.productId || productId);
    if (!product) return;
    if (unit?.id && unit.status !== "available" && unit.dealId !== dealId) {
      unavailableUnit = `${unit.serialNumber} (${productUnitStatusLabel(unit.status)})`;
      return;
    }
    if (unit?.id && seenUnits.has(unit.id)) {
      duplicateUnit = unit.serialNumber;
      return;
    }
    if (unit?.id) seenUnits.add(unit.id);
    items.push(dealItemFromProduct(product, {
      id: ids[index],
      unitId: unit?.id || "",
      quantity: unit?.id ? 1 : Math.max(1, Number(quantities[index] || 1)),
      price: Math.max(0, Number(prices[index] || 0)),
    }));
  });

  if (duplicateUnit) {
    window.alert(`Идентификационный номер уже выбран в этой сделке: ${duplicateUnit}`);
    return null;
  }
  if (unavailableUnit) {
    window.alert(`Товар уже недоступен для продажи: ${unavailableUnit}`);
    return null;
  }
  return items;
}

function dealItemFromProduct(product, overrides = {}) {
  const unit = productUnitById(overrides.unitId);
  const quantity = unit ? 1 : Math.max(1, Number(overrides.quantity || 1));
  const price = Math.max(0, Number(overrides.price || 0));
  return {
    id: clean(overrides.id) || makeId("item"),
    productId: product.id,
    productName: product.name,
    productCategory: product.category || "Без категории",
    unitId: unit?.id || "",
    quantity,
    price,
    cost: unit ? Number(unit.purchaseCost || 0) : Number(product.purchaseCost || 0) * quantity,
  };
}

function dealProductItems(deal) {
  if (Array.isArray(deal.items) && deal.items.length) {
    return deal.items.map((item) => {
      const unit = productUnitById(item.unitId);
      const product = productById(unit?.productId || item.productId) || productByName(item.productName);
      if (!product) return null;
      const quantity = unit ? 1 : Math.max(1, Number(item.quantity || 1));
      return {
        id: item.id || makeId("item"),
        productId: product.id,
        productName: product.name,
        productCategory: product.category || item.productCategory || "Без категории",
        unitId: unit?.id || "",
        quantity,
        price: Math.max(0, Number(item.price || 0)),
      cost: unit ? Number(unit.purchaseCost || 0) : Number(item.cost || product.purchaseCost * quantity || 0),
    };
  }).filter(Boolean);
}

  const product = productById(deal.productId) || productByName(deal.productName);
  const unitIds = normalizeArray(deal.productUnitIds);
  if (unitIds.length) {
    return unitIds.map(productUnitById).filter(Boolean).map((unit) => {
      const unitProduct = productById(unit.productId) || product;
      if (!unitProduct) return null;
      return dealItemFromProduct(unitProduct, { unitId: unit.id, price: Number(deal.value || 0) / unitIds.length });
    }).filter(Boolean);
  }
  if (!product) return [];
  return [dealItemFromProduct(product, { price: Number(deal.value || 0), quantity: 1, id: "legacy-item" })];
}

function dealSelectedUnitIds(deal) {
  return dealProductItems(deal).map((item) => item.unitId).filter(Boolean);
}

function dealItemsRevenue(items) {
  return items.reduce((total, item) => total + Number(item.price || 0) * Math.max(1, Number(item.quantity || 1)), 0);
}

function distributeDealValue(items, value) {
  const totalQuantity = items.reduce((total, item) => total + Math.max(1, Number(item.quantity || 1)), 0) || 1;
  items.forEach((item) => {
    item.price = Number(value || 0) / totalQuantity;
  });
}

function dealProductsLabel(deal) {
  const names = [...new Set(dealProductItems(deal).map((item) => item.productName).filter(Boolean))];
  return names.join(", ");
}

function syncDealProductFields(deal) {
  const items = dealProductItems(deal);
  deal.items = items;
  deal.productUnitIds = items.map((item) => item.unitId).filter(Boolean);
  deal.productId = items[0]?.productId || "";
  deal.productName = dealProductsLabel(deal);
  deal.productCategory = items[0]?.productCategory || "";
}

function dealItemCost(item) {
  const unit = productUnitById(item.unitId);
  if (unit) return Number(unit.purchaseCost || 0);
  const product = productById(item.productId);
  return Number(item.cost || product?.purchaseCost * Math.max(1, Number(item.quantity || 1)) || 0);
}

function dealCost(deal) {
  const itemCost = dealProductItems(deal).reduce((total, item) => total + dealItemCost(item), 0);
  if (itemCost) return itemCost;
  return Number(deal.cost || 0);
}

function applyDealProductCost(deal) {
  syncDealProductFields(deal);
  deal.cost = dealCost(deal);
}

function canSetDealStatus(deal, status) {
  if (status !== "won") return true;
  if (!dealRequiresProductUnitSelection(deal)) return true;
  window.alert("Чтобы перевести сделку в статус «Успешно», выберите идентификационные номера для всех товаров из партий.");
  return false;
}

function validateRequiredDealUnitIds(items) {
  const missing = items.find((item) => productHasIdentifiedUnits(item.productId) && !item.unitId);
  if (!missing) return true;
  window.alert(`Нужно выбрать ID из партии для товара: ${missing.productName}`);
  return false;
}

function dealRequiresProductUnitSelection(deal) {
  return dealProductItems(deal).some((item) => productHasIdentifiedUnits(item.productId) && !item.unitId);
}

function productHasIdentifiedUnits(productId) {
  return state.productUnits.some((unit) => unit.productId === productId && clean(unit.serialNumber));
}

function syncProductUnitsForDeal(deal, previousUnitIds = []) {
  const selectedUnitIds = dealSelectedUnitIds(deal);
  previousUnitIds
    .filter((id) => !selectedUnitIds.includes(id))
    .map(productUnitById)
    .filter(Boolean)
    .forEach((unit) => {
      unit.status = "available";
      unit.dealId = "";
    });

  selectedUnitIds
    .map(productUnitById)
    .filter(Boolean)
    .forEach((unit) => {
      unit.status = deal.status === "won" ? "sold" : "reserved";
      unit.dealId = deal.id;
    });
}

function productUnitOptions(deal) {
  const selected = new Set(deal.productUnitIds || []);
  const productId = deal.productId || productByName(deal.productName)?.id || "";
  if (!productId) return "";
  return state.productUnits
    .filter((unit) => {
      if (unit.productId !== productId) return false;
      return unit.status === "available" || (selected.has(unit.id) && unit.status !== "sold");
    })
    .map((unit) => `<option value="${unit.id}" ${selected.has(unit.id) ? "selected" : ""}>${escapeHtml(unit.serialNumber)} · ${money.format(Number(unit.purchaseCost || 0))} · ${escapeHtml(productUnitStatusLabel(unit.status))}</option>`)
    .join("");
}

function productUnitSelectOptions(deal) {
  const productId = deal.productId || productByName(deal.productName)?.id || "";
  if (!productId) return `<option value="">Сначала выберите продукт</option>`;
  const options = productUnitOptions(deal);
  if (!options) return `<option value="">Нет доступных идентификационных номеров</option>`;
  return `<option value="">Выберите номер из партии</option>${options}`;
}

function productUnitStatusLabel(status) {
  return {
    available: "Доступно",
    reserved: "В резерве",
    sold: "Продано",
  }[status] || "Доступно";
}

function normalizeState(rawState) {
  const next = {
    companies: rawState.companies || [],
    contacts: rawState.contacts || [],
    leads: rawState.leads || [],
    deals: rawState.deals || [],
    tasks: rawState.tasks || [],
    products: rawState.products?.length ? rawState.products : defaultProducts(),
    productUnits: rawState.productUnits?.length ? rawState.productUnits : defaultProductUnits(),
    users: rawState.users?.length ? rawState.users : defaultUsers(),
    salesPlans: rawState.salesPlans?.length ? rawState.salesPlans : defaultSalesPlans(),
    campaigns: rawState.campaigns?.length ? rawState.campaigns : defaultCampaigns(),
    tickets: rawState.tickets?.length ? rawState.tickets : defaultTickets(),
  };
  const now = new Date().toISOString();
  const managers = ["Алина", "Максим", "Олег"];

  next.products.forEach((product, index) => {
    product.id ||= makeId("product");
    product.sku ||= makeId("sku");
    product.name ||= `Продукт ${index + 1}`;
    product.category ||= "Без категории";
    product.purchaseCost = Math.max(0, Number(product.purchaseCost || 0));
  });
  const products = next.products.map((product) => [product.name, product.category, product.purchaseCost, product.id]);

  next.productUnits.forEach((unit) => {
    unit.status = ["available", "reserved", "sold"].includes(unit.status) ? unit.status : "available";
    unit.purchaseCost = Math.max(0, Number(unit.purchaseCost || next.products.find((product) => product.id === unit.productId)?.purchaseCost || 0));
    unit.serialNumber ||= makeId("sn");
    unit.batchId ||= "";
    unit.dealId ||= "";
    unit.createdAt ||= now;
  });

  next.companies.forEach((company, index) => {
    company.manager ||= managers[index % managers.length];
  });

  next.users.forEach((user) => {
    user.role = userRoles.some((role) => role.id === user.role) ? user.role : "manager";
    user.active = user.active !== false;
    user.login ||= clean(user.email).split("@")[0] || user.id;
    user.login = clean(user.login).toLowerCase();
    user.password ||= "123456";
  });

  next.salesPlans.forEach((plan) => {
    plan.scope ||= plan.userId ? "manager" : "company";
    plan.period ||= currentPlanPeriod();
    plan.amount = Math.max(0, Number(plan.amount || 0));
    if (plan.scope === "company") plan.userId = "";
  });

  if (!activeUserId || !next.users.some((user) => user.id === activeUserId)) {
    activeUserId = next.users.find((user) => user.role === "vip")?.id || next.users[0]?.id || "";
  }

  next.contacts.forEach((contact, index) => {
    const company = next.companies.find((item) => item.id === contact.companyId);
    contact.gender ||= index % 2 ? "Мужской" : "Женский";
    contact.age ||= [28, 35, 42, 24][index % 4];
    contact.interest ||= ["Подарки", "Дизайн", "Спорт", "Учеба"][index % 4];
    contact.geo ||= company?.city || "Не указан";
    contact.loyaltyTier ||= ["Gold", "Silver", "Base", "Base"][index % 4];
    contact.nps ||= [9, 8, 6, 10][index % 4];
    contact.csat ||= [5, 5, 4, 5][index % 4];
    contact.manager ||= managers[index % managers.length];
  });

  next.leads.forEach((lead, index) => {
    const campaign = next.campaigns[index % next.campaigns.length];
    const contact = next.contacts.find((item) => item.id === lead.contactId);
    const deal = next.deals.find((item) => item.leadId === lead.id);
    if (lead.status === "converted") lead.status = "qualified";
    if (lead.status === "lost") lead.status = "disqualified";
    if (!leadStatuses.some((status) => status.id === lead.status)) lead.status = "qualified";
    lead.utmSource ||= campaign.source;
    lead.utmCampaign ||= campaign.utmCampaign;
    lead.clickId ||= `clk-${index + 100}`;
    lead.disqualificationReason ||= "";
    lead.manager ||= deal?.manager || contact?.manager || managers[index % managers.length];
  });

  next.deals.forEach((deal, index) => {
    const fallbackProductTuple = products[index % products.length];
    const campaign = next.campaigns[index % next.campaigns.length];
    const fallbackProduct = next.products.find((item) => item.id === (deal.productId || fallbackProductTuple[3])) || next.products[0];
    const linkedUnitIds = next.productUnits.filter((unit) => unit.dealId === deal.id).map((unit) => unit.id);
    const legacyUnitIds = normalizeArray(deal.productUnitIds);
    const selectedUnitIds = legacyUnitIds.length ? legacyUnitIds : linkedUnitIds;
    const sourceItems = Array.isArray(deal.items) && deal.items.length
      ? deal.items
      : selectedUnitIds.length
        ? selectedUnitIds.map((unitId) => ({ unitId, quantity: 1, price: Number(deal.value || 0) / selectedUnitIds.length }))
        : fallbackProduct
          ? [{ productId: fallbackProduct.id, quantity: 1, price: Number(deal.value || 0), cost: Number(deal.cost || fallbackProduct.purchaseCost || 0) }]
          : [];

    deal.items = sourceItems.map((item) => {
      const unit = next.productUnits.find((candidate) => candidate.id === item.unitId);
      const product = next.products.find((candidate) => candidate.id === (unit?.productId || item.productId))
        || next.products.find((candidate) => candidate.name.toLowerCase() === clean(item.productName).toLowerCase())
        || fallbackProduct;
      if (!product) return null;
      const quantity = unit ? 1 : Math.max(1, Number(item.quantity || 1));
      return {
        id: item.id || makeId("item"),
        productId: product.id,
        productName: product.name,
        productCategory: product.category || "Без категории",
        unitId: unit?.id || "",
        quantity,
        price: Math.max(0, Number(item.price || 0)),
        cost: unit ? Number(unit.purchaseCost || 0) : Number(item.cost || product.purchaseCost * quantity || 0),
      };
    }).filter(Boolean);

    deal.productUnitIds = deal.items.map((item) => item.unitId).filter(Boolean);
    deal.productId = deal.items[0]?.productId || "";
    deal.productName = [...new Set(deal.items.map((item) => item.productName).filter(Boolean))].join(", ");
    deal.productCategory = deal.items[0]?.productCategory || "";
    deal.cost = deal.items.reduce((total, item) => total + Number(item.cost || 0), 0);
    next.productUnits
      .filter((unit) => deal.productUnitIds.includes(unit.id))
      .forEach((unit) => {
        unit.dealId = deal.id;
        unit.status = deal.status === "won" ? "sold" : "reserved";
      });
    deal.plan ||= index === 0 ? 150000 : 90000;
    deal.campaignId ||= campaign.id;
    deal.utmSource ||= campaign.source;
    deal.utmCampaign ||= campaign.utmCampaign;
    deal.promoCode ||= index === 0 ? "WELCOME10" : index === 1 ? "ARTPAD" : "";
    deal.discount ||= deal.promoCode ? Math.round(Number(deal.value || 0) * 0.08) : 0;
    deal.manager ||= managers[index % managers.length];
    deal.firstResponseMinutes ||= [12, 35, 8, 24][index % 4];
    deal.paidAt ||= deal.status === "won" ? (deal.updatedAt || now) : "";
    deal.loyaltyUsed ||= deal.status === "won" ? 2500 : 0;
    deal.cashback ||= deal.status === "won" ? Math.round(Number(deal.value || 0) * 0.03) : 0;
  });

  next.tasks.forEach((task, index) => {
    const deal = next.deals.find((item) => item.id === task.dealId);
    const lead = next.leads.find((item) => item.id === (task.leadId || deal?.leadId));
    const contact = next.contacts.find((item) => item.id === (task.contactId || deal?.contactId || lead?.contactId));
    const company = next.companies.find((item) => item.id === (task.companyId || deal?.companyId || lead?.companyId || contact?.companyId));
    task.status = taskStatuses.some((status) => status.id === task.status) ? task.status : "todo";
    task.manager ||= managers[index % managers.length];
    task.dueAt ||= dateInput(new Date(Date.now() + (index + 1) * 86400000).toISOString());
    task.reminderAt ||= task.dueAt;
    task.dealId ||= deal?.id || "";
    task.leadId ||= lead?.id || "";
    task.contactId ||= contact?.id || "";
    task.companyId ||= company?.id || "";
    task.description ||= "";
    task.createdAt ||= now;
    task.updatedAt ||= task.createdAt;
  });

  next.contacts.forEach((contact) => {
    const wonDeals = next.deals.filter((deal) => deal.contactId === contact.id && deal.status === "won");
    const last = wonDeals.map((deal) => deal.paidAt || deal.updatedAt || deal.createdAt).sort().at(-1);
    contact.lastPurchaseAt ||= last || "";
  });

  return next;
}

function defaultCampaigns() {
  return [
    { id: "camp-search", source: "Контекст", utmCampaign: "search-brand", cost: 18000 },
    { id: "camp-social", source: "Соцсети", utmCampaign: "vk-gadgets", cost: 12000 },
    { id: "camp-email", source: "Email", utmCampaign: "may-offer", cost: 4000 },
  ];
}

function defaultTickets() {
  const now = Date.now();
  const ago = (days) => new Date(now - days * 86400000).toISOString();
  return [
    { id: "ticket-1", contactId: "contact-anna", category: "Доставка", status: "closed", resolutionHours: 5, createdAt: ago(3) },
    { id: "ticket-2", contactId: "contact-maria", category: "Возврат", status: "open", resolutionHours: 12, createdAt: ago(8) },
    { id: "ticket-3", contactId: "contact-denis", category: "Брак", status: "closed", resolutionHours: 20, createdAt: ago(1) },
    { id: "ticket-4", contactId: "contact-ilya", category: "Консультация", status: "closed", resolutionHours: 2, createdAt: ago(15) },
  ];
}

function defaultProducts() {
  return [
    { id: "product-iphone-15", sku: "SKU-IPHONE-15", name: "iPhone 15 Pro", category: "Смартфоны", purchaseCost: 91000 },
    { id: "product-ipad-air", sku: "SKU-IPAD-AIR", name: "iPad Air + Pencil", category: "Планшеты", purchaseCost: 61000 },
    { id: "product-watch", sku: "SKU-WATCH", name: "Apple Watch", category: "Носимые устройства", purchaseCost: 31000 },
    { id: "product-macbook-air", sku: "SKU-MACBOOK-AIR", name: "MacBook Air", category: "Ноутбуки", purchaseCost: 92000 },
  ];
}

function defaultProductUnits() {
  return [
    { id: "unit-iphone-001", productId: "product-iphone-15", serialNumber: "IPH15-001", purchaseCost: 91000, batchId: "batch-demo-iphone", status: "sold", dealId: "deal-iphone" },
    { id: "unit-iphone-002", productId: "product-iphone-15", serialNumber: "IPH15-002", purchaseCost: 91000, batchId: "batch-demo-iphone", status: "available", dealId: "" },
    { id: "unit-ipad-001", productId: "product-ipad-air", serialNumber: "IPAD-001", purchaseCost: 61000, batchId: "batch-demo-ipad", status: "reserved", dealId: "deal-ipad" },
    { id: "unit-watch-001", productId: "product-watch", serialNumber: "WATCH-001", purchaseCost: 31000, batchId: "batch-demo-watch", status: "reserved", dealId: "deal-watch" },
    { id: "unit-mac-001", productId: "product-macbook-air", serialNumber: "MBA-001", purchaseCost: 92000, batchId: "batch-demo-mac", status: "available", dealId: "" },
  ];
}

function defaultUsers() {
  return [
    { id: "user-vip", name: "Виктория CEO", email: "vip@example.com", login: "vip", password: "123456", role: "vip", supervisorId: "", active: true },
    { id: "user-lead-1", name: "Ирина Руководитель", email: "lead@example.com", login: "leader", password: "123456", role: "leader", supervisorId: "user-vip", active: true },
    { id: "user-manager-alina", name: "Алина", email: "alina@example.com", login: "alina", password: "123456", role: "manager", supervisorId: "user-lead-1", active: true },
    { id: "user-manager-maxim", name: "Максим", email: "maxim@example.com", login: "maxim", password: "123456", role: "manager", supervisorId: "user-lead-1", active: true },
    { id: "user-manager-oleg", name: "Олег", email: "oleg@example.com", login: "oleg", password: "123456", role: "manager", supervisorId: "user-lead-1", active: true },
  ];
}

function defaultSalesPlans() {
  const period = currentPlanPeriod();
  return [
    { id: "plan-company", scope: "company", userId: "", period, amount: 460000 },
    { id: "plan-alina", scope: "manager", userId: "user-manager-alina", period, amount: 180000 },
    { id: "plan-maxim", scope: "manager", userId: "user-manager-maxim", period, amount: 160000 },
    { id: "plan-oleg", scope: "manager", userId: "user-manager-oleg", period, amount: 120000 },
  ];
}

function loadDashboardReports() {
  try {
    const saved = JSON.parse(localStorage.getItem("pulse-crm-dashboard-reports"));
    if (Array.isArray(saved)) return saved.filter((id) => reportTypes.some((report) => report.id === id) || customReports.some((report) => `custom:${report.id}` === id));
  } catch {
  }
  return ["salesFunnel", "revenuePlan", "productSales"];
}

function saveDashboardReports() {
  localStorage.setItem("pulse-crm-dashboard-reports", JSON.stringify(dashboardReportIds));
}

function loadDashboardReportLayouts() {
  try {
    const saved = JSON.parse(localStorage.getItem("pulse-crm-dashboard-report-layouts"));
    if (saved && typeof saved === "object") return saved;
  } catch {
  }
  return {};
}

function saveDashboardReportLayouts() {
  localStorage.setItem("pulse-crm-dashboard-report-layouts", JSON.stringify(dashboardReportLayouts));
}

function loadDashboardWidgetOrder() {
  try {
    const saved = JSON.parse(localStorage.getItem("pulse-crm-dashboard-widget-order"));
    if (Array.isArray(saved)) return saved.filter((id) => dashboardWidgetIds().includes(id));
  } catch {
  }
  return dashboardWidgetIds();
}

function saveDashboardWidgetOrder() {
  localStorage.setItem("pulse-crm-dashboard-widget-order", JSON.stringify(dashboardWidgetOrder));
}

function loadDashboardWidgetLayouts() {
  try {
    const saved = JSON.parse(localStorage.getItem("pulse-crm-dashboard-widget-layouts"));
    if (saved && typeof saved === "object") return saved;
  } catch {
  }
  return {};
}

function saveDashboardWidgetLayouts() {
  localStorage.setItem("pulse-crm-dashboard-widget-layouts", JSON.stringify(dashboardWidgetLayouts));
}

function loadCustomReports() {
  try {
    const saved = JSON.parse(localStorage.getItem(customReportsKey));
    if (Array.isArray(saved)) return saved.map((report) => normalizeReportDefinition(report));
  } catch {
  }
  return [];
}

function saveCustomReports() {
  localStorage.setItem(customReportsKey, JSON.stringify(customReports));
}

function loadState() {
  try {
    const saved = JSON.parse(localStorage.getItem(storageKey));
    if (saved && Array.isArray(saved.companies) && Array.isArray(saved.contacts) && Array.isArray(saved.leads) && Array.isArray(saved.deals)) {
      return saved;
    }
  } catch {
  }

  return demoState();
}

function saveState() {
  localStorage.setItem(storageKey, JSON.stringify(state));
}

function loadActiveUserId() {
  try {
    return localStorage.getItem("pulse-crm-active-user") || "";
  } catch {
    return "";
  }
}

function saveActiveUserId() {
  localStorage.setItem("pulse-crm-active-user", activeUserId);
}

function loadAuthenticatedUserId() {
  try {
    return localStorage.getItem(authUserKey) || "";
  } catch {
    return "";
  }
}

function saveAuthenticatedUserId() {
  if (authenticatedUserId) {
    localStorage.setItem(authUserKey, authenticatedUserId);
    return;
  }
  localStorage.removeItem(authUserKey);
}

function formObject(form) {
  return Object.fromEntries(new FormData(form).entries());
}

function setNote(selector, text) {
  const node = document.querySelector(selector);
  if (!node) return;
  node.textContent = text;
  window.setTimeout(() => {
    if (node.textContent === text) node.textContent = "";
  }, 2800);
}

function clean(value) {
  return String(value || "").replace(/\s+/g, " ").trim();
}

function makeId(prefix) {
  if (window.crypto?.randomUUID) return `${prefix}-${crypto.randomUUID().slice(0, 8)}`;
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

function dateInput(value) {
  return new Date(value).toISOString().slice(0, 10);
}

function formatDate(value) {
  if (!value) return "";
  return new Date(value).toLocaleDateString("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function escapeHtml(value) {
  return String(value || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
