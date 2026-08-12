/**
 * Tisso Product Grid Hotspot Modal
 */
class TissoGrid {
  constructor(container) {
    this.container = container;
    this.popup = document.querySelector('[data-tisso-popup]');
    if (!this.popup) return;

    this.popupOverlay = this.popup.querySelector('.tisso-popup__overlay');
    this.popupCloseBtns = this.popup.querySelectorAll('[data-product-popup-close]');
    this.popupImg = this.popup.querySelector('[data-popup-image]');
    this.popupTitle = this.popup.querySelector('[data-popup-title]');
    this.popupPrice = this.popup.querySelector('[data-popup-price]');
    this.popupDesc = this.popup.querySelector('[data-popup-description]');
    this.popupVariants = this.popup.querySelector('[data-popup-variants]');
    this.form = this.popup.querySelector('[data-add-to-cart-form]');
    this.addToCartBtn = this.popup.querySelector('[data-add-to-cart]');
    this.addToCartText = this.popup.querySelector('[data-add-to-cart-text]');
    this.errorMsg = this.popup.querySelector('[data-popup-error]');

    this.currentProduct = null;
    this.selectedOptions = {};

    this.init();
  }

  init() {
    this.bindEvents();
  }

  bindEvents() {
    // Open hotspot popup
    this.container.querySelectorAll('[data-product-card]').forEach((card) => {
      const openBtn = card.querySelector('[data-product-popup-open]');
      const dataScript = card.querySelector('[data-product-data]');

      if (!openBtn || !dataScript) return;

      openBtn.addEventListener('click', () => {
        try {
          const rawData = JSON.parse(dataScript.textContent);
          
          // Handle both product handle string and full product object
          if (typeof rawData === 'string') {
            this.fetchProductByHandle(rawData);
          } else if (typeof rawData === 'object' && rawData !== null) {
            this.renderPopup(rawData);
          }
        } catch (err) {
          console.error('Error parsing product data:', err);
        }
      });
    });

    // Close popup handlers
    this.popupCloseBtns.forEach((btn) => {
      btn.addEventListener('click', () => this.closePopup());
    });

    // Close on Escape key press
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.popup.classList.contains('is-open')) {
        this.closePopup();
      }
    });

    // Handle Add To Cart Form submission
    if (this.form) {
      this.form.addEventListener('submit', (e) => this.handleAddToCart(e));
    }
  }

  async fetchProductByHandle(handle) {
    try {
      this.addToCartBtn.disabled = true;
      const res = await fetch(`/products/${handle}.js`);
      if (!res.ok) throw new Error('Network response was not ok');
      const product = await res.json();
      this.renderPopup(product);
    } catch (err) {
      console.error('Failed to load product details:', err);
    } finally {
      this.addToCartBtn.disabled = false;
    }
  }

  renderPopup(product) {
    this.currentProduct = product;
    this.selectedOptions = {};

    // 1. Populate image
    const featuredImage = product.featured_image || (product.images && product.images[0]) || '';
    if (this.popupImg) {
      this.popupImg.src = featuredImage;
      this.popupImg.alt = product.title;
    }

    // 2. Populate title, price, description
    if (this.popupTitle) this.popupTitle.textContent = product.title;
    if (this.popupPrice) this.popupPrice.textContent = this.formatMoney(product.price);
    if (this.popupDesc) {
      // Strip HTML tags for clean description snippet
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = product.description || '';
      this.popupDesc.textContent = tempDiv.textContent || tempDiv.innerText || '';
    }

    // 3. Render Variants/Options
    this.renderVariants(product);

    // 4. Reset Error Message
    if (this.errorMsg) {
      this.errorMsg.hidden = true;
      this.errorMsg.textContent = '';
    }

    // 5. Open Modal
    this.openPopup();
  }

  renderVariants(product) {
    if (!this.popupVariants) return;
    this.popupVariants.innerHTML = '';

    // If product has single default variant
    if (product.variants.length === 1 && product.variants[0].title.includes('Default')) {
      this.selectedOptions = { id: product.variants[0].id };
      this.updateVariantAvailability(product.variants[0]);
      return;
    }

    // Process options
    const options = product.options || [];

    options.forEach((option, index) => {
      const optionName = typeof option === 'string' ? option : option.name;
      const optionValues = typeof option === 'string' 
        ? [...new Set(product.variants.map((v) => v.options[index]))] 
        : option.values;

      const variantGroup = document.createElement('div');
      variantGroup.className = 'tisso-variant';

      const label = document.createElement('label');
      label.textContent = optionName;
      variantGroup.appendChild(label);

      // Render button styles for Color / standard dropdowns
      if (optionName.toLowerCase() === 'color' || optionName.toLowerCase() === 'colour') {
        const btnContainer = document.createElement('div');
        btnContainer.className = 'tisso-color-options';

        optionValues.forEach((value, vIdx) => {
          const btn = document.createElement('button');
          btn.type = 'button';
          btn.className = `tisso-color-option ${vIdx === 0 ? 'is-selected' : ''}`;
          btn.textContent = value;

          if (vIdx === 0) this.selectedOptions[`option${index + 1}`] = value;

          btn.addEventListener('click', () => {
            btnContainer.querySelectorAll('.tisso-color-option').forEach(b => b.classList.remove('is-selected'));
            btn.classList.add('is-selected');
            this.selectedOptions[`option${index + 1}`] = value;
            this.onVariantChange();
          });

          btnContainer.appendChild(btn);
        });

        variantGroup.appendChild(btnContainer);
      } else {
        // Standard Select Dropdown
        const select = document.createElement('select');
        optionValues.forEach((value) => {
          const opt = document.createElement('option');
          opt.value = value;
          opt.textContent = value;
          select.appendChild(opt);
        });

        this.selectedOptions[`option${index + 1}`] = optionValues[0];

        select.addEventListener('change', (e) => {
          this.selectedOptions[`option${index + 1}`] = e.target.value;
          this.onVariantChange();
        });

        variantGroup.appendChild(select);
      }

      this.popupVariants.appendChild(variantGroup);
    });

    this.onVariantChange();
  }

  onVariantChange() {
    const matchedVariant = this.currentProduct.variants.find((variant) => {
      return (
        (!this.selectedOptions.option1 || variant.option1 === this.selectedOptions.option1) &&
        (!this.selectedOptions.option2 || variant.option2 === this.selectedOptions.option2) &&
        (!this.selectedOptions.option3 || variant.option3 === this.selectedOptions.option3)
      );
    });

    this.updateVariantAvailability(matchedVariant);
  }

  updateVariantAvailability(variant) {
    if (!variant) {
      if (this.addToCartBtn) this.addToCartBtn.disabled = true;
      if (this.addToCartText) this.addToCartText.textContent = 'UNAVAILABLE';
      return;
    }

    if (this.popupPrice) {
      this.popupPrice.textContent = this.formatMoney(variant.price);
    }

    if (variant.featured_image && variant.featured_image.src && this.popupImg) {
      this.popupImg.src = variant.featured_image.src;
    }

    if (variant.available) {
      if (this.addToCartBtn) this.addToCartBtn.disabled = false;
      if (this.addToCartText) this.addToCartText.textContent = 'ADD TO CART';
    } else {
      if (this.addToCartBtn) this.addToCartBtn.disabled = true;
      if (this.addToCartText) this.addToCartText.textContent = 'SOLD OUT';
    }

    this.selectedVariantId = variant.id;
  }

  async handleAddToCart(e) {
    e.preventDefault();
    if (!this.selectedVariantId) return;

    this.addToCartBtn.disabled = true;
    const originalText = this.addToCartText.textContent;
    this.addToCartText.textContent = 'ADDING...';

    try {
      const response = await fetch('/cart/add.js', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          id: this.selectedVariantId,
          quantity: 1
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.description || 'Failed to add item to cart');
      }

      this.addToCartText.textContent = 'ADDED!';
      
      // Update Shopify Cart Drawer/Header count if theme supports standard events
      document.dispatchEvent(new CustomEvent('cart:refresh'));

      setTimeout(() => {
        this.closePopup();
        this.addToCartText.textContent = originalText;
      }, 800);

    } catch (err) {
      if (this.errorMsg) {
        this.errorMsg.textContent = err.message;
        this.errorMsg.hidden = false;
      }
      this.addToCartText.textContent = originalText;
      this.addToCartBtn.disabled = false;
    }
  }

  openPopup() {
    this.popup.classList.add('is-open');
    this.popup.setAttribute('aria-hidden', 'false');
    document.body.classList.add('tisso-popup-open');
  }

  closePopup() {
    this.popup.classList.remove('is-open');
    this.popup.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('tisso-popup-open');
  }

  formatMoney(cents) {
    if (typeof Shopify !== 'undefined' && Shopify.formatMoney) {
      return Shopify.formatMoney(cents);
    }
    return '$' + (cents / 100).toFixed(2);
  }
}

// Auto-initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  const gridSection = document.querySelector('[data-tisso-grid]');
  if (gridSection) {
    new TissoGrid(gridSection);
  }
});
