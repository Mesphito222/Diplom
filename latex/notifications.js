function getSeenNotificationsStorageKey() {
            const userId = localStorage.getItem('user_id');
            return userId ? `seen_notifications_${userId}` : 'seen_notifications_guest';
        }
        

function loadSeenNotificationIds() {
            try {
                const raw = localStorage.getItem(getSeenNotificationsStorageKey());
                const parsed = raw ? JSON.parse(raw) : [];
                return new Set(Array.isArray(parsed) ? parsed.map(String) : []);
            } catch (e) {
                return new Set();
            }
        }
        

function persistSeenNotificationIds() {
            try {
                const ids = Array.from(shownNotificationIds).slice(-300);
                localStorage.setItem(getSeenNotificationsStorageKey(), JSON.stringify(ids));
            } catch (e) {}
        }
        

function rememberNotificationShown(notificationId) {
            if (notificationId === undefined || notificationId === null) return;
            shownNotificationIds.add(String(notificationId));
            persistSeenNotificationIds();
        }
        

function hasShownNotification(notificationId) {
            return shownNotificationIds.has(String(notificationId));
        }

        

function ensureSiteToastStack() {
            let stack = document.getElementById('siteToastStack');
            if (stack) return stack;

            stack = document.createElement('div');
            stack.id = 'siteToastStack';
            stack.className = 'site-toast-stack';
            document.body.appendChild(stack);
            return stack;
        }

        

function showQuickToast(message, { title, timeoutMs } = {}) {
            const stack = ensureSiteToastStack();
            const text = sanitizeToastMessage(message);

            let derivedTitle = title;
            let derivedTimeout = timeoutMs;

            if (!derivedTitle) {
                if (text.trim().startsWith('❌')) derivedTitle = 'Ошибка';
                else if (text.trim().startsWith('✅')) derivedTitle = 'Готово';
                else derivedTitle = 'Сообщение';
            }

            if (!Number.isFinite(derivedTimeout)) {
                if (text.trim().startsWith('❌')) derivedTimeout = 5500;
                else if (text.trim().startsWith('✅')) derivedTimeout = 3500;
                else derivedTimeout = 4500;
            }

            const toast = document.createElement('div');
            toast.className = 'site-toast';
            toast.innerHTML = `
                <div class="site-toast-title">${escapeHtml(derivedTitle)}</div>
                <div class="site-toast-body">${escapeHtml(text)}</div>
                <div class="site-toast-actions">
                    <button class="site-toast-close" type="button">Закрыть</button>
                </div>
            `;

            const closeToast = () => toast.remove();
            toast.querySelector('.site-toast-close')?.addEventListener('click', (event) => {
                event.stopPropagation();
                closeToast();
            });

            stack.appendChild(toast);
            window.setTimeout(closeToast, derivedTimeout);
        }

        // Replace blocking browser alerts with non-blocking toasts (auto-close).
        window.alert = (message) => showQuickToast(message);

        

function getRecentNotifications() {
            try {
                const response = await apiRequest('/notifications/');
                if (!response.ok) return [];
                const data = await response.json().catch(() => ({}));
                return Array.isArray(data) ? data : (data.results || []);
            } catch (error) {
                return [];
            }
        }

        

function getNotificationMeta(notification) {
            const map = {
                booking_created: { title: 'Новая заявка', actionLabel: 'К заявкам' },
                booking_cancelled: { title: 'Бронирование отменено', actionLabel: 'Открыть' },
                booking_confirmed: { title: 'Бронирование подтверждено', actionLabel: 'Оплатить' },
                payment_confirmed: { title: 'Оплата подтверждена', actionLabel: 'К моим объявлениям' },
                item_moderation_request: { title: 'Новая заявка на объявление', actionLabel: 'К модерации' },
                item_moderation_approved: { title: 'Объявление одобрено', actionLabel: 'Открыть' },
                item_moderation_rejected: { title: 'Объявление отклонено', actionLabel: 'К моим объявлениям' },
                new_message: { title: 'Новое сообщение', actionLabel: 'Открыть чат' },
                return_reminder: { title: 'Напоминание о возврате', actionLabel: 'К объявлению' },
                new_review: { title: 'Новый отзыв', actionLabel: 'К объявлению' },
            };
            return map[notification?.type] || null;
        }

        

