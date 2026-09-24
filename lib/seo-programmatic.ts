import { SeoPageContent } from "./seo-content";

export const PROGRAMMATIC_SLUGS = [
  "for-2-players",
  "for-3-players",
  "for-4-players",
  "for-5-players",
  "for-6-players",
  "for-7-players",
  "for-8-players",
  "for-10-players",
  "for-12-players",
  "for-families",
  "for-teams",
  "for-college",
  "for-adults",
  "for-kids",
  "for-couples",
  "for-birthday",
  "for-weddings",
  "for-remote-teams",
  "for-classroom",
  "no-props",
  "no-app",
  "free-alternatives-to-jackbox",
  "quick-5-minute",
  "drinking"
] as const;

export const SEO_PROGRAMMATIC: Record<string, { ru: SeoPageContent; en: SeoPageContent }> = {
  "for-2-players": {
    ru: {
      title: "Игры на двоих на телефоне онлайн · TUSA.game",
      description: "Лучшие игры на двоих с одного телефона или по сети. Быстрые викторины, психологические словесные дуэли онлайн без скачивания.",
      kicker: "ИГРЫ НА ДВОИХ",
      h1: "Игры на двоих: во что поиграть вдвоем",
      intro: "Ищете интересные игры для двоих на одном телефоне или онлайн? TUSA.game предлагает захватывающие режимы для дуэлей, которые идеально скрасят вечер.",
      body: "Больше никаких сложных правил и долгих подготовок. Выбирайте викторины на знание друг друга, проверяйте эрудицию или испытывайте интуицию. Играйте дома, в дороге или во время ожидания в очереди: вам нужны только ваши смартфоны.",
      stepsTitle: "Как начать игру для двоих:",
      steps: [
        "Создайте приватную комнату на TUSA.game.",
        "Поделитесь ссылкой со вторым игроком или отсканируйте QR-код.",
        "Запустите дуэльный режим и начните соревнование."
      ],
      gamesTitle: "Рекомендуемые игры на двоих:",
      games: [
        { name: "Викторина (Trivia)", desc: "Соревнуйтесь в эрудиции и скорости ответов на интересные темы." },
        { name: "Would You Rather (Что бы ты выбрал)", desc: "Отличный способ узнать мнение друг друга на сложные и смешные дилеммы." },
        { name: "Колесо Судьбы (Wheel of Fate)", desc: "Используйте для случайного распределения задач, желаний или веселых фантов." }
      ],
      faqs: [
        { q: "Можно ли играть с одного телефона?", a: "Да, некоторые словесные режимы отлично подходят для игры по очереди, но удобнее играть, когда у каждого свой телефон." },
        { q: "Нужна ли регистрация?", a: "Нет, вы можете войти как гости и начать игру моментально." },
        { q: "Работает ли игра на iPhone и Android?", a: "Да, TUSA полностью совместима со всеми мобильными браузерами." }
      ]
    },
    en: {
      title: "2 Player Party Games Online · Play on Mobile | TUSA.game",
      description: "Best 2 player games to play with friends online or on one phone. Try fast trivia and word duels free in your web browser.",
      kicker: "2 PLAYER GAMES",
      h1: "Fun and Interactive Games for 2 Players",
      intro: "Looking for engaging 2 player games online or on a single screen? TUSA.game features quick, interactive duels that are perfect for couples or friends.",
      body: "Skip the complicated setups. Choose relationship trivia, test your general knowledge, or spin for random challenges. All modes are lightweight, fast, and optimized for mobile devices.",
      stepsTitle: "How to play a 2 player game:",
      steps: [
        "Open TUSA.game and create a room.",
        "Let the second player scan the QR code to join.",
        "Choose a 2-player friendly game and start the match."
      ],
      gamesTitle: "Recommended 2 Player Games:",
      games: [
        { name: "Trivia Quiz", desc: "Challenge each other in a battle of speed and general knowledge." },
        { name: "Would You Rather", desc: "Learn more about your friend's choices by debating absurd scenarios." },
        { name: "Wheel of Fate", desc: "A simple tool to assign tasks, pick dare options, or make random decisions." }
      ],
      faqs: [
        { q: "Can we play on a single phone?", a: "Some turn-based games can be shared, but having separate phones creates the best real-time experience." },
        { q: "Do we need an account to play?", a: "No account is required. Simply enter a nickname and start playing." },
        { q: "Is it compatible with mobile Safari/Chrome?", a: "Yes, the platform is fully optimized for iOS and Android web browsers." }
      ]
    }
  },
  "for-3-players": {
    ru: {
      title: "Игры на троих для компании онлайн · TUSA.game",
      description: "Интересные онлайн игры на троих человек. Словесные баттлы, шпионские игры и викторины без скачивания на TUSA.game.",
      kicker: "ИГРЫ НА ТРОИХ",
      h1: "Во что поиграть втроем: лучшие варианты",
      intro: "Игры на троих: отличный способ провести время в небольшой компании друзей. На TUSA.game собраны интерактивные режимы, которые идеально подходят для трех участников.",
      body: "Маленькие группы часто сталкиваются с нехваткой подходящих настолок. Наша платформа предлагает веселые словесные игры и викторины, где каждый игрок вовлечен в процесс каждую секунду.",
      stepsTitle: "Запуск игры на троих:",
      steps: [
        "Хост создает комнату и делится ссылкой в чате.",
        "Все трое участников заходят со своих телефонов.",
        "Выберите режим и наслаждайтесь игрой."
      ],
      gamesTitle: "Подходящие игры на троих:",
      games: [
        { name: "Шпион (Spyfall)", desc: "Тайный шпион пытается угадать локацию, пока двое других задают вопросы." },
        { name: "Бомб Пати (Bomb Party)", desc: "Называйте слова по очереди. Скорость и память: ваши главные помощники." },
        { name: "Карты Хаоса (Cards of Chaos)", desc: "Смешное соревнование ответов, где один судит, а двое других придумывают шутки." }
      ],
      faqs: [
        { q: "Будет ли весело играть втроем?", a: "Да! Такие игры как Шпион и Бомб Пати раскрываются в небольших компаниях даже лучше, так как ход переходит быстрее." },
        { q: "Нужно ли платить за игроков?", a: "Все игры полностью бесплатны для любого количества участников." },
        { q: "Можно ли играть с компьютера?", a: "Вы можете использовать компьютер как общий экран (Stage), а телефоны как геймпады." }
      ]
    },
    en: {
      title: "3 Player Party Games Online · Group Browser Games | TUSA.game",
      description: "Best browser games for 3 players. Play fun word games, deduction, and trivia with friends on phone free on TUSA.game.",
      kicker: "3 PLAYER GAMES",
      h1: "Best Party Games for 3 Players",
      intro: "Looking for games that work well with exactly three players? TUSA.game provides interactive modes optimized for small friend circles.",
      body: "Small groups don't have to miss out on multiplayer excitement. Our games keep all three participants engaged simultaneously, eliminating waiting times.",
      stepsTitle: "How to host a 3-player game:",
      steps: [
        "Create a party room on TUSA.game.",
        "Share the join link with the other two players.",
        "Pick a game and start the lobby."
      ],
      gamesTitle: "Best Games for 3 Players:",
      games: [
        { name: "Spyfall", desc: "Ask questions to unmask the spy, while the spy tries to figure out the secret location." },
        { name: "Bomb Party", desc: "Think fast and name words containing specific syllables before the bomb goes off." },
        { name: "Cards of Chaos", desc: "A hilarious caption writing contest where one player judges the other two." }
      ],
      faqs: [
        { q: "Is 3 players enough for these games?", a: "Yes, modes like Spyfall and Bomb Party are highly dynamic and fun with exactly three players." },
        { q: "Can we play remotely?", a: "Yes, just jump on a voice call and play together in real-time." },
        { q: "Is there any install needed?", a: "No, all players join instantly via their web browser." }
      ]
    }
  },
  "for-4-players": {
    ru: {
      title: "Игры на четверых для компании онлайн · TUSA.game",
      description: "Веселые игры на четверых человек на вечеринку. Сыграйте в Алиас, Кодовые имена и Шпиона онлайн без скачивания на TUSA.game.",
      kicker: "ИГРЫ НА ЧЕТВЕРЫХ",
      h1: "Игры на 4 игрока: развлечение для идеальной компании",
      intro: "Четыре человека: классический состав для большинства настольных и командных игр. TUSA.game предлагает лучшие цифровые версии любимых игр для вашей компании.",
      body: "Разделитесь на две команды по два человека или играйте каждый сам за себя. Наша платформа синхронизирует действия всех участников, превращая вечер в настоящее интеллектуальное шоу.",
      stepsTitle: "Как запустить игру на 4 человека:",
      steps: [
        "Создайте комнату и выберите игру для команд (например, Codenames).",
        "Отправьте инвайт троим друзьям.",
        "Разделитесь на команды и начните противостояние."
      ],
      gamesTitle: "Игры, идеальные для четверых:",
      games: [
        { name: "Кодовые имена (Codenames)", desc: "Классический формат 2 на 2. Объединяйте слова ассоциациями для своей команды." },
        { name: "Алиас (Alias)", desc: "Объясняйте слова своему партнеру на скорость. Побеждает самая слаженная пара." },
        { name: "Шпион (Spyfall)", desc: "Психологический детектив на четверых: один шпион и трое местных жителей." }
      ],
      faqs: [
        { q: "Можно ли играть командами?", a: "Да, большинство игр на TUSA автоматически поддерживают разделение на команды." },
        { q: "Сколько длится раунд?", a: "Обычно от 5 до 10 минут, что позволяет сыграть много реваншей." },
        { q: "Нужны ли личные кабинеты?", a: "Нет, вход свободный без создания аккаунта." }
      ]
    },
    en: {
      title: "4 Player Party Games Online · Play with Friends | TUSA.game",
      description: "Discover the best 4 player party games. Play Codenames, Alias, and deduction games on mobile free and no install on TUSA.game.",
      kicker: "4 PLAYER GAMES",
      h1: "Best Party Games for 4 Players",
      intro: "Four players is the golden number for team battles and party board games. TUSA.game brings classic social formats straight to your phone screens.",
      body: "Split into 2v2 teams or play a free-for-all deduction match. Our games update instantly, making them perfect for double dates or hanging out with friends.",
      stepsTitle: "How to set up a 4-player game night:",
      steps: [
        "Launch a party room on TUSA.game.",
        "Send the invite URL to your three friends.",
        "Select Codenames or Alias, split into teams, and start."
      ],
      gamesTitle: "Top Games for 4 Players:",
      games: [
        { name: "Codenames", desc: "A brilliant 2v2 word association game. Connect words with single-word clues." },
        { name: "Alias / Word Blast", desc: "Describe words to your teammate. The fastest team to guess the list wins." },
        { name: "Spyfall", desc: "A classic social deduction scenario. Spot the spy through clever interrogation." }
      ],
      faqs: [
        { q: "Can we play 2v2?", a: "Yes, our team modes are specifically structured for balanced 2v2 matchups." },
        { q: "Do we need a tablet to display the board?", a: "You can cast the game to a TV or laptop screen, or simply view the board on your phones." },
        { q: "Are all 32 games available for 4 players?", a: "Yes, almost all game modes on TUSA are optimized for 4 players." }
      ]
    }
  },
  "for-5-players": {
    ru: {
      title: "Игры на пятерых для компании онлайн · TUSA.game",
      description: "Лучшие игры на 5 человек на вечеринку. Мафия, Шпион, Викторины и психологические игры онлайн без скачивания на TUSA.game.",
      kicker: "ИГРЫ НА ПЯТЕРЫХ",
      h1: "Игры на 5 человек: веселье в нечетной компании",
      intro: "Компания из пяти человек часто сталкивается с проблемой разделения на команды. TUSA.game предлагает игры, где нечетное количество игроков не мешает всеобщему веселью.",
      body: "Играйте в психологические игры с тайными ролями, где один против всех, или соревнуйтесь в викторинах каждый сам за себя. Наши игры гарантируют высокую динамику без ожидания своей очереди.",
      stepsTitle: "Как начать игру впятером:",
      steps: [
        "Создайте комнату тусы и разошлите инвайты.",
        "Подключите все 5 телефонов к сессии.",
        "Выберите Шпиона или Мафию и начните раунд."
      ],
      gamesTitle: "Лучшие игры на 5 игроков:",
      games: [
        { name: "Шпион (Spyfall)", desc: "Один шпион пытается обхитрить четверых игроков, задавая каверзные вопросы." },
        { name: "Я никогда не (Never Have I Ever)", desc: "Отличный формат на пятерых, чтобы узнать забавные факты друг о друге." },
        { name: "Would You Rather (Выбор)", desc: "Голосуйте за безумные сценарии и спорьте о результатах." }
      ],
      faqs: [
        { q: "Хорошо ли играть нечетным составом?", a: "Да! Психологические игры и викторины идеально сбалансированы для нечетного числа участников." },
        { q: "Нужно ли скачивать приложение?", a: "Нет, игра запускается в браузере за 5 секунд." },
        { q: "Можно ли играть с детьми?", a: "Да, выбирайте семейный режим в настройках комнаты." }
      ]
    },
    en: {
      title: "5 Player Party Games Online · Play on Mobile | TUSA.game",
      description: "Best party games for 5 players. Play deduction, trivia, and word games with friends in browser free and no install.",
      kicker: "5 PLAYER GAMES",
      h1: "Best Party Games for 5 Players",
      intro: "Hanging out in a group of five? TUSA.game offers social games that work perfectly with odd numbers, keeping everyone engaged.",
      body: "Play social deduction games with hidden roles, or compete in free-for-all trivia. There are no long waiting times, and everyone stays actively involved in every turn.",
      stepsTitle: "How to start a 5-player session:",
      steps: [
        "Open a private party room on TUSA.game.",
        "Share the join link with the other 4 players.",
        "Pick a deduction game like Spyfall and launch the lobby."
      ],
      gamesTitle: "Recommended 5 Player Games:",
      games: [
        { name: "Spyfall", desc: "One spy bluffs against four locals. Ideal setup for a 5-player group." },
        { name: "Never Have I Ever", desc: "Learn funny and embarrassing facts about your friends." },
        { name: "Would You Rather", desc: "Cast votes on ridiculous dilemmas and debate the outcomes." }
      ],
      faqs: [
        { q: "Do these games work well with 5 players?", a: "Yes, social deduction and voting games are highly engaging and balanced with five players." },
        { q: "Is it free for all 5 participants?", a: "Yes, completely free with no limits on session length." },
        { q: "Can we play on tablets or laptops?", a: "Yes, any device with a modern browser is supported." }
      ]
    }
  },
  "for-6-players": {
    ru: {
      title: "Игры на шестерых для компании онлайн · TUSA.game",
      description: "Лучшие игры на 6 человек на вечеринку. Мафия, Алиас, Кодовые имена и психологические игры онлайн без скачивания на TUSA.game.",
      kicker: "ИГРЫ НА ШЕСТЕРЫХ",
      h1: "Игры на 6 игроков: командные баттлы и мафия",
      intro: "Компания из шести человек: идеальный размер для захватывающих командных соревнований 3 на 3 или классических игр с тайными ролями.",
      body: "TUSA.game превращает ваш вечер в интерактивное шоу. Объясняйте слова, вычисляйте предателей или соревнуйтесь в юморе. Все участники управляют игрой со своих телефонов в реальном времени.",
      stepsTitle: "Организация игры на шестерых:",
      steps: [
        "Создайте комнату тусы и покажите QR-код на экране.",
        "Все 6 участников сканируют код своими телефонами.",
        "Разделитесь на команды по 3 человека и выберите игру."
      ],
      gamesTitle: "Лучшие игры на 6 игроков:",
      games: [
        { name: "Кодовые имена (Codenames)", desc: "Классический формат 3 на 3. Угадывайте слова по ассоциациям капитанов." },
        { name: "Мафия / Оборотень", desc: "Отличный баланс ролей для 6 игроков: шериф, доктор, мафия и мирные жители." },
        { name: "Алиас (Alias)", desc: "Словесный баттл команд на скорость и взаимопонимание." }
      ],
      faqs: [
        { q: "Как делиться на команды?", a: "Игры автоматически предложат разделиться на сбалансированные команды перед началом." },
        { q: "Можно ли играть на телевизоре?", a: "Да, выведите Stage на экран ТВ через Smart TV или кабель, так играть удобнее всего." },
        { q: "Это бесплатно?", a: "Да, абсолютно бесплатно для всех 6 игроков." }
      ]
    },
    en: {
      title: "6 Player Party Games Online · Play on Mobile | TUSA.game",
      description: "Discover the best party games for 6 players. Play Codenames, Werewolf, and Alias in browser free with no download.",
      kicker: "6 PLAYER GAMES",
      h1: "Best Party Games for 6 Players",
      intro: "A group of six is the perfect size for intense 3v3 team matchups or suspenseful social deduction rounds.",
      body: "TUSA.game transforms your screen into an interactive game show. Describe words, expose werewolves, or write funny prompts with instant mobile inputs.",
      stepsTitle: "How to set up a 6-player match:",
      steps: [
        "Launch a party room on TUSA.game.",
        "Have all 6 players scan the QR code on screen.",
        "Select a team game like Codenames, split 3v3, and start."
      ],
      gamesTitle: "Top Games for 6 Players:",
      games: [
        { name: "Codenames", desc: "A thrilling 3v3 association game. Guess secret words based on captain's clues." },
        { name: "Werewolf", desc: "The ultimate social deduction setup. Perfect role balance for 6 players." },
        { name: "Alias / Word Blast", desc: "High-speed word description. Describe synonyms to your team to score points." }
      ],
      faqs: [
        { q: "Is it easy to divide into teams?", a: "Yes, the lobby allows players to join Red or Blue teams with one tap." },
        { q: "Can we use a TV as the main board?", a: "We highly recommend casting the Stage to a TV screen for the best experience." },
        { q: "Do all 6 players need accounts?", a: "No, guests join as anonymous players instantly." }
      ]
    }
  },
  "for-7-players": {
    ru: {
      title: "Игры на семерых для компании онлайн · TUSA.game",
      description: "Веселые игры на 7 человек на вечеринку. Мафия, Викторины, Шпион и словесные игры онлайн без скачивания на TUSA.game.",
      kicker: "ИГРЫ НА СЕМЕРЫХ",
      h1: "Игры на 7 человек: психологические дуэли и смех",
      intro: "Компания из 7 человек идеально подходит для игр на социальную дедукцию и веселых разговорных викторин. Устройте незабываемый вечер с TUSA.game.",
      body: "В больших компаниях важно, чтобы никто не скучал. Наши игры задействуют каждого участника: пока одни пишут ответы, другие голосуют, создавая непрерывный поток веселья.",
      stepsTitle: "Как начать игру на 7 человек:",
      steps: [
        "Создайте приватную комнату и разошлите инвайты.",
        "Убедитесь, что все 7 игроков подключились.",
        "Запустите Мафию или Quiplash и начните раунд."
      ],
      gamesTitle: "Рекомендуемые игры на 7 игроков:",
      games: [
        { name: "Мафия / Оборотень", desc: "Интриги и расследования. Семь игроков: отличный состав для психологической дуэли." },
        { name: "Quiplash (Остроумие)", desc: "Соревнуйтесь в написании самых смешных ответов на каверзные вопросы." },
        { name: "Я никогда не (Never Have I Ever)", desc: "Разговорный ледокол для раскрытия забавных секретов друзей." }
      ],
      faqs: [
        { q: "Будет ли задержка при 7 игроках?", a: "Нет, наша технология синхронизации работает мгновенно даже при 20+ игроках." },
        { q: "Можно ли играть с детьми?", a: "Да, у нас есть семейный режим с цензурой вопросов." },
        { q: "Нужно ли регистрироваться?", a: "Нет, регистрация не требуется." }
      ]
    },
    en: {
      title: "7 Player Party Games Online · Play on Mobile | TUSA.game",
      description: "Play fun party games for 7 players online. Enjoy Werewolf, Quiplash, and trivia with friends free in browser.",
      kicker: "7 PLAYER GAMES",
      h1: "Best Party Games for 7 Players",
      intro: "A group of seven is prime territory for social deduction intrigue and high-energy voting games.",
      body: "TUSA.game keeps everyone involved. While some players write responses, others vote in real-time, ensuring zero downtime and continuous laughter.",
      stepsTitle: "How to host a 7-player game:",
      steps: [
        "Create a party room on TUSA.game.",
        "Share the join link with all 6 guests.",
        "Choose Quiplash or Werewolf and launch the round."
      ],
      gamesTitle: "Top Games for 7 Players:",
      games: [
        { name: "Werewolf", desc: "A classic deduction game. Seven players provide a highly balanced village setup." },
        { name: "Quiplash / Punchline", desc: "Write funny responses to prompts. The rest of the group votes on the winner." },
        { name: "Never Have I Ever", desc: "An excellent conversation starter to reveal funny stories about your friends." }
      ],
      faqs: [
        { q: "Is 7 players too many for browser games?", a: "No, our real-time engine easily supports up to 20+ concurrent players." },
        { q: "Can we play on a Smart TV?", a: "Yes, opening TUSA on a TV browser makes a perfect common game board." },
        { q: "Are the games free?", a: "Yes, all game modes are free with no limits." }
      ]
    }
  },
  "for-8-players": {
    ru: {
      title: "Игры на восьмерых для компании онлайн · TUSA.game",
      description: "Лучшие игры на 8 человек на вечеринку. Мафия, Алиас, Кодовые имена и психологические игры онлайн без скачивания на TUSA.game.",
      kicker: "ИГРЫ НА ВОСЬМЕРЫХ",
      h1: "Игры на 8 игроков: масштабные командные сражения",
      intro: "Компания из восьми человек позволяет развернуть масштабные командные сражения 4 на 4 или сыграть в классическую мафию с множеством ролей.",
      body: "TUSA.game объединяет всех гостей за одним экраном. Управляйте персонажами, пишите ассоциации или вычисляйте предателей прямо со своих телефонов.",
      stepsTitle: "Организация игры на 8 человек:",
      steps: [
        "Создайте комнату и покажите QR-код на экране ТВ.",
        "Все 8 участников подключаются со своих смартфонов.",
        "Выберите командный режим (например, Codenames) и начните баттл."
      ],
      gamesTitle: "Лучшие игры на 8 игроков:",
      games: [
        { name: "Кодовые имена (Codenames)", desc: "Идеальный формат 4 на 4. Напряженное интеллектуальное противостояние." },
        { name: "Мафия / Оборотень", desc: "Полноценный состав ролей: мафия, дон, шериф, доктор, мирные жители." },
        { name: "Алиас (Alias)", desc: "Командная игра на объяснение слов на скорость. Идеально для большой компании." }
      ],
      faqs: [
        { q: "Как распределяются роли в Мафии?", a: "Сервер раздает роли каждому игроку приватно на экран смартфона перед началом игры." },
        { q: "Можно ли играть удаленно?", a: "Да, запустите созвон в Discord/Zoom и начните игру по сети." },
        { q: "Все ли игры поддерживают 8 игроков?", a: "Да, большинство режимов на TUSA созданы для групп до 12+ человек." }
      ]
    },
    en: {
      title: "8 Player Party Games Online · Play on Mobile | TUSA.game",
      description: "Best party games for 8 players. Play Codenames, Werewolf, and team word games in browser free and no install.",
      kicker: "8 PLAYER GAMES",
      h1: "Best Party Games for 8 Players",
      intro: "Eight players is the perfect setup for large-scale 4v4 team battles or full-role social deduction games.",
      body: "TUSA.game keeps the party alive. Cast the board to a TV screen, split into teams, and use your phones to vote, type, and guess in real-time.",
      stepsTitle: "How to set up an 8-player game night:",
      steps: [
        "Launch a party room on TUSA.game.",
        "Let all 8 players scan the QR code to join.",
        "Choose Codenames, split 4v4, and start the round."
      ],
      gamesTitle: "Top Games for 8 Players:",
      games: [
        { name: "Codenames", desc: "The ultimate 4v4 experience. Connect secret agent cards with smart clues." },
        { name: "Werewolf", desc: "A suspenseful deduction game with a full lineup of village and wolf roles." },
        { name: "Alias / Word Blast", desc: "Explain words to your team under time pressure. High energy for 8 players." }
      ],
      faqs: [
        { q: "How are secret roles distributed?", a: "The server assigns roles privately to each player's mobile controller screen." },
        { q: "Can we play over a video call?", a: "Yes, simply share the Stage screen on Zoom or Discord and play." },
        { q: "Are these games free for 8 players?", a: "Yes, completely free with no guest charges." }
      ]
    }
  },
  "for-10-players": {
    ru: {
      title: "Игры на 10 человек для компании онлайн · TUSA.game",
      description: "Лучшие игры на большую компанию из 10 человек. Сыграйте в Мафию, Кодовые имена и Quiplash онлайн на TUSA.game.",
      kicker: "ИГРЫ НА 10 ЧЕЛОВЕК",
      h1: "Игры на 10 игроков: масштабное веселье",
      intro: "Собрать 10 человек вместе – хороший повод для большой игровой вечеринки. TUSA.game предлагает форматы, разработанные специально для больших компаний.",
      body: "Когда гостей много, классические настолки не справляются. Наша платформа позволяет всем 10 участникам играть одновременно со своих телефонов, выводя общие результаты на один экран.",
      stepsTitle: "Как запустить игру на 10 человек:",
      steps: [
        "Создайте комнату тусы и выведите её на телевизор.",
        "Попросите всех 10 гостей подключиться по ссылке.",
        "Выберите игру (например, Quiplash) и начните веселье."
      ],
      gamesTitle: "Игры для большой компании:",
      games: [
        { name: "Quiplash (Словесный баттл)", desc: "Соревнуйтесь в остроумии. Вся компания голосует за самые смешные ответы." },
        { name: "Мафия / Оборотень", desc: "Классический формат психологической игры, идеален для 10 участников." },
        { name: "Кодовые имена (Codenames)", desc: "Командная битва 5 на 5 на логику и взаимопонимание." }
      ],
      faqs: [
        { q: "Будет ли удобно 10 игрокам?", a: "Да. У каждого игрока есть личный контроллер, а общая сессия хранит последнее состояние для восстановления после переподключения." },
        { q: "Нужно ли покупать платные наборы?", a: "Все основные игры и режимы для больших компаний полностью бесплатны." },
        { q: "Можно ли играть со смартфона?", a: "Да, каждый игрок использует свой смартфон в качестве геймпада." }
      ]
    },
    en: {
      title: "10 Player Party Games Online · Large Group Games | TUSA.game",
      description: "Discover the best party games for 10 players. Play Werewolf, Codenames, and Quiplash free in web browser on TUSA.game.",
      kicker: "10 PLAYER GAMES",
      h1: "Best Party Games for 10 Players",
      intro: "Gathering ten people? TUSA.game makes it easy to host large-group game shows where everyone participates simultaneously.",
      body: "Forget about turn-waiting or pass-the-device games. Our real-time web platform allows all 10 players to submit, vote, and accuse from their own smartphones.",
      stepsTitle: "How to set up a 10-player game show:",
      steps: [
        "Connect a computer to a TV and open TUSA.game.",
        "Have all 10 guests scan the QR code to join the lobby.",
        "Select Quiplash or Codenames and start the show."
      ],
      gamesTitle: "Recommended Games for 10 Players:",
      games: [
        { name: "Quiplash / Punchline", desc: "A hilarious battle of jokes. Everyone votes on the funniest answers." },
        { name: "Werewolf", desc: "Suspenseful social deduction. Ten players provide a highly balanced game setup." },
        { name: "Codenames", desc: "A massive 5v5 team association match. Perfect for group synergy." }
      ],
      faqs: [
        { q: "Can 10 players stay in the same session?", a: "Yes. Each player uses a personal controller while the shared session keeps the latest saved state available after a reconnect." },
        { q: "Do guests need to sign up?", a: "No, guests join instantly with a nickname. No registration required." },
        { q: "Can we play on a Zoom call?", a: "Yes, simply share the Stage screen and play remotely." }
      ]
    }
  },
  "for-12-players": {
    ru: {
      title: "Игры на 12 человек для компании онлайн · TUSA.game",
      description: "Лучшие игры на большую компанию из 12 человек. Сыграйте в Мафию, Алиас и Quiplash онлайн без скачивания на TUSA.game.",
      kicker: "ИГРЫ НА 12 ЧЕЛОВЕК",
      h1: "Игры на 12 игроков: масштабные вечеринки",
      intro: "Организовать 12 человек за игровым столом непросто. TUSA.game решает её, превращая смартфоны гостей в геймпады, а ТВ в игровое поле.",
      body: "Вам не понадобятся карточки, карандаши и кубики. Выбирайте психологические игры, командные викторины или творческие конкурсы. Все результаты подсчитываются автоматически.",
      stepsTitle: "Организация игры на 12 человек:",
      steps: [
        "Выведите экран TUSA.game на телевизор или проектор.",
        "Попросите всех 12 гостей подключиться со своих телефонов.",
        "Выберите командную игру и начните раунд."
      ],
      gamesTitle: "Игры для 12 участников на TUSA:",
      games: [
        { name: "Мафия / Оборотень", desc: "Полноценный детектив с большим количеством ролей для 12 человек." },
        { name: "Алиас (Alias)", desc: "Командная битва на скорость объяснения слов. Идеально для больших групп." },
        { name: "Quiplash (Словесный баттл)", desc: "Соревнование в остроумии, где вся компания выбирает лучшие шутки." }
      ],
      faqs: [
        { q: "Как гости подключаются?", a: "Достаточно отсканировать QR-код на экране телевизора камерой телефона." },
        { q: "Нужно ли платить за 12 человек?", a: "Нет, создание комнат и базовые игры бесплатны без ограничений по игрокам." },
        { q: "Подходят ли игры для вечеринки?", a: "Да, наши форматы разработаны специально для праздничной атмосферы." }
      ]
    },
    en: {
      title: "12 Player Party Games Online · Large Group Games | TUSA.game",
      description: "Play fun browser games for 12 players. Enjoy Werewolf, Alias, and Quiplash with friends free and no install on TUSA.game.",
      kicker: "12 PLAYER GAMES",
      h1: "Best Party Games for 12 Players",
      intro: "Managing twelve people during a game night can be chaotic. TUSA.game solves this by turning smartphones into controllers and a TV into a game show board.",
      body: "No cards, pencils, or dice required. Choose social deduction, team word association, or creative voting games. The platform automatically tracks scores and manages turns.",
      stepsTitle: "How to host a 12-player game night:",
      steps: [
        "Open TUSA.game on a TV or projector screen.",
        "Have all 12 guests scan the QR code to join the lobby.",
        "Select Werewolf or Quiplash and start the game."
      ],
      gamesTitle: "Top Games for 12 Players:",
      games: [
        { name: "Werewolf", desc: "The ultimate social deduction setup. Twelve players support a deep roster of roles." },
        { name: "Alias / Word Blast", desc: "A high-energy team word game. Fast rounds keep everyone engaged." },
        { name: "Quiplash / Punchline", desc: "Write funny answers to prompts. The whole group votes on the funniest jokes." }
      ],
      faqs: [
        { q: "Do all 12 players need a smartphone?", a: "Yes, each player uses their own mobile phone as a controller to enter inputs privately." },
        { q: "Can we play in a hybrid office setting?", a: "Yes, TUSA is perfect for team-building events with hybrid participants." },
        { q: "Are these games free?", a: "Yes, completely free with no player limits." }
      ]
    }
  },
  "for-families": {
    ru: {
      title: "Семейные игры для компании дома · Игры для всей семьи",
      description: "Лучшие семейные игры дома онлайн. Викторины, словесные игры на телефоне без скачивания для взрослых и детей на TUSA.game.",
      kicker: "СЕМЕЙНЫЕ ИГРЫ",
      h1: "Семейные игры дома: объедините поколения",
      intro: "Семейные вечера становятся ярче с интерактивными играми. TUSA.game предлагает простые и добрые игры, которые понравятся и детям, и бабушкам с дедушками.",
      body: "Наши семейные игры не требуют специальных знаний или быстрой реакции на геймпаде. Разгадывайте слова, делитесь мнениями или соревнуйтесь в викторинах на общие темы. Все вопросы адаптированы для семейного круга.",
      stepsTitle: "Как запустить семейную игру:",
      steps: [
        "Выведите TUSA.game на экран компьютера или телевизора.",
        "Помогите младшим и старшим членам семьи отсканировать QR-код на своих телефонах.",
        "Выберите семейный режим (например, Чистый лист) и начните играть."
      ],
      gamesTitle: "Лучшие игры для всей семьи:",
      games: [
        { name: "Чистый лист (Blank Slate)", desc: "Записывайте слова, которые лучше всего дополняют фразу. Угадывайте мысли друг друга." },
        { name: "Алиас (Alias)", desc: "Веселая игра на объяснение слов. Отлично развивает речь и логику у детей." },
        { name: "Колесо Судьбы (Wheel of Fate)", desc: "Простые задания и фанты, которые рассмешат всю семью." }
      ],
      faqs: [
        { q: "Подходят ли игры для маленьких детей?", a: "Да, наши словесные игры подходят для детей от 6-8 лет, умеющих читать." },
        { q: "Безопасен ли контент?", a: "Да, вы можете включить детский/семейный фильтр в настройках, чтобы исключить взрослые темы." },
        { q: "Нужны ли платные подписки?", a: "Все базовые игры бесплатны для семейного использования." }
      ]
    },
    en: {
      title: "Family Party Games Online · Games for Family Night | TUSA.game",
      description: "Discover the best family party games to play at home. Try trivia, word games, and drawing on TV free on TUSA.game.",
      kicker: "FAMILY PARTY GAMES",
      h1: "Fun and Friendly Games for Family Game Night",
      intro: "Bring all generations together. TUSA.game offers clean, friendly game formats that are easy to play for kids, parents, and grandparents alike.",
      body: "Our family games focus on communication, word association, and lighthearted trivia. No complex controller layouts or lightning-fast reflexes required — just grab your smartphones and play.",
      stepsTitle: "How to start a family game night:",
      steps: [
        "Open TUSA.game on your living room TV screen.",
        "Help kids and older family members scan the QR code to join.",
        "Select a friendly game mode like Blank Slate and start."
      ],
      gamesTitle: "Recommended Family Games:",
      games: [
        { name: "Blank Slate", desc: "Write matching words with other family members. Simple, clean, and highly engaging." },
        { name: "Alias / Word Blast", desc: "Describe words to your family under time pressure. Great for developing kids' vocabulary." },
        { name: "Wheel of Fate", desc: "A fun way to assign chores, decide movie choices, or run random family challenges." }
      ],
      faqs: [
        { q: "Are the questions clean for children?", a: "Yes, you can toggle the family preset to ensure all content is kid-friendly." },
        { q: "Can we play on a tablet?", a: "Yes, a tablet makes a perfect game board for small family groups around the table." },
        { q: "Are these games free?", a: "Yes, all core family modes are free." }
      ]
    }
  },
  "for-teams": {
    ru: {
      title: "Командные игры для компании онлайн · Игры на сплочение",
      description: "Веселые командные игры для компании друзей или коллег. Сыграйте в Кодовые имена и Алиас онлайн без скачивания на TUSA.game.",
      kicker: "КОМАНДНЫЕ ИГРЫ",
      h1: "Командные игры: соперничество и взаимопонимание",
      intro: "Командные игры укрепляют связи между людьми и добавляют азарт в любую вечеринку. TUSA.game предлагает удобные форматы для игр команда на команду.",
      body: "Разделитесь на группы и соревнуйтесь в логике, эрудиции или скорости объяснения слов. Наша платформа автоматически распределяет игроков и ведет подсчет очков для каждой команды.",
      stepsTitle: "Как запустить командный баттл:",
      steps: [
        "Создайте комнату и выберите командную игру (например, Codenames).",
        "Все участники заходят со своих телефонов и делятся на Красных и Синих.",
        "Начните первый раунд и покажите командную слаженность."
      ],
      gamesTitle: "Лучшие командные игры на TUSA:",
      games: [
        { name: "Кодовые имена (Codenames)", desc: "Главный командный хит. Капитаны дают ассоциации, команда угадывает карточки." },
        { name: "Алиас (Alias)", desc: "Объясняйте слова своей команде на скорость. Побеждает самая быстрая группа." },
        { name: "Битва Разумов (Quiz Battle)", desc: "Командная викторина. Отвечайте на вопросы вместе, чтобы заработать очки." }
      ],
      faqs: [
        { q: "Какое максимальное число игроков в командах?", a: "Наши командные игры поддерживают до 20+ участников, разделенных на две группы." },
        { q: "Можно ли менять составы команд?", a: "Да, игроки могут менять свою команду в лобби перед началом каждого раунда." },
        { q: "Все ли игры поддерживают командный режим?", a: "Специальные командные режимы есть у Alias, Codenames и викторин." }
      ]
    },
    en: {
      title: "Team Party Games Online · Group Team Building | TUSA.game",
      description: "Play team-based browser games with friends or colleagues. Try Codenames, Alias, and Quiz Battle free in your browser.",
      kicker: "TEAM PARTY GAMES",
      h1: "Fun and Competitive Team Party Games",
      intro: "Team party games bring people together through friendly competition. TUSA.game offers clean, balanced team formats that are easy to play.",
      body: "Split into groups and challenge each other's logic, vocabulary, or trivia knowledge. The platform automatically balances teams and displays live scoreboards.",
      stepsTitle: "How to start a team game:",
      steps: [
        "Create a party room on TUSA.game.",
        "Let players scan the QR code and assign themselves to Red or Blue teams.",
        "Launch Codenames or Alias and start the team challenge."
      ],
      gamesTitle: "Top Team Games on TUSA:",
      games: [
        { name: "Codenames", desc: "A legendary team association game. Work with your captain's clues to find secret agents." },
        { name: "Alias / Word Blast", desc: "Describe words to your team under time pressure. The fastest group wins." },
        { name: "Quiz Battle", desc: "A team trivia game where collective knowledge leads to victory." }
      ],
      faqs: [
        { q: "Can we play with up to 10 people in teams?", a: "Yes, our team modes support large groups of up to 20+ active players." },
        { q: "Can we shuffle teams between rounds?", a: "Yes, players can change teams in the lobby before any rematch." },
        { q: "Is it free for large teams?", a: "Yes, completely free with no player charges." }
      ]
    }
  },
  "for-college": {
    ru: {
      title: "Игры для студентов в общежитии онлайн · TUSA.game",
      description: "Веселые и шумные игры для студентов в общаге или на вписке. Сыграйте в Я никогда не и Правда или Дело бесплатно на TUSA.game.",
      kicker: "ИГРЫ ДЛЯ СТУДЕНТОВ",
      h1: "Игры для студентов: веселье на вписке и в общаге",
      intro: "Студенческие вечеринки должны быть громкими, веселыми и бюджетными. TUSA.game предлагает идеальные игры для вписок и общежитий, которые не требуют затрат.",
      body: "Забудьте про дорогие настольные игры. Все, что нужно: телефоны в руках ваших друзей. Играйте в откровенные словесные игры, веселые викторины или испытывайте удачу в фантах. TUSA сделает любую студенческую тусовку незабываемой.",
      stepsTitle: "Как устроить студенческую игру:",
      steps: [
        "Создайте комнату на TUSA.game на телефоне или ноутбуке.",
        "Скиньте ссылку в чат общежития.",
        "Пусть все заходят под своими никами и начинают веселье."
      ],
      gamesTitle: "Студенческие хиты на TUSA:",
      games: [
        { name: "Я никогда не (Never Have I Ever)", desc: "Узнайте все секреты своих однокурсников в этом классическом формате." },
        { name: "Правда или Дело (Truth or Dare)", desc: "Безумные задания и каверзные вопросы для растапливания льда." },
        { name: "Would You Rather (Выбор)", desc: "Спорьте и голосуйте за самые нелепые варианты развития событий." }
      ],
      faqs: [
        { q: "Подходит ли игра для вписки?", a: "Да! Наши форматы разработаны для шумных молодежных компаний." },
        { q: "Нужно ли платить за доступ?", a: "Все основные игры абсолютно бесплатны, никаких скрытых покупок." },
        { q: "Можно ли играть без интернета?", a: "Нужен мобильный интернет или Wi-Fi, чтобы синхронизировать телефоны игроков." }
      ]
    },
    en: {
      title: "College Party Games Online · Dorm Room Game Night | TUSA.game",
      description: "Fun and cheap games to play with college friends in dorm or at parties. Play Never Have I Ever and Truth or Dare free.",
      kicker: "COLLEGE PARTY GAMES",
      h1: "Fun and Cheap Games for College Parties",
      intro: "College game nights should be high-energy, fun, and free. TUSA.game offers a suite of party games that cost absolutely nothing.",
      body: "Skip the expensive board games. All your friends need are their smartphones. Play revealing card games, test your friends' secrets, or debate ridiculous dilemmas in your dorm room.",
      stepsTitle: "How to start a dorm room game night:",
      steps: [
        "Open a room on TUSA.game on your laptop or phone.",
        "Paste the link into your dorm group chat.",
        "Everyone joins instantly and starts playing."
      ],
      gamesTitle: "Top Games for College Students:",
      games: [
        { name: "Never Have I Ever", desc: "Discover funny and wild secrets about your classmates." },
        { name: "Truth or Dare", desc: "Provocative dares and truths to spice up the night." },
        { name: "Would You Rather", desc: "Vote on absurd options and debate the results with your friends." }
      ],
      faqs: [
        { q: "Is this free for students?", a: "Yes, completely free with no limits on players or session time." },
        { q: "Can we play as a drinking game?", a: "You can easily adapt modes like Never Have I Ever for drinking game nights." },
        { q: "What devices do we need?", a: "Any phone with internet access can join as a controller." }
      ]
    }
  },
  "for-adults": {
    ru: {
      title: "Игры для взрослой компании 18+ онлайн · TUSA.game",
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
        { q: "Видят ли другие игроки мои ответы?", a: "Некоторые ответы анонимны, а некоторые выводятся на общий экран для веселья; это зависит от выбранного режима." },
        { q: "Можно ли играть вдвоем?", a: "Да, наши взрослые игры отлично подходят как для пар, так и для больших компаний." }
      ]
    },
    en: {
      title: "Adult Party Games 18+ Online · TUSA.game",
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
        { q: "Are these games strictly 18+?", a: "You can toggle mature content on or off. The adult decks are tailored for audiences 18+." },
        { q: "Is player privacy protected?", a: "Yes. Private inputs remain strictly on the player's controller screen, only showing final choices on the stage." },
        { q: "Can we play as a couple?", a: "Absolutely. These modes are highly popular for couples' game nights or double dates." }
      ]
    }
  },
  "for-kids": {
    ru: {
      title: "Игры для детей на день рождения онлайн · TUSA.game",
      description: "Интересные детские игры для праздников и семейных вечеров. Развивающие словесные викторины без скачивания бесплатно на TUSA.game.",
      kicker: "ИГРЫ ДЛЯ ДЕТЕЙ",
      h1: "Развивающие и веселые игры для детей",
      intro: "Дети любят гаджеты, и TUSA.game направляет этот интерес в полезное русло. Играйте в развивающие викторины и словесные игры всей семьей.",
      body: "Наши детские игры развивают словарный запас, логику и внимание. Все вопросы проходят строгую модерацию, исключая взрослый контент. Простые правила позволяют детям играть самостоятельно или вместе с родителями.",
      stepsTitle: "Как устроить детскую игру:",
      steps: [
        "Откройте TUSA.game на планшете или телевизоре.",
        "Помогите детям подключиться с телефонов.",
        "Выберите режим «Дети» или «Семья» и запустите раунд."
      ],
      gamesTitle: "Детские игры на платформе:",
      games: [
        { name: "Алиас (Alias) Детский", desc: "Объясняйте простые слова и развивайте речь в игровой форме." },
        { name: "Викторина (Trivia) для детей", desc: "Интересные вопросы об окружающем мире, животных и мультфильмах." },
        { name: "Колесо Судьбы (Wheel of Fate)", desc: "Используйте для веселых физкультминуток или распределения ролей в детских играх." }
      ],
      faqs: [
        { q: "С какого возраста могут играть дети?", a: "Игры подходят для детей от 6-7 лет, которые уже умеют читать простые слова." },
        { q: "Безопасен ли контент?", a: "Да, у нас есть специальный фильтр контента для детей, исключающий любые некорректные вопросы." },
        { q: "Нужно ли платить за игры?", a: "Все детские игры на платформе полностью бесплатны." }
      ]
    },
    en: {
      title: "Kids Party Games Online · Play on Mobile Free | TUSA.game",
      description: "Fun and educational online party games for kids. Try child-friendly trivia, word puzzles, and drawing free on TUSA.game.",
      kicker: "KIDS PARTY GAMES",
      h1: "Educational and Fun Games for Kids",
      intro: "Kids love screen time. TUSA.game turns it into a social, educational, and fun activity that they can share with friends or family.",
      body: "Our games improve vocabulary, logic, and general knowledge. We enforce strict content filters on all child-friendly modes, giving parents complete peace of mind.",
      stepsTitle: "How to set up a game for kids:",
      steps: [
        "Open TUSA.game on a shared screen (iPad or TV).",
        "Let children connect via their phones or tablets.",
        "Choose a family-friendly game mode and start the round."
      ],
      gamesTitle: "Recommended Games for Kids:",
      games: [
        { name: "Alias / Word Blast (Kids Edition)", desc: "Describe simple words. A great way to build verbal and social skills." },
        { name: "Kids Trivia Quiz", desc: "Fun questions about animals, space, history, and cartoons." },
        { name: "Wheel of Fate", desc: "Use the wheel to assign fun physical tasks or party dares." }
      ],
      faqs: [
        { q: "What is the recommended age?", a: "Most games are suitable for children aged 6 and up who are able to read basic text." },
        { q: "Is the content safe?", a: "Yes, our kids and family presets exclude any mature, political, or sensitive content." },
        { q: "Is registration required?", a: "No, kids join instantly as anonymous players." }
      ]
    }
  },
  "for-couples": {
    ru: {
      title: "Игры для пар на телефоне онлайн · TUSA.game",
      description: "Романтические и веселые игры для двоих влюбленных. Узнайте друг друга лучше с помощью викторин и Правда или Дело на TUSA.game.",
      kicker: "ИГРЫ ДЛЯ ПАР",
      h1: "Игры для пар: романтика и веселье для двоих",
      intro: "Игры для пар помогают сблизиться, узнать секреты друг друга и весело провести свидание. TUSA.game предлагает интерактивные романтические форматы.",
      body: "Забудьте про скучные опросы. Наши интерактивные викторины и игры с заданиями создают легкую атмосферу для общения. Отвечайте на каверзные вопросы или делайте выбор в сложных дилеммах вместе со своей половинкой.",
      stepsTitle: "Как устроить свидание с TUSA:",
      steps: [
        "Создайте приватную комнату на TUSA.game.",
        "Подключите второй телефон по ссылке.",
        "Выберите романтический режим (например, Правда или Дело) и начните раунд."
      ],
      gamesTitle: "Лучшие игры для пар:",
      games: [
        { name: "Правда или Дело (Truth or Dare)", desc: "Откровенные вопросы и интересные дела для сближения." },
        { name: "Я никогда не (Never Have I Ever)", desc: "Узнайте забавные подробности из прошлого вашей половинки." },
        { name: "Would You Rather (Что бы ты выбрал)", desc: "Обсуждайте смешные и романтические сценарии выбора." }
      ],
      faqs: [
        { q: "Подходят ли игры для первого свидания?", a: "Да! Это отличный способ растопить лед и избежать неловкого молчания." },
        { q: "Сохраняются ли наши ответы?", a: "Все ответы конфиденциальны и не сохраняются на сервере после закрытия комнаты." },
        { q: "Это бесплатно?", a: "Да, все базовые романтические наборы бесплатны." }
      ]
    },
    en: {
      title: "Romantic Games for Couples Online · Play on Phone | TUSA.game",
      description: "Fun and romantic party games for couples. Try relationship quizzes, Truth or Dare, and Never Have I Ever free on TUSA.game.",
      kicker: "GAMES FOR COUPLES",
      h1: "Fun and Romantic Games for Couples",
      intro: "Couples' games are a perfect way to spark conversation, reveal secrets, and add excitement to your date nights.",
      body: "TUSA.game provides interactive question decks, trivia, and truth-or-dare scenarios tailored for couples. Break the routine and enjoy a fun, digital-first date experience.",
      stepsTitle: "How to set up a couples' date night:",
      steps: [
        "Open a room on TUSA.game.",
        "Connect the second phone via the QR code.",
        "Select a relationship mode and start playing together."
      ],
      gamesTitle: "Recommended Games for Couples:",
      games: [
        { name: "Truth or Dare", desc: "Spicy and revealing prompts to bring you closer together." },
        { name: "Never Have I Ever", desc: "Discover funny, undocumented stories about your partner's past." },
        { name: "Would You Rather", desc: "Force choices between silly, romantic, or tough scenarios and debate them." }
      ],
      faqs: [
        { q: "Can we play on a single screen?", a: "Having two phones makes input entry more private and interactive, but sharing is possible." },
        { q: "Is our data private?", a: "Yes, we store no personal responses. Data is cleared once the session ends." },
        { q: "Are these games free?", a: "Yes, completely free with no paywalls." }
      ]
    }
  },
  "for-birthday": {
    ru: {
      title: "Игры на день рождения для компании · Игры на праздник",
      description: "Веселые интерактивные игры на день рождения для взрослых и детей. Развлеките гостей за праздничным столом с помощью TUSA.game.",
      kicker: "ИГРЫ НА ДЕНЬ РОЖДЕНИЯ",
      h1: "Как развлечь гостей на день рождения: праздничные игры",
      intro: "День рождения: время радости, подарков и веселья. Но как объединить гостей разного возраста за столом? TUSA.game предлагает простые праздничные игры, в которых справится каждый.",
      body: "Устройте веселую битву умов или творческий конкурс. Наши игры не требуют раздачи инвентаря: гости просто достают свои телефоны, подключаются к общему экрану (например, телевизору) и соревнуются за звание самого остроумного гостя.",
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
        { q: "Можно ли играть за праздничным столом?", a: "Да! Смартфон в руках и есть все, что нужно. Никаких карточек и кубиков, мешающих посуде." },
        { q: "Сколько гостей может играть?", a: "Платформа легко справляется с компаниями до 20-30 гостей." }
      ]
    },
    en: {
      title: "Birthday Party Games for Large Groups · TUSA.game",
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
  "for-weddings": {
    ru: {
      title: "Игры на свадьбу для гостей онлайн · Свадебные конкурсы",
      description: "Веселые интерактивные свадебные конкурсы и игры для гостей. Устройте незабываемое развлечение за столом на TUSA.game.",
      kicker: "ИГРЫ НА СВАДЬБУ",
      h1: "Свадебные конкурсы нового поколения: игры на TUSA",
      intro: "Хотите удивить гостей на свадьбе? Замените банальные конкурсы современными интерактивными играми, в которых может участвовать весь зал.",
      body: "TUSA.game позволяет запустить викторину о молодоженах прямо на большом проекторе ресторана. Гости используют свои телефоны для ответов, соревнуясь за звание лучшего знатока пары. Это весело, современно и объединяет всех присутствующих.",
      stepsTitle: "Как запустить игру на свадьбе:",
      steps: [
        "Подключите ноутбук ведущего к свадебному экрану или проектору.",
        "Откройте TUSA.game и покажите QR-код.",
        "Гости сканируют код прямо со своих столов и начинают игру."
      ],
      gamesTitle: "Рекомендуемые игры на свадьбу:",
      games: [
        { name: "Викторина (Trivia) о молодоженах", desc: "Создайте уникальный квиз: как познакомились молодожены, где любят отдыхать." },
        { name: "Колесо Судьбы (Wheel of Fate)", desc: "Веселый розыгрыш свадебных призов и тостов среди гостей." },
        { name: "Quiplash (Остроумие)", desc: "Написание веселых пожеланий и шуток, за которые голосует весь зал." }
      ],
      faqs: [
        { q: "Может ли играть 50+ человек одновременно?", a: "Да, наши викторины оптимизированы для масштабных мероприятий и больших залов." },
        { q: "Нужно ли ведущему объяснять сложные правила?", a: "Правила просты и выводятся прямо на экраны телефонов гостей." },
        { q: "Можно ли брендировать викторину?", a: "Вы можете загрузить свои вопросы и название викторины, полностью посвятив её паре." }
      ]
    },
    en: {
      title: "Interactive Wedding Games for Guests · TUSA.game",
      description: "Keep wedding guests entertained with modern interactive games. Cast quizzes and trivia to projector screen free on TUSA.game.",
      kicker: "WEDDING PARTY GAMES",
      h1: "Modern Interactive Games for Your Wedding Reception",
      intro: "Want to surprise your wedding guests? Replace outdated reception games with modern, interactive trivia that everyone can join from their tables.",
      body: "TUSA.game lets you display custom trivia about the newlyweds on the venue's projector. Guests join from their seats using their phones, competing to see who knows the couple best.",
      stepsTitle: "How to set up a wedding game show:",
      steps: [
        "Connect the DJ's or venue's laptop to the main projector screen.",
        "Open TUSA.game and project the lobby QR code.",
        "Guests scan the code from their tables and participate in the live quiz."
      ],
      gamesTitle: "Recommended Wedding Games:",
      games: [
        { name: "Trivia Quiz About the Couple", desc: "Create a custom quiz about how you met, your favorite foods, and funny stories." },
        { name: "Wheel of Fate", desc: "Spin the wheel for random guest toasts, dances, or giving away party favors." },
        { name: "Quiplash / Punchline", desc: "Guests write funny advice or predictions for the couple, and the room votes." }
      ],
      faqs: [
        { q: "Can we support 50 or more guests?", a: "Yes, TUSA's server architecture handles large wedding receptions and crowds easily." },
        { q: "Does it require a wedding coordinator?", a: "No, the interface is completely self-explanatory for guests and hosts." },
        { q: "Is it free for all wedding guests?", a: "Yes, all core trivia and room hosting features are completely free." }
      ]
    }
  },
  "for-remote-teams": {
    ru: {
      title: "Игры для удаленных команд онлайн · Виртуальный тимбилдинг",
      description: "Веселые игры на сплочение удаленных команд. Снимите стресс на созвонах в Zoom/Teams бесплатно с помощью TUSA.game.",
      kicker: "ИГРЫ ДЛЯ УДАЛЕНКИ",
      h1: "Игры для удаленных команд: сплочение на расстоянии",
      intro: "Работать на удаленке бывает одиноко. Игры-ледоколы на TUSA.game помогают распределенным командам чувствовать себя единым целым.",
      body: "Проводите 10-минутные разминки перед совещаниями или устраивайте пятничные игровые часы. Наши игры способствуют неформальному общению, развивают логику и помогают расслабиться после сложных задач.",
      stepsTitle: "Интеграция игр в рабочий процесс:",
      steps: [
        "Хост запускает TUSA.game и транслирует экран в Teams/Slack/Zoom.",
        "Коллеги переходят по ссылке со смартфонов.",
        "Начните совместную игру, например, Кодовые имена."
      ],
      gamesTitle: "Топ игр для удаленных команд:",
      games: [
        { name: "Кодовые имена (Codenames)", desc: "Развивает стратегическое мышление и командное взаимодействие." },
        { name: "Бомб Пати (Bomb Party)", desc: "Высокоскоростная словесная дуэль для разминки мозга." },
        { name: "Битва Разумов (Quiz)", desc: "Покажет, у кого в отделе самая большая эрудиция." }
      ],
      faqs: [
        { q: "Нужно ли скачивать корпоративный софт?", a: "Нет, TUSA работает прямо в браузере, никаких установок на рабочие ПК." },
        { q: "Подходит ли это для пятничных посиделок?", a: "Да! Это отличная альтернатива скучным беседам ни о чем." },
        { q: "Какое оптимальное число игроков?", a: "Наиболее динамично игра идет в командах по 4-12 человек." }
      ]
    },
    en: {
      title: "Virtual Team Building Games for Remote Teams · TUSA.game",
      description: "Interactive online games for remote and hybrid teams. Play Codenames, trivia, and icebreakers over Zoom/Teams free.",
      kicker: "REMOTE TEAM GAMES",
      h1: "Virtual Team Building Games for Distributed Teams",
      intro: "Remote work shouldn't mean remote friendships. TUSA.game helps distributed teams build trust and connect on a personal level.",
      body: "Host a 10-minute warmer before your team meetings or run a virtual happy hour on Friday. Our frictionless web games bypass IT approvals since they require zero installs.",
      stepsTitle: "How to run a remote team game night:",
      steps: [
        "Share the TUSA.game Stage screen on your Zoom or Teams call.",
        "Ask employees to join using the link on their mobile devices.",
        "Select Codenames or a quick trivia quiz to kick off the session."
      ],
      gamesTitle: "Top Games for Remote Teams:",
      games: [
        { name: "Codenames", desc: "Collaborate in teams to find secret agents. Promotes strategy and communication." },
        { name: "Bomb Party", desc: "A fast-paced word association game that gets everyone laughing." },
        { name: "Trivia Quiz", desc: "Test your team's collective knowledge across general topics." }
      ],
      faqs: [
        { q: "Do we need IT department approvals?", a: "No, TUSA runs entirely in the cloud on standard web browsers. No software is installed." },
        { q: "Can we use it as a quick morning icebreaker?", a: "Yes, most modes can be played in under 10 minutes to kickstart meetings." },
        { q: "Is our employee data secure?", a: "Yes, we do not store corporate information or tracking data." }
      ]
    }
  },
  "for-classroom": {
    ru: {
      title: "Игры для класса в школе онлайн · Ледоколы для учеников",
      description: "Интерактивные развивающие игры для школьников и студентов в классе. Викторины, квизы и словесные игры на TUSA.game.",
      kicker: "ИГРЫ ДЛЯ КЛАССА",
      h1: "Игры для класса: учеба через развлечение",
      intro: "Разнообразьте учебный процесс интерактивными викторинами. TUSA.game помогает вовлечь весь класс в развивающие игры без сложной подготовки.",
      body: "Выводите вопросы викторин на интерактивную доску или проектор. Ученики отвечают со своих телефонов, соревнуясь в знаниях. Это стимулирует интерес к предмету и развивает соревновательный дух.",
      stepsTitle: "Инструкция для учителя:",
      steps: [
        "Откройте TUSA.game на классном компьютере, подключенном к проектору.",
        "Выведите лобби на экран.",
        "Ученики сканируют код с телефонов и начинают викторину."
      ],
      gamesTitle: "Полезные игры для учебы:",
      games: [
        { name: "Битва Разумов (Trivia)", desc: "Создайте викторину по пройденной теме или запустите общий квиз." },
        { name: "Алиас (Alias)", desc: "Развивает речь, словарный запас и скорость мышления у детей." },
        { name: "Чистый Лист (Blank Slate)", desc: "Учит находить ассоциации и логические связи между словами." }
      ],
      faqs: [
        { q: "Безопасен ли контент для детей?", a: "Да, вы можете включить фильтр детских вопросов, чтобы гарантировать чистоту контента." },
        { q: "Нужна ли плата за класс?", a: "Все основные викторины и игры бесплатны, без платы за количество учеников." },
        { q: "Работает ли игра без телефонов у всех?", a: "Да, ученики могут разделиться на группы и играть с нескольких устройств." }
      ]
    },
    en: {
      title: "Interactive Classroom Games for Students Online · TUSA.game",
      description: "Engage students with interactive classroom quizzes, word games, and icebreakers. Cast to projector screen free on TUSA.game.",
      kicker: "CLASSROOM GAMES",
      h1: "Fun and Educational Games for the Classroom",
      intro: "Make learning fun. TUSA.game lets teachers host interactive quizzes and vocabulary building games directly on the classroom projector.",
      body: "Boost student engagement. Students answer general knowledge questions or match word definitions using their personal or school mobile devices, encouraging positive competition.",
      stepsTitle: "How to set up a classroom quiz:",
      steps: [
        "Open TUSA.game on the teacher's computer connected to the smartboard.",
        "Ask students to join the lobby by scanning the projected QR code.",
        "Select a trivia battle or vocabulary game and start."
      ],
      gamesTitle: "Top Educational Games:",
      games: [
        { name: "Trivia Quiz", desc: "Challenge students' knowledge on history, science, or general topics." },
        { name: "Alias / Word Blast", desc: "Build speech, language, and communication skills through timed descriptions." },
        { name: "Blank Slate", desc: "Encourage word association and logical thinking by matching blanks." }
      ],
      faqs: [
        { q: "Is the content safe for schools?", a: "Yes, teachers can select child-safe modes that filter out any mature or sensitive questions." },
        { q: "Is there a limit on class size?", a: "No, TUSA's real-time engine easily supports classrooms of 30+ students." },
        { q: "Do students need to create accounts?", a: "No, students log in as guests with temporary nicknames." }
      ]
    }
  },
  "no-props": {
    ru: {
      title: "Игры для компании без реквизита онлайн · TUSA.game",
      description: "Веселые игры для большой компании, не требующие бумаги, карт и реквизита. Все игры запускаются с телефона на TUSA.game.",
      kicker: "ИГРЫ БЕЗ РЕКВИЗИТА",
      h1: "Игры без реквизита: развлечение из кармана",
      intro: "Собралась компания, но нет настольных игр, бумаги или ручек? TUSA.game превращает телефоны ваших гостей в готовый игровой набор.",
      body: "Больше не нужно искать карандаши, вырезать карточки для «Шпиона» или записывать очки на бумажке. Наша платформа берет всю логистику на себя, предлагая 32 полноценных игровых режима прямо в браузере.",
      stepsTitle: "Как начать играть без реквизита:",
      steps: [
        "Достаньте смартфон и откройте TUSA.game.",
        "Покажите QR-код друзьям для мгновенного входа.",
        "Выберите любую игру и начните раунд."
      ],
      gamesTitle: "Игры, не требующие инвентаря:",
      games: [
        { name: "Шпион (Spyfall)", desc: "Никаких бумажных карт с ролями: сервер раздает их приватно на экраны телефонов." },
        { name: "Бомб Пати (Bomb Party)", desc: "Таймер-бомба и проверка словарного запаса прямо на вашем экране." },
        { name: "Правда или Дело (Truth or Dare)", desc: "Сотни встроенных заданий заменят бумажные карточки." }
      ],
      faqs: [
        { q: "Нужно ли что-то покупать?", a: "Нет, все основные игры и функции доступны абсолютно бесплатно." },
        { q: "Можно ли играть в дороге?", a: "Да! Нужен только мобильный интернет, чтобы соединить телефоны." },
        { q: "Сколько людей может играть?", a: "От 2 до 20+ игроков могут играть одновременно без какого-либо реквизита." }
      ]
    },
    en: {
      title: "Party Games with No Props or Materials · TUSA.game",
      description: "Play fun group games that require no paper, cards, or props. All games run directly on your smartphone on TUSA.game.",
      kicker: "NO PROPS PARTY GAMES",
      h1: "Fun Party Games That Require No Props or Materials",
      intro: "No cards, no dice, no paper? No problem. TUSA.game turns your guests' smartphones into a complete digital party kit.",
      body: "Skip the prep work. Our web-first platform manages roles, timers, word generators, and scoring, letting you enjoy 32 different social game formats with zero physical materials.",
      stepsTitle: "How to play without props:",
      steps: [
        "Open TUSA.game on your smartphone.",
        "Share the QR code or link with your friends.",
        "Choose a game and start playing instantly."
      ],
      gamesTitle: "Best Games with Zero Setup:",
      games: [
        { name: "Spyfall", desc: "No paper cards needed. The server assigns secret roles privately to each phone." },
        { name: "Bomb Party", desc: "A digital bomb timer. Type words that contain target letters on your phone." },
        { name: "Truth or Dare", desc: "Hundreds of built-in prompts replace the classic bottle or card decks." }
      ],
      faqs: [
        { q: "Do we need internet?", a: "Yes, a mobile data or Wi-Fi connection is required to sync the game states." },
        { q: "Is it completely free?", a: "Yes, all core game modes are free with no paywalls." },
        { q: "Can we play while traveling?", a: "Yes, as long as you have internet, you can play on a train, bus, or plane." }
      ]
    }
  },
  "no-app": {
    ru: {
      title: "Браузерные игры для компании без скачивания · TUSA.game",
      description: "Играйте в игры для компании без скачивания приложений и установки программ. 32 игры прямо в браузере телефона на TUSA.game.",
      kicker: "ИГРЫ БЕЗ СКАЧИВАНИЯ",
      h1: "Браузерные игры для компании: без лишних приложений",
      intro: "Никто не любит тратить время на установку приложений ради одной игры. TUSA.game предлагает 32 игры для компании, работающие прямо в браузере телефона.",
      body: "Вам не придется чистить память смартфона или ждать загрузки из App Store. Просто перейдите по ссылке, введите имя и играйте. Это идеальный формат для быстрых встреч, праздников и спонтанных вечеринок.",
      stepsTitle: "Как играть без скачивания:",
      steps: [
        "Откройте TUSA.game в любом браузере (Safari, Chrome, Firefox).",
        "Создайте тусу и отправьте короткую ссылку друзьям.",
        "Друзья переходят по ссылке и сразу попадают в игру."
      ],
      gamesTitle: "Лучшие браузерные игры:",
      games: [
        { name: "Алиас (Alias)", desc: "Классическая словесная игра на объяснение слов, работающая в браузере." },
        { name: "Шпион (Spyfall)", desc: "Ролевая игра в шпионов, не требующая установки приложений." },
        { name: "Угадай песню (Guess the Song)", desc: "Музыкальный квиз прямо на экране вашего смартфона." }
      ],
      faqs: [
        { q: "Будет ли игра тормозить в браузере?", a: "Нет, наши игры оптимизированы и весят менее 200 КБ, обеспечивая плавную работу на любых устройствах." },
        { q: "Нужно ли регистрироваться?", a: "Регистрация не обязательна. Можно войти как гость." },
        { q: "Подходит ли это для старых телефонов?", a: "Да, TUSA работает даже на смартфонах 5-летней давности." }
      ]
    },
    en: {
      title: "Browser Party Games No Download · Play Free Online | TUSA.game",
      description: "Play multiplayer party games in browser with no downloads or installs. 32 game modes straight to your mobile screen on TUSA.game.",
      kicker: "NO DOWNLOAD GAMES",
      h1: "Multiplayer Browser Games with No Installation",
      intro: "No one wants to delete photos or wait for app store downloads just to play a quick game. TUSA.game runs entirely in your mobile web browser.",
      body: "Enjoy 32 game modes with zero install friction. Click the invite link, enter a nickname, and start playing. It's the perfect solution for spontaneous office hangouts or party game nights.",
      stepsTitle: "How to play in browser:",
      steps: [
        "Open TUSA.game in Safari, Chrome, or any mobile browser.",
        "Create a party and send the invite link to your group.",
        "Guests click the link and enter the game lobby instantly."
      ],
      gamesTitle: "Top Browser Games on TUSA:",
      games: [
        { name: "Alias / Word Blast", desc: "A classic word guessing game running smoothly in any web browser." },
        { name: "Spyfall", desc: "A hidden role game that runs instantly without downloads." },
        { name: "Guess the Song", desc: "A fast music quiz that streams audio directly to your device." }
      ],
      faqs: [
        { q: "Do these browser games lag?", a: "No, the total page load is under 200KB, ensuring smooth performance even on slower connections." },
        { q: "Do I need to sign up?", a: "No, guests join as anonymous players without creating accounts." },
        { q: "Does it work on older phones?", a: "Yes, our web-first architecture is fully compatible with older smartphones." }
      ]
    }
  },
  "free-alternatives-to-jackbox": {
    ru: {
      title: "Бесплатный аналог Джекбокс (Jackbox) онлайн · TUSA.game",
      description: "Ищете бесплатную замену Jackbox Party Pack? TUSA.game предлагает 32 игры для компании без покупок и скачиваний приложений.",
      kicker: "АНАЛОГ ДЖЕКБОКС",
      h1: "Бесплатный аналог Jackbox: игры на русском",
      intro: "Jackbox Party Pack популярен, но требует покупки лицензий и установки на ПК. TUSA.game предлагает бесплатную альтернативу с играми на русском языке прямо в браузере.",
      body: "Наши игры используют ту же удобную механику: один большой экран отображает Stage (игровое поле), а телефоны игроков служат контроллерами. Играйте в словесные баттлы, викторины и психологические детективы без ограничений и платных подписок.",
      stepsTitle: "Как запустить аналог Jackbox:",
      steps: [
        "Выведите TUSA.game на экран телевизора или проектора через ПК.",
        "Друзья заходят со своих смартфонов по ссылке или QR-коду.",
        "Выберите Quiplash или Кодовые имена и играйте бесплатно."
      ],
      gamesTitle: "Аналоги Джекбокса на TUSA:",
      games: [
        { name: "Quiplash (Словесный баттл)", desc: "Полный аналог знаменитой игры от Jackbox: пишите смешные ответы, собирайте голоса." },
        { name: "Битва Разумов (Quiz Battle)", desc: "Интерактивная викторина с быстрыми вопросами, похожая на Trivia Murder Party." },
        { name: "Мафия / Оборотень", desc: "Психологический детектив с тайными ролями, аналог Faking It." }
      ],
      faqs: [
        { q: "Нужно ли хосту покупать игру?", a: "Нет, в отличие от Jackbox, хостинг комнат на TUSA абсолютно бесплатен." },
        { q: "Поддерживаются ли русские шрифты и вопросы?", a: "Да, все игры изначально разработаны на русском и английском языках." },
        { q: "Нужен ли Steam или консоль?", a: "Нет, нужен только браузер на любом устройстве." }
      ]
    },
    en: {
      title: "Free Alternatives to Jackbox Games Online · TUSA.game",
      description: "Looking for a free alternative to Jackbox Party Pack? Try TUSA.game for 32 browser games with mobile controllers and no downloads.",
      kicker: "FREE JACKBOX ALTERNATIVE",
      h1: "Best Free Alternative to Jackbox Party Pack",
      intro: "Jackbox is fun, but it requires a console/Steam purchase and software installation. TUSA.game is a free browser-based alternative.",
      body: "We use the same popular controller-to-screen mechanic. Share the main Stage screen, and let players type, vote, and accuse from their phone browsers. No registration, no app store, and completely free.",
      stepsTitle: "How to set up a free Jackbox-style night:",
      steps: [
        "Open TUSA.game on a TV or laptop browser.",
        "Let guests scan the QR code using their phones.",
        "Launch Quiplash or Codenames and enjoy the game show experience."
      ],
      gamesTitle: "Jackbox-like Games on TUSA:",
      games: [
        { name: "Quiplash / Punchline", desc: "Write funny answers to prompts. The group votes on the most hilarious jokes." },
        { name: "Quiz Battle", desc: "A fast-paced trivia challenge similar to Trivia Murder Party." },
        { name: "Werewolf", desc: "A social deduction game of lies and deception, similar to Faking It." }
      ],
      faqs: [
        { q: "Does the host need to buy anything?", a: "No, hosting rooms on TUSA is 100% free with no licenses required." },
        { q: "Can we play over Zoom?", a: "Yes, screen share the Stage on Zoom or Discord, and guests can connect from home." },
        { q: "Do we need a console or Steam?", a: "No, TUSA runs entirely in the cloud on web browsers." }
      ]
    }
  },
  "quick-5-minute": {
    ru: {
      title: "Быстрые игры для компании онлайн · Пятиминутные игры",
      description: "Короткие игры на 5 минут для начала встречи или разминки в компании. Словесные игры и викторины онлайн на TUSA.game.",
      kicker: "БЫСТРЫЕ ИГРЫ",
      h1: "Быстрые игры на 5 минут: мгновенный фан",
      intro: "Иногда нужно занять гостей на 5-10 минут перед подачей ужина или началом совещания. TUSA.game предлагает быстрые игры без долгих настроек.",
      body: "Вам не придется долго читать правила. Выбирайте динамичные словесные игры, быстрые викторины или колесо случайного выбора. Игры разработаны так, чтобы закончить раунд за несколько минут и поднять настроение.",
      stepsTitle: "Как запустить быструю игру:",
      steps: [
        "Откройте TUSA.game на телефоне.",
        "Покажите QR-код друзьям для подключения.",
        "Выберите Бомб Пати или Колесо Судьбы и играйте."
      ],
      gamesTitle: "Пятиминутные хиты на TUSA:",
      games: [
        { name: "Бомб Пати (Bomb Party)", desc: "Очень динамичная игра: придумывайте слова за секунды, пока горит фитиль." },
        { name: "Колесо Судьбы (Wheel of Fate)", desc: "Мгновенный розыгрыш фантов, тостов или случайных действий." },
        { name: "Would You Rather (Выбор)", desc: "Быстрое голосование за забавные дилеммы без подсчета сложных очков." }
      ],
      faqs: [
        { q: "Сколько длится один раунд?", a: "В среднем от 3 до 5 минут, идеально для коротких пауз." },
        { q: "Нужна ли подготовка?", a: "Нет, игры готовы к запуску сразу после подключения." },
        { q: "Это бесплатно?", a: "Да, все короткие режимы полностью бесплатны." }
      ]
    },
    en: {
      title: "Quick 5 Minute Party Games Online · Fast Icebreakers | TUSA.game",
      description: "Discover fast 5 minute party games to play with friends. Try quick trivia, word games, and wheel spins free in web browser.",
      kicker: "QUICK 5 MINUTE GAMES",
      h1: "Quick 5-Minute Games for Instant Fun",
      intro: "Need to fill a 10-minute gap before dinner or warm up a team meeting? TUSA.game provides quick games that require no rule explanations.",
      body: "Get straight to the fun. Choose high-speed word association, fast voting polls, or random spins. Rounds last just a few minutes, making them perfect meeting warmers.",
      stepsTitle: "How to run a quick 5-minute game:",
      steps: [
        "Launch TUSA.game on your phone.",
        "Have your friends scan the QR code to join.",
        "Select Bomb Party or Would You Rather and start playing."
      ],
      gamesTitle: "Top 5-Minute Games:",
      games: [
        { name: "Bomb Party", desc: "A high-speed syllable game. Think of words before the fuse burns out." },
        { name: "Wheel of Fate", desc: "Spin the wheel for instant dares, jokes, or random selections." },
        { name: "Would You Rather", desc: "Fast voting on absurd choices. Promotes instant conversation." }
      ],
      faqs: [
        { q: "How long is a typical round?", a: "Between 3 and 5 minutes, allowing you to stop whenever you want." },
        { q: "Do we need custom settings?", a: "No, the games are pre-configured to start immediately." },
        { q: "Is it free?", a: "Yes, completely free." }
      ]
    }
  },
  "drinking": {
    ru: {
      title: "Алкогольные игры для компании онлайн 18+ · TUSA.game",
      description: "Веселые игры для вечеринок с алкоголем (drinking games) на русском. Правда или Дело и Я никогда не онлайн на TUSA.game.",
      kicker: "АЛКОГОЛЬНЫЕ ИГРЫ",
      h1: "Игры с алкоголем для компании: веселые правила",
      intro: "Ищете способ разнообразить алкогольную вечеринку с друзьями? TUSA.game предлагает классические форматы drinking games, перенесенные на экран телефона.",
      body: "Вам больше не нужны стаканы с картами и размокшие бумажки. Включайте «Я никогда не» или «Правда или Дело» со встроенными веселыми заданиями. Узнавайте секреты друзей и веселитесь в реальном времени.",
      stepsTitle: "Как начать алкогольную игру:",
      steps: [
        "Откройте TUSA.game и выберите режим 18+.",
        "Раздайте гостям ссылку для подключения.",
        "Начните первый раунд и следуйте правилам на экране."
      ],
      gamesTitle: "Алкогольные хиты на TUSA:",
      games: [
        { name: "Я никогда не (Never Have I Ever)", desc: "Классическое правило: тот, кто совершал действие, делает глоток." },
        { name: "Правда или Дело (Truth or Dare)", desc: "Выполняйте безумные действия или пейте в качестве штрафа." },
        { name: "Would You Rather (Выбор)", desc: "Группа выбирает варианты; меньшинство делает глоток." }
      ],
      faqs: [
        { q: "Является ли алкоголь обязательным?", a: "Нет, вы можете заменить алкоголь на любые другие шуточные наказания или очки." },
        { q: "Конфиденциальны ли наши ответы?", a: "Да, мы не храним введенные данные после завершения игровой сессии." },
        { q: "Это бесплатно?", a: "Да, все взрослые и алкогольные режимы полностью бесплатны." }
      ]
    },
    en: {
      title: "Drinking Party Games Online 18+ · Mobile Controller | TUSA.game",
      description: "Best drinking games for house parties and group night outs. Play Never Have I Ever and Truth or Dare free on TUSA.game.",
      kicker: "DRINKING PARTY GAMES",
      h1: "Fun and Interactive Drinking Games for Groups",
      intro: "Looking to liven up a house party or pre-game? TUSA.game offers digital-first drinking games with mobile controllers.",
      body: "Forget about wet playing cards or lost dice. Choose classic drinking rules like 'Never Have I Ever' or 'Truth or Dare' loaded with hundreds of funny and provocative prompts.",
      stepsTitle: "How to set up a drinking game night:",
      steps: [
        "Open a room on TUSA.game and select a mature deck.",
        "Have guests scan the QR code to join from their seats.",
        "Start the round and let the game handle the rules."
      ],
      gamesTitle: "Top Drinking Games on TUSA:",
      games: [
        { name: "Never Have I Ever", desc: "The ultimate classic. Anyone who has done the action takes a sip." },
        { name: "Truth or Dare", desc: "Complete dares or take a penalty sip instead." },
        { name: "Would You Rather", desc: "Vote on tough scenarios. The minority voters take a drink." }
      ],
      faqs: [
        { q: "Is alcohol required to play?", a: "No, you can play with score points, dares, or any non-alcoholic drinks." },
        { q: "Is there an age filter?", a: "Yes, you can toggle the adult content filters on or off in the room settings." },
        { q: "Are these games free?", a: "Yes, completely free with no paywalls." }
      ]
    }
  }
};
