/* ===== Data ===== */
const SUBJECTS = [
  {code:"CS24501", name:"OOSE", credits:3, date:"2026-10-15", time:"10:00"},
  {code:"CS24502", name:"Mobile Application Development", credits:3, date:"2026-10-17", time:"10:00"},
  {code:"CS24503", name:"Software Testing", credits:3, date:"2026-10-19", time:"10:00"},
  {code:"CS24504", name:"UI/UX Design", credits:3, date:"2026-10-21", time:"10:00"},
  {code:"CS24505", name:"Foundation of Robotics", credits:3},
  {code:"HS24501", name:"Professional Ethics and Human Values", credits:2},
  {code:"CS24506", name:"Cloud Computing", credits:3}
];
const DEMO = {user:"21CS001", pass:"Student@123"};
const DEFAULT_PROFILE = {name:"Arun Kumar", reg:"21CS001", email:"arun.kumar@university.edu", phone:"9876543210", dept:"Computer Science", year:"3", sem:"5"};

/* ===== Helpers ===== */
const $ = id => document.getElementById(id);
const esc = s => String(s).replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const load = (k, d) => { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch { return d; } };
const save = (k, v) => localStorage.setItem(k, JSON.stringify(v));
const fmtDate = iso => iso ? iso.split("-").reverse().join("-") : "To be announced";
const fmtTime = t => { if(!t) return "-"; let [h,m] = t.split(":").map(Number); return `${h%12||12}:${String(m).padStart(2,"0")} ${h<12?"AM":"PM"}`; };
const today = () => new Date().toISOString().slice(0,10);
const getRegs = () => load("registrations", []);
const isReg = code => getRegs().some(r => r.code === code);
const examState = r => r.date < today() ? "Completed" : "Upcoming";

/* ===== Popup messages ===== */
function showPopup(title, html, type = "", onClose) {
  $("mTitle").textContent = title;
  $("mBody").innerHTML = html;
  $("modal").querySelector(".box").className = "box " + type;
  $("modal").hidden = false;
  $("modal").onClose = onClose;
  $("mClose").focus();
}
function closePopup() {
  $("modal").hidden = true;
  if ($("modal").onClose) { const f = $("modal").onClose; $("modal").onClose = null; f(); }
}
$("mClose").addEventListener("click", closePopup);
$("modal").addEventListener("click", e => { if (e.target === $("modal")) closePopup(); });
document.addEventListener("keydown", e => { if (e.key === "Escape" && !$("modal").hidden) closePopup(); });

/* ===== Login validation ===== */
function login() {
  const u = $("loginUser").value.trim(), p = $("loginPass").value;
  if (!u || !p) return showPopup("Missing details", "Enter both your username and password.", "error");
  if (p.length < 6) return showPopup("Password too short", "Passwords have at least 6 characters.", "error");
  if (u.toLowerCase() !== DEMO.user.toLowerCase() && u.toLowerCase() !== "student" || p !== DEMO.pass)
    return showPopup("Login failed", "Username or password is incorrect. Try again.", "error");
  sessionStorage.setItem("loggedIn", "1");
  showPopup("Login successful", "Welcome back! Opening your dashboard.", "success", showApp);
}
$("loginBtn").addEventListener("click", login);
[$("loginUser"), $("loginPass")].forEach(i => i.addEventListener("keydown", e => { if (e.key === "Enter") login(); }));

/* Forgot username / password popups */
function forgotPopup(kind) {
  const isUser = kind === "user";
  showPopup(isUser ? "Forgot Username" : "Forgot Password",
    `<label for="fpIn">${isUser ? "Registered email" : "Register number"}</label><input id="fpIn" type="${isUser ? "email" : "text"}">` +
    `<small class="err" id="fpErr"></small>`);
  $("mClose").textContent = "Send";
  $("mClose").onclick = () => {
    const v = $("fpIn").value.trim();
    if (!v || (isUser && !/^\S+@\S+\.\S+$/.test(v))) { $("fpErr").textContent = isUser ? "Enter a valid email address." : "Enter your register number."; return; }
    $("mClose").onclick = null; $("mClose").textContent = "OK";
    showPopup("Request sent", isUser ? "If this email is registered, your username has been sent to it." : "If this register number exists, a reset link has been sent to your email.", "success");
  };
}
$("forgotUser").addEventListener("click", e => { e.preventDefault(); forgotPopup("user"); });
$("forgotPass").addEventListener("click", e => { e.preventDefault(); forgotPopup("pass"); });
$("modal").addEventListener("click", e => { if (e.target === $("modal")) { $("mClose").onclick = null; $("mClose").textContent = "OK"; } });

