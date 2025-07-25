import {
    IExecuteFunctions,
    INodeExecutionData,
    INodeProperties
} from 'n8n-workflow';

import {updateDisplayOptions} from "../../helpers/displayOptions";
import {prepareErrorData} from "../../helpers/utils";
import {createApiRequest} from "../../transport";
import type {CompanyContact} from "../../transport";


const properties: INodeProperties[] = [
    {
        displayName: 'Firstname',
        name: 'firstname',
        type: 'string',
        required: true,
        default: '',
        displayOptions: {
            show: {
                resource: ['companyContact'],
                operation: ['create'],
            },
        },
        description: 'Firstname of the contact',
    },
    {
        displayName: 'Lastname',
        name: 'lastname',
        type: 'string',
        required: true,
        default: '',
        displayOptions: {
            show: {
                resource: ['companyContact'],
                operation: ['create'],
            },
        },
        description: 'Lastname of the contact',
    },
    {
        displayName: 'Email',
        name: 'email',
        type: 'string',
        placeholder: 'name@email.com',
        required: true,
        default: '',
        displayOptions: {
            show: {
                resource: ['companyContact'],
                operation: ['create'],
            },
        },
        description: 'Email of the contact',
    },
    {
        displayName: 'Additional Fields',
        name: 'additionalFields',
        type: 'collection',
        placeholder: 'Add Field',
        default: {},
        displayOptions: {
            show: {
                resource: ['company'],
                operation: ['create'],
            },
        },
        options: [
            {
                displayName: 'Telephone',
                name: 'telephone',
                type: 'string',
                default: '',
            },
            {
                displayName: 'Mobile',
                name: 'mobile',
                type: 'string',
                default: '',
            },
            {
                displayName: 'Fax',
                name: 'fax',
                type: 'string',
                default: '',
            },
            {
                displayName: 'Skype',
                name: 'skype',
                type: 'string',
                default: '',
            },
            {
                displayName: 'Photo',
                name: 'photo',
                type: 'string',
                placeholder: 'contact/1/image.png',
                default: '',
            },
            {
                displayName: 'Job title',
                name: 'job_title',
                type: 'string',
                default: '',
            },
            {
                displayName: 'Contact person',
                name: 'contact_person',
                type: 'number',
                default: null,
            },
            {
                displayName: 'External id',
                name: 'external_id',
                type: 'string',
                default: '',
            },
            {
                displayName: 'Store Group ID',
                name: 'group_id',
                type: 'options',
                description:
                    'Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code/expressions/">expression</a>',
                typeOptions: {
                    loadOptionsMethod: 'getStoreGroups',
                },
                default: '',
            },
            {
                displayName: 'Sort order',
                name: 'sort_order',
                type: 'string',
                default: '',
            },
        ]
    },
];

const displayOptions = {
    show: {
        resource: ['companyContact'],
        operation: ['create'],
    },
};

export const description = updateDisplayOptions(displayOptions, properties);

const restUrl = '/V1/proline-admin/contact';

export async function execute(
    this: IExecuteFunctions
): Promise<INodeExecutionData[]> {
    const bulk = this.getNodeParameter('bulk', 0) as boolean;
    const items = this.getInputData();
    const data = [];
    const returnData: INodeExecutionData[] = [];
    for (let i = 0; i < items.length; i++) {
        try {
            const firstname = this.getNodeParameter('firstname', i) as string;
            const lastname = this.getNodeParameter('lastname', i) as string;
            const email = this.getNodeParameter('email', i) as string;

            let companyContact = {
                'contact': {} as CompanyContact
            };
            companyContact.contact = {
                firstname: firstname,
                lastname: lastname,
                email: email
            }

            if (!bulk) {
                const executionData = await createApiRequest.call(this, companyContact, restUrl, false, i);
                returnData.push(...executionData);
            } else {
                data.push(companyContact);
            }
        } catch (error) {
            if (this.continueOnFail()) {
                returnData.push(...prepareErrorData.call(this, error, i));
                continue;
            }

            throw error;
        }
    }

    if (bulk && data.length > 0) {
        try {
            const exceutionData = await createApiRequest.call(this, data, restUrl);
            returnData.push(...exceutionData);
        } catch (error) {
            if (this.continueOnFail()) {
                returnData.push(...prepareErrorData.call(this, error, 0));
            } else {
                throw error;
            }
        }
    }

    return returnData;
}
