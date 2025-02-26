import dayjs from "dayjs";
import { compare as semverCompare } from "semver";

export interface ChangelogEntry {
    version: string;
    date: dayjs.Dayjs;
    changes: string[];
}

const changelogData = [
    {
        version: '1.0.0',
        date: dayjs(`2025-01-12`),
        changes: [
            `Initial release of the application.`,
            `Added basic functionality for data manipulation and storage.`,
        ]
    },
    {
        version: '1.1.0',
        date: dayjs(`2025-02-25`),
        changes: [
            `Combine Add and Edit character pages into a single re-usable component.`,
            `Added changelog.`,
        ]
    },
];

// get latest version by the highest semver version
const latestVersion = changelogData.reduce((latest, current) => {
    return (semverCompare(current.version, latest.version) > 0 ? current : latest);
}, changelogData[0]);

export {changelogData, latestVersion};
