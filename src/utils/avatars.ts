// A selection of simple avatar URLs using DiceBear avatars API
export const avatarOptions = [
  "https://api.dicebear.com/7.x/bottts/svg?seed=1",
  "https://api.dicebear.com/7.x/bottts/svg?seed=2",
  "https://api.dicebear.com/7.x/bottts/svg?seed=3",
  "https://api.dicebear.com/7.x/bottts/svg?seed=4",
  "https://api.dicebear.com/7.x/bottts/svg?seed=5",
  "https://api.dicebear.com/7.x/bottts/svg?seed=6",
  "https://api.dicebear.com/7.x/bottts/svg?seed=7",
  "https://api.dicebear.com/7.x/bottts/svg?seed=8",
  "https://api.dicebear.com/7.x/bottts/svg?seed=9",
  "https://api.dicebear.com/7.x/bottts/svg?seed=10",
];

// Get a random avatar URL from the options
export const getRandomAvatarUrl = (): string => {
  const randomIndex = Math.floor(Math.random() * avatarOptions.length);
  return avatarOptions[randomIndex];
};
