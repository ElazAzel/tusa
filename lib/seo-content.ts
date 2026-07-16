export interface SeoPageContent {
  title: string;
  description: string;
  kicker: string;
  h1: string;
  intro: string;
  body: string;
  stepsTitle: string;
  steps: string[];
  gamesTitle: string;
  games: { name: string; desc: string }[];
  faqs: { q: string; a: string }[];
}

export const SEO_CONTENT: Record<string, { ru: SeoPageContent; en: SeoPageContent }> = {
  "party-games": {
    ru: {
      title: "Игры для компании онлайн — Лучшие игры для вечеринок",
      description: "Подборка лучших игр для компании друзей на вечеринку. Играйте онлайн с телефона без скачивания и установки приложений на TUSA.game.",
      kicker: "ИГРЫ ДЛЯ КОМПАНИИ",
      h1: "Лучшие игры для компании: как развлечь гостей",
      intro: "Игры для компании — это лучший способ растопить лед, объединить гостей и превратить обычные посиделки в незабываемую вечеринку. TUSA.game предлагает 32 уникальных игровых режима, которые не требуют скачивания: достаточно открыть ссылку, и все игроки подключаются со своих телефонов.",
      body: "Ищете, во что поиграть с друзьями дома, в гостях или онлайн? Наша платформа объединяет популярные словесные игры, викторины и психологические игры для групп любого размера. Больше не нужно раздавать бумажки или покупать дорогие коробки с настолками — ваш смартфон становится игровым контроллером, а экран планшета или ТВ — общим полем.",
      stepsTitle: "Как начать играть в компании:",
      steps: [
        "Один человек создает комнату тусы на TUSA.game и делится ссылкой-инвайтом.",
        "Друзья сканируют QR-код или переходят по ссылке со своих телефонов (регистрация не требуется).",
        "Хост выбирает один из 32 режимов, и все играют в реальном времени!"
      ],
      gamesTitle: "Популярные игры для компании на TUSA:",
      games: [
        { name: "Алиас (Alias)", desc: "Классическая игра на объяснение слов. Объясняйте синонимами, жестами или намеками на скорость." },
        { name: "Крокодил", desc: "Показывайте слова движениями тела. Никаких слов, только чистая мимика и артистизм." },
        { name: "Мафия / Оборотень (Werewolf)", desc: "Психологическая игра в скрытые роли. Вычислите предателей среди мирных жителей до того, как станет слишком поздно." }
      ],
      faqs: [
        { q: "Сколько человек может играть одновременно?", a: "Наши игры поддерживают от 2 до 20+ игроков в одной комнате. Идеально как для маленьких компаний, так и для больших тусовок." },
        { q: "Нужно ли скачивать приложение?", a: "Нет, TUSA работает прямо в браузере любого смартфона или ПК. Никаких установок и App Store." },
        { q: "Это бесплатно?", a: "Да, базовый набор игр и функций создания комнат полностью бесплатен для всех участников." }
      ]
    },
    en: {
      title: "Best Party Games for Groups — Play Online Free",
      description: "Discover the best party games for groups. Play multiplayer browser games with friends on phone without installation on TUSA.game.",
      kicker: "PARTY GAMES FOR GROUPS",
      h1: "Best Party Games for Groups & Gatherings",
      intro: "Party games are the ultimate icebreaker to unite guests and transform casual hangouts into legendary nights. TUSA.game offers 32 unique browser-based game modes that require zero downloads: just open a link and play.",
      body: "Whether hosting a home party, a video call, or a casual weekend get-together, our platform combines word games, trivia quizzes, and social deduction. Skip the expensive board game boxes or app store downloads. Your phone acts as a controller, and any shared screen displays the game board.",
      stepsTitle: "How to start a party game night:",
      steps: [
        "One host creates a room on TUSA.game and shares the invite link or QR code.",
        "Guests join instantly from their mobile browsers without signing up.",
        "Choose from 32 games and start playing in real-time."
      ],
      gamesTitle: "Top Group Games on TUSA:",
      games: [
        { name: "Alias / Word Blast", desc: "Explain words to your team under time pressure without using the actual target word." },
        { name: "Crocodil / Charades", desc: "Act out funny prompts using mime and body language. Pure comedy for large groups." },
        { name: "Werewolf / One Night", desc: "A tense social deduction game of hidden roles and bluffing. Spot the wolves before the village is lost." }
      ],
      faqs: [
        { q: "How many players can join?", a: "Most game modes support from 2 to 20+ players. Perfect for both close friend circles and massive parties." },
        { q: "Do players need to install an app?", a: "No, TUSA runs directly in Safari, Chrome, or any mobile browser. Zero friction to start playing." },
        { q: "Are these party games free?", a: "Yes! All core game modes and party rooms are completely free for hosts and guests." }
      ]
    }
  },
  "games-for-adults": {
    ru: {
      title: "Игры для взрослой компании 18+ онлайн — TUSA.game",
      description: "Интересные и веселые игры для взрослой компании (18+) на вечеринку. Правда или Дело, Карты Хаоса и другие развлечения онлайн.",
      kicker: "ИГРЫ ДЛЯ ВЗРОСЛЫХ",
      h1: "Игры для взрослой компании: растопите лед",
      intro: "Вечеринки для взрослых требуют игр, которые раскрывают секреты, создают неловкие и смешные ситуации и сближают людей. TUSA.game предлагает специальные форматы для совершеннолетних компаний.",
      body: "Забудьте про скучные застолья. Интерактивные режимы «Правда или Дело» и «Я никогда не» помогут узнать друзей с новой, иногда неожиданной стороны. Все задания и вопросы адаптированы под взрослую аудиторию и запускаются в одно касание прямо с телефона.",
      stepsTitle: "Как устроить взрослую игру:",
      steps: [
        "Откройте TUSA.game и создайте приватную комнату.",
        "Раздайте ссылку гостям. Их ответы будут конфиденциальными на личных экранах.",
        "Выберите взрослый режим и приготовьтесь к откровенным вопросам."
      ],
      gamesTitle: "Игры для взрослых на платформе:",
      games: [
        { name: "Правда или Дело (Truth or Dare)", desc: "Отвечайте на провокационные вопросы или выполняйте безумные действия. Секреты гарантированно раскроются." },
        { name: "Я никогда не (Never Have I Ever)", desc: "Признавайтесь в забавных грехах и узнавайте, кто из ваших друзей делал самые дикие вещи." },
        { name: "Would You Rather (Что бы ты выбрал)", desc: "Сделайте сложный выбор между двумя абсурдными взрослыми сценариями и докажите свою правоту." }
      ],
      faqs: [
        { q: "Есть ли возрастной ценз на игры?", a: "Да, некоторые режимы («Правда или Дело», «Я никогда не») содержат категории вопросов 18+ для взрослых вечеринок." },
        { q: "Видят ли другие игроки мои ответы?", a: "Некоторые ответы анонимны, а некоторые выводятся на общий экран для веселья — это зависит от выбранного режима." },
        { q: "Можно ли играть вдвоем?", a: "Да, наши взрослые игры отлично подходят как для пар, так и для больших компаний." }
      ]
    },
    en: {
      title: "Adult Party Games 18+ Online — TUSA.game",
      description: "Funny and provocative adult party games (18+) for couples and groups. Play Truth or Dare, Cards of Chaos, and more free in browser.",
      kicker: "ADULT PARTY GAMES",
      h1: "Provocative Adult Games for Late-Night Parties",
      intro: "Late-night hangouts require games that reveal secrets, spark hilarious debates, and break social barriers. TUSA.game features specialized adult modes designed for mature crowds.",
      body: "Skip the awkward small talk. Classic party mechanics like 'Truth or Dare' or 'Never Have I Ever' are loaded with hand-crafted, adult-themed questions. Everything is secure, private, and runs directly on players' smartphones.",
      stepsTitle: "How to set up an adult game night:",
      steps: [
        "Launch a private party room on TUSA.game.",
        "Share the QR or invite link with your adult guests.",
        "Choose an 18+ category game and watch the ice melt instantly."
      ],
      gamesTitle: "Recommended Adult Games:",
      games: [
        { name: "Truth or Dare", desc: "Answer spicy questions or perform daredevil tasks. Perfect for breaking the ice." },
        { name: "Never Have I Ever", desc: "Confess to funny mistakes and discover who in your group has the wildest past." },
        { name: "Would You Rather", desc: "Force players to choose between two equally ridiculous or provocative scenarios." }
      ],
      faqs: [
        { q: "Are these games strictly 18+?", a: "You can toggle mature content on or off. The adult decks are tailored for mature audiences." },
        { q: "Is player privacy protected?", a: "Yes. Private inputs remain strictly on the player's controller screen, only showing final choices on the stage." },
        { q: "Can we play as a couple?", a: "Absolutely. These modes are highly popular for couples' game nights or double dates." }
      ]
    }
  },
  "games-for-friends": {
    ru: {
      title: "Во что поиграть с друзьями онлайн — Игры на телефоне",
      description: "Игры для компании друзей онлайн на телефоне. Словесные игры, викторины и психологические режимы без скачивания на TUSA.game.",
      kicker: "ИГРЫ С ДРУЗЬЯМИ",
      h1: "Во что поиграть с друзьями: подборка развлечений",
      intro: "Когда привычные разговоры надоедают, интерактивные игры с друзьями возвращают азарт и смех. На TUSA.game собраны десятки игр, которые идеально подходят для близкого круга.",
      body: "Неважно, собрались ли вы дома на диване или созваниваетесь из разных городов. Наши игры соединяют людей в одно мгновение. Угадывайте мысли друг друга, соревнуйтесь в эрудиции или блефуйте — в каталоге TUSA найдется игра под любое настроение.",
      stepsTitle: "Быстрый старт с друзьями:",
      steps: [
        "Откройте лобби и выберите игру (например, Кодовые имена или Бомб Пати).",
        "Скиньте ссылку в ваш дружеский чат.",
        "Начните первый раунд без долгого изучения сложных правил."
      ],
      gamesTitle: "Лучшие игры для друзей:",
      games: [
        { name: "Кодовые имена (Codenames)", desc: "Командная игра в ассоциации. Капитаны дают подсказки из одного слова, связывая карточки своей команды." },
        { name: "Bomb Party (Словесная бомба)", desc: "Быстрая игра на реакцию и словарный запас. Называйте слова с нужным слогом, пока таймер тикает." },
        { name: "Шпион (Spyfall)", desc: "Задавайте вопросы по кругу и вычислите шпиона, который не знает, где все находятся." }
      ],
      faqs: [
        { q: "Можно ли играть удаленно?", a: "Да, TUSA изначально создана для гибридного и удаленного формата. Запустите видеозвонок и откройте игру." },
        { q: "Нужно ли регистрироваться?", a: "Регистрация по желанию. Гости могут заходить как анонимные игроки с любым ником." },
        { q: "Сколько времени идет одна игра?", a: "Большинство режимов рассчитаны на быстрые сессии по 10-15 минут." }
      ]
    },
    en: {
      title: "Fun Games to Play with Friends Online — TUSA.game",
      description: "Explore fun multiplayer browser games to play with friends on phone. Word games, quizzes, and deduction free and no install.",
      kicker: "GAMES WITH FRIENDS",
      h1: "Interactive Games to Play with Friends",
      intro: "Bring back the laughter and friendly competition when you hang out with friends. TUSA.game provides a web-first catalog of social games that require no setup and no instructions.",
      body: "Whether chilling on the same couch or calling from different continents, our real-time game engine keeps everyone in sync. Guess each other's secrets, challenge your vocabulary, or bluff your way to victory.",
      stepsTitle: "Get started in 3 steps:",
      steps: [
        "Open a room on TUSA.game and select a game.",
        "Paste the link into your friends' group chat.",
        "Everyone clicks join, selects a color, and enters the lobby."
      ],
      gamesTitle: "Recommended Games for Friends:",
      games: [
        { name: "Codenames", desc: "A team game of word associations. Give one-word clues to guide your team to secret agents." },
        { name: "Bomb Party", desc: "A fast-paced word game. Think of words containing a specific syllable before the bomb explodes." },
        { name: "Spyfall", desc: "Ask clever questions to identify the hidden spy in your location, or bluff if you are the spy." }
      ],
      faqs: [
        { q: "Can we play on a Discord or Zoom call?", a: "Yes! TUSA is optimized for screensharing on Discord, Zoom, or Google Meet." },
        { q: "What devices do we need?", a: "Any device with a browser: iPhones, Androids, iPads, Laptops, or Smart TVs." },
        { q: "Can we switch games easily?", a: "Yes, the host can switch game modes directly in the active party room without creating a new link." }
      ]
    }
  },
  "team-building-games": {
    ru: {
      title: "Игры для тимбилдинга онлайн — Тимбилдинг на удаленке",
      description: "Лучшие корпоративные игры для тимбилдинга онлайн. Сплотите команду на удаленке с помощью веселых викторин на TUSA.game.",
      kicker: "ИГРЫ ДЛЯ ТИМБИЛДИНГА",
      h1: "Онлайн тимбилдинг: сплотите вашу команду",
      intro: "Эффективный тимбилдинг на удаленке должен быть простым и вовлекающим. TUSA.game помогает коллегам общаться неформально и укреплять командный дух без скучных Zoom-презентаций.",
      body: "Наши корпоративные игры созданы для того, чтобы вовлечь каждого сотрудника. Кооперативные словесные игры, веселые викторины на знание фактов и творческие конкурсы снимают стресс и помогают выстроить доверительные отношения в распределенном коллективе.",
      stepsTitle: "Как провести тимбилдинг на TUSA:",
      steps: [
        "Организатор создает комнату и шарит экран в Zoom, Teams или Discord.",
        "Коллеги подключаются по QR-коду со своих смартфонов.",
        "Выберите командную игру (например, Кодовые имена) и разделитесь на группы."
      ],
      gamesTitle: "Игры для сплочения команды:",
      games: [
        { name: "Кодовые имена (Codenames)", desc: "Идеально подходит для тренировки командной логики и взаимопонимания между отделами." },
        { name: "Brain Burst (Битва разумов)", desc: "Командная викторина на скорость. Отвечайте на интересные вопросы быстрее конкурентов." },
        { name: "Blank Slate (Чистый лист)", desc: "Угадывайте мысли коллег. Записывайте слова, которые лучше всего дополняют фразу." }
      ],
      faqs: [
        { q: "Подходит ли это для больших команд?", a: "Да, наши командные игры поддерживают разделение на группы до 20+ человек." },
        { q: "Нужна ли закупка лицензий?", a: "Базовая версия бесплатна, что позволяет проводить короткие разминки (icebreakers) без согласования бюдветов." },
        { q: "Безопасны ли наши данные?", a: "Мы не храним корпоративную информацию и переписки. Все комнаты временные." }
      ]
    },
    en: {
      title: "Virtual Team Building Games Free — Remote Work Icebreakers",
      description: "Boost employee engagement with virtual team building games. Play multiplayer browser games over Zoom/Teams free on TUSA.game.",
      kicker: "TEAM BUILDING GAMES",
      h1: "Virtual Team Building: Connect Your Remote Team",
      intro: "Effective virtual team building must be frictionless and engaging. TUSA.game offers a suite of collaborative games that improve connection without another boring slideshow.",
      body: "Unite your remote or hybrid workforce. Our cooperative word games, fast-paced trivia, and creative brainstorm challenges reduce work stress, align logic, and build real friendships among coworkers.",
      stepsTitle: "How to host a team building game:",
      steps: [
        "Share your screen over Zoom, Microsoft Teams, or Google Meet.",
        "Ask team members to scan the QR code on screen using their phones.",
        "Launch a team-based game like Codenames or a quick trivia battle."
      ],
      gamesTitle: "Recommended Corporate Games:",
      games: [
        { name: "Codenames", desc: "Perfect for training remote team communication, alignment, and logic." },
        { name: "Brain Burst", desc: "A competitive, high-speed quiz game. Great for office trivia or training sessions." },
        { name: "Blank Slate", desc: "A mind-matching word game. Write matching answers with teammates to score points." }
      ],
      faqs: [
        { q: "Is there a limit on corporate participants?", a: "We support large corporate groups of up to 20+ active players in one session." },
        { q: "Is there a guest limit or login requirement?", a: "No login is required for employees. They can enter their names and join in under 10 seconds." },
        { q: "Can we use this for a quick 10-minute meeting warmer?", a: "Yes, many teams use TUSA for quick icebreakers at the start of weekly standups." }
      ]
    }
  },
  "birthday-games": {
    ru: {
      title: "Игры на день рождения для компании — Игры на праздник",
      description: "Веселые интерактивные игры на день рождения для взрослых и детей. Развлеките гостей за праздничным столом с помощью TUSA.game.",
      kicker: "ИГРЫ НА ДЕНЬ РОЖДЕНИЯ",
      h1: "Как развлечь гостей на день рождения: праздничные игры",
      intro: "День рождения — время радости, подарков и веселья. Но как объединить гостей разного возраста за столом? TUSA.game предлагает простые праздничные игры, в которых справится каждый.",
      body: "Устройте веселую битву умов или творческий конкурс. Наши игры не требуют раздачи инвентаря — гости просто достают свои телефоны, подключаются к общему экрану (например, телевизору) и соревнуются за звание самого остроумного гостя.",
      stepsTitle: "Организация игрового праздника:",
      steps: [
        "Подключите ноутбук к телевизору в комнате, где проходит праздник.",
        "Выведите экран TUSA.game на ТВ.",
        "Гости сканируют QR-код со своих мест и начинают играть."
      ],
      gamesTitle: "Праздничные игры на TUSA:",
      games: [
        { name: "Quiplash (Остроумие)", desc: "Пишите смешные ответы на каверзные вопросы. Гости голосуют за самые забавные варианты." },
        { name: "Колесо Судьбы (Wheel of Fate)", desc: "Простой и веселый способ разыграть фанты, тосты или небольшие подарки среди гостей." },
        { name: "Trivia (Викторина)", desc: "Создайте викторину о имениннике или сыграйте в классический квиз на общие темы." }
      ],
      faqs: [
        { q: "Подходит ли игра для детей?", a: "Да, у нас есть семейные наборы вопросов, которые идеально подойдут для детского праздника." },
        { q: "Можно ли играть за праздничным столом?", a: "Да! Смартфон в руках — это все, что нужно. Никаких карточек и кубиков, мешающих посуде." },
        { q: "Сколько гостей может играть?", a: "Платформа легко справляется с компаниями до 20-30 гостей." }
      ]
    },
    en: {
      title: "Birthday Party Games for Large Groups — TUSA.game",
      description: "Keep your birthday guests entertained with fun interactive party games. Play on TV with mobile controllers free on TUSA.game.",
      kicker: "BIRTHDAY PARTY GAMES",
      h1: "Fun Interactive Games for Your Birthday Party",
      intro: "Keep your birthday guests laughing and talking. TUSA.game makes it easy to host high-energy interactive games that bring family and friends together.",
      body: "Turn your living room or party venue into a game show studio. Cast the game board to a TV screen, and let guests write hilarious answers, vote on inside jokes, or compete in custom trivia quizzes using their mobile phones.",
      stepsTitle: "Setup for a birthday game show:",
      steps: [
        "Connect a laptop to the main TV or projector at the venue.",
        "Open a party room on TUSA.game on the big screen.",
        "Guests scan the QR code from their seats and join the lobby."
      ],
      gamesTitle: "Best Birthday Games:",
      games: [
        { name: "Quiplash / Punchline", desc: "Write humorous answers to prompts. Everyone votes on their favorite inside jokes." },
        { name: "Wheel of Fate", desc: "Spin the wheel for random prompts, dares, or giving out party favors." },
        { name: "Trivia Quiz", desc: "A great way to test how well guests know the birthday person with custom questions." }
      ],
      faqs: [
        { q: "Is this suitable for a kid's birthday?", a: "Yes, you can select teen-friendly or family modes to keep the questions clean." },
        { q: "Do we need extra hardware?", a: "Just a screen (TV/Laptop) for the Stage and phones for the players. No controllers needed." },
        { q: "Can guests join late?", a: "Yes, players can join the party room and jump in for the next round at any time." }
      ]
    }
  },
  "online-party-games": {
    ru: {
      title: "Онлайн игры для компании — Играть с друзьями по сети",
      description: "Популярные онлайн игры для компании друзей без скачивания. 32 игровых режима с телефона в браузере бесплатно на TUSA.game.",
      kicker: "ОНЛАЙН ИГРЫ ДЛЯ КОМПАНИИ",
      h1: "Онлайн игры для компании: вечеринка на расстоянии",
      intro: "Расстояние больше не помеха для веселых посиделок. С онлайн-играми от TUSA.game вы можете устроить полноценную игровую вечеринку с друзьями, где бы они ни находились.",
      body: "Все игры адаптированы под мобильные браузеры и работают в реальном времени. Общайтесь в Discord, Zoom или Skype, выводите игровое поле на экран и управляйте процессом со своего смартфона. Интуитивный геймплей гарантирует, что играть смогут даже те, кто далек от видеоигр.",
      stepsTitle: "Как запустить онлайн-игру:",
      steps: [
        "Хост создает комнату на TUSA.game и транслирует экран в голосовой чат.",
        "Участники заходят в игру со своих телефонов по короткой ссылке.",
        "Выбирайте любую игру из списка и начинайте раунд."
      ],
      gamesTitle: "Онлайн игры на нашей платформе:",
      games: [
        { name: "Мафия / Оборотень", desc: "Психологическая дуэль. Обсуждайте, блефуйте и голосуйте против подозреваемых в чате." },
        { name: "Quiplash (Словесный баттл)", desc: "Соревнуйтесь в юморе. Пишите остроумные ответы на общие вопросы на скорость." },
        { name: "Угадай песню (Guess the Song)", desc: "Музыкальный квиз. Слушайте отрывки треков и угадывайте исполнителя быстрее других." }
      ],
      faqs: [
        { q: "Какой голосовой чат лучше использовать?", a: "Платформа работает с любым сервисом: Discord, Zoom, Skype или Telegram." },
        { q: "Будет ли задержка при игре?", a: "Наша система синхронизирована по протоколу SSE, что гарантирует задержку менее 300мс." },
        { q: "Могут ли играть люди из разных стран?", a: "Да, наши серверы оптимизированы для глобального доступа, интерфейс переведен на русский и английский." }
      ]
    },
    en: {
      title: "Online Party Games to Play in Web Browser — TUSA.game",
      description: "Play online party games with friends over video chat. 32 browser-based multiplayer games with no downloads free on TUSA.game.",
      kicker: "ONLINE PARTY GAMES",
      h1: "Play Online Party Games Anywhere in the World",
      intro: "Distance is no longer a barrier to shared fun. Online party games on TUSA.game allow you to host interactive game nights with friends or family, no matter where they are located.",
      body: "All of our games are built for modern browsers and update instantly. Start a video call on Discord, Zoom, or FaceTime, share the game screen, and use your smartphone as a personal controller. It's as simple as clicking a link.",
      stepsTitle: "How to connect from different locations:",
      steps: [
        "Host creates a party room and shares their screen over a video call.",
        "Players open the invite link on their phones to join the room.",
        "Host selects a game, and everyone participates in real-time."
      ],
      gamesTitle: "Popular Online Games:",
      games: [
        { name: "Werewolf / Mafia", desc: "Deduce hidden identities. Chat, accuse, and vote out suspicious players over video." },
        { name: "Quiplash / Punchline", desc: "An anonymous joke-writing competition. Write funny answers and let the group vote." },
        { name: "Guess the Song", desc: "Listen to music clips and guess the song or artist before your friends do." }
      ],
      faqs: [
        { q: "Is there any lag when playing remotely?", a: "No, TUSA uses Server-Sent Events (SSE) to sync all actions instantly under 300ms." },
        { q: "Does everyone need a computer?", a: "Only the host needs a screen to share. Guests can join and play entirely from their smartphones." },
        { q: "Can we play across different time zones?", a: "Yes, our global infrastructure ensures low latency for international players." }
      ]
    }
  },
  "icebreakers": {
    ru: {
      title: "Игры для знакомства в компании — Ледоколы онлайн",
      description: "Веселые и простые игры-ледоколы (icebreakers) для знакомства людей в новой компании. Снимите неловкость онлайн на TUSA.game.",
      kicker: "ИГРЫ ДЛЯ ЗНАКОМСТВА",
      h1: "Игры-ледоколы для новой компании: снимите напряжение",
      intro: "Знакомство в новой компании часто сопровождается неловким молчанием. Игры-ледоколы (icebreakers) помогают быстро вовлечь участников, разговорить их и создать дружескую атмосферу.",
      body: "Наши ледоколы разработаны так, чтобы не требовать сложной подготовки или личных откровений, к которым люди не готовы. Легкие вопросы, забавные ассоциации и быстрые раунды помогут быстро найти общие темы для общения.",
      stepsTitle: "Как провести ледокол:",
      steps: [
        "Создайте лобби и выберите быстрый формат (например, Правда или Дело — легкий уровень).",
        "Раздайте QR-код участникам встречи.",
        "Запустите 5-минутную игровую сессию для поднятия настроения."
      ],
      gamesTitle: "Лучшие ледоколы на TUSA:",
      games: [
        { name: "Я никогда не (Never Have I Ever)", desc: "Помогает найти общие факты биографии и веселые истории участников." },
        { name: "Две правды и ложь (Two Truths and a Lie)", desc: "Классический способ рассказать о себе в игровой форме: угадайте, какой факт выдуман." },
        { name: "Чистый лист (Blank Slate)", desc: "Простая игра на ассоциации, которая быстро настраивает команду на одну волну." }
      ],
      faqs: [
        { q: "Подходят ли эти игры для деловых встреч?", a: "Да, у нас есть нейтральные категории вопросов, которые отлично подходят для бизнес-встреч." },
        { q: "Сколько времени нужно на одну сессию?", a: "Ледокол занимает от 5 до 10 минут, идеально для начала любого мероприятия." },
        { q: "Может ли модератор управлять вопросами?", a: "Да, хост полностью контролирует смену карточек и таймеры." }
      ]
    },
    en: {
      title: "Frictionless Icebreaker Games for Remote Teams — TUSA.game",
      description: "Break the ice in any group with fast interactive icebreaker games. Simple prompts, no login, free on TUSA.game.",
      kicker: "ICEBREAKER GAMES",
      h1: "Icebreaker Games to Warm Up Any Group",
      intro: "Meeting new people or starting a meeting in silence can be awkward. Icebreaker games are designed to get people talking, laughing, and collaborating in minutes.",
      body: "TUSA.game provides light-hearted, quick game formats. They require no rules explanation and no deep personal confessions. Simple word association, trivia, or light truths help your group connect naturally.",
      stepsTitle: "How to run an icebreaker:",
      steps: [
        "Select a quick game mode like Blank Slate or Two Truths & a Lie.",
        "Share the join link or project the QR code on screen.",
        "Run a 5-to-10 minute session before your main event starts."
      ],
      gamesTitle: "Recommended Icebreakers:",
      games: [
        { name: "Never Have I Ever", desc: "A great way to discover funny shared experiences and starting points for conversation." },
        { name: "Two Truths and a Lie", desc: "The ultimate 'get to know you' game. Guess which statement is a lie." },
        { name: "Blank Slate", desc: "Match words with other players to see who thinks alike. High-speed and highly engaging." }
      ],
      faqs: [
        { q: "Can we use these for formal corporate meetings?", a: "Yes, you can choose family/office friendly modes to keep content completely professional." },
        { q: "How long does a typical session take?", a: "Usually 5 to 15 minutes, making them perfect meeting warmers." },
        { q: "Do players need to register?", a: "No, they just type their names and jump in. Zero setup required." }
      ]
    }
  },
  "party-planning": {
    ru: {
      title: "Как организовать вечеринку дома — Чек-лист хоста",
      description: "Практическое руководство по организации идеальной вечеринки дома. Советы по подготовке, чек-листы и игры на TUSA.game.",
      kicker: "КАК ОРГАНИЗОВАТЬ ТУСУ",
      h1: "Пошаговое руководство по планированию вечеринки",
      intro: "Хорошая вечеринка требует планирования, но не должна превращаться в рутину. В этом руководстве мы делимся практическими шагами по созданию идеального праздника без лишнего стресса.",
      body: "Главное правило успешного хоста — минимизировать организационную суету. Наша платформа решает ключевую проблему развлечения гостей: вам не нужно продумывать сценарии, достаточно открыть TUSA.game и позволить интерактивным играм сделать всю работу за вас.",
      stepsTitle: "Чек-лист подготовки к вечеринке:",
      steps: [
        "Составьте список гостей и отправьте им приглашения за неделю.",
        "Продумайте меню: легкие закуски (фингер-фуд) и напитки.",
        "Подготовьте общую зону: настройте музыку и экран для совместных игр."
      ],
      gamesTitle: "Инструменты TUSA для планирования:",
      games: [
        { name: "Чат и RSVP", desc: "Управляйте списком гостей и обсуждайте детали праздника в одном месте." },
        { name: "Список покупок (Shopping List)", desc: "Координируйте закупку еды и напитков вместе с друзьями онлайн." },
        { name: "Игры без подготовки", desc: "32 игровых режима готовы к запуску в любой момент вечеринки." }
      ],
      faqs: [
        { q: "За сколько дней нужно начинать планирование?", a: "Для обычной домашней вечеринки достаточно 3-5 дней подготовки." },
        { q: "Как распределить расходы на еду?", a: "Используйте наш список покупок, где каждый гость может отметить, что он приносит с собой." },
        { q: "Что делать, если гости стесняются?", a: "Включите легкий игровой режим (например, Кто из нас) — он быстро разговорит компанию." }
      ]
    },
    en: {
      title: "How to Plan a Party at Home — Host Checklist & Games",
      description: "Learn how to organize a successful house party. Step-by-step checklists, hosting tips, and games free on TUSA.game.",
      kicker: "HOW TO PLAN A PARTY",
      h1: "The Ultimate Guide to Planning a House Party",
      intro: "Planning a party shouldn't be stressful. This practical guide covers everything from sending invites to keeping guests entertained with zero friction.",
      body: "The golden rule of hosting is to focus on your guests, not logistics. TUSA.game simplifies party management by offering built-in RSVPs, shared shopping lists, and instant games all in one single web room.",
      stepsTitle: "Essential Host Checklist:",
      steps: [
        "Send out your invite links 5-7 days before the gathering.",
        "Coordinate snacks and drinks using a shared shopping list.",
        "Set up a central screen (TV or monitor) for group games."
      ],
      gamesTitle: "Useful TUSA Features for Hosts:",
      games: [
        { name: "Party Room RSVP", desc: "Track who is coming and manage your guest list dynamically." },
        { name: "Collaborative Shopping List", desc: "Let guests sign up to bring snacks, drinks, or ice." },
        { name: "Instant Games Catalog", desc: "Switch between 32 different games to match the room's energy." }
      ],
      faqs: [
        { q: "How can I get guests to participate in games?", a: "Start with a simple, high-visibility game on the TV screen (like Wheel of Fate) to draw attention." },
        { q: "What is the best way to handle food?", a: "A potluck style works best. Use our shared shopping list so guests can claim what they want to bring." },
        { q: "How long should a party last?", a: "A typical house party peaks around 3 to 4 hours. Keep the games dynamic to maintain energy." }
      ]
    }
  },
  "game-night": {
    ru: {
      title: "Как устроить игровой вечер дома — Идеи игротеки",
      description: "Инструкция, как организовать крутой игровой вечер (Game Night) с друзьями. Идеи, форматы и 32 игры на TUSA.game.",
      kicker: "КАК УСТРОИТЬ ИГРОВОЙ ВЕЧЕР",
      h1: "Идеальный игровой вечер: от идеи до запуска",
      intro: "Игровой вечер (Game Night) — отличная альтернатива обычным барам и ресторанам. Рассказываем, как устроить захватывающую игротеку у себя дома с помощью современных технологий.",
      body: "Больше не нужно тратить часы на объяснение сложных правил настольных игр. TUSA.game делает игровой процесс мгновенным: правила объясняются прямо на экране телефона, а подсчет очков происходит автоматически. Смешивайте разные жанры от интеллектуальных викторин до веселых словесных дуэлей.",
      stepsTitle: "Рецепт идеального игрового вечера:",
      steps: [
        "Сделайте уютный свет и подготовьте удобные места для всех гостей перед экраном.",
        "Приготовьте простые закуски, которые не пачкают руки (ведь все будут держать телефоны).",
        "Чередуйте игры: начните со спокойных викторин, перейдите к активным словесным играм."
      ],
      gamesTitle: "Режимы для игрового вечера:",
      games: [
        { name: "Битва Разумов (Quiz)", desc: "Проверьте эрудицию друзей в нашей викторине с вопросами на разные темы." },
        { name: "Quiplash (Остроумие)", desc: "Раунд юмора и сарказма, идеален для разгара вечера." },
        { name: "Шпион (Spyfall)", desc: "Детективная игра на внимательность и умение блефовать." }
      ],
      faqs: [
        { q: "Какое оборудование нужно для Game Night?", a: "Вам понадобится один экран (телевизор, проектор или ноутбук) и смартфоны для всех игроков." },
        { q: "Что делать, если игроки разного уровня?", a: "Выбирайте игры на ассоциации и интуицию (например, Чистый Лист), где не нужны специальные знания." },
        { q: "Как часто стоит проводить такие вечера?", a: "Оптимальный формат — один раз в две недели, чтобы гости успевали соскучиться по играм." }
      ]
    },
    en: {
      title: "How to Host a Game Night at Home — TUSA.game",
      description: "Everything you need to know to host a successful game night. Game night ideas, setups, and 32 browser games free on TUSA.game.",
      kicker: "HOW TO HOST A GAME NIGHT",
      h1: "How to Host the Perfect Game Night",
      intro: "A game night is a great way to bring friends together. We explain how to organize a modern game night using your TV and smartphones with zero friction.",
      body: "Skip the hours of reading complex board game rulebooks. TUSA.game makes gameplay instant: instructions are shown on screen, and scoring is fully automated. You can switch from word association to trivia in a single tap.",
      stepsTitle: "Game Night Setup Checklist:",
      steps: [
        "Create comfortable seating facing a central TV or monitor.",
        "Prepare snacks that aren't messy (since everyone will be holding their phones).",
        "Start with a light game to warm up, then move into competitive modes."
      ],
      gamesTitle: "Top Game Night Formats:",
      games: [
        { name: "Brain Burst", desc: "A general knowledge quiz that tests speed and accuracy." },
        { name: "Quiplash / Punchline", desc: "A humor-focused battle of wits, perfect for the peak of the night." },
        { name: "Spyfall", desc: "A deduction game where players ask questions to unmask a hidden spy." }
      ],
      faqs: [
        { q: "Do we need physical board games?", a: "No, TUSA replaces physical cards, dice, and boards with digital screens, keeping your table clean." },
        { q: "What if some guests are not gamers?", a: "Choose social games (like Would You Rather) that focus on conversation rather than game mechanics." },
        { q: "Can we play on a tablet?", a: "Yes, if a TV is not available, a tablet or laptop screen makes a perfect central Stage." }
      ]
    }
  },
  "party-invite": {
    ru: {
      title: "Как оригинально пригласить друзей на тусу — Шаблоны",
      description: "Способы оригинально позвать друзей на вечеринку или игровой вечер. Создайте красивую ссылку-приглашение на TUSA.game.",
      kicker: "КАК ПРИГЛАСИТЬ ДРУЗЕЙ",
      h1: "Как пригласить друзей на вечеринку: оригинальные идеи",
      intro: "Обычное сообщение «приходи в субботу» часто теряется в переписках. Красивое интерактивное приглашение повышает шансы на то, что соберутся все ваши друзья.",
      body: "TUSA.game позволяет создать полноценное цифровое пространство для вашей тусы. Гости увидят красивую страницу с датой, временем, списком участников и возможностью сразу подтвердить свое участие (RSVP). Больше никаких уточняющих вопросов в чатах.",
      stepsTitle: "Как создать стильное приглашение:",
      steps: [
        "Зайдите на TUSA.game и создайте комнату вашей будущей тусовки.",
        "Укажите название встречи, дату, время и описание.",
        "Скопируйте ссылку-инвайт и отправьте ее друзьям в мессенджер."
      ],
      gamesTitle: "Что гости увидят в приглашении:",
      games: [
        { name: "Кнопка RSVP", desc: "Возможность в один клик подтвердить присутствие («Иду» / «Не иду»)." },
        { name: "Счетчик гостей", desc: "Список тех, кто уже принял приглашение — создает приятное предвкушение." },
        { name: "Игровой тизер", desc: "Список игр, в которые вы планируете сыграть во время вечера." }
      ],
      faqs: [
        { q: "Можно ли изменить время тусы после отправки?", a: "Да, хост может отредактировать детали встречи в любой момент, информация обновится у всех." },
        { q: "Нужно ли гостям платить за вход?", a: "Нет, переход по ссылке и подтверждение участия абсолютно бесплатны." },
        { q: "Придет ли напоминание гостям?", a: "Да, страница тусы сохраняется в закладках телефона, а гости могут сверяться со временем встречи." }
      ]
    },
    en: {
      title: "How to Invite Friends to a Party — Creative Invite Links",
      description: "Create interactive invite links for your next gathering. Manage RSVPs, coordinates, and details free on TUSA.game.",
      kicker: "HOW TO INVITE FRIENDS",
      h1: "How to Invite Friends and Get Instant RSVPs",
      intro: "Ditch the boring group texts. A beautiful, interactive invite link builds excitement and helps you confirm guest numbers instantly.",
      body: "TUSA.game lets you generate a dedicated web space for your party. Send a clean, branded link where guests can view party details, RSVP with a tap, and see who else is coming. No apps required, just a single click.",
      stepsTitle: "How to send a smart invite:",
      steps: [
        "Create a new party room on TUSA.game.",
        "Fill in the party title, date, time, and optional host notes.",
        "Copy the unique invite link and share it in your group chat."
      ],
      gamesTitle: "Interactive Invite Features:",
      games: [
        { name: "Tap-to-RSVP", desc: "Guests can instantly mark themselves as attending, busy, or tentative." },
        { name: "Live Guest Count", desc: "Shows everyone who is confirmed to attend, building anticipation." },
        { name: "Party Board", desc: "A place for guests to check updates, chat, and coordinate beforehand." }
      ],
      faqs: [
        { q: "Can I update the time after sending the link?", a: "Yes, editing the party details instantly updates the page for all invitees." },
        { q: "Is guest signup required to RSVP?", a: "No, guests can RSVP using a guest session nickname in 5 seconds." },
        { q: "Does the invite link work on mobile?", a: "Yes, the landing page is fully optimized for mobile viewports and instant loading." }
      ]
    }
  }
};
