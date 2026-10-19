(function(root){
  'use strict';
  const table=new Uint32Array(256);
  for(let n=0;n<256;n++){let c=n;for(let k=0;k<8;k++)c=(c&1)?0xEDB88320^(c>>>1):c>>>1;table[n]=c>>>0;}
  function crc32(bytes){let c=0xFFFFFFFF;for(let i=0;i<bytes.length;i++)c=table[(c^bytes[i])&255]^(c>>>8);return (c^0xFFFFFFFF)>>>0;}
  function createZip(entries){
    const locals=[],centrals=[];let offset=0,centralSize=0;
    for(const e of entries){
      const name=new TextEncoder().encode(e.name),bytes=e.bytes instanceof Uint8Array?e.bytes:new Uint8Array(e.bytes),crc=crc32(bytes);
      const header=new Uint8Array(30+name.length),v=new DataView(header.buffer);
      v.setUint32(0,0x04034B50,true);v.setUint16(4,20,true);v.setUint16(6,0x800,true);v.setUint16(12,0x21,true);v.setUint32(14,crc,true);v.setUint32(18,bytes.length,true);v.setUint32(22,bytes.length,true);v.setUint16(26,name.length,true);header.set(name,30);
      locals.push(header,bytes);
      const central=new Uint8Array(46+name.length),cv=new DataView(central.buffer);
      cv.setUint32(0,0x02014B50,true);cv.setUint16(4,20,true);cv.setUint16(6,20,true);cv.setUint16(8,0x800,true);cv.setUint16(14,0x21,true);cv.setUint32(16,crc,true);cv.setUint32(20,bytes.length,true);cv.setUint32(24,bytes.length,true);cv.setUint16(28,name.length,true);cv.setUint32(42,offset,true);central.set(name,46);
      centrals.push(central);centralSize+=central.length;offset+=header.length+bytes.length;
    }
    const end=new Uint8Array(22),ev=new DataView(end.buffer);ev.setUint32(0,0x06054B50,true);ev.setUint16(8,entries.length,true);ev.setUint16(10,entries.length,true);ev.setUint32(12,centralSize,true);ev.setUint32(16,offset,true);
    return new Blob([...locals,...centrals,end],{type:'application/zip'});
  }
  const api={crc32,createZip};if(typeof module==='object'&&module.exports)module.exports=api;else root.ChartZip=api;
})(typeof window!=='undefined'?window:globalThis);
