import type {PasswordRequirement, ResolvedRequirement} from './types';

interface Constraints {
    pattern?: string | RegExp;
    notPattern?: string | RegExp;
    minLength?: number;
    maxLength?: number;
    flags?: string;
}

function toRegExp(pattern: string | RegExp, flags?: string): RegExp {
    return pattern instanceof RegExp ? pattern : new RegExp(pattern, flags);
}

/**
 * Builds a boolean test from declarative constraints. All provided constraints are combined with
 * logical AND. With no constraints the test is vacuously true.
 */
function buildTest(c: Constraints): (word: string) => boolean {
    const pattern = c.pattern != null ? toRegExp(c.pattern, c.flags) : null;
    const notPattern = c.notPattern != null ? toRegExp(c.notPattern, c.flags) : null;
    const {minLength, maxLength} = c;

    return (word: string): boolean =>
        (minLength === undefined || word.length >= minLength) &&
        (maxLength === undefined || word.length <= maxLength) &&
        (pattern === null || pattern.test(word)) &&
        (notPattern === null || !notPattern.test(word));
}

/**
 * Normalizes a single config requirement into a resolved one. A custom `test` function takes
 * precedence over declarative constraints.
 */
export function compileRequirement(req: PasswordRequirement): ResolvedRequirement {
    const test = typeof req.test === 'function' ? req.test : buildTest(req);
    return {key: req.key, label: req.label, test};
}

/** Normalizes a list of config requirements. */
export function compileRequirements(list: PasswordRequirement[]): ResolvedRequirement[] {
    return list.map(compileRequirement);
}

/**
 * Reads requirements from server-rendered markup: every `li[data-requirement]` inside `list`
 * becomes a requirement. The label is the element's text content; the constraints come from
 * `data-pattern`, `data-not-pattern`, `data-min-length`, `data-max-length` and `data-flags`.
 */
export function readRequirementsFromDom(list: HTMLElement): ResolvedRequirement[] {
    const result: ResolvedRequirement[] = [];

    list.querySelectorAll<HTMLElement>('li[data-requirement]').forEach((li) => {
        const key = li.dataset.requirement;
        if (!key) return;

        const {minLength, maxLength} = li.dataset;
        const test = buildTest({
            pattern: li.dataset.pattern,
            notPattern: li.dataset.notPattern,
            minLength: minLength !== undefined ? Number(minLength) : undefined,
            maxLength: maxLength !== undefined ? Number(maxLength) : undefined,
            flags: li.dataset.flags,
        });

        result.push({key, label: (li.textContent ?? '').trim(), test});
    });

    return result;
}
