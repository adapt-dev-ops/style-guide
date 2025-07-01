/**
 * components.js
 * ----------
 * - <site-swiper> : Swiper 슬라이더 래퍼
 * - <site-modal>  : 모달 컴포넌트
 * - <site-tabs>   : 탭 UI 컴포넌트
 * - <site-toast>  : 토스트 메시지 컴포넌트
 * - <site-accordion> : 아코디언 컴포넌트
 * - <site-countdown> : 카운트다운 컴포넌트
 * - <site-scroll-reveal> : 스크롤 리빌 컴포넌트
 * - <site-scroll-typewriter> : 스크롤 타이핑 컴포넌트
 * - <site-scroll-color> : 스크롤 색상 변화 컴포넌트
 * - <site-parallax> : 패럴럭스 효과 컴포넌트
 * - <site-scroll-progress> : 스크롤 진행률 표시 컴포넌트
 * - <site-sticky> : 스크롤에 따라 고정되는 컴포넌트 
 * ----------
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

  // 기본 설정을 쉽게 오버라이드할 수 있는 메서드
  getDefaultConfig() {
    return {
      slidesPerView: 1,
      spaceBetween: 0,
      navigation: {
        nextEl: this.querySelector('.swiper-button-next'),
        prevEl: this.querySelector('.swiper-button-prev')
      },
      pagination: {
        el: this.querySelector('.swiper-pagination'),
        clickable: true
      },
      speed: 600
    };
  }

  // 브랜드별 커스텀 설정 병합
  mergeConfig(defaultConfig, customConfig) {
    const deepMerge = (target, source) => {
      for (const key in source) {
        if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
          target[key] = target[key] || {};
          deepMerge(target[key], source[key]);
        } else {
          target[key] = source[key];
        }
      }
      return target;
    };
    
    return deepMerge({...defaultConfig}, customConfig);
  }

  attributeChangedCallback(name, oldVal, newVal) {
    if (name === 'data-config') {
      this._initSwiper();
    }
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
      wrapperHTML += '<div class="swiper-button-container">';
      wrapperHTML += '<div class="swiper-button-next"></div>';
      wrapperHTML += '<div class="swiper-button-prev"></div>';
      wrapperHTML += '</div>';
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
    const defaultConfig = this.getDefaultConfig();

    // 사용자 설정 병합
    let customConfig = {};
    try {
      customConfig = JSON.parse(this.getAttribute('data-config') || '{}');
    } catch(e) {}

    // 설정 병합
    const config = this.mergeConfig(defaultConfig, customConfig);

    // 페럴럭스 효과가 활성화된 경우 커스텀 이벤트 추가
    if (config.parallax) {
      const originalOn = config.on || {};
      config.on = {
        ...originalOn,
        slideChangeTransitionStart: (...args) => {
          originalOn.slideChangeTransitionStart?.(...args);
          this._handleParallax();
        },
        slideChangeTransitionEnd: (...args) => {
          originalOn.slideChangeTransitionEnd?.(...args);
          this._handleParallax();
        },
        touchMove: (swiper) => {
          originalOn.touchMove?.(swiper);
          this._handleParallaxMove(swiper);
        },
        setTransition: (swiper, duration) => {
          originalOn.setTransition?.(swiper, duration);
          this._setParallaxTransition(duration);
        }
      };
    } else {
      // 페럴럭스가 아닌 경우에도 기본 이벤트 훅 추가
      const originalOn = config.on || {};
      config.on = {
        ...originalOn,
        slideChangeTransitionStart: (...args) => {
          originalOn.slideChangeTransitionStart?.(...args);
        },
        slideChangeTransitionEnd: (...args) => {
          originalOn.slideChangeTransitionEnd?.(...args);
        },
        touchMove: (...args) => {
          originalOn.touchMove?.(...args);
        }
      };
    }

    // Swiper 인스턴스 생성
    this.swiper = new Swiper(this.querySelector('.swiper'), config);
    
    // 초기화 완료 이벤트 발생
    this.dispatchEvent(new CustomEvent('swiperReady', { 
      detail: { swiper: this.swiper, config } 
    }));
  }

  // 외부에서 Swiper 인스턴스에 접근할 수 있는 메서드
  getSwiperInstance() {
    return this.swiper;
  }

  // 동적으로 슬라이드 추가
  addSlide(slideHTML, index = null) {
    const slide = document.createElement('div');
    slide.className = 'swiper-slide';
    slide.innerHTML = slideHTML;
    
    if (index === null) {
      this.appendChild(slide);
    } else {
      const slides = this.querySelectorAll('.swiper-slide');
      if (slides[index]) {
        this.insertBefore(slide, slides[index]);
      } else {
        this.appendChild(slide);
      }
    }
    
    return this;
  }

  // 동적으로 슬라이드 제거
  removeSlide(index) {
    const slides = this.querySelectorAll('.swiper-slide');
    if (slides[index]) {
      slides[index].remove();
    }
    
    return this;
  }

  _handleParallax() {
    if (!this.swiper) return;
    
    const slides = this.swiper.slides;
    const activeIndex = this.swiper.activeIndex;
    
    slides.forEach((slide, index) => {
      const parallaxElements = slide.querySelectorAll('[data-swiper-parallax]');
      const slideProgress = (index - activeIndex);
      
      parallaxElements.forEach(el => {
        const parallaxValue = parseInt(el.getAttribute('data-swiper-parallax') || '0');
        const translateX = parallaxValue * slideProgress;
        el.style.transform = `translate3d(${translateX}px, 0, 0)`;
      });
    });
  }

  _handleParallaxMove(swiper) {
    if (!swiper.slides) return;
    
    const translate = swiper.translate;
    const slideWidth = swiper.slides[0]?.offsetWidth || 0;
    
    swiper.slides.forEach((slide, index) => {
      const parallaxElements = slide.querySelectorAll('[data-swiper-parallax]');
      const slideProgress = (translate + index * slideWidth) / slideWidth;
      
      parallaxElements.forEach(el => {
        const parallaxValue = parseInt(el.getAttribute('data-swiper-parallax') || '0');
        const translateX = parallaxValue * slideProgress;
        el.style.transform = `translate3d(${translateX}px, 0, 0)`;
      });
    });
  }

  _setParallaxTransition(duration) {
    const parallaxElements = this.querySelectorAll('[data-swiper-parallax]');
    parallaxElements.forEach(el => {
      el.style.transition = `transform ${duration}ms`;
    });
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
  constructor() {
    super();
    // ESC 키 이벤트 핸들러를 바인드
    this._handleKeydown = this._handleKeydown.bind(this);
  }

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

  disconnectedCallback() {
    // 키보드 이벤트 리스너 제거
    document.removeEventListener('keydown', this._handleKeydown);
  }

  _handleKeydown(e) {
    // 모달이 열려있을 때만 ESC 키 처리
    if (e.key === 'Escape' && this.hasAttribute('open')) {
      this.close();
    }
  }

  open() {
    this.querySelector('.modal').style.display = 'block';
    this.querySelector('.backdrop').style.display = 'block';
    this.setAttribute('open', '');
    
    // 키보드 이벤트 리스너 추가
    document.addEventListener('keydown', this._handleKeydown);
  }

  close() {
    this.querySelector('.modal').style.display = 'none';
    this.querySelector('.backdrop').style.display = 'none';
    this.removeAttribute('open');
    
    // 키보드 이벤트 리스너 제거
    document.removeEventListener('keydown', this._handleKeydown);
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
      <div class="tabs" role="tablist"></div>
      <div class="contents"></div>
    `;
    
    const tabsEl = this.querySelector('.tabs');
    const contentsEl = this.querySelector('.contents');
    
    // 탭 버튼들 생성 및 이벤트 바인딩
    tabNames.forEach((tab, i) => {
      const tabEl = tab.cloneNode(true);
      tabEl.className = 'tab';
      tabEl.setAttribute('role', 'tab');
      tabEl.setAttribute('tabindex', i === 0 ? '0' : '-1');
      tabEl.setAttribute('aria-selected', i === 0 ? 'true' : 'false');
      
      // 클릭 이벤트
      tabEl.onclick = () => this._activateTab(i);
      
      // 키보드 내비게이션
      tabEl.onkeydown = (e) => {
        const tabs = this.querySelectorAll('.tab');
        let newIndex = i;
        
        switch(e.key) {
          case 'ArrowLeft':
            newIndex = i > 0 ? i - 1 : tabs.length - 1;
            break;
          case 'ArrowRight':
            newIndex = i < tabs.length - 1 ? i + 1 : 0;
            break;
          case 'Home':
            newIndex = 0;
            break;
          case 'End':
            newIndex = tabs.length - 1;
            break;
          default:
            return;
        }
        
        e.preventDefault();
        this._activateTab(newIndex);
        tabs[newIndex].focus();
      };
      
      tabsEl.appendChild(tabEl);
    });
    
    // 탭 컨텐츠들 생성
    tabContents.forEach((content, i) => {
      const contentEl = content.cloneNode(true);
      contentEl.className = 'content';
      contentEl.setAttribute('role', 'tabpanel');
      contentEl.setAttribute('tabindex', '0');
      contentsEl.appendChild(contentEl);
    });
    
    // 첫 번째 탭 활성화
    this._activateTab(0);
  }

  _activateTab(index) {
    // 모든 탭과 컨텐츠의 활성 상태 토글
    this.querySelectorAll('.tab').forEach((tab, i) => {
      const isActive = i === index;
      tab.classList.toggle('active', isActive);
      tab.setAttribute('aria-selected', isActive ? 'true' : 'false');
      tab.setAttribute('tabindex', isActive ? '0' : '-1');
    });
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

/* =========================
   site-countdown 커스텀 엘리먼트
=========================== */
class SiteCountdown extends HTMLElement {
  constructor() {
    super();
    this._interval = null;
    this._targetDate = null;
  }

