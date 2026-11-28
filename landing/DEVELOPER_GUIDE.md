---
title: "دليل المبرمج – إضافات دايت كلوب"
subtitle: "الأكل الحدسي • البنل أدمن • تقرير العميل (CRM)"
lang: ar
dir: rtl
---

# نظرة عامة

هذا الدليل يشرح ثلاث إضافات جاهزة كواجهات (HTML/CSS/JS بدون مكتبات) ومطلوب ربطها بالسيرفر والبنل الحالي (`panel.di3t-club.com`) والتطبيق:

| # | الإضافة | لمن | الحالة |
|---|---|---|---|
| 1 | برنامج الأكل الحدسي (30 يوم) | المشترك في التطبيق + الأخصائية في البنل | الواجهة جاهزة، يحتاج جدول + API |
| 2 | إعادة ترتيب بروفايل المشترك في البنل | الأخصائية / الإدارة | معاينة تصميم فقط – تُطبّق على صفحة البروفايل الحالية |
| 3 | تقرير العميل (CRM) + صفحة إنشاء الرابط + تتبع الدفع | العميل المحتمل + فريق المبيعات | يعمل الآن كملفات ثابتة، ويُفضّل ربطه بالسيرفر |

كل الصفحات RTL، خط Tajawal، وتعمل على الجوال. أي صفحة فيها بيانات تجريبية تعمل بدون سيرفر (وضع العرض) حتى يسهل المعاينة.

# قائمة الملفات

| الملف | الوصف |
|---|---|
| `intuitive.html` | صفحة المشترك: تمرين اليوم (تمرين واحد كل يوم) + شاشة "نتيجتي" |
| `admin-intuitive.html` | واجهة الأدمن للأكل الحدسي بثلاث طرق عرض: `view=full` / `view=box` / `view=bar` |
| `intuitive-cell.js` | خلية عمود "الأكل الحدسي" في جدول المشتركين (حلقة تقدم + آخر 14 يوم) |
| `admin-profile-preview.html` | معاينة التصميم المقترح لبروفايل المشترك كامل |
| `admin-list-preview.html` | معاينة قائمة المشتركين مع الشريط والعمود الجديد |
| `INTUITIVE_INTEGRATION.md` | تفاصيل إضافية لربط الأكل الحدسي (مرجع) |
| `crm/report.html` | تقرير العميل الشخصي (يُرسل له رابطه على واتساب) |
| `crm/builder.html` | صفحة الفريق لإنشاء رابط التقرير |
| `crm/config.js` | ⚠️ إعدادات خاصة: بيانات الدفع، الأسعار، روابط الدفع، التتبع – **لا يُرفع على GitHub** |
| `crm/config.example.js` | نسخة بدون بيانات حساسة |
| `crm/CRM_TRACKING.md` | شرح التتبع (فتح التقرير / الضغط على الدفع) |

# 1) برنامج الأكل الحدسي

## 1.1 صفحة المشترك (التطبيق)

تفتح داخل WebView (تبويب أو كرت في "وجباتك اليوم"):

```
https://di3t-club.com/intuitive.html?token={USER_TOKEN}&api=https://di3t-club.com/api&goal={TRACK}
```

| المتغير | القيمة |
|---|---|
| `token` | توكن المشترك، يُرسل كـ `Authorization: Bearer` |
| `api` | رابط الـ API |
| `goal` | `rashaqa` `sukari` `dhaght` `qolon` `takayos` `haml` (حسب نوع النظام). إذا أُرسل تختفي خانة اختيار النظام |

- يوم البرنامج يُحسب من `start_date` (اليوم الأول = أول فتح).
- المشترك يشوف تمرين واحد فقط، ويفتح التالي بعد منتصف الليل.
- عند "أنجزت" تُرسل النتيجة، وعند أي تعديل بعدها تُرسل مرة أخرى. بدون إنترنت تُحفظ وتُرسل لاحقاً.
- `?day=10` للاختبار فقط.

## 1.2 قاعدة البيانات

