# Adapt Style Guide

이 저장소는 다양한 브랜드 스타일 속에서도 반복해서 사용할 수 있는 핵심 컴포넌트(예: Swiper, Modal, Tabs)를 모아둔 스타일 가이드입니다. 

## ❓ 왜 만들었나요?
여러 스타일 속에서도 자주 등장하는 컴포넌트(예: 스와이프, 모달, 탭)를 한데 모아 표준화하기 위함입니다. 이렇게 함으로써 개발 속도 증가, 유지보수 쉬워짐, 재사용 가능, 버그 감소의 효과를 누릴 수 있습니다.

특히, **Custom Elements**를 통해 표준화된 인터페이스를 정의하고 스타일과 로직이 캡슐화된 컴포넌트 개발이 가능합니다.

## 📁 디렉토리 구조
```
brand-style-guide/
├─ components/
│  ├─ swiper/
│  │  └─ swiper-carousel.js
│  ├─ modal/
│  │  └─ modal.js
│  └─ tabs/
│     └─ tabs.js
├─ examples/
│  └─ index.html
├─ docs/
├─ assets/
├─ .gitignore
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
<swiper-carousel data-config='{"slidesPerView":2, "spaceBetween":10}'>
  <div class="swiper-slide">슬라이드1</div>
  <div class="swiper-slide">슬라이드2</div>
</swiper-carousel>
```

```html
탭 컴포넌트 예시는 이렇게 사용할 수 있습니다:
<site-modal id="myModal">
  <h2>모달 제목</h2>
  <p>모달 내용입니다.</p>
  <button onclick="document.getElementById('myModal').close()">닫기</button>
</site-modal>
<script>
  // 모달 열기
  document.getElementById('myModal').open();
</script>
```

탭 컴포넌트 예시는 이렇게 사용할 수 있습니다:
```html
<custom-tabs>
  <div slot="tab">탭1</div>
  <div slot="content">탭1 내용</div>
  <div slot="tab">탭2</div>
  <div slot="content">탭2 내용</div>
</custom-tabs>
```
예제 페이지 👉 examples/index.html


## 👥 기여하기
새 컴포넌트 제안은 PR로 자유롭게 가능!

## 📝 라이선스
[MIT](LICENSE)로 자유롭게 사용할 수 있습니다.

## 📧 문의
원하는 컴포넌트 제안은 Issues로 남겨 주세요.
