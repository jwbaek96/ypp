const DASHBOARD_APPS_SCRIPT_ID = 'AKfycbxrBjwJRbcaOWXk3Vrnv8GySyiSfeYSKLLzYvZxmHmsZ_AqUZwxDKMmOW53lRXliQgdRg';
const DASHBOARD_APPS_SCRIPT_URL = `https://script.google.com/macros/s/${DASHBOARD_APPS_SCRIPT_ID}/exec`;

// 원자력 데이터 관리 클래스
class NuclearDataManager {
    constructor() {
        this.nuclearData = null;
        this.isLoading = false;
    }
    
    // Apps Script에서 원자력 데이터 로드
    async loadNuclearData() {
        if (this.isLoading) return;
        this.isLoading = true;
        
        try {
            console.log('📊 원자력 데이터 로딩 시작...');
            const url = `${DASHBOARD_APPS_SCRIPT_URL}?sheet=nuclear&action=getData`;
            
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const result = await response.json();
            console.log('📋 원자력 API 응답:', result);
            
            if (!result.success) {
                throw new Error(result.error || 'API 요청 실패');
            }
            
            this.nuclearData = result.data;
            console.log(`✅ 원자력 데이터 ${this.nuclearData.data.length}개 로드 완료`);
            
            // 원자력 테이블 렌더링
            this.renderNuclearTables();
            
            return true;
            
        } catch (error) {
            console.error('💥 원자력 데이터 로드 실패:', error);
            this.showErrorMessage();
            return false;
        } finally {
            this.isLoading = false;
        }
    }
    
    // 원자력 테이블들 렌더링
    renderNuclearTables() {
        try {
            if (!this.nuclearData || !this.nuclearData.data) {
                console.error('🚫 원자력 데이터가 없습니다');
                return;
            }
            
            console.log(`📋 원자력 데이터 ${this.nuclearData.data.length}개 렌더링 시작`);
            
            // 각 테이블 렌더링
            this.renderSupplyPerformanceTables();
            this.renderQualifiedSupplierTables();
            
            console.log('✅ 원자력 테이블 렌더링 완료');
            
            // 현재 언어로 업데이트
            const currentLanguage = localStorage.getItem('selectedLanguage') || 'ko';
            this.updateLanguage(currentLanguage);
            
        } catch (error) {
            console.error('💥 원자력 테이블 렌더링 실패:', error);
        }
    }
    
    // 공급실적 테이블들 렌더링
    renderSupplyPerformanceTables() {
        // 전기 분야 테이블
        this.renderTableSection('.cgid-supply-records .cgid-supply-table-block:nth-child(1) tbody', 'electrical');
        // 계측·제어 분야 테이블
        this.renderTableSection('.cgid-supply-records .cgid-supply-table-block:nth-child(2) tbody', 'instrumentation');
        // CGID 분야 테이블
        this.renderTableSection('.cgid-supply-records .cgid-supply-table-block:nth-child(3) tbody', 'cgid');
        // 해외 원전 분야 테이블
        this.renderTableSection('.cgid-supply-records .cgid-supply-table-block:nth-child(4) tbody', 'overseas');
    }
    
    // 공급사 유자격 테이블들 렌더링
    renderQualifiedSupplierTables() {
        // 제어 분야 테이블 (첫 번째 cgid-supply-table-block)
        this.renderQualifiedSection('.nuclear-table-control', 'control');
        // 전기 분야 테이블 (두 번째 cgid-supply-qualify-group 안의 cgid-supply-table-block)
        this.renderQualifiedSection('.nuclear-table-electrical_qualified', 'electrical_qualified');
        // 시험·기기수리·전문정비 및 예비품 테이블 (세 번째 cgid-supply-qualify-group)
        this.renderQualifiedSection('.nuclear-table-testing', 'testing');
        // CGID 테이블 (네 번째 cgid-supply-qualify-group)
        this.renderQualifiedSection('.nuclear-table-cgid_qualified', 'cgid_qualified');
        // 설계 유자격 테이블 (다섯 번째 cgid-supply-qualify-group)
        this.renderQualifiedSection('.nuclear-table-design', 'design');
    }
    
