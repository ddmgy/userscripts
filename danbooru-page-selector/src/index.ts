function createPageSelector(i: number, element: HTMLElement): void {
  const url = new window.URL(window.location.href);
  const page = +(url.searchParams.get("page") ?? 1);

  $(element).replaceWith(`
    <form id="dps-form-${i}" >
      <input id="dps-input-${i}" type="number" min="1" value="${page}" size="8" maxlength="8" />
    </form>
  `);

  $(`#dps-form-${i}`).off().on("submit", (event: JQuery.SubmitEvent) => {
    event.preventDefault();

    const newPage = $(`#dps-input-${i}`).val();
    if (newPage === undefined || newPage === "" || +newPage === page) {
      return;
    }

    url.searchParams.set("page", newPage.toString());
    window.location.href = url.toString();
  });
}

function initialize(): void {
  const paginator = $("div.paginator").detach();

  if (paginator.length === 0) {
    return;
  }

  $("div.posts-container").before(paginator.clone()).after(paginator);

  $("span.paginator-current").each((i, el) => createPageSelector(i, el));
}

$(initialize);
