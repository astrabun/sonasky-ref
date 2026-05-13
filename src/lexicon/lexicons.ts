import type {LexiconDoc} from '@atproto/lexicon';
import {Lexicons} from '@atproto/lexicon';

export const schemaDict = {
    AppSonaskyRef: {
        defs: {
            main: {
                description: "Record containing a user's thingy.",
                key: 'tid',
                record: {
                    properties: {
                        characters: {
                            description: 'Array of characters.',
                            items: {
                                type: 'unknown',
                            },
                            maxLength: 8,
                            type: 'array',
                        },
                        createdAt: {
                            description:
                                'Timestamp when the actor first signed into the app.',
                            format: 'datetime',
                            type: 'string',
                        },
                    },
                    required: ['createdAt'],
                    type: 'object',
                },
                type: 'record',
            },
        },
        id: 'app.sonasky.ref',
        lexicon: 1,
    },
} as const satisfies Record<string, LexiconDoc>;

export const schemas = Object.values(schemaDict);
export const lexicons: Lexicons = new Lexicons(schemas);
export const ids = {AppSonaskyRef: 'app.sonasky.ref'};
