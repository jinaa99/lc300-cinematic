import type { Localized, SourceReference, Text, VehicleFeature, VehicleSpec } from "@/types/content";

/**
 * Verified Land Cruiser 300 specifications and equipment.
 *
 * Add entries only from an official Toyota source (or homologation
 * documents) and record the market and edition each one applies to. Nothing
 * in the UI or the copy should hard-code a figure. Editorial text lives in
 * src/content/copy; this file holds facts only.
 *
 * Everything below is from one document, Toyota Japan's spec sheet (March
 * 2025): page 1 is the specification table (主要諸元表), pages 3–4 the
 * equipment table (主要装備一覧表), where availability is colour-coded per
 * grade. Prices in the sheet are left out on purpose (non-commercial site).
 *
 * Not included, because no official Toyota source was found for them:
 * towing capacity and payload (any market), and anything for the GCC or
 * Australian markets.
 */

export const toyotaJapan2025: SourceReference = {
  title: "トヨタ ランドクルーザー“300” 主要諸元表・主要装備一覧表 (Toyota Land Cruiser 300 specifications and equipment), March 2025",
  url: "https://toyota.jp/pages/contents/landcruiser300/004_p_001/pdf/landcruiser300_spec_202503.pdf",
  retrievedAt: "2026-10-15",
  edition: "2025-03",
  market: "japan",
};

const src = toyotaJapan2025;
const t = (en: string, mn: string): Localized => ({ en, mn });

// Grade groups, as the sheet splits them.
const ALL = t("All grades", "Бүх хувилбар");
const DIESEL = t("ZX, GR SPORT (3.3L diesel)", "ZX, GR SPORT (3.3L дизель)");
const PETROL = t("ZX, GR SPORT, VX, AX, GX (3.5L petrol)", "ZX, GR SPORT, VX, AX, GX (3.5L бензин)");
const ZX = "ZX";
const GR = "GR SPORT";
const ZX_GR = "ZX, GR SPORT";
const VX_AX_GX = "VX, AX, GX";

/** Japan-market grades, engines, seats and model codes (spec table, page 1). */
export type GradeRow = { grade: string; engine: Localized; seats: number; modelCode: string };
export const japanGrades: readonly GradeRow[] = [
  { grade: "ZX", engine: t("3.3L diesel", "3.3L дизель"), seats: 5, modelCode: "3DA-FJA300W-GMUZY" },
  { grade: "GR SPORT", engine: t("3.3L diesel", "3.3L дизель"), seats: 5, modelCode: "3DA-FJA300W-GMUSY" },
  { grade: "ZX", engine: t("3.5L petrol", "3.5L бензин"), seats: 7, modelCode: "3BA-VJA300W-GNUZZ" },
  { grade: "GR SPORT", engine: t("3.5L petrol", "3.5L бензин"), seats: 7, modelCode: "3BA-VJA300W-GNUSZ" },
  { grade: "VX", engine: t("3.5L petrol", "3.5L бензин"), seats: 7, modelCode: "3BA-VJA300W-GNUVZ" },
  { grade: "AX", engine: t("3.5L petrol", "3.5L бензин"), seats: 7, modelCode: "3BA-VJA300W-GNUAZ" },
  { grade: "GX", engine: t("3.5L petrol", "3.5L бензин"), seats: 5, modelCode: "3BA-VJA300W-GMUGZ" },
];