  static get observedAttributes() {
    return ['data-target', 'data-format'];
  }

  connectedCallback() {
    this._render();
    this._start();
  }

  disconnectedCallback() {
    if (this._interval) {
      clearInterval(this._interval);
      this._interval = null;
    }
  }

  attributeChangedCallback(name, oldVal, newVal) {
    if (this.isConnected && oldVal !== newVal) {
      this._render();
      this._start();
    }
  }

  _render() {
    const format = this.getAttribute('data-format') || 'DHMS';
    
    this.innerHTML = `
      <div class="countdown-container">
        ${format.includes('D') ? '<div class="countdown-item"><span class="countdown-value" data-unit="days">00</span><span class="countdown-label">일</span></div>' : ''}
        ${format.includes('H') ? '<div class="countdown-item"><span class="countdown-value" data-unit="hours">00</span><span class="countdown-label">시간</span></div>' : ''}
        ${format.includes('M') ? '<div class="countdown-item"><span class="countdown-value" data-unit="minutes">00</span><span class="countdown-label">분</span></div>' : ''}
        ${format.includes('S') ? '<div class="countdown-item"><span class="countdown-value" data-unit="seconds">00</span><span class="countdown-label">초</span></div>' : ''}
      </div>
    `;
  }

  _start() {
    if (this._interval) {
      clearInterval(this._interval);
      this._interval = null;
    }
    
    const target = this.getAttribute('data-target');
    if (!target) return;

    this._targetDate = this._parseDate(target);
    if (isNaN(this._targetDate.getTime())) {
      console.error('Invalid date format for site-countdown');
      return;
    }

    this._update();
    this._interval = setInterval(() => this._update(), 1000);
  }

