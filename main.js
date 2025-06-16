// main.js (최종 리팩토링)
import {
  getQuizByDate,
  getAllQuizDates,
  submitAnswer,
  getAnswerStats,
  submitComment,
  onGuestbookUpdate,
  submitSuggestion
} from './firebase.js';

function log(tag, value) {
  console.log(`[%c${tag}%c]`, 'color: green; font-weight: bold;', 'color: black;', value);
}

const today = new Date().toISOString().split('T')[0];
log('오늘 날짜', today);

// DOM 요소
const hintEl = document.getElementById('quizHint');
const meaningEl = document.getElementById('quizMeaning');
const inputEl = document.getElementById('answerInput');
const resultEl = document.getElementById('answerResult');
const statsEl = document.getElementById('stats');
const commentInput = document.getElementById('commentInput');
const commentList = document.getElementById('guestbookList');
const suggestPopup = document.getElementById('suggestPopup');

// 퀴즈 불러오기
async function loadQuiz(date) {
  const quiz = await getQuizByDate(date);
  if (!quiz) {
    hintEl.textContent = '퀴즈가 아직 등록되지 않았습니다';
    meaningEl.textContent = '';
    return;
  }
  log(`${date} 퀴즈`, quiz);
  hintEl.textContent = quiz.hint;
  meaningEl.textContent = quiz.meaning;

  document.getElementById('submitAnswerBtn')?.addEventListener('click', () => {
    const cleanedInput = inputEl.value.toLowerCase().replaceAll(' ', '');
    const cleanedAnswer = quiz.keyword.toLowerCase().replaceAll(' ', '');
    const isCorrect = cleanedInput === cleanedAnswer;

    resultEl.textContent = isCorrect ? '🎉 정답입니다!' : '❌ 오답입니다';
    submitAnswer(date, isCorrect).then(updateStats).catch(err => console.error('[정답 기록 실패]', err));
  });

  document.getElementById('showAnswerBtn')?.addEventListener('click', () => {
    resultEl.textContent = `정답은 "${quiz.keyword}" 입니다.`;
  });
}

async function updateStats() {
  const stats = await getAnswerStats(today);
  const total = (stats.correct || 0) + (stats.wrong || 0);
  const rate = total ? Math.round((stats.correct / total) * 100) : 0;
  statsEl.textContent = `정답률: ${rate}% (정답 ${stats.correct || 0}, 오답 ${stats.wrong || 0})`;
}

// 초기 퀴즈 로드
loadQuiz(today).catch(err => console.error('[퀴즈 로딩 실패]', err));
updateStats();

// 방명록 처리
onGuestbookUpdate(comments => {
  commentList.innerHTML = '';
  comments.forEach(entry => {
    const li = document.createElement('div');
    li.className = 'comment';
    li.textContent = `[${entry.date}] ${entry.message}`;
    commentList.appendChild(li);
  });
});

window.submitComment = function () {
  const msg = commentInput.value.trim();
  if (!msg) return alert('내용을 입력해주세요.');
  submitComment(msg).then(() => {
    commentInput.value = '';
  }).catch(err => console.error('[댓글 저장 실패]', err));
};

// 제보 팝업 핸들링
window.toggleSuggestPopup = function () {
  suggestPopup.style.display = suggestPopup.style.display === 'block' ? 'none' : 'block';
};

window.submitSuggestion = function () {
  const term = document.getElementById('suggestTerm').value.trim();
  const meaning = document.getElementById('suggestMeaning').value.trim();
  if (!term || !meaning) return alert('단어와 의미를 모두 입력해주세요.');
  submitSuggestion(term, meaning).then(() => {
    alert('제보가 제출되었습니다. 감사합니다!');
    document.getElementById('suggestTerm').value = '';
    document.getElementById('suggestMeaning').value = '';
    toggleSuggestPopup();
  }).catch(err => console.error('[제보 제출 실패]', err));
};

// 날짜별 퀴즈
window.showDateSelector = async function () {
  document.getElementById("dateSelectorSection").style.display = 'block';
  const selector = document.getElementById("quizDateSelector");
  const dates = await getAllQuizDates();
  const todayStr = new Date().toISOString().split('T')[0];
  const validDates = dates.filter(date => date <= todayStr);
  selector.innerHTML = '';
  validDates.reverse().forEach(date => {
    const option = document.createElement('option');
    option.value = date;
    option.textContent = date;
    selector.appendChild(option);
  });
};

window.loadTodayQuiz = function () {
  location.reload();
};

document.getElementById("loadSelectedDateBtn")?.addEventListener("click", async () => {
  const date = document.getElementById("quizDateSelector").value;
  if (!date) return alert("날짜를 선택해주세요");
  const quiz = await getQuizByDate(date);
  if (!quiz) return alert("해당 날짜의 퀴즈가 없습니다");
  const guess = prompt(`${date} 퀴즈\n자음: ${quiz.hint}\n정답을 입력하세요:`);
  const correct = guess?.toLowerCase().replaceAll(' ', '') === quiz.keyword.toLowerCase().replaceAll(' ', '');
  alert(correct ? '🎉 정답입니다!' : `❌ 오답입니다. 정답: ${quiz.keyword}`);
  await submitAnswer(date, correct);
  updateStats();
});
