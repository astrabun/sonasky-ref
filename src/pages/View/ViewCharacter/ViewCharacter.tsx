import {useCallback, useEffect, useState} from 'react';
import {useNavigate, useParams} from 'react-router';
import Layout from '../../../layouts/View';
import {
    Box,
    Button,
    Chip,
    Collapse,
    Container,
    Fade,
    FormControlLabel,
    Grid,
    Menu,
    MenuItem,
    Paper,
    Switch,
    Tooltip,
    Typography,
    emphasize,
    styled,
} from '@mui/material';
import {Client, CredentialManager} from '@atcute/client';
import type {} from '@atcute/atproto';
import type {ActorIdentifier} from '@atcute/lexicons';
import {HANDLE_RESOLVER_URL} from '../../../const';
import {
    type CharacterLink,
    LINK_TYPE_LABELS,
    validateCharacterLink,
} from '../../../types/characterLinks';
import NotFound from '../../NotFound';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import {
    exportAco,
    exportCss,
    exportGpl,
    exportKpl,
    exportTxt,
} from '../../../helpers/colorExport';
import {getPds} from '../../../helpers/getPds';

const Item = styled(Paper)(({theme}) => ({
    ...theme.typography.body2,
    color: (theme.vars ?? theme).palette.text.secondary,
    padding: theme.spacing(1),
    textAlign: 'center',
    ...theme.applyStyles('dark', {}),
}));

