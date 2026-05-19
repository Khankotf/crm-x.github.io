# Черновик структуры базы данных CRM-X

Этот документ нужен для перехода CRM-X с `localStorage` на PostgreSQL/Supabase.

Первая SQL-миграция уже подготовлена:

```text
supabase/migrations/20260519234500_initial_schema.sql
```

## Главный принцип

Каждая бизнес-запись должна принадлежать организации.

Почти во всех таблицах нужны поля:

```sql
organization_id uuid not null
created_at timestamptz not null default now()
updated_at timestamptz not null default now()
```

## Основные таблицы

### organizations

Клиенты CRM-X, то есть компании, которые пользуются системой.

Поля:

- `id`
- `name`
- `slug`
- `plan_code`
- `subscription_status`
- `created_at`
- `updated_at`

### profiles

Профили пользователей. Саму авторизацию лучше отдать Supabase Auth.

Поля:

- `id`
- `auth_user_id`
- `name`
- `email`
- `created_at`
- `updated_at`

### organization_users

Связь пользователей с организациями и ролями.

Поля:

- `id`
- `organization_id`
- `profile_id`
- `role`
- `supervisor_profile_id`
- `active`
- `created_at`
- `updated_at`

Роли:

- `manager`;
- `leader`;
- `vip`;
- `admin`.

### companies

Компании/клиенты внутри CRM.

Поля:

- `id`
- `organization_id`
- `name`
- `segment`
- `industry`
- `city`
- `phone`
- `email`
- `manager_profile_id`
- `created_at`
- `updated_at`

### contacts

Контакты клиентов.

Поля:

- `id`
- `organization_id`
- `company_id`
- `name`
- `role`
- `phone`
- `email`
- `gender`
- `age`
- `interest`
- `geo`
- `loyalty_tier`
- `nps`
- `csat`
- `manager_profile_id`
- `last_purchase_at`
- `created_at`
- `updated_at`

### leads

Лиды.

Поля:

- `id`
- `organization_id`
- `company_id`
- `contact_id`
- `source`
- `need`
- `status`
- `disqualification_reason`
- `utm_source`
- `utm_campaign`
- `click_id`
- `manager_profile_id`
- `created_at`
- `updated_at`

Статусы:

- `new`;
- `qualified`;
- `disqualified`.

### deals

Сделки.

Поля:

- `id`
- `organization_id`
- `lead_id`
- `company_id`
- `contact_id`
- `title`
- `value`
- `cost`
- `status`
- `source`
- `need`
- `manager_profile_id`
- `close_date`
- `paid_at`
- `campaign_id`
- `utm_source`
- `utm_campaign`
- `promo_code`
- `discount`
- `loyalty_used`
- `cashback`
- `first_response_minutes`
- `created_at`
- `updated_at`

Статусы:

- `new`;
- `contact`;
- `offer`;
- `won`;
- `lost`.

### deal_items

Товарные позиции сделки. Нужны, потому что в одной сделке можно продать несколько товаров.

Поля:

- `id`
- `organization_id`
- `deal_id`
- `product_id`
- `product_unit_id`
- `product_name`
- `product_category`
- `quantity`
- `price`
- `cost`
- `created_at`
- `updated_at`

Правило:

- если товар из партии имеет идентификационные номера, `product_unit_id` обязателен;
- проданные единицы товара не должны быть доступны для новых сделок.

### products

Каталог товаров.

Поля:

- `id`
- `organization_id`
- `sku`
- `name`
- `category`
- `purchase_cost`
- `created_at`
- `updated_at`

### product_units

Единицы товаров из партий.

Поля:

- `id`
- `organization_id`
- `product_id`
- `serial_number`
- `purchase_cost`
- `batch_id`
- `status`
- `deal_id`
- `created_at`
- `updated_at`

Статусы:

- `available`;
- `reserved`;
- `sold`.

Важные индексы:

- уникальность `organization_id + serial_number`;
- быстрый поиск по `organization_id + product_id + status`.

### tasks

Задачи.

Поля:

- `id`
- `organization_id`
- `title`
- `status`
- `manager_profile_id`
- `due_at`
- `reminder_at`
- `deal_id`
- `lead_id`
- `contact_id`
- `company_id`
- `description`
- `created_at`
- `updated_at`

### sales_plans

Планы продаж.

Поля:

- `id`
- `organization_id`
- `scope`
- `profile_id`
- `period`
- `amount`
- `created_at`
- `updated_at`

Правила:

- общий план компании хранится без `profile_id`;
- сумма планов менеджеров не должна превышать план компании.

### campaigns

Рекламные кампании и источники.

Поля:

- `id`
- `organization_id`
- `source`
- `utm_campaign`
- `cost`
- `created_at`
- `updated_at`

### tickets

Обращения клиентов.

Поля:

- `id`
- `organization_id`
- `contact_id`
- `category`
- `status`
- `resolution_hours`
- `created_at`
- `updated_at`

### audit_events

Журнал важных действий.

Поля:

- `id`
- `organization_id`
- `profile_id`
- `entity_type`
- `entity_id`
- `action`
- `before`
- `after`
- `created_at`

## Первый порядок миграции

1. Создать `organizations`, `profiles`, `organization_users`.
2. Создать `companies`, `contacts`, `leads`.
3. Создать `products`, `product_units`.
4. Создать `deals`, `deal_items`.
5. Создать `tasks`, `sales_plans`, `campaigns`, `tickets`.
6. Добавить индексы.
7. Добавить Row Level Security.
8. Загрузить демо-данные.