  _parseDate(dateString) {
    // 간단한 포맷들을 표준 포맷으로 변환
    let processedDate = dateString;

    if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
      processedDate = dateString + 'T00:00:00';
    } else if (/^\d{4}\/\d{2}\/\d{2}$/.test(dateString)) {
      processedDate = dateString.replace(/\//g, '-') + 'T00:00:00';
    } else if (/^\d{4}\.\d{2}\.\d{2}$/.test(dateString)) {
      processedDate = dateString.replace(/\./g, '-') + 'T00:00:00';
    } else if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}$/.test(dateString)) {
      processedDate = dateString.replace(' ', 'T') + ':00';
    } else if (/^\d{4}\/\d{2}\/\d{2} \d{2}:\d{2}$/.test(dateString)) {
      processedDate = dateString.replace(/\//g, '-').replace(' ', 'T') + ':00';
    }

    return new Date(processedDate);
  }

  _update() {
    const now = new Date().getTime();
    const distance = this._targetDate.getTime() - now;

    // 시간이 지났어도 계속 카운트 (음수로 표시)
    const days = Math.floor(Math.abs(distance) / (1000 * 60 * 60 * 24));
    const hours = Math.floor((Math.abs(distance) % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((Math.abs(distance) % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((Math.abs(distance) % (1000 * 60)) / 1000);

    // 시간이 지났으면 "+" 표시
    const prefix = distance < 0 ? '+' : '';
    
    this._setValue('days', prefix + days.toString().padStart(2, '0'));
    this._setValue('hours', hours.toString().padStart(2, '0'));
    this._setValue('minutes', minutes.toString().padStart(2, '0'));
    this._setValue('seconds', seconds.toString().padStart(2, '0'));
  }

  _setValue(unit, value) {
    const element = this.querySelector(`[data-unit="${unit}"]`);
    if (element && element.textContent !== value) {
      element.textContent = value;
      element.parentElement.classList.add('updated');
      setTimeout(() => element.parentElement.classList.remove('updated'), 200);
    }
  }
}

/* =========================
   site-scroll-reveal 커스텀 엘리먼트
   스크롤 시 뷰포트에 들어올 때 애니메이션
=========================== */
class SiteScrollReveal extends HTMLElement {
  constructor() {
    super();
    this._observer = null;
    this._hasTriggered = false;
    this._isVisible = false;
    this._repeatMode = 'once';
  }

  connectedCallback() {
    this._setupObserver();
    this._setInitialState();
  }

  disconnectedCallback() {
    if (this._observer) {
      this._observer.disconnect();
    }
  }

  _setInitialState() {
    const animation = this.getAttribute('data-animation') || 'fadeInUp';
    const duration = this.getAttribute('data-duration') || '0.6s';
    const delay = this.getAttribute('data-delay') || '0s';
    
    // 초기 스타일 설정
    this.style.transition = `all ${duration} ease-out ${delay}`;
    this.style.opacity = '0';
    
    // 애니메이션 타입별 초기 상태
    switch(animation) {
      case 'fadeIn':
        this.style.opacity = '0';
        this.style.transform = '';
        break;
      case 'fadeInUp':
        this.style.opacity = '0';
        this.style.transform = 'translateY(30px)';
        break;
      case 'fadeInDown':
        this.style.opacity = '0';
        this.style.transform = 'translateY(-30px)';
        break;
      case 'fadeInLeft':
        this.style.opacity = '0';
        this.style.transform = 'translateX(-30px)';
        break;
      case 'fadeInRight':
        this.style.opacity = '0';
        this.style.transform = 'translateX(30px)';
        break;
      case 'zoomIn':
        this.style.opacity = '0';
        this.style.transform = 'scale(0.8)';
        break;
      case 'slideInUp':
        this.style.opacity = '1';
        this.style.transform = 'translateY(100%)';
        break;
      case 'slideInLeft':
        this.style.opacity = '1';
        this.style.transform = 'translateX(-100%)';
        break;
    }
  }

  _setupObserver() {
    const threshold = parseFloat(this.getAttribute('data-threshold') || '0.1');
    
    // 반복 모드 설정 (하위 호환성을 위해 data-once도 지원)
    const repeat = this.getAttribute('data-repeat') || 
                  (this.getAttribute('data-once') === 'false' ? 'always' : 'once');
    
    this._repeatMode = repeat;
    
    this._observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          // 반복 모드에 따른 실행 로직
          switch(this._repeatMode) {
            case 'once':
              if (!this._hasTriggered) {
                this._reveal();
                this._hasTriggered = true;
              }
              break;
            case 'always':
              this._reveal();
              this._hasTriggered = true;
              break;
            case 'visible':
              if (!this._isVisible) {
                this._reveal();
                this._isVisible = true;
                this._hasTriggered = true;
              }
              break;
          }
        } else {
          // 뷰포트에서 벗어났을 때의 처리
          if (this._repeatMode === 'always' || this._repeatMode === 'visible') {
            this._hide();
            if (this._repeatMode === 'visible') {
              this._isVisible = false;
            }
          }
        }
      });
    }, {
      threshold: threshold,
      rootMargin: '0px 0px -20px 0px'
    });
    
    this._observer.observe(this);
  }

  _reveal() {
    const animation = this.getAttribute('data-animation') || 'fadeInUp';
    
    this.style.opacity = '1';
    
    // 애니메이션 타입별 최종 상태
    switch(animation) {
      case 'fadeIn':
        this.style.transform = '';
        break;
      case 'fadeInUp':
      case 'fadeInDown':
      case 'fadeInLeft':
      case 'fadeInRight':
        this.style.transform = 'translateY(0) translateX(0)';
        break;
      case 'zoomIn':
        this.style.transform = 'scale(1)';
        break;
      case 'slideInUp':
      case 'slideInLeft':
        this.style.transform = 'translateY(0) translateX(0)';
        break;
      default:
        this.style.transform = 'translateY(0) translateX(0) scale(1)';
    }
    
    // 커스텀 이벤트 발생
    this.dispatchEvent(new CustomEvent('revealed', { 
      detail: { element: this } 
    }));
  }

  _hide() {
    this._setInitialState();
  }
}

