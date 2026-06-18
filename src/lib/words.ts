const COMMON_WORDS = [
  "the","be","to","of","and","a","in","that","have","i","it","for","not","on","with","he","as","you","do","at",
  "this","but","his","by","from","they","we","say","her","she","or","an","will","my","one","all","would","there","their","what",
  "so","up","out","if","about","who","get","which","go","me","when","make","can","like","time","no","just","him","know","take",
  "people","into","year","your","good","some","could","them","see","other","than","then","now","look","only","come","its","over","think","also",
  "back","after","use","two","how","our","work","first","well","way","even","new","want","because","any","these","give","day","most","us",
  "great","between","need","large","often","hand","high","place","small","under","long","right","still","last","public","same","tell","own","every","three",
  "down","should","while","house","world","old","state","much","keep","try","start","kind","hand","picture","again","change","off","play","spell",
  "air","away","animal","house","point","page","letter","mother","answer","found","study","still","learn","plant","food","sun","four","thought","let","head",
  "stand","above","color","face","wood","main","friend","began","idea","bird","near","build","self","earth","father","head","stand","own","page","should",
  "country","found","answer","school","grow","study","still","learn","plant","food","sun","four","between","state","keep","eye","never","last","door","between",
  "city","tree","cross","farm","hard","start","might","story","saw","far","sea","draw","left","late","run","while","press","close","night","real",
  "life","few","north","open","seem","together","next","white","children","begin","walk","example","ease","paper","group","always","music","those","both","mark",
  "book","letter","until","mile","river","car","feet","care","second","enough","plain","girl","usual","young","ready","above","ever","red","list","though",
  "feel","talk","bird","soon","body","dog","family","direct","pose","leave","song","measure","door","product","black","short","number","class","wind","question",
  "happen","complete","ship","area","half","rock","order","fire","south","problem","piece","told","knew","pass","since","top","whole","king","street","inch",
  "multiply","nothing","course","stay","wheel","full","force","blue","object","decide","surface","deep","moon","island","foot","system","busy","test","record","boat",
  "common","gold","possible","plane","stead","dry","wonder","laugh","thousand","ago","ran","check","game","shape","equate","hot","miss","brought","heat","snow",
  "tire","bring","yes","distant","fill","east","paint","language","among","grand","ball","yet","wave","drop","heart","am","present","heavy","dance","engine",
  "position","arm","wide","sail","material","size","vary","settle","speak","weight","general","ice","matter","circle","pair","include","divide","syllable","felt","perhaps",
  "pick","sudden","count","square","reason","length","represent","art","subject","region","energy","hunt","probable","bed","brother","egg","ride","cell","believe","fraction",
  "forest","sit","race","window","store","summer","train","sleep","prove","lone","leg","exercise","wall","catch","mount","wish","sky","board","joy","winter",
  "sat","written","wild","instrument","kept","glass","grass","cow","job","edge","sign","visit","past","soft","fun","bright","gas","weather","month","million",
  "bear","finish","happy","hope","flower","clothe","strange","gone","jump","baby","eight","village","meet","root","buy","raise","solve","metal","whether","push",
  "seven","paragraph","third","shall","held","hair","describe","cook","floor","either","result","burn","hill","safe","cat","century","consider","type","law","bit",
  "coast","copy","phrase","silent","tall","sand","soil","roll","temperature","finger","industry","value","fight","lie","beat","excite","natural","view","sense","ear",
  "else","quite","broke","case","middle","kill","son","lake","moment","scale","loud","spring","observe","child","straight","consonant","nation","dictionary","milk","speed"
];

const PUNCTUATION = [",", ".", "'", ";", "!", "?"];

export function generateWords(count: number, usePunctuation = false, useNumbers = false): string[] {
  const result: string[] = [];
  for (let i = 0; i < count; i++) {
    let word: string;
    let attempts = 0;
    do {
      word = COMMON_WORDS[Math.floor(Math.random() * COMMON_WORDS.length)];
      attempts++;
    } while (result.length > 0 && attempts < 100 && (
      result[result.length - 1] === word ||
      result[result.length - 1][result[result.length - 1].length - 1] === word[0]
    ));

    if (useNumbers && Math.random() < 0.12) {
      let numWord: string;
      let numAttempts = 0;
      do {
        numWord = String(Math.floor(Math.random() * 900) + 100);
        numAttempts++;
      } while (numAttempts < 100 && result.length > 0 && result[result.length - 1] === numWord);
      word = numWord;
    }

    if (usePunctuation && Math.random() < 0.25) {
      word += PUNCTUATION[Math.floor(Math.random() * PUNCTUATION.length)];
    }

    result.push(word);
  }
  return result;
}
