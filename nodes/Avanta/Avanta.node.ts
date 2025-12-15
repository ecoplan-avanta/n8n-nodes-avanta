import type {
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription
} from 'n8n-workflow';

import {router} from './actions/router';
import * as routerDescription from './actions/router';
import * as company from './actions/company';
import * as companyAddress from './actions/companyAddress';
import * as companyContact from './actions/companyContact';
import * as companyGroup from './actions/companyGroup';
import * as companyRestrict from './actions/companyRestrict';
import * as companyRole from './actions/companyRole';
import * as companyUser from './actions/companyUser';
import * as companySku from './actions/companySku';
import * as salesOrg from './actions/salesOrg';
import * as product from './actions/product';
import * as reports from './actions/reports';
import * as download from './actions/download';
import * as bom from './actions/bom';
import * as category from './actions/category';
import {loadOptions} from './methods';

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
		inputs: ['main'],
		outputs: ['main'],
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
				default: 'company',
				noDataExpression: true,
				// eslint-disable-next-line n8n-nodes-base/node-param-options-type-unsorted-items
				options: [
					{
						name: 'Company',
						value: 'company',
					},
					{
						name: 'Company - Address',
						value: 'companyAddress',
					},
					{
						name: 'Company - User',
						value: 'companyUser',
					},
					{
						name: 'Company - Contact',
						value: 'companyContact',
					},
					{
						name: 'Company - Group',
						value: 'companyGroup',
					},
					{
						name: 'Company - Role',
						value: 'companyRole',
					},
					{
						name: 'Company - Sku',
						value: 'companySku',
					},
					{
						name: 'Company - Restrict',
						value: 'companyRestrict',
					},
					{
						name: 'Sales Organization',
						value: 'salesOrg',
					},
					{
						name: 'Product',
						value: 'product',
					},
					{
						name: 'Category',
						value: 'category',
					},
					{
						name: 'Servicecenter - Order',
						value: 'orders',
					},
					{
						name: 'Servicecenter - Invoice',
						value: 'invoices',
					},
					{
						name: 'Servicecenter - Creditmemo',
						value: 'creditmemos',
					},
					{
						name: 'Servicecenter - Shipment',
						value: 'shipments',
					},
					{
						name: 'Servicecenter - Tracking',
						value: 'trackings',
					},
					{
						name: 'Servicecenter - Reshipment',
						value: 'reshipments',
					},
					{
						name: 'Servicecenter - Backorder',
						value: 'backorders',
					},
                    {
                        name: 'Download',
                        value: 'download',
                    },
                    {
                        name: 'BOM',
                        value: 'bom',
                    }
				]
			},
			...routerDescription.description,
			...company.description,
			...companyAddress.description,
            ...companyContact.description,
			...companyGroup.description,
			...companyRestrict.description,
			...companyRole.description,
			...companyUser.description,
			...companySku.description,
			...salesOrg.description,
			...product.description,
			...reports.description,
			            ...download.description,
			            ...bom.description
						, ...category.description
			        ],
	};

	methods = {
		loadOptions,
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		return await router.call(this);
	}
}
