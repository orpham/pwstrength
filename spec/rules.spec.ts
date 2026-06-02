import {describe, it, expect, beforeEach} from 'vitest';
import {executeRules, getVerdictAndLevel, builtinRules} from '../src/rules';
import {defaultOptions} from '../src/defaultOptions';
import type {ResolvedOptions} from '../src/types';

function opts(overrides: Partial<ResolvedOptions> = {}): ResolvedOptions {
    return {
        ...defaultOptions,
        ...overrides,
        rules: {...defaultOptions.rules, ...overrides.rules},
        ui: {...defaultOptions.ui, ...overrides.ui},
    };
}

describe('executeRules — default config', () => {
    let errors: string[];

    beforeEach(() => {
        errors = [];
    });

    it('penalizes a common password', () => {
        expect(executeRules(opts(), 'password', errors)).toBeLessThan(0);
    });

    it('scores a strong password positively', () => {
        expect(executeRules(opts(), '3vEr!t#iNg1$f!n3', errors)).toBeGreaterThan(50);
    });

    it('gives a very high score to an excellent password', () => {
        expect(executeRules(opts(), 'qm2oUY!%$32znheSK&*3@#', errors)).toBeGreaterThan(80);
    });

    it('penalizes a short password', () => {
        expect(executeRules(opts(), 'ab', errors)).toBeLessThan(0);
    });

    it('penalizes an email used as password', () => {
        expect(executeRules(opts(), 'test@example.com', errors)).toBeLessThan(0);
    });

    it('penalizes keyboard sequences', () => {
        const withSeq = executeRules(opts(), 'qwertypasswdisbad', errors);
        const noSeq = executeRules(opts(), 'mdiw93jc65oak$&!', []);
        expect(withSeq).toBeLessThan(noSeq);
    });

    it('penalizes reversed sequences', () => {
        expect(executeRules(opts(), '0987ytrewqisbad', errors)).toBeLessThan(50);
    });

    it('penalizes character repetitions', () => {
        const withRep = executeRules(opts(), 'rreepppeatttt', errors);
        const noRep = executeRules(opts(), 'QAZwsxTGByhn', []);
        expect(withRep).toBeLessThan(noRep);
    });
});

describe('getVerdictAndLevel', () => {
    const options = opts();

    it('returns level 0 for very low score', () => {
        const [, level] = getVerdictAndLevel(options, -100);
        expect(level).toBe(0);
    });

    it('returns level 5 for high score', () => {
        const [, level] = getVerdictAndLevel(options, 100);
        expect(level).toBe(5);
    });

    it('returns empty text for undefined score', () => {
        const [text] = getVerdictAndLevel(options, undefined);
        expect(text).toBe('');
    });

    it('returns the translated verdict key', () => {
        const [text] = getVerdictAndLevel(options, 100);
        expect(text).toBe(options.i18n.t('veryStrong'));
    });
});

describe('builtinRules', () => {
    const options = opts();

    it('wordNotEmail detects emails', () => {
        expect(builtinRules.wordNotEmail(options, 'test@example.com', -100)).toBe(-100);
        expect(builtinRules.wordNotEmail(options, 'notanemail', -100)).toBe(0);
    });

    it('wordLowercase rewards lowercase letters', () => {
        expect(builtinRules.wordLowercase(options, 'abc', 1)).toBe(1);
        expect(builtinRules.wordLowercase(options, 'ABC', 1)).toBe(0);
    });

    it('wordUppercase rewards uppercase letters', () => {
        expect(builtinRules.wordUppercase(options, 'ABC', 3)).toBe(3);
        expect(builtinRules.wordUppercase(options, 'abc', 3)).toBe(0);
    });

    it('wordOneNumber rewards digits', () => {
        expect(builtinRules.wordOneNumber(options, 'abc1', 3)).toBe(3);
        expect(builtinRules.wordOneNumber(options, 'abc', 3)).toBe(0);
    });

    it('wordRepetitions penalizes triple-char repeats', () => {
        expect(builtinRules.wordRepetitions(options, 'aaabbb', -25)).toBe(-25);
        expect(builtinRules.wordRepetitions(options, 'aabb', -25)).toBe(0);
    });

    it('wordIsACommonPassword penalizes known passwords', () => {
        expect(builtinRules.wordIsACommonPassword(options, '123456', -100)).toBe(-100);
        expect(builtinRules.wordIsACommonPassword(options, 'x9k!mQ2p', -100)).toBe(0);
    });

    it('wordSequences detects keyboard sequences', () => {
        expect(builtinRules.wordSequences(options, 'abcdef', -20)).toBe(-20);
        expect(builtinRules.wordSequences(options, 'mdiw93jc', -20)).toBe(0);
    });

    it('wordSequences detects reversed sequences', () => {
        expect(builtinRules.wordSequences(options, 'zyxwvu', -20)).toBe(-20);
    });
});