    // 개별 테이블 섹션 렌더링 (공급실적용)
    renderTableSection(selector, type) {
        try {
            const tableBody = document.querySelector(selector);
            if (!tableBody) {
                console.warn(`🚫 테이블 요소를 찾을 수 없습니다: ${selector}`);
                return;
            }
            
            // 기존 동적 데이터 제거 (data-dynamic 속성이 있는 행만)
            const existingRows = tableBody.querySelectorAll('tr[data-dynamic="true"]');
            existingRows.forEach(row => row.remove());
            
            // 데이터 타입에 따른 필드 매핑
            const fieldMapping = {
                electrical: { year: 'year1', textKR: 'textKR1', textEN: 'textEN1' },
                instrumentation: { year: 'year2', textKR: 'textKR2', textEN: 'textEN2' },
                cgid: { year: 'year3', textKR: 'textKR3', textEN: 'textEN3' },
                overseas: { year: 'year4', textKR: 'textKR4', textEN: 'textEN4' }
            };
            
            const fields = fieldMapping[type];
            if (!fields) {
                console.warn(`🚫 알 수 없는 테이블 타입: ${type}`);
                return;
            }
            
            // 데이터 행 추가
            this.nuclearData.data.forEach((item, index) => {
                const year = item[fields.year];
                const textKR = item[fields.textKR];
                const textEN = item[fields.textEN];
                
                // 빈 데이터는 스킵
                if (!year && !textKR && !textEN) return;
                
                const row = this.createSupplyTableRow(year, textKR, textEN, type);
                if (row) {
                    row.setAttribute('data-dynamic', 'true');
                    tableBody.appendChild(row);
                }
            });
            
        } catch (error) {
            console.error(`💥 테이블 섹션 렌더링 실패 (${type}):`, error);
        }
    }
    
    // 공급사 유자격 테이블 섹션 렌더링
    renderQualifiedSection(selector, type) {
        try {
            const tableBody = document.querySelector(selector);
            if (!tableBody) {
                console.warn(`🚫 테이블 요소를 찾을 수 없습니다: ${selector}`);
                return;
            }
            
            // 기존 동적 데이터 제거
            const existingRows = tableBody.querySelectorAll('tr[data-dynamic="true"]');
            existingRows.forEach(row => row.remove());
            
            // 데이터 타입에 따른 필드 매핑
            const fieldMapping = {
                control: { textKR: 'textKR5', textEN: 'textEN5' },
                electrical_qualified: { textKR: 'textKR6', textEN: 'textEN6' },
                testing: { textKR: 'textKR7', textEN: 'textEN7' },
                cgid_qualified: { textKR: 'textKR8', textEN: 'textEN8' },
                design: { textKR: 'textKR9', textEN: 'textEN9' }
            };
            
            const fields = fieldMapping[type];
            if (!fields) {
                console.warn(`🚫 알 수 없는 유자격 테이블 타입: ${type}`);
                return;
            }
            
            // 데이터 행 추가
            this.nuclearData.data.forEach((item, index) => {
                const textKR = item[fields.textKR];
                const textEN = item[fields.textEN];
                
                // 빈 데이터는 스킵
                if (!textKR && !textEN) return;
                
                const row = this.createQualifiedTableRow(textKR, textEN);
                if (row) {
                    row.setAttribute('data-dynamic', 'true');
                    tableBody.appendChild(row);
                }
            });
            
        } catch (error) {
            console.error(`💥 유자격 테이블 섹션 렌더링 실패 (${type}):`, error);
        }
    }
    
    // 공급실적 테이블 행 생성 (년도 + 내용)
    createSupplyTableRow(year, textKR, textEN, tableType = null) {
        try {
            const row = document.createElement('tr');
            
            // 년도 컬럼
            const yearCell = document.createElement('td');
            yearCell.textContent = year || '';
            
            // 내용 컬럼
            const contentCell = document.createElement('td');
            
            // 전기분야에서만 "-"을 <br>로 치환
            let processedTextKR = textKR;
            let processedTextEN = textEN;
            let useHTML = false;
            
            if (tableType === 'electrical') {
                if (processedTextKR && processedTextKR.includes('-')) {
                    processedTextKR = processedTextKR.replace(/-/g, '<br>');
                    useHTML = true;
                }
                if (processedTextEN && processedTextEN.includes('-')) {
                    processedTextEN = processedTextEN.replace(/-/g, '<br>');
                    useHTML = true;
                }
            }
            
            // HTML을 사용하지 않는 경우에만 escapeHtml 적용
            if (useHTML) {
                if (processedTextEN) contentCell.setAttribute('data-eng', processedTextEN);
                if (processedTextKR) contentCell.setAttribute('data-kor', processedTextKR);
                contentCell.innerHTML = processedTextKR || processedTextEN || '';
            } else {
                if (textEN) contentCell.setAttribute('data-eng', textEN);
                if (textKR) contentCell.setAttribute('data-kor', textKR);
                contentCell.textContent = textKR || textEN || '';
            }
            
            row.appendChild(yearCell);
            row.appendChild(contentCell);
            
            return row;
            
        } catch (error) {
            console.error('💥 공급실적 테이블 행 생성 실패:', error);
            return null;
        }
    }
    
