const DSTC_CSS = `
.dstc-post-count {
  font-weight: normal;
  color: var(--tag-count-color);
}
`;

type AddTagCountOptions = {
  headerSelector: string;
  tagSelector: string;
};

function addTagCount({ headerSelector, tagSelector }: AddTagCountOptions): void {
  const original = $(`h3.${headerSelector}-tag-list`);
  if (original.length === 0) {
    console.log(`[danbooru-show-tag-counts] h3.${headerSelector}-tag-list does not exist, skipping`);
    return;
  }

  $(original).append($("<span></span>", {
    "class": "dstc-post-count",
    "text": $(`.tag-type-${tagSelector}`).length,
  }));
}

function initialize(): void {
  $(".dstc-post-count").remove();

  const tagTypes: AddTagCountOptions[] = [
    {
      headerSelector: "artist",
      tagSelector: "1",
    },
    {
      headerSelector: "copyright",
      tagSelector: "3",
    },
    {
      headerSelector: "character",
      tagSelector: "4",
    },
    {
      headerSelector: "general",
      tagSelector: "0",
    },
    {
      headerSelector: "meta",
      tagSelector: "5",
    },
  ];

  for (const tagType of tagTypes) {
    addTagCount(tagType);
  }
}

GM_addStyle(DSTC_CSS);
$(initialize);

new MutationObserver((_mutationList, _observer) => {
  $(initialize);
}).observe(document.body, { childList: true, subtree: true });
