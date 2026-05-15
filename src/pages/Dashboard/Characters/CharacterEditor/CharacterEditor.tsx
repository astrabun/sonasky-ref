import React, {useCallback, useEffect, useState} from 'react';
import LinksDialog from './LinksDialog';
import {useNavigate, useParams} from 'react-router';
import Layout from '../../../../layouts/Dashboard';
import {
    Box,
    Button,
    Checkbox,
    Container,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    FormControlLabel,
    IconButton,
    TextField,
    Tooltip,
    Typography,
} from '@mui/material';
import {
    type Character,
    CharacterTypeKeys,
    validateCharacter,
} from '../../../../types/Character';
import {useAuthContext} from '../../../../auth/auth-provider';
import {PDS_COLLECTION_NS} from '../../../../const';
import * as SonaskyRef from '../../../../lexicon/types/app/sonasky/ref';
import {TID} from '@atproto/common-web';
import {ColorPicker, useColor} from 'react-color-palette';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import CloseIcon from '@mui/icons-material/Close';
import {DndProvider, useDrag, useDrop} from 'react-dnd';
import {HTML5Backend} from 'react-dnd-html5-backend';
// @ts-ignore
import 'react-color-palette/css';

interface CharacterEditorProps {
    editMode?: boolean;
}

function CharacterEditor(props: CharacterEditorProps) {
    const {editMode} = props;
    const {pdsAgent} = useAuthContext();
    const navigate = useNavigate();
    const {rkey} = useParams<{rkey: string}>();
    const [character, setCharacter] = useState<Character | undefined>(
        editMode
            ? undefined
            : {
                  altRef: '',
                  colors: [],
                  description: '',
                  doNotDrawWithoutAskingNSFW: false,
                  doNotDrawWithoutAskingSFW: false,
                  drawWithoutAskingNSFW: false,
                  drawWithoutAskingSFW: false,
                  links: [],
                  name: '',
                  nsfw: false,
                  pronouns: '',
                  refSheet: '',
                  species: '',
              },
    );
    const [validationMessage, setValidationMessage] = useState<string>('');
    const [colorDialogOpen, setColorDialogOpen] = useState(false);
    const [linksDialogOpen, setLinksDialogOpen] = useState(false);
    const [color, setColor] = useColor('#000000');
    const [colorLabel, setColorLabel] = useState<string>('');
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [createdAt, setCreatedAt] = useState<string | undefined>();
    const [editingColorIndex, setEditingColorIndex] = useState<
        number | undefined
    >();
    const [refSheetImages, setRefSheetImages] = useState<
        {cid: string; did: string}[]
    >([]);
    const [altRefImages, setAltRefImages] = useState<
        {cid: string; did: string}[]
    >([]);

    const fetchPostImages = useCallback(
        async (atUri: string): Promise<{cid: string; did: string}[]> => {
            try {
                const [, , did, , postRkey] = atUri.split('/');
                const response = await pdsAgent.com.atproto.repo.getRecord({
                    collection: 'app.bsky.feed.post',
                    repo: did,
                    rkey: postRkey,
                });
                const {embed} = response.data.value as any;
                if (embed?.$type === 'app.bsky.embed.images' && embed.images) {
                    return embed.images.map((img: any) => ({
                        cid: img.image.ref.toString(),
                        did,
                    }));
                }
                if (
                    embed?.$type === 'app.bsky.embed.record' &&
                    embed.record?.uri
                ) {
                    // Quote post with no own images - fetch from the quoted post
                    return fetchPostImages(embed.record.uri);
                }
                if (embed?.$type === 'app.bsky.embed.recordWithMedia') {
                    // Quote post that also has its own images
                    const ownImages: {cid: string; did: string}[] =
                        embed.media?.images
                            ? embed.media.images.map((img: any) => ({
                                  cid: img.image.ref.toString(),
                                  did,
                              }))
                            : [];
                    const quotedImages =
                        embed.record?.record?.uri
                            ? await fetchPostImages(embed.record.record.uri)
                            : [];
                    return [...ownImages, ...quotedImages];
                }
            } catch {
                // Post may not be accessible; silently skip preview
            }
            return [];
        },
        [pdsAgent],
    );

    const loadCharacter = useCallback(async () => {
        try {
            const record = await pdsAgent.com.atproto.repo.getRecord({
                collection: PDS_COLLECTION_NS,
                repo: pdsAgent.assertDid,
                rkey: rkey as string,
            });
            const char = (record.data.value as any).character;
            setCharacter(char);
            setCreatedAt((record.data.value as any).createdAt);
            if (char.refSheet?.startsWith('at://')) {
                setRefSheetImages(await fetchPostImages(char.refSheet));
            }
            if (char.altRef?.startsWith('at://')) {
                setAltRefImages(await fetchPostImages(char.altRef));
            }
        } catch (error) {
            console.error('Failed to load character', error);
        }
    }, [pdsAgent, rkey, fetchPostImages]);

    useEffect(() => {
        // LoadCharacter(); // only do this if editMode
        if (editMode) {
            void loadCharacter();
        }
    }, [editMode, loadCharacter]);

    const handleAtProtoRefImage = async (url: string): Promise<string> => {
        try {
            const urlObj = new URL(url);
            const pathParts = urlObj.pathname.split('/');
            if (pathParts.length < 4) {
                return url;
            }

            const [, , handle, , rkey] = pathParts;
            const didResponse =
                await pdsAgent.com.atproto.identity.resolveHandle({handle});
            const {did} = didResponse.data;

            return `at://${did}/app.bsky.feed.post/${rkey}`;
        } catch (error) {
            console.error(
                'Failed to transform Bluesky post URL to at:// URI',
                error,
            );
            return url;
        }
    };

    const handleChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const {name, value, type, checked} = e.target;
        if (name === 'refSheet' || name === 'altRef') {
            const atUri = await handleAtProtoRefImage(value);
            const indexKey =
                name === 'refSheet' ? 'refSheetImageIndex' : 'altRefImageIndex';
            setCharacter((prev) =>
                prev ? {...prev, [name]: atUri, [indexKey]: 0} : undefined,
            );
            if (atUri.startsWith('at://')) {
                const images = await fetchPostImages(atUri);
                if (name === 'refSheet') {
                    setRefSheetImages(images);
                } else {
                    setAltRefImages(images);
                }
            } else {
                if (name === 'refSheet') {
                    setRefSheetImages([]);
                } else {
                    setAltRefImages([]);
                }
            }
            return;
        }
        setCharacter((prev) =>
            prev
                ? {...prev, [name]: type === 'checkbox' ? checked : value}
                : undefined,
        );
    };

    const handleSubmitNew = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!character) {
            return;
        }
        const {status, message} = validateCharacter(character);
        if (!status) {
            setValidationMessage(message);
        } else {
            setValidationMessage('');
            // Prune character to remove any fields not in type
            const prunedChar = {...character};
            const charKeys = Object.keys(character);
            charKeys.forEach((key: string) => {
                if (!CharacterTypeKeys.includes(key)) {
                    delete prunedChar[key as keyof Character];
                }
            });
            try {
                const rkey = TID.nextStr();
                const nowTs = new Date().toISOString();
                const record = {
                    $type: PDS_COLLECTION_NS,
                    character: prunedChar,
                    createdAt: nowTs,
                    modifiedAt: nowTs,
                };
                const extraValidation = SonaskyRef.validateRecord(record);
                if (!extraValidation.success) {
                    console.error(
                        'Failed to validate SonaSky REF record',
                        extraValidation,
                    );
                    setValidationMessage(
                        'Failed to validate SonaSky REF record',
                    );
                    return;
                }
                await pdsAgent.com.atproto.repo.putRecord({
                    collection: PDS_COLLECTION_NS,
                    record,
                    repo: pdsAgent.assertDid,
                    rkey,
                    validate: false,
                });
                void navigate('/dashboard/characters'); // Navigate to the character list
            } catch (error) {
                console.error('Failed to add new SonaSky REF record', error);
            }
        }
    };

    const handleSubmitEdit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!character) {
            return;
        }
        const {status, message} = validateCharacter(character);
        if (!status) {
            setValidationMessage(message);
        } else {
            setValidationMessage('');
            // Prune character to remove any fields not in type
            const prunedChar = {...character};
            const charKeys = Object.keys(character);
            charKeys.forEach((key: string) => {
                if (!CharacterTypeKeys.includes(key)) {
                    delete prunedChar[key as keyof Character];
                }
            });
            try {
                const record = {
                    $type: PDS_COLLECTION_NS,
                    character: prunedChar,
                    createdAt,
                    modifiedAt: new Date().toISOString(),
                };
                const extraValidation = SonaskyRef.validateRecord(record);
                if (!extraValidation.success) {
                    console.error(
                        'Failed to validate SonaSky REF record',
                        extraValidation,
                    );
                    setValidationMessage(
                        'Failed to validate SonaSky REF record',
                    );
                    return;
                }
                await pdsAgent.com.atproto.repo.putRecord({
                    collection: PDS_COLLECTION_NS,
                    record,
                    repo: pdsAgent.assertDid,
                    rkey: rkey as string,
                    validate: false,
                });
                void navigate('/dashboard/characters'); // Navigate to the character list
            } catch (error) {
                console.error('Failed to update SonaSky REF record', error);
            }
        }
    };

    const handleClearColors = () => {
        setCharacter((prev) => (prev ? {...prev, colors: []} : undefined));
    };

    const handleOpenColorDialog = () => {
        setColorLabel('');
        const rgb = {a: 1, b: 0, g: 0, r: 0};
        const hsv = {a: 1, h: 0, s: 0, v: 0};
        setColor({hex: '#000000', hsv, rgb});
        setEditingColorIndex(undefined);
        setColorDialogOpen(true);
    };

    const handleCloseColorDialog = () => {
        setColorLabel('');
        setColorDialogOpen(false);
    };

    const handleEditColor = (index: number) => {
        if (!character) {
            return;
        }
        const colorToEdit = character.colors
            ? character.colors[index]
            : {hex: '#000000', label: ''};
        const rgb = {
            a: 1,
            b: parseInt(colorToEdit.hex.substring(4, 6), 16),
            g: parseInt(colorToEdit.hex.substring(2, 4), 16),
            r: parseInt(colorToEdit.hex.substring(0, 2), 16),
        };

        const hsv = rgbToHsv(rgb.r, rgb.g, rgb.b);

        setColor({
            hex: `#${colorToEdit.hex}`,
            hsv: {
                ...hsv,
                a: 1,
            },
            rgb,
        });

        function rgbToHsv(r: number, g: number, b: number) {
            const rn = r / 255;
            const gn = g / 255;
            const bn = b / 255;
            const max = Math.max(rn, gn, bn);
            const min = Math.min(rn, gn, bn);
            const d = max - min;
            const s = max === 0 ? 0 : d / max;
            const v = max;
            let h = 0;

            if (max !== min) {
                switch (max) {
                    case rn: {
                        h = (gn - bn) / d + (gn < bn ? 6 : 0);
                        break;
                    }
                    case gn: {
                        h = (bn - rn) / d + 2;
                        break;
                    }
                    case bn: {
                        h = (rn - gn) / d + 4;
                        break;
                    }
                }
                h /= 6;
            }

            return {
                h: h * 360,
                s: s * 100,
                v: v * 100,
            };
        }
        setColorLabel(colorToEdit.label);
        setEditingColorIndex(index);
        setColorDialogOpen(true);
    };

    const handleSaveColor = () => {
        if (editingColorIndex !== undefined) {
            setCharacter((prev) => {
                if (!prev) {
                    return prev;
                }
                const updatedColors = [...(prev.colors || [])];
                updatedColors[editingColorIndex] = {
                    hex: color.hex.substring(1),
                    label: colorLabel,
                };
                return {...prev, colors: updatedColors};
            });
        } else {
            setCharacter((prev) => ({
                ...prev,
                colors: prev
                    ? [
                          ...(prev.colors || []),
                          {hex: color.hex.substring(1), label: colorLabel},
                      ]
                    : [{hex: color.hex.substring(1), label: colorLabel}],
            }));
        }
        setColorLabel('');
        setEditingColorIndex(undefined);
        setColorDialogOpen(false);
    };

    const handleOpenDeleteDialog = () => {
        setDeleteDialogOpen(true);
    };

    const handleCloseDeleteDialog = () => {
        setDeleteDialogOpen(false);
    };

    const handleDeleteCharacter = async () => {
        try {
            await pdsAgent.com.atproto.repo.deleteRecord({
                collection: PDS_COLLECTION_NS,
                repo: pdsAgent.assertDid,
                rkey: rkey as string,
            });
            void navigate('/dashboard/characters'); // Navigate to the character list
        } catch (error) {
            console.error('Failed to delete character', error);
        }
    };

    const handleRemoveColor = (index: number) => {
        setCharacter((prev) =>
            prev
                ? {
                      ...prev,
                      colors: prev.colors?.filter((_, i) => i !== index) || [],
                  }
                : undefined,
        );
    };

    const getBlueskyLink = (atUri: string): string => {
        const [, , did, , rkey] = atUri.split('/');
        return `https://bsky.app/profile/${did}/post/${rkey}`;
    };

    const ItemType = 'COLOR';

    const DraggableColorBox = ({
        color,
        index,
        moveColor,
    }: {
        color: any;
        index: number;
        moveColor: (dragIndex: number, hoverIndex: number) => void;
    }) => {
        const ref = React.useRef<HTMLDivElement>(null);
        const [, drop] = useDrop({
            accept: ItemType,
            hover(item: {index: number}) {
                if (!ref.current) {
                    return;
                }
                const dragIndex = item.index;
                const hoverIndex = index;
                if (dragIndex === hoverIndex) {
                    return;
                }
                moveColor(dragIndex, hoverIndex);
                item.index = hoverIndex;
            },
        });

        const [{isDragging}, drag] = useDrag({
            collect: (monitor) => ({
                isDragging: monitor.isDragging(),
            }),
            item: {index},
            type: ItemType,
        });

        drag(drop(ref));

        return (
            <Box
                ref={ref}
                sx={{
                    backgroundColor: `#${color.hex}`,
                    cursor: 'pointer',
                    height: '100px',
                    opacity: isDragging ? 0.5 : 1,
                    position: 'relative',
                    width: '100px',
                }}
                onClick={() => handleEditColor(index)}
            >
                <Tooltip title={`${color.label} (#${color.hex})`}>
                    <Box sx={{height: '100%', width: '100%'}} />
                </Tooltip>
                <IconButton
                    size="small"
                    sx={{position: 'absolute', right: 0, top: 0}}
                    onClick={(e) => {
                        e.stopPropagation();
                        handleRemoveColor(index);
                    }}
                >
                    <CloseIcon fontSize="small" />
                </IconButton>
            </Box>
        );
    };

    const moveColor = (dragIndex: number, hoverIndex: number) => {
        setCharacter((prev) => {
            if (!prev) {
                return prev;
            }
            const updatedColors = [...(prev.colors || [])];
            const [draggedColor] = updatedColors.splice(dragIndex, 1);
            updatedColors.splice(hoverIndex, 0, draggedColor);
            return {...prev, colors: updatedColors};
        });
    };

    if (!character) {
        return (
            <Layout>
                <Container>
                    <Typography
                        variant="h4"
                        gutterBottom
                    >
                        {editMode ? 'Edit' : 'Create'} Character
                    </Typography>
                    <Typography variant="body1">
                        {editMode
                            ? 'Loading character data...'
                            : 'Loading form...'}
                    </Typography>
                </Container>
            </Layout>
        );
    }

    return (
        <Layout>
            <DndProvider backend={HTML5Backend}>
                <Container>
                    <Typography
                        variant="h4"
                        gutterBottom
                    >
                        {editMode ? 'Edit' : 'Create'} Character
                    </Typography>
                    <Box
                        component="form"
                        onSubmit={editMode ? handleSubmitEdit : handleSubmitNew}
                        sx={{
                            '& > *': {
                                width: '100%',
                            },
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '16px',
                        }}
                    >
                        <TextField
                            label="Name"
                            name="name"
                            value={character.name}
                            onChange={handleChange}
                            required
                            margin="normal"
                            inputProps={{maxLength: 256}}
                        />
                        <TextField
                            label="Species"
                            name="species"
                            value={character.species}
                            onChange={handleChange}
                            margin="normal"
                            inputProps={{maxLength: 64}}
                        />
                        <TextField
                            label="Pronouns"
                            name="pronouns"
                            value={character.pronouns}
                            onChange={handleChange}
                            margin="normal"
                            inputProps={{maxLength: 32}}
                        />
                        <Box>
                            <Box sx={{alignItems: 'center', display: 'flex'}}>
                                <TextField
                                    label="Ref Sheet Post on Bluesky (URL)"
                                    name="refSheet"
                                    value={character.refSheet}
                                    onChange={handleChange}
                                    margin="normal"
                                    fullWidth
                                />
                                {character.refSheet?.startsWith('at://') && (
                                    <IconButton
                                        component="a"
                                        href={getBlueskyLink(
                                            character.refSheet,
                                        )}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        sx={{marginLeft: 1}}
                                    >
                                        <OpenInNewIcon />
                                    </IconButton>
                                )}
                            </Box>
                            {refSheetImages.length > 0 && (
                                <Box
                                    sx={{
                                        display: 'flex',
                                        flexWrap: 'wrap',
                                        gap: '8px',
                                        mt: 1,
                                    }}
                                >
                                    {refSheetImages.map(({cid, did}, index) => {
                                        const isSelected =
                                            (character.refSheetImageIndex ??
                                                0) === index;
                                        return (
                                            <Box
                                                key={`${did}/${cid}`}
                                                sx={{
                                                    border: '3px solid',
                                                    borderColor: isSelected
                                                        ? 'primary.main'
                                                        : 'transparent',
                                                    borderRadius: '4px',
                                                    cursor: 'pointer',
                                                    height: '80px',
                                                    overflow: 'hidden',
                                                    width: '80px',
                                                }}
                                                onClick={() =>
                                                    setCharacter((prev) =>
                                                        prev
                                                            ? {
                                                                  ...prev,
                                                                  refSheetImageIndex:
                                                                      index,
                                                              }
                                                            : undefined,
                                                    )
                                                }
                                            >
                                                <img
                                                    src={`https://cdn.bsky.app/img/feed_thumbnail/plain/${did}/${cid}@jpeg`}
                                                    alt={`Image ${index + 1}`}
                                                    style={{
                                                        height: '100%',
                                                        objectFit: 'cover',
                                                        width: '100%',
                                                    }}
                                                />
                                            </Box>
                                        );
                                    })}
                                </Box>
                            )}
                            <TextField
                                label="Reference Credit (optional)"
                                name="refSheetCredit"
                                value={character.refSheetCredit ?? ''}
                                onChange={handleChange}
                                margin="normal"
                                fullWidth
                                slotProps={{htmlInput: {maxLength: 256}}}
                            />
                        </Box>
                        <Box>
                            <Box sx={{alignItems: 'center', display: 'flex'}}>
                                <TextField
                                    label="Alt Ref Post on Bluesky (URL)"
                                    name="altRef"
                                    value={character.altRef}
                                    onChange={handleChange}
                                    margin="normal"
                                    fullWidth
                                />
                                {character.altRef?.startsWith('at://') && (
                                    <IconButton
                                        component="a"
                                        href={getBlueskyLink(character.altRef)}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        sx={{marginLeft: 1}}
                                    >
                                        <OpenInNewIcon />
                                    </IconButton>
                                )}
                            </Box>
                            {altRefImages.length > 0 && (
                                <Box
                                    sx={{
                                        display: 'flex',
                                        flexWrap: 'wrap',
                                        gap: '8px',
                                        mt: 1,
                                    }}
                                >
                                    {altRefImages.map(({cid, did}, index) => {
                                        const isSelected =
                                            (character.altRefImageIndex ??
                                                0) === index;
                                        return (
                                            <Box
                                                key={`${did}/${cid}`}
                                                sx={{
                                                    border: '3px solid',
                                                    borderColor: isSelected
                                                        ? 'primary.main'
                                                        : 'transparent',
                                                    borderRadius: '4px',
                                                    cursor: 'pointer',
                                                    height: '80px',
                                                    overflow: 'hidden',
                                                    width: '80px',
                                                }}
                                                onClick={() =>
                                                    setCharacter((prev) =>
                                                        prev
                                                            ? {
                                                                  ...prev,
                                                                  altRefImageIndex:
                                                                      index,
                                                              }
                                                            : undefined,
                                                    )
                                                }
                                            >
                                                <img
                                                    src={`https://cdn.bsky.app/img/feed_thumbnail/plain/${did}/${cid}@jpeg`}
                                                    alt={`Image ${index + 1}`}
                                                    style={{
                                                        height: '100%',
                                                        objectFit: 'cover',
                                                        width: '100%',
                                                    }}
                                                />
                                            </Box>
                                        );
                                    })}
                                </Box>
                            )}
                            <TextField
                                label="Reference Credit (optional)"
                                name="altRefCredit"
                                value={character.altRefCredit ?? ''}
                                onChange={handleChange}
                                margin="normal"
                                fullWidth
                                slotProps={{htmlInput: {maxLength: 256}}}
                            />
                        </Box>
                        <Box
                            sx={{display: 'flex', flexWrap: 'wrap', gap: '8px'}}
                        >
                            {character.colors?.map((color, index) => (
                                <DraggableColorBox
                                    key={index}
                                    color={color}
                                    index={index}
                                    moveColor={moveColor}
                                />
                            ))}
                        </Box>
                        <Box
                            sx={{display: 'flex', flexWrap: 'wrap', gap: '8px'}}
                        >
                            <Button
                                variant="contained"
                                color="primary"
                                onClick={handleOpenColorDialog}
                            >
                                Add Color
                            </Button>
                            {character.colors &&
                                character.colors.length > 0 && (
                                    <Button
                                        variant="contained"
                                        color="secondary"
                                        onClick={handleClearColors}
                                    >
                                        Clear Colors
                                    </Button>
                                )}
                        </Box>
                        <Box>
                            <Button
                                variant="contained"
                                color="primary"
                                onClick={() => setLinksDialogOpen(true)}
                            >
                                Manage Links
                            </Button>
                        </Box>
                        <Box>
                            <Typography variant="body2" sx={{fontWeight: 500, mb: 0.5}}>Drawing Permissions</Typography>
                            <Box sx={{alignItems: 'center', display: 'grid', gap: 0, gridTemplateColumns: 'auto 1fr 1fr'}}>
                                <Box />
                                <Typography variant="caption" align="center" sx={{fontWeight: 600}}>SFW</Typography>
                                <Typography variant="caption" align="center" sx={{fontWeight: 600}}>NSFW</Typography>
                                <Typography variant="body2">Draw Without Asking</Typography>
                                <Box sx={{display: 'flex', justifyContent: 'center'}}>
                                    <Checkbox
                                        checked={Boolean(character.drawWithoutAskingSFW)}
                                        onChange={handleChange}
                                        name="drawWithoutAskingSFW"
                                        disabled={Boolean(character.doNotDrawWithoutAskingSFW)}
                                        size="small"
                                    />
                                </Box>
                                <Box sx={{display: 'flex', justifyContent: 'center'}}>
                                    <Checkbox
                                        checked={Boolean(character.drawWithoutAskingNSFW)}
                                        onChange={handleChange}
                                        name="drawWithoutAskingNSFW"
                                        disabled={Boolean(character.doNotDrawWithoutAskingNSFW)}
                                        size="small"
                                    />
                                </Box>
                                <Typography variant="body2">Do Not Draw Without Asking</Typography>
                                <Box sx={{display: 'flex', justifyContent: 'center'}}>
                                    <Checkbox
                                        checked={Boolean(character.doNotDrawWithoutAskingSFW)}
                                        onChange={handleChange}
                                        name="doNotDrawWithoutAskingSFW"
                                        disabled={Boolean(character.drawWithoutAskingSFW)}
                                        size="small"
                                    />
                                </Box>
                                <Box sx={{display: 'flex', justifyContent: 'center'}}>
                                    <Checkbox
                                        checked={Boolean(character.doNotDrawWithoutAskingNSFW)}
                                        onChange={handleChange}
                                        name="doNotDrawWithoutAskingNSFW"
                                        disabled={Boolean(character.drawWithoutAskingNSFW)}
                                        size="small"
                                    />
                                </Box>
                            </Box>
                        </Box>
                        <FormControlLabel
                            control={
                                <Checkbox
                                    checked={character.nsfw}
                                    onChange={handleChange}
                                    name="nsfw"
                                />
                            }
                            label="NSFW"
                        />
                        <TextField
                            label="Description"
                            name="description"
                            value={character.description}
                            onChange={handleChange}
                            margin="normal"
                            multiline
                            rows={4}
                            inputProps={{maxLength: 2560}}
                        />
                        <Button
                            type="submit"
                            variant="contained"
                            color="primary"
                        >
                            {editMode ? 'Save Changes' : 'Create Character'}
                        </Button>
                        {editMode && (
                            <>
                                <Button
                                    variant="contained"
                                    color="error"
                                    onClick={handleOpenDeleteDialog}
                                >
                                    Delete Character
                                </Button>
                            </>
                        )}
                        {validationMessage && (
                            <Typography
                                variant="body2"
                                color="error"
                            >
                                {validationMessage}
                            </Typography>
                        )}
                    </Box>
                    <LinksDialog
                        open={linksDialogOpen}
                        onClose={() => setLinksDialogOpen(false)}
                        links={character.links ?? []}
                        onLinksChange={(links) =>
                            setCharacter((prev) =>
                                prev ? {...prev, links} : undefined,
                            )
                        }
                    />
                    <Dialog
                        open={colorDialogOpen}
                        onClose={handleCloseColorDialog}
                    >
                        <DialogTitle>
                            {editingColorIndex !== null
                                ? 'Edit Color'
                                : 'Add Color'}
                        </DialogTitle>
                        <DialogContent>
                            <ColorPicker
                                hideAlpha
                                hideInput={['rgb', 'hsv']}
                                color={color}
                                onChange={setColor}
                            />
                            <TextField
                                label="Color Label"
                                value={colorLabel}
                                onChange={(e) => setColorLabel(e.target.value)}
                                fullWidth
                                margin="normal"
                                inputProps={{maxLength: 64}}
                            />
                        </DialogContent>
                        <DialogActions>
                            <Button
                                onClick={handleCloseColorDialog}
                                color="primary"
                            >
                                Cancel
                            </Button>
                            <Button
                                onClick={handleSaveColor}
                                color="primary"
                            >
                                {editingColorIndex !== null ? 'Save' : 'Add'}
                            </Button>
                        </DialogActions>
                    </Dialog>
                    <Dialog
                        open={deleteDialogOpen}
                        onClose={handleCloseDeleteDialog}
                    >
                        <DialogTitle>Confirm Deletion</DialogTitle>
                        <DialogContent>
                            <Typography>
                                This action is permanent and cannot be undone.
                                Are you sure you want to delete this character?
                            </Typography>
                        </DialogContent>
                        <DialogActions>
                            <Button
                                onClick={handleCloseDeleteDialog}
                                color="primary"
                            >
                                Cancel
                            </Button>
                            <Button
                                onClick={handleDeleteCharacter}
                                color="error"
                            >
                                Delete
                            </Button>
                        </DialogActions>
                    </Dialog>
                </Container>
            </DndProvider>
        </Layout>
    );
}

export default CharacterEditor;
