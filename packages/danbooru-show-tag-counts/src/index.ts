function addTagCount(headerSelector: string): void {
  const header = document.querySelector(`h3.${headerSelector}-tag-list`);
  if (!header) {
    return;
  }

  const count = header.nextElementSibling?.querySelectorAll(".search-tag").length;
  if (!count) {
    return;
  }
  console.log(count);

  header.insertAdjacentHTML(
    "beforeend",
    `<span class="post-count" style="font-weight: normal;">${count}</span>`,
  );
}

function initialize(): void {
  const headerSelectors: string[] = [
    "artist",
    "copyright",
    "character",
    "general",
    "meta",
  ];

  for (const headerSelector of headerSelectors) {
    addTagCount(headerSelector);
  }
}

initialize();
