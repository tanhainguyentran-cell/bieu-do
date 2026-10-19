(function(root){
  'use strict';
  const core=typeof require==='function'?require('./chart-core'):root.ChartStudio;
  function render(model,options={}){
    const data=core.validate(model),values=data.series[0].values,labels=data.labels;
    const W=1600,H=({wide:900,classic:1200,square:1600})[model.aspect]||1200,measure=options.measure||((s,z)=>Array.from(s).length*z*.85);
    const color=({jade:'#187C68',vermilion:'#B84334',gold:'#986A25'})[model.theme]||'#187C68',ink='#000000',muted='#4A4A4A',grid='#D9D9D9';
    const labelSize=40,valueSize=41,parts=[],showTitle=model.showTitle!==false;
    const fmt=v=>new Intl.NumberFormat('zh-CN',{maximumFractionDigits:model.percent?Number(model.decimals)||0:0}).format(v)+(model.percent?'%':'次');
    const maxLabel=Math.max(...labels.map(s=>measure(s,labelSize)));
    const left=Math.max(340,Math.min(650,maxLabel+120)),right=W-250,top=120,bottom=H-(showTitle||options.plotOnly?315:230);
    if(bottom-top<300)throw new Error('Khung này quá thấp. Hãy chọn tỷ lệ 4:3 hoặc 1:1.');
    const actualH=options.plotOnly?H-240:H;
    parts.push(`<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${actualH}" viewBox="0 0 ${W} ${actualH}" role="img" aria-labelledby="pub-title pub-desc"><title id="pub-title">${core.escape(model.title)}</title><desc id="pub-desc">${core.escape(labels.map((s,i)=>s+'：'+fmt(values[i])).join('；'))}</desc><rect width="${W}" height="${actualH}" fill="#FFFFFF"/>`);
    function text(x,y,s,size=35,anchor='start',weight=400,fill=ink,role=''){parts.push(`<text x="${x}" y="${y}" font-family="StudioHan, Microsoft YaHei, sans-serif" font-size="${size}" font-weight="${weight}" fill="${fill}" text-anchor="${anchor}"${role?' data-role="'+role+'"':''}>${core.escape(s)}</text>`);}
    function line(x1,y1,x2,y2,color=grid,width=1){parts.push(`<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${color}" stroke-width="${width}"/>`);}
    function wrap(s,size,width){const chars=Array.from(s);if(measure(s,size)>width&&s.includes('、')){const cuts=chars.map((c,i)=>c==='、'?i+1:0).filter(Boolean).map(i=>[chars.slice(0,i).join(''),chars.slice(i).join('')]).filter(([a,b])=>measure(a,size)<=width&&measure(b,size)<=width);if(cuts.length)return cuts.sort((a,b)=>Math.abs(measure(a[0],size)-measure(a[1],size))-Math.abs(measure(b[0],size)-measure(b[1],size)))[0];}const lines=[];let line='';for(const ch of chars){if(line&&measure(line+ch,size)>width){lines.push(line);line=ch;}else line+=ch;}if(line)lines.push(line);return lines;}
    text(80,65,model.unit,32,'start',400,muted);text(W-80,65,model.percentBadge,32,'end',400,muted);
    const scale=model.percent?{lo:0,hi:100,ticks:[0,20,40,60,80,100]}:core.niceScale(values);
    const x=v=>left+(v-scale.lo)/(scale.hi-scale.lo)*(right-left);
    for(const tick of scale.ticks){line(x(tick),top-7,x(tick),bottom);text(x(tick),bottom+48,model.percent?tick+'%':String(tick),33,'middle',400,muted);}
    line(left,top-7,left,bottom,'#777777',1.5);
    const rowHeight=(bottom-top)/labels.length,barHeight=Math.min(68,rowHeight*.58);
    labels.forEach((label,i)=>{
      const cy=top+rowHeight*(i+.5),lines=wrap(label,labelSize,left-105);
      if(lines.length>2)throw new Error('Tên thành phần quá dài; hãy rút gọn hoặc chia tên cho dễ đọc.');
      lines.forEach((s,j)=>text(left-28,cy+(j-(lines.length-1)/2)*42+12,s,labelSize,'end'));
      const tip=core.escape(label+'：'+fmt(values[i]));parts.push(`<g tabindex="0" data-tip="${tip}"><title>${tip}</title>`);
      if(model.percent)parts.push(`<rect x="${left}" y="${cy-barHeight/2}" width="${right-left}" height="${barHeight}" rx="4" fill="#EDF3EF"/>`);
      parts.push(`<rect x="${x(0)}" y="${cy-barHeight/2}" width="${Math.max(0,x(values[i])-x(0))}" height="${barHeight}" rx="4" fill="${color}"/>`);
      text(W-80,cy+13,fmt(values[i]),valueSize,'end');parts.push('</g>');
    });
    if(!options.plotOnly){
      if(model.note){const notes=wrap(model.note,28,W-160);notes.forEach((s,i)=>text(W/2,H-(showTitle?192:112)+i*34,s,28,'middle',400,muted));}
      if(showTitle)text(W/2,H-110,'图'+Number(model.figureNo||1)+'  '+model.title,48,'middle',700,'#000000','figure-title');
      const source='（来源：'+(model.source||'作者根据研究数据整理制作')+'）';
      const sourceLines=wrap(source,42,W-160);if(sourceLines.length>1)throw new Error('Nguồn quá dài; hãy rút gọn để phù hợp mẫu.');
      sourceLines.forEach((s,i)=>text(W/2,H-54+i*46,s,42,'middle'));
    }
    parts.push('</svg>');return parts.join('');
  }
  const api={render};if(typeof module==='object'&&module.exports)module.exports=api;else root.PublicationRenderer=api;
})(typeof window!=='undefined'?window:globalThis);
