function sanitizeToastMessage(message, fallback = 'Произошла ошибка. Попробуйте ещё раз.') {
            const raw = (message ?? '').toString().trim();
            if (!raw) return fallback;

            const withoutIcon = raw.replace(/^[❌✅]\s*/, '').trim();
            const looksLikeHtml = /<\/?[a-z][\s\S]*>/i.test(raw) || /<!doctype html/i.test(raw);
            const looksLikeDjangoDebug = /You're seeing this error because you have DEBUG/i.test(raw)
                || /Request Method:/i.test(raw)
                || /WSGI_APPLICATION/i.test(raw)
                || /Traceback/i.test(raw);

            if (looksLikeHtml || looksLikeDjangoDebug) {
                return fallback;
            }

            const translated = translateServerMessage(withoutIcon, withoutIcon || fallback);
            if (!translated || /<\/?[a-z][\s\S]*>/i.test(translated)) return fallback;

            const prefix = raw.match(/^[❌✅]\s*/)?.[0] || '';
            return `${prefix}${translated}`;
        }

        

function closeActiveChatConnection() {
            if (wsConnection) {
                wsConnection.close();
                wsConnection = null;
            }
        }

        

function teardownActiveChatState() {
            closeActiveChatConnection();
            if (activeChatFocusHandler) {
                window.removeEventListener('focus', activeChatFocusHandler);
                activeChatFocusHandler = null;
            }
            if (activeChatVisibilityHandler) {
                document.removeEventListener('visibilitychange', activeChatVisibilityHandler);
                activeChatVisibilityHandler = null;
            }
            activeChatConversationId = null;
        }

        

function canMarkActiveChatAsRead() {
            return document.visibilityState === 'visible' && document.hasFocus();
        }

        

function applyMessagesRead(messageIds) {
            (messageIds || []).forEach((messageId) => {
                const row = document.querySelector(`.message-row[data-message-id="${messageId}"]`);
                if (!row) return;

                row.dataset.read = 'true';
                const indicator = row.querySelector('.message-read-indicator');
                if (indicator) indicator.remove();
            });
        }

        

function translateServerMessage(message, fallback = 'Произошла ошибка.') {
            const raw = String(message || '').trim();
            if (!raw) return fallback;

            const exactMap = {
                'This field is required.': 'Это поле обязательно.',
                'This field may not be blank.': 'Поле не должно быть пустым.',
                'This field may not be null.': 'Поле не должно быть пустым.',
                'Not found.': 'Ничего не найдено.',
                'Unsupported media type': 'Неподдерживаемый тип файла.',
                'Invalid token.': 'Недействительный токен.',
                'Token is invalid or expired': 'Сессия истекла. Войдите снова.',
                'No active account found with the given credentials': 'Неверный логин или пароль.',
                'A user with that username already exists.': 'Пользователь с таким именем уже существует.',
                'user with this email already exists.': 'Пользователь с таким email уже существует.',
                'Authentication credentials were not provided.': 'Войдите в систему.',
                'Authentication required': 'Войдите в систему.',
                'You are not the owner of this item': 'Это действие доступно только владельцу объявления.',
                'Owner cannot review their own item': 'Нельзя оставить отзыв на своё объявление.',
                'Invalid item id.': 'Объявление не найдено.',
                'Server Error (500)': 'Ошибка сервера. Попробуйте ещё раз.'
            };

            if (exactMap[raw]) return exactMap[raw];

            let match = raw.match(/^Ensure this field has no more than (\d+) characters\.?$/i)
                || raw.match(/^Ensure this field has at most (\d+) characters\.?$/i);
            if (match) return `Максимум ${match[1]} символов.`;

            match = raw.match(/^Ensure this field has at least (\d+) characters\.?$/i);
            if (match) return `Минимум ${match[1]} символов.`;

            if (/invalid email/i.test(raw)) return 'Некорректный email.';
            if (/already exists/i.test(raw)) return 'Такая запись уже существует.';
            if (/may not be blank/i.test(raw)) return 'Поле не должно быть пустым.';
            if (/required/i.test(raw)) return 'Это поле обязательно.';
            if (/not found/i.test(raw)) return 'Ничего не найдено.';
            if (/failed to fetch|networkerror|load failed|network request failed/i.test(raw)) return 'Нет соединения с сервером.';
            if (/permission|not authorized|forbidden|credentials were not provided/i.test(raw)) return 'Недостаточно прав для этого действия.';
            if (/invalid item/i.test(raw)) return 'Объявление не найдено.';
            if (/server error|internal server error|traceback|wsgi_application/i.test(raw)) {
                return fallback || 'Ошибка сервера. Попробуйте ещё раз.';
            }

            return raw;
        }

        async 

