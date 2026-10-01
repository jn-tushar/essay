const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => [...document.querySelectorAll(sel)];

const state = JSON.parse(localStorage.getItem('ieltsEssayLabState') || '{}');
state.done = state.done || {};
state.modules = state.modules || {};
state.theme = state.theme || 'light';
const saveState = () => localStorage.setItem('ieltsEssayLabState', JSON.stringify(state));

function escapeHTML(str) {
  return String(str).replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','\'':'&#39;','"':'&quot;'}[c]));
}
function bnNum(n){
  const d='০১২৩৪৫৬৭৮৯';
  return String(n).replace(/\d/g,x=>d[x]);
}

function refreshProgress() {
  const total = TUTORIAL_MODULES.reduce((n,m)=>n+m.lessons.length,0);
  const done = Object.values(state.done).filter(Boolean).length;
  const pct = total ? Math.round(done / total * 100) : 0;
  $('#progressPct').textContent = bnNum(pct) + '%';
  $('#progressBar').style.width = pct + '%';
  $('#moduleProgress').innerHTML = TUTORIAL_MODULES.slice(0,4).map(m => {
    const mdone = m.lessons.filter((_,i)=>state.done[m.id+'-'+i]).length;
    return `<span><strong>${bnNum(mdone)}/${bnNum(m.lessons.length)}</strong>${escapeHTML(m.title.split(':')[0])}</span>`;
  }).join('');
  $$('.road-card input[data-module]').forEach(cb => { cb.checked = !!state.modules[cb.dataset.module]; });
}

function renderRoadmap() {
  const descriptions = [
    'High-band essay কীভাবে চিন্তা করে—clarity, development, precision ও control-এর ভিত্তি তৈরি করো।',
    'Question decode করো, position ঠিক করো এবং Task Response-এর requirements ধরো।',
    'Paragraph anatomy, development, cohesion, vocabulary ও controlled complexity আয়ত্ত করো।',
    'Vocabulary active করো, timed writing করো, proofreading ও self-review দিয়ে performance তৈরি করো।'
  ];
  const titles = ['ভিত্তি', 'প্রশ্ন আয়ত্ত', 'Argument ও Language', 'Exam Performance'];
  $('#roadmapGrid').innerHTML = titles.map((t,i)=>`<div class="road-card"><div class="road-num">${bnNum(i+1)}</div><h3>${t}</h3><p>${descriptions[i]}</p><label><input type="checkbox" data-module="m${i}"> এই stage সম্পন্ন</label></div>`).join('');
  $$('.road-card input[data-module]').forEach(cb=>cb.addEventListener('change',()=>{ state.modules[cb.dataset.module]=cb.checked; saveState(); refreshProgress(); }));
}

let activeModule = 'all';
function renderTabs() {
  const buttons = [`<button class="active" data-module="all">সব lesson</button>`].concat(TUTORIAL_MODULES.map(m=>`<button data-module="${m.id}">${escapeHTML(m.title.split(':')[0])}</button>`));
  $('#moduleTabs').innerHTML = buttons.join('');
  $$('#moduleTabs button').forEach(btn=>btn.addEventListener('click',()=>{
    $$('#moduleTabs button').forEach(b=>b.classList.remove('active'));
    btn.classList.add('active');
    activeModule=btn.dataset.module;
    renderTutorial($('#tutorialSearch').value.trim().toLowerCase());
  }));
}

function lessonHTML(module, lesson, idx) {
  const key = module.id+'-'+idx;
  const title = lesson[0], body = lesson[1];
  const marked = !!state.done[key];
  const parts = body.split(/\n+/).filter(Boolean);
  const content = parts.map((t,i)=>{
    const safe=escapeHTML(t);
    if(t.startsWith('বাংলা ব্যাখ্যা:')) return `<div class="bn-explain"><strong>বাংলা ব্যাখ্যা</strong><p>${safe.replace('বাংলা ব্যাখ্যা:','').trim()}</p></div>`;
    if(t.startsWith('ইংরেজি রেফারেন্স:')) return `<div class="en-ref"><strong>English reference</strong><p dir="ltr">${safe.replace('ইংরেজি রেফারেন্স:','').trim()}</p></div>`;
    return `<p>${safe}</p>`;
  }).join('');
  return `<details class="lesson ${marked?'done':''}" data-key="${key}" data-search="${escapeHTML((title+' '+body+' '+module.title).toLowerCase())}"><summary><span class="lesson-num">${bnNum(idx+1)}</span><span class="lesson-title">${escapeHTML(title)}</span><span class="lesson-module">${escapeHTML(module.title.split(':')[0])}</span><span>›</span></summary><div class="lesson-body">${content}<button class="ghost-btn complete-btn" data-complete="${key}">${marked?'✓ সম্পন্ন হয়েছে':'lesson সম্পন্ন করো'}</button></div></details>`;
}

