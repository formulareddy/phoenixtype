export type TestMode = "time" | "words" | "quote" | "zen" | "custom";
export type CharStatus = "correct" | "incorrect" | "extra" | "missing" | "untyped";
export type Difficulty = "normal" | "expert" | "master";

export type Theme = string;

export const themes: { name: string; label: string; colors: string[] }[] = [
  { name: "8008", label: "8008", colors: ["#333a45", "#f44c7f", "#f44c7f", "#939eae", "#2e343d", "#e9ecf0", "#da3333", "#791717", "#c5da33", "#849224"] },
  { name: "9009", label: "9009", colors: ["#eeebe2", "#080909", "#7fa480", "#99947f", "#d3cfc1", "#080909", "#c87e74", "#a56961", "#c87e74", "#a56961"] },
  { name: "80s_after_dark", label: "80s after dark", colors: ["#1b1d36", "#fca6d1", "#99d6ea", "#99d6ea", "#17182c", "#e1e7ec", "#fffb85", "#fffb85", "#fffb85", "#fffb85"] },
  { name: "aether", label: "aether", colors: ["#101820", "#eedaea", "#eedaea", "#cf6bdd", "#292136", "#eedaea", "#ff5253", "#e3002b", "#ff5253", "#e3002b"] },
  { name: "alduin", label: "alduin", colors: ["#1c1c1c", "#dfd7af", "#e3e3e3", "#444444", "#242424", "#f5f3ed", "#af5f5f", "#4d2113", "#af5f5f", "#4d2113"] },
  { name: "alpine", label: "alpine", colors: ["#6c687f", "#ffffff", "#585568", "#9994b8", "#77738c", "#ffffff", "#e32b2b", "#a62626", "#e32b2b", "#a62626"] },
  { name: "anti_hero", label: "anti hero", colors: ["#00002e", "#ffadad", "#ffffff", "#ff3d8b", "#060548", "#f1deef", "#8fecff", "#558cab", "#8fecff", "#558cab"] },
  { name: "arch", label: "arch", colors: ["#0c0d11", "#7ebab5", "#7ebab5", "#454864", "#171a25", "#f6f5f5", "#ff4754", "#b02a33", "#ff4754", "#b02a33"] },
  { name: "aurora", label: "aurora", colors: ["#011926", "#00e980", "#00e980", "#245c69", "#000c13", "#fff", "#b94da1", "#9b3a76", "#b94da1", "#9b3a76"] },
  { name: "beach", label: "beach", colors: ["#ffeead", "#96ceb4", "#ffcc5c", "#ffcc5c", "#f7dc8f", "#5b7869", "#ff6f69", "#ff6f69", "#ff6f69", "#ff6f69"] },
  { name: "bento", label: "bento", colors: ["#2d394d", "#ff7a90", "#ff7a90", "#4a768d", "#263041", "#fffaf8", "#ee2a3a", "#f04040", "#fc2032", "#f04040"] },
  { name: "bingsu", label: "bingsu", colors: ["#b8a7aa", "#83616e", "#ebe6ea", "#48373d", "#ab989e", "#ebe6ea", "#921341", "#640b2c", "#921341", "#640b2c"] },
  { name: "bliss", label: "bliss", colors: ["#262727", "#f0d3c9", "#f0d3c9", "#665957", "#343231", "#fff", "#bd4141", "#883434", "#bd4141", "#883434"] },
  { name: "blue_dolphin", label: "blue dolphin", colors: ["#003950", "#ffcefb", "#00bcd4", "#00e4ff", "#014961", "#82eaff", "#ffbde6", "#ff8188", "#d1a5fd", "#ff8188"] },
  { name: "blueberry_dark", label: "blueberry dark", colors: ["#212b42", "#add7ff", "#962f7e", "#5c7da5", "#1b2334", "#91b4d5", "#df4576", "#d996ac", "#df4576", "#d996ac"] },
  { name: "blueberry_light", label: "blueberry light", colors: ["#dae0f5", "#506477", "#df4576", "#92a4be", "#c1c7df", "#678198", "#df4576", "#d996ac", "#df4576", "#d996ac"] },
  { name: "botanical", label: "botanical", colors: ["#7b9c98", "#eaf1f3", "#abc6c4", "#495755", "#72908d", "#eaf1f3", "#f6c9b4", "#f59a71", "#f6c9b4", "#f59a71"] },
  { name: "bouquet", label: "bouquet", colors: ["#173f35", "#eaa09c", "#eaa09c", "#408e7b", "#1f4e43", "#e9e0d2", "#d44729", "#8f2f19", "#d44729", "#8f2f19"] },
  { name: "breeze", label: "breeze", colors: ["#e8d5c4", "#7d67a9", "#7d67a9", "#3a98b9", "#f6e6da", "#1b4c5e", "#7d67a9", "#9f3e6d", "#f9f871", "#67dfa1"] },
  { name: "bushido", label: "bushido", colors: ["#242933", "#ec4c56", "#ec4c56", "#596172", "#1c222d", "#f6f0e9", "#ec4c56", "#9b333a", "#ecdc4c", "#bdb03d"] },
  { name: "cafe", label: "cafe", colors: ["#ceb18d", "#14120f", "#14120f", "#d4d2d1", "#bba180", "#14120f", "#c82931", "#ac1823", "#c82931", "#ac1823"] },
  { name: "camping", label: "camping", colors: ["#faf1e4", "#618c56", "#618c56", "#c2b8aa", "#e7dccb", "#3c403b", "#ad4f4e", "#7e3a39", "#ad4f4e", "#7e3a39"] },
  { name: "carbon", label: "carbon", colors: ["#313131", "#f66e0d", "#f66e0d", "#616161", "#2b2b2b", "#f5e6c8", "#e72d2d", "#7e2a33", "#e72d2d", "#7e2a33"] },
  { name: "catppuccin", label: "catppuccin", colors: ["#1e1e2e", "#cba6f7", "#f2cdcd", "#7f849c", "#181825", "#cdd6f4", "#f38ba8", "#eba0ac", "#f38ba8", "#eba0ac"] },
  { name: "chaos_theory", label: "chaos theory", colors: ["#141221", "#fd77d7", "#dde5ed", "#676e8a", "#1e1d2f", "#dde5ed", "#fd77d7", "#b03c47", "#ff5869", "#b03c47"] },
  { name: "cheesecake", label: "cheesecake", colors: ["#fdf0d5", "#8e2949", "#892948", "#d91c81", "#f3e2bf", "#3a3335", "#5cf074", "#5cf074", "#5cf074", "#5cf074"] },
  { name: "cherry_blossom", label: "cherry blossom", colors: ["#323437", "#d65ccc", "#ffffff", "#787d82", "#2d2f31", "#d1d0c5", "#ca4754", "#d32738", "#ec182d", "#6e0c16"] },
  { name: "comfy", label: "comfy", colors: ["#4a5b6e", "#f8cdc6", "#9ec1cc", "#9ec1cc", "#425366", "#f5efee", "#c9465e", "#c9465e", "#c9465e", "#c9465e"] },
  { name: "copper", label: "copper", colors: ["#442f29", "#b46a55", "#c25c42", "#7ebab5", "#50362e", "#e7e0de", "#a32424", "#ec0909", "#a32424", "#ec0909"] },
  { name: "creamsicle", label: "creamsicle", colors: ["#ff9869", "#fcfcf8", "#fcfcf8", "#ff661f", "#fe8954", "#fcfcf8", "#6a0dad", "#6a0dad", "#6a0dad", "#6a0dad"] },
  { name: "cy_red", label: "cy red", colors: ["#6e2626", "#e55050", "#541d1d", "#ff6060", "#3f1616", "#ffaaaa", "#919fd9", "#4d5d9e", "#919fd9", "#4d5d9e"] },
  { name: "cyberspace", label: "cyberspace", colors: ["#181c18", "#00ce7c", "#00ce7c", "#9578d3", "#131613", "#c2fbe1", "#ff5f5f", "#d22a2a", "#ff5f5f", "#d22a2a"] },
  { name: "dark", label: "dark", colors: ["#111", "#eee", "#eee", "#444", "#191919", "#eee", "#da3333", "#791717", "#da3333", "#791717"] },
  { name: "dark_magic_girl", label: "dark magic girl", colors: ["#091f2c", "#f5b1cc", "#a288d9", "#93e8d3", "#071823", "#a288d9", "#e45c96", "#e45c96", "#00b398", "#e45c96"] },
  { name: "dark_note", label: "dark note", colors: ["#1f1f1f", "#f2c17b", "#e3dce0", "#768f95", "#141414", "#d2dff4", "#ff0000", "#588498", "#ff0000", "#588498"] },
  { name: "darling", label: "darling", colors: ["#fec8cd", "#ffffff", "#ffffff", "#a30000", "#f2babd", "#ffffff", "#2e7dde", "#2e7dde", "#2e7dde", "#2e7dde"] },
  { name: "deku", label: "deku", colors: ["#058b8c", "#b63530", "#b63530", "#255458", "#0e7d7e", "#f7f2ea", "#b63530", "#530e0e", "#ddca1f", "#8f8610"] },
  { name: "desert_oasis", label: "desert oasis", colors: ["#fff2d5", "#d19d01", "#3a87fe", "#0061fe", "#eddebc", "#332800", "#76bb40", "#4e7a27", "#76bb40", "#4e7a27"] },
  { name: "dev", label: "dev", colors: ["#1b2028", "#23a9d5", "#4b5975", "#4b5975", "#151a21", "#ccccb5", "#b81b2c", "#84131f", "#b81b2c", "#84131f"] },
  { name: "diner", label: "diner", colors: ["#537997", "#c3af5b", "#ad5145", "#445c7f", "#4d6f8b", "#dfdbc8", "#ad5145", "#7e2a33", "#ad5145", "#7e2a33"] },
  { name: "dino", label: "dino", colors: ["#ffffff", "#40d672", "#40d672", "#d5d5d5", "#cafad8", "#1d221f", "#ff5f5f", "#d22a2a", "#ff5f5f", "#d22a2a"] },
  { name: "discord", label: "discord", colors: ["#313338", "#5a65ea", "#5a65ea", "#565861", "#2b2d31", "#dcdee3", "#df4f4b", "#df4f4b", "#df4f4b", "#df4f4b"] },
  { name: "dmg", label: "dmg", colors: ["#dadbdc", "#ae185e", "#384693", "#3846b1", "#bec1d2", "#414141", "#ae185e", "#93335c", "#80a053", "#306230"] },
  { name: "dollar", label: "dollar", colors: ["#e4e4d4", "#6b886b", "#424643", "#8a9b69", "#cbd0bf", "#555a56", "#d60000", "#f68484", "#ca4754", "#7e2a33"] },
  { name: "dots", label: "dots", colors: ["#121520", "#fff", "#fff", "#676e8a", "#1b1e2c", "#fff", "#da3333", "#791717", "#da3333", "#791717"] },
  { name: "dracula", label: "dracula", colors: ["#282a36", "#bd93f9", "#bd93f9", "#6272a4", "#20222c", "#f8f8f2", "#ff5555", "#f1fa8c", "#ff5555", "#f1fa8c"] },
  { name: "drowning", label: "drowning", colors: ["#191826", "#4a6fb5", "#4f85e8", "#50688c", "#1e1f2f", "#9393a7", "#be555f", "#7e2a33", "#be555f", "#7e2a33"] },
  { name: "dualshot", label: "dualshot", colors: ["#737373", "#212222", "#212222", "#aaaaaa", "#646464", "#212222", "#c82931", "#ac1823", "#c82931", "#ac1823"] },
  { name: "earthsong", label: "earthsong", colors: ["#292521", "#509452", "#1298ba", "#f5ae2d", "#1d1b18", "#e6c7a8", "#7e2a33", "#ff645a", "#7e2a33", "#ff645a"] },
  { name: "everblush", label: "everblush", colors: ["#141b1e", "#8ccf7e", "#6cbfbf", "#838887", "#232a2d", "#dadada", "#e57474", "#ef7e7e", "#e57474", "#ef7e7e"] },
  { name: "evil_eye", label: "evil eye", colors: ["#0084c2", "#f7f2ea", "#f7f2ea", "#01589f", "#0c79be", "#171718", "#ca4754", "#7e2a33", "#ca4754", "#7e2a33"] },
  { name: "ez_mode", label: "ez mode", colors: ["#0068c6", "#fa62d5", "#4ddb47", "#138bf7", "#005bac", "#ffffff", "#4ddb47", "#42ba3b", "#4ddb47", "#42ba3b"] },
  { name: "fire", label: "fire", colors: ["#0f0000", "#b31313", "#b31313", "#683434", "#200a0a", "#ffffff", "#2f3cb6", "#434a8f", "#2f3cb6", "#434a8f"] },
  { name: "fledgling", label: "fledgling", colors: ["#3b363f", "#fc6e83", "#474747", "#8e5568", "#332e38", "#e6d5d3", "#f52443", "#bd001c", "#ff0a2f", "#000000"] },
  { name: "fleuriste", label: "fleuriste", colors: ["#c6b294", "#405a52", "#8a785b", "#64374d", "#b4a389", "#091914", "#990000", "#8a1414", "#a63a3a", "#bd4c4c"] },
  { name: "floret", label: "floret", colors: ["#00272c", "#ffdd6d", "#c3bd40", "#779097", "#173033", "#e5e5e5", "#8a4000", "#00708d", "#8a4000", "#628b96"] },
  { name: "froyo", label: "froyo", colors: ["#e1dacb", "#7b7d7d", "#7b7d7d", "#b29c5e", "#d3cdc1", "#7b7d7d", "#f28578", "#d56558", "#f28578", "#d56558"] },
  { name: "frozen_llama", label: "frozen llama", colors: ["#9bf2ea", "#6d44a6", "#ffffff", "#b690fd", "#7fe7dd", "#ffffff", "#e42629", "#e42629", "#e42629", "#e42629"] },
  { name: "fruit_chew", label: "fruit chew", colors: ["#d6d3d6", "#5c1e5f", "#b92221", "#b49cb5", "#cabfca", "#282528", "#bd2621", "#a62626", "#bd2621", "#a62626"] },
  { name: "fundamentals", label: "fundamentals", colors: ["#727474", "#7fa482", "#196378", "#cac4be", "#666868", "#131313", "#5e477c", "#413157", "#5e477c", "#413157"] },
  { name: "future_funk", label: "future funk", colors: ["#2e1a47", "#f7f2ea", "#f7f2ea", "#c18fff", "#27173c", "#f7f2ea", "#f04e98", "#bd1c66", "#f04e98", "#bd1c66"] },
  { name: "github", label: "github", colors: ["#212830", "#41ce5c", "#41ce5c", "#788386", "#141b23", "#ccdae6", "#c23e3a", "#c23e3a", "#c23e3a", "#c23e3a"] },
  { name: "godspeed", label: "godspeed", colors: ["#eae4cf", "#9abbcd", "#f4d476", "#ada998", "#ded9c9", "#646669", "#ca4754", "#7e2a33", "#ca4754", "#7e2a33"] },
  { name: "graen", label: "graen", colors: ["#303c36", "#a59682", "#601420", "#181d1a", "#36453c", "#a59682", "#601420", "#5f0715", "#601420", "#5f0715"] },
  { name: "grand_prix", label: "grand prix", colors: ["#36475c", "#c0d036", "#c0d036", "#5c6c80", "#42536b", "#c1c7d7", "#fc5727", "#fc5727", "#fc5727", "#fc5727"] },
  { name: "grape", label: "grape", colors: ["#2c003e", "#ff8f00", "#ff8f00", "#6e225e", "#1f002d", "#fff", "#ff4081", "#bf2054", "#ff4081", "#bf2054"] },
  { name: "gruvbox_dark", label: "gruvbox dark", colors: ["#282828", "#d79921", "#fabd2f", "#665c54", "#212121", "#ebdbb2", "#fb4934", "#cc241d", "#cc241d", "#9d0006"] },
  { name: "gruvbox_light", label: "gruvbox light", colors: ["#fbf1c7", "#689d6a", "#689d6a", "#a89984", "#daceae", "#3c3836", "#cc241d", "#9d0006", "#cc241d", "#9d0006"] },
  { name: "hammerhead", label: "hammerhead", colors: ["#030613", "#4fcdb9", "#4fcdb9", "#213c53", "#0a1928", "#e2f1f5", "#e32b2b", "#a62626", "#e32b2b", "#a62626"] },
  { name: "hanok", label: "hanok", colors: ["#d8d2c3", "#513a2a", "#513a2a", "#8b6f5c", "#cdc0af", "#393b3b", "#ca4754", "#7e2a33", "#ca4754", "#7e2a33"] },
  { name: "hedge", label: "hedge", colors: ["#415e31", "#6a994e", "#f2efbb", "#ede5b4", "#38502a", "#f7f1d6", "#ca3d3f", "#782832", "#e76f51", "#f4a261"] },
  { name: "honey", label: "honey", colors: ["#f2aa00", "#fff546", "#795200", "#a66b00", "#e19e00", "#f3eecb", "#df3333", "#6d1f1f", "#df3333", "#6d1f1f"] },
  { name: "horizon", label: "horizon", colors: ["#1c1e26", "#c4a88a", "#bbbbbb", "#db886f", "#17181f", "#bbbbbb", "#d55170", "#ff3d3d", "#d55170", "#d55170"] },
  { name: "husqy", label: "husqy", colors: ["#000000", "#c58aff", "#c58aff", "#972fff", "#1e001e", "#ebd7ff", "#da3333", "#791717", "#da3333", "#791717"] },
  { name: "iceberg_dark", label: "iceberg dark", colors: ["#161821", "#84a0c6", "#d2d4de", "#595e76", "#232531", "#c6c8d1", "#e27878", "#e2a478", "#e27878", "#e2a478"] },
  { name: "iceberg_light", label: "iceberg light", colors: ["#e8e9ec", "#2d539e", "#262a3f", "#adb1c4", "#ccceda", "#33374c", "#cc517a", "#cc3768", "#cc517a", "#cc3768"] },
  { name: "incognito", label: "incognito", colors: ["#0e0e0e", "#ff9900", "#ff9900", "#555555", "#151515", "#c6c6c6", "#e44545", "#e44545", "#b13535", "#b13535"] },
  { name: "ishtar", label: "ishtar", colors: ["#202020", "#91170c", "#c58940", "#847869", "#272727", "#fae1c3", "#bb1e10", "#791717", "#c5da33", "#849224"] },
  { name: "iv_clover", label: "iv clover", colors: ["#a0a0a0", "#573e40", "#8d8d8d", "#353535", "#bebebe", "#3b2d3b", "#937173", "#987678", "#ad8d60", "#b7976a"] },
  { name: "iv_spade", label: "iv spade", colors: ["#0c0c0c", "#b7976a", "#bebebe", "#404040", "#121212", "#d3c2c3", "#9d7b7d", "#a78587", "#b7976a", "#c1a174"] },
  { name: "joker", label: "joker", colors: ["#1a0e25", "#99de1e", "#99de1e", "#7554a3", "#14081f", "#e9e2f5", "#e32b2b", "#a62626", "#e32b2b", "#a62626"] },
  { name: "laser", label: "laser", colors: ["#221b44", "#009eaf", "#009eaf", "#b82356", "#1e173b", "#dbe7e8", "#a8d400", "#668000", "#a8d400", "#668000"] },
  { name: "lavender", label: "lavender", colors: ["#ada6c2", "#e4e3e9", "#e4e3e9", "#e4e3e9", "#a19bb9", "#2f2a41", "#ca4754", "#7e2a33", "#ca4754", "#7e2a33"] },
  { name: "leather", label: "leather", colors: ["#a86948", "#ffe4bc", "#ef6d49", "#81482b", "#9a5f3f", "#ffe4bc", "#ca4754", "#7e2a33", "#ca4754", "#7e2a33"] },
  { name: "lil_dragon", label: "lil dragon", colors: ["#ebe1ef", "#8a5bd6", "#212b43", "#a28db8", "#dac7e2", "#212b43", "#f794ca", "#f279c2", "#f794ca", "#f279c2"] },
  { name: "lilac_mist", label: "lilac mist", colors: ["#fffbfe", "#b94189", "#e099d6", "#e094c2", "#ecdcee", "#5c2954", "#ff6f69", "#ff6f69", "#bc7fc0", "#bc41b1"] },
  { name: "lime", label: "lime", colors: ["#7c878e", "#93c247", "#93c247", "#4b5257", "#737d82", "#bfcfdc", "#ea4221", "#7e2a33", "#ea4221", "#7e2a33"] },
  { name: "luna", label: "luna", colors: ["#221c35", "#f67599", "#f67599", "#5a3a7e", "#2f2346", "#ffe3eb", "#efc050", "#c5972c", "#efc050", "#c5972c"] },
  { name: "macroblank", label: "macroblank", colors: ["#b2d2c8", "#c13117", "#766f71", "#717977", "#c6ddd3", "#490909", "#c13117", "#fff5f5", "#fff5f5", "#ffe9c2"] },
  { name: "magic_girl", label: "magic girl", colors: ["#ffffff", "#f5b1cc", "#e45c96", "#93e8d3", "#f2f2f2", "#00ac8c", "#ffe495", "#e45c96", "#ffe485", "#e45c96"] },
  { name: "mashu", label: "mashu", colors: ["#2b2b2c", "#76689a", "#76689a", "#d8a0a6", "#27242c", "#f1e2e4", "#d44729", "#8f2f19", "#d44729", "#8f2f19"] },
  { name: "matcha_moccha", label: "matcha moccha", colors: ["#523525", "#7ec160", "#7ec160", "#9e6749", "#422b1e", "#ecddcc", "#fb4934", "#cc241d", "#fb4934", "#cc241d"] },
  { name: "material", label: "material", colors: ["#263238", "#80cbc4", "#80cbc4", "#4c6772", "#2e3c43", "#e6edf3", "#fb4934", "#cc241d", "#fb4934", "#cc241d"] },
  { name: "matrix", label: "matrix", colors: ["#000000", "#15ff00", "#15ff00", "#006500", "#032000", "#d1ffcd", "#da3333", "#791717", "#da3333", "#791717"] },
  { name: "menthol", label: "menthol", colors: ["#00c18c", "#ffffff", "#99fdd8", "#186544", "#17ae7d", "#ffffff", "#e03c3c", "#b12525", "#e03c3c", "#b12525"] },
  { name: "metaverse", label: "metaverse", colors: ["#232323", "#d82934", "#d82934", "#5e5e5e", "#1d1d1d", "#e8e8e8", "#da3333", "#791717", "#d7da33", "#737917"] },
  { name: "metropolis", label: "metropolis", colors: ["#0f1f2c", "#56c3b7", "#56c3b7", "#326984", "#0b1822", "#e4edf1", "#d44729", "#8f2f19", "#d44729", "#8f2f19"] },
  { name: "mexican", label: "mexican", colors: ["#f8ad34", "#b12189", "#eee", "#333", "#f9b951", "#eee", "#da3333", "#791717", "#da3333", "#791717"] },
  { name: "miami", label: "miami", colors: ["#f35588", "#05dfd7", "#a3f7bf", "#94294c", "#db4979", "#f0e9ec", "#fff591", "#b9b269", "#fff591", "#b9b269"] },
  { name: "miami_nights", label: "miami nights", colors: ["#18181a", "#e4609b", "#e4609b", "#47bac0", "#0f0f10", "#fff", "#fff591", "#b6af68", "#fff591", "#b6af68"] },
  { name: "midnight", label: "midnight", colors: ["#0b0e13", "#60759f", "#60759f", "#394760", "#141a24", "#9fadc6", "#c27070", "#c28b70", "#c27070", "#c28b70"] },
  { name: "milkshake", label: "milkshake", colors: ["#ffffff", "#212b43", "#212b43", "#62cfe6", "#ddeff3", "#212b43", "#f19dac", "#e58c9d", "#f19dac", "#e58c9d"] },
  { name: "mint", label: "mint", colors: ["#05385b", "#5cdb95", "#5cdb95", "#20688a", "#07324e", "#edf5e1", "#f35588", "#a3385a", "#f35588", "#a3385a"] },
  { name: "mizu", label: "mizu", colors: ["#afcbdd", "#fcfbf6", "#fcfbf6", "#85a5bb", "#9fc1d4", "#1a2633", "#bf616a", "#793e44", "#bf616a", "#793e44"] },
  { name: "modern_dolch", label: "modern dolch", colors: ["#2d2e30", "#7eddd3", "#7eddd3", "#54585c", "#242527", "#e3e6eb", "#d36a7b", "#994154", "#d36a7b", "#994154"] },
  { name: "modern_dolch_light", label: "modern dolch light", colors: ["#dbdbdb", "#8fd1c3", "#8fd1c3", "#a3a2a2", "#e8e8e8", "#454545", "#ea8a9a", "#e0556d", "#ea8a9a", "#e0556d"] },
  { name: "modern_ink", label: "modern ink", colors: ["#ffffff", "#ff360d", "#ff0000", "#b7b7b7", "#ececec", "#000000", "#d70000", "#b00000", "#000000", "#000000"] },
  { name: "monokai", label: "monokai", colors: ["#272822", "#a6e22e", "#66d9ef", "#e6db74", "#1f201b", "#e2e2dc", "#f92672", "#fd971f", "#f92672", "#fd971f"] },
  { name: "moonlight", label: "moonlight", colors: ["#191f28", "#c69f68", "#8f744b", "#4b5975", "#141a22", "#ccccb5", "#b81b2c", "#84131f", "#b81b2c", "#84131f"] },
  { name: "mountain", label: "mountain", colors: ["#0f0f0f", "#e7e7e7", "#f5f5f5", "#4c4c4c", "#1a1a1a", "#e7e7e7", "#ac8c8c", "#c49ea0", "#aca98a", "#c4c19e"] },
  { name: "mr_sleeves", label: "mr sleeves", colors: ["#d1d7da", "#daa99b", "#8fadc9", "#9a9fa1", "#bfcbd1", "#1d1d1d", "#bf6464", "#793e44", "#8fadc9", "#667c91"] },
  { name: "ms_cupcakes", label: "ms cupcakes", colors: ["#ffffff", "#5ed5f3", "#303030", "#d64090", "#edf8fa", "#0a282f", "#a4dd32", "#90bd34", "#a4dd32", "#87b330"] },
  { name: "muted", label: "muted", colors: ["#525252", "#c5b4e3", "#b1e4e3", "#939eae", "#494949", "#b1e4e3", "#edc1cd", "#edc1cd", "#edc1cd", "#edc1cd"] },
  { name: "nautilus", label: "nautilus", colors: ["#132237", "#ebb723", "#ebb723", "#0b4c6c", "#0e1a29", "#1cbaac", "#da3333", "#791717", "#da3333", "#791717"] },
  { name: "nebula", label: "nebula", colors: ["#212135", "#be3c88", "#78c729", "#19b3b8", "#191928", "#838686", "#ca4754", "#7e2a33", "#ca4754", "#7e2a33"] },
  { name: "night_runner", label: "night runner", colors: ["#212121", "#feff04", "#feff04", "#5c4a9c", "#1a1a1a", "#e8e8e8", "#da3333", "#791717", "#da3333", "#791717"] },
  { name: "nord", label: "nord", colors: ["#242933", "#88c0d0", "#eceff4", "#929aaa", "#2e3440", "#d8dee9", "#bf616a", "#793e44", "#bf616a", "#793e44"] },
  { name: "nord_light", label: "nord light", colors: ["#eceff4", "#8fbcbb", "#8fbcbb", "#6a7791", "#d8dee9", "#8fbcbb", "#bf616a", "#793e44", "#bf616a", "#793e44"] },
  { name: "norse", label: "norse", colors: ["#242425", "#2b5f6d", "#2b5f6d", "#505b5e", "#303333", "#ccc2b1", "#7e2a2a", "#771d1d", "#ca4754", "#7e2a33"] },
  { name: "oblivion", label: "oblivion", colors: ["#313231", "#a5a096", "#a5a096", "#5d6263", "#3a3b3b", "#f7f5f1", "#dd452e", "#9e3423", "#dd452e", "#9e3423"] },
  { name: "olive", label: "olive", colors: ["#e9e5cc", "#92946f", "#92946f", "#b7b39e", "#d4cfbc", "#373731", "#cf2f2f", "#a22929", "#cf2f2f", "#a22929"] },
  { name: "olivia", label: "olivia", colors: ["#1c1b1d", "#deaf9d", "#deaf9d", "#4e3e3e", "#262223", "#f2efed", "#bf616a", "#793e44", "#e03d4e", "#aa2f3b"] },
  { name: "onedark", label: "onedark", colors: ["#2f343f", "#61afef", "#61afef", "#eceff4", "#262b34", "#98c379", "#e06c75", "#d62436", "#d62436", "#ff0019"] },
  { name: "our_theme", label: "our theme", colors: ["#ce1226", "#fcd116", "#fcd116", "#6d0f19", "#9f1020", "#ffffff", "#fcd116", "#fcd116", "#1672fc", "#1672fc"] },
  { name: "pale_nimbus", label: "pale nimbus", colors: ["#433e4c", "#94ffc2", "#9efffd", "#ffaca3", "#694f5e", "#feffdb", "#ff5c5c", "#ff0000", "#ff3874", "#c2386f"] },
  { name: "paper", label: "paper", colors: ["#eeeeee", "#444444", "#444444", "#b2b2b2", "#dddddd", "#444444", "#d70000", "#d70000", "#d70000", "#d70000"] },
  { name: "passion_fruit", label: "passion fruit", colors: ["#7c2142", "#f4a3b4", "#ffffff", "#9994b8", "#833c5e", "#ffffff", "#deb80b", "#deb80b", "#deb80b", "#deb80b"] },
  { name: "pastel", label: "pastel", colors: ["#e0b2bd", "#fbf4b6", "#fbf4b6", "#b4e9ff", "#d29fab", "#6d5c6f", "#ff6961", "#c23b22", "#ff6961", "#c23b22"] },
  { name: "peach_blossom", label: "peach blossom", colors: ["#292929", "#99b898", "#616161", "#616161", "#2a363b", "#fecea8", "#ff6961", "#e84a5f", "#ff6961", "#e84a5f"] },
  { name: "peaches", label: "peaches", colors: ["#e0d7c1", "#dd7a5f", "#dd7a5f", "#e7b28e", "#e2caaf", "#5f4c41", "#ff6961", "#c23b22", "#ff6961", "#c23b22"] },
  { name: "phantom", label: "phantom", colors: ["#001", "#7aa2f7", "#bb9af7", "#414868", "#24283b", "#c0caf5", "#f7768e", "#db4b4b", "#ff7a93", "#ff9e64"] },
  { name: "pink_lemonade", label: "pink lemonade", colors: ["#f6d992", "#f6a192", "#fcfcf8", "#f6b092", "#f6cc93", "#fcfcf8", "#ff6f69", "#ff6f69", "#ff6f69", "#ff6f69"] },
  { name: "pulse", label: "pulse", colors: ["#181818", "#17b8bd", "#17b8bd", "#53565a", "#121212", "#e5f4f4", "#da3333", "#791717", "#da3333", "#791717"] },
  { name: "purpleish", label: "purpleish", colors: ["#1e1e32", "#7a52cc", "#7a52cc", "#5c5c99", "#181829", "#a3a3cc", "#ff6666", "#ff6666", "#ff6666", "#ff6666"] },
  { name: "rainbow_trail", label: "rainbow trail", colors: ["#f5f5f5", "#363636", "#0d0d0d", "#4f4f4f", "#e0e0e0", "#1f1f1f", "#ff0008", "#ff0008", "#ff0008", "#ff0008"] },
  { name: "red_dragon", label: "red dragon", colors: ["#1a0b0c", "#ff3a32", "#ff3a32", "#e2a528", "#0e0506", "#4a4d4e", "#771b1f", "#591317", "#771b1f", "#591317"] },
  { name: "red_samurai", label: "red samurai", colors: ["#84202c", "#c79e6e", "#c79e6e", "#55131b", "#751d26", "#e2dad0", "#33bbda", "#176b79", "#33bbda", "#176779"] },
  { name: "repose_dark", label: "repose dark", colors: ["#2f3338", "#d6d2bc", "#d6d2bc", "#8f8e84", "#3a3c3d", "#d6d2bc", "#ff4a59", "#c43c53", "#ff4a59", "#c43c53"] },
  { name: "repose_light", label: "repose light", colors: ["#efead0", "#5f605e", "#5f605e", "#8f8e84", "#dbd6c4", "#333538", "#c43c53", "#a52632", "#c43c53", "#a52632"] },
  { name: "retro", label: "retro", colors: ["#dad3c1", "#1d1b17", "#1d1b17", "#918b7d", "#c8c3b3", "#1d1b17", "#bf616a", "#793e44", "#bf616a", "#793e44"] },
  { name: "retrocast", label: "retrocast", colors: ["#07737a", "#88dbdf", "#88dbdf", "#f3e03b", "#26858b", "#ffffff", "#ff585d", "#c04455", "#ff585d", "#c04455"] },
  { name: "rgb", label: "rgb", colors: ["#111", "#eee", "#eee", "#444", "#1a1a1a", "#eee", "#eee", "#b3b3b3", "#eee", "#b3b3b3"] },
  { name: "rose_pine", label: "rose pine", colors: ["#1f1d27", "#9ccfd8", "#f6c177", "#c4a7e7", "#282533", "#e0def4", "#eb6f92", "#ebbcba", "#eb6f92", "#ebbcba"] },
  { name: "rose_pine_dawn", label: "rose pine dawn", colors: ["#fffaf3", "#56949f", "#ea9d34", "#c4a7e7", "#f0e9df", "#286983", "#b4637a", "#d7827e", "#b4637a", "#d7827e"] },
  { name: "rose_pine_moon", label: "rose pine moon", colors: ["#2a273f", "#9ccfd8", "#f6c177", "#c4a7e7", "#211f32", "#e0def4", "#eb6f92", "#ebbcba", "#eb6f92", "#ebbcba"] },
  { name: "rudy", label: "rudy", colors: ["#1a2b3e", "#af8f5c", "#af8f5c", "#3a506c", "#152231", "#c9c8bf", "#bf616a", "#793e44", "#bf616a", "#793e44"] },
  { name: "ryujinscales", label: "ryujinscales", colors: ["#081426", "#f17754", "#ef6d49", "#ffbc90", "#040e1d", "#ffe4bc", "#ca4754", "#7e2a33", "#ca4754", "#7e2a33"] },
  { name: "serika", label: "serika", colors: ["#e1e1e3", "#e2b714", "#e2b714", "#aaaeb3", "#d1d3d8", "#323437", "#da3333", "#791717", "#da3333", "#791717"] },
  { name: "serika_dark", label: "serika dark", colors: ["#323437", "#e2b714", "#e2b714", "#646669", "#2c2e31", "#d1d0c5", "#ca4754", "#7e2a33", "#ca4754", "#7e2a33"] },
  { name: "sewing_tin", label: "sewing tin", colors: ["#241963", "#f2ce83", "#fbdb8c", "#446ad5", "#2a277a", "#ffffff", "#c6915e", "#c6915e", "#c6915e", "#c6915e"] },
  { name: "sewing_tin_light", label: "sewing tin light", colors: ["#ffffff", "#2d2076", "#fbdb8c", "#385eca", "#c8cedf", "#2d2076", "#f2ce83", "#f2ce83", "#f2ce83", "#f2ce83"] },
  { name: "shadow", label: "shadow", colors: ["#000", "#eee", "#eee", "#444", "#171717", "#eee", "#fff", "#d8d8d8", "#fff", "#d8d8d8"] },
  { name: "shoko", label: "shoko", colors: ["#ced7e0", "#81c4dd", "#81c4dd", "#7599b1", "#b7cada", "#3b4c58", "#bf616a", "#793e44", "#bf616a", "#793e44"] },
  { name: "slambook", label: "slambook", colors: ["#fffdde", "#03001c", "#367e18", "#1c82adc4", "#c6dce4", "#13005a", "#f900bf", "#ce1212", "#ce1212", "#3ec70b"] },
  { name: "snes", label: "snes", colors: ["#bfbec2", "#553d94", "#523793", "#9f8ad4", "#b5b0c2", "#2e2e2e", "#ca4754", "#7e2a33", "#ca4754", "#7e2a33"] },
  { name: "soaring_skies", label: "soaring skies", colors: ["#fff9f2", "#55c6f0", "#1e107a", "#1e107a", "#e5ddd4", "#1d1e1e", "#fb5745", "#b03c30", "#fb5745", "#b03c30"] },
  { name: "solarized_dark", label: "solarized dark", colors: ["#002b36", "#859900", "#dc322f", "#2aa198", "#00222b", "#268bd2", "#d33682", "#9b225c", "#d33682", "#9b225c"] },
  { name: "solarized_light", label: "solarized light", colors: ["#fdf6e3", "#859900", "#dc322f", "#2aa198", "#e2d8be", "#181819", "#d33682", "#9b225c", "#d33682", "#9b225c"] },
  { name: "solarized_osaka", label: "solarized osaka", colors: ["#00141a", "#859900", "#b58900", "#2aa198", "#00222b", "#eee8d5", "#dc322f", "#9b225c", "#d33682", "#9b225c"] },
  { name: "sonokai", label: "sonokai", colors: ["#2c2e34", "#9ed072", "#f38c71", "#e7c664", "#232429", "#e2e2e3", "#fc5d7c", "#ecac6a", "#fc5d7c", "#ecac6a"] },
  { name: "spiderman", label: "spiderman", colors: ["#0d1219", "#e23636", "#e23636", "#0476f2", "#0b1c2e", "#f0f0f0", "#0476f2", "#0353a8", "#0476f2", "#0353a8"] },
  { name: "stealth", label: "stealth", colors: ["#010203", "#383e42", "#e25303", "#5e676e", "#121212", "#383e42", "#e25303", "#73280c", "#e25303", "#73280c"] },
  { name: "strawberry", label: "strawberry", colors: ["#f37f83", "#fcfcf8", "#fcfcf8", "#e53c58", "#ef6e77", "#fcfcf8", "#fcd23f", "#d7ae1e", "#fcd23f", "#d7ae1e"] },
  { name: "striker", label: "striker", colors: ["#124883", "#d7dcda", "#d7dcda", "#0f2d4e", "#104176", "#d6dbd9", "#fb4934", "#cc241d", "#fb4934", "#cc241d"] },
  { name: "suisei", label: "suisei", colors: ["#3b4a62", "#bef0ff", "#bef0ff", "#fe9841", "#313e55", "#dbdeeb", "#ed2939", "#ce122c", "#ed2939", "#ce122c"] },
  { name: "sunset", label: "sunset", colors: ["#211e24", "#f79777", "#ffca99", "#5b578e", "#161319", "#f4e0c9", "#66a1ff", "#376ca4", "#66a1ff", "#376ca4"] },
  { name: "superuser", label: "superuser", colors: ["#262a33", "#43ffaf", "#43ffaf", "#526777", "#1f232c", "#e5f7ef", "#ff5f5f", "#d22a2a", "#ff5f5f", "#d22a2a"] },
  { name: "sweden", label: "sweden", colors: ["#0058a3", "#ffcc02", "#b5b5b5", "#57abdb", "#024f8e", "#ffffff", "#e74040", "#a22f2f", "#f56674", "#e33546"] },
  { name: "tangerine", label: "tangerine", colors: ["#ffede0", "#fe5503", "#5d8500", "#ff9562", "#fdd3bf", "#3d1705", "#7fb500", "#5f8700", "#7fb500", "#5f8700"] },
  { name: "taro", label: "taro", colors: ["#b3baff", "#130f1a", "#00e9e5", "#6f6c91", "#a3a7df", "#130f1a", "#ffe23e", "#fff1c3", "#ffe23e", "#fff1c3"] },
  { name: "terminal", label: "terminal", colors: ["#191a1b", "#79a617", "#79a617", "#48494b", "#141516", "#e7eae0", "#a61717", "#731010", "#a61717", "#731010"] },
  { name: "terra", label: "terra", colors: ["#0c100e", "#89c559", "#89c559", "#436029", "#0f1d18", "#f0edd1", "#d3ca78", "#89844d", "#d3ca78", "#89844d"] },
  { name: "terrazzo", label: "terrazzo", colors: ["#f1e5da", "#e0794e", "#e0794e", "#688e8f", "#e3d3c6", "#023e3b", "#a01034", "#a01034", "#a01034", "#a01034"] },
  { name: "terror_below", label: "terror below", colors: ["#0b1e1a", "#66ac92", "#66ac92", "#015c53", "#041715", "#dceae5", "#bf616a", "#793e44", "#bf616a", "#793e44"] },
  { name: "tiramisu", label: "tiramisu", colors: ["#cfc6b9", "#c0976f", "#7d5448", "#c0976f", "#d0bca7", "#7d5448", "#e9632d", "#e9632d", "#e9632d", "#e9632d"] },
  { name: "trackday", label: "trackday", colors: ["#464d66", "#e0513e", "#475782", "#5c7eb9", "#3d4359", "#cfcfcf", "#e44e4e", "#fd3f3f", "#ff2e2e", "#bb2525"] },
  { name: "trance", label: "trance", colors: ["#00021b", "#e51376", "#e51376", "#3c4c79", "#18214c", "#fff", "#02d3b0", "#3f887c", "#02d3b0", "#3f887c"] },
  { name: "tron_orange", label: "tron orange", colors: ["#0d1c1c", "#f0e800", "#f0e800", "#ff6600", "#9c9191", "#ffffff", "#ff0000", "#ff0000", "#ff0000", "#ff0000"] },
  { name: "vaporwave", label: "vaporwave", colors: ["#a4a7ea", "#e368da", "#28cafe", "#7c7faf", "#989bd9", "#f1ebf1", "#573ca9", "#3d2b77", "#28cafe", "#25a9ce"] },
  { name: "vesper", label: "vesper", colors: ["#101010", "#ffc799", "#99ffe4", "#a0a0a0", "#1c1c1c", "#ffffff", "#ff8080", "#b25959", "#ff8080", "#b25959"] },
  { name: "vesper_light", label: "vesper light", colors: ["#ffffff", "#fb7100", "#067a6e", "#a0a0a0", "#fff8f4", "#000000", "#ed2839", "#ff6c72", "#ed2839", "#ff6c72"] },
  { name: "viridescent", label: "viridescent", colors: ["#2c3333", "#95d5b2", "#f0d3c9", "#84a98c", "#232828", "#e9f5db", "#ff4646", "#ab2f2f", "#bd4141", "#883434"] },
  { name: "voc", label: "voc", colors: ["#190618", "#e0caac", "#e0caac", "#4c1e48", "#2c0c28", "#eeeae4", "#af3735", "#7e2a29", "#af3735", "#7e2a29"] },
  { name: "vscode", label: "vscode", colors: ["#1e1e1e", "#007acc", "#569cd6", "#4d4d4d", "#191919", "#d4d4d4", "#f44747", "#f44747", "#f44747", "#f44747"] },
  { name: "watermelon", label: "watermelon", colors: ["#1f4437", "#d6686f", "#d6686f", "#3e7a65", "#244d3f", "#cdc6bc", "#c82931", "#ac1823", "#c82931", "#ac1823"] },
  { name: "wavez", label: "wavez", colors: ["#1c292f", "#6bde3b", "#6bde3b", "#1f5e6b", "#1b3238", "#e9efe6", "#ca4754", "#7e2a33", "#ca4754", "#7e2a33"] },
  { name: "witch_girl", label: "witch girl", colors: ["#f3dbda", "#56786a", "#afc5bd", "#ddb4a7", "#e7c8be", "#56786a", "#b29a91", "#b29a91", "#b29a91", "#b29a91"] },
];
export type CaretStyle = "off" | "default" | "block" | "outline" | "underline" | "carrot" | "banana" | "monkey";
export type TimerStyle = "off" | "bar" | "text" | "mini" | "flash_text" | "flash_mini";
export type KeymapMode = "off" | "static" | "react" | "next";
export type KeymapStyle = "staggered" | "alice" | "matrix" | "split" | "split_matrix" | "steno" | "steno_matrix";
export type KeymapLayout = "overrideSync" | "qwerty" | "dvorak" | "colemak" | "workman";
export type KeymapLegendStyle = "lowercase" | "uppercase" | "blank" | "dynamic";
export type KeymapShowTopRow = "always" | "layout" | "never";
export const KNOWN_FONTS = [
  "Roboto_Mono", "Noto_Naskh_Arabic", "Source_Code_Pro", "IBM_Plex_Sans",
  "Inconsolata", "Fira_Code", "JetBrains_Mono", "Roboto", "Montserrat",
  "Titillium_Web", "Lexend_Deca", "Comic_Sans_MS", "Oxygen", "Nunito",
  "Itim", "Courier", "Comfortaa", "Coming_Soon", "Atkinson_Hyperlegible",
  "Lato", "Lalezar", "Boon", "Open_Dyslexic", "Ubuntu", "Ubuntu_Mono",
  "Georgia", "Cascadia_Mono", "IBM_Plex_Mono", "Overpass_Mono", "Hack",
  "CommitMono", "Mononoki", "Parkinsans", "Geist", "Sarabun", "Kanit",
  "Geist_Mono", "Iosevka", "Proto", "Adwaita_Mono", "Inter_Tight",
  "Space_Grotesk", "Noto_Sans_Lao", "monospace",
] as const;
export type FontFamily = (typeof KNOWN_FONTS)[number] | (string & {});
export type RandomTheme = "off" | "on" | "fav" | "light" | "dark" | "custom" | "auto";
export type StopOnError = "off" | "word" | "letter";
export type ConfidenceMode = "off" | "on" | "max";
export type RepeatQuotes = "off" | "typing";
export type LiveStyle = "off" | "mini" | "text";
export type SmoothCaret = "off" | "slow" | "medium" | "fast";
export type SingleListCommandLine = "manual" | "on";
export type PlaySoundOnError = "off" | "1" | "2" | "3" | "4";
export type PlaySoundOnClick = "off" | "1" | "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9" | "10" | "11" | "12" | "13" | "14" | "15" | "16" | "17" | "18" | "19" | "20" | "21" | "22" | "23" | "24" | "25" | "26";
export type SoundVolume = number;
export type PaceCaret = "off" | "average" | "pb" | "tagPb" | "last" | "custom" | "daily";
export type HighlightMode = "off" | "letter" | "word" | "next_word" | "next_two_words" | "next_three_words";
export type TapeMode = "off" | "letter" | "word";
export type TypedEffect = "keep" | "hide" | "fade" | "dots";
export type TypingSpeedUnit = "wpm" | "cpm" | "wps" | "cps" | "wph";
export type MinWpm = "off" | "custom";
export type MinAcc = "off" | "custom";
export type MinBurst = "off" | "fixed" | "flex";
export type OppositeShiftMode = "off" | "on" | "keymap";
export type CustomBackgroundSize = "cover" | "contain" | "max";
export type ShowAverage = "off" | "speed" | "acc" | "both";
export type Ads = "off" | "result" | "on" | "sellout";
export type CompositDisplay = "off" | "below" | "replace";
export type IndicateTypos = "off" | "below" | "replace" | "both";
export type TimerColor = "black" | "sub" | "text" | "main";
export type TimerOpacity = "0.25" | "0.5" | "0.75" | "1";
export type PlayTimeWarning = "off" | "1" | "3" | "5" | "10";
export type QuickRestart = "off" | "tab" | "esc" | "enter";
export type KeymapSize = number;