function extractApiErrorMessage(data, fallback = 'Произошла ошибка.') {
            if (!data) return fallback;

            if (typeof data === 'string') {
                return translateServerMessage(data, fallback);
            }

            if (Array.isArray(data)) {
                return translateServerMessage(data[0], fallback);
            }

            const priorityKeys = ['detail', 'error', 'message', 'non_field_errors'];
            for (const key of priorityKeys) {
                if (!data[key]) continue;
                const value = Array.isArray(data[key]) ? data[key][0] : data[key];
                return translateServerMessage(value, fallback);
            }

            const fieldLabels = {
                username: 'Имя пользователя',
                email: 'Email',
                password: 'Пароль',
                user_type: 'Тип пользователя',
                full_name: 'ФИО',
                entrepreneur_name: 'Наименование ИП',
                company_name: 'Наименование организации',
                passport_series: 'Серия паспорта',
                passport_number: 'Номер паспорта',
                inn: 'ИНН',
                ogrnip: 'ОГРНИП',
                kpp: 'КПП',
                owner: 'Владелец',
                title: 'Название',
                description: 'Описание',
                price_per_day: 'Цена за день',
                category: 'Категория',
                image: 'Изображение',
                video: 'Видео',
                item: 'Товар'
            };

            for (const [key, value] of Object.entries(data)) {
                if (value == null) continue;
                const label = fieldLabels[key] || key;
                const normalized = Array.isArray(value) ? value[0] : value;
                return `${label}: ${translateServerMessage(normalized, fallback)}`;
            }

            return fallback;
        }

        

function resetChatAttachmentPreview() {
            chatSelectedImageFile = null;
            if (chatSelectedImagePreviewUrl) {
                URL.revokeObjectURL(chatSelectedImagePreviewUrl);
                chatSelectedImagePreviewUrl = null;
            }
            const box = document.getElementById('chatAttachmentPreview');
            if (!box) return;
            box.classList.remove('active');
            const img = document.getElementById('chatAttachmentThumbImg');
            if (img) img.src = '';
            const title = document.getElementById('chatAttachmentTitle');
            if (title) title.textContent = '';
            const sub = document.getElementById('chatAttachmentSub');
            if (sub) sub.textContent = '';
        }

        

function setChatAttachmentPreview(file) {
            chatSelectedImageFile = file || null;
            const box = document.getElementById('chatAttachmentPreview');
            if (!box) return;

            if (!file) {
                resetChatAttachmentPreview();
                return;
            }

            if (chatSelectedImagePreviewUrl) URL.revokeObjectURL(chatSelectedImagePreviewUrl);
            chatSelectedImagePreviewUrl = URL.createObjectURL(file);

            const img = document.getElementById('chatAttachmentThumbImg');
            if (img) img.src = chatSelectedImagePreviewUrl;

            const title = document.getElementById('chatAttachmentTitle');
            if (title) title.textContent = file.name || 'Изображение';

            const sub = document.getElementById('chatAttachmentSub');
            if (sub) sub.textContent = `${formatBytes(file.size)} • ${file.type || 'image/*'}`;

            box.classList.add('active');
        }

        async 