    // 공급사 유자격 테이블 행 생성 (내용만)
    createQualifiedTableRow(textKR, textEN) {
        try {
            const row = document.createElement('tr');
            
            // 내용 컬럼
            const contentCell = document.createElement('td');
            if (textEN) contentCell.setAttribute('data-eng', textEN);
            if (textKR) contentCell.setAttribute('data-kor', textKR);
            contentCell.textContent = textKR || textEN || '';
            
            row.appendChild(contentCell);
            
            return row;
            
        } catch (error) {
            console.error('💥 유자격 테이블 행 생성 실패:', error);
            return null;
        }
    }
    
    // HTML 이스케이프 함수
    escapeHtml(text) {
        if (typeof text !== 'string') return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
    
    // 언어 업데이트
    updateLanguage(language) {
        try {
            // 모든 동적 생성된 셀에 대해 언어 업데이트
            const dynamicCells = document.querySelectorAll('#nuclear-power .cgid-supply-section tr[data-dynamic="true"] td[data-eng][data-kor]');
            
            dynamicCells.forEach(cell => {
                const engText = cell.getAttribute('data-eng');
                const korText = cell.getAttribute('data-kor');
                
                // 전기분야 테이블인지 확인 (첫 번째 공급실적 테이블)
                const isElectricalTable = cell.closest('.cgid-supply-records .cgid-supply-table-block:nth-child(1)');
                
                let displayText = '';
                if (language === 'en' && engText) {
                    displayText = engText;
                } else if (language === 'ko' && korText) {
                    displayText = korText;
                }
                
                // 전기분야에서만 HTML을 허용하고 처리
                if (isElectricalTable && displayText && displayText.includes('<br>')) {
                    cell.innerHTML = displayText;
                } else {
                    cell.textContent = displayText;
                }
            });
            
            console.log(`🌐 원자력 테이블 언어 업데이트: ${language}`);
            
        } catch (error) {
            console.error('💥 원자력 언어 업데이트 실패:', error);
        }
    }
    
    // 에러 메시지 표시
    showErrorMessage() {
        try {
            // 각 테이블에 에러 메시지 표시
            const tableSelectors = [
                '.cgid-supply-records .cgid-supply-table-block tbody',
                '.cgid-supply-qualify .cgid-supply-table-block tbody'
            ];
            
            tableSelectors.forEach(selector => {
                const tables = document.querySelectorAll(selector);
                tables.forEach(tableBody => {
                    if (tableBody) {
                        const errorRow = document.createElement('tr');
                        errorRow.setAttribute('data-dynamic', 'true');
                        
                        const errorCell = document.createElement('td');
                        errorCell.setAttribute('colspan', '2');
                        errorCell.setAttribute('data-eng', 'Failed to load data. Please try again later.');
                        errorCell.setAttribute('data-kor', '데이터 로드에 실패했습니다. 나중에 다시 시도해주세요.');
                        errorCell.textContent = '데이터 로드에 실패했습니다. 나중에 다시 시도해주세요.';
                        errorCell.style.textAlign = 'center';
                        errorCell.style.color = '#e53e3e';
                        
                        errorRow.appendChild(errorCell);
                        tableBody.appendChild(errorRow);
                    }
                });
            });
            
        } catch (error) {
            console.error('💥 원자력 에러 메시지 표시 실패:', error);
        }
    }
}

// 원자력 데이터 로드 함수
async function loadNuclearData() {
    if (!window.nuclearDataManager) {
        window.nuclearDataManager = new NuclearDataManager();
    }
    
    return await window.nuclearDataManager.loadNuclearData();
}

// 복합화력 데이터 관리 클래스
class ThermalPowerDataManager {
    constructor() {
        this.thermalData = null;
        this.isLoading = false;
    }
    