/* =========================
   site-parallax 커스텀 엘리먼트
   패럴랙스 스크롤 효과
=========================== */
class SiteParallax extends HTMLElement {
  constructor() {
    super();
    this._ticking = false;
    this._isIntersecting = false;
  }

  connectedCallback() {
    this._setupParallax();
    this._setupIntersectionObserver();
    this._bindEvents();
  }

  disconnectedCallback() {
    window.removeEventListener('scroll', this._onScroll);
    window.removeEventListener('resize', this._onResize);
    if (this._observer) {
      this._observer.disconnect();
    }
  }

  _setupIntersectionObserver() {
    this._observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          this._isIntersecting = entry.isIntersecting;
        });
      },
      { 
        rootMargin: '100px 0px',
        threshold: 0 
      }
    );
    this._observer.observe(this);
  }

  _setupParallax() {
    this._speed = parseFloat(this.getAttribute('data-speed')) || 0.5;
    this._direction = this.getAttribute('data-direction') || 'up';
  }

  _bindEvents() {
    this._onScroll = this._handleScroll.bind(this);
    this._onResize = this._handleResize.bind(this);

    window.addEventListener('scroll', this._onScroll, { passive: true });
    window.addEventListener('resize', this._onResize, { passive: true });
    this._updateParallax(); // 초기 위치 설정
  }

  _handleScroll() {
    if (!this._isIntersecting) return; // 성능 최적화
    
    if (!this._ticking) {
      requestAnimationFrame(() => {
        this._updateParallax();
        this._ticking = false;
      });
      this._ticking = true;
    }
  }

  _handleResize() {
    this._updateParallax();
  }

  _updateParallax() {
    if (!this._isIntersecting) return; // 화면에 보이지 않으면 계산하지 않음
    
    const rect = this.getBoundingClientRect();
    const windowHeight = window.innerHeight;
    const elementHeight = rect.height;
    
    // 스크롤 진행률 계산 (-1에서 1 사이)
    const scrollProgress = (windowHeight - rect.top) / (windowHeight + elementHeight);
    const translateValue = (scrollProgress - 0.5) * Math.abs(this._speed) * 100;
    
    // 음수 속도일 경우 반대 방향으로 움직임
    const finalTranslateValue = this._speed < 0 ? -translateValue : translateValue;
    
    let transform = '';
    switch(this._direction) {
      case 'up':
        transform = `translateY(${-finalTranslateValue}px)`;
        break;
      case 'down':
        transform = `translateY(${finalTranslateValue}px)`;
        break;
      case 'left':
        transform = `translateX(${-finalTranslateValue}px)`;
        break;
      case 'right':
        transform = `translateX(${finalTranslateValue}px)`;
        break;
    }
    
    this.style.transform = transform;
  }
}

