import type {
    IExecuteFunctions,
    INodeExecutionData,
    INodeProperties,
} from 'n8n-workflow';

import {updateDisplayOptions} from '../../helpers/displayOptions';
import {prepareErrorData} from "../../helpers/utils";
import {createApiRequest} from "../../transport";

const properties: INodeProperties[] = [
    {
        displayName: 'Company Customer ID',
        name: 'company_customer_id',
        type: 'string',
        required: true,
        default: '',
        displayOptions: {
            show: {
                resource: ['companyRestrict'],
                operation: ['create'],
            },
        },
        description: 'The company customer ID for the restriction',
    },
    {
        displayName: 'Store Group ID',
        name: 'store_group_id',
        type: 'number',
        required: true,
        default: 1,
        displayOptions: {
            show: {
                resource: ['companyRestrict'],
                operation: ['create'],
            },
        },
        description: 'The store group ID to identify the correct company',
    },
    {
        displayName: 'Product SKU',
        name: 'sku',
        type: 'string',
        required: true,
        default: '',
        displayOptions: {
            show: {
                resource: ['companyRestrict'],
                operation: ['create'],
            },
        },
        description: 'The product SKU to restrict',
    },
    {
        displayName: 'Edit Lock',
        name: 'edit_lock',
        type: 'boolean',
        default: false,
        displayOptions: {
            show: {
                resource: ['companyRestrict'],
                operation: ['create'],
            },
        },
        description: 'Whether to lock editing of this restriction',
    },
];

const displayOptions = {
    show: {
        resource: ['companyRestrict'],
        operation: ['create'],
    },
};

export const description = updateDisplayOptions(displayOptions, properties);

const restUrl = '/V1/proline-admin/catalog/company_restrict';

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
            const store_group_id = this.getNodeParameter('store_group_id', i) as number;
            const sku = this.getNodeParameter('sku', i) as string;
            const edit_lock = this.getNodeParameter('edit_lock', i) as boolean;

            let companyRestrict = {
                'companyRestrict': {
                    'edit_lock': edit_lock,
                    'extension_attributes': {
                        'customer_id': company_customer_id,
                        'company_store_group': store_group_id,
                        'sku': sku
                    }
                }
            }

            if (!bulk) {
                console.log(companyRestrict);
                const executionData = await createApiRequest.call(this, companyRestrict, restUrl, false, i);
                returnData.push(...executionData);
            } else {
                data.push(companyRestrict);
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