    // Apps Script에서 복합화력 데이터 로드
    async loadThermalData() {
        if (this.isLoading) return;
        this.isLoading = true;
        
        try {
            console.log('📊 복합화력 데이터 로딩 시작...');
            const url = `${DASHBOARD_APPS_SCRIPT_URL}?sheet=thermal&action=getData`;
            
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const result = await response.json();
            console.log('📋 복합화력 API 응답:', result);
            
            if (!result.success) {
                throw new Error(result.error || 'API 요청 실패');
            }
            
            this.thermalData = result.data;
            console.log(`✅ 복합화력 데이터 ${this.thermalData.data.length}개 로드 완료`);
            
            // 복합화력 테이블 렌더링
            this.renderThermalTable();
            
            return true;
            
        } catch (error) {
            console.error('💥 복합화력 데이터 로드 실패:', error);
            this.showErrorMessage();
            return false;
        } finally {
            this.isLoading = false;
        }
    }
    
    // 복합화력 테이블 렌더링
    renderThermalTable() {
        try {
            const tableBody = document.querySelector('#thermal-power .simple-projects-table tbody');
            if (!tableBody) {
                console.error('🚫 복합화력 테이블 요소를 찾을 수 없습니다');
                return;
            }
            
            if (!this.thermalData || !this.thermalData.data) {
                console.error('🚫 복합화력 데이터가 없습니다');
                return;
            }
            
            // 기존 데이터 행 제거 (헤더는 유지)
            tableBody.innerHTML = '';
            
            console.log(`📋 복합화력 데이터 ${this.thermalData.data.length}개 렌더링 시작`);
            
            // 각 데이터 항목을 테이블 행으로 변환
            this.thermalData.data.forEach((item, index) => {
                const row = this.createThermalTableRow(item, index);
                if (row) {
                    tableBody.appendChild(row);
                }
            });
            
            console.log('✅ 복합화력 테이블 렌더링 완료');
            
            // 현재 언어로 업데이트
            const currentLanguage = localStorage.getItem('selectedLanguage') || 'ko';
            this.updateLanguage(currentLanguage);
            
        } catch (error) {
            console.error('💥 복합화력 테이블 렌더링 실패:', error);
        }
    }
    
    // 복합화력 테이블 행 생성
    createThermalTableRow(item, index) {
        try {
            const row = document.createElement('tr');
            
            // 프로젝트명 컬럼
            const projectCell = document.createElement('td');
            projectCell.setAttribute('data-eng', item.textEN || '');
            projectCell.setAttribute('data-kor', item.textKR || '');
            projectCell.textContent = item.textKR || '';
            
            row.appendChild(projectCell);
            
            return row;
            
        } catch (error) {
            console.error(`💥 복합화력 테이블 행 생성 실패 (index: ${index}):`, error);
            return null;
        }
    }
    
    // HTML 이스케이프 함수
    escapeHtml(text) {
        if (typeof text !== 'string') return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
    
    // 언어 업데이트
    updateLanguage(language) {
        try {
            const tableBody = document.querySelector('#thermal-power .simple-projects-table tbody');
            if (!tableBody) return;
            
            const rows = tableBody.querySelectorAll('tr');
            
            rows.forEach(row => {
                const cells = row.querySelectorAll('td[data-eng][data-kor]');
                cells.forEach(cell => {
                    const engText = cell.getAttribute('data-eng');
                    const korText = cell.getAttribute('data-kor');
                    
                    if (language === 'en' && engText) {
                        cell.textContent = engText;
                    } else if (language === 'ko' && korText) {
                        cell.textContent = korText;
                    }
                });
            });
            
            console.log(`🌐 복합화력 테이블 언어 업데이트: ${language}`);
            
        } catch (error) {
            console.error('💥 복합화력 언어 업데이트 실패:', error);
        }
    }
    
    // 에러 메시지 표시
    showErrorMessage() {
        try {
            const tableBody = document.querySelector('#thermal-power .simple-projects-table tbody');
            if (tableBody) {
                tableBody.innerHTML = `
                    <tr>
                        <td data-eng="Failed to load data. Please try again later." 
                            data-kor="데이터 로드에 실패했습니다. 나중에 다시 시도해주세요.">
                            데이터 로드에 실패했습니다. 나중에 다시 시도해주세요.
                        </td>
                    </tr>
                `;
            }
        } catch (error) {
            console.error('💥 복합화력 에러 메시지 표시 실패:', error);
        }
    }
}

// 복합화력 데이터 로드 함수
async function loadThermalData() {
    if (!window.thermalDataManager) {
        window.thermalDataManager = new ThermalPowerDataManager();
    }
    
    return await window.thermalDataManager.loadThermalData();
}

// 변전소 데이터 관리 클래스
class SubstationDataManager {
    constructor() {
        this.substationData = null;
        this.isLoading = false;
    }
    
