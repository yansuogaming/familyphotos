// Standard Unicode emoji the family can send. Message content, not interface icons.

export interface EmojiGroup {
  id: string;
  label: string;
  emoji: string[];
}

const split = (s: string) => s.trim().split(/\s+/);

export const EMOJI_GROUPS: EmojiGroup[] = [
  {
    id: "faces",
    label: "Mặt cười",
    emoji: split(`😀 😃 😄 😁 😆 😅 🤣 😂 🙂 🙃 😉 😊 😇 🥰 😍 🤩 😘 😗 😚 😙 😋 😛 😜 🤪 😝 🤗 🤭 🤫 🤔 🤐 🤨 😐 😑 😶 😏 😒 🙄 😬 😌 😔 😪 🤤 😴 😷 🤒 🤕 🤢 🥵 🥶 🥴 😵 🤯 🤠 🥳 😎 🤓 🧐 😕 😟 🙁 😮 😯 😲 😳 🥺 😦 😧 😨 😰 😥 😢 😭 😱 😖 😣 😞 😓 😩 😫 🥱 😤 😡 😠`),
  },
  {
    id: "gestures",
    label: "Cử chỉ",
    emoji: split(`👋 🤚 🖐️ ✋ 🖖 👌 🤌 🤏 ✌️ 🤞 🤟 🤘 🤙 👈 👉 👆 👇 ☝️ 👍 👎 ✊ 👊 🤛 🤜 👏 🙌 👐 🤲 🤝 🙏 ✍️ 💪 🦵 🦶 👂 👃 👀 👁️ 👅 👄`),
  },
  {
    id: "people",
    label: "Người và gia đình",
    emoji: split(`👶 🧒 👦 👧 🧑 👱 👨 🧔 👩 🧓 👴 👵 👪 👨‍👩‍👦 👨‍👩‍👧 👨‍👩‍👧‍👦 👩‍👧 👨‍👧 🤰 🤱 👩‍🍳 👨‍🍳 👩‍🎓 👨‍🎓 👩‍🏫 👨‍🏫 👩‍⚕️ 👨‍⚕️ 👮 👷 🧑‍🌾 🙋 🙆 🙅 🤷 🤦 🙇 💁 🧘 🏃 🚶 💃 🕺`),
  },
  {
    id: "animals",
    label: "Con vật và cây cỏ",
    emoji: split(`🐶 🐱 🐭 🐹 🐰 🦊 🐻 🐼 🐨 🐯 🦁 🐮 🐷 🐸 🐵 🐔 🐧 🐦 🐤 🦆 🦉 🐴 🦄 🐝 🦋 🐌 🐞 🐢 🐍 🐙 🐠 🐟 🐬 🐳 🐘 🦒 🐃 🐓 🐈 🐕 🌸 🌼 🌻 🌹 🌷 🌱 🌿 🍀 🍁 🍂 🌳 🌴 🌵 🌾`),
  },
  {
    id: "food",
    label: "Đồ ăn",
    emoji: split(`🍎 🍊 🍋 🍌 🍉 🍇 🍓 🍈 🍒 🍑 🥭 🍍 🥥 🥝 🍅 🥑 🥦 🥬 🥒 🌶️ 🌽 🥕 🧄 🧅 🥔 🍠 🥐 🍞 🧀 🥚 🍳 🥞 🍗 🍖 🌭 🍔 🍟 🍕 🥪 🍜 🍲 🍛 🍣 🍱 🥟 🍚 🍙 🍘 🥮 🍡 🍧 🍨 🍦 🎂 🍰 🧁 🍫 🍬 🍭 🍩 🍪 🥛 🍵 ☕ 🧃 🧋 🍹`),
  },
  {
    id: "activities",
    label: "Hoạt động và lễ hội",
    emoji: split(`⚽ 🏀 🏈 ⚾ 🎾 🏐 🏓 🏸 🥅 ⛳ 🏊 🚴 🏆 🥇 🥈 🥉 🏅 🎖️ 🎉 🎊 🎈 🎁 🎀 🧧 🏮 🎏 🎐 🎆 🎇 🧨 ✨ 🎄 🎃 🎎 🎨 🎭 🎤 🎧 🎼 🎹 🥁 🎸 🎻 🎲 🧩 🎮 🪁`),
  },
  {
    id: "objects",
    label: "Đồ vật và đi lại",
    emoji: split(`📱 💻 ⌨️ 🖨️ 📷 📸 📹 🎥 📺 📻 ⏰ ⌛ 📚 📖 📝 ✏️ 🖍️ 🖊️ 📒 📓 📎 ✂️ 📌 📍 🎒 👓 🕶️ 👕 👗 👟 🧢 🎓 💡 🔑 🏠 🏡 🏫 🏥 ⛩️ 🛕 🚗 🚕 🚌 🚲 🛵 🚆 ✈️ 🚢 ⛵ 🏖️ 🏝️ ⛰️ 🏕️ 🌅 🌄 🌃`),
  },
  {
    id: "symbols",
    label: "Biểu tượng",
    emoji: split(`❤️ 🧡 💛 💚 💙 💜 🤎 🖤 🤍 💔 ❣️ 💕 💞 💓 💗 💖 💘 💝 ⭐ 🌟 💫 ☀️ 🌤️ ⛅ 🌧️ ⛈️ 🌈 ❄️ ☃️ 🔥 💧 🌊 ✅ ☑️ ❌ ❓ ❗ 💯 🔔 🎵 💤 💬 💭 🆗 🆕 🔝`),
  },
];

export const QUICK_REACTIONS = ["❤️", "😂", "😮", "😢", "👍", "🙏"];

const KEY = "fp-emoji-recent";

export function recentEmoji(): string[] {
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? "[]") as string[];
  } catch {
    return [];
  }
}

export function rememberEmoji(e: string) {
  try {
    localStorage.setItem(KEY, JSON.stringify([e, ...recentEmoji().filter((x) => x !== e)].slice(0, 24)));
  } catch {}
}
