# ♥ Sevgi Muzeyi — 3D romantik muzey simulyatori

Three.js'da yozilgan brauzer simulyatori: romantik zal, devorlarda rasmlar galereyasi,
va siz boshqaradigan kichkina **panda** (qoʻlida atirgul bilan).

## Ishga tushirish (Antigravity yoki istalgan IDE)
1. Zipni oching va papkani Antigravity'da oching.
2. Terminalda (ES-modullar uchun lokal server kerak — `index.html`ni ikki marta bosib ochmang):
   - `npm start`  (Node.js bor boʻlsa) **yoki**
   - `python3 serve.py`
3. Brauzerda `http://localhost:5173` ochiladi.

## Telefonda oʻynash
- Oʻyin **16:9 yotiq** sahnada ochiladi. Telefon tik tursa, "yotiq holatga buring" yozuvi chiqadi.
- "Muzeyga kirish" bosilganda butun ekran rejimi yoqiladi (iPhone Safari butun ekranni qoʻllamaydi — u holda saytni "Bosh ekranga qoʻshish" qiling).
- Telefonni bir xil tarmoqda sinash: kompyuterda `npm start` qiling, telefon brauzerida `http://<kompyuter-IP>:5173` oching.

## Boshqaruv
| Amal | Kompyuter | Telefon |
|---|---|---|
| Yurish | W A S D / strelkalar | chap tomondagi **▲ ▼ ◀ ▶** tugmalari (🕹 bilan joystikka almashtirsa boʻladi) |
| Yugurish | Shift | **🏃** tugmasi (yoqish/oʻchirish) |
| Atrofga qarash | sichqonchani sudrash, Q/E | ekranni sudrash yoki **↶ ↷** (ushlab turing) |
| Kamerani yaqinlashtirish | sichqoncha gʻildiragi | — |
| Rasmni kattalashtirish | F yoki rasmni bosish | rasm yonida chiqadigan **🔍** tugmasi yoki rasmni bosish |
| Keyingi/oldingi rasm | ← → | tugmalar yoki barmoq bilan surish |

## Oʻz rasmlaringizni qoʻshish
- **Oson yoʻl:** rasmlarni `photos/` papkasiga `1.jpg`, `2.jpg`, `3.jpg` ... deb nomlab tashlang — muzey oʻzi topadi.
  Sahifani qayta yuklang (kerak boʻlsa `Ctrl+Shift+R`).
- Nomlar boshqacha boʻlsa: `config.js` dagi `photos` roʻyxatiga yozing.
- Tagidagi yozuvlar: `config.js` dagi `captions` roʻyxati (tartib bilan).
- Tez sinash: muzey ichida **📷 Rasm qoʻshish** (vaqtinchalik).
- Zal uzunligi rasmlar soniga qarab avtomatik choʻziladi.

## Sozlash
`config.js` — sarlavha, qizning ismi, devordagi yozuv, musiqa (`music: "music.mp3"`).

## Antigravity agentiga tayyor topshiriqlar (nusxa oling)
- "main.js dagi panda oʻrniga GLTF model yukla (models/panda.glb), animatsiyalarni ulang."
- "Zalga ikkinchi xona qoʻshing — kechki osmon va yulduzlar koʻrinadigan balkon."
- "Rasm oldiga yaqinlashganda kamera avtomatik rasmga qaratilsin."
- "Orqa fonda yumshoq musiqa va qadam tovushlari qoʻshing."

## Fayllar
`index.html` · `style.css` · `main.js` (butun 3D mantiq) · `config.js` · `lib/three.module.js` (Three.js r160, oflayn ishlaydi)
