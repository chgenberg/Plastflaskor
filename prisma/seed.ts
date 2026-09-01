import { PrismaClient, OrderStatus, PriceListCode, ProductCategory, Role } from "@prisma/client";
import bcrypt from "bcryptjs";
import { ensureDemoShowcase } from "./demoShowcase";

const prisma = new PrismaClient();

const STATUSES: OrderStatus[] = [
  "SUBMITTED",
  "AQUA_REVIEW",
  "ARTWORK_AQUA_REVIEW",
  "ARTWORK_CUSTOMER_APPROVAL",
  "CONFIRMED",
  "LABEL_PRODUCTION",
  "LABELS_DISPATCHED",
  "LABELS_RECEIVED",
  "PRODUCTION_SCHEDULED",
  "IN_PRODUCTION",
  "READY_TO_SHIP",
  "SHIPPED",
  "DELIVERED",
  "READY_TO_INVOICE",
  "INVOICED",
  "PAID",
];

const PRINT_REQS = [
  { code: "volume", label: "Volym", required: true },
  { code: "ean", label: "EAN", required: true },
  { code: "pant", label: "Pant", required: true },
  { code: "producer", label: "Producent", required: true },
  { code: "ingredients", label: "Ingredienser / produktinformation", required: true },
  { code: "product_name", label: "Produktnamn", required: true },
  { code: "mandatory", label: "Obligatorisk information", required: true },
];

const PRICE_CYCLE = ["STANDARD", "SILVER", "GOLD", "SPECIAL"] as const;

const CUSTOMERS = [
  "Fikastunden Café AB",
  "Sprintlöparna IF",
  "Sjöbris Rederi AB",
  "Granitkontoret AB",
  "Blåbär Events AB",
  "Midnattssol Konferens AB",
  "Kustlinjen Hotell AB",
  "Älvdalens Outdoor AB",
  "Stålhuset Verkstad AB",
  "Lingon & Lag AB",
  "Havtorn Media AB",
  "Kottebyrån AB",
  "Fjällbrisen AB",
  "Sandkorn Design AB",
  "Nyckelpiga Events AB",
  "Tegelhuset Kontor AB",
  "Måsen & Molnet AB",
  "Rönnbär Retail AB",
  "Kajakklubben Strömmen",
  "Solvända Café HB",
  "Brygghuset Norr AB",
  "Lilla Torget Handel AB",
  "Åkerbär Outdoor AB",
  "Frostknopp IF",
  "Skärgårdsreklam AB",
  "Pärlbandet Event AB",
  "Vitsippan Konferens AB",
  "Krom & Kant AB",
  "Nässelkusten AB",
  "Blåklint Byrå AB",
];

type ProductSeed = {
  slug: string;
  skuBase: string;
  name: string;
  category: ProductCategory;
  categorySlug: string;
  oneLiner: string;
  body: string;
  specText: string;
  moq: number;
  leadTimeText: string;
  country: string;
  environmentText: string;
  sortOrder: number;
  variants: { sku: string; name: string; volumeMl?: number; options: Record<string, string> }[];
};

