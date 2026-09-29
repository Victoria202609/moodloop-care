const state = {
  emotion: "",
  tone: "",
  intensity: 6,
  minutes: 1,
};

const emotionOptions = [...document.querySelectorAll(".emotion-option")];
const timeOptions = [...document.querySelectorAll(".time-options button")];
const intensityInput = document.querySelector("#intensity");
const intensityValue = document.querySelector("#intensity-value");
const journal = document.querySelector("#journal");
const charCount = document.querySelector("#char-count");
const formMessage = document.querySelector("#form-message");
const analyzeButton = document.querySelector("#analyze-button");
const resultSection = document.querySelector("#result");
const heroSection = document.querySelector(".hero");
const checkinCard = document.querySelector(".checkin-card");
const footprintsSection = document.querySelector("#footprints");
const toolkitSection = document.querySelector("#toolkit");
const practiceModal = document.querySelector("#practice-modal");
const actionStage = document.querySelector("#action-stage");
const practiceStage = document.querySelector("#practice-stage");
const groundingStage = document.querySelector("#grounding-stage");
const movementStage = document.querySelector("#movement-stage");
const soundStage = document.querySelector("#sound-stage");
const afterStage = document.querySelector("#after-stage");
const completeStage = document.querySelector("#complete-stage");
const afterIntensity = document.querySelector("#after-intensity");
const afterValue = document.querySelector("#after-value");
let activeAnalysis = null;
let breathingTimer = null;
let actionTimer = null;
let audioContext = null;
let soundGain = null;
let soundNodes = [];
let currentIntervention = "";
let currentPage = "checkin";
let returnPage = "checkin";
let completionMode = "record";
let movementIndex = 0;
let clearConfirmTimer = null;

const riskWords = ["不想活", "想死", "自杀", "自残", "伤害自己", "结束生命", "活不下去"];
const toolMeta = {
  breathing: { label: "节律呼吸", short: "试试一分钟呼吸" },
  grounding: { label: "感官着陆", short: "试试感官着陆" },
  movement: { label: "身体松动", short: "试试身体松动" },
  sound: { label: "舒缓声景", short: "听一会舒缓声景" },
};
const movementSteps = [
  { visual: "↟", title: "耸肩，再慢慢放下", copy: "吸气时耸起肩膀，呼气时彻底放松，重复三次。" },
  { visual: "↔", title: "轻轻转动肩膀", copy: "向后缓慢绕肩五次，再换一个方向，不追求幅度。" },
  { visual: "⌁", title: "伸展手臂与背部", copy: "双手向前延伸，背部轻轻展开，保持三个自然呼吸。" },
];
const demoRecords = [
  { emotion: "焦虑", intensityBefore: 8, intensityAfter: 5, note: "临时收到汇报任务，担心准备不充分", trigger: "时间与任务压力", createdAt: new Date(Date.now() - 86400000 * 6).toISOString() },
  { emotion: "疲惫", intensityBefore: 7, intensityAfter: 6, note: "连续加班后很难集中注意力", trigger: "身体与能量", createdAt: new Date(Date.now() - 86400000 * 4).toISOString() },
  { emotion: "低落", intensityBefore: 6, intensityAfter: 4, note: "发出的消息很久没有收到回复", trigger: "社交关系", createdAt: new Date(Date.now() - 86400000 * 2).toISOString() },
  { emotion: "焦虑", intensityBefore: 7, intensityAfter: 4, note: "明天要汇报，担心被否定", trigger: "自我评价", createdAt: new Date(Date.now() - 86400000).toISOString() },
];

