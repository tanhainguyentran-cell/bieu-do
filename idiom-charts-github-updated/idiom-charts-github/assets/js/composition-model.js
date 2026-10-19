(function(root){
  'use strict';
  function makeModel(group,options={}){
    const core=options.core||(typeof require==='function'?require('./chart-core.js'):root.ChartStudio);
    const input=core.parseCSV(group.csv||('类别,频数\n'+group.items.map(x=>x.label+','+x.count).join('\n')),{allowPercentValues:true});
    if(input.series.length!==1&&!(input.series.length===2&&/比例|%|tỷ\s*lệ/i.test(input.series[1].name)))throw new Error('Bảng cần một cột tên và một cột tần suất. Có thể có thêm cột % đã tính.');
    const n=Number(options.sampleSize===undefined?100:options.sampleSize);
    if(!Number.isInteger(n)||n<1||n>1000000)throw new Error('Số trường hợp N phải là số nguyên từ 1 đến 1.000.000.');
    const counts=input.series[0].values;
    if(counts.some(x=>!Number.isInteger(x)||x<0))throw new Error('Tần suất phải là số nguyên không âm.');
    if(counts.some(x=>x>n))throw new Error('Tần suất của một nhãn không được lớn hơn số trường hợp N.');
    const total=counts.reduce((a,b)=>a+b,0);
    if(total===0)throw new Error('Tổng tần suất cần lớn hơn 0.');
    if(!group.multi&&total!==n)throw new Error('Nhóm chỉ gán một nhãn cần tổng tần suất bằng N = '+n+'. Hiện tổng là '+total+'.');
    const metric=group.metric==='count'?'count':'percent',basis='cases',denominator=n;
    const labels=input.labels.map(s=>s.replace(/^(?:XSM|XME|XCV|MDF|YPM)\d+\s*/,''));
    if(new Set(labels).size!==labels.length)throw new Error('Tên thành phần sau khi bỏ mã cần khác nhau.');
    const values=metric==='count'?counts:counts.map(x=>x/denominator*100);
    const note=metric==='count'?'注：同一例可赋予多个标签。':group.id==='origin'?'注：按原始序号统计；相同表达在不同序号下分别计数。':'';
    const source=options.source===undefined?(group.source||'作者根据成语编码数据整理制作'):options.source;
    const model={type:'horizontal',percent:metric==='percent',multi:group.multi,title:group.title,figureNo:Number(options.startNumber||1)+(Number(group.figureNo||1)-1),percentBadge:metric==='count'?'共'+total+'次':'N = '+n,unit:metric==='count'?'单位：次':'单位：%',valueSuffix:metric==='count'?'次':'%',source,note,theme:options.theme||'jade',aspect:options.aspect||'classic',decimals:metric==='count'?0:Number(options.decimals||0),showValues:true,demo:false,data:'类别,'+(metric==='count'?'编码次数':'比例')+'\n'+labels.map((label,i)=>'"'+label.replace(/"/g,'""')+'",'+values[i]).join('\n')};
    model.showTitle=options.showTitle!==false;
    return {model,labels,counts,values,total,sampleSize:n,basis,metric,sumPercent:metric==='percent'?values.reduce((a,b)=>a+b,0):null};
  }
  const api={makeModel};if(typeof module==='object'&&module.exports)module.exports=api;else root.CompositionModel=api;
})(typeof window!=='undefined'?window:globalThis);
