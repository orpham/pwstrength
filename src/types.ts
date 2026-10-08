export type BuiltinRule =
    | 'wordNotEmail'
    | 'wordMinLength'
    | 'wordMaxLength'
    | 'wordInvalidChar'
    | 'wordSimilarToUsername'
    | 'wordSequences'
    | 'wordTwoCharacterClasses'
    | 'wordRepetitions'
    | 'wordLowercase'
    | 'wordUppercase'
    | 'wordOneNumber'
    | 'wordThreeNumbers'
    | 'wordOneSpecialChar'
    | 'wordTwoSpecialChar'
    | 'wordUpperLowerCombo'
    | 'wordLetterNumberCombo'
    | 'wordLetterNumberCharCombo'
    | 'wordIsACommonPassword';

export type RuleFunction = (
    options: ResolvedOptions,
    word: string,
    score: number
) => number | false | null | undefined;

/**
 * A single password requirement shown in the live checklist. Define it either with a custom `test` function (full
 * control, not serializable) or with declarative constraints (`pattern`, `notPattern`, `minLength`, `maxLength`) that
 * are JSON-serializable and therefore suitable for server-driven configuration. When `test` is present it takes
 * precedence; otherwise the declarative constraints are combined with logical AND.
 */
export interface PasswordRequirement {
    key: string;
    label: string;
    test?: (word: string) => boolean;
    pattern?: string | RegExp;
    notPattern?: string | RegExp;
    minLength?: number;
    maxLength?: number;
    flags?: string;
}

/** A requirement after normalization: always carries a boolean `test`. */
export interface ResolvedRequirement {
    key: string;
    label: string;
    test: (word: string) => boolean;
}

export interface ScoreData {
    score: number;
    verdictText: string;
    verdictLevel: number;
}

export interface UIViewports {
    progress?: string;
    verdict?: string;
    errors?: string;
    score?: string;
    requirements?: string;
}

export interface UIElements {
    progressbar: HTMLElement | null;
    verdict: HTMLElement | null;
    errors: HTMLElement | null;
    score: HTMLElement | null;
    requirements: HTMLElement | null;
}

export interface PasswordStrengthOptions {
    minChar?: number;
    maxChar?: number;
    usernameField?: string | HTMLInputElement | null;
    invalidCharsRegExp?: RegExp;
    userInputs?: string[];
    events?: string[];
    debug?: boolean;
    onLoad?: () => void;
    onKeyUp?: (event: Event, data: ScoreData) => void;
    onScore?: (word: string, score: number) => number;
    zxcvbn?: boolean;
    zxcvbnTerms?: string[];
    requirements?: PasswordRequirement[];
    rules?: {
        activated?: Partial<Record<BuiltinRule | string, boolean>>;
        scores?: Partial<Record<BuiltinRule | string, number>>;
        extra?: Record<string, RuleFunction>;
        raisePower?: number;
        specialCharClass?: string;
        commonPasswords?: string[];
    };
    ui?: {
        colorClasses?: string[];
        showProgressBar?: boolean;
        progressBarEmptyPercentage?: number;
        progressBarMinWidth?: number;
        progressBarMinPercentage?: number;
        progressExtraCssClasses?: string;
        progressBarExtraCssClasses?: string;
        showVerdicts?: boolean;
        showVerdictsInsideProgressBar?: boolean;
        useVerdictCssClass?: boolean;
        showErrors?: boolean;
        showScore?: boolean;
        showStatus?: boolean;
        showPopover?: boolean;
        popoverPlacement?: string;
        container?: string | HTMLElement | null;
        viewports?: UIViewports;
        scores?: [number, number, number, number, number];
        spanError?: (translatedText: string) => string;
        popoverError?: (errors: string[]) => string;
    };
    i18n?: {
        t: (key: string) => string;
    };
}

export interface ResolvedRules {
    activated: Record<string, boolean>;
    scores: Record<string, number>;
    extra: Record<string, RuleFunction>;
    raisePower: number;
    specialCharClass: string;
    commonPasswords: string[];
}

export interface ResolvedUI {
    colorClasses: string[];
    showProgressBar: boolean;
    progressBarEmptyPercentage: number;
    progressBarMinWidth: number;
    progressBarMinPercentage: number;
    progressExtraCssClasses: string;
    progressBarExtraCssClasses: string;
    showVerdicts: boolean;
    showVerdictsInsideProgressBar: boolean;
    useVerdictCssClass: boolean;
    showErrors: boolean;
    showScore: boolean;
    showStatus: boolean;
    showPopover: boolean;
    popoverPlacement: string;
    container: string | HTMLElement | null;
    viewports: UIViewports;
    scores: [number, number, number, number, number];
    spanError: (translatedText: string) => string;
    popoverError: (errors: string[]) => string;
}

export interface IPasswordStrength {
    destroy(): void;

    forceUpdate(): void;

    addRule(name: string, method: RuleFunction, score: number, active: boolean): this;

    changeScore(rule: string, score: number): this;

    ruleActive(rule: string, active: boolean): this;

    ruleIsMet(rule: string): boolean;
}

export interface ResolvedOptions {
    minChar: number;
    maxChar: number;
    usernameField: string | HTMLInputElement | null;
    invalidCharsRegExp: RegExp;
    userInputs: string[];
    events: string[];
    debug: boolean;
    onLoad: (() => void) | undefined;
    onKeyUp: ((event: Event, data: ScoreData) => void) | undefined;
    onScore: ((word: string, score: number) => number) | undefined;
    zxcvbn: boolean;
    zxcvbnTerms: string[];
    requirements: ResolvedRequirement[];
    rules: ResolvedRules;
    ui: ResolvedUI;
    i18n: { t: (key: string) => string };
}
