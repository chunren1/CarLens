import puppeteer from "puppeteer-core";
import { writeFileSync } from "node:fs";
const base="https://ziphare.me";
const routes=[
 ["home","/"],["models","/models"],["model","/models/tesla-model3"],["config","/configurator/tesla-model3"],["quote","/quote"],
 ["order-new","/order/new"],["stores","/stores"],["test-drive","/test-drive"],["finance","/finance"],["service","/service"],
 ["brand","/brand"],["posters","/posters"],["news","/news"],["login","/login"],["wizard","/wizard"],["compare","/compare"],["credits","/credits"],["404","/this-page-does-not-exist"]
];
const browser=await puppeteer.launch({executablePath:"/usr/bin/google-chrome",headless:true,args:["--no-sandbox","--disable-dev-shm-usage","--use-angle=swiftshader","--enable-unsafe-swiftshader","--window-size=1440,1000"]});
const page=await browser.newPage();
const results=[];
for(const vp of [{w:1440,h:1000,label:"desktop"},{w:390,h:844,label:"mobile"}]){
 await page.setViewport({width:vp.w,height:vp.h,isMobile:vp.label==="mobile",hasTouch:vp.label==="mobile"});
 for(const [name,path] of routes){
  const errors=[]; const failed=[];
  const onConsole=m=>{if(m.type()==="error")errors.push(m.text())};
  const onFailed=r=>{if(!r.url().includes("cloudflareinsights"))failed.push(r.url()+" "+(r.failure()?.errorText||""))};
  page.on("console",onConsole); page.on("requestfailed",onFailed);
  try{
   await page.goto(base+path,{waitUntil:"networkidle2",timeout:60000});
   await new Promise(r=>setTimeout(r,500));
   const info=await page.evaluate(()=>{
    const imgs=[...document.images];
    const missingAlt=imgs.filter(i=>!i.hasAttribute("alt")).map(i=>i.currentSrc||i.src);
    const emptyAlt=imgs.filter(i=>i.getAttribute("alt")==="").length;
    const broken=imgs.filter(i=>i.complete&&i.naturalWidth===0).map(i=>i.currentSrc||i.src);
    const small=imgs.filter(i=>i.naturalWidth>0&&i.clientWidth>0&&i.naturalWidth<i.clientWidth*0.8).map(i=>i.currentSrc||i.src).slice(0,5);
    const nodes=[...document.querySelectorAll("button,a,input,select,textarea")];
    const nameless=nodes.filter(el=>{
      if(el.tagName==="A") return false;
      const txt=(el.innerText||el.getAttribute("aria-label")||el.getAttribute("title")||"").trim();
      if(el.tagName==="INPUT"&&["submit","button"].includes(el.type)) return !(el.value||el.getAttribute("aria-label"));
      if(el.tagName==="INPUT"&&["hidden","checkbox","radio"].includes(el.type)) return false;
      return !txt;
    }).map(el=>el.tagName+"."+el.className+" "+(el.getAttribute("type")||"")).slice(0,8);
    const unhiddenInputs=[...document.querySelectorAll("input:not([type=hidden]):not([type=checkbox]):not([type=radio]),textarea,select")].filter(el=>{
      const scope=el.closest("label")||document.querySelector('label[for="'+el.id+'"]');
      return !scope && !el.getAttribute("aria-label") && !el.getAttribute("aria-labelledby");
    }).map(el=>el.tagName+"#"+(el.id||"")+" name="+(el.getAttribute("name")||"")).slice(0,8);
    const emptyLinks=[...document.querySelectorAll('a[href="#"],a[href="javascript:void(0)"]')].length;
    return {
      title:document.title, h1:[...document.querySelectorAll("h1")].map(x=>x.textContent?.trim()), h1Count:document.querySelectorAll("h1").length,
      imgCount:imgs.length,missingAlt,emptyAlt,broken,small, nameless, unhiddenInputs, emptyLinks,
      overflow:document.documentElement.scrollWidth-document.documentElement.clientWidth,
      scrollWidth:document.documentElement.scrollWidth, clientWidth:document.documentElement.clientWidth,
      bodyText:(document.body.innerText||"").length
    };
   });
   results.push({vp:vp.label,name,path,...info,errors,failed});
   console.log(vp.label,name,JSON.stringify({overflow:info.overflow,h1:info.h1Count,missingAlt:info.missingAlt.length,broken:info.broken.length,nameless:info.nameless.length,unlabeled:info.unhiddenInputs.length,errors:errors.length,failed:failed.length}));
  }catch(e){results.push({vp:vp.label,name,path,error:e.message,errors,failed});console.log(vp.label,name,"ERROR",e.message)}
  page.off("console",onConsole); page.off("requestfailed",onFailed);
 }
}
writeFileSync("/tmp/ui-audit.json",JSON.stringify(results,null,2));
await browser.close();
