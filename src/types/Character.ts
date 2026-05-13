export interface Character {
    name: string; // Required, max length 128 characters
    species?: string; // Optional, max length 64 characters
    colors?: {label: string; hex: string}[]; // Optional, max array length 16, label max length 64, hex length 6
    pronouns?: string; // Optional, max length 32 characters
    refSheet?: string; // Optional, ref to a app.bsky.feed.post
    refSheetImageIndex?: number; // Optional, index of image in refSheet post
    altRef?: string; // Optional, ref to a app.bsky.feed.post
    altRefImageIndex?: number; // Optional, index of image in altRef post
    drawWithoutAskingSFW?: boolean; // Optional
    drawWithoutAskingNSFW?: boolean; // Optional
    nsfw?: boolean; // Optional
    description?: string; // Optional, max length 2560 characters
}

export const CharacterTypeKeys = [
    'name',
    'species',
    'colors',
    'pronouns',
    'refSheet',
    'refSheetImageIndex',
    'altRef',
    'altRefImageIndex',
    'drawWithoutAskingSFW',
    'drawWithoutAskingNSFW',
    'nsfw',
    'description',
];

// Validation function
export function validateCharacter(character: Character): {
    status: boolean;
    message: string;
} {
    if (character.name.length > 128) {
        return {message: 'Name exceeds 128 characters', status: false};
    }
    if (character.species && character.species.length > 64) {
        return {message: 'Species exceeds 64 characters', status: false};
    }
    if (character.colors && character.colors.length > 16) {
        return {message: 'Colors array exceeds 16 items', status: false};
    }
    if (character.colors) {
        for (const color of character.colors) {
            if (color.label.length > 64) {
                return {
                    message: 'Color label exceeds 64 characters',
                    status: false,
                };
            }
            if (color.hex.length !== 6) {
                return {
                    message: 'Color hex is not 6 characters',
                    status: false,
                };
            }
        }
    }
    if (character.pronouns && character.pronouns.length > 32) {
        return {message: 'Pronouns exceed 32 characters', status: false};
    }
    if (character.description && character.description.length > 2560) {
        return {message: 'Description exceeds 2560 characters', status: false};
    }
    return {message: 'OK', status: true};
}
