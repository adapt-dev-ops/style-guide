# Site Components Guide

이 저장소는 다양한 브랜드 스타일 속에서도 반복해서 사용할 수 있는 핵심 컴포넌트들을 모아둔 스타일 가이드입니다.

**카페24, 쇼피파이, 숍라인 등 다양한 커머스/웹 플랫폼에서도 손쉽게 적용할 수 있도록 설계되어 있습니다.**

모든 컴포넌트는 Light DOM 기반으로, 외부 CSS로 자유롭게 스타일을 오버라이드할 수 있어 브랜드별 커스터마이징이 매우 쉽습니다.

## ❓ 왜 만들었나요?
여러 스타일 속에서도 자주 등장하는 컴포넌트들을 한데 모아 표준화하기 위함입니다. 이렇게 함으로써 개발 속도 증가, 유지보수 쉬워짐, 재사용 가능, 버그 감소의 효과를 누릴 수 있습니다.

특히, **Custom Elements**를 통해 표준화된 인터페이스를 정의하고 스타일과 로직이 캡슐화된 컴포넌트 개발이 가능합니다.

## 📁 디렉토리 구조
```
guide/
├─ assets/
│  ├─ css/
│  │  ├─ common.css          # 공통 스타일 (레이아웃, 기본 스타일)
│  │  └─ site-theme.css      # 컴포넌트별 테마 스타일
│  ├─ js/
│  │  ├─ common.js           # 공통 유틸리티 (코드 복사, 네비게이션 등)
│  │  └─ site-theme.js       # Custom Elements 정의 및 컴포넌트 로직
│  └─ images/                
│     └─ ...                 # 데모용 이미지
├─ index.html                # 데모 및 가이드 메인 페이지
├─ LICENSE                   # 라이선스 파일
└─ README.md                 # 프로젝트 설명서
```

## ⚡ 핵심 컴포넌트 목록
- **Swiper**: 터치 슬라이드 컴포넌트 (Swiper.js 기반)
- **Modal**: 모달 다이얼로그 컴포넌트
- **Tabs**: 탭 인터랙션 컴포넌트
- **Toast**: 알림 메시지 컴포넌트
- **Accordion**: 접고 펼치는 아코디언 컴포넌트
- **Countdown**: D-Day 카운트다운 컴포넌트
- **Scroll Reveal**: 스크롤 시 나타나는 애니메이션 컴포넌트
- **Parallax**: 패럴랙스 스크롤 효과 컴포넌트
- **Scroll Progress**: 스크롤 진행률 표시 바 컴포넌트
- **Sticky**: 스크롤 시 고정되는 요소 컴포넌트

## 🚀 빠른 시작

### 1. 파일 포함
```html
<!-- 필수: JavaScript 파일 (컴포넌트 동작) -->
<script src="assets/js/site-theme.js"></script>

<!-- 선택: CSS 파일 (기본 스타일이 필요한 경우만) -->
<link rel="stylesheet" href="assets/css/site-theme.css">

<!-- Swiper 사용 시 추가 필요 -->
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/swiper@11/swiper-bundle.min.css">
<script src="https://cdn.jsdelivr.net/npm/swiper@11/swiper-bundle.min.js"></script>
```

> **💡 최소 설치**: `site-theme.js`만 있으면 모든 컴포넌트가 동작합니다.  
> **스타일링**: CSS 없이도 동작하며, 브랜드별 자체 스타일 적용 가능합니다.  
> **Swiper 사용 시**: 추가로 Swiper CDN이 필요합니다.

### 2. Swiper 컴포넌트
```html
<site-swiper data-config='{"slidesPerView": 3, "spaceBetween": 20}'>
  <div class="swiper-slide">슬라이드1</div>
  <div class="swiper-slide">슬라이드2</div>
  <div class="swiper-slide">슬라이드3</div>
</site-swiper>
```

### 3. Modal 컴포넌트
```html
<site-modal id="myModal">
  <div class="modal-header">
    <h3>모달 제목</h3>
    <button onclick="document.getElementById('myModal').close()">×</button>
  </div>
  <div class="modal-body">
    <p>모달 내용입니다.</p>
  </div>
  <div class="modal-footer">
    <button onclick="document.getElementById('myModal').close()">닫기</button>
  </div>
</site-modal>

<button onclick="document.getElementById('myModal').open()">모달 열기</button>
```

### 4. Tabs 컴포넌트
```html
<site-tabs>
  <div class="tab-names">
    <div class="tab">탭1</div>
    <div class="tab">탭2</div>
  </div>
  <div class="tab-contents">
    <div class="content">탭1 내용입니다.</div>
    <div class="content">탭2 내용입니다.</div>
  </div>
</site-tabs>
```

