import {FORBIDDEN_SEQUENCES} from './defaultOptions';
import type {BuiltinRule, ResolvedOptions, RuleFunction} from './types';

function getUsernameValue(field: string | HTMLInputElement | null): string {
    if (!field) return '';
    if (field instanceof HTMLInputElement) return field.value;
    return document.querySelector<HTMLInputElement>(field)?.value ?? '';
}

function wordNotEmail(_opts: ResolvedOptions, word: string, score: number): number {
    return /^([\w!#$%&'*+\-/=?^`{|}~]+\.)*[\w!#$%&'*+\-/=?^`{|}~]+@((((([a-z0-9][a-z0-9-]{0,62}[a-z0-9])|[a-z])\.)+[a-z]{2,6})|(\d{1,3}\.){3}\d{1,3}(:\d{1,5})?)$/i.test(word)
        ? score : 0;
}

function wordMinLength(opts: ResolvedOptions, word: string, score: number): number {
    const lenScore = Math.pow(word.length, opts.rules.raisePower);
    return word.length < opts.minChar ? lenScore + score : lenScore;
}

function wordMaxLength(opts: ResolvedOptions, word: string, score: number): number {
    const lenScore = Math.pow(word.length, opts.rules.raisePower);
    return word.length > opts.maxChar ? score : lenScore;
}

function wordInvalidChar(opts: ResolvedOptions, word: string, score: number): number {
    return opts.invalidCharsRegExp.test(word) ? score : 0;
}

function wordSimilarToUsername(opts: ResolvedOptions, word: string, score: number): number {
    const username = getUsernameValue(opts.usernameField);
    if (!username) return 0;
    const escaped = username.replace(/[-[\]/{}()*+=?:.\\^$|!,]/g, '\\$&');
    return new RegExp(escaped, 'i').test(word) ? score : 0;
}

function wordTwoCharacterClasses(opts: ResolvedOptions, word: string, score: number): number | undefined {
    const specialRE = new RegExp('(.' + opts.rules.specialCharClass + ')');
    if (
        /([a-z].*[A-Z])|([A-Z].*[a-z])/.test(word) ||
        (/[a-zA-Z]/.test(word) && /[0-9]/.test(word)) ||
        (specialRE.test(word) && /[a-zA-Z0-9_]/.test(word))
    ) {
        return score;
    }
    return undefined;
}

function wordRepetitions(_opts: ResolvedOptions, word: string, score: number): number {
    return /(.)\1\1/.test(word) ? score : 0;
}

function wordSequences(_opts: ResolvedOptions, word: string, score: number): number {
    if (word.length <= 2) return 0;
    const lw = word.toLowerCase();
    for (const seq of FORBIDDEN_SEQUENCES) {
        const reversed = seq.split('').reverse().join('');
        for (const s of [seq, reversed]) {
            for (let j = 0; j < word.length - 2; j++) {
                if (s.includes(lw.substring(j, j + 3))) return score;
            }
        }
    }
    return 0;
}

function wordLowercase(_opts: ResolvedOptions, word: string, score: number): number {
    return /[a-z]/.test(word) ? score : 0;
}

function wordUppercase(_opts: ResolvedOptions, word: string, score: number): number {
    return /[A-Z]/.test(word) ? score : 0;
}

function wordOneNumber(_opts: ResolvedOptions, word: string, score: number): number {
    return /\d/.test(word) ? score : 0;
}

function wordThreeNumbers(_opts: ResolvedOptions, word: string, score: number): number {
    return /(.*[0-9].*[0-9].*[0-9])/.test(word) ? score : 0;
}

function wordOneSpecialChar(opts: ResolvedOptions, word: string, score: number): number {
    return new RegExp(opts.rules.specialCharClass).test(word) ? score : 0;
}

function wordTwoSpecialChar(opts: ResolvedOptions, word: string, score: number): number {
    const sc = opts.rules.specialCharClass;
    return new RegExp(`(.*${sc}.*${sc})`).test(word) ? score : 0;
}

function wordUpperLowerCombo(_opts: ResolvedOptions, word: string, score: number): number {
    return /([a-z].*[A-Z])|([A-Z].*[a-z])/.test(word) ? score : 0;
}

function wordLetterNumberCombo(_opts: ResolvedOptions, word: string, score: number): number {
    return /[a-zA-Z]/.test(word) && /[0-9]/.test(word) ? score : 0;
}

function wordLetterNumberCharCombo(opts: ResolvedOptions, word: string, score: number): number {
    const sc = opts.rules.specialCharClass;
    return new RegExp(`([a-zA-Z0-9].*${sc})|(${sc}.*[a-zA-Z0-9])`).test(word) ? score : 0;
}

function wordIsACommonPassword(opts: ResolvedOptions, word: string, score: number): number {
    return opts.rules.commonPasswords.includes(word) ? score : 0;
}

// noinspection JSUnusedGlobalSymbols
export const builtinRules: Record<BuiltinRule, RuleFunction> = {
    wordNotEmail,
    wordMinLength,
    wordMaxLength,
    wordInvalidChar,
    wordSimilarToUsername,
    wordTwoCharacterClasses,
    wordRepetitions,
    wordSequences,
    wordLowercase,
    wordUppercase,
    wordOneNumber,
    wordThreeNumbers,
    wordOneSpecialChar,
    wordTwoSpecialChar,
    wordUpperLowerCombo,
    wordLetterNumberCombo,
    wordLetterNumberCharCombo,
    wordIsACommonPassword,
};

export function getBuiltinRule(name: string): RuleFunction | undefined {
    return (builtinRules as Record<string, RuleFunction>)[name];
}

export function executeRules(options: ResolvedOptions, word: string, errors: string[]): number {
    let total = 0;

    for (const [rule, active] of Object.entries(options.rules.activated)) {
        if (!active) continue;

        const score = options.rules.scores[rule] ?? 0;
        const fn = getBuiltinRule(rule) ?? options.rules.extra[rule];
        if (typeof fn !== 'function') continue;

        const result = fn(options, word, score);

        if (typeof result === 'number' && isFinite(result)) {
            total += result;
        }

        const failed =
            result === null ||
            result === undefined ||
            result === false ||
            (typeof result === 'number' && (result < 0 || !isFinite(result)));

        if (failed) {
            const text = options.i18n.t(rule);
            const msg = options.ui.spanError(text);
            if (msg) errors.push(msg);
        }
    }

    return total;
}

export function getVerdictAndLevel(
    options: ResolvedOptions,
    score: number | undefined
): [string, number] {
    if (score === undefined) return ['', 0];

    const [s0, s1, s2, s3, s4] = options.ui.scores;
    let level: number;
    if (score <= s0) level = 0;
    else if (score < s1) level = 1;
    else if (score < s2) level = 2;
    else if (score < s3) level = 3;
    else if (score < s4) level = 4;
    else level = 5;

    const keys = ['veryWeak', 'weak', 'normal', 'medium', 'strong', 'veryStrong'];
    return [options.i18n.t(keys[level]), level];
}
