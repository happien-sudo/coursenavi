/**
 * 2026 과목선택 나침반 - 메인 애플리케이션 스크립트
 * 화면 렌더링, 탭 전환, 검색/필터링, 모달 팝업 등 인터랙션 제어
 */

// 필터 상태
let currentCourseCategory = "all";
let currentCourseType = "all";
let currentMajorDivision = "all";

// 문서 로드 완료 시 초기화
document.addEventListener("DOMContentLoaded", () => {
  renderGuideTab();
  renderCoursesTab();
  renderMajorsTab();
  renderBucheonTab();
  initPlanner();
});

// ==========================================
// 1. 탭 전환 제어
// ==========================================
function switchTab(tabId) {
  // 탭 버튼 활성화 변경
  document.querySelectorAll(".nav-btn").forEach(btn => {
    btn.classList.toggle("active", btn.dataset.tab === tabId);
  });

  // 패널 활성화 변경
  document.querySelectorAll(".tab-panel").forEach(panel => {
    panel.classList.toggle("active", panel.id === `tab-${tabId}`);
  });

  // 스크롤 상단 이동
  window.scrollTo({ top: 0, behavior: "smooth" });

  // 탭별 추가 업데이트
  if (tabId === "planner") {
    renderPlannerUI();
  }
}

// ==========================================
// 2. 홈 & 고교학점제 안내 탭 렌더링
// ==========================================
function renderGuideTab() {
  // 1) 3대 운영 원리
  const principlesContainer = document.getElementById("core-principles-container");
  if (principlesContainer) {
    principlesContainer.innerHTML = CREDIT_SYSTEM_INFO.corePrinciples.map((p, idx) => {
      const icons = ["🎯", "🗺️", "🤝"];
      return `
        <div class="guide-box">
          <div class="guide-icon-title">
            <div class="guide-icon">${icons[idx] || "⭐"}</div>
            <div>
              <h3>${p.title}</h3>
            </div>
          </div>
          <p>${p.desc}</p>
        </div>
      `;
    }).join("");
  }

  // 2) 과거 vs 고교학점제 학교 비교
  const compareContainer = document.getElementById("system-compare-container");
  if (compareContainer) {
    compareContainer.innerHTML = CREDIT_SYSTEM_INFO.systemChanges.map(change => `
      <div class="compare-card">
        <span class="area-badge">${change.area}</span>
        <div class="compare-row past">
          <span class="tag">과거의 학교</span>
          <div class="text">${change.past}</div>
        </div>
        <div class="compare-row credit">
          <span class="tag">고교학점제 학교 ('25년~)</span>
          <div class="text">${change.credit}</div>
        </div>
      </div>
    `).join("");
  }

  // 3) 필수 이수학점 테이블
  const creditsTbody = document.getElementById("required-credits-tbody");
  if (creditsTbody) {
    creditsTbody.innerHTML = CREDIT_SYSTEM_INFO.creditRules.requiredCredits.map(item => `
      <tr>
        <td><strong>${item.category}</strong></td>
        <td><span class="badge badge-blue">${item.credits} 학점</span></td>
        <td style="color: #64748b; font-size: 0.84rem;">${item.subjects}</td>
      </tr>
    `).join("") + `
      <tr style="background: #f0f9ff; font-weight: 800;">
        <td style="color: #0369a1;">소계 (필수)</td>
        <td><span class="badge badge-blue">84 학점</span></td>
        <td style="color: #0369a1;">+ 자율 이수 90학점 = 교과 총 174학점</td>
      </tr>
    `;
  }

  // 4) 학기별 로드맵 타임라인
  const roadmapContainer = document.getElementById("roadmap-timeline-container");
  if (roadmapContainer) {
    roadmapContainer.innerHTML = CREDIT_SYSTEM_INFO.roadmapSteps.map(step => `
      <div class="roadmap-card">
        <div class="roadmap-header">
          <div class="roadmap-period">${step.period}</div>
          <span class="roadmap-stage">${step.stage}</span>
        </div>
        <ul class="roadmap-tasks">
          ${step.tasks.map(task => `<li>${task}</li>`).join("")}
        </ul>
      </div>
    `).join("");
  }
}

