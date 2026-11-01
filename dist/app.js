const state={messages:[],people:[]};
async function exportPDF(){
  const button=$('#pdfButton');
  if(!window.html2canvas||!window.jspdf){alert('Não foi possível carregar o gerador de PDF. Verifique a sua ligação e tente novamente.');return}
  button.disabled=true;button.textContent='A gerar PDF…';
  const stage=document.createElement('div');
  stage.className='pdf-stage';stage.setAttribute('aria-hidden','true');document.body.append(stage);
  try{
    await document.fonts.ready;
    const {jsPDF}=window.jspdf,pdf=new jsPDF({orientation:'p',unit:'mm',format:'a4',compress:true});
    const margin=16,contentWidth=178,pageBottom=275,green=[70,133,106],ink=[23,33,31],muted=[104,114,110];
    const title=$('#reportTitle').textContent,meta=$('#reportMeta').textContent;
    let y=0;
    function startPage(first=false){
      if(!first)pdf.addPage();
      pdf.setFillColor(245,243,237);pdf.rect(0,0,210,297,'F');
      y=first?29:30;
    }
    function ensure(height){if(y+height>pageBottom)startPage()}
    startPage(true);
    pdf.setTextColor(...ink);pdf.setFont('helvetica','bold');pdf.setFontSize(26);
    pdf.text(title,margin,y);y+=10;
    pdf.setFont('helvetica','normal');pdf.setFontSize(10);pdf.setTextColor(...muted);
    const metaLines=pdf.splitTextToSize(meta,contentWidth);
    pdf.text(metaLines,margin,y);y+=metaLines.length*5+9;
    const metrics=[...document.querySelectorAll('#summaryCards .metric')];
    const gap=3,boxWidth=(contentWidth-gap*3)/4,boxHeight=23;
    metrics.forEach((metric,i)=>{
      const x=margin+i*(boxWidth+gap);
      pdf.setFillColor(...(i===0?ink:green));pdf.roundedRect(x,y,boxWidth,boxHeight,2,2,'F');
      pdf.setTextColor(255,255,255);pdf.setFont('helvetica','normal');pdf.setFontSize(7);
      pdf.text(metric.querySelector('small').textContent,x+3,y+7);
      pdf.setFont('helvetica','bold');pdf.setFontSize(14);
      pdf.text(metric.querySelector('strong').textContent,x+3,y+17);
    });
    y+=boxHeight+8;
    const cards=[...document.querySelectorAll('#report .card')];
    const hourCard=cards.splice(2,1)[0];
    cards.splice(1,0,hourCard);
    for(const card of cards){
      const copy=card.cloneNode(true);
      stage.replaceChildren(copy);
      const canvas=await window.html2canvas(copy,{scale:2,backgroundColor:'#fffefa',useCORS:true,logging:false});
      const imageHeight=canvas.height*contentWidth/canvas.width;
      const maxHeight=pageBottom-30;
      const drawHeight=Math.min(imageHeight,maxHeight);
      ensure(drawHeight+5);
      pdf.addImage(canvas.toDataURL('image/png'),'PNG',margin,y,contentWidth,drawHeight,undefined,'FAST');
      y+=drawHeight+6;
    }
    const method=$('#report .method');
    if(method){
      const lines=pdf.splitTextToSize(method.querySelector('p').textContent,contentWidth-10);
      const height=15+lines.length*4.3;
      ensure(height+4);
      pdf.setFillColor(234,243,232);pdf.roundedRect(margin,y,contentWidth,height,2,2,'F');
      pdf.setFont('helvetica','bold');pdf.setFontSize(10);pdf.setTextColor(...ink);
      pdf.text('Como calculamos',margin+5,y+7);
      pdf.setFont('helvetica','normal');pdf.setFontSize(8);pdf.setTextColor(...muted);
      pdf.text(lines,margin+5,y+13);
    }
    const pages=pdf.getNumberOfPages();
    for(let page=1;page<=pages;page++){
      pdf.setPage(page);
      pdf.setFillColor(245,243,237);pdf.rect(0,0,210,20,'F');
      pdf.setDrawColor(216,221,212);pdf.line(margin,19,210-margin,19);
      pdf.setFont('helvetica','bold');pdf.setFontSize(9);pdf.setTextColor(...green);
      pdf.text('GRUPO EM NÚMEROS',margin,14);
      pdf.setDrawColor(216,221,212);pdf.line(margin,282,210-margin,282);
      pdf.setFont('helvetica','normal');pdf.setFontSize(8);pdf.setTextColor(...muted);
      pdf.text('Relatório gerado localmente. Nenhum dado enviado ou guardado.',margin,288);
      pdf.text(`${page} / ${pages}`,210-margin,288,{align:'right'});
    }
    pdf.save(`grupo-em-numeros-${isoDay(new Date())}.pdf`);
  }catch(error){console.error(error);alert('Não foi possível gerar o PDF. Tente novamente.')}
  finally{stage.remove();button.disabled=false;button.textContent='Guardar PDF'}
}
const $=s=>document.querySelector(s), esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

