/**
 * PSAC 개요 및 신청방법 동적 관리 클래스
 * 원격 데이터를 우선 사용하되, 실패 시 fallback 데이터를 유지한다.
 */

class PSACOverviewManager {
    constructor() {
        this.apiUrl = 'https://script.google.com/macros/s/AKfycbzvcFA7rwVCSJnhzQHlZH0a8AI0_S-EN-tyTg0tp_lJUmEXTN8d7axtVGrUjkOJLht-kA/exec';
        this.currentLang = this.detectLanguage();
        this.overviewData = this.createFallbackOverviewData();
        this.weeklyOverviewData = this.createFallbackWeeklyOverviewData();

        this.init();
    }

    detectLanguage() {
        const currentLang = document.documentElement.getAttribute('data-lang');
        return currentLang === 'en' ? 'english' : 'korean';
    }

    async init() {
        this.renderInfoTable();
        this.renderContactGrid();
        this.renderWeeklyOverviewSection();
        this.setupLanguageChangeHandler();
        this.setupLanguageObserver();

        await Promise.allSettled([
            this.loadOverviewData(),
            this.loadWeeklyOverviewData()
        ]);

        this.renderInfoTable();
        this.renderContactGrid();
        this.renderWeeklyOverviewSection();
    }

    async loadOverviewData() {
        try {
            const response = await fetch(`${this.apiUrl}?action=get_psac_overview`);
            const result = await response.json();

            if (result.success && result.data) {
                this.overviewData = result.data;
                console.log('PSAC Overview data loaded:', this.overviewData);
            } else {
                console.warn('Failed to load overview data, using fallback data');
            }
        } catch (error) {
            console.error('Error loading overview data, using fallback data:', error);
        }
    }

    async loadWeeklyOverviewData() {
        try {
            const response = await fetch(`${this.apiUrl}?action=get_psac_weekly_overview`);
            const result = await response.json();

            if (result.success && result.data) {
                this.weeklyOverviewData = result.data;
                console.log('PSAC Weekly Overview data loaded:', this.weeklyOverviewData);
            } else {
                console.warn('Failed to load weekly overview data, using fallback data');
            }
        } catch (error) {
            console.error('Error loading weekly overview data, using fallback data:', error);
        }
    }

    renderInfoTable() {
        const container = document.querySelector('.psac-info-table-container');
        if (!container || !this.overviewData) {
            return;
        }

        container.innerHTML = this.generateInfoTable();
        this.setupDataAttributes(container);
    }

    generateInfoTable() {
        const courseData = this.overviewData.courseOverview || {};
        const korData = courseData.korean || {};
        const engData = courseData.english || {};

        const fields = [
            { key: '목적', labelKor: '목적', labelEng: 'Objective' },
            { key: '주관', labelKor: '주관', labelEng: 'Host' },
            { key: '장소', labelKor: '장소', labelEng: 'Venue' },
            { key: '기간', labelKor: '기간', labelEng: 'Period' },
            { key: '대상', labelKor: '대상', labelEng: 'Target' }
        ];

        const rows = fields.map(field => {
            const korValueHtml = this.formatMultilineText(korData[field.key] || '');
            const engValueHtml = this.formatMultilineText(engData[field.key] || '');

            return `
                <tr>
                    <th class="info-label" data-eng="${field.labelEng}" data-kor="${field.labelKor}">${field.labelKor}</th>
                    <td class="info-value" data-eng="${this.escapeHtml(engValueHtml)}" data-kor="${this.escapeHtml(korValueHtml)}">${korValueHtml}</td>
                </tr>`;
        }).join('');

        return `
            <table class="psac-info-table">
                <tbody>${rows}
                </tbody>
            </table>`;
    }

    renderContactGrid() {
        const container = document.querySelector('.contact-grid');
        if (!container || !this.overviewData) {
            return;
        }

        container.innerHTML = this.generateContactGrid();
        this.setupDataAttributes(container);
    }

