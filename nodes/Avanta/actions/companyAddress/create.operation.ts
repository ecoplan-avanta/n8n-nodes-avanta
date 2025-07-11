import type {
    IExecuteFunctions,
    INodeExecutionData,
    INodeProperties,
} from 'n8n-workflow';

import {updateDisplayOptions} from '../../helpers/displayOptions';
import {formatExtensionAttributes, prepareErrorData} from "../../helpers/utils";
import {createApiRequest} from "../../transport";
import type {Address} from "../../transport";

const properties: INodeProperties[] = [
    {
        displayName: 'Company Customer ID',
        name: 'company_customer_id',
        type: 'string',
        default: '',
        displayOptions: {
            show: {
                resource: ['companyAddress'],
                operation: ['create'],
            },
        },
    },
    {
        displayName: 'Company Store Group ID',
        name: 'company_group_id',
        type: 'options',
        description:
            'Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code/expressions/">expression</a>',
        typeOptions: {
            loadOptionsMethod: 'getStoreGroups',
        },
        displayOptions: {
            show: {
                resource: ['companyAddress'],
                operation: ['create'],
            },
        },
        default: '',
    },
    {
        displayName: 'External Address ID',
        name: 'external_address_id',
        type: 'string',
        default: '',
    },
    {
        displayName: 'Additional Fields',
        name: 'additionalFields',
        type: 'collection',
        placeholder: 'Add Field',
        default: {},
        displayOptions: {
            show: {
                resource: ['companyAddress'],
                operation: ['create'],
            },
        },
        options: [
            {
                displayName: 'Address Type',
                name: 'address_type',
                type: 'options',
                options: [
                    {
                        name: 'Billing',
                        value: 1,
                    },
                    {
                        name: 'Shipping',
                        value: 2,
                    }
                ],
                default: 1
            },
            {
                displayName: 'City',
                name: 'city',
                type: 'string',
                default: '',
            },
            {
                displayName: 'Company',
                name: 'company',
                type: 'string',
                default: '',
            },
            {
                displayName: 'Country Name or ID',
                name: 'country_id',
                type: 'options',
                description:
                    'Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code/expressions/">expression</a>',
                typeOptions: {
                    loadOptionsMethod: 'getCountries',
                },
                default: '',
            },
            {
                displayName: 'Default',
                name: 'is_default',
                type: 'options',
                options: [
                    {
                        name: 'Nein',
                        value: 0,
                    },
                    {
                        name: 'Ja',
                        value: 1,
                    }
                ],
                default: 0,
            },
            {
                displayName: 'Read Only',
                name: 'read_only',
                type: 'options',
                options: [
                    {
                        name: 'Nein',
                        value: 0,
                    },
                    {
                        name: 'Ja',
                        value: 1,
                    }
                ],
                default: 0,
            },
            {
                displayName: 'Postcode',
                name: 'postcode',
                type: 'string',
                default: '',
            },
            {
                displayName: 'Region',
                name: 'region_id',
                type: 'string',
                default: '',
            },
            {
                displayName: 'Street',
                name: 'street',
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
        resource: ['companyAddress'],
        operation: ['create'],
    },
};

export const description = updateDisplayOptions(displayOptions, properties);

const restUrl = '/V1/proline-admin/companyaddresscustomerid';

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
            const company_group_id = this.getNodeParameter('company_group_id', i) as string;
            const external_address_id = this.getNodeParameter('external_address_id', i) as string;
            let additionalFields = this.getNodeParameter(
                'additionalFields',
                i,
            );

            additionalFields = formatExtensionAttributes.call(this, additionalFields);
            let companyAddress = {
                'address': {} as Address,
                'companyCustomerId': company_customer_id,
                'companyGroupId': company_group_id
            }
            companyAddress.address = {
                'external_address_id': external_address_id,
                'address_type': 1
            };
            companyAddress.address = {...companyAddress.address, ...additionalFields};

            if (additionalFields.street) {
                companyAddress.address.street = [additionalFields.street as string];
            } else {
                companyAddress.address.street = [];
            }

            if (!bulk) {
                const executionData = await createApiRequest.call(this, companyAddress, restUrl, false, i);
                returnData.push(...executionData);
            } else {
                data.push(companyAddress);
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
