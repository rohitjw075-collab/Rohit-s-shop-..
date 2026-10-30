/* ========================================================
   GLOBAL STATE & DATA SETUP
   ======================================================== */
const DEMO_CATALOG = [
  { barcode: '1001', name: 'Fresh Milk (1L)', price: 60.00 },
  { barcode: '1002', name: 'Whole Wheat Bread', price: 40.00 },
  { barcode: '1003', name: 'Organic Green Tea', price: 150.00 },
  { barcode: '1004', name: 'Potato Chips (Large)', price: 35.00 },
  { barcode: '1005', name: 'Dark Chocolate Bar', price: 90.00 }
];

let cart = [];
let selectedPayment = 'offline'; // 'offline' or 'online'
let html5QrCode = null;

/* Audio Context for Web Sound FX */
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

function playClickSound() {
  try {
    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(800, audioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(400, audioCtx.currentTime + 0.05);
    gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.05);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.05);
  } catch (e) { console.log(e); }
}

function playSuccessChime() {
  try {
    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
    const now = audioCtx.currentTime;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(523.25, now); // C5
    osc.frequency.setValueAtTime(659.25, now + 0.1); // E5
    osc.frequency.setValueAtTime(783.99, now + 0.2); // G5
    osc.frequency.setValueAtTime(1046.50, now + 0.3); // C6

    gain.gain.setValueAtTime(0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.8);

    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    osc.stop(now + 0.8);
  } catch(e) { console.log(e); }
}

/* Voice Speech Announcement */
function speakThankYou() {
  if ('speechSynthesis' in window) {
    const text = "Thank you for visiting our shop sir, have a good day, bye!";
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.95;
    utterance.pitch = 1.0;
    window.speechSynthesis.speak(utterance);
  }
}

/* Visual Touch Ripple FX */
document.addEventListener('click', function(e) {
  const target = e.target.closest('.interactive-btn, button');
  if (target) {
    playClickSound();
    const circle = document.createElement('span');
    const diameter = Math.max(target.clientWidth, target.clientHeight);
    const radius = diameter / 2;

    const rect = target.getBoundingClientRect();
    circle.style.width = circle.style.height = `${diameter}px`;
    circle.style.left = `${e.clientX - rect.left - radius}px`;
    circle.style.top = `${e.clientY - rect.top - radius}px`;
    circle.classList.add('ripple-fx');

    const ripple = target.getElementsByClassName('ripple-fx')[0];
    if (ripple) {
      ripple.remove();
    }
    target.appendChild(circle);
  }
});

/* Realtime Clock */
setInterval(() => {
  const clock = document.getElementById('header-clock');
  if(clock) {
    const d = new Date();
    clock.innerText = d.toLocaleDateString() + ' ' + d.toLocaleTimeString();
  }
}, 1000);

/* Stepper Navigation Logic */
function switchStep(stepNum) {
  playClickSound();
  document.querySelectorAll('.step-content').forEach(el => el.classList.add('hidden'));
  document.getElementById(`step-${stepNum}`).classList.remove('hidden');

  // Update Stepper Visual state
  for(let i = 1; i <= 3; i++) {
    const btn = document.getElementById(`step-btn-${i}`);
    if(i === stepNum) {
      btn.className = "step-indicator active flex items-center space-x-2 text-sm font-semibold";
      btn.querySelector('span').className = "w-7 h-7 rounded-full bg-indigo-600 text-white flex items-center justify-center text-xs";
    } else {
      btn.className = "step-indicator flex items-center space-x-2 text-sm font-semibold text-gray-400";
      btn.querySelector('span').className = "w-7 h-7 rounded-full bg-gray-200 text-gray-600 flex items-center justify-center text-xs";
    }
  }

  if(stepNum === 2) {
    initScanner();
  } else {
    stopScanner();
  }

  if(stepNum === 3) {
    renderCart();
  }
}

/* ========================================================
   CAMERA BARCODE SCANNING
   ======================================================== */
function initScanner() {
  if (html5QrCode) return; // Scanner initialized already

  html5QrCode = new Html5Qrcode("reader");
  const config = { fps: 10, qrbox: { width: 250, height: 150 } };

  html5QrCode.start(
    { facingMode: "environment" }, 
    config, 
    (decodedText) => {
      onCodeScanned(decodedText);
    },
    () => {} // Ignore scan frame errors
  ).catch(err => {
    console.warn("Camera availability error or denied:", err);
  });
}

function stopScanner() {
  if (html5QrCode) {
    html5QrCode.stop().then(() => {
      html5QrCode.clear();
      html5QrCode = null;
    }).catch(err => {
      html5QrCode = null;
    });
  }
}

function onCodeScanned(barcode) {
  playClickSound();
  let product = DEMO_CATALOG.find(p => p.barcode === barcode);
  if (!product) {
    // Generate fallback product if unknown barcode
    product = {
      barcode: barcode,
      name: `Product #${barcode}`,
      price: 50.00
    };
  }
  addToCart(product);
}

