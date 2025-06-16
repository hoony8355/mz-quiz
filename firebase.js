import { initializeApp } from "https://www.gstatic.com/firebasejs/11.9.1/firebase-app.js";
import {
  getDatabase, ref, get, set, push, onValue
} from "https://www.gstatic.com/firebasejs/11.9.1/firebase-database.js";
import {
  getAuth, signInWithPopup, GoogleAuthProvider, onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/11.9.1/firebase-auth.js";

// 🔧 Firebase 초기화
const firebaseConfig = {
  apiKey: "AIzaSyDEzFIidhnjeXoRmstn1Jla8EIA8ZMm-rM",
  authDomain: "mz-quiz-6e0ab.firebaseapp.com",
  projectId: "mz-quiz-6e0ab",
  storageBucket: "mz-quiz-6e0ab.firebasestorage.app",
  messagingSenderId: "5450421788",
  appId: "1:5450421788:web:8cdfcbb0c72622cd6031d9",
  measurementId: "G-ZLG5MZBR4K",
  databaseURL: "https://mz-quiz-6e0ab-default-rtdb.asia-southeast1.firebasedatabase.app"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();

// 📌 공통 유틸
const getPathRef = (path) => ref(db, path);
const safeGet = async (path) => {
  const snapshot = await get(getPathRef(path));
  return snapshot.exists() ? snapshot.val() : null;
};

// 📘 퀴즈 관련
export async function getQuizByDate(dateStr) {
  return await safeGet(`quizzes/${dateStr}`);
}

export async function getAllQuizDates() {
  const data = await safeGet("quizzes");
  return data ? Object.keys(data) : [];
}

// ✅ 정답 처리
export async function submitAnswer(dateStr, isCorrect) {
  const path = `answers/${dateStr}/${isCorrect ? "correct" : "wrong"}`;
  const count = await safeGet(path) || 0;
  await set(getPathRef(path), count + 1);
}

export async function getAnswerStats(dateStr) {
  return await safeGet(`answers/${dateStr}`) || { correct: 0, wrong: 0 };
}

// 🗣️ 댓글
export async function submitComment(message) {
  const now = new Date().toISOString().split("T")[0];
  await push(getPathRef("guestbook"), { message, date: now });
}

export function onGuestbookUpdate(callback) {
  onValue(getPathRef("guestbook"), (snapshot) => {
    const data = snapshot.val() || {};
    callback(Object.values(data));
  });
}

// 📝 신조어 제보
export async function submitSuggestion(term, meaning) {
  await push(getPathRef("suggestions"), {
    term,
    meaning,
    timestamp: Date.now()
  });
}

// 🔐 인증 관련
export function signIn(callback) {
  signInWithPopup(auth, provider)
    .then((result) => callback(result.user))
    .catch((err) => console.error("[Login Error]", err));
}

export function onAuthStateChangedHandler(callback) {
  onAuthStateChanged(auth, callback);
}

export function getCurrentUser() {
  return auth.currentUser;
}

export function isAuthorized(email) {
  const allowlist = ["hale7292@gmail.com"];
  return allowlist.includes(email);
}
