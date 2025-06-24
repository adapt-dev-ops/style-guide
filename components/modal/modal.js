class CustomModal extends HTMLElement {
    constructor() {
      super();
      this.attachShadow({ mode: 'open' });
      this._render();
      this._bind();
    }
    _render() {
      this.shadowRoot.innerHTML = `
        <div class="overlay" part="overlay">
          <div class="content" part="content">
            <slot></slot>
          </div>
        </div>
        <style>
          .overlay { 
            position: fixed; 
            top:0; left:0; right:0; bottom:0; 
            display: none; justify-content: center; align-items: center;
          }
          .overlay.show { display: flex; }
        </style>
      `;
    }
    _bind() {
      this.shadowRoot.querySelector('.overlay').addEventListener('click', (e) => {
        if (e.target.classList.contains('overlay')) this.close();
      });
    }
    open() {
      this.shadowRoot.querySelector('.overlay').classList.add('show');
    }
    close() {
      this.shadowRoot.querySelector('.overlay').classList.remove('show');
    }
  }
  customElements.define("custom-modal", CustomModal);
  