function sendChatMessageWithOptionalImage(conversationId, text) {
            const hasText = !!(text || '').trim();
            const hasImage = !!chatSelectedImageFile;
            if (!hasText && !hasImage) return { ok: false };

            if (hasImage) {
                const token = getAccessToken();
                const fd = new FormData();
                if (hasText) fd.append('text', (text || '').trim());
                fd.append('image', chatSelectedImageFile);

                const resp = await fetch(`${API_BASE}/chats/conversations/${conversationId}/messages/`, {
                    method: 'POST',
                    headers: { 'Authorization': `Bearer ${token}` },
                    body: fd
                });

                const respText = await resp.text().catch(() => '');
                if (!resp.ok) {
                    console.error('❌ chat image upload failed', resp.status, respText);
                    alert(`❌ Не удалось отправить изображение (${resp.status})`);
                    return { ok: false };
                }

                let data = null;
                try {
                    data = respText ? JSON.parse(respText) : null;
                } catch (error) {}

                resetChatAttachmentPreview();
                return {
                    ok: true,
                    message: data,
                    shouldRenderLocally: !(wsConnection && wsConnection.readyState === WebSocket.OPEN),
                };
            }

            if (wsConnection && wsConnection.readyState === WebSocket.OPEN) {
                wsConnection.send(JSON.stringify({ message: (text || '').trim() }));
                return { ok: true, shouldRenderLocally: false };
            }

            try {
                const response = await apiRequest(`/chats/conversations/${conversationId}/messages/`, {
                    method: 'POST',
                    body: JSON.stringify({ text: (text || '').trim() })
                });
                if (!response.ok) {
                    const message = await readApiError(response, 'Не удалось отправить сообщение.');
                    alert('❌ ' + message);
                    return { ok: false };
                }

                const data = await response.json().catch(() => ({}));
                return { ok: true, message: data, shouldRenderLocally: true };
            } catch (error) {
                alert('❌ Нет соединения с сервером');
                return { ok: false };
            }
        }

        async 

function getConversations() {
            try {
                const response = await apiRequest('/chats/conversations/');
                if (response.ok) return await response.json();
                return [];
            } catch (error) { return []; }
        }

        async 

function renderSupportMessages() {
            const container = document.getElementById('supportChatMessages');
            if (!container) return;

            const activeQuestion = supportFaq.find(item => item.id === supportActiveQuestionId) || null;
            let html = `
                <div class="support-message bot">
                    <div class="support-answer-title">Чем могу помочь?</div>
                    <div>Выберите один из готовых вопросов, и я пришлю понятную пошаговую инструкцию по сайту.</div>
                </div>
            `;

            if (activeQuestion) {
                html += `
                    <div class="support-message user">${escapeHtml(activeQuestion.question)}</div>
                    <div class="support-message bot">
                        <div class="support-answer-title">${escapeHtml(activeQuestion.answer_title || 'Инструкция')}</div>
                        <ol class="support-answer-steps">
                            ${(activeQuestion.steps || []).map(step => `<li>${escapeHtml(step)}</li>`).join('')}
                        </ol>
                    </div>
                `;
            }

            container.innerHTML = html;
            container.scrollTop = container.scrollHeight;
        }

        

function openSupportChat() {
            await ensureSupportFaqLoaded();
            if (!supportActiveQuestionId && supportFaq.length) {
                supportActiveQuestionId = supportFaq[0].id;
            }

            const panel = document.getElementById('supportChatPanel');
            if (!panel) return;

            panel.classList.add('open');
            panel.setAttribute('aria-hidden', 'false');
            renderSupportQuestions();
            renderSupportMessages();
        }

        

function closeSupportChat() {
            const panel = document.getElementById('supportChatPanel');
            if (!panel) return;
            panel.classList.remove('open');
            panel.setAttribute('aria-hidden', 'true');
        }

        async 

