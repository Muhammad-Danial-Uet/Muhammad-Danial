(function () {
  'use strict';

  function initTissoGiftGuide() {
    const popup = document.querySelector('[data-tisso-popup]');

    if (!popup) {
      console.error('Tisso: popup not found');
      return;
    }

    const popupImage = popup.querySelector('[data-popup-image]');
    const popupTitle = popup.querySelector('[data-popup-title]');
    const popupPrice = popup.querySelector('[data-popup-price]');
    const popupDescription = popup.querySelector('[data-popup-description]');
    const popupVariants = popup.querySelector('[data-popup-variants]');
    const popupError = popup.querySelector('[data-popup-error]');
    const form = popup.querySelector('[data-add-to-cart-form]');
    const addButton = popup.querySelector('[data-add-to-cart]');
    const addButtonText = popup.querySelector('[data-add-to-cart-text]');

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
      console.error('Tisso: required popup elements are missing');
      return;
    }

    let currentProduct = null;
    let selectedVariant = null;

    // Format Shopify cents as EUR.
    function formatMoney(value) {
      const amount = Number(value || 0) / 100;

      return amount.toLocaleString('en-US', {
        style: 'currency',
        currency: 'EUR'
      });
    }

    // Get a variant option safely.
    function getVariantOption(variant, index) {
      const key = 'option' + (index + 1);
      return variant && variant[key] != null ? String(variant[key]) : '';
    }

    // Get all available variants.
    function getAvailableVariants(product) {
      if (!product || !Array.isArray(product.variants)) {
        return [];
      }

      return product.variants.filter(function (variant) {
        return variant && (
          variant.available === true ||
          variant.available === 'true' ||
          variant.available === 1
        );
      });
    }

    // Check whether a variant is available.
    function isVariantAvailable(variant) {
      return !!variant && (
        variant.available === true ||
        variant.available === 'true' ||
        variant.available === 1
      );
    }

    // Find a variant from the currently selected options.
    function findSelectedVariant() {
      if (!currentProduct || !Array.isArray(currentProduct.variants)) {
        return null;
      }

      const selects = popupVariants.querySelectorAll('select');

      if (!selects.length) {
        return getAvailableVariants(currentProduct)[0] || null;
      }

      const selectedOptions = Array.from(selects).map(function (select) {
        return String(select.value);
      });

      return currentProduct.variants.find(function (variant) {
        if (!isVariantAvailable(variant)) {
          return false;
        }

        return selectedOptions.every(function (value, index) {
          return getVariantOption(variant, index) === value;
        });
      }) || null;
    }

    // Update price and button state.
    function updateVariant() {
      selectedVariant = findSelectedVariant();

      if (!selectedVariant) {
        addButton.disabled = true;

        if (addButtonText) {
          addButtonText.textContent = 'SOLD OUT';
        }

        return;
      }

      popupPrice.textContent = formatMoney(selectedVariant.price);

      addButton.disabled = false;

      if (addButtonText) {
        addButtonText.textContent = 'ADD TO CART';
      }
    }

    // Create a variant select.
    function createVariantSelect(optionName, optionIndex, product) {
      const wrapper = document.createElement('div');
      wrapper.className = 'tisso-variant';

      const label = document.createElement('label');
      label.textContent = optionName;

      const select = document.createElement('select');
      select.className = 'tisso-variant-select';
      select.setAttribute('data-option-index', String(optionIndex));

      const values = [];

      product.variants.forEach(function (variant) {
        const value = getVariantOption(variant, optionIndex);

        if (value && !values.includes(value)) {
          values.push(value);
        }
      });

      values.forEach(function (value) {
        const option = document.createElement('option');

        option.value = value;
        option.textContent = value;

        select.appendChild(option);
      });

      select.addEventListener('change', updateVariant);

      wrapper.appendChild(label);
      wrapper.appendChild(select);

      return select;
    }

    // Set selects to the first available variant.
    function selectFirstAvailableVariant(product) {
      const availableVariants = getAvailableVariants(product);

      if (!availableVariants.length) {
        return;
      }

      const firstVariant = availableVariants[0];
      const selects = popupVariants.querySelectorAll('select');

      selects.forEach(function (select, index) {
        const value = getVariantOption(firstVariant, index);

        const matchingOption = Array.from(select.options).find(function (option) {
          return option.value === value;
        });

        if (matchingOption) {
          select.value = matchingOption.value;
        }
      });
    }

    // Render all product variants.
    function renderVariants(product) {
      popupVariants.innerHTML = '';
      selectedVariant = null;

      if (!product || !Array.isArray(product.variants) || !product.variants.length) {
        addButton.disabled = true;

        if (addButtonText) {
          addButtonText.textContent = 'SOLD OUT';
        }

        return;
      }

      const options = Array.isArray(product.options)
        ? product.options.filter(function (option) {
            return option && option !== 'Title';
          })
        : [];

      if (!options.length) {
        const availableVariant = getAvailableVariants(product)[0];

        if (!availableVariant) {
          addButton.disabled = true;

          if (addButtonText) {
            addButtonText.textContent = 'SOLD OUT';
          }

          return;
        }

        selectedVariant = availableVariant;
        popupPrice.textContent = formatMoney(availableVariant.price);
        addButton.disabled = false;

        if (addButtonText) {
          addButtonText.textContent = 'ADD TO CART';
        }

        return;
      }

      options.forEach(function (optionName) {
        const optionIndex = product.options.indexOf(optionName);

        createVariantSelect(
          optionName,
          optionIndex,
          product
        );
      });

      selectFirstAvailableVariant(product);
      updateVariant();
    }

    // Get the product image URL.
    function getProductImage(product) {
      if (!product) {
        return '';
      }

      if (typeof product.featured_image === 'string') {
        return product.featured_image;
      }

      if (
        product.featured_image &&
        typeof product.featured_image === 'object'
      ) {
        return (
          product.featured_image.src ||
          product.featured_image.url ||
          ''
        );
      }

      if (Array.isArray(product.images) && product.images.length) {
        const firstImage = product.images[0];

        if (typeof firstImage === 'string') {
          return firstImage;
        }

        if (firstImage && typeof firstImage === 'object') {
          return firstImage.src || firstImage.url || '';
        }
      }

      return '';
    }

    // Open the product popup.
    function openPopup(product) {
      currentProduct = product;

      const imageURL = getProductImage(product);

      if (imageURL) {
        popupImage.src = imageURL;
        popupImage.alt = product.title || '';
        popupImage.style.display = 'block';
      } else {
        popupImage.removeAttribute('src');
        popupImage.alt = '';
        popupImage.style.display = 'none';
      }

      popupTitle.textContent = product.title || '';

      popupDescription.innerHTML = product.description || '';

      popupPrice.textContent = formatMoney(product.price);

      popupError.hidden = true;
      popupError.textContent = '';

      renderVariants(product);

      popup.classList.add('is-open');
      popup.setAttribute('aria-hidden', 'false');

      document.body.classList.add('tisso-popup-open');
    }

    // Close the popup.
    function closePopup() {
      popup.classList.remove('is-open');
      popup.setAttribute('aria-hidden', 'true');
      document.body.classList.remove('tisso-popup-open');

      currentProduct = null;
      selectedVariant = null;
    }

    // Get the selected option values.
    function getSelectedOptions() {
      const values = {};

      const selects = popupVariants.querySelectorAll('select');

      selects.forEach(function (select) {
        const index = Number(
          select.getAttribute('data-option-index')
        );

        if (currentProduct && currentProduct.options) {
          const optionName = currentProduct.options[index];

          if (optionName) {
            values[optionName.toLowerCase()] = select.value;
          }
        }
      });

      return values;
    }

    // Check whether the special Black + Medium combination was selected.
    function isSpecialCombination() {
      const options = getSelectedOptions();

      const color = options.color
        ? String(options.color).trim().toLowerCase()
        : '';

      const size = options.size
        ? String(options.size).trim().toLowerCase()
        : '';

      return color === 'black' && size === 'medium';
    }

    // Find the Soft Winter Jacket variant.
    async function getSoftWinterJacketVariant() {
      try {
        const response = await fetch(
          '/products/soft-winter-jacket.js',
          {
            method: 'GET',
            headers: {
              Accept: 'application/json'
            }
          }
        );

        if (!response.ok) {
          return null;
        }

        const product = await response.json();

        if (
          !product ||
          !Array.isArray(product.variants)
        ) {
          return null;
        }

        return (
          product.variants.find(function (variant) {
            return isVariantAvailable(variant);
          }) || null
        );
      } catch (error) {
        console.error(
          'Tisso: unable to find Soft Winter Jacket',
          error
        );

        return null;
      }
    }

    // Add one or more variants to the Shopify cart.
    async function addItemsToCart(items) {
      const cartURL =
        window.Shopify &&
        window.Shopify.routes &&
        window.Shopify.routes.root
          ? window.Shopify.routes.root + 'cart/add.js'
          : '/cart/add.js';

      const response = await fetch(
        cartURL,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json'
          },
          body: JSON.stringify({
            items: items
          })
        }
      );

      let data = null;

      try {
        data = await response.json();
      } catch (error) {
        data = null;
      }

      if (!response.ok) {
        throw new Error(
          data &&
          (
            data.description ||
            data.message
          )
            ? (
                data.description ||
                data.message
              )
            : 'Unable to add product to cart.'
        );
      }

      return data;
    }

    // Open product buttons.
    document
      .querySelectorAll('[data-product-popup-open]')
      .forEach(function (button) {
        button.addEventListener('click', function (event) {
          event.preventDefault();
          event.stopPropagation();

          const card = button.closest('[data-product-card]');

          if (!card) {
            console.error('Tisso: product card not found');
            return;
          }

          const productJSON = card.querySelector(
            '[data-product-data]'
          );

          if (!productJSON) {
            console.error('Tisso: product JSON not found');
            return;
          }

          try {
            const product = JSON.parse(
              productJSON.textContent.trim()
            );

            openPopup(product);
          } catch (error) {
            console.error(
              'Tisso: invalid product JSON',
              error
            );
          }
        });
      });

    // Close popup buttons.
    popup
      .querySelectorAll('[data-product-popup-close]')
      .forEach(function (button) {
        button.addEventListener('click', function (event) {
          event.preventDefault();
          closePopup();
        });
      });

    // Close popup with Escape.
    document.addEventListener('keydown', function (event) {
      if (
        event.key === 'Escape' &&
        popup.classList.contains('is-open')
      ) {
        closePopup();
      }
    });

    // Add selected product to cart.
    form.addEventListener('submit', async function (event) {
      event.preventDefault();

      popupError.hidden = true;
      popupError.textContent = '';

      selectedVariant = findSelectedVariant();

      if (!selectedVariant) {
        popupError.textContent =
          'Please select an available variant.';

        popupError.hidden = false;

        return;
      }

      addButton.disabled = true;

      if (addButtonText) {
        addButtonText.textContent = 'ADDING...';
      }

      try {
        const items = [
          {
            id: Number(selectedVariant.id),
            quantity: 1
          }
        ];

        if (isSpecialCombination()) {
          const softWinterVariant =
            await getSoftWinterJacketVariant();

          if (softWinterVariant) {
            items.push({
              id: Number(softWinterVariant.id),
              quantity: 1
            });
          }
        }

        await addItemsToCart(items);

        if (addButtonText) {
          addButtonText.textContent = 'ADDED';
        }

        setTimeout(function () {
          closePopup();

          addButton.disabled = false;

          if (addButtonText) {
            addButtonText.textContent = 'ADD TO CART';
          }
        }, 700);
      } catch (error) {
        console.error(
          'Tisso: cart error',
          error
        );

        popupError.textContent =
          error.message ||
          'Unable to add product to cart.';

        popupError.hidden = false;

        addButton.disabled = false;

        if (addButtonText) {
          addButtonText.textContent = 'ADD TO CART';
        }
      }
    });
  }

  // Start the Tisso gift guide.
  if (document.readyState === 'loading') {
    document.addEventListener(
      'DOMContentLoaded',
      initTissoGiftGuide
    );
  } else {
    initTissoGiftGuide();
  }
})();