    // Apps Script에서 변전소 데이터 로드
    async loadSubstationData() {
        if (this.isLoading) return;
        this.isLoading = true;
        
        try {
            console.log('📊 변전소 데이터 로딩 시작...');
            const url = `${DASHBOARD_APPS_SCRIPT_URL}?sheet=substation&action=getData`;
            
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const result = await response.json();
            console.log('📋 변전소 API 응답:', result);
            
            if (!result.success) {
                throw new Error(result.error || 'API 요청 실패');
            }
            
            this.substationData = result.data;
            console.log(`✅ 변전소 데이터 ${this.substationData.data.length}개 로드 완료`);
            
            // 변전소 테이블 렌더링
            this.renderSubstationTable();
            
            return true;
            
        } catch (error) {
            console.error('💥 변전소 데이터 로드 실패:', error);
            this.showErrorMessage();
            return false;
        } finally {
            this.isLoading = false;
        }
    }
    
    // 변전소 테이블 렌더링
    renderSubstationTable() {
        if (!this.substationData || !this.substationData.data || this.substationData.data.length === 0) {
            console.warn('변전소 데이터가 없습니다.');
            return;
        }
        
        // 테이블 요소 찾기
        const tableElement = document.querySelector('#substation .substation-project-table');
        if (!tableElement) {
            console.error('변전소 테이블 요소를 찾을 수 없습니다.');
            return;
        }
        
        // 기존 tbody 내용 제거 (헤더는 유지)
        const tbody = tableElement.querySelector('tbody');
        if (tbody) {
            tbody.innerHTML = '';
        } else {
            console.error('변전소 테이블의 tbody를 찾을 수 없습니다.');
            return;
        }
        
        console.log(`변전소 데이터 ${this.substationData.data.length}개 행 렌더링 시작`);
        
        // 현재 언어 상태 확인
        const currentLanguage = localStorage.getItem('selectedLanguage') || 'ko';
        
        // 데이터 행 생성
        this.substationData.data.forEach((item, index) => {
            const row = this.createSubstationTableRow(item, currentLanguage);
            tbody.appendChild(row);
        });
        
        console.log('✅ 변전소 테이블 렌더링 완료');
    }
    
    // 변전소 테이블 행 생성
    createSubstationTableRow(item, language) {
        const row = document.createElement('tr');
        row.setAttribute('data-id', item.id || '');
        
        // 언어에 따른 데이터 선택
        const isKorean = language === 'ko' || language === 'kr';
        
        const type = isKorean ? (item.typeKR || '') : (item.typeEN || item.typeKR || '');
        const projectName = isKorean ? (item.projectNameKR || '') : (item.projectNameEN || item.projectNameKR || '');
        const keySpecs = isKorean ? (item.keySpecificationsKR || '') : (item.keySpecificationsEN || item.keySpecificationsKR || '');
        const country = isKorean ? (item.countryKR || '') : (item.countryEN || item.countryKR || '');
        
        row.innerHTML = `
            <td data-eng="${item.typeEN || ''}" data-kor="${item.typeKR || ''}">${this.escapeHtml(type)}</td>
            <td data-eng="${item.projectNameEN || ''}" data-kor="${item.projectNameKR || ''}">${this.escapeHtml(projectName)}</td>
            <td data-eng="${item.keySpecificationsEN || ''}" data-kor="${item.keySpecificationsKR || ''}">${this.escapeHtml(keySpecs)}</td>
            <td data-eng="${item.countryEN || ''}" data-kor="${item.countryKR || ''}">${this.escapeHtml(country)}</td>
        `;
        
        return row;
    }
    
    // 언어 전환 처리
    updateLanguage(language) {
        if (!this.substationData || !this.substationData.data) return;
        
        const tableElement = document.querySelector('#substation .substation-project-table');
        if (!tableElement) return;
        
        const isKorean = language === 'ko' || language === 'kr';
        
        // 헤더 언어 전환
        const headerCells = tableElement.querySelectorAll('thead th');
        headerCells.forEach(cell => {
            const korText = cell.getAttribute('data-kor') || '';
            const engText = cell.getAttribute('data-eng') || '';
            cell.textContent = isKorean ? korText : (engText || korText);
        });
        
        // 데이터 행 언어 전환
        const rows = tableElement.querySelectorAll('tbody tr');
        rows.forEach(row => {
            const cells = row.querySelectorAll('td');
            cells.forEach(cell => {
                const korText = cell.getAttribute('data-kor') || '';
                const engText = cell.getAttribute('data-eng') || '';
                cell.textContent = isKorean ? korText : (engText || korText);
            });
        });
        
        console.log(`변전소 테이블 언어 전환 완료: ${language}`);
    }
    
