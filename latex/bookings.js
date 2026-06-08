function calculateRentalDays(startDate, endDate) {
            if (!startDate || !endDate) return 0;
            const start = new Date(startDate);
            const end = new Date(endDate);
            const diff = Math.round((end - start) / (1000 * 60 * 60 * 24));
            return diff > 0 ? diff : 0;
        }

        

function formatBookingStatus(status) {
            const map = {
                pending: 'Ожидает подтверждения',
                confirmed: 'Подтверждена',
                cancelled: 'Отменена',
                completed: 'Завершена'
            };
            return map[status] || 'Не создана';
        }

        

function formatPaymentStatus(status) {
            const map = {
                unpaid: 'Не оплачено',
                pending: 'Ожидает оплаты',
                paid: 'Оплачено',
                failed: 'Ошибка оплаты'
            };
            return map[status] || '—';
        }

        

function getMyBookingsForItem(itemId) {
            try {
                const list = await fetchPaginatedResults('/bookings/?role=outgoing');
                return list.filter(booking =>
                    (
                        String(booking.item) === String(itemId) ||
                        String(booking.item?.id) === String(itemId)
                    ) &&
                    ['pending', 'confirmed'].includes(booking.status)
                );
            } catch (error) {
                return [];
            }
        }

        async 

function getIncomingBookings() {
            try {
                const response = await apiRequest('/bookings/?role=incoming');
                if (!response.ok) return [];
                const data = await response.json();
                return Array.isArray(data) ? data : (data.results || []);
            } catch (error) {
                return [];
            }
        }

        async 

function getOutgoingBookings() {
            try {
                return await fetchPaginatedResults('/bookings/?role=outgoing');
            } catch (error) {
                return [];
            }
        }

        async 

function getAllIncomingBookings() {
            try {
                return await fetchPaginatedResults('/bookings/?role=incoming');
            } catch (error) {
                return [];
            }
        }

        async 

function confirmIncomingBooking(bookingId) {
            try {
                const response = await apiRequest(`/bookings/${bookingId}/confirm/`, {
                    method: 'POST',
                    body: JSON.stringify({})
                });
                const data = await response.json().catch(() => ({}));
                return { success: response.ok, data };
            } catch (error) {
                return { success: false, data: { detail: 'Ошибка подключения при подтверждении заявки.' } };
            }
        }

        async 

function cancelIncomingBooking(bookingId) {
            try {
                const response = await apiRequest(`/bookings/${bookingId}/cancel/`, {
                    method: 'POST',
                    body: JSON.stringify({})
                });
                const data = await response.json().catch(() => ({}));
                return { success: response.ok, data };
            } catch (error) {
                return { success: false, data: { detail: 'Ошибка подключения при отмене заявки.' } };
            }
        }

        

function destroyRentalPickers() {
            if (rentStartPicker) {
                rentStartPicker.destroy();
                rentStartPicker = null;
            }
            if (rentEndPicker) {
                rentEndPicker.destroy();
                rentEndPicker = null;
            }
        }        

function hasSignedCurrentBookingContract() {
            return !!(
                currentBookingContract &&
                currentBookingContract.my_role === 'renter' &&
                currentBookingContract.my_signed
            );
        }

        

function isCurrentBookingContractFullySigned() {
            return !!(
                currentBookingContract &&
                currentBookingContract.is_signed &&
                currentBookingContract.renter_signed_at &&
                currentBookingContract.owner_signed_at
            );
        }

        

function getSelectedRentalDates() {
            return {
                startDate: document.getElementById('rentStartDate')?.value || '',
                endDate: document.getElementById('rentEndDate')?.value || '',
            };
        }

        

function findBookingForRentalDates(startDate, endDate) {
            if (!startDate || !endDate) return null;
            return currentItemBookings.find(booking =>
                booking.start_date === startDate &&
                booking.end_date === endDate &&
                ['pending', 'confirmed'].includes(booking.status)
            ) || null;
        }

        