const engine: VehicleSpec[] = [
  {
    id: "jp-engine",
    label: t("Engine", "Хөдөлгүүр"),
    value: [
      { grades: DIESEL, value: t("F33A-FTV, V6 twin-turbo diesel with intercooler", "F33A-FTV, интеркүлертэй V6 ихэр турбо дизель") },
      { grades: PETROL, value: t("V35A-FTS, V6 twin-turbo with intercooler", "V35A-FTS, интеркүлертэй V6 ихэр турбо") },
    ],
    source: src,
  },
  {
    id: "jp-displacement",
    label: t("Displacement", "Ажлын эзэлхүүн"),
    value: [
      { grades: DIESEL, value: "3.345 L" },
      { grades: PETROL, value: "3.444 L" },
    ],
    source: src,
  },
  {
    id: "jp-bore-stroke",
    label: t("Bore × stroke", "Цилиндрийн диаметр × поршений явалт"),
    value: [
      { grades: DIESEL, value: "86.0 × 96.0 mm" },
      { grades: PETROL, value: "85.5 × 100.0 mm" },
    ],
    source: src,
  },
  {
    id: "jp-fuel",
    label: t("Fuel", "Түлш"),
    value: [
      { grades: DIESEL, value: t("Diesel", "Дизель түлш") },
      { grades: PETROL, value: t("Unleaded premium petrol", "Хар тугалгагүй премиум бензин") },
    ],
    source: src,
  },
  {
    id: "jp-power",
    label: t("Maximum power (net)", "Дээд хүч (цэвэр)"),
    value: [
      { grades: DIESEL, value: "226 kW (307 PS) / 4,000 rpm" },
      { grades: PETROL, value: "305 kW (415 PS) / 5,200 rpm" },
    ],
    source: src,
  },
  {
    id: "jp-torque",
    label: t("Maximum torque (net)", "Дээд эргэлтийн момент (цэвэр)"),
    value: [
      { grades: DIESEL, value: "700 N·m (71.4 kgf·m) / 1,600–2,600 rpm" },
      { grades: PETROL, value: "650 N·m (66.3 kgf·m) / 2,000–3,600 rpm" },
    ],
    source: src,
  },
  {
    id: "jp-fuel-system",
    label: t("Fuel system", "Түлш шахах систем"),
    value: [
      { grades: DIESEL, value: t("Common-rail injection", "Common-rail шахалт") },
      { grades: PETROL, value: t("EFI (electronic fuel injection)", "EFI (электрон түлш шахалт)") },
    ],
    source: src,
  },
  { id: "jp-tank", label: t("Fuel tank", "Түлшний савны багтаамж"), value: "80 L", source: src },
  {
    id: "jp-transmission",
    label: t("Transmission", "Хурдны хайрцаг"),
    value: t(
      "Direct Shift-10AT (electronically controlled 10-speed automatic)",
      "Direct Shift-10AT (электрон удирдлагатай 10 шатлалт автомат)",
    ),
    source: src,
  },
  {
    id: "jp-gear-ratios",
    label: t("Gear ratios (1st–10th / reverse)", "Шилжүүлгийн харьцаа (1–10 / ухрах)"),
    value: "4.923 / 3.257 / 2.349 / 1.944 / 1.532 / 1.193 / 1.000 / 0.801 / 0.661 / 0.613 / 4.307",
    source: src,
  },
  { id: "jp-final-drive", label: t("Final drive ratio", "Эцсийн дамжуулгын харьцаа"), value: "3.307", source: src },
  {
    id: "jp-drivetrain",
    label: t("Drivetrain", "Хөтлөгч"),
    value: t("Full-time 4WD", "Байнгын 4WD"),
    source: src,
  },
  {
    id: "jp-economy",
    label: t("Fuel economy, combined", "Түлшний зарцуулалт, хосолсон"),
    value: [
      { grades: DIESEL, value: "9.7 km/L" },
      { grades: "ZX, GR SPORT, VX (3.5L)", value: "7.9 km/L" },
      { grades: "AX, GX (3.5L)", value: "8.0 km/L" },
    ],
    note: t(
      "WLTC mode, as reviewed by Japan's Ministry of Land, Infrastructure, Transport and Tourism. Real-world consumption varies.",
      "WLTC горим, Японы Газар, дэд бүтэц, тээвэр, аялал жуулчлалын яамны хянасан утга. Бодит зарцуулалт өөр байж болно.",
    ),
    source: src,
  },
  {
    id: "jp-economy-modes",
    label: t("Fuel economy, urban / suburban / highway", "Түлшний зарцуулалт, хот / хотын зах / хурдны зам"),
    value: [
      { grades: DIESEL, value: "7.4 / 9.7 / 11.1 km/L" },
      { grades: "ZX, GR SPORT, VX (3.5L)", value: "5.4 / 8.2 / 9.5 km/L" },
      { grades: "AX, GX (3.5L)", value: "5.5 / 8.3 / 9.7 km/L" },
    ],
    note: t("WLTC mode.", "WLTC горим."),
    source: src,
  },
];