function toggleSupportChat() {
            const panel = document.getElementById('supportChatPanel');
            if (!panel) return;

            if (panel.classList.contains('open')) {
                closeSupportChat();
                return;
            }

            await openSupportChat();
        }

        async 

function createConversation(otherUserId, itemId = null) {
            try {
                const body = { participant_id: otherUserId };
                if (itemId) body.item_id = itemId;
                const response = await apiRequest('/chats/conversations/', {
                    method: 'POST',
                    body: JSON.stringify(body)
                });
                if (response.ok) return { ok: true, data: await response.json() };

                const errorMessage = await readApiError(response, `Не удалось создать чат. Код ошибки: ${response.status}.`);

                console.error('createConversation failed', {
                    status: response.status,
                    body,
                    errorMessage
                });
                return { ok: false, error: errorMessage };
            } catch (error) {
                console.error('createConversation network error', error);
                return { ok: false, error: translateServerMessage(error.message, 'Ошибка сети') };
            }
        }

        async 

function getMessages(conversationId) {
            try {
                const response = await apiRequest(`/chats/conversations/${conversationId}/`);
                if (response.ok) return await response.json();
                return null;
            } catch (error) { return null; }
        }

        async 

function markConversationRead(conversationId) {
            try {
                const response = await apiRequest(`/chats/conversations/${conversationId}/mark_read/`, { method: 'POST' });
                if (response.ok) {
                    const data = await response.json().catch(() => ({}));
                    applyMessagesRead(data.message_ids || []);
                    refreshNavCounters();
                }
            } catch (error) {}
        }

        

function getConversationDisplayTitle(conversation) {
            if (conversation?.item?.title) return 'Чат по объявлению';
            const otherUser = conversation?.other_user?.username || 'пользователем';
            return `Чат с ${otherUser}`;
        }

        

function getConversationDisplaySubtitle(conversation) {
            const lastText = conversation?.last_message?.text || (conversation?.last_message?.image ? '[Изображение]' : 'Нет сообщений');
            if (conversation?.item?.title) {
                return `${conversation.item.title} • ${lastText}`;
            }
            return lastText;
        }

        

function renderConversationListContent(conversations) {
            if (!conversations.length) {
                return '<div class="empty-message">📭 У вас пока нет чатов. Напишите продавцу на карточке товара!</div>';
            }

            return `
                <ul class="conversation-list">
                    ${conversations.map(conv => {
                        const name = conv.other_user?.username || 'Пользователь';
                        const initials = getInitials(name);
                        const title = getConversationDisplayTitle(conv);
                        const subtitle = getConversationDisplaySubtitle(conv);
                        const date = conv.last_message?.created_at ? new Date(conv.last_message.created_at).toLocaleDateString() : '';
                        const unread = conv.unread_count > 0 ? `<span class="unread-badge">${conv.unread_count}</span>` : '';
                        return `
                            <li class="conversation-item" data-id="${conv.id}">
                                <div class="conversation-left">
                                    <div class="avatar" aria-hidden="true">${initials}</div>
                                    <div class="conversation-info">
                                        <h4>${escapeHtml(title)}</h4>
                                        <p>${escapeHtml(subtitle)}</p>
                                    </div>
                                </div>
                                <div class="conversation-meta">
                                    <div class="conversation-date">${date}</div>
                                    ${unread}
                                </div>
                            </li>
                        `;
                    }).join('')}
                </ul>
            `;
        }

        

function bindConversationListEvents() {
            document.querySelectorAll('.conversation-item').forEach(item => {
                item.addEventListener('click', () => showChatPage(item.dataset.id));
            });
        }

        async 

function refreshChatsPageIfVisible() {
            const chatsContent = document.getElementById('chatsContent');
            if (!chatsContent) return;

            const conversations = await getConversations();
            chatsContent.innerHTML = renderConversationListContent(conversations);
            bindConversationListEvents();
        }

        async 

