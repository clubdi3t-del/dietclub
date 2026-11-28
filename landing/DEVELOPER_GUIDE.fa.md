---
title: "راهنمای برنامه‌نویس – افزونه‌های دایت کلاب"
subtitle: "تغذیهٔ شهودی • پنل ادمین • گزارش مشتری (CRM)"
lang: fa
dir: rtl
---

# نمای کلی

این راهنما سه افزونه را توضیح می‌دهد که رابط کاربری آن‌ها آماده است (HTML/CSS/JS بدون کتابخانه) و باید به سرور، پنل فعلی (`panel.di3t-club.com`) و اپلیکیشن متصل شوند:

| # | افزونه | کاربر | وضعیت |
|---|---|---|---|
| 1 | برنامهٔ تغذیهٔ شهودی (۳۰ روزه) | مشترک در اپلیکیشن + کارشناس تغذیه در پنل | رابط آماده است؛ جدول دیتابیس + API لازم است |
| 2 | چیدمان جدید پروفایل مشترک در پنل | کارشناس تغذیه / مدیریت | فقط پیش‌نمایش طراحی – روی صفحهٔ پروفایل فعلی پیاده شود |
| 3 | گزارش مشتری (CRM) + صفحهٔ ساخت لینک + ردیابی پرداخت | مشتری بالقوه + تیم فروش | اکنون به‌صورت فایل‌های ثابت کار می‌کند؛ اتصال به سرور توصیه می‌شود |

همهٔ صفحات راست‌به‌چپ (RTL)، با فونت Tajawal و سازگار با موبایل هستند. هر صفحه بدون سرور با دادهٔ آزمایشی (حالت نمایش) اجرا می‌شود تا پیش‌نمایش آسان باشد.

> متن‌های داخل صفحات به عربی است (زبان مشتریان)؛ نیازی به ترجمهٔ آن‌ها نیست.

# فهرست فایل‌ها

| فایل | توضیح |
|---|---|
| `intuitive.html` | صفحهٔ مشترک: تمرین امروز (هر روز فقط یک تمرین) + صفحهٔ «نتیجهٔ من» |
| `admin-intuitive.html` | رابط ادمین تغذیهٔ شهودی با سه حالت نمایش: `view=full` / `view=box` / `view=bar` |
| `intuitive-cell.js` | سلول ستون «تغذیهٔ شهودی» در جدول مشترکین (حلقهٔ پیشرفت + ۱۴ روز اخیر) |
| `admin-profile-preview.html` | پیش‌نمایش طراحی پیشنهادی کل پروفایل مشترک |
| `admin-list-preview.html` | پیش‌نمایش فهرست مشترکین با نوار و ستون جدید |
| `INTUITIVE_INTEGRATION.md` | جزئیات تکمیلی اتصال تغذیهٔ شهودی (مرجع) |
| `crm/report.html` | گزارش شخصی مشتری (لینک آن در واتساپ برایش ارسال می‌شود) |
| `crm/builder.html` | صفحهٔ تیم برای ساخت لینک گزارش |
| `crm/config.js` | ⚠️ تنظیمات محرمانه: اطلاعات پرداخت، قیمت‌ها، لینک‌های پرداخت، ردیابی – **نباید در GitHub قرار گیرد** |
| `crm/config.example.js` | نسخهٔ بدون اطلاعات حساس |
| `crm/CRM_TRACKING.md` | توضیح ردیابی (باز شدن گزارش / کلیک روی پرداخت) |

# ۱) برنامهٔ تغذیهٔ شهودی

## ۱.۱ صفحهٔ مشترک (اپلیکیشن)

داخل WebView باز می‌شود (به‌صورت تب یا کارت در بخش «وعده‌های امروز»):

```
https://di3t-club.com/intuitive.html?token={USER_TOKEN}&api=https://di3t-club.com/api&goal={TRACK}
```

| پارامتر | مقدار |
|---|---|
| `token` | توکن مشترک؛ به‌صورت `Authorization: Bearer` ارسال می‌شود |
| `api` | آدرس API |
| `goal` | `rashaqa` `sukari` `dhaght` `qolon` `takayos` `haml` (بر اساس نوع رژیم). اگر ارسال شود، گزینهٔ انتخاب رژیم پنهان می‌شود |

- روز برنامه از `start_date` محاسبه می‌شود (روز اول = اولین باز کردن).
- مشترک فقط یک تمرین می‌بیند و تمرین بعدی پس از نیمه‌شب باز می‌شود.
- با زدن «انجام دادم» نتیجه ارسال می‌شود و هر ویرایش بعدی هم دوباره ارسال می‌شود. در حالت آفلاین ذخیره و بعداً ارسال می‌شود.
- `?day=10` فقط برای تست است.

