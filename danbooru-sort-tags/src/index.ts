const DST_SECTION = `
<section class="dst-collapsible" id="dst-section">
  <h3>Sorting</h3>
  <label for="dst-sort-by">Sort by:</label>
  <select id="dst-sort-by">
    <option value="name" selected="selected">Name</option>
    <option value="count">Post count</option>
  </select>
  <br />
  <label for="dst-sort-ascending">Sort ascending? </label>
  <input id="dst-sort-ascending" type="checkbox" checked="on" />
</section>
`;

const DEFAULT_SORT_BY: string = "name";
const DEFAULT_SORT_ASCENDING: boolean = true;
var _sorting: boolean = false;

type CompareFn<T> = (a: T, b: T) => number;

function sortByName(a: TagTree, b: TagTree): number {
  return (a.name < b.name) ? -1 : 1;
}

function sortByCount(a: TagTree, b: TagTree): number {
  return a.count - b.count;
}

interface HTMLElement {
  nestingLevel(): number;
}

HTMLElement.prototype.nestingLevel = function(): number {
  const LEVEL_RE = /tag\-nesting\-level\-(\d+)/;

  for (const [_, name] of this.classList.entries()) {
    const match = LEVEL_RE.exec(name);
    if (match !== null) {
      return +match[1];
    }
  }

  return 0;
};

class TagTree {
  element: HTMLElement;
  name: string;
  count: number;
  children: TagTree[];
  _nestingLevel?: number = undefined;

  constructor(element: HTMLElement) {
    this.element = element;
    this.name = $("a.search-tag", element).text().trim();

    const title = $("span.post-count", element).attr("title");
    if (title === undefined) {
      this.count = 0;
    } else {
      this.count = +title;
    }

    this.children = [];
  }

  get nestingLevel(): number {
    return (this._nestingLevel ??= this.element.nestingLevel());
  }

  flattenTo(elements: HTMLElement[]): void {
    elements.push(this.element);
    for (const child of this.children) {
      child.flattenTo(elements);
    }
  }

  sort(compareFn: CompareFn<TagTree>): void {
    this.children.sort(compareFn);
    for (const child of this.children) {
      child.sort(compareFn);
    }
  }

  toString(): string {
    return `"${this.name}" ${this.count}`;
  }
}

function sortTagList(container: HTMLElement): void {
  if (_sorting) {
    return;
  }
  _sorting = true;

  const tags = $("li", container);
  if (tags.length <= 1) {
    // Nothing to sort
    _sorting = false;
    return;
  }

  const sortBy = $("select#dst-sort-by option:selected").val();
  const sortAscending = $("input#dst-sort-ascending").prop("checked");

  let sortFn: CompareFn<TagTree> = (sortBy === "count")
    ? sortByCount
    : sortByName;

  if (!sortAscending) {
    const origSortFn = sortFn;
    sortFn = (a, b) => {
      return -origSortFn(a, b);
    };
  }

  const trees: TagTree[] = tags.detach().get().map((el) => new TagTree(el));

  resetLoop: while (true) {
    var index: number = trees.length - 1;
    while (index >= 1) {
      if (trees[index].nestingLevel - trees[index - 1].nestingLevel == 1) {
        trees[index - 1].children.push(...trees.splice(index, 1));
        continue resetLoop;
      }
      index -= 1;
    }

    break;
  }

  trees.sort(sortFn);
  const sortedElements: HTMLElement[] = [];
  for (const tree of trees) {
    tree.sort(sortFn);
    tree.flattenTo(sortedElements);
  }

  $(container).append(...sortedElements);
  _sorting = false;
}

function sortAll(): void {
  const containers: string[] = [
    "ul.artist-tag-list",
    "ul.copyright-tag-list",
    "ul.character-tag-list",
    "ul.general-tag-list",
    "ul.meta-tag-list",
  ];

  for (const container of containers) {
    $(container).each((_, el) => sortTagList(el));
  }
}

function setupUI(anchorSelector: string): void {
  const anchor = $(anchorSelector);
  if (anchor.length === 0) {
    return;
  }

  anchor.before(DST_SECTION);

  const { sortBy, sortAscending } = loadSettings();

  $("select#dst-sort-by option")
    .removeAttr("selected")
    .filter(`[value=${sortBy}]`)
    .prop("selected", "selected")
    .trigger("change");
  $("input#dst-sort-ascending")
    .prop("checked", sortAscending)
    .trigger("change");

  $("select#dst-sort-by, input#dst-sort-ascending").on("change", (_) => {
    saveSettings();
    sortAll();
  });

  if (sortBy === DEFAULT_SORT_BY || sortAscending === DEFAULT_SORT_ASCENDING) {
    sortAll();
  }
}

function saveSettings(): void {
  const sortBy = $("select#dst-sort-by option:selected").val();
  const sortAscending = $("input#dst-sort-ascending").prop("checked");

  GM_setValue("dst_sort_by", sortBy);
  GM_setValue("dst_sort_ascending", sortAscending);
}

function loadSettings(): { sortBy: string, sortAscending: boolean } {
  const sortBy: string = GM_getValue("dst_sort_by", DEFAULT_SORT_BY);
  const sortAscending: boolean = GM_getValue("dst_sort_ascending", DEFAULT_SORT_ASCENDING);

  return { sortBy, sortAscending };
}

function initialize(): void {
  setupUI("section#tag-list");
}

$(initialize);
