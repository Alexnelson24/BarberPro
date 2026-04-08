const STORAGE_KEYS = {
    USERS: 'barber_users_v7',
    SERVICES: 'barber_services_v7',
    PRODUCTS: 'barber_products_v7',
    SALES: 'barber_sales_v7',
    BOOKINGS: 'barber_bookings_v7',
    ROLE_PERMS: 'barber_role_perms_v7',
    CAJA_SESSIONS: 'barber_caja_sessions_v7',
    TIERS: 'barber_tiers_v7',
    CLIENTS: 'barber_clients_v7',
    CURRENT_USER: 'barber_cur_user_session_v7',
    LOYALTY_SETTINGS: 'barber_loyalty_settings_v7',
    EXPENSES: 'barber_expenses_v7'
};

// --- SUPABASE CONFIGURATION ---
const SUPABASE_URL = 'https://ppxuebdwauxupusncmmu.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBweHVlYmR3YXV4dXB1c25jbW11Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU2MTg1NjAsImV4cCI6MjA5MTE5NDU2MH0.upY1AfTLSb0XEOK8ijbT-QrDBCS46L6lcLah7LCO3jc';
let dbCloud = null;
if (SUPABASE_URL && SUPABASE_URL.startsWith('https://')) {
    dbCloud = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
}

