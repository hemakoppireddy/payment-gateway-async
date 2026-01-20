(function () {
  class PaymentGateway {
    constructor(options) {
      if (!options || !options.key || !options.orderId) {
        throw new Error("key and orderId are required");
      }

      this.key = options.key;
      this.orderId = options.orderId;
      this.onSuccess = options.onSuccess || function () {};
      this.onFailure = options.onFailure || function () {};
      this.onClose = options.onClose || function () {};

      this.modal = null;
      this.handleMessage = this.handleMessage.bind(this);
    }

    open() {
      // Modal container
      const modal = document.createElement("div");
      modal.id = "payment-gateway-modal";
      modal.setAttribute("data-test-id", "payment-modal");

      modal.innerHTML = `
        <div class="modal-overlay" style="
          position: fixed;
          top: 0; left: 0;
          width: 100%; height: 100%;
          background: rgba(0,0,0,0.6);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 9999;
        ">
          <div class="modal-content" style="
            background: #fff;
            width: 400px;
            height: 500px;
            position: relative;
          ">
            <iframe
              data-test-id="payment-iframe"
              src="http://localhost:3001/checkout?order_id=${this.orderId}&embedded=true"
              style="border: none; width: 100%; height: 100%;"
            ></iframe>

            <button
              data-test-id="close-modal-button"
              style="
                position: absolute;
                top: 5px;
                right: 10px;
                font-size: 20px;
                background: none;
                border: none;
                cursor: pointer;
              "
            >×</button>
          </div>
        </div>
      `;

      modal
        .querySelector('[data-test-id="close-modal-button"]')
        .addEventListener("click", () => this.close());

      document.body.appendChild(modal);
      this.modal = modal;

      window.addEventListener("message", this.handleMessage);
    }

    handleMessage(event) {
      if (!event.data || !event.data.type) return;

      if (event.data.type === "payment_success") {
        this.onSuccess(event.data.data);
        this.close();
      }

      if (event.data.type === "payment_failed") {
        this.onFailure(event.data.data);
      }

      if (event.data.type === "close_modal") {
        this.close();
      }
    }

    close() {
      if (this.modal) {
        window.removeEventListener("message", this.handleMessage);
        document.body.removeChild(this.modal);
        this.modal = null;
        this.onClose();
      }
    }
  }

  // Expose globally
  window.PaymentGateway = PaymentGateway;
})();
