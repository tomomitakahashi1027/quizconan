"use strict";
(function(){
  const TOTAL_QUESTIONS = 10;
  const state = { selected: [], current: 0, answers: [], scores: Array(8).fill(0) };
  const byId = id => document.getElementById(id);

  function showScreen(id){
    document.querySelectorAll('.screen').forEach(el => el.classList.remove('active'));
    const screen = byId(id);
    if(screen) screen.classList.add('active');
    window.scrollTo({top:0,behavior:'smooth'});
  }

  function selectUniqueQuestions(pool,count){
    const copy = pool.slice();
    for(let i=copy.length-1;i>0;i--){
      const j = Math.floor(Math.random()*(i+1));
      [copy[i],copy[j]] = [copy[j],copy[i]];
    }
    return copy.slice(0,count);
  }

  function startDiagnosis(){
    state.selected = selectUniqueQuestions(window.QUESTION_POOL,TOTAL_QUESTIONS);
    state.current = 0;
    state.answers = [];
    state.scores = Array(8).fill(0);
    renderQuestion();
    showScreen('quizScreen');
  }

  function goHome(){
    state.selected=[]; state.current=0; state.answers=[]; state.scores=Array(8).fill(0);
    byId('copyStatus').textContent='';
    showScreen('homeScreen');
  }

  function rebuildScores(){
    state.scores=Array(8).fill(0);
    state.answers.forEach((choiceIndex,questionIndex)=>{
      if(choiceIndex===undefined) return;
      const weights=state.selected[questionIndex].answers[choiceIndex].weights;
      weights.forEach((value,index)=>{state.scores[index]+=value;});
    });
  }

  function renderQuestion(){
    const question=state.selected[state.current];
    if(!question){ console.error('Question was not found.'); return; }
    byId('counter').textContent=`${state.current+1} / ${TOTAL_QUESTIONS}`;
    byId('progressBar').style.width=`${((state.current+1)/TOTAL_QUESTIONS)*100}%`;
    byId('questionIcon').textContent=question.icon;
    byId('questionText').innerHTML=question.question;
    byId('backButton').style.visibility=state.current===0?'hidden':'visible';
    const list=byId('answerList'); list.innerHTML='';
    question.answers.forEach((answer,index)=>{
      const button=document.createElement('button');
      button.type='button'; button.innerHTML=`${'ABCD'[index]}. ${answer.text}`;
      button.addEventListener('click',()=>chooseAnswer(index));
      list.appendChild(button);
    });
  }

  function chooseAnswer(index){
    state.answers[state.current]=index;
    rebuildScores();
    if(state.current<TOTAL_QUESTIONS-1){ state.current++; renderQuestion(); }
    else { showScreen('thinkingScreen'); window.setTimeout(renderResult,1500); }
  }

  function playerVector(){ return state.scores.map(value=>1+4*Math.min(1,value/36)); }

  function getRanking(){
    const player=playerVector();
    return Object.entries(window.CHARACTERS).map(([id,character])=>{
      const squared=character.traits.reduce((sum,value,index)=>sum+Math.pow(value-player[index],2),0);
      return {id,character,distance:Math.sqrt(squared)};
    }).sort((a,b)=>a.distance-b.distance);
  }

  function renderResult(){
    const ranking=getRanking(); const top=ranking[0]; const character=top.character;
    const compatible=window.CHARACTERS[character.compatibility];
    byId('resultIcon').textContent=character.icon;
    byId('resultName').innerHTML=`<ruby>${character.name}<rt>${character.reading}</rt></ruby>タイプ！`;
    byId('resultTagline').textContent=character.tagline;
    byId('resultDescription').textContent=character.description;
    byId('compatibilityIcon').textContent=compatible.icon;
    byId('compatibilityName').innerHTML=`<ruby>${compatible.name}<rt>${compatible.reading}</rt></ruby>`;
    byId('compatibilityText').textContent=character.compatibilityText;
    const list=byId('rankingList'); list.innerHTML='';
    ranking.slice(0,3).forEach((item,index)=>{
      const percent=Math.max(61,Math.min(96,Math.round(96-(item.distance-ranking[0].distance)*9-index*3)));
      const row=document.createElement('div'); row.className='rank';
      row.innerHTML=`<div class="rank-label"><span>${['🥇','🥈','🥉'][index]} ${item.character.icon} ${item.character.name}</span><span>${percent}%</span></div><div class="rank-track"><div class="rank-fill" style="width:${percent}%"></div></div>`;
      list.appendChild(row);
    });
    const shareText=`私は「${character.name}タイプ」でした！ ${character.tagline} #名探偵コナン診断ゲーム`;
    const pageUrl=location.href.split('#')[0];
    byId('shareX').href=`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(pageUrl)}`;
    byId('shareLine').href=`https://social-plugins.line.me/lineit/share?url=${encodeURIComponent(pageUrl)}&text=${encodeURIComponent(shareText)}`;
    byId('copyButton').onclick=()=>copyResult(`${shareText}\n${pageUrl}`);
    showScreen('resultScreen');
  }

  async function copyResult(text){
    try{ await navigator.clipboard.writeText(text); byId('copyStatus').textContent='コピーしました！'; }
    catch(error){ byId('copyStatus').textContent='コピーできませんでした'; console.error(error); }
  }

  document.addEventListener('DOMContentLoaded',()=>{
    if(!window.CHARACTERS||!window.QUESTION_POOL){ console.error('Game data could not be loaded.'); return; }
    byId('startButton').addEventListener('click',startDiagnosis);
    byId('restartButton').addEventListener('click',startDiagnosis);
    byId('homeButton').addEventListener('click',goHome);
    byId('resultHomeButton').addEventListener('click',goHome);
    byId('backButton').addEventListener('click',()=>{
      if(state.current>0){ state.current--; state.answers=state.answers.slice(0,state.current+1); rebuildScores(); renderQuestion(); }
    });
  });
})();