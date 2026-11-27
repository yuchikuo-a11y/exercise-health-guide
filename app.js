(function(){
  "use strict";

  /* ---------- helpers ---------- */
  function $(id){ return document.getElementById(id); }
  function num(id){ return parseFloat($(id).value); }
  function fmt(x, d){ return (Math.round(x * Math.pow(10, d)) / Math.pow(10, d)).toString(); }

  /* ---------- slider plumbing ---------- */
  function paint(el){
    var min = parseFloat(el.min), max = parseFloat(el.max);
    el.style.setProperty("--p", ((parseFloat(el.value)-min)/(max-min)*100) + "%");
  }
  function bindSliders(ids, update){
    ids.forEach(function(id){
      var el = $(id), out = $(id + "-v");
      if(!el) return;
      paint(el);
      el.addEventListener("input", function(){
        paint(el);
        if(out) out.textContent = el.value;
        update();
      });
    });
    update();
  }

  /* ---------- page 1: BMI ---------- */
  function updBmi(){
    var h = num("b-h")/100, w = num("b-w");
    var bmi = w/(h*h);
    var asia, who;
    if(bmi < 18.5) asia = "過輕";
    else if(bmi < 24) asia = "正常";
    else if(bmi < 27) asia = "過重";
    else asia = "肥胖";
    if(bmi < 18.5) who = "過輕";
    else if(bmi < 25) who = "正常";
    else if(bmi < 30) who = "過重";
    else if(bmi < 35) who = "肥胖第一級";
    else if(bmi < 40) who = "肥胖第二級";
    else who = "肥胖第三級";
    $("b-mark").style.left = Math.max(0, Math.min(100, (bmi-15)/25*100)) + "%";
    $("b-out").className = "result" + ((bmi < 18.5 || bmi >= 24) ? " warn" : "");
    $("b-out").innerHTML =
      "BMI <strong>" + fmt(bmi,1) + "</strong> 公斤/平方公尺<br>" +
      "亞洲參考值：<strong>" + asia + "</strong>（切點為 24 與 27）<br>" +
      "國際參考值：" + who + "（切點為 25 與 30）<br>" +
      "<span style='font-size:13px'>BMI 看不出脂肪堆積的位置，請搭配第 2 頁的腰臀比一起判讀。</span>";
  }

  /* ---------- page 2: waist-hip ratio ---------- */
  function updWhr(){
    var waist = num("b-waist"), hip = num("b-hip"), sex = $("b-sex").value;
    var cutW = sex === "m" ? 90 : 80;
    var cutR = sex === "m" ? 0.9 : 0.85;
    var whr = waist/hip;
    var overW = waist > cutW, overR = whr > cutR;
    $("whr-out").className = "result" + ((overW || overR) ? " warn" : "");
    $("whr-out").innerHTML =
      "腰臀比 <strong>" + fmt(whr,2) + "</strong>（參考值 " + cutR + "，" + (overR ? "已超過" : "未超過") + "）<br>" +
      "腰圍 <strong>" + fmt(waist,0) + "</strong> cm（參考值 " + cutW + " cm，" + (overW ? "已超過" : "未超過") + "）<br>" +
      "<span style='font-size:13px'>" +
      (overW || overR
        ? "腹部脂肪較多與高血壓、糖尿病、心血管疾病的風險上升有關，建議進一步評估。"
        : "目前未超過講義所列的參考值。") +
      "</span>";
  }

  /* ---------- page switcher ---------- */
  var bpTabs = $("bp-tabs");
  bpTabs.addEventListener("click", function(ev){
    var btn = ev.target.closest("button[data-page]");
    if(!btn) return;
    var n = btn.getAttribute("data-page");
    Array.prototype.forEach.call(bpTabs.children, function(b){
      b.className = b === btn ? "on" : "";
    });
    $("bp-0").hidden = n !== "0";
    $("bp-1").hidden = n !== "1";
  });

  /* ---------- target heart rate ---------- */
  function updHr(){
    var age = num("hr-age"), rest = num("hr-rest"), pct = num("hr-pct");
    var max = 220 - age;
    if(rest >= max){
      $("hr-out").className = "result warn";
      $("hr-out").innerHTML = "靜息心率已高於或等於推估的最大心率（" + max +
        " 次/分），無法用心率儲備法計算。請確認數值，或改用自覺用力程度判定強度。";
      return;
    }
    var target = Math.round((max - rest) * pct/100 + rest);
    var zone;
    if(pct < 20) zone = "非常輕鬆";
    else if(pct < 40) zone = "輕鬆";
    else if(pct < 60) zone = "中等";
    else if(pct < 85) zone = "吃力";
    else zone = "非常吃力";
    var lo = Math.round((max - rest) * Math.max(0, pct-5)/100 + rest);
    var hi = Math.round((max - rest) * Math.min(100, pct+5)/100 + rest);
    $("hr-out").className = "result" + (pct >= 85 ? " warn" : "");
    $("hr-out").innerHTML =
      "推估最大心率 <strong>" + max + "</strong> 次/分<br>" +
      "目標心率 <strong>" + target + "</strong> 次/分（±5% 約 " + lo + " － " + hi + "）<br>" +
      "強度分級：<strong>" + zone + "</strong>" +
      (pct >= 85 ? "<br><span style='font-size:13px'>此強度屬高強度區間，初學者、高齡者與有慢性病者不建議直接採用。</span>" : "");
  }

  bindSliders(["b-h","b-w"], updBmi);
  bindSliders(["b-waist","b-hip"], updWhr);
  $("b-sex").addEventListener("change", updWhr);
  bindSliders(["hr-age","hr-rest","hr-pct"], updHr);

  /* ---------- energy & fat days ---------- */
  $("e-btn").addEventListener("click", function(){
    var w = num("e-w"), met = num("e-met"), min = num("e-min");
    if(!(w>0 && met>0 && min>0)){ $("e-out").textContent = "請輸入有效的數值。"; return; }
    var perMin = met * 3.5 * w / 200;
    var perSession = perMin * min;
    var days = 7700 / perSession;
    $("e-out").innerHTML = "每分鐘約 <strong>" + fmt(perMin,2) + "</strong> kcal<br>" +
      "本次運動約 <strong>" + fmt(perSession,0) + "</strong> kcal<br>" +
      "若只靠這項運動每天重複，約 <strong>" + fmt(days,1) + "</strong> 天消耗 1 公斤脂肪（粗估）";
  });

  /* ---------- weekly volume ---------- */
  $("w-btn").addEventListener("click", function(){
    var m = num("w-min"), d = num("w-days");
    if(!(m>0 && d>0)){ $("w-out").textContent = "請輸入有效的數值。"; return; }
    var total = m*d;
    var pct150 = Math.min(100, total/150*100);
    var pct250 = Math.min(100, total/250*100);
    var msg;
    if(total >= 300) msg = "已超過健康建議量，並接近或達到減重建議的高量範圍。";
    else if(total >= 250) msg = "達到減重建議的下限區間（約 200～300 分鐘）。";
    else if(total >= 150) msg = "達到健康促進的建議量（每週 150 分鐘）。";
    else msg = "尚未達到每週 150 分鐘的健康建議；可先從每次 10 分鐘累積開始。";
    $("w-out").innerHTML = "每週合計 <strong>" + total + "</strong> 分鐘<br>" +
      "健康目標（150 分）進度<div class='bar'><i style='width:" + pct150 + "%'></i></div>" +
      "減重目標（250 分）進度<div class='bar'><i style='width:" + pct250 + "%'></i></div>" + msg;
  });

  /* ---------- TUG ---------- */
  $("t-btn").addEventListener("click", function(){
    var s = num("t-s");
    if(!(s>0)){ $("t-out").textContent = "請輸入有效秒數。"; return; }
    var txt, warn=false;
    if(s > 30){ txt="超過 30 秒：活動能力嚴重受限，不宜獨自外出，建議有人協助或使用輔具。"; warn=true; }
    else if(s > 12){ txt="超過 12 秒：跌倒風險較高，建議安排平衡與下肢力量訓練並定期追蹤。"; warn=true; }
    else { txt="12 秒以內：目前未達高風險切點，仍建議持續維持下肢力量與平衡。"; }
    $("t-out").className = "result" + (warn ? " warn" : "");
    $("t-out").innerHTML = "<strong>" + fmt(s,1) + " 秒</strong><br>" + txt;
  });

  /* ---------- glucose ---------- */
  $("g-btn").addEventListener("click", function(){
    var f = num("g-f"), o = num("g-2"), a = num("g-a");
    var lines = [], warn = false;
    if(!isNaN(f)){
      if(f >= 126){ lines.push("空腹血糖 " + f + "：達糖尿病診斷標準（需再次確認）。"); warn=true; }
      else if(f >= 110){ lines.push("空腹血糖 " + f + "：空腹血糖異常（IFG）。"); warn=true; }
      else lines.push("空腹血糖 " + f + "：在講義所列正常範圍內。");
    }
    if(!isNaN(o)){
      if(o >= 200){ lines.push("OGTT 2 小時 " + o + "：達糖尿病診斷標準（需再次確認）。"); warn=true; }
      else if(o >= 140){ lines.push("OGTT 2 小時 " + o + "：口服葡萄糖耐受異常（IGT）。"); warn=true; }
      else lines.push("OGTT 2 小時 " + o + "：未達異常標準。");
    }
    if(!isNaN(a)){
      if(a >= 6.5){ lines.push("糖化血色素 " + a + "%：高於講義所列正常值（<6%），建議就醫評估。"); warn=true; }
      else if(a >= 6){ lines.push("糖化血色素 " + a + "%：接近或高於講義正常值（<6%）。"); warn=true; }
      else lines.push("糖化血色素 " + a + "%：在講義所列正常值（<6%）內。");
    }
    if(!lines.length){ $("g-out").textContent = "請至少輸入一項數值。"; return; }
    $("g-out").className = "result" + (warn ? " warn" : "");
    $("g-out").innerHTML = lines.join("<br>");
  });

  /* ---------- hypoglycemia advice ---------- */
  var HG = {
    low: [
      [100, "每小時進食含約 10～15 克糖分的食物。", false],
      [Infinity, "不需額外補充。", false]
    ],
    mid: [
      [100, "運動前先進食約 25～50 克糖分，之後每小時補充約 10～15 克。", false],
      [180, "每小時補充約 10～15 克糖分。", false],
      [250, "通常不需進食，但請留意運動中的變化。", false],
      [Infinity, "血糖偏高，建議待控制後再運動。", true]
    ],
    high: [
      [100, "先進食約 50 克糖分，再開始運動。", false],
      [180, "先進食約 25～50 克糖分。", false],
      [250, "每小時補充約 10～15 克糖分。", false],
      [Infinity, "血糖偏高，建議待控制後再運動。", true]
    ]
  };
  $("hg-btn").addEventListener("click", function(){
    var lvl = $("hg-int").value, bg = num("hg-bg");
    if(isNaN(bg)){ $("hg-out").textContent = "請輸入血糖值。"; return; }
    var rule = HG[lvl].filter(function(r){ return bg < r[0]; })[0];
    $("hg-out").className = "result" + (rule[2] ? " warn" : "");
    $("hg-out").innerHTML = "運動前血糖 <strong>" + bg + "</strong> mg/dL：" + rule[1] +
      "<br><span style='font-size:13px'>此為講義整理的參考原則，胰島素劑量調整須由醫師決定。</span>";
  });

  /* ---------- records ---------- */
  var STORE = "ehg.records.v1";
  var QUIZ_NAME = {ch1:"第一章", ch2:"第二章", ch3:"第三章", ch4:"第四章", smart:"特別單元"};

  // 每一種記錄：輸出區塊、需要先按的計算鈕、數值、單位、輸入摘要
  var REC = {
    "BMI": {el:"b-out", unit:"", dec:1,
      val:function(){ var h=num("b-h")/100; return num("b-w")/(h*h); },
      inp:function(){ return "身高 "+num("b-h")+" cm／體重 "+num("b-w")+" kg"; }},
    "腰臀比": {el:"whr-out", unit:"", dec:2,
      val:function(){ return num("b-waist")/num("b-hip"); },
      inp:function(){ return "腰圍 "+num("b-waist")+" cm／臀圍 "+num("b-hip")+" cm／"+($("b-sex").value==="m"?"男性":"女性"); }},
    "目標心率": {el:"hr-out", unit:" 次/分", dec:0,
      val:function(){ var max=220-num("hr-age"), rest=num("hr-rest");
        return rest>=max ? NaN : (max-rest)*num("hr-pct")/100 + rest; },
      inp:function(){ return "年齡 "+num("hr-age")+" 歲／靜息 "+num("hr-rest")+" 次/分／強度 "+num("hr-pct")+"%"; }},
    "運動消耗": {el:"e-out", btn:"e-btn", unit:" kcal", dec:0,
      val:function(){ return num("e-met")*3.5*num("e-w")/200*num("e-min"); },
      inp:function(){ return "體重 "+num("e-w")+" kg／"+num("e-met")+" MET／"+num("e-min")+" 分鐘"; }},
    "每週運動量": {el:"w-out", btn:"w-btn", unit:" 分鐘", dec:0,
      val:function(){ return num("w-min")*num("w-days"); },
      inp:function(){ return "每次 "+num("w-min")+" 分鐘 × 每週 "+num("w-days")+" 次"; }},
    "TUG": {el:"t-out", btn:"t-btn", unit:" 秒", dec:1,
      val:function(){ return num("t-s"); },
      inp:function(){ return "坐站起走測試"; }},
    "血糖": {el:"g-out", btn:"g-btn", unit:" mg/dL", dec:0,
      val:function(){ return num("g-f"); },
      inp:function(){ return "空腹 "+$("g-f").value+"／OGTT 2hr "+$("g-2").value+"／HbA1c "+$("g-a").value+"%"; }},
    "運動前血糖": {el:"hg-out", btn:"hg-btn", unit:" mg/dL", dec:0,
      val:function(){ return num("hg-bg"); },
      inp:function(){ return "強度："+$("hg-int").selectedOptions[0].textContent.split("（")[0]; }}
  };

  function load(){
    try{
      var raw = localStorage.getItem(STORE);
      var a = raw ? JSON.parse(raw) : [];
      return Array.isArray(a) ? a : [];
    }catch(e){ return []; }
  }
  function save(list){
    try{ localStorage.setItem(STORE, JSON.stringify(list)); return true; }
    catch(e){ return false; }
  }
  function msg(text, bad){
    var el = $("log-msg");
    el.className = "fb " + (bad ? "bad" : "ok");
    el.textContent = text;
  }
  function addRecord(type, value, unit, summary, detail){
    var list = load();
    list.push({
      id: Date.now() + "-" + Math.random().toString(36).slice(2,7),
      t: new Date().toISOString(),
      type: type,
      value: (typeof value === "number" && isFinite(value)) ? value : null,
      unit: unit || "",
      summary: summary,
      detail: detail || "",
      note: ($("log-note") ? $("log-note").value.trim() : "")
    });
    var ok = save(list);
    renderLog();
    return ok;
  }
  function when(iso){
    var d = new Date(iso);
    if(isNaN(d)) return iso;
    var p = function(n){ return (n<10?"0":"") + n; };
    return d.getFullYear() + "/" + p(d.getMonth()+1) + "/" + p(d.getDate()) + " " + p(d.getHours()) + ":" + p(d.getMinutes());
  }
  function esc(s){
    return String(s).replace(/[&<>"]/g, function(c){
      return c === "&" ? "&amp;" : c === "<" ? "&lt;" : c === ">" ? "&gt;" : "&quot;";
    });
  }

  // 「存入記錄」按鈕
  document.addEventListener("click", function(ev){
    var btn = ev.target.closest("button.save[data-rec]");
    if(!btn) return;
    var key = btn.getAttribute("data-rec");
    var cfg = REC[key];
    if(!cfg) return;
    if(cfg.btn) $(cfg.btn).click();          // 先算一次，確保數值是最新的
    var v = cfg.val();
    var out = $(cfg.el);
    var text = (out.textContent || "").replace(/\s+/g, " ").trim();
    if(!isFinite(v) || !text){
      msg("「" + key + "」目前沒有可記錄的有效數值，請先確認輸入。", true);
      btn.textContent = "數值無效";
      setTimeout(function(){ btn.textContent = "存入記錄"; }, 1600);
      return;
    }
    var summary = key + " " + fmt(v, cfg.dec) + cfg.unit;
    var ok = addRecord(key, v, cfg.unit, summary, cfg.inp() + "｜" + text.slice(0, 180));
    btn.classList.add("done");
    btn.textContent = ok ? "已存入" : "無法儲存";
    setTimeout(function(){ btn.classList.remove("done"); btn.textContent = "存入記錄"; }, 1600);
    if(ok) msg("已存入「" + summary + "」。", false);
    else msg("瀏覽器不允許儲存（可能是無痕模式或儲存空間已滿）。", true);
    if($("log-note")) $("log-note").value = "";
  });

  function renderLog(){
    var list = load();
    var filter = $("log-filter").value;

    // 篩選選單
    var types = [];
    list.forEach(function(r){ if(types.indexOf(r.type) < 0) types.push(r.type); });
    var sel = $("log-filter");
    var keep = sel.value;
    sel.innerHTML = '<option value="">全部（' + list.length + ' 筆）</option>' +
      types.map(function(t){
        var n = list.filter(function(r){ return r.type === t; }).length;
        return '<option value="' + esc(t) + '">' + esc(t) + '（' + n + '）</option>';
      }).join("");
    sel.value = types.indexOf(keep) >= 0 ? keep : "";
    filter = sel.value;

    var shown = list.filter(function(r){ return !filter || r.type === filter; })
                    .sort(function(a,b){ return a.t < b.t ? 1 : -1; });

    if(!shown.length){
      $("log-body").innerHTML = '<p class="rec-empty">還沒有記錄。在上面任何一個計算器按「存入記錄」就會出現在這裡。</p>';
    } else {
      var rows = shown.map(function(r){
        return "<tr><td class='when'>" + esc(when(r.t)) + "</td><td>" + esc(r.type) + "</td>" +
          "<td><strong>" + esc(r.summary.replace(r.type, "").trim()) + "</strong></td>" +
          "<td style='font-size:13px;color:#5b6575'>" + esc(r.note ? "【" + r.note + "】" : "") + esc(r.detail) + "</td>" +
          "<td><button type='button' class='rec-del' data-del='" + esc(r.id) + "'>刪除</button></td></tr>";
      }).join("");
      $("log-body").innerHTML = "<table><tr><th>時間</th><th>項目</th><th>數值</th><th>內容</th><th></th></tr>" + rows + "</table>";
    }
    drawSpark(list);
  }

  // 刪除單筆
  document.addEventListener("click", function(ev){
    var b = ev.target.closest("button[data-del]");
    if(!b) return;
    var id = b.getAttribute("data-del");
    save(load().filter(function(r){ return r.id !== id; }));
    renderLog();
    msg("已刪除一筆記錄。", false);
  });

  function drawSpark(list){
    var pts = list.filter(function(r){ return r.type === "BMI" && r.value != null; })
                  .sort(function(a,b){ return a.t < b.t ? -1 : 1; });
    var svg = $("spark"), cap = $("spark-cap");
    if(pts.length < 2){
      svg.innerHTML = '<text x="300" y="38" text-anchor="middle" font-size="13" fill="#8e98a6">' +
        '存入至少 2 筆 BMI 記錄後，這裡會顯示變化趨勢</text>';
      cap.textContent = "";
      return;
    }
    var vals = pts.map(function(p){ return p.value; });
    var lo = Math.min.apply(null, vals), hi = Math.max.apply(null, vals);
    if(hi - lo < 1){ var mid = (hi+lo)/2; lo = mid - 0.5; hi = mid + 0.5; }
    var W = 600, H = 70, pad = 8;
    var xy = pts.map(function(p, i){
      var x = pts.length === 1 ? W/2 : pad + i * (W - pad*2) / (pts.length - 1);
      var y = H - pad - (p.value - lo) / (hi - lo) * (H - pad*2);
      return [x, y];
    });
    var d = xy.map(function(c, i){ return (i ? "L" : "M") + fmt(c[0],1) + " " + fmt(c[1],1); }).join("");
    var dots = xy.map(function(c){ return '<circle cx="' + fmt(c[0],1) + '" cy="' + fmt(c[1],1) + '" r="3" fill="#0f766e"/>'; }).join("");
    svg.innerHTML = '<path d="' + d + '" fill="none" stroke="#0f766e" stroke-width="2" vector-effect="non-scaling-stroke"/>' + dots;
    var first = vals[0], last = vals[vals.length-1], diff = last - first;
    cap.textContent = "共 " + pts.length + " 筆，從 " + fmt(first,1) + " 到 " + fmt(last,1) +
      "（" + (diff > 0 ? "增加 " : diff < 0 ? "減少 " : "持平 ") + fmt(Math.abs(diff),1) + "），" +
      "範圍 " + fmt(lo,1) + " － " + fmt(hi,1) + "。";
  }

  function toCsv(){
    var list = load().sort(function(a,b){ return a.t < b.t ? -1 : 1; });
    var head = ["時間","項目","數值","單位","摘要","附註","內容"];
    var q = function(s){ return '"' + String(s == null ? "" : s).replace(/"/g, '""') + '"'; };
    return [head.map(q).join(",")].concat(list.map(function(r){
      return [when(r.t), r.type, (r.value == null ? "" : r.value), r.unit.trim(), r.summary, r.note, r.detail].map(q).join(",");
    })).join(String.fromCharCode(13, 10));
  }

  $("log-csv").addEventListener("click", function(){
    var list = load();
    if(!list.length){ msg("目前沒有記錄可以匯出。", true); return; }
    var csv = toCsv();
    var started = false;
    try{
      var blob = new Blob([String.fromCharCode(0xFEFF) + csv], {type:"text/csv;charset=utf-8"});
      var url = URL.createObjectURL(blob);
      var a = document.createElement("a");
      a.href = url;
      a.download = "運動健康記錄.csv";
      document.body.appendChild(a);
      a.click();
      started = true;
      setTimeout(function(){ URL.revokeObjectURL(url); a.remove(); }, 2000);
    }catch(e){ started = false; }
    $("log-text").hidden = false;
    $("log-text").value = csv;
    msg(started
      ? "已開始下載「運動健康記錄.csv」。若瀏覽器沒有反應，可直接從下方欄位複製內容。"
      : "這個環境不允許下載，請從下方欄位複製 CSV 內容。", !started);
  });

  $("log-copy").addEventListener("click", function(){
    var list = load();
    if(!list.length){ msg("目前沒有記錄可以複製。", true); return; }
    var csv = toCsv();
    $("log-text").hidden = false;
    $("log-text").value = csv;
    if(navigator.clipboard && navigator.clipboard.writeText){
      navigator.clipboard.writeText(csv).then(function(){
        msg("已複製 " + list.length + " 筆記錄（CSV 格式），可直接貼到 Excel。", false);
      }).catch(function(){
        $("log-text").select();
        msg("無法自動複製，內容已顯示在下方並選取，請按 Ctrl+C。", true);
      });
    } else {
      $("log-text").select();
      msg("內容已顯示在下方並選取，請按 Ctrl+C 複製。", true);
    }
  });

  $("log-clear").addEventListener("click", function(){
    var n = load().length;
    if(!n){ msg("目前沒有記錄。", true); return; }
    var btn = this;
    if(btn.getAttribute("data-armed") !== "1"){
      btn.setAttribute("data-armed", "1");
      btn.textContent = "再按一次確認刪除 " + n + " 筆";
      msg("這個動作無法復原。建議先匯出 CSV 備份。", true);
      setTimeout(function(){
        btn.removeAttribute("data-armed");
        btn.textContent = "清除全部記錄";
      }, 5000);
      return;
    }
    btn.removeAttribute("data-armed");
    btn.textContent = "清除全部記錄";
    save([]);
    $("log-text").hidden = true;
    renderLog();
    msg("已清除全部 " + n + " 筆記錄。", false);
  });

  $("log-filter").addEventListener("change", renderLog);

  $("url-copy").addEventListener("click", function(){
    var url = $("site-url").textContent.trim();
    var self = this;
    if(navigator.clipboard && navigator.clipboard.writeText){
      navigator.clipboard.writeText(url).then(function(){
        self.textContent = "已複製";
        setTimeout(function(){ self.textContent = "複製網址"; }, 1600);
      }).catch(function(){ self.textContent = "請手動複製"; });
    }
  });

  renderLog();

  /* ---------- plan tabs ---------- */
  var PLANS = {
    "成人": {
      rows: [
        ["有氧", "每週 3～5 天（中等）或 3 天（劇烈）", "中等 40～59% VO₂R；劇烈 60～89%", "中等每次 30 分鐘以上，每週至少 150 分鐘；或劇烈每次 20 分鐘以上，每週至少 75 分鐘", "走路、慢跑、騎車、游泳等大肌群節奏性運動"],
        ["阻力", "每週 2～3 天", "中至劇烈，約 60～80% 1RM；8～12 次", "每次 1～3 組，動作涵蓋 4～5 個主要肌群", "多關節、大肌群為主"],
        ["柔軟", "每週 2～3 天以上（最好每天）", "拉伸到有緊繃感但不痛", "每個動作 10～30 秒，重複 2～4 次", "靜態伸展或 PNF"]
      ]
    },
    "高齡者": {
      rows: [
        ["有氧", "每週 3～5 天", "約 40% VO₂R 起，自覺 12～13 級", "約 20～60 分鐘，可分次累積", "步行、水中、固定式腳踏車"],
        ["阻力", "每週 2～3 天", "自覺 12～13 級", "每回 10～15 次，1 組起", "8～10 個動作，涵蓋主要肌群"],
        ["柔軟", "每週多日", "拉伸到緊繃，不到痛", "每次 15～30 秒，重複 2～4 次", "靜態伸展，各主要關節"],
        ["神經肌肉", "每週 2～3 天", "逐步縮小支撐、加入動態與閉眼", "依能力漸進", "平衡、敏捷、本體感覺訓練，例如太極"]
      ]
    },
    "第二型糖尿病": {
      rows: [
        ["有氧", "每週 7 天（連續不運動不超過 2 天）", "中等 40～59% VO₂R（11～12 級）；劇烈 60～89% VO₂R（14～17 級）；體能很差者可從 30～59% 開始", "中等每週至少 150 分鐘；劇烈每週至少 60 分鐘", "走路、慢跑、騎車、划船、游泳、水中運動、團體運動"],
        ["阻力", "每週 2～3 天", "60～80% 1RM（較低強度起步），自覺 11～15 級", "每個動作 8～12 次，每個動作 1～3 組", "自由重量或器械；上肢與下肢／核心各 4～5 個動作"],
        ["安全提醒", "—", "—", "—", "運動前後監測血糖；規律運動有助於改善血糖控制，須依醫師指示調整用藥"]
      ]
    },
    "高血壓": {
      rows: [
        ["有氧", "每週 5～7 天（或每週 3～7 次）", "約 40～70% VO₂max（中低強度）", "每次 30 分鐘，可分段累積（每段至少 10 分鐘）", "全身性、節奏性、輕鬆的運動；避免憋氣"],
        ["阻力", "每週 2～3 天", "中至劇烈；2～4 組，每組 8～12 次", "—", "器械或自由重量；注意屏氣"],
        ["柔軟", "每週 2～3 天以上", "拉伸到緊繃", "每個動作 10～30 秒", "靜態伸展或關節活動"]
      ]
    },
    "高血脂": {
      rows: [
        ["有氧", "每週至少 5 天", "中等，約 60～80% VO₂max", "每次 30～60 分鐘，可累積", "以消耗較多熱量為目標，搭配減重效果更好"],
        ["阻力", "每週 2～3 天", "中至劇烈；2～4 組，每組 8～12 次", "—", "大肌群為主"],
        ["柔軟", "每週 2～3 天以上", "拉伸到緊繃", "每個動作 10～30 秒", "靜態伸展"]
      ]
    },
    "過重與肥胖": {
      rows: [
        ["有氧", "每週至少 5 天", "中至劇烈", "起始每次 30 分鐘，逐步增至 60 分鐘；每週總量約 150 分鐘起，減重目標約 250～300 分鐘", "走路、騎車、游泳，可加入間歇"],
        ["阻力", "每週 2～3 天", "中至劇烈；2～4 組，每組 8～12 次", "—", "全身大肌群，有助於保留肌肉"],
        ["目標", "—", "—", "體重至少減少 3%～10%", "搭配飲食與生活型態調整"]
      ]
    }
  };
  var tabWrap = $("plan-tabs"), body = $("plan-body");
  Object.keys(PLANS).forEach(function(name, i){
    var b = document.createElement("button");
    b.textContent = name;
    b.setAttribute("data-k", name);
    if(i===0) b.className = "on";
    b.addEventListener("click", function(){ showPlan(name); });
    tabWrap.appendChild(b);
  });
  function showPlan(name){
    Array.prototype.forEach.call(tabWrap.children, function(c){
      c.className = c.getAttribute("data-k") === name ? "on" : "";
    });
    var rows = PLANS[name].rows;
    var html = "<table><tr><th>類型</th><th>頻率</th><th>強度</th><th>時間</th><th>型態</th></tr>";
    rows.forEach(function(r){
      html += "<tr>" + r.map(function(c){ return "<td>" + c + "</td>"; }).join("") + "</tr>";
    });
    html += "</table>";
    body.innerHTML = html;
  }
  showPlan("成人");

  /* ---------- quizzes ---------- */
  var QUIZ = {
    ch1: [
      {q:"依講義的成人建議，每週至少需要累積多少分鐘中等到劇烈強度的活動？", o:["75 分鐘","150 分鐘","300 分鐘","60 分鐘"], a:1, e:"成人建議每週至少 150 分鐘，每次累積至少 10 分鐘。"},
      {q:"講義以什麼單位判定活動是否達到中等以上強度（MVPA）？", o:["心跳數","代謝當量（MET）","步數","卡路里總量"], a:1, e:"MVPA 的基本定義是任何形式的活動達到 3 MET 以上。"},
      {q:"阻力型與柔軟度運動建議每週至少進行幾次？", o:["1 次","2 次","4 次","7 次"], a:1, e:"阻力與柔軟度運動每週至少 2 次。"},
      {q:"PAR-Q 問卷在運動計畫中主要扮演什麼角色？", o:["測量最大攝氧量","篩選不適合運動的成人或協助規劃","決定運動服裝","計算熱量"], a:1, e:"PAR-Q 用於篩選需要醫學評估或特別規劃的人，被視為最低標準。"}
    ],
    ch2: [
      {q:"TUG（坐站起走）測試的跌倒風險切點，講義所列為幾秒？", o:["8 秒","10 秒","12 秒","20 秒"], a:2, e:"超過 12 秒跌倒風險較高；超過 30 秒活動能力嚴重受限。"},
      {q:"下列哪一項運動最不適合做為高齡者的有氧運動？", o:["步行","水中運動","固定式腳踏車","高衝擊跳躍"], a:3, e:"高齡者應避免高衝擊運動，以免增加骨骼壓力。"},
      {q:"為了防跌而做平衡與神經肌肉訓練，建議每週幾天？", o:["每週 2～3 天","每週 6 天","每月 1 次","不需要"], a:0, e:"神經肌肉訓練建議每週 2～3 天，並逐步增加難度。"},
      {q:"「功能性伸展」測試主要是評估什麼？", o:["心肺耐力","手臂前伸的距離（與平衡、防跌相關）","握力","體脂率"], a:1, e:"講義以前伸距離對應跌倒風險，前伸越短風險越高。"}
    ],
    ch3: [
      {q:"依講義，符合幾項危險因子即可判定為代謝症候群？", o:["1 項以上","2 項以上","3 項以上","5 項全部"], a:2, e:"五項中符合 3 項以上即判定為代謝症候群。"},
      {q:"空腹血糖達到多少 mg/dL 以上，符合糖尿病的診斷標準？", o:["100","110","126","200"], a:2, e:"空腹血糖 ≥ 126 mg/dL；110～126 屬於空腹血糖異常。"},
      {q:"高血壓患者運動時，血壓的一般反應通常是？", o:["收縮壓下降、舒張壓大幅上升","收縮壓逐漸上升，舒張壓變化不大或略升","兩者都明顯下降","完全沒有變化"], a:1, e:"運動時收縮壓通常會逐漸增加，舒張壓變化較小。"},
      {q:"高強度運動前血糖低於 100 mg/dL 時，講義建議先補充多少克糖分？", o:["約 5 克","約 10 克","約 50 克","不需補充"], a:2, e:"高強度且運動前血糖低於 100 時，建議先進食約 50 克糖分。"},
      {q:"講義提到，有氧運動在運動後多久，三酸甘油脂的降低會開始顯現？", o:["立刻","約 24～48 小時後","延遲數小時出現，並可維持約 24～48 小時","不會下降"], a:2, e:"三酸甘油脂的降低通常在運動後延遲數小時出現，並可維持約 24～48 小時。"}
    ],
    ch4: [
      {q:"BMI 的計算方式是？", o:["體重 ÷ 身高","體重（kg）÷ 身高（m）的平方","身高 ÷ 體重的平方","腰圍 ÷ 臀圍"], a:1, e:"BMI ＝ 體重（kg）÷ 身高（m）²。"},
      {q:"依講義，男性腰圍超過多少 cm 代表腹部肥胖風險增加？", o:["80","85","90","100"], a:2, e:"男性腰圍超過 90 cm，女性超過 80 cm。"},
      {q:"講義中，減少約 1 公斤脂肪大約相當於多少 kcal？", o:["1,000","3,500","7,700","10,000"], a:2, e:"講義以 1 公斤脂肪約 7,700 kcal 作為估算基準。"},
      {q:"為了減重，ACSM 建議的每週有氧運動量約為多少分鐘（與健康促進的 150 分鐘相比）？", o:["50～100","200～300","400～500","不需要有氧"], a:1, e:"減重目標通常建議約 200～300 分鐘。"},
      {q:"依講義的營養建議，蛋白質一般成人每日約為多少 g/kg 體重？", o:["0.2～0.5","0.5～0.8","1.2～2.0","3.0～4.0"], a:2, e:"一般運動者的蛋白質建議約 1.2～2.0 g/kg。"}
    ],
    smart: [
      {q:"在智慧化健康管理流程中，最先做的步驟通常是？", o:["精準運動處方","客戶分類與風險篩選","回饋與成效評估","購買設備"], a:1, e:"流程先依風險分類，再進行評估、處方與回饋。"},
      {q:"Pro-ACB 架構中的「Biofeedback」指的是？", o:["趣味實境化","生理回饋","運動劑量準確性","個人最優化"], a:1, e:"Biofeedback 即具有生理回饋，是 ACB 策略的一部分。"}
    ]
  };

  Object.keys(QUIZ).forEach(function(key){
    var box = document.querySelector('[data-quiz="'+key+'"]');
    if(!box) return;
    var holder = box.querySelector(".qs");
    QUIZ[key].forEach(function(item, idx){
      var wrap = document.createElement("div");
      var opts = item.o.map(function(text, j){
        return '<label><input type="radio" name="'+key+idx+'" value="'+j+'"> '+text+'</label>';
      }).join("");
      wrap.innerHTML = '<div class="q">'+(idx+1)+'. '+item.q+'</div><div class="opts">'+opts+'</div><div class="fb"></div>';
      holder.appendChild(wrap);
    });
    box.querySelector('[data-action="check"]').addEventListener("click", function(){
      var correct = 0, answered = 0;
      QUIZ[key].forEach(function(item, idx){
        var wrap = holder.children[idx];
        var sel = wrap.querySelector("input:checked");
        var fb = wrap.querySelector(".fb");
        if(!sel){ fb.className="fb"; fb.textContent="尚未作答"; return; }
        answered++;
        if(parseInt(sel.value,10) === item.a){ correct++; fb.className="fb ok"; fb.textContent="答對了。"+item.e; }
        else { fb.className="fb bad"; fb.textContent="答錯了。"+item.e; }
      });
      var total = QUIZ[key].length;
      var line = "得分：" + correct + " / " + total;
      if(answered === total){
        var name = "測驗 " + (QUIZ_NAME[key] || key);
        addRecord(name, correct, " 分", name + " " + correct + " / " + total + " 分",
          "答對 " + correct + " 題，共 " + total + " 題");
        line += "（已存入記錄）";
      } else {
        line += "（" + (total - answered) + " 題未作答，全部作答後才會存入記錄）";
      }
      box.querySelector(".score").textContent = line;
    });
  });

  /* ---------- highlight active section in nav ---------- */
  var links = document.querySelectorAll("nav.tabs a");
  var secs = Array.prototype.map.call(links, function(a){ return document.querySelector(a.getAttribute("href")); });
  if("IntersectionObserver" in window){
    var io = new IntersectionObserver(function(entries){
      entries.forEach(function(en){
        if(en.isIntersecting){
          links.forEach(function(a){
            a.style.background = a.getAttribute("href") === "#"+en.target.id ? "var(--chip)" : "#fff";
          });
        }
      });
    }, {rootMargin:"-40% 0px -55% 0px"});
    secs.forEach(function(s){ if(s) io.observe(s); });
  }

  /* ---------- offline support (ignored where not allowed) ---------- */
  if("serviceWorker" in navigator && location.protocol === "https:"){
    window.addEventListener("load", function(){
      navigator.serviceWorker.register("./sw.js").catch(function(){});
    });
  }

  /* ---------- show the real address when hosted elsewhere ---------- */
  if(location.protocol.indexOf("http") === 0 && $("site-url")){
    var here = location.origin + location.pathname.replace(/index[.]html$/, "");
    if(here.indexOf("yuchikuo-a11y.github.io") < 0) $("site-url").textContent = here;
  }
})();
