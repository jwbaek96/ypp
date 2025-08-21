// Google Apps Script - Admin Authentication System
// 새로운 Google Apps Script 프로젝트에서 사용할 코드

// 스프레드시트 ID (관리자 정보를 저장할 새로운 스프레드시트)
const ADMIN_SPREADSHEET_ID = 'YOUR_ADMIN_SPREADSHEET_ID_HERE';

// 시트 이름
const USERS_SHEET_NAME = 'Users';
const SESSIONS_SHEET_NAME = 'Sessions';

/**
 * HTTP 요청 처리 메인 함수
 */
function doPost(e) {
    try {
        const data = JSON.parse(e.postData.contents);
        
        switch (data.action) {
            case 'login':
                return ContentService
                    .createTextOutput(JSON.stringify(handleLogin(data)))
                    .setMimeType(ContentService.MimeType.JSON);
                    
            case 'validateSession':
                return ContentService
                    .createTextOutput(JSON.stringify(validateSession(data)))
                    .setMimeType(ContentService.MimeType.JSON);
                    
            case 'logout':
                return ContentService
                    .createTextOutput(JSON.stringify(handleLogout(data)))
                    .setMimeType(ContentService.MimeType.JSON);
                    
            default:
                return ContentService
                    .createTextOutput(JSON.stringify({
                        success: false,
                        message: '잘못된 액션입니다.'
                    }))
                    .setMimeType(ContentService.MimeType.JSON);
        }
        
    } catch (error) {
        console.error('doPost 오류:', error);
        return ContentService
            .createTextOutput(JSON.stringify({
                success: false,
                message: '서버 오류가 발생했습니다.'
            }))
            .setMimeType(ContentService.MimeType.JSON);
    }
}

/**
 * GET 요청 처리 (CORS 지원)
 */
function doGet(e) {
    return ContentService
        .createTextOutput(JSON.stringify({
            success: false,
            message: 'POST 요청만 지원합니다.'
        }))
        .setMimeType(ContentService.MimeType.JSON);
}

/**
 * 로그인 처리
 */
function handleLogin(data) {
    try {
        const { username, password } = data;
        
        if (!username || !password) {
            return {
                success: false,
                message: '사용자명과 비밀번호를 입력해주세요.'
            };
        }
        
        // 사용자 확인
        const user = getUserByUsername(username);
        if (!user) {
            return {
                success: false,
                message: '존재하지 않는 사용자입니다.'
            };
        }
        
        // 비밀번호 확인
        if (user.password !== password) {
            return {
                success: false,
                message: '비밀번호가 일치하지 않습니다.'
            };
        }
        
        // 사용자 상태 확인
        if (user.status !== 'active') {
            return {
                success: false,
                message: '비활성화된 계정입니다.'
            };
        }
        
        // 세션 토큰 생성
        const sessionToken = generateSessionToken();
        const expiresAt = new Date();
        expiresAt.setHours(expiresAt.getHours() + 24); // 24시간 후 만료
        
        // 세션 저장
        saveSession(sessionToken, user.id, expiresAt);
        
        // 마지막 로그인 시간 업데이트
        updateLastLogin(user.id);
        
        return {
            success: true,
            token: sessionToken,
            user: {
                id: user.id,
                username: user.username,
                role: user.role
            }
        };
        
    } catch (error) {
        console.error('로그인 처리 오류:', error);
        return {
            success: false,
            message: '로그인 처리 중 오류가 발생했습니다.'
        };
    }
}

/**
 * 세션 검증
 */
function validateSession(data) {
    try {
        const { token } = data;
        
        if (!token) {
            return {
                success: false,
                message: '토큰이 없습니다.'
            };
        }
        
        const session = getSessionByToken(token);
        if (!session) {
            return {
                success: false,
                message: '유효하지 않은 세션입니다.'
            };
        }
        
        // 만료 시간 확인
        const now = new Date();
        const expiresAt = new Date(session.expiresAt);
        
        if (now > expiresAt) {
            // 만료된 세션 삭제
            deleteSession(token);
            return {
                success: false,
                message: '세션이 만료되었습니다.'
            };
        }
        
        // 세션 연장 (선택적)
        const newExpiresAt = new Date();
        newExpiresAt.setHours(newExpiresAt.getHours() + 24);
        updateSessionExpiry(token, newExpiresAt);
        
        return {
            success: true,
            user: {
                id: session.userId,
                username: session.username,
                role: session.role
            }
        };
        
    } catch (error) {
        console.error('세션 검증 오류:', error);
        return {
            success: false,
            message: '세션 검증 중 오류가 발생했습니다.'
        };
    }
}

