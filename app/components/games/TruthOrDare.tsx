"use client";

import { useMemo } from "react";
import { useMultiplayerGame } from "@/app/components/useMultiplayerGame";
import { useLocale } from "@/app/components/LocaleProvider";
import { soundTap, soundSuccess } from "@/lib/audio";

const truths = [
  "Who in this room would you invite on a trip first?",
  "What's the weirdest excuse you've used to leave a party?",
  "What's your guilty pleasure song?",
  "Who here would you trust with your phone password?",
  "What's the most embarrassing thing in your search history?",
  "If you could switch lives with someone here for a day, who?",
  "What's the worst date you've ever been on?",
  "Have you ever fake-laughed at a joke you didn't get?",
  "What's the pettiest reason you've unfollowed someone?",
  "Who in this room would survive a zombie apocalypse?",
  "What's a skill you pretend to have but really don't?",
  "Have you ever blamed a fart on someone else?",
  "What's the most illegal thing you've done?",
  "If your life was a reality show, what would it be called?",
  "Who here would you trust to keep a secret?",
  "What's the longest you've gone without showering?",
  "Have you ever stalked someone's ex online?",
  "What's the worst gift you've ever regifted?",
  "Who in this room is most likely to become famous?",
  "What's a food you love that everyone else hates?",
  "What's your biggest irrational fear?",
  "Have you ever faked being sick to avoid plans?",
  "What's the most awkward thing you've witnessed in public?",
  "If you could erase one thing from the internet, what?",
  "What's the cringiest memory from your childhood?",
  "Have you ever peed in a pool?",
  "What's the worst advice you've ever given?",
  "Who in this room would you trust with your life?",
  "What's the most expensive thing you've broken?",
  "Have you ever stolen something?",
  "What's a secret you've never told anyone in this room?",
  "If you had to marry someone in this room, who?",
  "What's the most romantic thing you've done?",
  "Who here would be your survival partner?",
  "What's your hidden talent?",
  "Have you ever cheated in a game?",
  "What's the biggest lie you've told your parents?",
  "If you could be invisible for a day, what would you do?",
  "What's the most embarrassing thing your parents have caught you doing?",
  "Who in this room is most likely to end up on reality TV?",
  "What's the worst haircut you've ever had?",
  "Have you ever sent a text to the wrong person?",
  "What's the most unnecessary thing you own?",
  "If you could swap places with someone here, who?",
  "What's the weirdest thing you do when nobody's watching?",
  "Have you ever eavesdropped on a conversation about you?",
  "What's the most trouble you've ever been in?",
  "Who in this room is the best dancer?",
  "What's your most controversial opinion?",
  "Have you ever ghosted a friend?",
  "What's the worst fashion trend you've followed?",
  "If you could read minds, whose mind would you read first?",
  "What's the most spontaneous thing you've done?",
  "Have you ever lied in a job interview?",
  "What's the silliest thing you're afraid of?",
  "Who in this room would make the worst roommate?",
  "What's the longest you've gone without brushing your teeth?",
  "Have you ever pretended to like a movie you hated?",
  "What's the most useless talent you have?",
  "If you had to delete all but one app from your phone, which would you keep?",
  "What's the pettiest thing you've done out of jealousy?",
  "Have you ever snuck out of the house?",
  "What's the worst pain you've ever felt?",
  "Who in this room talks the most?",
  "What's the most embarrassing phase you went through?",
  "Have you ever had a crush on a friend's ex?",
  "What's something you do that you know is bad for you?",
  "If you could time travel, where would you go?",
  "What's the weirdest dream you've ever had?",
  "Have you ever cried during a commercial?",
  "What's the most useless thing you've memorized?",
  "Who in this room is most likely to be late to their own wedding?",
  "What's the worst smell you've ever smelled?",
  "Have you ever been caught picking your nose?",
  "What's the most embarrassing thing in your camera roll right now?",
  "If you could be any animal, which would you be?",
  "What's the most reckless thing you've done for love?",
  "Have you ever farted in an elevator and blamed someone else?",
  "What's your biggest pet peeve?",
  "Who in this room would you want to be stuck on a deserted island with?",
  "What's the wildest thing you've done on vacation?",
  "Have you ever broken up with someone by text?",
  "What's the most childish thing you still do?",
  "If you could instantly master one skill, what would it be?",
  "What's the dumbest way you've injured yourself?",
  "Have you ever been in a fight?",
  "What's the most embarrassing thing your sibling knows about you?",
  "Who in this room is most likely to become a millionaire?",
  "What's the worst movie you've ever seen?",
  "Have you ever stalked someone's social media for hours?",
  "What's the most awkward first date you've had?",
  "If you could live in any fictional universe, which?",
  "What's the most inappropriate laugh you've had?",
  "Have you ever been caught singing in the shower?",
  "What's the worst thing you've ever tasted?",
  "Who in this room would make the best president?",
  "What's a deal breaker for you in a friendship?",
  "Have you ever done something illegal and gotten away with it?",
  "What's the most embarrassing thing you've worn?",
  "If you could have dinner with any historical figure, who?",
  "What's the biggest risk you've ever taken?",
  "Have you ever regretted a tattoo or piercing?",
  "What's the most awkward thing you've said to a crush?",
];

