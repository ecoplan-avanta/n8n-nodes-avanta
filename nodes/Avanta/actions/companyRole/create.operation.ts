import {
    IExecuteFunctions,
    INodeExecutionData,
    INodeProperties
} from 'n8n-workflow';

import { updateDisplayOptions } from '../../helpers/displayOptions';
import type {CompanyRole, CompanyRule} from '../../transport';
import { prepareErrorData} from '../../helpers/utils';
import { createApiRequest } from '../../transport';

const properties: INodeProperties[] = [
    {
        displayName: 'Company Customer ID',
        name: 'customer_id',
        type: 'string',
        required: true,
        default: '',
        displayOptions: {
            show: {
                resource: ['companyRole'],
                operation: ['create'],
            },
        },
        description: 'Customer ID of the company',
    },
    {
        displayName: 'Store Group ID',
        name: 'store_group_id',
        type: 'number',
        required: true,
        default: '',
        displayOptions: {
            show: {
                resource: ['companyRole'],
                operation: ['create'],
            },
        },
        description: 'Store Group ID of the company',
    },
    {
        displayName: 'Is System',
        name: 'is_system',
        type: 'boolean',
        default: false,
        required: true,
        displayOptions: {
            show: {
                resource: ['companyRole'],
                operation: ['create'],
            },
        },
        description: 'Whether the company role is a system role',
    },
    {
        displayName: 'External Parent ID',
        name: 'external_parent_id',
        type: 'string',
        required: true,
        default: '',
        displayOptions: {
            show: {
                resource: ['companyRole'],
                operation: ['create'],
            },
        },
        description: 'External ID of the parent company role',
    },
    {
        displayName: 'Role Name',
        name: 'role_name',
        type: 'string',
        required: true,
        default: '',
        displayOptions: {
            show: {
                resource: ['companyRole'],
                operation: ['create'],
            },
        },
        description: 'Name of the company role',
    },
    {
        displayName: 'External ID',
        name: 'external_id',
        type: 'string',
        default: '',
        displayOptions: {
            show: {
                resource: ['companyRole'],
                operation: ['create'],
            },
        },
        description: 'External ID of the company role',
    },
    {
        displayName: 'Role Type',
        name: 'role_type',
        type: 'options',
        required: true,
        options: [
            {
                name: 'Company',
                value: 'company',
            },
            {
                name: 'User',
                value: 'user',
            },
            {
                name: 'Sales',
                value: 'sales',
            },
        ],
        default: 'company',
        displayOptions: {
            show: {
                resource: ['companyRole'],
                operation: ['create'],
            },
        },
        description: 'Type of the company role',
    },
    {
        displayName: 'Company Rules Type',
        name: 'company_rules_type',
        type: 'options',
        noDataExpression: true,
        displayOptions: {
            show: {
                resource: ['companyRole'],
                operation: ['create']
            },
        },
        options: [
            {
                name: 'None',
                value: 'none',
                description: 'Add no resources',
                action: 'Add no resources',
            },
            {
                name: 'Fields Below',
                value: 'mapping',
                description: 'Add resources using fields below',
                action: 'Use fields below to add resources',
            },
            {
                name: 'JSON',
                value: 'json',
                description: 'Use JSON to dynamically add resources',
                action: 'Use raw JSON to add resources',
            },
        ],
        default: 'none',
    },
    {
        displayName: 'Company Rules',
        name: 'company_rules',
        type: 'fixedCollection',
        typeOptions: { multipleValues: true },
        default: {},
        displayOptions: { hide: { company_rules_type: ['json','none'] }, show: {resource: ['companyRole'], operation: ['create'] } },
        options: [
            {
                name: 'resource',
                displayName: 'Resource',
                values: [
                    {
                        displayName: 'Resource ID',
                        name: 'resource_id',
                        type: 'string',
                        required: true,
                        default: '',
                    },
                    {
                        displayName: 'Permission',
                        name: 'permission',
                        type: 'options',
                        required: true,
                        options: [
                            {
                                name: 'Deny',
                                value: 'deny',
                            },
                            {
                                name: 'Allow',
                                value: 'allow',
                            }
                        ],
                        default: 'deny',
                        description: 'Permission of the Resource',
                    }
                ],
            },
        ],
    },
    {
        displayName: 'Company Rules JSON',
        name: 'company_rules_json',
        type: 'json',
        displayOptions: {
            hide: {
                company_rules_type: ['mapping','none']
            },
            show: {
                resource: ['companyRole'],
                operation: ['create'],
            }
        },
        description: 'Add resources via raw JSON',
        default: '[]',
    },
];

const displayOptions = {
    show: {
        resource: ['companyRole'],
        operation: ['create'],
    },
};

export const description = updateDisplayOptions(displayOptions, properties);

const restUrl = '/V1/proline-admin/companyrole';

export async function execute(this: IExecuteFunctions): Promise<INodeExecutionData[]> {
    const bulk = this.getNodeParameter('bulk', 0) as boolean;
    const items = this.getInputData();
    const data: { companyRole: CompanyRole }[] = [];
    const returnData: INodeExecutionData[] = [];

    for (let i = 0; i < items.length; i++) {
        try {
            const customer_id = this.getNodeParameter('customer_id', i) as string;
            const store_group_id = this.getNodeParameter('store_group_id', i) as string;
            const is_system = this.getNodeParameter('is_system', i) as boolean;
            const external_parent_id = this.getNodeParameter('external_parent_id', i) as string;
            const role_name = this.getNodeParameter('role_name', i) as string;
            const external_id = this.getNodeParameter('external_id', i) as string;
            const role_type = this.getNodeParameter('role_type', i) as string;

            const companyRole = {
                companyRole: {
                    customer_id,
                    store_group_id: store_group_id ? parseInt(store_group_id, 10) : undefined,
                    is_system: is_system ? 1 : 0,
                    external_parent_id,
                    role_name,
                    external_id: external_id || undefined,
                    role_type: role_type || undefined,
                    company_rules: []
                } as CompanyRole
            };

            if (this.getNodeParameter('company_rules_type', i) == 'json') {
                const rulesJson = this.getNodeParameter('company_rules_json', i) as string;
                companyRole.companyRole.company_rules = JSON.parse(rulesJson) as Array<CompanyRule>;
            } else if (this.getNodeParameter('company_rules_type', i) == 'mapping') {

                const rulesCollection = this.getNodeParameter('company_rules', i) as { resource?: Array<CompanyRule> };
                const rulesArray = rulesCollection?.resource ?? [];

                if (rulesArray.length > 0) {
                    companyRole.companyRole.company_rules = rulesArray;
                }
            }

            if (!bulk) {
                const executionData = await createApiRequest.call(this, companyRole, restUrl, false, i);
                returnData.push(...executionData);
            } else {
                data.push(companyRole);
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