$('#chatFile').addEventListener('change',async e=>{const file=e.target.files[0];if(!file)return;const error=$('#fileError');error.textContent='A ler o ficheiro…';try{const parsed=await readChatFile(file);state.messages=parsed;setupPeople(parsed);error.textContent='';$('#intro').classList.add('hidden');$('#mapping').classList.remove('hidden')}catch(cause){error.textContent=cause.message}finally{e.target.value=''}});
$('#mappingForm').addEventListener('submit',e=>{e.preventDefault();state.people=[...document.querySelectorAll('.person-input')].map(input=>({original:input.dataset.original,name:input.value.trim()||input.dataset.original,include:!$(`#exclude-${input.dataset.index}`).checked}));render();$('#mapping').classList.add('hidden');$('#report').classList.remove('hidden');window.scrollTo({top:0,behavior:'smooth'})});
$('#newFile').addEventListener('click',()=>location.reload());$('#pdfButton').addEventListener('click',exportPDF);$('#applyDates').addEventListener('click',render);$('#clearDates').addEventListener('click',()=>{$('#dateFrom').value='';$('#dateTo').value='';render()});

function parseChat(text){const rows=[],re=/^(?:\[)?(\d{1,2})[\/.](\d{1,2})[\/.](\d{2,4}),?\s+(\d{1,2}):(\d{2})(?::(\d{2}))?\s*(AM|PM|am|pm)?\]?\s*(?:-|–)?\s*(.*)$/;let current=null;for(const line of text.replace(/^\uFEFF/,'').split(/\r?\n/)){const m=line.match(re);if(m){const author=m[8].match(/^([^:]+):\s([\s\S]*)$/);if(author){let year=+m[3];if(year<100)year+=2000;let month=+m[1],day=+m[2];if(month>12)[month,day]=[day,month];let hour=+m[4];if(m[7]){if(m[7].toLowerCase()==='pm'&&hour<12)hour+=12;if(m[7].toLowerCase()==='am'&&hour===12)hour=0}const date=new Date(year,month-1,day,hour,+m[5],+(m[6]||0));if(!isNaN(date)&&date.getMonth()===month-1&&date.getDate()===day){current={date,author:author[1].trim(),text:author[2]};rows.push(current);continue}}current=null}else if(current)current.text+='\n'+line}return rows}
const monthNames={janeiro:1,fevereiro:2,março:3,marco:3,abril:4,maio:5,junho:6,julho:7,agosto:8,setembro:9,outubro:10,novembro:11,dezembro:12};
function parseMarkdownChat(text){const rows=[];let day=null,current=null;const finish=()=>{if(current)current.text=current.text.replace(/\n+$/,'')};for(const line of text.replace(/^\uFEFF/,'').split(/\r?\n/)){const heading=line.match(/^##\s+(\d{1,2}) de ([\p{L}]+) de (\d{4})\s*$/iu);if(heading){finish();const month=monthNames[heading[2].toLocaleLowerCase('pt-BR')];day=month?{year:+heading[3],month,date:+heading[1]}:null;current=null;continue}const message=day&&line.match(/^\[(\d{1,2}):(\d{2})\]\s+\*\*(.+?):\*\*(?:\s?(.*))?$/u);if(message){const date=new Date(day.year,day.month-1,day.date,+message[1],+message[2]);if(date.getMonth()===day.month-1&&date.getDate()===day.date){finish();current={date,author:message[3].trim(),text:message[4]||''};rows.push(current);continue}}if(line==='---'){finish();current=null;continue}if(current)current.text+='\n'+line}finish();return rows}
function parseExport(text){const plain=parseChat(text);return plain.length?plain:parseMarkdownChat(text)}
async function readChatFile(file){const name=file.name.toLocaleLowerCase();if(!/\.(txt|md|zip)$/.test(name))throw Error('Escolha um ficheiro .zip, .txt ou .md.');if(file.size>50*1024*1024)throw Error('O ficheiro é demasiado grande (limite: 50 MB).');if(!name.endsWith('.zip')){const parsed=parseExport(await file.text());if(parsed.length)return parsed;throw Error('Não reconheci mensagens neste ficheiro. Verifique se é um export de conversa do WhatsApp.')}if(!window.JSZip)throw Error('Não foi possível carregar o leitor de ZIP. Verifique a ligação e tente novamente.');let zip;try{zip=await window.JSZip.loadAsync(file)}catch{throw Error('Não foi possível abrir o ZIP. Verifique se o ficheiro está íntegro.')}const entries=Object.values(zip.files).filter(entry=>!entry.dir&&!entry.name.startsWith('__MACOSX/')&&/\.(txt|md)$/i.test(entry.name)).sort((a,b)=>{const rank=entry=>entry.name.toLowerCase().endsWith('.txt')?0:1;return rank(a)-rank(b)||a.name.localeCompare(b.name)});if(!entries.length)throw Error('O ZIP não contém uma conversa .txt ou .md.');for(const entry of entries){if(entry._data?.uncompressedSize>50*1024*1024)continue;const content=await entry.async('string');if(content.length>50*1024*1024)continue;const parsed=parseExport(content);if(parsed.length)return parsed}throw Error('Não reconheci mensagens nos ficheiros .txt ou .md deste ZIP.')}
function setupPeople(msgs){const authors=[...new Set(msgs.map(m=>m.author))].sort((a,b)=>a.localeCompare(b));$('#memberFields').innerHTML=authors.map((a,i)=>`<div class="member-row"><label for="p${i}">${esc(a)}</label><input id="p${i}" class="person-input" data-index="${i}" data-original="${esc(a)}" value="${esc(a==='You'?'':a)}" placeholder="Nome no contacto / nome real" required><label class="exclude"><input id="exclude-${i}" type="checkbox"> Excluir</label></div>`).join('')}
function render(){const names=Object.fromEntries(state.people.map(p=>[p.original,p.name])),active=state.people.filter(p=>p.include),people=active.map(p=>p.name);const from=$('#dateFrom').value?new Date(`${$('#dateFrom').value}T00:00:00`):null,to=$('#dateTo').value?new Date(`${$('#dateTo').value}T23:59:59.999`):null;const msgs=state.messages.filter(m=>active.some(p=>p.original===m.author)&&(!from||m.date>=from)&&(!to||m.date<=to)).map(m=>({...m,name:names[m.author]}));if(!msgs.length){$('#reportMeta').textContent='Nenhuma mensagem dos membros incluídos no período escolhido.';$('#summaryCards').innerHTML='';$('#pdfButton').disabled=true;document.querySelectorAll('.chart').forEach(x=>x.innerHTML='');return}$('#pdfButton').disabled=false;const by=fn=>Object.fromEntries(people.map(p=>[p,fn(p)]));const count=by(p=>msgs.filter(m=>m.name===p).length),avgLength=by(p=>{const a=msgs.filter(m=>m.name===p);return a.length?a.reduce((n,m)=>n+[...m.text].length,0)/a.length:0});const hours=Array(24).fill(0),week=Array(7).fill(0),days={};msgs.forEach(m=>{hours[m.date.getHours()]++;week[(m.date.getDay()+6)%7]++;const d=isoDay(m.date);days[d]=(days[d]||0)+1});const made=by(()=>0),received=by(()=>0),aliases=people.map(p=>({name:p,key:p.toLocaleLowerCase()})).sort((a,b)=>b.key.length-a.key.length);msgs.forEach(m=>aliases.forEach(a=>{if(new RegExp(`(^|[^\\p{L}\\p{N}])@${escapeRE(a.key)}(?=$|[^\\p{L}\\p{N}])`,'iu').test(m.text)){made[m.name]++;received[a.name]++}}));const starters=by(()=>0),responses=by(()=>[]);msgs.forEach((m,i)=>{if(i===0||m.date-msgs[i-1].date>3600000)starters[m.name]++;if(i&&m.name!==msgs[i-1].name){const gap=m.date-msgs[i-1].date;if(gap<=3600000)responses[m.name].push(gap)}});const response=by(p=>responses[p].length?responses[p].reduce((a,b)=>a+b,0)/responses[p].length:null);
$('#reportMeta').textContent=`${msgs.length.toLocaleString('pt-BR')} mensagens · ${people.length} membros incluídos · ${localDay(msgs[0].date)} — ${localDay(msgs.at(-1).date)}`;$('#generatedAt').textContent=new Date().toLocaleString('pt-BR');const activeDays=Object.keys(days).length;const firstDay=isoDay(msgs[0].date),lastDay=isoDay(msgs.at(-1).date),periodDays=(Date.parse(lastDay+'T00:00:00Z')-Date.parse(firstDay+'T00:00:00Z'))/86400000+1;$('#summaryCards').innerHTML=metric('Mensagens',msgs.length.toLocaleString('pt-BR'))+metric('Membros incluídos',people.length)+metric('Dias ativos',activeDays)+metric('Período',`${periodDays} dias`);
horizontalChart('#messagesChart',count,'Mensagens',n=>n.toLocaleString('pt-BR'));horizontalChart('#lengthChart',avgLength,'Caracteres por mensagem',n=>`${Math.round(n)}`);verticalChart('#hourChart',hours,Array.from({length:24},(_,i)=>`${i}h`),'Hora do dia','Mensagens');verticalChart('#weekdayChart',week,['Seg','Ter','Qua','Qui','Sex','Sáb','Dom'],'Dia da semana','Mensagens');lineChart('#dailyChart',Object.entries(days),'Data','Mensagens');groupedChart('#mentionsChart',people,made,received,'Menções','Feitas','Recebidas');horizontalChart('#startersChart',starters,'Conversas iniciadas',n=>n);horizontalChart('#responseChart',response,'Tempo médio (min)',n=>n===null?'—':formatDuration(n));}
function metric(label,value){return `<div class="metric"><small>${label}</small><strong>${value}</strong></div>`}function svgWrap(markup,w,h,desc){return `<figure class="chart-figure"><svg class="chart-svg" viewBox="0 0 ${w} ${h}" role="img" aria-label="${esc(desc)}">${markup}</svg><figcaption>${esc(desc)}</figcaption></figure>`}function ticks(max){const top=Math.max(1,Math.ceil(max/4)*4);return {top,values:[0,top/4,top/2,top*3/4,top]}}
function horizontalChart(sel,data,xLabel,fmt){const entries=Object.entries(data).sort((a,b)=>(b[1]??-1)-(a[1]??-1)),w=800,row=34,left=190,right=58,top=24,bottom=44,h=top+bottom+entries.length*row,{top:max,values}=ticks(Math.max(...entries.map(x=>x[1]||0)));let s=values.map(v=>`<line x1="${left}" y1="${top}" x2="${left+(w-left-right)*v/max}" y2="${h-bottom}" class="gridline"/><text x="${left+(w-left-right)*v/max}" y="${h-25}" text-anchor="middle" class="tick">${fmt(v)}</text>`).join('');entries.forEach(([name,val],i)=>{const y=top+i*row+6,width=(val||0)/max*(w-left-right);s+=`<text x="${left-10}" y="${y+15}" text-anchor="end" class="label">${esc(name)}</text><rect x="${left}" y="${y}" width="${width}" height="18" rx="4" class="bar"/><text x="${left+width+7}" y="${y+15}" class="value">${fmt(val)}</text>`});s+=`<text x="${(left+w-right)/2}" y="${h-5}" text-anchor="middle" class="axis-title">${esc(xLabel)}</text><text x="18" y="${h/2}" transform="rotate(-90 18 ${h/2})" text-anchor="middle" class="axis-title">Membro</text>`;$(sel).innerHTML=svgWrap(s,w,h,`Gráfico de barras: ${xLabel} por membro`)}
function verticalChart(sel,values,labels,xLabel,yLabel){const w=800,h=270,left=56,right=20,top=18,bottom=58,{top:max,values:t}=ticks(Math.max(...values));const plotW=w-left-right,plotH=h-top-bottom,step=plotW/values.length;let s=t.map(v=>{const y=top+plotH-(v/max)*plotH;return `<line x1="${left}" y1="${y}" x2="${w-right}" y2="${y}" class="gridline"/><text x="${left-8}" y="${y+4}" text-anchor="end" class="tick">${v}</text>`}).join('');values.forEach((v,i)=>{const bw=Math.max(3,step*.7),x=left+i*step+(step-bw)/2,y=top+plotH-v/max*plotH;s+=`<rect x="${x}" y="${y}" width="${bw}" height="${v/max*plotH}" rx="2" class="bar"/><title>${labels[i]}: ${v}</title>${(values.length<=8||i%3===0)?`<text x="${x+bw/2}" y="${h-39}" text-anchor="middle" class="tick">${labels[i]}</text>`:''}`});s+=`<text x="${(left+w-right)/2}" y="${h-7}" text-anchor="middle" class="axis-title">${xLabel}</text><text x="16" y="${h/2}" transform="rotate(-90 16 ${h/2})" text-anchor="middle" class="axis-title">${yLabel}</text>`;$(sel).innerHTML=svgWrap(s,w,h,`Gráfico de barras: ${yLabel} por ${xLabel}`)}
function groupedChart(sel,people,a,b,xLabel,aLabel,bLabel){const w=800,row=42,left=190,right=58,top=24,bottom=52,h=top+bottom+people.length*row,{top:max,values}=ticks(Math.max(...people.map(p=>Math.max(a[p],b[p]))));let s=`<rect x="${left}" y="2" width="12" height="12" class="bar"/><text x="${left+17}" y="13" class="tick">${aLabel}</text><rect x="${left+95}" y="2" width="12" height="12" class="bar alt"/><text x="${left+112}" y="13" class="tick">${bLabel}</text>`+values.map(v=>`<line x1="${left}" y1="${top}" x2="${left+(w-left-right)*v/max}" y2="${h-bottom}" class="gridline"/><text x="${left+(w-left-right)*v/max}" y="${h-30}" text-anchor="middle" class="tick">${v}</text>`).join('');people.forEach((p,i)=>{const y=top+i*row+5,scale=w-left-right;s+=`<text x="${left-10}" y="${y+18}" text-anchor="end" class="label">${esc(p)}</text><rect x="${left}" y="${y}" width="${a[p]/max*scale}" height="10" rx="3" class="bar"/><rect x="${left}" y="${y+14}" width="${b[p]/max*scale}" height="10" rx="3" class="bar alt"/>`});s+=`<text x="${(left+w-right)/2}" y="${h-5}" text-anchor="middle" class="axis-title">${xLabel}</text><text x="18" y="${h/2}" transform="rotate(-90 18 ${h/2})" text-anchor="middle" class="axis-title">Membro</text>`;$(sel).innerHTML=svgWrap(s,w,h,`Gráfico de barras agrupadas: ${aLabel} e ${bLabel} por membro`)}
function lineChart(sel,entries,xLabel,yLabel){const w=800,h=270,left=58,right=20,top=18,bottom=54,vals=entries.map(x=>x[1]),{top:max,values:t}=ticks(Math.max(...vals)),plotW=w-left-right,plotH=h-top-bottom,points=vals.map((v,i)=>`${left+i*plotW/Math.max(vals.length-1,1)},${top+plotH-v/max*plotH}`).join(' ');let s=t.map(v=>{const y=top+plotH-v/max*plotH;return `<line x1="${left}" y1="${y}" x2="${w-right}" y2="${y}" class="gridline"/><text x="${left-8}" y="${y+4}" text-anchor="end" class="tick">${v}</text>`}).join('')+`<polyline points="${points}" class="line"/>`;vals.forEach((v,i)=>{const [x,y]=points.split(' ')[i].split(',');s+=`<circle cx="${x}" cy="${y}" r="2.8" class="point"><title>${entries[i][0]}: ${v}</title></circle>`});s+=`<text x="${left}" y="${h-37}" class="tick">${entries[0][0]}</text><text x="${w-right}" y="${h-37}" text-anchor="end" class="tick">${entries.at(-1)[0]}</text><text x="${(left+w-right)/2}" y="${h-7}" text-anchor="middle" class="axis-title">${xLabel}</text><text x="16" y="${h/2}" transform="rotate(-90 16 ${h/2})" text-anchor="middle" class="axis-title">${yLabel}</text>`;$(sel).innerHTML=svgWrap(s,w,h,`Gráfico de linha: ${yLabel} por ${xLabel}`)}
function localDay(d){return d.toLocaleDateString('pt-BR')}function isoDay(d){return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`}function escapeRE(s){return s.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')}function formatDuration(ms){const n=Math.round(ms/60000);return n<60?`${n} min`:`${Math.floor(n/60)}h ${n%60}min`}
