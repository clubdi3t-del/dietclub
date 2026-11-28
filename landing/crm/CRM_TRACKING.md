# تتبع العملاء في صفحة التقرير

صفحة `report.html` ترسل حدثين إلى الرابط المكتوب في `track` داخل `config.js`:

| الحدث | متى |
|---|---|
| `report_opened` | العميل فتح التقرير |
| `pay_clicked` | العميل ضغط "ادفع الآن" (بعدها يتحول مباشرة لرابط الدفع) |

البيانات المرسلة (POST، نص JSON):
```json
{"event":"pay_clicked","lead":"lq3x9a","name":"...","phone":"...","country":"الكويت","plan":"6","method":"oman","url":"https://api.di3t-club.com/pay/","at":"2026-11-28T10:00:00Z"}
```

## الخيار 1: في البنل (الأفضل)
المبرمج يضيف endpoint مثل `POST /api/crm/track` يحفظ الحدث على العميل في "عملاء النظام الغذائي (CRM)"،
ويعرض في صفحة العميل وقائمة الـ CRM: 👁 فتح التقرير • 💳 ضغط الدفع (مع الوقت والباقة)، ويرسل تنبيه للأخصائية.
ثم: `track: "https://api.di3t-club.com/api/crm/track"`

## الخيار 2: Google Sheet (بدون مبرمج – 5 دقائق)
1. افتح Google Sheet جديد ← Extensions ← Apps Script، والصق:
```js
function doPost(e){const d=JSON.parse(e.postData.contents);
  SpreadsheetApp.getActive().getSheets()[0].appendRow([new Date(),d.event,d.name,d.phone,d.country,d.plan,d.method||""]);
  return ContentService.createTextOutput("ok");}
```
2. Deploy ← New deployment ← Web app ← Who has access: Anyone ← انسخ الرابط.
3. حطه في `config.js`: `track: "الرابط"`.
الأخصائية تشوف كل ضغطة كسطر جديد في الشيت.
