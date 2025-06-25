# ADAPT Style Guide Components

이 저장소는 다양한 브랜드 스타일 속에서도 반복해서 사용할 수 있는 핵심 컴포넌트(예: Swiper, Modal, Tabs)를 모아둔 스타일 가이드입니다.

**카페24, 쇼피파이, 숍라인 등 다양한 커머스/웹 플랫폼에서도 손쉽게 적용할 수 있도록 설계되어 있습니다.**

모든 컴포넌트는 Light DOM 기반으로, 외부 CSS로 자유롭게 스타일을 오버라이드할 수 있어 브랜드별 커스터마이징이 매우 쉽습니다.

## ❓ 왜 만들었나요?
여러 스타일 속에서도 자주 등장하는 컴포넌트(예: 스와이프, 모달, 탭)를 한데 모아 표준화하기 위함입니다. 이렇게 함으로써 개발 속도 증가, 유지보수 쉬워짐, 재사용 가능, 버그 감소의 효과를 누릴 수 있습니다.

특히, **Custom Elements**를 통해 표준화된 인터페이스를 정의하고 스타일과 로직이 캡슐화된 컴포넌트 개발이 가능합니다.

## 📁 디렉토리 구조
```
guide/
├─ assets/
│  ├─ css/
│  │  └─ site-theme.css      # 전체 스타일 및 컴포넌트 스타일
│  ├─ js/
│  │  ├─ global.js           # 데모/가이드용 전역 JS (예: 코드 복사, 네비게이션)
│  │  └─ site-theme.js       # Custom Elements(컴포넌트) 정의 및 로직
│  └─ images/
│     └─ ...                 # 데모용 이미지
├─ index.html                # 데모 및 가이드 메인 페이지
├─ LICENSE
├─ README.md
```

## ⚡ 핵심 컴포넌트 예시
- **Swiper**: 터치 슬라이드 컴포넌트
- **Modal**: 모달 컴포넌트
- **Tabs**: 탭 인터랙션 컴포넌트

## 🚀 빠른 시작
Swiper 컴포넌트는 이렇게 복사해서 사용할 수 있습니다:
```html
<site-swiper>
  <div class="swiper-slide">슬라이드1</div>
  <div class="swiper-slide">슬라이드2</div>
  <div class="swiper-slide">슬라이드3</div>
</site-swiper>
```

모달 컴포넌트 예시입니다:
```html
<site-modal id="myModal">
  <div class="modal-header">모달 제목</div>
  <div class="modal-body">모달 내용입니다.</div>
  <div class="modal-footer">
    <button onclick="document.getElementById('myModal').close()">닫기</button>
  </div>
</site-modal>
<script>
  // 모달 열기
  document.getElementById('myModal').open();
</script>
```

Tabs 컴포넌트 예시입니다:
```html
<site-tabs>
  <div class="tab-names">
    <div class="tab">탭1</div>
    <div class="tab">탭2</div>
  </div>
  <div class="tab-contents">
    <div class="content">탭1 내용</div>
    <div class="content">탭2 내용</div>
  </div>
</site-tabs>
```

## 🖥️ 데모 / 가이드
실제 동작 예시와 코드 복사 기능, 컴포넌트별 설명은 `index.html`에서 확인할 수 있습니다.

👉 [데모 페이지 바로가기](https://adapt-dev-ops.github.io/style-guide/index.html)

각 컴포넌트 예제 아래에 **코드 복사 버튼**과 **구문 하이라이팅**이 제공됩니다.

---

## ⚡️ 핵심 개념
원하는 컴포넌트(예: 스와이프, 모달, 탭 등)를 어디서든 쉽게 사용할 수 있도록, 핵심 스크립트는 `site-theme.js` 하나로 모두 관리됩니다.  
**`site-theme.js` 파일만 프로젝트에 포함하고 예제 코드(HTML)를 그대로 복사해 붙여 넣으면 즉시 작동**됩니다.

---

## 👥 기여하기
새로운 컴포넌트 제안, 개선 사항, 버그 리포트는 모두 PR 또는 Issues로 자유롭게 남겨 주세요.

---

## 📝 라이선스
[MIT](LICENSE)

---

## 📧 문의
원하는 컴포넌트 제안 및 문의는 Issues를 통해 남겨 주세요.

---

## 🔗 GitHub
[개발파트 GitHub 저장소](https://github.com/adapt-dev-ops/style-guide)

---

> ⚡️ 필요에 따라 예시 코드, 설명, 디렉토리 구조 등은 실제 구현 상황에 맞게 추가·수정 가능합니다. 원하시면 즉시 적용해 드릴 수 있습니다!