// ==========================================
// 3. 교과목 탐색기 탭 렌더링 & 필터링
// ==========================================
function setCourseCategory(category) {
  currentCourseCategory = category;
  document.querySelectorAll("[data-cat]").forEach(btn => {
    btn.classList.toggle("active", btn.dataset.cat === category);
  });
  filterCourses();
}

function setCourseType(type) {
  currentCourseType = type;
  document.querySelectorAll("[data-type]").forEach(btn => {
    btn.classList.toggle("active", btn.dataset.type === type);
  });
  filterCourses();
}

function filterCourses() {
  const query = (document.getElementById("course-search-input")?.value || "").trim().toLowerCase();
  const container = document.getElementById("courses-grid-container");
  const countBadge = document.getElementById("courses-count-badge");
  if (!container) return;

  const filtered = COURSES_DATA.filter(c => {
    let matchCategory = false;
    if (currentCourseCategory === "all") {
      matchCategory = true;
    } else if (currentCourseCategory === "국어") {
      matchCategory = (c.category === "국어"); // 제2외국어/한문 절대 미포함
    } else if (currentCourseCategory === "사회") {
      matchCategory = (c.category === "사회" || c.category === "국제");
    } else {
      matchCategory = (c.category === currentCourseCategory);
    }
    const matchType = (currentCourseType === "all") || (c.type === currentCourseType);
    
    let matchQuery = true;
    if (query) {
      const inName = c.name.toLowerCase().includes(query);
      const inSummary = c.summary.toLowerCase().includes(query);
      const inDepts = c.relatedDepts.some(d => d.toLowerCase().includes(query));
      const inJobs = c.relatedJobs.some(j => j.toLowerCase().includes(query));
      const inTopics = c.contentTopics.some(t => t.toLowerCase().includes(query));
      matchQuery = inName || inSummary || inDepts || inJobs || inTopics;
    }

    return matchCategory && matchType && matchQuery;
  });

  if (countBadge) countBadge.textContent = `총 ${filtered.length}개 과목`;

  if (filtered.length === 0) {
    container.innerHTML = `
      <div style="grid-column: 1 / -1; text-align: center; padding: 60px 20px; color: #94a3b8;">
        <div style="font-size: 3rem; margin-bottom: 12px;">🔍</div>
        <h4 style="font-size: 1.1rem; color: #475569; margin-bottom: 6px;">일치하는 과목을 찾지 못했습니다.</h4>
        <p style="font-size: 0.9rem;">검색어나 필터 조건을 변경하여 다시 검색해보세요.</p>
      </div>
    `;
    return;
  }

  container.innerHTML = filtered.map(course => {
    const isPlanned = isSubjectPlanned(course.id);
    return `
      <div class="course-card" onclick="showCourseModal('${course.id}')">
        <div>
          <div class="course-card-top">
            <span class="course-category-tag ${getCategoryBadgeClass(course.category)}">${course.category}</span>
            <span class="course-type-badge">${course.type}</span>
          </div>
          <h3 class="course-name" style="margin-top: 10px;">${course.name}</h3>
          <p class="course-summary" style="margin-top: 8px;">${course.summary}</p>
        </div>

        <div>
          <div style="display: flex; gap: 6px; flex-wrap: wrap; margin-bottom: 8px;">
            <span class="badge badge-gray" style="font-size: 0.72rem;">${course.evalInfo}</span>
            ${course.suNung.includes("2028 수능") ? `<span class="badge badge-pink" style="font-size: 0.72rem;">수능 출제</span>` : ""}
          </div>
          <div class="course-footer-info" onclick="event.stopPropagation()">
            <div class="credit-badge">
              <span>⏱</span> ${course.credits}학점
            </div>
            <button class="add-plan-btn ${isPlanned ? "in-planner" : ""}" onclick="handleQuickAdd('${course.id}')">
              ${isPlanned ? "✓ 담김" : "+ 플래너 담기"}
            </button>
          </div>
        </div>
      </div>
    `;
  }).join("");
}

function renderCoursesTab() {
  filterCourses();
}

function handleQuickAdd(courseId) {
  quickAddToPlanner(courseId);
  filterCourses(); // 담김 상태 갱신
}