function markNotificationRead(notificationId) {
            try {
                const response = await apiRequest(`/notifications/${notificationId}/mark_read/`, {
                    method: 'POST',
                    body: JSON.stringify({})
                });
                if (response.ok) {
                    await refreshNavCounters();
                }
            } catch (error) {}
        }

        async 

function navigateFromNotification(notification) {
            const type = notification?.type;
            const metadata = notification?.metadata || {};
            const destination = metadata.destination || '';

            if (notification?.id) {
                await markNotificationRead(notification.id);
            }

            if (destination === 'incoming_bookings' || type === 'booking_created') {
                closeItemPreview();
                await showIncomingBookingsPage();
                return;
            }

            if (destination === 'my_items') {
                closeItemPreview();
                closeRentalModal();
                await showMyItemsPage();
                return;
            }

            if (destination === 'item_moderation' || type === 'item_moderation_request') {
                closeItemPreview();
                closeRentalModal();
                await showModerationPage();
                return;
            }

            if (destination === 'chat' || type === 'new_message') {
                if (metadata.chat_id) {
                    closeItemPreview();
                    await showChatPage(metadata.chat_id);
                    return;
                }
                await showChatsPage();
                return;
            }

            if (destination === 'rent_payment') {
                const item = await getItemById(metadata.item_id);
                if (item) {
                    closeItemPreview();
                    closeRentalModal();
                    await openRentalModal(item);
                    if (currentBooking?.status === 'confirmed' && currentBooking?.payment_status !== 'paid') {
                        if (isCurrentBookingContractFullySigned()) {
                            await startBookingPayment();
                        } else {
                            setRentModalMessage('info', 'Сначала дождитесь, пока договор подпишут обе стороны, затем переходите к оплате по СБП.');
                        }
                    } else if (!currentBooking) {
                        setRentModalMessage('info', 'Бронь не найдена. Проверьте раздел аренды для этого объявления.');
                    }
                    return;
                }
                await showMainPage();
                return;
            }

            if (destination === 'item' || type === 'booking_confirmed' || type === 'return_reminder' || type === 'new_review') {
                const item = await getItemById(metadata.item_id);
                if (item) {
                    await openItemPreview(item);
                    return;
                }
                await showMainPage();
                return;
            }
        }

        

function getNotificationBody(notification) {
            if (!notification) return '';

            const base = notification.message || '';
            if (notification.type !== 'new_review') return base;

            const metadata = notification.metadata || {};
            const parts = [base];
            const rating = metadata.rating;
            const comment = (metadata.comment || '').trim();

            if (rating && !base.includes('/5')) {
                parts.push(`Оценка: ${rating}/5`);
            }
            if (comment && !base.includes(comment)) {
                parts.push(`Комментарий: ${comment}`);
            }

            return parts.join('\n');
        }

        

function showSiteToast(notification) {
            const stack = document.getElementById('siteToastStack');
            const meta = getNotificationMeta(notification);
            if (!stack || !meta) return;

            const toast = document.createElement('div');
            toast.className = `site-toast ${meta.actionLabel ? 'actionable' : ''}`;
            toast.innerHTML = `
                <div class="site-toast-title">${escapeHtml(meta.title)}</div>
                <div class="site-toast-body">${escapeHtml(getNotificationBody(notification))}</div>
                <div class="site-toast-actions">
                    ${meta.actionLabel ? `<button class="site-toast-open" type="button">${escapeHtml(meta.actionLabel)}</button>` : ''}
                    <button class="site-toast-close" type="button">Закрыть</button>
                </div>
            `;

            const closeToast = () => {
                toast.remove();
            };

            toast.querySelector('.site-toast-close')?.addEventListener('click', (event) => {
                event.stopPropagation();
                closeToast();
            });
            toast.querySelector('.site-toast-open')?.addEventListener('click', async (event) => {
                event.stopPropagation();
                closeToast();
                await navigateFromNotification(notification);
            });
            if (meta.actionLabel) {
                toast.addEventListener('click', async () => {
                    closeToast();
                    await navigateFromNotification(notification);
                });
            }
            stack.appendChild(toast);
            setTimeout(closeToast, 7000);
        }

        async 

