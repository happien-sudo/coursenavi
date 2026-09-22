/**
 * 2026 과목선택 나침반 - 과목 설계 플래너 엔진
 * 192학점 이수 요건 검증 & 실시간 학점 시뮬레이션
 */

const PLANNER_STORAGE_KEY = "bucheon_course_planner_2026";

// 6개 학기 초기 상태 정의
const DEFAULT_EMPTY_PLAN = {
  "1-1": [],
  "1-2": [],
  "2-1": [],
  "2-2": [],
  "3-1": [],
  "3-2": []
};

// 1학년 공통과목 표준 템플릿
const DEFAULT_GRADE1_TEMPLATE = {
  "1-1": [
    "kor_common1",      // 공통국어1 (4)
    "math_common1",     // 공통수학1 (4)
    "eng_common1",      // 공통영어1 (4)
    "soc_history1",     // 한국사1 (3)
    "soc_common_soc1",  // 통합사회1 (4)
    "sci_common_sci1",  // 통합과학1 (4)
    "sci_inquiry_exp1", // 과학탐구실험1 (1)
    "pe_pe1"            // 체육1 (3)
  ],
  "1-2": [
    "kor_common2",      // 공통국어2 (4)
    "math_common2",     // 공통수학2 (4)
    "eng_common2",      // 공통영어2 (4)
    "soc_history2",     // 한국사2 (3)
    "soc_common_soc2",  // 통합사회2 (4)
    "sci_common_sci2",  // 통합과학2 (4)
    "sci_inquiry_exp2", // 과학탐구실험2 (1)
    "art_music"         // 음악 (3)
  ]
};

const SEMESTER_LABELS = {
  "1-1": "1학년 1학기",
  "1-2": "1학년 2학기",
  "2-1": "2학년 1학기",
  "2-2": "2학년 2학기",
  "3-1": "3학년 1학기",
  "3-2": "3학년 2학기"
};

let userPlan = {};
let activeSemesterForAdd = "1-1";

// 플래너 초기화 및 데이터 로드
function initPlanner() {
  const saved = localStorage.getItem(PLANNER_STORAGE_KEY);
  if (saved) {
    try {
      userPlan = JSON.parse(saved);
    } catch (e) {
      userPlan = JSON.parse(JSON.stringify(DEFAULT_EMPTY_PLAN));
    }
  } else {
    // 최초 방문 시 1학년 기본 과목 미리 세팅
    userPlan = JSON.parse(JSON.stringify(DEFAULT_EMPTY_PLAN));
    userPlan["1-1"] = [...DEFAULT_GRADE1_TEMPLATE["1-1"]];
    userPlan["1-2"] = [...DEFAULT_GRADE1_TEMPLATE["1-2"]];
    savePlan();
  }

  renderPlannerUI();
}

// 플래너 저장
function savePlan() {
  localStorage.setItem(PLANNER_STORAGE_KEY, JSON.stringify(userPlan));
}

// 플래너 전체 UI 렌더링
function renderPlannerUI() {
  const container = document.getElementById("semesters-container");
  if (!container) return;

  container.innerHTML = "";

  const semesterKeys = ["1-1", "1-2", "2-1", "2-2", "3-1", "3-2"];
  
  semesterKeys.forEach(semKey => {
    const semCol = document.createElement("div");
    semCol.className = "semester-col";

    const subjectIds = userPlan[semKey] || [];
    let semCredits = 0;

    subjectIds.forEach(id => {
      const course = COURSES_DATA.find(c => c.id === id);
      if (course) semCredits += course.credits;
    });

    // 헤더
    const colHeader = document.createElement("div");
    colHeader.className = "semester-col-header";
    colHeader.innerHTML = `
      <h4>${SEMESTER_LABELS[semKey]}</h4>
      <span class="semester-credit-tag">${semCredits} 학점</span>
    `;
    semCol.appendChild(colHeader);

    // 드롭존 / 과목 목록
    const dropzone = document.createElement("div");
    dropzone.className = "semester-dropzone";

    if (subjectIds.length === 0) {
      dropzone.innerHTML = `
        <div style="text-align: center; color: #94a3b8; padding: 28px 10px; font-size: 0.85rem;">
          담긴 과목이 없습니다.<br />아래 버튼을 눌러 과목을 추가하세요.
        </div>
      `;
    } else {
      subjectIds.forEach((id, idx) => {
        const course = COURSES_DATA.find(c => c.id === id);
        if (!course) return;

        const item = document.createElement("div");
        item.className = "planned-subject-item";
        item.innerHTML = `
          <div class="planned-item-left" onclick="showCourseModal('${course.id}')" style="cursor: pointer;">
            <div class="planned-item-name">${course.name}</div>
            <div class="planned-item-meta">${course.category} · ${course.type} · ${course.credits}학점</div>
          </div>
          <button class="planned-item-remove-btn" title="삭제" onclick="removeSubject('${semKey}', ${idx})">✕</button>
        `;
        dropzone.appendChild(item);
      });
    }

    // 과목 추가 버튼
    const addBtn = document.createElement("button");
    addBtn.className = "btn btn-outline";
    addBtn.style.cssText = "width: 100%; border-radius: var(--radius-md); margin-top: auto; padding: 8px 12px; font-size: 0.82rem; justify-content: center;";
    addBtn.innerHTML = `<span>➕</span> 과목 추가하기`;
    addBtn.onclick = () => openAddSubjectModal(semKey);
    dropzone.appendChild(addBtn);

    semCol.appendChild(dropzone);
    container.appendChild(semCol);
  });

  updatePlannerStats();
}

