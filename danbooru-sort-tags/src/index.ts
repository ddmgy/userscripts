const DST_SECTION = `
<section id="dst-section">
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

type CompareFn<T> = (a: T, b: T) => number;

function sortByName(a: DSTTagTree, b: DSTTagTree): number {
  return (a.name < b.name) ? -1 : 1;
}

function sortByCount(a: DSTTagTree, b: DSTTagTree): number {
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

class DSTTagTree {
  element: HTMLElement;
  name: string;
  count: number;
  children: DSTTagTree[];
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

  sort(compareFn: CompareFn<DSTTagTree>): void {
    this.children.sort(compareFn);
    for (const child of this.children) {
      child.sort(compareFn);
    }
  }

  toString(): string {
    return `${"  ".repeat(this.nestingLevel)}"${this.name}" ${this.count}`;
  }
}

class DSTSettings {
  $sortBy: string;
  $sortAscending: boolean;

  get sortBy(): string {
    return this.$sortBy;
  }

  set sortBy(value: string) {
    const update = value !== this.$sortBy;
    this.$sortBy = value;

    if (update) {
      GM_setValue("dst_sort_by", this.$sortBy);
    }
  }

  get sortAscending(): boolean {
    return this.$sortAscending;
  }

  set sortAscending(value: boolean) {
    const update = value !== this.$sortAscending;
    this.$sortAscending = value;

    if (update) {
      GM_setValue("dst_sort_ascending", this.$sortAscending);
    }
  }

  get isDefault(): boolean {
    return this.$sortBy === DEFAULT_SORT_BY && this.$sortAscending === DEFAULT_SORT_ASCENDING;
  }

  constructor() {
    this.$sortBy = GM_getValue("dst_sort_by", DEFAULT_SORT_BY);
    this.$sortAscending = GM_getValue("dst_sort_ascending", DEFAULT_SORT_ASCENDING);
  }
}

class DSTSortTags {
  $sorting: boolean = false;
  $taglists: { anchor: string, trees: DSTTagTree[] }[] = [];

  constructor() {
    for (const kind of ["artist", "copyright", "character", "general", "meta"]) {
      const anchor = `ul.${kind}-tag-list`;
      const container = $(anchor);
      const tags = $("li", container);

      if (tags.length === 0) {
        continue;
      }

      const trees: DSTTagTree[] = tags.clone().get().map((el) => new DSTTagTree(el));

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

      this.$taglists.push({ anchor, trees });
    }
  }

  sort(sortBy: string, sortAscending: boolean) {
    if (this.$sorting) {
      return;
    }
    this.$sorting = true;

    let sortFn: CompareFn<DSTTagTree> = (sortBy === "count")
      ? sortByCount
      : sortByName;

    if (!sortAscending) {
      const origSortFn = sortFn;
      sortFn = (a, b) => {
        return -origSortFn(a, b);
      };
    }

    for (const taglist of this.$taglists) {
      taglist.trees.sort(sortFn);
      const sortedElements: HTMLElement[] = [];

      for (const tree of taglist.trees) {
        tree.sort(sortFn);
        tree.flattenTo(sortedElements);
      }

      $("li", taglist.anchor).detach();
      $(taglist.anchor).append(...sortedElements);
    }

    this.$sorting = false;
  }
}

function initialize(): void {
  const anchor = $("section#tag-list");
  if (anchor.length === 0) {
    return;
  }

  anchor.before(DST_SECTION);
  const settings = new DSTSettings();
  const tags = new DSTSortTags();

  $("select#dst-sort-by option")
    .removeAttr("selected")
    .filter(`[value=${settings.sortBy}]`)
    .prop("selected", "selected")
    .trigger("change");
  $("input#dst-sort-ascending")
    .prop("checked", settings.sortAscending)
    .trigger("change");

  $("select#dst-sort-by").on("change", (_) => {
    const sortBy = $("select#dst-sort-by option:selected").val() as string;
    settings.sortBy = sortBy;
    tags.sort(settings.sortBy, settings.sortAscending);
  });

  $("input#dst-sort-ascending").on("change", (_) => {
    const sortAscending = $("input#dst-sort-ascending").prop("checked") as boolean;
    settings.sortAscending = sortAscending;
    tags.sort(settings.sortBy, settings.sortAscending);
  });

  if (!settings.isDefault) {
    tags.sort(settings.sortBy, settings.sortAscending);
  }
}

$(initialize);
