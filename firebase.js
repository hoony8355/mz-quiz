// firebase.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.9.1/firebase-app.js";
import { getDatabase, ref, get, set, update, push, onValue } from "https://www.gstatic.com/firebasejs/11.9.1/firebase-database.js";
import { getAuth, signInWithPopup, GoogleAuthProvider, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.9.1/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyDEzFIidhnjeXoRmstn1Jla8EIA8ZMm-rM",
  authDomain: "mz-quiz-6e0ab.firebaseapp.com",
  projectId: "mz-quiz-6e0ab",
  storageBucket: "mz-quiz-6e0ab.firebasestorage.app",
  messagingSenderId: "5450421788",
  appId: "1:5450421788:web:8cdfcbb0c72622cd6031d9",
  measurementId: "G-ZLG5MZBR4K",
  databaseURL: "https://mz-quiz-6e0ab-default-rtdb.firebaseio.com"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();

// 🟡 오늘의 퀴즈 가져오기
export async function getQuizByDate(dateStr) {
  const snapshot = await get(ref(db, `quizzes/${dateStr}`));
  return snapshot.exists() ? snapshot.val() : null;
}

// 🟡 날짜별 퀴즈 목록 불러오기
export async function getAllQuizDates() {
  const snapshot = await get(ref(db, "quizzes"));
  return snapshot.exists() ? Object.keys(snapshot.val()) : [];
}

// 🟡 정답률 기록
export async function submitAnswer(dateStr, isCorrect) {
  const path = `answers/${dateStr}/${isCorrect ? "correct" : "wrong"}`;
  const snapshot = await get(ref(db, path));
  const count = snapshot.exists() ? snapshot.val() : 0;
  await set(ref(db, path), count + 1);
}

// 🟡 정답률 가져오기
export async function getAnswerStats(dateStr) {
  const snapshot = await get(ref(db, `answers/${dateStr}`));
  return snapshot.exists() ? snapshot.val() : { correct: 0, wrong: 0 };
}

// 🟡 댓글 저장
export async function submitComment(message) {
  const now = new Date().toISOString().split("T")[0];
  await push(ref(db, `guestbook/`), { message, date: now });
}

// 🟡 댓글 목록 가져오기 (onValue로 실시간 반영 가능)
export function onGuestbookUpdate(callback) {
  onValue(ref(db, "guestbook"), (snapshot) => {
    const data = snapshot.val() || {};
    callback(Object.values(data));
  });
}

// 🟡 제보 저장
export async function submitSuggestion(term, meaning) {
  const timestamp = Date.now();
  await push(ref(db, `suggestions`), {
    term,
    meaning,
    timestamp
  });
}

// 🟡 로그인
export function signIn(callback) {
  signInWithPopup(auth, provider)
    .then((result) => callback(result.user))
    .catch((error) => console.error("Login Error", error));
}

export function onAuthStateChangedHandler(callback) {
  onAuthStateChanged(auth, callback);
}
