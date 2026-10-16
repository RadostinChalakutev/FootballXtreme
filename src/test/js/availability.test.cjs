const {test}=require('node:test');
const assert=require('node:assert/strict');
const vm=require('node:vm');
const fs=require('node:fs');
function context(fetch) {
    const elements={hours:{textContent:'',innerHTML:''}};
    const ctx=vm.createContext({window:{location:{protocol:'http:'}},console,Intl,Date,
        document:{addEventListener(){},getElementById:id=>elements[id]||null,querySelector:()=>null},
        setInterval(){},secureFetch:fetch});
    vm.runInContext(fs.readFileSync('src/main/resources/static/app.js','utf8'),ctx);
    vm.runInContext("selectedPitchId=1; selectedDate='2099-01-01'; renderHours=()=>{};",ctx);
    return {ctx,elements,run:s=>vm.runInContext(s,ctx)};
}
const ok=data=>({ok:true,json:async()=>data});
test('uses public availability endpoint and marks occupied slot busy',async()=>{
    const urls=[];
    const c=context(async url=>{urls.push(url);return ok(url.includes('reservations')?[{startTime:'12:00:00',durationMinutes:90}]:url.includes('working-hours')?{openingTime:'10:00',closingTime:'22:00',closed:false}:[]);});
    await c.run('loadAvailability()');
    assert(urls.some(url=>url.startsWith('/api/reservations/pitch/1?date=')));
    assert.equal(c.run("getHourStatus('12:30')"),'busy');
    assert.equal(c.run("getHourStatus('13:30')"),'available');
    assert.equal(c.run("generateHours()[0]"),'10:00');
});
test('failed availability never renders free slots',async()=>{
    const c=context(async()=>({ok:false}));
    await c.run('loadAvailability()');
    assert.equal(c.run('availabilityReady'),false);
    assert.equal(c.run('generateHours().length'),0);
    assert.match(c.elements.hours.textContent,/не може/);
});
test('closed day has no selectable starts',async()=>{
    const c=context(async url=>ok(url.includes('working-hours')?{closed:true}:[]));
    await c.run('loadAvailability()');
    assert.equal(c.run('generateHours().length'),0);
});
test('older responses cannot overwrite newer pitch selection',async()=>{
    const pending=[];
    const c=context(url=>new Promise(resolve=>pending.push({url,resolve})));
    const first=c.run('loadAvailability()');
    c.run('selectedPitchId=2');
    const second=c.run('loadAvailability()');
    const response=(url,old)=>ok(url.includes('working-hours')?{openingTime:'09:00',closingTime:'23:00',closed:false}:url.includes('reservations')&&old?[{startTime:'12:00',durationMinutes:60}]:[]);
    pending.slice(3).forEach(p=>p.resolve(response(p.url,false))); await second;
    pending.slice(0,3).forEach(p=>p.resolve(response(p.url,true))); await first;
    assert.equal(c.run('reservations.length'),0);
});
test('refresh invalidates a selected slot that becomes occupied',async()=>{
    const c=context(async url=>ok(url.includes('reservations')?[{startTime:'12:00',durationMinutes:60}]:url.includes('working-hours')?{openingTime:'09:00',closingTime:'23:00',closed:false}:[]));
    c.run("selectedStartTime='12:00'");
    await c.run('loadAvailability()');
    assert.equal(c.run('selectedStartTime'),null);
});