### 5. Toast 컴포넌트
```html
<!-- 전역 함수로 간편하게 사용 -->
<script>
  // 기본 토스트
  showToast('메시지가 전송되었습니다.');
  
  // 타입별 토스트
  showToast('성공했습니다!', { type: 'success' });
  showToast('오류가 발생했습니다.', { type: 'error' });
  showToast('정보를 확인하세요.', { type: 'info' });
  showToast('주의하세요!', { type: 'warning' });
  
  // 지속 시간 설정
  showToast('5초 후 사라집니다.', { duration: 5000 });
</script>
```

### 6. Accordion 컴포넌트
```html
<!-- 단일 아코디언 (하나만 열림) -->
<site-accordion>
  <div class="accordion-item">
    <div class="accordion-title">첫 번째 아이템</div>
    <div class="accordion-content">
      <p>첫 번째 아이템의 내용입니다.</p>
    </div>
  </div>
  <div class="accordion-item open">
    <div class="accordion-title">두 번째 아이템 (초기 열림)</div>
    <div class="accordion-content">
      <p>두 번째 아이템의 내용입니다.</p>
    </div>
  </div>
</site-accordion>
```

### 7. Countdown 컴포넌트
```html
<!-- 기본 카운트다운 (일/시간/분/초) -->
<site-countdown data-target="2025-01-01" data-format="DHMS"></site-countdown>

<!-- 시간/분/초만 표시 -->
<site-countdown data-target="2024-12-25" data-format="HMS"></site-countdown>

<!-- 분/초만 표시 -->
<site-countdown data-target="2024-12-19 12:00" data-format="MS"></site-countdown>

<!-- 다양한 날짜 포맷 지원 -->
<site-countdown data-target="2025-01-01"></site-countdown>        <!-- 2025-01-01 -->
<site-countdown data-target="2025/01/01"></site-countdown>        <!-- 2025/01/01 -->
<site-countdown data-target="2025.01.01"></site-countdown>        <!-- 2025.01.01 -->
<site-countdown data-target="2025-01-01 15:30"></site-countdown>  <!-- 2025-01-01 15:30 -->
```

### 8. 스크롤 인터렉션 컴포넌트들

#### Scroll Reveal - 스크롤 시 나타나는 애니메이션
```html
<!-- 기본 사용법 (한 번만 실행) -->
<site-scroll-reveal data-animation="fadeInUp">
  <div class="content">애니메이션될 콘텐츠</div>
</site-scroll-reveal>

<!-- 반복 모드 설정 -->
<site-scroll-reveal 
  data-animation="fadeInLeft"
  data-repeat="always">
  <div class="content">매번 실행</div>
</site-scroll-reveal>

<site-scroll-reveal 
  data-animation="zoomIn"
  data-repeat="visible">
  <div class="content">보일 때만 실행</div>
</site-scroll-reveal>

<!-- 고급 설정 -->
<site-scroll-reveal 
  data-animation="slideInUp"
  data-duration="0.8s"
  data-delay="0.2s"
  data-threshold="0.3"
  data-repeat="once">
  <div class="content">고급 설정 콘텐츠</div>
</site-scroll-reveal>

<!-- 
애니메이션: fadeIn, fadeInUp, fadeInDown, fadeInLeft, fadeInRight, zoomIn, slideInUp, slideInLeft
반복 모드: 
- once (기본값): 한 번만 실행
- always: 뷰포트에 들어올 때마다 실행
- visible: 처음 보일 때만, 나갈 때 숨김
-->
```

#### Parallax - 패럴랙스 스크롤 효과
```html
<!-- 기본 패럴랙스 (위쪽으로 이동) -->
<site-parallax data-speed="0.5">
  <div class="parallax-element">패럴랙스 콘텐츠</div>
</site-parallax>

<!-- 방향별 패럴랙스 -->
<site-parallax data-speed="1.2" data-direction="down">아래로</site-parallax>
<site-parallax data-speed="0.8" data-direction="left">왼쪽으로</site-parallax>
<site-parallax data-speed="1.5" data-direction="right">오른쪽으로</site-parallax>

<!-- direction: up, down, left, right / speed: 클수록 빠르게 이동 (권장: 0.5~2.0) -->
```

#### Scroll Progress - 스크롤 진행률 표시 바
```html
<!-- 전체 페이지 기준 진행률 (상단 고정) -->
<site-scroll-progress 
  data-position="top" 
  data-height="4px" 
  data-color="#007bff">
</site-scroll-progress>

<!-- 특정 요소 기준 진행률 -->
<site-scroll-progress 
  data-target="#target-section"
  data-position="bottom" 
  data-height="6px" 
  data-color="#28a745">
</site-scroll-progress>

<!-- position: top, bottom / target: CSS 선택자 (없으면 전체 페이지 기준) -->
```

#### Sticky - 스크롤 시 고정되는 요소
```html
<!-- 기본 스티키 요소 -->
<site-sticky>
  <div class="sticky-content">스티키 콘텐츠</div>
</site-sticky>

<!-- 고급 설정 -->
<site-sticky data-top="80px" data-z-index="1000">
  <nav class="sticky-nav">내비게이션</nav>
</site-sticky>

<!-- CSS로 스티키 상태 스타일링 -->
<style>
.sticky-content.is-sticky {
  background: rgba(255,255,255,0.95);
  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
}
</style>
```

