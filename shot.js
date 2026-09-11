// 実ブラウザで通して各画面をスクショ（文字あふれ・崩れの目視確認用）
// 使い方: node shot.js
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch({channel:'chrome'});
  const p = await b.newPage({ viewport:{width:414,height:900}, deviceScaleFactor:2 });
  await p.goto('file://' + process.cwd() + '/index.html?c=mail');

  const shot = async (name) => {
    await p.waitForTimeout(400);
    await p.screenshot({ path: `shot_${name}.png`, fullPage: true });
  };
  const pick = async (c, v) => p.click(`#${c} .opt-btn[data-value="${v}"]`);
  const next = async () => { await p.click('.slide.active .btn-next:not([disabled])'); await p.waitForTimeout(350); };

  await shot('0intro');
  await p.click('#s0 .btn-next'); await p.waitForTimeout(350);
  await shot('1units');   await pick('opts1','2戸'); await next();
  await shot('2type');    await pick('opts2','区分マンション（マンションの一室）'); await next();
  await shot('3method');  await pick('opts3','アプリ・会計ソフトで自分でした'); await next();
  await pick('opts4','物件の価格がいくらになっているか分からないこと');
  await pick('opts4','その他');
  await shot('4worry');
  await p.fill('#q4Other','管理組合の修繕計画'); await next();
  await shot('5freq');    await pick('opts5','数ヶ月に1回程度'); await next();
  await shot('6share');   await pick('opts6','確定申告が終わったかどうか'); await next();
  await shot('7interview');
  await pick('opts7','協力できる');
  await p.fill('#email','test@example.com');
  await p.click('#next7'); await p.waitForTimeout(800);
  await shot('8done');

  await b.close();
  console.log('done');
})();
