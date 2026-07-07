(function () {
  const QUOTES = [
    { text: "النجاح هو مجموع جهود صغيرة تتكرر يوميًا.", author: "حكمة" },
    { text: "لا تنتظر الفرصة المثالية، اصنعها بنفسك.", author: "حكمة" },
    { text: "الانضباط هو الجسر بين الأهداف والإنجاز.", author: "حكمة" },
    { text: "كل خبير كان يومًا مبتدئًا.", author: "حكمة" },
    { text: "الوقت الذي يمر لا يعود، فاستثمره جيدًا.", author: "حكمة" },
    { text: "ابدأ من حيث أنت، استخدم ما لديك، وافعل ما تستطيع.", author: "حكمة" },
    { text: "العمل الجاد يتغلب على الموهبة حين لا تعمل الموهبة بجد.", author: "حكمة" },
    { text: "الصبر مفتاح الفرج.", author: "مثل عربي" },
    { text: "من جدّ وجد، ومن زرع حصد.", author: "مثل عربي" },
    { text: "لا يهم مدى بطء تقدمك، طالما أنك لا تتوقف.", author: "حكمة" },
  ];

  function pickRandom() {
    return QUOTES[Math.floor(Math.random() * QUOTES.length)];
  }

  function render() {
    const q = pickRandom();
    const textEl = document.getElementById("quoteText");
    const authorEl = document.getElementById("quoteAuthor");
    if (!textEl) return;
    textEl.textContent = q.text;
    authorEl.textContent = `— ${q.author}`;
  }

  window.addEventListener("widgets:rendered", () => {
    render();
    const btn = document.getElementById("quoteRefreshBtn");
    if (btn) btn.onclick = render;
  });
})();