// ==========================================
// 4. 계열 및 학과별 로드맵 렌더링 & 필터링
// ==========================================
function setMajorDivision(division) {
  currentMajorDivision = division;
  document.querySelectorAll("[data-div]").forEach(btn => {
    btn.classList.toggle("active", btn.dataset.div === division);
  });
  filterMajors();
}

function filterMajors() {
  const query = (document.getElementById("major-search-input")?.value || "").trim().toLowerCase();
  const container = document.getElementById("majors-list-container");
  if (!container) return;

  const filtered = MAJORS_DATA.filter(m => {
    const matchDiv = (currentMajorDivision === "all") || (m.division === currentMajorDivision);
    let matchQuery = true;
    if (query) {
      const inName = m.name.toLowerCase().includes(query);
      const inOverview = m.overview.toLowerCase().includes(query);
      const inCareers = m.careers.some(c => c.toLowerCase().includes(query));
      matchQuery = inName || inOverview || inCareers;
    }
    return matchDiv && matchQuery;
  });

  if (filtered.length === 0) {
    container.innerHTML = `
      <div style="text-align: center; padding: 60px 20px; color: #94a3b8;">
        <div style="font-size: 3rem; margin-bottom: 12px;">🏫</div>
        <h4 style="font-size: 1.1rem; color: #475569; margin-bottom: 6px;">일치하는 학과를 찾지 못했습니다.</h4>
        <p style="font-size: 0.9rem;">학과 명칭이나 진로 키워드를 다시 입력해 보세요.</p>
      </div>
    `;
    return;
  }

  container.innerHTML = filtered.map(major => `
    <div class="major-card">
      <div class="major-header">
        <div class="major-title-group">
          <h3>
            <span style="display:inline-block; width: 12px; height: 12px; border-radius: 50%; background: ${major.badgeColor};"></span>
            ${major.name}
          </h3>
          <p>${major.division} · ${major.subDivision}</p>
        </div>
        <div style="display: flex; gap: 6px;">
          ${major.careers.slice(0, 3).map(c => `<span class="badge badge-gray">${c}</span>`).join("")}
        </div>
      </div>

      <div class="major-overview">
        ${major.overview}
      </div>

      <!-- 멘토 조언 말풍선 -->
      <div class="mentor-bubble">
        <div class="mentor-avatar">💡</div>
        <div class="mentor-text">
          <h5>전공 멘토의 한마디</h5>
          <p>${major.mentorTip}</p>
        </div>
      </div>

      <!-- 고교 권장 선택 과목 -->
      <div class="rec-subject-section">
        <h4 style="font-size: 0.95rem; font-weight: 800; color: #0f172a; margin-bottom: 4px;">
          📌 고등학교 권장 선택 과목 (2022 개정 교육과정 기준)
        </h4>

        <!-- 일반선택 -->
        <div class="rec-subject-row">
          <span class="rec-type-label general">일반 선택</span>
          <div class="subject-tag-list">
            ${major.recSubjects.general.map(subName => {
              const matchedCourse = COURSES_DATA.find(c => c.name === subName);
              const clickAction = matchedCourse ? `onclick="showCourseModal('${matchedCourse.id}')"` : "";
              return `<span class="subject-tag-item" ${clickAction} title="과목 상세 보기">📖 ${subName}</span>`;
            }).join("")}
          </div>
        </div>

        <!-- 진로선택 -->
        <div class="rec-subject-row">
          <span class="rec-type-label career">진로 선택</span>
          <div class="subject-tag-list">
            ${major.recSubjects.career.map(subName => {
              const matchedCourse = COURSES_DATA.find(c => c.name === subName);
              const clickAction = matchedCourse ? `onclick="showCourseModal('${matchedCourse.id}')"` : "";
              return `<span class="subject-tag-item" ${clickAction} title="과목 상세 보기">🎯 ${subName}</span>`;
            }).join("")}
          </div>
        </div>

        <!-- 융합선택 -->
        <div class="rec-subject-row">
          <span class="rec-type-label fusion">융합 선택</span>
          <div class="subject-tag-list">
            ${major.recSubjects.fusion.map(subName => {
              const matchedCourse = COURSES_DATA.find(c => c.name === subName);
              const clickAction = matchedCourse ? `onclick="showCourseModal('${matchedCourse.id}')"` : "";
              return `<span class="subject-tag-item" ${clickAction} title="과목 상세 보기">🔬 ${subName}</span>`;
            }).join("")}
          </div>
        </div>
      </div>

      <!-- 추천 도서 -->
      <div style="border-top: 1px dashed var(--border-light); padding-top: 14px;">
        <h4 style="font-size: 0.88rem; font-weight: 700; color: #475569; margin-bottom: 6px;">
          📚 학과 추천 도서
        </h4>
        <div class="books-list">
          ${major.recommendedBooks.map(book => `
            <div class="book-pill">
              <span class="title">『${book.title}』</span>
              <span class="author">(${book.author})</span>
            </div>
          `).join("")}
        </div>
      </div>
    </div>
  `).join("");
}

