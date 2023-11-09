import { describe, it, expect } from "vitest";
import { render } from "@inquirer/testing";
import fuzzySelect, { Separator } from "../src/index.js";

const numberedChoices = [
  { value: 1, name: "one" },
  { value: 2, name: "two" },
  { value: 3, name: "three" },
  { value: 4, name: "four" },
  { value: 5, name: "five" },
  { value: 6, name: "six" },
  { value: 7, name: "seven" },
  { value: 8, name: "eight" },
  { value: 9, name: "nine" },
];

describe("select prompt", () => {
  it("can fuzzy filter", async () => {
    const { answer, events, getScreen } = await render(fuzzySelect, {
      message: "Select a number",
      choices: numberedChoices,
    });

    expect(getScreen()).toMatchInlineSnapshot(`
      "? Select a number (Use arrow keys)
      ❯ one
        two
        three
        four
        five
        six
        seven
      (Use arrow keys to reveal more choices)"
    `);

    events.type("ve");

    expect(getScreen()).toMatchInlineSnapshot(`
      "? Select a number ve
      ❯ five
        seven"
    `);
  });

  it("shows an empty message when the filter does not match anything", async () => {
    const { answer, events, getScreen } = await render(fuzzySelect, {
      message: "Select a number",
      choices: numberedChoices,
    });

    expect(getScreen()).toMatchInlineSnapshot(`
      "? Select a number (Use arrow keys)
      ❯ one
        two
        three
        four
        five
        six
        seven
      (Use arrow keys to reveal more choices)"
    `);

    events.type("xy");

    expect(getScreen()).toMatchInlineSnapshot(`
      "? Select a number xy
      No matches for your query"
    `);
  });

  it("allow setting a custom empty message", async () => {
    const { answer, events, getScreen } = await render(fuzzySelect, {
      message: "Select a number",
      choices: numberedChoices,
      emptyMessage: "No matches",
    });

    expect(getScreen()).toMatchInlineSnapshot(`
      "? Select a number (Use arrow keys)
      ❯ one
        two
        three
        four
        five
        six
        seven
      (Use arrow keys to reveal more choices)"
    `);

    events.type("xy");

    expect(getScreen()).toMatchInlineSnapshot(`
      "? Select a number xy
      No matches"
    `);
  });

  it("separators are hidden, when all items are filtered out", async () => {
    const { answer, events, getScreen } = await render(fuzzySelect, {
      message: "Select a topping",
      choices: numberedChoices,
      pageSize: 2,
    });

    expect(getScreen()).toMatchInlineSnapshot(`
      "? Select a topping (Use arrow keys)
      ❯ one
        two
      (Use arrow keys to reveal more choices)"
    `);

    events.type("xy");
    expect(getScreen()).toMatchInlineSnapshot(`
      "? Select a topping xy
      No matches for your query"
    `);

    events.keypress("enter");
    events.type("z");
    expect(getScreen()).toMatchInlineSnapshot(`
      "? Select a topping xyz
      No matches for your query"
    `);
  });

  it("enter is ignored, when empty message is shown", async () => {
    const { answer, events, getScreen } = await render(fuzzySelect, {
      message: "Select a topping",
      choices: [
        { name: "Ham", value: "ham" },
        new Separator(),
        { name: "Pepperoni", value: "pepperoni" },
      ],
    });

    expect(getScreen()).toMatchInlineSnapshot(`
      "? Select a topping (Use arrow keys)
      ❯ Ham
       ──────────────
        Pepperoni"
    `);

    events.type("xy");
    expect(getScreen()).toMatchInlineSnapshot(`
      "? Select a topping xy
      No matches for your query"
    `);
  });

  it("use arrow keys to select an option", async () => {
    const { answer, events, getScreen } = await render(fuzzySelect, {
      message: "Select a number",
      choices: numberedChoices,
    });

    expect(getScreen()).toMatchInlineSnapshot(`
      "? Select a number (Use arrow keys)
      ❯ one
        two
        three
        four
        five
        six
        seven
      (Use arrow keys to reveal more choices)"
    `);

    events.keypress("down");
    events.keypress("down");
    expect(getScreen()).toMatchInlineSnapshot(`
      "? Select a number
        one
        two
      ❯ three
        four
        five
        six
        seven
      (Use arrow keys to reveal more choices)"
    `);

    events.keypress("enter");
    expect(getScreen()).toMatchInlineSnapshot('"? Select a number three"');

    await expect(answer).resolves.toEqual(3);
  });

  it("allow setting a smaller page size", async () => {
    const { answer, events, getScreen } = await render(fuzzySelect, {
      message: "Select a number",
      choices: numberedChoices,
      pageSize: 2,
    });

    expect(getScreen()).toMatchInlineSnapshot(`
      "? Select a number (Use arrow keys)
      ❯ one
        two
      (Use arrow keys to reveal more choices)"
    `);

    events.keypress("enter");
    await expect(answer).resolves.toEqual(1);
  });

  it("allow setting a bigger page size", async () => {
    const { answer, events, getScreen } = await render(fuzzySelect, {
      message: "Select a number",
      choices: numberedChoices,
      pageSize: 8,
    });

    expect(getScreen()).toMatchInlineSnapshot(`
      "? Select a number (Use arrow keys)
      ❯ one
        two
        three
        four
        five
        six
        seven
        eight
      (Use arrow keys to reveal more choices)"
    `);

    events.keypress("enter");
    await expect(answer).resolves.toEqual(1);
  });

  it("cycles through options", async () => {
    const { answer, events, getScreen } = await render(fuzzySelect, {
      message: "Select a number",
      choices: numberedChoices,
      pageSize: 2,
    });

    expect(getScreen()).toMatchInlineSnapshot(`
      "? Select a number (Use arrow keys)
      ❯ one
        two
      (Use arrow keys to reveal more choices)"
    `);

    events.keypress("up");
    events.keypress("up");
    expect(getScreen()).toMatchInlineSnapshot(`
      "? Select a number
      ❯ eight
        nine
      (Use arrow keys to reveal more choices)"
    `);

    events.keypress("enter");
    await expect(answer).resolves.toEqual(8);
  });

  it("does not scroll up beyond first item when not looping", async () => {
    const { answer, events, getScreen } = await render(fuzzySelect, {
      message: "Select a number",
      choices: numberedChoices,
      pageSize: 2,
      loop: false,
    });

    expect(getScreen()).toMatchInlineSnapshot(`
      "? Select a number (Use arrow keys)
      ❯ one
        two
      (Use arrow keys to reveal more choices)"
    `);

    events.keypress("up");
    events.keypress("up");
    expect(getScreen()).toMatchInlineSnapshot(`
      "? Select a number (Use arrow keys)
      ❯ one
        two
      (Use arrow keys to reveal more choices)"
    `);

    events.keypress("enter");
    await expect(answer).resolves.toEqual(1);
  });

  it("does not scroll up beyond first selectable item when not looping", async () => {
    const { answer, events, getScreen } = await render(fuzzySelect, {
      message: "Select a number",
      choices: [new Separator(), ...numberedChoices],
      pageSize: 2,
      loop: false,
    });

    expect(getScreen()).toMatchInlineSnapshot(`
      "? Select a number (Use arrow keys)
       ──────────────
      ❯ one
      (Use arrow keys to reveal more choices)"
    `);

    events.keypress("up");
    events.keypress("up");
    expect(getScreen()).toMatchInlineSnapshot(`
      "? Select a number (Use arrow keys)
       ──────────────
      ❯ one
      (Use arrow keys to reveal more choices)"
    `);

    events.keypress("enter");
    await expect(answer).resolves.toEqual(1);
  });

  it("does not scroll down beyond last item when not looping", async () => {
    const { answer, events, getScreen } = await render(fuzzySelect, {
      message: "Select a number",
      choices: numberedChoices,
      pageSize: 2,
      loop: false,
    });

    expect(getScreen()).toMatchInlineSnapshot(`
      "? Select a number (Use arrow keys)
      ❯ one
        two
      (Use arrow keys to reveal more choices)"
    `);

    numberedChoices.forEach(() => events.keypress("down"));
    events.keypress("down");
    expect(getScreen()).toMatchInlineSnapshot(`
      "? Select a number
        eight
      ❯ nine
      (Use arrow keys to reveal more choices)"
    `);

    events.keypress("enter");
    await expect(answer).resolves.toEqual(numberedChoices.length);
  });

  it("does not scroll down beyond last selectable item when not looping", async () => {
    const { answer, events, getScreen } = await render(fuzzySelect, {
      message: "Select a number",
      choices: [...numberedChoices, new Separator()],
      pageSize: 3,
      loop: false,
    });

    expect(getScreen()).toMatchInlineSnapshot(`
      "? Select a number (Use arrow keys)
      ❯ one
        two
        three
      (Use arrow keys to reveal more choices)"
    `);

    numberedChoices.forEach(() => events.keypress("down"));
    events.keypress("down");
    expect(getScreen()).toMatchInlineSnapshot(`
      "? Select a number
        eight
      ❯ nine
       ──────────────
      (Use arrow keys to reveal more choices)"
    `);

    events.keypress("enter");
    await expect(answer).resolves.toEqual(numberedChoices.length);
  });

  it("skip disabled options by arrow keys", async () => {
    const { answer, events, getScreen } = await render(fuzzySelect, {
      message: "Select a topping",
      choices: [
        { name: "Ham", value: "ham" },
        { name: "Pineapple", value: "pineapple", disabled: true },
        { name: "Pepperoni", value: "pepperoni" },
      ],
    });

    expect(getScreen()).toMatchInlineSnapshot(`
      "? Select a topping (Use arrow keys)
      ❯ Ham
      - Pineapple (disabled)
        Pepperoni"
    `);

    events.keypress("down");
    expect(getScreen()).toMatchInlineSnapshot(`
      "? Select a topping
        Ham
      - Pineapple (disabled)
      ❯ Pepperoni"
    `);

    events.keypress("enter");
    expect(getScreen()).toMatchInlineSnapshot('"? Select a topping Pepperoni"');

    await expect(answer).resolves.toEqual("pepperoni");
  });

  it("allow customizing disabled label", async () => {
    const { answer, getScreen } = await render(fuzzySelect, {
      message: "Select a topping",
      choices: [
        { name: "Ham", value: "ham" },
        { name: "Pineapple", value: "pineapple", disabled: "*premium*" },
      ],
    });

    expect(getScreen()).toMatchInlineSnapshot(`
      "? Select a topping (Use arrow keys)
      ❯ Ham
      - Pineapple *premium*"
    `);

    answer.cancel();
    await expect(answer).rejects.toBeInstanceOf(Error);
  });

  it("throws if all choices are disabled", async () => {
    const { answer } = await render(fuzzySelect, {
      message: "Select a topping",
      choices: [
        { name: "Ham", value: "ham", disabled: true },
        { name: "Pineapple", value: "pineapple", disabled: "*premium*" },
      ],
    });

    await expect(answer).rejects.toThrowErrorMatchingInlineSnapshot(
      '"[select prompt] No selectable choices. All choices are disabled."'
    );
  });

  it("skip separator by arrow keys", async () => {
    const { answer, events, getScreen } = await render(fuzzySelect, {
      message: "Select a topping",
      choices: [
        { name: "Ham", value: "ham" },
        new Separator(),
        { name: "Pepperoni", value: "pepperoni" },
      ],
    });

    expect(getScreen()).toMatchInlineSnapshot(`
      "? Select a topping (Use arrow keys)
      ❯ Ham
       ──────────────
        Pepperoni"
    `);

    events.keypress("down");
    expect(getScreen()).toMatchInlineSnapshot(`
      "? Select a topping
        Ham
       ──────────────
      ❯ Pepperoni"
    `);

    events.keypress("enter");
    expect(getScreen()).toMatchInlineSnapshot('"? Select a topping Pepperoni"');

    await expect(answer).resolves.toEqual("pepperoni");
  });

  it("Allow adding description to choices", async () => {
    const { answer, events, getScreen } = await render(fuzzySelect, {
      message: "Select a topping",
      choices: [
        { name: "Ham", value: "ham", description: "Our classic toping" },
        {
          name: "Pineapple",
          value: "pineapple",
          description: "A Canadian delicacy",
        },
      ],
    });

    expect(getScreen()).toMatchInlineSnapshot(`
      "? Select a topping (Use arrow keys)
      ❯ Ham
        Pineapple
      Our classic toping"
    `);

    events.keypress("down");
    expect(getScreen()).toMatchInlineSnapshot(`
      "? Select a topping
        Ham
      ❯ Pineapple
      A Canadian delicacy"
    `);

    events.keypress("enter");
    expect(getScreen()).toMatchInlineSnapshot('"? Select a topping Pineapple"');

    await expect(answer).resolves.toEqual("pineapple");
  });

  it("Allows setting a default value", async () => {
    const { answer, events, getScreen } = await render(fuzzySelect, {
      message: "Select a number",
      choices: numberedChoices,
      default: numberedChoices[3].value,
    });

    expect(getScreen()).toMatchInlineSnapshot(`
        "? Select a number (Use arrow keys)
          one
          two
          three
        ❯ four
          five
          six
          seven
        (Use arrow keys to reveal more choices)"
      `);

    events.keypress("enter");
    await expect(answer).resolves.toEqual(4);
  });
});
