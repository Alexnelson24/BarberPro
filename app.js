console.log("Cargando BarberPro App...");

// STORES & STATE
const STORAGE_KEYS = {
    SERVICES: 'barber_services',
    BARBERS: 'barber_barbers',
    BOOKINGS: 'barber_bookings',
    SALES: 'barber_sales',
    REGISTER_SESSIONS: 'barber_register_sessions',
    CURRENT_SESSION: 'barber_current_session',
    TYPES: 'barber_types',
    CLIENTS: 'barber_clients'
};

const app = {
    state: {
        services: JSON.parse(localStorage.getItem(STORAGE_KEYS.SERVICES)) || [],
        barbers: JSON.parse(localStorage.getItem(STORAGE_KEYS.BARBERS)) || [],
        bookings: JSON.parse(localStorage.getItem(STORAGE_KEYS.BOOKINGS)) || [],
        sales: JSON.parse(localStorage.getItem(STORAGE_KEYS.SALES)) || [],
        register_sessions: JSON.parse(localStorage.getItem(STORAGE_KEYS.REGISTER_SESSIONS)) || [],
        current_session: JSON.parse(localStorage.getItem(STORAGE_KEYS.CURRENT_SESSION)) || null,
        types: JSON.parse(localStorage.getItem(STORAGE_KEYS.TYPES)) || [
            {id: 1, name: 'Junior', commission: 30},
            {id: 2, name: 'Senior', commission: 45},
            {id: 3, name: 'Master', commission: 60}
        ],
        clients: JSON.parse(localStorage.getItem(STORAGE_KEYS.CLIENTS)) || [],
        cart: []
    },

    init: () => {
        app.bindEvents();
        app.updateUI();
        app.checkRegisterStatus();
        app.refreshSelects();
        console.log("BarberPro inicializado.");
    },

    bindEvents: () => {
        // Navigation
        document.querySelectorAll('.nav-item').forEach(item => {
            item.addEventListener('click', (e) => {
                const sectionId = e.currentTarget.getAttribute('data-section');
                app.showSection(sectionId);
                document.querySelectorAll('.nav-item').forEach(nav => nav.classList.remove('active'));
                e.currentTarget.classList.add('active');
            });
        });
    },

    showSection: (sectionId) => {
        document.querySelectorAll('.section').forEach(s => s.classList.add('hidden'));
        document.getElementById(sectionId).classList.remove('hidden');
        document.getElementById('section-title').textContent = sectionId.charAt(0).toUpperCase() + sectionId.slice(1);
        app.updateSectionContent(sectionId);
    },

    saveState: (key) => {
        if (!key) {
            Object.keys(STORAGE_KEYS).forEach(k => {
                localStorage.setItem(STORAGE_KEYS[k], JSON.stringify(app.state[STORAGE_KEYS[k].replace('barber_', '')]));
            });
        } else {
            localStorage.setItem(STORAGE_KEYS[key.toUpperCase()], JSON.stringify(app.state[key]));
        }
    },

    checkRegisterStatus: () => {
        const badge = document.getElementById('register-status');
        const posAlert = document.getElementById('pos-alert');
        if (app.state.current_session) {
            badge.textContent = 'Caja Abierta';
            badge.className = 'badge badge-success';
            posAlert.classList.add('hidden');
            document.getElementById('caja-session-info').classList.remove('hidden');
            document.getElementById('caja-open-form').classList.add('hidden');
            
            document.getElementById('session-initial-amount').textContent = `Bs. ${app.state.current_session.initial_amount.toFixed(2)}`;
            document.getElementById('session-current-sales').textContent = `Bs. ${app.calculateSessionSales().toFixed(2)}`;
        } else {
            badge.textContent = 'Caja Cerrada';
            badge.className = 'badge badge-pending';
            posAlert.classList.remove('hidden');
            document.getElementById('caja-session-info').classList.add('hidden');
            document.getElementById('caja-open-form').classList.remove('hidden');
        }
    },

    calculateSessionSales: () => {
        if (!app.state.current_session) return 0;
        return app.state.sales
            .filter(sale => sale.sessionId === app.state.current_session.id)
            .reduce((total, sale) => total + sale.amount, 0);
    },

    openRegister: () => {
        const amount = parseFloat(document.getElementById('initial-amount-input').value) || 0;
        app.state.current_session = {
            id: Date.now(),
            initial_amount: amount,
            open_date: new Date().toISOString(),
            status: 'OPEN'
        };
        app.saveState('current_session');
        app.checkRegisterStatus();
    },

    closeRegister: () => {
        const salesTotal = app.calculateSessionSales();
        const closingSession = {
            ...app.state.current_session,
            close_date: new Date().toISOString(),
            sales_total: salesTotal,
            final_amount: app.state.current_session.initial_amount + salesTotal,
            status: 'CLOSED'
        };
        app.state.register_sessions.push(closingSession);
        app.state.current_session = null;
        app.saveState('current_session');
        app.saveState('register_sessions');
        app.checkRegisterStatus();
        app.updateSectionContent('caja');
    },

    // CRUD Methods
    addService: () => {
        const name = document.getElementById('srv-name').value;
        const price = parseFloat(document.getElementById('srv-price').value);
        const duration = parseInt(document.getElementById('srv-duration').value);

        if (!name || isNaN(price)) return alert('Complete los campos');

        app.state.services.push({ id: Date.now(), name, price, duration });
        app.saveState('services');
        app.hideModal();
        app.updateSectionContent('servicios');
        app.refreshSelects();
    },

    addBarber: () => {
        const name = document.getElementById('brb-name').value;
        const specialty = document.getElementById('brb-specialty').value;
        const typeId = document.getElementById('brb-type').value;

        if (!name) return alert('Nombre requerido');

        app.state.barbers.push({ 
            id: Date.now(), 
            name, 
            specialty, 
            typeId,
            total_commission: 0, 
            sales_count: 0 
        });
        app.saveState('barbers');
        app.hideModal();
        app.updateSectionContent('barberos');
        app.refreshSelects();
    },

    addBarberType: () => {
        const name = document.getElementById('type-name').value;
        const commission = parseFloat(document.getElementById('type-commission').value);

        if (!name || isNaN(commission)) return alert('Datos inválidos');

        app.state.types.push({ id: Date.now(), name, commission });
        app.saveState('types');
        app.hideModal();
        app.updateSectionContent('barber-types');
        app.refreshSelects();
    },

    addClient: () => {
        const name = document.getElementById('cli-name').value;
        const phone = document.getElementById('cli-phone').value;

        if (!name) return alert('Nombre requerido');

        app.state.clients.push({ 
            id: Date.now(), 
            name, 
            phone, 
            points: 0, 
            history: [] 
        });
        app.saveState('clients');
        app.hideModal();
        app.updateSectionContent('clientes');
        app.refreshSelects();
    },

    addBooking: () => {
        const date = document.getElementById('bkg-date').value;
        const time = document.getElementById('bkg-time').value;
        const client = document.getElementById('bkg-client').value;
        const serviceId = document.getElementById('bkg-service').value;
        const barberId = document.getElementById('bkg-barber').value;

        if (!date || !time || !client) return alert('Faltan datos');

        app.state.bookings.push({
            id: Date.now(),
            date, time, client, serviceId, barberId,
            status: 'Pendiente'
        });
        app.saveState('bookings');
        app.hideModal();
        app.updateSectionContent('reservas');
    },

    // POS Methods
    addToCart: () => {
        const serviceId = document.getElementById('pos-item-select').value;
        const barberId = document.getElementById('pos-barber-select').value;
        const clientId = document.getElementById('pos-client-select').value;
        const newClientName = document.getElementById('pos-client-name').value;

        if (!serviceId || !barberId) return alert('Seleccione servicio y barbero');

        const service = app.state.services.find(s => s.id == serviceId);
        const barber = app.state.barbers.find(b => b.id == barberId);
        
        let client = null;
        if (clientId) {
            client = app.state.clients.find(c => c.id == clientId);
        } else if (newClientName) {
            client = { id: 'temp-' + Date.now(), name: newClientName, isNew: true };
        }

        app.state.cart.push({
            id: Date.now(),
            service,
            barber,
            client
        });

        app.updateCartUI();
    },

    updateCartUI: () => {
        const cartList = document.getElementById('cart-list');
                const totalEl = document.getElementById('pos-total-amount');
        cartList.innerHTML = '';
        let total = 0;

        app.state.cart.forEach((item, index) => {
            total += item.service.price;
            const entry = document.createElement('div');
            entry.style.display = 'flex';
            entry.style.justifyContent = 'space-between';
            entry.style.marginBottom = '0.5rem';
            entry.innerHTML = `
                <span>${item.service.name} (${item.barber.name})</span>
                <span>Bs. ${item.service.price.toFixed(2)} <i class="fas fa-trash" onclick="app.removeFromCart(${index})" style="cursor:pointer; color:var(--danger);"></i></span>
            `;
            cartList.appendChild(entry);
        });

        totalEl.textContent = `Bs. ${total.toFixed(2)}`;
    },

    removeFromCart: (index) => {
        app.state.cart.splice(index, 1);
        app.updateCartUI();
    },

    processSale: () => {
        if (!app.state.current_session) return alert('La caja debe estar abierta.');
        if (app.state.cart.length === 0) return alert('El carrito está vacío.');

        app.state.cart.forEach(item => {
            // Get barber commission strictly from type/tier
            const barberObj = app.state.barbers.find(b => b.id == item.barber.id);
            const barberType = app.state.types.find(t => t.id == barberObj.typeId);
            const effectiveCommissionPercent = barberType?.commission || 0;
            const commissionAmount = (item.service.price * effectiveCommissionPercent) / 100;
            
            // Client Handling & Points
            let finalClientName = 'General';
            if (item.client) {
                if (item.client.isNew) {
                    const newId = Date.now() + Math.random();
                    app.state.clients.push({ id: newId, name: item.client.name, points: item.service.price, history: [item.service.name] });
                    finalClientName = item.client.name;
                } else {
                    const clientStore = app.state.clients.find(c => c.id == item.client.id);
                    clientStore.points += Math.floor(item.service.price);
                    clientStore.history.push(item.service.name);
                    finalClientName = clientStore.name;
                }
            }

            // Save sale
            const sale = {
                id: Date.now() + Math.random(),
                date: new Date().toISOString(),
                amount: item.service.price,
                serviceName: item.service.name,
                barberId: item.barber.id,
                barberName: item.barber.name,
                clientName: finalClientName,
                commission: commissionAmount,
                sessionId: app.state.current_session.id
            };
            app.state.sales.push(sale);

            // Update barber totals
            if (barberObj) {
                barberObj.total_commission += commissionAmount;
                barberObj.sales_count += 1;
            }
        });

        app.state.cart = [];
        app.saveState('sales');
        app.saveState('barbers');
        app.saveState('clients');
        app.updateUI();
        app.updateCartUI();
        document.getElementById('pos-client-name').value = '';
        alert('Venta y puntos procesados');
    },

    // UI Rendering
    updateUI: () => {
        // KPI Updating
        const todayStr = new Date().toISOString().split('T')[0];
        const salesToday = app.state.sales
            .filter(s => s.date.startsWith(todayStr))
            .reduce((sum, s) => sum + s.amount, 0);
        const bookingsPending = app.state.bookings.filter(b => b.status === 'Pendiente').length;
        const totalCommToday = app.state.sales
            .filter(s => s.date.startsWith(todayStr))
            .reduce((sum, s) => sum + s.commission, 0);

        document.getElementById('kpi-sales').textContent = `Bs. ${salesToday.toFixed(2)}`;
        document.getElementById('kpi-bookings').textContent = bookingsPending;
        document.getElementById('kpi-commissions').textContent = `Bs. ${totalCommToday.toFixed(2)}`;

        app.renderTable('upcoming-reservas-table', app.state.bookings.slice(0, 5), (b) => {
            const srv = app.state.services.find(s => s.id == b.serviceId);
            const brb = app.state.barbers.find(br => br.id == b.barberId);
            return `<td>${b.client}</td><td>${b.time}</td><td>${srv?.name || 'N/A'}</td><td>${brb?.name || 'N/A'}</td><td><span class="badge badge-pending">${b.status}</span></td>`;
        });
    },

    updateSectionContent: (sectionId) => {
        switch(sectionId) {
            case 'reservas':
                app.renderTable('reservas-table', app.state.bookings, (b) => {
                    const srv = app.state.services.find(s => s.id == b.serviceId);
                    const brb = app.state.barbers.find(br => br.id == b.barberId);
                    return `<td>${b.date} ${b.time}</td><td>${b.client}</td><td>${srv?.name || 'N/A'}</td><td>${brb?.name || 'N/A'}</td><td><button class="btn btn-danger" onclick="app.deleteItem('bookings', ${b.id})">Eliminar</button></td>`;
                });
                break;
            case 'servicios':
                app.renderTable('servicios-table', app.state.services, (s) => `
                    <td>${s.name}</td><td>Bs. ${s.price.toFixed(2)}</td><td>${s.duration} min</td>
                    <td><button class="btn btn-danger" onclick="app.deleteItem('services', ${s.id})">Eliminar</button></td>
                `);
                break;
            case 'barberos':
                app.renderTable('barberos-table', app.state.barbers, (b) => {
                    const type = app.state.types.find(t => t.id == b.typeId);
                    return `<td>${b.name}</td><td>${type?.name || 'Común'}</td><td>Bs. ${b.total_commission.toFixed(2)}</td><td>${b.sales_count}</td>
                    <td><button class="btn btn-danger" onclick="app.deleteItem('barbers', ${b.id})">Eliminar</button></td>`;
                });
                break;
            case 'barber-types':
                app.renderTable('barber-types-table', app.state.types, (t) => `
                    <td>${t.name}</td><td>${t.commission}%</td>
                    <td><button class="btn btn-danger" onclick="app.deleteItem('types', ${t.id})">Eliminar</button></td>
                `);
                break;
            case 'clientes':
                app.renderTable('clientes-table', app.state.clients, (c) => `
                    <td>${c.name}</td><td>${Math.floor(c.points)} pts</td><td>${c.history.length > 0 ? 'Reciente' : 'Nunca'}</td>
                    <td><button class="btn btn-secondary" onclick="alert('Historial: ' + '${c.history.join(', ')}')">Ver Historial</button></td>
                `);
                break;
            case 'caja':
                app.renderTable('caja-history', app.state.register_sessions, (s) => `
                    <td>${new Date(s.close_date || s.open_date).toLocaleString()}</td><td>Bs. ${s.initial_amount.toFixed(2)}</td>
                    <td>Bs. ${s.sales_total?.toFixed(2) || '0.00'}</td><td>Bs. ${s.final_amount?.toFixed(2) || '-'}</td>
                    <td class="${s.status === 'OPEN' ? 'text-primary' : ''}">${s.status}</td>
                `);
                app.checkRegisterStatus();
                break;
            case 'reportes':
                const mTotal = app.state.sales.reduce((sum, s) => sum + s.amount, 0);
                document.getElementById('monthly-sales').textContent = `Bs. ${mTotal.toFixed(2)}`;
                document.getElementById('monthly-services-count').textContent = app.state.sales.length;
                app.renderTable('sales-history', app.state.sales.reverse(), (s) => `
                    <td>${new Date(s.date).toLocaleString()}</td><td>${s.clientName}</td><td>${s.serviceName}</td><td>Bs. ${s.amount.toFixed(2)}</td><td>${s.barberName}</td>
                `);
                break;
            case 'dashboard':
                app.updateUI();
                break;
        }
    },

    renderTable: (id, data, rowGenerator) => {
        const table = document.getElementById(id);
        if (!table) return;
        const tbody = table.querySelector('tbody');
        tbody.innerHTML = '';
        data.forEach(item => {
            const row = document.createElement('tr');
            row.innerHTML = rowGenerator(item);
            tbody.appendChild(row);
        });
    },

    deleteItem: (type, id) => {
        app.state[type] = app.state[type].filter(i => i.id !== id);
        app.saveState(type);
        app.updateSectionContent(type);
        app.refreshSelects();
    },

    refreshSelects: () => {
        // POS selects
        const srvSelect = document.getElementById('pos-item-select');
        const brbSelect = document.getElementById('pos-barber-select');
        const cliSelect = document.getElementById('pos-client-select');
        
        if (srvSelect) {
            srvSelect.innerHTML = '<option value="">Seleccione Servicio</option>' + app.state.services.map(s => `<option value="${s.id}">${s.name} - Bs. ${s.price}</option>`).join('');
        }
        if (brbSelect) {
            brbSelect.innerHTML = '<option value="">Seleccione Barbero</option>' + app.state.barbers.map(b => `<option value="${b.id}">${b.name}</option>`).join('');
        }
        if (cliSelect) {
            cliSelect.innerHTML = '<option value="">Cliente Existente (Opcional)</option>' + app.state.clients.map(c => `<option value="${c.id}">${c.name} (${Math.floor(c.points)} pts)</option>`).join('');
        }
    },

    // Modal Helpers
    showModal: (type) => {
        const modal = document.getElementById('modal-container');
        const title = document.getElementById('modal-title');
        const content = document.getElementById('modal-content');
        const saveBtn = document.getElementById('modal-save-btn');
        
        modal.classList.remove('hidden');
        saveBtn.onclick = null;

        if (type === 'service') {
            title.textContent = 'Nuevo Servicio';
            content.innerHTML = `
                <input type="text" id="srv-name" placeholder="Nombre (ej. Corte Degrade)">
                <input type="number" id="srv-price" placeholder="Precio (Bs.)">
                <input type="number" id="srv-duration" placeholder="Duración (min)">
            `;
            saveBtn.onclick = app.addService;
        } else if (type === 'barber') {
            title.textContent = 'Nuevo Barbero';
            content.innerHTML = `
                <input type="text" id="brb-name" placeholder="Nombre completo">
                <input type="text" id="brb-specialty" placeholder="Especialidad">
                <label>Nivel de Barbero</label>
                <select id="brb-type">
                    ${app.state.types.map(t => `<option value="${t.id}">${t.name} (${t.commission}%)</option>`).join('')}
                </select>
            `;
            saveBtn.onclick = app.addBarber;
        } else if (type === 'barberType') {
            title.textContent = 'Nuevo Nivel de Barbero';
            content.innerHTML = `
                <input type="text" id="type-name" placeholder="Nombre del rango (ej. Master)">
                <input type="number" id="type-commission" placeholder="% de Comisión Base">
            `;
            saveBtn.onclick = app.addBarberType;
        } else if (type === 'client') {
            title.textContent = 'Nuevo Cliente';
            content.innerHTML = `
                <input type="text" id="cli-name" placeholder="Nombre completo">
                <input type="text" id="cli-phone" placeholder="Teléfono">
            `;
            saveBtn.onclick = app.addClient;
        } else if (type === 'booking') {
            title.textContent = 'Nueva Reserva';
            content.innerHTML = `
                <input type="date" id="bkg-date" value="${new Date().toISOString().split('T')[0]}">
                <input type="time" id="bkg-time" value="10:00">
                <input type="text" id="bkg-client" placeholder="Nombre cliente">
                <select id="bkg-service">
                    ${app.state.services.map(s => `<option value="${s.id}">${s.name}</option>`).join('')}
                </select>
                <select id="bkg-barber">
                    ${app.state.barbers.map(b => `<option value="${b.id}">${b.name}</option>`).join('')}
                </select>
            `;
            saveBtn.onclick = app.addBooking;
        }
    },

    hideModal: () => {
        document.getElementById('modal-container').classList.add('hidden');
    }
};

// Global Exposure for HTML onclicks
window.app = app;

// Init
document.addEventListener('DOMContentLoaded', app.init);