```sql
CREATE TABLE intuitive_progress (
  id            BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id       BIGINT UNSIGNED NOT NULL,
  day           TINYINT UNSIGNED NOT NULL,      -- 1..30
  track         VARCHAR(20) NOT NULL,
  done          BOOLEAN DEFAULT FALSE,
  commitment    TINYINT NULL,   -- كم طبّق التمرين 1..10 (كل يوم)
  hunger        TINYINT NULL,   -- الجوع قبل الأكل 1..10
  fullness      TINYINT NULL,   -- الشبع / الامتلاء 1..10
  satisfaction  TINYINT NULL,   -- الرضا 1..10
  note          TEXT NULL,
  reply         TEXT NULL,      -- رد الأخصائية
  final_answers JSON NULL,      -- تقييم الشهر (يوم 30)
  completed_at  DATETIME NULL,
  created_at TIMESTAMP NULL, updated_at TIMESTAMP NULL,
  UNIQUE KEY (user_id, day)
);
ALTER TABLE users ADD intuitive_start_date DATE NULL;
```

## 1.3 API المشترك

**`POST /api/intuitive/progress`** – upsert على (user_id, day). إذا `intuitive_start_date` فارغ → احفظ تاريخ اليوم.

```json
{"day":25,"track":"sukari","done":true,"commitment":8,"hunger":4,"fullness":7,
 "satisfaction":null,"note":"...","completed_at":"2026-11-14T12:38:23Z"}
```

**`GET /api/intuitive/progress`** – يرجع تقدم المشترك (يعمل على أكثر من جهاز) ومعه رد الأخصائية:

```json
{"start_date":"2026-11-01","track":"sukari",
 "days":[{"day":1,"done":true,"commitment":5,"hunger":2,"fullness":9,"satisfaction":null,"note":"...","reply":null}]}
```

## 1.4 API الأدمن

**`GET /api/admin/intuitive/users`** (اختياري `?user_id=ID` لمشترك واحد):

```json
[{"id":12,"name":"...","track":"rashaqa","start_date":"2026-11-01",
  "days":[{"day":1,"done":true,"commitment":8,"hunger":3,"fullness":7,"satisfaction":null,"note":"...","reply":null}],
  "weights":[{"date":"2026-08-01","day":-90,"weight":90.1},{"date":"2026-11-01","day":1,"weight":87.2}]}]
```

- `weights` من جدول القياسات الموجود، **كل التاريخ** (مطلوب لمعدل 3 أشهر).
- `day = (تاريخ القياس − start_date) + 1` (قد يكون سالباً قبل البرنامج).

**`POST /api/admin/users/{id}/intuitive/{day}/reply`** ← `{"reply":"..."}` يُحفظ في `reply`.

## 1.5 التضمين في البنل

**شريط فوق قائمة المشتركين** (إحصائيات الوزن + فلاتر: تنبيهات / الكل / متوقفين / مكملين):

```html
<iframe src="/admin-intuitive.html?view=bar&api=/api&token={ADMIN_TOKEN}"
        style="width:100%;border:0;height:178px"></iframe>
<script>
addEventListener("message", e => {
  if (e.data?.type !== "intuitive-filter") return;
  // e.data.filter = alert | all | stop | done ، e.data.user_ids = أرقام المشتركين
  document.querySelectorAll("[data-user-id]").forEach(r =>
    r.style.display = e.data.user_ids.includes(+r.dataset.userId) ? "" : "none");
});
</script>
```

**عمود "الأكل الحدسي" في الجدول:**

```html
<script src="/intuitive-cell.js"></script>
<script>
// لكل صف: day = اليوم الحالي، status = ok|alert|stop|done، last14 = درجات التطبيق لآخر 14 يوم (0 = فاته)
td.innerHTML = intuitiveCell({day: 13, status: "alert", last14: [8,0,7,9,...]});
</script>
```

**تبويب في بروفايل المشترك:**

```html
<iframe id="ibox" src="/admin-intuitive.html?view=box&open=1&user={USER_ID}&api=/api&token={ADMIN_TOKEN}"
        style="width:100%;border:0"></iframe>
<script>addEventListener("message",e=>{if(e.data?.type==="intuitive-height")ibox.style.height=e.data.height+4+"px"})</script>
```

## 1.6 قواعد التنبيهات

