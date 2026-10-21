<script>
var total=1200,left=total,timer=null,running=false;
var clock=document.getElementById('clock'),startBtn=document.getElementById('start'),hint=document.getElementById('hint');
function fmt(s){var m=Math.floor(s/60),x=s%60;return (m<10?'0':'')+m+':'+(x<10?'0':'')+x;}
function tick(){
  left--;clock.textContent=fmt(Math.max(left,0));
  if(left<=180&&left>0){clock.classList.add('done');}
  if(left<=0){
    clearInterval(timer);running=false;clock.textContent='00:00';clock.classList.add('done');
    startBtn.textContent='再来一轮';
    hint.textContent='时间到。模块 3（PromQL）和模块 5（告警）是重点，值得再读一遍。';
  }
}
startBtn.onclick=function(){
  if(running){clearInterval(timer);running=false;startBtn.textContent='继续';return;}
  if(left<=0){left=total;clock.classList.remove('done');clock.textContent=fmt(left);}
  running=true;startBtn.textContent='暂停';
  hint.textContent='计时中 —— 边看边在 Graph 页面里敲 PromQL。';
  timer=setInterval(tick,1000);
};
document.getElementById('reset').onclick=function(){
  clearInterval(timer);running=false;left=total;
  clock.textContent=fmt(total);clock.classList.remove('done');
  startBtn.textContent='开始计时';
  hint.textContent='建议边看边敲：起一个 Prometheus，用 node_exporter 当抓取目标';
};
window.addEventListener('scroll',function(){
  var h=document.documentElement.scrollHeight-window.innerHeight;
  document.getElementById('bar').style.width=(h>0?(window.scrollY/h*100):0)+'%';
});
document.querySelectorAll('.copy').forEach(function(b){
  b.onclick=function(){
    var t=b.parentNode.querySelector('code').textContent;
    var done=function(){b.textContent='已复制';b.classList.add('ok');setTimeout(function(){b.textContent='复制';b.classList.remove('ok');},1200);};
    if(navigator.clipboard&&navigator.clipboard.writeText){navigator.clipboard.writeText(t).then(done,function(){fb(t);done();});}
    else{fb(t);done();}
  };
});
function fb(t){
  var ta=document.createElement('textarea');ta.value=t;ta.style.position='fixed';ta.style.opacity='0';
  document.body.appendChild(ta);ta.select();try{document.execCommand('copy');}catch(e){}
  document.body.removeChild(ta);
}
document.querySelectorAll('.q').forEach(function(q){
  var idx=parseInt(q.dataset.a,10),opts=q.querySelectorAll('.opt');
  opts.forEach(function(o,i){
    o.onclick=function(){
      if(q.dataset.done)return;
      q.dataset.done='1';
      opts.forEach(function(x,j){x.classList.add(j===idx?'right':'wrong');});
      q.querySelector('.ans').classList.add('show');
    };
  });
});
</script>