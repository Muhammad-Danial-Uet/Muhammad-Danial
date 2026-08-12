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


    /* =========================
       MONEY
    ========================= */

    function formatMoney(cents) {
      return (Number(cents || 0) / 100).toLocaleString('en-US', {
        style: 'currency',
        currency: 'EUR'
      });
    }


    /* =========================
       GET VARIANT OPTION
    ========================= */

    function getVariantOption(variant, index) {
      return variant['option' + (index + 1)] || '';
    }


    /* =========================
       FIND VARIANT
    ========================= */

    function findSelectedVariant() {

      if (!currentProduct || !currentProduct.variants) {
        return null;
      }

      const selects = popupVariants.querySelectorAll('select');

      const selectedOptions = Array.from(selects).map(function (select) {
        return select.value;
      });

      return currentProduct.variants.find(function (variant) {

        if (!variant.available) {
          return false;
        }

        return selectedOptions.every(function (value, index) {
          return getVariantOption(variant, index) === value;
        });

      }) || null;
    }


    /* =========================
       UPDATE VARIANT
    ========================= */

    function updateVariant() {

      selectedVariant = findSelectedVariant();

      if (!selectedVariant) {

        addButton.disabled = true;

        if (addButtonText) {
          addButtonText.textContent = 'UNAVAILABLE';
        }

        return;
      }

      popupPrice.textContent =
        formatMoney(selectedVariant.price);

      addButton.disabled = false;

      if (addButtonText) {
        addButtonText.textContent = 'ADD TO CART';
      }
    }


    /* =========================
       RENDER VARIANTS
    ========================= */

    function renderVariants(product) {

      popupVariants.innerHTML = '';

      selectedVariant = null;

      if (!product.variants || !product.variants.length) {

        addButton.disabled = true;

        if (addButtonText) {
          addButtonText.textContent = 'SOLD OUT';
        }

        return;
      }


      /*
       * PRODUCT WITHOUT OPTIONS
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
          product.variants.find(function (item) {
            return item.available;
          }) || product.variants[0];

        selectedVariant = variant;

        popupPrice.textContent =
          formatMoney(variant.price);

        if (variant.available) {

          addButton.disabled = false;

          if (addButtonText) {
            addButtonText.textContent = 'ADD TO CART';
          }

        } else {

          addButton.disabled = true;

          if (addButtonText) {
            addButtonText.textContent = 'SOLD OUT';
          }

        }

        return;
      }


      /*
       * PRODUCTS WITH OPTIONS
       */

      product.options.forEach(function (optionName, optionIndex) {

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


        const values = [];


        product.variants.forEach(function (variant) {

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

        });


        values.forEach(function (value) {

          const option =
            document.createElement('option');

          option.value =
            value;

          option.textContent =
            value;

          select.appendChild(option);

        });


        select.addEventListener(
          'change',
          updateVariant
        );


        wrapper.appendChild(label);

        wrapper.appendChild(select);

        popupVariants.appendChild(wrapper);

      });


      updateVariant();
    }


    /* =========================
       OPEN POPUP
    ========================= */

    function openPopup(product) {

      console.log(
        'Tisso: opening product:',
        product.title
      );


      currentProduct = product;


      /*
       * IMAGE
       */

      let imageURL = '';


      if (product.featured_image) {

        if (
          typeof product.featured_image === 'string'
        ) {

          imageURL =
            product.featured_image;

        } else {

          imageURL =
            product.featured_image.src ||
            '';

        }
      }


      if (
        !imageURL &&
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
            '';

        }
      }


      if (imageURL) {

        popupImage.src =
          imageURL;

        popupImage.style.display =
          'block';

      } else {

        popupImage.removeAttribute('src');

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

      popupDescription.innerHTML =
        product.description || '';

      popupPrice.textContent =
        formatMoney(product.price);


      /*
       * RESET ERROR
       */

      popupError.hidden =
        true;

      popupError.textContent =
        '';


      /*
       * VARIANTS
       */

      renderVariants(product);


      /*
       * OPEN
       */

      popup.classList.add('is-open');

      popup.setAttribute(
        'aria-hidden',
        'false'
      );

      document.body.classList.add(
        'tisso-popup-open'
      );


      console.log(
        'Tisso: popup opened'
      );
    }


    /* =========================
       CLOSE POPUP
    ========================= */

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
    }


    /* =========================
       PLUS BUTTONS
    ========================= */

    const openButtons =
      document.querySelectorAll(
        '[data-product-popup-open]'
      );


    console.log(
      'Tisso: plus buttons found:',
      openButtons.length
    );


    openButtons.forEach(function (button) {

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


            openPopup(product);

          } catch (error) {

            console.error(
              'Tisso: invalid product JSON',
              error
            );

          }

        }
      );

    });


    /* =========================
       CLOSE BUTTONS
    ========================= */

    popup
      .querySelectorAll(
        '[data-product-popup-close]'
      )
      .forEach(function (button) {

        button.addEventListener(
          'click',
          function () {
            closePopup();
          }
        );

      });


    /* =========================
       ESCAPE KEY
    ========================= */

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


    /* =========================
       ADD TO CART
    ========================= */

    form.addEventListener(
      'submit',
      function (event) {

        event.preventDefault();


        if (!selectedVariant) {

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


        fetch(
          (
            window.Shopify &&
            window.Shopify.routes &&
            window.Shopify.routes.root
          )
            ? window.Shopify.routes.root + 'cart/add.js'
            : '/cart/add.js',
          {
            method: 'POST',

            headers: {
              'Content-Type':
                'application/json',

              'Accept':
                'application/json'
            },

            body: JSON.stringify({

              items: [
                {
                  id:
                    Number(selectedVariant.id),

                  quantity: 1
                }
              ]

            })
          }
        )
        .then(function (response) {

          if (!response.ok) {

            return response.json().then(function (data) {

              throw new Error(
                data.description ||
                data.message ||
                'Unable to add product to cart.'
              );

            });

          }

          return response.json();

        })
        .then(function () {

          if (addButtonText) {
            addButtonText.textContent =
              'ADDED';
          }

          setTimeout(function () {

            closePopup();

            if (addButtonText) {
              addButtonText.textContent =
                'ADD TO CART';
            }

            addButton.disabled =
              false;

          }, 700);

        })
        .catch(function (error) {

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

        });

      }
    );

  }


  /* =========================
     START
  ========================= */

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