const patterns = [
  {
    label: "时间与任务压力",
    words: ["来不及", "截止", "明天", "马上", "准备", "汇报", "拖延"],
    need: "确定感与掌控感",
    action: {
      1: ["写下唯一的下一步", "只写下现在最需要完成的一件事，先不考虑其余部分。"],
      3: ["拆出三个关键点", "列出任务最重要的三个部分，先从最小的一项开始。"],
      5: ["完成一个粗糙开头", "用五分钟做出第一版，不修改格式，也暂时不追求完美。"],
    },
  },
  {
    label: "工作压力",
    words: ["领导", "加班", "同事", "客户", "工作", "项目", "绩效"],
    need: "认可、边界与胜任感",
    action: {
      1: ["圈出可控制的一件事", "把注意力放回你现在能够影响的一个小动作。"],
      3: ["写下沟通重点", "用一句事实和一句需要，整理你真正想表达的内容。"],
      5: ["建立最小工作清单", "只保留今天必须完成的一项，其余先放进稍后清单。"],
    },
  },
  {
    label: "学业压力",
    words: ["考试", "作业", "成绩", "论文", "学习", "复习", "答辩"],
    need: "进度感与能力确认",
    action: {
      1: ["打开最小知识点", "只选择一个概念，写下你已经知道的两件事。"],
      3: ["做一道最容易的题", "先用一个确定的小胜利，帮大脑重新启动。"],
      5: ["开始五分钟专注", "关掉一个干扰源，只处理眼前这一小段内容。"],
    },
  },
  {
    label: "社交关系",
    words: ["朋友", "社交", "消息", "回复", "聚会", "冷落", "孤独"],
    need: "连接、理解与归属感",
    action: {
      1: ["说出真实感受", "在心里补完：我感到___，因为我在意___。"],
      3: ["写一条不发送的信息", "把想说的话写出来，先不急着发送或解释。"],
      5: ["联系一个安全的人", "给一位让你安心的人发一句简单的近况问候。"],
    },
  },
  {
    label: "亲密关系",
    words: ["对象", "恋爱", "分手", "争吵", "喜欢", "伴侣", "男朋友", "女朋友"],
    need: "安全感、回应与被珍惜",
    action: {
      1: ["暂停立即回应", "先做三次慢呼吸，暂时不在情绪最高点作决定。"],
      3: ["分开事实与猜测", "各写一句：我确定发生了什么？我正在担心什么？"],
      5: ["整理一个温和请求", "用“我感到…我希望…”写下一个具体、可回应的请求。"],
    },
  },
  {
    label: "身体与能量",
    words: ["失眠", "睡不着", "疲惫", "累", "头痛", "没精神", "生病"],
    need: "休息、恢复与被照顾",
    action: {
      1: ["允许身体暂停", "放松肩膀和下颌，慢慢呼气三次，不要求自己立刻恢复。"],
      3: ["做一次身体扫描", "从额头到脚底，观察最紧绷的部位并轻轻放松。"],
      5: ["完成一次无屏休息", "离开屏幕、喝一点水，让眼睛和大脑真正停五分钟。"],
    },
  },
  {
    label: "自我评价",
    words: ["失败", "否定", "做不好", "没用", "不够好", "丢脸", "完美"],
    need: "自我接纳与能力确认",
    action: {
      1: ["换一种说法", "把“我不行”换成“这件事现在对我很难”。"],
      3: ["找回一个证据", "写下一次你曾经应对过类似困难的经历。"],
      5: ["给朋友般的回应", "如果朋友遇到同样的事，你会对他说什么？把它写给自己。"],
    },
  },
];

const emotionCopy = {
  开心: "这份轻盈值得被好好收藏。你愿意停下来感受它，本身就是一种温柔的觉察。",
  平静: "此刻的稳定很珍贵。你不需要做更多，可以只是看见这份安定从哪里来。",
  焦虑: "你似乎正在努力应对一些不确定。焦虑不是你的敌人，它可能在提醒你：这件事对你很重要。",
  低落: "今天也许比平时更沉一些。你不需要马上振作，先允许自己被理解和照顾。",
  愤怒: "这份愤怒可能在保护某个重要的边界。先给它一点空间，再决定怎样回应。",
  疲惫: "你已经消耗了不少能量。休息不是退后，而是在把自己重新接回来。",
};

function updateRange() {
  const value = Number(intensityInput.value);
  state.intensity = value;
  intensityValue.value = value;
  const percent = ((value - 1) / 9) * 100;
  intensityInput.style.background = `linear-gradient(90deg, var(--primary) 0 ${percent}%, #deddea ${percent}% 100%)`;
}

emotionOptions.forEach((button) => {
  button.addEventListener("click", () => {
    emotionOptions.forEach((option) => option.setAttribute("aria-pressed", "false"));
    button.setAttribute("aria-pressed", "true");
    state.emotion = button.dataset.emotion;
    state.tone = button.dataset.tone;
    document.body.dataset.tone = state.tone;
    formMessage.textContent = "";
  });
});

timeOptions.forEach((button) => {
  button.addEventListener("click", () => {
    timeOptions.forEach((option) => option.setAttribute("aria-pressed", "false"));
    button.setAttribute("aria-pressed", "true");
    state.minutes = Number(button.dataset.minutes);
  });
});

intensityInput.addEventListener("input", updateRange);
journal.addEventListener("input", () => {
  charCount.textContent = journal.value.length;
  if (journal.value.trim()) formMessage.textContent = "";
});

