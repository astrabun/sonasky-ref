import type {ValidationResult} from '@atproto/lexicon';
import {hasProp, isObj} from '../../../util';
import {lexicons} from '../../../lexicons';

export interface Record {
    /** Timestamp when created. */
    createdAt: string;
    /** Character details. */
    characterProperties?: {};
    [k: string]: unknown;
}

export function isRecord(v: unknown): v is Record {
    return (
        isObj(v) &&
        hasProp(v, '$type') &&
        (v.$type === 'app.sonasky.ref#main' || v.$type === 'app.sonasky.ref')
    );
}

export function validateRecord(v: unknown): ValidationResult {
    return lexicons.validate('app.sonasky.ref#main', v);
}
