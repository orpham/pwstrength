import {describe, it, expect, beforeEach} from 'vitest';
import {PasswordStrength} from '../src';
import {compileRequirement, readRequirementsFromDom} from '../src/requirements';

function type(input: HTMLInputElement, value: string): void {
    input.value = value;
    input.dispatchEvent(new Event('input'));
}

function classesByKey(root: ParentNode): Record<string, string> {
    const result: Record<string, string> = {};
    root.querySelectorAll<HTMLElement>('li[data-requirement]').forEach(li => {
        result[li.dataset.requirement ?? ''] = li.className;
    });
    return result;
}

describe('compileRequirement', () => {
    it('builds a test from a pattern', () => {
        const req = compileRequirement({key: 'upper', label: 'Upper', pattern: '[A-Z]'});
        expect(req.test('Abc')).toBe(true);
        expect(req.test('abc')).toBe(false);
    });

    it('builds a test from minLength', () => {
        const req = compileRequirement({key: 'len', label: 'Len', minLength: 3});
        expect(req.test('ab')).toBe(false);
        expect(req.test('abc')).toBe(true);
    });

    it('builds a test from notPattern (must NOT match)', () => {
        const req = compileRequirement({key: 'nospace', label: 'No space', notPattern: '\\s'});
        expect(req.test('ab')).toBe(true);
        expect(req.test('a b')).toBe(false);
    });

    it('combines multiple constraints with AND', () => {
        const req = compileRequirement({key: 'x', label: 'X', minLength: 3, pattern: '[0-9]'});
        expect(req.test('ab1')).toBe(true);
        expect(req.test('ab')).toBe(false);   // too short
        expect(req.test('abc')).toBe(false);  // no digit
    });

    it('lets a custom test function take precedence over constraints', () => {
        const req = compileRequirement({key: 'x', label: 'X', test: () => true, pattern: '[A-Z]'});
        expect(req.test('abc')).toBe(true);
    });
});

describe('readRequirementsFromDom', () => {
    it('reads key, label and constraints from li data attributes', () => {
        document.body.innerHTML = `
            <ul class="password-requirements">
                <li data-requirement="length" data-min-length="8">At least 8 characters</li>
                <li data-requirement="upper" data-pattern="[A-Z]">An uppercase letter</li>
                <li data-requirement="nospace" data-not-pattern="\\s">No whitespace</li>
            </ul>`;
        const ul = document.querySelector<HTMLElement>('ul.password-requirements')!;
        const reqs = readRequirementsFromDom(ul);

        expect(reqs.map(r => r.key)).toEqual(['length', 'upper', 'nospace']);
        expect(reqs[0].label).toBe('At least 8 characters');
        expect(reqs[0].test('abcdefgh')).toBe(true);
        expect(reqs[0].test('abc')).toBe(false);
        expect(reqs[1].test('Abc')).toBe(true);
        expect(reqs[2].test('a b')).toBe(false);
    });
});

describe('PasswordStrength requirements — config mode', () => {
    let input: HTMLInputElement;

    beforeEach(() => {
        document.body.innerHTML = `<div id="wrap"><input id="password" type="password"><div class="requirements"></div></div>`;
        input = document.getElementById('password') as HTMLInputElement;
        new PasswordStrength(input, {
            requirements: [
                {key: 'length', label: 'At least 8 characters', minLength: 8},
                {key: 'upper', label: 'An uppercase letter', pattern: '[A-Z]'},
                {key: 'nospace', label: 'No whitespace', notPattern: '\\s'},
            ],
            ui: {
                container: '#wrap',
                viewports: {requirements: '.requirements'},
                showProgressBar: false,
                showVerdicts: false,
            },
        });
    });

    it('renders the checklist and evaluates each requirement against the empty value', () => {
        const ul = document.querySelector('.requirements ul.password-requirements');
        expect(ul).not.toBeNull();
        const classes = classesByKey(document);
        // positive constraints are unmet on an empty value ...
        expect(classes.length).toContain('unmet');
        expect(classes.upper).toContain('unmet');
        // ... but a "must NOT contain" constraint is trivially satisfied by an empty value
        expect(classes.nospace).toContain('met');
    });

    it('toggles met / unmet as the user types', () => {
        type(input, 'abcdefgh');
        let classes = classesByKey(document);
        expect(classes.length).toContain('met');
        expect(classes.upper).toContain('unmet');
        expect(classes.nospace).toContain('met');

        type(input, 'Abcdefgh');
        classes = classesByKey(document);
        expect(classes.length).toContain('met');
        expect(classes.upper).toContain('met');
        expect(classes.nospace).toContain('met');

        type(input, 'Abc defg');
        classes = classesByKey(document);
        expect(classes.nospace).toContain('unmet');
    });

    it('cleans up the generated list on destroy', () => {
        const meter = new PasswordStrength(input, {
            requirements: [{key: 'length', label: 'Len', minLength: 8}],
            ui: {container: '#wrap', viewports: {requirements: '.vp'}, showProgressBar: false, showVerdicts: false},
        });
        meter.destroy();
        // the list generated by the destroyed instance is gone again
        expect(document.querySelectorAll('.requirements ul.password-requirements').length).toBe(1);
    });
});

describe('PasswordStrength requirements — markup mode', () => {
    it('adopts a server-rendered checklist and toggles it', () => {
        document.body.innerHTML = `
            <div id="wrap">
                <input id="password" type="password">
                <div class="requirements">
                    <ul class="password-requirements">
                        <li data-requirement="length" data-min-length="8">At least 8 characters</li>
                        <li data-requirement="upper" data-pattern="[A-Z]">An uppercase letter</li>
                    </ul>
                </div>
            </div>`;
        const input = document.getElementById('password') as HTMLInputElement;
        new PasswordStrength(input, {
            ui: {
                container: '#wrap',
                viewports: {requirements: '.requirements'},
                showProgressBar: false,
                showVerdicts: false,
            },
        });

        // library did not create a second list
        expect(document.querySelectorAll('.requirements ul.password-requirements').length).toBe(1);

        type(input, 'abcdefgh');
        let classes = classesByKey(document);
        expect(classes.length).toContain('met');
        expect(classes.upper).toContain('unmet');

        type(input, 'Abcdefgh');
        classes = classesByKey(document);
        expect(classes.upper).toContain('met');
    });
});