// 학점 통계 및 규정 준수 검증
function updatePlannerStats() {
  let totalSubjectCredits = 0;
  let koreanCredits = 0;
  let mathCredits = 0;
  let engCredits = 0;

  const categoryCredits = {};

  Object.keys(userPlan).forEach(semKey => {
    (userPlan[semKey] || []).forEach(id => {
      const course = COURSES_DATA.find(c => c.id === id);
      if (course) {
        totalSubjectCredits += course.credits;
        categoryCredits[course.category] = (categoryCredits[course.category] || 0) + course.credits;

        if (course.category === "국어") koreanCredits += course.credits;
        if (course.category === "수학") mathCredits += course.credits;
        if (course.category === "영어") engCredits += course.credits;
      }
    });
  });

  const creativeActivityCredits = 18; // 창체 기본 18학점
  const finalTotalCredits = totalSubjectCredits + creativeActivityCredits;
  const kmeTotal = koreanCredits + mathCredits + engCredits;

  // 1. 총 이수학점 프로그레스 바 갱신
  const currentTotalEl = document.getElementById("current-total-credits");
  const percentEl = document.getElementById("credit-percent");
  const fillEl = document.getElementById("planner-progress-fill");

  if (currentTotalEl) currentTotalEl.textContent = `${finalTotalCredits} (교과 ${totalSubjectCredits} + 창체 18)`;
  
  const percentage = Math.min(Math.round((finalTotalCredits / 192) * 100), 100);
  if (percentEl) percentEl.textContent = `(${percentage}%)`;
  if (fillEl) fillEl.style.width = `${percentage}%`;

  // 2. 국·영·수 81학점 이수 제한 검증
  const kmeAlertEl = document.getElementById("korean-math-eng-alert");
  const kmeCreditEl = document.getElementById("kme-credits");
  if (kmeCreditEl) kmeCreditEl.textContent = kmeTotal;

  if (kmeAlertEl) {
    if (kmeTotal > 81) {
      kmeAlertEl.className = "alert-chip danger";
      kmeAlertEl.innerHTML = `<span>⚠️</span> 국·영·수 총 이수: <strong>${kmeTotal}</strong> / 81 학점 (81학점 초과! 과목 축소 필요)`;
    } else if (kmeTotal >= 76) {
      kmeAlertEl.className = "alert-chip warn";
      kmeAlertEl.innerHTML = `<span>⚠️</span> 국·영·수 총 이수: <strong>${kmeTotal}</strong> / 81 학점 (상한선 근접 주의)`;
    } else {
      kmeAlertEl.className = "alert-chip safe";
      kmeAlertEl.innerHTML = `<span>ℹ️</span> 국·영·수 총 이수: <strong>${kmeTotal}</strong> / 81 학점 (규정 준수)`;
    }
  }

  // 3. 졸업 기준 학점 충족 칩
  const gradStatusEl = document.getElementById("graduation-status-chip");
  if (gradStatusEl) {
    if (finalTotalCredits >= 192) {
      gradStatusEl.className = "alert-chip safe";
      gradStatusEl.innerHTML = `<span>🎉</span> 고교 3개년 192학점 졸업 요건 달성!`;
    } else {
      const remain = 192 - finalTotalCredits;
      gradStatusEl.className = "alert-chip warn";
      gradStatusEl.innerHTML = `<span>⏱️</span> 졸업 요건(192학점)까지 <strong>${remain}학점</strong> 남음`;
    }
  }
}

// 과목 추가 모달 열기
function openAddSubjectModal(semesterKey) {
  activeSemesterForAdd = semesterKey;
  const modalTag = document.getElementById("add-modal-semester-tag");
  if (modalTag) modalTag.textContent = SEMESTER_LABELS[semesterKey];

  const searchInput = document.getElementById("add-modal-search");
  if (searchInput) searchInput.value = "";

  filterAddModalSubjects();
  openModal("add-subject-modal");
}

