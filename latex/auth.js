function getAccessToken() { return localStorage.getItem('access_token'); }
        

function getRefreshToken() { return localStorage.getItem('refresh_token'); }
        

function setTokens(access, refresh, userId, username, email, userType, profileData) {
            localStorage.setItem('access_token', access);
            if (refresh) localStorage.setItem('refresh_token', refresh);
            if (userId) localStorage.setItem('user_id', userId);
            if (username) localStorage.setItem('username', username);
            if (email) localStorage.setItem('user_email', email);
            if (userType) localStorage.setItem('user_type', userType);

            if (profileData) {
                localStorage.setItem('is_superuser', profileData.is_superuser ? '1' : '0');
                if (profileData.full_name) localStorage.setItem('full_name', profileData.full_name);
                if (profileData.entrepreneur_name) localStorage.setItem('entrepreneur_name', profileData.entrepreneur_name);
                if (profileData.company_name) localStorage.setItem('company_name', profileData.company_name);
                if (profileData.passport_series) localStorage.setItem('passport_series', profileData.passport_series);
                if (profileData.passport_number) localStorage.setItem('passport_number', profileData.passport_number);
                if (profileData.inn) localStorage.setItem('inn', profileData.inn);
                if (profileData.ogrnip) localStorage.setItem('ogrnip', profileData.ogrnip);
                if (profileData.kpp) localStorage.setItem('kpp', profileData.kpp);
            }
        }

        

function clearTokens() {
            localStorage.removeItem('access_token');
            localStorage.removeItem('refresh_token');
            localStorage.removeItem('username');
            localStorage.removeItem('user_id');
            localStorage.removeItem('user_email');
            localStorage.removeItem('user_type');
            localStorage.removeItem('full_name');
            localStorage.removeItem('entrepreneur_name');
            localStorage.removeItem('company_name');
            localStorage.removeItem('passport_series');
            localStorage.removeItem('passport_number');
            localStorage.removeItem('inn');
            localStorage.removeItem('ogrnip');
            localStorage.removeItem('kpp');
            localStorage.removeItem('is_superuser');
        }

        

function isAuthenticated() { return !!getAccessToken(); }

        async 

function refreshAccessToken() {
            const refresh = getRefreshToken();
            if (!refresh) return false;
            try {
                const response = await fetch(`${API_BASE}/token/refresh/`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ refresh })
                });
                if (response.ok) {
                    const data = await response.json();
                    localStorage.setItem('access_token', data.access);
                    return true;
                }
            } catch (e) {}
            return false;
        }

        async 

function attachPasswordToggle(buttonId, inputId) {
            const button = document.getElementById(buttonId);
            const input = document.getElementById(inputId);
            if (!button || !input) return;

            button.addEventListener('click', () => {
                const isPassword = input.type === 'password';
                input.type = isPassword ? 'text' : 'password';
                button.textContent = isPassword ? '🙈' : '👁';
                button.setAttribute('aria-label', isPassword ? 'Скрыть пароль' : 'Показать пароль');
            });
        }

        

function getSavedProfile() {
            return {
                username: localStorage.getItem('username'),
                email: localStorage.getItem('user_email'),
                user_type: localStorage.getItem('user_type') || 'individual',
                full_name: localStorage.getItem('full_name') || '',
                entrepreneur_name: localStorage.getItem('entrepreneur_name') || '',
                company_name: localStorage.getItem('company_name') || '',
                passport_series: localStorage.getItem('passport_series') || '',
                passport_number: localStorage.getItem('passport_number') || '',
                inn: localStorage.getItem('inn') || '',
                ogrnip: localStorage.getItem('ogrnip') || '',
                kpp: localStorage.getItem('kpp') || ''
            };
        }

        async 

function getUserProfile() {
            try {
                const response = await apiRequest('/users/profile/');
                if (response.ok) {
                    const data = await response.json();
                    if (data.username) localStorage.setItem('username', data.username);
                    if (data.email) localStorage.setItem('user_email', data.email);
                    if (data.user_type) localStorage.setItem('user_type', data.user_type);
                    if (data.full_name !== undefined) localStorage.setItem('full_name', data.full_name || '');
                    if (data.entrepreneur_name !== undefined) localStorage.setItem('entrepreneur_name', data.entrepreneur_name || '');
                    if (data.company_name !== undefined) localStorage.setItem('company_name', data.company_name || '');
                    if (data.passport_series) localStorage.setItem('passport_series', data.passport_series);
                    if (data.passport_number) localStorage.setItem('passport_number', data.passport_number);
                    if (data.inn) localStorage.setItem('inn', data.inn);
                    if (data.ogrnip) localStorage.setItem('ogrnip', data.ogrnip);
                    if (data.kpp) localStorage.setItem('kpp', data.kpp);
                    return data;
                }
            } catch (e) {}
            return getSavedProfile();
        }

        async 

