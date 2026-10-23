import type { VocabularyItem } from '../types';

export const vocabularyData: VocabularyItem[] = [
  // Fruits
  { word: 'Apple', category: 'fruits', description: 'A round, red fruit that is crunchy and sweet!', emoji: '🍎' },
  { word: 'Banana', category: 'fruits', description: 'A long, yellow fruit that monkeys love!', emoji: '🍌' },
  { word: 'Orange', category: 'fruits', description: 'A round, orange fruit full of juice!', emoji: '🍊' },
  { word: 'Grapes', category: 'fruits', description: 'Small, round fruits that grow in bunches!', emoji: '🍇' },
  { word: 'Strawberry', category: 'fruits', description: 'A small, red fruit with tiny seeds!', emoji: '🍓' },
  { word: 'Watermelon', category: 'fruits', description: 'A big, green fruit that is red and juicy inside!', emoji: '🍉' },

  // Vegetables
  { word: 'Carrot', category: 'vegetables', description: 'An orange vegetable that rabbits love!', emoji: '🥕' },
  { word: 'Broccoli', category: 'vegetables', description: 'A green vegetable that looks like a tiny tree!', emoji: '🥦' },
  { word: 'Corn', category: 'vegetables', description: 'A yellow vegetable with lots of kernels!', emoji: '🌽' },
  { word: 'Tomato', category: 'vegetables', description: 'A red vegetable used in ketchup and sauce!', emoji: '🍅' },

  // Food
  { word: 'Bread', category: 'food', description: 'Soft and warm, perfect for sandwiches!', emoji: '🍞' },
  { word: 'Pizza', category: 'food', description: 'A round, cheesy treat everyone loves!', emoji: '🍕' },
  { word: 'Ice cream', category: 'food', description: 'A cold, sweet dessert in many flavours!', emoji: '🍦' },
  { word: 'Cake', category: 'food', description: 'A sweet treat for birthdays and celebrations!', emoji: '🎂' },
  { word: 'Cookie', category: 'food', description: 'A small, sweet biscuit to munch on!', emoji: '🍪' },

  // Vehicles
  { word: 'Car', category: 'vehicles', description: 'A vehicle with four wheels for driving!', emoji: '🚗' },
  { word: 'Bus', category: 'vehicles', description: 'A big vehicle that carries many people!', emoji: '🚌' },
  { word: 'Train', category: 'vehicles', description: 'A long vehicle that rides on tracks!', emoji: '🚂' },
  { word: 'Airplane', category: 'vehicles', description: 'A vehicle that flies high in the sky!', emoji: '✈️' },
  { word: 'Boat', category: 'vehicles', description: 'A vehicle that floats and moves on water!', emoji: '⛵' },
  { word: 'Bicycle', category: 'vehicles', description: 'A vehicle with two wheels you pedal!', emoji: '🚲' },

  // Colors
  { word: 'Red', category: 'colors', description: 'The colour of fire trucks and strawberries!', emoji: '🔴' },
  { word: 'Blue', category: 'colors', description: 'The colour of the sky and the ocean!', emoji: '🔵' },
  { word: 'Green', category: 'colors', description: 'The colour of grass and leaves!', emoji: '🟢' },
  { word: 'Yellow', category: 'colors', description: 'The colour of the sun and bananas!', emoji: '🟡' },
  { word: 'Purple', category: 'colors', description: 'The colour of grapes and amethysts!', emoji: '🟣' },
  { word: 'Orange', category: 'colors', description: 'The colour of oranges and sunsets!', emoji: '🟠' },

  // Shapes
  { word: 'Circle', category: 'shapes', description: 'A round shape with no corners!', emoji: '⭕' },
  { word: 'Square', category: 'shapes', description: 'A shape with four equal sides!', emoji: '⬜' },
  { word: 'Triangle', category: 'shapes', description: 'A shape with three sides and three corners!', emoji: '🔺' },
  { word: 'Star', category: 'shapes', description: 'A shape that twinkles in the night sky!', emoji: '⭐' },
  { word: 'Heart', category: 'shapes', description: 'A shape that means love!', emoji: '❤️' },

  // Body parts
  { word: 'Hand', category: 'body', description: 'We use our hands to hold things and wave hello!', emoji: '✋' },
  { word: 'Eye', category: 'body', description: 'We use our eyes to see the world!', emoji: '👁️' },
  { word: 'Ear', category: 'body', description: 'We use our ears to hear sounds!', emoji: '👂' },
  { word: 'Nose', category: 'body', description: 'We use our nose to smell flowers!', emoji: '👃' },
  { word: 'Foot', category: 'body', description: 'We use our feet to walk and run!', emoji: '🦶' },

  // Household
  { word: 'Chair', category: 'household', description: 'We sit on chairs at the table!', emoji: '🪑' },
  { word: 'Table', category: 'household', description: 'We eat food and do homework on tables!', emoji: '🪵' },
  { word: 'Lamp', category: 'household', description: 'A lamp gives us light to see at night!', emoji: '💡' },
  { word: 'Clock', category: 'household', description: 'A clock tells us what time it is!', emoji: '🕐' },
  { word: 'Book', category: 'household', description: 'We read stories and learn from books!', emoji: '📖' },

  // Nature
  { word: 'Sun', category: 'nature', description: 'The sun gives us light and warmth!', emoji: '☀️' },
  { word: 'Moon', category: 'nature', description: 'The moon shines bright at night!', emoji: '🌙' },
  { word: 'Tree', category: 'nature', description: 'Trees give us shade and fresh air!', emoji: '🌳' },
  { word: 'Flower', category: 'nature', description: 'Flowers are colourful and smell wonderful!', emoji: '🌸' },
  { word: 'Rain', category: 'nature', description: 'Rain falls from the clouds to water the plants!', emoji: '🌧️' },
  { word: 'Rainbow', category: 'nature', description: 'A rainbow appears after the rain with beautiful colours!', emoji: '🌈' },
];

export const categoryLabels: Record<string, string> = {
  fruits: 'Fruits',
  vegetables: 'Vegetables',
  food: 'Food',
  vehicles: 'Vehicles',
  colors: 'Colours',
  shapes: 'Shapes',
  body: 'Body Parts',
  household: 'Household',
  nature: 'Nature',
};

export const categoryEmojis: Record<string, string> = {
  fruits: '🍎',
  vegetables: '🥕',
  food: '🍕',
  vehicles: '🚗',
  colors: '🎨',
  shapes: '🔷',
  body: '🧍',
  household: '🏠',
  nature: '🌿',
};
