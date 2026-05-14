import {useRef, useState} from 'react';
import {
    Box,
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    FormControl,
    FormHelperText,
    IconButton,
    InputLabel,
    MenuItem,
    Select,
    TextField,
    Typography,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import DragHandleIcon from '@mui/icons-material/DragHandle';
import EditIcon from '@mui/icons-material/Edit';
import {useDrag, useDrop} from 'react-dnd';
import {
    ALLOWED_LINK_TYPES,
    type CharacterLink,
    type CharacterLinkType,
    LINK_TYPE_HINTS,
    LINK_TYPE_LABELS,
    validateCharacterLink,
} from '../../../../types/characterLinks';

const LINK_ITEM_TYPE = 'LINK';

interface DraggableLinkItemProps {
    link: CharacterLink;
    index: number;
    moveLink: (from: number, to: number) => void;
    isEditing: boolean;
    editType: CharacterLinkType | '';
    typeError: string;
    editUrl: string;
    urlError: string;
    onStartEdit: (index: number) => void;
    onDelete: (index: number) => void;
    onSaveEdit: () => void;
    onCancelEdit: () => void;
    onEditTypeChange: (type: CharacterLinkType | '') => void;
    onEditUrlChange: (url: string) => void;
    editLabel: string;
    onEditLabelChange: (label: string) => void;
}

function DraggableLinkItem({
    link,
    index,
    moveLink,
    isEditing,
    editType,
    typeError,
    editUrl,
    urlError,
    onStartEdit,
    onDelete,
    onSaveEdit,
    onCancelEdit,
    onEditTypeChange,
    onEditUrlChange,
    editLabel,
    onEditLabelChange,
}: DraggableLinkItemProps) {
    const rowRef = useRef<HTMLDivElement>(null);
    const handleRef = useRef<HTMLDivElement>(null);

    const [{isDragging}, drag, dragPreview] = useDrag({
        collect: (monitor) => ({isDragging: monitor.isDragging()}),
        item: {index},
        type: LINK_ITEM_TYPE,
    });

    const [, drop] = useDrop({
        accept: LINK_ITEM_TYPE,
        hover(item: {index: number}) {
            if (!rowRef.current) {
                return;
            }
            if (item.index === index) {
                return;
            }
            moveLink(item.index, index);
            item.index = index;
        },
    });

    dragPreview(drop(rowRef));
    drag(handleRef);

    return (
        <Box
            ref={rowRef}
            sx={{
                alignItems: 'flex-start',
                borderBottom: '1px solid',
                borderColor: 'divider',
                display: 'flex',
                gap: 1,
                opacity: isDragging ? 0.5 : 1,
                p: 1,
            }}
        >
            <Box
                ref={handleRef}
                component="div"
                sx={{
                    alignItems: 'center',
                    cursor: 'grab',
                    display: 'flex',
                    mt: isEditing ? 0.5 : 1,
                }}
            >
                <DragHandleIcon />
            </Box>
            {isEditing ? (
                <Box
                    sx={{
                        display: 'flex',
                        flexDirection: 'column',
                        flexGrow: 1,
                        gap: 1,
                    }}
                >
                    <FormControl
                        size="small"
                        sx={{minWidth: 160}}
                        error={Boolean(typeError)}
                    >
                        <InputLabel>Link Type</InputLabel>
                        <Select
                            value={editType}
                            label="Link Type"
                            onChange={(e) =>
                                onEditTypeChange(
                                    e.target.value as CharacterLinkType | '',
                                )
                            }
                        >
                            <MenuItem
                                value=""
                                disabled
                            >
                                Select a type...
                            </MenuItem>
                            {ALLOWED_LINK_TYPES.map((t) => (
                                <MenuItem
                                    key={t}
                                    value={t}
                                >
                                    {LINK_TYPE_LABELS[t]}
                                </MenuItem>
                            ))}
                        </Select>
                        {typeError && (
                            <FormHelperText>{typeError}</FormHelperText>
                        )}
                    </FormControl>
                    <TextField
                        size="small"
                        label="URL"
                        value={editUrl}
                        onChange={(e) => onEditUrlChange(e.target.value)}
                        error={Boolean(urlError)}
                        helperText={
                            urlError ||
                            (editType ? LINK_TYPE_HINTS[editType] : '')
                        }
                        fullWidth
                    />
                    <TextField
                        size="small"
                        label="Label (optional)"
                        value={editLabel}
                        onChange={(e) => onEditLabelChange(e.target.value)}
                        fullWidth
                    />
                    <Box sx={{display: 'flex', gap: 1}}>
                        <Button
                            size="small"
                            variant="contained"
                            onClick={onSaveEdit}
                        >
                            Save
                        </Button>
                        <Button
                            size="small"
                            onClick={onCancelEdit}
                        >
                            Cancel
                        </Button>
                    </Box>
                </Box>
            ) : (
                <>
                    <Box
                        sx={{cursor: 'pointer', flexGrow: 1, minWidth: 0}}
                        onClick={() => onStartEdit(index)}
                    >
                        <Typography
                            variant="body2"
                            color="text.secondary"
                        >
                            {LINK_TYPE_LABELS[link.type]}
                            {link.label ? ` - ${link.label}` : ''}
                        </Typography>
                        <Typography
                            variant="body1"
                            sx={{
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                            }}
                        >
                            {link.url}
                        </Typography>
                    </Box>
                    <IconButton
                        size="small"
                        onClick={() => onStartEdit(index)}
                    >
                        <EditIcon fontSize="small" />
                    </IconButton>
                    <IconButton
                        size="small"
                        onClick={() => onDelete(index)}
                    >
                        <DeleteIcon fontSize="small" />
                    </IconButton>
                </>
            )}
        </Box>
    );
}

interface LinksDialogProps {
    open: boolean;
    onClose: () => void;
    links: CharacterLink[];
    onLinksChange: (links: CharacterLink[]) => void;
}

function LinksDialog({open, onClose, links, onLinksChange}: LinksDialogProps) {
    const [editingIndex, setEditingIndex] = useState<number | undefined>();
    const [isEditNew, setIsEditNew] = useState(false);
    const [editType, setEditType] = useState<CharacterLinkType | ''>('');
    const [editUrl, setEditUrl] = useState('');
    const [editLabel, setEditLabel] = useState('');
    const [typeError, setTypeError] = useState('');
    const [urlError, setUrlError] = useState('');

    const clearErrors = () => {
        setTypeError('');
        setUrlError('');
    };

    const trySaveCurrentEdit = (
        currentLinks: CharacterLink[],
    ): CharacterLink[] | undefined => {
        if (editingIndex === undefined) {
            return currentLinks;
        }
        if (!editType) {
            setTypeError('Please select a link type');
            return undefined;
        }
        const link: CharacterLink = {
            type: editType,
            url: editUrl,
            ...(editLabel ? {label: editLabel} : {}),
        };
        if (!validateCharacterLink(link)) {
            setUrlError(`Invalid URL. ${LINK_TYPE_HINTS[editType]}`);
            return undefined;
        }
        const updated = [...currentLinks];
        updated[editingIndex] = link;
        return updated;
    };

    const handleSaveEdit = () => {
        const updated = trySaveCurrentEdit(links);
        if (!updated) {
            return;
        }
        onLinksChange(updated);
        setEditingIndex(undefined);
        setIsEditNew(false);
        clearErrors();
    };

    const handleCancelEdit = () => {
        if (isEditNew && editingIndex !== undefined) {
            onLinksChange(links.filter((_, i) => i !== editingIndex));
        }
        setEditingIndex(undefined);
        setIsEditNew(false);
        setEditLabel('');
        clearErrors();
    };

    const handleStartEdit = (index: number) => {
        setEditingIndex(index);
        setEditType(links[index].type);
        setEditUrl(links[index].url);
        setEditLabel(links[index].label ?? '');
        setIsEditNew(false);
        clearErrors();
    };

    const handleAdd = () => {
        let baseLinks = links;
        if (editingIndex !== undefined) {
            const saved = trySaveCurrentEdit(links);
            if (!saved) {
                return;
            }
            baseLinks = saved;
            onLinksChange(baseLinks);
        }
        const newIndex = baseLinks.length;
        onLinksChange([...baseLinks, {type: ALLOWED_LINK_TYPES[0], url: ''}]);
        setEditingIndex(newIndex);
        setIsEditNew(true);
        setEditType('');
        setEditUrl('');
        setEditLabel('');
        clearErrors();
    };

    const handleDelete = (index: number) => {
        onLinksChange(links.filter((_, i) => i !== index));
        if (editingIndex === index) {
            setEditingIndex(undefined);
            setIsEditNew(false);
            clearErrors();
        } else if (editingIndex !== undefined && editingIndex > index) {
            setEditingIndex(editingIndex - 1);
        }
    };

    const handleDone = () => {
        const saved = trySaveCurrentEdit(links);
        if (!saved) {
            return;
        }
        if (editingIndex !== undefined) {
            onLinksChange(saved);
        }
        setEditingIndex(undefined);
        setIsEditNew(false);
        clearErrors();
        onClose();
    };

    const handleDialogClose = () => {
        if (isEditNew && editingIndex !== undefined) {
            onLinksChange(links.filter((_, i) => i !== editingIndex));
        }
        setEditingIndex(undefined);
        setIsEditNew(false);
        clearErrors();
        onClose();
    };

    const moveLink = (dragIndex: number, hoverIndex: number) => {
        const updated = [...links];
        const [dragged] = updated.splice(dragIndex, 1);
        updated.splice(hoverIndex, 0, dragged);
        onLinksChange(updated);
        if (editingIndex === dragIndex) {
            setEditingIndex(hoverIndex);
        } else if (editingIndex !== undefined) {
            if (editingIndex > dragIndex && editingIndex <= hoverIndex) {
                setEditingIndex(editingIndex - 1);
            } else if (editingIndex < dragIndex && editingIndex >= hoverIndex) {
                setEditingIndex(editingIndex + 1);
            }
        }
    };

    return (
        <Dialog
            open={open}
            onClose={handleDialogClose}
            maxWidth="sm"
            fullWidth
        >
            <DialogTitle>Manage Links</DialogTitle>
            <DialogContent sx={{p: 0}}>
                {links.length === 0 && (
                    <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{p: 2}}
                    >
                        No links added yet. Click "Add Link" to get started.
                    </Typography>
                )}
                {links.map((link, index) => (
                    <DraggableLinkItem
                        key={index}
                        link={link}
                        index={index}
                        moveLink={moveLink}
                        isEditing={editingIndex === index}
                        editType={editType}
                        typeError={typeError}
                        editUrl={editUrl}
                        urlError={urlError}
                        onStartEdit={handleStartEdit}
                        onDelete={handleDelete}
                        onSaveEdit={handleSaveEdit}
                        onCancelEdit={handleCancelEdit}
                        onEditTypeChange={setEditType}
                        onEditUrlChange={setEditUrl}
                        editLabel={editLabel}
                        onEditLabelChange={setEditLabel}
                    />
                ))}
            </DialogContent>
            <DialogActions sx={{justifyContent: 'space-between'}}>
                <Button
                    onClick={handleAdd}
                    variant="outlined"
                >
                    Add Link
                </Button>
                <Button
                    onClick={handleDone}
                    color="primary"
                    variant="contained"
                >
                    Done
                </Button>
            </DialogActions>
        </Dialog>
    );
}

export default LinksDialog;