## ۱.۲ پایگاه داده

```sql
CREATE TABLE intuitive_progress (
  id            BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id       BIGINT UNSIGNED NOT NULL,
  day           TINYINT UNSIGNED NOT NULL,      -- 1..30
  track         VARCHAR(20) NOT NULL,
  done          BOOLEAN DEFAULT FALSE,
  commitment    TINYINT NULL,   -- میزان اجرای تمرین 1..10 (هر روز)
  hunger        TINYINT NULL,   -- گرسنگی قبل از غذا 1..10
  fullness      TINYINT NULL,   -- سیری / پری 1..10
  satisfaction  TINYINT NULL,   -- رضایت 1..10
  note          TEXT NULL,
  reply         TEXT NULL,      -- پاسخ کارشناس تغذیه
  final_answers JSON NULL,      -- ارزیابی ماه (روز 30)
  completed_at  DATETIME NULL,
  created_at TIMESTAMP NULL, updated_at TIMESTAMP NULL,
  UNIQUE KEY (user_id, day)
);
ALTER TABLE users ADD intuitive_start_date DATE NULL;
```

## ۱.۳ API مشترک

**`POST /api/intuitive/progress`** – upsert روی (user_id, day). اگر `intuitive_start_date` خالی باشد ← تاریخ امروز ذخیره شود.

```json
{"day":25,"track":"sukari","done":true,"commitment":8,"hunger":4,"fullness":7,
 "satisfaction":null,"note":"...","completed_at":"2026-11-14T12:38:23Z"}
```

**`GET /api/intuitive/progress`** – پیشرفت مشترک را برمی‌گرداند (برای کار روی چند دستگاه) همراه با پاسخ کارشناس:

```json
{"start_date":"2026-11-01","track":"sukari",
 "days":[{"day":1,"done":true,"commitment":5,"hunger":2,"fullness":9,"satisfaction":null,"note":"...","reply":null}]}
```

## ۱.۴ API ادمین

**`GET /api/admin/intuitive/users`** (اختیاری `?user_id=ID` برای یک مشترک):

```json
[{"id":12,"name":"...","track":"rashaqa","start_date":"2026-11-01",
  "days":[{"day":1,"done":true,"commitment":8,"hunger":3,"fullness":7,"satisfaction":null,"note":"...","reply":null}],
  "weights":[{"date":"2026-08-01","day":-90,"weight":90.1},{"date":"2026-11-01","day":1,"weight":87.2}]}]
```

- `weights` از جدول اندازه‌گیری‌های موجود، **کل تاریخچه** (برای میانگین ۳ ماهه لازم است).
- `day = (تاریخ اندازه‌گیری − start_date) + 1` (قبل از برنامه ممکن است منفی باشد).

**`POST /api/admin/users/{id}/intuitive/{day}/reply`** ← `{"reply":"..."}` در ستون `reply` ذخیره می‌شود.

## ۱.۵ جای‌گذاری در پنل

**نوار بالای فهرست مشترکین** (آمار وزن + فیلترها: هشدارها / همه / متوقف‌شده‌ها / تکمیل‌کرده‌ها):

```html
<iframe src="/admin-intuitive.html?view=bar&api=/api&token={ADMIN_TOKEN}"
        style="width:100%;border:0;height:178px"></iframe>
<script>
addEventListener("message", e => {
  if (e.data?.type !== "intuitive-filter") return;
  // e.data.filter = alert | all | stop | done ، e.data.user_ids = شناسهٔ مشترکین
  document.querySelectorAll("[data-user-id]").forEach(r =>
    r.style.display = e.data.user_ids.includes(+r.dataset.userId) ? "" : "none");
});
</script>
```

**ستون «تغذیهٔ شهودی» در جدول:**

```html
<script src="/intuitive-cell.js"></script>
<script>
// برای هر ردیف: day = روز فعلی، status = ok|alert|stop|done، last14 = امتیاز اجرا در ۱۴ روز اخیر (0 = انجام نشده)
td.innerHTML = intuitiveCell({day: 13, status: "alert", last14: [8,0,7,9,...]});
</script>
```

**تب در پروفایل مشترک:**

```html
<iframe id="ibox" src="/admin-intuitive.html?view=box&open=1&user={USER_ID}&api=/api&token={ADMIN_TOKEN}"
        style="width:100%;border:0"></iframe>
<script>addEventListener("message",e=>{if(e.data?.type==="intuitive-height")ibox.style.height=e.data.height+4+"px"})</script>
```

## ۱.۶ قواعد هشدارها

