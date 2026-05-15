import Box from '@mui/material/Box';
import DOMPurify from 'dompurify';
import {marked} from 'marked';

const ALLOWED_TAGS = [
    'blockquote',
    'br',
    'del',
    'em',
    'h1',
    'h2',
    'h3',
    'h4',
    'h5',
    'h6',
    'input',
    'li',
    'ol',
    'p',
    'strong',
    'table',
    'tbody',
    'td',
    'th',
    'thead',
    'tr',
    'u',
    'ul',
];

const ALLOWED_ATTR = ['checked', 'disabled', 'type'];

marked.use({breaks: true, gfm: true});

interface Props {
    content: string;
}

export function MarkdownDescription({content}: Props) {
    const html = DOMPurify.sanitize(marked.parse(content) as string, {
        ALLOWED_ATTR,
        ALLOWED_TAGS,
    });

    return (
        <Box
            dangerouslySetInnerHTML={{__html: html}}
            sx={{
                '& blockquote': {
                    borderColor: 'divider',
                    borderLeft: '3px solid',
                    color: 'text.secondary',
                    my: 0.5,
                    pl: 1.5,
                },
                '& h1': {fontSize: '1.4rem', fontWeight: 700, my: 1},
                '& h2': {fontSize: '1.2rem', fontWeight: 700, my: 1},
                '& h3, & h4, & h5, & h6': {
                    fontSize: '1rem',
                    fontWeight: 700,
                    my: 0.5,
                },
                '& input[type="checkbox"]': {mr: 0.5},
                '& p': {my: 0.5},
                '& table': {
                    borderCollapse: 'collapse',
                    my: 0.5,
                    width: '100%',
                },
                '& td, & th': {
                    border: '1px solid',
                    borderColor: 'divider',
                    p: 0.75,
                    textAlign: 'left',
                },
                '& thead': {backgroundColor: 'action.hover'},
                '& ul, & ol': {my: 0.5, pl: 2.5},
            }}
        />
    );
}
