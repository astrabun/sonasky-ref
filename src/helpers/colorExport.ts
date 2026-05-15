import {createAcoFile} from 'adobe-aco';
import {zipSync} from 'fflate';

interface Color {
    label: string;
    hex: string;
}

function hexToRgb(hex: string): [number, number, number] {
    return [
        parseInt(hex.slice(0, 2), 16),
        parseInt(hex.slice(2, 4), 16),
        parseInt(hex.slice(4, 6), 16),
    ];
}

function downloadBlob(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
}

function safeName(name: string): string {
    return name.replace(/[^a-zA-Z0-9_\- ]/g, '_');
}

function xmlEscape(str: string): string {
    return str.replace(/[<>&"]/g, (ch) => {
        if (ch === '<') {
            return '&lt;';
        }
        if (ch === '>') {
            return '&gt;';
        }
        if (ch === '&') {
            return '&amp;';
        }
        return '&quot;';
    });
}

// GIMP Palette (.gpl)
export function exportGpl(colors: Color[], name: string): void {
    const lines = ['GIMP Palette', `Name: ${name}`, 'Columns: 0', '#'];
    for (const color of colors) {
        const [r, g, b] = hexToRgb(color.hex);
        lines.push(
            `${String(r).padStart(3)} ${String(g).padStart(3)} ${String(b).padStart(3)}\t${color.label}`,
        );
    }
    downloadBlob(
        new Blob([lines.join('\n')], {type: 'text/plain'}),
        `${safeName(name)}.gpl`,
    );
}

// Krita Palette (.kpl) — ZIP with colorset.xml
export function exportKpl(colors: Color[], name: string): void {
    const cols = Math.min(colors.length, 10);

    const colorXml = colors
        .map((c, i) => {
            const [r, g, b] = hexToRgb(c.hex);
            const label = xmlEscape(c.label);
            const row = Math.floor(i / cols);
            const col = i % cols;
            return `  <ColorSetEntry name="${label}" id="${i}" bitdepth="U8" spot="false">
    <sRGB r="${(r / 255).toFixed(6)}" g="${(g / 255).toFixed(6)}" b="${(b / 255).toFixed(6)}"/>
    <Position row="${row}" column="${col}"/>
  </ColorSetEntry>`;
        })
        .join('\n');

    const rows = Math.ceil(colors.length / cols);
    const escapedName = xmlEscape(name);

    const colorsetXml = `<?xml version="1.0" encoding="UTF-8"?>
<ColorSet name="${escapedName}" comment="" columns="${cols}" rows="${rows}" readonly="false" version="2.0">
${colorXml}
</ColorSet>
`;

    const profilesXml = `<?xml version="1.0" encoding="UTF-8"?>
<Profiles>
</Profiles>
`;

    const enc = new TextEncoder();
    const zipBytes = zipSync({
        'colorset.xml': enc.encode(colorsetXml),
        // MIME-type MUST be first and stored uncompressed — Krita detects KPL
        // By scanning raw ZIP bytes for the mimetype string (like ODF/EPUB)
        mimetype: [enc.encode('application/x-krita-palette'), {level: 0}],
        'profiles.xml': enc.encode(profilesXml),
    });

    downloadBlob(
        new Blob([zipBytes.buffer as ArrayBuffer], {type: 'application/zip'}),
        `${safeName(name)}.kpl`,
    );
}

// CSS Variables (.css)
export function exportCss(colors: Color[], name: string): void {
    const vars = colors
        .map((c) => {
            const varName = c.label
                .toLowerCase()
                .replace(/\s+/g, '-')
                .replace(/[^a-z0-9-]/g, '');
            return `    --color-${varName}: #${c.hex};`;
        })
        .join('\n');

    const css = `/* ${name} Color Palette */\n:root {\n${vars}\n}\n`;
    downloadBlob(new Blob([css], {type: 'text/css'}), `${safeName(name)}.cls`);
}

// Adobe Color (.aco)
export function exportAco(colors: Color[], name: string): void {
    const swatches = colors.map((c) => {
        const [r, g, b] = hexToRgb(c.hex);
        return [[r, g, b], 'rgb', c.label] as [number[], 'rgb', string];
    });
    const buf = createAcoFile(swatches);
    downloadBlob(
        new Blob([buf], {type: 'application/octet-stream'}),
        `${safeName(name)}.aco`,
    );
}

// Plain Text (.txt)
export function exportTxt(colors: Color[], name: string): void {
    const lines = [`${name} Color Palette`, ''];
    for (const color of colors) {
        lines.push(`${color.label}: #${color.hex}`);
    }
    downloadBlob(
        new Blob([lines.join('\n')], {type: 'text/plain'}),
        `${safeName(name)}.txt`,
    );
}