const PRODUCTS: ProductSeed[] = [
  {
    slug: "naturligt-mineralvatten-33cl",
    skuBase: "vatten-33cl",
    name: "Naturligt Mineralvatten 33cl – egen etikett",
    category: "WATER",
    categorySlug: "profilvatten",
    oneLiner: "Vårt populära profilvatten med egen etikett tappas ur Tollagårdens friska källa!",
    body: `Vår lillasyster och storsäljare, 33cl, är en populär flaska vid bl a mässor, företagsevent, på konferenser och på caféer. Välj mellan kolsyrat eller stilla vatten. Och om du spanar in vår storebror, 50cl, så finns han här.

Vid Siljans strand i Dalarna ligger Tollagårdens källa och där porlar ett härligt mineralvatten av hög kvalitet som vi är mycket stolta över att kunna leverera. Mineralvattnet som är mycket neutralt i smaken har en fin balans av mineraler som därför gör gott för hela kroppen. Ett underbart vatten som passar vid alla tillfällen, på mässor och vid event, till kunder och personal.

Som ett resultat av att vattnet är klassat och godkänt som naturligt mineralvatten av Livsmedelsverket får mineralvattnet endast behandlas eller beredas i mycket begränsad omfattning jämfört med dricksvatten och håller därför mycket hög kvalitet. Endast ett 10-tal källor i Sverige är godkända som naturliga mineralvatten.

Etiketten stärker ert varumärke men förmedlar även ert budskap! Den tillverkas av ett miljöriktigt material som håller hög kvalitet. Alla etiketter är försedda med pantsymbol och streckkod så att PET-flaskan kan återvinnas hos Returpack och bli till en ny flaska när den är förbrukad. Återanvänd gärna flaskan flera gånger innan du pantar den och förläng flaskans livslängd genom att välja till sportkork (endast stilla vatten). Som ett resultat av detta ökar varumärkets exponering ytterligare och påverkan på naturen minskar.

I priset ingår flaskan med naturligt mineralvatten, skruvkork, pappersetikett med fyrfärgstryck samt adminavgift och som tillval finns transparent etikett samt sportkork (endast stilla vatten).`,
    specText: "MOQ: 270st\nHållbarhet: Stilla vatten 18mån / Kolsyrat vatten 9mån\nSkruvkork: 4 färger, svart, vit, röd och blå\nSportkork: 3 färger, svart, vit och blå\nSmaker: Stilla naturell och Kolsyrat naturell",
    moq: 270,
    leadTimeText: "Normalt tre veckor, aldrig mer än fem veckor.",
    country: "Sverige",
    environmentText: "Pantsymbol och streckkod. PET-flaskan kan återvinnas hos Returpack.",
    sortOrder: 1,
    variants: [
      { sku: "vatten-33cl-stilla", name: "33 cl stilla", volumeMl: 330, options: { waterType: "stilla", cap: "skruvkork" } },
      { sku: "vatten-33cl-kolsyra", name: "33 cl kolsyrat", volumeMl: 330, options: { waterType: "kolsyrat", cap: "skruvkork" } },
    ],
  },
  {
    slug: "naturligt-mineralvatten-50cl",
    skuBase: "vatten-50cl",
    name: "Naturligt Mineralvatten 50cl – egen etikett",
    category: "WATER",
    categorySlug: "profilvatten",
    oneLiner: "Svenskt naturligt mineralvatten från Tollagårdens friska källa!",
    body: `Vår storebror, 50cl, är en populär flaska vid bl a sportevenemang, på träningsanläggningar och på golfbanor runt om i Sverige. Välj mellan kolsyrat eller stilla vatten.

Vid Siljans strand i Dalarna ligger Tollagårdens källa och där porlar ett härligt mineralvatten av hög kvalitet som vi är mycket stolta över att kunna leverera. Mineralvattnet som är mycket neutralt i smaken har en fin balans av mineraler som därför gör gott för hela kroppen. Ett underbart vatten som passar vid alla tillfällen, på mässor och vid event, till kunder och personal.

Som ett resultat av att vattnet är klassat och godkänt som naturligt mineralvatten av Livsmedelsverket får mineralvattnet endast behandlas eller beredas i mycket begränsad omfattning jämfört med dricksvatten och håller därför mycket hög kvalitet. Endast ett 10-tal källor i Sverige är godkända som naturliga mineralvatten.

Etiketten stärker ert varumärke men förmedlar även ert budskap! Den tillverkas av ett miljöriktigt material som håller hög kvalitet. Alla etiketter är försedda med pantsymbol och streckkod så att PET-flaskan kan återvinnas hos Returpack och bli till en ny flaska när den är förbrukad. Återanvänd gärna flaskan flera gånger innan du pantar den och förläng flaskans livslängd genom att välja till sportkork (endast stilla vatten). Som ett resultat av detta ökar varumärkets exponering ytterligare och påverkan på naturen minskar.

I priset ingår flaskan med naturligt mineralvatten, skruvkork, pappersetikett med fyrfärgstryck samt adminavgift och som tillval finns transparent etikett samt sportkork (endast stilla vatten).`,
    specText: "MOQ: 270st\nHållbarhet: Stilla vatten 18mån / Kolsyrat vatten 9mån\nSkruvkork: 4 färger, svart, vit, röd och blå\nSportkork: 3 färger, svart, vit och blå\nSmaker: Stilla naturell och Kolsyrat naturell",
    moq: 270,
    leadTimeText: "Normalt tre veckor, aldrig mer än fem veckor.",
    country: "Sverige",
    environmentText: "Pantsymbol och streckkod. PET-flaskan kan återvinnas hos Returpack.",
    sortOrder: 2,
    variants: [
      { sku: "vatten-50cl-stilla", name: "50 cl stilla", volumeMl: 500, options: { waterType: "stilla" } },
      { sku: "vatten-50cl-kolsyra", name: "50 cl kolsyrat", volumeMl: 500, options: { waterType: "kolsyrat" } },
    ],
  },
  {
    slug: "vatten-fran-svensk-kalla-33cl",
    skuBase: "stenkulla-33cl",
    name: "Vatten från Svensk Källa 33cl – egen etikett",
    category: "WATER",
    categorySlug: "profilvatten",
    oneLiner: "Kristallklart vatten från svensk källa!",
    body: `En av våra produktioner hittar du vid Stenkulla Brunn. Där tappas ett kristallklart vatten som är välsmakande och lyxigt. Vattnet serveras bl a på en av Sveriges största middagar med kungligheter och celebra gäster – Nobelmiddagen. Det är ett välsmakande vatten med fin mineralsammansättning och låg natriumhalt. Vattnets fina smakbalans har gjort detta vatten till många krögare och sommeliers självklara favorit. Här finns även möjlighet till vatten smaksatt med citron/lime samt 11st korkfärger att välja mellan.

aqua visibilitys populära profilvatten med egen etikett förstärker ert varumärke och budskap. Du kan välja mellan pappers- eller transparent etikett med fyrfärgstryck. Etiketterna håller mycket hög kvalitet och kombinationen av förstklassigt vatten tillsammans med den snygga etiketten ger ett profilvatten utöver det vanliga. Eftersom alla etiketter är försedda med innehållsförteckning, pantsymbol och streckkod så kan PET-flaskan återvinnas hos Returpack och bli till en ny flaska när den är förbrukad. Återanvänd gärna flaskan flera gånger innan du pantar den och för att förlänga flaskans livslängd kan du välja till sportkork (endast stilla vatten). Som ett resultat av detta ökar varumärkets exponering ytterligare och påverkan på naturen minskar.

I priset ingår flaskan med svenskt källvatten, skruvkork, pappersetikett med fyrfärgstryck samt adminavgift och som tillval finns transparent etikett och sportkork (endast stilla vatten).`,
    specText: "MOQ: 540st\nHållbarhet: Stilla vatten 18mån, Kolsyrat vatten 12mån\nSmaker: Stilla naturell, Kolsyrat naturell, kolsyrat citron/lime",
    moq: 540,
    leadTimeText: "Normalt tre veckor, aldrig mer än fem veckor.",
    country: "Sverige",
    environmentText: "Innehållsförteckning, pantsymbol och streckkod. Returpack.",
    sortOrder: 3,
    variants: [
      { sku: "stenkulla-33-stilla", name: "Stenkulla 33 cl stilla", volumeMl: 330, options: { waterType: "stilla" } },
      { sku: "stenkulla-33-kolsyra", name: "Stenkulla 33 cl kolsyrat", volumeMl: 330, options: { waterType: "kolsyrat" } },
      { sku: "stenkulla-33-lime", name: "Stenkulla 33 cl citron/lime", volumeMl: 330, options: { waterType: "kolsyrat citron/lime" } },
    ],
  },
  {
    slug: "lask-med-egen-etikett",
    skuBase: "lask50cl",
    name: "Läsk med egen etikett",
    category: "SOFT_DRINK",
    categorySlug: "lask-must",
    oneLiner: "Läsk PET 50cl från anrika Mora Bryggeri.",
    body: `På anrika Mora Bryggeri fylls flaskorna med traditionella läsksorter. Ett självklart val vid invigningar och event där företaget vill synas med det ”lilla” extra och öka feststämningen.

Vår standardetikett håller mycket hög kvalitet och tillverkas av miljöriktigt material. Etiketten som kommunicerar ert budskap designar din själva eller så hjälper vi er. Alla etiketter är försedda med pantsymbol och streckkod.`,
    specText: "Minsta Antal: 540st\nHållbarhet: Minst 9 månader\nSmaker: Hallon, Cola, Apelsin",
    moq: 540,
    leadTimeText: "Normalt tre veckor, aldrig mer än fem veckor.",
    country: "Sverige",
    environmentText: "Pantsymbol och streckkod.",
    sortOrder: 10,
    variants: [
      { sku: "lask50-hallon", name: "Läsk 50 cl Hallon", volumeMl: 500, options: { flavor: "Hallon" } },
      { sku: "lask50-cola", name: "Läsk 50 cl Cola", volumeMl: 500, options: { flavor: "Cola" } },
      { sku: "lask50-apelsin", name: "Läsk 50 cl Apelsin", volumeMl: 500, options: { flavor: "Apelsin" } },
    ],
  },
  {
    slug: "julmust-med-egen-etikett",
    skuBase: "julmust50cl",
    name: "Julmust med egen etikett",
    category: "SOFT_DRINK",
    categorySlug: "lask-must",
    oneLiner: "Julmust PET 50cl från Mora Bryggeri.",
    body: `Vår prisbelönta must kommer från Mora Bryggeri där den bryggs på traditionellt vis efter ett gammalt, hemligt recept, så hemligt att det förvaras inlåst i kassaskåp.

Vår standardetikett håller mycket hög kvalitet och tillverkas av miljöriktigt material. Etiketten som kommunicerar ert budskap designar ni själva eller så hjälper vi er. Alla etiketter är försedda med pantsymbol och streckkod.`,
    specText: "Minsta Antal: 180st\nHållbarhet: Minst 9 månader",
    moq: 180,
    leadTimeText: "Normalt tre veckor, aldrig mer än fem veckor.",
    country: "Sverige",
    environmentText: "Pantsymbol och streckkod.",
    sortOrder: 11,
    variants: [{ sku: "julmust50", name: "Julmust 50 cl", volumeMl: 500, options: { flavor: "Julmust" } }],
  },
  {
    slug: "energidryck-med-egen-etikett",
    skuBase: "energi25cl",
    name: "Energidryck med egen etikett",
    category: "ENERGY_DRINK",
    categorySlug: "energidryck",
    oneLiner: "Visst är det häftigt att kunna servera sin egna energidryck!",
    body: `Visst är det häftigt att kunna servera sin egna energidryck! Det finns flera alternativ på marknaden, men få som smakar så bra som denna! Be oss gärna om ett smakprov så förstår du vad vi menar! Aluminiumburken rymmer 25cl. Alla etiketter är försedda med pantsymbol och streckkod.`,
    specText: "Minsta Antal: 240st\nHållbarhet: 12-24 månader",
    moq: 240,
    leadTimeText: "Normalt tre veckor, aldrig mer än fem veckor.",
    country: "Europa",
    environmentText: "Aluminiumburk med pant och streckkod.",
    sortOrder: 20,
    variants: [{ sku: "energi25", name: "Energidryck 25 cl", volumeMl: 250, options: { pack: "burk" } }],
  },
  {
    slug: "pappersmugg-eco-ev-12cl",
    skuBase: "eco-ev-12",
    name: "100% Komposterbar EV 12cl/4oz",
    category: "PAPER_CUP",
    categorySlug: "pappersmuggar",
    oneLiner: "Komposterbar! 100% biologiskt nedbrytbar pappersmugg med matt yta som ger en miljöriktig känsla",
    body: `Pappersmuggen passar både varm och kall dryck och är en populär storlek att använda till espresso och glögg. Varför inte använda den vid provsmakning av kaffe, juice och smoothies!

Våra 100% biologiskt nedbrytbara pappersmugg är komposterbar i industrikompost och återvinns tillsammans med matavfallet. Den är tillverkad av FSC-märkt kartong av hög kvalitet som är speciellt framtagen för pappersmuggar. Muggen är godkänd för livsmedel och tillverkas med perfektion.

OK Compost-märkningen från certifieringsorganet TUV Austria anger att muggen är lämplig för industriell kompostering och uppfyller de strikta krav som anges i den europeiska standarden EN 13432.

OBS! Matt yta innebär att färgåtergivningen inte är lika kraftig/generös som vid användning av bestruket papper (glossy)`,
    specText: "Minsta Antal: 1000st\nVolym: 12cl/4oz",
    moq: 1000,
    leadTimeText: "Normalt tre veckor.",
    country: "Europa",
    environmentText: "OK Compost EN 13432. FSC-märkt kartong.",
    sortOrder: 30,
    variants: [{ sku: "eco-ev-12", name: "ECO EV 12 cl", volumeMl: 120, options: { wall: "enkel", eco: "ja" } }],
  },
  {
    slug: "pappersmugg-ev-23cl",
    skuBase: "enkelvagg-8oz",
    name: "Pappersmugg EV 23 cl/8oz",
    category: "PAPER_CUP",
    categorySlug: "pappersmuggar",
    oneLiner: "Pappersmugg enkelvägg med matt yta",
    body: `Den mest populära storleken! Pappersmuggen passar framförallt varm dryck men kan självklart användas vid servering av kalla drycker. Populär till kaffe, te, latte, mjölk, läsk och vatten.

Muggen tillverkas av FSC-märkt kartong av hög kvalitet, speciellt framtagen för pappersmuggar. Muggen är godkänd för livsmedel och tillverkas med perfektion.

OBS! Matt yta innebär att färgåtergivningen inte är lika kraftig/generös som vid användning av bestruket papper (glossy).

Lock finns i vit eller svart, kostnad tillkommer.`,
    specText: "Minsta Antal: 500st\nVolym: 23cl/8oz",
    moq: 500,
    leadTimeText: "Normalt tre veckor.",
    country: "Europa",
    environmentText: "FSC-märkt kartong.",
    sortOrder: 31,
    variants: [{ sku: "ev-23", name: "EV 23 cl", volumeMl: 230, options: { wall: "enkel" } }],
  },
  {
    slug: "pappersmugg-eco-ev-23cl",
    skuBase: "eco-ev-23",
    name: "100% Komposterbar ECO EV 23cl/8oz",
    category: "PAPER_CUP",
    categorySlug: "pappersmuggar",
    oneLiner: "Komposterbar! 100% biologiskt nedbrytbar pappersmugg med matt eller glossy ytfinish",
    body: `Den mest populära storleken! Pappersmuggen passar framförallt varm dryck men kan självklart användas vid servering av kalla drycker. Populär till kaffe, te, latte, mjölk, läsk och vatten.

Våra 100% biologiskt nedbrytbara pappersmugg är komposterbar i industrikompost och återvinns tillsammans med matavfallet. Den är tillverkad av FSC-märkt kartong av hög kvalitet, speciellt framtagen för pappersmuggar. Muggen är godkänd för livsmedel och tillverkas med perfektion.

OK Compost-märkningen från certifieringsorganet TUV Austria anger att muggen är lämplig för industriell kompostering och uppfyller de strikta krav som anges i den europeiska standarden EN 13432.

OBS! Matt yta innebär att färgåtergivningen inte är lika kraftig/generös som vid användning av bestruket papper (glossy)`,
    specText: "Minsta Antal: 500st\nVolym: 23 cl",
    moq: 500,
    leadTimeText: "Normalt tre veckor.",
    country: "Europa",
    environmentText: "OK Compost EN 13432.",
    sortOrder: 32,
    variants: [{ sku: "eco-ev-23", name: "ECO EV 23 cl", volumeMl: 230, options: { wall: "enkel", eco: "ja" } }],
  },
  {
    slug: "pappersmugg-dv-23cl",
    skuBase: "dubbelvagg-8oz",
    name: "Pappersmugg DV 23 cl/8oz",
    category: "PAPER_CUP",
    categorySlug: "pappersmuggar",
    oneLiner: "Pappersmugg dubbelvägg med matt eller glossy yta",
    body: `Den mest populära storleken! Pappersmuggen passar framförallt varm dryck men kan självklart användas vid servering av kalla drycker. Populär till kaffe, te, latte, mjölk, läsk och vatten.

Muggen tillverkas av FSC-märkt kartong av hög kvalitet, speciellt framtagen för pappersmuggar. Muggen är godkänd för livsmedel och tillverkas med perfektion.

OBS! Matt yta innebär att färgåtergivningen inte är lika kraftig/generös som vid användning av bestruket papper (glossy).

Lock finns i vit eller svart.`,
    specText: "Minsta Antal: 500st\nVolym: 23cl",
    moq: 500,
    leadTimeText: "Normalt tre veckor.",
    country: "Europa",
    environmentText: "FSC-märkt kartong.",
    sortOrder: 33,
    variants: [{ sku: "dv-23", name: "DV 23 cl", volumeMl: 230, options: { wall: "dubbel" } }],
  },
  {
    slug: "pappersmugg-eco-dv-23cl",
    skuBase: "eco-dv-23",
    name: "100% Komposterbar ECO DV 23cl/8oz",
    category: "PAPER_CUP",
    categorySlug: "pappersmuggar",
    oneLiner: "Komposterbar! 100% biologiskt nedbrytbar pappersmugg med matt yta",
    body: `Den mest populära storleken! Pappersmuggen passar både varm och kall dryck. Populär till kaffe, te, latte, mjölk, läsk och vatten.

Våra 100% biologiskt nedbrytbara pappersmugg är komposterbar i industrikompost och återvinns tillsammans med matavfallet. Muggen tillverkas av FSC-märkt kartong av hög kvalitet, speciellt framtagen för pappersmuggar. Muggen är godkänd för livsmedel och tillverkas med perfektion.

OK Compost-märkningen från certifieringsorganet TUV Austria anger att muggen är lämplig för industriell kompostering och uppfyller de strikta krav som anges i den europeiska standarden EN 13432.`,
    specText: "Minsta Antal: 500st\nVolym: 23 cl",
    moq: 500,
    leadTimeText: "Normalt tre veckor.",
    country: "Europa",
    environmentText: "OK Compost EN 13432.",
    sortOrder: 34,
    variants: [{ sku: "eco-dv-23", name: "ECO DV 23 cl", volumeMl: 230, options: { wall: "dubbel", eco: "ja" } }],
  },
  {
    slug: "pappersmugg-dv-35cl",
    skuBase: "dubbelvagg-12oz",
    name: "Pappersmugg DV 35cl/12oz",
    category: "PAPER_CUP",
    categorySlug: "pappersmuggar",
    oneLiner: "Pappersmugg dubbelvägg med matt eller glossy yta",
    body: `Pappersmuggen passar både varm och kall dryck. Populär till kaffe, latte, mjölk, läsk och vatten. En härlig mugg att servera milkshake eller smoothie i!

Muggen tillverkas av FSC-märkt kartong av hög kvalitet, speciellt framtagen för pappersmuggar. Muggen är godkänd för livsmedel och tillverkas med perfektion.

OBS! Matt yta innebär att färgåtergivningen inte är lika kraftig/generös som vid användning av bestruket papper (glossy)

Lock finns i vit eller svart.`,
    specText: "Minsta Antal: 500st\nVolym: 35cl",
    moq: 500,
    leadTimeText: "Normalt tre veckor.",
    country: "Europa",
    environmentText: "FSC-märkt kartong.",
    sortOrder: 35,
    variants: [{ sku: "dv-35", name: "DV 35 cl", volumeMl: 350, options: { wall: "dubbel" } }],
  },
  {
    slug: "pappersmugg-eco-dv-35cl",
    skuBase: "eco-dv-35",
    name: "100% Komposterbar ECO DV 35cl/12oz",
    category: "PAPER_CUP",
    categorySlug: "pappersmuggar",
    oneLiner: "Komposterbar! 100% biologiskt nedbrytbar pappersmugg med matt eller glossy ytfinish",
    body: `Pappersmuggen passar framförallt varm dryck men kan självklart användas vid servering av kalla drycker. Populär till kaffe, te, latte, mjölk, läsk och vatten. Perfekt för en rykande varm latte eller en het varm choklad med vispgrädde!

Våra 100% biologiskt nedbrytbara pappersmugg är komposterbar i industrikompost och återvinns tillsammans med matavfallet. Den är tillverkad av FSC-märkt kartong av hög kvalitet, speciellt framtagen för pappersmuggar. Muggen är godkänd för livsmedel och tillverkas med perfektion.

OK Compost-märkningen från certifieringsorganet TUV Austria anger att muggen är lämplig för industriell kompostering och uppfyller de strikta krav som anges i den europeiska standarden EN 13432.`,
    specText: "Minsta Antal: 500st\nVolym: 35cl/12oz",
    moq: 500,
    leadTimeText: "Normalt tre veckor.",
    country: "Europa",
    environmentText: "OK Compost EN 13432.",
    sortOrder: 36,
    variants: [{ sku: "eco-dv-35", name: "ECO DV 35 cl", volumeMl: 350, options: { wall: "dubbel", eco: "ja" } }],
  },
  {
    slug: "aquarefill",
    skuBase: "aquarefill-bla",
    name: "Aquarefill – Sportflaskan där fyrfärgstryck alltid ingår",
    category: "SPORTS_BOTTLE",
    categorySlug: "sportflaskor",
    oneLiner: "Aquarefill - en unik sportflaska!",
    body: `Flaskan tillverkas i Sverige efter vår egna, unika form och istället för att trycka direkt på flaskan så förädlar vi den med en slitstark etikett i fyrfärg. Designa etiketten med bilder eller detaljerade föreningslogotyper. Det spelar ingen roll hur många färger du använder, priset är detsamma. Flaskan är livsmedelsgodkänd.

Flaskan finns i vit, svart och blå. Korkfärger finns i vit, svart, blå, röd och silver.

aquarefill är i grunden en traditionell sportflaska som rymmer 75 cl. Det som skiljer aquarefill mot liknande flaskor är att den har en egen form, samt hur vi jobbar med förädlingen. Istället för att trycka olika färger direkt på flaskan, förädlar vi den med en slitstark etikett i fyrfärg. Den är av typen wrap around, vilket ger större yta och fler möjligheter för kundens exponering. Fyrfärgstryck ingår alltid, och håller i diskmaskin.`,
    specText: "MOQ: Från 100st\nKorkfärg: Vit, svart, blå, röd, silver\nTillverkningsland: Sverige\nEtikettmått: 52×232mm\nTryck: Fyrfärgstryck\nVolym: 75 cl\nLeveranstid: 3-4 veckor",
    moq: 100,
    leadTimeText: "3-4 veckor",
    country: "Sverige",
    environmentText: "Återvinningsbar plast, lång livstid, maskindisk.",
    sortOrder: 40,
    variants: [
      { sku: "aq-blå", name: "Aquarefill blå 75 cl", volumeMl: 750, options: { color: "blå" } },
      { sku: "aq-vit", name: "Aquarefill vit 75 cl", volumeMl: 750, options: { color: "vit" } },
      { sku: "aq-svart", name: "Aquarefill svart 75 cl", volumeMl: 750, options: { color: "svart" } },
    ],
  },
  {
    slug: "shiva-bio-tacx-500ml",
    skuBase: "shiva-bio-500",
    name: "Shiva Bio Tacx 500ml",
    category: "SPORTS_BOTTLE",
    categorySlug: "sportflaskor",
    oneLiner: "Komposterbar sportflaska!",
    body: `En mycket populär vattenflaska bland alla typer av idrott- och motionsutövare. Från proffsutövare till motionärer på amatörnivå. En riktig klassiker bland sportflaskor och känd bland annat från Tour de France. Med sin stora öppning är flaskan lätt att fylla på och att rengöra. Lockets slående triangulära form bidrar till ett säkert grepp och den låsbara push/pull-korken garanterar en läckagefri flaska.

Biologiskt nedbrytbar plast är en nödvändighet för vår hotade miljö! Flaskan är tillverkad av biologiskt nedbrytbar polyeten, fri från både BPA och ftalater. Det tar 1-5 år för flaskan att brytas ner i industriell kompost. Självklart kan flaskan läggas i återvinningen för plast. Flaskan är godkänd för kontakt med livsmedel och tål maskindisk upp till 40 grader.

Det finns 6 färger på flaska och 6 färger på locket. Välj en färg på flaskan och en färg på locket. Mixa och matcha!

Vid tryck på färgad flaska är det viktigt att trycka ett vitt underlager. För att försäkra er om att antalet tryckfärger stämmer överens med era beräkningar så ber vi er att skicka in originalet till oss för att fastställa antalet färger.`,
    specText: "MOQ vid otrycka flaskor: 50st\nMOQ vid 1-färg och 2-färgstryck: 300st\nMOQ vid 3-färg, 4-färg, 5-färg och 6-färgstryck: 500st\nVolym: 500ml\nHöjd: 190mm\nDiameter: 74mm\nVikt: 80g\nTryckyta: 235,5x100mm\nLeveranstid: 15-20 dagar från godkänd order",
    moq: 50,
    leadTimeText: "15-20 dagar från godkänd order",
    country: "Europa",
    environmentText: "Biologiskt nedbrytbar polyeten, BPA- och ftalatfri.",
    sortOrder: 41,
    variants: [{ sku: "shiva-bio-500", name: "Shiva Bio 500 ml", volumeMl: 500, options: { series: "bio" } }],
  },
  {
    slug: "shiva-bio-tacx-750ml",
    skuBase: "shiva-bio-750",
    name: "Shiva Bio Tacx 750ml",
    category: "SPORTS_BOTTLE",
    categorySlug: "sportflaskor",
    oneLiner: "Komposterbar sportflaska!",
    body: `En mycket populär vattenflaska bland alla typer av idrott- och motionsutövare. Från proffsutövare till motionärer på amatörnivå. En riktig klassiker bland sportflaskor och känd bland annat från Tour de France.

Biologiskt nedbrytbar plast är en nödvändighet för vår hotade miljö! Flaskan är tillverkad av biologiskt nedbrytbar polyeten, fri från både BPA och ftalater.`,
    specText: "MOQ otryckt 50st / 1-2 färg 300st / 3-6 färg 500st\nVolym: 750ml\nHöjd: 250mm\nVikt: 100g\nLeveranstid: 15-20 dagar",
    moq: 50,
    leadTimeText: "15-20 dagar från godkänd order",
    country: "Europa",
    environmentText: "Biologiskt nedbrytbar polyeten.",
    sortOrder: 42,
    variants: [{ sku: "shiva-bio-750", name: "Shiva Bio 750 ml", volumeMl: 750, options: { series: "bio" } }],
  },
  {
    slug: "shiva-green-tacx-500ml",
    skuBase: "shiva-green-500",
    name: "Shiva Green Tacx 500ml",
    category: "SPORTS_BOTTLE",
    categorySlug: "sportflaskor",
    oneLiner: "Klassiska Sportflaskan Shiva tillverkad av Sockerrör!",
    body: `En riktig klassiker bland sportflaskor. Känd bland annat från Tour de France. Flaskan är tillverkad av sockerrör som är en förnybar råvara och minskar utsläppen av växthusgaser. Grunden för grön plast är etanol som utvinns ur sockerrör. Tack vare fotosyntesen i sockerröret under dess tillväxtprocess förbrukas koldioxid. Om du väljer Shiva Green bidrar du till en bättre miljö!`,
    specText: "MOQ otryckt 50st / 1-2 färg 300st / 3-6 färg 500st\nVolym: 500ml\nLeveranstid: 15-20 dagar",
    moq: 50,
    leadTimeText: "15-20 dagar från godkänd order",
    country: "Europa",
    environmentText: "Sockerrörsplast, BPA-fri.",
    sortOrder: 43,
    variants: [{ sku: "shiva-green-500", name: "Shiva Green 500 ml", volumeMl: 500, options: { series: "green" } }],
  },
  {
    slug: "shiva-green-tacx-750ml",
    skuBase: "shiva-green-750",
    name: "Shiva Green Tacx 750ml",
    category: "SPORTS_BOTTLE",
    categorySlug: "sportflaskor",
    oneLiner: "Klassiska Sportflaskan Shiva tillverkad av Sockerrör!",
    body: `En riktig klassiker bland sportflaskor. Känd bland annat från Tour de France. Flaskan är tillverkad av sockerrör som är en förnybar råvara och minskar utsläppen av växthusgaser. Om du väljer Shiva Green bidrar du till en bättre miljö!`,
    specText: "MOQ otryckt 50st / 1-2 färg 300st / 3-6 färg 500st\nVolym: 750ml\nLeveranstid: 15-20 dagar",
    moq: 50,
    leadTimeText: "15-20 dagar från godkänd order",
    country: "Europa",
    environmentText: "Sockerrörsplast, BPA-fri.",
    sortOrder: 44,
    variants: [{ sku: "shiva-green-750", name: "Shiva Green 750 ml", volumeMl: 750, options: { series: "green" } }],
  },
  {
    slug: "profilerbar-kyl",
    skuBase: "kyl-01",
    name: "Profilerbar kyl med egen design",
    category: "COOLER",
    categorySlug: "kyl",
    oneLiner: "En profilerbar kyl med avtagbart energibesparande lock.",
    body: `Vill du ha möjlighet att servera din dryck kall, och dessutom ur en kyl som matchar flaskans design? Då har du här en perfekt lösning. En profilerbar kyl med avtagbart energibesparande lock och som är mycket smidig tack vare sina mått.

Du väljer själv hur du vill designa utseendet. En dekor i fyrfärgstryck går att applicera runt om.`,
    specText: "Tillval: fyrfärgsdekor runt om.",
    moq: 1,
    leadTimeText: "Kontakta oss.",
    country: "Europa",
    environmentText: "Energibesparande lock.",
    sortOrder: 50,
    variants: [{ sku: "kyl-01", name: "Profilerbar kyl", options: { type: "impulskyl" } }],
  },
];

