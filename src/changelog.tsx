import dayjs from 'dayjs';
import type {ReactNode} from 'react';
import {compare as semverCompare} from 'semver';

export interface ChangelogEntry {
    version: string;
    date: dayjs.Dayjs;
    changes: (string | ReactNode)[];
}

const changelogData = [
    {
        changes: [
            `Initial release of the application.`,
            `Added basic functionality for data manipulation and storage.`,
        ],
        date: dayjs(`2025-01-12`),
        version: '1.0.0',
    },
    {
        changes: [
            `Combine Add and Edit character pages into a single re-usable component.`,
            `Added changelog.`,
        ],
        date: dayjs(`2025-02-25`),
        version: '1.1.0',
    },
    {
        changes: [`Improve support for alternate PDS users.`],
        date: dayjs(`2025-12-29`),
        version: '1.1.1',
    },
    {
        changes: [`Depdendency updates.`, `Quality of life updates.`],
        date: dayjs(`2026-05-13`),
        version: '1.2.0',
    },
    {
        changes: [
            `Add image index selection for ref sheets (in case the post has multiple images)`,
            `Add blur + age warning dialog for ref sheets with NSFW tag applied.`,
        ],
        date: dayjs(`2026-05-13`),
        version: '1.3.0',
    },
    {
        changes: [
            `HOTFIX: Increase blur on nsfw to make it harder to see through`,
        ],
        date: dayjs(`2026-05-13`),
        version: '1.3.1',
    },
    {
        changes: [
            `Adds a feature for adding external links to a ref sheet page; if you've got a refsheet on FA or an extra image to link to on Bluesky, for example, you can add it here.`,
            <>
                If an external site you would like to link to is not yet
                supported,{' '}
                <a
                    href="https://github.com/astrabun/sonasky-ref/issues/new?template=external-link-domain.md"
                    target="_blank"
                    rel="noopener noreferrer"
                >
                    open an issue on Github
                </a>
                .
            </>,
            `Adjusts how colors are displayed on the character view page; they should be centered and consistent heights now.`,
        ],
        date: dayjs(`2026-05-14`),
        version: '1.4.0',
    },
];

// Get latest version by the highest semver version
const latestVersion = changelogData.reduce(
    (latest, current) =>
        semverCompare(current.version, latest.version) > 0 ? current : latest,
    changelogData[0],
);

export {changelogData, latestVersion};
