/**
 * 不動産オーナーアンケート — 回答受け口（Google Apps Script）
 *
 * 【セットアップ手順】README.md の「GASデプロイ手順」を参照。
 *
 * 要点だけ:
 *  1. スプレッドシートを作り、拡張機能 > Apps Script でこのコードを貼る
 *  2. プロジェクトの設定 > スクリプト プロパティ に POST_TOKEN を登録
 *     （index.html の POST_TOKEN と同じ文字列にする）
 *  3. デプロイ > 新しいデプロイ > 種類=ウェブアプリ
 *       次のユーザーとして実行: 自分
 *       アクセスできるユーザー: 全員
 *  4. 発行された /exec URL を index.html の GAS_URL に貼る
 *
 * 注意: フロントは mode:'no-cors' で送るためレスポンスを読めない。
 *       到達確認は本スプレッドシートの行と、下部の doGet ヘルスチェックで行う。
 */

var SHEET_SURVEY = '回答';

// 列の定義。key = index.html の payload のキー / label = シートに表示する見出し
// ※ key は変更しないこと（フロントの送信キーと対応）。label は自由に変えてよい。
var COLUMNS = [
  { key: 'timestamp',    label: '送信時刻' },
  { key: 'received_at',  label: '受信時刻(JST)' },
  { key: 'channel',      label: '配信経路' },
  { key: 'channel_id',   label: '配信コード' },
  { key: 'email',        label: 'メールアドレス' },
  { key: 'q1_units',     label: 'Q1 保有戸数' },
  { key: 'q2_type',      label: 'Q2 物件種別(複数)' },
  { key: 'q2_type_free', label: 'Q2 その他(自由記述)' },
  { key: 'q3_method',    label: 'Q3 申告方法' },
  { key: 'q4_companies',  label: 'Q4 購入した会社数' },
  { key: 'q5_worry',      label: 'Q5 不安なこと(複数)' },
  { key: 'q5_worry_free', label: 'Q5 その他(自由記述)' },
  { key: 'q6_helped',     label: 'Q6 担当が助かったこと(複数)' },
  { key: 'q7_income',     label: 'Q7 年収の連携粒度' },
  { key: 'q8_loan',       label: 'Q8 借入残高の連携粒度' },
  { key: 'q9_interview',  label: 'Q9 取材協力' },
  { key: 'user_agent',   label: 'ブラウザ情報' }
];

function headerLabels_(cols) {
  return cols.map(function (c) { return c.label; });
}

/** 同時投稿で行が壊れないようロックを取る */
function doPost(e) {
  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(20000);
  } catch (err) {
    return jsonOut({ ok: false, error: 'busy' });
  }

  try {
    if (!e || !e.postData || !e.postData.contents) {
      return jsonOut({ ok: false, error: 'empty_body' });
    }

    var data = JSON.parse(e.postData.contents);

    // トークン照合（無関係な第三者からの書き込みを弾く）
    var expected = PropertiesService.getScriptProperties().getProperty('POST_TOKEN');
    if (!expected || data._token !== expected) {
      return jsonOut({ ok: false, error: 'unauthorized' });
    }

    var sheet = getSheet_(SHEET_SURVEY, COLUMNS);
    var jst = Utilities.formatDate(new Date(), 'Asia/Tokyo', 'yyyy-MM-dd HH:mm:ss');

    var row = COLUMNS.map(function (col) {
      if (col.key === 'received_at') return jst;
      var v = data[col.key];
      if (v === undefined || v === null) return '';
      // 万一配列で届いても崩れないようにする
      return Array.isArray(v) ? v.join(', ') : String(v);
    });

    sheet.appendRow(row);
    return jsonOut({ ok: true });
  } catch (err) {
    // 失敗しても回答者側は完了画面へ進むため、ここで記録を残す
    console.error(err);
    return jsonOut({ ok: false, error: String(err) });
  } finally {
    lock.releaseLock();
  }
}

/** 動作確認用。ブラウザで /exec を開くと現在の回答数が見える */
function doGet() {
  var survey = getSheet_(SHEET_SURVEY, COLUMNS);
  return jsonOut({
    ok: true,
    responses: Math.max(survey.getLastRow() - 1, 0)
  });
}

/** シートが無ければ作り、ヘッダー行を用意する */
function getSheet_(name, cols) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(name);
  if (!sheet) sheet = ss.insertSheet(name);
  var labels = headerLabels_(cols);

  if (sheet.getLastRow() === 0) {
    setHeader_(sheet, labels);
  } else {
    var width = Math.max(sheet.getLastColumn(), labels.length);
    var currentHeader = sheet.getRange(1, 1, 1, width).getValues()[0];
    if (String(currentHeader[0]).trim() !== labels[0]) {
      setHeader_(sheet, labels);
    }
  }
  return sheet;
}

/** 見出し行を書き込み、太字＋固定にする */
function setHeader_(sheet, labels) {
  sheet.getRange(1, 1, 1, labels.length).setValues([labels]);
  sheet.getRange(1, 1, 1, labels.length).setFontWeight('bold');
  sheet.setFrozenRows(1);
}

function jsonOut(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
