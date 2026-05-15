import React, {useCallback, useEffect, useState} from 'react';
import {useAuthContext} from '../../../auth/auth-provider';
import {PDS_COLLECTION_NS} from '../../../const';
import Layout from '../../../layouts/Dashboard';
import {
    Button,
    Container,
    ListItem,
    ListItemText,
    Typography,
} from '@mui/material';
import {Link} from 'react-router';
import {DndProvider, useDrag, useDrop} from 'react-dnd';
import {HTML5Backend} from 'react-dnd-html5-backend';

const ITEM_TYPE = 'CHARACTER';

function DraggableCharacterItem({
    record,
    index,
    moveCharacter,
}: {
    record: any;
    index: number;
    moveCharacter: (dragIndex: number, hoverIndex: number) => void;
}) {
    const ref = React.useRef<HTMLDivElement>(null);

    const [, drop] = useDrop({
        accept: ITEM_TYPE,
        hover(item: {index: number}) {
            if (!ref.current) {
                return;
            }
            const dragIndex = item.index;
            const hoverIndex = index;
            if (dragIndex === hoverIndex) {
                return;
            }
            moveCharacter(dragIndex, hoverIndex);
            item.index = hoverIndex;
        },
    });

    const [{isDragging}, drag] = useDrag({
        collect: (monitor) => ({isDragging: monitor.isDragging()}),
        item: {index},
        type: ITEM_TYPE,
    });

    drag(drop(ref));

    return (
        <div
            ref={ref}
            style={{cursor: 'grab', opacity: isDragging ? 0.5 : 1}}
        >
            <Link
                to={`/dashboard/characters/edit/${record.uri.split('/').pop()}`}
                style={{color: 'inherit', textDecoration: 'none'}}
            >
                <ListItem
                    component={Button}
                    variant="outlined"
                >
                    <ListItemText
                        primary={record.value.character.name}
                        secondary={`${record.uri.split('/').pop()}`}
                    />
                </ListItem>
            </Link>
        </div>
    );
}

function sortByDisplayIndex(records: any[]): any[] {
    return [...records].sort((a, b) => {
        const ai = a.value?.character?.displayIndex;
        const bi = b.value?.character?.displayIndex;
        if (ai === undefined && bi === undefined) {
            return 0;
        }
        if (ai === undefined) {
            return 1;
        }
        if (bi === undefined) {
            return -1;
        }
        return ai - bi;
    });
}

export function Characters() {
    const {pdsAgent} = useAuthContext();
    const [orderedRecords, setOrderedRecords] = useState<any[] | undefined>();
    const [saving, setSaving] = useState(false);
    const [orderModified, setOrderModified] = useState(false);

    const loadSonaRecords = useCallback(async () => {
        const result = await pdsAgent.com.atproto.repo.listRecords({
            collection: PDS_COLLECTION_NS,
            repo: pdsAgent.accountDid,
        });
        setOrderedRecords(sortByDisplayIndex(result.data.records));
    }, [pdsAgent]);

    useEffect(() => {
        void loadSonaRecords();
    }, [pdsAgent]);

    const moveCharacter = useCallback(
        (dragIndex: number, hoverIndex: number) => {
            setOrderedRecords((prev) => {
                if (!prev) {
                    return prev;
                }
                const updated = [...prev];
                const [dragged] = updated.splice(dragIndex, 1);
                updated.splice(hoverIndex, 0, dragged);
                return updated;
            });
            setOrderModified(true);
        },
        [],
    );

    const saveOrder = async () => {
        if (!orderedRecords) {
            return;
        }
        setSaving(true);
        try {
            await Promise.all(
                orderedRecords.map((record, index) => {
                    const rkey = record.uri.split('/').pop();
                    return pdsAgent.com.atproto.repo.putRecord({
                        collection: PDS_COLLECTION_NS,
                        record: {
                            $type: PDS_COLLECTION_NS,
                            character: {
                                ...record.value.character,
                                displayIndex: index,
                            },
                            createdAt: record.value.createdAt,
                            modifiedAt: new Date().toISOString(),
                        },
                        repo: pdsAgent.assertDid,
                        rkey,
                        validate: false,
                    });
                }),
            );
            setOrderModified(false);
        } catch (error) {
            console.error('Failed to save character order', error);
        } finally {
            setSaving(false);
        }
    };

    return (
        <Layout>
            <Container maxWidth="lg">
                <Typography
                    variant="h4"
                    gutterBottom
                >
                    Characters
                </Typography>
                <Typography
                    variant="caption"
                    gutterBottom
                >
                    (Drag to reorder)
                </Typography>
                <div style={{marginBottom: '1rem'}} />
                {orderedRecords !== undefined && (
                    <>
                        {orderModified && (
                            <Button
                                variant="contained"
                                onClick={saveOrder}
                                disabled={saving}
                                sx={{mb: 2}}
                            >
                                {saving ? 'Saving...' : 'Save Order'}
                            </Button>
                        )}
                        {orderedRecords.length === 0 && (
                            <Typography variant="body1">
                                No characters found
                            </Typography>
                        )}
                        <DndProvider backend={HTML5Backend}>
                            {orderedRecords.map((record: any, idx: number) => (
                                <DraggableCharacterItem
                                    key={record.uri}
                                    record={record}
                                    index={idx}
                                    moveCharacter={moveCharacter}
                                />
                            ))}
                        </DndProvider>
                    </>
                )}
            </Container>
        </Layout>
    );
}