const app = {
    state: {
        tiers: JSON.parse(localStorage.getItem(STORAGE_KEYS.TIERS)) || [
            { id: 1, name: 'Inicial', commission: 30 },
            { id: 2, name: 'Junior', commission: 45 },
            { id: 3, name: 'Master', commission: 60 }
        ],
        users: JSON.parse(localStorage.getItem(STORAGE_KEYS.USERS)) || [
            { id: 1, name: 'Admin Principal', username: 'admin', password: '1234', role: 'admin', enabled: true }
        ],
        clients: JSON.parse(localStorage.getItem(STORAGE_KEYS.CLIENTS)) || [],
        services: JSON.parse(localStorage.getItem(STORAGE_KEYS.SERVICES)) || [
            { id: 101, name: 'Corte Degrade', price: 60, duration: 40 },
            { id: 102, name: 'Perfilado Barba', price: 40, duration: 25 }
        ],
        products: JSON.parse(localStorage.getItem(STORAGE_KEYS.PRODUCTS)) || [
            { id: 201, name: 'Pomada Classic', price: 90, cost: 45, stock: 15 }
        ],
        sales: JSON.parse(localStorage.getItem(STORAGE_KEYS.SALES)) || [],
        expenses: JSON.parse(localStorage.getItem(STORAGE_KEYS.EXPENSES)) || [],
        bookings: JSON.parse(localStorage.getItem(STORAGE_KEYS.BOOKINGS)) || [],
        sessions: JSON.parse(localStorage.getItem(STORAGE_KEYS.CAJA_SESSIONS)) || [],
        currentSession: null,
        currentUser: JSON.parse(localStorage.getItem(STORAGE_KEYS.CURRENT_USER)) || null,
        rolePerms: JSON.parse(localStorage.getItem(STORAGE_KEYS.ROLE_PERMS)) || {
            admin: ['dashboard', 'pos', 'reservas', 'users', 'roles', 'inventory', 'services', 'reports', 'caja', 'clients', 'loyalty'],
            cajera: ['dashboard', 'pos', 'reservas', 'caja', 'clients', 'loyalty'],
            operario: ['dashboard', 'reservas']
        },
        availability: JSON.parse(localStorage.getItem('barber_availability')) || {
            'Monday': ['07:00', '08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00', '21:00', '22:00', '23:00'],
            'Tuesday': ['07:00', '08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00', '21:00', '22:00', '23:00'],
            'Wednesday': ['07:00', '08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00', '21:00', '22:00', '23:00'],
            'Thursday': ['07:00', '08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00', '21:00', '22:00', '23:00'],
            'Friday': ['07:00', '08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00', '21:00', '22:00', '23:00'],
            'Saturday': ['07:00', '08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00', '21:00', '22:00', '23:00'],
            'Sunday': []
        },
        calendar: { month: new Date().getMonth(), year: new Date().getFullYear() },
        cart: [],
        commissions: { 'Inicial': 0.30, 'Junior': 0.45, 'Master': 0.60 },
        loyaltySettings: JSON.parse(localStorage.getItem(STORAGE_KEYS.LOYALTY_SETTINGS)) || {
            spendRatio: 10, // 10 Bs = 1 Pt
            pointValue: 1   // 1 Pt = 1 Bs
        },
        bookingSettings: JSON.parse(localStorage.getItem('barber_booking_settings')) || {
            publicEnabled: false
        },
        isPublicMode: new URLSearchParams(window.location.search).get('public') === 'true'
    },

    save: async () => {
        Object.keys(app.state).forEach(key => {
            if (STORAGE_KEYS[key.toUpperCase()]) {
                localStorage.setItem(STORAGE_KEYS[key.toUpperCase()], JSON.stringify(app.state[key]));
            }
        });

        // --- CLOUD SYNC ---
        if (dbCloud) {
            console.log("Sincronizando con la nube...");
            try {
                const { error } = await dbCloud.from('config').upsert({ key: 'app_state', value: app.state });
                if (error) throw error;
            } catch (e) {
                console.error("Error en Sync:", e);
            }
        }
    },

    init: async () => {
        const syncText = document.getElementById('sync-text');
        // 1. Try to load from Cloud first if exists
        if (dbCloud) {
            if (syncText) syncText.textContent = 'CONECTADO NUBE';
            try {
                const { data } = await dbCloud.from('config').select('value').eq('key', 'app_state').single();
                if (data && data.value) {
                    app.state = { ...app.state, ...data.value };
                    console.log("Datos cargados desde la nube.");
                    if (syncText) syncText.innerHTML = '<span style="color:var(--success)">NUBE SINCRONIZADA</span>';
                }
            } catch (e) { 
                console.log("Iniciando con datos locales...");
                if (syncText) syncText.textContent = 'ERROR NUBE / USANDO LOCAL';
            }
        }

        // Permission Repair for existing sessions
        if (app.state.rolePerms.admin && !app.state.rolePerms.admin.includes('clients')) {
            app.state.rolePerms.admin.push('clients', 'loyalty');
            app.state.rolePerms.cajera.push('clients', 'loyalty');
            app.save();
        }
        app.checkSession();
        app.checkAuth();
        app.bindEvents();
        app.updateDashboard();
        console.log("BarberPro V3 Safety Ready");
    },

    // --- SUBVIEWS ---
    showSubView: (id) => {
        document.querySelectorAll('.res-subview').forEach(v => v.classList.add('hidden'));
        document.getElementById('subview-' + id).classList.remove('hidden');
        if (id === 'res-calendar') app.renderCalendar();
        if (id === 'res-config') {
            app.renderAvailabilityConfig();
            app.updatePublicLinkUI();
        }
    },

    // --- CALENDAR LOGIC ---
    renderCalendar: () => {
        const grid = document.getElementById('calendar-grid');
        const monthTitle = document.getElementById('calendar-month-title');
        if (!grid) return;

        const { month, year } = app.state.calendar;
        const firstDay = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();

        monthTitle.innerText = new Intl.DateTimeFormat('es-ES', { month: 'long', year: 'numeric' }).format(new Date(year, month));

        // Preserve headers
        grid.innerHTML = '<div class="cal-day-name">Dom</div><div class="cal-day-name">Lun</div><div class="cal-day-name">Mar</div><div class="cal-day-name">Mie</div><div class="cal-day-name">Jue</div><div class="cal-day-name">Vie</div><div class="cal-day-name">Sab</div>';

        // Add empty slots
        for (let i = 0; i < firstDay; i++) grid.innerHTML += '<div class="cal-day empty"></div>';

        const today = new Date().toISOString().split('T')[0];

        for (let d = 1; d <= daysInMonth; d++) {
            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
            const hasBooking = app.state.bookings.some(b => b.date === dateStr);
            const isToday = dateStr === today ? 'today' : '';

            grid.innerHTML += `
                <div class="cal-day ${isToday} ${hasBooking ? 'has-booking' : ''}" onclick="app.selectCalendarDate('${dateStr}')">
                    <span class="num">${d}</span>
                    ${hasBooking ? '<div class="cal-booking-dot"></div>' : ''}
                </div>
            `;
        }
        app.renderBookings();
    },

    prevMonth: () => { app.state.calendar.month--; if (app.state.calendar.month < 0) { app.state.calendar.month = 11; app.state.calendar.year--; } app.renderCalendar(); },
    nextMonth: () => { app.state.calendar.month++; if (app.state.calendar.month > 11) { app.state.calendar.month = 0; app.state.calendar.year++; } app.renderCalendar(); },

    selectCalendarDate: (date) => {
        document.querySelectorAll('.cal-day').forEach(d => d.classList.remove('active'));
        // Local highlight logic would go here if needed...
        const filtered = app.state.bookings.filter(b => b.date === date);
        app.renderBookings(filtered);
    },

    // --- AVAILABILITY CONFIG ---
    renderAvailabilityConfig: () => {
        const day = document.getElementById('config-day-select').value;
        const container = document.getElementById('config-slots-container');
        const activeSlots = app.state.availability[day] || [];

        const allSlots = ['07:00', '08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00', '21:00', '22:00', '23:00'];

        container.innerHTML = allSlots.map(s => `
            <div class="slot-toggle ${activeSlots.includes(s) ? 'active' : ''}">
                <input type="checkbox" ${activeSlots.includes(s) ? 'checked' : ''} onchange="app.toggleSlot('${day}', '${s}')">
                <span>${s}</span>
            </div>
        `).join('');

        app.renderAvailabilityPreview();
    },

    toggleSlot: (day, slot) => {
        let active = app.state.availability[day];
        if (active.includes(slot)) {
            app.state.availability[day] = active.filter(s => s !== slot);
        } else {
            active.push(slot);
            active.sort();
        }
        localStorage.setItem('barber_availability', JSON.stringify(app.state.availability));
        app.renderAvailabilityConfig();
    },

    renderAvailabilityPreview: () => {
        const list = document.getElementById('config-preview-list');
        list.innerHTML = Object.keys(app.state.availability).map(day => {
            const slots = app.state.availability[day];
            return slots.length > 0 ? `
                <div style="margin-bottom:10px;">
                    <strong style="color:var(--primary)">${day}:</strong> ${slots.join(', ')}
                </div>
            ` : '';
        }).join('');
    },

    // ... rest of the logic ...

    checkSession: () => {
        const active = app.state.sessions.find(s => s.status === 'OPEN');
        if (active) {
            app.state.currentSession = active;
            app.toggleCajaStatus(true);
        } else {
            app.state.currentSession = null;
            app.toggleCajaStatus(false);
        }
    },

    toggleCajaStatus: (isOpen) => {
        const dot = document.getElementById('caja-dot');
        const text = document.getElementById('caja-text');
        if (!dot || !text) return;
        if (isOpen) {
            dot.className = 'status-dot online';
            text.textContent = 'Caja Abierta';
            document.getElementById('caja-open-card').classList.add('hidden');
            document.getElementById('caja-close-card').classList.remove('hidden');
            app.updateCajaSummary();
        } else {
            dot.className = 'status-dot offline';
            text.textContent = 'Caja Cerrada';
            document.getElementById('caja-open-card').classList.remove('hidden');
            document.getElementById('caja-close-card').classList.add('hidden');
        }
        app.renderCajaHistory();
    },

    login: () => {
        const u = document.getElementById('login-user').value.toLowerCase().trim();
        const p = document.getElementById('login-pass').value;
        const user = app.state.users.find(x => x.username === u && x.password === p && x.enabled);
        if (user) {
            app.state.currentUser = user;
            localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));
            app.checkAuth();
        } else alert("Credenciales incorrectas o usuario deshabilitado");
    },

    checkAuth: () => {
        if (app.state.isPublicMode) {
            document.getElementById('login-screen').classList.add('hidden');
            document.querySelector('.sidebar').classList.add('hidden');
            document.querySelector('.main-content').style.marginLeft = '0';
            document.getElementById('public-booking-screen').classList.remove('hidden');
            document.querySelectorAll('.view-section').forEach(s => s.classList.add('hidden'));
            app.renderPublicBooking();
            return;
        }

        const screen = document.getElementById('login-screen');
        if (!app.state.currentUser) {
            screen.classList.remove('hidden');
        } else {
            screen.classList.add('hidden');
            app.applyPermissions();
            app.updateUserUI();
            app.showSection('dashboard');
        }
    },

    logout: () => {
        if (confirm("¿Está seguro que desea cerrar sesión?")) {
            localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
            location.reload();
        }
    },

    applyPermissions: () => {
        const role = app.state.currentUser.role;
        const allowed = app.state.rolePerms[role] || [];
        document.querySelectorAll('.nav-item').forEach(btn => {
            const id = btn.getAttribute('data-id');
            if (id === 'dashboard' || allowed.includes(id)) btn.classList.remove('hidden');
            else btn.classList.add('hidden');
        });
    },

    updateUserUI: () => {
        const u = app.state.currentUser;
        document.getElementById('current-user-name').textContent = u.name;
        document.getElementById('current-user-initial').textContent = u.name.charAt(0);
        document.getElementById('current-user-role').textContent = u.role.toUpperCase();
    },

    bindEvents: () => {
        document.querySelectorAll('.nav-item').forEach(item => {
            item.addEventListener('click', (e) => {
                const id = e.currentTarget.getAttribute('data-id');
                const allowed = app.state.rolePerms[app.state.currentUser.role] || [];
                if (id !== 'dashboard' && !allowed.includes(id)) return;
                document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
                e.currentTarget.classList.add('active');
            });
        });
    },

    showSection: (id) => {
        // SECURITY GUARD
        const allowed = app.state.rolePerms[app.state.currentUser.role] || [];
        if (id !== 'dashboard' && id !== 'caja' && !allowed.includes(id)) {
            alert("No tiene permisos para esta sección.");
            return;
        }

        // CAJA ACCESS GUARD
        if (id === 'caja' && app.state.currentUser.role === 'operario') {
            alert("Acceso exclusivo para Cajeras o Administradores.");
            return;
        }

        document.querySelectorAll('.view-section').forEach(s => s.classList.add('hidden'));
        const target = document.getElementById(id);
        if (target) {
            target.classList.remove('hidden');
            document.getElementById('view-title').textContent = id.toUpperCase();
        }

        if (id === 'users') { app.renderUsers(); app.renderTiers(); }
        if (id === 'roles') app.renderRolePerms();
        if (id === 'services') app.renderServices();
        if (id === 'inventory') app.renderInventory();
        if (id === 'reports') {
            app.showReportSubView(app.state.currentUser.role === 'admin' ? 'bi' : 'daily');
        }
        if (id === 'loyalty') {
            app.showLoyaltySubView('stats');
            const btn = document.getElementById('btn-loyalty-config');
            if (btn) btn.style.display = app.state.currentUser.role === 'admin' ? 'block' : 'none';
        }
        if (id === 'clients') app.renderClients();
        if (id === 'reservas') { app.showSubView('res-calendar'); const btn = document.getElementById('btn-config-dispo'); if (btn) btn.style.display = app.state.currentUser.role === 'admin' ? 'block' : 'none'; }
        if (id === 'pos') app.refreshPOSSelects();
        if (id === 'dashboard') app.updateDashboard();
    },

    updateDashboard: () => {
        const today = new Date().toISOString().split('T')[0];
        const daySales = app.state.sales.filter(s => s.date.startsWith(today));
        const services = daySales.flatMap(s => s.items.filter(it => it.type === 's'));
        const products = daySales.flatMap(s => s.items.filter(it => it.type === 'p'));

        const totalS = services.reduce((a, b) => a + b.price, 0);
        const totalP = products.reduce((a, b) => a + b.price, 0);

        document.getElementById('dash-sales').textContent = `Bs. ${(totalS + totalP).toFixed(2)}`;
        document.getElementById('dash-sales-count').textContent = `${daySales.length} transacciones hoy`;
        document.getElementById('dash-services').textContent = services.length;
        document.getElementById('dash-services-bs').textContent = `Bs. ${totalS.toFixed(2)}`;
        document.getElementById('dash-products').textContent = products.length;
        document.getElementById('dash-products-bs').textContent = `Bs. ${totalP.toFixed(2)}`;

        const cajaVal = app.state.currentSession ? (app.state.currentSession.initial_amount + (totalS + totalP)) : 0;
        document.getElementById('dash-caja').textContent = `Bs. ${cajaVal.toFixed(2)}`;

        const bodyS = document.querySelector('#table-dash-services tbody');
        bodyS.innerHTML = daySales.flatMap(s => s.items.filter(it => it.type === 's').map(it => ({ ...it, sale: s })))
            .slice(-5).reverse().map(it => {
                const disc = it.sale.pointsRedeemed > 0 ? `<div style="font-size:0.6rem; color:var(--primary);">Puntos:-${(it.sale.pointsRedeemed * app.state.loyaltySettings.pointValue).toFixed(2)}</div>` : '';
                return `<tr><td>${it.timestamp || '--:--'}</td><td>${it.name}</td><td>Bs. ${it.price.toFixed(2)} ${disc}</td><td>${it.staff}</td></tr>`;
            }).join('') || '<tr><td colspan="4">Sin servicios hoy</td></tr>';

        const bodyP = document.querySelector('#table-dash-products tbody');
        bodyP.innerHTML = daySales.flatMap(s => s.items.filter(it => it.type === 'p').map(it => ({ ...it, sale: s })))
            .slice(-5).reverse().map(it => {
                const disc = it.sale.pointsRedeemed > 0 ? `<div style="font-size:0.6rem; color:var(--primary);">Pts:-${(it.sale.pointsRedeemed * app.state.loyaltySettings.pointValue).toFixed(2)}</div>` : '';
                return `<tr><td>${it.timestamp || '--:--'}</td><td>${it.name}</td><td>Bs. ${it.price.toFixed(2)} ${disc}</td></tr>`;
            }).join('') || '<tr><td colspan="3">Sin ventas de productos</td></tr>';
    },

    openCaja: () => {
        if (app.state.currentUser.role === 'operario') return alert("Solo cajeras o administradores pueden abrir caja.");
        const val = document.getElementById('caja-monto-inicial').value;
        const m = parseFloat(val) || 0;
        const session = { id: Date.now(), initial_amount: m, open_time: new Date().toISOString(), status: 'OPEN', user: app.state.currentUser.name, userId: app.state.currentUser.id };
        app.state.sessions.push(session);
        app.save();
        app.checkSession();
        app.showSection('dashboard');
    },

    closeCaja: () => {
        const s = app.state.currentSession;
        if (!s) return;
        if (!confirm("¿Está seguro que desea CERRAR LA CAJA? Esto finalizará el turno actual.")) return;

        const sessionSales = app.state.sales.filter(sl => sl.sessionId === s.id);
        const totalSales = sessionSales.reduce((a, b) => a + b.total, 0);
        s.close_time = new Date().toISOString();
        s.total_sales = totalSales;
        s.final_amount = s.initial_amount + totalSales;
        s.status = 'CLOSED';
        app.save();
        app.checkSession();
        alert("Caja cerrada correctamente.");
    },

    updateCajaSummary: () => {
        const s = app.state.currentSession;
        if (!s) return;
        const totalSales = app.state.sales.filter(sl => sl.sessionId === s.id).reduce((a, b) => a + b.total, 0);
        const totalExpenses = app.state.expenses.filter(e => e.sessionId === s.id).reduce((a, b) => a + b.amount, 0);

        document.getElementById('close-ini').textContent = `Bs. ${s.initial_amount.toFixed(2)}`;
        document.getElementById('close-sales').textContent = `Bs. ${totalSales.toFixed(2)}`;
        document.getElementById('close-expenses').textContent = `Bs. ${totalExpenses.toFixed(2)}`;
        document.getElementById('close-total').textContent = `Bs. ${(s.initial_amount + totalSales - totalExpenses).toFixed(2)}`;
    },

    renderCajaHistory: () => {
        const tbody = document.querySelector('#table-caja-history tbody');
        if (!tbody) return;
        tbody.innerHTML = app.state.sessions.slice(-5).reverse().map(s => `
            <tr>
                <td>${new Date(s.open_time).toLocaleDateString()}</td>
                <td>${s.close_time ? new Date(s.close_time).toLocaleTimeString() : 'En curso'}</td>
                <td>Bs. ${s.initial_amount}</td>
                <td>Bs. ${s.total_sales || 0}</td>
                <td><span class="badge ${s.status === 'OPEN' ? 'badge-success' : 'badge-warning'}">${s.status}</span></td>
            </tr>
        `).join('') || '<tr><td colspan="5">No hay historial de caja</td></tr>';
    },

    refreshPOSSelects: () => {
        const iS = document.getElementById('pos-item-select');
        const bS = document.getElementById('pos-barber-select');
        if (!iS || !bS) return;

        iS.innerHTML = '<option value="">Seleccione ítem...</option>' +
            app.state.services.map(s => `<option value="s_${s.id}">${s.name} (Bs. ${s.price})</option>`).join('') +
            app.state.products.map(p => `<option value="p_${p.id}">${p.name} (Bs. ${p.price}) [Stock: ${p.stock}]</option>`).join('');

        bS.innerHTML = app.state.users.filter(u => u.role === 'operario' || u.role === 'admin')
            .map(u => `<option value="${u.id}">${u.name} [${u.tier}]</option>`).join('');

        iS.onchange = () => {
            const isProduct = iS.value.startsWith('p_');
            const bLabel = bS.previousElementSibling;
            if (isProduct) {
                bS.classList.add('hidden');
                if (bLabel) bLabel.classList.add('hidden');
            } else {
                bS.classList.remove('hidden');
                if (bLabel) bLabel.classList.remove('hidden');
            }
        };
    },

    addToCart: () => {
        if (!app.state.currentSession) return alert("CAJA CERRADA: Debe abrir la caja para vender.");
        const itemVal = document.getElementById('pos-item-select').value;
        const staffId = document.getElementById('pos-barber-select').value;
        if (!itemVal) return alert("Seleccione un ítem");

        const [type, id] = itemVal.split('_');
        const item = type === 's' ? app.state.services.find(x => x.id == id) : app.state.products.find(x => x.id == id);

        if (type === 'p' && item.stock <= 0) return alert("Stock insuficiente");

        let cartItem = { ...item, type, timestamp: new Date().toLocaleTimeString() };

        if (type === 's') {
            if (!staffId) return alert("Debe asignar un barbero.");
            const staff = app.state.users.find(u => u.id == staffId);
            cartItem.staff = staff.name;
            cartItem.staffId = staff.id;
            cartItem.tier = staff.tier;
        } else {
            cartItem.staff = 'Venta Directa';
            cartItem.staffId = null;
        }

        app.state.cart.push(cartItem);
        app.renderCart();
    },

    redeemPoints: () => {
        const pts = parseInt(document.getElementById('pos-available-points').textContent);
        if (pts <= 0) return alert("Sin puntos suficientes.");
        const total = app.state.cart.reduce((a, b) => a + b.price, 0);
        const settings = app.state.loyaltySettings;

        // Calculate Bs value of points
        const bsValue = pts * settings.pointValue;
        const canUseVal = Math.min(bsValue, Math.floor(total));
        const pointsNeeded = Math.ceil(canUseVal / settings.pointValue);

        if (confirm(`¿Deseas canjear ${pointsNeeded} puntos por un descuento de Bs. ${canUseVal}?`)) {
            app.state.redeemingPoints = pointsNeeded;
            app.state.redeemedBsValue = canUseVal;
            app.renderCart();
        }
    },

    renderCart: () => {
        const list = document.getElementById('pos-cart-list');
        const tot = app.state.cart.reduce((a, b) => a + b.price, 0);

        // Auto-validate discount if points are selected
        if (app.state.redeemingPoints > 0) {
            const settings = app.state.loyaltySettings;
            const maxVal = Math.min(app.state.redeemingPoints * settings.pointValue, Math.floor(tot));
            app.state.redeemedBsValue = maxVal;
        }

        const finalTot = tot - (app.state.redeemedBsValue || 0);

        list.innerHTML = app.state.cart.map((it, idx) => `
            <div style="display:flex; justify-content:space-between; margin-bottom:12px; background: rgba(255,255,255,0.03); padding:10px; border-radius:8px;">
                <div><div style="font-weight:700;">${it.name}</div><div style="font-size:0.75rem; color:var(--text-muted);">Staff: ${it.staff}</div></div>
                <div style="text-align:right;"><div>Bs. ${it.price.toFixed(2)}</div>
                <i class="fas fa-times" onclick="app.state.cart.splice(${idx},1);app.renderCart();" style="color:var(--danger); cursor:pointer;"></i></div>
            </div>
        `).join('') + (app.state.redeemingPoints > 0 ? `
            <div style="display:flex; justify-content:space-between; margin-bottom:12px; color:var(--primary); font-weight:700; border-top:1px dashed var(--border); padding-top:10px;">
                <span>Descuento (${app.state.redeemingPoints} pts):</span><span>- Bs. ${app.state.redeemedBsValue}</span>
            </div>
        ` : '');

        document.getElementById('pos-total').textContent = `Bs. ${Math.max(0, finalTot).toFixed(2)}`;
    },

    processSale: () => {
        if (!app.state.currentSession) return alert("Caja cerrada.");
        if (!app.state.cart.length) return;
        const total = app.state.cart.reduce((a, b) => a + b.price, 0);
        const finalTotal = total - (app.state.redeemedBsValue || 0);

        const saleItems = app.state.cart.map(it => {
            const tierObj = app.state.tiers.find(t => t.name === it.tier);
            const commRate = tierObj ? (tierObj.commission / 100) : 0;
            return { ...it, commission: it.type === 's' ? (it.price * commRate) : 0 };
        });

        const sale = {
            id: Date.now(),
            sessionId: app.state.currentSession.id,
            date: new Date().toISOString(),
            items: saleItems,
            total: finalTotal,
            staff: app.state.currentUser.name,
            cajeraId: app.state.currentUser.id,
            clientName: document.getElementById('pos-cli-name').value || 'General',
            clientPhone: document.getElementById('pos-cli-phone').value || '',
            pointsRedeemed: app.state.redeemingPoints || 0
        };

        // Award/Subtract Points based on CURRENT settings
        if (sale.clientPhone) {
            let client = app.state.clients.find(c => c.phone === sale.clientPhone);
            const earned = Math.floor(finalTotal / app.state.loyaltySettings.spendRatio);
            if (!client) {
                app.state.clients.push({ name: sale.clientName, phone: sale.clientPhone, points: earned, email: '' });
            } else {
                client.points = (client.points - sale.pointsRedeemed) + earned;
                client.name = sale.clientName;
            }
        }

        if (!confirm(`Confirmar registro de venta por Bs. ${finalTotal.toFixed(2)}?`)) return;

        app.state.sales.push(sale);

        // Finalize inventory and reset
        app.state.cart.forEach(it => { if (it.type === 'p') { const p = app.state.products.find(x => x.id == it.id); if (p) p.stock--; } });

        app.state.cart = [];
        app.state.redeemingPoints = 0;
        app.state.redeemedBsValue = 0;
        app.save();
        app.renderCart();
        app.updateDashboard();
        app.updateCajaSummary();
        alert("Venta registrada con éxito.");
    },

    renderRolePerms: () => {
        const container = document.getElementById('roles-permissions-container');
        if (!container) return;

        const sections = [
            { id: 'pos', name: 'Módulo de Ventas (POS)', icon: 'fas fa-cash-register' },
            { id: 'reservas', name: 'Gestión de Reservas', icon: 'fas fa-calendar-check' },
            { id: 'users', name: 'Administración de Personal', icon: 'fas fa-users-cog' },
            { id: 'inventory', name: 'Control de Inventarios', icon: 'fas fa-box-open' },
            { id: 'services', name: 'Catálogo de Servicios', icon: 'fas fa-cut' },
            { id: 'reports', name: 'Reportes y Estadísticas', icon: 'fas fa-chart-bar' },
            { id: 'clients', name: 'Gestión de Clientes', icon: 'fas fa-user-friends' },
            { id: 'loyalty', name: 'Fidelización y Puntos', icon: 'fas fa-star' },
            { id: 'roles', name: 'Configuración de Roles', icon: 'fas fa-user-shield' }
        ];

        container.innerHTML = Object.keys(app.state.rolePerms).map(role => `
            <div class="perm-card">
                <div style="display:flex; align-items:center; gap:15px; margin-bottom:24px; padding-bottom:15px; border-bottom:1px solid var(--border);">
                    <div class="user-avatar" style="width:40px; height:40px; border-radius:10px; background:var(--accent); color:var(--bg-main); font-size:1.2rem;">
                        <i class="fas ${role === 'admin' ? 'fa-crown' : (role === 'cajera' ? 'fa-coins' : 'fa-scissors')}"></i>
                    </div>
                    <div>
                        <h4 style="text-transform:capitalize; color:var(--primary);">${role}</h4>
                        <span style="font-size:0.7rem; color:var(--text-muted);">Niveles de Acceso</span>
                    </div>
                </div>
                ${sections.map(s => `
                    <div class="perm-item">
                        <div class="perm-info">
                            <i class="${s.icon}"></i>
                            <span style="font-size:0.85rem;">${s.name}</span>
                        </div>
                        <label class="switch-container">
                            <input type="checkbox" ${app.state.rolePerms[role].includes(s.id) ? 'checked' : ''} 
                                onchange="app.togglePerm('${role}', '${s.id}')">
                            <span class="slider"></span>
                        </label>
                    </div>
                `).join('')}
            </div>
        `).join('');
    },

    togglePerm: (role, section) => {
        if (role === 'admin' && section === 'roles') return alert("No puedes quitarle este permiso al Administrador.");
        if (!confirm(`¿Desea cambiar los permisos de ${section.toUpperCase()} para el rol ${role.toUpperCase()}?`)) return;
        const perms = app.state.rolePerms[role];
        const idx = perms.indexOf(section);
        if (idx > -1) perms.splice(idx, 1); else perms.push(section);
        app.save();
        app.applyPermissions();
        app.renderRolePerms(); // Refresh UI
    },

    renderTiers: () => {
        const body = document.getElementById('tiers-table-body');
        if (!body) return;
        const isAdmin = app.state.currentUser.role === 'admin';
        body.innerHTML = app.state.tiers.map(t => `
            <tr>
                <td>${t.name}</td>
                <td>${t.commission}%</td>
                <td>${isAdmin ? `<button class="btn btn-danger" onclick="app.deleteItem('tiers', ${t.id})">QUITAR</button>` : '--'}</td>
            </tr>
        `).join('') || '<tr><td colspan="3">Defina niveles de comisión</td></tr>';
    },

    renderUsers: () => {
        const isAdmin = app.state.currentUser.role === 'admin';
        document.getElementById('users-table-body').innerHTML = app.state.users.map(u => `
            <tr>
                <td>${u.name}</td>
                <td>${u.role}</td>
                <td>${u.tier || '--'}</td>
                <td>${isAdmin ? `<button class="btn btn-danger" onclick="app.deleteItem('users', ${u.id})">ELIMINAR</button>` : '--'}</td>
            </tr>
        `).join('');
    },

    renderServices: () => {
        const isAdmin = app.state.currentUser.role === 'admin';
        document.getElementById('services-table-body').innerHTML = app.state.services.map(s => `
            <tr>
                <td>${s.name}</td>
                <td>${s.duration}m</td>
                <td>Bs. ${s.price}</td>
                <td>${isAdmin ? `<button class="btn btn-danger" onclick="app.deleteItem('services', ${s.id})">X</button>` : '--'}</td>
            </tr>
        `).join('');
    },

    renderInventory: () => {
        const isAdmin = app.state.currentUser.role === 'admin';
        document.getElementById('inventory-table-body').innerHTML = app.state.products.map(p => `
            <tr>
                <td>${p.name}</td>
                <td>${p.stock}</td>
                <td>Bs. ${p.price}</td>
                <td>${isAdmin ? `<button class="btn btn-danger" onclick="app.deleteItem('products', ${p.id})">X</button>` : '--'}</td>
            </tr>
        `).join('');
    },

    renderBookings: (filterData) => {
        const body = document.getElementById('reservas-table-body');
        if (!body) return;
        const data = filterData || app.state.bookings;
        body.innerHTML = data.map(b => `
            <tr>
                <td>${b.date} ${b.time}</td>
                <td>${b.client}</td>
                <td>${b.serviceName}</td>
                <td><span class="badge ${b.status === 'pendiente' ? 'badge-warning' : 'badge-success'}">${b.status}</span></td>
                <td>
                    ${b.status === 'pendiente' ?
                `<button class="btn btn-primary" style="padding:4px 12px; font-size:0.75rem;" onclick="app.attendBooking(${b.id})">ATENDER</button>` :
                '<span style="color:var(--success); font-weight:700; font-size:0.7rem;"><i class="fas fa-check"></i> LISTO</span>'
            }
                </td>
            </tr>
        `).join('') || '<tr><td colspan="5">No hay reservas para esta selección</td></tr>';
    },

    attendBooking: (id) => {
        const b = app.state.bookings.find(x => x.id === id);
        if (b) {
            b.status = 'atendido';
            app.showSection('pos');
            app.save();
        }
    },

    // --- PUBLIC BOOKING LOGIC ---
    togglePublicAccess: () => {
        const checked = document.getElementById('public-booking-toggle').checked;
        app.state.bookingSettings.publicEnabled = checked;
        localStorage.setItem('barber_booking_settings', JSON.stringify(app.state.bookingSettings));
        app.updatePublicLinkUI();
    },

    updatePublicLinkUI: () => {
        const container = document.getElementById('public-link-container');
        const text = document.getElementById('public-url-text');
        const toggle = document.getElementById('public-booking-toggle');
        if (!container) return;

        if (app.state.bookingSettings.publicEnabled) {
            container.classList.remove('hidden');
            const url = window.location.origin + window.location.pathname + '?public=true';
            text.textContent = url;
            if (toggle) toggle.checked = true;
        } else {
            container.classList.add('hidden');
            if (toggle) toggle.checked = false;
        }
    },

    copyPublicLink: () => {
        const text = document.getElementById('public-url-text').textContent;
        navigator.clipboard.writeText(text).then(() => alert("Link copiado al portapapeles"));
    },

    renderPublicBooking: () => {
        const srvSelect = document.getElementById('pb-srv');
        const dateInput = document.getElementById('pb-date');
        const today = new Date().toISOString().split('T')[0];
        dateInput.min = today;
        dateInput.value = today;

        srvSelect.innerHTML = app.state.services.map(s => `<option>${s.name}</option>`).join('');
        app.updatePublicSlots();
    },

    updatePublicSlots: () => {
        const dateVal = document.getElementById('pb-date').value;
        const timeSelect = document.getElementById('pb-time');
        if (!dateVal) return;

        const dateObj = new Date(dateVal + 'T00:00:00');
        const dayName = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][dateObj.getDay()];
        const enabledSlots = app.state.availability[dayName] || [];

        const booked = app.state.bookings.filter(b => b.date === dateVal).map(b => b.time);
        const available = enabledSlots.filter(s => !booked.includes(s));

        if (available.length === 0) {
            timeSelect.innerHTML = '<option value="">SIN TURNOS DISPONIBLES</option>';
        } else {
            timeSelect.innerHTML = available.map(s => `<option value="${s}">${s}</option>`).join('');
        }
    },

    submitPublicBooking: () => {
        const name = document.getElementById('pb-name').value;
        const phone = document.getElementById('pb-phone').value;
        const date = document.getElementById('pb-date').value;
        const time = document.getElementById('pb-time').value;
        const srv = document.getElementById('pb-srv').value;

        if (!name || !phone || !time) return alert("Por favor complete todos los campos.");

        app.state.bookings.push({ id: Date.now(), client: `${name} (${phone})`, date, time, serviceName: srv, status: 'pendiente' });
        app.save();

        // WhatsApp Notification
        const text = `Hola! Vengo de la App BarberPro. Confirmar cita para ${name} el día ${date} a las ${time} para el servicio: ${srv}.`;
        const waLink = `https://wa.me/591${phone}?text=${encodeURIComponent(text)}`;

        document.getElementById('public-booking-form').classList.add('hidden');
        document.getElementById('public-booking-success').classList.remove('hidden');

        // Delay slightly for UX before opening WhatsApp
        setTimeout(() => { if (confirm("¿Deseas enviar confirmación por WhatsApp?")) window.open(waLink, '_blank'); }, 1000);
    },

    save: () => {
        localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(app.state.users));
        localStorage.setItem(STORAGE_KEYS.SERVICES, JSON.stringify(app.state.services));
        localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(app.state.products));
        localStorage.setItem(STORAGE_KEYS.SALES, JSON.stringify(app.state.sales));
        localStorage.setItem(STORAGE_KEYS.BOOKINGS, JSON.stringify(app.state.bookings));
        localStorage.setItem(STORAGE_KEYS.CAJA_SESSIONS, JSON.stringify(app.state.sessions));
        localStorage.setItem(STORAGE_KEYS.ROLE_PERMS, JSON.stringify(app.state.rolePerms));
        localStorage.setItem(STORAGE_KEYS.TIERS, JSON.stringify(app.state.tiers));
        localStorage.setItem(STORAGE_KEYS.CLIENTS, JSON.stringify(app.state.clients));
        localStorage.setItem(STORAGE_KEYS.LOYALTY_SETTINGS, JSON.stringify(app.state.loyaltySettings));
    },

    // --- LOYALTY ---
    showLoyaltySubView: (id) => {
        document.getElementById('loyalty-sub-stats').classList.toggle('hidden', id !== 'stats');
        document.getElementById('loyalty-sub-config').classList.toggle('hidden', id !== 'config');
        if (id === 'stats') {
            app.renderLoyaltyRank();
            const s = app.state.loyaltySettings;
            document.getElementById('loyalty-policy-desc').innerHTML = `
                <p>Regla Actual: Ganas <strong>1 punto</strong> por cada <strong>Bs. ${s.spendRatio}</strong>.</p>
                <p>Valor de Canje: Cada punto equivale a <strong>Bs. ${s.pointValue}</strong>.</p>
            `;
        }
        if (id === 'config') {
            document.getElementById('loyalty-config-spend').value = app.state.loyaltySettings.spendRatio;
            document.getElementById('loyalty-config-value').value = app.state.loyaltySettings.pointValue;
        }
    },

    saveLoyaltySettings: () => {
        const ratio = parseFloat(document.getElementById('loyalty-config-spend').value);
        const val = parseFloat(document.getElementById('loyalty-config-value').value);
        if (ratio <= 0 || val <= 0) return alert("Valores deben ser mayores a cero.");

        app.state.loyaltySettings = { spendRatio: ratio, pointValue: val };
        app.save();
        alert("Configuración de fidelización actualizada. Se aplicará a todas las ventas desde ahora.");
        app.showLoyaltySubView('stats');
    },

    searchClientLoyalty: () => {
        const phone = document.getElementById('loyalty-search').value;
        const res = document.getElementById('loyalty-result');
        const client = app.state.clients.find(c => c.phone === phone);
        if (client) {
            res.innerHTML = `
                <h2 style="color:var(--primary); font-size:3rem;">${client.points}</h2>
                <h4>Puntos para ${client.name}</h4>
                <p style="margin-top:15px; color:var(--success);">Status: Cliente Frecuente</p>
            `;
        } else {
            res.innerHTML = '<p style="color:var(--danger);">Cliente no encontrado.</p>';
        }
    },

    renderLoyaltyRank: () => {
        const body = document.getElementById('loyalty-table-body');
        const sorted = [...app.state.clients].sort((a, b) => b.points - a.points).slice(0, 10);
        body.innerHTML = sorted.map(c => `
            <tr><td>${c.name}</td><td>${c.phone}</td><td><span class="badge badge-success">${c.points} pts</span></td></tr>
        `).join('') || '<tr><td colspan="3">Sin clientes registrados aún</td></tr>';
    },

    // --- POS LOYALTY INTEGRATION ---
    updateClientDatalist: () => {
        const input = document.getElementById('pos-cli-name').value.toLowerCase();
        const list = document.getElementById('pos-clients-list');
        if (!list) return;

        // Filter clients and show suggestions
        const matches = app.state.clients.filter(c => c.name.toLowerCase().includes(input));
        list.innerHTML = matches.map(c => `<option value="${c.name}">`).join('');
    },

    checkClientByName: () => {
        const name = document.getElementById('pos-cli-name').value;
        const info = document.getElementById('pos-loyalty-info');
        const phoneInp = document.getElementById('pos-cli-phone');

        const client = app.state.clients.find(c => c.name.toLowerCase() === name.toLowerCase());
        if (client) {
            phoneInp.value = client.phone;
            info.classList.remove('hidden');
            document.getElementById('pos-available-points').textContent = client.points;
        } else {
            info.classList.add('hidden');
            phoneInp.value = '';
        }
    },

    redeemPoints: () => {
        const pts = parseInt(document.getElementById('pos-available-points').textContent);
        if (pts <= 0) return alert("Sin puntos suficientes.");
        const total = app.state.cart.reduce((a, b) => a + b.price, 0);
        const canUse = Math.min(pts, Math.floor(total));
        if (confirm(`¿Deseas canjear ${canUse} puntos por un descuento de Bs. ${canUse}?`)) {
            app.state.redeemingPoints = canUse;
            app.renderCart();
        }
    },

    renderClients: () => {
        const body = document.getElementById('clients-table-body');
        if (!body) return;
        const isAdmin = app.state.currentUser.role === 'admin';

        body.innerHTML = app.state.clients.map(c => {
            const hasSales = app.state.sales.some(s => s.clientPhone === c.phone);
            let actions = '';
            if (isAdmin) {
                actions = `
                    <button class="btn btn-primary" style="padding:4px 8px; font-size:0.7rem; background:#333;" onclick="app.editClient('${c.phone}')">EDITAR</button>
                    ${!hasSales ? `<button class="btn btn-danger" style="padding:4px 8px; font-size:0.7rem;" onclick="app.deleteItem('clients', '${c.phone}')">X</button>` : ''}
                `;
            }

            return `
                <tr>
                    <td>${c.name}</td>
                    <td>${c.phone}</td>
                    <td>${c.email || '--'}</td>
                    <td><span class="badge badge-success">${c.points} pts</span></td>
                    <td>${actions}</td>
                </tr>
            `;
        }).join('') || '<tr><td colspan="5">Sin clientes registrados aún</td></tr>';
    },

    editClient: (phone) => {
        const c = app.state.clients.find(x => x.phone === phone);
        if (!c) return;
        app.showModal('client', c);
    },
    downloadReportPDF: () => {
        const start = document.getElementById('rep-start').value;
        const end = document.getElementById('rep-end').value;
        if (!start || !end) return alert("Seleccione fechas para el reporte.");

        const filtered = app.state.sales.filter(s => s.date.split('T')[0] >= start && s.date.split('T')[0] <= end);
        const total = filtered.reduce((a, b) => a + b.total, 0);

        const printWin = window.open('', '', 'width=800,height=600');
        printWin.document.write(`
            <html>
                <head>
                    <title>Reporte de Ventas BarberPro</title>
                    <style>
                        body { font-family: sans-serif; padding: 40px; color: #333; }
                        h1 { color: #E5B25D; border-bottom: 2px solid #E5B25D; padding-bottom: 10px; }
                        .summary { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin: 30px 0; }
                        .card { border: 1px solid #ddd; padding: 20px; border-radius: 8px; }
                        table { width: 100%; border-collapse: collapse; margin-top: 30px; }
                        th, td { border: 1px solid #eee; padding: 12px; text-align: left; }
                        th { background: #f9f9f9; }
                    </style>
                </head>
                <body>
                    <h1>REPORTE DE VENTAS: ${start} - ${end}</h1>
                    <div class="summary">
                        <div class="card"><h3>Ventas Totales</h3><p>Bs. ${total.toFixed(2)}</p></div>
                        <div class="card"><h3>Transacciones</h3><p>${filtered.length}</p></div>
                    </div>
                    <div class="dashboard-grid" style="margin-top:24px;">
                        <div class="card">
                            <h4><i class="fas fa-cut"></i> Top Servicios</h4>
                            <div id="bi-top-services" style="margin-top:15px;"></div>
                        </div>
                        <div class="card">
                            <h4><i class="fas fa-shopping-bag"></i> Top Productos</h4>
                            <div id="bi-top-products" style="margin-top:15px;"></div>
                        </div>
                        <div class="card">
                            <h4><i class="fas fa-scissors"></i> Mejores Barberos</h4>
                            <div id="bi-top-barbers" style="margin-top:15px;"></div>
                        </div>
                        <div class="card">
                            <h4><i class="fas fa-medal"></i> Clientes más Fieles</h4>
                            <div id="bi-top-clients" style="margin-top:15px;"></div>
                        </div>
                    </div>
                    <table>
                        <thead><tr><th>Fecha</th><th>Cliente</th><th>Monto Pagado</th><th>Descuento Puntos</th><th>Atendido por</th></tr></thead>
                        <tbody>
                            ${filtered.map(s => {
            const disc = (s.pointsRedeemed || 0) * app.state.loyaltySettings.pointValue;
            return `<tr>
                                    <td>${s.date.split('T')[0]}</td>
                                    <td>${s.clientName}</td>
                                    <td>Bs. ${s.total.toFixed(2)}</td>
                                    <td>${disc > 0 ? `Bs. ${disc.toFixed(2)}` : '--'}</td>
                                    <td>${s.staff}</td>
                                </tr>`;
        }).join('')}
                        </tbody>
                    </table>
                    <p style="margin-top:50px; text-align:center; font-size:0.8rem; color:#999;">Generado automáticamente por BarberPro Management System</p>
                </body>
            </html>
        `);
        printWin.document.close();
        printWin.print();
    },

    deleteItem: (t, id) => {
        if (!confirm(`¿Está seguro que desea eliminar este registro de ${t.toUpperCase()}? Esta acción no se puede deshacer.`)) return;

        if (t === 'clients') {
            const hasSales = app.state.sales.some(s => s.clientPhone === id);
            if (hasSales) return alert("No se puede eliminar un cliente con historial de ventas.");
            app.state.clients = app.state.clients.filter(x => x.phone !== id);
        } else {
            app.state[t] = app.state[t].filter(x => x.id !== id);
        }
        app.save();
        app.showSection(t);
    },

    showModal: (type, data = null) => {
        const container = document.getElementById('modal-container');
        const title = document.getElementById('modal-title');
        const content = document.getElementById('modal-content');
        const saveBtn = document.getElementById('modal-save-btn');
        container.classList.remove('hidden');

        if (type === 'user') {
            title.textContent = 'Nuevo Personal';
            content.innerHTML = `
                <label>Nombre Completo</label><input id="mo-name">
                <label>Username (Login)</label><input id="mo-user">
                <label>Contraseña Inicial</label><input type="password" id="mo-pass" value="1234">
                <label>Nivel de Barbero</label><select id="mo-tier">${app.state.tiers.map(t => `<option>${t.name}</option>`).join('')}</select>
                <label>Rol en Sistema</label><select id="mo-role"><option value="operario">Operario</option><option value="cajera">Cajera</option><option value="admin">Administrador</option></select>
            `;
            saveBtn.onclick = () => {
                app.state.users.push({ 
                    id: Date.now(), 
                    name: document.getElementById('mo-name').value, 
                    username: document.getElementById('mo-user').value, 
                    password: document.getElementById('mo-pass').value,
                    tier: document.getElementById('mo-tier').value, 
                    role: document.getElementById('mo-role').value, 
                    enabled: true 
                });
                app.save(); app.hideModal(); app.renderUsers();
            };
        } else if (type === 'change-pass') {
            title.textContent = 'Cambiar mi Contraseña';
            content.innerHTML = `
                <label>Nueva Contraseña</label><input type="password" id="mo-new-pass">
                <label>Confirmar Contraseña</label><input type="password" id="mo-confirm-pass">
            `;
            saveBtn.onclick = () => {
                const p1 = document.getElementById('mo-new-pass').value;
                const p2 = document.getElementById('mo-confirm-pass').value;
                if (!p1 || p1 !== p2) return alert("Las contraseñas no coinciden.");
                
                const idx = app.state.users.findIndex(u => u.id === app.state.currentUser.id);
                app.state.users[idx].password = p1;
                app.state.currentUser.password = p1;
                app.save();
                app.hideModal();
                alert("Contraseña actualizada con éxito.");
            };
        } else if (type === 'tier') {
            title.textContent = 'Nuevo Tipo de Barbero';
            content.innerHTML = `
                <label>Nombre del Nivel (ej: Master)</label><input id="mo-tname">
                <label>Comisión (%)</label><input type="number" id="mo-tcomm" value="50">
            `;
            saveBtn.onclick = () => {
                const name = document.getElementById('mo-tname').value;
                const comm = parseInt(document.getElementById('mo-tcomm').value);
                app.state.tiers.push({ id: Date.now(), name, commission: comm });
                app.save(); app.hideModal(); app.renderTiers();
            };
        } else if (type === 'service') {
            title.textContent = 'Nuevo Servicio';
            content.innerHTML = `<label>Nombre</label><input id="mo-name"><label>Precio</label><input type="number" id="mo-price"><label>Minutos</label><input type="number" id="mo-dur">`;
            saveBtn.onclick = () => {
                app.state.services.push({ id: Date.now(), name: document.getElementById('mo-name').value, price: parseFloat(document.getElementById('mo-price').value), duration: parseInt(document.getElementById('mo-dur').value) });
                app.save(); app.hideModal(); app.renderServices();
            };
        } else if (type === 'product') {
            title.textContent = 'Nuevo Producto';
            content.innerHTML = `
                <label>Nombre</label><input id="mo-name">
                <label>Precio Venta (Bs.)</label><input type="number" id="mo-price">
                <label>Costo Unitario (Bs.)</label><input type="number" id="mo-cost">
                <label>Stock Inicial</label><input type="number" id="mo-stock">
            `;
            saveBtn.onclick = () => {
                app.state.products.push({
                    id: Date.now(),
                    name: document.getElementById('mo-name').value,
                    price: parseFloat(document.getElementById('mo-price').value),
                    cost: parseFloat(document.getElementById('mo-cost').value) || 0,
                    stock: parseInt(document.getElementById('mo-stock').value)
                });
                app.save(); app.hideModal(); app.renderInventory();
            };
        } else if (type === 'expense') {
            title.textContent = 'Registrar Egreso / Gasto';
            content.innerHTML = `
                <label>Categoría</label>
                <select id="mo-cat">
                    <option>Insumos</option><option>Servicios Públicos</option>
                    <option>Alquiler</option><option>Mantenimiento</option>
                    <option>Otros</option>
                </select>
                <label>Descripción</label><input id="mo-desc">
                <label>Monto (Bs.)</label><input type="number" id="mo-amt">
            `;
            saveBtn.onclick = () => {
                const amt = parseFloat(document.getElementById('mo-amt').value);
                if (amt <= 0) return alert("Ingrese un monto válido");
                const exp = {
                    id: Date.now(),
                    cat: document.getElementById('mo-cat').value,
                    desc: document.getElementById('mo-desc').value,
                    amount: amt,
                    date: new Date().toISOString(),
                    sessionId: app.state.currentSession ? app.state.currentSession.id : null,
                    user: app.state.currentUser.name
                };
                app.state.expenses.push(exp);
                app.save();
                app.hideModal();
                if (app.state.currentSession) app.updateCajaSummary();
                alert("Gasto registrado correctamente.");
            };
        } else if (type === 'booking') {
            title.textContent = 'Agendar Cita';
            const today = new Date().toISOString().split('T')[0];
            content.innerHTML = `
                <label>Cliente</label><input id="mo-cli">
                <label>Fecha</label><input type="date" id="mo-date" min="${today}" value="${today}" onchange="app.updateBookingTimeSlots()">
                <label>Horarios Disponibles</label><select id="mo-time"></select>
                <label>Servicio</label><select id="mo-srv">${app.state.services.map(s => `<option>${s.name}</option>`).join('')}</select>
            `;
            app.updateBookingTimeSlots(); // Initial render
            saveBtn.onclick = () => {
                const date = document.getElementById('mo-date').value;
                const time = document.getElementById('mo-time').value;
                if (!time) return alert("No hay horarios disponibles para esta fecha.");
                app.state.bookings.push({ id: Date.now(), client: document.getElementById('mo-cli').value, date, time, serviceName: document.getElementById('mo-srv').value, status: 'pendiente' });
                app.save(); app.hideModal(); app.renderCalendar();
            };
        } else if (type === 'client') {
            title.textContent = 'Registrar Cliente';
            content.innerHTML = `
                <label>Nombre Completo</label><input id="mo-name">
                <label>Teléfono / Celular</label><input id="mo-phone">
                <label>Correo Electrónico (Opcional)</label><input id="mo-email">
            `;
            saveBtn.onclick = () => {
                const phone = document.getElementById('mo-phone').value;
                if (!phone) return alert("El teléfono es requerido.");

                if (data) {
                    // Update existing
                    const idx = app.state.clients.findIndex(x => x.phone === data.phone);
                    app.state.clients[idx] = { ...data, name: document.getElementById('mo-name').value, phone: phone, email: document.getElementById('mo-email').value };
                } else {
                    // New client
                    app.state.clients.push({ name: document.getElementById('mo-name').value, phone: phone, email: document.getElementById('mo-email').value, points: 0 });
                }

                app.save(); app.hideModal(); app.renderClients();
            };

            if (data) {
                document.getElementById('mo-name').value = data.name;
                document.getElementById('mo-phone').value = data.phone;
                document.getElementById('mo-email').value = data.email || '';
            }
        }
    },

    updateBookingTimeSlots: () => {
        const dateInput = document.getElementById('mo-date');
        const timeSelect = document.getElementById('mo-time');
        if (!dateInput || !timeSelect) return;

        const dateObj = new Date(dateInput.value + 'T00:00:00');
        const dayName = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][dateObj.getDay()];
        const enabledSlots = app.state.availability[dayName] || [];

        // Filter out already booked slots for that exact date
        const booked = app.state.bookings.filter(b => b.date === dateInput.value).map(b => b.time);
        const available = enabledSlots.filter(s => !booked.includes(s));

        if (available.length === 0) {
            timeSelect.innerHTML = '<option value="">SIN HORARIOS DISPONIBLES</option>';
        } else {
            timeSelect.innerHTML = available.map(s => `<option value="${s}">${s}</option>`).join('');
        }
    },

    hideModal: () => document.getElementById('modal-container').classList.add('hidden'),

    generateReport: () => {
        const start = document.getElementById('rep-start').value;
        const end = document.getElementById('rep-end').value;
        if (!start || !end) return alert("Fechas requeridas");
        const filtered = app.state.sales.filter(s => s.date.split('T')[0] >= start && s.date.split('T')[0] <= end);
        const total = filtered.reduce((a, b) => a + b.total, 0);
        document.getElementById('report-content').innerHTML = `
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:20px;">
                <h4 style="margin:0;">Listado de Periodo: ${start} al ${end}</h4>
                <div style="text-align:right;">
                    <span class="badge badge-success" style="font-size:1rem;">Total Neto: Bs. ${total.toFixed(2)}</span>
                </div>
            </div>
            <table>
                <thead><tr><th>Fecha</th><th>Cliente</th><th>Monto Pagado</th><th>Staff</th></tr></thead>
                <tbody>
                    ${filtered.map(s => {
            const disc = (s.pointsRedeemed || 0) * app.state.loyaltySettings.pointValue;
            const discTag = disc > 0 ? `<div style="font-size:0.7rem; color:var(--primary);">Ahorro Puntos: -Bs. ${disc.toFixed(2)}</div>` : '';
            return `<tr>
                            <td>${s.date.split('T')[0]}</td>
                            <td>${s.clientName}</td>
                            <td>Bs. ${s.total.toFixed(2)} ${discTag}</td>
                            <td>${s.staff}</td>
                        </tr>`;
        }).join('') || '<tr><td colspan="4">No hay ventas en este rango</td></tr>'}
                </tbody>
            </table>
        `;
    },

    showReportSubView: (id) => {
        document.getElementById('report-sub-bi').classList.toggle('hidden', id !== 'bi');
        document.getElementById('report-sub-daily').classList.toggle('hidden', id !== 'daily');
        if (id === 'bi') app.renderBI();
    },

    renderBI: () => {
        const sales = app.state.sales;
        const expenses = app.state.expenses;
        const now = new Date();
        const curYear = now.getFullYear();
        const curMonth = now.toISOString().substring(0, 7);

        // --- 1. INCOME CALCULATION ---
        const annualIncome = sales.filter(s => s.date.startsWith(curYear.toString())).reduce((a, b) => a + b.total, 0);
        const monthlyIncome = sales.filter(s => s.date.startsWith(curMonth)).reduce((a, b) => a + b.total, 0);

        // --- 2. EXPENSES CALCULATION ---
        const calcExpenses = (dataSales, dataExp) => {
            // Commissions paid
            const commissions = dataSales.reduce((acc, sale) => {
                return acc + sale.items.reduce((iAcc, it) => iAcc + (it.commission || 0), 0);
            }, 0);

            // Product Costs (Unit Cost * Volume)
            const cogs = dataSales.reduce((acc, sale) => {
                return acc + sale.items.reduce((iAcc, it) => {
                    if (it.type === 'p') {
                        const originalProd = app.state.products.find(p => p.id == it.id);
                        return iAcc + (originalProd ? originalProd.cost : 0);
                    }
                    return iAcc;
                }, 0);
            }, 0);

            // Registered Expenses (Rent, supplies, etc.)
            const adminExp = dataExp.reduce((a, b) => a + b.amount, 0);

            // Discounts (Loyalty) are already deducted from Income, but we count them if we want gross vs net
            const loyaltyDiscounts = dataSales.reduce((a, b) => a + (b.pointsRedeemed || 0) * app.state.loyaltySettings.pointValue, 0);

            return { commissions, cogs, adminExp, loyaltyDiscounts, total: commissions + cogs + adminExp };
        };

        const annualExp = calcExpenses(sales.filter(s => s.date.startsWith(curYear.toString())), expenses.filter(e => e.date.startsWith(curYear.toString())));
        const monthlyExp = calcExpenses(sales.filter(s => s.date.startsWith(curMonth)), expenses.filter(e => e.date.startsWith(curMonth)));

        // --- 3. RENDER METRICS ---
        document.getElementById('bi-annual-total').textContent = `Bs. ${annualIncome.toFixed(2)}`;
        document.getElementById('bi-annual-profit').textContent = `Bs. ${(annualIncome - annualExp.total).toFixed(2)}`;
        document.getElementById('bi-monthly-profit').textContent = `Bs. ${(monthlyIncome - monthlyExp.total).toFixed(2)}`;

        const uniqueDays = [...new Set(sales.map(s => s.date.split('T')[0]))].length || 1;
        document.getElementById('bi-daily-avg').textContent = `Bs. ${(annualIncome / uniqueDays).toFixed(2)}`;

        // Best Month
        const months = {};
        sales.forEach(s => {
            const m = s.date.substring(0, 7);
            months[m] = (months[m] || 0) + s.total;
        });
        const bestMonthKey = Object.keys(months).reduce((a, b) => months[a] > months[b] ? a : b, '--');
        document.getElementById('bi-best-month').textContent = bestMonthKey;

        // Leaderboards
        const counts = { s: {}, p: {}, c: {}, b: {} };
        sales.forEach(s => {
            s.items.forEach(it => {
                counts[it.type][it.name] = (counts[it.type][it.name] || 0) + 1;
                if (it.type === 's' && it.staff) counts.b[it.staff] = (counts.b[it.staff] || 0) + 1;
            });
            if (s.clientName !== 'General') counts.c[s.clientName] = (counts.c[s.clientName] || 0) + 1;
        });

        const renderList = (data, icon) => {
            const sorted = Object.entries(data).sort((a, b) => b[1] - a[1]).slice(0, 5);
            return sorted.map(([name, val]) => `
                <div style="display:flex; justify-content:space-between; align-items:center; padding:10px 0; border-bottom:1px solid rgba(255,255,255,0.05);">
                    <span style="font-size:0.85rem;"><i class="${icon}" style="margin-right:8px; opacity:0.5;"></i> ${name}</span>
                    <span style="font-weight:800; color:var(--primary);">${val}</span>
                </div>
            `).join('') || '<p style="font-size:0.8rem; color:var(--text-muted);">Sin datos</p>';
        };

        document.getElementById('bi-top-services').innerHTML = renderList(counts.s, 'fas fa-cut');
        document.getElementById('bi-top-products').innerHTML = renderList(counts.p, 'fas fa-box');
        document.getElementById('bi-top-clients').innerHTML = renderList(counts.c, 'fas fa-user-check');
        document.getElementById('bi-top-barbers').innerHTML = renderList(counts.b, 'fas fa-hand-holding-heart');
    }
};

window.app = app;
document.addEventListener('DOMContentLoaded', app.init);
