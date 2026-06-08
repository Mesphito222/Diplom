function innCheckDigit10(inn) {
            const k = [2,4,10,3,5,9,4,6,8];
            const s = k.reduce((acc, w, i) => acc + w * +inn[i], 0);
            return (s % 11 % 10) === +inn[9];
        }
        

function innCheckDigit12(inn) {
            const k1 = [7,2,4,10,3,5,9,4,6,8];
            const k2 = [3,7,2,4,10,3,5,9,4,6,8];
            const n11 = k1.reduce((a,w,i)=>a+w*+inn[i],0) % 11 % 10;
            const n12 = k2.reduce((a,w,i)=>a+w*+inn[i],0) % 11 % 10;
            return n11 === +inn[10] && n12 === +inn[11];
        }

        /**
         * Проверяет ИНН.
         * @param {string} val
         * @param {'legal'|'entrepreneur'|'individual'|'any'} type
         * @returns {string|null} — строка ошибки или null если всё ок
         */
        

function validateInnClient(val, type = 'any') {
            if (!val) return null;
            if (!/^\d+$/.test(val)) return 'ИНН должен содержать только цифры.';
            if (type === 'legal') {
                if (val.length !== 10) return 'ИНН юридического лица должен содержать ровно 10 цифр.';
                if (!innCheckDigit10(val)) return 'ИНН юридического лица не прошёл проверку контрольной цифры. Проверьте правильность ввода.';
            } else if (type === 'entrepreneur') {
                if (val.length !== 12) return 'ИНН ИП должен содержать ровно 12 цифр.';
                if (!innCheckDigit12(val)) return 'ИНН ИП не прошёл проверку контрольных цифр. Проверьте правильность ввода.';
            } else {
                if (val.length === 10) { if (!innCheckDigit10(val)) return 'ИНН (10 цифр) не прошёл проверку контрольной цифры.'; }
                else if (val.length === 12) { if (!innCheckDigit12(val)) return 'ИНН (12 цифр) не прошёл проверку контрольных цифр.'; }
                else return 'ИНН должен содержать 10 или 12 цифр.';
            }
            return null;
        }

        /**
         * Проверяет ОГРНИП (15 цифр, контрольная цифра = base % 13 % 10).
         * @returns {string|null}
         */
        

function validateOgrnipClient(val) {
            if (!val) return null;
            if (!/^\d{15}$/.test(val)) return 'ОГРНИП должен содержать ровно 15 цифр.';
            const base = BigInt(val.slice(0, 14));
            const check = Number(base % 13n % 10n);
            if (check !== +val[14]) return 'ОГРНИП не прошёл проверку контрольной цифры. Проверьте правильность ввода.';
            return null;
        }

        /**
         * Проверяет КПП (9 символов: 4 цифры + 2 знака + 3 цифры).
         * @returns {string|null}
         */
        

function validateKppClient(val) {
            if (!val) return null;
            if (!/^\d{4}[\dA-Za-z]{2}\d{3}$/.test(val)) {
                return 'КПП должен содержать 9 символов формата NNNNPPXXX (4 цифры кода ФНС + 2 знака причины + 3 цифры).';
            }
            return null;
        }

        /* ══════════════════════════════════════════════════════
           fillByInn — универсальная функция для кнопки «Заполнить по ИНН»
           ctx: 'reg' (форма регистрации) | 'profile' (форма профиля)
           type: 'entrepreneur' | 'legal'
        ══════════════════════════════════════════════════════ */

        async 

function fillByInn(ctx, type) {
            const innInput = document.getElementById(ctx === 'reg' ? 'regInn' : 'inn');
            const statusEl = document.getElementById(ctx === 'reg' ? 'regInnStatus' : 'profileInnStatus');
            const btn = document.getElementById(ctx === 'reg' ? 'regFillByInnBtn' : 'profileFillByInnBtn');

            if (!innInput || !statusEl || !btn) return;

            const inn = innInput.value.trim();
            if (!inn) {
                showInnStatus(statusEl, 'Введите ИНН в поле выше, затем нажмите кнопку.', 'err');
                return;
            }

            // Предварительная клиентская проверка
            const preErr = validateInnClient(inn, type);
            if (preErr) {
                showInnStatus(statusEl, '⚠️ По результатам проверки вы ввели некорректные данные: ' + preErr, 'err');
                return;
            }

            btn.disabled = true;
            btn.textContent = '⏳ Поиск...';
            showInnStatus(statusEl, 'Запрашиваю данные из реестра...', 'ok');

            try {
                const res = await fetch(`${API_BASE}/users/fill-by-inn/?inn=${encodeURIComponent(inn)}`);
                const data = await res.json();

                if (!res.ok) {
                    showInnStatus(statusEl, '❌ ' + (data.error || 'Организация не найдена. Проверьте ИНН.'), 'err');
                    return;
                }

                if (data.type !== type) {
                    const foundType = data.type === 'legal' ? 'юридическое лицо' : 'ИП';
                    const expectedType = type === 'legal' ? 'Юридическое лицо' : 'ИП';
                    showInnStatus(statusEl, `❌ По результатам проверки введённый ИНН принадлежит ${foundType}, а не ${expectedType}. Проверьте ИНН или смените тип пользователя.`, 'err');
                    return;
                }

                // Заполняем поля
                if (type === 'entrepreneur') {
                    const nameId = ctx === 'reg' ? 'regEntrepreneurName' : 'entrepreneurName';
                    const ogrnipId = ctx === 'reg' ? 'regOgrnip' : 'ogrnip';
                    if (data.data.entrepreneur_name) setFieldValue(nameId, data.data.entrepreneur_name);
                    if (data.data.inn) setFieldValue(ctx === 'reg' ? 'regInn' : 'inn', data.data.inn);
                    if (data.data.ogrnip) setFieldValue(ogrnipId, data.data.ogrnip);
                    showInnStatus(statusEl, '✅ Данные ИП найдены и заполнены автоматически. Проверьте и при необходимости скорректируйте.', 'ok');
                } else {
                    const nameId = ctx === 'reg' ? 'regCompanyName' : 'companyName';
                    const kppId  = ctx === 'reg' ? 'regKpp' : 'kpp';
                    if (data.data.company_name) setFieldValue(nameId, data.data.company_name);
                    if (data.data.inn) setFieldValue(ctx === 'reg' ? 'regInn' : 'inn', data.data.inn);
                    if (data.data.kpp) setFieldValue(kppId, data.data.kpp);
                    showInnStatus(statusEl, '✅ Данные организации найдены и заполнены автоматически. Проверьте и при необходимости скорректируйте.', 'ok');
                }
            } catch (err) {
                showInnStatus(statusEl, '❌ Ошибка подключения к серверу. Попробуйте позже.', 'err');
            } finally {
                btn.disabled = false;
                btn.textContent = '🔍 Заполнить по ИНН';
            }
        }

        