    // HTML 이스케이프
    escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
    
    // 에러 메시지 표시
    showErrorMessage() {
        const tableElement = document.querySelector('#substation .substation-project-table tbody');
        if (tableElement) {
            tableElement.innerHTML = `
                <tr>
                    <td colspan="4" style="text-align: center; padding: 2rem; color: #666;">
                        <p>변전소 프로젝트 데이터를 불러올 수 없습니다.</p>
                        <p>잠시 후 다시 시도해 주세요.</p>
                    </td>
                </tr>
            `;
        }
    }
}

// 전역 원자력 데이터 매니저
let nuclearDataManager = null;

// 전역 복합화력 데이터 매니저
let thermalDataManager = null;

// 전역 변전소 데이터 매니저
let substationDataManager = null;

// 변전소 데이터 로드 함수
async function loadSubstationData() {
    if (!substationDataManager) {
        substationDataManager = new SubstationDataManager();
    }
    return await substationDataManager.loadSubstationData();
}

// 미군기지 데이터 관리 클래스
class MilitaryDataManager {
    constructor() {
        this.militaryData = null;
        this.isLoading = false;
    }
    
    // Apps Script에서 미군기지 데이터 로드
    async loadMilitaryData() {
        if (this.isLoading) return;
        this.isLoading = true;
        
        try {
            console.log('📊 미군기지 데이터 로딩 시작...');
            const url = `${DASHBOARD_APPS_SCRIPT_URL}?sheet=military&action=getData`;
            
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const result = await response.json();
            console.log('📋 미군기지 API 응답:', result);
            
            if (!result.success) {
                throw new Error(result.error || 'API 요청 실패');
            }
            
            this.militaryData = result.data;
            console.log(`✅ 미군기지 데이터 ${this.militaryData.data.length}개 로드 완료`);
            
            // 미군기지 테이블 렌더링
            this.renderMilitaryTable();
            
            return true;
            
        } catch (error) {
            console.error('💥 미군기지 데이터 로드 실패:', error);
            this.showErrorMessage();
            return false;
        } finally {
            this.isLoading = false;
        }
    }
    
    // 미군기지 테이블 렌더링
    renderMilitaryTable() {
        if (!this.militaryData || !this.militaryData.data || this.militaryData.data.length === 0) {
            console.warn('미군기지 데이터가 없습니다.');
            return;
        }
        
        // 테이블 요소 찾기
        const tableElement = document.querySelector('#us-military .substation-project-table');
        if (!tableElement) {
            console.error('미군기지 테이블 요소를 찾을 수 없습니다.');
            return;
        }
        
        // 기존 tbody 내용 제거 (헤더는 유지)
        const tbody = tableElement.querySelector('tbody');
        if (tbody) {
            tbody.innerHTML = '';
        } else {
            console.error('미군기지 테이블의 tbody를 찾을 수 없습니다.');
            return;
        }
        
        console.log(`미군기지 데이터 ${this.militaryData.data.length}개 행 렌더링 시작`);
        
        // 현재 언어 상태 확인
        const currentLanguage = localStorage.getItem('selectedLanguage') || 'ko';
        
        // 데이터 행 생성
        this.militaryData.data.forEach((item, index) => {
            const row = this.createMilitaryTableRow(item, currentLanguage);
            tbody.appendChild(row);
        });
        
        console.log('✅ 미군기지 테이블 렌더링 완료');
    }
    