function syncBookingForSelectedDates({ resetUi = false } = {}) {
            const previousBookingId = currentBooking?.id || null;
            const { startDate, endDate } = getSelectedRentalDates();

            currentBooking = findBookingForRentalDates(startDate, endDate);

            if (!currentBooking) {
                currentBookingContract = null;
                if (resetUi) {
                    resetPaymentBox();
                    setRentModalMessage('', '');
                }
                updateRentalActionButtons();
                updateRentalSummary();
                return null;
            }

            if (resetUi && previousBookingId !== currentBooking.id) {
                resetPaymentBox();
            }

            await syncCurrentBookingContract();
            applyCurrentBookingRentalMessage();
            updateRentalSummary();
            return currentBooking;
        }

        

function updateRentalActionButtons() {
            const createBookingBtn = document.getElementById('createBookingBtn');
            const openContractBtn = document.getElementById('openContractBtn');
            const startPaymentBtn = document.getElementById('startPaymentBtn');
            const booking = currentBooking;
            const canOpenContract = ['confirmed', 'completed'].includes(booking?.status);
            const canProceedToPayment = !!booking && booking.status === 'confirmed' && (
                booking.payment_status === 'pending' ||
                booking.payment_status === 'paid' ||
                isCurrentBookingContractFullySigned()
            );

            if (createBookingBtn) {
                createBookingBtn.disabled = !!booking && ['pending', 'confirmed'].includes(booking.status);
            }
            if (openContractBtn) {
                openContractBtn.disabled = !canOpenContract;
            }
            if (startPaymentBtn) {
                startPaymentBtn.classList.toggle('is-hidden', !canProceedToPayment);
                startPaymentBtn.disabled = !canProceedToPayment || booking?.payment_status === 'paid';
                startPaymentBtn.textContent = booking?.payment_status === 'paid'
                    ? 'Оплата уже выполнена'
                    : 'Перейти к оплате по СБП';
            }
        }

        async 

function syncCurrentBookingContract() {
            if (!currentBooking || !canUseContractForBooking(currentBooking)) {
                currentBookingContract = null;
                updateRentalActionButtons();
                return null;
            }

            const result = await getContractByBooking(currentBooking.id);
            currentBookingContract = result.success ? result.data : null;
            updateRentalActionButtons();
            return currentBookingContract;
        }

        

function resetPaymentBox() {
            currentPaymentPayload = null;
            const box = document.getElementById('paymentBox');
            if (!box) return;
            box.classList.remove('active');
            document.getElementById('paymentBank').textContent = '—';
            document.getElementById('paymentRecipient').textContent = '—';
            document.getElementById('paymentPhone').textContent = '—';
            document.getElementById('paymentAmount').textContent = '—';
            document.getElementById('paymentStatus').textContent = '—';
            document.getElementById('paymentExpires').textContent = '—';
            document.getElementById('paymentQrPayload').textContent = '';
            const paymentLinkBtn = document.getElementById('paymentLinkBtn');
            if (paymentLinkBtn) {
                paymentLinkBtn.disabled = true;
            }
        }

function confirmBookingPayment() {
            const booking = await refreshCurrentBookingState();
            const demoMessageBox = document.getElementById('sbpDemoMessage');
            const demoPayButton = document.getElementById('sbpDemoPayBtn');

            if (!booking) {
                setRentModalMessage('error', 'Бронь не найдена.');
                if (demoMessageBox) {
                    demoMessageBox.innerHTML = '<div class="rent-error">Бронь не найдена. Обновите окно аренды и попробуйте снова.</div>';
                }
                if (demoPayButton) {
                    demoPayButton.disabled = false;
                    demoPayButton.textContent = 'Оплатить';
                }
                return;
            }

            try {
                const response = await apiRequest(`/bookings/${booking.id}/confirm_payment/`, {
                    method: 'POST',
                    body: JSON.stringify({})
                });

                if (!response.ok) {
                    const message = await readApiError(response, 'Не удалось подтвердить оплату.');
                    setRentModalMessage('error', message);
                    if (demoMessageBox) {
                        demoMessageBox.innerHTML = `<div class="rent-error">${escapeHtml(message)}</div>`;
                    }
                    if (demoPayButton) {
                        demoPayButton.disabled = false;
                        demoPayButton.textContent = 'Оплатить';
                    }
                    return;
                }

                const data = await response.json().catch(() => ({}));
                currentBooking = data;
                updateRentalSummary();
                resetPaymentBox();
                closeSbpDemoModal();
                setRentModalMessage('success', 'Оплата подтверждена. Бронь оплачена.');
                setTimeout(() => {
                    closeRentalModal();
                    loadProducts(currentPage);
                }, 1200);
            } catch (error) {
                setRentModalMessage('error', 'Ошибка подключения при подтверждении оплаты.');
                if (demoMessageBox) {
                    demoMessageBox.innerHTML = '<div class="rent-error">Ошибка подключения при подтверждении оплаты.</div>';
                }
                if (demoPayButton) {
                    demoPayButton.disabled = false;
                    demoPayButton.textContent = 'Оплатить';
                }
            }
        }

        async 