/* ===== App start / logout ===== */
function showApp() {
  $("mClose").textContent = "OK"; $("mClose").onclick = null;
  $("loginPage").hidden = true; $("app").hidden = false;
  renderAll();
}
$("logoutBtn").addEventListener("click", () => {
  sessionStorage.removeItem("loggedIn");
  $("app").hidden = true; $("loginPage").hidden = false;
  $("loginPass").value = "";
});

/* ===== Navigation, sidebar, smooth scrolling ===== */
$("menuBtn").addEventListener("click", () => $("sidebar").classList.toggle("open"));
document.querySelectorAll('a[href^="#"]').forEach(a => {
  const id = a.getAttribute("href").slice(1);
  if (!id) return;
  a.addEventListener("click", e => {
    e.preventDefault();
    const t = $(id); if (t) t.scrollIntoView({behavior:"smooth"});
    $("sidebar").classList.remove("open");
  });
});
window.addEventListener("scroll", () => {
  let cur = "";
  document.querySelectorAll("main section").forEach(s => { if (s.getBoundingClientRect().top < 140) cur = s.id; });
  document.querySelectorAll(".sidebar nav a").forEach(a => a.classList.toggle("active", a.getAttribute("href") === "#" + cur));
});

/* ===== Dark mode ===== */
function setTheme(dark) { document.body.classList.toggle("dark", dark); $("themeBtn").innerHTML = dark ? "&#9788;" : "&#9790;"; save("dark", dark); }
$("themeBtn").addEventListener("click", () => setTheme(!document.body.classList.contains("dark")));

/* ===== Dashboard cards (animated count-up) ===== */
function countUp(el, to) {
  const from = Number(el.textContent) || 0; if (from === to) return;
  const steps = 15; let i = 0;
  const t = setInterval(() => { i++; el.textContent = Math.round(from + (to - from) * i / steps); if (i >= steps) clearInterval(t); }, 30);
}
function renderDashboard() {
  const regs = getRegs(), p = load("profile", DEFAULT_PROFILE);
  $("dName").textContent = p.name; $("dReg").textContent = p.reg;
  countUp($("cTotal"), SUBJECTS.length);
  countUp($("cReg"), regs.length);
  countUp($("cUp"), regs.filter(r => examState(r) === "Upcoming").length);
  countUp($("cDone"), regs.filter(r => examState(r) === "Completed").length);
}

/* ===== Subjects: search / filter / selection ===== */
function renderSubjects() {
  const q = $("searchBox").value.trim().toLowerCase(), f = $("filterSel").value;
  const list = SUBJECTS.filter(s =>
    (s.name.toLowerCase().includes(q) || s.code.toLowerCase().includes(q)) &&
    (f === "all" || (f === "done") === isReg(s.code)));
  $("subjectGrid").innerHTML = list.length ? list.map(s => `
    <div class="subj"><span class="code">${s.code}</span><h3>${esc(s.name)}</h3>
      <span class="muted">${s.credits} credits &middot; Exam: ${fmtDate(s.date)}</span>
      ${isReg(s.code) ? '<button class="btn" disabled>Registered</button>'
        : `<button class="btn outline" data-pick="${s.code}">Select &amp; Register</button>`}
    </div>`).join("") : '<p class="empty">No subjects match your search.</p>';
}
$("searchBox").addEventListener("input", renderSubjects);
$("filterSel").addEventListener("change", renderSubjects);
$("subjectGrid").addEventListener("click", e => {
  const code = e.target.dataset.pick; if (!code) return;
  $("fSubject").value = code; fillExamDate(); $("register").scrollIntoView({behavior:"smooth"});
});

/* Subject dropdown + auto-fill date/time from the schedule */
function fillSubjectSelect() {
  $("fSubject").innerHTML = '<option value="">Select subject</option>' +
    SUBJECTS.map(s => `<option value="${s.code}">${s.code} - ${esc(s.name)}</option>`).join("");
}
function fillExamDate() {
  const s = SUBJECTS.find(x => x.code === $("fSubject").value);
  if (s && s.date) { $("fDate").value = s.date; $("fTime").value = s.time; }
}
$("fSubject").addEventListener("change", fillExamDate);