export function ViewCharacter() {
    const manager = new CredentialManager({service: HANDLE_RESOLVER_URL});
    const [rpc, setRpc] = useState<Client>(new Client({handler: manager}));
    const {blueskyHandleOrDID, rkey} = useParams<{
        blueskyHandleOrDID: string;
        rkey: string;
    }>();
    const navigate = useNavigate();
    const [character, setCharacter] = useState<any>();
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<boolean>(false);
    const [loadingText, setLoadingText] = useState<string>('Loading.');
    const transitionTime = 2000;
    const [refSheetImage, setRefSheetImage] = useState<string>('');
    const [altText, setAltText] = useState<string>('Ref Sheet');
    const [altRefSheetImage, setAltRefSheetImage] = useState<string>('');
    const [altAltText, setAltAltText] = useState<string>('Alt Ref Sheet');
    const [showAltRef, setShowAltRef] = useState<boolean>(false);

    const [copyColorClicked, setCopyColorClicked] = useState<boolean>(false);
    const [exportMenuAnchor, setExportMenuAnchor] = useState<
        HTMLElement | undefined
    >(undefined);
    const [nsfwBlurred, setNsfwBlurred] = useState<boolean>(false);
    const [nsfwFadingOut, setNsfwFadingOut] = useState<boolean>(false);

    const handleGetPds = async () => {
        if (blueskyHandleOrDID) {
            const pds = await getPds(blueskyHandleOrDID);
            if (HANDLE_RESOLVER_URL !== pds && pds) {
                const newRpc = new Client({
                    handler: new CredentialManager({service: pds}),
                });
                setRpc(newRpc);
            }
        }
    };

    useEffect(() => {
        void handleGetPds();
    }, [blueskyHandleOrDID]);

    const resolvePostImages = useCallback(
        async (
            atUri: string,
        ): Promise<{cid: string; did: string; alt: string}[]> => {
            const [, , did, , postRkey] = atUri.split('/');
            const {data} = await rpc.get('com.atproto.repo.getRecord', {
                params: {
                    collection: 'app.bsky.feed.post',
                    repo: did as ActorIdentifier,
                    rkey: postRkey,
                },
            });
            const {value} = data as any;
            const {embed} = value;
            if (embed?.$type === 'app.bsky.embed.images' && embed.images) {
                return embed.images.map((img: any) => ({
                    alt: img.alt ?? '',
                    cid: img.image.ref.$link,
                    did,
                }));
            }
            if (embed?.$type === 'app.bsky.embed.record' && embed.record?.uri) {
                return resolvePostImages(embed.record.uri);
            }
            if (embed?.$type === 'app.bsky.embed.recordWithMedia') {
                const ownImages: {alt: string; cid: string; did: string}[] =
                    embed.media?.images
                        ? embed.media.images.map((img: any) => ({
                              alt: img.alt ?? '',
                              cid: img.image.ref.$link,
                              did,
                          }))
                        : [];
                const quotedImages = embed.record?.record?.uri
                    ? await resolvePostImages(embed.record.record.uri)
                    : [];
                return [...ownImages, ...quotedImages];
            }
            return [];
        },
        [rpc],
    );

    const loadCharacter = useCallback(async () => {
        try {
            const sonaRecords = await rpc.get('com.atproto.repo.listRecords', {
                params: {
                    collection: 'app.sonasky.ref',
                    repo: (blueskyHandleOrDID ?? '') as ActorIdentifier,
                },
            });
            const record = (sonaRecords.data as any).records.find(
                (rec: any) => rec.uri.split('/').pop() === rkey,
            );
            if (record) {
                setCharacter((record.value as any).character);
            } else {
                setError(true);
            }
        } catch (error) {
            console.error('Failed to load character', error);
            setError(true);
        } finally {
            setLoading(false);
        }
    }, [blueskyHandleOrDID, rkey, rpc]);

    useEffect(() => {
        void loadCharacter();
    }, [loadCharacter]);

    useEffect(() => {
        if (!character) {
            return;
        }

        const loadImages = async () => {
            if (character.refSheet?.startsWith('at://')) {
                try {
                    const images = await resolvePostImages(character.refSheet);
                    const imageIndex = character.refSheetImageIndex ?? 0;
                    const img = images[imageIndex] ?? images[0];
                    if (img) {
                        setAltText(
                            images[imageIndex]?.alt ||
                                images[0]?.alt ||
                                'Ref Sheet',
                        );
                        setRefSheetImage(
                            `https://cdn.bsky.app/img/feed_fullsize/plain/${img.did}/${img.cid}@jpeg`,
                        );
                    }
                } catch {
                    // Silently skip if post is inaccessible
                }
            }
            if (character.altRef?.startsWith('at://')) {
                try {
                    const images = await resolvePostImages(character.altRef);
                    const imageIndex = character.altRefImageIndex ?? 0;
                    const img = images[imageIndex] ?? images[0];
                    if (img) {
                        setAltAltText(
                            images[imageIndex]?.alt ||
                                images[0]?.alt ||
                                'Alt Ref Sheet',
                        );
                        setAltRefSheetImage(
                            `https://cdn.bsky.app/img/feed_fullsize/plain/${img.did}/${img.cid}@jpeg`,
                        );
                    }
                } catch {
                    // Silently skip if post is inaccessible
                }
            }
            setError(false);
        };

        void loadImages();
    }, [character, resolvePostImages]);

    useEffect(() => {
        if (!character?.nsfw) {
            return;
        }
        const key = `nsfw-confirm:${globalThis.location.pathname}`;
        const stored = localStorage.getItem(key);
        if (stored) {
            const ts = parseInt(stored, 10);
            if (Date.now() - ts < 30 * 24 * 60 * 60 * 1000) {
                return;
            }
        }
        setNsfwBlurred(true);
    }, [character]);

    const handleNsfwConfirm = () => {
        localStorage.setItem(
            `nsfw-confirm:${globalThis.location.pathname}`,
            Date.now().toString(),
        );
        setNsfwFadingOut(true);
    };

    const handleNsfwGoBack = () => {
        if (globalThis.history.length > 1) {
            void navigate(-1);
        } else {
            void navigate('/');
        }
    };

    useEffect(() => {
        if (loading) {
            const interval = setInterval(() => {
                setLoadingText((prev) => {
                    if (prev === 'Loading...') {
                        return 'Loading.';
                    }
                    if (prev === 'Loading..') {
                        return 'Loading...';
                    }
                    return 'Loading..';
                });
            }, 1000);
            return () => clearInterval(interval);
        }
    }, [loading]);

    if (loading) {
        return (
            <Layout>
                <div style={{marginTop: '2rem'}} />
                <Container maxWidth="lg">
                    <Collapse
                        in={loading}
                        timeout={{enter: 0, exit: transitionTime}}
                    >
                        <Typography
                            variant="body1"
                            gutterBottom
                        >
                            {loadingText}
                        </Typography>
                    </Collapse>
                </Container>
            </Layout>
        );
    }

    if (error || !character) {
        return <NotFound />;
    }

    const getBlueskyLink = (atUri: string): string => {
        const [, , did, , rkey] = atUri.split('/');
        return `https://bsky.app/profile/${did}/post/${rkey}`;
    };

    const validLinks = (character.links ?? []).filter(validateCharacterLink);

    return (
        <Layout>
            <div style={{marginTop: '2rem'}} />
            <Container maxWidth="lg">
                <Button
                    startIcon={<ArrowBackIcon />}
                    onClick={() => navigate(`/profile/${blueskyHandleOrDID}`)}
                    sx={{marginBottom: '1rem'}}
                >
                    Back
                </Button>
                <Button
                    startIcon={<OpenInNewIcon />}
                    component="a"
                    href={`https://bsky.app/profile/${blueskyHandleOrDID}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    sx={{marginBottom: '1rem', marginLeft: '1rem'}}
                >
                    View Bluesky Profile
                </Button>
                <Fade
                    in={!loading}
                    timeout={transitionTime}
                >
                    <div>
                        <Box
                            sx={{
                                alignItems: 'center',
                                display: 'flex',
                                flexDirection: 'column',
                            }}
                        >
                            <Typography variant="h3">
                                {character.name}
                            </Typography>
                            <Typography variant="h5">
                                Species: {character.species}
                            </Typography>
                            {character.pronouns && (
                                <Typography variant="h6">
                                    {character.pronouns}
                                </Typography>
                            )}
                            <Box
                                sx={{
                                    display: 'flex',
                                    flexDirection: 'row',
                                    flexWrap: 'wrap',
                                    gap: '0.5rem',
                                    justifyContent: 'center',
                                }}
                            >
                                {/* If nsfw is okay, display chip */}
                                {character.nsfw && (
                                    <Chip
                                        color="warning"
                                        label="NSFW"
                                    />
                                )}
                                {/* If draw without asking, display chip */}
                                {character.drawWithoutAskingSFW && (
                                    <Chip
                                        color="info"
                                        label="OK to draw SFW without asking"
                                    />
                                )}
                                {character.doNotDrawWithoutAskingSFW && (
                                    <Chip
                                        color="default"
                                        label="Please ask before drawing SFW"
                                    />
                                )}
                                {character.drawWithoutAskingNSFW && (
                                    <Chip
                                        color="error"
                                        label="OK to draw NSFW without asking"
                                    />
                                )}
                                {character.doNotDrawWithoutAskingNSFW && (
                                    <Chip
                                        color="default"
                                        label="Please ask before drawing NSFW"
                                    />
                                )}
                            </Box>
                        </Box>
                        {character.description && (
                            <>
                                {character.description
                                    .split('\n')
                                    .map((line: string, index: number) => (
                                        <Typography
                                            key={index}
                                            variant="body1"
                                        >
                                            {line}
                                        </Typography>
                                    ))}
                            </>
                        )}
                        {/* Colors Grid */}
                        <Box sx={{marginBottom: '1rem', marginTop: '1rem'}}>
                            <Grid
                                container
                                rowSpacing={1}
                                columnSpacing={1}
                                justifyContent="center"
                            >
                                {character.colors.map(
                                    (color: any, idx: any) => {
                                        const defaultChipLabel = `Click to copy ${color.label} (#${color.hex})`;
                                        const handleCopyClick = () => {
                                            setCopyColorClicked(true);
                                        };
                                        const handleMouseLeave = () => {
                                            setCopyColorClicked(false);
                                        };
                                        return (
                                            <Grid
                                                size={{md: 2, sm: 4, xs: 6}}
                                                key={`color-${idx}`}
                                            >
                                                <Item sx={{height: '100%'}}>
                                                    <Tooltip
                                                        title={
                                                            copyColorClicked
                                                                ? 'Copied!'
                                                                : defaultChipLabel
                                                        }
                                                    >
                                                        <Button
                                                            fullWidth
                                                            id={color.hex}
                                                            component={Paper}
                                                            sx={{
                                                                backgroundColor: `#${color.hex}`,
                                                                color: `${emphasize(`#${color.hex}`, 1)}`,
                                                                height: '100%',
                                                                justifyContent:
                                                                    'flex-start',
                                                                padding: '1em',
                                                                textAlign:
                                                                    'left',
                                                            }}
                                                            onClick={() => {
                                                                void navigator.clipboard.writeText(
                                                                    `#${color.hex}`,
                                                                );
                                                                handleCopyClick();
                                                            }}
                                                            onMouseLeave={
                                                                handleMouseLeave
                                                            }
                                                        >
                                                            <Box
                                                                sx={{
                                                                    display:
                                                                        'flex',
                                                                    flexDirection:
                                                                        'column',
                                                                }}
                                                            >
                                                                <Typography>
                                                                    {
                                                                        color.label
                                                                    }
                                                                </Typography>
                                                                <Typography>
                                                                    #{color.hex}
                                                                </Typography>
                                                            </Box>
                                                        </Button>
                                                    </Tooltip>
                                                </Item>
                                            </Grid>
                                        );
                                    },
                                )}
                            </Grid>
                            {character.colors?.length > 0 && (
                                <Box
                                    sx={{
                                        display: 'flex',
                                        justifyContent: 'center',
                                        marginTop: '0.75rem',
                                    }}
                                >
                                    <Button
                                        variant="outlined"
                                        endIcon={<KeyboardArrowDownIcon />}
                                        onClick={(e) =>
                                            setExportMenuAnchor(e.currentTarget)
                                        }
                                    >
                                        Export Colors
                                    </Button>
                                    <Menu
                                        anchorEl={exportMenuAnchor}
                                        open={Boolean(exportMenuAnchor)}
                                        onClose={() =>
                                            setExportMenuAnchor(undefined)
                                        }
                                    >
                                        <MenuItem
                                            onClick={() => {
                                                exportGpl(
                                                    character.colors,
                                                    character.name,
                                                );
                                                setExportMenuAnchor(undefined);
                                            }}
                                        >
                                            GIMP Palette (.gpl)
                                        </MenuItem>
                                        <MenuItem
                                            onClick={() => {
                                                exportKpl(
                                                    character.colors,
                                                    character.name,
                                                );
                                                setExportMenuAnchor(undefined);
                                            }}
                                        >
                                            Krita Palette (.kpl)
                                        </MenuItem>
                                        <MenuItem
                                            onClick={() => {
                                                exportCss(
                                                    character.colors,
                                                    character.name,
                                                );
                                                setExportMenuAnchor(undefined);
                                            }}
                                        >
                                            CSS Variables (.css)
                                        </MenuItem>
                                        <MenuItem
                                            onClick={() => {
                                                exportAco(
                                                    character.colors,
                                                    character.name,
                                                );
                                                setExportMenuAnchor(undefined);
                                            }}
                                        >
                                            Adobe Color (and CSP) (.aco)
                                        </MenuItem>
                                        <MenuItem
                                            onClick={() => {
                                                exportTxt(
                                                    character.colors,
                                                    character.name,
                                                );
                                                setExportMenuAnchor(undefined);
                                            }}
                                        >
                                            Plain Text (.txt)
                                        </MenuItem>
                                    </Menu>
                                </Box>
                            )}
                        </Box>
                        {/* Links */}
                        {validLinks.length > 0 && (
                            <Box
                                sx={{
                                    display: 'flex',
                                    flexWrap: 'wrap',
                                    gap: '0.5rem',
                                    marginBottom: '1rem',
                                    marginTop: '1rem',
                                }}
                            >
                                {validLinks.map(
                                    (link: CharacterLink, idx: number) => (
                                        <Button
                                            key={idx}
                                            variant="outlined"
                                            size="small"
                                            component="a"
                                            href={link.url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            startIcon={<OpenInNewIcon />}
                                        >
                                            {link.label ||
                                                LINK_TYPE_LABELS[link.type]}
                                        </Button>
                                    ),
                                )}
                            </Box>
                        )}
                        {/* Ref Sheet */}
                        {character.altRef && (
                            <FormControlLabel
                                control={
                                    <Switch
                                        checked={showAltRef}
                                        onChange={() =>
                                            setShowAltRef(!showAltRef)
                                        }
                                        name="showAltRef"
                                    />
                                }
                                label="Toggle Alt Ref"
                            />
                        )}
                        {!showAltRef && refSheetImage && (
                            <Box sx={{marginBottom: '1rem'}}>
                                <Typography variant="h5">Ref Sheet</Typography>
                                <img
                                    src={`${refSheetImage}`}
                                    alt={altText}
                                    style={{
                                        cursor: 'pointer',
                                        maxWidth: '100%',
                                    }}
                                    onClick={() =>
                                        window.open(
                                            getBlueskyLink(character.refSheet),
                                            '_blank',
                                        )
                                    }
                                />
                                {character.refSheetCredit && (
                                    <Typography variant="caption">
                                        Credit: {character.refSheetCredit}
                                    </Typography>
                                )}
                            </Box>
                        )}
                        {showAltRef && altRefSheetImage && (
                            <Box sx={{marginBottom: '1rem'}}>
                                <Typography variant="h5">
                                    Alt Ref Sheet
                                </Typography>
                                <img
                                    src={`${altRefSheetImage}`}
                                    alt={altAltText}
                                    style={{
                                        cursor: 'pointer',
                                        maxWidth: '100%',
                                    }}
                                    onClick={() =>
                                        window.open(
                                            getBlueskyLink(character.altRef),
                                            '_blank',
                                        )
                                    }
                                />
                                {character.altRefCredit && (
                                    <Typography variant="caption">
                                        Credit: {character.altRefCredit}
                                    </Typography>
                                )}
                            </Box>
                        )}
                    </div>
                </Fade>
            </Container>
            {nsfwBlurred && (
                <Box
                    onTransitionEnd={() => {
                        if (nsfwFadingOut) {
                            setNsfwBlurred(false);
                        }
                    }}
                    sx={{
                        alignItems: 'center',
                        backdropFilter: 'blur(50px)',
                        backgroundColor: 'rgba(0,0,0,0.6)',
                        bottom: 0,
                        display: 'flex',
                        justifyContent: 'center',
                        left: 0,
                        opacity: nsfwFadingOut ? 0 : 1,
                        position: 'fixed',
                        right: 0,
                        top: 0,
                        transition: 'opacity 0.6s ease',
                        zIndex: 9999,
                    }}
                >
                    <Paper
                        elevation={6}
                        sx={{
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 2,
                            maxWidth: 420,
                            mx: 2,
                            p: 4,
                            textAlign: 'center',
                        }}
                    >
                        <Typography variant="h5">NSFW Content</Typography>
                        <Typography variant="body1">
                            This character is marked as NSFW. You must be 18
                            years of age or older to view this content.
                        </Typography>
                        <Box
                            sx={{
                                display: 'flex',
                                gap: 2,
                                justifyContent: 'center',
                            }}
                        >
                            <Button
                                variant="contained"
                                color="primary"
                                onClick={handleNsfwConfirm}
                            >
                                I'm 18+ | Continue
                            </Button>
                            <Button
                                variant="outlined"
                                onClick={handleNsfwGoBack}
                            >
                                Go Back
                            </Button>
                        </Box>
                    </Paper>
                </Box>
            )}
        </Layout>
    );
}