function confirmDepositPayment() {
            const booking = await refreshCurrentBookingState();
            const demoMessageBox = document.getElementById('sbpDemoMessage');
            const demoPayButton = document.getElementById('sbpDemoPayBtn');

            if (!booking) {
                setRentModalMessage('error', 'Бронь не найдена.');
                if (demoPayButton) { demoPayButton.disabled = false; demoPayButton.textContent = 'Оплатить'; }
                return;
            }

            try {
                const response = await apiRequest(`/bookings/${booking.id}/confirm_deposit/`, {
                    method: 'POST',
                    body: JSON.stringify({})
                });

                if (!response.ok) {
                    const message = await readApiError(response, 'Не удалось подтвердить оплату залога.');
                    setRentModalMessage('error', message);
                    if (demoMessageBox) demoMessageBox.innerHTML = `<div class="rent-error">${escapeHtml(message)}</div>`;
                    if (demoPayButton) { demoPayButton.disabled = false; demoPayButton.textContent = 'Оплатить'; }
                    return;
                }

                const data = await response.json().catch(() => ({}));
                currentBooking = data;
                currentPaymentType = 'rent';
                updateRentalSummary();
                updateRentalActionButtons();
                resetPaymentBox();
                closeSbpDemoModal();
                applyCurrentBookingRentalMessage();
            } catch {
                setRentModalMessage('error', 'Ошибка подключения при подтверждении залога.');
                if (demoPayButton) { demoPayButton.disabled = false; demoPayButton.textContent = 'Оплатить'; }
            }
        }

        async 

