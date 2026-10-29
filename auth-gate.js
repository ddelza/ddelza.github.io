// =============================================
// 광수 웹사이트 모음(ddelza.github.io) — 로그인 게이트
// index.html <head>의 `<style>body{visibility:hidden}</style>`와
// <body> 끝의 `<script type="module" src="auth-gate.js"></script>`로 동작한다.
// 아래 ALLOWED_EMAILS에 있는 구글 계정으로 로그인해야만 본문이 보이고,
// 통과하면 index.html이 정의한 window.startHub()를 호출해 목록을 불러온다.
//
// Firebase 프로젝트는 광수온(gwangsu-on)의 것을 같이 쓴다 — ddelza.github.io 도메인이
// 이미 승인된 도메인으로 등록돼 있어서 따로 설정할 필요가 없다.
//
// ⚠️ 정적 페이지라 이건 "화면 가리기"다. 각 사이트 주소와 GitHub 레포 자체는 여전히 공개.
// =============================================

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getAuth, GoogleAuthProvider, signInWithPopup, signInWithRedirect,
  getRedirectResult, onAuthStateChanged, signOut,
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyB_D2Wi944YQL-1rCdgeNU-tD8lpMek_wM",
  authDomain: "gwangsu-on.firebaseapp.com",
  projectId: "gwangsu-on",
  appId: "1:684885628658:web:b471726b604754a82b626b",
};

const ALLOWED_EMAILS = [
  "kbs26123@gmail.com",
  "kbs@gwangsu.ms.kr",
  "kbsaipro@gmail.com",
];

const isAllowedEmail = (email) => !!email && ALLOWED_EMAILS.includes(email.toLowerCase());

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();
// 매번 계정 선택 창을 띄워야 "다른 계정으로 로그인"이 실제로 동작한다
provider.setCustomParameters({ prompt: "select_account" });

// ── 게이트 UI ──────────────────────────────
const overlay = document.createElement("div");
overlay.id = "hubAuthGate";
overlay.style.cssText = [
  "visibility:visible", "position:fixed", "inset:0", "z-index:99999",
  "display:flex", "align-items:center", "justify-content:center",
  "background:#f4f6fb", "font-family:-apple-system,'Segoe UI','Apple SD Gothic Neo','Malgun Gothic',sans-serif",
].join(";");
overlay.innerHTML = `
  <div style="background:#fff;border-radius:16px;padding:40px 32px;max-width:360px;width:90%;text-align:center;box-shadow:0 4px 20px rgba(0,0,0,0.1)">
    <div style="font-size:2.4rem;margin-bottom:10px">📚</div>
    <h1 style="font-size:1.15rem;margin:0 0 6px;color:#1f2430">광수 웹사이트 모음</h1>
    <p id="hubAuthMsg" style="font-size:0.85rem;color:#6b7280;margin:0 0 20px;line-height:1.5">허용된 계정만 볼 수 있습니다.<br>구글 계정으로 로그인해주세요.</p>
    <button id="hubAuthBtn" style="width:100%;padding:12px;border:none;border-radius:10px;background:#3b82f6;color:#fff;font-size:0.92rem;font-weight:700;cursor:pointer">Google로 로그인</button>
  </div>
`;
document.documentElement.appendChild(overlay);

const msgEl = () => document.getElementById("hubAuthMsg");
const btnEl = () => document.getElementById("hubAuthBtn");

function showLoggedOutState(errorText) {
  overlay.style.display = "flex";
  document.body.style.visibility = "hidden";
  if (errorText) msgEl().innerHTML = `<span style="color:#c0392b">${errorText}</span>`;
  btnEl().disabled = false;
  btnEl().textContent = "Google로 로그인";
}

function showDeniedState(email) {
  overlay.style.display = "flex";
  document.body.style.visibility = "hidden";
  msgEl().innerHTML = `<span style="color:#c0392b">${email ? email + "<br>" : ""}접근이 허용되지 않은 계정입니다.</span>`;
  btnEl().disabled = false;
  btnEl().textContent = "다른 계정으로 로그인";
}

async function doSignIn() {
  btnEl().disabled = true;
  btnEl().textContent = "로그인 중...";
  try {
    await signInWithPopup(auth, provider);
  } catch (err) {
    // 팝업이 막히는 환경(카카오톡 인앱 브라우저 등)에서는 리디렉션 방식으로 재시도
    if (err && (err.code === "auth/popup-blocked" || err.code === "auth/cancelled-popup-request" || err.code === "auth/operation-not-supported-in-this-environment")) {
      try { await signInWithRedirect(auth, provider); return; } catch (e2) { /* fallthrough */ }
    }
    showLoggedOutState("로그인에 실패했습니다. 다시 시도해주세요.");
  }
}
btnEl().addEventListener("click", doSignIn);

getRedirectResult(auth).catch(() => {});

let started = false;
onAuthStateChanged(auth, (user) => {
  if (!user) { showLoggedOutState(); return; }
  if (!isAllowedEmail(user.email)) {
    signOut(auth).finally(() => showDeniedState(user.email));
    return;
  }
  overlay.style.display = "none";
  // ""로 되돌리면 <head>의 body{visibility:hidden}이 다시 적용되므로 "visible"을 명시
  document.body.style.visibility = "visible";

  const who = document.getElementById("whoAmI");
  if (who) who.textContent = user.email;
  if (!started) {
    started = true;
    window.startHub();
  }
});

document.getElementById("logoutBtn")?.addEventListener("click", () => signOut(auth));