    generateContactGrid() {
        const applicationData = this.overviewData.applicationMethod || {};
        const korData = applicationData.korean || {};
        const engData = applicationData.english || {};

        const fields = [
            { key: '접수기간', labelKor: '접수기간:', labelEng: 'Application Period:' },
            { key: '개인', labelKor: '개인:', labelEng: 'Individual:' },
            { key: '단체', labelKor: '단체:', labelEng: 'Group:' },
            { key: '결제(납부)', labelKor: '결제(납부):', labelEng: 'Payment:' }
        ];

        return fields.map(field => {
            const korValue = korData[field.key] || '';
            const engValue = engData[field.key] || '';

            if (field.key === '결제(납부)') {
                const korPaymentHTML = this.formatPaymentText(korValue);
                const engPaymentHTML = this.formatPaymentText(engValue);

                return `
                    <div class="contact-item">
                        <div class="contact-label" data-kor="${field.labelKor}" data-eng="${field.labelEng}">${field.labelKor}</div>
                        <div class="contact-value" data-kor="${this.escapeHtml(korPaymentHTML)}" data-eng="${this.escapeHtml(engPaymentHTML)}">${korPaymentHTML}</div>
                    </div>`;
            }

            const korValueHtml = this.formatMultilineText(korValue);
            const engValueHtml = this.formatMultilineText(engValue);

            return `
                <div class="contact-item">
                    <div class="contact-label" data-kor="${field.labelKor}" data-eng="${field.labelEng}">${field.labelKor}</div>
                    <div class="contact-value" data-kor="${this.escapeHtml(korValueHtml)}" data-eng="${this.escapeHtml(engValueHtml)}">${korValueHtml}</div>
                </div>`;
        }).join('');
    }

    renderWeeklyOverviewSection() {
        const container = document.querySelector('.psac-weekly-overview-container');
        if (!container || !this.weeklyOverviewData) {
            return;
        }

        container.innerHTML = this.generateWeeklyOverviewTable();
    }

    generateWeeklyOverviewTable() {
        const isEnglish = this.currentLang === 'english';
        const koreanRows = this.weeklyOverviewData.korean || [];
        const englishRows = this.weeklyOverviewData.english || [];

        if (!koreanRows.length && !englishRows.length) {
            return `
                <div style="text-align: center; padding: 2rem; color: #666;">
                    <p>${isEnglish ? 'No weekly schedule data available.' : '주차별 교육일정 데이터가 없습니다.'}</p>
                </div>`;
        }

        const rowSource = isEnglish ? englishRows : koreanRows;
        const header = isEnglish
            ? {
                week: 'Weeks',
                period: 'Training Period',
                topic: 'Topic',
                days: 'Days',
                fee: 'Tuition Fee (KRW)<br>※ VAT excluded'
            }
            : {
                week: '주차',
                period: '교육기간',
                topic: '주제',
                days: '일수',
                fee: '교육비(원)<br>※부가세 별도'
            };

        const rowsHtml = rowSource
            .slice()
            .sort((a, b) => (a.weekNumber || 0) - (b.weekNumber || 0))
            .map(item => {
                const topicHtml = this.formatTopicText(item.topic || '');

                return `
                    <tr class="psac-weekly-overview-row">
                        <td class="psac-weekly-overview-cell psac-weekly-overview-week">${this.escapeHtml(item.week || '')}</td>
                        <td class="psac-weekly-overview-cell psac-weekly-overview-period">${this.escapeHtml(item.period || '')}</td>
                        <td class="psac-weekly-overview-cell psac-weekly-overview-topic">${topicHtml}</td>
                        <td class="psac-weekly-overview-cell psac-weekly-overview-days">${this.escapeHtml(item.days || '')}</td>
                        <td class="psac-weekly-overview-cell psac-weekly-overview-fee">${this.escapeHtml(item.fee || '')}</td>
                    </tr>`;
            })
            .join('');

        return `
            <div class="psac-weekly-overview-table-wrap">
                <table class="psac-weekly-overview-table">
                    <thead>
                        <tr class="psac-weekly-overview-head-row">
                            <th class="psac-weekly-overview-head psac-weekly-overview-head-week">${header.week}</th>
                            <th class="psac-weekly-overview-head psac-weekly-overview-head-period">${header.period}</th>
                            <th class="psac-weekly-overview-head psac-weekly-overview-head-topic">${header.topic}</th>
                            <th class="psac-weekly-overview-head psac-weekly-overview-head-days">${header.days}</th>
                            <th class="psac-weekly-overview-head psac-weekly-overview-head-fee">${header.fee}</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${rowsHtml}
                    </tbody>
                </table>
            </div>`;
    }

