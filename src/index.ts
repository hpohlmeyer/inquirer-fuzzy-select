import {
  createPrompt,
  useState,
  useKeypress,
  usePrefix,
  usePagination,
  useRef,
  useMemo,
  isEnterKey,
  isUpKey,
  isDownKey,
  Separator,
  type PromptConfig,
} from "@inquirer/core";
import chalk from "chalk";
import figures from "figures";
import ansiEscapes from "ansi-escapes";

type Choice<Value, Meta> = {
  value: Value;
  name?: string;
  description?: string;
  disabled?: boolean | string;
  type?: never;
  meta?: Meta;
};

type SelectConfig<Value, Meta> = PromptConfig<{
  choices: ReadonlyArray<Choice<Value, Meta> | Separator>;
  pageSize?: number;
  loop?: boolean;
  default?: Value;
  emptyMessage?: string;
  comparer?: (
    input: string
  ) => (choice: Choice<Value, Meta> | Separator) => boolean;
}>;

type Item<Value, Meta> = Separator | Choice<Value, Meta>;

function isSelectable<Value, Meta>(
  item: Item<Value, Meta>
): item is Choice<Value, Meta> {
  return !Separator.isSeparator(item) && !item.disabled;
}

function defaultComparer(input: string) {
  return (choice: Choice<unknown, unknown> | Separator) => {
    if (choice instanceof Separator) return true;
    const value = choice.name ?? choice.value;
    if (
      typeof value === "boolean" ||
      typeof value === "string" ||
      typeof value === "number"
    ) {
      return value.toString().toLowerCase().includes(input);
    }
    return false;
  };
}

function renderItem<Value, Meta>({
  item,
  isActive,
}: {
  item: Item<Value, Meta>;
  isActive: boolean;
}) {
  if (Separator.isSeparator(item)) {
    return ` ${item.separator}`;
  }

  const line = item.name || item.value;
  if (item.disabled) {
    const disabledLabel =
      typeof item.disabled === "string" ? item.disabled : "(disabled)";
    return chalk.dim(`- ${line} ${disabledLabel}`);
  }

  const color = isActive ? chalk.cyan : (x: string) => x;
  const prefix = isActive ? figures.pointer : ` `;
  return color(`${prefix} ${line}`);
}

export const fuzzySelect = createPrompt(
  <Value extends unknown, Meta>(
    config: SelectConfig<Value, Meta>,
    done: (value: Value) => void
  ): string => {
    const {
      choices,
      loop = true,
      pageSize,
      emptyMessage = "No matches for your query",
      comparer = defaultComparer,
    } = config;
    const firstRender = useRef(true);
    const prefix = usePrefix();
    const [status, setStatus] = useState("pending");
    const [items, setItems] = useState(choices.slice());
    const [input, setInput] = useState("");

    const bounds = useMemo(() => {
      const first = items.findIndex(isSelectable);
      // TODO: Replace with `findLastIndex` when it's available.
      const last =
        items.length - 1 - [...items].reverse().findIndex(isSelectable);
      if (items.length === choices.length && first < 0)
        throw new Error(
          "[select prompt] No selectable choices. All choices are disabled."
        );
      return { first, last };
    }, [items]);

    const defaultItemIndex = useMemo(() => {
      if (!("default" in config)) return -1;
      return items.findIndex(
        (item) => isSelectable(item) && item.value === config.default
      );
    }, [config.default, items]);

    const [active, setActive] = useState(
      defaultItemIndex === -1 ? bounds.first : defaultItemIndex
    );

    // Safe to assume the cursor position always point to a Choice.
    const selectedChoice = items[active] as Choice<Value, Meta> | undefined;

    useKeypress((key, rl) => {
      if (isEnterKey(key)) {
        if (
          typeof selectedChoice !== "undefined" &&
          !(selectedChoice instanceof Separator)
        ) {
          setStatus("done");
          done(selectedChoice.value);
        } else {
          // Enter key clears the line, we can bring it
          // back by writing the current input to the new line
          rl.write(input);
        }
      } else if (key.name === "up" || key.name === "down") {
        if (
          items.length > 0 &&
          (loop ||
            (isUpKey(key) && active !== bounds.first) ||
            (isDownKey(key) && active !== bounds.last))
        ) {
          const offset = isUpKey(key) ? -1 : 1;
          let next = active;
          do {
            next = (next + offset + items.length) % items.length;
          } while (!isSelectable(items[next]!));
          setActive(next);
        }
      } else {
        const input = rl.line;
        const newItems = choices.filter(comparer(input));
        const newActive = newItems.findIndex(isSelectable);
        setInput(input);
        setActive(newActive);
        setItems(newItems);
      }
    });

    let message = chalk.bold(config.message);
    if (firstRender.current) {
      firstRender.current = false;
      message += chalk.dim(" (Use arrow keys)");
    }

    const page =
      items.filter(isSelectable).length === 0
        ? chalk.dim(emptyMessage)
        : usePagination<Item<Value, Meta>>({
            items,
            active,
            renderItem,
            pageSize,
            loop,
          });

    if (status === "done") {
      return `${prefix} ${message} ${chalk.cyan(
        selectedChoice!.name || selectedChoice!.value
      )}`;
    }

    const choiceDescription = selectedChoice?.description
      ? `\n${selectedChoice.description}`
      : ``;

    const colorizedInput = chalk.cyan(input);

    return `${prefix} ${message} ${colorizedInput}\n${page}${choiceDescription}${ansiEscapes.cursorHide}`;
  }
);

export { Separator };
