// Solar Hijri (Shamsi) converter utility
export function gregorianToJalali(gy, gm, gd) {
  const g_d_m = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334];
  let jy = (gy <= 1600) ? 0 : 979;
  gy -= (gy <= 1600) ? 621 : 1600;
  const gy2 = (gm > 2) ? (gy + 1) : gy;
  let days = (365 * gy) + Math.floor((gy2 + 3) / 4) - Math.floor((gy2 + 99) / 100) + Math.floor((gy2 + 399) / 400) - 80 + gd + g_d_m[gm - 1];
  jy += 33 * Math.floor(days / 12053);
  days %= 12053;
  jy += 4 * Math.floor(days / 1461);
  days %= 1461;
  jy += Math.floor((days - 1) / 365);
  if (days > 365) days = (days - 1) % 365;
  const jm = (days < 186) ? (1 + Math.floor(days / 31)) : (7 + Math.floor((days - 186) / 30));
  const jd = 1 + ((days < 186) ? (days % 31) : ((days - 186) % 30));
  return [jy, jm, jd];
}

export function jalaliToGregorian(jy, jm, jd) {
  let gy = (jy <= 979) ? 0 : 1600;
  jy -= (jy <= 979) ? 0 : 979;
  const jy2 = (jm > 6) ? (jy + 1) : jy;
  let days = (365 * jy) + Math.floor(jy2 / 33) + Math.floor((jy2 % 33 + 3) / 4) - 226894 + jd + ((jm < 7) ? ((jm - 1) * 31) : (((jm - 7) * 30) + 186));
  gy += 400 * Math.floor(days / 146097);
  days %= 146097;
  gy += 100 * Math.floor(days / 36524);
  days %= 36524;
  if (days >= 36524) days++;
  gy += 4 * Math.floor(days / 1461);
  days %= 1461;
  gy += Math.floor((days - 1) / 365);
  if (days > 365) days = (days - 1) % 365;
  let gd = days + 1;
  const sal_a = [0, 31, ((gy % 4 === 0 && gy % 100 !== 0) || gy % 400 === 0) ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  let i;
  for (i = 1; i < 13; i++) {
    const temp = sal_a[i];
    if (gd <= temp) break;
    gd -= temp;
  }
  const gm = i;
  return [gy, gm, gd];
}

// Convert YYYY-MM-DD string to Solar Hijri format
export function formatToShamsiStr(dateStr) {
  if (!dateStr) return "";
  const parts = dateStr.split("-");
  if (parts.length !== 3) return dateStr;
  const gy = parseInt(parts[0], 10);
  const gm = parseInt(parts[1], 10);
  const gd = parseInt(parts[2], 10);
  if (isNaN(gy) || isNaN(gm) || isNaN(gd)) return dateStr;
  const [jy, jm, jd] = gregorianToJalali(gy, gm, gd);
  return `${jy}/${jm.toString().padStart(2, "0")}/${jd.toString().padStart(2, "0")}`;
}

export const SHAMSI_MONTH_NAMES_FA = [
  "حمل", "ثور", "جوزا", "سرطان", "اسد", "سنبله",
  "میزان", "عقرب", "قوس", "جدی", "دلو", "حوت"
];

export const SHAMSI_MONTH_NAMES_EN = [
  "Hamal", "Sawr", "Jawza", "Saratan", "Asad", "Sonbola",
  "Mizan", "Aqrab", "Qaws", "Jadi", "Dalw", "Hut"
];

export const SHAMSI_MONTH_NAMES_PS = [
  "وری", "غویی", "غبرګولی", "چنګاښ", "زمری", "وږی",
  "تله", "لړم", "لیندۍ", "مرغومی", "سلواغه", "کب"
];

export function toPashtoNumerals(str) {
  if (str === null || str === undefined) return "";
  const latinDigits = [/0/g, /1/g, /2/g, /3/g, /4/g, /5/g, /6/g, /7/g, /8/g, /9/g];
  const easternDigits = ["۰", "۱", "۲", "۳", "۴", "۵", "۶", "۷", "۸", "۹"];
  let result = str.toString();
  for (let i = 0; i < 10; i++) {
    result = result.replace(latinDigits[i], easternDigits[i]);
  }
  return result;
}