    // 미군기지 테이블 행 생성
    createMilitaryTableRow(item, language) {
        const row = document.createElement('tr');
        row.setAttribute('data-id', item.id || '');
        
        // 언어에 따른 데이터 선택
        const isKorean = language === 'ko' || language === 'kr';
        
        const projectName = isKorean ? (item.projectNameKR || '') : (item.projectNameEN || item.projectNameKR || '');
        const discipline = isKorean ? (item.disciplineKR || '') : (item.disciplineEN || item.disciplineKR || '');
        const period = isKorean ? (item.periodKR || '') : (item.periodEN || item.periodKR || '');
        const status = isKorean ? (item.statusKR || '') : (item.statusEN || item.statusKR || '');
        
        // 공종에 따른 태그 클래스 결정
        const disciplineClass = this.getDisciplineClass(discipline);
        
        // 상태에 따른 배지 클래스 결정
        const statusClass = this.getStatusClass(status);
        
        row.innerHTML = `
            <td class="project-name">
                <div class="project-info">
                    <span data-eng="${item.projectNameEN || ''}" data-kor="${item.projectNameKR || ''}">${this.escapeHtml(projectName)}</span>
                </div>
            </td>
            <td>
                <span class="discipline-tag ${disciplineClass}" data-eng="${item.disciplineEN || ''}" data-kor="${item.disciplineKR || ''}">${this.escapeHtml(discipline)}</span>
            </td>
            <td class="period" data-eng="${item.periodEN || ''}" data-kor="${item.periodKR || ''}">${this.escapeHtml(period)}</td>
            <td>
                <span class="status-badge ${statusClass}" data-eng="${item.statusEN || ''}" data-kor="${item.statusKR || ''}">${this.escapeHtml(status)}</span>
            </td>
        `;
        
        return row;
    }
    
    // 공종에 따른 CSS 클래스 결정
    getDisciplineClass(discipline) {
        const disciplineLower = discipline.toLowerCase();
        
        if (disciplineLower.includes('전기') || disciplineLower.includes('electrical')) {
            return 'electrical';
        } else if (disciplineLower.includes('기계') || disciplineLower.includes('mechanical')) {
            return 'mechanical';
        } else if (disciplineLower.includes('토목') || disciplineLower.includes('civil')) {
            return 'civil';
        } else if (disciplineLower.includes('건축') || disciplineLower.includes('architectural')) {
            return 'architectural';
        } else if (disciplineLower.includes('외자재') || disciplineLower.includes('foreign')) {
            return 'foreign';
        } else if (disciplineLower.includes(',') || disciplineLower.includes('&')) {
            return 'mixed';
        }
        
        return 'general';
    }
    
    // 상태에 따른 CSS 클래스 결정
    getStatusClass(status) {
        const statusLower = status.toLowerCase();
        
        if (statusLower.includes('완료') || statusLower.includes('completed')) {
            return 'completed';
        } else if (statusLower.includes('진행') || statusLower.includes('progress') || statusLower.includes('ongoing')) {
            return 'in-progress';
        } else if (statusLower.includes('계획') || statusLower.includes('planned')) {
            return 'planned';
        }
        
        return 'general';
    }
    
    // 언어 전환 처리
    updateLanguage(language) {
        if (!this.militaryData || !this.militaryData.data) return;
        
        const tableElement = document.querySelector('#us-military .substation-project-table');
        if (!tableElement) return;
        
        const isKorean = language === 'ko' || language === 'kr';
        
        // 헤더 언어 전환
        const headerCells = tableElement.querySelectorAll('thead th');
        headerCells.forEach(cell => {
            const korText = cell.getAttribute('data-kor') || '';
            const engText = cell.getAttribute('data-eng') || '';
            cell.textContent = isKorean ? korText : (engText || korText);
        });
        
        // 데이터 행 언어 전환
        const rows = tableElement.querySelectorAll('tbody tr');
        rows.forEach(row => {
            // 프로젝트명 (project-info span 안의 텍스트)
            const projectSpan = row.querySelector('.project-info span');
            if (projectSpan) {
                const korText = projectSpan.getAttribute('data-kor') || '';
                const engText = projectSpan.getAttribute('data-eng') || '';
                projectSpan.textContent = isKorean ? korText : (engText || korText);
            }
            
            // 공종 (discipline-tag span)
            const disciplineSpan = row.querySelector('.discipline-tag');
            if (disciplineSpan) {
                const korText = disciplineSpan.getAttribute('data-kor') || '';
                const engText = disciplineSpan.getAttribute('data-eng') || '';
                disciplineSpan.textContent = isKorean ? korText : (engText || korText);
            }
            
            // 기간 (period td)
            const periodTd = row.querySelector('.period');
            if (periodTd) {
                const korText = periodTd.getAttribute('data-kor') || '';
                const engText = periodTd.getAttribute('data-eng') || '';
                periodTd.textContent = isKorean ? korText : (engText || korText);
            }
            
            // 상태 (status-badge span)
            const statusSpan = row.querySelector('.status-badge');
            if (statusSpan) {
                const korText = statusSpan.getAttribute('data-kor') || '';
                const engText = statusSpan.getAttribute('data-eng') || '';
                statusSpan.textContent = isKorean ? korText : (engText || korText);
            }
        });
        
        console.log(`미군기지 테이블 언어 전환 완료: ${language}`);
    }
    
