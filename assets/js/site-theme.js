/**
 * components.js
 * ----------
 * 여러 커스텀 엘리먼트를 한 파일에 정의
 * - <site-swiper> : Swiper 슬라이더 래퍼
 * - <site-modal>  : 모달 컴포넌트
 * - <site-tabs>   : 탭 UI 컴포넌트
 * - <site-toast>  : 토스트 메시지 컴포넌트
 * - <site-accordion> : 아코디언 컴포넌트
 */

/**
 * Site Components
 * Swiper, Modal, Tabs, Toast, Accordion 커스텀 엘리먼트
 */

/* =========================
   site-swiper 커스텀 엘리먼트
=========================== */
class SiteSwiper extends HTMLElement {
  constructor() {
    super();
    this.swiper = null;
  }

  static get observedAttributes() { return ['data-config']; }

  attributeChangedCallback(name, oldVal, newVal) {
    if (name === 'data-config') this._initSwiper();
  }

  connectedCallback() {
    this._render();
    this._initSwiper();
    // DOM 변경 감지하여 자동 재렌더링 (직접적인 자식 요소만 감지)
    this._observer = new MutationObserver((mutations) => {
      // 슬라이드 추가/삭제만 감지하고, 내부 구조 변경은 무시
      const hasSlideChanges = mutations.some(mutation => 
        Array.from(mutation.addedNodes).some(node => 
          node.nodeType === 1 && node.classList.contains('swiper-slide')
        ) ||
        Array.from(mutation.removedNodes).some(node => 
          node.nodeType === 1 && node.classList.contains('swiper-slide')
        )
      );
      
      if (hasSlideChanges) {
        this._render();
        this._initSwiper();
      }
    });
    this._observer.observe(this, { childList: true });
  }

  _render() {
    // 이미 렌더링되어 있으면 스킵
    if (this.querySelector('.swiper')) return;
    
    // 기존 슬라이드 요소들 추출
    const slides = Array.from(this.querySelectorAll('.swiper-slide'));
    this.innerHTML = '';
    
    // 설정 파싱
    let config = {};
    try {
      config = JSON.parse(this.getAttribute('data-config') || '{}');
    } catch(e) {}
    
    // Swiper 구조 생성
    const wrapper = document.createElement('div');
    wrapper.className = 'swiper';
    let wrapperHTML = '<div class="swiper-wrapper"></div>';
    
    // 네비게이션 버튼들을 조건부로 생성
    if (config.navigation !== false && config.navigation !== "false") {
      wrapperHTML += '<div class="swiper-button-next"></div>';
      wrapperHTML += '<div class="swiper-button-prev"></div>';
    }
    
    // 페이지네이션을 조건부로 생성
    if (config.pagination !== false && config.pagination !== "false") {
      wrapperHTML += '<div class="swiper-pagination"></div>';
    }
    
    wrapper.innerHTML = wrapperHTML;
    
    // 슬라이드들을 wrapper에 재배치
    const swiperWrapper = wrapper.querySelector('.swiper-wrapper');
    slides.forEach(slide => swiperWrapper.appendChild(slide));
    this.appendChild(wrapper);
  }

  _initSwiper() {
    // 기존 Swiper 인스턴스 정리
    this.swiper?.destroy(true, true);
    
    // 기본 설정
    const config = {
      slidesPerView: 1,
      spaceBetween: 0,
      navigation: {
        nextEl: this.querySelector('.swiper-button-next'),
        prevEl: this.querySelector('.swiper-button-prev')
      },
      pagination: {
        el: this.querySelector('.swiper-pagination'),
        clickable: true
      }
    };

    // 사용자 설정 병합
    try {
      const customConfig = JSON.parse(this.getAttribute('data-config') || '{}');
      Object.assign(config, customConfig);
    } catch(e) {}

    // Swiper 인스턴스 생성
    this.swiper = new Swiper(this.querySelector('.swiper'), config);
  }

  disconnectedCallback() {
    this._observer?.disconnect();
    this.swiper?.destroy(true, true);
  }
}

/* =========================
   site-modal 커스텀 엘리먼트
=========================== */
class SiteModal extends HTMLElement {
  connectedCallback() {
    // 기존 컨텐츠 보존하면서 모달 구조 생성
    const content = this.innerHTML;
    this.innerHTML = `
      <div class="backdrop" style="display:none"></div>
      <div class="modal" style="display:none">${content}</div>
    `;
    
    // 배경 클릭시 모달 닫기
    this.querySelector('.backdrop').onclick = () => this.close();
  }

  open() {
    this.querySelector('.modal').style.display = 'block';
    this.querySelector('.backdrop').style.display = 'block';
  }

  close() {
    this.querySelector('.modal').style.display = 'none';
    this.querySelector('.backdrop').style.display = 'none';
  }
}

/* =========================
   site-tabs 커스텀 엘리먼트
=========================== */
class SiteTabs extends HTMLElement {
  connectedCallback() {
    // 기존 탭 구조에서 요소들 추출
    const tabNames = Array.from(this.querySelector('.tab-names')?.children || []);
    const tabContents = Array.from(this.querySelector('.tab-contents')?.children || []);
    
    // 새로운 탭 구조 생성
    this.innerHTML = `
      <div class="tabs"></div>
      <div class="contents"></div>
    `;
    
    const tabsEl = this.querySelector('.tabs');
    const contentsEl = this.querySelector('.contents');
    
    // 탭 버튼들 생성 및 클릭 이벤트 바인딩
    tabNames.forEach((tab, i) => {
      const tabEl = tab.cloneNode(true);
      tabEl.className = 'tab';
      tabEl.onclick = () => this._activateTab(i);
      tabsEl.appendChild(tabEl);
    });
    
    // 탭 컨텐츠들 생성
    tabContents.forEach(content => {
      const contentEl = content.cloneNode(true);
      contentEl.className = 'content';
      contentsEl.appendChild(contentEl);
    });
    
    // 첫 번째 탭 활성화
    this._activateTab(0);
  }