function showIncomingBookingsPage(flashMessage = '') {
            if (!isAuthenticated()) { alert('Пожалуйста, войдите в систему'); showLoginPage(); return; }

            const [incomingBookings, outgoingBookings] = await Promise.all([
                getIncomingBookings(),
                getOutgoingBookings()
            ]);

            document.getElementById('app').innerHTML = `
                <div class="bookings-page"><div class="bookings-card">
                    <div class="back-button" id="backToMainFromBookings">← Назад</div>
                    <div class="bookings-title">📥 Заявки и мои аренды</div>
                    <div class="bookings-sub">Здесь владелец видит входящие бронирования, а арендатор может открыть завершённую аренду и оставить отзыв.</div>
                    <div id="bookingsMessage">${flashMessage}</div>
                    <div class="section-title">Входящие заявки</div>
                    ${incomingBookings.length === 0 ? '<div class="empty-message">Пока нет входящих заявок на ваши объявления.</div>' : `
                        <div class="bookings-list">
                            ${incomingBookings.map(booking => `
                                <div class="booking-request" data-booking-id="${booking.id}">
                                    <div class="booking-request-head">
                                        <div>
                                            <div class="booking-request-title">${escapeHtml(booking.item_title || `Объявление #${booking.item}`)}</div>
                                            <div class="booking-request-meta">
                                                <div>Арендатор: ${escapeHtml(booking.renter_username || 'Пользователь')}</div>
                                                <div>Email: ${escapeHtml(booking.renter_email || '—')}</div>
                                                <div>Период: ${escapeHtml(booking.start_date || '—')} — ${escapeHtml(booking.end_date || '—')}</div>
                                                <div>Сумма: ${formatPrice(booking.total_price || 0)}</div>
                                            </div>
                                        </div>
                                        <div class="booking-request-status">${formatBookingStatus(booking.status)}</div>
                                    </div>
                                    ${renderOwnerBookingActions(booking)}
                                </div>
                            `).join('')}
                        </div>
                    `}

                    <div class="section-title">Мои аренды</div>
                    ${outgoingBookings.length === 0 ? '<div class="empty-message">У вас пока нет аренд.</div>' : `
                        <div class="bookings-list">
                            ${outgoingBookings.map(booking => `
                                <div class="booking-request" data-outgoing-booking-id="${booking.id}">
                                    <div class="booking-request-head">
                                        <div>
                                            <div class="booking-request-title">${escapeHtml(getBookingItemTitle(booking))}</div>
                                            <div class="booking-request-meta">
                                                <div>Период: ${escapeHtml(booking.start_date || '—')} — ${escapeHtml(booking.end_date || '—')}</div>
                                                <div>Сумма: ${formatPrice(booking.total_price || 0)}</div>
                                                <div>Оплата: ${formatPaymentStatus(booking.payment_status || 'unpaid')}</div>
                                            </div>
                                            ${getReviewSummaryMarkup(booking)}
                                        </div>
                                        <div class="booking-request-status">${formatBookingStatus(booking.status)}</div>
                                    </div>
                                    ${renderRenterBookingActions(booking)}
                                </div>
                            `).join('')}
                        </div>
                    `}
                </div></div>
            `;

            document.getElementById('backToMainFromBookings')?.addEventListener('click', () => showMainPage());
            attachHandoverListeners(incomingBookings, outgoingBookings);
        }

        

function getBookingSortDate(booking) {
            return new Date(
                booking?.start_date ||
                booking?.created_at ||
                '1970-01-01'
            ).getTime();
        }

        

function getBookingItemTitle(booking) {
            return booking?.item_title || booking?.item?.title || booking?.item?.name || `Объявление #${booking?.item || '—'}`;
        }

        

function canLeaveReviewForBooking(booking) {
            if (booking?.can_leave_review !== undefined) return !!booking.can_leave_review;
            return !!booking && !booking.has_review && (
                booking.status === 'completed' ||
                (
                    booking.status === 'confirmed' &&
                    booking.payment_status === 'paid'
                )
            );
        }

        

function canUseContractForBooking(booking) {
            return ['confirmed', 'completed'].includes(booking?.status);
        }

        // ─── Renders action buttons for the OWNER (арендодатель) ───────────
        

function renderOwnerBookingActions(booking) {
            const parts = [];

            if (booking.status === 'pending') {
                parts.push(`
                    <div class="booking-request-actions">
                        <button class="btn-primary" data-action="confirm-booking" data-id="${booking.id}">Подтвердить</button>
                        <button class="btn-outline" data-action="cancel-booking" data-id="${booking.id}">Отклонить</button>
                    </div>`);
            }

            const actionBtns = [];
            if (canUseContractForBooking(booking)) {
                actionBtns.push(`<button class="btn-outline" data-action="open-contract" data-id="${booking.id}" data-scope="incoming">Договор / ЭЦП</button>`);
                actionBtns.push(`<button class="btn-outline" data-action="download-contract-pdf" data-id="${booking.id}">Скачать PDF</button>`);
            }
            if (booking.status === 'confirmed' && booking.payment_status === 'paid'
                    && booking.renter_pickup_confirmed && !booking.owner_return_confirmed) {
                actionBtns.push(`<button class="btn-primary" data-action="owner-confirm-return" data-id="${booking.id}">📦 Подтвердить возврат товара</button>`);
            }
            if (booking.return_status === 'requested') {
                actionBtns.push(`<button class="btn-primary" data-action="approve-refund" data-id="${booking.id}">💰 Одобрить СБП-возврат</button>`);
                actionBtns.push(`<button class="btn-danger" data-action="reject-refund" data-id="${booking.id}">Отклонить возврат</button>`);
            }

            const badges = getHandoverBadges(booking);
            const actionsHtml = actionBtns.length
                ? `<div class="booking-request-actions">${actionBtns.join('')}</div>`
                : '';

            return badges + parts.join('') + actionsHtml;
        }

        // ─── Renders action buttons for the RENTER (арендатор) ─────────────
        

function renderRenterBookingActions(booking) {
            const btns = [];

            btns.push(`<button class="btn-outline" data-action="open-rental-item" data-id="${booking.id}">Открыть объявление</button>`);

            if (canUseContractForBooking(booking)) {
                btns.push(`<button class="btn-outline" data-action="open-contract" data-id="${booking.id}" data-scope="outgoing">Договор / ЭЦП</button>`);
                btns.push(`<button class="btn-outline" data-action="download-contract-pdf" data-id="${booking.id}">Скачать PDF</button>`);
            }
            if (booking.status === 'confirmed' && booking.payment_status === 'paid'
                    && !booking.renter_pickup_confirmed) {
                btns.push(`<button class="btn-primary" data-action="renter-confirm-pickup" data-id="${booking.id}">📸 Подтвердить получение товара</button>`);
            }
            if (booking.status === 'confirmed' && booking.payment_status === 'paid'
                    && !booking.return_requested) {
                btns.push(`<button class="btn-warning" data-action="renter-request-refund" data-id="${booking.id}">↩ Запросить возврат средств</button>`);
            }
            if (['pending', 'confirmed'].includes(booking.status) && !booking.return_requested) {
                btns.push(`<button class="btn-danger" data-action="renter-cancel-booking" data-id="${booking.id}">Отказаться от аренды</button>`);
            }
            if (canLeaveReviewForBooking(booking)) {
                btns.push(`<button class="btn-primary" data-action="leave-review" data-id="${booking.id}">Оставить отзыв</button>`);
            }

            const badges = getHandoverBadges(booking);
            return badges + `<div class="booking-request-actions">${btns.join('')}</div>`;
        }

        // ─── Attach all handover/refund/cancel event listeners ──────────────
        //     Call after any page render that shows booking cards.
        

function attachHandoverListeners(incomingBookings, outgoingBookings) {
            const allBookings = [...(incomingBookings || []), ...(outgoingBookings || [])];

            const findBooking = (id) => allBookings.find(b => String(b.id) === String(id));
            const reload = (msg) => {
                const page = document.querySelector('.bookings-page, .my-items-page');
                if (page && page.classList.contains('my-items-page')) {
                    showMyItemsPage().then(() => {
                        if (msg) {
                            const msgEl = document.getElementById('myItemsMessage');
                            if (msgEl) msgEl.innerHTML = `<div class="success-message">${msg}</div>`;
                        }
                    });
                } else {
                    showIncomingBookingsPage(msg ? `<div class="success-message">${msg}</div>` : '');
                }
            };

            // confirm-booking
            document.querySelectorAll('[data-action="confirm-booking"]').forEach(btn => {
                btn.addEventListener('click', async () => {
                    const result = await confirmIncomingBooking(btn.dataset.id);
                    if (result.success) {
                        reload('✅ Заявка подтверждена.');
                    } else {
                        alert('❌ ' + extractApiErrorMessage(result.data, 'Не удалось подтвердить заявку.'));
                    }
                });
            });

            // cancel-booking (owner rejects)
            document.querySelectorAll('[data-action="cancel-booking"]').forEach(btn => {
                btn.addEventListener('click', async () => {
                    const result = await cancelIncomingBooking(btn.dataset.id);
                    if (result.success) {
                        reload('✅ Заявка отклонена.');
                    } else {
                        alert('❌ ' + extractApiErrorMessage(result.data, 'Не удалось отклонить заявку.'));
                    }
                });
            });

            // open-contract (incoming or outgoing scope)
            document.querySelectorAll('[data-action="open-contract"]').forEach(btn => {
                btn.addEventListener('click', async () => {
                    const booking = findBooking(btn.dataset.id);
                    if (booking) await openContractFlowForBooking(booking);
                });
            });

            // download-contract-pdf
            document.querySelectorAll('[data-action="download-contract-pdf"]').forEach(btn => {
                btn.addEventListener('click', async () => {
                    await downloadContractPdfByBookingId(btn.dataset.id);
                });
            });

            // open-rental-item / leave-review
            document.querySelectorAll('[data-action="open-rental-item"], [data-action="leave-review"]').forEach(btn => {
                btn.addEventListener('click', async () => {
                    const booking = findBooking(btn.dataset.id);
                    if (booking) await openReviewFlowForBooking(booking);
                });
            });

            // 📸 Арендатор подтверждает получение
            document.querySelectorAll('[data-action="renter-confirm-pickup"]').forEach(btn => {
                btn.addEventListener('click', () => {
                    const bookingId = btn.dataset.id;
                    openHandoverModal({
                        title: '📸 Подтверждение получения товара',
                        sub: 'Прикрепите фото товара в момент получения. Это зафиксирует состояние вещи в начале аренды.',
                        needPhoto: true,
                        confirmLabel: '✅ Подтвердить получение',
                        onConfirm: async ({ photo }) => {
                            if (!photo) { alert('Пожалуйста, прикрепите фото товара'); return; }
                            const resp = await confirmRenterPickup(bookingId, photo);
                            closeHandoverModal();
                            if (resp.ok) {
                                reload('✅ Получение товара подтверждено!');
                            } else {
                                const e = await resp.json().catch(() => ({}));
                                alert('❌ ' + extractApiErrorMessage(e, 'Не удалось подтвердить получение.'));
                            }
                        }
                    });
                });
            });

            // 📦 Арендодатель подтверждает возврат
            document.querySelectorAll('[data-action="owner-confirm-return"]').forEach(btn => {
                btn.addEventListener('click', () => {
                    const bookingId = btn.dataset.id;
                    openHandoverModal({
                        title: '📦 Подтверждение возврата товара',
                        sub: 'Прикрепите фото товара при возврате. После подтверждения бронирование будет завершено.',
                        needPhoto: true,
                        confirmLabel: '✅ Подтвердить возврат',
                        onConfirm: async ({ photo }) => {
                            if (!photo) { alert('Пожалуйста, прикрепите фото товара'); return; }
                            const resp = await confirmOwnerReturn(bookingId, photo);
                            closeHandoverModal();
                            if (resp.ok) {
                                reload('✅ Возврат подтверждён. Бронирование завершено.');
                            } else {
                                const e = await resp.json().catch(() => ({}));
                                alert('❌ ' + extractApiErrorMessage(e, 'Не удалось подтвердить возврат.'));
                            }
                        }
                    });
                });
            });

            // ↩ Арендатор запрашивает СБП-возврат
            document.querySelectorAll('[data-action="renter-request-refund"]').forEach(btn => {
                btn.addEventListener('click', () => {
                    const bookingId = btn.dataset.id;
                    openHandoverModal({
                        title: '↩ Запрос СБП-возврата',
                        sub: 'Опишите причину возврата. Арендодатель получит уведомление и сможет одобрить или отклонить. Средства будут возвращены через СБП.',
                        needPhoto: false,
                        needReason: true,
                        reasonPlaceholder: 'Причина возврата (обязательно)...',
                        confirmLabel: '↩ Запросить возврат',
                        confirmClass: 'btn-warning',
                        onConfirm: async ({ reason }) => {
                            if (!reason) { alert('Укажите причину возврата'); return; }
                            const resp = await requestRefund(bookingId, reason);
                            closeHandoverModal();
                            if (resp.ok) {
                                reload('✅ Запрос на возврат отправлен арендодателю.');
                            } else {
                                const e = await resp.json().catch(() => ({}));
                                alert('❌ ' + extractApiErrorMessage(e, 'Не удалось отправить запрос.'));
                            }
                        }
                    });
                });
            });

            // 💰 Арендодатель одобряет СБП-возврат
            document.querySelectorAll('[data-action="approve-refund"]').forEach(btn => {
                btn.addEventListener('click', async () => {
                    if (!confirm('Одобрить СБП-возврат средств арендатору?')) return;
                    const resp = await processRefund(btn.dataset.id, true);
                    if (resp.ok) {
                        reload('✅ СБП-возврат выполнен.');
                    } else {
                        const e = await resp.json().catch(() => ({}));
                        alert('❌ ' + extractApiErrorMessage(e, 'Не удалось выполнить возврат.'));
                    }
                });
            });

            // ❌ Арендодатель отклоняет возврат
            document.querySelectorAll('[data-action="reject-refund"]').forEach(btn => {
                btn.addEventListener('click', async () => {
                    if (!confirm('Отклонить запрос на возврат средств?')) return;
                    const resp = await processRefund(btn.dataset.id, false);
                    if (resp.ok) {
                        reload('Запрос на возврат отклонён.');
                    } else {
                        const e = await resp.json().catch(() => ({}));
                        alert('❌ ' + extractApiErrorMessage(e, 'Ошибка.'));
                    }
                });
            });

            // ❌ Арендатор отказывается от аренды
            document.querySelectorAll('[data-action="renter-cancel-booking"]').forEach(btn => {
                btn.addEventListener('click', () => {
                    const bookingId = btn.dataset.id;
                    openHandoverModal({
                        title: '❌ Отказ от аренды',
                        sub: 'Вы собираетесь отменить аренду. Укажите причину — это поможет арендодателю.',
                        needPhoto: false,
                        needReason: true,
                        reasonPlaceholder: 'Причина отказа...',
                        confirmLabel: 'Отказаться от аренды',
                        confirmClass: 'btn-danger',
                        onConfirm: async ({ reason }) => {
                            const resp = await renterCancel(bookingId, reason);
                            closeHandoverModal();
                            if (resp.ok) {
                                reload('Аренда отменена.');
                            } else {
                                const e = await resp.json().catch(() => ({}));
                                alert('❌ ' + extractApiErrorMessage(e, 'Не удалось отменить аренду.'));
                            }
                        }
                    });
                });
            });
        }

        // ===== HANDOVER / RETURN / REFUND / CANCEL HELPERS =====

        

function getHandoverBadges(booking) {
            let html = '';
            if (booking.renter_pickup_confirmed) {
                html += '<span class="handover-status-badge confirmed">✅ Получение подтверждено</span> ';
            }
            if (booking.owner_return_confirmed) {
                html += '<span class="handover-status-badge confirmed">✅ Возврат подтверждён</span> ';
            }
            if (booking.return_requested && booking.return_status === 'requested') {
                html += '<span class="handover-status-badge refund-requested">⏳ СБП-возврат запрошен</span> ';
            }
            if (booking.return_status === 'completed') {
                html += '<span class="handover-status-badge refund-done">💰 СБП-возврат выполнен</span> ';
            }
            if (booking.return_status === 'rejected') {
                html += '<span class="handover-status-badge" style="background:#fde8e8;color:#b03020">❌ Возврат отклонён</span> ';
            }
            return html ? `<div style="margin-top:8px;display:flex;gap:6px;flex-wrap:wrap;">${html}</div>` : '';
        }

        // --- Handover modal controller ---
        let handoverActiveCallback = null;

        

function openHandoverModal({ title, sub, needPhoto = false, needReason = false, reasonPlaceholder = 'Опишите причину...', confirmLabel = 'Подтвердить', confirmClass = 'btn-primary', onConfirm }) {
            document.getElementById('handoverModalTitle').textContent = title;
            document.getElementById('handoverModalSub').textContent = sub;
            document.getElementById('handoverPhotoSection').style.display = needPhoto ? '' : 'none';
            document.getElementById('handoverReasonSection').style.display = needReason ? '' : 'none';
            document.getElementById('handoverReasonInput').placeholder = reasonPlaceholder;
            document.getElementById('handoverReasonInput').value = '';
            document.getElementById('handoverPhotoPreview').classList.remove('visible');
            document.getElementById('handoverPhotoName').textContent = '';
            document.getElementById('handoverPhotoInput').value = '';
            const confirmBtn = document.getElementById('handoverConfirmBtn');
            confirmBtn.textContent = confirmLabel;
            confirmBtn.className = confirmClass;
            handoverActiveCallback = onConfirm;
            document.getElementById('handoverOverlay').classList.add('active');
        }

        

function closeHandoverModal() {
            document.getElementById('handoverOverlay').classList.remove('active');
            handoverActiveCallback = null;
        }

        document.getElementById('handoverPhotoInput').addEventListener('change', function() {
            const file = this.files[0];
            if (!file) return;
            document.getElementById('handoverPhotoName').textContent = file.name;
            const reader = new FileReader();
            reader.onload = e => {
                const preview = document.getElementById('handoverPhotoPreview');
                preview.src = e.target.result;
                preview.classList.add('visible');
            };
            reader.readAsDataURL(file);
        });


        document.getElementById('handoverCancelBtn').addEventListener('click', closeHandoverModal);

        // ── Legal modals close handlers ─────────────────────────────────
        

function confirmRenterPickup(bookingId, photo) {
            const formData = new FormData();
            if (photo) formData.append('photo', photo);
            return await apiRequest(`/bookings/${bookingId}/confirm_renter_pickup/`, { method: 'POST', body: formData });
        }

        async 

function requestRefund(bookingId, reason) {
            return await apiRequest(`/bookings/${bookingId}/request_refund/`, { method: 'POST', body: JSON.stringify({ reason }) });
        }

        async 

function processRefund(bookingId, approved) {
            return await apiRequest(`/bookings/${bookingId}/process_refund/`, { method: 'POST', body: JSON.stringify({ approved }) });
        }

        async 

function renterCancel(bookingId, reason) {
            return await apiRequest(`/bookings/${bookingId}/renter_cancel/`, { method: 'POST', body: JSON.stringify({ reason }) });
        }


        

function formatContractStatus(status) {
            const map = {
                draft: 'Черновик договора',
                partially_signed: 'Подписан одной стороной',
                signed: 'Подписан обеими сторонами',
            };
            return map[status] || 'Договор';
        }

        

function renderContractSignState(title, signerName, signedAt, signatureCode) {
            if (!signedAt) {
                return `
                    <div class="contract-sign-state">
                        <strong>${escapeHtml(title)}</strong>
                        <div class="contract-sign-meta">Подпись ЭЦП пока не поставлена.</div>
                    </div>
                `;
            }

            return `
                <div class="contract-sign-state">
                    <strong>${escapeHtml(title)}</strong>
                    <div class="contract-sign-meta">
                        Подписант: ${escapeHtml(signerName || 'Не указан')}<br>
                        Дата подписи: ${escapeHtml(formatDateRu(signedAt))}<br>
                        Код ЭЦП: ${escapeHtml(signatureCode || '—')}
                    </div>
                </div>
            `;
        }

        async 

function getContractByBooking(bookingId) {
            try {
                const response = await apiRequest(`/contracts/by-booking/${bookingId}/`);
                if (!response.ok) {
                    const message = await readApiError(response, 'Не удалось загрузить договор.');
                    return { success: false, data: { error: message } };
                }
                const data = await response.json().catch(() => ({}));
                return { success: response.ok, data };
            } catch (error) {
                return { success: false, data: { error: 'Ошибка подключения при загрузке договора.' } };
            }
        }

        

function downloadContractFile(contract) {
            if (!contract?.file_url) {
                alert('❌ PDF договора пока недоступен');
                return;
            }

            const link = document.createElement('a');
            link.href = contract.file_url;
            link.download = `${contract.document_number || 'contract'}.pdf`;
            link.rel = 'noopener';
            document.body.appendChild(link);
            link.click();
            link.remove();
        }

        async 

function downloadContractPdfByBookingId(bookingId) {
            const result = await getContractByBooking(bookingId);
            if (!result.success) {
                alert(`❌ ${extractApiErrorMessage(result.data, 'Не удалось загрузить договор.')}`);
                return;
            }

            downloadContractFile(result.data);
        }

        async 

function signContractWithDemoEds(contractId, signerName, certificatePin) {
            try {
                const response = await apiRequest(`/contracts/${contractId}/sign/`, {
                    method: 'POST',
                    body: JSON.stringify({
                        signer_name: signerName,
                        certificate_pin: certificatePin,
                    })
                });
                if (!response.ok) {
                    const message = await readApiError(response, 'Не удалось подписать договор.');
                    return { success: false, data: { error: message } };
                }
                const data = await response.json().catch(() => ({}));
                return { success: response.ok, data };
            } catch (error) {
                return { success: false, data: { error: 'Ошибка подключения при подписании договора.' } };
            }
        }

        

function closeContractModal() {
            currentContractData = null;
            document.getElementById('contractModalOverlay')?.classList.remove('active');
            const container = document.getElementById('contractModalContent');
            if (container) container.innerHTML = '';
        }

        