async function main() {
  await prisma.$executeRawUnsafe("PRAGMA foreign_keys = OFF");
  const tables = [
    "OrchestratorCard",
    "OrchestratorRun",
    "Notification",
    "StatusEvent",
    "Document",
    "Invoice",
    "Shipment",
    "ArtworkApproval",
    "ArtworkVersion",
    "ArtworkFile",
    "Design",
    "Label",
    "RepeatOpportunity",
    "PrintRequirement",
    "ProductionJob",
    "OrderItem",
    "Order",
    "PriceListItem",
    "User",
    "Customer",
    "Address",
    "Reseller",
    "Factory",
    "Company",
    "ProductVariant",
    "Product",
    "PriceList",
    "PageCopy",
  ];
  for (const t of tables) {
    try {
      await prisma.$executeRawUnsafe(`DELETE FROM "${t}"`);
    } catch {
      /* empty first run */
    }
  }
  await prisma.$executeRawUnsafe("PRAGMA foreign_keys = ON");

  const passwordHash = await bcrypt.hash("AquaDemo26!", 10);

  const lists = await Promise.all(
    (
      [
        ["STANDARD", "Standard"],
        ["SILVER", "Silver"],
        ["GOLD", "Gold"],
        ["SPECIAL", "Special Agreement"],
      ] as const
    ).map(([code, name]) => prisma.priceList.create({ data: { code, name } })),
  );
  const listByCode = Object.fromEntries(lists.map((l) => [l.code, l])) as Record<PriceListCode, (typeof lists)[0]>;

  const createdProducts = [];
  for (const p of PRODUCTS) {
    const product = await prisma.product.create({
      data: {
        slug: p.slug,
        skuBase: p.skuBase,
        name: p.name,
        category: p.category,
        categorySlug: p.categorySlug,
        oneLiner: p.oneLiner,
        body: p.body,
        specText: p.specText,
        moq: p.moq,
        leadTimeText: p.leadTimeText,
        country: p.country,
        environmentText: p.environmentText,
        sortOrder: p.sortOrder,
        isPublic: [
          "naturligt-mineralvatten-33cl",
          "naturligt-mineralvatten-50cl",
          "vatten-fran-svensk-kalla-33cl",
          "energidryck-med-egen-etikett",
          "lask-med-egen-etikett",
          "pappersmugg-eco-ev-12cl",
          "pappersmugg-ev-23cl",
          "pappersmugg-eco-ev-23cl",
          "pappersmugg-dv-23cl",
          "pappersmugg-eco-dv-23cl",
          "pappersmugg-dv-35cl",
          "pappersmugg-eco-dv-35cl",
          "aquarefill",
          "shiva-bio-tacx-500ml",
          "shiva-bio-tacx-750ml",
          "profilerbar-kyl",
        ].includes(p.slug),
        variants: {
          create: p.variants.map((v) => ({
            sku: v.sku,
            name: v.name,
            volumeMl: v.volumeMl,
            optionsJson: JSON.stringify(v.options),
          })),
        },
      },
      include: { variants: true },
    });
    createdProducts.push(product);
    if (p.category === "WATER" || p.category === "PAPER_CUP") {
      await prisma.printRequirement.createMany({
        data: PRINT_REQS.map((r, i) => ({
          productId: product.id,
          code: r.code,
          label: r.label,
          required: r.required,
          sortOrder: i,
        })),
      });
    }
  }

  const basePrice: Record<string, number> = {
    WATER: 6.4,
    SOFT_DRINK: 7.2,
    ENERGY_DRINK: 9.5,
    PAPER_CUP: 3.1,
    SPORTS_BOTTLE: 18,
    COOLER: 4200,
  };
  const multipliers: Record<PriceListCode, number> = {
    STANDARD: 1,
    SILVER: 0.92,
    GOLD: 0.85,
    SPECIAL: 0.78,
  };
  const tiers = [270, 540, 1080, 2500, 5000];
  for (const product of createdProducts) {
    for (const variant of product.variants) {
      for (const list of lists) {
        const unit = (basePrice[product.category] ?? 8) * multipliers[list.code];
        for (const minQty of product.category === "COOLER" ? [1] : product.moq <= 100 ? [product.moq, 300, 500] : tiers.filter((t) => t >= product.moq || t === tiers[0])) {
          const qtyFactor = minQty >= 2500 ? 0.88 : minQty >= 1080 ? 0.93 : 1;
          await prisma.priceListItem.create({
            data: {
              priceListId: list.id,
              variantId: variant.id,
              minQty: Math.max(product.moq, minQty === 270 && product.moq > 270 ? product.moq : minQty),
              unitPriceExVat: Math.round(unit * qtyFactor * 100) / 100,
            },
          }).catch(() => undefined);
        }
      }
    }
  }

  const gbgCompany = await prisma.company.create({
    data: { orgNr: "559801-1001", name: "AquaFill Göteborg AB", email: "gbg@aquafill.se" },
  });
  const orbCompany = await prisma.company.create({
    data: { orgNr: "559801-1002", name: "AquaFill Örebro AB", email: "orebro@aquafill.se" },
  });
  const bottlerAddr = await prisma.address.create({
    data: {
      companyId: gbgCompany.id,
      type: "SHIPPING",
      line1: "Källvägen 4",
      postalCode: "795 32",
      city: "Rättvik",
    },
  });
  const labelAddr = await prisma.address.create({
    data: {
      companyId: orbCompany.id,
      type: "SHIPPING",
      line1: "Etikettgatan 8",
      postalCode: "417 56",
      city: "Göteborg",
    },
  });
  const gbg = await prisma.factory.create({
    data: {
      companyId: gbgCompany.id,
      name: "Tollagården Tappning",
      code: "BOT",
      kind: "bottler",
      addressId: bottlerAddr.id,
    },
  });
  const orb = await prisma.factory.create({
    data: {
      companyId: orbCompany.id,
      name: "LabelPrint Göteborg",
      code: "LBL",
      kind: "label",
      addressId: labelAddr.id,
    },
  });

  const aquaCo = await prisma.company.create({
    data: { orgNr: "556800-2048", name: "Aqua Visibility AB", email: "info@aquavisibility.se", phone: "08-400 204 80" },
  });

  const customers = [];
  for (let i = 0; i < CUSTOMERS.length; i++) {
    const c = await prisma.customer.create({
      data: {
        priceListId: listByCode[PRICE_CYCLE[i % PRICE_CYCLE.length]].id,
        name: CUSTOMERS[i],
        orgNr: i < 20 ? `5599${String(100000 + i).slice(1)}` : undefined,
        email: `kontakt@kund${i + 1}.se`,
      },
    });
    const addr = await prisma.address.create({
      data: {
        customerId: c.id,
        type: "SHIPPING",
        line1: "Storgatan 1",
        postalCode: "111 22",
        city: CUSTOMERS[i].split(" ")[0],
      },
    });
    customers.push({ customer: c, addr });
  }

  const staff = await prisma.user.create({
    data: {
      email: "staff@demo.aqua",
      name: "Alex Operations",
      passwordHash,
      role: "AQUA_ADMIN",
      companyId: aquaCo.id,
    },
  });
  await prisma.user.create({
    data: {
      email: "admin@demo.aqua",
      name: "Joakim Admin",
      passwordHash,
      role: "AQUA_ADMIN",
      companyId: aquaCo.id,
    },
  });
  await prisma.user.create({
    data: {
      email: "bottler@demo.aqua",
      name: "Kim Bottler",
      passwordHash,
      role: "BOTTLER",
      factoryId: gbg.id,
      companyId: gbgCompany.id,
    },
  });
  await prisma.user.create({
    data: {
      email: "labels@demo.aqua",
      name: "Liv Etikett",
      passwordHash,
      role: "LABEL",
      factoryId: orb.id,
      companyId: orbCompany.id,
    },
  });
  const directCo = await prisma.company.create({
    data: { orgNr: "559888-0101", name: "Fikastunden Direkt AB", email: "kund@demo.aqua" },
  });
  const directCustomer = await prisma.customer.create({
    data: {
      companyId: directCo.id,
      priceListId: listByCode.STANDARD.id,
      name: "Fikastunden Direkt AB",
      orgNr: "559888-0101",
      email: "kund@demo.aqua",
    },
  });
  const directAddr = await prisma.address.create({
    data: {
      customerId: directCustomer.id,
      type: "SHIPPING",
      line1: "Kungsgatan 1",
      postalCode: "411 19",
      city: "Göteborg",
    },
  });
  const kundUser = await prisma.user.create({
    data: {
      email: "kund@demo.aqua",
      name: "Sara Kund",
      passwordHash,
      role: "CUSTOMER",
      companyId: directCo.id,
      customerId: directCustomer.id,
    },
  });
  const sampleProduct = createdProducts.find((p) => p.category === "WATER") ?? createdProducts[0];
  if (sampleProduct) {
    await prisma.design.create({
      data: {
        userId: kundUser.id,
        productId: sampleProduct.id,
        projectName: "Sara sommar",
        source: "customer_order",
        status: "SUBMITTED",
        quantity: 2500,
        optionsJson: "{}",
        files: {
          create: {
            fileName: "sara-etikett.pdf",
            mimeType: "application/pdf",
            storageKey: "artwork/sara-etikett.pdf",
            kind: "original",
            uploadedById: kundUser.id,
          },
        },
      },
    });
  }

  const allVariants = createdProducts
    .filter((p) => p.category === "WATER")
    .flatMap((p) => p.variants.map((v) => ({ variant: v, product: p })));
  const qtys = [270, 540, 1080, 2500, 5000];
  const createdOrderIds: string[] = [];

  for (let i = 0; i < 50; i++) {
    const status = STATUSES[Math.min(STATUSES.length - 1, Math.floor((i / 50) * STATUSES.length))];
    const pair = customers[i % customers.length];
    const pv = allVariants[i % allVariants.length];
    const qty = qtys[i % qtys.length];
    const factory = gbg;
    const orderNo = `AV-${10450 + i}`;
    const createdAt = new Date(2026, 6, 1 + (i % 40));
    const opt = JSON.parse(pv.variant.optionsJson || "{}") as { waterType?: string; cap?: string; color?: string };
    const visual = {
      productName: pv.product.name,
      qty,
      volumeLabel: pv.variant.volumeMl ? `${Math.round(pv.variant.volumeMl / 10)} CL` : "",
      waterType: opt.waterType?.includes("kolsyr") ? "KOLSYRAT" : "STILLA",
      bottleColor: "TRANSPARENT FLASKA",
      cap: opt.cap === "white" ? "VIT KAPSYL" : "SVART KAPSYL",
    };
    const idx = STATUSES.indexOf(status);
    const locked = idx >= 4;
    const order = await prisma.order.create({
      data: {
        orderNo,
        buyerType: "CUSTOMER",
        customerId: pair.customer.id,
        currentStatus: status,
        shippingAddressId: pair.addr.id,
        factoryId: factory.id,
        source: i % 5 === 0 && i > 4 ? "repeat" : "customer_order",
        sourceOrderId: i % 5 === 0 && i > 4 ? createdOrderIds[i - 5] : undefined,
        invoiceRef: `REF-${200 + i}`,
        requestedDate: "2026-09-15",
        preliminaryDate: "2026-09-20",
        confirmedDate: locked ? "2026-09-22" : null,
        aquaApprovedDelivery: idx >= 9 ? "2026-09-22" : null,
        repeatHorizonMonths: locked && i % 3 === 0 ? 12 : null,
        lockedAt: locked ? createdAt : null,
        extrasJson: locked ? JSON.stringify([{ kind: "freight", label: "Frakt", amountExVat: 450 }]) : "[]",
        priceSnapshotJson: locked
          ? JSON.stringify({
              lines: [{ name: pv.product.name, qty, unitPriceExVat: 3.1, lineExVat: Math.round(qty * 3.1 * 100) / 100 }],
              extras: [{ kind: "freight", label: "Frakt", amountExVat: 450 }],
              extrasExVat: 450,
              goodsExVat: Math.round(qty * 3.1 * 100) / 100,
              amountExVat: Math.round((qty * 3.1 + 450) * 100) / 100,
              vatAmount: Math.round((qty * 3.1 + 450) * 0.25 * 100) / 100,
              amountIncVat: Math.round((qty * 3.1 + 450) * 1.25 * 100) / 100,
              lockedAt: createdAt.toISOString(),
            })
          : null,
        visualSpecJson: JSON.stringify(visual),
        factoryDeadline: locked ? "2026-09-10" : null,
        factoryDeadlineAccepted: idx >= 5,
        createdAt,
        items: {
          create: {
            variantId: pv.variant.id,
            qty,
            unitPriceExVat: 3.1,
            visualSpecJson: JSON.stringify(visual),
          },
        },
      },
    });
    createdOrderIds.push(order.id);

    for (let s = 0; s <= idx; s++) {
      await prisma.statusEvent.create({
        data: {
          entityType: "ORDER",
          entityId: order.id,
          fromStatus: s === 0 ? null : STATUSES[s - 1],
          toStatus: STATUSES[s],
          actorRole: s < 2 ? Role.CUSTOMER : s < 5 ? Role.AQUA_STAFF : s < 7 ? Role.LABEL : Role.BOTTLER,
          source: "seed",
          occurredAt: new Date(createdAt.getTime() + s * 86400000),
        },
      });
    }

    const jobStatus = idx >= 10 ? "DONE" : idx >= 9 ? "STARTED" : "NOT_PLANNED";
    const planned = new Date(2026, 7, 25 + (i % 6));
    await prisma.productionJob.create({
      data: {
        orderId: order.id,
        factoryId: orb.id,
        status: idx >= 6 ? "DONE" : idx >= 5 ? "STARTED" : "NOT_PLANNED",
        plannedAt: planned,
      },
    });
    await prisma.productionJob.create({
      data: {
        orderId: order.id,
        factoryId: factory.id,
        status: jobStatus as "NOT_PLANNED",
        plannedAt: planned,
      },
    });

    if (locked && i % 3 === 0) {
      const expected = new Date();
      expected.setDate(expected.getDate() + (i % 6 === 0 ? 4 : 18));
      const activate = new Date();
      activate.setDate(activate.getDate() - 7);
      await prisma.repeatOpportunity.create({
        data: {
          sourceOrderId: order.id,
          customerId: pair.customer.id,
          expectedAt: expected,
          activateAt: activate,
          status: i % 6 === 0 ? "ACTIVE" : i % 9 === 0 ? "CUSTOMER_REMINDED" : "UPCOMING",
        },
      });
    }

    if (idx >= 6) {
      await prisma.shipment.create({
        data: {
          orderId: order.id,
          type: "LABELS_TO_FACTORY",
          carrier: "PostNord",
          trackingNo: `LBL${10450 + i}`,
          status: idx >= 7 ? "DELIVERED" : "IN_TRANSIT",
        },
      });
    }

    if (idx >= 10) {
      await prisma.shipment.create({
        data: {
          orderId: order.id,
          type: "GOODS_TO_CUSTOMER",
          carrier: "PostNord",
          trackingNo: `AV00${10450 + i}`,
          waybillNo: `WB-${10450 + i}`,
          status: idx >= 12 ? "DELIVERED" : idx >= 11 ? "IN_TRANSIT" : "CREATED",
        },
      });
    }

    if (idx >= 14) {
      await prisma.invoice.create({
        data: {
          orderId: order.id,
          customerId: pair.customer.id,
          invoiceNo: String(10450 + i),
          fortnoxId: `FX-${10450 + i}`,
          status: idx >= 15 ? "PAID" : "ISSUED",
          amountExVat: qty * 6.4,
          vatAmount: qty * 6.4 * 0.25,
          amountIncVat: qty * 6.4 * 1.25,
          issuedAt: new Date(),
          paidAt: idx >= 15 ? new Date() : null,
        },
      });
      await prisma.document.create({
        data: {
          orderId: order.id,
          entityType: "ORDER",
          entityId: order.id,
          kind: "FINANCE",
          title: `Faktura ${10450 + i}`,
          storageKey: `invoices/${10450 + i}.pdf`,
        },
      });
    }

    await prisma.document.create({
      data: {
        orderId: order.id,
        entityType: "ORDER",
        entityId: order.id,
        kind: "ORDER",
        title: `Orderbekräftelse ${orderNo}`,
        storageKey: `orders/${orderNo}.pdf`,
      },
    });
    if (idx >= 1) {
      await prisma.document.create({
        data: {
          orderId: order.id,
          entityType: "ORDER",
          entityId: order.id,
          kind: "ARTWORK",
          title: "Artwork original",
          storageKey: `artwork/${orderNo}.pdf`,
        },
      });
    }
  }

  for (let i = 0; i < 6; i++) {
    const status = STATUSES[i];
    const pv = allVariants[i % allVariants.length];
    const qty = 1000;
    const opt = JSON.parse(pv.variant.optionsJson || "{}") as { waterType?: string; cap?: string };
    const visual = {
      productName: pv.product.name,
      qty,
      volumeLabel: pv.variant.volumeMl ? `${Math.round(pv.variant.volumeMl / 10)} CL` : "",
      waterType: opt.waterType?.includes("kolsyr") ? "KOLSYRAT" : "STILLA",
      bottleColor: "TRANSPARENT FLASKA",
      cap: "SVART KAPSYL",
    };
    const locked = i >= 4;
    const order = await prisma.order.create({
      data: {
        orderNo: `AV-K-${2001 + i}`,
        buyerType: "CUSTOMER",
        customerId: directCustomer.id,
        currentStatus: status,
        shippingAddressId: directAddr.id,
        factoryId: gbg.id,
        source: "customer_order",
        invoiceRef: `KUND-${i + 1}`,
        requestedDate: "2026-09-18",
        preliminaryDate: "2026-09-25",
        confirmedDate: locked ? "2026-09-26" : null,
        lockedAt: locked ? new Date() : null,
        factoryDeadline: locked ? "2026-09-10" : null,
        factoryDeadlineAccepted: i >= 5,
        extrasJson: locked ? JSON.stringify([{ kind: "freight", label: "Frakt", amountExVat: 450 }]) : "[]",
        priceSnapshotJson: locked
          ? JSON.stringify({
              lines: [{ name: pv.product.name, qty, unitPriceExVat: 3.1, lineExVat: 3100 }],
              extras: [{ kind: "freight", label: "Frakt", amountExVat: 450 }],
              extrasExVat: 450,
              goodsExVat: 3100,
              amountExVat: 3550,
              vatAmount: 887.5,
              amountIncVat: 4437.5,
              lockedAt: new Date().toISOString(),
            })
          : null,
        visualSpecJson: JSON.stringify(visual),
        items: {
          create: {
            variantId: pv.variant.id,
            qty,
            unitPriceExVat: 3.1,
            visualSpecJson: JSON.stringify(visual),
          },
        },
      },
    });
    await prisma.productionJob.create({
      data: { orderId: order.id, factoryId: orb.id, status: "NOT_PLANNED" },
    });
    await prisma.productionJob.create({
      data: { orderId: order.id, factoryId: gbg.id, status: "NOT_PLANNED" },
    });
    await prisma.statusEvent.create({
      data: {
        entityType: "ORDER",
        entityId: order.id,
        toStatus: status,
        actorRole: Role.CUSTOMER,
        source: "seed",
      },
    });
    if (locked) {
      await prisma.repeatOpportunity.create({
        data: {
          sourceOrderId: order.id,
          customerId: directCustomer.id,
          expectedAt: new Date(Date.now() + 5 * 86400000),
          activateAt: new Date(Date.now() - 7 * 86400000),
          status: "ACTIVE",
        },
      });
    }
  }

  const goldOrders = await prisma.order.findMany({
    where: { currentStatus: "ARTWORK_AQUA_REVIEW" },
    take: 3,
  });
  for (const o of goldOrders) {
    await prisma.notification.create({
      data: {
        userId: staff.id,
        type: "artwork",
        title: "Artwork behöver godkännas",
        body: `${o.orderNo} väntar på godkännande.`,
        entityType: "ORDER",
        entityId: o.id,
      },
    });
  }
  await prisma.notification.create({
    data: {
      userId: staff.id,
      type: "invoice",
      title: "Order redo för fakturering",
      body: "Flera ordrar är levererade och redo att faktureras.",
      entityType: "ORDER",
    },
  });

  await prisma.pageCopy.createMany({
    data: [
      {
        slug: "home-hero-1",
        title: "Behöver ni svalka?",
        body: "Lugn, vi hjälper er!",
      },
      {
        slug: "om",
        title: "Mässprodukter och profilprodukter för företag",
        body: "Företaget utvecklar, marknadsför och distribuerar dryck med kundanpassad förpackning och etikett. Vi jobbar huvudsakligen mot återförsäljare, som profil- och presentreklambranschen, reklambyråer och butikskedjor.",
      },
    ],
  });

  await ensureDemoShowcase(prisma);
  console.log("Seed klar: profilvatten, labels@ + bottler@, kunder, flaskordrar, visningsdata.");
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
