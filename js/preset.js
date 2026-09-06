/**
 * LocalStorage 연동 프리셋 관리 모듈
 */
const PRESET_STORAGE_KEY = 'cathero_presets';

// 1. 저장된 프리셋 목록 불러오기
function getStoredPresets() {
    const data = localStorage.getItem(PRESET_STORAGE_KEY);
    return data ? JSON.parse(data) : {};
}

// 2. 화면 UI (셀렉트 박스 & 모달 목록) 갱신
function renderPresetUI() {
    const presets = getStoredPresets();
    const quickSelect = document.getElementById('preset-quick-select');
    const modalList = document.getElementById('preset-modal-list');

    if (quickSelect) quickSelect.innerHTML = '';
    if (modalList) modalList.innerHTML = '';

    const presetKeys = Object.keys(presets);

    if (presetKeys.length === 0) {
        if (quickSelect) quickSelect.innerHTML = `<option value="">저장된 프리셋 없음</option>`;
        if (modalList) modalList.innerHTML = `<div style="text-align:center; padding:1rem; color:#94a3b8; font-size:0.875rem;">저장된 프리셋이 없습니다.</div>`;
        return;
    }

    presetKeys.forEach(id => {
        const item = presets[id];

        // 헤더 퀵 선택 드롭다운에 추가
        if (quickSelect) {
            const option = document.createElement('option');
            option.value = id;
            option.innerText = item.name;
            quickSelect.appendChild(option);
        }

        // 모달 관리 목록에 추가
        if (modalList) {
            const div = document.createElement('div');
            div.className = 'preset-item';
            div.innerHTML = `
        <div class="preset-item-info">
          <span class="preset-item-name">${item.name}</span>
          <span class="preset-item-date">수정일: ${item.date}</span>
        </div>
        <div style="display:flex; gap:0.25rem;">
          <button class="btn-preset-action btn-preset-save" onclick="applyPreset('${id}')">불러오기</button>
          <button class="btn-preset-action btn-preset-manage" style="color:#ef4444;" onclick="deletePreset('${id}')">삭제</button>
        </div>
      `;
            modalList.appendChild(div);
        }
    });
}

// 3-1. 모달의 입력창(#preset-new-name) 값으로 새 프리셋 추가
function createNewPresetFromInput() {
    const input = document.getElementById('preset-new-name');
    const presetName = input ? input.value.trim() : '';
    if (!presetName) {
        alert('프리셋 이름을 입력해주세요.');
        return;
    }

    const presets = getStoredPresets();
    const id = 'preset_' + Date.now();
    const currentDate = new Date().toISOString().slice(0, 10);

    presets[id] = {
        name: presetName,
        date: currentDate,
        data: typeof userState !== 'undefined' ? JSON.parse(JSON.stringify(userState)) : {}
    };

    localStorage.setItem(PRESET_STORAGE_KEY, JSON.stringify(presets));
    renderPresetUI();
    if (input) input.value = '';
    alert(`'${presetName}' 프리셋이 생성되었습니다.`);
}

// 3. 새 프리셋 추가 함수
function createNewPreset() {
    const presetName = prompt("새 프리셋 이름을 입력하세요:", "격전지 전용 세팅");
    if (!presetName || !presetName.trim()) return;

    const presets = getStoredPresets();
    const id = 'preset_' + Date.now();
    const currentDate = new Date().toISOString().slice(0, 10);

    // 현재 입력 상태값(userState) 저장 (state.js 객체 참조)
    presets[id] = {
        name: presetName.trim(),
        date: currentDate,
        data: typeof userState !== 'undefined' ? JSON.parse(JSON.stringify(userState)) : {}
    };

    localStorage.setItem(PRESET_STORAGE_KEY, JSON.stringify(presets));
    renderPresetUI();
    alert(`'${presetName}' 프리셋이 생성되었습니다.`);
}

// 4. 선택한 프리셋 불러오기
function applyPreset(id) {
    const presets = getStoredPresets();
    if (!presets[id]) return;

    if (typeof userState !== 'undefined') {
        Object.assign(userState, presets[id].data);
        // 프리셋에 저장된 슬롯 배열 길이가 예전 버전이라 다를 수 있으니 안전하게 정규화
        if (typeof normalizeSlots === 'function') {
            if (Array.isArray(userState.equippedMainRunes)) userState.equippedMainRunes = normalizeSlots(userState.equippedMainRunes, 4);
            if (Array.isArray(userState.equippedSubRunes)) userState.equippedSubRunes = normalizeSlots(userState.equippedSubRunes, 6);
        }
        saveUserState();
        // 룬 장착 슬롯 등 UI 갱신
        if (typeof renderEquipSlots === 'function') renderEquipSlots();
    }

    const quickSelect = document.getElementById('preset-quick-select');
    if (quickSelect) quickSelect.value = id;

    alert(`'${presets[id].name}' 프리셋을 불러왔습니다.`);
    togglePresetModal(false);
}

// 5. 현재 프리셋 덮어쓰기 저장
function saveCurrentPreset() {
    const quickSelect = document.getElementById('preset-quick-select');
    const selectedId = quickSelect ? quickSelect.value : null;

    if (!selectedId) {
        createNewPreset();
        return;
    }

    const presets = getStoredPresets();
    if (presets[selectedId]) {
        presets[selectedId].date = new Date().toISOString().slice(0, 10);
        presets[selectedId].data = typeof userState !== 'undefined' ? JSON.parse(JSON.stringify(userState)) : {};

        localStorage.setItem(PRESET_STORAGE_KEY, JSON.stringify(presets));
        renderPresetUI();
        alert(`'${presets[selectedId].name}'에 현재 세팅이 덮어씌워졌습니다.`);
    }
}

// 6. 프리셋 삭제
function deletePreset(id) {
    const presets = getStoredPresets();
    if (!presets[id]) return;

    if (confirm(`'${presets[id].name}' 프리셋을 삭제하시겠습니까?`)) {
        delete presets[id];
        localStorage.setItem(PRESET_STORAGE_KEY, JSON.stringify(presets));
        renderPresetUI();
    }
}

// 앱 실행 시 초기 목록 동기화
document.addEventListener('DOMContentLoaded', () => {
    renderPresetUI();
});