/**
 * 로그아웃 처리
 */
function handleLogout(data) {
    try {
        const { token } = data;
        
        if (token) {
            deleteSession(token);
        }
        
        return {
            success: true,
            message: '로그아웃되었습니다.'
        };
        
    } catch (error) {
        console.error('로그아웃 처리 오류:', error);
        return {
            success: false,
            message: '로그아웃 처리 중 오류가 발생했습니다.'
        };
    }
}

/**
 * 사용자명으로 사용자 정보 조회
 */
function getUserByUsername(username) {
    try {
        const sheet = SpreadsheetApp.openById(ADMIN_SPREADSHEET_ID).getSheetByName(USERS_SHEET_NAME);
        const data = sheet.getDataRange().getValues();
        const headers = data[0];
        
        for (let i = 1; i < data.length; i++) {
            const row = data[i];
            if (row[headers.indexOf('username')] === username) {
                return {
                    id: row[headers.indexOf('id')],
                    username: row[headers.indexOf('username')],
                    password: row[headers.indexOf('password')],
                    role: row[headers.indexOf('role')],
                    status: row[headers.indexOf('status')],
                    createdAt: row[headers.indexOf('createdAt')],
                    lastLoginAt: row[headers.indexOf('lastLoginAt')]
                };
            }
        }
        
        return null;
        
    } catch (error) {
        console.error('사용자 조회 오류:', error);
        return null;
    }
}

/**
 * 세션 토큰 생성
 */
function generateSessionToken() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let token = '';
    for (let i = 0; i < 64; i++) {
        token += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return token;
}

/**
 * 세션 저장
 */
function saveSession(token, userId, expiresAt) {
    try {
        const sheet = SpreadsheetApp.openById(ADMIN_SPREADSHEET_ID).getSheetByName(SESSIONS_SHEET_NAME);
        const user = getUserById(userId);
        
        sheet.appendRow([
            token,
            userId,
            user.username,
            user.role,
            new Date(),
            expiresAt
        ]);
        
    } catch (error) {
        console.error('세션 저장 오류:', error);
    }
}

/**
 * 토큰으로 세션 조회
 */
function getSessionByToken(token) {
    try {
        const sheet = SpreadsheetApp.openById(ADMIN_SPREADSHEET_ID).getSheetByName(SESSIONS_SHEET_NAME);
        const data = sheet.getDataRange().getValues();
        const headers = data[0];
        
        for (let i = 1; i < data.length; i++) {
            const row = data[i];
            if (row[headers.indexOf('token')] === token) {
                return {
                    token: row[headers.indexOf('token')],
                    userId: row[headers.indexOf('userId')],
                    username: row[headers.indexOf('username')],
                    role: row[headers.indexOf('role')],
                    createdAt: row[headers.indexOf('createdAt')],
                    expiresAt: row[headers.indexOf('expiresAt')]
                };
            }
        }
        
        return null;
        
    } catch (error) {
        console.error('세션 조회 오류:', error);
        return null;
    }
}

/**
 * 사용자 ID로 사용자 정보 조회
 */
function getUserById(userId) {
    try {
        const sheet = SpreadsheetApp.openById(ADMIN_SPREADSHEET_ID).getSheetByName(USERS_SHEET_NAME);
        const data = sheet.getDataRange().getValues();
        const headers = data[0];
        
        for (let i = 1; i < data.length; i++) {
            const row = data[i];
            if (row[headers.indexOf('id')] === userId) {
                return {
                    id: row[headers.indexOf('id')],
                    username: row[headers.indexOf('username')],
                    password: row[headers.indexOf('password')],
                    role: row[headers.indexOf('role')],
                    status: row[headers.indexOf('status')],
                    createdAt: row[headers.indexOf('createdAt')],
                    lastLoginAt: row[headers.indexOf('lastLoginAt')]
                };
            }
        }
        
        return null;
        
    } catch (error) {
        console.error('사용자 ID 조회 오류:', error);
        return null;
    }
}

/**
 * 마지막 로그인 시간 업데이트
 */
