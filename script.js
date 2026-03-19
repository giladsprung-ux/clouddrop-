// ── BUNDLE PRICES ──
const BUNDLE_PRICES = { 1: 49.99, 2: 89.99 };

// ── UTILS ──
function $ (id) { return document.getElementById(id); }

// ── SCROLL TO PRODUCT ──
function scrollToProduct() {
  const el = document.getElementById('product');
  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// ── COUNTDOWN TIMER ──
function initCountdown() {
  const KEY = 'clouddrop_sale_end';
  let end = parseInt(localStorage.getItem(KEY));
  if (!end || end < Date.now()) {
    const hours = 4 + Math.random() * 6;
    end = Date.now() + hours * 3600000;
    localStorage.setItem(KEY, end);
  }

  function tick() {
    const diff = end - Date.now();
    const h = String(Math.max(0, Math.floor(diff / 3600000))).padStart(2, '0');
    const m = String(Math.max(0, Math.floor((diff % 3600000) / 60000))).padStart(2, '0');
    const s = String(Math.max(0, Math.floor((diff % 60000) / 1000))).padStart(2, '0');
    const text = diff <= 0 ? '00:00:00' : `${h}:${m}:${s}`;
    // Update all countdown elements on page
    document.querySelectorAll('.countdown-timer').forEach(el => el.textContent = text);
  }

  tick();
  setInterval(tick, 1000);
}

// ── GALLERY ──
function switchImg(thumb) {
  const main = $('galleryMain');
  if (!main) return;
  main.src = thumb.src;
  document.querySelectorAll('.thumb').forEach(t => t.classList.remove('active'));
  thumb.classList.add('active');
}

// ── CHECKOUT OPEN/CLOSE ──
function openCheckout() {
  const qty = getSelectedQty();
  const price = BUNDLE_PRICES[qty];

  // Update mini order summary
  const osmQty = $('osm-qty');
  const osmPrice = $('osm-price');
  if (osmQty) osmQty.textContent = `× ${qty}`;
  if (osmPrice) osmPrice.textContent = `$${price.toFixed(2)}`;

  const overlay = $('checkoutOverlay');
  if (overlay) {
    overlay.style.display = 'flex';
    requestAnimationFrame(() => overlay.classList.add('open'));
  }
  showStep(1);
}

function closeCheckout() {
  const overlay = $('checkoutOverlay');
  if (!overlay) return;
  overlay.classList.remove('open');
  setTimeout(() => { overlay.style.display = 'none'; }, 250);
}

function closeCheckoutOverlay(e) {
  if (e.target === $('checkoutOverlay')) closeCheckout();
}

// ── STEP NAVIGATION ──
function showStep(n) {
  $('step1').style.display = n === 1 ? 'block' : 'none';
  $('step2').style.display = n === 2 ? 'block' : 'none';

  const ind1 = $('step-ind-1');
  const ind2 = $('step-ind-2');
  if (ind1 && ind2) {
    ind1.className = 'step-ind' + (n === 1 ? ' active' : ' done');
    ind2.className = 'step-ind' + (n === 2 ? ' active' : '');
  }
}

function backToShipping() {
  showStep(1);
}

// ── GET BUNDLE QTY ──
function getSelectedQty() {
  const checked = document.querySelector('input[name="bundle"]:checked');
  return checked ? parseInt(checked.value) : 1;
}

// ── PROCEED TO PAYMENT ──
function proceedToPayment(e) {
  e.preventDefault();

  const form = $('shippingForm');
  const fields = form.querySelectorAll('input[required], select[required]');
  let valid = true;

  fields.forEach(f => {
    if (!f.value.trim()) {
      valid = false;
      f.style.borderColor = '#ff4757';
    } else {
      f.style.borderColor = '';
    }
  });

  if (!valid) return;

  // Build address string
  const fname = $('firstName').value.trim();
  const lname = $('lastName').value.trim();
  const city = $('city').value.trim();
  const state = $('state').value.trim();
  const country = $('country').value;
  const addrText = $('addrText');
  if (addrText) addrText.textContent = `${fname} ${lname}, ${city}, ${state} ${country}`;

  // Populate order summary
  const qty = getSelectedQty();
  const price = BUNDLE_PRICES[qty];
  const qtyLabel = $('os-qty-label');
  const subtotal = $('os-subtotal');
  const total = $('os-total');
  const payTotal = $('pay-total');

  if (qtyLabel) qtyLabel.textContent = `× ${qty}`;
  if (subtotal) subtotal.textContent = `$${price.toFixed(2)}`;
  if (total) total.textContent = `$${price.toFixed(2)}`;
  if (payTotal) payTotal.textContent = `$${price.toFixed(2)}`;

  showStep(2);
  initCardInput();
  initExpiryInput();
}

// ── LUHN ──
function luhn(num) {
  const digits = String(num).replace(/\D/g, '').split('').reverse().map(Number);
  let sum = 0;
  digits.forEach((d, i) => {
    if (i % 2 === 1) { d *= 2; if (d > 9) d -= 9; }
    sum += d;
  });
  return sum % 10 === 0;
}

// ── CARD TYPE ──
function detectCardType(num) {
  const n = num.replace(/\s/g, '');
  if (/^4/.test(n)) return 'visa';
  if (/^5[1-5]|^2[2-7]/.test(n)) return 'mc';
  if (/^3[47]/.test(n)) return 'amex';
  if (/^6(?:011|5)/.test(n)) return 'disc';
  return null;
}

// ── CARD INPUT FORMATTING ──
function initCardInput() {
  const input = $('cardNum');
  if (!input || input._initDone) return;
  input._initDone = true;

  input.addEventListener('input', () => {
    let val = input.value.replace(/\D/g, '').slice(0, 16);
    input.value = val.replace(/(.{4})/g, '$1 ').trim();

    const type = detectCardType(val);
    document.querySelectorAll('.card-brand').forEach(b => {
      const id = b.id.replace('brand-', '');
      b.classList.toggle('active', id === type);
    });

    // Update label
    const label = $('card-type-label');
    const labels = { visa: 'Visa', mc: 'Mastercard', amex: 'Amex', disc: 'Discover' };
    if (label) label.textContent = type ? labels[type] : '';
  });
}

// ── EXPIRY FORMATTING ──
function initExpiryInput() {
  const input = $('expiry');
  if (!input || input._initDone) return;
  input._initDone = true;

  input.addEventListener('input', () => {
    let val = input.value.replace(/\D/g, '').slice(0, 4);
    if (val.length >= 3) val = val.slice(0, 2) + '/' + val.slice(2);
    input.value = val;
  });
}

// ── PLACE ORDER ──
function placeOrder(e) {
  e.preventDefault();

  const cardNum = ($('cardNum')?.value || '').replace(/\s/g, '');
  const expiry = $('expiry')?.value || '';
  const cvv = $('cvv')?.value || '';
  const name = $('cardName')?.value || '';

  if (cardNum.length < 13 || !luhn(cardNum)) {
    alert('Please enter a valid card number.');
    return;
  }

  const parts = expiry.split('/');
  const mm = parseInt(parts[0]);
  const yy = parseInt(parts[1]);
  const now = new Date();
  const expDate = new Date(2000 + yy, mm - 1);
  if (!mm || !yy || expDate < new Date(now.getFullYear(), now.getMonth())) {
    alert('Please enter a valid expiry date.');
    return;
  }

  if (cvv.length < 3) { alert('Please enter a valid CVV.'); return; }
  if (!name.trim()) { alert('Please enter the name on your card.'); return; }

  closeCheckout();

  // Clear saved form data after order
  SAVED_FIELDS.forEach(id => localStorage.removeItem('cd_' + id));

  // Generate order number
  const orderNum = 'CD-' + Math.random().toString(36).substring(2, 8).toUpperCase();
  const el = $('successOrderNum');
  if (el) el.textContent = `Order #${orderNum}`;

  const overlay = $('successOverlay');
  if (overlay) {
    overlay.style.display = 'flex';
    requestAnimationFrame(() => overlay.classList.add('open'));
  }
}

// ── EXIT INTENT ──
function initExitIntent() {
  let shown = false;

  function showExitPopup() {
    if (shown) return;
    shown = true;
    const overlay = $('exitOverlay');
    if (overlay) {
      overlay.style.display = 'flex';
      requestAnimationFrame(() => overlay.classList.add('open'));
    }
  }

  // Desktop: mouse leaves top of page
  document.addEventListener('mouseleave', e => {
    if (e.clientY <= 0) showExitPopup();
  });

  // Mobile: show after 45s on page
  setTimeout(() => {
    if (window.innerWidth < 768) showExitPopup();
  }, 45000);
}

function closeExit() {
  const overlay = $('exitOverlay');
  if (!overlay) return;
  overlay.classList.remove('open');
  setTimeout(() => { overlay.style.display = 'none'; }, 250);
}

// ── STICKY BAR ──
function initStickyBar() {
  const bar = $('stickyBar');
  const product = $('product');
  if (!bar || !product) return;

  let productSeen = false;

  const observer = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) productSeen = true;
      // Only show bar after product section has been seen and is now out of view
      bar.classList.toggle('visible', productSeen && !e.isIntersecting);
    });
  }, { threshold: 0 });

  observer.observe(product);
}

