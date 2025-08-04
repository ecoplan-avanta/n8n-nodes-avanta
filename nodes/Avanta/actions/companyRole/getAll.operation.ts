import type {
	IExecuteFunctions,
	INodeExecutionData,
	INodeProperties
} from 'n8n-workflow';

import {updateDisplayOptions} from '../../helpers/displayOptions';
import {getSearchFilters, executeGetAll} from "../../helpers/utils";

const properties: INodeProperties[] = [
	...getSearchFilters('companyRole')
];

const displayOptions = {
	show: {
		resource: ['companyRole'],
		operation: ['getAll'],
	},
};

const restUrl = '/V1/proline-admin/companyrole';

export const description = updateDisplayOptions(displayOptions, properties);

export async function execute(
	this: IExecuteFunctions
): Promise<INodeExecutionData[]> {
	return executeGetAll.call(this, restUrl);
}