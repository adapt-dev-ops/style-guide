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
      this.attachShadow({mode: 'open'});
      this._config = {};
      this.swiper = null;
      this._render();
    }
  
    static get observedAttributes() { return ['data-config']; }
  
    attributeChangedCallback(name, oldVal, newVal) {
      if (name === 'data-config') {
        try {
          this._config = JSON.parse(newVal);
        } catch(e) {
          console.warn('Invalid JSON in data-config:', e);
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
      this._initSwiper();
    }
  
    // Shadow DOM 내부 구조 렌더링
    _render() {
      this.shadowRoot.innerHTML = `
        <style>
          @import "https://unpkg.com/swiper@11/swiper-bundle.min.css";
          :host { display: block; position: relative; }
          .swiper { width: 100%; height: auto; }
          .swiper-button-next, .swiper-button-prev { position: absolute; top: 50%; transform: translateY(-50%); }
          .swiper-button-next { right: 0; }
          .swiper-button-prev { left: 0; }
        </style>
        <div class="swiper">
          <div class="swiper-wrapper">
            <slot></slot>
          </div>
          <div class="swiper-button-next"></div>
          <div class="swiper-button-prev"></div>
          <div class="swiper-pagination"></div>
        </div>
      `;
    }
  
    // Swiper 인스턴스 초기화/재설정
    _initSwiper() {
      if (this.swiper) {
        this.swiper.destroy(true, true);
        this.swiper = null;
      }
      const nextEl = this.shadowRoot.querySelector('.swiper-button-next');
      const prevEl = this.shadowRoot.querySelector('.swiper-button-prev');
      const paginationEl = this.shadowRoot.querySelector('.swiper-pagination');
  
      const defaultConfig = {
        slidesPerView: 1,
        spaceBetween: 0,
        navigation: { nextEl, prevEl },
        pagination: { el: paginationEl, clickable: true },
      };
  
      const config = {...defaultConfig, ...this._config};
      this.swiper = new Swiper(this.shadowRoot.querySelector('.swiper'), config);
    }
  }
  
  customElements.define('site-swiper', SiteSwiper);
  
  /* =========================
     site-modal 커스텀 엘리먼트
  =========================== */
  class SiteModal extends HTMLElement {
    constructor() {
      super();
      this.attachShadow({mode:'open'});
      this._render();
    }
  
    connectedCallback() {
      this._modal = this.shadowRoot.querySelector('.modal');
      this._backdrop = this.shadowRoot.querySelector('.backdrop');
      this._bindEvents();
    }
  
    // Shadow DOM 렌더링
    _render() {
      this.shadowRoot.innerHTML = `
        <style>
          .backdrop {
            position: fixed; inset: 0;
            background: rgba(0,0,0,0.5);
            display: none;
            z-index: 9998;
          }
          .modal {
            position: fixed; top: 50%; left: 50%;
            transform: translate(-50%, -50%);
            background: white;
            padding: 1rem;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.3);
            display: none;
            z-index: 9999;
            max-width: 90vw;
            max-height: 80vh;
            overflow-y: auto;
          }
        </style>
        <div class="backdrop"></div>
        <div class="modal">
          <slot></slot>
        </div>
      `;
    }
  
    _bindEvents() {
      this._backdrop.addEventListener('click', () => this.close());
    }
  
    // 모달 열기 메서드
    open() {
      this._modal.style.display = 'block';
      this._backdrop.style.display = 'block';
    }
  
    // 모달 닫기 메서드
    close() {
      this._modal.style.display = 'none';
      this._backdrop.style.display = 'none';
    }
  }
  
  customElements.define('site-modal', SiteModal);
  
  /* =========================
     site-tabs 커스텀 엘리먼트
  =========================== */
  class SiteTabs extends HTMLElement {
    constructor() {
      super();
      this.attachShadow({mode:'open'});
      this._render();
    }
  
    connectedCallback() {
      this._tabs = Array.from(this.shadowRoot.querySelectorAll('.tab'));
      this._contents = Array.from(this.shadowRoot.querySelectorAll('.content'));
  
      this._tabs.forEach((tab, i) => {
        tab.addEventListener('click', () => this._activateTab(i));
      });
  
      this._activateTab(0);
    }
  
    _render() {
      this.shadowRoot.innerHTML = `
        <style>
          .tabs { display: flex; border-bottom: 1px solid #ccc; }
          .tab {
            padding: 0.5em 1em;
            cursor: pointer;
            user-select: none;
            border-bottom: 3px solid transparent;
            transition: border-color 0.3s;
          }
          .tab.active {
            border-color: #007bff;
            font-weight: bold;
          }
          .content { display: none; padding: 1em 0; }
          .content.active { display: block; }
        </style>
        <div class="tabs">
          <slot name="tab"></slot>
        </div>
        <div class="contents">
          <slot name="content"></slot>
        </div>
      `;
    }
  
    // 활성 탭 및 내용 표시
    _activateTab(index) {
      this._tabs.forEach((tab, i) => tab.classList.toggle('active', i === index));
      this._contents.forEach((content, i) => content.classList.toggle('active', i === index));
    }
  }
  
  customElements.define('site-tabs', SiteTabs);
  