function renderTutorial(query='') {
  let html = '';
  const modules = activeModule==='all' ? TUTORIAL_MODULES : TUTORIAL_MODULES.filter(m=>m.id===activeModule);
  let shown = 0;
  modules.forEach(m=>m.lessons.forEach((lesson,i)=>{
    const hay = (m.title+' '+lesson[0]+' '+lesson[1]).toLowerCase();
    if (!query || hay.includes(query)) { html += lessonHTML(m,lesson,i); shown++; }
  }));
  $('#tutorialList').innerHTML = shown ? html : `<div class="panel empty-state">“${escapeHTML(query)}”-এর জন্য কোনো lesson পাওয়া যায়নি। English বা বাংলা broader keyword দিয়ে আবার খুঁজুন।</div>`;
  $$('[data-complete]').forEach(btn=>btn.addEventListener('click',()=>{
    state.done[btn.dataset.complete] = !state.done[btn.dataset.complete];
    saveState(); renderTutorial($('#tutorialSearch').value.trim().toLowerCase()); refreshProgress();
  }));
}

const TAG_BN = {'Academic phrase':'Academic phrase','Collocation':'Collocation','Verb':'Academic verb','Phrase':'Useful phrase'};
let vocabIndex = 0;
function renderVocab() {
  const v = VOCAB[vocabIndex];
  $('#vocabTag').textContent = TAG_BN[v[0]] || v[0];
  $('#vocabCount').textContent = `${bnNum(vocabIndex+1)} / ${bnNum(VOCAB.length)}`;
  $('#vocabWord').textContent = v[1];
  $('#vocabPron').textContent = v[2];
  $('#vocabMeaning').textContent = v[3];
  $('#vocabExample').textContent = v[4];
  $('#vocabExampleBn').textContent = (window.VOCAB_BN_EXAMPLES||[])[vocabIndex] || '';
}

function renderPatterns() {
  $('#patternList').innerHTML = PATTERNS.map((p,i)=>`<div class="pattern-item" data-pattern="${escapeHTML(p[0])}"><strong>${bnNum(i+1)}. ${escapeHTML(p[0])}</strong><span>${escapeHTML(p[1])}</span><small>${escapeHTML(p[2])}</small></div>`).join('');
  $$('.pattern-item').forEach(x=>x.addEventListener('click',()=>{ $('#sentencePractice').value = x.dataset.pattern + ' '; $('#sentencePractice').focus(); }));
}

function renderPlannerHints(){
  const hints = [
    ['Point','তুমি ঠিক কী claim করছ? এক বাক্যে বলো।'],
    ['Why / How','কোন mechanism-এর কারণে point-টি সত্যি?'],
    ['Example','কোন relevant বাস্তবসম্মত example point-টিকে support করে?'],
    ['Result / So what?','এর consequence কেন গুরুত্বপূর্ণ—তা বোঝাও।']
  ];
  $('#planHints').innerHTML = hints.map(h=>`<div class="hint-card"><strong>${h[0]}</strong><span>${h[1]}</span></div>`).join('');
}

function savePlanner(){
  state.plan = {q:$('#essayQuestion').value, type:$('#taskType').value, position:$('#position').value, b1:$('#body1').value,b2:$('#body2').value,c:$('#conclusion').value};
  saveState(); $('#planSaved').textContent='Plan এই device-এ সংরক্ষিত হয়েছে।'; setTimeout(()=>$('#planSaved').textContent='',1800);
}
function loadPlanner(){
  const p=state.plan||{};
  $('#essayQuestion').value=p.q||'';
  const types=[...$('#taskType').options].map(o=>o.value);
  $('#taskType').value=types.includes(p.type)?p.type:types[0];
  $('#position').value=p.position||''; $('#body1').value=p.b1||''; $('#body2').value=p.b2||''; $('#conclusion').value=p.c||'';
}

let seconds=2400, timerId=null;
function renderTimer(){ const m=String(Math.floor(seconds/60)).padStart(2,'0'), s=String(seconds%60).padStart(2,'0'); $('#timer').textContent=`${m}:${s}`; }
function startTimer(){ if(timerId) return; timerId=setInterval(()=>{ if(seconds<=0){ clearInterval(timerId); timerId=null; return;} seconds--; renderTimer(); },1000); }
function pauseTimer(){ if(timerId){clearInterval(timerId); timerId=null;} }
function resetTimer(){ pauseTimer(); seconds=2400; renderTimer(); }
function updateWordCount(){ const t=$('#essayPad').value.trim(); const count=t?t.split(/\s+/).length:0; $('#wordCount').textContent=`${bnNum(count)} ${count===1?'শব্দ':'শব্দ'}`; localStorage.setItem('ieltsEssayLabPractice', $('#essayPad').value); }