  _activateTab(index) {
    // 모든 탭과 컨텐츠의 활성 상태 토글
    this.querySelectorAll('.tab').forEach((tab, i) => 
      tab.classList.toggle('active', i === index)
    );
    this.querySelectorAll('.content').forEach((content, i) => 
      content.classList.toggle('active', i === index)
    );
  }
}

/* =========================
   site-toast 커스텀 엘리먼트
=========================== */
class SiteToast extends HTMLElement {
  connectedCallback() {
    // 토스트 컨테이너 생성
    this.innerHTML = '<div class="site-toast-container"></div>';
  }

  show(message, opts = {}) {
    // 토스트 요소 생성
    const toast = document.createElement('div');
    toast.className = `site-toast${opts.type ? ' site-toast-' + opts.type : ''}`;
    toast.textContent = message;
    
    this.querySelector('.site-toast-container').appendChild(toast);
    
    // 애니메이션을 위한 지연
    setTimeout(() => toast.classList.add('show'), 10);
    // 자동 제거
    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => toast.remove(), 400);
    }, opts.duration || 2000);
  }
}

// 전역 토스트 함수
window.showToast = (message, opts) => {
  // 기존 토스트 요소 찾거나 새로 생성
  let toast = document.querySelector('site-toast');
  if (!toast) {
    toast = document.createElement('site-toast');
    document.body.appendChild(toast);
  }
  toast.show(message, opts);
};

/* =========================
   site-accordion 커스텀 엘리먼트
=========================== */
class SiteAccordion extends HTMLElement {
  constructor() {
    super();
    // 트랜지션 중인 아이템들 추적
    this._transitioning = new Set();
  }

  connectedCallback() {
    // 각 아코디언 아이템 초기화
    Array.from(this.children)
      .filter(child => child.classList.contains('accordion-item'))
      .forEach(item => this._initItem(item));
  }

  _initItem(item) {
    const title = item.querySelector('.accordion-title');
    const content = item.querySelector('.accordion-content');
    if (!title || !content) return;

    title.style.cursor = 'pointer';
    
    // Bootstrap 스타일 이중 래퍼 구조 생성
    if (!content.querySelector('.accordion-body')) {
      const body = document.createElement('div');
      body.className = 'accordion-body';
      body.innerHTML = content.innerHTML;
      content.innerHTML = '';
      content.appendChild(body);
    }
    
    // 초기 클래스 설정
    content.classList.add('collapse');
    if (item.classList.contains('open')) content.classList.add('show');
    
    // 클릭 이벤트 바인딩
    title.onclick = () => {
      // 트랜지션 중이면 무시
      if (this._transitioning.has(item)) return;
      
      const isOpen = item.classList.contains('open');
      
      // multi 속성이 없으면 다른 아이템들 닫기
      if (!this.hasAttribute('multi')) {
        Array.from(this.children).forEach(i => {
          if (i !== item && i.classList.contains('open')) {
            i.classList.remove('open');
            this._hide(i.querySelector('.accordion-content'), i);
          }
        });
      }
      
      // 현재 아이템 토글
      item.classList.toggle('open');
      isOpen ? this._hide(content, item) : this._show(content, item);
    };
  }

  _show(content, item) {
    if (this._transitioning.has(item) || content.classList.contains('show')) return;
    
    // 트랜지션 시작
    this._transitioning.add(item);
    content.classList.remove('collapse');
    content.classList.add('collapsing');
    content.style.height = '0';
    
    // 브라우저 렌더링 후 높이 설정
    requestAnimationFrame(() => {
      content.style.height = content.scrollHeight + 'px';
    });
    
    // 트랜지션 완료 처리
    this._onTransitionEnd(content, () => {
      content.classList.remove('collapsing');
      content.classList.add('collapse', 'show');
      content.style.height = '';
      this._transitioning.delete(item);
    });
  }

  _hide(content, item) {
    if (this._transitioning.has(item) || !content.classList.contains('show')) return;
    
    // 트랜지션 시작
    this._transitioning.add(item);
    content.style.height = content.getBoundingClientRect().height + 'px';
    content.offsetHeight; // 강제 리플로우
    
    content.classList.add('collapsing');
    content.classList.remove('collapse', 'show');
    content.style.height = '';
    
    // 트랜지션 완료 처리
    this._onTransitionEnd(content, () => {
      content.classList.remove('collapsing');
      content.classList.add('collapse');
      this._transitioning.delete(item);
    });
  }

  _onTransitionEnd(element, callback) {
    // 트랜지션 종료 이벤트 한 번만 실행
    const handler = () => {
      callback();
      element.removeEventListener('transitionend', handler);
    };
    element.addEventListener('transitionend', handler);
  }
}

// 커스텀 엘리먼트 등록
customElements.define('site-swiper', SiteSwiper);
customElements.define('site-modal', SiteModal);
customElements.define('site-tabs', SiteTabs);
customElements.define('site-toast', SiteToast);
customElements.define('site-accordion', SiteAccordion);