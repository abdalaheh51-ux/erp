# Nexus ERP — نظام إدارة موارد المؤسسات

نظام ERP متكامل (CRM + فوترة) مبني بـ Next.js 16 + TypeScript + Prisma + Tailwind CSS + shadcn/ui.

## المميزات

### وحدات النظام (7 وحدات)
1. **Dashboard** — لوحة تحكم مع KPIs ورسوم بيانية (الإيرادات، حالات الفواتير، pipeline الصفقات، توزيع العملاء)
2. **Customers** — إدارة العملاء والـ Leads (جدول + بحث + فلترة + تفاصيل العميل بتبويبات)
3. **Deals** — لوحة Kanban للصفقات مع سحب وإفلات بين المراحل
4. **Interactions** — سجل التفاعلات (مكالمات/اجتماعات/إيميلات/ملاحظات) مرتبة زمنياً
5. **Products** — كتالوج المنتجات/الخدمات (شبكة بطاقات)
6. **Invoices** — الفواتير مع بنود الفاتورة (Line Items) + تسجيل مدفوعات
7. **Payments** — المدفوعات مع ربط تلقائي بحالة الفاتورة

### قاعدة البيانات (7 جداول)
- **Customer** (id, name, email, phone, status, source)
- **Deal** (id, title, value, stage, customerId)
- **Interaction** (id, content, date, type, customerId)
- **Product** (id, name, price, description)
- **Invoice** (id, number, totalAmount, status, dueDate, customerId, dealId)
- **InvoiceItem** (id, invoiceId, productId, quantity, unitPrice)
- **Payment** (id, invoiceId, amount, paymentMethod, date)

## التقنيات المستخدمة

| الفئة | التقنية |
|------|---------|
| Framework | Next.js 16 (App Router) + Turbopack/webpack |
| Language | TypeScript 5 |
| Styling | Tailwind CSS 4 + shadcn/ui (New York) |
| Database | Prisma ORM + SQLite |
| State | Zustand (UI) + TanStack Query (server) |
| Charts | Recharts |
| Drag & Drop | @dnd-kit/core |
| Icons | lucide-react |
| Forms | react-hook-form + zod |
| Theme | next-themes (أسود/أزرق داكن افتراضياً) |

## طريقة التشغيل

### المتطلبات
- Node.js 18+ أو Bun
- npm / bun

### الخطوات

```bash
# 1. تثبيت الاعتمادانت
bun install
# أو: npm install

# 2. إعداد قاعدة البيانات
cp .env.example .env   # أو أنشئ ملف .env يحتوي على:
                      # DATABASE_URL="file:./db/custom.db"

bun run db:push        # إنشاء الجداول في SQLite

# 3. (اختياري) بيانات تجريبية
bun run prisma/seed.ts

# 4. تشغيل خادم التطوير
bun run dev
# أو: npm run dev

# افتح http://localhost:3000
```

### ملاحظة حول Next.js 16 و Turbopack
Turbopack (الافتراضي في Next 16) قد يتعطل أحياناً مع API routes المعقدة.
في هذه الحالة استخدم webpack بدلاً منه:
```bash
bun run dev --webpack
# أو عدّل package.json: "dev": "next dev -p 3000 --webpack"
```

## بنية المشروع

```
.
├── prisma/
│   ├── schema.prisma       # تعريف الجداول والعلاقات
│   └── seed.ts             # بيانات تجريبية
├── src/
│   ├── app/
│   │   ├── api/            # REST API routes (7 entities + dashboard)
│   │   │   ├── customers/
│   │   │   ├── deals/
│   │   │   ├── interactions/
│   │   │   ├── products/
│   │   │   ├── invoices/
│   │   │   ├── payments/
│   │   │   └── dashboard/
│   │   ├── globals.css     # ثيم الأسود/الأزرق
│   │   ├── layout.tsx
│   │   └── page.tsx        # الصفحة الرئيسية (تجميع كل الوحدات)
│   ├── components/
│   │   ├── erp/
│   │   │   ├── modules/    # وحدات النظام (dashboard, customers, ...)
│   │   │   ├── badges.tsx  # مكونات الـ status badges
│   │   │   ├── sidebar.tsx
│   │   │   ├── header.tsx
│   │   │   └── ...
│   │   └── ui/             # مكونات shadcn/ui
│   ├── lib/
│   │   ├── db.ts           # Prisma client
│   │   ├── erp-constants.ts # ثوابت (enums, ألوان, formatters)
│   │   └── utils.ts
│   ├── store/
│   │   └── ui-store.ts     # Zustand store
│   └── hooks/
├── package.json
├── tsconfig.json
└── tailwind.config.ts
```

## ألوان الـ statuses

### حالة العميل (Customer Status)
- `new` — جديد (أزرق سماوي)
- `lead` — محتمل (كهرماني)
- `active` — حالي (أخضر)
- `inactive` — غير نشط (رمادي)

### مرحلة الصفقة (Deal Stage)
- `contact` — تواصل أولي
- `proposal` — تقديم مقترح
- `negotiation` — تفاوض
- `won` — مغلقة بنجاح (أخضر)
- `lost` — مغلقة بخسارة (أحمر)

### حالة الفاتورة (Invoice Status)
- `draft` — مسودة (رمادي)
- `pending` — بانتظار الدفع (كهرماني)
- `paid` — مدفوعة (أخضر)
- `overdue` — متأخرة (أحمر)

### طريقة الدفع (Payment Method)
- `cash` — كاش
- `bank_transfer` — تحويل بنكي
- `payment_gateway` — بوابة دفع

## الـ API Endpoints

| الطريقة | المسار | الوظيفة |
|--------|--------|---------|
| GET/POST | `/api/customers` | قائمة/إنشاء عميل |
| GET/PATCH/DELETE | `/api/customers/[id]` | تفاصيل/تعديل/حذف عميل |
| GET/POST | `/api/deals` | قائمة/إنشاء صفقة |
| GET/PATCH/DELETE | `/api/deals/[id]` | تفاصيل/تعديل/حذف صفقة |
| GET/POST | `/api/interactions` | قائمة/إنشاء تفاعل |
| GET/PATCH/DELETE | `/api/interactions/[id]` | تفاصيل/تعديل/حذف تفاعل |
| GET/POST | `/api/products` | قائمة/إنشاء منتج |
| GET/PATCH/DELETE | `/api/products/[id]` | تفاصيل/تعديل/حذف منتج |
| GET/POST | `/api/invoices` | قائمة/إنشاء فاتورة (مع البنود) |
| GET/PATCH/DELETE | `/api/invoices/[id]` | تفاصيل/تعديل/حذف فاتورة |
| GET/POST | `/api/payments` | قائمة/إنشاء دفعة (تحديث تلقائي لحالة الفاتورة) |
| GET/PATCH/DELETE | `/api/payments/[id]` | تفاصيل/تعديل/حذف دفعة |
| GET | `/api/dashboard` | إحصائيات الـ Dashboard |

## الترخيص
MIT — حر للاستخدام والتعديل.