// ── WELCOME POPUP ──
function showWelcome() {
  const overlay = $('welcomeOverlay');
  if (!overlay) return;
  overlay.style.display = 'flex';
  requestAnimationFrame(() => overlay.classList.add('open'));
}

function closeWelcome() {
  const overlay = $('welcomeOverlay');
  if (!overlay) return;
  overlay.classList.remove('open');
  setTimeout(() => { overlay.style.display = 'none'; }, 250);
  sessionStorage.setItem('cd_welcomed', '1');
}

// ── CLOSE SUCCESS ──
function closeSuccess() {
  const overlay = $('successOverlay');
  if (!overlay) return;
  overlay.classList.remove('open');
  setTimeout(() => { overlay.style.display = 'none'; }, 250);
}

// ── UPDATE BUY BUTTON PRICE ──
function updateBuyPrice() {
  const qty = getSelectedQty();
  const el = $('buy-price');
  if (el) el.textContent = `$${BUNDLE_PRICES[qty].toFixed(2)}`;
}

// ── SAVE / RESTORE FORM ──
const SAVED_FIELDS = ['firstName','lastName','email','address','city','state','zip','country'];

function saveFormData() {
  SAVED_FIELDS.forEach(id => {
    const el = document.getElementById(id);
    if (el) localStorage.setItem('cd_' + id, el.value);
  });
}

function restoreFormData() {
  SAVED_FIELDS.forEach(id => {
    const el = document.getElementById(id);
    const val = localStorage.getItem('cd_' + id);
    if (el && val) el.value = val;
  });
}

// ── INIT ──
document.addEventListener('DOMContentLoaded', () => {
  initCountdown();
  restoreFormData();
  if (!sessionStorage.getItem('cd_welcomed')) {
    setTimeout(showWelcome, 800);
  }
  initExitIntent();
  initStickyBar();

  // First thumb active
  const firstThumb = document.querySelector('.thumb');
  if (firstThumb) firstThumb.classList.add('active');

  // Close success overlay on click outside
  const successOverlay = $('successOverlay');
  if (successOverlay) {
    successOverlay.addEventListener('click', e => {
      if (e.target === successOverlay) closeSuccess();
    });
  }

  // Update buy button price on bundle change
  document.querySelectorAll('input[name="bundle"]').forEach(radio => {
    radio.addEventListener('change', updateBuyPrice);
  });

  // Auto-save form fields
  SAVED_FIELDS.forEach(id => {
    const el = document.getElementById(id);
    if (el) el.addEventListener('input', saveFormData);
  });
});
