import React, {useEffect, useRef, useState} from 'react';
import {useNavigate} from 'react-router';
import Layout from '../../layouts/Home';
import {
    Autocomplete,
    type AutocompleteInputChangeReason,
    Avatar,
    Box,
    Button,
    Container,
    InputAdornment,
    TextField,
    Typography,
} from '@mui/material';
import {AtpAgent, type AppBskyActorDefs} from '@atproto/api';

const publicAgent = new AtpAgent({service: 'https://public.api.bsky.app'});

const SEARCH_DEBOUNCE_MS = 300;
const SEARCH_RESULT_LIMIT = 8;

function Home() {
    const [handle, setHandle] = useState('');
    const [options, setOptions] = useState<AppBskyActorDefs.ProfileViewBasic[]>(
        [],
    );
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);
    const abortRef = useRef<AbortController>(undefined);

    useEffect(
        () => () => {
            clearTimeout(debounceRef.current);
            abortRef.current?.abort();
        },
        [],
    );

    const searchHandles = (query: string) => {
        clearTimeout(debounceRef.current);
        abortRef.current?.abort();

        const q = query.trim();
        if (!q) {
            setOptions([]);
            setLoading(false);
            return;
        }

        debounceRef.current = setTimeout(() => {
            const controller = new AbortController();
            abortRef.current = controller;
            setLoading(true);
            publicAgent.app.bsky.actor
                .searchActorsTypeahead(
                    {limit: SEARCH_RESULT_LIMIT, q},
                    {signal: controller.signal},
                )
                .then(({data}) => {
                    setOptions(data.actors);
                })
                .catch((error: unknown) => {
                    if (
                        !(error instanceof DOMException && error.name === 'AbortError')
                    ) {
                        setOptions([]);
                    }
                })
                .finally(() => {
                    if (abortRef.current === controller) {
                        setLoading(false);
                    }
                });
        }, SEARCH_DEBOUNCE_MS);
    };

    const handleInputChange = (
        _event: React.SyntheticEvent,
        value: string,
        reason: AutocompleteInputChangeReason,
    ) => {
        setHandle(value);
        if (reason === 'input') {
            searchHandles(value);
        } else {
            clearTimeout(debounceRef.current);
            setOptions([]);
        }
    };

    const navigateToHandle = (value: string) => {
        const finalHandle =
            value.startsWith('did:plc:') || value.includes('.')
                ? value
                : `${value}.bsky.social`;
        void navigate(`/profile/${finalHandle}`);
    };

    const handleSubmit = (
        event:
            | React.FormEvent<HTMLFormElement>
            | React.MouseEvent<HTMLButtonElement>,
    ) => {
        event.preventDefault();
        navigateToHandle(handle);
    };

    return (
        <Layout>
            <Container maxWidth="sm">
                <Box
                    display="flex"
                    flexDirection="column"
                    alignItems="center"
                    justifyContent="center"
                >
                    <Box
                        display="flex"
                        alignItems="center"
                        width="100%"
                    >
                        <form
                            onSubmit={handleSubmit}
                            style={{display: 'flex', width: '100%'}}
                            autoComplete="off"
                        >
                            <Autocomplete
                                freeSolo
                                fullWidth
                                filterOptions={(x) => x}
                                options={options}
                                loading={loading}
                                inputValue={handle}
                                onInputChange={handleInputChange}
                                isOptionEqualToValue={(option, value) =>
                                    option.did === value.did
                                }
                                getOptionLabel={(option) =>
                                    typeof option === 'string'
                                        ? option
                                        : option.handle
                                }
                                onChange={(_event, value) => {
                                    if (value && typeof value !== 'string') {
                                        navigateToHandle(value.handle);
                                    }
                                }}
                                renderOption={(props, option) => {
                                    const {key, ...rest} = props as typeof props & {
                                        key: string;
                                    };
                                    return (
                                        <Box
                                            component="li"
                                            key={key}
                                            {...rest}
                                            display="flex"
                                            alignItems="center"
                                            gap={1}
                                        >
                                            <Avatar
                                                src={option.avatar}
                                                sx={{height: 28, width: 28}}
                                            />
                                            <Box>
                                                <Typography variant="body2">
                                                    {option.displayName ||
                                                        option.handle}
                                                </Typography>
                                                <Typography
                                                    variant="caption"
                                                    color="textSecondary"
                                                    display="block"
                                                >
                                                    @{option.handle}
                                                </Typography>
                                            </Box>
                                        </Box>
                                    );
                                }}
                                renderInput={(params) => (
                                    <TextField
                                        {...params}
                                        label="Bluesky Handle"
                                        variant="outlined"
                                        placeholder="some-username-here"
                                        margin="normal"
                                        autoComplete="off"
                                        slotProps={{
                                            htmlInput: {
                                                ...params.inputProps,
                                                'data-1p-ignore': true,
                                                'data-bwignore': true,
                                                'data-form-type': 'other',
                                                'data-lpignore': true,
                                                'data-protonpass-ignore': true,
                                            },
                                            input: {
                                                ...params.InputProps,
                                                endAdornment: (
                                                    <>
                                                        {!(
                                                            handle.startsWith(
                                                                'did:plc:',
                                                            ) || handle.includes('.')
                                                        ) && (
                                                            <InputAdornment position="end">
                                                                <Typography
                                                                    variant="body2"
                                                                    color="textSecondary"
                                                                >
                                                                    .bsky.social
                                                                </Typography>
                                                            </InputAdornment>
                                                        )}
                                                        {params.InputProps.endAdornment}
                                                    </>
                                                ),
                                            },
                                        }}
                                    />
                                )}
                            />
                            <Button
                                variant="contained"
                                color="primary"
                                onClick={handleSubmit}
                                style={{marginLeft: '10px'}}
                            >
                                View
                            </Button>
                        </form>
                    </Box>
                    <Typography
                        variant="body2"
                        gutterBottom
                    >
                        Enter a Bluesky handle to view the user's
                        character(s)/info.
                    </Typography>
                </Box>
            </Container>
        </Layout>
    );
}

export default Home;
