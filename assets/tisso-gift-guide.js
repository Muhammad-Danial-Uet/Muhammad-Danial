(function () {
  'use strict';

  function initTissoGiftGuide() {
    const popup = document.querySelector('[data-tisso-popup]');

    if (!popup) return;

    const popupImage = popup.querySelector('[data-popup-image]');
    const popupTitle = popup.querySelector('[data-popup-title]');
    const popupPrice = popup.querySelector('[data-popup-price]');
    const popupDescription = popup.querySelector('[data-popup-description]');
    const popupVariants = popup.querySelector('[data-popup-variants]');
    const popupError = popup.querySelector('[data-popup-error]');
    const form = popup.querySelector('[data-add-to-cart-form]');
    const addButton = popup.querySelector('[data-add-to-cart]');

    if (
      !popupImage ||
      !popupTitle ||
      !popupPrice ||
      !popupDescription ||
      !popupVariants ||
      !popupError ||
      !form ||
      !addButton
    ) {
      return;
    }

    let currentProduct = null;
    let selectedVariantId = null;

    // Format price.
    function formatMoney(priceInCents) {
      const amount = Number(priceInCents || 0) / 100;

      return new Intl.NumberFormat(
        document.documentElement.lang || 'en-US',
        {
          style: 'currency',
          currency: 'EUR'
        }
      ).format(amount);
    }

    // Open product popup.
    function openPopup(product) {
      if (!product) return;

      currentProduct = product;
      selectedVariantId = null;

      popupError.hidden = true;
      popupError.textContent = '';

      if (product.featured_image) {
        popupImage.src = product.featured_image;
        popupImage.alt = product.title || '';
        popupImage.style.display = 'block';
      } else {
        popupImage.removeAttribute('src');
        popupImage.alt = '';
        popupImage.style.display = 'none';
      }

      popupTitle.textContent = product.title || '';
      popupDescription.innerHTML = product.description || '';

      if (product.price !== undefined) {
        popupPrice.textContent = formatMoney(product.price);
      } else {
        popupPrice.textContent = '';
      }

      addButton.disabled = false;
      renderVariants(product);

      popup.classList.add('is-open');
      popup.setAttribute('aria-hidden', 'false');
      document.body.classList.add('tisso-popup-open');
    }

    // Close product popup.
    function closePopup() {
      popup.classList.remove('is-open');
      popup.setAttribute('aria-hidden', 'true');

      document.body.classList.remove('tisso-popup-open');

      currentProduct = null;
      selectedVariantId = null;

      popupVariants.innerHTML = '';
      popupError.hidden = true;
      popupError.textContent = '';
      addButton.disabled = false;
    }

    // Create variant selectors.
    function renderVariants(product) {
      popupVariants.innerHTML = '';
      selectedVariantId = null;
      addButton.disabled = false;

      if (!product.variants || !product.variants.length) {
        addButton.disabled = true;
        return;
      }

      const availableVariants = product.variants.filter(
        variant => variant.available
      );

      if (!availableVariants.length) {
        addButton.disabled = true;

        const message = document.createElement('p');
        message.textContent = 'This product is currently unavailable.';
        popupVariants.appendChild(message);

        return;
      }

      const optionNames = Array.isArray(product.options)
        ? product.options
        : [];

      if (
        optionNames.length === 0 ||
        (
          optionNames.length === 1 &&
          optionNames[0] === 'Title'
        )
      ) {
        const availableVariant = availableVariants[0];

        selectedVariantId = availableVariant.id;
        popupPrice.textContent = formatMoney(
          availableVariant.price
        );

        return;
      }

      optionNames.forEach((optionName, optionIndex) => {
        const wrapper = document.createElement('div');
        wrapper.className = 'tisso-variant';

        const label = document.createElement('label');
        label.textContent = optionName;

        const select = document.createElement('select');
        select.dataset.optionIndex = optionIndex;

        const values = [];

        availableVariants.forEach(variant => {
          const value =
            variant.options &&
            variant.options[optionIndex];

          if (
            value &&
            !values.includes(value)
          ) {
            values.push(value);
          }
        });

        values.forEach(value => {
          const option = document.createElement('option');

          option.value = value;
          option.textContent = value;

          select.appendChild(option);
        });

        wrapper.appendChild(label);
        wrapper.appendChild(select);

        popupVariants.appendChild(wrapper);
      });

      updateSelectedVariant();
    }

    // Find selected variant.
    function updateSelectedVariant() {
      if (!currentProduct) return;

      const selects = [
        ...popupVariants.querySelectorAll('select')
      ];

      if (!selects.length) {
        const availableVariant =
          currentProduct.variants.find(
            variant => variant.available
          );

        if (availableVariant) {
          selectedVariantId = availableVariant.id;

          popupPrice.textContent =
            formatMoney(availableVariant.price);

          addButton.disabled = false;
        }

        return;
      }

      const selectedOptions = selects.map(
        select => select.value
      );

      const variant =
        currentProduct.variants.find(
          productVariant => {
            if (
              !productVariant.options ||
              productVariant.options.length === 0
            ) {
              return false;
            }

            return productVariant.options.every(
              (option, index) =>
                option === selectedOptions[index]
            );
          }
        );

      if (variant) {
        if (variant.available) {
          selectedVariantId = variant.id;

          popupPrice.textContent =
            formatMoney(variant.price);

          addButton.disabled = false;

          popupError.hidden = true;
          popupError.textContent = '';
        } else {
          selectedVariantId = null;
          addButton.disabled = true;

          popupError.textContent =
            'This variant is currently unavailable.';

          popupError.hidden = false;
        }
      } else {
        selectedVariantId = null;
        addButton.disabled = true;

        popupError.textContent =
          'This combination is unavailable.';

        popupError.hidden = false;
      }
    }

    // Add product to Shopify cart.
    async function addToCart(variantId) {
      const response = await fetch(
        `${window.Shopify.routes.root}cart/add.js`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: JSON.stringify({
            items: [
              {
                id: Number(variantId),
                quantity: 1
              }
            ]
          })
        }
      );

      if (!response.ok) {
        let errorMessage =
          'Unable to add product to cart.';

        try {
          const errorData = await response.json();

          if (errorData.message) {
            errorMessage = errorData.message;
          }
        } catch (error) {
          // Keep default error message.
        }

        throw new Error(errorMessage);
      }

      return response.json();
    }

    // Open product popup.
    document.addEventListener(
      'click',
      function (event) {
        const openButton =
          event.target.closest(
            '[data-product-popup-open]'
          );

        if (!openButton) return;

        const card =
          openButton.closest(
            '[data-product-card]'
          );

        if (!card) return;

        const productJSON =
          card.querySelector(
            'script[data-product-data]'
          );

        if (!productJSON) {
          console.error(
            'Tisso: Product JSON not found.'
          );

          return;
        }

        try {
          const product =
            JSON.parse(
              productJSON.textContent
            );

          openPopup(product);
        } catch (error) {
          console.error(
            'Tisso: Could not read product data.',
            error
          );
        }
      }
    );

    // Close popup.
    popup.addEventListener(
      'click',
      function (event) {
        const closeButton =
          event.target.closest(
            '[data-product-popup-close]'
          );

        if (closeButton) {
          closePopup();
        }
      }
    );

    // Handle variant changes.
    popupVariants.addEventListener(
      'change',
      function () {
        updateSelectedVariant();
      }
    );

    // Add selected variant to cart.
    form.addEventListener(
      'submit',
      async function (event) {
        event.preventDefault();

        if (!selectedVariantId) {
          popupError.textContent =
            'Please select a valid variant.';

          popupError.hidden = false;

          return;
        }

        popupError.hidden = true;

        const originalButtonHTML =
          addButton.innerHTML;

        addButton.disabled = true;

        addButton.innerHTML =
          '<span>ADDING...</span><span>→</span>';

        try {
          await addToCart(
            selectedVariantId
          );

          window.location.href = '/cart';
        } catch (error) {
          console.error(
            'Tisso Add to Cart Error:',
            error
          );

          popupError.textContent =
            error.message ||
            'Unable to add the product to cart. Please try again.';

          popupError.hidden = false;

          addButton.disabled = false;

          addButton.innerHTML =
            originalButtonHTML;
        }
      }
    );

    // Close popup with Escape.
    document.addEventListener(
      'keydown',
      function (event) {
        if (
          event.key === 'Escape' &&
          popup.classList.contains('is-open')
        ) {
          closePopup();
        }
      }
    );
  }

  // Initialize on page load.
  if (document.readyState === 'loading') {
    document.addEventListener(
      'DOMContentLoaded',
      initTissoGiftGuide
    );
  } else {
    initTissoGiftGuide();
  }

  // Reinitialize in Shopify Theme Editor.
  document.addEventListener(
    'shopify:section:load',
    function () {
      initTissoGiftGuide();
    }
  );

})();
