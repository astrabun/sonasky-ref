type PlcDirectoryResult = {
  "@context": string[]
  id: string
  alsoKnownAs: string[]
  verificationMethod: VerificationMethod[]
  service: Service[]
}

type VerificationMethod = {
  id: string
  type: string
  controller: string
  publicKeyMultibase: string
}

type Service = {
  id: string
  type: string
  serviceEndpoint: string
}

export const getPds = async (did: string) => {
    try {
        const url = `https://plc.directory/${did}`
        const response = await fetch(url);
        const data = await response.json() as PlcDirectoryResult;
        const pds = data.service[0].serviceEndpoint;
        return pds;
    } catch {
        return undefined;
    }
}