| التنبيه | الشرط |
|---|---|
| 🔴 متوقف | لا يوجد `done` منذ 3 أيام |
| 🟠 سكري – احتمال هبوط | `track=sukari` و `hunger <= 2` |
| 🟠 أكل عاطفي | الملاحظة تحتوي: إفراط، ذنب، تعويض، ما قدرت، أكلت كثير، انهرت، خربت |
| 🟢 أكمل البرنامج | يوم 30 منجز |

**إحصائيات الشريط:** مجموع نزول الوزن = Σ(أول وزن − آخر وزن). معدل الفترة (14 / 30 / 90 يوم) = متوسط (أول قياس داخل الفترة − آخر قياس) للمشتركين اللي عندهم قياسين على الأقل في الفترة.

# 2) بروفايل المشترك في البنل (إعادة الترتيب)

المرجع البصري: `admin-profile-preview.html`. يُطبّق على صفحة البروفايل الحالية بنفس البيانات الموجودة:

1. **رأس كحلي فخم** (نفس ألوان القائمة الجانبية): الاسم، رقم المشترك وتاريخ التسجيل، نوع النظام، حالة الاشتراك، الحالة الصحية + أزرار: واتساب، اتصال، رابط التطبيق، رابط التجديد، تعديل.
2. **كل المعلومات الشخصية داخل الرأس**: الجنس، العمر، الطول، محيط المعصم، الجوال، البريد، الدولة، الحالة الصحية، نوع الاشتراك، الأيام المتبقية.
3. **سطر أرقام**: الوزن الحالي، الأولي، النزول، **الوزن المستهدف** (حقل جديد إذا غير موجود)، BMI، السعرات.
4. **مخطط الوزن** (مع خط الهدف) + **كرت الهدف** (المتبقي، نسبة الإنجاز، المعدل الأسبوعي، الوقت المتوقع).
5. **سجل الخطط**: كل الخطط الغذائية والرياضية السابقة والحالية (الاسم، التاريخ، السعرات/الأيام).
6. **تبويبات البرامج**:
   - 🍽 البرنامج الغذائي: إضافة • تعديل • تحميل • حذف
   - 🏋️ البرنامج الرياضي: إضافة • تحميل • حذف
   - 🧠 برنامج الأكل الحدسي (iframe – القسم 1.5)
7. **ملاحظات الأداء** منفصلة في آخر الصفحة وظاهرة دائماً.

الأزرار في المعاينة شكلية – تُربط بنفس وظائف البنل الحالية.

# 3) تقرير العميل (CRM)

## 3.1 كيف يعمل الآن

1. الموظف يفتح `crm/builder.html`، يعبّي بيانات العميل من CRM (الأعراض، الأسباب، البرنامج، النتيجة، "إذا ما بدأ"، الباقات، الأسعار، الهدايا، الأخصائية) ← يضغط "إنشاء رابط".
2. الرابط `crm/report.html?d=...` (البيانات JSON مشفرة base64 داخل الرابط) + زر إرسال على واتساب.
3. العميل يشوف: ثقة المركز (الترخيص 4416887.01، الأرقام، رابط النتائج) ← بياناته و BMI ← "طريقك من هنا" (العلاج / بدون بداية) ← رحلة الوزن ← الباقات (3 / 6 / 12 شهر) وجدول المميزات ← طرق الدفع **حسب بلده فقط** ← ماذا يحدث بعد الدفع + الضمان ← كمّل بياناتك ← أسئلة شائعة.

## 3.2 الإعدادات `crm/config.js`

| المفتاح | الوصف |
|---|---|
| `whatsapp` | رقم واتساب الشركة (بدون +) – **مطلوب** |
| `prices` | أسعار الباقات بالدولار: `{"3":95,"6":171,"12":304}` |
| `links.oman` / `links.uae` | روابط بوابات الدفع (`{usd}` يُستبدل بالسعر). **رابط الإمارات ناقص** |
| `track` | رابط استقبال أحداث التتبع – **مطلوب** حتى تظهر للأخصائية |
| `currency` | سعر صرف تقريبي لكل دولة |
| `methods` | طرق الدفع وكل طريقة مرتبطة بدول `countries` |

بيانات ناقصة يجب تعبئتها: شام كاش (سوريا)، كارت الرافدين (العراق)، رابط دفع الإمارات.