// 과목 추가 모달 리스트 필터링
function filterAddModalSubjects() {
  const query = (document.getElementById("add-modal-search")?.value || "").trim().toLowerCase();
  const listContainer = document.getElementById("add-modal-subject-list");
  if (!listContainer) return;

  const currentSemesterSubjects = userPlan[activeSemesterForAdd] || [];

  const filtered = COURSES_DATA.filter(course => {
    if (currentSemesterSubjects.includes(course.id)) return false; // 이미 이번 학기에 담긴 과목 제외
    if (!query) return true;
    return course.name.toLowerCase().includes(query) || course.category.toLowerCase().includes(query) || course.type.toLowerCase().includes(query);
  });

  if (filtered.length === 0) {
    listContainer.innerHTML = `
      <div style="text-align: center; color: #94a3b8; padding: 24px;">검색된 과목이 없거나 이미 이번 학기에 추가되었습니다.</div>
    `;
    return;
  }

  listContainer.innerHTML = filtered.map(course => `
    <div style="display: flex; align-items: center; justify-content: space-between; background: #f8fafc; padding: 10px 14px; border-radius: 10px; border: 1px solid var(--border-light);">
      <div>
        <span class="badge ${getCategoryBadgeClass(course.category)}">${course.category}</span>
        <span class="badge badge-gray">${course.type}</span>
        <strong style="margin-left: 6px; font-size: 0.95rem; color: #1e293b;">${course.name}</strong>
        <span style="font-size: 0.8rem; color: #0284c7; margin-left: 6px;">(${course.credits}학점)</span>
      </div>
      <button class="btn btn-primary" style="padding: 5px 12px; font-size: 0.78rem;" onclick="addSubjectToSemester('${activeSemesterForAdd}', '${course.id}')">
        추가
      </button>
    </div>
  `).join("");
}

// 특정 학기에 과목 추가
function addSubjectToSemester(semesterKey, courseId) {
  if (!userPlan[semesterKey]) userPlan[semesterKey] = [];
  
  if (userPlan[semesterKey].includes(courseId)) {
    showToast("이미 해당 학기에 담겨있는 과목입니다.");
    return;
  }

  userPlan[semesterKey].push(courseId);
  savePlan();
  renderPlannerUI();
  closeModal("add-subject-modal");

  const course = COURSES_DATA.find(c => c.id === courseId);
  showToast(`[${SEMESTER_LABELS[semesterKey]}]에 '${course ? course.name : ""}' 과목을 추가했습니다!`);
}

// 학과 카드 등에서 빠른 과목 담기 (가장 적절한 학기 추천하여 담기)
function quickAddToPlanner(courseId) {
  const course = COURSES_DATA.find(c => c.id === courseId);
  if (!course) return;

  // 공통과목은 1학년, 일반선택은 2학년, 진로/융합선택은 2-2~3학년 추천
  let targetSem = "2-1";
  if (course.type === "공통") {
    targetSem = course.name.includes("2") ? "1-2" : "1-1";
  } else if (course.type === "일반선택") {
    targetSem = (userPlan["2-1"].length <= userPlan["2-2"].length) ? "2-1" : "2-2";
  } else {
    targetSem = (userPlan["3-1"].length <= userPlan["3-2"].length) ? "3-1" : "3-2";
  }

  addSubjectToSemester(targetSem, courseId);
}

// 과목 삭제
function removeSubject(semesterKey, index) {
  if (!userPlan[semesterKey]) return;
  const removedId = userPlan[semesterKey][index];
  const course = COURSES_DATA.find(c => c.id === removedId);

  userPlan[semesterKey].splice(index, 1);
  savePlan();
  renderPlannerUI();

  if (course) showToast(`'${course.name}' 과목을 삭제했습니다.`);
}

// 1학년 표준 과목 불러오기
function loadDefaultPlan() {
  if (confirm("1학년 기본 공통과목 템플릿(국·영·수·통사·통과·실험 등)을 플래너에 적용할까요?")) {
    userPlan["1-1"] = [...DEFAULT_GRADE1_TEMPLATE["1-1"]];
    userPlan["1-2"] = [...DEFAULT_GRADE1_TEMPLATE["1-2"]];
    savePlan();
    renderPlannerUI();
    showToast("1학년 기본 공통과목이 플래너에 배치되었습니다.");
  }
}

// 플랜 초기화
function resetPlan() {
  if (confirm("모든 학기의 과목 선택을 초기화하시겠습니까?")) {
    userPlan = JSON.parse(JSON.stringify(DEFAULT_EMPTY_PLAN));
    savePlan();
    renderPlannerUI();
    showToast("과목 설계 플래너가 초기화되었습니다.");
  }
}

// 인쇄 / PDF 저장
function printPlanReport() {
  window.print();
}

// 과목이 플래너에 들어있는지 확인
function isSubjectPlanned(courseId) {
  return Object.values(userPlan).some(list => list.includes(courseId));
}
