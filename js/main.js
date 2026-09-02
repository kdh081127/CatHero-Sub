// 탭 전환 로직
function switchTab(tabId) {
    // 모든 컨텐츠 숨기기
    document.querySelectorAll('.tab-content').forEach(el => el.classList.add('hidden'));

    // 모든 버튼의 활성화(active) 클래스 제거
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });

    // 선택한 탭 보이기
    const targetContent = document.getElementById(tabId);
    if (targetContent) {
        targetContent.classList.remove('hidden');
    }

    // 선택한 버튼 활성화
    const activeBtn = document.getElementById('btn-' + tabId);
    if (activeBtn) {
        activeBtn.classList.add('active');
    }
}

// 프리셋 모달 열기/닫기
function togglePresetModal(show) {
    const modal = document.getElementById('preset-modal');
    if (!modal) return;

    if (show) {
        modal.classList.remove('hidden');
    } else {
        modal.classList.add('hidden');
    }
}
/**
 * 상단 메인 GNB 뷰 전환 함수 (계산기 <-> 룬 도감)
 * @param {string} viewName - 'calculator' 또는 'runes'
 */
function switchMainView(viewName) {
    // 1. 계산기 뷰 / 룬 도감 뷰 토글
    const calcView = document.getElementById('view-calculator');
    const runeView = document.getElementById('view-runes');
    const sidebar = document.querySelector('.sidebar');

    if (viewName === 'calculator') {
        if (calcView) calcView.classList.remove('hidden');
        if (runeView) runeView.classList.add('hidden');
        if (sidebar) sidebar.style.display = 'flex'; // 계산기 사이드바 표시
    } else if (viewName === 'runes') {
        if (calcView) calcView.classList.add('hidden');
        if (runeView) runeView.classList.remove('hidden');
        if (sidebar) sidebar.style.display = 'none'; // 도감에서는 사이드바 숨김
    }

    // 2. GNB 상단 버튼 활성화 스타일 전환
    document.querySelectorAll('.info-nav-btn').forEach(btn => btn.classList.remove('active'));
    const activeGnb = document.getElementById('gnb-' + viewName);
    if (activeGnb) activeGnb.classList.add('active');
}