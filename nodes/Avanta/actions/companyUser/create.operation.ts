import {
    IExecuteFunctions,
    INodeExecutionData,
    INodeProperties
} from 'n8n-workflow';

import {updateDisplayOptions} from '../../helpers/displayOptions';
import {formatExtensionAttributes, prepareErrorData} from "../../helpers/utils";
import {createApiRequest} from "../../transport";
import type {CompanyCustomer, CompanyCustomerLink, Customer} from "../../transport";

const properties: INodeProperties[] = [
    {
        displayName: 'Company Customer ID',
        name: 'company_customer_id',
        type: 'string',
        default: '',
        displayOptions: {
            show: {
                resource: ['companyUser'],
                operation: ['create'],
            },
        },
    },
    {
        displayName: 'Company Role External Name or ID',
        name: 'company_role_external_id',
        type: 'options',
        description:
            'Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code/expressions/">expression</a>',
        typeOptions: {
            loadOptionsMethod: 'getCompanyRolesExternalId',
        },
        default: '',
        displayOptions: {
            show: {
                resource: ['companyUser'],
                operation: ['create'],
            },
        },
    },
    {
        displayName: 'Email',
        name: 'email',
        type: 'string',
        placeholder: 'name@email.com',
        default: '',
        displayOptions: {
            show: {
                resource: ['companyUser'],
                operation: ['create'],
            },
        },
    },
    {
        displayName: 'Firstname',
        name: 'firstname',
        type: 'string',
        default: '',
        displayOptions: {
            show: {
                resource: ['companyUser'],
                operation: ['create'],
            },
        },
    },
    {
        displayName: 'Lastname',
        name: 'lastname',
        type: 'string',
        default: '',
        displayOptions: {
            show: {
                resource: ['companyUser'],
                operation: ['create'],
            },
        },
    },
    {
        displayName: 'Proline External Customer ID',
        name: 'proline_customer_id',
        type: 'string',
        default: '',
        displayOptions: {
            show: {
                resource: ['companyUser'],
                operation: ['create'],
            },
        },
    },
    {
        displayName: 'Additional Fields',
        name: 'additionalFields',
        type: 'collection',
        placeholder: 'Add Field',
        default: {},
        displayOptions: {
            show: {
                resource: ['companyUser'],
                operation: ['create'],
            },
        },
        options: [
            {
                displayName: 'Amazon ID',
                name: 'amazon_id',
                type: 'string',
                default: '',
            },
            {
                displayName: 'Confirmation',
                name: 'confirmation',
                type: 'string',
                default: '',
            },
            {
                displayName: 'Custom Attributes',
                name: 'customAttributes',
                type: 'fixedCollection',
                typeOptions: {
                    multipleValues: true,
                },
                default: {},
                placeholder: 'Add Custom Attribute',
                options: [
                    {
                        displayName: 'Custom Attribute',
                        name: 'customAttribute',
                        values: [
                            {
                                displayName: 'Attribute Code Name or ID',
                                name: 'attribute_code',
                                type: 'options',
                                description:
                                    'Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code/expressions/">expression</a>',
                                typeOptions: {
                                    loadOptionsMethod: 'getCustomAttributes',
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
                displayName: 'Date of Birth',
                name: 'dob',
                type: 'dateTime',
                default: '',
            },
            {
                displayName: 'Default Billing Address ID',
                name: 'default_billing',
                type: 'string',
                default: '',
            },
            {
                displayName: 'Default Shipping Address ID',
                name: 'default_shipping',
                type: 'string',
                default: '',
            },
            {
                displayName: 'Gender',
                name: 'gender',
                type: 'options',
                options: [
                    {
                        name: 'Male',
                        value: 1,
                    },
                    {
                        name: 'Female',
                        value: 2,
                    },
                    {
                        name: 'Not Specified',
                        value: 3,
                    },
                ],
                default: 1,
            },
            {
                displayName: 'Group Name or ID',
                name: 'group_id',
                type: 'options',
                description:
                    'Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code/expressions/">expression</a>',
                typeOptions: {
                    loadOptionsMethod: 'getGroups',
                },
                default: '',
            },
            {
                displayName: 'Is Subscribed',
                name: 'is_subscribed',
                type: 'boolean',
                default: false,
            },
            {
                displayName: 'Middle Name',
                name: 'middlename',
                type: 'string',
                default: '',
            },
            {
                displayName: 'Password',
                name: 'password',
                type: 'string',
                typeOptions: {password: true},
                default: '',
            },
            {
                displayName: 'Prefix',
                name: 'prefix',
                type: 'string',
                default: '',
            },
            {
                displayName: 'Store Name or ID',
                name: 'store_id',
                type: 'options',
                description:
                    'Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code/expressions/">expression</a>',
                typeOptions: {
                    loadOptionsMethod: 'getStores',
                },
                default: '',
            },
            {
                displayName: 'Suffix',
                name: 'suffix',
                type: 'string',
                default: '',
            },
            {
                displayName: 'Vertex Customer Code',
                name: 'vertex_customer_code',
                type: 'string',
                default: '',
            },
            {
                displayName: 'Vertex Customer Country',
                name: 'vertex_customer_country',
                type: 'string',
                default: '',
            },
            {
                displayName: 'Website Name or ID',
                name: 'website_id',
                type: 'options',
                description:
                    'Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code/expressions/">expression</a>',
                displayOptions: {
                    show: {
                        '/operation': ['create'],
                    },
                },
                typeOptions: {
                    loadOptionsMethod: 'getWebsites',
                },
                default: '',
            },
            {
                displayName: 'Sales Org',
                name: 'sales_org',
                type: 'string',
                default: '',
            },
        ]
    },
];

const displayOptions = {
    show: {
        resource: ['companyUser'],
        operation: ['create'],
    },
};

export const description = updateDisplayOptions(displayOptions, properties);

const restUrl = '/V1/proline-admin/company/saveUserAndCompanyUser';

export async function execute(
    this: IExecuteFunctions
): Promise<INodeExecutionData[]> {
    const bulk = this.getNodeParameter('bulk', 0) as boolean;
    const items = this.getInputData();
    const data = [];
    const returnData: INodeExecutionData[] = [];
    for (let i = 0; i < items.length; i++) {
        try {
            const company_customer_id = this.getNodeParameter('company_customer_id', i) as string;
            const company_role_external_id = this.getNodeParameter('company_role_external_id', i) as string;
            const email = this.getNodeParameter('email', i) as string;
            const firstname = this.getNodeParameter('firstname', i) as string;
            const lastname = this.getNodeParameter('lastname', i) as string;
            const proline_customer_id = this.getNodeParameter('proline_customer_id', i) as string;
            let additionalFields = this.getNodeParameter(
                'additionalFields',
                i,
            );

            additionalFields = formatExtensionAttributes.call(this, additionalFields);
            let companyUser = {} as CompanyCustomer;

            companyUser = {
                'user': {} as Customer,
                'company_customer_linkage': [] as CompanyCustomerLink[]
            }

            companyUser.company_customer_linkage.push({
                'company_customer_id': company_customer_id,
                'company_role_external_id': company_role_external_id
            } as CompanyCustomerLink);

            companyUser.user = {
                'email': email,
                'firstname': firstname,
                'lastname': lastname,
                'proline_customer_id': proline_customer_id
            }

            companyUser.user = {...companyUser.user, ...additionalFields};

            if (!bulk) {
                const executionData = await createApiRequest.call(this, companyUser, restUrl, false, i);
                returnData.push(...executionData);
            } else {
                data.push(companyUser);
            }
        } catch (error) {
            if (this.continueOnFail()) {
                returnData.push(...prepareErrorData.call(this, error, i));
                continue;
            }

            throw error;
        }
    }

    if (bulk) {
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
