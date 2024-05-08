type AddTagCountOptions = {
  headerSelector: string;
  tagSelector: string;
};

function addTagCount({ headerSelector, tagSelector }: AddTagCountOptions) {
  const original = $(`h3.${headerSelector}-tag-list`);
  if (original.length === 0) {
    console.log(`[danbooru-ui-tweaks] h3.${headerSelector}-tag-list does not exist, skipping`);
    return;
  }

  $(original).append($("<span></span>", {
    "class": "post-count",
    "text": $(`.tag-type-${tagSelector}`).length,
    "style": "font-weight: normal",
  }));
}

function initialize() {
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

$(initialize);