const dimensions: VehicleSpec[] = [
  {
    id: "jp-length",
    label: t("Overall length", "Нийт урт"),
    value: [
      { grades: ZX, value: "4,985 mm" },
      { grades: GR, value: "4,965 mm" },
      { grades: VX_AX_GX, value: "4,950 mm" },
    ],
    note: t("+30 mm with the tow hitch.", "Чирэх төхөөрөмжтэй бол +30 мм."),
    source: src,
  },
  {
    id: "jp-width",
    label: t("Overall width", "Нийт өргөн"),
    value: [
      { grades: t("ZX, VX, AX, GX", "ZX, VX, AX, GX"), value: "1,980 mm" },
      { grades: GR, value: "1,990 mm" },
    ],
    source: src,
  },
  { id: "jp-height", label: t("Overall height", "Нийт өндөр"), value: "1,925 mm", source: src },
  { id: "jp-wheelbase", label: t("Wheelbase", "Тэнхлэг хоорондын зай"), value: "2,850 mm", source: src },
  { id: "jp-track", label: t("Track, front / rear", "Дугуйн мөр, урд / хойд"), value: "1,665 / 1,665 mm", source: src },
  { id: "jp-turning", label: t("Minimum turning radius", "Эргэлтийн хамгийн бага радиус"), value: "5.9 m", source: src },
  {
    id: "jp-kerb",
    label: t("Kerb weight", "Өөрийн жин"),
    value: [
      { grades: t("ZX diesel", "ZX дизель"), value: "2,550 kg" },
      { grades: t("GR SPORT diesel", "GR SPORT дизель"), value: "2,560 kg" },
      { grades: t("ZX petrol", "ZX бензин"), value: "2,500 kg" },
      { grades: t("GR SPORT petrol", "GR SPORT бензин"), value: "2,520 kg" },
      { grades: "VX", value: "2,440 kg" },
      { grades: "AX", value: "2,430 kg" },
      { grades: "GX", value: "2,360 kg" },
    ],
    note: t("Base figures. Options such as the roof rails, moonroof or cold-climate package add weight.", "Үндсэн утга. Дээврийн хашлага, люк, хүйтэн бүсийн багц зэрэг нэмэлтүүд жинг нэмэгдүүлнэ."),
    source: src,
  },
  {
    id: "jp-gvw",
    label: t("Gross vehicle weight", "Бүрэн жин"),
    value: [
      { grades: t("ZX diesel", "ZX дизель"), value: "2,825 kg" },
      { grades: t("GR SPORT diesel", "GR SPORT дизель"), value: "2,835 kg" },
      { grades: t("ZX petrol", "ZX бензин"), value: "2,885 kg" },
      { grades: t("GR SPORT petrol", "GR SPORT бензин"), value: "2,905 kg" },
      { grades: "VX", value: "2,825 kg" },
      { grades: "AX", value: "2,815 kg" },
      { grades: "GX", value: "2,635 kg" },
    ],
    note: t("Base figures, before options.", "Нэмэлт тоноглолгүй үндсэн утга."),
    source: src,
  },
  {
    id: "jp-tyres",
    label: t("Tyres and wheels", "Дугуй ба обуд"),
    value: [
      { grades: ZX, value: t("265/55R20, 20 × 8J alloy", "265/55R20, 20 × 8J хайлш обуд") },
      { grades: t("GR SPORT, VX, AX, GX", "GR SPORT, VX, AX, GX"), value: t("265/65R18, 18 × 7½J alloy", "265/65R18, 18 × 7½J хайлш обуд") },
    ],
    source: src,
  },
];

