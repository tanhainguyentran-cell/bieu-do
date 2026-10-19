(function (root) {
  'use strict';
  const themes = {
    jade: { bg:'#FAF9F5', ink:'#203F37', muted:'#68766E', grid:'#DEDCD2', accent:'#187C68', soft:'#E4EDE5', colors:['#187C68','#C48B55','#5F86A1','#9D7B95'], ring:['#187C68','#67A391','#CBA46D','#5F86A1','#A098BA','#B9C3A4','#A75F51','#D1C5B0'] },
    vermilion: { bg:'#FFF9F4', ink:'#542B27', muted:'#8A7069', grid:'#E8DAD2', accent:'#B84334', soft:'#F4E5DA', colors:['#B84334','#CB974B','#537E76','#8A7399'], ring:['#B84334','#D67F5B','#D6B46B','#537E76','#8A7399','#A5BC92','#7C9FB8','#CABAB0'] },
    gold: { bg:'#17221F', ink:'#F4EEE1', muted:'#C0C5BA', grid:'#35443C', accent:'#E5BC73', soft:'#28392F', colors:['#E5BC73','#7BC4B0','#C49FAF','#8FAED1'], ring:['#E5BC73','#7BC4B0','#8FAED1','#C49FAF','#BECE92','#DC997D','#A496C6','#8C9B92'] }
  };
  const presets = {
    line:{type:'line', title:'出口贸易增长趋势', subtitle:'2020—2025年 · 年度变化', unit:'单位：亿美元', data:'年份,出口额\n2020,190\n2021,218\n2022,246\n2023,235\n2024,278\n2025,312'},
    bar:{type:'bar', title:'主要市场出口额对比', subtitle:'按市场比较 · 同一统计口径', unit:'单位：亿美元', data:'市场,出口额\n中国,84\n美国,72\n欧盟,58\n日本,43\n韩国,31'},
    horizontal:{type:'horizontal', title:'主要市场出口额排名', subtitle:'按出口额排列 · 从高到低', unit:'单位：亿美元', data:'市场,出口额\n中国,84\n美国,72\n欧盟,58\n日本,43\n韩国,31'},
    donut:{type:'donut', title:'出口市场结构', subtitle:'各市场占总体的比重', unit:'单位：%', data:'市场,份额\n中国,36\n美国,27\n欧盟,19\n日本,11\n韩国,7'}
  };
  const esc = value => String(value).replace(/[&<>"']/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[c]));
  const unesc = value => value.replace(/&(amp|lt|gt|quot|apos);/g, (_,s)=>({amp:'&',lt:'<',gt:'>',quot:'"',apos:"'"}[s]));
  const defaultMeasure = (s,size) => Array.from(s).reduce((a,c)=>a+(/[^\x00-\xff]/.test(c)?1:0.56)*size,0);

  function parseCSV(input,options={}) {
    const str=String(input).replace(/^\uFEFF/,'').replace(/\r\n?/g,'\n').trim();
    if (!str) throw new Error('Bạn cần nhập bảng dữ liệu, gồm dòng tiêu đề và ít nhất một dòng số liệu.');
    let quoted=false, first='';
    for(let i=0;i<str.length;i++) { const c=str[i]; if(c==='"') quoted=!quoted; if(c==='\n'&&!quoted) break; first+=c; }
    function count(sep) {let n=0,q=false; for(const c of first) {if(c==='"')q=!q; else if(c===sep&&!q)n++;} return n;}
    const delimiter=['\t',';',','].sort((a,b)=>count(b)-count(a))[0];
    if(!count(delimiter)) throw new Error('Hãy tách các cột bằng dấu phẩy, dấu chấm phẩy hoặc phím Tab.');
    const rows=[];let row=[],cell='',inside=false,closed=false;
    const endCell=()=>{row.push(cell.trim());cell='';closed=false;};
    const endRow=()=>{endCell();if(row.some(v=>v!==''))rows.push(row);row=[];};
    for(let i=0;i<str.length;i++) {
      const c=str[i];
      if(inside) { if(c==='"') {if(str[i+1]==='"'){cell+='"';i++;}else{inside=false;closed=true;}}else cell+=c; }
      else if(c==='"') {if(cell.trim()||closed)throw new Error('Dấu ngoặc kép trong CSV chưa đúng định dạng.');inside=true;cell='';}
      else if(c===delimiter) endCell();
      else if(c==='\n') endRow();
      else {if(closed&&!/\s/.test(c))throw new Error('Sau dấu ngoặc kép đóng cần dấu tách cột.');cell+=c;}
    }
    if(inside) throw new Error('CSV có dấu ngoặc kép chưa được đóng.');
    endRow();
    if(rows.length<2)throw new Error('Bảng cần có tiêu đề cột và ít nhất một dòng dữ liệu.');
    const headers=rows.shift();
    if(headers.length<2||headers.length>5)throw new Error('Bảng cần một cột nhãn và từ một đến bốn cột số liệu.');
    if(headers.some(h=>!h||h.length>60))throw new Error('Tên các cột cần có nội dung và không quá 60 ký tự.');
    if(new Set(headers.slice(1)).size!==headers.length-1)throw new Error('Tên các chuỗi số liệu cần khác nhau.');
    if(rows.length>24)throw new Error('Mẫu này hỗ trợ tối đa 24 mục để nhãn dễ đọc.');
    const labels=[],series=headers.slice(1).map(name=>({name,values:[]}));
    rows.forEach((r,i)=>{
      if(r.length!==headers.length)throw new Error('Dòng '+(i+2)+' có '+r.length+' cột; cần '+headers.length+' cột.');
      if(!r[0]||r[0].length>80)throw new Error('Nhãn ở dòng '+(i+2)+' cần có nội dung và không quá 80 ký tự.');
      labels.push(r[0]);
      r.slice(1).forEach((v,j)=>{
        if(options.allowPercentValues&&j===1&&/比例|%|tỷ\s*lệ/i.test(headers[j+1])&&v.endsWith('%'))v=v.slice(0,-1).trim();
        if(delimiter!==',')v=v.replace(',','.');
        if(!/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?$/i.test(v))throw new Error('Ô số ở dòng '+(i+2)+', cột '+(j+2)+' chưa hợp lệ. Dùng số thập phân với dấu chấm.');
        const n=Number(v);
        if(!Number.isFinite(n)||Math.abs(n)>1e12)throw new Error('Giá trị phải hữu hạn và nằm trong khoảng −1.000 tỷ đến 1.000 tỷ.');
        series[j].values.push(n===0?0:n);
      });
    });
    if(new Set(labels).size!==labels.length)throw new Error('Các nhãn ở cột đầu cần khác nhau.');
    return {labels,series,labelName:headers[0]};
  }

  function validate(model) {
    if(!presets[model.type])throw new Error('Kiểu biểu đồ chưa hợp lệ.');
    if(!String(model.title||'').trim())throw new Error('Hãy nhập tiêu đề biểu đồ.');
    const data=parseCSV(model.data);
    if(model.percent){
      if(data.series.length!==1)throw new Error('Biểu đồ tỷ trọng cần đúng một cột phần trăm.');
      if(data.series[0].values.some(v=>v<0||v>100))throw new Error('Tỷ trọng cần nằm trong khoảng 0–100%.');
      const total=data.series[0].values.reduce((a,b)=>a+b,0);
      if(!model.multi&&Math.abs(total-100)>0.005)throw new Error('Tổng nhóm đang là '+total+'%, chưa bằng 100%. Hãy kiểm tra số liệu trước khi tải ảnh.');
    }
    if(model.type==='donut') {
      if(data.series.length!==1)throw new Error('Biểu đồ vòng khuyên cần đúng một cột số liệu.');
      if(data.labels.length>8)throw new Error('Vòng khuyên nên có tối đa 8 phần. Hãy gộp các phần nhỏ vào nhóm “Khác”.');
      if(data.series[0].values.some(n=>n<0))throw new Error('Vòng khuyên không sử dụng số âm.');
      if(data.series[0].values.reduce((a,b)=>a+b,0)<=0)throw new Error('Tổng các phần của vòng khuyên phải lớn hơn 0.');
    }
    if(model.type==='horizontal'&&data.labels.length>12)throw new Error('Thanh ngang hỗ trợ tối đa 12 mục.');
    return data;
  }

  function niceScale(values) {
    let lo=Math.min(0,...values),hi=Math.max(0,...values);
    if(lo===hi)hi=1;
    const raw=Math.max((hi-lo)/5,Number.MIN_VALUE),power=Math.max(Math.pow(10,Math.floor(Math.log10(raw))),Number.MIN_VALUE),factor=raw/power;
    const step=([1,2,2.5,5,10].find(n=>n>=factor)||10)*power;
    lo=Math.floor(lo/step)*step;hi=Math.ceil(hi/step)*step;
    const ticks=[]; for(let k=0;k<=20;k++){const v=lo+k*step;if(v>hi+step*1e-6)break;ticks.push(Math.abs(v)<step*1e-8?0:v);}
    return {lo,hi,ticks,step};
  }

  function render(model, options={}) {
    const data=validate(model),th=themes[model.theme]||themes.jade;
    const W=1600,H=({wide:900,classic:1200,square:1600})[model.aspect]||900;
    const measure=options.measure||defaultMeasure;
    const digits=Math.max(0,Math.min(4,Number(model.decimals)||0));
    const format=n=>(n!==0&&Math.abs(n)<Math.pow(10,-digits)/2?n.toExponential(2):new Intl.NumberFormat('zh-CN',{maximumFractionDigits:digits}).format(n))+(model.percent?'%':'');
    const axisFormat=n=>{
      if(model.percent)return n+'%';
      const a=Math.abs(n);
      if(n!==0&&a<1e-4)return n.toExponential(1);
      if(a>=1e8)return new Intl.NumberFormat('zh-CN',{maximumFractionDigits:2}).format(n/1e8)+'亿';
      if(a>=1e4)return new Intl.NumberFormat('zh-CN',{maximumFractionDigits:2}).format(n/1e4)+'万';
      return new Intl.NumberFormat('zh-CN',{maximumFractionDigits:Math.min(10,Math.max(digits,-Math.floor(Math.log10(scale.step))+1))}).format(n);
    };
    const parts=[];
    const text=(x,y,value,size=22,fill=th.ink,anchor='start',extra='')=>parts.push(`<text x="${x}" y="${y}" fill="${fill}" font-family="StudioHan, Microsoft YaHei, PingFang SC, sans-serif" font-size="${size}" text-anchor="${anchor}" ${extra}>${esc(value)}</text>`);
    const line=(x1,y1,x2,y2,color=th.grid,width=1)=>parts.push(`<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${color}" stroke-width="${width}"/>`);
    const wrap=(s,size,maxWidth,maxLines=3)=>{
      const lines=[];let cur='';
      for(const c of Array.from(String(s||''))) {
        if(c==='\n'||(cur&&measure(cur+c,size)>maxWidth)){lines.push(cur);cur=c==='\n'?'':c;}else cur+=c;
      }
      if(cur)lines.push(cur);
      if(lines.length>maxLines){lines.length=maxLines;let last=lines[maxLines-1];while(measure(last+'…',size)>maxWidth&&last)last=Array.from(last).slice(0,-1).join('');lines[maxLines-1]=last+'…';}
      return lines;
    };
    const clip=(s,size,width)=>wrap(s,size,width,1)[0]||'';
    const desc=`${model.title}。${model.demo?'示例数据，非真实统计。':''}${data.labels.map((label,i)=>label+'：'+data.series.map(s=>s.name+' '+format(s.values[i])).join('，')).join('；')}。${model.source||''}`;
    parts.push(`<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-labelledby="chart-title chart-desc"><title id="chart-title">${esc(model.title)}</title><desc id="chart-desc">${esc(desc)}</desc><rect width="${W}" height="${H}" fill="${th.bg}"/>`);
    parts.push(`<rect x="80" y="55" width="7" height="24" rx="3" fill="${th.accent}"/>`);
    text(103,76,model.percent?'成语研究 · 比例分布':'数据观察 / DATA NOTES',18,th.muted);
    text(W-80,76,model.percent?(model.percentBadge||'合计 100%'):'01',20,th.muted,'end');
    let titleSize=54;
    while(titleSize>36&&wrap(model.title,titleSize,W-160,10).length>2)titleSize-=2;
    const titleLines=wrap(model.title,titleSize,W-160,3);
    let cursor=139;
    titleLines.forEach(v=>{text(80,cursor,v,titleSize);cursor+=titleSize*1.32;});
    const subtitleLines=wrap(model.subtitle,23,W-160,2);
    subtitleLines.forEach(v=>{text(80,cursor-15,v,23,th.muted);cursor+=31;});
    cursor+=14;
    if(model.unit){text(80,cursor,clip(model.unit,21,W-160),21,th.muted);cursor+=34;}
    if(data.series.length>1&&model.type!=='donut') {
      let lx=80;
      data.series.forEach((s,i)=>{
        const width=Math.min(420,measure(s.name,21)+45);
        if(lx+width>W-80){lx=80;cursor+=31;}
        parts.push(`<circle cx="${lx+7}" cy="${cursor-7}" r="6" fill="${th.colors[i]}"/>`);
        text(lx+23,cursor,clip(s.name,21,380),21,th.muted);lx+=width+30;
      });cursor+=26;
    }
    const top=cursor+25, bottom=H-185;
    if(bottom-top<180)throw new Error('Tiêu đề hoặc phụ đề quá dài cho khung này. Hãy rút gọn hoặc chọn khung 4:3 / 1:1.');
    const all=data.series.flatMap(s=>s.values),scale=model.percent?{lo:0,hi:100,ticks:[0,20,40,60,80,100],step:20}:niceScale(all);
    const n=data.labels.length,k=data.series.length;
    const tip=(label,s,v)=>`<g tabindex="0" data-tip="${esc(label+' · '+s.name+': '+format(v))}"><title>${esc(label+' · '+s.name+': '+format(v))}</title>`;
    const showNumbers=model.showValues!==false;

    if(model.type==='donut') {
      const vals=data.series[0].values,total=vals.reduce((a,b)=>a+b,0);
      const cx=520,cy=(top+bottom)/2, radius=Math.min(220,(bottom-top)/2-8),inner=radius*0.70;
      const point=(r,a)=>[cx+r*Math.cos(a),cy+r*Math.sin(a)];let angle=-Math.PI/2;
      vals.forEach((v,i)=>{
        if(v===0)return;
        const span=v/total*Math.PI*2,next=angle+span;
        parts.push(tip(data.labels[i],data.series[0],v));
        if(span>Math.PI*2-1e-8)parts.push(`<circle cx="${cx}" cy="${cy}" r="${(radius+inner)/2}" fill="none" stroke="${th.ring[i]}" stroke-width="${radius-inner}"/>`);
        else {
          const a=point(radius,angle),b=point(radius,next),c=point(inner,next),d=point(inner,angle),large=span>Math.PI?1:0;
          parts.push(`<path d="M ${a.join(' ')} A ${radius} ${radius} 0 ${large} 1 ${b.join(' ')} L ${c.join(' ')} A ${inner} ${inner} 0 ${large} 0 ${d.join(' ')} Z" fill="${th.ring[i]}" stroke="${th.bg}" stroke-width="4"/>`);
        }
        parts.push('</g>');angle=next;
      });
      text(cx,cy-15,'合计',22,th.muted,'middle');
      const sum=clip(format(total),46,inner*1.8);text(cx,cy+48,sum,46,th.ink,'middle');
      const step=Math.min(70,(bottom-top)/(n+1)),start=cy-(n-1)*step/2;
      data.labels.forEach((label,i)=>{
        const y=start+i*step;
        parts.push(`<circle cx="945" cy="${y-8}" r="7" fill="${th.ring[i]}"/>`);
        text(966,y,clip(label,25,280),25);
        text(1360,y,(vals[i]/total*100).toFixed(1)+'%',26,th.ink,'end');
        if(showNumbers&&!(String(model.unit).includes('%')&&Math.abs(total-100)<1e-7))text(1470,y,clip(format(vals[i]),21,95),21,th.muted,'end');
      });
    } else if(model.type==='horizontal') {
      const left=320,right=W-290,x=v=>left+(v-scale.lo)/(scale.hi-scale.lo)*(right-left),zero=x(0);
      scale.ticks.forEach(v=>{line(x(v),top-6,x(v),bottom);text(x(v),bottom+36,axisFormat(v),19,th.muted,'middle');});
      line(zero,top-6,zero,bottom,th.muted,1.2);
      const rowHeight=(bottom-top)/n,group=Math.min(rowHeight*.63,72),bh=group/k;
      data.labels.forEach((label,i)=>{
        const cy=top+rowHeight*(i+.5);
        text(left-25,cy+8,clip(label,23,left-100),23,th.ink,'end');
        data.series.forEach((s,j)=>{
          const v=s.values[i],end=x(v),y=cy-group/2+j*bh;
          parts.push(tip(label,s,v));
          if(model.percent)parts.push(`<rect x="${left}" y="${y}" width="${right-left}" height="${Math.max(1,bh-5)}" rx="4" fill="${th.soft}"/>`);
          parts.push(`<rect x="${Math.min(zero,end)}" y="${y}" width="${Math.abs(end-zero)}" height="${Math.max(1,bh-5)}" rx="4" fill="${th.colors[j]}"/>`);
          if(showNumbers&&n*k<=24)text(W-80,y+(bh-5)/2+7,format(v),20,th.ink,'end');
          parts.push('</g>');
        });
      });
    } else {
      const left=160,right=W-95,y=v=>bottom-(v-scale.lo)/(scale.hi-scale.lo)*(bottom-top),zero=y(0);
      scale.ticks.forEach(v=>{line(left,y(v),right,y(v));text(left-22,y(v)+7,axisFormat(v),20,th.muted,'end');});
      line(left,zero,right,zero,th.muted,1.25);
      const slot=(right-left)/n,x=i=>model.type==='bar'?left+slot*(i+.5):n===1?(left+right)/2:left+(right-left)*i/(n-1);
      const axisSkip=Math.ceil(n/10);
      data.labels.forEach((label,i)=>{
        if(i%axisSkip!==0&&i!==n-1)return;
        const width=model.type==='bar'?slot*axisSkip-10:n===1?400:(right-left)/(Math.min(n,10)-1)-8;
        let anchor='middle',tx=x(i);
        if(model.type==='line'&&n>1){if(i===0)anchor='start';if(i===n-1)anchor='end';}
        wrap(label,20,Math.max(80,width),2).forEach((s,j)=>text(tx,bottom+38+j*26,s,20,th.muted,anchor));
      });
      if(model.type==='bar') {
        const group=Math.min(150,slot*.7),bw=group/k;
        data.labels.forEach((label,i)=>data.series.forEach((s,j)=>{
          const v=s.values[i],xx=x(i)-group/2+j*bw,yy=y(v);
          parts.push(tip(label,s,v));
          parts.push(`<rect x="${xx}" y="${Math.min(yy,zero)}" width="${Math.max(1,bw-7)}" height="${Math.abs(yy-zero)}" rx="5" fill="${th.colors[j]}"/>`);
          if(showNumbers&&n*k<=20)text(xx+(bw-7)/2,yy+(v<0?27:-13),format(v),21,th.ink,'middle');
          parts.push('</g>');
        }));
      } else {
        const labelBoxes=[];
        data.series.forEach((s,j)=>{
          const points=s.values.map((v,i)=>[x(i),y(v)]);
          if(k===1&&n>1&&s.values.every(v=>v>=0)) {
            parts.push(`<defs><linearGradient id="area-wash" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${th.accent}" stop-opacity="0.18"/><stop offset="1" stop-color="${th.accent}" stop-opacity="0"/></linearGradient></defs><path d="M ${points[0][0]} ${zero} L ${points.map(p=>p.join(' ')).join(' L ')} L ${points[points.length-1][0]} ${zero} Z" fill="url(#area-wash)"/>`);
          }
          parts.push(`<polyline points="${points.map(p=>p.join(',')).join(' ')}" fill="none" stroke="${th.colors[j]}" stroke-width="4" stroke-linejoin="round" stroke-linecap="round"/>`);
          points.forEach(([xx,yy],i)=>{
            parts.push(tip(data.labels[i],s,s.values[i]));
            parts.push(`<circle cx="${xx}" cy="${yy}" r="6" fill="${th.bg}" stroke="${th.colors[j]}" stroke-width="3"/>`);
            if(showNumbers&&n*k<=24) {
              const v=format(s.values[i]),w=measure(v,21),box=[xx-w/2,yy-41,w,25];
              if(!labelBoxes.some(b=>box[0]<b[0]+b[2]+8&&box[0]+box[2]+8>b[0]&&box[1]<b[1]+b[3]+8&&box[1]+box[3]+8>b[1])){text(xx,yy-18,v,21,th.ink,'middle');labelBoxes.push(box);}
            }
            parts.push('</g>');
          });
        });
      }
    }
    const footer=H-112;
    line(80,footer,W-80,footer);
    const source=model.demo?'来源：示例数据（非真实统计）':model.source?('来源：'+model.source):'来源：未填写';
    wrap(source,18,W-360,2).forEach((s,i)=>text(80,footer+33+i*25,s,18,th.muted));
    if(model.note)text(80,H-25,clip(model.note,17,W-160),17,th.muted);
    text(W-80,footer+33,model.demo?'示例数据':'数据图表',18,th.muted,'end');
    parts.push('</svg>');
    return parts.join('');
  }

  function outlineSVG(svg,font) {
    const missing=new Set();
    const output=svg.replace(/<text\b([^>]*)>([\s\S]*?)<\/text>/g,(_,attributes,content)=>{
      const a={};attributes.replace(/([\w-]+)="([^"]*)"/g,(_,k,v)=>{a[k]=unesc(v);});
      const s=unesc(content),size=Number(a['font-size'])||22;let x=Number(a.x)||0,y=Number(a.y)||0;
      for(const char of s)if(!font.hasChar(char)&&char!=='\n'&&char!=='\r')missing.add(char);
      const width=font.getAdvanceWidth(s,size,{kerning:true});
      if(a['text-anchor']==='middle')x-=width/2;else if(a['text-anchor']==='end')x-=width;
      const path=font.getPath(s,x,y,size,{kerning:true});
      const bold=Number(a['font-weight'])>=600?` stroke="${esc(a.fill||'#000000')}" stroke-width="${size*0.017}" stroke-linejoin="round"`:'';
      return `<path d="${path.toPathData(2)}" fill="${esc(a.fill||'#000000')}"${bold}${a.transform?' transform="'+esc(a.transform)+'"':''}/>`;
    });
    if(missing.size)throw new Error('Font chưa hỗ trợ các ký tự: '+Array.from(missing).slice(0,12).join(' ')+' . Hãy thay các ký tự này trước khi tải ảnh.');
    return output.replace(/\s(?:tabindex|data-tip)="[^"]*"/g,'');
  }
  const api={themes,presets,parseCSV,validate,niceScale,render,outlineSVG,escape:esc};
  if(typeof module==='object'&&module.exports)module.exports=api;else root.ChartStudio=api;
})(typeof window!=='undefined'?window:globalThis);
