// 実ブラウザで通して各画面をスクショ（文字あふれ・崩れの目視確認用）
// 使い方: node shot.js
// Q5 の分岐があるため、2本通す:
//   main … 買い増し意向あり（Q6〜Q8 を通る、全10問）
//   skip … 買い増し意向なし（Q6〜Q8 を飛ばし Q9 へ、全7問）
const { chromium } = require('playwright');

(async () => {
  const b = await chromium.launch({ channel: 'chrome' });

  const open = async () => {
    const p = await b.newPage({ viewport: { width: 414, height: 900 }, deviceScaleFactor: 2 });
    await p.goto('file://' + process.cwd() + '/index.html?c=mail');
    return p;
  };
  const shot = async (p, name) => {
    await p.waitForTimeout(400);
    await p.screenshot({ path: `shot_${name}.png`, fullPage: true });
  };
  const pick = (p, c, v) => p.click(`#${c} .opt-btn[data-value="${v}"]`);
  const next = async (p) => {
    await p.click('.slide.active .btn-next:not([disabled])');
    await p.waitForTimeout(350);
  };
  // 実際に表示されている設問番号（分岐が効いているかの確認に使う）
  const qnum = (p) => p.textContent('.slide.active .q-number');

  /* ===== 本線: 買い増し意向あり ===== */
  {
    const p = await open();
    await shot(p, '0intro');
    await next(p);
    await shot(p, '1units');   await pick(p, 'opts1', '2戸'); await next(p);
    await shot(p, '2type');    await pick(p, 'opts2', '区分マンション（マンションの一室）'); await next(p);
    await shot(p, '3feeling'); await pick(p, 'opts3', '内容によってはありがたい'); await next(p);
    await pick(p, 'opts4', '買い増しの営業ばかりで、今の物件の話がない');
    await pick(p, 'opts4', 'その他');
    await p.fill('#q4Other', '管理組合の修繕計画の話がない');
    await shot(p, '4dissat');  await next(p);
    await shot(p, '5intent');  await pick(p, 'opts5', '良い物件があれば購入したい'); await next(p);
    await shot(p, '6research');await pick(p, 'opts6', '週に数回は見ている'); await next(p);
    await pick(p, 'opts7', '楽待');
    await pick(p, 'opts7', 'その他');
    await p.fill('#q7Other', 'オーナーズブック');
    await shot(p, '7media');   await next(p);
    await pick(p, 'opts8', '自分に合う物件が出てくる');
    await shot(p, '8edge');    await next(p);
    await shot(p, '9income');  await pick(p, 'opts9', 'おおよその幅なら伝えてよい'); await next(p);
    await shot(p, '10loan');   await pick(p, 'opts10', '減ったか変わらないか、だけなら伝えてよい'); await next(p);
    await shot(p, '11interview');
    await pick(p, 'opts11', '協力できる');
    await p.fill('#email', 'test@example.com');
    await p.click('#next11'); await p.waitForTimeout(800);
    await shot(p, '12done');
    await p.close();
  }

  /* ===== 分岐: 買い増し意向なし（Q6〜Q8 を飛ばす） ===== */
  {
    const p = await open();
    await next(p);
    await pick(p, 'opts1', '1戸'); await next(p);
    await pick(p, 'opts2', '戸建て'); await next(p);
    await pick(p, 'opts3', '連絡は一切不要'); await next(p);
    await pick(p, 'opts4', '特に不満はない'); await next(p);
    await pick(p, 'opts5', '購入する考えはない'); await next(p);
    const landed = await qnum(p);
    if (landed.trim() !== 'Q9') throw new Error(`分岐失敗: Q9 のはずが ${landed}`);
    await shot(p, 'skip_9income');
    const prog = await p.textContent('#progressText');
    console.log(`  分岐OK: Q5 の次が ${landed.trim()} / 進捗 ${prog.trim()}`);
    await p.close();
  }

  await b.close();
  console.log('done');
})();