/* =========================
   site-scroll-progress 커스텀 엘리먼트
   스크롤 진행률 표시 바
=========================== */
class SiteScrollProgress extends HTMLElement {
  constructor() {
    super();
    this._ticking = false;
  }

  connectedCallback() {
    this._render();
    this._bindEvents();
    this._updateProgress();
  }

  disconnectedCallback() {
    window.removeEventListener('scroll', this._onScroll);
    window.removeEventListener('resize', this._onResize);
  }

  _render() {
    const position = this.getAttribute('data-position') || 'top'; // top, bottom
    const height = this.getAttribute('data-height') || '4px';
    const color = this.getAttribute('data-color') || '#007bff';
    const target = this.getAttribute('data-target'); // 특정 요소의 스크롤 진행률
    
    this.innerHTML = `
      <div class="scroll-progress-bar" style="
        position: fixed;
        ${position}: 0;
        left: 0;
        width: 0%;
        height: ${height};
        background-color: ${color};
        z-index: 9999;
        transition: width 0.1s ease-out;
      "></div>
    `;
    
    this._progressBar = this.querySelector('.scroll-progress-bar');
    this._target = target;
    this._onScroll = this._handleScroll.bind(this);
    this._onResize = this._handleResize.bind(this);
  }

  _bindEvents() {
    window.addEventListener('scroll', this._onScroll, { passive: true });
    window.addEventListener('resize', this._onResize, { passive: true });
  }

