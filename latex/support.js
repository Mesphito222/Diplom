function ensureSupportFaqLoaded() {
            if (supportFaqLoaded && supportFaq.length) return supportFaq;

            try {
                const response = await apiRequest('/chats/support-faq/');
                if (response.ok) {
                    const data = await response.json();
                    supportFaq = Array.isArray(data.questions) ? data.questions : supportFallbackFaq;
                } else {
                    supportFaq = supportFallbackFaq;
                }
            } catch (error) {
                supportFaq = supportFallbackFaq;
            }

            supportFaqLoaded = true;
            return supportFaq;
        }

        

function renderSupportQuestions() {
            const container = document.getElementById('supportQuestions');
            if (!container) return;

            container.innerHTML = supportFaq.map(item => `
                <button class="support-question-btn ${item.id === supportActiveQuestionId ? 'active' : ''}" data-question-id="${item.id}" type="button">
                    ${escapeHtml(item.question)}
                </button>
            `).join('');

            container.querySelectorAll('.support-question-btn').forEach((button) => {
                button.addEventListener('click', () => {
                    supportActiveQuestionId = button.dataset.questionId;
                    renderSupportQuestions();
                    renderSupportMessages();
                });
            });
        }

        async 