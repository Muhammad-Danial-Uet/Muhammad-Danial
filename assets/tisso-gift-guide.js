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
      console.error('Tisso: popup markup is incomplete');
      return;
    }

    let currentProduct = null;
    let selectedVariant = null;

    function shopifyRoot() {
      if (
        window.Shopify &&
        window.Shopify.routes &&
        window.Shopify.routes.root
      ) {
        return window.Shopify.routes.root;
      }

      return '/';
    }

    function money(cents) {
      return (Number(cents || 0) / 100).toLocaleString('en-US', {
        style: 'currency',
        currency: 'EUR'
      });
    }

    function variantOption(variant, index) {
      const key = 'option' + (index + 1);

      if (!variant) return '';

      return variant[key] == null
        ? ''
        : String(variant[key]);
    }

    function isAvailable(variant) {
      return !!(
        variant &&
        (
          variant.available === true ||
          variant.available === 'true' ||
          variant.available === 1
        )
      );
    }

    function getProductImage(product) {
      if (!product) return '';

      if (
        product.featured_image &&
        typeof product.featured_image === 'string'
      ) {
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

      if (
        Array.isArray(product.images) &&
        product.images.length
      ) {
        const image = product.images[0];

        if (typeof image === 'string') {
          return image;
        }

        if (image && typeof image === 'object') {
          return image.src || image.url || '';
        }
      }

      return '';
    }

    function showError(message) {
      popupError.textContent = message || '';
      popupError.hidden = !message;
    }

    function clearError() {
      popupError.textContent = '';
      popupError.hidden = true;
    }

    function setButton(text, disabled) {
      addButton.disabled = !!disabled;

      if (addButtonText) {
        addButtonText.textContent = text;
      }
    }

    function getSelects() {
      return Array.from(
        popupVariants.querySelectorAll('select')
      );
    }

    function getSelectedOptions() {
      const values = {};

      getSelects().forEach(function (select) {
        const index = Number(
          select.getAttribute('data-option-index')
        );

        const optionName =
          currentProduct &&
          Array.isArray(currentProduct.options)
            ? currentProduct.options[index]
            : '';

        if (optionName) {
          values[optionName.toLowerCase()] = select.value;
        }
      });

      return values;
    }

    function findVariant() {
      if (
        !currentProduct ||
        !Array.isArray(currentProduct.variants)
      ) {
        return null;
      }

      const selects = getSelects();

      if (!selects.length) {
        return (
          currentProduct.variants.find(isAvailable) ||
          null
        );
      }

      return (
        currentProduct.variants.find(function (variant) {
          if (!isAvailable(variant)) {
            return false;
          }

          return selects.every(function (select) {
            const index = Number(
              select.getAttribute('data-option-index')
            );

            return (
              variantOption(variant, index) ===
              String(select.value)
            );
          });
        }) || null
      );
    }

    function updateVariant() {
      selectedVariant = findVariant();

      if (!selectedVariant) {
        setButton('SOLD OUT', true);
        return;
      }

      popupPrice.textContent =
        money(selectedVariant.price);

      setButton('ADD TO CART', false);
    }

    function chooseFirstAvailableVariant() {
      if (
        !currentProduct ||
        !Array.isArray(currentProduct.variants)
      ) {
        return;
      }

      const firstAvailable =
        currentProduct.variants.find(isAvailable);

      if (!firstAvailable) {
        return;
      }

      getSelects().forEach(function (select) {
        const index = Number(
          select.getAttribute('data-option-index')
        );

        const value =
          variantOption(firstAvailable, index);

        const option = Array.from(
          select.options
        ).find(function (item) {
          return item.value === value;
        });

        if (option) {
          select.value = option.value;
        }
      });
    }

    function renderVariants(product) {
      popupVariants.innerHTML = '';

      selectedVariant = null;

      const variants =
        Array.isArray(product.variants)
          ? product.variants
          : [];

      if (!variants.length) {
        setButton('SOLD OUT', true);
        return;
      }

      const options =
        Array.isArray(product.options)
          ? product.options
          : [];

      const realOptions = options.filter(function (name) {
        return (
          name &&
          String(name).toLowerCase() !== 'title'
        );
      });

      if (!realOptions.length) {
        selectedVariant =
          variants.find(isAvailable) || null;

        if (!selectedVariant) {
          setButton('SOLD OUT', true);
          return;
        }

        popupPrice.textContent =
          money(selectedVariant.price);

        setButton('ADD TO CART', false);

        return;
      }

      realOptions.forEach(function (
        optionName
      ) {
        const optionIndex =
          options.indexOf(optionName);

        const wrapper =
          document.createElement('div');

        wrapper.className =
          'tisso-variant';

        const label =
          document.createElement('label');

        label.textContent =
          optionName;

        const select =
          document.createElement('select');

        select.className =
          'tisso-variant-select';

        select.setAttribute(
          'data-option-index',
          String(optionIndex)
        );

        const values = [];

        variants.forEach(function (variant) {
          const value =
            variantOption(
              variant,
              optionIndex
            );

          if (
            value &&
            !values.includes(value)
          ) {
            values.push(value);
          }
        });

        values.forEach(function (value) {
          const option =
            document.createElement('option');

          option.value = value;
          option.textContent = value;

          select.appendChild(option);
        });

        select.addEventListener(
          'change',
          function () {
            clearError();
            updateVariant();
          }
        );

        wrapper.appendChild(label);
        wrapper.appendChild(select);

        popupVariants.appendChild(wrapper);
      });

      chooseFirstAvailableVariant();
      updateVariant();
    }

    async function loadProduct(handle) {
      if (!handle) {
        throw new Error(
          'Product handle is missing.'
        );
      }

      const url =
        shopifyRoot() +
        'products/' +
        encodeURIComponent(handle) +
        '.js';

      const response =
        await fetch(url, {
          method: 'GET',
          headers: {
            Accept: 'application/json'
          },
          credentials: 'same-origin'
        });

      if (!response.ok) {
        throw new Error(
          'Unable to load product information.'
        );
      }

      return response.json();
    }

    async function openPopup(productData) {
      clearError();

      popupTitle.textContent = '';
      popupPrice.textContent = '';
      popupDescription.innerHTML = '';
      popupVariants.innerHTML = '';

      popupImage.removeAttribute('src');
      popupImage.alt = '';
      popupImage.style.display = 'none';

      setButton('LOADING...', true);

      popup.classList.add('is-open');

      popup.setAttribute(
        'aria-hidden',
        'false'
      );

      document.body.classList.add(
        'tisso-popup-open'
      );

      try {
        let product = productData;

        if (
          productData &&
          productData.handle
        ) {
          product =
            await loadProduct(
              productData.handle
            );
        }

        if (!product) {
          throw new Error(
            'Product information not found.'
          );
        }

        currentProduct = product;

        popupTitle.textContent =
          product.title || '';

        popupDescription.innerHTML =
          product.description || '';

        const image =
          getProductImage(product);

        if (image) {
          popupImage.src = image;
          popupImage.alt =
            product.title || '';
          popupImage.style.display =
            'block';
        }

        popupPrice.textContent =
          money(product.price);

        renderVariants(product);
      } catch (error) {
        console.error(
          'Tisso product error:',
          error
        );

        showError(
          error.message ||
          'Unable to load product.'
        );

        setButton(
          'ADD TO CART',
          true
        );
      }
    }

    function closePopup() {
      popup.classList.remove(
        'is-open'
      );

      popup.setAttribute(
        'aria-hidden',
        'true'
      );

      document.body.classList.remove(
        'tisso-popup-open'
      );

      currentProduct = null;
      selectedVariant = null;

      clearError();
    }

    async function getSoftWinterJacket() {
      try {
        const product =
          await loadProduct(
            'soft-winter-jacket'
          );

        if (
          !product ||
          !Array.isArray(
            product.variants
          )
        ) {
          return null;
        }

        return (
          product.variants.find(
            isAvailable
          ) || null
        );
      } catch (error) {
        console.error(
          'Tisso: Soft Winter Jacket not found:',
          error
        );

        return null;
      }
    }

    function needsSoftWinterJacket() {
      const values =
        getSelectedOptions();

      const color =
        String(
          values.color || ''
        ).trim().toLowerCase();

      const size =
        String(
          values.size || ''
        ).trim().toLowerCase();

      return (
        color === 'black' &&
        size === 'medium'
      );
    }

    async function addToCart(items) {
      const response =
        await fetch(
          shopifyRoot() +
          'cart/add.js',
          {
            method: 'POST',
            headers: {
              'Content-Type':
                'application/json',
              Accept:
                'application/json'
            },
            credentials:
              'same-origin',
            body:
              JSON.stringify({
                items: items
              })
          }
        );

      let data = null;

      try {
        data =
          await response.json();
      } catch (error) {}

      if (!response.ok) {
        throw new Error(
          (
            data &&
            (
              data.description ||
              data.message
            )
          ) ||
          'Unable to add product to cart.'
        );
      }

      return data;
    }

    document
      .querySelectorAll(
        '[data-product-popup-open]'
      )
      .forEach(function (button) {
        button.addEventListener(
          'click',
          async function (event) {
            event.preventDefault();
            event.stopPropagation();

            const card =
              button.closest(
                '[data-product-card]'
              );

            if (!card) {
              console.error(
                'Tisso: product card not found'
              );
              return;
            }

            const dataElement =
              card.querySelector(
                '[data-product-data]'
              );

            if (!dataElement) {
              console.error(
                'Tisso: product data not found'
              );
              return;
            }

            try {
              const productData =
                JSON.parse(
                  dataElement.textContent.trim()
                );

              await openPopup(
                productData
              );
            } catch (error) {
              console.error(
                'Tisso: product JSON error:',
                error
              );
            }
          }
        );
      });

    popup
      .querySelectorAll(
        '[data-product-popup-close]'
      )
      .forEach(function (button) {
        button.addEventListener(
          'click',
          function (event) {
            event.preventDefault();
            closePopup();
          }
        );
      });

    document.addEventListener(
      'keydown',
      function (event) {
        if (
          event.key === 'Escape' &&
          popup.classList.contains(
            'is-open'
          )
        ) {
          closePopup();
        }
      }
    );

    form.addEventListener(
      'submit',
      async function (event) {
        event.preventDefault();

        clearError();

        selectedVariant =
          findVariant();

        if (!selectedVariant) {
          showError(
            'Please select an available variant.'
          );
          return;
        }

        setButton(
          'ADDING...',
          true
        );

        try {
          const items = [
            {
              id:
                Number(
                  selectedVariant.id
                ),
              quantity: 1
            }
          ];

          if (
            needsSoftWinterJacket()
          ) {
            const jacket =
              await getSoftWinterJacket();

            if (jacket) {
              items.push({
                id:
                  Number(
                    jacket.id
                  ),
                quantity: 1
              });
            }
          }

          await addToCart(items);

          setButton(
            'ADDED',
            true
          );

          setTimeout(
            function () {
              closePopup();

              setButton(
                'ADD TO CART',
                false
              );
            },
            700
          );
        } catch (error) {
          console.error(
            'Tisso cart error:',
            error
          );

          showError(
            error.message ||
            'Unable to add product to cart.'
          );

          setButton(
            'ADD TO CART',
            false
          );
        }
      }
    );
  }

  if (
    document.readyState ===
    'loading'
  ) {
    document.addEventListener(
      'DOMContentLoaded',
      initTissoGiftGuide
    );
  } else {
    initTissoGiftGuide();
  }
})();