  _handleScroll() {
    if (!this._ticking) {
      requestAnimationFrame(() => {
        this._updateProgress();
        this._ticking = false;
      });
      this._ticking = true;
    }
  }

  _handleResize() {
    this._updateProgress();
  }

  _updateProgress() {
    let scrollProgress = 0;
    
    if (this._target) {
      // 특정 요소 기준으로 진행률 계산
      const targetElement = document.querySelector(this._target);
      if (targetElement) {
        const rect = targetElement.getBoundingClientRect();
        const elementTop = rect.top + window.pageYOffset;
        const elementHeight = rect.height;
        const windowHeight = window.innerHeight;
        const scrollTop = window.pageYOffset;
        
        const startScroll = elementTop - windowHeight;
        const endScroll = elementTop + elementHeight;
        const currentScroll = scrollTop;
        
        scrollProgress = Math.max(0, Math.min(1, 
          (currentScroll - startScroll) / (endScroll - startScroll)
        ));
      }
    } else {
      // 전체 페이지 기준으로 진행률 계산
      const scrollTop = window.pageYOffset;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      scrollProgress = scrollTop / docHeight;
    }
    
    this._progressBar.style.width = `${scrollProgress * 100}%`;
    
    // 커스텀 이벤트 발생
    this.dispatchEvent(new CustomEvent('progress', { 
      detail: { progress: scrollProgress } 
    }));
  }
}

/* =========================
   site-sticky 커스텀 엘리먼트
   스크롤 시 고정되는 요소
=========================== */
class SiteSticky extends HTMLElement {
  constructor() {
    super();
    this._observer = null;
    this._isSticky = false;
  }

  connectedCallback() {
    this._setupSticky();
  }

  disconnectedCallback() {
    if (this._observer) {
      this._observer.disconnect();
    }
  }

