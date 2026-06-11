# pwstrength

[![CI](https://github.com/orpham/pwstrength/actions/workflows/ci.yml/badge.svg)](https://github.com/orpham/pwstrength/actions/workflows/ci.yml)
[![jsDelivr](https://data.jsdelivr.com/v1/package/npm/@orpham/pwstrength/badge)](https://www.jsdelivr.com/package/npm/@orpham/pwstrength)

Password strength meter for [Bootstrap 5](https://getbootstrap.com) — no jQuery required.

A TypeScript rewrite of [pwstrength-bootstrap](https://github.com/ablanco/jquery.pwstrength.bootstrap) with a modern
class-based API, full type declarations, and zero runtime dependencies.

## Installation

```bash
npm install @orpham/pwstrength
```

Bootstrap 5 is a peer dependency and must be available in your project.

## Quick Start

```html
<input id="password" type="password">
<div id="pw-container">
    <div class="pwstrength_viewport_progress"></div>
</div>
```

```typescript
import {PasswordStrength} from '@orpham/pwstrength';

const meter = new PasswordStrength(
    document.getElementById('password') as HTMLInputElement,
    {
        minChar: 8,
        maxChar: 64,
        ui: {
            container: document.getElementById('pw-container'),
            viewports: {progress: '.pwstrength_viewport_progress'},
            showVerdictsInsideProgressBar: true,
            progressBarExtraCssClasses: 'progress-bar-striped progress-bar-animated'
        }
    }
);
```

### CDN (no bundler)

```html
<script src="https://cdn.jsdelivr.net/npm/@orpham/pwstrength/dist/pwstrength.umd.cjs"></script>
<script>
    const meter = new pwstrength.PasswordStrength(input, options);
</script>
```

## API

### Constructor

```typescript
new PasswordStrength(input: HTMLInputElement, options?: PasswordStrengthOptions)
```

### Methods

| Method                             | Description                                                             |
|------------------------------------|-------------------------------------------------------------------------|
| `destroy()`                        | Remove event listeners and DOM elements created by the meter            |
| `forceUpdate()`                    | Re-evaluate the current input value (useful after programmatic changes) |
| `addRule(name, fn, score, active)` | Add a custom scoring rule                                               |
| `changeScore(rule, score)`         | Change the score of an existing rule                                    |
| `ruleActive(rule, active)`         | Enable or disable an existing rule                                      |
| `ruleIsMet(rule)`                  | Returns `true` if the given rule is currently satisfied                 |

## Options

### General

| Option               | Type                                 | Default                        | Description                                                                             |
|----------------------|--------------------------------------|--------------------------------|-----------------------------------------------------------------------------------------|
| `minChar`            | `number`                             | `6`                            | Minimum required password length                                                        |
| `maxChar`            | `number`                             | `20`                           | Maximum allowed password length                                                         |
| `usernameField`      | `string \| HTMLInputElement \| null` | `'#username'`                  | Selector or element for the username field                                              |
| `invalidCharsRegExp` | `RegExp`                             | `/[\s,'"]/`                    | Characters considered invalid                                                           |
| `userInputs`         | `string[]`                           | `[]`                           | Additional field selectors whose values should not appear in the password               |
| `events`             | `string[]`                           | `['input', 'change', 'paste']` | DOM events that trigger re-evaluation                                                   |
| `debug`              | `boolean`                            | `false`                        | Log scores to the console                                                               |
| `onLoad`             | `() => void`                         | —                              | Called once after initialisation                                                        |
| `onKeyUp`            | `(event, data: ScoreData) => void`   | —                              | Called on every evaluation with the current score and verdict                           |
| `onScore`            | `(word, score) => number`            | —                              | Intercept and modify the computed score                                                 |
| `zxcvbn`             | `boolean`                            | `false`                        | Use [zxcvbn](https://github.com/dropbox/zxcvbn) for scoring (must be loaded separately) |
| `zxcvbnTerms`        | `string[]`                           | `[]`                           | Additional terms passed to zxcvbn                                                       |

### Rules (`rules.*`)

| Option             | Type                           | Default                     | Description                                    |
|--------------------|--------------------------------|-----------------------------|------------------------------------------------|
| `activated`        | `Record<string, boolean>`      | see below                   | Enable or disable individual rules             |
| `scores`           | `Record<string, number>`       | see below                   | Score value for each rule                      |
| `extra`            | `Record<string, RuleFunction>` | `{}`                        | Additional custom rule functions               |
| `raisePower`       | `number`                       | `1.4`                       | Exponent used by the length rules              |
| `specialCharClass` | `string`                       | `'[!,@,#,$,%,^,&,*,?,_,~]'` | Regex character class for special characters   |
| `commonPasswords`  | `string[]`                     | *(99 entries)*              | List of passwords that receive a large penalty |

#### Built-in rules

| Rule                        | Default active | Default score | Description                                                       |
|-----------------------------|----------------|---------------|-------------------------------------------------------------------|
| `wordNotEmail`              | ✅              | `-100`        | Penalizes passwords that look like an email address               |
| `wordMinLength`             | ✅              | `-50`         | Penalizes passwords shorter than `minChar`                        |
| `wordMaxLength`             | ❌              | `-50`         | Penalizes passwords longer than `maxChar`                         |
| `wordInvalidChar`           | ❌              | `-100`        | Penalizes passwords containing invalid characters                 |
| `wordSimilarToUsername`     | ✅              | `-100`        | Penalizes passwords that contain the username                     |
| `wordSequences`             | ✅              | `-20`         | Penalizes keyboard or alphabetic sequences (e.g. `abc`, `qwerty`) |
| `wordTwoCharacterClasses`   | ✅              | `2`           | Rewards use of at least two character classes                     |
| `wordRepetitions`           | ✅              | `-25`         | Penalizes triple character repetitions (e.g. `aaa`)               |
| `wordLowercase`             | ✅              | `1`           | Rewards lowercase letters                                         |
| `wordUppercase`             | ✅              | `3`           | Rewards uppercase letters                                         |
| `wordOneNumber`             | ✅              | `3`           | Rewards at least one digit                                        |
| `wordThreeNumbers`          | ✅              | `5`           | Rewards three or more digits                                      |
| `wordOneSpecialChar`        | ✅              | `3`           | Rewards at least one special character                            |
| `wordTwoSpecialChar`        | ✅              | `5`           | Rewards two or more special characters                            |
| `wordUpperLowerCombo`       | ✅              | `2`           | Rewards a mix of upper and lowercase                              |
| `wordLetterNumberCombo`     | ✅              | `2`           | Rewards a mix of letters and digits                               |
| `wordLetterNumberCharCombo` | ✅              | `2`           | Rewards a mix of letters, digits, and special characters          |
| `wordIsACommonPassword`     | ✅              | `-100`        | Penalizes common passwords                                        |

### UI (`ui.*`)

| Option                          | Type                                       | Default                                                      | Description                                                     |
|---------------------------------|--------------------------------------------|--------------------------------------------------------------|-----------------------------------------------------------------|
| `colorClasses`                  | `string[]`                                 | `['danger','danger','danger','warning','warning','success']` | Bootstrap color class for each verdict level (6 entries)        |
| `showProgressBar`               | `boolean`                                  | `true`                                                       | Render a Bootstrap progress bar                                 |
| `progressBarEmptyPercentage`    | `number`                                   | `1`                                                          | Progress bar width when the input is empty                      |
| `progressBarMinWidth`           | `number`                                   | `1`                                                          | Minimum progress bar width in pixels                            |
| `progressBarMinPercentage`      | `number`                                   | `1`                                                          | Minimum progress bar width in percent                           |
| `progressExtraCssClasses`       | `string`                                   | `''`                                                         | Extra CSS classes on the `<div class="progress">` element       |
| `progressBarExtraCssClasses`    | `string`                                   | `''`                                                         | Extra CSS classes on the `<div class="progress-bar">` element   |
| `showVerdicts`                  | `boolean`                                  | `true`                                                       | Show verdict labels (Very Weak … Very Strong)                   |
| `showVerdictsInsideProgressBar` | `boolean`                                  | `false`                                                      | Render the verdict label inside the progress bar                |
| `useVerdictCssClass`            | `boolean`                                  | `false`                                                      | Apply the color class to the verdict element                    |
| `showErrors`                    | `boolean`                                  | `false`                                                      | Show a list of failed rule messages                             |
| `showScore`                     | `boolean`                                  | `false`                                                      | Show the raw numeric score                                      |
| `showStatus`                    | `boolean`                                  | `false`                                                      | Apply a `border-*` class to the input element                   |
| `showPopover`                   | `boolean`                                  | `false`                                                      | Show verdict and errors in a Bootstrap Popover                  |
| `popoverPlacement`              | `string`                                   | `'bottom'`                                                   | Popover placement (`top`, `bottom`, `left`, `right`)            |
| `container`                     | `string \| HTMLElement \| null`            | `null`                                                       | Container element (defaults to the input's parent)              |
| `viewports`                     | `UIViewports`                              | `{}`                                                         | CSS selectors for progress, verdict, errors, and score elements |
| `scores`                        | `[number, number, number, number, number]` | `[0, 14, 26, 38, 50]`                                        | Score thresholds for the six verdict levels                     |
| `spanError`                     | `(text: string) => string`                 | —                                                            | Custom renderer for a single error message                      |
| `popoverError`                  | `(errors: string[]) => string`             | —                                                            | Custom renderer for the popover error list                      |

### i18n (`i18n.*`)

| Option | Type                      | Description                                                                          |
|--------|---------------------------|--------------------------------------------------------------------------------------|
| `t`    | `(key: string) => string` | Translation function. Receives a verdict or rule key, returns the translated string. |

## i18n

The library ships with 13 European locales. Use `createI18n` to load one:

```typescript
import {PasswordStrength, createI18n} from '@orpham/pwstrength';
import de from '@orpham/pwstrength/locales/de.json';

const meter = new PasswordStrength(input, {
    i18n: createI18n(de)
});
```

Available locales: `cs`, `de`, `el`, `en`, `es`, `fr`, `it`, `nl`, `no`, `pl`, `pt`, `sk`, `tr`.

You can also wire in any i18n library by providing a custom `t` function:

```typescript
import i18next from 'i18next';

const meter = new PasswordStrength(input, {
    i18n: {t: (key) => i18next.t(key)}
});
```

## Custom Rules

Use `addRule` to extend the built-in rule set:

```typescript
const meter = new PasswordStrength(input, options);

// penalize passwords that contain whitespace
meter.addRule(
    'noWhitespace',
    (_opts, word, score) => /\s/.test(word) ? score : 0,
    -100,
    true
);
```

The rule function signature is:

```typescript
type RuleFunction = (
    options: ResolvedOptions,
    word: string,
    score: number
) => number | false | null | undefined;
```

A **positive** return value adds to the score; a **negative** return value subtracts and triggers an error message (if
`showErrors` is enabled). Returning `false`, `null`, or `undefined` also counts as a failure.

## Build

```bash
npm run build # produces dist/pwstrength.es.js and dist/pwstrength.umd.cjs
```

## Test

```bash
npm test # run once
npm run test:watch # watch mode
```

## License

MIT — see [LICENSE.txt](LICENSE.txt). Based
on [pwstrength-bootstrap](https://github.com/ablanco/jquery.pwstrength.bootstrap) by Tane Piper and Alejandro Blanco —
see [NOTICE](NOTICE).
