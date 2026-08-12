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
      console.error('Tisso: popup elements missing');
      return;
    }

    let currentProduct = null;
    let selectedVariant = null;


    /* =========================================================
       SHOPIFY ROOT
    ========================================================= */

    function getShopifyRoot() {

      if (
        window.Shopify &&
        window.Shopify.routes &&
        window.Shopify.routes.root
      ) {
        return window.Shopify.routes.root;
      }

      return '/';

    }


    /* =========================================================
       MONEY
    ========================================================= */

    function formatMoney(cents) {

      const amount = Number(cents);

      if (Number.isNaN(amount)) {
        return '€0.00';
      }

      return (amount / 100).toLocaleString('en-US', {
        style: 'currency',
        currency: 'EUR'
      });

    }


    /* =========================================================
       VARIANT AVAILABILITY
    ========================================================= */

    function isVariantAvailable(variant) {

      /*
       * Shopify normally gives us:
       *
       * available: true / false
       *
       * If available is missing, do NOT assume
       * the product is sold out.
       */

      return variant &&
        variant.available !== false;

    }


    /* =========================================================
       GET OPTION VALUE
    ========================================================= */

    function getVariantOption(variant, index) {

      return (
        variant['option' + (index + 1)] ||
        ''
      );

    }


    /* =========================================================
       NORMALIZE TEXT
    ========================================================= */

    function normalize(value) {

      return String(value || '')
        .trim()
        .toLowerCase();

    }


    /* =========================================================
       PRODUCT IMAGE
    ========================================================= */

    function getProductImage(product) {

      if (!product) {
        return '';
      }

      let image = '';

      if (product.featured_image) {

        if (
          typeof product.featured_image === 'string'
        ) {

          image = product.featured_image;

        } else {

          image =
            product.featured_image.src ||
            product.featured_image.url ||
            '';

        }

      }

      if (
        !image &&
        product.images &&
        product.images.length
      ) {

        if (
          typeof product.images[0] === 'string'
        ) {

          image = product.images[0];

        } else {

          image =
            product.images[0].src ||
            product.images[0].url ||
            '';

        }

      }

      return image;

    }


    /* =========================================================
       GET SELECTED OPTIONS
    ========================================================= */

    function getSelectedOptions() {

      const controls =
        popupVariants.querySelectorAll(
          '[data-variant-option]'
        );

      return Array.from(controls).map(
        function (control) {
          return control.value;
        }
      );

    }


    /* =========================================================
       FIND SELECTED VARIANT
    ========================================================= */

    function findSelectedVariant() {

      if (
        !currentProduct ||
        !currentProduct.variants ||
        !currentProduct.variants.length
      ) {
        return null;
      }

      const selectedOptions =
        getSelectedOptions();


      /*
       * Product has no actual options.
       */

      if (
        selectedOptions.length === 0
      ) {

        return (
          currentProduct.variants.find(
            isVariantAvailable
          ) ||
          currentProduct.variants[0] ||
          null
        );

      }


      /*
       * Find variant matching all selected
       * option values.
       */

      return (
        currentProduct.variants.find(
          function (variant) {

            return selectedOptions.every(
              function (value, index) {

                return (
                  getVariantOption(
                    variant,
                    index
                  ) === value
                );

              }
            );

          }
        ) || null
      );

    }


    /* =========================================================
       UPDATE VARIANT
    ========================================================= */

    function updateVariant() {

      selectedVariant =
        findSelectedVariant();


      if (!selectedVariant) {

        addButton.disabled = true;

        popupPrice.textContent =
          '€0.00';

        if (addButtonText) {
          addButtonText.textContent =
            'SOLD OUT';
        }

        return;
      }


      /*
       * Update price.
       */

      popupPrice.textContent =
        formatMoney(
          selectedVariant.price
        );


      /*
       * Only disable when Shopify explicitly
       * says the variant is unavailable.
       */

      if (
        isVariantAvailable(
          selectedVariant
        )
      ) {

        addButton.disabled = false;

        if (addButtonText) {
          addButtonText.textContent =
            'ADD TO CART';
        }

      } else {

        addButton.disabled = true;

        if (addButtonText) {
          addButtonText.textContent =
            'SOLD OUT';
        }

      }

    }


    /* =========================================================
       COLLECT OPTION VALUES
    ========================================================= */

    function getOptionValues(
      product,
      optionIndex
    ) {

      const values = [];

      product.variants.forEach(
        function (variant) {

          const value =
            getVariantOption(
              variant,
              optionIndex
            );

          if (
            value &&
            !values.includes(value)
          ) {

            values.push(value);

          }

        }
      );

      return values;

    }


    /* =========================================================
       RENDER COLOR OPTION
    ========================================================= */

    function renderColorOption(
      optionName,
      optionIndex,
      values
    ) {

      const wrapper =
        document.createElement('div');

      wrapper.className =
        'tisso-variant';


      const label =
        document.createElement('label');

      label.textContent =
        optionName;


      const colorGroup =
        document.createElement('div');

      colorGroup.className =
        'tisso-color-options';


      const hiddenSelect =
        document.createElement('select');

      hiddenSelect.setAttribute(
        'data-variant-option',
        ''
          + optionIndex
      );

      hiddenSelect.style.display =
        'none';


      values.forEach(
        function (value, index) {

          const option =
            document.createElement('option');

          option.value =
            value;

          option.textContent =
            value;

          hiddenSelect.appendChild(
            option
          );


          const button =
            document.createElement('button');

          button.type =
            'button';

          button.className =
            'tisso-color-option';

          button.textContent =
            value;


          if (index === 0) {

            button.classList.add(
              'is-selected'
            );

            hiddenSelect.value =
              value;

          }


          button.addEventListener(
            'click',
            function () {

              colorGroup
                .querySelectorAll(
                  '.tisso-color-option'
                )
                .forEach(
                  function (item) {

                    item.classList.remove(
                      'is-selected'
                    );

                  }
                );


              button.classList.add(
                'is-selected'
              );


              hiddenSelect.value =
                value;


              updateVariant();

            }
          );


          colorGroup.appendChild(
            button
          );

        }
      );


      wrapper.appendChild(
        label
      );

      wrapper.appendChild(
        colorGroup
      );

      wrapper.appendChild(
        hiddenSelect
      );

      popupVariants.appendChild(
        wrapper
      );

    }


    /* =========================================================
       RENDER NORMAL SELECT
    ========================================================= */

    function renderSelectOption(
      optionName,
      optionIndex,
      values
    ) {

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
        'data-variant-option',
        ''
          + optionIndex
      );


      values.forEach(
        function (value) {

          const option =
            document.createElement('option');

          option.value =
            value;

          option.textContent =
            value;

          select.appendChild(
            option
          );

        }
      );


      select.addEventListener(
        'change',
        updateVariant
      );


      wrapper.appendChild(
        label
      );

      wrapper.appendChild(
        select
      );

      popupVariants.appendChild(
        wrapper
      );

    }


    /* =========================================================
       RENDER VARIANTS
    ========================================================= */

    function renderVariants(product) {

      popupVariants.innerHTML =
        '';

      selectedVariant =
        null;


      if (
        !product.variants ||
        !product.variants.length
      ) {

        addButton.disabled =
          true;

        if (addButtonText) {
          addButtonText.textContent =
            'SOLD OUT';
        }

        return;
      }


      /*
       * Product has no selectable options.
       */

      if (
        !product.options ||
        product.options.length === 0 ||
        (
          product.options.length === 1 &&
          product.options[0] === 'Title'
        )
      ) {

        selectedVariant =
          product.variants.find(
            isVariantAvailable
          ) ||
          product.variants[0];


        popupPrice.textContent =
          formatMoney(
            selectedVariant.price
          );


        if (
          isVariantAvailable(
            selectedVariant
          )
        ) {

          addButton.disabled =
            false;

          if (addButtonText) {
            addButtonText.textContent =
              'ADD TO CART';
          }

        } else {

          addButton.disabled =
            true;

          if (addButtonText) {
            addButtonText.textContent =
              'SOLD OUT';
          }

        }

        return;
      }


      /*
       * Render every product option.
       */

      product.options.forEach(
        function (
          optionName,
          optionIndex
        ) {

          const values =
            getOptionValues(
              product,
              optionIndex
            );


          if (
            normalize(optionName) ===
            'color'
          ) {

            renderColorOption(
              optionName,
              optionIndex,
              values
            );

          } else {

            renderSelectOption(
              optionName,
              optionIndex,
              values
            );

          }

        }
      );


      updateVariant();

    }


    /* =========================================================
       OPEN POPUP
    ========================================================= */

    function openPopup(product) {

      if (!product) {
        return;
      }


      console.log(
        'Tisso product:',
        product
      );


      currentProduct =
        product;


      /*
       * IMAGE
       */

      const imageURL =
        getProductImage(
          product
        );


      if (imageURL) {

        popupImage.src =
          imageURL;

        popupImage.style.display =
          'block';

      } else {

        popupImage.removeAttribute(
          'src'
        );

        popupImage.style.display =
          'none';

      }


      /*
       * TITLE
       */

      popupImage.alt =
        product.title || '';

      popupTitle.textContent =
        product.title || '';


      /*
       * DESCRIPTION
       */

      popupDescription.innerHTML =
        product.description || '';


      /*
       * INITIAL PRICE
       */

      let initialPrice =
        product.price;


      if (
        initialPrice === undefined ||
        initialPrice === null
      ) {

        if (
          product.variants &&
          product.variants.length
        ) {

          initialPrice =
            product.variants[0].price;

        }

      }


      popupPrice.textContent =
        formatMoney(
          initialPrice
        );


      /*
       * RESET ERROR
       */

      popupError.hidden =
        true;

      popupError.textContent =
        '';


      /*
       * RENDER VARIANTS
       */

      renderVariants(
        product
      );


      /*
       * OPEN
       */

      popup.classList.add(
        'is-open'
      );

      popup.setAttribute(
        'aria-hidden',
        'false'
      );

      document.body.classList.add(
        'tisso-popup-open'
      );

    }


    /* =========================================================
       CLOSE POPUP
    ========================================================= */

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

      currentProduct =
        null;

      selectedVariant =
        null;

    }


    /* =========================================================
       OPEN PRODUCT POPUP
    ========================================================= */

    document
      .querySelectorAll(
        '[data-product-popup-open]'
      )
      .forEach(
        function (button) {

          button.addEventListener(
            'click',
            function (event) {

              event.preventDefault();
              event.stopPropagation();


              const card =
                button.closest(
                  '[data-product-card]'
                );


              if (!card) {
                return;
              }


              const productJSON =
                card.querySelector(
                  '[data-product-data]'
                );


              if (!productJSON) {
                return;
              }


              try {

                const product =
                  JSON.parse(
                    productJSON.textContent.trim()
                  );


                openPopup(
                  product
                );

              } catch (error) {

                console.error(
                  'Tisso product JSON error:',
                  error
                );

              }

            }
          );

        }
      );


    /* =========================================================
       CLOSE POPUP
    ========================================================= */

    popup
      .querySelectorAll(
        '[data-product-popup-close]'
      )
      .forEach(
        function (button) {

          button.addEventListener(
            'click',
            closePopup
          );

        }
      );


    /* =========================================================
       ESCAPE
    ========================================================= */

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


    /* =========================================================
       GET SOFT WINTER JACKET
    ========================================================= */

    async function getSoftWinterJacket() {

      const response =
        await fetch(
          getShopifyRoot() +
          'products/soft-winter-jacket.js'
        );


      if (!response.ok) {

        throw new Error(
          'Soft Winter Jacket could not be found.'
        );

      }


      return response.json();

    }


    /* =========================================================
       BLACK + MEDIUM CHECK
    ========================================================= */

    function isBlackMediumVariant(
      variant
    ) {

      if (!variant) {
        return false;
      }


      const values = [
        normalize(variant.option1),
        normalize(variant.option2),
        normalize(variant.option3)
      ];


      return (
        values.includes('black') &&
        values.includes('medium')
      );

    }


    /* =========================================================
       ADD ITEMS TO CART
    ========================================================= */

    async function addItemsToCart(
      items
    ) {

      const response =
        await fetch(
          getShopifyRoot() +
          'cart/add.js',
          {
            method: 'POST',

            headers: {
              'Content-Type':
                'application/json',

              'Accept':
                'application/json'
            },

            body: JSON.stringify({
              items: items
            })
          }
        );


      if (!response.ok) {

        let message =
          'Unable to add product to cart.';

        try {

          const data =
            await response.json();

          message =
            data.description ||
            data.message ||
            message;

        } catch (error) {}

        throw new Error(
          message
        );

      }


      return response.json();

    }


    /* =========================================================
       ADD TO CART
    ========================================================= */

    form.addEventListener(
      'submit',
      async function (event) {

        event.preventDefault();


        if (
          !selectedVariant ||
          !isVariantAvailable(
            selectedVariant
          )
        ) {

          popupError.textContent =
            'Please select an available variant.';

          popupError.hidden =
            false;

          return;

        }


        addButton.disabled =
          true;


        if (addButtonText) {

          addButtonText.textContent =
            'ADDING...';

        }


        popupError.hidden =
          true;


        try {

          /*
           * Main selected product.
           */

          const items = [
            {
              id:
                Number(
                  selectedVariant.id
                ),

              quantity: 1
            }
          ];


          /*
           * BLACK + MEDIUM BONUS PRODUCT
           */

          if (
            isBlackMediumVariant(
              selectedVariant
            )
          ) {

            try {

              const jacket =
                await getSoftWinterJacket();


              const jacketVariant =
                jacket.variants &&
                jacket.variants.find(
                  isVariantAvailable
                );


              if (jacketVariant) {

                items.push({
                  id:
                    Number(
                      jacketVariant.id
                    ),

                  quantity: 1
                });

              }

            } catch (error) {

              console.warn(
                'Tisso: could not add Soft Winter Jacket:',
                error
              );

            }

          }


          /*
           * ADD BOTH PRODUCTS.
           */

          await addItemsToCart(
            items
          );


          /*
           * SUCCESS
           */

          if (addButtonText) {

            addButtonText.textContent =
              'ADDED';

          }


          setTimeout(
            function () {

              closePopup();

              addButton.disabled =
                false;

              if (addButtonText) {

                addButtonText.textContent =
                  'ADD TO CART';

              }

            },
            700
          );


        } catch (error) {

          console.error(
            'Tisso cart error:',
            error
          );


          popupError.textContent =
            error.message ||
            'Unable to add product to cart.';


          popupError.hidden =
            false;


          addButton.disabled =
            false;


          if (addButtonText) {

            addButtonText.textContent =
              'ADD TO CART';

          }

        }

      }
    );

  }


  /* =========================================================
     INITIALIZE
  ========================================================= */

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
