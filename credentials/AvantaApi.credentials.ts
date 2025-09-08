import type {
    IAuthenticateGeneric,
    ICredentialTestRequest,
    ICredentialType,
    INodeProperties,
} from 'n8n-workflow';

export class AvantaApi implements ICredentialType {
    name = 'avantaApi';

    displayName = 'Avanta API';

    documentationUrl = 'https://www.npmjs.com/package/n8n-nodes-avanta?activeTab=readme#api-reference';

    properties: INodeProperties[] = [
        {
            displayName: 'Host',
            name: 'host',
            type: 'string',
            default: '',
        },
        {
            displayName: 'Access Token',
            name: 'accessToken',
            type: 'string',
            typeOptions: { password: true },
            default: '',
        },
    ];

    test: ICredentialTestRequest = {
        request: {
            baseURL: '={{$credentials.host}}',
            url: '/V1/modules',
        },
    };

    authenticate: IAuthenticateGeneric = {
        type: 'generic',
        properties: {
            headers: {
                Authorization: '=Bearer {{$credentials.accessToken}}',
            },
        },
    };
}