const dares = [
  "Narrate this party like a movie trailer.",
  "Dance for 15 seconds with no music.",
  "Send the last person you texted a random sticker.",
  "Give everyone in the room a stage name.",
  "Do your best impression of the person to your left.",
  "Post an embarrassing selfie and keep it up for 5 min.",
  "Call a friend and say 'I love you' without context.",
  "Let someone in the room post anything on your social media.",
  "Speak in an accent for the next 3 rounds.",
  "Do 10 push-ups right now.",
  "Serenade the person across from you.",
  "Swap an item of clothing with someone else.",
  "Make up a conspiracy theory about this party on the spot.",
  "Let someone go through your phone for 30 seconds.",
  "Act out a Tik Tok trend of the group's choice.",
  "Talk without closing your mouth for 60 seconds.",
  "Do a dramatic reading of the last text you sent.",
  "Hold a plank until it's your turn again.",
  "Compliment every person in the room for 30 seconds straight.",
  "Recreate a famous painting using only people in this room.",
  "Call your mom and tell her you love her.",
  "Do a catwalk across the room.",
  "Say the alphabet backward in under 15 seconds.",
  "Eat a spoonful of something spicy.",
  "Let someone draw a mustache on your face.",
  "Do your best celebrity impression.",
  "Sing the chorus of any song chosen by the group.",
  "Pretend to be a waiter and take everyone's order.",
  "Do a handstand against the wall for 10 seconds.",
  "Make eye contact with someone for 30 seconds without laughing.",
  "Give a motivational speech about this party.",
  "Do 20 jumping jacks.",
  "Let the group give you a new hairstyle.",
  "Talk in third person for the next 5 minutes.",
  "Lick your elbow (or try to).",
  "Send a compliment to the last three people in your chat.",
  "Do a dramatic slow-motion walk across the room.",
  "Make up a rap about this party on the spot.",
  "Spin around 10 times and try to walk straight.",
  "Keep a straight face while everyone tries to make you laugh.",
  "Do your best robot dance for 30 seconds.",
  "Let someone write a word on your forehead with a marker.",
  "Attempt to breakdance for 15 seconds.",
  "Say tongue twisters 3 times fast.",
  "Do a plank and recite the alphabet at the same time.",
  "Mimic the person two seats away for one minute.",
  "Create a new dance move and teach it to everyone.",
  "Do a trust fall with someone in the room.",
  "Wear your shirt backward for the rest of the game.",
  "Call a random contact and sing happy birthday to them.",
  "Do an impression of a baby crying.",
  "Let someone dump a glass of water over your head (outside).",
  "Act out a famous movie scene with another player.",
  "Do the moonwalk across the room.",
  "Speak only in questions for the next 5 minutes.",
  "Put an ice cube down your shirt.",
  "Do 15 seconds of beatboxing.",
  "Recite a poem about the person sitting across from you.",
  "Let someone tickle you for 10 seconds.",
  "Attempt to juggle with 3 random objects.",
  "Do your best animal impression for 30 seconds.",
  "Give a foot massage to the person on your left.",
  "Wear a blindfold and guess objects by touch.",
  "Do a dramatic reading of a children's book.",
  "Let the group pick a song and you have to dance to it.",
  "Do a push-up for every year of your age.",
  "Brush someone else's teeth (with their own brush).",
  "Attempt to fold a paper airplane that flies across the room.",
  "Sing a lullaby to the person next to you.",
  "Do a 30-second stand-up comedy routine.",
  "Let someone put makeup on you blindfolded.",
  "Try to lick your nose.",
  "Do the worm dance across the floor.",
  "Give a piggyback ride to someone for 30 seconds.",
  "Attempt to balance a book on your head while walking.",
  "Do a dramatic death scene from a movie.",
  "Let the group choose a new nickname for you.",
  "Speak with a mouthful of crackers for one sentence.",
  "Do 5 cartwheels in a row.",
  "Imitate a famous singer for 30 seconds.",
  "Let someone style your hair however they want.",
  "Do the floss dance for 20 seconds.",
  "Give a lap dance to a chair.",
  "Hold an ice cube in your hand until it melts.",
  "Attempt to do 10 consecutive push-ups.",
  "Do the macarena in the middle of the room.",
  "Recite a tongue twister chosen by the group.",
  "Do a yoga pose and hold it for 30 seconds.",
  "Let someone draw a portrait of you in 30 seconds.",
  "Do an interpretive dance to a random song.",
  "Attempt to whistle a song chosen by the group.",
  "Do 3 rounds of 'I'm a little teapot' with full commitment.",
  "Give a foot massage to the person on your right.",
  "Sing the national anthem of a country chosen by the group.",
  "Do a dramatic reading of a receipt or menu.",
  "Act like a dog for 60 seconds.",
  "Let the group pose you for a photo and you have to keep the pose.",
  "Do your best opera singer impression.",
  "Attempt to carry someone across the room bridal style.",
  "Speak in a whisper for the next 5 minutes.",
  "Do a belly dance for 20 seconds.",
  "Let someone draw something on your arm.",
  "Make 3 animal sounds in a row and act out each animal.",
];

