import { LexiconDoc, Lexicons } from '@atproto/lexicon'

export const schemaDict = {
  AppSonaskyRef: {
    lexicon: 1,
    id: 'app.sonasky.ref',
    defs: {
      main: {
        type: 'record',
        description: "Record containing a user's thingy.",
        key: 'tid',
        record: {
          type: 'object',
          required: ['createdAt'],
          properties: {
            createdAt: {
              type: 'string',
              format: 'datetime',
              description:
                'Timestamp when the actor first signed into the app.',
            },
            characters: {
              type: 'array',
              description: 'Array of characters.',
              maxLength: 8,
              items: {
                type: 'unknown',
              },
            },
          },
        },
      },
    },
  },
} as const satisfies Record<string, LexiconDoc>

export const schemas = Object.values(schemaDict)
export const lexicons: Lexicons = new Lexicons(schemas)
export const ids = { AppSonaskyRef: 'app.sonasky.ref' }
