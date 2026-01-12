/**
 * 사이트 포워딩 스크립트 (CDN 버전)
 * jsDelivr를 통해 제공됨
 * 
 * 사용 방법:
 * 카페24 관리자 → 쇼핑몰 디자인 설정 → 스크립트 설정에 추가:
 * <script src="https://cdn.jsdelivr.net/gh/adapt-dev-ops/style-guide@latest/assets/js/site-forwarding.js"></script>
 * 
 * 참고: @latest를 사용하면 자동으로 최신 버전을 가져옵니다.
 * 설정 변경 후 최대 5-10분 내에 자동으로 반영됩니다.
 * 
 * Slack 명령어로 설정 변경:
 * /forwarding-set brands="푸드올로지" openDays="월,수" url="https://..."
 * → style-guide 저장소의 assets/js/site-forwarding.js가 자동으로 업데이트됨
 * → 설정이 스크립트에 직접 포함되어 있어 별도 fetch 불필요
 */

(function() {
    'use strict';
  
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
  
    // ========================================
    // 포워딩 설정 (Lambda가 자동으로 업데이트)
    // ========================================
    const FORWARDING_SETTINGS = [
    {
      "brands": [
        "푸드"
      ],
      "openDays": [
        "수",
        "목",
        "토",
        "일"
      ],
      "landingUrl": "https://food-ology.co.kr/event/bestsale26.html",
      "targetPath": "/event/friendsale25.html"
    },
    {
      "brands": [
        "푸드"
      ],
      "openDays": [
        "목",
        "수",
        "토",
        "일",
        "월"
      ],
      "landingUrl": "https://food-ology.co.kr/event/bestsale26.html",
      "targetPath": "/event/friendsale26.html"
    }
  ];
  
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
    function checkAndForward() {
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
      console.log('[Forwarding] 설정 개수:', FORWARDING_SETTINGS.length, '개');
  
      // 현재 페이지 경로 정보
      const currentPath = window.location.pathname;
      const currentSearch = window.location.search;
      const currentPathWithQuery = currentPath + currentSearch;
      const currentPathOnly = currentPath;
  
      // 매칭되는 설정 찾기
      for (const setting of FORWARDING_SETTINGS) {
        console.log('[Forwarding] 설정 확인:', {
          brands: setting.brands,
          currentBrand: currentBrand,
          targetPath: setting.targetPath,
          currentPath: currentPathWithQuery,
          matches: setting.brands && setting.brands.includes(currentBrand)
        });
        
        // 브랜드 매칭
        if (!setting.brands || !setting.brands.includes(currentBrand)) {
          console.log('[Forwarding] 브랜드 매칭 실패:', setting.brands, 'vs', currentBrand);
          continue;
        }
  
        // targetPath가 지정된 경우, 현재 경로와 매칭 확인
        if (setting.targetPath) {
          // targetPath가 쿼리 파라미터를 포함하는지 확인
          const targetPathWithQuery = setting.targetPath.includes('?') ? setting.targetPath : setting.targetPath;
          const targetPathOnly = setting.targetPath.split('?')[0];
          
          // 경로 매칭 (쿼리 파라미터 포함 또는 제외)
          const pathMatches = currentPathWithQuery === setting.targetPath || 
                             currentPathWithQuery.startsWith(setting.targetPath + '?') ||
                             currentPathWithQuery.startsWith(setting.targetPath + '&') ||
                             currentPathOnly === targetPathOnly;
          
          if (!pathMatches) {
            console.log('[Forwarding] 경로 매칭 실패:', setting.targetPath, 'vs', currentPathWithQuery);
            continue;
          }
          
          console.log('[Forwarding] 경로 매칭 성공:', setting.targetPath);
        }
  
        console.log('[Forwarding] 브랜드 매칭:', setting.brands);
  
        // 플친 오픈일 체크 (플친 오픈일이면 포워딩 안 함)
        const openDays = setting.openDays || setting.excludeDays; // 호환성 유지
        if (openDays && openDays.includes(currentDay)) {
          console.log('[Forwarding]', currentDay + '은(는) 플친 오픈일입니다. 포워딩 건너뜀.');
          return;
        }
  
        // 플친 오픈일이 아닌 요일이면 랜딩 URL로 이동
        console.log('[Forwarding]', currentDay + '은(는) 플친 오픈일이 아닙니다. 포워딩 실행!');
        console.log('[Forwarding] 리다이렉트:', setting.landingUrl);
        
        // 리다이렉트 실행
        setTimeout(function() {
          window.location.href = setting.landingUrl;
        }, 100);
        
        return;
      }
  
      console.log('[Forwarding] 매칭되는 설정이 없습니다.');
    }
  
    // 페이지 로드 시 실행
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', checkAndForward);
    } else {
      checkAndForward();
    }
  
})();
  