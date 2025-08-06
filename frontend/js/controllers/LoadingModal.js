const LoadingModal = {
  _modalEl: null,

  init() {
    // crea l'elemento solo una volta
    if (this._modalEl) return;

    const div = document.createElement('div');
    div.className = 'loading-modal';
    div.id = 'loading-modal';
    div.innerHTML = `<div class="spinner"></div>`;
    document.body.appendChild(div);

    this._modalEl = div;

    // Supporto custom events
    document.addEventListener('loading:show', () => this.show());
    document.addEventListener('loading:hide', () => this.hide());
  },

  show() {
    if (!this._modalEl) this.init();
    this._modalEl.classList.add('active');
  },

  hide() {
    if (!this._modalEl) return;
    this._modalEl.classList.remove('active');
  }
};

export default LoadingModal;