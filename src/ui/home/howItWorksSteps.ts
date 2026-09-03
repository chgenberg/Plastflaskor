export type StepDef = {
  n: string;
  title: string;
  body: string;
  image: string;
  imageMobile?: string;
  alt: string;
};

export const STEPS: StepDef[] = [
  {
    n: "01",
    title: "Välj flaska och volym",
    body: "33 eller 50 cl, stilla eller kolsyrat. Du sätter antal från minsta order.",
    image: "/Images/pages/valmojligheter-antal.png",
    alt: "Produktsidan med volym vald",
  },
  {
    n: "02",
    title: "Designa etiketten eller ladda upp",
    body: "Rita i studion eller släpp in er färdiga fil. Du ser flaskan medan du jobbar.",
    image: "/Images/pages/valmojligheter-etikett.png",
    alt: "Etikettstudion med flaskan uppdaterad",
  },
  {
    n: "03",
    title: "Beställ",
    body: "Konto skapas i kassan. Du får en bekräftelse med exakt det du godkände.",
    image: "/Images/pages/aterforsaljare-portal.png",
    alt: "Kassan med ordern",
  },
  {
    n: "04",
    title: "Vi sköter etikett, tappning och leverans",
    body: "Etikettproducent, tappning i Dalarna, frakt till er dörr. Normal tid står på produkten.",
    image: "/Images/pages/offert-leverans.png",
    alt: "Leverans av profilvatten",
  },
];