function handleIncomingNotification(notification, { fromSocket = false } = {}) {
            const meta = getNotificationMeta(notification);
            if (!meta || !notification?.id) return;

            if (hasShownNotification(notification.id)) return;

            rememberNotificationShown(notification.id);
            if (!notification.is_read) {
                showSiteToast(notification);
            }

            if (notification.type === 'booking_confirmed') {
                const metadata = notification.metadata || {};

                if (currentRentalItem && metadata.item_id && String(currentRentalItem.id) === String(metadata.item_id)) {
                    await refreshCurrentBookingState();
                    if (currentBooking?.status === 'confirmed') {
                        setRentModalMessage('success', 'Заявка подтверждена. Теперь стороны могут подписать договор.');
                    }
                }

                if (document.querySelector('.bookings-page')) {
                    await showIncomingBookingsPage('<div class="success-message">✅ Статус бронирований обновлён.</div>');
                } else if (document.querySelector('.my-items-page')) {
                    await showMyItemsPage();
                }
            }

            if (notification.type === 'booking_created' || notification.type === 'booking_cancelled' || notification.type === 'payment_confirmed') {
                if (document.querySelector('.bookings-page')) {
                    await showIncomingBookingsPage();
                } else if (document.querySelector('.my-items-page')) {
                    await showMyItemsPage();
                }
            }

            if (notification.type === 'new_review') {
                const metadata = notification.metadata || {};
                if (
                    activePreviewItemId &&
                    metadata.item_id &&
                    String(activePreviewItemId) === String(metadata.item_id)
                ) {
                    const refreshedItem = await getItemById(metadata.item_id);
                    if (refreshedItem) {
                        await openItemPreview(refreshedItem);
                    }
                }
            }

            await refreshNavCounters();
            await refreshChatsPageIfVisible();
        }

        async 

function checkSiteNotifications() {
            if (!isAuthenticated()) return;

            const notifications = await getRecentNotifications();
            for (const notification of notifications) {
                if (notification.is_read) continue;
                await handleIncomingNotification(notification);
            }
        }

        async 

function startNotificationPolling() {
            stopNotificationPolling();
            if (!isAuthenticated()) return;
            shownNotificationIds = loadSeenNotificationIds();

            checkSiteNotifications();
            notificationPollInterval = setInterval(() => {
                if (!notificationSocketConnected) {
                    checkSiteNotifications();
                }
            }, 10000);
        }

        

function stopNotificationPolling() {
            if (notificationPollInterval) {
                clearInterval(notificationPollInterval);
                notificationPollInterval = null;
            }
        }

        

function scheduleNotificationSocketReconnect() {
            if (notificationSocketReconnectTimer || !isAuthenticated()) return;
            notificationSocketReconnectTimer = setTimeout(() => {
                notificationSocketReconnectTimer = null;
                connectNotificationsSocket();
            }, 3000);
        }

        

function closeNotificationsSocket() {
            notificationSocketConnected = false;
            if (notificationSocketReconnectTimer) {
                clearTimeout(notificationSocketReconnectTimer);
                notificationSocketReconnectTimer = null;
            }
            if (notificationsWsConnection) {
                notificationsWsConnection.onclose = null;
                notificationsWsConnection.close();
                notificationsWsConnection = null;
            }
        }

        

function connectNotificationsSocket() {
            if (!isAuthenticated()) return;
            if (notificationsWsConnection && (
                notificationsWsConnection.readyState === WebSocket.OPEN ||
                notificationsWsConnection.readyState === WebSocket.CONNECTING
            )) {
                return;
            }

            const token = getAccessToken();
            if (!token) return;

            const wsUrl = `${WS_BASE}/notifications/?token=${token}`;
            notificationsWsConnection = new WebSocket(wsUrl);

            notificationsWsConnection.onopen = () => {
                notificationSocketConnected = true;
            };

            notificationsWsConnection.onmessage = async (event) => {
                const data = JSON.parse(event.data);
                if (data.event === 'notification_created' && data.notification) {
                    await handleIncomingNotification(data.notification, { fromSocket: true });
                }
            };

            notificationsWsConnection.onclose = () => {
                notificationSocketConnected = false;
                notificationsWsConnection = null;
                scheduleNotificationSocketReconnect();
            };

            notificationsWsConnection.onerror = () => {
                notificationSocketConnected = false;
            };
        }

        async 