    // HTML 이스케이프
    escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
    
    // 에러 메시지 표시
    showErrorMessage() {
        const tableElement = document.querySelector('#us-military .substation-project-table tbody');
        if (tableElement) {
            tableElement.innerHTML = `
                <tr>
                    <td colspan="4" style="text-align: center; padding: 2rem; color: #666;">
                        <p>미군기지 프로젝트 데이터를 불러올 수 없습니다.</p>
                        <p>잠시 후 다시 시도해 주세요.</p>
                    </td>
                </tr>
            `;
        }
    }
}

// 전역 미군기지 데이터 매니저
let militaryDataManager = null;

// 미군기지 데이터 로드 함수
async function loadMilitaryData() {
    if (!militaryDataManager) {
        militaryDataManager = new MilitaryDataManager();
    }
    return await militaryDataManager.loadMilitaryData();
}

// 변전소 + 미군기지 + 복합화력 + 원자력 초기화 함수
function initBusinessDataLoaders() {
    // 페이지 로드 시 데이터 로드
    document.addEventListener('DOMContentLoaded', function() {
        // 원자력 데이터 로딩
        if (document.querySelector('#nuclear-power .cgid-supply-section')) {
            loadNuclearData();
        } else {
            document.addEventListener('componentsLoaded', () => {
                setTimeout(loadNuclearData, 300);
            });
        }
        
        // 복합화력 데이터 로딩
        if (document.querySelector('#thermal-power .simple-projects-table')) {
            loadThermalData();
        } else {
            document.addEventListener('componentsLoaded', () => {
                setTimeout(loadThermalData, 300);
            });
        }
        
        // 변전소 데이터 로딩
        if (document.querySelector('#substation .substation-project-table')) {
            loadSubstationData();
        } else {
            document.addEventListener('componentsLoaded', () => {
                setTimeout(loadSubstationData, 300);
            });
        }
        
        // 미군기지 데이터 로딩
        if (document.querySelector('#us-military .substation-project-table')) {
            loadMilitaryData();
        } else {
            document.addEventListener('componentsLoaded', () => {
                setTimeout(loadMilitaryData, 300);
            });
        }
    });
    
    // 언어 변경 이벤트 리스너
    window.addEventListener('languageChanged', () => {
        const currentLanguage = localStorage.getItem('selectedLanguage') || 'ko';
        
        if (nuclearDataManager) {
            nuclearDataManager.updateLanguage(currentLanguage);
        }
        
        if (thermalDataManager) {
            thermalDataManager.updateLanguage(currentLanguage);
        }
        
        if (substationDataManager) {
            substationDataManager.updateLanguage(currentLanguage);
        }
        
        if (militaryDataManager) {
            militaryDataManager.updateLanguage(currentLanguage);
        }
    });
    
    // localStorage 변경 감지 (다른 탭에서 언어 변경 시)
    window.addEventListener('storage', (e) => {
        if (e.key === 'selectedLanguage') {
            const newLanguage = e.newValue || 'ko';
            
            if (nuclearDataManager) {
                nuclearDataManager.updateLanguage(newLanguage);
            }
            
            if (thermalDataManager) {
                thermalDataManager.updateLanguage(newLanguage);
            }
            
            if (substationDataManager) {
                substationDataManager.updateLanguage(newLanguage);
            }
            
            if (militaryDataManager) {
                militaryDataManager.updateLanguage(newLanguage);
            }
        }
    });
}

// 전역 함수로 노출
window.loadNuclearData = loadNuclearData;
window.NuclearDataManager = NuclearDataManager;
window.loadThermalData = loadThermalData;
window.ThermalPowerDataManager = ThermalPowerDataManager;
window.loadSubstationData = loadSubstationData;
window.SubstationDataManager = SubstationDataManager;
window.loadMilitaryData = loadMilitaryData;
window.MilitaryDataManager = MilitaryDataManager;

// 자동 초기화 (business 페이지에서만)
if (window.location.pathname.includes('business')) {
    initBusinessDataLoaders();
}