function setRentModalMessage(type, text) {
            const box = document.getElementById('rentModalMessage');
            if (!box) return;
            if (!text) {
                box.innerHTML = '';
                return;
            }
            const css = type === 'success' ? 'rent-success' : (type === 'info' ? 'rent-info' : 'rent-error');
            box.innerHTML = `<div class="${css}">${text}</div>`;
        }

        

function applyCurrentBookingRentalMessage() {
            const b = currentBooking;
            if (!b) { setRentModalMessage('', ''); return; }

            if (b.status === 'confirmed' && b.payment_status === 'paid') {
                setRentModalMessage('success', '✅ Оплата подтверждена. Ожидайте передачи товара.');
            } else if (b.status === 'confirmed' && b.payment_status === 'pending') {
                setRentModalMessage('info', 'Бронь подтверждена. Можно перейти к оплате через СБП.');
            } else if (b.status === 'confirmed' && !isCurrentBookingContractFullySigned()) {
                setRentModalMessage('info', 'Бронь подтверждена. Сначала обе стороны должны подписать договор с помощью ЭЦП, затем станет доступна оплата по СБП.');
            } else if (b.status === 'pending') {
                setRentModalMessage('info', 'У вас уже есть заявка по этому товару на выбранные даты. Оплата станет доступна после подтверждения владельцем.');
            } else {
                setRentModalMessage('', '');
            }
        }

        async 

function startChat(otherUserId, itemId) {
            const currentUserId = localStorage.getItem('user_id');
            if (currentUserId == otherUserId) {
                alert('Вы не можете начать чат с самим собой');
                return;
            }
            const conversation = await createConversation(otherUserId, itemId);
            if (conversation?.ok && conversation.data) {
                showChatPage(conversation.data.id);
            } else {
                const message = translateServerMessage(conversation?.error || '', 'Не удалось создать чат.');
                alert('❌ ' + message);
            }
        }

        async 

function showChatsPage() {
            if (!isAuthenticated()) { alert('Пожалуйста, войдите в систему'); showLoginPage(); return; }
            teardownActiveChatState();
            const conversations = await getConversations();
            document.getElementById('app').innerHTML = `
                <div class="chats-page"><div class="chats-card">
                    <div class="back-button" id="backToMainFromChats">← Назад</div>
                    <div class="chats-title">💬 Мои чаты</div>
                    <div class="chats-sub">Общение с продавцами и покупателями</div>
                    <div id="chatsContent">${renderConversationListContent(conversations)}</div>
                </div></div>
            `;
            bindConversationListEvents();
            document.getElementById('backToMainFromChats')?.addEventListener('click', () => showMainPage());
        }

        async 