function addManualProduct() {
  const input = document.getElementById('manual-barcode');
  const code = input.value.trim();
  if (code) {
    onCodeScanned(code);
    input.value = '';
  }
}

function renderDemoCatalog() {
  const container = document.getElementById('demo-products');
  container.innerHTML = DEMO_CATALOG.map(item => `
    <button onclick="onCodeScanned('${item.barcode}')" class="interactive-btn text-xs bg-gray-100 hover:bg-indigo-100 border text-gray-700 px-3 py-1.5 rounded-lg">
      + ${item.name} (₹${item.price})
    </button>
  `).join('');
}

/* ========================================================
   CART MANAGEMENT
   ======================================================== */
function addToCart(product) {
  const existing = cart.find(item => item.barcode === product.barcode);
  if (existing) {
    existing.qty += 1;
  } else {
    cart.push({ ...product, qty: 1 });
  }
  updateCartBadge();
}

function updateQuantity(barcode, delta) {
  const item = cart.find(i => i.barcode === barcode);
  if (item) {
    item.qty += delta;
    if (item.qty <= 0) {
      cart = cart.filter(i => i.barcode !== barcode);
    }
  }
  renderCart();
  updateCartBadge();
}

function deleteCartItem(barcode) {
  cart = cart.filter(i => i.barcode !== barcode);
  renderCart();
  updateCartBadge();
}

function updateCartBadge() {
  const totalCount = cart.reduce((acc, i) => acc + i.qty, 0);
  document.getElementById('scan-cart-count').innerText = `${totalCount} items`;
}

function getCartTotal() {
  return cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
}

function renderCart() {
  const tbody = document.getElementById('cart-table-body');
  const emptyMsg = document.getElementById('empty-cart-msg');
  const totalEl = document.getElementById('cart-total-amount');

  if (cart.length === 0) {
    tbody.innerHTML = '';
    emptyMsg.classList.remove('hidden');
    totalEl.innerText = '₹0.00';
    return;
  }

  emptyMsg.classList.add('hidden');
  tbody.innerHTML = cart.map(item => `
    <tr class="hover:bg-gray-50">
      <td class="py-3 px-2 font-medium">${item.name}</td>
      <td class="py-3 px-2">₹${item.price.toFixed(2)}</td>
      <td class="py-3 px-2 text-center">
        <div class="inline-flex items-center space-x-1 border rounded-lg px-2 py-1">
          <button onclick="updateQuantity('${item.barcode}', -1)" class="text-indigo-600 px-1 font-bold">-</button>
          <span class="font-bold px-2">${item.qty}</span>
          <button onclick="updateQuantity('${item.barcode}', 1)" class="text-indigo-600 px-1 font-bold">+</button>
        </div>
      </td>
      <td class="py-3 px-2 text-right font-bold">₹${(item.price * item.qty).toFixed(2)}</td>
      <td class="py-3 px-2 text-center">
        <button onclick="deleteCartItem('${item.barcode}')" class="text-red-500 hover:text-red-700">
          <i class="fa-solid fa-trash-can"></i>
        </button>
      </td>
    </tr>
  `).join('');

  totalEl.innerText = `₹${getCartTotal().toFixed(2)}`;
}

/* ========================================================
   PAYMENT & RECEIPT PROCESSING
   ======================================================== */
function selectPaymentMethod(type) {
  playClickSound();
  selectedPayment = type;
  const offlineBox = document.getElementById('pay-opt-offline');
  const onlineBox = document.getElementById('pay-opt-online');
  const qrContainer = document.getElementById('online-qr-container');

  if (type === 'online') {
    onlineBox.className = "payment-option border-2 border-indigo-600 bg-indigo-50/50 p-4 rounded-xl cursor-pointer flex items-center space-x-3";
    offlineBox.className = "payment-option border-2 border-gray-200 p-4 rounded-xl cursor-pointer flex items-center space-x-3";
    qrContainer.classList.remove('hidden');
    generateUPIQR();
  } else {
    offlineBox.className = "payment-option border-2 border-indigo-600 bg-indigo-50/50 p-4 rounded-xl cursor-pointer flex items-center space-x-3";
    onlineBox.className = "payment-option border-2 border-gray-200 p-4 rounded-xl cursor-pointer flex items-center space-x-3";
    qrContainer.classList.add('hidden');
  }
}