function showInnStatus(el, msg, kind) {
            el.textContent = msg;
            el.className = 'inn-status-msg ' + (kind === 'ok' ? 'inn-ok' : 'inn-err');
            el.style.display = '';
        }

        

function setFieldValue(id, value) {
            const el = document.getElementById(id);
            if (el) el.value = value;
        }
        const WS_BASE = `${window.location.protocol === 'https:' ? 'wss' : 'ws'}://${window.location.host}/ws`;

        const CATEGORIES = [
            { id: 'all', name: 'Все' }
        ];

        let selectedMediaFiles = [];
        let wsConnection = null;
        let notificationsWsConnection = null;
        let notificationSocketReconnectTimer = null;
        let serverCategories = null;
        let chatSelectedImageFile = null;
        let chatSelectedImagePreviewUrl = null;

        let currentRentalItem = null;
        let currentBooking = null;
        let currentPaymentPayload = null;
        let currentContractData = null;
        let currentBookingContract = null;
        let currentItemBookings = [];
        let rentStartPicker = null;
        let rentEndPicker = null;
        let bookedDateRanges = [];
        let notificationPollInterval = null;
        let notificationSocketConnected = false;
        let shownNotificationIds = new Set();
        let navCounters = { chats: 0, bookings: 0 };

        let currentPage = 1;
        let totalPages = 1;
        let currentCategory = 'all';
        let currentSearchQuery = '';
        let availabilityFilterMode = 'all';
        let availabilityFilterStart = '';
        let availabilityFilterEnd = '';
        let allProducts = [];
        let activePreviewItemId = null;
        let activeChatConversationId = null;
        let activeChatItemId = null;
        let activeChatFocusHandler = null;
        let activeChatVisibilityHandler = null;
        let supportFaq = [];
        let supportFaqLoaded = false;
        let supportActiveQuestionId = null;

        const supportFallbackFaq = [
            {
                id: 'create-listing',
                question: 'Как создать объявление?',
                answer_title: 'Как разместить новое объявление',
                steps: [
                    'Войдите в аккаунт и откройте кнопку "Объявление" в верхнем меню.',
                    'Заполните название, описание, цену за день и категорию.',
                    'Добавьте фотографии и нажмите "Опубликовать".',
                    'Проверьте, что карточка появилась в каталоге.'
                ]
            }
        ];

        

function apiRequest(endpoint, options = {}) {
            const url = `${API_BASE}${endpoint}`;
            const headers = { ...options.headers };
            const token = getAccessToken();
            if (token) headers['Authorization'] = `Bearer ${token}`;

            if (!(options.body instanceof FormData)) {
                headers['Content-Type'] = 'application/json';
            }

            let response = await fetch(url, { ...options, headers });
            if (response.status === 401 && !options._retry) {
                const refreshed = await refreshAccessToken();
                if (refreshed) {
                    options._retry = true;
                    headers['Authorization'] = `Bearer ${getAccessToken()}`;
                    response = await fetch(url, { ...options, headers });
                }
            }
            return response;
        }

        

function escapeHtml(text) {
            const div = document.createElement('div');
            div.textContent = text;
            return div.innerHTML;
        }

        

function getInitials(name) {
            const s = (name || '').trim();
            if (!s) return 'U';
            const parts = s.split(/\s+/).filter(Boolean);
            const first = parts[0]?.[0] || 'U';
            const second = parts[1]?.[0] || '';
            return (first + second).toUpperCase();
        }

        

