
function getItemImages(item) {
            const images = Array.isArray(item?.images) ? item.images.map(img => img?.image).filter(Boolean) : [];
            if (item?.image && !images.includes(item.image)) images.unshift(item.image);
            if (!images.length) {
                images.push('https://placehold.co/900x700/eef2f7/2b6a7c?text=Нет+фото');
            }
            return images;
        }

        

function getItemVideos(item) {
            return [];
        }

        

function isProductAvailableForFilter(product) {
            if (availabilityFilterMode === 'all') return true;

            let start = '';
            let end = '';
            const today = getTodayDateString();

            if (availabilityFilterMode === 'today') {
                start = today;
                end = addDays(today, 1);
            } else if (availabilityFilterMode === 'tomorrow') {
                start = addDays(today, 1);
                end = addDays(today, 2);
            } else if (availabilityFilterMode === 'custom') {
                if (!availabilityFilterStart) return true;
                start = availabilityFilterStart;
                end = availabilityFilterEnd || addDays(availabilityFilterStart, 1);
                if (end <= start) end = addDays(start, 1);
            }

            const bookedRanges = Array.isArray(product?.booked_ranges) ? product.booked_ranges : [];
            return !bookedRanges.some(range => rangeOverlaps(start, end, range.start_date, range.end_date));
        }

        

function renderItemPreview(item, reviewBooking = null) {
            const images = getItemImages(item);
            const bookedRanges = Array.isArray(item?.booked_ranges) ? item.booked_ranges : [];
            const freeLabels = getFreeDateLabels(bookedRanges);
            const reviews = Array.isArray(item?.item_reviews) ? item.item_reviews : [];
            const currentUserId = String(localStorage.getItem('user_id') || '');
            const isOwner = currentUserId && String(item?.owner || '') === currentUserId;
            const actionButtons = !isOwner ? `
                <div class="item-preview-actions">
                    <button class="btn-primary" id="itemPreviewRentBtn" type="button">Арендовать</button>
                    <button class="btn-outline" id="itemPreviewChatBtn" type="button">Написать продавцу</button>
                </div>
            ` : '';

            return `
                <div class="item-preview-layout">
                    <div>
                        <img class="item-gallery-main" id="itemPreviewMainImage" src="${images[0]}" alt="${escapeHtml(item.title || 'Объявление')}">
                        <div class="item-gallery-thumbs">
                            ${images.map(src => `<img class="item-gallery-thumb" src="${src}" data-preview-image="${src}" alt="Фото товара">`).join('')}
                        </div>
                    </div>
                    <div class="item-preview-panel">
                        <div class="item-preview-price">${formatPrice(getDisplayPrice(item))} / день</div>
                        <div style="font-size:0.85rem;color:#5a8090;margin-top:4px;">${Number(item.deposit) > 0 ? `Залог: ${formatPrice(Number(item.deposit))}` : 'Без залога'}</div>
                        ${actionButtons}
                        <div class="item-preview-meta">
                            <div><strong>Владелец:</strong> ${escapeHtml(item.owner_username || 'Не указан')}</div>
                            <div><strong>Рейтинг продавца:</strong> ${Number(item.owner_rating || 0).toFixed(1)} / 5 (${item.owner_reviews_count || 0} отзывов)</div>
                            <div><strong>Описание:</strong> ${escapeHtml(item.description || 'Описание пока не добавлено.')}</div>
                        </div>

                        <div class="preview-section-title">Свободные даты</div>
                        <div class="date-pill-list">
                            ${freeLabels.map(label => `<span class="date-pill">${escapeHtml(label)}</span>`).join('')}
                        </div>

                        <div class="preview-section-title">Занятые периоды</div>
                        <div class="date-pill-list">
                            ${bookedRanges.length
                                ? bookedRanges.map(range => `<span class="date-pill booked">${escapeHtml(formatDateRu(range.start_date))} - ${escapeHtml(formatDateRu(range.end_date))}</span>`).join('')
                                : '<span class="date-pill">Пока нет занятых дат</span>'}
                        </div>
                    </div>
                </div>

                <div class="preview-section-title">Отзывы</div>
                ${reviews.length
                    ? `<div class="review-list">
                        ${reviews.map(review => `
                            <div class="review-card">
                                <div class="review-head">
                                    <span class="review-author">${escapeHtml(review.author_username || 'Пользователь')}</span>
                                    <span>${'★'.repeat(Number(review.rating || 0))}${'☆'.repeat(Math.max(0, 5 - Number(review.rating || 0)))}</span>
                                </div>
                                <div class="review-head">
                                    <span>${formatDateRu(review.created_at)}</span>
                                </div>
                                <div>${escapeHtml(review.comment || 'Пользователь поставил оценку без текста.')}</div>
                            </div>
                        `).join('')}
                    </div>`
                    : '<div class="empty-message">У этого объявления пока нет отзывов.</div>'}

                ${reviewBooking ? `
                    <div class="review-form">
                        <button class="btn-primary" id="toggleReviewFormBtn" type="button">Оставить отзыв</button>
                        <div id="reviewFormFields" style="display:none; margin-top:14px;">
                            <div class="preview-section-title" style="margin-top:0;">Ваш отзыв</div>
                            <div class="item-preview-subtitle">Оплата прошла успешно. Поделитесь впечатлением об аренде и объявлении.</div>
                            <select id="reviewRatingInput">
                                <option value="5">5 звезд</option>
                                <option value="4">4 звезды</option>
                                <option value="3">3 звезды</option>
                                <option value="2">2 звезды</option>
                                <option value="1">1 звезда</option>
                            </select>
                            <textarea id="reviewCommentInput" rows="4" placeholder="Напишите короткий отзыв"></textarea>
                            <button class="btn-primary" id="submitReviewBtn" type="button" data-booking-id="${reviewBooking.id}">Отправить отзыв</button>
                            <div id="reviewFormMessage" style="margin-top:12px;"></div>
                        </div>
                    </div>
                ` : ''}
            `;
        }

        async 

