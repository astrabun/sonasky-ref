import React, {useCallback, useEffect, useState} from 'react';
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
                  drawWithoutAskingNSFW: false,
                  drawWithoutAskingSFW: false,
                  name: '',
                  nsfw: false,
                  pronouns: '',
                  refSheet: '',
                  species: '',
              },
    );
    const [validationMessage, setValidationMessage] = useState<string>('');
    const [colorDialogOpen, setColorDialogOpen] = useState(false);
    const [color, setColor] = useColor('#000000');
    const [colorLabel, setColorLabel] = useState<string>('');
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [createdAt, setCreatedAt] = useState<string | undefined>();
    const [editingColorIndex, setEditingColorIndex] = useState<
        number | undefined
    >();

    const loadCharacter = useCallback(async () => {
        try {
            const record = await pdsAgent.com.atproto.repo.getRecord({
                collection: PDS_COLLECTION_NS,
                repo: pdsAgent.assertDid,
                rkey: rkey as string,
            });
            setCharacter((record.data.value as any).character);
            setCreatedAt((record.data.value as any).createdAt);
        } catch (error) {
            console.error('Failed to load character', error);
        }
    }, [pdsAgent, rkey]);

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
            setCharacter((prev) =>
                prev ? {...prev, [name]: atUri} : undefined,
            );
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
                                href={getBlueskyLink(character.refSheet)}
                                target="_blank"
                                rel="noopener noreferrer"
                                sx={{marginLeft: 1}}
                            >
                                <OpenInNewIcon />
                            </IconButton>
                        )}
                    </Box>
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
                    <DndProvider backend={HTML5Backend}>
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
                    </DndProvider>
                    <Box sx={{display: 'flex', flexWrap: 'wrap', gap: '8px'}}>
                        <Button
                            variant="contained"
                            color="primary"
                            onClick={handleOpenColorDialog}
                        >
                            Add Color
                        </Button>
                        {character.colors && character.colors.length > 0 && (
                            <Button
                                variant="contained"
                                color="secondary"
                                onClick={handleClearColors}
                            >
                                Clear Colors
                            </Button>
                        )}
                    </Box>
                    <FormControlLabel
                        control={
                            <Checkbox
                                checked={character.drawWithoutAskingSFW}
                                onChange={handleChange}
                                name="drawWithoutAskingSFW"
                            />
                        }
                        label="Draw Without Asking (SFW)"
                    />
                    <FormControlLabel
                        control={
                            <Checkbox
                                checked={character.drawWithoutAskingNSFW}
                                onChange={handleChange}
                                name="drawWithoutAskingNSFW"
                            />
                        }
                        label="Draw Without Asking (NSFW)"
                    />
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
                            This action is permanent and cannot be undone. Are
                            you sure you want to delete this character?
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
        </Layout>
    );
}

export default CharacterEditor;
