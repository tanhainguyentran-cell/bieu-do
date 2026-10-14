(function(){
  'use strict';
  const $=id=>document.getElementById(id),Core=window.ChartStudio,Model=window.CompositionModel,Render=window.PublicationRenderer;
  const original=window.ChartVerifiedData,groups=original.groups.map(g=>({...g,csv:'类别,频数\n'+g.items.map(x=>x.label+','+x.count).join('\n')}));
  const key='idiom-six-charts-v3';let active=groups[0].id,font=null,valid=false,busy=false,timer,toastTimer;
  function current(){return groups.find(g=>g.id===active);}
  function options(){return {sampleSize:$('sample-size').value,theme:document.querySelector('input[name="theme"]:checked').value,aspect:$('aspect').value,decimals:$('decimals').value,showTitle:$('title-mode').value==='with'};}
  function capture(){current().csv=$('csv-data').value;current().title=$('chart-title-input').value;current().source=$('chart-source').value;}
  function loadGroup(){const g=current();$('csv-data').value=g.csv;$('chart-title-input').value=g.title;$('chart-source').value=g.source||'作者根据成语编码数据整理制作';document.querySelectorAll('[data-group]').forEach(b=>{const selected=b.dataset.group===active;b.setAttribute('aria-selected',String(selected));b.tabIndex=selected?0:-1;});$('chart-view').setAttribute('aria-labelledby','group-'+active);}
  function toast(message){clearTimeout(toastTimer);$('toast').textContent=message;$('toast').hidden=false;toastTimer=setTimeout(()=>$('toast').hidden=true,4500);}
  function buttons(){['export-png','export-svg','download-all-png','download-all-svg'].forEach(id=>$(id).disabled=busy||!valid||!font);}
  function persist(){try{localStorage.setItem(key,JSON.stringify({active,options:options(),scale:$('export-scale').value,groups:groups.map(g=>({id:g.id,title:g.title,csv:g.csv,source:g.source}))}));}catch(_){} }
  function make(group,opts=options()){return Model.makeModel(group,{...opts,core:Core});}
  function update(){
    clearTimeout(timer);capture();const g=current(),opts=options();
    $('basis').value=g.metric==='count'?'次 · Số lần gán nhãn':'% · Tỷ lệ trên số mục';
    $('basis-help').textContent=g.metric==='count'?'Hiển thị số đếm trực tiếp. Mỗi thanh là số lần gán nhãn của thành phần tương ứng.':'Tần suất từng thành phần / số mục N × 100%.';
    $('method-help').textContent=g.multi?'Một mục có thể mang nhiều nhãn. Các số đếm trong nhóm được trình bày bằng đơn vị 次.':'Mỗi mục thuộc một thành phần; tổng tần suất cần bằng N.';
    $('decimals').disabled=g.metric==='count';
    try{
      const result=make(g,opts),model=result.model;
      const svg=Render.render(model,font?{measure:(s,z)=>font.getAdvanceWidth(s,z,{kerning:true})}:{});
      $('chart-holder').innerHTML=svg;valid=true;
      const scale=Number($('export-scale').value),height=({wide:900,classic:1200,square:1600})[opts.aspect]||1200;
      $('resolution-label').textContent='PNG '+(1600*scale).toLocaleString('vi-VN')+' × '+(height*scale).toLocaleString('vi-VN')+' px · '+(opts.showTitle?'Có tiêu đề':'Không có tiêu đề');
      $('view-name').textContent='Biểu đồ '+(groups.indexOf(g)+1)+' / 6';$('method-note').value=model.note||'Không có ghi chú bổ sung.';
      $('status').className='status ok';$('status').textContent=font?(result.labels.length+' thành phần · '+(result.metric==='count'?result.total+' lần gán nhãn':result.sampleSize+' mục · tổng 100%')):'Đang chuẩn bị font tiếng Trung…';
      const suffix=result.metric==='count'?' 次':'%',rows=result.labels.map((s,i)=>'<tr><td class="han">'+Core.escape(s)+'</td><td>'+new Intl.NumberFormat('vi-VN',{maximumFractionDigits:model.decimals}).format(result.values[i])+suffix+'</td></tr>').join('');
      $('table-preview').innerHTML='<table><thead><tr><th>Thành phần</th><th>'+(result.metric==='count'?'Số lần':'Tỷ lệ')+'</th></tr></thead><tbody>'+rows+'</tbody></table>';
    }catch(e){valid=false;$('status').className='status error';$('status').textContent=e.message;$('table-preview').textContent='Hãy kiểm tra dữ liệu để tính tỷ lệ.';}
    persist();buttons();return valid;
  }
  function changeGroup(id,focus=false){capture();active=id;loadGroup();update();if(focus)$('group-'+id).focus();}
  document.querySelectorAll('[data-group]').forEach(b=>{b.addEventListener('click',()=>changeGroup(b.dataset.group));b.addEventListener('keydown',e=>{if(['ArrowLeft','ArrowRight','Home','End'].includes(e.key)){e.preventDefault();const ids=groups.map(g=>g.id),i=ids.indexOf(active);changeGroup(e.key==='Home'?ids[0]:e.key==='End'?ids.at(-1):ids[(i+(e.key==='ArrowRight'?1:ids.length-1))%ids.length],true);}});});
  function selectPane(name,focus=false){document.querySelectorAll('[data-pane]').forEach(b=>{const selected=b.dataset.pane===name;b.setAttribute('aria-selected',String(selected));b.tabIndex=selected?0:-1;if(selected&&focus)b.focus();});for(const n of ['design','content','data'])$('pane-'+n).hidden=n!==name;}
  document.querySelectorAll('[data-pane]').forEach(b=>{b.addEventListener('click',()=>selectPane(b.dataset.pane));b.addEventListener('keydown',e=>{if(['ArrowLeft','ArrowRight','Home','End'].includes(e.key)){e.preventDefault();const names=['design','content','data'],i=names.indexOf(b.dataset.pane);selectPane(e.key==='Home'?names[0]:e.key==='End'?names[2]:names[(i+(e.key==='ArrowRight'?1:2))%3],true);}});});
  $('chart-form').addEventListener('submit',e=>e.preventDefault());
  $('chart-form').addEventListener('input',()=>{clearTimeout(timer);timer=setTimeout(update,130);});
  $('chart-form').addEventListener('change',update);
  $('title-mode').addEventListener('change',update);
  function saveBlob(blob,name){const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=name;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),30000);}
  function outlined(model){return Core.outlineSVG(Render.render(model,{measure:(s,z)=>font.getAdvanceWidth(s,z,{kerning:true})}),font);}
  async function imageBlob(model,kind,scale){
    const svgBlob=new Blob([outlined(model)],{type:'image/svg+xml;charset=utf-8'});
    if(kind==='svg')return svgBlob;
    const canvas=document.createElement('canvas');canvas.width=1600*scale;canvas.height=({wide:900,classic:1200,square:1600})[model.aspect]*scale;
    const ctx=canvas.getContext('2d');if(!ctx)throw new Error('Không tạo được ảnh PNG. Hãy tải SVG.');
    const url=URL.createObjectURL(svgBlob),image=new Image();
    try{await new Promise((resolve,reject)=>{image.onload=resolve;image.onerror=()=>reject(new Error('Không đọc được ảnh để xuất PNG.'));image.src=url;});ctx.drawImage(image,0,0,canvas.width,canvas.height);return await new Promise((resolve,reject)=>canvas.toBlob(b=>b?resolve(b):reject(new Error('Không tạo được PNG. Hãy chọn độ nét 1× hoặc tải SVG.')),'image/png'));}
    finally{URL.revokeObjectURL(url);canvas.width=0;canvas.height=0;}
  }
  async function download(kind,all=false){
    if(busy)return;if(!update()){toast('Hãy sửa dữ liệu chưa hợp lệ trước khi tải ảnh.');return;}
    let targets;const opts=options(),scale=Number($('export-scale').value);
    try{targets=(all?groups:[current()]).map(g=>{try{return {group:g,model:make(g,opts).model};}catch(e){throw new Error(g.title+': '+e.message);}});}catch(e){toast(e.message);return;}
    busy=true;buttons();const button=$(all?'download-all-'+kind:'export-'+kind),label=button.textContent;button.textContent='Đang tạo ảnh…';
    try{
      await fontReady;const entries=[];
      const suffix=opts.showTitle?'_co_tieu_de':'_khong_tieu_de';
      for(let i=0;i<targets.length;i++){const {group,model}=targets[i];button.textContent='Đang tạo '+(i+1)+'/'+targets.length+'…';const blob=await imageBlob(model,kind,scale),name=group.filename+suffix+'.'+kind;if(all)entries.push({name,bytes:new Uint8Array(await blob.arrayBuffer())});else saveBlob(blob,name);}
      if(all)saveBlob(window.ChartZip.createZip(entries),'6_bieu_do_'+kind.toUpperCase()+suffix+'.zip');
      toast(all?'Đã chuẩn bị ZIP gồm 6 ảnh '+kind.toUpperCase()+'.':'Đã chuẩn bị ảnh '+kind.toUpperCase()+'.');
    }catch(e){toast(e.message||'Có lỗi khi tạo ảnh.');}
    finally{busy=false;button.textContent=label;buttons();}
  }
  $('export-png').addEventListener('click',()=>download('png'));
  $('export-svg').addEventListener('click',()=>download('svg'));
  $('download-all-png').addEventListener('click',()=>download('png',true));
  $('download-all-svg').addEventListener('click',()=>download('svg',true));
  $('import-csv').addEventListener('click',()=>$('file-input').click());
  $('file-input').addEventListener('change',async e=>{const f=e.target.files[0];if(!f)return;try{if(f.size>1024*1024)throw new Error('Hãy chọn file dưới 1 MB.');const csv=await f.text();Model.makeModel({...current(),csv},{...options(),core:Core});$('csv-data').value=csv;update();toast('Đã nhập tên thành phần và tần suất.');}catch(err){toast(err.message);}finally{e.target.value='';}});
  $('reset-current').addEventListener('click',()=>{const src=original.groups.find(g=>g.id===active);current().csv='类别,频数\n'+src.items.map(x=>x.label+','+x.count).join('\n');current().title=src.title;current().source=src.source||'作者根据成语编码数据整理制作';loadGroup();update();toast('Đã khôi phục dữ liệu gốc của nhóm.');});
  $('download-csv').addEventListener('click',()=>{if(!update())return;const r=make(current()),quote=s=>'"'+String(s).replace(/"/g,'""')+'"';const rows=r.metric==='count'?[['类别','编码次数（次）'],...r.labels.map((s,i)=>[s,r.counts[i]])]:[['类别','频数','占样本比例（%）'],...r.labels.map((s,i)=>[s,r.counts[i],Number(r.values[i].toPrecision(12))])];saveBlob(new Blob(['\uFEFF'+rows.map(r=>r.map(quote).join(',')).join('\r\n')],{type:'text/csv;charset=utf-8'}),current().filename+'.csv');});
  $('fullscreen').addEventListener('click',async()=>{try{if(document.fullscreenElement)await document.exitFullscreen();else if($('chart-stage').requestFullscreen)await $('chart-stage').requestFullscreen();else toast('Hãy tải ảnh để xem ở kích thước lớn.');}catch(_){toast('Không mở được toàn màn hình. Hãy tải ảnh để xem lớn.');}});
  document.addEventListener('fullscreenchange',()=>$('fullscreen').textContent=document.fullscreenElement?'Thoát toàn màn hình ↙':'Mở toàn màn hình ↗');
  try{const saved=JSON.parse(localStorage.getItem(key)||'null');if(saved){for(const g of groups){const old=saved.groups?.find(x=>x.id===g.id);if(old&&typeof old.csv==='string'&&typeof old.title==='string'){g.csv=old.csv;g.title=old.title;if(typeof old.source==='string')g.source=old.source;}}if(groups.some(g=>g.id===saved.active))active=saved.active;const o=saved.options||{};for(const [property,id]of [['sampleSize','sample-size'],['aspect','aspect'],['decimals','decimals']])if(o[property]!==undefined)$(id).value=o[property];$('title-mode').value=o.showTitle===false?'without':'with';if(Core.themes[o.theme])document.querySelector('input[name="theme"][value="'+o.theme+'"]').checked=true;if(['1','2','3'].includes(saved.scale))$('export-scale').value=saved.scale;}}catch(_){}
  loadGroup();update();
  const fontReady=new Promise(resolve=>setTimeout(resolve,0)).then(async()=>{const raw=atob(window.ChartFontData),bytes=new Uint8Array(raw.length);for(let i=0;i<raw.length;i++)bytes[i]=raw.charCodeAt(i);if(!window.opentype)throw new Error('Không đọc được bộ xử lý font. Hãy mở file HTML đầy đủ.');const parsed=window.opentype.parse(bytes.buffer);if('FontFace'in window){const face=new FontFace('StudioHan',bytes.buffer);await face.load();document.fonts.add(face);}font=parsed;update();return parsed;});
  fontReady.catch(e=>{font=null;$('status').className='status error';$('status').textContent=e.message||'Không tải được font tiếng Trung.';buttons();});
})();
