# Inquirer Fuzzy Select

This package is based on [`@inquirer/select`](https://www.npmjs.com/package/@inquirer/select), but adds the ability to filter the select list.

> **Note**: Since the input is used for filtering, some interactions that were included in `@inquirer/select` do not work here:
> - Cycling through the list via number keys
> - Cycling through the list via Vim keys
> - Cycling through the list via Emacs keys

## Installation

```sh
npm install inquirer-fuzzy-select
```

## Basic Usage

```ts
import { fuzzySelect } from 'inquirer-fuzzy-select';

const answer = await select({
  message: 'Select a number',
  choices: [
    { value: 1, name: "One" },
    { value: 2, name: "Two" },
    { value: 3, name: "Three" },
  ],
});
```

## Advanced items

```ts
import { fuzzySelect, Separator } from 'inquirer-fuzzy-select';

const answer = await select({
  message: 'Select a package manager',
  choices: [
    {
      name: 'npm',
      value: 'npm',
      description: 'npm is the most popular package manager',
    },
    {
      name: 'yarn',
      value: 'yarn',
      description: 'yarn is an awesome package manager',
    },
    new Separator(),
    {
      name: 'jspm',
      value: 'jspm',
      disabled: true,
    },
    {
      name: 'pnpm',
      value: 'pnpm',
      disabled: '(pnpm is not available)',
    },
  ],
});
```

## Advanced filtering

If you want to 

```ts
import { fuzzySelect } from 'inquirer-fuzzy-select';

const answer = await fuzzySelect({
  message: "Select a number to translate to german",
  choices: [
    { value: "Eins", name: "One", meta: 1 },
    { value: "Zwei", name: "Two", meta: 2 },
    { value: "Drei", name: "Three", meta: 3 },
    { value: "Vier", name: "Four", meta: 4 },
    { value: "Fünf", name: "Five", meta: 5 },
    { value: "Sechs", name: "Six", meta: 6 },
  ] as const,
  comparer(input) {
    return (choices) => {
      const query = input.toLowerCase();
      if (choices.type === "separator") return true;
      if (choices.name?.toLowerCase().includes(query)) return true;
      if (choices.meta?.toString().includes(query)) return true;
      return false;
    };
  },
});
```

## License

Copyright ©2023 Henning Pohlmeyer  
Licensed under the MIT license.