export interface TestConfig {
  mode: TestMode;
  time: number;
  wordCount: number;
  punctuation: boolean;
  numbers: boolean;
  difficulty: Difficulty;
}

export type ReplayAction = "correctLetter" | "incorrectLetter" | "backWord" | "submitCorrectWord" | "submitErrorWord" | "setLetterIndex";

export interface ReplayEvent {
  action: ReplayAction;
  value?: string | number;
  time: number;
}

export interface TestStats {
  wpm: number;
  raw: number;
  accuracy: number;
  correctChars: number;
  incorrectChars: number;
  extraChars: number;
  missedChars: number;
  totalKeystrokes: number;
  elapsed: number;
  consistency: number;
  keyConsistency: number;
  chartData: ChartDataPoint[];
  wordHistory: WordResult[];
  mode: string;
  language: string;
  punctuation: boolean;
  numbers: boolean;
  difficulty: string;
  replayData?: ReplayEvent[];
  replayWords?: string[];
}

export interface ChartDataPoint {
  wpm: number;
  raw: number;
  burst: number;
  err: number;
}

export interface WordResult {
  text: string;
  typed: string;
  status: "correct" | "incorrect";
  speed?: number;
  category?: "fast" | "ok" | "slow" | "missed";
}

export interface WordData {
  text: string;
  typed: string;
  status: "upcoming" | "active" | "correct" | "error";
  activeAt?: number;
  doneAt?: number;
}