function updateProfile(profileData) {
            try {
                const response = await apiRequest('/users/profile/', {
                    method: 'PUT',
                    body: JSON.stringify(profileData)
                });
                if (response.ok) {
                    const data = await response.json();
                    if (data.username) localStorage.setItem('username', data.username);
                    if (data.email) localStorage.setItem('user_email', data.email);
                    if (data.full_name !== undefined) localStorage.setItem('full_name', data.full_name || '');
                    if (data.entrepreneur_name !== undefined) localStorage.setItem('entrepreneur_name', data.entrepreneur_name || '');
                    if (data.company_name !== undefined) localStorage.setItem('company_name', data.company_name || '');
                    if (data.passport_series) localStorage.setItem('passport_series', data.passport_series);
                    if (data.passport_number) localStorage.setItem('passport_number', data.passport_number);
                    if (data.inn) localStorage.setItem('inn', data.inn);
                    if (data.ogrnip) localStorage.setItem('ogrnip', data.ogrnip);
                    if (data.kpp) localStorage.setItem('kpp', data.kpp);
                    return { success: true, data };
                } else {
                    const detail = await readApiError(response, 'Не удалось обновить профиль.');
                    return { success: false, error: { detail } };
                }
            } catch (error) {
                return { success: false, error: { detail: 'Ошибка подключения' } };
            }
        }

        async 

function showProfileValidationError(msg) {
                    const msgDiv = document.getElementById('profileMessage');
                    msgDiv.innerHTML = `<div class="error-message-box validation-error-highlight">❌ По результатам проверки вы ввели некорректные данные:<br><strong>${escapeHtml(msg)}</strong></div>`;
                    msgDiv.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }

                const result = await updateProfile(updateData);
                const msgDiv = document.getElementById('profileMessage');
                if (result.success) {
                    msgDiv.innerHTML = '<div class="success-message">✅ Профиль успешно обновлён!</div>';
                    localStorage.setItem('username', updateData.username);
                    localStorage.setItem('user_email', updateData.email);
                    setTimeout(() => msgDiv.innerHTML = '', 2000);
                    updateNavBar();
                } else {
                    const errorMessage = extractApiErrorMessage(result.error, 'Не удалось обновить профиль.');
                    msgDiv.innerHTML = `<div class="error-message-box">❌ ${escapeHtml(errorMessage)}</div>`;
                }
            });

            document.getElementById('passwordForm').addEventListener('submit', async (e) => {
                e.preventDefault();
                const msgDiv = document.getElementById('profileMessage');
                const newPassword = document.getElementById('newPassword').value;
                const confirmPassword = document.getElementById('confirmPassword').value;

                if (newPassword !== confirmPassword) {
                    msgDiv.innerHTML = '<div class="error-message-box">❌ Пароли не совпадают</div>';
                    return;
                }

                if (newPassword.length < 4) {
                    msgDiv.innerHTML = '<div class="error-message-box">❌ Пароль должен быть не менее 4 символов</div>';
                    return;
                }

                const result = await changePassword(document.getElementById('oldPassword').value, newPassword);
                if (result.success) {
                    msgDiv.innerHTML = '<div class="success-message">✅ Пароль успешно изменён!</div>';
                    document.getElementById('oldPassword').value = '';
                    document.getElementById('newPassword').value = '';
                    document.getElementById('confirmPassword').value = '';
                    setTimeout(() => msgDiv.innerHTML = '', 2000);
                } else {
                    const errorMessage = extractApiErrorMessage(result.error, 'Не удалось изменить пароль.');
                    msgDiv.innerHTML = `<div class="error-message-box">❌ ${escapeHtml(errorMessage)}</div>`;
                }
            });

            document.getElementById('backToMainFromProfile')?.addEventListener('click', () => showMainPage());

            // Кнопка «Заполнить по ИНН» в профиле
            if (userType === 'entrepreneur') {
                document.getElementById('profileFillByInnBtn')?.addEventListener('click', () => fillByInn('profile', 'entrepreneur'));
            } else if (userType === 'legal') {
                document.getElementById('profileFillByInnBtn')?.addEventListener('click', () => fillByInn('profile', 'legal'));
            }
        }

        async 

