/**
 * 사이트 포워딩 스크립트
 * 
 * 사용 방법:
 * 카페24에 아래 스크립트 추가:
 * <script src="https://d3eb4iplp7zplj.cloudfront.net/js/site-forwarding.js"></script>
 * 
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
      'drdayr.co.kr': 'drdayr',
      'epais.kr': '에이페',
      'duorexin.com': '듀오렉신',
      'm.drdayr.co.kr': 'drdayr',
      'm.food-ology.co.kr': '푸드',
      'm.obge.co.kr': '오브제',
      'm.95problems.com': '95',
      'manfidence.cafe24.com/skin-skin': '푸드',
      'obge.cafe24.com/skin-skin': '오브제',
      'problem95.cafe24.com/skin-skin': '95',
      'duorexin.cafe24.com/skin-skin': '듀오렉신',
      'fully08.cafe24.com/skin-skin': '풀리',
      'apm8.cafe24.com/skin-skin': '8apm',
      'epais2.cafe24.com/skin-skin': '에이페',
      'manfidence.cafe24.com/skin-mobile': '푸드',
      'obge.cafe24.com/skin-mobile': '오브제',
      'problem95.cafe24.com/skin-mobile': '95',
      'duorexin.cafe24.com/skin-mobile': '듀오렉신',
      'fully08.cafe24.com/skin-mobile': '풀리',
      'apm8.cafe24.com/skin-mobile': '8apm',
      'epais2.cafe24.com/skin-mobile': '에이페'
    };
  
    /**
    * 포워딩 설정 (Lambda가 자동으로 업데이트)
    */
    const FORWARDING_SETTINGS = [
    {
      "brands": [
        "푸드"
      ],
      "openDays": [],
      "landingUrl": "https://food-ology.co.kr/event/bestsale26.html",
      "targetPath": "/event/secretsale.html",
      "reservedDay": "",
      "removeDay": ""
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
      "targetPath": "/event/friendsale26.html",
      "reservedDay": "2026-06-20",
      "removeDay": "2026-06-22"
    },
    {
      "brands": [
        "푸드"
      ],
      "openDays": [],
      "landingUrl": "https://food-ology.co.kr/event/bestsale26.html",
      "targetPath": "/event/membershipsale.html",
      "reservedDay": "",
      "removeDay": ""
    },
    {
      "brands": [
        "푸드"
      ],
      "openDays": [],
      "landingUrl": "https://food-ology.co.kr/event/bestsale26.html",
      "targetPath": "/event/specialmember.html",
      "reservedDay": "",
      "removeDay": ""
    },
    {
      "brands": [
        "푸드"
      ],
      "openDays": [],
      "landingUrl": "https://food-ology.co.kr/event/bestsale26.html",
      "targetPath": "/event/familysale.html?type=friendtalk",
      "reservedDay": "",
      "removeDay": ""
    },
    {
      "brands": [
        "오브제"
      ],
      "openDays": [],
      "landingUrl": "https://obge.co.kr/event/bestsale26.html",
      "targetPath": "/event/secretsale.html",
      "reservedDay": "",
      "removeDay": ""
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
      "targetPath": "/event/friendsale26.html",
      "reservedDay": "2026-06-20",
      "removeDay": "2026-06-22"
    },
    {
      "brands": [
        "오브제"
      ],
      "openDays": [],
      "landingUrl": "https://obge.co.kr/event/friendsale26.html",
      "targetPath": "/event/membershipsale.html",
      "reservedDay": "",
      "removeDay": ""
    },
    {
      "brands": [
        "오브제"
      ],
      "openDays": [],
      "landingUrl": "https://obge.co.kr/event/friendsale26.html",
      "targetPath": "/event/specialmember.html",
      "reservedDay": "",
      "removeDay": ""
    },
    {
      "brands": [
        "95"
      ],
      "openDays": [],
      "landingUrl": "https://95problems.com/event/bestsale26.html",
      "targetPath": "/event/secretsale.html",
      "reservedDay": "",
      "removeDay": ""
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
      "targetPath": "/event/friendsale26.html",
      "reservedDay": "2026-06-20",
      "removeDay": "2026-06-22"
    },
    {
      "brands": [
        "95"
      ],
      "openDays": [],
      "landingUrl": "https://95problems.com/event/bestsale26.html",
      "targetPath": "/event/familysale.html?type=friendtalk",
      "reservedDay": "",
      "removeDay": ""
    },
    {
      "brands": [
        "풀리"
      ],
      "openDays": [],
      "landingUrl": "https://full-y.co.kr/event/bestsale26.html",
      "targetPath": "/event/secretsale.html",
      "reservedDay": "",
      "removeDay": ""
    },
    {
      "brands": [
        "풀리"
      ],
      "openDays": [],
      "landingUrl": "https://full-y.co.kr/event/bestsale26.html",
      "targetPath": "/event/summerbf26.html"
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
      "landingUrl": "https://full-y.co.kr/event/bestsale26.html",
      "targetPath": "/event/friendsale26.html",
      "reservedDay": "2026-06-20",
      "removeDay": "2026-06-22"
    },
    {
      "brands": [
        "풀리"
      ],
      "openDays": [],
      "landingUrl": "https://full-y.co.kr/event/bestsale26.html",
      "targetPath": "/event/familysale.html?type=friendtalk",
      "reservedDay": "",
      "removeDay": ""
    },
    {
      "brands": [
        "drdayr"
      ],
      "openDays": [],
      "landingUrl": "https://drdayr.co.kr/product/list.html?cate_no=24",
      "targetPath": "/event/secretsale.html",
      "reservedDay": "",
      "removeDay": ""
    },
    {
      "brands": [
        "drdayr"
      ],
      "openDays": [
        "수",
        "목",
        "토",
        "일"
      ],
      "landingUrl": "https://drdayr.co.kr/product/list.html?cate_no=24",
      "targetPath": "/event/friendsale26.html",
      "reservedDay": "2026-06-20",
      "removeDay": "2026-06-22"
    },
    {
      "brands": [
        "drdayr"
      ],
      "openDays": [],
      "landingUrl": "https://drdayr.co.kr/product/list.html?cate_no=24",
      "targetPath": "/product/list.html?cate_no=24&page_type=friendsale26",
      "reservedDay": "",
      "removeDay": ""
    },
    {
      "brands": [
        "drdayr"
      ],
      "openDays": [],
      "landingUrl": "https://drdayr.co.kr/product/list.html?cate_no=51",
      "targetPath": "/product/list.html?cate_no=51&page_type=friendsale26",
      "reservedDay": "",
      "removeDay": ""      
    },
    {
      "brands": [
        "듀오렉신"
      ],
      "openDays": [],
      "landingUrl": "https://duorexin.com/product/detail.html?product_no=11",
      "targetPath": "/product/detail.html?product_no=30",
      "reservedDay": "",
      "removeDay": ""
    },
    {
      "brands": [
        "듀오렉신"
      ],
      "openDays": [],
      "landingUrl": "https://duorexin.com/product/detail.html?product_no=11",
      "targetPath": "/product/detail.html?product_no=31",
      "reservedDay": "",
      "removeDay": ""
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
      "targetPath": "/product/detail.html?product_no=32",
      "reservedDay": "2026-06-20",
      "removeDay": "2026-06-22"
    },
    {
      "brands": [
        "듀오렉신"
      ],
      "openDays": [],
      "landingUrl": "https://duorexin.com/product/detail.html?product_no=11",
      "targetPath": "/product/detail.html?product_no=36",
      "reservedDay": "",
      "removeDay": ""
    },
    {
      "brands": [
        "듀오렉신"
      ],
      "openDays": [],
      "landingUrl": "https://duorexin.com/product/detail.html?product_no=11",
      "targetPath": "/product/detail.html?product_no=37",
      "reservedDay": "",
      "removeDay": ""
    },
    {
      "brands": [
        "듀오렉신"
      ],
      "openDays": [],
      "landingUrl": "https://duorexin.com/product/detail.html?product_no=11",
      "targetPath": "/product/detail.html?product_no=38",
      "reservedDay": "",
      "removeDay": ""
    },
    {
      "brands": [
        "듀오렉신"
      ],
      "openDays": [],
      "landingUrl": "https://duorexin.com/product/detail.html?product_no=11",
      "targetPath": "/product/detail.html?product_no=39",
      "reservedDay": "2026-05-30",
      "removeDay": "2026-06-01"
    },
    {
      "brands": [
        "듀오렉신"
      ],
      "openDays": [],
      "landingUrl": "https://duorexin.com/product/detail.html?product_no=11",
      "targetPath": "/product/detail.html?product_no=40",
      "reservedDay": "",
      "removeDay": ""
    },
    {
      "brands": [
        "에이페"
      ],
      "openDays": [
        "토",
        "일"
      ],
      "landingUrl": "https://epais.kr/product/detail.html?product_no=83",
      "targetPath": "/product/detail.html?product_no=95",
      "reservedDay": "2026-06-20",
      "removeDay": "2026-06-22"
    },
    {
      "brands": [
        "에이페"
      ],
      "openDays": [],
      "landingUrl": "https://epais.kr/product/detail.html?product_no=83",
      "targetPath": "/product/detail.html?product_no=98",
      "reservedDay": "",
      "removeDay": ""      
    },
    {
      "brands": [
        "에이페"
      ],
      "openDays": [],
      "landingUrl": "https://epais.kr/product/detail.html?product_no=83",
      "targetPath": "/product/detail.html?product_no=103",
      "reservedDay": "",
      "removeDay": ""
    }
  ];

  /**
   * 소셜 로그인 숨김 브랜드 목록
   * 이슈 발생 시 브랜드명 추가: ["푸드", "오브제", "95", "풀리", "듀오렉신", "에이페", "drdayr", "8apm"]
   * 평상시엔 빈 배열로 유지
   */
  const LOGIN_HIDE_BRANDS = [];

  /**
   * 사이트 다운 시 네이버 스마트스토어 리다이렉트 대상 URL
   * 브랜드별 스토어 메인 URL — 스마트스토어 없는 브랜드는 제외
   */
  const NAVER_REDIRECT = {
    '푸드':    'https://brand.naver.com/foodology',
    '오브제':  'https://brand.naver.com/obge',
    '95':      'https://smartstore.naver.com/adapt',
    '풀리':    'https://brand.naver.com/full-y',
    '8apm':    'https://brand.naver.com/8apm',
    'drdayr':  'https://brand.naver.com/8apm',
    '에이페':  'https://brand.naver.com/epais'
  };

  /**
   * 사이트 다운 수동 on/off
   * 접속 이상 감지 시 브랜드명 추가 → 해당 브랜드 유입 전체를 네이버 스토어로 전환
   * 예: ['푸드', '오브제']
   */
  const SITE_DOWN_BRANDS = [];

  /**
   * 페이지 단위 다운 수동 on/off
   * 특정 상품 페이지 이슈 시 해당 항목 주석 해제 → 네이버 동일 상품 페이지로 전환
   * 복구 후 다시 주석 처리
   */
  const PAGE_DOWN_REDIRECTS = [
    // 푸드올로지
    { enabled: false, brand: '푸드', productNo: '1213', name: '다이어트 유산균',    naverUrl: 'https://brand.naver.com/foodology/products/10811153730' },
    { enabled: false, brand: '푸드', productNo: '2495', name: '헤이 그로우',        naverUrl: 'https://brand.naver.com/foodology/products/13303691744' },
    { enabled: false, brand: '푸드', productNo: '1979', name: '올리브오일',         naverUrl: 'https://brand.naver.com/foodology/products/12022418475' },
    { enabled: false, brand: '푸드', productNo: '2196', name: '오일만 클렌즈',      naverUrl: 'https://brand.naver.com/foodology/products/12717366675' },
    { enabled: false, brand: '푸드', productNo: '233',  name: '2주 SET',            naverUrl: 'https://brand.naver.com/foodology/products/10067959187' },
    { enabled: false, brand: '푸드', productNo: '1207', name: '톡스 ABC',           naverUrl: 'https://brand.naver.com/foodology/products/11706457076' },
    { enabled: false, brand: '푸드', productNo: '2050', name: '톡스 CCA',           naverUrl: 'https://brand.naver.com/foodology/products/12241760572' },
    { enabled: false, brand: '푸드', productNo: '2331', name: '올리브 레몬샷',      naverUrl: 'https://brand.naver.com/foodology/products/13027130778' },
    { enabled: false, brand: '푸드', productNo: '1993', name: '레몬그린티',         naverUrl: 'https://brand.naver.com/foodology/products/12022506788' },
    { enabled: false, brand: '푸드', productNo: '991',  name: '다이어트 1+1',       naverUrl: 'https://brand.naver.com/foodology/best?cp=1' },
    // 오브제
    { enabled: false, brand: '오브제', productNo: '818',  name: '포어 제로 선스틱',    naverUrl: 'https://brand.naver.com/obge/products/8638040002' },
    { enabled: false, brand: '오브제', productNo: '1096', name: '오일 컨트롤 피니셔',  naverUrl: 'https://brand.naver.com/obge/products/12521598451' },
    { enabled: false, brand: '오브제', productNo: '1460', name: '액티브 선스틱',       naverUrl: 'https://brand.naver.com/obge/products/13223782192' },
    { enabled: false, brand: '오브제', productNo: '474',  name: '커버 로션',           naverUrl: 'https://brand.naver.com/obge/products/10310142352' },
    { enabled: false, brand: '오브제', productNo: '1251', name: '맥스 선크림',         naverUrl: 'https://brand.naver.com/obge/products/13040704392' },
    { enabled: false, brand: '오브제', productNo: '1557', name: '톤업 선스틱',         naverUrl: 'https://brand.naver.com/obge/products/13634275558' },
    { enabled: false, brand: '오브제', productNo: '9',    name: '파운데이션',          naverUrl: 'https://brand.naver.com/obge/products/6805527445' },
    { enabled: false, brand: '오브제', productNo: '728',  name: '포어 제로 3종 세트',  naverUrl: 'https://brand.naver.com/obge/products/12144835978' },
    { enabled: false, brand: '오브제', productNo: '528',  name: '클레이팩',            naverUrl: 'https://brand.naver.com/obge/products/11146596595' },
    { enabled: false, brand: '오브제', productNo: '10',   name: '커버 쿠션',           naverUrl: 'https://brand.naver.com/obge/products/6805521311' },
    // 95PROBLEM
    { enabled: false, brand: '95', productNo: '608',  name: '슬림 벨트',        naverUrl: 'https://brand.naver.com/balancefit/products/10413773394' },
    { enabled: false, brand: '95', productNo: '517',  name: '종아리 마사지기',   naverUrl: 'https://brand.naver.com/balancefit/products/9898622480' },
    { enabled: false, brand: '95', productNo: '655',  name: '체어 마사지기',     naverUrl: 'https://brand.naver.com/balancefit/products/10824643912' },
    { enabled: false, brand: '95', productNo: '554',  name: '압박스타킹 세트',   naverUrl: 'https://brand.naver.com/balancefit/products/7077204865' },
    { enabled: false, brand: '95', productNo: '1291', name: '브이라인 밴드',     naverUrl: 'https://brand.naver.com/balancefit/products/12913541553' },
    { enabled: false, brand: '95', productNo: '1347', name: '리커버리 밴드',     naverUrl: 'https://brand.naver.com/balancefit/products/13176596599' },
    { enabled: false, brand: '95', productNo: '1452', name: '하비컷 레깅스',     naverUrl: 'https://brand.naver.com/balancefit/products/13635950633' },
    { enabled: false, brand: '95', productNo: '12',   name: 'BEST',             naverUrl: 'https://brand.naver.com/balancefit/best?cp=1' },
    // 풀리
    { enabled: false, brand: '풀리', productNo: '463', name: '멜팅 크림 투 오일',   naverUrl: 'https://brand.naver.com/full-y/products/13326717348' },
    { enabled: false, brand: '풀리', productNo: '465', name: '노세범 젤리 파우더',  naverUrl: 'https://brand.naver.com/full-y/products/13381655896' },
    { enabled: false, brand: '풀리', productNo: '28',  name: '클레이 팩 클렌저',    naverUrl: 'https://brand.naver.com/full-y/products/10482279005' },
    { enabled: false, brand: '풀리', productNo: '117', name: '쌀 선크림',           naverUrl: 'https://brand.naver.com/full-y/products/11859576037' },
    { enabled: false, brand: '풀리', productNo: '535', name: '노세범 선스틱',        naverUrl: 'https://brand.naver.com/full-y/products/13558473296' },
    { enabled: false, brand: '풀리', productNo: '291', name: '톤업 선크림',          naverUrl: 'https://brand.naver.com/full-y/products/13026521247' },
    { enabled: false, brand: '풀리', productNo: '132', name: '쌀 팩 클렌저',         naverUrl: 'https://brand.naver.com/full-y/products/12071284453' },
    { enabled: false, brand: '풀리', productNo: '85',  name: '쌀 세라마이드 3종',    naverUrl: 'https://brand.naver.com/full-y/category/e68b1036c7c242d6bdd6aeb09028aeb3?cp=1' },
    // 에이페
    { enabled: false, brand: '에이페', productNo: '83', name: '부스팅 앰플', naverUrl: 'https://brand.naver.com/epais/products/12584537361' },
    // 닥터데이알
    { enabled: false, brand: 'drdayr', productNo: '51',  name: '멜라시럽',      naverUrl: 'https://brand.naver.com/8apm/products/12106955446' },
    { enabled: false, brand: 'drdayr', productNo: '25',  name: '포커스 젤',     naverUrl: 'https://brand.naver.com/8apm/products/11471195503' },
    { enabled: false, brand: 'drdayr', productNo: '150', name: '오메가3 유산균', naverUrl: 'https://brand.naver.com/8apm/products/13497890461' },
    { enabled: false, brand: 'drdayr', productNo: '11',  name: '멜라피스',      naverUrl: 'https://brand.naver.com/8apm/products/10893086064' },
    // 8APM
    { enabled: false, brand: '8apm', productNo: '51', name: '멜라시럽', naverUrl: 'https://brand.naver.com/8apm/products/12106955446' },
    { enabled: false, brand: '8apm', productNo: '11', name: '멜라피스', naverUrl: 'https://brand.naver.com/8apm/products/10893086064' },
    // [테스트] 확인 후 enabled: false로 변경
    { enabled: true,  brand: '푸드', productNo: '2691', name: '톡스올로지 클렌즈 48시간 ABC', naverUrl: 'https://brand.naver.com/foodology/products/11706457076' },
  ];

    /**
     * 호스트명에서 앞쪽 www. 제거 — apex와 www 접속을 동일하게 매칭할 때 사용
     */
    function hostnameWithoutWww(host) {
      return String(host || '').replace(/^www\./i, '');
    }

    /**
     * 현재 브랜드 감지 (경로 포함, 패턴 매칭 지원)
     */
    function getCurrentBrand() {
      const rawHostname = window.location.hostname;
      const hostname = hostnameWithoutWww(rawHostname);
      const pathname = window.location.pathname;
      const fullPath = hostname + pathname;

      console.log('[Forwarding] 브랜드 감지 시도 - hostname:', rawHostname, ', 매칭용 호스트:', hostname, ', pathname:', pathname, ', fullPath:', fullPath);
      
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
              
              // URL 비교 (도메인은 www. 무시 후 동일 여부, 경로·쿼리는 그대로 비교)
              const isLandingUrl =
                hostnameWithoutWww(landingUrlObj.hostname) === hostnameWithoutWww(currentUrlObj.hostname) &&
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
          const targetHasQuery = setting.targetPath.includes('?');
          
          let pathMatches = false;
          
          // targetPath에 쿼리 파라미터가 있는 경우: 개별 파라미터 비교
          if (targetHasQuery) {
            // 경로 부분 매칭 확인
            const pathPartMatches = 
              currentPathOnly === targetPathOnly || 
              currentPathOnly.endsWith(targetPathOnly);
            
            if (pathPartMatches) {
              // 쿼리 파라미터 개별 비교 (targetPath의 모든 파라미터가 현재 URL에 포함되어 있는지 확인)
              const targetQueryString = setting.targetPath.split('?')[1] || '';
              const targetParams = new URLSearchParams(targetQueryString);
              const currentParams = new URLSearchParams(currentSearch);
              
              let allParamsMatch = true;
              for (const [key, value] of targetParams.entries()) {
                if (currentParams.get(key) !== value) {
                  allParamsMatch = false;
                  break;
                }
              }
              
              pathMatches = allParamsMatch;
            }
          } else {
            // targetPath에 쿼리 파라미터가 없는 경우: 기존 로직 사용
            // 1. 정확한 매칭
            // 2. 경로 끝부분 매칭 (skin-skin249/event/friendsale25.html → /event/friendsale25.html)
            // 3. 쿼리 파라미터 고려한 매칭
            pathMatches = 
              // 정확한 매칭
              currentPathWithQuery === targetPathWithQuery ||
              currentPathOnly === targetPathOnly ||
              // 경로 끝부분 매칭 (테스트 도메인의 /skin-skin249 같은 앞쪽 경로 무시)
              currentPathWithQuery.endsWith(targetPathWithQuery) ||
              currentPathOnly.endsWith(targetPathOnly) ||
              // 쿼리 파라미터가 있는 경우
              currentPathWithQuery.startsWith(targetPathWithQuery + '?') ||
              currentPathWithQuery.startsWith(targetPathWithQuery + '&') ||
              // 경로 끝부분 + 쿼리 파라미터 조합
              (currentPathOnly.endsWith(targetPathOnly) && currentPathWithQuery.includes('?'));
          }
          
          if (pathMatches) {
            console.log('[Forwarding] 경로 매칭 성공 (targetPath 있음):', setting.targetPath, '← 현재 경로:', currentPathWithQuery);
            matchedSetting = setting;
            break; // targetPath가 있는 설정을 찾으면 즉시 사용
          }
        }
      }
      
      // 2단계: targetPath가 있는 설정을 찾지 못한 경우, targetPath가 없는 설정으로 보조 매칭
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
  
    /**
     * data-reserved-day / data-remove-day 속성 기반 노출 제어
     * - FORWARDING_SETTINGS에 reservedDay / removeDay가 있으면 그 값을 우선 사용
     * - 없으면 HTML 속성값 사용
     */
    function applyDateVisibility() {
      var now = new Date();

      function parseDateTime(str) {
        if (!str) return null;
        if (/^\d{4}-\d{2}-\d{2}$/.test(str)) str += ' 00:00:00';
        return new Date(str.replace(/-/g, '/'));
      }

      var currentBrand = getCurrentBrand();
      var overrideReservedDay = null;
      var overrideRemoveDay = null;

      if (currentBrand) {
        var currentPathOnly = window.location.pathname;
        for (var i = 0; i < FORWARDING_SETTINGS.length; i++) {
          var s = FORWARDING_SETTINGS[i];
          if (!s.brands || !s.brands.includes(currentBrand)) continue;
          if (!s.targetPath) continue;
          if (!s.reservedDay && !s.removeDay) continue;
          var targetPathOnly = s.targetPath.split('?')[0];
          if (!currentPathOnly.endsWith(targetPathOnly) && currentPathOnly !== targetPathOnly) continue;
          overrideReservedDay = s.reservedDay || null;
          overrideRemoveDay = s.removeDay || null;
          console.log('[Forwarding] date 오버라이드:', targetPathOnly, overrideReservedDay, overrideRemoveDay);
          break;
        }
      }

      document.querySelectorAll('[data-reserved-day]').forEach(function(el) {
        var dateStr = overrideReservedDay || el.getAttribute('data-reserved-day');
        var start = parseDateTime(dateStr);
        if (start && now >= start) el.classList.remove('hide');
      });

      document.querySelectorAll('[data-remove-day]').forEach(function(el) {
        var dateStr = overrideRemoveDay || el.getAttribute('data-remove-day');
        var end = parseDateTime(dateStr);
        if (end && now >= end) el.remove();
      });
    }

  function applyLoginHide() {
    var currentBrand = getCurrentBrand();
    if (!currentBrand) return;

    var shouldHide = LOGIN_HIDE_BRANDS.includes(currentBrand);

    document.querySelectorAll('.sf-social-default').forEach(function(el) {
      el.style.display = shouldHide ? 'none' : '';
    });
    document.querySelectorAll('.sf-social-fallback').forEach(function(el) {
      el.style.display = shouldHide ? '' : 'none';
    });
  }

  /**
   * 페이지 단위 다운 수동 리다이렉트
   * PAGE_DOWN_REDIRECTS에서 현재 브랜드 + product_no 매칭 시 네이버 상품 페이지로 전환
   * @returns {boolean} 리다이렉트 실행 여부
   */
  function checkPageDown() {
    if (window.location.pathname.indexOf('/product/detail.html') === -1) return false;

    var brand = getCurrentBrand();
    if (!brand) return false;

    var productNo = new URLSearchParams(window.location.search).get('product_no');
    if (!productNo) return false;

    var match = null;
    for (var i = 0; i < PAGE_DOWN_REDIRECTS.length; i++) {
      var r = PAGE_DOWN_REDIRECTS[i];
      if (r.enabled && r.brand === brand && r.productNo === productNo) {
        match = r;
        break;
      }
    }
    if (!match) return false;

    console.log('[Forwarding] 페이지 다운 처리 → 네이버 리다이렉트:', brand, productNo, match.naverUrl);
    window.location.replace(match.naverUrl);
    return true;
  }

  /**
   * 사이트 다운 수동 리다이렉트
   * SITE_DOWN_BRANDS에 브랜드명 추가 시 해당 브랜드 전체 유입 → 네이버 스토어로 전환
   * @returns {boolean} 리다이렉트 실행 여부
   */
  function checkSiteDown() {
    var brand = getCurrentBrand();
    if (!brand || !SITE_DOWN_BRANDS.includes(brand)) return false;

    var naverUrl = NAVER_REDIRECT[brand];
    if (!naverUrl) {
      console.log('[Forwarding] 사이트 다운 처리 - 브랜드:', brand, '/ 네이버 스토어 없음. 리다이렉트 건너뜀.');
      return false;
    }

    console.log('[Forwarding] 사이트 다운 처리 → 네이버 스토어 리다이렉트:', brand, naverUrl);
    window.location.replace(naverUrl);
    return true;
  }

    // 페이지 로드 시 실행
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', function() {
        applyDateVisibility();
        applyLoginHide();
        if (!checkPageDown() && !checkSiteDown()) {
          checkAndForward();
        }
      });
    } else {
      applyDateVisibility();
      applyLoginHide();
      check404Redirect();
      if (!checkSiteDown()) {
        checkAndForward();
      }
    }
})();