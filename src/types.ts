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
}

export interface UIElements {
    progressbar: HTMLElement | null;
    verdict: HTMLElement | null;
    errors: HTMLElement | null;
    score: HTMLElement | null;
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
    rules: ResolvedRules;
    ui: ResolvedUI;
    i18n: { t: (key: string) => string };
}
