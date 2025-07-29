import type {
	IExecuteFunctions,
	INodeExecutionData,
	INodeProperties
} from 'n8n-workflow';

import {updateDisplayOptions} from '../../helpers/displayOptions';
import {getSearchFilters, executeGetAll} from "../../helpers/utils";

const properties: INodeProperties[] = [
	...getSearchFilters('product')
];

const displayOptions = {
	show: {
		resource: ['product'],
		operation: ['getAll'],
	},
};

const restUrl = '/V1/products';

export const description = updateDisplayOptions(displayOptions, properties);

export async function execute(
	this: IExecuteFunctions
): Promise<INodeExecutionData[]> {
	return executeGetAll.call(this, restUrl);
}