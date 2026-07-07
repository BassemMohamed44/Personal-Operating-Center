(function () {
  const AZKAR = {
    morning: [
      { text: "أصبحنا وأصبح الملك لله، والحمد لله، لا إله إلا الله وحده لا شريك له", count: 1 },
      { text: "اللهم بك أصبحنا وبك أمسينا، وبك نحيا وبك نموت وإليك النشور", count: 1 },
      { text: "سبحان الله وبحمده", count: 100 },
      { text: "أستغفر الله وأتوب إليه", count: 100 },
      { text: "لا إله إلا الله وحده لا شريك له، له الملك وله الحمد وهو على كل شيء قدير", count: 10 },
    ],
    evening: [
      { text: "أمسينا وأمسى الملك لله، والحمد لله، لا إله إلا الله وحده لا شريك له", count: 1 },
      { text: "اللهم بك أمسينا وبك أصبحنا، وبك نحيا وبك نموت وإليك المصير", count: 1 },
      { text: "سبحان الله وبحمده", count: 100 },
      { text: "أستغفر الله وأتوب إليه", count: 100 },
    ],
    sleep: [
      { text: "باسمك اللهم أموت وأحيا", count: 1 },
      { text: "اللهم قني عذابك يوم تبعث عبادك", count: 3 },
      { text: "سبحان الله", count: 33 },
      { text: "الحمد لله", count: 33 },
      { text: "الله أكبر", count: 34 },
    ],
  };

  let state = { cat: "morning", index: 0, current: 0 };

  function render() {
    const items = AZKAR[state.cat];
    const item = items[state.index];
    document.getElementById("azkarText").textContent = item.text;
    document.getElementById("azkarCounter").textContent = `${state.current} / ${item.count}`;
  }

  function bind() {
    document.querySelectorAll(".azkar-tab").forEach(tab => {
      tab.addEventListener("click", () => {
        document.querySelectorAll(".azkar-tab").forEach(t => t.classList.remove("active"));
        tab.classList.add("active");
        state = { cat: tab.dataset.cat, index: 0, current: 0 };
        render();
      });
    });

    document.getElementById("azkarCountBtn").addEventListener("click", () => {
      const item = AZKAR[state.cat][state.index];
      state.current++;
      if (state.current >= item.count) {
        setTimeout(() => {
          state.index = (state.index + 1) % AZKAR[state.cat].length;
          state.current = 0;
          render();
        }, 250);
      }
      render();
    });

    document.getElementById("azkarNextBtn").addEventListener("click", () => {
      state.index = (state.index + 1) % AZKAR[state.cat].length;
      state.current = 0;
      render();
    });

    document.getElementById("azkarPrevBtn").addEventListener("click", () => {
      state.index = (state.index - 1 + AZKAR[state.cat].length) % AZKAR[state.cat].length;
      state.current = 0;
      render();
    });
  }

  window.addEventListener("widgets:rendered", () => {
    const widget = document.querySelector('[data-widget="azkar"]');
    if (!widget) return;
    state = { cat: "morning", index: 0, current: 0 };
    bind();
    render();
  });
})();
