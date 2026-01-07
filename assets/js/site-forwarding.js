/**
 * 사용 방법:
 * Slack 명령어로 설정 변경:
 * /forwarding-set brands="푸드올로지" excludeDays="월,수" landingUrl="https://..."
 * → style-guide 저장소의 src/forwarding.js가 자동으로 업데이트됨
 * → 이 스크립트가 자동으로 새 설정을 읽어옴
 */

(function() {
    'use strict';
  
    // ========================================
    // GitHub 저장소 설정
    // ========================================
    const GITHUB_RAW_URL = 'https://cdn.jsdelivr.net/gh/adapt-dev-ops/style-guide@latest/src/forwarding.js';
  
    // ========================================
    // 브랜드 도메인 매핑
    // ========================================
    const BRAND_MAP = {
      'food-ology.co.kr': '푸드',
      'manfidence.cafe24.com/skin-skin249': '푸드테스트',
      'obge.co.kr': '오브제',
      '95problems.com': '95',
      'full-y.co.kr': '풀리',
      '8apm.co.kr': '8apm',
      'epais.kr': '에이페',
      'duorexin.com': '듀오렉신'
    };

    /**
     * GitHub에서 설정 가져오기
     */
    async function fetchConfig() {
      try {
        const response = await fetch(GITHUB_RAW_URL + '?t=' + Date.now(), {
          cache: 'no-cache'
        });
        
        if (!response.ok) {
          console.error('[Forwarding] GitHub에서 설정을 가져오는데 실패:', response.status);
          return null;
        }
  
        const text = await response.text();
        
        // ES Module export 파싱
        // "export default { settings: [...] }" 형식 파싱
        const match = text.match(/export\s+default\s+(\{[\s\S]*\})/);
        if (!match) {
          console.error('[Forwarding] 설정 파싱 실패');
          return null;
        }
  
        // JSON으로 변환
        // 보안: GitHub 저장소는 신뢰할 수 있으므로 안전
        const configStr = match[1];
        const config = eval('(' + configStr + ')');
        
        return config;
      } catch (error) {
        console.error('[Forwarding] 설정 로드 중 오류:', error);
        return null;
      }
    }
  
    /**
     * 현재 브랜드 감지 (경로 포함)
     */
    function getCurrentBrand() {
      const hostname = window.location.hostname;
      const pathname = window.location.pathname;
      const fullPath = hostname + pathname;
      
      // 1. 먼저 전체 경로(도메인 + 경로)로 매칭 시도
      for (const [key, brand] of Object.entries(BRAND_MAP)) {
        if (key.includes('/')) {
          // 경로를 포함한 키인 경우
          if (fullPath.startsWith(key)) {
            console.log('[Forwarding] 경로 매칭 성공:', key, '→', brand);
            return brand;
          }
        }
      }
      
      // 2. 경로 매칭 실패 시 도메인만으로 매칭
      const brandByHostname = BRAND_MAP[hostname];
      if (brandByHostname) {
        console.log('[Forwarding] 도메인 매칭 성공:', hostname, '→', brandByHostname);
        return brandByHostname;
      }
      
      return null;
    }
  
    /**
     * 현재 요일 가져오기
     */
    function getCurrentDay() {
      const days = ['일', '월', '화', '수', '목', '금', '토'];
      return days[new Date().getDay()];
    }
  
    /**
     * 포워딩 체크 및 실행
     */
    async function checkAndForward() {
    // 우회 파라미터 체크 (관리자용)
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.has('12345qwert')) {
      console.log('[Forwarding] 우회 파라미터 감지. 리다이렉트 건너뜀.');
      return;
    }

      const currentBrand = getCurrentBrand();
      const currentDay = getCurrentDay();
  
      // 브랜드를 감지할 수 없으면 종료
      if (!currentBrand) {
        console.log('[Forwarding] 알 수 없는 브랜드 도메인:', window.location.hostname + window.location.pathname);
        return;
      }
  
      console.log('[Forwarding] 현재 브랜드:', currentBrand, '/ 요일:', currentDay);
  
      // GitHub에서 설정 가져오기
      console.log('[Forwarding] GitHub에서 설정 로드 중...');
      const config = await fetchConfig();
  
      if (!config || !config.settings) {
        console.log('[Forwarding] 설정을 가져올 수 없습니다.');
        return;
      }
  
      console.log('[Forwarding] 설정 로드 완료:', config.settings.length, '개 설정');
  
      // 매칭되는 설정 찾기
      for (const setting of config.settings) {
        // 브랜드 매칭
        if (!setting.brands || !setting.brands.includes(currentBrand)) {
          continue;
        }
  
        console.log('[Forwarding] 브랜드 매칭:', setting.brands);
  
        // 제외 요일 체크
        if (setting.excludeDays && setting.excludeDays.includes(currentDay)) {
          console.log('[Forwarding]', currentDay + '은(는) 제외 요일입니다. 포워딩 실행!');
  
          // 세션당 1회만 리다이렉트 (무한 루프 방지)
          const forwardKey = 'forwarding_executed_' + new Date().toDateString();
          
          // 리다이렉트 실행
          sessionStorage.setItem(forwardKey, 'true');
          console.log('[Forwarding] 리다이렉트:', setting.landingUrl);
          
          setTimeout(function() {
            window.location.href = setting.landingUrl;
          }, 100);
          
          return;
        }
      }
  
      console.log('[Forwarding] 매칭되는 설정이 없거나 오늘은 포워딩 제외 요일이 아닙니다.');
    }
  
    // 페이지 로드 시 실행
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', checkAndForward);
    } else {
      checkAndForward();
    }
  
})();