  _setupSticky() {
    const top = this.getAttribute('data-top') || '0px';
    const zIndex = this.getAttribute('data-z-index') || '1000';
    
    // 스타일 설정
    this.style.position = 'sticky';
    this.style.top = top;
    this.style.zIndex = zIndex;
    
    // Intersection Observer로 sticky 상태 감지
    this._observer = new IntersectionObserver(
      ([entry]) => {
        const wasSticky = this._isSticky;
        this._isSticky = entry.intersectionRatio < 1;
        
        if (wasSticky !== this._isSticky) {
          this.classList.toggle('is-sticky', this._isSticky);
          
          // 커스텀 이벤트 발생
          this.dispatchEvent(new CustomEvent(this._isSticky ? 'stuck' : 'unstuck', {
            detail: { element: this, isSticky: this._isSticky }
          }));
        }
      },
      { threshold: [1] }
    );
    
    this._observer.observe(this);
  }
}

/* =========================
   site-scroll-color 커스텀 엘리먼트
   스크롤에 따른 색상 변화
=========================== */
class SiteScrollColor extends HTMLElement {
  constructor() {
    super();
    this._ticking = false;
    this._observer = null;
  }

  connectedCallback() {
    this._setupColorChange();
    this._bindEvents();
  }

  disconnectedCallback() {
    window.removeEventListener('scroll', this._onScroll);
    if (this._observer) {
      this._observer.disconnect();
    }
  }

  _setupColorChange() {
    this._fromColor = this.getAttribute('data-from') || '#ff0000';
    this._toColor = this.getAttribute('data-to') || '#0000ff';
    this._property = this.getAttribute('data-property') || 'background-color'; // background-color, color, border-color
    this._trigger = this.getAttribute('data-trigger') || 'viewport'; // viewport, element
    
    this._onScroll = this._handleScroll.bind(this);
    
    if (this._trigger === 'element') {
      this._setupIntersectionObserver();
    }
    
    this._updateColor();
  }

  _setupIntersectionObserver() {
    this._observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          this._progress = entry.intersectionRatio;
          this._updateColor();
        });
      },
      { threshold: Array.from({length: 101}, (_, i) => i / 100) }
    );
    this._observer.observe(this);
  }

  _bindEvents() {
    if (this._trigger === 'viewport') {
      window.addEventListener('scroll', this._onScroll, { passive: true });
    }
  }

  _handleScroll() {
    if (!this._ticking) {
      requestAnimationFrame(() => {
        this._updateColor();
        this._ticking = false;
      });
      this._ticking = true;
    }
  }

  _updateColor() {
    let progress = 0;
    
    if (this._trigger === 'viewport') {
      // 뷰포트 기준 진행률 계산
      const rect = this.getBoundingClientRect();
      const windowHeight = window.innerHeight;
      const elementHeight = rect.height;
      
      if (rect.bottom >= 0 && rect.top <= windowHeight) {
        progress = Math.max(0, Math.min(1, 
          (windowHeight - rect.top) / (windowHeight + elementHeight)
        ));
      }
    } else {
      // Intersection Observer에서 설정된 progress 사용
      progress = this._progress || 0;
    }
    
    const color = this._interpolateColor(this._fromColor, this._toColor, progress);
    // 내부 첫 번째 자식에 스타일 적용, 없으면 자기 자신에 적용
    const target = this.firstElementChild || this;
    target.style[this._property] = color;
    
    // 커스텀 이벤트 발생
    this.dispatchEvent(new CustomEvent('colorchange', {
      detail: { progress, color, property: this._property }
    }));
  }

  _interpolateColor(color1, color2, factor) {
    const rgb1 = this._hexToRgb(color1);
    const rgb2 = this._hexToRgb(color2);
    
    if (!rgb1 || !rgb2) return color1;
    
    const r = Math.round(rgb1.r + (rgb2.r - rgb1.r) * factor);
    const g = Math.round(rgb1.g + (rgb2.g - rgb1.g) * factor);
    const b = Math.round(rgb1.b + (rgb2.b - rgb1.b) * factor);
    
    return `rgb(${r}, ${g}, ${b})`;
  }

  _hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : null;
  }
}