/* ===== Registration form validation + saving ===== */
function setErr(id, msg) {
  const f = $(id).closest(".field"); f.classList.toggle("bad", !!msg); f.querySelector(".err").textContent = msg || "";
  return !msg;
}
function validateForm() {
  const v = id => $(id).value.trim();
  const checks = [
    setErr("fName", /^[A-Za-z .]{3,}$/.test(v("fName")) ? "" : "Enter your full name (letters only)."),
    setErr("fReg", /^[A-Za-z0-9]{6,12}$/.test(v("fReg")) ? "" : "Enter a valid register number."),
    setErr("fEmail", /^\S+@\S+\.\S+$/.test(v("fEmail")) ? "" : "Enter a valid email address."),
    setErr("fPhone", /^[6-9]\d{9}$/.test(v("fPhone")) ? "" : "Enter a 10-digit mobile number."),
    setErr("fDept", v("fDept") ? "" : "Select your department."),
    setErr("fYear", v("fYear") ? "" : "Select your year."),
    setErr("fSem", v("fSem") ? "" : "Select your semester."),
    setErr("fSubject", v("fSubject") ? "" : "Select a subject."),
    setErr("fDate", !v("fDate") ? "Choose the exam date." : v("fDate") < today() ? "Date cannot be in the past." : ""),
    setErr("fTime", v("fTime") ? "" : "Choose the exam time.")
  ];
  return checks.every(Boolean);
}
$("regForm").addEventListener("submit", e => {
  e.preventDefault();
  if (!validateForm()) return showPopup("Check the form", "Fix the highlighted fields and submit again.", "error");
  const code = $("fSubject").value;
  if (isReg(code)) return showPopup("Already registered", `You have already registered for ${code}. Pick a different subject.`, "error");
  const s = SUBJECTS.find(x => x.code === code);
  const regs = getRegs();
  regs.push({code, name:s.name, date:$("fDate").value, time:$("fTime").value, registeredOn:today()});
  save("registrations", regs);
  save("profile", {name:$("fName").value.trim(), reg:$("fReg").value.trim(), email:$("fEmail").value.trim(),
    phone:$("fPhone").value.trim(), dept:$("fDept").value, year:$("fYear").value, sem:$("fSem").value});
  $("regForm").reset(); renderAll();
  showPopup("Registration successful", `You are registered for <b>${code} - ${esc(s.name)}</b>.`, "success");
});

/* ===== Registered subjects, schedule, status, profile ===== */
function renderRegistered() {
  const regs = getRegs();
  $("regList").innerHTML = regs.length ? regs.map(r => `
    <div class="subj"><span class="code">${r.code}</span><h3>${esc(r.name)}</h3>
      <span class="muted">${fmtDate(r.date)} at ${fmtTime(r.time)}</span>
      <button class="btn outline small" data-cancel="${r.code}">Cancel registration</button></div>`).join("")
    : '<p class="empty">You have not registered for any exam yet. Choose a subject above to start.</p>';
}
$("regList").addEventListener("click", e => {
  const code = e.target.dataset.cancel; if (!code) return;
  if (!confirm("Cancel registration for " + code + "?")) return;
  save("registrations", getRegs().filter(r => r.code !== code)); renderAll();
});
function renderSchedule() {
  $("schedBody").innerHTML = SUBJECTS.filter(s => s.date).map(s => {
    const reg = isReg(s.code), done = s.date < today();
    const status = done ? "Completed" : reg ? "Registered" : "Open for registration";
    return `<tr><td>${s.code}</td><td>${esc(s.name)}</td><td>${fmtDate(s.date)}</td><td>${fmtTime(s.time)}</td>
      <td><span class="badge ${reg ? "ok" : done ? "" : "warn"}">${status}</span></td></tr>`;
  }).join("");
}
function renderStatus() {
  const regs = getRegs();
  $("statusList").innerHTML = regs.length ? regs.map(r => `
    <div class="status-item"><span><b>${r.code}</b> - ${esc(r.name)}<br><small class="muted">Registered on ${fmtDate(r.registeredOn)}</small></span>
      <span><span class="badge ok">Confirmed</span> <span class="badge">${examState(r)}</span></span></div>`).join("")
    : '<p class="empty">No registrations yet, so there is no status to show.</p>';
}
function renderProfile() {
  const p = load("profile", DEFAULT_PROFILE);
  $("avatar").textContent = p.name.charAt(0).toUpperCase();
  const rows = [["Name",p.name],["Register Number",p.reg],["Email",p.email],["Phone",p.phone],["Department",p.dept],["Year",p.year],["Semester",p.sem]];
  $("profileInfo").innerHTML = rows.map(([k,v]) => `<dt>${k}</dt><dd>${esc(v)}</dd>`).join("");
}
function renderAll() {
  renderDashboard(); renderSubjects(); renderRegistered(); renderSchedule(); renderStatus(); renderProfile();
}

/* ===== Init ===== */
fillSubjectSelect();
setTheme(load("dark", false));
if (sessionStorage.getItem("loggedIn")) showApp();