function renderRegisterExtraFields() {
                const userType = document.getElementById('regUserType')?.value || 'individual';
                const box = document.getElementById('registerExtraFields');
                if (!box) return;

                if (userType === 'individual') {
                    box.innerHTML = `
                        <div class="user-type-info">
                            <h4>📄 Профиль физического лица</h4>
                            <div class="input-group"><label>ФИО *</label><input type="text" id="regFullName" maxlength="255" placeholder="Иванов Иван Иванович"></div>
                            <div class="input-group"><label>Серия паспорта</label><input type="text" id="regPassportSeries" placeholder="Серия паспорта (4 цифры)"></div>
                            <div class="input-group"><label>Номер паспорта</label><input type="text" id="regPassportNumber" placeholder="Номер паспорта (6 цифр) "></div>
                            <div class="input-group"><label>ИНН</label><input type="text" id="regInn" placeholder="ИНН (12 цифр)"></div>
                        </div>
                    `;
                } else if (userType === 'entrepreneur') {
                    box.innerHTML = `
                        <div class="user-type-info">
                            <h4>🏢 Профиль ИП</h4>
                            <div class="inn-autofill-row">
                                <div class="input-group" style="flex:1;margin-bottom:0">
                                    <label>ИНН <span style="font-weight:normal;font-size:12px;color:#6b7280">(12 цифр)</span></label>
                                    <input type="text" id="regInn" maxlength="12" placeholder="Введите ИНН для автозаполнения">
                                </div>
                                <button type="button" class="btn-fill-inn" id="regFillByInnBtn">🔍 Заполнить по ИНН</button>
                            </div>
                            <div id="regInnStatus" class="inn-status-msg" style="display:none"></div>
                            <div class="input-group"><label>Наименование ИП</label><input type="text" id="regEntrepreneurName" maxlength="255" placeholder="ИП Иванов Иван Иванович"></div>
                            <div class="input-group"><label>ИНН</label><input type="text" id="regInn" placeholder="ИНН (12 цифр)"></div>
                            <div class="input-group"><label>ОГРНИП</label><input type="text" id="regOgrnip" placeholder="ОГРНИП (15 цифр)"></div>
                        </div>
                    `;
                    document.getElementById('regFillByInnBtn').addEventListener('click', () => fillByInn('reg', 'entrepreneur'));
                } else {
                    box.innerHTML = `
                        <div class="user-type-info">
                            <h4>🏛️ Профиль юридического лица</h4>
                            <div class="inn-autofill-row">
                                <div class="input-group" style="flex:1;margin-bottom:0">
                                    <label>ИНН <span style="font-weight:normal;font-size:12px;color:#6b7280">(10 цифр)</span></label>
                                    <input type="text" id="regInn" maxlength="10" placeholder="Введите ИНН для автозаполнения">
                                </div>
                                <button type="button" class="btn-fill-inn" id="regFillByInnBtn">🔍 Заполнить по ИНН</button>
                            </div>
                            <div id="regInnStatus" class="inn-status-msg" style="display:none"></div>
                            <div class="input-group"><label>Наименование организации</label><input type="text" id="regCompanyName" maxlength="255" placeholder="ООО Ромашка"></div>
                            <div class="input-group"><label>ИНН</label><input type="text" id="regInn" placeholder="ИНН (10 цифр)"></div>
                            <div class="input-group"><label>КПП</label><input type="text" id="regKpp" placeholder="КПП (9 цифр)"></div>
                        </div>
                    `;
                    document.getElementById('regFillByInnBtn').addEventListener('click', () => fillByInn('reg', 'legal'));
                }
            }

            renderRegisterExtraFields();
            document.getElementById('regUserType')?.addEventListener('change', renderRegisterExtraFields);
            attachPasswordToggle('toggleRegPassword', 'regPassword');
            attachPasswordToggle('toggleRegPassword2', 'regPassword2');

            // Логика кнопки «Получить код»
            let emailCodeSent = false;
            let sendCodeCooldown = null;
            document.getElementById('sendEmailCodeBtn')?.addEventListener('click', async () => {
                const email = document.getElementById('regEmail').value.trim();
                if (!email) { alert('❌ Введите email'); return; }
                const btn = document.getElementById('sendEmailCodeBtn');
                const status = document.getElementById('emailCodeStatus');
                btn.disabled = true;
                btn.textContent = 'Отправка...';
                try {
                    const res = await fetch(`${API_BASE}/users/send-email-code/`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ email })
                    });
                    const data = await res.json();
                    if (res.ok) {
                        emailCodeSent = true;
                        document.getElementById('emailCodeGroup').style.display = '';
                        status.style.display = '';
                        status.style.color = 'green';
                        status.textContent = '✅ Код отправлен. Проверьте почту (действует 15 минут).';
                        // Cooldown 60 секунд
                        let seconds = 60;
                        btn.textContent = `Отправить повторно (${seconds}с)`;
                        sendCodeCooldown = setInterval(() => {
                            seconds--;
                            if (seconds <= 0) {
                                clearInterval(sendCodeCooldown);
                                btn.disabled = false;
                                btn.textContent = 'Отправить повторно';
                            } else {
                                btn.textContent = `Отправить повторно (${seconds}с)`;
                            }
                        }, 1000);
                    } else {
                        status.style.display = '';
                        status.style.color = 'red';
                        status.textContent = '❌ ' + (data.error || data.detail || 'Ошибка отправки кода');
                        btn.disabled = false;
                        btn.textContent = 'Получить код';
                    }
                } catch (e) {
                    status.style.display = '';
                    status.style.color = 'red';
                    status.textContent = '❌ Ошибка подключения к серверу';
                    btn.disabled = false;
                    btn.textContent = 'Получить код';
                }
            });

            document.getElementById('registerForm').addEventListener('submit', async (e) => {
                e.preventDefault();
                const password = document.getElementById('regPassword').value;
                const password2 = document.getElementById('regPassword2').value;
                if (password !== password2) {
                    alert('❌ Пароли не совпадают');
                    return;
                }

                const emailCode = (document.getElementById('regEmailCode')?.value || '').trim();
                if (!emailCodeSent) {
                    alert('❌ Сначала получите код подтверждения email — нажмите кнопку «Получить код».');
                    return;
                }
                if (!emailCode) {
                    alert('❌ Введите код подтверждения, который был отправлен на ваш email.');
                    return;
                }

                const userType = document.getElementById('regUserType').value;
                const extraProfileData = {
                    full_name: normalizeWhitespace(document.getElementById('regFullName')?.value || ''),
                    entrepreneur_name: normalizeWhitespace(document.getElementById('regEntrepreneurName')?.value || ''),
                    company_name: normalizeWhitespace(document.getElementById('regCompanyName')?.value || ''),
                    passport_series: document.getElementById('regPassportSeries')?.value || '',
                    passport_number: document.getElementById('regPassportNumber')?.value || '',
                    inn: document.getElementById('regInn')?.value || '',
                    ogrnip: document.getElementById('regOgrnip')?.value || '',
                    kpp: document.getElementById('regKpp')?.value || ''
                };

                if (userType === 'individual') {
                    if (!extraProfileData.full_name) {
                        alert('❌ Укажите ФИО.');
                        return;
                    }
                    if (!isValidRussianFullName(extraProfileData.full_name)) {
                        alert('❌ ФИО должно содержать минимум 3 слова через пробелы и только русские буквы.');
                        return;
                    }
                }

                if (extraProfileData.entrepreneur_name.length > 255) {
                    showRegValidationError('❌ Наименование ИП слишком длинное. Максимум 255 символов.');
                    return;
                }

                if (extraProfileData.company_name.length > 255) {
                    showRegValidationError('❌ Наименование организации слишком длинное. Максимум 255 символов.');
                    return;
                }

                // Клиентская проверка реквизитов по типу пользователя
                if (userType === 'entrepreneur') {
                    const innVal = extraProfileData.inn;
                    const ogrnipVal = extraProfileData.ogrnip;
                    if (innVal) {
                        const innErr = validateInnClient(innVal, 'entrepreneur');
                        if (innErr) { showRegValidationError('❌ ' + innErr); return; }
                    }
                    if (ogrnipVal) {
                        const ogrnipErr = validateOgrnipClient(ogrnipVal);
                        if (ogrnipErr) { showRegValidationError('❌ ' + ogrnipErr); return; }
                    }
                } else if (userType === 'legal') {
                    const innVal = extraProfileData.inn;
                    const kppVal = extraProfileData.kpp;
                    if (innVal) {
                        const innErr = validateInnClient(innVal, 'legal');
                        if (innErr) { showRegValidationError('❌ ' + innErr); return; }
                    }
                    if (kppVal) {
                        const kppErr = validateKppClient(kppVal);
                        if (kppErr) { showRegValidationError('❌ ' + kppErr); return; }
                    }
                }


function openForgotPasswordModal() {
                if (forgotPasswordModal) {
                    forgotPasswordModal.style.display = 'flex';
                    // Очищаем поля при открытии
                    const emailInput = document.getElementById('forgotEmail');
                    const codeInput = document.getElementById('forgotCode');
                    const passwordInput = document.getElementById('forgotNewPassword');
                    if (emailInput) emailInput.value = '';
                    if (codeInput) codeInput.value = '';
                    if (passwordInput) passwordInput.value = '';
                }
            }

            // Функция закрытия модального окна
            

function closeForgotPasswordModal() {
                if (forgotPasswordModal) {
                    forgotPasswordModal.style.display = 'none';
                }
            }

            // Клик по кнопке "Забыли пароль?"
            const forgotPasswordBtn = document.getElementById('forgotPasswordBtn');
            if (forgotPasswordBtn) {
                forgotPasswordBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    openForgotPasswordModal();
                });
            }

            // Закрытие по кнопке ×
            if (forgotPasswordCloseBtn) {
                forgotPasswordCloseBtn.addEventListener('click', closeForgotPasswordModal);
            }

            // Закрытие по клику вне модального окна
            if (forgotPasswordModal) {
                forgotPasswordModal.addEventListener('click', (e) => {
                    if (e.target === forgotPasswordModal) {
                        closeForgotPasswordModal();
                    }
                });
            }

            // Отправка кода на email
            if (forgotPasswordSendCodeBtn) {
                forgotPasswordSendCodeBtn.addEventListener('click', async () => {
                    const emailInput = document.getElementById('forgotEmail');
                    const email = emailInput ? emailInput.value.trim() : '';
                    
                    if (!email) {
                        alert('❌ Введите email');
                        return;
                    }
                    
                    // Блокируем кнопку на время запроса
                    forgotPasswordSendCodeBtn.disabled = true;
                    forgotPasswordSendCodeBtn.textContent = 'Отправка...';
                    
                    try {
                        const requestResult = await requestPasswordReset(email);
                        
                        if (!requestResult.ok) {
                            alert(`❌ ${extractApiErrorMessage(requestResult.data, 'Не удалось отправить код.')}`);
                            return;
                        }
                        
                        alert('✅ Код отправлен на вашу почту');
                        // Фокусируемся на поле ввода кода
                        const codeInput = document.getElementById('forgotCode');
                        if (codeInput) codeInput.focus();
                    } catch (error) {
                        alert('❌ Ошибка при отправке кода');
                    } finally {
                        forgotPasswordSendCodeBtn.disabled = false;
                        forgotPasswordSendCodeBtn.textContent = 'Отправить код';
                    }
                });
            }

            // Подтверждение смены пароля
            if (forgotPasswordForm) {
                forgotPasswordForm.addEventListener('submit', async (e) => {
                    e.preventDefault();
                    
                    const emailInput = document.getElementById('forgotEmail');
                    const codeInput = document.getElementById('forgotCode');
                    const passwordInput = document.getElementById('forgotNewPassword');
                    
                    const email = emailInput ? emailInput.value.trim() : '';
                    const code = codeInput ? codeInput.value.trim() : '';
                    const newPassword = passwordInput ? passwordInput.value : '';
                    
                    if (!email || !code || !newPassword) {
                        alert('❌ Заполните все поля');
                        return;
                    }
                    
                    if (newPassword.length < 6) {
                        alert('❌ Пароль должен быть не короче 6 символов');
                        return;
                    }
                    
                    // Блокируем кнопку на время запроса
                    if (forgotPasswordSubmitBtn) {
                        forgotPasswordSubmitBtn.disabled = true;
                        forgotPasswordSubmitBtn.textContent = 'Подтверждение...';
                    }
                    
                    try {
                        const confirmResult = await confirmPasswordReset(email, code, newPassword);
                        
                        if (!confirmResult.ok) {
                            alert(`❌ ${extractApiErrorMessage(confirmResult.data, 'Не удалось изменить пароль.')}`);
                            return;
                        }
                        
                        clearTokens();
                        updateNavBar();
                        alert('✅ Пароль изменён. Войдите заново с новым паролем.');
                        closeForgotPasswordModal();
                        showLoginPage();
                    } catch (error) {
                        alert('❌ Ошибка при смене пароля');
                    } finally {
                        if (forgotPasswordSubmitBtn) {
                            forgotPasswordSubmitBtn.disabled = false;
                            forgotPasswordSubmitBtn.textContent = 'Подтвердить и сменить пароль';
                        }
                    }
                });
            }

            // Обработчики для входа и переключения
            document.getElementById('loginForm').addEventListener('submit', async (e) => {
                e.preventDefault();
                const success = await login(
                    document.getElementById('loginUsername').value,
                    document.getElementById('loginPassword').value
                );
                if (success) {
                    showMainPage();
                    loadProducts(1);
                }
            });

            document.getElementById('switchToRegister')?.addEventListener('click', (e) => { 
                e.preventDefault(); 
                showRegisterPage(); 
            });
            
            document.getElementById('backToMainFromLogin')?.addEventListener('click', () => showMainPage());
        }
