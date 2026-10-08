import type {ResolvedOptions, ResolvedRequirement, UIElements} from './types';
import {getVerdictAndLevel} from './rules';
import {readRequirementsFromDom} from './requirements';

const viewportCache = new WeakMap<HTMLInputElement, UIElements>();

function getContainer(options: ResolvedOptions, input: HTMLInputElement): HTMLElement {
    const {container} = options.ui;
    if (container) {
        const el = typeof container === 'string'
            ? document.querySelector<HTMLElement>(container)
            : container;
        if (el) return el;
    }
    return input.parentElement ?? document.body;
}

function findIn(
    container: HTMLElement,
    viewport: string | undefined,
    selector: string
): HTMLElement | null {
    const scope = viewport ? container.querySelector<HTMLElement>(viewport) : container;
    return scope?.querySelector<HTMLElement>(selector) ?? null;
}

export function getUIElements(options: ResolvedOptions, input: HTMLInputElement): UIElements {
    const cached = viewportCache.get(input);
    if (cached) return cached;

    const container = getContainer(options, input);
    const {viewports, showVerdictsInsideProgressBar, showPopover} = options.ui;

    const progressbar = findIn(container, viewports.progress, 'div.progress');

    let verdict: HTMLElement | null = null;
    if (showVerdictsInsideProgressBar && progressbar) {
        verdict = progressbar.querySelector('span.password-verdict');
    } else if (!showPopover) {
        verdict = findIn(container, viewports.verdict, 'span.password-verdict');
    }

    const errors = showPopover ? null : findIn(container, viewports.errors, 'ul.error-list');
    const score = findIn(container, viewports.score, 'span.password-score');
    const requirements = findIn(container, viewports.requirements, 'ul.password-requirements');

    const elements: UIElements = {progressbar, verdict, errors, score, requirements};
    viewportCache.set(input, elements);
    return elements;
}

function insertHTML(
    input: HTMLInputElement,
    html: string,
    options: ResolvedOptions,
    viewport: string | undefined
): void {
    const container = getContainer(options, input);
    if (viewport) {
        container.querySelector(viewport)?.insertAdjacentHTML('beforeend', html);
    } else {
        input.insertAdjacentHTML('afterend', html);
    }
}

function initProgressBar(options: ResolvedOptions, input: HTMLInputElement): void {
    const {ui} = options;
    const inner = ui.showVerdictsInsideProgressBar
        ? '<span class="password-verdict"></span>'
        : '';
    const html =
        `<div class="progress ${ui.progressExtraCssClasses}">` +
        `<div class="${ui.progressBarExtraCssClasses} progress-bar">${inner}</div>` +
        `</div>`;
    insertHTML(input, html, options, ui.viewports.progress);
    viewportCache.delete(input);
}

export function initUI(options: ResolvedOptions, input: HTMLInputElement): void {
    const {ui} = options;

    if (ui.showPopover) {
        initPopover(options, input);
    } else {
        if (ui.showErrors) {
            insertHTML(input, '<ul class="error-list"></ul>', options, ui.viewports.errors);
        }
        if (ui.showVerdicts && !ui.showVerdictsInsideProgressBar) {
            insertHTML(input, '<span class="password-verdict"></span>', options, ui.viewports.verdict);
        }
    }

    if (ui.showProgressBar) initProgressBar(options, input);

    if (ui.showScore) {
        insertHTML(input, '<span class="password-score"></span>', options, ui.viewports.score);
    }

    initRequirements(options, input);
}

export function destroyUI(options: ResolvedOptions, input: HTMLInputElement): void {
    const elements = viewportCache.get(input);
    if (elements) {
        elements.progressbar?.remove();
        if (!options.ui.showVerdictsInsideProgressBar) elements.verdict?.remove();
        elements.errors?.remove();
        elements.score?.remove();
    }
    destroyRequirements(options, input);
    viewportCache.delete(input);
    if (options.ui.showPopover) destroyPopover(input);
}

