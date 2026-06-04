interface PlcDirectoryResult {
    '@context': string[];
    id: string;
    alsoKnownAs: string[];
    verificationMethod: VerificationMethod[];
    service: Service[];
}

interface VerificationMethod {
    id: string;
    type: string;
    controller: string;
    publicKeyMultibase: string;
}

interface Service {
    id: string;
    type: string;
    serviceEndpoint: string;
}

const findPds = (data: PlcDirectoryResult): string | undefined =>
    data.service.find((s) => s.type === 'AtprotoPersonalDataServer')
        ?.serviceEndpoint;

export const getPds = async (did: string): Promise<string | undefined> => {
    if (did.startsWith('did:web:')) {
        const hostname = did.slice('did:web:'.length);
        try {
            const response = await fetch(
                `https://${hostname}/.well-known/did.json`,
            );
            const data = (await response.json()) as PlcDirectoryResult;
            const pds = findPds(data);
            if (pds) {
                return pds;
            }
        } catch {
            // CORS or network failure - no universal fallback for did:web
        }
        return undefined;
    }

    try {
        const response = await fetch(`https://plc.directory/${did}`);
        const data = (await response.json()) as PlcDirectoryResult;
        return findPds(data);
    } catch {
        return undefined;
    }
};
