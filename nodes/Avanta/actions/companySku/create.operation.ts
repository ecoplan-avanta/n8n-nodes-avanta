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
                resource: ['companySku'],
                operation: ['create'],
            },
        },
    },
    {
        displayName: 'Company Store Group Name or ID',
        name: 'company_group_id',
        type: 'options',
        required: true,
        description:
            'Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code/expressions/">expression</a>',
        typeOptions: {
            loadOptionsMethod: 'getStoreGroups',
        },
        displayOptions: {
            show: {
                resource: ['companySku'],
                operation: ['create'],
            },
        },
        default: '',
    },
    {
        displayName: 'Company SKU',
        name: 'company_sku',
        type: 'string',
        default: '',
        required: true,
        displayOptions: {
            show: {
                resource: ['companySku'],
                operation: ['create'],
            },
        },
    },
    {
        displayName: 'Product SKU',
        name: 'sku',
        type: 'string',
        required: true,
        default: '',
        displayOptions: {
            show: {
                resource: ['companySku'],
                operation: ['create'],
            },
        },
    },
];

const displayOptions = {
    show: {
        resource: ['companySku'],
        operation: ['create'],
    },
};

export const description = updateDisplayOptions(displayOptions, properties);

const restUrl = '/V1/proline-admin/catalog/product_list/createbycustomeridandproductsku';

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
            const company_sku = this.getNodeParameter('company_sku', i) as string;
            const sku = this.getNodeParameter('sku', i) as string;

            let companyProductList = {
                'companyCustomerId': company_customer_id,
                'companyGroupId': company_group_id,
                'companySku': company_sku,
                'productSku': sku,
            }

            if (!bulk) {
                const executionData = await createApiRequest.call(this, companyProductList, restUrl, false, i);
                returnData.push(...executionData);
            } else {
                data.push(companyProductList);
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