let quizIndex=0, quizScore=0, quizLocked=false;
function renderQuiz(){
  const item=QUIZ[quizIndex]; quizLocked=false;
  $('#quizCard').innerHTML=`<span class="kicker">প্রশ্ন ${bnNum(quizIndex+1)} / ${bnNum(QUIZ.length)}</span><div class="quiz-q">${escapeHTML(item.q)}</div><div class="quiz-options">${item.options.map((o,i)=>`<button class="quiz-option" data-opt="${i}">${String.fromCharCode(65+i)}. ${escapeHTML(o)}</button>`).join('')}</div><div class="quiz-explain" id="quizExplain"></div><div class="quiz-footer"><span class="status-text">স্কোর: ${bnNum(quizScore)}</span><button class="secondary-btn" id="nextQuiz" disabled>পরের প্রশ্ন</button></div>`;
  $$('.quiz-option').forEach(btn=>btn.addEventListener('click',()=>answerQuiz(Number(btn.dataset.opt))));
  $('#nextQuiz').addEventListener('click',()=>{ quizIndex=(quizIndex+1)%QUIZ.length; renderQuiz(); });
}
function answerQuiz(selected){
  if(quizLocked)return; quizLocked=true; const item=QUIZ[quizIndex];
  if(selected===item.a) quizScore++;
  $$('.quiz-option')[item.a].classList.add('correct');
  if(selected!==item.a) $$('.quiz-option')[selected].classList.add('wrong');
  $('#quizExplain').textContent=item.e; $('#nextQuiz').disabled=false; $('#quizCard .status-text').textContent=`স্কোর: ${bnNum(quizScore)}`;
}

function initTheme(){ document.documentElement.dataset.theme=state.theme==='dark'?'dark':'light'; $('#themeBtn').textContent=state.theme==='dark'?'☾':'☼'; }
function toggleTheme(){ state.theme=state.theme==='dark'?'light':'dark'; saveState(); initTheme(); }
function loadNotes(){ $('#notesBox').value=localStorage.getItem('ieltsEssayLabNotes')||''; }
function saveNotes(){ localStorage.setItem('ieltsEssayLabNotes',$('#notesBox').value); $('#notesSaved').textContent='Notes সংরক্ষিত হয়েছে।'; setTimeout(()=>$('#notesSaved').textContent='',1800); }
function closeSidebarOnMobile(){ if(window.innerWidth<=800) $('#sidebar').classList.remove('open'); }

function renderPrompt(en,bn){
  $('#promptStrip').innerHTML=`<span class="prompt-label">অনুশীলনের প্রশ্ন</span><strong>বাংলা নির্দেশনা:</strong> ${escapeHTML(bn)}<div class="prompt-en" dir="ltr"><strong>English:</strong> ${escapeHTML(en)}</div>`;
}

function init(){
  initTheme(); renderRoadmap(); renderTabs(); renderTutorial(); refreshProgress(); renderVocab(); renderPatterns(); renderPlannerHints(); loadPlanner(); renderTimer(); renderQuiz(); loadNotes();
  $('#tutorialSearch').addEventListener('input',e=>renderTutorial(e.target.value.trim().toLowerCase()));
  $('#nextVocab').addEventListener('click',()=>{vocabIndex=(vocabIndex+1)%VOCAB.length;renderVocab();});
  $('#shuffleVocab').addEventListener('click',()=>{ for(let i=VOCAB.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1)); [VOCAB[i],VOCAB[j]]=[VOCAB[j],VOCAB[i]];} vocabIndex=0; renderVocab(); });
  $('#saveSentence').addEventListener('click',()=>{localStorage.setItem('ieltsEssayLabSentence',$('#sentencePractice').value); $('#sentenceSaved').textContent='Sentence সংরক্ষণ করা হয়েছে।'; setTimeout(()=>$('#sentenceSaved').textContent='',1800);});
  const ss=localStorage.getItem('ieltsEssayLabSentence'); if(ss) $('#sentencePractice').value=ss;
  $('#savePlan').addEventListener('click',savePlanner); $('#startTimer').addEventListener('click',startTimer); $('#pauseTimer').addEventListener('click',pauseTimer); $('#resetTimer').addEventListener('click',resetTimer);
  $('#essayPad').value=localStorage.getItem('ieltsEssayLabPractice')||''; $('#essayPad').addEventListener('input',updateWordCount); updateWordCount(); $('#clearPractice').addEventListener('click',()=>{ $('#essayPad').value=''; updateWordCount();});
  let pi=0; renderPrompt(PROMPTS[0][0],PROMPTS[0][1]); setInterval(()=>{pi=(pi+1)%PROMPTS.length; renderPrompt(PROMPTS[pi][0],PROMPTS[pi][1]);},7000);
  $('#themeBtn').addEventListener('click',toggleTheme); $('#menuBtn').addEventListener('click',()=>$('#sidebar').classList.toggle('open')); $$('.nav-link').forEach(n=>n.addEventListener('click',closeSidebarOnMobile));
  $('#saveNotes').addEventListener('click',saveNotes);
  $('#resetProgress').addEventListener('click',()=>{if(confirm('সব lesson progress ও stage completion reset করতে চান?')){state.done={};state.modules={};saveState();renderTutorial($('#tutorialSearch').value.trim().toLowerCase());refreshProgress();}});
}

document.addEventListener('DOMContentLoaded',init);