function generateUPIQR() {
  const total = getCartTotal();
  const upiUri = `upi://pay?pa=8329461513@axl&pn=RohitShop&am=${total.toFixed(2)}&cu=INR`;
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(upiUri)}`;
  document.getElementById('upi-qr-code').src = qrUrl;
}

function processFinalPayment() {
  if (cart.length === 0) {
    alert("Cart is empty! Please add products first.");
    return;
  }

  playSuccessChime();
  speakThankYou();
  renderPrintableReceipt();
  toggleModal('receipt-modal');
}

function renderPrintableReceipt() {
  const receiptContainer = document.getElementById('printable-receipt');
  const now = new Date();
  const dateStr = now.toLocaleDateString();
  const timeStr = now.toLocaleTimeString();
  const total = getCartTotal();

  receiptContainer.innerHTML = `
    <div class="text-center border-b pb-4 mb-4">
      <h2 class="text-xl font-extrabold tracking-wider">ROHIT'S SHOP</h2>
      <p class="text-xs text-gray-500">Retail & Digital Management Terminal</p>
      <p class="text-xs text-gray-500">UPI Pay ID: 8329461513@axl</p>
    </div>

    <div class="text-xs text-gray-600 flex justify-between mb-4">
      <div>
        <p><strong>Date:</strong> ${dateStr}</p>
        <p><strong>Time:</strong> ${timeStr}</p>
      </div>
      <div class="text-right">
        <p><strong>Payment:</strong> ${selectedPayment.toUpperCase()}</p>
        <p><strong>Status:</strong> <span class="text-green-600 font-bold">PAID</span></p>
      </div>
    </div>

    <table class="w-full text-xs text-left mb-4">
      <thead>
        <tr class="border-b font-bold">
          <th class="py-1">Item</th>
          <th class="py-1 text-center">Qty</th>
          <th class="py-1 text-right">Price</th>
        </tr>
      </thead>
      <tbody>
        ${cart.map(i => `
          <tr class="border-b border-gray-100">
            <td class="py-1.5">${i.name}</td>
            <td class="py-1.5 text-center">${i.qty}</td>
            <td class="py-1.5 text-right">₹${(i.price * i.qty).toFixed(2)}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>

    <div class="border-t pt-2 flex justify-between font-extrabold text-sm mb-6">
      <span>Total Amount Paid:</span>
      <span>₹${total.toFixed(2)}</span>
    </div>

    <div class="text-center text-xs text-gray-500 mb-4 italic">
      "Thank you for visiting our shop sir! Have a good day, bye!"
    </div>

    <div class="flex gap-2">
      <button onclick="window.print()" class="interactive-btn flex-1 py-2 bg-indigo-600 text-white font-bold rounded-lg text-sm">Print Bill</button>
      <button onclick="resetTransaction()" class="interactive-btn flex-1 py-2 bg-gray-200 text-gray-700 font-bold rounded-lg text-sm">New Order</button>
    </div>
  `;
}

function resetTransaction() {
  cart = [];
  updateCartBadge();
  toggleModal('receipt-modal');
  switchStep(1);
}

/* Modal Helper Functions */
function toggleModal(modalId) {
  playClickSound();
  const el = document.getElementById(modalId);
  if (el) {
    el.classList.toggle('hidden');
  }
}

/* ========================================================
   SQL SCHEMA INJECTION
   ======================================================== */
const SQL_SCHEMA_CONTENT = `-- Database Setup for Rohit's Shop Management System
CREATE DATABASE IF NOT EXISTS rohit_shop_db;
USE rohit_shop_db;

-- Products Master Table
CREATE TABLE IF NOT EXISTS products (
    product_id INT AUTO_INCREMENT PRIMARY KEY,
    barcode VARCHAR(100) UNIQUE NOT NULL,
    product_name VARCHAR(255) NOT NULL,
    price DECIMAL(10, 2) NOT NULL,
    stock_quantity INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert Sample Barcode Products
INSERT INTO products (barcode, product_name, price, stock_quantity) VALUES
('1001', 'Fresh Milk (1L)', 60.00, 100),
('1002', 'Whole Wheat Bread', 40.00, 50),
('1003', 'Organic Green Tea', 150.00, 30),
('1004', 'Potato Chips (Large)', 35.00, 200),
('1005', 'Dark Chocolate Bar', 90.00, 80);

-- Sales Bills / Transactions Table
CREATE TABLE IF NOT EXISTS sales_bills (
    bill_id INT AUTO_INCREMENT PRIMARY KEY,
    payment_method ENUM('ONLINE', 'OFFLINE') NOT NULL,
    total_amount DECIMAL(10, 2) NOT NULL,
    upi_vpa VARCHAR(100) DEFAULT '8329461513@axl',
    transaction_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Bill Line Items Breakdown
CREATE TABLE IF NOT EXISTS bill_items (
    item_id INT AUTO_INCREMENT PRIMARY KEY,
    bill_id INT NOT NULL,
    barcode VARCHAR(100) NOT NULL,
    quantity INT NOT NULL,
    unit_price DECIMAL(10, 2) NOT NULL,
    subtotal DECIMAL(10, 2) NOT NULL,
    FOREIGN KEY (bill_id) REFERENCES sales_bills(bill_id) ON DELETE CASCADE
);`;

function copySqlCode() {
  navigator.clipboard.writeText(SQL_SCHEMA_CONTENT);
  alert("SQL Schema copied to clipboard!");
}

/* Initialization on Load */
window.addEventListener('DOMContentLoaded', () => {
  renderDemoCatalog();
  document.getElementById('sql-code-block').innerText = SQL_SCHEMA_CONTENT;
});
