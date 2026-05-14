import dayjs from 'dayjs';
import {compare as semverCompare} from 'semver';

export interface ChangelogEntry {
    version: string;
    date: dayjs.Dayjs;
    changes: string[];
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
