import type { SiteCopy } from "./types";

export const en: SiteCopy = {
  meta: {
    title: "LC300 Cinematic",
    description:
      "A cinematic, scroll-driven presentation of the Toyota Land Cruiser 300, designed as a non-commercial portfolio concept for the Mongolian market.",
    ogLocale: "en_US",
  },
  language: {
    label: "Language",
    names: { en: "English", mn: "Монгол" },
  },
  skipToContent: "Skip to content",
  loading3d: "Loading the 3D view",
  nav: {
    label: "Chapters",
    items: {
      design: "Design",
      light: "Light",
      terrain: "Terrain",
      interior: "Interior",
      performance: "Performance",
      colour: "Colour",
      contact: "Contact",
      specifications: "Specifications",
    },
    open: "Menu",
    close: "Close",
  },
  hero: {
    eyebrow: "Toyota Land Cruiser 300",
    titleLines: ["Land", "Cruiser"],
    lede: "A cinematic study of the Land Cruiser 300, told for the roads, distances and seasons of Mongolia.",
    concept: "Independent, non-commercial design concept",
    scrollCue: "Scroll",
  },
  design: {
    eyebrow: "01 — Design",
    title: "Square to the horizon",
    body: "Look at it the way you look at anything on the steppe: from far away first, as a shape against the sky, then up close, where the surfaces and joins have to hold your attention.",
  },
  light: {
    eyebrow: "02 — Light",
    title: "Seen before it is heard",
    body: "In winter the light goes early; in summer it lingers past ten. This chapter follows the vehicle into low light, where the body is reduced to reflections and outline and the lamps do the talking.",
  },
  terrain: {
    eyebrow: "03 — Terrain",
    title: "Where the tarmac ends, the route begins",
    body: "Much of Mongolia is crossed on tracks rather than roads, and the distance between towns is counted in hours. This chapter is about what lies under the tyres.",
    notes: ["Gravel and washboard", "Sand on the edge of the Gobi", "Snow and frozen ground", "River fords in spring"],
  },
  interior: {
    eyebrow: "04 — Interior",
    title: "A quiet room for long distances",
    body: "When the next town is half a day away, the cabin is where the day is spent. This chapter turns inward: the view out, the materials under your hands, the calm between places.",
  },
  performance: {
    eyebrow: "05 — Performance",
    title: "The figures, with their source",
    body: "Specifications differ by market, and vehicles reach Mongolia from several export markets. Every figure here names the market and the document it comes from.",
    sourceLabel: "Source",
    checkedLabel: "Checked",
    modelNote:
      "The 3D model is titled “VX.R”, a grade name that doesn't appear in the Japanese sheet. The figures above are for the Japan-market grades named under each one. Vehicles sold in Mongolia may differ.",
    fullSpecs: "Full specifications",
    missing: ["Towing capacity", "Payload"],
    missingNote: "Not shown until confirmed from an official Toyota source:",
  },
  colour: {
    eyebrow: "06 — Colour",
    title: "Choose what the light falls on",
    body: "Change the finish and the studio redraws every reflection on the body.",
    finishes: {
      graphite: "Graphite",
      pearl: "Pearl white",
      black: "Black",
      silver: "Silver",
      bronze: "Bronze",
    },
    rotateLabel: "Turn the vehicle",
    rotateHint: "Drag, or use the arrow keys, to turn it.",
    rotateTouchHint: "Drag the vehicle to turn it.",
    rotateLeft: "Turn left",
    rotateRight: "Turn right",
    pickerLabel: "Finish",
    note: "Studio finishes for this study, not official Toyota paint names or codes.",
    loading: "The 3D view is still loading. The finishes can be previewed once it appears.",
    unavailable: "The live 3D view isn't running on this device, so finishes can't be previewed here.",
  },
  contact: {
    eyebrow: "07 — Contact",
    title: "Talk about this project",
    body: "LC300 Cinematic is an independent, non-commercial design study. If you would like to talk about the work behind it, get in touch.",
    cta: "Get in touch",
    backToTop: "Back to top",
    unavailable: "Contact details will be added here.",
  },
  vehicle: {
    eyebrow: "08 — Specifications",
    title: "The Land Cruiser 300, on paper",
    body: "The film shows the vehicle. This section lists what Toyota publishes about it, with the market and the document each figure comes from.",
    intro: [
      "The Land Cruiser 300 is the vehicle this study is about. The film above treats it as an image: a shape against the sky, light on the body, a quiet cabin, a long way from the nearest town. This section is the other half: what Toyota itself publishes about it.",
      "Specifications differ from one market to another: engines, grades, equipment and even dimensions change. So nothing below is a general “LC300” figure. Every block names its market and the edition of the document it was copied from.",
    ],
    verifiedLabel: "Verified specifications",
    verifiedNote:
      "Copied from Toyota's own published documents, as printed. Nothing is estimated, converted between markets or taken from press reports. Where a figure differs by grade, each grade is named.",
    editorialLabel: "Introduction",
    groups: {
      engine: {
        title: "Engine and drivetrain",
        intro: "Engines, transmission, gearing and fuel economy.",
      },
      dimensions: {
        title: "Dimensions and weights",
        intro: "Exterior dimensions, weights, tyres and wheels.",
      },
      interior: {
        title: "Interior and comfort",
        intro: "Seating, cabin space and the equipment listed for the cabin.",
      },
      safety: {
        title: "Safety and driver assistance",
        intro: "Toyota Safety Sense and the other safety equipment, grade by grade.",
      },
      offroad: {
        title: "Off-road technology",
        intro: "Chassis, traction and terrain systems, grade by grade.",
      },
      variants: {
        title: "Model variants and market differences",
        intro: "The grades Toyota lists in Japan, and what changes between markets.",
      },
      sources: {
        title: "Technical specification sources",
        intro: "Every document the figures on this site come from.",
      },
    },
    markets: { japan: "Japan" },
    scope: (market, edition) => `${market} market · ${edition} edition`,
    edition: (edition) => {
      const [year, month] = edition.split("-").map(Number);
      return new Date(Date.UTC(year, month - 1)).toLocaleDateString("en-GB", { month: "long", year: "numeric", timeZone: "UTC" });
    },
    availability: {
      standard: "Standard",
      "factory-option": "Factory option",
      "dealer-option": "Dealer option",
    },
    equipmentNote:
      "Availability as marked in the source's equipment table. Equipment changes between editions and markets, so check Toyota's current documents.",
    gradeTable: {
      caption: "Japan-market grades",
      grade: "Grade",
      engine: "Engine",
      seats: "Seats",
      modelCode: "Model code",
    },
    differences: [
      "Grade names, engines and equipment are set market by market. A figure from one market is not evidence for another.",
      "The 3D model in the film is titled “VX.R”. That grade is not in the Japanese sheet, so the figures here describe the Japan-market grades, not the modelled vehicle.",
      "Vehicles reach Mongolia from several export markets, so a Land Cruiser 300 in Mongolia may match none of the grades listed here.",
    ],
    notSourcedTitle: "Not yet sourced",
    notSourced: [
      "Towing capacity and payload, for any market",
      "Specifications for the Middle East (GCC) and Australian markets",
      "Specifications for vehicles sold in Mongolia",
    ],
    sourceFields: { document: "Document", market: "Market", edition: "Edition", checked: "Checked" },
    pricesNote: "The source also lists prices. They are left out: this is a non-commercial study, not a sales page.",
  },
  footer: {
    concept: "Non-commercial portfolio concept.",
    disclaimer:
      "Independent design concept. Not affiliated with, endorsed by, or sponsored by Toyota Motor Corporation. Land Cruiser is a trademark of Toyota Motor Corporation.",
    modelLabel: "3D model:",
    by: "by",
    basedOn: "based on a Racing Master 3D model; credits: GM25",
    licensedUnder: "licensed under",
    changes: "converted and modified for this site",
    licenseFile: "Model licence and attribution",
  },
  error: {
    title: "Something went wrong",
    body: "This page hit an unexpected error. Try again, or reload the page.",
    retry: "Try again",
  },
  notFound: {
    title: "Page not found",
    body: "There is nothing at this address.",
    home: "Back to the film",
  },
};