const interior: VehicleSpec[] = [
  {
    id: "jp-seats",
    label: t("Seating capacity", "Суудлын тоо"),
    value: [
      { grades: t("ZX diesel, GR SPORT diesel, GX", "ZX дизель, GR SPORT дизель, GX"), value: t("5 seats", "5 суудал") },
      { grades: t("ZX petrol, GR SPORT petrol, VX, AX", "ZX бензин, GR SPORT бензин, VX, AX"), value: t("7 seats", "7 суудал") },
    ],
    source: src,
  },
  {
    id: "jp-interior-dims",
    label: t("Interior length / width / height", "Салоны урт / өргөн / өндөр"),
    value: [
      { grades: t("5 seats", "5 суудалтай"), value: "1,955 / 1,640 / 1,190–1,210 mm" },
      { grades: t("7 seats", "7 суудалтай"), value: "2,755 / 1,640 / 1,190–1,210 mm" },
    ],
    note: t(
      "Measured by Toyota. Height depends on the grade and on whether the moonroof is fitted.",
      "Toyota-гийн хэмжилт. Өндөр нь хувилбар болон люктэй эсэхээс хамаарна.",
    ),
    source: src,
  },
  {
    id: "jp-upholstery",
    label: t("Seat upholstery", "Суудлын бүрээс"),
    value: [
      { grades: t("ZX, GR SPORT, VX", "ZX, GR SPORT, VX"), value: t("Leather (synthetic leather in parts)", "Арьс (зарим хэсэгт хиймэл арьс)") },
      { grades: "AX", value: t("Suede-effect fabric", "Замш төст даавуу") },
      { grades: "GX", value: t("Fabric", "Даавуу") },
    ],
    source: src,
  },
  {
    id: "jp-third-row",
    label: t("Third-row seats", "Гурав дахь эгнээний суудал"),
    value: [
      { grades: t("ZX petrol, GR SPORT petrol, VX", "ZX бензин, GR SPORT бензин, VX"), value: t("5:5 split, power fold into the floor", "5:5 хуваагдсан, цахилгаанаар шалан дор эвхэгдэнэ") },
      { grades: "AX", value: t("5:5 split, manual fold into the floor", "5:5 хуваагдсан, гараар шалан дор эвхэгдэнэ") },
    ],
    note: t("5-seat grades have no third row.", "5 суудалтай хувилбарт гурав дахь эгнээ байхгүй."),
    source: src,
  },
  {
    id: "jp-meter",
    label: t("Instrument cluster", "Хэмжүүрийн самбар"),
    value: [
      { grades: t("ZX, GR SPORT, VX", "ZX, GR SPORT, VX"), value: t("12.3-inch TFT colour meter", "12.3 инчийн TFT өнгөт дэлгэц") },
      { grades: t("AX, GX", "AX, GX"), value: t("7.0-inch TFT colour meter", "7.0 инчийн TFT өнгөт дэлгэц") },
    ],
    source: src,
  },
];

const offroad: VehicleSpec[] = [
  {
    id: "jp-suspension",
    label: t("Suspension, front / rear", "Түдгэлзүүр, урд / хойд"),
    value: t(
      "Double-wishbone independent, coil springs / trailing-link rigid axle, coil springs",
      "Давхар хөндлөн тулгууртай бие даасан, пүрштэй / чирэгч холбоостой цул тэнхлэг, пүрштэй",
    ),
    note: t("GR SPORT has its own tuning.", "GR SPORT тусгай тохируулгатай."),
    source: src,
  },
  {
    id: "jp-clearance",
    label: t("Minimum ground clearance", "Газраас хамгийн бага өндөр"),
    value: "225 mm",
    note: t("Measured by Toyota.", "Toyota-гийн хэмжилт."),
    source: src,
  },
  { id: "jp-transfer", label: t("Transfer ratio, high / low", "Тараах хайрцгийн харьцаа, өндөр / нам"), value: "1.000 / 2.618", source: src },
  {
    id: "jp-drive-modes",
    label: t("Drive Mode Select", "Жолоодлогын горим сонгох"),
    value: [
      { grades: ZX_GR, value: "ECO / COMFORT / NORMAL / SPORT S / SPORT S+ / CUSTOM" },
      { grades: VX_AX_GX, value: "ECO / NORMAL / SPORT" },
    ],
    source: src,
  },
];

/** Specification groups, in page order. Headings live in the copy (vehicle.groups). */
export const specGroups = { engine, dimensions, interior, offroad } as const;
export type SpecGroupId = keyof typeof specGroups;

const std = (grades: Text = ALL) => ({ grades, status: "standard" as const });
const opt = (grades: Text = ALL, detail?: Text) => ({ grades, status: "factory-option" as const, detail });

