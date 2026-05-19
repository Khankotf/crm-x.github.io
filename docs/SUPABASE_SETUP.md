# Подключение Supabase к CRM-X

Supabase-проект:

```text
https://supabase.com/dashboard/project/pfvckmaopimzlfeyyxmb
```

Project URL:

```text
https://pfvckmaopimzlfeyyxmb.supabase.co
```

GitHub-репозиторий:

```text
https://github.com/Khankotf/crm-x.github.io
```

## Что уже подготовлено в коде

В проект добавлены файлы:

- `src/supabase-config.js` — настройки подключения;
- `src/supabase-client.js` — создание Supabase-клиента;
- `src/data-adapter.js` — адаптер данных;
- `supabase/migrations/20260519234500_initial_schema.sql` — первая миграция базы.

Если публичный ключ не указан, CRM-X продолжит работать в локальном режиме через браузерное хранилище.

## Шаг 1. Проверить publishable key

Открой Supabase Dashboard:

```text
Project Settings -> API
```

Скопируй публичный `publishable key`.

Открой файл:

```text
src/supabase-config.js
```

В проекте уже указан publishable key:

```js
window.CRM_X_SUPABASE = {
  url: "https://pfvckmaopimzlfeyyxmb.supabase.co",
  publishableKey: "sb_publishable_...",
};
```

Важно: `publishable key` можно использовать на frontend. `service_role key` и secret keys нельзя вставлять в код и нельзя отправлять в GitHub.

## Шаг 2. Создать таблицы

В Supabase открой:

```text
SQL Editor -> New query
```

Скопируй туда содержимое файла:

```text
supabase/migrations/20260519234500_initial_schema.sql
```

Нажми `Run`.

После выполнения в `Table Editor` должны появиться таблицы:

- `organizations`;
- `profiles`;
- `organization_users`;
- `companies`;
- `contacts`;
- `leads`;
- `deals`;
- `products`;
- `product_units`;
- `deal_items`;
- `tasks`;
- `sales_plans`;
- `campaigns`;
- `tickets`;
- `audit_events`.

## Шаг 3. Настроить Auth URL

Открой в Supabase:

```text
Authentication -> URL Configuration
```

В `Site URL` укажи рабочий адрес сайта.

Для локальной разработки добавь в Redirect URLs:

```text
http://localhost:8080/**
```

Для GitHub Pages добавь фактический адрес, который показан в GitHub:

```text
Settings -> Pages
```

Для репозитория `Khankotf/crm-x.github.io` это чаще всего будет:

```text
https://khankotf.github.io/crm-x.github.io/**
```

Если GitHub показывает другой адрес, используй именно его.

## Шаг 4. Проверить подключение в браузере

Запусти локальный сервер:

```powershell
cd C:\Users\khank\VSCODE_Projects\Preject_X
python -m http.server 8080
```

Открой:

```text
http://localhost:8080
```

В DevTools Console проверь:

```js
window.crmSupabase.isConfigured
window.crmDataAdapter.isSupabaseReady
```

Оба значения должны быть `true`, если ключ вставлен правильно и SDK загрузился.

## Что будет следующим шагом

После проверки подключения нужно перенести первую сущность на Supabase.

Лучший кандидат — `leads`, потому что лиды проще сделок и по ним удобно проверить:

- загрузку списка из базы;
- создание лида;
- изменение статуса;
- дисквалификацию;
- создание сделки из лида.