document.querySelector("#example-button").addEventListener("click", () => {
  const sample = "明天要做工作汇报，但方案还没准备好，我很担心做不好，也害怕被领导否定。";
  journal.value = sample;
  charCount.textContent = sample.length;
  const anxious = emotionOptions.find((option) => option.dataset.emotion === "焦虑");
  anxious.click();
  intensityInput.value = 8;
  updateRange();
  journal.focus();
});

function findPattern(text) {
  let best = null;
  let bestScore = 0;

  patterns.forEach((pattern) => {
    const score = pattern.words.reduce((total, word) => total + (text.includes(word) ? 1 : 0), 0);
    if (score > bestScore) {
      best = pattern;
      bestScore = score;
    }
  });

  return best || {
    label: "尚未明确的压力",
    need: "被理解与更多清晰感",
    action: {
      1: ["为感受命名", "试着补完这句话：我现在最明显的感受是___。"],
      3: ["写下事实与感受", "分别写下一件已经发生的事实，以及它带给你的感受。"],
      5: ["画一个小小控制圈", "写下不能控制和能够控制的事，只从后者选一个行动。"],
    },
  };
}

function summarizeEvent(text) {
  const cleaned = text.replace(/\s+/g, " ").trim();
  return cleaned.length > 34 ? `${cleaned.slice(0, 34)}…` : cleaned;
}

