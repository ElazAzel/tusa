"use client";

import { useMemo } from "react";
import { useMultiplayerGame } from "@/app/components/useMultiplayerGame";
import { useLocale } from "@/app/components/LocaleProvider";
import { soundCorrect, soundTap } from "@/lib/audio";

const promptsEn = [
  "Never have I ever fallen asleep at a party.",
  "Never have I ever texted an ex after midnight.",
  "Never have I ever sung karaoke sober.",
  "Never have I ever forgotten someone's name right after meeting them.",
  "Never have I ever lied on a resume.",
  "Never have I ever been kicked out of a place.",
  "Never have I ever pretended to like a gift.",
  "Never have I ever eavesdropped on a conversation.",
  "Never have I ever laughed so hard I snorted.",
  "Never have I ever cried during a movie.",
  "Never have I ever ditched a friend for a date.",
  "Never have I ever worn the same outfit two days in a row.",
  "Never have I ever broken something and blamed someone else.",
  "Never have I ever snooped through someone's phone.",
  "Never have I ever been pulled over by the police.",
  "Never have I ever gone skinny dipping.",
  "Never have I ever ghosted someone.",
  "Never have I ever fake-called someone to escape a conversation.",
  "Never have I ever accidentally sent a text to the wrong person.",
  "Never have I ever eaten food that fell on the floor.",
  "Never have I ever stalked an ex on social media.",
  "Never have I ever pretended to be sick to skip work or school.",
  "Never have I ever had a crush on a teacher.",
  "Never have I ever cheated on a test.",
  "Never have I ever been caught picking my nose.",
  "Never have I ever lied about my age.",
  "Never have I ever gotten a tattoo I regret.",
  "Never have I ever kissed someone and immediately regretted it.",
  "Never have I ever lied in a job interview.",
  "Never have I ever blamed my fart on a pet.",
  "Never have I ever cried from laughing too hard.",
  "Never have I ever peed in a shower.",
  "Never have I ever stayed in relationships longer than I should have.",
  "Never have I ever had a crush on a friend's significant other.",
  "Never have I ever been fired from a job.",
  "Never have I ever cheated in a board game.",
  "Never have I ever fallen asleep during a movie in theaters.",
  "Never have I ever pretended to know a song I didn't.",
  "Never have I ever laughed at a funeral.",
  "Never have I ever sent a sext.",
  "Never have I ever regifted a present.",
  "Never have I ever had a one-night stand.",
  "Never have I ever been caught talking to myself.",
  "Never have I ever broken a bone.",
  "Never have I ever gotten lost in my own neighborhood.",
  "Never have I ever worn socks to bed.",
  "Never have I ever faked an orgasm.",
  "Never have I ever been in a physical fight.",
  "Never have I ever made out in a public place.",
  "Never have I ever done karaoke in public.",
  "Never have I ever saved someone's contact under a funny name.",
  "Never have I ever had a parasocial relationship with a celebrity.",
  "Never have I ever thrown up from drinking too much.",
  "Never have I ever matched with someone I know on a dating app.",
  "Never have I ever tried to be friends with an ex.",
  "Never have I ever gone to work hungover.",
  "Never have I ever said 'I love you' without meaning it.",
  "Never have I ever dyed my hair an extreme color.",
  "Never have I ever danced on a table.",
  "Never have I ever had a crush on a fictional character.",
  "Never have I ever stalked someone's ex online.",
  "Never have I ever left a party without saying goodbye.",
  "Never have I ever eaten something that fell on the ground.",
  "Never have I ever lied about my height.",
  "Never have I ever eavesdropped on someone else's conversation.",
  "Never have I ever been caught picking a wedgie in public.",
  "Never have I ever had a secret Instagram account.",
  "Never have I ever made a fake profile.",
  "Never have I ever been rejected by someone I asked out.",
  "Never have I ever rejected someone in a mean way.",
  "Never have I ever cried in a public place.",
  "Never have I ever worn something that caused a fashion disaster.",
  "Never have I ever been to therapy.",
  "Never have I ever regretted a piercing.",
  "Never have I ever had a panic attack.",
  "Never have I ever been on a blind date.",
  "Never have I ever had a celebrity crush.",
  "Never have I ever farted in an elevator.",
  "Never have I ever used a fake ID.",
  "Never have I ever accidentally liked someone's old photo while stalking.",
  "Never have I ever cried from cutting onions.",
  "Never have I ever eaten an entire pizza by myself.",
  "Never have I ever watched a movie more than 3 times in theaters.",
  "Never have I ever participated in a flash mob.",
  "Never have I ever gone viral for something embarrassing.",
  "Never have I ever been betrayed by a close friend.",
  "Never have I ever had a crush on someone I shouldn't have.",
  "Never have I ever lied to get out of plans.",
  "Never have I ever slept with a stuffed animal as an adult.",
  "Never have I ever had a secret talent nobody knows.",
  "Never have I ever been in a long-distance relationship.",
  "Never have I ever been dumped via text.",
  "Never have I ever broken up with someone via text.",
  "Never have I ever had a dream about someone in this room.",
  "Never have I ever streaked or run around naked.",
  "Never have I ever put ketchup on something that shouldn't have ketchup.",
  "Never have I ever started a rumor.",
  "Never have I ever been the subject of a rumor.",
  "Never have I ever had a crush on a friend's parent.",
  "Never have I ever been caught in a lie by my parents.",
  "Never have I ever snuck out of the house at night.",
  "Never have I ever pretended not to see someone to avoid talking to them.",
  "Never have I ever had a wardrobe malfunction in public.",
  "Never have I ever gone swimming in clothes.",
  "Never have I ever faked a laugh at a joke I didn't get.",
  "Never have I ever stayed up all night for no good reason.",
  "Never have I ever called someone the wrong name.",
  "Never have I ever tripped in public and pretended it was on purpose.",
  "Never have I ever had food stolen from me at work.",
  "Never have I ever taken something from a hotel room as a souvenir.",
  "Never have I ever fallen asleep in a public place and drooled.",
  "Never have I ever procrastinated so much I missed a deadline.",
  "Never have I ever had an imaginary friend.",
  "Never have I ever talked to my pet like they understand me.",
  "Never have I ever eaten a whole box of cookies in one sitting.",
  "Never have I ever gone to the wrong classroom or office.",
  "Never have I ever sneezed so hard I hurt myself.",
];