function renderMajorsTab() {
  filterMajors();

  // 서울대 권장과목 테이블
  const snuTbody = document.getElementById("snu-recommended-tbody");
  if (snuTbody) {
    snuTbody.innerHTML = SEOUL_UNIV_RECOMMENDED.map(item => `
      <tr>
        <td><strong>${item.college}</strong></td>
        <td>${item.dept}</td>
        <td><span style="color: #dc2626; font-weight: 700;">${item.core}</span></td>
        <td style="color: #0369a1; font-weight: 600;">${item.recommended}</td>
      </tr>
    `).join("");
  }
}

// ==========================================
// 5. 부천 공동교육과정 렌더링
// ==========================================
function renderBucheonTab() {
  // 오프라인 거점형
  const offlineTbody = document.getElementById("bucheon-offline-tbody");
  if (offlineTbody) {
    offlineTbody.innerHTML = BUCHEON_PROGRAMS.offline.map(item => `
      <tr>
        <td><strong>${item.course}</strong></td>
        <td><span class="badge badge-blue">🏫 ${item.school}</span></td>
        <td>${item.credit}학점</td>
        <td><span class="badge badge-gray">${item.grade}</span></td>
      </tr>
    `).join("");
  }

  // 온라인 거점형
  const onlineTbody = document.getElementById("bucheon-online-tbody");
  if (onlineTbody) {
    onlineTbody.innerHTML = BUCHEON_PROGRAMS.online.map(item => `
      <tr>
        <td><strong>${item.course}</strong></td>
        <td><span class="badge badge-purple">💻 ${item.school}</span></td>
        <td>${item.credit}학점</td>
        <td><span class="badge badge-gray">${item.grade}</span></td>
      </tr>
    `).join("");
  }
}

