export type CharacterLinkType =
    | 'furaffinity'
    | 'bluesky'
    | 'refsheetdotnet'
    | 'toyhouse';

export interface CharacterLink {
    type: CharacterLinkType;
    url: string;
    label?: string;
}

export const LINK_TYPE_LABELS: Record<CharacterLinkType, string> = {
    bluesky: 'Bluesky',
    furaffinity: 'FurAffinity',
    refsheetdotnet: 'Refsheet.net',
    toyhouse: 'Toyhouse',
};

export const LINK_TYPE_HINTS: Record<CharacterLinkType, string> = {
    bluesky: 'Must be on https://bsky.app',
    furaffinity: 'Must be on https://furaffinity.net',
    refsheetdotnet: 'Must be on https://refsheet.net',
    toyhouse: 'Must be on https://toyhou.se/',
};

export const ALLOWED_LINK_TYPES: CharacterLinkType[] = [
    'furaffinity',
    'bluesky',
    'refsheetdotnet',
    'toyhouse',
];

export function validateCharacterLink(link: CharacterLink): boolean {
    switch (link.type) {
        case 'furaffinity': {
            try {
                const url = new URL(link.url);
                return (
                    url.protocol === 'https:' &&
                    (url.hostname === 'furaffinity.net' ||
                        url.hostname === 'www.furaffinity.net')
                );
            } catch {
                return false;
            }
        }
        case 'bluesky': {
            try {
                const url = new URL(link.url);
                return url.protocol === 'https:' && url.hostname === 'bsky.app';
            } catch {
                return false;
            }
        }
        case 'refsheetdotnet': {
            try {
                const url = new URL(link.url);
                return (
                    url.protocol === 'https:' && url.hostname === 'refsheet.net'
                );
            } catch {
                return false;
            }
        }
        case 'toyhouse': {
            try {
                const url = new URL(link.url);
                return (
                    url.protocol === 'https:' && url.hostname === 'toyhou.se'
                );
            } catch {
                return false;
            }
        }
        default: {
            return false;
        }
    }
}
