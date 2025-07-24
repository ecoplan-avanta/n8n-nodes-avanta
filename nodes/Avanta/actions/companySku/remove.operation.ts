import {
	IDataObject,
	IExecuteFunctions,
	INodeExecutionData,
	INodeProperties
} from 'n8n-workflow';

import { updateDisplayOptions } from '../../helpers/displayOptions';
import { prepareErrorData } from '../../helpers/utils';
import { magentoApiRequest } from '../../transport';

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
	},
	{
		displayName: 'Valid Company SKUs',
		name: 'validCompanySkus',
		type: 'string',
		typeOptions: {
			multipleValues: true,
		},
		displayOptions: {
			show: {
				resource: ['companySku'],
				operation: ['delete'],
			},
		},
		default: [],
		required: true,
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

export async function execute(
	this: IExecuteFunctions
): Promise<INodeExecutionData[]> {
	const returnData: INodeExecutionData[] = [];

	for (let i = 0; i < this.getInputData().length; i++) {
		const company_id = this.getNodeParameter('company_id', i) as number;
		const validCompanySkus = this.getNodeParameter('validCompanySkus', i) as string[];

		const body = {
			company_id,
			validCompanySkus,
		};

		try {
			const responseData = await magentoApiRequest.call(this, 'POST', restUrl, body);
			const executionData = this.helpers.constructExecutionMetaData(
				this.helpers.returnJsonArray(responseData as IDataObject[]),
				{ itemData: { item: i } },
			);
			returnData.push(...executionData);
		} catch (error) {
			if (this.continueOnFail()) {
				returnData.push(...prepareErrorData.call(this, error, i));
			} else {
				throw error;
			}
		}
	}

	return returnData;
}
