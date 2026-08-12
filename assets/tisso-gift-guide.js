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
      !form ||
      !addButton
    ) {
      return;
    }

    let currentProduct = null;
    let selectedVariantId = null;

    /*
     * FORMAT PRICE
     */
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

    /*
     * OPEN PRODUCT POPUP
     */
    function openPopup(product) {
      if (!product) return;

      currentProduct = product;
      selectedVariantId = null;

      popupError.hidden = true;
      popupError.textContent = '';

      /*
       * PRODUCT IMAGE
       */
      if (product.featured_image) {
        popupImage.src = product.featured_image;
        popupImage.alt = product.title || '';
        popupImage.style.display = 'block';
      } else {
        popupImage.removeAttribute('src');
        popupImage.alt = '';
        popupImage.style.display = 'none';
      }

      /*
       * PRODUCT TITLE
       */
      popupTitle.textContent = product.title || '';

      /*
       * PRODUCT DESCRIPTION
       */
      popupDescription.innerHTML = product.description || '';

      /*
       * PRODUCT PRICE
       */
      if (product.price !== undefined) {
        popupPrice.textContent = formatMoney(product.price);
      } else {
        popupPrice.textContent = '';
      }

      /*
       * VARIANTS
       */
      renderVariants(product);

      /*
       * OPEN POPUP
       */
      popup.classList.add('is-open');
      popup.setAttribute('aria-hidden', 'false');

      document.body.classList.add('tisso-popup-open');
    }

    /*
     * CLOSE PRODUCT POPUP
     */
    function closePopup() {
      popup.classList.remove('is-open');
      popup.setAttribute('aria-hidden', 'true');

      document.body.classList.remove('tisso-popup-open');

      currentProduct = null;
      selectedVariantId = null;

      popupVariants.innerHTML = '';
      popupError.hidden = true;
      popupError.textContent = '';
    }

    /*
     * CREATE VARIANT SELECTORS
     */
    function renderVariants(product) {
      popupVariants.innerHTML = '';

      if (!product.variants || !product.variants.length) {
        return;
      }

      const optionNames = Array.isArray(product.options)
        ? product.options
        : [];

      /*
       * If the product has no real options,
       * simply use the first available variant.
       */
      if (
        optionNames.length === 0 ||
        (
          optionNames.length === 1 &&
          optionNames[0] === 'Title'
        )
      ) {
        const availableVariant = product.variants.find(
          variant => variant.available
        );

        if (availableVariant) {
          selectedVariantId = availableVariant.id;

          popupPrice.textContent = formatMoney(
            availableVariant.price
          );
        } else {
          selectedVariantId = null;
          addButton.disabled = true;
        }

        return;
      }

      const availableVariants = product.variants.filter(
        variant => variant.available
      );

      if (!availableVariants.length) {
        selectedVariantId = null;
        addButton.disabled = true;

        const unavailableMessage =
          document.createElement('p');

        unavailableMessage.textContent =
          'This product is currently unavailable.';

        popupVariants.appendChild(
          unavailableMessage
        );

        return;
      }

      addButton.disabled = false;

      /*
       * CREATE ONE SELECT FOR EACH PRODUCT OPTION
       */
      optionNames.forEach(
        (optionName, optionIndex) => {

          const wrapper =
            document.createElement('div');

          wrapper.className = 'tisso-variant';

          const label =
            document.createElement('label');

          label.textContent = optionName;

          const select =
            document.createElement('select');

          select.dataset.optionIndex =
            optionIndex;

          /*
           * GET UNIQUE OPTION VALUES
           */
          const values = [];

          availableVariants.forEach(
            variant => {

              const value =
                variant.options &&
                variant.options[optionIndex];

              if (
                value &&
                !values.includes(value)
              ) {
                values.push(value);
              }
            }
          );

          /*
           * ADD OPTIONS TO SELECT
           */
          values.forEach(value => {

            const option =
              document.createElement('option');

            option.value = value;
            option.textContent = value;

            select.appendChild(option);
          });

          wrapper.appendChild(label);
          wrapper.appendChild(select);

          popupVariants.appendChild(wrapper);
        }
      );

      updateSelectedVariant();
    }

    /*
     * FIND SELECTED VARIANT
     */
    function updateSelectedVariant() {
      if (!currentProduct) return;

      const selects = [
        ...popupVariants.querySelectorAll('select')
      ];

      /*
       * Products without selectable options
       */
      if (!selects.length) {
        const availableVariant =
          currentProduct.variants.find(
            variant => variant.available
          );

        if (availableVariant) {
          selectedVariantId =
            availableVariant.id;

          popupPrice.textContent =
            formatMoney(
              availableVariant.price
            );

          addButton.disabled = false;
        }

        return;
      }

      const selectedOptions =
        selects.map(select => select.value);

      /*
       * FIND EXACT MATCHING VARIANT
       */
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

      /*
       * VALID VARIANT
       */
      if (variant) {

        selectedVariantId = variant.id;

        popupPrice.textContent =
          formatMoney(variant.price);

        if (variant.available) {
          addButton.disabled = false;
          popupError.hidden = true;
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

    /*
     * ADD PRODUCT TO SHOPIFY CART
     */
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
          const errorData =
            await response.json();

          if (errorData.message) {
            errorMessage =
              errorData.message;
          }
        } catch (error) {
          /*
           * Keep default error message
           */
        }

        throw new Error(errorMessage);
      }

      return response.json();
    }

    /*
     * PRODUCT + BUTTON CLICK
     *
     * Event delegation is used so it also works
     * more reliably inside Shopify Theme Editor.
     */
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
            '[data-product-data] script'
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

    /*
     * CLOSE POPUP
     */
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

    /*
     * VARIANT CHANGE
     */
    popupVariants.addEventListener(
      'change',
      function () {
        updateSelectedVariant();
      }
    );

    /*
     * ADD TO CART
     */
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

          /*
           * Go directly to Shopify cart
           */
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

    /*
     * ESCAPE KEY CLOSES POPUP
     */
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

  /*
   * INITIAL PAGE LOAD
   */
  if (
    document.readyState === 'loading'
  ) {

    document.addEventListener(
      'DOMContentLoaded',
      initTissoGiftGuide
    );

  } else {

    initTissoGiftGuide();
  }

  /*
   * SHOPIFY THEME EDITOR
   *
   * Re-initialize when Shopify reloads
   * or changes a section.
   */
  document.addEventListener(
    'shopify:section:load',
    function () {
      initTissoGiftGuide();
    }
  );

})();