export interface FullConfig extends TestConfig {
  quoteLength: number[];
  language: string;
  burstHeatmap: boolean;
  stopOnError: StopOnError;
  confidenceMode: ConfidenceMode;
  repeatQuotes: RepeatQuotes;
  difficulty: Difficulty;
  quickRestart: QuickRestart;
  blindMode: boolean;
  alwaysShowWordsHistory: boolean;
  singleListCommandLine: SingleListCommandLine;
  minWpm: MinWpm;
  minWpmCustomSpeed: number;
  minAcc: MinAcc;
  minAccCustom: number;
  minBurst: MinBurst;
  minBurstCustomSpeed: number;
  britishEnglish: boolean;
  funbox: string[];
  customLayoutfluid: string[];
  customPolyglot: string[];
  freedomMode: boolean;
  strictSpace: boolean;
  oppositeShiftMode: OppositeShiftMode;
  quickEnd: boolean;
  indicateTypos: IndicateTypos;
  compositionDisplay: CompositDisplay;
  hideExtraLetters: boolean;
  lazyMode: boolean;
  layout: string;
  codeUnindentOnBackspace: boolean;
  soundVolume: number;
  playSoundOnClick: PlaySoundOnClick;
  playSoundOnError: PlaySoundOnError;
  playTimeWarning: PlayTimeWarning;
  smoothCaret: SmoothCaret;
  caretStyle: CaretStyle;
  paceCaret: PaceCaret;
  paceCaretCustomSpeed: number;
  paceCaretStyle: CaretStyle;
  repeatedPace: boolean;
  timerStyle: TimerStyle;
  liveSpeedStyle: LiveStyle;
  liveAccStyle: LiveStyle;
  liveBurstStyle: LiveStyle;
  timerColor: TimerColor;
  timerOpacity: TimerOpacity;
  highlightMode: HighlightMode;
  typedEffect: TypedEffect;
  tapeMode: TapeMode;
  tapeMargin: number;
  smoothLineScroll: boolean;
  showAllLines: boolean;
  alwaysShowDecimalPlaces: boolean;
  typingSpeedUnit: TypingSpeedUnit;
  startGraphsAtZero: boolean;
  maxLineWidth: number;
  fontSize: number;
  fontFamily: FontFamily;
  keymapMode: KeymapMode;
  keymapLayout: KeymapLayout;
  keymapStyle: KeymapStyle;
  keymapLegendStyle: KeymapLegendStyle;
  keymapShowTopRow: KeymapShowTopRow;
  keymapSize: KeymapSize;
  flipTestColors: boolean;
  colorfulMode: boolean;
  customBackground: string;
  customBackgroundSize: CustomBackgroundSize;
  customBackgroundFilter: [number, number, number, number];
  autoSwitchTheme: boolean;
  themeLight: Theme;
  themeDark: Theme;
  randomTheme: RandomTheme;
  favThemes: Theme[];
  theme: Theme;
  customTheme: boolean;
  customThemeColors: string[];
  showKeyTips: boolean;
  showOutOfFocusWarning: boolean;
  capsLockWarning: boolean;
  showAverage: ShowAverage;
  showPb: boolean;
  monkey: boolean;
  monkeyPowerLevel: "off" | "1" | "2" | "3" | "4";
  ads: Ads;
}

