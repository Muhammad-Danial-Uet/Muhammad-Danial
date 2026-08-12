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
       SHOPIFY ROUTE
    ========================================================= */

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


    /* =========================================================
       MONEY
    ========================================================= */

    function formatMoney(cents) {

      return (Number(cents || 0) / 100).toLocaleString('en-US', {
        style: 'currency',
        currency: 'EUR'
      });

    }


    /* =========================================================
       VARIANT OPTION
    ========================================================= */

    function getVariantOption(variant, index) {

      if (!variant) {
        return '';
      }

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
       GET IMAGE URL
    ========================================================= */

    function getProductImage(product) {

      let imageURL = '';

      if (product && product.featured_image) {

        if (
          typeof product.featured_image === 'string'
        ) {

          imageURL =
            product.featured_image;

        } else {

          imageURL =
            product.featured_image.src ||
            product.featured_image.url ||
            '';

        }

      }

      if (
        !imageURL &&
        product &&
        product.images &&
        product.images.length
      ) {

        if (
          typeof product.images[0] === 'string'
        ) {

          imageURL =
            product.images[0];

        } else {

          imageURL =
            product.images[0].src ||
            product.images[0].url ||
            '';

        }

      }

      return imageURL;
    }


    /* =========================================================
       FIND CURRENTLY SELECTED VALUES
    ========================================================= */

    function getSelectedOptions() {

      const selectedOptions = [];

      const controls =
        popupVariants.querySelectorAll(
          '[data-variant-option]'
        );

      controls.forEach(function (control) {

        selectedOptions.push(
          control.value || ''
        );

      });

      return selectedOptions;
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

      return currentProduct.variants.find(
        function (variant) {

          if (!variant.available) {
            return false;
          }

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
      ) || null;
    }


    /* =========================================================
       CHECK IF VARIANT IS BLACK + MEDIUM
    ========================================================= */

    function isBlackMediumVariant(variant) {

      if (!variant) {
        return false;
      }

      const optionValues = [];

      if (variant.option1) {
        optionValues.push(
          normalize(variant.option1)
        );
      }

      if (variant.option2) {
        optionValues.push(
          normalize(variant.option2)
        );
      }

      if (variant.option3) {
        optionValues.push(
          normalize(variant.option3)
        );
      }

      const hasBlack =
        optionValues.includes('black');

      const hasMedium =
        optionValues.includes('medium');

      return hasBlack && hasMedium;
    }


    /* =========================================================
       UPDATE VARIANT
    ========================================================= */

    function updateVariant() {

      selectedVariant =
        findSelectedVariant();

      if (!selectedVariant) {

        addButton.disabled = true;

        if (addButtonText) {

          addButtonText.textContent =
            'UNAVAILABLE';

        }

        return;
      }

      popupPrice.textContent =
        formatMoney(
          selectedVariant.price
        );

      addButton.disabled = false;

      if (addButtonText) {

        addButtonText.textContent =
          'ADD TO CART';

      }
    }


    /* =========================================================
       CREATE COLOR OPTIONS
    ========================================================= */

    function renderColorOption(
      optionName,
      optionIndex,
      values
    ) {

      const wrapper =
        document.createElement('div');

      wrapper.className =
        'tisso-variant tisso-variant--color';


      const label =
        document.createElement('label');

      label.textContent =
        optionName;


      const colorGroup =
        document.createElement('div');

      colorGroup.className =
        'tisso-color-options';


      values.forEach(function (value, valueIndex) {

        const button =
          document.createElement('button');

        button.type =
          'button';

        button.className =
          'tisso-color-option';

        button.textContent =
          value;

        button.setAttribute(
          'data-color-value',
          value
        );

        /*
         * First available value is selected
         * by default.
         */
        if (valueIndex === 0) {

          button.classList.add(
            'is-selected'
          );

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

            hiddenSelect.dispatchEvent(
              new Event(
                'change',
                {
                  bubbles: true
                }
              )
            );

          }
        );


        colorGroup.appendChild(
          button
        );

      });


      /*
       * Hidden select keeps the variant
       * selection system consistent.
       */
      const hiddenSelect =
        document.createElement('select');

      hiddenSelect.className =
        'tisso-variant-select';

      hiddenSelect.setAttribute(
        'data-variant-option',
        optionIndex
      );

      hiddenSelect.style.display =
        'none';


      values.forEach(function (value) {

        const option =
          document.createElement('option');

        option.value =
          value;

        option.textContent =
          value;

        hiddenSelect.appendChild(
          option
        );

      });


      hiddenSelect.value =
        values[0] || '';


      hiddenSelect.addEventListener(
        'change',
        updateVariant
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
       CREATE SELECT OPTION
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
        optionIndex
      );


      values.forEach(function (value) {

        const option =
          document.createElement('option');

        option.value =
          value;

        option.textContent =
          value;

        select.appendChild(
          option
        );

      });


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
       RENDER PRODUCT VARIANTS
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
       * PRODUCT WITH NO REAL OPTIONS
       */

      if (
        !product.options ||
        product.options.length === 0 ||
        (
          product.options.length === 1 &&
          product.options[0] === 'Title'
        )
      ) {

        const variant =
          product.variants.find(
            function (item) {

              return item.available;

            }
          ) ||
          product.variants[0];


        selectedVariant =
          variant;


        popupPrice.textContent =
          formatMoney(
            variant.price
          );


        if (variant.available) {

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
       * PRODUCT WITH OPTIONS
       */

      product.options.forEach(
        function (
          optionName,
          optionIndex
        ) {

          const values = [];


          /*
           * Collect unique option values.
           */

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


          /*
           * Color gets the segmented
           * button appearance.
           */

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


      currentProduct =
        product;


      console.log(
        'Tisso: opening product:',
        product.title
      );


      /*
       * IMAGE
       */

      const imageURL =
        getProductImage(product);


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
       * PRODUCT INFORMATION
       */

      popupImage.alt =
        product.title || '';


      popupTitle.textContent =
        product.title || '';


      /*
       * Shopify product.description
       * normally contains HTML.
       */

      popupDescription.innerHTML =
        product.description || '';


      /*
       * Initial price.
       * renderVariants() will update
       * this to the selected variant price.
       */

      popupPrice.textContent =
        formatMoney(
          product.price
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


      /*
       * Focus close button for
       * accessibility.
       */

      const closeButton =
        popup.querySelector(
          '[data-product-popup-close]'
        );

      if (closeButton) {

        setTimeout(
          function () {

            closeButton.focus();

          },
          50
        );

      }

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
       PLUS / HOTSPOT BUTTONS
    ========================================================= */

    const openButtons =
      document.querySelectorAll(
        '[data-product-popup-open]'
      );


    console.log(
      'Tisso: plus buttons found:',
      openButtons.length
    );


    openButtons.forEach(
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

              console.error(
                'Tisso: product card not found'
              );

              return;

            }


            const productJSON =
              card.querySelector(
                '[data-product-data]'
              );


            if (!productJSON) {

              console.error(
                'Tisso: product JSON not found'
              );

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
                'Tisso: invalid product JSON',
                error
              );

            }

          }
        );

      }
    );


    /* =========================================================
       CLOSE BUTTONS / OVERLAY
    ========================================================= */

    popup
      .querySelectorAll(
        '[data-product-popup-close]'
      )
      .forEach(
        function (button) {

          button.addEventListener(
            'click',
            function () {

              closePopup();

            }
          );

        }
      );


    /* =========================================================
       ESCAPE KEY
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
       FIND SOFT WINTER JACKET
    ========================================================= */

    async function getSoftWinterJacket() {

      /*
       * Shopify product JSON endpoint.
       *
       * The expected product handle is:
       * soft-winter-jacket
       */

      const url =
        shopifyRoot() +
        'products/soft-winter-jacket.js';


      const response =
        await fetch(
          url,
          {
            method: 'GET',
            headers: {
              'Accept':
                'application/json'
            }
          }
        );


      if (!response.ok) {

        throw new Error(
          'Soft Winter Jacket product could not be found.'
        );

      }


      return response.json();

    }


    /* =========================================================
       FIND AVAILABLE JACKET VARIANT
    ========================================================= */

    function findAvailableJacketVariant(
      jacket
    ) {

      if (
        !jacket ||
        !jacket.variants ||
        !jacket.variants.length
      ) {

        return null;

      }


      /*
       * Prefer an available variant.
       */

      return (
        jacket.variants.find(
          function (variant) {

            return variant.available;

          }
        ) ||
        null
      );

    }


    /* =========================================================
       ADD ITEMS TO SHOPIFY CART
    ========================================================= */

    async function addItemsToCart(
      items
    ) {

      const response =
        await fetch(
          shopifyRoot() +
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

        let errorMessage =
          'Unable to add product to cart.';


        try {

          const data =
            await response.json();

          errorMessage =
            data.description ||
            data.message ||
            errorMessage;

        } catch (error) {
          /* Ignore JSON parsing error */
        }


        throw new Error(
          errorMessage
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


        /*
         * Make sure a valid variant exists.
         */

        if (!selectedVariant) {

          popupError.textContent =
            'Please select an available variant.';

          popupError.hidden =
            false;

          return;

        }


        /*
         * Prevent double-clicking.
         */

        addButton.disabled =
          true;


        if (addButtonText) {

          addButtonText.textContent =
            'ADDING...';

        }


        popupError.hidden =
          true;

        popupError.textContent =
          '';


        try {

          /*
           * Main product.
           */

          const cartItems = [
            {
              id:
                Number(
                  selectedVariant.id
                ),

              quantity: 1
            }
          ];


          /*
           * SPECIAL RULE
           *
           * If selected product has BOTH:
           *
           * Color = Black
           * Size = Medium
           *
           * automatically add Soft Winter Jacket.
           */

          if (
            isBlackMediumVariant(
              selectedVariant
            )
          ) {

            console.log(
              'Tisso: Black + Medium detected. Adding Soft Winter Jacket.'
            );


            try {

              const jacket =
                await getSoftWinterJacket();


              const jacketVariant =
                findAvailableJacketVariant(
                  jacket
                );


              if (jacketVariant) {

                cartItems.push({

                  id:
                    Number(
                      jacketVariant.id
                    ),

                  quantity: 1

                });

              } else {

                console.warn(
                  'Tisso: Soft Winter Jacket has no available variant.'
                );

              }

            } catch (jacketError) {

              /*
               * Do not prevent the customer's
               * selected product from being added
               * if the bonus product cannot be found.
               */

              console.warn(
                'Tisso: automatic Soft Winter Jacket could not be added:',
                jacketError
              );

            }

          }


          /*
           * Add all items in ONE Shopify
           * cart request.
           */

          await addItemsToCart(
            cartItems
          );


          /*
           * Success state.
           */

          if (addButtonText) {

            addButtonText.textContent =
              'ADDED';

          }


          /*
           * Close popup after success.
           */

          setTimeout(
            function () {

              closePopup();


              if (addButtonText) {

                addButtonText.textContent =
                  'ADD TO CART';

              }


              addButton.disabled =
                false;

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
     START
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
