// ============================================================
//  SOZLAMALAR — shu faylni oʻzgartirsangiz boʻldi ♥
// ============================================================
export const CONFIG = {
  title: "Sevgi Muzeyi",
  subtitle: "Faqat sen uchun",
  herName: "",                 // masalan: "Madina" (kirish oynasida va devorda chiqadi)
  wallText: "Seni sevaman",    // zalning oxiridagi katta yozuv
  intro: "Bu muzeydagi har bir rasm — bizning bir lahzamiz.",

  // RASMLAR — eng oson yoʻl: rasmlarni "photos" papkasiga 1.jpg, 2.jpg, 3.jpg ...
  // deb nomlab tashlang. Muzey ularni OʻZI topadi (jpg, jpeg, png, webp).
  // Raqamlar ketma-ket boʻlsin (1, 2, 3 ...), oʻrtada 2 tadan koʻp boʻsh joy qolmasin.
  //
  // Rasm tagidagi yozuvlar (ixtiyoriy), tartib bilan:
  captions: [
    // "Birinchi uchrashuvimiz",
    // "Sening tabassuming",
  ],

  // Agar fayl nomlari boshqacha boʻlsa (masalan IMG_2041.jpg), shu roʻyxatga yozing —
  // u holda yuqoridagi avtomatik qidiruv oʻchadi:
  photos: [
    { src: "photos/1.jpg", caption: "" },
    { src: "photos/2.jpg", caption: "" },
    { src: "photos/3.jpg", caption: "" },
    { src: "photos/4.jpg", caption: "" },
    { src: "photos/5.jpg", caption: "" },
    { src: "photos/6.jpg", caption: "" },
    { src: "photos/7.jpg", caption: "" },
    { src: "photos/8.jpg", caption: "" },
  ],

  music: "",                   // masalan: "music.mp3" (faylni shu papkaga qoʻying)
};
