/**
 * 사이트 포워딩 스크립트 (CDN 버전)
 * jsDelivr를 통해 제공됨
 * 
 * 사용 방법:
 * 카페24 스크립트 추가:
 * <script src="https://cdn.jsdelivr.net/gh/adapt-dev-ops/style-guide@1/assets/js/site-forwarding.js"></script>
 * 
 * 참고: @1를 사용하면 자동으로 최신 버전을 가져옵니다.
 * 설정 변경 후 최대 5-10분 내에 자동으로 반영됩니다.
 * 
 * Slack 명령어로 설정 변경:
 * /forwarding-set 엔터
 * → style-guide 저장소의 assets/js/site-forwarding.js가 자동으로 업데이트됨
 * → 설정이 스크립트에 직접 포함되어 있어 별도 fetch 불필요
 */

(function() {
    'use strict';
    const BRAND_MAP = {
      'food-ology.co.kr': '푸드',
      'obge.co.kr': '오브제',
      '95problems.com': '95',
      'full-y.co.kr': '풀리',
      '8apm.co.kr': '8apm',
      'epais.kr': '에이페',
      'duorexin.com': '듀오렉신',
      'm.food-ology.co.kr': '푸드',
      'm.obge.co.kr': '오브제',
      'm.95problems.com': '95',
      'manfidence.cafe24.com/skin-skin': '푸드',
      'obge.cafe24.com/skin-skin': '오브제',
      'problem95.cafe24.com/skin-skin': '95',
      'duorexin.cafe24.com/skin-skin': '듀오렉신',
      'fully08.cafe24.com/skin-skin': '풀리',
      'apm8.cafe24.com/skin-skin': '8apm',
      'epais2.cafe24.com/skin-skin': '에이페'
    };
  
    /**
    * 포워딩 설정 (Lambda가 자동으로 업데이트)
    */
    const FORWARDING_SETTINGS = [
    {
      "brands": [
        "푸드"
      ],
      "openDays": [
        "월",
        "수",
        "목",
        "토",
        "일",
      ],
      "landingUrl": "https://food-ology.co.kr/event/bestsale26.html",
      "targetPath": "/event/friendsale26.html"
    },
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
      "targetPath": "/event/secretsale.html"
    },
    {
      "brands": [
        "오브제"
      ],
      "openDays": [],
      "landingUrl": "https://obge.co.kr/event/secretsale.html",
      "targetPath": "/event/friendsale26.html"
    },
    {
      "brands": [
        "오브제"
      ],
      "openDays": [
        "수",
        "목",
        "토",
        "일"
      ],
      "landingUrl": "https://obge.co.kr/event/bestsale26.html",
      "targetPath": "/event/secretsale.html"
    },
    {
      "brands": [
        "95"
      ],
      "openDays": [],
      "landingUrl": "https://95problems.com/event/secretsale.html",
      "targetPath": "/event/friendsale26.html"
    },
    {
      "brands": [
        "95"
      ],
      "openDays": [
        "수",
        "목",
        "토",
        "일"
      ],
      "landingUrl": "https://95problems.com/event/bestsale26.html",
      "targetPath": "/event/secretsale.html"
    },
    {
      "brands": [
        "풀리"
      ],
      "openDays": [
        "수",
        "목",
        "토",
        "일"
      ],
      "landingUrl": "https://full-y.co.kr/product/list.html?cate_no=76",
      "targetPath": "/event/secretsale.html"
    },
    {
      "brands": [
        "8apm"
      ],
      "openDays": [
        "수",
        "목",
        "토",
        "일"
      ],
      "landingUrl": "https://8apm.co.kr/product/list.html?cate_no=24",
      "targetPath": "/event/secretsale.html"
    },
    {
      "brands": [
        "듀오렉신"
      ],
      "openDays": [
        "수",
        "목",
        "토",
        "일"
      ],
      "landingUrl": "https://duorexin.com/product/detail.html?product_no=11",
      "targetPath": "/product/detail.html?product_no=31"
    },
    {
      "brands": [
        "듀오렉신"
      ],
      "openDays": [
        "수",
        "목",
        "토",
        "일"
      ],
      "landingUrl": "https://duorexin.com/product/detail.html?product_no=11",
      "targetPath": "/product/detail.html?product_no=32"
    }
  ];
  
    /**
     * 현재 브랜드 감지 (경로 포함, 패턴 매칭 지원)
     */
    function getCurrentBrand() {
      const hostname = window.location.hostname;
      const pathname = window.location.pathname;
      const fullPath = hostname + pathname;
      
      console.log('[Forwarding] 브랜드 감지 시도 - hostname:', hostname, ', pathname:', pathname, ', fullPath:', fullPath);
      
      // 1. 먼저 전체 경로(도메인 + 경로)로 매칭 시도 (패턴 매칭 포함)
      for (const [key, brand] of Object.entries(BRAND_MAP)) {
        if (key.includes('/')) {
          // 경로를 포함한 키인 경우
          // skin-skin으로 끝나는 경우 패턴 매칭 (skin-skin으로 시작하는 모든 경로)
          if (key.endsWith('/skin-skin')) {
            if (fullPath.startsWith(key)) {
              console.log('[Forwarding] 패턴 매칭 성공:', key, '→', brand, '(현재 경로:', fullPath, ')');
              return brand;
            }
          } else {
            // 정확한 경로 매칭
            if (fullPath.startsWith(key)) {
              console.log('[Forwarding] 경로 매칭 성공:', key, '→', brand);
              return brand;
            }
          }
        }
      }
      
      // 2. 경로 매칭 실패 시 도메인만으로 매칭
      const brandByHostname = BRAND_MAP[hostname];
      if (brandByHostname) {
        console.log('[Forwarding] 도메인 매칭 성공:', hostname, '→', brandByHostname);
        return brandByHostname;
      }
      
      console.log('[Forwarding] 브랜드 감지 실패 - 매칭되는 브랜드가 없습니다.');
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
  
      // 무한 루프 방지: 제품 상세 페이지인 경우에만 적용
      // 이벤트 페이지는 연속 포워딩 허용 (friendsale → secretsale → bestsale 등)
      const currentFullUrl = window.location.href;
      const isProductDetailPage = currentPath.includes('/product/detail.html');
      
      if (isProductDetailPage) {
        // 제품 상세 페이지인 경우에만 무한루프 방지 적용
        for (const setting of FORWARDING_SETTINGS) {
          if (setting.landingUrl) {
            try {
              const landingUrlObj = new URL(setting.landingUrl);
              const currentUrlObj = new URL(currentFullUrl);
              
              // URL 비교 (도메인, 경로, 쿼리 파라미터 모두 비교)
              const isLandingUrl = 
                landingUrlObj.hostname === currentUrlObj.hostname &&
                landingUrlObj.pathname === currentUrlObj.pathname &&
                landingUrlObj.search === currentUrlObj.search;
              
              if (isLandingUrl) {
                console.log('[Forwarding] 현재 페이지가 랜딩 페이지입니다. 포워딩 건너뜀 (제품 상세 무한 루프 방지).');
                console.log('[Forwarding] 현재 URL:', currentFullUrl);
                console.log('[Forwarding] 랜딩 URL:', setting.landingUrl);
                return; // 제품 상세 랜딩 페이지에서는 포워딩하지 않음
              }
            } catch (e) {
              // URL 파싱 실패 시 무시하고 계속 진행
            }
          }
        }
      } else {
        // 이벤트 페이지 등은 무한루프 방지 건너뛰기 (연속 포워딩 허용)
        console.log('[Forwarding] 이벤트 페이지 감지 - 연속 포워딩 허용');
      }
      
      // 매칭되는 설정 찾기 (targetPath가 있는 설정을 우선적으로 매칭)
      // 1단계: targetPath가 있는 설정 중에서 매칭되는 것 찾기
      let matchedSetting = null;
      
      for (const setting of FORWARDING_SETTINGS) {
        // 브랜드 매칭
        if (!setting.brands || !setting.brands.includes(currentBrand)) {
          continue;
        }
  
        // targetPath가 지정된 경우에만 경로 매칭 확인
        if (setting.targetPath) {
          const targetPathOnly = setting.targetPath.split('?')[0];
          const targetPathWithQuery = setting.targetPath;
          
          // 경로 매칭 (다양한 케이스 지원)
          // 1. 정확한 매칭
          // 2. 경로 끝부분 매칭 (skin-skin249/event/friendsale25.html → /event/friendsale25.html)
          // 3. 쿼리 파라미터 고려한 매칭
          const pathMatches = 
            // 정확한 매칭
            currentPathWithQuery === targetPathWithQuery ||
            currentPathOnly === targetPathOnly ||
            // 경로 끝부분 매칭 (테스트 도메인의 /skin-skin249 같은 prefix 무시)
            currentPathWithQuery.endsWith(targetPathWithQuery) ||
            currentPathOnly.endsWith(targetPathOnly) ||
            // 쿼리 파라미터가 있는 경우
            currentPathWithQuery.startsWith(targetPathWithQuery + '?') ||
            currentPathWithQuery.startsWith(targetPathWithQuery + '&') ||
            // 경로 끝부분 + 쿼리 파라미터 조합
            (currentPathOnly.endsWith(targetPathOnly) && currentPathWithQuery.includes('?'));
          
          if (pathMatches) {
            console.log('[Forwarding] 경로 매칭 성공 (targetPath 있음):', setting.targetPath, '← 현재 경로:', currentPathWithQuery);
            matchedSetting = setting;
            break; // targetPath가 있는 설정을 찾으면 즉시 사용
          }
        }
      }
      
      // 2단계: targetPath가 있는 설정을 찾지 못한 경우, targetPath가 없는 설정 찾기 (fallback)
      if (!matchedSetting) {
        for (const setting of FORWARDING_SETTINGS) {
          // 브랜드 매칭
          if (!setting.brands || !setting.brands.includes(currentBrand)) {
            continue;
          }
  
          // targetPath가 없는 설정만 선택 (모든 페이지에서 작동)
          if (!setting.targetPath) {
            console.log('[Forwarding] 기본 설정 매칭 (targetPath 없음 = 모든 페이지)');
            matchedSetting = setting;
            break;
          }
        }
      }
      
      // 매칭된 설정이 없으면 종료
      if (!matchedSetting) {
        console.log('[Forwarding] 매칭되는 설정이 없습니다.');
        return;
      }
      
      const setting = matchedSetting;
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
    }
  
    // 페이지 로드 시 실행
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', checkAndForward);
    } else {
      checkAndForward();
    }
  
  })();
  