| هشدار | شرط |
|---|---|
| 🔴 متوقف | از ۳ روز پیش هیچ `done` ثبت نشده |
| 🟠 دیابت – احتمال افت قند | `track=sukari` و `hunger <= 2` |
| 🟠 پرخوری احساسی | یادداشت شامل این کلمات باشد: إفراط، ذنب، تعويض، ما قدرت، أكلت كثير، انهرت، خربت |
| 🟢 برنامه را تمام کرد | روز ۳۰ انجام شده |

**آمار نوار:** مجموع کاهش وزن = Σ(اولین وزن − آخرین وزن). میانگین هر دوره (۱۴ / ۳۰ / ۹۰ روز) = میانگینِ (اولین اندازه‌گیری داخل دوره − آخرین اندازه‌گیری) برای مشترکینی که حداقل دو اندازه‌گیری در آن دوره دارند.

# ۲) پروفایل مشترک در پنل (چیدمان جدید)

مرجع بصری: `admin-profile-preview.html`. روی صفحهٔ پروفایل فعلی و با همان داده‌های موجود پیاده شود:

1. **سربرگ سرمه‌ای شیک** (همان رنگ‌های منوی کناری): نام، شمارهٔ مشترک و تاریخ ثبت‌نام، نوع رژیم، وضعیت اشتراک، وضعیت سلامت + دکمه‌ها: واتساپ، تماس، لینک اپلیکیشن، لینک تمدید، ویرایش.
2. **همهٔ اطلاعات شخصی داخل سربرگ**: جنسیت، سن، قد، دور مچ، موبایل، ایمیل، کشور، وضعیت سلامت، نوع اشتراک، روزهای باقی‌مانده.
3. **ردیف اعداد**: وزن فعلی، وزن اولیه، کاهش وزن، **وزن هدف** (اگر وجود ندارد، فیلد جدید اضافه شود)، BMI، کالری.
4. **نمودار وزن** (با خط هدف) + **کارت هدف** (باقی‌مانده، درصد پیشرفت، میانگین هفتگی، زمان تقریبی رسیدن).
5. **سابقهٔ برنامه‌ها**: همهٔ برنامه‌های غذایی و ورزشی قبلی و فعلی (نام، تاریخ، کالری/تعداد روز).
6. **تب‌های برنامه‌ها**:
   - 🍽 برنامهٔ غذایی: افزودن • ویرایش • دانلود • حذف
   - 🏋️ برنامهٔ ورزشی: افزودن • دانلود • حذف
   - 🧠 برنامهٔ تغذیهٔ شهودی (iframe – بخش ۱.۵)
7. **یادداشت‌های عملکرد** جداگانه در انتهای صفحه و همیشه نمایان.

دکمه‌ها در پیش‌نمایش فقط ظاهری هستند – به همان عملکردهای فعلی پنل متصل شوند.

# ۳) گزارش مشتری (CRM)

## ۳.۱ روند فعلی

1. کارمند `crm/builder.html` را باز می‌کند، اطلاعات مشتری را از CRM وارد می‌کند (علائم، علت‌ها، برنامه، نتیجه، «اگر شروع نکند»، پکیج‌ها، قیمت‌ها، هدایا، کارشناس) ← «ساخت لینک».
2. لینک `crm/report.html?d=...` (دادهٔ JSON به‌صورت base64 داخل لینک) + دکمهٔ ارسال در واتساپ.
3. مشتری می‌بیند: اعتبار مرکز (مجوز 4416887.01، آمار، لینک نتایج) ← اطلاعات خودش و BMI ← «مسیر تو از اینجا» (درمان / شروع نکردن) ← مسیر وزن ← پکیج‌ها (۳ / ۶ / ۱۲ ماه) و جدول امکانات ← روش‌های پرداخت **فقط مخصوص کشور خودش** ← بعد از پرداخت چه می‌شود + ضمانت ← تکمیل اطلاعات ← پرسش‌های متداول.

## ۳.۲ تنظیمات `crm/config.js`

| کلید | توضیح |
|---|---|
| `whatsapp` | شمارهٔ واتساپ شرکت (بدون +) – **الزامی** |
| `prices` | قیمت پکیج‌ها به دلار: `{"3":95,"6":171,"12":304}` |
| `links.oman` / `links.uae` | لینک درگاه‌های پرداخت (`{usd}` با قیمت جایگزین می‌شود). **لینک امارات خالی است** |
| `track` | آدرس دریافت رویدادهای ردیابی – **الزامی** تا برای کارشناس نمایش داده شود |
| `currency` | نرخ تقریبی ارز هر کشور |
| `methods` | روش‌های پرداخت؛ هر روش به کشورهای `countries` مرتبط است |