// ==========================================
// 6. 모달 팝업 제어
// ==========================================
function showCourseModal(courseId) {
  const course = COURSES_DATA.find(c => c.id === courseId);
  if (!course) return;

  const modalBadges = document.getElementById("modal-badges");
  const modalName = document.getElementById("modal-course-name");
  const modalBody = document.getElementById("modal-course-body");

  if (modalBadges) {
    modalBadges.innerHTML = `
      <span class="badge ${getCategoryBadgeClass(course.category)}">${course.category}</span>
      <span class="badge badge-gray">${course.type}</span>
      <span class="badge badge-blue">${course.creditRange}</span>
      ${course.suNung.includes("2028") ? `<span class="badge badge-pink">2028 수능</span>` : ""}
    `;
  }

  if (modalName) modalName.textContent = course.name;

  if (modalBody) {
    const isPlanned = isSubjectPlanned(course.id);
    modalBody.innerHTML = `
      <div style="display: flex; flex-direction: column; gap: 20px;">
        <div style="background: #f8fafc; padding: 18px; border-radius: 14px; border: 1.5px solid #bae6fd; font-size: 0.95rem; line-height: 1.7; color: #1e293b;">
          <div style="display: flex; align-items: center; gap: 6px; font-size: 0.82rem; font-weight: 800; color: #0284c7; margin-bottom: 8px;">
            <span>📋</span> 과목 소개 (부천교육지원청 '2026 과목선택 나침반' 원문)
          </div>
          <div style="letter-spacing: -0.01em; font-weight: 500;">
            ${course.summary}
          </div>
        </div>

        <!-- 평가 정보 & 수능 정보 -->
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
          <div style="background: #f0f9ff; padding: 12px 16px; border-radius: 12px; border: 1px solid #bae6fd;">
            <div style="font-size: 0.78rem; font-weight: 700; color: #0284c7;">성적 평가 방식</div>
            <div style="font-size: 0.92rem; font-weight: 800; color: #0369a1; margin-top: 2px;">${course.evalInfo}</div>
          </div>
          <div style="background: #fdf2f8; padding: 12px 16px; border-radius: 12px; border: 1px solid #fbcfe8;">
            <div style="font-size: 0.78rem; font-weight: 700; color: #db2777;">2028 대입 수능 관련</div>
            <div style="font-size: 0.92rem; font-weight: 800; color: #9d174d; margin-top: 2px;">${course.suNung}</div>
          </div>
        </div>

        <!-- 핵심 아이디어 -->
        <div>
          <h4 style="font-size: 1rem; font-weight: 800; color: #0f172a; margin-bottom: 8px;">💡 핵심 아이디어</h4>
          <ul style="list-style: none; display: flex; flex-direction: column; gap: 6px; font-size: 0.88rem; color: #475569;">
            ${course.keyIdeas.map(idea => `<li style="display: flex; gap: 8px; line-height: 1.5;"><span style="color: #0284c7;">•</span>${idea}</li>`).join("")}
          </ul>
        </div>

        <!-- 주요 학습 내용 체계 -->
        <div>
          <h4 style="font-size: 1rem; font-weight: 800; color: #0f172a; margin-bottom: 8px;">📖 주요 학습 내용 요소</h4>
          <div style="display: flex; flex-wrap: wrap; gap: 6px;">
            ${course.contentTopics.map(topic => `<span class="badge badge-gray" style="font-size: 0.8rem; padding: 5px 10px;">${topic}</span>`).join("")}
          </div>
        </div>

        <!-- 관련 학과 및 관련 직업 -->
        <div style="border-top: 1px dashed var(--border-light); padding-top: 16px; display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
          <div>
            <h5 style="font-size: 0.82rem; font-weight: 800; color: #64748b; margin-bottom: 4px;">관련 학과</h5>
            <p style="font-size: 0.85rem; color: #334155;">${course.relatedDepts.join(", ")}</p>
          </div>
          <div>
            <h5 style="font-size: 0.82rem; font-weight: 800; color: #64748b; margin-bottom: 4px;">관련 직업</h5>
            <p style="font-size: 0.85rem; color: #334155;">${course.relatedJobs.join(", ")}</p>
          </div>
        </div>

        <!-- 액션 버튼 -->
        <div style="display: flex; justify-content: flex-end; gap: 10px; margin-top: 10px;">
          <button class="btn btn-outline" onclick="closeModal('course-modal')">닫기</button>
          <button class="btn btn-primary" onclick="handleModalAddToPlan('${course.id}')">
            ${isPlanned ? "✓ 이미 플래너에 담김" : "➕ 내 플래너에 담기"}
          </button>
        </div>
      </div>
    `;
  }

  openModal("course-modal");
}

function handleModalAddToPlan(courseId) {
  quickAddToPlanner(courseId);
  closeModal("course-modal");
  filterCourses();
}

function openModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.classList.add("open");
    document.body.style.overflow = "hidden";
  }
}

function closeModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.classList.remove("open");
    document.body.style.overflow = "";
  }
}

function closeModalOnBackdrop(event, modalId) {
  if (event.target.id === modalId) {
    closeModal(modalId);
  }
}

// ==========================================
// 7. 유틸리티 함수
// ==========================================
function getCategoryBadgeClass(category) {
  switch (category) {
    case "국어": return "category-kor";
    case "수학": return "category-math";
    case "영어": return "category-eng";
    case "사회": return "category-soc";
    case "과학": return "category-sci";
    case "체육": return "category-pe";
    case "예술": return "category-art";
    case "기술·가정/정보": return "category-tech";
    case "제2외국어/한문": return "category-lang";
    case "교양": return "category-gen";
    default: return "badge-gray";
  }
}

function showToast(message) {
  const container = document.getElementById("toast-container");
  if (!container) return;

  const toast = document.createElement("div");
  toast.className = "toast";
  toast.innerHTML = `<span>✨</span><span>${message}</span>`;
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = "0";
    toast.style.transform = "translateY(10px)";
    toast.style.transition = "all 0.3s ease";
    setTimeout(() => toast.remove(), 300);
  }, 2600);
}
