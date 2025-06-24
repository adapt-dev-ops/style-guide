class SwiperCarousel extends HTMLElement {
  static get observedAttributes() {
    // data-config 속성 변경 시 변경 감지
    return ['data-config'];
  }

  constructor() {
    super();
    // Shadow DOM 생성
    this.attachShadow({ mode: 'open' }); 
    this._config = {};
    this.swiper = null;

    // 최초 DOM 렌더
    this._render();
  }

  attributeChangedCallback(name, oldValue, newValue) {
    // data-config 속성이 변경될 때 호출
    if (name === 'data-config') {
      this._config = JSON.parse(newValue || '{}');
      this._initSwiper();
    }
  }

  connectedCallback() {
    // 최초 DOM이 문서에 붙었을 때 호출
    if (this.getAttribute('data-config')) {
      this._config = JSON.parse(this.getAttribute('data-config'));
    }
    this._initSwiper();
  }

  _render() {
    // 기본 마크업 정의
    this.shadowRoot.innerHTML = `
      <div class="swiper">
        <div class="swiper-wrapper"><slot></slot></div>
        <div class="swiper-button-next"></div>
        <div class="swiper-button-prev"></div>
        <div class="swiper-pagination"></div>
      </div>
    `;
  }

  _initSwiper() {
    // 기존 스와이프 인스턴스 있으면 삭제 후 재생성
    if (this.swiper) {
      this.swiper.destroy();
      this.swiper = null;
    }

    // 내비게이션, 페이지네이션 DOM 요소 찾기
    const nextButton = this.shadowRoot.querySelector('.swiper-button-next');
    const prevButton = this.shadowRoot.querySelector('.swiper-button-prev');
    const paginationEl = this.shadowRoot.querySelector('.swiper-pagination');

    // 기본 설정값 + data-config 병합
    const _config = {
      slidesPerView: 1,
      spaceBetween: 0,
      navigation: {
        nextEl: nextButton,
        prevEl: prevButton,
      },
      pagination: {
        el: paginationEl,
        clickable: true,
      },
      ...this._config,
    };
    // Swiper 생성
    this.swiper = new Swiper(this.shadowRoot.querySelector('.swiper'), _config);
  }
}

// 브라우저가 <swiper-carousel> 태그를 알도록 정의
customElements.define("swiper-carousel", SwiperCarousel);
