import {
    IExecuteFunctions,
    INodeExecutionData,
    INodeProperties
} from 'n8n-workflow';

import {updateDisplayOptions} from '../../helpers/displayOptions';
import type {Company} from "../../transport";
import {formatExtensionAttributes, prepareErrorData} from "../../helpers/utils";
import {createApiRequest} from "../../transport";

const properties: INodeProperties[] = [
    {
        displayName: 'Customer ID',
        name: 'customer_id',
        type: 'string',
        required: true,
        default: '',
        displayOptions: {
            show: {
                resource: ['company'],
                operation: ['create'],
            },
        },
        description: 'Customer ID of the company',
    },
    {
        displayName: 'Name',
        name: 'name',
        type: 'string',
        required: true,
        default: '',
        displayOptions: {
            show: {
                resource: ['company'],
                operation: ['create'],
            },
        },
        description: 'Name of the company',
    },
    {
        displayName: 'Status',
        name: 'status',
        type: 'boolean',
        required: true,
        default: true,
        displayOptions: {
            show: {
                resource: ['company'],
                operation: ['create'],
            },
        }
    },
    {
        displayName: 'External Company Customer Group ID',
        name: 'external_company_customergroup_id',
        type: 'string',
        required: true,
        default: '',
        displayOptions: {
            show: {
                resource: ['company'],
                operation: ['create'],
            },
        }
    },
    {
        displayName: 'External SalesOrg ID',
        name: 'external_sales_org_id',
        type: 'string',
        required: true,
        default: '',
        displayOptions: {
            show: {
                resource: ['company'],
                operation: ['create'],
            },
        }
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
                displayName: 'Alias',
                name: 'alias',
                type: 'string',
                default: '',
            },
            {
                displayName: 'Duns',
                name: 'duns',
                type: 'string',
                default: '',
            },
            {
                displayName: 'Email',
                name: 'email',
                type: 'string',
                placeholder: 'name@email.com',
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
                displayName: 'Interim Account',
                name: 'interim_account',
                type: 'number',
                default: 1,
            },
            {
                displayName: 'Internet',
                name: 'internet',
                type: 'string',
                default: '',
            },
            {
                displayName: 'Logo',
                name: 'logo',
                type: 'string',
                default: '',
            },
            {
                displayName: 'Telephone',
                name: 'telephone',
                type: 'string',
                default: '',
            },
            {
                displayName: 'Vat ID',
                name: 'vat_id',
                type: 'string',
                default: '',
            },
            {
                displayName: 'Extension Attributes',
                name: 'extension_attributes',
                type: 'fixedCollection',
                typeOptions: {
                    multipleValues: true,
                },
                default: '',
                placeholder: 'Add Extension Attribute',
                options: [
                    {
                        displayName: 'Extension Attribute',
                        name: 'extension_attribute',
                        values: [
                            {
                                displayName: 'Extension Attribute',
                                name: 'attribute_code',
                                type: 'options',
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
        ]
    },
];

const displayOptions = {
    show: {
        resource: ['company'],
        operation: ['create'],
    },
};

const restUrl = '/V1/proline-admin/company';

export const description = updateDisplayOptions(displayOptions, properties);

export async function execute(
    this: IExecuteFunctions
): Promise<INodeExecutionData[]> {
    const bulk = this.getNodeParameter('bulk', 0) as boolean;
    const items = this.getInputData();
    const data = [];
    const returnData: INodeExecutionData[] = [];
    for (let i = 0; i < items.length; i++) {
        try {
            const name = this.getNodeParameter('name', i) as string;
            const customer_id = this.getNodeParameter('customer_id', i) as string;
            const status = this.getNodeParameter('status', i) as boolean ? 1 : 0;
            const external_company_customergroup_id = this.getNodeParameter('external_company_customergroup_id', i) as string;
            const external_sales_org_id = this.getNodeParameter('external_sales_org_id', i) as string;
            let additionalFields = this.getNodeParameter(
                'additionalFields',
                i,
            );

            additionalFields = formatExtensionAttributes.call(this, additionalFields);
            let company = {
                'company': {} as Company
            }
            company.company = {
                name: name,
                customer_id: customer_id,
                status: status
            };
            company.company = {...company.company, ...additionalFields};

            company.company.extension_attributes = {
                ...company.company.extension_attributes, ...{
                    'external_company_customergroup_id': external_company_customergroup_id,
                    'external_sales_org_id': external_sales_org_id
                }
            };

            if (!('group_id' in company.company)) {
                company.company.group_id = 1
            }

            if (!('company_role_id' in company.company)) {
                company.company.company_role_id = 1
            }

            if (!bulk) {
                const executionData = await createApiRequest.call(this, company, restUrl, false, i);
                returnData.push(...executionData);
            } else {
                data.push(company);
            }
        } catch (error) {
            if (this.continueOnFail()) {
                returnData.push(...prepareErrorData.call(this, error, i));
                continue;
            }

            throw error;
        }
    }
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
    return returnData;
}
