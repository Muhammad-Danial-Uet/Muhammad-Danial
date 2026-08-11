document.addEventListener('DOMContentLoaded', () => {
  const popup = document.querySelector('[data-tisso-popup]');

  if (!popup) return;

  const popupImage = popup.querySelector('[data-popup-image]');
  const popupTitle = popup.querySelector('[data-popup-title]');
  const popupPrice = popup.querySelector('[data-popup-price]');
  const popupDescription = popup.querySelector('[data-popup-description]');
  const popupVariants = popup.querySelector('[data-popup-variants]');
  const popupError = popup.querySelector('[data-popup-error]');
  const form = popup.querySelector('[data-add-to-cart-form]');

  let currentProduct = null;
  let selectedVariantId = null;

  function openPopup(product) {
    currentProduct = product;

    popupImage.src = product.featured_image || '';
    popupImage.alt = product.title || '';

    popupTitle.textContent = product.title || '';

    popupPrice.textContent = formatMoney(
      product.price,
      product.currency
    );

    popupDescription.innerHTML =
      product.description || '';

    renderVariants(product);

    popup.classList.add('is-open');
    popup.setAttribute('aria-hidden', 'false');

    document.body.classList.add('tisso-popup-open');
  }

  function closePopup() {
    popup.classList.remove('is-open');
    popup.setAttribute('aria-hidden', 'true');

    document.body.classList.remove('tisso-popup-open');

    currentProduct = null;
    selectedVariantId = null;
  }

  function formatMoney(priceInCents) {
    const amount = Number(priceInCents) / 100;

    return new Intl.NumberFormat(
      document.documentElement.lang || 'en',
      {
        style: 'currency',
        currency: 'USD'
      }
    ).format(amount);
  }

  function renderVariants(product) {
    popupVariants.innerHTML = '';

    if (!product.variants || product.variants.length === 0) {
      return;
    }

    const availableVariants = product.variants.filter(
      variant => variant.available
    );

    if (!availableVariants.length) {
      return;
    }

    const optionNames = [];

    availableVariants.forEach(variant => {
      variant.options.forEach((option, index) => {
        if (!optionNames[index]) {
          optionNames[index] = product.options[index];
        }
      });
    });

    optionNames.forEach((optionName, optionIndex) => {
      const wrapper = document.createElement('div');

      wrapper.className = 'tisso-variant';

      const label = document.createElement('label');

      label.textContent = optionName;

      const select = document.createElement('select');

      select.dataset.optionIndex = optionIndex;

      const values = [
        ...new Set(
          availableVariants.map(
            variant => variant.options[optionIndex]
          )
        )
      ];

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

  function updateSelectedVariant() {
    if (!currentProduct) return;

    const selects = [
      ...popupVariants.querySelectorAll('select')
    ];

    const selectedOptions = selects.map(
      select => select.value
    );

    const variant = currentProduct.variants.find(
      productVariant => {
        return productVariant.options.every(
          (option, index) =>
            option === selectedOptions[index]
        );
      }
    );

    if (variant) {
      selectedVariantId = variant.id;

      popupPrice.textContent = formatMoney(
        variant.price
      );
    } else {
      selectedVariantId = null;
    }
  }

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
              id: variantId,
              quantity: 1
            }
          ]
        })
      }
    );

    if (!response.ok) {
      throw new Error('Unable to add product to cart.');
    }

    return response.json();
  }

  async function findSoftWinterJacket() {
    const response = await fetch(
      '/products/soft-winter-jacket.js'
    );

    if (!response.ok) {
      return null;
    }

    return response.json();
  }

  async function addSoftWinterJacket() {
    const jacket = await findSoftWinterJacket();

    if (!jacket || !jacket.variants) {
      return;
    }

    const availableVariant = jacket.variants.find(
      variant => variant.available
    );

    if (!availableVariant) {
      return;
    }

    await addToCart(availableVariant.id);
  }

  function selectedOptionsContainBlackAndMedium() {
    if (!currentProduct) return false;

    const selects = [
      ...popupVariants.querySelectorAll('select')
    ];

    const selectedValues = selects.map(
      select => select.value.toLowerCase()
    );

    return (
      selectedValues.includes('black') &&
      selectedValues.includes('medium')
    );
  }

  document.querySelectorAll(
    '[data-product-popup-open]'
  ).forEach(button => {

    button.addEventListener('click', () => {
      const card = button.closest(
        '[data-product-card]'
      );

      const productJSON = card.querySelector(
        '[data-product-data] script'
      );

      if (!productJSON) return;

      const product = JSON.parse(
        productJSON.textContent
      );

      openPopup(product);
    });

  });

  popup.querySelectorAll(
    '[data-product-popup-close]'
  ).forEach(element => {
    element.addEventListener(
      'click',
      closePopup
    );
  });

  popupVariants.addEventListener(
    'change',
    updateSelectedVariant
  );

  form.addEventListener(
    'submit',
    async event => {

      event.preventDefault();

      if (!selectedVariantId) {
        popupError.textContent =
          'Please select a valid variant.';

        popupError.hidden = false;

        return;
      }

      popupError.hidden = true;

      const addButton = popup.querySelector(
        '[data-add-to-cart]'
      );

      addButton.disabled = true;

      try {

        await addToCart(selectedVariantId);

        if (
          selectedOptionsContainBlackAndMedium()
        ) {
          await addSoftWinterJacket();
        }

        window.location.href = '/cart';

      } catch (error) {

        popupError.textContent =
          'Unable to add the product to cart. Please try again.';

        popupError.hidden = false;

      } finally {

        addButton.disabled = false;

      }
    }
  );

  document.addEventListener(
    'keydown',
    event => {
      if (
        event.key === 'Escape' &&
        popup.classList.contains('is-open')
      ) {
        closePopup();
      }
    }
  );
});
