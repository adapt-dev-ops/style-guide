/**
 * components.js
 * ----------
 * 여러 커스텀 엘리먼트를 한 파일에 정의
 * - <site-swiper> : Swiper 슬라이더 래퍼
 * - <site-modal>  : 모달 컴포넌트
 * - <site-tabs>   : 탭 UI 컴포넌트
 * 
 * 모든 컴포넌트는 Shadow DOM을 사용해 스타일과 구조 캡슐화
 */

/* =========================
   site-swiper 커스텀 엘리먼트
=========================== */
class SiteSwiper extends HTMLElement {
  constructor() {
    super();
    this._config = {};
    this.swiper = null;
  }

  static get observedAttributes() { return ['data-config']; }

  attributeChangedCallback(name, oldVal, newVal) {
    if (name === 'data-config') {
      try {
        this._config = JSON.parse(newVal);
      } catch(e) {
        this._config = {};
      }
      this._initSwiper();
    }
  }

  connectedCallback() {
    if (this.hasAttribute('data-config')) {
      try {
        this._config = JSON.parse(this.getAttribute('data-config'));
      } catch(e) {
        this._config = {};
      }
    }
    this._render();
    this._initSwiper();
    if (!this._observer) {
      this._observer = new MutationObserver(() => {
        this._render();
        this._initSwiper();
      });
      this._observer.observe(this, { childList: true, subtree: true });
    }
  }

  _render() {
    // .swiper-slide만 추출
    const slides = Array.from(this.querySelectorAll('.swiper-slide'));
    // 기존 자식 모두 제거
    while (this.firstChild) this.removeChild(this.firstChild);

    // .swiper 구조 생성
    const wrapper = document.createElement('div');
    wrapper.className = 'swiper';
    const swiperWrapper = document.createElement('div');
    swiperWrapper.className = 'swiper-wrapper';

    // .swiper-slide를 swiper-wrapper에 이동
    slides.forEach(slide => swiperWrapper.appendChild(slide));
    wrapper.appendChild(swiperWrapper);
    wrapper.appendChild(this._createDiv('swiper-button-next'));
    wrapper.appendChild(this._createDiv('swiper-button-prev'));
    wrapper.appendChild(this._createDiv('swiper-pagination'));
    this.appendChild(wrapper);
  }

  _createDiv(className) {
    const div = document.createElement('div');
    div.className = className;
    return div;
  }

  _initSwiper() {
    if (this.swiper) {
      this.swiper.destroy(true, true);
      this.swiper = null;
    }
    const nextEl = this.querySelector('.swiper-button-next');
    const prevEl = this.querySelector('.swiper-button-prev');
    const paginationEl = this.querySelector('.swiper-pagination');
    const defaultConfig = {
      slidesPerView: 1,
      spaceBetween: 0,
      navigation: { nextEl, prevEl },
      pagination: { el: paginationEl, clickable: true },
    };
    const config = {...defaultConfig, ...this._config};
    this.swiper = new Swiper(this.querySelector('.swiper'), config);
  }

  disconnectedCallback() {
    if (this._observer) {
      this._observer.disconnect();
      this._observer = null;
    }
    if (this.swiper) {
      this.swiper.destroy(true, true);
      this.swiper = null;
    }
  }
}

customElements.define('site-swiper', SiteSwiper);

/* =========================
   site-modal 커스텀 엘리먼트
=========================== */
class SiteModal extends HTMLElement {
  constructor() {
    super();
  }

  connectedCallback() {
    this._render();
    this._modal = this.querySelector('.modal');
    this._backdrop = this.querySelector('.backdrop');
    this._bindEvents();
  }

  _render() {
    // 컨텐츠만 추출
    const contentNodes = Array.from(this.childNodes).filter(node => {
      return !(node.classList && (node.classList.contains('modal') || node.classList.contains('backdrop')));
    });
    // 기존 자식 모두 제거
    while (this.firstChild) this.removeChild(this.firstChild);
    // 구조 생성
    const backdrop = document.createElement('div');
    backdrop.className = 'backdrop';
    backdrop.style.display = 'none';
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.style.display = 'none';
    // 컨텐츠 복사
    contentNodes.forEach(node => modal.appendChild(node.cloneNode(true)));
    this.appendChild(backdrop);
    this.appendChild(modal);
  }

  _bindEvents() {
    if (this._backdrop) {
      this._backdrop.addEventListener('click', () => this.close());
    }
  }

  open() {
    if (this._modal) this._modal.style.display = 'block';
    if (this._backdrop) this._backdrop.style.display = 'block';
  }
  close() {
    if (this._modal) this._modal.style.display = 'none';
    if (this._backdrop) this._backdrop.style.display = 'none';
  }

  disconnectedCallback() {
    if (this._backdrop) {
      this._backdrop.removeEventListener('click', () => this.close());
    }
  }
}

customElements.define('site-modal', SiteModal);

/* =========================
   site-tabs 커스텀 엘리먼트
=========================== */
class SiteTabs extends HTMLElement {
  constructor() {
    super();
  }

  connectedCallback() {
    this._render();
    this._renderTabs();
  }

  _render() {
    // .tab-names, .tab-contents 구조 추출
    const tabNames = this.querySelector('.tab-names');
    const tabContents = this.querySelector('.tab-contents');
    if (!tabNames || !tabContents) return;

    // 기존 구조 제거
    while (this.firstChild) this.removeChild(this.firstChild);

    // 새 구조 생성
    const tabsContainer = document.createElement('div');
    tabsContainer.className = 'tabs';
    const contentsContainer = document.createElement('div');
    contentsContainer.className = 'contents';

    // 탭 복사
    const tabNameNodes = Array.from(tabNames.children);
    tabNameNodes.forEach((tab, i) => {
      const tabClone = tab.cloneNode(true);
      tabClone.classList.add('tab');
      tabClone.addEventListener('click', () => this._activateTab(i));
      tabsContainer.appendChild(tabClone);
    });

    // 컨텐츠 복사
    const tabContentNodes = Array.from(tabContents.children);
    tabContentNodes.forEach((content, i) => {
      const contentClone = content.cloneNode(true);
      contentClone.classList.add('content');
      contentsContainer.appendChild(contentClone);
    });

    this.appendChild(tabsContainer);
    this.appendChild(contentsContainer);

    // 초기 활성화
    this._activateTab(0);
  }

  _renderTabs() {
    // 탭 클릭 이벤트 재설정
    const tabs = this.querySelectorAll('.tabs .tab');
    tabs.forEach((tab, i) => {
      tab.onclick = () => this._activateTab(i);
    });
  }

  _activateTab(index) {
    const tabs = this.querySelectorAll('.tabs .tab');
    const contents = this.querySelectorAll('.contents .content');
    tabs.forEach((tab, i) => tab.classList.toggle('active', i === index));
    contents.forEach((content, i) => content.classList.toggle('active', i === index));
  }
}

customElements.define('site-tabs', SiteTabs);
  