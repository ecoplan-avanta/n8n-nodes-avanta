import type {
	IDataObject,
	IExecuteFunctions,
	INodeExecutionData,
	INodeProperties
} from 'n8n-workflow';
import { NodeApiError } from 'n8n-workflow';

import {updateDisplayOptions} from '../../helpers/displayOptions';
import {getSearchFilters, validateJSON} from "../../helpers/utils";
import {magentoApiRequest, magentoApiRequestAllItems} from "../../transport";
import type {Search} from "../../transport";

const properties: INodeProperties[] = [
	{
		displayName: 'Return All',
		name: 'returnAll',
		type: 'boolean',
		displayOptions: {
			show: {
				resource: ['company'],
				operation: ['getAll'],
			},
		},
		default: false,
		description: 'Whether to return all results or only up to a given limit',
	},
	{
		displayName: 'Limit',
		name: 'limit',
		type: 'number',
		displayOptions: {
			show: {
				resource: ['company'],
				operation: ['getAll'],
				returnAll: [false],
			},
		},
		typeOptions: {
			minValue: 1,
			maxValue: 10,
		},
		default: 5,
		description: 'Max number of results to return',
	},
	...getSearchFilters('company', 'getSystemAttributes', 'getSystemAttributes'),
];

const displayOptions = {
	show: {
		resource: ['company'],
		operation: ['getAll'],
	},
};

export const description = updateDisplayOptions(displayOptions, properties);

export async function execute(
	this: IExecuteFunctions
): Promise<INodeExecutionData[]> {

	let responseData;
	const returnData: INodeExecutionData[] = [];
	for (let i = 0; i < this.getInputData().length; i++) {
		//https://magento.redoc.ly/2.3.7-admin/tag/customerssearch
		const filterType = this.getNodeParameter('filterType', i) as string;
		const sortOption = this.getNodeParameter('options.sort', i, {}) as {
			sort: [{ direction: string; field: string }];
		};
		const returnAll = this.getNodeParameter('returnAll', 0);
		let qs: Search = {};

		if (filterType === 'json') {
			const filterJson = this.getNodeParameter('filterJson', i) as string;
			if (validateJSON(filterJson) !== undefined) {
				qs = JSON.parse(filterJson);
			} else {
				throw new NodeApiError(this.getNode(), {
					message: 'Filter (JSON) must be a valid json',
				});
			}
		} else {
			qs = {
				search_criteria: {},
			};

			if (Object.keys(sortOption).length !== 0) {
				qs.search_criteria = {
					sort_orders: sortOption.sort,
				};
			}
		}

		if (returnAll) {
			qs.search_criteria!.page_size = 1000;
			responseData = await magentoApiRequestAllItems.call(
				this,
				'items',
				'GET',
				'/V1/proline-admin/companies',
				{},
				qs as unknown as IDataObject,
			);
		} else {
			const limit = this.getNodeParameter('limit', 0);
			qs.search_criteria!.page_size = limit;
			responseData = await magentoApiRequest.call(
				this,
				'GET',
				'/V1/proline-admin/companies',
				{},
				qs as unknown as IDataObject,
			);
			responseData = responseData.items;
		}
		console.log(responseData);
		const executionData = this.helpers.constructExecutionMetaData(
			this.helpers.returnJsonArray(responseData as IDataObject[]),
			{ itemData: { item: i } },
		);
		returnData.push(...executionData);
	}

	console.log(returnData);

	return returnData;
}
