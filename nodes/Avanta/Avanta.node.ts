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
import * as companyUser from './actions/companyUser';
import * as salesOrg from './actions/salesOrg';
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
						name: 'CompanyUser',
						value: 'companyUser',
					},
					{
						name: 'SalesOrg',
						value: 'salesOrg',
					},
				],
				default: 'company',
			},
			...routerDescription.description,
			...company.description,
			...companyAddress.description,
			...companyUser.description,
			...salesOrg.description
		],
	};

	methods = {
		loadOptions,
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		return await router.call(this);
	}
}
