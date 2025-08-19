import {
    IExecuteFunctions,
    INodeExecutionData,
    INodeProperties
} from 'n8n-workflow';

import { updateDisplayOptions } from '../../helpers/displayOptions';
import type { SalesOrg } from '../../transport';
import { formatExtensionAttributes, prepareErrorData } from '../../helpers/utils';
import { createApiRequest } from '../../transport';

const properties: INodeProperties[] = [
    {
        displayName: 'Name',
        name: 'name',
        type: 'string',
        required: true,
        default: '',
        displayOptions: {
            show: {
                resource: ['salesOrg'],
                operation: ['create'],
            },
        },
        description: 'Name of the sales organization',
    },
    {
        displayName: 'Store Group Name or ID',
        name: 'group_id',
        type: 'options',
        description:
            'Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code/expressions/">expression</a>',
        typeOptions: {
            loadOptionsMethod: 'getStoreGroups',
        },
        displayOptions: {
            show: {
                resource: ['salesOrg'],
                operation: ['create'],
            },
        },
        default: '',
    },
    {
        displayName: 'External ID',
        name: 'external_id',
        type: 'string',
        default: '',
        displayOptions: {
            show: {
                resource: ['salesOrg'],
                operation: ['create'],
            },
        },
        description: 'External ID of the sales organization',
    },
    {
        displayName: 'Status',
        name: 'status',
        type: 'boolean',
        default: true,
        displayOptions: {
            show: {
                resource: ['salesOrg'],
                operation: ['create'],
            },
        },
        description: 'Whether the sales organization is active',
    },
    {
        displayName: 'Additional Fields',
        name: 'additionalFields',
        type: 'collection',
        placeholder: 'Add Field',
        default: {},
        displayOptions: {
            show: {
                resource: ['salesOrg'],
                operation: ['create'],
            },
        },
        options: [
            {
                displayName: 'Agreement Identifier',
                name: 'agreement_identifier',
                type: 'string',
                default: '',
                description: 'Identifier for the agreement',
            },
            {
                displayName: 'Agreement IDs',
                name: 'agreement_ids',
                type: 'fixedCollection',
                typeOptions: {
                    multipleValues: true,
                },
                default: {},
                options: [
                    {
                        displayName: 'Agreement ID',
                        name: 'agreement_id',
                        values: [
                            {
                                displayName: 'Agreement ID',
                                name: 'agreement_id',
                                type: 'string',
                                default: '',
                                description: 'ID of the agreement',
                            },
                        ],
                    },
                ],
                description: 'List of agreement IDs',
            },
            {
                displayName: 'Alias',
                name: 'alias',
                type: 'string',
                default: '',
                description: 'Alias of the sales organization',
            },
            {
                displayName: 'Business Hours',
                name: 'business_hours',
                type: 'string',
                default: '',
                description: 'Business hours of the sales organization',
            },
            {
                displayName: 'CEO',
                name: 'ceo',
                type: 'string',
                default: '',
                description: 'Name of the CEO',
            },
            {
                displayName: 'City',
                name: 'city',
                type: 'string',
                default: '',
                description: 'City of the sales organization',
            },
            {
                displayName: 'Company',
                name: 'company',
                type: 'string',
                default: '',
                description: 'Company name',
            },
            {
                displayName: 'Country ID',
                name: 'country_id',
                type: 'string',
                default: '',
                description: 'Country ID (e.g., DE, US)',
            },
            {
                displayName: 'Email',
                name: 'email',
                type: 'string',
                placeholder: 'name@email.com',
                default: '',
                description: 'Email address',
            },
            {
                displayName: 'Extension Attributes',
                name: 'extension_attributes',
                type: 'fixedCollection',
                typeOptions: {
                    multipleValues: true,
                },
                default: {},
                placeholder: 'Add Extension Attribute',
                options: [
                    {
                        displayName: 'Extension Attribute',
                        name: 'extension_attribute',
                        values: [
                            {
                                displayName: 'Extension Attribute Name or ID',
                                name: 'attribute_code',
                                type: 'options',
                                description: 'Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code/expressions/">expression</a>',
                                typeOptions: {
                                    loadOptionsMethod: 'getExtensionAttributes',
                                },
                                default: '',
                            },
                            {
                                displayName: 'Value',
                                name: 'value',
                                type: 'string',
                                default: '',
                            },
                        ],
                    },
                ],
            },
            {
                displayName: 'External Config',
                name: 'external_config',
                type: 'string',
                default: '',
                description: 'External configuration data',
            },
            {
                displayName: 'Extra Content',
                name: 'extra_content',
                type: 'string',
                default: '',
                description: 'Additional content',
            },
            {
                displayName: 'Fax',
                name: 'fax',
                type: 'string',
                default: '',
                description: 'Fax number',
            },
            {
                displayName: 'Postcode',
                name: 'postcode',
                type: 'string',
                default: '',
                description: 'Postal code',
            },
            {
                displayName: 'Registration Court',
                name: 'registration_court',
                type: 'string',
                default: '',
            },
            {
                displayName: 'Registration Number',
                name: 'registration_nr',
                type: 'string',
                default: '',
            },
            {
                displayName: 'Street',
                name: 'street',
                type: 'string',
                default: '',
                description: 'Street address',
            },
            {
                displayName: 'Tax VAT ID',
                name: 'tax_vat_id',
                type: 'string',
                default: '',
                description: 'VAT ID for tax purposes',
            },
            {
                displayName: 'Telephone',
                name: 'telephone',
                type: 'string',
                default: '',
                description: 'Telephone number',
            },
        ],
    },
];

const displayOptions = {
    show: {
        resource: ['salesOrg'],
        operation: ['create'],
    },
};

export const description = updateDisplayOptions(displayOptions, properties);

const restUrl = '/V1/proline-admin/salesorg';

export async function execute(this: IExecuteFunctions): Promise<INodeExecutionData[]> {
    const bulk = this.getNodeParameter('bulk', 0) as boolean;
    const items = this.getInputData();
    const data: { salesOrg: SalesOrg }[] = [];
    const returnData: INodeExecutionData[] = [];

    for (let i = 0; i < items.length; i++) {
        try {
            const name = this.getNodeParameter('name', i) as string;
            const group_id = this.getNodeParameter('group_id', i) as string;
            const external_id = this.getNodeParameter('external_id', i) as string;
            const status = this.getNodeParameter('status', i) as boolean;
            const additionalFields = formatExtensionAttributes.call(this, this.getNodeParameter('additionalFields', i));

            const salesOrg = {
                salesOrg: {
                    name,
                    group_id: group_id ? parseInt(group_id, 10) : undefined,
                    external_id: external_id || undefined,
                    status: status ? 1 : 0,
                    agreement_ids: additionalFields.agreement_ids?.agreement_id?.map((item: { agreement_id: string }) => item.agreement_id) || [],
                    ...additionalFields,
                } as SalesOrg
            };

            if (!bulk) {
                const executionData = await createApiRequest.call(this, salesOrg, restUrl, false, i);
                returnData.push(...executionData);
            } else {
                data.push(salesOrg);
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
            const executionData = await createApiRequest.call(this, data, restUrl);
            returnData.push(...executionData);
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
