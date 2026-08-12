<script>
(function () {
  function initTissoGrid() {
    const grids = document.querySelectorAll('[data-tisso-grid]');

    grids.forEach(function (grid) {
      if (grid.dataset.tissoInitialized === 'true') return;

      grid.dataset.tissoInitialized = 'true';

      const popup = grid.querySelector('[data-tisso-popup]');
      const openButtons = grid.querySelectorAll('[data-product-popup-open]');
      const closeButtons = grid.querySelectorAll('[data-product-popup-close]');
      const popupImage = grid.querySelector('[data-popup-image]');
      const popupTitle = grid.querySelector('[data-popup-title]');
      const popupPrice = grid.querySelector('[data-popup-price]');
      const popupDescription = grid.querySelector('[data-popup-description]');
      const variantsContainer = grid.querySelector('[data-popup-variants]');
      const addToCartForm = grid.querySelector('[data-add-to-cart-form]');
      const addToCartButton = grid.querySelector('[data-add-to-cart]');
      const addToCartText = grid.querySelector('[data-add-to-cart-text]');
      const errorMessage = grid.querySelector('[data-popup-error]');

      if (!popup) return;

      let currentProduct = null;
      let selectedOptions = [];
      let selectedVariant = null;

      function formatMoney(cents) {
        cents = Number(cents || 0);

        return (cents / 100).toLocaleString(undefined, {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2
        }) + '€';
      }

      function getVariantOption(variant, index) {
        return variant['option' + (index + 1)] || '';
      }

      function getSelectedVariant() {
        if (!currentProduct || !currentProduct.variants) {
          return null;
        }

        return currentProduct.variants.find(function (variant) {
          if (!variant.available) return false;

          return selectedOptions.every(function (option, index) {
            return getVariantOption(variant, index) === option;
          });
        }) || null;
      }

      function updateVariant() {
        selectedVariant = getSelectedVariant();

        if (!selectedVariant) {
          addToCartButton.disabled = true;
          addToCartText.textContent = 'UNAVAILABLE';
          return;
        }

        addToCartButton.disabled = false;
        addToCartText.textContent = 'ADD TO CART';
        popupPrice.textContent = formatMoney(selectedVariant.price);
      }

      function createVariants() {
        variantsContainer.innerHTML = '';

        if (
          !currentProduct.options ||
          !currentProduct.options.length ||
          !currentProduct.variants ||
          currentProduct.variants.length <= 1
        ) {
          selectedVariant = currentProduct.variants
            ? currentProduct.variants[0]
            : null;

          if (selectedVariant) {
            popupPrice.textContent = formatMoney(selectedVariant.price);

            if (selectedVariant.available) {
              addToCartButton.disabled = false;
              addToCartText.textContent = 'ADD TO CART';
            } else {
              addToCartButton.disabled = true;
              addToCartText.textContent = 'SOLD OUT';
            }
          }

          return;
        }

        const firstAvailable = currentProduct.variants.find(function (variant) {
          return variant.available;
        });

        const defaultVariant = firstAvailable || currentProduct.variants[0];

        selectedOptions = currentProduct.options.map(function (option, index) {
          return getVariantOption(defaultVariant, index);
        });

        currentProduct.options.forEach(function (optionName, optionIndex) {
          const wrapper = document.createElement('div');
          wrapper.className = 'tisso-variant-group';

          const label = document.createElement('label');
          label.className = 'tisso-variant-label';
          label.textContent = optionName;

          wrapper.appendChild(label);

          const values = [];

          currentProduct.variants.forEach(function (variant) {
            const value = getVariantOption(variant, optionIndex);

            if (value && !values.includes(value)) {
              values.push(value);
            }
          });

          if (optionIndex === 0 && values.length <= 4) {
            const buttons = document.createElement('div');
            buttons.className = 'tisso-variant-buttons';

            values.forEach(function (value) {
              const button = document.createElement('button');

              button.type = 'button';
              button.className = 'tisso-variant-option';
              button.textContent = value;

              if (selectedOptions[optionIndex] === value) {
                button.classList.add('is-selected');
              }

              const matchingVariant = currentProduct.variants.find(function (variant) {
                return (
                  getVariantOption(variant, optionIndex) === value &&
                  variant.available
                );
              });

              if (!matchingVariant) {
                button.disabled = true;
              }

              button.addEventListener('click', function () {
                selectedOptions[optionIndex] = value;

                buttons
                  .querySelectorAll('.tisso-variant-option')
                  .forEach(function (item) {
                    item.classList.remove('is-selected');
                  });

                button.classList.add('is-selected');

                updateVariant();
              });

              buttons.appendChild(button);
            });

            wrapper.appendChild(buttons);
          } else {
            const select = document.createElement('select');

            select.className = 'tisso-variant-select';

            values.forEach(function (value) {
              const optionElement = document.createElement('option');

              optionElement.value = value;
              optionElement.textContent = value;

              if (selectedOptions[optionIndex] === value) {
                optionElement.selected = true;
              }

              select.appendChild(optionElement);
            });

            select.addEventListener('change', function () {
              selectedOptions[optionIndex] = select.value;
              updateVariant();
            });

            wrapper.appendChild(select);
          }

          variantsContainer.appendChild(wrapper);
        });

        updateVariant();
      }

      function openPopup(product) {
        currentProduct = product;
        selectedOptions = [];
        selectedVariant = null;

        if (product.featured_image) {
          popupImage.src =
            typeof product.featured_image === 'string'
              ? product.featured_image
              : product.featured_image.src || '';
        } else if (product.images && product.images.length) {
          popupImage.src =
            typeof product.images[0] === 'string'
              ? product.images[0]
              : product.images[0].src || '';
        } else {
          popupImage.src = '';
        }

        popupImage.alt = product.title || '';
        popupTitle.textContent = product.title || '';
        popupPrice.textContent = formatMoney(product.price);

        popupDescription.innerHTML = product.description || '';

        errorMessage.hidden = true;
        errorMessage.textContent = '';

        addToCartButton.disabled = false;
        addToCartText.textContent = 'ADD TO CART';

        createVariants();

        popup.setAttribute('aria-hidden', 'false');
        popup.classList.add('is-active');

        document.body.classList.add('tisso-popup-open');
        document.body.style.overflow = 'hidden';
      }

      function closePopup() {
        popup.setAttribute('aria-hidden', 'true');
        popup.classList.remove('is-active');

        document.body.classList.remove('tisso-popup-open');
        document.body.style.overflow = '';

        currentProduct = null;
        selectedVariant = null;
      }

      openButtons.forEach(function (button) {
        button.addEventListener('click', function () {
          const card = button.closest('[data-product-card]');

          if (!card) return;

          const productData = card.querySelector('[data-product-data]');

          if (!productData) return;

          try {
            const product = JSON.parse(productData.textContent);
            openPopup(product);
          } catch (error) {
            console.error('Tisso product data error:', error);
          }
        });
      });

      closeButtons.forEach(function (button) {
        button.addEventListener('click', function () {
          closePopup();
        });
      });

      document.addEventListener('keydown', function (event) {
        if (
          event.key === 'Escape' &&
          popup.getAttribute('aria-hidden') === 'false'
        ) {
          closePopup();
        }
      });

      addToCartForm.addEventListener('submit', function (event) {
        event.preventDefault();

        errorMessage.hidden = true;
        errorMessage.textContent = '';

        if (!selectedVariant) {
          errorMessage.textContent = 'Please select an available variant.';
          errorMessage.hidden = false;
          return;
        }

        addToCartButton.disabled = true;
        addToCartText.textContent = 'ADDING...';

        fetch('/cart/add.js', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: JSON.stringify({
            items: [
              {
                id: selectedVariant.id,
                quantity: 1
              }
            ]
          })
        })
        .then(function (response) {
          if (!response.ok) {
            return response.json().then(function (data) {
              throw new Error(
                data.description || 'Unable to add product to cart.'
              );
            });
          }

          return response.json();
        })
        .then(function () {
          addToCartText.textContent = 'ADDED';

          setTimeout(function () {
            closePopup();

            addToCartText.textContent = 'ADD TO CART';
            addToCartButton.disabled = false;
          }, 700);
        })
        .catch(function (error) {
          console.error('Add to cart error:', error);

          errorMessage.textContent =
            error.message || 'Unable to add this product to cart.';

          errorMessage.hidden = false;

          addToCartText.textContent = 'ADD TO CART';
          addToCartButton.disabled = false;
        });
      });
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initTissoGrid);
  } else {
    initTissoGrid();
  }
})();
</script>
