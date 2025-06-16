// firebase.js
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

// 🔧 내부 유틸
const getPathRef = (path) => ref(db, path);

export async function safeGet(path) {
  const snapshot = await get(getPathRef(path));
  return snapshot.exists() ? snapshot.val() : null;
}

// 📘 퀴즈 관련
export async function getQuizByDate(dateStr) {
  return await safeGet(`quizzes/${dateStr}`);
}

export async function getAllQuizDates() {
  const data = await safeGet("quizzes");
  return data ? Object.keys(data) : [];
}

export async function setQuizToDate(dateStr, quizData) {
  return await set(getPathRef(`quizzes/${dateStr}`), quizData);
}

// ✅ 정답 처리
export async function submitAnswer(dateStr, isCorrect) {
  const path = `answers/${dateStr}/${isCorrect ? "correct" : "wrong"}`;
  const current = await safeGet(path) || 0;
  return await set(getPathRef(path), current + 1);
}

export async function getAnswerStats(dateStr) {
  return await safeGet(`answers/${dateStr}`) || { correct: 0, wrong: 0 };
}

// 🗣️ 방명록
export async function submitComment(message) {
  const today = new Date().toISOString().split("T")[0];
  return await push(getPathRef("guestbook"), { message, date: today });
}

export function onGuestbookUpdate(callback) {
  onValue(getPathRef("guestbook"), (snapshot) => {
    const data = snapshot.val() || {};
    callback(Object.values(data));
  });
}

// 📝 신조어 제보
export async function submitSuggestion(term, meaning) {
  return await push(getPathRef("suggestions"), {
    term,
    meaning,
    timestamp: Date.now()
  });
}

// 📦 퀴즈 풀 관련
export async function getQuizPool() {
  return await safeGet("pool");
}

export async function setNewQuizToPool(keyword, hint, meaning) {
  const id = Date.now();
  return await set(getPathRef(`pool/${id}`), { keyword, hint, meaning });
}

// 🔐 로그인 및 인증
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
