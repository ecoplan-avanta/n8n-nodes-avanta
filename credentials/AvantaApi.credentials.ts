import type {
    ICredentialType,
    IAuthenticateGeneric,
    ICredentialTestRequest,
    INodeProperties,
    Icon,
} from 'n8n-workflow';

export class AvantaApi implements ICredentialType {
    name = 'avantaApi';

    displayName = 'Avanta API';

    icon: Icon = 'file:../nodes/Avanta/avanta.svg';

    documentationUrl = 'https://github.com/ecoplan-avanta/n8n-nodes-avanta#configuration';

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