## 3.3 المطلوب من السيرفر (موصى به)

**أ) الأسعار من البنل:** endpoint يرجع الأسعار، و`report.html` يقرأها بدل `config.js`:
`GET /api/crm/prices` ← `{"3":95,"6":171,"12":304}` (تُعدّل من الإعدادات في البنل).

**ب) روابط قصيرة بدل البيانات داخل الرابط (أمان وخصوصية):**

```sql
CREATE TABLE crm_reports (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  token CHAR(16) UNIQUE NOT NULL,        -- عشوائي
  lead_id BIGINT UNSIGNED NULL,          -- ربط بعميل CRM
  created_by BIGINT UNSIGNED NULL,
  data JSON NOT NULL,                    -- نفس JSON اللي يولده builder.html
  created_at TIMESTAMP NULL
);
```

- `POST /api/crm/reports` ← يحفظ JSON ويرجع `token`.
- الرابط يصير `https://di3t-club.com/report/{token}`، و `report.html` يجلب `GET /api/crm/reports/{token}` بدل قراءة `?d=`.
- أفضل: زر "إنشاء تقرير" داخل صفحة العميل في "عملاء النظام الغذائي (CRM)" يعبّي الحقول تلقائياً.

**ج) التتبع (فتح التقرير / الضغط على الدفع):**

```sql
CREATE TABLE crm_events (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  lead_id VARCHAR(32) NULL, event VARCHAR(30) NOT NULL,   -- report_opened | pay_clicked
  plan VARCHAR(5) NULL, method VARCHAR(20) NULL, country VARCHAR(40) NULL,
  phone VARCHAR(30) NULL, payload JSON NULL, created_at TIMESTAMP NULL
);
```

- `POST /api/crm/track` يستقبل (نص JSON عبر `sendBeacon`):

```json
{"event":"pay_clicked","lead":"lq3x9a","name":"...","phone":"...","country":"الكويت","plan":"6","method":"oman","url":"...","at":"2026-11-28T10:00:00Z"}
```

- في البنل: عرض 👁 فتح التقرير و 💳 ضغط الدفع (الوقت والباقة) على العميل + تنبيه للأخصائية.
- ثم في `config.js`: `track: "https://di3t-club.com/api/crm/track"`.
- بديل سريع بدون سيرفر: Google Sheet (الشرح في `CRM_TRACKING.md`).

# 4) الأمان والخصوصية

- `crm/config.js` فيه بيانات حسابات الوكلاء – **لا يُرفع على GitHub العام** (موجود في `.gitignore`).
- كل التوكنات تمر عبر `Authorization: Bearer`، وتحقق أن الأخصائية تشوف مشتركيها فقط.
- صفحات الأدمن (`admin-intuitive.html`) تُخدم من داخل البنل فقط وخلف تسجيل الدخول.
- CORS: إذا الصفحات على نفس الدومين لا حاجة. غير ذلك اسمح بـ `Authorization`.
- يُنصح بالانتقال لروابط التقرير القصيرة (3.3 ب) حتى لا تكون بيانات العميل داخل الرابط.

# 5) ترتيب التنفيذ المقترح

1. رفع `crm/` على الدومين + تعبئة `config.js` (واتساب، رابط الإمارات، شام كاش، الرافدين) – **يعمل فوراً**.
2. التتبع `POST /api/crm/track` + عرضه في CRM.
3. جدول وAPI الأكل الحدسي (1.2 – 1.4) + فتح `intuitive.html` من التطبيق.
4. تضمين الأدمن: الشريط، العمود، تبويب البروفايل (1.5).
5. إعادة ترتيب بروفايل المشترك (القسم 2).
6. روابط التقرير القصيرة + الأسعار من البنل (3.3 أ، ب).

# 6) الاختبار

- افتح أي ملف مباشرة في المتصفح بدون `api` ← يعمل ببيانات تجريبية.
- `intuitive.html?day=17&goal=sukari` لاختبار أي يوم.
- `admin-intuitive.html?view=box&user=2` و `?view=bar`.
- `crm/builder.html` ← عبّي ← "إنشاء رابط" ← "معاينة".