function updateLastLogin(userId) {
    try {
        const sheet = SpreadsheetApp.openById(ADMIN_SPREADSHEET_ID).getSheetByName(USERS_SHEET_NAME);
        const data = sheet.getDataRange().getValues();
        const headers = data[0];
        
        for (let i = 1; i < data.length; i++) {
            const row = data[i];
            if (row[headers.indexOf('id')] === userId) {
                sheet.getRange(i + 1, headers.indexOf('lastLoginAt') + 1).setValue(new Date());
                break;
            }
        }
        
    } catch (error) {
        console.error('마지막 로그인 시간 업데이트 오류:', error);
    }
}

/**
 * 세션 만료 시간 업데이트
 */
function updateSessionExpiry(token, newExpiresAt) {
    try {
        const sheet = SpreadsheetApp.openById(ADMIN_SPREADSHEET_ID).getSheetByName(SESSIONS_SHEET_NAME);
        const data = sheet.getDataRange().getValues();
        const headers = data[0];
        
        for (let i = 1; i < data.length; i++) {
            const row = data[i];
            if (row[headers.indexOf('token')] === token) {
                sheet.getRange(i + 1, headers.indexOf('expiresAt') + 1).setValue(newExpiresAt);
                break;
            }
        }
        
    } catch (error) {
        console.error('세션 만료 시간 업데이트 오류:', error);
    }
}

/**
 * 세션 삭제
 */
function deleteSession(token) {
    try {
        const sheet = SpreadsheetApp.openById(ADMIN_SPREADSHEET_ID).getSheetByName(SESSIONS_SHEET_NAME);
        const data = sheet.getDataRange().getValues();
        const headers = data[0];
        
        for (let i = 1; i < data.length; i++) {
            const row = data[i];
            if (row[headers.indexOf('token')] === token) {
                sheet.deleteRow(i + 1);
                break;
            }
        }
        
    } catch (error) {
        console.error('세션 삭제 오류:', error);
    }
}

/**
 * 만료된 세션 정리 (정기적으로 실행)
 */
function cleanupExpiredSessions() {
    try {
        const sheet = SpreadsheetApp.openById(ADMIN_SPREADSHEET_ID).getSheetByName(SESSIONS_SHEET_NAME);
        const data = sheet.getDataRange().getValues();
        const headers = data[0];
        const now = new Date();
        
        // 역순으로 처리해야 행 번호가 밀리지 않음
        for (let i = data.length - 1; i >= 1; i--) {
            const row = data[i];
            const expiresAt = new Date(row[headers.indexOf('expiresAt')]);
            
            if (now > expiresAt) {
                sheet.deleteRow(i + 1);
            }
        }
        
    } catch (error) {
        console.error('만료된 세션 정리 오류:', error);
    }
}

/**
 * 초기 설정 함수 (최초 한 번만 실행)
 */
function setupInitialData() {
    try {
        const spreadsheet = SpreadsheetApp.openById(ADMIN_SPREADSHEET_ID);
        
        // Users 시트 생성 및 헤더 설정
        let usersSheet = spreadsheet.getSheetByName(USERS_SHEET_NAME);
        if (!usersSheet) {
            usersSheet = spreadsheet.insertSheet(USERS_SHEET_NAME);
            usersSheet.getRange(1, 1, 1, 7).setValues([
                ['id', 'username', 'password', 'role', 'status', 'createdAt', 'lastLoginAt']
            ]);
            
            // 기본 관리자 계정 생성 (비밀번호: admin123의 SHA-256 해시)
            const adminPasswordHash = '240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9';
            usersSheet.appendRow([
                1,
                'admin',
                adminPasswordHash,
                'admin',
                'active',
                new Date(),
                null
            ]);
        }
        
        // Sessions 시트 생성 및 헤더 설정
        let sessionsSheet = spreadsheet.getSheetByName(SESSIONS_SHEET_NAME);
        if (!sessionsSheet) {
            sessionsSheet = spreadsheet.insertSheet(SESSIONS_SHEET_NAME);
            sessionsSheet.getRange(1, 1, 1, 6).setValues([
                ['token', 'userId', 'username', 'role', 'createdAt', 'expiresAt']
            ]);
        }
        
        console.log('초기 데이터 설정 완료');
        
    } catch (error) {
        console.error('초기 설정 오류:', error);
    }
}
