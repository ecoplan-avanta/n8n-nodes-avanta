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
		displayName: 'Company ID',
		name: 'company_id',
		type: 'number',
		displayOptions: {
			show: {
				resource: ['companySku'],
				operation: ['delete'],
			},
		},
		default: 0,
		required: true,
		description: 'The company ID to associate with the SKU deletion. Uses the first item\'s value. Supports <a href="https://docs.n8n.io/code/expressions/">n8n expressions</a> for dynamic input.',
	},
	{
		displayName: 'Company SKUs',
		name: 'companySkus',
		type: 'string',
		default: '',
		displayOptions: {
			show: {
				resource: ['companySku'],
				operation: ['delete'],
			},
		},
		description: 'Whitelist of company SKUs to remain active (e.g., SKU1,SKU2 or ["SKU1", "SKU2"] via <a href="https://docs.n8n.io/code/expressions/">n8n expressions</a>). All other SKUs for the company are deleted. Use comma-separated SKUs or a JSON array/single SKU. Leave empty to skip an item.',
	},
];

const displayOptions = {
	show: {
		resource: ['companySku'],
		operation: ['delete'],
	},
};

export const description = updateDisplayOptions(displayOptions, properties);

const restUrl = '/V1/proline-admin/catalog/product_list/delete_by_whitelist_company_sku';

export async function execute(this: IExecuteFunctions): Promise<INodeExecutionData[]> {
	const items = this.getInputData();
	const allCompanySkus: string[] = [];
	const returnData: INodeExecutionData[] = [];
	const companyId = this.getNodeParameter('company_id', 0) as number;

	for (let i = 0; i < items.length; i++) {
		try {
			const companySkusInput = this.getNodeParameter('companySkus', i) as string;
			let companySkus: string[] = [];
			if (companySkusInput.trim()) {
				try {
					const parsed = JSON.parse(companySkusInput);
					companySkus = Array.isArray(parsed) ? parsed : [parsed];
					if (!companySkus.every(sku => typeof sku === 'string')) {
						throw new NodeApiError(this.getNode(), { message: 'Company SKUs must be strings' });
					}
				} catch {
					companySkus = companySkusInput.split(',').map(sku => sku.trim()).filter(sku => sku);
				}
			}
			allCompanySkus.push(...companySkus);
		} catch (error) {
			if (this.continueOnFail()) {
				returnData.push(...prepareErrorData.call(this, error, i));
				continue;
			}
			throw new NodeApiError(this.getNode(), error);
		}
	}

	try {
		const requestData = { companyId: Math.floor(Number(companyId)), validCompanySkus: [...new Set(allCompanySkus)] };
		await createApiRequest.call(this, requestData, restUrl, false, 0);
		returnData.push({ json: { deleted: true } });
	} catch (error) {
		if (this.continueOnFail()) {
			returnData.push(...prepareErrorData.call(this, error, 0));
		} else {
			throw new NodeApiError(this.getNode(), error);
		}
	}

	return returnData;
}