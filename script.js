// Data Models & Initial State
let markets = [
    { id: 1, name: "Iroda Market", owner: "Iroda opa", phone: "+998901234567", location: "Chorsu daxasi", debt: 450000 },
    { id: 2, name: "Baraka Do'koni", owner: "Jasur aka", phone: "+998912345678", location: "Yunusobod 4-mavze", debt: 120000 },
    { id: 3, name: "Oasis Supermarket", owner: "Mirzo aka", phone: "+998933456789", location: "Mirzo Ulug'bek", debt: 0 },
    { id: 4, name: "Fayz Market", owner: "Hikmat aka", phone: "+998944567890", location: "Chilanzar 10", debt: 890000 },
    { id: 5, name: "Zamin Do'koni", owner: "Anvar aka", phone: "+998955678901", location: "Sergeli 8", debt: 230000 },
    { id: 6, name: "Saxovat Market", owner: "Qodir aka", phone: "+998909876543", location: "Qo'yliq bozori", debt: 560000 },
    { id: 7, name: "Hosil Market", owner: "Sardor aka", phone: "+998918765432", location: "Olmazor tumani", debt: 0 }
];

let prices = { katta: 1500, ortacha: 1300, kichik: 1100 };
let stock = { katta: 2500, ortacha: 1800, kichik: 900 };
let todayOrders = [];
let activeMarketForBarter = null;

window.onload = function() {
    document.getElementById('today-date').querySelector('span').innerText = new Date().toLocaleDateString('uz-UZ');
    populateMarketSelect();
    renderMarkets();
    updateStats();
    updateStockUI();
};

function switchTab(tabId, btn) {
    document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.nav-item').forEach(b => b.classList.remove('active'));
    document.getElementById('tab-' + tabId).classList.add('active');
    btn.classList.add('active');
}

function changeQty(id, delta) {
    let input = document.getElementById(id);
    let val = parseInt(input.value) || 0;
    val = Math.max(0, val + delta);
    input.value = val;
    calculateOrder();
}

function populateMarketSelect() {
    let select = document.getElementById('order-market');
    select.innerHTML = '<option value="">-- Do\'konni tanlang --</option>';
    markets.forEach(m => {
        select.innerHTML += `<option value="${m.id}">${m.name} (${m.owner})</option>`;
    });
}

function calculateOrder() {
    let marketId = document.getElementById('order-market').value;
    let qKatta = parseInt(document.getElementById('qty-katta').value) || 0;
    let qOrtacha = parseInt(document.getElementById('qty-ortacha').value) || 0;
    let qKichik = parseInt(document.getElementById('qty-kichik').value) || 0;
    let paid = parseInt(document.getElementById('paid-amount').value) || 0;

    let currentSum = (qKatta * prices.katta) + (qOrtacha * prices.ortacha) + (qKichik * prices.kichik);
    let debt = 0;

    if (marketId) {
        let m = markets.find(x => x.id == marketId);
        if (m) debt = m.debt;
    }

    let total = currentSum + debt - paid;

    document.getElementById('res-current').innerText = currentSum.toLocaleString() + " so'm";
    document.getElementById('res-debt').innerText = debt.toLocaleString() + " so'm";
    document.getElementById('res-total').innerText = total.toLocaleString() + " so'm";
}

function saveOrder() {
    let marketId = document.getElementById('order-market').value;
    let qKatta = parseInt(document.getElementById('qty-katta').value) || 0;
    let qOrtacha = parseInt(document.getElementById('qty-ortacha').value) || 0;
    let qKichik = parseInt(document.getElementById('qty-kichik').value) || 0;
    let paid = parseInt(document.getElementById('paid-amount').value) || 0;

    if (!marketId) {
        alert("Iltimos, avval marketni tanlang!");
        return;
    }

    if (qKatta === 0 && qOrtacha === 0 && qKichik === 0) {
        alert("Kamida bitta tuxum miqdorini kiriting!");
        return;
    }

    let currentSum = (qKatta * prices.katta) + (qOrtacha * prices.ortacha) + (qKichik * prices.kichik);
    let m = markets.find(x => x.id == marketId);

    let unpaid = currentSum - paid;
    m.debt += unpaid;

    stock.katta -= qKatta;
    stock.ortacha -= qOrtacha;
    stock.kichik -= qKichik;

    todayOrders.unshift({
        marketName: m.name,
        katta: qKatta,
        ortacha: qOrtacha,
        kichik: qKichik,
        sum: currentSum,
        paid: paid
    });

    alert("Zakaz muvaffaqiyatli topshirildi va hisoblar yangilandi!");

    document.getElementById('qty-katta').value = 0;
    document.getElementById('qty-ortacha').value = 0;
    document.getElementById('qty-kichik').value = 0;
    document.getElementById('paid-amount').value = "";
    
    calculateOrder();
    renderMarkets();
    renderTodayOrders();
    updateStats();
    updateStockUI();
}

