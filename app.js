(() => {
  "use strict";

  const STORAGE_KEY = "book-leaf-records-v1";
  const MONTH_NAMES = ["1월", "2월", "3월", "4월", "5월", "6월", "7월", "8월", "9월", "10월", "11월", "12월"];
  const PALETTES = [
    ["#eff8d7", "#6e9b37"], ["#fff2c6", "#c19023"], ["#ffe2dc", "#c96f59"],
    ["#e1f4ea", "#4d9570"], ["#ebe5ff", "#7661ae"], ["#ffe5ef", "#b86684"]
  ];

  const $ = id => document.getElementById(id);
  const els = Object.fromEntries([
    "addBookTop", "addBookInline", "addFirstBook", "prevMonth", "nextMonth", "monthNav",
    "selectedMonthTitle", "monthBookCount", "bookGrid", "emptyState", "yearBookCount",
    "averageRating", "sproutProgress", "summaryMessage", "bookDialog", "bookForm", "dialogTitle",
    "closeDialog", "cancelDialog", "deleteBook", "bookId", "bookTitle", "bookAuthor", "bookMonth",
    "ratingInput", "bookQuote", "bookReview", "quoteCount", "formError", "toast"
  ].map(id => [id, $(id)]));

  let records = loadRecords();
  let selectedMonth = new Date().getFullYear() === 2026 ? new Date().getMonth() : 0;
  let selectedRating = 0;
  let toastTimer;

  function loadRecords() {
    try {
      const value = JSON.parse(localStorage.getItem(STORAGE_KEY));
      return Array.isArray(value) ? value : [];
    } catch { return []; }
  }

  function saveRecords() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
  }

  function renderMonths() {
    els.monthNav.replaceChildren(...MONTH_NAMES.map((name, month) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = `month-tab${selectedMonth === month ? " active" : ""}`;
      button.textContent = name;
      button.setAttribute("aria-current", selectedMonth === month ? "true" : "false");
      button.addEventListener("click", () => {
        selectedMonth = month;
        render();
        button.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
      });
      return button;
    }));
  }

  function createBookCard(book, index) {
    const [light, dark] = PALETTES[Math.abs(hashString(book.title)) % PALETTES.length];
    const article = document.createElement("article");
    article.className = "book-card";
    article.tabIndex = 0;
    article.setAttribute("role", "button");
    article.setAttribute("aria-label", `${book.title} 기록 열기, 별점 ${book.rating}점`);
    article.style.setProperty("--card-light", light);
    article.style.setProperty("--card-dark", dark);

    const top = document.createElement("div");
    top.className = "card-top";
    const number = document.createElement("span");
    number.className = "book-number";
    number.textContent = String(index + 1).padStart(2, "0");
    const rating = document.createElement("span");
    rating.className = "card-rating";
    rating.setAttribute("aria-hidden", "true");
    rating.textContent = "★".repeat(book.rating) + "☆".repeat(5 - book.rating);
    top.append(number, rating);

    const title = document.createElement("h3");
    title.textContent = book.title;
    const author = document.createElement("p");
    author.className = "book-author";
    author.textContent = book.author || "지은이 미상";
    article.append(top, title, author);

    if (book.quote) {
      const quote = document.createElement("p");
      quote.className = "book-quote";
      quote.textContent = `“ ${book.quote} ”`;
      article.appendChild(quote);
    }
    if (book.review) {
      const review = document.createElement("p");
      review.className = "book-review";
      review.textContent = `☘ ${book.review}`;
      article.appendChild(review);
    }
    const hint = document.createElement("span");
    hint.className = "edit-hint";
    hint.textContent = "눌러서 수정";
    article.appendChild(hint);
    article.addEventListener("click", () => openDialog(book));
    article.addEventListener("keydown", event => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        openDialog(book);
      }
    });
    return article;
  }

  function render() {
    renderMonths();
    els.selectedMonthTitle.textContent = MONTH_NAMES[selectedMonth];
    const monthBooks = records.filter(book => book.month === selectedMonth);
    els.monthBookCount.textContent = `${monthBooks.length}권`;
    els.emptyState.classList.toggle("hidden", monthBooks.length > 0);
    els.bookGrid.replaceChildren(...monthBooks.map(createBookCard));

    els.yearBookCount.textContent = records.length;
    const average = records.length ? records.reduce((sum, book) => sum + book.rating, 0) / records.length : 0;
    els.averageRating.textContent = records.length ? average.toFixed(1) : "–";
    els.sproutProgress.style.width = `${Math.min(100, records.length / 24 * 100)}%`;
    els.summaryMessage.textContent = summaryForCount(records.length);
  }

  function summaryForCount(count) {
    if (count === 0) return "첫 번째 책잎을 심어볼까요?";
    if (count < 5) return "작은 독서 정원이 자라고 있어요!";
    if (count < 12) return "책잎이 제법 풍성해졌어요.";
    if (count < 24) return "이야기로 가득한 멋진 정원이에요!";
    return "올해의 독서 정원이 활짝 피었어요!";
  }

  function hashString(value) {
    return [...value].reduce((hash, char) => ((hash << 5) - hash + char.charCodeAt(0)) | 0, 0);
  }

  function buildMonthSelect() {
    els.bookMonth.replaceChildren(...MONTH_NAMES.map((name, month) => {
      const option = document.createElement("option");
      option.value = month;
      option.textContent = name;
      return option;
    }));
  }

  function renderRatingInput() {
    const nodes = [];
    for (let value = 1; value <= 5; value++) {
      const button = document.createElement("button");
      button.type = "button";
      button.className = `star-button${value <= selectedRating ? " active" : ""}`;
      button.textContent = "★";
      button.setAttribute("aria-label", `${value}점`);
      button.setAttribute("aria-pressed", value === selectedRating ? "true" : "false");
      button.addEventListener("click", () => { selectedRating = value; renderRatingInput(); });
      nodes.push(button);
    }
    const valueText = document.createElement("span");
    valueText.className = "rating-value";
    valueText.textContent = selectedRating ? `${selectedRating}.0` : "선택";
    nodes.push(valueText);
    els.ratingInput.replaceChildren(...nodes);
  }

  function openDialog(book = null) {
    els.bookForm.reset();
    els.formError.textContent = "";
    els.bookId.value = book?.id || "";
    els.dialogTitle.textContent = book ? "책 기록 다듬기" : "새 책 기록하기";
    els.bookTitle.value = book?.title || "";
    els.bookAuthor.value = book?.author || "";
    els.bookMonth.value = book?.month ?? selectedMonth;
    els.bookQuote.value = book?.quote || "";
    els.bookReview.value = book?.review || "";
    selectedRating = book?.rating || 0;
    els.quoteCount.textContent = els.bookQuote.value.length;
    els.deleteBook.classList.toggle("visible", Boolean(book));
    renderRatingInput();
    els.bookDialog.showModal();
    setTimeout(() => els.bookTitle.focus(), 50);
  }

  function closeDialog() {
    els.bookDialog.close();
  }

  function recordFromForm() {
    const title = els.bookTitle.value.trim();
    if (!title) throw new Error("책 제목을 적어주세요.");
    if (!selectedRating) throw new Error("별점을 선택해주세요.");
    return {
      id: els.bookId.value || `${Date.now()}-${Math.random().toString(16).slice(2)}`,
      title,
      author: els.bookAuthor.value.trim(),
      month: Number(els.bookMonth.value),
      rating: selectedRating,
      quote: els.bookQuote.value.trim(),
      review: els.bookReview.value.trim(),
      updatedAt: new Date().toISOString()
    };
  }

  function upsertBook(book) {
    const index = records.findIndex(item => item.id === book.id);
    if (index >= 0) records[index] = book;
    else records.unshift(book);
    selectedMonth = book.month;
    saveRecords();
    render();
    return index >= 0 ? "updated" : "created";
  }

  function deleteCurrentBook() {
    const id = els.bookId.value;
    if (!id) return;
    const book = records.find(item => item.id === id);
    if (!book || !confirm(`「${book.title}」 기록을 삭제할까요?`)) return;
    records = records.filter(item => item.id !== id);
    saveRecords();
    render();
    closeDialog();
    showToast("책장에서 기록을 꺼냈어요");
  }

  function showToast(message) {
    clearTimeout(toastTimer);
    els.toast.textContent = message;
    els.toast.classList.add("show");
    toastTimer = setTimeout(() => els.toast.classList.remove("show"), 1900);
  }

  function changeMonth(direction) {
    selectedMonth = Math.max(0, Math.min(11, selectedMonth + direction));
    render();
  }

  function registerWebMcp() {
    const context = document.modelContext;
    if (!context?.registerTool) return;
    const controller = new AbortController();
    const addTool = {
      name: "add_book_record",
      title: "독서 기록 추가",
      description: "2026년의 지정한 월에 책 제목, 별점, 인상 깊은 부분과 감상을 기록합니다.",
      inputSchema: {
        type: "object",
        properties: {
          title: { type: "string", minLength: 1, maxLength: 80 },
          author: { type: "string", maxLength: 50 },
          month: { type: "integer", minimum: 1, maximum: 12 },
          rating: { type: "integer", minimum: 1, maximum: 5 },
          quote: { type: "string", maxLength: 260 },
          review: { type: "string", maxLength: 120 }
        },
        required: ["title", "month", "rating"],
        additionalProperties: false
      },
      annotations: { readOnlyHint: false, untrustedContentHint: false },
      execute(input) {
        if (!input || typeof input.title !== "string" || !Number.isInteger(input.month) || !Number.isInteger(input.rating)) throw new Error("책 제목, 읽은 달, 별점이 필요합니다.");
        if (input.month < 1 || input.month > 12 || input.rating < 1 || input.rating > 5) throw new Error("달은 1~12, 별점은 1~5 사이여야 합니다.");
        const book = {
          id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
          title: input.title.trim().slice(0, 80),
          author: String(input.author || "").trim().slice(0, 50),
          month: input.month - 1,
          rating: input.rating,
          quote: String(input.quote || "").trim().slice(0, 260),
          review: String(input.review || "").trim().slice(0, 120),
          updatedAt: new Date().toISOString()
        };
        if (!book.title) throw new Error("책 제목을 적어주세요.");
        upsertBook(book);
        return { status: "created", id: book.id, title: book.title, month: input.month, rating: book.rating };
      }
    };
    const listTool = {
      name: "list_book_records",
      title: "월별 독서 기록 보기",
      description: "2026년의 지정한 월에 기록된 책 목록과 별점을 조회합니다.",
      inputSchema: { type: "object", properties: { month: { type: "integer", minimum: 1, maximum: 12 } }, required: ["month"], additionalProperties: false },
      annotations: { readOnlyHint: true, untrustedContentHint: true },
      execute(input) {
        if (!input || !Number.isInteger(input.month) || input.month < 1 || input.month > 12) throw new Error("1~12 사이의 달이 필요합니다.");
        return { month: input.month, books: records.filter(book => book.month === input.month - 1).map(({ id, title, author, rating, quote, review }) => ({ id, title, author, rating, quote, review })) };
      }
    };
    [addTool, listTool].forEach(tool => {
      try { void Promise.resolve(context.registerTool(tool, { signal: controller.signal })).catch(() => {}); } catch { /* unsupported */ }
    });
    window.addEventListener("pagehide", () => controller.abort(), { once: true });
  }

  [els.addBookTop, els.addBookInline, els.addFirstBook].forEach(button => button.addEventListener("click", () => openDialog()));
  els.prevMonth.addEventListener("click", () => changeMonth(-1));
  els.nextMonth.addEventListener("click", () => changeMonth(1));
  els.closeDialog.addEventListener("click", closeDialog);
  els.cancelDialog.addEventListener("click", closeDialog);
  els.deleteBook.addEventListener("click", deleteCurrentBook);
  els.bookQuote.addEventListener("input", () => { els.quoteCount.textContent = els.bookQuote.value.length; });
  els.bookForm.addEventListener("submit", event => {
    event.preventDefault();
    try {
      const mode = upsertBook(recordFromForm());
      closeDialog();
      showToast(mode === "created" ? "새 책잎이 자랐어요!" : "책 기록을 다듬었어요");
    } catch (error) {
      els.formError.textContent = error.message;
    }
  });
  els.bookDialog.addEventListener("click", event => {
    if (event.target === els.bookDialog) closeDialog();
  });

  buildMonthSelect();
  renderRatingInput();
  render();
  registerWebMcp();
})();
