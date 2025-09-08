import {
	IExecuteFunctions,
	INodeExecutionData,
	INodeProperties
} from 'n8n-workflow';
import { NodeApiError } from 'n8n-workflow';

import { updateDisplayOptions } from '../../helpers/displayOptions';
import { prepareErrorData } from '../../helpers/utils';
import { createApiRequest } from '../../transport';

const properties: INodeProperties[] = [
	{
		displayName: 'Customer ID',
		name: 'customer_id',
		type: 'string',
		required: true,
		default: '',
		displayOptions: {
			show: {
				resource: ['companyRestrict'],
				operation: ['delete'],
			},
		},
		description: 'The customer ID for which to delete restrictions',
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
				operation: ['delete'],
			},
		},
		description: 'The store group ID to identify the correct company',
	},
	{
		displayName: 'Product SKUs',
		name: 'product_skus',
		type: 'string',
		default: '',
		displayOptions: {
			show: {
				resource: ['companyRestrict'],
				operation: ['delete'],
			},
		},
		description: 'Product SKUs to remove restrictions for (e.g., SKU1,SKU2 or ["SKU1", "SKU2"] via <a href="https://docs.n8n.io/code/expressions/">n8n expressions</a>). Use comma-separated SKUs or a JSON array. Leave empty to remove all restrictions for the customer.',
	},
];

const displayOptions = {
	show: {
		resource: ['companyRestrict'],
		operation: ['delete'],
	},
};

export const description = updateDisplayOptions(displayOptions, properties);

const restUrl = '/V1/proline-admin/catalog/company_restrict/deletebyexternalid';

export async function execute(this: IExecuteFunctions): Promise<INodeExecutionData[]> {
	const items = this.getInputData();
	const returnData: INodeExecutionData[] = [];

	for (let i = 0; i < items.length; i++) {
		try {
			const customer_id = this.getNodeParameter('customer_id', i) as string;
			const store_group_id = this.getNodeParameter('store_group_id', i) as number;
			const product_skus_input = this.getNodeParameter('product_skus', i) as string;

			// Process product SKUs
			let product_skus: string[] = [];
			if (product_skus_input.trim()) {
				try {
					const parsed = JSON.parse(product_skus_input);
					product_skus = Array.isArray(parsed) ? parsed : [parsed];
					if (!product_skus.every(sku => typeof sku === 'string')) {
						throw new NodeApiError(this.getNode(), { message: 'Product SKUs must be strings' });
					}
				} catch {
					product_skus = product_skus_input.split(',').map(sku => sku.trim()).filter(sku => sku);
				}
			}

			const requestData = {
				customerId: customer_id,
				companyGroupId: store_group_id,
				productSkus: product_skus,
			};

			const executionData = await createApiRequest.call(this, requestData, restUrl, false, i);
			returnData.push(...executionData);

		} catch (error) {
			if (this.continueOnFail()) {
				returnData.push(...prepareErrorData.call(this, error, i));
				continue;
			}
			throw new NodeApiError(this.getNode(), error);
		}
	}

	return returnData;
}
