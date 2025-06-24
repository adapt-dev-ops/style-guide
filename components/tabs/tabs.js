class CustomTabs extends HTMLElement {
    constructor() {
      super();
      this.attachShadow({ mode: 'open' });
      this._render();
    }
    _render() {
      this.shadowRoot.innerHTML = `
        <div class="tabs">
          <slot></slot>
        </div>
        <style>
          .tabs { display: flex; gap: 10px; }
        </style>
      `;
    }
  }
  customElements.define("custom-tabs", CustomTabs);
  