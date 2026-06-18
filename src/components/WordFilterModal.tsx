import { createSignal, Show } from "solid-js";
import { showNoticeNotification } from "../lib/notifications";

type IncomingData = { splitText: string[]; set: boolean } | null;

interface Props {
  onData: (data: IncomingData) => void;
  onClose: () => void;
}

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

export default function WordFilterModal(props: Props) {
  const [include, setInclude] = createSignal("");
  const [exclude, setExclude] = createSignal("");
  const [minLen, setMinLen] = createSignal("");
  const [maxLen, setMaxLen] = createSignal("");
  const [exactMatch, setExactMatch] = createSignal(false);

  function filter(exact: boolean) {
    const inclRaw = include().trim();
    const incl = inclRaw.replace(/\s+/g, "|");
    const excl = exclude().trim().replace(/\s+/g, "|");
    if (exactMatch() && incl === "") {
      showNoticeNotification("Include field is required for exact match");
      return;
    }
    const reIncl = exactMatch()
      ? new RegExp(`^[${incl}]+$`, "i")
      : incl ? new RegExp(incl, "i") : null;
    const reExcl = excl ? new RegExp(excl, "i") : null;
    const max = maxLen() ? parseInt(maxLen()) : 999;
    const min = minLen() ? parseInt(minLen()) : 1;

    const result = COMMON_WORDS.filter(w => {
      if (w.length > max || w.length < min) return false;
      if (reIncl && !reIncl.test(w)) return false;
      if (reExcl && reExcl.test(w)) return false;
      return true;
    });

    if (result.length === 0) {
      showNoticeNotification("No words found");
      return;
    }
    props.onData({ splitText: result, set: exact });
    props.onClose();
  }

  return (
    <div class="tc-overlay" onClick={props.onClose}>
      <div class="ct-modal ct-modal--sm" onClick={e => e.stopPropagation()}>
        <form class="wf-form" onSubmit={e => { e.preventDefault(); filter(true); }}>
          <div class="wf-grid">
            <div class="wf-col">
              <div class="wf-label">min length</div>
              <input class="ct-input" type="number" min="0" placeholder="min length"
                value={minLen()} onInput={e => setMinLen(e.currentTarget.value)}
              />
            </div>
            <div class="wf-col">
              <div class="wf-label">max length</div>
              <input class="ct-input" type="number" min="0" placeholder="max length"
                value={maxLen()} onInput={e => setMaxLen(e.currentTarget.value)}
              />
            </div>
          </div>
          <div class="wf-col">
            <div class="wf-label">include</div>
            <input class="ct-input" type="text" placeholder="characters or words separated by spaces"
              value={include()} onInput={e => setInclude(e.currentTarget.value)}
            />
          </div>
          <div class="wf-col">
            <label class="wf-checkbox">
              <input type="checkbox" checked={exactMatch()} onChange={e => { setExactMatch(e.currentTarget.checked); if (e.currentTarget.checked) setExclude(""); }} />
              Exact match only
            </label>
          </div>
          <Show when={!exactMatch()}>
            <div class="wf-col">
              <div class="wf-label">exclude</div>
              <input class="ct-input" type="text" placeholder="characters or words separated by spaces"
                value={exclude()} onInput={e => setExclude(e.currentTarget.value)}
              />
            </div>
          </Show>
          <div class="wf-bottom">
            <div class="wf-label wf-hint">"Set" replaces the current custom word list, "Add" appends.</div>
            <div class="wf-actions">
              <button type="submit" class="ct-btn ct-btn-wide" onClick={() => filter(true)}>set</button>
              <button type="button" class="ct-btn ct-btn-wide" onClick={() => filter(false)}>add</button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
