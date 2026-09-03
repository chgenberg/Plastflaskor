export type HeroScene = {
  id: string;
  src: string;
  portrait: string;
  caption: string;
};

export const HERO_SCENES: HeroScene[] = [
  { id: "konferens", src: "/Images/1a.png", portrait: "/Images/1a.png", caption: "På konferensbordet" },
  { id: "hotell", src: "/Images/2a.png", portrait: "/Images/2a.png", caption: "På hotellrummet" },
  { id: "event", src: "/Images/3a.png", portrait: "/Images/3a.png", caption: "På eventet" },
  { id: "gym", src: "/Images/4a.png", portrait: "/Images/4a.png", caption: "I gymmet" },
];

export const ORDER_HREF = "/produkter/profilvatten/naturligt-mineralvatten-33cl";