const safety: VehicleFeature[] = [
  {
    id: "pcs",
    label: t(
      "Pre-Collision Safety (detects pedestrians and cyclists day and night, motorcyclists by day; millimetre-wave radar and monocular camera)",
      "Мөргөлдөхөөс сэргийлэх систем (явган зорчигч, дугуйчныг өдөр шөнөгүй, мотоциклчныг өдөр илрүүлнэ; миллиметр долгионы радар ба нэг камер)",
    ),
    availability: [std()],
    source: src,
  },
  {
    id: "drcc",
    label: t("Radar cruise control with full-speed range following", "Бүх хурдны мужид дагах радарт круиз контрол"),
    availability: [std()],
    source: src,
  },
  { id: "lta", label: t("Lane Tracing Assist (LTA)", "Эгнээ дагах туслах (LTA)"), availability: [std(t("ZX, GR SPORT, VX", "ZX, GR SPORT, VX"))], source: src },
  { id: "lda", label: t("Lane Departure Alert (LDA)", "Эгнээнээс гарахыг анхааруулах (LDA)"), availability: [std()], source: src },
  { id: "ahs", label: t("Adaptive High-beam System (AHS)", "Дасан зохицох алсын гэрэл (AHS)"), availability: [std(ZX_GR)], source: src },
  { id: "ahb", label: t("Automatic High Beam (AHB)", "Автомат алсын гэрэл (AHB)"), availability: [std(VX_AX_GX)], source: src },
  { id: "rsa", label: t("Road Sign Assist (RSA)", "Замын тэмдэг таних (RSA)"), availability: [std()], source: src },
  {
    id: "edss",
    label: t("Emergency Driving Stop System (driver unresponsive)", "Жолооч хариу үйлдэлгүй болоход зогсоох систем"),
    availability: [std(t("ZX, GR SPORT, VX", "ZX, GR SPORT, VX"))],
    source: src,
  },
  { id: "tmn", label: t("Lead vehicle departure alert (TMN)", "Урд машин хөдлөхийг мэдэгдэх (TMN)"), availability: [std()], source: src },
  {
    id: "bsm",
    label: t(
      "Blind Spot Monitor, Safe Exit Assist, rear cross-traffic alert, rear-end collision warning and secondary collision braking when stopped",
      "Хараагүй бүсийн хяналт, аюулгүй буух туслах, ар талын хөндлөн хөдөлгөөний анхааруулга, ар талын мөргөлдөөний анхааруулга, зогсож байхад хоёрдогч мөргөлдөөний тоормос",
    ),
    availability: [std()],
    source: src,
  },
  {
    id: "psb",
    label: t("Parking Support Brake (static objects front and rear, approaching vehicles and pedestrians behind)", "Зогсоолын туслах тоормос (урд, хойд саад, ар талаас ойртох машин, явган зорчигч)"),
    availability: [std()],
    source: src,
  },
  { id: "pvm", label: t("Panoramic View Monitor with see-through underfloor view", "Шалны доорхыг харуулах панорам камер"), availability: [std()], source: src },
  { id: "svsc", label: t("S-VSC (steering-assisted stability control)", "S-VSC (жолооны тусламжтай тогтворжуулалт)"), availability: [std(t("ZX, GR SPORT, VX", "ZX, GR SPORT, VX"))], source: src },
  { id: "vdim", label: t("VDIM (Vehicle Dynamics Integrated Management)", "VDIM (хөдөлгөөний динамикийн нэгдсэн удирдлага)"), availability: [std(ZX_GR)], source: src },
  {
    id: "abs",
    label: t("VSC, multi-terrain ABS with EBD, and brake assist", "VSC, EBD-тэй олон гадаргын ABS, тоормосны туслах"),
    availability: [std()],
    source: src,
  },
  { id: "dsc", label: t("Drive Start Control", "Хөдлөлтийн хяналт (Drive Start Control)"), availability: [std()], source: src },
  {
    id: "airbags",
    label: t(
      "SRS airbags: front, front knee, side (front and second-row outer seats) and curtain",
      "SRS аюулгүйн дэр: урд, урд өвдөгний, хажуугийн (урд ба хоёр дахь эгнээний захын суудал), хөшигний",
    ),
    availability: [std()],
    note: t("On 5-seat grades the curtain airbags cover the front and second rows only.", "5 суудалтай хувилбарт хөшигний дэр зөвхөн урд ба хоёр дахь эгнээг хамарна."),
    source: src,
  },
  {
    id: "isofix",
    label: t("ISOFIX child-seat anchors with top tether (second-row outer seats)", "ISOFIX хүүхдийн суудлын бэхэлгээ, дээд бүстэй (хоёр дахь эгнээний захын суудал)"),
    availability: [std()],
    source: src,
  },
  { id: "its", label: t("ITS Connect", "ITS Connect"), availability: [opt()], source: src },
];

