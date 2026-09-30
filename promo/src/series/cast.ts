export type CastId = "amir" | "dana" | "erlan" | "aliya" | "timur";

export type CastMember = {
  id: CastId;
  name: string;
  tagline: string;
  skin: string;
  cloth: string;
  clothDark: string;
  hair: string;
  accent: string;
  tag: string;
  tagText: string;
  voice: number;
};

export const CAST: Record<CastId, CastMember> = {
  amir: {
    id: "amir",
    name: "Амир",
    tagline: "Создаёт тусу быстрее, чем все ответят «я подумаю»",
    skin: "#e2a877",
    cloth: "#c9ff05",
    clothDark: "#93bd00",
    hair: "#1d1512",
    accent: "#2d00f7",
    tag: "#c9ff05",
    tagText: "#121218",
    voice: 190,
  },
  dana: {
    id: "dana",
    name: "Дана",
    tagline: "Играет только на победу. Даже в «камень, ножницы, бумага»",
    skin: "#f1c59b",
    cloth: "#ff007f",
    clothDark: "#cf0070",
    hair: "#221816",
    accent: "#c9ff05",
    tag: "#ff007f",
    tagText: "#ffffff",
    voice: 300,
  },
  erlan: {
    id: "erlan",
    name: "Ерлан",
    tagline: "Отвечает за угли. Всегда. Даже когда шашлыка нет",
    skin: "#c98b5d",
    cloth: "#ffc247",
    clothDark: "#e09a1c",
    hair: "#15100e",
    accent: "#57c2ff",
    tag: "#ffc247",
    tagText: "#121218",
    voice: 135,
  },
  aliya: {
    id: "aliya",
    name: "Алия",
    tagline: "Рисует лучше всех. Врёт хуже всех",
    skin: "#f4d0ae",
    cloth: "#f6f6ee",
    clothDark: "#d8d8cc",
    hair: "#6a45ff",
    accent: "#c9ff05",
    tag: "#6a45ff",
    tagText: "#ffffff",
    voice: 350,
  },
  timur: {
    id: "timur",
    name: "Тимур",
    tagline: "Единственный, кто читает правила до конца",
    skin: "#dfb189",
    cloth: "#57c2ff",
    clothDark: "#2f93cf",
    hair: "#3a2619",
    accent: "#121218",
    tag: "#57c2ff",
    tagText: "#121218",
    voice: 230,
  },
};

export const CAST_ORDER: CastId[] = ["amir", "dana", "erlan", "aliya", "timur"];
