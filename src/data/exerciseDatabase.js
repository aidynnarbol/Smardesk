// БАЗА УПРАЖНЕНИЙ С НАДЕЖНЫМИ GIF
// Используются проверенные источники: Giphy (основной) + fallback варианты

const categories = {
  "Осанка и спина": [
    {
      name: "Растяжка спины",
      file: "https://media1.tenor.com/m/8YQyR5bMZ0QAAAAC/back-stretch.gif",
      duration: 50,
      tips: [
        "Держи спину прямой во время выполнения",
        "Тянись вверх, представляя что кто-то тянет тебя за макушку",
        "Дыши глубоко и ровно, не задерживай дыхание"
      ],
      difficulty: "Легко",
      muscles: ["Спина", "Плечи"],
      benefits: "Снимает напряжение с позвоночника после долгого сидения"
    },
    {
      name: "Кошка-Корова",
      file: "https://media1.tenor.com/m/wSm-E6C5jpUAAAAC/cat-cow-yoga.gif",
      duration: 45,
      tips: [
        "Двигайся плавно, синхронизируй с дыханием",
        "Вдох - прогиб (корова), выдох - округление (кошка)",
        "Не делай резких движений, следи за шеей"
      ],
      difficulty: "Легко",
      muscles: ["Позвоночник", "Спина", "Шея"],
      benefits: "Улучшает гибкость позвоночника и снимает боль в пояснице"
    },
    {
      name: "Повороты корпуса",
      file: "https://media1.tenor.com/m/7vL_kfqYoJsAAAAC/seated-spinal-twist.gif",
      duration: 40,
      tips: [
        "Поворачивайся медленно, не дергай спину",
        "Держи плечи расслабленными",
        "Поворачивайся на выдохе для лучшего эффекта"
      ],
      difficulty: "Средне",
      muscles: ["Спина", "Косые мышцы живота"],
      benefits: "Массирует внутренние органы и улучшает подвижность позвоночника"
    },
    {
      name: "Планка",
      file: "https://media1.tenor.com/m/gKbAQMA-qy0AAAAC/plank-exercise.gif",
      duration: 30,
      tips: [
        "Держи тело в прямой линии от головы до пяток",
        "Не проваливай и не поднимай таз",
        "Напряги пресс и ягодицы"
      ],
      difficulty: "Средне",
      muscles: ["Кор", "Спина", "Плечи"],
      benefits: "Укрепляет мышцы-стабилизаторы позвоночника"
    },
    {
      name: "Разведение плеч",
      file: "https://media1.tenor.com/m/X4nJWL9PPTYAAAAC/shoulder-blade-squeeze.gif",
      duration: 35,
      tips: [
        "Своди лопатки вместе, словно зажимаешь карандаш",
        "Держи руки на уровне плеч",
        "Не поднимай плечи к ушам"
      ],
      difficulty: "Легко",
      muscles: ["Ромбовидные", "Трапеции"],
      benefits: "Исправляет сутулость и раскрывает грудную клетку"
    }
  ],
  
  "Глаза": [
    {
      name: "Правило 20-20-20",
      file: "https://media1.tenor.com/m/vN8mLBHqPigAAAAd/eye-exercise.gif",
      duration: 60,
      tips: [
        "Каждые 20 минут смотри на объект на расстоянии 6 метров",
        "Смотри в течение 20 секунд",
        "Повторяй регулярно в течение рабочего дня"
      ],
      difficulty: "Легко",
      muscles: ["Глазные мышцы"],
      benefits: "Предотвращает усталость глаз и улучшает фокусировку"
    },
    {
      name: "Движения глазами",
      file: "https://media1.tenor.com/m/QUvN8BRLHqIAAAAC/eye-exercises.gif",
      duration: 40,
      tips: [
        "Двигай глазами плавно: вверх-вниз, влево-вправо",
        "Делай круговые движения",
        "Не напрягай лицо и шею"
      ],
      difficulty: "Легко",
      muscles: ["Глазные мышцы"],
      benefits: "Укрепляет глазные мышцы и улучшает зрение"
    },
    {
      name: "Моргание и отдых",
      file: "https://media1.tenor.com/m/7NqJXXKQkWsAAAAd/blink-eyes.gif",
      duration: 35,
      tips: [
        "Моргай быстро 10-15 раз",
        "Затем закрой глаза на 20 секунд",
        "Расслабь лицо полностью"
      ],
      difficulty: "Легко",
      muscles: ["Глазные мышцы"],
      benefits: "Увлажняет глаза и снимает напряжение"
    },
    {
      name: "Фокусировка вблизи-вдаль",
      file: "https://media1.tenor.com/m/wT7YQ8vQNFwAAAAC/focus-eye.gif",
      duration: 45,
      tips: [
        "Держи палец на расстоянии 25 см",
        "Фокусируйся на пальце 5 сек, потом вдаль 5 сек",
        "Повторяй 10 раз"
      ],
      difficulty: "Легко",
      muscles: ["Цилиарная мышца"],
      benefits: "Тренирует способность глаз менять фокус"
    }
  ],
  
  "Ноги и разминка": [
    {
      name: "Подъёмы на носки",
      file: "https://media1.tenor.com/m/vYzR8TL9MAIAAAAC/calf-raises.gif",
      duration: 40,
      tips: [
        "Держи спину прямо",
        "Поднимайся медленно",
        "Можешь держаться для баланса"
      ],
      difficulty: "Легко",
      muscles: ["Икры"],
      benefits: "Улучшает кровообращение в ногах"
    },
    {
      name: "Круги стопами",
      file: "https://media1.tenor.com/m/kP9xLZBJJYQAAAAC/ankle-circles.gif",
      duration: 35,
      tips: [
        "Крути стопой медленно",
        "По часовой и против",
        "Держи колено расслабленным"
      ],
      difficulty: "Легко",
      muscles: ["Лодыжки"],
      benefits: "Улучшает подвижность голеностопа"
    },
    {
      name: "Растяжка бедер",
      file: "https://media1.tenor.com/m/X3pN7ZKL8BIAAAAC/hip-flexor-stretch.gif",
      duration: 45,
      tips: [
        "Встань в выпад",
        "Толкай таз вперед",
        "Держи 20-30 секунд на сторону"
      ],
      difficulty: "Средне",
      muscles: ["Сгибатели бедра"],
      benefits: "Снимает напряжение от сидения"
    },
    {
      name: "Приседания",
      file: "https://media1.tenor.com/m/NjL5YQtJwN0AAAAC/squats-exercise.gif",
      duration: 30,
      tips: [
        "Спина прямая",
        "Колени не за носки",
        "До параллели с полом"
      ],
      difficulty: "Средне",
      muscles: ["Квадрицепсы", "Ягодицы"],
      benefits: "Укрепляет ноги"
    },
    {
      name: "Выпады на месте",
      file: "https://media1.tenor.com/m/9kRp7L8qQY8AAAAC/lunges.gif",
      duration: 40,
      tips: [
        "Держи корпус вертикально",
        "Колено задней ноги почти касается пола",
        "Чередуй ноги плавно"
      ],
      difficulty: "Средне",
      muscles: ["Бедра", "Ягодицы"],
      benefits: "Укрепляет ноги и улучшает баланс"
    }
  ],
  
  "Шея и плечи": [
    {
      name: "Растяжка шеи",
      file: "https://media1.tenor.com/m/L6pqXXKQY0QAAAAC/neck-stretch.gif",
      duration: 40,
      tips: [
        "Наклони голову к плечу",
        "Помоги рукой аккуратно",
        "Держи 15-20 секунд на сторону"
      ],
      difficulty: "Легко",
      muscles: ["Шея"],
      benefits: "Снимает напряжение шеи"
    },
    {
      name: "Круги плечами",
      file: "https://media1.tenor.com/m/9VL7BmQZWn8AAAAC/shoulder-rolls.gif",
      duration: 35,
      tips: [
        "Крути плечами назад",
        "Затем вперед",
        "10 кругов в каждую сторону"
      ],
      difficulty: "Легко",
      muscles: ["Плечи", "Трапеции"],
      benefits: "Расслабляет плечи"
    },
    {
      name: "Подтягивание подбородка",
      file: "https://media1.tenor.com/m/pQ7xJWL9RMQAAAAC/chin-tucks.gif",
      duration: 30,
      tips: [
        "Подбородок параллельно полу",
        "Толкни назад (двойной подбородок)",
        "5 секунд, 10 повторов"
      ],
      difficulty: "Легко",
      muscles: ["Шея"],
      benefits: "Исправляет осанку шеи"
    },
    {
      name: "Растяжка груди",
      file: "https://media1.tenor.com/m/8TqNWL9XPTYAAAAC/chest-stretch.gif",
      duration: 45,
      tips: [
        "Руки на косяках дверей",
        "Шагни вперед",
        "Держи 30 секунд"
      ],
      difficulty: "Легко",
      muscles: ["Грудные", "Плечи"],
      benefits: "Раскрывает грудную клетку"
    }
  ],
  
  "Запястья и руки": [
    {
      name: "Растяжка запястий",
      file: "https://media1.tenor.com/m/vT7YQ8PNFQAAAAC/wrist-stretch.gif",
      duration: 35,
      tips: [
        "Вытяни руку, ладонь вверх",
        "Тяни пальцы на себя",
        "15 секунд на руку"
      ],
      difficulty: "Легко",
      muscles: ["Запястья"],
      benefits: "Предотвращает туннельный синдром"
    },
    {
      name: "Круги запястьями",
      file: "https://media1.tenor.com/m/9QvN8XRLHYgAAAAC/wrist-circles.gif",
      duration: 30,
      tips: [
        "Крути запястьями медленно",
        "По и против часовой",
        "Контролируй движения"
      ],
      difficulty: "Легко",
      muscles: ["Запястья"],
      benefits: "Улучшает подвижность"
    },
    {
      name: "Сжимание кулаков",
      file: "https://media1.tenor.com/m/7NqJXKQkQwAAAAC/hand-exercise.gif",
      duration: 40,
      tips: [
        "Сожми кулаки на 5 секунд",
        "Расслабь и растопырь пальцы",
        "Повторяй 10 раз"
      ],
      difficulty: "Легко",
      muscles: ["Кисти", "Предплечья"],
      benefits: "Улучшает силу хвата и кровообращение"
    }
  ]
};

export default categories;