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
        displayName: 'SKU',
        name: 'sku',
        type: 'string',
        default: '',
        required: true,
        displayOptions: {
            show: {
                resource: ['product'],
                operation: ['create'],
            },
        },
        description: 'Stock-keeping unit of the product',
    },
    {
        displayName: 'Name',
        name: 'name',
        type: 'string',
        required: true,
        displayOptions: {
            show: {
                resource: ['product'],
                operation: ['create'],
            },
        },
        default: '',
    },
    {
        displayName: 'Attribute Set Name or ID',
        name: 'attributeSetId',
        type: 'options',
        description:
            'Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code/expressions/">expression</a>',
        displayOptions: {
            show: {
                resource: ['product'],
                operation: ['create'],
            },
        },
        typeOptions: {
            loadOptionsMethod: 'getAttributeSets',
        },
        default: '',
    },
    {
        displayName: 'Price',
        name: 'price',
        type: 'number',
        displayOptions: {
            show: {
                resource: ['product'],
                operation: ['create'],
            },
        },
        default: 0,
    },
    {
        displayName: 'Additional Fields',
        name: 'additionalFields',
        type: 'collection',
        placeholder: 'Add Field',
        default: {},
        displayOptions: {
            show: {
                resource: ['product'],
                operation: ['create'],
            },
        },
        options: [...getProductOptionalFields()],
    }
];

const displayOptions = {
    show: {
        resource: ['product'],
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
                'proline_customer_id': proline_customer_id
            }

            if (firstname && firstname.trim() !== '') {
                companyUser.user.firstname = firstname;
            }

            if (lastname && lastname.trim() !== '') {
                companyUser.user.lastname = lastname;
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


function getProductOptionalFields(): INodeProperties[] {
    return [
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
													description: 'Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code/expressions/">expression</a>',
        					typeOptions: {
        						loadOptionsMethod: 'getProductAttributes',
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
        	displayName: 'Parent Category Name or ID',
        	name: 'category',
        	type: 'options',
									description: 'Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code/expressions/">expression</a>',
        	typeOptions: {
        		loadOptionsMethod: 'getCategories',
        	},
        	default: '',
        },
        {
            displayName: 'Status',
            name: 'status',
            type: 'options',
            options: [
                {
                    name: 'Enabled',
                    value: 1,
                },
                {
                    name: 'Disabled',
                    value: 2,
                },
            ],
            default: 1,
        },
        {
            displayName: 'Type Name or ID',
            name: 'type_id',
            type: 'options',
            description:
                'Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code/expressions/">expression</a>',
            typeOptions: {
                loadOptionsMethod: 'getProductTypes',
            },
            default: '',
        },
        {
            displayName: 'Visibility',
            name: 'visibility',
            type: 'options',
            options: [
                {
                    name: 'Not Visible',
                    value: 1,
                },
                {
                    name: 'Catalog',
                    value: 2,
                },
                {
                    name: 'Search',
                    value: 3,
                },
                {
                    name: 'Catalog & Search',
                    value: 4,
                },
            ],
            default: 4,
        },
        {
            displayName: 'Weight (LBS)',
            name: 'weight',
            type: 'number',
            default: 0,
        },
    ];
}