function openItemPreview(item) {
            activePreviewItemId = item?.id || null;
            let reviewBooking = null;
            if (isAuthenticated()) {
                const outgoingBookings = await getOutgoingBookings();
                reviewBooking = outgoingBookings.find(booking =>
                    (String(booking.item) === String(item.id) || String(booking.item?.id) === String(item.id)) &&
                    canLeaveReviewForBooking(booking)
                ) || null;
            }

            document.getElementById('itemPreviewTitle').textContent = item.title || item.name || 'Объявление';
            document.getElementById('itemPreviewSubtitle').textContent = `Подробная информация о товаре от ${item.owner_username || 'владельца'}`;
            document.getElementById('itemPreviewContent').innerHTML = renderItemPreview(item, reviewBooking);
            document.getElementById('itemPreviewOverlay')?.classList.add('active');

            document.querySelectorAll('[data-preview-image]').forEach(img => {
                img.addEventListener('click', () => {
                    const main = document.getElementById('itemPreviewMainImage');
                    if (main) main.src = img.dataset.previewImage;
                });
            });

            document.getElementById('itemPreviewChatBtn')?.addEventListener('click', async () => {
                if (!isAuthenticated()) {
                    alert('Пожалуйста, войдите в систему');
                    showLoginPage();
                    return;
                }

                closeItemPreview();
                await startChat(item.owner, item.id);
            });

            document.getElementById('itemPreviewRentBtn')?.addEventListener('click', async () => {
                if (!isAuthenticated()) {
                    alert('Пожалуйста, войдите в систему');
                    showLoginPage();
                    return;
                }

                closeItemPreview();
                await openRentalModal(item);
            });

            document.getElementById('toggleReviewFormBtn')?.addEventListener('click', () => {
                const fields = document.getElementById('reviewFormFields');
                const toggleBtn = document.getElementById('toggleReviewFormBtn');
                if (fields) {
                    const shouldShow = fields.style.display === 'none';
                    fields.style.display = shouldShow ? 'block' : 'none';
                    if (toggleBtn) {
                        toggleBtn.textContent = shouldShow ? 'Закрыть поле для отзыва' : 'Оставить отзыв';
                    }
                }
            });

            document.getElementById('submitReviewBtn')?.addEventListener('click', async () => {
                const rating = Number(document.getElementById('reviewRatingInput')?.value || 5);
                const comment = document.getElementById('reviewCommentInput')?.value || '';
                const messageBox = document.getElementById('reviewFormMessage');
                const result = await submitReview(reviewBooking.id, rating, comment);
                if (result.success) {
                    if (messageBox) messageBox.innerHTML = '<div class="success-message">✅ Отзыв отправлен.</div>';
                    const refreshed = await apiRequest(`/items/${item.id}/`);
                    if (refreshed.ok) {
                        const updatedItem = await refreshed.json();
                        upsertCachedItem(updatedItem);
                        setTimeout(() => openItemPreview(updatedItem), 400);
                    }
                } else if (messageBox) {
                    const errorMessage = extractApiErrorMessage(result.data, 'Не удалось отправить отзыв.');
                    messageBox.innerHTML = `<div class="error-message-box">❌ ${escapeHtml(errorMessage)}</div>`;
                }
            });
        }

        