const truthsRu = [
  "Кого из этой комнаты ты первым позовёшь в путешествие?", "Какая самая странная причина уйти с тусы была у тебя?", "Какая у тебя песня для тайного удовольствия?",
  "Кому здесь ты доверишь пароль от телефона?", "Что самое неловкое было в твоей истории поиска?", "С кем из присутствующих ты поменялся бы жизнью на день?",
  "Какое худшее свидание у тебя было?", "Ты когда-нибудь смеялся над шуткой, которую не понял?", "Из-за чего самого мелкого ты отписывался от человека?",
  "Кто здесь переживёт зомби-апокалипсис?", "Какой навык ты делаешь вид, что умеешь?", "Как бы называлось реалити-шоу о твоей жизни?",
  "Кому здесь ты доверишь секрет?", "Какая еда тебе нравится, а остальные её не понимают?", "Какой твой самый нелогичный страх?",
  "Что бы ты удалил из интернета навсегда?", "Какая детская история до сих пор вызывает кринж?", "Какой худший совет ты давал?",
  "Кому в этой комнате ты доверишь жизнь?", "Что самое дорогое ты когда-либо ломал?", "Какой твой скрытый талант?",
  "Какую самую большую ложь ты говорил родителям?", "Если бы стал невидимым на день, что бы сделал?", "Кто здесь скорее всего станет знаменитым?",
  "Какой самый странный сон тебе снился?", "Кто здесь чаще всех опаздывает?", "Что в твоей галерее сейчас самое неловкое?"
];