function renderMarkets() {
    let list = document.getElementById('markets-list');
    let search = document.getElementById('search-market').value.toLowerCase();
    list.innerHTML = "";

    markets.filter(m => m.name.toLowerCase().includes(search) || m.owner.toLowerCase().includes(search)).forEach(m => {
        let hasDebt = m.debt > 0;
        list.innerHTML += `
            <div class="market-card ${hasDebt ? 'has-debt' : ''}">
                <div class="market-info">
                    <div>
                        <div class="m-name">${m.name}</div>
                        <div class="m-sub"><i class="fa-solid fa-user"></i> ${m.owner}  |  <i class="fa-solid fa-location-dot"></i> ${m.location}</div>
                    </div>
                    <div class="m-debt-badge ${!hasDebt ? 'clear' : ''}">
                        ${hasDebt ? m.debt.toLocaleString() + ' so\'m qarz' : 'Qarzsiz'}
                    </div>
                </div>
                <div class="market-actions">
                    <a href="tel:${m.phone}" class="m-btn call-btn"><i class="fa-solid fa-phone"></i> Qo'ng'iroq</a>
                    <button class="m-btn sms-btn" onclick="sendSMS('${m.phone}', '${m.name}', ${m.debt})"><i class="fa-solid fa-comment-dots"></i> SMS</button>
                    <button class="m-btn barter-btn" onclick="openBarterModal(${m.id})"><i class="fa-solid fa-right-left"></i> Barter</button>
                </div>
            </div>
        `;
    });
}

function renderTodayOrders() {
    let container = document.getElementById('today-orders-list');
    if (todayOrders.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fa-solid fa-box-open"></i>
                <p>Bugun hali zakaz saqlanmadi</p>
            </div>`;
        return;
    }
    container.innerHTML = "";
    todayOrders.forEach(o => {
        container.innerHTML += `
            <div style="background: rgba(11, 15, 23, 0.5); border: 1px solid var(--border-color); border-radius: 12px; padding: 12px; margin-bottom: 8px;">
                <div style="display: flex; justify-content: space-between; font-weight: 700; margin-bottom: 4px;">
                    <span>${o.marketName}</span>
                    <span style="color: var(--primary);">${o.sum.toLocaleString()} so'm</span>
                </div>
                <div style="font-size: 0.78rem; color: var(--text-muted);">
                    Katta: ${o.katta} шт | O'rtacha: ${o.ortacha} шт | Kichik: ${o.kichik} шт (Berildi: ${o.paid.toLocaleString()} so'm)
                </div>
            </div>
        `;
    });
}

function sendSMS(phone, name, debt) {
    if (debt <= 0) {
        alert(name + " marketining qarzi yo'q!");
        return;
    }
    let msg = `Hormang, ${name}! Sizning tuxum yetkazib berish xizmatidan qarzingiz: ${debt.toLocaleString()} so'm. Iltimos, to'lovni qilishingizni so'raymiz. Rahmat!`;
    window.open(`sms:${phone}?body=${encodeURIComponent(msg)}`, '_blank');
}

function openBarterModal(id) {
    activeMarketForBarter = markets.find(m => m.id == id);
    document.getElementById('barter-market-name').innerText = activeMarketForBarter.name + " (Joriy qarz: " + activeMarketForBarter.debt.toLocaleString() + " so'm)";
    document.getElementById('barter-modal').classList.add('open');
}

function closeBarterModal() {
    document.getElementById('barter-modal').classList.remove('open');
}

function applyBarter() {
    let amount = parseInt(document.getElementById('barter-amount').value) || 0;
    let item = document.getElementById('barter-item').value;
    if (amount <= 0 || !item) {
        alert("Tovar ma'lumotlarini kiriting!");
        return;
    }
    activeMarketForBarter.debt -= amount;
    if (activeMarketForBarter.debt < 0) activeMarketForBarter.debt = 0;
    alert("Tovar muvaffaqiyatli qabul qilindi va qarzdan ayirildi!");
    closeBarterModal();
    renderMarkets();
    updateStats();
}

function openAddMarketModal() {
    document.getElementById('add-market-modal').classList.add('open');
}

function closeAddMarketModal() {
    document.getElementById('add-market-modal').classList.remove('open');
}

function saveNewMarket() {
    let name = document.getElementById('new-name').value;
    let owner = document.getElementById('new-owner').value;
    let phone = document.getElementById('new-phone').value;
    let location = document.getElementById('new-location').value;

    if (!name || !owner) {
        alert("Market nomi va egasini kiriting!");
        return;
    }
    markets.push({ id: markets.length + 1, name, owner, phone, location, debt: 0 });
    alert("Yangi market bazaga saqlandi!");
    closeAddMarketModal();
    populateMarketSelect();
    renderMarkets();
}

function updatePrices() {
    prices.katta = parseInt(document.getElementById('price-katta').value) || 0;
    prices.ortacha = parseInt(document.getElementById('price-ortacha').value) || 0;
    prices.kichik = parseInt(document.getElementById('price-kichik').value) || 0;

    document.getElementById('display-price-katta').innerText = prices.katta.toLocaleString() + " so'm";
    document.getElementById('display-price-ortacha').innerText = prices.ortacha.toLocaleString() + " so'm";
    document.getElementById('display-price-kichik').innerText = prices.kichik.toLocaleString() + " so'm";

    calculateOrder();
}

function updateStockUI() {
    document.getElementById('stock-katta').innerText = stock.katta.toLocaleString();
    document.getElementById('stock-ortacha').innerText = stock.ortacha.toLocaleString();
    document.getElementById('stock-kichik').innerText = stock.kichik.toLocaleString();
}

function updateStats() {
    let totalDebt = markets.reduce((acc, m) => acc + m.debt, 0);
    let todaySales = todayOrders.reduce((acc, o) => acc + o.sum, 0);
    document.getElementById('total-debt').innerText = totalDebt.toLocaleString() + " so'm";
    document.getElementById('today-sales').innerText = todaySales.toLocaleString() + " so'm";
}