const promptsRu = [
  "Я никогда не засыпал на тусе.", "Я никогда не писал бывшему после полуночи.", "Я никогда не пел караоке трезвым.",
  "Я никогда не забывал имя человека сразу после знакомства.", "Я никогда не врал в резюме.", "Я никогда не был изгнан из заведения.",
  "Я никогда не притворялся, что мне понравился подарок.", "Я никогда не подслушивал чужой разговор.", "Я никогда не смеялся так сильно, что фыркнул.",
  "Я никогда не плакал во время фильма.", "Я никогда не бросал друга ради свидания.", "Я никогда не носил один наряд два дня подряд.",
  "Я никогда не ломал вещь и не винил другого.", "Я никогда не заглядывал в чужой телефон.", "Я никогда не купался голышом.",
  "Я никогда не игнорировал кого-то без объяснения.", "Я никогда не отправлял сообщение не тому человеку.", "Я никогда не ел еду, упавшую на пол.",
  "Я никогда не притворялся больным, чтобы пропустить учёбу или работу.", "Я никогда не влюблялся в преподавателя.", "Я никогда не списывал на тесте.",
  "Я никогда не лгал о своём возрасте.", "Я никогда не жалел о татуировке.", "Я никогда не проигрывал спор самому себе.",
  "Я никогда не танцевал на столе.", "Я никогда не уходил с тусы не попрощавшись.", "Я никогда не имел секретного таланта.",
  "Я никогда не проспал дедлайн из-за прокрастинации.", "Я никогда не разговаривал с питомцем как с человеком.", "Я никогда не съедал целую коробку печенья за раз."
];

function shuffle<T>(items: T[]) {
  const result = [...items];
  for (let index = result.length - 1; index > 0; index -= 1) {
    const target = Math.floor(Math.random() * (index + 1));
    [result[index], result[target]] = [result[target], result[index]];
  }
  return result;
}

type NeverState = { index: number; count: number };

export default function NeverHaveIEver({ partyId, sessionId, onSave, role }: { partyId: string; sessionId?: string | null; onSave: (score: number) => void; role?: "stage" | "controller" }) {
  const { locale, t } = useLocale();
  const { state, setState } = useMultiplayerGame<NeverState>(sessionId ?? null, () => ({ index: 0, count: 0 }));
  const shuffled = useMemo(() => shuffle(locale === "ru" ? promptsRu : promptsEn), [locale]);

  function me() { soundCorrect(); setState((prev) => ({ ...prev, count: prev.count + 1, index: prev.index + 1 })); }

  return <div className="party-game-board game-board-enter"><span className="game-step">{t("neverHeader")}</span><h3 className="game-prompt-swap" key={`prompt-${state.index}`}>{shuffled[state.index % shuffled.length]}</h3><strong className="confession-count" key={`confessions-${state.count}`}>{state.count}{t("neverConfessions")}</strong><div className="game-primary-actions"><button className="demo-action demo-action--white" onClick={() => setState((prev) => ({ ...prev, index: prev.index + 1 }))} type="button">{t("neverSkip")}</button><button className="demo-action demo-action--lime" onClick={me} type="button">{t("neverMe")}</button><button className="demo-action demo-action--dark" onClick={() => onSave(state.count)} type="button">{t("neverSave")}</button></div>{sessionId && <span className="multiplayer-badge">LIVE</span>}</div>;
}
