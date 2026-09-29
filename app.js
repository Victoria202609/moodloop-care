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
const practiceModal = document.querySelector("#practice-modal");
const practiceStage = document.querySelector("#practice-stage");
const afterStage = document.querySelector("#after-stage");
const completeStage = document.querySelector("#complete-stage");
const afterIntensity = document.querySelector("#after-intensity");
const afterValue = document.querySelector("#after-value");
let activeAnalysis = null;
let breathingTimer = null;

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

  const pattern = findPattern(text);
  const action = pattern.action[state.minutes];
  activeAnalysis = {
    emotion: state.emotion,
    intensityBefore: state.intensity,
    note: text,
    trigger: pattern.label,
    need: pattern.need,
    actionTitle: action[0],
    minutes: state.minutes,
  };
  document.querySelector("#result-badge").textContent = `${state.emotion} · ${state.intensity}/10`;
  document.querySelector("#compassion-text").textContent = emotionCopy[state.emotion];
  document.querySelector("#event-text").textContent = summarizeEvent(text);
  document.querySelector("#trigger-text").textContent = pattern.label;
  document.querySelector("#need-text").textContent = pattern.need;
  document.querySelector("#action-time").textContent = `${state.minutes} 分钟`;
  document.querySelector("#action-title").textContent = action[0];
  document.querySelector("#action-description").textContent = action[1];

  resultSection.hidden = false;
  requestAnimationFrame(() => resultSection.scrollIntoView({ behavior: "smooth", block: "start" }));
}

analyzeButton.addEventListener("click", renderAnalysis);

function showToast(message) {
  const toast = document.querySelector("#toast");
  toast.textContent = message;
  toast.classList.add("show");
  window.setTimeout(() => toast.classList.remove("show"), 2200);
}

function resetPractice() {
  if (breathingTimer) window.clearInterval(breathingTimer);
  breathingTimer = null;
  practiceStage.hidden = false;
  afterStage.hidden = true;
  completeStage.hidden = true;
  document.querySelector("#begin-breathing").disabled = false;
  document.querySelector("#begin-breathing").textContent = "开始呼吸练习";
  document.querySelector("#breathing-phase").textContent = "准备";
  document.querySelector("#breathing-count").textContent = "3";
  document.querySelector("#breathing-orb").className = "breathing-orb";
  document.querySelector("#practice-progress").style.width = "0";
  document.querySelector("#cycle-text").textContent = "准备开始";
  document.querySelector("#timer-text").textContent = "01:00";
}

function openPractice() {
  if (!activeAnalysis) return;
  resetPractice();
  practiceModal.hidden = false;
  document.body.classList.add("modal-open");
  document.querySelector("#begin-breathing").focus();
}

function closePractice() {
  if (breathingTimer) window.clearInterval(breathingTimer);
  breathingTimer = null;
  practiceModal.hidden = true;
  document.body.classList.remove("modal-open");
  document.querySelector("#start-practice").focus();
}

function showAfterStage() {
  if (breathingTimer) window.clearInterval(breathingTimer);
  breathingTimer = null;
  practiceStage.hidden = true;
  afterStage.hidden = false;
  completeStage.hidden = true;
  const suggested = Math.max(1, state.intensity - 1);
  afterIntensity.value = suggested;
  afterValue.value = suggested;
  afterIntensity.style.background = `linear-gradient(90deg, var(--primary) 0 ${((suggested - 1) / 9) * 100}%, #deddea ${((suggested - 1) / 9) * 100}% 100%)`;
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
    const secondsLeft = Math.max(0, total - elapsed);
    timerText.textContent = `00:${String(secondsLeft).padStart(2, "0")}`;
    progress.style.width = `${(elapsed / total) * 100}%`;
    if (elapsed >= total) showAfterStage();
    elapsed += 1;
  };

  update();
  breathingTimer = window.setInterval(update, 1000);
}

function saveCheckin() {
  if (!activeAnalysis) return;
  const after = Number(afterIntensity.value);
  const record = {
    ...activeAnalysis,
    intensityAfter: after,
    createdAt: new Date().toISOString(),
  };
  const existing = JSON.parse(localStorage.getItem("moodloop_records") || "[]");
  localStorage.setItem("moodloop_records", JSON.stringify([record, ...existing].slice(0, 30)));

  const change = activeAnalysis.intensityBefore - after;
  document.querySelector("#change-title").textContent = change > 0
    ? `你为自己争取到了 ${change} 分空间`
    : "谢谢你如实看见此刻";
  document.querySelector("#change-copy").textContent = change > 0
    ? `从 ${activeAnalysis.intensityBefore} 分到 ${after} 分。改变不必很大，这一点点松动也值得被记住。`
    : `感受暂时没有变轻也没关系。记录它，已经是在认真照顾自己。`;
  afterStage.hidden = true;
  completeStage.hidden = false;
  showToast("这次情绪照顾已保存在当前设备");
}

document.querySelector("#start-practice").addEventListener("click", openPractice);
document.querySelector("#begin-breathing").addEventListener("click", beginBreathing);
document.querySelector("#skip-practice").addEventListener("click", showAfterStage);
document.querySelector("#save-checkin").addEventListener("click", saveCheckin);
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
  button.addEventListener("click", () => {
    document.querySelectorAll("[data-feedback]").forEach((item) => item.classList.remove("selected"));
    button.classList.add("selected");
    button.textContent = button.dataset.feedback === "no" ? "谢谢纠正" : "已记录";
  });
});

updateRange();