function renderAnalysis() {
  const text = journal.value.trim();
  if (!state.emotion && !text) {
    formMessage.textContent = "先选择一种感受，并写下一点刚刚发生的事。";
    emotionOptions[0].focus();
    return;
  }
  if (!state.emotion) {
    formMessage.textContent = "请选择一个最接近的感受。";
    emotionOptions[0].focus();
    return;
  }
  if (text.length < 4) {
    formMessage.textContent = "再多写几个字，我们才能更贴近你的处境。";
    journal.focus();
    return;
  }

  if (riskWords.some((word) => text.includes(word))) {
    openSafetySupport();
    return;
  }

  const pattern = findPattern(text);
  const action = pattern.action[state.minutes];
  const recommendedTool = state.intensity >= 8
    ? "breathing"
    : ({ 焦虑: "breathing", 愤怒: "grounding", 疲惫: "movement", 低落: "sound", 平静: "grounding", 开心: "sound" }[state.emotion] || "breathing");
  activeAnalysis = {
    id: `mood-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    emotion: state.emotion,
    intensityBefore: state.intensity,
    note: text,
    trigger: pattern.label,
    need: pattern.need,
    actionTitle: action[0],
    minutes: state.minutes,
    recommendedTool,
    feedback: null,
    saved: false,
  };
  document.querySelector("#result-badge").textContent = `${state.emotion} · ${state.intensity}/10`;
  document.querySelector("#compassion-text").textContent = emotionCopy[state.emotion];
  document.querySelector("#event-text").textContent = summarizeEvent(text);
  document.querySelector("#trigger-text").textContent = pattern.label;
  document.querySelector("#need-text").textContent = pattern.need;
  document.querySelector("#action-time").textContent = `${state.minutes} 分钟`;
  document.querySelector("#action-title").textContent = action[0];
  document.querySelector("#action-description").textContent = action[1];
  document.querySelector("#recommended-tool-label").textContent = toolMeta[recommendedTool].short;
  document.querySelector("#start-practice").disabled = false;
  document.querySelector("#start-practice").textContent = "现在开始";
  document.querySelectorAll("[data-feedback]").forEach((button) => {
    button.classList.remove("selected");
    button.setAttribute("aria-pressed", "false");
  });

  showPage("result");
}

analyzeButton.addEventListener("click", renderAnalysis);
document.querySelector("#back-to-checkin").addEventListener("click", () => {
  showPage("checkin");
});

function showPage(page) {
  if ((page === "footprints" || page === "toolkit") && page !== currentPage) returnPage = currentPage;
  const isCheckin = page === "checkin";
  heroSection.hidden = !isCheckin;
  checkinCard.hidden = !isCheckin;
  resultSection.hidden = page !== "result";
  footprintsSection.hidden = page !== "footprints";
  toolkitSection.hidden = page !== "toolkit";
  currentPage = page;
  if (page === "footprints") renderFootprints();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function getRecords() {
  try {
    const records = JSON.parse(localStorage.getItem("moodloop_records") || "[]");
    return Array.isArray(records) ? records : [];
  } catch {
    return [];
  }
}

function escapeHtml(value) {
  return String(value).replace(/[&<>'"]/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" })[character]);
}

function renderFootprints() {
  const saved = getRecords();
  const usingDemo = saved.length === 0 && localStorage.getItem("moodloop_demo_dismissed") !== "true";
  const records = usingDemo ? demoRecords : saved;
  document.querySelector("#demo-data-note").hidden = !usingDemo;
  document.querySelector("#clear-records").hidden = saved.length === 0;
  document.querySelector("#stat-count").textContent = records.length;
  const relief = records.length ? records.reduce((sum, record) => sum + (record.intensityBefore - record.intensityAfter), 0) / records.length : 0;
  const reliefText = relief > 0 ? `+${relief.toFixed(1).replace(".0", "")}` : relief.toFixed(1).replace(".0", "");
  document.querySelector("#stat-relief").textContent = reliefText;

  const triggerCounts = records.reduce((counts, record) => {
    counts[record.trigger] = (counts[record.trigger] || 0) + 1;
    return counts;
  }, {});
  const sortedTriggers = Object.entries(triggerCounts).sort((a, b) => b[1] - a[1]);
  document.querySelector("#stat-trigger").textContent = sortedTriggers[0]?.[0] || "继续记录中";

  const dayNames = ["日", "一", "二", "三", "四", "五", "六"];
  const days = Array.from({ length: 7 }, (_, index) => {
    const date = new Date();
    date.setHours(0, 0, 0, 0);
    date.setDate(date.getDate() - (6 - index));
    const sameDay = records.filter((record) => new Date(record.createdAt).toDateString() === date.toDateString());
    const value = sameDay.length ? Math.round(sameDay.reduce((sum, record) => sum + record.intensityAfter, 0) / sameDay.length) : 0;
    return { label: `周${dayNames[date.getDay()]}`, value };
  });
  document.querySelector("#mood-chart").innerHTML = days.map((day) => `
    <div class="chart-day"><b>${day.value || "·"}</b><i class="chart-bar" style="height:${day.value ? Math.max(10, day.value * 12) : 6}px;opacity:${day.value ? 1 : .18}"></i><small>${day.label}</small></div>
  `).join("");

  const maxTrigger = sortedTriggers[0]?.[1] || 1;
  document.querySelector("#trigger-list").innerHTML = sortedTriggers.length ? sortedTriggers.slice(0, 4).map(([label, count]) => `
    <div class="trigger-item"><span>${label}</span><b>${count} 次</b><div class="trigger-track"><i style="width:${(count / maxTrigger) * 100}%"></i></div></div>
  `).join("") : '<p class="empty-copy">完成一次情绪照顾后，这里会出现你的触发规律。</p>';

  const emotionMarks = { 开心: "晴", 平静: "静", 焦虑: "虑", 低落: "雨", 愤怒: "火", 疲惫: "倦" };
  document.querySelector("#recent-list").innerHTML = records.length ? records.slice(0, 4).map((record) => {
    const date = new Date(record.createdAt);
    const change = record.intensityBefore - record.intensityAfter;
    const changeText = change > 0 ? `缓解 ${change} 分` : change < 0 ? `上升 ${Math.abs(change)} 分` : "没有变化";
    const method = record.skipped ? "跳过练习" : (record.intervention || record.actionTitle || "完成记录");
    return `<div class="recent-item"><div class="recent-emotion">${emotionMarks[record.emotion] || "记"}</div><div class="recent-copy"><strong>${escapeHtml(record.note)}</strong><small>${date.getMonth() + 1}月${date.getDate()}日 · ${record.trigger} · ${escapeHtml(method)}</small></div><span class="relief-chip">${changeText}</span></div>`;
  }).join("") : '<div class="empty-records"><b>还没有真实记录</b><span>从一次 30 秒情绪记录开始，慢慢积累属于你的规律。</span></div>';
}

document.querySelector("#footprints-nav").addEventListener("click", () => showPage("footprints"));
document.querySelector("#toolkit-nav").addEventListener("click", () => showPage("toolkit"));
document.querySelector("#back-from-footprints").addEventListener("click", () => showPage(returnPage === "footprints" ? "checkin" : returnPage));
document.querySelector("#back-from-toolkit").addEventListener("click", () => showPage(returnPage === "toolkit" ? "checkin" : returnPage));
document.querySelector(".brand").addEventListener("click", (event) => {
  event.preventDefault();
  showPage("checkin");
});
document.querySelector("#clear-records").addEventListener("click", () => {
  const button = document.querySelector("#clear-records");
  if (button.dataset.confirming !== "true") {
    button.dataset.confirming = "true";
    button.textContent = "再次点击确认清除";
    clearTimeout(clearConfirmTimer);
    clearConfirmTimer = window.setTimeout(() => {
      button.dataset.confirming = "false";
      button.textContent = "清除我的数据";
    }, 3500);
    return;
  }
  localStorage.removeItem("moodloop_records");
  localStorage.setItem("moodloop_demo_dismissed", "true");
  button.dataset.confirming = "false";
  button.textContent = "清除我的数据";
  renderFootprints();
  showToast("本地记录已清除，不会重新填充示例");
});

function showToast(message) {
  const toast = document.querySelector("#toast");
  toast.textContent = message;
  toast.classList.add("show");
  window.setTimeout(() => toast.classList.remove("show"), 2200);
}

function openSafetySupport() {
  document.querySelector("#safety-modal").hidden = false;
  document.body.classList.add("modal-open");
  document.querySelector("#copy-support-message").focus();
}

function closeSafetySupport() {
  document.querySelector("#safety-modal").hidden = true;
  document.body.classList.remove("modal-open");
  journal.focus();
}

document.querySelector("#close-safety").addEventListener("click", closeSafetySupport);
document.querySelector("#copy-support-message").addEventListener("click", async () => {
  const message = "我现在状态很不好，需要有人陪我一下。你可以尽快联系我吗？";
  try {
    await navigator.clipboard.writeText(message);
    showToast("求助消息已复制，请发送给可信任的人");
  } catch {
    window.prompt("请复制这条消息并发送给可信任的人：", message);
  }
});

const modalStages = [actionStage, practiceStage, groundingStage, movementStage, soundStage, afterStage, completeStage];

function formatTime(seconds) {
  return `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;
}

function showModalStage(stage) {
  modalStages.forEach((item) => { item.hidden = item !== stage; });
}

function stopSound() {
  soundNodes.forEach((node) => {
    try { node.stop(); } catch {}
    try { node.disconnect(); } catch {}
  });
  soundNodes = [];
  if (audioContext) {
    audioContext.close().catch(() => {});
    audioContext = null;
  }
  soundGain = null;
  document.querySelector("#sound-orb").classList.remove("playing");
  document.querySelector("#sound-status").textContent = "点击播放";
  document.querySelector("#toggle-sound").textContent = "播放舒缓声景";
}

function resetPractice() {
  if (breathingTimer) window.clearInterval(breathingTimer);
  if (actionTimer) window.clearInterval(actionTimer);
  breathingTimer = null;
  actionTimer = null;
  stopSound();
  showModalStage(actionStage);
  document.querySelector("#begin-breathing").disabled = false;
  document.querySelector("#begin-breathing").textContent = "开始呼吸练习";
  document.querySelector("#breathing-phase").textContent = "准备";
  document.querySelector("#breathing-count").textContent = "3";
  document.querySelector("#breathing-orb").className = "breathing-orb";
  document.querySelector("#practice-progress").style.width = "0";
  document.querySelector("#cycle-text").textContent = "准备开始";
  document.querySelector("#timer-text").textContent = "01:00";
  document.querySelector("#begin-action").disabled = false;
  document.querySelector("#begin-action").textContent = "开始行动计时";
  document.querySelector("#action-progress").style.width = "0";
  document.querySelectorAll(".grounding-list button").forEach((button) => button.classList.remove("done"));
  document.querySelector("#finish-grounding").disabled = true;
  document.querySelector("#finish-grounding").textContent = "完成全部观察";
  movementIndex = 0;
  renderMovementStep();
  document.querySelector("#save-checkin").disabled = false;
}

function openPractice() {
  if (!activeAnalysis || activeAnalysis.saved) {
    showToast("本次记录已经保存，可以开始一次新的记录");
    return;
  }
  resetPractice();
  completionMode = "record";
  currentIntervention = "1% 行动";
  document.querySelector("#modal-action-title").textContent = activeAnalysis.actionTitle;
  document.querySelector("#modal-action-description").textContent = document.querySelector("#action-description").textContent;
  document.querySelector("#action-timer-text").textContent = formatTime(activeAnalysis.minutes * 60);
  document.querySelector("#action-timer-status").textContent = `为自己留出 ${activeAnalysis.minutes} 分钟，不必做到完美`;
  showModalStage(actionStage);
  practiceModal.hidden = false;
  document.body.classList.add("modal-open");
  document.querySelector("#begin-action").focus();
}

function openTool(tool, standalone = currentPage === "toolkit") {
  if (!standalone && activeAnalysis?.saved) {
    showToast("本次记录已经保存，可以开始一次新的记录");
    return;
  }
  resetPractice();
  completionMode = standalone ? "standalone" : "record";
  currentIntervention = toolMeta[tool].label;
  const stageMap = { breathing: practiceStage, grounding: groundingStage, movement: movementStage, sound: soundStage };
  showModalStage(stageMap[tool]);
  practiceModal.hidden = false;
  document.body.classList.add("modal-open");
}

function closePractice() {
  if (breathingTimer) window.clearInterval(breathingTimer);
  if (actionTimer) window.clearInterval(actionTimer);
  breathingTimer = null;
  actionTimer = null;
  stopSound();
  practiceModal.hidden = true;
  document.body.classList.remove("modal-open");
}

function finishIntervention(skipped = false) {
  if (breathingTimer) window.clearInterval(breathingTimer);
  if (actionTimer) window.clearInterval(actionTimer);
  breathingTimer = null;
  actionTimer = null;
  stopSound();
  if (completionMode === "standalone") {
    document.querySelector("#change-title").textContent = skipped ? "练习已结束" : "你为自己留出了一点空间";
    document.querySelector("#change-copy").textContent = skipped
      ? "你可以随时回来，选择另一种更适合当下的方式。"
      : `你刚刚完成了“${currentIntervention}”。哪怕只有一点点停顿，也是一种照顾。`;
    document.querySelector("#view-footprints").hidden = true;
    document.querySelector("#new-checkin").textContent = "回到工具箱";
    showModalStage(completeStage);
    return;
  }
  if (!activeAnalysis) return;
  activeAnalysis.intervention = currentIntervention;
  activeAnalysis.skipped = skipped;
  showAfterStage();
}

function showAfterStage() {
  showModalStage(afterStage);
  const baseline = activeAnalysis?.intensityBefore ?? state.intensity;
  afterIntensity.value = baseline;
  afterValue.value = baseline;
  const percent = ((baseline - 1) / 9) * 100;
  afterIntensity.style.background = `linear-gradient(90deg, var(--primary) 0 ${percent}%, #deddea ${percent}% 100%)`;
}

function beginAction() {
  const button = document.querySelector("#begin-action");
  const timerText = document.querySelector("#action-timer-text");
  const status = document.querySelector("#action-timer-status");
  const progress = document.querySelector("#action-progress");
  const total = activeAnalysis.minutes * 60;
  let remaining = total;
  button.disabled = true;
  button.textContent = "行动进行中";
  status.textContent = "只专注眼前这一小步";
  actionTimer = window.setInterval(() => {
    remaining -= 1;
    timerText.textContent = formatTime(Math.max(0, remaining));
    progress.style.width = `${((total - remaining) / total) * 100}%`;
    if (remaining <= 0) finishIntervention(false);
  }, 1000);
}

function beginBreathing() {
  const button = document.querySelector("#begin-breathing");
  const orb = document.querySelector("#breathing-orb");
  const phaseText = document.querySelector("#breathing-phase");
  const countText = document.querySelector("#breathing-count");
  const cycleText = document.querySelector("#cycle-text");
  const timerText = document.querySelector("#timer-text");
  const progress = document.querySelector("#practice-progress");
  let elapsed = 0;
  const total = 60;
  button.disabled = true;
  button.textContent = "练习进行中";
  const update = () => {
    const position = elapsed % 12;
    let phase = "吸气";
    let cssClass = "inhale";
    let remaining = 4 - position;
    if (position >= 4 && position < 6) {
      phase = "停留";
      cssClass = "hold";
      remaining = 6 - position;
    } else if (position >= 6) {
      phase = "呼气";
      cssClass = "exhale";
      remaining = 12 - position;
    }
    orb.className = `breathing-orb ${cssClass}`;
    phaseText.textContent = phase;
    countText.textContent = Math.max(1, remaining);
    cycleText.textContent = `第 ${Math.min(5, Math.floor(elapsed / 12) + 1)} / 5 轮`;
    timerText.textContent = `00:${String(Math.max(0, total - elapsed)).padStart(2, "0")}`;
    progress.style.width = `${(elapsed / total) * 100}%`;
    if (elapsed >= total) finishIntervention(false);
    elapsed += 1;
  };
  update();
  breathingTimer = window.setInterval(update, 1000);
}

function renderMovementStep() {
  const step = movementSteps[movementIndex];
  document.querySelector("#movement-step").textContent = `${movementIndex + 1} / ${movementSteps.length}`;
  document.querySelector("#movement-visual").textContent = step.visual;
  document.querySelector("#movement-title").textContent = step.title;
  document.querySelector("#movement-copy").textContent = step.copy;
  document.querySelector("#next-movement").textContent = movementIndex === movementSteps.length - 1 ? "完成身体松动" : "完成，下一步";
}

async function toggleSound() {
  if (audioContext) {
    stopSound();
    return;
  }
  const AudioEngine = window.AudioContext || window.webkitAudioContext;
  if (!AudioEngine) {
    showToast("当前浏览器暂不支持本地声景");
    return;
  }
  try {
    audioContext = new AudioEngine();
    await audioContext.resume();

    soundGain = audioContext.createGain();
    const volume = Number(document.querySelector("#sound-volume").value) / 100;
    soundGain.gain.value = volume * 0.18;
    soundGain.connect(audioContext.destination);

    const buffer = audioContext.createBuffer(1, audioContext.sampleRate * 3, audioContext.sampleRate);
    const data = buffer.getChannelData(0);
    for (let index = 0; index < data.length; index += 1) data[index] = Math.random() * 2 - 1;
    const noise = audioContext.createBufferSource();
    const filter = audioContext.createBiquadFilter();
    const noiseLevel = audioContext.createGain();
    noise.buffer = buffer;
    noise.loop = true;
    filter.type = "lowpass";
    filter.frequency.setValueAtTime(680, audioContext.currentTime);
    noiseLevel.gain.value = 0.45;
    noise.connect(filter).connect(noiseLevel).connect(soundGain);

    const lowTone = audioContext.createOscillator();
    const lowToneGain = audioContext.createGain();
    lowTone.type = "sine";
    lowTone.frequency.setValueAtTime(174.6, audioContext.currentTime);
    lowToneGain.gain.value = 0.035;
    lowTone.connect(lowToneGain).connect(soundGain);

    const highTone = audioContext.createOscillator();
    const highToneGain = audioContext.createGain();
    highTone.type = "sine";
    highTone.frequency.setValueAtTime(261.6, audioContext.currentTime);
    highToneGain.gain.value = 0.018;
    highTone.connect(highToneGain).connect(soundGain);

    noise.start();
    lowTone.start();
    highTone.start();
    soundNodes = [noise, lowTone, highTone];
    await audioContext.resume();
    if (audioContext.state !== "running") throw new Error("audio context suspended");

    document.querySelector("#sound-orb").classList.add("playing");
    document.querySelector("#sound-status").textContent = "正在播放 · 可调音量";
    document.querySelector("#toggle-sound").textContent = "暂停声景";
  } catch {
    stopSound();
    showToast("浏览器阻止了声音，请再次点击播放并确认设备未静音");
  }
}

function saveCheckin() {
  if (!activeAnalysis || activeAnalysis.saved) {
    showToast("这次记录已经保存过了");
    return;
  }
  const saveButton = document.querySelector("#save-checkin");
  saveButton.disabled = true;
  const after = Number(afterIntensity.value);
  const record = { ...activeAnalysis, intensityAfter: after, createdAt: new Date().toISOString(), saved: true };
  try {
    const existing = getRecords().filter((item) => item.id !== record.id);
    localStorage.setItem("moodloop_records", JSON.stringify([record, ...existing].slice(0, 30)));
    localStorage.setItem("moodloop_demo_dismissed", "true");
  } catch {
    saveButton.disabled = false;
    showToast("保存失败，请检查浏览器存储权限");
    return;
  }
  activeAnalysis.saved = true;
  document.querySelector("#start-practice").disabled = true;
  document.querySelector("#start-practice").textContent = "本次已完成";
  const change = activeAnalysis.intensityBefore - after;
  document.querySelector("#change-title").textContent = change > 0
    ? `你为自己争取到了 ${change} 分空间`
    : change < 0 ? "谢谢你如实记录变化" : "谢谢你认真看见此刻";
  document.querySelector("#change-copy").textContent = change > 0
    ? `从 ${activeAnalysis.intensityBefore} 分到 ${after} 分。改变不必很大，这一点点松动也值得被记住。`
    : change < 0
      ? `情绪从 ${activeAnalysis.intensityBefore} 分升到 ${after} 分。先不要独自硬撑，可以换一种方式或联系可信任的人。`
      : `情绪仍是 ${after} 分。没有变化也不是失败，这条真实记录会帮助你找到更适合的方法。`;
  document.querySelector("#view-footprints").hidden = false;
  document.querySelector("#new-checkin").textContent = "再记录一次";
  completionMode = "record";
  showModalStage(completeStage);
  showToast("这次情绪照顾已保存在当前设备");
}

function resetCheckinForm() {
  activeAnalysis = null;
  state.emotion = "";
  state.tone = "";
  state.intensity = 6;
  state.minutes = 1;
  document.body.removeAttribute("data-tone");
  emotionOptions.forEach((option) => option.setAttribute("aria-pressed", "false"));
  timeOptions.forEach((option, index) => option.setAttribute("aria-pressed", index === 0 ? "true" : "false"));
  intensityInput.value = 6;
  journal.value = "";
  charCount.textContent = "0";
  formMessage.textContent = "";
  updateRange();
}

document.querySelector("#start-practice").addEventListener("click", openPractice);
document.querySelector("#recommended-tool").addEventListener("click", () => {
  if (activeAnalysis) openTool(activeAnalysis.recommendedTool, false);
});
document.querySelectorAll("[data-tool]").forEach((button) => button.addEventListener("click", () => openTool(button.dataset.tool, true)));
document.querySelector("#begin-action").addEventListener("click", beginAction);
document.querySelector("#finish-action").addEventListener("click", () => finishIntervention(false));
document.querySelector("#begin-breathing").addEventListener("click", beginBreathing);
document.querySelector("#skip-practice").addEventListener("click", () => finishIntervention(true));
document.querySelectorAll("[data-skip-tool]").forEach((button) => button.addEventListener("click", () => finishIntervention(true)));
document.querySelectorAll(".grounding-list button").forEach((button) => button.addEventListener("click", () => {
  button.classList.toggle("done");
  button.querySelector("i").textContent = button.classList.contains("done") ? "已完成 ✓" : "完成";
  const done = document.querySelectorAll(".grounding-list button.done").length;
  const finish = document.querySelector("#finish-grounding");
  finish.disabled = done < 5;
  finish.textContent = done < 5 ? `还差 ${5 - done} 项` : "完成全部观察";
}));
document.querySelector("#finish-grounding").addEventListener("click", () => finishIntervention(false));
document.querySelector("#next-movement").addEventListener("click", () => {
  if (movementIndex < movementSteps.length - 1) {
    movementIndex += 1;
    renderMovementStep();
  } else finishIntervention(false);
});
document.querySelector("#toggle-sound").addEventListener("click", toggleSound);
document.querySelector("#finish-sound").addEventListener("click", () => finishIntervention(false));
document.querySelector("#sound-volume").addEventListener("input", (event) => {
  if (soundGain && audioContext) {
    soundGain.gain.setTargetAtTime((Number(event.target.value) / 100) * 0.18, audioContext.currentTime, 0.03);
  }
});
document.querySelector("#save-checkin").addEventListener("click", saveCheckin);
document.querySelector("#view-footprints").addEventListener("click", () => {
  closePractice();
  showPage("footprints");
});
document.querySelector("#new-checkin").addEventListener("click", () => {
  closePractice();
  if (completionMode === "standalone") showPage("toolkit");
  else {
    resetCheckinForm();
    showPage("checkin");
  }
});
document.querySelectorAll("[data-close-modal]").forEach((button) => button.addEventListener("click", closePractice));
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && !practiceModal.hidden) closePractice();
});
afterIntensity.addEventListener("input", () => {
  const value = Number(afterIntensity.value);
  afterValue.value = value;
  const percent = ((value - 1) / 9) * 100;
  afterIntensity.style.background = `linear-gradient(90deg, var(--primary) 0 ${percent}%, #deddea ${percent}% 100%)`;
});

document.querySelectorAll("[data-feedback]").forEach((button) => {
  button.setAttribute("aria-pressed", "false");
  button.addEventListener("click", () => {
    document.querySelectorAll("[data-feedback]").forEach((item) => {
      item.classList.remove("selected");
      item.setAttribute("aria-pressed", "false");
    });
    button.classList.add("selected");
    button.setAttribute("aria-pressed", "true");
    if (activeAnalysis) {
      activeAnalysis.feedback = button.dataset.feedback;
      if (activeAnalysis.saved) {
        const records = getRecords();
        const saved = records.find((record) => record.id === activeAnalysis.id);
        if (saved) {
          saved.feedback = activeAnalysis.feedback;
          localStorage.setItem("moodloop_records", JSON.stringify(records));
        }
      }
    }
    showToast("已记录你的反馈");
  });
});

updateRange();
