# ربط برنامج الأكل الحدسي مع التطبيق ولوحة الأدمن

الصفحة `intuitive.html` جاهزة وترسل النتائج تلقائياً. المطلوب من المبرمج 3 أشياء فقط.

## 1) فتح الصفحة من التطبيق

تفتح داخل WebView (تبويب جديد أو كرت في "وجباتك اليوم") بهذا الرابط:

```
https://di3t-club.com/intuitive.html?token={USER_TOKEN}&api=https://di3t-club.com/api&goal={TRACK}
```

| المتغير | القيمة |
|---|---|
| `token` | توكن المشترك الحالي (نفس توكن الـ API المستخدم في التطبيق) يُرسل كـ `Authorization: Bearer` |
| `api` | رابط الـ API الأساسي |
| `goal` | نوع النظام: `rashaqa` `sukari` `dhaght` `qolon` `takayos` `haml` (من بيانات الاشتراك) |

## 2) جدول قاعدة البيانات

```sql
CREATE TABLE intuitive_progress (
  id            BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id       BIGINT UNSIGNED NOT NULL,
  day           TINYINT UNSIGNED NOT NULL,          -- 1..30
  track         VARCHAR(20) NOT NULL,
  done          BOOLEAN DEFAULT FALSE,
  commitment    TINYINT NULL,   -- كم طبّق التمرين 1..10 (كل يوم)
  hunger        TINYINT NULL,   -- الجوع قبل الأكل 1..10 (أيام 1،4،25)
  fullness      TINYINT NULL,   -- الشبع/الامتلاء 1..10
  satisfaction  TINYINT NULL,   -- الرضا 1..10 (أيام 5،15،23،24،29)
  note          TEXT NULL,
  final_answers JSON NULL,      -- إجابات تقييم الشهر (يوم 30 فقط)
  completed_at  DATETIME NULL,
  created_at    TIMESTAMP NULL, updated_at TIMESTAMP NULL,
  UNIQUE KEY (user_id, day)
);
-- وفي جدول المشتركين (أو الاشتراك):
ALTER TABLE users ADD intuitive_start_date DATE NULL;
```

## 3) الـ API (endpoint واحد بطريقتين)

### `POST /api/intuitive/progress`
يُرسل عند ضغط "أنجزت" وعند تعديل الملاحظات بعدها. **upsert** على (user_id, day).
إذا `intuitive_start_date` فاضي → احفظ تاريخ اليوم.

```json
{"day":25,"track":"sukari","done":true,"commitment":8,"hunger":4,"fullness":7,
 "satisfaction":null,"note":"...","completed_at":"2026-11-14T12:38:23Z"}
```

### `GET /api/intuitive/progress`
يرجع تقدم المشترك (حتى يشتغل على أكثر من جهاز):

```json
{"start_date":"2026-11-01","track":"sukari",
 "days":[{"day":1,"done":true,"commitment":5,"hunger":2,"fullness":9,"satisfaction":null,"note":"..."}]}
```

> CORS: إذا الصفحة على نفس الدومين ما يحتاج شي. غير ذلك اسمح بـ `Authorization` header.

## 4) لوحة الأدمن – صفحة المشترك

أضف قسم **"الأكل الحدسي"** بجانب الوزن والقياسات:

**كروت سريعة:** اليوم الحالي (x/30) • أيام منجزة • نسبة الالتزام • متوسط التطبيق • آخر نشاط.

**رسم بياني واحد مشترك (الأهم):** محور زمني فيه
- خط الوزن (من القياسات الموجودة)
- أعمدة `commitment` اليومية
- (للسكري/الضغط) خط القراءات إن وُجدت
→ الأخصائية تشوف هل الالتزام بالأكل الحدسي أثّر على الوزن.

**جدول الأيام:** يوم • عنوان التمرين • منجز • التطبيق • الجوع • الشبع • الرضا • الملاحظة. مع إمكانية رد الأخصائية على الملاحظة (يظهر للمشترك كرسالة مثل رسائل "د. ..." الحالية).

**تنبيهات في قائمة المشتركين:**
| الحالة | الشرط |
|---|---|
| 🔴 متوقف | لا يوجد `done` منذ 3 أيام |
| 🟠 سكري – احتمال هبوط | `track=sukari` و `hunger <= 2` |
| 🟠 أكل عاطفي | الملاحظة فيها: إفراط، ذنب، تعويض، ما قدرت، أكلت كثير |
| 🟢 أكمل البرنامج | day 30 done → اقتراح المستوى الثاني / تجديد |

## 5) ما يشوفه المشترك

موجود في الصفحة: زر **📊 نتيجتي** (أيام منجزة، نسبة الالتزام، رسم التطبيق اليومي، مقارنة الأسبوع الأول بالحالي للجوع والشبع والرضا). يظهر تلقائياً بعد اليوم 30.
واختياري في التطبيق: إضافة خط "الالتزام بالأكل الحدسي" في تبويب **حالة** بجانب الوزن، من نفس `GET`.