function showChatPage(conversationId) {
            if (!isAuthenticated()) { showLoginPage(); return; }
            teardownActiveChatState();
            const conversationData = await getMessages(conversationId);
            if (!conversationData) { alert('Не удалось загрузить чат'); showChatsPage(); return; }
            await markConversationRead(conversationId);
            activeChatConversationId = conversationId;

            resetChatAttachmentPreview();

            const peerName = conversationData.other_user?.username || 'пользователем';
            const peerInitials = getInitials(peerName);
            const itemTitle = conversationData.item?.title || '';
            const chatTitle = itemTitle ? 'Чат по объявлению' : `Чат с ${peerName}`;
            const chatSubtitle = itemTitle
                ? `${itemTitle} • ${peerName} • Enter — отправить • Shift+Enter — новая строка`
                : `${peerName} • Enter — отправить • Shift+Enter — новая строка`;

            document.getElementById('app').innerHTML = `
                <div class="chat-page">
                    <div class="chat-card">
                        <div class="chat-shell">
                            <div class="chat-topbar">
                                <div class="chat-topbar-row">
                                    <div class="chat-peer">
                                        <div class="avatar" aria-hidden="true">${peerInitials}</div>
                                        <div class="chat-peer-text">
                                            <div class="chat-peer-name">${escapeHtml(chatTitle)}</div>
                                            <div class="chat-peer-sub">${escapeHtml(chatSubtitle)}</div>
                                        </div>
                                    </div>
                                    <div class="chat-actions">
                                        <button class="btn-outline" id="backToChatsFromChat">← К чатам</button>
                                    </div>
                                </div>
                            </div>

                            <div class="chat-messages" id="chatMessages">
                                ${renderMessages(conversationData.messages || [])}
                            </div>

                            <div class="chat-attachment-preview" id="chatAttachmentPreview">
                                <div class="chat-attachment-thumb"><img id="chatAttachmentThumbImg" alt="preview"></div>
                                <div class="chat-attachment-meta">
                                    <div class="chat-attachment-title" id="chatAttachmentTitle"></div>
                                    <div class="chat-attachment-sub" id="chatAttachmentSub"></div>
                                </div>
                                <button class="chat-attachment-remove" id="chatAttachmentRemoveBtn" type="button">Убрать</button>
                            </div>

                            <div class="chat-input-area">
                                <button class="chat-attach-btn" id="attachBtn" type="button" title="Прикрепить изображение">📎</button>
                                <input type="file" id="chatImageInput" accept="image/*">
                                <textarea class="chat-input" id="messageInput" placeholder="Введите сообщение..." rows="1"></textarea>
                                <button class="chat-send-btn" id="sendBtn" type="button">Отправить</button>
                            </div>
                        </div>
                    </div>
                </div>
            `;

            const input = document.getElementById('messageInput');
            const sendBtn = document.getElementById('sendBtn');
            const messagesContainer = document.getElementById('chatMessages');
            const attachBtn = document.getElementById('attachBtn');
            const chatImageInput = document.getElementById('chatImageInput');
            const removeAttachBtn = document.getElementById('chatAttachmentRemoveBtn');

            

function renderMessages(messages) {
            const currentUser = localStorage.getItem('user_id');
            return messages.map(msg => renderSingleMessage(msg, msg.sender_id == currentUser)).join('');
        }

        

function appendMessageToChat(message, messagesContainer) {
            if (!message || !messagesContainer) return;
            const currentUserId = localStorage.getItem('user_id');
            messagesContainer.insertAdjacentHTML('beforeend', renderSingleMessage(message, String(message.sender_id) === String(currentUserId)));
            messagesContainer.scrollTop = messagesContainer.scrollHeight;
            refreshNavCounters();
            refreshChatsPageIfVisible();
        }

        

function renderSingleMessage(message, isMyMessage) {
            const time = message?.created_at
                ? new Date(message.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                : '';
            const rowClass = isMyMessage ? 'my-message' : 'their-message';

            const parts = [];
            const safeText = (message?.text || '').trim();
            if (safeText) {
                parts.push(`<div class="message-bubble">${escapeHtml(safeText)}</div>`);
            }

            if (message?.image) {
                const safeUrl = message.image;
                parts.push(`
                    <div class="message-image">
                        <a href="${safeUrl}" target="_blank" rel="noopener">
                            <img src="${safeUrl}" alt="image">
                        </a>
                    </div>
                `);
            }

            if (!parts.length) {
                parts.push(`<div class="message-bubble"></div>`);
            }

            const unreadDot = isMyMessage && message && message.is_read === false
                ? `<span class="message-read-indicator" title="Не прочитано"></span>`
                : '';

            return `
                <div class="message-row ${rowClass}" data-message-id="${message?.id || ''}" data-read="${message?.is_read ? 'true' : 'false'}">
                    ${unreadDot}
                    <div class="message ${rowClass}">
                        ${parts.join('')}
                        <div class="message-meta">
                            <span class="message-time">${time}</span>
                        </div>
                    </div>
                </div>
            `;
        }

        async 