## 🎨 브랜드별 커스터마이징

모든 컴포넌트는 Light DOM을 사용하므로 CSS로 자유롭게 스타일을 오버라이드할 수 있습니다:

```css
/* 브랜드별 Swiper 스타일 */
.gallery-swiper .swiper-button-next,
.gallery-swiper .swiper-button-prev {
  color: #your-brand-color;
}

/* 브랜드별 Modal 스타일 */
.custom-modal .modal {
  border-radius: 20px;
  box-shadow: 0 10px 30px rgba(0,0,0,0.3);
}

/* 브랜드별 Toast 스타일 */
.site-toast-success {
  background: linear-gradient(45deg, #4CAF50, #45a049);
}

/* 브랜드별 Accordion 스타일 */
.custom-accordion .accordion-title {
  background: #your-brand-color;
  color: white;
}

/* 브랜드별 Countdown 스타일 */
.countdown-item {
  background: linear-gradient(135deg, #your-brand-color 0%, #your-secondary-color 100%);
  border-radius: 12px;
}

.countdown-value {
  color: #your-text-color;
  font-family: 'your-brand-font', monospace;
}
```

## 🖥️ 데모 / 가이드
실제 동작 예시와 코드 복사 기능, 컴포넌트별 설명은 아래 페이지에서 확인할 수 있습니다.

👉 [메인 컴포넌트 데모](https://adapt-dev-ops.github.io/style-guide/index.html)  
👉 [스크롤 인터렉션 데모](https://adapt-dev-ops.github.io/style-guide/scroll-interactions.html)

각 컴포넌트 예제 아래에 **코드 복사 버튼**과 **구문 하이라이팅**이 제공됩니다.

## ⚡️ 핵심 개념
원하는 컴포넌트를 어디서든 쉽게 사용할 수 있도록, 핵심 기능은 JS 파일 하나로 완성됩니다.  
**`site-theme.js` 파일만 프로젝트에 포함하고 예제 코드(HTML)를 그대로 복사해 붙여 넣으면 즉시 작동**됩니다. CSS는 기본 스타일이 필요한 경우에만 추가하세요.

### 특징
- ✅ **Light DOM 기반**: Shadow DOM 없이 자유로운 스타일링
- ✅ **브랜드 독립적**: CSS 오버라이드로 어떤 디자인에도 적용 가능
- ✅ **플랫폼 호환**: 카페24, 쇼피파이, 숍라인 등 다양한 플랫폼 지원
- ✅ **간단한 사용법**: HTML 태그만으로 컴포넌트 사용
- ✅ **Bootstrap 호환**: Accordion은 Bootstrap과 동일한 클래스 구조
- ✅ **TypeScript 지원**: 타입 안전성 (선택사항)

## 🔧 고급 설정

### Swiper 설정
```html
<site-swiper data-config='{
  "slidesPerView": 3,
  "spaceBetween": 20,
  "breakpoints": {
    "640": {"slidesPerView": 1},
    "768": {"slidesPerView": 2},
    "1024": {"slidesPerView": 3}
  },
  "autoplay": {"delay": 3000}
}'>
  <!-- 슬라이드들 -->
</site-swiper>
```

### Toast 전역 설정
```javascript
// 기본 설정 변경
window.showToast = (message, opts = {}) => {
  const defaultOpts = {
    duration: 3000,
    type: 'info'
  };
  // 커스텀 로직...
};
```

### Countdown 설정
```html
<!-- 표시 형식 설정 -->
<site-countdown data-target="2025-01-01" data-format="DHMS"></site-countdown>
<!-- 
  D: 일(Days)
  H: 시간(Hours) 
  M: 분(Minutes)
  S: 초(Seconds)
  조합 가능: "HMS", "MS", "DS" 등
-->

<!-- 시간이 지나면 "+" 표시로 경과 시간 계속 카운트 -->
<site-countdown data-target="2024-01-01"></site-countdown>
```

## 👥 기여하기
새로운 컴포넌트 제안, 개선 사항, 버그 리포트는 모두 PR 또는 Issues로 자유롭게 남겨 주세요.

### 개발 가이드라인
1. Light DOM 기반으로 개발
2. 브랜드 독립적인 디자인
3. 간단한 API 제공

## 📝 라이선스
[MIT](LICENSE)

## 📧 문의
원하는 컴포넌트 제안 및 문의는 Issues를 통해 남겨 주세요.

## 🔗 GitHub
[개발파트 GitHub 저장소](https://github.com/adapt-dev-ops?tab=repositories)

---

> ⚡️ 필요에 따라 예시 코드, 설명, 디렉토리 구조 등은 실제 구현 상황에 맞게 추가·수정 가능합니다. 원하시면 즉시 적용해 드릴 수 있습니다!
