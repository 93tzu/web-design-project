

document.addEventListener("DOMContentLoaded", function () {

    // ===== 你可以在這裡調整行為 =====
    const ONLY_ONE_OPEN = true;           // true = 一次只開一題；false = 可同時開很多題
    const AUTO_CLOSE_HIDDEN_ITEMS = true; // 搜尋後把被隱藏的題目自動關起來
    const SEARCH_DELAY = 150;             // debounce 延遲（毫秒）

    // ===== 抓元素 =====
    const faqSection = document.querySelector(".faq-section"); // FAQ 區塊
    const items = document.querySelectorAll(".faq-item");      // 每一題容器
    const searchInput = document.getElementById("faqSearch");  // 搜尋框

    // 若頁面沒有 FAQ，就不做任何事（避免其他頁面報錯）
    if (!faqSection || items.length === 0) return;

    // ===== 建立「沒有結果」提示文字 =====
    const noResult = document.createElement("p");
    noResult.className = "faq-no-result";
    noResult.textContent = "No results found. Try different keywords.";
    noResult.style.display = "none";
    faqSection.appendChild(noResult);

    // ===== 小工具：設定某一題「開」或「關」 =====
    function setItemOpen(item, shouldOpen) {
        const btn = item.querySelector(".faq-question");
        const answer = item.querySelector(".faq-answer");
        const icon = item.querySelector(".faq-icon");

        if (!btn || !answer) return;

        if (shouldOpen) {
            item.classList.add("open");
            btn.setAttribute("aria-expanded", "true");
            answer.hidden = false;
            if (icon) icon.textContent = "▴";
        } else {
            item.classList.remove("open");
            btn.setAttribute("aria-expanded", "false");
            answer.hidden = true;
            if (icon) icon.textContent = "▾";
        }
    }

    // ===== 小工具：關掉全部題目 =====
    function closeAllItems(exceptItem) {
        items.forEach(function (it) {
            if (exceptItem && it === exceptItem) return;
            setItemOpen(it, false);
        });
    }

    // ===== 初始化：補上 aria-controls / id，並把每題預設關起來 =====
    items.forEach(function (item, index) {
        const btn = item.querySelector(".faq-question");
        const answer = item.querySelector(".faq-answer");

        if (!btn || !answer) return;

        // 給答案一個唯一 id（如果原本沒有）
        if (!answer.id) {
            answer.id = "faq-answer-" + (index + 1);
        }

        // 讓按鈕知道它控制哪個答案（無障礙用）
        btn.setAttribute("aria-controls", answer.id);

        // 預設都關起來（確保狀態一致）
        setItemOpen(item, false);

        // 點擊：切換開關
        btn.addEventListener("click", function () {
            const isOpen = item.classList.contains("open");

            if (ONLY_ONE_OPEN) {
                closeAllItems(item);
            }

            setItemOpen(item, !isOpen);
        });

        // 鍵盤：Enter / Space 也能切換
        btn.addEventListener("keydown", function (e) {
            if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                btn.click();
            }
        });
    });

    // ===== debounce：避免每打 1 個字就跑一次過濾（更順） =====
    function debounce(fn, delay) {
        let timer = null;
        return function () {
            const args = arguments;
            clearTimeout(timer);
            timer = setTimeout(function () {
                fn.apply(null, args);
            }, delay);
        };
    }

    // ===== 搜尋高亮：先把原始文字存起來（只做一次） =====
    items.forEach(function (item) {
        const qText = item.querySelector(".faq-q-text");
        const aP = item.querySelector(".faq-answer p"); // 你現在答案都是 <p>，先用這個最簡單

        if (qText && !qText.dataset.original) {
            qText.dataset.original = qText.textContent;
        }
        if (aP && !aP.dataset.original) {
            aP.dataset.original = aP.textContent;
        }
    });

    // 把特殊字元跳脫，避免 regex 壞掉（例如輸入 ? . *）
    function escapeRegExp(str) {
        return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    }

    // 把 keyword 用 <mark> 上底色
    function highlightText(originalText, keyword) {
        if (!keyword) return originalText;
        const safe = escapeRegExp(keyword);
        const regex = new RegExp(`(${safe})`, "gi");
        return originalText.replace(regex, "<mark>$1</mark>");
    }

    // ===== 搜尋：過濾 + 高亮 =====
    function filterFAQ(keyword) {
        const k = keyword.toLowerCase().trim();
        let visibleCount = 0;

        items.forEach(function (item) {
            const qText = item.querySelector(".faq-q-text");
            const aP = item.querySelector(".faq-answer p");

            // 先還原成原始文字（清掉上一次的 mark）
            if (qText && qText.dataset.original) {
                qText.innerHTML = qText.dataset.original;
            }
            if (aP && aP.dataset.original) {
                aP.innerHTML = aP.dataset.original;
            }

            // 空字串：全部顯示、不要高亮
            if (k === "") {
                item.style.display = "";
                visibleCount += 1;
                return;
            }

            // 用原始文字比對
            const qOriginal = qText && qText.dataset.original ? qText.dataset.original : "";
            const aOriginal = aP && aP.dataset.original ? aP.dataset.original : "";
            const combined = (qOriginal + " " + aOriginal).toLowerCase();

            const matched = combined.includes(k);

            if (matched) {
                item.style.display = "";
                visibleCount += 1;

                // 高亮：問題 + 答案都上底色
                if (qText) qText.innerHTML = highlightText(qOriginal, k);
                if (aP) aP.innerHTML = highlightText(aOriginal, k);

            } else {
                item.style.display = "none";

                if (AUTO_CLOSE_HIDDEN_ITEMS) {
                    setItemOpen(item, false);
                }
            }
        });

        noResult.style.display = visibleCount === 0 ? "" : "none";
    }

    // ===== 綁定搜尋事件（你剛剛少掉的就是這段） =====
    if (searchInput) {
        searchInput.addEventListener(
            "input",
            debounce(function () {
                filterFAQ(searchInput.value);
            }, SEARCH_DELAY)
        );
    }

});



/* =========================
   Contact Form Interaction
   ========================= */

document.addEventListener("DOMContentLoaded", function () {
    const contactForm = document.getElementById("contactForm");

    if (!contactForm) return;

    contactForm.addEventListener("submit", function (event) {
        event.preventDefault();

        const userConfirmed = confirm("Do you want to submit this inquiry?");

        if (userConfirmed) {
            alert("Thank you! This demo inquiry has been submitted successfully.");

            contactForm.reset();
        }
    });
});