const offroadFeatures: VehicleFeature[] = [
  {
    id: "4wd",
    label: t("Full-time 4WD, transfer case with Torsen limited-slip centre differential", "Байнгын 4WD, Torsen хязгаарлагдмал гулсалттай төв дифференциалтай тараах хайрцаг"),
    availability: [std()],
    source: src,
  },
  { id: "centre-lock", label: t("Electric centre differential lock", "Төв дифференциалын цахилгаан түгжээ"), availability: [std()], source: src },
  { id: "transfer-switch", label: t("High / low range transfer switch", "Өндөр / нам шатлалын шилжүүлэгч"), availability: [std()], source: src },
  { id: "mts", label: t("Multi-Terrain Select", "Олон гадаргын горим сонгох (Multi-Terrain Select)"), availability: [std()], source: src },
  {
    id: "crawl",
    label: t("Crawl Control, Active Traction Control and Hill-start Assist Control", "Crawl Control, идэвхтэй зуурамжийн хяналт, өгсөхөд туслах систем"),
    availability: [std()],
    source: src,
  },
  { id: "dac", label: t("Downhill Assist Control", "Уруудахад туслах систем"), availability: [std()], source: src },
  { id: "tsc", label: t("Trailer Sway Control", "Чиргүүлийн найгалтын хяналт"), availability: [std()], source: src },
  { id: "underguard", label: t("Engine undercover and protector", "Хөдөлгүүрийн доод хаалт, хамгаалалт"), availability: [std()], source: src },
  {
    id: "diff-lock",
    label: t("Electric differential lock", "Дифференциалын цахилгаан түгжээ"),
    availability: [
      { grades: GR, status: "standard", detail: t("front and rear", "урд ба хойд") },
      opt(ZX, t("rear", "хойд")),
      opt(VX_AX_GX, t("rear", "хойд")),
    ],
    source: src,
  },
  {
    id: "rear-lsd",
    label: t("Torsen limited-slip rear differential", "Torsen хязгаарлагдмал гулсалттай хойд дифференциал"),
    availability: [std(ZX)],
    note: t("Not fitted when the optional rear differential lock is chosen.", "Хойд дифференциалын түгжээг сонгосон тохиолдолд суурилуулахгүй."),
    source: src,
  },
  { id: "ekdss", label: t("E-KDSS (electronic stabiliser disconnection)", "E-KDSS (тогтворжуулагчийг электроноор салгах систем)"), availability: [std(GR)], source: src },
  { id: "avs", label: t("AVS (adaptive variable suspension)", "AVS (дасан зохицох хувьсах түдгэлзүүр)"), availability: [std(ZX_GR)], source: src },
  {
    id: "mtm",
    label: t("Multi-Terrain Monitor", "Олон гадаргын камер (Multi-Terrain Monitor)"),
    availability: [opt(t("ZX, GR SPORT, VX, AX", "ZX, GR SPORT, VX, AX"))],
    note: t("Ordered together with Display Audio Plus.", "Display Audio Plus-тай хамт захиалагдана."),
    source: src,
  },
];

const comfort: VehicleFeature[] = [
  { id: "nanoe", label: t("nanoe X and clean-air filter (pollen and odour)", "nanoe X ба агаар цэвэршүүлэх шүүлтүүр (тоос, үнэр)"), availability: [std()], source: src },
  {
    id: "ac-outlet",
    label: t("AC 100 V / 100 W accessory outlet (luggage area)", "AC 100 В / 100 Вт залгуур (ачааны хэсэгт)"),
    availability: [std()],
    note: t("Japanese mains voltage.", "Японы цахилгааны сүлжээний хүчдэл."),
    source: src,
  },
  { id: "dc-sockets", label: t("Two DC 12 V accessory sockets (120 W total)", "Хоёр DC 12 В залгуур (нийт 120 Вт)"), availability: [std()], source: src },
  {
    id: "usb-c",
    label: t("USB Type-C charging ports", "USB Type-C цэнэглэх порт"),
    availability: [
      { grades: ALL, status: "standard", detail: t("one under the instrument panel", "хэмжүүрийн самбарын доор нэг") },
      { grades: t("all except GX", "GX-ээс бусад"), status: "standard", detail: t("two at the back of the centre console", "төв консолын ард хоёр") },
      { grades: t("7-seat grades", "7 суудалтай хувилбар"), status: "standard", detail: t("one in each third-row armrest", "гурав дахь эгнээний гарын түшлэг бүрт нэг") },
    ],
    source: src,
  },
  { id: "hdmi", label: t("HDMI input (front)", "HDMI оролт (урд)"), availability: [std()], source: src },
];

/** Equipment groups. Headings live in the copy (vehicle.groups). */
export const featureGroups = { safety, offroad: offroadFeatures, interior: comfort } as const;
export type FeatureGroupId = keyof typeof featureGroups;

/** The few figures the Performance chapter shows over the 3D scene. */
const headlineIds = ["jp-engine", "jp-power", "jp-torque", "jp-transmission", "jp-drivetrain"];
export const headlineSpecs: readonly VehicleSpec[] = engine.filter((spec) => headlineIds.includes(spec.id));

/** Every source cited anywhere on the site. */
export const allSources: readonly SourceReference[] = [toyotaJapan2025];
