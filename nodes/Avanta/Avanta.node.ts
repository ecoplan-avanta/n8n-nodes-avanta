import type {
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription
} from 'n8n-workflow';
import {
	NodeConnectionType
} from 'n8n-workflow';

import {router} from './actions/router';
import * as routerDescription from './actions/router';
import * as company from './actions/company';
import * as companyAddress from './actions/companyAddress';
import * as companyContact from './actions/companyContact';
import * as companyUser from './actions/companyUser';
import * as companySku from './actions/companySku';
import * as salesOrg from './actions/salesOrg';
import * as product from './actions/product';
import {loadOptions} from './methods';

//import {companyAddressFields, companyAddressOperations} from "./descriptions/CompanyAddressesDescription";
export class Avanta implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'avanta',
		name: 'avanta',
		icon: 'file:avanta.svg',
		group: ['input'],
		version: 1,
		subtitle: '={{$parameter["operation"] + ": " + $parameter["resource"]}}',
		description: 'Consume avanta API',
		defaults: {
			name: 'avanta',
		},
		usableAsTool: true,
		inputs: [NodeConnectionType.Main],
		outputs: [NodeConnectionType.Main],
		credentials: [
			{
				name: 'avantaApi',
				required: true,
			},
		],
		properties: [
			{
				displayName: 'Resource',
				name: 'resource',
				type: 'options',
				noDataExpression: true,
				options: [
					{
						name: 'Company',
						value: 'company',
					},
					{
						name: 'CompanyAddress',
						value: 'companyAddress',
					},
                    {
                        name: 'CompanyContact',
                        value: 'companyContact',
                    },
					{
						name: 'CompanyUser',
						value: 'companyUser',
					},
					{
						name: 'CompanySku',
						value: 'companySku',
					},
					{
						name: 'SalesOrg',
						value: 'salesOrg',
					},
					{
						name: 'Product',
						value: 'product',
					}
				],
				default: 'company',
			},
			...routerDescription.description,
			...company.description,
			...companyAddress.description,
            ...companyContact.description,
            ...companyUser.description,
			...companySku.description,
			...salesOrg.description,
			...product.description
		],
	};

	methods = {
		loadOptions,
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		return await router.call(this);
	}
}