export function updateUI(
    options: ResolvedOptions,
    input: HTMLInputElement,
    score: number | undefined,
    errors: string[]
): void {
    const [verdictText, verdictLevel] = getVerdictAndLevel(options, score);
    const displayText = score === 0 || score === undefined ? '' : verdictText;
    const colorIndex = score === undefined ? -1 : verdictLevel;

    if (options.ui.showProgressBar) {
        updateProgressBar(options, input, score, colorIndex, displayText, verdictLevel);
    }

    if (options.ui.showPopover) {
        updatePopover(options, input, displayText, errors, score === undefined);
    } else {
        if (options.ui.showVerdicts && !options.ui.showVerdictsInsideProgressBar) {
            updateVerdict(options, input, colorIndex, displayText);
        }
        if (options.ui.showErrors) {
            updateErrors(options, input, errors, score === undefined);
        }
    }

    if (options.ui.showScore) updateScore(options, input, score);
    if (options.ui.showStatus) updateFieldStatus(options, input, colorIndex, score === undefined);
    if (options.requirements.length > 0) updateRequirements(options, input);
}

function calcPercentage(options: ResolvedOptions, score: number): number {
    const max = options.ui.scores[4];
    const min = options.ui.progressBarMinPercentage;
    return Math.max(min, Math.min(100, Math.floor((100 * score) / max)));
}

function updateProgressBar(
    options: ResolvedOptions,
    input: HTMLInputElement,
    score: number | undefined,
    colorIndex: number,
    verdictText: string,
    verdictLevel: number
): void {
    const bar = getUIElements(options, input).progressbar?.querySelector<HTMLElement>('.progress-bar');
    if (!bar) return;

    options.ui.colorClasses.forEach(cls => bar.classList.remove(`bg-${cls}`));
    if (colorIndex >= 0) {
        const cls = options.ui.colorClasses[colorIndex];
        if (cls) bar.classList.add(`bg-${cls}`);
    }

    const pct = score === undefined
        ? options.ui.progressBarEmptyPercentage
        : calcPercentage(options, score);

    bar.style.width = `${pct}%`;
    bar.style.minWidth = pct > 0 ? `${options.ui.progressBarMinWidth}px` : '';

    if (options.ui.showVerdictsInsideProgressBar) {
        const cssIdx = options.ui.useVerdictCssClass ? verdictLevel : -1;
        updateVerdict(options, input, cssIdx, verdictText);
    }
}

function updateVerdict(
    options: ResolvedOptions,
    input: HTMLInputElement,
    colorIndex: number,
    text: string
): void {
    const el = getUIElements(options, input).verdict;
    if (!el) return;
    options.ui.colorClasses.forEach(cls => el.classList.remove(cls));
    if (colorIndex >= 0) {
        const cls = options.ui.colorClasses[colorIndex];
        if (cls) el.classList.add(cls);
    }
    if (options.ui.showVerdictsInsideProgressBar) el.style.whiteSpace = 'nowrap';
    el.innerHTML = text;
}

function updateErrors(
    options: ResolvedOptions,
    input: HTMLInputElement,
    errors: string[],
    remove: boolean
): void {
    const el = getUIElements(options, input).errors;
    if (!el) return;
    el.innerHTML = remove ? '' : errors.map(e => `<li>${e}</li>`).join('');
}

function updateScore(
    options: ResolvedOptions,
    input: HTMLInputElement,
    score: number | undefined
): void {
    const el = getUIElements(options, input).score;
    if (!el) return;
    el.innerHTML = score !== undefined ? score.toFixed(2) : '';
}

function updateFieldStatus(
    _options: ResolvedOptions,
    input: HTMLInputElement,
    colorIndex: number,
    remove: boolean
): void {
    ['border-danger', 'border-warning', 'border-success'].forEach(cls =>
        input.classList.remove(cls)
    );
    if (remove || colorIndex < 0) return;
    const statusMap = ['border-danger', 'border-danger', 'border-warning', 'border-warning', 'border-success', 'border-success'];
    const cls = statusMap[colorIndex];
    if (cls) input.classList.add(cls);
}

// --- Bootstrap 5 Popover ---

function getPopoverClass(): any {
    return (window as any).bootstrap?.Popover ?? null;
}

function initPopover(options: ResolvedOptions, input: HTMLInputElement): void {
    try {
        const Popover = getPopoverClass();
        if (!Popover) return;
        Popover.getInstance(input)?.dispose();
        new Popover(input, {
            html: true,
            placement: options.ui.popoverPlacement,
            trigger: 'manual',
            content: ' ',
        });
    } catch { /* Bootstrap not available */
    }
}