function closeItemPreview() {
            activePreviewItemId = null;
            document.getElementById('itemPreviewOverlay')?.classList.remove('active');
            document.getElementById('itemPreviewContent').innerHTML = '';
        }

        

function formatItemStatus(status) {
            const map = {
                pending: 'На модерации',
                available: 'Доступно',
                unavailable: 'Недоступно',
                blocked: 'Заблокировано',
                archived: 'В архиве'
            };
            return map[status] || 'Неизвестно';
        }

        async 

function getBookedRangesForItem(itemId) {
            try {
                const directResponse = await apiRequest(`/items/${itemId}/booked_ranges/`);
                if (directResponse.ok) {
                    const data = await directResponse.json();
                    return Array.isArray(data) ? data : (data.booked_ranges || []);
                }
            } catch (error) {}

            const fallback = allProducts.find(item => String(item.id) === String(itemId));
            if (Array.isArray(fallback?.booked_ranges)) return fallback.booked_ranges;

            return [];
        }

        async 

function deleteItem(productId, options = {}) {
            try {
                const response = await apiRequest(`/items/${productId}/`, { method: 'DELETE' });
                if (response.ok) {
                    alert(options.successMessage || '✅ Объявление удалено');
                    if (typeof options.onSuccess === 'function') {
                        await options.onSuccess();
                    } else {
                        loadProducts(currentPage);
                    }
                    return true;
                } else {
                    alert(options.errorMessage || '❌ Ошибка при удалении');
                }
            } catch (error) {
                alert(options.networkErrorMessage || '❌ Ошибка подключения');
            }
            return false;
        }

function uploadItemMedia(itemId, mediaFiles, token) {
            const mediaUploadErrors = [];

            if (!mediaFiles || !mediaFiles.length) return mediaUploadErrors;

            for (const mediaFile of mediaFiles) {
                const uploadFormData = new FormData();
                uploadFormData.append('item', itemId);
                uploadFormData.append('image', mediaFile);

                const uploadResp = await apiRequest('/items/upload-image/', {
                    method: 'POST',
                    headers: { 'Authorization': `Bearer ${token}` },
                    body: uploadFormData
                });

                if (!uploadResp.ok) {
                    const uploadMessage = await readApiError(uploadResp, 'Не удалось загрузить фото.');
                    mediaUploadErrors.push(`${mediaFile.name}: ${uploadMessage}`);
                    console.error('❌ Ошибка загрузки медиа:', uploadMessage);
                }
            }

            return mediaUploadErrors;
        }

        async 

            const confirmDeleteOverlay = document.getElementById('confirmDeleteOverlay');
            const openDeleteConfirm = () => confirmDeleteOverlay?.classList.add('active');
            const closeDeleteConfirm = () => confirmDeleteOverlay?.classList.remove('active');

            document.getElementById('deleteItemFromEditBtn')?.addEventListener('click', openDeleteConfirm);
            document.getElementById('cancelDeleteItemBtn')?.addEventListener('click', closeDeleteConfirm);
            document.getElementById('confirmDeleteItemBtn')?.addEventListener('click', async () => {
                const deleted = await deleteItem(editItem.id, {
                    successMessage: '✅ Объявление удалено',
                    onSuccess: async () => {
                        closeDeleteConfirm();
                        await showMyItemsPage();
                    },
                    errorMessage: '❌ Ошибка при удалении объявления',
                });

                if (!deleted) {
                    closeDeleteConfirm();
                }
            });
            confirmDeleteOverlay?.addEventListener('click', (event) => {
                if (event.target?.id === 'confirmDeleteOverlay') {
                    closeDeleteConfirm();
                }
            });

            document.getElementById('backToMyItemsFromEdit')?.addEventListener('click', () => showMyItemsPage());
        }