اطلاعات ناقص که باید پر شود: شام کش (سوریه)، کارت رافدین (عراق)، لینک پرداخت امارات.

## ۳.۳ موارد لازم در سرور (توصیه‌شده)

**الف) قیمت‌ها از پنل:** یک endpoint که قیمت‌ها را برگرداند و `report.html` به‌جای `config.js` از آن بخواند:
`GET /api/crm/prices` ← `{"3":95,"6":171,"12":304}` (از تنظیمات پنل قابل ویرایش).

**ب) لینک کوتاه به‌جای داده داخل لینک (امنیت و حریم خصوصی):**

```sql
CREATE TABLE crm_reports (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  token CHAR(16) UNIQUE NOT NULL,        -- تصادفی
  lead_id BIGINT UNSIGNED NULL,          -- اتصال به مشتری CRM
  created_by BIGINT UNSIGNED NULL,
  data JSON NOT NULL,                    -- همان JSON تولیدشده توسط builder.html
  created_at TIMESTAMP NULL
);
```

- `POST /api/crm/reports` ← JSON را ذخیره و `token` را برمی‌گرداند.
- لینک به `https://di3t-club.com/report/{token}` تبدیل می‌شود و `report.html` به‌جای خواندن `?d=` از `GET /api/crm/reports/{token}` می‌خواند.
- بهتر: دکمهٔ «ساخت گزارش» داخل صفحهٔ مشتری در «مشتریان رژیم غذایی (CRM)» که فیلدها را خودکار پر کند.

**ج) ردیابی (باز شدن گزارش / کلیک روی پرداخت):**

```sql
CREATE TABLE crm_events (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  lead_id VARCHAR(32) NULL, event VARCHAR(30) NOT NULL,   -- report_opened | pay_clicked
  plan VARCHAR(5) NULL, method VARCHAR(20) NULL, country VARCHAR(40) NULL,
  phone VARCHAR(30) NULL, payload JSON NULL, created_at TIMESTAMP NULL
);
```

- `POST /api/crm/track` دریافت می‌کند (متن JSON از طریق `sendBeacon`):

```json
{"event":"pay_clicked","lead":"lq3x9a","name":"...","phone":"...","country":"الكويت","plan":"6","method":"oman","url":"...","at":"2026-11-28T10:00:00Z"}
```

- در پنل: نمایش 👁 باز شدن گزارش و 💳 کلیک روی پرداخت (زمان و پکیج) روی مشتری + اعلان برای کارشناس.
- سپس در `config.js`: `track: "https://di3t-club.com/api/crm/track"`.
- جایگزین سریع بدون سرور: Google Sheet (توضیح در `CRM_TRACKING.md`).

# ۴) امنیت و حریم خصوصی

- `crm/config.js` شامل اطلاعات حساب‌های نمایندگان است – **نباید در GitHub عمومی قرار گیرد** (در `.gitignore` هست).
- همهٔ توکن‌ها از طریق `Authorization: Bearer` ارسال شوند و بررسی شود که کارشناس فقط مشترکین خودش را ببیند.
- صفحات ادمین (`admin-intuitive.html`) فقط از داخل پنل و پشت ورود (login) سرو شوند.
- CORS: اگر صفحات روی همان دامنه باشند نیازی نیست؛ در غیر این صورت هدر `Authorization` مجاز شود.
- توصیه می‌شود به لینک‌های کوتاه گزارش (۳.۳ ب) مهاجرت شود تا اطلاعات مشتری داخل لینک نباشد.

# ۵) ترتیب پیشنهادی اجرا

1. آپلود `crm/` روی دامنه + تکمیل `config.js` (واتساپ، لینک امارات، شام کش، رافدین) – **بلافاصله کار می‌کند**.
2. ردیابی `POST /api/crm/track` + نمایش در CRM.
3. جدول و API تغذیهٔ شهودی (۱.۲ تا ۱.۴) + باز کردن `intuitive.html` از اپلیکیشن.
4. جای‌گذاری در ادمین: نوار، ستون، تب پروفایل (۱.۵).
5. چیدمان جدید پروفایل مشترک (بخش ۲).
6. لینک‌های کوتاه گزارش + قیمت‌ها از پنل (۳.۳ الف و ب).

# ۶) تست

- هر فایل را مستقیم و بدون `api` در مرورگر باز کنید ← با دادهٔ آزمایشی اجرا می‌شود.
- `intuitive.html?day=17&goal=sukari` برای تست هر روز.
- `admin-intuitive.html?view=box&user=2` و `?view=bar`.
- `crm/builder.html` ← پر کردن فرم ← «ساخت لینک» ← «پیش‌نمایش».