    formatPaymentText(text) {
        if (!text) {
            return '';
        }

        return text
            .split('\n')
            .map(line => line.trim())
            .filter(Boolean)
            .map(line => `<div>${this.escapeHtml(line)}</div>`)
            .join('');
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    formatMultilineText(text) {
        const escaped = this.escapeHtml(text || '');
        return escaped.replace(/\r\n|\n|\r/g, '<br>');
    }

    formatTopicText(text) {
        const lines = this.splitMultilineText(text);

        if (lines.length === 0) {
            return '';
        }

        if (lines.length === 1) {
            return `<div class="psac-weekly-overview-topic-line psac-weekly-overview-topic-line-first">${this.escapeHtml(lines[0])}</div>`;
        }

        return lines.map((line, index) => {
            if (index === 0) {
                return `<div class="psac-weekly-overview-topic-line psac-weekly-overview-topic-line-first">${this.escapeHtml(line)}</div>`;
            }

            if (index === lines.length - 1) {
                return `<div class="psac-weekly-overview-topic-line psac-weekly-overview-topic-line-last">${this.escapeHtml(line)}</div>`;
            }

            return `<div class="psac-weekly-overview-topic-line psac-weekly-overview-topic-line-mid">${this.escapeHtml(line)}</div>`;
        }).join('');
    }

    splitMultilineText(text) {
        return (text || '')
            .toString()
            .split(/\r\n|\n|\r/)
            .map(line => line.trim())
            .filter(line => line.length > 0);
    }

    setupDataAttributes() {
        // 기존 data-kor / data-eng 전환 시스템 사용
    }

    setupLanguageObserver() {
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.type === 'attributes' && mutation.attributeName === 'data-lang') {
                    this.currentLang = this.detectLanguage();
                    this.renderWeeklyOverviewSection();
                }
            });
        });

        observer.observe(document.documentElement, {
            attributes: true,
            attributeFilter: ['data-lang']
        });
    }

    setupLanguageChangeHandler() {
        window.addEventListener('languageChanged', (event) => {
            this.currentLang = event?.detail?.language === 'en' ? 'english' : 'korean';
            this.renderWeeklyOverviewSection();
        });
    }

    createFallbackOverviewData() {
        return {
            courseOverview: {
                korean: {
                    '목적': '전력계통 기술분야 고급인력 양성',
                    '주관': '와이피피㈜',
                    '장소': '서울시 금천구 가산디지털2로 24 (가산동 327 -30) 가산YPP아르센타워 8층 교육실',
                    '기간': '2026년9월 1일(화) ~ 12월 3일(목)',
                    '대상': '· 전력계통 운영, 계획, 보호, 해석 업무 담당자\n· 발전, 송전, 변전, 배전 분야 실무자\n· 전력거래, 전력시장, 수요자원, 에너지신산업 관련 담당자\n· 신재생에너지, ESS, HVDC, FACTS, 전력전자 계통연계 업무 담당자\n· 전력설비 보호계전, 보호협조, 고장해석 관련 실무자\n· 전력산업 관련 공공기관, 발전사, 전력회사, 연구기관, 제조사, 엔지니어링사 임직원\n· 전력계통 고급기술을 체계적으로 학습하고자 하는 관련 분야 종사자'
                },
                english: {
                    '목적': 'Training power system technical specialists and graduate-level engineers',
                    '주관': 'YPP Corporation',
                    '장소': '8th Floor Training Room, Gasan YPP Arsen Tower\n24, Gasan Digital 2-ro, Geumcheon-gu, Seoul (Gasan-dong 327-30)',
                    '기간': 'September 1, 2026 (Tue) ~ December 3, 2026 (Thu)',
                    '대상': '· Personnel responsible for power system operation, planning, protection, and analysis\n· Practitioners in the fields of power generation, transmission, substation, and distribution\n· Personnel responsible for power trading, power markets, demand resources, and new energy industries\n· Personnel responsible for renewable energy, ESS, HVDC, FACTS, and power electronics grid interconnection\n· Practitioners involved in power equipment protection relaying, protection coordination, and fault analysis\n· Employees of public institutions, power generation companies, power companies, research institutes, manufacturers, and engineering firms related to the power industry\n· Professionals in related fields who wish to systematically learn advanced power system technologies'
                }
            },
            applicationMethod: {
                korean: {
                    '접수기간': '2026년 6월 22일 ~ 주차(주제)별 개강 2주전 (금)요일 마감',
                    '개인': '홈페이지 접속(www.ypp.co.kr) → YPP 아카데미 → 교육신청',
                    '단체': '이메일 송부(신청서 작성) → 전화문의/접수',
                    '결제(납부)': '- 계좌이체 : 기업 137-031847-04-013 / 예금주 : 와이피피㈜\n- 카드결제 : 개강일 현장결제'
                },
                english: {
                    '접수기간': 'June 22, 2026 ~ Deadline is Friday, 2 weeks prior to the start of each week (topic)',
                    '개인': 'Visit the website (www.ypp.co.kr) → YPP Academy → Course Application',
                    '단체': 'Send application form by email → Phone inquiry/registration',
                    '결제(납부)': '• Bank Transfer: KEB Hana Bank 137-031847-04-013 / Account Holder: YPP Corporation\n• Card Payment: Pay on-site on the first day of class'
                }
            }
        };
    }

    createFallbackWeeklyOverviewData() {
        return {
            korean: [
                { weekNumber: 1, week: '1주', period: '9.1(화) ~ 9.3(목)', topic: '전력계통 운영환경 변화와 계통해석 실무기반\n전력시장과 계통운영 환경 변화를 이해하고, 계통해석의 기본 이론과 실무 적용 기반을 학습합니다.\n\n박종배, 송태용, 심현보, 유영식, 최면송, 송경빈, 권기현, 허 견', days: '3일', fee: '1,100,000' },
                { weekNumber: 2, week: '2주', period: '9.8(화) ~ 9.11(금)', topic: '전력계통 보호기술과 지능형 디지털 보호시스템\n전력설비 보호 원리와 보호시스템 구성, 디지털 보호기술 및 IEC 61850 기반 보호제어 기술을 다룹니다.\n\n이 진, 이동규, 유영식, 강상욱, 권영진, 김일동, 차동철, 이남호', days: '4일', fee: '1,200,000' },
                { weekNumber: 3, week: '3주', period: '9.16(수) ~ 9.18(금)', topic: '동기발전기의 모델링·제어 및 특성시험 기술\n동기발전기의 운전특성과 모델링, 제어시스템 및 특성시험을 통해 발전기 해석과 운용 이해도를 높입니다.\n\n정성우, 정일엽, 안선주, 원동준, 이상호, 김동준, 임익헌', days: '3일', fee: '1,100,000' },
                { weekNumber: 4, week: '4주', period: '9.30(수) ~ 10.2(금)', topic: '전력설비 절연·접지 및 전압·무효전력 보상기술\n송변전설비의 절연·접지 설계와 전압·무효전력 보상기술을 중심으로 안정적 전력전송 방안을 학습합니다.\n\n우정욱, 최종기, 송화창, 한상욱, 곽은섭', days: '3일', fee: '1,000,000' },
                { weekNumber: 5, week: '5주', period: '10.13(화) ~ 10.16(금)', topic: '전력계통 안정도 해석 개요와 전압안정도\n전압·과도·미소신호·주파수 안정도 등 계통 안정도 해석의 핵심 개념과 시뮬레이션 적용을 다룹니다.\n\n송화창, 윤민한, 김수배, 국경수, 정주용, 김재경, 정인주, 한상욱, 조윤성, 신정훈', days: '4일', fee: '1,200,000' },
                { weekNumber: 6, week: '6주', period: '10.20(화) ~ 10.23(금)', topic: '분산에너지·VPP·MG 기반 배전계통 운영기술\n분산에너지 확대에 따른 배전계통 운영 변화와 VPP, 마이크로그리드, DERMS·ADMS·DSO 기술을 학습합니다.\n\n김형중, 최동희, 이성은, 원동준, 이수형, 이효섭, 전진홍, 이태의, 조성민, 김윤수, 안형승, 이진오', days: '4일', fee: '1,300,000' },
                { weekNumber: 7, week: '7주', period: '10.27(화) ~ 10.29(목)', topic: '전력설비 보호릴레이 정정 및 보호협조 실무\n주요 전력설비별 보호릴레이 정정과 보호협조 사례를 통해 현장 중심의 보호 실무 역량을 강화합니다.\n\n박진우, 김일동, 김세환, 노대석, 강상욱', days: '3일', fee: '1,000,000' },
                { weekNumber: 8, week: '8주', period: '11.10(화) ~ 11.13(금)', topic: 'HVDC·DC Grid·FACTS 기반 전력전자 계통기술\nHVDC, DC Grid, FACTS 등 전력전자 기반 계통기술의 원리와 적용사례, 운영 이슈를 학습합니다.\n\n한병문, 윤민한, 강재식, 김희진, 전상준, 심정욱, 허 훈', days: '4일', fee: '1,300,000' },
                { weekNumber: 9, week: '9주', period: '11.17(화) ~ 11.20(금)', topic: '전력계통 운영계획·전력시장과 수요자원 활용\n발전·계통설비 계획, 실시간 계통운영, 전력시장, 보조서비스 및 수요자원 활용 방안을 다룹니다.\n\n김준한, 홍광희, 주 원, 최영민, 송태용, 허성일, 박종배, 이상엽, 이창호, 박기준, 김성철', days: '4일', fee: '1,300,000' },
                { weekNumber: 10, week: '10주', period: '11.24(화) ~ 11.27(금)', topic: '신재생·ESS·Grid-forming 기반 계통연계 기술\n신재생에너지와 ESS의 계통연계, Grid-forming 인버터, 계통 안정화 및 안전성 이슈를 학습합니다.\n\n이길송, 조성수, 정용호, 권영진, 한세경, 송길목, 김재동, 박정극, 류지윤', days: '4일', fee: '1,300,000' },
                { weekNumber: 11, week: '11주', period: '12.1(화) ~ 12.3(목)', topic: 'AI·데이터센터 기반 전력계통 운영과 원전·SMR 안전기술\nAI 기반 계통운영, 데이터센터 전력수요, 디지털 트윈, 원전·SMR 안전기술과 계통 연계 이슈를 다룹니다.\n\n김영진, 신정훈, 박준범, 이병윤, 오휘명, 이순형, 김복렬, 선현규', days: '3일', fee: '1,200,000' }
            ],
            english: [
                { weekNumber: 1, week: '1', period: '9.1 (Tue) ~ 9.3 (Thu)', topic: 'Changes in Power System Operation Environment and Practical Foundations for System Analysis\nUnderstand changes in the power market and operating environment, and learn the basic theory and practical foundations of system analysis.\n\nLecturers: Park Jong-bae, Song Tae-yong, Shim Hyeon-bo, Yoo Young-sik, Choi Myeon-song, Song Kyung-bin, Kwon Gi-hyeon, Huh Gyeon', days: '3', fee: '1,100,000' },
                { weekNumber: 2, week: '2', period: '9.8 (Tue) ~ 9.11 (Fri)', topic: 'Protection Technologies and Intelligent Digital Protection Systems\nCovers power equipment protection principles, protection system architecture, digital protection, and IEC 61850-based protection and control technologies.\n\nLecturers: Lee Jin, Lee Dong-gyu, Yoo Young-sik, Kang Sang-wook, Kwon Young-jin, Kim Il-dong, Cha Dong-cheol, Lee Nam-ho', days: '4', fee: '1,200,000' },
                { weekNumber: 3, week: '3', period: '9.16 (Wed) ~ 9.18 (Fri)', topic: 'Modeling, Control, and Performance Testing of Synchronous Generators\nBuild a stronger understanding of generator analysis and operation through operating characteristics, modeling, control systems, and performance testing.\n\nLecturers: Jung Seong-woo, Jung Il-yeob, Ahn Sun-ju, Won Dong-joon, Lee Sang-ho, Kim Dong-joon, Lim Ik-heon', days: '3', fee: '1,100,000' },
                { weekNumber: 4, week: '4', period: '9.30 (Wed) ~ 10.2 (Fri)', topic: 'Insulation, Grounding, and Voltage/Reactive Power Compensation Technologies\nLearn stable power transmission strategies centered on insulation and grounding design for transmission and substation facilities, and voltage/reactive power compensation.\n\nLecturers: Woo Jeong-wook, Choi Jong-gi, Song Hwa-chang, Han Sang-wook, Kwak Eun-seop', days: '3', fee: '1,000,000' },
                { weekNumber: 5, week: '5', period: '10.13 (Tue) ~ 10.16 (Fri)', topic: 'Overview of Power System Stability Analysis and Voltage Stability\nCovers key stability concepts such as voltage, transient, small-signal, and frequency stability, along with simulation applications.\n\nLecturers: Song Hwa-chang, Yoon Min-han, Kim Soo-bae, Kook Kyung-soo, Jung Joo-yong, Kim Jae-kyung, Jung In-joo, Han Sang-wook, Jo Yoon-seong, Shin Jeong-hoon', days: '4', fee: '1,200,000' },
                { weekNumber: 6, week: '6', period: '10.20 (Tue) ~ 10.23 (Fri)', topic: 'Distribution System Operation Technologies Based on DER, VPP, and MG\nStudy operational changes in distribution systems driven by distributed energy expansion, plus VPP, microgrids, DERMS, ADMS, and DSO technologies.\n\nLecturers: Kim Hyeong-jung, Choi Dong-hee, Lee Seong-eun, Won Dong-joon, Lee Su-hyeong, Lee Hyo-seob, Jeon Jin-hong, Lee Tae-ui, Jo Seong-min, Kim Yun-su, Ahn Hyeong-seung, Lee Jin-o', days: '4', fee: '1,300,000' },
                { weekNumber: 7, week: '7', period: '10.27 (Tue) ~ 10.29 (Thu)', topic: 'Practical Protective Relay Setting and Coordination for Power Equipment\nStrengthen field-oriented protection skills through relay setting and coordination cases for major power equipment.\n\nLecturers: Park Jin-woo, Kim Il-dong, Kim Se-kwan, Noh Dae-seok, Kang Sang-wook', days: '3', fee: '1,000,000' },
                { weekNumber: 8, week: '8', period: '11.10 (Tue) ~ 11.13 (Fri)', topic: 'Power Electronic Grid Technologies Based on HVDC, DC Grid, and FACTS\nLearn the principles, application cases, and operational issues of power-electronics-based grid technologies such as HVDC, DC Grid, and FACTS.\n\nLecturers: Han Byeong-moon, Yoon Min-han, Kang Jae-sik, Kim Hee-jin, Jeon Sang-jun, Shim Jeong-wook, Huh Hun', days: '4', fee: '1,300,000' },
                { weekNumber: 9, week: '9', period: '11.17 (Tue) ~ 11.20 (Fri)', topic: 'Power System Operation Planning, Power Markets, and Demand Resource Utilization\nCovers generation and facility planning, real-time system operation, power markets, ancillary services, and demand resource applications.\n\nLecturers: Kim Jun-han, Hong Gwang-hee, Ju Won, Choi Young-min, Song Tae-yong, Heo Seong-il, Park Jong-bae, Lee Sang-yeop, Lee Chang-ho, Park Gi-beom, Kim Seong-cheol', days: '4', fee: '1,300,000' },
                { weekNumber: 10, week: '10', period: '11.24 (Tue) ~ 11.27 (Fri)', topic: 'Grid Interconnection Technologies Based on Renewable Energy, ESS, and Grid-forming\nStudy grid interconnection of renewables and ESS, grid-forming inverters, system stabilization, and safety-related issues.\n\nLecturers: Lee Gil-song, Jo Seong-su, Jeong Yong-ho, Kwon Young-jin, Han Se-kyung, Song Gil-mok, Kim Jae-dong, Park Jeong-geuk, Ryu Ji-yoon', days: '4', fee: '1,300,000' },
                { weekNumber: 11, week: '11', period: '12.1 (Tue) ~ 12.3 (Thu)', topic: 'Power System Operation with AI and Data Centers, and Nuclear/SMR Safety Technologies\nCovers AI-based system operation, data center power demand, digital twins, and grid integration issues for nuclear and SMR safety technologies.\n\nLecturers: Kim Young-jin, Shin Jeong-hoon, Park Jun-beom, Lee Byeong-yoon, Oh Hwi-myeong, Lee Sun-hyung, Kim Bok-ryeol, Seon Hyeon-gyu', days: '3', fee: '1,200,000' }
            ]
        };
    }
}

document.addEventListener('DOMContentLoaded', function() {
    if (document.querySelector('#psac')) {
        window.psacOverviewManager = new PSACOverviewManager();
    }
});