const daresRu = [
  "Озвучь эту тусу как трейлер к фильму.", "Танцуй 15 секунд без музыки.", "Отправь последнему собеседнику случайный стикер.",
  "Дай каждому в комнате сценическое имя.", "Изобрази человека слева от тебя.", "Поставь смешное селфи на пять минут.",
  "Позвони другу и скажи «люблю тебя» без контекста.", "Говори с акцентом следующие три раунда.", "Сделай 10 отжиманий прямо сейчас.",
  "Спой человеку напротив короткую серенаду.", "Придумай теорию заговора об этой тусе.", "Станцуй тренд, который выберет группа.",
  "Прочитай последнее отправленное сообщение как драму.", "Держи планку до следующего хода.", "Сделай комплимент каждому в комнате.",
  "Пройди по комнате как по подиуму.", "Скажи алфавит задом наперёд насколько сможешь.", "Изобрази известную знаменитость.",
  "Спой припев песни, которую выберет группа.", "Стань официантом и прими заказ у всех.", "Выступи с мотивационной речью о тусе.",
  "Сделай 20 прыжков на месте.", "Рассказывай о себе в третьем лице пять минут.", "Придумай рэп об этой тусе.",
  "Покружись 10 раз и попробуй пройти по прямой.", "Сделай танец робота 30 секунд.", "Придумай новый танец и научи ему всех."
];

function shuffle<T>(items: T[]) {
  const result = [...items];
  for (let index = result.length - 1; index > 0; index -= 1) {
    const target = Math.floor(Math.random() * (index + 1));
    [result[index], result[target]] = [result[target], result[index]];
  }
  return result;
}

type TruthDareState = { mode: "truth" | "dare"; truthIndex: number; dareIndex: number; count: number };

export default function TruthOrDare({ partyId, sessionId, onSave, role }: { partyId: string; sessionId?: string | null; onSave: (score: number) => void; role?: "stage" | "controller" }) {
  const { locale, t } = useLocale();
  const isHost = role === "stage";
  const { state, setState } = useMultiplayerGame<TruthDareState>(sessionId ?? null, () => ({ mode: "truth", truthIndex: 0, dareIndex: 0, count: 0 }));
  const { mode, truthIndex, dareIndex, count } = state;
  const shuffledTruths = useMemo(() => shuffle(locale === "ru" ? truthsRu : truths), [locale]);
  const shuffledDares = useMemo(() => shuffle(locale === "ru" ? daresRu : dares), [locale]);

  function next() {
    if (!isHost) return;
    soundTap();
    setState((prev) => ({
      ...prev,
      ...(prev.mode === "truth" ? { truthIndex: prev.truthIndex + 1 } : { dareIndex: prev.dareIndex + 1 }),
      count: prev.count + 1,
    }));
  }

  const currentPool = mode === "truth" ? shuffledTruths : shuffledDares;
  const currentIndex = mode === "truth" ? truthIndex : dareIndex;

  return <div className="party-game-board game-board-enter">
    <div className="mode-switch">
      <button className={mode === "truth" ? "active" : ""} onClick={() => isHost && setState((prev) => ({ ...prev, mode: "truth" }))} type="button">{t("truthTitle")}</button>
      <button className={mode === "dare" ? "active" : ""} onClick={() => isHost && setState((prev) => ({ ...prev, mode: "dare" }))} type="button">{t("truthDare")}</button>
    </div>
    <span className="game-step">{mode === "truth" ? t("truthHonest") : t("truthNoBail")}</span>
    <h3 className="game-prompt-swap" key={`${mode}-${currentIndex}`}>{currentPool[currentIndex % currentPool.length]}</h3>
    {isHost && <div className="game-primary-actions">
      <button className="demo-action demo-action--lime" onClick={next} type="button">{t("truthNext")} <span className="material-symbols-rounded">refresh</span></button>
      <button className="demo-action demo-action--white" onClick={() => onSave(count)} type="button">{t("truthFinish")}</button>
    </div>}
    {sessionId && <span className="multiplayer-badge">LIVE</span>}
  </div>;
}