export function getDefaultConfig(): FullConfig {
  return {
    mode: "time",
    time: 30,
    wordCount: 50,
    punctuation: false,
    numbers: false,
    difficulty: "normal",
    quoteLength: [0, 1, 2, 3],
    language: "english",
    burstHeatmap: false,
    stopOnError: "off",
    confidenceMode: "off",
    repeatQuotes: "off",
    quickRestart: "off",
    blindMode: false,
    alwaysShowWordsHistory: false,
    singleListCommandLine: "on",
    minWpm: "off",
    minWpmCustomSpeed: 0,
    minAcc: "off",
    minAccCustom: 0,
    minBurst: "off",
    minBurstCustomSpeed: 0,
    britishEnglish: false,
    funbox: [],
    customLayoutfluid: [],
    customPolyglot: [],
    freedomMode: false,
    strictSpace: false,
    oppositeShiftMode: "off",
    quickEnd: false,
    indicateTypos: "off",
    compositionDisplay: "replace",
    hideExtraLetters: false,
    lazyMode: false,
    layout: "default",
    codeUnindentOnBackspace: false,
    soundVolume: 0.5,
    playSoundOnClick: "off",
    playSoundOnError: "off",
    playTimeWarning: "off",
    smoothCaret: "medium",
    caretStyle: "default",
    paceCaret: "off",
    paceCaretCustomSpeed: 100,
    paceCaretStyle: "default",
    repeatedPace: true,
    timerStyle: "mini",
    liveSpeedStyle: "off",
    liveAccStyle: "off",
    liveBurstStyle: "off",
    timerColor: "main",
    timerOpacity: "1",
    highlightMode: "off",
    typedEffect: "keep",
    tapeMode: "off",
    tapeMargin: 50,
    smoothLineScroll: false,
    showAllLines: false,
    alwaysShowDecimalPlaces: false,
    typingSpeedUnit: "wpm",
    startGraphsAtZero: true,
    maxLineWidth: 0,
    fontSize: 2,
    fontFamily: "Roboto_Mono",
    keymapMode: "off",
    keymapLayout: "overrideSync",
    keymapStyle: "staggered",
    keymapLegendStyle: "lowercase",
    keymapShowTopRow: "layout",
    keymapSize: 1,
    flipTestColors: false,
    colorfulMode: false,
    customBackground: "",
    customBackgroundSize: "cover",
    customBackgroundFilter: [0, 0, 0, 0],
    autoSwitchTheme: false,
    themeLight: "serika",
    themeDark: "serika_dark",
    randomTheme: "off",
    favThemes: [],
    theme: "serika_dark",
    customTheme: false,
    customThemeColors: ["#323437", "#e2b714", "#e2b714", "#646669", "#2c2e31", "#d1d0c5", "#ca4754", "#7e2a33", "#ca4754", "#7e2a33"],
    showKeyTips: true,
    showOutOfFocusWarning: true,
    capsLockWarning: true,
    showAverage: "off",
    showPb: true,
    monkey: false,
    monkeyPowerLevel: "off",
    ads: "off",
  };
}
