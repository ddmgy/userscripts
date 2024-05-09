function createPageSelector(element: HTMLElement): void {
  const url = new window.URL(window.location.href);
  const page = +(url.searchParams.get("page") ?? 1);

  $(element).replaceWith(`
    <form id="dps-paginator-selector-form" >
      <input id="dps-paginator-selector" type="number" min="1" value="${page}" size="8" maxlength="8" />
    </form>
  `);

  $("dps-paginator-selector-form").on("submit", (event) => {
    event.preventDefault();

    const newPage = $("#dps-paginator-selector").val();
    if (newPage === undefined || newPage === "" || newPage === page) {
      return;
    }

    url.searchParams.set("page", newPage.toString());
    window.location.href = url.toString();
  });
}

function initialize(): void {
  $("span.paginator-current").each((_, el) => createPageSelector(el));
}

$(initialize);