function destroyPopover(input: HTMLInputElement): void {
    try {
        getPopoverClass()?.getInstance(input)?.dispose();
    } catch { /* ignore */
    }
}

function updatePopover(
    options: ResolvedOptions,
    input: HTMLInputElement,
    verdictText: string,
    errors: string[],
    remove: boolean
): void {
    try {
        const Popover = getPopoverClass();
        if (!Popover) return;
        const instance = Popover.getInstance(input);
        if (!instance) return;

        let html = '';
        let hide = true;

        if (options.ui.showVerdicts && !options.ui.showVerdictsInsideProgressBar && verdictText) {
            html = `<h5><span class="password-verdict">${verdictText}</span></h5>`;
            hide = false;
        }
        if (options.ui.showErrors && errors.length > 0) {
            html += options.ui.popoverError(errors);
            hide = false;
        }

        if (hide || remove) {
            instance.hide();
            return;
        }

        const tip = instance._element as HTMLElement | undefined;
        const isVisible = !!tip && document.body.contains(tip) &&
            getComputedStyle(tip).display !== 'none';

        if (isVisible) {
            tip.querySelector('.popover-body')!.innerHTML = html;
        } else {
            instance._config.content = html;
            instance.show();
        }
    } catch { /* ignore */
    }
}

// --- Requirements checklist ---

function findRequirementList(options: ResolvedOptions, input: HTMLInputElement): HTMLElement | null {
    const container = getContainer(options, input);
    const scope = options.ui.viewports.requirements
        ? container.querySelector<HTMLElement>(options.ui.viewports.requirements)
        : container;
    return scope?.querySelector<HTMLElement>('ul.password-requirements') ?? null;
}

function renderRequirements(list: ResolvedRequirement[]): HTMLUListElement {
    const ul = document.createElement('ul');
    ul.className = 'password-requirements';
    ul.dataset.pwstrengthGenerated = 'true';
    ul.setAttribute('aria-live', 'polite');
    for (const req of list) {
        const li = document.createElement('li');
        li.className = 'password-requirement unmet';
        li.dataset.requirement = req.key;
        li.textContent = req.label;
        ul.appendChild(li);
    }
    return ul;
}

function initRequirements(options: ResolvedOptions, input: HTMLInputElement): void {
    if (options.requirements.length > 0) {
        // Config mode: render the checklist from the resolved requirements.
        const container = getContainer(options, input);
        const target = options.ui.viewports.requirements
            ? container.querySelector(options.ui.viewports.requirements)
            : null;
        const ul = renderRequirements(options.requirements);
        if (target) {
            target.appendChild(ul);
        } else {
            input.insertAdjacentElement('afterend', ul);
        }
        viewportCache.delete(input);
    } else {
        // Markup mode: adopt a server-rendered checklist, if present. Ensure each item carries the
        // base class so the same styling hooks apply as in config mode.
        const list = findRequirementList(options, input);
        if (list) {
            list.querySelectorAll<HTMLElement>('li[data-requirement]')
                .forEach(li => li.classList.add('password-requirement'));
            options.requirements = readRequirementsFromDom(list);
        }
    }
}

function updateRequirements(options: ResolvedOptions, input: HTMLInputElement): void {
    const list = getUIElements(options, input).requirements;
    if (!list) return;

    const word = input.value;
    const tests = new Map(options.requirements.map(req => [req.key, req.test] as const));

    list.querySelectorAll<HTMLElement>('li[data-requirement]').forEach(li => {
        const test = tests.get(li.dataset.requirement ?? '');
        if (!test) return;
        const met = test(word);
        li.classList.toggle('met', met);
        li.classList.toggle('unmet', !met);
    });
}

function destroyRequirements(options: ResolvedOptions, input: HTMLInputElement): void {
    const list = findRequirementList(options, input);
    if (!list) return;
    if (list.dataset.pwstrengthGenerated === 'true') {
        list.remove();
    } else {
        list.querySelectorAll('li[data-requirement]')
            .forEach(li => li.classList.remove('met', 'unmet'));
    }
}
