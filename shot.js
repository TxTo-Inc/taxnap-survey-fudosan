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
  const pick = async (container, value) => {
    await p.click(`#${container} .opt-btn[data-value="${value}"]`);
  };
  const next = async () => {
    await p.click('.slide.active .btn-next:not([disabled])');
    await p.waitForTimeout(350);
  };

  await shot('0intro');
  await p.click('#s0 .btn-next'); await p.waitForTimeout(350);
  await shot('1units');   await pick('opts1','2戸'); await next();
  await shot('2type');    await pick('opts2','区分マンション（マンションの一室）'); await next();
  await shot('3method');  await pick('opts3','アプリ・会計ソフトで自分でした'); await next();
  // 複数選択＋その他の自由記述を開いた状態を撮る
  await pick('opts4','確定申告のやり方・経費にできるもの');
  await pick('opts4','その他');
  await shot('4want');
  await p.fill('#q4Other','管理会社の変更について'); await next();
  await shot('5freq');    await pick('opts5','数ヶ月に1回程度'); await next();
  await shot('6action');  await pick('opts6','内容について自分で調べた'); await next();
  await shot('7pref');    await pick('opts7','内容による'); await next();
  await shot('8interview');
  await pick('opts8','協力できる');
  await p.fill('#email','test@example.com');
  await shot('8interview_email');
  await p.click('#next8'); await p.waitForTimeout(800);
  await shot('9done');

  await b.close();
  console.log('done');
})();