/* =========================
   site-scroll-typewriter 커스텀 엘리먼트
   스크롤에 따른 텍스트 타이핑 효과
=========================== */
class SiteScrollTypewriter extends HTMLElement {
  constructor() {
    super();
    this._observer = null;
    this._isTyping = false;
    this._currentIndex = 0;
  }

  connectedCallback() {
    this._setupTypewriter();
  }

  disconnectedCallback() {
    if (this._observer) {
      this._observer.disconnect();
    }
    if (this._typingInterval) {
      clearInterval(this._typingInterval);
    }
  }

  _setupTypewriter() {
    this._text = this.getAttribute('data-text') || this.textContent || '';
    this._speed = parseInt(this.getAttribute('data-speed')) || 50; // ms per character
    this._trigger = this.getAttribute('data-trigger') || 'viewport'; // viewport만 지원
    this._cursor = this.getAttribute('data-cursor') !== 'false'; // 커서 표시 여부
    
    if (!this.querySelector('.typewriter-text')) {
      if (this._cursor) {
        this.innerHTML = '<span class="typewriter-text"></span><span class="typewriter-cursor">|</span>';
        this._addCursorStyles();
      } else {
        this.innerHTML = '<span class="typewriter-text"></span>';
      }
    }
    this._textElement = this.querySelector('.typewriter-text');
    
    this._setupIntersectionObserver();
  }

  _addCursorStyles() {
    if (!document.querySelector('#typewriter-cursor-style')) {
      const style = document.createElement('style');
      style.id = 'typewriter-cursor-style';
      style.textContent = `
        .typewriter-cursor {
          animation: typewriter-blink 1s infinite;
          opacity: 1;
        }
        @keyframes typewriter-blink {
          0%, 50% { opacity: 1; }
          51%, 100% { opacity: 0; }
        }
      `;
      document.head.appendChild(style);
    }
  }

  _setupIntersectionObserver() {
    this._observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting && !this._isTyping) {
            this._startTyping();
          }
        });
      },
      { threshold: 0.5 }
    );
    this._observer.observe(this);
  }

  _startTyping() {
    if (this._isTyping) return;
    
    this._isTyping = true;
    this._currentIndex = 0;
    this._textElement.textContent = '';
    
    this._typingInterval = setInterval(() => {
      if (this._currentIndex < this._text.length) {
        this._textElement.textContent += this._text[this._currentIndex];
        this._currentIndex++;
        
        // 커스텀 이벤트 발생
        this.dispatchEvent(new CustomEvent('typewriter-progress', {
          detail: { 
            progress: this._currentIndex / this._text.length,
            currentText: this._textElement.textContent,
            character: this._text[this._currentIndex - 1]
          }
        }));
      } else {
        clearInterval(this._typingInterval);
        this._isTyping = false;
        
        // 완료 이벤트 발생
        this.dispatchEvent(new CustomEvent('typewriter-complete', {
          detail: { text: this._text }
        }));
      }
    }, this._speed);
  }

  // 공개 메서드들
  reset() {
    this._currentIndex = 0;
    this._textElement.textContent = '';
    this._isTyping = false;
    if (this._typingInterval) {
      clearInterval(this._typingInterval);
    }
  }

  type() {
    this.reset();
    this._startTyping();
  }
}

// 커스텀 엘리먼트 등록
customElements.define('site-swiper', SiteSwiper);
customElements.define('site-modal', SiteModal);
customElements.define('site-tabs', SiteTabs);
customElements.define('site-toast', SiteToast);
customElements.define('site-accordion', SiteAccordion);
customElements.define('site-countdown', SiteCountdown);
customElements.define('site-scroll-reveal', SiteScrollReveal);
customElements.define('site-parallax', SiteParallax);
customElements.define('site-scroll-progress', SiteScrollProgress);
customElements.define('site-sticky', SiteSticky);
customElements.define('site-scroll-color', SiteScrollColor);
customElements.define('site-scroll-typewriter', SiteScrollTypewriter);