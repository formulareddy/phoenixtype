export interface AvatarDef {
  id: number;
  name: string;
  src: string;
  premium?: boolean;
  pet?: boolean;
  animal?: boolean;
}

const CDN = "https://cdn.jsdelivr.net/gh/alohe/avatars/png/";

const AVATAR_STYLES: [string, number, string][] = [
  ["vibrent", 27, "Vibrant"],
  ["memo", 35, "Anime"],
  ["upstream", 22, "Upstream"],
  ["notion", 15, "Notion"],
  ["toon", 10, "Toon"],
  ["bluey", 10, "Bluey"],
  ["teams", 9, "Teams"],
  ["3d", 5, "3D"],
];

const DICEBEAR_STYLES: [string, string][] = [
  ["adventurer", "Adventurer"],
  ["avataaars", "Avataaars"],
  ["lorelei", "Lorelei"],
  ["pixel-art", "Pixel"],
  ["bottts", "Bottts"],
  ["fun-emoji", "Emoji"],
  ["open-peeps", "Peeps"],
  ["notionists-neutral", "Notionist"],
];

const DICEBEAR_SEEDS = [
  "Aria", "Blake", "Cleo", "Drew", "Elle", "Finn",
  "Gia", "Hale", "Iris", "Jace", "Kira", "Luca",
];

function makeAvatars(): AvatarDef[] {
  const result: AvatarDef[] = [];
  let id = 0;
  for (const [prefix, count, label] of AVATAR_STYLES) {
    for (let i = 1; i <= count; i++) {
      result.push({
        id: id++,
        name: `${label} ${i}`,
        src: `${CDN}${prefix}_${i}.png`,
      });
    }
  }
  for (const [style, label] of DICEBEAR_STYLES) {
    for (const seed of DICEBEAR_SEEDS) {
      result.push({
        id: id++,
        name: `${label} ${seed}`,
        src: `https://api.dicebear.com/10.x/${style}/svg?seed=${seed}`,
      });
    }
  }
  return result;
}

function makePremiumAvatars(startId: number): AvatarDef[] {
  const names = [
    "Alice", "Bob", "Charlie", "Diana", "Ethan", "Fiona", "George", "Hannah", "Ivan", "Julia",
    "Kevin", "Luna", "Mason", "Nora", "Oscar", "Piper", "Quinn", "Rosa", "Sam", "Tina",
    "Uma", "Victor", "Wendy", "Xander", "Yara", "Zane", "Amara", "Blake", "Cora", "Dexter",
    "Eliza", "Finn", "Gia", "Hank", "Iris", "Jake", "Kara", "Liam", "Mila", "Nico",
    "Olive", "Pablo", "Rhea", "Silas", "Tessa", "Ulysses", "Vera", "Wade", "Xena", "Yves",
    "Zara", "Aaron", "Bella", "Caleb", "Demi", "Ellis", "Freya", "Gavin", "Holly", "Isaac",
    "Jade", "Kai", "Leah", "Miles", "Nadia", "Owen", "Paige", "Rex", "Sage", "Theo",
    "Uma", "Vince", "Willa", "Xavi", "Yuki", "Zion", "Aria", "Brady", "Cleo", "Dylan",
    "Eden", "Frank", "Gemma", "Hunter", "Indie", "Jasper", "Kira", "Lance", "Maya", "Nash",
    "Opal", "Pierce", "Romy", "Sean", "Talia", "Uri", "Violet", "Wyatt", "Xia", "Zelda",
  ];
  return names.map((name, i) => ({
    id: startId + i,
    name: `Premium ${name}`,
    src: `/avatars/premium/user-${i + 1}.png`,
    premium: true,
  }));
}

function makePetAvatars(startId: number): AvatarDef[] {
  const pets = [
    "happy","cool","love","sleeping","dancing","coding","astronaut","ninja","rocket","waving",
    "angry","celebrating","clapping","confused","crying","eating","gaming","laughing","magic","meditating",
    "music","painting","reading","running","singing","smile","snow","spring","summer","star",
    "chef","coffee","detective","dj","driving","fishing","flexing","flying","ice-cream","king",
    "lifting","money","photography","pirate","skateboard","telescope","trophy","umbrella","valentine","fire",
    "bored","charging","error","gift","idea","loading","mail","podcast","security","rainbow",
    "bowling","camping","crab-walking","crafting","gardening","hopeful","jealous","skeptical","surprised","yawning",
    "battery-low","disconnected","dizzy","embarrassed","evil","facepalm","grumpy","hallucinating","mindblown","sad",
    "scared","sick","shrug","praying","climbing","superhero","studying","surfing","swimming","yoga",
    "autumn","birthday","christmas","halloween","winter","time-travel",
  ];
  return pets.map((name, i) => ({
    id: startId + i,
    name: `Pet ${name.charAt(0).toUpperCase() + name.slice(1)}`,
    src: `/avatars/pets/clawd-${name}.svg`,
    pet: true,
  }));
}

const ANIMAL_NAMES = [
  "Alligator","Anteater","Armadillo","Auroch","Axolotl","Badger","Bat","Beaver","Buffalo","Camel",
  "Capybara","Chameleon","Cheetah","Chinchilla","Chipmunk","Chupacabra","Cormorant","Coyote","Crow",
  "Dingo","Dinosaur","Dolphin","Duck","Elephant","Ferret","Fox","Frog",
  "Giraffe","Gopher","Grizzly","Hedgehog","Hippo","Hyena","Ibex","Ifrit","Iguana",
  "Jackal","Kangaroo","Koala","Kraken","Lemur","Leopard","Liger","Llama","Manatee","Mink",
  "Monkey","Moose","Narwhal","Orangutan","Otter","Panda","Penguin","Platypus",
  "Python","Quagga","Rabbit","Raccoon","Rhino","Sheep","Shrew","Skunk",
  "Squirrel","Tiger","Turtle","Walrus","Wolf","Wolverine","Wombat",
];

function makeAnimalAvatars(startId: number): AvatarDef[] {
  const result: AvatarDef[] = [];
  let id = startId;
  for (const name of ANIMAL_NAMES) {
    result.push({ id: id++, name, src: `https://anonymous-animals.azurewebsites.net/animal/${name.toLowerCase()}`, animal: true });
  }
  return result;
}

export const AVATARS = makeAvatars();
export const PREMIUM_AVATARS = makePremiumAvatars(AVATARS.length);
export const PET_AVATARS = makePetAvatars(AVATARS.length + PREMIUM_AVATARS.length);
export const ANIMAL_AVATARS = makeAnimalAvatars(AVATARS.length + PREMIUM_AVATARS.length + PET_AVATARS.length);

export const DEFAULT_AVATAR_ID = 0;
