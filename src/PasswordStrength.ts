import {defaultOptions} from './defaultOptions';
import {executeRules, getVerdictAndLevel, getBuiltinRule} from './rules';
import {initUI, destroyUI, updateUI} from './ui';
import type {IPasswordStrength, PasswordStrengthOptions, ResolvedOptions, RuleFunction} from './types';

function resolveOptions(user: PasswordStrengthOptions): ResolvedOptions {
    return {
        ...defaultOptions,
        ...user,
        rules: {
            ...defaultOptions.rules,
            ...user.rules,
            activated: {...defaultOptions.rules.activated, ...user.rules?.activated} as Record<string, boolean>,
            scores: {...defaultOptions.rules.scores, ...user.rules?.scores} as Record<string, number>,
            extra: {...defaultOptions.rules.extra, ...user.rules?.extra},
        },
        ui: {
            ...defaultOptions.ui,
            ...user.ui,
            viewports: {...defaultOptions.ui.viewports, ...user.ui?.viewports},
            scores: user.ui?.scores ?? defaultOptions.ui.scores,
        },
        i18n: user.i18n ?? defaultOptions.i18n,
    };
}

export class PasswordStrength implements IPasswordStrength {
    private readonly input: HTMLInputElement;
    private readonly options: ResolvedOptions;
    private readonly handlers = new Map<string, EventListener>();

    constructor(input: HTMLInputElement, options: PasswordStrengthOptions = {}) {
        this.input = input;
        this.options = resolveOptions(options);
        this.setup();
    }

    private setup(): void {
        for (const eventName of this.options.events) {
            const handler = eventName === 'paste'
                ? this.onPaste.bind(this)
                : this.onInput.bind(this);
            this.input.addEventListener(eventName, handler);
            this.handlers.set(eventName, handler);
        }
        initUI(this.options, this.input);
        this.forceUpdate();
        this.options.onLoad?.();
    }

    destroy(): void {
        this.handlers.forEach((handler, event) =>
            this.input.removeEventListener(event, handler)
        );
        this.handlers.clear();
        destroyUI(this.options, this.input);
    }

    forceUpdate(): void {
        const errors: string[] = [];
        const score = this.input.value.length === 0
            ? undefined
            : this.computeScore(this.input.value, errors);
        updateUI(this.options, this.input, score, errors);
    }

    addRule(name: string, method: RuleFunction, score: number, active: boolean): this {
        this.options.rules.activated[name] = active;
        this.options.rules.scores[name] = score;
        this.options.rules.extra[name] = method;
        return this;
    }

    changeScore(rule: string, score: number): this {
        this.options.rules.scores[rule] = score;
        return this;
    }

    ruleActive(rule: string, active: boolean): this {
        this.options.rules.activated[rule] = active;
        return this;
    }

    ruleIsMet(rule: string): boolean {
        // Length rules need static boolean check (not raisePower score)
        if (rule === 'wordMinLength') {
            return this.input.value.length >= this.options.minChar;
        }
        if (rule === 'wordMaxLength') {
            return this.input.value.length <= this.options.maxChar;
        }
        const fn = getBuiltinRule(rule) ?? this.options.rules.extra[rule];
        if (typeof fn !== 'function') return false;
        const result = fn(this.options, this.input.value, 1);
        return typeof result === 'number' && isFinite(result) && result > 0;
    }

    private computeScore(word: string, errors: string[]): number {
        let score: number;

        if (this.options.zxcvbn) {
            const zxcvbn = (window as any).zxcvbn;
            if (typeof zxcvbn === 'function') {
                const inputs = [
                    ...this.options.userInputs
                        .map(sel => document.querySelector<HTMLInputElement>(sel)?.value ?? '')
                        .filter(Boolean),
                    ...this.options.zxcvbnTerms,
                ];
                score = Math.log(zxcvbn(word, inputs).guesses) * Math.LOG2E;
            } else {
                score = executeRules(this.options, word, errors);
            }
        } else {
            score = executeRules(this.options, word, errors);
        }

        return this.options.onScore ? this.options.onScore(word, score) : score;
    }

    private onInput(event: Event): void {
        const word = this.input.value;
        const errors: string[] = [];
        const score = word.length === 0 ? undefined : this.computeScore(word, errors);
        updateUI(this.options, this.input, score, errors);

        if (this.options.debug) console.log(`[pwstrength] score=${score}`);

        if (this.options.onKeyUp) {
            const [verdictText, verdictLevel] = getVerdictAndLevel(this.options, score);
            this.options.onKeyUp(event, {score: score ?? 0, verdictText, verdictLevel});
        }
    }

    private onPaste(event: Event): void {
        const initial = this.input.value;
        let tries = 0;
        const check = () => {
            if (this.input.value !== initial) {
                this.onInput(event);
            } else if (tries++ < 3) {
                setTimeout(check, 100);
            }
        };
        setTimeout(check, 100);
    }
}