function formatBytes(bytes) {
            if (!bytes && bytes !== 0) return '';
            const units = ['B', 'KB', 'MB', 'GB'];
            let i = 0;
            let n = bytes;
            while (n >= 1024 && i < units.length - 1) { n /= 1024; i++; }
            return `${n.toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
        }

        

function normalizeWhitespace(value) {
            return String(value || '').replace(/\s+/g, ' ').trim();
        }

        

function isValidRussianFullName(value) {
            return /^[А-ЯЁа-яё]+(?: [А-ЯЁа-яё]+){2,}$/.test(normalizeWhitespace(value));
        }

        

function getReadableRegistrationError(responseData) {
            const errors = [];
            const addFieldError = (field, label, fallback) => {
                if (!responseData || !responseData[field]) return;
                const raw = Array.isArray(responseData[field]) ? responseData[field].join(', ') : String(responseData[field]);
                let message = translateServerMessage(raw, fallback);

                if (/255 characters/i.test(raw) || /no more than 255/i.test(raw) || /at most 255/i.test(raw)) {
                    message = fallback;
                }

                errors.push(`• ${label}: ${message}`);
            };

            addFieldError('username', 'Имя пользователя', 'Проверьте значение');
            addFieldError('email', 'Email', 'Проверьте значение');
            addFieldError('password', 'Пароль', 'Проверьте значение');
            addFieldError('user_type', 'Тип пользователя', 'Проверьте значение');
            addFieldError('full_name', 'ФИО', 'Введите минимум 3 слова русскими буквами');
            addFieldError('entrepreneur_name', 'Наименование ИП', 'Слишком длинное название. Максимум 255 символов.');
            addFieldError('company_name', 'Наименование организации', 'Слишком длинное название. Максимум 255 символов.');
            addFieldError('passport_series', 'Серия паспорта', 'Проверьте значение');
            addFieldError('passport_number', 'Номер паспорта', 'Проверьте значение');
            addFieldError('inn', 'ИНН', 'Проверьте значение');
            addFieldError('ogrnip', 'ОГРНИП', 'Проверьте значение');
            addFieldError('kpp', 'КПП', 'Проверьте значение');
            addFieldError('email_code', 'Код подтверждения', 'Неверный или истёкший код');

            if (responseData?.error) {
                errors.push(`• ${responseData.error}`);
            }

            if (responseData?.detail) {
                errors.push(`• ${translateServerMessage(responseData.detail, 'Проверьте введённые данные.')}`);
            }

            if (!errors.length) {
                return 'Ошибка регистрации. Проверьте введённые данные.';
            }

            return `Ошибка регистрации:\n${errors.join('\n')}`;
        }

        

function readApiError(response, fallback = 'Произошла ошибка. Попробуйте ещё раз.') {
            const contentType = response.headers.get('content-type') || '';
            const responseText = await response.text().catch(() => '');

            if (contentType.includes('application/json')) {
                try {
                    return extractApiErrorMessage(JSON.parse(responseText), fallback);
                } catch (e) {
                    return fallback;
                }
            }

            return sanitizeToastMessage(responseText, fallback);
        }

        

function formatPrice(value) {
            const number = Number(value || 0);
            return `${number.toLocaleString('ru-RU')} ₽`;
        }

        // Возвращает цену с наценкой 20% из поля price_with_markup (если пришло с сервера),
        // иначе считает сам: price_per_day * 1.20
        

function getDisplayPrice(item) {
            if (item && item.price_with_markup) return Number(item.price_with_markup);
            const base = Number(item?.price_per_day || item?.price || 0);
            return Math.round(base * 1.20 * 100) / 100;
        }

        

function formatDateRu(dateString) {
            if (!dateString) return '—';
            const date = new Date(dateString);
            if (Number.isNaN(date.getTime())) return dateString;
            return date.toLocaleDateString('ru-RU');
        }

        

function getTodayDateString() {
            const now = new Date();
            const offset = now.getTimezoneOffset();
            const local = new Date(now.getTime() - offset * 60000);
            return local.toISOString().split('T')[0];
        }

        

function getFreeDateLabels(bookedRanges) {
            const today = new Date();
            const startPointer = new Date(today.getFullYear(), today.getMonth(), today.getDate());
            const sorted = [...(bookedRanges || [])]
                .filter(range => range.start_date && range.end_date)
                .sort((a, b) => new Date(a.start_date) - new Date(b.start_date));

            if (!sorted.length) {
                return [`Свободно с ${formatDateRu(startPointer.toISOString())}`];
            }

            const labels = [];
            let cursor = new Date(startPointer);

            for (const range of sorted) {
                const rangeStart = new Date(range.start_date);
                const rangeEnd = new Date(range.end_date);
                if (cursor < rangeStart) {
                    labels.push(`${formatDateRu(cursor.toISOString())} - ${formatDateRu(rangeStart.toISOString())}`);
                }
                if (cursor < rangeEnd) {
                    cursor = new Date(rangeEnd);
                }
            }

            labels.push(`После ${formatDateRu(cursor.toISOString())}`);
            return labels.slice(0, 4);
        }

        

function addDays(dateString, days) {
            const base = new Date(dateString);
            base.setDate(base.getDate() + days);
            return base.toISOString().split('T')[0];
        }

        

function rangeOverlaps(startA, endA, startB, endB) {
            return startA < endB && endA > startB;
        }

        

function formatDepositStatus(status) {
            const map = {
                not_required: 'Не требуется',
                unpaid: 'Не оплачен',
                pending: 'Ожидает оплаты',
                paid: '✅ Оплачен',
                returned: '↩ Возвращён',
                failed: 'Ошибка оплаты'
            };
            return map[status] || '—';
        }

        

function ensureServerCategoriesLoaded() {
            if (Array.isArray(serverCategories)) return serverCategories;
            try {
                const resp = await apiRequest('/items/categories/');
                if (!resp.ok) { serverCategories = []; return serverCategories; }
                const data = await resp.json();
                serverCategories = Array.isArray(data) ? data : (data.results || []);
            } catch (e) {
                serverCategories = [];
            }
            return serverCategories;
        }

        async 

function getDisplayCategories() {
            const categories = await ensureServerCategoriesLoaded();
            return [CATEGORIES[0], ...categories];
        }

        

function sendRealtimeMarkRead() {
            if (!activeChatConversationId || !canMarkActiveChatAsRead()) return;
            if (wsConnection && wsConnection.readyState === WebSocket.OPEN) {
                wsConnection.send(JSON.stringify({ action: 'mark_read' }));
            } else {
                markConversationRead(activeChatConversationId);
            }
        }

        async 

function fetchPaginatedResults(baseEndpoint) {
            const results = [];
            let page = 1;
            let hasMore = true;

            while (hasMore) {
                const separator = baseEndpoint.includes('?') ? '&' : '?';
                const response = await apiRequest(`${baseEndpoint}${separator}page=${page}`);
                if (!response.ok) break;

                const data = await response.json().catch(() => ({}));
                const pageItems = Array.isArray(data) ? data : (data.results || []);
                results.push(...pageItems);

                if (Array.isArray(data) || !data.next) {
                    hasMore = false;
                } else {
                    page += 1;
                }
            }

            return results;
        }

        async 

function formatCompactCount(value) {
            if (value > 99) return '99+';
            return String(value);
        }

        

function renderNavBadge(count, kind = 'default') {
            if (!count) return '';
            return `<span class="nav-badge ${kind === 'attention' ? 'attention' : ''}">${formatCompactCount(count)}</span>`;
        }

        

function refreshNavCounters() {
            if (!isAuthenticated()) {
                navCounters = { chats: 0, bookings: 0 };
                return navCounters;
            }

            try {
                const [conversations, incomingBookings] = await Promise.all([
                    getConversations(),
                    getIncomingBookings()
                ]);

                navCounters = {
                    chats: (conversations || []).reduce((sum, conversation) => sum + Number(conversation.unread_count || 0), 0),
                    bookings: (incomingBookings || []).filter((booking) => booking.status === 'pending').length,
                };
            } catch (error) {
                navCounters = { chats: 0, bookings: 0 };
            }

            const chatsBadge = document.getElementById('chatsNavBadge');
            if (chatsBadge) {
                chatsBadge.textContent = formatCompactCount(navCounters.chats);
                chatsBadge.style.display = navCounters.chats ? '' : 'none';
            }
            const bookingsBadge = document.getElementById('bookingsNavBadge');
            if (bookingsBadge) {
                bookingsBadge.textContent = formatCompactCount(navCounters.bookings);
                bookingsBadge.style.display = navCounters.bookings ? '' : 'none';
            }

            return navCounters;
        }

        async 

function submitReview(bookingId, rating, comment) {
            try {
                const response = await apiRequest(`/bookings/${bookingId}/review/`, {
                    method: 'POST',
                    body: JSON.stringify({ rating, comment })
                });
                const responseText = await response.text().catch(() => '');
                let data = {};
                try {
                    data = responseText ? JSON.parse(responseText) : {};
                } catch (e) {
                    data = { detail: responseText || 'Не удалось отправить отзыв.' };
                }
                return { success: response.ok, data };
            } catch (error) {
                return { success: false, data: { detail: 'Ошибка подключения при отправке отзыва.' } };
            }
        }

        

function buildFlatpickrDisabledRanges(ranges) {
            return (ranges || [])
                .filter(range => range.start_date && range.end_date)
                .map(range => ({ from: range.start_date, to: range.end_date }));
        }

        

function closeSbpDemoModal() {
            document.getElementById('sbpDemoOverlay')?.classList.remove('active');
            const messageBox = document.getElementById('sbpDemoMessage');
            if (messageBox) messageBox.innerHTML = '';
            const payButton = document.getElementById('sbpDemoPayBtn');
            if (payButton) {
                payButton.disabled = false;
                payButton.textContent = 'Оплатить';
            }
        }

        

function openSbpDemoModal() {
            if (!currentPaymentPayload) {
                setRentModalMessage('error', 'Сначала создайте платёжную сессию.');
                return;
            }

            document.getElementById('sbpDemoBank').textContent = currentPaymentPayload.bank_name || '—';
            document.getElementById('sbpDemoRecipient').textContent = currentPaymentPayload.recipient || '—';
            document.getElementById('sbpDemoPhone').textContent = currentPaymentPayload.phone_number || '—';
            document.getElementById('sbpDemoAmount').textContent = `${currentPaymentPayload.amount || '0'} ${currentPaymentPayload.currency || 'RUB'}`;
            document.getElementById('sbpDemoQrPayload').textContent = currentPaymentPayload.qr_payload || 'QR payload недоступен';
            document.getElementById('sbpDemoOverlay')?.classList.add('active');
        }

        

function renderPickupList(offices, loading = false, error = false) {
            const list = document.getElementById('pickupList');
            if (!list) return;

            if (loading) {
                list.innerHTML = '<div class="pickup-empty">🔍 Поиск отделений...</div>';
                return;
            }
            if (error) {
                list.innerHTML = '<div class="pickup-empty">❌ Ошибка загрузки. Попробуйте ещё раз.</div>';
                return;
            }
            if (!offices || !offices.length) {
                list.innerHTML = '<div class="pickup-empty">Введите город или адрес для поиска</div>';
                return;
            }

            list.innerHTML = offices.map(o => `
                <div class="pickup-item ${selectedPickupOffice?.postal_code === o.postal_code ? 'selected' : ''}"
                     data-code="${o.postal_code}">
                    <div class="pickup-item-radio"></div>
                    <div class="pickup-item-info">
                        <span class="pickup-item-index">${o.postal_code}</span>
                        <div class="pickup-item-addr">${o.address_str}</div>
                    </div>
                </div>
            `).join('');

            list.querySelectorAll('.pickup-item').forEach(el => {
                el.addEventListener('click', () => {
                    const code = el.dataset.code;
                    selectedPickupOffice = (window._pickupOfficesCache || []).find(o => o.postal_code === code) || null;
                    renderPickupList(window._pickupOfficesCache || []);
                    updatePickupSelectedInfo();
                });
            });
        }

        

function updatePickupSelectedInfo() {
            const info = document.getElementById('pickupSelectedInfo');
            if (!info) return;
            if (selectedPickupOffice) {
                info.textContent = `✅ Выбрано: ${selectedPickupOffice.postal_code} — ${selectedPickupOffice.address_str}`;
                info.classList.add('visible');
            } else {
                info.classList.remove('visible');
            }
        }

        async 

function searchPickupOffices(query) {
            if (!query || query.length < 2) {
                renderPickupList([]);
                return;
            }
            renderPickupList([], true);
            try {
                const resp = await apiRequest(`/post-offices/search/?query=${encodeURIComponent(query)}`);
                if (!resp.ok) throw new Error();
                const data = await resp.json();
                window._pickupOfficesCache = data;
                renderPickupList(data);
            } catch {
                renderPickupList([], false, true);
            }
        }

        

function initPickupWidget() {
            selectedPickupOffice = null;
            window._pickupOfficesCache = [];
            renderPickupList([]);
            updatePickupSelectedInfo();
            const searchInput = document.getElementById('pickupSearchInput');
            if (searchInput) {
                searchInput.value = '';
                searchInput.addEventListener('input', () => {
                    clearTimeout(pickupSearchTimer);
                    pickupSearchTimer = setTimeout(() => searchPickupOffices(searchInput.value.trim()), 400);
                });
            }
        }

        async 

function renderPagination() {
            const container = document.getElementById('pagination');
            if (!container || totalPages <= 1) {
                if (container) container.innerHTML = '';
                return;
            }

            let html = '';
            for (let i = 1; i <= totalPages; i++) {
                html += `<button class="${i === currentPage ? 'active' : ''}" data-page="${i}">${i}</button>`;
            }
            container.innerHTML = html;
            container.querySelectorAll('button').forEach(btn => btn.addEventListener('click', () => loadProducts(parseInt(btn.dataset.page, 10))));
        }

        async 

function logout() {
            if (wsConnection) { wsConnection.close(); wsConnection = null; }
            closeNotificationsSocket();
            stopNotificationPolling();
            shownNotificationIds = new Set();
            clearTokens();
            updateNavBar();
            showMainPage();
            loadProducts(1);
        }

        

function updateNavBar() {
            const authSection = document.getElementById('authSection');
            if (!authSection) return;

            if (isAuthenticated()) {
                connectNotificationsSocket();
                const adminButtonHtml = localStorage.getItem('is_superuser') === '1'
                    ? '<button class="btn-outline nav-btn" id="moderationNavBtn">🛡️ Модерация</button>'
                    : '';
                authSection.innerHTML = `
                    <div class="user-info">
                        <span>👤 ${localStorage.getItem('username') || 'Пользователь'}</span>
                        ${adminButtonHtml}
                        <button class="btn-outline nav-btn" id="myItemsNavBtn">📦 Мои объявления</button>
                        <button class="btn-outline nav-btn" id="bookingsNavBtn">📥 Заявки<span class="nav-badge attention" id="bookingsNavBadge" style="${navCounters.bookings ? '' : 'display:none;'}">${formatCompactCount(navCounters.bookings)}</span></button>
                        <button class="btn-outline nav-btn" id="chatsNavBtn">💬 Чаты<span class="nav-badge" id="chatsNavBadge" style="${navCounters.chats ? '' : 'display:none;'}">${formatCompactCount(navCounters.chats)}</span></button>
                        <button class="btn-outline" id="profileNavBtn">👤 Профиль</button>
                        <button class="btn-outline" id="createItemNavBtn">+ Объявление</button>
                        <button class="btn-outline" id="logoutNavBtn">Выйти</button>
                    </div>
                `;
                document.getElementById('moderationNavBtn')?.addEventListener('click', () => showModerationPage());
                document.getElementById('myItemsNavBtn')?.addEventListener('click', () => showMyItemsPage());
                document.getElementById('bookingsNavBtn')?.addEventListener('click', () => showIncomingBookingsPage());
                document.getElementById('chatsNavBtn')?.addEventListener('click', () => showChatsPage());
                document.getElementById('profileNavBtn')?.addEventListener('click', () => showProfilePage());
                document.getElementById('createItemNavBtn')?.addEventListener('click', () => showCreatePage());
                document.getElementById('logoutNavBtn')?.addEventListener('click', logout);
                refreshNavCounters().then((counters) => {
                    const chatsBadge = document.getElementById('chatsNavBadge');
                    if (chatsBadge) {
                        chatsBadge.style.display = counters.chats ? '' : 'none';
                        chatsBadge.textContent = formatCompactCount(counters.chats);
                    }
                    const bookingsBadge = document.getElementById('bookingsNavBadge');
                    if (bookingsBadge) {
                        bookingsBadge.style.display = counters.bookings ? '' : 'none';
                        bookingsBadge.textContent = formatCompactCount(counters.bookings);
                    }
                });
            } else {
                closeNotificationsSocket();
                authSection.innerHTML = `<a href="#" class="btn-outline" id="loginNavBtn">Войти</a><a href="#" class="btn-primary" id="registerNavBtn">Регистрация</a>`;
                document.getElementById('loginNavBtn')?.addEventListener('click', (e) => { e.preventDefault(); showLoginPage(); });
                document.getElementById('registerNavBtn')?.addEventListener('click', (e) => { e.preventDefault(); showRegisterPage(); });
            }
        }

        

function renderModerationRequestCard(request) {
            const item = request.item || {};
            const user = request.submitted_by || {};
            const category = item.category_name || request.item_snapshot?.category || 'Без категории';
            const actionLabel = request.action === 'update' ? 'Редактирование' : 'Создание';
            const images = Array.isArray(item.images) ? item.images : [];

            return `
                <div class="booking-request-card" data-request-id="${request.id}">
                    <div class="booking-request-top">
                        <div>
                            <div class="booking-request-title">${escapeHtml(item.title || request.item_snapshot?.title || 'Без названия')}</div>
                            <div class="booking-request-meta">
                                <div>Тип заявки: ${escapeHtml(actionLabel)}</div>
                                <div>Категория: ${escapeHtml(category)}</div>
                                <div>Цена: ${escapeHtml(item.price_per_day || request.item_snapshot?.price_per_day || '0')} ₽/день</div>
                                <div>Дата заявки: ${escapeHtml(formatDateRu(request.created_at))}</div>
                            </div>
                        </div>
                    </div>
                    <div class="booking-request-meta" style="margin-top:12px;">
                        <div><strong>Описание:</strong> ${escapeHtml(item.description || request.item_snapshot?.description || '—')}</div>
                        <div><strong>Пользователь:</strong> ${escapeHtml(user.username || '—')}</div>
                        <div><strong>Email:</strong> ${escapeHtml(user.email || '—')}</div>
                        <div><strong>Телефон:</strong> ${escapeHtml(user.phone || '—')}</div>
                        <div><strong>Тип пользователя:</strong> ${escapeHtml(user.user_type || '—')}</div>
                        <div><strong>ФИО / организация:</strong> ${escapeHtml(user.full_name || user.entrepreneur_name || user.company_name || '—')}</div>
                        <div><strong>ИНН:</strong> ${escapeHtml(user.inn || '—')}</div>
                        <div><strong>КПП:</strong> ${escapeHtml(user.kpp || '—')}</div>
                        <div><strong>ОГРНИП:</strong> ${escapeHtml(user.ogrnip || '—')}</div>
                        <div><strong>Паспорт:</strong> ${escapeHtml([user.passport_series, user.passport_number].filter(Boolean).join(' ') || '—')}</div>
                    </div>
                    ${images.length ? `
                        <div class="image-preview">
                            ${images.map(img => `<div class="preview-item"><img src="${escapeHtml(img.image)}" alt=""></div>`).join('')}
                        </div>
                    ` : ''}
                    <div class="form-group" style="margin-top:16px;">
                        <label>Причина отказа</label>
                        <textarea class="moderation-reason" rows="3" placeholder="Заполните, если отказываете"></textarea>
                    </div>
                    <div class="form-actions wrap">
                        <button class="btn-primary" data-action="approve" data-id="${request.id}" type="button">Отправить</button>
                        <button class="btn-danger" data-action="reject" data-id="${request.id}" type="button">Отказать</button>
                    </div>
                </div>
            `;
        }

        async 

function showModerationPage() {
            if (!isAuthenticated() || localStorage.getItem('is_superuser') !== '1') {
                alert('Раздел доступен только администратору.');
                return;
            }

            const requests = await fetchPaginatedResults('/items/moderation-requests/?status=pending');
            document.getElementById('app').innerHTML = `
                <div class="bookings-page"><div class="bookings-card">
                    <div class="back-button" id="backToMainFromModeration">← Назад</div>
                    <div class="bookings-title">🛡️ Модерация объявлений</div>
                    <div class="bookings-sub">Проверьте данные объявления и пользователя, затем одобрите публикацию или укажите причину отказа.</div>
                    <div id="moderationContent">
                        ${requests.length ? requests.map(renderModerationRequestCard).join('') : '<div class="empty-message">Новых заявок на модерацию нет.</div>'}
                    </div>
                </div></div>
            `;

            document.getElementById('backToMainFromModeration')?.addEventListener('click', () => showMainPage());
            document.querySelectorAll('[data-action="approve"]').forEach(btn => {
                btn.addEventListener('click', async () => {
                    const response = await apiRequest(`/items/moderation-requests/${btn.dataset.id}/approve/`, { method: 'POST', body: JSON.stringify({}) });
                    if (!response.ok) {
                        alert('❌ ' + await readApiError(response, 'Не удалось одобрить заявку.'));
                        return;
                    }
                    alert('✅ Объявление одобрено и опубликовано.');
                    showModerationPage();
                });
            });
            document.querySelectorAll('[data-action="reject"]').forEach(btn => {
                btn.addEventListener('click', async () => {
                    const card = btn.closest('[data-request-id]');
                    const reason = card?.querySelector('.moderation-reason')?.value?.trim() || '';
                    if (!reason) {
                        alert('❌ Укажите причину отказа.');
                        return;
                    }
                    const response = await apiRequest(`/items/moderation-requests/${btn.dataset.id}/reject/`, {
                        method: 'POST',
                        body: JSON.stringify({ reason })
                    });
                    if (!response.ok) {
                        alert('❌ ' + await readApiError(response, 'Не удалось отказать заявке.'));
                        return;
                    }
                    alert('✅ Заявка отклонена. Объявление удалено, пользователю отправлено письмо.');
                    showModerationPage();
                });
            });
        }

        async 

function getReviewSummaryMarkup(booking) {
            const review = booking?.review;
            if (!review) return '';

            const safeComment = review.comment
                ? escapeHtml(review.comment)
                : 'Вы поставили оценку без текста.';

            return `
                <div class="booking-review-note">
                    <strong>Ваш отзыв:</strong> ${'★'.repeat(Number(review.rating || 0))}${'☆'.repeat(Math.max(0, 5 - Number(review.rating || 0)))}
                    <div style="margin-top:6px;">${safeComment}</div>
                </div>
            `;
        }

        

function formatReturnStatus(status) {
            const map = {
                none: '—', requested: 'Запрошен', approved: 'Одобрен',
                rejected: 'Отклонён', completed: 'Выполнен',
            };
            return map[status] || '—';
        }

        

function closeLegalModal(overlayId) {
            document.getElementById(overlayId)?.classList.remove('active');
        }
        ['termsModalClose', 'termsModalAccept'].forEach(id => {
            document.getElementById(id)?.addEventListener('click', () => closeLegalModal('termsModalOverlay'));
        });
        ['privacyModalClose', 'privacyModalAccept'].forEach(id => {
            document.getElementById(id)?.addEventListener('click', () => closeLegalModal('privacyModalOverlay'));
        });
        document.getElementById('termsModalOverlay')?.addEventListener('click', function(e) {
            if (e.target === this) closeLegalModal('termsModalOverlay');
        });
        document.getElementById('privacyModalOverlay')?.addEventListener('click', function(e) {
            if (e.target === this) closeLegalModal('privacyModalOverlay');
        });
        document.getElementById('handoverOverlay').addEventListener('click', function(e) {
            if (e.target === this) closeHandoverModal();
        });

        document.getElementById('handoverConfirmBtn').addEventListener('click', async function() {
            if (!handoverActiveCallback) return;
            const photoInput = document.getElementById('handoverPhotoInput');
            const reason = document.getElementById('handoverReasonInput').value.trim();
            const photo = photoInput.files[0] || null;
            this.disabled = true;
            this.textContent = 'Загрузка...';
            try {
                await handoverActiveCallback({ photo, reason });
            } finally {
                this.disabled = false;
            }
        });

        // --- API helpers ---
        async 

function confirmOwnerReturn(bookingId, photo) {
            const formData = new FormData();
            if (photo) formData.append('photo', photo);
            return await apiRequest(`/bookings/${bookingId}/confirm_owner_return/`, { method: 'POST', body: formData });
        }

        async 

function getOwnerDashboardStats(items, bookings) {
            const today = getTodayDateString();
            const paidBookings = bookings.filter(booking => booking.payment_status === 'paid');
            const currentBookings = bookings.filter(booking =>
                ['pending', 'confirmed'].includes(booking.status) && booking.end_date >= today
            );
            const pastBookings = bookings.filter(booking =>
                booking.status === 'completed' ||
                booking.status === 'cancelled' ||
                booking.end_date < today
            );

            // Чистая прибыль арендодателя:
            // rent_amount — сумма аренды с 20% наценкой платформы, НО арендодатель получает
            // только базовую цену (без 20% и без 5% сервисного сбора, без залога).
            // Если rent_amount есть — берём его и вычитаем 20% наценку.
            // Иначе пересчитываем из total_price: убираем deposit_amount, platform_fee.
            const totalRevenue = paidBookings.reduce((sum, booking) => {
                if (booking.rent_amount != null) {
                    // rent_amount = base_price * days * 1.20 → чистая = rent_amount / 1.20
                    const ownerNet = Number(booking.rent_amount) / 1.20;
                    return sum + Math.round(ownerNet * 100) / 100;
                }
                // Fallback: total_price минус залог и 5% сбор
                const total = Number(booking.total_price || 0);
                const deposit = Number(booking.deposit_amount || 0);
                const fee = Number(booking.platform_fee || 0);
                const rentWithMarkup = total - deposit - fee;
                const ownerNet = rentWithMarkup / 1.20;
                return sum + Math.round(ownerNet * 100) / 100;
            }, 0);

            return {
                itemsCount: items.length,
                currentBookingsCount: currentBookings.length,
                pastBookingsCount: pastBookings.length,
                totalRevenue,
            };
        }

        

function autosizeTextarea(el) {
                el.style.height = 'auto';
                el.style.height = Math.min(el.scrollHeight, 120) + 'px';
            }

            autosizeTextarea(input);
            input.addEventListener('input', () => autosizeTextarea(input));

            attachBtn.addEventListener('click', () => chatImageInput.click());
            chatImageInput.addEventListener('change', (e) => {
                const file = e.target.files?.[0] || null;
                if (!file) return;

                if (!file.type.startsWith('image/')) {
                    alert('Можно прикрепить только изображение');
                    chatImageInput.value = '';
                    return;
                }

                const maxBytes = 8 * 1024 * 1024;
                if (file.size > maxBytes) {
                    alert('Слишком большой файл. Максимум 8 MB.');
                    chatImageInput.value = '';
                    return;
                }

                setChatAttachmentPreview(file);
            });

            removeAttachBtn.addEventListener('click', () => {
                chatImageInput.value = '';
                resetChatAttachmentPreview();
            });

            window.sendMessage = async () => {
                const text = input.value;
                const result = await sendChatMessageWithOptionalImage(conversationId, text);
                if (!result?.ok) return;

                if (result.shouldRenderLocally && result.message) {
                    appendMessageToChat(result.message, messagesContainer);
                }

                input.value = '';
                autosizeTextarea(input);
                input.focus();
            };

            input.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    window.sendMessage();
                }
            });

            sendBtn.addEventListener('click', () => window.sendMessage());

            const token = getAccessToken();
            const wsUrl = `${WS_BASE}/chat/${conversationId}/?token=${token}`;
            if (wsConnection) wsConnection.close();
            wsConnection = new WebSocket(wsUrl);

            wsConnection.onopen = () => {
                sendRealtimeMarkRead();
            };

            wsConnection.onmessage = (event) => {
                const data = JSON.parse(event.data);
                if (data.event === 'messages_read') {
                    applyMessagesRead(data.message_ids || []);
                    refreshNavCounters();
                    return;
                }

                if (data.event === 'new_message' && data.message) {
                    const message = data.message;
                    messagesContainer.insertAdjacentHTML('beforeend', renderSingleMessage(message, message.sender_id == localStorage.getItem('user_id')));
                    messagesContainer.scrollTop = messagesContainer.scrollHeight;
                    refreshNavCounters();

                    if (message.sender_id != localStorage.getItem('user_id') && canMarkActiveChatAsRead()) {
                        sendRealtimeMarkRead();
                    }
                }
            };

            activeChatFocusHandler = () => sendRealtimeMarkRead();
            activeChatVisibilityHandler = () => {
                if (document.visibilityState === 'visible') sendRealtimeMarkRead();
            };
            window.addEventListener('focus', activeChatFocusHandler);
            document.addEventListener('visibilitychange', activeChatVisibilityHandler);

            document.getElementById('backToChatsFromChat')?.addEventListener('click', () => {
                teardownActiveChatState();
                resetChatAttachmentPreview();
                showChatsPage();
            });

            if (messagesContainer) messagesContainer.scrollTop = messagesContainer.scrollHeight;
            input.focus();
        }

        

function showCreatePage() {
            if (!isAuthenticated()) { alert('Пожалуйста, войдите в систему'); showLoginPage(); return; }
            selectedMediaFiles = [];

            const categories = await ensureServerCategoriesLoaded();
            const categoryOptions = categories.length
                ? (`<option value="">Без категории</option>` + categories.map(c => `<option value="${c.id}">${escapeHtml(c.name)}</option>`).join(''))
                : (`<option value="">Без категории</option><option value="" disabled>— Категории не загрузились —</option>`);

            document.getElementById('app').innerHTML = `
                <div class="create-page"><div class="create-card">
                    <div class="back-button" id="backToMainFromCreate">← Назад</div>
                    <div class="create-title">➕ Новое объявление</div>
                    <div class="create-sub">Расскажите о вещи, которую хотите сдать в аренду</div>
                    <form id="createItemForm">
                        <div class="form-group"><label>Название товара *</label><input type="text" id="itemName" placeholder="Например: Дрель Makita" required></div>
                        <div class="form-group"><label>Описание</label><textarea id="itemDesc" rows="4" placeholder="Опишите состояние, характеристики..."></textarea></div>
                        <div class="form-group"><label>Цена за день (₽) *</label><input type="number" id="itemPrice" placeholder="500" required><small style="display:block;margin-top:6px;color:#b45309;font-size:12px">⚠️ Внимание. Уведомляем Вас о том, что будут добавлены 20% от вашей цены, которые покроют комиссию.</small></div>
                        <div class="form-group"><label>Залог (₽)</label><input type="number" id="itemDeposit" placeholder="0" min="0"><small style="display:block;margin-top:6px;color:#5a8090;font-size:12px">💡 Сумма залога, которую арендатор оплачивает вместе с арендой и получает обратно после возврата вещи.</small></div>
                        <div class="form-group"><label>Категория</label>
                            <select id="itemCategory">${categoryOptions}</select>
                        </div>
                        <div class="form-group"><label>Фотографии</label>
                            <label class="file-input-label">🖼 Выбрать фото<input type="file" id="itemMedia" accept="image/*" multiple></label>
                            <div class="media-picker-note">Можно добавить несколько фотографий.</div>
                            <div id="imagePreview" class="image-preview"></div>
                        </div>
                        <div class="form-actions">
                            <button type="submit" class="btn-primary">📤 Опубликовать</button>
                        </div>
                    </form>
                </div></div>
            `;

            const fileInput = document.getElementById('itemMedia');
            fileInput.addEventListener('change', (e) => {
                appendSelectedMediaFiles(e.target.files);
                updateImagePreview();
                fileInput.value = '';
            });

            document.getElementById('createItemForm').addEventListener('submit', async (e) => {
                e.preventDefault();
                const formData = {
                    name: document.getElementById('itemName').value,
                    description: document.getElementById('itemDesc').value,
                    price_per_day: parseInt(document.getElementById('itemPrice').value, 10),
                    deposit: parseInt(document.getElementById('itemDeposit').value || '0', 10),
                    category: document.getElementById('itemCategory').value
                };
                if (!formData.name || !formData.price_per_day) {
                    alert('Заполните название и цену');
                    return;
                }
                await createItemWithImages(formData, selectedMediaFiles);
            });

            document.getElementById('backToMainFromCreate')?.addEventListener('click', () => showMainPage());
        }

        async 

function appendSelectedMediaFiles(fileList) {
            const newFiles = Array.from(fileList || []).filter(file => (file.type || '').startsWith('image/'));
            if (!newFiles.length) return;

            const existingKeys = new Set(
                selectedMediaFiles.map(file => `${file.name}:${file.size}:${file.lastModified}`)
            );

            for (const file of newFiles) {
                const fileKey = `${file.name}:${file.size}:${file.lastModified}`;
                if (!existingKeys.has(fileKey)) {
                    selectedMediaFiles.push(file);
                    existingKeys.add(fileKey);
                }
            }
        }

        

function showRegValidationError(msg) {
                    let errEl = document.getElementById('regValidationError');
                    if (!errEl) {
                        errEl = document.createElement('div');
                        errEl.id = 'regValidationError';
                        errEl.className = 'error-message-box';
                        errEl.style.marginBottom = '12px';
                        document.querySelector('#registerForm .auth-btn[type=submit]').before(errEl);
                    }
                    errEl.textContent = msg;
                    errEl.style.display = '';
                    errEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    setTimeout(() => { if (errEl) errEl.style.display = 'none'; }, 6000);
                }

                const success = await register(
                    document.getElementById('regUsername').value,
                    document.getElementById('regEmail').value,
                    password,
                    userType,
                    extraProfileData,
                    emailCode
                );
                if (success) showMainPage();
            });

            document.getElementById('switchToLogin')?.addEventListener('click', (e) => { e.preventDefault(); showLoginPage(); });

            // ── Consent checkbox: enable/disable submit button ──────────
            const regConsent = document.getElementById('regConsentCheckbox');
            const regSubmitBtn = document.getElementById('regSubmitBtn');
            if (regConsent && regSubmitBtn) {
                regConsent.addEventListener('change', () => {
                    regSubmitBtn.disabled = !regConsent.checked;
                });
            }

            // ── Open terms / privacy modals ─────────────────────────────
            document.getElementById('openTermsLink')?.addEventListener('click', (e) => {
                e.preventDefault();
                document.getElementById('termsModalOverlay')?.classList.add('active');
            });
            document.getElementById('openTermsLink')?.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); document.getElementById('termsModalOverlay')?.classList.add('active'); }
            });
            document.getElementById('openPrivacyLink')?.addEventListener('click', (e) => {
                e.preventDefault();
                document.getElementById('privacyModalOverlay')?.classList.add('active');
            });
            document.getElementById('openPrivacyLink')?.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); document.getElementById('privacyModalOverlay')?.classList.add('active'); }
            });
            document.getElementById('backToMainFromRegister')?.addEventListener('click', () => showMainPage());
        }

        

function showMainPage() {
            closeActiveChatConnection();
            const categories = await getDisplayCategories();
            const categoryIds = new Set(categories.map(cat => String(cat.id)));
            if (!categoryIds.has(String(currentCategory))) {
                currentCategory = 'all';
            }

            document.getElementById('app').innerHTML = `
                <div class="header">
                    <div class="container header-inner">
                        <span class="logo" id="logoBtn">Аренда вещей</span>
                        <div id="authSection" class="auth-buttons"></div>
                    </div>
                </div>
                <div class="search-bar-section">
                    <div class="container">
                        <div class="search-bar-inner">
                            <span class="search-bar-icon">
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                            </span>
                            <input
                                type="text"
                                id="searchInput"
                                class="search-bar-input"
                                placeholder="Поиск объявлений..."
                                value="${escapeHtml(currentSearchQuery)}"
                                autocomplete="off"
                            />
                            <button id="searchClearBtn" class="search-bar-clear ${currentSearchQuery ? 'visible' : ''}" type="button" title="Очистить">×</button>
                            <button id="searchBtn" class="search-bar-btn" type="button">Найти</button>
                        </div>
                        ${currentSearchQuery ? `<div class="search-results-label" id="searchResultsLabel">Результаты поиска: «${escapeHtml(currentSearchQuery)}»</div>` : ''}
                    </div>
                </div>
                <div class="categories">
                    <div class="container">
                        <ul class="cats-list" id="categoriesList">
                            ${categories.map(cat => `<li data-category="${cat.id}" class="${String(cat.id) === String(currentCategory) ? 'active' : ''}">${escapeHtml(cat.name)}</li>`).join('')}
                        </ul>
                    </div>
                </div>
                <div class="availability-toolbar">
                    <div class="container availability-inner">
                        <button class="availability-chip ${availabilityFilterMode === 'all' ? 'active' : ''}" data-availability="all" type="button">Все даты</button>
                        <button class="availability-chip ${availabilityFilterMode === 'today' ? 'active' : ''}" data-availability="today" type="button">Свободно сегодня</button>
                        <button class="availability-chip ${availabilityFilterMode === 'tomorrow' ? 'active' : ''}" data-availability="tomorrow" type="button">Свободно завтра</button>
                        <button class="availability-chip ${availabilityFilterMode === 'custom' ? 'active' : ''}" data-availability="custom" type="button">Выбрать даты</button>
                        <div class="availability-custom">
                            <input type="date" id="availabilityStartDate" value="${availabilityFilterStart}">
                            <input type="date" id="availabilityEndDate" value="${availabilityFilterEnd}">
                            <button class="btn-outline" id="applyAvailabilityFilterBtn" type="button">Применить</button>
                            <button class="btn-outline" id="resetAvailabilityFilterBtn" type="button">Сбросить</button>
                        </div>
                    </div>
                </div>
                <div class="container">
                    <div id="productsContainer" class="products"><div class="loading">Загрузка товаров...</div></div>
                    <div id="pagination" class="pagination"></div>
                </div>
                <footer>Сайт создан в рамках выполнения выпускной квалификационной работы, не является коммерческим проектом и не представляет собой публичную оферту (ст. 437 ГК РФ). Администрация сайта не несёт ответственности за сделки, заключённые между пользователями, а также за достоверность и обработку их персональных данных.</footer>
            `;
            updateNavBar();
            startNotificationPolling();

            document.getElementById('logoBtn')?.addEventListener('click', () => showMainPage());
            document.querySelectorAll('.cats-list li').forEach(cat => {
                cat.addEventListener('click', () => {
                    document.querySelectorAll('.cats-list li').forEach(c => c.classList.remove('active'));
                    cat.classList.add('active');
                    currentCategory = cat.dataset.category;
                    loadProducts(1);
                });
            });

            document.querySelectorAll('[data-availability]').forEach(btn => {
                btn.addEventListener('click', () => {
                    availabilityFilterMode = btn.dataset.availability;
                    document.querySelectorAll('[data-availability]').forEach(chip => chip.classList.toggle('active', chip === btn));
                    if (availabilityFilterMode === 'today' || availabilityFilterMode === 'tomorrow' || availabilityFilterMode === 'all') {
                        loadProducts(1);
                    }
                });
            });

            document.getElementById('applyAvailabilityFilterBtn')?.addEventListener('click', () => {
                availabilityFilterMode = 'custom';
                availabilityFilterStart = document.getElementById('availabilityStartDate')?.value || '';
                availabilityFilterEnd = document.getElementById('availabilityEndDate')?.value || '';
                document.querySelectorAll('[data-availability]').forEach(chip => chip.classList.toggle('active', chip.dataset.availability === 'custom'));
                loadProducts(1);
            });

            document.getElementById('resetAvailabilityFilterBtn')?.addEventListener('click', () => {
                availabilityFilterMode = 'all';
                availabilityFilterStart = '';
                availabilityFilterEnd = '';
                showMainPage();
            });

            // Search bar events
            const searchInput = document.getElementById('searchInput');
            const searchBtn = document.getElementById('searchBtn');
            const searchClearBtn = document.getElementById('searchClearBtn');

            

function doSearch() {
                const q = (searchInput?.value || '').trim();
                currentSearchQuery = q;
                searchClearBtn?.classList.toggle('visible', !!q);
                const label = document.getElementById('searchResultsLabel');
                if (label) {
                    label.textContent = q ? `Результаты поиска: «${q}»` : '';
                    label.style.display = q ? '' : 'none';
                } else if (q) {
                    const lbl = document.createElement('div');
                    lbl.id = 'searchResultsLabel';
                    lbl.className = 'search-results-label';
                    lbl.textContent = `Результаты поиска: «${q}»`;
                    searchInput?.closest('.container')?.appendChild(lbl);
                }
                loadProducts(1);
            }

            searchBtn?.addEventListener('click', doSearch);
            searchInput?.addEventListener('keydown', (e) => { if (e.key === 'Enter') doSearch(); });
            searchInput?.addEventListener('input', () => {
                searchClearBtn?.classList.toggle('visible', !!(searchInput.value));
            });
            searchClearBtn?.addEventListener('click', () => {
                if (searchInput) searchInput.value = '';
                currentSearchQuery = '';
                searchClearBtn.classList.remove('visible');
                const label = document.getElementById('searchResultsLabel');
                if (label) label.style.display = 'none';
                loadProducts(1);
            });

            loadProducts(1);
        }

        document.getElementById('rentModalCloseBtn')?.addEventListener('click', closeRentalModal);
        document.getElementById('createBookingBtn')?.addEventListener('click', createBookingRequest);
        document.getElementById('openContractBtn')?.addEventListener('click', openContractFromRentalModal);
        document.getElementById('startPaymentBtn')?.addEventListener('click', startBookingPayment);
        document.getElementById('paymentLinkBtn')?.addEventListener('click', openSbpDemoModal);
        document.getElementById('rentModalOverlay')?.addEventListener('click', (e) => {
            if (e.target.id === 'rentModalOverlay') closeRentalModal();
        });
        document.getElementById('sbpDemoCancelBtn')?.addEventListener('click', closeSbpDemoModal);
        document.getElementById('sbpDemoPayBtn')?.addEventListener('click', async () => {
            const payButton = document.getElementById('sbpDemoPayBtn');
            const messageBox = document.getElementById('sbpDemoMessage');

            if (payButton) {
                payButton.disabled = true;
                payButton.textContent = 'Проводим оплату...';
            }
            if (messageBox) {
                messageBox.innerHTML = '<div class="rent-info">Имитируем подтверждение оплаты через СБП...</div>';
            }

            if (currentPaymentType === 'deposit') {
                await confirmDepositPayment();
            } else {
                await confirmBookingPayment();
            }
        });
        document.getElementById('sbpDemoOverlay')?.addEventListener('click', (e) => {
            if (e.target.id === 'sbpDemoOverlay') closeSbpDemoModal();
        });
        document.getElementById('contractModalOverlay')?.addEventListener('click', (e) => {
            if (e.target.id === 'contractModalOverlay') closeContractModal();
        });
        document.getElementById('itemPreviewCloseBtn')?.addEventListener('click', closeItemPreview);
        document.getElementById('itemPreviewOverlay')?.addEventListener('click', (e) => {
            if (e.target.id === 'itemPreviewOverlay') closeItemPreview();
        });
        document.getElementById('supportChatToggleBtn')?.addEventListener('click', toggleSupportChat);
        document.getElementById('supportChatCloseBtn')?.addEventListener('click', closeSupportChat);

        showMainPage();
    